/**
 * WAI Request Builder Usage Examples
 * 
 * Demonstrates how to use the type-safe WAI Request Builder for common scenarios
 */

import {
  WAIRequestBuilder,
  createDevelopmentRequest,
  createCreativeRequest,
  createAnalysisRequest,
  createEnterpriseRequest,
  validateOrchestrationRequest
} from './wai-request-builder';

// ================================================================================================
// BASIC USAGE EXAMPLES
// ================================================================================================

/**
 * Example 1: Simple development task
 */
export function exampleSimpleDevelopment() {
  const request = createDevelopmentRequest(
    'Create a React component for user authentication with email and password'
  )
    .setPriority('high')
    .enableCostOptimization()
    .build();

  return request;
}

/**
 * Example 2: Creative content generation with preferences
 */
export function exampleCreativeContent() {
  const request = createCreativeRequest(
    'Generate a blog post about AI orchestration in modern web applications'
  )
    .setPriority('medium')
    .setQualityThreshold(0.9)
    .setPreferredProviders(['claude-3-5-sonnet', 'gpt-4'])
    .addParameter('wordCount', 1500)
    .addParameter('tone', 'professional')
    .addParameter('targetAudience', 'developers')
    .build();

  return request;
}

/**
 * Example 3: Code analysis with context
 */
export function exampleCodeAnalysis() {
  const request = createAnalysisRequest(
    'Analyze the security vulnerabilities in the authentication system'
  )
    .setPriority('critical')
    .setContext({
      projectId: 'proj-123',
      userId: 'user-456',
      filePaths: ['/server/auth/', '/server/middleware/'],
      framework: 'Express.js'
    })
    .setPreferences({
      qualityThreshold: 0.95,
      timeConstraint: 30000, // 30 seconds
      prohibitedProviders: ['gpt-3.5-turbo'] // Require advanced models
    })
    .build();

  return request;
}

/**
 * Example 4: Enterprise workflow orchestration
 */
export function exampleEnterpriseWorkflow() {
  const request = createEnterpriseRequest(
    'Orchestrate a complete CI/CD pipeline setup with automated testing and deployment'
  )
    .setPriority('high')
    .setParameters({
      platform: 'kubernetes',
      environment: 'production',
      scalingPolicy: 'auto',
      monitoringEnabled: true
    })
    .setContext({
      organizationId: 'org-789',
      projectId: 'proj-123',
      teamMembers: ['dev-1', 'dev-2', 'ops-1']
    })
    .setMetadata({
      requester: 'admin@company.com',
      department: 'Engineering',
      costCenter: 'CC-1234'
    })
    .enableCostOptimization(false) // Enterprise requires quality over cost
    .setQualityThreshold(0.98)
    .build();

  return request;
}

/**
 * Example 5: Hybrid multi-stage orchestration
 */
export function exampleHybridOrchestration() {
  const request = new WAIRequestBuilder()
    .setType('hybrid')
    .setTask('Design, develop, and deploy a complete user management system')
    .setPriority('critical')
    .setParameters({
      stages: ['design', 'development', 'testing', 'deployment'],
      technologies: ['React', 'Node.js', 'PostgreSQL', 'Docker'],
      requirements: {
        authentication: ['email', 'oauth', '2fa'],
        authorization: ['rbac', 'permissions'],
        features: ['profile', 'settings', 'notifications']
      }
    })
    .setContext({
      projectId: 'proj-456',
      userId: 'user-789',
      timeline: '2 weeks',
      budget: 'unlimited'
    })
    .setPreferences({
      costOptimization: false,
      qualityThreshold: 0.99,
      preferredProviders: [
        'claude-3-5-sonnet', // For architecture
        'gpt-4', // For code generation
        'gemini-pro' // For documentation
      ]
    })
    .addMetadata('urgent', true)
    .addMetadata('stakeholders', ['CTO', 'Product Manager'])
    .build();

  return request;
}

// ================================================================================================
// ADVANCED PATTERNS
// ================================================================================================

/**
 * Example 6: Request with validation and error handling
 */
export function exampleWithValidation() {
  const builder = createDevelopmentRequest('Build a REST API endpoint');

  // Add configuration
  builder
    .setPriority('high')
    .addParameter('method', 'POST')
    .addParameter('path', '/api/users')
    .addContext('framework', 'Express.js');

  // Use safe build for error handling
  const result = builder.safeBuild();

  if (result.success) {
    console.log('✅ Valid request:', result.data);
    return result.data;
  } else {
    console.error('❌ Validation errors:', result.error.errors);
    throw result.error;
  }
}

/**
 * Example 7: Clone and modify pattern
 */
export function exampleCloneAndModify() {
  // Base request for code generation
  const baseRequest = createDevelopmentRequest('Generate TypeScript code')
    .enableCostOptimization()
    .setPreferredProviders(['gpt-4', 'claude-3-5-sonnet']);

  // Clone for different priorities
  const urgentRequest = baseRequest.clone()
    .setPriority('critical')
    .setTask('Generate critical bug fix code')
    .build();

  const normalRequest = baseRequest.clone()
    .setPriority('medium')
    .setTask('Generate feature enhancement code')
    .build();

  return { urgentRequest, normalRequest };
}

/**
 * Example 8: Validate external request data
 */
export function exampleValidateExternalRequest(externalData: unknown) {
  try {
    // Validate incoming request from API or user
    const validatedRequest = validateOrchestrationRequest(externalData);
    console.log('✅ External request is valid:', validatedRequest);
    return validatedRequest;
  } catch (error) {
    console.error('❌ Invalid external request:', error);
    throw new Error('Invalid orchestration request format');
  }
}

// ================================================================================================
// INTEGRATION HELPERS
// ================================================================================================

/**
 * Create request from user input (frontend integration)
 */
export function createRequestFromUserInput(input: {
  task: string;
  type: 'development' | 'creative' | 'analysis' | 'enterprise' | 'hybrid';
  userId: string;
  projectId?: string;
  urgent?: boolean;
}) {
  const builder = new WAIRequestBuilder()
    .setType(input.type)
    .setTask(input.task)
    .setPriority(input.urgent ? 'critical' : 'medium')
    .setContext({
      userId: input.userId,
      projectId: input.projectId,
      timestamp: new Date().toISOString()
    })
    .enableCostOptimization(true);

  return builder.build();
}

/**
 * Create request for Wizards Incubator workflows
 */
export function createWizardsIncubatorRequest(params: {
  studioType: 'code' | 'design' | 'content' | 'business' | 'ai-assistant';
  task: string;
  founderId: string;
  startupId: string;
  sessionId: string;
}) {
  const typeMapping: Record<typeof params.studioType, 'development' | 'creative' | 'enterprise' | 'hybrid'> = {
    'code': 'development',
    'design': 'creative',
    'content': 'creative',
    'business': 'enterprise',
    'ai-assistant': 'hybrid'
  };

  const request = new WAIRequestBuilder()
    .setType(typeMapping[params.studioType])
    .setTask(params.task)
    .setPriority('high')
    .setContext({
      founderId: params.founderId,
      startupId: params.startupId,
      sessionId: params.sessionId,
      studio: params.studioType,
      platform: 'wizards-incubator'
    })
    .setPreferences({
      costOptimization: true,
      qualityThreshold: 0.9
    })
    .addMetadata('platform', 'wizards-incubator')
    .addMetadata('studioType', params.studioType)
    .build();

  return request;
}
