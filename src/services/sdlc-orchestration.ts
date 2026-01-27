import { db } from "../db";
import { 
  sdlcWorkflows, 
  sdlcStages, 
  sdlcTasks, 
  sdlcArtifacts, 
  sdlcApprovals,
  sdlcWorkflowExecutions,
  type InsertSdlcWorkflow,
  type InsertSdlcStage,
  type InsertSdlcTask,
  type InsertSdlcArtifact,
  type InsertSdlcApproval,
  type InsertSdlcWorkflowExecution
} from "../../shared/sdlc-schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import WAIOrchestrationCoreV9 from "../orchestration/wai-orchestration-core-v9";

/**
 * SDLC 100% Automation Orchestration Service
 * Uses WAI SDK v1.0 as Single Source of Truth for All Development Tasks
 * 
 * 8 Complete Workflows:
 * 1. Discovery - Idea validation, market research, TAM/SAM/SOM analysis
 * 2. Triage - Feature prioritization, backlog creation
 * 3. Sprint - Development task creation, user stories
 * 4. Quality - Testing, security scans, code review
 * 5. Package - Build artifacts, deployment packages
 * 6. Deploy - Multi-cloud deployment orchestration
 * 7. Monitor - Real-time monitoring and observability
 * 8. Feedback - Learning loop and continuous improvement
 */

export class SdlcOrchestrationService {
  private waiCore = new WAIOrchestrationCoreV9();

  /**
   * 1. DISCOVERY WORKFLOW
   * Automated idea validation using WAI SDK agents:
   * - Market Research Agent: TAM/SAM/SOM analysis
   * - Business Strategy Agent: Competitive analysis
   * - Data Analyst Agent: Trend analysis
   */
  async executeDiscoveryWorkflow(params: {
    founderId: string;
    projectId: number;
    ideaDescription: string;
    targetMarket?: string;
    config?: any;
  }) {
    const workflowId = `workflow_discovery_${nanoid()}`;
    const executionId = `exec_${nanoid()}`;

    // Create workflow and execution records OUTSIDE transaction so they persist on failure
    const [workflow] = await db.insert(sdlcWorkflows).values({
      workflowId,
      founderId: params.founderId,
      projectId: params.projectId,
      name: "Discovery & Validation",
      type: "discovery",
      description: "Automated idea validation and market research",
      status: "in_progress",
      progress: 0,
      inputData: {
        ideaDescription: params.ideaDescription,
        targetMarket: params.targetMarket
      },
      config: params.config || {},
      scheduledStart: new Date(),
      actualStart: new Date(),
    }).returning();

    const [execution] = await db.insert(sdlcWorkflowExecutions).values({
      executionId,
      workflowId,
      triggeredBy: params.founderId,
      triggerType: "manual",
      status: "running",
      startedAt: new Date(),
    }).returning();

    // Declare variables in outer scope for use after transaction
    let marketAnalysis: any;
    let businessStrategy: any;
    let validationDecision: any;

    try {
      // Transaction for stages/tasks/artifacts only (workflow/execution already persisted)
      await db.transaction(async (tx) => {
        // Stage 1: Market Research
        const marketStage = await this.createStage({
        workflowId,
        name: "Market Research & Analysis",
        description: "TAM/SAM/SOM analysis and competitive research",
        sequenceOrder: 1,
        waiAgentType: "market_research_agent",
      }, tx);

      // Execute WAI SDK orchestration for market research
      const marketPrompt = `Analyze the following startup idea and provide comprehensive market research:

Idea: ${params.ideaDescription}
Target Market: ${params.targetMarket || "Not specified"}

Please provide:
1. TAM (Total Addressable Market) estimate with data sources
2. SAM (Serviceable Addressable Market) analysis
3. SOM (Serviceable Obtainable Market) realistic projection
4. Top 5 direct competitors with SWOT analysis
5. Market trends and growth projections
6. Key market insights and opportunities

Format as structured JSON with data-backed estimates.`;

      const marketResult = await this.waiCore.orchestrate({
        task: marketPrompt,
        agentType: "market_research_agent",
        context: {
          workflowId,
          stageId: marketStage.stageId,
          founderId: params.founderId,
        }
      }, tx);

      // Update stage with results
      await this.updateStageWithResults(marketStage.stageId!, marketResult, tx);

      // Create market research artifact
      await this.createArtifact({
        workflowId,
        name: "Market Research Report",
        type: "analysis",
        category: "market_research",
        content: JSON.stringify(marketResult.output),
        generatedBy: "market_research_agent",
        generationPrompt: marketPrompt,
      }, tx);

      // Stage 2: Business Strategy Analysis
      const strategyStage = await this.createStage({
        workflowId,
        name: "Business Strategy Analysis",
        description: "Business model validation and strategy formulation",
        sequenceOrder: 2,
        waiAgentType: "business_strategy_agent",
        dependsOn: [marketStage.stageId!],
      }, tx);

      const strategyPrompt = `Based on the market research, develop a comprehensive business strategy:

Idea: ${params.ideaDescription}
Market Data: ${JSON.stringify(marketResult.output)}

Please provide:
1. Recommended business model (B2B, B2C, B2B2C, marketplace, etc.)
2. Revenue stream opportunities
3. Go-to-market strategy
4. Competitive positioning and differentiation
5. Key success metrics and KPIs
6. Risk analysis and mitigation strategies

Format as actionable strategic recommendations.`;

      const strategyResult = await this.waiCore.orchestrate({
        task: strategyPrompt,
        agentType: "business_strategy_agent",
        context: {
          workflowId,
          stageId: strategyStage.stageId,
          founderId: params.founderId,
        }
      });

      await this.updateStageWithResults(strategyStage.stageId!, strategyResult, tx);

      await this.createArtifact({
        workflowId,
        name: "Business Strategy Document",
        type: "document",
        category: "strategy",
        content: JSON.stringify(strategyResult.output),
        generatedBy: "business_strategy_agent",
        generationPrompt: strategyPrompt,
      }, tx);

      // Stage 3: Validation Decision
      const validationStage = await this.createStage({
        workflowId,
        name: "Idea Validation Decision",
        description: "Final validation assessment and recommendations",
        sequenceOrder: 3,
        waiAgentType: "validation_agent",
        dependsOn: [strategyStage.stageId!],
      }, tx);

      const validationPrompt = `Provide a final validation decision for this startup idea:

Idea: ${params.ideaDescription}
Market Analysis: ${JSON.stringify(marketResult.output)}
Strategy: ${JSON.stringify(strategyResult.output)}

Assess:
1. Market viability score (0-100)
2. Competitive advantage score (0-100)
3. Execution complexity score (0-100)
4. Revenue potential score (0-100)
5. Overall recommendation: GO / NO-GO / PIVOT
6. Key next steps if GO
7. Pivot suggestions if applicable

Provide data-driven decision with clear rationale.`;

      const validationResult = await this.waiCore.orchestrate({
        task: validationPrompt,
        agentType: "validation_agent",
        context: {
          workflowId,
          stageId: validationStage.stageId,
          founderId: params.founderId,
        }
      });

      await this.updateStageWithResults(validationStage.stageId!, validationResult, tx);

      await this.createArtifact({
        workflowId,
        name: "Validation Decision Report",
        type: "document",
        category: "validation",
        content: JSON.stringify(validationResult.output),
        generatedBy: "validation_agent",
        generationPrompt: validationPrompt,
      }, tx);

      // Store results in outer scope for use after transaction
      marketAnalysis = marketResult.output;
      businessStrategy = strategyResult.output;
      validationDecision = validationResult.output;

      // Transaction complete - workflow/execution updates happen outside
      });

      // Update workflow and execution to completed (outside transaction)
      const completedAt = new Date();
      const duration = Math.floor((completedAt.getTime() - execution.startedAt!.getTime()) / 1000);

      await db.update(sdlcWorkflows)
        .set({
          status: "completed",
          progress: 100,
          actualEnd: completedAt,
          actualDuration: duration,
          outputData: { marketAnalysis, businessStrategy, validationDecision },
          waiOrchestrationId: "market-research-id",
          updatedAt: new Date(),
        })
        .where(eq(sdlcWorkflows.workflowId, workflowId));

      await db.update(sdlcWorkflowExecutions)
        .set({
          status: "completed",
          completedAt,
          duration,
          success: true,
          output: { marketAnalysis, businessStrategy, validationDecision },
          tasksExecuted: 3,
          tasksSucceeded: 3,
          artifactsGenerated: 3,
        })
        .where(eq(sdlcWorkflowExecutions.executionId, executionId));

      return { workflowId, executionId, status: "completed", output: { marketAnalysis, businessStrategy, validationDecision } };

    } catch (error) {
      console.error("Discovery workflow failed:", error);
      
      // Update workflow and execution to failed (outside transaction, so it persists)
      await db.update(sdlcWorkflows)
        .set({
          status: "failed",
          lastError: { message: error instanceof Error ? error.message : String(error) },
          errorCount: 1,
          actualEnd: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(sdlcWorkflows.workflowId, workflowId));

      await db.update(sdlcWorkflowExecutions)
        .set({
          status: "failed",
          completedAt: new Date(),
          success: false,
          failureReason: error instanceof Error ? error.message : String(error),
        })
        .where(eq(sdlcWorkflowExecutions.executionId, executionId));

      throw error;
    }
  }

  /**
   * 2. TRIAGE WORKFLOW
   * Auto-prioritize features using RICE/MoSCoW via WAI SDK Product Manager agent
   */
  async executeTriageWorkflow(params: {
    founderId: string;
    projectId: number;
    features: Array<{ name: string; description: string }>;
    businessGoals?: string;
  }) {
    const workflowId = `workflow_triage_${nanoid()}`;
    const executionId = `exec_${nanoid()}`;
    
    // Create workflow and execution outside transaction (persist on failure)
    const [workflow] = await db.insert(sdlcWorkflows).values({
      workflowId,
      founderId: params.founderId,
      projectId: params.projectId,
      name: "Feature Triage & Prioritization",
      type: "triage",
      description: "Automated feature prioritization using RICE framework",
      status: "in_progress",
      inputData: { features: params.features, businessGoals: params.businessGoals },
      actualStart: new Date(),
      scheduledStart: new Date(),
    }).returning();

    const [execution] = await db.insert(sdlcWorkflowExecutions).values({
      executionId,
      workflowId,
      triggeredBy: params.founderId,
      triggerType: "manual",
      status: "running",
      startedAt: new Date(),
    }).returning();

    // Declare result variable in outer scope
    let prioritizedBacklog: any;

    try {
      // Transaction for stages/tasks/artifacts only
      await db.transaction(async (tx) => {

        const stage = await this.createStage({
        workflowId,
        name: "RICE Prioritization",
        description: "Calculate RICE scores and create prioritized backlog",
        sequenceOrder: 1,
        waiAgentType: "product_manager_agent",
      }, tx);

      const prompt = `Prioritize the following features using RICE framework (Reach × Impact × Confidence / Effort):

Features:
${params.features.map((f, i) => `${i + 1}. ${f.name}: ${f.description}`).join('\n')}

Business Goals: ${params.businessGoals || "Not specified"}

For each feature provide:
1. Reach score (1-10): How many users will this impact?
2. Impact score (1-10): How much will it move the needle?
3. Confidence score (0-100%): How confident are we in these estimates?
4. Effort score (1-10): How much work is required?
5. RICE Score: (Reach × Impact × Confidence) / Effort
6. MoSCoW category: Must have / Should have / Could have / Won't have
7. Sprint assignment: Sprint 1, 2, 3, or Backlog

Return prioritized list with detailed scoring rationale.`;

      const result = await this.waiCore.orchestrate({
        task: prompt,
        agentType: "product_manager_agent",
        context: { workflowId, stageId: stage.stageId, founderId: params.founderId }
      });

      await this.updateStageWithResults(stage.stageId!, result, tx);

      await this.createArtifact({
        workflowId,
        name: "Prioritized Feature Backlog",
        type: "document",
        category: "backlog",
        content: JSON.stringify(result.output),
        generatedBy: "product_manager_agent",
        generationPrompt: prompt,
      }, tx);

        // Store result in outer scope for use after transaction
        prioritizedBacklog = result.output;

        // Transaction complete - workflow/execution updates happen outside
      });

      // Update workflow and execution to completed (outside transaction)
      const completedAt = new Date();
      const duration = Math.floor((completedAt.getTime() - execution.startedAt!.getTime()) / 1000);

      await db.update(sdlcWorkflows)
        .set({
          status: "completed",
          progress: 100,
          outputData: { prioritizedBacklog },
          actualEnd: completedAt,
          actualDuration: duration,
          updatedAt: new Date(),
        })
        .where(eq(sdlcWorkflows.workflowId, workflowId));

      await db.update(sdlcWorkflowExecutions)
        .set({
          status: "completed",
          completedAt,
          duration,
          success: true,
          output: { prioritizedBacklog },
          tasksExecuted: 1,
          tasksSucceeded: 1,
          artifactsGenerated: 1,
        })
        .where(eq(sdlcWorkflowExecutions.executionId, executionId));

      return { workflowId, executionId, status: "completed", output: prioritizedBacklog };

    } catch (error) {
      console.error("Triage workflow failed:", error);
      
      // Update workflow and execution to failed (outside transaction)
      await db.update(sdlcWorkflows)
        .set({
          status: "failed",
          lastError: { message: error instanceof Error ? error.message : String(error) },
          errorCount: 1,
          actualEnd: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(sdlcWorkflows.workflowId, workflowId));

      await db.update(sdlcWorkflowExecutions)
        .set({
          status: "failed",
          completedAt: new Date(),
          success: false,
          failureReason: error instanceof Error ? error.message : String(error),
        })
        .where(eq(sdlcWorkflowExecutions.executionId, executionId));

      throw error;
    }
  }

  /**
   * 3. SPRINT WORKFLOW
   * Auto-create development tasks via WAI SDK engineering agents
   */
  async executeSprintWorkflow(params: {
    founderId: string;
    projectId: number;
    features: Array<{ name: string; description: string; priority: string }>;
    sprintNumber: number;
    sprintDuration?: number; // days
  }) {
    const workflowId = `workflow_sprint_${nanoid()}`;
    const executionId = `exec_${nanoid()}`;
    
    // Create workflow and execution outside transaction (persist on failure)
    const [workflow] = await db.insert(sdlcWorkflows).values({
      workflowId,
      founderId: params.founderId,
      projectId: params.projectId,
      name: `Sprint ${params.sprintNumber} Planning`,
      type: "sprint",
      description: "Automated sprint planning and task breakdown",
      status: "in_progress",
      inputData: params,
      actualStart: new Date(),
      scheduledStart: new Date(),
    }).returning();

    const [execution] = await db.insert(sdlcWorkflowExecutions).values({
      executionId,
      workflowId,
      triggeredBy: params.founderId,
      triggerType: "manual",
      status: "running",
      startedAt: new Date(),
    }).returning();

    // Declare result variables in outer scope
    let userStories: any;
    let technicalTasks: any;

    try {
      // Transaction for stages/tasks/artifacts only
      await db.transaction(async (tx) => {
        // Stage 1: User Story Generation
        const storyStage = await this.createStage({
          workflowId,
          name: "User Story Generation",
          description: "Create detailed user stories with acceptance criteria",
          sequenceOrder: 1,
          waiAgentType: "product_owner_agent",
        }, tx);

        const storyPrompt = `Create detailed user stories for Sprint ${params.sprintNumber}:

Features:
${params.features.map(f => `- ${f.name} (${f.priority}): ${f.description}`).join('\n')}

For each feature, create user stories in this format:
- Title: As a [user], I want to [action], so that [benefit]
- Description: Detailed explanation
- Acceptance Criteria: Given/When/Then scenarios
- Story Points: Fibonacci scale (1, 2, 3, 5, 8, 13)
- Dependencies: List any dependencies

Return structured user stories ready for development.`;

        const storyResult = await this.waiCore.orchestrate({
          task: storyPrompt,
          agentType: "product_owner_agent",
          context: { workflowId, stageId: storyStage.stageId }
        });

        await this.updateStageWithResults(storyStage.stageId!, storyResult, tx);

        // Stage 2: Technical Task Breakdown
        const taskStage = await this.createStage({
          workflowId,
          name: "Technical Task Breakdown",
          description: "Break stories into technical implementation tasks",
          sequenceOrder: 2,
          waiAgentType: "tech_lead_agent",
          dependsOn: [storyStage.stageId!],
        }, tx);

      const taskPrompt = `Break down user stories into technical implementation tasks:

User Stories: ${JSON.stringify(storyResult.output)}

For each story, create technical tasks:
1. Frontend tasks (UI components, state management, routing)
2. Backend tasks (APIs, database, business logic)
3. Testing tasks (unit, integration, E2E)
4. DevOps tasks (deployment, monitoring)

Each task should have:
- Title and description
- Estimated hours
- Required skills
- Dependencies
- Implementation notes

Return complete task breakdown.`;

        const taskResult = await this.waiCore.orchestrate({
          task: taskPrompt,
          agentType: "tech_lead_agent",
          context: { workflowId, stageId: taskStage.stageId }
        });

        await this.updateStageWithResults(taskStage.stageId!, taskResult, tx);

        // Create tasks in database
        const tasks = Array.isArray(taskResult.output) ? taskResult.output : [taskResult.output];
        for (const task of tasks) {
          await this.createTask({
            workflowId,
            stageId: taskStage.stageId!,
            title: task.title || "Untitled Task",
            description: task.description || "",
            type: task.type || "development",
            priority: task.priority || "medium",
            estimatedEffort: task.estimatedHours || 0,
          }, tx);
        }

        await this.createArtifact({
          workflowId,
          name: `Sprint ${params.sprintNumber} Plan`,
          type: "document",
          category: "sprint_plan",
          content: JSON.stringify({ stories: storyResult.output, tasks: taskResult.output }),
          generatedBy: "tech_lead_agent",
        }, tx);

        // Store results in outer scope for use after transaction
        userStories = storyResult.output;
        technicalTasks = taskResult.output;

        // Transaction complete - workflow/execution updates happen outside
      });

      // Update workflow and execution to completed (outside transaction)
      const completedAt = new Date();
      const duration = Math.floor((completedAt.getTime() - execution.startedAt!.getTime()) / 1000);

      await db.update(sdlcWorkflows)
        .set({
          status: "completed",
          progress: 100,
          outputData: { userStories, technicalTasks },
          actualEnd: completedAt,
          actualDuration: duration,
          updatedAt: new Date(),
        })
        .where(eq(sdlcWorkflows.workflowId, workflowId));

      await db.update(sdlcWorkflowExecutions)
        .set({
          status: "completed",
          completedAt,
          duration,
          success: true,
          output: { userStories, technicalTasks },
          tasksExecuted: 2,
          tasksSucceeded: 2,
          artifactsGenerated: 1,
        })
        .where(eq(sdlcWorkflowExecutions.executionId, executionId));

      return { workflowId, executionId, status: "completed", output: { stories: userStories, tasks: technicalTasks } };

    } catch (error) {
      console.error("Sprint workflow failed:", error);
      
      // Update workflow and execution to failed (outside transaction)
      await db.update(sdlcWorkflows)
        .set({
          status: "failed",
          lastError: { message: error instanceof Error ? error.message : String(error) },
          errorCount: 1,
          actualEnd: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(sdlcWorkflows.workflowId, workflowId));

      await db.update(sdlcWorkflowExecutions)
        .set({
          status: "failed",
          completedAt: new Date(),
          success: false,
          failureReason: error instanceof Error ? error.message : String(error),
        })
        .where(eq(sdlcWorkflowExecutions.executionId, executionId));

      throw error;
    }
  }

  /**
   * 4. QUALITY WORKFLOW
   * Automated testing, security scan, code review via WAI SDK QA agents
   */
  async executeQualityWorkflow(params: {
    founderId: string;
    projectId: number;
    codeRepository: string;
    branch?: string;
  }) {
    const workflowId = `workflow_quality_${nanoid()}`;
    const executionId = `exec_${nanoid()}`;
    
    // Create workflow and execution outside transaction (persist on failure)
    const [workflow] = await db.insert(sdlcWorkflows).values({
      workflowId,
      founderId: params.founderId,
      projectId: params.projectId,
      name: "Quality Assurance",
      type: "quality",
      description: "Automated testing, security, and code review",
      status: "in_progress",
      inputData: params,
      actualStart: new Date(),
      scheduledStart: new Date(),
    }).returning();

    const [execution] = await db.insert(sdlcWorkflowExecutions).values({
      executionId,
      workflowId,
      triggeredBy: params.founderId,
      triggerType: "manual",
      status: "running",
      startedAt: new Date(),
    }).returning();

    // Declare result variables in outer scope
    let codeQuality: any;
    let security: any;
    let testing: any;
    let qualityGatePassed: boolean;

    try {
      // Transaction for stages/tasks/artifacts only
      await db.transaction(async (tx) => {
        // Stage 1: Code Quality Analysis
        const qualityStage = await this.createStage({
          workflowId,
          name: "Code Quality Analysis",
          description: "Linting, complexity analysis, best practices check",
          sequenceOrder: 1,
          waiAgentType: "code_reviewer_agent",
        }, tx);

      const qualityPrompt = `Perform comprehensive code quality analysis:

Repository: ${params.codeRepository}
Branch: ${params.branch || "main"}

Analyze:
1. Code complexity (cyclomatic complexity)
2. Code duplication
3. Naming conventions
4. Best practices adherence
5. Performance patterns
6. Maintainability index

Provide quality score (0-100) and specific improvement recommendations.`;

        const qualityResult = await this.waiCore.orchestrate({
          task: qualityPrompt,
          agentType: "code_reviewer_agent",
          context: { workflowId, stageId: qualityStage.stageId }
        });

        await this.updateStageWithResults(qualityStage.stageId!, qualityResult, tx);

        // Stage 2: Security Scan
        const securityStage = await this.createStage({
          workflowId,
          name: "Security Scan",
          description: "SAST, dependency vulnerabilities, security best practices",
          sequenceOrder: 2,
          waiAgentType: "security_agent",
        }, tx);

      const securityPrompt = `Perform security analysis:

Repository: ${params.codeRepository}

Check for:
1. SQL injection vulnerabilities
2. XSS vulnerabilities
3. Authentication/authorization issues
4. Sensitive data exposure
5. Dependency vulnerabilities (CVEs)
6. Security misconfigurations

Provide security score and critical/high/medium/low issues.`;

        const securityResult = await this.waiCore.orchestrate({
          task: securityPrompt,
          agentType: "security_agent",
          context: { workflowId, stageId: securityStage.stageId }
        });

        await this.updateStageWithResults(securityStage.stageId!, securityResult, tx);

        // Stage 3: Test Coverage Analysis
        const testStage = await this.createStage({
          workflowId,
          name: "Test Coverage Analysis",
          description: "Unit, integration, E2E test coverage assessment",
          sequenceOrder: 3,
          waiAgentType: "qa_engineer_agent",
        }, tx);

      const testPrompt = `Analyze test coverage:

Repository: ${params.codeRepository}

Assess:
1. Unit test coverage percentage
2. Integration test coverage
3. E2E test coverage
4. Critical paths coverage
5. Edge cases testing
6. Test quality (assertions, mocking)

Recommend additional test cases needed.`;

        const testResult = await this.waiCore.orchestrate({
          task: testPrompt,
          agentType: "qa_engineer_agent",
          context: { workflowId, stageId: testStage.stageId }
        });

        await this.updateStageWithResults(testStage.stageId!, testResult, tx);

        // Create quality report artifact
        await this.createArtifact({
          workflowId,
          name: "Quality Assurance Report",
          type: "document",
          category: "quality_report",
          content: JSON.stringify({
            codeQuality: qualityResult.output,
            security: securityResult.output,
            testing: testResult.output,
          }),
          generatedBy: "qa_engineer_agent",
        }, tx);

        // Create approval gate
        const qualityScore = qualityResult.output?.score || 0;
        const securityScore = securityResult.output?.score || 0;
        const overallPassed = qualityScore >= 70 && securityScore >= 80;

        await this.createApproval({
          workflowId,
          type: "quality_gate",
          name: "Quality Gate Approval",
          description: "Automated quality gate based on code quality and security scores",
          status: overallPassed ? "approved" : "rejected",
          automatedCheck: true,
          criteria: {
            minCodeQuality: 70,
            minSecurityScore: 80,
          },
          criteriaResults: {
            codeQuality: qualityScore,
            securityScore: securityScore,
          },
          passed: overallPassed,
        }, tx);

        // Store results in outer scope for use after transaction
        codeQuality = qualityResult.output;
        security = securityResult.output;
        testing = testResult.output;
        qualityGatePassed = overallPassed;

        // Transaction complete - workflow/execution updates happen outside
      });

      // Update workflow and execution to completed (outside transaction)
      const completedAt = new Date();
      const duration = Math.floor((completedAt.getTime() - execution.startedAt!.getTime()) / 1000);
      const qualityScore = codeQuality?.score || 0;
      const securityScore = security?.score || 0;

      await db.update(sdlcWorkflows)
        .set({
          status: "completed",
          progress: 100,
          qualityScore: Math.round((qualityScore + securityScore) / 2),
          outputData: {
            codeQuality,
            security,
            testing,
            qualityGatePassed,
          },
          actualEnd: completedAt,
          actualDuration: duration,
          updatedAt: new Date(),
        })
        .where(eq(sdlcWorkflows.workflowId, workflowId));

      await db.update(sdlcWorkflowExecutions)
        .set({
          status: "completed",
          completedAt,
          duration,
          success: true,
          output: { codeQuality, security, testing, qualityGatePassed },
          tasksExecuted: 3,
          tasksSucceeded: 3,
          artifactsGenerated: 1,
        })
        .where(eq(sdlcWorkflowExecutions.executionId, executionId));

      return {
        workflowId,
        executionId,
        status: "completed",
        qualityGatePassed,
        output: { codeQuality, security, testing }
      };

    } catch (error) {
      console.error("Quality workflow failed:", error);
      
      // Update workflow and execution to failed (outside transaction)
      await db.update(sdlcWorkflows)
        .set({
          status: "failed",
          lastError: { message: error instanceof Error ? error.message : String(error) },
          errorCount: 1,
          actualEnd: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(sdlcWorkflows.workflowId, workflowId));

      await db.update(sdlcWorkflowExecutions)
        .set({
          status: "failed",
          completedAt: new Date(),
          success: false,
          failureReason: error instanceof Error ? error.message : String(error),
        })
        .where(eq(sdlcWorkflowExecutions.executionId, executionId));

      throw error;
    }
  }

  /**
   * 5. PACKAGE WORKFLOW
   * Auto-build deployment artifacts via WAI SDK DevOps agents
   */
  async executePackageWorkflow(params: {
    founderId: string;
    projectId: number;
    repository: string;
    environment: "development" | "staging" | "production";
  }) {
    const workflowId = `workflow_package_${nanoid()}`;
    const executionId = `exec_${nanoid()}`;
    
    // Create workflow and execution outside transaction (persist on failure)
    const [workflow] = await db.insert(sdlcWorkflows).values({
      workflowId,
      founderId: params.founderId,
      projectId: params.projectId,
      name: "Build & Package",
      type: "package",
      description: "Automated artifact building and packaging",
      status: "in_progress",
      inputData: params,
      actualStart: new Date(),
      scheduledStart: new Date(),
    }).returning();

    const [execution] = await db.insert(sdlcWorkflowExecutions).values({
      executionId,
      workflowId,
      triggeredBy: params.founderId,
      triggerType: "manual",
      status: "running",
      startedAt: new Date(),
    }).returning();

    // Declare result variable in outer scope
    let artifacts: any;

    try {
      // Transaction for stages/tasks/artifacts only
      await db.transaction(async (tx) => {
        const stage = await this.createStage({
          workflowId,
          name: "Artifact Generation",
          description: "Generate deployment artifacts and configurations",
          sequenceOrder: 1,
          waiAgentType: "devops_agent",
        }, tx);

      const prompt = `Generate deployment artifacts and configurations:

Repository: ${params.repository}
Environment: ${params.environment}

Generate:
1. Dockerfile with multi-stage build optimization
2. docker-compose.yml for local development
3. Kubernetes deployment manifests (deployment, service, ingress)
4. CI/CD pipeline configuration (GitHub Actions or GitLab CI)
5. Environment-specific configs (.env templates)
6. Health check endpoints configuration
7. Monitoring and logging setup

Return complete artifact package with all configurations.`;

        const result = await this.waiCore.orchestrate({
          task: prompt,
          agentType: "devops_agent",
          context: { workflowId, stageId: stage.stageId }
        });

        await this.updateStageWithResults(stage.stageId!, result, tx);

        // Create artifacts for each generated file
        const artifactList = result.output?.artifacts || [];
        for (const artifact of artifactList) {
          await this.createArtifact({
            workflowId,
            name: artifact.name || "Deployment Artifact",
            type: "config",
            category: "deployment",
            content: artifact.content || "",
            generatedBy: "devops_agent",
          }, tx);
        }

        // Store result in outer scope for use after transaction
        artifacts = result.output;

        // Transaction complete - workflow/execution updates happen outside
      });

      // Update workflow and execution to completed (outside transaction)
      const completedAt = new Date();
      const duration = Math.floor((completedAt.getTime() - execution.startedAt!.getTime()) / 1000);

      await db.update(sdlcWorkflows)
        .set({
          status: "completed",
          progress: 100,
          outputData: { artifacts },
          actualEnd: completedAt,
          actualDuration: duration,
          updatedAt: new Date(),
        })
        .where(eq(sdlcWorkflows.workflowId, workflowId));

      await db.update(sdlcWorkflowExecutions)
        .set({
          status: "completed",
          completedAt,
          duration,
          success: true,
          output: { artifacts },
          tasksExecuted: 1,
          tasksSucceeded: 1,
          artifactsGenerated: artifacts?.artifacts?.length || 0,
        })
        .where(eq(sdlcWorkflowExecutions.executionId, executionId));

      return { workflowId, executionId, status: "completed", output: artifacts };

    } catch (error) {
      console.error("Package workflow failed:", error);
      
      // Update workflow and execution to failed (outside transaction)
      await db.update(sdlcWorkflows)
        .set({
          status: "failed",
          lastError: { message: error instanceof Error ? error.message : String(error) },
          errorCount: 1,
          actualEnd: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(sdlcWorkflows.workflowId, workflowId));

      await db.update(sdlcWorkflowExecutions)
        .set({
          status: "failed",
          completedAt: new Date(),
          success: false,
          failureReason: error instanceof Error ? error.message : String(error),
        })
        .where(eq(sdlcWorkflowExecutions.executionId, executionId));

      throw error;
    }
  }

  /**
   * 6. DEPLOY WORKFLOW
   * Multi-cloud deployment via WAI SDK Cloud Architect agents
   */
  async executeDeployWorkflow(params: {
    founderId: string;
    projectId: number;
    artifactUrl: string;
    cloudProvider: "aws" | "gcp" | "azure" | "replit";
    environment: "development" | "staging" | "production";
  }) {
    const workflowId = `workflow_deploy_${nanoid()}`;
    const executionId = `exec_${nanoid()}`;
    
    // Create workflow and execution outside transaction (persist on failure)
    const [workflow] = await db.insert(sdlcWorkflows).values({
      workflowId,
      founderId: params.founderId,
      projectId: params.projectId,
      name: `Deploy to ${params.cloudProvider} (${params.environment})`,
      type: "deploy",
      description: "Automated multi-cloud deployment",
      status: "in_progress",
      inputData: params,
      actualStart: new Date(),
      scheduledStart: new Date(),
    }).returning();

    const [execution] = await db.insert(sdlcWorkflowExecutions).values({
      executionId,
      workflowId,
      triggeredBy: params.founderId,
      triggerType: "manual",
      status: "running",
      startedAt: new Date(),
    }).returning();

    // Declare result variables in outer scope
    let deploymentDetails: any;
    let deploymentSuccess: boolean;

    try {
      // Transaction for stages/tasks/artifacts only
      await db.transaction(async (tx) => {
        const stage = await this.createStage({
          workflowId,
          name: "Cloud Deployment",
          description: `Deploy to ${params.cloudProvider}`,
          sequenceOrder: 1,
          waiAgentType: "cloud_architect_agent",
        }, tx);

      const prompt = `Execute deployment to ${params.cloudProvider}:

Artifact: ${params.artifactUrl}
Environment: ${params.environment}
Cloud Provider: ${params.cloudProvider}

Perform:
1. Infrastructure provisioning (if needed)
2. Deploy application containers/services
3. Configure load balancing and auto-scaling
4. Set up SSL/TLS certificates
5. Configure environment variables and secrets
6. Run database migrations
7. Execute health checks
8. Configure monitoring and alerts
9. Set up logging pipeline

Return deployment status with service URLs and health check results.`;

        const result = await this.waiCore.orchestrate({
          task: prompt,
          agentType: "cloud_architect_agent",
          context: { workflowId, stageId: stage.stageId }
        });

        await this.updateStageWithResults(stage.stageId!, result, tx);

        await this.createArtifact({
          workflowId,
          name: "Deployment Report",
          type: "document",
          category: "deployment",
          content: JSON.stringify(result.output),
          generatedBy: "cloud_architect_agent",
        }, tx);

        // Store results in outer scope for use after transaction
        deploymentDetails = result.output;
        deploymentSuccess = result.output?.status === "success" || result.output?.healthy === true;

        // Transaction complete - workflow/execution updates happen outside
      });

      // Update workflow and execution to completed (outside transaction)
      const completedAt = new Date();
      const duration = Math.floor((completedAt.getTime() - execution.startedAt!.getTime()) / 1000);

      await db.update(sdlcWorkflows)
        .set({
          status: deploymentSuccess ? "completed" : "failed",
          progress: 100,
          outputData: {
            deploymentUrl: deploymentDetails?.url,
            healthStatus: deploymentDetails?.health,
            deploymentDetails,
          },
          actualEnd: completedAt,
          actualDuration: duration,
          updatedAt: new Date(),
        })
        .where(eq(sdlcWorkflows.workflowId, workflowId));

      await db.update(sdlcWorkflowExecutions)
        .set({
          status: deploymentSuccess ? "completed" : "failed",
          completedAt,
          duration,
          success: deploymentSuccess,
          output: { deploymentDetails },
          tasksExecuted: 1,
          tasksSucceeded: deploymentSuccess ? 1 : 0,
          artifactsGenerated: 1,
        })
        .where(eq(sdlcWorkflowExecutions.executionId, executionId));

      return { workflowId, executionId, status: deploymentSuccess ? "completed" : "failed", output: deploymentDetails };

    } catch (error) {
      console.error("Deploy workflow failed:", error);
      
      // Update workflow and execution to failed (outside transaction)
      await db.update(sdlcWorkflows)
        .set({
          status: "failed",
          lastError: { message: error instanceof Error ? error.message : String(error) },
          errorCount: 1,
          actualEnd: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(sdlcWorkflows.workflowId, workflowId));

      await db.update(sdlcWorkflowExecutions)
        .set({
          status: "failed",
          completedAt: new Date(),
          success: false,
          failureReason: error instanceof Error ? error.message : String(error),
        })
        .where(eq(sdlcWorkflowExecutions.executionId, executionId));

      throw error;
    }
  }

  /**
   * 7. MONITOR WORKFLOW
   * Real-time monitoring via WAI SDK SRE agents
   */
  async executeMonitorWorkflow(params: {
    founderId: string;
    projectId: number;
    deploymentUrl: string;
    monitoringDuration?: number; // hours
  }) {
    const workflowId = `workflow_monitor_${nanoid()}`;
    const executionId = `exec_${nanoid()}`;
    
    // Create workflow and execution outside transaction (persist on failure)
    const [workflow] = await db.insert(sdlcWorkflows).values({
      workflowId,
      founderId: params.founderId,
      projectId: params.projectId,
      name: "Monitoring & Observability",
      type: "monitor",
      description: "Real-time monitoring and alerting",
      status: "in_progress",
      inputData: params,
      actualStart: new Date(),
      scheduledStart: new Date(),
    }).returning();

    const [execution] = await db.insert(sdlcWorkflowExecutions).values({
      executionId,
      workflowId,
      triggeredBy: params.founderId,
      triggerType: "manual",
      status: "running",
      startedAt: new Date(),
    }).returning();

    // Declare result variable in outer scope
    let monitoringDetails: any;

    try {
      // Transaction for stages/tasks/artifacts only
      await db.transaction(async (tx) => {
        const stage = await this.createStage({
          workflowId,
          name: "Observability Setup",
          description: "Configure monitoring, logging, and tracing",
          sequenceOrder: 1,
          waiAgentType: "sre_agent",
        }, tx);

      const prompt = `Set up comprehensive observability for:

Deployment URL: ${params.deploymentUrl}
Monitoring Duration: ${params.monitoringDuration || 24} hours

Configure:
1. Application Performance Monitoring (APM)
2. Log aggregation and analysis
3. Distributed tracing
4. Custom metrics and dashboards
5. Alert rules and thresholds
6. SLA/SLO tracking
7. Error tracking and reporting

Provide monitoring dashboard URLs and alert configuration.`;

        const result = await this.waiCore.orchestrate({
          task: prompt,
          agentType: "sre_agent",
          context: { workflowId, stageId: stage.stageId }
        });

        await this.updateStageWithResults(stage.stageId!, result, tx);

        await this.createArtifact({
          workflowId,
          name: "Monitoring Configuration",
          type: "config",
          category: "monitoring",
          content: JSON.stringify(result.output),
          generatedBy: "sre_agent",
        }, tx);

        // Store result in outer scope for use after transaction
        monitoringDetails = result.output;

        // Transaction complete - workflow/execution updates happen outside
      });

      // Update workflow and execution to completed (outside transaction)
      const completedAt = new Date();
      const duration = Math.floor((completedAt.getTime() - execution.startedAt!.getTime()) / 1000);

      await db.update(sdlcWorkflows)
        .set({
          status: "completed",
          progress: 100,
          outputData: {
            dashboardUrl: monitoringDetails?.dashboardUrl,
            alertsConfigured: monitoringDetails?.alerts,
            monitoringDetails,
          },
          actualEnd: completedAt,
          actualDuration: duration,
          updatedAt: new Date(),
        })
        .where(eq(sdlcWorkflows.workflowId, workflowId));

      await db.update(sdlcWorkflowExecutions)
        .set({
          status: "completed",
          completedAt,
          duration,
          success: true,
          output: { monitoringDetails },
          tasksExecuted: 1,
          tasksSucceeded: 1,
          artifactsGenerated: 1,
        })
        .where(eq(sdlcWorkflowExecutions.executionId, executionId));

      return { workflowId, executionId, status: "completed", output: monitoringDetails };

    } catch (error) {
      console.error("Monitor workflow failed:", error);
      
      // Update workflow and execution to failed (outside transaction)
      await db.update(sdlcWorkflows)
        .set({
          status: "failed",
          lastError: { message: error instanceof Error ? error.message : String(error) },
          errorCount: 1,
          actualEnd: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(sdlcWorkflows.workflowId, workflowId));

      await db.update(sdlcWorkflowExecutions)
        .set({
          status: "failed",
          completedAt: new Date(),
          success: false,
          failureReason: error instanceof Error ? error.message : String(error),
        })
        .where(eq(sdlcWorkflowExecutions.executionId, executionId));

      throw error;
    }
  }

  /**
   * 8. FEEDBACK LOOP WORKFLOW
   * Learning and improvement via WAI SDK ML agents
   */
  async executeFeedbackWorkflow(params: {
    founderId: string;
    projectId: number;
    metricsData: any;
    timeRange?: string;
  }) {
    const workflowId = `workflow_feedback_${nanoid()}`;
    const executionId = `exec_${nanoid()}`;
    
    // Create workflow and execution outside transaction (persist on failure)
    const [workflow] = await db.insert(sdlcWorkflows).values({
      workflowId,
      founderId: params.founderId,
      projectId: params.projectId,
      name: "Feedback & Optimization",
      type: "feedback",
      description: "Continuous learning and improvement recommendations",
      status: "in_progress",
      inputData: params,
      actualStart: new Date(),
      scheduledStart: new Date(),
    }).returning();

    const [execution] = await db.insert(sdlcWorkflowExecutions).values({
      executionId,
      workflowId,
      triggeredBy: params.founderId,
      triggerType: "manual",
      status: "running",
      startedAt: new Date(),
    }).returning();

    // Declare result variable in outer scope
    let optimizationInsights: any;

    try {
      // Transaction for stages/tasks/artifacts only
      await db.transaction(async (tx) => {
        const stage = await this.createStage({
          workflowId,
          name: "Insights Generation",
          description: "Analyze metrics and generate improvement recommendations",
          sequenceOrder: 1,
          waiAgentType: "ml_engineer_agent",
        }, tx);

      const prompt = `Analyze application metrics and generate insights:

Metrics: ${JSON.stringify(params.metricsData)}
Time Range: ${params.timeRange || "Last 7 days"}

Analyze:
1. Performance trends and anomalies
2. User behavior patterns
3. Error patterns and root causes
4. Resource utilization optimization
5. Cost optimization opportunities
6. Feature usage analytics
7. Conversion funnel analysis

Provide:
- Key insights and findings
- Prioritized optimization recommendations
- Predicted impact of each recommendation
- Implementation roadmap

Format as actionable recommendations with data backing.`;

        const result = await this.waiCore.orchestrate({
          task: prompt,
          agentType: "ml_engineer_agent",
          context: { workflowId, stageId: stage.stageId }
        });

        await this.updateStageWithResults(stage.stageId!, result, tx);

        await this.createArtifact({
          workflowId,
          name: "Optimization Insights Report",
          type: "analysis",
          category: "insights",
          content: JSON.stringify(result.output),
          generatedBy: "ml_engineer_agent",
        }, tx);

        // Store result in outer scope for use after transaction
        optimizationInsights = result.output;

        // Transaction complete - workflow/execution updates happen outside
      });

      // Update workflow and execution to completed (outside transaction)
      const completedAt = new Date();
      const duration = Math.floor((completedAt.getTime() - execution.startedAt!.getTime()) / 1000);

      await db.update(sdlcWorkflows)
        .set({
          status: "completed",
          progress: 100,
          outputData: {
            insights: optimizationInsights?.insights,
            recommendations: optimizationInsights?.recommendations,
            predictedImpact: optimizationInsights?.impact,
          },
          actualEnd: completedAt,
          actualDuration: duration,
          updatedAt: new Date(),
        })
        .where(eq(sdlcWorkflows.workflowId, workflowId));

      await db.update(sdlcWorkflowExecutions)
        .set({
          status: "completed",
          completedAt,
          duration,
          success: true,
          output: { insights: optimizationInsights },
          tasksExecuted: 1,
          tasksSucceeded: 1,
          artifactsGenerated: 1,
        })
        .where(eq(sdlcWorkflowExecutions.executionId, executionId));

      return { workflowId, executionId, status: "completed", output: optimizationInsights };

    } catch (error) {
      console.error("Feedback workflow failed:", error);
      
      // Update workflow and execution to failed (outside transaction)
      await db.update(sdlcWorkflows)
        .set({
          status: "failed",
          lastError: { message: error instanceof Error ? error.message : String(error) },
          errorCount: 1,
          actualEnd: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(sdlcWorkflows.workflowId, workflowId));

      await db.update(sdlcWorkflowExecutions)
        .set({
          status: "failed",
          completedAt: new Date(),
          success: false,
          failureReason: error instanceof Error ? error.message : String(error),
        })
        .where(eq(sdlcWorkflowExecutions.executionId, executionId));

      throw error;
    }
  }

  // Helper methods (transaction-aware)
  private async createStage(data: Partial<InsertSdlcStage>, tx?: any) {
    const dbOrTx = tx || db;
    const stageId = `stage_${nanoid()}`;
    const [stage] = await dbOrTx.insert(sdlcStages).values({
      stageId,
      ...data,
    } as InsertSdlcStage).returning();
    return stage;
  }

  private async updateStageWithResults(stageId: string, result: any, tx?: any) {
    const dbOrTx = tx || db;
    await dbOrTx.update(sdlcStages)
      .set({
        status: "completed",
        progress: 100,
        agentResponse: result.output,
        waiTaskId: result.runId,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(sdlcStages.stageId, stageId));
  }

  private async createTask(data: Partial<InsertSdlcTask>, tx?: any) {
    const dbOrTx = tx || db;
    const taskId = `task_${nanoid()}`;
    const [task] = await dbOrTx.insert(sdlcTasks).values({
      taskId,
      ...data,
    } as InsertSdlcTask).returning();
    return task;
  }

  private async createArtifact(data: Partial<InsertSdlcArtifact>, tx?: any) {
    const dbOrTx = tx || db;
    const artifactId = `artifact_${nanoid()}`;
    const [artifact] = await dbOrTx.insert(sdlcArtifacts).values({
      artifactId,
      ...data,
    } as InsertSdlcArtifact).returning();
    return artifact;
  }

  private async createApproval(data: Partial<InsertSdlcApproval>, tx?: any) {
    const dbOrTx = tx || db;
    const approvalId = `approval_${nanoid()}`;
    const [approval] = await dbOrTx.insert(sdlcApprovals).values({
      approvalId,
      ...data,
    } as InsertSdlcApproval).returning();
    return approval;
  }

  // Query methods
  async getWorkflow(workflowId: string) {
    const [workflow] = await db.select()
      .from(sdlcWorkflows)
      .where(eq(sdlcWorkflows.workflowId, workflowId));
    return workflow;
  }

  async getWorkflowsByProject(projectId: number) {
    return await db.select()
      .from(sdlcWorkflows)
      .where(eq(sdlcWorkflows.projectId, projectId))
      .orderBy(desc(sdlcWorkflows.createdAt));
  }

  async getWorkflowStages(workflowId: string) {
    return await db.select()
      .from(sdlcStages)
      .where(eq(sdlcStages.workflowId, workflowId))
      .orderBy(sdlcStages.sequenceOrder);
  }

  async getWorkflowTasks(workflowId: string) {
    return await db.select()
      .from(sdlcTasks)
      .where(eq(sdlcTasks.workflowId, workflowId))
      .orderBy(desc(sdlcTasks.createdAt));
  }

  async getWorkflowArtifacts(workflowId: string) {
    return await db.select()
      .from(sdlcArtifacts)
      .where(eq(sdlcArtifacts.workflowId, workflowId))
      .orderBy(desc(sdlcArtifacts.createdAt));
  }
}

export const sdlcOrchestration = new SdlcOrchestrationService();
