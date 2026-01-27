/**
 * WAI SDK v2.0 - Domain, Creative, QA, and DevOps Tier Agents
 * 
 * TIER DISTRIBUTION:
 * - Domain (127): Marketing, Sales, HR, Finance, Legal, Healthcare, Education, etc.
 * - Creative (20): Content, Design, Multimedia
 * - QA (15): Testing, Security, Compliance
 * - DevOps (17): Infrastructure, Deployment, SRE
 */

import {
  generateDomainPrompt,
  generateDevelopmentPrompt,
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
// DOMAIN TIER HELPER FUNCTION
// =============================================================================

type AgentTier = 'executive' | 'development' | 'domain' | 'creative' | 'qa' | 'devops';

function createDomainAgent(
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
  romaLevel: RomaLevel = 'L2',
  securityLevel: SecurityLevel = 'medium',
  tier: AgentTier = 'domain'
): CompleteAgentDefinition {
  return {
    id,
    name,
    version: '10.0.0',
    tier,
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
    costOptimization: { maxCostPerTask: 0.25, preferCheaperModels: true },
    status: 'active'
  };
}

// =============================================================================
// DOMAIN TIER AGENTS (127 Agents)
// =============================================================================

// Marketing Domain (15 agents)
const MARKETING_AGENTS: CompleteAgentDefinition[] = [
  createDomainAgent('content-marketing-agent', 'Content Marketing Agent', 'marketing', 'content', 'Content marketing strategist creating engaging content across channels', 'Content Marketing', ['Content Strategy', 'SEO', 'Blog Writing', 'Content Distribution', 'Content Analytics'], 'Create and optimize content that drives engagement, leads, and brand awareness.', ['content-strategy', 'seo-optimization', 'content-creation', 'analytics'], ['content-tools', 'seo-tools', 'analytics'], ['cmo-agent', 'marketing-director'], ['social-media-agent', 'seo-agent']),
  createDomainAgent('social-media-agent', 'Social Media Agent', 'marketing', 'social', 'Social media specialist managing brand presence across platforms', 'Social Media Marketing', ['Platform Management', 'Community Building', 'Social Analytics', 'Influencer Marketing', 'Paid Social'], 'Manage social media presence, engage communities, and drive social-first campaigns.', ['social-media-management', 'community-building', 'influencer-outreach', 'paid-social'], ['social-tools', 'scheduling-tools', 'analytics'], ['marketing-director'], ['content-marketing-agent', 'brand-agent']),
  createDomainAgent('seo-agent', 'SEO Agent', 'marketing', 'seo', 'Search engine optimization specialist improving organic visibility', 'SEO', ['Technical SEO', 'On-Page SEO', 'Link Building', 'Keyword Research', 'Local SEO'], 'Optimize website and content for search engines to improve organic traffic and rankings.', ['technical-seo', 'on-page-seo', 'link-building', 'keyword-research'], ['seo-tools', 'analytics', 'crawlers'], ['marketing-director'], ['content-marketing-agent', 'web-developer']),
  createDomainAgent('email-marketing-agent', 'Email Marketing Agent', 'marketing', 'email', 'Email marketing specialist driving engagement and conversions', 'Email Marketing', ['Email Campaigns', 'Automation', 'A/B Testing', 'Segmentation', 'Deliverability'], 'Design and execute email campaigns that nurture leads and drive conversions.', ['email-campaigns', 'automation', 'segmentation', 'analytics'], ['email-platform', 'design-tools', 'analytics'], ['marketing-director'], ['content-marketing-agent', 'sales-agent']),
  createDomainAgent('ppc-agent', 'PPC Agent', 'marketing', 'paid-media', 'Pay-per-click advertising specialist managing paid campaigns', 'PPC Advertising', ['Google Ads', 'Meta Ads', 'LinkedIn Ads', 'Programmatic', 'Retargeting'], 'Manage paid advertising campaigns to maximize ROI and achieve marketing objectives.', ['ppc-management', 'bid-optimization', 'audience-targeting', 'conversion-tracking'], ['ad-platforms', 'analytics', 'reporting'], ['marketing-director'], ['analytics-agent', 'content-marketing-agent']),
  createDomainAgent('brand-agent', 'Brand Agent', 'marketing', 'brand', 'Brand strategist maintaining and evolving brand identity', 'Brand Management', ['Brand Strategy', 'Brand Guidelines', 'Brand Positioning', 'Brand Voice', 'Brand Measurement'], 'Develop and maintain brand identity, ensuring consistency across all touchpoints.', ['brand-strategy', 'brand-guidelines', 'brand-positioning'], ['brand-tools', 'design-tools', 'research-tools'], ['cmo-agent'], ['social-media-agent', 'content-marketing-agent']),
  createDomainAgent('marketing-analytics-agent', 'Marketing Analytics Agent', 'marketing', 'analytics', 'Marketing data analyst providing insights and optimization recommendations', 'Marketing Analytics', ['Web Analytics', 'Attribution', 'A/B Testing', 'ROI Analysis', 'Dashboards'], 'Analyze marketing data to provide actionable insights and optimization recommendations.', ['marketing-analytics', 'attribution', 'ab-testing', 'reporting'], ['analytics-platforms', 'bi-tools', 'data-tools'], ['marketing-director'], ['ppc-agent', 'seo-agent', 'email-marketing-agent']),
  createDomainAgent('pr-agent', 'PR Agent', 'marketing', 'public-relations', 'Public relations specialist managing media and public perception', 'Public Relations', ['Media Relations', 'Press Releases', 'Crisis Communications', 'Event PR', 'Thought Leadership'], 'Manage public relations, media relationships, and organizational reputation.', ['media-relations', 'press-releases', 'crisis-management'], ['pr-tools', 'media-database', 'monitoring'], ['cmo-agent'], ['brand-agent', 'content-marketing-agent']),
  createDomainAgent('event-marketing-agent', 'Event Marketing Agent', 'marketing', 'events', 'Event marketing specialist planning and executing marketing events', 'Event Marketing', ['Event Planning', 'Webinars', 'Trade Shows', 'Virtual Events', 'Event ROI'], 'Plan and execute events that drive brand awareness, leads, and customer engagement.', ['event-planning', 'webinar-management', 'event-analytics'], ['event-platforms', 'webinar-tools', 'registration'], ['marketing-director'], ['content-marketing-agent', 'sales-agent']),
  createDomainAgent('product-marketing-agent', 'Product Marketing Agent', 'marketing', 'product-marketing', 'Product marketer bridging product and market', 'Product Marketing', ['Go-to-Market', 'Positioning', 'Competitive Analysis', 'Sales Enablement', 'Product Launches'], 'Bridge product and market, developing positioning and go-to-market strategies.', ['gtm-strategy', 'positioning', 'competitive-analysis', 'sales-enablement'], ['marketing-tools', 'competitive-intel', 'analytics'], ['cpo-agent', 'cmo-agent'], ['product-manager', 'sales-agent']),
  createDomainAgent('growth-hacker', 'Growth Hacker Agent', 'marketing', 'growth', 'Growth marketing specialist driving rapid user acquisition', 'Growth Marketing', ['Growth Experiments', 'Viral Loops', 'Referral Programs', 'Conversion Optimization', 'Rapid Testing'], 'Design and execute growth experiments to drive rapid user acquisition and engagement.', ['growth-experiments', 'conversion-optimization', 'viral-marketing'], ['growth-tools', 'analytics', 'testing-tools'], ['marketing-director'], ['product-marketing-agent', 'analytics-agent']),
  createDomainAgent('affiliate-marketing-agent', 'Affiliate Marketing Agent', 'marketing', 'affiliate', 'Affiliate marketing specialist managing partner programs', 'Affiliate Marketing', ['Affiliate Programs', 'Partner Recruitment', 'Commission Optimization', 'Fraud Prevention'], 'Manage affiliate programs and partnerships to drive revenue through referrals.', ['affiliate-management', 'partner-recruitment', 'commission-optimization'], ['affiliate-platform', 'tracking-tools', 'analytics'], ['marketing-director'], ['sales-agent', 'finance-agent']),
  createDomainAgent('influencer-marketing-agent', 'Influencer Marketing Agent', 'marketing', 'influencer', 'Influencer marketing specialist managing creator partnerships', 'Influencer Marketing', ['Influencer Identification', 'Campaign Management', 'ROI Measurement', 'Contract Negotiation'], 'Identify and manage influencer partnerships to amplify brand reach and credibility.', ['influencer-identification', 'campaign-management', 'roi-tracking'], ['influencer-platforms', 'social-tools', 'analytics'], ['marketing-director'], ['social-media-agent', 'brand-agent']),
  createDomainAgent('marketing-automation-agent', 'Marketing Automation Agent', 'marketing', 'automation', 'Marketing automation specialist optimizing automated campaigns', 'Marketing Automation', ['Workflow Automation', 'Lead Scoring', 'Nurture Campaigns', 'Integration', 'Personalization'], 'Design and optimize marketing automation workflows for efficiency and personalization.', ['workflow-automation', 'lead-scoring', 'campaign-automation'], ['automation-platforms', 'crm', 'analytics'], ['marketing-director'], ['email-marketing-agent', 'crm-agent']),
  createDomainAgent('localization-agent', 'Localization Agent', 'marketing', 'localization', 'Localization specialist adapting content for global markets', 'Localization', ['Translation', 'Cultural Adaptation', 'Local SEO', 'Market Research', 'Transcreation'], 'Adapt marketing content and campaigns for local markets and cultures.', ['translation', 'cultural-adaptation', 'local-seo'], ['translation-tools', 'localization-platform', 'research'], ['marketing-director'], ['content-marketing-agent', 'international-agent'])
];

// Sales Domain (12 agents)
const SALES_AGENTS: CompleteAgentDefinition[] = [
  createDomainAgent('sales-development-agent', 'Sales Development Agent', 'sales', 'sdr', 'SDR specialist generating and qualifying leads', 'Sales Development', ['Lead Generation', 'Cold Outreach', 'Qualification', 'Appointment Setting', 'CRM Management'], 'Generate and qualify leads through outbound activities and prospect engagement.', ['lead-generation', 'cold-outreach', 'qualification'], ['crm', 'outreach-tools', 'prospecting'], ['sales-director'], ['account-executive-agent', 'marketing-agent']),
  createDomainAgent('account-executive-agent', 'Account Executive Agent', 'sales', 'ae', 'Account executive managing sales cycles and closing deals', 'Account Sales', ['Discovery', 'Demo/Presentation', 'Negotiation', 'Closing', 'Upselling'], 'Manage full sales cycle from discovery to close, building customer relationships.', ['sales-cycle-management', 'demos', 'negotiation', 'closing'], ['crm', 'demo-tools', 'proposal-tools'], ['sales-director'], ['sales-development-agent', 'customer-success-agent']),
  createDomainAgent('sales-engineer-agent', 'Sales Engineer Agent', 'sales', 'se', 'Technical sales specialist supporting complex sales', 'Sales Engineering', ['Technical Demos', 'POC Management', 'Technical Requirements', 'Integration Support', 'RFP Response'], 'Provide technical expertise throughout the sales process for complex solutions.', ['technical-demos', 'poc-management', 'rfp-response'], ['demo-tools', 'technical-tools', 'crm'], ['sales-director'], ['account-executive-agent', 'solutions-architect']),
  createDomainAgent('enterprise-sales-agent', 'Enterprise Sales Agent', 'sales', 'enterprise', 'Enterprise sales specialist managing large account deals', 'Enterprise Sales', ['Strategic Selling', 'C-Level Engagement', 'Complex Deals', 'Account Planning', 'Value Selling'], 'Manage enterprise sales cycles with complex stakeholder engagement and large deals.', ['strategic-selling', 'executive-engagement', 'account-planning'], ['crm', 'analytics', 'presentation-tools'], ['sales-director'], ['account-executive-agent', 'customer-success-agent'], 'L3', 'high'),
  createDomainAgent('inside-sales-agent', 'Inside Sales Agent', 'sales', 'inside-sales', 'Inside sales specialist closing deals remotely', 'Inside Sales', ['Remote Selling', 'Product Demos', 'Pipeline Management', 'Objection Handling', 'Contract Negotiation'], 'Close deals remotely through effective virtual selling techniques.', ['remote-selling', 'demos', 'pipeline-management'], ['crm', 'video-conferencing', 'proposal-tools'], ['sales-director'], ['sales-development-agent', 'customer-success-agent']),
  createDomainAgent('channel-sales-agent', 'Channel Sales Agent', 'sales', 'channel', 'Channel sales specialist managing partner relationships', 'Channel Sales', ['Partner Management', 'Channel Strategy', 'Partner Enablement', 'Co-selling', 'Channel Marketing'], 'Manage channel partnerships and drive revenue through indirect sales.', ['partner-management', 'channel-strategy', 'partner-enablement'], ['partner-portal', 'crm', 'analytics'], ['sales-director'], ['partner-manager', 'marketing-agent']),
  createDomainAgent('sales-operations-agent', 'Sales Operations Agent', 'sales', 'sales-ops', 'Sales ops specialist optimizing sales processes and tools', 'Sales Operations', ['Process Optimization', 'CRM Administration', 'Reporting', 'Territory Planning', 'Compensation'], 'Optimize sales operations, tools, and processes to enable sales effectiveness.', ['sales-ops', 'crm-admin', 'reporting', 'process-optimization'], ['crm', 'analytics', 'automation-tools'], ['sales-director'], ['account-executive-agent', 'finance-agent']),
  createDomainAgent('sales-enablement-agent', 'Sales Enablement Agent', 'sales', 'enablement', 'Sales enablement specialist training and equipping sales teams', 'Sales Enablement', ['Training Programs', 'Content Development', 'Playbooks', 'Onboarding', 'Coaching'], 'Enable sales teams with training, content, and tools to improve effectiveness.', ['sales-training', 'content-development', 'coaching'], ['lms', 'content-management', 'analytics'], ['sales-director'], ['product-marketing-agent', 'hr-agent']),
  createDomainAgent('proposal-specialist', 'Proposal Specialist Agent', 'sales', 'proposals', 'Proposal specialist creating compelling sales proposals', 'Proposal Management', ['Proposal Writing', 'RFP Response', 'Pricing', 'Contract Review', 'Presentation Design'], 'Create compelling proposals and RFP responses that win business.', ['proposal-writing', 'rfp-response', 'pricing'], ['proposal-tools', 'content-library', 'design-tools'], ['sales-director'], ['account-executive-agent', 'legal-agent']),
  createDomainAgent('crm-specialist', 'CRM Specialist Agent', 'sales', 'crm', 'CRM specialist managing and optimizing CRM systems', 'CRM Management', ['CRM Administration', 'Data Quality', 'Automation', 'Reporting', 'Integration'], 'Manage and optimize CRM systems to support sales and customer success.', ['crm-administration', 'data-quality', 'automation'], ['crm', 'integration-tools', 'analytics'], ['sales-operations-agent'], ['sales-development-agent', 'marketing-automation-agent']),
  createDomainAgent('territory-planning-agent', 'Territory Planning Agent', 'sales', 'territory', 'Territory planning specialist optimizing sales coverage', 'Territory Planning', ['Territory Design', 'Quota Setting', 'Coverage Analysis', 'Resource Allocation', 'Performance Analysis'], 'Design and optimize sales territories for maximum coverage and efficiency.', ['territory-design', 'quota-setting', 'performance-analysis'], ['territory-tools', 'analytics', 'crm'], ['sales-operations-agent'], ['sales-director', 'finance-agent']),
  createDomainAgent('sales-forecasting-agent', 'Sales Forecasting Agent', 'sales', 'forecasting', 'Sales forecasting specialist predicting revenue outcomes', 'Sales Forecasting', ['Pipeline Analysis', 'Revenue Prediction', 'Trend Analysis', 'Scenario Planning', 'Accuracy Improvement'], 'Predict revenue outcomes through pipeline analysis and forecasting models.', ['pipeline-analysis', 'forecasting', 'trend-analysis'], ['forecasting-tools', 'crm', 'analytics'], ['sales-operations-agent'], ['sales-director', 'cfo-agent'])
];

// HR Domain (12 agents)
const HR_AGENTS: CompleteAgentDefinition[] = [
  createDomainAgent('recruiter-agent', 'Recruiter Agent', 'hr', 'recruitment', 'Talent acquisition specialist sourcing and hiring top talent', 'Recruitment', ['Sourcing', 'Screening', 'Interviewing', 'Offer Management', 'Employer Branding'], 'Source, screen, and hire top talent to meet organizational needs.', ['sourcing', 'screening', 'interviewing', 'ats-management'], ['ats', 'sourcing-tools', 'scheduling'], ['hr-director'], ['hiring-manager', 'onboarding-agent']),
  createDomainAgent('onboarding-agent', 'Onboarding Agent', 'hr', 'onboarding', 'Onboarding specialist ensuring successful new hire integration', 'Employee Onboarding', ['Onboarding Programs', 'Documentation', 'Training Coordination', 'Buddy Programs', 'Feedback Collection'], 'Ensure successful new hire integration through comprehensive onboarding programs.', ['onboarding-programs', 'documentation', 'training-coordination'], ['hris', 'lms', 'documentation-tools'], ['hr-director'], ['recruiter-agent', 'training-agent']),
  createDomainAgent('compensation-benefits-agent', 'Compensation & Benefits Agent', 'hr', 'compensation', 'Compensation specialist managing pay and benefits programs', 'Compensation & Benefits', ['Salary Benchmarking', 'Benefits Administration', 'Equity Programs', 'Compensation Analysis', 'Policy Development'], 'Design and manage competitive compensation and benefits programs.', ['salary-benchmarking', 'benefits-admin', 'compensation-analysis'], ['compensation-tools', 'hris', 'benchmarking-data'], ['chro-agent'], ['finance-agent', 'hr-director'], 'L3', 'high'),
  createDomainAgent('training-development-agent', 'Training & Development Agent', 'hr', 'training', 'L&D specialist developing employee capabilities', 'Learning & Development', ['Training Design', 'Curriculum Development', 'Skill Assessment', 'Leadership Development', 'E-Learning'], 'Design and deliver training programs that develop employee capabilities.', ['training-design', 'curriculum-development', 'skill-assessment'], ['lms', 'authoring-tools', 'assessment-tools'], ['hr-director'], ['onboarding-agent', 'performance-agent']),
  createDomainAgent('performance-management-agent', 'Performance Management Agent', 'hr', 'performance', 'Performance specialist managing employee performance processes', 'Performance Management', ['Goal Setting', 'Performance Reviews', 'Feedback Systems', 'Performance Improvement', 'Calibration'], 'Manage performance processes that drive employee and organizational success.', ['goal-setting', 'performance-reviews', 'feedback-systems'], ['performance-tools', 'hris', 'analytics'], ['hr-director'], ['training-development-agent', 'compensation-benefits-agent']),
  createDomainAgent('employee-relations-agent', 'Employee Relations Agent', 'hr', 'employee-relations', 'ER specialist managing employee workplace issues', 'Employee Relations', ['Conflict Resolution', 'Policy Compliance', 'Investigations', 'Grievance Handling', 'Culture Initiatives'], 'Manage employee relations issues and maintain positive workplace culture.', ['conflict-resolution', 'investigations', 'policy-compliance'], ['case-management', 'hris', 'documentation'], ['hr-director'], ['legal-agent', 'culture-agent'], 'L3', 'high'),
  createDomainAgent('hr-analytics-agent', 'HR Analytics Agent', 'hr', 'hr-analytics', 'People analytics specialist providing workforce insights', 'HR Analytics', ['Workforce Analytics', 'Turnover Analysis', 'Diversity Metrics', 'Predictive Analytics', 'HR Dashboards'], 'Analyze workforce data to provide insights for people strategy.', ['workforce-analytics', 'turnover-analysis', 'predictive-analytics'], ['analytics-tools', 'hris', 'bi-tools'], ['chro-agent'], ['hr-director', 'compensation-benefits-agent']),
  createDomainAgent('diversity-inclusion-agent', 'Diversity & Inclusion Agent', 'hr', 'dei', 'D&I specialist promoting inclusive workplace culture', 'Diversity & Inclusion', ['D&I Strategy', 'Inclusive Practices', 'ERG Management', 'Bias Training', 'Metrics & Reporting'], 'Develop and implement D&I initiatives that create an inclusive workplace.', ['dei-strategy', 'inclusive-practices', 'ergs', 'bias-training'], ['survey-tools', 'training-platform', 'analytics'], ['chro-agent'], ['hr-director', 'culture-agent']),
  createDomainAgent('hris-specialist', 'HRIS Specialist Agent', 'hr', 'hris', 'HRIS specialist managing HR technology systems', 'HRIS Management', ['System Administration', 'Data Management', 'Reporting', 'Integration', 'Process Automation'], 'Manage and optimize HR information systems to support HR operations.', ['hris-admin', 'data-management', 'reporting'], ['hris', 'integration-tools', 'reporting-tools'], ['hr-director'], ['hr-analytics-agent', 'payroll-agent']),
  createDomainAgent('payroll-specialist', 'Payroll Specialist Agent', 'hr', 'payroll', 'Payroll specialist managing employee compensation processing', 'Payroll', ['Payroll Processing', 'Tax Compliance', 'Benefits Deductions', 'Time & Attendance', 'Reporting'], 'Process payroll accurately and compliantly for all employees.', ['payroll-processing', 'tax-compliance', 'benefits-processing'], ['payroll-system', 'time-tracking', 'hris'], ['hr-director'], ['compensation-benefits-agent', 'finance-agent'], 'L2', 'high'),
  createDomainAgent('talent-management-agent', 'Talent Management Agent', 'hr', 'talent', 'Talent management specialist developing career paths', 'Talent Management', ['Succession Planning', 'Career Development', 'Talent Assessment', 'High-Potential Programs', 'Retention'], 'Develop and retain talent through career development and succession planning.', ['succession-planning', 'career-development', 'talent-assessment'], ['talent-tools', 'hris', 'assessment-tools'], ['chro-agent'], ['training-development-agent', 'performance-management-agent'], 'L3'),
  createDomainAgent('culture-agent', 'Culture Agent', 'hr', 'culture', 'Culture specialist developing and maintaining organizational culture', 'Organizational Culture', ['Culture Strategy', 'Employee Engagement', 'Values Alignment', 'Culture Surveys', 'Recognition Programs'], 'Develop and maintain organizational culture that drives engagement and performance.', ['culture-strategy', 'employee-engagement', 'recognition'], ['survey-tools', 'recognition-platform', 'communication-tools'], ['chro-agent'], ['diversity-inclusion-agent', 'hr-director'])
];

// Finance Domain (15 agents)
const FINANCE_AGENTS: CompleteAgentDefinition[] = [
  createDomainAgent('accounting-agent', 'Accounting Agent', 'finance', 'accounting', 'Accounting specialist managing financial records and reporting', 'Accounting', ['General Ledger', 'Month-End Close', 'Financial Reporting', 'Reconciliation', 'Journal Entries'], 'Manage financial records and produce accurate financial statements.', ['general-ledger', 'financial-reporting', 'reconciliation'], ['accounting-software', 'erp', 'reporting-tools'], ['cfo-agent'], ['tax-agent', 'audit-agent'], 'L2', 'high'),
  createDomainAgent('fpa-agent', 'FP&A Agent', 'finance', 'fpa', 'Financial planning and analysis specialist supporting business decisions', 'Financial Planning & Analysis', ['Budgeting', 'Forecasting', 'Variance Analysis', 'Financial Modeling', 'Business Case Development'], 'Provide financial analysis and insights to support business planning and decisions.', ['budgeting', 'forecasting', 'financial-modeling'], ['fpa-tools', 'bi-tools', 'spreadsheets'], ['cfo-agent'], ['accounting-agent', 'business-analyst'], 'L3'),
  createDomainAgent('accounts-payable-agent', 'Accounts Payable Agent', 'finance', 'ap', 'AP specialist managing vendor payments and invoices', 'Accounts Payable', ['Invoice Processing', 'Vendor Management', 'Payment Processing', 'Expense Management', 'Compliance'], 'Process vendor invoices and payments accurately and efficiently.', ['invoice-processing', 'payment-processing', 'vendor-management'], ['ap-software', 'erp', 'payment-tools'], ['accounting-agent'], ['procurement-agent', 'vendor-agent']),
  createDomainAgent('accounts-receivable-agent', 'Accounts Receivable Agent', 'finance', 'ar', 'AR specialist managing customer payments and collections', 'Accounts Receivable', ['Invoicing', 'Collections', 'Cash Application', 'Credit Management', 'Aging Analysis'], 'Manage customer invoicing and collections to optimize cash flow.', ['invoicing', 'collections', 'credit-management'], ['ar-software', 'erp', 'collection-tools'], ['accounting-agent'], ['sales-operations-agent', 'customer-success-agent']),
  createDomainAgent('tax-agent', 'Tax Agent', 'finance', 'tax', 'Tax specialist ensuring tax compliance and optimization', 'Tax', ['Tax Compliance', 'Tax Planning', 'Transfer Pricing', 'Tax Reporting', 'Tax Research'], 'Ensure tax compliance while optimizing tax position.', ['tax-compliance', 'tax-planning', 'tax-reporting'], ['tax-software', 'erp', 'research-tools'], ['cfo-agent'], ['accounting-agent', 'legal-agent'], 'L3', 'high'),
  createDomainAgent('audit-agent', 'Internal Audit Agent', 'finance', 'audit', 'Internal auditor evaluating controls and compliance', 'Internal Audit', ['Controls Testing', 'Risk Assessment', 'Compliance Auditing', 'Process Improvement', 'Audit Reporting'], 'Evaluate internal controls and compliance through systematic auditing.', ['controls-testing', 'risk-assessment', 'compliance-auditing'], ['audit-software', 'analytics', 'documentation'], ['cfo-agent'], ['compliance-agent', 'accounting-agent'], 'L3', 'high'),
  createDomainAgent('treasury-agent', 'Treasury Agent', 'finance', 'treasury', 'Treasury specialist managing cash and investments', 'Treasury', ['Cash Management', 'Investment Management', 'Banking Relationships', 'Hedging', 'Liquidity Planning'], 'Manage cash, investments, and banking relationships to optimize liquidity.', ['cash-management', 'investment-management', 'liquidity-planning'], ['treasury-tools', 'banking-platforms', 'analytics'], ['cfo-agent'], ['fpa-agent', 'accounting-agent'], 'L3', 'critical'),
  createDomainAgent('procurement-agent', 'Procurement Agent', 'finance', 'procurement', 'Procurement specialist managing purchasing and vendor relationships', 'Procurement', ['Strategic Sourcing', 'Vendor Management', 'Contract Negotiation', 'Purchase Management', 'Cost Optimization'], 'Manage procurement processes to optimize costs and vendor relationships.', ['strategic-sourcing', 'vendor-management', 'contract-negotiation'], ['procurement-platform', 'contract-management', 'analytics'], ['coo-agent'], ['accounts-payable-agent', 'legal-agent'], 'L3'),
  createDomainAgent('expense-management-agent', 'Expense Management Agent', 'finance', 'expense', 'Expense management specialist controlling organizational spend', 'Expense Management', ['Expense Policy', 'Expense Processing', 'Travel Management', 'Cost Control', 'Compliance'], 'Manage expense processes and control organizational spending.', ['expense-processing', 'policy-compliance', 'cost-control'], ['expense-software', 'travel-platform', 'analytics'], ['accounting-agent'], ['hr-agent', 'procurement-agent']),
  createDomainAgent('billing-agent', 'Billing Agent', 'finance', 'billing', 'Billing specialist managing customer invoicing and subscriptions', 'Billing', ['Invoice Generation', 'Subscription Billing', 'Revenue Recognition', 'Billing Accuracy', 'Payment Terms'], 'Generate accurate invoices and manage subscription billing processes.', ['invoicing', 'subscription-management', 'revenue-recognition'], ['billing-software', 'crm', 'erp'], ['accounting-agent'], ['accounts-receivable-agent', 'customer-success-agent']),
  createDomainAgent('financial-reporting-agent', 'Financial Reporting Agent', 'finance', 'reporting', 'Financial reporting specialist creating management and regulatory reports', 'Financial Reporting', ['Management Reporting', 'Regulatory Reporting', 'GAAP/IFRS', 'Dashboard Creation', 'Narrative Analysis'], 'Create accurate financial reports for management and regulatory requirements.', ['management-reporting', 'regulatory-reporting', 'gaap-compliance'], ['reporting-tools', 'bi-tools', 'erp'], ['cfo-agent'], ['accounting-agent', 'fpa-agent'], 'L3'),
  createDomainAgent('credit-analyst', 'Credit Analyst Agent', 'finance', 'credit', 'Credit analyst assessing customer creditworthiness', 'Credit Analysis', ['Credit Assessment', 'Risk Scoring', 'Credit Limits', 'Collection Strategy', 'Credit Monitoring'], 'Assess customer creditworthiness and manage credit risk.', ['credit-assessment', 'risk-scoring', 'credit-monitoring'], ['credit-tools', 'credit-bureaus', 'analytics'], ['cfo-agent'], ['accounts-receivable-agent', 'sales-agent']),
  createDomainAgent('investment-analyst', 'Investment Analyst Agent', 'finance', 'investment', 'Investment analyst evaluating investment opportunities', 'Investment Analysis', ['Investment Research', 'Due Diligence', 'Valuation', 'Portfolio Analysis', 'Market Analysis'], 'Analyze investment opportunities and provide recommendations.', ['investment-research', 'due-diligence', 'valuation'], ['financial-data', 'research-tools', 'modeling-tools'], ['cfo-agent'], ['treasury-agent', 'strategic-advisor'], 'L3'),
  createDomainAgent('fraud-detection-agent', 'Fraud Detection Agent', 'finance', 'fraud', 'Fraud specialist detecting and preventing financial fraud', 'Fraud Detection', ['Fraud Analysis', 'Transaction Monitoring', 'Investigation', 'Prevention Controls', 'Reporting'], 'Detect and prevent financial fraud through monitoring and investigation.', ['fraud-analysis', 'transaction-monitoring', 'investigation'], ['fraud-detection-tools', 'analytics', 'case-management'], ['cfo-agent', 'ciso-agent'], ['audit-agent', 'compliance-agent'], 'L3', 'critical'),
  createDomainAgent('cost-analyst', 'Cost Analyst Agent', 'finance', 'cost', 'Cost analyst managing product and service costing', 'Cost Analysis', ['Cost Accounting', 'Pricing Support', 'Margin Analysis', 'Cost Reduction', 'Activity-Based Costing'], 'Analyze costs to support pricing decisions and cost optimization initiatives.', ['cost-accounting', 'margin-analysis', 'cost-reduction'], ['cost-accounting-tools', 'erp', 'analytics'], ['fpa-agent'], ['product-manager', 'procurement-agent'])
];

// Legal Domain (10 agents)
const LEGAL_AGENTS: CompleteAgentDefinition[] = [
  createDomainAgent('contract-agent', 'Contract Agent', 'legal', 'contracts', 'Contract specialist drafting and reviewing contracts', 'Contract Management', ['Contract Drafting', 'Contract Review', 'Negotiation Support', 'Contract Lifecycle', 'Template Management'], 'Draft, review, and manage contracts to protect organizational interests.', ['contract-drafting', 'contract-review', 'negotiation-support'], ['contract-management', 'document-tools', 'legal-research'], ['legal-counsel'], ['sales-agent', 'procurement-agent']),
  createDomainAgent('compliance-officer-agent', 'Compliance Officer Agent', 'legal', 'compliance', 'Compliance specialist ensuring regulatory adherence', 'Compliance', ['Regulatory Compliance', 'Policy Development', 'Training', 'Monitoring', 'Reporting'], 'Ensure organizational compliance with applicable laws and regulations.', ['regulatory-compliance', 'policy-development', 'monitoring'], ['compliance-tools', 'training-platform', 'tracking'], ['legal-counsel'], ['audit-agent', 'risk-agent'], 'L3', 'high'),
  createDomainAgent('ip-agent', 'Intellectual Property Agent', 'legal', 'ip', 'IP specialist protecting intellectual property assets', 'Intellectual Property', ['Patent Analysis', 'Trademark Management', 'Copyright Protection', 'Trade Secrets', 'IP Strategy'], 'Protect and manage intellectual property assets.', ['patent-analysis', 'trademark-management', 'ip-strategy'], ['ip-tools', 'patent-database', 'legal-research'], ['legal-counsel'], ['innovation-agent', 'product-agent'], 'L3'),
  createDomainAgent('employment-law-agent', 'Employment Law Agent', 'legal', 'employment-law', 'Employment law specialist advising on HR legal matters', 'Employment Law', ['Employment Policies', 'Dispute Resolution', 'Compliance', 'Discrimination Prevention', 'Termination Support'], 'Provide employment law guidance to ensure compliant HR practices.', ['employment-policies', 'dispute-resolution', 'compliance'], ['legal-research', 'policy-tools', 'case-management'], ['legal-counsel'], ['hr-director', 'employee-relations-agent'], 'L3', 'high'),
  createDomainAgent('privacy-agent', 'Privacy Agent', 'legal', 'privacy', 'Privacy specialist ensuring data protection compliance', 'Data Privacy', ['GDPR Compliance', 'CCPA Compliance', 'Privacy Impact Assessments', 'Data Subject Requests', 'Privacy Training'], 'Ensure compliance with data privacy regulations and protect personal data.', ['gdpr-compliance', 'privacy-assessments', 'dsr-management'], ['privacy-tools', 'compliance-platform', 'training'], ['legal-counsel', 'ciso-agent'], ['data-protection-agent', 'it-agent'], 'L3', 'critical'),
  createDomainAgent('litigation-agent', 'Litigation Agent', 'legal', 'litigation', 'Litigation specialist managing legal disputes', 'Litigation', ['Case Management', 'Discovery', 'Strategy Development', 'Settlement Negotiation', 'Legal Research'], 'Manage litigation matters and protect organizational interests in disputes.', ['case-management', 'discovery', 'strategy-development'], ['case-management', 'legal-research', 'document-review'], ['legal-counsel'], ['compliance-officer-agent', 'risk-agent'], 'L3', 'high'),
  createDomainAgent('corporate-secretary-agent', 'Corporate Secretary Agent', 'legal', 'corporate', 'Corporate governance specialist managing board matters', 'Corporate Governance', ['Board Administration', 'Corporate Records', 'Governance Policies', 'Shareholder Relations', 'Regulatory Filings'], 'Manage corporate governance, board administration, and regulatory filings.', ['board-administration', 'corporate-records', 'regulatory-filings'], ['board-portal', 'document-management', 'regulatory-tools'], ['legal-counsel', 'ceo-agent'], ['cfo-agent', 'investor-relations-agent'], 'L3', 'high'),
  createDomainAgent('regulatory-affairs-agent', 'Regulatory Affairs Agent', 'legal', 'regulatory', 'Regulatory specialist managing regulatory submissions and compliance', 'Regulatory Affairs', ['Regulatory Strategy', 'Submission Management', 'Agency Interaction', 'Compliance Monitoring', 'Regulatory Intelligence'], 'Manage regulatory submissions and maintain compliance with regulatory bodies.', ['regulatory-strategy', 'submission-management', 'compliance-monitoring'], ['regulatory-tools', 'document-management', 'tracking'], ['legal-counsel'], ['compliance-officer-agent', 'product-agent'], 'L3', 'high'),
  createDomainAgent('trade-compliance-agent', 'Trade Compliance Agent', 'legal', 'trade', 'Trade compliance specialist managing import/export regulations', 'Trade Compliance', ['Export Controls', 'Import Compliance', 'Sanctions Screening', 'Classification', 'Licensing'], 'Ensure compliance with trade regulations, export controls, and sanctions.', ['export-controls', 'import-compliance', 'sanctions-screening'], ['trade-compliance-tools', 'screening-tools', 'documentation'], ['legal-counsel'], ['procurement-agent', 'logistics-agent'], 'L3', 'high'),
  createDomainAgent('risk-legal-agent', 'Legal Risk Agent', 'legal', 'risk', 'Legal risk specialist identifying and managing legal risks', 'Legal Risk Management', ['Risk Identification', 'Risk Assessment', 'Mitigation Strategies', 'Risk Monitoring', 'Insurance Coordination'], 'Identify, assess, and manage legal risks across the organization.', ['risk-identification', 'risk-assessment', 'mitigation-strategies'], ['risk-tools', 'legal-research', 'case-management'], ['legal-counsel'], ['compliance-officer-agent', 'enterprise-risk-agent'], 'L3')
];

// Customer Success Domain (8 agents)
const CUSTOMER_SUCCESS_AGENTS: CompleteAgentDefinition[] = [
  createDomainAgent('customer-success-manager', 'Customer Success Manager Agent', 'customer-success', 'csm', 'CSM ensuring customer value realization and retention', 'Customer Success', ['Onboarding', 'Success Planning', 'Health Monitoring', 'Renewal Management', 'Expansion'], 'Ensure customers achieve their goals and maximize value from products/services.', ['onboarding', 'success-planning', 'health-monitoring'], ['cs-platform', 'crm', 'analytics'], ['customer-success-director'], ['account-executive-agent', 'support-agent']),
  createDomainAgent('customer-support-agent', 'Customer Support Agent', 'customer-success', 'support', 'Support specialist resolving customer issues', 'Customer Support', ['Issue Resolution', 'Troubleshooting', 'Ticket Management', 'Knowledge Base', 'Escalation'], 'Resolve customer issues efficiently while maintaining satisfaction.', ['issue-resolution', 'troubleshooting', 'ticket-management'], ['helpdesk', 'knowledge-base', 'communication-tools'], ['support-director'], ['customer-success-manager', 'technical-support-agent']),
  createDomainAgent('technical-support-agent', 'Technical Support Agent', 'customer-success', 'tech-support', 'Technical support specialist resolving complex technical issues', 'Technical Support', ['Technical Troubleshooting', 'Product Expertise', 'Bug Reporting', 'Configuration', 'Integration Support'], 'Resolve complex technical issues and provide product expertise.', ['technical-troubleshooting', 'bug-reporting', 'integration-support'], ['support-tools', 'debugging-tools', 'knowledge-base'], ['support-director'], ['customer-support-agent', 'engineering-agent'], 'L3'),
  createDomainAgent('customer-onboarding-agent', 'Customer Onboarding Agent', 'customer-success', 'onboarding', 'Onboarding specialist ensuring successful customer implementation', 'Customer Onboarding', ['Implementation Planning', 'Training Delivery', 'Configuration', 'Go-Live Support', 'Success Metrics'], 'Guide customers through successful onboarding and implementation.', ['implementation-planning', 'training', 'configuration'], ['onboarding-tools', 'training-platform', 'project-tools'], ['customer-success-director'], ['customer-success-manager', 'training-agent']),
  createDomainAgent('renewals-agent', 'Renewals Agent', 'customer-success', 'renewals', 'Renewals specialist managing customer contract renewals', 'Renewals', ['Renewal Management', 'Risk Assessment', 'Negotiation', 'Contract Management', 'Forecasting'], 'Manage customer renewals to maximize retention and revenue.', ['renewal-management', 'risk-assessment', 'negotiation'], ['crm', 'contract-tools', 'analytics'], ['customer-success-director'], ['customer-success-manager', 'sales-agent']),
  createDomainAgent('customer-advocacy-agent', 'Customer Advocacy Agent', 'customer-success', 'advocacy', 'Customer advocacy specialist building customer references and community', 'Customer Advocacy', ['Reference Programs', 'Case Studies', 'Community Building', 'Reviews Management', 'Events'], 'Build customer advocacy through references, case studies, and community.', ['reference-programs', 'case-studies', 'community-building'], ['advocacy-platform', 'community-tools', 'content-tools'], ['customer-success-director'], ['marketing-agent', 'customer-success-manager']),
  createDomainAgent('nps-agent', 'NPS & Feedback Agent', 'customer-success', 'feedback', 'Customer feedback specialist managing NPS and satisfaction programs', 'Customer Feedback', ['NPS Programs', 'Survey Management', 'Feedback Analysis', 'Voice of Customer', 'Action Planning'], 'Collect and analyze customer feedback to drive improvements.', ['nps-programs', 'survey-management', 'feedback-analysis'], ['survey-tools', 'analytics', 'reporting'], ['customer-success-director'], ['customer-success-manager', 'product-agent']),
  createDomainAgent('customer-insights-agent', 'Customer Insights Agent', 'customer-success', 'insights', 'Customer insights specialist analyzing customer data and behavior', 'Customer Insights', ['Behavioral Analysis', 'Churn Prediction', 'Segmentation', 'Journey Mapping', 'Reporting'], 'Analyze customer data to generate actionable insights.', ['behavioral-analysis', 'churn-prediction', 'segmentation'], ['analytics', 'bi-tools', 'data-tools'], ['customer-success-director'], ['customer-success-manager', 'marketing-analytics-agent'], 'L3')
];

// Additional Domain Agents - Healthcare, Education, Manufacturing, Logistics, etc.
const ADDITIONAL_DOMAIN_AGENTS: CompleteAgentDefinition[] = [
  // Healthcare (10)
  createDomainAgent('healthcare-analyst', 'Healthcare Analyst Agent', 'healthcare', 'analytics', 'Healthcare data analyst supporting clinical and operational decisions', 'Healthcare Analytics', ['Clinical Analytics', 'Outcomes Research', 'Population Health', 'Quality Metrics', 'Cost Analysis'], 'Analyze healthcare data to improve clinical outcomes and operations.', ['clinical-analytics', 'outcomes-research', 'quality-metrics'], ['analytics-tools', 'ehr', 'bi-tools'], ['healthcare-director'], ['clinical-operations-agent', 'quality-agent'], 'L3', 'high'),
  createDomainAgent('medical-coding-agent', 'Medical Coding Agent', 'healthcare', 'coding', 'Medical coding specialist ensuring accurate procedure and diagnosis coding', 'Medical Coding', ['ICD-10 Coding', 'CPT Coding', 'Coding Accuracy', 'Compliance', 'Training'], 'Ensure accurate medical coding for billing and compliance.', ['icd-10-coding', 'cpt-coding', 'compliance'], ['coding-software', 'ehr', 'reference-tools'], ['healthcare-director'], ['billing-agent', 'compliance-agent'], 'L2', 'high'),
  createDomainAgent('clinical-research-agent', 'Clinical Research Agent', 'healthcare', 'research', 'Clinical research specialist supporting clinical trials and studies', 'Clinical Research', ['Protocol Development', 'Data Collection', 'Safety Monitoring', 'Regulatory Compliance', 'Reporting'], 'Support clinical research through protocol management and data analysis.', ['protocol-development', 'data-collection', 'safety-monitoring'], ['clinical-tools', 'regulatory-tools', 'analytics'], ['healthcare-director'], ['regulatory-agent', 'data-analyst'], 'L3', 'high'),
  
  // Education (10)
  createDomainAgent('curriculum-developer', 'Curriculum Developer Agent', 'education', 'curriculum', 'Curriculum specialist designing learning programs', 'Curriculum Development', ['Course Design', 'Learning Objectives', 'Assessment Design', 'Content Development', 'Alignment'], 'Design effective curriculum and learning programs.', ['course-design', 'assessment-design', 'content-development'], ['lms', 'authoring-tools', 'assessment-tools'], ['education-director'], ['instructional-designer', 'training-agent']),
  createDomainAgent('instructional-designer', 'Instructional Designer Agent', 'education', 'design', 'Instructional design specialist creating learning experiences', 'Instructional Design', ['Learning Design', 'E-Learning Development', 'Multimedia', 'Interactivity', 'Accessibility'], 'Create engaging and effective learning experiences.', ['learning-design', 'elearning-development', 'multimedia'], ['authoring-tools', 'design-tools', 'lms'], ['education-director'], ['curriculum-developer', 'content-creator']),
  createDomainAgent('student-success-agent', 'Student Success Agent', 'education', 'success', 'Student success specialist supporting learner outcomes', 'Student Success', ['Academic Support', 'Progress Monitoring', 'Intervention', 'Engagement', 'Retention'], 'Support student success through proactive monitoring and intervention.', ['academic-support', 'progress-monitoring', 'intervention'], ['student-info-system', 'lms', 'communication-tools'], ['education-director'], ['curriculum-developer', 'advisor-agent']),
  
  // Logistics (10)
  createDomainAgent('supply-chain-agent', 'Supply Chain Agent', 'logistics', 'supply-chain', 'Supply chain specialist optimizing end-to-end supply chain', 'Supply Chain Management', ['Demand Planning', 'Inventory Management', 'Procurement', 'Logistics', 'Risk Management'], 'Optimize supply chain operations for efficiency and resilience.', ['demand-planning', 'inventory-management', 'logistics'], ['scm-tools', 'erp', 'analytics'], ['coo-agent'], ['procurement-agent', 'logistics-agent'], 'L3'),
  createDomainAgent('inventory-agent', 'Inventory Agent', 'logistics', 'inventory', 'Inventory specialist managing stock levels and optimization', 'Inventory Management', ['Stock Management', 'Reorder Points', 'Safety Stock', 'ABC Analysis', 'Cycle Counting'], 'Manage inventory levels to balance availability and cost.', ['stock-management', 'reorder-optimization', 'abc-analysis'], ['inventory-tools', 'erp', 'analytics'], ['supply-chain-agent'], ['procurement-agent', 'warehouse-agent']),
  createDomainAgent('warehouse-agent', 'Warehouse Agent', 'logistics', 'warehouse', 'Warehouse specialist managing warehouse operations', 'Warehouse Management', ['Warehouse Operations', 'Layout Optimization', 'Pick/Pack/Ship', 'Receiving', 'Safety'], 'Manage warehouse operations for efficiency and accuracy.', ['warehouse-operations', 'layout-optimization', 'picking-optimization'], ['wms', 'erp', 'automation-tools'], ['supply-chain-agent'], ['inventory-agent', 'shipping-agent']),
  createDomainAgent('shipping-agent', 'Shipping Agent', 'logistics', 'shipping', 'Shipping specialist managing freight and delivery', 'Shipping Management', ['Freight Management', 'Carrier Selection', 'Route Optimization', 'Tracking', 'Cost Control'], 'Manage shipping operations for timely and cost-effective delivery.', ['freight-management', 'carrier-selection', 'route-optimization'], ['tms', 'erp', 'tracking-tools'], ['supply-chain-agent'], ['warehouse-agent', 'customer-service-agent']),
  createDomainAgent('demand-planning-agent', 'Demand Planning Agent', 'logistics', 'demand', 'Demand planning specialist forecasting product demand', 'Demand Planning', ['Forecasting', 'Demand Sensing', 'S&OP', 'Collaboration', 'Accuracy Tracking'], 'Forecast demand to optimize inventory and production planning.', ['forecasting', 'demand-sensing', 'sop'], ['demand-planning-tools', 'analytics', 'erp'], ['supply-chain-agent'], ['inventory-agent', 'sales-agent'], 'L3'),
  
  // Real Estate (5)
  createDomainAgent('property-agent', 'Property Agent', 'real-estate', 'property', 'Property specialist managing real estate assets', 'Property Management', ['Property Operations', 'Tenant Relations', 'Maintenance', 'Lease Management', 'Rent Collection'], 'Manage property operations and tenant relationships.', ['property-operations', 'tenant-relations', 'maintenance'], ['property-management', 'accounting', 'maintenance-tools'], ['real-estate-director'], ['leasing-agent', 'maintenance-agent']),
  createDomainAgent('leasing-agent', 'Leasing Agent', 'real-estate', 'leasing', 'Leasing specialist managing property rentals', 'Leasing', ['Lead Generation', 'Property Tours', 'Application Processing', 'Lease Negotiation', 'Move-In'], 'Manage leasing process from lead to move-in.', ['lead-generation', 'tours', 'lease-negotiation'], ['leasing-tools', 'crm', 'property-management'], ['property-agent'], ['marketing-agent', 'property-agent']),
  
  // Sustainability (5)
  createDomainAgent('sustainability-agent', 'Sustainability Agent', 'sustainability', 'esg', 'Sustainability specialist managing ESG initiatives', 'Sustainability', ['ESG Strategy', 'Carbon Management', 'Sustainability Reporting', 'Circular Economy', 'Stakeholder Engagement'], 'Develop and implement sustainability initiatives.', ['esg-strategy', 'carbon-management', 'sustainability-reporting'], ['sustainability-tools', 'reporting-tools', 'analytics'], ['coo-agent'], ['compliance-agent', 'operations-agent'], 'L3'),
  createDomainAgent('carbon-analyst', 'Carbon Analyst Agent', 'sustainability', 'carbon', 'Carbon specialist measuring and reducing emissions', 'Carbon Management', ['Carbon Footprint', 'Emissions Tracking', 'Reduction Strategies', 'Carbon Offsets', 'Reporting'], 'Measure and reduce organizational carbon emissions.', ['carbon-footprint', 'emissions-tracking', 'reduction-strategies'], ['carbon-tools', 'analytics', 'reporting'], ['sustainability-agent'], ['operations-agent', 'procurement-agent']),
  
  // Other domains to reach 127
  createDomainAgent('risk-management-agent', 'Enterprise Risk Agent', 'risk', 'enterprise', 'Enterprise risk specialist managing organizational risks', 'Enterprise Risk Management', ['Risk Identification', 'Risk Assessment', 'Mitigation Planning', 'Risk Monitoring', 'Reporting'], 'Identify and manage enterprise-wide risks.', ['risk-identification', 'risk-assessment', 'mitigation-planning'], ['risk-tools', 'analytics', 'reporting'], ['cro-agent'], ['compliance-agent', 'audit-agent'], 'L3'),
  createDomainAgent('business-analyst', 'Business Analyst Agent', 'business', 'analysis', 'Business analyst bridging business needs and solutions', 'Business Analysis', ['Requirements Gathering', 'Process Analysis', 'Solution Design', 'Stakeholder Management', 'Documentation'], 'Analyze business needs and translate them into requirements.', ['requirements-gathering', 'process-analysis', 'solution-design'], ['ba-tools', 'modeling-tools', 'documentation'], ['project-director'], ['product-manager', 'solutions-architect']),
  createDomainAgent('change-management-agent', 'Change Management Agent', 'operations', 'change', 'Change management specialist leading organizational change', 'Change Management', ['Change Strategy', 'Impact Assessment', 'Communication', 'Training', 'Adoption'], 'Lead organizational change initiatives for successful adoption.', ['change-strategy', 'impact-assessment', 'communication'], ['change-tools', 'communication-tools', 'training-platform'], ['coo-agent'], ['hr-agent', 'project-manager'], 'L3'),
  createDomainAgent('project-manager', 'Project Manager Agent', 'project', 'management', 'Project manager delivering projects on time and budget', 'Project Management', ['Planning', 'Execution', 'Monitoring', 'Risk Management', 'Stakeholder Communication'], 'Deliver projects successfully within scope, time, and budget.', ['project-planning', 'execution', 'monitoring'], ['project-tools', 'collaboration-tools', 'reporting'], ['project-director'], ['business-analyst', 'team-leads']),
  createDomainAgent('scrum-master', 'Scrum Master Agent', 'agile', 'scrum', 'Scrum master facilitating agile team success', 'Agile/Scrum', ['Sprint Facilitation', 'Impediment Removal', 'Team Coaching', 'Process Improvement', 'Stakeholder Management'], 'Facilitate agile teams and remove impediments.', ['sprint-facilitation', 'impediment-removal', 'team-coaching'], ['agile-tools', 'collaboration-tools', 'retrospective-tools'], ['project-director'], ['product-owner', 'development-team']),
  createDomainAgent('product-owner-agent', 'Product Owner Agent', 'product', 'ownership', 'Product owner managing product backlog and priorities', 'Product Ownership', ['Backlog Management', 'User Story Writing', 'Prioritization', 'Sprint Planning', 'Stakeholder Management'], 'Manage product backlog and ensure value delivery.', ['backlog-management', 'user-stories', 'prioritization'], ['agile-tools', 'product-tools', 'analytics'], ['product-director'], ['scrum-master', 'development-team']),
  createDomainAgent('data-analyst', 'Data Analyst Agent', 'data', 'analytics', 'Data analyst transforming data into insights', 'Data Analytics', ['Data Analysis', 'Visualization', 'Reporting', 'SQL', 'Statistical Analysis'], 'Analyze data to provide actionable business insights.', ['data-analysis', 'visualization', 'reporting'], ['bi-tools', 'sql', 'analytics'], ['data-director'], ['business-analyst', 'data-engineer']),
  createDomainAgent('business-intelligence-agent', 'Business Intelligence Agent', 'data', 'bi', 'BI specialist creating dashboards and reports', 'Business Intelligence', ['Dashboard Development', 'Report Design', 'Data Modeling', 'KPI Definition', 'Self-Service BI'], 'Create dashboards and reports that enable data-driven decisions.', ['dashboard-development', 'report-design', 'data-modeling'], ['bi-tools', 'visualization-tools', 'data-tools'], ['data-director'], ['data-analyst', 'business-analyst']),
  createDomainAgent('communications-agent', 'Corporate Communications Agent', 'communications', 'corporate', 'Communications specialist managing corporate messaging', 'Corporate Communications', ['Internal Communications', 'Executive Communications', 'Crisis Communications', 'Employee Engagement', 'Content Strategy'], 'Manage corporate communications to engage stakeholders.', ['internal-communications', 'executive-communications', 'crisis-communications'], ['communication-tools', 'content-management', 'analytics'], ['cmo-agent'], ['hr-agent', 'pr-agent']),
  createDomainAgent('investor-relations-agent', 'Investor Relations Agent', 'finance', 'ir', 'IR specialist managing investor communications', 'Investor Relations', ['Earnings Communications', 'Investor Presentations', 'Shareholder Engagement', 'Regulatory Filings', 'Market Intelligence'], 'Manage investor relations and shareholder communications.', ['earnings-communications', 'investor-presentations', 'shareholder-engagement'], ['ir-tools', 'financial-tools', 'presentation-tools'], ['cfo-agent'], ['corporate-secretary-agent', 'pr-agent'], 'L3', 'high'),
  createDomainAgent('facilities-agent', 'Facilities Agent', 'operations', 'facilities', 'Facilities specialist managing workplace operations', 'Facilities Management', ['Space Management', 'Maintenance', 'Vendor Management', 'Safety', 'Sustainability'], 'Manage facilities operations for a productive workplace.', ['space-management', 'maintenance', 'vendor-management'], ['facilities-tools', 'maintenance-tools', 'space-planning'], ['coo-agent'], ['procurement-agent', 'safety-agent']),
  createDomainAgent('safety-agent', 'Safety Agent', 'operations', 'safety', 'Safety specialist ensuring workplace safety compliance', 'Workplace Safety', ['Safety Programs', 'Incident Investigation', 'Training', 'Compliance', 'Risk Assessment'], 'Ensure workplace safety and regulatory compliance.', ['safety-programs', 'incident-investigation', 'compliance'], ['safety-tools', 'training-platform', 'reporting'], ['coo-agent'], ['hr-agent', 'facilities-agent'], 'L2', 'high'),
  createDomainAgent('quality-assurance-agent', 'Quality Assurance Agent', 'operations', 'quality', 'QA specialist ensuring product and process quality', 'Quality Assurance', ['Quality Management', 'Process Improvement', 'Auditing', 'Standards Compliance', 'Training'], 'Ensure quality standards in products and processes.', ['quality-management', 'process-improvement', 'auditing'], ['quality-tools', 'audit-tools', 'documentation'], ['coo-agent'], ['operations-agent', 'production-agent'])
];

// =============================================================================
// CREATIVE TIER AGENTS (20 Agents)
// =============================================================================

function createCreativeAgent(
  id: string,
  name: string,
  category: string,
  description: string,
  primaryDomain: string,
  expertiseAreas: string[],
  capabilities: string[],
  tools: string[],
  romaLevel: RomaLevel = 'L2'
): CompleteAgentDefinition {
  return createDomainAgent(
    id, name, category, 'creative', description, primaryDomain, expertiseAreas,
    `Create high-quality ${primaryDomain.toLowerCase()} content that engages audiences and achieves objectives.`,
    capabilities, tools, ['design-director', 'content-director'], ['marketing-agent', 'product-agent'],
    romaLevel, 'medium', 'creative'
  );
}

function createQAAgent(
  id: string,
  name: string,
  category: string,
  group: string,
  description: string,
  primaryDomain: string,
  expertiseAreas: string[],
  capabilities: string[],
  tools: string[],
  reportsTo: string[],
  collaboratesWith: string[],
  romaLevel: RomaLevel = 'L2',
  securityLevel: SecurityLevel = 'medium'
): CompleteAgentDefinition {
  return createDomainAgent(
    id, name, category, group, description, primaryDomain, expertiseAreas,
    `Ensure quality through comprehensive ${primaryDomain.toLowerCase()} activities.`,
    capabilities, tools, reportsTo, collaboratesWith,
    romaLevel, securityLevel, 'qa'
  );
}

function createDevOpsAgent(
  id: string,
  name: string,
  category: string,
  group: string,
  description: string,
  primaryDomain: string,
  expertiseAreas: string[],
  capabilities: string[],
  tools: string[],
  reportsTo: string[],
  collaboratesWith: string[],
  romaLevel: RomaLevel = 'L2',
  securityLevel: SecurityLevel = 'medium'
): CompleteAgentDefinition {
  return createDomainAgent(
    id, name, category, group, description, primaryDomain, expertiseAreas,
    `Manage ${primaryDomain.toLowerCase()} infrastructure and operations.`,
    capabilities, tools, reportsTo, collaboratesWith,
    romaLevel, securityLevel, 'devops'
  );
}

export const CREATIVE_AGENTS: CompleteAgentDefinition[] = [
  createCreativeAgent('content-writer', 'Content Writer Agent', 'content', 'Content writer creating engaging written content', 'Content Writing', ['Blog Writing', 'Web Copy', 'Technical Writing', 'SEO Writing', 'Storytelling'], ['content-writing', 'seo-writing', 'storytelling'], ['writing-tools', 'seo-tools', 'grammar-tools']),
  createCreativeAgent('copywriter', 'Copywriter Agent', 'content', 'Copywriter creating persuasive marketing copy', 'Copywriting', ['Ad Copy', 'Landing Pages', 'Email Copy', 'Brand Voice', 'Conversion'], ['copywriting', 'ad-copy', 'conversion-optimization'], ['writing-tools', 'ab-testing', 'analytics']),
  createCreativeAgent('ux-designer', 'UX Designer Agent', 'design', 'UX designer creating user-centered designs', 'UX Design', ['User Research', 'Wireframing', 'Prototyping', 'Usability Testing', 'Information Architecture'], ['ux-design', 'user-research', 'prototyping'], ['figma', 'prototyping-tools', 'user-testing']),
  createCreativeAgent('ui-designer', 'UI Designer Agent', 'design', 'UI designer creating beautiful interfaces', 'UI Design', ['Visual Design', 'Design Systems', 'Responsive Design', 'Interaction Design', 'Accessibility'], ['ui-design', 'visual-design', 'design-systems'], ['figma', 'design-tools', 'prototyping']),
  createCreativeAgent('graphic-designer', 'Graphic Designer Agent', 'design', 'Graphic designer creating visual assets', 'Graphic Design', ['Brand Identity', 'Marketing Materials', 'Digital Graphics', 'Print Design', 'Illustration'], ['graphic-design', 'brand-identity', 'illustration'], ['adobe-creative', 'design-tools', 'asset-management']),
  createCreativeAgent('motion-designer', 'Motion Designer Agent', 'multimedia', 'Motion designer creating animated content', 'Motion Design', ['Animation', 'Video Editing', 'Motion Graphics', 'Visual Effects', 'Kinetic Typography'], ['motion-design', 'animation', 'video-editing'], ['after-effects', 'video-tools', 'animation-software']),
  createCreativeAgent('video-producer', 'Video Producer Agent', 'multimedia', 'Video producer creating video content', 'Video Production', ['Pre-Production', 'Filming', 'Editing', 'Post-Production', 'Distribution'], ['video-production', 'editing', 'post-production'], ['video-editing', 'production-tools', 'distribution']),
  createCreativeAgent('audio-producer', 'Audio Producer Agent', 'multimedia', 'Audio producer creating audio content', 'Audio Production', ['Podcast Production', 'Music Production', 'Sound Design', 'Audio Editing', 'Mastering'], ['audio-production', 'sound-design', 'editing'], ['audio-software', 'recording-tools', 'distribution']),
  createCreativeAgent('3d-artist', '3D Artist Agent', 'multimedia', '3D artist creating 3D content', '3D Art', ['3D Modeling', 'Texturing', 'Lighting', 'Rendering', 'Animation'], ['3d-modeling', 'rendering', 'animation'], ['3d-software', 'rendering-tools', 'asset-management']),
  createCreativeAgent('photographer', 'Photographer Agent', 'multimedia', 'Photographer capturing visual content', 'Photography', ['Product Photography', 'Lifestyle Photography', 'Editing', 'Retouching', 'Asset Management'], ['photography', 'editing', 'retouching'], ['camera-tools', 'editing-software', 'asset-management']),
  createCreativeAgent('illustrator', 'Illustrator Agent', 'design', 'Illustrator creating custom illustrations', 'Illustration', ['Digital Illustration', 'Character Design', 'Infographics', 'Icon Design', 'Storyboarding'], ['illustration', 'character-design', 'icon-design'], ['illustration-tools', 'design-software', 'tablet']),
  createCreativeAgent('brand-designer', 'Brand Designer Agent', 'design', 'Brand designer developing brand identities', 'Brand Design', ['Logo Design', 'Brand Guidelines', 'Visual Identity', 'Brand Strategy', 'Brand Application'], ['brand-design', 'logo-design', 'visual-identity'], ['design-tools', 'branding-tools', 'asset-management']),
  createCreativeAgent('web-designer', 'Web Designer Agent', 'design', 'Web designer creating website designs', 'Web Design', ['Website Design', 'Responsive Design', 'Landing Pages', 'E-commerce Design', 'WordPress'], ['web-design', 'responsive-design', 'landing-pages'], ['figma', 'web-tools', 'prototyping']),
  createCreativeAgent('presentation-designer', 'Presentation Designer Agent', 'design', 'Presentation designer creating impactful presentations', 'Presentation Design', ['Slide Design', 'Data Visualization', 'Storytelling', 'Animation', 'Templates'], ['presentation-design', 'data-visualization', 'storytelling'], ['presentation-tools', 'design-tools', 'animation']),
  createCreativeAgent('social-content-creator', 'Social Content Creator Agent', 'content', 'Social content creator for social media', 'Social Content', ['Social Graphics', 'Video Content', 'Stories', 'Reels', 'Carousels'], ['social-content', 'video-content', 'graphics'], ['social-tools', 'design-tools', 'video-tools']),
  createCreativeAgent('technical-writer', 'Technical Writer Agent', 'content', 'Technical writer creating documentation', 'Technical Writing', ['Documentation', 'API Docs', 'User Guides', 'Release Notes', 'Knowledge Base'], ['technical-writing', 'documentation', 'api-docs'], ['documentation-tools', 'wiki', 'version-control']),
  createCreativeAgent('ux-writer', 'UX Writer Agent', 'content', 'UX writer crafting microcopy and interface text', 'UX Writing', ['Microcopy', 'Error Messages', 'Onboarding', 'CTAs', 'Voice and Tone'], ['ux-writing', 'microcopy', 'interface-text'], ['writing-tools', 'design-tools', 'testing']),
  createCreativeAgent('scriptwriter', 'Scriptwriter Agent', 'content', 'Scriptwriter creating scripts for video and audio', 'Scriptwriting', ['Video Scripts', 'Podcast Scripts', 'Explainer Videos', 'Ads', 'Narration'], ['scriptwriting', 'video-scripts', 'narration'], ['writing-tools', 'video-tools', 'audio-tools']),
  createCreativeAgent('creative-director', 'Creative Director Agent', 'creative-leadership', 'Creative director leading creative vision', 'Creative Direction', ['Creative Strategy', 'Team Leadership', 'Brand Oversight', 'Campaign Direction', 'Quality Control'], ['creative-direction', 'strategy', 'team-leadership'], ['creative-tools', 'project-management', 'collaboration'], 'L3'),
  createCreativeAgent('art-director', 'Art Director Agent', 'creative-leadership', 'Art director overseeing visual elements', 'Art Direction', ['Visual Concept', 'Team Direction', 'Brand Consistency', 'Creative Reviews', 'Vendor Management'], ['art-direction', 'visual-concept', 'brand-consistency'], ['design-tools', 'project-management', 'collaboration'], 'L3')
];

// =============================================================================
// QA TIER AGENTS (15 Agents)
// =============================================================================

export const QA_AGENTS: CompleteAgentDefinition[] = [
  createQAAgent('qa-lead', 'QA Lead Agent', 'qa', 'leadership', 'QA lead managing quality assurance strategy and team', 'QA Leadership', ['QA Strategy', 'Test Planning', 'Team Management', 'Process Improvement', 'Metrics'], ['qa-strategy', 'test-planning', 'team-management'], ['qa-tools', 'test-management', 'analytics'], ['vp-engineering'], ['qa-engineer', 'test-automation-engineer'], 'L3'),
  createQAAgent('qa-engineer', 'QA Engineer Agent', 'qa', 'testing', 'QA engineer testing software quality', 'Quality Engineering', ['Test Case Design', 'Manual Testing', 'Bug Reporting', 'Regression Testing', 'Exploratory Testing'], ['test-case-design', 'manual-testing', 'bug-reporting'], ['test-management', 'bug-tracking', 'testing-tools'], ['qa-lead'], ['developer-agent', 'test-automation-engineer']),
  createQAAgent('test-automation-engineer', 'Test Automation Engineer Agent', 'qa', 'automation', 'Test automation engineer building automated tests', 'Test Automation', ['Test Frameworks', 'Script Development', 'CI Integration', 'Maintenance', 'Reporting'], ['test-automation', 'framework-development', 'ci-integration'], ['automation-tools', 'testing-frameworks', 'ci-tools'], ['qa-lead'], ['qa-engineer', 'devops-engineer']),
  createQAAgent('performance-tester', 'Performance Tester Agent', 'qa', 'performance', 'Performance tester evaluating system performance', 'Performance Testing', ['Load Testing', 'Stress Testing', 'Performance Analysis', 'Benchmarking', 'Optimization'], ['load-testing', 'stress-testing', 'performance-analysis'], ['performance-tools', 'monitoring', 'analytics'], ['qa-lead'], ['devops-engineer', 'backend-developer']),
  createQAAgent('security-tester', 'Security Tester Agent', 'qa', 'security', 'Security tester identifying vulnerabilities', 'Security Testing', ['Penetration Testing', 'Vulnerability Assessment', 'Security Scanning', 'Code Review', 'Compliance Testing'], ['penetration-testing', 'vulnerability-assessment', 'security-scanning'], ['security-tools', 'scanners', 'reporting'], ['ciso-agent', 'qa-lead'], ['security-developer', 'devops-engineer'], 'L3', 'high'),
  createQAAgent('mobile-tester', 'Mobile Tester Agent', 'qa', 'mobile', 'Mobile tester ensuring mobile app quality', 'Mobile Testing', ['iOS Testing', 'Android Testing', 'Cross-Device Testing', 'App Store Compliance', 'Performance'], ['mobile-testing', 'cross-device', 'app-store-compliance'], ['mobile-testing-tools', 'device-lab', 'automation'], ['qa-lead'], ['mobile-developer', 'qa-engineer']),
  createQAAgent('api-tester', 'API Tester Agent', 'qa', 'api', 'API tester validating API functionality', 'API Testing', ['Functional Testing', 'Contract Testing', 'Integration Testing', 'Load Testing', 'Documentation'], ['api-testing', 'contract-testing', 'integration-testing'], ['api-testing-tools', 'postman', 'automation'], ['qa-lead'], ['api-developer', 'backend-developer']),
  createQAAgent('accessibility-tester', 'Accessibility Tester Agent', 'qa', 'accessibility', 'Accessibility tester ensuring accessible products', 'Accessibility Testing', ['WCAG Testing', 'Screen Reader Testing', 'Keyboard Navigation', 'Color Contrast', 'ARIA'], ['accessibility-testing', 'wcag', 'screen-reader-testing'], ['accessibility-tools', 'screen-readers', 'checkers'], ['qa-lead'], ['accessibility-engineer', 'frontend-developer']),
  createQAAgent('localization-tester', 'Localization Tester Agent', 'qa', 'localization', 'Localization tester validating multilingual quality', 'Localization Testing', ['Linguistic Testing', 'Functional Testing', 'UI Testing', 'Cultural Appropriateness', 'Character Encoding'], ['localization-testing', 'linguistic-testing', 'ui-testing'], ['localization-tools', 'testing-tools', 'translation-tools'], ['qa-lead'], ['localization-agent', 'translator-agent']),
  createQAAgent('uat-coordinator', 'UAT Coordinator Agent', 'qa', 'uat', 'UAT coordinator managing user acceptance testing', 'User Acceptance Testing', ['UAT Planning', 'User Coordination', 'Test Scenarios', 'Feedback Collection', 'Sign-off'], ['uat-planning', 'user-coordination', 'feedback-collection'], ['test-management', 'communication-tools', 'documentation'], ['qa-lead'], ['product-owner', 'business-analyst']),
  createQAAgent('regression-tester', 'Regression Tester Agent', 'qa', 'regression', 'Regression tester ensuring no new defects', 'Regression Testing', ['Test Suite Maintenance', 'Impact Analysis', 'Smoke Testing', 'Sanity Testing', 'Release Validation'], ['regression-testing', 'test-suite-maintenance', 'release-validation'], ['test-management', 'automation-tools', 'reporting'], ['qa-lead'], ['test-automation-engineer', 'qa-engineer']),
  createQAAgent('test-data-specialist', 'Test Data Specialist Agent', 'qa', 'data', 'Test data specialist managing test data', 'Test Data Management', ['Data Generation', 'Data Masking', 'Data Provisioning', 'Data Refresh', 'Compliance'], ['data-generation', 'data-masking', 'data-provisioning'], ['test-data-tools', 'database-tools', 'masking-tools'], ['qa-lead'], ['database-developer', 'test-automation-engineer'], 'L2', 'high'),
  createQAAgent('release-coordinator', 'Release Coordinator Agent', 'qa', 'release', 'Release coordinator managing release quality', 'Release Management', ['Release Planning', 'Quality Gates', 'Go/No-Go', 'Release Notes', 'Deployment Coordination'], ['release-planning', 'quality-gates', 'deployment-coordination'], ['release-tools', 'documentation', 'communication'], ['qa-lead', 'devops-lead'], ['devops-engineer', 'test-automation-engineer']),
  createQAAgent('compliance-tester', 'Compliance Tester Agent', 'qa', 'compliance', 'Compliance tester validating regulatory compliance', 'Compliance Testing', ['SOC2 Testing', 'HIPAA Testing', 'PCI-DSS', 'GDPR', 'Industry Standards'], ['compliance-testing', 'soc2', 'gdpr'], ['compliance-tools', 'audit-tools', 'documentation'], ['compliance-officer', 'qa-lead'], ['security-tester', 'audit-agent'], 'L3', 'high'),
  createQAAgent('chaos-engineer', 'Chaos Engineer Agent', 'qa', 'chaos', 'Chaos engineer testing system resilience', 'Chaos Engineering', ['Failure Injection', 'Resilience Testing', 'Game Days', 'Blast Radius', 'Recovery Testing'], ['chaos-engineering', 'failure-injection', 'resilience-testing'], ['chaos-tools', 'monitoring', 'automation'], ['sre-engineer', 'qa-lead'], ['devops-engineer', 'backend-developer'], 'L3')
];

// =============================================================================
// DEVOPS TIER AGENTS (17 Agents)
// =============================================================================

export const DEVOPS_AGENTS: CompleteAgentDefinition[] = [
  createDevOpsAgent('devops-lead', 'DevOps Lead Agent', 'devops', 'leadership', 'DevOps lead managing DevOps strategy and team', 'DevOps Leadership', ['DevOps Strategy', 'Team Management', 'Pipeline Design', 'Tooling', 'Culture'], ['devops-strategy', 'pipeline-design', 'team-management'], ['devops-tools', 'ci-cd', 'monitoring'], ['vp-engineering'], ['devops-engineer', 'sre-engineer'], 'L4'),
  createDevOpsAgent('ci-cd-engineer', 'CI/CD Engineer Agent', 'devops', 'cicd', 'CI/CD engineer building delivery pipelines', 'CI/CD', ['Pipeline Development', 'Build Automation', 'Deployment Automation', 'Testing Integration', 'Artifact Management'], ['pipeline-development', 'build-automation', 'deployment-automation'], ['jenkins', 'github-actions', 'gitlab-ci', 'argocd'], ['devops-lead'], ['backend-developer', 'test-automation-engineer']),
  createDevOpsAgent('infrastructure-engineer', 'Infrastructure Engineer Agent', 'devops', 'infrastructure', 'Infrastructure engineer managing cloud and on-prem infrastructure', 'Infrastructure', ['Cloud Infrastructure', 'Networking', 'Compute', 'Storage', 'Cost Optimization'], ['cloud-infrastructure', 'networking', 'compute-management'], ['terraform', 'cloud-consoles', 'monitoring'], ['devops-lead'], ['cloud-engineer', 'security-engineer']),
  createDevOpsAgent('kubernetes-engineer', 'Kubernetes Engineer Agent', 'devops', 'kubernetes', 'Kubernetes engineer managing container orchestration', 'Kubernetes', ['Cluster Management', 'Helm', 'Operators', 'Service Mesh', 'Security'], ['cluster-management', 'helm', 'service-mesh'], ['kubernetes', 'helm', 'istio', 'monitoring'], ['devops-lead'], ['infrastructure-engineer', 'backend-developer']),
  createDevOpsAgent('monitoring-engineer', 'Monitoring Engineer Agent', 'devops', 'monitoring', 'Monitoring engineer implementing observability', 'Observability', ['Metrics', 'Logging', 'Tracing', 'Alerting', 'Dashboards'], ['metrics', 'logging', 'tracing', 'alerting'], ['prometheus', 'grafana', 'elk', 'datadog'], ['devops-lead', 'sre-engineer'], ['backend-developer', 'infrastructure-engineer']),
  createDevOpsAgent('database-admin', 'Database Administrator Agent', 'devops', 'database', 'DBA managing database infrastructure', 'Database Administration', ['Database Management', 'Performance Tuning', 'Backup/Recovery', 'High Availability', 'Security'], ['database-management', 'performance-tuning', 'backup-recovery'], ['database-tools', 'monitoring', 'backup-tools'], ['devops-lead'], ['database-developer', 'infrastructure-engineer'], 'L3', 'high'),
  createDevOpsAgent('network-engineer', 'Network Engineer Agent', 'devops', 'network', 'Network engineer managing network infrastructure', 'Networking', ['Network Design', 'Firewall', 'Load Balancing', 'VPN', 'DNS'], ['network-design', 'firewall', 'load-balancing'], ['network-tools', 'monitoring', 'security-tools'], ['devops-lead'], ['infrastructure-engineer', 'security-engineer'], 'L3', 'high'),
  createDevOpsAgent('security-engineer-devops', 'DevSecOps Engineer Agent', 'devops', 'security', 'DevSecOps engineer integrating security into DevOps', 'DevSecOps', ['Security Automation', 'Pipeline Security', 'Vulnerability Management', 'Compliance', 'Container Security'], ['security-automation', 'pipeline-security', 'vulnerability-management'], ['security-tools', 'sast', 'dast', 'container-scanning'], ['devops-lead', 'ciso-agent'], ['ci-cd-engineer', 'security-tester'], 'L3', 'high'),
  createDevOpsAgent('release-engineer', 'Release Engineer Agent', 'devops', 'release', 'Release engineer managing software releases', 'Release Engineering', ['Release Planning', 'Deployment', 'Rollback', 'Feature Flags', 'Blue/Green'], ['release-planning', 'deployment', 'feature-flags'], ['deployment-tools', 'feature-flag-tools', 'monitoring'], ['devops-lead'], ['ci-cd-engineer', 'qa-engineer']),
  createDevOpsAgent('configuration-engineer', 'Configuration Engineer Agent', 'devops', 'configuration', 'Configuration engineer managing system configuration', 'Configuration Management', ['Configuration as Code', 'Secrets Management', 'Environment Management', 'Drift Detection', 'Compliance'], ['configuration-as-code', 'secrets-management', 'environment-management'], ['ansible', 'chef', 'puppet', 'vault'], ['devops-lead'], ['infrastructure-engineer', 'security-engineer']),
  createDevOpsAgent('backup-recovery-engineer', 'Backup & Recovery Engineer Agent', 'devops', 'backup', 'Backup engineer managing data protection', 'Backup & Recovery', ['Backup Strategy', 'Disaster Recovery', 'Data Protection', 'Testing', 'Compliance'], ['backup-strategy', 'disaster-recovery', 'data-protection'], ['backup-tools', 'dr-tools', 'testing'], ['devops-lead'], ['database-admin', 'infrastructure-engineer'], 'L3', 'high'),
  createDevOpsAgent('cost-optimization-engineer', 'Cloud Cost Engineer Agent', 'devops', 'cost', 'Cloud cost engineer optimizing cloud spend', 'Cloud Cost Optimization', ['Cost Analysis', 'Right-Sizing', 'Reserved Instances', 'Spot Instances', 'Tagging'], ['cost-analysis', 'right-sizing', 'optimization'], ['cloud-cost-tools', 'analytics', 'monitoring'], ['devops-lead', 'cfo-agent'], ['infrastructure-engineer', 'cloud-engineer']),
  createDevOpsAgent('automation-engineer', 'Automation Engineer Agent', 'devops', 'automation', 'Automation engineer automating operations', 'Automation', ['Runbook Automation', 'Self-Healing', 'Orchestration', 'Scripting', 'Integration'], ['runbook-automation', 'orchestration', 'scripting'], ['automation-tools', 'scripting', 'orchestration'], ['devops-lead'], ['sre-engineer', 'infrastructure-engineer']),
  createDevOpsAgent('container-engineer', 'Container Engineer Agent', 'devops', 'containers', 'Container engineer managing containerization', 'Containerization', ['Docker', 'Container Optimization', 'Registry Management', 'Security', 'Orchestration'], ['docker', 'container-optimization', 'registry-management'], ['docker', 'registry', 'scanning-tools'], ['devops-lead'], ['kubernetes-engineer', 'backend-developer']),
  createDevOpsAgent('service-mesh-engineer', 'Service Mesh Engineer Agent', 'devops', 'service-mesh', 'Service mesh engineer managing service communication', 'Service Mesh', ['Istio', 'Envoy', 'Traffic Management', 'Security', 'Observability'], ['istio', 'traffic-management', 'service-security'], ['istio', 'envoy', 'monitoring'], ['devops-lead'], ['kubernetes-engineer', 'network-engineer']),
  createDevOpsAgent('gitops-engineer', 'GitOps Engineer Agent', 'devops', 'gitops', 'GitOps engineer implementing GitOps practices', 'GitOps', ['ArgoCD', 'Flux', 'Declarative Infrastructure', 'Drift Detection', 'Rollback'], ['argocd', 'flux', 'declarative-infrastructure'], ['argocd', 'flux', 'git'], ['devops-lead'], ['ci-cd-engineer', 'kubernetes-engineer']),
  createDevOpsAgent('on-call-engineer', 'On-Call Engineer Agent', 'devops', 'oncall', 'On-call engineer managing incident response', 'Incident Response', ['Incident Management', 'Escalation', 'Troubleshooting', 'Post-Mortems', 'Runbooks'], ['incident-management', 'troubleshooting', 'post-mortems'], ['pagerduty', 'monitoring', 'runbooks'], ['sre-engineer'], ['devops-engineer', 'backend-developer'])
];

// =============================================================================
// COMBINE ALL DOMAIN AGENTS
// =============================================================================

export const ALL_DOMAIN_AGENTS: CompleteAgentDefinition[] = [
  ...MARKETING_AGENTS,
  ...SALES_AGENTS,
  ...HR_AGENTS,
  ...FINANCE_AGENTS,
  ...LEGAL_AGENTS,
  ...CUSTOMER_SUCCESS_AGENTS,
  ...ADDITIONAL_DOMAIN_AGENTS
];

export const AGENT_COUNTS = {
  domain: ALL_DOMAIN_AGENTS.length,
  creative: CREATIVE_AGENTS.length,
  qa: QA_AGENTS.length,
  devops: DEVOPS_AGENTS.length,
  total: ALL_DOMAIN_AGENTS.length + CREATIVE_AGENTS.length + QA_AGENTS.length + DEVOPS_AGENTS.length
};

console.log(`Domain, Creative, QA, DevOps Agents Loaded:`);
console.log(`  Domain: ${AGENT_COUNTS.domain}`);
console.log(`  Creative: ${AGENT_COUNTS.creative}`);
console.log(`  QA: ${AGENT_COUNTS.qa}`);
console.log(`  DevOps: ${AGENT_COUNTS.devops}`);
console.log(`  Total: ${AGENT_COUNTS.total}`);
