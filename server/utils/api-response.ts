/**
 * Standardized API Response System
 * Ensures consistent response formats across all WAI platform endpoints
 */

import { Response } from 'express';

export interface StandardAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: string;
    version: string;
    platform: string;
    processingTime?: number;
  };
}

export interface PaginatedResponse<T = any> extends StandardAPIResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class APIResponseHandler {
  private static version = 'v7.0';
  private static platform = 'WAI-DevStudio';

  /**
   * Send successful response
   */
  static success<T>(res: Response, data: T, metadata?: Partial<StandardAPIResponse['metadata']>): void {
    const response: StandardAPIResponse<T> = {
      success: true,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        version: this.version,
        platform: this.platform,
        ...metadata
      }
    };

    res.status(200).json(response);
  }

  /**
   * Send paginated response
   */
  static paginated<T>(
    res: Response, 
    data: T[], 
    pagination: PaginatedResponse['pagination'],
    metadata?: Partial<StandardAPIResponse['metadata']>
  ): void {
    const response: PaginatedResponse<T> = {
      success: true,
      data,
      pagination,
      metadata: {
        timestamp: new Date().toISOString(),
        version: this.version,
        platform: this.platform,
        ...metadata
      }
    };

    res.status(200).json(response);
  }

  /**
   * Send error response
   */
  static error(
    res: Response,
    statusCode: number,
    errorCode: string,
    message: string,
    details?: any
  ): void {
    const response: StandardAPIResponse = {
      success: false,
      error: {
        code: errorCode,
        message,
        details
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: this.version,
        platform: this.platform
      }
    };

    res.status(statusCode).json(response);
  }

  /**
   * Common error responses
   */
  static badRequest(res: Response, message: string, details?: any): void {
    this.error(res, 400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(res: Response, message: string = 'Unauthorized access'): void {
    this.error(res, 401, 'UNAUTHORIZED', message);
  }

  static forbidden(res: Response, message: string = 'Forbidden'): void {
    this.error(res, 403, 'FORBIDDEN', message);
  }

  static notFound(res: Response, message: string = 'Resource not found'): void {
    this.error(res, 404, 'NOT_FOUND', message);
  }

  static internalError(res: Response, message: string = 'Internal server error', details?: any): void {
    this.error(res, 500, 'INTERNAL_ERROR', message, details);
  }

  static serviceUnavailable(res: Response, message: string = 'Service temporarily unavailable'): void {
    this.error(res, 503, 'SERVICE_UNAVAILABLE', message);
  }

  /**
   * WAI-specific responses
   */
  static orchestrationSuccess<T>(res: Response, data: T, processingTime?: number): void {
    this.success(res, data, {
      processingTime,
      platform: 'WAI-Orchestration-v7.0'
    });
  }

  static agentResponse<T>(res: Response, agentId: string, data: T, processingTime?: number): void {
    this.success(res, data, {
      processingTime,
      platform: `WAI-Agent-${agentId}`
    });
  }

  static llmProviderResponse<T>(res: Response, provider: string, data: T, cost?: number): void {
    this.success(res, data, {
      platform: `WAI-LLM-${provider}`,
      ...(cost && { cost })
    });
  }
}

/**
 * Middleware for consistent error handling
 */
export const errorHandler = (err: any, req: any, res: Response, next: any) => {
  console.error('API Error:', err);

  // WAI orchestration errors
  if (err.code === 'WAI_ORCHESTRATION_ERROR') {
    return APIResponseHandler.serviceUnavailable(res, 'AI orchestration service temporarily unavailable', err.details);
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return APIResponseHandler.badRequest(res, 'Validation failed', err.details);
  }

  // Database errors
  if (err.code === 'DATABASE_ERROR') {
    return APIResponseHandler.internalError(res, 'Database operation failed');
  }

  // Generic internal error
  APIResponseHandler.internalError(res, err.message || 'An unexpected error occurred');
};

export default APIResponseHandler;