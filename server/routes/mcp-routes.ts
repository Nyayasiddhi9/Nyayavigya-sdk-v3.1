import express from 'express';
import { mcpToolRegistry } from '../wai-sdk-v9/services/mcp-tool-registry.js';

const router = express.Router();

router.get('/tools', async (req, res) => {
  try {
    const tools = await mcpToolRegistry.getAllTools();
    res.json({ success: true, tools });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/tools/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const tools = await mcpToolRegistry.getToolsByCategory(category);
    res.json({ success: true, tools });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/tools/register', async (req, res) => {
  try {
    const tool = await mcpToolRegistry.registerTool(req.body);
    res.json({ success: true, tool });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/tools/:toolId/execute', async (req, res) => {
  try {
    const toolId = parseInt(req.params.toolId);
    const { input, agentId } = req.body;
    const result = await mcpToolRegistry.executeTool(toolId, input, agentId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/servers', async (req, res) => {
  try {
    const servers = await mcpToolRegistry.getAllServers();
    res.json({ success: true, servers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/servers/register', async (req, res) => {
  try {
    const server = await mcpToolRegistry.registerServer(req.body);
    res.json({ success: true, server });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/servers/:serverId/health', async (req, res) => {
  try {
    const serverId = parseInt(req.params.serverId);
    const health = await mcpToolRegistry.checkServerHealth(serverId);
    res.json({ success: true, health });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/tools/seed', async (req, res) => {
  try {
    const result = await mcpToolRegistry.seed280PlusTools();
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
