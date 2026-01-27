import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  DollarSign,
  Users,
  BarChart3,
  Plus,
  Eye,
  Edit,
  Trash2,
  Award,
  Zap
} from "lucide-react";

interface Competitor {
  id: number;
  name: string;
  website: string;
  description: string;
  logo: string | null;
  marketPosition: string;
  threatLevel: string;
  competitiveScore: number;
  totalFunding: string;
  estimatedRevenue: string;
  estimatedUsers: number;
  strengthsAnalysis: string;
  weaknessesAnalysis: string;
}

interface CompetitorFeature {
  id: number;
  featureName: string;
  hasFeature: boolean;
  competitiveAdvantage: string;
  priorityLevel: string;
}

interface CompetitorPricing {
  id: number;
  planName: string;
  price: string;
  billingCycle: string;
  valueScore: number;
}

export default function CompetitorAnalysis() {
  const { toast } = useToast();
  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCompetitor, setNewCompetitor] = useState({
    name: "",
    website: "",
    description: "",
    startupId: 1, // This should come from auth context
  });

  // Fetch competitors
  const { data: competitorsData, isLoading } = useQuery<{ success: boolean; data: Competitor[] }>({
    queryKey: ["/api/wizards/competitors", { startupId: 1 }],
    queryFn: async () => {
      const response = await fetch("/api/wizards/competitors?startupId=1", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch competitors");
      return response.json();
    },
  });

  // Fetch competitor details
  const { data: competitorDetails } = useQuery<{ 
    success: boolean; 
    data: { 
      features: CompetitorFeature[]; 
      pricing: CompetitorPricing[] 
    } 
  }>({
    queryKey: ["/api/wizards/competitors", selectedCompetitor?.id],
    queryFn: async () => {
      if (!selectedCompetitor) return { success: true, data: { features: [], pricing: [] } };
      const response = await fetch(`/api/wizards/competitors/${selectedCompetitor.id}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch competitor details");
      return response.json();
    },
    enabled: !!selectedCompetitor,
  });

  const competitors = competitorsData?.data || [];

  // Add competitor mutation
  const addCompetitorMutation = useMutation({
    mutationFn: async (data: typeof newCompetitor) => {
      return apiRequest("/api/wizards/competitors", "POST", data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Competitor added successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/wizards/competitors"] });
      setIsAddDialogOpen(false);
      setNewCompetitor({ name: "", website: "", description: "", startupId: 1 });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete competitor mutation
  const deleteCompetitorMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/wizards/competitors/${id}`, "DELETE");
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Competitor deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/wizards/competitors"] });
      setSelectedCompetitor(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getThreatBadge = (level: string) => {
    const colors = {
      low: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      critical: "bg-red-100 text-red-800",
    };
    return colors[level as keyof typeof colors] || colors.medium;
  };

  const getMarketPositionIcon = (position: string) => {
    switch (position) {
      case "leader":
        return <Award className="h-4 w-4 text-yellow-500" />;
      case "challenger":
        return <Target className="h-4 w-4 text-blue-500" />;
      case "niche":
        return <Zap className="h-4 w-4 text-purple-500" />;
      default:
        return <TrendingUp className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center">Loading competitor data...</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6" data-testid="competitor-analysis-page">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" data-testid="page-title">Competitor Analysis</h1>
          <p className="text-gray-600" data-testid="page-description">
            Track and analyze your competitors to stay ahead in the market
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-competitor">
              <Plus className="h-4 w-4 mr-2" />
              Add Competitor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Competitor</DialogTitle>
              <DialogDescription>
                Enter competitor information to start tracking
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Competitor Name</Label>
                <Input
                  id="name"
                  value={newCompetitor.name}
                  onChange={(e) => setNewCompetitor({ ...newCompetitor, name: e.target.value })}
                  placeholder="e.g., Acme Corp"
                  data-testid="input-competitor-name"
                />
              </div>
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={newCompetitor.website}
                  onChange={(e) => setNewCompetitor({ ...newCompetitor, website: e.target.value })}
                  placeholder="https://example.com"
                  data-testid="input-competitor-website"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newCompetitor.description}
                  onChange={(e) => setNewCompetitor({ ...newCompetitor, description: e.target.value })}
                  placeholder="Brief description of the competitor"
                  data-testid="input-competitor-description"
                />
              </div>
              <Button
                onClick={() => addCompetitorMutation.mutate(newCompetitor)}
                disabled={!newCompetitor.name || addCompetitorMutation.isPending}
                className="w-full"
                data-testid="button-submit-competitor"
              >
                {addCompetitorMutation.isPending ? "Adding..." : "Add Competitor"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Competitors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {competitors.map((competitor) => (
          <Card
            key={competitor.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedCompetitor(competitor)}
            data-testid={`card-competitor-${competitor.id}`}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  {getMarketPositionIcon(competitor.marketPosition)}
                  <CardTitle className="text-lg" data-testid={`text-competitor-name-${competitor.id}`}>
                    {competitor.name}
                  </CardTitle>
                </div>
                <Badge className={getThreatBadge(competitor.threatLevel)}>
                  {competitor.threatLevel}
                </Badge>
              </div>
              <CardDescription>{competitor.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Competitive Score:</span>
                  <span className="font-semibold">{competitor.competitiveScore || "N/A"}/100</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Users:</span>
                  <span className="font-semibold">
                    {competitor.estimatedUsers?.toLocaleString() || "N/A"}
                  </span>
                </div>
                {competitor.totalFunding && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Funding:</span>
                    <span className="font-semibold">${competitor.totalFunding}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Competitor Details Modal */}
      {selectedCompetitor && (
        <Dialog open={!!selectedCompetitor} onOpenChange={() => setSelectedCompetitor(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex justify-between items-start">
                <div>
                  <DialogTitle className="text-2xl" data-testid="text-selected-competitor-name">
                    {selectedCompetitor.name}
                  </DialogTitle>
                  <DialogDescription>{selectedCompetitor.website}</DialogDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" data-testid="button-edit-competitor">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete this competitor?")) {
                        deleteCompetitorMutation.mutate(selectedCompetitor.id);
                      }
                    }}
                    data-testid="button-delete-competitor"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </DialogHeader>

            <Tabs defaultValue="overview" className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
                <TabsTrigger value="features" data-testid="tab-features">Features</TabsTrigger>
                <TabsTrigger value="pricing" data-testid="tab-pricing">Pricing</TabsTrigger>
                <TabsTrigger value="analysis" data-testid="tab-analysis">Analysis</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Company Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Market Position</Label>
                        <p className="text-sm font-medium capitalize">{selectedCompetitor.marketPosition || "N/A"}</p>
                      </div>
                      <div>
                        <Label>Threat Level</Label>
                        <Badge className={getThreatBadge(selectedCompetitor.threatLevel)}>
                          {selectedCompetitor.threatLevel}
                        </Badge>
                      </div>
                      <div>
                        <Label>Estimated Users</Label>
                        <p className="text-sm font-medium">
                          {selectedCompetitor.estimatedUsers?.toLocaleString() || "N/A"}
                        </p>
                      </div>
                      <div>
                        <Label>Estimated Revenue</Label>
                        <p className="text-sm font-medium">${selectedCompetitor.estimatedRevenue || "N/A"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="features" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Feature Comparison</CardTitle>
                    <CardDescription>Compare features with this competitor</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {competitorDetails?.data.features.length === 0 ? (
                      <p className="text-sm text-gray-500">No features tracked yet</p>
                    ) : (
                      <div className="space-y-2">
                        {competitorDetails?.data.features.map((feature) => (
                          <div
                            key={feature.id}
                            className="flex justify-between items-center p-2 rounded border"
                            data-testid={`feature-item-${feature.id}`}
                          >
                            <span>{feature.featureName}</span>
                            <div className="flex gap-2">
                              <Badge variant={feature.hasFeature ? "default" : "outline"}>
                                {feature.hasFeature ? "Has Feature" : "Missing"}
                              </Badge>
                              {feature.competitiveAdvantage && (
                                <Badge variant="secondary">{feature.competitiveAdvantage}</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pricing" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Pricing Plans</CardTitle>
                    <CardDescription>Competitor pricing strategy</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {competitorDetails?.data.pricing.length === 0 ? (
                      <p className="text-sm text-gray-500">No pricing data available</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {competitorDetails?.data.pricing.map((plan) => (
                          <Card key={plan.id} data-testid={`pricing-plan-${plan.id}`}>
                            <CardHeader>
                              <CardTitle className="text-lg">{plan.planName}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                <div className="text-2xl font-bold">${plan.price}</div>
                                <div className="text-sm text-gray-600">{plan.billingCycle}</div>
                                {plan.valueScore && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm">Value Score:</span>
                                    <Badge>{plan.valueScore}/100</Badge>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analysis" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>SWOT Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        Strengths
                      </Label>
                      <p className="text-sm mt-2">{selectedCompetitor.strengthsAnalysis || "Not analyzed yet"}</p>
                    </div>
                    <div>
                      <Label className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-500" />
                        Weaknesses
                      </Label>
                      <p className="text-sm mt-2">{selectedCompetitor.weaknessesAnalysis || "Not analyzed yet"}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {competitors.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Competitors Tracked</h3>
            <p className="text-gray-600 mb-4">Start tracking competitors to gain market insights</p>
            <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-first-competitor">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Competitor
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
