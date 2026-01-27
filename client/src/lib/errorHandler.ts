export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTH_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

interface ErrorInfo {
  message: string;
  code?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  context?: string;
  statusCode: number;
}

export const handleError = (error: any, context?: string): ErrorInfo => {
  const timestamp = new Date();

  let errorInfo: ErrorInfo = {
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
    statusCode: 500,
    severity: 'medium',
    timestamp
  };

  if (error instanceof Error) {
    errorInfo.message = error.message;

    // Handle specific error types
    if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
      errorInfo.code = 'NETWORK_ERROR';
      errorInfo.message = 'Network connection failed. Please check your internet connection.';
      errorInfo.statusCode = 503;
    } else if (error.message.includes('timeout')) {
      errorInfo.code = 'TIMEOUT_ERROR';
      errorInfo.message = 'Request timed out. Please try again.';
      errorInfo.statusCode = 408;
    } else if (error.message.includes('unauthorized') || error.message.includes('401')) {
      errorInfo.code = 'AUTH_ERROR';
      errorInfo.message = 'Authentication failed. Please log in again.';
      errorInfo.statusCode = 401;
    } else if (error.message.includes('Login failed')) {
      errorInfo.code = 'AUTH_ERROR';
      errorInfo.message = 'Invalid username or password. Please try again.';
      errorInfo.statusCode = 401;
    }
  }

  // Network/API errors
  if (error?.response) {
    errorInfo.statusCode = error.response.status;
    errorInfo.message = error.response.data?.message || error.response.statusText;

    if (error.response.status >= 500) {
      errorInfo.severity = 'high';
      errorInfo.code = 'SERVER_ERROR';
    } else if (error.response.status >= 400) {
      errorInfo.severity = 'medium';
      errorInfo.code = 'CLIENT_ERROR';
    }
  }

  // Handle empty responses or connection refused
  if (!error.response && error.message.includes('Network Error')) {
    errorInfo.code = 'CONNECTION_ERROR';
    errorInfo.message = 'Could not connect to server. Please try again.';
    errorInfo.statusCode = 503;
  }

  return errorInfo;
};

const getErrorMessage = (status: number): string => {
  const messages: Record<number, string> = {
    400: 'Invalid request. Please check your input.',
    401: 'Please sign in to continue.',
    403: 'You don\'t have permission to access this resource.',
    404: 'The requested resource was not found.',
    429: 'Too many requests. Please try again later.',
    500: 'Server error. Our team has been notified.',
    503: 'Service temporarily unavailable. Please try again later.'
  };

  return messages[status] || `Request failed with status ${status}`;
};

export const logError = (error: any, context?: string): void => {
  const errorInfo = handleError(error, context);

  if (process.env.NODE_ENV === 'development') {
    console.group(`🚨 Error [${errorInfo.severity.toUpperCase()}]`);
    console.error('Message:', errorInfo.message);
    console.error('Context:', context);
    console.error('Timestamp:', errorInfo.timestamp);
    console.error('Original Error:', error);
    console.groupEnd();
  }

  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production' && errorInfo.severity === 'critical') {
    // Send to error tracking service
    console.error('Critical error:', errorInfo);
  }
};

export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      logError(error, `Retry attempt ${attempt}/${maxRetries}`);

      if (attempt === maxRetries) break;

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
    }
  }

  throw lastError;
};