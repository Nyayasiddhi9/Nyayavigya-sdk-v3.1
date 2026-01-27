/**
 * Goose MCP Integration API Routes
 * Provides REST endpoints for managing Goose MCP servers
 */

import { Router } from 'express';
import { gooseMCPIntegration } from '../services/goose-mcp-integration';

const router = Router();

/**
 * GET /api/goose-mcp/servers
 * Get all available MCP servers
 */
router.get('/servers', async (req, res) => {
  try {
    const { category, priority } = req.query;
    
    let servers;
    if (category) {
      servers = gooseMCPIntegration.getServersByCategory(category as string);
    } else if (priority) {
      servers = gooseMCPIntegration.getServersByPriority(priority as any);
    } else {
      servers = gooseMCPIntegration.getServersByCategory();
    }

    res.json({
      success: true,
      data: {
        servers,
        total: servers.length,
        categories: Array.from(new Set(servers.map(s => s.category))),
        priorities: Array.from(new Set(servers.map(s => s.priority)))
      }
    });
  } catch (error: any) {
    console.error('Error fetching MCP servers:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch MCP servers'
    });
  }
});

/**
 * GET /api/goose-mcp/recommendations
 * Get recommended servers based on capabilities
 */
router.get('/recommendations', async (req, res) => {
  try {
    const { capabilities } = req.query;
    const capArray = capabilities ? (capabilities as string).split(',') : [];
    
    const recommended = gooseMCPIntegration.getRecommendedServers(capArray);
    
    res.json({
      success: true,
      data: {
        recommendations: recommended,
        requestedCapabilities: capArray,
        totalRecommendations: recommended.length
      }
    });
  } catch (error: any) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get recommendations'
    });
  }
});

/**
 * POST /api/goose-mcp/install/:serverId
 * Install a specific MCP server
 */
router.post('/install/:serverId', async (req, res) => {
  try {
    const { serverId } = req.params;
    const result = await gooseMCPIntegration.installServer(serverId);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        serverId
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message,
        serverId
      });
    }
  } catch (error: any) {
    console.error('Error installing MCP server:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Installation failed',
      serverId: req.params.serverId
    });
  }
});

/**
 * POST /api/goose-mcp/install-essential
 * Install all high-priority essential servers
 */
router.post('/install-essential', async (req, res) => {
  try {
    const result = await gooseMCPIntegration.installEssentialServers();
    
    res.json({
      success: true,
      data: {
        installed: result.installed,
        failed: result.failed,
        installedCount: result.installed.length,
        failedCount: result.failed.length
      },
      message: `Installed ${result.installed.length} essential servers`
    });
  } catch (error: any) {
    console.error('Error installing essential servers:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Essential installation failed'
    });
  }
});

/**
 * GET /api/goose-mcp/config/:serverId
 * Get configuration guide for a server
 */
router.get('/config/:serverId', async (req, res) => {
  try {
    const { serverId } = req.params;
    const { server, guide } = gooseMCPIntegration.getConfigurationGuide(serverId);
    
    if (!server) {
      return res.status(404).json({
        success: false,
        error: `Server ${serverId} not found`
      });
    }

    res.json({
      success: true,
      data: {
        server,
        configurationGuide: guide,
        documentation: server.documentation
      }
    });
  } catch (error: any) {
    console.error('Error getting configuration guide:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get configuration guide'
    });
  }
});

/**
 * GET /api/goose-mcp/status
 * Get overall system status and recommendations
 */
router.get('/status', async (req, res) => {
  try {
    const status = gooseMCPIntegration.getSystemStatus();
    
    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error getting system status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get system status'
    });
  }
});

/**
 * POST /api/goose-mcp/execute/:serverId/:tool
 * Execute a tool via MCP server
 */
router.post('/execute/:serverId/:tool', async (req, res) => {
  try {
    const { serverId, tool } = req.params;
    const params = req.body;
    
    const result = await gooseMCPIntegration.executeTool(serverId, tool, params);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error executing MCP tool:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Tool execution failed',
      serverId: req.params.serverId,
      tool: req.params.tool
    });
  }
});

/**
 * GET /api/goose-mcp/categories
 * Get servers grouped by category
 */
router.get('/categories', async (req, res) => {
  try {
    const allServers = gooseMCPIntegration.getServersByCategory();
    const categories: Record<string, any[]> = {};
    
    allServers.forEach(server => {
      if (!categories[server.category]) {
        categories[server.category] = [];
      }
      categories[server.category].push(server);
    });

    res.json({
      success: true,
      data: {
        categories,
        categoryCount: Object.keys(categories).length,
        totalServers: allServers.length
      }
    });
  } catch (error: any) {
    console.error('Error getting categories:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get categories'
    });
  }
});

export default router;