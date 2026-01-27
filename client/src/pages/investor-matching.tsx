import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Building2, TrendingUp, MapPin, DollarSign, Users, Send, CheckCircle2, Clock, XCircle, Search } from 'lucide-react';

interface Investor {
  id: number;
  investorType: string;
  firmName: string | null;
  fundSize: string | null;
  investmentRange: string | null;
  industries: string[];
  stages: string[];
  geography: string[];
  bio: string | null;
  websiteUrl: string | null;
  linkedinUrl: string | null;
  verified: boolean;
  activelyInvesting: boolean;
  responseRate: number | null;
}

interface InvestorMatch {
  id: number;
  investorId: number;
  matchScore: number;
  matchReasons: string[];
  industryMatch: boolean;
  stageMatch: boolean;
  geographyMatch: boolean;
  status: string;
  investor?: Investor;
}

interface InvestorConnection {
  id: number;
  investorId: number;
  connectionType: string;
  status: string;
  message: string | null;
  pitchDeckUrl: string | null;
  scheduledMeetingDate: string | null;
  responseMessage: string | null;
  createdAt: string;
  investor?: Investor;
}

const investorTypeColors: Record<string, string> = {
  'angel': 'bg-purple-500/20 text-purple-400 border-purple-500/50',
  'vc': 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  'corporate_vc': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50',
  'accelerator': 'bg-green-500/20 text-green-400 border-green-500/50',
  'family_office': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
};

const connectionStatusColors: Record<string, { bg: string; icon: any }> = {
  'pending': { bg: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50', icon: Clock },
  'accepted': { bg: 'bg-green-500/20 text-green-400 border-green-500/50', icon: CheckCircle2 },
  'declined': { bg: 'bg-red-500/20 text-red-400 border-red-500/50', icon: XCircle },
  'completed': { bg: 'bg-blue-500/20 text-blue-400 border-blue-500/50', icon: CheckCircle2 },
};

export default function InvestorMatching() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('discover');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStage, setFilterStage] = useState<string>('all');
  
  // Get current startup from dashboard (assuming we have it in context or from dashboard API)
  const { data: dashboardData } = useQuery({
    queryKey: ['/api/wizards/founders/me/dashboard'],
  });

  const currentStartup = (dashboardData as any)?.startups?.[0];
  const startupId = currentStartup?.id;

  // Discover tab - all investors
  const { data: investorsData, isLoading: investorsLoading } = useQuery({
    queryKey: ['/api/wizards/investors', { search: searchTerm, type: filterType, stage: filterStage }],
    enabled: activeTab === 'discover',
  });

  // AI Matches tab
  const { data: matchesData, isLoading: matchesLoading } = useQuery({
    queryKey: ['/api/wizards/startups', startupId, 'investor-matches'],
    enabled: activeTab === 'matches' && !!startupId,
  });

  // Connections tab
  const { data: connectionsData, isLoading: connectionsLoading } = useQuery({
    queryKey: ['/api/wizards/startups', startupId, 'investor-connections'],
    enabled: activeTab === 'connections' && !!startupId,
  });

  // Create connection mutation
  const createConnectionMutation = useMutation({
    mutationFn: async (data: { investorId: number; message: string }) => {
      return apiRequest('/api/wizards/investor-connections', 'POST', {
        startupId,
        investorId: data.investorId,
        connectionType: 'intro_request',
        message: data.message,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/startups', startupId, 'investor-connections'] });
      toast({
        title: 'Connection request sent',
        description: 'The investor will be notified of your request.',
      });
    },
  });

  const investors = (investorsData as any)?.investors || [];
  const matches = (matchesData as any)?.matches || [];
  const connections = (connectionsData as any)?.connections || [];

  const InvestorCard = ({ investor, matchScore, matchReasons }: { investor: Investor; matchScore?: number; matchReasons?: string[] }) => (
    <Card className="bg-[hsl(222,47%,15%)] border-gray-800 hover:border-[hsl(217,91%,60%)] transition-colors" data-testid={`card-investor-${investor.id}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-gray-50 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {investor.firmName || 'Independent Investor'}
              {investor.verified && (
                <CheckCircle2 className="w-4 h-4 text-[hsl(217,91%,60%)]" data-testid={`icon-verified-${investor.id}`} />
              )}
            </CardTitle>
            <CardDescription className="mt-1">
              <Badge variant="outline" className={investorTypeColors[investor.investorType] || ''} data-testid={`badge-type-${investor.id}`}>
                {investor.investorType.replace('_', ' ').toUpperCase()}
              </Badge>
            </CardDescription>
          </div>
          {matchScore !== undefined && (
            <div className="text-right" data-testid={`match-score-${investor.id}`}>
              <div className="text-2xl font-bold text-[hsl(217,91%,60%)]">{matchScore}%</div>
              <div className="text-xs text-gray-400">Match</div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {investor.bio && (
          <p className="text-sm text-gray-400 line-clamp-2" data-testid={`text-bio-${investor.id}`}>{investor.bio}</p>
        )}
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          {investor.fundSize && (
            <div className="flex items-center gap-2 text-gray-300">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span data-testid={`text-fundsize-${investor.id}`}>{investor.fundSize}</span>
            </div>
          )}
          {investor.investmentRange && (
            <div className="flex items-center gap-2 text-gray-300">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span data-testid={`text-range-${investor.id}`}>{investor.investmentRange}</span>
            </div>
          )}
          {investor.geography && investor.geography.length > 0 && (
            <div className="flex items-center gap-2 text-gray-300">
              <MapPin className="w-4 h-4 text-orange-400" />
              <span data-testid={`text-geography-${investor.id}`}>{investor.geography[0]}{investor.geography.length > 1 && ` +${investor.geography.length - 1}`}</span>
            </div>
          )}
          {investor.responseRate !== null && (
            <div className="flex items-center gap-2 text-gray-300">
              <Users className="w-4 h-4 text-purple-400" />
              <span data-testid={`text-responserate-${investor.id}`}>{investor.responseRate}% response</span>
            </div>
          )}
        </div>

        {matchReasons && matchReasons.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-400">Why this match:</div>
            <div className="flex flex-wrap gap-1">
              {matchReasons.slice(0, 3).map((reason, idx) => (
                <Badge key={idx} variant="outline" className="text-xs bg-[hsl(217,91%,60%)]/10 text-[hsl(217,91%,60%)] border-[hsl(217,91%,60%)]/30" data-testid={`badge-reason-${investor.id}-${idx}`}>
                  {reason}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {investor.industries && investor.industries.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {investor.industries.slice(0, 3).map((industry, idx) => (
              <Badge key={idx} variant="outline" className="text-xs" data-testid={`badge-industry-${investor.id}-${idx}`}>
                {industry}
              </Badge>
            ))}
            {investor.industries.length > 3 && (
              <Badge variant="outline" className="text-xs" data-testid={`badge-industry-more-${investor.id}`}>
                +{investor.industries.length - 3} more
              </Badge>
            )}
          </div>
        )}

        <Button 
          className="w-full bg-[hsl(217,91%,60%)] hover:bg-[hsl(217,91%,50%)] text-white disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => {
            if (!startupId) {
              toast({
                title: 'Startup Required',
                description: 'Please create a startup profile before connecting with investors.',
                variant: 'destructive',
              });
              return;
            }
            const message = matchReasons 
              ? `Hi, I'm interested in connecting. Your focus on ${matchReasons[0]} aligns well with our startup.`
              : "Hi, I'm interested in connecting to discuss potential investment opportunities.";
            createConnectionMutation.mutate({ investorId: investor.id, message });
          }}
          disabled={createConnectionMutation.isPending || !startupId}
          data-testid={`button-connect-${investor.id}`}
        >
          <Send className="w-4 h-4 mr-2" />
          Request Connection
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-[hsl(222,47%,11%)] text-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-50 mb-2" data-testid="heading-investor-matching">Investor Matching</h1>
          <p className="text-gray-400" data-testid="text-description">Discover investors, view AI-powered matches, and manage connections</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-[hsl(222,47%,15%)] border border-gray-800" data-testid="tabs-investor">
            <TabsTrigger value="discover" className="data-[state=active]:bg-[hsl(217,91%,60%)] data-[state=active]:text-white" data-testid="tab-discover">
              <Search className="w-4 h-4 mr-2" />
              Discover
            </TabsTrigger>
            <TabsTrigger value="matches" className="data-[state=active]:bg-[hsl(217,91%,60%)] data-[state=active]:text-white" data-testid="tab-matches">
              <TrendingUp className="w-4 h-4 mr-2" />
              AI Matches
            </TabsTrigger>
            <TabsTrigger value="connections" className="data-[state=active]:bg-[hsl(217,91%,60%)] data-[state=active]:text-white" data-testid="tab-connections">
              <Users className="w-4 h-4 mr-2" />
              Connections
            </TabsTrigger>
          </TabsList>

          {/* Discover Tab */}
          <TabsContent value="discover" className="space-y-4">
            <Card className="bg-[hsl(222,47%,15%)] border-gray-800">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search investors by name, firm, or industry..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-[hsl(222,47%,11%)] border-gray-700 text-gray-50"
                      data-testid="input-search-investors"
                    />
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-full md:w-[200px] bg-[hsl(222,47%,11%)] border-gray-700 text-gray-50" data-testid="select-investor-type">
                      <SelectValue placeholder="Investor Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="angel">Angel</SelectItem>
                      <SelectItem value="vc">VC</SelectItem>
                      <SelectItem value="corporate_vc">Corporate VC</SelectItem>
                      <SelectItem value="accelerator">Accelerator</SelectItem>
                      <SelectItem value="family_office">Family Office</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStage} onValueChange={setFilterStage}>
                    <SelectTrigger className="w-full md:w-[200px] bg-[hsl(222,47%,11%)] border-gray-700 text-gray-50" data-testid="select-investor-stage">
                      <SelectValue placeholder="Investment Stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stages</SelectItem>
                      <SelectItem value="pre_seed">Pre-Seed</SelectItem>
                      <SelectItem value="seed">Seed</SelectItem>
                      <SelectItem value="series_a">Series A</SelectItem>
                      <SelectItem value="series_b">Series B+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {investorsLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="bg-[hsl(222,47%,15%)] border-gray-800">
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4 bg-gray-700" />
                      <Skeleton className="h-4 w-1/4 bg-gray-700 mt-2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full bg-gray-700" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : investors.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {investors.map((investor: Investor) => (
                  <InvestorCard key={investor.id} investor={investor} />
                ))}
              </div>
            ) : (
              <Card className="bg-[hsl(222,47%,15%)] border-gray-800">
                <CardContent className="py-12 text-center">
                  <Building2 className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400" data-testid="text-no-investors">No investors found. Try adjusting your filters.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* AI Matches Tab */}
          <TabsContent value="matches" className="space-y-4">
            {!startupId ? (
              <Card className="bg-[hsl(222,47%,15%)] border-gray-800">
                <CardContent className="py-12 text-center">
                  <TrendingUp className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400" data-testid="text-no-startup">Please create a startup profile to view AI-matched investors.</p>
                </CardContent>
              </Card>
            ) : matchesLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="bg-[hsl(222,47%,15%)] border-gray-800">
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4 bg-gray-700" />
                      <Skeleton className="h-4 w-1/4 bg-gray-700 mt-2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full bg-gray-700" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : matches.length > 0 ? (
              <div className="space-y-6">
                <Card className="bg-[hsl(222,47%,15%)] border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-gray-50" data-testid="heading-match-summary">Match Summary</CardTitle>
                    <CardDescription data-testid="text-match-count">{matches.length} investors matched to your startup</CardDescription>
                  </CardHeader>
                </Card>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...matches]
                    .sort((a: InvestorMatch, b: InvestorMatch) => b.matchScore - a.matchScore)
                    .map((match: InvestorMatch) => match.investor && (
                      <InvestorCard 
                        key={match.id} 
                        investor={match.investor} 
                        matchScore={match.matchScore}
                        matchReasons={match.matchReasons}
                      />
                    ))}
                </div>
              </div>
            ) : (
              <Card className="bg-[hsl(222,47%,15%)] border-gray-800">
                <CardContent className="py-12 text-center">
                  <TrendingUp className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400 mb-4" data-testid="text-no-matches">No AI matches yet. Our system is analyzing potential investors for your startup.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Connections Tab */}
          <TabsContent value="connections" className="space-y-4">
            {!startupId ? (
              <Card className="bg-[hsl(222,47%,15%)] border-gray-800">
                <CardContent className="py-12 text-center">
                  <Users className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400" data-testid="text-no-startup-connections">Please create a startup profile to manage investor connections.</p>
                </CardContent>
              </Card>
            ) : connectionsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="bg-[hsl(222,47%,15%)] border-gray-800">
                    <CardContent className="py-6">
                      <Skeleton className="h-20 w-full bg-gray-700" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : connections.length > 0 ? (
              <div className="space-y-4">
                {connections.map((connection: InvestorConnection) => {
                  const StatusIcon = connectionStatusColors[connection.status]?.icon || Clock;
                  return connection.investor ? (
                    <Card key={connection.id} className="bg-[hsl(222,47%,15%)] border-gray-800" data-testid={`card-connection-${connection.id}`}>
                      <CardContent className="py-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Building2 className="w-5 h-5 text-gray-400" />
                              <h3 className="text-lg font-semibold text-gray-50" data-testid={`text-firm-${connection.id}`}>
                                {connection.investor.firmName || 'Independent Investor'}
                              </h3>
                            </div>
                            <Badge variant="outline" className={investorTypeColors[connection.investor.investorType] || ''} data-testid={`badge-investor-type-${connection.id}`}>
                              {connection.investor.investorType.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className={connectionStatusColors[connection.status]?.bg || ''} data-testid={`badge-status-${connection.id}`}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {connection.status}
                            </Badge>
                            <div className="text-xs text-gray-400 mt-1" data-testid={`text-date-${connection.id}`}>
                              {new Date(connection.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        {connection.message && (
                          <div className="bg-[hsl(222,47%,11%)] rounded-lg p-3 mb-3">
                            <div className="text-xs text-gray-400 mb-1">Your message:</div>
                            <p className="text-sm text-gray-300" data-testid={`text-message-${connection.id}`}>{connection.message}</p>
                          </div>
                        )}
                        {connection.responseMessage && (
                          <div className="bg-[hsl(217,91%,60%)]/10 border border-[hsl(217,91%,60%)]/30 rounded-lg p-3">
                            <div className="text-xs text-[hsl(217,91%,60%)] mb-1">Investor response:</div>
                            <p className="text-sm text-gray-300" data-testid={`text-response-${connection.id}`}>{connection.responseMessage}</p>
                          </div>
                        )}
                        {connection.scheduledMeetingDate && (
                          <div className="mt-3 flex items-center gap-2 text-sm text-green-400">
                            <CheckCircle2 className="w-4 h-4" />
                            <span data-testid={`text-meeting-${connection.id}`}>Meeting scheduled: {new Date(connection.scheduledMeetingDate).toLocaleString()}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : null;
                })}
              </div>
            ) : (
              <Card className="bg-[hsl(222,47%,15%)] border-gray-800">
                <CardContent className="py-12 text-center">
                  <Users className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400" data-testid="text-no-connections">No connections yet. Start connecting with investors from the Discover or AI Matches tabs.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
