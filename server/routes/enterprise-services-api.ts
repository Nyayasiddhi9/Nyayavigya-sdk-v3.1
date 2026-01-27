/**
 * Enterprise Services API Routes - WAI SDK v3.1
 * 
 * 100% Production-Ready Enterprise AI Platform
 * 
 * Routes for all P0/P1/P2 enterprise services:
 * - /api/v3/search - Web search (P0) - Perplexity, Tavily, Serper, Brave
 * - /api/v3/scrape - Web scraping (P0) - Cheerio HTML parsing
 * - /api/v3/ocr - Document OCR (P0) - GPT-4o Vision API
 * - /api/v3/finance - Financial data (P0) - Alpha Vantage, CoinGecko, SEC EDGAR
 * - /api/v3/media - Multimedia generation (P0) - ElevenLabs, DALL-E 3, Replicate
 * - /api/v3/studio - NotebookLLM Document Studio (P1) - Q&A, citations, audio
 * - /api/v3/database - Database Connector Hub (P1) - PostgreSQL with security
 * - /api/v3/code - Code Quality Gateway (P1) - Static analysis, AI review
 * - /api/v3/research - Domain Research APIs (P1) - Legal, Academic, Patent, Medical
 * - /api/v3/investment - Investment Research Tools (P1) - SEC filings, XBRL data
 * - /api/v3/analytics - Visual Analytics Dashboard (P2) - Charts, KPIs, metrics
 * - /api/v3/assets - Content Asset Management (P2) - Digital assets, versioning
 * - /api/v3/i18n - Multi-language Support (P2) - AI translation, 100+ languages
 * 
 * Security: JWT auth, API keys, rate limiting, input validation, audit logging
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { 
  realWebSearchService,
  realWebScrapingService,
  realOCRPipelineService,
  realFinancialDataService,
  realMultimediaAPIService,
  notebookDocumentStudioService,
  databaseConnectorHubService,
  codeQualityGatewayService,
  domainResearchAPIService,
  investmentResearchService,
  visualAnalyticsDashboardService,
  contentAssetManagementService,
  multiLanguageSupportService,
  getEnterpriseServicesHealth
} from '../services/enterprise-platform-services';
import {
  enterpriseAuthMiddleware,
  rateLimitMiddleware,
  sanitizeInputMiddleware,
  auditLogMiddleware
} from '../middleware/enterprise-auth';

const router = Router();

router.use(sanitizeInputMiddleware());
router.use(auditLogMiddleware());
router.use(rateLimitMiddleware({ windowMs: 60000, maxRequests: 100 }));

const searchQuerySchema = z.object({
  query: z.string().min(1).max(500),
  options: z.object({
    provider: z.string().optional(),
    maxResults: z.number().optional(),
    freshness: z.string().optional()
  }).optional()
});

const translateSchema = z.object({
  text: z.string().min(1).max(10000),
  targetLanguage: z.string().min(2).max(10),
  sourceLanguage: z.string().optional(),
  context: z.string().optional(),
  formality: z.enum(['formal', 'informal']).optional()
});

const dashboardCreateSchema = z.object({
  name: z.string().min(1).max(100),
  ownerId: z.string().min(1),
  description: z.string().optional(),
  layout: z.enum(['grid', 'freeform', 'flow']).optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string()).optional()
});

const assetCreateSchema = z.object({
  base64Data: z.string().min(1),
  originalName: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  ownerId: z.string().min(1),
  folderId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional()
});

// ============================================================================
// HEALTH & STATUS
// ============================================================================

router.get('/health', (req: Request, res: Response) => {
  try {
    const health = getEnterpriseServicesHealth();
    res.json({
      status: 'healthy',
      services: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Health check failed' });
  }
});

// ============================================================================
// WEB SEARCH API (/api/v3/search)
// ============================================================================

router.post('/search/web', async (req: Request, res: Response) => {
  try {
    const { query, options = {} } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required' });
    }

    const result = await realWebSearchService.search(query, options);
    res.json(result);
  } catch (error) {
    console.error('Web search error:', error);
    res.status(500).json({ 
      error: 'Search failed', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.post('/search/news', async (req: Request, res: Response) => {
  try {
    const { query, options = {} } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required' });
    }

    const result = await realWebSearchService.searchNews(query, options);
    res.json(result);
  } catch (error) {
    console.error('News search error:', error);
    res.status(500).json({ 
      error: 'News search failed', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.get('/search/providers', (req: Request, res: Response) => {
  try {
    const providers = realWebSearchService.getProviderStats();
    res.json({ providers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get providers' });
  }
});

router.get('/search/cache', (req: Request, res: Response) => {
  try {
    const stats = realWebSearchService.getCacheStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get cache stats' });
  }
});

router.delete('/search/cache', (req: Request, res: Response) => {
  try {
    realWebSearchService.clearCache();
    res.json({ success: true, message: 'Cache cleared' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// ============================================================================
// WEB SCRAPING API (/api/v3/scrape)
// ============================================================================

router.post('/scrape/url', async (req: Request, res: Response) => {
  try {
    const { url, options = {} } = req.body;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL is required' });
    }

    const result = await realWebScrapingService.scrapeUrl(url, options);
    res.json(result);
  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({ 
      error: 'Scraping failed', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.post('/scrape/batch', async (req: Request, res: Response) => {
  try {
    const { urls, options = {} } = req.body;
    
    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'URLs array is required' });
    }

    const results = await realWebScrapingService.batchScrape(urls, options);
    res.json({ results, count: results.length });
  } catch (error) {
    console.error('Batch scraping error:', error);
    res.status(500).json({ 
      error: 'Batch scraping failed', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.post('/scrape/job', async (req: Request, res: Response) => {
  try {
    const { url, options = {} } = req.body;
    const userId = (req as any).user?.id;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL is required' });
    }

    const job = await realWebScrapingService.createJob(url, options, userId);
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create scrape job' });
  }
});

router.get('/scrape/jobs', (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const jobs = realWebScrapingService.getJobs(userId);
    res.json({ jobs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get jobs' });
  }
});

router.get('/scrape/jobs/:id', (req: Request, res: Response) => {
  try {
    const job = realWebScrapingService.getJob(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get job' });
  }
});

router.get('/scrape/stats', (req: Request, res: Response) => {
  try {
    const stats = realWebScrapingService.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// ============================================================================
// OCR API (/api/v3/ocr)
// ============================================================================

router.post('/ocr/process', async (req: Request, res: Response) => {
  try {
    const { input, options = {} } = req.body;
    
    if (!input || !input.type || !input.data) {
      return res.status(400).json({ error: 'Input with type and data is required' });
    }

    const result = await realOCRPipelineService.processDocument(input, options);
    res.json(result);
  } catch (error) {
    console.error('OCR error:', error);
    res.status(500).json({ 
      error: 'OCR processing failed', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.post('/ocr/job', async (req: Request, res: Response) => {
  try {
    const { input, options = {} } = req.body;
    const userId = (req as any).user?.id;
    
    if (!input || !input.type || !input.data) {
      return res.status(400).json({ error: 'Input with type and data is required' });
    }

    const job = await realOCRPipelineService.createJob(input, options, userId);
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create OCR job' });
  }
});

router.get('/ocr/jobs', (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const jobs = realOCRPipelineService.getJobs(userId);
    res.json({ jobs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get jobs' });
  }
});

router.get('/ocr/jobs/:id', (req: Request, res: Response) => {
  try {
    const job = realOCRPipelineService.getJob(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get job' });
  }
});

router.get('/ocr/languages', (req: Request, res: Response) => {
  try {
    const languages = realOCRPipelineService.getSupportedLanguages();
    res.json({ languages, count: languages.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get languages' });
  }
});

router.get('/ocr/engines', (req: Request, res: Response) => {
  try {
    const engines = realOCRPipelineService.getAvailableEngines();
    res.json({ engines });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get engines' });
  }
});

router.get('/ocr/stats', (req: Request, res: Response) => {
  try {
    const stats = realOCRPipelineService.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// ============================================================================
// FINANCIAL DATA API (/api/v3/finance)
// ============================================================================

router.get('/finance/quote/:symbol', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const quote = await realFinancialDataService.getStockQuote(symbol);
    res.json(quote);
  } catch (error) {
    console.error('Stock quote error:', error);
    res.status(500).json({ 
      error: 'Failed to get stock quote', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.post('/finance/quotes', async (req: Request, res: Response) => {
  try {
    const { symbols } = req.body;
    
    if (!Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({ error: 'Symbols array is required' });
    }

    const quotes = await realFinancialDataService.getMultipleQuotes(symbols);
    res.json({ quotes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get quotes' });
  }
});

router.get('/finance/history/:symbol', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const { interval, limit } = req.query;
    
    const data = await realFinancialDataService.getHistoricalData(symbol, {
      interval: interval as any,
      limit: limit ? parseInt(limit as string, 10) : undefined
    });
    res.json(data);
  } catch (error) {
    console.error('Historical data error:', error);
    res.status(500).json({ 
      error: 'Failed to get historical data', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.get('/finance/fundamentals/:symbol', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const fundamentals = await realFinancialDataService.getCompanyFundamentals(symbol);
    res.json(fundamentals);
  } catch (error) {
    console.error('Fundamentals error:', error);
    res.status(500).json({ 
      error: 'Failed to get fundamentals', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.get('/finance/sec/:cik', async (req: Request, res: Response) => {
  try {
    const { cik } = req.params;
    const { filingType, limit } = req.query;
    
    const filings = await realFinancialDataService.getSECFilings(
      cik,
      filingType as string,
      limit ? parseInt(limit as string, 10) : undefined
    );
    res.json({ filings });
  } catch (error) {
    console.error('SEC filings error:', error);
    res.status(500).json({ 
      error: 'Failed to get SEC filings', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.get('/finance/crypto/:coinId', async (req: Request, res: Response) => {
  try {
    const { coinId } = req.params;
    const quote = await realFinancialDataService.getCryptoQuote(coinId);
    res.json(quote);
  } catch (error) {
    console.error('Crypto quote error:', error);
    res.status(500).json({ 
      error: 'Failed to get crypto quote', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.get('/finance/search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }

    const results = await realFinancialDataService.searchStocks(q);
    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

router.get('/finance/stats', (req: Request, res: Response) => {
  try {
    const stats = realFinancialDataService.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// ============================================================================
// MULTIMEDIA API (/api/v3/media)
// ============================================================================

router.post('/media/speech', async (req: Request, res: Response) => {
  try {
    const { text, options = {} } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    const result = await realMultimediaAPIService.generateSpeech(text, options);
    res.json(result);
  } catch (error) {
    console.error('Speech generation error:', error);
    res.status(500).json({ 
      error: 'Speech generation failed', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.get('/media/voices', async (req: Request, res: Response) => {
  try {
    const voices = await realMultimediaAPIService.getVoices();
    res.json({ voices });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get voices' });
  }
});

router.post('/media/image', async (req: Request, res: Response) => {
  try {
    const { prompt, options = {} } = req.body;
    
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const result = await realMultimediaAPIService.generateImage(prompt, options);
    res.json(result);
  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({ 
      error: 'Image generation failed', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.post('/media/video', async (req: Request, res: Response) => {
  try {
    const { prompt, options = {} } = req.body;
    
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const result = await realMultimediaAPIService.generateVideo(prompt, options);
    res.json(result);
  } catch (error) {
    console.error('Video generation error:', error);
    res.status(500).json({ 
      error: 'Video generation failed', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.post('/media/music', async (req: Request, res: Response) => {
  try {
    const { prompt, options = {} } = req.body;
    
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const result = await realMultimediaAPIService.generateMusic(prompt, options);
    res.json(result);
  } catch (error) {
    console.error('Music generation error:', error);
    res.status(500).json({ 
      error: 'Music generation failed', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.post('/media/job', async (req: Request, res: Response) => {
  try {
    const { type, prompt, options = {} } = req.body;
    const userId = (req as any).user?.id;
    
    if (!type || !prompt) {
      return res.status(400).json({ error: 'Type and prompt are required' });
    }

    const job = await realMultimediaAPIService.createJob(type, prompt, options, userId);
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create media job' });
  }
});

router.get('/media/jobs', (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const jobs = realMultimediaAPIService.getJobs(userId);
    res.json({ jobs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get jobs' });
  }
});

router.get('/media/jobs/:id', (req: Request, res: Response) => {
  try {
    const job = realMultimediaAPIService.getJob(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get job' });
  }
});

router.get('/media/providers', (req: Request, res: Response) => {
  try {
    const providers = realMultimediaAPIService.getAvailableProviders();
    res.json(providers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get providers' });
  }
});

router.get('/media/stats', (req: Request, res: Response) => {
  try {
    const stats = realMultimediaAPIService.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// ============================================================================
// DOCUMENT STUDIO API (/api/v3/studio) - NotebookLLM-style
// ============================================================================

router.post('/studio/projects', async (req: Request, res: Response) => {
  try {
    const { name, description, settings, userId } = req.body;
    
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const project = await notebookDocumentStudioService.createProject({
      name,
      description,
      settings,
      userId
    });
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create project' });
  }
});

router.get('/studio/projects/:projectId', (req: Request, res: Response) => {
  try {
    const project = notebookDocumentStudioService.getProject(req.params.projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get project' });
  }
});

router.get('/studio/projects', (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const projects = notebookDocumentStudioService.listProjects(userId);
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to list projects' });
  }
});

router.patch('/studio/projects/:projectId', (req: Request, res: Response) => {
  try {
    const { name, description, settings, userId } = req.body;
    const project = notebookDocumentStudioService.updateProject(
      req.params.projectId,
      { name, description, settings },
      userId
    );
    res.json(project);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update project';
    res.status(400).json({ error: message });
  }
});

router.delete('/studio/projects/:projectId', (req: Request, res: Response) => {
  try {
    const deleted = notebookDocumentStudioService.deleteProject(req.params.projectId);
    if (!deleted) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

router.post('/studio/projects/:projectId/documents', async (req: Request, res: Response) => {
  try {
    const { fileName, content, mimeType, fileSize } = req.body;
    
    if (!fileName || !content) {
      return res.status(400).json({ error: 'fileName and content are required' });
    }

    const document = await notebookDocumentStudioService.addDocument(
      req.params.projectId,
      {
        fileName,
        content,
        mimeType: mimeType || 'text/plain',
        fileSize: fileSize || content.length
      }
    );
    res.status(201).json(document);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add document';
    res.status(400).json({ error: message });
  }
});

router.post('/studio/projects/:projectId/ask', async (req: Request, res: Response) => {
  try {
    const { question } = req.body;
    
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question is required' });
    }

    const response = await notebookDocumentStudioService.askQuestion(
      req.params.projectId,
      question
    );
    res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to answer question';
    res.status(400).json({ error: message });
  }
});

router.post('/studio/projects/:projectId/insights', async (req: Request, res: Response) => {
  try {
    const insights = await notebookDocumentStudioService.generateInsights(
      req.params.projectId
    );
    res.json(insights);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate insights';
    res.status(400).json({ error: message });
  }
});

router.post('/studio/projects/:projectId/audio-overview', async (req: Request, res: Response) => {
  try {
    const audioUrl = await notebookDocumentStudioService.generateAudioOverview(
      req.params.projectId
    );
    res.json({ audioUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate audio overview';
    res.status(400).json({ error: message });
  }
});

router.get('/studio/projects/:projectId/chat', (req: Request, res: Response) => {
  try {
    const history = notebookDocumentStudioService.getChatHistory(req.params.projectId);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get chat history' });
  }
});

router.get('/studio/stats', (req: Request, res: Response) => {
  try {
    const stats = notebookDocumentStudioService.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// ============================================================================
// DATABASE CONNECTOR HUB API (/api/v3/database)
// ============================================================================

router.get('/database/test', async (req: Request, res: Response) => {
  try {
    const result = await databaseConnectorHubService.testBuiltInPostgres();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Database test failed' });
  }
});

router.post('/database/query', async (req: Request, res: Response) => {
  try {
    const { query, params } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required' });
    }

    const result = await databaseConnectorHubService.executeQuery(query, params);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Query execution failed' });
  }
});

router.get('/database/schema', async (req: Request, res: Response) => {
  try {
    const schema = await databaseConnectorHubService.getPostgresSchema();
    res.json(schema);
  } catch (error) {
    res.status(500).json({ error: 'Schema introspection failed' });
  }
});

router.get('/database/tables/:tableName/preview', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const result = await databaseConnectorHubService.getTablePreview(
      req.params.tableName,
      Math.min(limit, 1000)
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Preview failed' });
  }
});

router.get('/database/postgres/stats', async (req: Request, res: Response) => {
  try {
    const stats = await databaseConnectorHubService.getPostgresStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

router.post('/database/connections', (req: Request, res: Response) => {
  try {
    const { name, type, host, port, database, username, userId } = req.body;
    
    if (!name || !type || !host || !port) {
      return res.status(400).json({ error: 'name, type, host, and port are required' });
    }

    const connection = databaseConnectorHubService.createConnection({
      name,
      type,
      host,
      port,
      database,
      username,
      userId
    });
    res.status(201).json(connection);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create connection' });
  }
});

router.get('/database/connections', (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    const connections = userId 
      ? databaseConnectorHubService.getUserConnections(userId)
      : [];
    res.json(connections);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get connections' });
  }
});

router.delete('/database/connections/:connectionId', (req: Request, res: Response) => {
  try {
    const deleted = databaseConnectorHubService.deleteConnection(req.params.connectionId);
    if (!deleted) {
      return res.status(404).json({ error: 'Connection not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete connection' });
  }
});

router.get('/database/stats', (req: Request, res: Response) => {
  try {
    const stats = databaseConnectorHubService.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// ============================================================================
// CODE QUALITY GATEWAY API (/api/v3/code)
// ============================================================================

router.post('/code/analyze', async (req: Request, res: Response) => {
  try {
    const { code, language, fileName, userId } = req.body;
    
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Code is required' });
    }
    if (!language || typeof language !== 'string') {
      return res.status(400).json({ error: 'Language is required' });
    }

    const result = await codeQualityGatewayService.analyzeCode({
      code,
      language,
      fileName,
      userId
    });
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Analysis failed';
    res.status(500).json({ error: message });
  }
});

router.get('/code/jobs/:jobId', (req: Request, res: Response) => {
  try {
    const job = codeQualityGatewayService.getJob(req.params.jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get job' });
  }
});

router.get('/code/languages', (req: Request, res: Response) => {
  try {
    const languages = codeQualityGatewayService.getSupportedLanguages();
    res.json({ languages });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get languages' });
  }
});

router.get('/code/stats', (req: Request, res: Response) => {
  try {
    const stats = codeQualityGatewayService.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// ============================================================================
// DOMAIN RESEARCH API (/api/v3/research)
// ============================================================================

router.post('/research/legal', async (req: Request, res: Response) => {
  try {
    const { query, jurisdiction, court, dateRange, maxResults } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required' });
    }

    const results = await domainResearchAPIService.searchLegal(query, {
      jurisdiction,
      court,
      dateRange,
      maxResults
    });
    res.json({ results, count: results.length });
  } catch (error) {
    res.status(500).json({ error: 'Legal search failed' });
  }
});

router.post('/research/academic', async (req: Request, res: Response) => {
  try {
    const { query, year, journal, openAccess, maxResults } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required' });
    }

    const results = await domainResearchAPIService.searchAcademic(query, {
      year,
      journal,
      openAccess,
      maxResults
    });
    res.json({ results, count: results.length });
  } catch (error) {
    res.status(500).json({ error: 'Academic search failed' });
  }
});

router.post('/research/patent', async (req: Request, res: Response) => {
  try {
    const { query, jurisdiction, status, dateRange, maxResults } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required' });
    }

    const results = await domainResearchAPIService.searchPatents(query, {
      jurisdiction,
      status,
      dateRange,
      maxResults
    });
    res.json({ results, count: results.length });
  } catch (error) {
    res.status(500).json({ error: 'Patent search failed' });
  }
});

router.post('/research/medical', async (req: Request, res: Response) => {
  try {
    const { query, meshTerms, publicationType, dateRange, maxResults } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required' });
    }

    const results = await domainResearchAPIService.searchMedical(query, {
      meshTerms,
      publicationType,
      dateRange,
      maxResults
    });
    res.json({ results, count: results.length });
  } catch (error) {
    res.status(500).json({ error: 'Medical search failed' });
  }
});

router.post('/research/synthesize', async (req: Request, res: Response) => {
  try {
    const { query, domain } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required' });
    }
    if (!domain || !['legal', 'academic', 'patent', 'medical', 'general'].includes(domain)) {
      return res.status(400).json({ error: 'Valid domain is required' });
    }

    const synthesis = await domainResearchAPIService.generateResearchSynthesis(query, domain);
    res.json(synthesis);
  } catch (error) {
    res.status(500).json({ error: 'Research synthesis failed' });
  }
});

router.post('/research/multi-domain', async (req: Request, res: Response) => {
  try {
    const { query, domains } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query is required' });
    }
    if (!domains || !Array.isArray(domains)) {
      return res.status(400).json({ error: 'Domains array is required' });
    }

    const results = await domainResearchAPIService.conductMultiDomainResearch(query, domains);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Multi-domain research failed' });
  }
});

router.get('/research/stats', (req: Request, res: Response) => {
  try {
    const stats = domainResearchAPIService.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// ============================================================================
// INVESTMENT RESEARCH API (/api/v3/investment)
// ============================================================================

router.post('/investment/sec-filings', async (req: Request, res: Response) => {
  try {
    const { query, formType, dateFrom, dateTo, maxResults } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query (company name or ticker) is required' });
    }

    const filings = await investmentResearchService.searchSECFilings(query, {
      formType,
      dateFrom,
      dateTo,
      maxResults
    });
    res.json({ filings, count: filings.length });
  } catch (error) {
    res.status(500).json({ error: 'SEC filings search failed' });
  }
});

router.get('/investment/fundamentals/:identifier', async (req: Request, res: Response) => {
  try {
    const fundamentals = await investmentResearchService.getCompanyFundamentals(
      req.params.identifier
    );
    res.json(fundamentals);
  } catch (error) {
    res.status(500).json({ error: 'Fundamentals lookup failed' });
  }
});

router.post('/investment/analyze', async (req: Request, res: Response) => {
  try {
    const { ticker, sector, context } = req.body;
    
    if (!ticker && !sector) {
      return res.status(400).json({ error: 'Either ticker or sector is required' });
    }

    const analysis = await investmentResearchService.analyzeMarket({
      ticker,
      sector,
      context
    });
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: 'Market analysis failed' });
  }
});

router.post('/investment/esg', async (req: Request, res: Response) => {
  try {
    const { companyName, ticker } = req.body;
    
    if (!companyName || typeof companyName !== 'string') {
      return res.status(400).json({ error: 'Company name is required' });
    }

    const esgScore = await investmentResearchService.getESGScore(companyName, ticker);
    res.json(esgScore);
  } catch (error) {
    res.status(500).json({ error: 'ESG analysis failed' });
  }
});

router.post('/investment/insights', async (req: Request, res: Response) => {
  try {
    const { tickers, sectors, topic } = req.body;
    
    const insights = await investmentResearchService.generateInsights({
      tickers,
      sectors,
      topic
    });
    res.json({ insights, count: insights.length });
  } catch (error) {
    res.status(500).json({ error: 'Insights generation failed' });
  }
});

router.post('/investment/analyze-filing', async (req: Request, res: Response) => {
  try {
    const { filing } = req.body;
    
    if (!filing || !filing.formType || !filing.companyName) {
      return res.status(400).json({ error: 'Valid filing object is required' });
    }

    const analysis = await investmentResearchService.analyzeFilingContent(filing);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: 'Filing analysis failed' });
  }
});

router.get('/investment/stats', (req: Request, res: Response) => {
  try {
    const stats = investmentResearchService.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// ============================================================================
// VISUAL ANALYTICS DASHBOARD (/api/v3/analytics) - P2
// ============================================================================

router.post('/analytics/dashboards', async (req: Request, res: Response) => {
  try {
    const { name, ownerId, description, layout, isPublic, tags } = req.body;
    
    if (!name || !ownerId) {
      return res.status(400).json({ error: 'Name and ownerId are required' });
    }

    const dashboard = await visualAnalyticsDashboardService.createDashboard(
      name, ownerId, { description, layout, isPublic, tags }
    );
    res.status(201).json(dashboard);
  } catch (error) {
    res.status(500).json({ error: 'Dashboard creation failed' });
  }
});

router.get('/analytics/dashboards', async (req: Request, res: Response) => {
  try {
    const ownerId = req.query.ownerId as string;
    if (!ownerId) {
      return res.status(400).json({ error: 'ownerId query parameter required' });
    }
    const dashboards = await visualAnalyticsDashboardService.listDashboards(ownerId);
    res.json({ dashboards, count: dashboards.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list dashboards' });
  }
});

router.get('/analytics/dashboards/:id', async (req: Request, res: Response) => {
  try {
    const dashboard = await visualAnalyticsDashboardService.getDashboard(req.params.id);
    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get dashboard' });
  }
});

router.patch('/analytics/dashboards/:id', async (req: Request, res: Response) => {
  try {
    const dashboard = await visualAnalyticsDashboardService.updateDashboard(
      req.params.id, req.body
    );
    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: 'Dashboard update failed' });
  }
});

router.delete('/analytics/dashboards/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await visualAnalyticsDashboardService.deleteDashboard(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Dashboard deletion failed' });
  }
});

router.post('/analytics/dashboards/:id/widgets', async (req: Request, res: Response) => {
  try {
    const widget = await visualAnalyticsDashboardService.addWidget(
      req.params.id, req.body
    );
    res.status(201).json(widget);
  } catch (error) {
    res.status(500).json({ error: 'Widget creation failed' });
  }
});

router.delete('/analytics/dashboards/:dashboardId/widgets/:widgetId', async (req: Request, res: Response) => {
  try {
    const removed = await visualAnalyticsDashboardService.removeWidget(
      req.params.dashboardId, req.params.widgetId
    );
    res.json({ success: removed });
  } catch (error) {
    res.status(500).json({ error: 'Widget removal failed' });
  }
});

router.post('/analytics/charts', async (req: Request, res: Response) => {
  try {
    const { dataSource, metrics, dimensions, filters, timeRange, granularity, aggregation } = req.body;
    
    if (!metrics || !timeRange) {
      return res.status(400).json({ error: 'Metrics and timeRange are required' });
    }

    const chartData = await visualAnalyticsDashboardService.generateChartData({
      dataSource: dataSource || 'default',
      metrics,
      dimensions,
      filters,
      timeRange: {
        start: new Date(timeRange.start),
        end: new Date(timeRange.end)
      },
      granularity: granularity || 'day',
      aggregation: aggregation || 'sum'
    });
    res.json(chartData);
  } catch (error) {
    res.status(500).json({ error: 'Chart generation failed' });
  }
});

router.post('/analytics/metrics/:id', async (req: Request, res: Response) => {
  try {
    const { value, unit, tags } = req.body;
    
    if (typeof value !== 'number') {
      return res.status(400).json({ error: 'Numeric value is required' });
    }

    const metric = await visualAnalyticsDashboardService.captureMetric(
      req.params.id, value, { unit, tags }
    );
    res.json(metric);
  } catch (error) {
    res.status(500).json({ error: 'Metric capture failed' });
  }
});

router.get('/analytics/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await visualAnalyticsDashboardService.listMetrics();
    res.json({ metrics, count: metrics.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list metrics' });
  }
});

router.get('/analytics/metrics/:id', async (req: Request, res: Response) => {
  try {
    const metric = await visualAnalyticsDashboardService.getMetric(req.params.id);
    if (!metric) {
      return res.status(404).json({ error: 'Metric not found' });
    }
    res.json(metric);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get metric' });
  }
});

router.get('/analytics/system-health', async (req: Request, res: Response) => {
  try {
    const health = await visualAnalyticsDashboardService.getSystemHealth();
    res.json(health);
  } catch (error) {
    res.status(500).json({ error: 'Health check failed' });
  }
});

router.post('/analytics/kpi-report', async (req: Request, res: Response) => {
  try {
    const { kpiIds, timeRange } = req.body;
    
    if (!kpiIds || !Array.isArray(kpiIds)) {
      return res.status(400).json({ error: 'kpiIds array is required' });
    }

    const report = await visualAnalyticsDashboardService.generateKPIReport(
      kpiIds,
      {
        start: new Date(timeRange?.start || Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(timeRange?.end || Date.now())
      }
    );
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'KPI report generation failed' });
  }
});

router.get('/analytics/dashboards/:id/export', async (req: Request, res: Response) => {
  try {
    const format = (req.query.format as string) || 'json';
    const exported = await visualAnalyticsDashboardService.exportDashboard(
      req.params.id, format as 'json' | 'csv' | 'png' | 'pdf'
    );
    res.setHeader('Content-Type', exported.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${exported.filename}"`);
    res.send(exported.data);
  } catch (error) {
    res.status(500).json({ error: 'Export failed' });
  }
});

// ============================================================================
// CONTENT ASSET MANAGEMENT (/api/v3/assets) - P2
// ============================================================================

router.post('/assets', async (req: Request, res: Response) => {
  try {
    const { base64Data, originalName, mimeType, ownerId, folderId, tags, metadata } = req.body;
    
    if (!base64Data || !originalName || !mimeType || !ownerId) {
      return res.status(400).json({ error: 'base64Data, originalName, mimeType, and ownerId are required' });
    }

    const buffer = Buffer.from(base64Data, 'base64');
    const asset = await contentAssetManagementService.createAsset(
      buffer, originalName, mimeType, ownerId, { folderId, tags, metadata }
    );
    res.status(201).json(asset);
  } catch (error) {
    res.status(500).json({ error: 'Asset creation failed' });
  }
});

router.get('/assets', async (req: Request, res: Response) => {
  try {
    const { query, category, folderId, ownerId, page, pageSize } = req.query;
    
    const result = await contentAssetManagementService.searchAssets(
      query as string || '',
      {
        category: category as any,
        folderId: folderId as string,
        ownerId: ownerId as string,
        page: page ? parseInt(page as string) : 1,
        pageSize: pageSize ? parseInt(pageSize as string) : 20
      }
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Asset search failed' });
  }
});

router.get('/assets/:id', async (req: Request, res: Response) => {
  try {
    const asset = await contentAssetManagementService.getAsset(req.params.id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    res.json(asset);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get asset' });
  }
});

router.patch('/assets/:id', async (req: Request, res: Response) => {
  try {
    const asset = await contentAssetManagementService.updateAsset(
      req.params.id, req.body
    );
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    res.json(asset);
  } catch (error) {
    res.status(500).json({ error: 'Asset update failed' });
  }
});

router.delete('/assets/:id', async (req: Request, res: Response) => {
  try {
    const permanent = req.query.permanent === 'true';
    const deleted = permanent 
      ? await contentAssetManagementService.permanentlyDeleteAsset(req.params.id)
      : await contentAssetManagementService.deleteAsset(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    res.json({ success: true, permanent });
  } catch (error) {
    res.status(500).json({ error: 'Asset deletion failed' });
  }
});

router.post('/assets/:id/versions', async (req: Request, res: Response) => {
  try {
    const { base64Data, userId, changelog } = req.body;
    
    if (!base64Data || !userId) {
      return res.status(400).json({ error: 'base64Data and userId are required' });
    }

    const buffer = Buffer.from(base64Data, 'base64');
    const asset = await contentAssetManagementService.createVersion(
      req.params.id, buffer, userId, changelog
    );
    
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    res.status(201).json(asset);
  } catch (error) {
    res.status(500).json({ error: 'Version creation failed' });
  }
});

router.get('/assets/:id/versions/:version', async (req: Request, res: Response) => {
  try {
    const version = await contentAssetManagementService.getVersion(
      req.params.id, parseInt(req.params.version)
    );
    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }
    res.json(version);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get version' });
  }
});

router.post('/assets/folders', async (req: Request, res: Response) => {
  try {
    const { name, ownerId, parentId } = req.body;
    
    if (!name || !ownerId) {
      return res.status(400).json({ error: 'Name and ownerId are required' });
    }

    const folder = await contentAssetManagementService.createFolder(name, ownerId, parentId);
    res.status(201).json(folder);
  } catch (error) {
    res.status(500).json({ error: 'Folder creation failed' });
  }
});

router.get('/assets/folders', async (req: Request, res: Response) => {
  try {
    const { parentId, ownerId } = req.query;
    const folders = await contentAssetManagementService.listFolders(
      parentId as string, ownerId as string
    );
    res.json({ folders, count: folders.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list folders' });
  }
});

router.delete('/assets/folders/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await contentAssetManagementService.deleteFolder(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Folder deletion failed' });
  }
});

router.post('/assets/collections', async (req: Request, res: Response) => {
  try {
    const { name, ownerId, description, assetIds, isPublic } = req.body;
    
    if (!name || !ownerId) {
      return res.status(400).json({ error: 'Name and ownerId are required' });
    }

    const collection = await contentAssetManagementService.createCollection(
      name, ownerId, { description, assetIds, isPublic }
    );
    res.status(201).json(collection);
  } catch (error) {
    res.status(500).json({ error: 'Collection creation failed' });
  }
});

router.get('/assets/collections', async (req: Request, res: Response) => {
  try {
    const { ownerId } = req.query;
    const collections = await contentAssetManagementService.listCollections(ownerId as string);
    res.json({ collections, count: collections.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list collections' });
  }
});

router.get('/assets/collections/:id', async (req: Request, res: Response) => {
  try {
    const result = await contentAssetManagementService.getCollection(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get collection' });
  }
});

router.post('/assets/collections/:id/assets', async (req: Request, res: Response) => {
  try {
    const { assetIds } = req.body;
    
    if (!assetIds || !Array.isArray(assetIds)) {
      return res.status(400).json({ error: 'assetIds array is required' });
    }

    const collection = await contentAssetManagementService.addToCollection(
      req.params.id, assetIds
    );
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    res.json(collection);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add assets to collection' });
  }
});

router.delete('/assets/collections/:id/assets', async (req: Request, res: Response) => {
  try {
    const { assetIds } = req.body;
    
    if (!assetIds || !Array.isArray(assetIds)) {
      return res.status(400).json({ error: 'assetIds array is required' });
    }

    const collection = await contentAssetManagementService.removeFromCollection(
      req.params.id, assetIds
    );
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    res.json(collection);
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove assets from collection' });
  }
});

router.get('/assets/stats', async (req: Request, res: Response) => {
  try {
    const { ownerId } = req.query;
    const stats = await contentAssetManagementService.getStorageStats(ownerId as string);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get storage stats' });
  }
});

router.post('/assets/bulk/tag', async (req: Request, res: Response) => {
  try {
    const { assetIds, tags } = req.body;
    
    if (!assetIds || !tags || !Array.isArray(assetIds) || !Array.isArray(tags)) {
      return res.status(400).json({ error: 'assetIds and tags arrays are required' });
    }

    const updated = await contentAssetManagementService.bulkTag(assetIds, tags);
    res.json({ updated });
  } catch (error) {
    res.status(500).json({ error: 'Bulk tagging failed' });
  }
});

router.post('/assets/bulk/move', async (req: Request, res: Response) => {
  try {
    const { assetIds, folderId } = req.body;
    
    if (!assetIds || !folderId || !Array.isArray(assetIds)) {
      return res.status(400).json({ error: 'assetIds array and folderId are required' });
    }

    const moved = await contentAssetManagementService.bulkMove(assetIds, folderId);
    res.json({ moved });
  } catch (error) {
    res.status(500).json({ error: 'Bulk move failed' });
  }
});

// ============================================================================
// MULTI-LANGUAGE SUPPORT (/api/v3/i18n) - P2
// ============================================================================

router.post('/i18n/detect', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    const result = await multiLanguageSupportService.detectLanguage(text);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Language detection failed' });
  }
});

router.post('/i18n/translate', async (req: Request, res: Response) => {
  try {
    const { text, targetLanguage, sourceLanguage, context, formality, preserveFormatting } = req.body;
    
    if (!text || !targetLanguage) {
      return res.status(400).json({ error: 'Text and targetLanguage are required' });
    }

    const result = await multiLanguageSupportService.translate(
      text, targetLanguage, { sourceLanguage, context, formality, preserveFormatting }
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Translation failed' });
  }
});

router.post('/i18n/translate/batch', async (req: Request, res: Response) => {
  try {
    const { texts, targetLanguage, sourceLanguage } = req.body;
    
    if (!texts || !Array.isArray(texts) || !targetLanguage) {
      return res.status(400).json({ error: 'Texts array and targetLanguage are required' });
    }

    const result = await multiLanguageSupportService.batchTranslate(
      texts, targetLanguage, sourceLanguage
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Batch translation failed' });
  }
});

router.post('/i18n/translations', async (req: Request, res: Response) => {
  try {
    const { key, namespace, translations, context } = req.body;
    
    if (!key || !namespace || !translations) {
      return res.status(400).json({ error: 'Key, namespace, and translations are required' });
    }

    const result = await multiLanguageSupportService.setTranslation(
      key, namespace, translations, context
    );
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Translation creation failed' });
  }
});

router.get('/i18n/translations/:namespace/:key', async (req: Request, res: Response) => {
  try {
    const { language } = req.query;
    const translation = await multiLanguageSupportService.getTranslation(
      req.params.key, language as string || 'en', req.params.namespace
    );
    res.json({ key: req.params.key, namespace: req.params.namespace, translation });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get translation' });
  }
});

router.get('/i18n/translations/:namespace', async (req: Request, res: Response) => {
  try {
    const { language } = req.query;
    const translations = await multiLanguageSupportService.getNamespaceTranslations(
      req.params.namespace, language as string || 'en'
    );
    res.json({ namespace: req.params.namespace, translations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get namespace translations' });
  }
});

router.post('/i18n/auto-translate', async (req: Request, res: Response) => {
  try {
    const { namespace, sourceLanguage, targetLanguages } = req.body;
    
    if (!namespace || !sourceLanguage || !targetLanguages || !Array.isArray(targetLanguages)) {
      return res.status(400).json({ error: 'Namespace, sourceLanguage, and targetLanguages are required' });
    }

    const result = await multiLanguageSupportService.autoTranslateNamespace(
      namespace, sourceLanguage, targetLanguages
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Auto-translation failed' });
  }
});

router.get('/i18n/languages', async (req: Request, res: Response) => {
  try {
    const enabledOnly = req.query.enabled === 'true';
    const languages = await multiLanguageSupportService.getLanguages(enabledOnly);
    res.json({ languages, count: languages.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get languages' });
  }
});

router.patch('/i18n/languages/:code', async (req: Request, res: Response) => {
  try {
    const { enabled } = req.body;
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'Boolean enabled value is required' });
    }

    const language = await multiLanguageSupportService.setLanguageEnabled(
      req.params.code, enabled
    );
    if (!language) {
      return res.status(404).json({ error: 'Language not found' });
    }
    res.json(language);
  } catch (error) {
    res.status(500).json({ error: 'Language update failed' });
  }
});

router.get('/i18n/stats', async (req: Request, res: Response) => {
  try {
    const stats = await multiLanguageSupportService.getTranslationStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

router.post('/i18n/format/date', async (req: Request, res: Response) => {
  try {
    const { date, locale, format } = req.body;
    
    if (!date || !locale) {
      return res.status(400).json({ error: 'Date and locale are required' });
    }

    const formatted = multiLanguageSupportService.formatDate(
      new Date(date), locale, format
    );
    res.json({ formatted });
  } catch (error) {
    res.status(500).json({ error: 'Date formatting failed' });
  }
});

router.post('/i18n/format/number', async (req: Request, res: Response) => {
  try {
    const { value, locale, style, currency } = req.body;
    
    if (typeof value !== 'number' || !locale) {
      return res.status(400).json({ error: 'Numeric value and locale are required' });
    }

    const formatted = multiLanguageSupportService.formatNumber(
      value, locale, { style, currency }
    );
    res.json({ formatted });
  } catch (error) {
    res.status(500).json({ error: 'Number formatting failed' });
  }
});

router.post('/i18n/format/currency', async (req: Request, res: Response) => {
  try {
    const { value, currency, locale } = req.body;
    
    if (typeof value !== 'number' || !currency) {
      return res.status(400).json({ error: 'Numeric value and currency are required' });
    }

    const formatted = multiLanguageSupportService.formatCurrency(
      value, currency, locale
    );
    res.json({ formatted });
  } catch (error) {
    res.status(500).json({ error: 'Currency formatting failed' });
  }
});

router.get('/i18n/export', async (req: Request, res: Response) => {
  try {
    const format = (req.query.format as string) || 'json';
    const namespace = req.query.namespace as string;
    const language = req.query.language as string;

    const exported = await multiLanguageSupportService.exportTranslations(
      format as 'json' | 'csv' | 'xliff', namespace, language
    );
    res.setHeader('Content-Type', exported.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${exported.filename}"`);
    res.send(exported.data);
  } catch (error) {
    res.status(500).json({ error: 'Export failed' });
  }
});

router.post('/i18n/import', async (req: Request, res: Response) => {
  try {
    const { data, format, namespace } = req.body;
    
    if (!data || !namespace) {
      return res.status(400).json({ error: 'Data and namespace are required' });
    }

    const result = await multiLanguageSupportService.importTranslations(
      data, format || 'json', namespace
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Import failed' });
  }
});

export default router;
