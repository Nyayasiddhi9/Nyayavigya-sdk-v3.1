/**
 * SDK Generation API Routes
 * Routes for generating and downloading WAI v9.0 SDK packages
 */

import { Router, Request, Response } from 'express';
import { getWAISDKGenerator, ComprehensiveSDKConfig } from '../sdk/wai-comprehensive-sdk-generator-v9';
import { z } from 'zod';

const router = Router();

// Validation schema for SDK generation config
const SDKConfigSchema = z.object({
  includeQuantumCapabilities: z.boolean().default(true),
  includeLLMProviders: z.array(z.string()).default(['openai', 'anthropic', 'google']),
  includeAgentTiers: z.array(z.string()).default(['executive', 'development', 'creative']),
  includeIntegrations: z.array(z.string()).default(['crewai', 'langchain', 'mcp']),
  targetPlatforms: z.array(z.string()).default(['nodejs', 'docker']),
  packageFormat: z.enum(['zip', 'tar.gz', 'npm', 'all']).default('zip'),
  documentation: z.object({
    includeAPI: z.boolean().default(true),
    includeExamples: z.boolean().default(true),
    includeTutorials: z.boolean().default(true),
    includeArchitecture: z.boolean().default(true),
  }).default({}),
  deployment: z.object({
    includeDocker: z.boolean().default(true),
    includeKubernetes: z.boolean().default(true),
    includeServerless: z.boolean().default(false),
    includeCI: z.boolean().default(true),
  }).default({})
});

/**
 * Generate comprehensive WAI v9.0 SDK
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    console.log('🚀 SDK Generation API: Generating WAI v9.0 Comprehensive SDK...');
    
    const validatedConfig = SDKConfigSchema.parse(req.body);
    
    const config: ComprehensiveSDKConfig = {
      version: '1.0.0',
      ...validatedConfig
    };
    
    // Generate the SDK using the comprehensive generator
    const generator = getWAISDKGenerator();
    const result = await generator.generateComprehensiveSDK(config);
    
    res.json({
      success: true,
      message: 'WAI v9.0 Comprehensive SDK generated successfully',
      data: result,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('❌ SDK generation failed:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid configuration format',
        details: error.errors,
        timestamp: new Date()
      });
    } else {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'SDK generation failed',
        timestamp: new Date()
      });
    }
  }
});

/**
 * Get SDK generation status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      status: 'ready',
      message: 'WAI v9.0 SDK Generator is ready',
      capabilities: {
        quantumSupport: true,
        multiPlatform: true,
        comprehensiveDocumentation: true,
        deploymentTools: true
      },
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Status check failed',
      timestamp: new Date()
    });
  }
});

/**
 * Get available SDK configurations
 */
router.get('/configurations', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      configurations: {
        llmProviders: [
          'openai', 'anthropic', 'google', 'xai', 'perplexity',
          'together', 'groq', 'deepseek', 'cohere', 'mistral', 'replicate'
        ],
        agentTiers: [
          'executive', 'development', 'creative', 'qa', 'devops', 'domain-specialist'
        ],
        integrations: [
          'crewai', 'langchain', 'bmad', 'mem0', 'openswe', 'mcp', 
          'reactbits', 'sketchflow', 'humanlayer', 'surfsense'
        ],
        platforms: ['nodejs', 'python', 'docker', 'kubernetes'],
        formats: ['zip', 'tar.gz', 'npm']
      },
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Configuration fetch failed',
      timestamp: new Date()
    });
  }
});

export default router;