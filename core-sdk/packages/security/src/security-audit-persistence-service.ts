/**
 * Security Audit Persistence Service
 * 
 * Production service for persisting security audit data to database
 * Provides full audit trail, compliance reporting, and vulnerability tracking
 */

import { db } from '../db';
import { 
  securityAuditLogs,
  piiDetections,
  complianceReports,
  attackSimulations,
  vulnerabilityHistory,
  securityMetrics,
  type InsertSecurityAuditLog,
  type InsertPiiDetection,
  type InsertComplianceReport,
  type InsertAttackSimulation,
  type InsertVulnerabilityHistory,
  type InsertSecurityMetrics,
  type SecurityAuditLog,
  type ComplianceReport
} from '../db/schema/security-audit-schema';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';
import type { SecurityVulnerability, PIIDetection as PIIDetectionType, AttackResult } from './security-audit-service';

export class SecurityAuditPersistenceService {
  /**
   * Persist security audit log to database
   * FIX: Now uses canonical targetType, null-safe evidence, and persists CVSS data
   */
  async logSecurityAudit(vulnerability: SecurityVulnerability, userId?: string, projectId?: string, agentId?: string): Promise<number> {
    // FIX: Normalize targetType to canonical values
    const targetType = this.normalizeTargetType(vulnerability.location);
    
    // FIX: Null-safe evidence truncation
    const evidence = vulnerability.evidence ? vulnerability.evidence.substring(0, 500) : '';
    
    const auditLog: InsertSecurityAuditLog = {
      scanType: this.extractScanType(vulnerability.type),
      targetType, // FIX: Use canonical targetType
      severity: vulnerability.severity,
      vulnerabilityType: vulnerability.type,
      owaspId: vulnerability.owaspId,
      cweId: vulnerability.cweId,
      title: vulnerability.title,
      description: vulnerability.description,
      location: vulnerability.location,
      evidence, // FIX: Null-safe truncation
      recommendation: vulnerability.recommendation,
      rawData: { 
        vulnerability,
        cvssScore: vulnerability.cvssScore, // FIX: Include CVSS data
        cvssVector: vulnerability.cvssVector
      },
      agentId,
      userId,
      projectId,
      resolved: false
    };

    const [result] = await db.insert(securityAuditLogs).values(auditLog).returning({ id: securityAuditLogs.id });
    console.log(`[Security Audit] Logged vulnerability ${vulnerability.type} with ID ${result.id} (CVSS: ${vulnerability.cvssScore || 'N/A'})`);
    
    return result.id;
  }

  /**
   * FIX: Normalize location string to canonical targetType
   */
  private normalizeTargetType(location: string): string {
    const locationMap: { [key: string]: string } = {
      'user_input': 'prompt',
      'output_text': 'output',
      'api_endpoint': 'code',
      'training_data': 'data',
      'llm_processing': 'model',
      'package.json': 'dependencies',
      'Line': 'code' // For "Line X, Column Y" locations
    };
    
    // Find matching canonical type
    for (const [pattern, canonical] of Object.entries(locationMap)) {
      if (location.includes(pattern)) {
        return canonical;
      }
    }
    
    // Default to 'code' if no match
    return 'code';
  }

  /**
   * Persist multiple PII detections
   * FIX: Now null-safe for context truncation
   */
  async logPiiDetections(auditLogId: number, detections: PIIDetectionType[]): Promise<void> {
    if (detections.length === 0) return;

    const piiRecords: InsertPiiDetection[] = detections.map(detection => ({
      auditLogId,
      piiType: detection.type,
      confidence: Math.round(detection.confidence * 100), // Convert 0-1 to 0-100
      locationStart: detection.location.start,
      locationEnd: detection.location.end,
      redactedValue: detection.redacted,
      context: detection.value ? detection.value.substring(0, 100) : '' // FIX: Null-safe truncation
    }));

    await db.insert(piiDetections).values(piiRecords);
    console.log(`[Security Audit] Logged ${piiRecords.length} PII detections for audit ${auditLogId}`);
  }

  /**
   * Persist compliance report
   */
  async saveComplianceReport(report: ComplianceReport, generatedBy?: string): Promise<number> {
    const reportData: InsertComplianceReport = {
      standard: report.standard,
      reportType: 'full_audit',
      dateRangeStart: report.coveragePeriod.start,
      dateRangeEnd: report.coveragePeriod.end,
      compliant: report.compliant,
      criticalFindings: report.findings.filter(f => f.severity === 'CRITICAL').length,
      highFindings: report.findings.filter(f => f.severity === 'HIGH').length,
      mediumFindings: report.findings.filter(f => f.severity === 'MEDIUM').length,
      lowFindings: report.findings.filter(f => f.severity === 'LOW').length,
      infoFindings: report.findings.filter(f => f.severity === 'INFO').length,
      totalFindings: report.findings.length,
      findings: report.findings,
      recommendations: report.recommendations,
      evidenceSources: {}, // Populated with log IDs
      generatedBy
    };

    const [result] = await db.insert(complianceReports).values(reportData).returning({ id: complianceReports.id });
    console.log(`[Security Audit] Saved ${report.standard} compliance report with ID ${result.id}`);
    
    return result.id;
  }

  /**
   * Persist attack simulation result
   */
  async logAttackSimulation(attack: AttackResult, targetAgent: string): Promise<number> {
    const simulationData: InsertAttackSimulation = {
      attackType: attack.attackType,
      targetAgent,
      payload: attack.payload,
      response: attack.response,
      successful: attack.successful,
      severity: attack.severity,
      blocked: false, // Determined by detection
      mitigation: attack.mitigation,
      techniques: [], // Extracted from attack
      metadata: { attack }
    };

    const [result] = await db.insert(attackSimulations).values(simulationData).returning({ id: attackSimulations.id });
    console.log(`[Security Audit] Logged ${attack.attackType} attack simulation with ID ${result.id}`);
    
    return result.id;
  }

  /**
   * Create or update vulnerability in history tracker
   */
  async trackVulnerability(vulnerabilityId: string, auditLogId: number, priority: string, cvssScore?: number): Promise<void> {
    const historyData: InsertVulnerabilityHistory = {
      vulnerabilityId,
      auditLogId,
      status: 'discovered',
      priority,
      cvssScore,
      affectedSystems: []
    };

    await db.insert(vulnerabilityHistory).values(historyData);
    console.log(`[Security Audit] Tracking vulnerability ${vulnerabilityId} with priority ${priority}`);
  }

  /**
   * Update vulnerability status
   */
  async updateVulnerabilityStatus(vulnerabilityId: string, status: string, assignedTo?: string, notes?: string): Promise<void> {
    await db.update(vulnerabilityHistory)
      .set({ 
        status,
        assignedTo,
        notes,
        updatedAt: new Date()
      })
      .where(eq(vulnerabilityHistory.vulnerabilityId, vulnerabilityId));
    
    console.log(`[Security Audit] Updated vulnerability ${vulnerabilityId} status to ${status}`);
  }

  /**
   * Mark vulnerability as resolved
   */
  async resolveVulnerability(id: number, resolvedBy: string): Promise<void> {
    await db.update(securityAuditLogs)
      .set({
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy,
        updatedAt: new Date()
      })
      .where(eq(securityAuditLogs.id, id));
    
    console.log(`[Security Audit] Resolved vulnerability ${id} by ${resolvedBy}`);
  }

  /**
   * Get audit logs for date range
   * FIX: Simplified query builder to avoid duplicate where clauses
   */
  async getAuditLogs(startDate: Date, endDate: Date, severity?: string): Promise<SecurityAuditLog[]> {
    const conditions = [
      gte(securityAuditLogs.createdAt, startDate),
      lte(securityAuditLogs.createdAt, endDate)
    ];
    
    // FIX: Add severity filter to conditions array
    if (severity) {
      conditions.push(eq(securityAuditLogs.severity, severity));
    }

    const logs = await db.select()
      .from(securityAuditLogs)
      .where(and(...conditions))
      .orderBy(desc(securityAuditLogs.createdAt));
    
    console.log(`[Security Audit] Retrieved ${logs.length} audit logs from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    return logs;
  }

  /**
   * Get compliance reports for standard
   */
  async getComplianceReports(standard: string, limit: number = 10): Promise<ComplianceReport[]> {
    const reports = await db.select()
      .from(complianceReports)
      .where(eq(complianceReports.standard, standard))
      .orderBy(desc(complianceReports.createdAt))
      .limit(limit);
    
    return reports;
  }

  /**
   * Record daily security metrics
   */
  async recordDailyMetrics(date: Date, metrics: Partial<InsertSecurityMetrics>): Promise<void> {
    const metricsData: InsertSecurityMetrics = {
      metricDate: date,
      totalScans: metrics.totalScans || 0,
      promptInjectionAttempts: metrics.promptInjectionAttempts || 0,
      piiLeaks: metrics.piiLeaks || 0,
      maliciousCodeDetected: metrics.maliciousCodeDetected || 0,
      jailbreakAttempts: metrics.jailbreakAttempts || 0,
      dataExtractionAttempts: metrics.dataExtractionAttempts || 0,
      criticalVulnerabilities: metrics.criticalVulnerabilities || 0,
      highVulnerabilities: metrics.highVulnerabilities || 0,
      mediumVulnerabilities: metrics.mediumVulnerabilities || 0,
      lowVulnerabilities: metrics.lowVulnerabilities || 0,
      meanTimeToDetect: metrics.meanTimeToDetect,
      meanTimeToResolve: metrics.meanTimeToResolve,
      complianceScore: metrics.complianceScore,
      metadata: metrics.metadata || {}
    };

    await db.insert(securityMetrics).values(metricsData);
    console.log(`[Security Audit] Recorded security metrics for ${date.toISOString()}`);
  }

  /**
   * Get security dashboard metrics
   */
  async getDashboardMetrics(days: number = 30): Promise<{
    totalVulnerabilities: number;
    criticalCount: number;
    highCount: number;
    resolvedCount: number;
    unresolvedCount: number;
    averageResolutionTime: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await this.getAuditLogs(startDate, new Date());
    
    const criticalCount = logs.filter(l => l.severity === 'CRITICAL').length;
    const highCount = logs.filter(l => l.severity === 'HIGH').length;
    const resolvedCount = logs.filter(l => l.resolved).length;
    const unresolvedCount = logs.length - resolvedCount;

    // Calculate average resolution time
    const resolved = logs.filter(l => l.resolved && l.resolvedAt);
    const avgResolutionTime = resolved.length > 0
      ? resolved.reduce((sum, log) => {
          const createdTime = new Date(log.createdAt).getTime();
          const resolvedTime = log.resolvedAt ? new Date(log.resolvedAt).getTime() : createdTime;
          return sum + (resolvedTime - createdTime);
        }, 0) / resolved.length
      : 0;

    return {
      totalVulnerabilities: logs.length,
      criticalCount,
      highCount,
      resolvedCount,
      unresolvedCount,
      averageResolutionTime: Math.round(avgResolutionTime / 1000 / 60) // Convert to minutes
    };
  }

  /**
   * Helper: Extract scan type from vulnerability type
   */
  private extractScanType(vulnerabilityType: string): string {
    const typeMap: { [key: string]: string } = {
      'LLM01_PROMPT_INJECTION': 'prompt_injection',
      'LLM02_INSECURE_OUTPUT': 'malicious_code',
      'LLM03_DATA_POISONING': 'data_poisoning',
      'LLM04_DOS': 'dos_attack',
      'LLM05_SUPPLY_CHAIN': 'supply_chain',
      'LLM06_PII_DISCLOSURE': 'pii_detection',
      'LLM07_INSECURE_PLUGIN': 'plugin_security',
      'LLM08_EXCESSIVE_AGENCY': 'excessive_agency',
      'LLM09_OVERRELIANCE': 'overreliance',
      'LLM10_MODEL_THEFT': 'model_theft'
    };
    
    return typeMap[vulnerabilityType] || 'unknown';
  }
}

/**
 * Singleton instance
 */
export const securityPersistence = new SecurityAuditPersistenceService();
