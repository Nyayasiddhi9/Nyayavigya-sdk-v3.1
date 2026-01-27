/**
 * WAI Validation Utilities
 */

export function validateRequired(value: any, fieldName: string): void {
  if (value === undefined || value === null) {
    throw new Error(`${fieldName} is required`);
  }
}

export function validateString(value: any, fieldName: string): void {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }
}

export function validateNumber(value: any, fieldName: string): void {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new Error(`${fieldName} must be a valid number`);
  }
}

export function validateArray(value: any, fieldName: string): void {
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array`);
  }
}

export function validateObject(value: any, fieldName: string): void {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${fieldName} must be an object`);
  }
}