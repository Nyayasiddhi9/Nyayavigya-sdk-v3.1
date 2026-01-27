import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Brain, Layers, Database, Search } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface ContextLayer {
  id: string;
  contextId: string;
  sessionId: string;
  layerType: string;
  layerData: any;
  createdAt: string;
}

interface LayerType {
  type: string;
  description: string;
  level: number;
}

export default function MemoryBrowserCAM() {
  const [sessionId, setSessionId] = useState('session-default');

  const { data: layers, isLoading: loadingLayers } = useQuery({
    queryKey: ['/api/v9/cam/layers', { sessionId }],
    queryFn: () => apiRequest(`/api/v9/cam/layers?sessionId=${sessionId}`, 'GET'),
    enabled: !!sessionId,
  });

  const { data: layerTypes } = useQuery({
    queryKey: ['/api/v9/cam/memory/types'],
  });

  const contextLayers = layers?.layers || [];
  const memoryTypes = layerTypes?.layerTypes || [];

  const getLayerColor = (type: string) => {
    const colors: Record<string, string> = {
      episodic: 'bg-blue-500',
      semantic: 'bg-purple-500',
      procedural: 'bg-green-500',
      working: 'bg-yellow-500',
      global: 'bg-red-500',
      domain: 'bg-indigo-500',
    };
    return colors[type] || 'bg-gray-500';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-memory-browser">CAM 2.0 Memory Browser</h1>
          <p className="text-muted-foreground">Context-Aware Memory & Knowledge Management</p>
        </div>
        <Badge variant="outline" className="text-lg">
          <Brain className="w-4 h-4 mr-2" />
          {memoryTypes.length} Layer Types
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session Selector</CardTitle>
          <CardDescription>Browse memory layers by session</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Enter session ID..."
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              data-testid="input-session-id"
            />
            <Badge className="px-4 py-2">{contextLayers.length} Layers</Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="layers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="layers" data-testid="tab-layers">Memory Layers</TabsTrigger>
          <TabsTrigger value="types" data-testid="tab-types">Layer Types</TabsTrigger>
          <TabsTrigger value="search" data-testid="tab-search">Search</TabsTrigger>
        </TabsList>

        <TabsContent value="layers" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {loadingLayers ? (
              <div className="text-center py-12">Loading layers...</div>
            ) : contextLayers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No memory layers for this session
              </div>
            ) : (
              contextLayers.map((layer: ContextLayer) => (
                <Card key={layer.id} data-testid={`card-layer-${layer.contextId}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getLayerColor(layer.layerType)}`} />
                        <span className="capitalize">{layer.layerType} Memory</span>
                      </div>
                      <Badge variant="outline" className="font-mono text-xs">
                        {layer.contextId}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Created: {new Date(layer.createdAt).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                      {JSON.stringify(layer.layerData, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {memoryTypes.map((type: LayerType) => (
              <Card key={type.type} data-testid={`card-type-${type.type}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getLayerColor(type.type)}`} />
                    <span className="capitalize">{type.type}</span>
                  </CardTitle>
                  <CardDescription>Level {type.level}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Memory Search
              </CardTitle>
              <CardDescription>Search across all memory layers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  placeholder="Search memory content..."
                  className="flex-1"
                  data-testid="input-search-memory"
                />
                <Badge variant="outline" className="px-4 py-2">
                  <Database className="w-4 h-4 mr-2" />
                  All Layers
                </Badge>
              </div>
              <div className="mt-8 text-center text-muted-foreground">
                Memory search interface - Coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
