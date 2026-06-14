# SpeakType Public Build Roadmap

Welcome to the **SpeakType** roadmap! We are building a powerful, privacy-first, context-aware speech-to-text dictation browser extension and backend.

To keep our building process public and invite early feedback, here is our sequenced launch plan. Every phase is designed to run entirely on **free tier services** (Neon Postgres, Upstash Redis, Groq Whisper, and Google Gemini).

---

## Roadmap at a Glance

| Phase | Goal | Status | Target Timeline |
|---|---|---|---|
| **1. Foundation** | Setup monorepo skeleton, database structure, auth, and API contract | ◐ In Progress | Q2 2026 |
| **2. Extension MVP** | Focus detection, mic icon inject, recording, and keyboard shortcuts | ☒ Planned | Q2 2026 |
| **3. Backend Core** | BetterAuth, settings backend, Groq STT & Gemini post-processing | ☒ Planned | Q3 2026 |
| **4. Billing Prep** | DB tables and service seams ready for future monetization | ☒ Planned | Q3 2026 |
| **5. Security Hardening** | Token rotation, CORS, Redis rate limits, and audio file deletion | ☒ Planned | Q3 2026 |
| **6. Testing & E2E** | Vitest suite, real-site injection tests, and full path validation | ☒ Planned | Q4 2026 |

*Status Legend:* `☐ Planned` · `◐ In Progress` · `☑ Done`

---

## Detailed Phases

### 🛠️ Phase 1 — Foundation (In Progress)
Build the foundational structure of the pnpm monorepo.
* [x] Draft architectural specifications, stack choices, and api contracts (`memory/`).
* [x] Design visual language and microphone icon behavior (`DESIGN.md`).
* [x] Set up MIT open-source licensing and contributing documents.
* [ ] Scaffold `@speaktype/extension` (WXT + Vue 3).
* [ ] Scaffold `@speaktype/backend` (Nuxt 4 + Nitro).
* [ ] Create shared package `@speaktype/shared` with Zod schemas and constants.
* [ ] Set up Drizzle ORM schema mappings and initial database migrations.
* [ ] Integrate BetterAuth initial token schemas.

### 🎙️ Phase 2 — Extension MVP (Planned)
Implement field detection and the main microphone capturing UI.
* [ ] Detect focused text elements (`input`, `textarea`, `contenteditable`) on major platforms like Gmail, Slack, ChatGPT, Notion, and LinkedIn.
* [ ] Inject the microphone icon within a style-isolated Shadow DOM.
* [ ] Animate the microphone button per design specs: `idle` ➔ `hover` ◄➔ `recording` ◄➔ `uploading`.
* [ ] Build `useRecorder` and compress captured audio to WebM/Opus client-side.
* [ ] Build `useQuota` to read cached quotas from the backend before allowing recording.
* [ ] Implement global keyboard shortcut triggers (`Alt+Shift+W` on Windows, `Ctrl+Shift+W` on Mac) via Chrome `commands` API.
* [ ] Create extension popup login and settings page.

### ⚙️ Phase 3 — Backend Core (Planned)
Complete the server-side logic for authentication, speech-to-text, and AI formatting.
* [ ] Deploy BetterAuth registration, login, logout, and token refresh endpoints.
* [ ] Create `/settings` and `/usage` (history, quotas) endpoints.
* [ ] Build `SttGateway` connecting to **Groq Whisper** with secondary failover logic.
* [ ] Deploy `CleanupService` leveraging **Google Gemini** with site-context prompts.
* [ ] Establish stateless middleware chain: `CORS` ➔ `Auth` ➔ `Rate Limit` ➔ `Quota` ➔ `Handler`.

### 💳 Phase 4 — Billing Prep (Planned)
Prepare database structures for monetization without writing live SDK hooks.
* [ ] Establish subscription database schemas (`subscriptions`, `webhook_events`, `quota_events`).
* [ ] Define abstract `BillingService` interface and default no-op mock implementations.
* [ ] Create stubbed routes for `/billing/portal`, `/billing/checkout`, and `/webhooks/stripe`.

### 🔒 Phase 5 — Security Hardening (Planned)
Address privacy constraints on audio handling and secure backend traffic.
* [ ] Implement bearer JWT rotation (revoking older refresh tokens upon request).
* [ ] Secure CORS lists to only allow the extension and official dashboards.
* [ ] Apply Redis rate limits per client.
* [ ] Ensure audio uploads are verified (size + MIME type) and immediately deleted after transcription (logged in `audit_logs`).
* [ ] Enforce strict CSP (no remote code) in the extension.

### 🧪 Phase 6 — Testing & Quality (Planned)
Validate the reliability of the application end-to-end.
* [ ] Set up unit testing using Vitest for shared Zod schemas and services.
* [ ] Run automated extension injection checks on target websites.
* [ ] Confirm cursor insertion and single-step undo history (Ctrl+Z) work reliably.
* [ ] Verify failure path robustness (offline fallback buffering, mic permissions denied).

---

## 🔮 Future / V2 Backlog
* Real-time streaming transcription (WebSockets).
* Multi-language translation dashboards.
* Collaborative workspace / team quota pools.
* Multi-browser support (Firefox, Safari).

---

If you'd like to help us build any of these features, please check our [Contributing Guide](CONTRIBUTING.md) and peek at our [Issue Board](https://github.com/asadeisa/SpeakType/issues)!
