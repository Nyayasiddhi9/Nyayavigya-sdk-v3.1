import express from 'express';
import { dynamicAgentGenerator } from '../wai-sdk-v9/services/dynamic-agent-generator.js';

const router = express.Router();

router.get('/templates', async (req, res) => {
  try {
    const templates = await dynamicAgentGenerator.getAllTemplates();
    res.json({ success: true, templates });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/templates/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const templates = await dynamicAgentGenerator.getTemplatesByCategory(category);
    res.json({ success: true, templates });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/templates/seed', async (req, res) => {
  try {
    const result = await dynamicAgentGenerator.seedTemplates();
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/generate', async (req, res) => {
  try {
    const { templateId, name, customConfig, userId } = req.body;
    const agent = await dynamicAgentGenerator.generateAgent({
      templateId: parseInt(templateId),
      name,
      customConfig,
      userId
    });
    res.json({ success: true, agent });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/generate-team', async (req, res) => {
  try {
    const { templateIds, teamName, userId } = req.body;
    const team = await dynamicAgentGenerator.generateTeam(
      templateIds.map((id: string) => parseInt(id)),
      teamName,
      userId
    );
    res.json({ success: true, team });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/generated', async (req, res) => {
  try {
    const { userId } = req.query;
    const agents = await dynamicAgentGenerator.getGeneratedAgents(
      userId ? parseInt(userId as string) : undefined
    );
    res.json({ success: true, agents });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/generated/:agentId', async (req, res) => {
  try {
    const agentId = parseInt(req.params.agentId);
    await dynamicAgentGenerator.deleteGeneratedAgent(agentId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
