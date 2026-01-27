/**
 * Security Audit Database Schema
 * 
 * Production schema for storing security audit logs, vulnerability findings,
 * compliance reports, and attack simulations
 */

import { pgTable, text, serial, timestamp, jsonb, integer, boolean } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

/**
 * Security Audit Logs
 * Stores all security scan results with full audit trail
 */
export const securityAuditLogs = pgTable('security_audit_logs', {
  id: serial('id').primaryKey(),
  scanType: text('scan_type').notNull(), // 'prompt_injection', 'pii_detection', 'malicious_code', etc.
  targetType: text('target_type').notNull(), // 'prompt', 'code', 'output', 'plugin', etc.
  targetId: text('target_id'), // Optional reference to target entity
  severity: text('severity').notNull(), // 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'
  vulnerabilityType: text('vulnerability_type').notNull(), // LLM01-LLM10
  owaspId: text('owasp_id').notNull(), // e.g., 'LLM01', 'LLM02'
  cweId: text('cwe_id'), // Common Weakness Enumeration ID
  title: text('title').notNull(),
  description: text('description').notNull(),
  location: text('location').notNull(),
  evidence: text('evidence'), // Truncated evidence (not full content for security)
  recommendation: text('recommendation').notNull(),
  rawData: jsonb('raw_data'), // Full scan data as JSON
  agentId: text('agent_id'), // Which agent triggered the scan
  userId: text('user_id'), // Which user (for compliance)
  projectId: text('project_id'), // Which project
  resolved: boolean('resolved').default(false),
  resolvedAt: timestamp('resolved_at'),
  resolvedBy: text('resolved_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const insertSecurityAuditLogSchema = createInsertSchema(securityAuditLogs).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type InsertSecurityAuditLog = z.infer<typeof insertSecurityAuditLogSchema>;
export type SecurityAuditLog = typeof securityAuditLogs.$inferSelect;

/**
 * PII Detections
 * Stores detected personally identifiable information
 */
export const piiDetections = pgTable('pii_detections', {
  id: serial('id').primaryKey(),
  auditLogId: integer('audit_log_id').references(() => securityAuditLogs.id, { onDelete: 'cascade' }),
  piiType: text('pii_type').notNull(), // 'email', 'phone', 'ssn', 'credit_card', etc.
  confidence: integer('confidence').notNull(), // 0-100
  locationStart: integer('location_start').notNull(),
  locationEnd: integer('location_end').notNull(),
  redactedValue: text('redacted_value').notNull(),
  context: text('context'), // Surrounding text for context
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const insertPiiDetectionSchema = createInsertSchema(piiDetections).omit({
  id: true,
  createdAt: true
});

export type InsertPiiDetection = z.infer<typeof insertPiiDetectionSchema>;
export type PiiDetection = typeof piiDetections.$inferSelect;

/**
 * Compliance Reports
 * Stores generated compliance reports (SOC2, GDPR, HIPAA, etc.)
 */
export const complianceReports = pgTable('compliance_reports', {
  id: serial('id').primaryKey(),
  standard: text('standard').notNull(), // 'SOC2', 'GDPR', 'HIPAA', 'PCI-DSS'
  reportType: text('report_type').notNull(), // 'full_audit', 'delta', 'remediation'
  dateRangeStart: timestamp('date_range_start').notNull(),
  dateRangeEnd: timestamp('date_range_end').notNull(),
  compliant: boolean('compliant').notNull(),
  criticalFindings: integer('critical_findings').default(0),
  highFindings: integer('high_findings').default(0),
  mediumFindings: integer('medium_findings').default(0),
  lowFindings: integer('low_findings').default(0),
  infoFindings: integer('info_findings').default(0),
  totalFindings: integer('total_findings').default(0),
  findings: jsonb('findings').notNull(), // Array of SecurityVulnerability
  recommendations: jsonb('recommendations').notNull(), // Array of strings
  evidenceSources: jsonb('evidence_sources'), // Links to logs, documents, etc.
  generatedBy: text('generated_by'), // User or system that generated
  approvedBy: text('approved_by'),
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const insertComplianceReportSchema = createInsertSchema(complianceReports).omit({
  id: true,
  createdAt: true
});

export type InsertComplianceReport = z.infer<typeof insertComplianceReportSchema>;
export type ComplianceReport = typeof complianceReports.$inferSelect;

/**
 * Attack Simulations
 * Stores results of adversarial testing, jailbreak simulations, etc.
 */
export const attackSimulations = pgTable('attack_simulations', {
  id: serial('id').primaryKey(),
  attackType: text('attack_type').notNull(), // 'jailbreak', 'prompt_injection', 'adversarial', 'data_extraction'
  targetAgent: text('target_agent').notNull(),
  payload: text('payload').notNull(),
  response: text('response'),
  successful: boolean('successful').notNull(),
  severity: text('severity').notNull(),
  detectionMethod: text('detection_method'), // How it was detected/blocked
  blocked: boolean('blocked').default(false),
  mitigation: text('mitigation'),
  techniques: jsonb('techniques'), // Array of techniques used
  metadata: jsonb('metadata'), // Additional attack details
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const insertAttackSimulationSchema = createInsertSchema(attackSimulations).omit({
  id: true,
  createdAt: true
});

export type InsertAttackSimulation = z.infer<typeof insertAttackSimulationSchema>;
export type AttackSimulation = typeof attackSimulations.$inferSelect;

/**
 * Vulnerability History
 * Tracks vulnerability lifecycle (discovered → triaged → fixed → verified)
 */
export const vulnerabilityHistory = pgTable('vulnerability_history', {
  id: serial('id').primaryKey(),
  vulnerabilityId: text('vulnerability_id').notNull().unique(), // UUID for tracking
  auditLogId: integer('audit_log_id').references(() => securityAuditLogs.id),
  status: text('status').notNull(), // 'discovered', 'triaged', 'in_progress', 'fixed', 'verified', 'wont_fix'
  assignedTo: text('assigned_to'),
  priority: text('priority').notNull(), // 'P0', 'P1', 'P2', 'P3'
  cvssScore: integer('cvss_score'), // 0-100 CVSS score
  affectedSystems: jsonb('affected_systems'), // List of affected components
  remediationPlan: text('remediation_plan'),
  verificationDate: timestamp('verification_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const insertVulnerabilityHistorySchema = createInsertSchema(vulnerabilityHistory).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type InsertVulnerabilityHistory = z.infer<typeof insertVulnerabilityHistorySchema>;
export type VulnerabilityHistory = typeof vulnerabilityHistory.$inferSelect;

/**
 * Security Metrics
 * Aggregate metrics for dashboards and reporting
 */
export const securityMetrics = pgTable('security_metrics', {
  id: serial('id').primaryKey(),
  metricDate: timestamp('metric_date').notNull(),
  totalScans: integer('total_scans').default(0),
  promptInjectionAttempts: integer('prompt_injection_attempts').default(0),
  piiLeaks: integer('pii_leaks').default(0),
  maliciousCodeDetected: integer('malicious_code_detected').default(0),
  jailbreakAttempts: integer('jailbreak_attempts').default(0),
  dataExtractionAttempts: integer('data_extraction_attempts').default(0),
  criticalVulnerabilities: integer('critical_vulnerabilities').default(0),
  highVulnerabilities: integer('high_vulnerabilities').default(0),
  mediumVulnerabilities: integer('medium_vulnerabilities').default(0),
  lowVulnerabilities: integer('low_vulnerabilities').default(0),
  meanTimeToDetect: integer('mean_time_to_detect'), // milliseconds
  meanTimeToResolve: integer('mean_time_to_resolve'), // milliseconds
  complianceScore: integer('compliance_score'), // 0-100
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const insertSecurityMetricsSchema = createInsertSchema(securityMetrics).omit({
  id: true,
  createdAt: true
});

export type InsertSecurityMetrics = z.infer<typeof insertSecurityMetricsSchema>;
export type SecurityMetrics = typeof securityMetrics.$inferSelect;
