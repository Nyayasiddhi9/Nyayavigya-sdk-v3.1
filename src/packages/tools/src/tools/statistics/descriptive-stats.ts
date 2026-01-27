/**
 * Descriptive Statistics Tool
 * Calculate descriptive statistics (mean, median, mode, std dev, quartiles, etc.)
 */

import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * Descriptive Statistics Tool Definition
 */
export const descriptiveStatsTool: Tool = {
  id: 'descriptive_stats',
  name: 'Descriptive Statistics',
  description: 'Calculate descriptive statistics: mean, median, mode, std dev, variance, quartiles, range, skewness, kurtosis',
  parameters: [
    {
      name: 'data',
      type: 'array',
      description: 'Array of numerical values',
      required: true,
    },
    {
      name: 'metrics',
      type: 'array',
      description: 'Specific metrics to calculate (default: all)',
      required: false,
    },
  ],
  returns: {
    type: 'object',
    description: 'Descriptive statistics for the data',
  },
  examples: [
    {
      input: {
        data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      },
      output: {
        success: true,
        count: 10,
        mean: 5.5,
        median: 5.5,
        mode: null,
        stdDev: 2.872,
        variance: 8.25,
        min: 1,
        max: 10,
        range: 9,
        q1: 3.25,
        q3: 7.75,
        iqr: 4.5,
      },
    },
  ],
};

/**
 * Helper functions for statistical calculations
 */
const mean = (arr: number[]): number => {
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
};

const median = (arr: number[]): number => {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

const mode = (arr: number[]): number[] | null => {
  const freq: Record<number, number> = {};
  let maxFreq = 0;

  for (const val of arr) {
    freq[val] = (freq[val] || 0) + 1;
    maxFreq = Math.max(maxFreq, freq[val]);
  }

  if (maxFreq === 1) return null; // No mode if all values appear once

  return Object.entries(freq)
    .filter(([_, count]) => count === maxFreq)
    .map(([val, _]) => Number(val));
};

const variance = (arr: number[], isSample = true): number => {
  const m = mean(arr);
  const squaredDiffs = arr.map(val => Math.pow(val - m, 2));
  const divisor = isSample ? arr.length - 1 : arr.length;
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / divisor;
};

const stdDev = (arr: number[], isSample = true): number => {
  return Math.sqrt(variance(arr, isSample));
};

const percentile = (arr: number[], p: number): number => {
  const sorted = [...arr].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
};

const skewness = (arr: number[]): number => {
  if (arr.length < 3) return 0; // Need at least 3 values
  
  const m = mean(arr);
  const sd = stdDev(arr);
  
  // Guard against zero variance (constant data)
  if (sd === 0 || !isFinite(sd)) return 0;
  
  const n = arr.length;
  const sum = arr.reduce((acc, val) => acc + Math.pow((val - m) / sd, 3), 0);
  return (n / ((n - 1) * (n - 2))) * sum;
};

const kurtosis = (arr: number[]): number => {
  if (arr.length < 4) return 0; // Need at least 4 values
  
  const m = mean(arr);
  const sd = stdDev(arr);
  
  // Guard against zero variance (constant data)
  if (sd === 0 || !isFinite(sd)) return 0;
  
  const n = arr.length;
  const sum = arr.reduce((acc, val) => acc + Math.pow((val - m) / sd, 4), 0);
  const kurt = ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * sum;
  const correction = (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
  return kurt - correction;
};

/**
 * Descriptive Statistics Executor
 */
export const descriptiveStatsExecutor: ToolExecutor = async (params) => {
  const { data, metrics = 'all' } = params;

  if (!Array.isArray(data) || data.length === 0) {
    return {
      success: false,
      error: 'Data must be a non-empty array of numbers',
    };
  }

  // Filter out non-numeric values
  const numericData = data.filter(val => typeof val === 'number' && !isNaN(val));

  if (numericData.length === 0) {
    return {
      success: false,
      error: 'No valid numeric values in data',
    };
  }

  try {
    const sorted = [...numericData].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];

    const stats: any = {
      success: true,
      count: numericData.length,
    };

    const calcMetrics = Array.isArray(metrics) ? metrics : ['all'];
    const shouldCalc = (metric: string) => calcMetrics.includes('all') || calcMetrics.includes(metric);

    if (shouldCalc('mean')) stats.mean = Math.round(mean(numericData) * 1000) / 1000;
    if (shouldCalc('median')) stats.median = Math.round(median(numericData) * 1000) / 1000;
    if (shouldCalc('mode')) {
      const modeVals = mode(numericData);
      stats.mode = modeVals && modeVals.length === 1 ? modeVals[0] : modeVals;
    }
    if (shouldCalc('stdDev')) stats.stdDev = Math.round(stdDev(numericData) * 1000) / 1000;
    if (shouldCalc('variance')) stats.variance = Math.round(variance(numericData) * 1000) / 1000;
    if (shouldCalc('min')) stats.min = min;
    if (shouldCalc('max')) stats.max = max;
    if (shouldCalc('range')) stats.range = max - min;
    if (shouldCalc('q1')) stats.q1 = Math.round(percentile(numericData, 25) * 1000) / 1000;
    if (shouldCalc('q3')) stats.q3 = Math.round(percentile(numericData, 75) * 1000) / 1000;
    if (shouldCalc('iqr')) {
      const q1 = percentile(numericData, 25);
      const q3 = percentile(numericData, 75);
      stats.iqr = Math.round((q3 - q1) * 1000) / 1000;
    }
    if (shouldCalc('skewness')) stats.skewness = Math.round(skewness(numericData) * 1000) / 1000;
    if (shouldCalc('kurtosis')) stats.kurtosis = Math.round(kurtosis(numericData) * 1000) / 1000;

    return stats;
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
};
