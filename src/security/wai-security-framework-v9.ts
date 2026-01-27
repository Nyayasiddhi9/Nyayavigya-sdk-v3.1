/**
 * WAI Security Framework v9.0
 * 
 * Comprehensive security system with:
 * - Multi-layer authentication and authorization
 * - Real-time threat detection and prevention
 * - Audit trail and compliance monitoring
 * - Zero-trust architecture principles
 * - API key management and rotation
 * - Session management and rate limiting
 */

import { EventEmitter } from 'events';
import { randomUUID as uuidv4, createHash, createHmac, randomBytes } from 'crypto';
import { Pool } from 'pg';

export interface SecurityPrincipal {
  id: string;
  type: 'user' | 'agent' | 'service' | 'system';
  userId?: string;
  agentId?: string;
  serviceId?: string;
  permissions: SecurityPermission[];
  roles: SecurityRole[];
  accessLevel: 'guest' | 'user' | 'admin' | 'system';
  status: 'active' | 'suspended' | 'revoked';
  metadata: {
    created: Date;
    lastLogin?: Date;
    loginCount: number;
    failedAttempts: number;
    ipAddresses: string[];
    userAgent?: string;
    sessionId?: string;
  };
}

export interface SecurityPermission {
  resource: string; // 'memory', 'agents', 'llm-providers', 'orchestration'
  action: string;   // 'read', 'write', 'delete', 'admin', 'execute'
  scope: string;    // 'self', 'team', 'organization', 'global'
  conditions?: SecurityCondition[];
}

export interface SecurityCondition {
  type: 'time' | 'ip' | 'rate' | 'resource-limit' | 'approval-required';
  value: any;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'in' | 'not-in' | 'between';
}

export interface SecurityRole {
  id: string;
  name: string;
  description: string;
  permissions: SecurityPermission[];
  inheritsFrom?: string[];
}

export interface SecurityContext {
  principal: SecurityPrincipal;
  session: SecuritySession;
  request: SecurityRequest;
  timestamp: Date;
}

export interface SecuritySession {
  id: string;
  principalId: string;
  status: 'active' | 'expired' | 'terminated';
  created: Date;
  lastActivity: Date;
  expiresAt: Date;
  ipAddress: string;
  userAgent: string;
  metadata: Record<string, any>;
}

export interface SecurityRequest {
  resource: string;
  action: string;
  payload?: any;
  ipAddress: string;
  userAgent: string;
  fingerprint: string;
  timestamp: Date;
}

export interface SecurityThreat {
  id: string;
  type: 'bruteforce' | 'ratelimit' | 'suspicious-access' | 'privilege-escalation' | 'data-exfiltration';
  severity: 'low' | 'medium' | 'high' | 'critical';
  principalId?: string;
  description: string;
  indicators: Record<string, any>;
  detectedAt: Date;
  status: 'detected' | 'investigating' | 'mitigated' | 'false-positive';
  actions: SecurityAction[];
}

export interface SecurityAction {
  id: string;
  type: 'block' | 'throttle' | 'alert' | 'lockout' | 'escalate';
  target: string;
  duration?: number;
  reason: string;
  executedAt: Date;
  executedBy: string;
}

export interface SecurityAudit {
  id: string;
  principalId: string;
  action: string;
  resource: string;
  resourceId?: string;
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

export class WAISecurityFramework extends EventEmitter {
  private dbPool: Pool;
  private activeSessions: Map<string, SecuritySession> = new Map();
  private securityPolicies: Map<string, any> = new Map();
  private threatDetectors: Map<string, any> = new Map();
  private rateLimiters: Map<string, any> = new Map();
  private auditQueue: SecurityAudit[] = [];
  private encryptionKey: Buffer;
  private isInitialized: boolean = false;

  // Security configuration
  private readonly config = {
    session: {
      maxDuration: 24 * 60 * 60 * 1000, // 24 hours
      inactivityTimeout: 2 * 60 * 60 * 1000, // 2 hours
      maxConcurrentSessions: 5
    },
    authentication: {
      maxFailedAttempts: 5,
      lockoutDuration: 15 * 60 * 1000, // 15 minutes
      passwordPolicy: {
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true
      }
    },
    rateLimit: {
      defaultWindow: 60 * 1000, // 1 minute
      defaultLimit: 100,
      strictResources: {
        'llm-providers': { window: 60 * 1000, limit: 10 },
        'memory-search': { window: 60 * 1000, limit: 20 },
        'agent-execution': { window: 60 * 1000, limit: 5 }
      }
    },
    threatDetection: {
      bruteforceThreshold: 10,
      suspiciousPatternWindow: 5 * 60 * 1000, // 5 minutes
      dataExfiltrationThreshold: 1000 // KB
    }
  };

  constructor(databaseUrl?: string) {
    super();
    
    this.dbPool = new Pool({
      connectionString: databaseUrl || process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Require stable encryption key for production
    if (!process.env.WAI_ENCRYPTION_KEY) {
      throw new Error('WAI_ENCRYPTION_KEY environment variable is required for production deployment. Generate with: openssl rand -hex 32');
    }
    
    this.encryptionKey = Buffer.from(process.env.WAI_ENCRYPTION_KEY, 'hex');
    
    if (this.encryptionKey.length !== 32) {
      throw new Error('WAI_ENCRYPTION_KEY must be exactly 32 bytes (64 hex characters). Generate with: openssl rand -hex 32');
    }

    this.setupThreatDetectors();
    this.setupEventHandlers();
  }

  /**
   * Initialize security framework and database schema
   */
  async initialize(): Promise<void> {
    try {
      console.log('🔒 Initializing WAI Security Framework v9.0...');

      // Create security tables
      await this.createSecurityTables();
      
      // Initialize default roles and permissions
      await this.initializeDefaultSecurity();
      
      // Start background processes
      this.startSecurityMonitoring();
      
      this.isInitialized = true;
      
      console.log('✅ WAI Security Framework v9.0 initialized successfully');
      this.emit('security-framework-initialized', { timestamp: new Date() });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('❌ Failed to initialize WAI Security Framework:', errorMessage);
      this.emit('security-error', { stage: 'initialization', error: errorMessage });
      throw error;
    }
  }

  /**
   * Authenticate principal and create security context
   */
  async authenticate(
    credentials: {
      type: 'api-key' | 'session-token' | 'service-token' | 'agent-token';
      value: string;
      metadata?: Record<string, any>;
    },
    request: Partial<SecurityRequest>
  ): Promise<SecurityContext> {
    const startTime = Date.now();
    
    try {
      // Validate and decode credentials
      const principal = await this.validateCredentials(credentials);
      
      // Check principal status
      if (principal.status !== 'active') {
        throw new Error(`Principal ${principal.id} is ${principal.status}`);
      }

      // Create or validate session
      const session = await this.createOrValidateSession(principal, request);
      
      // Build security context
      const securityContext: SecurityContext = {
        principal,
        session,
        request: {
          resource: request.resource || 'unknown',
          action: request.action || 'unknown',
          payload: request.payload,
          ipAddress: request.ipAddress || 'unknown',
          userAgent: request.userAgent || 'unknown',
          fingerprint: this.generateFingerprint(request),
          timestamp: new Date()
        },
        timestamp: new Date()
      };

      // Update principal metadata
      await this.updatePrincipalActivity(principal.id, request);
      
      // Record successful authentication
      await this.auditLog(securityContext, 'authenticate', 'security', null, true);
      
      this.emit('authentication-successful', {
        principalId: principal.id,
        principalType: principal.type,
        sessionId: session.id,
        ipAddress: request.ipAddress,
        responseTime: Date.now() - startTime,
        timestamp: new Date()
      });

      return securityContext;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Record failed authentication
      await this.auditLog(null, 'authenticate', 'security', null, false, errorMessage);
      
      // Detect potential threats
      await this.detectThreat('bruteforce', request, { error: errorMessage });
      
      this.emit('authentication-failed', {
        error: errorMessage,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        timestamp: new Date()
      });

      throw new Error(`Authentication failed: ${errorMessage}`);
    }
  }

  /**
   * Authorize action against security context
   */
  async authorize(
    securityContext: SecurityContext,
    resource: string,
    action: string,
    resourceId?: string
  ): Promise<boolean> {
    try {
      // Check session validity
      if (!this.isSessionValid(securityContext.session)) {
        throw new Error('Session expired or invalid');
      }

      // Check rate limits
      await this.checkRateLimit(securityContext, resource, action);
      
      // Check permissions
      const hasPermission = await this.checkPermissions(
        securityContext.principal,
        resource,
        action,
        resourceId
      );

      if (!hasPermission) {
        throw new Error(`Insufficient permissions for ${action} on ${resource}`);
      }

      // Check security conditions
      await this.checkSecurityConditions(securityContext, resource, action);
      
      // Update session activity
      await this.updateSessionActivity(securityContext.session.id);
      
      // Record successful authorization
      await this.auditLog(securityContext, action, resource, resourceId, true);
      
      this.emit('authorization-successful', {
        principalId: securityContext.principal.id,
        resource,
        action,
        resourceId,
        timestamp: new Date()
      });

      return true;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Record failed authorization
      await this.auditLog(securityContext, action, resource, resourceId, false, errorMessage);
      
      // Detect potential privilege escalation
      if (errorMessage.includes('Insufficient permissions')) {
        await this.detectThreat('privilege-escalation', securityContext.request, {
          resource,
          action,
          principalId: securityContext.principal.id
        });
      }
      
      this.emit('authorization-failed', {
        principalId: securityContext.principal.id,
        resource,
        action,
        error: errorMessage,
        timestamp: new Date()
      });

      throw new Error(`Authorization failed: ${errorMessage}`);
    }
  }

  /**
   * Create API key with specified permissions
   */
  async createApiKey(
    creatorContext: SecurityContext,
    keyConfig: {
      name: string;
      description?: string;
      permissions: SecurityPermission[];
      expiresAt?: Date;
      rateLimits?: Record<string, any>;
    }
  ): Promise<{ keyId: string; apiKey: string; hashedKey: string }> {
    try {
      // Authorize API key creation
      await this.authorize(creatorContext, 'security', 'create-api-key');
      
      const keyId = uuidv4();
      const apiKey = this.generateApiKey();
      const hashedKey = this.hashApiKey(apiKey);
      
      // Store API key in database
      await this.dbPool.query(`
        INSERT INTO wai_api_keys (
          id, name, description, hashed_key, permissions, 
          created_by, expires_at, rate_limits, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        keyId,
        keyConfig.name,
        keyConfig.description || '',
        hashedKey,
        JSON.stringify(keyConfig.permissions),
        creatorContext.principal.id,
        keyConfig.expiresAt,
        JSON.stringify(keyConfig.rateLimits || {}),
        'active'
      ]);

      await this.auditLog(creatorContext, 'create-api-key', 'security', keyId, true);
      
      this.emit('api-key-created', {
        keyId,
        name: keyConfig.name,
        createdBy: creatorContext.principal.id,
        permissions: keyConfig.permissions.length,
        timestamp: new Date()
      });

      return { keyId, apiKey, hashedKey };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.auditLog(creatorContext, 'create-api-key', 'security', null, false, errorMessage);
      throw error;
    }
  }

  /**
   * Rotate API key
   */
  async rotateApiKey(
    securityContext: SecurityContext,
    keyId: string
  ): Promise<{ apiKey: string; hashedKey: string }> {
    try {
      await this.authorize(securityContext, 'security', 'rotate-api-key');
      
      const newApiKey = this.generateApiKey();
      const newHashedKey = this.hashApiKey(newApiKey);
      
      // Update API key in database
      await this.dbPool.query(`
        UPDATE wai_api_keys 
        SET hashed_key = $1, updated_at = NOW()
        WHERE id = $2 AND status = 'active'
      `, [newHashedKey, keyId]);

      await this.auditLog(securityContext, 'rotate-api-key', 'security', keyId, true);
      
      this.emit('api-key-rotated', {
        keyId,
        rotatedBy: securityContext.principal.id,
        timestamp: new Date()
      });

      return { apiKey: newApiKey, hashedKey: newHashedKey };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.auditLog(securityContext, 'rotate-api-key', 'security', keyId, false, errorMessage);
      throw error;
    }
  }

  /**
   * Get security metrics and insights
   */
  async getSecurityMetrics(securityContext: SecurityContext): Promise<any> {
    try {
      await this.authorize(securityContext, 'security', 'read-metrics');
      
      // Get authentication metrics
      const authMetrics = await this.dbPool.query(`
        SELECT 
          COUNT(*) as total_attempts,
          SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_attempts,
          COUNT(DISTINCT principal_id) as unique_principals,
          DATE_TRUNC('hour', timestamp) as hour
        FROM wai_security_audit 
        WHERE action = 'authenticate' 
          AND timestamp > NOW() - INTERVAL '24 hours'
        GROUP BY hour
        ORDER BY hour DESC
      `);

      // Get threat metrics
      const threatMetrics = await this.dbPool.query(`
        SELECT 
          threat_type, 
          severity,
          COUNT(*) as count,
          MAX(detected_at) as latest_detection
        FROM wai_security_threats 
        WHERE detected_at > NOW() - INTERVAL '24 hours'
        GROUP BY threat_type, severity
        ORDER BY count DESC
      `);

      // Get session metrics
      const sessionMetrics = await this.dbPool.query(`
        SELECT 
          status,
          COUNT(*) as count,
          AVG(EXTRACT(EPOCH FROM (last_activity - created_at))) as avg_duration
        FROM wai_security_sessions
        WHERE created_at > NOW() - INTERVAL '24 hours'
        GROUP BY status
      `);

      return {
        authentication: authMetrics.rows,
        threats: threatMetrics.rows,
        sessions: sessionMetrics.rows,
        activeSessionsCount: this.activeSessions.size,
        timestamp: new Date()
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('security-error', { stage: 'metrics-retrieval', error: errorMessage });
      throw error;
    }
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(data: string): string {
    const iv = randomBytes(16);
    const cipher = require('crypto').createCipher('aes-256-gcm', this.encryptionKey);
    cipher.setAAD(iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedData: string): string {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = require('crypto').createDecipher('aes-256-gcm', this.encryptionKey);
    decipher.setAAD(iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Validate credentials and return principal
   */
  private async validateCredentials(credentials: any): Promise<SecurityPrincipal> {
    switch (credentials.type) {
      case 'api-key':
        return await this.validateApiKey(credentials.value);
      
      case 'session-token':
        return await this.validateSessionToken(credentials.value);
      
      case 'service-token':
        return await this.validateServiceToken(credentials.value);
      
      case 'agent-token':
        return await this.validateAgentToken(credentials.value);
      
      default:
        throw new Error(`Unsupported credential type: ${credentials.type}`);
    }
  }

  /**
   * Validate API key
   */
  private async validateApiKey(apiKey: string): Promise<SecurityPrincipal> {
    const hashedKey = this.hashApiKey(apiKey);
    
    const result = await this.dbPool.query(`
      SELECT ak.*, p.* 
      FROM wai_api_keys ak
      JOIN wai_security_principals p ON ak.created_by = p.id
      WHERE ak.hashed_key = $1 
        AND ak.status = 'active'
        AND (ak.expires_at IS NULL OR ak.expires_at > NOW())
    `, [hashedKey]);

    if (result.rows.length === 0) {
      throw new Error('Invalid or expired API key');
    }

    const row = result.rows[0];
    
    return {
      id: row.id,
      type: row.type,
      userId: row.user_id,
      agentId: row.agent_id,
      serviceId: row.service_id,
      permissions: JSON.parse(row.permissions || '[]'),
      roles: JSON.parse(row.roles || '[]'),
      accessLevel: row.access_level,
      status: row.status,
      metadata: JSON.parse(row.metadata || '{}')
    };
  }

  /**
   * Create or validate session
   */
  private async createOrValidateSession(
    principal: SecurityPrincipal,
    request: Partial<SecurityRequest>
  ): Promise<SecuritySession> {
    const sessionId = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.session.maxDuration);
    
    const session: SecuritySession = {
      id: sessionId,
      principalId: principal.id,
      status: 'active',
      created: now,
      lastActivity: now,
      expiresAt,
      ipAddress: request.ipAddress || 'unknown',
      userAgent: request.userAgent || 'unknown',
      metadata: {}
    };

    // Store session in database
    await this.dbPool.query(`
      INSERT INTO wai_security_sessions (
        id, principal_id, status, created_at, last_activity, 
        expires_at, ip_address, user_agent, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      session.id,
      session.principalId,
      session.status,
      session.created,
      session.lastActivity,
      session.expiresAt,
      session.ipAddress,
      session.userAgent,
      JSON.stringify(session.metadata)
    ]);

    // Store in memory for quick access
    this.activeSessions.set(sessionId, session);

    return session;
  }

  /**
   * Check permissions
   */
  private async checkPermissions(
    principal: SecurityPrincipal,
    resource: string,
    action: string,
    resourceId?: string
  ): Promise<boolean> {
    // Check direct permissions
    for (const permission of principal.permissions) {
      if (this.matchesPermission(permission, resource, action)) {
        return true;
      }
    }

    // Check role-based permissions
    for (const role of principal.roles) {
      for (const permission of role.permissions) {
        if (this.matchesPermission(permission, resource, action)) {
          return true;
        }
      }
    }

    // System-level access
    if (principal.accessLevel === 'system') {
      return true;
    }

    return false;
  }

  /**
   * Check if permission matches resource and action
   */
  private matchesPermission(
    permission: SecurityPermission,
    resource: string,
    action: string
  ): boolean {
    // Exact match
    if (permission.resource === resource && permission.action === action) {
      return true;
    }

    // Wildcard matches
    if (permission.resource === '*' || permission.action === '*') {
      return true;
    }

    // Pattern matches (basic implementation)
    if (permission.resource.endsWith('*') && 
        resource.startsWith(permission.resource.slice(0, -1))) {
      return true;
    }

    return false;
  }

  /**
   * Create security database tables
   */
  private async createSecurityTables(): Promise<void> {
    // Security principals table
    await this.dbPool.query(`
      CREATE TABLE IF NOT EXISTS wai_security_principals (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        type VARCHAR NOT NULL,
        user_id VARCHAR,
        agent_id VARCHAR,
        service_id VARCHAR,
        permissions JSONB DEFAULT '[]',
        roles JSONB DEFAULT '[]',
        access_level VARCHAR DEFAULT 'user',
        status VARCHAR DEFAULT 'active',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // API keys table
    await this.dbPool.query(`
      CREATE TABLE IF NOT EXISTS wai_api_keys (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR NOT NULL,
        description TEXT,
        hashed_key VARCHAR NOT NULL UNIQUE,
        permissions JSONB DEFAULT '[]',
        created_by VARCHAR REFERENCES wai_security_principals(id),
        expires_at TIMESTAMP,
        rate_limits JSONB DEFAULT '{}',
        status VARCHAR DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Sessions table
    await this.dbPool.query(`
      CREATE TABLE IF NOT EXISTS wai_security_sessions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        principal_id VARCHAR REFERENCES wai_security_principals(id),
        status VARCHAR DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        last_activity TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP NOT NULL,
        ip_address INET,
        user_agent TEXT,
        metadata JSONB DEFAULT '{}'
      );
    `);

    // Audit log table
    await this.dbPool.query(`
      CREATE TABLE IF NOT EXISTS wai_security_audit (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        principal_id VARCHAR,
        action VARCHAR NOT NULL,
        resource VARCHAR NOT NULL,
        resource_id VARCHAR,
        success BOOLEAN DEFAULT true,
        error_code VARCHAR,
        error_message TEXT,
        ip_address INET,
        user_agent TEXT,
        timestamp TIMESTAMP DEFAULT NOW(),
        metadata JSONB DEFAULT '{}'
      );
    `);

    // Threats table
    await this.dbPool.query(`
      CREATE TABLE IF NOT EXISTS wai_security_threats (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        threat_type VARCHAR NOT NULL,
        severity VARCHAR NOT NULL,
        principal_id VARCHAR,
        description TEXT NOT NULL,
        indicators JSONB DEFAULT '{}',
        detected_at TIMESTAMP DEFAULT NOW(),
        status VARCHAR DEFAULT 'detected',
        actions JSONB DEFAULT '[]',
        metadata JSONB DEFAULT '{}'
      );
    `);

    // Create indexes
    await this.dbPool.query(`
      CREATE INDEX IF NOT EXISTS idx_security_principals_type ON wai_security_principals(type);
      CREATE INDEX IF NOT EXISTS idx_api_keys_hashed_key ON wai_api_keys(hashed_key);
      CREATE INDEX IF NOT EXISTS idx_sessions_principal_id ON wai_security_sessions(principal_id);
      CREATE INDEX IF NOT EXISTS idx_audit_principal_id ON wai_security_audit(principal_id);
      CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON wai_security_audit(timestamp);
      CREATE INDEX IF NOT EXISTS idx_threats_detected_at ON wai_security_threats(detected_at);
    `);
  }

  /**
   * Initialize default security configuration
   */
  private async initializeDefaultSecurity(): Promise<void> {
    // Create system principal if not exists
    const systemResult = await this.dbPool.query(`
      SELECT id FROM wai_security_principals WHERE type = 'system' LIMIT 1
    `);

    if (systemResult.rows.length === 0) {
      await this.dbPool.query(`
        INSERT INTO wai_security_principals (
          type, access_level, permissions, status
        ) VALUES ('system', 'system', $1, 'active')
      `, [JSON.stringify([
        { resource: '*', action: '*', scope: 'global' }
      ])]);
    }
  }

  /**
   * Setup threat detection systems
   */
  private setupThreatDetectors(): void {
    // Brute force detector
    this.threatDetectors.set('bruteforce', {
      threshold: this.config.threatDetection.bruteforceThreshold,
      window: 5 * 60 * 1000, // 5 minutes
      attempts: new Map()
    });

    // Rate limit detector
    this.threatDetectors.set('ratelimit', {
      window: this.config.rateLimit.defaultWindow,
      limits: new Map()
    });
  }

  /**
   * Generate API key
   */
  private generateApiKey(): string {
    const prefix = 'wai_v9_';
    const keyBytes = randomBytes(32);
    return prefix + keyBytes.toString('hex');
  }

  /**
   * Hash API key for storage
   */
  private hashApiKey(apiKey: string): string {
    return createHash('sha256').update(apiKey).digest('hex');
  }

  /**
   * Generate request fingerprint
   */
  private generateFingerprint(request: Partial<SecurityRequest>): string {
    const data = `${request.ipAddress}:${request.userAgent}:${request.resource}:${request.action}`;
    return createHash('md5').update(data).digest('hex');
  }

  /**
   * Additional helper methods would be implemented here...
   */
  
  private isSessionValid(session: SecuritySession): boolean {
    return session.status === 'active' && 
           session.expiresAt > new Date() &&
           (Date.now() - session.lastActivity.getTime()) < this.config.session.inactivityTimeout;
  }

  private async checkRateLimit(securityContext: SecurityContext, resource: string, action: string): Promise<void> {
    // Rate limiting implementation
    const key = `${securityContext.principal.id}:${resource}:${action}`;
    const config = this.config.rateLimit.strictResources[resource] || this.config.rateLimit;
    
    // Implementation would track requests and enforce limits
  }

  private async checkSecurityConditions(securityContext: SecurityContext, resource: string, action: string): Promise<void> {
    // Security conditions checking
    // Implementation would check various conditions like time-based access, IP restrictions, etc.
  }

  private async updateSessionActivity(sessionId: string): Promise<void> {
    await this.dbPool.query(`
      UPDATE wai_security_sessions 
      SET last_activity = NOW() 
      WHERE id = $1
    `, [sessionId]);
  }

  private async updatePrincipalActivity(principalId: string, request: Partial<SecurityRequest>): Promise<void> {
    // Update principal metadata with activity information
  }

  private async auditLog(
    securityContext: SecurityContext | null,
    action: string,
    resource: string,
    resourceId: string | null,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    const audit: SecurityAudit = {
      id: uuidv4(),
      principalId: securityContext?.principal.id || 'anonymous',
      action,
      resource,
      resourceId,
      success,
      errorMessage,
      ipAddress: securityContext?.request.ipAddress || 'unknown',
      userAgent: securityContext?.request.userAgent || 'unknown',
      timestamp: new Date(),
      metadata: {}
    };

    this.auditQueue.push(audit);
    
    // Batch process audit logs
    if (this.auditQueue.length >= 10) {
      await this.flushAuditQueue();
    }
  }

  private async flushAuditQueue(): Promise<void> {
    if (this.auditQueue.length === 0) return;
    
    const audits = this.auditQueue.splice(0);
    
    for (const audit of audits) {
      await this.dbPool.query(`
        INSERT INTO wai_security_audit (
          principal_id, action, resource, resource_id, success,
          error_message, ip_address, user_agent, timestamp, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        audit.principalId, audit.action, audit.resource, audit.resourceId,
        audit.success, audit.errorMessage, audit.ipAddress, audit.userAgent,
        audit.timestamp, JSON.stringify(audit.metadata)
      ]);
    }
  }

  private async detectThreat(
    threatType: SecurityThreat['type'],
    request: Partial<SecurityRequest>,
    indicators: Record<string, any>
  ): Promise<void> {
    // Threat detection logic
    // Implementation would analyze patterns and create threat records
  }

  private async validateSessionToken(token: string): Promise<SecurityPrincipal> {
    // Session token validation
    throw new Error('Method not implemented');
  }

  private async validateServiceToken(token: string): Promise<SecurityPrincipal> {
    // Service token validation
    throw new Error('Method not implemented');
  }

  private async validateAgentToken(token: string): Promise<SecurityPrincipal> {
    // Agent token validation
    throw new Error('Method not implemented');
  }

  private setupEventHandlers(): void {
    this.on('authentication-successful', (data) => {
      console.log(`🔐 Security: Successful authentication for ${data.principalType} ${data.principalId}`);
    });

    this.on('authentication-failed', (data) => {
      console.log(`🚨 Security: Failed authentication from ${data.ipAddress}: ${data.error}`);
    });

    this.on('authorization-failed', (data) => {
      console.log(`🚫 Security: Authorization failed for ${data.principalId} on ${data.resource}:${data.action}`);
    });

    this.on('security-error', (error) => {
      console.error(`❌ Security Error in ${error.stage}:`, error.error);
    });
  }

  private startSecurityMonitoring(): void {
    // Flush audit queue periodically
    setInterval(async () => {
      await this.flushAuditQueue();
    }, 30000); // Every 30 seconds

    // Clean up expired sessions
    setInterval(async () => {
      await this.cleanupExpiredSessions();
    }, 60000); // Every minute
  }

  private async cleanupExpiredSessions(): Promise<void> {
    try {
      await this.dbPool.query(`
        UPDATE wai_security_sessions 
        SET status = 'expired' 
        WHERE expires_at < NOW() AND status = 'active'
      `);

      // Remove from memory
      for (const [sessionId, session] of this.activeSessions) {
        if (session.expiresAt < new Date()) {
          this.activeSessions.delete(sessionId);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup expired sessions:', error);
    }
  }

  async cleanup(): Promise<void> {
    try {
      await this.flushAuditQueue();
      await this.dbPool.end();
      console.log('✅ WAI Security Framework cleanup completed');
    } catch (error) {
      console.error('❌ WAI Security Framework cleanup failed:', error);
    }
  }
}

/**
 * Factory function for creating WAI Security Framework
 */
export function createWAISecurityFramework(databaseUrl?: string): WAISecurityFramework {
  return new WAISecurityFramework(databaseUrl);
}