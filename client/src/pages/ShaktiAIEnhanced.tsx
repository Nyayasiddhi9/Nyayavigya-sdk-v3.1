import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, Bot, Zap, Globe, Code, Search, 
  MessageSquare, History, Settings, ChevronDown,
  Loader2, ArrowUp
} from 'lucide-react';
import { ShaktiSearchBox } from '@/components/shakti/ShaktiSearchBox';
import { SparkleCard } from '@/components/shakti/SparkleCard';
import { AgentDomainSelector } from '@/components/shakti/AgentDomainSelector';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface SearchOptions {
  mode: 'quick' | 'deep' | 'code' | 'research';
  webSearch: boolean;
  multimodal: boolean;
}

interface Source {
  title: string;
  url: string;
  snippet: string;
  domain: string;
  favicon?: string;
  publishedDate?: string;
}

interface SearchResult {
  id: string;
  query: string;
  title: string;
  content: string;
  sources: Source[];
  agentName: string;
  agentDomain: string;
  timestamp: Date;
  followUpSuggestions: string[];
}

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

export default function ShaktiAIEnhanced() {
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [chatMode, setChatMode] = useState<'wai' | 'legal' | 'super'>('super');
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [showDomainSelector, setShowDomainSelector] = useState(false);
  const [activeView, setActiveView] = useState<'search' | 'history'>('search');

  const { data: orchestrationStats } = useQuery<OrchestrationStats>({
    queryKey: ['/api/orchestration/stats'],
    refetchInterval: 30000,
  });

  const searchMutation = useMutation({
    mutationFn: async ({ query, options }: { query: string; options: SearchOptions }) => {
      const endpoint = chatMode === 'legal' 
        ? '/api/legal-chat/sessions'
        : chatMode === 'super'
        ? '/api/super-chat/sessions'
        : '/api/wai-chat/sessions';

      const sessionMode = options.mode === 'deep' || options.mode === 'research' 
        ? 'multi-agent' 
        : 'single-agent';

      const sessionRes = await apiRequest('POST', endpoint, {
        mode: sessionMode,
        webSearchEnabled: options.webSearch,
        domains: selectedDomains.length > 0 ? selectedDomains : undefined,
      });
      const session = await sessionRes.json();
      
      const baseEndpoint = endpoint.replace('/sessions', '');
      const messageRes = await apiRequest('POST', `${baseEndpoint}/sessions/${session.session.id}/messages`, {
        message: query,
        searchMode: options.mode,
        webSearch: options.webSearch,
      });
      return messageRes.json();
    },
    onSuccess: (data, variables) => {
      const sources: Source[] = data.sources?.map((s: any) => ({
        title: s.title || 'Source',
        url: s.url || '#',
        snippet: s.snippet || s.content || '',
        domain: s.domain || new URL(s.url || 'https://example.com').hostname,
        publishedDate: s.date,
      })) || [];

      const newResult: SearchResult = {
        id: Date.now().toString(),
        query: variables.query,
        title: data.message?.title || `Results for "${variables.query}"`,
        content: data.message?.content || data.response || 'No response received',
        sources,
        agentName: data.message?.agentName || data.agentName || 'Shakti AI',
        agentDomain: data.message?.domain || data.domain || chatMode,
        timestamp: new Date(),
        followUpSuggestions: data.followUpSuggestions || data.suggestions || [],
      };
      
      setResults(prev => [newResult, ...prev]);
      setIsSearching(false);

      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    },
    onError: (error: Error) => {
      setIsSearching(false);
      toast({
        title: 'Search failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSearch = (query: string, options: SearchOptions) => {
    setIsSearching(true);
    searchMutation.mutate({ query, options });
  };

  const handleFollowUp = (question: string) => {
    handleSearch(question, { mode: 'quick', webSearch: true, multimodal: false });
  };

  const totalAgents = chatMode === 'super' ? 550 : 275;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-blue-50/30 dark:from-gray-950 dark:via-purple-950/20 dark:to-blue-950/20">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl" data-testid="shakti-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-primary to-purple-600 rounded-xl shadow-lg shadow-primary/20">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent" data-testid="text-title">
                    SHAKTI AI
                  </h1>
                  <p className="text-xs text-muted-foreground">Powered by WAI SDK v2.0</p>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-2 ml-6">
                <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary" data-testid="badge-agents">
                  <Bot className="w-3 h-3 mr-1" />
                  {totalAgents}+ Agents
                </Badge>
                <Badge variant="outline" className="bg-green-500/10 border-green-500/30 text-green-600" data-testid="badge-tools">
                  <Zap className="w-3 h-3 mr-1" />
                  {orchestrationStats?.stats.mcpTools || 93} Tools
                </Badge>
                <Badge variant="outline" className="bg-purple-500/10 border-purple-500/30 text-purple-600" data-testid="badge-llms">
                  <Globe className="w-3 h-3 mr-1" />
                  {orchestrationStats?.stats.llmProviders || 23}+ LLMs
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={activeView === 'search' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveView('search')}
                data-testid="view-search"
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
              <Button
                variant={activeView === 'history' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveView('history')}
                data-testid="view-history"
              >
                <History className="w-4 h-4 mr-2" />
                History
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {results.length === 0 && !isSearching ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
            <div className="text-center space-y-4">
              <div className="inline-flex p-4 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 mb-4">
                <Sparkles className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground" data-testid="welcome-title">
                What would you like to explore?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl">
                {chatMode === 'super' 
                  ? 'Access 550 specialized AI agents across development, business, and legal domains'
                  : chatMode === 'legal'
                  ? 'Get expert legal assistance with 275 specialized legal AI agents'
                  : 'Build, research, and create with 275 AI agents at your service'}
              </p>
            </div>

            <ShaktiSearchBox 
              onSubmit={handleSearch} 
              isLoading={isSearching}
              showSuggestions={true}
            />

            <div className="w-full max-w-4xl">
              <Button
                variant="ghost"
                className="w-full justify-between text-muted-foreground hover:text-foreground"
                onClick={() => setShowDomainSelector(!showDomainSelector)}
                data-testid="toggle-domain-selector"
              >
                <span className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Customize agent selection
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showDomainSelector ? 'rotate-180' : ''}`} />
              </Button>

              {showDomainSelector && (
                <div className="mt-4">
                  <AgentDomainSelector
                    selectedDomains={selectedDomains}
                    onDomainsChange={setSelectedDomains}
                    mode={chatMode}
                    onModeChange={setChatMode}
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="sticky top-20 z-40 -mx-4 px-4 py-4 bg-background/80 backdrop-blur-xl border-b border-border/50">
              <ShaktiSearchBox 
                onSubmit={handleSearch} 
                isLoading={isSearching}
                showSuggestions={false}
                placeholder="Ask a follow-up question..."
              />
            </div>

            <ScrollArea ref={scrollRef} className="h-[calc(100vh-280px)]">
              <div className="space-y-6 pb-8">
                {isSearching && (
                  <Card className="border-border/50 bg-background/50 backdrop-blur-sm animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="text-muted-foreground">Researching with {totalAgents}+ agents...</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {results.map((result) => (
                  <SparkleCard
                    key={result.id}
                    title={result.title}
                    content={result.content}
                    sources={result.sources}
                    agentName={result.agentName}
                    agentDomain={result.agentDomain}
                    timestamp={result.timestamp}
                    followUpSuggestions={result.followUpSuggestions}
                    onFollowUp={handleFollowUp}
                  />
                ))}
              </div>
            </ScrollArea>

            {results.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="fixed bottom-6 right-6 shadow-lg"
                onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                data-testid="scroll-to-top"
              >
                <ArrowUp className="w-4 h-4 mr-2" />
                Back to top
              </Button>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-border/50 bg-background/50 backdrop-blur-sm py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>Powered by WAI SDK v2.0</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">{totalAgents}+ AI Agents</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">{orchestrationStats?.stats.llmProviders || 23}+ LLM Providers</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {orchestrationStats?.stats.costSavings || '90%'} Cost Savings
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
