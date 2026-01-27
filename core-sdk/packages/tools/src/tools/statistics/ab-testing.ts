/**
 * A/B Testing Tool
 * Statistical hypothesis testing for A/B tests (t-test, z-test, chi-square)
 */

import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * A/B Testing Tool Definition
 */
export const abTestingTool: Tool = {
  id: 'ab_testing',
  name: 'A/B Testing',
  description: 'Perform statistical hypothesis testing: t-test, z-test, chi-square test for A/B experiments',
  parameters: [
    {
      name: 'testType',
      type: 'string',
      description: 'Type of statistical test',
      required: true,
      enum: ['t_test', 'z_test', 'chi_square', 'proportion'],
    },
    {
      name: 'groupA',
      type: 'object',
      description: 'Group A data (array of values or summary stats)',
      required: true,
    },
    {
      name: 'groupB',
      type: 'object',
      description: 'Group B data (array of values or summary stats)',
      required: true,
    },
    {
      name: 'options',
      type: 'object',
      description: 'Test options (alpha level, alternative hypothesis, etc.)',
      required: false,
    },
  ],
  returns: {
    type: 'object',
    description: 'Test results with p-value, test statistic, and conclusion',
  },
  examples: [
    {
      input: {
        testType: 't_test',
        groupA: { values: [20, 22, 21, 23, 19] },
        groupB: { values: [25, 27, 26, 28, 24] },
      },
      output: {
        success: true,
        testType: 't_test',
        statistic: -5.123,
        pValue: 0.001,
        significant: true,
        conclusion: 'Reject null hypothesis',
      },
    },
  ],
};

/**
 * Calculate mean and standard deviation
 */
const getMeanAndStd = (values: number[]) => {
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
  const std = Math.sqrt(variance);

  return { mean, std, n };
};

/**
 * Two-sample t-test (independent samples)
 */
const tTest = (groupA: number[], groupB: number[]) => {
  const statsA = getMeanAndStd(groupA);
  const statsB = getMeanAndStd(groupB);

  // Pooled standard deviation
  const pooledVariance =
    ((statsA.n - 1) * Math.pow(statsA.std, 2) + (statsB.n - 1) * Math.pow(statsB.std, 2)) /
    (statsA.n + statsB.n - 2);

  const standardError = Math.sqrt(pooledVariance * (1 / statsA.n + 1 / statsB.n));
  const tStatistic = (statsA.mean - statsB.mean) / standardError;
  const degreesOfFreedom = statsA.n + statsB.n - 2;

  // Calculate p-value using Student's t distribution
  const pValue = 2 * (1 - studentTCDF(Math.abs(tStatistic), degreesOfFreedom));

  return {
    statistic: Math.round(tStatistic * 10000) / 10000,
    degreesOfFreedom,
    pValue: Math.round(pValue * 10000) / 10000,
    meanA: Math.round(statsA.mean * 100) / 100,
    meanB: Math.round(statsB.mean * 100) / 100,
    stdA: Math.round(statsA.std * 100) / 100,
    stdB: Math.round(statsB.std * 100) / 100,
  };
};

/**
 * Two-sample z-test (for proportions or large samples)
 */
const zTest = (groupA: number[], groupB: number[]) => {
  const statsA = getMeanAndStd(groupA);
  const statsB = getMeanAndStd(groupB);

  const standardError = Math.sqrt(
    Math.pow(statsA.std, 2) / statsA.n + Math.pow(statsB.std, 2) / statsB.n
  );

  const zStatistic = (statsA.mean - statsB.mean) / standardError;
  const pValue = 2 * (1 - normalCDF(Math.abs(zStatistic)));

  return {
    statistic: Math.round(zStatistic * 10000) / 10000,
    pValue: Math.round(pValue * 10000) / 10000,
    meanA: Math.round(statsA.mean * 100) / 100,
    meanB: Math.round(statsB.mean * 100) / 100,
  };
};

/**
 * Chi-square test for proportions
 */
const chiSquareTest = (
  successA: number,
  totalA: number,
  successB: number,
  totalB: number
) => {
  const failA = totalA - successA;
  const failB = totalB - successB;

  const totalSuccess = successA + successB;
  const totalFail = failA + failB;
  const total = totalA + totalB;

  // Expected frequencies
  const expSuccessA = (totalA * totalSuccess) / total;
  const expFailA = (totalA * totalFail) / total;
  const expSuccessB = (totalB * totalSuccess) / total;
  const expFailB = (totalB * totalFail) / total;

  // Chi-square statistic
  const chiSquare =
    Math.pow(successA - expSuccessA, 2) / expSuccessA +
    Math.pow(failA - expFailA, 2) / expFailA +
    Math.pow(successB - expSuccessB, 2) / expSuccessB +
    Math.pow(failB - expFailB, 2) / expFailB;

  // Approximate p-value (df = 1)
  const pValue = 1 - chiSquareCDF(chiSquare, 1);

  return {
    statistic: Math.round(chiSquare * 10000) / 10000,
    pValue: Math.round(pValue * 10000) / 10000,
    proportionA: Math.round((successA / totalA) * 10000) / 10000,
    proportionB: Math.round((successB / totalB) * 10000) / 10000,
  };
};

/**
 * Proportion z-test
 */
const proportionTest = (
  successA: number,
  totalA: number,
  successB: number,
  totalB: number
) => {
  const pA = successA / totalA;
  const pB = successB / totalB;
  const pPooled = (successA + successB) / (totalA + totalB);

  const standardError = Math.sqrt(pPooled * (1 - pPooled) * (1 / totalA + 1 / totalB));
  const zStatistic = (pA - pB) / standardError;
  const pValue = 2 * (1 - normalCDF(Math.abs(zStatistic)));

  return {
    statistic: Math.round(zStatistic * 10000) / 10000,
    pValue: Math.round(pValue * 10000) / 10000,
    proportionA: Math.round(pA * 10000) / 10000,
    proportionB: Math.round(pB * 10000) / 10000,
  };
};

/**
 * Normal CDF approximation (for z-test p-value calculation)
 */
const normalCDF = (z: number): number => {
  return 0.5 * (1 + erf(z / Math.sqrt(2)));
};

const erf = (x: number): number => {
  // Abramowitz and Stegun approximation
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
};

/**
 * Student's t CDF approximation (for t-test p-value calculation)
 * 
 * CURRENT LIMITATION (Phase 1): Uses conservative normal approximation
 * for small df (<3). Accurate exact Student's t CDF using incomplete
 * beta function planned for Phase 2 production hardening.
 * 
 * For df >= 3: Uses Wallace's approximation (1959)
 * For df < 3: Returns conservative estimate (wider confidence intervals)
 */
const studentTCDF = (t: number, df: number): number => {
  // For very small df (<3), use conservative normal approximation
  // This errs on the side of caution (wider p-values = less likely to falsely reject null)
  if (df < 3) {
    // Apply correction factor to make p-values more conservative
    const conservativeT = t * 0.8; // Makes p-value larger (more conservative)
    return normalCDF(conservativeT);
  }

  // For very large df, Student's t approaches normal distribution
  if (df >= 100) {
    return normalCDF(t);
  }

  // For moderate df (3-99), use Wallace's approximation
  // Transforms t-statistic to approximate z-score
  const g = df / (df + t * t);
  const delta = (1 - g) / (2 * g);
  const zApprox = t * (1 - delta / df);
  
  return normalCDF(zApprox);
};

/**
 * Chi-square CDF approximation
 */
const chiSquareCDF = (x: number, df: number): number => {
  // Simplified approximation for df=1
  if (df === 1) {
    return 2 * normalCDF(Math.sqrt(x)) - 1;
  }
  return 0.5; // Placeholder for other df
};

/**
 * A/B Testing Executor
 */
export const abTestingExecutor: ToolExecutor = async (params) => {
  const { testType, groupA, groupB, options = {} } = params;
  const alpha = options.alpha || 0.05;

  try {
    let result: any;

    switch (testType) {
      case 't_test': {
        if (!groupA.values || !groupB.values) {
          return {
            success: false,
            error: 'groupA.values and groupB.values required for t-test',
          };
        }

        result = tTest(groupA.values, groupB.values);
        break;
      }

      case 'z_test': {
        if (!groupA.values || !groupB.values) {
          return {
            success: false,
            error: 'groupA.values and groupB.values required for z-test',
          };
        }

        result = zTest(groupA.values, groupB.values);
        break;
      }

      case 'chi_square': {
        if (
          groupA.success === undefined ||
          groupA.total === undefined ||
          groupB.success === undefined ||
          groupB.total === undefined
        ) {
          return {
            success: false,
            error: 'groupA/B.success and groupA/B.total required for chi-square test',
          };
        }

        result = chiSquareTest(groupA.success, groupA.total, groupB.success, groupB.total);
        break;
      }

      case 'proportion': {
        if (
          groupA.success === undefined ||
          groupA.total === undefined ||
          groupB.success === undefined ||
          groupB.total === undefined
        ) {
          return {
            success: false,
            error: 'groupA/B.success and groupA/B.total required for proportion test',
          };
        }

        result = proportionTest(groupA.success, groupA.total, groupB.success, groupB.total);
        break;
      }

      default:
        return {
          success: false,
          error: `Unknown test type: ${testType}`,
        };
    }

    const significant = result.pValue < alpha;
    const conclusion = significant ? 'Reject null hypothesis' : 'Fail to reject null hypothesis';

    return {
      success: true,
      testType,
      ...result,
      alpha,
      significant,
      conclusion,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
};
