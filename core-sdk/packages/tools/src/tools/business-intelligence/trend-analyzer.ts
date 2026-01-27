/**
 * Trend Analyzer Tool
 * Analyze trends in time series data and identify patterns
 */

import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * Trend Analyzer Tool Definition
 */
export const trendAnalyzerTool: Tool = {
  id: 'trend_analyzer',
  name: 'Trend Analyzer',
  description: 'Analyze trends in data: identify direction, strength, patterns, anomalies, inflection points',
  parameters: [
    {
      name: 'data',
      type: 'array',
      description: 'Time series data (array of values or objects with timestamp and value)',
      required: true,
    },
    {
      name: 'analysis',
      type: 'string',
      description: 'Type of analysis',
      required: false,
      enum: ['direction', 'strength', 'anomaly', 'pattern', 'full'],
      default: 'full',
    },
    {
      name: 'options',
      type: 'object',
      description: 'Analysis options (window size, sensitivity, etc.)',
      required: false,
    },
  ],
  returns: {
    type: 'object',
    description: 'Trend analysis results',
  },
  examples: [
    {
      input: {
        data: [100, 110, 105, 115, 120, 125, 130],
        analysis: 'full',
      },
      output: {
        success: true,
        direction: 'upward',
        strength: 0.95,
        pattern: 'linear_growth',
        anomalies: [],
      },
    },
  ],
};

/**
 * Detect trend direction
 */
const detectDirection = (data: number[]) => {
  const n = data.length;
  const x = Array.from({ length: n }, (_, i) => i);

  // Simple linear regression
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = data.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * data[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  const avgValue = sumY / n;
  const relativeSlope = slope / avgValue;

  let direction: string;
  if (Math.abs(relativeSlope) < 0.01) {
    direction = 'flat';
  } else if (slope > 0) {
    direction = 'upward';
  } else {
    direction = 'downward';
  }

  return {
    direction,
    slope: Math.round(slope * 10000) / 10000,
    relativeSlope: Math.round(relativeSlope * 10000) / 10000,
  };
};

/**
 * Calculate trend strength (R-squared)
 */
const calculateStrength = (data: number[]) => {
  const n = data.length;
  const x = Array.from({ length: n }, (_, i) => i);

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = data.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * data[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = data.reduce((sum, yi) => sum + yi * yi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R-squared
  const yMean = sumY / n;
  const ssTotal = data.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
  const ssResidual = data.reduce((sum, yi, i) => sum + Math.pow(yi - (intercept + slope * x[i]), 2), 0);
  const rSquared = 1 - ssResidual / ssTotal;

  return {
    strength: Math.max(0, Math.min(1, rSquared)),
    confidence: rSquared > 0.9 ? 'very_high' : rSquared > 0.7 ? 'high' : rSquared > 0.5 ? 'moderate' : 'low',
  };
};

/**
 * Detect anomalies using IQR method
 */
const detectAnomalies = (data: number[], sensitivity: number = 1.5) => {
  const sorted = [...data].sort((a, b) => a - b);
  const n = sorted.length;

  // Calculate Q1 and Q3
  const q1Index = Math.floor(n * 0.25);
  const q3Index = Math.floor(n * 0.75);
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;

  const lowerBound = q1 - sensitivity * iqr;
  const upperBound = q3 + sensitivity * iqr;

  const anomalies = data
    .map((value, index) => ({
      index,
      value,
      type: value < lowerBound ? 'low' : value > upperBound ? 'high' : null,
    }))
    .filter(item => item.type !== null);

  return {
    anomalies,
    bounds: { lower: lowerBound, upper: upperBound },
  };
};

/**
 * Identify patterns in data
 */
const identifyPattern = (data: number[]) => {
  const { direction, slope } = detectDirection(data);
  const { strength } = calculateStrength(data);

  // Calculate volatility
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  const stdDev = Math.sqrt(variance);
  const volatility = stdDev / mean;

  let pattern: string;
  if (strength > 0.8) {
    if (direction === 'upward') {
      pattern = volatility > 0.15 ? 'volatile_growth' : 'linear_growth';
    } else if (direction === 'downward') {
      pattern = volatility > 0.15 ? 'volatile_decline' : 'linear_decline';
    } else {
      pattern = 'stable';
    }
  } else if (volatility > 0.2) {
    pattern = 'highly_volatile';
  } else {
    pattern = 'irregular';
  }

  return {
    pattern,
    volatility: Math.round(volatility * 10000) / 10000,
  };
};

/**
 * Find inflection points
 */
const findInflectionPoints = (data: number[]) => {
  const inflectionPoints: any[] = [];

  for (let i = 1; i < data.length - 1; i++) {
    const prev = data[i - 1];
    const curr = data[i];
    const next = data[i + 1];

    // Local maximum
    if (curr > prev && curr > next) {
      inflectionPoints.push({
        index: i,
        value: curr,
        type: 'peak',
      });
    }

    // Local minimum
    if (curr < prev && curr < next) {
      inflectionPoints.push({
        index: i,
        value: curr,
        type: 'trough',
      });
    }
  }

  return inflectionPoints;
};

/**
 * Trend Analyzer Executor
 */
export const trendAnalyzerExecutor: ToolExecutor = async (params) => {
  const { data, analysis = 'full', options = {} } = params;

  if (!Array.isArray(data) || data.length < 3) {
    return {
      success: false,
      error: 'data must be an array with at least 3 values',
    };
  }

  // Extract values if data is array of objects
  const values = data.map(item => (typeof item === 'object' ? item.value : item));

  try {
    const result: any = {
      success: true,
      dataPoints: values.length,
    };

    if (analysis === 'direction' || analysis === 'full') {
      Object.assign(result, detectDirection(values));
    }

    if (analysis === 'strength' || analysis === 'full') {
      Object.assign(result, calculateStrength(values));
    }

    if (analysis === 'anomaly' || analysis === 'full') {
      const sensitivity = options.sensitivity || 1.5;
      Object.assign(result, detectAnomalies(values, sensitivity));
    }

    if (analysis === 'pattern' || analysis === 'full') {
      Object.assign(result, identifyPattern(values));
    }

    if (analysis === 'full') {
      result.inflectionPoints = findInflectionPoints(values);
    }

    return result;
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
};
