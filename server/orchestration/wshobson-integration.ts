/**
 * wshobson Agents Integration with WAI SDK v1.0 Orchestration
 * 
 * This module integrates the 83 specialized agents from wshobson/agents repository
 * into the WAI orchestration system, providing intelligent routing and coordination
 * with BMAD (Behavioral Model Agent Distribution) patterns.
 */

import { allWshobsonAgents, getAgentById, getAgentsByCategory, getAgentsByTier, agentStats, type SpecializedAgent } from '../agents/wshobson-agents-registry';
import { z } from 'zod';

/**
 * Zod Validation Schemas
 */
export const agentSelectionCriteriaSchema = z.object({
  task: z.string().min(1, 'Task description is required'),
  category: z.string().optional(),
  requiredCapabilities: z.array(z.string()).optional(),
  preferredModel: z.enum(['haiku', 'sonnet', 'opus']).optional(),
  maxCost: z.enum(['low', 'medium', 'high']).optional(),
  romaLevel: z.enum(['L1', 'L2', 'L3', 'L4']).optional()
});

export const agentSearchSchema = z.object({
  category: z.string().optional(),
  tier: z.string().optional(),
  model: z.enum(['haiku', 'sonnet', 'opus']).optional(),
  romaLevel: z.enum(['L1', 'L2', 'L3', 'L4']).optional(),
  status: z.enum(['active', 'ready', 'building']).optional(),
  capabilities: z.array(z.string()).optional()
});

export const coordinateWorkflowSchema = z.object({
  tasks: z.array(agentSelectionCriteriaSchema).min(1, 'At least one task is required')
});

/**
 * Agent Selection Strategy
 */
export interface AgentSelectionCriteria {
  task: string;
  category?: string;
  requiredCapabilities?: string[];
  preferredModel?: 'haiku' | 'sonnet' | 'opus';
  maxCost?: 'low' | 'medium' | 'high';
  romaLevel?: 'L1' | 'L2' | 'L3' | 'L4';
}

/**
 * Agent Task Assignment
 */
export interface AgentTaskAssignment {
  agent: SpecializedAgent;
  confidence: number;
  reasoning: string;
  estimatedCost: 'low' | 'medium' | 'high';
  estimatedDuration: string;
}

/**
 * Intelligent Agent Router
 * Uses task analysis to select the most appropriate specialized agent
 */
class WshobsonAgentRouter {
  /**
   * Select the best agent for a given task
   */
  static selectAgent(criteria: AgentSelectionCriteria): AgentTaskAssignment | null {
    const task = criteria.task.toLowerCase();
    
    // Category-based routing
    let candidates: SpecializedAgent[] = [];
    
    // Architecture & Design keywords
    if (task.match(/\b(api|microservice|architecture|design|schema|database|graphql|kubernetes|terraform|cloud)\b/)) {
      candidates = getAgentsByCategory('architecture');
    }
    // Programming language keywords
    else if (task.match(/\b(code|programming|javascript|python|java|typescript|go|rust|c\+\+|php|ruby)\b/)) {
      candidates = getAgentsByCategory('programming');
    }
    // AI/ML keywords
    else if (task.match(/\b(ai|ml|llm|rag|prompt|model|machine learning|data science|mlops)\b/)) {
      candidates = getAgentsByCategory('ai-ml');
    }
    // Quality & Security keywords
    else if (task.match(/\b(test|security|audit|review|debug|performance|monitoring|incident)\b/)) {
      candidates = getAgentsByCategory('quality-security');
    }
    // DevOps keywords
    else if (task.match(/\b(deploy|cicd|docker|kubernetes|pipeline|troubleshoot|network)\b/)) {
      candidates = getAgentsByCategory('devops');
    }
    // Documentation keywords
    else if (task.match(/\b(document|docs|api doc|tutorial|diagram|content|seo|blog)\b/)) {
      candidates = getAgentsByCategory('documentation');
    }
    // Business keywords
    else if (task.match(/\b(business|analytics|hr|legal|support|risk)\b/)) {
      candidates = getAgentsByCategory('business');
    }
    
    // Apply filters
    if (criteria.category) {
      candidates = candidates.filter(a => a.category === criteria.category);
    }
    
    if (criteria.preferredModel) {
      candidates = candidates.filter(a => a.model === criteria.preferredModel);
    }
    
    if (criteria.romaLevel) {
      candidates = candidates.filter(a => a.romaLevel === criteria.romaLevel);
    }
    
    // Filter by required capabilities
    if (criteria.requiredCapabilities && criteria.requiredCapabilities.length > 0) {
      candidates = candidates.filter(agent => 
        criteria.requiredCapabilities!.some(cap => 
          agent.capabilities.some(agentCap => agentCap.includes(cap.toLowerCase()))
        )
      );
    }
    
    // Cost filtering
    if (criteria.maxCost) {
      const costMap: Record<string, 'low' | 'medium' | 'high'> = { haiku: 'low', sonnet: 'medium', opus: 'high' };
      const costValue: Record<string, number> = { low: 1, medium: 2, high: 3 };
      const maxCostValue = costValue[criteria.maxCost];
      candidates = candidates.filter(a => {
        const modelCost = costMap[a.model];
        const agentCostValue = costValue[modelCost];
        return agentCostValue <= maxCostValue;
      });
    }
    
    // Fallback: If no candidates after category routing, use all agents but preserve user constraints
    if (candidates.length === 0) {
      candidates = allWshobsonAgents;
      
      // Reapply ALL user-specified filters including category
      if (criteria.category) {
        candidates = candidates.filter(a => a.category === criteria.category);
      }
      
      if (criteria.preferredModel) {
        candidates = candidates.filter(a => a.model === criteria.preferredModel);
      }
      
      if (criteria.romaLevel) {
        candidates = candidates.filter(a => a.romaLevel === criteria.romaLevel);
      }
      
      if (criteria.maxCost) {
        const costMap: Record<string, 'low' | 'medium' | 'high'> = { haiku: 'low', sonnet: 'medium', opus: 'high' };
        const costValue: Record<string, number> = { low: 1, medium: 2, high: 3 };
        const maxCostValue = costValue[criteria.maxCost];
        candidates = candidates.filter(a => {
          const modelCost = costMap[a.model];
          const agentCostValue = costValue[modelCost];
          return agentCostValue <= maxCostValue;
        });
      }
      
      if (criteria.requiredCapabilities && criteria.requiredCapabilities.length > 0) {
        candidates = candidates.filter(agent => 
          criteria.requiredCapabilities!.some(cap => 
            agent.capabilities.some(agentCap => agentCap.includes(cap.toLowerCase()))
          )
        );
      }
      
      // If still no matches after fallback, return null
      if (candidates.length === 0) {
        return null;
      }
      
      // Weight candidates by ROMA level and capability count
      const romaOrder = { L4: 4, L3: 3, L2: 2, L1: 1 };
      candidates.sort((a, b) => {
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (a.status !== 'active' && b.status === 'active') return 1;
        
        const aWeight = romaOrder[a.romaLevel] * a.capabilities.length;
        const bWeight = romaOrder[b.romaLevel] * b.capabilities.length;
        return bWeight - aWeight;
      });
    }
    
    // Select best candidate (prioritize higher ROMA levels and active status)
    const romaOrder = { L4: 4, L3: 3, L2: 2, L1: 1 };
    candidates.sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      return romaOrder[b.romaLevel] - romaOrder[a.romaLevel];
    });
    
    const selectedAgent = candidates[0];
    const costMap = { haiku: 'low', sonnet: 'medium', opus: 'high' } as const;
    
    return {
      agent: selectedAgent,
      confidence: this.calculateConfidence(selectedAgent, criteria),
      reasoning: this.generateReasoning(selectedAgent, criteria),
      estimatedCost: costMap[selectedAgent.model],
      estimatedDuration: this.estimateDuration(selectedAgent, criteria)
    };
  }
  
  /**
   * Calculate confidence score (0-1)
   */
  private static calculateConfidence(agent: SpecializedAgent, criteria: AgentSelectionCriteria): number {
    let score = 0.5; // Base confidence
    
    // Boost for required capabilities match
    if (criteria.requiredCapabilities) {
      const matchCount = criteria.requiredCapabilities.filter(cap =>
        agent.capabilities.some(agentCap => agentCap.includes(cap.toLowerCase()))
      ).length;
      score += (matchCount / criteria.requiredCapabilities.length) * 0.3;
    }
    
    // Boost for ROMA level
    const romaBoost = { L4: 0.15, L3: 0.1, L2: 0.05, L1: 0 };
    score += romaBoost[agent.romaLevel];
    
    // Boost for active status
    if (agent.status === 'active') {
      score += 0.05;
    }
    
    return Math.min(score, 1.0);
  }
  
  /**
   * Generate reasoning for agent selection
   */
  private static generateReasoning(agent: SpecializedAgent, criteria: AgentSelectionCriteria): string {
    const reasons: string[] = [];
    
    reasons.push(`Selected ${agent.name} (${agent.model}) with ROMA ${agent.romaLevel}`);
    reasons.push(`Capabilities: ${agent.capabilities.slice(0, 3).join(', ')}`);
    
    if (criteria.requiredCapabilities) {
      const matchedCaps = criteria.requiredCapabilities.filter(cap =>
        agent.capabilities.some(agentCap => agentCap.includes(cap.toLowerCase()))
      );
      if (matchedCaps.length > 0) {
        reasons.push(`Matches required: ${matchedCaps.join(', ')}`);
      }
    }
    
    return reasons.join(' • ');
  }
  
  /**
   * Estimate task duration
   */
  private static estimateDuration(agent: SpecializedAgent, criteria: AgentSelectionCriteria): string {
    const baseTimeMinutes = { haiku: 1, sonnet: 3.5, opus: 7.5 };
    const romaMultiplier = { L4: 0.7, L3: 0.85, L2: 1.0, L1: 1.3 }; // Higher ROMA = faster
    
    // Calculate adjusted time based on model and ROMA level
    const adjustedMinutes = baseTimeMinutes[agent.model] * romaMultiplier[agent.romaLevel];
    
    if (adjustedMinutes < 1) return '30s-1min';
    if (adjustedMinutes < 2) return '1-2min';
    if (adjustedMinutes < 4) return '2-4min';
    if (adjustedMinutes < 6) return '4-6min';
    if (adjustedMinutes < 8) return '6-8min';
    return '8-10min';
  }
  
  /**
   * Get all available agents with stats
   */
  static getAllAgents() {
    return {
      agents: allWshobsonAgents,
      stats: agentStats,
      totalCount: allWshobsonAgents.length
    };
  }
  
  /**
   * Get agents by multiple criteria
   */
  static searchAgents(filters: {
    category?: string;
    tier?: string;
    model?: 'haiku' | 'sonnet' | 'opus';
    romaLevel?: 'L1' | 'L2' | 'L3' | 'L4';
    capabilities?: string[];
    status?: string;
  }): SpecializedAgent[] {
    let results = allWshobsonAgents;
    
    if (filters.category) {
      results = results.filter(a => a.category === filters.category);
    }
    
    if (filters.tier) {
      results = results.filter(a => a.tier === filters.tier);
    }
    
    if (filters.model) {
      results = results.filter(a => a.model === filters.model);
    }
    
    if (filters.romaLevel) {
      results = results.filter(a => a.romaLevel === filters.romaLevel);
    }
    
    if (filters.status) {
      results = results.filter(a => a.status === filters.status);
    }
    
    if (filters.capabilities && filters.capabilities.length > 0) {
      results = results.filter(agent =>
        filters.capabilities!.some(cap =>
          agent.capabilities.some(agentCap => agentCap.includes(cap.toLowerCase()))
        )
      );
    }
    
    return results;
  }
}

/**
 * BMAD Coordination for wshobson Agents
 */
class WshobsonBMADCoordinator {
  /**
   * Coordinate multi-agent workflow
   */
  static coordinateWorkflow(tasks: AgentSelectionCriteria[]): AgentTaskAssignment[] {
    const assignments: AgentTaskAssignment[] = [];
    
    for (const task of tasks) {
      const assignment = WshobsonAgentRouter.selectAgent(task);
      if (assignment) {
        assignments.push(assignment);
      }
    }
    
    return assignments;
  }
  
  /**
   * Parallel task distribution
   */
  static distributeParallelTasks(tasks: AgentSelectionCriteria[]): {
    parallel: AgentTaskAssignment[];
    sequential: AgentTaskAssignment[];
  } {
    const allAssignments = this.coordinateWorkflow(tasks);
    
    // Group by dependencies (simplified - parallel if different categories)
    const categoryGroups = new Map<string, AgentTaskAssignment[]>();
    
    for (const assignment of allAssignments) {
      const category = assignment.agent.category;
      if (!categoryGroups.has(category)) {
        categoryGroups.set(category, []);
      }
      categoryGroups.get(category)!.push(assignment);
    }
    
    const parallel: AgentTaskAssignment[] = [];
    const sequential: AgentTaskAssignment[] = [];
    
    // First task from each category can run in parallel
    categoryGroups.forEach(group => {
      if (group.length > 0) {
        parallel.push(group[0]);
        sequential.push(...group.slice(1));
      }
    });
    
    return { parallel, sequential };
  }
}

/**
 * Integration with WAI v9.0 Orchestration
 */
class WAIWshobsonIntegration {
  /**
   * Get combined agent count (WAI + wshobson)
   */
  static getTotalAgentCount(): number {
    return 105 + allWshobsonAgents.length; // 105 WAI + 83 wshobson = 188 total
  }
  
  /**
   * Get integration statistics
   */
  static getIntegrationStats() {
    return {
      waiAgents: 105,
      wshobsonAgents: allWshobsonAgents.length,
      totalAgents: this.getTotalAgentCount(),
      wshobsonStats: agentStats,
      capabilities: {
        architecture: agentStats.byCategory.architecture,
        programming: agentStats.byCategory.programming,
        aiMl: agentStats.byCategory.aiMl,
        qualitySecurity: agentStats.byCategory.qualitySecurity,
        devops: agentStats.byCategory.devops,
        documentation: agentStats.byCategory.documentation,
        business: agentStats.byCategory.business
      },
      modelDistribution: {
        haiku: agentStats.byModel.haiku,
        sonnet: agentStats.byModel.sonnet,
        opus: agentStats.byModel.opus
      }
    };
  }
  
  /**
   * Process task with intelligent agent selection
   */
  static async processTask(task: string, options?: Partial<AgentSelectionCriteria>): Promise<AgentTaskAssignment | null> {
    const criteria: AgentSelectionCriteria = {
      task,
      ...options
    };
    
    return WshobsonAgentRouter.selectAgent(criteria);
  }
}

// Export main interfaces and classes
export {
  WshobsonAgentRouter,
  WshobsonBMADCoordinator,
  WAIWshobsonIntegration
};
