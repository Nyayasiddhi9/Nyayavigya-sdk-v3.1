/**
 * Wizards Incubator Platform - Shared Types & Interfaces
 * Complete type definitions for the entire platform
 * Built on WAI SDK v1.0 Orchestration Backbone
 */

import type {
  WizardsFounder,
  WizardsStartup,
  WizardsJourneyTimeline,
  WizardsStudio,
  WizardsStudioSession,
  WizardsStudioTask,
  WizardsStudioDeliverable,
  WizardsArtifact,
  WizardsCodeRepository,
  WizardsDesignAsset,
  WizardsIndustryTemplate,
  WizardsTemplateUsage,
  WizardsAutomationPipeline,
  WizardsPipelineRun,
  WizardsDeployment,
  WizardsAnalytic,
  WizardsExperiment,
  WizardsGrowthMetric,
  WizardsCreditTransaction,
  WizardsSubscription,
  WizardsUsageTracking,
  WizardsReferral,
  WizardsCommunityPost,
  WizardsMarketplace,
  WizardsOrchestrationJob,
} from './schema';

// ================================================================================================
// CONSTANTS & ENUMS
// ================================================================================================

/**
 * Canonical Studios Array
 * Source of Truth: server/services/wizards-studio-initializer.ts
 * 10 studios with hyphenated slugs matching database
 */
export const WIZARDS_STUDIOS = [
  {
    id: 'ideation-lab',
    name: 'Ideation Lab',
    sequence: 1,
    dayRange: '1-2',
    estimatedDays: 2,
    icon: '🧠',
    color: '#8B5CF6',
    category: 'ideation',
  },
  {
    id: 'engineering-forge',
    name: 'Engineering Forge',
    sequence: 2,
    dayRange: '5-10',
    estimatedDays: 4,
    icon: '💻',
    color: '#3B82F6',
    category: 'development',
  },
  {
    id: 'market-intelligence',
    name: 'Market Intelligence',
    sequence: 3,
    dayRange: '2-3',
    estimatedDays: 2,
    icon: '📊',
    color: '#10B981',
    category: 'market',
  },
  {
    id: 'product-blueprint',
    name: 'Product Blueprint',
    sequence: 4,
    dayRange: '3-4',
    estimatedDays: 2,
    icon: '📐',
    color: '#6366F1',
    category: 'product',
  },
  {
    id: 'experience-design',
    name: 'Experience Design',
    sequence: 5,
    dayRange: '4-5',
    estimatedDays: 3,
    icon: '🎨',
    color: '#EC4899',
    category: 'design',
  },
  {
    id: 'quality-assurance-lab',
    name: 'Quality Assurance Lab',
    sequence: 6,
    dayRange: '9-10',
    estimatedDays: 2,
    icon: '🛡️',
    color: '#06B6D4',
    category: 'quality',
  },
  {
    id: 'growth-engine',
    name: 'Growth Engine',
    sequence: 7,
    dayRange: '10-12',
    estimatedDays: 3,
    icon: '📈',
    color: '#8B5CF6',
    category: 'growth',
  },
  {
    id: 'launch-command',
    name: 'Launch Command',
    sequence: 8,
    dayRange: '12-14',
    estimatedDays: 3,
    icon: '🚀',
    color: '#F97316',
    category: 'deployment',
  },
  {
    id: 'operations-hub',
    name: 'Operations Hub',
    sequence: 9,
    dayRange: '14+',
    estimatedDays: 2,
    icon: '📊',
    color: '#14B8A6',
    category: 'operations',
  },
  {
    id: 'deployment-studio',
    name: 'Deployment Studio',
    sequence: 10,
    dayRange: '12-14',
    estimatedDays: 1,
    icon: '🚀',
    color: '#6366F1',
    category: 'deployment',
  },
] as const;

export const INDUSTRY_TEMPLATES = [
  {
    id: 'fintech',
    name: 'Fintech',
    icon: '💰',
    estimatedDays: 4,
    complexity: 'high',
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    icon: '🏥',
    estimatedDays: 5,
    complexity: 'high',
  },
  {
    id: 'ecommerce',
    name: 'E-commerce',
    icon: '🛒',
    estimatedDays: 3,
    complexity: 'medium',
  },
  {
    id: 'saas',
    name: 'SaaS',
    icon: '💼',
    estimatedDays: 4,
    complexity: 'medium',
  },
  {
    id: 'edtech',
    name: 'EdTech',
    icon: '📚',
    estimatedDays: 4,
    complexity: 'medium',
  },
  {
    id: 'real-estate',
    name: 'Real Estate',
    icon: '🏠',
    estimatedDays: 3,
    complexity: 'medium',
  },
  {
    id: 'travel',
    name: 'Travel & Hospitality',
    icon: '✈️',
    estimatedDays: 5,
    complexity: 'high',
  },
  {
    id: 'food-delivery',
    name: 'Food & Delivery',
    icon: '🍔',
    estimatedDays: 4,
    complexity: 'medium',
  },
  {
    id: 'social-media',
    name: 'Social Media',
    icon: '📱',
    estimatedDays: 6,
    complexity: 'high',
  },
  {
    id: 'gaming',
    name: 'Gaming & Entertainment',
    icon: '🎮',
    estimatedDays: 5,
    complexity: 'high',
  },
] as const;

export const TECH_STACKS = {
  frontend: ['React', 'Next.js', 'Vue', 'Nuxt', 'Angular', 'Svelte', 'Flutter', 'React Native'],
  backend: ['Node.js', 'Python', 'Go', 'Java', 'Ruby', 'PHP'],
  database: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Supabase', 'PlanetScale'],
  cloud: ['AWS', 'GCP', 'Azure', 'Vercel', 'Netlify', 'Railway'],
  mobile: ['React Native', 'Flutter', 'iOS (Swift)', 'Android (Kotlin)'],
} as const;

export const SUBSCRIPTION_TIERS = {
  FREE: {
    id: 'free',
    name: 'Founder',
    price: 0,
    projects: 1,
    credits: 100,
    studios: ['ideation-lab', 'product-blueprint'],
  },
  PRO: {
    id: 'pro',
    name: 'Builder',
    price: 99,
    projects: 5,
    credits: 1000,
    studios: 'all',
  },
  TEAM: {
    id: 'team',
    name: 'Accelerator',
    price: 499,
    projects: Infinity,
    credits: 10000,
    studios: 'all',
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Incubator',
    price: null,
    projects: Infinity,
    credits: Infinity,
    studios: 'all',
  },
} as const;

// ================================================================================================
// CORE PLATFORM TYPES
// ================================================================================================

export type FounderType = 'solo' | 'co-founder' | 'team';
export type StartupStage = 'idea' | 'validation' | 'mvp' | 'growth' | 'scale' | 'launched';
export type StudioStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped' | 'failed';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface FounderProfile extends WizardsFounder {
  achievements?: Achievement[];
  progress: FounderProgress;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date;
  category: 'milestone' | 'quality' | 'speed' | 'community' | 'special';
}

export interface FounderProgress {
  completedStudios: number;
  totalStudios: number;
  completionPercentage: number;
  currentDay: number;
  startupCount: number;
  launchedCount: number;
}

// ================================================================================================
// STUDIO ENGINE TYPES
// ================================================================================================

export interface StudioDefinition {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  color: string;
  sequence: number;
  category: StudioCategory;
  estimatedDays: number;
  dayRange: string;
  features: StudioFeature[];
  deliverables: StudioDeliverable[];
  agents: string[];
  dependencies: string[];
  workflow: StudioWorkflow;
}

export type StudioCategory =
  | 'discovery'
  | 'planning'
  | 'design'
  | 'development'
  | 'advanced'
  | 'compliance'
  | 'marketing'
  | 'deployment'
  | 'operations';

export interface StudioFeature {
  id: string;
  name: string;
  description: string;
  required: boolean;
  estimatedTime: number;
}

export interface StudioDeliverable {
  id: string;
  name: string;
  description: string;
  type: DeliverableType;
  format: string;
  required: boolean;
}

export type DeliverableType =
  | 'document'
  | 'design'
  | 'code'
  | 'data'
  | 'report'
  | 'presentation'
  | 'media';

export interface StudioWorkflow {
  steps: WorkflowStep[];
  parallelizable: boolean;
  estimatedDuration: number;
}

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  type: WorkflowStepType;
  agents: string[];
  inputs: WorkflowInput[];
  outputs: WorkflowOutput[];
  validation: ValidationRule[];
}

export type WorkflowStepType =
  | 'data-collection'
  | 'analysis'
  | 'generation'
  | 'review'
  | 'approval'
  | 'deployment';

export interface WorkflowInput {
  id: string;
  name: string;
  description: string;
  type: 'text' | 'file' | 'json' | 'url' | 'selection';
  required: boolean;
  validation?: string;
}

export interface WorkflowOutput {
  id: string;
  name: string;
  description: string;
  type: string;
  format: string;
}

export interface ValidationRule {
  field: string;
  rule: 'required' | 'min_length' | 'max_length' | 'pattern' | 'custom';
  value?: any;
  message: string;
}

// ================================================================================================
// ORCHESTRATION TYPES
// ================================================================================================

export interface OrchestrationRequest {
  startupId: number;
  sessionId?: number;
  taskId?: number;
  jobType: OrchestrationJobType;
  workflow?: OrchestrationWorkflow;
  agents?: string[];
  inputs: Record<string, any>;
  priority?: Priority;
  budget?: OrchestrationBudget;
  deterministicMode?: boolean;
}

export type OrchestrationJobType =
  | 'analysis'
  | 'generation'
  | 'review'
  | 'optimization'
  | 'deployment'
  | 'workflow';

export type OrchestrationWorkflow = 'sequential' | 'parallel' | 'bmad' | 'custom';

export interface OrchestrationBudget {
  maxCredits?: number;
  maxDuration?: number;
  preferredCostTier?: 'free' | 'low' | 'medium' | 'high';
}

export interface OrchestrationResult {
  jobId: string;
  status: 'success' | 'partial' | 'failed';
  outputs: Record<string, any>;
  agentsUsed: string[];
  providersUsed: string[];
  modelsUsed: string[];
  creditsConsumed: number;
  tokensUsed: number;
  cost: number;
  duration: number;
  qualityScore?: number;
  errorMessage?: string;
}

// ================================================================================================
// ARTIFACT STORE TYPES
// ================================================================================================

export interface Artifact {
  id: number;
  type: ArtifactType;
  category: ArtifactCategory;
  name: string;
  description: string;
  content?: string;
  fileUrl?: string;
  metadata: ArtifactMetadata;
  version: string;
  tags: string[];
}

export type ArtifactType =
  | 'code'
  | 'design'
  | 'document'
  | 'data'
  | 'media'
  | 'configuration'
  | 'deployment';

export type ArtifactCategory =
  | 'source-code'
  | 'wireframe'
  | 'mockup'
  | 'prototype'
  | 'business-plan'
  | 'requirements'
  | 'test-data'
  | 'analytics'
  | 'image'
  | 'video'
  | 'audio'
  | 'deployment-config'
  | 'ci-cd-pipeline';

export interface ArtifactMetadata {
  studioId?: string;
  sessionId?: number;
  createdBy?: string;
  size?: number;
  format?: string;
  language?: string;
  framework?: string;
  [key: string]: any;
}

export interface CodeArtifact extends Artifact {
  type: 'code';
  repository?: string;
  branch?: string;
  commitHash?: string;
  fileStructure?: Record<string, any>;
  techStack?: TechStack;
  dependencies?: Record<string, string>;
  testCoverage?: number;
  linesOfCode?: number;
  qualityMetrics?: QualityMetrics;
}

export interface TechStack {
  frontend?: string[];
  backend?: string[];
  database?: string[];
  cloud?: string[];
  tools?: string[];
}

export interface QualityMetrics {
  complexity: number;
  maintainability: number;
  reliability: number;
  security: number;
  testCoverage: number;
  codeSmells: number;
}

// ================================================================================================
// INDUSTRY TEMPLATE TYPES
// ================================================================================================

export interface IndustryTemplate {
  id: string;
  industry: Industry;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  features: IndustryFeature[];
  techStack: TechStack;
  compliance: ComplianceRequirement[];
  integrations: Integration[];
  estimatedDeploymentDays: number;
  complexity: 'low' | 'medium' | 'high';
  blueprintData: TemplateBlueprintData;
  codeTemplates: Record<string, any>;
}

export type Industry =
  | 'fintech'
  | 'healthcare'
  | 'ecommerce'
  | 'saas'
  | 'edtech'
  | 'real-estate'
  | 'travel'
  | 'food-delivery'
  | 'social-media'
  | 'gaming';

export interface IndustryFeature {
  id: string;
  name: string;
  description: string;
  category: string;
  required: boolean;
}

export interface ComplianceRequirement {
  standard: string;
  level: string;
  description: string;
  documentation: string[];
  automation: boolean;
}

export interface Integration {
  provider: string;
  type: IntegrationType;
  purpose: string;
  required: boolean;
  configuration?: Record<string, any>;
}

export type IntegrationType =
  | 'payment'
  | 'auth'
  | 'analytics'
  | 'communication'
  | 'storage'
  | 'api'
  | 'verification';

export interface TemplateBlueprintData {
  architecture: ArchitectureBlueprint;
  database: DatabaseBlueprint;
  api: APIBlueprint;
  ui: UIBlueprint;
  deployment: DeploymentBlueprint;
}

export interface ArchitectureBlueprint {
  pattern: 'monolith' | 'microservices' | 'serverless' | 'hybrid';
  services: ServiceDefinition[];
  infrastructure: InfrastructureComponent[];
}

export interface ServiceDefinition {
  name: string;
  type: string;
  language: string;
  framework: string;
  responsibilities: string[];
}

export interface InfrastructureComponent {
  name: string;
  type: string;
  provider: string;
  configuration: Record<string, any>;
}

export interface DatabaseBlueprint {
  type: 'sql' | 'nosql' | 'hybrid';
  provider: string;
  schema: DatabaseSchema[];
  migrations: boolean;
  backups: BackupStrategy;
}

export interface DatabaseSchema {
  tableName: string;
  fields: DatabaseField[];
  indexes: string[];
  relationships: DatabaseRelationship[];
}

export interface DatabaseField {
  name: string;
  type: string;
  required: boolean;
  unique: boolean;
  default?: any;
  validation?: string;
}

export interface DatabaseRelationship {
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  table: string;
  foreignKey: string;
}

export interface BackupStrategy {
  frequency: 'hourly' | 'daily' | 'weekly';
  retention: number;
  automated: boolean;
}

export interface APIBlueprint {
  type: 'rest' | 'graphql' | 'grpc';
  versioning: boolean;
  authentication: AuthMethod[];
  endpoints: APIEndpoint[];
}

export interface AuthMethod {
  type: 'jwt' | 'oauth2' | 'api-key' | 'session';
  provider?: string;
}

export interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  description: string;
  authentication: boolean;
  rateLimit?: number;
  requestBody?: Record<string, any>;
  response: Record<string, any>;
}

export interface UIBlueprint {
  framework: string;
  designSystem: DesignSystem;
  pages: UIPage[];
  components: UIComponent[];
}

export interface DesignSystem {
  colors: ColorPalette;
  typography: Typography;
  spacing: number[];
  breakpoints: Record<string, number>;
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  error: string;
  warning: string;
  success: string;
  info: string;
}

export interface Typography {
  fontFamily: string;
  fontSizes: Record<string, number>;
  fontWeights: Record<string, number>;
  lineHeights: Record<string, number>;
}

export interface UIPage {
  name: string;
  route: string;
  description: string;
  components: string[];
  layout: string;
}

export interface UIComponent {
  name: string;
  type: string;
  props: ComponentProp[];
  variants: string[];
}

export interface ComponentProp {
  name: string;
  type: string;
  required: boolean;
  default?: any;
}

export interface DeploymentBlueprint {
  provider: string;
  region: string;
  environment: 'development' | 'staging' | 'production';
  cicd: boolean;
  monitoring: MonitoringConfig;
  scaling: ScalingConfig;
}

export interface MonitoringConfig {
  provider: string;
  metrics: string[];
  alerts: AlertConfig[];
}

export interface AlertConfig {
  name: string;
  condition: string;
  threshold: number;
  action: string;
}

export interface ScalingConfig {
  type: 'manual' | 'auto';
  minInstances: number;
  maxInstances: number;
  metric: string;
  threshold: number;
}

// ================================================================================================
// GROWTH & ANALYTICS TYPES
// ================================================================================================

export interface GrowthMetrics {
  date: Date;
  users: number;
  newUsers: number;
  activeUsers: number;
  revenue: number;
  mrr: number;
  arr: number;
  churnRate: number;
  conversionRate: number;
  cac: number;
  ltv: number;
  growthRate: number;
}

export interface Experiment {
  id: number;
  name: string;
  type: ExperimentType;
  hypothesis: string;
  status: ExperimentStatus;
  variants: ExperimentVariant[];
  successMetrics: string[];
  results?: ExperimentResults;
  confidence?: number;
  winner?: string;
}

export type ExperimentType = 'ab-test' | 'multivariate' | 'feature-flag' | 'personalization';
export type ExperimentStatus = 'draft' | 'running' | 'completed' | 'paused' | 'archived';

export interface ExperimentVariant {
  id: string;
  name: string;
  description: string;
  allocation: number;
  configuration: Record<string, any>;
}

export interface ExperimentResults {
  variants: VariantResults[];
  statisticalSignificance: boolean;
  confidence: number;
  winner?: string;
  insights: string[];
}

export interface VariantResults {
  variantId: string;
  impressions: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  confidence: number;
}

// ================================================================================================
// DEPLOYMENT & AUTOMATION TYPES
// ================================================================================================

export interface DeploymentConfig {
  provider: 'aws' | 'gcp' | 'azure' | 'vercel' | 'netlify' | 'railway';
  region: string;
  environment: 'development' | 'staging' | 'production';
  domain?: string;
  ssl: boolean;
  cdn: boolean;
  autoScaling: boolean;
  monitoring: boolean;
}

export interface PipelineConfig {
  type: 'build' | 'test' | 'deploy' | 'release' | 'rollback';
  provider: 'github-actions' | 'gitlab-ci' | 'circleci' | 'jenkins';
  triggers: PipelineTrigger[];
  stages: PipelineStage[];
  notifications: NotificationConfig[];
}

export interface PipelineTrigger {
  type: 'push' | 'pull-request' | 'schedule' | 'manual';
  branches?: string[];
  schedule?: string;
}

export interface PipelineStage {
  name: string;
  order: number;
  steps: PipelineStep[];
  condition?: string;
}

export interface PipelineStep {
  name: string;
  command: string;
  timeout?: number;
  retries?: number;
  continueOnError?: boolean;
}

export interface NotificationConfig {
  channel: 'email' | 'slack' | 'webhook';
  events: string[];
  recipients: string[];
}

// ================================================================================================
// UTILITY TYPES
// ================================================================================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
  metadata?: ResponseMetadata;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

export interface ResponseMetadata {
  timestamp: Date;
  requestId: string;
  duration: number;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface SearchFilters {
  query?: string;
  category?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  tags?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
