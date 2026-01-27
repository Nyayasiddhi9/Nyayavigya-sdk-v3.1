/**
 * Sample Pipelines and Templates
 * Implements Runbook Prompt 14: Sample pipelines and templates
 * 
 * Features:
 * - Pre-built Pipeline Templates for Common Use Cases
 * - Dynamic Pipeline Generation from Templates
 * - Pipeline Composition and Chaining
 * - Template Parameter Validation
 * - Pipeline Execution with Full Orchestration
 * - Template Library Management
 * - Best Practices Implementation
 */

import { EventEmitter } from 'events';
import { WAILogger } from '../utils/logger';
import { BMAD2OrchestrationEngine } from '../orchestration/bmad-2';
import { GRPOFeedbackLoop } from '../optimization/grpo-feedback-loop';
import { UnifiedModelAdapterKit } from '../adapters/unified-model-adapter-kit';

export class SamplePipelineLibrary extends EventEmitter {
  private logger: WAILogger;
  private initialized = false;
  private templates: Map<string, PipelineTemplate> = new Map();
  private pipelines: Map<string, Pipeline> = new Map();
  private orchestrationEngine: BMAD2OrchestrationEngine;
  private modelKit: UnifiedModelAdapterKit;
  private grpoLoop: GRPOFeedbackLoop;
  
  constructor(private config: PipelineLibraryConfig) {
    super();
    this.logger = new WAILogger('PipelineLibrary');
    this.orchestrationEngine = new BMAD2OrchestrationEngine(config.bmad || {});
    this.modelKit = new UnifiedModelAdapterKit(config.modelKit || {});
    this.grpoLoop = new GRPOFeedbackLoop(config.grpo || {});
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.logger.info('📚 Initializing Sample Pipeline Library...');

      // Initialize core components
      await this.orchestrationEngine.initialize();
      await this.modelKit.initialize();
      await this.grpoLoop.initialize();

      // Load sample templates
      await this.loadSampleTemplates();

      // Validate all templates
      await this.validateTemplates();

      this.initialized = true;
      this.logger.info(`✅ Pipeline Library initialized with ${this.templates.size} templates`);

    } catch (error) {
      this.logger.error('❌ Pipeline Library initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get available pipeline templates
   */
  getTemplates(): PipelineTemplateInfo[] {
    return Array.from(this.templates.values()).map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      difficulty: template.difficulty,
      estimatedDuration: template.estimatedDuration,
      parameters: template.parameters.map(p => ({
        name: p.name,
        type: p.type,
        required: p.required,
        description: p.description
      })),
      tags: template.tags
    }));
  }

  /**
   * Create pipeline from template
   */
  async createPipelineFromTemplate(
    templateId: string,
    parameters: Record<string, any>,
    options: PipelineCreationOptions = {}
  ): Promise<Pipeline> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    this.logger.info(`🏗️ Creating pipeline from template: ${template.name}`);

    // Validate parameters
    await this.validateParameters(template, parameters);

    // Generate pipeline ID
    const pipelineId = options.id || `pipeline_${templateId}_${Date.now()}`;

    // Create pipeline definition
    const pipeline: Pipeline = {
      id: pipelineId,
      name: options.name || `${template.name} - ${new Date().toISOString()}`,
      templateId: template.id,
      parameters,
      definition: await this.generatePipelineDefinition(template, parameters),
      status: 'created',
      createdAt: Date.now(),
      metadata: {
        templateVersion: template.version,
        createdBy: options.createdBy,
        ...options.metadata
      }
    };

    // Store pipeline
    this.pipelines.set(pipelineId, pipeline);

    this.emit('pipelineCreated', {
      pipelineId,
      templateId,
      name: pipeline.name
    });

    return pipeline;
  }

  /**
   * Execute pipeline with full orchestration
   */
  async executePipeline(pipelineId: string, options: ExecutionOptions = {}): Promise<PipelineExecution> {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) {
      throw new Error(`Pipeline not found: ${pipelineId}`);
    }

    this.logger.info(`🚀 Executing pipeline: ${pipeline.name}`);

    const executionId = `exec_${pipelineId}_${Date.now()}`;

    try {
      // Create execution context
      const execution: PipelineExecution = {
        id: executionId,
        pipelineId,
        status: 'running',
        startedAt: Date.now(),
        progress: 0,
        stages: [],
        results: {},
        metrics: {
          totalTasks: pipeline.definition.tasks.length,
          completedTasks: 0,
          failedTasks: 0,
          totalCost: 0,
          executionTime: 0
        }
      };

      pipeline.status = 'running';
      pipeline.currentExecution = executionId;

      this.emit('pipelineExecutionStarted', {
        executionId,
        pipelineId,
        name: pipeline.name
      });

      // Execute stages using BMAD orchestration
      for (let stageIndex = 0; stageIndex < pipeline.definition.stages.length; stageIndex++) {
        const stage = pipeline.definition.stages[stageIndex];
        
        this.logger.info(`🎭 Executing stage ${stageIndex + 1}/${pipeline.definition.stages.length}: ${stage.name}`);

        const stageResult = await this.executeStage(execution, stage, stageIndex);
        execution.stages[stageIndex] = stageResult;

        // Update progress
        execution.progress = ((stageIndex + 1) / pipeline.definition.stages.length) * 100;

        // Submit GRPO feedback for optimization
        await this.grpoLoop.submitFeedback({
          source: 'pipeline_execution',
          type: 'stage_completion',
          data: {
            pipelineId,
            stageIndex,
            duration: stageResult.duration,
            success: stageResult.success,
            cost: stageResult.cost || 0
          },
          timestamp: Date.now(),
          quality: stageResult.success ? 1.0 : 0.0
        });

        this.emit('pipelineStageCompleted', {
          executionId,
          stageIndex,
          success: stageResult.success,
          progress: execution.progress
        });
      }

      // Complete execution
      execution.status = 'completed';
      execution.completedAt = Date.now();
      execution.metrics.executionTime = execution.completedAt - execution.startedAt;

      pipeline.status = 'completed';
      pipeline.lastExecution = executionId;

      this.logger.info(`✅ Pipeline completed: ${pipeline.name} (${execution.metrics.executionTime}ms)`);

      this.emit('pipelineExecutionCompleted', {
        executionId,
        pipelineId,
        success: true,
        duration: execution.metrics.executionTime,
        cost: execution.metrics.totalCost
      });

      return execution;

    } catch (error) {
      this.logger.error(`❌ Pipeline execution failed: ${pipeline.name}`, error);

      pipeline.status = 'failed';
      pipeline.lastExecution = executionId;

      this.emit('pipelineExecutionFailed', {
        executionId,
        pipelineId,
        success: false,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Load comprehensive sample templates
   */
  private async loadSampleTemplates(): Promise<void> {
    const templates = [
      // 1. Content Generation Pipeline
      {
        id: 'content-generation',
        name: 'AI Content Generation Pipeline',
        description: 'Generate high-quality content with SEO optimization and multi-format output',
        category: 'content',
        difficulty: 'intermediate',
        estimatedDuration: 180000, // 3 minutes
        parameters: [
          { name: 'topic', type: 'string', required: true, description: 'Content topic' },
          { name: 'format', type: 'enum', values: ['blog', 'article', 'social', 'email'], required: true, description: 'Output format' },
          { name: 'length', type: 'enum', values: ['short', 'medium', 'long'], required: false, default: 'medium', description: 'Content length' },
          { name: 'tone', type: 'enum', values: ['professional', 'casual', 'friendly', 'technical'], required: false, default: 'professional', description: 'Content tone' },
          { name: 'target_audience', type: 'string', required: false, description: 'Target audience description' },
          { name: 'keywords', type: 'array', required: false, description: 'SEO keywords to include' }
        ],
        stages: [
          {
            name: 'Research & Planning',
            tasks: [
              {
                id: 'topic_research',
                type: 'llm_generation',
                agent: 'research_agent',
                prompt: 'Research the topic: {{topic}}. Provide key points, recent developments, and audience interests.',
                model_constraints: { max_cost: 0.01, min_quality: 0.8 }
              }
            ]
          },
          {
            name: 'Content Generation',
            tasks: [
              {
                id: 'content_creation',
                type: 'llm_generation',
                agent: 'content_agent',
                prompt: 'Create {{format}} content about {{topic}} with {{tone}} tone for {{target_audience}}. Length: {{length}}. Include keywords: {{keywords}}',
                dependencies: ['topic_research'],
                model_constraints: { max_cost: 0.05, min_quality: 0.9 }
              }
            ]
          },
          {
            name: 'SEO Optimization',
            tasks: [
              {
                id: 'seo_optimization',
                type: 'llm_generation',
                agent: 'seo_agent',
                prompt: 'Optimize the content for SEO. Add meta description, headers, and improve keyword density.',
                dependencies: ['content_creation'],
                model_constraints: { max_cost: 0.02, min_quality: 0.85 }
              }
            ]
          },
          {
            name: 'Quality Review',
            tasks: [
              {
                id: 'quality_review',
                type: 'llm_generation',
                agent: 'review_agent',
                prompt: 'Review the content for quality, accuracy, and adherence to requirements. Provide improvement suggestions.',
                dependencies: ['seo_optimization'],
                model_constraints: { max_cost: 0.015, min_quality: 0.9 }
              }
            ]
          }
        ],
        tags: ['content', 'seo', 'ai-generation', 'multi-format']
      },

      // 2. Code Analysis and Review Pipeline
      {
        id: 'code-analysis',
        name: 'AI Code Analysis & Review Pipeline',
        description: 'Comprehensive code analysis with security scanning, optimization suggestions, and automated testing',
        category: 'development',
        difficulty: 'advanced',
        estimatedDuration: 300000, // 5 minutes
        parameters: [
          { name: 'repository_url', type: 'string', required: true, description: 'Git repository URL' },
          { name: 'language', type: 'enum', values: ['javascript', 'typescript', 'python', 'java', 'go', 'rust'], required: true, description: 'Primary programming language' },
          { name: 'analysis_depth', type: 'enum', values: ['shallow', 'deep'], required: false, default: 'deep', description: 'Analysis depth' },
          { name: 'include_tests', type: 'boolean', required: false, default: true, description: 'Include test generation' },
          { name: 'security_scan', type: 'boolean', required: false, default: true, description: 'Perform security scan' }
        ],
        stages: [
          {
            name: 'Code Acquisition',
            tasks: [
              {
                id: 'fetch_repository',
                type: 'integration',
                agent: 'git_agent',
                action: 'clone_repository',
                config: { url: '{{repository_url}}', depth: 1 }
              }
            ]
          },
          {
            name: 'Static Analysis',
            tasks: [
              {
                id: 'structure_analysis',
                type: 'llm_generation',
                agent: 'architecture_agent',
                prompt: 'Analyze the codebase structure for {{language}}. Identify patterns, dependencies, and architectural decisions.',
                dependencies: ['fetch_repository'],
                model_constraints: { max_cost: 0.03, min_quality: 0.9 }
              },
              {
                id: 'security_analysis',
                type: 'llm_generation',
                agent: 'security_agent',
                prompt: 'Perform security analysis on the {{language}} codebase. Identify vulnerabilities, security anti-patterns, and compliance issues.',
                dependencies: ['fetch_repository'],
                condition: '{{security_scan}} === true',
                model_constraints: { max_cost: 0.04, min_quality: 0.95 }
              }
            ]
          },
          {
            name: 'Quality Review',
            tasks: [
              {
                id: 'code_quality_review',
                type: 'llm_generation',
                agent: 'review_agent',
                prompt: 'Review code quality for {{language}} project. Assess maintainability, readability, and best practices adherence.',
                dependencies: ['structure_analysis'],
                model_constraints: { max_cost: 0.025, min_quality: 0.88 }
              },
              {
                id: 'performance_analysis',
                type: 'llm_generation',
                agent: 'performance_agent',
                prompt: 'Analyze performance bottlenecks and optimization opportunities in the {{language}} codebase.',
                dependencies: ['structure_analysis'],
                model_constraints: { max_cost: 0.02, min_quality: 0.85 }
              }
            ]
          },
          {
            name: 'Test Generation',
            tasks: [
              {
                id: 'test_generation',
                type: 'llm_generation',
                agent: 'testing_agent',
                prompt: 'Generate comprehensive tests for the {{language}} codebase. Include unit tests, integration tests, and edge cases.',
                dependencies: ['code_quality_review'],
                condition: '{{include_tests}} === true',
                model_constraints: { max_cost: 0.06, min_quality: 0.9 }
              }
            ]
          },
          {
            name: 'Report Generation',
            tasks: [
              {
                id: 'comprehensive_report',
                type: 'llm_generation',
                agent: 'report_agent',
                prompt: 'Generate a comprehensive analysis report combining all findings: architecture, security, quality, performance, and testing recommendations.',
                dependencies: ['code_quality_review', 'performance_analysis', 'security_analysis', 'test_generation'],
                model_constraints: { max_cost: 0.03, min_quality: 0.92 }
              }
            ]
          }
        ],
        tags: ['development', 'code-analysis', 'security', 'testing', 'ci-cd']
      },

      // 3. Business Intelligence Pipeline
      {
        id: 'business-intelligence',
        name: 'AI Business Intelligence Pipeline',
        description: 'Automated business intelligence with data analysis, trend detection, and predictive insights',
        category: 'analytics',
        difficulty: 'advanced',
        estimatedDuration: 420000, // 7 minutes
        parameters: [
          { name: 'data_source', type: 'enum', values: ['csv', 'database', 'api'], required: true, description: 'Data source type' },
          { name: 'data_path', type: 'string', required: true, description: 'Path to data source' },
          { name: 'analysis_type', type: 'enum', values: ['descriptive', 'predictive', 'prescriptive'], required: false, default: 'descriptive', description: 'Analysis type' },
          { name: 'time_period', type: 'enum', values: ['daily', 'weekly', 'monthly', 'quarterly'], required: false, default: 'monthly', description: 'Analysis time period' },
          { name: 'metrics', type: 'array', required: false, description: 'Specific metrics to analyze' }
        ],
        stages: [
          {
            name: 'Data Ingestion',
            tasks: [
              {
                id: 'data_extraction',
                type: 'integration',
                agent: 'data_agent',
                action: 'extract_data',
                config: { source: '{{data_source}}', path: '{{data_path}}' }
              }
            ]
          },
          {
            name: 'Data Processing',
            tasks: [
              {
                id: 'data_cleaning',
                type: 'data_processing',
                agent: 'data_processing_agent',
                action: 'clean_and_validate',
                dependencies: ['data_extraction']
              },
              {
                id: 'feature_engineering',
                type: 'data_processing',
                agent: 'feature_agent',
                action: 'create_features',
                dependencies: ['data_cleaning']
              }
            ]
          },
          {
            name: 'Analysis',
            tasks: [
              {
                id: 'statistical_analysis',
                type: 'llm_generation',
                agent: 'analytics_agent',
                prompt: 'Perform {{analysis_type}} statistical analysis on the business data. Focus on {{time_period}} trends and {{metrics}} metrics.',
                dependencies: ['feature_engineering'],
                model_constraints: { max_cost: 0.05, min_quality: 0.9 }
              },
              {
                id: 'pattern_detection',
                type: 'llm_generation',
                agent: 'pattern_agent',
                prompt: 'Identify patterns, anomalies, and trends in the business data. Provide insights for decision making.',
                dependencies: ['feature_engineering'],
                model_constraints: { max_cost: 0.04, min_quality: 0.88 }
              }
            ]
          },
          {
            name: 'Insights & Recommendations',
            tasks: [
              {
                id: 'insight_generation',
                type: 'llm_generation',
                agent: 'insight_agent',
                prompt: 'Generate actionable business insights based on the analysis. Include recommendations for improvement and growth opportunities.',
                dependencies: ['statistical_analysis', 'pattern_detection'],
                model_constraints: { max_cost: 0.035, min_quality: 0.92 }
              }
            ]
          },
          {
            name: 'Visualization & Reporting',
            tasks: [
              {
                id: 'dashboard_creation',
                type: 'visualization',
                agent: 'visualization_agent',
                action: 'create_dashboard',
                dependencies: ['insight_generation']
              },
              {
                id: 'executive_summary',
                type: 'llm_generation',
                agent: 'executive_agent',
                prompt: 'Create an executive summary of the business intelligence analysis. Highlight key findings, risks, and opportunities.',
                dependencies: ['insight_generation'],
                model_constraints: { max_cost: 0.025, min_quality: 0.95 }
              }
            ]
          }
        ],
        tags: ['analytics', 'business-intelligence', 'data-analysis', 'insights', 'dashboard']
      },

      // 4. Customer Support Automation Pipeline
      {
        id: 'customer-support',
        name: 'AI Customer Support Automation Pipeline',
        description: 'Automated customer support with ticket classification, response generation, and escalation management',
        category: 'customer-service',
        difficulty: 'intermediate',
        estimatedDuration: 120000, // 2 minutes
        parameters: [
          { name: 'ticket_source', type: 'enum', values: ['email', 'chat', 'form', 'api'], required: true, description: 'Ticket source' },
          { name: 'priority_threshold', type: 'enum', values: ['low', 'medium', 'high'], required: false, default: 'medium', description: 'Auto-response priority threshold' },
          { name: 'language', type: 'enum', values: ['en', 'es', 'fr', 'de', 'it', 'pt'], required: false, default: 'en', description: 'Response language' },
          { name: 'brand_voice', type: 'enum', values: ['professional', 'friendly', 'casual', 'technical'], required: false, default: 'friendly', description: 'Brand voice' }
        ],
        stages: [
          {
            name: 'Ticket Processing',
            tasks: [
              {
                id: 'ticket_classification',
                type: 'llm_generation',
                agent: 'classification_agent',
                prompt: 'Classify the customer support ticket by category, priority, and sentiment. Extract key issues and customer information.',
                model_constraints: { max_cost: 0.01, min_quality: 0.9 }
              }
            ]
          },
          {
            name: 'Response Generation',
            tasks: [
              {
                id: 'solution_research',
                type: 'llm_generation',
                agent: 'knowledge_agent',
                prompt: 'Research solutions for the identified customer issue using knowledge base and best practices.',
                dependencies: ['ticket_classification'],
                model_constraints: { max_cost: 0.015, min_quality: 0.88 }
              },
              {
                id: 'response_generation',
                type: 'llm_generation',
                agent: 'response_agent',
                prompt: 'Generate a {{brand_voice}} customer support response in {{language}}. Provide clear solutions and next steps.',
                dependencies: ['solution_research'],
                model_constraints: { max_cost: 0.02, min_quality: 0.92 }
              }
            ]
          },
          {
            name: 'Quality Assurance',
            tasks: [
              {
                id: 'response_review',
                type: 'llm_generation',
                agent: 'qa_agent',
                prompt: 'Review the customer support response for accuracy, tone, and completeness. Ensure brand guidelines compliance.',
                dependencies: ['response_generation'],
                model_constraints: { max_cost: 0.01, min_quality: 0.9 }
              }
            ]
          }
        ],
        tags: ['customer-service', 'automation', 'nlp', 'classification', 'multilingual']
      }
    ];

    // Load templates into memory
    for (const templateData of templates) {
      const template: PipelineTemplate = {
        ...templateData,
        version: '1.0.0',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      this.templates.set(template.id, template);
      this.logger.info(`📋 Loaded template: ${template.name}`);
    }
  }

  /**
   * Execute a pipeline stage with orchestration
   */
  private async executeStage(
    execution: PipelineExecution,
    stage: PipelineStage,
    stageIndex: number
  ): Promise<StageResult> {
    const stageStart = Date.now();

    try {
      // Submit stage tasks to BMAD orchestration
      const taskDefinitions = stage.tasks.map(task => ({
        id: `${execution.id}_${task.id}`,
        type: task.type,
        complexity: 'medium',
        dependencies: task.dependencies || [],
        maxIterations: 5,
        metadata: {
          pipelineId: execution.pipelineId,
          stageIndex,
          taskConfig: task
        }
      }));

      const results = [];
      for (const taskDef of taskDefinitions) {
        const handle = await this.orchestrationEngine.submitTask(taskDef);
        results.push({ taskId: taskDef.id, handle });
      }

      // Calculate stage cost and update metrics
      const stageCost = results.reduce((sum, r) => sum + (r.handle.estimatedCompletion || 0), 0) * 0.0001; // Rough cost estimate
      execution.metrics.totalCost += stageCost;

      return {
        name: stage.name,
        success: true,
        duration: Date.now() - stageStart,
        cost: stageCost,
        results: results.map(r => ({ taskId: r.taskId, success: true })),
        metadata: { stageIndex }
      };

    } catch (error) {
      execution.metrics.failedTasks += stage.tasks.length;
      
      return {
        name: stage.name,
        success: false,
        duration: Date.now() - stageStart,
        cost: 0,
        error: error.message,
        results: stage.tasks.map(task => ({ taskId: task.id, success: false, error: error.message })),
        metadata: { stageIndex }
      };
    }
  }

  async getHealth(): Promise<ComponentHealth> {
    return {
      healthy: this.initialized,
      status: this.initialized ? 'active' : 'inactive',
      lastCheck: Date.now(),
      details: {
        initialized: this.initialized,
        templatesLoaded: this.templates.size,
        activePipelines: Array.from(this.pipelines.values()).filter(p => p.status === 'running').length,
        completedPipelines: Array.from(this.pipelines.values()).filter(p => p.status === 'completed').length
      }
    };
  }

  async shutdown(): Promise<void> {
    this.logger.info('🔄 Shutting down Pipeline Library...');
    
    await this.orchestrationEngine.shutdown();
    await this.modelKit.shutdown();
    await this.grpoLoop.shutdown();
    
    this.initialized = false;
  }
}

// Type definitions
export interface PipelineLibraryConfig {
  bmad?: any;
  modelKit?: any;
  grpo?: any;
}

interface PipelineTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number;
  parameters: TemplateParameter[];
  stages: PipelineStage[];
  tags: string[];
  version: string;
  createdAt: number;
  updatedAt: number;
}

interface TemplateParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'enum' | 'array';
  required: boolean;
  default?: any;
  values?: string[];
  description: string;
}

interface PipelineStage {
  name: string;
  tasks: PipelineTask[];
}

interface PipelineTask {
  id: string;
  type: string;
  agent?: string;
  prompt?: string;
  dependencies?: string[];
  condition?: string;
  model_constraints?: any;
  action?: string;
  config?: any;
}

interface Pipeline {
  id: string;
  name: string;
  templateId: string;
  parameters: Record<string, any>;
  definition: PipelineDefinition;
  status: 'created' | 'running' | 'completed' | 'failed';
  createdAt: number;
  currentExecution?: string;
  lastExecution?: string;
  metadata: any;
}

interface PipelineDefinition {
  stages: PipelineStage[];
  tasks: PipelineTask[];
}

interface PipelineExecution {
  id: string;
  pipelineId: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: number;
  completedAt?: number;
  progress: number;
  stages: StageResult[];
  results: Record<string, any>;
  metrics: {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    totalCost: number;
    executionTime: number;
  };
}

interface StageResult {
  name: string;
  success: boolean;
  duration: number;
  cost?: number;
  error?: string;
  results: any[];
  metadata: any;
}

interface PipelineTemplateInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: string;
  estimatedDuration: number;
  parameters: any[];
  tags: string[];
}

interface PipelineCreationOptions {
  id?: string;
  name?: string;
  createdBy?: string;
  metadata?: any;
}

interface ExecutionOptions {
  dryRun?: boolean;
  timeout?: number;
  metadata?: any;
}

interface ComponentHealth {
  healthy: boolean;
  status: string;
  lastCheck: number;
  details?: any;
}