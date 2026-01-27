/**
 * Time Series Analysis Tool
 * Analyze time series data for trends, seasonality, and forecasting
 */

import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * Time Series Analysis Tool Definition
 */
export const timeSeriesTool: Tool = {
  id: 'time_series',
  name: 'Time Series Analysis',
  description: 'Analyze time series data: trend detection, moving averages, exponential smoothing, seasonality',
  parameters: [
    {
      name: 'data',
      type: 'array',
      description: 'Time series data (array of numbers)',
      required: true,
    },
    {
      name: 'analysis',
      type: 'string',
      description: 'Type of analysis',
      required: false,
      enum: ['trend', 'moving_average', 'exponential_smoothing', 'seasonality', 'forecast'],
      default: 'trend',
    },
    {
      name: 'options',
      type: 'object',
      description: 'Analysis options (window size, alpha, periods, etc.)',
      required: false,
    },
  ],
  returns: {
    type: 'object',
    description: 'Time series analysis results',
  },
  examples: [
    {
      input: {
        data: [10, 12, 15, 14, 18, 20, 22],
        analysis: 'trend',
      },
      output: {
        success: true,
        analysis: 'trend',
        direction: 'upward',
        slope: 2.0,
      },
    },
  ],
};

/**
 * Calculate linear trend
 */
const calculateTrend = (data: number[]) => {
  const n = data.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = data;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const direction = slope > 0.1 ? 'upward' : slope < -0.1 ? 'downward' : 'stable';

  return {
    slope: Math.round(slope * 10000) / 10000,
    intercept: Math.round(intercept * 10000) / 10000,
    direction,
    equation: `y = ${Math.round(intercept * 100) / 100} + ${Math.round(slope * 100) / 100}t`,
  };
};

/**
 * Calculate moving average
 */
const movingAverage = (data: number[], window: number) => {
  const result: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < window - 1) {
      result.push(NaN); // Not enough data yet
    } else {
      const slice = data.slice(i - window + 1, i + 1);
      const avg = slice.reduce((a, b) => a + b, 0) / window;
      result.push(Math.round(avg * 10000) / 10000);
    }
  }

  return result;
};

/**
 * Exponential smoothing
 */
const exponentialSmoothing = (data: number[], alpha: number) => {
  const smoothed: number[] = [data[0]];

  for (let i = 1; i < data.length; i++) {
    const value = alpha * data[i] + (1 - alpha) * smoothed[i - 1];
    smoothed.push(Math.round(value * 10000) / 10000);
  }

  return smoothed;
};

/**
 * Detect seasonality using autocorrelation
 */
const detectSeasonality = (data: number[], maxLag: number = 12) => {
  const n = data.length;
  const mean = data.reduce((a, b) => a + b, 0) / n;

  const autocorrelations: number[] = [];

  for (let lag = 1; lag <= Math.min(maxLag, Math.floor(n / 2)); lag++) {
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n - lag; i++) {
      numerator += (data[i] - mean) * (data[i + lag] - mean);
    }

    for (let i = 0; i < n; i++) {
      denominator += Math.pow(data[i] - mean, 2);
    }

    autocorrelations.push(numerator / denominator);
  }

  // Find peaks in autocorrelation
  const peaks: number[] = [];
  for (let i = 1; i < autocorrelations.length - 1; i++) {
    if (autocorrelations[i] > autocorrelations[i - 1] && autocorrelations[i] > autocorrelations[i + 1]) {
      if (autocorrelations[i] > 0.3) {
        // Threshold for significant peak
        peaks.push(i + 1);
      }
    }
  }

  return {
    detected: peaks.length > 0,
    periods: peaks,
    autocorrelations: autocorrelations.map(ac => Math.round(ac * 10000) / 10000),
  };
};

/**
 * Simple forecast using trend and moving average
 */
const forecast = (data: number[], periods: number, method: string = 'trend') => {
  if (method === 'trend') {
    const { slope, intercept } = calculateTrend(data);
    const n = data.length;

    const predictions: number[] = [];
    for (let i = 1; i <= periods; i++) {
      const value = intercept + slope * (n + i - 1);
      predictions.push(Math.round(value * 10000) / 10000);
    }

    return predictions;
  } else if (method === 'exponential') {
    const alpha = 0.3; // Default smoothing factor
    const smoothed = exponentialSmoothing(data, alpha);
    const lastValue = smoothed[smoothed.length - 1];

    // Simple forecast: repeat last smoothed value
    return Array(periods).fill(Math.round(lastValue * 10000) / 10000);
  }

  return [];
};

/**
 * Time Series Executor
 */
export const timeSeriesExecutor: ToolExecutor = async (params) => {
  const { data, analysis = 'trend', options = {} } = params;

  if (!Array.isArray(data) || data.length < 2) {
    return {
      success: false,
      error: 'Data must be an array with at least 2 values',
    };
  }

  try {
    switch (analysis) {
      case 'trend': {
        const trendResult = calculateTrend(data);
        return {
          success: true,
          analysis: 'trend',
          ...trendResult,
          n: data.length,
        };
      }

      case 'moving_average': {
        const window = options.window || 3;
        const ma = movingAverage(data, window);
        return {
          success: true,
          analysis: 'moving_average',
          window,
          values: ma,
          n: data.length,
        };
      }

      case 'exponential_smoothing': {
        const alpha = options.alpha || 0.3;
        const smoothed = exponentialSmoothing(data, alpha);
        return {
          success: true,
          analysis: 'exponential_smoothing',
          alpha,
          values: smoothed,
          n: data.length,
        };
      }

      case 'seasonality': {
        const maxLag = options.maxLag || 12;
        const seasonality = detectSeasonality(data, maxLag);
        return {
          success: true,
          analysis: 'seasonality',
          ...seasonality,
          n: data.length,
        };
      }

      case 'forecast': {
        const periods = options.periods || 3;
        const method = options.method || 'trend';
        const predictions = forecast(data, periods, method);
        return {
          success: true,
          analysis: 'forecast',
          method,
          periods,
          predictions,
          n: data.length,
        };
      }

      default:
        return {
          success: false,
          error: `Unknown analysis type: ${analysis}`,
        };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
};
