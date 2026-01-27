import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Link } from 'wouter';
import {
  Scale, FileText, Users, Search, BookOpen, AlertTriangle,
  CheckCircle2, Clock, Globe, Building2, Gavel, Shield,
  TrendingUp, MessageSquare, Activity, ChevronRight, Brain,
  Briefcase, File, Award, MapPin, BookMarked, Landmark
} from 'lucide-react';

const practiceAreas = [
  { id: 'corporate', name: 'Corporate Law', agents: 10, color: 'bg-blue-500' },
  { id: 'criminal', name: 'Criminal Law', agents: 10, color: 'bg-red-500' },
  { id: 'civil', name: 'Civil Law', agents: 9, color: 'bg-green-500' },
  { id: 'constitutional', name: 'Constitutional Law', agents: 8, color: 'bg-purple-500' },
  { id: 'family', name: 'Family Law', agents: 9, color: 'bg-pink-500' },
  { id: 'property', name: 'Property Law', agents: 9, color: 'bg-orange-500' },
  { id: 'labor', name: 'Labor & Employment', agents: 10, color: 'bg-yellow-500' },
  { id: 'tax', name: 'Tax Law', agents: 10, color: 'bg-emerald-500' },
  { id: 'ip', name: 'Intellectual Property', agents: 10, color: 'bg-indigo-500' },
  { id: 'environmental', name: 'Environmental Law', agents: 10, color: 'bg-teal-500' },
  { id: 'banking', name: 'Banking & Finance', agents: 10, color: 'bg-cyan-500' },
  { id: 'consumer', name: 'Consumer Protection', agents: 9, color: 'bg-lime-500' },
  { id: 'cyber', name: 'Cyber & Data Privacy', agents: 9, color: 'bg-violet-500' },
  { id: 'arbitration', name: 'Arbitration & ADR', agents: 10, color: 'bg-rose-500' },
  { id: 'media', name: 'Media & Entertainment', agents: 10, color: 'bg-fuchsia-500' },
  { id: 'medical', name: 'Medical & Healthcare', agents: 9, color: 'bg-red-400' },
  { id: 'immigration', name: 'Immigration Law', agents: 10, color: 'bg-sky-500' },
  { id: 'international', name: 'International Law', agents: 10, color: 'bg-blue-400' },
  { id: 'insurance', name: 'Insurance Law', agents: 10, color: 'bg-amber-500' },
  { id: 'education', name: 'Education Law', agents: 8, color: 'bg-green-400' },
  { id: 'sports', name: 'Sports Law', agents: 8, color: 'bg-orange-400' },
  { id: 'aviation', name: 'Aviation Law', agents: 9, color: 'bg-blue-300' },
  { id: 'maritime', name: 'Maritime Law', agents: 9, color: 'bg-cyan-400' },
  { id: 'energy', name: 'Energy Law', agents: 10, color: 'bg-yellow-400' },
  { id: 'competition', name: 'Competition/Antitrust', agents: 8, color: 'bg-purple-400' },
  { id: 'dpdp', name: 'Data Privacy (DPDP)', agents: 9, color: 'bg-indigo-400' },
  { id: 'humanrights', name: 'Human Rights Law', agents: 8, color: 'bg-pink-400' },
  { id: 'administrative', name: 'Administrative Law', agents: 9, color: 'bg-gray-500' },
  { id: 'election', name: 'Election Law', agents: 8, color: 'bg-rose-400' }
];

const jurisdictions = [
  { code: 'IN', name: 'India', flag: 'flag-india', status: 'active', laws: 150 },
  { code: 'AE', name: 'UAE', flag: 'flag-uae', status: 'active', laws: 45 },
  { code: 'SG', name: 'Singapore', flag: 'flag-singapore', status: 'active', laws: 38 },
  { code: 'SA', name: 'Saudi Arabia', flag: 'flag-saudi', status: 'beta', laws: 28 }
];

const recentCases = [
  { id: 'case_001', title: 'Contract Dispute - ABC Corp vs XYZ Ltd', type: 'Corporate', status: 'In Progress', priority: 'High' },
  { id: 'case_002', title: 'Employment Termination Review', type: 'Labor', status: 'Pending Review', priority: 'Medium' },
  { id: 'case_003', title: 'IP Infringement Analysis', type: 'IP', status: 'Completed', priority: 'Low' },
  { id: 'case_004', title: 'Tax Compliance Assessment', type: 'Tax', status: 'In Progress', priority: 'High' }
];

export default function NyayaVighyaDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: patternsHealth } = useQuery({
    queryKey: ['/api/wai-v3/patterns/health'],
    refetchInterval: 30000
  });

  const totalAgents = 275;
  const totalPracticeAreas = 29;
  const complianceScore = 94;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-950 via-amber-900 to-amber-950" data-testid="nyaya-dashboard">
      <header className="border-b border-amber-700 bg-amber-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
                <Scale className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  NyayaVighya v3.0
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/50">Legal AI</Badge>
                </h1>
                <p className="text-sm text-amber-400">Enterprise Legal Intelligence Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-400">System Healthy</span>
              </div>
              <Link href="/wai-v3">
                <Button variant="outline" className="border-amber-600 text-amber-300 hover:bg-amber-800" data-testid="btn-wai-sdk">
                  WAI SDK Console
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-amber-900/50 border-amber-700" data-testid="card-total-agents">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-400">Total Legal Agents</p>
                  <p className="text-3xl font-bold text-white">{totalAgents}</p>
                </div>
                <Users className="h-10 w-10 text-amber-500" />
              </div>
              <p className="text-xs text-amber-500 mt-2">Across {totalPracticeAreas} practice areas</p>
            </CardContent>
          </Card>

          <Card className="bg-amber-900/50 border-amber-700" data-testid="card-jurisdictions">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-400">Jurisdictions</p>
                  <p className="text-3xl font-bold text-white">4</p>
                </div>
                <Globe className="h-10 w-10 text-amber-500" />
              </div>
              <p className="text-xs text-amber-500 mt-2">India, UAE, Singapore, Saudi Arabia</p>
            </CardContent>
          </Card>

          <Card className="bg-amber-900/50 border-amber-700" data-testid="card-compliance">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-400">Compliance Score</p>
                  <p className="text-3xl font-bold text-white">{complianceScore}%</p>
                </div>
                <Shield className="h-10 w-10 text-green-500" />
              </div>
              <Progress value={complianceScore} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card className="bg-amber-900/50 border-amber-700" data-testid="card-pattern-compliance">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-400">Pattern Compliance</p>
                  <p className="text-3xl font-bold text-white">20/20</p>
                </div>
                <Brain className="h-10 w-10 text-purple-500" />
              </div>
              <p className="text-xs text-amber-500 mt-2">All agentic patterns implemented</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-amber-900/50 border border-amber-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-amber-700" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="practice-areas" className="data-[state=active]:bg-amber-700" data-testid="tab-practice-areas">Practice Areas</TabsTrigger>
            <TabsTrigger value="jurisdictions" className="data-[state=active]:bg-amber-700" data-testid="tab-jurisdictions">Jurisdictions</TabsTrigger>
            <TabsTrigger value="research" className="data-[state=active]:bg-amber-700" data-testid="tab-research">Legal Research</TabsTrigger>
            <TabsTrigger value="cases" className="data-[state=active]:bg-amber-700" data-testid="tab-cases">Cases</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-amber-900/50 border-amber-700">
                <CardHeader>
                  <CardTitle className="text-amber-100 flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Platform Capabilities
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-amber-800/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Search className="h-5 w-5 text-amber-400" />
                      <span className="text-amber-200">Legal Research</span>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-amber-800/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-amber-400" />
                      <span className="text-amber-200">Document Analysis</span>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-amber-800/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Gavel className="h-5 w-5 text-amber-400" />
                      <span className="text-amber-200">Case Analysis</span>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-amber-800/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-amber-400" />
                      <span className="text-amber-200">Citation Validation</span>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-amber-800/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-amber-400" />
                      <span className="text-amber-200">Compliance Checker</span>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400">Active</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-amber-900/50 border-amber-700">
                <CardHeader>
                  <CardTitle className="text-amber-100 flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {recentCases.map((caseItem) => (
                        <div key={caseItem.id} className="p-3 bg-amber-800/30 rounded-lg" data-testid={`case-${caseItem.id}`}>
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium text-amber-100">{caseItem.title}</p>
                              <p className="text-xs text-amber-400">{caseItem.type}</p>
                            </div>
                            <Badge variant="outline" className={
                              caseItem.priority === 'High' ? 'border-red-500 text-red-400' :
                              caseItem.priority === 'Medium' ? 'border-yellow-500 text-yellow-400' :
                              'border-green-500 text-green-400'
                            }>
                              {caseItem.priority}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="border-amber-600 text-amber-300 text-xs">
                              {caseItem.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-amber-900/50 border-amber-700">
              <CardHeader>
                <CardTitle className="text-amber-100 flex items-center gap-2">
                  <BookMarked className="h-5 w-5" />
                  Supported Legal Frameworks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {['IPC', 'CrPC', 'CPC', 'BNS 2023', 'BNSS 2023', 'Companies Act', 'DPDP Act 2023', 'IT Act', 'SEBI', 'RBI Guidelines', 'GST Act', 'POSH Act'].map((law) => (
                    <Badge key={law} variant="outline" className="border-amber-600 text-amber-300 justify-center py-2">
                      {law}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="practice-areas" className="space-y-6">
            <Card className="bg-amber-900/50 border-amber-700">
              <CardHeader>
                <CardTitle className="text-amber-100 flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  29 Practice Areas
                </CardTitle>
                <CardDescription className="text-amber-400">
                  Comprehensive coverage across all major legal domains
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {practiceAreas.map((area) => (
                    <div key={area.id} className="p-4 bg-amber-800/30 rounded-lg hover:bg-amber-800/50 transition-colors cursor-pointer" data-testid={`area-${area.id}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-amber-100 font-medium">{area.name}</span>
                        <Badge className={`${area.color}/20 text-white border-0`}>
                          {area.agents} agents
                        </Badge>
                      </div>
                      <Progress value={(area.agents / 12) * 100} className="h-1" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="jurisdictions" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {jurisdictions.map((jurisdiction) => (
                <Card key={jurisdiction.code} className="bg-amber-900/50 border-amber-700" data-testid={`jurisdiction-${jurisdiction.code}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-amber-100 flex items-center gap-3">
                        <Landmark className="h-6 w-6 text-amber-400" />
                        {jurisdiction.name}
                      </CardTitle>
                      <Badge className={jurisdiction.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                        {jurisdiction.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-amber-400">Laws Covered</span>
                        <span className="text-amber-100 font-semibold">{jurisdiction.laws}+</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-amber-400">Legal System</span>
                        <span className="text-amber-100">
                          {jurisdiction.code === 'IN' ? 'Common Law + Statutes' :
                           jurisdiction.code === 'AE' ? 'Civil Law + Sharia' :
                           jurisdiction.code === 'SG' ? 'Common Law' :
                           'Sharia + Modern Commercial'}
                        </span>
                      </div>
                      <Button variant="outline" className="w-full mt-4 border-amber-600 text-amber-300 hover:bg-amber-800">
                        Explore Laws <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="research" className="space-y-6">
            <Card className="bg-amber-900/50 border-amber-700">
              <CardHeader>
                <CardTitle className="text-amber-100 flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Legal Research Engine
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Input 
                    placeholder="Search cases, statutes, regulations..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-amber-800/30 border-amber-700 text-amber-100 placeholder:text-amber-500"
                    data-testid="input-search"
                  />
                  <Button className="bg-amber-600 hover:bg-amber-700" data-testid="btn-search">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Case Law', 'Statutes', 'Regulations', 'Commentary', 'Forms'].map((filter) => (
                    <Badge key={filter} variant="outline" className="border-amber-600 text-amber-300 cursor-pointer hover:bg-amber-800">
                      {filter}
                    </Badge>
                  ))}
                </div>
                <div className="p-8 text-center text-amber-500 bg-amber-800/20 rounded-lg">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Enter a search query to find relevant legal materials</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cases" className="space-y-6">
            <Card className="bg-amber-900/50 border-amber-700">
              <CardHeader>
                <CardTitle className="text-amber-100 flex items-center gap-2">
                  <Gavel className="h-5 w-5" />
                  Case Management
                </CardTitle>
                <CardDescription className="text-amber-400">
                  Track and manage legal matters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentCases.map((caseItem) => (
                    <div key={caseItem.id} className="p-4 bg-amber-800/30 rounded-lg" data-testid={`manage-case-${caseItem.id}`}>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-medium text-amber-100">{caseItem.title}</p>
                          <div className="flex items-center gap-2 text-sm text-amber-400">
                            <Badge variant="outline" className="border-amber-600">{caseItem.type}</Badge>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {caseItem.status}
                            </span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="border-amber-600 text-amber-300 hover:bg-amber-800">
                          Open <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-4 bg-amber-600 hover:bg-amber-700" data-testid="btn-new-case">
                  <File className="h-4 w-4 mr-2" />
                  Create New Case
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
