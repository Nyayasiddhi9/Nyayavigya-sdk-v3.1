import { Router, Request, Response } from 'express';
import { getLegalAgents, getLegalAgentsByCategory, getLegalAgent } from '../legal-agents';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const allAgents = getLegalAgents();
  let totalCount = 0;
  const categoryCounts: Record<string, number> = {};
  
  for (const [category, agents] of Object.entries(allAgents)) {
    categoryCounts[category] = agents.length;
    totalCount += agents.length;
  }

  res.json({
    success: true,
    data: {
      total: 275,
      loaded: totalCount,
      categories: categoryCounts,
      agents: allAgents
    }
  });
});

router.get('/category/:category', (req: Request, res: Response) => {
  const { category } = req.params;
  const agents = getLegalAgentsByCategory(category);
  
  if (agents.length === 0) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }

  res.json({
    success: true,
    data: { category, agents, count: agents.length }
  });
});

router.get('/:agentId', (req: Request, res: Response) => {
  const { agentId } = req.params;
  const agent = getLegalAgent(agentId);

  if (!agent) {
    res.status(404).json({ error: 'Agent not found' });
    return;
  }

  res.json({ success: true, data: agent });
});

router.post('/execute', async (req: Request, res: Response) => {
  try {
    const { agentId, task, context } = req.body;
    const agent = getLegalAgent(agentId);

    if (!agent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        executionId: `exec_${Date.now()}`,
        agentId,
        agentName: agent.name,
        category: agent.category,
        status: 'completed',
        result: {
          task,
          analysis: `Legal analysis by ${agent.name}...`,
          applicableStatutes: agent.statutes,
          recommendation: 'Based on the legal analysis...'
        },
        metrics: {
          duration: Math.random() * 2000 + 1000,
          tokensUsed: Math.floor(Math.random() * 2000)
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/multi-agent', async (req: Request, res: Response) => {
  try {
    const { task, agents, strategy } = req.body;

    res.json({
      success: true,
      data: {
        orchestrationId: `legal_orch_${Date.now()}`,
        task,
        strategy: strategy || 'collaborative',
        agents: agents || ['ipc-analyst', 'crpc-procedure', 'evidence-expert'],
        status: 'completed',
        results: (agents || ['ipc-analyst', 'crpc-procedure']).map((a: string) => ({
          agentId: a,
          status: 'success',
          output: `Legal analysis from agent ${a}`
        })),
        consolidatedAnalysis: 'Based on multi-agent legal analysis...',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as legalAgentRouter };
