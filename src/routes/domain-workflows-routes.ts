/**
 * Domain Workflows API Routes
 * Finance, HR, and other domain-specific workflow endpoints
 */

import { Router, Request, Response } from 'express';
import { financeWorkflowService } from '../services/domain-workflows/finance-workflows';
import { hrWorkflowService } from '../services/domain-workflows/hr-workflows';
import { llmProviderHealthService } from '../services/llm-provider-health-fix';
import { enhancedAgentBatchConfigService } from '../services/enhanced-agent-batch-config';

const router = Router();

router.get('/finance', async (_req: Request, res: Response) => {
  try {
    const workflows = financeWorkflowService.getWorkflows();
    res.json({
      success: true,
      data: workflows,
      count: workflows.length
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/finance/:id', async (req: Request, res: Response) => {
  try {
    const workflow = financeWorkflowService.getWorkflow(req.params.id);
    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found' });
    }
    res.json({ success: true, data: workflow });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/finance/:id/execute', async (req: Request, res: Response) => {
  try {
    const result = await financeWorkflowService.executeWorkflow(req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/hr', async (_req: Request, res: Response) => {
  try {
    const workflows = hrWorkflowService.getWorkflows();
    res.json({
      success: true,
      data: workflows,
      count: workflows.length
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/hr/:id', async (req: Request, res: Response) => {
  try {
    const workflow = hrWorkflowService.getWorkflow(req.params.id);
    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found' });
    }
    res.json({ success: true, data: workflow });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/hr/:id/execute', async (req: Request, res: Response) => {
  try {
    const result = await hrWorkflowService.executeWorkflow(req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/providers/health', async (_req: Request, res: Response) => {
  try {
    const providers = llmProviderHealthService.getProviderStatus();
    const healthy = providers.filter(p => p.status === 'healthy').length;
    const degraded = providers.filter(p => p.status === 'degraded').length;
    
    res.json({
      success: true,
      data: {
        providers,
        summary: {
          total: providers.length,
          healthy,
          degraded,
          error: providers.length - healthy - degraded
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/providers/health/check', async (_req: Request, res: Response) => {
  try {
    const results = await llmProviderHealthService.checkAllProviders();
    res.json({
      success: true,
      data: results,
      checkedAt: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/agents/configured', async (_req: Request, res: Response) => {
  try {
    const agents = enhancedAgentBatchConfigService.getConfiguredAgents();
    res.json({
      success: true,
      data: agents,
      count: agents.length
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/agents/configured/:id', async (req: Request, res: Response) => {
  try {
    const agent = enhancedAgentBatchConfigService.getAgentConfig(req.params.id);
    if (!agent) {
      return res.status(404).json({ success: false, error: 'Agent not found' });
    }
    res.json({ success: true, data: agent });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/agents/category/:category', async (req: Request, res: Response) => {
  try {
    const agents = enhancedAgentBatchConfigService.getAgentsByCategory(req.params.category);
    res.json({
      success: true,
      data: agents,
      count: agents.length
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/agents/configured/:id', async (req: Request, res: Response) => {
  try {
    const updated = enhancedAgentBatchConfigService.updateAgentConfig(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Agent not found' });
    }
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/agents/export', async (_req: Request, res: Response) => {
  try {
    const json = enhancedAgentBatchConfigService.exportConfigurations();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=agent-configurations.json');
    res.send(json);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/agents/import', async (req: Request, res: Response) => {
  try {
    const count = enhancedAgentBatchConfigService.importConfigurations(JSON.stringify(req.body));
    res.json({
      success: true,
      message: `Imported ${count} agent configurations`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
