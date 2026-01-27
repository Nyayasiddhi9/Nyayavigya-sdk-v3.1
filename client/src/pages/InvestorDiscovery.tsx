import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { PitchDeckUploadDialog } from '@/components/PitchDeckUploadDialog';
import {
  TrendingUp,
  Building2,
  MapPin,
  Briefcase,
  Check,
  X,
  Search,
  Filter,
  DollarSign,
  Users,
  Sparkles,
  Send,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';

interface Investor {
  id: number;
  firmName: string;
  investorType: string;
  fundSize: string;
  checkSizeMin: string;
  checkSizeMax: string;
  investmentStage: string[];
  industries: string[];
  geographies: string[];
  portfolio: any[];
  expertise: string[];
  bio: string;
  linkedinUrl: string;
  websiteUrl: string;
  isAcceptingPitches: boolean;
  responseTime: number;
  dealCount: number;
  verified: boolean;
}

interface InvestorMatch {
  match: {
    id: number;
    matchScore: number;
    matchReasons: string[];
    industryMatch: boolean;
    stageMatch: boolean;
    geographyMatch: boolean;
    aiGeneratedInsights: string;
    status: string;
  };
  investor: Investor;
}

interface InvestorConnection {
  connection: {
    id: number;
    connectionType: string;
    status: string;
    message: string;
    pitchDeckUrl: string;
    scheduledMeetingDate: string;
    outcome: string;
    feedback: string;
    nextSteps: string;
    createdAt: string;
  };
  investor: Investor;
}

export default function InvestorDiscovery() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [investorTypeFilter, setInvestorTypeFilter] = useState<string>('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [activeTab, setActiveTab] = useState('discover');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  
  // Advanced filters
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedGeographies, setSelectedGeographies] = useState<string[]>([]);
  const [checkSizeRange, setCheckSizeRange] = useState<[number, number]>([0, 10000]);
  const [minDealCount, setMinDealCount] = useState<number>(0);
  
  // For demo purposes, using startupId = 1
  // In production, this would come from auth context
  const startupId = 1;
  
  // Available options for filters
  const investmentStages = ['pre_seed', 'seed', 'series_a', 'series_b', 'series_c', 'growth', 'late_stage'];
  const industries = ['fintech', 'healthcare', 'saas', 'ai_ml', 'ecommerce', 'edtech', 'crypto', 'gaming', 'devtools', 'climate'];
  const geographies = ['north_america', 'europe', 'asia', 'latin_america', 'middle_east', 'africa', 'oceania', 'global'];

  // Fetch all investors with filters
  const { data: investorsData, isLoading: investorsLoading } = useQuery<{ investors: Investor[] }>({
    queryKey: ['/api/wizards/investors', investorTypeFilter, verifiedOnly, selectedStages, selectedIndustries, selectedGeographies, checkSizeRange, minDealCount],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (investorTypeFilter !== 'all') {
        params.append('investorType', investorTypeFilter);
      }
      if (verifiedOnly) {
        params.append('verified', 'true');
      }
      const url = `/api/wizards/investors${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch investors');
      return res.json();
    },
    enabled: activeTab === 'discover',
  });

  // Fetch matched investors for startup
  const { data: matchesData, isLoading: matchesLoading } = useQuery<{ matches: InvestorMatch[] }>({
    queryKey: ['/api/wizards/startups', startupId, 'investor-matches'],
    enabled: activeTab === 'matches',
  });

  // Fetch connections
  const { data: connectionsData, isLoading: connectionsLoading } = useQuery<{ connections: InvestorConnection[] }>({
    queryKey: ['/api/wizards/startups', startupId, 'investor-connections'],
    enabled: activeTab === 'connections',
  });

  // Create connection mutation
  const createConnectionMutation = useMutation({
    mutationFn: async (data: { investorId: number; message: string; pitchDeckUrl?: string }) => {
      return apiRequest('/api/wizards/investor-connections', 'POST', {
        startupId,
        investorId: data.investorId,
        connectionType: 'intro_request',
        message: data.message,
        pitchDeckUrl: data.pitchDeckUrl || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/startups', startupId, 'investor-connections'] });
      toast({
        title: 'Connection Request Sent',
        description: 'The investor will be notified of your interest.',
      });
      setShowConnectionDialog(false);
      setSelectedInvestor(null);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to send connection request.',
        variant: 'destructive',
      });
    },
  });

  const investors = investorsData?.investors || [];
  const matches = matchesData?.matches || [];
  const connections = connectionsData?.connections || [];

  // Filter investors by search query and advanced filters with null-safe checks
  const filteredInvestors = investors.filter(inv => {
    // Search filter
    const matchesSearch = !searchQuery || (
      (inv.firmName ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.bio ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.industries ?? []).some(ind => ind.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
    // Advanced filters
    const matchesStages = selectedStages.length === 0 || 
      (inv.investmentStage ?? []).some(stage => selectedStages.includes(stage));
    
    const matchesIndustries = selectedIndustries.length === 0 || 
      (inv.industries ?? []).some(industry => selectedIndustries.includes(industry));
    
    const matchesGeographies = selectedGeographies.length === 0 || 
      (inv.geographies ?? []).some(geo => selectedGeographies.includes(geo));
    
    const checkMin = parseInt(inv.checkSizeMin) || 0;
    const checkMax = parseInt(inv.checkSizeMax) || Number.MAX_SAFE_INTEGER;
    const matchesCheckSize = checkMin <= checkSizeRange[1] && checkMax >= checkSizeRange[0];
    
    const matchesDealCount = (inv.dealCount || 0) >= minDealCount;
    
    return matchesSearch && matchesStages && matchesIndustries && matchesGeographies && matchesCheckSize && matchesDealCount;
  });
  
  // Helper functions for filter management
  const toggleFilter = (value: string, currentFilters: string[], setFilters: (v: string[]) => void) => {
    if (currentFilters.includes(value)) {
      setFilters(currentFilters.filter(v => v !== value));
    } else {
      setFilters([...currentFilters, value]);
    }
  };
  
  const clearAllFilters = () => {
    setSelectedStages([]);
    setSelectedIndustries([]);
    setSelectedGeographies([]);
    setCheckSizeRange([0, 10000]);
    setMinDealCount(0);
  };
  
  const activeFilterCount = selectedStages.length + selectedIndustries.length + selectedGeographies.length + 
    (checkSizeRange[0] !== 0 || checkSizeRange[1] !== 10000 ? 1 : 0) + 
    (minDealCount > 0 ? 1 : 0);

  const getConnectionStatus = (investorId: number) => {
    return connections.find(c => c.investor.id === investorId)?.connection;
  };

  const renderInvestorCard = (investor: Investor, matchScore?: number, matchReasons?: string[]) => {
    const connection = getConnectionStatus(investor.id);
    
    return (
      <Card key={investor.id} className="p-6 bg-[hsl(222,47%,15%)] border-white/10 hover:border-[hsl(217,91%,60%)]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[hsl(217,91%,60%)]/10">
        <div className="flex items-start justify-between mb-4">
          <div 
            className="flex items-center gap-3 cursor-pointer flex-1"
            onClick={() => setLocation(`/investors/${investor.id}`)}
            data-testid={`link-investor-profile-${investor.id}`}
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[hsl(217,91%,60%)] to-[hsl(270,75%,65%)] flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[hsl(0,0%,98%)] hover:text-[hsl(217,91%,60%)] transition-colors" data-testid={`text-investor-name-${investor.id}`}>
                {investor.firmName || 'Angel Investor'}
              </h3>
              <p className="text-sm text-[hsl(220,9%,65%)]" data-testid={`text-investor-type-${investor.id}`}>
                {(investor.investorType ?? 'angel').replace(/_/g, ' ').toUpperCase()}
              </p>
            </div>
          </div>
          {investor.verified && (
            <Badge className="bg-[hsl(142,71%,45%)]/20 text-[hsl(142,71%,45%)] border-[hsl(142,71%,45%)]/30">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          )}
        </div>

        {matchScore && (
          <div className="mb-4 p-3 bg-gradient-to-r from-[hsl(217,91%,60%)]/10 to-[hsl(270,75%,65%)]/10 rounded-lg border border-[hsl(217,91%,60%)]/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[hsl(0,0%,98%)]">Match Score</span>
              <span 
                className="text-2xl font-bold bg-gradient-to-r from-[hsl(217,91%,60%)] to-[hsl(270,75%,65%)] bg-clip-text text-transparent"
                data-testid={`text-match-score-${investor.id}`}
              >
                {matchScore}%
              </span>
            </div>
            {matchReasons && matchReasons.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {matchReasons.map((reason, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs" data-testid={`badge-match-reason-${investor.id}-${idx}`}>
                    {reason}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        <p className="text-sm text-[hsl(220,9%,65%)] mb-4 line-clamp-2">{investor.bio}</p>

        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="w-4 h-4 text-[hsl(220,9%,65%)]" />
            <span className="text-[hsl(220,9%,65%)]">Check Size:</span>
            <span className="text-[hsl(0,0%,98%)] font-medium" data-testid={`text-check-size-${investor.id}`}>
              ${investor.checkSizeMin || '0'}K - ${investor.checkSizeMax || '0'}K
            </span>
          </div>

          {investor.fundSize && (
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-[hsl(220,9%,65%)]" />
              <span className="text-[hsl(220,9%,65%)]">Fund Size:</span>
              <span className="text-[hsl(0,0%,98%)] font-medium">${investor.fundSize}M</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <Briefcase className="w-4 h-4 text-[hsl(220,9%,65%)]" />
            <span className="text-[hsl(220,9%,65%)]">Deals:</span>
            <span className="text-[hsl(0,0%,98%)] font-medium">{investor.dealCount || 0}</span>
          </div>

          {investor.geographies && investor.geographies.length > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="w-4 h-4 text-[hsl(220,9%,65%)] mt-0.5" />
              <div className="flex flex-wrap gap-1">
                {investor.geographies.slice(0, 3).map((geo, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {geo}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {investor.industries && investor.industries.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {investor.industries.slice(0, 4).map((industry, idx) => (
              <Badge key={idx} className="bg-[hsl(270,75%,65%)]/20 text-[hsl(270,75%,65%)] border-[hsl(270,75%,65%)]/30 text-xs">
                {industry}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          {connection ? (
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-[hsl(222,47%,20%)] border border-white/10" data-testid={`status-connection-${investor.id}`}>
              {connection.status === 'pending' && (
                <>
                  <Clock className="w-4 h-4 text-[hsl(38,92%,50%)]" />
                  <span className="text-sm text-[hsl(38,92%,50%)]">Pending</span>
                </>
              )}
              {connection.status === 'accepted' && (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[hsl(142,71%,45%)]" />
                  <span className="text-sm text-[hsl(142,71%,45%)]">Connected</span>
                </>
              )}
              {connection.status === 'declined' && (
                <>
                  <XCircle className="w-4 h-4 text-[hsl(0,84%,60%)]" />
                  <span className="text-sm text-[hsl(0,84%,60%)]">Declined</span>
                </>
              )}
            </div>
          ) : investor.isAcceptingPitches ? (
            <Button
              onClick={() => {
                setSelectedInvestor(investor);
                setShowConnectionDialog(true);
              }}
              className="flex-1 bg-gradient-to-r from-[hsl(217,91%,60%)] to-[hsl(270,75%,65%)] hover:opacity-90 transition-opacity"
              data-testid={`button-connect-investor-${investor.id}`}
            >
              <Send className="w-4 h-4 mr-2" />
              Request Intro
            </Button>
          ) : (
            <Button variant="outline" disabled className="flex-1" data-testid={`button-not-accepting-${investor.id}`}>
              Not Accepting Pitches
            </Button>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-[hsl(222,47%,11%)] text-[hsl(0,0%,98%)]">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[hsl(217,91%,60%)] to-[hsl(270,75%,65%)] flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Investor Matching</h1>
              <p className="text-[hsl(220,9%,65%)] text-lg">Connect with investors aligned to your startup</p>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="bg-[hsl(222,47%,15%)] border border-white/10">
            <TabsTrigger value="discover" data-testid="tab-discover">
              <Search className="w-4 h-4 mr-2" />
              Discover Investors
            </TabsTrigger>
            <TabsTrigger value="matches" data-testid="tab-matches">
              <Sparkles className="w-4 h-4 mr-2" />
              AI Matches
              {matches.length > 0 && (
                <Badge className="ml-2 bg-[hsl(217,91%,60%)]">{matches.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="connections" data-testid="tab-connections">
              <Users className="w-4 h-4 mr-2" />
              Connections
              {connections.length > 0 && (
                <Badge className="ml-2 bg-[hsl(270,75%,65%)]">{connections.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Discover Tab */}
          <TabsContent value="discover" className="mt-8">
            <div className="mb-6 flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[hsl(220,9%,65%)]" />
                  <Input
                    placeholder="Search by firm, industry, or keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-[hsl(222,47%,15%)] border-white/10"
                    data-testid="input-search-investors"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={investorTypeFilter} onValueChange={setInvestorTypeFilter}>
                  <SelectTrigger className="w-full md:w-48 bg-[hsl(222,47%,15%)] border-white/10" data-testid="select-investor-type">
                    <Filter className="w-4 h-4 mr-2" />
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
                <Button
                  variant={verifiedOnly ? "default" : "outline"}
                  onClick={() => setVerifiedOnly(!verifiedOnly)}
                  className={verifiedOnly ? "bg-[hsl(142,71%,45%)] hover:bg-[hsl(142,71%,40%)]" : ""}
                  data-testid="button-toggle-verified"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Verified Only
                </Button>
              </div>
            </div>

            {/* Advanced Filters */}
            <Collapsible open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters} className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="p-0 hover:bg-transparent" data-testid="button-toggle-advanced-filters">
                    <Filter className="w-4 h-4 mr-2" />
                    Advanced Filters
                    {activeFilterCount > 0 && (
                      <Badge className="ml-2 bg-[hsl(217,91%,60%)]">{activeFilterCount}</Badge>
                    )}
                    {showAdvancedFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                  </Button>
                </CollapsibleTrigger>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters} data-testid="button-clear-filters">
                    Clear All
                  </Button>
                )}
              </div>
              
              <CollapsibleContent>
                <Card className="p-6 bg-[hsl(222,47%,15%)] border-white/10">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Investment Stages */}
                    <div>
                      <label className="text-sm font-medium text-[hsl(0,0%,98%)] mb-2 block">Investment Stage</label>
                      <div className="flex flex-wrap gap-2">
                        {investmentStages.map((stage) => (
                          <Badge
                            key={stage}
                            variant={selectedStages.includes(stage) ? "default" : "outline"}
                            className={`cursor-pointer ${selectedStages.includes(stage) ? 'bg-[hsl(217,91%,60%)]' : ''}`}
                            onClick={() => toggleFilter(stage, selectedStages, setSelectedStages)}
                            data-testid={`badge-filter-stage-${stage}`}
                          >
                            {stage.replace(/_/g, ' ').toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Industries */}
                    <div>
                      <label className="text-sm font-medium text-[hsl(0,0%,98%)] mb-2 block">Industries</label>
                      <div className="flex flex-wrap gap-2">
                        {industries.map((industry) => (
                          <Badge
                            key={industry}
                            variant={selectedIndustries.includes(industry) ? "default" : "outline"}
                            className={`cursor-pointer ${selectedIndustries.includes(industry) ? 'bg-[hsl(217,91%,60%)]' : ''}`}
                            onClick={() => toggleFilter(industry, selectedIndustries, setSelectedIndustries)}
                            data-testid={`badge-filter-industry-${industry}`}
                          >
                            {industry.replace(/_/g, ' ').toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Geographies */}
                    <div>
                      <label className="text-sm font-medium text-[hsl(0,0%,98%)] mb-2 block">Geographies</label>
                      <div className="flex flex-wrap gap-2">
                        {geographies.map((geo) => (
                          <Badge
                            key={geo}
                            variant={selectedGeographies.includes(geo) ? "default" : "outline"}
                            className={`cursor-pointer ${selectedGeographies.includes(geo) ? 'bg-[hsl(217,91%,60%)]' : ''}`}
                            onClick={() => toggleFilter(geo, selectedGeographies, setSelectedGeographies)}
                            data-testid={`badge-filter-geo-${geo}`}
                          >
                            {geo.replace(/_/g, ' ').toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Check Size Range */}
                    <div>
                      <label className="text-sm font-medium text-[hsl(0,0%,98%)] mb-2 block">
                        Check Size Range: ${checkSizeRange[0]}K - ${checkSizeRange[1]}K
                      </label>
                      <Slider
                        min={0}
                        max={10000}
                        step={100}
                        value={checkSizeRange}
                        onValueChange={(value) => setCheckSizeRange(value as [number, number])}
                        className="mt-2"
                        data-testid="slider-check-size"
                      />
                    </div>

                    {/* Deal Count */}
                    <div>
                      <label className="text-sm font-medium text-[hsl(0,0%,98%)] mb-2 block">
                        Minimum Deals: {minDealCount}
                      </label>
                      <Slider
                        min={0}
                        max={100}
                        step={5}
                        value={[minDealCount]}
                        onValueChange={(value) => setMinDealCount(value[0])}
                        className="mt-2"
                        data-testid="slider-deal-count"
                      />
                    </div>
                  </div>
                </Card>
              </CollapsibleContent>
            </Collapsible>

            {investorsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="p-6 bg-[hsl(222,47%,15%)] border-white/10 animate-pulse">
                    <div className="h-32" />
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredInvestors.length > 0 ? (
                  filteredInvestors.map((investor) => renderInvestorCard(investor))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <Users className="w-12 h-12 mx-auto mb-4 text-[hsl(220,9%,65%)]" />
                    <p className="text-[hsl(220,9%,65%)]">No investors found matching your criteria</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* AI Matches Tab */}
          <TabsContent value="matches" className="mt-8">
            {matchesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-6 bg-[hsl(222,47%,15%)] border-white/10 animate-pulse">
                    <div className="h-32" />
                  </Card>
                ))}
              </div>
            ) : matches.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {matches.map(({ match, investor }) =>
                  renderInvestorCard(investor, match.matchScore, match.matchReasons)
                )}
              </div>
            ) : (
              <Card className="p-12 bg-[hsl(222,47%,15%)] border-white/10 text-center">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-[hsl(217,91%,60%)]" />
                <h3 className="text-xl font-semibold mb-2">No AI Matches Yet</h3>
                <p className="text-[hsl(220,9%,65%)] mb-4">
                  Our AI will analyze your startup profile and generate investor matches soon.
                </p>
              </Card>
            )}
          </TabsContent>

          {/* Connections Tab */}
          <TabsContent value="connections" className="mt-8">
            {connectionsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-6 bg-[hsl(222,47%,15%)] border-white/10 animate-pulse">
                    <div className="h-32" />
                  </Card>
                ))}
              </div>
            ) : connections.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {connections.map(({ connection, investor }) => renderInvestorCard(investor))}
              </div>
            ) : (
              <Card className="p-12 bg-[hsl(222,47%,15%)] border-white/10 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-[hsl(220,9%,65%)]" />
                <h3 className="text-xl font-semibold mb-2">No Connections Yet</h3>
                <p className="text-[hsl(220,9%,65%)] mb-4">
                  Start by discovering investors and requesting introductions.
                </p>
                <Button
                  onClick={() => setActiveTab('discover')}
                  className="bg-gradient-to-r from-[hsl(217,91%,60%)] to-[hsl(270,75%,65%)]"
                  data-testid="button-discover-investors"
                >
                  Discover Investors
                </Button>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Pitch Deck Upload Dialog */}
      {selectedInvestor && (
        <PitchDeckUploadDialog
          open={showConnectionDialog}
          onOpenChange={setShowConnectionDialog}
          investorName={selectedInvestor.firmName || 'this investor'}
          onSubmit={(data) => {
            createConnectionMutation.mutate({
              investorId: selectedInvestor.id,
              message: data.message,
              pitchDeckUrl: data.pitchDeckUrl,
            });
          }}
          isPending={createConnectionMutation.isPending}
        />
      )}
    </div>
  );
}
