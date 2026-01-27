import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Bot, Code, Workflow, Package, Sparkles, Cloud, Shield, Zap } from 'lucide-react';
import SuperAgentChat from './superagent/Chat';
import IDE from './superagent/IDE';
import WorkflowBuilder from './superagent/WorkflowBuilder';
import ToolMarketplace from './superagent/ToolMarketplace';
import { useLanguage } from '@/contexts/LanguageContext';

type WorkspaceType = 'chat' | 'ide' | 'workflow' | 'tools';

interface OrchestrationStats {
  success: boolean;
  stats: {
    agents: number;
    llmProviders: number;
    models: number;
    mcpTools: number;
    languages: number;
    platforms: number;
    uptime: string;
    costSavings: string;
  };
}

export default function ShaktiAI() {
  const { t } = useLanguage();
  const [location, navigate] = useLocation();
  
  // Fetch orchestration telemetry stats
  const { data: orchestrationStats } = useQuery<OrchestrationStats>({
    queryKey: ['/api/orchestration/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  // Extract workspace from URL path (e.g., /shakti-ai/chat -> 'chat')
  const pathParts = location.split('/');
  const urlWorkspace = pathParts[2] as WorkspaceType | undefined;
  
  // Set active tab based on URL, default to 'chat'
  const validWorkspaces: WorkspaceType[] = ['chat', 'ide', 'workflow', 'tools'];
  const initialTab = urlWorkspace && validWorkspaces.includes(urlWorkspace) ? urlWorkspace : 'chat';
  const [activeTab, setActiveTab] = useState<WorkspaceType>(initialTab);
  
  // Sync URL with activeTab
  useEffect(() => {
    const currentWorkspace = pathParts[2];
    if (currentWorkspace !== activeTab) {
      navigate(`/shakti-ai/${activeTab}`, { replace: true });
    }
  }, [activeTab]);
  
  // Update activeTab when URL changes (back/forward navigation)
  useEffect(() => {
    if (urlWorkspace && validWorkspaces.includes(urlWorkspace) && urlWorkspace !== activeTab) {
      setActiveTab(urlWorkspace);
    }
  }, [urlWorkspace]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-white">
      {/* Hero Header - Responsive */}
      <div className="border-b border-border bg-gradient-to-r from-primary/5 to-purple-500/5 backdrop-blur-sm" data-testid="shakti-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-primary to-purple-600 rounded-xl shadow-lg" data-testid="icon-shakti-logo">
                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-foreground" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent" data-testid="text-shakti-title">SHAKTI AI</h1>
                <p className="text-sm sm:text-base text-foreground-secondary" data-testid="text-shakti-subtitle">Universal Agent Platform</p>
              </div>
            </div>
            
            {/* Live Metrics - Responsive */}
            <div className="flex gap-2 sm:gap-4 w-full sm:w-auto" data-testid="container-metrics">
              <div className="flex-1 sm:flex-none glass rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 border border-primary/20" data-testid="metric-agents">
                <div className="text-lg sm:text-xl font-bold text-primary" data-testid="text-agents-count">
                  {orchestrationStats?.stats.agents || 267}+
                </div>
                <div className="text-xs text-foreground-secondary" data-testid="text-agents-label">Agents</div>
              </div>
              <div className="flex-1 sm:flex-none glass rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 border border-teal-500/20" data-testid="metric-tools">
                <div className="text-lg sm:text-xl font-bold text-teal-600" data-testid="text-tools-count">
                  {orchestrationStats?.stats.mcpTools || 93}
                </div>
                <div className="text-xs text-foreground-secondary" data-testid="text-tools-label">Tools</div>
              </div>
              <div className="flex-1 sm:flex-none glass rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 border border-purple-500/20" data-testid="metric-llms">
                <div className="text-lg sm:text-xl font-bold text-purple-600" data-testid="text-llms-count">
                  {orchestrationStats?.stats.llmProviders || 23}+
                </div>
                <div className="text-xs text-foreground-secondary" data-testid="text-llms-label">LLMs</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Responsive */}
      <div className="max-w-[1920px] mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 glass border border-border/50 p-1 gap-1">
            <TabsTrigger 
              value="chat" 
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:border data-[state=active]:border-primary/20 text-xs sm:text-sm px-2 sm:px-4 text-foreground-secondary"
              data-testid="tab-chat"
            >
              <Bot className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Chat</span>
              <span className="xs:hidden">Chat</span>
            </TabsTrigger>
            <TabsTrigger 
              value="ide" 
              className="data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-600 data-[state=active]:border data-[state=active]:border-purple-500/20 text-xs sm:text-sm px-2 sm:px-4 text-foreground-secondary"
              data-testid="tab-ide"
            >
              <Code className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">AI IDE</span>
              <span className="xs:hidden">IDE</span>
            </TabsTrigger>
            <TabsTrigger 
              value="workflow" 
              className="data-[state=active]:bg-teal-500/10 data-[state=active]:text-teal-600 data-[state=active]:border data-[state=active]:border-teal-500/20 text-xs sm:text-sm px-2 sm:px-4 text-foreground-secondary"
              data-testid="tab-workflow"
            >
              <Workflow className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Workflows</span>
              <span className="xs:hidden">Flow</span>
            </TabsTrigger>
            <TabsTrigger 
              value="tools" 
              className="data-[state=active]:bg-pink-500/10 data-[state=active]:text-pink-600 data-[state=active]:border data-[state=active]:border-pink-500/20 text-xs sm:text-sm px-2 sm:px-4 text-foreground-secondary"
              data-testid="tab-tools"
            >
              <Package className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Tools (102)</span>
              <span className="sm:hidden">Tools</span>
            </TabsTrigger>
          </TabsList>

          {/* Chat Workspace */}
          <TabsContent value="chat" className="mt-6" data-testid="workspace-chat">
            <Card className="glass-card border-border/50 backdrop-blur-sm">
              <CardContent className="p-0">
                <SuperAgentChat />
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI IDE Workspace - Responsive */}
          <TabsContent value="ide" className="mt-4 sm:mt-6" data-testid="workspace-ide">
            <Card className="glass-card border-border/50 backdrop-blur-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <Code className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" data-testid="icon-ide" />
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground" data-testid="text-ide-title">LSP-Powered Code Editor</h2>
                  </div>
                  <p className="text-sm sm:text-base text-foreground-secondary" data-testid="text-ide-description">Surgical code editing with 90% token reduction vs Replit</p>
                </div>
                <IDE />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Visual Workflow Builder - Responsive */}
          <TabsContent value="workflow" className="mt-4 sm:mt-6" data-testid="workspace-workflow">
            <Card className="glass-card border-border/50 backdrop-blur-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <Workflow className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600" data-testid="icon-workflow" />
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground" data-testid="text-workflow-title">Visual Workflow Builder</h2>
                  </div>
                  <p className="text-sm sm:text-base text-foreground-secondary" data-testid="text-workflow-description">Orchestrate 267+ agents and 102 tools with drag-and-drop</p>
                </div>
                <WorkflowBuilder />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tool Marketplace - Responsive */}
          <TabsContent value="tools" className="mt-4 sm:mt-6" data-testid="workspace-tools">
            <Card className="glass-card border-border/50 backdrop-blur-sm">
              <CardContent className="p-4 sm:p-6">
                <div className="mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <Package className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600" data-testid="icon-tools" />
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground" data-testid="text-tools-title">Tool Marketplace</h2>
                  </div>
                  <p className="text-sm sm:text-base text-foreground-secondary" data-testid="text-tools-description">102 production tools across 17 categories. Growing to 500+.</p>
                </div>
                <ToolMarketplace />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Key Capabilities Banner - Responsive */}
        <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4" data-testid="container-capabilities">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-900/10 border-blue-500/30 backdrop-blur-sm" data-testid="card-cloud-deployment">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg" data-testid="icon-cloud">
                  <Cloud className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1" data-testid="text-cloud-title">Cloud Deployment</h3>
                  <p className="text-xs sm:text-sm text-foreground-secondary" data-testid="text-cloud-description">Deploy entire cloud companies to AWS, GCP, Azure from a single interface</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-900/10 border-purple-500/30 backdrop-blur-sm" data-testid="card-enterprise-security">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg" data-testid="icon-security">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1" data-testid="text-security-title">Enterprise Security</h3>
                  <p className="text-xs sm:text-sm text-foreground-secondary" data-testid="text-security-description">OWASP Top 10 LLM coverage with SOC2/GDPR/HIPAA compliance</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-teal-500/10 to-teal-900/10 border-teal-500/30 backdrop-blur-sm sm:col-span-2 lg:col-span-1" data-testid="card-semantic-coding">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="p-2 bg-teal-500/20 rounded-lg" data-testid="icon-semantic">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1" data-testid="text-semantic-title">Semantic Coding</h3>
                  <p className="text-xs sm:text-sm text-foreground-secondary" data-testid="text-semantic-description">LSP-based surgical edits. 90% token reduction vs traditional file rewrites</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
