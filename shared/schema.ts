import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, uuid, index, uniqueIndex, primaryKey, numeric, real, foreignKey, customType } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Custom vector type for pgvector
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(1536)'; // OpenAI text-embedding-3-small dimension
  },
  toDriver(value: number[]): string {
    return JSON.stringify(value);
  },
  fromDriver(value: string): number[] {
    return JSON.parse(value);
  },
});

// Enterprise User Management System - Production Schema (matches actual database)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").unique(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").default(sql`now()`),
  passwordHash: text("password_hash"),
  status: text("status").default("active"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  passwordSalt: text("salt"),
  googleId: text("google_id").unique(),
  githubId: text("github_id").unique(),
  replitId: text("replit_id").unique(),
  avatarUrl: text("avatar_url"),
  profileImage: text("profile_image"),
  subscriptionPlan: text("subscription_plan").notNull().default("alpha"),
  subscriptionStatus: text("subscription_status").notNull().default("trial"),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  trialExpiresAt: timestamp("trial_expires_at"),
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  permissions: jsonb("permissions").default(sql`'["project.create", "project.read"]'::jsonb`),
  preferences: jsonb("preferences").default(sql`'{}'::jsonb`),
  updatedAt: timestamp("updated_at"),
  lastLoginAt: timestamp("last_login_at"),
  organizationId: integer("organization_id"),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
});

// Express Session Store for PostgreSQL (used by connect-pg-simple)
export const session = pgTable("session", {
  sid: varchar("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// WAI SDK v1.0 Feature Flags - Per-Studio Enablement System
export const featureFlags = pgTable("feature_flags", {
  id: serial("id").primaryKey(),
  flagKey: text("flag_key").notNull(), // e.g., 'wai_v1_content_studio', 'wai_v1_ideation_lab'
  flagName: text("flag_name").notNull(), // Human-readable name
  description: text("description"),
  enabled: boolean("enabled").notNull().default(false),
  scope: text("scope").notNull().default("global"), // 'global', 'studio', 'user', 'organization'
  scopeId: text("scope_id").notNull().default("_global"), // Use '_global' for global scope instead of null
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  flagKeyIdx: index("feature_flags_key_idx").on(table.flagKey),
  scopeIdx: index("feature_flags_scope_idx").on(table.scope, table.scopeId),
  enabledIdx: index("feature_flags_enabled_idx").on(table.enabled),
  // Composite unique constraint to allow same flagKey across different scopes
  compositeScopeUnique: uniqueIndex("feature_flags_composite_unique_idx").on(
    table.flagKey, 
    table.scope, 
    table.scopeId
  ),
}));

// User Teams and Organizations - Enhanced Enterprise Multi-Tenant SaaS
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique(),
  description: text("description"),
  logo: text("logo"),
  plan: text("plan").notNull().default("alpha"), // alpha, beta, gamma, enterprise
  planTier: text("plan_tier").default("starter"), // starter, professional, enterprise, unlimited
  settings: jsonb("settings").default('{}'),
  maxMembers: integer("max_members").default(5),
  maxAgents: integer("max_agents").default(10),
  maxTeams: integer("max_teams").default(3),
  ownerId: integer("owner_id").references(() => users.id),
  isActive: boolean("is_active").default(true),
  domain: text("domain"),
  industry: text("industry"),
  size: text("size"), // small, medium, large, enterprise
  region: text("region").default("global"),
  timezone: text("timezone").default("UTC"),
  billingEmail: text("billing_email"),
  technicalContact: text("technical_contact"),
  complianceLevel: text("compliance_level").default("standard"), // standard, hipaa, soc2, gdpr
  apiQuota: integer("api_quota").default(10000),
  monthlyTokenLimit: integer("monthly_token_limit").default(1000000),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Organization Admins - Multi-level admin management per org
export const organizationAdmins = pgTable("organization_admins", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: text("role").notNull().default("admin"), // super_admin, admin, manager, viewer
  permissions: jsonb("permissions").default(sql`'[]'::jsonb`),
  department: text("department"),
  canManageAgents: boolean("can_manage_agents").default(true),
  canManageTeams: boolean("can_manage_teams").default(true),
  canManageLLMs: boolean("can_manage_llms").default(false),
  canManageBilling: boolean("can_manage_billing").default(false),
  canManageSettings: boolean("can_manage_settings").default(false),
  canInviteUsers: boolean("can_invite_users").default(true),
  isActive: boolean("is_active").default(true),
  lastActiveAt: timestamp("last_active_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  orgUserUnique: uniqueIndex("org_admin_unique_idx").on(table.organizationId, table.userId),
}));

// Organization Agent Teams - Manage agent groups per organization
export const organizationAgentTeams = pgTable("organization_agent_teams", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  teamType: text("team_type").default("general"), // general, development, creative, qa, devops, executive
  romaLevel: text("roma_level").default("L2"), // L1, L2, L3, L4
  agentIds: jsonb("agent_ids").default(sql`'[]'::jsonb`),
  leadAgentId: text("lead_agent_id"),
  coordinationMode: text("coordination_mode").default("collaborative"), // collaborative, hierarchical, swarm, debate
  maxConcurrentTasks: integer("max_concurrent_tasks").default(5),
  priority: integer("priority").default(5),
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Organization Intelligence Rules - Business logic and routing rules
export const organizationIntelligenceRules = pgTable("organization_intelligence_rules", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  ruleName: text("rule_name").notNull(),
  ruleType: text("rule_type").notNull(), // routing, escalation, approval, cost_limit, quality_gate
  description: text("description"),
  conditions: jsonb("conditions").default(sql`'[]'::jsonb`),
  actions: jsonb("actions").default(sql`'[]'::jsonb`),
  priority: integer("priority").default(5),
  isActive: boolean("is_active").default(true),
  triggerCount: integer("trigger_count").default(0),
  lastTriggeredAt: timestamp("last_triggered_at"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Organization LLM Settings - Model control per organization
export const organizationLLMSettings = pgTable("organization_llm_settings", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  providerId: text("provider_id").notNull(), // openai, anthropic, google, etc.
  modelId: text("model_id").notNull(),
  isEnabled: boolean("is_enabled").default(true),
  priority: integer("priority").default(5),
  costLimit: numeric("cost_limit"),
  monthlyBudget: numeric("monthly_budget"),
  currentSpend: numeric("current_spend").default("0"),
  rateLimit: integer("rate_limit"),
  customEndpoint: text("custom_endpoint"),
  routingWeight: integer("routing_weight").default(1),
  preferredFor: jsonb("preferred_for").default(sql`'[]'::jsonb`), // task types
  blockedFor: jsonb("blocked_for").default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  orgModelUnique: uniqueIndex("org_llm_unique_idx").on(table.organizationId, table.providerId, table.modelId),
}));

// Organization Platform Features - Feature toggles per org
export const organizationPlatformFeatures = pgTable("organization_platform_features", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  featureKey: text("feature_key").notNull(),
  featureName: text("feature_name").notNull(),
  category: text("category").notNull(), // language, chat, multimodal, security, integrations
  isEnabled: boolean("is_enabled").default(false),
  configuration: jsonb("configuration").default(sql`'{}'::jsonb`),
  usageCount: integer("usage_count").default(0),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  orgFeatureUnique: uniqueIndex("org_feature_unique_idx").on(table.organizationId, table.featureKey),
}));

// Organization Usage Metrics - Track usage for billing and analytics
export const organizationUsageMetrics = pgTable("organization_usage_metrics", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  metricType: text("metric_type").notNull(), // api_calls, tokens, agents, storage
  metricValue: numeric("metric_value").notNull(),
  period: text("period").notNull(), // hourly, daily, monthly
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
});

// Note: projects table is defined below with more comprehensive schema

// Content Generation Projects
export const contentProjects = pgTable("content_projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  contentType: text("content_type").notNull(), // text, image, video, audio, presentation
  status: text("status").notNull().default("draft"), // draft, processing, completed, failed
  prompt: text("prompt"),
  generatedContent: jsonb("generated_content"),
  metadata: jsonb("metadata").default('{}'),
  outputUrl: text("output_url"),
  processingTime: integer("processing_time"), // milliseconds
  cost: integer("cost"), // in cents
  quality: integer("quality"), // 1-5 rating
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Phase 3 Enterprise Features - Multi-Platform Publishing
export const socialPlatforms = pgTable("social_platforms", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  platform: text("platform").notNull(), // facebook, twitter, linkedin, instagram, youtube
  platformUserId: text("platform_user_id"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  isConnected: boolean("is_connected").default(false),
  permissions: jsonb("permissions").default('[]'),
  metrics: jsonb("metrics").default('{}'), // followers, engagement, etc.
  lastSync: timestamp("last_sync"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const publishedContent = pgTable("published_content", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  mediaUrls: jsonb("media_urls").default('[]'),
  platforms: jsonb("platforms").default('[]'), // array of platform IDs
  status: text("status").notNull().default("draft"), // draft, scheduled, published, failed
  scheduledTime: timestamp("scheduled_time"),
  publishedTime: timestamp("published_time"),
  analytics: jsonb("analytics").default('{}'),
  optimizations: jsonb("optimizations").default('{}'), // AI suggestions
  hashtags: jsonb("hashtags").default('[]'),
  mentions: jsonb("mentions").default('[]'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Phase 3 Enterprise Features - AI Assistant Builder Enhanced
export const aiAssistants = pgTable("ai_assistants", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  avatar: text("avatar"),
  personality: text("personality").default("helpful"),
  capabilities: jsonb("capabilities").default('[]'),
  knowledgeBaseId: integer("knowledge_base_id"),
  promptTemplateId: integer("prompt_template_id"),
  apiEndpoint: text("api_endpoint"),
  status: text("status").notNull().default("draft"), // draft, training, active, paused
  version: text("version").default("1.0"),
  usage: jsonb("usage").default('{}'),
  performance: jsonb("performance").default('{}'),
  integrations: jsonb("integrations").default('[]'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});


export const promptTemplates = pgTable("prompt_templates", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  systemPrompt: text("system_prompt").notNull(),
  userPromptPrefix: text("user_prompt_prefix"),
  responseFormat: text("response_format"),
  variables: jsonb("variables").default('[]'),
  examples: jsonb("examples").default('[]'),
  version: text("version").default("1.0"),
  category: text("category"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Phase 3 Enterprise Features - Brand Management System
export const brands = pgTable("brands", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  organizationId: integer("organization_id").references(() => organizations.id),
  name: text("name").notNull(),
  description: text("description"),
  logo: text("logo"),
  primaryColor: text("primary_color"),
  secondaryColors: jsonb("secondary_colors").default('[]'),
  fonts: jsonb("fonts").default('[]'),
  guidelines: jsonb("guidelines").default('{}'),
  status: text("status").notNull().default("active"), // active, inactive, draft
  compliance: jsonb("compliance").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const brandAssets = pgTable("brand_assets", {
  id: serial("id").primaryKey(),
  brandId: integer("brand_id").references(() => brands.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // logo, color-palette, typography, template, image, icon
  category: text("category").notNull(),
  description: text("description"),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  size: text("size"),
  format: text("format"),
  dimensions: jsonb("dimensions"),
  colorPalette: jsonb("color_palette").default('[]'),
  tags: jsonb("tags").default('[]'),
  version: text("version").default("1.0"),
  status: text("status").notNull().default("pending"), // approved, pending, rejected, archived
  compliance: jsonb("compliance").default('{}'),
  usage: jsonb("usage").default('{}'),
  metadata: jsonb("metadata").default('{}'),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Phase 3 Enterprise Features - Advanced Collaboration Suite
export const collaborationRooms = pgTable("collaboration_rooms", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  organizationId: integer("organization_id").references(() => organizations.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // document, code, design, presentation, database
  description: text("description"),
  status: text("status").notNull().default("idle"), // active, idle, locked
  permissions: jsonb("permissions").default('{}'),
  documentContent: jsonb("document_content").default('{}'),
  version: jsonb("version").default('{}'),
  lastActivity: timestamp("last_activity").defaultNow(),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const roomParticipants = pgTable("room_participants", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").references(() => collaborationRooms.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: text("role").notNull().default("viewer"), // owner, admin, editor, viewer, commenter
  status: text("status").notNull().default("offline"), // online, away, offline
  permissions: jsonb("permissions").default('{}'),
  cursor: jsonb("cursor"),
  lastSeen: timestamp("last_seen").defaultNow(),
  joinedAt: timestamp("joined_at").defaultNow(),
});

export const collaborationActivity = pgTable("collaboration_activity", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").references(() => collaborationRooms.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // edit, comment, join, leave, version, permission
  description: text("description").notNull(),
  details: jsonb("details").default('{}'),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const documentVersions = pgTable("document_versions", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").references(() => collaborationRooms.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  version: text("version").notNull(),
  content: jsonb("content").notNull(),
  changes: jsonb("changes").default('[]'),
  size: text("size"),
  status: text("status").notNull().default("current"), // current, archived
  branches: jsonb("branches").default('[]'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Content Performance Analytics
export const contentAnalytics = pgTable("content_analytics", {
  id: serial("id").primaryKey(),
  contentId: integer("content_id").references(() => publishedContent.id).notNull(),
  platform: text("platform").notNull(),
  metrics: jsonb("metrics").notNull(), // views, likes, shares, comments, etc.
  timestamp: timestamp("timestamp").defaultNow(),
  aggregatedData: jsonb("aggregated_data").default('{}'),
});

export const abTests = pgTable("ab_tests", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  variantA: jsonb("variant_a").notNull(),
  variantB: jsonb("variant_b").notNull(),
  status: text("status").notNull().default("running"), // running, completed, paused
  results: jsonb("results").default('{}'),
  confidence: numeric("confidence", { precision: 5, scale: 2 }).default("0"),
  winner: text("winner"), // A, B, inconclusive
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ================================================================================================
// WAI SDK v1.0 ORCHESTRATION SCHEMA - WORLD-CLASS AI ORCHESTRATION PLATFORM
// ================================================================================================

// ================================================================================================
// WAI ADMIN CONSOLE SCHEMA - COMPREHENSIVE GOVERNANCE & OPERATIONS
// ================================================================================================

// Routing Policies with Cost/Latency/Quality Optimization
export const waiRoutingPolicies = pgTable("wai_routing_policies", {
  id: serial("id").primaryKey(),
  policyId: text("policy_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  organizationId: integer("organization_id").references(() => organizations.id),
  priority: integer("priority").default(50), // 1-100
  status: text("status").notNull().default("active"), // active, inactive, testing
  
  // Optimization Criteria
  optimizationGoals: jsonb("optimization_goals").default('{"cost": 30, "latency": 40, "quality": 30}'), // percentage weights
  costThreshold: numeric("cost_threshold", { precision: 10, scale: 4 }),
  latencyThreshold: integer("latency_threshold"), // milliseconds
  qualityThreshold: numeric("quality_threshold", { precision: 5, scale: 2 }),
  
  // Fallback Chain Configuration (1-5 levels)
  fallbackChain: jsonb("fallback_chain").default('[]'), // ordered array of provider/model combinations
  fallbackTriggers: jsonb("fallback_triggers").default('{}'), // conditions that trigger fallback
  
  // Safety & Rights Controls
  safetyRules: jsonb("safety_rules").default('{}'),
  contentPolicies: jsonb("content_policies").default('{}'),
  rightsProtection: jsonb("rights_protection").default('{}'),
  carbonFootprintLimits: jsonb("carbon_footprint_limits").default('{}'),
  
  // Regional & Compliance
  allowedRegions: jsonb("allowed_regions").default('["global"]'),
  complianceRequirements: jsonb("compliance_requirements").default('{}'),
  dataResidency: jsonb("data_residency").default('{}'),
  
  metadata: jsonb("metadata").default('{}'),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_wai_routing_policy").on(table.policyId),
  index("idx_wai_routing_status").on(table.status),
  index("idx_wai_routing_priority").on(table.priority),
]);

// Pipeline Management with YAML + Graph Editor
export const waiPipelines = pgTable("wai_pipelines", {
  id: serial("id").primaryKey(),
  pipelineId: text("pipeline_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  organizationId: integer("organization_id").references(() => organizations.id),
  projectId: integer("project_id").references(() => projects.id),
  
  // Pipeline Definition
  version: text("version").notNull().default("1.0.0"),
  status: text("status").notNull().default("draft"), // draft, testing, approved, active, deprecated
  pipelineType: text("pipeline_type").notNull(), // orchestration, content, analysis, deployment
  
  // YAML Configuration
  yamlDefinition: text("yaml_definition"), // Raw YAML pipeline definition
  graphDefinition: jsonb("graph_definition").default('{}'), // Visual graph representation
  steps: jsonb("steps").default('[]'), // Pipeline steps configuration
  
  // Release Management
  releaseChannel: text("release_channel").default("development"), // development, staging, production
  approvalStatus: text("approval_status").default("pending"), // pending, approved, rejected
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  approvalComments: text("approval_comments"),
  
  // Execution Configuration
  triggers: jsonb("triggers").default('[]'),
  environment: jsonb("environment").default('{}'),
  resources: jsonb("resources").default('{}'),
  timeout: integer("timeout").default(3600), // seconds
  retryPolicy: jsonb("retry_policy").default('{}'),
  
  // Metrics & Analytics
  executionCount: integer("execution_count").default(0),
  successRate: numeric("success_rate", { precision: 5, scale: 2 }),
  averageExecutionTime: integer("average_execution_time"),
  lastExecutionAt: timestamp("last_execution_at"),
  
  metadata: jsonb("metadata").default('{}'),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_wai_pipeline_id").on(table.pipelineId),
  index("idx_wai_pipeline_status").on(table.status),
  index("idx_wai_pipeline_channel").on(table.releaseChannel),
]);

// Observability - Lineage Graphs, Spans, Traces
export const waiObservabilityTraces = pgTable("wai_observability_traces", {
  id: serial("id").primaryKey(),
  traceId: text("trace_id").notNull().unique(),
  spanId: text("span_id").notNull(),
  parentSpanId: text("parent_span_id"),
  operationName: text("operation_name").notNull(),
  
  // Request Context
  organizationId: integer("organization_id").references(() => organizations.id),
  userId: varchar("user_id").references(() => users.id),
  sessionId: text("session_id"),
  requestId: text("request_id"),
  
  // Timing & Performance
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // microseconds
  
  // Cost Tracking
  costUsd: numeric("cost_usd", { precision: 10, scale: 6 }),
  tokenUsage: jsonb("token_usage").default('{}'),
  resourceUsage: jsonb("resource_usage").default('{}'),
  
  // Lineage & Dependencies
  inputs: jsonb("inputs").default('{}'),
  outputs: jsonb("outputs").default('{}'),
  dependencies: jsonb("dependencies").default('[]'),
  lineageGraph: jsonb("lineage_graph").default('{}'),
  
  // Status & Health
  status: text("status").notNull(), // success, error, timeout, cancelled
  errorMessage: text("error_message"),
  errorStack: text("error_stack"),
  healthSignals: jsonb("health_signals").default('{}'),
  
  // Tags & Metadata
  tags: jsonb("tags").default('{}'),
  annotations: jsonb("annotations").default('{}'),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_wai_trace_id").on(table.traceId),
  index("idx_wai_trace_span").on(table.spanId),
  index("idx_wai_trace_operation").on(table.operationName),
  index("idx_wai_trace_time").on(table.startTime),
]);

// CAM 2.0 - Incident Management & Anomaly Detection
export const waiIncidentManagement = pgTable("wai_incident_management", {
  id: serial("id").primaryKey(),
  incidentId: text("incident_id").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  
  // Classification
  severity: text("severity").notNull(), // low, medium, high, critical
  category: text("category").notNull(), // performance, availability, security, data, integration
  anomalyClass: text("anomaly_class"), // auto-detected anomaly classification
  
  // Status & Lifecycle
  status: text("status").notNull().default("open"), // open, investigating, resolved, closed
  assignedTo: integer("assigned_to").references(() => users.id),
  organizationId: integer("organization_id").references(() => organizations.id),
  
  // Auto-Response Configuration
  autoRetryEnabled: boolean("auto_retry_enabled").default(true),
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),
  circuitBreakerTriggered: boolean("circuit_breaker_triggered").default(false),
  earlyExitEnabled: boolean("early_exit_enabled").default(true),
  
  // Impact Assessment
  affectedServices: jsonb("affected_services").default('[]'),
  impactScope: text("impact_scope"), // local, regional, global
  businessImpact: text("business_impact"), // low, medium, high, critical
  
  // Resolution
  resolutionSteps: jsonb("resolution_steps").default('[]'),
  rootCause: text("root_cause"),
  preventionMeasures: jsonb("prevention_measures").default('[]'),
  
  // Timestamps
  detectedAt: timestamp("detected_at").defaultNow(),
  acknowledgedAt: timestamp("acknowledged_at"),
  resolvedAt: timestamp("resolved_at"),
  closedAt: timestamp("closed_at"),
  
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_wai_incident_id").on(table.incidentId),
  index("idx_wai_incident_severity").on(table.severity),
  index("idx_wai_incident_status").on(table.status),
  index("idx_wai_incident_detected").on(table.detectedAt),
]);

// BMAD 2.0 - Asset Graphs & Consistency Checks
export const waiBmadAssets = pgTable("wai_bmad_assets", {
  id: serial("id").primaryKey(),
  assetId: text("asset_id").notNull().unique(),
  name: text("name").notNull(),
  assetType: text("asset_type").notNull(), // model, dataset, pipeline, agent, integration
  organizationId: integer("organization_id").references(() => organizations.id),
  
  // Asset Dependencies & Graph
  dependencies: jsonb("dependencies").default('[]'), // upstream dependencies
  dependents: jsonb("dependents").default('[]'), // downstream dependents
  assetGraph: jsonb("asset_graph").default('{}'), // full dependency graph
  
  // Consistency & Drift Monitoring
  consistencyScore: numeric("consistency_score", { precision: 5, scale: 2 }),
  driftDetected: boolean("drift_detected").default(false),
  driftMetrics: jsonb("drift_metrics").default('{}'),
  lastConsistencyCheck: timestamp("last_consistency_check"),
  
  // Pre-render Optimization
  preRenderEnabled: boolean("pre_render_enabled").default(true),
  preRenderStatus: text("pre_render_status").default("pending"), // pending, rendering, ready, failed
  preRenderData: jsonb("pre_render_data").default('{}'),
  
  // Continuity Reports
  continuityScore: numeric("continuity_score", { precision: 5, scale: 2 }),
  continuityReports: jsonb("continuity_reports").default('[]'),
  businessContinuityImpact: text("business_continuity_impact"), // low, medium, high, critical
  
  // Version & Lifecycle
  version: text("version").notNull().default("1.0.0"),
  status: text("status").notNull().default("active"), // active, deprecated, archived
  
  metadata: jsonb("metadata").default('{}'),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_wai_bmad_asset_id").on(table.assetId),
  index("idx_wai_bmad_asset_type").on(table.assetType),
  index("idx_wai_bmad_consistency").on(table.consistencyScore),
  index("idx_wai_bmad_drift").on(table.driftDetected),
]);

// GRPO Trainer - ML Training Jobs & Canary Deployments
export const waiGrpoTrainingJobs = pgTable("wai_grpo_training_jobs", {
  id: serial("id").primaryKey(),
  jobId: text("job_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  organizationId: integer("organization_id").references(() => organizations.id),
  
  // Training Configuration
  trainingType: text("training_type").notNull(), // grpo, ppo, dpo, supervised, reinforcement
  modelId: text("model_id").references(() => waiLlmProvidersV9.providerId),
  baseModel: text("base_model").notNull(),
  
  // Schedule & Execution
  scheduleType: text("schedule_type").default("manual"), // manual, nightly, weekly, continuous
  cronExpression: text("cron_expression"),
  status: text("status").notNull().default("pending"), // pending, running, completed, failed, cancelled
  
  // Training Parameters
  rewardConfig: jsonb("reward_config").default('{}'),
  hyperparameters: jsonb("hyperparameters").default('{}'),
  datasetConfig: jsonb("dataset_config").default('{}'),
  
  // Canary Deployment
  canaryEnabled: boolean("canary_enabled").default(true),
  canaryPercentage: integer("canary_percentage").default(5), // 1-100
  canaryMetrics: jsonb("canary_metrics").default('{}'),
  canaryComparisonResults: jsonb("canary_comparison_results").default('{}'),
  
  // Rollback Configuration
  rollbackThreshold: numeric("rollback_threshold", { precision: 5, scale: 2 }).default("95.00"), // quality threshold
  autoRollbackEnabled: boolean("auto_rollback_enabled").default(true),
  rollbackPlan: jsonb("rollback_plan").default('{}'),
  
  // Results & Metrics
  trainingMetrics: jsonb("training_metrics").default('{}'),
  evaluationResults: jsonb("evaluation_results").default('{}'),
  performanceComparison: jsonb("performance_comparison").default('{}'),
  
  // Timestamps
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  deployedAt: timestamp("deployed_at"),
  
  metadata: jsonb("metadata").default('{}'),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_wai_grpo_job").on(table.jobId),
  index("idx_wai_grpo_status").on(table.status),
  index("idx_wai_grpo_schedule").on(table.scheduleType),
  index("idx_wai_grpo_model").on(table.modelId),
]);

// Enhanced Tenancy & RBAC - Spaces & Advanced Permissions
export const waiTenancySpaces = pgTable("wai_tenancy_spaces", {
  id: serial("id").primaryKey(),
  spaceId: text("space_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  parentSpaceId: text("parent_space_id"), // Self-referential foreign key - references space_id
  
  // Space Configuration
  spaceType: text("space_type").notNull(), // project, environment, team, department, region
  visibility: text("visibility").default("private"), // private, internal, public
  isolation: text("isolation").default("soft"), // soft, hard, strict
  
  // Resource Limits
  resourceQuotas: jsonb("resource_quotas").default('{}'),
  usageMetrics: jsonb("usage_metrics").default('{}'),
  billingAccount: text("billing_account"),
  
  // Compliance & Security
  complianceProfile: text("compliance_profile"), // soc2, hipaa, gdpr, pci
  securityLevel: text("security_level").default("standard"), // basic, standard, enhanced, maximum
  dataClassification: text("data_classification").default("internal"), // public, internal, confidential, restricted
  
  // SSO Configuration
  ssoProviderId: text("sso_provider_id"),
  ssoSettings: jsonb("sso_settings").default('{}'),
  
  status: text("status").notNull().default("active"), // active, suspended, archived
  metadata: jsonb("metadata").default('{}'),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  parentSpaceIdFk: foreignKey({
    columns: [table.parentSpaceId],
    foreignColumns: [table.spaceId],
    name: "fk_wai_tenancy_spaces_parent"
  }),
  spaceIdIdx: index("idx_wai_space_id").on(table.spaceId),
  organizationIdIdx: index("idx_wai_space_org").on(table.organizationId),
  parentSpaceIdIdx: index("idx_wai_space_parent").on(table.parentSpaceId),
}));

// Advanced RBAC Permissions & Roles
export const waiRbacRoles = pgTable("wai_rbac_roles", {
  id: serial("id").primaryKey(),
  roleId: text("role_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  organizationId: integer("organization_id").references(() => organizations.id),
  spaceId: text("space_id").references(() => waiTenancySpaces.spaceId),
  
  // Role Definition
  roleType: text("role_type").notNull(), // system, organization, space, project, custom
  scope: text("scope").notNull(), // global, organization, space, project, resource
  isBuiltin: boolean("is_builtin").default(false),
  
  // Permissions
  permissions: jsonb("permissions").default('[]'), // granular permissions array
  resourceAccess: jsonb("resource_access").default('{}'), // resource-specific access
  apiPermissions: jsonb("api_permissions").default('[]'), // API endpoint permissions
  uiPermissions: jsonb("ui_permissions").default('[]'), // UI feature permissions
  
  // Conditions & Constraints
  conditions: jsonb("conditions").default('{}'), // time, location, device constraints
  ipRestrictions: jsonb("ip_restrictions").default('[]'),
  sessionLimits: jsonb("session_limits").default('{}'),
  
  status: text("status").notNull().default("active"), // active, inactive, deprecated
  metadata: jsonb("metadata").default('{}'),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_wai_rbac_role").on(table.roleId),
  index("idx_wai_rbac_org").on(table.organizationId),
  index("idx_wai_rbac_scope").on(table.scope),
]);

// Secrets & KMS Management
export const waiSecretsManagement = pgTable("wai_secrets_management", {
  id: serial("id").primaryKey(),
  secretId: text("secret_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  organizationId: integer("organization_id").references(() => organizations.id),
  spaceId: text("space_id").references(() => waiTenancySpaces.spaceId),
  
  // Secret Classification
  secretType: text("secret_type").notNull(), // api_key, certificate, password, token, connection_string
  classification: text("classification").notNull(), // public, internal, confidential, restricted
  
  // Encryption & Storage
  encryptedValue: text("encrypted_value"), // KMS encrypted value
  kmsKeyId: text("kms_key_id").notNull(),
  encryptionAlgorithm: text("encryption_algorithm").default("AES-256-GCM"),
  
  // Access Control
  accessPolicy: jsonb("access_policy").default('{}'),
  allowedRoles: jsonb("allowed_roles").default('[]'),
  allowedServices: jsonb("allowed_services").default('[]'),
  
  // Lifecycle Management
  expiresAt: timestamp("expires_at"),
  rotationPolicy: jsonb("rotation_policy").default('{}'),
  lastRotated: timestamp("last_rotated"),
  autoRotationEnabled: boolean("auto_rotation_enabled").default(false),
  
  // Usage Tracking
  accessCount: integer("access_count").default(0),
  lastAccessed: timestamp("last_accessed"),
  accessLog: jsonb("access_log").default('[]'), // recent access attempts
  
  status: text("status").notNull().default("active"), // active, expired, revoked, rotating
  metadata: jsonb("metadata").default('{}'),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_wai_secret_id").on(table.secretId),
  index("idx_wai_secret_org").on(table.organizationId),
  index("idx_wai_secret_type").on(table.secretType),
]);

// FinOps - Budgets & Cost Management
export const waiFinOpsBudgets = pgTable("wai_finops_budgets", {
  id: serial("id").primaryKey(),
  budgetId: text("budget_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  organizationId: integer("organization_id").references(() => organizations.id),
  spaceId: text("space_id").references(() => waiTenancySpaces.spaceId),
  
  // Budget Configuration
  budgetType: text("budget_type").notNull(), // monthly, quarterly, annual, project-based
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  period: text("period").notNull(), // monthly, quarterly, yearly, custom
  
  // Scope & Filters
  scope: jsonb("scope").default('{}'), // what resources this budget covers
  costFilters: jsonb("cost_filters").default('{}'), // service, region, tag filters
  
  // Alerts & Notifications
  alertThresholds: jsonb("alert_thresholds").default('[50, 80, 95]'), // percentage thresholds
  notificationChannels: jsonb("notification_channels").default('[]'),
  alertHistory: jsonb("alert_history").default('[]'),
  
  // Usage Tracking
  currentSpend: numeric("current_spend", { precision: 12, scale: 2 }).default("0.00"),
  forecastedSpend: numeric("forecasted_spend", { precision: 12, scale: 2 }),
  lastUpdateAt: timestamp("last_update_at"),
  
  // Budget Period
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  
  status: text("status").notNull().default("active"), // active, exceeded, suspended, archived
  metadata: jsonb("metadata").default('{}'),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_wai_budget_id").on(table.budgetId),
  index("idx_wai_budget_org").on(table.organizationId),
  index("idx_wai_budget_period").on(table.startDate, table.endDate),
]);

// Cost Optimization Engine
export const waiCostOptimizer = pgTable("wai_cost_optimizer", {
  id: serial("id").primaryKey(),
  optimizationId: text("optimization_id").notNull().unique(),
  organizationId: integer("organization_id").references(() => organizations.id),
  
  // Optimization Configuration
  optimizationGoals: jsonb("optimization_goals").default('{}'), // cost reduction, performance, sustainability
  constraints: jsonb("constraints").default('{}'), // quality thresholds, latency limits
  
  // Analysis Results
  currentCostAnalysis: jsonb("current_cost_analysis").default('{}'),
  optimizationRecommendations: jsonb("optimization_recommendations").default('[]'),
  potentialSavings: numeric("potential_savings", { precision: 12, scale: 2 }),
  
  // Implementation Tracking
  implementedRecommendations: jsonb("implemented_recommendations").default('[]'),
  actualSavings: numeric("actual_savings", { precision: 12, scale: 2 }).default("0.00"),
  
  // Automation
  autoOptimizationEnabled: boolean("auto_optimization_enabled").default(false),
  optimizationRules: jsonb("optimization_rules").default('[]'),
  lastOptimizationRun: timestamp("last_optimization_run"),
  
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_wai_cost_opt_id").on(table.optimizationId),
  index("idx_wai_cost_opt_org").on(table.organizationId),
]);

// WAI SDK v3.0 - Messaging Automation Tables
export const waiMessagingChannels = pgTable("wai_messaging_channels", {
  id: serial("id").primaryKey(),
  channelId: text("channel_id").notNull().unique(),
  userId: varchar("user_id").references(() => users.id),
  organizationId: integer("organization_id").references(() => organizations.id),
  platform: text("platform").notNull(), // slack, teams, whatsapp, discord, telegram
  platformChannelId: text("platform_channel_id").notNull(),
  channelName: text("channel_name"),
  webhookUrl: text("webhook_url"),
  isActive: boolean("is_active").default(true),
  lastSyncAt: timestamp("last_sync_at"),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_wai_messaging_user").on(table.userId),
  index("idx_wai_messaging_platform").on(table.platform),
]);

export const waiMessagingMessages = pgTable("wai_messaging_messages", {
  id: serial("id").primaryKey(),
  messageId: text("message_id").notNull().unique(),
  channelId: text("channel_id").references(() => waiMessagingChannels.channelId),
  senderId: text("sender_id").notNull(),
  senderName: text("sender_name"),
  content: text("content").notNull(),
  contentType: text("content_type").default('text'), // text, image, file, reaction, thread_reply
  threadId: text("thread_id"),
  priority: text("priority").default('normal'), // urgent, high, normal, low
  sentiment: text("sentiment"), // positive, neutral, negative
  category: text("category"), // support, sales, feedback, billing, technical, general
  routingResult: jsonb("routing_result").default('{}'),
  attachments: jsonb("attachments").default('[]'),
  metadata: jsonb("metadata").default('{}'),
  processedAt: timestamp("processed_at"),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_wai_msg_channel").on(table.channelId),
  index("idx_wai_msg_priority").on(table.priority),
  index("idx_wai_msg_created").on(table.createdAt),
]);

// WAI SDK v3.0 - Digital Twin Tables
export const waiDigitalTwins = pgTable("wai_digital_twins", {
  id: serial("id").primaryKey(),
  twinId: text("twin_id").notNull().unique(),
  userId: varchar("user_id").references(() => users.id),
  personalityTraits: jsonb("personality_traits").default('{}'),
  preferences: jsonb("preferences").default('{}'),
  communicationStyle: jsonb("communication_style").default('{}'),
  workPatterns: jsonb("work_patterns").default('{}'),
  learningProgress: jsonb("learning_progress").default('{}'),
  trustLevel: real("trust_level").default(0.5),
  autonomyLevel: text("autonomy_level").default('supervised'), // supervised, assisted, autonomous
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_wai_twin_user").on(table.userId),
  index("idx_wai_twin_autonomy").on(table.autonomyLevel),
]);

export const waiDigitalTwinBehaviors = pgTable("wai_digital_twin_behaviors", {
  id: serial("id").primaryKey(),
  behaviorId: text("behavior_id").notNull().unique(),
  twinId: text("twin_id").references(() => waiDigitalTwins.twinId),
  behaviorType: text("behavior_type").notNull(), // interaction, preference, pattern, feedback
  action: text("action").notNull(),
  context: jsonb("context").default('{}'),
  sessionId: text("session_id"),
  deviceInfo: jsonb("device_info").default('{}'),
  locationInfo: jsonb("location_info").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_wai_behavior_twin").on(table.twinId),
  index("idx_wai_behavior_type").on(table.behaviorType),
]);

export const waiAutomationRules = pgTable("wai_automation_rules", {
  id: serial("id").primaryKey(),
  ruleId: text("rule_id").notNull().unique(),
  twinId: text("twin_id").references(() => waiDigitalTwins.twinId),
  name: text("name").notNull(),
  trigger: jsonb("trigger").notNull(),
  conditions: jsonb("conditions").default('[]'),
  actions: jsonb("actions").default('[]'),
  romaLevel: text("roma_level").default('L2'), // L1, L2, L3, L4, L5
  isEnabled: boolean("is_enabled").default(true),
  executionCount: integer("execution_count").default(0),
  lastExecuted: timestamp("last_executed"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_wai_rule_twin").on(table.twinId),
  index("idx_wai_rule_roma").on(table.romaLevel),
]);

// WAI SDK v3.0 - WizardSmith Observability Extended Tables
export const waiPromptVersions = pgTable("wai_prompt_versions", {
  id: serial("id").primaryKey(),
  promptId: text("prompt_id").notNull().unique(),
  name: text("name").notNull(),
  version: text("version").notNull(),
  systemPrompt: text("system_prompt").notNull(),
  userPromptTemplate: text("user_prompt_template"),
  variables: jsonb("variables").default('[]'),
  metadata: jsonb("metadata").default('{}'),
  performanceMetrics: jsonb("performance_metrics").default('{}'),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_wai_prompt_name").on(table.name),
  index("idx_wai_prompt_active").on(table.isActive),
]);

export const waiAlertRules = pgTable("wai_alert_rules", {
  id: serial("id").primaryKey(),
  ruleId: text("rule_id").notNull().unique(),
  name: text("name").notNull(),
  condition: jsonb("condition").notNull(),
  threshold: real("threshold").notNull(),
  severity: text("severity").default('warning'), // info, warning, critical
  channels: jsonb("channels").default('[]'),
  isEnabled: boolean("is_enabled").default(true),
  cooldownMinutes: integer("cooldown_minutes").default(15),
  lastTriggered: timestamp("last_triggered"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_wai_alert_severity").on(table.severity),
  index("idx_wai_alert_enabled").on(table.isEnabled),
]);

export const waiAlerts = pgTable("wai_alerts", {
  id: serial("id").primaryKey(),
  alertId: text("alert_id").notNull().unique(),
  ruleId: text("rule_id").references(() => waiAlertRules.ruleId),
  severity: text("severity").notNull(),
  message: text("message").notNull(),
  value: real("value"),
  threshold: real("threshold"),
  acknowledged: boolean("acknowledged").default(false),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_wai_alert_rule").on(table.ruleId),
  index("idx_wai_alert_ack").on(table.acknowledged),
]);

// WAI SDK v3.0 - Email Automation Tables
export const waiEmailAccounts = pgTable("wai_email_accounts", {
  id: serial("id").primaryKey(),
  accountId: text("account_id").notNull().unique(),
  userId: varchar("user_id").references(() => users.id),
  organizationId: integer("organization_id").references(() => organizations.id),
  provider: text("provider").notNull(), // gmail, outlook, custom_imap
  email: text("email").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  imapHost: text("imap_host"),
  smtpHost: text("smtp_host"),
  isActive: boolean("is_active").default(true),
  lastSyncAt: timestamp("last_sync_at"),
  syncStatus: text("sync_status").default('pending'), // pending, syncing, synced, error
  syncError: text("sync_error"),
  labels: jsonb("labels").default('[]'),
  folders: jsonb("folders").default('[]'),
  settings: jsonb("settings").default('{}'),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_wai_email_user").on(table.userId),
  index("idx_wai_email_provider").on(table.provider),
  index("idx_wai_email_active").on(table.isActive),
]);

export const waiEmails = pgTable("wai_emails", {
  id: serial("id").primaryKey(),
  emailId: text("email_id").notNull().unique(),
  accountId: text("account_id").references(() => waiEmailAccounts.accountId),
  threadId: text("thread_id"),
  messageId: text("message_id"), // RFC 5322 Message-ID
  inReplyTo: text("in_reply_to"),
  references: text("references_header"),
  subject: text("subject"),
  fromEmail: text("from_email").notNull(),
  fromName: text("from_name"),
  toEmails: jsonb("to_emails").default('[]'),
  ccEmails: jsonb("cc_emails").default('[]'),
  bccEmails: jsonb("bcc_emails").default('[]'),
  bodyText: text("body_text"),
  bodyHtml: text("body_html"),
  snippet: text("snippet"),
  isRead: boolean("is_read").default(false),
  isStarred: boolean("is_starred").default(false),
  isImportant: boolean("is_important").default(false),
  isSpam: boolean("is_spam").default(false),
  isDraft: boolean("is_draft").default(false),
  isSent: boolean("is_sent").default(false),
  direction: text("direction").default('inbound'), // inbound, outbound
  labels: jsonb("labels").default('[]'),
  folder: text("folder").default('inbox'),
  receivedAt: timestamp("received_at"),
  sentAt: timestamp("sent_at"),
  attachments: jsonb("attachments").default('[]'),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_wai_emails_account").on(table.accountId),
  index("idx_wai_emails_thread").on(table.threadId),
  index("idx_wai_emails_from").on(table.fromEmail),
  index("idx_wai_emails_received").on(table.receivedAt),
]);

export const waiEmailProcessing = pgTable("wai_email_processing", {
  id: serial("id").primaryKey(),
  processingId: text("processing_id").notNull().unique(),
  emailId: text("email_id").references(() => waiEmails.emailId),
  status: text("status").default('pending'), // pending, processing, completed, failed
  priority: text("priority").default('normal'), // urgent, high, normal, low
  sentiment: text("sentiment"), // positive, neutral, negative
  category: text("category"), // support, sales, billing, inquiry, newsletter, spam
  intentDetected: text("intent_detected"), // question, complaint, request, feedback, greeting
  entities: jsonb("entities").default('[]'),
  keywords: jsonb("keywords").default('[]'),
  summary: text("summary"),
  suggestedActions: jsonb("suggested_actions").default('[]'),
  suggestedAgents: jsonb("suggested_agents").default('[]'),
  suggestedResponse: text("suggested_response"),
  confidence: real("confidence").default(0),
  webSearchUsed: boolean("web_search_used").default(false),
  webSearchResults: jsonb("web_search_results").default('[]'),
  agentAssigned: text("agent_assigned"),
  llmProvider: text("llm_provider"),
  llmModel: text("llm_model"),
  promptTokens: integer("prompt_tokens"),
  completionTokens: integer("completion_tokens"),
  processingTimeMs: integer("processing_time_ms"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("idx_wai_email_proc_email").on(table.emailId),
  index("idx_wai_email_proc_status").on(table.status),
  index("idx_wai_email_proc_priority").on(table.priority),
  index("idx_wai_email_proc_category").on(table.category),
]);

export const waiEmailAutomationRules = pgTable("wai_email_automation_rules", {
  id: serial("id").primaryKey(),
  ruleId: text("rule_id").notNull().unique(),
  accountId: text("account_id").references(() => waiEmailAccounts.accountId),
  name: text("name").notNull(),
  description: text("description"),
  trigger: jsonb("trigger").notNull(), // conditions to match emails
  conditions: jsonb("conditions").default('[]'), // additional filter conditions
  actions: jsonb("actions").default('[]'), // actions to perform
  romaLevel: text("roma_level").default('L2'), // L1-L5 automation level
  requiresApproval: boolean("requires_approval").default(false),
  approvalWorkflow: jsonb("approval_workflow").default('{}'),
  isEnabled: boolean("is_enabled").default(true),
  priority: integer("priority").default(100),
  executionCount: integer("execution_count").default(0),
  lastExecuted: timestamp("last_executed"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_wai_email_rule_account").on(table.accountId),
  index("idx_wai_email_rule_enabled").on(table.isEnabled),
  index("idx_wai_email_rule_roma").on(table.romaLevel),
]);

export const waiEmailResponses = pgTable("wai_email_responses", {
  id: serial("id").primaryKey(),
  responseId: text("response_id").notNull().unique(),
  emailId: text("email_id").references(() => waiEmails.emailId),
  processingId: text("processing_id").references(() => waiEmailProcessing.processingId),
  status: text("status").default('draft'), // draft, pending_approval, approved, sent, failed
  subject: text("subject"),
  bodyText: text("body_text"),
  bodyHtml: text("body_html"),
  toEmails: jsonb("to_emails").default('[]'),
  ccEmails: jsonb("cc_emails").default('[]'),
  attachments: jsonb("attachments").default('[]'),
  agentId: text("agent_id"),
  llmProvider: text("llm_provider"),
  llmModel: text("llm_model"),
  confidence: real("confidence").default(0),
  humanEdited: boolean("human_edited").default(false),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  sentAt: timestamp("sent_at"),
  sendError: text("send_error"),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_wai_email_resp_email").on(table.emailId),
  index("idx_wai_email_resp_status").on(table.status),
]);

// WAI SDK v3.0 - Voice Agent Tables
export const waiVoiceAgents = pgTable("wai_voice_agents", {
  id: serial("id").primaryKey(),
  agentId: text("agent_id").notNull().unique(),
  userId: varchar("user_id").references(() => users.id),
  organizationId: integer("organization_id").references(() => organizations.id),
  name: text("name").notNull(),
  description: text("description"),
  voiceProvider: text("voice_provider").default('elevenlabs'), // elevenlabs, sarvam, azure, google
  voiceId: text("voice_id"),
  voiceSettings: jsonb("voice_settings").default('{}'),
  language: text("language").default('en-US'),
  supportedLanguages: jsonb("supported_languages").default('["en-US"]'),
  personality: jsonb("personality").default('{}'),
  systemPrompt: text("system_prompt"),
  greeting: text("greeting"),
  fallbackMessage: text("fallback_message"),
  maxCallDuration: integer("max_call_duration").default(3600), // seconds
  silenceTimeout: integer("silence_timeout").default(10), // seconds
  isActive: boolean("is_active").default(true),
  phoneNumbers: jsonb("phone_numbers").default('[]'),
  sipEndpoints: jsonb("sip_endpoints").default('[]'),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_wai_voice_user").on(table.userId),
  index("idx_wai_voice_org").on(table.organizationId),
  index("idx_wai_voice_active").on(table.isActive),
]);

export const waiVoiceCalls = pgTable("wai_voice_calls", {
  id: serial("id").primaryKey(),
  callId: text("call_id").notNull().unique(),
  agentId: text("agent_id").references(() => waiVoiceAgents.agentId),
  direction: text("direction").notNull(), // inbound, outbound
  status: text("status").default('initiated'), // initiated, ringing, answered, completed, failed, no_answer
  callerNumber: text("caller_number"),
  calledNumber: text("called_number"),
  startedAt: timestamp("started_at"),
  answeredAt: timestamp("answered_at"),
  endedAt: timestamp("ended_at"),
  duration: integer("duration"), // seconds
  recordingUrl: text("recording_url"),
  transcript: text("transcript"),
  summary: text("summary"),
  sentiment: text("sentiment"),
  intentDetected: text("intent_detected"),
  entities: jsonb("entities").default('[]'),
  agentActions: jsonb("agent_actions").default('[]'),
  handoffRequested: boolean("handoff_requested").default(false),
  handoffTo: text("handoff_to"),
  outcome: text("outcome"), // resolved, escalated, callback_scheduled, voicemail
  qualityScore: real("quality_score"),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_wai_call_agent").on(table.agentId),
  index("idx_wai_call_status").on(table.status),
  index("idx_wai_call_direction").on(table.direction),
  index("idx_wai_call_started").on(table.startedAt),
]);

// WAI SDK v3.0 - Document Intelligence Tables
export const waiDocuments = pgTable("wai_documents", {
  id: serial("id").primaryKey(),
  documentId: text("document_id").notNull().unique(),
  userId: varchar("user_id").references(() => users.id),
  organizationId: integer("organization_id").references(() => organizations.id),
  name: text("name").notNull(),
  originalFilename: text("original_filename"),
  mimeType: text("mime_type"),
  fileSize: integer("file_size"),
  storageUrl: text("storage_url"),
  status: text("status").default('uploaded'), // uploaded, processing, processed, failed
  documentType: text("document_type"), // invoice, contract, receipt, report, form, correspondence
  language: text("language"),
  pageCount: integer("page_count"),
  extractedText: text("extracted_text"),
  ocrConfidence: real("ocr_confidence"),
  classification: jsonb("classification").default('{}'),
  entities: jsonb("entities").default('[]'),
  keyValues: jsonb("key_values").default('{}'),
  tables: jsonb("tables").default('[]'),
  signatures: jsonb("signatures").default('[]'),
  summary: text("summary"),
  embedding: jsonb("embedding"), // for RAG
  vectorId: text("vector_id"), // reference to vector store
  webSearchContext: jsonb("web_search_context").default('[]'),
  llmProvider: text("llm_provider"),
  processingTimeMs: integer("processing_time_ms"),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
}, (table) => [
  index("idx_wai_doc_user").on(table.userId),
  index("idx_wai_doc_org").on(table.organizationId),
  index("idx_wai_doc_status").on(table.status),
  index("idx_wai_doc_type").on(table.documentType),
]);

export const waiDocumentChunks = pgTable("wai_document_chunks", {
  id: serial("id").primaryKey(),
  chunkId: text("chunk_id").notNull().unique(),
  documentId: text("document_id").references(() => waiDocuments.documentId),
  chunkIndex: integer("chunk_index").notNull(),
  content: text("content").notNull(),
  pageNumber: integer("page_number"),
  startOffset: integer("start_offset"),
  endOffset: integer("end_offset"),
  embedding: jsonb("embedding"),
  vectorId: text("vector_id"),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_wai_chunk_doc").on(table.documentId),
  index("idx_wai_chunk_idx").on(table.chunkIndex),
]);

// WAI SDK v3.0 - Enhanced Orchestration Tables
export const waiOrchestrationTasks = pgTable("wai_orchestration_tasks", {
  id: serial("id").primaryKey(),
  taskId: text("task_id").notNull().unique(),
  parentTaskId: text("parent_task_id"),
  userId: varchar("user_id").references(() => users.id),
  organizationId: integer("organization_id").references(() => organizations.id),
  type: text("type").notNull(), // simple, complex, multi_agent, parallel, sequential
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default('pending'), // pending, decomposing, executing, completed, failed, cancelled
  priority: text("priority").default('normal'),
  assignedAgents: jsonb("assigned_agents").default('[]'),
  coordinatorAgent: text("coordinator_agent"),
  subtasks: jsonb("subtasks").default('[]'),
  dependencies: jsonb("dependencies").default('[]'),
  context: jsonb("context").default('{}'),
  input: jsonb("input").default('{}'),
  output: jsonb("output").default('{}'),
  webSearchRequired: boolean("web_search_required").default(false),
  webSearchResults: jsonb("web_search_results").default('[]'),
  romaLevel: text("roma_level").default('L2'),
  estimatedDuration: integer("estimated_duration"), // seconds
  actualDuration: integer("actual_duration"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_wai_task_user").on(table.userId),
  index("idx_wai_task_status").on(table.status),
  index("idx_wai_task_type").on(table.type),
  index("idx_wai_task_parent").on(table.parentTaskId),
]);

export const waiAgentExecutions = pgTable("wai_agent_executions", {
  id: serial("id").primaryKey(),
  executionId: text("execution_id").notNull().unique(),
  taskId: text("task_id").references(() => waiOrchestrationTasks.taskId),
  agentId: text("agent_id").notNull(),
  agentName: text("agent_name"),
  romaLevel: text("roma_level"),
  status: text("status").default('pending'), // pending, executing, completed, failed
  input: jsonb("input").default('{}'),
  output: jsonb("output").default('{}'),
  llmProvider: text("llm_provider"),
  llmModel: text("llm_model"),
  promptTokens: integer("prompt_tokens"),
  completionTokens: integer("completion_tokens"),
  totalCost: real("total_cost"),
  latencyMs: integer("latency_ms"),
  toolsUsed: jsonb("tools_used").default('[]'),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_wai_exec_task").on(table.taskId),
  index("idx_wai_exec_agent").on(table.agentId),
  index("idx_wai_exec_status").on(table.status),
]);

// WAI SDK v3.0 - Integration Configurations Table
export const waiIntegrationConfigs = pgTable("wai_integration_configs", {
  id: serial("id").primaryKey(),
  configId: text("config_id").notNull().unique(),
  userId: varchar("user_id").references(() => users.id),
  organizationId: integer("organization_id").references(() => organizations.id),
  integrationType: text("integration_type").notNull(), // email, messaging, voice, document, web_search, calendar
  provider: text("provider").notNull(), // gmail, outlook, slack, teams, elevenlabs, etc.
  name: text("name").notNull(),
  description: text("description"),
  credentials: jsonb("credentials").default('{}'), // encrypted
  settings: jsonb("settings").default('{}'),
  webhooks: jsonb("webhooks").default('[]'),
  rateLimits: jsonb("rate_limits").default('{}'),
  isActive: boolean("is_active").default(true),
  lastHealthCheck: timestamp("last_health_check"),
  healthStatus: text("health_status").default('unknown'), // healthy, degraded, unhealthy, unknown
  errorCount: integer("error_count").default(0),
  lastError: text("last_error"),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_wai_integ_user").on(table.userId),
  index("idx_wai_integ_org").on(table.organizationId),
  index("idx_wai_integ_type").on(table.integrationType),
  index("idx_wai_integ_active").on(table.isActive),
]);

// WAI SDK v3.0 - Workflow Definitions Table
export const waiWorkflows = pgTable("wai_workflows", {
  id: serial("id").primaryKey(),
  workflowId: text("workflow_id").notNull().unique(),
  userId: varchar("user_id").references(() => users.id),
  organizationId: integer("organization_id").references(() => organizations.id),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"), // email, messaging, document, voice, data, custom
  trigger: jsonb("trigger").notNull(), // event, schedule, manual, webhook
  steps: jsonb("steps").default('[]'),
  variables: jsonb("variables").default('{}'),
  errorHandling: jsonb("error_handling").default('{}'),
  romaLevel: text("roma_level").default('L2'),
  requiresApproval: boolean("requires_approval").default(false),
  approvalSteps: jsonb("approval_steps").default('[]'),
  isActive: boolean("is_active").default(true),
  version: integer("version").default(1),
  executionCount: integer("execution_count").default(0),
  lastExecuted: timestamp("last_executed"),
  avgExecutionTime: integer("avg_execution_time"),
  successRate: real("success_rate").default(0),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_wai_wf_user").on(table.userId),
  index("idx_wai_wf_org").on(table.organizationId),
  index("idx_wai_wf_category").on(table.category),
  index("idx_wai_wf_active").on(table.isActive),
]);

export const waiWorkflowExecutions = pgTable("wai_workflow_executions", {
  id: serial("id").primaryKey(),
  executionId: text("execution_id").notNull().unique(),
  workflowId: text("workflow_id").references(() => waiWorkflows.workflowId),
  triggeredBy: text("triggered_by"), // user, schedule, webhook, event
  triggerData: jsonb("trigger_data").default('{}'),
  status: text("status").default('pending'), // pending, running, completed, failed, cancelled, paused
  currentStep: integer("current_step").default(0),
  stepResults: jsonb("step_results").default('[]'),
  variables: jsonb("variables").default('{}'),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  durationMs: integer("duration_ms"),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_wai_wf_exec_workflow").on(table.workflowId),
  index("idx_wai_wf_exec_status").on(table.status),
  index("idx_wai_wf_exec_started").on(table.startedAt),
]);

// Marketplace - Agents, Tools, Pipelines, Connectors
export const waiMarketplace = pgTable("wai_marketplace", {
  id: serial("id").primaryKey(),
  itemId: text("item_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  shortDescription: text("short_description"),
  
  // Item Classification
  itemType: text("item_type").notNull(), // agent, tool, pipeline, connector, template, integration
  category: text("category").notNull(), // development, creative, analytics, automation, integration
  subcategory: text("subcategory"),
  tags: jsonb("tags").default('[]'),
  
  // Publishing Details
  publisherId: integer("publisher_id").references(() => users.id),
  publisherOrganization: integer("publisher_organization").references(() => organizations.id),
  version: text("version").notNull().default("1.0.0"),
  compatibility: jsonb("compatibility").default('{}'), // version compatibility
  
  // Content & Assets
  packageUrl: text("package_url"), // download URL for the package
  documentationUrl: text("documentation_url"),
  sourceCodeUrl: text("source_code_url"),
  demoUrl: text("demo_url"),
  screenshots: jsonb("screenshots").default('[]'),
  
  // Pricing & Business Model
  pricingModel: text("pricing_model").notNull(), // free, one-time, subscription, usage-based
  price: numeric("price", { precision: 10, scale: 2 }),
  currency: text("currency").default("USD"),
  billingCycle: text("billing_cycle"), // monthly, yearly, per-use
  
  // Quality & Trust
  rating: numeric("rating", { precision: 3, scale: 2 }).default("0.00"),
  reviewCount: integer("review_count").default(0),
  downloadCount: integer("download_count").default(0),
  verificationStatus: text("verification_status").default("pending"), // pending, verified, premium, enterprise
  
  // Lifecycle
  status: text("status").notNull().default("draft"), // draft, published, suspended, deprecated
  publishedAt: timestamp("published_at"),
  lastUpdated: timestamp("last_updated"),
  
  // Technical Specifications
  requirements: jsonb("requirements").default('{}'),
  apiSpecification: jsonb("api_specification").default('{}'),
  configurationSchema: jsonb("configuration_schema").default('{}'),
  
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_wai_marketplace_item").on(table.itemId),
  index("idx_wai_marketplace_type").on(table.itemType),
  index("idx_wai_marketplace_category").on(table.category),
  index("idx_wai_marketplace_publisher").on(table.publisherId),
]);

// India Pack - Indic NLP/ASR/TTS, WhatsApp, UPI
export const waiIndiaPackServices = pgTable("wai_india_pack_services", {
  id: serial("id").primaryKey(),
  serviceId: text("service_id").notNull().unique(),
  serviceName: text("service_name").notNull(),
  serviceType: text("service_type").notNull(), // nlp, asr, tts, messaging, payment, localization
  organizationId: integer("organization_id").references(() => organizations.id),
  
  // Indic Language Support
  supportedLanguages: jsonb("supported_languages").default('[]'), // Hindi, Bengali, Tamil, Telugu, etc.
  primaryLanguage: text("primary_language").default("hindi"),
  languageModels: jsonb("language_models").default('{}'),
  
  // NLP/ASR/TTS Configuration
  nlpCapabilities: jsonb("nlp_capabilities").default('[]'), // sentiment, translation, ner, etc.
  asrModels: jsonb("asr_models").default('{}'), // speech recognition models
  ttsVoices: jsonb("tts_voices").default('{}'), // text-to-speech voices
  
  // WhatsApp Business Integration
  whatsappBusinessAccount: text("whatsapp_business_account"),
  whatsappPhoneNumber: text("whatsapp_phone_number"),
  whatsappApiToken: text("whatsapp_api_token"), // encrypted
  whatsappTemplates: jsonb("whatsapp_templates").default('[]'),
  messageJourneys: jsonb("message_journeys").default('[]'),
  
  // UPI Payment Integration
  upiProviderId: text("upi_provider_id"), // razorpay, payu, cashfree, etc.
  upiMerchantId: text("upi_merchant_id"),
  upiConfiguration: jsonb("upi_configuration").default('{}'),
  paymentMethods: jsonb("payment_methods").default('[]'),
  
  // Low-Bandwidth Optimizations
  lowBandwidthMode: boolean("low_bandwidth_mode").default(false),
  compressionSettings: jsonb("compression_settings").default('{}'),
  cacheConfiguration: jsonb("cache_configuration").default('{}'),
  offlineCapabilities: jsonb("offline_capabilities").default('{}'),
  
  // Regional Settings
  timezone: text("timezone").default("Asia/Kolkata"),
  currency: text("currency").default("INR"),
  region: text("region").default("IN"),
  complianceSettings: jsonb("compliance_settings").default('{}'), // local compliance requirements
  
  // Service Status
  status: text("status").notNull().default("active"), // active, inactive, maintenance
  healthMetrics: jsonb("health_metrics").default('{}'),
  lastHealthCheck: timestamp("last_health_check"),
  
  metadata: jsonb("metadata").default('{}'),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_wai_india_service").on(table.serviceId),
  index("idx_wai_india_type").on(table.serviceType),
  index("idx_wai_india_language").on(table.primaryLanguage),
]);

// ================================================================================================
// RAZORPAY PAYMENT INTEGRATION SCHEMA
// ================================================================================================

// Razorpay Orders - Track all payment orders
export const razorpayOrders = pgTable("razorpay_orders", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").notNull().unique(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("INR"),
  receipt: text("receipt"),
  status: text("status").notNull().default("created"),
  userId: varchar("user_id").references(() => users.id),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  customerName: text("customer_name"),
  paymentId: text("payment_id"),
  paymentMethod: text("payment_method"),
  paymentSignature: text("payment_signature"),
  planId: text("plan_id"),
  subscriptionId: text("subscription_id"),
  notes: jsonb("notes").default('{}'),
  attempts: integer("attempts").default(0),
  errorCode: text("error_code"),
  errorDescription: text("error_description"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_razorpay_order_id").on(table.orderId),
  index("idx_razorpay_order_user").on(table.userId),
  index("idx_razorpay_order_status").on(table.status),
]);

// Razorpay Subscriptions - Track recurring subscriptions
export const razorpaySubscriptions = pgTable("razorpay_subscriptions", {
  id: serial("id").primaryKey(),
  subscriptionId: text("subscription_id").notNull().unique(),
  planId: text("plan_id").notNull(),
  status: text("status").notNull().default("created"),
  userId: varchar("user_id").references(() => users.id),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  quantity: integer("quantity").default(1),
  totalCount: integer("total_count"),
  paidCount: integer("paid_count").default(0),
  remainingCount: integer("remaining_count"),
  shortUrl: text("short_url"),
  paymentMethod: text("payment_method"),
  startAt: timestamp("start_at"),
  endAt: timestamp("end_at"),
  chargeAt: timestamp("charge_at"),
  currentStart: timestamp("current_start"),
  currentEnd: timestamp("current_end"),
  notes: jsonb("notes").default('{}'),
  hasScheduledChanges: boolean("has_scheduled_changes").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_razorpay_sub_id").on(table.subscriptionId),
  index("idx_razorpay_sub_user").on(table.userId),
  index("idx_razorpay_sub_status").on(table.status),
]);

// Razorpay Webhook Events - Audit log for webhooks
export const razorpayWebhookEvents = pgTable("razorpay_webhook_events", {
  id: serial("id").primaryKey(),
  eventId: text("event_id").notNull().unique(),
  eventType: text("event_type").notNull(),
  orderId: text("order_id"),
  paymentId: text("payment_id"),
  subscriptionId: text("subscription_id"),
  payload: jsonb("payload").notNull(),
  signature: text("signature"),
  verified: boolean("verified").default(false),
  processed: boolean("processed").default(false),
  processedAt: timestamp("processed_at"),
  errorMessage: text("error_message"),
  receivedAt: timestamp("received_at").defaultNow(),
}, (table) => [
  index("idx_razorpay_webhook_event").on(table.eventId),
  index("idx_razorpay_webhook_type").on(table.eventType),
]);

// Razorpay Payment History - Detailed payment records
export const razorpayPaymentHistory = pgTable("razorpay_payment_history", {
  id: serial("id").primaryKey(),
  paymentId: text("payment_id").notNull().unique(),
  orderId: text("order_id"),
  subscriptionId: text("subscription_id"),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("INR"),
  status: text("status").notNull(),
  method: text("method"),
  userId: varchar("user_id").references(() => users.id),
  email: text("email"),
  contact: text("contact"),
  cardLast4: text("card_last4"),
  cardNetwork: text("card_network"),
  bank: text("bank"),
  vpa: text("vpa"),
  wallet: text("wallet"),
  refundedAmount: integer("refunded_amount").default(0),
  fee: integer("fee"),
  tax: integer("tax"),
  errorCode: text("error_code"),
  errorDescription: text("error_description"),
  notes: jsonb("notes").default('{}'),
  capturedAt: timestamp("captured_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_razorpay_payment_id").on(table.paymentId),
  index("idx_razorpay_payment_user").on(table.userId),
  index("idx_razorpay_payment_status").on(table.status),
]);

// ================================================================================================
// WAI STUDIO SCHEMA - COMPREHENSIVE BUILDER UX
// ================================================================================================

// Project Blueprints (ads-30s, reels, dubbing, longform-movie, RAG-docs, OCR-forms, dev-coding, assistant-hub)
export const waiStudioBlueprints = pgTable("wai_studio_blueprints", {
  id: serial("id").primaryKey(),
  blueprintId: text("blueprint_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  shortDescription: text("short_description"),
  
  // Blueprint Classification
  blueprintType: text("blueprint_type").notNull(), // ads-30s, reels, dubbing, longform-movie, rag-docs, ocr-forms, dev-coding, assistant-hub
  category: text("category").notNull(), // creative, content, development, automation, analysis
  industry: text("industry"), // marketing, entertainment, education, healthcare, finance
  useCase: text("use_case").notNull(),
  
  // Template Configuration
  templateStructure: jsonb("template_structure").default('{}'), // project structure template
  defaultAssets: jsonb("default_assets").default('[]'), // included default assets
  requiredInputs: jsonb("required_inputs").default('[]'), // required user inputs
  configurationSchema: jsonb("configuration_schema").default('{}'), // configuration options
  
  // Workflow Definition
  workflowSteps: jsonb("workflow_steps").default('[]'), // step-by-step workflow
  automatedSteps: jsonb("automated_steps").default('[]'), // automated processing steps
  humanReviewPoints: jsonb("human_review_points").default('[]'), // human intervention points
  
  // Requirements & Specifications
  technicalRequirements: jsonb("technical_requirements").default('{}'),
  outputSpecifications: jsonb("output_specifications").default('{}'),
  qualityStandards: jsonb("quality_standards").default('{}'),
  
  // Resources & Integrations
  requiredServices: jsonb("required_services").default('[]'), // LLM providers, tools needed
  integrations: jsonb("integrations").default('[]'), // third-party integrations
  estimatedCost: numeric("estimated_cost", { precision: 10, scale: 2 }),
  estimatedTime: integer("estimated_time"), // minutes
  
  // Versioning & Lifecycle
  version: text("version").notNull().default("1.0.0"),
  status: text("status").notNull().default("active"), // active, deprecated, experimental
  popularity: integer("popularity").default(0),
  usageCount: integer("usage_count").default(0),
  
  // Publishing
  isPublic: boolean("is_public").default(false),
  featured: boolean("featured").default(false),
  thumbnail: text("thumbnail"),
  screenshots: jsonb("screenshots").default('[]'),
  
  metadata: jsonb("metadata").default('{}'),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_wai_blueprint_id").on(table.blueprintId),
  index("idx_wai_blueprint_type").on(table.blueprintType),
  index("idx_wai_blueprint_category").on(table.category),
  index("idx_wai_blueprint_usage").on(table.usageCount),
]);

// Asset Desk - Media, Prompts, Datasets, Rights Ledger, Watermarking
export const waiStudioAssets = pgTable("wai_studio_assets", {
  id: serial("id").primaryKey(),
  assetId: text("asset_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  organizationId: integer("organization_id").references(() => organizations.id),
  projectId: integer("project_id").references(() => projects.id),
  
  // Asset Classification
  assetType: text("asset_type").notNull(), // media, prompt, dataset, template, code, documentation
  mediaType: text("media_type"), // image, video, audio, text, document, 3d-model
  fileFormat: text("file_format"), // jpg, mp4, wav, json, csv, etc.
  
  // File Information
  fileName: text("file_name"),
  filePath: text("file_path"),
  fileSize: integer("file_size"), // bytes
  fileUrl: text("file_url"),
  thumbnailUrl: text("thumbnail_url"),
  
  // Content Metadata
  dimensions: jsonb("dimensions").default('{}'), // width, height, duration, etc.
  contentMetadata: jsonb("content_metadata").default('{}'), // technical metadata
  qualityMetrics: jsonb("quality_metrics").default('{}'), // quality assessments
  
  // Rights & Licensing
  rightsHolder: text("rights_holder"),
  licenseType: text("license_type").notNull(), // proprietary, cc, royalty-free, commercial, custom
  licenseDetails: jsonb("license_details").default('{}'),
  usageRights: jsonb("usage_rights").default('{}'), // allowed usage scenarios
  expirationDate: timestamp("expiration_date"),
  
  // Watermarking & Protection
  watermarkEnabled: boolean("watermark_enabled").default(false),
  watermarkConfig: jsonb("watermark_config").default('{}'),
  digitalFingerprint: text("digital_fingerprint"), // content fingerprint
  copyrightInfo: jsonb("copyright_info").default('{}'),
  
  // Versioning & Variants
  version: text("version").notNull().default("1.0.0"),
  parentAssetId: text("parent_asset_id"),
  variants: jsonb("variants").default('[]'), // different sizes, formats, qualities
  
  // Usage Tracking
  accessCount: integer("access_count").default(0),
  downloadCount: integer("download_count").default(0),
  lastUsed: timestamp("last_used"),
  usageHistory: jsonb("usage_history").default('[]'),
  
  // Organization & Discovery
  tags: jsonb("tags").default('[]'),
  categories: jsonb("categories").default('[]'),
  collections: jsonb("collections").default('[]'),
  
  // Status & Lifecycle
  status: text("status").notNull().default("active"), // active, archived, deleted, processing
  reviewStatus: text("review_status").default("pending"), // pending, approved, rejected
  
  metadata: jsonb("metadata").default('{}'),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_wai_asset_id").on(table.assetId),
  index("idx_wai_asset_type").on(table.assetType),
  index("idx_wai_asset_project").on(table.projectId),
  index("idx_wai_asset_org").on(table.organizationId),
]);

// Experiment Hub - A/B Testing, Regression Analysis, Eval Dashboards
export const waiStudioExperiments = pgTable("wai_studio_experiments", {
  id: serial("id").primaryKey(),
  experimentId: text("experiment_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  organizationId: integer("organization_id").references(() => organizations.id),
  projectId: integer("project_id").references(() => projects.id),
  
  // Experiment Configuration
  experimentType: text("experiment_type").notNull(), // ab_test, multivariate, regression, performance, quality
  hypothesis: text("hypothesis"),
  objectives: jsonb("objectives").default('[]'), // what are we trying to measure/optimize
  
  // A/B Testing Configuration
  variants: jsonb("variants").default('[]'), // different versions being tested
  trafficSplit: jsonb("traffic_split").default('{}'), // how traffic is distributed
  
  // Regression Analysis
  regressionType: text("regression_type"), // linear, logistic, polynomial, etc.
  features: jsonb("features").default('[]'), // input features
  target: text("target"), // target variable
  
  // Experiment Parameters
  sampleSize: integer("sample_size"),
  confidenceLevel: numeric("confidence_level", { precision: 5, scale: 2 }).default("95.00"),
  powerAnalysis: jsonb("power_analysis").default('{}'),
  
  // Metrics & KPIs
  primaryMetrics: jsonb("primary_metrics").default('[]'), // main success metrics
  secondaryMetrics: jsonb("secondary_metrics").default('[]'), // supporting metrics
  guardrailMetrics: jsonb("guardrail_metrics").default('[]'), // safety metrics
  
  // Execution Configuration
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  duration: integer("duration"), // days
  status: text("status").notNull().default("draft"), // draft, running, paused, completed, cancelled
  
  // Results & Analysis
  results: jsonb("results").default('{}'), // experiment results
  statisticalSignificance: boolean("statistical_significance"),
  confidenceInterval: jsonb("confidence_interval").default('{}'),
  winner: text("winner"), // which variant won
  recommendation: text("recommendation"),
  
  // Evaluation Dashboard
  dashboardConfig: jsonb("dashboard_config").default('{}'),
  visualizations: jsonb("visualizations").default('[]'),
  reportTemplates: jsonb("report_templates").default('[]'),
  
  // Implementation
  implementationDetails: jsonb("implementation_details").default('{}'),
  rolloutPlan: jsonb("rollout_plan").default('{}'),
  
  metadata: jsonb("metadata").default('{}'),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_wai_experiment_id").on(table.experimentId),
  index("idx_wai_experiment_type").on(table.experimentType),
  index("idx_wai_experiment_status").on(table.status),
  index("idx_wai_experiment_project").on(table.projectId),
]);

// Publishing - Social APIs, Storage Clouds, CMS, App Stores
export const waiStudioPublishing = pgTable("wai_studio_publishing", {
  id: serial("id").primaryKey(),
  publishingId: text("publishing_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  organizationId: integer("organization_id").references(() => organizations.id),
  projectId: integer("project_id").references(() => projects.id),
  
  // Publishing Configuration
  publishingType: text("publishing_type").notNull(), // social, storage, cms, app_store, website, api
  platforms: jsonb("platforms").default('[]'), // target platforms
  
  // Social Media Publishing
  socialPlatforms: jsonb("social_platforms").default('[]'), // facebook, twitter, linkedin, instagram, youtube, tiktok
  postingSchedule: jsonb("posting_schedule").default('{}'),
  contentOptimization: jsonb("content_optimization").default('{}'),
  hashtagStrategy: jsonb("hashtag_strategy").default('{}'),
  
  // Storage & Cloud Publishing
  storageProviders: jsonb("storage_providers").default('[]'), // aws-s3, gcp-storage, azure-blob, cloudflare-r2
  storageConfiguration: jsonb("storage_configuration").default('{}'),
  cdnConfiguration: jsonb("cdn_configuration").default('{}'),
  
  // CMS Publishing
  cmsProviders: jsonb("cms_providers").default('[]'), // wordpress, drupal, contentful, strapi, ghost
  cmsConfiguration: jsonb("cms_configuration").default('{}'),
  contentTemplates: jsonb("content_templates").default('[]'),
  
  // App Store Publishing
  appStores: jsonb("app_stores").default('[]'), // ios, android, web, chrome, firefox
  appStoreConfiguration: jsonb("app_store_configuration").default('{}'),
  reviewGuidelines: jsonb("review_guidelines").default('{}'),
  
  // Publishing Rules & Automation
  publishingRules: jsonb("publishing_rules").default('[]'),
  automationTriggers: jsonb("automation_triggers").default('[]'),
  approvalWorkflow: jsonb("approval_workflow").default('{}'),
  
  // Content Processing
  preprocessingSteps: jsonb("preprocessing_steps").default('[]'),
  formatConversion: jsonb("format_conversion").default('{}'),
  qualityChecks: jsonb("quality_checks").default('[]'),
  
  // Analytics & Tracking
  analyticsIntegration: jsonb("analytics_integration").default('{}'),
  trackingConfiguration: jsonb("tracking_configuration").default('{}'),
  performanceMetrics: jsonb("performance_metrics").default('{}'),
  
  // Status & History
  status: text("status").notNull().default("draft"), // draft, scheduled, publishing, published, failed
  publishingHistory: jsonb("publishing_history").default('[]'),
  lastPublished: timestamp("last_published"),
  
  // Rollback & Version Control
  rollbackConfiguration: jsonb("rollback_configuration").default('{}'),
  versionHistory: jsonb("version_history").default('[]'),
  
  metadata: jsonb("metadata").default('{}'),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_wai_publishing_id").on(table.publishingId),
  index("idx_wai_publishing_type").on(table.publishingType),
  index("idx_wai_publishing_status").on(table.status),
  index("idx_wai_publishing_project").on(table.projectId),
]);

// ================================================================================================
// P0 ROADMAP TRACKING SYSTEM
// ================================================================================================

export const p0RoadmapPhases = pgTable("p0_roadmap_phases", {
  id: serial("id").primaryKey(),
  phaseId: text("phase_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // p0_enhancement, wizards_incubator, integration
  priority: integer("priority").notNull().default(1),
  status: text("status").notNull().default("planned"), // planned, in_progress, completed, blocked, cancelled
  startDate: timestamp("start_date"),
  targetEndDate: timestamp("target_end_date"),
  actualEndDate: timestamp("actual_end_date"),
  durationWeeks: integer("duration_weeks"),
  completionPercentage: integer("completion_percentage").default(0),
  owner: text("owner"),
  dependencies: jsonb("dependencies").default('[]'),
  objectives: jsonb("objectives").default('[]'),
  deliverables: jsonb("deliverables").default('[]'),
  risks: jsonb("risks").default('[]'),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_p0_phase_id").on(table.phaseId),
  index("idx_p0_phase_status").on(table.status),
  index("idx_p0_phase_type").on(table.type),
]);

export const p0Milestones = pgTable("p0_milestones", {
  id: serial("id").primaryKey(),
  milestoneId: text("milestone_id").notNull().unique(),
  phaseId: text("phase_id").notNull().references(() => p0RoadmapPhases.phaseId),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // agent_expansion, protocol_integration, infrastructure, quality
  priority: integer("priority").notNull().default(1),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, blocked, cancelled
  targetDate: timestamp("target_date"),
  actualDate: timestamp("actual_date"),
  completionPercentage: integer("completion_percentage").default(0),
  qualityGatesPassed: integer("quality_gates_passed").default(0),
  qualityGatesTotal: integer("quality_gates_total").default(0),
  owner: text("owner"),
  successCriteria: jsonb("success_criteria").default('[]'),
  deliverables: jsonb("deliverables").default('[]'),
  blockers: jsonb("blockers").default('[]'),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_p0_milestone_id").on(table.milestoneId),
  index("idx_p0_milestone_phase").on(table.phaseId),
  index("idx_p0_milestone_status").on(table.status),
  index("idx_p0_milestone_category").on(table.category),
]);

export const p0Tasks = pgTable("p0_tasks", {
  id: serial("id").primaryKey(),
  taskId: text("task_id").notNull().unique(),
  milestoneId: text("milestone_id").notNull().references(() => p0Milestones.milestoneId),
  phaseId: text("phase_id").notNull().references(() => p0RoadmapPhases.phaseId),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // research, schema, implementation, testing, integration, documentation
  priority: text("priority").notNull().default("medium"), // critical, high, medium, low
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, blocked, cancelled
  assignee: text("assignee"),
  estimatedHours: integer("estimated_hours"),
  actualHours: integer("actual_hours"),
  startDate: timestamp("start_date"),
  dueDate: timestamp("due_date"),
  completedDate: timestamp("completed_date"),
  completionPercentage: integer("completion_percentage").default(0),
  complexity: text("complexity").default("medium"), // low, medium, high, critical
  technicalDebt: boolean("technical_debt").default(false),
  qualityChecks: jsonb("quality_checks").default('[]'),
  testCoverage: integer("test_coverage").default(0),
  codeReviewStatus: text("code_review_status"), // pending, approved, changes_requested
  architectReviewed: boolean("architect_reviewed").default(false),
  blockers: jsonb("blockers").default('[]'),
  notes: jsonb("notes").default('[]'),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_p0_task_id").on(table.taskId),
  index("idx_p0_task_milestone").on(table.milestoneId),
  index("idx_p0_task_phase").on(table.phaseId),
  index("idx_p0_task_status").on(table.status),
  index("idx_p0_task_priority").on(table.priority),
  index("idx_p0_task_assignee").on(table.assignee),
]);

export const p0QualityGates = pgTable("p0_quality_gates", {
  id: serial("id").primaryKey(),
  gateId: text("gate_id").notNull().unique(),
  taskId: text("task_id").references(() => p0Tasks.taskId),
  milestoneId: text("milestone_id").references(() => p0Milestones.milestoneId),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // code_quality, security, performance, testing, documentation
  status: text("status").notNull().default("pending"), // pending, passed, failed, skipped
  required: boolean("required").default(true),
  checks: jsonb("checks").default('[]'), // Array of check objects with name, status, result
  thresholds: jsonb("thresholds").default('{}'), // Min thresholds for coverage, complexity, etc
  results: jsonb("results").default('{}'),
  score: integer("score"),
  maxScore: integer("max_score"),
  executedAt: timestamp("executed_at"),
  executedBy: text("executed_by"),
  failureReason: text("failure_reason"),
  remediationPlan: text("remediation_plan"),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_p0_gate_id").on(table.gateId),
  index("idx_p0_gate_task").on(table.taskId),
  index("idx_p0_gate_milestone").on(table.milestoneId),
  index("idx_p0_gate_status").on(table.status),
  index("idx_p0_gate_category").on(table.category),
]);

export const p0TaskDependencies = pgTable("p0_task_dependencies", {
  id: serial("id").primaryKey(),
  taskId: text("task_id").notNull().references(() => p0Tasks.taskId),
  dependsOnTaskId: text("depends_on_task_id").notNull().references(() => p0Tasks.taskId),
  dependencyType: text("dependency_type").notNull().default("finish_to_start"), // finish_to_start, start_to_start, finish_to_finish
  isBlocking: boolean("is_blocking").default(true),
  leadTime: integer("lead_time").default(0), // hours of lead time required
  status: text("status").notNull().default("active"), // active, resolved, violated
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_p0_dep_task").on(table.taskId),
  index("idx_p0_dep_depends_on").on(table.dependsOnTaskId),
  index("idx_p0_dep_status").on(table.status),
]);

export const p0ProgressMetrics = pgTable("p0_progress_metrics", {
  id: serial("id").primaryKey(),
  metricId: text("metric_id").notNull().unique(),
  entityType: text("entity_type").notNull(), // phase, milestone, task
  entityId: text("entity_id").notNull(),
  metricType: text("metric_type").notNull(), // velocity, burndown, quality, risk
  timestamp: timestamp("timestamp").defaultNow(),
  value: numeric("value", { precision: 10, scale: 2 }),
  unit: text("unit"),
  target: numeric("target", { precision: 10, scale: 2 }),
  variance: numeric("variance", { precision: 10, scale: 2 }),
  trend: text("trend"), // improving, stable, declining
  details: jsonb("details").default('{}'),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_p0_metric_id").on(table.metricId),
  index("idx_p0_metric_entity").on(table.entityType, table.entityId),
  index("idx_p0_metric_type").on(table.metricType),
  index("idx_p0_metric_timestamp").on(table.timestamp),
]);

// WAI SDK v1.0 Core Configuration and Bootstrap System
export const waiSdkConfiguration = pgTable("wai_sdk_configuration", {
  id: serial("id").primaryKey(),
  projectId: text("project_id").notNull().unique(),
  version: text("version").notNull().default('1.0.0'),
  bootstrapStatus: text("bootstrap_status").notNull().default("pending"), // pending, initializing, active, failed
  configurationHash: text("configuration_hash").notNull(),
  enabledFeatures: jsonb("enabled_features").default('[]'),
  orchestrationMode: text("orchestration_mode").notNull().default("mandatory"), // mandatory, optional, hybrid
  agentEnforcementLevel: text("agent_enforcement_level").notNull().default("strict"), // strict, moderate, permissive
  quantumOptimization: boolean("quantum_optimization").default(true),
  realTimeAnalytics: boolean("real_time_analytics").default(true),
  advancedSecurity: boolean("advanced_security").default(true),
  deploymentTargets: jsonb("deployment_targets").default('["production", "development"]'),
  bmadCoordination: boolean("bmad_coordination").default(true),
  continuousExecution: boolean("continuous_execution").default(true),
  parallelProcessing: boolean("parallel_processing").default(true),
  costOptimization: jsonb("cost_optimization").default('{"enabled": true, "preferFreeModels": true, "costThreshold": 0.1}'),
  metadata: jsonb("metadata").default('{}'),
  lastBootstrap: timestamp("last_bootstrap"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_wai_sdk_project").on(table.projectId),
  index("idx_wai_sdk_status").on(table.bootstrapStatus),
  index("idx_wai_sdk_version").on(table.version),
]);

// Enhanced LLM Provider Registry with v9.0 Advanced Models
export const waiLlmProvidersV9 = pgTable("wai_llm_providers_v9", {
  id: serial("id").primaryKey(),
  providerId: text("provider_id").notNull().unique(),
  name: text("name").notNull(),
  type: text("type").notNull(), // text, vision, video, audio, creative, reasoning
  status: text("status").notNull().default("active"), // active, inactive, maintenance, restricted
  apiKeyEncrypted: text("api_key_encrypted"),
  apiKeyHash: text("api_key_hash"),
  encryptionIv: text("encryption_iv"),
  models: jsonb("models").default('[]'),
  capabilities: jsonb("capabilities").default('[]'),
  costTier: text("cost_tier").notNull().default("free"), // free, low, medium, high, premium
  costPerToken: numeric("cost_per_token", { precision: 12, scale: 8 }),
  qualityScore: numeric("quality_score", { precision: 5, scale: 2 }),
  latencyMs: integer("latency_ms"),
  maxTokens: integer("max_tokens"),
  contextWindow: integer("context_window"),
  quantumSupport: boolean("quantum_support").default(false),
  realTimeOptimization: boolean("real_time_optimization").default(true),
  advancedFeatures: jsonb("advanced_features").default('[]'),
  deploymentRegions: jsonb("deployment_regions").default('["global"]'),
  rateLimit: jsonb("rate_limit").default('{}'),
  healthMetrics: jsonb("health_metrics").default('{}'),
  lastHealthCheck: timestamp("last_health_check"),
  errorCount: integer("error_count").default(0),
  successCount: integer("success_count").default(0),
  totalRequests: integer("total_requests").default(0),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_wai_llm_v9_provider").on(table.providerId),
  index("idx_wai_llm_v9_status").on(table.status),
  index("idx_wai_llm_v9_cost_tier").on(table.costTier),
  index("idx_wai_llm_v9_quality").on(table.qualityScore),
  index("idx_wai_llm_v9_type").on(table.type),
]);

// Advanced Video/Creative Models Integration (HunyuanVideo, Kling, VEO3, etc.)
export const waiCreativeModels = pgTable("wai_creative_models", {
  id: serial("id").primaryKey(),
  modelId: text("model_id").notNull().unique(),
  name: text("name").notNull(),
  type: text("type").notNull(), // video, audio, music, 3d, image, multimodal
  provider: text("provider").notNull(), // hunyuan, kling, veo3, suno, mubert, openmanus, openlovable
  version: text("version").notNull(),
  status: text("status").notNull().default("active"),
  capabilities: jsonb("capabilities").default('[]'),
  specifications: jsonb("specifications").default('{}'), // resolution, duration, quality settings
  costStructure: jsonb("cost_structure").default('{}'),
  processingTime: jsonb("processing_time").default('{}'), // average processing times
  qualityMetrics: jsonb("quality_metrics").default('{}'),
  outputFormats: jsonb("output_formats").default('[]'),
  inputRequirements: jsonb("input_requirements").default('{}'),
  limitations: jsonb("limitations").default('{}'),
  apiEndpoint: text("api_endpoint"),
  authenticationMethod: text("authentication_method"),
  rateLimits: jsonb("rate_limits").default('{}'),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_wai_creative_model").on(table.modelId),
  index("idx_wai_creative_type").on(table.type),
  index("idx_wai_creative_provider").on(table.provider),
  index("idx_wai_creative_status").on(table.status),
]);

// WAI Agent Registry v9.0 with 105+ Agents
export const waiAgentRegistryV9 = pgTable("wai_agent_registry_v9", {
  id: serial("id").primaryKey(),
  agentId: text("agent_id").notNull().unique(),
  name: text("name").notNull(),
  tier: text("tier").notNull(), // executive, development, creative, qa, devops, domain-specialist
  category: text("category").notNull(),
  version: text("version").notNull().default('1.0.0'),
  status: text("status").notNull().default("active"), // active, inactive, loading, training, upgrading
  capabilities: jsonb("capabilities").default('[]'),
  expertise: jsonb("expertise").default('[]'),
  tools: jsonb("tools").default('[]'),
  systemPrompt: text("system_prompt"),
  performance: jsonb("performance").default('{}'),
  selfHealingConfig: jsonb("self_healing_config").default('{}'),
  quantumCapabilities: jsonb("quantum_capabilities").default('[]'),
  realTimeProcessing: boolean("real_time_processing").default(true),
  multiModalSupport: boolean("multi_modal_support").default(false),
  advancedMemory: jsonb("advanced_memory").default('{}'),
  collaborationProtocols: jsonb("collaboration_protocols").default('[]'),
  enterpriseFeatures: jsonb("enterprise_features").default('{}'),
  resourceRequirements: jsonb("resource_requirements").default('{}'),
  memoryUsageMb: integer("memory_usage_mb"),
  cpuUsagePercent: numeric("cpu_usage_percent", { precision: 5, scale: 2 }),
  requestsHandled: integer("requests_handled").default(0),
  averageResponseTime: integer("average_response_time"),
  successRate: numeric("success_rate", { precision: 5, scale: 2 }).default("100.00"),
  lastActivity: timestamp("last_activity"),
  loadedAt: timestamp("loaded_at"),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_wai_agent_v9_id").on(table.agentId),
  index("idx_wai_agent_v9_tier").on(table.tier),
  index("idx_wai_agent_v9_status").on(table.status),
  index("idx_wai_agent_v9_category").on(table.category),
  index("idx_wai_agent_v9_activity").on(table.lastActivity),
]);

// BMAD Method Coordination System
export const waiBmadCoordination = pgTable("wai_bmad_coordination", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  coordinationId: text("coordination_id").notNull().unique(),
  coordinationType: text("coordination_type").notNull(), // bmad, parallel, sequential, hybrid
  participantAgents: jsonb("participant_agents").default('[]'),
  coordinationState: text("coordination_state").notNull().default("initializing"), // initializing, coordinating, executing, completed, failed
  taskDistribution: jsonb("task_distribution").default('{}'),
  synchronizationPoints: jsonb("synchronization_points").default('[]'),
  conflictResolution: jsonb("conflict_resolution").default('{}'),
  performanceMetrics: jsonb("performance_metrics").default('{}'),
  qualityAssurance: jsonb("quality_assurance").default('{}'),
  executionPlan: jsonb("execution_plan").default('{}'),
  results: jsonb("results").default('{}'),
  metadata: jsonb("metadata").default('{}'),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_wai_bmad_session").on(table.sessionId),
  index("idx_wai_bmad_coordination").on(table.coordinationId),
  index("idx_wai_bmad_state").on(table.coordinationState),
  index("idx_wai_bmad_type").on(table.coordinationType),
]);

// Advanced Context Engineering System
export const waiContextLayers = pgTable("wai_context_layers", {
  id: serial("id").primaryKey(),
  contextId: text("context_id").notNull().unique(),
  sessionId: text("session_id").notNull(),
  layerType: text("layer_type").notNull(), // episodic, semantic, procedural, working, global, domain
  layerLevel: integer("layer_level").notNull(), // 1-5 priority level
  contextData: jsonb("context_data").default('{}'),
  memoryType: text("memory_type").notNull(), // short_term, long_term, persistent, temporal
  retention: jsonb("retention").default('{}'),
  compression: jsonb("compression").default('{}'),
  indexing: jsonb("indexing").default('{}'),
  relationships: jsonb("relationships").default('[]'),
  relevanceScore: numeric("relevance_score", { precision: 5, scale: 2 }).default("0.00"),
  accessCount: integer("access_count").default(0),
  lastAccessed: timestamp("last_accessed"),
  expiryDate: timestamp("expiry_date"),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_wai_context_id").on(table.contextId),
  index("idx_wai_context_session").on(table.sessionId),
  index("idx_wai_context_layer").on(table.layerType),
  index("idx_wai_context_relevance").on(table.relevanceScore),
  index("idx_wai_context_accessed").on(table.lastAccessed),
]);

// WAI Agent Negotiation Sessions - For A2A protocol negotiations
export const waiNegotiationSessions = pgTable("wai_negotiation_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  negotiationType: text("negotiation_type").notNull(), // task_assignment, resource_allocation, priority_negotiation, consensus_building
  initiatorAgentId: text("initiator_agent_id").references(() => agentCatalog.agentId, { onDelete: "cascade" }).notNull(),
  workflowExecutionId: uuid("workflow_execution_id").references(() => workflowExecutionsV9.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  participantAgents: jsonb("participant_agents").default('[]'), // array of agent IDs
  negotiationState: text("negotiation_state").notNull().default("initiated"), // initiated, negotiating, reached_agreement, failed, cancelled
  proposals: jsonb("proposals").default('[]'), // array of proposals from agents
  counterProposals: jsonb("counter_proposals").default('[]'),
  finalAgreement: jsonb("final_agreement").default('{}'),
  votingResults: jsonb("voting_results").default('{}'),
  negotiationRules: jsonb("negotiation_rules").default('{}'),
  priority: integer("priority").default(5), // 1-10 priority level
  timeout: integer("timeout").default(300), // seconds
  metadata: jsonb("metadata").default('{}'),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_wai_negotiation_session").on(table.sessionId),
  index("idx_wai_negotiation_type").on(table.negotiationType),
  index("idx_wai_negotiation_state").on(table.negotiationState),
  index("idx_wai_negotiation_initiator").on(table.initiatorAgentId),
]);

// BMAD Behavioral Patterns - Agent behavior patterns and workflows
export const waiBmadPatterns = pgTable("wai_bmad_patterns", {
  id: serial("id").primaryKey(),
  patternId: text("pattern_id").notNull().unique(),
  patternName: text("pattern_name").notNull(),
  patternType: text("pattern_type").notNull(), // linear, parallel, hierarchical, mesh, adaptive, swarm
  description: text("description"),
  patternDefinition: jsonb("pattern_definition").notNull(), // workflow structure
  coordinationId: text("coordination_id").references(() => waiBmadCoordination.coordinationId, { onDelete: "set null" }),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  applicableAgents: jsonb("applicable_agents").default('[]'), // agent tiers/categories that can use this
  successConditions: jsonb("success_conditions").default('{}'),
  failureHandling: jsonb("failure_handling").default('{}'),
  optimizationRules: jsonb("optimization_rules").default('{}'),
  performanceMetrics: jsonb("performance_metrics").default('{}'),
  usageCount: integer("usage_count").default(0),
  successRate: numeric("success_rate", { precision: 5, scale: 2 }).default("0.00"),
  averageExecutionTime: integer("average_execution_time"), // milliseconds
  isActive: boolean("is_active").default(true),
  version: text("version").default("1.0.0"),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_wai_bmad_pattern_id").on(table.patternId),
  index("idx_wai_bmad_pattern_type").on(table.patternType),
  index("idx_wai_bmad_pattern_active").on(table.isActive),
  index("idx_wai_bmad_pattern_success").on(table.successRate),
]);

// CAM Context Clusters - Advanced context clustering and organization
export const waiCamClusters = pgTable("wai_cam_clusters", {
  id: serial("id").primaryKey(),
  clusterId: text("cluster_id").notNull().unique(),
  clusterName: text("cluster_name").notNull(),
  clusterType: text("cluster_type").notNull(), // semantic, temporal, spatial, conceptual, relational
  description: text("description"),
  sessionId: text("session_id"),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  agentId: text("agent_id").references(() => agentCatalog.agentId, { onDelete: "set null" }),
  centerVector: jsonb("center_vector").default('[]'), // embedding vector for cluster center
  memberContexts: jsonb("member_contexts").default('[]'), // array of context IDs
  clusterMetrics: jsonb("cluster_metrics").default('{}'), // cohesion, separation, density
  semanticTags: jsonb("semantic_tags").default('[]'),
  relatedClusters: jsonb("related_clusters").default('[]'), // cluster IDs
  accessPatterns: jsonb("access_patterns").default('{}'), // usage statistics
  compressionRate: numeric("compression_rate", { precision: 5, scale: 2 }).default("1.00"),
  relevanceScore: numeric("relevance_score", { precision: 5, scale: 2 }).default("0.00"),
  lastAccessed: timestamp("last_accessed"),
  expiryPolicy: jsonb("expiry_policy").default('{}'),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_wai_cam_cluster_id").on(table.clusterId),
  index("idx_wai_cam_cluster_type").on(table.clusterType),
  index("idx_wai_cam_cluster_relevance").on(table.relevanceScore),
  index("idx_wai_cam_cluster_accessed").on(table.lastAccessed),
]);

// GRPO Policies - Reinforcement learning policies and parameters
export const waiGrpoPolicies = pgTable("wai_grpo_policies", {
  id: serial("id").primaryKey(),
  policyId: text("policy_id").notNull().unique(),
  policyName: text("policy_name").notNull(),
  policyType: text("policy_type").notNull(), // agent_selection, resource_allocation, cost_optimization, quality_optimization
  description: text("description"),
  trainingJobId: text("training_job_id").references(() => waiGrpoTrainingJobs.jobId, { onDelete: "set null" }),
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "set null" }),
  targetAgents: jsonb("target_agents").default('[]'), // agent IDs this policy applies to
  policyParameters: jsonb("policy_parameters").notNull(), // policy configuration
  optimizationGoals: jsonb("optimization_goals").default('{}'), // objectives to optimize
  constraints: jsonb("constraints").default('{}'),
  rewardFunction: jsonb("reward_function").notNull(), // reward calculation rules
  explorationRate: numeric("exploration_rate", { precision: 5, scale: 2 }).default("0.10"), // epsilon for exploration
  learningRate: numeric("learning_rate", { precision: 6, scale: 4 }).default("0.001"),
  discountFactor: numeric("discount_factor", { precision: 5, scale: 2 }).default("0.95"), // gamma
  trainingIterations: integer("training_iterations").default(0),
  performanceMetrics: jsonb("performance_metrics").default('{}'),
  lastTrainingRun: timestamp("last_training_run"),
  isActive: boolean("is_active").default(true),
  version: text("version").default("1.0.0"),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_wai_grpo_policy_id").on(table.policyId),
  index("idx_wai_grpo_policy_type").on(table.policyType),
  index("idx_wai_grpo_policy_active").on(table.isActive),
  index("idx_wai_grpo_policy_training").on(table.lastTrainingRun),
]);

// Quantum-Optimized Request Routing System
export const waiQuantumRouting = pgTable("wai_quantum_routing", {
  id: serial("id").primaryKey(),
  routingId: text("routing_id").notNull().unique(),
  requestId: text("request_id").notNull(),
  routingAlgorithm: text("routing_algorithm").notNull(), // quantum_superposition, quantum_entanglement, classical_optimized
  routingDecision: jsonb("routing_decision").default('{}'),
  selectedProviders: jsonb("selected_providers").default('[]'),
  selectedAgents: jsonb("selected_agents").default('[]'),
  optimizationCriteria: jsonb("optimization_criteria").default('{}'), // cost, quality, speed, reliability
  quantumState: jsonb("quantum_state").default('{}'),
  probabilityDistribution: jsonb("probability_distribution").default('{}'),
  fallbackChain: jsonb("fallback_chain").default('[]'),
  routingPerformance: jsonb("routing_performance").default('{}'),
  costOptimization: jsonb("cost_optimization").default('{}'),
  qualityMetrics: jsonb("quality_metrics").default('{}'),
  executionTime: integer("execution_time"),
  totalCost: numeric("total_cost", { precision: 8, scale: 4 }),
  qualityScore: numeric("quality_score", { precision: 5, scale: 2 }),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("idx_wai_quantum_routing").on(table.routingId),
  index("idx_wai_quantum_request").on(table.requestId),
  index("idx_wai_quantum_algorithm").on(table.routingAlgorithm),
  index("idx_wai_quantum_created").on(table.createdAt),
]);

// WAI Unified Orchestration SDK Tables - Production Ready for 1M+ Users
export const waiPerformanceMetrics = pgTable("wai_performance_metrics", {
  id: serial("id").primaryKey(),
  metricType: text("metric_type").notNull(), // response_time, cost, quality, error_rate
  component: text("component").notNull(), // llm_provider, agent_type, orchestration_layer
  value: numeric("value", { precision: 12, scale: 4 }).notNull(),
  unit: text("unit").notNull(), // milliseconds, dollars, percentage, count
  metadata: jsonb("metadata").default('{}'),
  userId: varchar("user_id").references(() => users.id),
  requestId: text("request_id"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => [
  index("idx_wai_performance_metrics_timestamp").on(table.timestamp),
  index("idx_wai_performance_metrics_component").on(table.component),
  index("idx_wai_performance_metrics_user").on(table.userId),
]);

export const waiLlmProviders = pgTable("wai_llm_providers", {
  id: serial("id").primaryKey(),
  providerId: text("provider_id").notNull().unique(), // openai, anthropic, google, etc
  name: text("name").notNull(),
  status: text("status").notNull().default("active"), // active, inactive, maintenance
  apiKeyEncrypted: text("api_key_encrypted"), // AES-256 encrypted API key
  apiKeyHash: text("api_key_hash"), // SHA-256 hash for verification
  encryptionIv: text("encryption_iv"), // Initialization vector for encryption
  models: jsonb("models").default('[]'),
  capabilities: jsonb("capabilities").default('[]'), // text, image, code, reasoning
  costPerToken: numeric("cost_per_token", { precision: 10, scale: 6 }),
  qualityScore: numeric("quality_score", { precision: 3, scale: 2 }),
  latencyMs: integer("latency_ms"),
  maxTokens: integer("max_tokens"),
  metadata: jsonb("metadata").default('{}'),
  lastHealthCheck: timestamp("last_health_check"),
  errorCount: integer("error_count").default(0),
  successCount: integer("success_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_wai_llm_providers_status").on(table.status),
  index("idx_wai_llm_providers_quality").on(table.qualityScore),
]);

// AI Assistant Tables for Production (Phase 3)
export const aiAssistantsEnhanced = pgTable("ai_assistants_enhanced", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  avatar: text("avatar"),
  status: text("status").notNull().default("inactive"), // active, inactive, testing, maintenance
  version: text("version").notNull().default("1.0.0"),
  languages: jsonb("languages").default('["English"]'),
  capabilities: jsonb("capabilities").default('["Text"]'),
  ragConfig: jsonb("rag_config").default('{}'),
  voiceConfig: jsonb("voice_config"),
  embedding: jsonb("embedding"),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const assistantMetrics = pgTable("assistant_metrics", {
  id: serial("id").primaryKey(),
  assistantId: uuid("assistant_id").references(() => aiAssistants.id).notNull(),
  totalConversations: integer("total_conversations").default(0),
  activeUsers: integer("active_users").default(0),
  satisfactionScore: numeric("satisfaction_score", { precision: 5, scale: 2 }).default('0'),
  avgResponseTime: numeric("avg_response_time", { precision: 8, scale: 2 }).default('0'),
  successRate: numeric("success_rate", { precision: 5, scale: 2 }).default('0'),
  date: timestamp("date").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_assistant_metrics_assistant").on(table.assistantId),
  index("idx_assistant_metrics_date").on(table.date),
]);

export const assistantVersions = pgTable("assistant_versions", {
  id: serial("id").primaryKey(),
  assistantId: uuid("assistant_id").references(() => aiAssistants.id).notNull(),
  version: text("version").notNull(),
  changes: jsonb("changes").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_assistant_versions_assistant").on(table.assistantId),
]);

// Content Management Tables for Million-Scale
export const contentItems = pgTable("content_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // text, image, video, audio, presentation, code
  content: text("content"),
  url: text("url"),
  size: integer("size").default(0),
  folderId: uuid("folder_id"),
  status: text("status").notNull().default("draft"), // draft, processing, published, archived
  author: text("author").notNull(),
  tags: jsonb("tags").default('[]'),
  metadata: jsonb("metadata").default('{}'),
  quality: integer("quality"),
  brandVoice: text("brand_voice"),
  language: text("language").default("English"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_content_items_folder").on(table.folderId),
  index("idx_content_items_status").on(table.status),
  index("idx_content_items_type").on(table.type),
]);

// Note: contentVersions table is defined below with more comprehensive fields

export const contentFolders = pgTable("content_folders", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  parentId: uuid("parent_id"),
  path: text("path"),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_content_folders_parent").on(table.parentId),
]);

// Note: projects table is defined below with more comprehensive fields

export const projectPlans = pgTable("project_plans", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  techStack: jsonb("tech_stack").default('[]'),
  architecture: jsonb("architecture").default('{}'),
  features: jsonb("features").default('[]'),
  timeline: jsonb("timeline").default('[]'),
  cost: jsonb("cost").default('{}'),
  risks: jsonb("risks").default('[]'),
  dependencies: jsonb("dependencies").default('[]'),
  complexity: text("complexity").notNull().default("moderate"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_project_plans_project").on(table.projectId),
]);

export const projectResources = pgTable("project_resources", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  cpu: integer("cpu").default(0),
  memory: integer("memory").default(0),
  storage: integer("storage").default(0),
  bandwidth: integer("bandwidth").default(0),
  agents: integer("agents").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_project_resources_project").on(table.projectId),
]);

export const waiAgentLoadingSystem = pgTable("wai_agent_loading_system", {
  id: serial("id").primaryKey(),
  agentId: text("agent_id").notNull().unique(),
  agentType: text("agent_type").notNull(), // code, creative, analysis, enterprise
  name: text("name").notNull(),
  status: text("status").notNull().default("loaded"), // loaded, unloaded, loading, error
  capabilities: jsonb("capabilities").default('[]'),
  memoryUsageMb: integer("memory_usage_mb"),
  cpuUsagePercent: numeric("cpu_usage_percent", { precision: 5, scale: 2 }),
  requestsHandled: integer("requests_handled").default(0),
  averageResponseTime: integer("average_response_time"),
  lastActivity: timestamp("last_activity"),
  loadedAt: timestamp("loaded_at").defaultNow(),
  metadata: jsonb("metadata").default('{}'),
}, (table) => [
  index("idx_wai_agent_status").on(table.status),
  index("idx_wai_agent_type").on(table.agentType),
  index("idx_wai_agent_activity").on(table.lastActivity),
]);

// Enhanced Orchestration Request System v9.0
export const waiOrchestrationRequestsV9 = pgTable("wai_orchestration_requests_v9", {
  id: text("id").primaryKey(), // exec_timestamp_random
  userId: varchar("user_id").references(() => users.id),
  projectId: text("project_id"),
  sessionId: text("session_id").notNull(),
  requestType: text("request_type").notNull(), // development, creative, analysis, enterprise, hybrid
  task: text("task").notNull(),
  priority: text("priority").notNull().default("medium"), // low, medium, high, critical, quantum
  status: text("status").notNull().default("pending"), // pending, routing, processing, coordinating, completed, failed
  orchestrationMode: text("orchestration_mode").notNull().default("auto"), // auto, manual, quantum, hybrid
  agentEnforcement: text("agent_enforcement").notNull().default("strict"), // strict, moderate, permissive
  selectedAgents: jsonb("selected_agents").default('[]'),
  selectedProviders: jsonb("selected_providers").default('[]'),
  routingDecision: jsonb("routing_decision").default('{}'),
  bmadCoordination: jsonb("bmad_coordination"),
  contextLayers: jsonb("context_layers").default('[]'),
  parallelExecution: boolean("parallel_execution").default(false),
  continuousExecution: boolean("continuous_execution").default(false),
  quantumOptimization: boolean("quantum_optimization").default(false),
  result: jsonb("result"),
  intermediateResults: jsonb("intermediate_results").default('[]'),
  componentsUsed: jsonb("components_used").default('[]'),
  executionPlan: jsonb("execution_plan").default('{}'),
  executionTimeMs: integer("execution_time_ms"),
  totalCost: numeric("total_cost", { precision: 10, scale: 6 }),
  costBreakdown: jsonb("cost_breakdown").default('{}'),
  tokensUsed: integer("tokens_used"),
  qualityScore: numeric("quality_score", { precision: 5, scale: 2 }),
  qualityMetrics: jsonb("quality_metrics").default('{}'),
  performanceMetrics: jsonb("performance_metrics").default('{}'),
  optimizationMetrics: jsonb("optimization_metrics").default('{}'),
  errorMessage: text("error_message"),
  errorDetails: jsonb("error_details"),
  fallbackExecuted: boolean("fallback_executed").default(false),
  fallbackChain: jsonb("fallback_chain").default('[]'),
  userFeedback: jsonb("user_feedback"),
  auditTrail: jsonb("audit_trail").default('[]'),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  routedAt: timestamp("routed_at"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("idx_wai_orchestration_v9_user").on(table.userId),
  index("idx_wai_orchestration_v9_project").on(table.projectId),
  index("idx_wai_orchestration_v9_session").on(table.sessionId),
  index("idx_wai_orchestration_v9_status").on(table.status),
  index("idx_wai_orchestration_v9_created").on(table.createdAt),
  index("idx_wai_orchestration_v9_type").on(table.requestType),
  index("idx_wai_orchestration_v9_priority").on(table.priority),
]);

// Backward compatibility export
export const waiOrchestrationRequests = waiOrchestrationRequestsV9;

export const waiAgentCommunication = pgTable("wai_agent_communication", {
  id: serial("id").primaryKey(),
  fromAgentId: text("from_agent_id").notNull(),
  toAgentId: text("to_agent_id").notNull(),
  messageType: text("message_type").notNull(), // task_delegation, status_update, data_exchange
  content: jsonb("content").notNull(),
  status: text("status").notNull().default("sent"), // sent, received, processed, failed
  priority: text("priority").notNull().default("normal"), // low, normal, high, urgent
  sessionId: text("session_id"),
  responseToId: integer("response_to_id"),
  metadata: jsonb("metadata").default('{}'),
  sentAt: timestamp("sent_at").defaultNow(),
  receivedAt: timestamp("received_at"),
  processedAt: timestamp("processed_at"),
}, (table) => [
  index("idx_wai_agent_comm_session").on(table.sessionId),
  index("idx_wai_agent_comm_status").on(table.status),
  index("idx_wai_agent_comm_sent").on(table.sentAt),
]);

export const userOrganizations = pgTable("user_organizations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  role: text("role").notNull().default("member"), // owner, admin, member
  permissions: jsonb("permissions").default('[]'),
  joinedAt: timestamp("joined_at").defaultNow(),
}, (table) => ({
  userOrgIndex: index("user_org_idx").on(table.userId, table.organizationId),
}));

// User API Keys and Configuration storage with Enhanced Security
export const userApiKeys = pgTable("user_api_keys", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // openai, anthropic, github, kimi-k2, etc.
  keyName: text("key_name").notNull(), // friendly name for the key
  encryptedKey: text("encrypted_key").notNull(), // AES-256 encrypted API key
  keyHash: text("key_hash").notNull(), // SHA-256 hash for verification
  encryptionIv: text("encryption_iv").notNull(), // Initialization vector for encryption
  isActive: boolean("is_active").default(true),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_user_api_keys_user").on(table.userId),
  index("idx_user_api_keys_provider").on(table.provider),
]);

// Kimi K2 Configuration and Usage Tracking with Enhanced Security
export const kimiK2Configs = pgTable("kimi_k2_configs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  apiKeyEncrypted: text("api_key_encrypted").notNull(), // AES-256 encrypted
  apiKeyHash: text("api_key_hash").notNull(), // SHA-256 hash for verification
  encryptionIv: text("encryption_iv").notNull(), // Initialization vector
  modelPreferences: jsonb("model_preferences").default('{"model": "kimi-k2-instruct", "temperature": 0.6}'),
  costLimits: jsonb("cost_limits").default('{"dailyLimit": 100, "monthlyLimit": 1000}'),
  usageStats: jsonb("usage_stats").default('{"tokensUsed": 0, "costAccumulated": 0}'),
  agenticFeatures: jsonb("agentic_features").default('{"toolCalling": true, "autonomousExecution": true}'),
  multilingualSettings: jsonb("multilingual_settings").default('{"primaryLanguage": "en", "supportedLanguages": ["en", "hi", "ta", "te", "bn"]}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 3D AI Assistants System
export const avatar3DAssistants = pgTable("avatar_3d_assistants", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  avatarConfig: jsonb("avatar_config").notNull(), // 3D avatar appearance and style
  personalityPrompt: text("personality_prompt"),
  knowledgeBases: jsonb("knowledge_bases").default('[]'), // array of knowledge base IDs
  languages: jsonb("languages").default('["en"]'), // supported languages
  voiceProfile: jsonb("voice_profile").default('{"provider": "elevenlabs", "voiceId": "default", "emotionRange": "full"}'),
  immersiveFeatures: jsonb("immersive_features").default('["3d-avatar", "voice-synthesis", "spatial-audio"]'),
  llmProvider: text("llm_provider").default("kimi-k2"), // primary LLM for this assistant
  isActive: boolean("is_active").default(true),
  usageCount: integer("usage_count").default(0),
  averageResponseTime: integer("average_response_time").default(0), // milliseconds
  userRating: integer("user_rating"), // 1-5 stars
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Immersive Experiences (AR/VR/WebXR)
export const immersiveExperiences = pgTable("immersive_experiences", {
  id: serial("id").primaryKey(),
  assistantId: integer("assistant_id").references(() => avatar3DAssistants.id),
  name: varchar("name", { length: 255 }).notNull(),
  experienceType: varchar("experience_type", { length: 50 }).notNull(), // 'ar', 'vr', 'web3d', 'game'
  sceneConfig: jsonb("scene_config").notNull(), // Three.js scene configuration
  interactionMap: jsonb("interaction_map").default('{}'), // user interaction mappings
  spatialElements: jsonb("spatial_elements").default('[]'), // 3D objects and positions
  voiceCommands: jsonb("voice_commands").default('[]'), // voice interaction commands
  performanceMetrics: jsonb("performance_metrics").default('{"fps": 60, "renderTime": 16}'),
  deploymentTargets: jsonb("deployment_targets").default('["web"]'), // web, mobile, headset
  webXRSupport: boolean("webxr_support").default(true),
  gameEngineIntegration: jsonb("game_engine_integration").default('[]'), // unity, unreal, godot
  isPublished: boolean("is_published").default(false),
  accessCount: integer("access_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI Game Builder Platform - Core Tables
export const gameProjects = pgTable("game_projects", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  organizationId: integer("organization_id").references(() => organizations.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(), // mental-health, kids, seniors, mind-games, creative
  gameType: varchar("game_type", { length: 50 }).notNull(), // 2d-puzzle, 2d-platformer, 3d-adventure, therapeutic, educational
  targetDemographic: jsonb("target_demographic").default('[]'), // ["mental-health", "kids", "seniors", "women"]
  
  // Game Configuration
  gameConfig: jsonb("game_config").notNull(), // Visual editor settings, mechanics, rules
  sceneData: jsonb("scene_data").default('{}'), // 2D/3D scene configuration
  assetLibrary: jsonb("asset_library").default('[]'), // AI-generated assets metadata
  gameLogic: jsonb("game_logic").default('{}'), // Visual scripting nodes, behaviors
  
  // AI Generation Settings
  aiProviders: jsonb("ai_providers").default('{"graphics": "scenario", "audio": "elevenlabs", "music": "beatoven"}'),
  generationPrompts: jsonb("generation_prompts").default('{}'), // AI prompts for asset generation
  styleGuide: jsonb("style_guide").default('{}'), // Consistent art style settings
  
  // Therapeutic/Educational Features
  therapeuticObjectives: jsonb("therapeutic_objectives").default('[]'), // stress-relief, cognitive-training, mindfulness
  educationalGoals: jsonb("educational_goals").default('[]'), // learning objectives for educational games
  accessibilityFeatures: jsonb("accessibility_features").default('[]'), // large-ui, simple-controls, audio-cues
  
  // Game Status and Publishing
  status: varchar("status", { length: 50 }).default("draft"), // draft, building, testing, published, archived
  buildProgress: integer("build_progress").default(0), // 0-100 percentage
  lastBuildAt: timestamp("last_build_at"),
  isPublished: boolean("is_published").default(false),
  publishedUrl: text("published_url"),
  embedCode: text("embed_code"),
  
  // Monetization
  monetizationEnabled: boolean("monetization_enabled").default(false),
  adNetworks: jsonb("ad_networks").default('[]'), // enabled ad networks
  tournamentEnabled: boolean("tournament_enabled").default(false),
  
  // Analytics
  playCount: integer("play_count").default(0),
  averageSessionTime: integer("average_session_time").default(0), // seconds
  userRating: integer("user_rating"), // 1-5 stars
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Game Assets - AI Generated Content
export const gameAssets = pgTable("game_assets", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").references(() => gameProjects.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id).notNull(),
  assetType: varchar("asset_type", { length: 50 }).notNull(), // sprite, texture, model, animation, sound, music
  assetName: varchar("asset_name", { length: 255 }).notNull(),
  assetUrl: text("asset_url").notNull(),
  fileSize: integer("file_size"), // bytes
  dimensions: jsonb("dimensions"), // {width, height} for images
  aiProvider: varchar("ai_provider", { length: 50 }), // scenario, elevenlabs, beatoven, etc.
  generationPrompt: text("generation_prompt"),
  metadata: jsonb("metadata").default('{}'),
  isActive: boolean("is_active").default(true),
  downloadCount: integer("download_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Game Templates & Presets
export const gameTemplates = pgTable("game_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(),
  targetDemographic: jsonb("target_demographic").default('[]'),
  thumbnailUrl: text("thumbnail_url"),
  gameConfig: jsonb("game_config").notNull(), // Base configuration
  isActive: boolean("is_active").default(true),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// WAI DevSphere Enhancement Roadmap Tracking System
export const roadmapPhases = pgTable("roadmap_phases", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  phase: varchar("phase", { length: 50 }).notNull(), // foundation, enhancement, optimization
  quarter: varchar("quarter", { length: 10 }).notNull(), // Q3-2025, Q4-2025, Q1-2026
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: varchar("status", { length: 50 }).default("planned"), // planned, in_progress, completed, delayed, cancelled
  priority: varchar("priority", { length: 20 }).default("medium"), // low, medium, high, critical
  budget: integer("budget"), // in USD cents
  actualCost: integer("actual_cost").default(0),
  progressPercentage: integer("progress_percentage").default(0),
  dependencies: jsonb("dependencies").default('[]'), // array of phase IDs
  deliverables: jsonb("deliverables").default('[]'),
  risks: jsonb("risks").default('[]'),
  milestones: jsonb("milestones").default('[]'),
  teamMembers: jsonb("team_members").default('[]'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const roadmapFeatures = pgTable("roadmap_features", {
  id: serial("id").primaryKey(),
  phaseId: integer("phase_id").references(() => roadmapPhases.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(), // performance, llm-routing, database, ui-enhancement
  technology: varchar("technology", { length: 100 }), // gpt-5, claude-code, mcp, testsprite, x-design
  platform: varchar("platform", { length: 100 }), // code-studio, analytics, enterprise, agent-workspace, ai-assistant-builder
  estimatedWeeks: integer("estimated_weeks").default(1),
  actualWeeks: integer("actual_weeks"),
  status: varchar("status", { length: 50 }).default("planned"), // planned, in_progress, testing, completed, blocked
  priority: varchar("priority", { length: 20 }).default("medium"),
  complexity: varchar("complexity", { length: 20 }).default("medium"), // simple, medium, complex, expert
  dependencies: jsonb("dependencies").default('[]'), // array of feature IDs
  assignedAgents: jsonb("assigned_agents").default('[]'), // array of agent types
  requiredLLMs: jsonb("required_llms").default('[]'), // array of LLM providers needed
  integrationTargets: jsonb("integration_targets").default('[]'), // WAI orchestration components to integrate with
  testingCriteria: jsonb("testing_criteria").default('[]'),
  performanceMetrics: jsonb("performance_metrics").default('{}'), // expected performance improvements
  implementationNotes: text("implementation_notes"),
  blockingIssues: jsonb("blocking_issues").default('[]'),
  completionDate: timestamp("completion_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  phaseFeatureIndex: index("phase_feature_idx").on(table.phaseId, table.status),
  technologyIndex: index("technology_idx").on(table.technology),
  platformIndex: index("platform_idx").on(table.platform),
}));

export const roadmapIntegrations = pgTable("roadmap_integrations", {
  id: serial("id").primaryKey(),
  featureId: integer("feature_id").references(() => roadmapFeatures.id, { onDelete: "cascade" }),
  platformId: varchar("platform_id", { length: 100 }).notNull(), // code-studio, analytics, etc.
  integrationLevel: varchar("integration_level", { length: 50 }).notNull(), // wai-orchestration, standalone, hybrid
  waiComponents: jsonb("wai_components").default('[]'), // WAI orchestration components involved
  apiEndpoints: jsonb("api_endpoints").default('[]'), // new API endpoints created
  databaseChanges: jsonb("database_changes").default('[]'), // schema changes made
  agentEnhancements: jsonb("agent_enhancements").default('[]'), // agent modifications
  llmProviderChanges: jsonb("llm_provider_changes").default('[]'), // LLM routing changes
  userFlowImpact: jsonb("user_flow_impact").default('[]'), // how user flows are affected
  performanceImpact: jsonb("performance_impact").default('{}'), // resource usage changes
  integrationStatus: varchar("integration_status", { length: 50 }).default("planned"), // planned, in_progress, testing, completed, failed
  testResults: jsonb("test_results").default('{}'),
  rollbackPlan: text("rollback_plan"),
  integrationDate: timestamp("integration_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  featurePlatformIndex: index("feature_platform_idx").on(table.featureId, table.platformId),
}));

// Enhanced LLM Provider Management System - Matches actual database structure
export const llmProviders = pgTable("llm_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`), // UUID generation
  name: text("name").notNull(),
  status: text("status").notNull().default('active'),
  baseUrl: text("base_url"),
  apiKeyRequired: boolean("api_key_required").notNull().default(true),
  models: jsonb("models").notNull().default('[]'),
  latencyMs: integer("latency_ms").notNull().default(0),
  successRate: numeric("success_rate").notNull().default('99.00'),
  costPerToken: numeric("cost_per_token"),
  description: text("description"),
  type: text("type").default('language-model'),
  costTier: text("cost_tier").default('medium'),
  documentation: text("documentation"),
  capabilities: jsonb("capabilities").default('[]'),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
}, (table) => ({
  statusIndex: index("llm_providers_status_idx").on(table.status),
  nameIndex: index("llm_providers_name_idx").on(table.name),
}));

// LLM Provider schemas for validation
export const llmProviderInsertSchema = createInsertSchema(llmProviders, {
  name: z.string().min(1, "Provider name is required").max(255),
  description: z.string().optional(),
  type: z.enum(["language-model", "image-model", "code-model", "multimodal"]).default("language-model"),
  costTier: z.enum(["free", "low", "medium", "high", "premium"]).default("medium"),
  documentation: z.string().url().optional().or(z.literal("")),
  baseUrl: z.string().url().optional().or(z.literal("")),
  models: z.array(z.any()).default([]),
  capabilities: z.array(z.string()).default([]),
  latencyMs: z.number().int().min(0).default(100),
  successRate: z.number().min(0).max(100).default(99),
  costPerToken: z.number().min(0).optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export type LlmProviderInsert = z.infer<typeof llmProviderInsertSchema>;
export type LlmProviderSelect = typeof llmProviders.$inferSelect;

// On-Demand Agent Loading System - Legacy table for existing data  
export const agentLoadingSystem = pgTable("agent_loading_system", {
  id: serial("id").primaryKey(),
  agentId: varchar("agent_id", { length: 100 }).notNull().unique(),
  agentType: varchar("agent_type", { length: 100 }).notNull(), // development, creative, analysis, etc.
  loadingStrategy: varchar("loading_strategy", { length: 50 }).default("on_demand"), // startup, on_demand, lazy, cached
  memoryUsage: integer("memory_usage"), // MB
  cpuUsage: integer("cpu_usage"), // percentage
  initializationTime: integer("initialization_time"), // milliseconds
  lastUsed: timestamp("last_used"),
  usageFrequency: integer("usage_frequency").default(0),
  keepAliveTime: integer("keep_alive_time").default(300), // seconds to keep in memory
  dependencies: jsonb("dependencies").default('[]'), // other agents or services needed
  resourceLimits: jsonb("resource_limits").default('{}'), // memory, CPU limits
  isLoaded: boolean("is_loaded").default(false),
  loadCount: integer("load_count").default(0),
  unloadCount: integer("unload_count").default(0),
  averageSessionTime: integer("average_session_time"), // seconds
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  agentTypeIndex: index("agent_type_idx").on(table.agentType, table.isLoaded),
  loadingStrategyIndex: index("loading_strategy_idx").on(table.loadingStrategy),
  usageFrequencyIndex: index("usage_frequency_idx").on(table.usageFrequency),
}));

// Performance Monitoring and Resource Optimization - Legacy table for existing data
export const performanceMetrics = pgTable("performance_metrics", {
  id: serial("id").primaryKey(),
  metricType: varchar("metric_type", { length: 50 }).notNull(), // cpu, memory, response_time, throughput
  component: varchar("component", { length: 100 }).notNull(), // agent, service, llm_provider, database
  componentId: varchar("component_id", { length: 100 }),
  value: text("value").notNull(),
  unit: varchar("unit", { length: 20 }).notNull(), // percentage, milliseconds, MB, requests/second
  threshold: text("threshold"), // warning threshold
  criticalThreshold: text("critical_threshold"),
  timestamp: timestamp("timestamp").defaultNow(),
  tags: jsonb("tags").default('{}'), // additional metadata
  environment: varchar("environment", { length: 50 }).default("production"),
}, (table) => ({
  metricComponentIndex: index("metric_component_idx").on(table.metricType, table.component, table.timestamp),
  timestampIndex: index("timestamp_idx").on(table.timestamp),
}));

// Tournament & Leaderboard System
export const gameTournaments = pgTable("game_tournaments", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").references(() => gameProjects.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  maxParticipants: integer("max_participants"),
  entryFee: integer("entry_fee").default(0), // in cents
  prizePool: integer("prize_pool").default(0), // in cents
  tournamentType: varchar("tournament_type", { length: 50 }).default("single-elimination"),
  status: varchar("status", { length: 50 }).default("upcoming"), // upcoming, active, completed, cancelled
  rules: jsonb("rules").default('{}'),
  leaderboard: jsonb("leaderboard").default('[]'),
  totalPlayers: integer("total_players").default(0),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Game Analytics & Performance
export const gameAnalytics = pgTable("game_analytics", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").references(() => gameProjects.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id),
  sessionId: varchar("session_id", { length: 255 }),
  
  // Play Session Data
  sessionDuration: integer("session_duration"), // seconds
  levelCompleted: integer("level_completed"),
  score: integer("score"),
  actions: jsonb("actions").default('[]'), // user actions during session
  
  // Therapeutic/Educational Metrics
  therapeuticMetrics: jsonb("therapeutic_metrics").default('{}'), // stress reduction, focus improvement
  learningProgress: jsonb("learning_progress").default('{}'), // educational objectives met
  
  // Device & Location
  deviceType: varchar("device_type", { length: 50 }), // desktop, mobile, tablet
  platform: varchar("platform", { length: 50 }), // web, ios, android
  location: varchar("location", { length: 100 }),
  
  // Engagement Metrics
  clickCount: integer("click_count").default(0),
  pauseCount: integer("pause_count").default(0),
  quitReason: varchar("quit_reason", { length: 100 }),
  
  playedAt: timestamp("played_at").defaultNow(),
});

// Monetization & Revenue Tracking
export const gameRevenue = pgTable("game_revenue", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").references(() => gameProjects.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Revenue Sources
  revenueType: varchar("revenue_type", { length: 50 }).notNull(), // ads, iap, tournament, licensing
  adNetwork: varchar("ad_network", { length: 50 }), // adsense, unity-ads, gamedistribution
  amount: integer("amount").notNull(), // in cents
  currency: varchar("currency", { length: 10 }).default("USD"),
  
  // Transaction Details
  transactionId: varchar("transaction_id", { length: 255 }),
  paymentStatus: varchar("payment_status", { length: 50 }).default("completed"),
  platformFee: integer("platform_fee").default(0), // platform commission in cents
  netAmount: integer("net_amount").notNull(), // amount after fees
  
  // Metadata
  metadata: jsonb("metadata").default('{}'),
  processedAt: timestamp("processed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// 3D Avatar Asset Management
export const avatar3DAssets = pgTable("avatar_3d_assets", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  assistantId: integer("assistant_id").references(() => avatar3DAssistants.id),
  assetType: varchar("asset_type", { length: 50 }).notNull(), // model, texture, animation, voice
  fileName: varchar("file_name", { length: 255 }).notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size"), // bytes
  metadata: jsonb("metadata").default('{}'), // format, dimensions, etc.
  isActive: boolean("is_active").default(true),
  downloadCount: integer("download_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Settings and Preferences
export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  theme: text("theme").default("dark"), // light, dark, system
  language: text("language").default("en"),
  timezone: text("timezone").default("UTC"),
  emailNotifications: boolean("email_notifications").default(true),
  slackNotifications: boolean("slack_notifications").default(false),
  webhookUrl: text("webhook_url"),
  defaultLlmProvider: text("default_llm_provider").default("openai"),
  maxConcurrentProjects: integer("max_concurrent_projects").default(3),
  preferences: jsonb("preferences").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscription Plans Definition
export const subscriptionPlans = pgTable("subscription_plans", {
  id: text("id").primaryKey(), // alpha, beta, gamma, enterprise
  name: text("name").notNull(),
  displayName: text("display_name").notNull(),
  description: text("description").notNull(),
  price: text("price").notNull(), // "0" for free, "49" for paid
  currency: text("currency").default("USD"),
  billingCycle: text("billing_cycle").notNull(), // monthly, yearly
  features: jsonb("features").notNull(), // JSON array of features
  limits: jsonb("limits").notNull(), // JSON object with usage limits
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Onboarding Progress
export const userOnboarding = pgTable("user_onboarding", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  currentStep: integer("current_step").default(1),
  completedSteps: jsonb("completed_steps").default('[]'), // array of completed step numbers
  planSelected: boolean("plan_selected").default(false),
  apiKeysConfigured: boolean("api_keys_configured").default(false),
  firstProjectCreated: boolean("first_project_created").default(false),
  profileCompleted: boolean("profile_completed").default(false),
  invitesSent: integer("invites_sent").default(0),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Project Templates System
export const projectTemplates = pgTable("project_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // web, mobile, analytics, ai, automation
  type: text("type").notNull(), // full-stack-website, analytics-dashboard, voice-assistant, etc.
  technologies: jsonb("technologies").notNull(), // Array of tech stack
  features: jsonb("features").notNull(), // Array of features
  sourceCode: jsonb("source_code").notNull(), // Complete source code structure
  configuration: jsonb("configuration").notNull(), // Default configuration
  requirements: jsonb("requirements").notNull(), // System requirements
  complexity: integer("complexity").notNull().default(3), // 1-5 scale
  estimatedTime: text("estimated_time"), // Development time estimate
  thumbnail: text("thumbnail"),
  screenshots: jsonb("screenshots").default('[]'),
  tags: jsonb("tags").default('[]'),
  isActive: boolean("is_active").default(true),
  downloadCount: integer("download_count").default(0),
  rating: integer("rating").default(5),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enhanced Project Management System - Main Projects Table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  templateId: integer("template_id").references(() => projectTemplates.id), // If created from template
  organizationId: integer("organization_id").references(() => organizations.id),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  status: text("status").notNull().default("planning"), // planning, requirements_analysis, development, testing, deployment, completed, paused, cancelled
  priority: text("priority").notNull().default("medium"), // low, medium, high, critical
  visibility: text("visibility").notNull().default("private"), // private, team, organization, public
  
  // Analysis and Planning
  requirements: jsonb("requirements"), // Original requirements and uploaded files
  analysis: jsonb("analysis"), // AI-generated analysis
  actionPlan: jsonb("action_plan"), // Step-by-step action plan
  techStack: jsonb("tech_stack"), // Selected technologies
  architecture: jsonb("architecture"), // System architecture
  
  // Development Configuration
  configuration: jsonb("configuration"), // Project configuration
  environment: jsonb("environment"), // Environment variables and settings
  deploymentConfig: jsonb("deployment_config"), // Deployment settings
  
  // Progress Tracking
  progress: integer("progress").default(0), // Progress percentage (0-100)
  estimatedHours: integer("estimated_hours"),
  actualHours: integer("actual_hours").default(0),
  startDate: timestamp("start_date"),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  
  // AI Context Management
  aiContext: jsonb("ai_context"), // Current AI context and memory
  chatHistory: jsonb("chat_history").default('[]'), // Chat history with AI
  
  // Metadata
  tags: jsonb("tags").default('[]'),
  metadata: jsonb("metadata").default('{}'),
  isArchived: boolean("is_archived").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// SDLC Workflow Templates
export const sdlcWorkflowTemplates = pgTable("sdlc_workflow_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // planning, development, testing, deployment, maintenance
  phase: text("phase").notNull(), // requirements, design, implementation, testing, deployment, maintenance
  description: text("description").notNull(),
  complexity: text("complexity").notNull(), // simple, moderate, complex, enterprise
  estimatedDuration: integer("estimated_duration").notNull(), // in minutes
  teamSize: text("team_size").notNull(),
  technologies: jsonb("technologies").notNull().default('[]'),
  deliverables: jsonb("deliverables").notNull().default('[]'),
  prerequisites: jsonb("prerequisites").notNull().default('[]'),
  successCriteria: jsonb("success_criteria").notNull().default('[]'),
  riskMitigation: jsonb("risk_mitigation").notNull().default('[]'),
  steps: jsonb("steps").notNull(), // Detailed workflow steps
  isActive: boolean("is_active").default(true),
  version: text("version").default("1.0"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// SDLC Workflow Executions
export const sdlcWorkflowExecutions = pgTable("sdlc_workflow_executions", {
  id: serial("id").primaryKey(),
  executionId: text("execution_id").notNull().unique(), // Unique execution identifier
  templateId: integer("template_id").references(() => sdlcWorkflowTemplates.id).notNull(),
  templateName: text("template_name").notNull(),
  projectId: integer("project_id").references(() => projects.id),
  userId: varchar("user_id").references(() => users.id).notNull(),
  organizationId: integer("organization_id").references(() => organizations.id),
  
  // Execution State
  status: text("status").notNull().default("pending"), // pending, running, paused, completed, failed, cancelled
  progress: jsonb("progress").notNull().default('{"completedSteps": 0, "totalSteps": 0, "currentStep": null, "estimatedCompletion": null}'),
  currentStepId: text("current_step_id"),
  customizations: jsonb("customizations").default('{}'),
  
  // Execution Results
  outputs: jsonb("outputs").default('{}'), // Step outputs and deliverables
  executionLog: jsonb("execution_log").default('[]'), // Detailed execution log
  errors: jsonb("errors").default('[]'), // Any errors encountered
  
  // Timing
  startedAt: timestamp("started_at"),
  pausedAt: timestamp("paused_at"),
  completedAt: timestamp("completed_at"),
  estimatedCompletionAt: timestamp("estimated_completion_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// GitHub Integration - Real repository management
export const githubRepositories = pgTable("github_repositories", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // GitHub Repository Details
  githubRepoId: text("github_repo_id").notNull(), // GitHub repository ID
  repoName: text("repo_name").notNull(),
  repoUrl: text("repo_url").notNull(),
  cloneUrl: text("clone_url").notNull(),
  defaultBranch: text("default_branch").default("main"),
  
  // Synchronization Status
  lastSyncAt: timestamp("last_sync_at"),
  syncStatus: text("sync_status").default("pending"), // pending, syncing, synced, error
  syncErrors: jsonb("sync_errors").default('[]'),
  
  // Repository Configuration
  autoSync: boolean("auto_sync").default(true),
  branches: jsonb("branches").default('[]'), // Tracked branches
  webhookId: text("webhook_id"), // GitHub webhook ID for real-time updates
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Database Ecosystem - Real database connections
export const databaseConnections = pgTable("database_connections", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  userId: varchar("user_id").references(() => users.id).notNull(),
  organizationId: integer("organization_id").references(() => organizations.id),
  
  // Connection Details
  name: text("name").notNull(),
  type: text("type").notNull(), // postgresql, mysql, mongodb, sqlite, neon, supabase, planetscale
  connectionString: text("connection_string"), // Encrypted connection string
  host: text("host"),
  port: integer("port"),
  database: text("database"),
  username: text("username"),
  
  // Connection Status
  status: text("status").default("pending"), // pending, connected, error, disconnected
  lastPing: timestamp("last_ping"),
  connectionErrors: jsonb("connection_errors").default('[]'),
  
  // Schema Information
  schema: jsonb("schema").default('{}'), // Database schema
  tables: jsonb("tables").default('[]'), // Table information
  lastSchemaSync: timestamp("last_schema_sync"),
  
  // Sync Configuration
  autoSync: boolean("auto_sync").default(false),
  syncRules: jsonb("sync_rules").default('{}'), // Sync rules and configurations
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enterprise Integration Hub - Real API connections
export const enterpriseIntegrations = pgTable("enterprise_integrations", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Integration Details
  name: text("name").notNull(),
  type: text("type").notNull(), // salesforce, hubspot, pipedrive, sap, netsuite, mailchimp, etc.
  category: text("category").notNull(), // crm, erp, marketing, communication, cloud, analytics
  
  // Authentication
  credentials: jsonb("credentials"), // Encrypted API credentials
  authType: text("auth_type").notNull(), // oauth2, api_key, basic_auth, jwt
  accessToken: text("access_token"), // Encrypted access token
  refreshToken: text("refresh_token"), // Encrypted refresh token
  expiresAt: timestamp("expires_at"),
  
  // Integration Status
  status: text("status").default("pending"), // pending, connected, error, expired
  lastSync: timestamp("last_sync"),
  syncErrors: jsonb("sync_errors").default('[]'),
  
  // Configuration
  config: jsonb("config").default('{}'), // Integration-specific configuration
  fieldMappings: jsonb("field_mappings").default('{}'), // Field mapping configuration
  syncRules: jsonb("sync_rules").default('{}'), // Synchronization rules
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Workflow Automation - Real workflow executions
export const workflowAutomationTemplates = pgTable("workflow_automation_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // data_processing, customer_service, marketing, hr, finance
  description: text("description").notNull(),
  complexity: text("complexity").notNull(), // simple, moderate, complex
  estimatedTime: integer("estimated_time").notNull(), // in minutes
  tags: jsonb("tags").default('[]'),
  
  // Workflow Definition
  triggers: jsonb("triggers").notNull(), // Workflow triggers
  steps: jsonb("steps").notNull(), // Workflow steps
  config: jsonb("config").default('{}'), // Workflow configuration
  
  // Template Metadata
  usageCount: integer("usage_count").default(0),
  rating: integer("rating").default(5),
  isPublic: boolean("is_public").default(false),
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Workflow Executions
export const workflowExecutions = pgTable("workflow_executions", {
  id: serial("id").primaryKey(),
  executionId: text("execution_id").notNull().unique(),
  templateId: integer("template_id").references(() => workflowAutomationTemplates.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  organizationId: integer("organization_id").references(() => organizations.id),
  
  // Execution State
  status: text("status").notNull().default("pending"), // pending, running, completed, failed, cancelled
  triggeredBy: text("triggered_by").notNull(), // manual, scheduled, webhook, event
  triggerData: jsonb("trigger_data").default('{}'),
  
  // Progress Tracking
  currentStep: integer("current_step").default(0),
  totalSteps: integer("total_steps").notNull(),
  stepResults: jsonb("step_results").default('[]'),
  errors: jsonb("errors").default('[]'),
  
  // Timing
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  duration: integer("duration"), // in milliseconds
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Project Collaborators and Permissions
export const projectCollaborators = pgTable("project_collaborators", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: text("role").notNull().default("collaborator"), // owner, maintainer, collaborator, viewer
  permissions: jsonb("permissions").default('["read", "comment"]'), // read, write, comment, deploy, admin
  invitedBy: integer("invited_by").references(() => users.id),
  invitedAt: timestamp("invited_at").defaultNow(),
  acceptedAt: timestamp("accepted_at"),
  isActive: boolean("is_active").default(true),
}, (table) => ({
  projectUserIndex: index("project_user_idx").on(table.projectId, table.userId),
}));

// Chat and Communication System
export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  sessionName: text("session_name"),
  type: text("type").notNull().default("ai_chat"), // ai_chat, team_chat, agent_communication
  isActive: boolean("is_active").default(true),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => chatSessions.id).notNull(),
  userId: varchar("user_id").references(() => users.id), // null for AI messages
  agentType: text("agent_type"), // For AI/agent messages (cto, developer, qa, etc.)
  content: jsonb("content").notNull(), // Message content with support for text, images, files
  messageType: text("message_type").notNull().default("text"), // text, image, file, code, system, action_plan
  metadata: jsonb("metadata").default('{}'), // Additional message data
  parentMessageId: integer("parent_message_id"), // For threaded conversations
  isEdited: boolean("is_edited").default(false),
  editedAt: timestamp("edited_at"),
  reactions: jsonb("reactions").default('{}'), // User reactions
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  sessionMessageIndex: index("session_message_idx").on(table.sessionId, table.createdAt),
}));

// Action Planning and Task Management
export const actionPlans = pgTable("action_plans", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  version: integer("version").notNull().default(1),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("draft"), // draft, approved, in_progress, completed, cancelled
  estimatedDuration: text("estimated_duration"),
  phases: jsonb("phases").notNull(), // Array of development phases
  tasks: jsonb("tasks").notNull(), // Detailed task breakdown
  dependencies: jsonb("dependencies").default('[]'), // Task dependencies
  risks: jsonb("risks").default('[]'), // Identified risks and mitigation
  resources: jsonb("resources").default('[]'), // Required resources
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enhanced Task Management
export const taskCategories = pgTable("task_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").default("#3B82F6"),
  icon: text("icon").default("folder"),
  organizationId: integer("organization_id").references(() => organizations.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const fileUploads = pgTable("file_uploads", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  path: text("path").notNull(),
  analysis: jsonb("analysis"), // File analysis results
  createdAt: timestamp("created_at").defaultNow(),
});

// Alias for compatibility
export const projectFiles = fileUploads;

export const agentExecutions = pgTable("agent_executions", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  agentType: text("agent_type").notNull(),
  taskDescription: text("task_description").notNull(),
  status: text("status").notNull().default("pending"),
  result: jsonb("result"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const agentSessions = pgTable("agent_sessions", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  agentType: text("agent_type").notNull(), // cto, cpo, cmo, bmad-orchestrator, etc.
  status: text("status").notNull().default("active"), // active, idle, error, completed
  currentTask: text("current_task"),
  metadata: jsonb("metadata"), // Agent-specific data
  lastActivity: timestamp("last_activity").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  actionPlanId: integer("action_plan_id").references(() => actionPlans.id),
  categoryId: integer("category_id").references(() => taskCategories.id),
  agentSessionId: integer("agent_session_id").references(() => agentSessions.id),
  
  // Basic Task Information
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("todo"), // todo, in_progress, review, testing, completed, failed, blocked
  priority: text("priority").notNull().default("medium"), // low, medium, high, critical, urgent
  type: text("type").notNull().default("development"), // development, design, testing, deployment, analysis, research, review
  
  // Assignment and Ownership
  assignedTo: integer("assigned_to").references(() => users.id), // Human assignee
  assignedAgent: text("assigned_agent"), // AI agent responsible (cto, developer, qa, etc.)
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  
  // Task Relationships
  parentTaskId: integer("parent_task_id"), // For subtasks
  dependencies: jsonb("dependencies").default('[]'), // Array of task IDs this depends on
  blockedBy: jsonb("blocked_by").default('[]'), // What's blocking this task
  
  // Time Management
  estimatedTime: integer("estimated_time"), // In minutes
  actualTime: integer("actual_time").default(0), // In minutes
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  dueDate: timestamp("due_date"),
  
  // Technical Details
  techStack: jsonb("tech_stack").default('[]'), // Technologies involved
  codeChanges: jsonb("code_changes"), // Code changes made
  testResults: jsonb("test_results"), // Testing results
  deploymentInfo: jsonb("deployment_info"), // Deployment details
  
  // Results and Feedback
  result: jsonb("result"), // Task completion result and artifacts
  feedback: text("feedback"), // Human feedback on task
  aiAnalysis: jsonb("ai_analysis"), // AI analysis of task completion
  qualityScore: integer("quality_score"), // 1-10 quality rating
  
  // Metadata
  tags: jsonb("tags").default('[]'),
  attachments: jsonb("attachments").default('[]'), // File attachments
  notes: text("notes"), // Additional notes
  metadata: jsonb("metadata").default('{}'),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  projectStatusIndex: index("task_project_status_idx").on(table.projectId, table.status),
  assigneeIndex: index("task_assignee_idx").on(table.assignedTo),
  agentIndex: index("task_agent_idx").on(table.assignedAgent),
}));

export const deployments = pgTable("deployments", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  platform: text("platform").notNull(), // aws, gcp, azure, custom
  status: text("status").notNull().default("pending"), // pending, deploying, deployed, failed
  url: text("url"), // Deployment URL
  configuration: jsonb("configuration"), // Deployment config
  logs: text("logs").array(), // Deployment logs
  createdAt: timestamp("created_at").defaultNow(),
  deployedAt: timestamp("deployed_at"),
});

export const metrics = pgTable("metrics", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id),
  agentType: text("agent_type"),
  metricType: text("metric_type").notNull(), // cost, performance, efficiency, etc.
  value: text("value").notNull(), // JSON string for complex values
  timestamp: timestamp("timestamp").defaultNow(),
});

// Database Relations
export const userRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  organizations: many(userOrganizations),
  collaborations: many(projectCollaborators),
  chatSessions: many(chatSessions),
  chatMessages: many(chatMessages),
  tasksCreated: many(tasks, { relationName: "creator" }),
  tasksAssigned: many(tasks, { relationName: "assignee" }),
}));

export const organizationRelations = relations(organizations, ({ many }) => ({
  users: many(userOrganizations),
  projects: many(projects),
  taskCategories: many(taskCategories),
}));

export const projectRelations = relations(projects, ({ one, many }) => ({
  creator: one(users, { fields: [projects.createdBy], references: [users.id] }),
  organization: one(organizations, { fields: [projects.organizationId], references: [organizations.id] }),
  template: one(projectTemplates, { fields: [projects.templateId], references: [projectTemplates.id] }),
  collaborators: many(projectCollaborators),
  fileUploads: many(fileUploads),
  agentSessions: many(agentSessions),
  tasks: many(tasks),
  deployments: many(deployments),
  chatSessions: many(chatSessions),
  actionPlans: many(actionPlans),
  metrics: many(metrics),
}));

export const taskRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, { fields: [tasks.projectId], references: [projects.id] }),
  creator: one(users, { fields: [tasks.createdBy], references: [users.id], relationName: "creator" }),
  assignee: one(users, { fields: [tasks.assignedTo], references: [users.id], relationName: "assignee" }),
  category: one(taskCategories, { fields: [tasks.categoryId], references: [taskCategories.id] }),
  actionPlan: one(actionPlans, { fields: [tasks.actionPlanId], references: [actionPlans.id] }),
  agentSession: one(agentSessions, { fields: [tasks.agentSessionId], references: [agentSessions.id] }),
  parentTask: one(tasks, { fields: [tasks.parentTaskId], references: [tasks.id], relationName: "parentTask" }),
  subtasks: many(tasks, { relationName: "parentTask" }),
}));

// Enhanced Zod Schemas with Security Updates
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  username: true,
  firstName: true,
  lastName: true,
  passwordHash: true,
  passwordSalt: true,
  googleId: true,
  profileImage: true,
  role: true,
}).extend({
  password: z.string().min(8).optional(), // Plain password for input validation
  confirmPassword: z.string().optional(),
}).refine((data) => !data.password || data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  description: true,
  templateId: true,
  organizationId: true,
  createdBy: true,
  priority: true,
  visibility: true,
  requirements: true,
  techStack: true,
  estimatedHours: true,
  dueDate: true,
  tags: true,
});

export const insertProjectTemplateSchema = createInsertSchema(projectTemplates).pick({
  name: true,
  description: true,
  category: true,
  type: true,
  technologies: true,
  features: true,
  sourceCode: true,
  configuration: true,
  requirements: true,
  complexity: true,
  estimatedTime: true,
  tags: true,
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  projectId: true,
  actionPlanId: true,
  categoryId: true,
  title: true,
  description: true,
  priority: true,
  type: true,
  assignedTo: true,
  assignedAgent: true,
  parentTaskId: true,
  dependencies: true,
  estimatedTime: true,
  dueDate: true,
  techStack: true,
  tags: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  sessionId: true,
  userId: true,
  agentType: true,
  content: true,
  messageType: true,
  metadata: true,
  parentMessageId: true,
});

export const insertActionPlanSchema = createInsertSchema(actionPlans).pick({
  projectId: true,
  title: true,
  description: true,
  estimatedDuration: true,
  phases: true,
  tasks: true,
  dependencies: true,
  risks: true,
  resources: true,
});

// ============================================================================
// WAI ORCHESTRATION TABLES - Production Ready
// ============================================================================

// LLM Provider Configuration
export const llmProviderConfig = pgTable("llm_provider_config", {
  id: serial("id").primaryKey(),
  providerId: text("provider_id").notNull().unique(),
  enabled: boolean("enabled").default(false),
  apiKey: text("api_key"), // Encrypted
  models: jsonb("models").default('[]'),
  defaultModel: text("default_model"),
  priority: integer("priority").default(10),
  costPerToken: numeric("cost_per_token", { precision: 10, scale: 8 }).default('0.00001'),
  dailyLimit: numeric("daily_limit", { precision: 10, scale: 2 }).default('100'),
  monthlyLimit: numeric("monthly_limit", { precision: 10, scale: 2 }).default('3000'),
  alertThreshold: integer("alert_threshold").default(80),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// LLM Cost Tracking
export const llmCostTracking = pgTable("llm_cost_tracking", {
  id: serial("id").primaryKey(),
  requestId: text("request_id").notNull(),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  cost: numeric("cost", { precision: 10, scale: 6 }).notNull(),
  tokensUsed: integer("tokens_used").notNull(),
  responseTime: integer("response_time"), // milliseconds
  status: text("status").notNull().default("success"), // success, error, timeout
  userId: varchar("user_id").references(() => users.id),
  projectId: integer("project_id").references(() => projects.id),
  timestamp: timestamp("timestamp").defaultNow(),
});



// Enhanced Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertProjectTemplate = z.infer<typeof insertProjectTemplateSchema>;
export type ProjectTemplate = typeof projectTemplates.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type ChatSession = typeof chatSessions.$inferSelect;

export type InsertActionPlan = z.infer<typeof insertActionPlanSchema>;
export type ActionPlan = typeof actionPlans.$inferSelect;

export type Organization = typeof organizations.$inferSelect;
export type UserOrganization = typeof userOrganizations.$inferSelect;
export type ProjectCollaborator = typeof projectCollaborators.$inferSelect;
export type TaskCategory = typeof taskCategories.$inferSelect;

// Assistant Schema
export const insertAssistantSchema = createInsertSchema(avatar3DAssistants).pick({
  name: true,
  description: true,
  personalityPrompt: true,
  knowledgeBases: true,
  avatarConfig: true,
  llmProvider: true,
  languages: true,
  voiceProfile: true,
  immersiveFeatures: true,
});

export const insertFileUploadSchema = createInsertSchema(fileUploads).pick({
  projectId: true,
  originalName: true,
  mimeType: true,
  size: true,
  path: true,
  analysis: true,
});

export const insertAgentExecutionSchema = createInsertSchema(agentExecutions).pick({
  projectId: true,
  agentType: true,
  taskDescription: true,
  status: true,
  result: true,
});

export type InsertFileUpload = z.infer<typeof insertFileUploadSchema>;
export type FileUpload = typeof fileUploads.$inferSelect;

export type InsertAgentExecution = z.infer<typeof insertAgentExecutionSchema>;
export type AgentExecution = typeof agentExecutions.$inferSelect;

export const insertDeploymentSchema = createInsertSchema(deployments).pick({
  projectId: true,
  platform: true,
  status: true,
  url: true,
  configuration: true,
});

export type InsertDeployment = z.infer<typeof insertDeploymentSchema>;
export type Deployment = typeof deployments.$inferSelect;
export type AgentSession = typeof agentSessions.$inferSelect;
export type Metric = typeof metrics.$inferSelect;

// Enhanced types for the application
export interface ProjectAnalysis {
  type: 'prd' | 'brd' | 'figma' | 'image' | 'code' | 'other';
  summary: string;
  requirements: string[];
  technologies: string[];
  complexity: 'simple' | 'medium' | 'complex' | 'enterprise';
  estimatedTimeline: string;
  recommendedAgents: string[];
  architecture: {
    frontend: string[];
    backend: string[];
    database: string[];
    deployment: string[];
  };
}

export interface AgentStatus {
  id: string;
  type: string;
  status: 'active' | 'idle' | 'error' | 'completed';
  currentTask?: string;
  progress?: number;
  lastActivity: Date;
  metadata?: any;
}

export interface PerformanceMetrics {
  costToday: number;
  budgetUsed: number;
  agentEfficiency: Record<string, number>;
  estimatedCompletion: {
    days: number;
    hours: number;
  };
}

// Export types for new enterprise tables
export type SDLCWorkflowTemplate = typeof sdlcWorkflowTemplates.$inferSelect;
export type InsertSDLCWorkflowTemplate = typeof sdlcWorkflowTemplates.$inferInsert;

export type SDLCWorkflowExecution = typeof sdlcWorkflowExecutions.$inferSelect;
export type InsertSDLCWorkflowExecution = typeof sdlcWorkflowExecutions.$inferInsert;

export type GitHubRepository = typeof githubRepositories.$inferSelect;
export type InsertGitHubRepository = typeof githubRepositories.$inferInsert;

export type DatabaseConnection = typeof databaseConnections.$inferSelect;
export type InsertDatabaseConnection = typeof databaseConnections.$inferInsert;

export type EnterpriseIntegration = typeof enterpriseIntegrations.$inferSelect;
export type InsertEnterpriseIntegration = typeof enterpriseIntegrations.$inferInsert;

export type WorkflowAutomationTemplate = typeof workflowAutomationTemplates.$inferSelect;
export type InsertWorkflowAutomationTemplate = typeof workflowAutomationTemplates.$inferInsert;

export type WorkflowExecution = typeof workflowExecutions.$inferSelect;
export type InsertWorkflowExecution = typeof workflowExecutions.$inferInsert;

// Export types for user management tables
export type UserApiKey = typeof userApiKeys.$inferSelect;
export type InsertUserApiKey = typeof userApiKeys.$inferInsert;

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;

export type UserOnboarding = typeof userOnboarding.$inferSelect;
export type InsertUserOnboarding = typeof userOnboarding.$inferInsert;

// Game Builder Schema Types
export const insertGameProjectSchema = createInsertSchema(gameProjects).pick({
  userId: true,
  organizationId: true,
  name: true,
  description: true,
  category: true,
  gameType: true,
  targetDemographic: true,
  gameConfig: true,
  sceneData: true,
  assetLibrary: true,
  gameLogic: true,
  aiProviders: true,
  generationPrompts: true,
  styleGuide: true,
  therapeuticObjectives: true,
  educationalGoals: true,
  accessibilityFeatures: true,
  monetizationEnabled: true,
  adNetworks: true,
  tournamentEnabled: true,
});

export const insertGameAssetSchema = createInsertSchema(gameAssets).pick({
  gameId: true,
  userId: true,
  assetType: true,
  assetName: true,
  assetUrl: true,
  fileSize: true,
  dimensions: true,
  aiProvider: true,
  generationPrompt: true,
  metadata: true,
});

export const insertGameTemplateSchema = createInsertSchema(gameTemplates).pick({
  name: true,
  description: true,
  category: true,
  targetDemographic: true,
  thumbnailUrl: true,
  gameConfig: true,
});

// Game Builder Types
export type InsertGameProject = z.infer<typeof insertGameProjectSchema>;
export type GameProject = typeof gameProjects.$inferSelect;
export type InsertGameAsset = z.infer<typeof insertGameAssetSchema>;
export type GameAsset = typeof gameAssets.$inferSelect;
export type InsertGameTemplate = z.infer<typeof insertGameTemplateSchema>;
export type GameTemplate = typeof gameTemplates.$inferSelect;
export type GameTournament = typeof gameTournaments.$inferSelect;
export type GameAnalytics = typeof gameAnalytics.$inferSelect;
export type GameRevenue = typeof gameRevenue.$inferSelect;

// Game Builder Interface Types
export interface GameBuilderConfig {
  canvasSize: { width: number; height: number };
  gameType: '2d' | '3d';
  renderEngine: 'canvas' | 'webgl';
  physics: boolean;
  audio: boolean;
}

export interface GameAssetRequest {
  type: 'sprite' | 'texture' | 'sound' | 'music' | 'animation';
  description: string;
  style?: string;
  dimensions?: { width: number; height: number };
  duration?: number; // for audio assets
}

export interface TherapeuticGameData {
  stressReduction: number; // 0-100 scale
  focusImprovement: number;
  moodBoost: number;
  cognitiveBenefit: number;
  engagementScore: number;
}

// WAI SDK v3.0 - Insert Schemas and Types
export const insertWaiMessagingChannelSchema = createInsertSchema(waiMessagingChannels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertWaiMessagingMessageSchema = createInsertSchema(waiMessagingMessages).omit({
  id: true,
  createdAt: true,
});
export const insertWaiDigitalTwinSchema = createInsertSchema(waiDigitalTwins).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertWaiDigitalTwinBehaviorSchema = createInsertSchema(waiDigitalTwinBehaviors).omit({
  id: true,
  createdAt: true,
});
export const insertWaiAutomationRuleSchema = createInsertSchema(waiAutomationRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertWaiPromptVersionSchema = createInsertSchema(waiPromptVersions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertWaiAlertRuleSchema = createInsertSchema(waiAlertRules).omit({
  id: true,
  createdAt: true,
});
export const insertWaiAlertSchema = createInsertSchema(waiAlerts).omit({
  id: true,
  createdAt: true,
});

// WAI SDK v3.0 - Insert Types
export type InsertWaiMessagingChannel = z.infer<typeof insertWaiMessagingChannelSchema>;
export type InsertWaiMessagingMessage = z.infer<typeof insertWaiMessagingMessageSchema>;
export type InsertWaiDigitalTwin = z.infer<typeof insertWaiDigitalTwinSchema>;
export type InsertWaiDigitalTwinBehavior = z.infer<typeof insertWaiDigitalTwinBehaviorSchema>;
export type InsertWaiAutomationRule = z.infer<typeof insertWaiAutomationRuleSchema>;
export type InsertWaiPromptVersion = z.infer<typeof insertWaiPromptVersionSchema>;
export type InsertWaiAlertRule = z.infer<typeof insertWaiAlertRuleSchema>;
export type InsertWaiAlert = z.infer<typeof insertWaiAlertSchema>;

// WAI SDK v3.0 - Email Automation Insert Schemas
export const insertWaiEmailAccountSchema = createInsertSchema(waiEmailAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertWaiEmailSchema = createInsertSchema(waiEmails).omit({
  id: true,
  createdAt: true,
});
export const insertWaiEmailProcessingSchema = createInsertSchema(waiEmailProcessing).omit({
  id: true,
  createdAt: true,
});
export const insertWaiEmailAutomationRuleSchema = createInsertSchema(waiEmailAutomationRules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertWaiEmailResponseSchema = createInsertSchema(waiEmailResponses).omit({
  id: true,
  createdAt: true,
});

// WAI SDK v3.0 - Voice Agent Insert Schemas
export const insertWaiVoiceAgentSchema = createInsertSchema(waiVoiceAgents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertWaiVoiceCallSchema = createInsertSchema(waiVoiceCalls).omit({
  id: true,
  createdAt: true,
});

// WAI SDK v3.0 - Document Intelligence Insert Schemas
export const insertWaiDocumentSchema = createInsertSchema(waiDocuments).omit({
  id: true,
  createdAt: true,
});
export const insertWaiDocumentChunkSchema = createInsertSchema(waiDocumentChunks).omit({
  id: true,
  createdAt: true,
});

// WAI SDK v3.0 - Orchestration Insert Schemas
export const insertWaiOrchestrationTaskSchema = createInsertSchema(waiOrchestrationTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertWaiAgentExecutionSchema = createInsertSchema(waiAgentExecutions).omit({
  id: true,
  createdAt: true,
});

// WAI SDK v3.0 - Integration & Workflow Insert Schemas
export const insertWaiIntegrationConfigSchema = createInsertSchema(waiIntegrationConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertWaiWorkflowSchema = createInsertSchema(waiWorkflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertWaiWorkflowExecutionSchema = createInsertSchema(waiWorkflowExecutions).omit({
  id: true,
  createdAt: true,
});

// WAI SDK v3.0 - Email Automation Insert Types
export type InsertWaiEmailAccount = z.infer<typeof insertWaiEmailAccountSchema>;
export type InsertWaiEmail = z.infer<typeof insertWaiEmailSchema>;
export type InsertWaiEmailProcessing = z.infer<typeof insertWaiEmailProcessingSchema>;
export type InsertWaiEmailAutomationRule = z.infer<typeof insertWaiEmailAutomationRuleSchema>;
export type InsertWaiEmailResponse = z.infer<typeof insertWaiEmailResponseSchema>;

// WAI SDK v3.0 - Voice Agent Insert Types
export type InsertWaiVoiceAgent = z.infer<typeof insertWaiVoiceAgentSchema>;
export type InsertWaiVoiceCall = z.infer<typeof insertWaiVoiceCallSchema>;

// WAI SDK v3.0 - Document Intelligence Insert Types
export type InsertWaiDocument = z.infer<typeof insertWaiDocumentSchema>;
export type InsertWaiDocumentChunk = z.infer<typeof insertWaiDocumentChunkSchema>;

// WAI SDK v3.0 - Orchestration Insert Types
export type InsertWaiOrchestrationTask = z.infer<typeof insertWaiOrchestrationTaskSchema>;
export type InsertWaiAgentExecution = z.infer<typeof insertWaiAgentExecutionSchema>;

// WAI SDK v3.0 - Integration & Workflow Insert Types
export type InsertWaiIntegrationConfig = z.infer<typeof insertWaiIntegrationConfigSchema>;
export type InsertWaiWorkflow = z.infer<typeof insertWaiWorkflowSchema>;
export type InsertWaiWorkflowExecution = z.infer<typeof insertWaiWorkflowExecutionSchema>;

// WAI SDK v3.0 - Select Types
export type WaiMessagingChannel = typeof waiMessagingChannels.$inferSelect;
export type WaiMessagingMessage = typeof waiMessagingMessages.$inferSelect;
export type WaiDigitalTwin = typeof waiDigitalTwins.$inferSelect;
export type WaiDigitalTwinBehavior = typeof waiDigitalTwinBehaviors.$inferSelect;
export type WaiAutomationRule = typeof waiAutomationRules.$inferSelect;
export type WaiPromptVersion = typeof waiPromptVersions.$inferSelect;
export type WaiAlertRule = typeof waiAlertRules.$inferSelect;
export type WaiAlert = typeof waiAlerts.$inferSelect;

// WAI SDK v3.0 - Email Automation Select Types
export type WaiEmailAccount = typeof waiEmailAccounts.$inferSelect;
export type WaiEmail = typeof waiEmails.$inferSelect;
export type WaiEmailProcessing = typeof waiEmailProcessing.$inferSelect;
export type WaiEmailAutomationRule = typeof waiEmailAutomationRules.$inferSelect;
export type WaiEmailResponse = typeof waiEmailResponses.$inferSelect;

// WAI SDK v3.0 - Voice Agent Select Types
export type WaiVoiceAgent = typeof waiVoiceAgents.$inferSelect;
export type WaiVoiceCall = typeof waiVoiceCalls.$inferSelect;

// WAI SDK v3.0 - Document Intelligence Select Types
export type WaiDocument = typeof waiDocuments.$inferSelect;
export type WaiDocumentChunk = typeof waiDocumentChunks.$inferSelect;

// WAI SDK v3.0 - Orchestration Select Types
export type WaiOrchestrationTask = typeof waiOrchestrationTasks.$inferSelect;
export type WaiAgentExecution = typeof waiAgentExecutions.$inferSelect;

// WAI SDK v3.0 - Integration & Workflow Select Types
export type WaiIntegrationConfig = typeof waiIntegrationConfigs.$inferSelect;
export type WaiWorkflow = typeof waiWorkflows.$inferSelect;
export type WaiWorkflowExecution = typeof waiWorkflowExecutions.$inferSelect;

// Business Solutions Schema
export const businessSolutions = pgTable("business_solutions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  organizationId: integer("organization_id").references(() => organizations.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(), // crm, hr, finance, supply-chain, analytics, automation
  industry: varchar("industry", { length: 100 }).notNull(),
  businessSize: varchar("business_size", { length: 50 }).notNull(), // startup, small, medium, enterprise
  
  // Solution Configuration
  features: jsonb("features").default('[]'),
  integrations: jsonb("integrations").default('[]'),
  configuration: jsonb("configuration").default('{}'),
  
  // Implementation Details
  status: varchar("status", { length: 50 }).default("draft"), // draft, implementing, testing, deployed, archived
  implementationProgress: integer("implementation_progress").default(0), // 0-100 percentage
  estimatedImplementationTime: integer("estimated_implementation_time"), // in hours
  actualImplementationTime: integer("actual_implementation_time").default(0),
  
  // Business Value
  businessValue: text("business_value"),
  expectedROI: integer("expected_roi"), // percentage
  actualROI: integer("actual_roi"), // percentage
  kpiMetrics: jsonb("kpi_metrics").default('{}'),
  
  // Deployment
  isDeployed: boolean("is_deployed").default(false),
  deploymentUrl: text("deployment_url"),
  deploymentEnvironment: varchar("deployment_environment", { length: 50 }).default("staging"),
  
  // Analytics
  usageCount: integer("usage_count").default(0),
  lastUsed: timestamp("last_used"),
  userSatisfactionScore: integer("user_satisfaction_score"), // 1-10
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBusinessSolutionSchema = createInsertSchema(businessSolutions).pick({
  name: true,
  description: true,
  category: true,
  industry: true,
  businessSize: true,
  features: true,
  integrations: true,
  estimatedImplementationTime: true,
  businessValue: true,
  expectedROI: true,
});

export type InsertBusinessSolution = z.infer<typeof insertBusinessSolutionSchema>;
export type BusinessSolution = typeof businessSolutions.$inferSelect;

// Content Management System Tables

// Content Versions - Track all versions of content
export const contentVersions = pgTable("content_versions", {
  id: serial("id").primaryKey(),
  contentId: text("content_id").notNull(), // Original content ID
  userId: varchar("user_id").references(() => users.id),
  version: integer("version").notNull().default(1),
  contentType: text("content_type").notNull(), // image, video, audio, text, etc.
  contentData: jsonb("content_data").notNull(), // Actual content data
  metadata: jsonb("metadata").default('{}'), // Additional metadata
  changeLog: text("change_log"), // Description of changes
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  contentVersionIndex: index("content_version_idx").on(table.contentId, table.version),
}));

// Content Collaborators - Manage who can collaborate on content
export const contentCollaborators = pgTable("content_collaborators", {
  id: serial("id").primaryKey(),
  contentId: text("content_id").notNull(),
  userId: varchar("user_id").references(() => users.id),
  permissions: jsonb("permissions").default('["view", "comment"]'), // view, edit, approve, publish
  role: text("role").default("viewer"), // owner, editor, reviewer, viewer
  invitedBy: integer("invited_by").references(() => users.id),
  acceptedAt: timestamp("accepted_at"),
  lastActiveAt: timestamp("last_active_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  contentUserIndex: index("content_collab_idx").on(table.contentId, table.userId),
}));

// Content Scheduling - Schedule content for future publication
export const contentScheduling = pgTable("content_scheduling", {
  id: serial("id").primaryKey(),
  contentId: text("content_id").notNull(),
  userId: varchar("user_id").references(() => users.id),
  scheduledFor: timestamp("scheduled_for").notNull(),
  publishTo: jsonb("publish_to").default('[]'), // Array of platforms to publish to
  publishSettings: jsonb("publish_settings").default('{}'), // Platform-specific settings
  status: text("status").default("scheduled"), // scheduled, publishing, published, failed
  publishedAt: timestamp("published_at"),
  errorLog: text("error_log"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  scheduleStatusIndex: index("schedule_status_idx").on(table.scheduledFor, table.status),
}));

// Content Analytics Enhanced - Track content performance (Phase 3)
export const contentAnalyticsEnhanced = pgTable("content_analytics_enhanced", {
  id: serial("id").primaryKey(),
  contentId: text("content_id").notNull(),
  platform: text("platform").notNull(), // platform where content was shared
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  shares: integer("shares").default(0),
  comments: integer("comments").default(0),
  downloads: integer("downloads").default(0),
  engagementRate: text("engagement_rate"), // Calculated engagement percentage
  reachData: jsonb("reach_data").default('{}'), // Detailed reach metrics
  demographicData: jsonb("demographic_data").default('{}'), // Audience demographics
  performanceScore: integer("performance_score"), // AI-calculated performance score
  aiInsights: jsonb("ai_insights"), // AI-generated insights about performance
  recordedAt: timestamp("recorded_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  contentAnalyticsEnhancedIndex: index("content_analytics_enhanced_idx").on(table.contentId, table.recordedAt),
}));

// Content Comments - For collaboration and feedback
export const contentComments = pgTable("content_comments", {
  id: serial("id").primaryKey(),
  contentId: text("content_id").notNull(),
  userId: varchar("user_id").references(() => users.id),
  parentId: integer("parent_id"), // For threaded comments
  comment: text("comment").notNull(),
  attachments: jsonb("attachments").default('[]'),
  resolved: boolean("resolved").default(false),
  resolvedBy: integer("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Content Publishing History
export const contentPublishingHistory = pgTable("content_publishing_history", {
  id: serial("id").primaryKey(),
  contentId: text("content_id").notNull(),
  versionId: integer("version_id").references(() => contentVersions.id),
  publishedBy: integer("published_by").references(() => users.id),
  publishedTo: jsonb("published_to").notNull(), // Array of platforms
  publishUrl: text("publish_url"),
  publishMetadata: jsonb("publish_metadata").default('{}'),
  status: text("status").notNull(), // success, failed, pending
  publishedAt: timestamp("published_at").defaultNow(),
});

// AI Assistant Schema and Types
export const insertAvatar3DAssistantSchema = createInsertSchema(avatar3DAssistants).pick({
  userId: true,
  name: true,
  description: true,
  avatarConfig: true,
  personalityPrompt: true,
  knowledgeBases: true,
  languages: true,
  voiceProfile: true,
  immersiveFeatures: true,
  llmProvider: true,
  isActive: true,
});

export type InsertAvatar3DAssistant = z.infer<typeof insertAvatar3DAssistantSchema>;
export type Avatar3DAssistant = typeof avatar3DAssistants.$inferSelect;

// Export new content management types
export type ContentVersion = typeof contentVersions.$inferSelect;
export type InsertContentVersion = typeof contentVersions.$inferInsert;

export type ContentCollaborator = typeof contentCollaborators.$inferSelect;
export type InsertContentCollaborator = typeof contentCollaborators.$inferInsert;

export type ContentSchedule = typeof contentScheduling.$inferSelect;
export type InsertContentSchedule = typeof contentScheduling.$inferInsert;

export type ContentAnalytic = typeof contentAnalytics.$inferSelect;
export type InsertContentAnalytic = typeof contentAnalytics.$inferInsert;

export type ContentComment = typeof contentComments.$inferSelect;
export type InsertContentComment = typeof contentComments.$inferInsert;

export type ContentPublishingHistoryRecord = typeof contentPublishingHistory.$inferSelect;
export type InsertContentPublishingHistory = typeof contentPublishingHistory.$inferInsert;

// ============================================================================
// WAI SDK v7.0 ENHANCED SCHEMA ADDITIONS
// ============================================================================

// V7.0 Enhanced Orchestration Requests
export const waiOrchestrationRequestsV7 = pgTable("wai_orchestration_requests_v7", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id),
  requestType: text("request_type").notNull(), // development, creative, analysis, enterprise, research, multimodal
  task: text("task").notNull(),
  priority: text("priority").notNull().default("medium"), // low, medium, high, critical, emergency
  userPlan: text("user_plan").notNull().default("alpha"), // alpha, beta, gamma, enterprise
  budget: text("budget").default("balanced"), // cost-effective, balanced, quality, premium
  
  // V7.0 Enhanced Features
  enhancedFeatures: jsonb("enhanced_features").default('{}'), // Claude routing, MCP support, BMAD planning, etc.
  costOptimizationTarget: numeric("cost_optimization_target", { precision: 3, scale: 2 }).default("0.85"), // 85% cost reduction target
  accuracyTarget: numeric("accuracy_target", { precision: 3, scale: 2 }).default("0.26"), // 26% accuracy improvement target
  
  // UI Generation Context
  uiGenerationContext: jsonb("ui_generation_context").default('{}'), // Screenshot, website URL, design system
  
  // Request Context and Metadata
  context: jsonb("context").default('{}'),
  requiredComponents: jsonb("required_components").default('[]'),
  timeout: integer("timeout").default(30000), // milliseconds
  metadata: jsonb("metadata").default('{}'),
  
  // Status and Results
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  result: jsonb("result"),
  error: text("error"),
  
  // Timing
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  executionTime: integer("execution_time"), // milliseconds
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userTypeIndex: index("wai_v7_user_type_idx").on(table.userId, table.requestType),
  statusIndex: index("wai_v7_status_idx").on(table.status),
  priorityIndex: index("wai_v7_priority_idx").on(table.priority),
}));

// V7.0 Enhanced Orchestration Responses
export const waiOrchestrationResponsesV7 = pgTable("wai_orchestration_responses_v7", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id").references(() => waiOrchestrationRequestsV7.id).notNull(),
  
  // Base Response Data
  success: boolean("success").notNull(),
  result: jsonb("result"),
  componentsUsed: jsonb("components_used").default('[]'),
  performanceMetrics: jsonb("performance_metrics").default('{}'),
  
  // V7.0 Enhanced Results
  enhancedResults: jsonb("enhanced_results").default('{}'), // Cost reduction, accuracy improvement, etc.
  v7Metrics: jsonb("v7_metrics").default('{}'), // New capabilities used, enhancement level, etc.
  
  // Cost and Performance
  costReductionAchieved: numeric("cost_reduction_achieved", { precision: 5, scale: 4 }), // Actual cost reduction
  accuracyImprovement: numeric("accuracy_improvement", { precision: 5, scale: 4 }), // Actual accuracy improvement
  
  executionTime: integer("execution_time").notNull(), // milliseconds
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  requestIndex: index("wai_v7_response_request_idx").on(table.requestId),
  successIndex: index("wai_v7_response_success_idx").on(table.success),
}));

// V7.0 Enhanced Insert Schemas
export const insertWaiOrchestrationRequestV7Schema = createInsertSchema(waiOrchestrationRequestsV7).pick({
  userId: true,
  requestType: true,
  task: true,
  priority: true,
  userPlan: true,
  budget: true,
  enhancedFeatures: true,
  costOptimizationTarget: true,
  accuracyTarget: true,
  uiGenerationContext: true,
  context: true,
  requiredComponents: true,
  timeout: true,
  metadata: true,
});

// V7.0 Enhanced Types
export type InsertWaiOrchestrationRequestV7 = z.infer<typeof insertWaiOrchestrationRequestV7Schema>;
export type WaiOrchestrationRequestV7 = typeof waiOrchestrationRequestsV7.$inferSelect;
export type WaiOrchestrationResponseV7 = typeof waiOrchestrationResponsesV7.$inferSelect;

// ============================================================================
// WAI SDK v1.0 COMPREHENSIVE STORAGE & RAG SYSTEM SCHEMA
// ============================================================================

// Knowledge Base System Tables
export const knowledgeBases = pgTable("knowledge_bases", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: integer("owner_id").references(() => users.id).notNull(),
  organizationId: integer("organization_id").references(() => organizations.id),
  type: text("type").notNull().default("personal"), // personal, team, organization, public
  status: text("status").notNull().default("active"), // active, inactive, archiving, archived
  settings: jsonb("settings").default('{}'),
  statistics: jsonb("statistics").default('{}'),
  permissions: jsonb("permissions").default('{}'),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastIndexedAt: timestamp("last_indexed_at"),
}, (table) => [
  index("idx_knowledge_bases_owner").on(table.ownerId),
  index("idx_knowledge_bases_org").on(table.organizationId),
  index("idx_knowledge_bases_type").on(table.type),
  index("idx_knowledge_bases_status").on(table.status),
]);

export const kbDocuments = pgTable("kb_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  knowledgeBaseId: uuid("knowledge_base_id").references(() => knowledgeBases.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  content: text("content"),
  documentType: text("document_type").notNull(),
  filePath: text("file_path"),
  url: text("url"),
  metadata: jsonb("metadata").default('{}'),
  version: integer("version").default(1),
  status: text("status").default("processing"), // processing, active, archived, failed
  embeddings: jsonb("embeddings").default('[]'), // Array of vector IDs
  tags: jsonb("tags").default('[]'),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastAccessedAt: timestamp("last_accessed_at"),
  wordCount: integer("word_count").default(0),
  characterCount: integer("character_count").default(0),
  language: text("language").default("en"),
  checksum: text("checksum"),
}, (table) => [
  index("idx_kb_documents_kb").on(table.knowledgeBaseId),
  index("idx_kb_documents_status").on(table.status),
  index("idx_kb_documents_type").on(table.documentType),
  index("idx_kb_documents_created_by").on(table.createdBy),
  index("idx_kb_documents_updated").on(table.updatedAt),
]);

export const kbDocumentChunks = pgTable("kb_document_chunks", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentId: uuid("document_id").references(() => kbDocuments.id, { onDelete: "cascade" }).notNull(),
  chunkIndex: integer("chunk_index").notNull(),
  content: text("content").notNull(),
  tokenCount: integer("token_count").default(0),
  embedding: jsonb("embedding"), // Store as JSON array for compatibility
  metadata: jsonb("metadata").default('{}'),
  startPosition: integer("start_position"),
  endPosition: integer("end_position"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_kb_chunks_document").on(table.documentId),
  index("idx_kb_chunks_index").on(table.chunkIndex),
]);

export const kbEmbeddings = pgTable("kb_embeddings", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentId: uuid("document_id").references(() => kbDocuments.id, { onDelete: "cascade" }).notNull(),
  chunkId: uuid("chunk_id").references(() => kbDocumentChunks.id, { onDelete: "cascade" }),
  embeddingModel: text("embedding_model").notNull(),
  embedding: jsonb("embedding").notNull(), // Vector stored as JSON array
  contentHash: text("content_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_kb_embeddings_document").on(table.documentId),
  index("idx_kb_embeddings_chunk").on(table.chunkId),
  index("idx_kb_embeddings_model").on(table.embeddingModel),
]);

// Vector Database Tables
export const vectorCollections = pgTable("vector_collections", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  dimension: integer("dimension").notNull(),
  metric: text("metric").default("cosine"), // cosine, euclidean, dot_product
  indexType: text("index_type").default("hnsw"),
  metadata: jsonb("metadata").default('{}'),
  documentCount: integer("document_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_vector_collections_name").on(table.name),
  index("idx_vector_collections_dimension").on(table.dimension),
]);

export const vectorIndex = pgTable("vector_index", {
  id: uuid("id").defaultRandom().primaryKey(),
  collectionId: uuid("collection_id").references(() => vectorCollections.id, { onDelete: "cascade" }).notNull(),
  vector: jsonb("vector").notNull(), // Vector stored as JSON array
  metadata: jsonb("metadata").default('{}'),
  documentReference: text("document_reference"),
  namespace: text("namespace"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_vector_index_collection").on(table.collectionId),
  index("idx_vector_index_namespace").on(table.namespace),
  index("idx_vector_index_document").on(table.documentReference),
]);

// Document Processing Tables
export const documentProcessingQueue = pgTable("document_processing_queue", {
  id: uuid("id").defaultRandom().primaryKey(),
  filePath: text("file_path").notNull(),
  processingType: text("processing_type").notNull(),
  status: text("status").default("pending"), // pending, processing, completed, failed
  priority: integer("priority").default(5),
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("idx_doc_processing_status").on(table.status),
  index("idx_doc_processing_priority").on(table.priority),
  index("idx_doc_processing_created").on(table.createdAt),
]);

export const documentProcessingResults = pgTable("document_processing_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  queueId: uuid("queue_id").references(() => documentProcessingQueue.id, { onDelete: "cascade" }).notNull(),
  extractedText: text("extracted_text"),
  extractedMetadata: jsonb("extracted_metadata").default('{}'),
  processingTimeMs: integer("processing_time_ms"),
  success: boolean("success").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_doc_results_queue").on(table.queueId),
  index("idx_doc_results_success").on(table.success),
]);

// RAG System Tables
export const ragQueries = pgTable("rag_queries", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  sessionId: text("session_id"),
  query: text("query").notNull(),
  knowledgeBaseIds: jsonb("knowledge_base_ids").default('[]'),
  context: jsonb("context").default('{}'),
  options: jsonb("options").default('{}'),
  response: text("response"),
  sources: jsonb("sources").default('[]'),
  confidence: numeric("confidence", { precision: 3, scale: 2 }),
  qualityScore: numeric("quality_score", { precision: 3, scale: 2 }),
  retrievalTime: integer("retrieval_time_ms"),
  generationTime: integer("generation_time_ms"),
  totalTime: integer("total_time_ms"),
  strategy: text("strategy"),
  tokensUsed: integer("tokens_used"),
  cost: numeric("cost", { precision: 8, scale: 6 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_rag_queries_user").on(table.userId),
  index("idx_rag_queries_session").on(table.sessionId),
  index("idx_rag_queries_created").on(table.createdAt),
  index("idx_rag_queries_strategy").on(table.strategy),
]);

export const ragConversations = pgTable("rag_conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: text("session_id").notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  turn: integer("turn").notNull(),
  role: text("role").notNull(), // user, assistant, system
  content: text("content").notNull(),
  metadata: jsonb("metadata").default('{}'),
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => [
  index("idx_rag_conversations_session").on(table.sessionId),
  index("idx_rag_conversations_user").on(table.userId),
  index("idx_rag_conversations_timestamp").on(table.timestamp),
]);

export const ragMetrics = pgTable("rag_metrics", {
  id: serial("id").primaryKey(),
  activeQueries: integer("active_queries").default(0),
  activeSessions: integer("active_sessions").default(0),
  averageResponseTime: integer("average_response_time"),
  averageQualityScore: numeric("average_quality_score", { precision: 3, scale: 2 }),
  totalQueries: integer("total_queries").default(0),
  successfulQueries: integer("successful_queries").default(0),
  failedQueries: integer("failed_queries").default(0),
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => [
  index("idx_rag_metrics_timestamp").on(table.timestamp),
]);

// Search Analytics Tables
export const searchAnalytics = pgTable("search_analytics", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  knowledgeBaseId: uuid("knowledge_base_id").references(() => knowledgeBases.id),
  query: text("query").notNull(),
  resultCount: integer("result_count").default(0),
  clickedResults: jsonb("clicked_results").default('[]'),
  searchTime: integer("search_time_ms"),
  searchMethod: text("search_method"), // semantic, keyword, hybrid
  userFeedback: text("user_feedback"), // helpful, not_helpful, irrelevant
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => [
  index("idx_search_analytics_user").on(table.userId),
  index("idx_search_analytics_kb").on(table.knowledgeBaseId),
  index("idx_search_analytics_timestamp").on(table.timestamp),
  index("idx_search_analytics_method").on(table.searchMethod),
]);

// Knowledge Base Schema Types and Zod Schemas
export const insertKnowledgeBaseSchema = createInsertSchema(knowledgeBases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastIndexedAt: true,
});

export const insertKbDocumentSchema = createInsertSchema(kbDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastAccessedAt: true,
});

export const insertVectorCollectionSchema = createInsertSchema(vectorCollections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRAGQuerySchema = createInsertSchema(ragQueries).omit({
  id: true,
  createdAt: true,
});

// Export types for Knowledge Base System
export type KnowledgeBase = typeof knowledgeBases.$inferSelect;
export type InsertKnowledgeBase = z.infer<typeof insertKnowledgeBaseSchema>;

export type KbDocument = typeof kbDocuments.$inferSelect;
export type InsertKbDocument = z.infer<typeof insertKbDocumentSchema>;

export type KbDocumentChunk = typeof kbDocumentChunks.$inferSelect;
export type InsertKbDocumentChunk = typeof kbDocumentChunks.$inferInsert;

export type KbEmbedding = typeof kbEmbeddings.$inferSelect;
export type InsertKbEmbedding = typeof kbEmbeddings.$inferInsert;

export type VectorCollection = typeof vectorCollections.$inferSelect;
export type InsertVectorCollection = z.infer<typeof insertVectorCollectionSchema>;

export type VectorIndexEntry = typeof vectorIndex.$inferSelect;
export type InsertVectorIndexEntry = typeof vectorIndex.$inferInsert;

export type DocumentProcessingQueue = typeof documentProcessingQueue.$inferSelect;
export type InsertDocumentProcessingQueue = typeof documentProcessingQueue.$inferInsert;

export type DocumentProcessingResult = typeof documentProcessingResults.$inferSelect;
export type InsertDocumentProcessingResult = typeof documentProcessingResults.$inferInsert;

export type RAGQuery = typeof ragQueries.$inferSelect;
export type InsertRAGQuery = z.infer<typeof insertRAGQuerySchema>;

export type RAGConversation = typeof ragConversations.$inferSelect;
export type InsertRAGConversation = typeof ragConversations.$inferInsert;

export type RAGMetrics = typeof ragMetrics.$inferSelect;
export type InsertRAGMetrics = typeof ragMetrics.$inferInsert;

export type SearchAnalytics = typeof searchAnalytics.$inferSelect;
export type InsertSearchAnalytics = typeof searchAnalytics.$inferInsert;

// ============================================================================
// WAI SDK v1.0 COMPREHENSIVE AGENT SYSTEM SCHEMA
// Complete 105+ Agent Ecosystem with Real Capabilities
// ============================================================================

// Agent Catalog - Complete registry of all 105+ agents
export const agentCatalog = pgTable("agent_catalog", {
  id: uuid("id").defaultRandom().primaryKey(),
  agentId: text("agent_id").notNull().unique(), // unique identifier like 'queen-orchestrator', 'bmad-analyst'
  name: text("name").notNull(),
  displayName: text("display_name").notNull(),
  description: text("description").notNull(),
  
  // Tier Classification
  tier: text("tier").notNull(), // executive, development, creative, qa, devops, specialist
  category: text("category").notNull(), // orchestration, analysis, architecture, development, testing, monitoring
  specialization: text("specialization").notNull(), // frontend, backend, fullstack, ai-ml, security, etc.
  
  // Agent Capabilities
  capabilities: jsonb("capabilities").notNull().default('[]'), // Array of capability strings
  skillset: jsonb("skillset").notNull().default('[]'), // Technical skills and expertise
  taskTypes: jsonb("task_types").notNull().default('[]'), // Types of tasks agent can handle
  
  // System Configuration
  systemPrompt: text("system_prompt").notNull(),
  preferredModels: jsonb("preferred_models").notNull().default('["kimi", "anthropic", "openai"]'),
  modelConfig: jsonb("model_config").default('{}'),
  
  // Coordination & Communication
  coordinationPattern: text("coordination_pattern").notNull().default("parallel"), // hierarchical, mesh, sequential, parallel
  collaboratesWithAgents: jsonb("collaborates_with_agents").default('[]'),
  dependsOnAgents: jsonb("depends_on_agents").default('[]'),
  outputForAgents: jsonb("output_for_agents").default('[]'),
  
  // Quality & Performance Metrics
  baselineMetrics: jsonb("baseline_metrics").default('{}'),
  performanceTargets: jsonb("performance_targets").default('{}'),
  
  // Agent Runtime Configuration
  runtimeConfig: jsonb("runtime_config").default('{}'),
  resourceRequirements: jsonb("resource_requirements").default('{}'),
  
  // Workflow Patterns
  workflowPatterns: jsonb("workflow_patterns").default('[]'), // BMAD, Hive-Mind, Parallel, etc.
  executionContext: jsonb("execution_context").default('{}'),
  
  // Status and Availability
  status: text("status").notNull().default("active"), // active, inactive, maintenance, deprecated
  isAvailable: boolean("is_available").default(true),
  version: text("version").notNull().default("1.0.0"),
  
  // Metadata
  tags: jsonb("tags").default('[]'),
  metadata: jsonb("metadata").default('{}'),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_agent_catalog_tier").on(table.tier),
  index("idx_agent_catalog_category").on(table.category),
  index("idx_agent_catalog_specialization").on(table.specialization),
  index("idx_agent_catalog_status").on(table.status),
  index("idx_agent_catalog_agent_id").on(table.agentId),
]);

// Agent Instances - Running instances of agents
export const agentInstances = pgTable("agent_instances", {
  id: uuid("id").defaultRandom().primaryKey(),
  instanceId: text("instance_id").notNull().unique(),
  agentId: text("agent_id").references(() => agentCatalog.agentId).notNull(),
  
  // Instance Configuration
  customConfig: jsonb("custom_config").default('{}'),
  runtimeOverrides: jsonb("runtime_overrides").default('{}'),
  
  // Status and Health
  status: text("status").notNull().default("initializing"), // initializing, running, idle, error, stopped
  health: text("health").notNull().default("unknown"), // healthy, degraded, unhealthy, unknown
  lastHeartbeat: timestamp("last_heartbeat"),
  
  // Resource Usage
  memoryUsageMb: integer("memory_usage_mb").default(0),
  cpuUsagePercent: numeric("cpu_usage_percent", { precision: 5, scale: 2 }).default("0"),
  
  // Performance Metrics
  requestsHandled: integer("requests_handled").default(0),
  averageResponseTime: integer("average_response_time").default(0),
  successRate: numeric("success_rate", { precision: 5, scale: 2 }).default("100"),
  errorCount: integer("error_count").default(0),
  
  // Session Management
  sessionId: text("session_id"),
  userId: varchar("user_id").references(() => users.id),
  organizationId: integer("organization_id").references(() => organizations.id),
  
  // Context and Memory
  context: jsonb("context").default('{}'),
  shortTermMemory: jsonb("short_term_memory").default('{}'),
  currentTask: text("current_task"),
  
  // Lifecycle
  startedAt: timestamp("started_at").defaultNow(),
  lastActivity: timestamp("last_activity").defaultNow(),
  stoppedAt: timestamp("stopped_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_agent_instances_agent_id").on(table.agentId),
  index("idx_agent_instances_status").on(table.status),
  index("idx_agent_instances_health").on(table.health),
  index("idx_agent_instances_user").on(table.userId),
  index("idx_agent_instances_session").on(table.sessionId),
]);

// Agent Tasks - Task execution and tracking
export const agentTasks = pgTable("agent_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: text("task_id").notNull().unique(),
  
  // Task Assignment
  agentId: text("agent_id").references(() => agentCatalog.agentId).notNull(),
  instanceId: uuid("instance_id").references(() => agentInstances.id),
  assignedBy: text("assigned_by"), // user, system, or another agent
  
  // Task Details
  type: text("type").notNull(), // development, analysis, coordination, monitoring, etc.
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull().default("medium"), // low, medium, high, critical, urgent
  
  // Task Context
  context: jsonb("context").notNull().default('{}'),
  inputData: jsonb("input_data").default('{}'),
  requirements: jsonb("requirements").default('{}'),
  constraints: jsonb("constraints").default('{}'),
  
  // Execution Status
  status: text("status").notNull().default("pending"), // pending, assigned, in_progress, completed, failed, cancelled
  progress: integer("progress").default(0), // 0-100
  
  // Results and Output
  result: jsonb("result"),
  outputData: jsonb("output_data"),
  artifacts: jsonb("artifacts").default('[]'), // Generated files, code, etc.
  
  // Timing and Performance
  estimatedDuration: integer("estimated_duration"), // milliseconds
  actualDuration: integer("actual_duration"), // milliseconds
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  
  // Quality and Validation
  qualityScore: numeric("quality_score", { precision: 3, scale: 2 }),
  validationResults: jsonb("validation_results"),
  feedback: text("feedback"),
  
  // Error Handling
  errorMessage: text("error_message"),
  errorDetails: jsonb("error_details"),
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),
  
  // Dependencies and Relationships
  parentTaskId: text("parent_task_id"),
  dependsOnTasks: jsonb("depends_on_tasks").default('[]'),
  childTasks: jsonb("child_tasks").default('[]'),
  
  // Metadata
  metadata: jsonb("metadata").default('{}'),
  tags: jsonb("tags").default('[]'),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_agent_tasks_agent_id").on(table.agentId),
  index("idx_agent_tasks_instance_id").on(table.instanceId),
  index("idx_agent_tasks_status").on(table.status),
  index("idx_agent_tasks_priority").on(table.priority),
  index("idx_agent_tasks_type").on(table.type),
  index("idx_agent_tasks_created").on(table.createdAt),
]);

// Agent Communications - Inter-agent messaging and coordination
export const agentCommunications = pgTable("agent_communications", {
  id: uuid("id").defaultRandom().primaryKey(),
  messageId: text("message_id").notNull().unique(),
  
  // Message Routing
  fromAgentId: text("from_agent_id").references(() => agentCatalog.agentId).notNull(),
  fromInstanceId: uuid("from_instance_id").references(() => agentInstances.id),
  toAgentId: text("to_agent_id").references(() => agentCatalog.agentId).notNull(),
  toInstanceId: uuid("to_instance_id").references(() => agentInstances.id),
  
  // Message Details
  messageType: text("message_type").notNull(), // task_assignment, status_update, data_exchange, coordination, error_report
  subject: text("subject"),
  content: jsonb("content").notNull(),
  
  // Channel and Context
  channel: text("channel").default("default"), // default, coordination, emergency, data
  sessionId: text("session_id"),
  workflowId: text("workflow_id"),
  
  // Message Status
  status: text("status").notNull().default("sent"), // sent, delivered, acknowledged, processed, failed
  priority: text("priority").notNull().default("normal"), // low, normal, high, urgent, emergency
  
  // Response Handling
  requiresResponse: boolean("requires_response").default(false),
  responseToId: uuid("response_to_id"),
  conversationId: text("conversation_id"),
  
  // Timing
  sentAt: timestamp("sent_at").defaultNow(),
  deliveredAt: timestamp("delivered_at"),
  acknowledgedAt: timestamp("acknowledged_at"),
  processedAt: timestamp("processed_at"),
  
  // Metadata and Context
  metadata: jsonb("metadata").default('{}'),
  context: jsonb("context").default('{}'),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_agent_comms_from_agent").on(table.fromAgentId),
  index("idx_agent_comms_to_agent").on(table.toAgentId),
  index("idx_agent_comms_session").on(table.sessionId),
  index("idx_agent_comms_workflow").on(table.workflowId),
  index("idx_agent_comms_status").on(table.status),
  index("idx_agent_comms_priority").on(table.priority),
  index("idx_agent_comms_sent").on(table.sentAt),
]);

// Workflow Patterns - BMAD, Hive-Mind, Parallel Optimization, etc.
export const workflowPatterns = pgTable("workflow_patterns", {
  id: uuid("id").defaultRandom().primaryKey(),
  patternId: text("pattern_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  
  // Pattern Type
  type: text("type").notNull(), // bmad-greenfield, hive-mind-swarm, parallel-optimization, content-pipeline
  coordinationType: text("coordination_type").notNull(), // hierarchical, mesh, sequential, parallel
  
  // Pattern Definition
  definition: jsonb("definition").notNull(),
  steps: jsonb("steps").notNull(),
  agents: jsonb("agents").notNull(), // Required agents and their roles
  
  // Configuration
  config: jsonb("config").default('{}'),
  parameters: jsonb("parameters").default('{}'),
  constraints: jsonb("constraints").default('{}'),
  
  // Performance Characteristics
  estimatedDuration: integer("estimated_duration"), // milliseconds
  parallelism: integer("parallelism").default(1), // Number of parallel agents
  resourceRequirements: jsonb("resource_requirements").default('{}'),
  
  // Quality and Success Metrics
  successCriteria: jsonb("success_criteria").default('{}'),
  qualityGates: jsonb("quality_gates").default('[]'),
  performanceTargets: jsonb("performance_targets").default('{}'),
  
  // Usage and Statistics
  usageCount: integer("usage_count").default(0),
  successRate: numeric("success_rate", { precision: 5, scale: 2 }).default("0"),
  averageDuration: integer("average_duration").default(0),
  
  // Status and Availability
  status: text("status").notNull().default("active"), // active, inactive, deprecated
  version: text("version").notNull().default("1.0.0"),
  
  // Metadata
  tags: jsonb("tags").default('[]'),
  metadata: jsonb("metadata").default('{}'),
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_workflow_patterns_type").on(table.type),
  index("idx_workflow_patterns_coordination").on(table.coordinationType),
  index("idx_workflow_patterns_status").on(table.status),
  index("idx_workflow_patterns_created_by").on(table.createdBy),
]);

// Workflow Executions - Running instances of workflow patterns
export const workflowExecutionsV9 = pgTable("workflow_executions_v9", {
  id: uuid("id").defaultRandom().primaryKey(),
  executionId: text("execution_id").notNull().unique(),
  patternId: text("pattern_id").references(() => workflowPatterns.patternId).notNull(),
  
  // Execution Context
  userId: varchar("user_id").references(() => users.id),
  organizationId: integer("organization_id").references(() => organizations.id),
  sessionId: text("session_id"),
  
  // Input and Configuration
  inputData: jsonb("input_data").notNull(),
  config: jsonb("config").default('{}'),
  customParameters: jsonb("custom_parameters").default('{}'),
  
  // Execution Status
  status: text("status").notNull().default("pending"), // pending, initializing, running, completed, failed, cancelled
  progress: jsonb("progress").default('{}'), // Detailed progress tracking
  currentStep: text("current_step"),
  
  // Agent Assignments
  assignedAgents: jsonb("assigned_agents").default('{}'), // Agent instances assigned to roles
  activeInstances: jsonb("active_instances").default('[]'),
  
  // Results and Outputs
  result: jsonb("result"),
  outputs: jsonb("outputs").default('{}'),
  artifacts: jsonb("artifacts").default('[]'),
  
  // Performance Metrics
  executionMetrics: jsonb("execution_metrics").default('{}'),
  qualityScores: jsonb("quality_scores").default('{}'),
  performanceData: jsonb("performance_data").default('{}'),
  
  // Error Handling
  errors: jsonb("errors").default('[]'),
  warnings: jsonb("warnings").default('[]'),
  recoveryActions: jsonb("recovery_actions").default('[]'),
  
  // Timing
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  duration: integer("duration"), // milliseconds
  
  // Metadata
  metadata: jsonb("metadata").default('{}'),
  tags: jsonb("tags").default('[]'),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_workflow_exec_v9_pattern").on(table.patternId),
  index("idx_workflow_exec_v9_status").on(table.status),
  index("idx_workflow_exec_v9_user").on(table.userId),
  index("idx_workflow_exec_v9_session").on(table.sessionId),
  index("idx_workflow_exec_v9_created").on(table.createdAt),
]);

// Agent Memory System - Cross-session persistence and neural patterns
export const agentMemory = pgTable("agent_memory", {
  id: uuid("id").defaultRandom().primaryKey(),
  memoryId: text("memory_id").notNull().unique(),
  
  // Memory Ownership
  agentId: text("agent_id").references(() => agentCatalog.agentId).notNull(),
  instanceId: uuid("instance_id").references(() => agentInstances.id),
  userId: varchar("user_id").references(() => users.id),
  
  // Memory Type and Context
  memoryType: text("memory_type").notNull(), // episodic, semantic, procedural, working
  context: text("context").notNull(), // task, conversation, workflow, global
  scope: text("scope").notNull(), // session, user, global, organization
  
  // Memory Content
  content: jsonb("content").notNull(),
  embedding: jsonb("embedding"), // Vector representation for similarity search
  
  // Memory Characteristics
  importance: integer("importance").default(5), // 1-10 importance score
  confidence: numeric("confidence", { precision: 3, scale: 2 }).default("1.0"),
  strength: numeric("strength", { precision: 3, scale: 2 }).default("1.0"), // Memory strength (decays over time)
  
  // Access and Usage
  accessCount: integer("access_count").default(0),
  lastAccessed: timestamp("last_accessed"),
  
  // Neural Patterns
  neuralPatterns: jsonb("neural_patterns").default('{}'),
  associations: jsonb("associations").default('[]'), // Related memories
  
  // Lifecycle Management
  expiresAt: timestamp("expires_at"),
  isArchived: boolean("is_archived").default(false),
  
  // Metadata
  sessionId: text("session_id"),
  workflowId: text("workflow_id"),
  tags: jsonb("tags").default('[]'),
  metadata: jsonb("metadata").default('{}'),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_agent_memory_agent_id").on(table.agentId),
  index("idx_agent_memory_instance_id").on(table.instanceId),
  index("idx_agent_memory_user_id").on(table.userId),
  index("idx_agent_memory_type").on(table.memoryType),
  index("idx_agent_memory_context").on(table.context),
  index("idx_agent_memory_scope").on(table.scope),
  index("idx_agent_memory_session").on(table.sessionId),
  index("idx_agent_memory_importance").on(table.importance),
  index("idx_agent_memory_last_accessed").on(table.lastAccessed),
]);

// Real-time Monitoring - Opik-inspired LLM tracing and performance
export const agentMonitoring = pgTable("agent_monitoring", {
  id: uuid("id").defaultRandom().primaryKey(),
  traceId: text("trace_id").notNull().unique(),
  
  // Trace Context
  agentId: text("agent_id").references(() => agentCatalog.agentId).notNull(),
  instanceId: uuid("instance_id").references(() => agentInstances.id),
  taskId: text("task_id").references(() => agentTasks.taskId),
  
  // Request/Response Tracing
  operation: text("operation").notNull(), // llm_call, task_execution, coordination, memory_access
  
  // LLM Tracing (Opik-inspired)
  llmProvider: text("llm_provider"), // openai, anthropic, kimi, etc.
  llmModel: text("llm_model"),
  promptTokens: integer("prompt_tokens"),
  completionTokens: integer("completion_tokens"),
  totalTokens: integer("total_tokens"),
  
  // Performance Metrics
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // milliseconds
  
  // Quality Assessment
  qualityScore: numeric("quality_score", { precision: 3, scale: 2 }),
  hallucinationDetected: boolean("hallucination_detected").default(false),
  factualityScore: numeric("factuality_score", { precision: 3, scale: 2 }),
  coherenceScore: numeric("coherence_score", { precision: 3, scale: 2 }),
  
  // Cost Tracking
  cost: numeric("cost", { precision: 8, scale: 6 }),
  costCurrency: text("cost_currency").default("USD"),
  
  // Request/Response Data
  input: jsonb("input"),
  output: jsonb("output"),
  
  // Error Tracking
  success: boolean("success").default(true),
  errorType: text("error_type"),
  errorMessage: text("error_message"),
  errorDetails: jsonb("error_details"),
  
  // Context and Metadata
  userId: varchar("user_id").references(() => users.id),
  sessionId: text("session_id"),
  workflowId: text("workflow_id"),
  environment: text("environment").default("production"),
  
  metadata: jsonb("metadata").default('{}'),
  tags: jsonb("tags").default('[]'),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_agent_monitoring_agent_id").on(table.agentId),
  index("idx_agent_monitoring_instance_id").on(table.instanceId),
  index("idx_agent_monitoring_task_id").on(table.taskId),
  index("idx_agent_monitoring_operation").on(table.operation),
  index("idx_agent_monitoring_llm_provider").on(table.llmProvider),
  index("idx_agent_monitoring_success").on(table.success),
  index("idx_agent_monitoring_user_id").on(table.userId),
  index("idx_agent_monitoring_session").on(table.sessionId),
  index("idx_agent_monitoring_start_time").on(table.startTime),
]);

// Performance Analytics - Aggregated metrics and insights
export const agentPerformanceAnalytics = pgTable("agent_performance_analytics", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // Analytics Scope
  agentId: text("agent_id").references(() => agentCatalog.agentId),
  instanceId: uuid("instance_id").references(() => agentInstances.id),
  userId: varchar("user_id").references(() => users.id),
  
  // Time Period
  periodType: text("period_type").notNull(), // hour, day, week, month
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  
  // Performance Metrics
  totalRequests: integer("total_requests").default(0),
  successfulRequests: integer("successful_requests").default(0),
  failedRequests: integer("failed_requests").default(0),
  averageResponseTime: integer("average_response_time").default(0),
  
  // Quality Metrics
  averageQualityScore: numeric("average_quality_score", { precision: 3, scale: 2 }),
  hallucinationRate: numeric("hallucination_rate", { precision: 5, scale: 4 }),
  factualityRate: numeric("factuality_rate", { precision: 5, scale: 4 }),
  
  // Cost Metrics
  totalCost: numeric("total_cost", { precision: 8, scale: 2 }),
  averageCostPerRequest: numeric("average_cost_per_request", { precision: 8, scale: 6 }),
  
  // Token Usage
  totalTokensUsed: integer("total_tokens_used").default(0),
  averageTokensPerRequest: integer("average_tokens_per_request").default(0),
  
  // Task Performance
  tasksCompleted: integer("tasks_completed").default(0),
  averageTaskDuration: integer("average_task_duration").default(0),
  taskSuccessRate: numeric("task_success_rate", { precision: 5, scale: 2 }).default("0"),
  
  // Resource Utilization
  averageMemoryUsage: integer("average_memory_usage").default(0),
  averageCpuUsage: numeric("average_cpu_usage", { precision: 5, scale: 2 }).default("0"),
  
  // Detailed Analytics
  performanceData: jsonb("performance_data").default('{}'),
  trends: jsonb("trends").default('{}'),
  insights: jsonb("insights").default('{}'),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_agent_perf_analytics_agent_id").on(table.agentId),
  index("idx_agent_perf_analytics_instance_id").on(table.instanceId),
  index("idx_agent_perf_analytics_user_id").on(table.userId),
  index("idx_agent_perf_analytics_period").on(table.periodType, table.periodStart),
]);

// ============================================================================
// REAL TELEMETRY & PERFORMANCE METRICS SYSTEM
// Enhanced metrics storage and governance framework
// ============================================================================

// Enhanced Agent Performance Metrics - Real-time storage-backed metrics
export const agentPerformanceMetrics = pgTable("wai_agent_performance_metrics", {
  id: serial("id").primaryKey(),
  agentId: text("agent_id").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  metricType: varchar("metric_type", { length: 50 }).notNull(), // 'request', 'response_time', 'error', 'cost'
  value: real("value").notNull(),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  sessionId: text("session_id"),
  requestId: text("request_id"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_agent_metrics_agent_id").on(table.agentId),
  index("idx_agent_metrics_type").on(table.metricType),
  index("idx_agent_metrics_timestamp").on(table.timestamp),
  index("idx_agent_metrics_session").on(table.sessionId),
]);

// Agent Version History - Complete version control and rollback system
export const agentVersionHistory = pgTable("wai_agent_version_history", {
  id: serial("id").primaryKey(),
  agentId: text("agent_id").notNull(),
  version: varchar("version", { length: 50 }).notNull(),
  previousVersion: varchar("previous_version", { length: 50 }),
  changeType: varchar("change_type", { length: 50 }).notNull(), // 'create', 'update', 'rollback', 'approve'
  changeDescription: text("change_description"),
  changedBy: varchar("changed_by", { length: 255 }),
  approvedBy: varchar("approved_by", { length: 255 }),
  approvedAt: timestamp("approved_at"),
  configSnapshot: jsonb("config_snapshot").$type<Record<string, any>>().notNull(),
  status: varchar("status", { length: 20 }).default("pending").notNull(), // 'pending', 'approved', 'rejected', 'active'
  rollbackReason: text("rollback_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_agent_version_agent_id").on(table.agentId),
  index("idx_agent_version_version").on(table.version),
  index("idx_agent_version_status").on(table.status),
  index("idx_agent_version_changed_by").on(table.changedBy),
]);

// Skill Definitions - Schema-backed skill governance
export const skillDefinitions = pgTable("wai_skill_definitions", {
  id: serial("id").primaryKey(),
  skillId: varchar("skill_id", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(),
  requiredCapabilities: jsonb("required_capabilities").$type<string[]>().default([]),
  validationSchema: jsonb("validation_schema").$type<Record<string, any>>().default({}),
  dependencies: jsonb("dependencies").$type<string[]>().default([]),
  conflicts: jsonb("conflicts").$type<string[]>().default([]),
  isActive: boolean("is_active").default(true),
  version: varchar("version", { length: 50 }).default("1.0.0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_skill_def_skill_id").on(table.skillId),
  index("idx_skill_def_category").on(table.category),
  index("idx_skill_def_active").on(table.isActive),
]);

// Policy Definitions - Schema-backed policy governance
export const policyDefinitions = pgTable("wai_policy_definitions", {
  id: serial("id").primaryKey(),
  policyId: varchar("policy_id", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  policyType: varchar("policy_type", { length: 50 }).notNull(), // 'security', 'compliance', 'performance', 'cost'
  rules: jsonb("rules").$type<Record<string, any>>().notNull(),
  enforcement: varchar("enforcement", { length: 20 }).default("warn").notNull(), // 'enforce', 'warn', 'audit'
  scope: jsonb("scope").$type<string[]>().default([]), // agent tiers, categories, specific agents
  priority: integer("priority").default(0),
  isActive: boolean("is_active").default(true),
  version: varchar("version", { length: 50 }).default("1.0.0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_policy_def_policy_id").on(table.policyId),
  index("idx_policy_def_type").on(table.policyType),
  index("idx_policy_def_active").on(table.isActive),
  index("idx_policy_def_priority").on(table.priority),
]);

// Agent Skill Assignments - Validated skill assignments
export const agentSkillAssignments = pgTable("wai_agent_skill_assignments", {
  id: serial("id").primaryKey(),
  agentId: varchar("agent_id", { length: 255 }).notNull(),
  skillId: varchar("skill_id", { length: 255 }).notNull(),
  proficiencyLevel: varchar("proficiency_level", { length: 20 }).default("intermediate"), // 'beginner', 'intermediate', 'advanced', 'expert'
  assignedAt: timestamp("assigned_at").defaultNow(),
  assignedBy: varchar("assigned_by", { length: 255 }),
  validatedAt: timestamp("validated_at"),
  validationStatus: varchar("validation_status", { length: 20 }).default("pending"), // 'pending', 'validated', 'failed'
}, (table) => [
  index("idx_agent_skill_agent_id").on(table.agentId),
  index("idx_agent_skill_skill_id").on(table.skillId),
  index("idx_agent_skill_status").on(table.validationStatus),
]);

// Agent Policy Assignments - Policy compliance tracking
export const agentPolicyAssignments = pgTable("wai_agent_policy_assignments", {
  id: serial("id").primaryKey(),
  agentId: varchar("agent_id", { length: 255 }).notNull(),
  policyId: varchar("policy_id", { length: 255 }).notNull(),
  assignedAt: timestamp("assigned_at").defaultNow(),
  assignedBy: varchar("assigned_by", { length: 255 }),
  overrides: jsonb("overrides").$type<Record<string, any>>().default({}),
  exemptions: jsonb("exemptions").$type<string[]>().default([]),
  lastEvaluated: timestamp("last_evaluated"),
  complianceStatus: varchar("compliance_status", { length: 20 }).default("unknown"), // 'compliant', 'non_compliant', 'unknown'
}, (table) => [
  index("idx_agent_policy_agent_id").on(table.agentId),
  index("idx_agent_policy_policy_id").on(table.policyId),
  index("idx_agent_policy_compliance").on(table.complianceStatus),
]);

// Provider Performance Metrics - Real-time provider monitoring
export const providerPerformanceMetrics = pgTable("wai_provider_performance_metrics", {
  id: serial("id").primaryKey(),
  providerId: varchar("provider_id", { length: 255 }).notNull(),
  modelId: varchar("model_id", { length: 255 }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  metricType: varchar("metric_type", { length: 50 }).notNull(), // 'latency', 'tokens', 'cost', 'error_rate', 'throughput'
  value: real("value").notNull(),
  region: varchar("region", { length: 100 }),
  metadata: jsonb("metadata").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_provider_metrics_provider_id").on(table.providerId),
  index("idx_provider_metrics_model_id").on(table.modelId),
  index("idx_provider_metrics_type").on(table.metricType),
  index("idx_provider_metrics_timestamp").on(table.timestamp),
]);

// Agent Coordination System - Task routing and load balancing
export const agentCoordination = pgTable("agent_coordination", {
  id: uuid("id").defaultRandom().primaryKey(),
  coordinationId: text("coordination_id").notNull().unique(),
  
  // Coordination Type
  type: text("type").notNull(), // task_routing, load_balancing, failover, scaling
  strategy: text("strategy").notNull(), // round_robin, capability_based, performance_based
  
  // Participants
  coordinatorAgentId: text("coordinator_agent_id").references(() => agentCatalog.agentId),
  participantAgents: jsonb("participant_agents").notNull().default('[]'),
  
  // Coordination Rules
  rules: jsonb("rules").notNull(),
  constraints: jsonb("constraints").default('{}'),
  priorities: jsonb("priorities").default('{}'),
  
  // Status and State
  status: text("status").notNull().default("active"), // active, paused, stopped, error
  state: jsonb("state").default('{}'),
  
  // Performance Tracking
  decisionsCount: integer("decisions_count").default(0),
  successfulDecisions: integer("successful_decisions").default(0),
  averageDecisionTime: integer("average_decision_time").default(0),
  
  // Configuration
  config: jsonb("config").default('{}'),
  metadata: jsonb("metadata").default('{}'),
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_agent_coordination_type").on(table.type),
  index("idx_agent_coordination_coordinator").on(table.coordinatorAgentId),
  index("idx_agent_coordination_status").on(table.status),
]);

// Agent Event Bus - Real-time event streaming and notifications
export const agentEventBus = pgTable("agent_event_bus", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: text("event_id").notNull().unique(),
  
  // Event Details
  eventType: text("event_type").notNull(), // agent_started, task_completed, error_occurred, etc.
  eventCategory: text("event_category").notNull(), // lifecycle, performance, error, coordination
  
  // Event Source
  sourceAgentId: text("source_agent_id").references(() => agentCatalog.agentId),
  sourceInstanceId: uuid("source_instance_id").references(() => agentInstances.id),
  
  // Event Data
  payload: jsonb("payload").notNull(),
  severity: text("severity").notNull().default("info"), // debug, info, warning, error, critical
  
  // Routing and Delivery
  channels: jsonb("channels").default('[]'), // Which channels to publish to
  subscribers: jsonb("subscribers").default('[]'), // Target subscribers
  
  // Event Status
  status: text("status").notNull().default("published"), // published, delivered, failed
  deliveryAttempts: integer("delivery_attempts").default(0),
  
  // Context
  userId: varchar("user_id").references(() => users.id),
  sessionId: text("session_id"),
  workflowId: text("workflow_id"),
  traceId: text("trace_id"),
  
  // Timing
  timestamp: timestamp("timestamp").defaultNow(),
  expiresAt: timestamp("expires_at"),
  
  // Metadata
  metadata: jsonb("metadata").default('{}'),
  tags: jsonb("tags").default('[]'),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_agent_event_bus_type").on(table.eventType),
  index("idx_agent_event_bus_category").on(table.eventCategory),
  index("idx_agent_event_bus_source_agent").on(table.sourceAgentId),
  index("idx_agent_event_bus_severity").on(table.severity),
  index("idx_agent_event_bus_timestamp").on(table.timestamp),
  index("idx_agent_event_bus_user_id").on(table.userId),
  index("idx_agent_event_bus_session").on(table.sessionId),
]);

// Agent Relations
export const agentCatalogRelations = relations(agentCatalog, ({ many }) => ({
  instances: many(agentInstances),
  tasks: many(agentTasks),
  sentMessages: many(agentCommunications, { relationName: "sender" }),
  receivedMessages: many(agentCommunications, { relationName: "receiver" }),
  memory: many(agentMemory),
  monitoring: many(agentMonitoring),
}));

export const agentInstanceRelations = relations(agentInstances, ({ one, many }) => ({
  agent: one(agentCatalog, { fields: [agentInstances.agentId], references: [agentCatalog.agentId] }),
  user: one(users, { fields: [agentInstances.userId], references: [users.id] }),
  organization: one(organizations, { fields: [agentInstances.organizationId], references: [organizations.id] }),
  tasks: many(agentTasks),
  memory: many(agentMemory),
  monitoring: many(agentMonitoring),
}));

export const agentTaskRelations = relations(agentTasks, ({ one }) => ({
  agent: one(agentCatalog, { fields: [agentTasks.agentId], references: [agentCatalog.agentId] }),
  instance: one(agentInstances, { fields: [agentTasks.instanceId], references: [agentInstances.id] }),
  monitoring: one(agentMonitoring, { fields: [agentTasks.taskId], references: [agentMonitoring.taskId] }),
}));

// Insert Schemas for Agent System
export const insertAgentCatalogSchema = createInsertSchema(agentCatalog).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAgentInstanceSchema = createInsertSchema(agentInstances).omit({
  id: true,
  startedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAgentTaskSchema = createInsertSchema(agentTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkflowPatternSchema = createInsertSchema(workflowPatterns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAgentMemorySchema = createInsertSchema(agentMemory).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAgentMonitoringSchema = createInsertSchema(agentMonitoring).omit({
  id: true,
  createdAt: true,
});

// Export Types for Agent System
export type AgentCatalogEntry = typeof agentCatalog.$inferSelect;
export type InsertAgentCatalogEntry = z.infer<typeof insertAgentCatalogSchema>;

export type AgentInstance = typeof agentInstances.$inferSelect;
export type InsertAgentInstance = z.infer<typeof insertAgentInstanceSchema>;

export type AgentTask = typeof agentTasks.$inferSelect;
export type InsertAgentTask = z.infer<typeof insertAgentTaskSchema>;

export type AgentCommunication = typeof agentCommunications.$inferSelect;
export type InsertAgentCommunication = typeof agentCommunications.$inferInsert;

export type WorkflowPattern = typeof workflowPatterns.$inferSelect;
export type InsertWorkflowPattern = z.infer<typeof insertWorkflowPatternSchema>;

export type WorkflowExecutionV9 = typeof workflowExecutionsV9.$inferSelect;
export type InsertWorkflowExecutionV9 = typeof workflowExecutionsV9.$inferInsert;

export type AgentMemoryEntry = typeof agentMemory.$inferSelect;
export type InsertAgentMemoryEntry = z.infer<typeof insertAgentMemorySchema>;

export type AgentMonitoringEntry = typeof agentMonitoring.$inferSelect;
export type InsertAgentMonitoringEntry = z.infer<typeof insertAgentMonitoringSchema>;

export type AgentPerformanceAnalytics = typeof agentPerformanceAnalytics.$inferSelect;
export type InsertAgentPerformanceAnalytics = typeof agentPerformanceAnalytics.$inferInsert;

export type AgentCoordinationEntry = typeof agentCoordination.$inferSelect;
export type InsertAgentCoordinationEntry = typeof agentCoordination.$inferInsert;

export type AgentEventBusEntry = typeof agentEventBus.$inferSelect;
export type InsertAgentEventBusEntry = typeof agentEventBus.$inferInsert;

// ============================================================================
// TELEMETRY & GOVERNANCE ZOD SCHEMAS AND TYPES
// ============================================================================

// Telemetry Insert Schemas
export const insertAgentPerformanceMetricsSchema = createInsertSchema(agentPerformanceMetrics).omit({
  id: true,
  createdAt: true,
});

export const insertAgentVersionHistorySchema = createInsertSchema(agentVersionHistory).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSkillDefinitionSchema = createInsertSchema(skillDefinitions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPolicyDefinitionSchema = createInsertSchema(policyDefinitions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAgentSkillAssignmentSchema = createInsertSchema(agentSkillAssignments).omit({
  id: true,
  assignedAt: true,
});

export const insertAgentPolicyAssignmentSchema = createInsertSchema(agentPolicyAssignments).omit({
  id: true,
  assignedAt: true,
});

export const insertProviderPerformanceMetricsSchema = createInsertSchema(providerPerformanceMetrics).omit({
  id: true,
  createdAt: true,
});

// Telemetry Types
export type AgentPerformanceMetric = typeof agentPerformanceMetrics.$inferSelect;
export type InsertAgentPerformanceMetric = z.infer<typeof insertAgentPerformanceMetricsSchema>;

export type AgentVersionHistory = typeof agentVersionHistory.$inferSelect;
export type InsertAgentVersionHistory = z.infer<typeof insertAgentVersionHistorySchema>;

export type SkillDefinition = typeof skillDefinitions.$inferSelect;
export type InsertSkillDefinition = z.infer<typeof insertSkillDefinitionSchema>;

export type PolicyDefinition = typeof policyDefinitions.$inferSelect;
export type InsertPolicyDefinition = z.infer<typeof insertPolicyDefinitionSchema>;

export type AgentSkillAssignment = typeof agentSkillAssignments.$inferSelect;
export type InsertAgentSkillAssignment = z.infer<typeof insertAgentSkillAssignmentSchema>;

export type AgentPolicyAssignment = typeof agentPolicyAssignments.$inferSelect;
export type InsertAgentPolicyAssignment = z.infer<typeof insertAgentPolicyAssignmentSchema>;

export type ProviderPerformanceMetric = typeof providerPerformanceMetrics.$inferSelect;
export type InsertProviderPerformanceMetric = z.infer<typeof insertProviderPerformanceMetricsSchema>;

// ================================================================================================
// WAI ADMIN CONSOLE & STUDIO ZOD SCHEMAS AND TYPE EXPORTS
// ================================================================================================

// WAI Admin Console Insert Schemas
export const insertWaiRoutingPolicySchema = createInsertSchema(waiRoutingPolicies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWaiPipelineSchema = createInsertSchema(waiPipelines).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWaiObservabilityTraceSchema = createInsertSchema(waiObservabilityTraces).omit({
  id: true,
  createdAt: true,
});

export const insertWaiIncidentSchema = createInsertSchema(waiIncidentManagement).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWaiBmadAssetSchema = createInsertSchema(waiBmadAssets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWaiGrpoTrainingJobSchema = createInsertSchema(waiGrpoTrainingJobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWaiTenancySpaceSchema = createInsertSchema(waiTenancySpaces).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWaiRbacRoleSchema = createInsertSchema(waiRbacRoles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWaiSecretSchema = createInsertSchema(waiSecretsManagement).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWaiFinOpsBudgetSchema = createInsertSchema(waiFinOpsBudgets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWaiCostOptimizerSchema = createInsertSchema(waiCostOptimizer).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWaiMarketplaceSchema = createInsertSchema(waiMarketplace).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWaiIndiaPackServiceSchema = createInsertSchema(waiIndiaPackServices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWaiLlmProvidersV9Schema = createInsertSchema(waiLlmProvidersV9).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// WAI Studio Insert Schemas
export const insertWaiStudioBlueprintSchema = createInsertSchema(waiStudioBlueprints).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWaiStudioAssetSchema = createInsertSchema(waiStudioAssets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWaiStudioExperimentSchema = createInsertSchema(waiStudioExperiments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWaiStudioPublishingSchema = createInsertSchema(waiStudioPublishing).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// P0 Roadmap Insert Schemas
export const insertP0RoadmapPhaseSchema = createInsertSchema(p0RoadmapPhases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertP0MilestoneSchema = createInsertSchema(p0Milestones).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertP0TaskSchema = createInsertSchema(p0Tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertP0QualityGateSchema = createInsertSchema(p0QualityGates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertP0TaskDependencySchema = createInsertSchema(p0TaskDependencies).omit({
  id: true,
  createdAt: true,
});

export const insertP0ProgressMetricSchema = createInsertSchema(p0ProgressMetrics).omit({
  id: true,
  createdAt: true,
});

export const featureRegistry = pgTable("feature_registry", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  featureType: text("feature_type").notNull().default("fullstack"),
  hasDatabase: boolean("has_database").default(false),
  databaseTables: jsonb("database_tables").default('[]').$type<string[]>(),
  hasApi: boolean("has_api").default(false),
  apiEndpoints: jsonb("api_endpoints").default('[]').$type<string[]>(),
  hasFrontend: boolean("has_frontend").default(false),
  frontendComponents: jsonb("frontend_components").default('[]').$type<string[]>(),
  implementationFiles: jsonb("implementation_files").default('[]').$type<string[]>(),
  status: text("status").notNull().default("active"),
  version: text("version").notNull().default("1.0"),
  registeredAt: timestamp("registered_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFeatureRegistrySchema = createInsertSchema(featureRegistry).omit({
  id: true,
  registeredAt: true,
  updatedAt: true,
});

export const mcpTools = pgTable("mcp_tools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  serverId: integer("server_id"),
  inputSchema: jsonb("input_schema").notNull(),
  outputSchema: jsonb("output_schema"),
  isEnabled: boolean("is_enabled").default(true),
  usageCount: integer("usage_count").default(0),
  successCount: integer("success_count").default(0),
  averageExecutionTime: integer("average_execution_time"),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const mcpServers = pgTable("mcp_servers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  url: text("url").notNull(),
  protocol: text("protocol").notNull().default("http"),
  isActive: boolean("is_active").default(true),
  healthStatus: text("health_status").default("unknown"),
  lastHealthCheck: timestamp("last_health_check"),
  capabilities: jsonb("capabilities").default('[]').$type<string[]>(),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const mcpConnections = pgTable("mcp_connections", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id"),
  toolId: integer("tool_id").references(() => mcpTools.id),
  serverId: integer("server_id").references(() => mcpServers.id),
  status: text("status").notNull().default("active"),
  executionCount: integer("execution_count").default(0),
  lastExecutedAt: timestamp("last_executed_at"),
  config: jsonb("config").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMcpToolSchema = createInsertSchema(mcpTools).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMcpServerSchema = createInsertSchema(mcpServers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMcpConnectionSchema = createInsertSchema(mcpConnections).omit({
  id: true,
  createdAt: true,
});

export const agentTemplates = pgTable("agent_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  romaLevel: text("roma_level").notNull(),
  systemPrompt: text("system_prompt").notNull(),
  capabilities: jsonb("capabilities").default('[]').$type<string[]>(),
  toolIds: jsonb("tool_ids").default('[]').$type<number[]>(),
  modelPreferences: jsonb("model_preferences").default('{}'),
  configTemplate: jsonb("config_template").default('{}'),
  isPublic: boolean("is_public").default(false),
  usageCount: integer("usage_count").default(0),
  rating: real("rating").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const generatedAgents = pgTable("generated_agents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  templateId: integer("template_id").references(() => agentTemplates.id),
  userId: integer("user_id"),
  config: jsonb("config").notNull(),
  status: text("status").notNull().default("active"),
  performanceMetrics: jsonb("performance_metrics").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAgentTemplateSchema = createInsertSchema(agentTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGeneratedAgentSchema = createInsertSchema(generatedAgents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ================================================================================================
// WIZARDS INCUBATOR PLATFORM - Complete Database Schema
// Built on WAI SDK v1.0 Orchestration Backbone
// 8 Functional Layers + 10 Specialized Studios + 10 Industry Templates
// ================================================================================================

// Layer 2: Founder Graph - Founder profiles, journey tracking, learning loops
export const wizardsFounders = pgTable("wizards_founders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  bio: text("bio"),
  expertise: text("expertise").array(),
  linkedinUrl: text("linkedin_url"),
  twitterUrl: text("twitter_url"),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  userId: varchar("user_id").references(() => users.id),
  founderType: text("founder_type").notNull().default("solo"),
  industryExperience: text("industry_experience"),
  technicalBackground: boolean("technical_background").default(false),
  startupStage: text("startup_stage").notNull().default("idea"),
  goals: jsonb("goals").default('[]').$type<string[]>(),
  preferences: jsonb("preferences").default('{}'),
  completedStudios: jsonb("completed_studios").default('[]').$type<string[]>(),
  currentStudio: text("current_studio"),
  journeyProgress: integer("journey_progress").default(0),
  learningProfile: jsonb("learning_profile").default('{}'),
  achievements: jsonb("achievements").default('[]').$type<any[]>(),
  networkConnections: jsonb("network_connections").default('[]').$type<number[]>(),
  creditsBalance: integer("credits_balance").default(100),
  subscriptionTier: text("subscription_tier").default("free"),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_wizards_founders_user_id").on(table.userId),
  stageIdx: index("idx_wizards_founders_stage").on(table.startupStage),
  tierIdx: index("idx_wizards_founders_tier").on(table.subscriptionTier),
}));

export const wizardsStartups = pgTable("wizards_startups", {
  id: serial("id").primaryKey(),
  founderId: integer("founder_id").references(() => wizardsFounders.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  industry: text("industry"),
  targetMarket: text("target_market"),
  problemStatement: text("problem_statement"),
  proposedSolution: text("proposed_solution"),
  status: text("status").default("active"), // active, paused, completed, cancelled
  currentPhase: text("current_phase").default("ideation"),
  progress: integer("progress").default(0),
  creditsAllocated: integer("credits_allocated").default(1000),
  creditsUsed: integer("credits_used").default(0),
  isPaused: boolean("is_paused").default(false),
  pausedAt: timestamp("paused_at"),
  pausedProgress: integer("paused_progress"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  founderIdIdx: index("idx_wizards_startups_founder_id").on(table.founderId),
  statusIdx: index("idx_wizards_startups_status").on(table.status),
  currentPhaseIdx: index("idx_wizards_startups_current_phase").on(table.currentPhase),
  createdAtIdx: index("idx_wizards_startups_created_at").on(table.createdAt),
}));

export const wizardsJourneyTimeline = pgTable("wizards_journey_timeline", {
  id: serial("id").primaryKey(),
  startupId: integer("startup_id").references(() => wizardsStartups.id).notNull(),
  eventType: text("event_type").notNull(),
  eventName: text("event_name").notNull(),
  eventDescription: text("event_description"),
  studioName: text("studio_name"),
  dayNumber: integer("day_number"),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  startupIdIdx: index("idx_wizards_journey_startup_id").on(table.startupId),
  eventTypeIdx: index("idx_wizards_journey_event_type").on(table.eventType),
  createdAtIdx: index("idx_wizards_journey_created_at").on(table.createdAt),
}));

// Layer 3: Studio Engine - Framework for all 10 studios
export const wizardsStudios = pgTable("wizards_studios", {
  id: serial("id").primaryKey(),
  studioId: text("studio_id").notNull().unique(),
  name: text("name").notNull(),
  displayName: text("display_name").notNull(),
  description: text("description").notNull(),
  icon: text("icon"),
  color: text("color"),
  sequence: integer("sequence").notNull(),
  category: text("category").notNull(),
  estimatedDays: integer("estimated_days").notNull(),
  dayRange: text("day_range"),
  features: jsonb("features").default('[]').$type<string[]>(),
  deliverables: jsonb("deliverables").default('[]').$type<string[]>(),
  agents: jsonb("agents").default('[]').$type<string[]>(),
  dependencies: jsonb("dependencies").default('[]').$type<string[]>(),
  isActive: boolean("is_active").default(true),
  version: text("version").default("1.0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  studioIdIdx: index("idx_wizards_studios_studio_id").on(table.studioId),
  categoryIdx: index("idx_wizards_studios_category").on(table.category),
  sequenceIdx: index("idx_wizards_studios_sequence").on(table.sequence),
}));

export const wizardsStudioSessions = pgTable("wizards_studio_sessions", {
  id: serial("id").primaryKey(),
  startupId: integer("startup_id").references(() => wizardsStartups.id).notNull(),
  studioId: text("studio_id").notNull(),
  status: text("status").notNull().default("not_started"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  currentStep: integer("current_step").default(1),
  totalSteps: integer("total_steps").default(1),
  progress: integer("progress").default(0),
  agentsUsed: jsonb("agents_used").default('[]').$type<string[]>(),
  creditsConsumed: integer("credits_consumed").default(0),
  qualityScore: integer("quality_score"),
  feedback: jsonb("feedback").default('{}'),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  startupIdIdx: index("idx_wizards_sessions_startup_id").on(table.startupId),
  studioIdIdx: index("idx_wizards_sessions_studio_id").on(table.studioId),
  statusIdx: index("idx_wizards_sessions_status").on(table.status),
  startedAtIdx: index("idx_wizards_sessions_started_at").on(table.startedAt),
  createdAtIdx: index("idx_wizards_sessions_created_at").on(table.createdAt),
}));

export const wizardsStudioTasks = pgTable("wizards_studio_tasks", {
  id: serial("id").primaryKey(),
  studioId: text("studio_id"),
  startupId: integer("startup_id").references(() => wizardsStartups.id),
  sessionId: integer("session_id").references(() => wizardsStudioSessions.id).notNull(),
  taskId: integer("task_id"),
  sequence: integer("sequence"),
  taskType: text("task_type").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"),
  inputs: jsonb("inputs").default('{}'),
  outputs: jsonb("outputs").default('{}'),
  errorMessage: text("error_message"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  sessionIdIdx: index("idx_wizards_tasks_session_id").on(table.sessionId),
  statusIdx: index("idx_wizards_tasks_status").on(table.status),
  taskTypeIdx: index("idx_wizards_tasks_type").on(table.taskType),
  startupIdIdx: index("idx_wizards_tasks_startup_id").on(table.startupId),
  studioIdIdx: index("idx_wizards_tasks_studio_id").on(table.studioId),
}));

export const wizardsStudioDeliverables = pgTable("wizards_studio_deliverables", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => wizardsStudioSessions.id).notNull(),
  deliverableType: text("deliverable_type").notNull(),
  deliverableName: text("deliverable_name").notNull(),
  content: text("content"),
  contentType: text("content_type"),
  fileUrl: text("file_url"),
  artifactId: integer("artifact_id"),
  version: text("version").default("1.0"),
  qualityScore: integer("quality_score"),
  isApproved: boolean("is_approved").default(false),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  sessionIdIdx: index("idx_wizards_deliverables_session_id").on(table.sessionId),
  deliverableTypeIdx: index("idx_wizards_deliverables_type").on(table.deliverableType),
}));

// Layer 4: Artifact Store - Code, designs, content, deployments repository
export const wizardsArtifacts = pgTable("wizards_artifacts", {
  id: serial("id").primaryKey(),
  startupId: integer("startup_id").references(() => wizardsStartups.id).notNull(),
  artifactType: text("artifact_type").notNull(),
  category: text("category").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  content: text("content"),
  fileUrl: text("file_url"),
  fileSize: integer("file_size"),
  filePath: text("file_path"),
  mimeType: text("mime_type"),
  version: integer("version").default(1),
  studioId: text("studio_id"),
  sessionId: integer("session_id"),
  tags: text("tags").array().default(sql`'{}'`),
  metadata: jsonb("metadata").default('{}'),
  isPublic: boolean("is_public").default(false),
  downloads: integer("downloads").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  startupIdIdx: index("idx_wizards_artifacts_startup_id").on(table.startupId),
  artifactTypeIdx: index("idx_wizards_artifacts_type").on(table.artifactType),
  categoryIdx: index("idx_wizards_artifacts_category").on(table.category),
  studioIdIdx: index("idx_wizards_artifacts_studio_id").on(table.studioId),
  versionIdx: index("idx_wizards_artifacts_version").on(table.version),
  createdAtIdx: index("idx_wizards_artifacts_created_at").on(table.createdAt),
}));

export const wizardsCodeRepository = pgTable("wizards_code_repository", {
  id: serial("id").primaryKey(),
  artifactId: integer("artifact_id").references(() => wizardsArtifacts.id).notNull(),
  repository: text("repository"),
  branch: text("branch").default("main"),
  commitHash: text("commit_hash"),
  fileStructure: jsonb("file_structure").default('{}'),
  techStack: jsonb("tech_stack").default('{}'),
  dependencies: jsonb("dependencies").default('{}'),
  buildStatus: text("build_status"),
  testCoverage: integer("test_coverage"),
  linesOfCode: integer("lines_of_code"),
  qualityMetrics: jsonb("quality_metrics").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  artifactIdIdx: index("idx_wizards_code_repo_artifact_id").on(table.artifactId),
}));

export const wizardsDesignAssets = pgTable("wizards_design_assets", {
  id: serial("id").primaryKey(),
  artifactId: integer("artifact_id").references(() => wizardsArtifacts.id).notNull(),
  assetType: text("asset_type").notNull(),
  figmaUrl: text("figma_url"),
  previewUrl: text("preview_url"),
  designSystem: jsonb("design_system").default('{}'),
  components: jsonb("components").default('[]').$type<any[]>(),
  colorPalette: jsonb("color_palette").default('[]').$type<string[]>(),
  typography: jsonb("typography").default('{}'),
  accessibilityScore: integer("accessibility_score"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  artifactIdIdx: index("idx_wizards_design_assets_artifact_id").on(table.artifactId),
}));

// Layer 4A: File Upload Management - Chunked uploads, storage tracking
export const wizardsFileUploads = pgTable("wizards_file_uploads", {
  id: serial("id").primaryKey(),
  startupId: integer("startup_id").references(() => wizardsStartups.id).notNull(),
  userId: varchar("user_id").references(() => users.id),
  uploadId: text("upload_id").notNull().unique(), // Unique identifier for multipart upload
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(), // Total size in bytes
  mimeType: text("mime_type").notNull(),
  chunkSize: integer("chunk_size").default(5242880), // 5MB default chunk size
  totalChunks: integer("total_chunks").notNull(),
  uploadedChunks: integer("uploaded_chunks").default(0),
  status: text("status").notNull().default("pending"), // pending, uploading, completed, failed, cancelled
  storageProvider: text("storage_provider").notNull(), // local, s3, gcs, azure, cloudflare
  storageRegion: text("storage_region"),
  storagePath: text("storage_path"),
  storageUrl: text("storage_url"),
  checksumMd5: text("checksum_md5"),
  checksumSha256: text("checksum_sha256"),
  artifactId: integer("artifact_id").references(() => wizardsArtifacts.id),
  sessionId: integer("session_id").references(() => wizardsStudioSessions.id),
  metadata: jsonb("metadata").default('{}'),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  expiresAt: timestamp("expires_at"), // For cleanup of incomplete uploads
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uploadIdIdx: index("idx_wizards_file_uploads_upload_id").on(table.uploadId),
  startupIdIdx: index("idx_wizards_file_uploads_startup_id").on(table.startupId),
  statusIdx: index("idx_wizards_file_uploads_status").on(table.status),
  storageProviderIdx: index("idx_wizards_file_uploads_storage_provider").on(table.storageProvider),
}));

// File upload chunks tracking
export const wizardsFileUploadChunks = pgTable("wizards_file_upload_chunks", {
  id: serial("id").primaryKey(),
  uploadId: text("upload_id").notNull(),
  chunkIndex: integer("chunk_index").notNull(),
  chunkSize: integer("chunk_size").notNull(),
  checksum: text("checksum"),
  status: text("status").notNull().default("pending"), // pending, uploaded, verified, failed
  storagePath: text("storage_path"),
  uploadedAt: timestamp("uploaded_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uploadIdIdx: index("idx_wizards_file_upload_chunks_upload_id").on(table.uploadId),
  uploadIdChunkIdx: index("idx_wizards_file_upload_chunks_upload_chunk").on(table.uploadId, table.chunkIndex),
}));

// Storage configuration and provider management
export const wizardsStorageProviders = pgTable("wizards_storage_providers", {
  id: serial("id").primaryKey(),
  providerId: text("provider_id").notNull().unique(),
  providerType: text("provider_type").notNull(), // local, s3, gcs, azure, cloudflare-r2
  displayName: text("display_name").notNull(),
  region: text("region"),
  bucket: text("bucket"),
  endpoint: text("endpoint"),
  configuration: jsonb("configuration").default('{}'), // Provider-specific config
  credentials: jsonb("credentials").default('{}'), // Encrypted credentials
  maxFileSize: integer("max_file_size").default(104857600), // 100MB default
  allowedMimeTypes: jsonb("allowed_mime_types").default('[]').$type<string[]>(),
  isActive: boolean("is_active").default(true),
  isDefault: boolean("is_default").default(false),
  priority: integer("priority").default(0), // For fallback ordering
  quota: jsonb("quota").default('{}'), // Storage quota settings
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  providerIdIdx: index("idx_wizards_storage_providers_provider_id").on(table.providerId),
  providerTypeIdx: index("idx_wizards_storage_providers_type").on(table.providerType),
  isActiveIdx: index("idx_wizards_storage_providers_is_active").on(table.isActive),
}));

// Artifact version history for rollback capability
export const wizardsArtifactVersions = pgTable("wizards_artifact_versions", {
  id: serial("id").primaryKey(),
  artifactId: integer("artifact_id").references(() => wizardsArtifacts.id).notNull(),
  versionNumber: text("version_number").notNull(),
  changeType: text("change_type").notNull(), // created, updated, deleted, restored
  changes: jsonb("changes").default('{}'), // JSON diff of changes
  content: text("content"),
  fileUrl: text("file_url"),
  fileSize: integer("file_size"),
  checksum: text("checksum"),
  createdBy: varchar("created_by").references(() => users.id),
  commitMessage: text("commit_message"),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  artifactIdIdx: index("idx_wizards_artifact_versions_artifact_id").on(table.artifactId),
  versionNumberIdx: index("idx_wizards_artifact_versions_version").on(table.versionNumber),
}));

// Industry Templates - 10 ready-to-deploy templates
export const wizardsIndustryTemplates = pgTable("wizards_industry_templates", {
  id: serial("id").primaryKey(),
  templateId: text("template_id").notNull().unique(),
  industry: text("industry").notNull(),
  name: text("name").notNull(),
  displayName: text("display_name").notNull(),
  description: text("description").notNull(),
  icon: text("icon"),
  features: jsonb("features").default('[]').$type<string[]>(),
  techStack: jsonb("tech_stack").default('{}'),
  compliance: jsonb("compliance").default('[]').$type<string[]>(),
  integrations: jsonb("integrations").default('[]').$type<string[]>(),
  estimatedDeploymentDays: integer("estimated_deployment_days").notNull(),
  complexity: text("complexity").default("medium"),
  isPopular: boolean("is_popular").default(false),
  usageCount: integer("usage_count").default(0),
  rating: real("rating").default(0),
  blueprintData: jsonb("blueprint_data").default('{}'),
  codeTemplates: jsonb("code_templates").default('{}'),
  isActive: boolean("is_active").default(true),
  version: text("version").default("1.0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  templateIdIdx: index("idx_wizards_templates_template_id").on(table.templateId),
  industryIdx: index("idx_wizards_templates_industry").on(table.industry),
  complexityIdx: index("idx_wizards_templates_complexity").on(table.complexity),
}));

export const wizardsTemplateUsage = pgTable("wizards_template_usage", {
  id: serial("id").primaryKey(),
  startupId: integer("startup_id").references(() => wizardsStartups.id).notNull(),
  templateId: text("template_id").notNull(),
  customizations: jsonb("customizations").default('{}'),
  deploymentStatus: text("deployment_status"),
  deploymentUrl: text("deployment_url"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  startupIdIdx: index("idx_wizards_template_usage_startup_id").on(table.startupId),
  templateIdIdx: index("idx_wizards_template_usage_template_id").on(table.templateId),
}));

// Layer 5: Automation Mesh - CI/CD pipelines, DevOps workflows
export const wizardsAutomationPipelines = pgTable("wizards_automation_pipelines", {
  id: serial("id").primaryKey(),
  startupId: integer("startup_id").references(() => wizardsStartups.id).notNull(),
  pipelineType: text("pipeline_type").notNull(),
  pipelineName: text("pipeline_name").notNull(),
  provider: text("provider"),
  status: text("status").notNull().default("active"),
  configuration: jsonb("configuration").default('{}'),
  triggers: jsonb("triggers").default('[]').$type<string[]>(),
  stages: jsonb("stages").default('[]').$type<any[]>(),
  environment: text("environment").default("production"),
  isEnabled: boolean("is_enabled").default(true),
  lastRunAt: timestamp("last_run_at"),
  successRate: integer("success_rate"),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  startupIdIdx: index("idx_wizards_pipelines_startup_id").on(table.startupId),
  pipelineTypeIdx: index("idx_wizards_pipelines_type").on(table.pipelineType),
  statusIdx: index("idx_wizards_pipelines_status").on(table.status),
}));

export const wizardsPipelineRuns = pgTable("wizards_pipeline_runs", {
  id: serial("id").primaryKey(),
  pipelineId: integer("pipeline_id").references(() => wizardsAutomationPipelines.id).notNull(),
  runNumber: integer("run_number").notNull(),
  status: text("status").notNull().default("pending"),
  triggerType: text("trigger_type"),
  branch: text("branch"),
  commitHash: text("commit_hash"),
  duration: integer("duration"),
  logs: text("logs"),
  errorMessage: text("error_message"),
  artifacts: jsonb("artifacts").default('[]').$type<any[]>(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  pipelineIdIdx: index("idx_wizards_pipeline_runs_pipeline_id").on(table.pipelineId),
  statusIdx: index("idx_wizards_pipeline_runs_status").on(table.status),
}));

export const wizardsDeployments = pgTable("wizards_deployments", {
  id: serial("id").primaryKey(),
  startupId: integer("startup_id").references(() => wizardsStartups.id).notNull(),
  deploymentType: text("deployment_type").notNull(),
  environment: text("environment").notNull(),
  provider: text("provider").notNull(),
  region: text("region"),
  url: text("url"),
  status: text("status").notNull().default("active"),
  version: text("version"),
  healthStatus: text("health_status").default("unknown"),
  lastHealthCheck: timestamp("last_health_check"),
  configuration: jsonb("configuration").default('{}'),
  resources: jsonb("resources").default('{}'),
  metrics: jsonb("metrics").default('{}'),
  deployedAt: timestamp("deployed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  startupIdIdx: index("idx_wizards_deployments_startup_id").on(table.startupId),
  environmentIdx: index("idx_wizards_deployments_environment").on(table.environment),
  statusIdx: index("idx_wizards_deployments_status").on(table.status),
}));

// Layer 6: Insights & Analytics - Metrics, A/B tests, growth loops
export const wizardsAnalytics = pgTable("wizards_analytics", {
  id: serial("id").primaryKey(),
  startupId: integer("startup_id").references(() => wizardsStartups.id).notNull(),
  metricType: text("metric_type").notNull(),
  metricName: text("metric_name").notNull(),
  value: numeric("value").notNull(),
  previousValue: numeric("previous_value"),
  change: numeric("change"),
  unit: text("unit"),
  dimension: jsonb("dimension").default('{}'),
  timestamp: timestamp("timestamp").defaultNow(),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  startupIdIdx: index("idx_wizards_analytics_startup_id").on(table.startupId),
  metricTypeIdx: index("idx_wizards_analytics_metric_type").on(table.metricType),
  timestampIdx: index("idx_wizards_analytics_timestamp").on(table.timestamp),
}));

export const wizardsExperiments = pgTable("wizards_experiments", {
  id: serial("id").primaryKey(),
  startupId: integer("startup_id").references(() => wizardsStartups.id).notNull(),
  experimentName: text("experiment_name").notNull(),
  experimentType: text("experiment_type").notNull(),
  hypothesis: text("hypothesis"),
  status: text("status").notNull().default("draft"),
  variants: jsonb("variants").default('[]').$type<any[]>(),
  trafficAllocation: jsonb("traffic_allocation").default('{}'),
  successMetrics: jsonb("success_metrics").default('[]').$type<string[]>(),
  results: jsonb("results").default('{}'),
  winner: text("winner"),
  confidence: numeric("confidence"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  startupIdIdx: index("idx_wizards_experiments_startup_id").on(table.startupId),
  statusIdx: index("idx_wizards_experiments_status").on(table.status),
  experimentTypeIdx: index("idx_wizards_experiments_type").on(table.experimentType),
}));

export const wizardsGrowthMetrics = pgTable("wizards_growth_metrics", {
  id: serial("id").primaryKey(),
  startupId: integer("startup_id").references(() => wizardsStartups.id).notNull(),
  date: timestamp("date").notNull(),
  users: integer("users").default(0),
  newUsers: integer("new_users").default(0),
  activeUsers: integer("active_users").default(0),
  revenue: numeric("revenue").default('0'),
  mrr: numeric("mrr").default('0'),
  churnRate: numeric("churn_rate").default('0'),
  conversionRate: numeric("conversion_rate").default('0'),
  cac: numeric("cac").default('0'),
  ltv: numeric("ltv").default('0'),
  growthRate: numeric("growth_rate").default('0'),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  startupIdIdx: index("idx_wizards_growth_metrics_startup_id").on(table.startupId),
  dateIdx: index("idx_wizards_growth_metrics_date").on(table.date),
}));

// Layer 7: Revenue & Monetization - Billing, subscriptions, credits
export const wizardsCreditTransactions = pgTable("wizards_credit_transactions", {
  id: serial("id").primaryKey(),
  founderId: integer("founder_id").references(() => wizardsFounders.id).notNull(),
  transactionType: text("transaction_type").notNull(),
  amount: integer("amount").notNull(),
  balance: integer("balance").notNull(),
  description: text("description"),
  reference: text("reference"),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  founderIdIdx: index("idx_wizards_credits_founder_id").on(table.founderId),
  transactionTypeIdx: index("idx_wizards_credits_type").on(table.transactionType),
}));

export const wizardsSubscriptions = pgTable("wizards_subscriptions", {
  id: serial("id").primaryKey(),
  founderId: integer("founder_id").references(() => wizardsFounders.id).notNull(),
  plan: text("plan").notNull(),
  status: text("status").notNull().default("active"),
  billingCycle: text("billing_cycle").default("monthly"),
  amount: numeric("amount").notNull(),
  currency: text("currency").default("USD"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeCustomerId: text("stripe_customer_id"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  canceledAt: timestamp("canceled_at"),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  founderIdIdx: index("idx_wizards_subscriptions_founder_id").on(table.founderId),
  planIdx: index("idx_wizards_subscriptions_plan").on(table.plan),
  statusIdx: index("idx_wizards_subscriptions_status").on(table.status),
}));

export const wizardsUsageTracking = pgTable("wizards_usage_tracking", {
  id: serial("id").primaryKey(),
  founderId: integer("founder_id").references(() => wizardsFounders.id).notNull(),
  startupId: integer("startup_id").references(() => wizardsStartups.id),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id"),
  quantity: integer("quantity").default(1),
  unit: text("unit").default("count"),
  cost: numeric("cost"),
  timestamp: timestamp("timestamp").defaultNow(),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  founderIdIdx: index("idx_wizards_usage_founder_id").on(table.founderId),
  startupIdIdx: index("idx_wizards_usage_startup_id").on(table.startupId),
  resourceTypeIdx: index("idx_wizards_usage_resource_type").on(table.resourceType),
}));

// Layer 8: GTM & Ecosystem - Partnerships, marketplace, community
export const wizardsReferrals = pgTable("wizards_referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").references(() => wizardsFounders.id).notNull(),
  referredId: integer("referred_id").references(() => wizardsFounders.id),
  referralCode: text("referral_code").notNull().unique(),
  status: text("status").notNull().default("pending"),
  rewardType: text("reward_type"),
  rewardAmount: integer("reward_amount"),
  rewardClaimed: boolean("reward_claimed").default(false),
  convertedAt: timestamp("converted_at"),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  referrerIdIdx: index("idx_wizards_referrals_referrer_id").on(table.referrerId),
  referralCodeIdx: index("idx_wizards_referrals_code").on(table.referralCode),
  statusIdx: index("idx_wizards_referrals_status").on(table.status),
}));

export const wizardsCommunityPosts = pgTable("wizards_community_posts", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id").references(() => wizardsFounders.id).notNull(),
  postType: text("post_type").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category"),
  tags: jsonb("tags").default('[]').$type<string[]>(),
  upvotes: integer("upvotes").default(0),
  views: integer("views").default(0),
  isPublished: boolean("is_published").default(true),
  publishedAt: timestamp("published_at"),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  authorIdIdx: index("idx_wizards_community_author_id").on(table.authorId),
  postTypeIdx: index("idx_wizards_community_post_type").on(table.postType),
  categoryIdx: index("idx_wizards_community_category").on(table.category),
}));

export const wizardsMarketplace = pgTable("wizards_marketplace", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").references(() => wizardsFounders.id).notNull(),
  itemType: text("item_type").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  price: numeric("price").notNull(),
  currency: text("currency").default("USD"),
  previewUrl: text("preview_url"),
  downloadUrl: text("download_url"),
  rating: real("rating").default(0),
  salesCount: integer("sales_count").default(0),
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  sellerIdIdx: index("idx_wizards_marketplace_seller_id").on(table.sellerId),
  itemTypeIdx: index("idx_wizards_marketplace_item_type").on(table.itemType),
  categoryIdx: index("idx_wizards_marketplace_category").on(table.category),
}));

// WAI Orchestration Integration for Wizards Incubator
export const wizardsOrchestrationJobs = pgTable("wizards_orchestration_jobs", {
  id: serial("id").primaryKey(),
  startupId: integer("startup_id").references(() => wizardsStartups.id).notNull(),
  sessionId: integer("session_id").references(() => wizardsStudioSessions.id),
  taskId: integer("task_id").references(() => wizardsStudioTasks.id),
  orchestrationId: text("orchestration_id").notNull(),
  jobType: text("job_type").notNull(),
  workflow: text("workflow").notNull(),
  agents: text("agents").array(),
  providers: jsonb("providers").default('[]').$type<string[]>(),
  models: jsonb("models").default('[]').$type<string[]>(),
  status: text("status").notNull().default("queued"),
  priority: text("priority").default("medium"),
  inputs: jsonb("inputs").default('{}'),
  outputs: jsonb("outputs").default('{}'),
  progress: integer("progress").default(0),
  creditsUsed: integer("credits_used").default(0),
  tokensUsed: integer("tokens_used").default(0),
  cost: numeric("cost").default('0'),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  duration: integer("duration"),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),
  availableAt: timestamp("available_at").defaultNow(),
  backoffMultiplier: integer("backoff_multiplier").default(2),
  cancelledAt: timestamp("cancelled_at"),
  cancelReason: text("cancel_reason"),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  startupIdIdx: index("idx_wizards_orch_jobs_startup_id").on(table.startupId),
  sessionIdIdx: index("idx_wizards_orch_jobs_session_id").on(table.sessionId),
  orchestrationIdIdx: index("idx_wizards_orch_jobs_orchestration_id").on(table.orchestrationId),
  statusIdx: index("idx_wizards_orch_jobs_status").on(table.status),
  jobTypeIdx: index("idx_wizards_orch_jobs_job_type").on(table.jobType),
  availableAtIdx: index("idx_wizards_orch_jobs_available_at").on(table.availableAt),
}));

// ==================================================
// WEEK 2-3: APPLICATION & COHORT MANAGEMENT
// ==================================================

export const wizardsCohorts = pgTable("wizards_cohorts", {
  id: serial("id").primaryKey(),
  cohortId: text("cohort_id").notNull().unique(),
  name: text("name").notNull(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  programType: text("program_type").notNull().default("standard"), // standard, specialized, bootcamp, executive
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  applicationDeadline: timestamp("application_deadline").notNull(),
  maxStartups: integer("max_startups").default(20),
  acceptedStartups: integer("accepted_startups").default(0),
  status: text("status").notNull().default("planning"), // planning, open, in_progress, completed
  curriculum: jsonb("curriculum").default('[]').$type<any[]>(),
  mentors: jsonb("mentors").default('[]').$type<number[]>(),
  investors: jsonb("investors").default('[]').$type<number[]>(),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  cohortIdIdx: index("idx_wizards_cohorts_cohort_id").on(table.cohortId),
  statusIdx: index("idx_wizards_cohorts_status").on(table.status),
  startDateIdx: index("idx_wizards_cohorts_start_date").on(table.startDate),
}));

export const wizardsApplications = pgTable("wizards_applications", {
  id: serial("id").primaryKey(),
  applicationId: text("application_id").notNull().unique(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  cohortId: integer("cohort_id").references(() => wizardsCohorts.id).notNull(),
  founderProfile: jsonb("founder_profile").notNull(),
  startupIdea: jsonb("startup_idea").notNull(),
  teamComposition: jsonb("team_composition").default('[]').$type<any[]>(),
  marketAnalysis: jsonb("market_analysis").default('{}'),
  pitchDeckUrl: text("pitch_deck_url"),
  videoUrl: text("video_url"),
  status: text("status").notNull().default("draft"), // draft, submitted, under_review, accepted, rejected, waitlisted
  score: integer("score"),
  reviewNotes: text("review_notes"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  submittedAt: timestamp("submitted_at"),
  acceptedAt: timestamp("accepted_at"),
  rejectedAt: timestamp("rejected_at"),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  applicationIdIdx: index("idx_wizards_applications_application_id").on(table.applicationId),
  userIdIdx: index("idx_wizards_applications_user_id").on(table.userId),
  cohortIdIdx: index("idx_wizards_applications_cohort_id").on(table.cohortId),
  statusIdx: index("idx_wizards_applications_status").on(table.status),
}));

export const wizardsApplicationReviews = pgTable("wizards_application_reviews", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").references(() => wizardsApplications.id).notNull(),
  reviewerId: integer("reviewer_id").references(() => users.id).notNull(),
  criteriaScores: jsonb("criteria_scores").notNull(), // {innovation: 8, market: 7, team: 9, ...}
  overallScore: integer("overall_score").notNull(),
  strengths: jsonb("strengths").default('[]').$type<string[]>(),
  weaknesses: jsonb("weaknesses").default('[]').$type<string[]>(),
  recommendation: text("recommendation").notNull(), // accept, reject, waitlist
  comments: text("comments"),
  isAiReview: boolean("is_ai_review").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  applicationIdIdx: index("idx_wizards_reviews_application_id").on(table.applicationId),
  reviewerIdIdx: index("idx_wizards_reviews_reviewer_id").on(table.reviewerId),
}));

// ==================================================
// WEEK 5-8: INVESTOR MATCHING PLATFORM
// ==================================================

export const wizardsInvestors = pgTable("wizards_investors", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  investorType: text("investor_type").notNull(), // angel, vc, corporate_vc, accelerator, family_office
  firmName: text("firm_name"),
  fundSize: numeric("fund_size"),
  checkSizeMin: numeric("check_size_min"),
  checkSizeMax: numeric("check_size_max"),
  investmentStage: jsonb("investment_stage").default('[]').$type<string[]>(), // pre_seed, seed, series_a, series_b
  industries: jsonb("industries").default('[]').$type<string[]>(),
  geographies: jsonb("geographies").default('[]').$type<string[]>(),
  portfolio: jsonb("portfolio").default('[]').$type<any[]>(),
  expertise: jsonb("expertise").default('[]').$type<string[]>(),
  linkedinUrl: text("linkedin_url"),
  websiteUrl: text("website_url"),
  bio: text("bio"),
  isAcceptingPitches: boolean("is_accepting_pitches").default(true),
  responseTime: integer("response_time"), // average in hours
  dealCount: integer("deal_count").default(0),
  verified: boolean("verified").default(false),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_wizards_investors_user_id").on(table.userId),
  investorTypeIdx: index("idx_wizards_investors_type").on(table.investorType),
  verifiedIdx: index("idx_wizards_investors_verified").on(table.verified),
}));

export const wizardsInvestorMatches = pgTable("wizards_investor_matches", {
  id: serial("id").primaryKey(),
  startupId: integer("startup_id").references(() => wizardsStartups.id).notNull(),
  investorId: integer("investor_id").references(() => wizardsInvestors.id).notNull(),
  matchScore: integer("match_score").notNull(), // 0-100
  matchReasons: jsonb("match_reasons").default('[]').$type<string[]>(),
  industryMatch: boolean("industry_match").default(false),
  stageMatch: boolean("stage_match").default(false),
  geographyMatch: boolean("geography_match").default(false),
  aiGeneratedInsights: text("ai_generated_insights"),
  status: text("status").notNull().default("suggested"), // suggested, viewed, contacted, responded, passed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  startupIdIdx: index("idx_wizards_investor_matches_startup_id").on(table.startupId),
  investorIdIdx: index("idx_wizards_investor_matches_investor_id").on(table.investorId),
  matchScoreIdx: index("idx_wizards_investor_matches_score").on(table.matchScore),
  statusIdx: index("idx_wizards_investor_matches_status").on(table.status),
}));

export const wizardsInvestorConnections = pgTable("wizards_investor_connections", {
  id: serial("id").primaryKey(),
  startupId: integer("startup_id").references(() => wizardsStartups.id).notNull(),
  investorId: integer("investor_id").references(() => wizardsInvestors.id).notNull(),
  connectionType: text("connection_type").notNull(), // intro_request, direct_message, meeting_scheduled, pitch_submitted
  status: text("status").notNull().default("pending"), // pending, accepted, declined, completed
  message: text("message"),
  pitchDeckUrl: text("pitch_deck_url"),
  scheduledMeetingDate: timestamp("scheduled_meeting_date"),
  outcome: text("outcome"), // interested, passed, follow_up, invested
  feedback: text("feedback"),
  nextSteps: text("next_steps"),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  startupIdIdx: index("idx_wizards_investor_connections_startup_id").on(table.startupId),
  investorIdIdx: index("idx_wizards_investor_connections_investor_id").on(table.investorId),
  statusIdx: index("idx_wizards_investor_connections_status").on(table.status),
}));

// ==================================================
// WEEK 9-12: REAL-TIME AI ASSISTANT (COPILOT)
// ==================================================

export const wizardsAiConversations = pgTable("wizards_ai_conversations", {
  id: serial("id").primaryKey(),
  conversationId: text("conversation_id").notNull().unique(),
  founderId: integer("founder_id").references(() => wizardsFounders.id).notNull(),
  startupId: integer("startup_id").references(() => wizardsStartups.id),
  title: text("title"),
  context: jsonb("context").default('{}'), // current startup data, studio progress, etc.
  status: text("status").notNull().default("active"), // active, archived, deleted
  lastMessageAt: timestamp("last_message_at"),
  messageCount: integer("message_count").default(0),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  conversationIdIdx: index("idx_wizards_ai_conversations_conversation_id").on(table.conversationId),
  founderIdIdx: index("idx_wizards_ai_conversations_founder_id").on(table.founderId),
  startupIdIdx: index("idx_wizards_ai_conversations_startup_id").on(table.startupId),
}));

export const wizardsAiMessages = pgTable("wizards_ai_messages", {
  id: serial("id").primaryKey(),
  messageId: text("message_id").notNull().unique(),
  conversationId: integer("conversation_id").references(() => wizardsAiConversations.id).notNull(),
  role: text("role").notNull(), // user, assistant, system
  content: text("content").notNull(),
  contentType: text("content_type").default("text"), // text, code, image, document
  provider: text("provider"), // openai, anthropic, google, etc.
  model: text("model"),
  tokensUsed: integer("tokens_used"),
  cost: numeric("cost"),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  messageIdIdx: index("idx_wizards_ai_messages_message_id").on(table.messageId),
  conversationIdIdx: index("idx_wizards_ai_messages_conversation_id").on(table.conversationId),
  roleIdx: index("idx_wizards_ai_messages_role").on(table.role),
}));

// ==================================================
// WEEK 13-16: DEMO DAY SHOWCASE PLATFORM
// ==================================================

export const wizardsDemoDays = pgTable("wizards_demo_days", {
  id: serial("id").primaryKey(),
  eventId: text("event_id").notNull().unique(),
  cohortId: integer("cohort_id").references(() => wizardsCohorts.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  eventType: text("event_type").notNull().default("virtual"), // virtual, in_person, hybrid
  eventDate: timestamp("event_date").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  venue: text("venue"),
  streamUrl: text("stream_url"),
  recordingUrl: text("recording_url"),
  registrationRequired: boolean("registration_required").default(true),
  maxAttendees: integer("max_attendees"),
  registeredCount: integer("registered_count").default(0),
  status: text("status").notNull().default("upcoming"), // upcoming, live, completed, cancelled
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  eventIdIdx: index("idx_wizards_demo_days_event_id").on(table.eventId),
  cohortIdIdx: index("idx_wizards_demo_days_cohort_id").on(table.cohortId),
  eventDateIdx: index("idx_wizards_demo_days_event_date").on(table.eventDate),
  statusIdx: index("idx_wizards_demo_days_status").on(table.status),
}));

export const wizardsPitches = pgTable("wizards_pitches", {
  id: serial("id").primaryKey(),
  pitchId: text("pitch_id").notNull().unique(),
  demoDayId: integer("demo_day_id").references(() => wizardsDemoDays.id).notNull(),
  startupId: integer("startup_id").references(() => wizardsStartups.id).notNull(),
  presentationOrder: integer("presentation_order"),
  pitchDeckUrl: text("pitch_deck_url").notNull(),
  videoUrl: text("video_url"),
  liveStreamKey: text("live_stream_key"),
  pitchDuration: integer("pitch_duration").default(5), // minutes
  qaDuration: integer("qa_duration").default(3), // minutes
  status: text("status").notNull().default("scheduled"), // scheduled, presenting, completed, cancelled
  viewCount: integer("view_count").default(0),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  pitchIdIdx: index("idx_wizards_pitches_pitch_id").on(table.pitchId),
  demoDayIdIdx: index("idx_wizards_pitches_demo_day_id").on(table.demoDayId),
  startupIdIdx: index("idx_wizards_pitches_startup_id").on(table.startupId),
}));

export const wizardsPitchFeedback = pgTable("wizards_pitch_feedback", {
  id: serial("id").primaryKey(),
  pitchId: integer("pitch_id").references(() => wizardsPitches.id).notNull(),
  judgeName: text("judge_name").notNull(),
  judgeRole: text("judge_role"),
  scores: jsonb("scores").notNull(), // {clarity: 8, innovation: 9, market: 7, ...}
  overallScore: integer("overall_score").notNull(),
  strengths: jsonb("strengths").default('[]').$type<string[]>(),
  improvements: jsonb("improvements").default('[]').$type<string[]>(),
  comments: text("comments"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  pitchIdIdx: index("idx_wizards_pitch_feedback_pitch_id").on(table.pitchId),
}));

// ==================================================
// WEEK 17-22: MENTOR MATCHING SYSTEM
// ==================================================

export const wizardsMentors = pgTable("wizards_mentors", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  mentorType: text("mentor_type").notNull().default("general"), // general, technical, business, growth, fundraising
  expertise: jsonb("expertise").default('[]').$type<string[]>(),
  industries: jsonb("industries").default('[]').$type<string[]>(),
  yearsExperience: integer("years_experience"),
  currentRole: text("current_role"),
  company: text("company"),
  previousExperience: jsonb("previous_experience").default('[]').$type<any[]>(),
  bio: text("bio"),
  linkedinUrl: text("linkedin_url"),
  availability: text("availability").default("available"), // available, limited, unavailable
  sessionRate: numeric("session_rate"), // 0 for free mentors
  maxMentees: integer("max_mentees").default(5),
  currentMentees: integer("current_mentees").default(0),
  rating: real("rating").default(0),
  sessionsCompleted: integer("sessions_completed").default(0),
  verified: boolean("verified").default(false),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("idx_wizards_mentors_user_id").on(table.userId),
  mentorTypeIdx: index("idx_wizards_mentors_type").on(table.mentorType),
  availabilityIdx: index("idx_wizards_mentors_availability").on(table.availability),
}));

export const wizardsMentorMatches = pgTable("wizards_mentor_matches", {
  id: serial("id").primaryKey(),
  startupId: integer("startup_id").references(() => wizardsStartups.id).notNull(),
  mentorId: integer("mentor_id").references(() => wizardsMentors.id).notNull(),
  matchScore: integer("match_score").notNull(), // 0-100
  matchReasons: jsonb("match_reasons").default('[]').$type<string[]>(),
  aiGeneratedInsights: text("ai_generated_insights"),
  status: text("status").notNull().default("suggested"), // suggested, requested, accepted, declined, active, completed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  startupIdIdx: index("idx_wizards_mentor_matches_startup_id").on(table.startupId),
  mentorIdIdx: index("idx_wizards_mentor_matches_mentor_id").on(table.mentorId),
  statusIdx: index("idx_wizards_mentor_matches_status").on(table.status),
}));

export const wizardsMentorSessions = pgTable("wizards_mentor_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  matchId: integer("match_id").references(() => wizardsMentorMatches.id).notNull(),
  startupId: integer("startup_id").references(() => wizardsStartups.id).notNull(),
  mentorId: integer("mentor_id").references(() => wizardsMentors.id).notNull(),
  sessionType: text("session_type").notNull().default("video_call"), // video_call, in_person, async
  scheduledDate: timestamp("scheduled_date").notNull(),
  duration: integer("duration").default(60), // minutes
  meetingUrl: text("meeting_url"),
  agenda: text("agenda"),
  notes: text("notes"),
  outcomes: jsonb("outcomes").default('[]').$type<string[]>(),
  actionItems: jsonb("action_items").default('[]').$type<any[]>(),
  status: text("status").notNull().default("scheduled"), // scheduled, in_progress, completed, cancelled, no_show
  recordingUrl: text("recording_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  sessionIdIdx: index("idx_wizards_mentor_sessions_session_id").on(table.sessionId),
  matchIdIdx: index("idx_wizards_mentor_sessions_match_id").on(table.matchId),
  statusIdx: index("idx_wizards_mentor_sessions_status").on(table.status),
  scheduledDateIdx: index("idx_wizards_mentor_sessions_scheduled_date").on(table.scheduledDate),
}));

export const wizardsMentorFeedback = pgTable("wizards_mentor_feedback", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => wizardsMentorSessions.id).notNull(),
  fromRole: text("from_role").notNull(), // mentor, mentee
  rating: integer("rating").notNull(), // 1-5
  helpfulness: integer("helpfulness"), // 1-5
  communication: integer("communication"), // 1-5
  expertise: integer("expertise"), // 1-5
  wouldRecommend: boolean("would_recommend").default(true),
  comments: text("comments"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  sessionIdIdx: index("idx_wizards_mentor_feedback_session_id").on(table.sessionId),
}));

// ==================================================
// WEEK 23-28: LEARNING MANAGEMENT SYSTEM (LMS)
// ==================================================

export const wizardsCourses = pgTable("wizards_courses", {
  id: serial("id").primaryKey(),
  courseId: text("course_id").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // product, growth, fundraising, technical, operations
  level: text("level").notNull().default("beginner"), // beginner, intermediate, advanced
  duration: integer("duration"), // total minutes
  instructorName: text("instructor_name"),
  instructorBio: text("instructor_bio"),
  thumbnailUrl: text("thumbnail_url"),
  trailerUrl: text("trailer_url"),
  isPublished: boolean("is_published").default(false),
  isFree: boolean("is_free").default(true),
  price: numeric("price"),
  enrollmentCount: integer("enrollment_count").default(0),
  rating: real("rating").default(0),
  reviewCount: integer("review_count").default(0),
  prerequisites: jsonb("prerequisites").default('[]').$type<string[]>(),
  learningOutcomes: jsonb("learning_outcomes").default('[]').$type<string[]>(),
  tags: jsonb("tags").default('[]').$type<string[]>(),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  courseIdIdx: index("idx_wizards_courses_course_id").on(table.courseId),
  categoryIdx: index("idx_wizards_courses_category").on(table.category),
  isPublishedIdx: index("idx_wizards_courses_is_published").on(table.isPublished),
}));

export const wizardsCourseModules = pgTable("wizards_course_modules", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => wizardsCourses.id).notNull(),
  moduleOrder: integer("module_order").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  duration: integer("duration"), // minutes
  isPreview: boolean("is_preview").default(false),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  courseIdIdx: index("idx_wizards_course_modules_course_id").on(table.courseId),
}));

export const wizardsCourseLessons = pgTable("wizards_course_lessons", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").references(() => wizardsCourseModules.id).notNull(),
  lessonOrder: integer("lesson_order").notNull(),
  title: text("title").notNull(),
  contentType: text("content_type").notNull(), // video, article, quiz, assignment, interactive
  contentUrl: text("content_url"),
  content: text("content"),
  duration: integer("duration"), // minutes
  isPreview: boolean("is_preview").default(false),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  moduleIdIdx: index("idx_wizards_course_lessons_module_id").on(table.moduleId),
}));

export const wizardsCourseEnrollments = pgTable("wizards_course_enrollments", {
  id: serial("id").primaryKey(),
  founderId: integer("founder_id").references(() => wizardsFounders.id).notNull(),
  courseId: integer("course_id").references(() => wizardsCourses.id).notNull(),
  progress: integer("progress").default(0), // 0-100
  status: text("status").notNull().default("enrolled"), // enrolled, in_progress, completed, dropped
  lastAccessedAt: timestamp("last_accessed_at"),
  completedAt: timestamp("completed_at"),
  certificateUrl: text("certificate_url"),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  founderIdIdx: index("idx_wizards_course_enrollments_founder_id").on(table.founderId),
  courseIdIdx: index("idx_wizards_course_enrollments_course_id").on(table.courseId),
  statusIdx: index("idx_wizards_course_enrollments_status").on(table.status),
}));

export const wizardsLessonProgress = pgTable("wizards_lesson_progress", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").references(() => wizardsCourseEnrollments.id).notNull(),
  lessonId: integer("lesson_id").references(() => wizardsCourseLessons.id).notNull(),
  status: text("status").notNull().default("not_started"), // not_started, in_progress, completed
  timeSpent: integer("time_spent").default(0), // seconds
  completedAt: timestamp("completed_at"),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  enrollmentIdIdx: index("idx_wizards_lesson_progress_enrollment_id").on(table.enrollmentId),
  lessonIdIdx: index("idx_wizards_lesson_progress_lesson_id").on(table.lessonId),
}));

// ==================================================
// WEEK 29-34: COMMUNITY & MESSAGING PLATFORM
// ==================================================

export const wizardsForumCategories = pgTable("wizards_forum_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  slug: text("slug").notNull().unique(),
  displayOrder: integer("display_order").default(0),
  postCount: integer("post_count").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  slugIdx: index("idx_wizards_forum_categories_slug").on(table.slug),
}));

export const wizardsForumPosts = pgTable("wizards_forum_posts", {
  id: serial("id").primaryKey(),
  postId: text("post_id").notNull().unique(),
  categoryId: integer("category_id").references(() => wizardsForumCategories.id).notNull(),
  authorId: integer("author_id").references(() => wizardsFounders.id).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  isPinned: boolean("is_pinned").default(false),
  isClosed: boolean("is_closed").default(false),
  views: integer("views").default(0),
  upvotes: integer("upvotes").default(0),
  replyCount: integer("reply_count").default(0),
  lastReplyAt: timestamp("last_reply_at"),
  tags: jsonb("tags").default('[]').$type<string[]>(),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  postIdIdx: index("idx_wizards_forum_posts_post_id").on(table.postId),
  categoryIdIdx: index("idx_wizards_forum_posts_category_id").on(table.categoryId),
  authorIdIdx: index("idx_wizards_forum_posts_author_id").on(table.authorId),
}));

export const wizardsForumReplies = pgTable("wizards_forum_replies", {
  id: serial("id").primaryKey(),
  replyId: text("reply_id").notNull().unique(),
  postId: integer("post_id").references(() => wizardsForumPosts.id).notNull(),
  authorId: integer("author_id").references(() => wizardsFounders.id).notNull(),
  content: text("content").notNull(),
  upvotes: integer("upvotes").default(0),
  isAcceptedAnswer: boolean("is_accepted_answer").default(false),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  replyIdIdx: index("idx_wizards_forum_replies_reply_id").on(table.replyId),
  postIdIdx: index("idx_wizards_forum_replies_post_id").on(table.postId),
  authorIdIdx: index("idx_wizards_forum_replies_author_id").on(table.authorId),
}));

export const wizardsDirectMessages = pgTable("wizards_direct_messages", {
  id: serial("id").primaryKey(),
  messageId: text("message_id").notNull().unique(),
  senderId: integer("sender_id").references(() => wizardsFounders.id).notNull(),
  recipientId: integer("recipient_id").references(() => wizardsFounders.id).notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  attachments: jsonb("attachments").default('[]').$type<any[]>(),
  metadata: jsonb("metadata").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  messageIdIdx: index("idx_wizards_direct_messages_message_id").on(table.messageId),
  senderIdIdx: index("idx_wizards_direct_messages_sender_id").on(table.senderId),
  recipientIdIdx: index("idx_wizards_direct_messages_recipient_id").on(table.recipientId),
  isReadIdx: index("idx_wizards_direct_messages_is_read").on(table.isRead),
}));

// Wizards Incubator Insert Schemas
export const insertWizardsFounderSchema = createInsertSchema(wizardsFounders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWizardsStartupSchema = createInsertSchema(wizardsStartups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWizardsJourneyTimelineSchema = createInsertSchema(wizardsJourneyTimeline).omit({
  id: true,
  createdAt: true,
});

export const insertWizardsStudioSchema = createInsertSchema(wizardsStudios).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWizardsStudioSessionSchema = createInsertSchema(wizardsStudioSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWizardsStudioTaskSchema = createInsertSchema(wizardsStudioTasks).omit({
  id: true,
  createdAt: true,
});

export const insertWizardsStudioDeliverableSchema = createInsertSchema(wizardsStudioDeliverables).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWizardsArtifactSchema = createInsertSchema(wizardsArtifacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWizardsCodeRepositorySchema = createInsertSchema(wizardsCodeRepository).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWizardsDesignAssetSchema = createInsertSchema(wizardsDesignAssets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWizardsFileUploadSchema = createInsertSchema(wizardsFileUploads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWizardsFileUploadChunkSchema = createInsertSchema(wizardsFileUploadChunks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWizardsStorageProviderSchema = createInsertSchema(wizardsStorageProviders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWizardsArtifactVersionSchema = createInsertSchema(wizardsArtifactVersions).omit({
  id: true,
  createdAt: true,
});

export const insertWizardsIndustryTemplateSchema = createInsertSchema(wizardsIndustryTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWizardsTemplateUsageSchema = createInsertSchema(wizardsTemplateUsage).omit({
  id: true,
  createdAt: true,
});

export const insertWizardsAutomationPipelineSchema = createInsertSchema(wizardsAutomationPipelines).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWizardsPipelineRunSchema = createInsertSchema(wizardsPipelineRuns).omit({
  id: true,
  createdAt: true,
});

export const insertWizardsDeploymentSchema = createInsertSchema(wizardsDeployments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWizardsAnalyticSchema = createInsertSchema(wizardsAnalytics).omit({
  id: true,
  createdAt: true,
});

export const insertWizardsExperimentSchema = createInsertSchema(wizardsExperiments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWizardsGrowthMetricSchema = createInsertSchema(wizardsGrowthMetrics).omit({
  id: true,
  createdAt: true,
});

export const insertWizardsCreditTransactionSchema = createInsertSchema(wizardsCreditTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertWizardsSubscriptionSchema = createInsertSchema(wizardsSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWizardsUsageTrackingSchema = createInsertSchema(wizardsUsageTracking).omit({
  id: true,
  createdAt: true,
});

export const insertWizardsReferralSchema = createInsertSchema(wizardsReferrals).omit({
  id: true,
  createdAt: true,
});

export const insertWizardsCommunityPostSchema = createInsertSchema(wizardsCommunityPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWizardsMarketplaceSchema = createInsertSchema(wizardsMarketplace).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWizardsOrchestrationJobSchema = createInsertSchema(wizardsOrchestrationJobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  agents: z.array(z.string()).optional(),
  providers: z.array(z.string()).optional(),
  models: z.array(z.string()).optional(),
});

// Week 2-3: Application & Cohort Management Insert Schemas
export const insertWizardsCohortSchema = createInsertSchema(wizardsCohorts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  curriculum: z.array(z.any()).optional(),
  mentors: z.array(z.number()).optional(),
  investors: z.array(z.number()).optional(),
});

export const updateWizardsCohortSchema = insertWizardsCohortSchema.partial();

export const insertWizardsApplicationSchema = createInsertSchema(wizardsApplications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateWizardsApplicationSchema = insertWizardsApplicationSchema.partial();

export const insertWizardsApplicationReviewSchema = createInsertSchema(wizardsApplicationReviews).omit({
  id: true,
  createdAt: true,
}).extend({
  strengths: z.array(z.string()).optional(),
  improvements: z.array(z.string()).optional(),
});

// Week 5-8: Investor Matching Insert Schemas
export const insertWizardsInvestorSchema = createInsertSchema(wizardsInvestors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  investmentStage: z.array(z.string()).optional(),
  industries: z.array(z.string()).optional(),
  geographies: z.array(z.string()).optional(),
  portfolio: z.array(z.any()).optional(),
  expertise: z.array(z.string()).optional(),
});

export const insertWizardsInvestorMatchSchema = createInsertSchema(wizardsInvestorMatches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  matchReasons: z.array(z.string()).optional(),
});

export const insertWizardsInvestorConnectionSchema = createInsertSchema(wizardsInvestorConnections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Week 9-12: AI Assistant Insert Schemas
export const insertWizardsAiConversationSchema = createInsertSchema(wizardsAiConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWizardsAiMessageSchema = createInsertSchema(wizardsAiMessages).omit({
  id: true,
  createdAt: true,
});

// Week 13-16: Demo Day Insert Schemas
export const insertWizardsDemoDaySchema = createInsertSchema(wizardsDemoDays).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWizardsPitchSchema = createInsertSchema(wizardsPitches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWizardsPitchFeedbackSchema = createInsertSchema(wizardsPitchFeedback).omit({
  id: true,
  createdAt: true,
});

// Week 17-22: Mentor Matching Insert Schemas
export const insertWizardsMentorSchema = createInsertSchema(wizardsMentors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWizardsMentorMatchSchema = createInsertSchema(wizardsMentorMatches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWizardsMentorSessionSchema = createInsertSchema(wizardsMentorSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWizardsMentorFeedbackSchema = createInsertSchema(wizardsMentorFeedback).omit({
  id: true,
  createdAt: true,
});

// Week 23-28: LMS Insert Schemas
export const insertWizardsCourseSchema = createInsertSchema(wizardsCourses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWizardsCourseModuleSchema = createInsertSchema(wizardsCourseModules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWizardsCourseLessonSchema = createInsertSchema(wizardsCourseLessons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWizardsCourseEnrollmentSchema = createInsertSchema(wizardsCourseEnrollments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWizardsLessonProgressSchema = createInsertSchema(wizardsLessonProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Week 29-34: Community & Messaging Insert Schemas
export const insertWizardsForumCategorySchema = createInsertSchema(wizardsForumCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWizardsForumPostSchema = createInsertSchema(wizardsForumPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWizardsForumReplySchema = createInsertSchema(wizardsForumReplies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWizardsDirectMessageSchema = createInsertSchema(wizardsDirectMessages).omit({
  id: true,
  createdAt: true,
});

// WAI Admin Console Type Exports
export type WaiRoutingPolicy = typeof waiRoutingPolicies.$inferSelect;
export type InsertWaiRoutingPolicy = z.infer<typeof insertWaiRoutingPolicySchema>;

export type WaiPipeline = typeof waiPipelines.$inferSelect;
export type InsertWaiPipeline = z.infer<typeof insertWaiPipelineSchema>;

export type WaiObservabilityTrace = typeof waiObservabilityTraces.$inferSelect;
export type InsertWaiObservabilityTrace = z.infer<typeof insertWaiObservabilityTraceSchema>;

export type WaiIncident = typeof waiIncidentManagement.$inferSelect;
export type InsertWaiIncident = z.infer<typeof insertWaiIncidentSchema>;

export type WaiBmadAsset = typeof waiBmadAssets.$inferSelect;
export type InsertWaiBmadAsset = z.infer<typeof insertWaiBmadAssetSchema>;

export type WaiGrpoTrainingJob = typeof waiGrpoTrainingJobs.$inferSelect;
export type InsertWaiGrpoTrainingJob = z.infer<typeof insertWaiGrpoTrainingJobSchema>;

export type WaiTenancySpace = typeof waiTenancySpaces.$inferSelect;
export type InsertWaiTenancySpace = z.infer<typeof insertWaiTenancySpaceSchema>;

export type WaiRbacRole = typeof waiRbacRoles.$inferSelect;
export type InsertWaiRbacRole = z.infer<typeof insertWaiRbacRoleSchema>;

export type WaiSecret = typeof waiSecretsManagement.$inferSelect;
export type InsertWaiSecret = z.infer<typeof insertWaiSecretSchema>;

export type WaiFinOpsBudget = typeof waiFinOpsBudgets.$inferSelect;
export type InsertWaiFinOpsBudget = z.infer<typeof insertWaiFinOpsBudgetSchema>;

export type WaiCostOptimizer = typeof waiCostOptimizer.$inferSelect;
export type InsertWaiCostOptimizer = z.infer<typeof insertWaiCostOptimizerSchema>;

export type WaiMarketplace = typeof waiMarketplace.$inferSelect;
export type InsertWaiMarketplace = z.infer<typeof insertWaiMarketplaceSchema>;

export type WaiIndiaPackService = typeof waiIndiaPackServices.$inferSelect;
export type InsertWaiIndiaPackService = z.infer<typeof insertWaiIndiaPackServiceSchema>;

export type WaiLlmProviderV9 = typeof waiLlmProvidersV9.$inferSelect;
export type InsertWaiLlmProviderV9 = z.infer<typeof insertWaiLlmProvidersV9Schema>;

// WAI Studio Type Exports
export type WaiStudioBlueprint = typeof waiStudioBlueprints.$inferSelect;
export type InsertWaiStudioBlueprint = z.infer<typeof insertWaiStudioBlueprintSchema>;

export type WaiStudioAsset = typeof waiStudioAssets.$inferSelect;
export type InsertWaiStudioAsset = z.infer<typeof insertWaiStudioAssetSchema>;

export type WaiStudioExperiment = typeof waiStudioExperiments.$inferSelect;
export type InsertWaiStudioExperiment = z.infer<typeof insertWaiStudioExperimentSchema>;

export type WaiStudioPublishing = typeof waiStudioPublishing.$inferSelect;
export type InsertWaiStudioPublishing = z.infer<typeof insertWaiStudioPublishingSchema>;

// P0 Roadmap Type Exports
export type P0RoadmapPhase = typeof p0RoadmapPhases.$inferSelect;
export type InsertP0RoadmapPhase = z.infer<typeof insertP0RoadmapPhaseSchema>;

export type P0Milestone = typeof p0Milestones.$inferSelect;
export type InsertP0Milestone = z.infer<typeof insertP0MilestoneSchema>;

export type P0Task = typeof p0Tasks.$inferSelect;
export type InsertP0Task = z.infer<typeof insertP0TaskSchema>;

export type P0QualityGate = typeof p0QualityGates.$inferSelect;
export type InsertP0QualityGate = z.infer<typeof insertP0QualityGateSchema>;

export type P0TaskDependency = typeof p0TaskDependencies.$inferSelect;
export type InsertP0TaskDependency = z.infer<typeof insertP0TaskDependencySchema>;

export type P0ProgressMetric = typeof p0ProgressMetrics.$inferSelect;
export type InsertP0ProgressMetric = z.infer<typeof insertP0ProgressMetricSchema>;

export type FeatureRegistry = typeof featureRegistry.$inferSelect;
export type InsertFeatureRegistry = z.infer<typeof insertFeatureRegistrySchema>;

// Wizards Incubator Type Exports
export type WizardsFounder = typeof wizardsFounders.$inferSelect;
export type InsertWizardsFounder = z.infer<typeof insertWizardsFounderSchema>;

export type WizardsStartup = typeof wizardsStartups.$inferSelect;
export type InsertWizardsStartup = z.infer<typeof insertWizardsStartupSchema>;

export type WizardsJourneyTimeline = typeof wizardsJourneyTimeline.$inferSelect;
export type InsertWizardsJourneyTimeline = z.infer<typeof insertWizardsJourneyTimelineSchema>;

export type WizardsStudio = typeof wizardsStudios.$inferSelect;
export type InsertWizardsStudio = z.infer<typeof insertWizardsStudioSchema>;

export type WizardsStudioSession = typeof wizardsStudioSessions.$inferSelect;
export type InsertWizardsStudioSession = z.infer<typeof insertWizardsStudioSessionSchema>;

export type WizardsStudioTask = typeof wizardsStudioTasks.$inferSelect;
export type InsertWizardsStudioTask = z.infer<typeof insertWizardsStudioTaskSchema>;

export type WizardsStudioDeliverable = typeof wizardsStudioDeliverables.$inferSelect;
export type InsertWizardsStudioDeliverable = z.infer<typeof insertWizardsStudioDeliverableSchema>;

export type WizardsArtifact = typeof wizardsArtifacts.$inferSelect;
export type InsertWizardsArtifact = z.infer<typeof insertWizardsArtifactSchema>;

export type WizardsCodeRepository = typeof wizardsCodeRepository.$inferSelect;
export type InsertWizardsCodeRepository = z.infer<typeof insertWizardsCodeRepositorySchema>;

export type WizardsDesignAsset = typeof wizardsDesignAssets.$inferSelect;
export type InsertWizardsDesignAsset = z.infer<typeof insertWizardsDesignAssetSchema>;

export type WizardsFileUpload = typeof wizardsFileUploads.$inferSelect;
export type InsertWizardsFileUpload = z.infer<typeof insertWizardsFileUploadSchema>;

export type WizardsFileUploadChunk = typeof wizardsFileUploadChunks.$inferSelect;
export type InsertWizardsFileUploadChunk = z.infer<typeof insertWizardsFileUploadChunkSchema>;

export type WizardsStorageProvider = typeof wizardsStorageProviders.$inferSelect;
export type InsertWizardsStorageProvider = z.infer<typeof insertWizardsStorageProviderSchema>;

export type WizardsArtifactVersion = typeof wizardsArtifactVersions.$inferSelect;
export type InsertWizardsArtifactVersion = z.infer<typeof insertWizardsArtifactVersionSchema>;

export type WizardsIndustryTemplate = typeof wizardsIndustryTemplates.$inferSelect;
export type InsertWizardsIndustryTemplate = z.infer<typeof insertWizardsIndustryTemplateSchema>;

export type WizardsTemplateUsage = typeof wizardsTemplateUsage.$inferSelect;
export type InsertWizardsTemplateUsage = z.infer<typeof insertWizardsTemplateUsageSchema>;

export type WizardsAutomationPipeline = typeof wizardsAutomationPipelines.$inferSelect;
export type InsertWizardsAutomationPipeline = z.infer<typeof insertWizardsAutomationPipelineSchema>;

export type WizardsPipelineRun = typeof wizardsPipelineRuns.$inferSelect;
export type InsertWizardsPipelineRun = z.infer<typeof insertWizardsPipelineRunSchema>;

export type WizardsDeployment = typeof wizardsDeployments.$inferSelect;
export type InsertWizardsDeployment = z.infer<typeof insertWizardsDeploymentSchema>;

export type WizardsAnalytic = typeof wizardsAnalytics.$inferSelect;
export type InsertWizardsAnalytic = z.infer<typeof insertWizardsAnalyticSchema>;

export type WizardsExperiment = typeof wizardsExperiments.$inferSelect;
export type InsertWizardsExperiment = z.infer<typeof insertWizardsExperimentSchema>;

export type WizardsGrowthMetric = typeof wizardsGrowthMetrics.$inferSelect;
export type InsertWizardsGrowthMetric = z.infer<typeof insertWizardsGrowthMetricSchema>;

export type WizardsCreditTransaction = typeof wizardsCreditTransactions.$inferSelect;
export type InsertWizardsCreditTransaction = z.infer<typeof insertWizardsCreditTransactionSchema>;

export type WizardsSubscription = typeof wizardsSubscriptions.$inferSelect;
export type InsertWizardsSubscription = z.infer<typeof insertWizardsSubscriptionSchema>;

export type WizardsUsageTracking = typeof wizardsUsageTracking.$inferSelect;
export type InsertWizardsUsageTracking = z.infer<typeof insertWizardsUsageTrackingSchema>;

export type WizardsReferral = typeof wizardsReferrals.$inferSelect;
export type InsertWizardsReferral = z.infer<typeof insertWizardsReferralSchema>;

export type WizardsCommunityPost = typeof wizardsCommunityPosts.$inferSelect;
export type InsertWizardsCommunityPost = z.infer<typeof insertWizardsCommunityPostSchema>;

export type WizardsMarketplace = typeof wizardsMarketplace.$inferSelect;
export type InsertWizardsMarketplace = z.infer<typeof insertWizardsMarketplaceSchema>;

export type WizardsOrchestrationJob = typeof wizardsOrchestrationJobs.$inferSelect;
export type InsertWizardsOrchestrationJob = z.infer<typeof insertWizardsOrchestrationJobSchema>;

// Week 2-3: Application & Cohort Management Type Exports
export type WizardsCohort = typeof wizardsCohorts.$inferSelect;
export type InsertWizardsCohort = z.infer<typeof insertWizardsCohortSchema>;

export type WizardsApplication = typeof wizardsApplications.$inferSelect;
export type InsertWizardsApplication = z.infer<typeof insertWizardsApplicationSchema>;

export type WizardsApplicationReview = typeof wizardsApplicationReviews.$inferSelect;
export type InsertWizardsApplicationReview = z.infer<typeof insertWizardsApplicationReviewSchema>;

// Week 5-8: Investor Matching Type Exports
export type WizardsInvestor = typeof wizardsInvestors.$inferSelect;
export type InsertWizardsInvestor = z.infer<typeof insertWizardsInvestorSchema>;

export type WizardsInvestorMatch = typeof wizardsInvestorMatches.$inferSelect;
export type InsertWizardsInvestorMatch = z.infer<typeof insertWizardsInvestorMatchSchema>;

export type WizardsInvestorConnection = typeof wizardsInvestorConnections.$inferSelect;
export type InsertWizardsInvestorConnection = z.infer<typeof insertWizardsInvestorConnectionSchema>;

// Week 9-12: AI Assistant Type Exports
export type WizardsAiConversation = typeof wizardsAiConversations.$inferSelect;
export type InsertWizardsAiConversation = z.infer<typeof insertWizardsAiConversationSchema>;

export type WizardsAiMessage = typeof wizardsAiMessages.$inferSelect;
export type InsertWizardsAiMessage = z.infer<typeof insertWizardsAiMessageSchema>;

// Week 13-16: Demo Day Type Exports
export type WizardsDemoDay = typeof wizardsDemoDays.$inferSelect;
export type InsertWizardsDemoDay = z.infer<typeof insertWizardsDemoDaySchema>;

export type WizardsPitch = typeof wizardsPitches.$inferSelect;
export type InsertWizardsPitch = z.infer<typeof insertWizardsPitchSchema>;

export type WizardsPitchFeedback = typeof wizardsPitchFeedback.$inferSelect;
export type InsertWizardsPitchFeedback = z.infer<typeof insertWizardsPitchFeedbackSchema>;

// Week 17-22: Mentor Matching Type Exports
export type WizardsMentor = typeof wizardsMentors.$inferSelect;
export type InsertWizardsMentor = z.infer<typeof insertWizardsMentorSchema>;

export type WizardsMentorMatch = typeof wizardsMentorMatches.$inferSelect;
export type InsertWizardsMentorMatch = z.infer<typeof insertWizardsMentorMatchSchema>;

export type WizardsMentorSession = typeof wizardsMentorSessions.$inferSelect;
export type InsertWizardsMentorSession = z.infer<typeof insertWizardsMentorSessionSchema>;

export type WizardsMentorFeedback = typeof wizardsMentorFeedback.$inferSelect;
export type InsertWizardsMentorFeedback = z.infer<typeof insertWizardsMentorFeedbackSchema>;

// Week 23-28: LMS Type Exports
export type WizardsCourse = typeof wizardsCourses.$inferSelect;
export type InsertWizardsCourse = z.infer<typeof insertWizardsCourseSchema>;

export type WizardsCourseModule = typeof wizardsCourseModules.$inferSelect;
export type InsertWizardsCourseModule = z.infer<typeof insertWizardsCourseModuleSchema>;

export type WizardsCourseLesson = typeof wizardsCourseLessons.$inferSelect;
export type InsertWizardsCourseLesson = z.infer<typeof insertWizardsCourseLessonSchema>;

export type WizardsCourseEnrollment = typeof wizardsCourseEnrollments.$inferSelect;
export type InsertWizardsCourseEnrollment = z.infer<typeof insertWizardsCourseEnrollmentSchema>;

export type WizardsLessonProgress = typeof wizardsLessonProgress.$inferSelect;
export type InsertWizardsLessonProgress = z.infer<typeof insertWizardsLessonProgressSchema>;

// Week 29-34: Community & Messaging Type Exports
export type WizardsForumCategory = typeof wizardsForumCategories.$inferSelect;
export type InsertWizardsForumCategory = z.infer<typeof insertWizardsForumCategorySchema>;

export type WizardsForumPost = typeof wizardsForumPosts.$inferSelect;
export type InsertWizardsForumPost = z.infer<typeof insertWizardsForumPostSchema>;

export type WizardsForumReply = typeof wizardsForumReplies.$inferSelect;
export type InsertWizardsForumReply = z.infer<typeof insertWizardsForumReplySchema>;

export type WizardsDirectMessage = typeof wizardsDirectMessages.$inferSelect;
export type InsertWizardsDirectMessage = z.infer<typeof insertWizardsDirectMessageSchema>;

// ============================================================================
// EMAIL PARSING SYSTEM - Comprehensive Email Management & Processing
// ============================================================================

// Email Accounts/Connections
export const emailAccounts = pgTable("email_accounts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  provider: text("provider").notNull(), // imap, gmail_api, outlook, exchange
  email: text("email").notNull(),
  displayName: text("display_name"),
  
  // Connection details
  imapHost: text("imap_host"),
  imapPort: integer("imap_port"),
  imapSecure: boolean("imap_secure").default(true),
  smtpHost: text("smtp_host"),
  smtpPort: integer("smtp_port"),
  smtpSecure: boolean("smtp_secure").default(true),
  
  // Authentication
  password: text("password"), // encrypted
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiry: timestamp("token_expiry"),
  
  // Status & sync
  status: text("status").notNull().default("active"), // active, paused, error, disconnected
  lastSyncAt: timestamp("last_sync_at"),
  lastError: text("last_error"),
  syncInterval: integer("sync_interval").default(300), // seconds
  
  // Settings
  autoSync: boolean("auto_sync").default(true),
  parseAttachments: boolean("parse_attachments").default(true),
  parseHtml: boolean("parse_html").default(true),
  maxAttachmentSize: integer("max_attachment_size").default(26214400), // 25MB
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  emailIdx: index("email_account_email_idx").on(table.email),
  userIdIdx: index("email_account_user_idx").on(table.userId),
}));

// Email Messages
export const emailMessages = pgTable("email_messages", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => emailAccounts.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Email identifiers
  messageId: text("message_id").notNull(), // RFC822 Message-ID
  threadId: text("thread_id"), // Email thread identifier
  inReplyTo: text("in_reply_to"),
  references: text("references").array(),
  
  // Headers
  from: jsonb("from").notNull(), // {name, address}
  to: jsonb("to").notNull().default(sql`'[]'::jsonb`), // [{name, address}]
  cc: jsonb("cc").default(sql`'[]'::jsonb`),
  bcc: jsonb("bcc").default(sql`'[]'::jsonb`),
  replyTo: jsonb("reply_to"),
  
  // Content
  subject: text("subject"),
  textBody: text("text_body"),
  htmlBody: text("html_body"),
  snippet: text("snippet"), // First 200 chars
  
  // Metadata
  date: timestamp("date").notNull(),
  receivedAt: timestamp("received_at").defaultNow(),
  size: integer("size"), // bytes
  
  // Flags & labels
  isRead: boolean("is_read").default(false),
  isStarred: boolean("is_starred").default(false),
  isImportant: boolean("is_important").default(false),
  isFlagged: boolean("is_flagged").default(false),
  labels: text("labels").array().default(sql`'{}'::text[]`),
  folder: text("folder").default("INBOX"),
  
  // Processing
  isParsed: boolean("is_parsed").default(false),
  parseStatus: text("parse_status").default("pending"), // pending, processing, completed, failed
  parseError: text("parse_error"),
  extractedData: jsonb("extracted_data"), // AI-extracted information
  
  // Attachments
  hasAttachments: boolean("has_attachments").default(false),
  attachmentCount: integer("attachment_count").default(0),
  
  // Security
  spamScore: integer("spam_score"),
  isSpam: boolean("is_spam").default(false),
  hasPhishing: boolean("has_phishing").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  messageIdIdx: index("email_message_id_idx").on(table.messageId),
  threadIdIdx: index("email_thread_id_idx").on(table.threadId),
  accountIdIdx: index("email_account_id_idx").on(table.accountId),
  dateIdx: index("email_date_idx").on(table.date),
  folderIdx: index("email_folder_idx").on(table.folder),
}));

// Email Attachments
export const emailAttachments = pgTable("email_attachments", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").references(() => emailMessages.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // File details
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(), // bytes
  contentId: text("content_id"), // For inline images
  
  // Storage
  storageUrl: text("storage_url"), // S3/cloud storage URL
  localPath: text("local_path"),
  checksum: text("checksum"), // MD5 hash
  
  // Processing
  isParsed: boolean("is_parsed").default(false),
  parseStatus: text("parse_status").default("pending"),
  extractedText: text("extracted_text"), // OCR/PDF text
  extractedData: jsonb("extracted_data"), // Structured data
  
  // Metadata
  isInline: boolean("is_inline").default(false),
  isEmbedded: boolean("is_embedded").default(false),
  encoding: text("encoding"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  messageIdIdx: index("attachment_message_idx").on(table.messageId),
}));

// Email Threads
export const emailThreads = pgTable("email_threads", {
  id: serial("id").primaryKey(),
  threadId: text("thread_id").notNull().unique(),
  accountId: integer("account_id").references(() => emailAccounts.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Thread metadata
  subject: text("subject"),
  participantCount: integer("participant_count").default(0),
  messageCount: integer("message_count").default(0),
  
  // First & last messages
  firstMessageAt: timestamp("first_message_at"),
  lastMessageAt: timestamp("last_message_at"),
  lastMessageFrom: jsonb("last_message_from"),
  
  // Status
  isRead: boolean("is_read").default(false),
  isStarred: boolean("is_starred").default(false),
  labels: text("labels").array().default(sql`'{}'::text[]`),
  
  // AI Analysis
  summary: text("summary"), // AI-generated thread summary
  sentiment: text("sentiment"), // positive, negative, neutral
  priority: text("priority"), // high, medium, low
  category: text("category"), // work, personal, marketing, etc.
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  threadIdIdx: index("thread_id_idx").on(table.threadId),
  accountIdIdx: index("thread_account_idx").on(table.accountId),
}));

// Email Parse Jobs
export const emailParseJobs = pgTable("email_parse_jobs", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => emailAccounts.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Job details
  jobType: text("job_type").notNull(), // full_sync, incremental, single_message, attachment
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  
  // Progress
  totalItems: integer("total_items").default(0),
  processedItems: integer("processed_items").default(0),
  failedItems: integer("failed_items").default(0),
  
  // Results
  newMessages: integer("new_messages").default(0),
  updatedMessages: integer("updated_messages").default(0),
  parsedAttachments: integer("parsed_attachments").default(0),
  
  // Timing
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  duration: integer("duration"), // milliseconds
  
  // Error handling
  error: text("error"),
  errorStack: text("error_stack"),
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),
  
  // Metadata
  config: jsonb("config").default('{}'),
  results: jsonb("results").default('{}'),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  accountIdIdx: index("parse_job_account_idx").on(table.accountId),
  statusIdx: index("parse_job_status_idx").on(table.status),
}));

// Email Templates (for sending)
export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"), // personal, business, marketing
  
  // Template content
  subject: text("subject").notNull(),
  htmlBody: text("html_body"),
  textBody: text("text_body"),
  
  // Variables
  variables: jsonb("variables").default(sql`'[]'::jsonb`), // [{name, type, default}]
  
  // Usage
  useCount: integer("use_count").default(0),
  lastUsedAt: timestamp("last_used_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schema exports for email tables
export const insertEmailAccountSchema = createInsertSchema(emailAccounts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEmailMessageSchema = createInsertSchema(emailMessages).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEmailAttachmentSchema = createInsertSchema(emailAttachments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEmailThreadSchema = createInsertSchema(emailThreads).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEmailParseJobSchema = createInsertSchema(emailParseJobs).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({ id: true, createdAt: true, updatedAt: true });

// Type exports
export type EmailAccount = typeof emailAccounts.$inferSelect;
export type InsertEmailAccount = z.infer<typeof insertEmailAccountSchema>;

export type EmailMessage = typeof emailMessages.$inferSelect;
export type InsertEmailMessage = z.infer<typeof insertEmailMessageSchema>;

export type EmailAttachment = typeof emailAttachments.$inferSelect;
export type InsertEmailAttachment = z.infer<typeof insertEmailAttachmentSchema>;

export type EmailThread = typeof emailThreads.$inferSelect;
export type InsertEmailThread = z.infer<typeof insertEmailThreadSchema>;

export type EmailParseJob = typeof emailParseJobs.$inferSelect;
export type InsertEmailParseJob = z.infer<typeof insertEmailParseJobSchema>;

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;

// ================================================================================================
// DOCUMENT PARSING SYSTEM - Multimodal Document Processing with OCR
// ================================================================================================

// Main document parsing table
export const documentParsing = pgTable("document_parsing", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  assistantId: integer("assistant_id").references(() => aiAssistants.id),
  
  // Document metadata
  fileName: text("file_name").notNull(),
  originalFileName: text("original_file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size"), // bytes
  mimeType: text("mime_type").notNull(),
  documentType: text("document_type").notNull(), // pdf, image, docx, xlsx, pptx, txt
  
  // Processing status
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  processingStartedAt: timestamp("processing_started_at"),
  processingCompletedAt: timestamp("processing_completed_at"),
  processingDuration: integer("processing_duration"), // milliseconds
  
  // Extracted metadata
  pageCount: integer("page_count").default(0),
  wordCount: integer("word_count").default(0),
  characterCount: integer("character_count").default(0),
  language: text("language").default("en"),
  author: text("author"),
  title: text("title"),
  subject: text("subject"),
  keywords: jsonb("keywords").default(sql`'[]'::jsonb`),
  
  // OCR & Text Extraction
  ocrEnabled: boolean("ocr_enabled").default(true),
  ocrProvider: text("ocr_provider").default("tesseract"), // tesseract, google-vision, aws-textract
  ocrLanguages: jsonb("ocr_languages").default(sql`'["eng"]'::jsonb`),
  textExtractionMethod: text("text_extraction_method"), // native, ocr, hybrid
  extractedText: text("extracted_text"),
  
  // Multimodal content
  hasImages: boolean("has_images").default(false),
  imageCount: integer("image_count").default(0),
  hasTables: boolean("has_tables").default(false),
  tableCount: integer("table_count").default(0),
  hasCharts: boolean("has_charts").default(false),
  chartCount: integer("chart_count").default(0),
  
  // RAG Integration
  ragEnabled: boolean("rag_enabled").default(true),
  embeddingModel: text("embedding_model").default("text-embedding-3-small"),
  chunked: boolean("chunked").default(false),
  chunkCount: integer("chunk_count").default(0),
  vectorized: boolean("vectorized").default(false),
  
  // Error handling
  error: text("error"),
  errorStack: text("error_stack"),
  retryCount: integer("retry_count").default(0),
  
  // Metadata & Settings
  settings: jsonb("settings").default(sql`'{}'::jsonb`),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("doc_parsing_user_idx").on(table.userId),
  statusIdx: index("doc_parsing_status_idx").on(table.status),
  typeIdx: index("doc_parsing_type_idx").on(table.documentType),
}));

// Document pages (for PDFs, presentations, etc.)
export const documentPages = pgTable("document_pages", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documentParsing.id, { onDelete: "cascade" }).notNull(),
  
  pageNumber: integer("page_number").notNull(),
  pageType: text("page_type").default("standard"), // standard, cover, toc, appendix
  
  // Page content
  text: text("text"),
  rawText: text("raw_text"), // unprocessed text
  html: text("html"),
  markdown: text("markdown"),
  
  // Visual elements
  imageUrl: text("image_url"), // rendered page image
  thumbnailUrl: text("thumbnail_url"),
  width: integer("width"),
  height: integer("height"),
  
  // Extracted elements on this page
  images: jsonb("images").default(sql`'[]'::jsonb`), // array of image objects
  tables: jsonb("tables").default(sql`'[]'::jsonb`), // array of table data
  charts: jsonb("charts").default(sql`'[]'::jsonb`), // array of chart data
  
  // OCR results
  ocrConfidence: real("ocr_confidence"), // 0-1
  ocrText: text("ocr_text"),
  ocrBoundingBoxes: jsonb("ocr_bounding_boxes").default(sql`'[]'::jsonb`),
  
  // Metadata
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  documentIdIdx: index("doc_pages_document_idx").on(table.documentId),
  pageNumberIdx: index("doc_pages_number_idx").on(table.documentId, table.pageNumber),
}));

// Extracted content (images, tables, charts)
export const documentExtractedContent = pgTable("document_extracted_content", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documentParsing.id, { onDelete: "cascade" }).notNull(),
  pageId: integer("page_id").references(() => documentPages.id, { onDelete: "cascade" }),
  
  contentType: text("content_type").notNull(), // image, table, chart, diagram, formula
  contentIndex: integer("content_index").notNull(), // position in document
  
  // Content data
  extractedData: jsonb("extracted_data").notNull(), // structured content
  rawData: text("raw_data"),
  
  // Image-specific
  imageUrl: text("image_url"),
  imagePath: text("image_path"),
  imageWidth: integer("image_width"),
  imageHeight: integer("image_height"),
  imageFormat: text("image_format"),
  
  // OCR for images
  ocrText: text("ocr_text"),
  ocrConfidence: real("ocr_confidence"),
  
  // Table-specific
  tableHeaders: jsonb("table_headers").default(sql`'[]'::jsonb`),
  tableRows: jsonb("table_rows").default(sql`'[]'::jsonb`),
  tableFormat: text("table_format"), // csv, json, markdown
  
  // Embedding for semantic search
  embedding: jsonb("embedding"),
  embeddingModel: text("embedding_model"),
  
  // Bounding box
  boundingBox: jsonb("bounding_box"), // {x, y, width, height}
  
  // Metadata
  caption: text("caption"),
  altText: text("alt_text"),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  documentIdIdx: index("doc_extracted_document_idx").on(table.documentId),
  typeIdx: index("doc_extracted_type_idx").on(table.contentType),
  pageIdIdx: index("doc_extracted_page_idx").on(table.pageId),
}));

// OCR Results (detailed OCR analysis)
export const ocrResults = pgTable("ocr_results", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documentParsing.id, { onDelete: "cascade" }).notNull(),
  pageId: integer("page_id").references(() => documentPages.id, { onDelete: "cascade" }),
  extractedContentId: integer("extracted_content_id").references(() => documentExtractedContent.id, { onDelete: "cascade" }),
  
  // OCR provider
  provider: text("provider").notNull(), // tesseract, google-vision, aws-textract, azure
  model: text("model"),
  language: text("language").default("eng"),
  
  // OCR output
  fullText: text("full_text"),
  words: jsonb("words").default(sql`'[]'::jsonb`), // array of word objects with confidence & bbox
  lines: jsonb("lines").default(sql`'[]'::jsonb`), // array of line objects
  paragraphs: jsonb("paragraphs").default(sql`'[]'::jsonb`), // array of paragraph objects
  blocks: jsonb("blocks").default(sql`'[]'::jsonb`), // text blocks
  
  // Confidence metrics
  averageConfidence: real("average_confidence"),
  minConfidence: real("min_confidence"),
  maxConfidence: real("max_confidence"),
  
  // Processing info
  processingTime: integer("processing_time"), // milliseconds
  cost: real("cost"), // API cost in USD
  
  // Raw results
  rawResult: jsonb("raw_result"), // full provider response
  
  // Metadata
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  documentIdIdx: index("ocr_results_document_idx").on(table.documentId),
  pageIdIdx: index("ocr_results_page_idx").on(table.pageId),
  providerIdx: index("ocr_results_provider_idx").on(table.provider),
}));

// Document processing jobs
export const documentProcessingJobs = pgTable("document_processing_jobs", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documentParsing.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  jobType: text("job_type").notNull(), // parse, ocr, extract_images, extract_tables, chunk, embed
  status: text("status").notNull().default("pending"), // pending, running, completed, failed
  
  // Progress tracking
  progress: real("progress").default(0), // 0-100
  currentStep: text("current_step"),
  totalSteps: integer("total_steps"),
  completedSteps: integer("completed_steps").default(0),
  
  // Results
  resultData: jsonb("result_data"),
  error: text("error"),
  
  // Timing
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  duration: integer("duration"), // milliseconds
  
  // Settings
  settings: jsonb("settings").default(sql`'{}'::jsonb`),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  documentIdIdx: index("doc_jobs_document_idx").on(table.documentId),
  statusIdx: index("doc_jobs_status_idx").on(table.status),
  typeIdx: index("doc_jobs_type_idx").on(table.jobType),
}));

// ================================================================================================
// MULTIMODAL RAG SYSTEM - Vector Embeddings for Semantic Search (Phase 6.2)
// ================================================================================================

// Vector embeddings table for semantic search
export const documentEmbeddings = pgTable("document_embeddings", {
  id: serial("id").primaryKey(),
  
  // References
  documentId: integer("document_id").references(() => documentParsing.id, { onDelete: "cascade" }).notNull(),
  chunkId: integer("chunk_id").references(() => documentExtractedContent.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id).notNull(),
  assistantId: integer("assistant_id").references(() => aiAssistants.id),
  
  // Content
  text: text("text").notNull(), // The text that was embedded
  textHash: text("text_hash").notNull(), // Hash for deduplication
  
  // Vector embedding
  embedding: vector("embedding").notNull(), // 1536-dimensional vector for text-embedding-3-small
  
  // Embedding metadata
  model: text("model").notNull().default("text-embedding-3-small"),
  provider: text("provider").notNull().default("openai"),
  dimensions: integer("dimensions").notNull().default(1536),
  
  // Chunk metadata
  chunkIndex: integer("chunk_index"), // Position in document
  startPosition: integer("start_position"),
  endPosition: integer("end_position"),
  wordCount: integer("word_count"),
  characterCount: integer("character_count"),
  
  // Document context
  documentType: text("document_type"), // pdf, image, text, office
  sourceFileName: text("source_file_name"),
  
  // Metadata for filtering
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  tags: jsonb("tags").default(sql`'[]'::jsonb`),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  documentIdIdx: index("embeddings_document_idx").on(table.documentId),
  userIdIdx: index("embeddings_user_idx").on(table.userId),
  assistantIdIdx: index("embeddings_assistant_idx").on(table.assistantId),
  textHashIdx: index("embeddings_text_hash_idx").on(table.textHash),
  // Vector similarity index using HNSW (Hierarchical Navigable Small World) for fast approximate search
  embeddingIdx: index("embeddings_vector_idx").using('hnsw', table.embedding.op("vector_cosine_ops")),
}));

// Schema exports for document parsing
export const insertDocumentParsingSchema = createInsertSchema(documentParsing).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDocumentPageSchema = createInsertSchema(documentPages).omit({ id: true, createdAt: true });
export const insertDocumentExtractedContentSchema = createInsertSchema(documentExtractedContent).omit({ id: true, createdAt: true });
export const insertOcrResultSchema = createInsertSchema(ocrResults).omit({ id: true, createdAt: true });
export const insertDocumentProcessingJobSchema = createInsertSchema(documentProcessingJobs).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDocumentEmbeddingSchema = createInsertSchema(documentEmbeddings).omit({ id: true, createdAt: true, updatedAt: true });

// Type exports
export type DocumentParsing = typeof documentParsing.$inferSelect;
export type InsertDocumentParsing = z.infer<typeof insertDocumentParsingSchema>;

export type DocumentPage = typeof documentPages.$inferSelect;
export type InsertDocumentPage = z.infer<typeof insertDocumentPageSchema>;

export type DocumentExtractedContent = typeof documentExtractedContent.$inferSelect;
export type InsertDocumentExtractedContent = z.infer<typeof insertDocumentExtractedContentSchema>;

export type OcrResult = typeof ocrResults.$inferSelect;
export type InsertOcrResult = z.infer<typeof insertOcrResultSchema>;

export type DocumentProcessingJob = typeof documentProcessingJobs.$inferSelect;
export type InsertDocumentProcessingJob = z.infer<typeof insertDocumentProcessingJobSchema>;

export type DocumentEmbedding = typeof documentEmbeddings.$inferSelect;
export type InsertDocumentEmbedding = z.infer<typeof insertDocumentEmbeddingSchema>;

// ================================================================================================
// COMPETITOR ANALYSIS SYSTEM - Market Intelligence & Competitive Tracking
// ================================================================================================

// Main Competitors Table
export const wizardsCompetitors = pgTable("wizards_competitors", {
  id: serial("id").primaryKey(),
  startupId: integer("startup_id").references(() => wizardsStartups.id, { onDelete: "cascade" }).notNull(),
  sessionId: integer("session_id").references(() => wizardsStudioSessions.id, { onDelete: "cascade" }),
  
  // Basic Info
  name: text("name").notNull(),
  website: text("website"),
  description: text("description"),
  logo: text("logo"),
  
  // Company Details
  foundedYear: integer("founded_year"),
  location: text("location"),
  teamSize: text("team_size"), // "1-10", "11-50", "51-200", etc.
  fundingStage: text("funding_stage"), // "pre-seed", "seed", "series-a", etc.
  totalFunding: numeric("total_funding", { precision: 15, scale: 2 }),
  fundingCurrency: text("funding_currency").default("USD"),
  
  // Market Position
  marketPosition: text("market_position"), // "leader", "challenger", "niche", "emerging"
  targetAudience: jsonb("target_audience").default(sql`'[]'::jsonb`),
  geographicReach: jsonb("geographic_reach").default(sql`'[]'::jsonb`),
  
  // Business Model
  revenueModel: text("revenue_model"), // "subscription", "freemium", "one-time", "marketplace"
  pricingTiers: jsonb("pricing_tiers").default(sql`'[]'::jsonb`),
  
  // Tech Stack
  technologies: jsonb("technologies").default(sql`'[]'::jsonb`),
  platforms: jsonb("platforms").default(sql`'[]'::jsonb`), // web, mobile, desktop
  
  // Metrics
  estimatedRevenue: numeric("estimated_revenue", { precision: 15, scale: 2 }),
  estimatedUsers: integer("estimated_users"),
  monthlyTraffic: integer("monthly_traffic"),
  growthRate: real("growth_rate"), // percentage
  
  // Social Presence
  socialLinks: jsonb("social_links").default(sql`'{}'::jsonb`), // linkedin, twitter, etc.
  socialFollowers: jsonb("social_followers").default(sql`'{}'::jsonb`),
  
  // Competitive Analysis
  strengthsAnalysis: text("strengths_analysis"),
  weaknessesAnalysis: text("weaknesses_analysis"),
  threatLevel: text("threat_level").default("medium"), // "low", "medium", "high", "critical"
  
  // AI Insights
  aiAnalysis: jsonb("ai_analysis").default(sql`'{}'::jsonb`),
  competitiveScore: integer("competitive_score"), // 0-100
  differentiationOpportunities: jsonb("differentiation_opportunities").default(sql`'[]'::jsonb`),
  
  // Status & Tracking
  isActive: boolean("is_active").default(true),
  lastUpdated: timestamp("last_updated").defaultNow(),
  dataSource: text("data_source"), // "manual", "web_scraping", "api", "ai_research"
  
  // Metadata
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  startupIdIdx: index("competitors_startup_idx").on(table.startupId),
  sessionIdIdx: index("competitors_session_idx").on(table.sessionId),
  threatLevelIdx: index("competitors_threat_idx").on(table.threatLevel),
}));

// Competitor Features Matrix
export const wizardsCompetitorFeatures = pgTable("wizards_competitor_features", {
  id: serial("id").primaryKey(),
  competitorId: integer("competitor_id").references(() => wizardsCompetitors.id, { onDelete: "cascade" }).notNull(),
  startupId: integer("startup_id").references(() => wizardsStartups.id, { onDelete: "cascade" }).notNull(),
  
  // Feature Details
  featureName: text("feature_name").notNull(),
  category: text("category"), // "core", "premium", "enterprise", "upcoming"
  description: text("description"),
  
  // Availability
  hasFeature: boolean("has_feature").default(false),
  availabilityTier: text("availability_tier"), // "free", "basic", "pro", "enterprise"
  isUpcoming: boolean("is_upcoming").default(false),
  launchDate: timestamp("launch_date"),
  
  // Quality Assessment
  implementationQuality: text("implementation_quality"), // "poor", "average", "good", "excellent"
  userRating: real("user_rating"), // 1-5 stars
  reviewCount: integer("review_count"),
  
  // Competitive Analysis
  ourImplementation: text("our_implementation"), // "none", "planned", "basic", "advanced", "superior"
  competitiveAdvantage: text("competitive_advantage"), // "theirs", "ours", "neutral"
  priorityLevel: text("priority_level").default("medium"), // "low", "medium", "high", "critical"
  
  // AI Insights
  aiComparison: text("ai_comparison"),
  improvementSuggestions: jsonb("improvement_suggestions").default(sql`'[]'::jsonb`),
  
  // Metadata
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  competitorIdIdx: index("competitor_features_comp_idx").on(table.competitorId),
  startupIdIdx: index("competitor_features_startup_idx").on(table.startupId),
  categoryIdx: index("competitor_features_category_idx").on(table.category),
}));

// Competitor Pricing Analysis
export const wizardsCompetitorPricing = pgTable("wizards_competitor_pricing", {
  id: serial("id").primaryKey(),
  competitorId: integer("competitor_id").references(() => wizardsCompetitors.id, { onDelete: "cascade" }).notNull(),
  startupId: integer("startup_id").references(() => wizardsStartups.id, { onDelete: "cascade" }).notNull(),
  
  // Plan Details
  planName: text("plan_name").notNull(),
  planType: text("plan_type"), // "free", "starter", "professional", "enterprise", "custom"
  
  // Pricing
  price: numeric("price", { precision: 10, scale: 2 }),
  currency: text("currency").default("USD"),
  billingCycle: text("billing_cycle"), // "monthly", "annual", "one-time", "usage-based"
  
  // Discounts
  annualDiscount: real("annual_discount"), // percentage
  customPricing: boolean("custom_pricing").default(false),
  
  // Limits & Features
  userLimit: integer("user_limit"),
  storageLimit: text("storage_limit"),
  apiLimit: integer("api_limit"),
  includedFeatures: jsonb("included_features").default(sql`'[]'::jsonb`),
  excludedFeatures: jsonb("excluded_features").default(sql`'[]'::jsonb`),
  
  // Add-ons
  addOns: jsonb("add_ons").default(sql`'[]'::jsonb`),
  
  // Value Analysis
  valueScore: integer("value_score"), // 0-100
  pricePerformanceRatio: real("price_performance_ratio"),
  targetCustomer: text("target_customer"), // "individual", "startup", "smb", "enterprise"
  
  // Competitive Position
  ourEquivalent: text("our_equivalent"), // Reference to our pricing tier
  priceDifference: numeric("price_difference", { precision: 10, scale: 2 }), // difference from our pricing
  competitiveAdvantage: text("competitive_advantage"), // "cheaper", "more_expensive", "better_value"
  
  // Market Analysis
  popularityRank: integer("popularity_rank"),
  conversionRate: real("conversion_rate"), // percentage
  
  // AI Insights
  aiRecommendations: jsonb("ai_recommendations").default(sql`'[]'::jsonb`),
  pricingStrategy: text("pricing_strategy"),
  
  // Status
  isActive: boolean("is_active").default(true),
  lastVerified: timestamp("last_verified").defaultNow(),
  
  // Metadata
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  competitorIdIdx: index("competitor_pricing_comp_idx").on(table.competitorId),
  startupIdIdx: index("competitor_pricing_startup_idx").on(table.startupId),
  planTypeIdx: index("competitor_pricing_type_idx").on(table.planType),
}));

// Competitor Analysis Reports (AI-Generated)
export const wizardsCompetitorAnalysis = pgTable("wizards_competitor_analysis", {
  id: serial("id").primaryKey(),
  startupId: integer("startup_id").references(() => wizardsStartups.id, { onDelete: "cascade" }).notNull(),
  sessionId: integer("session_id").references(() => wizardsStudioSessions.id, { onDelete: "cascade" }),
  
  // Analysis Type
  analysisType: text("analysis_type").notNull(), // "swot", "porter", "feature_gap", "market_position", "comprehensive"
  competitorIds: jsonb("competitor_ids").default(sql`'[]'::jsonb`), // Array of competitor IDs included
  
  // SWOT Analysis
  strengths: jsonb("strengths").default(sql`'[]'::jsonb`),
  weaknesses: jsonb("weaknesses").default(sql`'[]'::jsonb`),
  opportunities: jsonb("opportunities").default(sql`'[]'::jsonb`),
  threats: jsonb("threats").default(sql`'[]'::jsonb`),
  
  // Market Position
  marketPositionAnalysis: text("market_position_analysis"),
  competitiveAdvantages: jsonb("competitive_advantages").default(sql`'[]'::jsonb`),
  competitiveDisadvantages: jsonb("competitive_disadvantages").default(sql`'[]'::jsonb`),
  
  // Gap Analysis
  featureGaps: jsonb("feature_gaps").default(sql`'[]'::jsonb`),
  pricingGaps: jsonb("pricing_gaps").default(sql`'[]'::jsonb`),
  marketGaps: jsonb("market_gaps").default(sql`'[]'::jsonb`),
  
  // Strategic Recommendations
  recommendations: jsonb("recommendations").default(sql`'[]'::jsonb`),
  actionItems: jsonb("action_items").default(sql`'[]'::jsonb`),
  priorityInitiatives: jsonb("priority_initiatives").default(sql`'[]'::jsonb`),
  
  // Differentiation Strategy
  differentiationStrategy: text("differentiation_strategy"),
  uniqueValueProposition: text("unique_value_proposition"),
  positioningStatement: text("positioning_statement"),
  
  // Market Insights
  marketTrends: jsonb("market_trends").default(sql`'[]'::jsonb`),
  customerPreferences: jsonb("customer_preferences").default(sql`'[]'::jsonb`),
  emergingThreats: jsonb("emerging_threats").default(sql`'[]'::jsonb`),
  
  // AI Analysis
  aiModel: text("ai_model"), // Model used for analysis
  confidence: real("confidence"), // 0-1
  analysisQuality: text("analysis_quality"), // "draft", "reviewed", "approved"
  
  // Metrics
  overallCompetitiveScore: integer("overall_competitive_score"), // 0-100
  marketFitScore: integer("market_fit_score"), // 0-100
  innovationScore: integer("innovation_score"), // 0-100
  
  // Reporting
  executiveSummary: text("executive_summary"),
  detailedReport: text("detailed_report"),
  visualizations: jsonb("visualizations").default(sql`'[]'::jsonb`),
  
  // Status
  status: text("status").default("draft"), // "draft", "in_review", "approved", "archived"
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  
  // Metadata
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  startupIdIdx: index("competitor_analysis_startup_idx").on(table.startupId),
  sessionIdIdx: index("competitor_analysis_session_idx").on(table.sessionId),
  analysisTypeIdx: index("competitor_analysis_type_idx").on(table.analysisType),
  statusIdx: index("competitor_analysis_status_idx").on(table.status),
}));

// Schema exports for competitor analysis
export const insertWizardsCompetitorSchema = createInsertSchema(wizardsCompetitors).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWizardsCompetitorFeatureSchema = createInsertSchema(wizardsCompetitorFeatures).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWizardsCompetitorPricingSchema = createInsertSchema(wizardsCompetitorPricing).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWizardsCompetitorAnalysisSchema = createInsertSchema(wizardsCompetitorAnalysis).omit({ id: true, createdAt: true, updatedAt: true });

// Type exports for competitor analysis
export type WizardsCompetitor = typeof wizardsCompetitors.$inferSelect;
export type InsertWizardsCompetitor = z.infer<typeof insertWizardsCompetitorSchema>;

export type WizardsCompetitorFeature = typeof wizardsCompetitorFeatures.$inferSelect;
export type InsertWizardsCompetitorFeature = z.infer<typeof insertWizardsCompetitorFeatureSchema>;

export type WizardsCompetitorPricing = typeof wizardsCompetitorPricing.$inferSelect;
export type InsertWizardsCompetitorPricing = z.infer<typeof insertWizardsCompetitorPricingSchema>;

export type WizardsCompetitorAnalysis = typeof wizardsCompetitorAnalysis.$inferSelect;
export type InsertWizardsCompetitorAnalysis = z.infer<typeof insertWizardsCompetitorAnalysisSchema>;

// ============================================================================
// P1 AI QUALITY - Context Engineering & Token Optimization
// ============================================================================

// Context Profiles - Store founder preferences and context profiles
export const wizardsFounderContextProfiles = pgTable("wizards_founder_context_profiles", {
  id: serial("id").primaryKey(),
  founderId: integer("founder_id").references(() => wizardsFounders.id).notNull(),
  
  // User Preferences
  detailLevel: text("detail_level").default("moderate"), // "brief", "moderate", "comprehensive"
  communicationStyle: text("communication_style").default("technical"), // "technical", "business", "casual", "academic"
  formatPreference: text("format_preference").default("structured"), // "structured", "narrative", "bullet-points"
  includeExamples: boolean("include_examples").default(true),
  
  // Domain Expertise
  domains: jsonb("domains").default(sql`'[]'::jsonb`).$type<string[]>(),
  expertise: jsonb("expertise").default(sql`'[]'::jsonb`).$type<string[]>(),
  industries: jsonb("industries").default(sql`'[]'::jsonb`).$type<string[]>(),
  
  // Context Settings
  maxContextTokens: integer("max_context_tokens").default(10000),
  enableMemory: boolean("enable_memory").default(true),
  includeHistory: boolean("include_history").default(true),
  adaptiveComplexity: boolean("adaptive_complexity").default(true),
  
  // Quality Metrics
  avgPerformanceScore: integer("avg_performance_score").default(0), // 0-100
  avgSatisfactionScore: integer("avg_satisfaction_score").default(0), // 0-100
  totalInteractions: integer("total_interactions").default(0),
  
  // Metadata
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  founderIdIdx: index("founder_context_profiles_founder_idx").on(table.founderId),
}));

// Context Learning History - Track learning patterns over time
export const wizardsContextLearningHistory = pgTable("wizards_context_learning_history", {
  id: serial("id").primaryKey(),
  founderId: integer("founder_id").references(() => wizardsFounders.id).notNull(),
  startupId: integer("startup_id").references(() => wizardsStartups.id),
  sessionId: integer("session_id").references(() => wizardsStudioSessions.id),
  
  // Prompt Data
  originalPrompt: text("original_prompt").notNull(),
  enhancedPrompt: text("enhanced_prompt").notNull(),
  contextTokensUsed: integer("context_tokens_used").default(0),
  
  // Task Classification
  taskType: text("task_type").notNull(), // "development", "creative", "business", "research", "support"
  complexity: text("complexity").notNull(), // "low", "medium", "high", "expert"
  studioType: text("studio_type"), // Which studio this was for
  
  // Performance Metrics
  performanceScore: integer("performance_score").default(0), // 0-100
  userSatisfaction: integer("user_satisfaction"), // 0-100 (optional user feedback)
  tokenReduction: integer("token_reduction").default(0), // % reduction vs no context
  qualityImprovement: integer("quality_improvement").default(0), // % improvement
  
  // Applied Enhancements
  appliedRules: jsonb("applied_rules").default(sql`'[]'::jsonb`).$type<string[]>(),
  contextAdditions: jsonb("context_additions").default(sql`'{}'::jsonb`),
  
  // Timing
  executionTimeMs: integer("execution_time_ms"),
  
  // Metadata
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  founderIdIdx: index("context_learning_founder_idx").on(table.founderId),
  startupIdIdx: index("context_learning_startup_idx").on(table.startupId),
  sessionIdIdx: index("context_learning_session_idx").on(table.sessionId),
  taskTypeIdx: index("context_learning_task_type_idx").on(table.taskType),
  createdAtIdx: index("context_learning_created_at_idx").on(table.createdAt),
}));

// Context Layers - Store built context layers for sessions (cached)
export const wizardsContextLayers = pgTable("wizards_context_layers", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => wizardsStudioSessions.id).notNull(),
  startupId: integer("startup_id").references(() => wizardsStartups.id).notNull(),
  founderId: integer("founder_id").references(() => wizardsFounders.id).notNull(),
  
  // Layer Data
  userContext: jsonb("user_context").default(sql`'[]'::jsonb`).$type<string[]>(),
  sessionContext: jsonb("session_context").default(sql`'[]'::jsonb`).$type<string[]>(),
  domainContext: jsonb("domain_context").default(sql`'[]'::jsonb`).$type<string[]>(),
  historicalContext: jsonb("historical_context").default(sql`'[]'::jsonb`).$type<string[]>(),
  
  // Context Stats
  totalTokens: integer("total_tokens").default(0),
  userContextTokens: integer("user_context_tokens").default(0),
  sessionContextTokens: integer("session_context_tokens").default(0),
  domainContextTokens: integer("domain_context_tokens").default(0),
  historicalContextTokens: integer("historical_context_tokens").default(0),
  
  // Cache Control
  expiresAt: timestamp("expires_at"), // Auto-expire after session ends
  isActive: boolean("is_active").default(true),
  
  // Metadata
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  sessionIdIdx: index("context_layers_session_idx").on(table.sessionId),
  startupIdIdx: index("context_layers_startup_idx").on(table.startupId),
  founderIdIdx: index("context_layers_founder_idx").on(table.founderId),
  isActiveIdx: index("context_layers_active_idx").on(table.isActive),
}));

// Context Engineering Insert Schemas
export const insertWizardsFounderContextProfileSchema = createInsertSchema(wizardsFounderContextProfiles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWizardsContextLearningHistorySchema = createInsertSchema(wizardsContextLearningHistory).omit({ id: true, createdAt: true });
export const insertWizardsContextLayersSchema = createInsertSchema(wizardsContextLayers).omit({ id: true, createdAt: true, updatedAt: true });

// Context Engineering Type Exports
export type WizardsFounderContextProfile = typeof wizardsFounderContextProfiles.$inferSelect;
export type InsertWizardsFounderContextProfile = z.infer<typeof insertWizardsFounderContextProfileSchema>;

export type WizardsContextLearningHistory = typeof wizardsContextLearningHistory.$inferSelect;
export type InsertWizardsContextLearningHistory = z.infer<typeof insertWizardsContextLearningHistorySchema>;

export type WizardsContextLayers = typeof wizardsContextLayers.$inferSelect;
export type InsertWizardsContextLayers = z.infer<typeof insertWizardsContextLayersSchema>;

// ============================================================================
// QUANTUM SECURITY - Post-Quantum Cryptographic Key Storage
// ============================================================================

export const quantumKeys = pgTable("quantum_keys", {
  id: serial("id").primaryKey(),
  
  // Key Identifier
  keyId: varchar("key_id").unique().notNull(), // UUID for key reference
  
  // Entity Association
  entityId: varchar("entity_id").notNull(), // startup ID, agent ID, or user ID
  entityType: text("entity_type").notNull(), // "startup", "agent", "user"
  
  // Cryptographic Algorithm
  algorithm: text("algorithm").notNull(), // "kyber", "dilithium", "falcon"
  keyPurpose: text("key_purpose").notNull(), // "encryption", "signature", "key_exchange"
  
  // Public Key (Safe to store in plaintext - used for verification)
  publicKey: text("public_key").notNull(),
  publicKeyFormat: text("public_key_format").default("base64"),
  
  // Private Key (NEVER exposed via API - encrypted at rest)
  // NOTE: This should be encrypted using a master key from environment
  encryptedPrivateKey: text("encrypted_private_key").notNull(),
  privateKeyEncryptionMethod: text("private_key_encryption_method").default("aes-256-gcm"),
  
  // Key Metadata
  keySize: integer("key_size"), // Bits
  securityLevel: integer("security_level"), // NIST security level (1-5)
  quantumResistant: boolean("quantum_resistant").default(true),
  
  // Usage Tracking
  usageCount: integer("usage_count").default(0),
  lastUsedAt: timestamp("last_used_at"),
  
  // Lifecycle
  status: text("status").default("active"), // "active", "revoked", "expired", "rotated"
  expiresAt: timestamp("expires_at"),
  rotatedToKeyId: varchar("rotated_to_key_id"), // New key ID after rotation
  revocationReason: text("revocation_reason"),
  revokedAt: timestamp("revoked_at"),
  
  // Metadata
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  tags: jsonb("tags").default(sql`'[]'::jsonb`),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  keyIdIdx: index("quantum_keys_key_id_idx").on(table.keyId),
  entityIdx: index("quantum_keys_entity_idx").on(table.entityId, table.entityType),
  algorithmIdx: index("quantum_keys_algorithm_idx").on(table.algorithm),
  statusIdx: index("quantum_keys_status_idx").on(table.status),
}));

// Quantum Secure Sessions - Track secure communication channels
export const quantumSecureSessions = pgTable("quantum_secure_sessions", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id").unique().notNull(),
  
  // Participants
  participantA: varchar("participant_a").notNull(),
  participantB: varchar("participant_b").notNull(),
  
  // Key Exchange
  keyExchangeMethod: text("key_exchange_method").default("BB84"), // Quantum Key Distribution protocol
  sharedSecretId: varchar("shared_secret_id"), // Reference to derived shared secret
  
  // Session State
  status: text("status").default("establishing"), // "establishing", "active", "terminated"
  establishedAt: timestamp("established_at"),
  lastActivity: timestamp("last_activity").defaultNow(),
  terminatedAt: timestamp("terminated_at"),
  
  // Security
  securityLevel: integer("security_level").default(3),
  eavesdroppingDetected: boolean("eavesdropping_detected").default(false),
  
  // Metadata
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  sessionIdIdx: index("quantum_sessions_session_id_idx").on(table.sessionId),
  participantsIdx: index("quantum_sessions_participants_idx").on(table.participantA, table.participantB),
  statusIdx: index("quantum_sessions_status_idx").on(table.status),
}));

// Quantum Security Audit Log
export const quantumSecurityAuditLog = pgTable("quantum_security_audit_log", {
  id: serial("id").primaryKey(),
  
  // Event Details
  eventType: text("event_type").notNull(), // "key_generation", "signature", "encryption", "decryption", "key_exchange", "access_attempt"
  eventStatus: text("event_status").notNull(), // "success", "failure", "suspicious"
  
  // Entity
  entityId: varchar("entity_id"),
  entityType: text("entity_type"),
  
  // Key Reference
  keyId: varchar("key_id"),
  
  // Security Context
  algorithm: text("algorithm"),
  operation: text("operation"),
  
  // Audit Trail
  userId: varchar("user_id"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  
  // Compliance
  complianceFlags: jsonb("compliance_flags").default(sql`'[]'::jsonb`),
  riskLevel: text("risk_level"), // "low", "medium", "high", "critical"
  
  // Details
  details: jsonb("details").default(sql`'{}'::jsonb`),
  errorMessage: text("error_message"),
  
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => ({
  eventTypeIdx: index("quantum_audit_event_type_idx").on(table.eventType),
  entityIdx: index("quantum_audit_entity_idx").on(table.entityId),
  keyIdIdx: index("quantum_audit_key_id_idx").on(table.keyId),
  timestampIdx: index("quantum_audit_timestamp_idx").on(table.timestamp),
}));

// Schema exports for quantum security
export const insertQuantumKeySchema = createInsertSchema(quantumKeys).omit({ id: true, createdAt: true, updatedAt: true });
export const insertQuantumSecureSessionSchema = createInsertSchema(quantumSecureSessions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertQuantumSecurityAuditLogSchema = createInsertSchema(quantumSecurityAuditLog).omit({ id: true, timestamp: true });

// Type exports for quantum security
export type QuantumKey = typeof quantumKeys.$inferSelect;
export type InsertQuantumKey = z.infer<typeof insertQuantumKeySchema>;

export type QuantumSecureSession = typeof quantumSecureSessions.$inferSelect;
export type InsertQuantumSecureSession = z.infer<typeof insertQuantumSecureSessionSchema>;

export type QuantumSecurityAuditLog = typeof quantumSecurityAuditLog.$inferSelect;
export type InsertQuantumSecurityAuditLog = z.infer<typeof insertQuantumSecurityAuditLogSchema>;

// ============================================================================
// BETA LAUNCH REQUIREMENTS - November 2025
// Onboarding, Journey Tracking, and Analytics
// ============================================================================

// User Onboarding Progress Tracking
export const userOnboardingProgress = pgTable("user_onboarding_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  // Onboarding Steps
  stepWelcome: boolean("step_welcome").default(false),
  stepGoalCapture: boolean("step_goal_capture").default(false),
  stepWorkspaceTour: boolean("step_workspace_tour").default(false),
  stepFirstStudioLaunch: boolean("step_first_studio_launch").default(false),
  
  // Goal Captured
  founderGoal: text("founder_goal"), // 'validate', 'mvp', 'launch'
  industryFocus: text("industry_focus"),
  technicalLevel: text("technical_level"), // 'non-technical', 'beginner', 'intermediate', 'advanced'
  
  // Completion Tracking
  completedAt: timestamp("completed_at"),
  currentStep: integer("current_step").default(1),
  totalSteps: integer("total_steps").default(4),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("user_onboarding_user_id_idx").on(table.userId),
  completedIdx: index("user_onboarding_completed_idx").on(table.completedAt),
}));

// Journey Milestones Definition (14-Day Journey Structure)
export const journeyMilestones = pgTable("journey_milestones", {
  id: serial("id").primaryKey(),
  
  // Milestone Details
  name: text("name").notNull(),
  description: text("description").notNull(),
  dayNumber: integer("day_number").notNull(), // 1-14
  studioId: text("studio_id").notNull(), // 'ideation-lab', 'engineering-forge', etc.
  
  // Requirements
  requiredDependencies: jsonb("required_dependencies").default(sql`'[]'::jsonb`),
  estimatedDuration: integer("estimated_duration"), // minutes
  
  // Display
  icon: text("icon"),
  color: text("color"),
  category: text("category"), // 'ideation', 'design', 'development', 'launch'
  
  // Ordering
  orderInJourney: integer("order_in_journey").notNull(),
  isOptional: boolean("is_optional").default(false),
  
  // Success Criteria
  completionCriteria: jsonb("completion_criteria").default(sql`'{}'::jsonb`),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  studioIdx: index("journey_milestones_studio_idx").on(table.studioId),
  dayIdx: index("journey_milestones_day_idx").on(table.dayNumber),
  orderIdx: index("journey_milestones_order_idx").on(table.orderInJourney),
}));

// Journey Progress Tracking (User's 14-Day Journey)
export const journeyProgress = pgTable("journey_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  startupId: integer("startup_id").references(() => wizardsStartups.id, { onDelete: 'cascade' }).notNull(),
  milestoneId: integer("milestone_id").references(() => journeyMilestones.id, { onDelete: 'cascade' }).notNull(),
  
  // Progress Details
  status: text("status").notNull().default("pending"), // 'pending', 'in_progress', 'completed', 'skipped', 'blocked'
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  
  // Quality Metrics
  qualityScore: integer("quality_score"), // 0-100
  artifactsGenerated: jsonb("artifacts_generated").default(sql`'[]'::jsonb`),
  timeSpent: integer("time_spent"), // seconds
  
  // Blockers
  blockedBy: jsonb("blocked_by").default(sql`'[]'::jsonb`), // Array of milestone IDs
  blockedReason: text("blocked_reason"),
  
  // Notes
  userNotes: text("user_notes"),
  aiInsights: jsonb("ai_insights").default(sql`'{}'::jsonb`),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // CRITICAL: Prevent duplicate progress records - using uniqueIndex
  uniqueProgressConstraint: uniqueIndex("journey_progress_unique_idx").on(table.userId, table.startupId, table.milestoneId),
  
  // Performance indexes for common query patterns
  userStartupIdx: index("journey_progress_user_startup_idx").on(table.userId, table.startupId),
  userStartupStatusIdx: index("journey_progress_user_startup_status_idx").on(table.userId, table.startupId, table.status),
  milestoneIdIdx: index("journey_progress_milestone_idx").on(table.milestoneId),
  statusIdx: index("journey_progress_status_idx").on(table.status),
  completedIdx: index("journey_progress_completed_idx").on(table.completedAt),
}));

// Analytics Events (Beta Metrics Telemetry)
export const analyticsEvents = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  
  // Event Classification
  eventType: text("event_type").notNull(), // 'signup_completed', 'onboarding_completed', 'first_studio_started', etc.
  eventCategory: text("event_category").notNull(), // 'activation', 'engagement', 'conversion', 'retention'
  
  // User Context
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }),
  sessionId: text("session_id"),
  startupId: integer("startup_id"),
  
  // Event Details
  eventData: jsonb("event_data").default(sql`'{}'::jsonb`),
  
  // Studio Context (if applicable)
  studioId: text("studio_id"),
  workflowName: text("workflow_name"),
  
  // Performance Metrics
  duration: integer("duration"), // milliseconds
  quality: integer("quality"), // 0-100
  cost: integer("cost"), // credits consumed
  
  // Technical Context
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  referrer: text("referrer"),
  
  // Success/Failure
  isSuccess: boolean("is_success").default(true),
  errorMessage: text("error_message"),
  errorCode: text("error_code"),
  
  // Timestamps
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => ({
  // High-performance indexes for dashboard queries
  timestampIdx: index("analytics_events_timestamp_idx").on(table.timestamp),
  categoryTimestampIdx: index("analytics_events_category_timestamp_idx").on(table.eventCategory, table.timestamp),
  userEventTypeIdx: index("analytics_events_user_event_type_idx").on(table.userId, table.eventType),
  userTimestampIdx: index("analytics_events_user_timestamp_idx").on(table.userId, table.timestamp),
  eventTypeIdx: index("analytics_events_type_idx").on(table.eventType),
  studioTimestampIdx: index("analytics_events_studio_timestamp_idx").on(table.studioId, table.timestamp),
  categoryIdx: index("analytics_events_category_idx").on(table.eventCategory),
}));

// Celebration Moments (Track when users hit big milestones)
export const celebrationMoments = pgTable("celebration_moments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  startupId: integer("startup_id").references(() => wizardsStartups.id, { onDelete: 'cascade' }),
  
  // Celebration Type
  celebrationType: text("celebration_type").notNull(), // 'first_studio_complete', 'day_7_milestone', 'mvp_complete', 'first_deploy'
  milestone: text("milestone").notNull(),
  
  // Display Details
  title: text("title").notNull(),
  message: text("message").notNull(),
  icon: text("icon"),
  confettiStyle: text("confetti_style"), // 'default', 'fireworks', 'stars', 'custom'
  
  // Social Sharing
  shareableText: text("shareable_text"),
  shareableImage: text("shareable_image"),
  sharedToSocial: boolean("shared_to_social").default(false),
  sharedPlatforms: jsonb("shared_platforms").default(sql`'[]'::jsonb`),
  
  // Engagement
  userReaction: text("user_reaction"), // 'celebrated', 'shared', 'dismissed', 'skipped'
  viewedAt: timestamp("viewed_at"),
  
  // Metadata
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("celebration_moments_user_idx").on(table.userId),
  typeIdx: index("celebration_moments_type_idx").on(table.celebrationType),
  createdIdx: index("celebration_moments_created_idx").on(table.createdAt),
}));

// Zod Insert Schemas for Beta Launch Tables
export const insertUserOnboardingProgressSchema = createInsertSchema(userOnboardingProgress).omit({ id: true, createdAt: true, updatedAt: true });
export const insertJourneyMilestoneSchema = createInsertSchema(journeyMilestones).omit({ id: true, createdAt: true, updatedAt: true });
export const insertJourneyProgressSchema = createInsertSchema(journeyProgress).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({ id: true, timestamp: true });
export const insertCelebrationMomentSchema = createInsertSchema(celebrationMoments).omit({ id: true, createdAt: true });

// Type Exports for Beta Launch Tables
export type UserOnboardingProgress = typeof userOnboardingProgress.$inferSelect;
export type InsertUserOnboardingProgress = z.infer<typeof insertUserOnboardingProgressSchema>;

export type JourneyMilestone = typeof journeyMilestones.$inferSelect;
export type InsertJourneyMilestone = z.infer<typeof insertJourneyMilestoneSchema>;

export type JourneyProgress = typeof journeyProgress.$inferSelect;
export type InsertJourneyProgress = z.infer<typeof insertJourneyProgressSchema>;

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;

export type CelebrationMoment = typeof celebrationMoments.$inferSelect;
export type InsertCelebrationMoment = z.infer<typeof insertCelebrationMomentSchema>;

// WAI SDK v1.0 Feature Flags Schemas
export const insertFeatureFlagSchema = createInsertSchema(featureFlags).omit({ id: true, createdAt: true, updatedAt: true });
export type FeatureFlag = typeof featureFlags.$inferSelect;
export type InsertFeatureFlag = z.infer<typeof insertFeatureFlagSchema>;

// LLM Model Registry - Auto-Updated Model Catalog
export const llmModelRegistry = pgTable("llm_model_registry", {
  id: serial("id").primaryKey(),
  modelId: text("model_id").notNull(),
  modelName: text("model_name").notNull(),
  provider: text("provider").notNull(),
  contextWindow: integer("context_window").notNull(),
  maxOutputTokens: integer("max_output_tokens").notNull(),
  inputCostPer1M: numeric("input_cost_per_1m", { precision: 10, scale: 4 }).notNull(),
  outputCostPer1M: numeric("output_cost_per_1m", { precision: 10, scale: 4 }).notNull(),
  capabilities: jsonb("capabilities").default(sql`'[]'::jsonb`),
  releaseDate: text("release_date"),
  deprecated: boolean("deprecated").default(false),
  version: text("version"),
  lastUpdated: text("last_updated").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  modelProviderIdx: uniqueIndex("llm_model_provider_unique_idx").on(table.modelId, table.provider),
  providerIdx: index("llm_model_provider_idx").on(table.provider),
  deprecatedIdx: index("llm_model_deprecated_idx").on(table.deprecated),
}));

export const insertLLMModelSchema = createInsertSchema(llmModelRegistry).omit({ id: true, createdAt: true });
export type LLMModel = typeof llmModelRegistry.$inferSelect;
export type InsertLLMModel = z.infer<typeof insertLLMModelSchema>;

// SDLC 100% Automation Schema - WAI SDK v1.0 as Single Source of Truth
export * from './sdlc-schema';

// ================================================================================================
// WAI SDK v1.0 ADMIN DASHBOARD SCHEMA
// ================================================================================================

// Agent Configuration - System prompts, behaviors, and settings for all 267 agents
export const waiAgentConfigs = pgTable("wai_agent_configs", {
  id: serial("id").primaryKey(),
  agentId: text("agent_id").notNull().unique(),
  agentName: text("agent_name").notNull(),
  tier: text("tier").notNull(), // executive, development, creative, qa, devops, domain
  romaLevel: text("roma_level").notNull().default("L2"), // L1, L2, L3, L4
  
  // System Prompt Configuration
  systemPrompt: text("system_prompt").notNull(),
  systemPromptVersion: text("system_prompt_version").default("1.0.0"),
  promptHistory: jsonb("prompt_history").default(sql`'[]'::jsonb`),
  
  // Communication Patterns
  communicationMode: text("communication_mode").default("standard"), // standard, verbose, minimal, technical
  communicationPatterns: jsonb("communication_patterns").default(sql`'{}'::jsonb`), // A2A, AG-UI configs
  
  // Tools Configuration
  assignedTools: jsonb("assigned_tools").default(sql`'[]'::jsonb`), // list of MCP tool IDs
  toolPermissions: jsonb("tool_permissions").default(sql`'{}'::jsonb`),
  
  // Behavior Configuration
  behaviors: jsonb("behaviors").default(sql`'{}'::jsonb`), // behavior patterns
  personality: jsonb("personality").default(sql`'{}'::jsonb`), // personality traits
  decisionPatterns: jsonb("decision_patterns").default(sql`'{}'::jsonb`),
  
  // Process Definitions
  workflows: jsonb("workflows").default(sql`'[]'::jsonb`), // workflow definitions
  triggers: jsonb("triggers").default(sql`'[]'::jsonb`), // event triggers
  
  // Collaboration Mode
  collaborationMode: text("collaboration_mode").default("autonomous"), // autonomous, swarm, hybrid, supervised
  canCollaborateWith: jsonb("can_collaborate_with").default(sql`'[]'::jsonb`), // list of agent IDs
  swarmRoles: jsonb("swarm_roles").default(sql`'{}'::jsonb`),
  
  // LLM Configuration
  preferredProvider: text("preferred_provider"),
  preferredModel: text("preferred_model"),
  maxTokens: integer("max_tokens").default(4096),
  temperature: numeric("temperature", { precision: 3, scale: 2 }).default("0.7"),
  
  // Status
  enabled: boolean("enabled").default(true),
  status: text("status").default("active"), // active, disabled, maintenance, deprecated
  
  // Metadata
  description: text("description"),
  category: text("category"),
  tags: jsonb("tags").default(sql`'[]'::jsonb`),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  agentIdIdx: index("wai_agent_configs_agent_id_idx").on(table.agentId),
  tierIdx: index("wai_agent_configs_tier_idx").on(table.tier),
  romaLevelIdx: index("wai_agent_configs_roma_level_idx").on(table.romaLevel),
  enabledIdx: index("wai_agent_configs_enabled_idx").on(table.enabled),
}));

// MCP Tool Configurations - Settings for all 532 tools
export const waiMcpToolConfigs = pgTable("wai_mcp_tool_configs", {
  id: serial("id").primaryKey(),
  toolId: text("tool_id").notNull().unique(),
  toolName: text("tool_name").notNull(),
  category: text("category").notNull(),
  
  // Status & Access
  enabled: boolean("enabled").default(true),
  accessLevel: text("access_level").default("standard"), // public, standard, restricted, admin
  
  // Rate Limiting
  rateLimitPerMinute: integer("rate_limit_per_minute").default(60),
  rateLimitPerHour: integer("rate_limit_per_hour").default(1000),
  rateLimitPerDay: integer("rate_limit_per_day").default(10000),
  
  // Cost Configuration
  costPerCall: numeric("cost_per_call", { precision: 10, scale: 6 }).default("0"),
  
  // Configuration
  configuration: jsonb("configuration").default(sql`'{}'::jsonb`),
  defaultParams: jsonb("default_params").default(sql`'{}'::jsonb`),
  
  // Usage Tracking
  totalCalls: integer("total_calls").default(0),
  lastCalledAt: timestamp("last_called_at"),
  
  // Metadata
  description: text("description"),
  documentation: text("documentation"),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  toolIdIdx: index("wai_mcp_tool_configs_tool_id_idx").on(table.toolId),
  categoryIdx: index("wai_mcp_tool_configs_category_idx").on(table.category),
  enabledIdx: index("wai_mcp_tool_configs_enabled_idx").on(table.enabled),
}));

// Token Usage Tracking - Analytics for token consumption
export const waiTokenUsage = pgTable("wai_token_usage", {
  id: serial("id").primaryKey(),
  
  // Dimensions
  date: timestamp("date").notNull(),
  providerId: text("provider_id").notNull(),
  modelId: text("model_id").notNull(),
  agentId: text("agent_id"),
  userId: varchar("user_id").references(() => users.id),
  
  // Token Metrics
  inputTokens: integer("input_tokens").default(0),
  outputTokens: integer("output_tokens").default(0),
  totalTokens: integer("total_tokens").default(0),
  
  // Cost Metrics
  inputCost: numeric("input_cost", { precision: 12, scale: 6 }).default("0"),
  outputCost: numeric("output_cost", { precision: 12, scale: 6 }).default("0"),
  totalCost: numeric("total_cost", { precision: 12, scale: 6 }).default("0"),
  
  // Request Metrics
  requestCount: integer("request_count").default(0),
  successCount: integer("success_count").default(0),
  errorCount: integer("error_count").default(0),
  avgLatency: integer("avg_latency").default(0), // milliseconds
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  dateProviderModelIdx: index("wai_token_usage_date_provider_model_idx").on(table.date, table.providerId, table.modelId),
  dateAgentIdx: index("wai_token_usage_date_agent_idx").on(table.date, table.agentId),
  dateUserIdx: index("wai_token_usage_date_user_idx").on(table.date, table.userId),
}));

// Admin Audit Logs - Track all admin actions
export const waiAdminAuditLogs = pgTable("wai_admin_audit_logs", {
  id: serial("id").primaryKey(),
  
  // Action Details
  action: text("action").notNull(), // create, update, delete, enable, disable, configure
  resourceType: text("resource_type").notNull(), // agent, provider, tool, api_key, config
  resourceId: text("resource_id").notNull(),
  
  // Changes
  previousValue: jsonb("previous_value"),
  newValue: jsonb("new_value"),
  
  // Actor
  userId: varchar("user_id").references(() => users.id).notNull(),
  userEmail: text("user_email"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  
  // Status
  status: text("status").default("success"), // success, failed, pending
  errorMessage: text("error_message"),
  
  // Metadata
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  actionIdx: index("wai_admin_audit_action_idx").on(table.action),
  resourceTypeIdx: index("wai_admin_audit_resource_type_idx").on(table.resourceType),
  userIdIdx: index("wai_admin_audit_user_idx").on(table.userId),
  createdAtIdx: index("wai_admin_audit_created_idx").on(table.createdAt),
}));

// LLM Provider Configurations - Extended provider settings
export const waiProviderConfigs = pgTable("wai_provider_configs", {
  id: serial("id").primaryKey(),
  providerId: text("provider_id").notNull().unique(),
  providerName: text("provider_name").notNull(),
  
  // Status
  enabled: boolean("enabled").default(true),
  status: text("status").default("healthy"), // healthy, degraded, offline, maintenance
  
  // Default Model
  defaultModel: text("default_model"),
  availableModels: jsonb("available_models").default(sql`'[]'::jsonb`),
  
  // Rate Limits
  globalRateLimitPerMinute: integer("global_rate_limit_per_minute").default(60),
  modelRateLimits: jsonb("model_rate_limits").default(sql`'{}'::jsonb`),
  
  // API Configuration
  apiEndpoint: text("api_endpoint"),
  apiKeyConfigured: boolean("api_key_configured").default(false),
  apiKeyLastRotated: timestamp("api_key_last_rotated"),
  
  // Fallback Configuration
  fallbackPriority: integer("fallback_priority").default(50), // 1-100
  fallbackProviders: jsonb("fallback_providers").default(sql`'[]'::jsonb`),
  
  // Cost Configuration
  costMultiplier: numeric("cost_multiplier", { precision: 5, scale: 2 }).default("1.00"),
  monthlyBudget: numeric("monthly_budget", { precision: 12, scale: 2 }),
  currentMonthSpend: numeric("current_month_spend", { precision: 12, scale: 2 }).default("0"),
  
  // Health Metrics
  healthCheckInterval: integer("health_check_interval").default(60), // seconds
  lastHealthCheck: timestamp("last_health_check"),
  healthMetrics: jsonb("health_metrics").default(sql`'{}'::jsonb`),
  
  // Metadata
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  providerIdIdx: index("wai_provider_configs_provider_id_idx").on(table.providerId),
  enabledIdx: index("wai_provider_configs_enabled_idx").on(table.enabled),
  statusIdx: index("wai_provider_configs_status_idx").on(table.status),
}));

// Platform Settings - Global platform configuration and feature toggles
export const waiPlatformSettings = pgTable("wai_platform_settings", {
  id: serial("id").primaryKey(),
  settingKey: text("setting_key").notNull().unique(),
  settingName: text("setting_name").notNull(),
  settingValue: jsonb("setting_value").notNull(),
  settingType: text("setting_type").notNull().default("boolean"), // boolean, string, number, json, array
  category: text("category").notNull().default("general"), // general, agents, providers, tools, security, memory, api
  description: text("description"),
  isEditable: boolean("is_editable").default(true),
  requiresRestart: boolean("requires_restart").default(false),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  updatedBy: varchar("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  settingKeyIdx: index("wai_platform_settings_key_idx").on(table.settingKey),
  categoryIdx: index("wai_platform_settings_category_idx").on(table.category),
}));

// API Gateway Clients - External applications using WAI SDK APIs
export const waiApiClients = pgTable("wai_api_clients", {
  id: serial("id").primaryKey(),
  clientId: uuid("client_id").defaultRandom().notNull().unique(),
  clientName: text("client_name").notNull(),
  clientDescription: text("client_description"),
  clientType: text("client_type").notNull().default("application"), // application, service, integration, testing
  
  // Owner Information
  ownerId: varchar("owner_id").references(() => users.id),
  organizationId: integer("organization_id").references(() => organizations.id),
  
  // Status
  status: text("status").notNull().default("active"), // active, suspended, revoked, pending
  
  // Permissions
  allowedEndpoints: jsonb("allowed_endpoints").default(sql`'["*"]'::jsonb`),
  allowedAgents: jsonb("allowed_agents").default(sql`'["*"]'::jsonb`),
  allowedProviders: jsonb("allowed_providers").default(sql`'["*"]'::jsonb`),
  allowedTools: jsonb("allowed_tools").default(sql`'["*"]'::jsonb`),
  scopes: jsonb("scopes").default(sql`'["read", "execute"]'::jsonb`),
  
  // Rate Limiting
  rateLimitPerMinute: integer("rate_limit_per_minute").default(60),
  rateLimitPerHour: integer("rate_limit_per_hour").default(1000),
  rateLimitPerDay: integer("rate_limit_per_day").default(10000),
  monthlyQuota: integer("monthly_quota").default(100000),
  currentMonthUsage: integer("current_month_usage").default(0),
  
  // Environment
  environment: text("environment").notNull().default("development"), // development, staging, production
  
  // Metadata
  webhookUrl: text("webhook_url"),
  callbackUrls: jsonb("callback_urls").default(sql`'[]'::jsonb`),
  ipWhitelist: jsonb("ip_whitelist").default(sql`'[]'::jsonb`),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastAccessedAt: timestamp("last_accessed_at"),
}, (table) => ({
  clientIdIdx: index("wai_api_clients_client_id_idx").on(table.clientId),
  statusIdx: index("wai_api_clients_status_idx").on(table.status),
  ownerIdx: index("wai_api_clients_owner_idx").on(table.ownerId),
}));

// API Keys - Authentication keys for API clients
export const waiApiKeys = pgTable("wai_api_keys", {
  id: serial("id").primaryKey(),
  keyId: uuid("key_id").defaultRandom().notNull().unique(),
  keyPrefix: text("key_prefix").notNull(), // First 8 chars for identification
  keyHash: text("key_hash").notNull(), // Hashed API key
  keyName: text("key_name").notNull(),
  
  // Client Association
  clientId: integer("client_id").references(() => waiApiClients.id).notNull(),
  
  // Status
  status: text("status").notNull().default("active"), // active, expired, revoked
  
  // Validity
  expiresAt: timestamp("expires_at"),
  lastUsedAt: timestamp("last_used_at"),
  usageCount: integer("usage_count").default(0),
  
  // Permissions (can override client permissions)
  scopeOverrides: jsonb("scope_overrides"),
  endpointOverrides: jsonb("endpoint_overrides"),
  
  // Metadata
  createdBy: varchar("created_by").references(() => users.id),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  
  createdAt: timestamp("created_at").defaultNow(),
  revokedAt: timestamp("revoked_at"),
}, (table) => ({
  keyIdIdx: index("wai_api_keys_key_id_idx").on(table.keyId),
  keyPrefixIdx: index("wai_api_keys_prefix_idx").on(table.keyPrefix),
  clientIdIdx: index("wai_api_keys_client_id_idx").on(table.clientId),
  statusIdx: index("wai_api_keys_status_idx").on(table.status),
}));

// API Usage Logs - Detailed API request logging
export const waiApiUsageLogs = pgTable("wai_api_usage_logs", {
  id: serial("id").primaryKey(),
  requestId: uuid("request_id").defaultRandom().notNull(),
  
  // Client Information
  clientId: integer("client_id").references(() => waiApiClients.id),
  apiKeyId: integer("api_key_id").references(() => waiApiKeys.id),
  
  // Request Details
  endpoint: text("endpoint").notNull(),
  method: text("method").notNull(),
  statusCode: integer("status_code"),
  
  // Agent/Provider/Tool Used
  agentId: text("agent_id"),
  providerId: text("provider_id"),
  toolId: text("tool_id"),
  
  // Metrics
  requestDuration: integer("request_duration"), // milliseconds
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  estimatedCost: numeric("estimated_cost", { precision: 12, scale: 6 }),
  
  // Request/Response (truncated for large payloads)
  requestBody: jsonb("request_body"),
  responseBody: jsonb("response_body"),
  
  // Error Info
  errorCode: text("error_code"),
  errorMessage: text("error_message"),
  
  // Client Info
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  clientIdIdx: index("wai_api_usage_client_id_idx").on(table.clientId),
  endpointIdx: index("wai_api_usage_endpoint_idx").on(table.endpoint),
  createdAtIdx: index("wai_api_usage_created_at_idx").on(table.createdAt),
}));

// Insert schemas for Admin Dashboard tables
export const insertWaiAgentConfigSchema = createInsertSchema(waiAgentConfigs).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWaiMcpToolConfigSchema = createInsertSchema(waiMcpToolConfigs).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWaiTokenUsageSchema = createInsertSchema(waiTokenUsage).omit({ id: true, createdAt: true });
export const insertWaiAdminAuditLogSchema = createInsertSchema(waiAdminAuditLogs).omit({ id: true, createdAt: true });
export const insertWaiProviderConfigSchema = createInsertSchema(waiProviderConfigs).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWaiPlatformSettingSchema = createInsertSchema(waiPlatformSettings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWaiApiClientSchema = createInsertSchema(waiApiClients).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWaiApiKeySchema = createInsertSchema(waiApiKeys).omit({ id: true, createdAt: true });
export const insertWaiApiUsageLogSchema = createInsertSchema(waiApiUsageLogs).omit({ id: true, createdAt: true });

// Type exports for Admin Dashboard tables
export type WaiAgentConfig = typeof waiAgentConfigs.$inferSelect;
export type InsertWaiAgentConfig = z.infer<typeof insertWaiAgentConfigSchema>;

export type WaiMcpToolConfig = typeof waiMcpToolConfigs.$inferSelect;
export type InsertWaiMcpToolConfig = z.infer<typeof insertWaiMcpToolConfigSchema>;

export type WaiTokenUsage = typeof waiTokenUsage.$inferSelect;
export type InsertWaiTokenUsage = z.infer<typeof insertWaiTokenUsageSchema>;

export type WaiAdminAuditLog = typeof waiAdminAuditLogs.$inferSelect;
export type InsertWaiAdminAuditLog = z.infer<typeof insertWaiAdminAuditLogSchema>;

export type WaiProviderConfig = typeof waiProviderConfigs.$inferSelect;
export type InsertWaiProviderConfig = z.infer<typeof insertWaiProviderConfigSchema>;

export type WaiPlatformSetting = typeof waiPlatformSettings.$inferSelect;
export type InsertWaiPlatformSetting = z.infer<typeof insertWaiPlatformSettingSchema>;

export type WaiApiClient = typeof waiApiClients.$inferSelect;
export type InsertWaiApiClient = z.infer<typeof insertWaiApiClientSchema>;

export type WaiApiKey = typeof waiApiKeys.$inferSelect;
export type InsertWaiApiKey = z.infer<typeof insertWaiApiKeySchema>;

export type WaiApiUsageLog = typeof waiApiUsageLogs.$inferSelect;
export type InsertWaiApiUsageLog = z.infer<typeof insertWaiApiUsageLogSchema>;

// ================================================================================================
// MULTI-TENANT ORGANIZATION MANAGEMENT - WAI SDK v1.0
// ================================================================================================

// Organization Agent Allocations - Which agents are assigned to each organization
export const orgAgentAllocations = pgTable("org_agent_allocations", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  agentId: text("agent_id").notNull(),
  
  // Allocation Status
  status: text("status").notNull().default("active"), // active, suspended, testing, pending
  
  // Testing & Validation
  testStatus: text("test_status").default("pending"), // pending, passed, failed, in_progress
  lastTestedAt: timestamp("last_tested_at"),
  testResults: jsonb("test_results").default(sql`'{}'::jsonb`),
  
  // Customization
  customSystemPrompt: text("custom_system_prompt"),
  customConfig: jsonb("custom_config").default(sql`'{}'::jsonb`),
  
  // Usage Tracking
  usageCount: integer("usage_count").default(0),
  lastUsedAt: timestamp("last_used_at"),
  
  // Approval
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  orgAgentIdx: uniqueIndex("org_agent_allocation_idx").on(table.organizationId, table.agentId),
  statusIdx: index("org_agent_allocation_status_idx").on(table.status),
  testStatusIdx: index("org_agent_allocation_test_idx").on(table.testStatus),
}));

// Organization Feature Toggles - Per-org feature enablement
export const orgFeatureToggles = pgTable("org_feature_toggles", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  
  // Core Feature Toggles
  enableAgents: boolean("enable_agents").default(true),
  enableLlmSelection: boolean("enable_llm_selection").default(true),
  enableAgentGroups: boolean("enable_agent_groups").default(true),
  enableTemplates: boolean("enable_templates").default(true),
  enableDigitalTwin: boolean("enable_digital_twin").default(true),
  enableBranding: boolean("enable_branding").default(true),
  enableVoiceAi: boolean("enable_voice_ai").default(true),
  enableMultilingual: boolean("enable_multilingual").default(true),
  enableDocumentParsing: boolean("enable_document_parsing").default(true),
  enableDataAnalytics: boolean("enable_data_analytics").default(true),
  enableMemoryManagement: boolean("enable_memory_management").default(true),
  enableCodeGeneration: boolean("enable_code_generation").default(true),
  enableContentCreation: boolean("enable_content_creation").default(true),
  enableRagPipeline: boolean("enable_rag_pipeline").default(true),
  
  // Routing & Optimization
  enableIntelligentRouting: boolean("enable_intelligent_routing").default(true),
  enableCostOptimization: boolean("enable_cost_optimization").default(true),
  enableAutoFallback: boolean("enable_auto_fallback").default(true),
  
  // Security & Compliance
  enableAuditLogging: boolean("enable_audit_logging").default(true),
  enableDataEncryption: boolean("enable_data_encryption").default(true),
  
  // Advanced Features
  enableAgentBreeding: boolean("enable_agent_breeding").default(false),
  enableCollectiveIntelligence: boolean("enable_collective_intelligence").default(false),
  enableHitlWorkflows: boolean("enable_hitl_workflows").default(false),
  
  // Custom Feature List
  customFeatures: jsonb("custom_features").default(sql`'{}'::jsonb`),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  orgFeatureIdx: uniqueIndex("org_feature_toggle_org_idx").on(table.organizationId),
}));

// Organization Settings - Enhanced settings per organization
export const orgSettings = pgTable("org_settings", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  
  // Branding
  brandName: text("brand_name"),
  brandLogo: text("brand_logo"),
  brandPrimaryColor: text("brand_primary_color").default("#6366f1"),
  brandSecondaryColor: text("brand_secondary_color").default("#8b5cf6"),
  customDomain: text("custom_domain"),
  
  // LLM Configuration
  defaultLlmProvider: text("default_llm_provider").default("auto"), // auto, openai, anthropic, google, etc.
  defaultLlmModel: text("default_llm_model"),
  enabledLlmProviders: jsonb("enabled_llm_providers").default(sql`'["openai", "anthropic", "google", "groq"]'::jsonb`),
  llmRoutingPolicy: text("llm_routing_policy").default("cost_optimized"), // cost_optimized, quality_first, speed_first, balanced
  
  // Agent Configuration
  defaultAgentMode: text("default_agent_mode").default("autonomous"), // autonomous, supervised, assisted
  maxConcurrentAgents: integer("max_concurrent_agents").default(10),
  enabledAgentTiers: jsonb("enabled_agent_tiers").default(sql`'["development", "creative", "qa", "devops", "domain"]'::jsonb`),
  
  // Language Settings
  defaultLanguage: text("default_language").default("en"),
  enabledLanguages: jsonb("enabled_languages").default(sql`'["en", "hi", "ta", "te", "bn", "mr", "gu", "kn", "ml", "pa", "or", "as", "bodo", "dogri", "ks", "kok", "mai", "mni", "ne", "sa", "sd", "ur"]'::jsonb`),
  
  // Rate Limiting
  maxRequestsPerMinute: integer("max_requests_per_minute").default(100),
  maxRequestsPerHour: integer("max_requests_per_hour").default(2000),
  maxTokensPerMonth: integer("max_tokens_per_month").default(10000000),
  
  // Usage Tracking
  currentMonthTokens: integer("current_month_tokens").default(0),
  currentMonthCost: numeric("current_month_cost", { precision: 12, scale: 4 }).default("0"),
  
  // Webhook Configuration
  webhookUrl: text("webhook_url"),
  webhookSecret: text("webhook_secret"),
  webhookEvents: jsonb("webhook_events").default(sql`'["agent.completed", "error.occurred"]'::jsonb`),
  
  // Metadata
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  orgSettingsIdx: uniqueIndex("org_settings_org_idx").on(table.organizationId),
}));

// Organization Test Sessions - Track agent testing before deployment
export const orgTestSessions = pgTable("org_test_sessions", {
  id: serial("id").primaryKey(),
  sessionId: uuid("session_id").defaultRandom().notNull().unique(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  
  // Test Target
  testType: text("test_type").notNull(), // agent, group, team, workflow
  targetId: text("target_id").notNull(),
  targetName: text("target_name"),
  
  // Test Configuration
  testConfig: jsonb("test_config").default(sql`'{}'::jsonb`),
  testCases: jsonb("test_cases").default(sql`'[]'::jsonb`),
  
  // Execution
  status: text("status").notNull().default("pending"), // pending, running, completed, failed, cancelled
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  
  // Results
  passedTests: integer("passed_tests").default(0),
  failedTests: integer("failed_tests").default(0),
  totalTests: integer("total_tests").default(0),
  results: jsonb("results").default(sql`'[]'::jsonb`),
  summary: text("summary"),
  
  // Approval
  approved: boolean("approved").default(false),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  
  // User
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  sessionIdIdx: index("org_test_session_id_idx").on(table.sessionId),
  orgIdx: index("org_test_session_org_idx").on(table.organizationId),
  statusIdx: index("org_test_session_status_idx").on(table.status),
}));

// Insert Schemas for Multi-Tenant Tables
export const insertOrgAgentAllocationSchema = createInsertSchema(orgAgentAllocations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrgFeatureToggleSchema = createInsertSchema(orgFeatureToggles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrgSettingsSchema = createInsertSchema(orgSettings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrgTestSessionSchema = createInsertSchema(orgTestSessions).omit({ id: true, createdAt: true });

// Type Exports for Multi-Tenant Tables
export type OrgAgentAllocation = typeof orgAgentAllocations.$inferSelect;
export type InsertOrgAgentAllocation = z.infer<typeof insertOrgAgentAllocationSchema>;

export type OrgFeatureToggle = typeof orgFeatureToggles.$inferSelect;
export type InsertOrgFeatureToggle = z.infer<typeof insertOrgFeatureToggleSchema>;

export type OrgSettings = typeof orgSettings.$inferSelect;
export type InsertOrgSettings = z.infer<typeof insertOrgSettingsSchema>;

export type OrgTestSession = typeof orgTestSessions.$inferSelect;
export type InsertOrgTestSession = z.infer<typeof insertOrgTestSessionSchema>;

// ================================================================================================
// ENHANCED AGENT CONFIGURATION SCHEMA - Agent Groups, Hierarchy, Protocols, Model Selection
// ================================================================================================

// Agent Group Assignments - Maps agents to agentic groups (sectors) with hierarchy
export const waiAgentGroupAssignments = pgTable("wai_agent_group_assignments", {
  id: serial("id").primaryKey(),
  agentId: text("agent_id").notNull(),
  groupId: text("group_id").notNull(), // sector-financial, sector-marketing, etc.
  
  // Role in Group
  role: text("role").notNull().default("member"), // head, specialist, support, member
  hierarchyLevel: integer("hierarchy_level").notNull().default(3), // 1=head, 2=specialist, 3=support, 4=member
  
  // Reports To (within group)
  reportsToAgentId: text("reports_to_agent_id"),
  directReports: jsonb("direct_reports").default(sql`'[]'::jsonb`), // list of agent IDs
  
  // Coordination Settings
  coordinationMode: text("coordination_mode").default("hierarchical"), // hierarchical, swarm, collaborative, pipeline
  decisionAuthority: text("decision_authority").default("escalate"), // autonomous, escalate, approve-required, head-decides
  
  // Swarm Configuration
  swarmRole: text("swarm_role").default("participant"), // coordinator, participant, observer
  swarmWeight: integer("swarm_weight").default(1), // influence weight in swarm voting (1-10)
  
  // Status
  isPrimary: boolean("is_primary").default(true), // agent can belong to multiple groups
  status: text("status").default("active"), // active, inactive, pending
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  agentGroupIdx: uniqueIndex("wai_agent_group_unique_idx").on(table.agentId, table.groupId),
  groupIdIdx: index("wai_agent_group_group_id_idx").on(table.groupId),
  roleIdx: index("wai_agent_group_role_idx").on(table.role),
}));

// Agent Model Selection Configuration - Auto/Defined/Selected modes
export const waiAgentModelConfigs = pgTable("wai_agent_model_configs", {
  id: serial("id").primaryKey(),
  agentId: text("agent_id").notNull().unique(),
  
  // Model Selection Mode
  selectionMode: text("selection_mode").notNull().default("auto"), // auto, defined, selected
  
  // Auto Mode Settings (intelligent routing based on task)
  autoRoutingRules: jsonb("auto_routing_rules").default(sql`'{
    "codeGeneration": "best-coding",
    "reasoning": "best-reasoning",
    "creative": "best-creative",
    "general": "balanced",
    "costOptimized": "cheapest-capable"
  }'::jsonb`),
  autoFallbackChain: jsonb("auto_fallback_chain").default(sql`'[]'::jsonb`),
  
  // Defined Mode Settings (admin-specified models per task type)
  definedModels: jsonb("defined_models").default(sql`'{}'::jsonb`), // {"code": "gpt-5", "reasoning": "claude-opus-4.5"}
  definedFallbacks: jsonb("defined_fallbacks").default(sql`'{}'::jsonb`),
  
  // Selected Mode Settings (specific model always used)
  selectedProvider: text("selected_provider"),
  selectedModel: text("selected_model"),
  
  // Cost Optimization Settings
  costPriority: text("cost_priority").default("balanced"), // lowest, balanced, quality-first
  maxCostPerRequest: numeric("max_cost_per_request", { precision: 10, scale: 6 }),
  monthlyBudget: numeric("monthly_budget", { precision: 12, scale: 2 }),
  currentMonthSpend: numeric("current_month_spend", { precision: 12, scale: 2 }).default("0"),
  
  // Quality Settings
  minQualityScore: integer("min_quality_score").default(70), // 0-100
  preferredCapabilities: jsonb("preferred_capabilities").default(sql`'[]'::jsonb`),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  agentIdIdx: index("wai_agent_model_agent_id_idx").on(table.agentId),
  selectionModeIdx: index("wai_agent_model_selection_mode_idx").on(table.selectionMode),
}));

// Agent Protocols and Guardrails Configuration
export const waiAgentProtocols = pgTable("wai_agent_protocols", {
  id: serial("id").primaryKey(),
  agentId: text("agent_id").notNull().unique(),
  
  // Communication Protocols
  a2aEnabled: boolean("a2a_enabled").default(true), // Agent-to-Agent communication
  mcpEnabled: boolean("mcp_enabled").default(true), // Model Context Protocol
  aguiEnabled: boolean("agui_enabled").default(true), // AG-UI streaming
  openAgentEnabled: boolean("open_agent_enabled").default(false),
  
  // Communication Settings
  messagingFormat: text("messaging_format").default("structured"), // structured, natural, json, xml
  responseFormat: text("response_format").default("markdown"), // markdown, json, plain, html
  streamingEnabled: boolean("streaming_enabled").default(true),
  
  // Outcome Types
  supportedOutcomes: jsonb("supported_outcomes").default(sql`'["text", "code", "analysis", "decision", "action"]'::jsonb`),
  primaryOutcome: text("primary_outcome").default("text"), // text, code, analysis, decision, action, multimodal
  
  // Language Support
  supportedLanguages: jsonb("supported_languages").default(sql`'["en"]'::jsonb`),
  defaultLanguage: text("default_language").default("en"),
  autoTranslation: boolean("auto_translation").default(true),
  
  // Guardrails
  parlantCompliance: boolean("parlant_compliance").default(true),
  antiHallucination: boolean("anti_hallucination").default(true),
  contentFiltering: text("content_filtering").default("standard"), // none, minimal, standard, strict
  piiProtection: boolean("pii_protection").default(true),
  
  // Security Guardrails
  maxTokensPerRequest: integer("max_tokens_per_request").default(8192),
  allowedDomains: jsonb("allowed_domains").default(sql`'["*"]'::jsonb`),
  blockedPatterns: jsonb("blocked_patterns").default(sql`'[]'::jsonb`),
  
  // Quality Guardrails
  requireCitations: boolean("require_citations").default(false),
  factCheckingLevel: text("fact_checking_level").default("basic"), // none, basic, standard, rigorous
  confidenceThreshold: integer("confidence_threshold").default(80), // 0-100
  
  // Behavioral Guardrails
  escalationRules: jsonb("escalation_rules").default(sql`'[]'::jsonb`),
  approvalRequired: jsonb("approval_required").default(sql`'[]'::jsonb`), // list of action types
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  agentIdIdx: index("wai_agent_protocols_agent_id_idx").on(table.agentId),
}));

// Agent Operation Modes - Autonomous/Standalone/Group settings
export const waiAgentOperationModes = pgTable("wai_agent_operation_modes", {
  id: serial("id").primaryKey(),
  agentId: text("agent_id").notNull().unique(),
  
  // Operation Mode Settings
  defaultMode: text("default_mode").default("autonomous"), // autonomous, standalone, group, supervised
  allowedModes: jsonb("allowed_modes").default(sql`'["autonomous", "standalone", "group"]'::jsonb`),
  
  // Autonomous Mode (agent works independently on tasks)
  autonomousLevel: text("autonomous_level").default("full"), // full, limited, supervised
  autonomousCapabilities: jsonb("autonomous_capabilities").default(sql`'[]'::jsonb`),
  autonomousLimits: jsonb("autonomous_limits").default(sql`'{}'::jsonb`),
  
  // Standalone Mode (agent handles single requests, no collaboration)
  standaloneEnabled: boolean("standalone_enabled").default(true),
  standaloneContextRetention: boolean("standalone_context_retention").default(false),
  
  // Group Mode (agent works as part of a team)
  groupEnabled: boolean("group_enabled").default(true),
  preferredGroups: jsonb("preferred_groups").default(sql`'[]'::jsonb`),
  groupCollaborationStyle: text("group_collaboration_style").default("proactive"), // proactive, reactive, observer
  
  // Supervised Mode (requires human approval)
  supervisedActions: jsonb("supervised_actions").default(sql`'[]'::jsonb`),
  supervisorIds: jsonb("supervisor_ids").default(sql`'[]'::jsonb`),
  
  // Availability
  availableForAllTasks: boolean("available_for_all_tasks").default(true),
  restrictedToTasks: jsonb("restricted_to_tasks").default(sql`'[]'::jsonb`), // if not available for all
  blacklistedTasks: jsonb("blacklisted_tasks").default(sql`'[]'::jsonb`),
  
  // Scheduling
  activeSchedule: jsonb("active_schedule").default(sql`'{"always": true}'::jsonb`),
  priority: integer("priority").default(5), // 1-10, higher = more priority
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  agentIdIdx: index("wai_agent_operation_agent_id_idx").on(table.agentId),
  defaultModeIdx: index("wai_agent_operation_mode_idx").on(table.defaultMode),
}));

// Enhanced System Prompts for Agents - Full prompt configurations
export const waiAgentSystemPrompts = pgTable("wai_agent_system_prompts", {
  id: serial("id").primaryKey(),
  agentId: text("agent_id").notNull().unique(),
  
  // Base System Prompt
  systemPrompt: text("system_prompt").notNull(),
  systemPromptVersion: text("system_prompt_version").default("2.0.0"),
  
  // Prompt Components
  identityBlock: jsonb("identity_block").default(sql`'{}'::jsonb`),
  romaBlock: jsonb("roma_block").default(sql`'{}'::jsonb`),
  bmadBlock: jsonb("bmad_block").default(sql`'{}'::jsonb`),
  a2aBlock: jsonb("a2a_block").default(sql`'{}'::jsonb`),
  guardrailsBlock: jsonb("guardrails_block").default(sql`'{}'::jsonb`),
  toolsBlock: jsonb("tools_block").default(sql`'{}'::jsonb`),
  hierarchyBlock: jsonb("hierarchy_block").default(sql`'{}'::jsonb`),
  customBlock: text("custom_block"),
  
  // Prompt History (for rollback)
  promptHistory: jsonb("prompt_history").default(sql`'[]'::jsonb`),
  
  // Characteristics
  characteristics: jsonb("characteristics").default(sql`'{
    "personality": {},
    "communication": {},
    "expertise": [],
    "behaviors": []
  }'::jsonb`),
  
  // Last generated from template
  generatedFromTemplate: text("generated_from_template"),
  lastRegeneratedAt: timestamp("last_regenerated_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  agentIdIdx: index("wai_agent_prompts_agent_id_idx").on(table.agentId),
}));

// Insert schemas for new tables
export const insertWaiAgentGroupAssignmentSchema = createInsertSchema(waiAgentGroupAssignments).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWaiAgentModelConfigSchema = createInsertSchema(waiAgentModelConfigs).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWaiAgentProtocolSchema = createInsertSchema(waiAgentProtocols).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWaiAgentOperationModeSchema = createInsertSchema(waiAgentOperationModes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWaiAgentSystemPromptSchema = createInsertSchema(waiAgentSystemPrompts).omit({ id: true, createdAt: true, updatedAt: true });

// Type exports for new tables
export type WaiAgentGroupAssignment = typeof waiAgentGroupAssignments.$inferSelect;
export type InsertWaiAgentGroupAssignment = z.infer<typeof insertWaiAgentGroupAssignmentSchema>;

export type WaiAgentModelConfig = typeof waiAgentModelConfigs.$inferSelect;
export type InsertWaiAgentModelConfig = z.infer<typeof insertWaiAgentModelConfigSchema>;

export type WaiAgentProtocol = typeof waiAgentProtocols.$inferSelect;
export type InsertWaiAgentProtocol = z.infer<typeof insertWaiAgentProtocolSchema>;

export type WaiAgentOperationMode = typeof waiAgentOperationModes.$inferSelect;
export type InsertWaiAgentOperationMode = z.infer<typeof insertWaiAgentOperationModeSchema>;

export type WaiAgentSystemPrompt = typeof waiAgentSystemPrompts.$inferSelect;
export type InsertWaiAgentSystemPrompt = z.infer<typeof insertWaiAgentSystemPromptSchema>;

// ============================================================================
// PHASE 2/3/5: ENTERPRISE AGENT ORCHESTRATION SYSTEM
// Agent Teams, Digital Twins, HITL Workflows, Collective Intelligence
// ============================================================================

// Agent Teams - Dynamic team compositions (Phase 2)
export const agentTeams = pgTable("agent_teams", {
  id: serial("id").primaryKey(),
  teamId: text("team_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: varchar("owner_id").references(() => users.id),
  organizationId: integer("organization_id").references(() => organizations.id),
  
  // Team Configuration
  teamType: text("team_type").notNull().default("custom"), // custom, startup, enterprise, agency, department
  sectorFocus: text("sector_focus"), // financial, marketing, technology, etc.
  
  // Team Composition
  leadAgentId: text("lead_agent_id").notNull(),
  memberAgentIds: jsonb("member_agent_ids").notNull().default(sql`'[]'::jsonb`),
  maxMembers: integer("max_members").default(10),
  
  // Coordination Settings
  coordinationPattern: text("coordination_pattern").default("hierarchical"), // hierarchical, swarm, collaborative, pipeline, democratic
  decisionMode: text("decision_mode").default("lead-decides"), // consensus, lead-decides, evidence-based, democratic, unanimous
  communicationProtocol: text("communication_protocol").default("a2a"), // a2a, mcp, ag-ui, hybrid
  
  // Memory & Context
  sharedMemoryEnabled: boolean("shared_memory_enabled").default(true),
  contextRetentionDays: integer("context_retention_days").default(30),
  
  // Capabilities & Permissions
  capabilities: jsonb("capabilities").default(sql`'[]'::jsonb`),
  permissions: jsonb("permissions").default(sql`'{"canCreateSubTeams": false, "canAddMembers": true}'::jsonb`),
  
  // Performance
  performanceMetrics: jsonb("performance_metrics").default(sql`'{}'::jsonb`),
  totalTasksCompleted: integer("total_tasks_completed").default(0),
  successRate: real("success_rate").default(0),
  avgResponseTime: real("avg_response_time").default(0),
  
  // Status
  status: text("status").notNull().default("active"), // active, paused, archived, configuring
  isPublic: boolean("is_public").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  teamIdIdx: index("agent_teams_team_id_idx").on(table.teamId),
  ownerIdx: index("agent_teams_owner_idx").on(table.ownerId),
  statusIdx: index("agent_teams_status_idx").on(table.status),
}));

// Team Members - Individual agent memberships (Phase 2)
export const agentTeamMembers = pgTable("agent_team_members", {
  id: serial("id").primaryKey(),
  teamId: text("team_id").notNull(),
  agentId: text("agent_id").notNull(),
  
  // Role in Team
  role: text("role").notNull().default("member"), // lead, specialist, support, observer
  responsibilities: jsonb("responsibilities").default(sql`'[]'::jsonb`),
  
  // Permissions within team
  canDelegate: boolean("can_delegate").default(false),
  canVeto: boolean("can_veto").default(false),
  decisionWeight: real("decision_weight").default(1.0),
  
  // Availability
  isActive: boolean("is_active").default(true),
  availabilitySchedule: jsonb("availability_schedule").default(sql`'{"always": true}'::jsonb`),
  
  joinedAt: timestamp("joined_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  teamAgentIdx: uniqueIndex("agent_team_members_team_agent_idx").on(table.teamId, table.agentId),
  roleIdx: index("agent_team_members_role_idx").on(table.role),
}));

// Digital Twins - AI representations of users/team members (Phase 2/3/5)
export const digitalTwins = pgTable("digital_twins", {
  id: serial("id").primaryKey(),
  twinId: text("twin_id").notNull().unique(),
  name: text("name").notNull(),
  
  // Source - who/what is being twinned
  sourceType: text("source_type").notNull(), // user, agent, team, department, process
  sourceId: text("source_id").notNull(),
  ownerId: varchar("owner_id").references(() => users.id),
  
  // Twin Configuration
  description: text("description"),
  avatar: text("avatar"),
  
  // Behavior Model
  personality: jsonb("personality").default(sql`'{
    "traits": [],
    "communicationStyle": "balanced",
    "decisionStyle": "analytical",
    "riskTolerance": "moderate"
  }'::jsonb`),
  decisionPatterns: jsonb("decision_patterns").default(sql`'[]'::jsonb`),
  preferences: jsonb("preferences").default(sql`'{}'::jsonb`),
  expertise: jsonb("expertise").default(sql`'[]'::jsonb`),
  
  // Knowledge & Memory
  knowledgeBaseId: integer("knowledge_base_id"),
  memoryContexts: jsonb("memory_contexts").default(sql`'[]'::jsonb`),
  learningData: jsonb("learning_data").default(sql`'{"interactions": 0, "feedbackReceived": 0}'::jsonb`),
  
  // Synchronization
  syncEnabled: boolean("sync_enabled").default(true),
  lastSyncAt: timestamp("last_sync_at"),
  syncFrequency: text("sync_frequency").default("realtime"), // realtime, hourly, daily
  syncSources: jsonb("sync_sources").default(sql`'[]'::jsonb`), // calendar, email, chat, documents
  
  // Privacy & Compliance
  privacyLevel: text("privacy_level").default("private"), // private, team, organization, public
  consentGiven: boolean("consent_given").default(false),
  dataRetentionDays: integer("data_retention_days").default(365),
  complianceFlags: jsonb("compliance_flags").default(sql`'{"gdpr": true, "ccpa": true}'::jsonb`),
  
  // Performance
  accuracy: real("accuracy").default(0),
  engagementScore: real("engagement_score").default(0),
  humanAlignmentScore: real("human_alignment_score").default(0),
  
  // Status
  status: text("status").notNull().default("configuring"), // configuring, training, active, paused, archived
  version: text("version").default("1.0.0"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  twinIdIdx: index("digital_twins_twin_id_idx").on(table.twinId),
  sourceIdx: index("digital_twins_source_idx").on(table.sourceType, table.sourceId),
  ownerIdx: index("digital_twins_owner_idx").on(table.ownerId),
  statusIdx: index("digital_twins_status_idx").on(table.status),
}));

// Twin-Human Interactions - Track learning from humans (Phase 3)
export const twinHumanInteractions = pgTable("twin_human_interactions", {
  id: serial("id").primaryKey(),
  twinId: text("twin_id").notNull(),
  humanId: varchar("human_id").references(() => users.id),
  
  // Interaction Details
  interactionType: text("interaction_type").notNull(), // collaboration, feedback, correction, approval, delegation
  context: text("context"),
  
  // Twin's Action
  twinAction: jsonb("twin_action").default(sql`'{}'::jsonb`),
  twinConfidence: real("twin_confidence").default(0),
  
  // Human's Response
  humanResponse: jsonb("human_response").default(sql`'{}'::jsonb`),
  humanApproved: boolean("human_approved"),
  humanCorrection: text("human_correction"),
  
  // Learning Outcome
  learningApplied: boolean("learning_applied").default(false),
  learningNotes: text("learning_notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  twinIdx: index("twin_human_interactions_twin_idx").on(table.twinId),
  humanIdx: index("twin_human_interactions_human_idx").on(table.humanId),
  typeIdx: index("twin_human_interactions_type_idx").on(table.interactionType),
}));

// HITL Workflows - Human-in-the-Loop approval flows (Phase 3)
export const hitlWorkflows = pgTable("hitl_workflows", {
  id: serial("id").primaryKey(),
  workflowId: text("workflow_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: varchar("owner_id").references(() => users.id),
  
  // Workflow Definition
  workflowType: text("workflow_type").notNull(), // approval, review, escalation, delegation, collaborative
  triggerConditions: jsonb("trigger_conditions").default(sql`'[]'::jsonb`), // when to start workflow
  
  // Steps Definition
  steps: jsonb("steps").notNull().default(sql`'[]'::jsonb`), // array of workflow steps
  currentStep: integer("current_step").default(0),
  
  // Participants
  requiredApprovers: jsonb("required_approvers").default(sql`'[]'::jsonb`),
  optionalReviewers: jsonb("optional_reviewers").default(sql`'[]'::jsonb`),
  assignedAgents: jsonb("assigned_agents").default(sql`'[]'::jsonb`),
  
  // Escalation Policy
  escalationEnabled: boolean("escalation_enabled").default(true),
  escalationTimeoutMinutes: integer("escalation_timeout_minutes").default(60),
  escalationPath: jsonb("escalation_path").default(sql`'[]'::jsonb`),
  
  // Confidence Thresholds
  autoApproveThreshold: real("auto_approve_threshold").default(0.95),
  requireReviewThreshold: real("require_review_threshold").default(0.7),
  escalationThreshold: real("escalation_threshold").default(0.5),
  
  // Notifications
  notificationChannels: jsonb("notification_channels").default(sql`'["email", "in-app"]'::jsonb`),
  reminderFrequencyMinutes: integer("reminder_frequency_minutes").default(30),
  
  // Status
  status: text("status").notNull().default("active"), // draft, active, paused, completed, archived
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  workflowIdIdx: index("hitl_workflows_workflow_id_idx").on(table.workflowId),
  ownerIdx: index("hitl_workflows_owner_idx").on(table.ownerId),
  statusIdx: index("hitl_workflows_status_idx").on(table.status),
}));

// HITL Workflow Executions - Running instances of workflows (Phase 3)
export const hitlWorkflowExecutions = pgTable("hitl_workflow_executions", {
  id: serial("id").primaryKey(),
  executionId: text("execution_id").notNull().unique(),
  workflowId: text("workflow_id").notNull(),
  
  // Trigger Context
  triggeredBy: text("triggered_by").notNull(), // agent-id or user-id
  triggerType: text("trigger_type").notNull(), // agent-request, threshold-breach, manual, scheduled
  triggerContext: jsonb("trigger_context").default(sql`'{}'::jsonb`),
  
  // Execution State
  currentStep: integer("current_step").default(0),
  stepHistory: jsonb("step_history").default(sql`'[]'::jsonb`),
  
  // Pending Approvals
  pendingApprovals: jsonb("pending_approvals").default(sql`'[]'::jsonb`),
  receivedApprovals: jsonb("received_approvals").default(sql`'[]'::jsonb`),
  
  // Decision Data
  agentConfidence: real("agent_confidence"),
  humanDecision: text("human_decision"), // approved, rejected, modified, escalated
  humanFeedback: text("human_feedback"),
  modifiedAction: jsonb("modified_action"),
  
  // Timing
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  timeToDecision: integer("time_to_decision"), // milliseconds
  
  // Status
  status: text("status").notNull().default("pending"), // pending, in_review, approved, rejected, escalated, timed_out
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  executionIdIdx: index("hitl_executions_execution_id_idx").on(table.executionId),
  workflowIdx: index("hitl_executions_workflow_idx").on(table.workflowId),
  statusIdx: index("hitl_executions_status_idx").on(table.status),
}));

// Visual Workflow Templates - No-code workflow builder (Phase 3)
export const visualWorkflows = pgTable("visual_workflows", {
  id: serial("id").primaryKey(),
  workflowId: text("workflow_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: varchar("owner_id").references(() => users.id),
  
  // Visual Editor Data
  nodes: jsonb("nodes").notNull().default(sql`'[]'::jsonb`), // workflow nodes (actions, conditions, triggers)
  edges: jsonb("edges").notNull().default(sql`'[]'::jsonb`), // connections between nodes
  viewport: jsonb("viewport").default(sql`'{"x": 0, "y": 0, "zoom": 1}'::jsonb`),
  
  // Workflow Properties
  triggerType: text("trigger_type").default("manual"), // manual, scheduled, event, webhook
  triggerConfig: jsonb("trigger_config").default(sql`'{}'::jsonb`),
  
  // Variables & Context
  inputVariables: jsonb("input_variables").default(sql`'[]'::jsonb`),
  outputVariables: jsonb("output_variables").default(sql`'[]'::jsonb`),
  
  // Agent Assignments
  assignedAgents: jsonb("assigned_agents").default(sql`'[]'::jsonb`),
  assignedTeams: jsonb("assigned_teams").default(sql`'[]'::jsonb`),
  
  // Execution Settings
  parallelExecutionEnabled: boolean("parallel_execution_enabled").default(true),
  maxConcurrentExecutions: integer("max_concurrent_executions").default(5),
  timeoutMinutes: integer("timeout_minutes").default(60),
  retryPolicy: jsonb("retry_policy").default(sql`'{"maxRetries": 3, "backoffMs": 1000}'::jsonb`),
  
  // Versioning
  version: text("version").default("1.0.0"),
  publishedVersion: text("published_version"),
  isDraft: boolean("is_draft").default(true),
  
  // Status
  status: text("status").notNull().default("draft"), // draft, published, active, paused, archived
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  publishedAt: timestamp("published_at"),
}, (table) => ({
  workflowIdIdx: index("visual_workflows_workflow_id_idx").on(table.workflowId),
  ownerIdx: index("visual_workflows_owner_idx").on(table.ownerId),
  statusIdx: index("visual_workflows_status_idx").on(table.status),
}));

// Agent Breeding - Autonomous agent creation system (Phase 5)
export const agentBreeding = pgTable("agent_breeding", {
  id: serial("id").primaryKey(),
  breedingId: text("breeding_id").notNull().unique(),
  
  // Parent Agents
  parentAgentIds: jsonb("parent_agent_ids").notNull().default(sql`'[]'::jsonb`),
  breedingStrategy: text("breeding_strategy").notNull(), // crossover, specialization, evolution, fusion
  
  // Child Agent
  childAgentId: text("child_agent_id"),
  childName: text("child_name"),
  childDescription: text("child_description"),
  
  // Inherited Traits
  inheritedCapabilities: jsonb("inherited_capabilities").default(sql`'[]'::jsonb`),
  inheritedTools: jsonb("inherited_tools").default(sql`'[]'::jsonb`),
  inheritedPersonality: jsonb("inherited_personality").default(sql`'{}'::jsonb`),
  mutations: jsonb("mutations").default(sql`'[]'::jsonb`), // random variations
  
  // Specialization
  targetSpecialization: text("target_specialization"),
  targetRomaLevel: text("target_roma_level"),
  targetTier: text("target_tier"),
  
  // Breeding Metrics
  fitnessScore: real("fitness_score").default(0),
  diversityScore: real("diversity_score").default(0),
  capabilityScore: real("capability_score").default(0),
  
  // Status
  status: text("status").notNull().default("pending"), // pending, breeding, training, evaluating, active, failed
  failureReason: text("failure_reason"),
  
  // Approval (if required)
  requiresApproval: boolean("requires_approval").default(true),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
}, (table) => ({
  breedingIdIdx: index("agent_breeding_breeding_id_idx").on(table.breedingId),
  childAgentIdx: index("agent_breeding_child_idx").on(table.childAgentId),
  statusIdx: index("agent_breeding_status_idx").on(table.status),
}));

// Collective Intelligence - Networked agent thinking (Phase 5)
export const collectiveIntelligence = pgTable("collective_intelligence", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  name: text("name"),
  
  // Collective Configuration
  collectiveType: text("collective_type").notNull(), // brainstorm, consensus, vote, debate, synthesis
  participantAgentIds: jsonb("participant_agent_ids").notNull().default(sql`'[]'::jsonb`),
  facilitatorAgentId: text("facilitator_agent_id"),
  
  // Problem/Task
  problemStatement: text("problem_statement").notNull(),
  context: jsonb("context").default(sql`'{}'::jsonb`),
  constraints: jsonb("constraints").default(sql`'[]'::jsonb`),
  
  // Collective Thinking Process
  rounds: jsonb("rounds").default(sql`'[]'::jsonb`), // thinking rounds
  currentRound: integer("current_round").default(0),
  maxRounds: integer("max_rounds").default(5),
  
  // Contributions
  contributions: jsonb("contributions").default(sql`'[]'::jsonb`), // individual agent inputs
  emergentInsights: jsonb("emergent_insights").default(sql`'[]'::jsonb`), // patterns discovered
  
  // Consensus Building
  consensusThreshold: real("consensus_threshold").default(0.8),
  currentConsensusLevel: real("current_consensus_level").default(0),
  votingResults: jsonb("voting_results").default(sql`'{}'::jsonb`),
  
  // Output
  synthesizedOutput: text("synthesized_output"),
  confidenceScore: real("confidence_score").default(0),
  qualityScore: real("quality_score").default(0),
  
  // Metrics
  totalContributions: integer("total_contributions").default(0),
  uniquePerspectives: integer("unique_perspectives").default(0),
  processingTimeMs: integer("processing_time_ms").default(0),
  
  // Status
  status: text("status").notNull().default("active"), // active, paused, completed, failed
  
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
}, (table) => ({
  sessionIdIdx: index("collective_intelligence_session_idx").on(table.sessionId),
  typeIdx: index("collective_intelligence_type_idx").on(table.collectiveType),
  statusIdx: index("collective_intelligence_status_idx").on(table.status),
}));

// Adaptive Routing Rules - ML-based task-to-agent matching (Phase 2)
export const adaptiveRoutingRules = pgTable("adaptive_routing_rules", {
  id: serial("id").primaryKey(),
  ruleId: text("rule_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  
  // Matching Criteria
  taskPatterns: jsonb("task_patterns").notNull().default(sql`'[]'::jsonb`), // keywords, intents, categories
  contextPatterns: jsonb("context_patterns").default(sql`'[]'::jsonb`),
  userPatterns: jsonb("user_patterns").default(sql`'[]'::jsonb`),
  
  // Target Routing
  targetType: text("target_type").notNull(), // agent, team, group, collective
  targetId: text("target_id").notNull(),
  fallbackTargetId: text("fallback_target_id"),
  
  // Routing Logic
  priority: integer("priority").default(50), // 1-100, higher = more priority
  confidenceThreshold: real("confidence_threshold").default(0.7),
  
  // Cost & Performance
  costWeight: real("cost_weight").default(0.3), // importance of cost in routing
  speedWeight: real("speed_weight").default(0.3),
  qualityWeight: real("quality_weight").default(0.4),
  
  // Learning
  isLearnable: boolean("is_learnable").default(true),
  learningData: jsonb("learning_data").default(sql`'{}'::jsonb`),
  successRate: real("success_rate").default(0),
  usageCount: integer("usage_count").default(0),
  
  // Status
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  ruleIdIdx: index("adaptive_routing_rule_id_idx").on(table.ruleId),
  targetIdx: index("adaptive_routing_target_idx").on(table.targetType, table.targetId),
  priorityIdx: index("adaptive_routing_priority_idx").on(table.priority),
}));

// Orchestration Telemetry - Cost and performance tracking (P0)
export const orchestrationTelemetry = pgTable("orchestration_telemetry", {
  id: serial("id").primaryKey(),
  traceId: text("trace_id").notNull(),
  spanId: text("span_id").notNull(),
  parentSpanId: text("parent_span_id"),
  
  // Entity Tracking
  entityType: text("entity_type").notNull(), // agent, team, twin, workflow, collective
  entityId: text("entity_id").notNull(),
  
  // Operation Details
  operationType: text("operation_type").notNull(), // chat, task, workflow, breeding, collective
  operationName: text("operation_name"),
  
  // Timing
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  durationMs: integer("duration_ms"),
  
  // Cost Tracking
  inputTokens: integer("input_tokens").default(0),
  outputTokens: integer("output_tokens").default(0),
  totalTokens: integer("total_tokens").default(0),
  estimatedCost: real("estimated_cost").default(0), // in USD cents
  
  // Provider Info
  llmProvider: text("llm_provider"),
  llmModel: text("llm_model"),
  
  // Request/Response
  inputSummary: text("input_summary"),
  outputSummary: text("output_summary"),
  
  // Quality Metrics
  successStatus: boolean("success_status"),
  errorType: text("error_type"),
  qualityScore: real("quality_score"),
  
  // Context
  userId: varchar("user_id").references(() => users.id),
  sessionId: text("session_id"),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  traceIdx: index("orchestration_telemetry_trace_idx").on(table.traceId),
  entityIdx: index("orchestration_telemetry_entity_idx").on(table.entityType, table.entityId),
  timeIdx: index("orchestration_telemetry_time_idx").on(table.startTime),
  costIdx: index("orchestration_telemetry_cost_idx").on(table.estimatedCost),
}));

// Insert Schemas for Phase 2/3/5 Tables
export const insertAgentTeamSchema = createInsertSchema(agentTeams).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAgentTeamMemberSchema = createInsertSchema(agentTeamMembers).omit({ id: true, joinedAt: true, updatedAt: true });
export const insertDigitalTwinSchema = createInsertSchema(digitalTwins).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTwinHumanInteractionSchema = createInsertSchema(twinHumanInteractions).omit({ id: true, createdAt: true });
export const insertHitlWorkflowSchema = createInsertSchema(hitlWorkflows).omit({ id: true, createdAt: true, updatedAt: true });
export const insertHitlWorkflowExecutionSchema = createInsertSchema(hitlWorkflowExecutions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertVisualWorkflowSchema = createInsertSchema(visualWorkflows).omit({ id: true, createdAt: true, updatedAt: true, publishedAt: true });
export const insertAgentBreedingSchema = createInsertSchema(agentBreeding).omit({ id: true, createdAt: true, completedAt: true, approvedAt: true });
export const insertCollectiveIntelligenceSchema = createInsertSchema(collectiveIntelligence).omit({ id: true, createdAt: true, completedAt: true });
export const insertAdaptiveRoutingRuleSchema = createInsertSchema(adaptiveRoutingRules).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrchestrationTelemetrySchema = createInsertSchema(orchestrationTelemetry).omit({ id: true, createdAt: true });

// Type Exports for Phase 2/3/5 Tables
export type AgentTeam = typeof agentTeams.$inferSelect;
export type InsertAgentTeam = z.infer<typeof insertAgentTeamSchema>;

export type AgentTeamMember = typeof agentTeamMembers.$inferSelect;
export type InsertAgentTeamMember = z.infer<typeof insertAgentTeamMemberSchema>;

export type DigitalTwin = typeof digitalTwins.$inferSelect;
export type InsertDigitalTwin = z.infer<typeof insertDigitalTwinSchema>;

export type TwinHumanInteraction = typeof twinHumanInteractions.$inferSelect;
export type InsertTwinHumanInteraction = z.infer<typeof insertTwinHumanInteractionSchema>;

export type HitlWorkflow = typeof hitlWorkflows.$inferSelect;
export type InsertHitlWorkflow = z.infer<typeof insertHitlWorkflowSchema>;

export type HitlWorkflowExecution = typeof hitlWorkflowExecutions.$inferSelect;
export type InsertHitlWorkflowExecution = z.infer<typeof insertHitlWorkflowExecutionSchema>;

export type VisualWorkflow = typeof visualWorkflows.$inferSelect;
export type InsertVisualWorkflow = z.infer<typeof insertVisualWorkflowSchema>;

export type AgentBreeding = typeof agentBreeding.$inferSelect;
export type InsertAgentBreeding = z.infer<typeof insertAgentBreedingSchema>;

export type CollectiveIntelligence = typeof collectiveIntelligence.$inferSelect;
export type InsertCollectiveIntelligence = z.infer<typeof insertCollectiveIntelligenceSchema>;

export type AdaptiveRoutingRule = typeof adaptiveRoutingRules.$inferSelect;
export type InsertAdaptiveRoutingRule = z.infer<typeof insertAdaptiveRoutingRuleSchema>;

export type OrchestrationTelemetry = typeof orchestrationTelemetry.$inferSelect;
export type InsertOrchestrationTelemetry = z.infer<typeof insertOrchestrationTelemetrySchema>;

// =====================================================
// WAI SDK v2.1 Integration Schemas
// =====================================================

// Third-Party Integration Registry - 39 Integrations
export const waiIntegrations = pgTable("wai_integrations", {
  id: serial("id").primaryKey(),
  integrationId: text("integration_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  provider: text("provider").notNull(),
  version: text("version").notNull().default("1.0.0"),
  status: text("status").notNull().default("active"),
  authType: text("auth_type").notNull().default("none"),
  capabilities: jsonb("capabilities").default(sql`'[]'::jsonb`),
  supportedAgentTiers: jsonb("supported_agent_tiers").default(sql`'[]'::jsonb`),
  requiredSecrets: jsonb("required_secrets").default(sql`'[]'::jsonb`),
  endpoints: jsonb("endpoints").default(sql`'{}'::jsonb`),
  healthCheckConfig: jsonb("health_check_config").default(sql`'{}'::jsonb`),
  rateLimit: jsonb("rate_limit").default(sql`'{}'::jsonb`),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  isEnabled: boolean("is_enabled").default(true),
  lastHealthCheck: timestamp("last_health_check"),
  healthStatus: text("health_status").default("unknown"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  integrationIdIdx: index("wai_integrations_id_idx").on(table.integrationId),
  categoryIdx: index("wai_integrations_category_idx").on(table.category),
  statusIdx: index("wai_integrations_status_idx").on(table.status),
}));

// Integration Bindings - Agent/LLM/Tool connections
export const waiIntegrationBindings = pgTable("wai_integration_bindings", {
  id: serial("id").primaryKey(),
  integrationId: text("integration_id").notNull(),
  bindingType: text("binding_type").notNull(),
  targetId: text("target_id").notNull(),
  targetType: text("target_type").notNull(),
  config: jsonb("config").default(sql`'{}'::jsonb`),
  priority: integer("priority").default(50),
  isEnabled: boolean("is_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  integrationIdx: index("wai_integration_bindings_integration_idx").on(table.integrationId),
  targetIdx: index("wai_integration_bindings_target_idx").on(table.targetType, table.targetId),
}));

// Integration Execution Logs
export const waiIntegrationExecutions = pgTable("wai_integration_executions", {
  id: serial("id").primaryKey(),
  integrationId: text("integration_id").notNull(),
  operation: text("operation").notNull(),
  agentId: text("agent_id"),
  sessionId: text("session_id"),
  userId: varchar("user_id"),
  status: text("status").notNull().default("pending"),
  inputParams: jsonb("input_params").default(sql`'{}'::jsonb`),
  outputData: jsonb("output_data").default(sql`'{}'::jsonb`),
  errorMessage: text("error_message"),
  latencyMs: integer("latency_ms"),
  tokensUsed: integer("tokens_used"),
  cost: real("cost"),
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  integrationIdx: index("wai_integration_executions_integration_idx").on(table.integrationId),
  agentIdx: index("wai_integration_executions_agent_idx").on(table.agentId),
  timeIdx: index("wai_integration_executions_time_idx").on(table.startTime),
  statusIdx: index("wai_integration_executions_status_idx").on(table.status),
}));

// CAM 2.0 Memory Clusters - Contextual Agent Memory
export const waiCam2Clusters = pgTable("wai_cam2_clusters", {
  id: serial("id").primaryKey(),
  clusterId: text("cluster_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  agentId: text("agent_id"),
  clusterType: text("cluster_type").notNull().default("semantic"),
  memoryTier: text("memory_tier").notNull().default("warm"),
  vectorDimension: integer("vector_dimension").default(1536),
  maxCapacity: integer("max_capacity").default(10000),
  currentSize: integer("current_size").default(0),
  compressionRatio: real("compression_ratio").default(1.0),
  lastAccessed: timestamp("last_accessed"),
  accessCount: integer("access_count").default(0),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  clusterIdIdx: index("wai_cam2_clusters_id_idx").on(table.clusterId),
  agentIdx: index("wai_cam2_clusters_agent_idx").on(table.agentId),
  tierIdx: index("wai_cam2_clusters_tier_idx").on(table.memoryTier),
}));

// GRPO Training Sessions - Group Relative Policy Optimization
export const waiGrpoSessions = pgTable("wai_grpo_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  agentId: text("agent_id").notNull(),
  policyId: text("policy_id"),
  status: text("status").notNull().default("initializing"),
  trainingEpochs: integer("training_epochs").default(0),
  currentEpoch: integer("current_epoch").default(0),
  learningRate: real("learning_rate").default(0.0001),
  batchSize: integer("batch_size").default(32),
  rewardHistory: jsonb("reward_history").default(sql`'[]'::jsonb`),
  policyGradients: jsonb("policy_gradients").default(sql`'{}'::jsonb`),
  performanceMetrics: jsonb("performance_metrics").default(sql`'{}'::jsonb`),
  checkpointPath: text("checkpoint_path"),
  lastCheckpoint: timestamp("last_checkpoint"),
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  sessionIdIdx: index("wai_grpo_sessions_id_idx").on(table.sessionId),
  agentIdx: index("wai_grpo_sessions_agent_idx").on(table.agentId),
  statusIdx: index("wai_grpo_sessions_status_idx").on(table.status),
}));

// Queen Orchestrator Runs
export const waiQueenOrchestrationRuns = pgTable("wai_queen_orchestration_runs", {
  id: serial("id").primaryKey(),
  runId: text("run_id").notNull().unique(),
  taskDescription: text("task_description").notNull(),
  decompositionPattern: text("decomposition_pattern").notNull(),
  decompositionAlgorithm: text("decomposition_algorithm").notNull(),
  status: text("status").notNull().default("pending"),
  totalSubtasks: integer("total_subtasks").default(0),
  completedSubtasks: integer("completed_subtasks").default(0),
  failedSubtasks: integer("failed_subtasks").default(0),
  assignedAgents: jsonb("assigned_agents").default(sql`'[]'::jsonb`),
  subtaskResults: jsonb("subtask_results").default(sql`'[]'::jsonb`),
  aggregatedResult: jsonb("aggregated_result").default(sql`'{}'::jsonb`),
  totalTokensUsed: integer("total_tokens_used").default(0),
  totalCost: real("total_cost").default(0),
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  userId: varchar("user_id"),
  projectId: text("project_id"),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  runIdIdx: index("wai_queen_runs_id_idx").on(table.runId),
  statusIdx: index("wai_queen_runs_status_idx").on(table.status),
  patternIdx: index("wai_queen_runs_pattern_idx").on(table.decompositionPattern),
  timeIdx: index("wai_queen_runs_time_idx").on(table.startTime),
}));

// Agent Registry v2.1 - 275 Agents with full configuration
export const waiAgentRegistryV21 = pgTable("wai_agent_registry_v21", {
  id: serial("id").primaryKey(),
  agentId: text("agent_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  tier: text("tier").notNull(),
  romaLevel: text("roma_level").notNull(),
  category: text("category").notNull(),
  status: text("status").notNull().default("active"),
  systemPrompt: text("system_prompt"),
  capabilities: jsonb("capabilities").default(sql`'[]'::jsonb`),
  protocols: jsonb("protocols").default(sql`'[]'::jsonb`),
  preferredModel: text("preferred_model"),
  fallbackModels: jsonb("fallback_models").default(sql`'[]'::jsonb`),
  maxTokens: integer("max_tokens").default(4096),
  temperature: real("temperature").default(0.7),
  tools: jsonb("tools").default(sql`'[]'::jsonb`),
  guardrails: jsonb("guardrails").default(sql`'{}'::jsonb`),
  operationMode: text("operation_mode").default("autonomous"),
  supportedLanguages: jsonb("supported_languages").default(sql`'["en"]'::jsonb`),
  parlantCompliance: jsonb("parlant_compliance").default(sql`'{}'::jsonb`),
  costLimit: real("cost_limit"),
  executionCount: integer("execution_count").default(0),
  successRate: real("success_rate").default(100),
  avgLatency: real("avg_latency").default(0),
  lastExecution: timestamp("last_execution"),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  agentIdIdx: index("wai_agent_registry_v21_id_idx").on(table.agentId),
  tierIdx: index("wai_agent_registry_v21_tier_idx").on(table.tier),
  romaIdx: index("wai_agent_registry_v21_roma_idx").on(table.romaLevel),
  categoryIdx: index("wai_agent_registry_v21_category_idx").on(table.category),
  statusIdx: index("wai_agent_registry_v21_status_idx").on(table.status),
}));

// Connection Pool Metrics - Production monitoring
export const waiConnectionPoolMetrics = pgTable("wai_connection_pool_metrics", {
  id: serial("id").primaryKey(),
  poolName: text("pool_name").notNull(),
  activeConnections: integer("active_connections").default(0),
  idleConnections: integer("idle_connections").default(0),
  waitingRequests: integer("waiting_requests").default(0),
  maxConnections: integer("max_connections").default(20),
  avgAcquireTime: real("avg_acquire_time").default(0),
  avgQueryTime: real("avg_query_time").default(0),
  totalQueries: integer("total_queries").default(0),
  failedQueries: integer("failed_queries").default(0),
  lastReset: timestamp("last_reset").defaultNow(),
  sampleTime: timestamp("sample_time").defaultNow(),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
}, (table) => ({
  poolIdx: index("wai_conn_pool_metrics_pool_idx").on(table.poolName),
  timeIdx: index("wai_conn_pool_metrics_time_idx").on(table.sampleTime),
}));

// ============================================================
// Multi-Organization SaaS Schema - Phase 2
// ============================================================

// Organization API Keys - For SDK Access (separate from user API keys)
export const organizationApiKeys = pgTable("organization_api_keys", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  keyHash: text("key_hash").notNull(), // SHA-256 hash of the API key (stored, not the key itself)
  keyPrefix: text("key_prefix").notNull(), // First 8 chars for identification (e.g., "wai_prod_")
  name: text("name").notNull(), // Friendly name for the key
  description: text("description"),
  scopes: jsonb("scopes").notNull().default(sql`'["agents:read", "agents:execute"]'::jsonb`), // Allowed API scopes
  rateLimit: integer("rate_limit").notNull().default(60), // Requests per minute
  tokenLimit: integer("token_limit"), // Optional token limit per day
  expiresAt: timestamp("expires_at"), // Optional expiration
  lastUsedAt: timestamp("last_used_at"),
  lastUsedIp: text("last_used_ip"),
  usageCount: integer("usage_count").default(0),
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  revokedAt: timestamp("revoked_at"),
}, (table) => ({
  orgIdx: index("org_api_keys_org_idx").on(table.organizationId),
  keyHashIdx: uniqueIndex("org_api_keys_hash_idx").on(table.keyHash),
  prefixIdx: index("org_api_keys_prefix_idx").on(table.keyPrefix),
  activeIdx: index("org_api_keys_active_idx").on(table.isActive),
}));

// Organization Configurations - Per-org agent/LLM/tool selection
export const organizationConfigs = pgTable("organization_configs", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull().unique(),
  
  // Agent Configuration
  enabledAgents: jsonb("enabled_agents").default(sql`'[]'::jsonb`), // Array of enabled agent IDs
  agentPreferences: jsonb("agent_preferences").default(sql`'{}'::jsonb`), // Per-agent custom configs
  defaultAgentTier: text("default_agent_tier").default("development"), // executive, development, domain, creative, qa, devops
  
  // LLM Provider Configuration
  enabledProviders: jsonb("enabled_providers").default(sql`'["openai", "anthropic", "google"]'::jsonb`),
  providerPreferences: jsonb("provider_preferences").default(sql`'{}'::jsonb`), // Provider-specific settings
  defaultProvider: text("default_provider").default("openai"),
  costOptimizationEnabled: boolean("cost_optimization_enabled").default(true),
  maxTokensPerRequest: integer("max_tokens_per_request").default(4096),
  
  // Tool/MCP Configuration
  enabledTools: jsonb("enabled_tools").default(sql`'[]'::jsonb`), // Array of enabled tool IDs
  toolPermissions: jsonb("tool_permissions").default(sql`'{}'::jsonb`), // Fine-grained tool permissions
  
  // Feature Flags
  features: jsonb("features").default(sql`'{
    "multimodal": false,
    "voice": false,
    "analytics": true,
    "costTracking": true,
    "webhooks": true,
    "streaming": true
  }'::jsonb`),
  
  // Quota Settings (can override plan defaults)
  quotaOverrides: jsonb("quota_overrides").default(sql`'{}'::jsonb`),
  
  // Webhook Configuration
  webhookUrl: text("webhook_url"),
  webhookSecret: text("webhook_secret"),
  webhookEvents: jsonb("webhook_events").default(sql`'["execution.completed", "usage.limit.reached"]'::jsonb`),
  
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  orgIdx: uniqueIndex("org_configs_org_idx").on(table.organizationId),
}));

// Organization Usage Tracking - Daily aggregated usage metrics
export const organizationUsage = pgTable("organization_usage", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  date: timestamp("date").notNull(), // Date for this usage record (UTC midnight)
  
  // Token Usage
  inputTokens: integer("input_tokens").default(0),
  outputTokens: integer("output_tokens").default(0),
  totalTokens: integer("total_tokens").default(0),
  
  // Request Counts
  totalRequests: integer("total_requests").default(0),
  successfulRequests: integer("successful_requests").default(0),
  failedRequests: integer("failed_requests").default(0),
  
  // Cost Tracking (in cents)
  totalCost: integer("total_cost").default(0),
  
  // Breakdown by Provider
  usageByProvider: jsonb("usage_by_provider").default(sql`'{}'::jsonb`), // { "openai": { tokens: 1000, cost: 50 }, ... }
  
  // Breakdown by Agent
  usageByAgent: jsonb("usage_by_agent").default(sql`'{}'::jsonb`), // { "code-review": { executions: 10, tokens: 5000 }, ... }
  
  // Feature Usage
  featureUsage: jsonb("feature_usage").default(sql`'{}'::jsonb`), // { "voice": 5, "multimodal": 3, ... }
  
  // Peak Metrics
  peakRequestsPerMinute: integer("peak_requests_per_minute").default(0),
  avgLatencyMs: integer("avg_latency_ms").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  orgDateIdx: uniqueIndex("org_usage_org_date_idx").on(table.organizationId, table.date),
  dateIdx: index("org_usage_date_idx").on(table.date),
}));

// Subscriptions - Active subscription status for organizations
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull().unique(),
  
  // Plan Information
  planId: text("plan_id").notNull().default("free"), // free, starter, professional, enterprise
  planName: text("plan_name").notNull().default("Free"),
  
  // Billing Cycle
  billingCycle: text("billing_cycle").notNull().default("monthly"), // monthly, yearly
  
  // Status
  status: text("status").notNull().default("active"), // active, past_due, canceled, trialing, paused
  
  // Dates
  currentPeriodStart: timestamp("current_period_start").notNull().defaultNow(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  trialStart: timestamp("trial_start"),
  trialEnd: timestamp("trial_end"),
  canceledAt: timestamp("canceled_at"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  
  // Payment Provider
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  razorpaySubscriptionId: text("razorpay_subscription_id"),
  
  // Pricing
  amount: integer("amount").notNull().default(0), // Price in cents
  currency: text("currency").notNull().default("USD"),
  
  // Limits from Plan
  limits: jsonb("limits").default(sql`'{
    "agents": 10,
    "providers": 3,
    "tools": 50,
    "tokensPerMonth": 100000,
    "requestsPerMinute": 60
  }'::jsonb`),
  
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  orgIdx: uniqueIndex("subscriptions_org_idx").on(table.organizationId),
  statusIdx: index("subscriptions_status_idx").on(table.status),
  stripeCustomerIdx: index("subscriptions_stripe_customer_idx").on(table.stripeCustomerId),
  stripeSubIdx: index("subscriptions_stripe_sub_idx").on(table.stripeSubscriptionId),
}));

// Invoices - Billing history
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  subscriptionId: integer("subscription_id").references(() => subscriptions.id),
  
  // Invoice Details
  invoiceNumber: text("invoice_number").notNull().unique(),
  
  // Amounts (in cents)
  subtotal: integer("subtotal").notNull(),
  tax: integer("tax").default(0),
  discount: integer("discount").default(0),
  total: integer("total").notNull(),
  amountPaid: integer("amount_paid").default(0),
  amountDue: integer("amount_due").notNull(),
  
  currency: text("currency").notNull().default("USD"),
  
  // Status
  status: text("status").notNull().default("draft"), // draft, open, paid, void, uncollectible
  
  // Dates
  invoiceDate: timestamp("invoice_date").notNull().defaultNow(),
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  
  // Line Items
  lineItems: jsonb("line_items").default(sql`'[]'::jsonb`), // [{ description, quantity, unitPrice, amount }]
  
  // Payment Provider
  stripeInvoiceId: text("stripe_invoice_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  razorpayInvoiceId: text("razorpay_invoice_id"),
  
  // PDF and Hosting
  invoicePdfUrl: text("invoice_pdf_url"),
  hostedInvoiceUrl: text("hosted_invoice_url"),
  
  // Billing Details at time of invoice
  billingDetails: jsonb("billing_details").default(sql`'{}'::jsonb`), // { name, email, address, taxId }
  
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  orgIdx: index("invoices_org_idx").on(table.organizationId),
  subIdx: index("invoices_sub_idx").on(table.subscriptionId),
  statusIdx: index("invoices_status_idx").on(table.status),
  dateIdx: index("invoices_date_idx").on(table.invoiceDate),
  stripeIdx: index("invoices_stripe_idx").on(table.stripeInvoiceId),
}));

// Organization Onboarding - Track org setup progress
export const organizationOnboarding = pgTable("organization_onboarding", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull().unique(),
  
  // Setup Steps
  currentStep: integer("current_step").default(1),
  completedSteps: jsonb("completed_steps").default(sql`'[]'::jsonb`),
  
  // Step Completion Flags
  profileCompleted: boolean("profile_completed").default(false),
  teamInvited: boolean("team_invited").default(false),
  apiKeyCreated: boolean("api_key_created").default(false),
  firstAgentExecuted: boolean("first_agent_executed").default(false),
  billingConfigured: boolean("billing_configured").default(false),
  integrationsConfigured: boolean("integrations_configured").default(false),
  
  // Completion
  completedAt: timestamp("completed_at"),
  skippedAt: timestamp("skipped_at"),
  
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  orgIdx: uniqueIndex("org_onboarding_org_idx").on(table.organizationId),
}));

// Organization Audit Log - Track important actions
export const organizationAuditLog = pgTable("organization_audit_log", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id),
  
  // Action Details
  action: text("action").notNull(), // member.added, api_key.created, settings.updated, etc.
  resource: text("resource").notNull(), // member, api_key, settings, subscription, etc.
  resourceId: text("resource_id"),
  
  // Change Details
  previousValue: jsonb("previous_value"),
  newValue: jsonb("new_value"),
  
  // Context
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  requestId: text("request_id"),
  
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  orgIdx: index("org_audit_log_org_idx").on(table.organizationId),
  userIdx: index("org_audit_log_user_idx").on(table.userId),
  actionIdx: index("org_audit_log_action_idx").on(table.action),
  resourceIdx: index("org_audit_log_resource_idx").on(table.resource),
  createdIdx: index("org_audit_log_created_idx").on(table.createdAt),
}));

// Insert Schemas for Multi-Org SaaS Tables
export const insertOrganizationApiKeySchema = createInsertSchema(organizationApiKeys).omit({ id: true, createdAt: true });
export const insertOrganizationConfigSchema = createInsertSchema(organizationConfigs).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrganizationUsageSchema = createInsertSchema(organizationUsage).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrganizationOnboardingSchema = createInsertSchema(organizationOnboarding).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrganizationAuditLogSchema = createInsertSchema(organizationAuditLog).omit({ id: true, createdAt: true });

// Type Exports for Multi-Org SaaS Tables
export type OrganizationApiKey = typeof organizationApiKeys.$inferSelect;
export type InsertOrganizationApiKey = z.infer<typeof insertOrganizationApiKeySchema>;

export type OrganizationConfig = typeof organizationConfigs.$inferSelect;
export type InsertOrganizationConfig = z.infer<typeof insertOrganizationConfigSchema>;

export type OrganizationUsage = typeof organizationUsage.$inferSelect;
export type InsertOrganizationUsage = z.infer<typeof insertOrganizationUsageSchema>;

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type OrganizationOnboarding = typeof organizationOnboarding.$inferSelect;
export type InsertOrganizationOnboarding = z.infer<typeof insertOrganizationOnboardingSchema>;

export type OrganizationAuditLog = typeof organizationAuditLog.$inferSelect;
export type InsertOrganizationAuditLog = z.infer<typeof insertOrganizationAuditLogSchema>;

// Insert Schemas for v2.1 Tables
export const insertWaiIntegrationSchema = createInsertSchema(waiIntegrations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWaiIntegrationBindingSchema = createInsertSchema(waiIntegrationBindings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWaiIntegrationExecutionSchema = createInsertSchema(waiIntegrationExecutions).omit({ id: true, createdAt: true });
export const insertWaiCam2ClusterSchema = createInsertSchema(waiCam2Clusters).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWaiGrpoSessionSchema = createInsertSchema(waiGrpoSessions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWaiQueenOrchestrationRunSchema = createInsertSchema(waiQueenOrchestrationRuns).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWaiAgentRegistryV21Schema = createInsertSchema(waiAgentRegistryV21).omit({ id: true, createdAt: true, updatedAt: true });
export const insertWaiConnectionPoolMetricsSchema = createInsertSchema(waiConnectionPoolMetrics).omit({ id: true });

// Type Exports for v2.1 Tables
export type WaiIntegration = typeof waiIntegrations.$inferSelect;
export type InsertWaiIntegration = z.infer<typeof insertWaiIntegrationSchema>;

export type WaiIntegrationBinding = typeof waiIntegrationBindings.$inferSelect;
export type InsertWaiIntegrationBinding = z.infer<typeof insertWaiIntegrationBindingSchema>;

export type WaiIntegrationExecution = typeof waiIntegrationExecutions.$inferSelect;
export type InsertWaiIntegrationExecution = z.infer<typeof insertWaiIntegrationExecutionSchema>;

export type WaiCam2Cluster = typeof waiCam2Clusters.$inferSelect;
export type InsertWaiCam2Cluster = z.infer<typeof insertWaiCam2ClusterSchema>;

export type WaiGrpoSession = typeof waiGrpoSessions.$inferSelect;
export type InsertWaiGrpoSession = z.infer<typeof insertWaiGrpoSessionSchema>;

export type WaiQueenOrchestrationRun = typeof waiQueenOrchestrationRuns.$inferSelect;
export type InsertWaiQueenOrchestrationRun = z.infer<typeof insertWaiQueenOrchestrationRunSchema>;

export type WaiAgentRegistryV21 = typeof waiAgentRegistryV21.$inferSelect;
export type InsertWaiAgentRegistryV21 = z.infer<typeof insertWaiAgentRegistryV21Schema>;

export type WaiConnectionPoolMetrics = typeof waiConnectionPoolMetrics.$inferSelect;
export type InsertWaiConnectionPoolMetrics = z.infer<typeof insertWaiConnectionPoolMetricsSchema>;

// Insert Schemas for Enterprise Multi-Org Platform Tables
export const insertOrganizationAdminSchema = createInsertSchema(organizationAdmins).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrganizationAgentTeamSchema = createInsertSchema(organizationAgentTeams).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrganizationIntelligenceRuleSchema = createInsertSchema(organizationIntelligenceRules).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrganizationLLMSettingSchema = createInsertSchema(organizationLLMSettings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrganizationPlatformFeatureSchema = createInsertSchema(organizationPlatformFeatures).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrganizationUsageMetricSchema = createInsertSchema(organizationUsageMetrics).omit({ id: true, createdAt: true });

// Type Exports for Enterprise Multi-Org Platform Tables
// Organization type already defined earlier in the file
export type OrganizationAdmin = typeof organizationAdmins.$inferSelect;
export type InsertOrganizationAdmin = z.infer<typeof insertOrganizationAdminSchema>;

export type OrganizationAgentTeam = typeof organizationAgentTeams.$inferSelect;
export type InsertOrganizationAgentTeam = z.infer<typeof insertOrganizationAgentTeamSchema>;

export type OrganizationIntelligenceRule = typeof organizationIntelligenceRules.$inferSelect;
export type InsertOrganizationIntelligenceRule = z.infer<typeof insertOrganizationIntelligenceRuleSchema>;

export type OrganizationLLMSetting = typeof organizationLLMSettings.$inferSelect;
export type InsertOrganizationLLMSetting = z.infer<typeof insertOrganizationLLMSettingSchema>;

export type OrganizationPlatformFeature = typeof organizationPlatformFeatures.$inferSelect;
export type InsertOrganizationPlatformFeature = z.infer<typeof insertOrganizationPlatformFeatureSchema>;

export type OrganizationUsageMetric = typeof organizationUsageMetrics.$inferSelect;
export type InsertOrganizationUsageMetric = z.infer<typeof insertOrganizationUsageMetricSchema>;

// =============================================================================
// ENTERPRISE PLATFORM SERVICES - P0/P1/P2 TABLES
// =============================================================================

// Visual Analytics Dashboards
export const analyticsDashboards = pgTable("analytics_dashboards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: varchar("owner_id").references(() => users.id).notNull(),
  layout: text("layout").default("grid"),
  refreshInterval: integer("refresh_interval").default(30000),
  isPublic: boolean("is_public").default(false),
  tags: jsonb("tags").default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  ownerIdx: index("dashboards_owner_idx").on(table.ownerId),
  publicIdx: index("dashboards_public_idx").on(table.isPublic),
}));

export const analyticsWidgets = pgTable("analytics_widgets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dashboardId: varchar("dashboard_id").references(() => analyticsDashboards.id).notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  dataConfig: jsonb("data_config").default(sql`'{}'::jsonb`),
  position: jsonb("position").default(sql`'{"x":0,"y":0,"w":4,"h":3}'::jsonb`),
  theme: text("theme").default("auto"),
  refreshInterval: integer("refresh_interval"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  dashboardIdx: index("widgets_dashboard_idx").on(table.dashboardId),
}));

export const analyticsMetrics = pgTable("analytics_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  value: real("value").notNull(),
  unit: text("unit"),
  trend: text("trend").default("stable"),
  changePercent: real("change_percent").default(0),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  capturedAt: timestamp("captured_at").defaultNow(),
}, (table) => ({
  nameIdx: index("metrics_name_idx").on(table.name),
  capturedIdx: index("metrics_captured_idx").on(table.capturedAt),
}));

// Content Asset Management
export const contentAssets = pgTable("content_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  category: text("category").notNull(),
  path: text("path").notNull(),
  thumbnailPath: text("thumbnail_path"),
  ownerId: varchar("owner_id").references(() => users.id).notNull(),
  folderId: varchar("folder_id"),
  version: integer("version").default(1),
  tags: jsonb("tags").default(sql`'[]'::jsonb`),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (table) => ({
  ownerIdx: index("assets_owner_idx").on(table.ownerId),
  folderIdx: index("assets_folder_idx").on(table.folderId),
  categoryIdx: index("assets_category_idx").on(table.category),
}));

export const contentAssetVersions = pgTable("content_asset_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assetId: varchar("asset_id").references(() => contentAssets.id).notNull(),
  version: integer("version").notNull(),
  path: text("path").notNull(),
  size: integer("size").notNull(),
  changelog: text("changelog"),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  assetIdx: index("asset_versions_asset_idx").on(table.assetId),
}));

// contentFolders already defined earlier in the file

export const contentCollections = pgTable("content_collections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: varchar("owner_id").references(() => users.id).notNull(),
  assetIds: jsonb("asset_ids").default(sql`'[]'::jsonb`),
  isPublic: boolean("is_public").default(false),
  coverAssetId: varchar("cover_asset_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  ownerIdx: index("collections_owner_idx").on(table.ownerId),
}));

// Multi-language Support
export const translations = pgTable("translations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull(),
  namespace: text("namespace").notNull(),
  translations: jsonb("translations").default(sql`'{}'::jsonb`),
  context: text("context"),
  pluralRules: jsonb("plural_rules"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  keyNamespaceIdx: uniqueIndex("translations_key_namespace_idx").on(table.key, table.namespace),
}));

export const languageSettings = pgTable("language_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  nativeName: text("native_name").notNull(),
  direction: text("direction").default("ltr"),
  isEnabled: boolean("is_enabled").default(false),
  completionPercentage: integer("completion_percentage").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Document Studio Projects
export const documentProjects = pgTable("document_projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: varchar("owner_id").references(() => users.id).notNull(),
  settings: jsonb("settings").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  ownerIdx: index("doc_projects_owner_idx").on(table.ownerId),
}));

export const processedDocuments = pgTable("processed_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => documentProjects.id).notNull(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  textContent: text("text_content"),
  chunks: jsonb("chunks").default(sql`'[]'::jsonb`),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  processedAt: timestamp("processed_at").defaultNow(),
}, (table) => ({
  projectIdx: index("processed_docs_project_idx").on(table.projectId),
}));

// databaseConnections already defined earlier in the file

// Research Saved Results
export const savedResearchResults = pgTable("saved_research_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  domain: text("domain").notNull(),
  query: text("query").notNull(),
  results: jsonb("results").default(sql`'[]'::jsonb`),
  dataSource: text("data_source"),
  isSynthetic: boolean("is_synthetic").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdx: index("research_user_idx").on(table.userId),
  domainIdx: index("research_domain_idx").on(table.domain),
}));

// Code Analysis Jobs
export const codeAnalysisJobs = pgTable("code_analysis_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectPath: text("project_path").notNull(),
  status: text("status").default("pending"),
  language: text("language"),
  metrics: jsonb("metrics").default(sql`'{}'::jsonb`),
  issues: jsonb("issues").default(sql`'[]'::jsonb`),
  securityIssues: jsonb("security_issues").default(sql`'[]'::jsonb`),
  suggestions: jsonb("suggestions").default(sql`'[]'::jsonb`),
  userId: varchar("user_id").references(() => users.id),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdx: index("code_analysis_user_idx").on(table.userId),
  statusIdx: index("code_analysis_status_idx").on(table.status),
}));

// Investment Research History
export const investmentResearchHistory = pgTable("investment_research_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  ticker: text("ticker"),
  companyName: text("company_name"),
  researchType: text("research_type").notNull(),
  results: jsonb("results").default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdx: index("investment_research_user_idx").on(table.userId),
  tickerIdx: index("investment_research_ticker_idx").on(table.ticker),
}));

// Insert Schemas for Enterprise Platform Tables
export const insertAnalyticsDashboardSchema = createInsertSchema(analyticsDashboards).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAnalyticsWidgetSchema = createInsertSchema(analyticsWidgets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAnalyticsMetricSchema = createInsertSchema(analyticsMetrics).omit({ id: true, capturedAt: true });
export const insertContentAssetSchema = createInsertSchema(contentAssets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertContentFolderSchema = createInsertSchema(contentFolders).omit({ id: true, createdAt: true, updatedAt: true });
export const insertContentCollectionSchema = createInsertSchema(contentCollections).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTranslationSchema = createInsertSchema(translations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDocumentProjectSchema = createInsertSchema(documentProjects).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProcessedDocumentSchema = createInsertSchema(processedDocuments).omit({ id: true, processedAt: true });
export const insertDatabaseConnectionSchema = createInsertSchema(databaseConnections).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSavedResearchResultSchema = createInsertSchema(savedResearchResults).omit({ id: true, createdAt: true });
export const insertCodeAnalysisJobSchema = createInsertSchema(codeAnalysisJobs).omit({ id: true, createdAt: true });
export const insertInvestmentResearchHistorySchema = createInsertSchema(investmentResearchHistory).omit({ id: true, createdAt: true });

// Type Exports for Enterprise Platform Tables
export type AnalyticsDashboard = typeof analyticsDashboards.$inferSelect;
export type InsertAnalyticsDashboard = z.infer<typeof insertAnalyticsDashboardSchema>;

export type AnalyticsWidget = typeof analyticsWidgets.$inferSelect;
export type InsertAnalyticsWidget = z.infer<typeof insertAnalyticsWidgetSchema>;

export type AnalyticsMetric = typeof analyticsMetrics.$inferSelect;
export type InsertAnalyticsMetric = z.infer<typeof insertAnalyticsMetricSchema>;

export type ContentAsset = typeof contentAssets.$inferSelect;
export type InsertContentAsset = z.infer<typeof insertContentAssetSchema>;

export type ContentFolder = typeof contentFolders.$inferSelect;
export type InsertContentFolder = z.infer<typeof insertContentFolderSchema>;

export type ContentCollection = typeof contentCollections.$inferSelect;
export type InsertContentCollection = z.infer<typeof insertContentCollectionSchema>;

export type Translation = typeof translations.$inferSelect;
export type InsertTranslation = z.infer<typeof insertTranslationSchema>;

export type DocumentProject = typeof documentProjects.$inferSelect;
export type InsertDocumentProject = z.infer<typeof insertDocumentProjectSchema>;

export type ProcessedDocument = typeof processedDocuments.$inferSelect;
export type InsertProcessedDocument = z.infer<typeof insertProcessedDocumentSchema>;

// DatabaseConnection types already defined earlier in the file

export type SavedResearchResult = typeof savedResearchResults.$inferSelect;
export type InsertSavedResearchResult = z.infer<typeof insertSavedResearchResultSchema>;

export type CodeAnalysisJob = typeof codeAnalysisJobs.$inferSelect;
export type InsertCodeAnalysisJob = z.infer<typeof insertCodeAnalysisJobSchema>;

export type InvestmentResearchHistory = typeof investmentResearchHistory.$inferSelect;
export type InsertInvestmentResearchHistory = z.infer<typeof insertInvestmentResearchHistorySchema>;
