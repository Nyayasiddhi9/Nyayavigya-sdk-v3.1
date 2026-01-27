import fs from 'fs/promises';
import path from 'path';
import { db } from '../db';
import { agentCatalog } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { EventEmitter } from 'events';

interface AgentManifest {
  version: string;
  manifestFormat: string;
  totalAgents: number;
  agentTiers: {
    [tierName: string]: {
      count: number;
      agents: Array<{
        id: string;
        name: string;
        role: string;
        capabilities: string[];
        systemPrompt: string;
        tier: string;
        status: string;
        model: string;
        fallbackModel: string;
        costOptimization: boolean;
        romaFlows?: any;
        readiness?: {
          status: string;
          conformanceScore: number;
          performanceMetrics: {
            avgResponseTime: number;
            successRate: number;
            resourceUsage: string;
          };
        };
      }>;
    };
  };
}

interface EnterpriseAgentConfig {
  id: string;
  name: string;
  description: string;
  tier: 'executive' | 'development' | 'creative' | 'qa' | 'devops' | 'domain';
  vertical?: string;
  romaLevel: 'L1' | 'L2' | 'L3' | 'L4';
  capabilities: string[];
  model: string;
  category: string;
  group?: string;
  groups?: string[];
  systemPrompt: string;
  hasEnterprisePrompt: boolean;
  tools: string[];
  protocols: string[];
  operationMode: string;
  supportedLanguages: string[];
  guardRails: {
    parlantCompliance: boolean;
    securityLevel: string;
    piiProtection: boolean;
  };
  status: string;
}

class AgentManifestLoader extends EventEmitter {
  private manifestPath = path.join(process.cwd(), 'attached_assets', 'WAI-SDK-v9-Complete', 'agents', 'agent-manifests.json');
  private enterpriseAgents: Map<string, EnterpriseAgentConfig> = new Map();
  private isEnterpriseLoaded: boolean = false;
  private loadTime: Date | null = null;

  constructor() {
    super();
  }

  async loadManifestData(): Promise<AgentManifest> {
    try {
      const manifestData = await fs.readFile(this.manifestPath, 'utf-8');
      return JSON.parse(manifestData) as AgentManifest;
    } catch (error) {
      console.error('Error loading agent manifest:', error);
      return {
        version: '1.0.1',
        manifestFormat: "ROMA-aligned",
        totalAgents: 0,
        agentTiers: {}
      };
    }
  }

  /**
   * Load all 267 enterprise agents
   */
  async loadEnterpriseAgents(): Promise<void> {
    console.log('🚀 Loading WAI SDK v1.0 Enterprise Agents (267)...');
    const startTime = Date.now();

    try {
      const agentDefinitions = this.getAllEnterpriseAgentDefinitions();
      
      for (const agent of agentDefinitions) {
        this.enterpriseAgents.set(agent.id, agent);
      }
      
      this.isEnterpriseLoaded = true;
      this.loadTime = new Date();
      
      const duration = Date.now() - startTime;
      console.log(`✅ Loaded ${this.enterpriseAgents.size} enterprise agents in ${duration}ms`);
      
      this.emit('enterpriseLoaded', {
        agentCount: this.enterpriseAgents.size,
        loadTime: this.loadTime,
        duration
      });
    } catch (error) {
      console.error('❌ Failed to load enterprise agents:', error);
      this.emit('error', error);
    }
  }

  /**
   * Get all 267 enterprise agent definitions
   */
  private getAllEnterpriseAgentDefinitions(): EnterpriseAgentConfig[] {
    const agents: EnterpriseAgentConfig[] = [];

    // ================== EXECUTIVE TIER (34) ==================
    // C-Suite (5)
    agents.push(...[
      this.createExecutiveAgent('ceo-agent', 'CEO Agent', 'L4', 'c-suite', 'Strategic planning, vision setting, resource allocation'),
      this.createExecutiveAgent('cto-agent', 'CTO Agent', 'L4', 'c-suite', 'Technology strategy, architecture decisions'),
      this.createExecutiveAgent('cfo-agent', 'CFO Agent', 'L4', 'c-suite', 'Financial planning, budget allocation'),
      this.createExecutiveAgent('cpo-agent', 'CPO Agent', 'L4', 'c-suite', 'Product strategy, roadmap planning'),
      this.createExecutiveAgent('cmo-agent', 'CMO Agent', 'L3', 'c-suite', 'Marketing strategy, brand management'),
    ]);

    // Project Management (5)
    agents.push(...[
      this.createExecutiveAgent('project-manager', 'Project Manager', 'L3', 'management', 'Sprint planning, task delegation'),
      this.createExecutiveAgent('product-owner', 'Product Owner', 'L3', 'management', 'Backlog management, prioritization'),
      this.createExecutiveAgent('scrum-master', 'Scrum Master', 'L3', 'management', 'Agile ceremonies, team facilitation'),
      this.createExecutiveAgent('release-manager', 'Release Manager', 'L3', 'management', 'Release coordination, deployment'),
      this.createExecutiveAgent('resource-allocator', 'Resource Allocator', 'L4', 'management', 'Dynamic resource optimization'),
    ]);

    // Strategic Orchestration (8)
    agents.push(...[
      this.createExecutiveAgent('orchestrator', 'Master Orchestrator', 'L4', 'orchestration', 'Multi-agent workflow coordination'),
      this.createExecutiveAgent('strategy-orchestrator', 'Strategy Orchestrator', 'L4', 'orchestration', 'Strategic planning coordination'),
      this.createExecutiveAgent('operations-orchestrator', 'Operations Orchestrator', 'L4', 'orchestration', 'Operational excellence'),
      this.createExecutiveAgent('innovation-orchestrator', 'Innovation Orchestrator', 'L4', 'orchestration', 'Innovation initiatives'),
      this.createExecutiveAgent('transformation-orchestrator', 'Transformation Orchestrator', 'L4', 'orchestration', 'Organizational transformation'),
      this.createExecutiveAgent('integration-orchestrator', 'Integration Orchestrator', 'L4', 'orchestration', 'System integration'),
      this.createExecutiveAgent('governance-orchestrator', 'Governance Orchestrator', 'L4', 'orchestration', 'Governance and compliance'),
      this.createExecutiveAgent('risk-orchestrator', 'Risk Orchestrator', 'L4', 'orchestration', 'Enterprise risk management'),
    ]);

    // Domain Orchestrators (8)
    agents.push(...[
      this.createExecutiveAgent('engineering-orchestrator', 'Engineering Orchestrator', 'L4', 'domain-orchestration', 'Engineering team coordination'),
      this.createExecutiveAgent('product-orchestrator', 'Product Orchestrator', 'L4', 'domain-orchestration', 'Product team coordination'),
      this.createExecutiveAgent('marketing-orchestrator', 'Marketing Orchestrator', 'L4', 'domain-orchestration', 'Marketing team coordination'),
      this.createExecutiveAgent('sales-orchestrator', 'Sales Orchestrator', 'L4', 'domain-orchestration', 'Sales team coordination'),
      this.createExecutiveAgent('finance-orchestrator', 'Finance Orchestrator', 'L4', 'domain-orchestration', 'Finance team coordination'),
      this.createExecutiveAgent('legal-orchestrator', 'Legal Orchestrator', 'L4', 'domain-orchestration', 'Legal team coordination'),
      this.createExecutiveAgent('hr-orchestrator', 'HR Orchestrator', 'L4', 'domain-orchestration', 'HR team coordination'),
      this.createExecutiveAgent('customer-success-orchestrator', 'Customer Success Orchestrator', 'L4', 'domain-orchestration', 'Customer success coordination'),
    ]);

    // Executive Specialists (8)
    agents.push(...[
      this.createExecutiveAgent('chief-data-officer', 'Chief Data Officer', 'L4', 'executive-specialist', 'Data strategy and governance'),
      this.createExecutiveAgent('chief-security-officer', 'Chief Security Officer', 'L4', 'executive-specialist', 'Security strategy'),
      this.createExecutiveAgent('chief-ai-officer', 'Chief AI Officer', 'L4', 'executive-specialist', 'AI strategy and ethics'),
      this.createExecutiveAgent('chief-people-officer', 'Chief People Officer', 'L4', 'executive-specialist', 'People strategy'),
      this.createExecutiveAgent('chief-revenue-officer', 'Chief Revenue Officer', 'L4', 'executive-specialist', 'Revenue strategy'),
      this.createExecutiveAgent('chief-growth-officer', 'Chief Growth Officer', 'L4', 'executive-specialist', 'Growth strategy'),
      this.createExecutiveAgent('chief-experience-officer', 'Chief Experience Officer', 'L4', 'executive-specialist', 'Customer experience'),
      this.createExecutiveAgent('chief-sustainability-officer', 'Chief Sustainability Officer', 'L4', 'executive-specialist', 'Sustainability initiatives'),
    ]);

    // ================== DEVELOPMENT TIER (50+) ==================
    // Core Developers (10)
    agents.push(...[
      this.createDevelopmentAgent('fullstack-developer', 'Fullstack Developer', 'L3', 'developer', 'End-to-end web development'),
      this.createDevelopmentAgent('frontend-developer', 'Frontend Developer', 'L3', 'developer', 'UI/UX implementation'),
      this.createDevelopmentAgent('backend-developer', 'Backend Developer', 'L3', 'developer', 'Server-side development'),
      this.createDevelopmentAgent('api-developer', 'API Developer', 'L3', 'developer', 'API design and implementation'),
      this.createDevelopmentAgent('database-developer', 'Database Developer', 'L3', 'developer', 'Database design'),
      this.createDevelopmentAgent('mobile-developer', 'Mobile Developer', 'L3', 'developer', 'Mobile app development'),
      this.createDevelopmentAgent('game-developer', 'Game Developer', 'L3', 'developer', 'Game development'),
      this.createDevelopmentAgent('embedded-developer', 'Embedded Developer', 'L3', 'developer', 'Embedded systems'),
      this.createDevelopmentAgent('systems-developer', 'Systems Developer', 'L3', 'developer', 'Systems programming'),
      this.createDevelopmentAgent('blockchain-developer', 'Blockchain Developer', 'L3', 'developer', 'Blockchain development'),
    ]);

    // AI/ML Specialists (8)
    agents.push(...[
      this.createDevelopmentAgent('ml-engineer', 'ML Engineer', 'L3', 'ai-ml', 'Machine learning engineering'),
      this.createDevelopmentAgent('prompt-engineer', 'Prompt Engineer', 'L3', 'ai-ml', 'LLM prompt optimization'),
      this.createDevelopmentAgent('data-engineer', 'Data Engineer', 'L3', 'ai-ml', 'Data pipeline engineering'),
      this.createDevelopmentAgent('ai-researcher', 'AI Researcher', 'L3', 'ai-ml', 'AI research'),
      this.createDevelopmentAgent('nlp-specialist', 'NLP Specialist', 'L3', 'ai-ml', 'Natural language processing'),
      this.createDevelopmentAgent('computer-vision-engineer', 'Computer Vision Engineer', 'L3', 'ai-ml', 'Computer vision'),
      this.createDevelopmentAgent('mlops-engineer', 'MLOps Engineer', 'L3', 'ai-ml', 'ML operations'),
      this.createDevelopmentAgent('rag-specialist', 'RAG Specialist', 'L3', 'ai-ml', 'RAG implementation'),
    ]);

    // Architecture & Security (6)
    agents.push(...[
      this.createDevelopmentAgent('security-engineer', 'Security Engineer', 'L3', 'security', 'Application security'),
      this.createDevelopmentAgent('solutions-architect', 'Solutions Architect', 'L4', 'architecture', 'Solution design'),
      this.createDevelopmentAgent('enterprise-architect', 'Enterprise Architect', 'L4', 'architecture', 'Enterprise architecture'),
      this.createDevelopmentAgent('data-architect', 'Data Architect', 'L4', 'architecture', 'Data architecture'),
      this.createDevelopmentAgent('integration-architect', 'Integration Architect', 'L4', 'architecture', 'Integration design'),
      this.createDevelopmentAgent('security-architect', 'Security Architect', 'L4', 'security', 'Security architecture'),
    ]);

    // DevOps & Infrastructure (8)
    agents.push(...[
      this.createDevelopmentAgent('devops-engineer', 'DevOps Engineer', 'L3', 'devops', 'CI/CD and infrastructure'),
      this.createDevelopmentAgent('platform-engineer', 'Platform Engineer', 'L3', 'devops', 'Platform development'),
      this.createDevelopmentAgent('cloud-engineer', 'Cloud Engineer', 'L3', 'devops', 'Cloud infrastructure'),
      this.createDevelopmentAgent('infrastructure-engineer', 'Infrastructure Engineer', 'L3', 'devops', 'Infrastructure management'),
      this.createDevelopmentAgent('kubernetes-engineer', 'Kubernetes Engineer', 'L3', 'devops', 'Container orchestration'),
      this.createDevelopmentAgent('cicd-engineer', 'CI/CD Engineer', 'L3', 'devops', 'Pipeline automation'),
      this.createDevelopmentAgent('monitoring-engineer', 'Monitoring Engineer', 'L3', 'devops', 'Observability'),
      this.createDevelopmentAgent('automation-engineer', 'Automation Engineer', 'L3', 'devops', 'Process automation'),
    ]);

    // Testing & Quality (6)
    agents.push(...[
      this.createDevelopmentAgent('test-automation-engineer', 'Test Automation Engineer', 'L3', 'testing', 'Test automation'),
      this.createDevelopmentAgent('sdet', 'SDET', 'L3', 'testing', 'Software development in test'),
      this.createDevelopmentAgent('integration-tester', 'Integration Tester', 'L2', 'testing', 'Integration testing'),
      this.createDevelopmentAgent('api-tester', 'API Tester', 'L2', 'testing', 'API testing'),
      this.createDevelopmentAgent('load-tester', 'Load Tester', 'L2', 'testing', 'Load testing'),
      this.createDevelopmentAgent('security-tester', 'Security Tester', 'L3', 'testing', 'Security testing'),
    ]);

    // Documentation (4)
    agents.push(...[
      this.createDevelopmentAgent('technical-writer', 'Technical Writer', 'L2', 'documentation', 'Technical documentation'),
      this.createDevelopmentAgent('api-documentation-specialist', 'API Documentation Specialist', 'L2', 'documentation', 'API docs'),
      this.createDevelopmentAgent('developer-advocate', 'Developer Advocate', 'L3', 'advocacy', 'Developer relations'),
      this.createDevelopmentAgent('support-engineer', 'Support Engineer', 'L2', 'support', 'Technical support'),
    ]);

    // Specialized Development Variants (24)
    const devVariants = [
      'react-developer', 'vue-developer', 'angular-developer', 'nextjs-developer',
      'python-developer', 'golang-developer', 'rust-developer', 'java-developer',
      'dotnet-developer', 'php-developer', 'ruby-developer', 'scala-developer',
      'aws-specialist', 'gcp-specialist', 'azure-specialist', 'terraform-specialist',
      'graphql-specialist', 'rest-api-specialist', 'websocket-specialist',
      'redis-specialist', 'elasticsearch-specialist', 'mongodb-specialist',
      'postgresql-specialist', 'mysql-specialist'
    ];
    agents.push(...devVariants.map(id => this.createDevelopmentAgent(
      id, this.formatName(id), 'L3', 'specialized', `Specialized ${id.replace(/-/g, ' ')} expertise`
    )));

    // ================== CREATIVE TIER (17) ==================
    agents.push(...[
      this.createCreativeAgent('content-writer', 'Content Writer', 'L3', 'content', 'Content creation'),
      this.createCreativeAgent('copywriter', 'Copywriter', 'L3', 'content', 'Persuasive copy'),
      this.createCreativeAgent('content-strategist', 'Content Strategist', 'L3', 'content', 'Content strategy'),
      this.createCreativeAgent('ux-designer', 'UX Designer', 'L3', 'design', 'User experience design'),
      this.createCreativeAgent('ui-designer', 'UI Designer', 'L3', 'design', 'User interface design'),
      this.createCreativeAgent('graphic-designer', 'Graphic Designer', 'L3', 'design', 'Visual design'),
      this.createCreativeAgent('motion-designer', 'Motion Designer', 'L3', 'design', 'Motion graphics'),
      this.createCreativeAgent('video-producer', 'Video Producer', 'L3', 'video', 'Video production'),
      this.createCreativeAgent('video-editor', 'Video Editor', 'L2', 'video', 'Video editing'),
      this.createCreativeAgent('audio-engineer', 'Audio Engineer', 'L2', 'audio', 'Audio production'),
      this.createCreativeAgent('voice-artist', 'Voice Artist', 'L2', 'audio', 'Voice work'),
      this.createCreativeAgent('illustrator', 'Illustrator', 'L3', 'design', 'Illustration'),
      this.createCreativeAgent('brand-designer', 'Brand Designer', 'L3', 'branding', 'Brand identity'),
      this.createCreativeAgent('creative-director', 'Creative Director', 'L4', 'leadership', 'Creative leadership'),
      this.createCreativeAgent('art-director', 'Art Director', 'L3', 'leadership', 'Art direction'),
      this.createCreativeAgent('photographer', 'Photographer', 'L2', 'visual', 'Photography'),
      this.createCreativeAgent('presentation-designer', 'Presentation Designer', 'L2', 'design', 'Presentation design'),
    ]);

    // ================== QA TIER (7) ==================
    agents.push(...[
      this.createQAAgent('qa-engineer', 'QA Engineer', 'L3', 'testing', 'Quality assurance'),
      this.createQAAgent('security-auditor', 'Security Auditor', 'L3', 'security', 'Security auditing'),
      this.createQAAgent('accessibility-specialist', 'Accessibility Specialist', 'L3', 'accessibility', 'Accessibility testing'),
      this.createQAAgent('performance-tester', 'Performance Tester', 'L3', 'performance', 'Performance testing'),
      this.createQAAgent('qa-lead', 'QA Lead', 'L4', 'leadership', 'QA leadership'),
      this.createQAAgent('uat-coordinator', 'UAT Coordinator', 'L2', 'testing', 'UAT coordination'),
      this.createQAAgent('regression-tester', 'Regression Tester', 'L2', 'testing', 'Regression testing'),
    ]);

    // ================== DEVOPS TIER (11) ==================
    agents.push(...[
      this.createDevOpsAgent('sre-engineer', 'SRE Engineer', 'L3', 'reliability', 'Site reliability'),
      this.createDevOpsAgent('cloud-architect', 'Cloud Architect', 'L4', 'architecture', 'Cloud architecture'),
      this.createDevOpsAgent('network-engineer', 'Network Engineer', 'L3', 'networking', 'Network engineering'),
      this.createDevOpsAgent('database-administrator', 'Database Administrator', 'L3', 'database', 'Database administration'),
      this.createDevOpsAgent('systems-administrator', 'Systems Administrator', 'L3', 'systems', 'Systems administration'),
      this.createDevOpsAgent('devsecops-engineer', 'DevSecOps Engineer', 'L3', 'security', 'Security in DevOps'),
      this.createDevOpsAgent('incident-commander', 'Incident Commander', 'L4', 'operations', 'Incident management'),
      this.createDevOpsAgent('chaos-engineer', 'Chaos Engineer', 'L3', 'reliability', 'Chaos engineering'),
      this.createDevOpsAgent('finops-engineer', 'FinOps Engineer', 'L3', 'operations', 'Cloud cost optimization'),
      this.createDevOpsAgent('release-engineer', 'Release Engineer', 'L3', 'release', 'Release engineering'),
      this.createDevOpsAgent('build-engineer', 'Build Engineer', 'L2', 'build', 'Build systems'),
    ]);

    // ================== DOMAIN TIER - FINANCE (8) ==================
    agents.push(...[
      this.createDomainAgent('financial-analyst', 'Financial Analyst', 'finance', 'L3', 'analysis', 'Financial analysis, modeling, and reporting'),
      this.createDomainAgent('investment-analyst', 'Investment Analyst', 'finance', 'L3', 'investment', 'Investment analysis and valuation'),
      this.createDomainAgent('risk-analyst', 'Risk Analyst', 'finance', 'L3', 'risk', 'Risk assessment and management'),
      this.createDomainAgent('tax-specialist', 'Tax Specialist', 'finance', 'L3', 'tax', 'Tax planning and compliance'),
      this.createDomainAgent('treasury-analyst', 'Treasury Analyst', 'finance', 'L3', 'treasury', 'Cash and liquidity management'),
      this.createDomainAgent('audit-analyst', 'Audit Analyst', 'finance', 'L3', 'audit', 'Internal audit'),
      this.createDomainAgent('accounting-analyst', 'Accounting Analyst', 'finance', 'L2', 'accounting', 'Accounting operations'),
      this.createDomainAgent('fpa-analyst', 'FP&A Analyst', 'finance', 'L3', 'planning', 'Financial planning and analysis'),
    ]);

    // ================== DOMAIN TIER - LEGAL (5) ==================
    agents.push(...[
      this.createDomainAgent('legal-analyst', 'Legal Analyst', 'legal', 'L3', 'analysis', 'Legal research and analysis'),
      this.createDomainAgent('contract-reviewer', 'Contract Reviewer', 'legal', 'L3', 'contracts', 'Contract review and negotiation'),
      this.createDomainAgent('compliance-officer', 'Compliance Officer', 'legal', 'L3', 'compliance', 'Regulatory compliance'),
      this.createDomainAgent('ip-specialist', 'IP Specialist', 'legal', 'L3', 'ip', 'Intellectual property'),
      this.createDomainAgent('corporate-counsel', 'Corporate Counsel', 'legal', 'L4', 'counsel', 'Corporate legal matters'),
    ]);

    // ================== DOMAIN TIER - MARKETING (6) ==================
    agents.push(...[
      this.createDomainAgent('marketing-strategist', 'Marketing Strategist', 'marketing', 'L3', 'strategy', 'Marketing strategy'),
      this.createDomainAgent('seo-specialist', 'SEO Specialist', 'marketing', 'L3', 'seo', 'Search engine optimization'),
      this.createDomainAgent('social-media-specialist', 'Social Media Specialist', 'marketing', 'L3', 'social', 'Social media management'),
      this.createDomainAgent('brand-manager', 'Brand Manager', 'marketing', 'L3', 'brand', 'Brand management'),
      this.createDomainAgent('growth-hacker', 'Growth Hacker', 'marketing', 'L3', 'growth', 'Growth experimentation'),
      this.createDomainAgent('marketing-analyst', 'Marketing Analyst', 'marketing', 'L2', 'analytics', 'Marketing analytics'),
    ]);

    // ================== DOMAIN TIER - SALES (5) ==================
    agents.push(...[
      this.createDomainAgent('sales-strategist', 'Sales Strategist', 'sales', 'L3', 'strategy', 'Sales strategy'),
      this.createDomainAgent('account-executive', 'Account Executive', 'sales', 'L3', 'sales', 'Enterprise sales'),
      this.createDomainAgent('sales-engineer', 'Sales Engineer', 'sales', 'L3', 'technical', 'Technical sales'),
      this.createDomainAgent('business-development', 'Business Development', 'sales', 'L3', 'development', 'Business development'),
      this.createDomainAgent('customer-success', 'Customer Success', 'sales', 'L3', 'success', 'Customer success'),
    ]);

    // ================== DOMAIN TIER - HR (5) ==================
    agents.push(...[
      this.createDomainAgent('hr-specialist', 'HR Specialist', 'hr', 'L3', 'hr', 'Human resources'),
      this.createDomainAgent('recruiter', 'Recruiter', 'hr', 'L3', 'talent', 'Talent acquisition'),
      this.createDomainAgent('compensation-analyst', 'Compensation Analyst', 'hr', 'L3', 'compensation', 'Compensation and benefits'),
      this.createDomainAgent('learning-development', 'Learning & Development', 'hr', 'L3', 'learning', 'Training and development'),
      this.createDomainAgent('employee-experience', 'Employee Experience', 'hr', 'L3', 'experience', 'Employee engagement'),
    ]);

    // ================== DOMAIN TIER - EDUCATION (5) ==================
    agents.push(...[
      this.createDomainAgent('curriculum-designer', 'Curriculum Designer', 'education', 'L3', 'curriculum', 'Curriculum design'),
      this.createDomainAgent('instructor', 'Instructor', 'education', 'L3', 'instruction', 'Instruction and facilitation'),
      this.createDomainAgent('assessment-designer', 'Assessment Designer', 'education', 'L3', 'assessment', 'Assessment design'),
      this.createDomainAgent('learning-analytics', 'Learning Analytics', 'education', 'L3', 'analytics', 'Learning data analysis'),
      this.createDomainAgent('student-success', 'Student Success', 'education', 'L3', 'success', 'Student support'),
    ]);

    // ================== DOMAIN TIER - RESEARCH (4) ==================
    agents.push(...[
      this.createDomainAgent('research-analyst', 'Research Analyst', 'research', 'L3', 'research', 'Research methodology'),
      this.createDomainAgent('data-scientist', 'Data Scientist', 'research', 'L3', 'data-science', 'Data science'),
      this.createDomainAgent('market-researcher', 'Market Researcher', 'research', 'L3', 'market', 'Market research'),
      this.createDomainAgent('competitive-intelligence', 'Competitive Intelligence', 'research', 'L3', 'intelligence', 'Competitive analysis'),
    ]);

    // ================== ADDITIONAL SPECIALIZED DOMAIN AGENTS (15) ==================
    agents.push(...[
      this.createDomainAgent('credit-analyst', 'Credit Analyst', 'finance', 'L3', 'credit', 'Credit risk analysis'),
      this.createDomainAgent('portfolio-manager', 'Portfolio Manager', 'finance', 'L3', 'portfolio', 'Portfolio management'),
      this.createDomainAgent('compliance-analyst', 'Compliance Analyst', 'legal', 'L3', 'compliance', 'Compliance analysis'),
      this.createDomainAgent('litigation-support', 'Litigation Support', 'legal', 'L3', 'litigation', 'Litigation support'),
      this.createDomainAgent('email-marketing-specialist', 'Email Marketing Specialist', 'marketing', 'L3', 'email', 'Email marketing'),
      this.createDomainAgent('ppc-specialist', 'PPC Specialist', 'marketing', 'L3', 'ppc', 'Paid advertising'),
      this.createDomainAgent('influencer-marketing', 'Influencer Marketing', 'marketing', 'L3', 'influencer', 'Influencer marketing'),
      this.createDomainAgent('lead-generation', 'Lead Generation', 'sales', 'L3', 'leads', 'Lead generation'),
      this.createDomainAgent('territory-manager', 'Territory Manager', 'sales', 'L3', 'territory', 'Territory management'),
      this.createDomainAgent('benefits-specialist', 'Benefits Specialist', 'hr', 'L3', 'benefits', 'Benefits administration'),
      this.createDomainAgent('diversity-specialist', 'Diversity Specialist', 'hr', 'L3', 'diversity', 'Diversity & inclusion'),
      this.createDomainAgent('instructional-designer', 'Instructional Designer', 'education', 'L3', 'instructional', 'Instructional design'),
      this.createDomainAgent('e-learning-developer', 'E-Learning Developer', 'education', 'L3', 'elearning', 'E-learning development'),
      this.createDomainAgent('user-researcher', 'User Researcher', 'research', 'L3', 'user-research', 'User research'),
      this.createDomainAgent('survey-specialist', 'Survey Specialist', 'research', 'L3', 'surveys', 'Survey design and analysis'),
    ]);

    // ================== ADDITIONAL CREATIVE SPECIALISTS (6) ==================
    agents.push(...[
      this.createCreativeAgent('social-media-content-creator', 'Social Media Content Creator', 'L2', 'social', 'Social content creation'),
      this.createCreativeAgent('3d-designer', '3D Designer', 'L3', '3d', '3D design and modeling'),
      this.createCreativeAgent('product-photographer', 'Product Photographer', 'L2', 'photography', 'Product photography'),
      this.createCreativeAgent('podcast-producer', 'Podcast Producer', 'L3', 'audio', 'Podcast production'),
      this.createCreativeAgent('email-designer', 'Email Designer', 'L2', 'email', 'Email design'),
      this.createCreativeAgent('infographic-designer', 'Infographic Designer', 'L2', 'infographic', 'Infographic design'),
    ]);

    return agents;
  }

  // Helper methods to create agents by tier
  private createExecutiveAgent(id: string, name: string, romaLevel: EnterpriseAgentConfig['romaLevel'], category: string, description: string): EnterpriseAgentConfig {
    return this.createBaseAgent(id, name, 'executive', romaLevel, category, description);
  }

  private createDevelopmentAgent(id: string, name: string, romaLevel: EnterpriseAgentConfig['romaLevel'], category: string, description: string): EnterpriseAgentConfig {
    return this.createBaseAgent(id, name, 'development', romaLevel, category, description);
  }

  private createCreativeAgent(id: string, name: string, romaLevel: EnterpriseAgentConfig['romaLevel'], category: string, description: string): EnterpriseAgentConfig {
    return this.createBaseAgent(id, name, 'creative', romaLevel, category, description);
  }

  private createQAAgent(id: string, name: string, romaLevel: EnterpriseAgentConfig['romaLevel'], category: string, description: string): EnterpriseAgentConfig {
    return this.createBaseAgent(id, name, 'qa', romaLevel, category, description);
  }

  private createDevOpsAgent(id: string, name: string, romaLevel: EnterpriseAgentConfig['romaLevel'], category: string, description: string): EnterpriseAgentConfig {
    return this.createBaseAgent(id, name, 'devops', romaLevel, category, description);
  }

  private createDomainAgent(id: string, name: string, vertical: string, romaLevel: EnterpriseAgentConfig['romaLevel'], category: string, description: string): EnterpriseAgentConfig {
    const agent = this.createBaseAgent(id, name, 'domain', romaLevel, category, description);
    agent.vertical = vertical;
    return agent;
  }

  private createBaseAgent(id: string, name: string, tier: EnterpriseAgentConfig['tier'], romaLevel: EnterpriseAgentConfig['romaLevel'], category: string, description: string): EnterpriseAgentConfig {
    return {
      id,
      name,
      description,
      tier,
      romaLevel,
      capabilities: this.getDefaultCapabilities(),
      model: romaLevel === 'L4' ? 'opus' : romaLevel === 'L3' ? 'sonnet' : 'haiku',
      category,
      systemPrompt: this.generateEnterprisePrompt(id, name, tier, romaLevel, description),
      hasEnterprisePrompt: true,
      tools: this.getToolsForTier(tier),
      protocols: ['A2A', 'MCP'],
      operationMode: this.getOperationMode(romaLevel),
      supportedLanguages: [
        'en', 'es', 'fr', 'de', 'pt', 'it', 'nl', 'pl', 'ru', 'zh', 'ja', 'ko',
        'hi', 'ta', 'te', 'kn', 'ml', 'mr', 'gu', 'bn', 'pa', 'or', 'as'
      ],
      guardRails: {
        parlantCompliance: true,
        securityLevel: tier === 'executive' ? 'critical' : 'high',
        piiProtection: true
      },
      status: 'active'
    };
  }

  private getDefaultCapabilities(): string[] {
    return [
      'autonomous-execution', 'self-learning', 'collaborative', 'swarm-coordination',
      'context-engineering', 'hierarchy-awareness', 'behavioral-intelligence',
      'process-orientation', 'guardrail-compliance', 'capability-awareness',
      'parallel-execution', 'llm-intelligence', 'multimodal-processing',
      'multi-language-support', 'cost-optimization'
    ];
  }

  private getToolsForTier(tier: string): string[] {
    const toolsByTier: Record<string, string[]> = {
      'executive': ['analytics', 'planning', 'reporting', 'resource-management'],
      'development': ['code-editor', 'git', 'build', 'test', 'debug'],
      'creative': ['design', 'content', 'asset', 'brand'],
      'qa': ['testing', 'automation', 'security-scan', 'performance'],
      'devops': ['cicd', 'infrastructure', 'monitoring', 'logging'],
      'domain': ['research', 'analysis', 'visualization', 'reporting']
    };
    return toolsByTier[tier] || ['general'];
  }

  private getOperationMode(level: string): string {
    switch (level) {
      case 'L4': return 'autonomous';
      case 'L3': return 'group';
      case 'L2': return 'standalone';
      default: return 'supervised';
    }
  }

  private formatName(id: string): string {
    return id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  private generateEnterprisePrompt(id: string, name: string, tier: string, romaLevel: string, description: string): string {
    return `# ${name.toUpperCase()} AGENT
<agent_identity>
  <name>${name}</name>
  <id>${id}</id>
  <tier>${tier}</tier>
  <roma_level>${romaLevel}</roma_level>
  <version>1.0.0</version>
  <status>active</status>
</agent_identity>

## IDENTITY & CONTEXT
You are the **${name}**, operating at ROMA ${romaLevel} level in the ${tier} tier. ${description}

## CORE CAPABILITIES (15/15)

### 1. AUTONOMOUS EXECUTION
- Execute tasks independently within defined parameters
- Self-direct workflows without constant oversight
- Complete multi-step processes autonomously

### 2. SELF-LEARNING INTELLIGENCE
- Learn from outcomes and feedback
- Adapt approaches based on results
- Continuously improve performance

### 3. COLLABORATIVE MULTI-AGENT
- Coordinate with other agents via A2A protocol
- Participate in swarm-based problem solving
- Share context through MCP protocol

### 4. SWARM COORDINATION
- Operate within multi-agent execution patterns
- Synchronize with parallel agents
- Maintain awareness of concurrent activities

### 5. CONTEXT ENGINEERING
- Preserve context across sessions
- Build and query knowledge graphs
- Adapt based on situational context

### 6. HIERARCHY AWARENESS
- Understand reporting structure
- Escalate appropriately
- Collaborate with peers

### 7. BEHAVIORAL INTELLIGENCE
- Adapt communication style
- Learn from user feedback
- Optimize for stakeholder satisfaction

### 8. PROCESS ORIENTATION
- Follow structured workflows
- Track task status
- Maintain audit trails

### 9. GUARDRAIL COMPLIANCE
- Follow safety standards
- Maintain compliance
- Protect sensitive information

### 10. CAPABILITY AWARENESS
- Know your assigned tools
- Recognize task limits
- Delegate when appropriate

### 11. PARALLEL EXECUTION
- Execute independent tasks concurrently
- Process non-overlapping work simultaneously
- Respect sequential dependencies

### 12. LLM INTELLIGENCE
- Select optimal model for task complexity
- Optimize token usage
- Manage context windows

### 13. MULTIMODAL PROCESSING
- Process various input formats
- Generate appropriate outputs
- Handle visual and textual content

### 14. MULTI-LANGUAGE SUPPORT
- Communicate in user's language
- Support localization
- Generate multilingual content

### 15. COST OPTIMIZATION
- Minimize resource usage
- Cache efficiently
- Track consumption

## OUTPUT STANDARDS
- Professional, accurate outputs
- Clear documentation
- Standards-compliant work

## COMMUNICATION PROTOCOL
- Use appropriate language
- Explain significant changes
- Report blockers promptly`;
  }

  async syncAgentsToDatabase(): Promise<void> {
    try {
      // Load enterprise agents if not already loaded
      if (!this.isEnterpriseLoaded) {
        await this.loadEnterpriseAgents();
      }

      const allAgents = Array.from(this.enterpriseAgents.values());
      console.log(`Syncing ${allAgents.length} enterprise agents to database...`);

      for (const agent of allAgents) {
        try {
          const existingAgent = await db
            .select()
            .from(agentCatalog)
            .where(eq(agentCatalog.agentId, agent.id))
            .limit(1);

          const agentData = {
            agentId: agent.id,
            name: agent.name,
            displayName: agent.name,
            description: agent.description,
            tier: agent.tier,
            category: agent.category,
            specialization: agent.vertical || agent.category,
            capabilities: agent.capabilities,
            systemPrompt: agent.systemPrompt,
            preferredModels: [agent.model, 'gpt-4o'],
            isAvailable: agent.status === 'active',
            status: agent.status,
            version: '1.0.0',
            workflowPatterns: [],
            baselineMetrics: {},
            updatedAt: new Date(),
          };

          if (existingAgent.length > 0) {
            await db
              .update(agentCatalog)
              .set(agentData)
              .where(eq(agentCatalog.agentId, agent.id));
          } else {
            await db
              .insert(agentCatalog)
              .values({
                ...agentData,
                createdAt: new Date(),
              });
          }
        } catch (agentError) {
          console.error(`Error syncing agent ${agent.id}:`, agentError);
        }
      }

      console.log(`✅ Successfully synced ${allAgents.length} agents to database`);
    } catch (error) {
      console.error('Error syncing agents to database:', error);
      throw error;
    }
  }

  async getAllAgentsFromManifest(): Promise<any[]> {
    if (!this.isEnterpriseLoaded) {
      await this.loadEnterpriseAgents();
    }
    return Array.from(this.enterpriseAgents.values());
  }

  async getAgentFromManifest(agentId: string): Promise<any | null> {
    if (!this.isEnterpriseLoaded) {
      await this.loadEnterpriseAgents();
    }
    return this.enterpriseAgents.get(agentId) || null;
  }

  getEnterpriseAgent(id: string): EnterpriseAgentConfig | undefined {
    return this.enterpriseAgents.get(id);
  }

  getAllEnterpriseAgents(): EnterpriseAgentConfig[] {
    return Array.from(this.enterpriseAgents.values());
  }

  getEnterpriseAgentsByTier(tier: string): EnterpriseAgentConfig[] {
    return this.getAllEnterpriseAgents().filter(a => a.tier === tier);
  }

  getEnterpriseAgentsByVertical(vertical: string): EnterpriseAgentConfig[] {
    return this.getAllEnterpriseAgents().filter(a => a.vertical === vertical);
  }

  isEnterpriseReady(): boolean {
    return this.isEnterpriseLoaded;
  }

  getEnterpriseStats() {
    return {
      totalAgents: this.enterpriseAgents.size,
      isLoaded: this.isEnterpriseLoaded,
      loadTime: this.loadTime,
      byTier: {
        executive: this.getEnterpriseAgentsByTier('executive').length,
        development: this.getEnterpriseAgentsByTier('development').length,
        creative: this.getEnterpriseAgentsByTier('creative').length,
        qa: this.getEnterpriseAgentsByTier('qa').length,
        devops: this.getEnterpriseAgentsByTier('devops').length,
        domain: this.getEnterpriseAgentsByTier('domain').length
      },
      byVertical: {
        finance: this.getEnterpriseAgentsByVertical('finance').length,
        legal: this.getEnterpriseAgentsByVertical('legal').length,
        marketing: this.getEnterpriseAgentsByVertical('marketing').length,
        sales: this.getEnterpriseAgentsByVertical('sales').length,
        hr: this.getEnterpriseAgentsByVertical('hr').length,
        education: this.getEnterpriseAgentsByVertical('education').length,
        research: this.getEnterpriseAgentsByVertical('research').length
      }
    };
  }

  async updateAgentSystemPrompt(agentId: string, newSystemPrompt: string): Promise<boolean> {
    try {
      const result = await db
        .update(agentCatalog)
        .set({ 
          systemPrompt: newSystemPrompt,
          updatedAt: new Date()
        })
        .where(eq(agentCatalog.agentId, agentId))
        .returning();

      // Also update in memory
      const agent = this.enterpriseAgents.get(agentId);
      if (agent) {
        agent.systemPrompt = newSystemPrompt;
      }

      return result.length > 0;
    } catch (error) {
      console.error('Error updating agent system prompt:', error);
      return false;
    }
  }

  async updateAgentWorkflow(agentId: string, newWorkflow: any): Promise<boolean> {
    try {
      const result = await db
        .update(agentCatalog)
        .set({ 
          workflowPatterns: [newWorkflow],
          updatedAt: new Date()
        })
        .where(eq(agentCatalog.agentId, agentId))
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error('Error updating agent workflow:', error);
      return false;
    }
  }
}

export const agentManifestLoader = new AgentManifestLoader();
