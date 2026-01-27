/**
 * WAI Request Validator v9.0
 * Implements Gap Closure runbook Phase B requirements
 * Comprehensive request validation with JSON schemas
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { WAILogger } from '../utils/logger';
import {
  SchemaValidator,
  WAIRequestSchema,
  AgentExecutionRequestSchema,
  ConnectorConnectionRequestSchema,
  ConnectorUploadRequestSchema,
  ConnectorDownloadRequestSchema,
  BMADRequestSchema,
  GRPOTrainingRequestSchema,
  RegistrationRequestSchema
} from '../schemas/spi-schemas';

export class RequestValidator {
  private static logger = new WAILogger('RequestValidator');

  /**
   * Create Express middleware for validating request bodies
   */
  static validateBody<T>(schema: ZodSchema<T>) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = SchemaValidator.safeValidate(schema, req.body);
        
        if (!result.success) {
          RequestValidator.logger.warn(`Request validation failed: ${result.error}`);
          return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: result.error,
            timestamp: Date.now()
          });
        }

        // Replace req.body with validated data
        req.body = result.data;
        next();
      } catch (error) {
        RequestValidator.logger.error(`Request validation error: ${error}`);
        return res.status(500).json({
          success: false,
          error: 'Internal validation error',
          timestamp: Date.now()
        });
      }
    };
  }

  /**
   * Validate query parameters
   */
  static validateQuery<T>(schema: ZodSchema<T>) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = SchemaValidator.safeValidate(schema, req.query);
        
        if (!result.success) {
          RequestValidator.logger.warn(`Query validation failed: ${result.error}`);
          return res.status(400).json({
            success: false,
            error: 'Query validation failed',
            details: result.error,
            timestamp: Date.now()
          });
        }

        req.query = result.data as any;
        next();
      } catch (error) {
        RequestValidator.logger.error(`Query validation error: ${error}`);
        return res.status(500).json({
          success: false,
          error: 'Internal validation error',
          timestamp: Date.now()
        });
      }
    };
  }

  /**
   * Validate URL parameters
   */
  static validateParams<T>(schema: ZodSchema<T>) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = SchemaValidator.safeValidate(schema, req.params);
        
        if (!result.success) {
          RequestValidator.logger.warn(`Params validation failed: ${result.error}`);
          return res.status(400).json({
            success: false,
            error: 'URL parameters validation failed',
            details: result.error,
            timestamp: Date.now()
          });
        }

        req.params = result.data as any;
        next();
      } catch (error) {
        RequestValidator.logger.error(`Params validation error: ${error}`);
        return res.status(500).json({
          success: false,
          error: 'Internal validation error',
          timestamp: Date.now()
        });
      }
    };
  }

  /**
   * Pre-configured middleware for common endpoints
   */
  static get middlewares() {
    return {
      // WAI Core endpoints
      waiRequest: RequestValidator.validateBody(WAIRequestSchema),
      
      // Agent endpoints
      agentExecution: RequestValidator.validateBody(AgentExecutionRequestSchema),
      
      // MCP Connector endpoints
      connectorConnection: RequestValidator.validateBody(ConnectorConnectionRequestSchema),
      connectorUpload: RequestValidator.validateBody(ConnectorUploadRequestSchema),
      connectorDownload: RequestValidator.validateBody(ConnectorDownloadRequestSchema),
      
      // BMAD endpoints
      bmadRequest: RequestValidator.validateBody(BMADRequestSchema),
      
      // GRPO endpoints
      grpoTraining: RequestValidator.validateBody(GRPOTrainingRequestSchema),
      
      // Registry endpoints
      registration: RequestValidator.validateBody(RegistrationRequestSchema),
    };
  }

  /**
   * Batch validate array of items
   */
  static validateBatch<T>(schema: ZodSchema<T>, items: unknown[]): {
    valid: T[];
    invalid: { index: number; error: string; item: unknown }[];
  } {
    const valid: T[] = [];
    const invalid: { index: number; error: string; item: unknown }[] = [];

    items.forEach((item, index) => {
      const result = SchemaValidator.safeValidate(schema, item);
      if (result.success && result.data) {
        valid.push(result.data);
      } else {
        invalid.push({
          index,
          error: result.error || 'Validation failed',
          item
        });
      }
    });

    return { valid, invalid };
  }

  /**
   * Validate and sanitize file uploads
   */
  static validateFileUpload(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[] | undefined;
      const file = req.file as Express.Multer.File | undefined;

      // Basic file validation
      const validateFile = (file: Express.Multer.File) => {
        // Check file size (50MB limit)
        if (file.size > 50 * 1024 * 1024) {
          throw new Error('File size exceeds 50MB limit');
        }

        // Check mime type (basic security)
        const allowedMimeTypes = [
          'text/plain',
          'application/json',
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/gif',
          'audio/mpeg',
          'audio/wav',
          'video/mp4',
          'application/zip'
        ];

        if (file.mimetype && !allowedMimeTypes.includes(file.mimetype)) {
          RequestValidator.logger.warn(`Suspicious file type: ${file.mimetype}`);
          // Don't throw error, just log for security monitoring
        }

        // Sanitize filename
        file.originalname = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      };

      if (files && Array.isArray(files)) {
        files.forEach(validateFile);
      } else if (file) {
        validateFile(file);
      }

      next();
    } catch (error) {
      RequestValidator.logger.error(`File validation error: ${error}`);
      return res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'File validation failed',
        timestamp: Date.now()
      });
    }
  }

  /**
   * Rate limiting validation (check if request is within limits)
   */
  static validateRateLimit(maxRequests: number = 100, windowMs: number = 60000) {
    const requestCounts = new Map<string, { count: number; resetTime: number }>();

    return (req: Request, res: Response, next: NextFunction) => {
      const clientId = req.ip || req.headers['x-forwarded-for'] || 'unknown';
      const now = Date.now();
      
      let clientData = requestCounts.get(clientId as string);
      
      if (!clientData || now > clientData.resetTime) {
        clientData = { count: 1, resetTime: now + windowMs };
        requestCounts.set(clientId as string, clientData);
        return next();
      }

      if (clientData.count >= maxRequests) {
        RequestValidator.logger.warn(`Rate limit exceeded for client: ${clientId}`);
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
          timestamp: Date.now()
        });
      }

      clientData.count++;
      next();
    };
  }

  /**
   * Security validation middleware
   */
  static validateSecurity() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Check for common attack patterns in query/body
      const suspiciousPatterns = [
        /script\s*:/i,
        /javascript\s*:/i,
        /vbscript\s*:/i,
        /onload\s*=/i,
        /onerror\s*=/i,
        /<script/i,
        /eval\s*\(/i,
        /expression\s*\(/i
      ];

      const checkForSuspiciousContent = (obj: any): boolean => {
        if (typeof obj === 'string') {
          return suspiciousPatterns.some(pattern => pattern.test(obj));
        }
        if (typeof obj === 'object' && obj !== null) {
          return Object.values(obj).some(value => checkForSuspiciousContent(value));
        }
        return false;
      };

      if (checkForSuspiciousContent(req.body) || checkForSuspiciousContent(req.query)) {
        RequestValidator.logger.error(`Suspicious content detected from ${req.ip}`);
        return res.status(400).json({
          success: false,
          error: 'Invalid request content',
          timestamp: Date.now()
        });
      }

      next();
    };
  }

  /**
   * Content-Type validation
   */
  static validateContentType(expectedTypes: string[] = ['application/json']) {
    return (req: Request, res: Response, next: NextFunction) => {
      const contentType = req.headers['content-type'];
      
      if (req.method === 'GET' || req.method === 'DELETE') {
        return next(); // No content-type required for GET/DELETE
      }

      if (!contentType || !expectedTypes.some(type => contentType.includes(type))) {
        RequestValidator.logger.warn(`Invalid content type: ${contentType}, expected: ${expectedTypes.join(', ')}`);
        return res.status(400).json({
          success: false,
          error: `Invalid content type. Expected: ${expectedTypes.join(', ')}`,
          timestamp: Date.now()
        });
      }

      next();
    };
  }

  /**
   * API key validation
   */
  static validateApiKey(requiredKey?: string) {
    return (req: Request, res: Response, next: NextFunction) => {
      const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
      
      if (!apiKey) {
        return res.status(401).json({
          success: false,
          error: 'API key required',
          timestamp: Date.now()
        });
      }

      if (requiredKey && apiKey !== requiredKey) {
        RequestValidator.logger.warn(`Invalid API key attempt from ${req.ip}`);
        return res.status(403).json({
          success: false,
          error: 'Invalid API key',
          timestamp: Date.now()
        });
      }

      next();
    };
  }

  /**
   * Response validation (for ensuring our responses follow schemas)
   */
  static validateResponse<T>(schema: ZodSchema<T>) {
    return (req: Request, res: Response, next: NextFunction) => {
      const originalSend = res.send.bind(res);
      
      res.send = function(data: any) {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
            const result = SchemaValidator.safeValidate(schema, parsedData);
            
            if (!result.success) {
              RequestValidator.logger.error(`Response validation failed: ${result.error}`);
              // In production, you might want to still send the response
              // but log the error for monitoring
            }
          }
        } catch (error) {
          RequestValidator.logger.error(`Response validation error: ${error}`);
        }

        return originalSend(data);
      };

      next();
    };
  }
}

export default RequestValidator;