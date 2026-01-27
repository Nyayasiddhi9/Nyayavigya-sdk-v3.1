/**
 * KPI Tracker Tool
 * Track and monitor key performance indicators with targets and thresholds
 */

import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * KPI Tracker Tool Definition
 */
export const kpiTrackerTool: Tool = {
  id: 'kpi_tracker',
  name: 'KPI Tracker',
  description: 'Track and monitor KPIs with targets, thresholds, alerts, and performance scoring',
  parameters: [
    {
      name: 'action',
      type: 'string',
      description: 'Action to perform',
      required: true,
      enum: ['track', 'compare', 'score', 'alert'],
    },
    {
      name: 'kpis',
      type: 'array',
      description: 'Array of KPI objects with name, value, target, threshold',
      required: true,
    },
    {
      name: 'options',
      type: 'object',
      description: 'Additional options (period, alertThreshold, etc.)',
      required: false,
    },
  ],
  returns: {
    type: 'object',
    description: 'KPI tracking results with performance metrics',
  },
  examples: [
    {
      input: {
        action: 'track',
        kpis: [
          { name: 'Revenue', value: 150000, target: 200000, unit: 'USD' },
          { name: 'Users', value: 5000, target: 4000, unit: 'count' },
        ],
      },
      output: {
        success: true,
        kpis: [
          { name: 'Revenue', value: 150000, target: 200000, achievement: 75, status: 'below_target' },
          { name: 'Users', value: 5000, target: 4000, achievement: 125, status: 'above_target' },
        ],
      },
    },
  ],
};

/**
 * Calculate KPI achievement percentage
 */
const calculateAchievement = (value: number, target: number): number => {
  if (target === 0) return 100;
  return Math.round((value / target) * 10000) / 100;
};

/**
 * Determine KPI status
 */
const getKPIStatus = (achievement: number, threshold: number = 90): string => {
  if (achievement >= 100) return 'above_target';
  if (achievement >= threshold) return 'on_target';
  if (achievement >= threshold * 0.8) return 'below_target';
  return 'critical';
};

/**
 * Track KPIs
 */
const trackKPIs = (kpis: any[], options: any = {}) => {
  const threshold = options.threshold || 90;

  return kpis.map(kpi => {
    const achievement = calculateAchievement(kpi.value, kpi.target);
    const status = getKPIStatus(achievement, threshold);
    const variance = kpi.value - kpi.target;
    
    // Guard against zero target for variancePercent
    const variancePercent = kpi.target !== 0
      ? Math.round(((kpi.value - kpi.target) / kpi.target) * 10000) / 100
      : 0;

    return {
      name: kpi.name,
      value: kpi.value,
      target: kpi.target,
      unit: kpi.unit || 'number',
      achievement,
      status,
      variance,
      variancePercent,
    };
  });
};

/**
 * Compare KPIs across periods
 */
const compareKPIs = (kpis: any[], options: any = {}) => {
  return kpis.map(kpi => {
    const current = kpi.current || kpi.value;
    const previous = kpi.previous || kpi.baseline;

    if (previous === undefined || previous === 0) {
      return {
        name: kpi.name,
        current,
        previous,
        change: 0,
        changePercent: 0,
        trend: 'stable',
      };
    }

    const change = current - previous;
    const changePercent = Math.round((change / previous) * 10000) / 100;
    const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';

    return {
      name: kpi.name,
      current,
      previous,
      change,
      changePercent,
      trend,
      direction: kpi.higherIsBetter ? (change > 0 ? 'positive' : 'negative') : (change < 0 ? 'positive' : 'negative'),
    };
  });
};

/**
 * Score KPIs (overall performance score)
 */
const scoreKPIs = (kpis: any[], options: any = {}) => {
  const tracked = trackKPIs(kpis, options);

  // Calculate weighted score
  const totalWeight = kpis.reduce((sum, kpi) => sum + (kpi.weight || 1), 0);
  const weightedScore = tracked.reduce((sum, kpi, idx) => {
    const weight = kpis[idx].weight || 1;
    return sum + (kpi.achievement * weight);
  }, 0);

  const overallScore = Math.round(weightedScore / totalWeight);

  // Count by status
  const statusCount = tracked.reduce((acc: any, kpi) => {
    acc[kpi.status] = (acc[kpi.status] || 0) + 1;
    return acc;
  }, {});

  return {
    overallScore,
    totalKPIs: kpis.length,
    statusCount,
    grade: overallScore >= 90 ? 'A' : overallScore >= 80 ? 'B' : overallScore >= 70 ? 'C' : overallScore >= 60 ? 'D' : 'F',
    kpis: tracked,
  };
};

/**
 * Generate KPI alerts
 */
const generateAlerts = (kpis: any[], options: any = {}) => {
  const alertThreshold = options.alertThreshold || 80;
  const tracked = trackKPIs(kpis, options);

  const alerts = tracked
    .filter(kpi => kpi.achievement < alertThreshold || kpi.status === 'critical')
    .map(kpi => ({
      kpi: kpi.name,
      severity: kpi.status === 'critical' ? 'high' : 'medium',
      message: `${kpi.name} is ${kpi.status.replace('_', ' ')} (${kpi.achievement}% of target)`,
      value: kpi.value,
      target: kpi.target,
      achievement: kpi.achievement,
    }));

  return {
    alertCount: alerts.length,
    alerts,
  };
};

/**
 * KPI Tracker Executor
 */
export const kpiTrackerExecutor: ToolExecutor = async (params) => {
  const { action, kpis, options = {} } = params;

  if (!Array.isArray(kpis) || kpis.length === 0) {
    return {
      success: false,
      error: 'kpis must be a non-empty array',
    };
  }

  try {
    switch (action) {
      case 'track': {
        const results = trackKPIs(kpis, options);
        return {
          success: true,
          action: 'track',
          kpis: results,
        };
      }

      case 'compare': {
        const results = compareKPIs(kpis, options);
        return {
          success: true,
          action: 'compare',
          comparisons: results,
        };
      }

      case 'score': {
        const results = scoreKPIs(kpis, options);
        return {
          success: true,
          action: 'score',
          ...results,
        };
      }

      case 'alert': {
        const results = generateAlerts(kpis, options);
        return {
          success: true,
          action: 'alert',
          ...results,
        };
      }

      default:
        return {
          success: false,
          error: `Unknown action: ${action}`,
        };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
};
