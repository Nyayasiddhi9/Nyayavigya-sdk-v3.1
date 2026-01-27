/**
 * Utility functions for consistent error handling across the application
 */

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function createErrorResponse(error: unknown) {
  return {
    success: false,
    error: getErrorMessage(error)
  };
}

export function createSuccessResponse(data: any) {
  return {
    success: true,
    ...data
  };
}