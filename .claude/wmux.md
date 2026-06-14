# WMUX Coordination

The project runs inside **WMUX**. Use it to run agents in parallel and coordinate them. This repo
has 5 workspaces; Workspace 1 is the Opus orchestrator (this Claude Code session).

## Two execution surfaces

1. **Workspaces** — addressable agents (`mcp__wmux__a2a_discover` lists them by number/name/ID).
   Delegate a whole task to another workspace running an agent.
2. **Panes** — terminals inside a workspace (`mcp__wmux__pane_list`). Launch `pi` agents here for
   one-agent-per-pane parallel execution and monitoring.

## Session awareness

Before delegating, know the lay of the land:
- `mcp__wmux__a2a_whoami` — who am I (workspace id, status).
- `mcp__wmux__a2a_discover` — available workspaces/agents and their status (idle/busy/waiting).
- `mcp__wmux__pane_list` — panes, cwd, git branch, metadata.
- `mcp__wmux__pane_get_metadata` / `pane_set_metadata` — tag a pane with the agent + current task.

## Launching a non-Claude agent in a pane

> **Use the `call-agent` skill** (`.claude/skills/call-agent/SKILL.md`) for this — it automates pane
> discovery (ideal split terminal, ownership + width gates), agent selection (user-named or inferred
> from the demand), and warm-pane reuse so you don't cold-start `pi` every time. The manual steps
> below are the underlying mechanism that skill drives.

Open a pane, then run `pi` with the matching role file as its system prompt:

```
pi --provider deepseek --model deepseek-v4-pro \
   --append-system-prompt .claude/roles/deepseek-analyst.md \
   --print "<task>"
```

Swap provider/model/role for Gemini (`vertex/gemini-3.5-flash` + `gemini-fallback.md`) or Qwen
(`modal-qwen/qwen2.5-coder-7b` + `qwen-coder.md`). Drop `--print` for an interactive pane; add
`--mcp-config <file>` so the pane can join a2a itself. Send input with `terminal_send`, read output
with `terminal_read`.

## Agent-to-agent delegation (a2a)

Delegate to a workspace and have it execute:

```
mcp__wmux__a2a_task_send {
  to: "2",                       # workspace number, name, or ID
  title: "Root-cause slow /v1/audio",
  message: "<full task + context>",
  data: { agent: "deepseek", role: ".claude/roles/deepseek-analyst.md" },
  execute: true                  # run it as a background task, not just deliver text
}
```

- **Replies / threading:** pass `task_id` to continue a thread.
- **Status:** `mcp__wmux__a2a_task_query` to poll; `a2a_task_cancel` to abort.
- **Don't interrupt a running TUI agent:** send with `silent: true` and let it poll, rather than
  pasting into its prompt stream.
- **Broadcast** (`a2a_broadcast`) only for genuine fan-out; prefer targeted sends.

## Process supervision pattern

- Opus (WS1) = coordinator. Delegates and reviews; never blocks on a single agent.
- Sonnet = implementation (native subagent or a pi/Claude pane).
- DeepSeek = analysis pane. Qwen = quick-code pane. Haiku = monitoring. Gemini = standby fallback.
- Monitor long jobs via pane metadata + `a2a_task_query`. On failure/timeout, apply the fallback
  chain in `orchestrator.md` (→ Gemini → Sonnet) and recover the task.

## Browser usage

Use the browser capability exposed by the current environment. Prefer WMUX browser tools when
available; otherwise use the Codex Browser plugin / in-app browser, then Playwright when real
browser automation is needed. Only ask the user when no browser capability is available.

Allow browser-driven research/validation for **Opus, Sonnet, and Gemini** (vision-capable, can read
screenshots). **Do not** hand browser/visual tasks to DeepSeek or Qwen — they are text-only. Keep
browser sessions scoped to the task and close them when the active browser tool supports it.
