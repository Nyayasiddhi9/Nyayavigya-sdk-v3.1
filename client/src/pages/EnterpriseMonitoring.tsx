import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Shield, 
  Brain, 
  Cog, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Users,
  Database,
  Zap,
  Target
} from 'lucide-react';

interface EnhancementStatus {
  phase1: {
    name: string;
    status: string;
    metrics: {
      totalEvaluations: number;
      averageQuality: number;
      activeExperiments: number;
    };
  };
  phase2: {
    name: string;
    status: string;
    metrics: {
      totalAgents: number;
      systemReliability: number;
      byzantineTolerance: number;
    };
  };
  phase3: {
    name: string;
    status: string;
    metrics: {
      totalPatterns: number;
      adaptationEfficiency: number;
      learningRate: number;
    };
  };
  phase4: {
    name: string;
    status: string;
    metrics: {
      totalCalls: number;
      successRate: number;
      averageResponseTime: number;
    };
  };
  overallEnhancement: {
    platformImprovement: string;
    enterpriseReadiness: string;
    competitiveAdvantage: string;
  };
}

interface HealthStatus {
  overall: string;
  phases: {
    phase1: string;
    phase2: string;
    phase3: string;
    phase4: string;
  };
  performance: {
    responseTime: string;
    successRate: string;
    systemLoad: string;
    reliability: string;
  };
  enhancement: {
    platformImprovement: string;
    enterpriseReadiness: string;
    competitiveAdvantage: string;
  };
}

export default function EnterpriseMonitoring() {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: enhancementStatus, isLoading: statusLoading } = useQuery<{
    success: boolean;
    enhancementStatus: EnhancementStatus;
    timestamp: string;
    systemHealth: string;
  }>({
    queryKey: ['/api/enhancement/status'],
    refetchInterval: 5000, // Refresh every 5 seconds for real-time monitoring
  });

  const { data: healthStatus, isLoading: healthLoading } = useQuery<{
    success: boolean;
    healthStatus: HealthStatus;
    timestamp: string;
    uptime: number;
  }>({
    queryKey: ['/api/enhancement/health'],
    refetchInterval: 3000, // Refresh every 3 seconds for health monitoring
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'healthy':
      case 'operational':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'failed':
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'healthy':
      case 'operational':
        return 'default';
      case 'degraded':
        return 'secondary';
      case 'failed':
      case 'critical':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (statusLoading || healthLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading Enterprise Monitoring...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Enterprise Monitoring Dashboard
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            4-Phase Enhancement System - 150% Platform Capability Boost
          </p>
          <div className="flex items-center justify-center mt-4 space-x-4">
            <Badge variant="default" className="text-sm">
              Platform Enhancement: {enhancementStatus?.enhancementStatus.overallEnhancement.platformImprovement}
            </Badge>
            <Badge variant="secondary" className="text-sm">
              Uptime: {healthStatus ? formatUptime(healthStatus.uptime) : 'N/A'}
            </Badge>
            <Badge variant={getStatusBadgeVariant(enhancementStatus?.systemHealth || '')} className="text-sm">
              System Health: {enhancementStatus?.systemHealth}
            </Badge>
          </div>
        </div>

        {/* Overall Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Phase 1: Evaluation</CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {enhancementStatus?.enhancementStatus.phase1.metrics.totalEvaluations.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Total Evaluations</p>
              <Badge variant={getStatusBadgeVariant(enhancementStatus?.enhancementStatus.phase1.status || '')} className="mt-2">
                {enhancementStatus?.enhancementStatus.phase1.status}
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Phase 2: Fault Tolerance</CardTitle>
              <Shield className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {((enhancementStatus?.enhancementStatus.phase2.metrics.systemReliability || 0) * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">System Reliability</p>
              <Badge variant={getStatusBadgeVariant(enhancementStatus?.enhancementStatus.phase2.status || '')} className="mt-2">
                {enhancementStatus?.enhancementStatus.phase2.status}
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Phase 3: Neural Learning</CardTitle>
              <Brain className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {enhancementStatus?.enhancementStatus.phase3.metrics.totalPatterns.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Learned Patterns</p>
              <Badge variant={getStatusBadgeVariant(enhancementStatus?.enhancementStatus.phase3.status || '')} className="mt-2">
                {enhancementStatus?.enhancementStatus.phase3.status}
              </Badge>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Phase 4: Universal APIs</CardTitle>
              <Cog className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {((enhancementStatus?.enhancementStatus.phase4.metrics.successRate || 0) * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">Success Rate</p>
              <Badge variant={getStatusBadgeVariant(enhancementStatus?.enhancementStatus.phase4.status || '')} className="mt-2">
                {enhancementStatus?.enhancementStatus.phase4.status}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Monitoring Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="phase1">Phase 1</TabsTrigger>
            <TabsTrigger value="phase2">Phase 2</TabsTrigger>
            <TabsTrigger value="phase3">Phase 3</TabsTrigger>
            <TabsTrigger value="phase4">Phase 4</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* System Health Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    System Health Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Overall Status</span>
                      <Badge variant={getStatusBadgeVariant(healthStatus?.healthStatus.overall || '')}>
                        {healthStatus?.healthStatus.overall}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Response Time</span>
                      <span className="text-sm font-medium">{healthStatus?.healthStatus.performance.responseTime}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Success Rate</span>
                      <span className="text-sm font-medium">{healthStatus?.healthStatus.performance.successRate}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">System Load</span>
                      <span className="text-sm font-medium">{healthStatus?.healthStatus.performance.systemLoad}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Reliability</span>
                      <span className="text-sm font-medium">{healthStatus?.healthStatus.performance.reliability}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Enhancement Impact */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    Enhancement Impact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Platform Improvement</span>
                      <Badge variant="default">
                        {enhancementStatus?.enhancementStatus.overallEnhancement.platformImprovement}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Enterprise Readiness</span>
                      <Badge variant="default">
                        {enhancementStatus?.enhancementStatus.overallEnhancement.enterpriseReadiness}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Competitive Advantage</span>
                      <Badge variant="default">
                        {enhancementStatus?.enhancementStatus.overallEnhancement.competitiveAdvantage}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="phase1" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  Phase 1: Automated Evaluation System
                </CardTitle>
                <CardDescription>
                  Real-time response quality assessment and monitoring dashboards for enterprise trust
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {enhancementStatus?.enhancementStatus.phase1.metrics.totalEvaluations.toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Evaluations</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {((enhancementStatus?.enhancementStatus.phase1.metrics.averageQuality || 0) * 100).toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Average Quality</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {enhancementStatus?.enhancementStatus.phase1.metrics.activeExperiments}
                    </div>
                    <p className="text-sm text-muted-foreground">Active Experiments</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Quality Score Progress</span>
                    <span>{((enhancementStatus?.enhancementStatus.phase1.metrics.averageQuality || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={(enhancementStatus?.enhancementStatus.phase1.metrics.averageQuality || 0) * 100} className="w-full" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="phase2" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  Phase 2: Byzantine Fault Tolerance
                </CardTitle>
                <CardDescription>
                  Agent failure recovery and consensus mechanisms for mission-critical reliability
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {enhancementStatus?.enhancementStatus.phase2.metrics.totalAgents}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Agents</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {((enhancementStatus?.enhancementStatus.phase2.metrics.systemReliability || 0) * 100).toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">System Reliability</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">
                      {enhancementStatus?.enhancementStatus.phase2.metrics.byzantineTolerance}
                    </div>
                    <p className="text-sm text-muted-foreground">Byzantine Tolerance</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>System Reliability</span>
                    <span>{((enhancementStatus?.enhancementStatus.phase2.metrics.systemReliability || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={(enhancementStatus?.enhancementStatus.phase2.metrics.systemReliability || 0) * 100} className="w-full" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="phase3" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  Phase 3: Neural Pattern Learning
                </CardTitle>
                <CardDescription>
                  Pattern recognition and adaptive coordination for competitive advantage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {enhancementStatus?.enhancementStatus.phase3.metrics.totalPatterns.toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground">Learned Patterns</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {((enhancementStatus?.enhancementStatus.phase3.metrics.adaptationEfficiency || 0) * 100).toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Adaptation Efficiency</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {((enhancementStatus?.enhancementStatus.phase3.metrics.learningRate || 0) * 100).toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Learning Rate</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Learning Efficiency</span>
                    <span>{((enhancementStatus?.enhancementStatus.phase3.metrics.adaptationEfficiency || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={(enhancementStatus?.enhancementStatus.phase3.metrics.adaptationEfficiency || 0) * 100} className="w-full" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="phase4" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cog className="h-5 w-5 text-orange-500" />
                  Phase 4: Universal Function Calling
                </CardTitle>
                <CardDescription>
                  Standardized interface for all LLM providers with better developer experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">
                      {enhancementStatus?.enhancementStatus.phase4.metrics.totalCalls.toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Function Calls</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {((enhancementStatus?.enhancementStatus.phase4.metrics.successRate || 0) * 100).toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {enhancementStatus?.enhancementStatus.phase4.metrics.averageResponseTime}ms
                    </div>
                    <p className="text-sm text-muted-foreground">Avg Response Time</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Function Call Success Rate</span>
                    <span>{((enhancementStatus?.enhancementStatus.phase4.metrics.successRate || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={(enhancementStatus?.enhancementStatus.phase4.metrics.successRate || 0) * 100} className="w-full" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}