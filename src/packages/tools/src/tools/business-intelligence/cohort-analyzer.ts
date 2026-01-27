/**
 * Cohort Analyzer Tool
 * Analyze user cohorts and retention patterns
 */

import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * Cohort Analyzer Tool Definition
 */
export const cohortAnalyzerTool: Tool = {
  id: 'cohort_analyzer',
  name: 'Cohort Analyzer',
  description: 'Analyze user cohorts, retention rates, lifecycle patterns, and segment performance',
  parameters: [
    {
      name: 'action',
      type: 'string',
      description: 'Analysis action',
      required: true,
      enum: ['retention', 'revenue', 'activity', 'lifecycle'],
    },
    {
      name: 'cohorts',
      type: 'array',
      description: 'Array of cohort data with period and metrics',
      required: true,
    },
    {
      name: 'options',
      type: 'object',
      description: 'Analysis options (periods, metric, etc.)',
      required: false,
    },
  ],
  returns: {
    type: 'object',
    description: 'Cohort analysis results',
  },
  examples: [
    {
      input: {
        action: 'retention',
        cohorts: [
          { cohort: '2024-01', period0: 1000, period1: 600, period2: 400, period3: 300 },
          { cohort: '2024-02', period0: 1200, period1: 720, period2: 480 },
        ],
      },
      output: {
        success: true,
        action: 'retention',
        analysis: [
          { cohort: '2024-01', retention: [100, 60, 40, 30] },
          { cohort: '2024-02', retention: [100, 60, 40] },
        ],
      },
    },
  ],
};

/**
 * Calculate retention rates
 */
const calculateRetention = (cohorts: any[]) => {
  return cohorts.map(cohort => {
    const cohortName = cohort.cohort || cohort.name;
    const periods = Object.keys(cohort).filter(key => key.startsWith('period'));

    const retention = periods.map(period => {
      const value = cohort[period];
      const baseValue = cohort.period0 || cohort[periods[0]];
      return Math.round((value / baseValue) * 10000) / 100;
    });

    // Calculate average retention (excluding period0)
    const avgRetention = retention.length > 1
      ? Math.round((retention.slice(1).reduce((a, b) => a + b, 0) / (retention.length - 1)) * 100) / 100
      : 0;

    return {
      cohort: cohortName,
      retention,
      avgRetention,
      dropoffRate: retention.length > 1 ? 100 - retention[retention.length - 1] : 0,
    };
  });
};

/**
 * Analyze revenue by cohort
 */
const analyzeRevenue = (cohorts: any[]) => {
  return cohorts.map(cohort => {
    const cohortName = cohort.cohort || cohort.name;
    const periods = Object.keys(cohort).filter(key => key.startsWith('period') || key.startsWith('revenue'));

    const revenue = periods.map(period => cohort[period]);
    const totalRevenue = revenue.reduce((a, b) => a + b, 0);
    const avgRevenue = totalRevenue / revenue.length;
    const users = cohort.users || cohort.period0 || 1;
    const arpu = totalRevenue / users;

    return {
      cohort: cohortName,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      avgRevenue: Math.round(avgRevenue * 100) / 100,
      arpu: Math.round(arpu * 100) / 100,
      revenue,
    };
  });
};

/**
 * Analyze activity patterns
 */
const analyzeActivity = (cohorts: any[]) => {
  return cohorts.map(cohort => {
    const cohortName = cohort.cohort || cohort.name;
    const periods = Object.keys(cohort).filter(key => key.startsWith('period') || key.startsWith('activity'));

    const activity = periods.map(period => cohort[period]);
    const avgActivity = activity.reduce((a, b) => a + b, 0) / activity.length;

    // Trend analysis
    const firstHalf = activity.slice(0, Math.floor(activity.length / 2));
    const secondHalf = activity.slice(Math.floor(activity.length / 2));

    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const trend = avgSecond > avgFirst ? 'increasing' : avgSecond < avgFirst ? 'decreasing' : 'stable';

    return {
      cohort: cohortName,
      avgActivity: Math.round(avgActivity * 100) / 100,
      trend,
      activity,
    };
  });
};

/**
 * Analyze lifecycle stages
 */
const analyzeLifecycle = (cohorts: any[], options: any = {}) => {
  const stages = options.stages || ['new', 'active', 'retained', 'churned'];

  return cohorts.map(cohort => {
    const cohortName = cohort.cohort || cohort.name;

    const stageDistribution: any = {};
    let total = 0;

    for (const stage of stages) {
      const value = cohort[stage] || 0;
      stageDistribution[stage] = value;
      total += value;
    }

    const stagePercentages: any = {};
    for (const stage of stages) {
      stagePercentages[stage] = total > 0 ? Math.round((stageDistribution[stage] / total) * 10000) / 100 : 0;
    }

    return {
      cohort: cohortName,
      total,
      distribution: stageDistribution,
      percentages: stagePercentages,
    };
  });
};

/**
 * Cohort Analyzer Executor
 */
export const cohortAnalyzerExecutor: ToolExecutor = async (params) => {
  const { action, cohorts, options = {} } = params;

  if (!Array.isArray(cohorts) || cohorts.length === 0) {
    return {
      success: false,
      error: 'cohorts must be a non-empty array',
    };
  }

  try {
    let analysis: any;

    switch (action) {
      case 'retention':
        analysis = calculateRetention(cohorts);
        break;

      case 'revenue':
        analysis = analyzeRevenue(cohorts);
        break;

      case 'activity':
        analysis = analyzeActivity(cohorts);
        break;

      case 'lifecycle':
        analysis = analyzeLifecycle(cohorts, options);
        break;

      default:
        return {
          success: false,
          error: `Unknown action: ${action}`,
        };
    }

    return {
      success: true,
      action,
      cohortCount: cohorts.length,
      analysis,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
};
