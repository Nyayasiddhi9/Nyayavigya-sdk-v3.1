/**
 * @wai/learning - Self-Improving Agent Learning Package
 * 
 * Consolidated from:
 * - server/services/adaptive-learning-system.ts
 * - server/services/self-improving-agent-network.ts
 * - server/services/evoagentx-integration.ts
 * - server/services/continuous-learning-service.ts
 * - server/orchestration/grpo-reinforcement-trainer.ts
 * 
 * Wired to: allUnifiedAgents registry (267 agents)
 */

export * from './adaptive-learning-system';
export * from './self-improving-agent-network';
export * from './continuous-learning';

import { allUnifiedAgents } from '../../agents/src/definitions/unified-267-agents-registry';

export const LEARNING_PACKAGE_VERSION = '1.0.0';

export function getLearnableAgents() {
  return allUnifiedAgents.filter(a => 
    a.romaLevel === 'L3' || a.romaLevel === 'L4'
  );
}

export function getAgentLearningStats() {
  const agents = allUnifiedAgents;
  return {
    total: agents.length,
    l4Autonomous: agents.filter(a => a.romaLevel === 'L4').length,
    l3SemiAutonomous: agents.filter(a => a.romaLevel === 'L3').length,
    l2Collaborative: agents.filter(a => a.romaLevel === 'L2').length,
    l1Reactive: agents.filter(a => a.romaLevel === 'L1').length,
    learningEnabled: agents.filter(a => a.romaLevel === 'L3' || a.romaLevel === 'L4').length
  };
}
