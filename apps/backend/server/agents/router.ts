import type { AgentName, Task, TaskKind } from './types';
import { AGENTS } from './registry';

// Prompt-driven routing, mirrored here as a thin rule table. The orchestrator
// (Opus) makes the real judgment calls; this keeps headless dispatch predictable.
// Authoritative rules: .claude/orchestrator.md

const KIND_TO_AGENT: Record<TaskKind, AgentName> = {
  architecture: 'opus',
  engineering: 'sonnet',
  analysis: 'deepseek',
  utility: 'haiku',
  'lightweight-code': 'qwen',
  vision: 'gemini',
};

// Lightweight keyword inference, only used when task.kind is not given.
const PATTERNS: Array<[TaskKind, RegExp]> = [
  ['vision', /\b(image|screenshot|screen-?shot|ocr|visual|ui review|diagram|photo|picture)\b/i],
  ['analysis', /\b(debug|root[- ]?cause|why is|algorithm|optimi[sz]e|performance|profiling|bottleneck|investigat)\w*/i],
  ['architecture', /\b(architect|system design|design the|plan(ning)?|trade-?off|strategy|validate the|decide)\b/i],
  ['lightweight-code', /\b(boilerplate|unit[- ]?tests?|format|formatting|lint|small patch|stub|scaffold)\b/i],
  ['utility', /\b(summari[sz]e|classify|status|monitor|tldr|tl;dr|list the|rename)\b/i],
  ['engineering', /\b(implement|feature|refactor|fix|build|add|document|write the)\b/i],
];

export function classify(prompt: string): TaskKind {
  for (const [kind, re] of PATTERNS) {
    if (re.test(prompt)) return kind;
  }
  return 'engineering'; // sensible default: hand it to the primary engineer
}

/**
 * Pick the agent for a task, applying hard guardrails:
 *  - vision tasks never go to text-only models (DeepSeek/Qwen) -> Gemini
 *  - oversized tasks never go to Qwen -> Sonnet
 */
export function route(task: Task): AgentName {
  if (task.forceAgent) return guard(task, task.forceAgent);
  const kind = task.kind ?? classify(task.prompt);
  return guard(task, KIND_TO_AGENT[kind]);
}

function guard(task: Task, agent: AgentName): AgentName {
  const spec = AGENTS[agent];

  // Vision guard: a text-only model cannot see images.
  if (task.hasImages && !spec.vision) {
    return 'gemini';
  }

  // Context guard: keep tiny models on tiny tasks.
  if (task.estimatedTokens && task.estimatedTokens > spec.maxContext) {
    return agent === 'qwen' ? 'sonnet' : agent;
  }

  return agent;
}

/**
 * Ordered list of agents to try: the routed agent first, then the fallback chain.
 * Fallback rule (.claude/orchestrator.md): any failure -> Gemini -> Sonnet.
 * Vision tasks skip the text-only Sonnet/DeepSeek tail in favor of Gemini only.
 */
export function fallbackChain(primary: AgentName, task: Task): AgentName[] {
  const tail: AgentName[] = ['gemini', 'sonnet'];
  const chain = [primary, ...tail].filter(
    (a, i, arr) => arr.indexOf(a) === i, // dedupe, keep first occurrence
  );
  if (task.hasImages) {
    return chain.filter((a) => AGENTS[a].vision);
  }
  return chain;
}
