/**
 * WAI SDK v9.0 - Production Authentication & Authorization
 * Enterprise-grade security implementation
 */

import { EventEmitter } from 'events';
import { createHash, randomBytes, pbkdf2, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { productionDB } from '../persistence/production-database';

const pbkdf2Async = promisify(pbkdf2);

export interface User {
  id: string;
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
  status: 'active' | 'suspended' | 'inactive';
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthenticationResult {
  success: boolean;
  user?: User;
  session?: UserSession;
  error?: string;
  requiresMFA?: boolean;
}

export interface UserSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  lastActivity: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

export interface AuditLogEntry {
  id: string;
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  success: boolean;
}

export class ProductionAuth extends EventEmitter {
  private sessionCache: Map<string, UserSession> = new Map(); // Cache for performance, backed by database
  private sessionCleanupInterval: NodeJS.Timeout | null = null;
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly TOKEN_LENGTH = 32;
  private readonly SALT_LENGTH = 32;
  private readonly HASH_ITERATIONS = 10000;

  constructor() {
    super();
    this.initializeAuth();
  }

  private async initializeAuth(): Promise<void> {
    try {
      await this.createAuthTables();
      await this.seedDefaultRoles();
      this.startSessionCleanup();
      
      console.log('🔐 Production authentication initialized');
      this.emit('auth-initialized');
    } catch (error) {
      console.error('❌ Authentication initialization failed:', error);
      this.emit('auth-error', error);
    }
  }

  private async createAuthTables(): Promise<void> {
    const tables = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        salt VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,

      // Roles table
      `CREATE TABLE IF NOT EXISTS roles (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )`,

      // Permissions table
      `CREATE TABLE IF NOT EXISTS permissions (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        resource VARCHAR(255) NOT NULL,
        action VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )`,

      // User roles junction table
      `CREATE TABLE IF NOT EXISTS user_roles (
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        role_id VARCHAR(255) REFERENCES roles(id) ON DELETE CASCADE,
        assigned_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (user_id, role_id)
      )`,

      // Role permissions junction table
      `CREATE TABLE IF NOT EXISTS role_permissions (
        role_id VARCHAR(255) REFERENCES roles(id) ON DELETE CASCADE,
        permission_id VARCHAR(255) REFERENCES permissions(id) ON DELETE CASCADE,
        assigned_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (role_id, permission_id)
      )`,

      // API keys table
      `CREATE TABLE IF NOT EXISTS api_keys (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        key_hash VARCHAR(255) NOT NULL,
        permissions JSONB DEFAULT '[]',
        last_used TIMESTAMP,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        status VARCHAR(50) DEFAULT 'active'
      )`
    ];

    for (const table of tables) {
      await productionDB.query(table);
    }

    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)',
      'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)',
      'CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at)',
      'CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_api_keys_status ON api_keys(status)',
    ];

    for (const index of indexes) {
      try {
        await productionDB.query(index);
      } catch (error) {
        console.warn('Index creation warning:', error);
      }
    }
  }

  private async seedDefaultRoles(): Promise<void> {
    const defaultRoles = [
      {
        id: 'admin',
        name: 'Administrator',
        description: 'Full system access'
      },
      {
        id: 'user',
        name: 'User',
        description: 'Standard user access'
      },
      {
        id: 'readonly',
        name: 'Read Only',
        description: 'Read-only access'
      }
    ];

    const defaultPermissions = [
      { id: 'agent.read', name: 'Read Agents', resource: 'agent', action: 'read' },
      { id: 'agent.write', name: 'Modify Agents', resource: 'agent', action: 'write' },
      { id: 'orchestration.execute', name: 'Execute Orchestration', resource: 'orchestration', action: 'execute' },
      { id: 'slo.read', name: 'Read SLO Metrics', resource: 'slo', action: 'read' },
      { id: 'system.admin', name: 'System Administration', resource: 'system', action: 'admin' },
      { id: 'audit.read', name: 'Read Audit Logs', resource: 'audit', action: 'read' },
    ];

    // Insert roles
    for (const role of defaultRoles) {
      try {
        await productionDB.query(
          'INSERT INTO roles (id, name, description) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING',
          [role.id, role.name, role.description]
        );
      } catch (error) {
        console.warn('Role seeding warning:', error);
      }
    }

    // Insert permissions
    for (const permission of defaultPermissions) {
      try {
        await productionDB.query(
          'INSERT INTO permissions (id, name, description, resource, action) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING',
          [permission.id, permission.name, permission.name, permission.resource, permission.action]
        );
      } catch (error) {
        console.warn('Permission seeding warning:', error);
      }
    }

    // Assign permissions to roles
    const rolePermissions = [
      { roleId: 'admin', permissions: defaultPermissions.map(p => p.id) },
      { roleId: 'user', permissions: ['agent.read', 'orchestration.execute', 'slo.read'] },
      { roleId: 'readonly', permissions: ['agent.read', 'slo.read', 'audit.read'] }
    ];

    for (const rp of rolePermissions) {
      for (const permissionId of rp.permissions) {
        try {
          await productionDB.query(
            'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [rp.roleId, permissionId]
          );
        } catch (error) {
          console.warn('Role permission assignment warning:', error);
        }
      }
    }
  }

  async createUser(
    username: string,
    email: string,
    password: string,
    roles: string[] = ['user']
  ): Promise<string> {
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const salt = randomBytes(this.SALT_LENGTH).toString('hex');
    const passwordHash = await this.hashPassword(password, salt);

    await productionDB.transaction(async (ctx) => {
      // Insert user
      await productionDB.query(
        'INSERT INTO users (id, username, email, password_hash, salt) VALUES ($1, $2, $3, $4, $5)',
        [userId, username, email, passwordHash, salt]
      );

      // Assign roles
      for (const roleId of roles) {
        await productionDB.query(
          'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)',
          [userId, roleId]
        );
      }
    });

    await this.auditLog(userId, 'user.created', 'user', userId, { username, email, roles });
    
    console.log(`👤 User created: ${username} (${userId})`);
    this.emit('user-created', { userId, username, email });
    
    return userId;
  }

  async authenticate(
    username: string,
    password: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthenticationResult> {
    try {
      // Get user from database
      const userResult = await productionDB.query(
        'SELECT * FROM users WHERE (username = $1 OR email = $1) AND status = $2',
        [username, 'active']
      );

      if (userResult.rows.length === 0) {
        await this.auditLog(null, 'auth.failed', 'user', null, { 
          reason: 'user_not_found', username 
        }, ipAddress, userAgent, false);
        
        return { success: false, error: 'Invalid credentials' };
      }

      const userData = userResult.rows[0];
      
      // Verify password
      const isValidPassword = await this.verifyPassword(password, userData.password_hash, userData.salt);
      
      if (!isValidPassword) {
        await this.auditLog(userData.id, 'auth.failed', 'user', userData.id, { 
          reason: 'invalid_password', username 
        }, ipAddress, userAgent, false);
        
        return { success: false, error: 'Invalid credentials' };
      }

      // Get user roles and permissions
      const user = await this.loadUserWithRoles(userData.id);
      
      // Create session
      const session = await this.createSession(user.id, ipAddress, userAgent);
      
      // Update last login
      await productionDB.query(
        'UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE id = $1',
        [user.id]
      );

      await this.auditLog(user.id, 'auth.success', 'user', user.id, { username }, ipAddress, userAgent);
      
      console.log(`🔓 User authenticated: ${username}`);
      this.emit('user-authenticated', { user, session });
      
      return { success: true, user, session };
    } catch (error) {
      console.error('❌ Authentication error:', error);
      
      await this.auditLog(null, 'auth.error', 'system', null, { 
        error: error instanceof Error ? error.message : String(error)
      }, ipAddress, userAgent, false);
      
      return { success: false, error: 'Authentication failed' };
    }
  }

  async validateSession(token: string): Promise<User | null> {
    try {
      // Check cache first for performance
      const cachedSession = this.sessionCache.get(token);
      if (cachedSession && cachedSession.expiresAt > new Date()) {
        // Update last activity in database
        await productionDB.query(
          'UPDATE user_sessions SET last_activity = NOW() WHERE id = $1',
          [cachedSession.id]
        );
        
        // Update cache
        cachedSession.lastActivity = new Date();
        
        // Get fresh user data
        return await this.loadUserWithRoles(cachedSession.userId);
      }

      // Check database
      const sessionResult = await productionDB.query(
        'SELECT * FROM user_sessions WHERE token_hash = $1 AND expires_at > NOW()',
        [this.hashToken(token)]
      );

      if (sessionResult.rows.length === 0) {
        return null;
      }

      const sessionData = sessionResult.rows[0];
      const user = await this.loadUserWithRoles(sessionData.user_id);
      
      if (!user || user.status !== 'active') {
        return null;
      }

      // Update session cache
      this.sessionCache.set(token, {
        id: sessionData.id,
        userId: sessionData.user_id,
        token,
        expiresAt: sessionData.expires_at,
        lastActivity: new Date(),
        ipAddress: sessionData.ip_address,
        userAgent: sessionData.user_agent
      });

      // Update last activity in database
      await productionDB.query(
        'UPDATE user_sessions SET last_activity = NOW() WHERE id = $1',
        [sessionData.id]
      );

      return user;
    } catch (error) {
      console.error('❌ Session validation error:', error);
      return null;
    }
  }

  async checkPermission(userId: string, resource: string, action: string): Promise<boolean> {
    try {
      const result = await productionDB.query(
        `SELECT COUNT(*) as count
         FROM user_roles ur
         JOIN role_permissions rp ON ur.role_id = rp.role_id
         JOIN permissions p ON rp.permission_id = p.id
         WHERE ur.user_id = $1 
         AND (p.resource = $2 OR p.resource = '*')
         AND (p.action = $3 OR p.action = '*')`,
        [userId, resource, action]
      );

      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      console.error('❌ Permission check error:', error);
      return false;
    }
  }

  async revokeSession(token: string): Promise<boolean> {
    try {
      const tokenHash = this.hashToken(token);
      
      // Remove from database
      const result = await productionDB.query(
        'DELETE FROM user_sessions WHERE token_hash = $1',
        [tokenHash]
      );

      // Remove from cache
      this.sessionCache.delete(token);

      const revoked = result.rowCount > 0;
      
      if (revoked) {
        console.log('🔒 Session revoked');
        this.emit('session-revoked', { token: tokenHash });
      }

      return revoked;
    } catch (error) {
      console.error('❌ Session revocation error:', error);
      return false;
    }
  }

  private async createSession(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<UserSession> {
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const token = randomBytes(this.TOKEN_LENGTH).toString('hex');
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + this.SESSION_DURATION);

    // Store in database
    await productionDB.query(
      'INSERT INTO user_sessions (id, user_id, token_hash, expires_at, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6)',
      [sessionId, userId, tokenHash, expiresAt, ipAddress, userAgent]
    );

    const session: UserSession = {
      id: sessionId,
      userId,
      token,
      expiresAt,
      lastActivity: new Date(),
      ipAddress,
      userAgent
    };

    // Cache session for performance
    this.sessionCache.set(token, session);

    return session;
  }

  private async loadUserWithRoles(userId: string): Promise<User> {
    // Get user basic info
    const userResult = await productionDB.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const userData = userResult.rows[0];

    // Get user roles
    const rolesResult = await productionDB.query(
      `SELECT r.id, r.name FROM roles r
       JOIN user_roles ur ON r.id = ur.role_id
       WHERE ur.user_id = $1`,
      [userId]
    );

    // Get user permissions
    const permissionsResult = await productionDB.query(
      `SELECT DISTINCT p.id, p.name, p.resource, p.action
       FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       JOIN user_roles ur ON rp.role_id = ur.role_id
       WHERE ur.user_id = $1`,
      [userId]
    );

    return {
      id: userData.id,
      username: userData.username,
      email: userData.email,
      roles: rolesResult.rows.map(r => r.name),
      permissions: permissionsResult.rows.map(p => p.id),
      status: userData.status,
      lastLogin: userData.last_login,
      createdAt: userData.created_at,
      updatedAt: userData.updated_at
    };
  }

  private async hashPassword(password: string, salt: string): Promise<string> {
    const hash = await pbkdf2Async(password, salt, this.HASH_ITERATIONS, 64, 'sha256');
    return hash.toString('hex');
  }

  private async verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
    const candidateHash = await this.hashPassword(password, salt);
    const candidateBuffer = Buffer.from(candidateHash, 'hex');
    const hashBuffer = Buffer.from(hash, 'hex');
    
    return timingSafeEqual(candidateBuffer, hashBuffer);
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private startSessionCleanup(): void {
    // Clean expired sessions every hour
    this.sessionCleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 60 * 60 * 1000);
  }

  private async cleanupExpiredSessions(): Promise<void> {
    try {
      // Remove expired sessions from database
      const result = await productionDB.query(
        'DELETE FROM user_sessions WHERE expires_at < NOW()'
      );

      // Remove expired sessions from cache
      const now = new Date();
      for (const [token, session] of this.sessionCache.entries()) {
        if (session.expiresAt < now) {
          this.sessionCache.delete(token);
        }
      }

      if (result.rowCount > 0) {
        console.log(`🧹 Cleaned up ${result.rowCount} expired sessions`);
      }
    } catch (error) {
      console.error('❌ Session cleanup error:', error);
    }
  }

  private async auditLog(
    userId: string | null,
    action: string,
    resourceType: string,
    resourceId: string | null,
    details: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
    success: boolean = true
  ): Promise<void> {
    try {
      await productionDB.insertAuditLog({
        userId,
        action,
        resourceType,
        resourceId,
        details,
        ipAddress,
        userAgent
      });
    } catch (error) {
      console.error('❌ Audit logging error:', error);
    }
  }

  // Middleware function for Express
  authMiddleware() {
    return async (req: any, res: any, next: any) => {
      try {
        const token = this.extractToken(req);
        
        if (!token) {
          return res.status(401).json({ error: 'Authentication required' });
        }

        const user = await this.validateSession(token);
        
        if (!user) {
          return res.status(401).json({ error: 'Invalid or expired session' });
        }

        req.user = user;
        next();
      } catch (error) {
        console.error('❌ Auth middleware error:', error);
        return res.status(500).json({ error: 'Authentication error' });
      }
    };
  }

  // Authorization middleware
  requirePermission(resource: string, action: string) {
    return async (req: any, res: any, next: any) => {
      try {
        if (!req.user) {
          return res.status(401).json({ error: 'Authentication required' });
        }

        const hasPermission = await this.checkPermission(req.user.id, resource, action);
        
        if (!hasPermission) {
          await this.auditLog(
            req.user.id,
            'authz.denied',
            resource,
            null,
            { action, resource },
            req.ip,
            req.get('User-Agent'),
            false
          );
          
          return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
      } catch (error) {
        console.error('❌ Authorization middleware error:', error);
        return res.status(500).json({ error: 'Authorization error' });
      }
    };
  }

  private extractToken(req: any): string | null {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Also check for token in cookies
    return req.cookies?.session_token || null;
  }

  async cleanup(): Promise<void> {
    if (this.sessionCleanupInterval) {
      clearInterval(this.sessionCleanupInterval);
      this.sessionCleanupInterval = null;
    }
    
    this.sessionCache.clear();
    console.log('🧹 Production auth cleaned up');
  }
}

// Export singleton instance
export const productionAuth = new ProductionAuth();