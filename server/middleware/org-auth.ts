import { Request, Response, NextFunction } from 'express';
import { apiKeyService, rateLimiter, organizationConfigService } from '../services/multi-org';

export interface OrgAuthRequest extends Request {
  organizationId?: number;
  apiKeyId?: number;
  scopes?: string[];
  rateLimit?: {
    remaining: number;
    limit: number;
    resetAt: Date;
  };
}

export async function orgApiKeyAuth(
  req: OrgAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Missing or invalid Authorization header',
      code: 'UNAUTHORIZED',
    });
    return;
  }

  const apiKey = authHeader.substring(7);

  try {
    const validation = await apiKeyService.validateApiKey(apiKey);

    if (!validation.valid) {
      res.status(401).json({
        success: false,
        error: validation.error || 'Invalid API key',
        code: 'INVALID_API_KEY',
      });
      return;
    }

    const rateCheck = await rateLimiter.checkRateLimit(
      validation.organizationId!,
      validation.apiKeyId!,
      validation.rateLimit
    );

    if (!rateCheck.allowed) {
      res.set({
        'X-RateLimit-Limit': String(rateCheck.limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.floor(rateCheck.resetAt.getTime() / 1000)),
        'Retry-After': String(rateCheck.retryAfter),
      });

      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: rateCheck.retryAfter,
      });
      return;
    }

    req.organizationId = validation.organizationId;
    req.apiKeyId = validation.apiKeyId;
    req.scopes = validation.scopes;
    req.rateLimit = {
      remaining: rateCheck.remaining,
      limit: rateCheck.limit,
      resetAt: rateCheck.resetAt,
    };

    res.set({
      'X-RateLimit-Limit': String(rateCheck.limit),
      'X-RateLimit-Remaining': String(rateCheck.remaining),
      'X-RateLimit-Reset': String(Math.floor(rateCheck.resetAt.getTime() / 1000)),
    });

    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_ERROR',
    });
  }
}

export function requireScope(...requiredScopes: string[]) {
  return (req: OrgAuthRequest, res: Response, next: NextFunction) => {
    const userScopes = req.scopes || [];

    if (userScopes.includes('*')) {
      return next();
    }

    const hasRequiredScope = requiredScopes.some(scope => {
      if (userScopes.includes(scope)) return true;

      const [resource, action] = scope.split(':');
      if (userScopes.includes(`${resource}:*`)) return true;

      return false;
    });

    if (!hasRequiredScope) {
      res.status(403).json({
        success: false,
        error: `Missing required scope: ${requiredScopes.join(' or ')}`,
        code: 'INSUFFICIENT_SCOPE',
      });
      return;
    }

    next();
  };
}

export async function checkAgentAccess(
  req: OrgAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const agentId = req.params.agentId || req.body?.agentId;

  if (!agentId || !req.organizationId) {
    return next();
  }

  const isEnabled = await organizationConfigService.isAgentEnabled(req.organizationId, agentId);

  if (!isEnabled) {
    res.status(403).json({
      success: false,
      error: `Agent '${agentId}' is not enabled for your organization`,
      code: 'AGENT_NOT_ENABLED',
    });
    return;
  }

  next();
}

export async function checkProviderAccess(
  req: OrgAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const providerId = req.params.providerId || req.body?.providerId || req.body?.provider;

  if (!providerId || !req.organizationId) {
    return next();
  }

  const isEnabled = await organizationConfigService.isProviderEnabled(req.organizationId, providerId);

  if (!isEnabled) {
    res.status(403).json({
      success: false,
      error: `Provider '${providerId}' is not enabled for your organization`,
      code: 'PROVIDER_NOT_ENABLED',
    });
    return;
  }

  next();
}

export async function checkFeatureAccess(feature: string) {
  return async (req: OrgAuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.organizationId) {
      return next();
    }

    const isEnabled = await organizationConfigService.isFeatureEnabled(req.organizationId, feature);

    if (!isEnabled) {
      res.status(403).json({
        success: false,
        error: `Feature '${feature}' is not enabled for your organization`,
        code: 'FEATURE_NOT_ENABLED',
      });
      return;
    }

    next();
  };
}
