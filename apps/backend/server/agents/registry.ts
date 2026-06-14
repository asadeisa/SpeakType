import type { AgentName, AgentSpec } from './types';

// Single source of truth for the agent roster. Model ids match `pi --list-models`.
// `pi` already holds auth for every provider, so no API keys live in this repo.
export const AGENTS: Record<AgentName, AgentSpec> = {
  opus: {
    name: 'opus',
    provider: 'vertex',
    model: 'claude-opus-4-8',
    mechanism: 'self',
    roleFile: '.claude/orchestrator.md',
    vision: true,
    maxContext: 1_000_000,
  },
  sonnet: {
    name: 'sonnet',
    provider: 'vertex',
    model: 'claude-sonnet-4-6',
    mechanism: 'claude-subagent',
    roleFile: '.claude/agents/sonnet-engineer.md',
    vision: true,
    maxContext: 1_000_000,
  },
  haiku: {
    name: 'haiku',
    provider: 'vertex',
    model: 'claude-haiku-4-5',
    mechanism: 'claude-subagent',
    roleFile: '.claude/agents/haiku-util.md',
    vision: true,
    maxContext: 200_000,
  },
  deepseek: {
    name: 'deepseek',
    provider: 'deepseek',
    model: 'deepseek-v4-pro',
    mechanism: 'pi',
    roleFile: '.claude/roles/deepseek-analyst.md',
    vision: false,
    maxContext: 1_000_000,
  },
  gemini: {
    name: 'gemini',
    provider: 'vertex',
    model: 'gemini-3.5-flash',
    mechanism: 'pi',
    roleFile: '.claude/roles/gemini-fallback.md',
    vision: true,
    maxContext: 1_000_000,
  },
  qwen: {
    name: 'qwen',
    provider: 'modal-qwen',
    model: 'qwen2.5-coder-7b',
    mechanism: 'pi',
    roleFile: '.claude/roles/qwen-coder.md',
    vision: false,
    // ~8K window; leave headroom for the system prompt + output.
    maxContext: 8_000,
  },
};

export function getAgent(name: AgentName): AgentSpec {
  return AGENTS[name];
}
