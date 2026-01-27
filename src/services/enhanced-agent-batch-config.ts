/**
 * Enhanced Agent Batch Configuration Service
 * Configures remaining 131 agents with full enhanced configuration
 */

import { EventEmitter } from 'events';

export interface EnhancedAgentConfig {
  id: string;
  name: string;
  category: string;
  romaLevel: 1 | 2 | 3 | 4;
  status: 'active' | 'inactive' | 'pending';
  systemPrompt: string;
  modelConfig: {
    mode: 'auto' | 'defined' | 'selected';
    preferredModel?: string;
    fallbackModels?: string[];
    costOptimization: boolean;
  };
  group: string;
  hierarchy: {
    reportsTo?: string;
    supervises?: string[];
  };
  protocols: string[];
  guardrails: {
    parlantCompliance: boolean;
    securityLevel: 'low' | 'medium' | 'high' | 'critical';
    piiProtection: boolean;
  };
  operationMode: 'autonomous' | 'standalone' | 'group' | 'supervised';
  languages: string[];
  outcomeTypes: string[];
  capabilities: string[];
  tools: string[];
  configuredAt: string;
}

const agentCategories = [
  'engineering', 'marketing', 'finance', 'hr', 'legal', 
  'operations', 'sales', 'support', 'research', 'creative',
  'healthcare', 'education', 'executive'
];

const defaultGroups = [
  'Development', 'Creative', 'Research', 'Executive', 'QA',
  'DevOps', 'Content', 'Social', 'Finance', 'Legal', 'HR', 'Operations'
];

const defaultProtocols = ['A2A', 'MCP', 'AG-UI', 'OpenAgent'];

const remainingAgents: Partial<EnhancedAgentConfig>[] = [
  { id: 'backend-developer-2', name: 'Backend Developer II', category: 'engineering', romaLevel: 3 },
  { id: 'frontend-developer-2', name: 'Frontend Developer II', category: 'engineering', romaLevel: 3 },
  { id: 'mobile-developer', name: 'Mobile Developer', category: 'engineering', romaLevel: 3 },
  { id: 'ios-developer', name: 'iOS Developer', category: 'engineering', romaLevel: 3 },
  { id: 'android-developer', name: 'Android Developer', category: 'engineering', romaLevel: 3 },
  { id: 'react-specialist', name: 'React Specialist', category: 'engineering', romaLevel: 3 },
  { id: 'vue-specialist', name: 'Vue.js Specialist', category: 'engineering', romaLevel: 3 },
  { id: 'angular-specialist', name: 'Angular Specialist', category: 'engineering', romaLevel: 3 },
  { id: 'node-specialist', name: 'Node.js Specialist', category: 'engineering', romaLevel: 3 },
  { id: 'python-specialist', name: 'Python Specialist', category: 'engineering', romaLevel: 3 },
  { id: 'go-specialist', name: 'Go Specialist', category: 'engineering', romaLevel: 3 },
  { id: 'rust-specialist', name: 'Rust Specialist', category: 'engineering', romaLevel: 3 },
  { id: 'java-specialist', name: 'Java Specialist', category: 'engineering', romaLevel: 3 },
  { id: 'csharp-specialist', name: 'C# Specialist', category: 'engineering', romaLevel: 3 },
  { id: 'database-architect', name: 'Database Architect', category: 'engineering', romaLevel: 4 },
  { id: 'postgresql-specialist', name: 'PostgreSQL Specialist', category: 'engineering', romaLevel: 3 },
  { id: 'mongodb-specialist', name: 'MongoDB Specialist', category: 'engineering', romaLevel: 3 },
  { id: 'redis-specialist', name: 'Redis Specialist', category: 'engineering', romaLevel: 3 },
  { id: 'elasticsearch-specialist', name: 'Elasticsearch Specialist', category: 'engineering', romaLevel: 3 },
  { id: 'kubernetes-engineer', name: 'Kubernetes Engineer', category: 'engineering', romaLevel: 3 },
  { id: 'docker-specialist', name: 'Docker Specialist', category: 'engineering', romaLevel: 3 },
  { id: 'aws-architect', name: 'AWS Solutions Architect', category: 'engineering', romaLevel: 4 },
  { id: 'gcp-architect', name: 'GCP Solutions Architect', category: 'engineering', romaLevel: 4 },
  { id: 'azure-architect', name: 'Azure Solutions Architect', category: 'engineering', romaLevel: 4 },
  { id: 'terraform-specialist', name: 'Terraform Specialist', category: 'engineering', romaLevel: 3 },
  { id: 'ci-cd-specialist', name: 'CI/CD Specialist', category: 'engineering', romaLevel: 3 },
  { id: 'site-reliability-engineer', name: 'Site Reliability Engineer', category: 'engineering', romaLevel: 3 },
  { id: 'performance-engineer', name: 'Performance Engineer', category: 'engineering', romaLevel: 3 },
  { id: 'security-analyst', name: 'Security Analyst', category: 'engineering', romaLevel: 3 },
  { id: 'penetration-tester', name: 'Penetration Tester', category: 'engineering', romaLevel: 3 },
  { id: 'ml-engineer', name: 'ML Engineer', category: 'engineering', romaLevel: 4 },
  { id: 'data-engineer', name: 'Data Engineer', category: 'engineering', romaLevel: 3 },
  { id: 'data-scientist', name: 'Data Scientist', category: 'research', romaLevel: 4 },
  { id: 'nlp-specialist', name: 'NLP Specialist', category: 'research', romaLevel: 4 },
  { id: 'computer-vision-specialist', name: 'Computer Vision Specialist', category: 'research', romaLevel: 4 },
  { id: 'ai-research-scientist', name: 'AI Research Scientist', category: 'research', romaLevel: 4 },
  { id: 'ux-researcher', name: 'UX Researcher', category: 'creative', romaLevel: 3 },
  { id: 'ui-designer', name: 'UI Designer', category: 'creative', romaLevel: 3 },
  { id: 'product-designer', name: 'Product Designer', category: 'creative', romaLevel: 3 },
  { id: 'brand-designer', name: 'Brand Designer', category: 'creative', romaLevel: 3 },
  { id: 'motion-designer', name: 'Motion Designer', category: 'creative', romaLevel: 3 },
  { id: '3d-artist', name: '3D Artist', category: 'creative', romaLevel: 3 },
  { id: 'video-editor', name: 'Video Editor', category: 'creative', romaLevel: 2 },
  { id: 'copywriter', name: 'Copywriter', category: 'creative', romaLevel: 3 },
  { id: 'content-writer', name: 'Content Writer', category: 'creative', romaLevel: 3 },
  { id: 'technical-writer-2', name: 'Technical Writer II', category: 'creative', romaLevel: 3 },
  { id: 'seo-specialist', name: 'SEO Specialist', category: 'marketing', romaLevel: 3 },
  { id: 'sem-specialist', name: 'SEM Specialist', category: 'marketing', romaLevel: 3 },
  { id: 'growth-hacker', name: 'Growth Hacker', category: 'marketing', romaLevel: 3 },
  { id: 'email-marketing-specialist', name: 'Email Marketing Specialist', category: 'marketing', romaLevel: 2 },
  { id: 'affiliate-manager', name: 'Affiliate Manager', category: 'marketing', romaLevel: 3 },
  { id: 'influencer-manager', name: 'Influencer Manager', category: 'marketing', romaLevel: 3 },
  { id: 'pr-specialist', name: 'PR Specialist', category: 'marketing', romaLevel: 3 },
  { id: 'event-coordinator', name: 'Event Coordinator', category: 'marketing', romaLevel: 2 },
  { id: 'market-researcher', name: 'Market Researcher', category: 'research', romaLevel: 3 },
  { id: 'competitive-analyst', name: 'Competitive Analyst', category: 'research', romaLevel: 3 },
  { id: 'sales-development-rep', name: 'Sales Development Rep', category: 'sales', romaLevel: 2 },
  { id: 'account-executive', name: 'Account Executive', category: 'sales', romaLevel: 3 },
  { id: 'account-manager', name: 'Account Manager', category: 'sales', romaLevel: 3 },
  { id: 'sales-engineer', name: 'Sales Engineer', category: 'sales', romaLevel: 3 },
  { id: 'customer-success-manager', name: 'Customer Success Manager', category: 'support', romaLevel: 3 },
  { id: 'support-tier-1', name: 'Support Tier 1', category: 'support', romaLevel: 2 },
  { id: 'support-tier-2', name: 'Support Tier 2', category: 'support', romaLevel: 3 },
  { id: 'support-tier-3', name: 'Support Tier 3', category: 'support', romaLevel: 3 },
  { id: 'technical-support-specialist', name: 'Technical Support Specialist', category: 'support', romaLevel: 3 },
  { id: 'training-specialist', name: 'Training Specialist', category: 'support', romaLevel: 2 },
  { id: 'documentation-specialist', name: 'Documentation Specialist', category: 'support', romaLevel: 2 },
  { id: 'investment-analyst', name: 'Investment Analyst', category: 'finance', romaLevel: 3 },
  { id: 'portfolio-analyst', name: 'Portfolio Analyst', category: 'finance', romaLevel: 3 },
  { id: 'credit-analyst', name: 'Credit Analyst', category: 'finance', romaLevel: 3 },
  { id: 'treasury-analyst', name: 'Treasury Analyst', category: 'finance', romaLevel: 3 },
  { id: 'tax-specialist', name: 'Tax Specialist', category: 'finance', romaLevel: 3 },
  { id: 'audit-specialist', name: 'Audit Specialist', category: 'finance', romaLevel: 3 },
  { id: 'payroll-specialist', name: 'Payroll Specialist', category: 'finance', romaLevel: 2 },
  { id: 'accounts-payable', name: 'Accounts Payable Specialist', category: 'finance', romaLevel: 2 },
  { id: 'accounts-receivable', name: 'Accounts Receivable Specialist', category: 'finance', romaLevel: 2 },
  { id: 'talent-acquisition-specialist', name: 'Talent Acquisition Specialist', category: 'hr', romaLevel: 3 },
  { id: 'compensation-analyst', name: 'Compensation Analyst', category: 'hr', romaLevel: 3 },
  { id: 'benefits-specialist', name: 'Benefits Specialist', category: 'hr', romaLevel: 2 },
  { id: 'hr-business-partner', name: 'HR Business Partner', category: 'hr', romaLevel: 3 },
  { id: 'dei-specialist', name: 'DEI Specialist', category: 'hr', romaLevel: 3 },
  { id: 'employee-relations-specialist', name: 'Employee Relations Specialist', category: 'hr', romaLevel: 3 },
  { id: 'learning-development-specialist', name: 'L&D Specialist', category: 'hr', romaLevel: 3 },
  { id: 'corporate-counsel', name: 'Corporate Counsel', category: 'legal', romaLevel: 4 },
  { id: 'ip-attorney', name: 'IP Attorney', category: 'legal', romaLevel: 4 },
  { id: 'employment-attorney', name: 'Employment Attorney', category: 'legal', romaLevel: 4 },
  { id: 'privacy-counsel', name: 'Privacy Counsel', category: 'legal', romaLevel: 4 },
  { id: 'paralegal', name: 'Paralegal', category: 'legal', romaLevel: 2 },
  { id: 'contract-administrator', name: 'Contract Administrator', category: 'legal', romaLevel: 2 },
  { id: 'operations-analyst', name: 'Operations Analyst', category: 'operations', romaLevel: 3 },
  { id: 'procurement-specialist', name: 'Procurement Specialist', category: 'operations', romaLevel: 3 },
  { id: 'inventory-manager', name: 'Inventory Manager', category: 'operations', romaLevel: 3 },
  { id: 'logistics-coordinator', name: 'Logistics Coordinator', category: 'operations', romaLevel: 2 },
  { id: 'quality-assurance-manager', name: 'Quality Assurance Manager', category: 'operations', romaLevel: 3 },
  { id: 'facilities-manager', name: 'Facilities Manager', category: 'operations', romaLevel: 3 },
  { id: 'project-manager-2', name: 'Project Manager II', category: 'operations', romaLevel: 3 },
  { id: 'program-manager', name: 'Program Manager', category: 'operations', romaLevel: 4 },
  { id: 'scrum-master', name: 'Scrum Master', category: 'operations', romaLevel: 3 },
  { id: 'agile-coach', name: 'Agile Coach', category: 'operations', romaLevel: 4 },
  { id: 'clinical-research-coordinator', name: 'Clinical Research Coordinator', category: 'healthcare', romaLevel: 3 },
  { id: 'patient-advocate', name: 'Patient Advocate', category: 'healthcare', romaLevel: 2 },
  { id: 'medical-coder', name: 'Medical Coder', category: 'healthcare', romaLevel: 2 },
  { id: 'health-informatics-specialist', name: 'Health Informatics Specialist', category: 'healthcare', romaLevel: 3 },
  { id: 'telemedicine-coordinator', name: 'Telemedicine Coordinator', category: 'healthcare', romaLevel: 2 },
  { id: 'curriculum-developer', name: 'Curriculum Developer', category: 'education', romaLevel: 3 },
  { id: 'instructional-designer', name: 'Instructional Designer', category: 'education', romaLevel: 3 },
  { id: 'e-learning-specialist', name: 'E-Learning Specialist', category: 'education', romaLevel: 3 },
  { id: 'academic-advisor', name: 'Academic Advisor', category: 'education', romaLevel: 2 },
  { id: 'assessment-specialist', name: 'Assessment Specialist', category: 'education', romaLevel: 3 },
  { id: 'vp-engineering', name: 'VP of Engineering', category: 'executive', romaLevel: 4 },
  { id: 'vp-product', name: 'VP of Product', category: 'executive', romaLevel: 4 },
  { id: 'vp-sales', name: 'VP of Sales', category: 'executive', romaLevel: 4 },
  { id: 'vp-marketing', name: 'VP of Marketing', category: 'executive', romaLevel: 4 },
  { id: 'chief-strategy-officer', name: 'Chief Strategy Officer', category: 'executive', romaLevel: 4 },
  { id: 'chief-data-officer', name: 'Chief Data Officer', category: 'executive', romaLevel: 4 },
  { id: 'chief-security-officer', name: 'Chief Security Officer', category: 'executive', romaLevel: 4 },
  { id: 'chief-product-officer', name: 'Chief Product Officer', category: 'executive', romaLevel: 4 },
  { id: 'chief-revenue-officer', name: 'Chief Revenue Officer', category: 'executive', romaLevel: 4 },
  { id: 'board-advisor', name: 'Board Advisor Agent', category: 'executive', romaLevel: 4 },
  { id: 'investor-relations', name: 'Investor Relations Agent', category: 'executive', romaLevel: 4 },
  { id: 'blockchain-developer', name: 'Blockchain Developer', category: 'engineering', romaLevel: 3 },
  { id: 'smart-contract-auditor', name: 'Smart Contract Auditor', category: 'engineering', romaLevel: 4 },
  { id: 'defi-specialist', name: 'DeFi Specialist', category: 'engineering', romaLevel: 4 },
  { id: 'web3-architect', name: 'Web3 Architect', category: 'engineering', romaLevel: 4 },
  { id: 'quantum-computing-researcher', name: 'Quantum Computing Researcher', category: 'research', romaLevel: 4 },
  { id: 'robotics-engineer', name: 'Robotics Engineer', category: 'engineering', romaLevel: 4 },
  { id: 'iot-specialist', name: 'IoT Specialist', category: 'engineering', romaLevel: 3 },
  { id: 'embedded-systems-engineer', name: 'Embedded Systems Engineer', category: 'engineering', romaLevel: 3 },
  { id: 'ar-vr-developer', name: 'AR/VR Developer', category: 'engineering', romaLevel: 3 },
  { id: 'game-developer', name: 'Game Developer', category: 'engineering', romaLevel: 3 },
];

class EnhancedAgentBatchConfigService extends EventEmitter {
  private static instance: EnhancedAgentBatchConfigService;
  private configuredAgents: Map<string, EnhancedAgentConfig> = new Map();

  private constructor() {
    super();
    this.configureAllAgents();
    console.log(`🤖 Enhanced Agent Batch Config Service initialized with ${this.configuredAgents.size} agents`);
  }

  static getInstance(): EnhancedAgentBatchConfigService {
    if (!EnhancedAgentBatchConfigService.instance) {
      EnhancedAgentBatchConfigService.instance = new EnhancedAgentBatchConfigService();
    }
    return EnhancedAgentBatchConfigService.instance;
  }

  private configureAllAgents(): void {
    remainingAgents.forEach(agent => {
      const fullConfig = this.generateFullConfig(agent);
      this.configuredAgents.set(agent.id!, fullConfig);
    });
  }

  private generateFullConfig(partial: Partial<EnhancedAgentConfig>): EnhancedAgentConfig {
    const category = partial.category || 'engineering';
    const romaLevel = partial.romaLevel || 3;

    return {
      id: partial.id!,
      name: partial.name!,
      category,
      romaLevel,
      status: 'active',
      systemPrompt: this.generateSystemPrompt(partial.name!, category, romaLevel),
      modelConfig: {
        mode: 'auto',
        preferredModel: this.getPreferredModel(category, romaLevel),
        fallbackModels: ['gpt-4o-mini', 'claude-3-haiku'],
        costOptimization: true,
      },
      group: this.getCategoryGroup(category),
      hierarchy: {
        reportsTo: this.getReportsTo(category, romaLevel),
        supervises: romaLevel >= 3 ? [] : undefined,
      },
      protocols: ['A2A', 'MCP'],
      guardrails: {
        parlantCompliance: true,
        securityLevel: romaLevel >= 4 ? 'high' : 'medium',
        piiProtection: true,
      },
      operationMode: romaLevel >= 4 ? 'autonomous' : romaLevel >= 3 ? 'group' : 'supervised',
      languages: ['en'],
      outcomeTypes: this.getOutcomeTypes(category),
      capabilities: this.getCapabilities(category, partial.name!),
      tools: this.getTools(category),
      configuredAt: new Date().toISOString(),
    };
  }

  private generateSystemPrompt(name: string, category: string, romaLevel: number): string {
    return `You are the ${name}, a specialized AI agent in the ${category} domain operating at ROMA Level ${romaLevel}. 
Your primary responsibilities include executing tasks within your expertise area with ${romaLevel >= 3 ? 'autonomous decision-making' : 'human oversight'}.
Always follow Parlant Standards for prompt engineering and maintain compliance with security protocols.
Collaborate effectively with other agents using A2A and MCP protocols when needed.`;
  }

  private getPreferredModel(category: string, romaLevel: number): string {
    if (romaLevel >= 4) return 'claude-3-5-sonnet';
    if (category === 'engineering' || category === 'research') return 'claude-3-5-sonnet';
    if (category === 'creative') return 'gpt-4o';
    return 'gpt-4o-mini';
  }

  private getCategoryGroup(category: string): string {
    const mapping: Record<string, string> = {
      engineering: 'Development',
      creative: 'Creative',
      research: 'Research',
      executive: 'Executive',
      marketing: 'Marketing',
      sales: 'Sales',
      support: 'Support',
      finance: 'Finance',
      hr: 'HR',
      legal: 'Legal',
      operations: 'Operations',
      healthcare: 'Healthcare',
      education: 'Education',
    };
    return mapping[category] || 'General';
  }

  private getReportsTo(category: string, romaLevel: number): string | undefined {
    if (romaLevel >= 4) return undefined;
    const leads: Record<string, string> = {
      engineering: 'cto-agent',
      marketing: 'cmo-agent',
      finance: 'cfo-agent',
      hr: 'chro-agent',
      sales: 'cro-agent',
      operations: 'coo-agent',
      legal: 'clo-agent',
    };
    return leads[category];
  }

  private getOutcomeTypes(category: string): string[] {
    const outcomes: Record<string, string[]> = {
      engineering: ['code', 'architecture', 'documentation', 'deployment'],
      creative: ['design', 'content', 'media', 'brand'],
      marketing: ['campaign', 'analytics', 'content', 'leads'],
      sales: ['proposal', 'contract', 'meeting', 'forecast'],
      finance: ['report', 'analysis', 'budget', 'forecast'],
      hr: ['candidate', 'policy', 'training', 'review'],
      legal: ['contract', 'compliance', 'policy', 'review'],
      operations: ['process', 'optimization', 'report', 'workflow'],
      research: ['paper', 'analysis', 'model', 'insights'],
      healthcare: ['report', 'compliance', 'patient-data', 'protocol'],
      education: ['curriculum', 'assessment', 'content', 'report'],
      executive: ['strategy', 'decision', 'report', 'directive'],
    };
    return outcomes[category] || ['general', 'report', 'analysis'];
  }

  private getCapabilities(category: string, name: string): string[] {
    const baseCapabilities = ['natural-language', 'reasoning', 'task-execution'];
    const categoryCapabilities: Record<string, string[]> = {
      engineering: ['code-generation', 'debugging', 'architecture', 'devops'],
      creative: ['content-creation', 'design-thinking', 'storytelling'],
      marketing: ['campaign-management', 'analytics', 'content-strategy'],
      research: ['data-analysis', 'literature-review', 'hypothesis-generation'],
      finance: ['financial-analysis', 'forecasting', 'compliance'],
    };
    return [...baseCapabilities, ...(categoryCapabilities[category] || [])];
  }

  private getTools(category: string): string[] {
    const tools: Record<string, string[]> = {
      engineering: ['code-execution', 'file-operations', 'web-requests', 'git'],
      creative: ['image-generation', 'text-processing', 'document-tools'],
      marketing: ['web-scraping', 'seo-analytics', 'email-tools'],
      finance: ['data-analysis', 'excel-operations', 'document-tools'],
      research: ['web-search', 'data-analysis', 'document-tools'],
    };
    return tools[category] || ['text-processing', 'web-requests'];
  }

  getConfiguredAgents(): EnhancedAgentConfig[] {
    return Array.from(this.configuredAgents.values());
  }

  getAgentConfig(agentId: string): EnhancedAgentConfig | undefined {
    return this.configuredAgents.get(agentId);
  }

  getAgentsByCategory(category: string): EnhancedAgentConfig[] {
    return this.getConfiguredAgents().filter(a => a.category === category);
  }

  getAgentsByRomaLevel(level: number): EnhancedAgentConfig[] {
    return this.getConfiguredAgents().filter(a => a.romaLevel === level);
  }

  updateAgentConfig(agentId: string, updates: Partial<EnhancedAgentConfig>): EnhancedAgentConfig | null {
    const existing = this.configuredAgents.get(agentId);
    if (!existing) return null;

    const updated = { ...existing, ...updates, configuredAt: new Date().toISOString() };
    this.configuredAgents.set(agentId, updated);
    this.emit('agent:updated', updated);
    return updated;
  }

  exportConfigurations(): string {
    const configs = this.getConfiguredAgents();
    return JSON.stringify(configs, null, 2);
  }

  importConfigurations(json: string): number {
    try {
      const configs: EnhancedAgentConfig[] = JSON.parse(json);
      let imported = 0;
      configs.forEach(config => {
        this.configuredAgents.set(config.id, config);
        imported++;
      });
      return imported;
    } catch (error) {
      throw new Error('Invalid configuration JSON');
    }
  }
}

export const enhancedAgentBatchConfigService = EnhancedAgentBatchConfigService.getInstance();
