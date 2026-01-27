/**
 * JSON Operations Tool
 * Query, transform, validate, and merge JSON data
 */

import { JSONPath } from 'jsonpath-plus';
import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * JSON Operations Tool Definition
 */
export const jsonOperationsTool: Tool = {
  id: 'json_operations',
  name: 'JSON Operations',
  description: 'Query, transform, validate, merge, and manipulate JSON data',
  parameters: [
    {
      name: 'operation',
      type: 'string',
      description: 'Operation to perform',
      required: true,
      enum: ['query', 'transform', 'validate', 'merge', 'stringify', 'parse'],
    },
    {
      name: 'data',
      type: 'object',
      description: 'JSON data to operate on',
      required: true,
    },
    {
      name: 'path',
      type: 'string',
      description: 'JSONPath expression (for query operation)',
      required: false,
    },
    {
      name: 'mergeData',
      type: 'object',
      description: 'Data to merge (for merge operation)',
      required: false,
    },
    {
      name: 'schema',
      type: 'object',
      description: 'JSON schema for validation',
      required: false,
    },
    {
      name: 'pretty',
      type: 'boolean',
      description: 'Pretty print output (for stringify)',
      required: false,
      default: false,
    },
  ],
  returns: {
    type: 'object',
    description: 'Operation result',
  },
  examples: [
    {
      input: {
        operation: 'query',
        data: { users: [{ name: 'Alice' }, { name: 'Bob' }] },
        path: '$.users[*].name',
      },
      output: { success: true, result: ['Alice', 'Bob'] },
    },
    {
      input: {
        operation: 'merge',
        data: { a: 1 },
        mergeData: { b: 2 },
      },
      output: { success: true, result: { a: 1, b: 2 } },
    },
  ],
};

/**
 * JSON Operations Executor
 */
export const jsonOperationsExecutor: ToolExecutor = async (params) => {
  const { operation, data, path, mergeData, schema, pretty = false } = params;

  try {
    switch (operation) {
      case 'query': {
        if (!path) {
          throw new Error('Path parameter is required for query operation');
        }
        const result = JSONPath({ path, json: data });
        return {
          success: true,
          result,
          count: Array.isArray(result) ? result.length : undefined,
        };
      }

      case 'transform': {
        // Deep clone to avoid mutations
        const result = JSON.parse(JSON.stringify(data));
        return {
          success: true,
          result,
        };
      }

      case 'validate': {
        if (!schema) {
          throw new Error('Schema parameter is required for validate operation');
        }
        const valid = validateJsonSchema(data, schema);
        return {
          success: true,
          valid,
          data: valid ? data : undefined,
        };
      }

      case 'merge': {
        if (!mergeData) {
          throw new Error('MergeData parameter is required for merge operation');
        }
        const result = deepMerge(data, mergeData);
        return {
          success: true,
          result,
        };
      }

      case 'stringify': {
        const result = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
        return {
          success: true,
          result,
          length: result.length,
        };
      }

      case 'parse': {
        if (typeof data !== 'string') {
          throw new Error('Data must be a string for parse operation');
        }
        const result = JSON.parse(data as any);
        return {
          success: true,
          result,
        };
      }

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  } catch (error: any) {
    throw new Error(`JSON operation failed: ${error.message}`);
  }
};

/**
 * Deep merge two objects
 */
function deepMerge(target: any, source: any): any {
  if (typeof target !== 'object' || typeof source !== 'object') {
    return source;
  }

  const result = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

/**
 * Basic JSON schema validation
 */
function validateJsonSchema(data: any, schema: any): boolean {
  try {
    // Simple type validation
    if (schema.type) {
      const dataType = Array.isArray(data) ? 'array' : typeof data;
      if (dataType !== schema.type) {
        return false;
      }
    }

    // Required properties validation
    if (schema.required && Array.isArray(schema.required)) {
      for (const prop of schema.required) {
        if (!(prop in data)) {
          return false;
        }
      }
    }

    // Properties validation
    if (schema.properties && typeof data === 'object') {
      for (const prop in schema.properties) {
        if (prop in data) {
          if (!validateJsonSchema(data[prop], schema.properties[prop])) {
            return false;
          }
        }
      }
    }

    return true;
  } catch {
    return false;
  }
}
