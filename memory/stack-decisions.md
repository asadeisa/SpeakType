# Stack Decisions (locked 2026-06-14)

These were chosen with the project owner. Do not silently change them.

| Topic | Decision | Why |
|---|---|---|
| Repo | pnpm monorepo: `apps/extension`, `apps/backend`, `packages/shared` | one contract, shared types |
| Extension | WXT + Vue 3 + TypeScript + Vite, Manifest V3 | matches README; WXT handles MV3 boilerplate |
| Backend | Nuxt 4 + Nitro | matches README; edge-friendly |
| Database | Neon Postgres (serverless, free) | free tier; owner's choice |
| ORM | **Drizzle** (`generate` + `migrate`, never `push`) | per AGENTS.md; type-safe |
| Auth | **BetterAuth** — bearer JWT + refresh rotation, no cookies | self-hosted, free, matches AGENTS.md; chosen over Supabase Auth |
| Cache / quota / rate-limit | Upstash Redis (free) | free tier |
| STT | **Groq Whisper** (free, ~2000 req/day) | replaces paid OpenAI Whisper |
| AI cleanup | **Google Gemini** free tier | replaces paid GPT/Claude; context-aware tone |
| Billing | **Stripe deferred** — schema + `BillingService` interface now, no live wiring | no money now; cheap to add later |
| `graphifiy` | **Skipped** | not needed for a voice→text→insert pipeline |
| License | MIT (open source) | simplest for adoption |
| IDs | UUID, randomly generated for all non-BetterAuth tables | per AGENTS.md |

## Conflicts resolved
- Design doc said **Supabase Auth**; AGENTS.md mandated **BetterAuth + Drizzle**. → BetterAuth + Drizzle wins.
- Design doc STT/AI = OpenAI (paid). → Replaced with Groq + Gemini (free).

## Activation (UX, locked)
- Two triggers, same state machine: **mic click** or **keyboard toggle** (press on / press off).
- Shortcut via Chrome `commands` API. Defaults keep the "W": `Alt+Shift+W` (Win/Linux),
  `MacCtrl+Shift+W` = Ctrl+Shift+W (Mac; ⌘+W/⌘+Shift+W close tabs/windows → avoided).
- **Windows/Meta key is OS-reserved → unusable** in extensions; `commands` allows only
  Ctrl/Alt/Shift (+ ⌘/MacCtrl on Mac). User rebinds at `chrome://extensions/shortcuts`.
- Push-to-talk (hold) is deferred (would need content-script keydown/keyup), not in MVP unless requested.

## Deferred to V2
Realtime streaming (Deepgram/OpenAI Realtime), multi-language, team plans, retry queue.
