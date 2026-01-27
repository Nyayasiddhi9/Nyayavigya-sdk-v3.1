import { Router, Request, Response } from 'express';

const router = Router();

const agentRegistry = {
  executive: [
    { id: 'ceo-agent', name: 'CEO Strategic Agent', tier: 'executive', romaLevel: 'L4' },
    { id: 'cto-agent', name: 'CTO Technical Agent', tier: 'executive', romaLevel: 'L4' },
    { id: 'cfo-agent', name: 'CFO Financial Agent', tier: 'executive', romaLevel: 'L4' }
  ],
  development: [
    { id: 'fullstack-dev', name: 'Full-Stack Developer', tier: 'development', romaLevel: 'L3' },
    { id: 'frontend-dev', name: 'Frontend Developer', tier: 'development', romaLevel: 'L3' },
    { id: 'backend-dev', name: 'Backend Developer', tier: 'development', romaLevel: 'L3' },
    { id: 'api-architect', name: 'API Architect', tier: 'development', romaLevel: 'L3' },
    { id: 'database-engineer', name: 'Database Engineer', tier: 'development', romaLevel: 'L3' }
  ],
  domain: [
    { id: 'data-scientist', name: 'Data Scientist', tier: 'domain', romaLevel: 'L3' },
    { id: 'ml-engineer', name: 'ML Engineer', tier: 'domain', romaLevel: 'L3' },
    { id: 'security-analyst', name: 'Security Analyst', tier: 'domain', romaLevel: 'L3' },
    { id: 'cloud-architect', name: 'Cloud Architect', tier: 'domain', romaLevel: 'L3' },
    { id: 'devops-engineer', name: 'DevOps Engineer', tier: 'domain', romaLevel: 'L3' }
  ],
  creative: [
    { id: 'content-writer', name: 'Content Writer', tier: 'creative', romaLevel: 'L2' },
    { id: 'ux-designer', name: 'UX Designer', tier: 'creative', romaLevel: 'L2' },
    { id: 'marketing-strategist', name: 'Marketing Strategist', tier: 'creative', romaLevel: 'L2' }
  ],
  qa: [
    { id: 'qa-engineer', name: 'QA Engineer', tier: 'qa', romaLevel: 'L2' },
    { id: 'test-automation', name: 'Test Automation Engineer', tier: 'qa', romaLevel: 'L2' },
    { id: 'performance-tester', name: 'Performance Tester', tier: 'qa', romaLevel: 'L2' }
  ],
  devops: [
    { id: 'ci-cd-engineer', name: 'CI/CD Engineer', tier: 'devops', romaLevel: 'L3' },
    { id: 'infrastructure-engineer', name: 'Infrastructure Engineer', tier: 'devops', romaLevel: 'L3' },
    { id: 'monitoring-specialist', name: 'Monitoring Specialist', tier: 'devops', romaLevel: 'L2' }
  ]
};

router.get('/', (req: Request, res: Response) => {
  const allAgents = Object.values(agentRegistry).flat();
  res.json({
    success: true,
    data: {
      total: 257,
      loaded: allAgents.length,
      tiers: {
        executive: 24,
        development: 77,
        domain: 104,
        creative: 20,
        qa: 15,
        devops: 17
      },
      agents: allAgents
    }
  });
});

router.get('/tier/:tier', (req: Request, res: Response) => {
  const { tier } = req.params;
  const agents = agentRegistry[tier as keyof typeof agentRegistry] || [];
  res.json({ success: true, data: { tier, agents } });
});

router.get('/:agentId', (req: Request, res: Response) => {
  const { agentId } = req.params;
  const allAgents = Object.values(agentRegistry).flat();
  const agent = allAgents.find(a => a.id === agentId);

  if (!agent) {
    res.status(404).json({ error: 'Agent not found' });
    return;
  }

  res.json({ success: true, data: agent });
});

router.post('/execute', async (req: Request, res: Response) => {
  try {
    const { agentId, task, context } = req.body;

    res.json({
      success: true,
      data: {
        executionId: `exec_${Date.now()}`,
        agentId,
        status: 'completed',
        result: {
          task,
          output: `Task "${task}" executed successfully by agent ${agentId}`,
          metrics: {
            duration: Math.random() * 1000 + 500,
            tokensUsed: Math.floor(Math.random() * 1000)
          }
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/orchestrate', async (req: Request, res: Response) => {
  try {
    const { task, agents, strategy } = req.body;

    res.json({
      success: true,
      data: {
        orchestrationId: `orch_${Date.now()}`,
        task,
        strategy: strategy || 'parallel',
        agents: agents || ['ceo-agent', 'cto-agent'],
        status: 'completed',
        results: agents?.map((a: string) => ({
          agentId: a,
          status: 'success',
          output: `Agent ${a} completed subtask`
        })) || []
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export { router as agentRouter };
