/**
 * Agentic Groups Service - Sector-Based Agent Swarms
 * 
 * Manages sector-based agent groups that operate as coordinated swarms.
 * Enables users to create "Company of Agents" by assembling groups.
 * 
 * Sectors: Financial, Marketing, Sales, Content, Logistics, HR, Technology, Legal
 * 
 * Each sector group contains:
 * - Head Agent (L4): Strategic leadership, team creation
 * - Specialist Agents (L2-L3): Domain expertise
 * - Swarm Coordination: Collaborative task execution
 * - Hierarchy: Clear escalation paths
 */

import { EventEmitter } from 'events';

export interface AgentReference {
  id: string;
  name: string;
  tier: 'executive' | 'development' | 'creative' | 'qa' | 'devops' | 'domain';
  romaLevel: 'L1' | 'L2' | 'L3' | 'L4';
  role: 'head' | 'specialist' | 'support';
  capabilities: string[];
}

export interface SectorGroup {
  id: string;
  name: string;
  sector: SectorType;
  description: string;
  icon: string;
  color: string;
  headAgent: AgentReference;
  specialistAgents: AgentReference[];
  supportAgents: AgentReference[];
  coordinationPattern: 'hierarchical' | 'swarm' | 'collaborative' | 'pipeline';
  decisionMaking: 'consensus' | 'head-decides' | 'evidence-based' | 'democratic';
  capabilities: string[];
  useCases: string[];
  status: 'active' | 'configuring' | 'disabled';
  createdAt: Date;
  updatedAt: Date;
}

export type SectorType = 
  | 'financial'
  | 'marketing'
  | 'sales'
  | 'content'
  | 'logistics'
  | 'hr'
  | 'technology'
  | 'legal'
  | 'operations'
  | 'customer-success'
  | 'product'
  | 'research';

export interface CompanyOfAgents {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  sectorGroups: string[];
  standaloneAgents: string[];
  customAgents: CustomAgentDefinition[];
  ceoAgent?: AgentReference;
  coordinationMode: 'centralized' | 'distributed' | 'hybrid';
  communicationProtocol: 'a2a' | 'mcp' | 'openagent' | 'custom';
  memorySharing: 'full' | 'selective' | 'none';
  status: 'active' | 'draft' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
}

export interface CustomAgentDefinition {
  id: string;
  name: string;
  description: string;
  baseAgentId?: string;
  tier: 'executive' | 'development' | 'creative' | 'qa' | 'devops' | 'domain';
  romaLevel: 'L1' | 'L2' | 'L3' | 'L4';
  capabilities: string[];
  tools: string[];
  systemPromptOverrides?: Partial<EnhancedSystemPrompt>;
  status: 'active' | 'draft';
}

export interface EnhancedSystemPrompt {
  identity: {
    name: string;
    id: string;
    tier: string;
    vertical: string;
    romaLevel: string;
    version: string;
  };
  coreCapabilities: string[];
  romaStandards: {
    level: string;
    autonomyScope: string;
    escalationTriggers: string[];
  };
  bmadCompliance: {
    businessAlignment: string;
    marketAwareness: string;
    architecture: string;
    development: string;
  };
  a2aProtocol: {
    discoveryMethod: string;
    negotiationRules: string[];
    handoffProtocol: string;
    conflictResolution: string;
  };
  mcpContext: {
    assignedTools: string[];
    contextPreservation: string;
    sharedContext: string[];
  };
  intelligence: {
    selfLearning: string[];
    llmAwareness: string;
    modelSelection: Record<string, string>;
  };
  hierarchy: {
    reportsTo: string;
    peers: string[];
    directReports: string[];
  };
  guardrails: {
    parlantStandards: string[];
    securityRules: string[];
    outputStandards: string[];
  };
  tools: string[];
  communicationProtocol: string;
  statusAwareness: string[];
}

export class AgenticGroupsService extends EventEmitter {
  private static instance: AgenticGroupsService;
  private sectorGroups: Map<string, SectorGroup> = new Map();
  private companies: Map<string, CompanyOfAgents> = new Map();

  private constructor() {
    super();
    this.initializeDefaultSectorGroups();
    console.log('🏢 Agentic Groups Service initialized');
  }

  public static getInstance(): AgenticGroupsService {
    if (!AgenticGroupsService.instance) {
      AgenticGroupsService.instance = new AgenticGroupsService();
    }
    return AgenticGroupsService.instance;
  }

  private initializeDefaultSectorGroups(): void {
    this.registerFinancialSector();
    this.registerMarketingSector();
    this.registerSalesSector();
    this.registerContentSector();
    this.registerLogisticsSector();
    this.registerHRSector();
    this.registerTechnologySector();
    this.registerLegalSector();
    this.registerOperationsSector();
    this.registerCustomerSuccessSector();
    this.registerProductSector();
    this.registerResearchSector();

    console.log(`✅ Initialized ${this.sectorGroups.size} sector groups`);
  }

  private registerFinancialSector(): void {
    const group: SectorGroup = {
      id: 'sector-financial',
      name: 'Financial Operations',
      sector: 'financial',
      description: 'Complete financial management including planning, analysis, treasury, tax, and compliance',
      icon: '💰',
      color: '#10B981',
      headAgent: {
        id: 'domain-financial-head',
        name: 'Chief Financial Officer (CFO) Agent',
        tier: 'executive',
        romaLevel: 'L4',
        role: 'head',
        capabilities: ['strategic-planning', 'financial-analysis', 'team-creation', 'budget-management']
      },
      specialistAgents: [
        { id: 'financial-fpa', name: 'FP&A Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['financial-planning', 'forecasting', 'variance-analysis'] },
        { id: 'financial-treasury', name: 'Treasury Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['cash-management', 'liquidity-planning', 'investments'] },
        { id: 'financial-tax', name: 'Tax Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['tax-planning', 'compliance', 'optimization'] },
        { id: 'financial-audit', name: 'Audit Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['internal-audit', 'external-audit', 'controls'] },
        { id: 'financial-risk', name: 'Risk Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['risk-assessment', 'mitigation', 'monitoring'] },
        { id: 'financial-compliance', name: 'Compliance Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['regulatory-compliance', 'policy', 'reporting'] },
        { id: 'financial-investment', name: 'Investment Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['portfolio-management', 'due-diligence', 'roi-analysis'] },
        { id: 'financial-controller', name: 'Controller Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['financial-controls', 'reporting', 'close-process'] }
      ],
      supportAgents: [
        { id: 'financial-arap', name: 'AR/AP Agent', tier: 'domain', romaLevel: 'L2', role: 'support', capabilities: ['accounts-receivable', 'accounts-payable', 'collections'] },
        { id: 'financial-payments', name: 'Payments Agent', tier: 'domain', romaLevel: 'L2', role: 'support', capabilities: ['payment-processing', 'reconciliation'] },
        { id: 'financial-subscriptions', name: 'Subscriptions Agent', tier: 'domain', romaLevel: 'L2', role: 'support', capabilities: ['subscription-billing', 'recurring-revenue'] },
        { id: 'financial-cost', name: 'Cost Accounting Agent', tier: 'domain', romaLevel: 'L2', role: 'support', capabilities: ['cost-analysis', 'allocation', 'optimization'] }
      ],
      coordinationPattern: 'hierarchical',
      decisionMaking: 'evidence-based',
      capabilities: ['financial-planning', 'budgeting', 'forecasting', 'compliance', 'risk-management', 'treasury', 'tax', 'audit'],
      useCases: ['Budget planning', 'Financial reporting', 'Cash flow management', 'Audit preparation', 'Tax optimization'],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.sectorGroups.set(group.id, group);
  }

  private registerMarketingSector(): void {
    const group: SectorGroup = {
      id: 'sector-marketing',
      name: 'Marketing Operations',
      sector: 'marketing',
      description: 'Full-stack marketing including SEO, content, social media, performance marketing, and brand',
      icon: '📣',
      color: '#8B5CF6',
      headAgent: {
        id: 'domain-marketing-head',
        name: 'Chief Marketing Officer (CMO) Agent',
        tier: 'executive',
        romaLevel: 'L4',
        role: 'head',
        capabilities: ['marketing-strategy', 'brand-management', 'campaign-orchestration', 'team-creation']
      },
      specialistAgents: [
        { id: 'marketing-seo', name: 'SEO Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['seo-audit', 'keyword-research', 'technical-seo', 'link-building'] },
        { id: 'marketing-geo', name: 'GEO Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['ai-search-optimization', 'llm-visibility', 'citation-building'] },
        { id: 'marketing-content-strategy', name: 'Content Strategy Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['content-planning', 'editorial-calendar', 'content-audit'] },
        { id: 'marketing-social', name: 'Social Media Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['social-strategy', 'community-management', 'engagement'] },
        { id: 'marketing-performance', name: 'Performance Marketing Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['paid-ads', 'ppc', 'cac-optimization', 'attribution'] },
        { id: 'marketing-email', name: 'Email Marketing Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['email-campaigns', 'automation', 'segmentation'] },
        { id: 'marketing-analytics', name: 'Marketing Analytics Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['attribution', 'roi-analysis', 'funnel-optimization'] },
        { id: 'marketing-growth', name: 'Growth Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['growth-hacking', 'viral-loops', 'retention'] }
      ],
      supportAgents: [
        { id: 'marketing-copywriting', name: 'Copywriting Agent', tier: 'creative', romaLevel: 'L2', role: 'support', capabilities: ['ad-copy', 'landing-pages', 'email-copy'] },
        { id: 'marketing-creative', name: 'Creative Direction Agent', tier: 'creative', romaLevel: 'L3', role: 'support', capabilities: ['visual-strategy', 'brand-guidelines', 'creative-direction'] },
        { id: 'marketing-video', name: 'Video Marketing Agent', tier: 'creative', romaLevel: 'L2', role: 'support', capabilities: ['video-strategy', 'script-writing', 'video-optimization'] },
        { id: 'marketing-influencer', name: 'Influencer Agent', tier: 'domain', romaLevel: 'L2', role: 'support', capabilities: ['influencer-outreach', 'partnership-management'] },
        { id: 'marketing-pr', name: 'PR Agent', tier: 'domain', romaLevel: 'L3', role: 'support', capabilities: ['press-releases', 'media-relations', 'crisis-communication'] },
        { id: 'marketing-brand', name: 'Brand Agent', tier: 'domain', romaLevel: 'L3', role: 'support', capabilities: ['brand-strategy', 'positioning', 'messaging'] },
        { id: 'marketing-web', name: 'Web Marketing Agent', tier: 'development', romaLevel: 'L2', role: 'support', capabilities: ['landing-pages', 'cro', 'web-analytics'] }
      ],
      coordinationPattern: 'swarm',
      decisionMaking: 'consensus',
      capabilities: ['seo', 'geo', 'content-marketing', 'social-media', 'paid-advertising', 'email-marketing', 'brand-management', 'analytics'],
      useCases: ['Campaign launches', 'Brand building', 'Lead generation', 'Content creation', 'Performance optimization'],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.sectorGroups.set(group.id, group);
  }

  private registerSalesSector(): void {
    const group: SectorGroup = {
      id: 'sector-sales',
      name: 'Sales Operations',
      sector: 'sales',
      description: 'End-to-end sales pipeline management from lead generation to closing',
      icon: '🤝',
      color: '#F59E0B',
      headAgent: {
        id: 'domain-sales-head',
        name: 'Chief Sales Officer (CSO) Agent',
        tier: 'executive',
        romaLevel: 'L4',
        role: 'head',
        capabilities: ['sales-strategy', 'pipeline-management', 'quota-setting', 'team-creation']
      },
      specialistAgents: [
        { id: 'sales-lead-gen', name: 'Lead Generation Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['prospecting', 'lead-scoring', 'outbound'] },
        { id: 'sales-outreach', name: 'Outreach Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['cold-outreach', 'follow-up', 'cadence-management'] },
        { id: 'sales-demo', name: 'Demo Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['product-demos', 'discovery-calls', 'qualification'] },
        { id: 'sales-proposal', name: 'Proposal Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['proposal-generation', 'pricing', 'negotiation'] },
        { id: 'sales-closing', name: 'Closing Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['contract-negotiation', 'closing-techniques', 'objection-handling'] },
        { id: 'sales-account', name: 'Account Management Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['account-planning', 'upselling', 'retention'] }
      ],
      supportAgents: [
        { id: 'sales-crm', name: 'CRM Agent', tier: 'domain', romaLevel: 'L2', role: 'support', capabilities: ['crm-management', 'data-entry', 'reporting'] },
        { id: 'sales-pipeline', name: 'Pipeline Agent', tier: 'domain', romaLevel: 'L2', role: 'support', capabilities: ['pipeline-analytics', 'forecasting', 'health-scoring'] },
        { id: 'sales-enablement', name: 'Enablement Agent', tier: 'domain', romaLevel: 'L2', role: 'support', capabilities: ['sales-training', 'collateral', 'playbooks'] }
      ],
      coordinationPattern: 'pipeline',
      decisionMaking: 'head-decides',
      capabilities: ['lead-generation', 'pipeline-management', 'demos', 'proposals', 'closing', 'account-management'],
      useCases: ['Lead qualification', 'Sales automation', 'Pipeline forecasting', 'Deal closing', 'Account growth'],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.sectorGroups.set(group.id, group);
  }

  private registerContentSector(): void {
    const group: SectorGroup = {
      id: 'sector-content',
      name: 'Content Operations',
      sector: 'content',
      description: 'Content creation, management, and distribution across all formats',
      icon: '✍️',
      color: '#EC4899',
      headAgent: {
        id: 'domain-content-head',
        name: 'Chief Content Officer (CCO) Agent',
        tier: 'executive',
        romaLevel: 'L4',
        role: 'head',
        capabilities: ['content-strategy', 'editorial-direction', 'brand-voice', 'team-creation']
      },
      specialistAgents: [
        { id: 'content-writer', name: 'Writer Agent', tier: 'creative', romaLevel: 'L3', role: 'specialist', capabilities: ['long-form', 'blog-posts', 'articles'] },
        { id: 'content-editor', name: 'Editor Agent', tier: 'creative', romaLevel: 'L3', role: 'specialist', capabilities: ['editing', 'proofreading', 'style-guide'] },
        { id: 'content-seo-writer', name: 'SEO Writer Agent', tier: 'creative', romaLevel: 'L3', role: 'specialist', capabilities: ['seo-content', 'keyword-optimization', 'meta-writing'] },
        { id: 'content-copywriter', name: 'Copywriter Agent', tier: 'creative', romaLevel: 'L3', role: 'specialist', capabilities: ['copywriting', 'headlines', 'cta'] },
        { id: 'content-video-script', name: 'Video Script Agent', tier: 'creative', romaLevel: 'L3', role: 'specialist', capabilities: ['video-scripts', 'storyboards', 'narration'] },
        { id: 'content-technical', name: 'Technical Writer Agent', tier: 'creative', romaLevel: 'L3', role: 'specialist', capabilities: ['documentation', 'api-docs', 'tutorials'] }
      ],
      supportAgents: [
        { id: 'content-blog', name: 'Blog Agent', tier: 'creative', romaLevel: 'L2', role: 'support', capabilities: ['blog-management', 'publishing', 'scheduling'] },
        { id: 'content-documentation', name: 'Documentation Agent', tier: 'creative', romaLevel: 'L2', role: 'support', capabilities: ['docs-management', 'versioning', 'organization'] },
        { id: 'content-localization', name: 'Localization Agent', tier: 'creative', romaLevel: 'L2', role: 'support', capabilities: ['translation', 'cultural-adaptation', 'localization'] }
      ],
      coordinationPattern: 'collaborative',
      decisionMaking: 'consensus',
      capabilities: ['content-creation', 'editing', 'seo-writing', 'copywriting', 'technical-writing', 'video-scripting'],
      useCases: ['Blog production', 'Documentation', 'Marketing copy', 'Video content', 'Knowledge base'],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.sectorGroups.set(group.id, group);
  }

  private registerLogisticsSector(): void {
    const group: SectorGroup = {
      id: 'sector-logistics',
      name: 'Logistics & Supply Chain',
      sector: 'logistics',
      description: 'Supply chain management, inventory, shipping, and vendor relationships',
      icon: '🚚',
      color: '#6366F1',
      headAgent: {
        id: 'domain-logistics-head',
        name: 'Chief Operations Officer (COO) Agent',
        tier: 'executive',
        romaLevel: 'L4',
        role: 'head',
        capabilities: ['operations-strategy', 'supply-chain-optimization', 'vendor-management', 'team-creation']
      },
      specialistAgents: [
        { id: 'logistics-supply-chain', name: 'Supply Chain Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['supply-chain-planning', 'demand-forecasting', 'optimization'] },
        { id: 'logistics-inventory', name: 'Inventory Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['inventory-management', 'stock-optimization', 'reorder-points'] },
        { id: 'logistics-shipping', name: 'Shipping Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['shipping-logistics', 'carrier-management', 'route-optimization'] },
        { id: 'logistics-procurement', name: 'Procurement Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['vendor-selection', 'contract-negotiation', 'cost-optimization'] },
        { id: 'logistics-quality', name: 'Quality Agent', tier: 'qa', romaLevel: 'L3', role: 'specialist', capabilities: ['quality-control', 'inspection', 'compliance'] }
      ],
      supportAgents: [
        { id: 'logistics-warehouse', name: 'Warehouse Agent', tier: 'domain', romaLevel: 'L2', role: 'support', capabilities: ['warehouse-management', 'picking-packing', 'storage'] },
        { id: 'logistics-vendor', name: 'Vendor Agent', tier: 'domain', romaLevel: 'L2', role: 'support', capabilities: ['vendor-relations', 'performance-tracking', 'onboarding'] },
        { id: 'logistics-tracking', name: 'Tracking Agent', tier: 'domain', romaLevel: 'L2', role: 'support', capabilities: ['shipment-tracking', 'delivery-updates', 'exceptions'] }
      ],
      coordinationPattern: 'pipeline',
      decisionMaking: 'evidence-based',
      capabilities: ['supply-chain', 'inventory', 'shipping', 'procurement', 'warehouse', 'quality-control'],
      useCases: ['Inventory optimization', 'Shipping coordination', 'Vendor management', 'Demand planning', 'Quality assurance'],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.sectorGroups.set(group.id, group);
  }

  private registerHRSector(): void {
    const group: SectorGroup = {
      id: 'sector-hr',
      name: 'Human Resources',
      sector: 'hr',
      description: 'Complete people operations including recruiting, onboarding, performance, and culture',
      icon: '👥',
      color: '#14B8A6',
      headAgent: {
        id: 'domain-hr-head',
        name: 'Chief Human Resources Officer (CHRO) Agent',
        tier: 'executive',
        romaLevel: 'L4',
        role: 'head',
        capabilities: ['people-strategy', 'culture-development', 'talent-management', 'team-creation']
      },
      specialistAgents: [
        { id: 'hr-recruiting', name: 'Recruiting Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['sourcing', 'screening', 'interviewing', 'hiring'] },
        { id: 'hr-onboarding', name: 'Onboarding Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['onboarding-programs', 'orientation', 'integration'] },
        { id: 'hr-training', name: 'Training Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['training-programs', 'skill-development', 'e-learning'] },
        { id: 'hr-performance', name: 'Performance Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['performance-reviews', 'goal-setting', 'feedback'] },
        { id: 'hr-compensation', name: 'Compensation Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['salary-benchmarking', 'equity', 'compensation-planning'] },
        { id: 'hr-benefits', name: 'Benefits Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['benefits-administration', 'enrollment', 'vendor-management'] }
      ],
      supportAgents: [
        { id: 'hr-culture', name: 'Culture Agent', tier: 'domain', romaLevel: 'L2', role: 'support', capabilities: ['culture-initiatives', 'engagement', 'events'] },
        { id: 'hr-ld', name: 'L&D Agent', tier: 'domain', romaLevel: 'L2', role: 'support', capabilities: ['learning-development', 'career-paths', 'mentoring'] },
        { id: 'hr-hris', name: 'HRIS Agent', tier: 'domain', romaLevel: 'L2', role: 'support', capabilities: ['hris-management', 'data-entry', 'reporting'] }
      ],
      coordinationPattern: 'collaborative',
      decisionMaking: 'consensus',
      capabilities: ['recruiting', 'onboarding', 'training', 'performance-management', 'compensation', 'benefits', 'culture'],
      useCases: ['Hiring automation', 'Employee onboarding', 'Performance reviews', 'Training programs', 'Benefits enrollment'],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.sectorGroups.set(group.id, group);
  }

  private registerTechnologySector(): void {
    const group: SectorGroup = {
      id: 'sector-technology',
      name: 'Technology & Engineering',
      sector: 'technology',
      description: 'Full-stack technology including architecture, development, DevOps, security, and QA',
      icon: '💻',
      color: '#3B82F6',
      headAgent: {
        id: 'domain-tech-head',
        name: 'Chief Technology Officer (CTO) Agent',
        tier: 'executive',
        romaLevel: 'L4',
        role: 'head',
        capabilities: ['tech-strategy', 'architecture-decisions', 'team-leadership', 'team-creation']
      },
      specialistAgents: [
        { id: 'tech-architect', name: 'Solutions Architect Agent', tier: 'development', romaLevel: 'L4', role: 'specialist', capabilities: ['system-design', 'architecture', 'scalability'] },
        { id: 'tech-backend', name: 'Backend Engineer Agent', tier: 'development', romaLevel: 'L3', role: 'specialist', capabilities: ['api-development', 'databases', 'microservices'] },
        { id: 'tech-frontend', name: 'Frontend Engineer Agent', tier: 'development', romaLevel: 'L3', role: 'specialist', capabilities: ['ui-development', 'react', 'performance'] },
        { id: 'tech-fullstack', name: 'Full-Stack Engineer Agent', tier: 'development', romaLevel: 'L3', role: 'specialist', capabilities: ['full-stack', 'integration', 'rapid-development'] },
        { id: 'tech-devops', name: 'DevOps Engineer Agent', tier: 'devops', romaLevel: 'L3', role: 'specialist', capabilities: ['ci-cd', 'infrastructure', 'kubernetes', 'monitoring'] },
        { id: 'tech-security', name: 'Security Engineer Agent', tier: 'devops', romaLevel: 'L3', role: 'specialist', capabilities: ['security-audit', 'vulnerability-assessment', 'penetration-testing'] },
        { id: 'tech-qa', name: 'QA Engineer Agent', tier: 'qa', romaLevel: 'L3', role: 'specialist', capabilities: ['test-automation', 'quality-assurance', 'e2e-testing'] },
        { id: 'tech-data', name: 'Data Engineer Agent', tier: 'development', romaLevel: 'L3', role: 'specialist', capabilities: ['data-pipelines', 'etl', 'data-warehousing'] },
        { id: 'tech-ml', name: 'ML Engineer Agent', tier: 'development', romaLevel: 'L3', role: 'specialist', capabilities: ['ml-models', 'training', 'deployment', 'mlops'] }
      ],
      supportAgents: [
        { id: 'tech-database', name: 'Database Agent', tier: 'development', romaLevel: 'L2', role: 'support', capabilities: ['database-management', 'optimization', 'migrations'] },
        { id: 'tech-cloud', name: 'Cloud Agent', tier: 'devops', romaLevel: 'L2', role: 'support', capabilities: ['cloud-infrastructure', 'aws', 'gcp', 'azure'] },
        { id: 'tech-sre', name: 'SRE Agent', tier: 'devops', romaLevel: 'L2', role: 'support', capabilities: ['reliability', 'incident-response', 'monitoring'] }
      ],
      coordinationPattern: 'collaborative',
      decisionMaking: 'consensus',
      capabilities: ['software-development', 'architecture', 'devops', 'security', 'qa', 'data-engineering', 'ml'],
      useCases: ['Application development', 'Infrastructure management', 'Security audits', 'Test automation', 'Data pipelines'],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.sectorGroups.set(group.id, group);
  }

  private registerLegalSector(): void {
    const group: SectorGroup = {
      id: 'sector-legal',
      name: 'Legal & Compliance',
      sector: 'legal',
      description: 'Legal operations including contracts, compliance, IP, and corporate governance',
      icon: '⚖️',
      color: '#78716C',
      headAgent: {
        id: 'domain-legal-head',
        name: 'Chief Legal Officer (CLO) Agent',
        tier: 'executive',
        romaLevel: 'L4',
        role: 'head',
        capabilities: ['legal-strategy', 'risk-assessment', 'governance', 'team-creation']
      },
      specialistAgents: [
        { id: 'legal-contracts', name: 'Contract Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['contract-drafting', 'review', 'negotiation'] },
        { id: 'legal-compliance', name: 'Compliance Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['regulatory-compliance', 'policy', 'audits'] },
        { id: 'legal-ip', name: 'IP Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['intellectual-property', 'patents', 'trademarks'] },
        { id: 'legal-privacy', name: 'Privacy Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['data-privacy', 'gdpr', 'ccpa'] },
        { id: 'legal-employment', name: 'Employment Law Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['employment-law', 'hr-legal', 'disputes'] },
        { id: 'legal-corporate', name: 'Corporate Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['corporate-governance', 'board-matters', 'm&a'] }
      ],
      supportAgents: [
        { id: 'legal-litigation', name: 'Litigation Agent', tier: 'domain', romaLevel: 'L2', role: 'support', capabilities: ['dispute-resolution', 'litigation-support'] },
        { id: 'legal-paralegal', name: 'Paralegal Agent', tier: 'domain', romaLevel: 'L2', role: 'support', capabilities: ['document-management', 'research', 'filing'] }
      ],
      coordinationPattern: 'hierarchical',
      decisionMaking: 'head-decides',
      capabilities: ['contract-management', 'compliance', 'ip-protection', 'privacy', 'corporate-governance'],
      useCases: ['Contract review', 'Compliance audits', 'IP filing', 'Privacy assessment', 'Legal research'],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.sectorGroups.set(group.id, group);
  }

  private registerOperationsSector(): void {
    const group: SectorGroup = {
      id: 'sector-operations',
      name: 'Business Operations',
      sector: 'operations',
      description: 'Core business operations, process optimization, and efficiency',
      icon: '⚙️',
      color: '#64748B',
      headAgent: {
        id: 'domain-operations-head',
        name: 'VP Operations Agent',
        tier: 'executive',
        romaLevel: 'L4',
        role: 'head',
        capabilities: ['operations-strategy', 'process-optimization', 'efficiency', 'team-creation']
      },
      specialistAgents: [
        { id: 'ops-process', name: 'Process Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['process-design', 'optimization', 'automation'] },
        { id: 'ops-project', name: 'Project Management Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['project-planning', 'execution', 'tracking'] },
        { id: 'ops-analytics', name: 'Business Analytics Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['business-analytics', 'kpis', 'reporting'] }
      ],
      supportAgents: [
        { id: 'ops-admin', name: 'Admin Agent', tier: 'domain', romaLevel: 'L2', role: 'support', capabilities: ['administrative-tasks', 'scheduling', 'coordination'] }
      ],
      coordinationPattern: 'pipeline',
      decisionMaking: 'evidence-based',
      capabilities: ['process-optimization', 'project-management', 'analytics', 'efficiency'],
      useCases: ['Process automation', 'Project tracking', 'KPI monitoring', 'Efficiency analysis'],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.sectorGroups.set(group.id, group);
  }

  private registerCustomerSuccessSector(): void {
    const group: SectorGroup = {
      id: 'sector-customer-success',
      name: 'Customer Success',
      sector: 'customer-success',
      description: 'Customer experience, support, success, and advocacy',
      icon: '🌟',
      color: '#22C55E',
      headAgent: {
        id: 'domain-cs-head',
        name: 'VP Customer Success Agent',
        tier: 'executive',
        romaLevel: 'L4',
        role: 'head',
        capabilities: ['customer-strategy', 'retention', 'expansion', 'team-creation']
      },
      specialistAgents: [
        { id: 'cs-manager', name: 'Customer Success Manager Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['account-management', 'health-scoring', 'expansion'] },
        { id: 'cs-support', name: 'Support Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['ticket-resolution', 'troubleshooting', 'escalation'] },
        { id: 'cs-onboarding', name: 'Customer Onboarding Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['implementation', 'training', 'adoption'] }
      ],
      supportAgents: [
        { id: 'cs-advocacy', name: 'Advocacy Agent', tier: 'domain', romaLevel: 'L2', role: 'support', capabilities: ['customer-advocacy', 'references', 'testimonials'] },
        { id: 'cs-feedback', name: 'Feedback Agent', tier: 'domain', romaLevel: 'L2', role: 'support', capabilities: ['nps', 'surveys', 'feedback-analysis'] }
      ],
      coordinationPattern: 'collaborative',
      decisionMaking: 'consensus',
      capabilities: ['customer-success', 'support', 'onboarding', 'retention', 'advocacy'],
      useCases: ['Customer onboarding', 'Support automation', 'Health monitoring', 'Retention programs', 'NPS improvement'],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.sectorGroups.set(group.id, group);
  }

  private registerProductSector(): void {
    const group: SectorGroup = {
      id: 'sector-product',
      name: 'Product Management',
      sector: 'product',
      description: 'Product strategy, roadmap, UX, and feature development',
      icon: '🎯',
      color: '#EF4444',
      headAgent: {
        id: 'domain-product-head',
        name: 'Chief Product Officer (CPO) Agent',
        tier: 'executive',
        romaLevel: 'L4',
        role: 'head',
        capabilities: ['product-strategy', 'roadmap', 'vision', 'team-creation']
      },
      specialistAgents: [
        { id: 'product-manager', name: 'Product Manager Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['feature-planning', 'prioritization', 'specs'] },
        { id: 'product-ux', name: 'UX Designer Agent', tier: 'creative', romaLevel: 'L3', role: 'specialist', capabilities: ['user-research', 'wireframes', 'prototypes'] },
        { id: 'product-ui', name: 'UI Designer Agent', tier: 'creative', romaLevel: 'L3', role: 'specialist', capabilities: ['visual-design', 'design-systems', 'components'] },
        { id: 'product-analytics', name: 'Product Analytics Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['product-analytics', 'metrics', 'experimentation'] }
      ],
      supportAgents: [
        { id: 'product-research', name: 'User Research Agent', tier: 'creative', romaLevel: 'L2', role: 'support', capabilities: ['user-interviews', 'surveys', 'usability-testing'] }
      ],
      coordinationPattern: 'collaborative',
      decisionMaking: 'consensus',
      capabilities: ['product-management', 'ux-design', 'ui-design', 'analytics', 'research'],
      useCases: ['Feature planning', 'User research', 'Design systems', 'A/B testing', 'Roadmap planning'],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.sectorGroups.set(group.id, group);
  }

  private registerResearchSector(): void {
    const group: SectorGroup = {
      id: 'sector-research',
      name: 'Research & Development',
      sector: 'research',
      description: 'Research, innovation, and experimental development',
      icon: '🔬',
      color: '#A855F7',
      headAgent: {
        id: 'domain-research-head',
        name: 'Chief Research Officer (CRO) Agent',
        tier: 'executive',
        romaLevel: 'L4',
        role: 'head',
        capabilities: ['research-strategy', 'innovation', 'patents', 'team-creation']
      },
      specialistAgents: [
        { id: 'research-scientist', name: 'Research Scientist Agent', tier: 'development', romaLevel: 'L3', role: 'specialist', capabilities: ['research', 'experimentation', 'analysis'] },
        { id: 'research-ml', name: 'ML Research Agent', tier: 'development', romaLevel: 'L3', role: 'specialist', capabilities: ['ml-research', 'model-development', 'papers'] },
        { id: 'research-innovation', name: 'Innovation Agent', tier: 'domain', romaLevel: 'L3', role: 'specialist', capabilities: ['innovation-programs', 'ideation', 'prototyping'] }
      ],
      supportAgents: [
        { id: 'research-data', name: 'Research Data Agent', tier: 'development', romaLevel: 'L2', role: 'support', capabilities: ['data-collection', 'preprocessing', 'datasets'] }
      ],
      coordinationPattern: 'swarm',
      decisionMaking: 'consensus',
      capabilities: ['research', 'ml-development', 'innovation', 'experimentation'],
      useCases: ['Research projects', 'ML model development', 'Innovation sprints', 'Patent filing'],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.sectorGroups.set(group.id, group);
  }

  public getAllSectorGroups(): SectorGroup[] {
    return Array.from(this.sectorGroups.values());
  }

  public getSectorGroup(id: string): SectorGroup | undefined {
    return this.sectorGroups.get(id);
  }

  public getSectorGroupBySector(sector: SectorType): SectorGroup | undefined {
    return Array.from(this.sectorGroups.values()).find(g => g.sector === sector);
  }

  public createCompanyOfAgents(params: {
    name: string;
    description: string;
    ownerId: string;
    sectorGroups: string[];
    standaloneAgents?: string[];
    coordinationMode?: 'centralized' | 'distributed' | 'hybrid';
  }): CompanyOfAgents {
    const company: CompanyOfAgents = {
      id: `company-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: params.name,
      description: params.description,
      ownerId: params.ownerId,
      sectorGroups: params.sectorGroups,
      standaloneAgents: params.standaloneAgents || [],
      customAgents: [],
      coordinationMode: params.coordinationMode || 'hybrid',
      communicationProtocol: 'a2a',
      memorySharing: 'selective',
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {}
    };

    this.companies.set(company.id, company);
    this.emit('company-created', { companyId: company.id, name: company.name });
    
    console.log(`✅ Created Company of Agents: ${company.name} with ${params.sectorGroups.length} sector groups`);
    return company;
  }

  public getCompany(id: string): CompanyOfAgents | undefined {
    return this.companies.get(id);
  }

  public getAllCompanies(): CompanyOfAgents[] {
    return Array.from(this.companies.values());
  }

  public getCompaniesByOwner(ownerId: string): CompanyOfAgents[] {
    return Array.from(this.companies.values()).filter(c => c.ownerId === ownerId);
  }

  public addSectorGroupToCompany(companyId: string, sectorGroupId: string): boolean {
    const company = this.companies.get(companyId);
    if (!company) return false;
    
    if (!company.sectorGroups.includes(sectorGroupId)) {
      company.sectorGroups.push(sectorGroupId);
      company.updatedAt = new Date();
      this.emit('company-updated', { companyId, action: 'add-sector', sectorGroupId });
      return true;
    }
    return false;
  }

  public removeSectorGroupFromCompany(companyId: string, sectorGroupId: string): boolean {
    const company = this.companies.get(companyId);
    if (!company) return false;
    
    const index = company.sectorGroups.indexOf(sectorGroupId);
    if (index > -1) {
      company.sectorGroups.splice(index, 1);
      company.updatedAt = new Date();
      this.emit('company-updated', { companyId, action: 'remove-sector', sectorGroupId });
      return true;
    }
    return false;
  }

  public addStandaloneAgentToCompany(companyId: string, agentId: string): boolean {
    const company = this.companies.get(companyId);
    if (!company) return false;
    
    if (!company.standaloneAgents.includes(agentId)) {
      company.standaloneAgents.push(agentId);
      company.updatedAt = new Date();
      this.emit('company-updated', { companyId, action: 'add-agent', agentId });
      return true;
    }
    return false;
  }

  public addCustomAgentToCompany(companyId: string, agent: CustomAgentDefinition): boolean {
    const company = this.companies.get(companyId);
    if (!company) return false;
    
    company.customAgents.push(agent);
    company.updatedAt = new Date();
    this.emit('company-updated', { companyId, action: 'add-custom-agent', agentId: agent.id });
    return true;
  }

  public activateCompany(companyId: string): boolean {
    const company = this.companies.get(companyId);
    if (!company) return false;
    
    company.status = 'active';
    company.updatedAt = new Date();
    this.emit('company-activated', { companyId });
    console.log(`✅ Activated Company of Agents: ${company.name}`);
    return true;
  }

  public getCompanyStats(companyId: string): {
    totalSectors: number;
    totalAgents: number;
    headAgents: number;
    specialistAgents: number;
    supportAgents: number;
    customAgents: number;
    standaloneAgents: number;
  } | null {
    const company = this.companies.get(companyId);
    if (!company) return null;

    let headAgents = 0;
    let specialistAgents = 0;
    let supportAgents = 0;

    for (const sectorId of company.sectorGroups) {
      const sector = this.sectorGroups.get(sectorId);
      if (sector) {
        headAgents += 1;
        specialistAgents += sector.specialistAgents.length;
        supportAgents += sector.supportAgents.length;
      }
    }

    return {
      totalSectors: company.sectorGroups.length,
      totalAgents: headAgents + specialistAgents + supportAgents + company.customAgents.length + company.standaloneAgents.length,
      headAgents,
      specialistAgents,
      supportAgents,
      customAgents: company.customAgents.length,
      standaloneAgents: company.standaloneAgents.length
    };
  }

  public getSectorStats(): {
    totalSectors: number;
    totalAgents: number;
    byRole: Record<string, number>;
    bySector: Record<string, number>;
  } {
    let totalAgents = 0;
    const byRole: Record<string, number> = { head: 0, specialist: 0, support: 0 };
    const bySector: Record<string, number> = {};

    for (const [id, sector] of this.sectorGroups) {
      const sectorTotal = 1 + sector.specialistAgents.length + sector.supportAgents.length;
      totalAgents += sectorTotal;
      bySector[sector.sector] = sectorTotal;
      byRole.head += 1;
      byRole.specialist += sector.specialistAgents.length;
      byRole.support += sector.supportAgents.length;
    }

    return {
      totalSectors: this.sectorGroups.size,
      totalAgents,
      byRole,
      bySector
    };
  }
}

export const agenticGroupsService = AgenticGroupsService.getInstance();
