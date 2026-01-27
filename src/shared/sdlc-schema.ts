import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, index, foreignKey } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./schema";

/**
 * SDLC 100% Automation Schema
 * WAI SDK v1.0 as Single Source of Truth
 * 8 Complete Workflows: Discovery → Triage → Sprint → Quality → Package → Deploy → Monitor → Feedback
 */

// SDLC Workflows - Master workflow tracking
export const sdlcWorkflows = pgTable("sdlc_workflows", {
  id: serial("id").primaryKey(),
  workflowId: varchar("workflow_id").notNull().unique(),
  founderId: varchar("founder_id").references(() => users.id).notNull(),
  projectId: integer("project_id").notNull(),
  
  // Workflow identification
  name: text("name").notNull(), // "Discovery", "Triage", "Sprint", etc.
  type: text("type").notNull(), // discovery, triage, sprint, quality, package, deploy, monitor, feedback
  description: text("description"),
  
  // Status tracking
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, failed, blocked
  progress: integer("progress").default(0), // 0-100
  
  // WAI SDK orchestration
  waiOrchestrationId: text("wai_orchestration_id"), // WAI SDK run ID
  assignedAgents: jsonb("assigned_agents").default(sql`'[]'::jsonb`), // Array of agent IDs from WAI SDK
  agentOutputs: jsonb("agent_outputs").default(sql`'{}'::jsonb`), // Structured outputs from agents
  
  // Workflow configuration
  config: jsonb("config").default(sql`'{}'::jsonb`), // Workflow-specific config
  inputData: jsonb("input_data").default(sql`'{}'::jsonb`), // Input from previous workflow
  outputData: jsonb("output_data").default(sql`'{}'::jsonb`), // Output for next workflow
  
  // Dependencies
  dependencies: jsonb("dependencies").default(sql`'[]'::jsonb`), // Array of workflow IDs this depends on
  blockedBy: jsonb("blocked_by").default(sql`'[]'::jsonb`), // Array of workflow IDs blocking this
  
  // Timeline
  scheduledStart: timestamp("scheduled_start"),
  actualStart: timestamp("actual_start"),
  scheduledEnd: timestamp("scheduled_end"),
  actualEnd: timestamp("actual_end"),
  estimatedDuration: integer("estimated_duration"), // minutes
  actualDuration: integer("actual_duration"), // minutes
  
  // Metrics
  costEstimate: integer("cost_estimate"), // cents
  actualCost: integer("actual_cost"), // cents
  qualityScore: integer("quality_score"), // 0-100
  
  // Error handling
  errorCount: integer("error_count").default(0),
  lastError: jsonb("last_error"),
  retryCount: integer("retry_count").default(0),
  maxRetries: integer("max_retries").default(3),
  
  // Metadata
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  tags: jsonb("tags").default(sql`'[]'::jsonb`),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  founderIdIdx: index("sdlc_workflows_founder_idx").on(table.founderId),
  projectIdIdx: index("sdlc_workflows_project_idx").on(table.projectId),
  statusIdx: index("sdlc_workflows_status_idx").on(table.status),
  typeIdx: index("sdlc_workflows_type_idx").on(table.type),
  waiOrchestrationIdx: index("sdlc_workflows_wai_idx").on(table.waiOrchestrationId),
}));

// SDLC Stages - Sub-stages within workflows
export const sdlcStages = pgTable("sdlc_stages", {
  id: serial("id").primaryKey(),
  stageId: varchar("stage_id").notNull().unique(),
  workflowId: varchar("workflow_id").references(() => sdlcWorkflows.workflowId).notNull(),
  
  // Stage identification
  name: text("name").notNull(),
  description: text("description"),
  sequenceOrder: integer("sequence_order").notNull(), // Order within workflow
  
  // Status
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, failed
  progress: integer("progress").default(0),
  
  // WAI SDK integration
  waiAgentType: text("wai_agent_type"), // Specific WAI SDK agent type for this stage
  waiTaskId: text("wai_task_id"), // WAI SDK task ID
  agentResponse: jsonb("agent_response"), // Structured response from WAI SDK agent
  
  // Timeline
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  estimatedDuration: integer("estimated_duration"),
  actualDuration: integer("actual_duration"),
  
  // Dependencies
  dependsOn: jsonb("depends_on").default(sql`'[]'::jsonb`), // Stage IDs this depends on
  
  // Output
  artifacts: jsonb("artifacts").default(sql`'[]'::jsonb`), // Generated artifact IDs
  deliverables: jsonb("deliverables").default(sql`'{}'::jsonb`), // Structured deliverables
  
  // Metadata
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  workflowIdIdx: index("sdlc_stages_workflow_idx").on(table.workflowId),
  statusIdx: index("sdlc_stages_status_idx").on(table.status),
  sequenceIdx: index("sdlc_stages_sequence_idx").on(table.sequenceOrder),
}));

// SDLC Tasks - Individual tasks from WAI SDK
export const sdlcTasks = pgTable("sdlc_tasks", {
  id: serial("id").primaryKey(),
  taskId: varchar("task_id").notNull().unique(),
  stageId: varchar("stage_id").references(() => sdlcStages.stageId).notNull(),
  workflowId: varchar("workflow_id").references(() => sdlcWorkflows.workflowId).notNull(),
  
  // Task identification
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // analysis, generation, validation, deployment, etc.
  priority: text("priority").notNull().default("medium"), // low, medium, high, critical
  
  // WAI SDK orchestration
  waiAgentId: text("wai_agent_id"), // Specific WAI SDK agent assigned
  waiAgentName: text("wai_agent_name"),
  waiExecutionId: text("wai_execution_id"), // WAI SDK execution ID
  agentPrompt: text("agent_prompt"), // Prompt sent to WAI SDK agent
  agentResponse: jsonb("agent_response"), // Response from WAI SDK agent
  
  // Status
  status: text("status").notNull().default("pending"), // pending, assigned, in_progress, review, completed, failed
  progress: integer("progress").default(0),
  
  // Assignment
  assignedTo: text("assigned_to"), // User ID or agent ID
  assignedAt: timestamp("assigned_at"),
  
  // Timeline
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  dueDate: timestamp("due_date"),
  estimatedEffort: integer("estimated_effort"), // story points or hours
  actualEffort: integer("actual_effort"),
  
  // Output
  artifacts: jsonb("artifacts").default(sql`'[]'::jsonb`), // Artifact IDs generated
  codeChanges: jsonb("code_changes"), // Code diffs, file changes
  testResults: jsonb("test_results"), // Test execution results
  qualityMetrics: jsonb("quality_metrics"), // Code quality, coverage, etc.
  
  // Dependencies
  dependsOn: jsonb("depends_on").default(sql`'[]'::jsonb`), // Task IDs this depends on
  blockedBy: jsonb("blocked_by").default(sql`'[]'::jsonb`), // Task IDs blocking this
  
  // Validation
  requiresApproval: boolean("requires_approval").default(false),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  
  // Error handling
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0),
  
  // Metadata
  labels: jsonb("labels").default(sql`'[]'::jsonb`),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  stageIdIdx: index("sdlc_tasks_stage_idx").on(table.stageId),
  workflowIdIdx: index("sdlc_tasks_workflow_idx").on(table.workflowId),
  statusIdx: index("sdlc_tasks_status_idx").on(table.status),
  assignedToIdx: index("sdlc_tasks_assigned_idx").on(table.assignedTo),
  waiAgentIdx: index("sdlc_tasks_wai_agent_idx").on(table.waiAgentId),
}));

// SDLC Artifacts - All generated artifacts
export const sdlcArtifacts = pgTable("sdlc_artifacts", {
  id: serial("id").primaryKey(),
  artifactId: varchar("artifact_id").notNull().unique(),
  workflowId: varchar("workflow_id").references(() => sdlcWorkflows.workflowId).notNull(),
  taskId: varchar("task_id").references(() => sdlcTasks.taskId),
  
  // Artifact identification
  name: text("name").notNull(),
  type: text("type").notNull(), // code, document, design, config, test, deployment, analysis
  category: text("category"), // frontend, backend, database, infrastructure, etc.
  
  // Content
  contentType: text("content_type"), // application/json, text/plain, image/png, etc.
  content: text("content"), // Actual content or reference
  contentUrl: text("content_url"), // External storage URL
  contentSize: integer("content_size"), // bytes
  
  // Version control
  version: text("version").notNull().default("1.0.0"),
  previousVersion: text("previous_version"),
  changeLog: text("change_log"),
  
  // WAI SDK metadata
  generatedBy: text("generated_by"), // WAI SDK agent ID that generated this
  generationPrompt: text("generation_prompt"), // Prompt used to generate
  generationCost: integer("generation_cost"), // cents
  
  // Quality metrics
  qualityScore: integer("quality_score"), // 0-100
  validationStatus: text("validation_status").default("pending"), // pending, passed, failed
  validationErrors: jsonb("validation_errors").default(sql`'[]'::jsonb`),
  
  // Relationships
  relatedArtifacts: jsonb("related_artifacts").default(sql`'[]'::jsonb`), // Related artifact IDs
  dependencies: jsonb("dependencies").default(sql`'[]'::jsonb`), // Artifact dependencies
  
  // Storage
  storageProvider: text("storage_provider"), // local, s3, gcs, azure, artifact_store
  storagePath: text("storage_path"),
  
  // Lifecycle
  status: text("status").notNull().default("active"), // active, archived, deleted
  archivedAt: timestamp("archived_at"),
  deletedAt: timestamp("deleted_at"),
  
  // Metadata
  tags: jsonb("tags").default(sql`'[]'::jsonb`),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  workflowIdIdx: index("sdlc_artifacts_workflow_idx").on(table.workflowId),
  taskIdIdx: index("sdlc_artifacts_task_idx").on(table.taskId),
  typeIdx: index("sdlc_artifacts_type_idx").on(table.type),
  statusIdx: index("sdlc_artifacts_status_idx").on(table.status),
  generatedByIdx: index("sdlc_artifacts_agent_idx").on(table.generatedBy),
}));

// SDLC Approvals - Quality gates and approvals
export const sdlcApprovals = pgTable("sdlc_approvals", {
  id: serial("id").primaryKey(),
  approvalId: varchar("approval_id").notNull().unique(),
  workflowId: varchar("workflow_id").references(() => sdlcWorkflows.workflowId).notNull(),
  taskId: varchar("task_id").references(() => sdlcTasks.taskId),
  
  // Approval type
  type: text("type").notNull(), // code_review, quality_gate, security_scan, deployment_approval
  name: text("name").notNull(),
  description: text("description"),
  
  // Status
  status: text("status").notNull().default("pending"), // pending, approved, rejected, bypassed
  
  // Approver
  requestedFrom: varchar("requested_from").references(() => users.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  
  // Decision
  decision: text("decision"), // approve, reject, request_changes
  comments: text("comments"),
  conditions: jsonb("conditions").default(sql`'[]'::jsonb`), // Approval conditions
  
  // Quality gate criteria
  criteria: jsonb("criteria").default(sql`'{}'::jsonb`), // Quality criteria to check
  criteriaResults: jsonb("criteria_results").default(sql`'{}'::jsonb`), // Results of criteria checks
  passed: boolean("passed"),
  
  // WAI SDK automation
  automatedCheck: boolean("automated_check").default(true), // Auto-check via WAI SDK
  waiValidatorAgent: text("wai_validator_agent"), // WAI SDK agent for validation
  validationResponse: jsonb("validation_response"), // Response from validator
  
  // Artifacts to approve
  artifactIds: jsonb("artifact_ids").default(sql`'[]'::jsonb`),
  
  // Timeline
  requestedAt: timestamp("requested_at").defaultNow(),
  dueDate: timestamp("due_date"),
  
  // Metadata
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  workflowIdIdx: index("sdlc_approvals_workflow_idx").on(table.workflowId),
  taskIdIdx: index("sdlc_approvals_task_idx").on(table.taskId),
  statusIdx: index("sdlc_approvals_status_idx").on(table.status),
  requestedFromIdx: index("sdlc_approvals_requester_idx").on(table.requestedFrom),
}));

// SDLC Workflow Executions - Detailed execution logs
export const sdlcWorkflowExecutions = pgTable("sdlc_workflow_executions", {
  id: serial("id").primaryKey(),
  executionId: varchar("execution_id").notNull().unique(),
  workflowId: varchar("workflow_id").references(() => sdlcWorkflows.workflowId).notNull(),
  
  // Execution details
  triggeredBy: varchar("triggered_by").references(() => users.id),
  triggerType: text("trigger_type").notNull(), // manual, automated, scheduled, event
  triggerEvent: text("trigger_event"), // Event that triggered execution
  
  // WAI SDK orchestration
  waiOrchestrationRun: text("wai_orchestration_run"), // WAI SDK run ID
  agentExecutions: jsonb("agent_executions").default(sql`'[]'::jsonb`), // Array of agent execution records
  
  // Status
  status: text("status").notNull(), // running, completed, failed, cancelled
  
  // Timeline
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
  duration: integer("duration"), // seconds
  
  // Results
  success: boolean("success"),
  output: jsonb("output"), // Structured output
  errorMessage: text("error_message"),
  errorStack: text("error_stack"),
  
  // Metrics
  tasksExecuted: integer("tasks_executed").default(0),
  tasksSucceeded: integer("tasks_succeeded").default(0),
  tasksFailed: integer("tasks_failed").default(0),
  artifactsGenerated: integer("artifacts_generated").default(0),
  totalCost: integer("total_cost").default(0), // cents
  
  // Logs
  executionLogs: jsonb("execution_logs").default(sql`'[]'::jsonb`), // Detailed execution logs
  
  // Metadata
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  workflowIdIdx: index("sdlc_executions_workflow_idx").on(table.workflowId),
  statusIdx: index("sdlc_executions_status_idx").on(table.status),
  triggeredByIdx: index("sdlc_executions_trigger_idx").on(table.triggeredBy),
  startedAtIdx: index("sdlc_executions_started_idx").on(table.startedAt),
}));

// Zod schemas for validation
export const insertSdlcWorkflowSchema = createInsertSchema(sdlcWorkflows).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSdlcStageSchema = createInsertSchema(sdlcStages).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSdlcTaskSchema = createInsertSchema(sdlcTasks).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSdlcArtifactSchema = createInsertSchema(sdlcArtifacts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSdlcApprovalSchema = createInsertSchema(sdlcApprovals).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSdlcWorkflowExecutionSchema = createInsertSchema(sdlcWorkflowExecutions).omit({ id: true, createdAt: true });

// Type exports
export type SdlcWorkflow = typeof sdlcWorkflows.$inferSelect;
export type InsertSdlcWorkflow = z.infer<typeof insertSdlcWorkflowSchema>;

export type SdlcStage = typeof sdlcStages.$inferSelect;
export type InsertSdlcStage = z.infer<typeof insertSdlcStageSchema>;

export type SdlcTask = typeof sdlcTasks.$inferSelect;
export type InsertSdlcTask = z.infer<typeof insertSdlcTaskSchema>;

export type SdlcArtifact = typeof sdlcArtifacts.$inferSelect;
export type InsertSdlcArtifact = z.infer<typeof insertSdlcArtifactSchema>;

export type SdlcApproval = typeof sdlcApprovals.$inferSelect;
export type InsertSdlcApproval = z.infer<typeof insertSdlcApprovalSchema>;

export type SdlcWorkflowExecution = typeof sdlcWorkflowExecutions.$inferSelect;
export type InsertSdlcWorkflowExecution = z.infer<typeof insertSdlcWorkflowExecutionSchema>;
