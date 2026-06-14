# Security & Performance

This is a sequential, high-demand, voice-handling product. Treat both as first-class.

## Security
- **Bearer JWT everywhere** (extension + dashboard); no cookies, no CSRF needed.
- **Refresh-token rotation** — `refresh_tokens.revoked`; old token invalid after refresh.
- **CORS allowlist** = dashboard origin + `chrome-extension://<id>` only.
- **Rate limiting** via Redis — free: 100 req/hr, pro: 1000 req/hr.
- **Audio deleted immediately after processing**; deletion logged in `audit_logs`;
  encrypt any temp-stored audio at rest.
- **Validate uploads** (size + mime) before processing.
- **Zod-validate every request body** (schemas from `@speaktype/shared`).
- **Keys server-side only** — the extension never holds Groq/Gemini/DB keys; it only calls our backend.
- **Extension**: strict CSP, no remote code, minimal host permissions.
- **Stripe** (later): webhook signature + `webhook_events` idempotency.
- Not needed: CSRF (single bearer model), provider retry queue (descoped).

## Performance
- Extension: **one** MutationObserver; debounced focus/blur; Shadow DOM (no host reflow/CSS bleed);
  detach icon on blur/DOM removal (no orphaned icons).
- Compress audio client-side (Opus/WebM) before upload.
- **Redis-cached quota** — avoid a DB hit per recording.
- Backend services stateless + idempotent → scale horizontally; deploy on edge.
- Dashboard: lazy-load routes; avoid duplicate queries and needless rerenders.
