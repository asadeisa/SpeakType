// Multi-agent system — shared types.
// See .claude/orchestrator.md for the authoritative routing/escalation/fallback rules.

export type AgentName =
  | 'opus'      // orchestrator / leader
  | 'sonnet'    // primary engineer
  | 'haiku'     // fast utility
  | 'deepseek'  // code-analysis specialist (text-only)
  | 'gemini'    // fallback / recovery (vision-capable)
  | 'qwen';     // lightweight coder (tiny context, text-only)

export type TaskKind =
  | 'architecture'      // design, planning, final validation -> opus
  | 'engineering'       // feature, refactor, docs, bug fix    -> sonnet
  | 'analysis'          // debug, root-cause, algo, perf        -> deepseek
  | 'utility'           // summary, classify, status, monitor   -> haiku
  | 'lightweight-code'  // boilerplate, tests, format, patch    -> qwen
  | 'vision';           // image / screenshot / OCR / UI review -> gemini

/** How an agent is actually executed. */
export type Mechanism = 'self' | 'claude-subagent' | 'pi';

export interface AgentSpec {
  name: AgentName;
  /** Provider as understood by `pi --provider`. */
  provider: string;
  /** Model id as understood by `pi --model`. */
  model: string;
  /** Preferred execution mechanism (the router always runs non-Claude via pi). */
  mechanism: Mechanism;
  /** System-prompt file (repo-relative) fed to pi via --append-system-prompt. */
  roleFile: string;
  /** Whether the model can read images. */
  vision: boolean;
  /** Approximate usable context window, in tokens. */
  maxContext: number;
}

export interface Task {
  prompt: string;
  /** Explicit task kind. If omitted, the router infers it from the prompt. */
  kind?: TaskKind;
  /** True when the task includes image input. */
  hasImages?: boolean;
  /** Rough token estimate for the full input (used to keep tiny models in scope). */
  estimatedTokens?: number;
  /** Force a specific agent, bypassing routing (fallback still applies on failure). */
  forceAgent?: AgentName;
}

export interface AttemptLog {
  agent: AgentName;
  model: string;
  ok: boolean;
  ms: number;
  error?: string;
}

export interface DispatchResult {
  agent: AgentName;
  model: string;
  ok: boolean;
  output: string;
  error?: string;
  /** True if the result came from a fallback agent, not the routed one. */
  viaFallback: boolean;
  /** Every agent attempted, in order. */
  attempts: AttemptLog[];
}
