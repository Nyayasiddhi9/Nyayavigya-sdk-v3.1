/**
 * WAI Intelligence Layer API Routes
 * 
 * RESTful API endpoints implementing OpenAPI 3.1 specification
 * Provides model catalog, tool catalog, routing decisions, and agent execution
 */

import express from 'express';
import { intelligenceLayer } from './wai-intelligence-api';

export function createIntelligenceRoutes(): express.Router {
  const router = express.Router();

  // Health endpoint - no authentication required
  router.get('/v1/health', (req, res) => {
    res.json({ 
      ok: true, 
      ts: new Date().toISOString(),
      version: '1.0.0',
      service: 'WAI Intelligence Layer'
    });
  });

  // Model catalog endpoint
  router.get('/v1/catalog/models', (req, res) => {
    const models = intelligenceLayer.getModelCatalog();
    res.json(models);
  });

  // Tool catalog endpoint
  router.get('/v1/catalog/tools', (req, res) => {
    const tools = intelligenceLayer.getToolCatalog();
    res.json(tools);
  });

  // Provider inventory endpoint
  router.get('/v1/diag/providers', (req, res) => {
    const providers = intelligenceLayer.getProviders();
    const models = intelligenceLayer.getModels();
    res.json({ providers, models });
  });

  // Agent roster endpoint  
  router.get('/v1/diag/agents', (req, res) => {
    res.json({ 
      roster: [], 
      note: 'Agent registry integration pending',
      total_agents: 105,
      categories: ['executive', 'development', 'creative', 'qa', 'devops', 'domain']
    });
  });

  // Cache statistics endpoint
  router.get('/v1/diag/cache', (req, res) => {
    const cache = intelligenceLayer.getCacheStats();
    res.json({ cache });
  });

  // Routing decision endpoint
  router.post('/v1/route.decide', async (req, res) => {
    try {
      const decision = await intelligenceLayer.decideRoute(req.body);
      res.json(decision);
    } catch (error) {
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Invalid request' 
      });
    }
  });

  // Agent execution endpoint with SSE support
  router.post('/v1/agent.run', async (req, res) => {
    const acceptSSE = /text\/event-stream/i.test(req.headers.accept || '');
    
    if (acceptSSE) {
      // SSE streaming response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');
      
      try {
        const result = await intelligenceLayer.executeAgent(req.body, res);
        intelligenceLayer.writeSSE(res, 'completion', result);
        res.end();
      } catch (error) {
        intelligenceLayer.writeSSE(res, 'error', { 
          error: error instanceof Error ? error.message : 'Execution failed' 
        });
        res.end();
      }
    } else {
      // JSON response
      try {
        const result = await intelligenceLayer.executeAgent(req.body);
        res.json(result);
      } catch (error) {
        res.status(500).json({ 
          error: error instanceof Error ? error.message : 'Execution failed' 
        });
      }
    }
  });

  // Metrics endpoint
  router.get('/v1/metrics', (req, res) => {
    const metrics = intelligenceLayer.getMetrics();
    res.json(metrics);
  });

  return router;
}