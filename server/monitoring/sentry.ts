/**
 * Sentry APM Integration - Production Monitoring
 * 
 * Features:
 * - Error tracking and reporting
 * - Performance monitoring (APM)
 * - Transaction tracing
 * - Request context
 * - User identification
 * - Environment-aware configuration
 */

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { Request, Response, NextFunction } from 'express';

// Sentry configuration
export function initializeSentry() {
  // Only initialize in production or if DSN is provided
  const SENTRY_DSN = process.env.SENTRY_DSN;
  const NODE_ENV = process.env.NODE_ENV || 'development';
  
  if (!SENTRY_DSN) {
    console.log('[Sentry] No DSN configured - monitoring disabled');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: NODE_ENV,
    
    // Performance Monitoring
    tracesSampleRate: NODE_ENV === 'production' ? 0.1 : 1.0, // 10% in production, 100% in dev
    
    // Profiling
    profilesSampleRate: NODE_ENV === 'production' ? 0.1 : 1.0,
    
    integrations: [
      // Profiling integration for performance insights
      nodeProfilingIntegration(),
    ],
    
    // Release tracking
    release: process.env.npm_package_version || '1.0.0',
    
    // Error filtering - don't send common errors
    beforeSend(event, hint) {
      // Filter out 404 errors
      if (event.exception?.values?.[0]?.value?.includes('404')) {
        return null;
      }
      
      // Filter out expected errors
      if (event.tags?.expected === 'true') {
        return null;
      }
      
      return event;
    },
    
    // Transaction filtering
    beforeSendTransaction(event) {
      // Don't send health check transactions
      if (event.transaction?.includes('/health')) {
        return null;
      }
      
      return event;
    },
  });

  console.log(`[Sentry] Initialized for environment: ${NODE_ENV}`);
}

/**
 * Express middleware for Sentry request handling
 */
export function sentryRequestHandler() {
  // Return no-op middleware if Sentry not configured
  if (!process.env.SENTRY_DSN) {
    return (req: any, res: any, next: any) => next();
  }
  
  return Sentry.Handlers.requestHandler({
    // Include request data in events
    request: true,
    // Include IP addresses
    ip: true,
    // Include user data if available
    user: ['id', 'username', 'email'],
  });
}

/**
 * Express middleware for Sentry tracing (APM)
 */
export function sentryTracingHandler() {
  // Return no-op middleware if Sentry not configured
  if (!process.env.SENTRY_DSN) {
    return (req: any, res: any, next: any) => next();
  }
  
  return Sentry.Handlers.tracingHandler();
}

/**
 * Express error handler middleware for Sentry
 * MUST be added after all controllers and before other error handlers
 */
export function sentryErrorHandler() {
  // Return no-op middleware if Sentry not configured
  if (!process.env.SENTRY_DSN) {
    return (err: any, req: any, res: any, next: any) => next(err);
  }
  
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Capture all errors with status code >= 500
      return (error as any).statusCode >= 500;
    },
  });
}

/**
 * Set user context for Sentry
 */
export function setSentryUser(userId: string, userData?: { email?: string; username?: string }) {
  if (!process.env.SENTRY_DSN) return;
  Sentry.setUser({
    id: userId,
    ...userData,
  });
}

/**
 * Clear user context (on logout)
 */
export function clearSentryUser() {
  if (!process.env.SENTRY_DSN) return;
  Sentry.setUser(null);
}

/**
 * Add custom context to Sentry events
 */
export function setSentryContext(key: string, data: Record<string, any>) {
  if (!process.env.SENTRY_DSN) return;
  Sentry.setContext(key, data);
}

/**
 * Add tags to Sentry events
 */
export function setSentryTags(tags: Record<string, string>) {
  if (!process.env.SENTRY_DSN) return;
  Sentry.setTags(tags);
}

/**
 * Manually capture an exception
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (!process.env.SENTRY_DSN) return;
  if (context) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

/**
 * Manually capture a message
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  if (!process.env.SENTRY_DSN) return;
  Sentry.captureMessage(message, level);
}

/**
 * Start a performance transaction
 */
export function startTransaction(name: string, op: string) {
  if (!process.env.SENTRY_DSN) return null;
  return Sentry.startTransaction({
    name,
    op,
  });
}

/**
 * Express middleware to track user sessions
 */
export function sentryUserMiddleware(req: Request, res: Response, next: NextFunction) {
  // Set user context if authenticated
  if (req.user) {
    const user = req.user as any;
    setSentryUser(user.id, {
      email: user.email,
      username: user.username,
    });
  }
  
  // Add request context
  setSentryContext('request', {
    method: req.method,
    url: req.url,
    query: req.query,
    ip: req.ip,
  });
  
  next();
}

/**
 * Wrapper for async route handlers with error capture
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      // Capture error in Sentry
      captureException(error, {
        route: {
          method: req.method,
          path: req.path,
          params: req.params,
          query: req.query,
        },
      });
      next(error);
    });
  };
}

/**
 * Database query wrapper with performance tracking
 */
export function trackDatabaseQuery<T>(queryName: string, queryFn: () => Promise<T>): Promise<T> {
  if (!process.env.SENTRY_DSN) return queryFn();
  
  const transaction = Sentry.getCurrentHub().getScope()?.getTransaction();
  
  if (transaction) {
    const span = transaction.startChild({
      op: 'db.query',
      description: queryName,
    });
    
    return queryFn()
      .then((result) => {
        span.setStatus('ok');
        span.finish();
        return result;
      })
      .catch((error) => {
        span.setStatus('internal_error');
        span.finish();
        throw error;
      });
  }
  
  return queryFn();
}

/**
 * External API call wrapper with performance tracking
 */
export function trackExternalCall<T>(serviceName: string, callFn: () => Promise<T>): Promise<T> {
  if (!process.env.SENTRY_DSN) return callFn();
  
  const transaction = Sentry.getCurrentHub().getScope()?.getTransaction();
  
  if (transaction) {
    const span = transaction.startChild({
      op: 'http.client',
      description: serviceName,
    });
    
    return callFn()
      .then((result) => {
        span.setStatus('ok');
        span.finish();
        return result;
      })
      .catch((error) => {
        span.setStatus('internal_error');
        span.finish();
        throw error;
      });
  }
  
  return callFn();
}

// Export Sentry instance for advanced usage
export { Sentry };
