/**
 * GRPO Wiring Service
 * 
 * Connects GRPO reinforcement trainer to Wizards platform workflows
 * Enables continuous agent learning from founder feedback
 * 
 * Features:
 * - Collect feedback from all 10 studio workflows
 * - Feed feedback to GRPO trainer for policy optimization
 * - Track agent improvement over time
 * - Automatically improve agent performance based on production usage
 */

import { db } from '../db';
import { wizardsOrchestrationJobs, wizardsStudioSessions } from '@shared/schema';
import { eq, desc, and, gte } from 'drizzle-orm';
import GRPOReinforcementTrainer from '../orchestration/grpo-reinforcement-trainer';

export class GRPOWiringService {
  private grpoTrainer: GRPOReinforcementTrainer;
  private learningEnabled: boolean = true;
  private feedbackThreshold: number = 3; // Minimum 3 ratings before policy update
  
  constructor() {
    this.grpoTrainer = new GRPOReinforcementTrainer({
      learningRate: 0.01,
      batchSize: 32,
      updateInterval: 3600000, // 1 hour
      enableContinuousLearning: true,
    });
    
    console.log('✅ GRPO Wiring Service initialized - continuous learning enabled');
  }
  
  /**
   * Process feedback from orchestration job
   * Called when founder rates a studio workflow result
   */
  async processFeedback(
    orchestrationId: string,
    feedback: {
      quality: number;        // 1-5 rating
      helpfulness: number;    // 1-5 rating
      accuracy: number;       // 1-5 rating
      relevance: number;      // 1-5 rating
      comments?: string;
    }
  ): Promise<void> {
    if (!this.learningEnabled) {
      console.log('⚠️ GRPO learning disabled, feedback not processed');
      return;
    }
    
    // Get orchestration job
    const [job] = await db
      .select()
      .from(wizardsOrchestrationJobs)
      .where(eq(wizardsOrchestrationJobs.orchestrationId, orchestrationId))
      .limit(1);
    
    if (!job) {
      throw new Error(`Orchestration job ${orchestrationId} not found`);
    }
    
    // Calculate composite reward score (0-1 scale)
    const reward = (
      feedback.quality + 
      feedback.helpfulness + 
      feedback.accuracy + 
      feedback.relevance
    ) / 20; // 4 metrics * 5 max = 20, normalized to 0-1
    
    // Store feedback in database
    await db
      .update(wizardsOrchestrationJobs)
      .set({
        outputs: {
          ...job.outputs as any,
          userFeedback: feedback,
        },
      })
      .where(eq(wizardsOrchestrationJobs.orchestrationId, orchestrationId));
    
    console.log(`📊 Feedback received for ${orchestrationId}: reward=${reward.toFixed(2)}`);
    
    // Feed to GRPO trainer for each agent used
    const agents = job.agents as string[];
    for (const agentId of agents) {
      await this.grpoTrainer.updateAgentReward(
        agentId,
        reward,
        {
          orchestrationId,
          workflow: job.workflow as string,
          jobType: job.jobType as string,
          startupId: job.startupId,
          feedback,
          timestamp: new Date(),
        }
      );
    }
    
    // Check if we should trigger policy update
    const agentFeedbackCount = await this.getAgentFeedbackCount(agents[0]);
    if (agentFeedbackCount >= this.feedbackThreshold) {
      console.log(`🔄 Triggering GRPO policy update for agents (${agentFeedbackCount} feedbacks collected)`);
      await this.triggerPolicyUpdate(agents);
    }
  }
  
  /**
   * Trigger GRPO policy update for agents
   * Updates agent behavior based on accumulated feedback
   */
  private async triggerPolicyUpdate(agents: string[]): Promise<void> {
    for (const agentId of agents) {
      try {
        const policyUpdate = await this.grpoTrainer.optimizePolicy(agentId);
        
        console.log(`✨ Policy updated for ${agentId}:`);
        console.log(`   Learning progress: ${policyUpdate.learningProgress.episodeCount} episodes`);
        console.log(`   Average reward: ${policyUpdate.learningProgress.averageReward.toFixed(3)}`);
        console.log(`   Efficiency: ${(policyUpdate.performanceMetrics.efficiency * 100).toFixed(1)}%`);
        console.log(`   Adaptability: ${(policyUpdate.performanceMetrics.adaptability * 100).toFixed(1)}%`);
        
      } catch (error) {
        console.error(`❌ Policy update failed for ${agentId}:`, error);
      }
    }
  }
  
  /**
   * Get feedback count for an agent (last 7 days)
   */
  private async getAgentFeedbackCount(agentId: string): Promise<number> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const jobs = await db
      .select()
      .from(wizardsOrchestrationJobs)
      .where(
        and(
          gte(wizardsOrchestrationJobs.startedAt, sevenDaysAgo),
          eq(wizardsOrchestrationJobs.status, 'completed')
        )
      );
    
    // Count jobs where this agent was used and feedback exists
    return jobs.filter(job => {
      const agents = job.agents as string[];
      const outputs = job.outputs as any;
      return agents.includes(agentId) && outputs?.userFeedback;
    }).length;
  }
  
  /**
   * Get agent learning statistics
   */
  async getAgentLearningStats(agentId: string): Promise<{
    episodeCount: number;
    averageReward: number;
    recentTrend: 'improving' | 'stable' | 'degrading';
    efficiency: number;
    totalFeedback: number;
  }> {
    try {
      const policy = await this.grpoTrainer.getAgentPolicy(agentId);
      
      if (!policy) {
        return {
          episodeCount: 0,
          averageReward: 0,
          recentTrend: 'stable',
          efficiency: 0,
          totalFeedback: 0,
        };
      }
      
      const feedbackCount = await this.getAgentFeedbackCount(agentId);
      
      return {
        episodeCount: policy.learningProgress.episodeCount,
        averageReward: policy.learningProgress.averageReward,
        recentTrend: this.analyzeTrend(policy.learningProgress.rewardTrend),
        efficiency: policy.performanceMetrics.efficiency,
        totalFeedback: feedbackCount,
      };
    } catch (error) {
      console.error(`Error getting learning stats for ${agentId}:`, error);
      return {
        episodeCount: 0,
        averageReward: 0,
        recentTrend: 'stable',
        efficiency: 0,
        totalFeedback: 0,
      };
    }
  }
  
  /**
   * Analyze reward trend
   */
  private analyzeTrend(rewardTrend: number[]): 'improving' | 'stable' | 'degrading' {
    if (rewardTrend.length < 2) return 'stable';
    
    const recent = rewardTrend.slice(-10); // Last 10 episodes
    const older = rewardTrend.slice(-20, -10); // Previous 10 episodes
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    const improvement = recentAvg - olderAvg;
    
    if (improvement > 0.05) return 'improving';
    if (improvement < -0.05) return 'degrading';
    return 'stable';
  }
  
  /**
   * Get platform-wide learning statistics
   */
  async getPlatformLearningStats(): Promise<{
    totalAgentsLearning: number;
    totalFeedbackProcessed: number;
    averagePolicyUpdates: number;
    topPerformingAgents: Array<{
      agentId: string;
      efficiency: number;
      reward: number;
    }>;
  }> {
    const allAgents = await this.grpoTrainer.getAllTrainedAgents();
    
    let totalFeedback = 0;
    let totalPolicyUpdates = 0;
    const agentPerformance: Array<{
      agentId: string;
      efficiency: number;
      reward: number;
    }> = [];
    
    for (const agentId of allAgents) {
      const stats = await this.getAgentLearningStats(agentId);
      totalFeedback += stats.totalFeedback;
      totalPolicyUpdates += stats.episodeCount;
      
      agentPerformance.push({
        agentId,
        efficiency: stats.efficiency,
        reward: stats.averageReward,
      });
    }
    
    // Sort by efficiency and get top 10
    const topPerformers = agentPerformance
      .sort((a, b) => b.efficiency - a.efficiency)
      .slice(0, 10);
    
    return {
      totalAgentsLearning: allAgents.length,
      totalFeedbackProcessed: totalFeedback,
      averagePolicyUpdates: allAgents.length > 0 ? totalPolicyUpdates / allAgents.length : 0,
      topPerformingAgents: topPerformers,
    };
  }
  
  /**
   * Enable/disable continuous learning
   */
  setLearningEnabled(enabled: boolean): void {
    this.learningEnabled = enabled;
    console.log(`🎯 GRPO continuous learning ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }
  
  /**
   * Set feedback threshold for policy updates
   */
  setFeedbackThreshold(threshold: number): void {
    this.feedbackThreshold = threshold;
    console.log(`🎯 GRPO feedback threshold set to ${threshold}`);
  }
  
  /**
   * Get current GRPO configuration state
   * (Added for testing to verify setters work correctly)
   */
  getConfig(): { learningEnabled: boolean; feedbackThreshold: number } {
    return {
      learningEnabled: this.learningEnabled,
      feedbackThreshold: this.feedbackThreshold,
    };
  }
}

// Export singleton instance
export const grpoWiringService = new GRPOWiringService();
