/**
 * Validation Middleware
 * 
 * PHASE 2.3: API Layer Standardization
 * Centralized validation middleware for common request patterns
 * All middleware uses standardized error response utilities
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { sendValidationError, sendServerError } from '../utils/error-responses';

/**
 * Validate that a parameter is a positive integer
 */
export function validateNumericId(paramName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = req.params[paramName] || req.query[paramName];
    
    if (!value) {
      return sendValidationError(res, `${paramName} is required`, {
        field: paramName,
      });
    }

    const parsed = parseInt(String(value), 10);
    if (isNaN(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
      return sendValidationError(res, `${paramName} must be a positive integer`, {
        field: paramName,
        value: value,
      });
    }

    // Attach parsed value to request for downstream use
    (req as any)[`validated${paramName.charAt(0).toUpperCase()}${paramName.slice(1)}`] = parsed;
    next();
  };
}

/**
 * Validate request body against Zod schema
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return sendValidationError(
          res,
          'Request body validation failed',
          error.errors.map((err: any) => ({
            path: err.path.join('.'),
            message: err.message,
          }))
        );
      }
      return sendServerError(res, error);
    }
  };
}

/**
 * Validate query parameters against Zod schema
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated as any;
      next();
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return sendValidationError(
          res,
          'Query parameters validation failed',
          error.errors.map((err: any) => ({
            path: err.path.join('.'),
            message: err.message,
          }))
        );
      }
      return sendServerError(res, error);
    }
  };
}

/**
 * Validate that required query parameters are present
 */
export function requireQueryParams(...paramNames: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const missing = paramNames.filter(param => !req.query[param]);
    
    if (missing.length > 0) {
      return sendValidationError(
        res,
        `Missing required query parameters: ${missing.join(', ')}`,
        { missingParams: missing }
      );
    }
    
    next();
  };
}
