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

## Delegation policy: auto-delegate when worth it

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
