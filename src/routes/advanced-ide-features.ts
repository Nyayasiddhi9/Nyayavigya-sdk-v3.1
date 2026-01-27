/**
 * Advanced IDE Features API Routes
 * Phase 2: Enhanced Development Tools API Endpoints
 * Integrates intelligent code assistant and development tools with collaborative editor
 */

import { Router } from 'express';
import { intelligentCodeAssistant } from '../services/intelligent-code-assistant';
import { integratedDevelopmentTools } from '../services/integrated-development-tools';
// import { waiOrchestrationMiddleware } from '../middleware/wai-orchestration-middleware';

const router = Router();

// Apply WAI orchestration middleware to all routes
router.use((req, res, next) => {
  req.waiContext = {
    component: 'software-dev',
    enhanced: true,
    timestamp: new Date().toISOString()
  };
  next();
});

// Code Intelligence Routes
router.post('/code/completions', async (req, res) => {
  try {
    const { projectId, fileName, content, cursorPosition, language } = req.body;
    
    if (!projectId || !fileName || !content || !cursorPosition || !language) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const completions = await intelligentCodeAssistant.getCodeCompletions(
      projectId,
      fileName,
      content,
      cursorPosition,
      language
    );

    res.json({
      success: true,
      completions,
      metadata: {
        timestamp: new Date(),
        projectId,
        fileName
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to get code completions',
      details: errorMessage
    });
  }
});

router.post('/code/analyze', async (req, res) => {
  try {
    const { projectId, fileName, content, language } = req.body;
    
    if (!projectId || !fileName || !content || !language) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const analysis = await intelligentCodeAssistant.analyzeCode(
      projectId,
      fileName,
      content,
      language
    );

    res.json({
      success: true,
      analysis,
      metadata: {
        timestamp: new Date(),
        projectId,
        fileName
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to analyze code',
      details: errorMessage
    });
  }
});

router.post('/code/generate', async (req, res) => {
  try {
    const { comment, context, language, projectInfo } = req.body;
    
    if (!comment || !language) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const result = await intelligentCodeAssistant.generateCodeFromComment(
      comment,
      context || '',
      language,
      projectInfo || {}
    );

    res.json({
      success: true,
      result,
      metadata: {
        timestamp: new Date(),
        language,
        comment
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to generate code',
      details: errorMessage
    });
  }
});

router.post('/code/architecture-suggestions', async (req, res) => {
  try {
    const { projectId, projectStructure, techStack } = req.body;
    
    if (!projectId || !projectStructure || !techStack) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const suggestions = await intelligentCodeAssistant.getArchitectureSuggestions(
      projectId,
      projectStructure,
      techStack
    );

    res.json({
      success: true,
      suggestions,
      metadata: {
        timestamp: new Date(),
        projectId
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to get architecture suggestions',
      details: errorMessage
    });
  }
});

router.post('/code/security-scan', async (req, res) => {
  try {
    const { fileName, content, language } = req.body;
    
    if (!fileName || !content || !language) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const vulnerabilities = await intelligentCodeAssistant.detectSecurityVulnerabilities(
      fileName,
      content,
      language
    );

    res.json({
      success: true,
      vulnerabilities,
      metadata: {
        timestamp: new Date(),
        fileName,
        scanType: 'security'
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to perform security scan',
      details: errorMessage
    });
  }
});

router.post('/code/documentation', async (req, res) => {
  try {
    const { fileName, content, language, documentationType } = req.body;
    
    if (!fileName || !content || !language || !documentationType) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const documentation = await intelligentCodeAssistant.generateDocumentation(
      fileName,
      content,
      language,
      documentationType
    );

    res.json({
      success: true,
      documentation,
      metadata: {
        timestamp: new Date(),
        fileName,
        type: documentationType
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to generate documentation',
      details: errorMessage
    });
  }
});

// Terminal Integration Routes
router.post('/terminal/create', async (req, res) => {
  try {
    const { projectId, userId, workingDirectory } = req.body;
    
    if (!projectId || !userId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const session = await integratedDevelopmentTools.createTerminalSession(
      projectId,
      userId,
      workingDirectory
    );

    res.json({
      success: true,
      session,
      metadata: {
        timestamp: new Date(),
        projectId
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to create terminal session',
      details: errorMessage
    });
  }
});

router.post('/terminal/:sessionId/execute', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { command } = req.body;
    
    if (!command) {
      return res.status(400).json({ error: 'Command is required' });
    }

    const result = await integratedDevelopmentTools.executeTerminalCommand(sessionId, command);

    res.json({
      success: true,
      result,
      metadata: {
        timestamp: new Date(),
        sessionId
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to execute terminal command',
      details: errorMessage
    });
  }
});

router.get('/terminal/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = integratedDevelopmentTools.getTerminalSession(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Terminal session not found' });
    }

    res.json({
      success: true,
      session,
      metadata: {
        timestamp: new Date(),
        sessionId
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to get terminal session',
      details: errorMessage
    });
  }
});

// Database Integration Routes
router.post('/database/connect', async (req, res) => {
  try {
    const connectionConfig = req.body;
    
    if (!connectionConfig.name || !connectionConfig.type) {
      return res.status(400).json({ error: 'Missing connection configuration' });
    }

    const connection = await integratedDevelopmentTools.createDatabaseConnection(connectionConfig);

    res.json({
      success: true,
      connection,
      metadata: {
        timestamp: new Date(),
        type: connectionConfig.type
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to create database connection',
      details: errorMessage
    });
  }
});

router.post('/database/:connectionId/query', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { query, projectId } = req.body;
    
    if (!query || !projectId) {
      return res.status(400).json({ error: 'Query and projectId are required' });
    }

    const result = await integratedDevelopmentTools.executeDatabaseQuery(
      connectionId,
      query,
      projectId
    );

    res.json({
      success: true,
      result,
      metadata: {
        timestamp: new Date(),
        connectionId,
        projectId
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to execute database query',
      details: errorMessage
    });
  }
});

router.get('/database/connections', async (req, res) => {
  try {
    const { projectId } = req.query;
    const connections = integratedDevelopmentTools.getDatabaseConnections(projectId as string);

    res.json({
      success: true,
      connections,
      metadata: {
        timestamp: new Date(),
        count: connections.length
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to get database connections',
      details: errorMessage
    });
  }
});

// API Testing Routes
router.post('/api-test/create', async (req, res) => {
  try {
    const { projectId, testRequest } = req.body;
    
    if (!projectId || !testRequest) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const apiTest = await integratedDevelopmentTools.createAPITest(projectId, testRequest);

    res.json({
      success: true,
      test: apiTest,
      metadata: {
        timestamp: new Date(),
        projectId
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to create API test',
      details: errorMessage
    });
  }
});

router.post('/api-test/:testId/execute', async (req, res) => {
  try {
    const { testId } = req.params;
    const { projectId } = req.body;
    
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const result = await integratedDevelopmentTools.executeAPITest(testId, projectId);

    res.json({
      success: true,
      result,
      metadata: {
        timestamp: new Date(),
        testId,
        projectId
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to execute API test',
      details: errorMessage
    });
  }
});

router.get('/api-test/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const tests = integratedDevelopmentTools.getAPITests(projectId);

    res.json({
      success: true,
      tests,
      metadata: {
        timestamp: new Date(),
        projectId,
        count: tests.length
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to get API tests',
      details: errorMessage
    });
  }
});

// Performance Profiling Routes
router.post('/performance/profile', async (req, res) => {
  try {
    const { projectId, fileName, content, language } = req.body;
    
    if (!projectId || !fileName || !content || !language) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const profile = await integratedDevelopmentTools.profilePerformance(
      projectId,
      fileName,
      content,
      language
    );

    res.json({
      success: true,
      profile,
      metadata: {
        timestamp: new Date(),
        projectId,
        fileName
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to profile performance',
      details: errorMessage
    });
  }
});

router.get('/performance/profiles/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const profiles = integratedDevelopmentTools.getPerformanceProfiles(projectId);

    res.json({
      success: true,
      profiles,
      metadata: {
        timestamp: new Date(),
        projectId,
        count: profiles.length
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to get performance profiles',
      details: errorMessage
    });
  }
});

// Dependency Analysis Routes
router.post('/dependencies/suggest', async (req, res) => {
  try {
    const { projectId, currentDependencies, projectType, features } = req.body;
    
    if (!projectId || !currentDependencies || !projectType || !features) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const suggestions = await integratedDevelopmentTools.suggestDependencies(
      projectId,
      currentDependencies,
      projectType,
      features
    );

    res.json({
      success: true,
      suggestions,
      metadata: {
        timestamp: new Date(),
        projectId,
        projectType
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ 
      error: 'Failed to suggest dependencies',
      details: errorMessage
    });
  }
});

export default router;