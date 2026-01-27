/**
 * Funnel Analyzer Tool
 * Analyze conversion funnels and identify drop-off points
 */

import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * Funnel Analyzer Tool Definition
 */
export const funnelAnalyzerTool: Tool = {
  id: 'funnel_analyzer',
  name: 'Funnel Analyzer',
  description: 'Analyze conversion funnels: calculate conversion rates, identify bottlenecks, compare segments',
  parameters: [
    {
      name: 'action',
      type: 'string',
      description: 'Analysis action',
      required: true,
      enum: ['conversion', 'dropoff', 'compare', 'optimize'],
    },
    {
      name: 'steps',
      type: 'array',
      description: 'Funnel steps with names and user counts',
      required: true,
    },
    {
      name: 'options',
      type: 'object',
      description: 'Analysis options (segments, benchmarks, etc.)',
      required: false,
    },
  ],
  returns: {
    type: 'object',
    description: 'Funnel analysis results',
  },
  examples: [
    {
      input: {
        action: 'conversion',
        steps: [
          { name: 'Landing Page', users: 10000 },
          { name: 'Sign Up', users: 5000 },
          { name: 'Onboarding', users: 3000 },
          { name: 'Purchase', users: 1000 },
        ],
      },
      output: {
        success: true,
        overallConversion: 10,
        steps: [
          { name: 'Landing Page', users: 10000, conversionRate: 100 },
          { name: 'Sign Up', users: 5000, conversionRate: 50 },
          { name: 'Onboarding', users: 3000, conversionRate: 30 },
          { name: 'Purchase', users: 1000, conversionRate: 10 },
        ],
      },
    },
  ],
};

/**
 * Calculate conversion rates
 */
const calculateConversion = (steps: any[]) => {
  if (steps.length === 0) {
    return { steps: [], overallConversion: 0 };
  }

  const initialUsers = steps[0].users || 0;

  const analyzed = steps.map((step, index) => {
    const users = step.users || 0;
    const conversionRate = initialUsers > 0 ? Math.round((users / initialUsers) * 10000) / 100 : 0;

    const stepConversionRate = index > 0
      ? Math.round((users / (steps[index - 1].users || 1)) * 10000) / 100
      : 100;

    return {
      name: step.name,
      users,
      conversionRate,
      stepConversionRate,
    };
  });

  const finalUsers = steps[steps.length - 1].users || 0;
  const overallConversion = initialUsers > 0 ? Math.round((finalUsers / initialUsers) * 10000) / 100 : 0;

  return {
    steps: analyzed,
    overallConversion,
    totalSteps: steps.length,
    initialUsers,
    finalUsers,
  };
};

/**
 * Identify drop-off points
 */
const identifyDropoff = (steps: any[]) => {
  const dropoffs = [];

  for (let i = 1; i < steps.length; i++) {
    const previousUsers = steps[i - 1].users || 0;
    const currentUsers = steps[i].users || 0;

    const dropped = previousUsers - currentUsers;
    const dropoffRate = previousUsers > 0 ? Math.round((dropped / previousUsers) * 10000) / 100 : 0;

    dropoffs.push({
      from: steps[i - 1].name,
      to: steps[i].name,
      usersDropped: dropped,
      dropoffRate,
      severity: dropoffRate > 70 ? 'critical' : dropoffRate > 50 ? 'high' : dropoffRate > 30 ? 'moderate' : 'low',
    });
  }

  // Sort by drop-off rate
  dropoffs.sort((a, b) => b.dropoffRate - a.dropoffRate);

  return {
    dropoffs,
    criticalSteps: dropoffs.filter(d => d.severity === 'critical' || d.severity === 'high'),
  };
};

/**
 * Compare funnel segments
 */
const compareSegments = (steps: any[], options: any = {}) => {
  const segments = options.segments || [];

  if (segments.length === 0) {
    return {
      error: 'No segments provided for comparison',
    };
  }

  const comparisons = segments.map((segment: any) => {
    const segmentSteps = segment.steps || [];
    const { overallConversion, steps: analyzed } = calculateConversion(segmentSteps);

    return {
      segment: segment.name,
      overallConversion,
      steps: analyzed,
    };
  });

  // Calculate best and worst segments
  const sorted = [...comparisons].sort((a, b) => b.overallConversion - a.overallConversion);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  return {
    comparisons,
    best: { segment: best.segment, conversion: best.overallConversion },
    worst: { segment: worst.segment, conversion: worst.overallConversion },
    spread: best.overallConversion - worst.overallConversion,
  };
};

/**
 * Optimize funnel recommendations
 */
const optimizeFunnel = (steps: any[], options: any = {}) => {
  const { dropoffs, criticalSteps } = identifyDropoff(steps);
  const { overallConversion } = calculateConversion(steps);

  const recommendations: any[] = [];

  // Recommend fixing critical drop-offs
  for (const critical of criticalSteps) {
    recommendations.push({
      priority: 'high',
      step: critical.to,
      issue: `${critical.dropoffRate}% drop-off from ${critical.from}`,
      recommendation: `Focus on improving transition from "${critical.from}" to "${critical.to}"`,
      potentialImpact: `Could increase overall conversion by up to ${Math.round(critical.dropoffRate / 2)}%`,
    });
  }

  // Benchmark comparison
  const benchmark = options.benchmark || 20;
  if (overallConversion < benchmark) {
    recommendations.push({
      priority: 'medium',
      step: 'Overall',
      issue: `Overall conversion (${overallConversion}%) below benchmark (${benchmark}%)`,
      recommendation: 'Review entire funnel for optimization opportunities',
      potentialImpact: `Reaching benchmark would increase conversions by ${Math.round(((benchmark / overallConversion) - 1) * 100)}%`,
    });
  }

  return {
    currentConversion: overallConversion,
    benchmark,
    recommendations,
    totalRecommendations: recommendations.length,
  };
};

/**
 * Funnel Analyzer Executor
 */
export const funnelAnalyzerExecutor: ToolExecutor = async (params) => {
  const { action, steps, options = {} } = params;

  if (!Array.isArray(steps) || steps.length < 2) {
    return {
      success: false,
      error: 'steps must be an array with at least 2 steps',
    };
  }

  try {
    let result: any;

    switch (action) {
      case 'conversion':
        result = calculateConversion(steps);
        break;

      case 'dropoff':
        result = identifyDropoff(steps);
        break;

      case 'compare':
        result = compareSegments(steps, options);
        break;

      case 'optimize':
        result = optimizeFunnel(steps, options);
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
      ...result,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
};
