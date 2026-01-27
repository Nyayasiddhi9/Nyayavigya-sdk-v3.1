/**
 * Math & Calculations Tool
 * Mathematical operations, statistics, and conversions
 */

import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * Math & Calculations Tool Definition
 */
export const mathCalculationsTool: Tool = {
  id: 'math_calculations',
  name: 'Math & Calculations',
  description: 'Perform mathematical operations, statistics, and unit conversions',
  parameters: [
    {
      name: 'operation',
      type: 'string',
      description: 'Operation to perform',
      required: true,
      enum: ['eval', 'stats', 'convert', 'round', 'random'],
    },
    {
      name: 'expression',
      type: 'string',
      description: 'Mathematical expression to evaluate (for eval)',
      required: false,
    },
    {
      name: 'numbers',
      type: 'array',
      description: 'Array of numbers (for stats)',
      required: false,
    },
    {
      name: 'value',
      type: 'number',
      description: 'Value to convert/round',
      required: false,
    },
    {
      name: 'from',
      type: 'string',
      description: 'Source unit (for convert)',
      required: false,
    },
    {
      name: 'to',
      type: 'string',
      description: 'Target unit (for convert)',
      required: false,
    },
    {
      name: 'precision',
      type: 'number',
      description: 'Decimal places for rounding',
      required: false,
      default: 0,
    },
    {
      name: 'min',
      type: 'number',
      description: 'Minimum value for random number',
      required: false,
      default: 0,
    },
    {
      name: 'max',
      type: 'number',
      description: 'Maximum value for random number',
      required: false,
      default: 1,
    },
  ],
  returns: {
    type: 'object',
    description: 'Calculation result',
  },
  examples: [
    {
      input: { operation: 'eval', expression: '2 + 2 * 3' },
      output: { success: true, result: 8 },
    },
    {
      input: { operation: 'stats', numbers: [1, 2, 3, 4, 5] },
      output: { success: true, mean: 3, median: 3, sum: 15 },
    },
  ],
};

/**
 * Math Calculations Executor
 */
export const mathCalculationsExecutor: ToolExecutor = async (params) => {
  const { operation, expression, numbers, value, from, to, precision = 0, min = 0, max = 1 } = params;

  try {
    switch (operation) {
      case 'eval': {
        if (!expression) {
          throw new Error('Expression is required for eval operation');
        }
        // Safe math evaluation (whitelist approach)
        const result = evaluateMathExpression(expression);
        return {
          success: true,
          result,
          expression,
        };
      }

      case 'stats': {
        if (!Array.isArray(numbers) || numbers.length === 0) {
          throw new Error('Numbers array is required for stats operation');
        }
        const sorted = [...numbers].sort((a, b) => a - b);
        const sum = numbers.reduce((acc, n) => acc + n, 0);
        const mean = sum / numbers.length;
        const median = sorted.length % 2 === 0
          ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
          : sorted[Math.floor(sorted.length / 2)];
        const variance = numbers.reduce((acc, n) => acc + Math.pow(n - mean, 2), 0) / numbers.length;
        const stdDev = Math.sqrt(variance);

        return {
          success: true,
          count: numbers.length,
          sum,
          mean,
          median,
          min: sorted[0],
          max: sorted[sorted.length - 1],
          variance,
          stdDev,
        };
      }

      case 'convert': {
        if (value === undefined || !from || !to) {
          throw new Error('Value, from, and to parameters are required for convert operation');
        }
        const result = convertUnit(value, from, to);
        return {
          success: true,
          result,
          from,
          to,
          original: value,
        };
      }

      case 'round': {
        if (value === undefined) {
          throw new Error('Value is required for round operation');
        }
        const multiplier = Math.pow(10, precision);
        const result = Math.round(value * multiplier) / multiplier;
        return {
          success: true,
          result,
          precision,
          original: value,
        };
      }

      case 'random': {
        const result = Math.random() * (max - min) + min;
        return {
          success: true,
          result,
          min,
          max,
        };
      }

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  } catch (error: any) {
    throw new Error(`Math calculation failed: ${error.message}`);
  }
};

/**
 * Safe math expression evaluator
 */
function evaluateMathExpression(expr: string): number {
  // Remove whitespace
  expr = expr.replace(/\s+/g, '');

  // Validate only allowed characters
  if (!/^[0-9+\-*/.()]+$/.test(expr)) {
    throw new Error('Invalid characters in expression');
  }

  // Evaluate using Function constructor (limited scope)
  try {
    const result = new Function(`return ${expr}`)();
    if (typeof result !== 'number' || !isFinite(result)) {
      throw new Error('Invalid result');
    }
    return result;
  } catch {
    throw new Error('Failed to evaluate expression');
  }
}

/**
 * Unit conversion
 */
function convertUnit(value: number, from: string, to: string): number {
  const conversions: Record<string, Record<string, number>> = {
    // Length
    m: { km: 0.001, cm: 100, mm: 1000, ft: 3.28084, in: 39.3701 },
    km: { m: 1000, mi: 0.621371 },
    mi: { km: 1.60934, ft: 5280 },
    ft: { m: 0.3048, in: 12 },
    in: { cm: 2.54, mm: 25.4 },

    // Weight
    kg: { g: 1000, lb: 2.20462 },
    g: { kg: 0.001, mg: 1000 },
    lb: { kg: 0.453592, oz: 16 },

    // Temperature (special handling)
    c: { f: (v: number) => (v * 9/5) + 32, k: (v: number) => v + 273.15 },
    f: { c: (v: number) => (v - 32) * 5/9 },
    k: { c: (v: number) => v - 273.15 },
  };

  const fromLower = from.toLowerCase();
  const toLower = to.toLowerCase();

  if (fromLower === toLower) {
    return value;
  }

  const fromConversions = conversions[fromLower];
  if (!fromConversions) {
    throw new Error(`Unknown unit: ${from}`);
  }

  const converter = fromConversions[toLower];
  if (!converter) {
    throw new Error(`Cannot convert from ${from} to ${to}`);
  }

  return typeof converter === 'function' ? converter(value) : value * converter;
}
