# Agent Roster — Index

The SpeakType multi-agent system. The **Opus orchestrator** (this Claude Code session) receives
every request and delegates. Full rules in [`orchestrator.md`](./orchestrator.md); WMUX coordination
in [`wmux.md`](./wmux.md).

| Agent | Role | Model | Mechanism | Definition |
|---|---|---|---|---|
| Opus 4.8 | Orchestrator / leader | `claude-opus-4-8` | this session | `orchestrator.md` |
| Sonnet 4.6 | Primary engineer | `sonnet` | Claude Code subagent | `agents/sonnet-engineer.md` |
| Haiku 4.5 | Fast utility | `haiku` | Claude Code subagent | `agents/haiku-util.md` |
| DeepSeek | Code-analysis specialist | `deepseek/deepseek-v4-pro` | `pi` (pane/router) | `roles/deepseek-analyst.md` |
| Gemini Flash | Fallback / recovery | `vertex/gemini-3.5-flash` | `pi` (pane/router) | `roles/gemini-fallback.md` |
| Qwen Coder | Lightweight coder | `modal-qwen/qwen2.5-coder-7b` | `pi` (pane/router) | `roles/qwen-coder.md` |

## How to invoke

- **Claude agents** — use the `Agent` tool with `sonnet-engineer` or `haiku-util`.
- **Non-Claude agents (interactive)** — use the **`call-agent` skill**
  (`.claude/skills/call-agent/SKILL.md`): it finds the ideal split terminal, picks the agent
  (named by the user, or inferred from the demand), keeps the pane warm, and launches `pi`. This is
  the fast path for "open a side terminal and call the <agent> agent". Underlying protocol in `wmux.md`.
- **Non-Claude agents (headless)** — call the backend router:
  `apps/backend/server/agents/` → `dispatch(task)`. It routes, spawns `pi --print`, and handles the
  Gemini→Sonnet fallback chain. `pi` already holds all provider auth — no API keys live in this repo.

## Capabilities at a glance

- Text-only (no images): **DeepSeek**, **Qwen** → never send vision/screenshot/OCR tasks.
- Tiny context (~8K): **Qwen** → tiny, self-contained tasks only.
- Vision-capable: **Opus**, **Sonnet**, **Haiku**, **Gemini**.
- Fallback for everything: **Gemini Flash**, then **Sonnet**.
