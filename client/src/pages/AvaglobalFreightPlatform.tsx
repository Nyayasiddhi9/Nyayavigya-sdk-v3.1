import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Truck, 
  Package, 
  Users, 
  BarChart3, 
  Globe, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Ship,
  Plane,
  Train,
  Map,
  FileText,
  Settings,
  Search,
  Download,
  Upload,
  Play,
  Pause,
  RefreshCw,
  Bot,
  Cpu,
  Database,
  Shield,
  Zap,
  Target,
  GitBranch,
  Code,
  TestTube,
  Rocket,
  MonitorSpeaker,
  Send,
  MessageSquare,
  Terminal,
  FileCode,
  Activity,
  Brain,
  Sparkles
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Agent {
  id: string;
  name: string;
  role: string;
  specialization: string[];
  status: 'idle' | 'active' | 'busy' | 'completed' | 'error';
  currentTask?: string;
  completedTasks: string[];
}

interface ProjectTask {
  id: string;
  title: string;
  description: string;
  phase: 'analysis' | 'design' | 'development' | 'testing' | 'deployment';
  assignedAgent: string;
  dependencies: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedHours: number;
  actualHours?: number;
  deliverables: string[];
  startedAt?: string;
  completedAt?: string;
}

interface ProjectMilestone {
  id: string;
  name: string;
  description: string;
  dueDate: string;
  tasks: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  completionPercentage: number;
}

interface OrchestrationStatus {
  phase: string;
  completionPercentage: number;
  activeAgents: number;
  completedTasks: number;
  totalTasks: number;
  startDate: string;
  agents: Agent[];
  tasks: ProjectTask[];
  milestones: ProjectMilestone[];
}

interface ChatMessage {
  id: string;
  agentId: string;
  agentName: string;
  message: string;
  type: 'thought' | 'code' | 'question' | 'suggestion' | 'status';
  timestamp: Date;
  codeContent?: string;
  filePath?: string;
}

interface GeneratedFile {
  path: string;
  content: string;
  language: string;
  lastModified: Date;
  modifiedBy: string;
  linesOfCode: number;
}

interface FreightData {
  inquiries: any[];
  quotations: any[];
  orders: any[];
  shipments: any[];
  customers: any[];
  analytics: {
    summary: {
      totalInquiries: number;
      totalQuotations: number;
      totalOrders: number;
      totalShipments: number;
      activeShipments: number;
      deliveredShipments: number;
      totalRevenue: number;
    };
    performance: {
      onTimeDeliveryRate: number;
      customerSatisfactionScore: number;
      averageTransitTime: number;
      costEfficiencyIndex: number;
      carrierPerformanceScore: number;
    };
    trends: {
      inquiryGrowth: number;
      conversionRate: number;
      revenueGrowth: number;
      seasonalTrends: {
        q1: number;
        q2: number;
        q3: number;
        q4: number;
      };
    };
  };
}

const statusColors = {
  idle: 'bg-gray-100 text-gray-700',
  active: 'bg-blue-100 text-blue-700',
  busy: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  error: 'bg-red-100 text-red-700',
  pending: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  blocked: 'bg-red-100 text-red-700'
};

const phaseIcons = {
  analysis: Target,
  design: GitBranch,
  development: Code,
  testing: TestTube,
  deployment: Rocket
};

export default function AvaglobalFreightPlatform() {
  const [isOrchestrationActive, setIsOrchestrationActive] = useState(false);
  const [orchestrationSession, setOrchestrationSession] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const queryClient = useQueryClient();

  // Fetch orchestration status
  const { data: orchestrationData, isLoading: orchestrationLoading } = useQuery<OrchestrationStatus>({
    queryKey: ['/api/freight/orchestration/status'],
    enabled: isOrchestrationActive,
    refetchInterval: isOrchestrationActive ? 2000 : false
  });

  // Fetch freight data
  const { data: freightData, isLoading: freightLoading } = useQuery<FreightData>({
    queryKey: ['/api/freight/dashboard'],
    retry: false
  });

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (isOrchestrationActive && !ws) {
      const websocket = new WebSocket(`ws://localhost:5000/api/ws/orchestration`);
      
      websocket.onopen = () => {
        setIsConnected(true);
        console.log('Connected to orchestration WebSocket');
      };
      
      websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'agent_message') {
          const message: ChatMessage = {
            ...data.data,
            agentName: getAgentName(data.data.agentId),
            timestamp: new Date(data.data.timestamp)
          };
          setChatMessages(prev => [message, ...prev].slice(0, 100));
          
          if (message.codeContent && message.filePath) {
            const file: GeneratedFile = {
              path: message.filePath,
              content: message.codeContent,
              language: detectLanguage(message.filePath),
              lastModified: new Date(),
              modifiedBy: message.agentName,
              linesOfCode: message.codeContent.split('\n').length
            };
            setGeneratedFiles(prev => {
              const updated = prev.filter(f => f.path !== file.path);
              return [file, ...updated];
            });
          }
        }
      };
      
      websocket.onclose = () => {
        setIsConnected(false);
        setWs(null);
      };
      
      setWs(websocket);
    }
    
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [isOrchestrationActive]);

  // Start orchestration mutation
  const startOrchestrationMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/real-time-orchestration/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectType: 'freight-erp',
          requirements: 'Create a comprehensive freight management ERP with real-time tracking, analytics, AI-powered optimization, and microservice architecture. Include proper UI/UX design, database optimization, and backend services.',
          preferences: {
            realTimeUpdates: true,
            agentCollaboration: true,
            codeGeneration: true,
            userInteraction: true
          }
        })
      });
      if (!response.ok) throw new Error('Failed to start orchestration');
      return response.json();
    },
    onSuccess: (data) => {
      setIsOrchestrationActive(true);
      setOrchestrationSession(data.sessionId);
      queryClient.invalidateQueries({ queryKey: ['/api/freight/orchestration/status'] });
    }
  });

  const handleStartSDLCOrchestration = () => {
    if (!isOrchestrationActive) {
      startOrchestrationMutation.mutate();
    } else {
      setIsOrchestrationActive(false);
    }
  };

  const getAgentIcon = (role: string) => {
    const icons = {
      Executive: MonitorSpeaker,
      Architecture: Database,
      Backend: Code,
      Frontend: Globe,
      Design: Target,
      DevOps: Rocket,
      Security: Shield,
      'Quality Assurance': TestTube,
      Analysis: BarChart3,
      Integration: GitBranch,
      'AI/ML': Bot
    };
    return icons[role as keyof typeof icons] || Bot;
  };

  const getAgentName = (agentId: string): string => {
    const names: { [key: string]: string } = {
      'chief-architect': 'Chief Software Architect',
      'senior-backend': 'Senior Backend Developer',
      'senior-frontend': 'Senior Frontend Developer',
      'database-expert': 'Database Architect',
      'devops-engineer': 'DevOps Engineer',
      'ui-ux-designer': 'Senior UI/UX Designer',
      'user': 'You'
    };
    return names[agentId] || agentId;
  };

  const detectLanguage = (filePath: string): string => {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const langMap: { [key: string]: string } = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'sql': 'sql',
      'json': 'json',
      'md': 'markdown'
    };
    return langMap[ext || ''] || 'text';
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'thought': return Brain;
      case 'code': return FileCode;
      case 'question': return MessageSquare;
      case 'suggestion': return Sparkles;
      case 'status': return Activity;
      default: return MessageSquare;
    }
  };

  const sendUserMessage = async () => {
    if (!userInput.trim() || !orchestrationSession) return;
    
    try {
      await fetch('/api/real-time-orchestration/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: orchestrationSession,
          message: userInput
        })
      });
      setUserInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            AVAGlobal Freight Management ERP
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Complete Enterprise Freight & Logistics Platform powered by CodeStudio's Advanced SDLC Agent Orchestration
          </p>
          <div className="flex justify-center items-center gap-4 mt-4">
            <Badge variant="outline" className="px-4 py-2">
              <Globe className="w-4 h-4 mr-2" />
              Production Ready
            </Badge>
            <Badge variant="outline" className="px-4 py-2">
              <Bot className="w-4 h-4 mr-2" />
              12+ AI Agents Active
            </Badge>
            <Badge variant="outline" className="px-4 py-2">
              <Zap className="w-4 h-4 mr-2" />
              Real-time Orchestration
            </Badge>
          </div>
        </div>

        {/* Real-Time AI Orchestration Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Orchestration Control */}
          <div className="lg:col-span-2">
            <Card className="border-2 border-blue-200 shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Cpu className="w-6 h-6 text-blue-600" />
                      CodeStudio Real-Time AI Orchestration
                      {isConnected && (
                        <Badge className="bg-green-100 text-green-700 ml-2">
                          <Activity className="w-3 h-3 mr-1" />
                          Live
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Multi-agent AI system developing freight ERP with real-time collaboration
                    </CardDescription>
                  </div>
                  <Button
                    onClick={handleStartSDLCOrchestration}
                    disabled={startOrchestrationMutation.isPending}
                    size="lg"
                    className={isOrchestrationActive ? "bg-red-600 hover:bg-red-700" : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"}
                  >
                    {startOrchestrationMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : isOrchestrationActive ? (
                      <Pause className="w-4 h-4 mr-2" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    {startOrchestrationMutation.isPending ? 'Starting AI Agents...' : 
                     isOrchestrationActive ? 'Stop Development' : 'Start AI Development'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isOrchestrationActive ? (
                  <div className="space-y-6">
                    {/* Real-time Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
                        <h3 className="font-semibold text-blue-800">Active Agents</h3>
                        <p className="text-2xl font-bold text-blue-600">{chatMessages.filter(m => m.agentId !== 'user').length > 0 ? '6' : '0'}</p>
                      </div>
                      <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
                        <h3 className="font-semibold text-green-800">Files Generated</h3>
                        <p className="text-2xl font-bold text-green-600">{generatedFiles.length}</p>
                      </div>
                      <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
                        <h3 className="font-semibold text-purple-800">Lines of Code</h3>
                        <p className="text-2xl font-bold text-purple-600">{generatedFiles.reduce((sum, file) => sum + file.linesOfCode, 0)}</p>
                      </div>
                      <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg">
                        <h3 className="font-semibold text-orange-800">Messages</h3>
                        <p className="text-2xl font-bold text-orange-600">{chatMessages.length}</p>
                      </div>
                    </div>

                    {/* Live Agent Chat */}
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                        Live Agent Collaboration
                      </h3>
                      <div className="border rounded-lg bg-gray-50">
                        <ScrollArea className="h-96 p-4">
                          <div className="space-y-4">
                            {chatMessages.length === 0 ? (
                              <div className="text-center text-gray-500 py-8">
                                <Bot className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                <p>AI agents will appear here once development starts...</p>
                              </div>
                            ) : (
                              chatMessages.map((message) => {
                                const MessageIcon = getMessageIcon(message.type);
                                return (
                                  <div key={message.id} className="flex gap-3">
                                    <div className="flex-shrink-0">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                        message.agentId === 'user' ? 'bg-blue-100' : 'bg-green-100'
                                      }`}>
                                        <MessageIcon className={`w-4 h-4 ${
                                          message.agentId === 'user' ? 'text-blue-600' : 'text-green-600'
                                        }`} />
                                      </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-sm">{message.agentName}</span>
                                        <Badge variant="outline" className="text-xs">
                                          {message.type}
                                        </Badge>
                                        <span className="text-xs text-gray-500">
                                          {message.timestamp.toLocaleTimeString()}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-700 mb-2">{message.message}</p>
                                      {message.codeContent && (
                                        <div className="bg-gray-800 rounded-md p-3 mt-2">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs text-gray-400">{message.filePath}</span>
                                            <Badge variant="outline" className="text-xs">
                                              {detectLanguage(message.filePath || '')}
                                            </Badge>
                                          </div>
                                          <pre className="text-xs text-green-400 overflow-x-auto">
                                            <code>{message.codeContent.slice(0, 300)}...</code>
                                          </pre>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </ScrollArea>
                        {isOrchestrationActive && (
                          <div className="border-t p-4">
                            <div className="flex gap-2">
                              <Input
                                placeholder="Ask the AI agents anything about the development..."
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && sendUserMessage()}
                                className="flex-1"
                              />
                              <Button onClick={sendUserMessage} size="sm">
                                <Send className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Bot className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold mb-2">Ready to Start AI-Powered Development</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Launch our specialized AI agents to collaboratively build a comprehensive freight management ERP 
                      with real-time tracking, analytics, and microservice architecture.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                      <Badge variant="outline">Real-time Code Generation</Badge>
                      <Badge variant="outline">Agent Collaboration</Badge>
                      <Badge variant="outline">Live Chat Interface</Badge>
                      <Badge variant="outline">Microservice Architecture</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Generated Files Sidebar */}
          <div>
            <Card className="border-2 border-green-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-green-600" />
                  Generated Files
                  <Badge variant="outline">{generatedFiles.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {generatedFiles.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <FileCode className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-sm">Generated files will appear here</p>
                      </div>
                    ) : (
                      generatedFiles.map((file, index) => (
                        <div key={index} className="border rounded-lg p-3 bg-white shadow-sm">
                          <div className="flex items-start justify-between mb-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate" title={file.path}>
                                {file.path.split('/').pop()}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {file.path}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs ml-2">
                              {file.language}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>{file.linesOfCode} lines</span>
                            <span>by {file.modifiedBy}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Freight Management Dashboard */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
            <TabsTrigger value="quotations">Quotations</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="shipments">Shipments</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100">Total Inquiries</p>
                      <p className="text-3xl font-bold">{freightData?.analytics.summary.totalInquiries || '2,547'}</p>
                    </div>
                    <Package className="w-12 h-12 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100">Active Shipments</p>
                      <p className="text-3xl font-bold">{freightData?.analytics.summary.activeShipments || '1,234'}</p>
                    </div>
                    <Truck className="w-12 h-12 text-green-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100">Total Revenue</p>
                      <p className="text-3xl font-bold">${(freightData?.analytics.summary.totalRevenue || 2547000).toLocaleString()}</p>
                    </div>
                    <DollarSign className="w-12 h-12 text-purple-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100">On-Time Delivery</p>
                      <p className="text-3xl font-bold">{freightData?.analytics.performance.onTimeDeliveryRate || '94.7'}%</p>
                    </div>
                    <Clock className="w-12 h-12 text-orange-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transport Modes */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="text-center p-6">
                <Plane className="w-12 h-12 mx-auto text-blue-600 mb-4" />
                <h3 className="font-semibold">Air Freight</h3>
                <p className="text-2xl font-bold text-blue-600">342</p>
                <p className="text-sm text-gray-500">Active Shipments</p>
              </Card>

              <Card className="text-center p-6">
                <Ship className="w-12 h-12 mx-auto text-green-600 mb-4" />
                <h3 className="font-semibold">Sea Freight</h3>
                <p className="text-2xl font-bold text-green-600">1,876</p>
                <p className="text-sm text-gray-500">Active Shipments</p>
              </Card>

              <Card className="text-center p-6">
                <Truck className="w-12 h-12 mx-auto text-orange-600 mb-4" />
                <h3 className="font-semibold">Land Transport</h3>
                <p className="text-2xl font-bold text-orange-600">3,241</p>
                <p className="text-sm text-gray-500">Active Shipments</p>
              </Card>

              <Card className="text-center p-6">
                <Train className="w-12 h-12 mx-auto text-purple-600 mb-4" />
                <h3 className="font-semibold">Rail Freight</h3>
                <p className="text-2xl font-bold text-purple-600">567</p>
                <p className="text-sm text-gray-500">Active Shipments</p>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Inquiries</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center justify-between border-b pb-2">
                        <div>
                          <p className="font-medium">INQ-2024-{1000 + i}</p>
                          <p className="text-sm text-gray-500">LAX → JFK Express</p>
                        </div>
                        <Badge variant="outline">New</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Shipment Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { id: 'SHP-001', location: 'Los Angeles, CA', status: 'In Transit' },
                      { id: 'SHP-002', location: 'Chicago, IL', status: 'In Transit' },
                      { id: 'SHP-003', location: 'Houston, TX', status: 'Delivered' },
                      { id: 'SHP-004', location: 'Miami, FL', status: 'Customs' }
                    ].map((shipment) => (
                      <div key={shipment.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{shipment.id}</p>
                          <p className="text-sm text-gray-500">{shipment.location}</p>
                        </div>
                        <Badge variant={shipment.status === 'Delivered' ? 'default' : 'secondary'}>
                          {shipment.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="inquiries">
            <Card>
              <CardHeader>
                <CardTitle>Freight Inquiries Management</CardTitle>
                <CardDescription>
                  AI-powered inquiry processing and quote generation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <Button size="sm">
                        <Search className="w-4 h-4 mr-2" />
                        Search
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                    <Button>
                      <Package className="w-4 h-4 mr-2" />
                      New Inquiry
                    </Button>
                  </div>
                  
                  <Alert>
                    <Bot className="w-4 h-4" />
                    <AlertDescription>
                      AI Agent System is processing inquiries in real-time. Average response time: 30 seconds.
                    </AlertDescription>
                  </Alert>

                  <div className="border rounded-lg">
                    <div className="grid grid-cols-6 gap-4 p-4 font-medium border-b bg-gray-50">
                      <div>Inquiry ID</div>
                      <div>Customer</div>
                      <div>Route</div>
                      <div>Mode</div>
                      <div>Status</div>
                      <div>Actions</div>
                    </div>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="grid grid-cols-6 gap-4 p-4 border-b hover:bg-gray-50">
                        <div className="font-mono">INQ-{2024000 + i}</div>
                        <div>Global Corp {i}</div>
                        <div>LAX → JFK</div>
                        <div>
                          <Badge variant="outline">Air</Badge>
                        </div>
                        <div>
                          <Badge className={i % 3 === 0 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
                            {i % 3 === 0 ? 'Quoted' : 'Processing'}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">View</Button>
                          <Button size="sm" variant="outline">Quote</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quotations">
            <Card>
              <CardHeader>
                <CardTitle>Quotation Management</CardTitle>
                <CardDescription>
                  AI-optimized pricing and multi-carrier rate comparison
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <TrendingUp className="w-4 h-4" />
                    <AlertDescription>
                      ML pricing engine optimized quotes for 25% better margins this month.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="border rounded-lg">
                    <div className="grid grid-cols-7 gap-4 p-4 font-medium border-b bg-gray-50">
                      <div>Quote ID</div>
                      <div>Customer</div>
                      <div>Route</div>
                      <div>Total Cost</div>
                      <div>Selling Price</div>
                      <div>Margin</div>
                      <div>Actions</div>
                    </div>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="grid grid-cols-7 gap-4 p-4 border-b hover:bg-gray-50">
                        <div className="font-mono">QTE-{2024000 + i}</div>
                        <div>Global Corp {i}</div>
                        <div>LAX → JFK</div>
                        <div>${(1200 + i * 100).toLocaleString()}</div>
                        <div className="font-semibold">${(1500 + i * 125).toLocaleString()}</div>
                        <div className="text-green-600 font-medium">25%</div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">View</Button>
                          <Button size="sm">Convert</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Order Management</CardTitle>
                <CardDescription>
                  End-to-end order processing and fulfillment tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-yellow-800">Pending Orders</h3>
                      <p className="text-2xl font-bold text-yellow-600">23</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-blue-800">Processing</h3>
                      <p className="text-2xl font-bold text-blue-600">156</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-green-800">Completed</h3>
                      <p className="text-2xl font-bold text-green-600">1,247</p>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg">
                    <div className="grid grid-cols-6 gap-4 p-4 font-medium border-b bg-gray-50">
                      <div>Order ID</div>
                      <div>Customer</div>
                      <div>Date</div>
                      <div>Amount</div>
                      <div>Status</div>
                      <div>Actions</div>
                    </div>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="grid grid-cols-6 gap-4 p-4 border-b hover:bg-gray-50">
                        <div className="font-mono">ORD-{2024000 + i}</div>
                        <div>Global Corp {i}</div>
                        <div>2024-08-{8 - i}</div>
                        <div className="font-semibold">${(2500 + i * 300).toLocaleString()}</div>
                        <div>
                          <Badge className={i % 2 === 0 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}>
                            {i % 2 === 0 ? 'Shipped' : 'Processing'}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">View</Button>
                          <Button size="sm" variant="outline">Track</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shipments">
            <Card>
              <CardHeader>
                <CardTitle>Shipment Tracking & Management</CardTitle>
                <CardDescription>
                  Real-time shipment tracking with carrier API integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <Map className="w-4 h-4" />
                    <AlertDescription>
                      Real-time tracking powered by 15+ carrier APIs and IoT sensors.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="border rounded-lg">
                    <div className="grid grid-cols-7 gap-4 p-4 font-medium border-b bg-gray-50">
                      <div>Shipment ID</div>
                      <div>Tracking #</div>
                      <div>Origin</div>
                      <div>Destination</div>
                      <div>Current Location</div>
                      <div>Status</div>
                      <div>ETA</div>
                    </div>
                    {[
                      { id: 'SHP-001', tracking: 'TRK-ABC123', origin: 'LAX', dest: 'JFK', location: 'Denver, CO', status: 'In Transit', eta: '2024-08-10' },
                      { id: 'SHP-002', tracking: 'TRK-DEF456', origin: 'SEA', dest: 'MIA', location: 'Houston, TX', status: 'In Transit', eta: '2024-08-09' },
                      { id: 'SHP-003', tracking: 'TRK-GHI789', origin: 'LAX', dest: 'ORD', location: 'Chicago, IL', status: 'Delivered', eta: '2024-08-08' },
                      { id: 'SHP-004', tracking: 'TRK-JKL012', origin: 'JFK', dest: 'LAX', location: 'Customs Phoenix', status: 'Customs', eta: '2024-08-11' }
                    ].map((shipment) => (
                      <div key={shipment.id} className="grid grid-cols-7 gap-4 p-4 border-b hover:bg-gray-50">
                        <div className="font-mono">{shipment.id}</div>
                        <div className="font-mono text-blue-600">{shipment.tracking}</div>
                        <div>{shipment.origin}</div>
                        <div>{shipment.dest}</div>
                        <div>{shipment.location}</div>
                        <div>
                          <Badge className={
                            shipment.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                            shipment.status === 'Customs' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }>
                            {shipment.status}
                          </Badge>
                        </div>
                        <div>{shipment.eta}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="space-y-6">
              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card className="text-center p-6">
                  <CheckCircle className="w-8 h-8 mx-auto text-green-600 mb-2" />
                  <h3 className="font-semibold">On-Time Delivery</h3>
                  <p className="text-2xl font-bold text-green-600">{freightData?.analytics.performance.onTimeDeliveryRate || 94.7}%</p>
                </Card>

                <Card className="text-center p-6">
                  <Users className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                  <h3 className="font-semibold">Customer Satisfaction</h3>
                  <p className="text-2xl font-bold text-blue-600">{freightData?.analytics.performance.customerSatisfactionScore || 4.6}/5.0</p>
                </Card>

                <Card className="text-center p-6">
                  <Clock className="w-8 h-8 mx-auto text-orange-600 mb-2" />
                  <h3 className="font-semibold">Avg Transit Time</h3>
                  <p className="text-2xl font-bold text-orange-600">{freightData?.analytics.performance.averageTransitTime || 3.2} days</p>
                </Card>

                <Card className="text-center p-6">
                  <DollarSign className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                  <h3 className="font-semibold">Cost Efficiency</h3>
                  <p className="text-2xl font-bold text-purple-600">{freightData?.analytics.performance.costEfficiencyIndex || 87.3}%</p>
                </Card>

                <Card className="text-center p-6">
                  <TrendingUp className="w-8 h-8 mx-auto text-indigo-600 mb-2" />
                  <h3 className="font-semibold">Carrier Performance</h3>
                  <p className="text-2xl font-bold text-indigo-600">{freightData?.analytics.performance.carrierPerformanceScore || 92.1}%</p>
                </Card>
              </div>

              {/* Growth Trends */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Growth Analytics</CardTitle>
                    <CardDescription>Business growth indicators and trends</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Inquiry Growth</span>
                        <span className="text-green-600 font-semibold">+{freightData?.analytics.trends.inquiryGrowth || 12.5}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Conversion Rate</span>
                        <span className="text-blue-600 font-semibold">{freightData?.analytics.trends.conversionRate || 78.3}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Revenue Growth</span>
                        <span className="text-purple-600 font-semibold">+{freightData?.analytics.trends.revenueGrowth || 23.7}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Seasonal Trends</CardTitle>
                    <CardDescription>Quarterly performance index</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {['Q1', 'Q2', 'Q3', 'Q4'].map((quarter, index) => (
                        <div key={quarter} className="space-y-2">
                          <div className="flex justify-between">
                            <span>{quarter} 2024</span>
                            <span>{Object.values(freightData?.analytics.trends.seasonalTrends || { q1: 85, q2: 92, q3: 103, q4: 120 })[index]}</span>
                          </div>
                          <Progress 
                            value={(Object.values(freightData?.analytics.trends.seasonalTrends || { q1: 85, q2: 92, q3: 103, q4: 120 })[index] / 120) * 100} 
                            className="h-2" 
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm mt-8">
          <p>AVAGlobal Freight ERP Platform - Powered by CodeStudio Enterprise SDLC Orchestration</p>
          <p>Demonstrating complete end-to-end software development lifecycle with 12+ AI agents</p>
        </div>
      </div>
    </div>
  );
}