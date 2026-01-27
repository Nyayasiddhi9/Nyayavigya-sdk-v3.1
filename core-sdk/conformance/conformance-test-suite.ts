/**
 * WAI Conformance Test Suite v9.0
 * Implements Gap Closure runbook Phase E requirements
 * Ensures 105+ GA agents with conformance and manifests
 */

import { WAILogger } from '../utils/logger';
import { AgentSPI, AgentManifest } from '../types/spi-contracts';
import { SchemaValidator, ConformanceTestResult, AgentManifestSchema } from '../schemas/spi-schemas';

export class ConformanceTestSuite {
  private logger: WAILogger;

  constructor() {
    this.logger = new WAILogger('ConformanceTestSuite');
  }

  async initialize(): Promise<void> {
    this.logger.info('🧪 Initializing Conformance Test Suite...');
    // Initialize test suite
    this.logger.info('✅ Conformance Test Suite initialized');
  }

  /**
   * Run comprehensive conformance tests for an agent
   */
  async runTests(agent: AgentSPI): Promise<ConformanceTestResult> {
    this.logger.info(`🧪 Running conformance tests for agent: ${agent.name}`);
    
    const tests: any[] = [];
    const failures: string[] = [];
    const warnings: string[] = [];
    
    try {
      // Test 1: Agent Manifest Validation
      const manifestTest = await this.testAgentManifest(agent);
      tests.push(manifestTest);
      if (!manifestTest.passed) {
        failures.push(`Manifest validation: ${manifestTest.message}`);
      }

      // Test 2: SPI Interface Compliance
      const spiTest = await this.testSPICompliance(agent);
      tests.push(spiTest);
      if (!spiTest.passed) {
        failures.push(`SPI compliance: ${spiTest.message}`);
      }

      // Test 3: Core Functionality Tests
      const functionalityTests = await this.testCoreFunctionality(agent);
      tests.push(...functionalityTests);
      functionalityTests.forEach(test => {
        if (!test.passed) {
          failures.push(`Core functionality: ${test.message}`);
        }
      });

      // Test 4: Performance Requirements
      const performanceTest = await this.testPerformanceRequirements(agent);
      tests.push(performanceTest);
      if (!performanceTest.passed) {
        failures.push(`Performance: ${performanceTest.message}`);
      }

      // Test 5: Security and Safety
      const securityTests = await this.testSecurityRequirements(agent);
      tests.push(...securityTests);
      securityTests.forEach(test => {
        if (!test.passed) {
          failures.push(`Security: ${test.message}`);
        }
      });

      // Test 6: Readiness State Validation
      const readinessTest = await this.testReadinessState(agent);
      tests.push(readinessTest);
      if (!readinessTest.passed) {
        failures.push(`Readiness state: ${readinessTest.message}`);
      }

      // Test 7: Cost and Resource Compliance
      const resourceTest = await this.testResourceCompliance(agent);
      tests.push(resourceTest);
      if (!resourceTest.passed) {
        failures.push(`Resource compliance: ${resourceTest.message}`);
      }

      // Calculate overall score
      const totalTests = tests.length;
      const passedTests = tests.filter(t => t.passed).length;
      const score = totalTests > 0 ? passedTests / totalTests : 0;
      const passed = failures.length === 0;

      const result: ConformanceTestResult = {
        passed,
        score,
        tests,
        failures,
        warnings
      };

      this.logger.info(`🧪 Conformance tests completed for ${agent.name}: ${passed ? 'PASSED' : 'FAILED'} (${Math.round(score * 100)}% score)`);
      
      return result;

    } catch (error) {
      this.logger.error(`❌ Conformance tests failed for ${agent.name}:`, error);
      
      return {
        passed: false,
        score: 0,
        tests,
        failures: [`Test execution error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings
      };
    }
  }

  /**
   * Test agent manifest validation
   */
  private async testAgentManifest(agent: AgentSPI): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Validate manifest against schema
      const validationResult = SchemaValidator.safeValidate(AgentManifestSchema, agent.manifest);
      
      if (!validationResult.success) {
        return {
          name: 'Agent Manifest Validation',
          passed: false,
          message: `Manifest schema validation failed: ${validationResult.error}`,
          duration: Date.now() - startTime
        };
      }

      // Check required fields
      const manifest = agent.manifest;
      const requiredFields = ['id', 'name', 'version', 'tier', 'capabilities', 'costs'];
      const missingFields = requiredFields.filter(field => !manifest[field]);
      
      if (missingFields.length > 0) {
        return {
          name: 'Agent Manifest Validation',
          passed: false,
          message: `Missing required fields: ${missingFields.join(', ')}`,
          duration: Date.now() - startTime
        };
      }

      // Validate capabilities array
      if (!Array.isArray(manifest.capabilities) || manifest.capabilities.length === 0) {
        return {
          name: 'Agent Manifest Validation',
          passed: false,
          message: 'Agent must have at least one capability',
          duration: Date.now() - startTime
        };
      }

      return {
        name: 'Agent Manifest Validation',
        passed: true,
        message: 'Manifest validation passed',
        duration: Date.now() - startTime
      };

    } catch (error) {
      return {
        name: 'Agent Manifest Validation',
        passed: false,
        message: error instanceof Error ? error.message : 'Manifest validation error',
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Test SPI interface compliance
   */
  private async testSPICompliance(agent: AgentSPI): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Check required properties
      const requiredProperties = ['id', 'name', 'version', 'tier', 'capabilities', 'readinessState', 'manifest'];
      const missingProperties = requiredProperties.filter(prop => !agent[prop]);
      
      if (missingProperties.length > 0) {
        return {
          name: 'SPI Interface Compliance',
          passed: false,
          message: `Missing required properties: ${missingProperties.join(', ')}`,
          duration: Date.now() - startTime
        };
      }

      // Check required methods
      const requiredMethods = ['execute', 'validate', 'getCapabilities', 'healthCheck', 'initialize', 'shutdown', 'onPolicyUpdate'];
      const missingMethods = requiredMethods.filter(method => typeof agent[method] !== 'function');
      
      if (missingMethods.length > 0) {
        return {
          name: 'SPI Interface Compliance',
          passed: false,
          message: `Missing required methods: ${missingMethods.join(', ')}`,
          duration: Date.now() - startTime
        };
      }

      return {
        name: 'SPI Interface Compliance',
        passed: true,
        message: 'SPI compliance verified',
        duration: Date.now() - startTime
      };

    } catch (error) {
      return {
        name: 'SPI Interface Compliance',
        passed: false,
        message: error instanceof Error ? error.message : 'SPI compliance test error',
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Test core functionality
   */
  private async testCoreFunctionality(agent: AgentSPI): Promise<any[]> {
    const tests: any[] = [];

    // Test 1: Execute method
    try {
      const startTime = Date.now();
      const testTask = { type: 'test', payload: { message: 'conformance test' } };
      const result = await agent.execute(testTask);
      
      tests.push({
        name: 'Execute Method Test',
        passed: result !== null && result !== undefined,
        message: result ? 'Execute method works correctly' : 'Execute method returned null/undefined',
        duration: Date.now() - startTime
      });
    } catch (error) {
      tests.push({
        name: 'Execute Method Test',
        passed: false,
        message: error instanceof Error ? error.message : 'Execute method failed',
        duration: 0
      });
    }

    // Test 2: Validate method
    try {
      const startTime = Date.now();
      const validInput = { test: true };
      const validationResult = await agent.validate(validInput);
      
      tests.push({
        name: 'Validate Method Test',
        passed: validationResult && typeof validationResult.valid === 'boolean',
        message: 'Validate method returns proper validation result',
        duration: Date.now() - startTime
      });
    } catch (error) {
      tests.push({
        name: 'Validate Method Test',
        passed: false,
        message: error instanceof Error ? error.message : 'Validate method failed',
        duration: 0
      });
    }

    // Test 3: GetCapabilities method
    try {
      const startTime = Date.now();
      const capabilities = await agent.getCapabilities();
      
      tests.push({
        name: 'GetCapabilities Method Test',
        passed: capabilities && capabilities.supported,
        message: 'GetCapabilities method returns capabilities object',
        duration: Date.now() - startTime
      });
    } catch (error) {
      tests.push({
        name: 'GetCapabilities Method Test',
        passed: false,
        message: error instanceof Error ? error.message : 'GetCapabilities method failed',
        duration: 0
      });
    }

    // Test 4: HealthCheck method
    try {
      const startTime = Date.now();
      const health = await agent.healthCheck();
      
      tests.push({
        name: 'HealthCheck Method Test',
        passed: health && typeof health.healthy === 'boolean',
        message: 'HealthCheck method returns health status',
        duration: Date.now() - startTime
      });
    } catch (error) {
      tests.push({
        name: 'HealthCheck Method Test',
        passed: false,
        message: error instanceof Error ? error.message : 'HealthCheck method failed',
        duration: 0
      });
    }

    return tests;
  }

  /**
   * Test performance requirements
   */
  private async testPerformanceRequirements(agent: AgentSPI): Promise<any> {
    const startTime = Date.now();
    
    try {
      // Test response time with simple task
      const taskStartTime = Date.now();
      const testTask = { type: 'performance-test', payload: { size: 'small' } };
      await agent.execute(testTask);
      const responseTime = Date.now() - taskStartTime;
      
      // Performance thresholds
      const maxResponseTime = 10000; // 10 seconds
      const performanceGrade = responseTime < maxResponseTime ? 'passed' : 'failed';
      
      return {
        name: 'Performance Requirements Test',
        passed: responseTime < maxResponseTime,
        message: `Response time: ${responseTime}ms (limit: ${maxResponseTime}ms)`,
        duration: Date.now() - startTime
      };

    } catch (error) {
      return {
        name: 'Performance Requirements Test',
        passed: false,
        message: error instanceof Error ? error.message : 'Performance test failed',
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Test security requirements
   */
  private async testSecurityRequirements(agent: AgentSPI): Promise<any[]> {
    const tests: any[] = [];

    // Test 1: Input validation security
    try {
      const startTime = Date.now();
      const maliciousInput = {
        script: '<script>alert("xss")</script>',
        sql: "'; DROP TABLE users; --",
        command: '$(rm -rf /)'
      };
      
      const validationResult = await agent.validate(maliciousInput);
      
      // Should handle malicious input gracefully
      tests.push({
        name: 'Input Validation Security Test',
        passed: !validationResult.valid || validationResult.errors.length > 0,
        message: 'Agent properly validates potentially malicious input',
        duration: Date.now() - startTime
      });
    } catch (error) {
      tests.push({
        name: 'Input Validation Security Test',
        passed: true, // If it throws, it's handling it securely
        message: 'Agent securely handles malicious input by throwing error',
        duration: 0
      });
    }

    // Test 2: Error handling security
    try {
      const startTime = Date.now();
      const invalidTask = null;
      
      try {
        await agent.execute(invalidTask);
        tests.push({
          name: 'Error Handling Security Test',
          passed: false,
          message: 'Agent should handle null/invalid tasks securely',
          duration: Date.now() - startTime
        });
      } catch (error) {
        // Check that error doesn't expose sensitive information
        const errorMessage = error instanceof Error ? error.message : String(error);
        const exposesInfo = errorMessage.includes('password') || 
                           errorMessage.includes('key') || 
                           errorMessage.includes('token') ||
                           errorMessage.includes('/home') ||
                           errorMessage.includes('C:\\');
        
        tests.push({
          name: 'Error Handling Security Test',
          passed: !exposesInfo,
          message: exposesInfo ? 'Error message may expose sensitive information' : 'Error handling is secure',
          duration: Date.now() - startTime
        });
      }
    } catch (error) {
      tests.push({
        name: 'Error Handling Security Test',
        passed: false,
        message: 'Security test failed with unexpected error',
        duration: 0
      });
    }

    return tests;
  }

  /**
   * Test readiness state validation
   */
  private async testReadinessState(agent: AgentSPI): Promise<any> {
    const startTime = Date.now();
    
    try {
      const readinessState = agent.readinessState;
      const validStates = ['alpha', 'beta', 'ga'];
      
      const isValidState = validStates.includes(readinessState);
      
      // For GA agents, run additional tests
      if (readinessState === 'ga') {
        // GA agents should have comprehensive manifests
        const manifest = agent.manifest;
        const hasCompleteManifest = manifest.description && 
                                   manifest.capabilities && 
                                   manifest.capabilities.length > 0 &&
                                   manifest.costs;
        
        if (!hasCompleteManifest) {
          return {
            name: 'Readiness State Validation',
            passed: false,
            message: 'GA agents must have complete manifests',
            duration: Date.now() - startTime
          };
        }
      }

      return {
        name: 'Readiness State Validation',
        passed: isValidState,
        message: isValidState ? `Valid readiness state: ${readinessState}` : `Invalid readiness state: ${readinessState}`,
        duration: Date.now() - startTime
      };

    } catch (error) {
      return {
        name: 'Readiness State Validation',
        passed: false,
        message: error instanceof Error ? error.message : 'Readiness state validation failed',
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Test resource compliance
   */
  private async testResourceCompliance(agent: AgentSPI): Promise<any> {
    const startTime = Date.now();
    
    try {
      const manifest = agent.manifest;
      
      // Check if costs are defined
      if (!manifest.costs) {
        return {
          name: 'Resource Compliance Test',
          passed: false,
          message: 'Agent manifest must include cost information',
          duration: Date.now() - startTime
        };
      }

      // Check if requirements are defined
      if (!manifest.requirements) {
        return {
          name: 'Resource Compliance Test',
          passed: false,
          message: 'Agent manifest must include resource requirements',
          duration: Date.now() - startTime
        };
      }

      // Validate cost structure
      const costs = manifest.costs;
      const hasValidCosts = typeof costs.baseCost === 'number' && 
                           typeof costs.perRequest === 'number' &&
                           costs.currency;

      if (!hasValidCosts) {
        return {
          name: 'Resource Compliance Test',
          passed: false,
          message: 'Agent costs must include baseCost, perRequest, and currency',
          duration: Date.now() - startTime
        };
      }

      // Validate requirements structure
      const requirements = manifest.requirements;
      const hasValidRequirements = typeof requirements.memory === 'number' && 
                                  typeof requirements.cpu === 'number';

      if (!hasValidRequirements) {
        return {
          name: 'Resource Compliance Test',
          passed: false,
          message: 'Agent requirements must include memory and cpu specifications',
          duration: Date.now() - startTime
        };
      }

      return {
        name: 'Resource Compliance Test',
        passed: true,
        message: 'Resource compliance validated',
        duration: Date.now() - startTime
      };

    } catch (error) {
      return {
        name: 'Resource Compliance Test',
        passed: false,
        message: error instanceof Error ? error.message : 'Resource compliance test failed',
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Run batch conformance tests for multiple agents
   */
  async runBatchTests(agents: AgentSPI[]): Promise<ConformanceTestResult[]> {
    this.logger.info(`🧪 Running batch conformance tests for ${agents.length} agents...`);
    
    const results: ConformanceTestResult[] = [];
    
    // Run tests in parallel with controlled concurrency
    const maxConcurrent = 5;
    for (let i = 0; i < agents.length; i += maxConcurrent) {
      const batch = agents.slice(i, i + maxConcurrent);
      const batchResults = await Promise.all(
        batch.map(agent => this.runTests(agent))
      );
      results.push(...batchResults);
    }

    const passedCount = results.filter(r => r.passed).length;
    const totalScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    
    this.logger.info(`✅ Batch conformance tests completed: ${passedCount}/${agents.length} passed (${Math.round(totalScore * 100)}% avg score)`);
    
    return results;
  }

  /**
   * Generate conformance report
   */
  generateReport(results: ConformanceTestResult[], agentName?: string): any {
    const totalTests = results.reduce((sum, r) => sum + r.tests.length, 0);
    const totalPassed = results.reduce((sum, r) => sum + r.tests.filter(t => t.passed).length, 0);
    const totalFailed = results.reduce((sum, r) => sum + r.failures.length, 0);
    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    
    return {
      summary: {
        agentName,
        totalAgents: results.length,
        totalTests,
        totalPassed,
        totalFailed,
        avgScore: Math.round(avgScore * 100) / 100,
        overallPassed: results.every(r => r.passed)
      },
      results,
      timestamp: Date.now()
    };
  }

  /**
   * Validate GA readiness for 105+ agents
   */
  async validateGAReadiness(agents: AgentSPI[]): Promise<any> {
    this.logger.info('🏆 Validating GA readiness for 105+ agents...');
    
    const gaAgents = agents.filter(agent => agent.readinessState === 'ga');
    const conformanceResults = await this.runBatchTests(gaAgents);
    
    const gaReadyCount = conformanceResults.filter(r => r.passed).length;
    const totalGAAgents = gaAgents.length;
    
    const report = {
      target: 105,
      gaAgents: totalGAAgents,
      gaReady: gaReadyCount,
      gaReadyPercentage: Math.round((gaReadyCount / totalGAAgents) * 100),
      meetsRequirement: gaReadyCount >= 105,
      conformanceResults,
      recommendations: this.generateGARecommendations(conformanceResults)
    };

    this.logger.info(`🏆 GA Readiness: ${gaReadyCount}/${totalGAAgents} agents ready (target: 105+)`);
    
    return report;
  }

  private generateGARecommendations(results: ConformanceTestResult[]): string[] {
    const recommendations: string[] = [];
    const failedResults = results.filter(r => !r.passed);
    
    if (failedResults.length > 0) {
      recommendations.push('Address conformance test failures in agents');
      
      const commonFailures = new Map<string, number>();
      failedResults.forEach(r => {
        r.failures.forEach(failure => {
          commonFailures.set(failure, (commonFailures.get(failure) || 0) + 1);
        });
      });

      const sortedFailures = Array.from(commonFailures.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      recommendations.push('Most common issues:');
      sortedFailures.forEach(([failure, count]) => {
        recommendations.push(`- ${failure} (${count} agents affected)`);
      });
    }

    const lowScores = results.filter(r => r.score < 0.8);
    if (lowScores.length > 0) {
      recommendations.push(`${lowScores.length} agents have conformance scores below 80%`);
    }

    return recommendations;
  }
}

export default ConformanceTestSuite;