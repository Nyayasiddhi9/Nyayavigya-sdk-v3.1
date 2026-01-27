import { Router, Request, Response } from 'express';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';

declare module 'archiver';

const router = Router();

const SDK_BUILDS = {
  'wai-sdk-v3.1': {
    name: 'WAI SDK v3.1',
    version: '3.1.0',
    description: 'Universal Enterprise AI Orchestration Platform',
    agents: 257,
    providers: 23,
    features: ['P0', 'P1', 'P2'],
    path: 'builds/wai-sdk-v3.1'
  },
  'nyayavighya-sdk-v3.1': {
    name: 'NyayaVighya Legal SDK v3.1',
    version: '3.1.0',
    description: 'Specialized Legal AI Platform for Indian Law',
    agents: 275,
    categories: 29,
    statutes: 50,
    languages: 23,
    path: 'builds/nyayavighya-sdk-v3.1'
  }
};

router.get('/list', (req: Request, res: Response) => {
  const builds = Object.entries(SDK_BUILDS).map(([id, info]) => ({
    id,
    ...info,
    downloadUrl: `/api/sdk-builds/download/${id}`
  }));

  res.json({
    success: true,
    data: {
      builds,
      totalBuilds: builds.length
    }
  });
});

router.get('/download/:buildId', async (req: Request, res: Response) => {
  const { buildId } = req.params;
  const buildInfo = SDK_BUILDS[buildId as keyof typeof SDK_BUILDS];

  if (!buildInfo) {
    res.status(404).json({ error: 'Build not found' });
    return;
  }

  const buildPath = path.resolve(buildInfo.path);
  
  if (!fs.existsSync(buildPath)) {
    res.status(404).json({ error: 'Build files not found' });
    return;
  }

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${buildId}.zip"`);

  const archive = archiver('zip', { zlib: { level: 9 } });
  
  archive.on('error', (err: Error) => {
    console.error('Archive error:', err);
    res.status(500).json({ error: 'Failed to create archive' });
  });

  archive.pipe(res);
  archive.directory(buildPath, buildId);
  archive.finalize();
});

router.get('/info/:buildId', (req: Request, res: Response) => {
  const { buildId } = req.params;
  const buildInfo = SDK_BUILDS[buildId as keyof typeof SDK_BUILDS];

  if (!buildInfo) {
    res.status(404).json({ error: 'Build not found' });
    return;
  }

  res.json({
    success: true,
    data: {
      id: buildId,
      ...buildInfo,
      downloadUrl: `/api/sdk-builds/download/${buildId}`,
      documentation: `/api/sdk-builds/docs/${buildId}`
    }
  });
});

export { router as sdkBuildsRouter };
