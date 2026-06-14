---
name: agent-team
description: Operate the multi-agent team for this project. Use whenever a task should be delegated across models — route to Opus/Sonnet/Haiku (Codex) or DeepSeek/Gemini/Qwen (via the `pi` CLI), apply escalation + fallback, and coordinate agents across WMUX panes/workspaces. Invoke this when asked to "use the <agent> agent", run the team, launch an agent in a split/pane, or orchestrate parallel work.
---

# Agent Team

The Opus orchestrator (the main Codex session) receives every request, decomposes it,
delegates to the best-fit agent, reviews, and decides. Canonical rules live in
`.claude/orchestrator.md`; roster in `.claude/agents.md`; WMUX protocol in `.claude/wmux.md`;
headless router in `apps/backend/server/agents/`.

This `.agents` skill is the broader local-agent adaptation of the canonical `.claude` guidance. It
may adapt wording or tool names for non-Claude agents, but it must not contradict the routing,
authority model, role files, or WMUX rules in `.claude`.

## Roster & mechanism

| Agent | Best at | Model (`pi` id) | How to run it |
|---|---|---|---|
| **Opus** | architecture, planning, QA, final calls | `vertex/Codex-opus-4-8` | this session (you) |
| **Sonnet** | features, refactor, docs, bug fixing | `vertex/Codex-sonnet-4-6` | `Agent` tool → `sonnet-engineer` |
| **Haiku** | summaries, classify, status, monitoring | `vertex/Codex-haiku-4-5` | `Agent` tool → `haiku-util` |
| **DeepSeek** | deep debug, root-cause, algorithms, perf (text-only) | `deepseek/deepseek-v4-pro` | `pi` |
| **Gemini** | fallback/recovery, fast validation, vision | `vertex/gemini-3.5-flash` | `pi` |
| **Qwen** | boilerplate, unit tests, format, small patches (~8K ctx) | `modal-qwen/qwen2.5-coder-7b` | `pi` |

## Routing (decide first)

| Task kind | Agent |
|---|---|
| architecture / planning / final validation | Opus (self) |
| feature / refactor / docs / general bug fix | Sonnet |
| deep debug / root-cause / algorithm / perf | DeepSeek |
| summary / classify / status / monitor / tiny | Haiku |
| boilerplate / unit tests / format / small patch | Qwen |
| image / screenshot / OCR / visual UI review | Gemini (or a Codex model) |

**Guardrails:** never send vision to **DeepSeek** or **Qwen** (text-only models). Keep **Qwen**
to tiny, self-contained tasks (~8K context); anything bigger → Sonnet.

**Escalation:** Qwen → DeepSeek → Sonnet → Opus · Haiku → Sonnet → Opus · Sonnet → Opus (arch) /
DeepSeek (analysis).

**Fallback (on failure / timeout / rate-limit / outage):** retry on **Gemini**, then **Sonnet**.

## Running a Codex agent

Use the `Agent` tool with subagent `sonnet-engineer` or `haiku-util`. Give it the full task +
context; it returns a summary you review before acting.

## Running a non-Codex agent via `pi`

> **To launch a `pi` agent in a visible side pane, use the `call-agent` skill**
> (`.claude/skills/call-agent/SKILL.md`). It finds the ideal split terminal, selects the agent
> (named by the user or inferred from the demand), keeps the pane warm for speed, and handles the
> width-crash / ownership pitfalls. The flags below are the raw mechanism it uses.

`pi` already holds auth for every provider — no API keys needed. Always use these flags for
headless, non-interactive runs (they avoid the prompt-trust hang and the TUI width crash):

```
pi --print --no-approve --no-context-files \
   --provider <provider> --model <model> \
   --append-system-prompt .claude/roles/<role>.md \
   "<task>"
```

| Agent | provider | model | role file |
|---|---|---|---|
| DeepSeek | `deepseek` | `deepseek-v4-pro` | `.claude/roles/deepseek-analyst.md` |
| Gemini | `vertex` | `gemini-3.5-flash` | `.claude/roles/gemini-fallback.md` |
| Qwen | `modal-qwen` | `qwen2.5-coder-7b` | `.claude/roles/qwen-coder.md` |

Example — DeepSeek says hi:
```
pi --print --no-approve --no-context-files --provider deepseek --model deepseek-v4-pro \
   --append-system-prompt .claude/roles/deepseek-analyst.md "Say hi to me."
```

For headless dispatch from code, call `dispatch(task)` in `apps/backend/server/agents/` — it routes,
spawns `pi`, and walks the Gemini→Sonnet fallback chain automatically.

## Operating agents inside WMUX

Use WMUX to run agents in parallel panes/workspaces. Before delegating: `a2a_whoami`,
`a2a_discover` (workspaces/agents), `pane_list` / `surface_list` (panes & PTY ids). Tag panes with
`pane_set_metadata` (label/role/status). Delegate a whole task to another workspace with
`a2a_task_send { to, title, message, data, execute: true }`; poll with `a2a_task_query`. Drive a
pane you own with `terminal_send` + `terminal_send_key`; read with `terminal_read`.

### WMUX rules learned the hard way — check these FIRST

1. **Ownership gate.** You can only `terminal_send` to a PTY **owned by your own workspace**.
   Cross-workspace sends fail: *"PTY not owned by workspace … Cross-workspace terminal access is
   not allowed."* Confirm with `pane_list workspaceId:<your-ws>` that the target pane is listed.
2. **No split/create/claim API.** There is no MCP tool to split, create, or transfer a pane. If you
   need a pane in your workspace, the user must open the terminal **inside the same workspace as the
   Codex agent**. Don't loop retrying a cross-workspace send — state this and stop.
3. **TUI width crash.** Interactive `pi` crashes if any rendered line exceeds the pane width
   (`Rendered line exceeds terminal width (72 > 58)`), triggered by the `pi-vertex` startup banner.
   Either ensure the pane is **≥72 columns**, or use `pi --print` (no TUI — crash-proof). Prefer
   `--print` for automation.
4. **`pi` is slow to start** (~30–120s cold; long runs auto-background). Fire it, then read the
   output file / poll once — don't busy-wait.
5. **Don't hijack agent panes.** A pane already running a Codex/`pi` TUI is not a free shell; never
   send commands into it.

## When stuck

If a WMUX action is blocked by ownership or a missing capability, say so in one line and give the
user the exact manual step (e.g. the `pi --print …` one-liner, or "open a terminal in Workspace 1").
Do not retry the same blocked call repeatedly.
