/**
 * WAI Orchestration Database Schemas v9.0 - Production Implementation
 * 
 * Complete database schemas for WAI orchestration including:
 * - Memory management and context preservation
 * - Agent execution tracking and performance
 * - LLM provider health and usage analytics
 * - Request orchestration and workflow management
 * - Real-time system health and monitoring
 */

import { pgTable, text, timestamp, integer, decimal, boolean, json, uuid, serial, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ================================================================================================
// ORCHESTRATION CORE SCHEMAS
// ================================================================================================

/**
 * Main orchestration requests table
 * Tracks all orchestration requests across the system
 */
export const orchestrationRequests = pgTable('orchestration_requests', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  sessionId: text('session_id'),
  type: text('type').notNull(), // 'llm-request', 'agent-execution', 'workflow-orchestration', 'multi-agent-collaboration'
  priority: text('priority').notNull().default('medium'), // 'low', 'medium', 'high', 'urgent'
  status: text('status').notNull().default('pending'), // 'pending', 'processing', 'success', 'error', 'timeout'
  
  // Request details
  payload: json('payload').notNull(),
  requirements: json('requirements').notNull(),
  context: json('context'),
  metadata: json('metadata').notNull(),
  
  // Execution tracking
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  duration: integer('duration'), // milliseconds
  
  // Results
  result: json('result'),
  errors: json('errors'),
  qualityScore: decimal('quality_score', { precision: 3, scale: 2 }),
  cost: decimal('cost', { precision: 10, scale: 6 }),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  userIdIdx: index('orchestration_requests_user_id_idx').on(table.userId),
  sessionIdx: index('orchestration_requests_session_idx').on(table.sessionId),
  statusIdx: index('orchestration_requests_status_idx').on(table.status),
  typeIdx: index('orchestration_requests_type_idx').on(table.type),
  createdAtIdx: index('orchestration_requests_created_at_idx').on(table.createdAt)
}));

/**
 * Agent execution tracking
 * Detailed tracking of individual agent executions
 */
export const agentExecutions = pgTable('agent_executions', {
  id: uuid('id').primaryKey().defaultRandom(),
  requestId: text('request_id').references(() => orchestrationRequests.id, { onDelete: 'cascade' }),
  agentId: text('agent_id').notNull(),
  agentType: text('agent_type').notNull(),
  
  // Execution details
  task: text('task').notNull(),
  status: text('status').notNull().default('pending'), // 'pending', 'executing', 'completed', 'failed', 'timeout'
  priority: integer('priority').default(5), // 1-10 scale
  
  // Performance metrics
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  duration: integer('duration'), // milliseconds
  tokensUsed: integer('tokens_used'),
  cost: decimal('cost', { precision: 10, scale: 6 }),
  qualityScore: decimal('quality_score', { precision: 3, scale: 2 }),
  
  // Results and context
  input: json('input').notNull(),
  output: json('output'),
  context: json('context'),
  llmProvider: text('llm_provider'),
  llmModel: text('llm_model'),
  
  // Error tracking
  errorType: text('error_type'),
  errorMessage: text('error_message'),
  retryCount: integer('retry_count').default(0),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  requestIdIdx: index('agent_executions_request_id_idx').on(table.requestId),
  agentIdIdx: index('agent_executions_agent_id_idx').on(table.agentId),
  statusIdx: index('agent_executions_status_idx').on(table.status),
  startedAtIdx: index('agent_executions_started_at_idx').on(table.startedAt)
}));

/**
 * LLM provider requests and health tracking
 */
export const llmProviderRequests = pgTable('llm_provider_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  requestId: text('request_id').references(() => orchestrationRequests.id, { onDelete: 'cascade' }),
  agentExecutionId: uuid('agent_execution_id').references(() => agentExecutions.id, { onDelete: 'cascade' }),
  
  // Provider details
  provider: text('provider').notNull(),
  model: text('model').notNull(),
  endpoint: text('endpoint'),
  
  // Request details
  prompt: text('prompt').notNull(),
  parameters: json('parameters'),
  status: text('status').notNull(), // 'pending', 'completed', 'failed', 'timeout', 'rate_limited'
  
  // Response details
  response: text('response'),
  finishReason: text('finish_reason'),
  tokensUsed: json('tokens_used'), // { prompt: number, completion: number, total: number }
  cost: decimal('cost', { precision: 10, scale: 6 }),
  
  // Performance metrics
  latency: integer('latency'), // milliseconds
  qualityScore: decimal('quality_score', { precision: 3, scale: 2 }),
  
  // Error tracking
  errorCode: text('error_code'),
  errorMessage: text('error_message'),
  retryAttempt: integer('retry_attempt').default(0),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at')
}, (table) => ({
  providerIdx: index('llm_provider_requests_provider_idx').on(table.provider),
  statusIdx: index('llm_provider_requests_status_idx').on(table.status),
  createdAtIdx: index('llm_provider_requests_created_at_idx').on(table.createdAt),
  requestIdIdx: index('llm_provider_requests_request_id_idx').on(table.requestId)
}));

// ================================================================================================
// MEMORY MANAGEMENT SCHEMAS
// ================================================================================================

/**
 * Conversation memory and context storage
 */
export const conversationMemory = pgTable('conversation_memory', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  sessionId: text('session_id').notNull(),
  
  // Memory content
  type: text('type').notNull(), // 'conversation', 'context', 'preference', 'fact', 'skill'
  content: text('content').notNull(),
  summary: text('summary'),
  
  // Vector embedding for semantic search
  embedding: json('embedding'), // Store vector embeddings as JSON
  
  // Relevance and importance
  importance: decimal('importance', { precision: 3, scale: 2 }).default('0.5'),
  accessCount: integer('access_count').default(0),
  lastAccessedAt: timestamp('last_accessed_at'),
  
  // Context and metadata
  context: json('context'),
  tags: text('tags').array(),
  source: text('source'), // 'user', 'agent', 'system', 'external'
  
  // Lifecycle management
  expiresAt: timestamp('expires_at'),
  isArchived: boolean('is_archived').default(false),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  userSessionIdx: index('conversation_memory_user_session_idx').on(table.userId, table.sessionId),
  typeIdx: index('conversation_memory_type_idx').on(table.type),
  importanceIdx: index('conversation_memory_importance_idx').on(table.importance),
  createdAtIdx: index('conversation_memory_created_at_idx').on(table.createdAt),
  tagsIdx: index('conversation_memory_tags_idx').on(table.tags),
  uniqueUserSessionContent: unique('unique_user_session_content').on(table.userId, table.sessionId, table.content)
}));

/**
 * Agent knowledge and learning database
 */
export const agentKnowledge = pgTable('agent_knowledge', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: text('agent_id').notNull(),
  
  // Knowledge content
  domain: text('domain').notNull(), // 'coding', 'creative', 'business', 'technical'
  topic: text('topic').notNull(),
  knowledge: text('knowledge').notNull(),
  confidence: decimal('confidence', { precision: 3, scale: 2 }).default('0.5'),
  
  // Learning source
  source: text('source').notNull(), // 'training', 'interaction', 'feedback', 'external'
  sourceDetails: json('source_details'),
  
  // Performance tracking
  usageCount: integer('usage_count').default(0),
  successRate: decimal('success_rate', { precision: 3, scale: 2 }),
  lastUsedAt: timestamp('last_used_at'),
  
  // Version control
  version: integer('version').default(1),
  previousVersionId: uuid('previous_version_id').references(() => agentKnowledge.id),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  agentDomainIdx: index('agent_knowledge_agent_domain_idx').on(table.agentId, table.domain),
  topicIdx: index('agent_knowledge_topic_idx').on(table.topic),
  confidenceIdx: index('agent_knowledge_confidence_idx').on(table.confidence),
  usageCountIdx: index('agent_knowledge_usage_count_idx').on(table.usageCount)
}));

// ================================================================================================
// SYSTEM HEALTH AND MONITORING SCHEMAS
// ================================================================================================

/**
 * System health metrics and monitoring
 */
export const systemHealthMetrics = pgTable('system_health_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  
  // System identifier
  systemId: text('system_id').notNull().default('wai-orchestration-v9'),
  nodeId: text('node_id'), // For distributed systems
  
  // Performance metrics
  cpuUsage: decimal('cpu_usage', { precision: 5, scale: 2 }),
  memoryUsage: decimal('memory_usage', { precision: 5, scale: 2 }),
  diskUsage: decimal('disk_usage', { precision: 5, scale: 2 }),
  networkLatency: integer('network_latency'), // milliseconds
  
  // Application metrics
  errorRate: decimal('error_rate', { precision: 5, scale: 2 }),
  responseTime: integer('response_time'), // milliseconds
  throughput: integer('throughput'), // requests per second
  activeConnections: integer('active_connections'),
  queueSize: integer('queue_size'),
  
  // Agent and LLM metrics
  agentPerformance: json('agent_performance'),
  llmProviderHealth: json('llm_provider_health'),
  
  // Custom application metrics
  customMetrics: json('custom_metrics'),
  
  // Health status
  overallStatus: text('overall_status').notNull().default('healthy'), // 'healthy', 'degraded', 'critical'
  alerts: json('alerts'),
  
  // Timestamps (for partitioning)
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  timestampIdx: index('system_health_metrics_timestamp_idx').on(table.timestamp),
  systemIdx: index('system_health_metrics_system_idx').on(table.systemId),
  statusIdx: index('system_health_metrics_status_idx').on(table.overallStatus)
}));

/**
 * Anomaly detection and self-healing actions
 */
export const anomalyDetections = pgTable('anomaly_detections', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Anomaly details
  type: text('type').notNull(), // 'performance', 'error', 'resource', 'security', 'availability'
  severity: text('severity').notNull(), // 'low', 'medium', 'high', 'critical'
  metric: text('metric').notNull(),
  
  // Detection data
  expected: decimal('expected', { precision: 10, scale: 4 }),
  actual: decimal('actual', { precision: 10, scale: 4 }),
  deviation: decimal('deviation', { precision: 10, scale: 4 }),
  confidence: decimal('confidence', { precision: 3, scale: 2 }),
  
  // Description and impact
  description: text('description').notNull(),
  affectedComponents: text('affected_components').array(),
  suggestedActions: text('suggested_actions').array(),
  
  // Resolution tracking
  status: text('status').notNull().default('detected'), // 'detected', 'investigating', 'healing', 'resolved', 'ignored'
  autoHealingApplied: boolean('auto_healing_applied').default(false),
  healingActionId: uuid('healing_action_id'),
  
  // Resolution details
  resolvedAt: timestamp('resolved_at'),
  resolutionNotes: text('resolution_notes'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  typeIdx: index('anomaly_detections_type_idx').on(table.type),
  severityIdx: index('anomaly_detections_severity_idx').on(table.severity),
  statusIdx: index('anomaly_detections_status_idx').on(table.status),
  createdAtIdx: index('anomaly_detections_created_at_idx').on(table.createdAt)
}));

/**
 * Self-healing actions tracking
 */
export const healingActions = pgTable('healing_actions', {
  id: uuid('id').primaryKey().defaultRandom(),
  anomalyId: uuid('anomaly_id').references(() => anomalyDetections.id),
  
  // Action details
  action: text('action').notNull(), // 'restart_service', 'scale_resources', 'redistribute_load', 'failover', 'optimize_config'
  target: text('target').notNull(),
  parameters: json('parameters'),
  
  // Execution tracking
  status: text('status').notNull().default('pending'), // 'pending', 'executing', 'completed', 'failed'
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  duration: integer('duration'), // milliseconds
  
  // Results
  success: boolean('success'),
  result: json('result'),
  sideEffects: text('side_effects').array(),
  
  // Impact metrics
  metricsBeforeHealing: json('metrics_before_healing'),
  metricsAfterHealing: json('metrics_after_healing'),
  improvementScore: decimal('improvement_score', { precision: 3, scale: 2 }),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  anomalyIdx: index('healing_actions_anomaly_idx').on(table.anomalyId),
  actionIdx: index('healing_actions_action_idx').on(table.action),
  statusIdx: index('healing_actions_status_idx').on(table.status),
  createdAtIdx: index('healing_actions_created_at_idx').on(table.createdAt)
}));

// ================================================================================================
// PERFORMANCE AND ANALYTICS SCHEMAS
// ================================================================================================

/**
 * Agent performance analytics
 */
export const agentPerformanceMetrics = pgTable('agent_performance_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  agentId: text('agent_id').notNull(),
  
  // Time period
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  granularity: text('granularity').notNull(), // 'minute', 'hour', 'day', 'week', 'month'
  
  // Performance metrics
  totalRequests: integer('total_requests').default(0),
  successfulRequests: integer('successful_requests').default(0),
  failedRequests: integer('failed_requests').default(0),
  averageResponseTime: integer('average_response_time'), // milliseconds
  averageQualityScore: decimal('average_quality_score', { precision: 3, scale: 2 }),
  
  // Cost metrics
  totalCost: decimal('total_cost', { precision: 10, scale: 6 }),
  averageCostPerRequest: decimal('average_cost_per_request', { precision: 10, scale: 6 }),
  tokensUsed: integer('tokens_used'),
  
  // Efficiency metrics
  successRate: decimal('success_rate', { precision: 3, scale: 2 }),
  costEfficiency: decimal('cost_efficiency', { precision: 3, scale: 2 }),
  timeEfficiency: decimal('time_efficiency', { precision: 3, scale: 2 }),
  
  // Learning metrics
  improvementRate: decimal('improvement_rate', { precision: 5, scale: 4 }),
  knowledgeGrowth: decimal('knowledge_growth', { precision: 5, scale: 4 }),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  agentPeriodIdx: index('agent_performance_metrics_agent_period_idx').on(table.agentId, table.periodStart),
  granularityIdx: index('agent_performance_metrics_granularity_idx').on(table.granularity),
  periodIdx: index('agent_performance_metrics_period_idx').on(table.periodStart, table.periodEnd)
}));

/**
 * LLM provider performance and health
 */
export const llmProviderMetrics = pgTable('llm_provider_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  provider: text('provider').notNull(),
  model: text('model'),
  
  // Time period
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  granularity: text('granularity').notNull(),
  
  // Usage metrics
  totalRequests: integer('total_requests').default(0),
  successfulRequests: integer('successful_requests').default(0),
  failedRequests: integer('failed_requests').default(0),
  rateLimitedRequests: integer('rate_limited_requests').default(0),
  
  // Performance metrics
  averageLatency: integer('average_latency'), // milliseconds
  p95Latency: integer('p95_latency'),
  p99Latency: integer('p99_latency'),
  uptime: decimal('uptime', { precision: 5, scale: 4 }), // percentage
  
  // Cost metrics
  totalCost: decimal('total_cost', { precision: 10, scale: 6 }),
  totalTokens: integer('total_tokens'),
  averageCostPerToken: decimal('average_cost_per_token', { precision: 10, scale: 8 }),
  
  // Quality metrics
  averageQualityScore: decimal('average_quality_score', { precision: 3, scale: 2 }),
  
  // Health status
  healthScore: decimal('health_score', { precision: 3, scale: 2 }),
  availabilityScore: decimal('availability_score', { precision: 3, scale: 2 }),
  
  // Error analysis
  errorTypes: json('error_types'), // JSON object with error type counts
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  providerPeriodIdx: index('llm_provider_metrics_provider_period_idx').on(table.provider, table.periodStart),
  modelIdx: index('llm_provider_metrics_model_idx').on(table.model),
  healthIdx: index('llm_provider_metrics_health_idx').on(table.healthScore)
}));

// ================================================================================================
// USER AND SESSION MANAGEMENT SCHEMAS
// ================================================================================================

/**
 * User sessions and context tracking
 */
export const userSessions = pgTable('user_sessions', {
  id: text('id').primaryKey(), // session ID
  userId: text('user_id').notNull(),
  
  // Session details
  type: text('type').notNull().default('standard'), // 'standard', 'enterprise', 'api', 'streaming'
  status: text('status').notNull().default('active'), // 'active', 'inactive', 'expired', 'terminated'
  
  // Context and preferences
  context: json('context'),
  preferences: json('preferences'),
  capabilities: text('capabilities').array(),
  
  // Usage tracking
  requestCount: integer('request_count').default(0),
  totalCost: decimal('total_cost', { precision: 10, scale: 6 }).default('0'),
  lastActivityAt: timestamp('last_activity_at'),
  
  // Session lifecycle
  startedAt: timestamp('started_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
  terminatedAt: timestamp('terminated_at'),
  
  // Metadata
  clientInfo: json('client_info'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  userIdIdx: index('user_sessions_user_id_idx').on(table.userId),
  statusIdx: index('user_sessions_status_idx').on(table.status),
  lastActivityIdx: index('user_sessions_last_activity_idx').on(table.lastActivityAt),
  expiresAtIdx: index('user_sessions_expires_at_idx').on(table.expiresAt)
}));

// ================================================================================================
// WORKFLOW AND ORCHESTRATION SCHEMAS
// ================================================================================================

/**
 * Workflow definitions and templates
 */
export const workflows = pgTable('workflows', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  version: text('version').notNull().default('1.0.0'),
  
  // Workflow definition
  description: text('description'),
  definition: json('definition').notNull(), // Workflow steps, conditions, etc.
  parameters: json('parameters'), // Input parameters schema
  
  // Metadata
  category: text('category'), // 'automation', 'analysis', 'creative', 'business'
  tags: text('tags').array(),
  complexity: text('complexity').default('medium'), // 'simple', 'medium', 'complex', 'expert'
  
  // Usage and performance
  usageCount: integer('usage_count').default(0),
  averageExecutionTime: integer('average_execution_time'), // milliseconds
  successRate: decimal('success_rate', { precision: 3, scale: 2 }),
  
  // Lifecycle
  status: text('status').notNull().default('active'), // 'draft', 'active', 'deprecated', 'archived'
  isTemplate: boolean('is_template').default(false),
  parentWorkflowId: uuid('parent_workflow_id').references(() => workflows.id),
  
  // Access control
  visibility: text('visibility').notNull().default('private'), // 'private', 'organization', 'public'
  createdBy: text('created_by').notNull(),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  nameIdx: index('workflows_name_idx').on(table.name),
  categoryIdx: index('workflows_category_idx').on(table.category),
  statusIdx: index('workflows_status_idx').on(table.status),
  createdByIdx: index('workflows_created_by_idx').on(table.createdBy),
  usageCountIdx: index('workflows_usage_count_idx').on(table.usageCount)
}));

/**
 * Workflow execution instances
 */
export const workflowExecutions = pgTable('workflow_executions', {
  id: uuid('id').primaryKey().defaultRandom(),
  workflowId: uuid('workflow_id').references(() => workflows.id).notNull(),
  requestId: text('request_id').references(() => orchestrationRequests.id),
  
  // Execution context
  userId: text('user_id').notNull(),
  sessionId: text('session_id'),
  parameters: json('parameters'),
  
  // Execution tracking
  status: text('status').notNull().default('pending'), // 'pending', 'running', 'completed', 'failed', 'cancelled'
  currentStep: integer('current_step').default(0),
  totalSteps: integer('total_steps'),
  progress: decimal('progress', { precision: 3, scale: 2 }).default('0'), // percentage
  
  // Performance metrics
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  duration: integer('duration'), // milliseconds
  
  // Results and outputs
  results: json('results'),
  outputs: json('outputs'),
  
  // Error tracking
  errors: json('errors'),
  failedStep: integer('failed_step'),
  retryCount: integer('retry_count').default(0),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  workflowIdx: index('workflow_executions_workflow_idx').on(table.workflowId),
  userIdx: index('workflow_executions_user_idx').on(table.userId),
  statusIdx: index('workflow_executions_status_idx').on(table.status),
  startedAtIdx: index('workflow_executions_started_at_idx').on(table.startedAt)
}));

// ================================================================================================
// RELATIONS DEFINITIONS
// ================================================================================================

export const orchestrationRequestsRelations = relations(orchestrationRequests, ({ many }) => ({
  agentExecutions: many(agentExecutions),
  llmProviderRequests: many(llmProviderRequests),
  workflowExecutions: many(workflowExecutions)
}));

export const agentExecutionsRelations = relations(agentExecutions, ({ one, many }) => ({
  orchestrationRequest: one(orchestrationRequests, {
    fields: [agentExecutions.requestId],
    references: [orchestrationRequests.id]
  }),
  llmProviderRequests: many(llmProviderRequests)
}));

export const llmProviderRequestsRelations = relations(llmProviderRequests, ({ one }) => ({
  orchestrationRequest: one(orchestrationRequests, {
    fields: [llmProviderRequests.requestId],
    references: [orchestrationRequests.id]
  }),
  agentExecution: one(agentExecutions, {
    fields: [llmProviderRequests.agentExecutionId],
    references: [agentExecutions.id]
  })
}));

export const conversationMemoryRelations = relations(conversationMemory, ({ one }) => ({
  userSession: one(userSessions, {
    fields: [conversationMemory.sessionId],
    references: [userSessions.id]
  })
}));

export const agentKnowledgeRelations = relations(agentKnowledge, ({ one }) => ({
  previousVersion: one(agentKnowledge, {
    fields: [agentKnowledge.previousVersionId],
    references: [agentKnowledge.id]
  })
}));

export const anomalyDetectionsRelations = relations(anomalyDetections, ({ many }) => ({
  healingActions: many(healingActions)
}));

export const healingActionsRelations = relations(healingActions, ({ one }) => ({
  anomaly: one(anomalyDetections, {
    fields: [healingActions.anomalyId],
    references: [anomalyDetections.id]
  })
}));

export const workflowsRelations = relations(workflows, ({ one, many }) => ({
  parentWorkflow: one(workflows, {
    fields: [workflows.parentWorkflowId],
    references: [workflows.id]
  }),
  childWorkflows: many(workflows),
  executions: many(workflowExecutions)
}));

export const workflowExecutionsRelations = relations(workflowExecutions, ({ one }) => ({
  workflow: one(workflows, {
    fields: [workflowExecutions.workflowId],
    references: [workflows.id]
  }),
  orchestrationRequest: one(orchestrationRequests, {
    fields: [workflowExecutions.requestId],
    references: [orchestrationRequests.id]
  }),
  userSession: one(userSessions, {
    fields: [workflowExecutions.sessionId],
    references: [userSessions.id]
  })
}));

export const userSessionsRelations = relations(userSessions, ({ many }) => ({
  conversationMemory: many(conversationMemory),
  workflowExecutions: many(workflowExecutions)
}));

// ================================================================================================
// EXPORT ALL SCHEMAS
// ================================================================================================

export const orchestrationSchemas = {
  // Core orchestration
  orchestrationRequests,
  agentExecutions,
  llmProviderRequests,
  
  // Memory management
  conversationMemory,
  agentKnowledge,
  
  // System health
  systemHealthMetrics,
  anomalyDetections,
  healingActions,
  
  // Performance analytics
  agentPerformanceMetrics,
  llmProviderMetrics,
  
  // User management
  userSessions,
  
  // Workflow management
  workflows,
  workflowExecutions
};

export const orchestrationRelations = {
  orchestrationRequestsRelations,
  agentExecutionsRelations,
  llmProviderRequestsRelations,
  conversationMemoryRelations,
  agentKnowledgeRelations,
  anomalyDetectionsRelations,
  healingActionsRelations,
  workflowsRelations,
  workflowExecutionsRelations,
  userSessionsRelations
};

// Export types for use in application
export type OrchestrationRequest = typeof orchestrationRequests.$inferSelect;
export type NewOrchestrationRequest = typeof orchestrationRequests.$inferInsert;
export type AgentExecution = typeof agentExecutions.$inferSelect;
export type NewAgentExecution = typeof agentExecutions.$inferInsert;
export type LLMProviderRequest = typeof llmProviderRequests.$inferSelect;
export type NewLLMProviderRequest = typeof llmProviderRequests.$inferInsert;
export type ConversationMemory = typeof conversationMemory.$inferSelect;
export type NewConversationMemory = typeof conversationMemory.$inferInsert;
export type AgentKnowledge = typeof agentKnowledge.$inferSelect;
export type NewAgentKnowledge = typeof agentKnowledge.$inferInsert;
export type SystemHealthMetrics = typeof systemHealthMetrics.$inferSelect;
export type NewSystemHealthMetrics = typeof systemHealthMetrics.$inferInsert;
export type AnomalyDetection = typeof anomalyDetections.$inferSelect;
export type NewAnomalyDetection = typeof anomalyDetections.$inferInsert;
export type HealingAction = typeof healingActions.$inferSelect;
export type NewHealingAction = typeof healingActions.$inferInsert;
export type UserSession = typeof userSessions.$inferSelect;
export type NewUserSession = typeof userSessions.$inferInsert;
export type Workflow = typeof workflows.$inferSelect;
export type NewWorkflow = typeof workflows.$inferInsert;
export type WorkflowExecution = typeof workflowExecutions.$inferSelect;
export type NewWorkflowExecution = typeof workflowExecutions.$inferInsert;