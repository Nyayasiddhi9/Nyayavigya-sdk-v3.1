/**
 * Phase 1: Enterprise Evaluation System Schema
 * Automated response quality assessment and monitoring for enterprise trust
 */

import { pgTable, serial, varchar, text, integer, timestamp, boolean, real, json, uuid } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Evaluation Metrics Table
export const evaluationMetrics = pgTable('evaluation_metrics', {
  id: serial('id').primaryKey(),
  requestId: varchar('request_id', { length: 255 }).notNull(),
  agentName: varchar('agent_name', { length: 255 }).notNull(),
  llmProvider: varchar('llm_provider', { length: 100 }).notNull(),
  
  // Core Quality Metrics
  hallucinationScore: real('hallucination_score').notNull(), // 0-1, lower is better
  factualityScore: real('factuality_score').notNull(), // 0-1, higher is better
  relevanceScore: real('relevance_score').notNull(), // 0-1, higher is better
  coherenceScore: real('coherence_score').notNull(), // 0-1, higher is better
  
  // Overall Assessment
  responseQuality: varchar('response_quality', { length: 20 }).notNull(), // excellent, good, fair, poor
  overallScore: real('overall_score').notNull(), // 0-100
  
  // Performance Metrics
  responseTime: integer('response_time').notNull(), // milliseconds
  tokenCount: integer('token_count'),
  cost: real('cost'), // USD
  
  // Request Context
  userPrompt: text('user_prompt').notNull(),
  agentResponse: text('agent_response').notNull(),
  
  // Metadata
  evaluationVersion: varchar('evaluation_version', { length: 50 }).default('v1.0'),
  evaluatedAt: timestamp('evaluated_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// A/B Testing Framework
export const abTestExperiments = pgTable('ab_test_experiments', {
  id: serial('id').primaryKey(),
  experimentId: uuid('experiment_id').defaultRandom().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  
  // Experiment Configuration
  status: varchar('status', { length: 20 }).default('draft').notNull(), // draft, active, paused, completed
  trafficSplit: real('traffic_split').default(0.5).notNull(), // 0-1, percentage for variant B
  
  // Agent Variants
  controlAgentConfig: json('control_agent_config').notNull(), // Agent A configuration
  variantAgentConfig: json('variant_agent_config').notNull(), // Agent B configuration
  
  // Success Metrics
  primaryMetric: varchar('primary_metric', { length: 100 }).notNull(), // response_quality, response_time, etc.
  secondaryMetrics: json('secondary_metrics'), // Array of additional metrics to track
  
  // Experiment Timeline
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  
  // Results
  controlResults: json('control_results'), // Aggregated results for control group
  variantResults: json('variant_results'), // Aggregated results for variant group
  statisticalSignificance: real('statistical_significance'), // p-value
  winner: varchar('winner', { length: 20 }), // control, variant, inconclusive
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// A/B Test Participants
export const abTestParticipants = pgTable('ab_test_participants', {
  id: serial('id').primaryKey(),
  experimentId: uuid('experiment_id').notNull(),
  sessionId: varchar('session_id', { length: 255 }).notNull(),
  userId: integer('user_id'),
  
  // Assignment
  variant: varchar('variant', { length: 20 }).notNull(), // control, variant
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  
  // Tracking
  interactionCount: integer('interaction_count').default(0),
  lastInteraction: timestamp('last_interaction')
});

// Evaluation Dataset Management
export const evaluationDatasets = pgTable('evaluation_datasets', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }).notNull(), // general, domain-specific, adversarial
  
  // Dataset Configuration
  version: varchar('version', { length: 50 }).default('1.0').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  isPublic: boolean('is_public').default(false).notNull(),
  
  // Content
  totalSamples: integer('total_samples').default(0).notNull(),
  tags: json('tags'), // Array of tags for categorization
  
  createdBy: integer('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Evaluation Dataset Samples
export const evaluationSamples = pgTable('evaluation_samples', {
  id: serial('id').primaryKey(),
  datasetId: integer('dataset_id').notNull(),
  
  // Sample Content
  prompt: text('prompt').notNull(),
  expectedResponse: text('expected_response'),
  context: text('context'), // Additional context for evaluation
  
  // Ground Truth Labels
  category: varchar('category', { length: 100 }),
  difficulty: varchar('difficulty', { length: 20 }), // easy, medium, hard
  tags: json('tags'),
  
  // Evaluation Results
  lastEvaluatedAt: timestamp('last_evaluated_at'),
  averageScore: real('average_score'),
  evaluationCount: integer('evaluation_count').default(0),
  
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Real-time Monitoring Alerts
export const evaluationAlerts = pgTable('evaluation_alerts', {
  id: serial('id').primaryKey(),
  alertId: uuid('alert_id').defaultRandom().notNull(),
  
  // Alert Configuration
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  
  // Trigger Conditions
  metric: varchar('metric', { length: 100 }).notNull(), // hallucination_score, response_time, etc.
  operator: varchar('operator', { length: 10 }).notNull(), // gt, lt, eq, gte, lte
  threshold: real('threshold').notNull(),
  
  // Alert Settings
  severity: varchar('severity', { length: 20 }).default('medium').notNull(), // low, medium, high, critical
  channels: json('channels'), // Array of notification channels (email, slack, webhook)
  
  // Tracking
  triggerCount: integer('trigger_count').default(0),
  lastTriggered: timestamp('last_triggered'),
  
  createdBy: integer('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Agent Performance Benchmarks
export const agentBenchmarks = pgTable('agent_benchmarks', {
  id: serial('id').primaryKey(),
  agentName: varchar('agent_name', { length: 255 }).notNull(),
  benchmarkType: varchar('benchmark_type', { length: 100 }).notNull(),
  
  // Performance Metrics
  averageResponseTime: real('average_response_time').notNull(),
  averageQualityScore: real('average_quality_score').notNull(),
  successRate: real('success_rate').notNull(), // 0-1
  averageCost: real('average_cost').notNull(),
  
  // Benchmark Period
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  sampleCount: integer('sample_count').notNull(),
  
  // Comparative Analysis
  rank: integer('rank'), // Ranking among all agents
  improvementScore: real('improvement_score'), // Improvement from previous period
  
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Zod Schemas for Validation
export const insertEvaluationMetricsSchema = createInsertSchema(evaluationMetrics, {
  hallucinationScore: z.number().min(0).max(1),
  factualityScore: z.number().min(0).max(1),
  relevanceScore: z.number().min(0).max(1),
  coherenceScore: z.number().min(0).max(1),
  responseQuality: z.enum(['excellent', 'good', 'fair', 'poor']),
  overallScore: z.number().min(0).max(100)
});

export const insertAbTestExperimentSchema = createInsertSchema(abTestExperiments, {
  status: z.enum(['draft', 'active', 'paused', 'completed']),
  trafficSplit: z.number().min(0).max(1),
  primaryMetric: z.string().min(1)
});

export const insertEvaluationDatasetSchema = createInsertSchema(evaluationDatasets, {
  category: z.enum(['general', 'domain-specific', 'adversarial']),
  version: z.string().min(1)
});

export const insertEvaluationAlertSchema = createInsertSchema(evaluationAlerts, {
  metric: z.string().min(1),
  operator: z.enum(['gt', 'lt', 'eq', 'gte', 'lte']),
  severity: z.enum(['low', 'medium', 'high', 'critical'])
});

// Types
export type EvaluationMetrics = typeof evaluationMetrics.$inferSelect;
export type InsertEvaluationMetrics = z.infer<typeof insertEvaluationMetricsSchema>;

export type AbTestExperiment = typeof abTestExperiments.$inferSelect;
export type InsertAbTestExperiment = z.infer<typeof insertAbTestExperimentSchema>;

export type EvaluationDataset = typeof evaluationDatasets.$inferSelect;
export type InsertEvaluationDataset = z.infer<typeof insertEvaluationDatasetSchema>;

export type EvaluationAlert = typeof evaluationAlerts.$inferSelect;
export type InsertEvaluationAlert = z.infer<typeof insertEvaluationAlertSchema>;