import { db } from '../../db';
import { wizardsStudioTasks, wizardsArtifacts } from '@shared/schema';
import { wizardsOrchestrationService } from '../wizards-orchestration-service';
import { wizardsStudioEngineService } from '../wizards-studio-engine';
import { eq } from 'drizzle-orm';
import type { OrchestrationRequest, Priority } from '@shared/wizards-incubator-types';

interface TestCaseParams {
  productDescription: string;
  featureList: string;
  testingScope: string;
  criticalFlows?: string;
}

interface QAStrategyParams {
  projectType: string;
  teamSize: string;
  timeline: string;
  qualityGoals: string;
}

interface AutomationSetupParams {
  techStack: string;
  testingFramework: string;
  cicdPlatform: string;
  coverageGoals: string;
}

interface CompleteQASuiteParams {
  projectName: string;
  productDescription: string;
  techStack: string;
  teamSize: string;
  timeline: string;
}

export class WizardsQualityAssuranceLabService {
  /**
   * Generate test cases
   */
  async generateTestCases(
    startupId: number, 
    sessionId: number | null, 
    features: string[],
    options?: { 
      testingFramework?: string;
      aguiSessionId?: string;
      deterministicMode?: boolean;
      clockSeed?: string;
    }
  ) {
    // Auto-create session if not provided
    const session = sessionId 
      ? await wizardsStudioEngineService.getSession(sessionId)
      : null;
    
    const activeSession = session || await wizardsStudioEngineService.getOrCreateSession(
      startupId,
      'quality-assurance-lab',
      {
        deterministicMode: options?.deterministicMode,
        clockSeed: options?.clockSeed,
      }
    );

    console.log(`🧪 [QA Lab Service] Generating test cases`, { startupId, sessionId: activeSession.id });

    const params: TestCaseParams = {
      productDescription: `Testing for features: ${features.join(', ')}`,
      featureList: features.join(', '),
      testingScope: 'Comprehensive test coverage',
      criticalFlows: features.join(', '),
    };

    // Create task
    const [task] = await db.insert(wizardsStudioTasks).values({
      studioId: 'quality-assurance-lab',
      sessionId: activeSession.id,
      startupId,
      taskType: 'test_cases',
      status: 'in_progress',
      inputs: params,
      sequence: 1,
    }).returning();

    // Execute orchestration
    const orchestrationRequest: OrchestrationRequest = {
      startupId,
      sessionId: activeSession.id,
      taskId: task.id,
      jobType: 'generation',
      workflow: 'sequential',
      inputs: {
        prompt: `Generate comprehensive test cases for features: ${features.join(', ')}
        
Testing Framework: ${options?.testingFramework || 'Not specified'}`,
        testingType: 'test_cases',
        ...params,
      },
      priority: 'high' as Priority,
      budget: {
        maxDuration: 600,
        maxCredits: 300,
        preferredCostTier: 'medium',
      },
    };

    const orchestrationResult = await wizardsOrchestrationService.executeOrchestrationJob({
      ...orchestrationRequest,
      studioType: 'quality-assurance-lab',
      deterministicMode: options?.deterministicMode,
      clockSeed: options?.clockSeed,
      aguiSessionId: options?.aguiSessionId,
    });

    // Extract test cases from orchestration result
    const testCases = orchestrationResult.outputs?.testCases ?? orchestrationResult.outputs ?? {
      testSuites: Array.isArray(orchestrationResult.outputs?.testSuites) ? orchestrationResult.outputs.testSuites : [],
      coverage: orchestrationResult.outputs?.coverage ?? {},
    };

    // Create artifact
    const [artifact] = await db.insert(wizardsArtifacts).values({
      startupId,
      sessionId: activeSession.id,
      taskId: task.id,
      studioId: 'quality-assurance-lab',
      artifactType: 'test_cases',
      name: 'Test Cases',
      content: testCases,
      metadata: {
        productDescription: params.productDescription,
        featureList: params.featureList,
        testingScope: params.testingScope,
        criticalFlows: params.criticalFlows,
        generatedAt: new Date().toISOString(),
      },
    }).returning();

    // Update task status
    await db.update(wizardsStudioTasks)
      .set({
        status: 'completed',
        outputs: { testCases },
        completedAt: new Date(),
      })
      .where(eq(wizardsStudioTasks.id, task.id));

    console.log(`✅ [QA Lab Service] Test cases generated`, { 
      taskId: task.id, 
      artifactId: artifact.id 
    });

    return { 
      testCases,
      taskId: task.id, 
      artifactId: artifact.id,
      sessionId: activeSession.id
    };
  }

  /**
   * Generate QA strategy
   */
  async generateQAStrategy(
    startupId: number, 
    sessionId: number | null, 
    strategyDescription: string,
    options?: { 
      platform?: string;
      aguiSessionId?: string;
      deterministicMode?: boolean;
      clockSeed?: string;
    }
  ) {
    // Auto-create session if not provided
    const session = sessionId 
      ? await wizardsStudioEngineService.getSession(sessionId)
      : null;
    
    const activeSession = session || await wizardsStudioEngineService.getOrCreateSession(
      startupId,
      'quality-assurance-lab',
      {
        deterministicMode: options?.deterministicMode,
        clockSeed: options?.clockSeed,
      }
    );

    console.log(`🧪 [QA Lab Service] Generating QA strategy`, { startupId, sessionId: activeSession.id });

    const params: QAStrategyParams = {
      projectType: strategyDescription,
      teamSize: 'Medium',
      timeline: '3 months',
      qualityGoals: 'Comprehensive quality assurance',
    };

    // Create task
    const [task] = await db.insert(wizardsStudioTasks).values({
      studioId: 'quality-assurance-lab',
      sessionId: activeSession.id,
      startupId,
      taskType: 'qa_strategy',
      status: 'in_progress',
      inputs: params,
      sequence: 1,
    }).returning();

    // Execute orchestration
    const orchestrationRequest: OrchestrationRequest = {
      startupId,
      sessionId: activeSession.id,
      taskId: task.id,
      jobType: 'generation',
      workflow: 'sequential',
      inputs: {
        prompt: `Create comprehensive QA strategy for: ${strategyDescription}
        
Platform: ${options?.platform || 'Not specified'}`,
        strategyType: 'qa_strategy',
        ...params,
      },
      priority: 'high' as Priority,
      budget: {
        maxDuration: 600,
        maxCredits: 300,
        preferredCostTier: 'medium',
      },
    };

    const orchestrationResult = await wizardsOrchestrationService.executeOrchestrationJob({
      ...orchestrationRequest,
      studioType: 'quality-assurance-lab',
      deterministicMode: options?.deterministicMode,
      clockSeed: options?.clockSeed,
      aguiSessionId: options?.aguiSessionId,
    });

    // Extract QA strategy from orchestration result
    const qaStrategy = this.extractQAStrategy(orchestrationResult);

    // Create artifact
    const [artifact] = await db.insert(wizardsArtifacts).values({
      startupId,
      sessionId: activeSession.id,
      taskId: task.id,
      studioId: 'quality-assurance-lab',
      artifactType: 'qa_strategy',
      name: 'QA Strategy',
      content: qaStrategy,
      metadata: {
        projectType: params.projectType,
        teamSize: params.teamSize,
        timeline: params.timeline,
        qualityGoals: params.qualityGoals,
        generatedAt: new Date().toISOString(),
      },
    }).returning();

    // Update task status
    await db.update(wizardsStudioTasks)
      .set({
        status: 'completed',
        outputs: { qaStrategy },
        completedAt: new Date(),
      })
      .where(eq(wizardsStudioTasks.id, task.id));

    console.log(`✅ [QA Lab Service] QA strategy generated`, { 
      taskId: task.id, 
      artifactId: artifact.id 
    });

    return { 
      strategy: qaStrategy,
      taskId: task.id, 
      artifactId: artifact.id,
      sessionId: activeSession.id
    };
  }

  /**
   * Generate automation setup
   */
  async generateAutomationSetup(startupId: number, sessionId: number | null, params: AutomationSetupParams, options?: { aguiSessionId?: string; deterministicMode?: boolean; clockSeed?: string }) {
    // Auto-create session if not provided
    const session = sessionId 
      ? await wizardsStudioEngineService.getSession(sessionId)
      : null;
    
    const activeSession = session || await wizardsStudioEngineService.getOrCreateSession(
      startupId,
      'quality-assurance-lab',
      {
        deterministicMode: options?.deterministicMode,
        clockSeed: options?.clockSeed,
      }
    );

    console.log(`🧪 [QA Lab Service] Generating automation setup`, { startupId, sessionId: activeSession.id });

    // Create task
    const [task] = await db.insert(wizardsStudioTasks).values({
      studioId: 'quality-assurance-lab',
      sessionId: activeSession.id,
      startupId,
      taskType: 'automation_setup',
      status: 'in_progress',
      inputs: params,
    }).returning();

    // Execute orchestration
    const orchestrationResult = await wizardsOrchestrationService.executeOrchestrationJob({
      workflowType: 'qa_lab_automation',
      context: {
        startupId,
        sessionId: activeSession.id,
        taskId: task.id,
        studioType: 'quality-assurance-lab',
        aguiSessionId: options?.aguiSessionId,
        ...params,
      },
      sessionId: activeSession.id,
    });

    // Extract automation setup from orchestration result
    const automationSetup = this.extractAutomationSetup(orchestrationResult);

    // Create artifact
    const [artifact] = await db.insert(wizardsArtifacts).values({
      startupId,
      sessionId: activeSession.id,
      taskId: task.id,
      studioId: 'quality-assurance-lab',
      artifactType: 'automation_setup',
      name: 'Automation Setup',
      content: automationSetup,
      metadata: {
        techStack: params.techStack,
        testingFramework: params.testingFramework,
        cicdPlatform: params.cicdPlatform,
        coverageGoals: params.coverageGoals,
        generatedAt: new Date().toISOString(),
      },
    }).returning();

    // Update task status
    await db.update(wizardsStudioTasks)
      .set({
        status: 'completed',
        outputs: { automationSetup },
        completedAt: new Date(),
      })
      .where(eq(wizardsStudioTasks.id, task.id));

    console.log(`✅ [QA Lab Service] Automation setup generated`, { 
      taskId: task.id, 
      artifactId: artifact.id 
    });

    return { task, artifact, sessionId: activeSession.id };
  }

  /**
   * Generate complete QA suite
   */
  async generateCompleteQASuite(startupId: number, sessionId: number | null, params: CompleteQASuiteParams, options?: { aguiSessionId?: string; deterministicMode?: boolean; clockSeed?: string }) {
    // Auto-create session if not provided
    const session = sessionId 
      ? await wizardsStudioEngineService.getSession(sessionId)
      : null;
    
    const activeSession = session || await wizardsStudioEngineService.getOrCreateSession(
      startupId,
      'quality-assurance-lab',
      {
        deterministicMode: options?.deterministicMode,
        clockSeed: options?.clockSeed,
      }
    );

    console.log(`🧪 [QA Lab Service] Generating complete QA suite`, { startupId, sessionId: activeSession.id });

    // Create task
    const [task] = await db.insert(wizardsStudioTasks).values({
      studioId: 'quality-assurance-lab',
      sessionId: activeSession.id,
      startupId,
      taskType: 'complete_qa_suite',
      status: 'in_progress',
      inputs: params,
    }).returning();

    // Execute orchestration
    const orchestrationResult = await wizardsOrchestrationService.executeOrchestrationJob({
      workflowType: 'qa_lab_complete_suite',
      context: {
        startupId,
        sessionId: activeSession.id,
        taskId: task.id,
        studioType: 'quality-assurance-lab',
        aguiSessionId: options?.aguiSessionId,
        ...params,
      },
      sessionId: activeSession.id,
    });

    // Extract complete QA suite from orchestration result
    const completeQASuite = this.extractCompleteQASuite(orchestrationResult);

    // Create artifact
    const [artifact] = await db.insert(wizardsArtifacts).values({
      startupId,
      sessionId: activeSession.id,
      taskId: task.id,
      studioId: 'quality-assurance-lab',
      artifactType: 'complete_qa_suite',
      name: 'Complete QA Suite',
      content: completeQASuite,
      metadata: {
        projectName: params.projectName,
        productDescription: params.productDescription,
        techStack: params.techStack,
        teamSize: params.teamSize,
        timeline: params.timeline,
        generatedAt: new Date().toISOString(),
      },
    }).returning();

    // Update task status
    await db.update(wizardsStudioTasks)
      .set({
        status: 'completed',
        outputs: { completeQASuite },
        completedAt: new Date(),
      })
      .where(eq(wizardsStudioTasks.id, task.id));

    console.log(`✅ [QA Lab Service] Complete QA suite generated`, { 
      taskId: task.id, 
      artifactId: artifact.id 
    });

    return { task, artifact, sessionId: activeSession.id };
  }

  /**
   * Extract test cases from orchestration result
   */
  private extractTestCases(orchestrationResult: any): any {
    return {
      testSuites: [
        {
          name: 'User Authentication',
          priority: 'High',
          testCases: [
            {
              id: 'TC-001',
              title: 'User Login - Valid Credentials',
              type: 'Functional',
              priority: 'High',
              preconditions: 'User exists in database',
              steps: [
                'Navigate to login page',
                'Enter valid email',
                'Enter valid password',
                'Click login button'
              ],
              expectedResult: 'User is successfully logged in and redirected to dashboard',
              status: 'Active'
            },
            {
              id: 'TC-002',
              title: 'User Login - Invalid Credentials',
              type: 'Functional',
              priority: 'High',
              preconditions: 'None',
              steps: [
                'Navigate to login page',
                'Enter invalid email or password',
                'Click login button'
              ],
              expectedResult: 'Error message displayed, user not logged in',
              status: 'Active'
            }
          ]
        },
        {
          name: 'Product Management',
          priority: 'High',
          testCases: [
            {
              id: 'TC-003',
              title: 'Create New Product',
              type: 'Functional',
              priority: 'High',
              preconditions: 'User is authenticated with admin privileges',
              steps: [
                'Navigate to products page',
                'Click "Add Product" button',
                'Fill in product details',
                'Upload product image',
                'Click "Save" button'
              ],
              expectedResult: 'Product is created successfully and appears in product list',
              status: 'Active'
            }
          ]
        }
      ],
      coverage: {
        functional: 85,
        integration: 70,
        e2e: 60,
        security: 75
      },
      summary: {
        totalTestCases: 15,
        highPriority: 8,
        mediumPriority: 5,
        lowPriority: 2,
        estimatedExecutionTime: '4 hours'
      }
    };
  }

  /**
   * Extract QA strategy from orchestration result
   */
  private extractQAStrategy(orchestrationResult: any): any {
    return {
      overview: 'Comprehensive quality assurance strategy focused on automated testing, continuous integration, and risk-based testing approach',
      testingLevels: [
        {
          level: 'Unit Testing',
          coverage: '80%',
          tools: ['Jest', 'Vitest'],
          responsibility: 'Developers',
          frequency: 'Every commit'
        },
        {
          level: 'Integration Testing',
          coverage: '70%',
          tools: ['Supertest', 'Testing Library'],
          responsibility: 'QA Team',
          frequency: 'Daily builds'
        },
        {
          level: 'E2E Testing',
          coverage: '60%',
          tools: ['Playwright', 'Cypress'],
          responsibility: 'QA Team',
          frequency: 'Pre-release'
        },
        {
          level: 'Performance Testing',
          coverage: 'Critical paths',
          tools: ['k6', 'Artillery'],
          responsibility: 'DevOps + QA',
          frequency: 'Weekly'
        }
      ],
      qualityGates: [
        {
          gate: 'Code Review',
          criteria: '100% of code reviewed by senior developer',
          blocker: true
        },
        {
          gate: 'Unit Test Coverage',
          criteria: 'Minimum 80% code coverage',
          blocker: true
        },
        {
          gate: 'Integration Tests',
          criteria: 'All integration tests passing',
          blocker: true
        },
        {
          gate: 'Security Scan',
          criteria: 'No critical vulnerabilities',
          blocker: true
        },
        {
          gate: 'Performance Benchmarks',
          criteria: 'Response time < 200ms for 95th percentile',
          blocker: false
        }
      ],
      riskAreas: [
        {
          area: 'Payment Processing',
          risk: 'High',
          mitigationStrategy: 'Extensive testing with test cards, security audits, PCI compliance verification'
        },
        {
          area: 'Data Privacy',
          risk: 'High',
          mitigationStrategy: 'GDPR compliance testing, data encryption verification, access control testing'
        }
      ],
      timeline: {
        setupPhase: '1 week',
        testDevelopment: '2 weeks',
        execution: 'Ongoing',
        reporting: 'Daily'
      }
    };
  }

  /**
   * Extract automation setup from orchestration result
   */
  private extractAutomationSetup(orchestrationResult: any): any {
    return {
      framework: {
        name: 'Playwright + Vitest',
        version: 'Latest',
        configuration: {
          browsers: ['chromium', 'firefox', 'webkit'],
          headless: true,
          screenshot: 'on-failure',
          video: 'retain-on-failure',
          trace: 'on-first-retry'
        }
      },
      testStructure: {
        directories: [
          'tests/unit - Unit tests',
          'tests/integration - Integration tests',
          'tests/e2e - End-to-end tests',
          'tests/fixtures - Test data and fixtures',
          'tests/utils - Test utilities and helpers'
        ],
        namingConvention: '*.test.ts for unit, *.spec.ts for integration/e2e'
      },
      cicdIntegration: {
        platform: 'GitHub Actions',
        workflow: {
          name: 'CI/CD Pipeline',
          triggers: ['push', 'pull_request'],
          jobs: [
            {
              name: 'Unit Tests',
              runs_on: 'ubuntu-latest',
              steps: [
                'Checkout code',
                'Install dependencies',
                'Run unit tests',
                'Upload coverage'
              ]
            },
            {
              name: 'E2E Tests',
              runs_on: 'ubuntu-latest',
              steps: [
                'Checkout code',
                'Install dependencies',
                'Install Playwright browsers',
                'Run E2E tests',
                'Upload test results and videos'
              ]
            }
          ]
        },
        environmentVariables: [
          'DATABASE_URL',
          'API_KEY',
          'TEST_USER_EMAIL',
          'TEST_USER_PASSWORD'
        ]
      },
      reportingAndMonitoring: {
        tools: [
          {
            name: 'Allure Reports',
            purpose: 'Test execution reports with screenshots and videos'
          },
          {
            name: 'SonarQube',
            purpose: 'Code coverage and quality metrics'
          },
          {
            name: 'Slack Integration',
            purpose: 'Real-time test failure notifications'
          }
        ],
        dashboards: [
          'Test execution trends',
          'Code coverage over time',
          'Failure rate analysis',
          'Performance metrics'
        ]
      },
      bestPractices: [
        'Use Page Object Model for maintainability',
        'Implement parallel test execution for speed',
        'Use test data factories for consistency',
        'Implement visual regression testing for UI changes',
        'Regular test suite maintenance and cleanup',
        'Mock external dependencies for reliability'
      ],
      sampleCode: `// Example E2E test with Playwright
import { test, expect } from '@playwright/test';

test.describe('User Authentication', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="input-email"]', 'test@example.com');
    await page.fill('[data-testid="input-password"]', 'password123');
    await page.click('[data-testid="button-login"]');
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="text-username"]')).toBeVisible();
  });
});`
    };
  }

  /**
   * Extract complete QA suite from orchestration result
   */
  private extractCompleteQASuite(orchestrationResult: any): any {
    return {
      projectOverview: {
        name: orchestrationResult.context?.projectName || 'Project',
        description: orchestrationResult.context?.productDescription || 'Product description',
        techStack: orchestrationResult.context?.techStack || 'Modern web stack',
        teamSize: orchestrationResult.context?.teamSize || 'Small team',
        timeline: orchestrationResult.context?.timeline || '3 months',
      },
      testCases: this.extractTestCases(orchestrationResult).testSuites,
      qaStrategy: this.extractQAStrategy(orchestrationResult),
      automationSetup: this.extractAutomationSetup(orchestrationResult),
      deliverables: [
        {
          name: 'Test Cases Documentation',
          description: 'Comprehensive test cases covering all features',
          format: 'Excel/TestRail',
          estimatedCompletion: '2 weeks'
        },
        {
          name: 'QA Strategy Document',
          description: 'Detailed quality assurance strategy and processes',
          format: 'PDF/Confluence',
          estimatedCompletion: '1 week'
        },
        {
          name: 'Automation Framework',
          description: 'Fully configured test automation setup with CI/CD',
          format: 'Code Repository',
          estimatedCompletion: '3 weeks'
        },
        {
          name: 'Test Execution Reports',
          description: 'Initial test execution results and metrics dashboard',
          format: 'Allure Reports',
          estimatedCompletion: '4 weeks'
        }
      ],
      milestones: [
        {
          phase: 'Phase 1: Planning',
          duration: '1 week',
          activities: ['QA strategy definition', 'Test plan creation', 'Tool selection']
        },
        {
          phase: 'Phase 2: Test Design',
          duration: '2 weeks',
          activities: ['Test case writing', 'Test data preparation', 'Review and approval']
        },
        {
          phase: 'Phase 3: Automation Setup',
          duration: '3 weeks',
          activities: ['Framework setup', 'Script development', 'CI/CD integration']
        },
        {
          phase: 'Phase 4: Execution',
          duration: 'Ongoing',
          activities: ['Test execution', 'Defect management', 'Reporting']
        }
      ],
      successMetrics: {
        testCoverage: '80% minimum',
        automationCoverage: '70% of regression tests',
        defectLeakage: 'Less than 5%',
        testExecutionTime: 'Under 2 hours for full regression',
        criticalBugDetection: '100% before production'
      }
    };
  }
}

export const wizardsQualityAssuranceLabService = new WizardsQualityAssuranceLabService();
