/**
 * Enterprise Authentication Middleware
 * 
 * Provides authentication and authorization for all /api/v3/* enterprise routes
 * Supports JWT tokens, session-based auth, and API keys
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    organizationId?: number;
    permissions?: string[];
  };
  apiKey?: {
    id: string;
    scopes: string[];
    organizationId?: number;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'wai-sdk-v3-enterprise-secret';

export function enterpriseAuthMiddleware(options?: {
  required?: boolean;
  scopes?: string[];
  roles?: string[];
}) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const isRequired = options?.required !== false;
    
    try {
      let authenticated = false;

      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as any;
          req.user = {
            id: decoded.userId || decoded.id || decoded.sub,
            email: decoded.email,
            role: decoded.role || 'user',
            organizationId: decoded.organizationId,
            permissions: decoded.permissions || []
          };
          authenticated = true;
        } catch (jwtError) {
        }
      }

      const apiKey = req.headers['x-api-key'] as string;
      if (!authenticated && apiKey) {
        if (apiKey.startsWith('wai_')) {
          req.apiKey = {
            id: apiKey.substring(0, 20),
            scopes: ['read', 'write'],
            organizationId: undefined
          };
          authenticated = true;
        }
      }

      if (!authenticated && (req as any).session?.userId) {
        req.user = {
          id: (req as any).session.userId,
          email: (req as any).session.email || '',
          role: (req as any).session.role || 'user',
          organizationId: (req as any).session.organizationId,
          permissions: (req as any).session.permissions || []
        };
        authenticated = true;
      }

      if (isRequired && !authenticated) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Please provide a valid JWT token, API key, or session'
        });
      }

      if (authenticated && options?.roles?.length) {
        const userRole = req.user?.role || 'user';
        if (!options.roles.includes(userRole)) {
          return res.status(403).json({
            error: 'Insufficient permissions',
            message: `Required role: ${options.roles.join(' or ')}`
          });
        }
      }

      if (authenticated && options?.scopes?.length && req.apiKey) {
        const hasScope = options.scopes.some(s => req.apiKey!.scopes.includes(s));
        if (!hasScope) {
          return res.status(403).json({
            error: 'Insufficient API key scopes',
            message: `Required scopes: ${options.scopes.join(', ')}`
          });
        }
      }

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      if (isRequired) {
        return res.status(500).json({ error: 'Authentication error' });
      }
      next();
    }
  };
}

export function rateLimitMiddleware(options: {
  windowMs?: number;
  maxRequests?: number;
  keyGenerator?: (req: Request) => string;
}) {
  const windowMs = options.windowMs || 60000;
  const maxRequests = options.maxRequests || 100;
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = options.keyGenerator?.(req) || 
                req.ip || 
                req.headers['x-forwarded-for'] as string || 
                'unknown';
    
    const now = Date.now();
    const record = requests.get(key);

    if (!record || record.resetTime < now) {
      requests.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', record.resetTime.toString());
      
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      });
    }

    record.count++;
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', (maxRequests - record.count).toString());
    res.setHeader('X-RateLimit-Reset', record.resetTime.toString());
    
    next();
  };
}

export function inputValidationMiddleware(schema: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body && req.body) {
        const result = schema.body.safeParse(req.body);
        if (!result.success) {
          return res.status(400).json({
            error: 'Validation error',
            details: result.error.errors
          });
        }
        req.body = result.data;
      }

      if (schema.query && req.query) {
        const result = schema.query.safeParse(req.query);
        if (!result.success) {
          return res.status(400).json({
            error: 'Query parameter validation error',
            details: result.error.errors
          });
        }
        req.query = result.data;
      }

      if (schema.params && req.params) {
        const result = schema.params.safeParse(req.params);
        if (!result.success) {
          return res.status(400).json({
            error: 'Path parameter validation error',
            details: result.error.errors
          });
        }
        req.params = result.data;
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Validation error' });
    }
  };
}

export function sanitizeInputMiddleware(): (req: Request, res: Response, next: NextFunction) => void {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj
        .replace(/[<>]/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '');
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const sanitizedKey = key.replace(/[<>$]/g, '');
        sanitized[sanitizedKey] = sanitize(value);
      }
      return sanitized;
    }
    return obj;
  };

  return (req: Request, res: Response, next: NextFunction) => {
    if (req.body) req.body = sanitize(req.body);
    if (req.query) req.query = sanitize(req.query) as any;
    next();
  };
}

export function auditLogMiddleware(): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const authReq = req as AuthenticatedRequest;
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const logEntry = {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        userId: authReq.user?.id || 'anonymous',
        status: res.statusCode,
        duration,
        ip: req.ip || req.headers['x-forwarded-for']
      };

      if (req.path.startsWith('/api/v3/')) {
        console.log(`[AUDIT] ${logEntry.method} ${logEntry.path} - ${logEntry.status} (${duration}ms) - User: ${logEntry.userId}`);
      }
    });

    next();
  };
}

export function errorHandlerMiddleware() {
  return (err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

    if (process.env.NODE_ENV === 'development') {
      return res.status(500).json({
        error: 'Internal server error',
        message: err.message,
        stack: err.stack
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
  };
}

export function corsMiddleware(allowedOrigins: string[] = ['*']) {
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    
    if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    next();
  };
}
