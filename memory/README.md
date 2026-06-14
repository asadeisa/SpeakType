# Project Memory — SpeakType

Durable facts about this project that an agent should know **before** proposing changes.
This is the project's shared brain (distinct from any per-developer notes).

## Files
| File | Read it before working on… |
|---|---|
| [stack-decisions.md](stack-decisions.md) | the tech stack, auth, ORM, providers, anything architectural |
| [cost-and-free-tiers.md](cost-and-free-tiers.md) | adding/changing a service, anything that might cost money |
| [api-contract.md](api-contract.md) | API routes, request/response shapes, the extension↔backend boundary |
| [security-and-performance.md](security-and-performance.md) | auth, the audio path, uploads, rate limits, performance-sensitive code |

## Golden rules (short)
1. **Zero-cost MVP.** Flag any paid step before doing it.
2. **Decisions are locked** (see `stack-decisions.md`) — don't silently swap a provider/lib.
3. **Contract lives in `packages/shared`** — extension and backend must not drift.
4. **Security & performance are first-class** — this is a sequential, high-demand, voice product.

> AGENTS.md points here. Keep these files updated when a real decision changes — and delete
> what becomes wrong.
