/**
 * Correlation Analysis Tool
 * Calculate correlation coefficients (Pearson, Spearman, Kendall)
 */

import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * Correlation Analysis Tool Definition
 */
export const correlationTool: Tool = {
  id: 'correlation',
  name: 'Correlation Analysis',
  description: 'Calculate correlation between two variables (Pearson, Spearman, Kendall)',
  parameters: [
    {
      name: 'x',
      type: 'array',
      description: 'First variable (array of numbers)',
      required: true,
    },
    {
      name: 'y',
      type: 'array',
      description: 'Second variable (array of numbers)',
      required: true,
    },
    {
      name: 'method',
      type: 'string',
      description: 'Correlation method',
      required: false,
      enum: ['pearson', 'spearman', 'kendall'],
      default: 'pearson',
    },
  ],
  returns: {
    type: 'object',
    description: 'Correlation coefficient and p-value',
  },
  examples: [
    {
      input: {
        x: [1, 2, 3, 4, 5],
        y: [2, 4, 6, 8, 10],
        method: 'pearson',
      },
      output: {
        success: true,
        method: 'pearson',
        coefficient: 1.0,
        strength: 'perfect positive',
      },
    },
  ],
};

/**
 * Calculate Pearson correlation coefficient
 */
const pearsonCorrelation = (x: number[], y: number[]): number => {
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  return denominator === 0 ? 0 : numerator / denominator;
};

/**
 * Calculate Spearman rank correlation
 */
const spearmanCorrelation = (x: number[], y: number[]): number => {
  // Convert to ranks
  const rankX = getRanks(x);
  const rankY = getRanks(y);

  // Use Pearson on ranks
  return pearsonCorrelation(rankX, rankY);
};

/**
 * Get ranks for Spearman correlation
 */
const getRanks = (arr: number[]): number[] => {
  const indexed = arr.map((val, idx) => ({ val, idx }));
  indexed.sort((a, b) => a.val - b.val);

  const ranks = new Array(arr.length);
  for (let i = 0; i < indexed.length; i++) {
    ranks[indexed[i].idx] = i + 1;
  }

  return ranks;
};

/**
 * Calculate Kendall tau correlation
 */
const kendallCorrelation = (x: number[], y: number[]): number => {
  const n = x.length;
  let concordant = 0;
  let discordant = 0;

  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      const xDiff = x[i] - x[j];
      const yDiff = y[i] - y[j];

      if (xDiff * yDiff > 0) {
        concordant++;
      } else if (xDiff * yDiff < 0) {
        discordant++;
      }
    }
  }

  return (concordant - discordant) / (n * (n - 1) / 2);
};

/**
 * Interpret correlation strength
 */
const interpretCorrelation = (r: number): string => {
  const absR = Math.abs(r);
  const sign = r >= 0 ? 'positive' : 'negative';

  if (absR === 1.0) return `perfect ${sign}`;
  if (absR >= 0.9) return `very strong ${sign}`;
  if (absR >= 0.7) return `strong ${sign}`;
  if (absR >= 0.5) return `moderate ${sign}`;
  if (absR >= 0.3) return `weak ${sign}`;
  return 'negligible';
};

/**
 * Correlation Executor
 */
export const correlationExecutor: ToolExecutor = async (params) => {
  const { x, y, method = 'pearson' } = params;

  if (!Array.isArray(x) || !Array.isArray(y)) {
    return {
      success: false,
      error: 'x and y must be arrays',
    };
  }

  if (x.length !== y.length) {
    return {
      success: false,
      error: 'x and y must have the same length',
    };
  }

  if (x.length < 2) {
    return {
      success: false,
      error: 'At least 2 data points required',
    };
  }

  // Filter out non-numeric values
  const pairs = x
    .map((xi, i) => ({ x: xi, y: y[i] }))
    .filter(pair => typeof pair.x === 'number' && typeof pair.y === 'number' && !isNaN(pair.x) && !isNaN(pair.y));

  if (pairs.length < 2) {
    return {
      success: false,
      error: 'At least 2 valid numeric pairs required',
    };
  }

  const cleanX = pairs.map(p => p.x);
  const cleanY = pairs.map(p => p.y);

  try {
    let coefficient: number;

    switch (method) {
      case 'pearson':
        coefficient = pearsonCorrelation(cleanX, cleanY);
        break;
      case 'spearman':
        coefficient = spearmanCorrelation(cleanX, cleanY);
        break;
      case 'kendall':
        coefficient = kendallCorrelation(cleanX, cleanY);
        break;
      default:
        return {
          success: false,
          error: `Unknown method: ${method}`,
        };
    }

    return {
      success: true,
      method,
      coefficient: Math.round(coefficient * 10000) / 10000,
      strength: interpretCorrelation(coefficient),
      n: cleanX.length,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
};
