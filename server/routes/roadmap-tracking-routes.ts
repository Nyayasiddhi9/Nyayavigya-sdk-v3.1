/**
 * Roadmap Tracking API Routes
 * 
 * Provides REST API endpoints for managing and tracking the
 * WAI DevSphere enhancement roadmap with database integration.
 */

import { Router } from 'express';
import { roadmapDB } from '../services/roadmap-database-integration';
import { onDemandAgentLoader } from '../services/on-demand-agent-loader';
import { enhancedLLMRouter } from '../services/enhanced-llm-routing-gpt5';

const router = Router();

/**
 * Get roadmap overview statistics for dashboard
 */
router.get('/api/roadmap/stats', async (req, res) => {
  try {
    const stats = await roadmapDB.getRoadmapStats();
    const resourceUsage = await onDemandAgentLoader.getResourceUsage();
    
    res.json({
      roadmapStats: stats,
      systemPerformance: {
        totalMemoryUsage: resourceUsage.totalMemory,
        totalCpuUsage: resourceUsage.totalCPU,
        loadedAgents: resourceUsage.agentCount,
        criticalAgents: resourceUsage.criticalAgents,
        optimizationSuggestions: resourceUsage.suggestions
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Failed to get roadmap stats:', error);
    res.status(500).json({ error: 'Failed to retrieve roadmap statistics' });
  }
});

/**
 * Get all roadmap phases with their features
 */
router.get('/api/roadmap/phases', async (req, res) => {
  try {
    const phases = await roadmapDB.getPhasesWithFeatures();
    res.json(phases);
  } catch (error) {
    console.error('❌ Failed to get roadmap phases:', error);
    res.status(500).json({ error: 'Failed to retrieve roadmap phases' });
  }
});

/**
 * Get features by platform
 */
router.get('/api/roadmap/platforms/:platform/features', async (req, res) => {
  try {
    const { platform } = req.params;
    const features = await roadmapDB.getFeaturesByPlatform(platform);
    res.json(features);
  } catch (error) {
    console.error('❌ Failed to get platform features:', error);
    res.status(500).json({ error: 'Failed to retrieve platform features' });
  }
});

/**
 * Update feature status
 */
router.put('/api/roadmap/features/:featureId/status', async (req, res) => {
  try {
    const { featureId } = req.params;
    const { status, progressNotes } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    await roadmapDB.updateFeatureStatus(parseInt(featureId), status, progressNotes);
    res.json({ success: true, message: 'Feature status updated successfully' });
  } catch (error) {
    console.error('❌ Failed to update feature status:', error);
    res.status(500).json({ error: 'Failed to update feature status' });
  }
});

/**
 * Create new roadmap feature
 */
router.post('/api/roadmap/features', async (req, res) => {
  try {
    const featureData = req.body;
    const feature = await roadmapDB.createFeature(featureData);
    res.status(201).json(feature);
  } catch (error) {
    console.error('❌ Failed to create feature:', error);
    res.status(500).json({ error: 'Failed to create feature' });
  }
});

/**
 * Get system performance metrics
 */
router.get('/api/roadmap/performance', async (req, res) => {
  try {
    const resourceUsage = await onDemandAgentLoader.getResourceUsage();
    
    res.json({
      memoryUsage: {
        total: resourceUsage.totalMemory,
        unit: 'MB',
        status: resourceUsage.totalMemory > 1500 ? 'critical' : 
                resourceUsage.totalMemory > 1000 ? 'warning' : 'normal'
      },
      cpuUsage: {
        total: resourceUsage.totalCPU,
        unit: 'percentage',
        status: resourceUsage.totalCPU > 80 ? 'critical' :
                resourceUsage.totalCPU > 60 ? 'warning' : 'normal'
      },
      agentSystem: {
        loadedAgents: resourceUsage.agentCount,
        criticalAgents: resourceUsage.criticalAgents,
        maxRecommended: 15
      },
      suggestions: resourceUsage.suggestions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Failed to get performance metrics:', error);
    res.status(500).json({ error: 'Failed to retrieve performance metrics' });
  }
});

/**
 * Force cleanup of idle agents (performance optimization)
 */
router.post('/api/roadmap/performance/cleanup', async (req, res) => {
  try {
    await onDemandAgentLoader.forceCleanup();
    const usage = await onDemandAgentLoader.getResourceUsage();
    
    res.json({
      success: true,
      message: 'Agent cleanup completed',
      newResourceUsage: usage
    });
  } catch (error) {
    console.error('❌ Failed to perform cleanup:', error);
    res.status(500).json({ error: 'Failed to perform cleanup' });
  }
});

/**
 * Get LLM provider status and routing information
 */
router.get('/api/roadmap/llm-providers', async (req, res) => {
  try {
    // This would need to be implemented in the enhanced LLM router
    // For now, return mock data showing the 14+ providers
    const providers = [
      { 
        id: 'gpt-5',
        name: 'GPT-5',
        status: 'active',
        capabilities: { coding: 95, creative: 92, analytical: 96 },
        costPer1K: 30,
        priority: 95
      },
      {
        id: 'claude-code',
        name: 'Claude Code',
        status: 'active',
        capabilities: { coding: 98, creative: 70, analytical: 85 },
        costPer1K: 20,
        priority: 98
      },
      {
        id: 'kimi-k2',
        name: 'KIMI K2',
        status: 'active',
        capabilities: { coding: 85, creative: 88, analytical: 90 },
        costPer1K: 3,
        priority: 70
      },
      {
        id: 'claude-4-opus',
        name: 'Claude 4 Opus',
        status: 'active',
        capabilities: { coding: 92, creative: 94, analytical: 95 },
        costPer1K: 75,
        priority: 90
      },
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        status: 'active',
        capabilities: { coding: 88, creative: 90, analytical: 92 },
        costPer1K: 25,
        priority: 80
      }
    ];
    
    res.json(providers);
  } catch (error) {
    console.error('❌ Failed to get LLM providers:', error);
    res.status(500).json({ error: 'Failed to retrieve LLM providers' });
  }
});

/**
 * Test LLM routing for coding tasks
 */
router.post('/api/roadmap/llm-routing/test', async (req, res) => {
  try {
    const { taskType = 'coding', complexity = 'moderate', platform = 'code-studio' } = req.body;
    
    const decision = await enhancedLLMRouter.routeTask({
      type: taskType as any,
      complexity: complexity as any,
      domain: 'software-development',
      estimatedTokens: 1000,
      priority: 'medium',
      budget: 'balanced',
      platform,
      userPlan: 'pro',
      realTimeRequired: false,
      requiresWAIIntegration: true
    });
    
    res.json({
      success: true,
      routingDecision: decision,
      message: 'LLM routing test completed successfully'
    });
  } catch (error) {
    console.error('❌ LLM routing test failed:', error);
    res.status(500).json({ error: 'LLM routing test failed' });
  }
});

/**
 * Get roadmap features filtered by status
 */
router.get('/api/roadmap/features/by-status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    const phases = await roadmapDB.getPhasesWithFeatures();
    
    const filteredFeatures = phases.flatMap(phase => 
      phase.features.filter((feature: any) => feature.status === status)
    );
    
    res.json(filteredFeatures);
  } catch (error) {
    console.error('❌ Failed to get features by status:', error);
    res.status(500).json({ error: 'Failed to retrieve features by status' });
  }
});

/**
 * Get critical blocking issues
 */
router.get('/api/roadmap/blockers', async (req, res) => {
  try {
    const phases = await roadmapDB.getPhasesWithFeatures();
    
    const blockers = phases.flatMap(phase => 
      phase.features
        .filter((feature: any) => feature.status === 'blocked' || feature.blockingIssues.length > 0)
        .map((feature: any) => ({
          featureId: feature.id,
          featureName: feature.name,
          phase: phase.name,
          priority: feature.priority,
          blockingIssues: feature.blockingIssues,
          assignedAgents: feature.assignedAgents
        }))
    );
    
    res.json(blockers);
  } catch (error) {
    console.error('❌ Failed to get blockers:', error);
    res.status(500).json({ error: 'Failed to retrieve blocking issues' });
  }
});

export default router;