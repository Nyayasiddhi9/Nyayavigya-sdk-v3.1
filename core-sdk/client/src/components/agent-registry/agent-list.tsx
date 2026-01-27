'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, Play, Pause, MoreVertical, Activity, Users, Zap, Plus } from 'lucide-react';
import { useAgents } from '../../hooks/use-agents';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Utility functions
const formatDuration = (ms: number) => `${ms.toFixed(0)}ms`;
const getStatusColor = (status: string) => status === 'active' ? 'green' : status === 'inactive' ? 'yellow' : 'red';

// WAI SDK API Client for agents
const waiSDKClient = {
  toggleAgent: (agentId: string, enabled: boolean) => 
    apiRequest(`/api/v9/agents/${agentId}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ enabled })
    }),
  executeAgent: (agentId: string, task: any) => 
    apiRequest(`/api/v9/agents/${agentId}/execute`, {
      method: 'POST',
      body: JSON.stringify(task)
    })
};

export function AgentList() {
  const { data: agents, isLoading, error } = useAgents();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const toggleAgentMutation = useMutation({
    mutationFn: async ({ agentId, enabled }: { agentId: string; enabled: boolean }) => {
      return waiSDKClient.toggleAgent(agentId, enabled);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v9/agents'] });
      toast({
        title: 'Agent Updated',
        description: 'Agent status has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update agent status.',
        variant: 'destructive',
      });
    },
  });

  const executeAgentMutation = useMutation({
    mutationFn: async ({ agentId, task }: { agentId: string; task: any }) => {
      return waiSDKClient.executeAgent(agentId, task);
    },
    onSuccess: () => {
      toast({
        title: 'Agent Executed',
        description: 'Agent task has been started successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to execute agent.',
        variant: 'destructive',
      });
    },
  });

  const handleToggleAgent = (agentId: string, enabled: boolean) => {
    toggleAgentMutation.mutate({ agentId, enabled });
  };

  const handleExecuteAgent = (agentId: string) => {
    executeAgentMutation.mutate({ agentId, task: { type: 'manual_execution' } });
  };

  const filteredAgents = (agents as any[])?.filter((agent: any) => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         agent.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || agent.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  }) || [];

  const agentsByCategory = filteredAgents.reduce((acc: any, agent: any) => {
    if (!acc[agent.category]) acc[agent.category] = [];
    acc[agent.category].push(agent);
    return acc;
  }, {} as Record<string, typeof filteredAgents>);

  const getAgentStats = () => {
    if (!agents) return { total: 0, active: 0, inactive: 0 };
    const agentList = agents as any[];
    
    return {
      total: agentList.length,
      active: agentList.filter((a: any) => a.status === 'active').length,
      inactive: agentList.filter((a: any) => a.status === 'inactive').length,
    };
  };

  const stats = getAgentStats();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Agent Registry</h2>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Agent Registry</h2>
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-2">
              <p className="text-red-500">Failed to load agents</p>
              <p className="text-sm text-gray-500">{error.message}</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="agent-list">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Agent Registry</h2>
          <p className="text-muted-foreground">
            Manage and monitor your AI agents across all tiers
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Deploy Agent
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Agents</p>
                <p className="text-2xl font-bold" data-testid="total-agents">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600" data-testid="active-agents">{stats.active}</p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Inactive</p>
                <p className="text-2xl font-bold text-gray-600" data-testid="inactive-agents">{stats.inactive}</p>
              </div>
              <Zap className="w-8 h-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e: any) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="search-agents"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Executive">Executive</SelectItem>
            <SelectItem value="Development">Development</SelectItem>
            <SelectItem value="Creative">Creative</SelectItem>
            <SelectItem value="QA">QA</SelectItem>
            <SelectItem value="DevOps">DevOps</SelectItem>
            <SelectItem value="Domain">Domain Specialist</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Agent Categories */}
      <Tabs defaultValue="grid" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="categories">By Category</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAgents.map((agent: any) => (
              <Card key={agent.id} className="relative" data-testid={`agent-card-${agent.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{agent.category}</Badge>
                    <Badge className={getStatusColor(agent.status)}>
                      {agent.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    Last Activity: {formatDuration(Date.now() - new Date(agent.lastActivity).getTime())} ago
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Status:</span>
                      <Switch
                        checked={agent.status === 'active'}
                        onCheckedChange={(checked) => handleToggleAgent(agent.id, checked)}
                        disabled={toggleAgentMutation.isPending}
                        data-testid={`toggle-agent-${agent.id}`}
                      />
                    </div>
                    
                    <div className="flex gap-1">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleExecuteAgent(agent.id)}
                        disabled={executeAgentMutation.isPending}
                        data-testid={`execute-agent-${agent.id}`}
                      >
                        <Play className="w-3 h-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleToggleAgent(agent.id, false)}
                        disabled={toggleAgentMutation.isPending}
                        data-testid={`pause-agent-${agent.id}`}
                      >
                        <Pause className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          {Object.entries(agentsByCategory).map(([category, categoryAgents]: [string, any]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {category} Tier ({categoryAgents.length} agents)
                  <Badge variant="secondary">{(categoryAgents as any[]).filter((a: any) => a.status === 'active').length} active</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(categoryAgents as any[]).map((agent: any) => (
                    <div key={agent.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${agent.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <span className="font-medium">{agent.name}</span>
                      </div>
                      <Switch
                        checked={agent.status === 'active'}
                        onCheckedChange={(checked) => handleToggleAgent(agent.id, checked)}
                        disabled={toggleAgentMutation.isPending}
                        size="sm"
                        data-testid={`category-toggle-${agent.id}`}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}