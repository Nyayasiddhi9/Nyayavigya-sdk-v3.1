/**
 * WAI vs Toolhouse.ai Platform Comparison
 * Comprehensive feature comparison and capabilities overview
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatedCard } from '@/components/react-bits/AnimatedCard';
import { TypingAnimation } from '@/components/react-bits/TypingAnimation';
import { GradientButton } from '@/components/react-bits/GradientButton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Star, Zap, Shield, Database, Bot, Search, Brain } from 'lucide-react';

interface ComparisonData {
  platformComparison: Record<string, { wai: string; toolhouse: string }>;
  waiAdvantages: string[];
}

export default function PlatformComparison() {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: comparisonData, isLoading } = useQuery({
    queryKey: ['/api/agents/comparison'],
    enabled: true
  });

  const { data: platformStats } = useQuery({
    queryKey: ['/api/platform/stats'],
    enabled: true
  });

  const features = [
    {
      icon: <Bot className="w-6 h-6" />,
      title: 'Agent Creation',
      wai: '39 System Agents + Unlimited Customer Agents',
      toolhouse: 'Custom agents with natural language definition',
      waiAdvantage: true
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: 'RAG Integration',
      wai: 'Enhanced RAG with OCR, hybrid search, cross-encoder reranking',
      toolhouse: 'Basic RAG with document ingestion',
      waiAdvantage: true
    },
    {
      icon: <Search className="w-6 h-6" />,
      title: 'Web Search',
      wai: 'Multi-source search with trend analysis and fact-checking',
      toolhouse: 'Web search capabilities',
      waiAdvantage: true
    },
    {
      icon: <Database className="w-6 h-6" />,
      title: 'Database Connectivity',
      wai: 'Universal database connectivity (PostgreSQL, MySQL, MongoDB, etc.)',
      toolhouse: 'Database connectivity',
      waiAdvantage: true
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Memory Management',
      wai: 'Advanced conversation memory with context management',
      toolhouse: 'Stateful conversation memory',
      waiAdvantage: true
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Deployment',
      wai: 'Multi-channel deployment with embed codes and webhooks',
      toolhouse: 'API deployment with single command',
      waiAdvantage: true
    }
  ];

  const waiAdvantages = [
    '39 specialized system agents with global standard prompts',
    'Advanced OCR with multi-engine processing',
    'Hybrid search algorithms with diversity filtering',
    'Immersive technology integration (VR/AR)',
    'Advanced analytics and business intelligence',
    'Complete SDLC automation workflows',
    'Enterprise-grade security and compliance',
    'Multi-provider LLM support (11 providers)',
    'Real-time collaboration and monitoring'
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading platform comparison...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <AnimatedCard className="text-center mb-12" glassmorphism={false}>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-white" />
            </div>
            <TypingAnimation 
              text="WAI DevStudio 3.0 vs Toolhouse.ai"
              className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
              speed={50}
            />
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Comprehensive comparison of enterprise AI orchestration platforms. 
            See how WAI DevStudio 3.0 surpasses Toolhouse.ai with advanced features and capabilities.
          </p>
        </AnimatedCard>

        {/* Platform Stats */}
        {platformStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <AnimatedCard delay={0.1}>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {platformStats.agents?.systemAgents || 39}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">System Agents</div>
              </div>
            </AnimatedCard>
            <AnimatedCard delay={0.2}>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {platformStats.mcp?.connections || 11}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">LLM Providers</div>
              </div>
            </AnimatedCard>
            <AnimatedCard delay={0.3}>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  ∞
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Customer Agents</div>
              </div>
            </AnimatedCard>
            <AnimatedCard delay={0.4}>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  100%
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Feature Parity+</div>
              </div>
            </AnimatedCard>
          </div>
        )}

        {/* Feature Comparison Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="features">Feature Comparison</TabsTrigger>
            <TabsTrigger value="advantages">WAI Advantages</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* WAI DevStudio */}
              <AnimatedCard className="border-2 border-blue-500/20">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Bot className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">WAI DevStudio 3.0</h3>
                  <p className="text-gray-600 dark:text-gray-400">Enterprise AI Orchestration Platform</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm">39 Specialized System Agents</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm">Enhanced RAG with OCR</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm">11 LLM Providers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm">SDLC Automation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm">Immersive Technology</span>
                  </div>
                </div>

                <GradientButton 
                  variant="primary" 
                  className="w-full mt-6"
                  onClick={() => setActiveTab('advantages')}
                >
                  View Advantages
                </GradientButton>
              </AnimatedCard>

              {/* Toolhouse.ai */}
              <AnimatedCard className="border-2 border-gray-300/20">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-gray-500 to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Bot className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-600 dark:text-gray-400">Toolhouse.ai</h3>
                  <p className="text-gray-500 dark:text-gray-500">AI Agent Development Platform</p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm">Custom Agent Creation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm">Basic RAG Integration</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm">Web Search</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm">API Deployment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm">MCP Server</span>
                  </div>
                </div>

                <GradientButton 
                  variant="secondary" 
                  className="w-full mt-6"
                  onClick={() => setActiveTab('features')}
                >
                  Compare Features
                </GradientButton>
              </AnimatedCard>
            </div>
          </TabsContent>

          <TabsContent value="features" className="space-y-6">
            <div className="grid gap-6">
              {features.map((feature, index) => (
                <AnimatedCard key={feature.title} delay={index * 0.1}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        {feature.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{feature.title}</h3>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="default">WAI</Badge>
                        {feature.waiAdvantage && <Star className="w-4 h-4 text-yellow-500" />}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{feature.wai}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Badge variant="secondary">Toolhouse</Badge>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{feature.toolhouse}</p>
                    </div>
                  </div>
                </AnimatedCard>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="advantages" className="space-y-6">
            <AnimatedCard>
              <h3 className="text-2xl font-bold mb-6 text-center">Why WAI DevStudio 3.0 Leads the Market</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {waiAdvantages.map((advantage, index) => (
                  <AnimatedCard 
                    key={index} 
                    delay={index * 0.1}
                    className="border border-green-200 dark:border-green-800"
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                      <span className="text-sm">{advantage}</span>
                    </div>
                  </AnimatedCard>
                ))}
              </div>
            </AnimatedCard>

            <AnimatedCard className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
              <div className="text-center">
                <h4 className="text-xl font-bold mb-4">Ready to Experience the Difference?</h4>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  WAI DevStudio 3.0 offers everything Toolhouse.ai does, plus advanced features 
                  that make it the definitive choice for enterprise AI orchestration.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <GradientButton variant="primary" size="lg">
                    Start Free Trial
                  </GradientButton>
                  <GradientButton variant="secondary" size="lg">
                    Schedule Demo
                  </GradientButton>
                </div>
              </div>
            </AnimatedCard>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
