# API Contract

Source of truth = Zod schemas in `packages/shared`. The extension and backend both import
from there — never hand-redefine a payload. This file is the human-readable mirror.

## Auth (BetterAuth, bearer JWT)
```
POST /auth/login | /auth/register | /auth/logout | /auth/refresh
GET  /auth/me
```
`/auth/refresh` rotates the refresh token (old one revoked).

## Settings
```
GET /settings ; PUT /settings
{ language, preferredModel, autoCleanup, requireConfirmation }
```

## Usage
```
GET /usage ; /usage/history ; /usage/quota
/usage/quota → { secondsUsed, remainingSeconds, plan }   // shown BEFORE recording
```

## Audio (MVP)
```
POST /v1/audio   // audio blob (multipart/base64) + optional language
→ { transcript, provider, durationSeconds, requestId }
```
Gateway: try Groq → secondary on fail → 502 + log `provider_failures`. No retry queue.

## Cleanup
```
POST /v1/cleanup
{ transcript, websiteContext, cleanupMode } → { cleanedText }
```
`websiteContext` is re-evaluated from the focused element at record-start.

## Billing (deferred — stubs only)
```
GET /billing/portal ; POST /billing/checkout ; POST /webhooks/stripe
```

## Auth/guard order on protected routes
CORS allowlist → JWT auth → Redis rate-limit → quota → handler → usage log.

## DB tables (Drizzle, UUID PKs except BetterAuth)
`users, subscriptions, settings, usage_logs, refresh_tokens, audit_logs,
provider_failures (passive), quota_events, webhook_events (unique stripe_event_id)`.
