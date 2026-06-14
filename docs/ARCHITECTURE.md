# SpeakType — System Architecture

This document outlines the architecture, data flows, and security design of **SpeakType**.

---

## 1. High-Level Tech Stack

SpeakType is built as a high-performance, type-safe **TypeScript monorepo** managed with `pnpm`.

```
                        ┌──────────────────────────────┐
                        │      Chrome Extension        │
                        │   (WXT + Vue 3 + Pinia)      │
                        └──────────────┬───────────────┘
                                       │
                                       │ Bearer JWT (Secure HTTP Calls)
                                       ▼
                        ┌──────────────────────────────┐
                        │        Nuxt Backend          │
                        │      (Nuxt 4 + Nitro)        │
                        └──────────────┬───────────────┘
                                       │
            ┌──────────────────────────┼──────────────────────────┐
            ▼                          ▼                          ▼
┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐
│  Neon Postgres DB    │   │  Upstash Redis Cache │   │  STT & AI Services   │
│    (Drizzle ORM)     │   │ (Quota/Rate Limiting)│   │ (Groq / Google AI)   │
└──────────────────────┘   └──────────────────────┘   └──────────────────────┘
```

### Components:
* **Frontend Extension (`apps/extension`):** Built on the [WXT framework](https://wxt.dev/) with **Vue 3**, **Pinia** for state management, and compiled using **Vite**. Targeting Chrome/Brave (Manifest V3).
* **Backend Server (`apps/backend`):** A lightweight server using **Nuxt 4 + Nitro**, designed to run stateless and scale horizontally (edge-compatible).
* **Shared Workspace (`packages/shared`):** Contains Zod schemas, constants, and API type definitions shared between extension and backend.
* **Database & Caching:** **Neon Serverless Postgres** as the primary storage managed via **Drizzle ORM**. **Upstash Redis** for high-performance quota tracking and rate limiting.
* **Transcription & AI:** Fast, low-latency Speech-to-Text via **Groq Whisper** and AI post-processing/tone cleanup via **Google Gemini** (free tiers).

---

## 2. Extension ↔ Backend Boundary (API Contract)

The single source of truth for the API contract is the Zod schemas located in `packages/shared/schemas.ts`. Payload validation happens server-side immediately upon entry.

### Auth Endpoints (BetterAuth, Bearer JWT only)
* `POST /auth/register` — Create user account.
* `POST /auth/login` — Sign in and receive bearer JWT + refresh token.
* `POST /auth/logout` — Expire and revoke session.
* `POST /auth/refresh` — Rotate refresh token (revoking the old one).
* `GET /auth/me` — Retrieve active user session.

### Settings Endpoints (Authenticated)
* `GET /settings` | `PUT /settings`
  * **Payload:** `{ language: string, preferredModel: string, autoCleanup: boolean, requireConfirmation: boolean }`

### Usage & Quota Endpoints (Authenticated)
* `GET /usage` | `GET /usage/history` — Historical transcription logs.
* `GET /usage/quota` — Check remaining seconds and current subscription tier before recording.
  * **Response:** `{ secondsUsed: number, remainingSeconds: number, plan: string }`

### Audio Processing Endpoints (Authenticated)
* `POST /v1/audio` — Multipart audio upload (WebM/Opus) with optional target transcription language.
  * **Response:** `{ transcript: string, provider: string, durationSeconds: number, requestId: string }`
* `POST /v1/cleanup` — Clean and format transcript.
  * **Payload:** `{ transcript: string, websiteContext: string, cleanupMode: 'professional' | 'casual' }`
  * **Response:** `{ cleanedText: string }`

---

## 3. The Audio Path

SpeakType optimizes latency and cost by caching quotas and processing audio entirely server-side.

```
 [User Trigger]                                     [Backend]
       │
       ▼
 1. useQuota check ──(Redis Quota Checked)──────────► [Is user over quota?]
       │                                                     │
       ├───[Over Quota]──► Stop and display Warning          │
       ▼                                                     ▼
 2. Recording begins (useRecorder)                      [Allowed]
       │
       ▼
 3. Client captures & compresses audio (Opus/WebM)
       │
       ▼
 4. POST /v1/audio (with Bearer JWT) ────────────────► 5. Audio validation
       │                                                 (MIME & size checks)
       │                                                     │
       │                                                     ▼
       │                                               6. SttGateway
       │                                               (Groq Whisper STT)
       │                                                     │
       │                                                     ▼
       │                                               7. Deletes audio blob
       │                                               (Logged to audit_logs)
       │                                                     │
       ▼                                                     ▼
 8. Optional: POST /v1/cleanup ──────────────────────► 9. CleanupService
    (Includes website context)                        (Gemini AI formatter)
       │                                                     │
       ▼                                                     ▼
10. Insert Text at Cursor ◄───────────────────────────11. Returns processed text
    (Synthetic input event for Ctrl+Z safety)
```

### Steps:
1. **Quota Pre-Check:** Before a recording can even start, the extension requests remaining quota seconds via `/usage/quota`. This route reads from **Upstash Redis** cache to prevent unnecessary database hits and database load. If the user is out of quota, recording is blocked.
2. **Audio Capture:** The extension's `useRecorder` composable triggers the browser's `getUserMedia` API and compresses the audio stream into a highly compressed `Opus/WebM` format locally.
3. **Upload & Verification:** The compressed audio is sent via `POST /v1/audio`. The backend verifies the file size and MIME type to block malicious uploads.
4. **Transcription:** The backend routes the file to the `SttGateway` which defaults to **Groq Whisper** (fast and free). In the event of a failure, it transparently falls back to a secondary provider and logs the failure to `provider_failures`.
5. **Immediate File Cleanup:** For privacy and performance, **the audio file is deleted immediately** after the transcription completes. The deletion is recorded in the `audit_logs` database table.
6. **AI Post-Processing (Optional):** If `autoCleanup` is enabled, the client sends the text along with evaluated website context (e.g., whether the user is typing on Slack or Gmail) to `POST /v1/cleanup`. The **Google Gemini** service formats, corrects grammar, and matches the tone of the target platform (casual for Slack, professional for Gmail).
7. **Insertion:** The extension receives the text and inserts it at the cursor position. To prevent page reflows or broken undo chains, it uses `Range`/`setRangeText` combined with a **single synthetic `input` event** to guarantee that `Ctrl+Z` reverses the insertion cleanly in one step.

---

## 4. Authentication Flow

BetterAuth is configured for state-free token authentication.

* **No Cookies / No CSRF:** Since this extension needs to run across varying contexts, SpeakType uses standard **Bearer JWT** authorization headers for all protected routes, bypassing cookie-based cross-site vulnerabilities.
* **Token Storage:** The JWT is stored securely in the Extension's synced storage (`chrome.storage.local`).
* **Refresh-Token Rotation:** On access token expiry, the client hits `/auth/refresh` with a refresh token. The backend issues a brand-new pair of access and refresh tokens, immediately revoking the old refresh token (`refresh_tokens.revoked` marked true). If a revoked token is ever presented, the backend raises an alarm and terminates all active sessions for that user.

---

## 5. Security & Performance Principles

### Security Hardening:
* **No Remote Code:** The extension operates with a strict Content Security Policy (CSP). Remote scripts or stylesheets are completely prohibited.
* **Server-Side Secrets:** Third-party credentials (Groq keys, Gemini keys, database connections) are kept strictly server-side on the backend. The extension never communicates with external transcription or LLM hosts directly.
* **CORS Lockdown:** Backend CORS policies restrict requests exclusively to the official SpeakType dashboard origin and the specific Chrome Extension ID scheme (`chrome-extension://<id>`).
* **Rate Limiting:** Protects the endpoints from brute-force audio or auth floods using Redis-based rate limiters (e.g., 100 requests/hour for free tiers).

### Performance Optimization:
* **Style Isolation:** The extension's microphone icon is injected into the DOM within a **Shadow DOM**. This ensures that host page stylesheets never bleed in to distort the mic icon, and extension styles never cause reflows on host sites.
* **Mutation Observer Discipline:** A single global `MutationObserver` handles focusing and blurring editable fields. Listeners are aggressively debounced to avoid browser lag, and orphaned icons are cleaned up immediately on field blur or deletion.
* **Stateless Backend:** The backend maintains no local session state, allowing instances to boot instantly and scale horizontally on edge platforms.
