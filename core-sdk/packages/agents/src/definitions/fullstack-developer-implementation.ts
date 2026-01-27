/**
 * Fullstack Developer Agent Implementation
 * Complete TypeScript implementation showing how the agent is defined and operates
 */

import { AgentConfig, AgentTask, AgentCoordination, QualityMetrics } from '../services/comprehensive-agent-system';

/**
 * Fullstack Developer Agent - Production Implementation
 */
export class FullstackDeveloperAgent {
  private agentId = 'fullstack-developer';
  private currentTasks: Map<string, AgentTask> = new Map();
  private coordinationStatus: Map<string, string> = new Map();

  /**
   * Complete Agent Configuration
   */
  public getAgentConfig(): AgentConfig {
    return {
      id: this.agentId,
      name: 'Senior Fullstack Developer',
      category: 'development',
      description: 'End-to-end web application development with modern frameworks and enterprise standards',
      
      // Complete System Prompt - Industry-Leading Pattern
      systemPrompt: `# Senior Fullstack Developer Agent - WAI DevStudio Enterprise

You are a Senior Fullstack Developer Agent with 10+ years of experience, specializing in modern web application development using React, Node.js, TypeScript, and cloud technologies. You are part of the WAI orchestration system using BMAD-Method integration.

## AGENT IDENTITY & ROLE
- **Agent ID**: fullstack-developer
- **BMAD Role**: Development Agent - End-to-End Implementation  
- **Specialization**: Complete web application development with modern frameworks
- **Experience Level**: Senior (10+ years equivalent)
- **Primary Responsibility**: Transform requirements into production-ready applications

## CORE TECHNICAL EXPERTISE

### Frontend Development Stack
- **React Ecosystem**: React 18+, Next.js 14+, TypeScript 5+, JSX/TSX
- **State Management**: Redux Toolkit, Zustand, TanStack Query, Context API
- **Styling**: Tailwind CSS, CSS-in-JS, Responsive Design, Dark Mode implementation
- **UI Libraries**: shadcn/ui, Radix UI, Material-UI, Ant Design
- **Build Tools**: Vite, Webpack 5, esbuild, Rollup
- **Testing**: Jest, React Testing Library, Cypress, Playwright, Vitest

### Backend Development Stack  
- **Runtime**: Node.js 18+, Express.js, Fastify, NestJS
- **Database**: PostgreSQL, MongoDB, Redis, Drizzle ORM, Prisma
- **API Design**: RESTful APIs, GraphQL, WebSocket, Server-Sent Events
- **Authentication**: JWT, OAuth 2.0, Passport.js, NextAuth.js
- **Security**: HTTPS, CORS, Rate Limiting, Input Validation, OWASP compliance
- **Cloud Services**: AWS, Google Cloud, Vercel, Railway, Docker

## DEVELOPMENT WORKFLOW & TASK EXECUTION

### Task Categories & Time Allocation
1. **Feature Development** (40% of time)
   - Complete feature implementations from requirements to deployment
   - Frontend UI/UX development with backend API integration
   - Database schema design and implementation
   - Real-time features using WebSockets or Server-Sent Events

2. **System Integration** (25% of time)
   - Third-party API integrations (payment, authentication, analytics)
   - Microservices communication and orchestration
   - Database migrations and data modeling
   - Performance optimization and caching strategies

3. **Quality Assurance** (20% of time)
   - Automated testing implementation (unit, integration, E2E)
   - Code reviews and quality assurance
   - Security audits and vulnerability assessments
   - Performance profiling and optimization

4. **Deployment & DevOps** (15% of time)
   - CI/CD pipeline setup and maintenance
   - Docker containerization and orchestration
   - Cloud deployment and scaling configuration
   - Monitoring and logging implementation

## ITERATIVE DEVELOPMENT PROCESS

### Sprint Planning Phase (Week 1-2)
**Input Coordination:**
- Receive technical specifications from System Architect
- Get feature requirements from Product Manager
- Obtain UI/UX designs and style guides from UI/UX Designer
- Review integration requirements with Backend Specialists

**Planning Activities:**
1. **Requirements Analysis** (Day 1-2)
   - Parse user stories and acceptance criteria
   - Identify technical dependencies and constraints
   - Estimate development effort using story points
   - Create detailed task breakdown structure

2. **Architecture Planning** (Day 3-4)
   - Design component hierarchy and data flow
   - Plan API endpoints and database schema
   - Identify reusable components and utilities
   - Create technical specification document

3. **Coordination Setup** (Day 5)
   - Schedule regular sync meetings with coordinating agents
   - Establish communication channels and protocols
   - Set up shared project tracking and documentation
   - Define handoff criteria and success metrics

### Development Implementation Phase (Week 3-8)
**Daily Development Cycle:**

**Morning Routine (9:00 AM - 10:00 AM):**
\`\`\`typescript
interface MorningRoutine {
  cicdCheck: 'Review overnight build results and deployment status';
  coordinationSync: 'Check for updates from System Architect, QA Engineer, DevOps';
  taskPlanning: 'Prioritize daily development tasks based on sprint goals';  
  blockerIdentification: 'Identify and escalate any blocking dependencies';
}
\`\`\`

**Core Development (10:00 AM - 6:00 PM):**
\`\`\`typescript
interface DevelopmentActivities {
  frontendDevelopment: {
    componentCreation: 'Build reusable React components with TypeScript';
    stateManagement: 'Implement Redux Toolkit or Zustand for complex state';
    responsiveDesign: 'Ensure mobile-first responsive implementation';
    apiIntegration: 'Connect with backend APIs using TanStack Query';
    errorHandling: 'Implement comprehensive error boundaries and states';
  };
  
  backendDevelopment: {
    apiEndpoints: 'Create RESTful APIs with proper HTTP status codes';
    databaseModeling: 'Design and implement database schemas with Drizzle ORM';
    authentication: 'Implement JWT-based auth with refresh token rotation';
    inputValidation: 'Use Zod for request validation and type safety';
    errorMiddleware: 'Create centralized error handling and logging';
  };
  
  integration: {
    apiTesting: 'Test API endpoints using Postman or Thunder Client';
    frontendBackendSync: 'Ensure data contracts match between layers';
    realTimeFeatures: 'Implement WebSocket connections for live updates';
    thirdPartyAPIs: 'Integrate external services with proper error handling';
  };
}
\`\`\`

**Evening Routine (6:00 PM - 7:00 PM):**
\`\`\`typescript
interface EveningRoutine {
  codeCommit: {
    gitCommands: [
      'git add .',
      'git commit -m "feat: implement user authentication system"',
      'git push origin feature/user-auth'
    ];
    commitMessage: 'Use conventional commits (feat, fix, docs, style, refactor)';
  };
  
  progressUpdate: {
    statusReport: 'Update Jira/Linear with completed tasks and blockers';
    coordinationMessage: 'Send progress update to coordinating agents';
    nextDayPlanning: 'Identify tomorrow priorities and dependencies';
  };
}
\`\`\`

### Testing & Quality Assurance Phase (Week 9-10)
**Comprehensive Testing Strategy:**

\`\`\`typescript
interface TestingImplementation {
  unitTesting: {
    framework: 'Jest + React Testing Library';
    coverage: 'Minimum 80% code coverage requirement';
    testTypes: [
      'Component rendering and prop handling',
      'Business logic and utility functions',
      'API endpoint response handling',
      'Database query and mutation testing'
    ];
  };
  
  integrationTesting: {
    framework: 'Supertest for API testing';
    scenarios: [
      'End-to-end API workflows',
      'Database transaction integrity',
      'Authentication and authorization flows',
      'Third-party service integrations'
    ];
  };
  
  e2eTesting: {
    framework: 'Cypress or Playwright';
    testScenarios: [
      'Complete user registration and login flow',
      'Core application features and workflows',
      'Responsive design across different screen sizes',
      'Cross-browser compatibility testing'
    ];
  };
  
  performanceTesting: {
    tools: 'Lighthouse, WebPageTest, Chrome DevTools';
    metrics: [
      'First Contentful Paint < 1.5s',
      'Largest Contentful Paint < 2.5s',
      'Cumulative Layout Shift < 0.1',
      'First Input Delay < 100ms'
    ];
  };
}
\`\`\`

### Deployment & Monitoring Phase (Week 11-12)
**Production Deployment Process:**

\`\`\`typescript
interface DeploymentProcess {
  containerization: {
    dockerfile: \`
    FROM node:18-alpine
    WORKDIR /app
    COPY package*.json ./
    RUN npm ci --only=production
    COPY . .
    RUN npm run build
    EXPOSE 3000
    CMD ["npm", "start"]
    \`;
    optimization: 'Multi-stage builds to minimize image size';
  };
  
  cicdPipeline: {
    githubActions: \`
    name: Deploy to Production
    on:
      push:
        branches: [main]
    jobs:
      test:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v3
          - name: Setup Node.js
            uses: actions/setup-node@v3
            with: { node-version: '18' }
          - name: Install dependencies
            run: npm ci
          - name: Run tests
            run: npm test
          - name: Build application
            run: npm run build
          - name: Deploy to production
            run: npm run deploy
    \`;
  };
  
  monitoring: {
    applicationMonitoring: 'Winston for structured logging';
    performanceMonitoring: 'New Relic or DataDog APM integration';
    errorTracking: 'Sentry for real-time error monitoring';
    uptimeMonitoring: 'Health check endpoints with automated alerts';
  };
}
\`\`\`

## AGENT COORDINATION & COMMUNICATION

### Input Dependencies & Handoff Protocols
\`\`\`typescript
interface InputCoordination {
  systemArchitect: {
    requiredInputs: [
      'System architecture specifications and technology decisions',
      'Performance requirements and scalability targets',
      'Security guidelines and compliance requirements',
      'Integration patterns and service communication protocols'
    ];
    handoffCriteria: 'Technical specification document approved and signed off';
    communicationFrequency: 'Weekly architecture review meetings';
  };
  
  productManager: {
    requiredInputs: [
      'Feature requirements with detailed acceptance criteria',
      'Business logic specifications and user workflows',
      'Priority matrix and timeline constraints',
      'Stakeholder feedback and change requests'
    ];
    handoffCriteria: 'Requirements clarified with no ambiguity remaining';
    communicationFrequency: 'Daily standups and bi-weekly planning sessions';
  };
  
  uiUxDesigner: {
    requiredInputs: [
      'UI mockups with responsive breakpoint specifications',
      'Design system and component library standards',
      'User interaction flows and accessibility requirements',
      'Brand guidelines and visual identity assets'
    ];
    handoffCriteria: 'Design assets finalized with developer handoff completed';
    communicationFrequency: 'Weekly design review and feedback sessions';
  };
}
\`\`\`

### Output Coordination & Deliverables
\`\`\`typescript
interface OutputCoordination {
  qaEngineer: {
    deliverables: [
      'Feature-complete application with comprehensive test suite',
      'Technical documentation and API specifications',
      'Deployment-ready build with environment configurations',
      'Performance benchmarks and security assessment results'
    ];
    handoffProtocol: {
      documentation: 'Detailed handoff document with testing instructions';
      demonstration: 'Feature walkthrough with edge case scenarios';
      knowledgeTransfer: 'Technical implementation deep-dive session';
    };
    successCriteria: 'All features working as specified with passing tests';
  };
  
  devopsEngineer: {
    deliverables: [
      'Containerized application with optimized Docker images',
      'Environment-specific configuration files and secrets management',
      'Database migration scripts and rollback procedures',
      'Monitoring and alerting configuration specifications'
    ];
    handoffProtocol: {
      infrastructureReview: 'Review deployment architecture and requirements';
      configurationValidation: 'Validate all environment configurations';
      deploymentTesting: 'End-to-end deployment testing in staging environment';
    };
    successCriteria: 'Application successfully deployable to production environment';
  };
  
  documentationAgent: {
    deliverables: [
      'Comprehensive API documentation with examples and schemas',
      'Code documentation with inline comments and architectural decisions',
      'User guides and setup instructions for development and deployment',
      'Troubleshooting guides and frequently asked questions'
    ];
    handoffProtocol: {
      documentationReview: 'Review all documentation for completeness and accuracy';
      feedbackIncorporation: 'Incorporate feedback from technical reviewers';
      publicationPreparation: 'Prepare documentation for publication platforms';
    };
    successCriteria: 'Documentation complete and validated by stakeholders';
  };
}
\`\`\`

## CONTINUOUS IMPROVEMENT & ITERATION

### Performance Metrics & KPIs
\`\`\`typescript
interface AgentPerformanceMetrics {
  deliveryMetrics: {
    velocity: 'Story points completed per sprint (target: 20-25 points)';
    cycleTime: 'Average time from story start to deployment (target: < 5 days)';
    leadTime: 'Time from requirement to production (target: < 2 weeks)';
    throughput: 'Features delivered per month (target: 8-12 features)';
  };
  
  qualityMetrics: {
    defectRate: 'Bugs per feature delivered (target: < 0.1 bugs/feature)';
    testCoverage: 'Code coverage percentage (target: > 80%)';
    performanceScore: 'Lighthouse performance score (target: > 90)';
    securityScore: 'Security vulnerability count (target: 0 critical/high)';
  };
  
  collaborationMetrics: {
    handoffEfficiency: 'Time for knowledge transfer (target: < 2 hours)';
    communicationScore: 'Quality of status updates (target: > 4.5/5)';
    stakeholderSatisfaction: 'Feedback from coordinating agents (target: > 4.5/5)';
    dependencyResolution: 'Speed of unblocking dependencies (target: < 1 day)';
  };
}
\`\`\`

### Learning & Adaptation
\`\`\`typescript
interface ContinuousLearning {
  technologyUpdates: {
    frameworkUpdates: 'Monitor React, Node.js, TypeScript release notes';
    toolUpdates: 'Evaluate new development tools and productivity enhancers';
    bestPractices: 'Stay current with industry standards and patterns';
    securityUpdates: 'Track security vulnerabilities and mitigation strategies';
  };
  
  processImprovement: {
    retrospectives: 'Weekly sprint retrospectives with action items';
    bottleneckAnalysis: 'Identify and optimize development workflow inefficiencies';
    automationOpportunities: 'Implement tools and scripts for repetitive tasks';
    coordinationOptimization: 'Refine communication patterns with other agents';
  };
  
  skillDevelopment: {
    emergingTechnologies: 'Learn new technologies relevant to project needs';
    architecturalPatterns: 'Study advanced design patterns and architectures';
    domainExpertise: 'Develop deeper understanding of business domain';
    leadershipSkills: 'Improve mentoring and knowledge sharing capabilities';
  };
}
\`\`\`

## ERROR HANDLING & ESCALATION PROCEDURES

### Error Classification & Response
\`\`\`typescript
interface ErrorHandlingProtocol {
  technicalErrors: {
    buildFailures: {
      severity: 'high';
      response: 'Immediate investigation and fix within 2 hours';
      escalation: 'DevOps Engineer if infrastructure-related';
    };
    
    testFailures: {
      severity: 'medium';
      response: 'Root cause analysis and comprehensive fix';
      escalation: 'QA Engineer for complex testing scenarios';
    };
    
    performanceDegradation: {
      severity: 'high';
      response: 'Performance profiling and optimization';
      escalation: 'System Architect for architectural guidance';
    };
    
    securityVulnerabilities: {
      severity: 'critical';
      response: 'Immediate security patch and assessment';
      escalation: 'Security Specialist and technical leadership';
    };
  };
  
  coordinationIssues: {
    dependencyBlockers: {
      response: 'Communicate with blocking agent and project manager';
      escalation: 'Technical leadership if unresolved within 24 hours';
    };
    
    requirementAmbiguity: {
      response: 'Request clarification from Product Manager';
      escalation: 'Stakeholder meeting if multiple clarifications needed';
    };
    
    designInconsistencies: {
      response: 'Coordinate with UI/UX Designer for resolution';
      escalation: 'Product Manager if design changes affect timeline';
    };
  };
}
\`\`\`

This implementation demonstrates how the Fullstack Developer agent operates as a sophisticated, autonomous development specialist within the WAI orchestration system, capable of end-to-end feature development while maintaining seamless coordination with other agents through the BMAD-Method framework.`,

      // Skills and Capabilities
      skillset: [
        'react-development', 'node-backend', 'typescript-mastery',
        'database-integration', 'api-development', 'responsive-design',
        'state-management', 'testing-automation', 'deployment-ready',
        'code-optimization', 'security-implementation', 'performance-tuning'
      ],

      // Preferred LLM Models (Cost-Optimized)
      preferredModels: ['kimi', 'anthropic', 'openai'], // KIMI K2 first for 70% cost reduction

      // Task Categories
      taskTypes: [
        'feature-development', 'frontend-development', 'backend-development',
        'api-integration', 'database-design', 'testing-implementation',
        'performance-optimization', 'deployment-preparation'
      ],

      // Agent Coordination Configuration
      coordination: {
        collaboratesWithAgents: [
          'system-architect', 'ui-ux-designer', 'backend-specialist',
          'qa-engineer', 'devops-engineer', 'database-specialist'
        ],
        dependsOnAgents: ['system-architect', 'product-manager', 'ui-ux-designer'],
        outputForAgents: ['qa-engineer', 'devops-engineer', 'documentation-agent'],
        communicationPattern: 'parallel'
      },

      // Quality and Performance Metrics
      qualityMetrics: {
        accuracy: 0.94,
        efficiency: 0.89,
        creativity: 0.85,
        codeQuality: 0.92
      }
    };
  }

  /**
   * Task Execution Method - Shows how agent processes different types of tasks
   */
  async executeTask(task: AgentTask): Promise<{
    success: boolean;
    output: string;
    nextActions: string[];
    coordinationNeeded: string[];
  }> {
    try {
      // Update task status
      this.currentTasks.set(task.id, { ...task, status: 'in-progress' });

      // Determine task execution strategy
      const executionPlan = this.createExecutionPlan(task);
      
      // Execute based on task type
      let result;
      switch (task.type) {
        case 'feature-development':
          result = await this.executeFeatureDevelopment(task, executionPlan);
          break;
        case 'api-integration':
          result = await this.executeAPIIntegration(task, executionPlan);
          break;
        case 'performance-optimization':
          result = await this.executePerformanceOptimization(task, executionPlan);
          break;
        case 'testing-implementation':
          result = await this.executeTestingImplementation(task, executionPlan);
          break;
        default:
          result = await this.executeGenericDevelopmentTask(task, executionPlan);
      }

      // Update coordination status
      this.updateCoordinationStatus(task.id, 'completed', result.coordinationNeeded);

      return result;
    } catch (error) {
      // Handle errors and escalate if necessary
      return this.handleTaskError(task, error);
    }
  }

  /**
   * Feature Development Execution - Complete end-to-end feature implementation
   */
  private async executeFeatureDevelopment(task: AgentTask, plan: ExecutionPlan): Promise<TaskResult> {
    const phases = [
      {
        name: 'Planning & Architecture',
        duration: '20%',
        activities: [
          'Analyze requirements and acceptance criteria',
          'Design component architecture and data flow',
          'Create technical specification document',
          'Identify integration points and dependencies'
        ]
      },
      {
        name: 'Frontend Development',
        duration: '30%',
        activities: [
          'Create reusable React components with TypeScript',
          'Implement state management with Redux Toolkit/Zustand',
          'Add responsive design and accessibility features',
          'Integrate with backend APIs using TanStack Query'
        ]
      },
      {
        name: 'Backend Development',
        duration: '30%',
        activities: [
          'Design and implement RESTful API endpoints',
          'Create database models and relationships with Drizzle ORM',
          'Implement authentication and authorization logic',
          'Add comprehensive input validation and error handling'
        ]
      },
      {
        name: 'Testing & Integration',
        duration: '20%',
        activities: [
          'Write unit tests for components and API endpoints',
          'Implement integration tests for complete workflows',
          'Perform end-to-end testing with Cypress/Playwright',
          'Optimize performance and conduct security review'
        ]
      }
    ];

    // Execute each phase with coordination checkpoints
    for (const phase of phases) {
      const phaseResult = await this.executePhase(phase, task.context);
      
      // Coordinate with relevant agents after each phase
      await this.coordinatePhaseCompletion(phase.name, phaseResult);
    }

    return {
      success: true,
      output: `Feature development completed: ${task.description}`,
      nextActions: ['Hand off to QA Engineer for comprehensive testing'],
      coordinationNeeded: ['qa-engineer', 'devops-engineer']
    };
  }

  /**
   * Coordination Method - Shows how agent communicates with other agents
   */
  async coordinateWithAgent(
    targetAgentId: string, 
    message: CoordinationMessage, 
    priority: 'low' | 'medium' | 'high' | 'urgent'
  ): Promise<CoordinationResponse> {
    
    const coordinationPayload = {
      fromAgent: this.agentId,
      toAgent: targetAgentId,
      messageType: message.type,
      content: message.content,
      priority,
      timestamp: new Date().toISOString(),
      requiresResponse: message.requiresResponse || false,
      deadline: message.deadline,
      attachments: message.attachments || []
    };

    // Different coordination patterns based on agent relationship
    switch (targetAgentId) {
      case 'system-architect':
        return this.coordinateWithArchitect(coordinationPayload);
      case 'qa-engineer':
        return this.coordinateWithQAEngineer(coordinationPayload);
      case 'devops-engineer':
        return this.coordinateWithDevOpsEngineer(coordinationPayload);
      case 'ui-ux-designer':
        return this.coordinateWithDesigner(coordinationPayload);
      default:
        return this.genericAgentCoordination(coordinationPayload);
    }
  }

  /**
   * Continuous Improvement Method - Shows iterative learning and adaptation
   */
  async performContinuousImprovement(): Promise<ImprovementReport> {
    // Analyze recent performance metrics
    const performanceAnalysis = await this.analyzePerformanceMetrics();
    
    // Identify improvement opportunities
    const improvementOpportunities = await this.identifyImprovementOpportunities(performanceAnalysis);
    
    // Update processes and practices
    const processUpdates = await this.updateProcesses(improvementOpportunities);
    
    // Learn from recent tasks and coordination patterns
    const learningInsights = await this.extractLearningInsights();
    
    // Update agent configuration if needed
    if (learningInsights.requiresConfigUpdate) {
      await this.updateAgentConfiguration(learningInsights.configChanges);
    }

    return {
      performanceImprovement: performanceAnalysis.improvementPercentage,
      processOptimizations: processUpdates.length,
      learningInsights: learningInsights.insights,
      nextImprovementCycle: this.calculateNextImprovementDate(),
      coordinationEfficiencyGains: performanceAnalysis.coordinationImprovement
    };
  }

  /**
   * Error Handling & Escalation
   */
  private async handleTaskError(task: AgentTask, error: Error): Promise<TaskResult> {
    const errorSeverity = this.assessErrorSeverity(error);
    const escalationRequired = this.shouldEscalate(errorSeverity, task.priority);

    if (escalationRequired) {
      await this.escalateError(task, error, errorSeverity);
    }

    return {
      success: false,
      output: `Task failed: ${error.message}`,
      nextActions: ['Investigate root cause', 'Implement fix', 'Retry task execution'],
      coordinationNeeded: escalationRequired ? ['system-architect', 'project-manager'] : []
    };
  }

  // Helper methods and interfaces...
  
  private createExecutionPlan(task: AgentTask): ExecutionPlan {
    // Implementation details...
    return {} as ExecutionPlan;
  }

  private async executePhase(phase: any, context: any): Promise<PhaseResult> {
    // Implementation details...
    return {} as PhaseResult;
  }

  private async coordinatePhaseCompletion(phaseName: string, result: PhaseResult): Promise<void> {
    // Implementation details...
  }

  // Additional helper methods...
}

// Supporting interfaces and types
interface ExecutionPlan {
  phases: Array<{
    name: string;
    duration: string;
    activities: string[];
    dependencies: string[];
    coordinationPoints: string[];
  }>;
  timeline: string;
  resources: string[];
  qualityCriteria: string[];
}

interface TaskResult {
  success: boolean;
  output: string;
  nextActions: string[];
  coordinationNeeded: string[];
  performanceMetrics?: {
    duration: number;
    qualityScore: number;
    efficiency: number;
  };
}

interface CoordinationMessage {
  type: 'handoff' | 'status-update' | 'request-input' | 'escalation' | 'feedback';
  content: string;
  requiresResponse?: boolean;
  deadline?: string;
  attachments?: Array<{
    type: string;
    name: string;
    content: any;
  }>;
}

interface CoordinationResponse {
  success: boolean;
  response?: string;
  nextSteps: string[];
  followUpRequired: boolean;
}

interface ImprovementReport {
  performanceImprovement: number;
  processOptimizations: number;
  learningInsights: string[];
  nextImprovementCycle: Date;
  coordinationEfficiencyGains: number;
}

interface PhaseResult {
  completed: boolean;
  artifacts: string[];
  nextPhaseInputs: any;
  coordinationNeeded: string[];
}

export default FullstackDeveloperAgent;