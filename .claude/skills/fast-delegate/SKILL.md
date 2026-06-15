---
name: fast-delegate
description: Delegate a task to a pi teammate agent (DeepSeek / Gemini / Qwen) the FAST way — headless one-shot (`pi -a -p`) that runs, does the work, prints the result, and exits with no TUI and no polling. Use whenever you want an agent to DO a task and you don't need to watch it live. For the "watch it work in a live pane" case, use the call-agent skill instead.
---

# Fast Delegate (headless pi, no watching)

Purpose: **the default, fastest way to hand a task to a `pi` agent.** No TUI to fight, no
keystrokes that get eaten, no spinner to poll. You send a task, the run blocks until done,
you read the result from stdout. This is what made delegation slow before — fix it by going
headless.

> Two modes exist. This skill = **headless** (default). To **watch the agent live in a pane**
> (only when the user says "show me / let me watch"), use **`call-agent`** instead.

---

## When to use which

| Situation | Use |
|---|---|
| "Have <agent> do X", "delegate X", normal execution | **this skill (headless)** |
| "Show me / let me watch the agent work" | `call-agent` (live WMUX pane) |
| Claude agents (Sonnet/Haiku) | the `Agent` tool, NOT pi |

---

## Reliability first: prefer the Claude Agent tool

`pi` is for reaching the **non-Claude** models (Gemini / DeepSeek / Qwen). For everything a
Claude model can do, the **`Agent` tool (`sonnet-engineer`, `haiku-util`) is the reliable
default** — it returns the result directly with no pane, no TUI, no stdin games. Reach for `pi`
only when you specifically need Gemini/DeepSeek/Qwen (e.g. vision, a second opinion, or the
user named them). When you do, follow the stdin rule below or it will hang.

## The one command

Run from the repo root (cwd matters — pi acts on it):

```
$null | pi -a -p "<the full task>"
```

- **CRITICAL — pipe `$null |`.** Headless `pi -p` reads stdin and **hangs forever** waiting for
  EOF when launched from this harness (the background shell hands it an open stdin with no EOF).
  Piping `$null |` closes stdin immediately so the run actually starts. This single fix is what
  turned "pi hangs for an hour" into "pi answers in seconds." Never run `pi -p` without it here.
- `-p` / `--print` → non-interactive: process the prompt and **exit** (blocks until finished).
- `-a` / `--approve` → trust project-local files (loads AGENTS.md/CLAUDE.md context).
- Defaults to provider **vertex**, model **gemini-3.5-flash** (from `~/.pi/agent/settings.json`).
  Override per task: `--provider deepseek --model deepseek-v4-pro`, etc. (roster below).
- Capture stdout = the agent's final answer. No polling, no `terminal_read`.

If `pi` is not on the shell PATH, call it explicitly:
```
node "C:\nvm4w\nodejs\node_modules\@earendil-works\pi-coding-agent\dist\cli.js" -a -p "<task>"
```

### Agent roster (provider / model)

| Agent | `--provider` | `--model` | Best for |
|---|---|---|---|
| Gemini | `vertex` | `gemini-3.5-flash` | default; docs, vision, general execution |
| DeepSeek | `deepseek` | `deepseek-v4-pro` | deep debug / root-cause / algorithm (text only) |
| Qwen | `modal-qwen` | `qwen2.5-coder-7b` | boilerplate / tiny patches |

Never send images to DeepSeek/Qwen.

---

## Prerequisites (ALREADY configured on this machine — do not re-diagnose)

- **`NODE_OPTIONS=--dns-result-order=ipv4first --no-network-family-autoselection`** (User env).
  Without it, `pi` (vertex) dies with `request to oauth2.googleapis.com/token failed` because
  the VPN has no IPv6 route and Node races IPv6 first. If you ever see that error, this env
  var is missing — reset it, don't re-investigate.
- **`gh`** is on PATH.
- This repo is in **`~/.pi/agent/trust.json`**, so `-a` loads context with no "not trusted" prompt.
- Pitfall: `--no-approve` does **NOT** mean "skip approval" — it means "ignore project files".
  Use `-a`/`--approve` to trust, or omit both.

---

## Recipe

1. **Pick the agent** (default Gemini; use the roster for debug/boilerplate).
2. **Write the task as one self-contained prompt** — what to do, which files to read, the hard
   rules, and "reply with X when done". The agent has its own read/edit/write/bash tools.
3. **Run headless** via PowerShell (Bash tool is broken on this box). **Pipe `$null |`** so
   stdin gets EOF (see the CRITICAL note above — without it pi hangs forever):
   ```
   $env:NODE_OPTIONS='--dns-result-order=ipv4first --no-network-family-autoselection'
   $null | pi -a -p "<task>"
   ```
   Long tasks: run with `run_in_background: true` and read the output when notified —
   do **not** poll. For prompts >965 bytes, write them to a temp `.md` and point pi at it
   (`$null | pi -a -p "Read ./.task-X.md and execute it fully."`); delete the temp file after.
4. **Review the result** (stdout) and the files it changed (`git status` / `git diff`).
   Never pass delegated output to the user unchecked.
5. **Report** who did the work and what changed.

---

## Gotchas (this Windows box)

- **Headless `pi -p` hangs without `$null |`** (open stdin, no EOF). This is the #1 gotcha on
  this box — always `$null | pi -a -p "<task>"`. (Details in "The one command" above.)
- **Bash tool is broken** (`fork: Resource temporarily unavailable`, exit 254) and
  `Start-Sleep` is blocked → the `Monitor` tool can't pace waits. Headless `-p` blocks until
  done, so you don't need to wait/poll at all. Prefer **PowerShell** for shell work.
- For `git commit`, write the message to a temp file and `git commit -F <file>` — PowerShell
  mangles embedded quotes in `-m`.
- Read-only review run: `pi --tools read,grep,find,ls -p "<review task>"` (no writes possible).

---

## Relationship to the other skills

- **`call-agent`** — same agents, but launches an interactive TUI in a live WMUX pane. Use only
  when the user wants to watch. Slower + fragile (TUI eats keystrokes).
- **`agent-team`** — full roster / routing / escalation policy. This skill is the fast execution
  path; `agent-team` is the org chart.

Policy of record: `delegation.md` (repo root).
