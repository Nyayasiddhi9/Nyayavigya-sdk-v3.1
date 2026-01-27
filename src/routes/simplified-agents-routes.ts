/**
 * Simplified Agents API Routes
 * Inspired by Claude Code Subagents Collection for easy agent discovery and usage
 */

import { Router } from 'express';
import { simplifiedAgentSystem } from '../services/simplified-agent-system';
import { waiOrchestrator } from '../services/unified-orchestration-client';

const router = Router();

// Get all available agents with categories
router.get('/agents', (req, res) => {
  try {
    const agents = simplifiedAgentSystem.getAllAgents();
    const agentsByCategory = agents.reduce((acc, agent) => {
      if (!acc[agent.category]) {
        acc[agent.category] = [];
      }
      acc[agent.category].push({
        name: agent.name,
        role: agent.role,
        description: agent.description,
        expertise: agent.expertise
      });
      return acc;
    }, {} as Record<string, any[]>);
    
    res.json({
      success: true,
      data: {
        total: agents.length,
        categories: Object.keys(agentsByCategory),
        agentsByCategory,
        allAgents: agents
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get agents by category
router.get('/agents/category/:category', (req, res) => {
  try {
    const { category } = req.params;
    const agents = simplifiedAgentSystem.getAgentsByCategory(category);
    
    res.json({
      success: true,
      data: {
        category,
        count: agents.length,
        agents
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Search agents by query
router.get('/agents/search', (req, res) => {
  try {
    const { q: query } = req.query;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Query parameter "q" is required'
      });
    }
    
    const agents = simplifiedAgentSystem.searchAgents(query);
    
    res.json({
      success: true,
      data: {
        query,
        count: agents.length,
        agents
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get specific agent details
router.get('/agents/:agentName', (req, res) => {
  try {
    const { agentName } = req.params;
    const agent = simplifiedAgentSystem.getAgent(agentName);
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: `Agent "${agentName}" not found`
      });
    }
    
    res.json({
      success: true,
      data: agent
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Execute task with specific agent
router.post('/agents/:agentName/execute', async (req, res) => {
  try {
    const { agentName } = req.params;
    const { task, context } = req.body;
    
    if (!task) {
      return res.status(400).json({
        success: false,
        error: 'Task is required'
      });
    }
    
    const agent = simplifiedAgentSystem.getAgent(agentName);
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: `Agent "${agentName}" not found`
      });
    }
    
    // Generate enhanced prompt with agent context
    const enhancedPrompt = simplifiedAgentSystem.generateAgentPrompt(agentName, task);
    
    // Execute with WAI orchestration
    const result = await waiOrchestrator.executeTask({
      type: 'agent_execution',
      prompt: enhancedPrompt,
      agentType: agentName
    });
    
    res.json({
      success: true,
      data: {
        agentName,
        agentRole: agent.role,
        task,
        result: result.result,
        provider: result.provider,
        cost: result.cost,
        duration: result.duration,
        metadata: {
          agentUsed: agentName,
          taskType: 'specialized_agent',
          enhancedPrompt: enhancedPrompt.substring(0, 200) + '...'
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get agent marketplace stats
router.get('/marketplace/stats', (req, res) => {
  try {
    const agents = simplifiedAgentSystem.getAllAgents();
    const categories = [...new Set(agents.map(a => a.category))];
    
    const stats = {
      totalAgents: agents.length,
      categories: categories.length,
      agentsByCategory: categories.map(category => ({
        category,
        count: agents.filter(a => a.category === category).length,
        agents: agents.filter(a => a.category === category).map(a => ({
          name: a.name,
          role: a.role
        }))
      })),
      topExpertise: agents.flatMap(a => a.expertise)
        .reduce((acc, skill) => {
          acc[skill] = (acc[skill] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Agent recommendation based on task description
router.post('/agents/recommend', (req, res) => {
  try {
    const { taskDescription } = req.body;
    
    if (!taskDescription) {
      return res.status(400).json({
        success: false,
        error: 'Task description is required'
      });
    }
    
    const searchResults = simplifiedAgentSystem.searchAgents(taskDescription);
    const recommendations = searchResults.slice(0, 5).map(agent => ({
      name: agent.name,
      role: agent.role,
      description: agent.description,
      relevanceScore: calculateRelevanceScore(taskDescription, agent),
      expertise: agent.expertise
    }));
    
    res.json({
      success: true,
      data: {
        taskDescription,
        recommendations: recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore)
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper function to calculate relevance score
function calculateRelevanceScore(task: string, agent: any): number {
  const taskLower = task.toLowerCase();
  let score = 0;
  
  // Check name match
  if (agent.name.toLowerCase().includes(taskLower)) score += 10;
  
  // Check role match
  if (agent.role.toLowerCase().includes(taskLower)) score += 8;
  
  // Check description match
  if (agent.description.toLowerCase().includes(taskLower)) score += 6;
  
  // Check expertise matches
  agent.expertise.forEach((skill: string) => {
    if (skill.toLowerCase().includes(taskLower) || taskLower.includes(skill.toLowerCase())) {
      score += 4;
    }
  });
  
  return score;
}

export default router;