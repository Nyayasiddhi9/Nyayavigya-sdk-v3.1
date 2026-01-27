/**
 * WAI SDK v10.0 - Agent Package Index
 * 
 * Complete 267 Agent Registry with 22-Point System Prompts
 * 
 * EXPORTS:
 * - ALL_AGENTS: Complete 267 agent registry
 * - EXECUTIVE_AGENTS: 25 C-Suite and leadership agents
 * - DEVELOPMENT_AGENTS: 23 development agents (consolidated)
 * - DOMAIN_AGENTS: 45 domain-specific agents
 * - CREATIVE_AGENTS: 10 creative agents
 * - QA_AGENTS: 8 QA and testing agents
 * - DEVOPS_AGENTS: 9 DevOps agents
 * - ADDITIONAL_DOMAIN_AGENTS: 27 additional domain agents
 * - getOrchestrator: Singleton orchestrator factory
 * - UnifiedAgentOrchestrator: Orchestrator class
 */

export { 
  ALL_267_AGENTS,
  AGENT_COUNTS
} from './definitions/all-267-agents-v10';

export type {
  AgentDefinitionV10,
  RomaLevel,
  AgentTier,
  OperationMode,
  SecurityLevel
} from './definitions/all-267-agents-v10';

export {
  CREATIVE_AGENTS,
  QA_AGENTS,
  DEVOPS_AGENTS,
  ADDITIONAL_DOMAIN_AGENTS,
  CREATIVE_COUNT,
  QA_COUNT,
  DEVOPS_COUNT,
  ADDITIONAL_DOMAIN_COUNT
} from './definitions/complete-agent-categories';

export {
  UnifiedAgentOrchestrator,
  getOrchestrator,
  resetOrchestrator,
  COMPLETE_AGENT_REGISTRY,
  DEFAULT_CONFIG
} from './orchestration/unified-agent-orchestrator';

export type {
  TaskRequest,
  AgentMatch,
  TaskAssignment,
  ExecutionStep,
  OrchestratorConfig
} from './orchestration/unified-agent-orchestrator';

export {
  LLMAgentIntegration,
  getLLMAgentIntegration,
  resetIntegration,
  DEFAULT_CONFIG_LLM
} from './orchestration/llm-agent-integration';

export type {
  LLMProviderConfig,
  ModelConfig,
  ModelSelection
} from './orchestration/llm-agent-integration';

export {
  AgentTestRunner,
  runAgentTests
} from './orchestration/agent-test-suite';

export type {
  TestResult,
  TestSuiteResult
} from './orchestration/agent-test-suite';

export {
  agentApiRouter,
  createAgentApiRouter
} from './api/agent-api-endpoints';

export {
  QueenOrchestrationController,
  getQueenOrchestrator,
  resetQueenOrchestrator
} from './orchestration/queen-orchestration-controller';

export type {
  UserPrompt,
  EnhancedPrompt,
  OrchestrationPlan,
  OrchestrationResult,
  AgentOutput,
  MultimodalOutput
} from './orchestration/queen-orchestration-controller';

import { ALL_267_AGENTS } from './definitions/all-267-agents-v10';
import { CREATIVE_AGENTS, QA_AGENTS, DEVOPS_AGENTS, ADDITIONAL_DOMAIN_AGENTS } from './definitions/complete-agent-categories';
import { EXTENDED_AGENTS, EXTENDED_AGENT_COUNTS } from './definitions/extended-agents-v10';

export { EXTENDED_AGENTS, EXTENDED_AGENT_COUNTS } from './definitions/extended-agents-v10';

export const ALL_AGENTS = [
  ...ALL_267_AGENTS,
  ...CREATIVE_AGENTS,
  ...QA_AGENTS,
  ...DEVOPS_AGENTS,
  ...ADDITIONAL_DOMAIN_AGENTS,
  ...EXTENDED_AGENTS
];

export const AGENT_STATISTICS = {
  total: ALL_AGENTS.length,
  target: 267,
  achieved: ALL_AGENTS.length >= 267,
  bySource: {
    base: ALL_267_AGENTS.length,
    creative: CREATIVE_AGENTS.length,
    qa: QA_AGENTS.length,
    devops: DEVOPS_AGENTS.length,
    additionalDomain: ADDITIONAL_DOMAIN_AGENTS.length,
    extended: EXTENDED_AGENTS.length
  },
  extendedBreakdown: EXTENDED_AGENT_COUNTS
};

console.log('✅ WAI SDK Agents Package loaded');
console.log(`   Total agents: ${ALL_AGENTS.length} (Target: 267)`);
console.log(`   Status: ${ALL_AGENTS.length >= 267 ? '✅ Target achieved!' : '⚠️ Below target'}`);
