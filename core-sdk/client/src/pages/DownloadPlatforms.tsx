import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, ExternalLink, CheckCircle, Server, Database, Key } from 'lucide-react';

interface PlatformInfo {
  platform: string;
  id: string;
  version: string;
  category: string;
  features: string[];
  downloadPath: string;
  description: string;
  ports: {
    api: number;
    websocket: number;
    frontend?: number;
  };
  deploymentReady: boolean;
}

interface DownloadIndex {
  generated: string;
  platforms: PlatformInfo[];
  totalPlatforms: number;
  instructions: {
    installation: string;
    requirements: string;
    documentation: string;
  };
  waiSdkVersion: string;
  productionReady: boolean;
}

export default function DownloadPlatforms() {
  const [downloadIndex, setDownloadIndex] = useState<DownloadIndex | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDownloadIndex();
  }, []);

  const fetchDownloadIndex = async () => {
    try {
      const response = await fetch('/api/downloads/index');
      const data = await response.json();
      setDownloadIndex(data);
    } catch (error) {
      console.error('Failed to fetch download index:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (platform: PlatformInfo) => {
    // Direct download for WAI v9.0 packages
    if (platform.id === 'wai-v9-git-repository' || platform.id === 'wai-v9-production-sdk') {
      window.location.href = platform.downloadPath;
    } else {
      // Show platform info for other packages
      window.open(`/api/downloads/info/${platform.id}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!downloadIndex) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Download packages not available</h1>
          <p className="text-gray-600 mt-2">Please try again later or contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          WAI DevStudio Platform Downloads
        </h1>
        <p className="text-xl text-gray-600 mb-2">
          Complete standalone packages with embedded WAI Orchestration SDK v{downloadIndex.waiSdkVersion}
        </p>
        <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Production Ready
          </span>
          <span className="flex items-center gap-1">
            <Server className="w-4 h-4 text-blue-500" />
            One-Click Deployment
          </span>
          <span className="flex items-center gap-1">
            <Database className="w-4 h-4 text-purple-500" />
            Real AI Integrations
          </span>
        </div>
      </div>

      {/* Installation Instructions */}
      <Card className="mb-8 border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Quick Start Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <p className="text-sm">{downloadIndex.instructions.installation}</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <p className="text-sm">{downloadIndex.instructions.requirements}</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <p className="text-sm">{downloadIndex.instructions.documentation}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Cards */}
      <div className="grid lg:grid-cols-2 gap-6">
        {downloadIndex.platforms.map((platform) => (
          <Card key={platform.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl mb-2">{platform.platform}</CardTitle>
                  <p className="text-gray-600 text-sm mb-3">{platform.description}</p>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">v{platform.version}</Badge>
                    <Badge variant="outline" className="capitalize">{platform.category}</Badge>
                    {platform.deploymentReady && (
                      <Badge className="bg-green-100 text-green-800">Production Ready</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Features */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">Key Features:</h4>
                  <div className="flex flex-wrap gap-1">
                    {platform.features.map((feature, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Ports */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">Port Configuration:</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>API: {platform.ports.api}</div>
                    <div>WebSocket: {platform.ports.websocket}</div>
                    {platform.ports.frontend && (
                      <div>Frontend: {platform.ports.frontend}</div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={() => handleDownload(platform)}
                    className="flex-1"
                    variant={platform.id.includes('wai-v9') ? 'default' : 'outline'}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {platform.id.includes('wai-v9') ? 'Download Now' : 'View Package Info'}
                  </Button>
                  {platform.id.includes('wai-v9') && (
                    <Button 
                      variant="outline"
                      onClick={() => window.open(`/api/downloads/info/${platform.id}`, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary */}
      <Card className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">
              Complete WAI DevStudio Ecosystem
            </h3>
            <p className="text-gray-600 mb-4">
              {downloadIndex.totalPlatforms} production-ready platforms with {downloadIndex.waiSdkVersion} WAI SDK
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                No Mock Implementations
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Real AI Integrations
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Complete Dependencies
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                One-Click Deploy
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support */}
      <div className="text-center mt-8 p-6 bg-gray-50 rounded-lg">
        <h4 className="font-semibold mb-2">Need Help?</h4>
        <p className="text-sm text-gray-600">
          Each package includes comprehensive documentation, API references, and deployment guides.
          For additional support, contact us at support@wai-devstudio.com
        </p>
      </div>
    </div>
  );
}