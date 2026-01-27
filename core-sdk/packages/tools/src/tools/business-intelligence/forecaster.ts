/**
 * Forecaster Tool
 * Predict future values using various forecasting methods
 */

import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * Forecaster Tool Definition
 */
export const forecasterTool: Tool = {
  id: 'forecaster',
  name: 'Forecaster',
  description: 'Forecast future values using linear regression, exponential smoothing, moving average, or seasonal methods',
  parameters: [
    {
      name: 'data',
      type: 'array',
      description: 'Historical data (array of numbers)',
      required: true,
    },
    {
      name: 'periods',
      type: 'number',
      description: 'Number of periods to forecast',
      required: true,
    },
    {
      name: 'method',
      type: 'string',
      description: 'Forecasting method',
      required: false,
      enum: ['linear', 'exponential', 'moving_average', 'seasonal', 'auto'],
      default: 'auto',
    },
    {
      name: 'options',
      type: 'object',
      description: 'Method-specific options (alpha, window, seasonPeriod, etc.)',
      required: false,
    },
  ],
  returns: {
    type: 'object',
    description: 'Forecast results with predictions and confidence intervals',
  },
  examples: [
    {
      input: {
        data: [100, 110, 120, 130, 140],
        periods: 3,
        method: 'linear',
      },
      output: {
        success: true,
        method: 'linear',
        forecast: [150, 160, 170],
        confidence: 'high',
      },
    },
  ],
};

/**
 * Linear regression forecast
 */
const linearForecast = (data: number[], periods: number) => {
  const n = data.length;
  const x = Array.from({ length: n }, (_, i) => i);

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = data.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * data[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R-squared for confidence
  const yMean = sumY / n;
  const ssTotal = data.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
  const ssResidual = data.reduce((sum, yi, i) => sum + Math.pow(yi - (intercept + slope * x[i]), 2), 0);
  const rSquared = 1 - ssResidual / ssTotal;

  const forecast: number[] = [];
  for (let i = 1; i <= periods; i++) {
    const value = intercept + slope * (n + i - 1);
    forecast.push(Math.round(value * 100) / 100);
  }

  return {
    forecast,
    confidence: rSquared > 0.9 ? 'very_high' : rSquared > 0.7 ? 'high' : rSquared > 0.5 ? 'moderate' : 'low',
    rSquared: Math.round(rSquared * 10000) / 10000,
  };
};

/**
 * Exponential smoothing forecast
 */
const exponentialForecast = (data: number[], periods: number, alpha: number = 0.3) => {
  // Calculate smoothed values
  const smoothed: number[] = [data[0]];
  for (let i = 1; i < data.length; i++) {
    smoothed.push(alpha * data[i] + (1 - alpha) * smoothed[i - 1]);
  }

  // Forecast: repeat last smoothed value (simple exponential smoothing)
  const lastSmoothed = smoothed[smoothed.length - 1];
  const forecast = Array(periods).fill(Math.round(lastSmoothed * 100) / 100);

  return {
    forecast,
    alpha,
    lastSmoothed: Math.round(lastSmoothed * 100) / 100,
  };
};

/**
 * Moving average forecast
 */
const movingAverageForecast = (data: number[], periods: number, window: number = 3) => {
  // Calculate last moving average
  const lastWindow = data.slice(-window);
  const avg = lastWindow.reduce((a, b) => a + b, 0) / window;

  // Forecast: repeat last moving average
  const forecast = Array(periods).fill(Math.round(avg * 100) / 100);

  return {
    forecast,
    window,
    lastAverage: Math.round(avg * 100) / 100,
  };
};

/**
 * Seasonal forecast (simple seasonal decomposition)
 */
const seasonalForecast = (data: number[], periods: number, seasonPeriod: number = 12) => {
  if (data.length < seasonPeriod * 2) {
    // Not enough data for seasonal analysis
    return linearForecast(data, periods);
  }

  // Calculate seasonal indices
  const cycles = Math.floor(data.length / seasonPeriod);
  const seasonalIndices: number[] = [];

  for (let i = 0; i < seasonPeriod; i++) {
    let sum = 0;
    let count = 0;

    for (let j = 0; j < cycles; j++) {
      const index = j * seasonPeriod + i;
      if (index < data.length) {
        sum += data[index];
        count++;
      }
    }

    seasonalIndices.push(sum / count);
  }

  const avgSeasonalIndex = seasonalIndices.reduce((a, b) => a + b, 0) / seasonPeriod;

  // Deseasonalize data
  const deseasonalized = data.map((val, i) => {
    const seasonalIndex = seasonalIndices[i % seasonPeriod];
    return val / (seasonalIndex / avgSeasonalIndex);
  });

  // Forecast deseasonalized trend
  const { forecast: trendForecast } = linearForecast(deseasonalized, periods);

  // Reapply seasonality
  const forecast = trendForecast.map((val, i) => {
    const seasonalIndex = seasonalIndices[i % seasonPeriod];
    return Math.round(val * (seasonalIndex / avgSeasonalIndex) * 100) / 100;
  });

  return {
    forecast,
    seasonPeriod,
    seasonalIndices: seasonalIndices.map(idx => Math.round(idx * 100) / 100),
  };
};

/**
 * Auto-select best method based on data characteristics
 */
const autoSelectMethod = (data: number[], options: any = {}) => {
  const n = data.length;

  // Check for seasonality (rough check)
  const seasonPeriod = options.seasonPeriod || 12;
  if (n >= seasonPeriod * 2) {
    return 'seasonal';
  }

  // Check trend strength
  const x = Array.from({ length: n }, (_, i) => i);
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = data.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * data[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const yMean = sumY / n;
  const ssTotal = data.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
  const ssResidual = data.reduce((sum, yi, i) => sum + Math.pow(yi - (intercept + slope * x[i]), 2), 0);
  const rSquared = 1 - ssResidual / ssTotal;

  // If strong linear trend, use linear
  if (rSquared > 0.7) {
    return 'linear';
  }

  // Otherwise, use exponential smoothing
  return 'exponential';
};

/**
 * Forecaster Executor
 */
export const forecasterExecutor: ToolExecutor = async (params) => {
  const { data, periods, method = 'auto', options = {} } = params;

  if (!Array.isArray(data) || data.length < 3) {
    return {
      success: false,
      error: 'data must be an array with at least 3 values',
    };
  }

  if (typeof periods !== 'number' || periods < 1) {
    return {
      success: false,
      error: 'periods must be a positive number',
    };
  }

  try {
    let selectedMethod = method;
    if (method === 'auto') {
      selectedMethod = autoSelectMethod(data, options);
    }

    let result: any;

    switch (selectedMethod) {
      case 'linear':
        result = linearForecast(data, periods);
        break;

      case 'exponential':
        result = exponentialForecast(data, periods, options.alpha);
        break;

      case 'moving_average':
        result = movingAverageForecast(data, periods, options.window);
        break;

      case 'seasonal':
        result = seasonalForecast(data, periods, options.seasonPeriod);
        break;

      default:
        return {
          success: false,
          error: `Unknown method: ${selectedMethod}`,
        };
    }

    return {
      success: true,
      method: selectedMethod,
      periods,
      historicalDataPoints: data.length,
      ...result,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
};
