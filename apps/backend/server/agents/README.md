# Agent Router (headless dispatch)

Programmatic side of the SpeakType multi-agent system. Routes a task to the right model and runs
it through **`pi`** (which already holds auth for every provider — no API keys live here).

Design + rules: [`.claude/orchestrator.md`](../../../../.claude/orchestrator.md) ·
roster: [`.claude/agents.md`](../../../../.claude/agents.md).

## Usage

```ts
import { dispatch } from '~/server/agents';

const result = await dispatch({ prompt: 'Summarize this changelog: ...', kind: 'utility' });
// -> routes to Haiku; on failure falls back to Gemini, then Sonnet
console.log(result.agent, result.viaFallback, result.output);
```

`kind` is optional — omit it and the router infers it from the prompt (`classify`). You can also
`forceAgent` to bypass routing. Pass `hasImages: true` for vision tasks and `estimatedTokens` so
oversized work is kept away from Qwen.

## Routing (mirror of orchestrator.md)

| kind | agent | model |
|---|---|---|
| `architecture` | opus | `vertex/claude-opus-4-8` |
| `engineering` | sonnet | `vertex/claude-sonnet-4-6` |
| `analysis` | deepseek | `deepseek/deepseek-v4-pro` |
| `utility` | haiku | `vertex/claude-haiku-4-5` |
| `lightweight-code` | qwen | `modal-qwen/qwen2.5-coder-7b` |
| `vision` | gemini | `vertex/gemini-3.5-flash` |

**Guardrails:** vision tasks never reach text-only DeepSeek/Qwen (rerouted to Gemini); tasks larger
than Qwen's ~8K window go to Sonnet. **Fallback:** any failure → Gemini → Sonnet.

## Files

- `types.ts` — `Task`, `AgentSpec`, `DispatchResult`.
- `registry.ts` — the roster (`AGENTS`): provider, model, role file, vision, context.
- `router.ts` — `route()`, `classify()`, `fallbackChain()`.
- `pi.ts` — `dispatchPi()`: spawns `pi --print --mode json …`.
- `index.ts` — `dispatch()`: route → run → fallback.

## Notes

- Inside Claude Code, prefer the `Agent` tool for the Claude agents (`sonnet-engineer`,
  `haiku-util`); use this router for headless runs and the non-Claude agents.
- If `pi` isn't on PATH for the server process, set `PI_BIN` to its full path.
- To add a provider/agent: add a row to `AGENTS`, a role file under `.claude/roles/`, and (if it's a
  new kind) a line in `router.ts`.
