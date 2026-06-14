---
name: call-agent
description: Find the ideal split terminal (WMUX pane) and call a teammate agent in it — DeepSeek, Gemini, or Qwen via the `pi` CLI. Use whenever you must run an agent in a visible side pane: when the user says "use the <name> agent" / "call <name>", OR when the user describes a task and leaves the agent unnamed (you pick it from the routing table). Keeps a warm reusable pane so calls are fast. Available to every agent on the team.
---

# Call Agent (split-terminal launcher)

Purpose: **stop cold-starting `pi` every time.** Find the right split terminal once, call the
right agent into it, keep it warm, and reuse it. This is the fast path for "open a side terminal
and call the DeepSeek agent" type requests.

Roster, routing, escalation, and fallback live in `.claude/agents.md` + `.claude/orchestrator.md`.
This skill is only about **how to find the pane and make the call**.

---

## Step 1 — Find the ideal split terminal (the pane)

Run these in order and pick the pane that passes every gate:

1. `a2a_whoami` → note **your workspaceId** (you can only drive panes you own).
2. `surface_list` → list every terminal: `ptyId`, `paneId`, `shell`, `isActive`.
3. Pick the **ideal pane** — the first one that is ALL of:
   - **Owned by your workspace** (listed by `pane_list` for your ws). Cross-workspace `terminal_send`
     is blocked.
   - **Not the Claude Code session pane.** Detect it: `terminal_read` shows the Claude Code UI
     (`●`, "Called wmux", tool chatter). Never type into that pane.
   - **A free shell** (PowerShell/bash prompt like `PS C:\…>`) OR **already running our agent**
     (a `pi` TUI we own — reuse it, see Step 3). Never hijack a pane running someone else's TUI.
   - **Wide enough: ≥72 columns** for an interactive TUI (the `pi` banner crashes narrower panes).
     If you can't confirm width, prefer `pi --print` (crash-proof) or ask the user to widen it.

4. If no free pane exists in your workspace: **there is no API to split/create a pane.** Say so in
   one line and give the user the exact manual step ("open a terminal in Workspace 1, beside me").
   Do not loop retrying.

Tag the chosen pane so the whole team can find it again:
`pane_set_metadata { label: "agent:deepseek", role: "deepseek", status: "warm" }`.

---

## Step 2 — Decide WHICH agent (two calling modes)

**Mode A — the user names the agent (explicit).**
Triggers: "use the DeepSeek agent", "call Gemini", "ask Qwen to…", "run it on Sonnet".
→ Use exactly that agent. Don't second-guess the choice; just honor it.

**Mode B — the user describes a task, no name (you choose).**
The user states a *demand* ("debug why X is slow", "write unit tests", "summarize this") and leaves
the agent open. → Name it yourself from the routing table, then tell the user which you picked and why.

| The user's demand looks like… | Call |
|---|---|
| deep debug / root-cause / algorithm / perf (text only) | **DeepSeek** |
| feature / refactor / docs / general bug fix | **Sonnet** (`Agent` tool, not `pi`) |
| boilerplate / unit tests / format / tiny patch (≤8K) | **Qwen** |
| summary / classify / status / monitor | **Haiku** (`Agent` tool) |
| image / screenshot / OCR / visual review | **Gemini** (never DeepSeek/Qwen) |
| fallback when another agent fails/times out | **Gemini**, then **Sonnet** |

Guardrail: **never** send vision to DeepSeek or Qwen. State your pick in one sentence so the user
can override.

> Note: Sonnet and Haiku are Claude agents — run them with the `Agent` tool, NOT in a `pi` pane.
> This skill's pane mechanism is for the `pi` agents: **DeepSeek, Gemini, Qwen.**

---

## Step 3 — Make the call (warm pane = fast)

`pi` agent identities (provider / model / role file):

| Agent | provider | model | role file |
|---|---|---|---|
| DeepSeek | `deepseek` | `deepseek-v4-pro` | `.claude/roles/deepseek-analyst.md` |
| Gemini | `vertex` | `gemini-3.5-flash` | `.claude/roles/gemini-fallback.md` |
| Qwen | `modal-qwen` | `qwen2.5-coder-7b` | `.claude/roles/qwen-coder.md` |

**Choose the launch style by intent:**

- **Watch it live + keep it open** (user wants to see the agent work, like opening `pi` manually) →
  **interactive TUI**. Launch once, then send tasks into it:
  ```
  pi --no-approve --no-context-files \
     --provider deepseek --model deepseek-v4-pro \
     --append-system-prompt .claude/roles/deepseek-analyst.md
  ```
  Then `terminal_send` the task text + `terminal_send_key enter`.

- **One-shot answer, no watching** (automation, speed) → **headless**, add `--print "<task>"`.
  Runs once and **exits** — that's expected, not a bug.

**REUSE before relaunch (the #1 speedup).** Before launching, check Step-1 metadata / `terminal_read`
for a warm `pi` pane of the same agent. If one exists and is `Idle`, **don't relaunch** — just
`terminal_send` the new task into it. Cold start is ~30–120s; a warm pane answers in seconds.

Send the task in two moves: `terminal_send { ptyId, text }` then `terminal_send_key { ptyId, key:"enter" }`.

---

## Step 4 — Know when it's done, then report

- `pi` is slow cold (~30–120s). Don't busy-wait; pace with a single `Monitor` tick, then read once.
- Detect completion from the TUI status line: **`Orchestrator · Idle`** = finished and still running.
  While generating it shows activity / a spinner.
- `terminal_read { ptyId, tail_lines: 30 }` to grab the answer. Relay the agent's reply to the user;
  don't make them read the pane.

**Environment gotchas (this repo, learned the hard way):**
- The **Bash tool's `fork` is broken** here (`dofork … Resource temporarily unavailable`, exit 254).
  Don't pace with bash `sleep`/`until`. Use `Monitor`, or just re-read the pane after other work.
- Standalone `sleep` / `Start-Sleep` are blocked by the harness — use `Monitor` for waits.

---

## One-glance recipe (DeepSeek, watch live, warm-reusable)

```
1. a2a_whoami → my ws
2. surface_list → pick free PowerShell pane I own, ≥72 cols  (skip the Claude Code pane)
3. pane_set_metadata { label:"agent:deepseek", status:"warm" }
4. if no warm deepseek pane: terminal_send the interactive `pi …deepseek…` line + enter
5. terminal_send the task + enter
6. Monitor one tick → terminal_read → relay the reply
7. leave the pane running (warm) for the next call
```
