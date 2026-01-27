import React, { useState } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { AgentStatusCard } from '@/components/ui/agent-status-card';
import { FloatingChat } from '@/components/ui/floating-chat';
import { AnimatedList } from '@/components/react-bits/animated-list';
import { SplitText } from '@/components/react-bits/split-text';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Navigation Component
function Navigation() {
  return (
    <nav className="sticky top-0 z-50 bg-gray-800/90 backdrop-blur-lg border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center">
              <i className="fas fa-robot text-white text-lg"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">WAI DevStudio</h1>
              <p className="text-xs text-gray-400">AI-Powered Development Platform</p>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <Link to="/founder-dashboard">
              <a className="text-gray-300 hover:text-white transition-colors">Dashboard</a>
            </Link>
            <Link to="/agents">
              <a className="text-blue-400 hover:text-white transition-colors">Agents</a>
            </Link>
            <Link to="/projects">
              <a className="text-gray-300 hover:text-white transition-colors">Projects</a>
            </Link>
            <Link to="/analytics">
              <a className="text-gray-300 hover:text-white transition-colors">Analytics</a>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <button className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <i className="fas fa-bell text-sm"></i>
              </button>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></span>
            </div>
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function Agents() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const { data: agentStatus } = useQuery({
    queryKey: ['agents', 'status'],
    queryFn: () => apiRequest('/api/agents/status'),
    refetchInterval: 10000
  });

  const { data: analytics } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => apiRequest('/api/analytics/overview'),
    refetchInterval: 30000
  });

  const agents = agentStatus?.agents || [];

  const filteredAgents = agents.filter((agent: any) => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
    const matchesType = typeFilter === 'all' || agent.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const agentsByCategory = {
    leadership: filteredAgents.filter((agent: any) => ['cto', 'cpo', 'cmo'].includes(agent.type)),
    core: filteredAgents.filter((agent: any) => ['analyst', 'architect', 'pm', 'scrum_master'].includes(agent.type)),
    development: filteredAgents.filter((agent: any) => ['ui_ux', 'frontend', 'backend', 'database'].includes(agent.type)),
    operations: filteredAgents.filter((agent: any) => ['qa', 'devops', 'security'].includes(agent.type))
  };

  const getAgentTypeIcon = (type: string) => {
    const icons = {
      cto: '👔', cpo: '📊', cmo: '📢',
      analyst: '🔍', architect: '🏗️', pm: '📋', scrum_master: '🏃',
      ui_ux: '🎨', frontend: '⚛️', backend: '⚙️', database: '🗄️',
      qa: '🧪', devops: '🚀', security: '🔒'
    };
    return icons[type as keyof typeof icons] || '🤖';
  };

  const getStatusStats = () => {
    const stats = {
      total: agents.length,
      active: agents.filter((a: any) => a.status === 'active').length,
      busy: agents.filter((a: any) => a.status === 'busy').length,
      idle: agents.filter((a: any) => a.status === 'idle').length,
      error: agents.filter((a: any) => a.status === 'error').length
    };
    return stats;
  };

  const stats = getStatusStats();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <SplitText 
            text="AI Agent Management Center"
            className="text-3xl font-bold mb-4"
            variant="slide"
            duration={0.6}
          />
          <p className="text-gray-400 text-lg">
            Monitor, manage, and optimize your 28+ specialized AI agents
          </p>
        </div>

        {/* Agent Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-sm text-gray-400">Total Agents</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.active}</div>
              <div className="text-sm text-gray-400">Active</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-yellow-400">{stats.busy}</div>
              <div className="text-sm text-gray-400">Busy</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-gray-400">{stats.idle}</div>
              <div className="text-sm text-gray-400">Idle</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-red-400">{stats.error}</div>
              <div className="text-sm text-gray-400">Error</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="bg-gray-800 border-gray-700 mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search agents by name or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="idle">Idle</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48 bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="cto">CTO</SelectItem>
                  <SelectItem value="cpo">CPO</SelectItem>
                  <SelectItem value="frontend">Frontend</SelectItem>
                  <SelectItem value="backend">Backend</SelectItem>
                  <SelectItem value="qa">QA</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Agent Tabs by Category */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-gray-800">
            <TabsTrigger value="all">All Agents</TabsTrigger>
            <TabsTrigger value="leadership">Leadership</TabsTrigger>
            <TabsTrigger value="core">Core</TabsTrigger>
            <TabsTrigger value="development">Development</TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
          </TabsList>

          {/* All Agents */}
          <TabsContent value="all" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatedList
                items={filteredAgents.map((agent: any) => (
                  <AgentStatusCard 
                    key={agent.id} 
                    agent={agent}
                    onClick={() => console.log('Agent clicked:', agent)}
                  />
                ))}
                stagger={0.05}
                variant="stagger"
              />
            </div>
          </TabsContent>

          {/* Leadership Agents */}
          <TabsContent value="leadership" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <i className="fas fa-crown text-yellow-400 mr-2"></i>
                  Leadership Agents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatedList
                    items={agentsByCategory.leadership.map((agent: any) => (
                      <AgentStatusCard key={agent.id} agent={agent} />
                    ))}
                    stagger={0.1}
                    variant="cascade"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Core Agents */}
          <TabsContent value="core" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <i className="fas fa-cogs text-blue-400 mr-2"></i>
                  BMAD Core Agents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatedList
                    items={agentsByCategory.core.map((agent: any) => (
                      <AgentStatusCard key={agent.id} agent={agent} />
                    ))}
                    stagger={0.1}
                    variant="stagger"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Development Agents */}
          <TabsContent value="development" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <i className="fas fa-code text-green-400 mr-2"></i>
                  Development Agents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatedList
                    items={agentsByCategory.development.map((agent: any) => (
                      <AgentStatusCard key={agent.id} agent={agent} />
                    ))}
                    stagger={0.1}
                    variant="wave"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Operations Agents */}
          <TabsContent value="operations" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <i className="fas fa-shield-alt text-purple-400 mr-2"></i>
                  Operations Agents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatedList
                    items={agentsByCategory.operations.map((agent: any) => (
                      <AgentStatusCard key={agent.id} agent={agent} />
                    ))}
                    stagger={0.1}
                    variant="spring"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Agent Performance Summary */}
        {analytics?.agents && (
          <Card className="bg-gray-800 border-gray-700 mt-8">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <i className="fas fa-trophy text-yellow-400 mr-2"></i>
                Top Performing Agents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {analytics.agents.topPerformers?.slice(0, 6).map((performer: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-white">{performer.name}</p>
                        <p className="text-xs text-gray-400 capitalize">
                          {performer.type.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-green-600 text-white">
                        {Math.round(performer.quality * 100)}%
                      </Badge>
                      <p className="text-xs text-gray-400 mt-1">
                        {performer.tasksCompleted} tasks
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      <FloatingChat />
    </div>
  );
}
