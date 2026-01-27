/**
 * Standardized Error Response Utilities
 * 
 * PHASE 2.3: API Layer Standardization
 * Consistent error response structure across all API endpoints
 */

import { Response } from 'express';

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  [key: string]: any;
}

/**
 * Standard success response structure
 */
export interface SuccessResponse<T = any> {
  success: true;
  [key: string]: any;
}

/**
 * Send validation error (400)
 */
export function sendValidationError(
  res: Response,
  message: string,
  details?: any
): Response {
  return res.status(400).json({
    success: false,
    error: 'validation_failed',
    message,
    ...(details && { details }),
  });
}

/**
 * Send dependency not met error (400)
 */
export function sendDependencyError(
  res: Response,
  message: string,
  missingDependencies: string[],
  suggestedAction?: string
): Response {
  return res.status(400).json({
    success: false,
    error: 'dependency_not_met',
    message,
    missingDependencies,
    suggestedAction: suggestedAction || `Please complete ${missingDependencies[0]} first`,
    nextStudio: missingDependencies[0],
  });
}

/**
 * Send authentication error (401)
 */
export function sendAuthError(
  res: Response,
  message: string = 'Authentication required'
): Response {
  return res.status(401).json({
    success: false,
    error: 'unauthorized',
    message,
  });
}

/**
 * Send forbidden error (403)
 */
export function sendForbiddenError(
  res: Response,
  message: string = 'Access forbidden'
): Response {
  return res.status(403).json({
    success: false,
    error: 'forbidden',
    message,
  });
}

/**
 * Send not found error (404)
 */
export function sendNotFoundError(
  res: Response,
  resource: string
): Response {
  return res.status(404).json({
    success: false,
    error: 'not_found',
    message: `${resource} not found`,
    resource,
  });
}

/**
 * Send server error (500)
 */
export function sendServerError(
  res: Response,
  error: Error | string,
  includeStack: boolean = process.env.NODE_ENV === 'development'
): Response {
  const message = typeof error === 'string' ? error : error.message;
  const stack = typeof error === 'string' ? undefined : error.stack;
  
  return res.status(500).json({
    success: false,
    error: 'server_error',
    message,
    ...(includeStack && stack && { stack }),
  });
}

/**
 * Send success response (200)
 */
export function sendSuccess<T = any>(
  res: Response,
  data: T,
  meta?: Record<string, any>
): Response {
  return res.json({
    success: true,
    ...data,
    ...(meta && { meta }),
  });
}

/**
 * Send created response (201)
 */
export function sendCreated<T = any>(
  res: Response,
  data: T,
  meta?: Record<string, any>
): Response {
  return res.status(201).json({
    success: true,
    ...data,
    ...(meta && { meta }),
  });
}
