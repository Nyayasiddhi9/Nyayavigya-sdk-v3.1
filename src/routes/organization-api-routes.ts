import { Router } from 'express';
import { organizationManagementService } from '../services/organization-management-service';
import { z } from 'zod';

const router = Router();

const createOrgSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  plan: z.string().optional(),
  logo: z.string().optional(),
});

const allocateAgentsSchema = z.object({
  agentIds: z.array(z.string()),
});

const createApiKeySchema = z.object({
  clientName: z.string().min(1),
  clientDescription: z.string().optional(),
  environment: z.string().optional(),
});

router.get('/organizations', async (req, res) => {
  try {
    const orgs = await organizationManagementService.getAllOrganizations();
    res.json({ success: true, data: orgs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/organizations', async (req, res) => {
  try {
    const input = createOrgSchema.parse(req.body);
    const userId = (req as any).user?.id || 'system';
    const org = await organizationManagementService.createOrganization({ ...input, ownerId: userId });
    res.json({ success: true, data: org });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/organizations/:id', async (req, res) => {
  try {
    const org = await organizationManagementService.getOrganization(parseInt(req.params.id));
    if (!org) return res.status(404).json({ success: false, error: 'Organization not found' });
    const stats = await organizationManagementService.getOrganizationStats(org.id);
    res.json({ success: true, data: { ...org, stats } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/organizations/:id', async (req, res) => {
  try {
    const org = await organizationManagementService.updateOrganization(parseInt(req.params.id), req.body);
    res.json({ success: true, data: org });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/organizations/:id', async (req, res) => {
  try {
    await organizationManagementService.deleteOrganization(parseInt(req.params.id));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/organizations/:id/agents', async (req, res) => {
  try {
    const agents = await organizationManagementService.getOrganizationAgents(parseInt(req.params.id));
    res.json({ success: true, data: agents });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/organizations/:id/allocated-agents', async (req, res) => {
  try {
    const agents = await organizationManagementService.getAllocatedAgents(parseInt(req.params.id));
    res.json({ success: true, data: agents });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/organizations/:id/agents', async (req, res) => {
  try {
    const input = allocateAgentsSchema.parse(req.body);
    const userId = (req as any).user?.id || 'system';
    const allocations = await organizationManagementService.allocateAgents({
      organizationId: parseInt(req.params.id),
      agentIds: input.agentIds,
      userId,
    });
    res.json({ success: true, data: allocations });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.delete('/organizations/:id/agents', async (req, res) => {
  try {
    const { agentIds } = req.body;
    await organizationManagementService.deallocateAgents(parseInt(req.params.id), agentIds);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/organizations/:id/features', async (req, res) => {
  try {
    const features = await organizationManagementService.getFeatureToggles(parseInt(req.params.id));
    res.json({ success: true, data: features });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/organizations/:id/features', async (req, res) => {
  try {
    const features = await organizationManagementService.updateFeatureToggles(parseInt(req.params.id), req.body);
    res.json({ success: true, data: features });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/organizations/:id/settings', async (req, res) => {
  try {
    const settings = await organizationManagementService.getOrgSettings(parseInt(req.params.id));
    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/organizations/:id/settings', async (req, res) => {
  try {
    const settings = await organizationManagementService.updateOrgSettings(parseInt(req.params.id), req.body);
    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/organizations/:id/api-clients', async (req, res) => {
  try {
    const clients = await organizationManagementService.getApiClients(parseInt(req.params.id));
    res.json({ success: true, data: clients });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/organizations/:id/api-clients', async (req, res) => {
  try {
    const input = createApiKeySchema.parse(req.body);
    const userId = (req as any).user?.id || 'system';
    const result = await organizationManagementService.createApiClient({
      organizationId: parseInt(req.params.id),
      clientName: input.clientName,
      clientDescription: input.clientDescription,
      environment: input.environment,
      userId,
    });
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/organizations/:id/api-clients/:clientId/revoke', async (req, res) => {
  try {
    await organizationManagementService.revokeApiClient(parseInt(req.params.id), parseInt(req.params.clientId));
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/organizations/:id/test-sessions', async (req, res) => {
  try {
    const sessions = await organizationManagementService.getTestSessions(parseInt(req.params.id));
    res.json({ success: true, data: sessions });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/organizations/:id/test-sessions', async (req, res) => {
  try {
    const userId = (req as any).user?.id || 'system';
    const session = await organizationManagementService.createTestSession({
      organizationId: parseInt(req.params.id),
      testType: req.body.testType,
      targetId: req.body.targetId,
      targetName: req.body.targetName,
      testConfig: req.body.testConfig,
      userId,
    });
    res.json({ success: true, data: session });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/catalog/agents', async (req, res) => {
  try {
    const agents = await organizationManagementService.getAgentCatalog();
    res.json({ success: true, data: agents });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/catalog/llm-providers', async (req, res) => {
  try {
    const providers = await organizationManagementService.getLlmProviders();
    res.json({ success: true, data: providers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/platform/capabilities', async (req, res) => {
  try {
    const capabilities = await organizationManagementService.getPlatformCapabilities();
    res.json({ success: true, data: capabilities });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
