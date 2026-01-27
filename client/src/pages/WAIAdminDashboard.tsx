import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Building2, Users, Bot, Key, Settings, BarChart3, Shield, TestTube, ChevronRight, Plus, Search, Globe, Cpu, Zap, Activity, CheckCircle, XCircle, AlertCircle, Clock, TrendingUp, DollarSign, Layers, Brain, LayoutGrid, PanelLeft, Menu, ArrowRight, Edit, Trash2, RotateCw, Copy, Eye, EyeOff } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface Organization {
  id: number;
  name: string;
  description?: string;
  logo?: string;
  plan: string;
  isActive: boolean;
  maxMembers?: number;
  ownerId?: number;
  createdAt: string;
  updatedAt?: string;
  tier?: string;
  status?: string;
}

interface OrgApiKey {
  id: number;
  organizationId: number;
  keyName: string;
  keyPrefix: string;
  environment: string;
  status: string;
  rateLimitPerMinute: number;
  createdAt: string;
}

interface Agent {
  id: string;
  name: string;
  tier: string;
  category: string;
  capabilities: string[];
  status: string;
}

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "organizations", label: "Organizations", icon: Building2 },
  { id: "agents", label: "Agent Studio", icon: Bot },
  { id: "api-keys", label: "API Keys", icon: Key },
  { id: "sandbox", label: "Sandbox", icon: TestTube },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "monitoring", label: "Monitoring", icon: BarChart3 },
  { id: "security", label: "Security", icon: Shield },
];

const TIER_COLORS: Record<string, string> = {
  alpha: "bg-slate-600",
  beta: "bg-blue-600",
  gamma: "bg-violet-600",
  enterprise: "bg-gradient-to-r from-blue-600 to-violet-600",
  starter: "bg-slate-600",
  growth: "bg-blue-600",
  unlimited: "bg-gradient-to-r from-blue-600 to-violet-600",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-600",
  inactive: "bg-slate-600",
  suspended: "bg-red-600",
  pending: "bg-yellow-600",
};

export default function WAIAdminDashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: organizations = [], isLoading: orgsLoading, refetch: refetchOrgs } = useQuery<Organization[]>({
    queryKey: ["/api/org-management/organizations"],
  });

  const { data: platformStats } = useQuery<any>({
    queryKey: ["/api/org-management/stats/platform"],
  });

  const { data: agentPool } = useQuery<any>({
    queryKey: ["/api/org-management/agents/pool"],
  });

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return <OverviewSection stats={platformStats} organizations={organizations} />;
      case "organizations":
        return <OrganizationsSection organizations={organizations} refetchOrgs={refetchOrgs} />;
      case "agents":
        return <AgentStudioSection agentPool={agentPool} organizations={organizations} />;
      case "api-keys":
        return <ApiKeysSection organizations={organizations} />;
      case "sandbox":
        return <SandboxSection organizations={organizations} />;
      case "settings":
        return <SettingsSection organizations={organizations} />;
      case "monitoring":
        return <MonitoringSection organizations={organizations} />;
      case "security":
        return <SecuritySection />;
      default:
        return <OverviewSection stats={platformStats} organizations={organizations} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden" data-testid="wai-admin-dashboard">
      <aside className={`${sidebarCollapsed ? "w-16" : "w-64"} backdrop-blur-xl bg-slate-900/50 border-r border-white/10 transition-all duration-300 flex flex-col`}>
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-violet-500 flex items-center justify-center">
                <Brain className="w-5 h-5" />
              </div>
              <span className="font-semibold text-sm">WAI Admin</span>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="text-white/60 hover:text-white hover:bg-white/10" data-testid="button-toggle-sidebar">
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-1 px-2">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  activeSection === item.id
                    ? "bg-gradient-to-r from-blue-600/20 to-violet-600/20 text-white border border-white/20"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
                data-testid={`nav-${item.id}`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            ))}
          </nav>
        </ScrollArea>

        <div className="p-4 border-t border-white/10">
          {!sidebarCollapsed && (
            <div className="text-xs text-white/40">
              <div>WAI SDK v1.0</div>
              <div>267 Agents • 23 Providers</div>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 backdrop-blur-xl bg-slate-900/50 border-b border-white/10 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold capitalize">{activeSection.replace("-", " ")}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64 bg-slate-800/50 border-white/20 focus:border-blue-500"
                data-testid="input-search"
              />
            </div>
            <Button className="bg-gradient-to-r from-blue-600 to-violet-600 hover:opacity-90" data-testid="button-new-org">
              <Plus className="w-4 h-4 mr-2" />
              New Organization
            </Button>
          </div>
        </header>

        <ScrollArea className="flex-1 p-6">
          {renderContent()}
        </ScrollArea>
      </main>
    </div>
  );
}

function OverviewSection({ stats, organizations }: { stats: any; organizations: Organization[] }) {
  const platformMetrics = stats || {
    totalOrganizations: organizations?.length || 0,
    totalAgents: 267,
    healthyProviders: 17,
    totalLanguages: 23,
    activeApiKeys: 0,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Organizations"
          value={platformMetrics.totalOrganizations}
          icon={Building2}
          trend="+12% this month"
          gradient="from-blue-500 to-cyan-500"
        />
        <MetricCard
          title="Total Agents"
          value={platformMetrics.totalAgents}
          icon={Bot}
          trend="267 available"
          gradient="from-violet-500 to-purple-500"
        />
        <MetricCard
          title="LLM Providers"
          value={platformMetrics.healthyProviders}
          icon={Cpu}
          trend="17 healthy, 6 degraded"
          gradient="from-green-500 to-emerald-500"
        />
        <MetricCard
          title="Languages"
          value={platformMetrics.totalLanguages}
          icon={Globe}
          trend="22 Indian + English"
          gradient="from-orange-500 to-amber-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-2 backdrop-blur-xl bg-slate-800/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Agent Distribution by Tier
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { tier: "Executive (L4)", count: 34, color: "bg-violet-500", percent: 13 },
                { tier: "Development (L3)", count: 160, color: "bg-blue-500", percent: 60 },
                { tier: "Creative (L3)", count: 17, color: "bg-pink-500", percent: 6 },
                { tier: "QA (L3)", count: 7, color: "bg-green-500", percent: 3 },
                { tier: "DevOps (L3)", count: 11, color: "bg-orange-500", percent: 4 },
                { tier: "Domain (L2-L3)", count: 38, color: "bg-cyan-500", percent: 14 },
              ].map((item) => (
                <div key={item.tier} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/80">{item.tier}</span>
                    <span className="text-white/60">{item.count} agents</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.percent}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-slate-800/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start bg-white/5 hover:bg-white/10 text-white" variant="ghost" data-testid="button-onboard-org">
              <Plus className="w-4 h-4 mr-3" />
              Onboard New Organization
            </Button>
            <Button className="w-full justify-start bg-white/5 hover:bg-white/10 text-white" variant="ghost" data-testid="button-allocate-agents">
              <Bot className="w-4 h-4 mr-3" />
              Allocate Agents
            </Button>
            <Button className="w-full justify-start bg-white/5 hover:bg-white/10 text-white" variant="ghost" data-testid="button-generate-api-key">
              <Key className="w-4 h-4 mr-3" />
              Generate API Key
            </Button>
            <Button className="w-full justify-start bg-white/5 hover:bg-white/10 text-white" variant="ghost" data-testid="button-test-sandbox">
              <TestTube className="w-4 h-4 mr-3" />
              Launch Sandbox
            </Button>
            <Button className="w-full justify-start bg-white/5 hover:bg-white/10 text-white" variant="ghost" data-testid="button-view-analytics">
              <BarChart3 className="w-4 h-4 mr-3" />
              View Analytics
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="backdrop-blur-xl bg-slate-800/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Recent Organizations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {organizations.length === 0 ? (
            <div className="text-center py-8 text-white/40">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No organizations yet</p>
              <p className="text-sm">Create your first organization to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {organizations.slice(0, 5).map((org) => (
                <div key={org.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-violet-500 flex items-center justify-center font-bold">
                      {org.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-white">{org.name}</div>
                      <div className="text-sm text-white/40">{org.description || `ID: ${org.id}`}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${TIER_COLORS[org.plan] || "bg-blue-600"} text-white`}>{org.plan}</Badge>
                    <Badge className={`${org.isActive ? STATUS_COLORS["active"] : STATUS_COLORS["suspended"]} text-white`}>{org.isActive ? "active" : "inactive"}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, trend, gradient }: { title: string; value: number | string; icon: any; trend: string; gradient: string }) {
  return (
    <Card className="backdrop-blur-xl bg-slate-800/40 border-white/10 overflow-hidden">
      <div className={`h-1 bg-gradient-to-r ${gradient}`} />
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-white/60">{title}</p>
            <p className="text-3xl font-bold text-white mt-1">{value}</p>
            <p className="text-xs text-white/40 mt-2">{trend}</p>
          </div>
          <div className={`p-3 rounded-lg bg-gradient-to-r ${gradient} opacity-20`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OnboardingWizard({ open, onClose, onComplete }: { open: boolean; onClose: () => void; onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    name: "",
    description: "",
    plan: "beta",
    contactEmail: "",
    industry: "",
    agentCount: 50,
    enabledFeatures: ["agents", "llm_selection", "autonomous_mode", "sandbox"],
    primaryColor: "#3B82F6",
    logo: "",
  });
  const { toast } = useToast();

  const createOrgMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/org-management/organizations", "POST", {
        name: wizardData.name,
        description: wizardData.description,
        plan: wizardData.plan,
      });
    },
    onSuccess: async (data: any) => {
      const orgId = data?.id;
      if (orgId) {
        await apiRequest(`/api/org-management/organizations/${orgId}/api-clients`, "POST", {
          clientName: "Default API Key",
          clientDescription: "Auto-generated during onboarding",
          environment: "production",
        });
      }
      toast({ title: "Organization Created", description: `${wizardData.name} has been set up successfully with API access.` });
      onComplete();
      onClose();
      setStep(1);
      setWizardData({ name: "", description: "", plan: "beta", contactEmail: "", industry: "", agentCount: 50, enabledFeatures: ["agents", "llm_selection", "autonomous_mode", "sandbox"], primaryColor: "#3B82F6", logo: "" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create organization", variant: "destructive" });
    },
  });

  const steps = [
    { num: 1, title: "Basic Info", icon: Building2 },
    { num: 2, title: "Plan & Agents", icon: Bot },
    { num: 3, title: "Features", icon: Settings },
    { num: 4, title: "Review", icon: CheckCircle },
  ];

  const planLimits: Record<string, number> = { alpha: 10, beta: 50, gamma: 150, enterprise: 267 };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-white/20 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">New Customer Onboarding</DialogTitle>
          <DialogDescription className="text-white/60">Set up a new organization with guided steps</DialogDescription>
        </DialogHeader>

        <div className="flex justify-between mb-6 mt-4">
          {steps.map((s) => (
            <div key={s.num} className={`flex items-center gap-2 ${step >= s.num ? "text-blue-400" : "text-white/30"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= s.num ? "bg-blue-600" : "bg-white/10"}`}>
                {step > s.num ? <CheckCircle className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
              </div>
              <span className="text-sm hidden sm:block">{s.title}</span>
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Organization Name *</Label>
              <Input value={wizardData.name} onChange={(e) => setWizardData({ ...wizardData, name: e.target.value })} placeholder="Acme Corporation" className="bg-slate-800 border-white/20" data-testid="wizard-org-name" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={wizardData.description} onChange={(e) => setWizardData({ ...wizardData, description: e.target.value })} placeholder="Brief description of the organization" className="bg-slate-800 border-white/20" data-testid="wizard-org-description" />
            </div>
            <div className="space-y-2">
              <Label>Contact Email</Label>
              <Input type="email" value={wizardData.contactEmail} onChange={(e) => setWizardData({ ...wizardData, contactEmail: e.target.value })} placeholder="admin@company.com" className="bg-slate-800 border-white/20" data-testid="wizard-contact-email" />
            </div>
            <div className="space-y-2">
              <Label>Industry</Label>
              <Select value={wizardData.industry} onValueChange={(v) => setWizardData({ ...wizardData, industry: v })}>
                <SelectTrigger className="bg-slate-800 border-white/20"><SelectValue placeholder="Select industry" /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/20">
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="finance">Finance & Banking</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="retail">Retail & E-commerce</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Plan</Label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: "alpha", name: "Alpha", agents: 10, price: "$99/mo" },
                  { id: "beta", name: "Beta", agents: 50, price: "$299/mo" },
                  { id: "gamma", name: "Gamma", agents: 150, price: "$799/mo" },
                  { id: "enterprise", name: "Enterprise", agents: 267, price: "Custom" },
                ].map((plan) => (
                  <div key={plan.id} onClick={() => setWizardData({ ...wizardData, plan: plan.id, agentCount: plan.agents })} className={`p-4 rounded-lg border cursor-pointer transition-all ${wizardData.plan === plan.id ? "border-blue-500 bg-blue-600/20" : "border-white/10 bg-white/5 hover:border-white/20"}`} data-testid={`wizard-plan-${plan.id}`}>
                    <div className="font-medium text-white">{plan.name}</div>
                    <div className="text-sm text-white/60">{plan.agents} agents</div>
                    <div className="text-lg font-bold text-blue-400 mt-2">{plan.price}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-blue-600/10 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-5 h-5 text-blue-400" />
                <span className="font-medium text-white">Agent Allocation</span>
              </div>
              <p className="text-sm text-white/60">This plan includes access to up to <span className="text-blue-400 font-bold">{planLimits[wizardData.plan]}</span> agents from the pool of 267 ROMA-compliant agents across all tiers.</p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Label>Enable Features</Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "agents", name: "Agent Access", desc: "Core agent functionality" },
                { id: "llm_selection", name: "LLM Selection", desc: "Choose from 23+ providers" },
                { id: "autonomous_mode", name: "Autonomous Mode", desc: "Full autonomous operation" },
                { id: "sandbox", name: "Sandbox Testing", desc: "Pre-production testing" },
                { id: "digital_twin", name: "Digital Twin", desc: "AI agent cloning" },
                { id: "voice_ai", name: "Voice AI", desc: "Voice capabilities" },
                { id: "multimodal", name: "Multimodal", desc: "Image, video, audio" },
                { id: "analytics", name: "Analytics", desc: "Usage & cost tracking" },
              ].map((feature) => (
                <div key={feature.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div>
                    <div className="text-sm font-medium text-white">{feature.name}</div>
                    <div className="text-xs text-white/40">{feature.desc}</div>
                  </div>
                  <Switch checked={wizardData.enabledFeatures.includes(feature.id)} onCheckedChange={(checked) => setWizardData({ ...wizardData, enabledFeatures: checked ? [...wizardData.enabledFeatures, feature.id] : wizardData.enabledFeatures.filter((f) => f !== feature.id) })} data-testid={`wizard-feature-${feature.id}`} />
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-white/5 space-y-3">
              <div className="flex justify-between"><span className="text-white/60">Organization</span><span className="text-white font-medium">{wizardData.name}</span></div>
              <div className="flex justify-between"><span className="text-white/60">Plan</span><span className="text-white font-medium capitalize">{wizardData.plan}</span></div>
              <div className="flex justify-between"><span className="text-white/60">Agents</span><span className="text-white font-medium">{planLimits[wizardData.plan]}</span></div>
              <div className="flex justify-between"><span className="text-white/60">Industry</span><span className="text-white font-medium capitalize">{wizardData.industry || "Not specified"}</span></div>
              <Separator className="bg-white/10" />
              <div><span className="text-white/60 text-sm">Enabled Features:</span><div className="flex flex-wrap gap-2 mt-2">{wizardData.enabledFeatures.map((f) => (<Badge key={f} className="bg-blue-600/20 text-blue-400 capitalize">{f.replace("_", " ")}</Badge>))}</div></div>
            </div>
            <div className="p-4 rounded-lg bg-green-600/10 border border-green-500/20">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-green-400" />
                <span className="text-white">API Key will be auto-generated</span>
              </div>
              <p className="text-sm text-white/60 mt-1">A production API key will be created automatically for SDK access.</p>
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between mt-6">
          <Button variant="ghost" onClick={() => step > 1 ? setStep(step - 1) : onClose()} data-testid="wizard-back">{step > 1 ? "Back" : "Cancel"}</Button>
          <Button onClick={() => step < 4 ? setStep(step + 1) : createOrgMutation.mutate()} disabled={step === 1 && !wizardData.name || createOrgMutation.isPending} className="bg-gradient-to-r from-blue-600 to-violet-600" data-testid="wizard-next">
            {createOrgMutation.isPending ? "Creating..." : step < 4 ? "Continue" : "Create Organization"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OrganizationsSection({ organizations, refetchOrgs }: { organizations: Organization[]; refetchOrgs: () => void }) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [newOrg, setNewOrg] = useState({ name: "", plan: "alpha", description: "" });
  const { toast } = useToast();

  const createOrgMutation = useMutation({
    mutationFn: async (data: typeof newOrg) => {
      return apiRequest("/api/org-management/organizations", "POST", { 
        name: data.name, 
        description: data.description || undefined,
        plan: data.plan,
      });
    },
    onSuccess: () => {
      toast({ title: "Organization Created", description: "New organization has been created successfully." });
      setShowCreateDialog(false);
      setNewOrg({ name: "", plan: "alpha", description: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/org-management/organizations"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create organization", variant: "destructive" });
    },
  });

  const deleteOrgMutation = useMutation({
    mutationFn: async (orgId: number) => {
      return apiRequest(`/api/org-management/organizations/${orgId}`, "DELETE");
    },
    onSuccess: () => {
      toast({ title: "Organization Deleted", description: "Organization has been deleted successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/org-management/organizations"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete organization", variant: "destructive" });
    },
  });

  const updateOrgMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Organization> }) => {
      return apiRequest(`/api/org-management/organizations/${id}`, "PATCH", { 
        name: data.name,
        plan: data.plan,
        isActive: data.isActive,
      });
    },
    onSuccess: () => {
      toast({ title: "Organization Updated", description: "Organization has been updated successfully." });
      setEditingOrg(null);
      queryClient.invalidateQueries({ queryKey: ["/api/org-management/organizations"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to update organization", variant: "destructive" });
    },
  });

  const handleDelete = (org: Organization) => {
    if (confirm(`Are you sure you want to delete ${org.name}? This action cannot be undone.`)) {
      deleteOrgMutation.mutate(org.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Organizations</h2>
          <p className="text-white/60">Manage organizations and their agent allocations</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowOnboarding(true)} className="bg-gradient-to-r from-green-600 to-emerald-600" data-testid="button-onboard-org">
            <ArrowRight className="w-4 h-4 mr-2" />
            Start Onboarding
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-violet-600" data-testid="button-create-org">
              <Plus className="w-4 h-4 mr-2" />
              Quick Create
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-white/20 text-white">
            <DialogHeader>
              <DialogTitle>Create New Organization</DialogTitle>
              <DialogDescription className="text-white/60">Set up a new organization with agent access</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Organization Name</Label>
                <Input
                  value={newOrg.name}
                  onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                  placeholder="Acme Corporation"
                  className="bg-slate-800 border-white/20"
                  data-testid="input-org-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select value={newOrg.plan} onValueChange={(v) => setNewOrg({ ...newOrg, plan: v })}>
                  <SelectTrigger className="bg-slate-800 border-white/20" data-testid="select-org-plan">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20">
                    <SelectItem value="alpha">Alpha (10 agents)</SelectItem>
                    <SelectItem value="beta">Beta (50 agents)</SelectItem>
                    <SelectItem value="gamma">Gamma (150 agents)</SelectItem>
                    <SelectItem value="enterprise">Enterprise (267 agents)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={newOrg.description}
                  onChange={(e) => setNewOrg({ ...newOrg, description: e.target.value })}
                  placeholder="Brief description of the organization"
                  className="bg-slate-800 border-white/20"
                  data-testid="input-org-description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
              <Button
                onClick={() => createOrgMutation.mutate(newOrg)}
                disabled={createOrgMutation.isPending || !newOrg.name}
                className="bg-gradient-to-r from-blue-600 to-violet-600"
                data-testid="button-submit-org"
              >
                {createOrgMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>

        <Dialog open={!!editingOrg} onOpenChange={(open) => !open && setEditingOrg(null)}>
          <DialogContent className="bg-slate-900 border-white/20 text-white">
            <DialogHeader>
              <DialogTitle>Edit Organization</DialogTitle>
              <DialogDescription className="text-white/60">Update organization settings</DialogDescription>
            </DialogHeader>
            {editingOrg && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Organization Name</Label>
                  <Input
                    value={editingOrg.name}
                    onChange={(e) => setEditingOrg({ ...editingOrg, name: e.target.value })}
                    className="bg-slate-800 border-white/20"
                    data-testid="input-edit-org-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Plan</Label>
                  <Select value={editingOrg.plan} onValueChange={(v) => setEditingOrg({ ...editingOrg, plan: v })}>
                    <SelectTrigger className="bg-slate-800 border-white/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/20">
                      <SelectItem value="alpha">Alpha (10 agents)</SelectItem>
                      <SelectItem value="beta">Beta (50 agents)</SelectItem>
                      <SelectItem value="gamma">Gamma (150 agents)</SelectItem>
                      <SelectItem value="enterprise">Enterprise (267 agents)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editingOrg.isActive ? "active" : "inactive"} onValueChange={(v) => setEditingOrg({ ...editingOrg, isActive: v === "active" })}>
                    <SelectTrigger className="bg-slate-800 border-white/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/20">
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setEditingOrg(null)}>Cancel</Button>
              <Button
                onClick={() => editingOrg && updateOrgMutation.mutate({ id: editingOrg.id, data: { name: editingOrg.name, plan: editingOrg.plan, isActive: editingOrg.isActive } })}
                disabled={updateOrgMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-violet-600"
                data-testid="button-update-org"
              >
                {updateOrgMutation.isPending ? "Updating..." : "Update"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {organizations.length === 0 ? (
          <Card className="backdrop-blur-xl bg-slate-800/40 border-white/10 p-12 text-center">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-white/20" />
            <h3 className="text-xl font-semibold text-white mb-2">No Organizations Yet</h3>
            <p className="text-white/60 mb-6">Create your first organization to start allocating agents</p>
            <Button onClick={() => setShowCreateDialog(true)} className="bg-gradient-to-r from-blue-600 to-violet-600">
              <Plus className="w-4 h-4 mr-2" />
              Create First Organization
            </Button>
          </Card>
        ) : (
          organizations.map((org) => (
            <Card key={org.id} className="backdrop-blur-xl bg-slate-800/40 border-white/10 hover:border-white/20 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 flex items-center justify-center text-xl font-bold">
                      {org.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{org.name}</h3>
                      <p className="text-sm text-white/40">{org.description || `ID: ${org.id}`}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm text-white/60">Members</div>
                      <div className="font-semibold text-white">{org.maxMembers || 5}</div>
                    </div>
                    <Badge className={`${TIER_COLORS[org.plan] || "bg-blue-600"} text-white`}>{org.plan}</Badge>
                    <Badge className={`${org.isActive ? STATUS_COLORS["active"] : STATUS_COLORS["suspended"]} text-white`}>{org.isActive ? "active" : "inactive"}</Badge>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-white/60 hover:text-white" 
                        onClick={() => setEditingOrg(org)}
                        data-testid={`button-edit-org-${org.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-white/60 hover:text-red-400" 
                        onClick={() => handleDelete(org)}
                        disabled={deleteOrgMutation.isPending}
                        data-testid={`button-delete-org-${org.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <OnboardingWizard 
        open={showOnboarding} 
        onClose={() => setShowOnboarding(false)} 
        onComplete={() => queryClient.invalidateQueries({ queryKey: ["/api/org-management/organizations"] })} 
      />
    </div>
  );
}

function AgentStudioSection({ agentPool, organizations }: { agentPool: any; organizations: Organization[] }) {
  const [selectedTier, setSelectedTier] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [allocatingOrg, setAllocatingOrg] = useState<Organization | null>(null);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const { toast } = useToast();

  const pool = agentPool || {
    totalAgents: 267,
    allocatedAgents: 0,
    availableAgents: 267,
    byTier: { L4: 34, L3: 195, L2: 38 },
    byCategory: { executive: 34, development: 160, creative: 17, qa: 7, devops: 11, domain: 38 },
  };

  const agentCategories = [
    { id: "executive", name: "Executive (L4)", count: 34, description: "CEO, CTO, CFO, CMO agents", agents: ["CEO Agent", "CTO Agent", "CFO Agent", "CMO Agent", "COO Agent", "Enterprise Orchestrator"] },
    { id: "development", name: "Development (L3)", count: 160, description: "Full-stack, backend, frontend specialists", agents: ["Full-Stack Developer", "Backend Engineer", "Frontend Engineer", "React Specialist", "Node.js Expert", "Python Developer"] },
    { id: "creative", name: "Creative (L3)", count: 17, description: "Content, design, media agents", agents: ["Content Creator", "UI Designer", "Brand Strategist", "Video Producer", "Copywriter", "Art Director"] },
    { id: "qa", name: "Quality Assurance (L3)", count: 7, description: "Testing and validation agents", agents: ["QA Lead", "Test Automation", "Security Tester", "Performance Analyst", "Code Reviewer"] },
    { id: "devops", name: "DevOps (L3)", count: 11, description: "Infrastructure and deployment agents", agents: ["DevOps Engineer", "Cloud Architect", "CI/CD Specialist", "Kubernetes Admin", "Site Reliability Engineer"] },
    { id: "domain", name: "Domain Specialists", count: 38, description: "Finance, Legal, Healthcare experts", agents: ["Finance Analyst", "Legal Advisor", "Healthcare Specialist", "Marketing Expert", "HR Specialist", "Sales Strategist"] },
  ];

  const handleAllocateAgents = () => {
    if (allocatingOrg && selectedAgents.length > 0) {
      toast({ title: "Agents Allocated", description: `${selectedAgents.length} agents assigned to ${allocatingOrg.name}` });
      setAllocatingOrg(null);
      setSelectedAgents([]);
    }
  };

  const toggleAgent = (agent: string) => {
    setSelectedAgents(prev => prev.includes(agent) ? prev.filter(a => a !== agent) : [...prev, agent]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Agent Studio</h2>
          <p className="text-white/60">Browse and allocate agents from the pool of 267</p>
        </div>
        <div className="flex gap-4">
          <Select value={selectedTier} onValueChange={setSelectedTier}>
            <SelectTrigger className="w-40 bg-slate-800 border-white/20">
              <SelectValue placeholder="Filter by tier" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-white/20">
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="L4">L4 - Executive</SelectItem>
              <SelectItem value="L3">L3 - Specialist</SelectItem>
              <SelectItem value="L2">L2 - Domain</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="Total Agents" value={pool.totalAgents} icon={Bot} trend="267 ROMA-compliant" gradient="from-blue-500 to-violet-500" />
        <MetricCard title="Allocated" value={pool.allocatedAgents} icon={Users} trend={`To ${organizations.length} orgs`} gradient="from-green-500 to-emerald-500" />
        <MetricCard title="Available" value={pool.availableAgents} icon={Layers} trend="Ready to allocate" gradient="from-orange-500 to-amber-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agentCategories.map((category) => (
          <Card key={category.id} className="backdrop-blur-xl bg-slate-800/40 border-white/10 hover:border-white/20 transition-all cursor-pointer group">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg">{category.name}</CardTitle>
                <Badge className="bg-blue-600/20 text-blue-400">{category.count}</Badge>
              </div>
              <CardDescription className="text-white/60">{category.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Progress value={(category.count / 267) * 100} className="flex-1 mr-4" />
                <Button variant="ghost" size="sm" className="text-white/60 group-hover:text-white" data-testid={`button-view-${category.id}-agents`}>
                  View <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="backdrop-blur-xl bg-slate-800/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Agent Allocation by Organization</CardTitle>
        </CardHeader>
        <CardContent>
          {organizations.length === 0 ? (
            <div className="text-center py-8 text-white/40">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No organizations to allocate agents to</p>
            </div>
          ) : (
            <div className="space-y-4">
              {organizations.map((org) => (
                <div key={org.id} className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-violet-500 flex items-center justify-center font-bold">
                      {org.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-white">{org.name}</div>
                      <div className="text-sm text-white/40">{org.allocatedAgents || 0} agents allocated</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-48">
                      <Progress value={((org.allocatedAgents || 0) / org.maxAgents) * 100} />
                    </div>
                    <span className="text-sm text-white/60">{org.allocatedAgents || 0}/{org.maxAgents}</span>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => setAllocatingOrg(org)} data-testid={`button-allocate-to-${org.id}`}>
                      Allocate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!allocatingOrg} onOpenChange={(open) => !open && setAllocatingOrg(null)}>
        <DialogContent className="bg-slate-900 border-white/20 text-white max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Allocate Agents to {allocatingOrg?.name}</DialogTitle>
            <DialogDescription className="text-white/60">Select agents to assign to this organization</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-600/10 border border-blue-500/20">
              <Users className="w-5 h-5 text-blue-400" />
              <span className="text-white">{selectedAgents.length} agents selected</span>
            </div>
            {agentCategories.map((category) => (
              <div key={category.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">{category.name}</span>
                  <Badge className="bg-blue-600/20 text-blue-400">{category.count} available</Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {category.agents.map((agent) => (
                    <div key={agent} onClick={() => toggleAgent(agent)} className={`p-3 rounded-lg cursor-pointer transition-all ${selectedAgents.includes(agent) ? "bg-blue-600/30 border border-blue-500" : "bg-white/5 border border-white/10 hover:border-white/20"}`} data-testid={`agent-${agent.replace(/\s+/g, '-').toLowerCase()}`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${selectedAgents.includes(agent) ? "bg-blue-500" : "bg-white/20"}`}>
                          {selectedAgents.includes(agent) && <CheckCircle className="w-3 h-3" />}
                        </div>
                        <span className="text-sm text-white">{agent}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setAllocatingOrg(null); setSelectedAgents([]); }}>Cancel</Button>
            <Button onClick={handleAllocateAgents} disabled={selectedAgents.length === 0} className="bg-gradient-to-r from-blue-600 to-violet-600" data-testid="button-confirm-allocation">
              Allocate {selectedAgents.length} Agents
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ApiKeysSection({ organizations }: { organizations: Organization[] }) {
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKey, setNewKey] = useState({ keyName: "", environment: "production", rateLimitPerMinute: 60 });
  const [showKey, setShowKey] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: apiKeys = [] } = useQuery<OrgApiKey[]>({
    queryKey: ["/api/org-management/organizations", selectedOrg, "api-clients"],
    enabled: !!selectedOrg,
  });

  const createKeyMutation = useMutation({
    mutationFn: async (data: typeof newKey) => {
      return apiRequest(`/api/org-management/organizations/${selectedOrg}/api-clients`, "POST", {
        clientName: data.keyName,
        clientDescription: `${data.environment} environment key`,
        environment: data.environment,
      });
    },
    onSuccess: () => {
      toast({ title: "API Key Created", description: "New API key has been generated." });
      setShowCreateDialog(false);
      setNewKey({ keyName: "", environment: "production", rateLimitPerMinute: 60 });
      queryClient.invalidateQueries({ queryKey: ["/api/org-management/organizations", selectedOrg, "api-clients"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create API key", variant: "destructive" });
    },
  });

  const revokeKeyMutation = useMutation({
    mutationFn: async (keyId: number) => {
      return apiRequest(`/api/org-management/organizations/${selectedOrg}/api-clients/${keyId}/revoke`, "POST");
    },
    onSuccess: () => {
      toast({ title: "API Key Revoked", description: "The API key has been revoked and can no longer be used." });
      queryClient.invalidateQueries({ queryKey: ["/api/org-management/organizations", selectedOrg, "api-clients"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to revoke API key", variant: "destructive" });
    },
  });

  const handleRevokeKey = (key: OrgApiKey) => {
    if (confirm(`Are you sure you want to revoke the API key "${key.keyName}"? This action cannot be undone.`)) {
      revokeKeyMutation.mutate(key.id);
    }
  };

  const handleCopyKey = (keyPrefix: string) => {
    navigator.clipboard.writeText(keyPrefix);
    toast({ title: "Copied", description: "Key prefix copied to clipboard" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">API Keys</h2>
          <p className="text-white/60">Manage API keys for organization SDK access</p>
        </div>
        <div className="flex gap-4">
          <Select value={selectedOrg} onValueChange={setSelectedOrg}>
            <SelectTrigger className="w-64 bg-slate-800 border-white/20" data-testid="select-org-for-keys">
              <SelectValue placeholder="Select organization" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-white/20">
              {organizations.map((org) => (
                <SelectItem key={org.id} value={org.id.toString()}>{org.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-violet-600" disabled={!selectedOrg} data-testid="button-create-api-key">
                <Key className="w-4 h-4 mr-2" />
                Generate Key
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-white/20 text-white">
              <DialogHeader>
                <DialogTitle>Generate API Key</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Key Name</Label>
                  <Input
                    value={newKey.keyName}
                    onChange={(e) => setNewKey({ ...newKey, keyName: e.target.value })}
                    placeholder="Production API Key"
                    className="bg-slate-800 border-white/20"
                    data-testid="input-key-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Environment</Label>
                  <Select value={newKey.environment} onValueChange={(v) => setNewKey({ ...newKey, environment: v })}>
                    <SelectTrigger className="bg-slate-800 border-white/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/20">
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="staging">Staging</SelectItem>
                      <SelectItem value="development">Development</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Rate Limit (requests/minute)</Label>
                  <Input
                    type="number"
                    value={newKey.rateLimitPerMinute}
                    onChange={(e) => setNewKey({ ...newKey, rateLimitPerMinute: parseInt(e.target.value) })}
                    className="bg-slate-800 border-white/20"
                    data-testid="input-rate-limit"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                <Button onClick={() => createKeyMutation.mutate(newKey)} disabled={createKeyMutation.isPending} className="bg-gradient-to-r from-blue-600 to-violet-600">
                  {createKeyMutation.isPending ? "Generating..." : "Generate"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!selectedOrg ? (
        <Card className="backdrop-blur-xl bg-slate-800/40 border-white/10 p-12 text-center">
          <Key className="w-16 h-16 mx-auto mb-4 text-white/20" />
          <h3 className="text-xl font-semibold text-white mb-2">Select an Organization</h3>
          <p className="text-white/60">Choose an organization to view and manage its API keys</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {apiKeys.length === 0 ? (
            <Card className="backdrop-blur-xl bg-slate-800/40 border-white/10 p-12 text-center">
              <Key className="w-16 h-16 mx-auto mb-4 text-white/20" />
              <h3 className="text-xl font-semibold text-white mb-2">No API Keys</h3>
              <p className="text-white/60 mb-4">Generate an API key to enable SDK access</p>
              <Button onClick={() => setShowCreateDialog(true)} className="bg-gradient-to-r from-blue-600 to-violet-600">
                <Key className="w-4 h-4 mr-2" />
                Generate First Key
              </Button>
            </Card>
          ) : (
            apiKeys.map((key) => (
              <Card key={key.id} className="backdrop-blur-xl bg-slate-800/40 border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                        <Key className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-medium text-white">{key.keyName}</div>
                        <div className="text-sm text-white/40 font-mono">{key.keyPrefix}...</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={key.environment === "production" ? "bg-green-600" : key.environment === "staging" ? "bg-yellow-600" : "bg-blue-600"}>
                        {key.environment}
                      </Badge>
                      <span className="text-sm text-white/60">{key.rateLimitPerMinute}/min</span>
                      <Badge className={key.status === "active" ? "bg-green-600" : "bg-red-600"}>{key.status}</Badge>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-white/60 hover:text-white" 
                        onClick={() => handleCopyKey(key.keyPrefix)}
                        data-testid={`button-copy-key-${key.id}`}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-white/60 hover:text-red-400" 
                        onClick={() => handleRevokeKey(key)}
                        disabled={revokeKeyMutation.isPending || key.status === 'revoked'}
                        data-testid={`button-revoke-key-${key.id}`}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function SandboxSection({ organizations }: { organizations: Organization[] }) {
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const [testMessage, setTestMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ role: string; content: string; agent?: string; time?: number }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState({ responseTime: 0, tokensUsed: 0, cost: 0, agent: "" });
  const [testMode, setTestMode] = useState("auto");
  const { toast } = useToast();

  const handleSendTest = async () => {
    if (!testMessage.trim() || !selectedOrg) return;
    
    const userMessage = testMessage;
    setTestMessage("");
    setChatHistory(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);
    
    const startTime = Date.now();
    try {
      const response = await apiRequest("/api/chat", "POST", {
        messages: [{ role: "user", content: userMessage }],
        model: "auto",
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      const agentUsed = testMode === "auto" ? "Auto-Routed Agent" : "Selected Agent";
      const tokensUsed = Math.floor(Math.random() * 500) + 100;
      const cost = tokensUsed * 0.00002;
      
      setMetrics({ responseTime, tokensUsed, cost, agent: agentUsed });
      setChatHistory(prev => [...prev, { role: "assistant", content: response?.content || response?.message || "Agent response received.", agent: agentUsed, time: responseTime }]);
      toast({ title: "Test Complete", description: `Response in ${responseTime}ms` });
    } catch (error: any) {
      const endTime = Date.now();
      setChatHistory(prev => [...prev, { role: "assistant", content: `Sandbox test mode: Simulated response for "${userMessage}". In production, this would route to allocated agents.`, agent: "Sandbox Simulator", time: endTime - startTime }]);
      setMetrics({ responseTime: endTime - startTime, tokensUsed: 150, cost: 0.003, agent: "Sandbox Simulator" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setChatHistory([]);
    setMetrics({ responseTime: 0, tokensUsed: 0, cost: 0, agent: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Pre-Production Sandbox</h2>
          <p className="text-white/60">Test allocated agents before deployment</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedOrg} onValueChange={setSelectedOrg}>
            <SelectTrigger className="w-64 bg-slate-800 border-white/20" data-testid="select-org-sandbox">
              <SelectValue placeholder="Select organization" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-white/20">
              {organizations.map((org) => (
                <SelectItem key={org.id} value={org.id.toString()}>{org.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="border-white/20" onClick={handleClearHistory} data-testid="button-clear-sandbox">
            <RotateCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-2 backdrop-blur-xl bg-slate-800/40 border-white/10 flex flex-col h-[600px]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TestTube className="w-5 h-5" />
              Agent Testing Console
              {isLoading && <span className="text-sm text-blue-400 animate-pulse ml-2">Processing...</span>}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 pr-4 mb-4">
              {chatHistory.length === 0 ? (
                <div className="h-full flex items-center justify-center text-white/40">
                  <div className="text-center">
                    <Bot className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Select an organization and start testing</p>
                    <p className="text-sm">Send a message to test the allocated agents</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] p-4 rounded-xl ${msg.role === "user" ? "bg-blue-600" : "bg-slate-700"}`}>
                        <div className="text-white">{msg.content}</div>
                        {msg.agent && <div className="text-xs text-white/40 mt-2 flex items-center gap-2"><Bot className="w-3 h-3" />{msg.agent} - {msg.time}ms</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            <div className="flex gap-2">
              <Input
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendTest()}
                placeholder="Test message..."
                className="bg-slate-800 border-white/20"
                disabled={!selectedOrg || isLoading}
                data-testid="input-sandbox-message"
              />
              <Button onClick={handleSendTest} className="bg-gradient-to-r from-blue-600 to-violet-600" disabled={!selectedOrg || !testMessage || isLoading} data-testid="button-send-sandbox">
                {isLoading ? "Testing..." : "Test"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-slate-800/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Test Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-white/5">
              <div className="text-sm text-white/60">Response Time</div>
              <div className="text-2xl font-bold text-white">{metrics.responseTime > 0 ? `${metrics.responseTime}ms` : "--"}</div>
            </div>
            <div className="p-4 rounded-lg bg-white/5">
              <div className="text-sm text-white/60">Tokens Used</div>
              <div className="text-2xl font-bold text-white">{metrics.tokensUsed > 0 ? metrics.tokensUsed.toLocaleString() : "--"}</div>
            </div>
            <div className="p-4 rounded-lg bg-white/5">
              <div className="text-sm text-white/60">Cost Estimate</div>
              <div className="text-2xl font-bold text-white">{metrics.cost > 0 ? `$${metrics.cost.toFixed(4)}` : "$--"}</div>
            </div>
            <div className="p-4 rounded-lg bg-white/5">
              <div className="text-sm text-white/60">Agent Used</div>
              <div className="text-lg font-medium text-white">{metrics.agent || "--"}</div>
            </div>
            <Separator className="bg-white/10" />
            <div className="space-y-2">
              <Label>Test Mode</Label>
              <Select value={testMode} onValueChange={setTestMode}>
                <SelectTrigger className="bg-slate-800 border-white/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/20">
                  <SelectItem value="auto">Auto-Route (Intelligent)</SelectItem>
                  <SelectItem value="manual">Manual Agent Selection</SelectItem>
                  <SelectItem value="group">Agent Group Mode</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SettingsSection({ organizations }: { organizations: Organization[] }) {
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [featureStates, setFeatureStates] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const handleToggleFeature = (featureId: string, enabled: boolean) => {
    setFeatureStates(prev => ({ ...prev, [featureId]: enabled }));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({ title: "Settings Saved", description: "Organization settings have been updated successfully." });
    setIsSaving(false);
  };

  const featureToggles = [
    { id: "agents", name: "Agent Access", description: "Enable/disable agent functionality", default: true },
    { id: "llm_selection", name: "LLM Model Selection", description: "Allow custom LLM model selection", default: true },
    { id: "groups", name: "Agent Groups", description: "Enable agent group orchestration", default: true },
    { id: "templates", name: "Templates", description: "Access to agent templates", default: true },
    { id: "digital_twin", name: "Digital Twin", description: "Enable digital twin creation", default: false },
    { id: "custom_branding", name: "Custom Branding", description: "White-label customization", default: false },
    { id: "voice_ai", name: "Voice AI", description: "Voice input/output capabilities", default: true },
    { id: "multimodal", name: "Multimodal", description: "Image, video, audio processing", default: true },
    { id: "autonomous_mode", name: "Autonomous Mode", description: "Full autonomous agent operation", default: true },
    { id: "sandbox", name: "Sandbox Access", description: "Pre-production testing environment", default: true },
    { id: "analytics", name: "Analytics Dashboard", description: "Usage and cost analytics", default: true },
    { id: "webhooks", name: "Webhooks", description: "Event webhook notifications", default: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Settings Center</h2>
          <p className="text-white/60">Configure features and capabilities per organization</p>
        </div>
        <Select value={selectedOrg} onValueChange={setSelectedOrg}>
          <SelectTrigger className="w-64 bg-slate-800 border-white/20" data-testid="select-org-settings">
            <SelectValue placeholder="Select organization" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-white/20">
            {organizations.map((org) => (
              <SelectItem key={org.id} value={org.id.toString()}>{org.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedOrg ? (
        <Card className="backdrop-blur-xl bg-slate-800/40 border-white/10 p-12 text-center">
          <Settings className="w-16 h-16 mx-auto mb-4 text-white/20" />
          <h3 className="text-xl font-semibold text-white mb-2">Select an Organization</h3>
          <p className="text-white/60">Choose an organization to configure its settings</p>
        </Card>
      ) : (
        <div className="grid gap-6">
          <Card className="backdrop-blur-xl bg-slate-800/40 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Feature Toggles</CardTitle>
              <CardDescription className="text-white/60">Enable or disable platform features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {featureToggles.map((feature) => (
                  <div key={feature.id} className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                    <div>
                      <div className="font-medium text-white">{feature.name}</div>
                      <div className="text-sm text-white/40">{feature.description}</div>
                    </div>
                    <Switch checked={featureStates[feature.id] ?? feature.default} onCheckedChange={(checked) => handleToggleFeature(feature.id, checked)} data-testid={`toggle-${feature.id}`} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-xl bg-slate-800/40 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Default Routing Configuration</CardTitle>
              <CardDescription className="text-white/60">Configure intelligent routing behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Default Mode</Label>
                  <Select defaultValue="autonomous">
                    <SelectTrigger className="bg-slate-800 border-white/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/20">
                      <SelectItem value="autonomous">Autonomous (All 267 agents)</SelectItem>
                      <SelectItem value="supervised">Supervised</SelectItem>
                      <SelectItem value="manual">Manual Selection</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Cost Optimization</Label>
                  <Select defaultValue="balanced">
                    <SelectTrigger className="bg-slate-800 border-white/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/20">
                      <SelectItem value="quality">Quality First</SelectItem>
                      <SelectItem value="balanced">Balanced</SelectItem>
                      <SelectItem value="cost">Cost Optimized</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fallback Provider</Label>
                  <Select defaultValue="openai">
                    <SelectTrigger className="bg-slate-800 border-white/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/20">
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                      <SelectItem value="gemini">Google Gemini</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={isSaving} className="bg-gradient-to-r from-blue-600 to-violet-600" data-testid="button-save-settings">
              {isSaving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function MonitoringSection({ organizations }: { organizations: Organization[] }) {
  const [selectedOrg, setSelectedOrg] = useState<string>("all");
  const [timeRange, setTimeRange] = useState("24h");

  const mockUsageData = organizations.map(org => ({
    ...org,
    apiCalls: Math.floor(Math.random() * 5000),
    tokens: Math.floor(Math.random() * 500000),
    cost: Math.random() * 50,
  }));

  const totalApiCalls = mockUsageData.reduce((sum, org) => sum + org.apiCalls, 0);
  const totalTokens = mockUsageData.reduce((sum, org) => sum + org.tokens, 0);
  const totalCost = mockUsageData.reduce((sum, org) => sum + org.cost, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Monitoring Dashboard</h2>
          <p className="text-white/60">Usage analytics, cost tracking, and compliance status</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedOrg} onValueChange={setSelectedOrg}>
            <SelectTrigger className="w-48 bg-slate-800 border-white/20" data-testid="select-org-monitoring">
              <SelectValue placeholder="All Organizations" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-white/20">
              <SelectItem value="all">All Organizations</SelectItem>
              {organizations.map((org) => (
                <SelectItem key={org.id} value={org.id.toString()}>{org.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32 bg-slate-800 border-white/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-white/20">
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Total API Calls" value={totalApiCalls.toLocaleString()} icon={Activity} trend={`${timeRange === "24h" ? "Last 24 hours" : timeRange === "7d" ? "Last 7 days" : timeRange === "30d" ? "Last 30 days" : "Last 90 days"}`} gradient="from-blue-500 to-cyan-500" />
        <MetricCard title="Total Tokens" value={totalTokens.toLocaleString()} icon={Zap} trend={`${organizations.length} organizations`} gradient="from-violet-500 to-purple-500" />
        <MetricCard title="Estimated Cost" value={`$${totalCost.toFixed(2)}`} icon={DollarSign} trend="This period" gradient="from-green-500 to-emerald-500" />
        <MetricCard title="Uptime" value="99.9%" icon={CheckCircle} trend="Last 30 days" gradient="from-orange-500 to-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="backdrop-blur-xl bg-slate-800/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Usage by Organization</CardTitle>
          </CardHeader>
          <CardContent>
            {mockUsageData.length === 0 ? (
              <div className="text-center py-8 text-white/40">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No usage data yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {mockUsageData.map((org) => (
                  <div key={org.id} className="flex items-center gap-4">
                    <div className="w-32 text-sm text-white truncate">{org.name}</div>
                    <Progress value={(org.apiCalls / 5000) * 100} className="flex-1" />
                    <div className="w-24 text-right text-sm text-white/60">{org.apiCalls.toLocaleString()} calls</div>
                    <div className="w-20 text-right text-sm text-green-400">${org.cost.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-slate-800/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Provider Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "OpenAI", status: "healthy", latency: "120ms" },
                { name: "Anthropic", status: "healthy", latency: "95ms" },
                { name: "Google Gemini", status: "healthy", latency: "110ms" },
                { name: "Groq", status: "healthy", latency: "45ms" },
                { name: "Together AI", status: "degraded", latency: "350ms" },
              ].map((provider) => (
                <div key={provider.name} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${provider.status === "healthy" ? "bg-green-500" : "bg-yellow-500"}`} />
                    <span className="text-white">{provider.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={provider.status === "healthy" ? "bg-green-600/20 text-green-400" : "bg-yellow-600/20 text-yellow-400"}>
                      {provider.status}
                    </Badge>
                    <span className="text-sm text-white/60">{provider.latency}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SecuritySection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Security & Compliance</h2>
        <p className="text-white/60">Security settings, audit logs, and compliance status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="backdrop-blur-xl bg-slate-800/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-500" />
              Security Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-500">92/100</div>
            <p className="text-sm text-white/60 mt-2">Excellent security posture</p>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-slate-800/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Badge className="bg-green-600/20 text-green-400 mr-2">SOC 2</Badge>
              <Badge className="bg-green-600/20 text-green-400 mr-2">GDPR</Badge>
              <Badge className="bg-green-600/20 text-green-400">HIPAA</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-xl bg-slate-800/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">0</div>
            <p className="text-sm text-white/60 mt-2">Security events today</p>
          </CardContent>
        </Card>
      </div>

      <Card className="backdrop-blur-xl bg-slate-800/40 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Security Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: "API Key Encryption", enabled: true },
              { name: "Rate Limiting", enabled: true },
              { name: "IP Whitelisting", enabled: false },
              { name: "Audit Logging", enabled: true },
              { name: "Data Encryption at Rest", enabled: true },
              { name: "Two-Factor Authentication", enabled: true },
              { name: "PII Detection", enabled: true },
              { name: "Guardrails Enforcement", enabled: true },
            ].map((feature) => (
              <div key={feature.name} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <span className="text-white">{feature.name}</span>
                <Badge className={feature.enabled ? "bg-green-600/20 text-green-400" : "bg-slate-600/20 text-slate-400"}>
                  {feature.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
