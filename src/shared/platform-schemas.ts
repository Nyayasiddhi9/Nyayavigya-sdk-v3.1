/**
 * Platform-Specific Database Schemas for Independent Operation
 * 
 * Each platform can operate independently while sharing WAI orchestration
 * Designed for easy platform separation when needed
 * 
 * @version: '1.0.0
 */

import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, uuid, index, numeric } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// =============================================================================
// PLATFORM 1: CODE STUDIO - Software Development Platform
// =============================================================================

export const codeStudioProjects = pgTable("code_studio_projects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  userId: integer("user_id").notNull(),
  
  // Code Studio Specific Fields
  projectType: varchar("project_type", { length: 100 }).notNull(), // web, mobile, api, desktop, ai, game
  techStack: jsonb("tech_stack").notNull(), // languages, frameworks, tools
  architecture: jsonb("architecture").default('{}'), // microservices, monolith, serverless
  codebase: jsonb("codebase").default('{}'), // file structure, main files
  deployment: jsonb("deployment").default('{}'), // platform, CI/CD, hosting
  
  // Development Progress
  developmentPhase: varchar("development_phase", { length: 50 }).default("planning"), // planning, development, testing, deployment, maintenance
  completionPercentage: integer("completion_percentage").default(0),
  codeQualityScore: integer("code_quality_score").default(0),
  testCoverage: integer("test_coverage").default(0),
  
  // Code Generation & AI Integration
  aiGeneratedFiles: jsonb("ai_generated_files").default('[]'),
  automationLevel: varchar("automation_level", { length: 50 }).default("assisted"), // manual, assisted, automated
  codeReviewResults: jsonb("code_review_results").default('{}'),
  
  // Project Management
  roadmap: jsonb("roadmap").default('[]'), // milestones, timelines
  team: jsonb("team").default('[]'), // team members, roles
  repository: jsonb("repository").default('{}'), // git info, branches
  
  // Performance & Analytics
  buildTime: integer("build_time"), // milliseconds
  performanceMetrics: jsonb("performance_metrics").default('{}'),
  resourceUsage: jsonb("resource_usage").default('{}'),
  
  status: varchar("status", { length: 50 }).default("active"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("code_studio_user_idx").on(table.userId),
  index("code_studio_type_idx").on(table.projectType),
  index("code_studio_status_idx").on(table.status),
]);

export const codeStudioFiles = pgTable("code_studio_files", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => codeStudioProjects.id, { onDelete: "cascade" }),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  filePath: text("file_path").notNull(),
  content: text("content"),
  language: varchar("language", { length: 50 }),
  aiGenerated: boolean("ai_generated").default(false),
  codeQuality: integer("code_quality").default(0),
  lastModified: timestamp("last_modified").defaultNow(),
});

// =============================================================================
// PLATFORM 2: AI ASSISTANT BUILDER - Conversation Studio Platform
// =============================================================================

export const aiAssistantProjects = pgTable("ai_assistant_projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  userId: integer("user_id").notNull(),
  
  // AI Assistant Specific Fields
  assistantType: varchar("assistant_type", { length: 100 }).notNull(), // customer-service, educational, healthcare, entertainment
  personality: jsonb("personality").notNull(), // traits, tone, behavior
  capabilities: jsonb("capabilities").default('[]'), // text, voice, video, ar/vr
  
  // 3D Avatar Configuration
  avatarConfig: jsonb("avatar_config").default('{}'), // 3D model, animations, appearance
  voiceConfig: jsonb("voice_config").default('{}'), // voice provider, language, emotion
  emotionEngine: jsonb("emotion_engine").default('{}'), // emotional responses, expressions
  
  // Conversation & Knowledge
  ragConfig: jsonb("rag_config").default('{}'), // knowledge bases, retrieval settings
  conversationFlow: jsonb("conversation_flow").default('{}'), // flow charts, decision trees
  knowledgeBases: jsonb("knowledge_bases").default('[]'), // attached knowledge sources
  
  // Multi-modal Features
  languageSupport: jsonb("language_support").default('["en"]'), // supported languages
  multimodalCapabilities: jsonb("multimodal_capabilities").default('[]'), // vision, audio, documents
  integrations: jsonb("integrations").default('[]'), // third-party integrations
  
  // Performance & Analytics
  conversationMetrics: jsonb("conversation_metrics").default('{}'),
  userSatisfaction: numeric("user_satisfaction", { precision: 3, scale: 2 }).default('0'),
  responseAccuracy: numeric("response_accuracy", { precision: 3, scale: 2 }).default('0'),
  
  status: varchar("status", { length: 50 }).default("draft"),
  isPublished: boolean("is_published").default(false),
  publishedUrl: text("published_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("ai_assistant_user_idx").on(table.userId),
  index("ai_assistant_type_idx").on(table.assistantType),
  index("ai_assistant_status_idx").on(table.status),
]);

export const aiAssistantConversations = pgTable("ai_assistant_conversations", {
  id: serial("id").primaryKey(),
  assistantId: uuid("assistant_id").references(() => aiAssistantProjects.id, { onDelete: "cascade" }),
  sessionId: varchar("session_id", { length: 255 }).notNull(),
  messages: jsonb("messages").default('[]'),
  satisfaction: integer("satisfaction"), // 1-5 rating
  duration: integer("duration"), // seconds
  createdAt: timestamp("created_at").defaultNow(),
});

// =============================================================================
// PLATFORM 3: CONTENT STUDIO - Creative Content Platform
// =============================================================================

export const contentStudioProjects = pgTable("content_studio_projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  userId: integer("user_id").notNull(),
  
  // Content Studio Specific Fields
  contentStrategy: jsonb("content_strategy").notNull(), // goals, audience, channels
  brandGuidelines: jsonb("brand_guidelines").default('{}'), // voice, style, colors
  contentCalendar: jsonb("content_calendar").default('[]'), // scheduled content
  
  // Content Types & Generation
  contentTypes: jsonb("content_types").default('[]'), // blog, social, video, audio, images
  automationRules: jsonb("automation_rules").default('{}'), // auto-generation rules
  qualityStandards: jsonb("quality_standards").default('{}'), // quality thresholds
  
  // SEO & Performance
  seoStrategy: jsonb("seo_strategy").default('{}'), // keywords, optimization
  performanceTargets: jsonb("performance_targets").default('{}'), // engagement, reach
  distributionChannels: jsonb("distribution_channels").default('[]'), // platforms, channels
  
  // Analytics & Insights
  contentMetrics: jsonb("content_metrics").default('{}'),
  engagementRates: jsonb("engagement_rates").default('{}'),
  conversionTracking: jsonb("conversion_tracking").default('{}'),
  
  status: varchar("status", { length: 50 }).default("active"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("content_studio_user_idx").on(table.userId),
  index("content_studio_status_idx").on(table.status),
]);

export const contentStudioAssets = pgTable("content_studio_assets", {
  id: serial("id").primaryKey(),
  projectId: uuid("project_id").references(() => contentStudioProjects.id, { onDelete: "cascade" }),
  assetType: varchar("asset_type", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  assetUrl: text("asset_url"),
  metadata: jsonb("metadata").default('{}'),
  aiGenerated: boolean("ai_generated").default(false),
  qualityScore: integer("quality_score").default(0),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// =============================================================================
// PLATFORM 4: GAME BUILDER - Game Development Platform
// =============================================================================

export const gameBuilderProjects = pgTable("game_builder_projects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  userId: integer("user_id").notNull(),
  
  // Game Builder Specific Fields
  gameGenre: varchar("game_genre", { length: 100 }).notNull(), // action, puzzle, strategy, rpg
  gameEngine: varchar("game_engine", { length: 50 }).default("custom"), // unity, unreal, custom
  targetPlatform: jsonb("target_platform").default('[]'), // web, mobile, desktop, console
  
  // Game Design & Mechanics
  gameDesign: jsonb("game_design").notNull(), // core mechanics, rules, objectives
  gameAssets: jsonb("game_assets").default('{}'), // sprites, models, sounds
  levelDesign: jsonb("level_design").default('[]'), // levels, maps, progression
  
  // AI & Procedural Generation
  proceduralGeneration: jsonb("procedural_generation").default('{}'), // auto-generated content
  aiNPCs: jsonb("ai_npcs").default('[]'), // AI-driven characters
  dynamicDifficulty: jsonb("dynamic_difficulty").default('{}'), // adaptive difficulty
  
  // Monetization & Distribution
  monetizationModel: varchar("monetization_model", { length: 50 }).default("free"), // free, premium, freemium
  tournamentFeatures: jsonb("tournament_features").default('{}'), // competitive features
  multiplayerConfig: jsonb("multiplayer_config").default('{}'), // networking, lobbies
  
  // Analytics & Performance
  gameMetrics: jsonb("game_metrics").default('{}'),
  playerBehavior: jsonb("player_behavior").default('{}'),
  retentionMetrics: jsonb("retention_metrics").default('{}'),
  
  buildStatus: varchar("build_status", { length: 50 }).default("draft"),
  isPublished: boolean("is_published").default(false),
  publishedUrl: text("published_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("game_builder_user_idx").on(table.userId),
  index("game_builder_genre_idx").on(table.gameGenre),
  index("game_builder_status_idx").on(table.buildStatus),
]);

export const gameBuilderAssets = pgTable("game_builder_assets", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => gameBuilderProjects.id, { onDelete: "cascade" }),
  assetType: varchar("asset_type", { length: 50 }).notNull(), // sprite, model, sound, music
  assetName: varchar("asset_name", { length: 255 }).notNull(),
  assetData: jsonb("asset_data").notNull(),
  aiGenerated: boolean("ai_generated").default(false),
  fileSize: integer("file_size"),
  createdAt: timestamp("created_at").defaultNow(),
});

// =============================================================================
// PLATFORM 5: BUSINESS STUDIO - Enterprise Solutions Platform
// =============================================================================

export const businessStudioProjects = pgTable("business_studio_projects", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  userId: integer("user_id").notNull(),
  organizationId: integer("organization_id"),
  
  // Business Studio Specific Fields
  industry: varchar("industry", { length: 100 }).notNull(), // healthcare, finance, retail, manufacturing
  businessType: varchar("business_type", { length: 100 }).notNull(), // automation, analytics, integration, compliance
  solutionCategory: varchar("solution_category", { length: 100 }).notNull(), // crm, erp, workflow, reporting
  
  // Business Process & Automation
  processWorkflows: jsonb("process_workflows").default('{}'), // automated workflows
  businessRules: jsonb("business_rules").default('{}'), // logic, conditions, triggers
  integrationPoints: jsonb("integration_points").default('[]'), // third-party systems
  
  // Compliance & Security
  complianceRequirements: jsonb("compliance_requirements").default('[]'), // GDPR, HIPAA, SOX
  securityPolicies: jsonb("security_policies").default('{}'), // access, encryption, audit
  auditTrail: jsonb("audit_trail").default('[]'), // compliance logs
  
  // Analytics & Reporting
  kpiMetrics: jsonb("kpi_metrics").default('{}'), // key performance indicators
  reportingDashboards: jsonb("reporting_dashboards").default('[]'), // custom dashboards
  dataAnalytics: jsonb("data_analytics").default('{}'), // insights, predictions
  
  // ROI & Performance
  businessMetrics: jsonb("business_metrics").default('{}'),
  costSavings: numeric("cost_savings", { precision: 12, scale: 2 }).default('0'),
  efficiencyGains: numeric("efficiency_gains", { precision: 5, scale: 2 }).default('0'),
  
  deploymentStatus: varchar("deployment_status", { length: 50 }).default("planning"),
  isProduction: boolean("is_production").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("business_studio_user_idx").on(table.userId),
  index("business_studio_industry_idx").on(table.industry),
  index("business_studio_type_idx").on(table.businessType),
]);

export const businessStudioIntegrations = pgTable("business_studio_integrations", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => businessStudioProjects.id, { onDelete: "cascade" }),
  systemName: varchar("system_name", { length: 255 }).notNull(),
  systemType: varchar("system_type", { length: 100 }).notNull(), // crm, erp, database, api
  connectionConfig: jsonb("connection_config").notNull(),
  dataMapping: jsonb("data_mapping").default('{}'),
  syncFrequency: varchar("sync_frequency", { length: 50 }).default("real-time"),
  isActive: boolean("is_active").default(true),
  lastSync: timestamp("last_sync"),
  createdAt: timestamp("created_at").defaultNow(),
});

// =============================================================================
// SHARED PLATFORM ANALYTICS
// =============================================================================

export const platformAnalytics = pgTable("platform_analytics", {
  id: serial("id").primaryKey(),
  platform: varchar("platform", { length: 50 }).notNull(), // code-studio, ai-assistant-builder, etc.
  projectId: varchar("project_id", { length: 255 }).notNull(), // platform-specific project ID
  userId: integer("user_id").notNull(),
  
  // Usage Metrics
  sessionDuration: integer("session_duration"), // seconds
  actionsPerformed: integer("actions_performed").default(0),
  featuresUsed: jsonb("features_used").default('[]'),
  
  // Performance Metrics  
  loadTime: integer("load_time"), // milliseconds
  errorCount: integer("error_count").default(0),
  successRate: numeric("success_rate", { precision: 5, scale: 2 }).default('100'),
  
  // Business Metrics
  valueGenerated: numeric("value_generated", { precision: 12, scale: 2 }).default('0'),
  timeToCompletion: integer("time_to_completion"), // minutes
  qualityScore: integer("quality_score").default(0),
  
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => [
  index("platform_analytics_platform_idx").on(table.platform),
  index("platform_analytics_user_idx").on(table.userId),
  index("platform_analytics_timestamp_idx").on(table.timestamp),
]);

// =============================================================================
// SCHEMA EXPORTS & TYPES
// =============================================================================

// Insert Schemas
export const insertCodeStudioProjectSchema = createInsertSchema(codeStudioProjects);
export const insertAiAssistantProjectSchema = createInsertSchema(aiAssistantProjects);
export const insertContentStudioProjectSchema = createInsertSchema(contentStudioProjects);
export const insertGameBuilderProjectSchema = createInsertSchema(gameBuilderProjects);
export const insertBusinessStudioProjectSchema = createInsertSchema(businessStudioProjects);

// TypeScript Types
export type CodeStudioProject = typeof codeStudioProjects.$inferSelect;
export type AiAssistantProject = typeof aiAssistantProjects.$inferSelect;
export type ContentStudioProject = typeof contentStudioProjects.$inferSelect;
export type GameBuilderProject = typeof gameBuilderProjects.$inferSelect;
export type BusinessStudioProject = typeof businessStudioProjects.$inferSelect;

export type InsertCodeStudioProject = z.infer<typeof insertCodeStudioProjectSchema>;
export type InsertAiAssistantProject = z.infer<typeof insertAiAssistantProjectSchema>;
export type InsertContentStudioProject = z.infer<typeof insertContentStudioProjectSchema>;
export type InsertGameBuilderProject = z.infer<typeof insertGameBuilderProjectSchema>;
export type InsertBusinessStudioProject = z.infer<typeof insertBusinessStudioProjectSchema>;