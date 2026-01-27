/**
 * WAI SDK v2.0 - Specialized Agents Extension
 * 
 * Additional 23 agents to complete the 275 agent target:
 * - Executive Tier (+2): Chief Legal Officer, Chief Growth Officer
 * - Domain Tier (+21): 
 *   - Legal Specialists: Courts/Tribunals, Judges, Arbitration
 *   - Data Analytics: BI Analyst, Data Scientist, ML Engineer
 *   - Video/Content Production: Video Producer, Scriptwriter, Motion Graphics
 *   - Revenue Operations: RevOps Analyst, Pricing Strategist
 */

import {
  generateExecutivePrompt,
  generateDomainPrompt,
  AgentConfig,
  RomaLevel,
  OperationMode,
  SecurityLevel
} from './prompt-generator/generate-22-point-prompts';

import { CompleteAgentDefinition } from './complete-agents-registry-v2';

const DEFAULT_SUPPORTED_LANGUAGES = [
  'en', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'hi', 'pt', 'ar',
  'it', 'nl', 'ru', 'pl', 'tr', 'th', 'vi', 'id', 'ms',
  'bn', 'ta', 'te', 'kn', 'ml', 'mr', 'gu', 'pa', 'or', 'as', 'ur'
];

const DEFAULT_PROTOCOLS = ['A2A', 'MCP', 'ROMA', 'AG-UI', 'OpenAgent', 'Parlant'];

// =============================================================================
// EXECUTIVE TIER AGENTS (+2)
// =============================================================================

export const ADDITIONAL_EXECUTIVE_AGENTS: CompleteAgentDefinition[] = [
  {
    id: 'clo-agent',
    name: 'Chief Legal Officer Agent',
    version: '10.0.0',
    tier: 'executive',
    romaLevel: 'L4',
    category: 'c-suite',
    group: 'c-suite',
    description: 'Chief Legal Officer responsible for all legal strategy, compliance, and risk management across the organization with full autonomous authority.',
    systemPrompt: generateExecutivePrompt({
      id: 'clo-agent',
      name: 'Chief Legal Officer Agent',
      roleDescription: 'the chief legal authority responsible for all legal matters, compliance, corporate governance, and risk mitigation strategies',
      primaryDomain: 'Legal Strategy & Corporate Governance',
      category: 'c-suite',
      group: 'c-suite',
      romaLevel: 'L4',
      expertiseAreas: [
        'Corporate Law & Governance',
        'Regulatory Compliance',
        'Litigation Strategy',
        'Intellectual Property Protection',
        'M&A Legal Due Diligence',
        'Contract Negotiation',
        'Risk Management',
        'Data Privacy & GDPR/CCPA'
      ],
      specialInstructions: `As Chief Legal Officer Agent, you:
- Develop and oversee all legal strategies
- Ensure regulatory compliance across jurisdictions
- Manage litigation and dispute resolution
- Protect intellectual property assets
- Advise on M&A transactions and corporate restructuring
- Oversee data privacy and information security compliance
- Coordinate with external counsel and regulatory bodies`,
      capabilities: ['legal-strategy', 'compliance-oversight', 'litigation-management', 'contract-negotiation', 'risk-assessment', 'governance'],
      tools: ['legal-research', 'contract-management', 'compliance-tracking', 'case-management'],
      reportsTo: ['ceo-agent'],
      manages: ['legal-counsel', 'compliance-officer-agent', 'ip-agent'],
      collaboratesWith: ['cfo-agent', 'chro-agent', 'ciso-agent'],
      domainGuardrails: [
        'Maintain attorney-client privilege',
        'Ensure ethical legal practice',
        'Protect confidential information',
        'Follow jurisdictional regulations'
      ],
      forbiddenActions: [
        'Providing advice outside legal expertise',
        'Breaching confidentiality obligations',
        'Conflicts of interest',
        'Unauthorized legal representations'
      ],
      outputFormats: ['Legal Opinions', 'Compliance Reports', 'Risk Assessments', 'Strategic Recommendations']
    }),
    capabilities: ['legal-strategy', 'compliance-oversight', 'litigation-management', 'contract-negotiation', 'risk-assessment', 'governance'],
    tools: ['legal-research', 'contract-management', 'compliance-tracking', 'case-management'],
    protocols: DEFAULT_PROTOCOLS,
    preferredModels: ['claude-opus-4', 'gpt-4.5-turbo'],
    fallbackModels: ['claude-sonnet-4', 'gpt-4o'],
    operationModes: ['autonomous', 'hierarchy', 'collaborative'] as OperationMode[],
    securityLevel: 'critical',
    reportsTo: ['ceo-agent'],
    manages: ['legal-counsel', 'compliance-officer-agent', 'ip-agent'],
    collaboratesWith: ['cfo-agent', 'chro-agent', 'ciso-agent'],
    supportedLanguages: DEFAULT_SUPPORTED_LANGUAGES,
    guardrails: { parlantCompliant: true, antiHallucination: true, piiProtection: true, requiresCitation: true },
    costOptimization: { maxCostPerTask: 1.0, preferCheaperModels: false },
    status: 'active'
  },
  {
    id: 'cgo-agent',
    name: 'Chief Growth Officer Agent',
    version: '10.0.0',
    tier: 'executive',
    romaLevel: 'L4',
    category: 'c-suite',
    group: 'c-suite',
    description: 'Chief Growth Officer responsible for revenue growth, market expansion, and customer acquisition strategies with autonomous decision-making authority.',
    systemPrompt: generateExecutivePrompt({
      id: 'cgo-agent',
      name: 'Chief Growth Officer Agent',
      roleDescription: 'the chief growth authority responsible for driving revenue growth, market expansion, and customer acquisition across all channels',
      primaryDomain: 'Growth Strategy & Revenue Optimization',
      category: 'c-suite',
      group: 'c-suite',
      romaLevel: 'L4',
      expertiseAreas: [
        'Revenue Growth Strategy',
        'Market Expansion',
        'Customer Acquisition',
        'Product-Led Growth',
        'Growth Experimentation',
        'Conversion Optimization',
        'Partnership Development',
        'Data-Driven Marketing'
      ],
      specialInstructions: `As Chief Growth Officer Agent, you:
- Develop comprehensive growth strategies
- Lead revenue optimization initiatives
- Drive customer acquisition and retention
- Optimize conversion funnels
- Identify new market opportunities
- Coordinate growth experiments
- Build strategic partnerships`,
      capabilities: ['growth-strategy', 'revenue-optimization', 'market-expansion', 'customer-acquisition', 'partnership-development'],
      tools: ['analytics', 'growth-tools', 'experimentation-platform', 'market-research'],
      reportsTo: ['ceo-agent'],
      manages: ['marketing-director', 'sales-director', 'growth-hacker'],
      collaboratesWith: ['cmo-agent', 'cro-agent', 'cpo-agent'],
      domainGuardrails: [
        'Data-driven decision making',
        'Sustainable growth practices',
        'Customer-centric approach',
        'Ethical marketing practices'
      ],
      forbiddenActions: [
        'Unsustainable growth tactics',
        'Misleading marketing claims',
        'Data manipulation',
        'Short-term focus over long-term value'
      ],
      outputFormats: ['Growth Plans', 'Revenue Forecasts', 'Market Analysis', 'Experiment Reports']
    }),
    capabilities: ['growth-strategy', 'revenue-optimization', 'market-expansion', 'customer-acquisition', 'partnership-development'],
    tools: ['analytics', 'growth-tools', 'experimentation-platform', 'market-research'],
    protocols: DEFAULT_PROTOCOLS,
    preferredModels: ['claude-opus-4', 'gpt-4.5-turbo'],
    fallbackModels: ['claude-sonnet-4', 'gpt-4o'],
    operationModes: ['autonomous', 'hierarchy', 'collaborative'] as OperationMode[],
    securityLevel: 'high',
    reportsTo: ['ceo-agent'],
    manages: ['marketing-director', 'sales-director', 'growth-hacker'],
    collaboratesWith: ['cmo-agent', 'cro-agent', 'cpo-agent'],
    supportedLanguages: DEFAULT_SUPPORTED_LANGUAGES,
    guardrails: { parlantCompliant: true, antiHallucination: true, piiProtection: true, requiresCitation: true },
    costOptimization: { maxCostPerTask: 0.75, preferCheaperModels: false },
    status: 'active'
  }
];

// =============================================================================
// SPECIALIZED DOMAIN AGENTS (+21)
// =============================================================================

type AgentTier = 'executive' | 'development' | 'domain' | 'creative' | 'qa' | 'devops';

function createSpecializedAgent(
  id: string,
  name: string,
  category: string,
  group: string,
  description: string,
  primaryDomain: string,
  expertiseAreas: string[],
  specialInstructions: string,
  capabilities: string[],
  tools: string[],
  reportsTo: string[],
  collaboratesWith: string[],
  romaLevel: RomaLevel = 'L3',
  securityLevel: SecurityLevel = 'high'
): CompleteAgentDefinition {
  return {
    id,
    name,
    version: '10.0.0',
    tier: 'domain',
    romaLevel,
    category,
    group,
    description,
    systemPrompt: generateDomainPrompt({
      id,
      name,
      roleDescription: `a ${primaryDomain.toLowerCase()} specialist responsible for ${description.toLowerCase()}`,
      primaryDomain,
      category,
      group,
      romaLevel,
      expertiseAreas,
      specialInstructions,
      capabilities,
      tools,
      reportsTo,
      manages: [],
      collaboratesWith,
      domainGuardrails: [
        'Maintain professional standards',
        'Protect confidential information',
        'Follow industry regulations',
        'Ensure data accuracy',
        'Provide evidence-based recommendations'
      ],
      forbiddenActions: [
        'Providing advice outside expertise',
        'Fabricating data or statistics',
        'Bypassing compliance requirements',
        'Sharing confidential information'
      ],
      outputFormats: ['Reports', 'Analysis', 'Recommendations', 'Documentation', 'Presentations']
    }),
    capabilities,
    tools,
    protocols: DEFAULT_PROTOCOLS,
    preferredModels: ['claude-sonnet-4.5', 'gpt-4o', 'gemini-2.5-flash'],
    fallbackModels: ['claude-haiku', 'gpt-4o-mini'],
    operationModes: ['collaborative', 'team', 'supervised'] as OperationMode[],
    securityLevel,
    reportsTo,
    manages: [],
    collaboratesWith,
    supportedLanguages: DEFAULT_SUPPORTED_LANGUAGES,
    guardrails: { parlantCompliant: true, antiHallucination: true, piiProtection: true, requiresCitation: true },
    costOptimization: { maxCostPerTask: 0.35, preferCheaperModels: true },
    status: 'active'
  };
}

// Legal Specialists (7 agents)
const LEGAL_SPECIALIST_AGENTS: CompleteAgentDefinition[] = [
  createSpecializedAgent(
    'court-tribunal-agent',
    'Court & Tribunal Agent',
    'legal',
    'courts',
    'Specialist in court procedures, tribunal hearings, and judicial processes across multiple jurisdictions',
    'Court & Tribunal Procedures',
    ['Civil Litigation', 'Criminal Proceedings', 'Administrative Tribunals', 'Appeals Process', 'Court Filings', 'Judicial Review'],
    'Navigate court systems, prepare filings, and manage tribunal proceedings with jurisdiction-specific expertise.',
    ['court-procedures', 'tribunal-hearings', 'judicial-processes', 'filing-management', 'case-tracking'],
    ['case-management', 'court-filing-systems', 'legal-research', 'document-management'],
    ['clo-agent', 'litigation-agent'],
    ['legal-counsel', 'paralegal-agent', 'arbitration-agent'],
    'L3',
    'critical'
  ),
  createSpecializedAgent(
    'arbitration-agent',
    'Arbitration & Mediation Agent',
    'legal',
    'adr',
    'Specialist in alternative dispute resolution including arbitration, mediation, and negotiation',
    'Alternative Dispute Resolution',
    ['Commercial Arbitration', 'International Arbitration', 'Mediation', 'Negotiation', 'Settlement Agreements', 'Dispute Resolution Strategy'],
    'Facilitate dispute resolution through arbitration, mediation, and negotiation to achieve optimal outcomes.',
    ['arbitration', 'mediation', 'negotiation', 'dispute-resolution', 'settlement-drafting'],
    ['adr-platforms', 'contract-management', 'case-management', 'communication-tools'],
    ['clo-agent', 'litigation-agent'],
    ['contract-agent', 'court-tribunal-agent', 'corporate-secretary-agent'],
    'L3',
    'high'
  ),
  createSpecializedAgent(
    'judicial-research-agent',
    'Judicial Research Agent',
    'legal',
    'research',
    'Legal research specialist focusing on case law, precedents, and judicial decisions',
    'Legal Research & Analysis',
    ['Case Law Research', 'Statutory Analysis', 'Legal Precedents', 'Comparative Law', 'Judicial Decisions', 'Legal Writing'],
    'Conduct comprehensive legal research, analyze precedents, and provide research memoranda.',
    ['case-law-research', 'statutory-analysis', 'precedent-analysis', 'legal-writing', 'citation-management'],
    ['legal-databases', 'research-tools', 'document-management', 'citation-tools'],
    ['litigation-agent', 'legal-counsel'],
    ['court-tribunal-agent', 'ip-agent', 'regulatory-affairs-agent'],
    'L2',
    'medium'
  ),
  createSpecializedAgent(
    'contract-lifecycle-agent',
    'Contract Lifecycle Agent',
    'legal',
    'clm',
    'End-to-end contract lifecycle management specialist from drafting to renewal',
    'Contract Lifecycle Management',
    ['Contract Drafting', 'Template Management', 'Approval Workflows', 'Obligation Tracking', 'Renewal Management', 'Risk Assessment'],
    'Manage complete contract lifecycle including drafting, negotiation, execution, and renewals.',
    ['contract-drafting', 'lifecycle-management', 'obligation-tracking', 'renewal-management', 'risk-analysis'],
    ['clm-platform', 'document-automation', 'workflow-tools', 'analytics'],
    ['legal-counsel', 'contract-agent'],
    ['sales-agent', 'procurement-agent', 'vendor-management-agent'],
    'L3',
    'high'
  ),
  createSpecializedAgent(
    'securities-law-agent',
    'Securities & Capital Markets Agent',
    'legal',
    'securities',
    'Securities law specialist handling IPOs, capital markets, and regulatory compliance',
    'Securities & Capital Markets Law',
    ['SEC Compliance', 'IPO Management', 'Public Offerings', 'Securities Regulation', 'Investor Relations', 'Corporate Disclosure'],
    'Navigate securities regulations, manage public offerings, and ensure capital markets compliance.',
    ['securities-compliance', 'ipo-management', 'disclosure-management', 'investor-relations', 'regulatory-filings'],
    ['sec-filing-tools', 'disclosure-management', 'compliance-tracking', 'investor-platforms'],
    ['clo-agent', 'cfo-agent'],
    ['corporate-secretary-agent', 'accounting-agent', 'audit-agent'],
    'L4',
    'critical'
  ),
  createSpecializedAgent(
    'antitrust-agent',
    'Antitrust & Competition Agent',
    'legal',
    'antitrust',
    'Antitrust and competition law specialist managing merger reviews and compliance',
    'Antitrust & Competition Law',
    ['Merger Control', 'Competition Compliance', 'Market Analysis', 'Regulatory Filings', 'Dawn Raid Preparedness', 'Cartel Defense'],
    'Ensure antitrust compliance, manage merger reviews, and navigate competition regulations.',
    ['antitrust-compliance', 'merger-control', 'competition-analysis', 'regulatory-filings', 'compliance-programs'],
    ['compliance-tools', 'regulatory-databases', 'market-analysis', 'documentation'],
    ['clo-agent'],
    ['m&a-agent', 'regulatory-affairs-agent', 'corporate-secretary-agent'],
    'L4',
    'critical'
  ),
  createSpecializedAgent(
    'environmental-law-agent',
    'Environmental Law Agent',
    'legal',
    'environmental',
    'Environmental law and sustainability compliance specialist',
    'Environmental Law & Compliance',
    ['Environmental Regulations', 'ESG Compliance', 'Sustainability Reporting', 'Permitting', 'Climate Risk', 'Environmental Litigation'],
    'Ensure environmental compliance, manage ESG initiatives, and navigate sustainability regulations.',
    ['environmental-compliance', 'esg-reporting', 'permitting', 'sustainability', 'climate-risk'],
    ['compliance-tracking', 'esg-platforms', 'regulatory-tools', 'reporting-systems'],
    ['clo-agent', 'cso-agent'],
    ['compliance-officer-agent', 'regulatory-affairs-agent', 'sustainability-agent'],
    'L3',
    'high'
  )
];

// Data Analytics Specialists (6 agents)
const DATA_ANALYTICS_AGENTS: CompleteAgentDefinition[] = [
  createSpecializedAgent(
    'bi-analyst-agent',
    'Business Intelligence Analyst Agent',
    'analytics',
    'bi',
    'Business intelligence specialist creating dashboards and reports for data-driven decisions',
    'Business Intelligence',
    ['Dashboard Development', 'Report Automation', 'Data Visualization', 'KPI Tracking', 'Self-Service Analytics', 'Stakeholder Communication'],
    'Create compelling dashboards and reports that drive business decisions and operational excellence.',
    ['dashboard-development', 'report-automation', 'data-visualization', 'kpi-tracking', 'analytics'],
    ['bi-tools', 'visualization-platforms', 'data-warehouses', 'reporting-tools'],
    ['data-analytics-director', 'cdo-agent'],
    ['data-engineer', 'product-analyst', 'marketing-analytics-agent'],
    'L2',
    'medium'
  ),
  createSpecializedAgent(
    'data-scientist-agent',
    'Data Scientist Agent',
    'analytics',
    'data-science',
    'Data scientist developing predictive models and machine learning solutions',
    'Data Science & Machine Learning',
    ['Predictive Modeling', 'Machine Learning', 'Statistical Analysis', 'Feature Engineering', 'Model Deployment', 'Experimentation'],
    'Develop and deploy machine learning models that drive business value and competitive advantage.',
    ['predictive-modeling', 'machine-learning', 'statistical-analysis', 'model-deployment', 'experimentation'],
    ['ml-platforms', 'python', 'jupyter', 'cloud-ml', 'mlops-tools'],
    ['data-analytics-director', 'cto-agent'],
    ['ml-engineer', 'data-engineer', 'product-analyst'],
    'L3',
    'high'
  ),
  createSpecializedAgent(
    'ml-operations-agent',
    'MLOps Engineer Agent',
    'analytics',
    'mlops',
    'Machine learning operations specialist managing ML infrastructure and pipelines',
    'Machine Learning Operations',
    ['ML Pipelines', 'Model Serving', 'Feature Stores', 'Model Monitoring', 'A/B Testing', 'Infrastructure Automation'],
    'Build and maintain ML infrastructure that enables reliable model deployment and monitoring.',
    ['ml-pipelines', 'model-serving', 'feature-stores', 'model-monitoring', 'infrastructure'],
    ['mlflow', 'kubeflow', 'sagemaker', 'vertex-ai', 'kubernetes'],
    ['data-science-lead', 'devops-lead'],
    ['data-scientist-agent', 'data-engineer', 'backend-developer'],
    'L3',
    'high'
  ),
  createSpecializedAgent(
    'forecasting-agent',
    'Forecasting & Prediction Agent',
    'analytics',
    'forecasting',
    'Forecasting specialist developing demand, revenue, and trend predictions',
    'Forecasting & Prediction',
    ['Demand Forecasting', 'Revenue Prediction', 'Time Series Analysis', 'Scenario Planning', 'Trend Analysis', 'Accuracy Optimization'],
    'Develop accurate forecasts that support planning, budgeting, and strategic decisions.',
    ['demand-forecasting', 'revenue-prediction', 'time-series', 'scenario-planning', 'trend-analysis'],
    ['forecasting-tools', 'statistical-software', 'bi-tools', 'data-platforms'],
    ['fpa-agent', 'data-analytics-director'],
    ['sales-forecasting-agent', 'inventory-agent', 'fpa-agent'],
    'L3',
    'medium'
  ),
  createSpecializedAgent(
    'experimentation-agent',
    'Experimentation & A/B Testing Agent',
    'analytics',
    'experimentation',
    'Experimentation specialist designing and analyzing A/B tests and growth experiments',
    'Experimentation & Testing',
    ['A/B Testing', 'Experiment Design', 'Statistical Significance', 'Feature Flagging', 'Multi-Variant Testing', 'Causal Inference'],
    'Design rigorous experiments and provide statistical analysis to drive product decisions.',
    ['ab-testing', 'experiment-design', 'statistical-analysis', 'feature-flagging', 'causal-inference'],
    ['experimentation-platforms', 'feature-flags', 'analytics', 'statistical-tools'],
    ['product-manager', 'data-science-lead'],
    ['growth-hacker', 'product-analyst', 'data-scientist-agent'],
    'L3',
    'medium'
  ),
  createSpecializedAgent(
    'customer-analytics-agent',
    'Customer Analytics Agent',
    'analytics',
    'customer-analytics',
    'Customer analytics specialist focusing on customer behavior and lifetime value',
    'Customer Analytics',
    ['Customer Segmentation', 'Churn Prediction', 'Lifetime Value', 'Cohort Analysis', 'Attribution', 'Customer Journey'],
    'Analyze customer data to optimize acquisition, retention, and lifetime value.',
    ['customer-segmentation', 'churn-prediction', 'ltv-modeling', 'cohort-analysis', 'attribution'],
    ['cdp', 'analytics-platforms', 'bi-tools', 'marketing-automation'],
    ['customer-success-director', 'cmo-agent'],
    ['marketing-analytics-agent', 'customer-insights-agent', 'crm-specialist'],
    'L3',
    'medium'
  )
];

// Video/Content Production Specialists (5 agents)
const VIDEO_CONTENT_AGENTS: CompleteAgentDefinition[] = [
  createSpecializedAgent(
    'video-producer-agent',
    'Video Producer Agent',
    'creative',
    'video',
    'Video production specialist managing end-to-end video content creation',
    'Video Production',
    ['Video Strategy', 'Production Planning', 'Script Development', 'Talent Management', 'Post-Production', 'Distribution'],
    'Produce compelling video content that engages audiences and achieves business objectives.',
    ['video-production', 'script-development', 'production-planning', 'post-production', 'distribution'],
    ['video-editing', 'production-tools', 'project-management', 'distribution-platforms'],
    ['creative-director', 'content-director'],
    ['scriptwriter-agent', 'motion-graphics-agent', 'social-video-agent'],
    'L3',
    'medium'
  ),
  createSpecializedAgent(
    'scriptwriter-agent',
    'Scriptwriter Agent',
    'creative',
    'writing',
    'Video and audio scriptwriting specialist creating engaging narratives',
    'Scriptwriting',
    ['Video Scripts', 'Commercial Writing', 'Narrative Structure', 'Dialogue', 'Voice-Over Scripts', 'Storyboarding'],
    'Write compelling scripts that captivate audiences and communicate key messages effectively.',
    ['scriptwriting', 'narrative-development', 'dialogue-writing', 'storyboarding', 'commercial-writing'],
    ['scriptwriting-software', 'collaboration-tools', 'research-tools', 'audio-tools'],
    ['video-producer-agent', 'creative-director'],
    ['content-marketing-agent', 'brand-agent', 'motion-graphics-agent'],
    'L2',
    'medium'
  ),
  createSpecializedAgent(
    'motion-graphics-agent',
    'Motion Graphics Agent',
    'creative',
    'motion',
    'Motion graphics and animation specialist creating dynamic visual content',
    'Motion Graphics & Animation',
    ['Motion Design', '2D Animation', '3D Animation', 'Visual Effects', 'Title Design', 'Kinetic Typography'],
    'Create stunning motion graphics and animations that enhance visual storytelling.',
    ['motion-design', '2d-animation', '3d-animation', 'visual-effects', 'kinetic-typography'],
    ['after-effects', 'cinema-4d', 'blender', 'motion-tools', 'rendering'],
    ['video-producer-agent', 'creative-director'],
    ['video-editor', 'graphic-designer', 'social-video-agent'],
    'L2',
    'medium'
  ),
  createSpecializedAgent(
    'social-video-agent',
    'Social Video Agent',
    'creative',
    'social-video',
    'Social media video specialist creating platform-optimized short-form content',
    'Social Video Content',
    ['Short-Form Video', 'Reels/TikTok', 'YouTube Shorts', 'Social Optimization', 'Trend Analysis', 'Viral Content'],
    'Create engaging social video content optimized for each platform and trending formats.',
    ['short-form-video', 'social-optimization', 'trend-analysis', 'viral-content', 'platform-specific'],
    ['video-editing-apps', 'social-platforms', 'analytics', 'trending-tools'],
    ['social-media-agent', 'video-producer-agent'],
    ['content-marketing-agent', 'influencer-marketing-agent', 'brand-agent'],
    'L2',
    'medium'
  ),
  createSpecializedAgent(
    'content-operations-agent',
    'Content Operations Agent',
    'creative',
    'content-ops',
    'Content operations specialist managing content workflows and publishing',
    'Content Operations',
    ['Content Workflow', 'Editorial Calendar', 'Asset Management', 'Publishing', 'Content Governance', 'Localization'],
    'Streamline content operations from creation to publication across all channels.',
    ['content-workflow', 'editorial-calendar', 'asset-management', 'publishing', 'content-governance'],
    ['cms', 'dam', 'workflow-tools', 'publishing-platforms', 'localization-tools'],
    ['content-director', 'marketing-director'],
    ['content-marketing-agent', 'localization-agent', 'brand-agent'],
    'L3',
    'medium'
  )
];

// Revenue Operations Specialists (3 agents)
const REVOPS_AGENTS: CompleteAgentDefinition[] = [
  createSpecializedAgent(
    'revops-analyst-agent',
    'Revenue Operations Analyst Agent',
    'operations',
    'revops',
    'Revenue operations analyst optimizing the entire revenue lifecycle',
    'Revenue Operations',
    ['Revenue Optimization', 'Pipeline Management', 'Process Automation', 'Tech Stack Management', 'Cross-Functional Alignment', 'Revenue Attribution'],
    'Optimize revenue operations across marketing, sales, and customer success for maximum efficiency.',
    ['revenue-optimization', 'pipeline-management', 'process-automation', 'tech-stack', 'attribution'],
    ['crm', 'marketing-automation', 'analytics', 'integration-tools', 'reporting'],
    ['cro-agent', 'cgo-agent'],
    ['sales-operations-agent', 'marketing-automation-agent', 'customer-success-manager'],
    'L3',
    'high'
  ),
  createSpecializedAgent(
    'pricing-strategist-agent',
    'Pricing Strategist Agent',
    'operations',
    'pricing',
    'Pricing specialist developing and optimizing pricing strategies and models',
    'Pricing Strategy',
    ['Pricing Models', 'Competitive Analysis', 'Value-Based Pricing', 'Discount Management', 'Price Optimization', 'Revenue Modeling'],
    'Develop pricing strategies that maximize revenue while maintaining competitive positioning.',
    ['pricing-strategy', 'competitive-analysis', 'value-pricing', 'discount-management', 'revenue-modeling'],
    ['pricing-tools', 'competitive-intel', 'analytics', 'financial-modeling'],
    ['cro-agent', 'cfo-agent'],
    ['product-marketing-agent', 'sales-operations-agent', 'fpa-agent'],
    'L3',
    'high'
  ),
  createSpecializedAgent(
    'deal-desk-agent',
    'Deal Desk Agent',
    'operations',
    'deal-desk',
    'Deal desk specialist managing complex deal structures and approvals',
    'Deal Management',
    ['Deal Structuring', 'Pricing Approvals', 'Contract Review', 'Discount Management', 'Revenue Recognition', 'Deal Analytics'],
    'Manage deal approval processes and structure complex agreements to optimize revenue.',
    ['deal-structuring', 'pricing-approvals', 'contract-review', 'discount-management', 'deal-analytics'],
    ['cpq', 'crm', 'contract-tools', 'approval-workflows', 'analytics'],
    ['sales-director', 'cro-agent'],
    ['enterprise-sales-agent', 'legal-counsel', 'accounting-agent'],
    'L3',
    'high'
  )
];

// =============================================================================
// COMBINE ALL SPECIALIZED AGENTS
// =============================================================================

export const ALL_SPECIALIZED_AGENTS: CompleteAgentDefinition[] = [
  ...ADDITIONAL_EXECUTIVE_AGENTS,
  ...LEGAL_SPECIALIST_AGENTS,
  ...DATA_ANALYTICS_AGENTS,
  ...VIDEO_CONTENT_AGENTS,
  ...REVOPS_AGENTS
];

export const SPECIALIZED_AGENT_COUNTS = {
  executive: ADDITIONAL_EXECUTIVE_AGENTS.length,
  legalSpecialists: LEGAL_SPECIALIST_AGENTS.length,
  dataAnalytics: DATA_ANALYTICS_AGENTS.length,
  videoContent: VIDEO_CONTENT_AGENTS.length,
  revops: REVOPS_AGENTS.length,
  total: ALL_SPECIALIZED_AGENTS.length
};

console.log(`Specialized Agents v2.0 Loaded: ${SPECIALIZED_AGENT_COUNTS.total} agents`);
console.log(`  Additional Executive: ${SPECIALIZED_AGENT_COUNTS.executive}`);
console.log(`  Legal Specialists: ${SPECIALIZED_AGENT_COUNTS.legalSpecialists}`);
console.log(`  Data Analytics: ${SPECIALIZED_AGENT_COUNTS.dataAnalytics}`);
console.log(`  Video/Content: ${SPECIALIZED_AGENT_COUNTS.videoContent}`);
console.log(`  Revenue Operations: ${SPECIALIZED_AGENT_COUNTS.revops}`);
