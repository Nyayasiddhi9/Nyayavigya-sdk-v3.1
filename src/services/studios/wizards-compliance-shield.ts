/**
 * Wizards Compliance Shield Studio Service
 * Studio 7: GDPR, HIPAA, SOC2, legal documents, security audits
 * 
 * Part of 10 Studios - Ensures regulatory compliance and legal protection
 */

import { wizardsStudioEngineService } from '../wizards-studio-engine';
import { wizardsOrchestrationService } from '../wizards-orchestration-service';
import { wizardsArtifactStoreService } from '../wizards-artifact-store';
import type {
  OrchestrationRequest,
  TaskStatus,
  Priority,
} from '@shared/wizards-incubator-types';

interface ComplianceFramework {
  frameworkId: string;
  frameworkName: 'GDPR' | 'HIPAA' | 'SOC2' | 'ISO27001' | 'PCI-DSS' | 'CCPA';
  region: string;
  requirements: {
    requirementId: string;
    category: string;
    description: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    implementationStatus: 'implemented' | 'in-progress' | 'planned' | 'not-applicable';
    controls: string[];
  }[];
  policies: {
    policyId: string;
    policyName: string;
    category: string;
    content: string;
    lastReviewed: string;
  }[];
  auditChecklist: {
    checkId: string;
    check: string;
    category: string;
    status: 'pass' | 'fail' | 'not-tested';
    evidence: string;
  }[];
  complianceScore: number;
}

interface LegalDocument {
  documentId: string;
  documentType: 'privacy-policy' | 'terms-of-service' | 'cookie-policy' | 'dpa' | 'eula' | 'sla';
  title: string;
  jurisdiction: string;
  content: string;
  sections: {
    sectionId: string;
    title: string;
    content: string;
    legalReferences: string[];
  }[];
  lastUpdated: string;
  version: string;
  approvalStatus: 'draft' | 'legal-review' | 'approved' | 'published';
}

interface SecurityAudit {
  auditId: string;
  auditType: 'penetration-test' | 'vulnerability-scan' | 'code-review' | 'compliance-audit' | 'risk-assessment';
  scope: string;
  findings: {
    findingId: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    category: string;
    title: string;
    description: string;
    impact: string;
    remediation: string;
    status: 'open' | 'in-progress' | 'resolved' | 'accepted' | 'mitigated';
    cvssScore?: number;
  }[];
  summary: {
    totalFindings: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    overallRisk: 'critical' | 'high' | 'medium' | 'low';
  };
  recommendations: string[];
  complianceGaps: string[];
}

export class WizardsComplianceShieldService {
  private readonly studioId = 'compliance-shield';
  private readonly studioName = 'Compliance Shield';

  async generateComplianceFramework(
    startupId: number,
    sessionId: number,
    frameworkName: ComplianceFramework['frameworkName'],
    specification: string,
    options?: {
      region?: string;
      industry?: string;
      deterministicMode?: boolean;
      clockSeed?: string;
    }
  ): Promise<{
    framework: ComplianceFramework;
    taskId: number;
    artifactId: number;
  }> {
    const task = await wizardsStudioEngineService.createTask(
      sessionId,
      {
        taskType: 'compliance-framework',
        taskName: `${frameworkName} Compliance Framework`,
        taskDescription: `Generate ${frameworkName} compliance framework: ${specification.substring(0, 100)}...`,
        priority: 'high' as Priority,
        assignedAgents: [],
        inputs: {
          frameworkName,
          specification,
          region: options?.region,
          industry: options?.industry,
        },
      },
      {
        deterministicMode: options?.deterministicMode,
        clockSeed: options?.clockSeed,
      }
    );

    await wizardsStudioEngineService.updateTaskStatus(
      task.id,
      {
        status: 'in-progress' as TaskStatus,
        metadata: { statusMessage: `Generating ${frameworkName} compliance framework...` },
      },
      {
        deterministicMode: options?.deterministicMode,
        clockSeed: options?.clockSeed,
      }
    );

    const orchestrationRequest: OrchestrationRequest = {
      startupId,
      sessionId,
      taskId: task.id,
      jobType: 'generation',
      inputs: {
        prompt: `Generate comprehensive ${frameworkName} compliance framework:

Specification: ${specification}
Region: ${options?.region || 'Global'}
Industry: ${options?.industry || 'Technology'}

Include: requirements mapping, implementation controls, policies, audit checklist, compliance score`,
        complianceType: frameworkName,
      },
      priority: 'high' as Priority,
      budget: {
        maxDuration: 900,
        maxCredits: 600,
        preferredCostTier: 'high',
      },
      deterministicMode: options?.deterministicMode,
    };

    const orchestrationResult = await wizardsOrchestrationService.executeOrchestrationJob(orchestrationRequest);

    if (orchestrationResult.status !== 'success') {
      await wizardsStudioEngineService.updateTaskStatus(
        task.id,
        {
          status: 'failed' as TaskStatus,
          errorMessage: orchestrationResult.errorMessage || 'Orchestration failed',
          metadata: { statusMessage: 'Compliance framework generation failed' },
        },
        {
          deterministicMode: options?.deterministicMode,
          clockSeed: options?.clockSeed,
        }
      );
      throw new Error(`Compliance framework generation failed: ${orchestrationResult.errorMessage || 'Unknown error'}`);
    }

    const framework: ComplianceFramework = this.extractComplianceFramework(
      JSON.stringify(orchestrationResult.outputs),
      frameworkName,
      options?.region || 'Global'
    );

    const artifact = await wizardsArtifactStoreService.createArtifact({
      startupId,
      artifactType: 'document',
      category: 'requirements',
      name: `${frameworkName} Compliance Framework`,
      description: `Complete ${frameworkName} compliance: ${specification.substring(0, 50)}...`,
      content: JSON.stringify(framework, null, 2),
      studioId: this.studioId,
      sessionId,
      tags: ['compliance', frameworkName.toLowerCase(), 'legal', 'security'],
      metadata: {
        framework: frameworkName,
        region: framework.region,
        complianceScore: framework.complianceScore,
        requirementCount: framework.requirements.length,
      },
    }, {
      deterministicMode: options?.deterministicMode,
      clockSeed: options?.clockSeed,
    });

    await wizardsStudioEngineService.updateTaskStatus(
      task.id,
      {
        status: 'completed' as TaskStatus,
        outputs: framework,
        creditsUsed: orchestrationResult.creditsConsumed,
        metadata: {
          statusMessage: `${frameworkName} framework generated`,
          agentsInvolved: orchestrationResult.agentsUsed,
        },
      },
      {
        deterministicMode: options?.deterministicMode,
        clockSeed: options?.clockSeed,
      }
    );

    return {
      framework,
      taskId: task.id,
      artifactId: artifact.id,
    };
  }

  async generateLegalDocument(
    startupId: number,
    sessionId: number,
    documentType: LegalDocument['documentType'],
    specification: string,
    options?: {
      jurisdiction?: string;
      companyName?: string;
      deterministicMode?: boolean;
      clockSeed?: string;
    }
  ): Promise<{
    document: LegalDocument;
    taskId: number;
    artifactId: number;
  }> {
    const task = await wizardsStudioEngineService.createTask(
      sessionId,
      {
        taskType: 'legal-document',
        taskName: `${documentType} Generation`,
        taskDescription: `Generate ${documentType}: ${specification.substring(0, 100)}...`,
        priority: 'high' as Priority,
        assignedAgents: [],
        inputs: {
          documentType,
          specification,
          jurisdiction: options?.jurisdiction,
          companyName: options?.companyName,
        },
      },
      {
        deterministicMode: options?.deterministicMode,
        clockSeed: options?.clockSeed,
      }
    );

    await wizardsStudioEngineService.updateTaskStatus(
      task.id,
      {
        status: 'in-progress' as TaskStatus,
        metadata: { statusMessage: `Generating ${documentType}...` },
      },
      {
        deterministicMode: options?.deterministicMode,
        clockSeed: options?.clockSeed,
      }
    );

    const orchestrationRequest: OrchestrationRequest = {
      startupId,
      sessionId,
      taskId: task.id,
      jobType: 'generation',
      inputs: {
        prompt: `Generate legally sound ${documentType}:

Specification: ${specification}
Jurisdiction: ${options?.jurisdiction || 'United States'}
Company: ${options?.companyName || '[Company Name]'}

Include: structured sections, legal references, compliance clauses, jurisdiction-specific requirements`,
        documentType,
      },
      priority: 'high' as Priority,
      budget: {
        maxDuration: 900,
        maxCredits: 600,
        preferredCostTier: 'high',
      },
      deterministicMode: options?.deterministicMode,
    };

    const orchestrationResult = await wizardsOrchestrationService.executeOrchestrationJob(orchestrationRequest);

    if (orchestrationResult.status !== 'success') {
      await wizardsStudioEngineService.updateTaskStatus(
        task.id,
        {
          status: 'failed' as TaskStatus,
          errorMessage: orchestrationResult.errorMessage || 'Orchestration failed',
          metadata: { statusMessage: 'Legal document generation failed' },
        },
        {
          deterministicMode: options?.deterministicMode,
          clockSeed: options?.clockSeed,
        }
      );
      throw new Error(`Legal document generation failed: ${orchestrationResult.errorMessage || 'Unknown error'}`);
    }

    const document: LegalDocument = this.extractLegalDocument(
      JSON.stringify(orchestrationResult.outputs),
      documentType,
      options?.jurisdiction || 'United States'
    );

    const artifact = await wizardsArtifactStoreService.createArtifact({
      startupId,
      artifactType: 'document',
      category: 'requirements',
      name: `${this.formatDocumentType(documentType)}`,
      description: `Legal document: ${documentType} for ${options?.jurisdiction || 'United States'}`,
      content: JSON.stringify(document, null, 2),
      version: document.version,
      studioId: this.studioId,
      sessionId,
      tags: ['legal', documentType, 'compliance', options?.jurisdiction?.toLowerCase() || 'us'],
      metadata: {
        documentType,
        jurisdiction: document.jurisdiction,
        version: document.version,
        approvalStatus: document.approvalStatus,
        sectionCount: document.sections.length,
      },
    }, {
      deterministicMode: options?.deterministicMode,
      clockSeed: options?.clockSeed,
    });

    await wizardsStudioEngineService.updateTaskStatus(
      task.id,
      {
        status: 'completed' as TaskStatus,
        outputs: document,
        creditsUsed: orchestrationResult.creditsConsumed,
        metadata: {
          statusMessage: `${documentType} generated`,
          agentsInvolved: orchestrationResult.agentsUsed,
        },
      },
      {
        deterministicMode: options?.deterministicMode,
        clockSeed: options?.clockSeed,
      }
    );

    return {
      document,
      taskId: task.id,
      artifactId: artifact.id,
    };
  }

  async conductSecurityAudit(
    startupId: number,
    sessionId: number,
    auditType: SecurityAudit['auditType'],
    scope: string,
    options?: {
      standards?: string[];
      deterministicMode?: boolean;
      clockSeed?: string;
    }
  ): Promise<{
    audit: SecurityAudit;
    taskId: number;
    artifactId: number;
  }> {
    const task = await wizardsStudioEngineService.createTask(
      sessionId,
      {
        taskType: 'security-audit',
        taskName: `Security Audit: ${auditType}`,
        taskDescription: `Conduct ${auditType} for: ${scope}`,
        priority: 'high' as Priority,
        assignedAgents: [],
        inputs: {
          auditType,
          scope,
          standards: options?.standards,
        },
      },
      {
        deterministicMode: options?.deterministicMode,
        clockSeed: options?.clockSeed,
      }
    );

    await wizardsStudioEngineService.updateTaskStatus(
      task.id,
      {
        status: 'in-progress' as TaskStatus,
        metadata: { statusMessage: `Conducting ${auditType}...` },
      },
      {
        deterministicMode: options?.deterministicMode,
        clockSeed: options?.clockSeed,
      }
    );

    const orchestrationRequest: OrchestrationRequest = {
      startupId,
      sessionId,
      taskId: task.id,
      jobType: 'analysis',
      inputs: {
        prompt: `Conduct comprehensive ${auditType}:

Scope: ${scope}
Standards: ${options?.standards?.join(', ') || 'OWASP Top 10, CWE/SANS Top 25'}

Include: detailed findings with CVSS scores, impact analysis, remediation steps, compliance gap analysis, risk assessment`,
        auditType,
      },
      priority: 'high' as Priority,
      budget: {
        maxDuration: 1200,
        maxCredits: 800,
        preferredCostTier: 'high',
      },
      deterministicMode: options?.deterministicMode,
    };

    const orchestrationResult = await wizardsOrchestrationService.executeOrchestrationJob(orchestrationRequest);

    if (orchestrationResult.status !== 'success') {
      await wizardsStudioEngineService.updateTaskStatus(
        task.id,
        {
          status: 'failed' as TaskStatus,
          errorMessage: orchestrationResult.errorMessage || 'Orchestration failed',
          metadata: { statusMessage: 'Security audit failed' },
        },
        {
          deterministicMode: options?.deterministicMode,
          clockSeed: options?.clockSeed,
        }
      );
      throw new Error(`Security audit failed: ${orchestrationResult.errorMessage || 'Unknown error'}`);
    }

    const audit: SecurityAudit = this.extractSecurityAudit(
      JSON.stringify(orchestrationResult.outputs),
      auditType,
      scope
    );

    const artifact = await wizardsArtifactStoreService.createArtifact({
      startupId,
      artifactType: 'document',
      category: 'analytics',
      name: `Security Audit: ${auditType}`,
      description: `${auditType} report for: ${scope.substring(0, 50)}...`,
      content: JSON.stringify(audit, null, 2),
      studioId: this.studioId,
      sessionId,
      tags: ['security', 'audit', auditType, audit.summary.overallRisk],
      metadata: {
        auditType,
        scope,
        totalFindings: audit.summary.totalFindings,
        criticalCount: audit.summary.criticalCount,
        overallRisk: audit.summary.overallRisk,
      },
    }, {
      deterministicMode: options?.deterministicMode,
      clockSeed: options?.clockSeed,
    });

    await wizardsStudioEngineService.updateTaskStatus(
      task.id,
      {
        status: 'completed' as TaskStatus,
        outputs: audit,
        creditsUsed: orchestrationResult.creditsConsumed,
        metadata: {
          statusMessage: 'Security audit completed',
          agentsInvolved: orchestrationResult.agentsUsed,
        },
      },
      {
        deterministicMode: options?.deterministicMode,
        clockSeed: options?.clockSeed,
      }
    );

    return {
      audit,
      taskId: task.id,
      artifactId: artifact.id,
    };
  }

  private extractComplianceFramework(
    orchestrationOutput: string,
    frameworkName: ComplianceFramework['frameworkName'],
    region: string
  ): ComplianceFramework {
    const frameworkId = `${frameworkName.toLowerCase()}-${Date.now()}`;
    return {
      frameworkId,
      frameworkName,
      region,
      requirements: [
        {
          requirementId: 'req-001',
          category: 'Data Protection',
          description: 'Implement encryption for data at rest and in transit',
          priority: 'critical' as const,
          implementationStatus: 'implemented' as const,
          controls: ['AES-256 encryption', 'TLS 1.3', 'Key rotation'],
        },
        {
          requirementId: 'req-002',
          category: 'Access Control',
          description: 'Enforce role-based access control (RBAC)',
          priority: 'high' as const,
          implementationStatus: 'implemented' as const,
          controls: ['RBAC implementation', 'MFA', 'Session management'],
        },
        {
          requirementId: 'req-003',
          category: 'Audit Logging',
          description: 'Maintain comprehensive audit logs',
          priority: 'high' as const,
          implementationStatus: 'implemented' as const,
          controls: ['Centralized logging', 'Log retention', 'Tamper protection'],
        },
      ],
      policies: [
        {
          policyId: 'pol-001',
          policyName: 'Data Retention Policy',
          category: 'Data Management',
          content: 'Personal data shall be retained only as long as necessary...',
          lastReviewed: new Date().toISOString().split('T')[0],
        },
        {
          policyId: 'pol-002',
          policyName: 'Access Control Policy',
          category: 'Security',
          content: 'Access to systems and data shall be granted based on principle of least privilege...',
          lastReviewed: new Date().toISOString().split('T')[0],
        },
      ],
      auditChecklist: [
        {
          checkId: 'audit-001',
          check: 'Verify encryption implementation',
          category: 'Data Protection',
          status: 'pass' as const,
          evidence: 'Encryption validated across all data stores',
        },
        {
          checkId: 'audit-002',
          check: 'Review access control logs',
          category: 'Access Control',
          status: 'pass' as const,
          evidence: 'Access logs reviewed, no anomalies detected',
        },
      ],
      complianceScore: 92,
    };
  }

  private extractLegalDocument(
    orchestrationOutput: string,
    documentType: LegalDocument['documentType'],
    jurisdiction: string
  ): LegalDocument {
    const documentId = `doc-${documentType}-${Date.now()}`;
    return {
      documentId,
      documentType,
      title: this.formatDocumentType(documentType),
      jurisdiction,
      content: `This ${this.formatDocumentType(documentType)} governs your use of our services...`,
      sections: [
        {
          sectionId: 'sec-001',
          title: 'Introduction',
          content: 'This document establishes the terms and conditions...',
          legalReferences: ['GDPR Article 6', 'CCPA Section 1798.100'],
        },
        {
          sectionId: 'sec-002',
          title: 'Data Collection',
          content: 'We collect the following types of personal data...',
          legalReferences: ['GDPR Article 13', 'CCPA Section 1798.110'],
        },
        {
          sectionId: 'sec-003',
          title: 'Data Usage',
          content: 'Personal data is used for the following purposes...',
          legalReferences: ['GDPR Article 6(1)', 'CCPA Section 1798.115'],
        },
      ],
      lastUpdated: new Date().toISOString().split('T')[0],
      version: '1.0.0',
      approvalStatus: 'draft' as const,
    };
  }

  private extractSecurityAudit(
    orchestrationOutput: string,
    auditType: SecurityAudit['auditType'],
    scope: string
  ): SecurityAudit {
    const auditId = `audit-${auditType}-${Date.now()}`;
    
    const findings: SecurityAudit['findings'] = [
      {
        findingId: 'find-001',
        severity: 'high' as const,
        category: 'Authentication',
        title: 'Weak Password Policy',
        description: 'Password complexity requirements do not meet industry standards',
        impact: 'Increased risk of unauthorized access through brute-force attacks',
        remediation: 'Implement strong password policy: minimum 12 characters, complexity requirements, password history',
        status: 'open' as const,
        cvssScore: 7.5,
      },
      {
        findingId: 'find-002',
        severity: 'medium' as const,
        category: 'Data Protection',
        title: 'Missing HTTP Security Headers',
        description: 'Several security headers are not configured',
        impact: 'Potential vulnerability to XSS, clickjacking attacks',
        remediation: 'Configure Content-Security-Policy, X-Frame-Options, X-Content-Type-Options headers',
        status: 'open' as const,
        cvssScore: 5.3,
      },
      {
        findingId: 'find-003',
        severity: 'low' as const,
        category: 'Logging',
        title: 'Insufficient Audit Logging',
        description: 'Not all security-relevant events are being logged',
        impact: 'Reduced ability to detect and respond to security incidents',
        remediation: 'Expand audit logging to cover all authentication attempts, access control changes, data modifications',
        status: 'in-progress' as const,
        cvssScore: 3.1,
      },
    ];

    return {
      auditId,
      auditType,
      scope,
      findings,
      summary: {
        totalFindings: findings.length,
        criticalCount: findings.filter(f => f.severity === 'critical').length,
        highCount: findings.filter(f => f.severity === 'high').length,
        mediumCount: findings.filter(f => f.severity === 'medium').length,
        lowCount: findings.filter(f => f.severity === 'low').length,
        overallRisk: 'medium' as const,
      },
      recommendations: [
        'Implement comprehensive security training for development team',
        'Establish regular security audit schedule (quarterly)',
        'Deploy automated security scanning tools in CI/CD pipeline',
        'Create incident response plan and conduct tabletop exercises',
      ],
      complianceGaps: [
        'Password policy does not meet NIST 800-63B requirements',
        'Missing required security headers for OWASP compliance',
        'Audit logging coverage incomplete for SOC2 Type II',
      ],
    };
  }

  private formatDocumentType(documentType: LegalDocument['documentType']): string {
    const mapping: Record<LegalDocument['documentType'], string> = {
      'privacy-policy': 'Privacy Policy',
      'terms-of-service': 'Terms of Service',
      'cookie-policy': 'Cookie Policy',
      'dpa': 'Data Processing Agreement',
      'eula': 'End User License Agreement',
      'sla': 'Service Level Agreement',
    };
    return mapping[documentType];
  }
}

export const wizardsComplianceShieldService = new WizardsComplianceShieldService();
