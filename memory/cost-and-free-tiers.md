# Cost & Free Tiers

**The MVP is 100% free to build and run.** The owner has no budget right now. Rule:
**flag any step that introduces a paid service before doing it.**

## Free for MVP
| Service | Free tier | Notes |
|---|---|---|
| Neon Postgres | Free serverless DB | enough for MVP |
| Upstash Redis | Free tier | quota + rate-limit |
| Groq Whisper (STT) | ~2000 audio req/day, 25 MB/file | org-level limit; main transcription |
| Google Gemini (cleanup) | Free tier (Flash) | per-minute/per-day rate limits, no card |
| BetterAuth | Open-source, self-hosted | no service cost |
| Hosting (later) | Cloudflare / Vercel free tier | `*.vercel.app` / `*.workers.dev` subdomain |
| Sentry / PostHog / Better Stack | Free tiers | optional, add later |

## Costs only later / only if chosen
- **Stripe** — free to integrate; takes a % per transaction once you charge. Deferred.
- **Custom domain** — optional (~$10/yr); free subdomain works for MVP.
- **Paid STT/AI** — only if Groq/Gemini free limits are outgrown. Warn owner first.

## Where to add a credit card (NOT for MVP)
- Groq "developer tier" (card, no charge) → 10× rate limits + 25% discount. Only if needed.
