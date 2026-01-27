/**
 * EvoAgentX API Routes
 * 
 * REST API for managing the EvoAgentX integration with SIAN
 */

import { Router, Request, Response } from 'express';
import { evoAgentXIntegration } from '../services/evoagentx-integration';

const router = Router();

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = evoAgentXIntegration.getStats();
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.get('/sessions', async (req: Request, res: Response) => {
  try {
    const sessions = evoAgentXIntegration.getSessions();
    res.json({
      success: true,
      data: sessions,
      count: sessions.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.get('/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const session = evoAgentXIntegration.getSession(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    res.json({
      success: true,
      data: session,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.post('/sessions', async (req: Request, res: Response) => {
  try {
    const { agentIds, config } = req.body;
    
    if (!agentIds || !Array.isArray(agentIds) || agentIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'agentIds array is required' 
      });
    }
    
    const session = await evoAgentXIntegration.startEvolutionSession(agentIds, config);
    res.json({
      success: true,
      data: session,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.post('/sessions/:sessionId/pause', async (req: Request, res: Response) => {
  try {
    const success = evoAgentXIntegration.pauseSession(req.params.sessionId);
    res.json({
      success,
      message: success ? 'Session paused' : 'Session not found or not active',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.post('/sessions/:sessionId/resume', async (req: Request, res: Response) => {
  try {
    const success = evoAgentXIntegration.resumeSession(req.params.sessionId);
    res.json({
      success,
      message: success ? 'Session resumed' : 'Session not found or not paused',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.get('/genomes/:agentId', async (req: Request, res: Response) => {
  try {
    const history = evoAgentXIntegration.getGenomeHistory(req.params.agentId);
    res.json({
      success: true,
      data: history,
      count: history.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.get('/mutations', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const mutations = evoAgentXIntegration.getMutationHistory(limit);
    res.json({
      success: true,
      data: mutations,
      count: mutations.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.post('/sync', async (req: Request, res: Response) => {
  try {
    await evoAgentXIntegration.syncWithSIAN();
    const stats = evoAgentXIntegration.getStats();
    res.json({
      success: true,
      message: 'Sync completed',
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

export default router;
