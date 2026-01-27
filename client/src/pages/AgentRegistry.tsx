import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  Power, 
  PowerOff, 
  Edit, 
  Trash2, 
  Shield, 
  Activity,
  Star,
  Brain,
  Layers,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import AgentEditModal from '@/components/admin/AgentEditModal';
import AgentPerformanceModal from '@/components/admin/AgentPerformanceModal';
import AgentDeleteDialog from '@/components/admin/AgentDeleteDialog';

// Types for agents based on our schema
interface Agent {
  id: string;
  agentId: string;
  name: string;
  description: string;
  tier: 'L1' | 'L2' | 'L3' | 'L4';
  category: string;
  specialization: string;
  capabilities: string[];
  status: 'active' | 'inactive' | 'maintenance' | 'deprecated';
  isAvailable: boolean;
  version: string;
  skillsets: string[];
  policies: Record<string, any>;
  performanceMetrics: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

const AGENT_TIERS = [
  { value: 'L1', label: 'L1 - Basic', color: 'bg-gray-500', description: 'Simple task execution' },
  { value: 'L2', label: 'L2 - Intermediate', color: 'bg-blue-500', description: 'Multi-step workflows' },
  { value: 'L3', label: 'L3 - Advanced', color: 'bg-purple-500', description: 'Complex reasoning' },
  { value: 'L4', label: 'L4 - Expert', color: 'bg-orange-500', description: 'Autonomous operations' }
];

const AGENT_CATEGORIES = [
  'development', 'content', 'analysis', 'automation', 'integration', 
  'monitoring', 'security', 'optimization', 'communication', 'creative'
];

const STATUS_COLORS = {
  active: 'bg-green-500',
  inactive: 'bg-gray-500',
  maintenance: 'bg-yellow-500',
  deprecated: 'bg-red-500'
};

const STATUS_ICONS = {
  active: CheckCircle,
  inactive: XCircle,
  maintenance: Clock,
  deprecated: AlertTriangle
};

export default function AgentRegistry() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [performanceModalOpen, setPerformanceModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [editMode, setEditMode] = useState<'create' | 'edit'>('edit');

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch agents with filters
  const { data: agentsData, isLoading, error } = useQuery({
    queryKey: [
      'agents', 
      { 
        search: searchTerm, 
        tier: selectedTier, 
        category: selectedCategory, 
        status: selectedStatus,
        limit: 20,
        offset: currentPage * 20
      }
    ],
    queryFn: async ({ queryKey }) => {
      const [_, filters] = queryKey as [string, any];
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });

      const response = await fetch(`/api/admin/agents?${params}`);
      if (!response.ok) throw new Error('Failed to fetch agents');
      return response.json();
    },
  });

  // Toggle agent enable/disable
  const toggleAgentMutation = useMutation({
    mutationFn: async ({ agentId, enabled }: { agentId: string; enabled: boolean }) => {
      return apiRequest(`/api/admin/agents/${agentId}/toggle`, {
        method: 'PATCH',
        body: { enabled }
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast({
        title: 'Agent Updated',
        description: data.message,
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to toggle agent status',
        variant: 'destructive',
      });
    },
  });

  const handleToggleAgent = (agent: Agent) => {
    toggleAgentMutation.mutate({
      agentId: agent.agentId,
      enabled: !agent.isAvailable
    });
  };

  const handleEditAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setEditMode('edit');
    setEditModalOpen(true);
  };

  const handleCreateAgent = () => {
    setSelectedAgent(null);
    setEditMode('create');
    setEditModalOpen(true);
  };

  const handleViewPerformance = (agent: Agent) => {
    setSelectedAgent(agent);
    setPerformanceModalOpen(true);
  };

  const handleDeleteAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setDeleteDialogOpen(true);
  };

  const closeModals = () => {
    setEditModalOpen(false);
    setPerformanceModalOpen(false);
    setDeleteDialogOpen(false);
    setSelectedAgent(null);
  };

  const getTierInfo = (tier: string) => {
    return AGENT_TIERS.find(t => t.value === tier) || AGENT_TIERS[0];
  };

  const getStatusIcon = (status: string) => {
    const IconComponent = STATUS_ICONS[status as keyof typeof STATUS_ICONS] || CheckCircle;
    return IconComponent;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-8">
        Error loading agents. Please try again.
      </div>
    );
  }

  const agents = agentsData?.agents || [];
  const totalCount = agentsData?.total || 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="page-title">Agent Registry</h1>
          <p className="text-muted-foreground">
            Manage 105+ specialized agents with ROMA architecture levels (L1-L4)
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            data-testid="button-toggle-view"
          >
            <Layers className="w-4 h-4 mr-2" />
            {viewMode === 'grid' ? 'List View' : 'Grid View'}
          </Button>
          <Button onClick={handleCreateAgent} data-testid="button-create-agent">
            <Plus className="w-4 h-4 mr-2" />
            Create Agent
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search agents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
            </div>
            
            <Select value={selectedTier} onValueChange={setSelectedTier}>
              <SelectTrigger className="w-40" data-testid="select-tier">
                <SelectValue placeholder="ROMA Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Tiers</SelectItem>
                {AGENT_TIERS.map(tier => (
                  <SelectItem key={tier.value} value={tier.value}>
                    {tier.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40" data-testid="select-category">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {AGENT_CATEGORIES.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-32" data-testid="select-status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="deprecated">Deprecated</SelectItem>
              </SelectContent>
            </Select>

            {(searchTerm || selectedTier || selectedCategory || selectedStatus) && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedTier('');
                  setSelectedCategory('');
                  setSelectedStatus('');
                }}
                data-testid="button-clear-filters"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {AGENT_TIERS.map(tier => {
          const tierAgents = agents.filter((agent: Agent) => agent.tier === tier.value);
          const activeCount = tierAgents.filter((agent: Agent) => agent.isAvailable).length;
          
          return (
            <Card key={tier.value}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{tier.label}</p>
                    <p className="text-2xl font-bold">{activeCount}/{tierAgents.length}</p>
                    <p className="text-xs text-muted-foreground">{tier.description}</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${tier.color}`}></div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Agents Grid/List */}
      <div className={viewMode === 'grid' 
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
        : "space-y-4"
      }>
        {agents.map((agent: Agent) => {
          const tierInfo = getTierInfo(agent.tier);
          const StatusIcon = getStatusIcon(agent.status);
          
          return (
            <Card key={agent.agentId} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg" data-testid={`text-agent-name-${agent.agentId}`}>
                        {agent.name}
                      </CardTitle>
                      <Badge 
                        variant="outline" 
                        className={`text-white ${tierInfo.color}`}
                        data-testid={`badge-tier-${agent.agentId}`}
                      >
                        {agent.tier}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2" data-testid={`text-description-${agent.agentId}`}>
                      {agent.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`w-4 h-4 ${STATUS_COLORS[agent.status as keyof typeof STATUS_COLORS]} text-white rounded-full p-0.5`} />
                      <span className="text-xs capitalize">{agent.status}</span>
                      <Badge variant="secondary" className="text-xs">
                        {agent.category}
                      </Badge>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" data-testid={`button-menu-${agent.agentId}`}>
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => handleEditAgent(agent)}
                        data-testid={`button-edit-${agent.agentId}`}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Agent
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleEditAgent(agent)}
                        data-testid={`button-configure-${agent.agentId}`}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Configure
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleViewPerformance(agent)}
                        data-testid={`button-monitor-${agent.agentId}`}
                      >
                        <Activity className="w-4 h-4 mr-2" />
                        Monitor Performance
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600" 
                        onClick={() => handleDeleteAgent(agent)}
                        data-testid={`button-delete-${agent.agentId}`}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Agent
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Capabilities */}
                  <div>
                    <h4 className="text-sm font-medium mb-1">Capabilities</h4>
                    <div className="flex flex-wrap gap-1">
                      {(agent.capabilities || []).slice(0, 3).map((capability, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {capability}
                        </Badge>
                      ))}
                      {agent.capabilities && agent.capabilities.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{agent.capabilities.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Version & Specialization */}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">
                      {agent.specialization}
                    </span>
                    <span className="text-muted-foreground">
                      v{agent.version}
                    </span>
                  </div>

                  {/* Enable/Disable Toggle */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      {agent.isAvailable ? (
                        <Power className="w-4 h-4 text-green-500" />
                      ) : (
                        <PowerOff className="w-4 h-4 text-gray-500" />
                      )}
                      <span className="text-sm">
                        {agent.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    
                    <Button 
                      variant={agent.isAvailable ? 'destructive' : 'default'}
                      size="sm"
                      onClick={() => handleToggleAgent(agent)}
                      disabled={toggleAgentMutation.isPending}
                      data-testid={`button-toggle-${agent.agentId}`}
                    >
                      {toggleAgentMutation.isPending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : agent.isAvailable ? (
                        <>
                          <PowerOff className="w-4 h-4 mr-1" />
                          Disable
                        </>
                      ) : (
                        <>
                          <Power className="w-4 h-4 mr-1" />
                          Enable
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pagination */}
      {totalCount > 20 && (
        <div className="flex justify-center items-center gap-2 pt-4">
          <Button 
            variant="outline" 
            size="sm"
            disabled={currentPage === 0}
            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            data-testid="button-prev-page"
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage + 1} of {Math.ceil(totalCount / 20)}
          </span>
          <Button 
            variant="outline" 
            size="sm"
            disabled={(currentPage + 1) * 20 >= totalCount}
            onClick={() => setCurrentPage(prev => prev + 1)}
            data-testid="button-next-page"
          >
            Next
          </Button>
        </div>
      )}

      {/* Empty State */}
      {agents.length === 0 && (
        <div className="text-center py-12">
          <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No agents found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || selectedTier || selectedCategory || selectedStatus
              ? 'Try adjusting your filters to see more agents.'
              : 'Get started by creating your first agent.'
            }
          </p>
          <Button onClick={handleCreateAgent} data-testid="button-create-first-agent">
            <Plus className="w-4 h-4 mr-2" />
            Create Agent
          </Button>
        </div>
      )}

      {/* Modals */}
      <AgentEditModal
        agentId={selectedAgent?.agentId || null}
        isOpen={editModalOpen}
        onClose={closeModals}
        mode={editMode}
      />

      <AgentPerformanceModal
        agentId={selectedAgent?.agentId || null}
        agentName={selectedAgent?.name}
        isOpen={performanceModalOpen}
        onClose={closeModals}
      />

      <AgentDeleteDialog
        agentId={selectedAgent?.agentId || null}
        agentName={selectedAgent?.name}
        isOpen={deleteDialogOpen}
        onClose={closeModals}
      />
    </div>
  );
}