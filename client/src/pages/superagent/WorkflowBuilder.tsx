import { useCallback, useState, DragEvent, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  BackgroundVariant,
  MiniMap,
  NodeProps,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Play, Save, Plus, Bot, Package, Workflow as WorkflowIcon, Loader2, ChevronDown, ChevronRight, Search, Mic, Video, Music, Image, Wrench, Brain, CheckCircle2, Circle, AlertCircle, StopCircle, History, Clock, X } from 'lucide-react';

import { validateConnection } from '@/../../shared/workflow-schema';

interface AgentData {
  id: string;
  name: string;
  description: string;
  tier: string;
  capabilities: string[];
  status: string;
}

interface ToolData {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  enabled: boolean;
}

interface AgentsResponse {
  success: boolean;
  totalAgents: number;
  byTier: Record<string, AgentData[]>;
  agents: AgentData[];
}

interface ToolsResponse {
  success: boolean;
  totalTools: number;
  byCategory: Record<string, ToolData[]>;
  tools: ToolData[];
}

// Execution states for nodes
type ExecutionState = 'idle' | 'running' | 'completed' | 'error';

// Custom Node Components with execution state support
function AgentNode({ data }: NodeProps) {
  const state = data.executionState as ExecutionState || 'idle';
  const getBorderClass = () => {
    switch (state) {
      case 'running': return 'border-yellow-400 animate-pulse shadow-yellow-400/50';
      case 'completed': return 'border-green-400 shadow-green-400/30';
      case 'error': return 'border-red-400 shadow-red-400/30';
      default: return 'border-purple-400';
    }
  };
  
  const StateIcon = state === 'running' ? Loader2 : state === 'completed' ? CheckCircle2 : state === 'error' ? AlertCircle : null;
  
  return (
    <div className={`px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 border-2 ${getBorderClass()} rounded-lg shadow-lg min-w-[150px] transition-all duration-300`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-purple-400" />
      <div className="flex items-center gap-2">
        <Bot className="w-5 h-5 text-white" />
        <div className="text-white font-medium text-sm flex-1">{data.label}</div>
        {StateIcon && <StateIcon className={`w-4 h-4 ${state === 'running' ? 'animate-spin text-yellow-300' : state === 'completed' ? 'text-green-300' : 'text-red-300'}`} />}
      </div>
      {data.description && (
        <div className="text-xs text-purple-100 mt-1">{data.description}</div>
      )}
      {state === 'completed' && data.executionResult && (
        <div className="text-[10px] text-green-200 mt-1 bg-green-600/20 px-2 py-0.5 rounded">
          {data.executionResult.metrics?.tokensUsed && `${data.executionResult.metrics.tokensUsed} tokens`}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-purple-400" />
    </div>
  );
}

function ToolNode({ data }: NodeProps) {
  const state = data.executionState as ExecutionState || 'idle';
  const getBorderClass = () => {
    switch (state) {
      case 'running': return 'border-yellow-400 animate-pulse shadow-yellow-400/50';
      case 'completed': return 'border-green-400 shadow-green-400/30';
      case 'error': return 'border-red-400 shadow-red-400/30';
      default: return 'border-blue-400';
    }
  };
  
  const StateIcon = state === 'running' ? Loader2 : state === 'completed' ? CheckCircle2 : state === 'error' ? AlertCircle : null;
  
  return (
    <div className={`px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 border-2 ${getBorderClass()} rounded-lg shadow-lg min-w-[150px] transition-all duration-300`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-400" />
      <div className="flex items-center gap-2">
        <Package className="w-5 h-5 text-white" />
        <div className="text-white font-medium text-sm flex-1">{data.label}</div>
        {StateIcon && <StateIcon className={`w-4 h-4 ${state === 'running' ? 'animate-spin text-yellow-300' : state === 'completed' ? 'text-green-300' : 'text-red-300'}`} />}
      </div>
      {data.description && (
        <div className="text-xs text-blue-100 mt-1">{data.description}</div>
      )}
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-400" />
    </div>
  );
}

function WorkflowNodeComponent({ data }: NodeProps) {
  const state = data.executionState as ExecutionState || 'idle';
  const getBorderClass = () => {
    switch (state) {
      case 'running': return 'border-yellow-400 animate-pulse shadow-yellow-400/50';
      case 'completed': return 'border-green-400 shadow-green-400/30';
      case 'error': return 'border-red-400 shadow-red-400/30';
      default: return 'border-teal-400';
    }
  };
  
  const StateIcon = state === 'running' ? Loader2 : state === 'completed' ? CheckCircle2 : state === 'error' ? AlertCircle : null;
  
  return (
    <div className={`px-4 py-3 bg-gradient-to-r from-teal-600 to-teal-700 border-2 ${getBorderClass()} rounded-lg shadow-lg min-w-[150px] transition-all duration-300`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-teal-400" />
      <div className="flex items-center gap-2">
        <WorkflowIcon className="w-5 h-5 text-white" />
        <div className="text-white font-medium text-sm flex-1">{data.label}</div>
        {StateIcon && <StateIcon className={`w-4 h-4 ${state === 'running' ? 'animate-spin text-yellow-300' : state === 'completed' ? 'text-green-300' : 'text-red-300'}`} />}
      </div>
      {data.description && (
        <div className="text-xs text-teal-100 mt-1">{data.description}</div>
      )}
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-teal-400" />
    </div>
  );
}

const nodeTypes = {
  agent: AgentNode,
  tool: ToolNode,
  workflow: WorkflowNodeComponent,
};

const initialNodes: Node[] = [
  {
    id: 'start',
    type: 'input',
    data: { label: '🚀 Start' },
    position: { x: 250, y: 25 },
    style: { 
      background: 'hsl(217, 91%, 60%)', 
      color: 'white', 
      border: '2px solid hsl(217, 91%, 40%)', 
      borderRadius: '8px', 
      padding: '10px',
      fontSize: '14px',
      fontWeight: '500',
    },
  },
];

const tierIcons: Record<string, typeof Bot> = {
  executive: Brain,
  development: Wrench,
  creative: Image,
  qa: Search,
  devops: Package,
  domain: Bot,
};

const categoryIcons: Record<string, typeof Mic> = {
  core: Wrench,
  voice: Mic,
  video: Video,
  music: Music,
  'image-generation': Image,
  'image-editing': Image,
  memory: Brain,
};

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'research' | 'content' | 'development' | 'automation' | 'analysis';
  icon: 'Search' | 'Image' | 'Wrench' | 'Bot' | 'Brain';
  nodes: { id: string; type: string; label: string; description?: string; position: { x: number; y: number } }[];
  edges: { source: string; target: string }[];
}

const workflowTemplates: WorkflowTemplate[] = [
  {
    id: 'deep-research',
    name: 'Deep Research Pipeline',
    description: 'Multi-source research with summarization',
    category: 'research',
    icon: 'Search',
    nodes: [
      { id: 'start', type: 'input', label: '🚀 Start', position: { x: 300, y: 25 } },
      { id: 'agent-1', type: 'agent', label: 'Research Orchestrator', description: 'Coordinates research tasks', position: { x: 300, y: 125 } },
      { id: 'tool-1', type: 'tool', label: 'Web Search', description: 'Search web sources', position: { x: 150, y: 225 } },
      { id: 'tool-2', type: 'tool', label: 'Academic Search', description: 'Search scholarly articles', position: { x: 450, y: 225 } },
      { id: 'agent-2', type: 'agent', label: 'Content Synthesizer', description: 'Combines and analyzes findings', position: { x: 300, y: 325 } },
      { id: 'tool-3', type: 'tool', label: 'Document Generator', description: 'Creates structured report', position: { x: 300, y: 425 } },
    ],
    edges: [
      { source: 'start', target: 'agent-1' },
      { source: 'agent-1', target: 'tool-1' },
      { source: 'agent-1', target: 'tool-2' },
      { source: 'tool-1', target: 'agent-2' },
      { source: 'tool-2', target: 'agent-2' },
      { source: 'agent-2', target: 'tool-3' },
    ],
  },
  {
    id: 'content-creation',
    name: 'AI Content Creator',
    description: 'Generate blog posts, articles, and social media content',
    category: 'content',
    icon: 'Image',
    nodes: [
      { id: 'start', type: 'input', label: '🚀 Start', position: { x: 300, y: 25 } },
      { id: 'agent-1', type: 'agent', label: 'Content Strategist', description: 'Plans content structure', position: { x: 300, y: 125 } },
      { id: 'agent-2', type: 'agent', label: 'Writer Agent', description: 'Generates written content', position: { x: 150, y: 225 } },
      { id: 'tool-1', type: 'tool', label: 'Image Generator', description: 'Creates visual assets', position: { x: 450, y: 225 } },
      { id: 'agent-3', type: 'agent', label: 'Editor Agent', description: 'Reviews and refines', position: { x: 300, y: 325 } },
      { id: 'tool-2', type: 'tool', label: 'SEO Optimizer', description: 'Optimizes for search', position: { x: 300, y: 425 } },
    ],
    edges: [
      { source: 'start', target: 'agent-1' },
      { source: 'agent-1', target: 'agent-2' },
      { source: 'agent-1', target: 'tool-1' },
      { source: 'agent-2', target: 'agent-3' },
      { source: 'tool-1', target: 'agent-3' },
      { source: 'agent-3', target: 'tool-2' },
    ],
  },
  {
    id: 'code-review',
    name: 'Automated Code Review',
    description: 'Multi-layer code analysis and improvement suggestions',
    category: 'development',
    icon: 'Wrench',
    nodes: [
      { id: 'start', type: 'input', label: '🚀 Start', position: { x: 300, y: 25 } },
      { id: 'tool-1', type: 'tool', label: 'Code Parser', description: 'Analyzes code structure', position: { x: 300, y: 125 } },
      { id: 'agent-1', type: 'agent', label: 'Security Analyst', description: 'Checks vulnerabilities', position: { x: 150, y: 225 } },
      { id: 'agent-2', type: 'agent', label: 'Performance Agent', description: 'Analyzes performance', position: { x: 450, y: 225 } },
      { id: 'agent-3', type: 'agent', label: 'Best Practices Agent', description: 'Checks coding standards', position: { x: 300, y: 325 } },
      { id: 'tool-2', type: 'tool', label: 'Report Generator', description: 'Creates review report', position: { x: 300, y: 425 } },
    ],
    edges: [
      { source: 'start', target: 'tool-1' },
      { source: 'tool-1', target: 'agent-1' },
      { source: 'tool-1', target: 'agent-2' },
      { source: 'agent-1', target: 'agent-3' },
      { source: 'agent-2', target: 'agent-3' },
      { source: 'agent-3', target: 'tool-2' },
    ],
  },
  {
    id: 'customer-support',
    name: 'AI Customer Support',
    description: 'Intelligent ticket routing and response generation',
    category: 'automation',
    icon: 'Bot',
    nodes: [
      { id: 'start', type: 'input', label: '🚀 Start', position: { x: 300, y: 25 } },
      { id: 'agent-1', type: 'agent', label: 'Intent Classifier', description: 'Categorizes inquiries', position: { x: 300, y: 125 } },
      { id: 'tool-1', type: 'tool', label: 'Knowledge Search', description: 'Searches knowledge base', position: { x: 300, y: 225 } },
      { id: 'agent-2', type: 'agent', label: 'Response Generator', description: 'Crafts personalized response', position: { x: 300, y: 325 } },
      { id: 'agent-3', type: 'agent', label: 'Quality Checker', description: 'Ensures response quality', position: { x: 300, y: 425 } },
    ],
    edges: [
      { source: 'start', target: 'agent-1' },
      { source: 'agent-1', target: 'tool-1' },
      { source: 'tool-1', target: 'agent-2' },
      { source: 'agent-2', target: 'agent-3' },
    ],
  },
  {
    id: 'data-analysis',
    name: 'Data Analysis Pipeline',
    description: 'Automated data processing and insight generation',
    category: 'analysis',
    icon: 'Brain',
    nodes: [
      { id: 'start', type: 'input', label: '🚀 Start', position: { x: 300, y: 25 } },
      { id: 'tool-1', type: 'tool', label: 'Data Loader', description: 'Ingests data sources', position: { x: 300, y: 125 } },
      { id: 'agent-1', type: 'agent', label: 'Data Cleaner', description: 'Cleans and normalizes', position: { x: 300, y: 225 } },
      { id: 'agent-2', type: 'agent', label: 'Pattern Analyzer', description: 'Identifies patterns', position: { x: 150, y: 325 } },
      { id: 'agent-3', type: 'agent', label: 'Prediction Agent', description: 'Makes predictions', position: { x: 450, y: 325 } },
      { id: 'tool-2', type: 'tool', label: 'Visualization', description: 'Creates charts', position: { x: 300, y: 425 } },
    ],
    edges: [
      { source: 'start', target: 'tool-1' },
      { source: 'tool-1', target: 'agent-1' },
      { source: 'agent-1', target: 'agent-2' },
      { source: 'agent-1', target: 'agent-3' },
      { source: 'agent-2', target: 'tool-2' },
      { source: 'agent-3', target: 'tool-2' },
    ],
  },
  {
    id: 'multimodal-content',
    name: 'Multimodal Content Hub',
    description: 'Generate text, images, voice, and video content',
    category: 'content',
    icon: 'Image',
    nodes: [
      { id: 'start', type: 'input', label: '🚀 Start', position: { x: 300, y: 25 } },
      { id: 'agent-1', type: 'agent', label: 'Content Orchestrator', description: 'Plans multimodal content', position: { x: 300, y: 125 } },
      { id: 'tool-1', type: 'tool', label: 'Text Generator', description: 'Creates written content', position: { x: 100, y: 225 } },
      { id: 'tool-2', type: 'tool', label: 'Image Generator', description: 'Creates visuals', position: { x: 300, y: 225 } },
      { id: 'tool-3', type: 'tool', label: 'Voice Synthesizer', description: 'Generates voice', position: { x: 500, y: 225 } },
      { id: 'agent-2', type: 'agent', label: 'Content Assembler', description: 'Combines all media', position: { x: 300, y: 350 } },
    ],
    edges: [
      { source: 'start', target: 'agent-1' },
      { source: 'agent-1', target: 'tool-1' },
      { source: 'agent-1', target: 'tool-2' },
      { source: 'agent-1', target: 'tool-3' },
      { source: 'tool-1', target: 'agent-2' },
      { source: 'tool-2', target: 'agent-2' },
      { source: 'tool-3', target: 'agent-2' },
    ],
  },
];

const templateCategoryIcons: Record<string, typeof Search> = {
  research: Search,
  content: Image,
  development: Wrench,
  automation: Bot,
  analysis: Brain,
};

export default function SuperAgentWorkflowBuilder() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [workflowName, setWorkflowName] = useState('New Workflow');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null);
  const [draggedNodeType, setDraggedNodeType] = useState<string | null>(null);
  const [draggedNodeData, setDraggedNodeData] = useState<{ label: string; description: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'agents' | 'tools' | 'workflows' | 'templates'>('agents');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTiers, setExpandedTiers] = useState<Set<string>>(new Set(['development']));
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['core']));
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [executionLog, setExecutionLog] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [executionStartTime, setExecutionStartTime] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  interface ExecutionHistoryEntry {
    id: string;
    workflowName: string;
    status: 'success' | 'failed' | 'aborted';
    startTime: string;
    endTime: string;
    durationMs: number;
    nodesExecuted: number;
    totalNodes: number;
    logs: string[];
  }

  // Fetch agents from API
  const { data: agentsData, isLoading: agentsLoading } = useQuery<AgentsResponse>({
    queryKey: ['/api/shakti-ai/agents'],
  });

  // Fetch tools from API
  const { data: toolsData, isLoading: toolsLoading } = useQuery<ToolsResponse>({
    queryKey: ['/api/shakti-ai/tools'],
  });

  // Fetch saved workflows list
  const { data: workflowsList } = useQuery<{ success: boolean; data: any[] }>({
    queryKey: ['/api/shakti-ai/workflows'],
  });

  // Fetch execution history
  const { data: executionHistoryData, refetch: refetchHistory } = useQuery<{ success: boolean; data: { history: ExecutionHistoryEntry[] } }>({
    queryKey: ['/api/shakti-ai/workflows/history'],
  });

  // Record execution history
  const recordExecutionMutation = useMutation({
    mutationFn: async (data: {
      workflowName: string;
      status: 'success' | 'failed' | 'aborted';
      startTime: string;
      endTime: string;
      durationMs: number;
      nodesExecuted: number;
      totalNodes: number;
      logs: string[];
    }) => {
      return await apiRequest('/api/shakti-ai/workflows/history', 'POST', data);
    },
    onSuccess: () => {
      refetchHistory();
    },
  });

  const toggleTier = (tier: string) => {
    const newExpanded = new Set(expandedTiers);
    if (newExpanded.has(tier)) {
      newExpanded.delete(tier);
    } else {
      newExpanded.add(tier);
    }
    setExpandedTiers(newExpanded);
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  // Save workflow mutation
  const saveWorkflowMutation = useMutation({
    mutationFn: async (data: { id?: string; name: string; description?: string; nodes: Node[]; edges: Edge[] }) => {
      if (data.id) {
        return await apiRequest(`/api/shakti-ai/workflows/${data.id}`, 'PUT', {
          name: data.name,
          description: data.description,
          nodes: data.nodes,
          edges: data.edges,
        });
      } else {
        return await apiRequest('/api/shakti-ai/workflows', 'POST', data);
      }
    },
    onSuccess: (response) => {
      setCurrentWorkflowId(response.data.id);
      toast({
        title: 'Workflow saved',
        description: `Successfully saved "${workflowName}"`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/shakti-ai/workflows'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Save failed',
        description: error.message || 'Failed to save workflow',
        variant: 'destructive',
      });
    },
  });

  // Load workflow mutation
  const loadWorkflowMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/shakti-ai/workflows/${id}`, 'GET');
    },
    onSuccess: (response) => {
      const workflow = response.data;
      setWorkflowName(workflow.name);
      setWorkflowDescription(workflow.description || '');
      setNodes(workflow.nodes || []);
      setEdges(workflow.edges || []);
      setCurrentWorkflowId(workflow.id);
      toast({
        title: 'Workflow loaded',
        description: `Loaded "${workflow.name}"`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Load failed',
        description: error.message || 'Failed to load workflow',
        variant: 'destructive',
      });
    },
  });

  // Connection validation
  const onConnect = useCallback(
    (connection: Connection) => {
      const sourceNode = nodes.find((n) => n.id === connection.source);
      const targetNode = nodes.find((n) => n.id === connection.target);

      if (!sourceNode || !targetNode) {
        toast({
          title: 'Connection failed',
          description: 'Invalid connection: source or target node not found',
          variant: 'destructive',
        });
        return;
      }

      // Validate connection rules
      const validation = validateConnection(
        { ...sourceNode, path: '', children: [] } as any,
        { ...targetNode, path: '', children: [] } as any
      );

      if (!validation.valid) {
        toast({
          title: 'Invalid connection',
          description: validation.reason || 'Connection not allowed',
          variant: 'destructive',
        });
        return;
      }

      setEdges((eds) => addEdge({ ...connection, animated: true }, eds));
    },
    [nodes, setEdges, toast]
  );

  // Drag and drop handlers
  const onDragStart = (event: DragEvent, nodeType: string, nodeData?: { label: string; description: string }) => {
    setDraggedNodeType(nodeType);
    setDraggedNodeData(nodeData || null);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      if (!draggedNodeType) return;

      const reactFlowBounds = (event.target as HTMLElement).getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left - 75,
        y: event.clientY - reactFlowBounds.top - 20,
      };

      const newNode: Node = {
        id: `${draggedNodeType}-${Date.now()}`,
        type: draggedNodeType,
        position,
        data: draggedNodeData || {
          label: `${draggedNodeType.charAt(0).toUpperCase() + draggedNodeType.slice(1)} ${nodes.length}`,
          description: `New ${draggedNodeType} node`,
        },
      };

      setNodes((nds) => nds.concat(newNode));
      setDraggedNodeType(null);
      setDraggedNodeData(null);
    },
    [draggedNodeType, draggedNodeData, nodes.length, setNodes]
  );

  // Filter agents/tools based on search query
  const filteredAgents = searchQuery && agentsData?.agents 
    ? agentsData.agents.filter(a => 
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  const filteredTools = searchQuery && toolsData?.tools
    ? toolsData.tools.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  const handleSave = () => {
    if (!workflowName.trim()) {
      toast({
        title: 'Validation error',
        description: 'Workflow name is required',
        variant: 'destructive',
      });
      return;
    }

    saveWorkflowMutation.mutate({
      id: currentWorkflowId || undefined,
      name: workflowName,
      description: workflowDescription,
      nodes,
      edges,
    });
  };

  const handleNewWorkflow = () => {
    setWorkflowName('New Workflow');
    setWorkflowDescription('');
    setNodes(initialNodes);
    setEdges([]);
    setCurrentWorkflowId(null);
  };

  const loadTemplate = useCallback((template: WorkflowTemplate) => {
    const newNodes: Node[] = template.nodes.map(node => ({
      id: node.id,
      type: node.type === 'input' ? 'input' : node.type,
      data: { 
        label: node.label, 
        description: node.description,
        executionState: 'idle' as ExecutionState,
      },
      position: node.position,
      style: node.type === 'input' ? {
        background: 'hsl(217, 91%, 60%)',
        color: 'white',
        border: '2px solid hsl(217, 91%, 40%)',
        borderRadius: '8px',
        padding: '10px',
        fontSize: '14px',
        fontWeight: '500',
      } : undefined,
    }));

    const newEdges: Edge[] = template.edges.map((edge, index) => ({
      id: `e${edge.source}-${edge.target}-${index}`,
      source: edge.source,
      target: edge.target,
      animated: true,
      style: { stroke: 'hsl(217, 91%, 60%)', strokeWidth: 2 },
    }));

    setWorkflowName(template.name);
    setWorkflowDescription(template.description);
    setNodes(newNodes);
    setEdges(newEdges);
    setCurrentWorkflowId(null);

    toast({
      title: 'Template loaded',
      description: `"${template.name}" template loaded. You can customize it and save.`,
    });
  }, [setNodes, setEdges, toast]);

  const handleExecute = useCallback(() => {
    if (isExecuting) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setIsExecuting(false);
      setExecutionProgress(0);
      setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, executionState: 'idle', executionResult: undefined } })));
      toast({
        title: 'Execution stopped',
        description: 'Workflow execution was cancelled',
      });
      return;
    }

    if (nodes.length < 2) {
      toast({
        title: 'Cannot execute',
        description: 'Add at least one agent or tool node to execute',
        variant: 'destructive',
      });
      return;
    }

    setIsExecuting(true);
    setExecutionProgress(0);
    setExecutionLog([]);
    const startTime = new Date().toISOString();
    setExecutionStartTime(startTime);
    setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, executionState: 'idle', executionResult: undefined } })));

    toast({
      title: 'Executing workflow',
      description: `Starting execution of "${workflowName}" with ${nodes.length} nodes...`,
    });

    const url = `/api/shakti-ai/workflows/execute-live`;
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: workflowName, nodes, edges }),
      signal: controller.signal,
    }).then(async (response) => {
      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            const eventType = line.substring(7);
            continue;
          }
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              
              if (data.nodeId) {
                if (data.result) {
                  setNodes(nds => nds.map(n => 
                    n.id === data.nodeId 
                      ? { ...n, data: { ...n.data, executionState: 'completed', executionResult: data.result } }
                      : n
                  ));
                  setExecutionLog(log => [...log, `✓ ${data.nodeName}`]);
                } else {
                  setNodes(nds => nds.map(n => 
                    n.id === data.nodeId 
                      ? { ...n, data: { ...n.data, executionState: 'running' } }
                      : n
                  ));
                  setExecutionLog(log => [...log, `▶ ${data.nodeName}...`]);
                }
              }

              if (typeof data.progress === 'number') {
                setExecutionProgress(data.progress);
              }

              if (data.results) {
                setIsExecuting(false);
                setExecutionProgress(100);
                const endTime = new Date().toISOString();
                const startTs = executionStartTime ? new Date(executionStartTime).getTime() : Date.now();
                const durationMs = Date.now() - startTs;
                
                recordExecutionMutation.mutate({
                  workflowName,
                  status: 'success',
                  startTime: executionStartTime || new Date().toISOString(),
                  endTime,
                  durationMs,
                  nodesExecuted: data.totalNodes,
                  totalNodes: nodes.length,
                  logs: executionLog,
                });

                toast({
                  title: 'Execution complete',
                  description: `Successfully executed ${data.totalNodes} nodes`,
                });
              }
            } catch (e) {
            }
          }
        }
      }
    }).catch((error) => {
      setIsExecuting(false);
      setExecutionProgress(0);
      toast({
        title: 'Execution failed',
        description: error.message || 'Failed to execute workflow',
        variant: 'destructive',
      });
    });
  }, [isExecuting, nodes, edges, workflowName, setNodes, toast]);

  return (
    <div className="h-full flex bg-[hsl(222,47%,11%)]">
      {/* Node Palette - Enhanced with Real Agents & Tools */}
      <div className="w-80 bg-[hsl(222,47%,15%)] border-r border-white/10 flex flex-col">
        {/* Header with Tabs */}
        <div className="p-4 border-b border-white/10">
          <h3 className="text-sm font-semibold text-white mb-3">Node Palette</h3>
          
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search agents & tools..."
              className="pl-9 bg-slate-800/50 border-white/10 text-white text-sm h-9"
              data-testid="input-search-palette"
            />
          </div>
          
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-slate-800/30 rounded-lg">
            <button
              onClick={() => setActiveTab('agents')}
              className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'agents' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
              data-testid="tab-agents"
            >
              <Bot className="w-3.5 h-3.5 inline mr-1" />
              Agents ({agentsData?.totalAgents || 0})
            </button>
            <button
              onClick={() => setActiveTab('tools')}
              className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'tools' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
              data-testid="tab-tools"
            >
              <Package className="w-3.5 h-3.5 inline mr-1" />
              Tools ({toolsData?.totalTools || 0})
            </button>
            <button
              onClick={() => setActiveTab('workflows')}
              className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'workflows' 
                  ? 'bg-teal-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
              data-testid="tab-workflows"
            >
              <WorkflowIcon className="w-3.5 h-3.5 inline mr-1" />
              Saved
            </button>
          </div>
          
          <button
            onClick={() => setActiveTab('templates')}
            className={`w-full mt-2 py-2 px-3 text-xs font-medium rounded-lg transition-all ${
              activeTab === 'templates' 
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/20' 
                : 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-gray-300 hover:from-purple-600/30 hover:to-blue-600/30 border border-purple-400/20'
            }`}
            data-testid="tab-templates"
          >
            <WorkflowIcon className="w-3.5 h-3.5 inline mr-2" />
            Templates ({workflowTemplates.length})
          </button>
        </div>

        {/* Content Area */}
        <ScrollArea className="flex-1">
          <div className="p-3">
            {/* Agents Tab */}
            {activeTab === 'agents' && (
              <div className="space-y-2">
                {agentsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                  </div>
                ) : searchQuery && filteredAgents ? (
                  // Search results
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400 mb-2">{filteredAgents.length} agents found</p>
                    {filteredAgents.slice(0, 20).map((agent) => {
                      const TierIcon = tierIcons[agent.tier] || Bot;
                      return (
                        <div
                          key={agent.id}
                          draggable
                          onDragStart={(e) => onDragStart(e, 'agent', { label: agent.name, description: agent.description })}
                          className="p-2 bg-purple-600/15 border border-purple-400/20 rounded-lg cursor-move hover:bg-purple-600/25 transition-colors"
                          data-testid={`agent-${agent.id}`}
                        >
                          <div className="flex items-center gap-2">
                            <TierIcon className="w-3.5 h-3.5 text-purple-300" />
                            <span className="text-xs font-medium text-purple-200 truncate">{agent.name}</span>
                          </div>
                          <p className="text-[10px] text-purple-300/70 mt-0.5 line-clamp-1">{agent.description}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // Categorized by tier
                  agentsData?.byTier && Object.entries(agentsData.byTier).map(([tier, agents]) => {
                    const TierIcon = tierIcons[tier] || Bot;
                    const isExpanded = expandedTiers.has(tier);
                    return (
                      <Collapsible key={tier} open={isExpanded} onOpenChange={() => toggleTier(tier)}>
                        <CollapsibleTrigger className="w-full flex items-center gap-2 p-2 bg-purple-600/10 border border-purple-400/20 rounded-lg hover:bg-purple-600/20 transition-colors">
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-purple-300" /> : <ChevronRight className="w-4 h-4 text-purple-300" />}
                          <TierIcon className="w-4 h-4 text-purple-300" />
                          <span className="text-xs font-medium text-purple-200 capitalize">{tier}</span>
                          <span className="ml-auto text-[10px] text-purple-400 bg-purple-600/20 px-1.5 py-0.5 rounded">{agents.length}</span>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="mt-1 ml-4 space-y-1">
                            {agents.slice(0, 15).map((agent) => (
                              <div
                                key={agent.id}
                                draggable
                                onDragStart={(e) => onDragStart(e, 'agent', { label: agent.name, description: agent.description })}
                                className="p-2 bg-purple-600/10 border border-purple-400/15 rounded cursor-move hover:bg-purple-600/20 transition-colors"
                                data-testid={`agent-${agent.id}`}
                              >
                                <span className="text-[11px] font-medium text-purple-200 block truncate">{agent.name}</span>
                                <p className="text-[9px] text-purple-300/60 mt-0.5 line-clamp-1">{agent.description}</p>
                              </div>
                            ))}
                            {agents.length > 15 && (
                              <p className="text-[10px] text-purple-400/60 pl-2">+ {agents.length - 15} more agents</p>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })
                )}
              </div>
            )}

            {/* Tools Tab */}
            {activeTab === 'tools' && (
              <div className="space-y-2">
                {toolsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                  </div>
                ) : searchQuery && filteredTools ? (
                  // Search results
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400 mb-2">{filteredTools.length} tools found</p>
                    {filteredTools.slice(0, 20).map((tool) => {
                      const CategoryIcon = categoryIcons[tool.category] || Wrench;
                      return (
                        <div
                          key={tool.id}
                          draggable
                          onDragStart={(e) => onDragStart(e, 'tool', { label: tool.name, description: tool.description })}
                          className="p-2 bg-blue-600/15 border border-blue-400/20 rounded-lg cursor-move hover:bg-blue-600/25 transition-colors"
                          data-testid={`tool-${tool.id}`}
                        >
                          <div className="flex items-center gap-2">
                            <CategoryIcon className="w-3.5 h-3.5 text-blue-300" />
                            <span className="text-xs font-medium text-blue-200 truncate">{tool.name}</span>
                          </div>
                          <p className="text-[10px] text-blue-300/70 mt-0.5 line-clamp-1">{tool.description}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // Categorized by category
                  toolsData?.byCategory && Object.entries(toolsData.byCategory).map(([category, tools]) => {
                    const CategoryIcon = categoryIcons[category] || Wrench;
                    const isExpanded = expandedCategories.has(category);
                    return (
                      <Collapsible key={category} open={isExpanded} onOpenChange={() => toggleCategory(category)}>
                        <CollapsibleTrigger className="w-full flex items-center gap-2 p-2 bg-blue-600/10 border border-blue-400/20 rounded-lg hover:bg-blue-600/20 transition-colors">
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-blue-300" /> : <ChevronRight className="w-4 h-4 text-blue-300" />}
                          <CategoryIcon className="w-4 h-4 text-blue-300" />
                          <span className="text-xs font-medium text-blue-200 capitalize">{category.replace('-', ' ')}</span>
                          <span className="ml-auto text-[10px] text-blue-400 bg-blue-600/20 px-1.5 py-0.5 rounded">{tools.length}</span>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="mt-1 ml-4 space-y-1">
                            {tools.map((tool) => (
                              <div
                                key={tool.id}
                                draggable
                                onDragStart={(e) => onDragStart(e, 'tool', { label: tool.name, description: tool.description })}
                                className="p-2 bg-blue-600/10 border border-blue-400/15 rounded cursor-move hover:bg-blue-600/20 transition-colors"
                                data-testid={`tool-${tool.id}`}
                              >
                                <span className="text-[11px] font-medium text-blue-200 block truncate">{tool.name}</span>
                                <p className="text-[9px] text-blue-300/60 mt-0.5 line-clamp-1">{tool.description}</p>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })
                )}
              </div>
            )}

            {/* Saved Workflows Tab */}
            {activeTab === 'workflows' && (
              <div className="space-y-2">
                {workflowsList?.data && workflowsList.data.length > 0 ? (
                  workflowsList.data.map((wf: any) => (
                    <button
                      key={wf.id}
                      onClick={() => loadWorkflowMutation.mutate(wf.id)}
                      className="w-full p-2.5 bg-teal-600/10 border border-teal-400/20 hover:bg-teal-600/20 rounded-lg text-left transition-colors"
                      data-testid={`workflow-${wf.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <WorkflowIcon className="w-4 h-4 text-teal-300" />
                        <span className="text-xs font-medium text-teal-200">{wf.name}</span>
                      </div>
                      <div className="text-[10px] text-teal-300/60 mt-1">
                        {wf.nodeCount || 0} nodes • {wf.edgeCount || 0} connections
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <WorkflowIcon className="w-8 h-8 text-teal-400/30 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">No saved workflows yet</p>
                    <p className="text-[10px] text-gray-500 mt-1">Create and save your first workflow</p>
                  </div>
                )}
              </div>
            )}

            {/* Templates Tab */}
            {activeTab === 'templates' && (
              <div className="space-y-3">
                <div className="text-xs text-gray-400 mb-3">
                  Pre-built workflow templates with agent and tool combinations. Click to load.
                </div>
                
                {Object.entries(
                  workflowTemplates.reduce((acc, template) => {
                    if (!acc[template.category]) acc[template.category] = [];
                    acc[template.category].push(template);
                    return acc;
                  }, {} as Record<string, WorkflowTemplate[]>)
                ).map(([category, templates]) => {
                  const CategoryIcon = templateCategoryIcons[category] || WorkflowIcon;
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-gray-300 capitalize">
                        <CategoryIcon className="w-3.5 h-3.5" />
                        {category}
                      </div>
                      {templates.map((template) => {
                        const TemplateIcon = templateCategoryIcons[template.category] || WorkflowIcon;
                        return (
                          <button
                            key={template.id}
                            onClick={() => loadTemplate(template)}
                            className="w-full p-3 bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-purple-400/20 hover:from-purple-600/20 hover:to-blue-600/20 rounded-lg text-left transition-all group"
                            data-testid={`template-${template.id}`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                                <TemplateIcon className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium text-white block truncate group-hover:text-purple-300 transition-colors">
                                  {template.name}
                                </span>
                                <p className="text-[10px] text-gray-400 line-clamp-1">{template.description}</p>
                              </div>
                            </div>
                            <div className="flex gap-3 mt-2 text-[10px]">
                              <span className="text-purple-300 flex items-center gap-1">
                                <Bot className="w-3 h-3" />
                                {template.nodes.filter(n => n.type === 'agent').length} agents
                              </span>
                              <span className="text-blue-300 flex items-center gap-1">
                                <Package className="w-3 h-3" />
                                {template.nodes.filter(n => n.type === 'tool').length} tools
                              </span>
                              <span className="text-teal-300 flex items-center gap-1">
                                <WorkflowIcon className="w-3 h-3" />
                                {template.edges.length} connections
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="h-16 bg-[hsl(222,47%,13%)] border-b border-white/10 flex items-center px-4 gap-4">
          <Input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="w-64 bg-[hsl(222,47%,15%)] border-white/10 text-white"
            placeholder="Workflow name"
            data-testid="input-workflow-name"
          />
          <div className="flex-1" />
          <Button
            onClick={handleNewWorkflow}
            variant="outline"
            size="sm"
            className="bg-[hsl(222,47%,15%)] border-white/10 text-white hover:bg-white/10"
            data-testid="button-new-workflow"
          >
            <Plus className="w-4 h-4 mr-2" />
            New
          </Button>
          <Button
            onClick={handleSave}
            size="sm"
            disabled={saveWorkflowMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
            data-testid="button-save-workflow"
          >
            {saveWorkflowMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save
          </Button>
          <Button
            onClick={handleExecute}
            size="sm"
            className={isExecuting ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
            data-testid="button-execute-workflow"
          >
            {isExecuting ? (
              <>
                <StopCircle className="w-4 h-4 mr-2" />
                Stop
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Execute
              </>
            )}
          </Button>
          <Button
            onClick={() => setShowHistory(!showHistory)}
            size="sm"
            variant={showHistory ? "default" : "outline"}
            className={showHistory ? "bg-purple-600 hover:bg-purple-700" : "border-white/20 hover:bg-white/10"}
            data-testid="button-history"
          >
            <History className="w-4 h-4 mr-2" />
            History
            {executionHistoryData?.data?.history?.length ? (
              <span className="ml-1 bg-purple-800 text-white text-[10px] px-1.5 rounded">
                {executionHistoryData.data.history.length}
              </span>
            ) : null}
          </Button>
        </div>
        
        {/* Execution Progress Bar */}
        {isExecuting && (
          <div className="h-8 bg-[hsl(222,47%,12%)] border-b border-white/10 flex items-center px-4 gap-3">
            <span className="text-xs text-yellow-400 flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" />
              Executing...
            </span>
            <Progress value={executionProgress} className="flex-1 h-2" />
            <span className="text-xs text-gray-400">{executionProgress}%</span>
          </div>
        )}

        {/* React Flow Canvas */}
        <div className="flex-1" onDragOver={onDragOver} onDrop={onDrop}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            data-testid="react-flow-canvas"
          >
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} color="#444" />
            <Controls className="bg-[hsl(222,47%,15%)] border-white/10" />
            <MiniMap
              className="bg-[hsl(222,47%,15%)] border border-white/10"
              nodeColor={(node) => {
                if (node.type === 'agent') return '#9333ea';
                if (node.type === 'tool') return '#2563eb';
                if (node.type === 'workflow') return '#14b8a6';
                return '#4b5563';
              }}
            />
          </ReactFlow>
        </div>

        {/* Execution History Panel */}
        {showHistory && (
          <div className="h-64 bg-[hsl(222,47%,12%)] border-t border-white/10 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
              <div className="flex items-center gap-2 text-sm text-white">
                <History className="w-4 h-4 text-purple-400" />
                <span>Execution History</span>
                <span className="text-gray-500 text-xs">
                  ({executionHistoryData?.data?.history?.length || 0} runs)
                </span>
              </div>
              <Button
                onClick={() => setShowHistory(false)}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-2">
                {executionHistoryData?.data?.history?.length ? (
                  executionHistoryData.data.history.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3 rounded-lg bg-slate-800/50 border border-white/10 hover:border-white/20 cursor-pointer transition-colors"
                      data-testid={`history-entry-${entry.id}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-white font-medium truncate max-w-[200px]">
                          {entry.workflowName}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          entry.status === 'success' ? 'bg-green-900/50 text-green-400' :
                          entry.status === 'failed' ? 'bg-red-900/50 text-red-400' :
                          'bg-yellow-900/50 text-yellow-400'
                        }`}>
                          {entry.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(entry.startTime).toLocaleString()}
                        </span>
                        <span>{entry.nodesExecuted}/{entry.totalNodes} nodes</span>
                        <span>{Math.round(entry.durationMs / 1000)}s</span>
                      </div>
                      {entry.logs.length > 0 && (
                        <div className="mt-2 text-xs text-gray-500 truncate">
                          Last: {entry.logs[entry.logs.length - 1]}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                    <History className="w-10 h-10 mb-2 opacity-50" />
                    <span className="text-sm">No execution history yet</span>
                    <span className="text-xs">Execute a workflow to see results here</span>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Status Bar */}
        <div className="h-10 bg-[hsl(222,47%,13%)] border-t border-white/10 flex items-center px-4 text-xs text-gray-400 gap-4">
          <div className="flex items-center gap-2">
            <span>{nodes.length} nodes</span>
            <span>•</span>
            <span>{edges.length} connections</span>
            {currentWorkflowId && (
              <>
                <span>•</span>
                <span className="text-green-400">Saved</span>
              </>
            )}
          </div>
          {executionLog.length > 0 && (
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-gray-500">Last:</span>
                <span className={executionLog[executionLog.length - 1]?.startsWith('✓') ? 'text-green-400' : 'text-yellow-400'}>
                  {executionLog[executionLog.length - 1]}
                </span>
              </div>
            </div>
          )}
          {executionProgress === 100 && !isExecuting && (
            <span className="text-green-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Completed
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
