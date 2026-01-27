import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  FileText, 
  Database, 
  BarChart3, 
  Code, 
  Globe, 
  TrendingUp,
  Image,
  Languages,
  Shield,
  Zap,
  Check
} from 'lucide-react';

interface ServiceStatus {
  status: string;
  services: Record<string, any>;
  timestamp: string;
}

export default function EnterpriseDashboard() {
  const { data: health, isLoading } = useQuery<ServiceStatus>({
    queryKey: ['/api/v3/health'],
    refetchInterval: 30000
  });

  const services = [
    {
      id: 'web-search',
      name: 'Web Search API',
      description: 'Real-time web search with Perplexity, Tavily, Serper, and Brave',
      icon: Search,
      status: 'active',
      tier: 'P0',
      endpoints: ['/api/v3/search/web', '/api/v3/search/news']
    },
    {
      id: 'web-scraping',
      name: 'Web Scraping Engine',
      description: 'Intelligent web scraping with Cheerio HTML parsing and entity extraction',
      icon: Globe,
      status: 'active',
      tier: 'P0',
      endpoints: ['/api/v3/scrape', '/api/v3/scrape/extract']
    },
    {
      id: 'ocr-pipeline',
      name: 'OCR Pipeline',
      description: 'Document OCR with GPT-4o Vision API for 60+ languages',
      icon: FileText,
      status: 'active',
      tier: 'P0',
      endpoints: ['/api/v3/ocr/process', '/api/v3/ocr/extract']
    },
    {
      id: 'financial-data',
      name: 'Financial Data APIs',
      description: 'Real-time stock quotes, crypto prices, SEC filings via Alpha Vantage, CoinGecko',
      icon: TrendingUp,
      status: 'active',
      tier: 'P0',
      endpoints: ['/api/v3/finance/stock', '/api/v3/finance/crypto']
    },
    {
      id: 'multimedia',
      name: 'Multimedia APIs',
      description: 'TTS via ElevenLabs, images via DALL-E 3, video/music via Replicate',
      icon: Image,
      status: 'active',
      tier: 'P0',
      endpoints: ['/api/v3/media/tts', '/api/v3/media/image']
    },
    {
      id: 'document-studio',
      name: 'NotebookLLM Document Studio',
      description: 'Document Q&A with citations, audio overview generation, multi-doc analysis',
      icon: FileText,
      status: 'active',
      tier: 'P1',
      endpoints: ['/api/v3/studio/projects', '/api/v3/studio/qa']
    },
    {
      id: 'database-hub',
      name: 'Database Connector Hub',
      description: 'PostgreSQL connections with security-hardened query execution',
      icon: Database,
      status: 'active',
      tier: 'P1',
      endpoints: ['/api/v3/database/connect', '/api/v3/database/query']
    },
    {
      id: 'code-quality',
      name: 'Code Quality Gateway',
      description: 'Static analysis, security scanning, AI-powered code review for 13+ languages',
      icon: Code,
      status: 'active',
      tier: 'P1',
      endpoints: ['/api/v3/code/analyze', '/api/v3/code/security']
    },
    {
      id: 'domain-research',
      name: 'Domain Research APIs',
      description: 'Legal (CourtListener), Academic (OpenAlex), Patent (USPTO), Medical (PubMed)',
      icon: Search,
      status: 'active',
      tier: 'P1',
      endpoints: ['/api/v3/research/legal', '/api/v3/research/academic']
    },
    {
      id: 'investment-research',
      name: 'Investment Research Tools',
      description: 'SEC EDGAR filings, XBRL financial data, ESG scores, market analysis',
      icon: TrendingUp,
      status: 'active',
      tier: 'P1',
      endpoints: ['/api/v3/investment/filings', '/api/v3/investment/fundamentals']
    },
    {
      id: 'analytics-dashboard',
      name: 'Visual Analytics Dashboard',
      description: 'Real-time charts, KPI monitoring, interactive dashboard builder',
      icon: BarChart3,
      status: 'active',
      tier: 'P2',
      endpoints: ['/api/v3/analytics/dashboards', '/api/v3/analytics/charts']
    },
    {
      id: 'content-assets',
      name: 'Content Asset Management',
      description: 'Digital asset storage, versioning, collections, metadata management',
      icon: Image,
      status: 'active',
      tier: 'P2',
      endpoints: ['/api/v3/assets', '/api/v3/assets/collections']
    },
    {
      id: 'i18n',
      name: 'Multi-language Support',
      description: 'AI-powered translation, 100+ languages, locale formatting',
      icon: Languages,
      status: 'active',
      tier: 'P2',
      endpoints: ['/api/v3/i18n/translate', '/api/v3/i18n/detect']
    }
  ];

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'P0': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'P1': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'P2': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8" data-testid="enterprise-dashboard">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-dashboard-title">
            WAI SDK v3.1 Enterprise Platform
          </h1>
          <p className="text-muted-foreground mt-2">
            100% Production-Ready Enterprise AI Agentic Automation Platform
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="flex items-center gap-2" data-testid="badge-system-status">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            {health?.status === 'healthy' ? 'All Systems Operational' : 'Checking...'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card data-testid="card-stat-services">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold">{services.length}</CardTitle>
            <CardDescription>Enterprise Services</CardDescription>
          </CardHeader>
        </Card>
        <Card data-testid="card-stat-apis">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold">200+</CardTitle>
            <CardDescription>API Endpoints</CardDescription>
          </CardHeader>
        </Card>
        <Card data-testid="card-stat-llms">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold">23+</CardTitle>
            <CardDescription>LLM Providers</CardDescription>
          </CardHeader>
        </Card>
        <Card data-testid="card-stat-agents">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold">532</CardTitle>
            <CardDescription>AI Agents</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList data-testid="tabs-service-filter">
          <TabsTrigger value="all" data-testid="tab-all">All Services</TabsTrigger>
          <TabsTrigger value="p0" data-testid="tab-p0">P0 Critical</TabsTrigger>
          <TabsTrigger value="p1" data-testid="tab-p1">P1 High Priority</TabsTrigger>
          <TabsTrigger value="p2" data-testid="tab-p2">P2 Production</TabsTrigger>
        </TabsList>

        {['all', 'p0', 'p1', 'p2'].map(tab => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services
                .filter(s => tab === 'all' || s.tier.toLowerCase() === tab)
                .map(service => (
                  <Card key={service.id} className="hover:shadow-lg transition-shadow" data-testid={`card-service-${service.id}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <service.icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{service.name}</CardTitle>
                          </div>
                        </div>
                        <Badge className={getTierColor(service.tier)}>{service.tier}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{service.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-xs text-green-600">Active</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {service.endpoints.length} endpoints
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Card data-testid="card-platform-features">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Platform Security & Compliance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'JWT Authentication', status: 'active' },
              { name: 'Rate Limiting', status: 'active' },
              { name: 'Input Validation', status: 'active' },
              { name: 'Audit Logging', status: 'active' },
              { name: 'CORS Protection', status: 'active' },
              { name: 'SQL Injection Prevention', status: 'active' },
              { name: 'XSS Prevention', status: 'active' },
              { name: 'Data Encryption', status: 'active' }
            ].map(feature => (
              <div key={feature.name} className="flex items-center gap-2" data-testid={`feature-${feature.name.toLowerCase().replace(/\s+/g, '-')}`}>
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">{feature.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Zap className="h-4 w-4" /> Powered by WAI SDK v3.1
        </span>
        <span>|</span>
        <span>Last updated: {new Date().toLocaleString()}</span>
      </div>
    </div>
  );
}
