# Agent Roles & Delegation

How the AI assistants work together on **SpeakType**. Opus 4.8 is the leader; it
orchestrates the work and delegates execution to faster/cheaper models when that's
worth it.

## Leader: Opus 4.8

Opus stays responsible for the thinking that needs it:

- Understanding intent and requirements
- Planning and splitting work into pieces
- Reviewing and integrating everything that comes back
- The final decision and the answer to the user

Opus is **not** the sole worker — it hands off heavy or repetitive execution.
Opus is still the only orchestrator: it decides which agent works, what context
the agent receives, when an agent should stop, when work escalates, and whether
the result is accepted. Sub-agents may recommend escalation or a different route,
but they do not self-organize or override Opus.

## Delegation policy: auto-delegate when worth it

Delegation is an Opus decision. The goal is faster execution and lower waste, not
delegation for its own sake.

| Task type                         | Who handles it                              |
| --------------------------------- | ------------------------------------------- |
| Trivial / quick                   | Opus, inline (no agent spawned)             |
| Long, repetitive, parallelizable  | Delegated automatically (no need to ask)    |

When Opus delegates, it tells the user **who it used and why**, and it always
reviews/integrates the result before reporting back.

## Who Opus can delegate to

| Agent / route             | Best for                                            |
| ------------------------- | --------------------------------------------------- |
| `sonnet-engineer`         | Bulk coding: features, refactors, bug fixes, docs   |
| `haiku-util`              | Quick cheap tasks: summaries, status, small edits   |
| `Explore`                 | Broad read-only searches across the codebase        |
| `general-purpose`         | Multi-step research / open-ended searches           |
| `agent-team` / `call-agent` skills | Run agents in side panes; can also reach DeepSeek, Gemini, Qwen via the `pi` CLI |

## Rules of thumb

- Default to delegating long execution; keep judgment and review on Opus.
- Never pass delegated output to the user unchecked.
- Always name who did the work and why.

> This policy is also kept in the assistant's persistent memory so it carries
> across sessions. To change it (e.g. "ask before each spawn" or "Opus does it
> all"), just say so.

---

## Fast delegation — how to actually run the `pi` agents (DeepSeek / Gemini / Qwen)

Two modes. **Opus picks by default; the user can force either** ("just do it" = headless,
"show me / let me watch" = live pane).

- **Headless (DEFAULT — fastest).** One-shot, no TUI, no terminal-scraping, no polling:
  ```
  pi -a -p "<task>"        # runs in cwd, does the work, prints the result, exits
  ```
  Opus captures stdout directly. The run **blocks until done**, so there is no spinner to
  poll. Add `--provider/--model` only to override the defaults (vertex / gemini-3.5-flash).
  Use this for almost everything.

- **Watch in pi (only when asked).** Interactive TUI in a side WMUX pane (the old flow:
  `terminal_send` the task, `terminal_read` the result). Use **only** when the user wants to
  see the agent work live. It is slower and fragile (keystrokes get eaten by the TUI).

### Environment prerequisites (already configured on this machine — don't re-diagnose)

- `NODE_OPTIONS=--dns-result-order=ipv4first --no-network-family-autoselection` (User env) —
  fixes the daily Vertex **OAuth/IPv6 failure under VPN**. Without it `pi` (vertex) dies with
  `request to oauth2.googleapis.com/token failed`.
- `gh` is on PATH (no more full-path dance).
- This repo is trusted in `~/.pi/agent/trust.json`, so `-a` loads project context cleanly
  with no "project not trusted" prompt.

### Hard-won gotchas (this Windows box)

- The **Bash tool is broken** here (`fork: Resource temporarily unavailable`, exit 254) and
  `Start-Sleep` is blocked — so the `Monitor` tool can't pace waits. **Use headless `-p`**
  (which blocks) instead of polling a live pane. Prefer **PowerShell** for shell work.
- For `git commit` messages, write the message to a temp file and use `git commit -F` —
  PowerShell mangles embedded quotes in `-m`.
- When listing WMUX panes, **scope to your own workspace id** (from `a2a_whoami`); the active
  workspace's panes are not yours and `terminal_read` will reject them.

Full recipe: **`.claude/skills/fast-delegate/SKILL.md`**.
