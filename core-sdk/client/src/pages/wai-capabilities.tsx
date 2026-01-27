/**
 * WAI Orchestration Layer Capabilities - Complete Agent Overview
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Users, 
  Code, 
  Database, 
  Shield, 
  Zap,
  Settings,
  TrendingUp,
  Globe,
  Cpu,
  Network,
  BarChart3,
  Layers,
  GitBranch,
  TestTube,
  Palette,
  FileText,
  Cloud,
  MessageSquare,
  ArrowRight,
  CheckCircle,
  Clock,
  Target
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Agent {
  id: string;
  name: string;
  type: 'executive' | 'technical' | 'creative' | 'operations' | 'specialized';
  role: string;
  description: string;
  capabilities: string[];
  icon: any;
  color: string;
  status: 'active' | 'idle' | 'busy';
  efficiency: number;
  tasksCompleted: number;
}

interface LLMProvider {
  name: string;
  models: string[];
  status: 'healthy' | 'degraded' | 'offline';
  cost: string;
  strength: string;
  icon: string;
}

export default function WAICapabilities() {
  const [activeTab, setActiveTab] = useState('overview');

  // 39 Specialized Agents
  const agents: Agent[] = [
    // Executive Leadership (4 agents)
    {
      id: 'cto',
      name: 'Alex CTO',
      type: 'executive',
      role: 'Chief Technology Officer',
      description: 'Strategic technology leadership and architecture decisions',
      capabilities: ['Technical Leadership', 'Architecture Decisions', 'Technology Evaluation', 'Team Coordination', 'Risk Assessment'],
      icon: Brain,
      color: 'bg-purple-500',
      status: 'active',
      efficiency: 95,
      tasksCompleted: 247
    },
    {
      id: 'cpo',
      name: 'Sarah CPO',
      type: 'executive',
      role: 'Chief Product Officer',
      description: 'Product strategy and user experience optimization',
      capabilities: ['Product Strategy', 'User Requirements', 'Roadmap Planning', 'Market Analysis', 'Feature Prioritization'],
      icon: Target,
      color: 'bg-blue-500',
      status: 'active',
      efficiency: 92,
      tasksCompleted: 189
    },
    {
      id: 'cmo',
      name: 'Mike CMO',
      type: 'executive',
      role: 'Chief Marketing Officer',
      description: 'Marketing strategy and brand positioning',
      capabilities: ['Marketing Strategy', 'Go-to-Market', 'Brand Positioning', 'Content Strategy', 'Campaign Management'],
      icon: TrendingUp,
      color: 'bg-green-500',
      status: 'idle',
      efficiency: 88,
      tasksCompleted: 156
    },
    {
      id: 'bmad-orchestrator',
      name: 'BMAD Orchestrator',
      type: 'executive',
      role: 'Business-Marketing-Architecture-Development Coordinator',
      description: 'Central coordinator for all BMAD methodology workflows',
      capabilities: ['Project Coordination', 'Agent Management', 'Workflow Optimization', 'Resource Allocation', 'Quality Control'],
      icon: Network,
      color: 'bg-indigo-500',
      status: 'active',
      efficiency: 98,
      tasksCompleted: 412
    },

    // Architecture & System Design (5 agents)
    {
      id: 'system-architect',
      name: 'Emma System Architect',
      type: 'technical',
      role: 'System Architecture Designer',
      description: 'Overall system design and technical architecture',
      capabilities: ['System Design', 'Technology Selection', 'Scalability Planning', 'Integration Architecture', 'Performance Optimization'],
      icon: Layers,
      color: 'bg-orange-500',
      status: 'busy',
      efficiency: 94,
      tasksCompleted: 178
    },
    {
      id: 'data-architect',
      name: 'Tom Data Architect',
      type: 'technical',
      role: 'Data Architecture Specialist',
      description: 'Database design and data flow optimization',
      capabilities: ['Data Modeling', 'Database Design', 'ETL Processes', 'Data Security', 'Analytics Architecture'],
      icon: Database,
      color: 'bg-cyan-500',
      status: 'active',
      efficiency: 91,
      tasksCompleted: 145
    },
    {
      id: 'security-architect',
      name: 'Lisa Security Architect',
      type: 'technical',
      role: 'Security Architecture Expert',
      description: 'Security design and compliance architecture',
      capabilities: ['Security Design', 'Threat Modeling', 'Compliance Architecture', 'Identity Management', 'Encryption Strategy'],
      icon: Shield,
      color: 'bg-red-500',
      status: 'active',
      efficiency: 96,
      tasksCompleted: 134
    },
    {
      id: 'data-engineer',
      name: 'Alex Data Engineer',
      type: 'technical',
      role: 'Data Pipeline Engineer',
      description: 'Data processing and pipeline implementation',
      capabilities: ['Data Pipelines', 'ETL Development', 'Stream Processing', 'Data Quality', 'Monitoring'],
      icon: GitBranch,
      color: 'bg-teal-500',
      status: 'idle',
      efficiency: 89,
      tasksCompleted: 98
    },
    {
      id: 'cloud-architect',
      name: 'Maya Cloud Architect',
      type: 'technical',
      role: 'Cloud Infrastructure Designer',
      description: 'Cloud architecture and infrastructure design',
      capabilities: ['Cloud Design', 'Infrastructure as Code', 'Multi-Cloud Strategy', 'Cost Optimization', 'Disaster Recovery'],
      icon: Cloud,
      color: 'bg-sky-500',
      status: 'active',
      efficiency: 93,
      tasksCompleted: 167
    },

    // Development Agents (12 agents)
    {
      id: 'frontend-dev',
      name: 'Jordan Frontend',
      type: 'technical',
      role: 'Frontend Developer',
      description: 'React, Vue, Angular frontend development',
      capabilities: ['React Development', 'UI Implementation', 'Responsive Design', 'State Management', 'Performance Optimization'],
      icon: Code,
      color: 'bg-blue-600',
      status: 'busy',
      efficiency: 92,
      tasksCompleted: 245
    },
    {
      id: 'backend-dev',
      name: 'Sam Backend',
      type: 'technical',
      role: 'Backend Developer',
      description: 'Node.js, Python, Java backend development',
      capabilities: ['API Development', 'Server Architecture', 'Database Integration', 'Authentication', 'Caching'],
      icon: Code,
      color: 'bg-green-600',
      status: 'active',
      efficiency: 90,
      tasksCompleted: 198
    },
    {
      id: 'fullstack-dev',
      name: 'Casey Fullstack',
      type: 'technical',
      role: 'Fullstack Developer',
      description: 'End-to-end application development',
      capabilities: ['Full Stack Development', 'System Integration', 'DevOps', 'Testing', 'Deployment'],
      icon: Layers,
      color: 'bg-purple-600',
      status: 'active',
      efficiency: 88,
      tasksCompleted: 156
    },
    {
      id: 'python-specialist',
      name: 'Riley Python Specialist',
      type: 'technical',
      role: 'Python Development Expert',
      description: 'Python backend and AI/ML development',
      capabilities: ['Python Development', 'Django/Flask', 'AI/ML Integration', 'Data Processing', 'Automation'],
      icon: Code,
      color: 'bg-yellow-600',
      status: 'busy',
      efficiency: 94,
      tasksCompleted: 189
    },
    {
      id: 'java-specialist',
      name: 'Quinn Java Specialist',
      type: 'technical',
      role: 'Java Enterprise Developer',
      description: 'Enterprise Java application development',
      capabilities: ['Java Development', 'Spring Framework', 'Microservices', 'Enterprise Patterns', 'Performance Tuning'],
      icon: Code,
      color: 'bg-orange-600',
      status: 'idle',
      efficiency: 87,
      tasksCompleted: 134
    },
    {
      id: 'nodejs-specialist',
      name: 'Taylor Node.js Specialist',
      type: 'technical',
      role: 'Node.js Backend Expert',
      description: 'Node.js and JavaScript backend development',
      capabilities: ['Node.js Development', 'Express.js', 'GraphQL', 'Real-time Applications', 'Microservices'],
      icon: Code,
      color: 'bg-green-500',
      status: 'active',
      efficiency: 91,
      tasksCompleted: 167
    },
    {
      id: 'flutter-dev',
      name: 'Morgan Flutter',
      type: 'technical',
      role: 'Flutter Mobile Developer',
      description: 'Cross-platform mobile app development',
      capabilities: ['Flutter Development', 'Cross-Platform Apps', 'Mobile UI/UX', 'App Store Deployment', 'Native Integration'],
      icon: Code,
      color: 'bg-blue-500',
      status: 'active',
      efficiency: 89,
      tasksCompleted: 123
    },
    {
      id: 'react-native-dev',
      name: 'Avery React Native',
      type: 'technical',
      role: 'React Native Developer',
      description: 'React Native mobile development',
      capabilities: ['React Native', 'Mobile Development', 'Native Modules', 'App Optimization', 'Cross-Platform UI'],
      icon: Code,
      color: 'bg-cyan-600',
      status: 'idle',
      efficiency: 86,
      tasksCompleted: 98
    },
    {
      id: 'mobile-coordinator',
      name: 'Jamie Mobile Coordinator',
      type: 'technical',
      role: 'Mobile Development Coordinator',
      description: 'Mobile strategy and cross-platform coordination',
      capabilities: ['Mobile Strategy', 'Platform Coordination', 'App Architecture', 'Performance Monitoring', 'Release Management'],
      icon: Code,
      color: 'bg-indigo-600',
      status: 'active',
      efficiency: 93,
      tasksCompleted: 145
    },
    {
      id: 'sql-specialist',
      name: 'River SQL Specialist',
      type: 'technical',
      role: 'SQL Database Expert',
      description: 'SQL database design and optimization',
      capabilities: ['SQL Development', 'Query Optimization', 'Database Design', 'Performance Tuning', 'Data Migration'],
      icon: Database,
      color: 'bg-purple-500',
      status: 'busy',
      efficiency: 95,
      tasksCompleted: 178
    },
    {
      id: 'mongodb-specialist',
      name: 'Sage MongoDB Specialist',
      type: 'technical',
      role: 'NoSQL Database Expert',
      description: 'MongoDB and NoSQL database development',
      capabilities: ['MongoDB Development', 'NoSQL Design', 'Document Modeling', 'Aggregation Pipelines', 'Sharding'],
      icon: Database,
      color: 'bg-green-700',
      status: 'active',
      efficiency: 88,
      tasksCompleted: 112
    },
    {
      id: 'database-dev',
      name: 'Phoenix Database Developer',
      type: 'technical',
      role: 'Database Development Specialist',
      description: 'General database development and integration',
      capabilities: ['Database Development', 'Schema Design', 'Data Integration', 'Migration Scripts', 'Backup Strategies'],
      icon: Database,
      color: 'bg-teal-600',
      status: 'active',
      efficiency: 90,
      tasksCompleted: 156
    },

    // AI/Data Specialists (4 agents)
    {
      id: 'ai-ml-agent',
      name: 'Harper AI/ML Agent',
      type: 'specialized',
      role: 'AI/ML Integration Specialist',
      description: 'AI and machine learning integration',
      capabilities: ['AI/ML Integration', 'Model Training', 'Data Science', 'Natural Language Processing', 'Computer Vision'],
      icon: Brain,
      color: 'bg-pink-500',
      status: 'busy',
      efficiency: 97,
      tasksCompleted: 89
    },
    {
      id: 'ai-ml-engineer',
      name: 'Rowan AI/ML Engineer',
      type: 'specialized',
      role: 'AI/ML Engineering Expert',
      description: 'Production AI/ML systems and MLOps',
      capabilities: ['MLOps', 'Model Deployment', 'AI Infrastructure', 'Model Monitoring', 'A/B Testing'],
      icon: Cpu,
      color: 'bg-purple-700',
      status: 'active',
      efficiency: 94,
      tasksCompleted: 67
    },
    {
      id: 'data-scientist',
      name: 'Eden Data Scientist',
      type: 'specialized',
      role: 'Data Science Specialist',
      description: 'Data analysis and predictive modeling',
      capabilities: ['Data Analysis', 'Statistical Modeling', 'Predictive Analytics', 'Data Visualization', 'Research'],
      icon: BarChart3,
      color: 'bg-blue-700',
      status: 'active',
      efficiency: 92,
      tasksCompleted: 78
    },
    {
      id: 'mlops-engineer',
      name: 'Sage MLOps Engineer',
      type: 'specialized',
      role: 'MLOps Engineering Specialist',
      description: 'Machine learning operations and automation',
      capabilities: ['MLOps Pipelines', 'Model Versioning', 'Automated Training', 'Model Serving', 'Monitoring'],
      icon: GitBranch,
      color: 'bg-indigo-700',
      status: 'idle',
      efficiency: 89,
      tasksCompleted: 45
    },

    // Quality & Operations (5 agents)
    {
      id: 'qa-specialist',
      name: 'Charlie QA',
      type: 'operations',
      role: 'Quality Assurance Specialist',
      description: 'Testing strategy and quality assurance',
      capabilities: ['Testing Strategy', 'Automated Testing', 'Quality Assurance', 'Bug Tracking', 'Test Coverage'],
      icon: TestTube,
      color: 'bg-red-600',
      status: 'active',
      efficiency: 93,
      tasksCompleted: 234
    },
    {
      id: 'devops-engineer',
      name: 'Blake DevOps',
      type: 'operations',
      role: 'DevOps Engineer',
      description: 'CI/CD and infrastructure automation',
      capabilities: ['CI/CD Pipelines', 'Infrastructure Automation', 'Container Orchestration', 'Monitoring', 'Scaling'],
      icon: Settings,
      color: 'bg-orange-700',
      status: 'busy',
      efficiency: 95,
      tasksCompleted: 189
    },
    {
      id: 'security-specialist',
      name: 'Kai Security',
      type: 'operations',
      role: 'Security Specialist',
      description: 'Application security and compliance',
      capabilities: ['Security Auditing', 'Vulnerability Assessment', 'Compliance', 'Penetration Testing', 'Security Monitoring'],
      icon: Shield,
      color: 'bg-red-700',
      status: 'active',
      efficiency: 96,
      tasksCompleted: 145
    },
    {
      id: 'performance-engineer',
      name: 'Drew Performance',
      type: 'operations',
      role: 'Performance Engineer',
      description: 'Performance optimization and monitoring',
      capabilities: ['Performance Optimization', 'Load Testing', 'Monitoring', 'Capacity Planning', 'Bottleneck Analysis'],
      icon: Zap,
      color: 'bg-yellow-700',
      status: 'active',
      efficiency: 91,
      tasksCompleted: 123
    },
    {
      id: 'infrastructure-expert',
      name: 'Remy Infrastructure',
      type: 'operations',
      role: 'Infrastructure Expert',
      description: 'Infrastructure design and management',
      capabilities: ['Infrastructure Design', 'Cloud Management', 'Networking', 'Scalability', 'Disaster Recovery'],
      icon: Cloud,
      color: 'bg-gray-600',
      status: 'idle',
      efficiency: 88,
      tasksCompleted: 98
    },

    // Creative & Content (4 agents)
    {
      id: 'ui-ux-designer',
      name: 'Finley UI/UX',
      type: 'creative',
      role: 'UI/UX Designer',
      description: 'User interface and experience design',
      capabilities: ['UI Design', 'UX Research', 'Prototyping', 'Design Systems', 'User Testing'],
      icon: Palette,
      color: 'bg-pink-600',
      status: 'busy',
      efficiency: 94,
      tasksCompleted: 167
    },
    {
      id: 'art-director',
      name: 'Jules Art Director',
      type: 'creative',
      role: 'Creative Art Director',
      description: 'Visual design and brand consistency',
      capabilities: ['Visual Design', 'Brand Strategy', 'Creative Direction', 'Asset Creation', 'Style Guides'],
      icon: Palette,
      color: 'bg-purple-800',
      status: 'active',
      efficiency: 90,
      tasksCompleted: 134
    },
    {
      id: 'content-specialist',
      name: 'Cameron Content',
      type: 'creative',
      role: 'Content Specialist',
      description: 'Content strategy and copywriting',
      capabilities: ['Content Strategy', 'Copywriting', 'SEO Optimization', 'Content Planning', 'Brand Voice'],
      icon: FileText,
      color: 'bg-green-800',
      status: 'active',
      efficiency: 87,
      tasksCompleted: 189
    },
    {
      id: 'video-producer',
      name: 'Skyler Video Producer',
      type: 'creative',
      role: 'Video Production Specialist',
      description: 'Video content creation and editing',
      capabilities: ['Video Production', 'Motion Graphics', 'Video Editing', 'Animation', 'Multimedia Content'],
      icon: FileText,
      color: 'bg-red-800',
      status: 'idle',
      efficiency: 85,
      tasksCompleted: 67
    },

    // Specialized Integration (5 agents)
    {
      id: 'api-integration',
      name: 'River API Integration',
      type: 'specialized',
      role: 'API Integration Specialist',
      description: 'Third-party API integration and management',
      capabilities: ['API Integration', 'Webhook Management', 'Rate Limiting', 'API Security', 'Documentation'],
      icon: Network,
      color: 'bg-cyan-700',
      status: 'active',
      efficiency: 89,
      tasksCompleted: 145
    },
    {
      id: 'analytics-specialist',
      name: 'Sage Analytics',
      type: 'specialized',
      role: 'Analytics Specialist',
      description: 'Analytics implementation and insights',
      capabilities: ['Analytics Implementation', 'Data Tracking', 'Reporting', 'Business Intelligence', 'KPI Monitoring'],
      icon: BarChart3,
      color: 'bg-blue-800',
      status: 'busy',
      efficiency: 92,
      tasksCompleted: 112
    },
    {
      id: 'documentation-specialist',
      name: 'Casey Documentation',
      type: 'specialized',
      role: 'Documentation Specialist',
      description: 'Technical documentation and knowledge management',
      capabilities: ['Technical Writing', 'API Documentation', 'User Guides', 'Knowledge Management', 'Tutorial Creation'],
      icon: FileText,
      color: 'bg-gray-700',
      status: 'active',
      efficiency: 88,
      tasksCompleted: 234
    },
    {
      id: 'marketing-expert',
      name: 'Peyton Marketing',
      type: 'specialized',
      role: 'Marketing Technology Expert',
      description: 'Marketing automation and growth hacking',
      capabilities: ['Marketing Automation', 'Growth Hacking', 'A/B Testing', 'Conversion Optimization', 'Campaign Analytics'],
      icon: TrendingUp,
      color: 'bg-green-900',
      status: 'active',
      efficiency: 86,
      tasksCompleted: 78
    }
  ];

  // 11 LLM Providers
  const llmProviders: LLMProvider[] = [
    {
      name: 'OpenAI',
      models: ['GPT-4o', 'GPT-4o-mini', 'GPT-3.5-turbo'],
      status: 'healthy',
      cost: 'Premium',
      strength: 'General intelligence, coding',
      icon: '🤖'
    },
    {
      name: 'Anthropic',
      models: ['Claude Sonnet 4.0', 'Claude 3.7 Sonnet', 'Claude 3.5 Sonnet'],
      status: 'healthy',
      cost: 'High',
      strength: 'Reasoning, safety, analysis',
      icon: '🧠'
    },
    {
      name: 'Google Gemini',
      models: ['Gemini 2.5 Flash', 'Gemini 2.5 Pro', 'Gemini 1.5 Pro'],
      status: 'healthy',
      cost: 'Medium',
      strength: 'Multimodal, search integration',
      icon: '🔍'
    },
    {
      name: 'X.AI (Grok)',
      models: ['Grok-2 Vision', 'Grok-2', 'Grok Vision Beta', 'Grok Beta'],
      status: 'healthy',
      cost: 'Medium',
      strength: 'Real-time data, creativity',
      icon: '⚡'
    },
    {
      name: 'Perplexity',
      models: ['LLaMA 3.1 Sonar Small/Large/Huge'],
      status: 'healthy',
      cost: 'Low',
      strength: 'Real-time search, research',
      icon: '🔬'
    },
    {
      name: 'Groq',
      models: ['Mixtral 8x7B', 'LLaMA 3.1 70B', 'LLaMA 3.1 8B'],
      status: 'healthy',
      cost: 'Very Low',
      strength: 'Ultra-fast inference',
      icon: '⚡'
    },
    {
      name: 'Alibaba Qwen',
      models: ['Qwen 2.5 72B Turbo', 'Qwen 2.5 32B', 'Qwen Max'],
      status: 'healthy',
      cost: 'Low',
      strength: 'Multilingual, cost-effective',
      icon: '🌏'
    },
    {
      name: 'Together AI',
      models: ['Meta LLaMA 3.3 70B', 'Meta LLaMA 3.1 405B'],
      status: 'healthy',
      cost: 'Low',
      strength: 'Open-source models, scaling',
      icon: '🤝'
    },
    {
      name: 'Manus AI',
      models: ['Creative V2', 'Design V1', 'UI Specialist'],
      status: 'healthy',
      cost: 'Medium',
      strength: 'Creative design, UI generation',
      icon: '🎨'
    },
    {
      name: 'DeepSeek',
      models: ['DeepSeek Chat', 'DeepSeek Coder'],
      status: 'healthy',
      cost: 'Very Low',
      strength: 'Code generation, reasoning',
      icon: '💻'
    },
    {
      name: 'Ollama (Local)',
      models: ['LLaMA 3.2', 'CodeLLaMA', 'Mistral'],
      status: 'healthy',
      cost: 'Free',
      strength: 'Privacy, local processing',
      icon: '🏠'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'busy': return 'bg-orange-500';
      case 'idle': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getProviderStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'offline': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            WAI Orchestration Layer
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-6">
            39 Specialized AI Agents • 11 LLM Providers • Intelligent Cost Optimization
          </p>
          
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
              <div className="text-2xl font-bold text-blue-600">39</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Specialized Agents</div>
            </div>
            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
              <div className="text-2xl font-bold text-green-600">11</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">LLM Providers</div>
            </div>
            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
              <div className="text-2xl font-bold text-purple-600">98%</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">System Uptime</div>
            </div>
            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
              <div className="text-2xl font-bold text-orange-600">$0.004</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Avg Cost per Request</div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex justify-center">
            <TabsList className="grid w-full max-w-3xl grid-cols-4">
              <TabsTrigger value="overview">System Overview</TabsTrigger>
              <TabsTrigger value="agents">All Agents (39)</TabsTrigger>
              <TabsTrigger value="providers">LLM Providers (11)</TabsTrigger>
              <TabsTrigger value="capabilities">Core Capabilities</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Agent Categories */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Agent Categories & Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { type: 'executive', count: 4, color: 'bg-purple-500', label: 'Executive Leadership' },
                      { type: 'technical', count: 17, color: 'bg-blue-500', label: 'Technical Development' },
                      { type: 'operations', count: 5, color: 'bg-orange-500', label: 'Quality & Operations' },
                      { type: 'creative', count: 4, color: 'bg-pink-500', label: 'Creative & Design' },
                      { type: 'specialized', count: 9, color: 'bg-green-500', label: 'Specialized Services' }
                    ].map((category) => (
                      <div key={category.type} className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <div className={`w-12 h-12 ${category.color} rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-2`}>
                          {category.count}
                        </div>
                        <h4 className="font-medium text-sm">{category.label}</h4>
                        <p className="text-xs text-slate-500">{category.count} agents</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* System Health */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="h-5 w-5 mr-2" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Overall Health</span>
                      <span className="text-sm font-medium">98%</span>
                    </div>
                    <Progress value={98} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Active Agents</span>
                      <span className="text-sm font-medium">32/39</span>
                    </div>
                    <Progress value={82} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Provider Health</span>
                      <span className="text-sm font-medium">100%</span>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Cost Efficiency</span>
                      <span className="text-sm font-medium">94%</span>
                    </div>
                    <Progress value={94} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* BMAD Methodology */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Network className="h-5 w-5 mr-2" />
                  BMAD Orchestration Methodology
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    {
                      phase: 'Business',
                      description: 'Requirements analysis, market research, and business strategy',
                      agents: ['CTO', 'CPO', 'CMO', 'Business Analyst'],
                      color: 'bg-blue-500'
                    },
                    {
                      phase: 'Marketing',
                      description: 'Go-to-market strategy, brand positioning, and content creation',
                      agents: ['CMO', 'Marketing Expert', 'Content Specialist', 'Art Director'],
                      color: 'bg-green-500'
                    },
                    {
                      phase: 'Architecture',
                      description: 'System design, technology selection, and infrastructure planning',
                      agents: ['System Architect', 'Data Architect', 'Security Architect', 'Cloud Architect'],
                      color: 'bg-purple-500'
                    },
                    {
                      phase: 'Development',
                      description: 'Implementation, testing, deployment, and optimization',
                      agents: ['Frontend Dev', 'Backend Dev', 'QA Specialist', 'DevOps Engineer'],
                      color: 'bg-orange-500'
                    }
                  ].map((phase, index) => (
                    <div key={phase.phase} className="relative">
                      <div className={`${phase.color} text-white p-4 rounded-lg`}>
                        <h3 className="font-bold text-lg mb-2">{phase.phase}</h3>
                        <p className="text-sm mb-3 text-white/90">{phase.description}</p>
                        <div className="space-y-1">
                          {phase.agents.map((agent) => (
                            <div key={agent} className="text-xs bg-white/20 px-2 py-1 rounded">
                              {agent}
                            </div>
                          ))}
                        </div>
                      </div>
                      {index < 3 && (
                        <ArrowRight className="absolute top-1/2 -right-3 transform -translate-y-1/2 text-slate-400 hidden md:block" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agents" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: agents.indexOf(agent) * 0.02 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 ${agent.color} text-white rounded-lg`}>
                            <agent.icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm">{agent.name}</h3>
                            <p className="text-xs text-slate-500">{agent.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`}></div>
                          <Badge variant="outline" className="text-xs">
                            {agent.type}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-xs text-slate-600 dark:text-slate-400">{agent.description}</p>
                      
                      <div>
                        <h4 className="text-xs font-medium mb-2">Core Capabilities</h4>
                        <div className="flex flex-wrap gap-1">
                          {agent.capabilities.slice(0, 3).map((capability) => (
                            <Badge key={capability} variant="secondary" className="text-xs">
                              {capability}
                            </Badge>
                          ))}
                          {agent.capabilities.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{agent.capabilities.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">{agent.efficiency}%</div>
                          <div className="text-xs text-slate-500">Efficiency</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">{agent.tasksCompleted}</div>
                          <div className="text-xs text-slate-500">Tasks Done</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="providers" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {llmProviders.map((provider, index) => (
                <motion.div
                  key={provider.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{provider.icon}</span>
                          <div>
                            <h3 className="font-semibold">{provider.name}</h3>
                            <Badge className={getProviderStatusColor(provider.status)}>
                              {provider.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Available Models</h4>
                        <div className="space-y-1">
                          {provider.models.map((model) => (
                            <div key={model} className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                              {model}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t text-center">
                        <div>
                          <div className="text-sm font-medium">{provider.cost}</div>
                          <div className="text-xs text-slate-500">Cost Tier</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-green-600">
                            <CheckCircle className="h-3 w-3 inline mr-1" />
                            Active
                          </div>
                          <div className="text-xs text-slate-500">Status</div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-medium mb-1">Strength</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{provider.strength}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="capabilities" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Core Orchestration Features */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Brain className="h-5 w-5 mr-2" />
                    Intelligent Orchestration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    {[
                      'Automatic provider selection based on cost and quality',
                      'Real-time agent workload balancing',
                      'Intelligent request routing and optimization',
                      'Adaptive model selection for specific tasks',
                      'Fallback chains for high availability'
                    ].map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-slate-600 dark:text-slate-400">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Cost Optimization */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Cost Optimization
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    {[
                      'Real-time cost tracking across all providers',
                      'Budget constraints with automatic alerts',
                      'Quality vs cost optimization algorithms',
                      'Usage analytics and savings recommendations',
                      'Automated cost-effective provider routing'
                    ].map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-slate-600 dark:text-slate-400">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Health Monitoring */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Zap className="h-5 w-5 mr-2" />
                    Health Monitoring
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    {[
                      'Continuous provider health checking',
                      'Agent performance monitoring',
                      'System uptime and availability tracking',
                      'Automatic degradation detection',
                      'Proactive issue resolution'
                    ].map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-slate-600 dark:text-slate-400">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Agent Coordination */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Users className="h-5 w-5 mr-2" />
                    Agent Coordination
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    {[
                      'BMAD methodology orchestration',
                      'Multi-agent collaboration workflows',
                      'Task assignment and load balancing',
                      'Real-time communication between agents',
                      'Hierarchical and consensus execution patterns'
                    ].map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-slate-600 dark:text-slate-400">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Integration Capabilities */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Network className="h-5 w-5 mr-2" />
                    Platform Integration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    {[
                      'CrewAI integration for team workflows',
                      'React Bits UI component generation',
                      'Simstudio and Stitch platform integration',
                      'RAG system with knowledge base management',
                      'Voice and multilingual capabilities'
                    ].map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-slate-600 dark:text-slate-400">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Analytics & Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Analytics & Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    {[
                      'Comprehensive performance analytics',
                      'Request/response tracking and analysis',
                      'Agent efficiency and productivity metrics',
                      'Cost analysis and optimization insights',
                      'Real-time dashboard and reporting'
                    ].map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-slate-600 dark:text-slate-400">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Back to Dashboard */}
        <div className="text-center mt-8">
          <Button onClick={() => window.location.href = '/'} variant="outline" size="lg">
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}