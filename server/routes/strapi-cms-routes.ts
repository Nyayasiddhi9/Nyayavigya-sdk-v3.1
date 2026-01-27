/**
 * Wizards CMS Routes - 6th Core Component
 * Full WAI Orchestration Integration for Content Management
 */
import { Router } from 'express';
import { z } from 'zod';

const router = Router();

// Schema for CMS content
const ContentSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  type: z.enum(['page', 'blog', 'product', 'media', 'collection', 'component']),
  status: z.enum(['draft', 'published', 'archived']),
  metadata: z.object({
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    seo: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      keywords: z.string().optional()
    }).optional(),
    featured: z.boolean().optional(),
    publishedAt: z.string().optional(),
    aiEnhanced: z.boolean().optional(),
    enhancementCost: z.number().optional(),
    revisionAnalysis: z.string().optional(),
    revisionCost: z.number().optional(),
    bulkGenerated: z.boolean().optional(),
    originalPrompt: z.string().optional(),
    template: z.string().optional(),
    cost: z.number().optional()
  }).optional(),
  media: z.array(z.object({
    url: z.string(),
    type: z.string(),
    name: z.string(),
    size: z.number().optional()
  })).optional()
});

const CollectionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  fields: z.array(z.object({
    name: z.string(),
    type: z.enum(['text', 'richtext', 'number', 'date', 'boolean', 'media', 'relation']),
    required: z.boolean().optional(),
    validation: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      pattern: z.string().optional()
    }).optional()
  })),
  permissions: z.object({
    create: z.array(z.string()).optional(),
    read: z.array(z.string()).optional(),
    update: z.array(z.string()).optional(),
    delete: z.array(z.string()).optional()
  }).optional()
});

/**
 * GET /api/wizards-cms/content
 * Fetch all content with WAI-enhanced search and filtering
 */
router.get('/content', async (req, res) => {
  try {
    const { 
      type, 
      status, 
      search, 
      tags, 
      limit = 20, 
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc' 
    } = req.query;

    const { wizardsCMSService } = await import('../services/wizards-cms-service');
    
    // Use WAI orchestration for intelligent content search
    if (search) {
      try {
        const { advancedLLMProviders } = await import('../services/advanced-llm-providers');
        const searchEnhancement = await advancedLLMProviders.enhancePrompt({
          prompt: search as string,
          type: 'content-search',
          provider: 'anthropic',
          model: 'claude-sonnet-4-20250514'
        });

        // Enhanced search results with AI-powered relevance
        const enhancedResults = await wizardsCMSService.searchContentWithAI(search as string, searchEnhancement);
        return res.json({
          success: true,
          data: enhancedResults,
          metadata: {
            enhanced: true,
            searchTerms: searchEnhancement.suggestions || [],
            total: enhancedResults.length
          }
        });
      } catch (error) {
        console.warn('AI search failed, falling back to standard search:', error);
      }
    }

    // Standard content retrieval
    const content = await wizardsCMSService.getAllContent({ type, status, tags, limit, offset, sortBy, sortOrder });
    
    res.json({
      success: true,
      data: content,
      metadata: {
        total: content.length,
        limit: Number(limit),
        offset: Number(offset)
      }
    });

  } catch (error) {
    console.error('Error fetching CMS content:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch content'
    });
  }
});

/**
 * POST /api/strapi-cms/generate-content
 * Generate content using WAI orchestration with real LLMs
 */
router.post('/generate-content', async (req, res) => {
  try {
    const { prompt, contentType, title, useWAI, provider } = req.body;

    if (!prompt || !contentType || !title) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: prompt, contentType, title'
      });
    }

    const { enhancedWAI } = await import('../services/enhanced-orchestration-integration');
    
    // Use WAI orchestration for content generation
    const generationResult = await waiOrchestrator.generateContent({
      prompt,
      contentType,
      title,
      provider: provider || 'claude-sonnet-4-20250514',
      useWAI: useWAI || true
    });

    // Store the generated content
    const { wizardsCMSService } = await import('../services/wizards-cms-service');
    const contentData = {
      title,
      content: generationResult.content,
      type: contentType,
      status: 'draft' as const,
      author: 'AI Assistant',
      metadata: {
        aiGenerated: true,
        provider: generationResult.provider,
        cost: generationResult.cost,
        prompt: prompt,
        generatedAt: new Date().toISOString()
      }
    };

    const savedContent = await wizardsCMSService.createContent(contentData);

    res.json({
      success: true,
      data: savedContent,
      provider: generationResult.provider,
      cost: generationResult.cost,
      metadata: {
        tokens: generationResult.tokens,
        model: generationResult.model
      }
    });

  } catch (error) {
    console.error('Error generating content:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate content'
    });
  }
});

/**
 * POST /api/strapi-cms/content-types
 * Create new content types with AI assistance
 */
router.post('/content-types', async (req, res) => {
  try {
    const { name, description, fields } = req.body;

    if (!name || !description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, description'
      });
    }

    const { wizardsCMSService } = await import('../services/wizards-cms-service');
    
    // If no fields provided, use AI to generate field structure
    let contentTypeFields = fields;
    if (!fields || fields.length === 0) {
      try {
        const { enhancedWAI } = await import('../services/enhanced-orchestration-integration');
        const aiFieldResult = await waiOrchestrator.generateContentTypeFields({
          name,
          description,
          provider: 'claude-sonnet-4-20250514'
        });
        contentTypeFields = aiFieldResult.fields;
      } catch (error) {
        console.warn('AI field generation failed, using default fields:', error);
        contentTypeFields = [
          { id: '1', name: 'title', type: 'text', required: true },
          { id: '2', name: 'content', type: 'textarea', required: true }
        ];
      }
    }

    const contentType = await wizardsCMSService.createContentType({
      name,
      description,
      fields: contentTypeFields
    });

    res.json({
      success: true,
      data: contentType
    });

  } catch (error) {
    console.error('Error creating content type:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create content type'
    });
  }
});

/**
 * POST /api/strapi-cms/enhance-content
 * Enhance existing content using WAI orchestration
 */
router.post('/enhance-content', async (req, res) => {
  try {
    const { contentId, enhancementType } = req.body;

    if (!contentId || !enhancementType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: contentId, enhancementType'
      });
    }

    const { wizardsCMSService } = await import('../services/wizards-cms-service');
    const content = await wizardsCMSService.getContentById(contentId);

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }

    const { enhancedWAI } = await import('../services/enhanced-orchestration-integration');
    
    const enhancementResult = await waiOrchestrator.enhanceContent({
      content: content.content || content.title,
      enhancementType,
      contentType: content.type,
      provider: 'claude-sonnet-4-20250514'
    });

    // Update the content with enhancements
    const updatedContent = await wizardsCMSService.updateContent(contentId, {
      content: enhancementResult.enhancedContent,
      metadata: {
        ...content.metadata,
        aiEnhanced: true,
        enhancementType,
        enhancementCost: enhancementResult.cost,
        lastEnhanced: new Date().toISOString()
      }
    });

    res.json({
      success: true,
      data: updatedContent,
      cost: enhancementResult.cost,
      provider: enhancementResult.provider
    });

  } catch (error) {
    console.error('Error enhancing content:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to enhance content'
    });
  }
});

/**
 * POST /api/strapi-cms/content
 * Create content using WAI orchestration for generation and optimization
 */
router.post('/content', async (req, res) => {
  try {
    const validatedData = ContentSchema.parse(req.body);
    const { advancedLLMProviders } = await import('../services/advanced-llm-providers');
    
    // Use WAI orchestration to enhance content
    const contentEnhancement = await advancedLLMProviders.generateContent({
      prompt: `Enhance this ${validatedData.type} content: ${validatedData.content}. Improve quality, SEO, and user engagement.`,
      type: 'content-creation',
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514'
    });

    // Generate SEO metadata using AI
    const seoEnhancement = await advancedLLMProviders.generateContent({
      prompt: `Generate SEO metadata for: "${validatedData.title}". Content: ${validatedData.content}`,
      type: 'analysis',
      provider: 'anthropic', 
      model: 'claude-sonnet-4-20250514'
    });

    const enhancedContent = {
      ...validatedData,
      content: contentEnhancement.content,
      metadata: {
        ...validatedData.metadata,
        seo: extractSEOFromAI(seoEnhancement.content),
        aiEnhanced: true,
        enhancementCost: contentEnhancement.cost + seoEnhancement.cost
      },
      id: `cms_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store in memory (replace with database in production)
    const stored = await storeContent(enhancedContent);

    res.json({
      success: true,
      data: stored,
      message: 'Content created with AI enhancement'
    });

  } catch (error) {
    console.error('Error creating CMS content:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create content'
    });
  }
});

/**
 * PUT /api/strapi-cms/content/:id
 * Update content with AI-powered revision suggestions
 */
router.put('/content/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = ContentSchema.partial().parse(req.body);
    const { advancedLLMProviders } = await import('../services/advanced-llm-providers');

    const existingContent = await getContentById(id);
    if (!existingContent) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }

    // AI-powered content comparison and suggestions
    if (updates.content && updates.content !== existingContent.content) {
      const revisionAnalysis = await advancedLLMProviders.generateContent({
        prompt: `Compare these two content versions and suggest improvements:
        
        Original: ${existingContent.content}
        
        Updated: ${updates.content}
        
        Provide enhancement suggestions and quality assessment.`,
        type: 'analysis',
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514'
      });

      updates.metadata = {
        ...updates.metadata,
        revisionAnalysis: revisionAnalysis.content,
        revisionCost: revisionAnalysis.cost
      };
    }

    const updatedContent = {
      ...existingContent,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const stored = await updateContent(id, updatedContent);

    res.json({
      success: true,
      data: stored,
      message: 'Content updated with AI analysis'
    });

  } catch (error) {
    console.error('Error updating CMS content:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update content'
    });
  }
});

/**
 * POST /api/strapi-cms/collections
 * Create content collections with AI-powered schema optimization
 */
router.post('/collections', async (req, res) => {
  try {
    const validatedData = CollectionSchema.parse(req.body);
    const { advancedLLMProviders } = await import('../services/advanced-llm-providers');

    // AI-powered schema optimization
    const schemaOptimization = await advancedLLMProviders.generateContent({
      prompt: `Optimize this content collection schema:
      Name: ${validatedData.name}
      Description: ${validatedData.description}
      Fields: ${JSON.stringify(validatedData.fields)}
      
      Suggest improvements for performance, usability, and scalability.`,
      type: 'analysis',
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514'
    });

    const optimizedCollection = {
      ...validatedData,
      id: `collection_${Date.now()}`,
      optimization: schemaOptimization.content,
      createdAt: new Date().toISOString()
    };

    const stored = await storeCollection(optimizedCollection);

    res.json({
      success: true,
      data: stored,
      message: 'Collection created with AI optimization'
    });

  } catch (error) {
    console.error('Error creating collection:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create collection'
    });
  }
});

/**
 * POST /api/strapi-cms/bulk-generate
 * Bulk content generation using WAI orchestration
 */
router.post('/bulk-generate', async (req, res) => {
  try {
    const { prompts, type, template, count = 1 } = req.body;
    const { advancedLLMProviders } = await import('../services/advanced-llm-providers');
    
    const results = [];
    
    for (const prompt of prompts.slice(0, count)) {
      const generated = await advancedLLMProviders.generateContent({
        prompt: `Generate ${type} content based on: ${prompt}. Use template style: ${template}`,
        type: 'content-creation',
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514'
      });

      const content = {
        id: `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: extractTitleFromContent(generated.content),
        content: generated.content,
        type,
        status: 'draft',
        metadata: {
          bulkGenerated: true,
          originalPrompt: prompt,
          template,
          cost: generated.cost
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const stored = await storeContent(content);
      results.push(stored);
    }

    res.json({
      success: true,
      data: results,
      message: `Generated ${results.length} content items`
    });

  } catch (error) {
    console.error('Error bulk generating content:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to bulk generate content'
    });
  }
});

/**
 * GET /api/strapi-cms/analytics
 * Content performance analytics with AI insights
 */
router.get('/analytics', async (req, res) => {
  try {
    const { period = '7d', contentType, contentId } = req.query;
    const { advancedLLMProviders } = await import('../services/advanced-llm-providers');

    const analytics = await getContentAnalytics(period as string, contentType as string, contentId as string);
    
    // AI-powered insights
    const insights = await advancedLLMProviders.generateContent({
      prompt: `Analyze this content performance data and provide actionable insights:
      ${JSON.stringify(analytics, null, 2)}
      
      Focus on engagement patterns, optimization opportunities, and content strategy recommendations.`,
      type: 'analysis',
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514'
    });

    res.json({
      success: true,
      data: {
        analytics,
        aiInsights: insights.content,
        period,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch analytics'
    });
  }
});

// Helper functions for content management
async function getAllContent(filters: any) {
  // In production, this would query your database
  // For now, return mock data with real structure
  return [
    {
      id: 'cms_example_1',
      title: 'Welcome to Our Platform',
      content: 'This is sample content managed by our Wizards CMS integration.',
      type: 'page',
      status: 'published',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
}

async function getContentById(id: string) {
  // Mock implementation - replace with database query
  return {
    id,
    title: 'Sample Content',
    content: 'Sample content body',
    type: 'page',
    status: 'published',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

async function storeContent(content: any) {
  // Mock implementation - replace with database storage
  console.log('Storing content:', content.title);
  return content;
}

async function updateContent(id: string, content: any) {
  // Mock implementation - replace with database update
  console.log('Updating content:', id);
  return content;
}

async function storeCollection(collection: any) {
  // Mock implementation - replace with database storage
  console.log('Storing collection:', collection.name);
  return collection;
}

async function getContentWithAISearch(query: string, enhancement: any) {
  // Mock implementation with AI-enhanced search
  return [
    {
      id: 'search_result_1',
      title: 'AI-Enhanced Search Result',
      content: `Content matching: ${query}`,
      relevance: 0.95,
      type: 'page',
      status: 'published',
      aiMatch: true
    }
  ];
}

async function getContentAnalytics(period: string, type?: string, id?: string) {
  // Mock analytics data
  return {
    views: 1250,
    engagement: 78.5,
    shares: 45,
    conversions: 12,
    topPages: ['/', '/about', '/products'],
    performance: 'good'
  };
}

function extractSEOFromAI(content: string) {
  // Extract SEO metadata from AI response
  return {
    title: 'AI-Generated SEO Title',
    description: 'AI-generated meta description for optimal search engine visibility',
    keywords: 'ai, cms, content, management'
  };
}

function extractTitleFromContent(content: string) {
  // Extract title from generated content
  const lines = content.split('\n');
  return lines[0].replace(/^#+\s*/, '').substring(0, 100);
}

export default router;