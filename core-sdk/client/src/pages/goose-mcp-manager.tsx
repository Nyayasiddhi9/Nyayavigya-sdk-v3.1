/**
 * Goose MCP Manager - Frontend interface for managing MCP servers
 * Provides tools management, installation, and configuration
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  Settings, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  Server,
  Zap,
  Globe,
  Code,
  Database,
  Palette,
  Bot,
  Play
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GooseMCPServer {
  id: string;
  name: string;
  description: string;
  category: 'web' | 'development' | 'design' | 'productivity' | 'database' | 'ai' | 'media' | 'enterprise';
  configRequired: string[];
  capabilities: string[];
  status: 'available' | 'installed' | 'configured' | 'error';
  priority: 'high' | 'medium' | 'low';
  documentation: string;
}

const categoryIcons = {
  web: Globe,
  development: Code,
  design: Palette,
  productivity: Settings,
  database: Database,
  ai: Bot,
  media: Play,
  enterprise: Server
};

const priorityColors = {
  high: 'destructive',
  medium: 'default',
  low: 'secondary'
} as const;

export default function GooseMCPManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Fetch all servers
  const { data: serversData, isLoading } = useQuery({
    queryKey: ['/api/goose-mcp/servers'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch system status
  const { data: statusData } = useQuery({
    queryKey: ['/api/goose-mcp/status']
  });

  // Install server mutation
  const installServerMutation = useMutation({
    mutationFn: async (serverId: string) => {
      const response = await fetch(`/api/goose-mcp/install/${serverId}`, {
        method: 'POST'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Installation failed');
      }
      return response.json();
    },
    onSuccess: (data, serverId) => {
      toast({
        title: "Installation Successful",
        description: `Successfully installed ${serverId}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/goose-mcp/servers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/goose-mcp/status'] });
    },
    onError: (error: Error, serverId) => {
      toast({
        title: "Installation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Install essential servers mutation
  const installEssentialMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/goose-mcp/install-essential', {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to install essential servers');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Essential Installation Complete",
        description: `Installed ${data.data.installedCount} servers`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/goose-mcp/servers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/goose-mcp/status'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Installation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const servers = serversData?.data?.servers || [];
  const categories = serversData?.data?.categories || [];
  const status = statusData?.data;

  const filteredServers = selectedCategory === 'all' 
    ? servers 
    : servers.filter((s: GooseMCPServer) => s.category === selectedCategory);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'installed':
      case 'configured':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Download className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading MCP servers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Goose MCP Manager</h1>
          <p className="text-muted-foreground">
            Manage production-ready Model Context Protocol servers
          </p>
        </div>
        <Button 
          onClick={() => installEssentialMutation.mutate()}
          disabled={installEssentialMutation.isPending}
          className="bg-primary hover:bg-primary/90"
        >
          <Zap className="mr-2 h-4 w-4" />
          {installEssentialMutation.isPending ? 'Installing...' : 'Install Essential'}
        </Button>
      </div>

      {/* System Status */}
      {status && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{status.totalServers}</div>
                <div className="text-sm text-muted-foreground">Total Servers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{status.installedServers}</div>
                <div className="text-sm text-muted-foreground">Installed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{Object.keys(status.categories).length}</div>
                <div className="text-sm text-muted-foreground">Categories</div>
              </div>
              <div className="text-center">
                <Progress 
                  value={(status.installedServers / status.totalServers) * 100} 
                  className="w-full"
                />
                <div className="text-sm text-muted-foreground mt-1">
                  {Math.round((status.installedServers / status.totalServers) * 100)}% Complete
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-6 lg:grid-cols-9">
          <TabsTrigger value="all">All</TabsTrigger>
          {categories.map((category: string) => {
            const Icon = categoryIcons[category as keyof typeof categoryIcons];
            return (
              <TabsTrigger key={category} value={category} className="flex items-center gap-1">
                {Icon && <Icon className="h-3 w-3" />}
                <span className="capitalize">{category}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServers.map((server: GooseMCPServer) => {
              const CategoryIcon = categoryIcons[server.category];
              return (
                <Card key={server.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {CategoryIcon && <CategoryIcon className="h-5 w-5 text-primary" />}
                        <CardTitle className="text-lg">{server.name}</CardTitle>
                      </div>
                      {getStatusIcon(server.status)}
                    </div>
                    <CardDescription className="text-sm">
                      {server.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={priorityColors[server.priority]}>
                        {server.priority} priority
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {server.category}
                      </Badge>
                    </div>

                    {server.capabilities.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Capabilities:</p>
                        <div className="flex flex-wrap gap-1">
                          {server.capabilities.slice(0, 3).map((cap) => (
                            <Badge key={cap} variant="secondary" className="text-xs">
                              {cap.replace('_', ' ')}
                            </Badge>
                          ))}
                          {server.capabilities.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{server.capabilities.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {server.configRequired.length > 0 && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          Requires: {server.configRequired.join(', ')}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant={server.status === 'available' ? 'default' : 'secondary'}
                        disabled={installServerMutation.isPending || server.status !== 'available'}
                        onClick={() => installServerMutation.mutate(server.id)}
                        className="flex-1"
                      >
                        {installServerMutation.isPending && installServerMutation.variables === server.id ? (
                          <>Installing...</>
                        ) : server.status === 'available' ? (
                          <>
                            <Download className="mr-1 h-3 w-3" />
                            Install
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-1 h-3 w-3" />
                            {server.status}
                          </>
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(server.documentation, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}