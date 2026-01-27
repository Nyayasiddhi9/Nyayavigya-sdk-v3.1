import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, 
  Package, 
  Code, 
  Scale, 
  Server, 
  Database, 
  Globe,
  Shield,
  Zap,
  BookOpen,
  CheckCircle2,
  Cloud
} from "lucide-react";

interface SDKBuild {
  id: string;
  name: string;
  version: string;
  description: string;
  agents?: number;
  providers?: number;
  categories?: number;
  statutes?: number;
  languages?: number;
  features?: string[];
  downloadUrl: string;
}

export default function SDKDownloads() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const { data: buildsData, isLoading } = useQuery<{ success: boolean; data: { builds: SDKBuild[] } }>({
    queryKey: ["/api/sdk-builds/list"],
  });

  const handleDownload = async (buildId: string, downloadUrl: string) => {
    setDownloading(buildId);
    try {
      window.open(downloadUrl, '_blank');
    } finally {
      setTimeout(() => setDownloading(null), 2000);
    }
  };

  const builds = buildsData?.data?.builds || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent" data-testid="page-title">
            SDK Downloads
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Download production-ready SDK builds with complete source code, documentation, and deployment configurations
          </p>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
            <TabsTrigger value="all" data-testid="tab-all">All SDKs</TabsTrigger>
            <TabsTrigger value="wai" data-testid="tab-wai">WAI SDK</TabsTrigger>
            <TabsTrigger value="legal" data-testid="tab-legal">Legal SDK</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <WAISDKCard 
                onDownload={handleDownload} 
                downloading={downloading} 
                build={builds.find(b => b.id === 'wai-sdk-v3.1')}
                isLoading={isLoading}
              />
              <NyayaVighyaSDKCard 
                onDownload={handleDownload} 
                downloading={downloading}
                build={builds.find(b => b.id === 'nyayavighya-sdk-v3.1')}
                isLoading={isLoading}
              />
            </div>
          </TabsContent>

          <TabsContent value="wai" className="mt-6">
            <WAISDKCard 
              onDownload={handleDownload} 
              downloading={downloading}
              build={builds.find(b => b.id === 'wai-sdk-v3.1')}
              isLoading={isLoading}
              fullWidth
            />
          </TabsContent>

          <TabsContent value="legal" className="mt-6">
            <NyayaVighyaSDKCard 
              onDownload={handleDownload} 
              downloading={downloading}
              build={builds.find(b => b.id === 'nyayavighya-sdk-v3.1')}
              isLoading={isLoading}
              fullWidth
            />
          </TabsContent>
        </Tabs>

        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-blue-600" />
              Deployment Options
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { name: "AWS", desc: "ECS, Lambda, EC2" },
                { name: "Google Cloud", desc: "Cloud Run, GKE" },
                { name: "Azure", desc: "Container Apps, AKS" },
                { name: "Docker", desc: "Self-hosted, K8s" }
              ].map((platform) => (
                <div key={platform.name} className="p-4 bg-white dark:bg-slate-800 rounded-lg border">
                  <div className="font-semibold">{platform.name}</div>
                  <div className="text-sm text-muted-foreground">{platform.desc}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function WAISDKCard({ 
  onDownload, 
  downloading, 
  build,
  isLoading,
  fullWidth = false 
}: { 
  onDownload: (id: string, url: string) => void;
  downloading: string | null;
  build?: SDKBuild;
  isLoading: boolean;
  fullWidth?: boolean;
}) {
  return (
    <Card className={`relative overflow-hidden ${fullWidth ? 'max-w-2xl mx-auto' : ''}`} data-testid="card-wai-sdk">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-bl-full" />
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Package className="h-6 w-6 text-blue-600" />
              WAI SDK v3.1
            </CardTitle>
            <CardDescription className="mt-2">
              Universal Enterprise AI Orchestration Platform
            </CardDescription>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            v3.1.0
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">257+</div>
            <div className="text-xs text-muted-foreground">AI Agents</div>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">23+</div>
            <div className="text-xs text-muted-foreground">LLM Providers</div>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="text-2xl font-bold text-green-600">13</div>
            <div className="text-xs text-muted-foreground">Enterprise Services</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Included Features:</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[
              { icon: Globe, text: "Web Search API" },
              { icon: BookOpen, text: "Document Processing" },
              { icon: Code, text: "Code Quality Gateway" },
              { icon: Database, text: "Database Connectors" },
              { icon: Shield, text: "Enterprise Security" },
              { icon: Zap, text: "Real-time Analytics" }
            ].map((feature) => (
              <div key={feature.text} className="flex items-center gap-2 text-muted-foreground">
                <feature.icon className="h-4 w-4 text-blue-500" />
                {feature.text}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Includes:</div>
          <div className="flex flex-wrap gap-2">
            {["Source Code", "Docker", "API Docs", "Deploy Scripts", "TypeScript"].map((item) => (
              <Badge key={item} variant="outline" className="text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {item}
              </Badge>
            ))}
          </div>
        </div>

        <Button 
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          onClick={() => onDownload('wai-sdk-v3.1', '/api/sdk-builds/download/wai-sdk-v3.1')}
          disabled={downloading === 'wai-sdk-v3.1' || isLoading}
          data-testid="button-download-wai"
        >
          <Download className="h-4 w-4 mr-2" />
          {downloading === 'wai-sdk-v3.1' ? 'Preparing Download...' : 'Download WAI SDK v3.1'}
        </Button>
      </CardContent>
    </Card>
  );
}

function NyayaVighyaSDKCard({ 
  onDownload, 
  downloading,
  build,
  isLoading,
  fullWidth = false 
}: { 
  onDownload: (id: string, url: string) => void;
  downloading: string | null;
  build?: SDKBuild;
  isLoading: boolean;
  fullWidth?: boolean;
}) {
  return (
    <Card className={`relative overflow-hidden ${fullWidth ? 'max-w-2xl mx-auto' : ''}`} data-testid="card-nyayavighya-sdk">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-bl-full" />
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Scale className="h-6 w-6 text-amber-600" />
              NyayaVighya SDK v3.1
            </CardTitle>
            <CardDescription className="mt-2">
              Specialized Legal AI Platform for Indian Law
            </CardDescription>
          </div>
          <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
            v3.1.0
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="text-2xl font-bold text-amber-600">275+</div>
            <div className="text-xs text-muted-foreground">Legal Agents</div>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">29</div>
            <div className="text-xs text-muted-foreground">Legal Categories</div>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="text-2xl font-bold text-red-600">50+</div>
            <div className="text-xs text-muted-foreground">Statutes</div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Legal Coverage:</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[
              { icon: Scale, text: "IPC, BNS 2023" },
              { icon: BookOpen, text: "CrPC, BNSS 2023" },
              { icon: Shield, text: "Constitution" },
              { icon: Server, text: "Companies Act" },
              { icon: Globe, text: "22 Indian Languages" },
              { icon: Database, text: "Case Law Database" }
            ].map((feature) => (
              <div key={feature.text} className="flex items-center gap-2 text-muted-foreground">
                <feature.icon className="h-4 w-4 text-amber-500" />
                {feature.text}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Includes:</div>
          <div className="flex flex-wrap gap-2">
            {["Source Code", "Docker", "Legal APIs", "Deploy Scripts", "TypeScript"].map((item) => (
              <Badge key={item} variant="outline" className="text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {item}
              </Badge>
            ))}
          </div>
        </div>

        <Button 
          className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
          onClick={() => onDownload('nyayavighya-sdk-v3.1', '/api/sdk-builds/download/nyayavighya-sdk-v3.1')}
          disabled={downloading === 'nyayavighya-sdk-v3.1' || isLoading}
          data-testid="button-download-nyayavighya"
        >
          <Download className="h-4 w-4 mr-2" />
          {downloading === 'nyayavighya-sdk-v3.1' ? 'Preparing Download...' : 'Download NyayaVighya SDK v3.1'}
        </Button>
      </CardContent>
    </Card>
  );
}
