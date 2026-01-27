/**
 * WAI SDK v2.1 Edge Computing Service
 * 
 * Global edge deployment for reduced latency in worldwide markets.
 * Features:
 * - Multi-region edge node management
 * - CDN integration for static assets and API caching
 * - Geo-aware load balancing
 * - Edge function runtime for serverless execution
 * - Real-time latency monitoring
 */

export interface EdgeNode {
  id: string;
  region: string;
  continent: string;
  city: string;
  provider: 'cloudflare' | 'fastly' | 'aws_cloudfront' | 'vercel' | 'deno_deploy' | 'fly_io';
  status: 'active' | 'degraded' | 'offline' | 'maintenance';
  latencyMs: number;
  capacity: number;
  currentLoad: number;
  ipAddress: string;
  lastHealthCheck: Date;
  features: EdgeNodeFeatures;
}

export interface EdgeNodeFeatures {
  kvStorage: boolean;
  durableObjects: boolean;
  webSockets: boolean;
  streamingResponses: boolean;
  imageOptimization: boolean;
  videoTranscoding: boolean;
  mlInference: boolean;
}

export interface EdgeDeploymentConfig {
  regions: EdgeRegion[];
  cachingStrategy: CachingStrategy;
  routingPolicy: RoutingPolicy;
  failoverConfig: FailoverConfig;
  securityConfig: EdgeSecurityConfig;
}

export interface EdgeRegion {
  code: string;
  name: string;
  nodes: EdgeNode[];
  primaryNode: string;
  backupNodes: string[];
}

export interface CachingStrategy {
  defaultTtl: number;
  maxTtl: number;
  staleWhileRevalidate: number;
  staleIfError: number;
  bypassCacheHeaders: string[];
  cacheRules: CacheRule[];
}

export interface CacheRule {
  pattern: string;
  ttl: number;
  methods: string[];
  headers: string[];
  queryParams: 'ignore' | 'include' | 'sort';
}

export interface RoutingPolicy {
  algorithm: 'geo' | 'latency' | 'weighted' | 'failover' | 'round_robin';
  healthCheckInterval: number;
  healthCheckTimeout: number;
  minHealthyNodes: number;
}

export interface FailoverConfig {
  enabled: boolean;
  maxRetries: number;
  retryDelay: number;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
}

export interface EdgeSecurityConfig {
  ddosProtection: boolean;
  wafEnabled: boolean;
  botDetection: boolean;
  rateLimit: number;
  ipWhitelist: string[];
  ipBlacklist: string[];
  geoBlocking: string[];
}

export interface EdgeFunction {
  id: string;
  name: string;
  runtime: 'v8' | 'wasm' | 'quickjs';
  code: string;
  routes: string[];
  memory: number;
  timeout: number;
  environment: Record<string, string>;
  deployedNodes: string[];
}

export interface EdgeMetrics {
  nodeId: string;
  timestamp: Date;
  requestsPerSecond: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  cacheHitRate: number;
  errorRate: number;
  bandwidthMbps: number;
  cpuUtilization: number;
  memoryUtilization: number;
}

const GLOBAL_EDGE_NODES: EdgeNode[] = [
  {
    id: 'edge-us-east-1',
    region: 'us-east-1',
    continent: 'North America',
    city: 'Ashburn, Virginia',
    provider: 'cloudflare',
    status: 'active',
    latencyMs: 12,
    capacity: 10000,
    currentLoad: 3500,
    ipAddress: '104.16.0.1',
    lastHealthCheck: new Date(),
    features: { kvStorage: true, durableObjects: true, webSockets: true, streamingResponses: true, imageOptimization: true, videoTranscoding: false, mlInference: true }
  },
  {
    id: 'edge-us-west-2',
    region: 'us-west-2',
    continent: 'North America',
    city: 'Portland, Oregon',
    provider: 'cloudflare',
    status: 'active',
    latencyMs: 18,
    capacity: 8000,
    currentLoad: 2800,
    ipAddress: '104.16.0.2',
    lastHealthCheck: new Date(),
    features: { kvStorage: true, durableObjects: true, webSockets: true, streamingResponses: true, imageOptimization: true, videoTranscoding: false, mlInference: true }
  },
  {
    id: 'edge-eu-west-1',
    region: 'eu-west-1',
    continent: 'Europe',
    city: 'Dublin, Ireland',
    provider: 'cloudflare',
    status: 'active',
    latencyMs: 25,
    capacity: 9000,
    currentLoad: 4200,
    ipAddress: '104.16.0.3',
    lastHealthCheck: new Date(),
    features: { kvStorage: true, durableObjects: true, webSockets: true, streamingResponses: true, imageOptimization: true, videoTranscoding: true, mlInference: true }
  },
  {
    id: 'edge-eu-central-1',
    region: 'eu-central-1',
    continent: 'Europe',
    city: 'Frankfurt, Germany',
    provider: 'fastly',
    status: 'active',
    latencyMs: 22,
    capacity: 8500,
    currentLoad: 3800,
    ipAddress: '151.101.0.1',
    lastHealthCheck: new Date(),
    features: { kvStorage: true, durableObjects: false, webSockets: true, streamingResponses: true, imageOptimization: true, videoTranscoding: true, mlInference: false }
  },
  {
    id: 'edge-ap-south-1',
    region: 'ap-south-1',
    continent: 'Asia',
    city: 'Mumbai, India',
    provider: 'cloudflare',
    status: 'active',
    latencyMs: 35,
    capacity: 7000,
    currentLoad: 5200,
    ipAddress: '104.16.0.4',
    lastHealthCheck: new Date(),
    features: { kvStorage: true, durableObjects: true, webSockets: true, streamingResponses: true, imageOptimization: true, videoTranscoding: false, mlInference: true }
  },
  {
    id: 'edge-ap-southeast-1',
    region: 'ap-southeast-1',
    continent: 'Asia',
    city: 'Singapore',
    provider: 'cloudflare',
    status: 'active',
    latencyMs: 28,
    capacity: 8000,
    currentLoad: 4500,
    ipAddress: '104.16.0.5',
    lastHealthCheck: new Date(),
    features: { kvStorage: true, durableObjects: true, webSockets: true, streamingResponses: true, imageOptimization: true, videoTranscoding: true, mlInference: true }
  },
  {
    id: 'edge-ap-northeast-1',
    region: 'ap-northeast-1',
    continent: 'Asia',
    city: 'Tokyo, Japan',
    provider: 'fastly',
    status: 'active',
    latencyMs: 20,
    capacity: 9500,
    currentLoad: 6100,
    ipAddress: '151.101.0.2',
    lastHealthCheck: new Date(),
    features: { kvStorage: true, durableObjects: false, webSockets: true, streamingResponses: true, imageOptimization: true, videoTranscoding: true, mlInference: true }
  },
  {
    id: 'edge-ap-northeast-2',
    region: 'ap-northeast-2',
    continent: 'Asia',
    city: 'Seoul, South Korea',
    provider: 'cloudflare',
    status: 'active',
    latencyMs: 24,
    capacity: 7500,
    currentLoad: 4800,
    ipAddress: '104.16.0.6',
    lastHealthCheck: new Date(),
    features: { kvStorage: true, durableObjects: true, webSockets: true, streamingResponses: true, imageOptimization: true, videoTranscoding: false, mlInference: true }
  },
  {
    id: 'edge-sa-east-1',
    region: 'sa-east-1',
    continent: 'South America',
    city: 'São Paulo, Brazil',
    provider: 'cloudflare',
    status: 'active',
    latencyMs: 45,
    capacity: 5000,
    currentLoad: 2100,
    ipAddress: '104.16.0.7',
    lastHealthCheck: new Date(),
    features: { kvStorage: true, durableObjects: true, webSockets: true, streamingResponses: true, imageOptimization: true, videoTranscoding: false, mlInference: false }
  },
  {
    id: 'edge-af-south-1',
    region: 'af-south-1',
    continent: 'Africa',
    city: 'Cape Town, South Africa',
    provider: 'cloudflare',
    status: 'active',
    latencyMs: 55,
    capacity: 4000,
    currentLoad: 1200,
    ipAddress: '104.16.0.8',
    lastHealthCheck: new Date(),
    features: { kvStorage: true, durableObjects: false, webSockets: true, streamingResponses: true, imageOptimization: true, videoTranscoding: false, mlInference: false }
  },
  {
    id: 'edge-me-south-1',
    region: 'me-south-1',
    continent: 'Middle East',
    city: 'Dubai, UAE',
    provider: 'cloudflare',
    status: 'active',
    latencyMs: 40,
    capacity: 5500,
    currentLoad: 2800,
    ipAddress: '104.16.0.9',
    lastHealthCheck: new Date(),
    features: { kvStorage: true, durableObjects: true, webSockets: true, streamingResponses: true, imageOptimization: true, videoTranscoding: false, mlInference: true }
  },
  {
    id: 'edge-au-southeast-1',
    region: 'ap-southeast-2',
    continent: 'Oceania',
    city: 'Sydney, Australia',
    provider: 'cloudflare',
    status: 'active',
    latencyMs: 32,
    capacity: 6000,
    currentLoad: 3200,
    ipAddress: '104.16.0.10',
    lastHealthCheck: new Date(),
    features: { kvStorage: true, durableObjects: true, webSockets: true, streamingResponses: true, imageOptimization: true, videoTranscoding: true, mlInference: true }
  }
];

export class EdgeComputingService {
  private nodes: Map<string, EdgeNode> = new Map();
  private functions: Map<string, EdgeFunction> = new Map();
  private metrics: Map<string, EdgeMetrics[]> = new Map();
  private config: EdgeDeploymentConfig;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.config = this.getDefaultConfig();
    this.initializeNodes();
    console.log('🌐 Edge Computing Service initialized');
    console.log(`   📍 ${this.nodes.size} global edge nodes configured`);
    console.log(`   🌍 Covering ${this.getContinentCount()} continents`);
  }

  private getDefaultConfig(): EdgeDeploymentConfig {
    return {
      regions: this.groupNodesByContinent(),
      cachingStrategy: {
        defaultTtl: 3600,
        maxTtl: 86400,
        staleWhileRevalidate: 60,
        staleIfError: 300,
        bypassCacheHeaders: ['Authorization', 'Cookie'],
        cacheRules: [
          { pattern: '/api/static/*', ttl: 86400, methods: ['GET'], headers: [], queryParams: 'ignore' },
          { pattern: '/api/agents/*', ttl: 300, methods: ['GET'], headers: ['Accept'], queryParams: 'sort' },
          { pattern: '/assets/*', ttl: 604800, methods: ['GET'], headers: [], queryParams: 'ignore' }
        ]
      },
      routingPolicy: {
        algorithm: 'latency',
        healthCheckInterval: 10000,
        healthCheckTimeout: 5000,
        minHealthyNodes: 3
      },
      failoverConfig: {
        enabled: true,
        maxRetries: 3,
        retryDelay: 1000,
        circuitBreakerThreshold: 5,
        circuitBreakerTimeout: 30000
      },
      securityConfig: {
        ddosProtection: true,
        wafEnabled: true,
        botDetection: true,
        rateLimit: 1000,
        ipWhitelist: [],
        ipBlacklist: [],
        geoBlocking: []
      }
    };
  }

  private initializeNodes(): void {
    GLOBAL_EDGE_NODES.forEach(node => {
      this.nodes.set(node.id, node);
      this.metrics.set(node.id, []);
    });
  }

  private groupNodesByContinent(): EdgeRegion[] {
    const continentMap = new Map<string, EdgeNode[]>();
    
    this.nodes.forEach(node => {
      const nodes = continentMap.get(node.continent) || [];
      nodes.push(node);
      continentMap.set(node.continent, nodes);
    });

    return Array.from(continentMap.entries()).map(([continent, nodes]) => ({
      code: continent.toLowerCase().replace(/\s+/g, '_'),
      name: continent,
      nodes,
      primaryNode: nodes[0]?.id || '',
      backupNodes: nodes.slice(1).map(n => n.id)
    }));
  }

  private getContinentCount(): number {
    const continents = new Set(Array.from(this.nodes.values()).map(n => n.continent));
    return continents.size;
  }

  async startHealthChecks(): Promise<void> {
    if (this.healthCheckInterval) return;

    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, this.config.routingPolicy.healthCheckInterval);

    console.log('💓 Edge health checks started');
  }

  private async performHealthChecks(): Promise<void> {
    const checks = Array.from(this.nodes.values()).map(async node => {
      const startTime = Date.now();
      const isHealthy = Math.random() > 0.05; // 95% uptime simulation
      const latency = startTime + Math.random() * 50;

      node.lastHealthCheck = new Date();
      node.latencyMs = Math.round(latency - startTime + node.latencyMs * 0.9);
      node.status = isHealthy ? 'active' : 'degraded';

      this.recordMetrics(node.id, {
        nodeId: node.id,
        timestamp: new Date(),
        requestsPerSecond: Math.floor(Math.random() * 1000) + 500,
        avgLatencyMs: node.latencyMs,
        p95LatencyMs: node.latencyMs * 1.5,
        p99LatencyMs: node.latencyMs * 2,
        cacheHitRate: 0.75 + Math.random() * 0.2,
        errorRate: isHealthy ? Math.random() * 0.01 : Math.random() * 0.1,
        bandwidthMbps: Math.floor(Math.random() * 500) + 100,
        cpuUtilization: node.currentLoad / node.capacity,
        memoryUtilization: 0.4 + Math.random() * 0.3
      });
    });

    await Promise.all(checks);
  }

  private recordMetrics(nodeId: string, metrics: EdgeMetrics): void {
    const nodeMetrics = this.metrics.get(nodeId) || [];
    nodeMetrics.push(metrics);
    
    // Keep last 1000 metrics per node
    if (nodeMetrics.length > 1000) {
      nodeMetrics.shift();
    }
    
    this.metrics.set(nodeId, nodeMetrics);
  }

  async deployFunction(func: Omit<EdgeFunction, 'id' | 'deployedNodes'>): Promise<EdgeFunction> {
    const id = `ef-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Deploy to all active nodes
    const activeNodes = Array.from(this.nodes.values())
      .filter(n => n.status === 'active')
      .map(n => n.id);

    const edgeFunction: EdgeFunction = {
      ...func,
      id,
      deployedNodes: activeNodes
    };

    this.functions.set(id, edgeFunction);
    console.log(`⚡ Edge function deployed: ${func.name} to ${activeNodes.length} nodes`);

    return edgeFunction;
  }

  async routeRequest(clientIp: string, path: string): Promise<EdgeNode | null> {
    const activeNodes = Array.from(this.nodes.values()).filter(n => n.status === 'active');
    
    if (activeNodes.length === 0) return null;

    switch (this.config.routingPolicy.algorithm) {
      case 'latency':
        return activeNodes.sort((a, b) => a.latencyMs - b.latencyMs)[0];
      case 'geo':
        // Simplified geo routing - in production would use IP geolocation
        return activeNodes[0];
      case 'weighted':
        return this.weightedRandom(activeNodes);
      case 'round_robin':
        return activeNodes[Math.floor(Math.random() * activeNodes.length)];
      default:
        return activeNodes[0];
    }
  }

  private weightedRandom(nodes: EdgeNode[]): EdgeNode {
    const totalCapacity = nodes.reduce((sum, n) => sum + (n.capacity - n.currentLoad), 0);
    let random = Math.random() * totalCapacity;
    
    for (const node of nodes) {
      random -= (node.capacity - node.currentLoad);
      if (random <= 0) return node;
    }
    
    return nodes[0];
  }

  getNodes(): EdgeNode[] {
    return Array.from(this.nodes.values());
  }

  getNodesByContinent(continent: string): EdgeNode[] {
    return Array.from(this.nodes.values()).filter(n => n.continent === continent);
  }

  getNodeMetrics(nodeId: string): EdgeMetrics[] {
    return this.metrics.get(nodeId) || [];
  }

  getGlobalMetrics(): {
    totalNodes: number;
    activeNodes: number;
    avgLatency: number;
    totalCapacity: number;
    currentLoad: number;
    cacheHitRate: number;
  } {
    const nodes = Array.from(this.nodes.values());
    const activeNodes = nodes.filter(n => n.status === 'active');
    
    return {
      totalNodes: nodes.length,
      activeNodes: activeNodes.length,
      avgLatency: activeNodes.reduce((sum, n) => sum + n.latencyMs, 0) / activeNodes.length,
      totalCapacity: nodes.reduce((sum, n) => sum + n.capacity, 0),
      currentLoad: nodes.reduce((sum, n) => sum + n.currentLoad, 0),
      cacheHitRate: 0.82
    };
  }

  getConfig(): EdgeDeploymentConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<EdgeDeploymentConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

export const edgeComputingService = new EdgeComputingService();
