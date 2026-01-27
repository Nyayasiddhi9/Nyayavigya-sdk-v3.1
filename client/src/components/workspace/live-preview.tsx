import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AnimatedCard from "@/components/ui/animated-card";
import { 
  Eye, 
  Smartphone, 
  Tablet, 
  Monitor, 
  RefreshCw,
  ExternalLink,
  Globe,
  CheckCircle,
  AlertTriangle,
  Clock
} from "lucide-react";

interface LivePreviewProps {
  projectId: number;
  fullscreen?: boolean;
}

export default function LivePreview({ projectId, fullscreen = false }: LivePreviewProps) {
  const [device, setDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setLastUpdated(new Date());
    }, 1000);
  };

  const getDeviceStyles = () => {
    switch (device) {
      case 'mobile':
        return 'w-[375px] h-[667px]';
      case 'tablet':
        return 'w-[768px] h-[1024px]';
      default:
        return 'w-full h-full';
    }
  };

  const PreviewContent = () => (
    <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 overflow-auto">
      {/* Mock E-commerce App Preview */}
      <div className="min-h-full">
        {/* Navigation */}
        <nav className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-slate-800">ShopAI</h1>
              <div className="hidden md:flex space-x-6">
                <a href="#" className="text-slate-600 hover:text-slate-800">Home</a>
                <a href="#" className="text-slate-600 hover:text-slate-800">Products</a>
                <a href="#" className="text-slate-600 hover:text-slate-800">About</a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-slate-600 hover:text-slate-800">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 8M7 13l-1.5-8M7 13h10m0 0v8a2 2 0 01-2 2H9a2 2 0 01-2-2v-8m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                </svg>
              </button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Sign In
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-4">Discover Amazing Products</h2>
            <p className="text-xl mb-8">Built with AI-powered development using WAI orchestration</p>
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Shop Now
            </button>
          </div>
        </section>

        {/* Products Grid */}
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-2xl font-bold text-slate-800 mb-8">Featured Products</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl mb-4 flex items-center justify-center">
                    <span className="text-slate-400 text-lg">Product {i}</span>
                  </div>
                  <h4 className="text-lg font-semibold text-slate-800 mb-2">Premium Product {i}</h4>
                  <p className="text-slate-600 text-sm mb-4">High-quality product with excellent features and design.</p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xl font-bold text-slate-800">${(99 + i * 10).toFixed(2)}</span>
                    <div className="flex items-center space-x-1">
                      <div className="flex text-yellow-400">★★★★★</div>
                      <span className="text-slate-500 text-sm">(248)</span>
                    </div>
                  </div>
                  <button className="w-full py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all">
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-800 text-white py-12 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h4 className="text-xl font-semibold mb-4">Built with WAI Development Platform</h4>
            <p className="text-slate-400 mb-6">AI-powered SDLC orchestration with 28 specialized agents</p>
            <div className="flex justify-center space-x-6">
              <a href="#" className="text-slate-400 hover:text-white">Privacy</a>
              <a href="#" className="text-slate-400 hover:text-white">Terms</a>
              <a href="#" className="text-slate-400 hover:text-white">Support</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="h-screen bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <Eye className="h-5 w-5 text-primary" />
            <span className="font-medium text-white">Live Preview</span>
            <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400">
              Live
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Tabs value={device} onValueChange={(value) => setDevice(value as any)}>
              <TabsList className="bg-muted/50">
                <TabsTrigger value="mobile" className="p-2">
                  <Smartphone className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="tablet" className="p-2">
                  <Tablet className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="desktop" className="p-2">
                  <Monitor className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className={`mr-2 h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        <div className="h-full p-4 bg-slate-100 flex items-center justify-center">
          <div className={`${getDeviceStyles()} bg-white rounded-lg shadow-2xl overflow-hidden`}>
            <PreviewContent />
          </div>
        </div>
      </div>
    );
  }

  return (
    <AnimatedCard className="bg-card border border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Eye className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-white text-sm">Live Preview</CardTitle>
              <CardDescription className="text-xs">
                Real-time updates • Last updated {lastUpdated.toLocaleTimeString()}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-1"></div>
              Live
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Device Selector */}
        <div className="px-4 py-2 border-b border-border">
          <Tabs value={device} onValueChange={(value) => setDevice(value as any)}>
            <TabsList className="bg-muted/50">
              <TabsTrigger value="mobile" className="text-xs">
                <Smartphone className="mr-2 h-3 w-3" />
                Mobile
              </TabsTrigger>
              <TabsTrigger value="tablet" className="text-xs">
                <Tablet className="mr-2 h-3 w-3" />
                Tablet
              </TabsTrigger>
              <TabsTrigger value="desktop" className="text-xs">
                <Monitor className="mr-2 h-3 w-3" />
                Desktop
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Preview Container */}
        <div className="p-4 bg-slate-100 h-[400px] overflow-auto">
          <div className={`mx-auto bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 ${getDeviceStyles()}`}>
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-2">
                  <Clock className="h-8 w-8 text-primary animate-spin mx-auto" />
                  <p className="text-muted-foreground">Updating preview...</p>
                </div>
              </div>
            ) : (
              <PreviewContent />
            )}
          </div>
        </div>

        {/* Preview Footer */}
        <div className="px-4 py-2 border-t border-border bg-muted/30">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-3 w-3 text-emerald-400" />
                <span className="text-emerald-400">Responsive</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-3 w-3 text-emerald-400" />
                <span className="text-emerald-400">Accessible</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-3 w-3 text-emerald-400" />
                <span className="text-emerald-400">Optimized</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={handleRefresh}>
                <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="ghost" size="sm">
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </AnimatedCard>
  );
}
