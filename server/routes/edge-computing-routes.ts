/**
 * WAI SDK v2.1 Edge Computing & Security API Routes
 */

import { Router, Request, Response } from 'express';

const router = Router();

// Edge Computing Service (simulated - uses types from wai-sdk)
interface EdgeNode {
  id: string;
  region: string;
  continent: string;
  city: string;
  provider: string;
  status: string;
  latencyMs: number;
  capacity: number;
  currentLoad: number;
}

const EDGE_NODES: EdgeNode[] = [
  { id: 'edge-us-east-1', region: 'us-east-1', continent: 'North America', city: 'Ashburn, Virginia', provider: 'cloudflare', status: 'active', latencyMs: 12, capacity: 10000, currentLoad: 3500 },
  { id: 'edge-us-west-2', region: 'us-west-2', continent: 'North America', city: 'Portland, Oregon', provider: 'cloudflare', status: 'active', latencyMs: 18, capacity: 8000, currentLoad: 2800 },
  { id: 'edge-eu-west-1', region: 'eu-west-1', continent: 'Europe', city: 'Dublin, Ireland', provider: 'cloudflare', status: 'active', latencyMs: 25, capacity: 9000, currentLoad: 4200 },
  { id: 'edge-eu-central-1', region: 'eu-central-1', continent: 'Europe', city: 'Frankfurt, Germany', provider: 'fastly', status: 'active', latencyMs: 22, capacity: 8500, currentLoad: 3800 },
  { id: 'edge-ap-south-1', region: 'ap-south-1', continent: 'Asia', city: 'Mumbai, India', provider: 'cloudflare', status: 'active', latencyMs: 35, capacity: 7000, currentLoad: 5200 },
  { id: 'edge-ap-southeast-1', region: 'ap-southeast-1', continent: 'Asia', city: 'Singapore', provider: 'cloudflare', status: 'active', latencyMs: 28, capacity: 8000, currentLoad: 4500 },
  { id: 'edge-ap-northeast-1', region: 'ap-northeast-1', continent: 'Asia', city: 'Tokyo, Japan', provider: 'fastly', status: 'active', latencyMs: 20, capacity: 9500, currentLoad: 6100 },
  { id: 'edge-ap-northeast-2', region: 'ap-northeast-2', continent: 'Asia', city: 'Seoul, South Korea', provider: 'cloudflare', status: 'active', latencyMs: 24, capacity: 7500, currentLoad: 4800 },
  { id: 'edge-sa-east-1', region: 'sa-east-1', continent: 'South America', city: 'São Paulo, Brazil', provider: 'cloudflare', status: 'active', latencyMs: 45, capacity: 5000, currentLoad: 2100 },
  { id: 'edge-af-south-1', region: 'af-south-1', continent: 'Africa', city: 'Cape Town, South Africa', provider: 'cloudflare', status: 'active', latencyMs: 55, capacity: 4000, currentLoad: 1200 },
  { id: 'edge-me-south-1', region: 'me-south-1', continent: 'Middle East', city: 'Dubai, UAE', provider: 'cloudflare', status: 'active', latencyMs: 40, capacity: 5500, currentLoad: 2800 },
  { id: 'edge-au-southeast-1', region: 'ap-southeast-2', continent: 'Oceania', city: 'Sydney, Australia', provider: 'cloudflare', status: 'active', latencyMs: 32, capacity: 6000, currentLoad: 3200 }
];

// GET /api/edge/nodes - List all edge nodes
router.get('/nodes', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      nodes: EDGE_NODES,
      total: EDGE_NODES.length,
      activeNodes: EDGE_NODES.filter(n => n.status === 'active').length,
      continents: [...new Set(EDGE_NODES.map(n => n.continent))].length
    }
  });
});

// GET /api/edge/nodes/:nodeId - Get specific node
router.get('/nodes/:nodeId', (req: Request, res: Response) => {
  const node = EDGE_NODES.find(n => n.id === req.params.nodeId);
  if (!node) {
    return res.status(404).json({ success: false, error: 'Node not found' });
  }
  res.json({ success: true, data: node });
});

// GET /api/edge/metrics - Global edge metrics
router.get('/metrics', (_req: Request, res: Response) => {
  const activeNodes = EDGE_NODES.filter(n => n.status === 'active');
  const avgLatency = activeNodes.reduce((sum, n) => sum + n.latencyMs, 0) / activeNodes.length;
  const totalCapacity = EDGE_NODES.reduce((sum, n) => sum + n.capacity, 0);
  const currentLoad = EDGE_NODES.reduce((sum, n) => sum + n.currentLoad, 0);

  res.json({
    success: true,
    data: {
      totalNodes: EDGE_NODES.length,
      activeNodes: activeNodes.length,
      avgLatencyMs: Math.round(avgLatency * 100) / 100,
      totalCapacity,
      currentLoad,
      utilizationPercent: Math.round((currentLoad / totalCapacity) * 10000) / 100,
      cacheHitRate: 0.82,
      requestsPerSecond: 15000 + Math.floor(Math.random() * 5000),
      bandwidthGbps: 2.5 + Math.random() * 1.5
    }
  });
});

// GET /api/edge/regions - List regions with nodes
router.get('/regions', (_req: Request, res: Response) => {
  const regionMap = new Map<string, EdgeNode[]>();
  EDGE_NODES.forEach(node => {
    const nodes = regionMap.get(node.continent) || [];
    nodes.push(node);
    regionMap.set(node.continent, nodes);
  });

  const regions = Array.from(regionMap.entries()).map(([continent, nodes]) => ({
    continent,
    nodeCount: nodes.length,
    avgLatency: Math.round(nodes.reduce((sum, n) => sum + n.latencyMs, 0) / nodes.length),
    totalCapacity: nodes.reduce((sum, n) => sum + n.capacity, 0),
    cities: nodes.map(n => n.city)
  }));

  res.json({ success: true, data: regions });
});

// POST /api/edge/route - Get optimal edge node for request
router.post('/route', (req: Request, res: Response) => {
  const { clientRegion, preferLowLatency = true } = req.body;

  let candidates = EDGE_NODES.filter(n => n.status === 'active');

  if (clientRegion) {
    const sameContinent = candidates.filter(n => 
      n.continent.toLowerCase().includes(clientRegion.toLowerCase()) ||
      n.region.includes(clientRegion)
    );
    if (sameContinent.length > 0) {
      candidates = sameContinent;
    }
  }

  const sorted = candidates.sort((a, b) => {
    if (preferLowLatency) {
      return a.latencyMs - b.latencyMs;
    }
    return (b.capacity - b.currentLoad) - (a.capacity - a.currentLoad);
  });

  res.json({
    success: true,
    data: {
      selectedNode: sorted[0],
      alternatives: sorted.slice(1, 3),
      routingStrategy: preferLowLatency ? 'latency' : 'capacity'
    }
  });
});

// GET /api/edge/cdn/config - CDN configuration
router.get('/cdn/config', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      provider: 'cloudflare',
      zones: [
        {
          id: 'zone-main',
          name: 'WAI SDK Production',
          domain: 'wai-sdk.app',
          ssl: true,
          http2: true,
          http3: true,
          status: 'active'
        }
      ],
      caching: {
        browserTtl: 3600,
        edgeTtl: 86400,
        cacheEverything: false,
        respectOriginHeaders: true
      },
      optimization: {
        imageOptimization: true,
        imageFormat: 'auto',
        brotli: true,
        earlyHints: true
      },
      security: {
        waf: true,
        ddosProtection: true,
        ssl: 'strict',
        minTlsVersion: '1.2'
      }
    }
  });
});

// POST /api/edge/cdn/purge - Purge CDN cache
router.post('/cdn/purge', (req: Request, res: Response) => {
  const { patterns } = req.body;
  
  res.json({
    success: true,
    data: {
      purged: patterns?.length || 1000,
      message: patterns 
        ? `Purged cache for ${patterns.length} patterns`
        : 'Full cache purge initiated'
    }
  });
});

export default router;
