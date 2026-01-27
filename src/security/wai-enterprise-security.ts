/**
 * WAI Enterprise Security System v8.0
 * KMS, secrets management, audit logs, and enterprise-grade security
 */

import { EventEmitter } from 'events';
import { randomUUID as uuidv4 } from 'crypto';
import crypto from 'crypto';

// ================================================================================================
// ENTERPRISE SECURITY SYSTEM V8.0
// ================================================================================================

export interface SecretConfig {
  id: string;
  name: string;
  type: 'api_key' | 'password' | 'certificate' | 'token' | 'encryption_key' | 'database_url';
  value: string;
  description?: string;
  platform: string;
  environment: 'development' | 'staging' | 'production' | 'all';
  rotation: {
    enabled: boolean;
    intervalDays: number;
    lastRotated?: Date;
    nextRotation?: Date;
  };
  access: {
    allowedUsers: string[];
    allowedRoles: string[];
    allowedPlatforms: string[];
    ipWhitelist?: string[];
  };
  encryption: {
    algorithm: string;
    keyId: string;
    encrypted: boolean;
  };
  metadata: {
    createdBy: string;
    createdAt: Date;
    lastAccessed?: Date;
    accessCount: number;
    tags: string[];
  };
  isActive: boolean;
}

export interface EncryptionKey {
  id: string;
  name: string;
  algorithm: 'AES-256-GCM' | 'RSA-2048' | 'RSA-4096' | 'ECDSA-P256' | 'ECDSA-P384';
  purpose: 'encryption' | 'signing' | 'authentication' | 'key_exchange';
  keyMaterial: string; // Base64 encoded
  publicKey?: string; // For asymmetric keys
  metadata: {
    createdAt: Date;
    expiresAt?: Date;
    usage: 'encrypt' | 'decrypt' | 'sign' | 'verify' | 'all';
    rotationSchedule: number; // Days
  };
  compliance: {
    fipsCompliant: boolean;
    hsm: boolean;
    escrowRequired: boolean;
  };
  isActive: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  eventType: 'authentication' | 'authorization' | 'data_access' | 'configuration' | 'security' | 'system';
  action: string;
  resource: string;
  actor: {
    userId?: string;
    userEmail?: string;
    userRole?: string;
    apiKey?: string;
    ipAddress: string;
    userAgent?: string;
    platform?: string;
  };
  target: {
    resourceType: string;
    resourceId: string;
    resourceName?: string;
    sensitive: boolean;
  };
  outcome: 'success' | 'failure' | 'partial';
  details: {
    reason?: string;
    errorCode?: string;
    additionalData?: any;
    riskScore?: number;
  };
  compliance: {
    retention: number; // Days
    classification: 'public' | 'internal' | 'confidential' | 'restricted';
    tags: string[];
  };
}

export interface CompliancePolicy {
  id: string;
  name: string;
  type: 'SOC2' | 'HIPAA' | 'GDPR' | 'ISO27001' | 'PCI_DSS' | 'CCPA' | 'custom';
  requirements: {
    dataRetention: number; // Days
    encryptionRequired: boolean;
    auditRequired: boolean;
    accessControls: string[];
    dataResidency: string[];
    backupRequirements: any;
  };
  controls: {
    passwordPolicy: any;
    sessionManagement: any;
    dataClassification: any;
    incidentResponse: any;
  };
  monitoring: {
    continuousMonitoring: boolean;
    alertThresholds: any;
    reportingSchedule: string;
  };
  isActive: boolean;
  lastReview: Date;
  nextReview: Date;
}

export interface SecurityIncident {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'unauthorized_access' | 'data_breach' | 'malware' | 'dos_attack' | 'credential_compromise' | 'other';
  status: 'detected' | 'investigating' | 'contained' | 'resolved' | 'closed';
  timeline: {
    detectedAt: Date;
    reportedAt?: Date;
    containedAt?: Date;
    resolvedAt?: Date;
  };
  affected: {
    users: number;
    systems: string[];
    dataTypes: string[];
    platforms: string[];
  };
  response: {
    assignedTo: string;
    actions: string[];
    communications: string[];
    lessonsLearned?: string[];
  };
  compliance: {
    notificationRequired: boolean;
    regulators: string[];
    deadlines: Date[];
  };
}

export class WAIEnterpriseSecuritySystem extends EventEmitter {
  public readonly version = '8.0.0';
  
  private secrets: Map<string, SecretConfig> = new Map();
  private encryptionKeys: Map<string, EncryptionKey> = new Map();
  private auditLogs: AuditLog[] = [];
  private compliancePolicies: Map<string, CompliancePolicy> = new Map();
  private securityIncidents: Map<string, SecurityIncident> = new Map();
  private masterKey: string;
  private rotationInterval: NodeJS.Timeout | null = null;
  private auditInterval: NodeJS.Timeout | null = null;
  private isProcessingSecurityEvent: boolean = false;

  constructor() {
    super();
    this.masterKey = this.generateMasterKey();
    this.initializeSecuritySystem();
  }

  private async initializeSecuritySystem(): Promise<void> {
    console.log('🔒 Initializing WAI Enterprise Security System v8.0...');
    
    await this.setupEncryptionKeys();
    await this.setupCompliancePolicies();
    await this.startSecretRotation();
    await this.startAuditLogging();
    
    console.log('✅ Enterprise security system initialized with comprehensive protection');
  }

  // ================================================================================================
  // KEY MANAGEMENT SYSTEM (KMS)
  // ================================================================================================

  private async setupEncryptionKeys(): Promise<void> {
    console.log('🔑 Setting up encryption keys...');
    
    const defaultKeys: Omit<EncryptionKey, 'id' | 'keyMaterial' | 'publicKey'>[] = [
      {
        name: 'WAI Master Encryption Key',
        algorithm: 'AES-256-GCM',
        purpose: 'encryption',
        metadata: {
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          usage: 'encrypt',
          rotationSchedule: 90
        },
        compliance: {
          fipsCompliant: true,
          hsm: true,
          escrowRequired: true
        },
        isActive: true
      },

      {
        name: 'API Signing Key',
        algorithm: 'RSA-2048',
        purpose: 'signing',
        metadata: {
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000), // 2 years
          usage: 'sign',
          rotationSchedule: 365
        },
        compliance: {
          fipsCompliant: true,
          hsm: false,
          escrowRequired: false
        },
        isActive: true
      },

      {
        name: 'Data Encryption Key',
        algorithm: 'AES-256-GCM',
        purpose: 'encryption',
        metadata: {
          createdAt: new Date(),
          usage: 'all',
          rotationSchedule: 30
        },
        compliance: {
          fipsCompliant: true,
          hsm: true,
          escrowRequired: true
        },
        isActive: true
      },

      {
        name: 'Authentication Key',
        algorithm: 'ECDSA-P256',
        purpose: 'authentication',
        metadata: {
          createdAt: new Date(),
          usage: 'verify',
          rotationSchedule: 180
        },
        compliance: {
          fipsCompliant: true,
          hsm: false,
          escrowRequired: false
        },
        isActive: true
      }
    ];

    for (const keyConfig of defaultKeys) {
      const key = await this.generateEncryptionKey(keyConfig);
      console.log(`🔑 Generated key: ${key.name} (${key.algorithm})`);
    }

    console.log(`✅ Configured ${defaultKeys.length} encryption keys`);
  }

  private async generateEncryptionKey(config: Omit<EncryptionKey, 'id' | 'keyMaterial' | 'publicKey'>): Promise<EncryptionKey> {
    const keyId = uuidv4();
    let keyMaterial: string;
    let publicKey: string | undefined;

    switch (config.algorithm) {
      case 'AES-256-GCM':
        keyMaterial = crypto.randomBytes(32).toString('base64');
        break;

      case 'RSA-2048':
      case 'RSA-4096':
        const keySize = config.algorithm === 'RSA-2048' ? 2048 : 4096;
        const keyPair = crypto.generateKeyPairSync('rsa', {
          modulusLength: keySize,
          publicKeyEncoding: { type: 'spki', format: 'pem' },
          privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });
        keyMaterial = Buffer.from(keyPair.privateKey).toString('base64');
        publicKey = Buffer.from(keyPair.publicKey).toString('base64');
        break;

      case 'ECDSA-P256':
      case 'ECDSA-P384':
        const curve = config.algorithm === 'ECDSA-P256' ? 'prime256v1' : 'secp384r1';
        const ecKeyPair = crypto.generateKeyPairSync('ec', {
          namedCurve: curve,
          publicKeyEncoding: { type: 'spki', format: 'pem' },
          privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });
        keyMaterial = Buffer.from(ecKeyPair.privateKey).toString('base64');
        publicKey = Buffer.from(ecKeyPair.publicKey).toString('base64');
        break;

      default:
        throw new Error(`Unsupported algorithm: ${config.algorithm}`);
    }

    const key: EncryptionKey = {
      id: keyId,
      keyMaterial,
      publicKey,
      ...config
    };

    this.encryptionKeys.set(keyId, key);
    this.logAuditEvent('security', 'key_generated', 'encryption_key', {
      resourceId: keyId,
      resourceName: key.name
    });

    return key;
  }

  public async encryptData(data: string, keyId?: string): Promise<{ encrypted: string; keyId: string; iv: string }> {
    const key = keyId ? this.encryptionKeys.get(keyId) : Array.from(this.encryptionKeys.values())[0];
    
    if (!key || key.algorithm !== 'AES-256-GCM') {
      throw new Error('Suitable encryption key not found');
    }

    const keyBuffer = Buffer.from(key.keyMaterial, 'base64');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-gcm', keyBuffer);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted,
      keyId: key.id,
      iv: iv.toString('hex')
    };
  }

  public async decryptData(encryptedData: string, keyId: string, iv: string): Promise<string> {
    const key = this.encryptionKeys.get(keyId);
    
    if (!key || key.algorithm !== 'AES-256-GCM') {
      throw new Error('Encryption key not found');
    }

    const keyBuffer = Buffer.from(key.keyMaterial, 'base64');
    const ivBuffer = Buffer.from(iv, 'hex');
    const decipher = crypto.createDecipher('aes-256-gcm', keyBuffer);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // ================================================================================================
  // SECRETS MANAGEMENT
  // ================================================================================================

  public async storeSecret(config: Omit<SecretConfig, 'id' | 'metadata' | 'encryption'>): Promise<SecretConfig> {
    const secretId = uuidv4();
    
    // Encrypt the secret value
    const encryptionResult = await this.encryptData(config.value);
    
    const secret: SecretConfig = {
      id: secretId,
      ...config,
      value: encryptionResult.encrypted,
      encryption: {
        algorithm: 'AES-256-GCM',
        keyId: encryptionResult.keyId,
        encrypted: true
      },
      metadata: {
        createdBy: 'system', // In production, get from authenticated user
        createdAt: new Date(),
        accessCount: 0,
        tags: config.type === 'api_key' ? ['api', 'authentication'] : ['general']
      }
    };

    // Set rotation schedule if enabled
    if (secret.rotation.enabled) {
      secret.rotation.nextRotation = new Date(Date.now() + secret.rotation.intervalDays * 24 * 60 * 60 * 1000);
    }

    this.secrets.set(secretId, secret);
    
    this.logAuditEvent('security', 'secret_stored', 'secret', {
      resourceId: secretId,
      resourceName: secret.name
    });

    this.emit('secret.stored', { secretId, name: secret.name });

    return secret;
  }

  public async retrieveSecret(secretId: string, userId: string, platform: string): Promise<string> {
    const secret = this.secrets.get(secretId);
    
    if (!secret || !secret.isActive) {
      throw new Error('Secret not found or inactive');
    }

    // Check access permissions
    if (!this.checkSecretAccess(secret, userId, platform)) {
      this.logAuditEvent('security', 'secret_access_denied', 'secret', {
        resourceId: secretId,
        resourceName: secret.name
      }, 'failure');
      
      throw new Error('Access denied to secret');
    }

    // Decrypt the secret
    const decryptedValue = await this.decryptData(
      secret.value, 
      secret.encryption.keyId, 
      '' // IV would be stored separately in production
    );

    // Update access metadata
    secret.metadata.lastAccessed = new Date();
    secret.metadata.accessCount++;

    this.logAuditEvent('security', 'secret_accessed', 'secret', {
      resourceId: secretId,
      resourceName: secret.name
    });

    return decryptedValue;
  }

  private checkSecretAccess(secret: SecretConfig, userId: string, platform: string): boolean {
    // Check platform access
    if (secret.access.allowedPlatforms.length > 0 && 
        !secret.access.allowedPlatforms.includes(platform) && 
        !secret.access.allowedPlatforms.includes('*')) {
      return false;
    }

    // Check user access
    if (secret.access.allowedUsers.length > 0 && 
        !secret.access.allowedUsers.includes(userId) &&
        !secret.access.allowedUsers.includes('*')) {
      return false;
    }

    return true;
  }

  public async rotateSecret(secretId: string): Promise<SecretConfig> {
    const secret = this.secrets.get(secretId);
    
    if (!secret) {
      throw new Error('Secret not found');
    }

    // Generate new secret value based on type
    let newValue: string;
    
    switch (secret.type) {
      case 'api_key':
        newValue = `wai_${uuidv4().replace(/-/g, '')}`;
        break;
      case 'password':
        newValue = this.generateSecurePassword();
        break;
      case 'token':
        newValue = crypto.randomBytes(32).toString('hex');
        break;
      case 'encryption_key':
        newValue = crypto.randomBytes(32).toString('base64');
        break;
      default:
        newValue = crypto.randomBytes(16).toString('hex');
    }

    // Encrypt new value
    const encryptionResult = await this.encryptData(newValue);
    
    // Update secret
    secret.value = encryptionResult.encrypted;
    secret.encryption.keyId = encryptionResult.keyId;
    secret.rotation.lastRotated = new Date();
    secret.rotation.nextRotation = new Date(Date.now() + secret.rotation.intervalDays * 24 * 60 * 60 * 1000);

    this.logAuditEvent('security', 'secret_rotated', 'secret', {
      resourceId: secretId,
      resourceName: secret.name
    });

    this.emit('secret.rotated', { secretId, name: secret.name });

    return secret;
  }

  private generateSecurePassword(length: number = 32): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password;
  }

  // ================================================================================================
  // AUDIT LOGGING
  // ================================================================================================

  private async startAuditLogging(): Promise<void> {
    console.log('📝 Starting audit logging system...');
    
    // Start audit log cleanup interval
    this.auditInterval = setInterval(() => {
      this.cleanupAuditLogs();
    }, 24 * 60 * 60 * 1000); // Daily cleanup
  }

  public logAuditEvent(
    eventType: string, 
    action: string, 
    resourceType: string, 
    target: { resourceId: string; resourceName?: string; sensitive?: boolean },
    outcome: 'success' | 'failure' | 'partial' = 'success',
    actor?: any,
    details?: any
  ): void {
    
    const auditLog: AuditLog = {
      id: uuidv4(),
      timestamp: new Date(),
      eventType: eventType as any,
      action,
      resource: resourceType,
      actor: {
        userId: actor?.userId,
        userEmail: actor?.userEmail,
        userRole: actor?.userRole,
        apiKey: actor?.apiKey,
        ipAddress: actor?.ipAddress || '127.0.0.1',
        userAgent: actor?.userAgent,
        platform: actor?.platform
      },
      target: {
        resourceType,
        resourceId: target.resourceId,
        resourceName: target.resourceName,
        sensitive: target.sensitive || false
      },
      outcome,
      details: {
        reason: details?.reason,
        errorCode: details?.errorCode,
        additionalData: details?.additionalData,
        riskScore: this.calculateRiskScore(eventType, action, outcome)
      },
      compliance: {
        retention: 2555, // 7 years for compliance
        classification: target.sensitive ? 'confidential' : 'internal',
        tags: [eventType, action, resourceType]
      }
    };

    this.auditLogs.push(auditLog);

    // Emit audit event for real-time monitoring
    this.emit('audit.logged', auditLog);

    // Check for suspicious activity
    this.checkForSuspiciousActivity(auditLog);
  }

  private calculateRiskScore(eventType: string, action: string, outcome: string): number {
    let score = 0;

    // Base score by event type
    switch (eventType) {
      case 'authentication':
        score += outcome === 'failure' ? 5 : 1;
        break;
      case 'authorization':
        score += outcome === 'failure' ? 7 : 1;
        break;
      case 'data_access':
        score += 3;
        break;
      case 'security':
        score += 8;
        break;
      case 'system':
        score += 2;
        break;
      default:
        score += 1;
    }

    // Adjust for specific actions
    if (action.includes('failed') || action.includes('denied')) {
      score += 3;
    }
    
    if (action.includes('admin') || action.includes('delete')) {
      score += 5;
    }

    return Math.min(score, 10); // Max score of 10
  }

  private checkForSuspiciousActivity(auditLog: AuditLog): void {
    // Check for multiple failed attempts
    const recentFailures = this.auditLogs
      .filter(log => 
        log.timestamp > new Date(Date.now() - 15 * 60 * 1000) && // Last 15 minutes
        log.actor.ipAddress === auditLog.actor.ipAddress &&
        log.outcome === 'failure'
      ).length;

    if (recentFailures >= 5) {
      this.createSecurityIncident('unauthorized_access', 'medium', {
        reason: `Multiple failed attempts from IP: ${auditLog.actor.ipAddress}`,
        ipAddress: auditLog.actor.ipAddress,
        attempts: recentFailures
      });
    }

    // Check for high-risk activities
    if (auditLog.details.riskScore && auditLog.details.riskScore >= 8) {
      this.createSecurityIncident('other', 'high', {
        reason: `High-risk activity detected: ${auditLog.action}`,
        auditLogId: auditLog.id,
        riskScore: auditLog.details.riskScore
      });
    }
  }

  private cleanupAuditLogs(): void {
    const retentionDate = new Date(Date.now() - 2555 * 24 * 60 * 60 * 1000); // 7 years
    
    const initialCount = this.auditLogs.length;
    this.auditLogs = this.auditLogs.filter(log => log.timestamp > retentionDate);
    
    const cleanedCount = initialCount - this.auditLogs.length;
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired audit logs`);
    }
  }

  // ================================================================================================
  // COMPLIANCE MANAGEMENT
  // ================================================================================================

  private async setupCompliancePolicies(): Promise<void> {
    console.log('📋 Setting up compliance policies...');
    
    const policies: CompliancePolicy[] = [
      {
        id: uuidv4(),
        name: 'SOC 2 Type II Compliance',
        type: 'SOC2',
        requirements: {
          dataRetention: 2555, // 7 years
          encryptionRequired: true,
          auditRequired: true,
          accessControls: ['rbac', 'mfa', 'least_privilege'],
          dataResidency: ['US'],
          backupRequirements: {
            frequency: 'daily',
            retention: 90,
            encryption: true,
            offsite: true
          }
        },
        controls: {
          passwordPolicy: {
            minLength: 12,
            complexity: true,
            rotation: 90,
            history: 12
          },
          sessionManagement: {
            timeout: 30,
            concurrentSessions: 3,
            reAuthentication: true
          },
          dataClassification: {
            levels: ['public', 'internal', 'confidential', 'restricted'],
            labeling: true,
            handling: true
          },
          incidentResponse: {
            responseTime: 24,
            escalation: true,
            documentation: true
          }
        },
        monitoring: {
          continuousMonitoring: true,
          alertThresholds: {
            failedLogins: 5,
            dataAccess: 100,
            privilegedAccess: 1
          },
          reportingSchedule: 'quarterly'
        },
        isActive: true,
        lastReview: new Date(),
        nextReview: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // Annual review
      },

      {
        id: uuidv4(),
        name: 'GDPR Compliance',
        type: 'GDPR',
        requirements: {
          dataRetention: 2555,
          encryptionRequired: true,
          auditRequired: true,
          accessControls: ['consent', 'purpose_limitation', 'data_minimization'],
          dataResidency: ['EU'],
          backupRequirements: {
            frequency: 'daily',
            retention: 30,
            encryption: true,
            offsite: true
          }
        },
        controls: {
          passwordPolicy: {
            minLength: 10,
            complexity: true,
            rotation: 180,
            history: 6
          },
          sessionManagement: {
            timeout: 20,
            concurrentSessions: 2,
            reAuthentication: true
          },
          dataClassification: {
            levels: ['public', 'personal', 'sensitive', 'special_category'],
            labeling: true,
            handling: true
          },
          incidentResponse: {
            responseTime: 72, // GDPR requirement
            escalation: true,
            documentation: true
          }
        },
        monitoring: {
          continuousMonitoring: true,
          alertThresholds: {
            dataAccess: 50,
            dataTransfer: 10,
            retentionViolation: 1
          },
          reportingSchedule: 'monthly'
        },
        isActive: true,
        lastReview: new Date(),
        nextReview: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      }
    ];

    policies.forEach(policy => {
      this.compliancePolicies.set(policy.id, policy);
    });

    console.log(`✅ Configured ${policies.length} compliance policies`);
  }

  // ================================================================================================
  // INCIDENT MANAGEMENT
  // ================================================================================================

  public createSecurityIncident(
    type: string, 
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: any
  ): SecurityIncident {
    // Prevent infinite recursion
    if (this.isProcessingSecurityEvent) {
      const incidentId = uuidv4();
      const incident: SecurityIncident = {
        id: incidentId,
        severity,
        type: type as any,
        status: 'detected',
        timeline: {
          detectedAt: new Date(),
          reportedAt: new Date()
        },
        affected: {
          users: details.users || 0,
          systems: details.systems || [],
          dataTypes: details.dataTypes || [],
          platforms: details.platforms || []
        },
        response: {
          assignedTo: 'security-team',
          actions: [],
          communications: []
        },
        compliance: {
          notificationRequired: severity === 'critical' || severity === 'high',
          regulators: severity === 'critical' ? ['SOC2_AUDITOR', 'GDPR_AUTHORITY'] : [],
          deadlines: severity === 'critical' ? [new Date(Date.now() + 72 * 60 * 60 * 1000)] : []
        }
      };
      this.securityIncidents.set(incidentId, incident);
      return incident;
    }
    
    this.isProcessingSecurityEvent = true;
    try {
      const incidentId = uuidv4();
      const incident: SecurityIncident = {
        id: incidentId,
        severity,
        type: type as any,
        status: 'detected',
        timeline: {
          detectedAt: new Date(),
          reportedAt: new Date()
        },
        affected: {
          users: details.users || 0,
          systems: details.systems || [],
          dataTypes: details.dataTypes || [],
          platforms: details.platforms || []
        },
        response: {
          assignedTo: 'security-team',
          actions: [],
          communications: []
        },
        compliance: {
          notificationRequired: severity === 'critical' || severity === 'high',
          regulators: severity === 'critical' ? ['SOC2_AUDITOR', 'GDPR_AUTHORITY'] : [],
          deadlines: severity === 'critical' ? [new Date(Date.now() + 72 * 60 * 60 * 1000)] : []
        }
      };

      this.securityIncidents.set(incidentId, incident);

      this.logAuditEvent('security', 'incident_created', 'security_incident', {
        resourceId: incidentId,
        resourceName: `${type}_${severity}`,
        sensitive: true
      });

      this.emit('incident.created', incident);

      // Auto-escalate critical incidents
      if (severity === 'critical') {
        this.escalateIncident(incidentId);
      }

      return incident;
    } finally {
      this.isProcessingSecurityEvent = false;
    }
  }

  private escalateIncident(incidentId: string): void {
    const incident = this.securityIncidents.get(incidentId);
    if (!incident) return;

    incident.response.actions.push('Incident auto-escalated due to critical severity');
    incident.response.communications.push('Security team notified via emergency channel');

    this.emit('incident.escalated', incident);
  }

  // ================================================================================================
  // SECRET ROTATION
  // ================================================================================================

  private async startSecretRotation(): Promise<void> {
    console.log('🔄 Starting secret rotation system...');
    
    this.rotationInterval = setInterval(async () => {
      await this.checkAndRotateSecrets();
    }, 24 * 60 * 60 * 1000); // Check daily
  }

  private async checkAndRotateSecrets(): Promise<void> {
    const now = new Date();
    
    for (const [secretId, secret] of this.secrets.entries()) {
      if (secret.rotation.enabled && 
          secret.rotation.nextRotation && 
          secret.rotation.nextRotation <= now) {
        
        try {
          await this.rotateSecret(secretId);
          console.log(`🔄 Auto-rotated secret: ${secret.name}`);
        } catch (error) {
          console.error(`Failed to rotate secret ${secretId}:`, error);
          
          this.createSecurityIncident('other', 'medium', {
            reason: `Failed to rotate secret: ${secret.name}`,
            secretId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }
  }

  // ================================================================================================
  // UTILITY METHODS
  // ================================================================================================

  private generateMasterKey(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  public getSecurityStatus(): any {
    const now = new Date();
    const activeIncidents = Array.from(this.securityIncidents.values())
      .filter(i => i.status !== 'closed');
    
    return {
      version: this.version,
      secrets: {
        total: this.secrets.size,
        active: Array.from(this.secrets.values()).filter(s => s.isActive).length,
        rotationEnabled: Array.from(this.secrets.values()).filter(s => s.rotation.enabled).length,
        dueForRotation: Array.from(this.secrets.values()).filter(s => 
          s.rotation.enabled && s.rotation.nextRotation && s.rotation.nextRotation <= now
        ).length
      },
      encryption: {
        keys: this.encryptionKeys.size,
        algorithms: Array.from(new Set(Array.from(this.encryptionKeys.values()).map(k => k.algorithm))),
        hsm: Array.from(this.encryptionKeys.values()).filter(k => k.compliance.hsm).length
      },
      audit: {
        logs: this.auditLogs.length,
        recentEvents: this.auditLogs.filter(log => 
          log.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)
        ).length,
        highRiskEvents: this.auditLogs.filter(log => 
          log.details.riskScore && log.details.riskScore >= 7
        ).length
      },
      compliance: {
        policies: this.compliancePolicies.size,
        active: Array.from(this.compliancePolicies.values()).filter(p => p.isActive).length
      },
      incidents: {
        total: this.securityIncidents.size,
        active: activeIncidents.length,
        critical: activeIncidents.filter(i => i.severity === 'critical').length,
        high: activeIncidents.filter(i => i.severity === 'high').length
      },
      lastUpdated: new Date().toISOString()
    };
  }

  public getAuditLogs(filters?: {
    eventType?: string;
    startDate?: Date;
    endDate?: Date;
    userId?: string;
    resourceType?: string;
  }): AuditLog[] {
    
    let logs = this.auditLogs;

    if (filters) {
      if (filters.eventType) {
        logs = logs.filter(log => log.eventType === filters.eventType);
      }
      
      if (filters.startDate) {
        logs = logs.filter(log => log.timestamp >= filters.startDate!);
      }
      
      if (filters.endDate) {
        logs = logs.filter(log => log.timestamp <= filters.endDate!);
      }
      
      if (filters.userId) {
        logs = logs.filter(log => log.actor.userId === filters.userId);
      }
      
      if (filters.resourceType) {
        logs = logs.filter(log => log.target.resourceType === filters.resourceType);
      }
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public getActiveIncidents(): SecurityIncident[] {
    return Array.from(this.securityIncidents.values())
      .filter(incident => incident.status !== 'closed')
      .sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
  }

  public destroy(): void {
    if (this.rotationInterval) {
      clearInterval(this.rotationInterval);
    }
    
    if (this.auditInterval) {
      clearInterval(this.auditInterval);
    }
  }
}

export const waiEnterpriseSecuritySystem = new WAIEnterpriseSecuritySystem();
export default waiEnterpriseSecuritySystem;