import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GitBranch, Workflow, Box, Activity } from 'lucide-react';

interface BMADWorkflow {
  id: string;
  coordinationId: string;
  workflowType: string;
  status: string;
  participants: string[];
  createdAt: string;
}

interface BMADAsset {
  id: string;
  assetId: string;
  name: string;
  type: string;
  createdAt: string;
}

export default function BMADWorkflowVisualizer() {
  const { data: workflows, isLoading: loadingWorkflows } = useQuery({
    queryKey: ['/api/v9/bmad/workflows'],
  });

  const { data: assets, isLoading: loadingAssets } = useQuery({
    queryKey: ['/api/v9/bmad/assets'],
  });

  const workflowList = workflows?.workflows || [];
  const assetList = assets?.assets || [];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-500';
      case 'completed':
        return 'bg-blue-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-bmad-visualizer">BMAD Workflow Visualizer</h1>
          <p className="text-muted-foreground">Behavioral Multi-Agent Design Coordination</p>
        </div>
        <Badge variant="outline" className="text-lg">
          <Workflow className="w-4 h-4 mr-2" />
          {workflowList.length} Workflows
        </Badge>
      </div>

      <Tabs defaultValue="workflows" className="space-y-4">
        <TabsList>
          <TabsTrigger value="workflows" data-testid="tab-workflows">Workflows</TabsTrigger>
          <TabsTrigger value="assets" data-testid="tab-assets">Assets</TabsTrigger>
          <TabsTrigger value="patterns" data-testid="tab-patterns">Behavioral Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loadingWorkflows ? (
              <div className="col-span-2 text-center py-12">Loading workflows...</div>
            ) : workflowList.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-muted-foreground">
                No active workflows
              </div>
            ) : (
              workflowList.map((workflow: BMADWorkflow) => (
                <Card key={workflow.id} data-testid={`card-workflow-${workflow.coordinationId}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="truncate">{workflow.coordinationId}</span>
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(workflow.status)}`} />
                    </CardTitle>
                    <CardDescription>Type: {workflow.workflowType}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant="outline">{workflow.status}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Participants:</span>
                        <Badge>{workflow.participants?.length || 0} agents</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Created:</span>
                        <span className="text-xs">
                          {new Date(workflow.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {loadingAssets ? (
              <div className="col-span-3 text-center py-12">Loading assets...</div>
            ) : assetList.length === 0 ? (
              <div className="col-span-3 text-center py-12 text-muted-foreground">
                No assets available
              </div>
            ) : (
              assetList.map((asset: BMADAsset) => (
                <Card key={asset.id} data-testid={`card-asset-${asset.assetId}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Box className="w-4 h-4" />
                      <span className="truncate">{asset.name}</span>
                    </CardTitle>
                    <CardDescription className="font-mono text-xs">
                      {asset.assetId}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Badge variant="outline">{asset.type}</Badge>
                      <div className="text-xs text-muted-foreground">
                        {new Date(asset.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="w-5 h-5" />
                Behavioral Patterns
              </CardTitle>
              <CardDescription>Agent coordination and adaptation patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <Activity className="w-8 h-8 text-blue-500" />
                  <div className="flex-1">
                    <h3 className="font-semibold">Reactive Pattern</h3>
                    <p className="text-sm text-muted-foreground">Event-driven agent responses</p>
                  </div>
                  <Badge>Active</Badge>
                </div>
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <Activity className="w-8 h-8 text-green-500" />
                  <div className="flex-1">
                    <h3 className="font-semibold">Collaborative Pattern</h3>
                    <p className="text-sm text-muted-foreground">Multi-agent coordination</p>
                  </div>
                  <Badge>Active</Badge>
                </div>
                <div className="flex items-center gap-4 p-4 border rounded-lg">
                  <Activity className="w-8 h-8 text-purple-500" />
                  <div className="flex-1">
                    <h3 className="font-semibold">Adaptive Pattern</h3>
                    <p className="text-sm text-muted-foreground">Learning-based optimization</p>
                  </div>
                  <Badge>Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
