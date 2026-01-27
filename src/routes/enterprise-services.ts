import { Router, Request, Response } from 'express';
import { services } from '../services';
import { z } from 'zod';

const router = Router();

const searchSchema = z.object({
  query: z.string().min(1).max(500),
  providers: z.array(z.string()).optional(),
  maxResults: z.number().min(1).max(100).optional()
});

router.post('/web-search/search', async (req: Request, res: Response) => {
  try {
    const validated = searchSchema.parse(req.body);
    const results = await services.webSearch.search(validated);
    res.json({ success: true, data: results });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/documents/process', async (req: Request, res: Response) => {
  try {
    const { document, options } = req.body;
    const result = await services.documentProcessing.process(document, options);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/notebook/projects', async (req: Request, res: Response) => {
  try {
    const { name, documents } = req.body;
    const project = await services.notebookLLM.createProject(name, documents);
    res.json({ success: true, data: project });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/scrape', async (req: Request, res: Response) => {
  try {
    const { url, options } = req.body;
    const result = await services.webScraping.scrape(url, options);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/database/query', async (req: Request, res: Response) => {
  try {
    const { connectionId, query, params } = req.body;
    const result = await services.databaseConnector.query(connectionId, query, params);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/code/analyze', async (req: Request, res: Response) => {
  try {
    const { code, language, options } = req.body;
    const analysis = await services.codeQuality.analyze(code, language, options);
    res.json({ success: true, data: analysis });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/research/:domain', async (req: Request, res: Response) => {
  try {
    const { domain } = req.params;
    const { query, options } = req.body;
    const results = await services.domainResearch.research(domain, query, options);
    res.json({ success: true, data: results });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/investment/analyze', async (req: Request, res: Response) => {
  try {
    const { symbol, analysisType, options } = req.body;
    const analysis = await services.investmentResearch.analyze(symbol, analysisType, options);
    res.json({ success: true, data: analysis });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/financial/quote/:symbol', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const quote = await services.financialData.getQuote(symbol);
    res.json({ success: true, data: quote });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/multimedia/process', async (req: Request, res: Response) => {
  try {
    const { type, data, options } = req.body;
    const result = await services.multimedia.process(type, data, options);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/analytics/dashboards', async (req: Request, res: Response) => {
  try {
    const { name, description, widgets } = req.body;
    const dashboard = await services.visualAnalytics.createDashboard(name, description, widgets);
    res.json({ success: true, data: dashboard });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/analytics/dashboards', async (req: Request, res: Response) => {
  try {
    const dashboards = await services.visualAnalytics.getDashboards();
    res.json({ success: true, data: dashboards });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/assets', async (req: Request, res: Response) => {
  try {
    const { name, type, content, folderId, metadata } = req.body;
    const asset = await services.contentAsset.createAsset(name, type, content, folderId, metadata);
    res.json({ success: true, data: asset });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/assets', async (req: Request, res: Response) => {
  try {
    const { folderId, type } = req.query;
    const assets = await services.contentAsset.getAssets(folderId as string, type as string);
    res.json({ success: true, data: assets });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/translate', async (req: Request, res: Response) => {
  try {
    const { text, targetLanguage, sourceLanguage } = req.body;
    const translation = await services.multiLanguage.translate(text, targetLanguage, sourceLanguage);
    res.json({ success: true, data: translation });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/detect-language', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    const detected = await services.multiLanguage.detectLanguage(text);
    res.json({ success: true, data: detected });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/services/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      p0: [
        { name: 'Web Search', status: 'operational', endpoints: 3 },
        { name: 'Document Processing', status: 'operational', endpoints: 5 },
        { name: 'NotebookLLM Studio', status: 'operational', endpoints: 7 },
        { name: 'Web Scraping', status: 'operational', endpoints: 4 },
        { name: 'Database Connectors', status: 'operational', endpoints: 6 }
      ],
      p1: [
        { name: 'Code Quality', status: 'operational', endpoints: 5 },
        { name: 'Domain Research', status: 'operational', endpoints: 8 },
        { name: 'Investment Research', status: 'operational', endpoints: 6 },
        { name: 'Financial Data', status: 'operational', endpoints: 5 },
        { name: 'Multimedia API', status: 'operational', endpoints: 7 }
      ],
      p2: [
        { name: 'Visual Analytics', status: 'operational', endpoints: 8 },
        { name: 'Content Assets', status: 'operational', endpoints: 10 },
        { name: 'Multi-language', status: 'operational', endpoints: 5 }
      ]
    }
  });
});

export { router as enterpriseServicesRouter };
