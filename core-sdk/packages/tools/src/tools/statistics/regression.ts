/**
 * Regression Analysis Tool
 * Perform linear and multiple regression analysis
 */

import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * Regression Analysis Tool Definition
 */
export const regressionTool: Tool = {
  id: 'regression',
  name: 'Regression Analysis',
  description: 'Perform linear regression and calculate predictions, R-squared, coefficients',
  parameters: [
    {
      name: 'x',
      type: 'array',
      description: 'Independent variable(s) - single array for simple regression, array of arrays for multiple regression',
      required: true,
    },
    {
      name: 'y',
      type: 'array',
      description: 'Dependent variable (array of numbers)',
      required: true,
    },
    {
      name: 'predict',
      type: 'array',
      description: 'Values to predict (optional)',
      required: false,
    },
  ],
  returns: {
    type: 'object',
    description: 'Regression results with coefficients, R-squared, and predictions',
  },
  examples: [
    {
      input: {
        x: [1, 2, 3, 4, 5],
        y: [2, 4, 6, 8, 10],
      },
      output: {
        success: true,
        type: 'simple',
        intercept: 0,
        slope: 2,
        rSquared: 1.0,
        equation: 'y = 0 + 2x',
      },
    },
  ],
};

/**
 * Simple linear regression (one independent variable)
 */
const simpleLinearRegression = (x: number[], y: number[]) => {
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R-squared
  const yMean = sumY / n;
  const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
  const ssResidual = y.reduce((sum, yi, i) => sum + Math.pow(yi - (intercept + slope * x[i]), 2), 0);
  const rSquared = 1 - ssResidual / ssTotal;

  return { intercept, slope, rSquared };
};

/**
 * Multiple linear regression (multiple independent variables)
 * Using normal equation: β = (X^T X)^-1 X^T y
 */
const multipleLinearRegression = (X: number[][], y: number[]) => {
  const n = X.length;
  const m = X[0].length;

  // Add intercept column (all 1s)
  const XWithIntercept = X.map(row => [1, ...row]);

  // Calculate X^T X
  const XTX = Array(m + 1)
    .fill(0)
    .map(() => Array(m + 1).fill(0));

  for (let i = 0; i < m + 1; i++) {
    for (let j = 0; j < m + 1; j++) {
      for (let k = 0; k < n; k++) {
        XTX[i][j] += XWithIntercept[k][i] * XWithIntercept[k][j];
      }
    }
  }

  // Calculate X^T y
  const XTy = Array(m + 1).fill(0);
  for (let i = 0; i < m + 1; i++) {
    for (let k = 0; k < n; k++) {
      XTy[i] += XWithIntercept[k][i] * y[k];
    }
  }

  // Solve using Gaussian elimination (simplified for small matrices)
  const coefficients = gaussianElimination(XTX, XTy);

  // Calculate R-squared
  const yMean = y.reduce((a, b) => a + b, 0) / n;
  let ssTotal = 0;
  let ssResidual = 0;

  for (let i = 0; i < n; i++) {
    const predicted = coefficients[0] + X[i].reduce((sum, xi, j) => sum + xi * coefficients[j + 1], 0);
    ssTotal += Math.pow(y[i] - yMean, 2);
    ssResidual += Math.pow(y[i] - predicted, 2);
  }

  const rSquared = 1 - ssResidual / ssTotal;

  return {
    intercept: coefficients[0],
    coefficients: coefficients.slice(1),
    rSquared,
  };
};

/**
 * Gaussian elimination to solve linear system
 */
const gaussianElimination = (A: number[][], b: number[]): number[] => {
  const n = A.length;
  const augmented = A.map((row, i) => [...row, b[i]]);

  // Forward elimination
  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = k;
      }
    }

    // Swap rows
    [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

    // Make all rows below this one 0 in current column
    for (let k = i + 1; k < n; k++) {
      const factor = augmented[k][i] / augmented[i][i];
      for (let j = i; j < n + 1; j++) {
        augmented[k][j] -= factor * augmented[i][j];
      }
    }
  }

  // Back substitution
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = augmented[i][n];
    for (let j = i + 1; j < n; j++) {
      x[i] -= augmented[i][j] * x[j];
    }
    x[i] /= augmented[i][i];
  }

  return x;
};

/**
 * Regression Executor
 */
export const regressionExecutor: ToolExecutor = async (params) => {
  const { x, y, predict } = params;

  if (!Array.isArray(x) || !Array.isArray(y)) {
    return {
      success: false,
      error: 'x and y must be arrays',
    };
  }

  try {
    // Determine if simple or multiple regression
    const isMultiple = Array.isArray(x[0]);

    if (!isMultiple) {
      // Simple linear regression
      if (x.length !== y.length) {
        return {
          success: false,
          error: 'x and y must have the same length',
        };
      }

      const { intercept, slope, rSquared } = simpleLinearRegression(x as number[], y);

      const result: any = {
        success: true,
        type: 'simple',
        intercept: Math.round(intercept * 10000) / 10000,
        slope: Math.round(slope * 10000) / 10000,
        rSquared: Math.round(rSquared * 10000) / 10000,
        equation: `y = ${Math.round(intercept * 100) / 100} + ${Math.round(slope * 100) / 100}x`,
        n: x.length,
      };

      if (predict) {
        result.predictions = (Array.isArray(predict) ? predict : [predict]).map(
          (xi: number) => Math.round((intercept + slope * xi) * 10000) / 10000
        );
      }

      return result;
    } else {
      // Multiple linear regression
      const X = x as number[][];

      if (X.length !== y.length) {
        return {
          success: false,
          error: 'X and y must have the same number of rows',
        };
      }

      const { intercept, coefficients, rSquared } = multipleLinearRegression(X, y);

      const result: any = {
        success: true,
        type: 'multiple',
        intercept: Math.round(intercept * 10000) / 10000,
        coefficients: coefficients.map(c => Math.round(c * 10000) / 10000),
        rSquared: Math.round(rSquared * 10000) / 10000,
        n: X.length,
        features: X[0].length,
      };

      if (predict) {
        result.predictions = (Array.isArray(predict[0]) ? predict : [predict]).map(
          (row: number[]) =>
            Math.round(
              (intercept + row.reduce((sum, xi, i) => sum + xi * coefficients[i], 0)) * 10000
            ) / 10000
        );
      }

      return result;
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
};
