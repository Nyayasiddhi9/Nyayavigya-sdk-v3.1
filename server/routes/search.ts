/**
 * Unified Search API Routes - AI-Powered Global Search
 * 
 * Real WAI orchestration for intelligent search across all platforms
 */

import express from 'express';
import { waiPlatformOrchestrator } from '../services/wai-platform-orchestrator';
import { db } from '../db';
import { waiOrchestrationRequests } from '../../shared/schema';

const router = express.Router();

/**
 * Unified search across all platforms with AI enhancement
 */
router.post('/unified', async (req, res) => {
  try {
    const { query, includeAISuggestions, userContext } = req.body;
    const userId = req.headers['x-user-id'] || 'anonymous';

    if (!query || query.trim().length < 2) {
      return res.json({
        success: true,
        data: {
          results: [],
          suggestions: [],
          message: 'Query too short'
        }
      });
    }

    // Use WAI orchestration for intelligent search
    const response = await waiPlatformOrchestrator.executePlatformOperation({
      platform: 'ai-assistant-builder',
      operation: 'unified-search',
      task: `Perform intelligent search across WAI DevStudio platforms for query: "${query}"
      
      Search scope:
      - Platform features and capabilities
      - Available templates and projects
      - Documentation and tutorials
      - Commands and actions
      - Related suggestions
      
      Provide comprehensive results with:
      1. Exact matches with high relevance
      2. Related features and capabilities
      3. Suggested next actions
      4. Platform-specific results
      5. AI-powered recommendations
      
      Query context: ${JSON.stringify(userContext)}`,
      context: {
        searchQuery: query,
        includeAISuggestions,
        userContext,
        platforms: ['code-studio', 'ai-assistant-builder', 'content-studio', 'game-builder', 'business-studio']
      },
      userId: parseInt(userId as string) || undefined,
      priority: 'high'
    });

    // Base search results structure
    const baseResults = [
      {
        id: 'code-studio-platform',
        title: 'Code Studio',
        description: 'AI-powered software development with 100+ agents',
        type: 'platform',
        platform: 'code-studio',
        url: '/platforms/code-studio',
        relevanceScore: calculateRelevance(query, 'code studio development software programming'),
        tags: ['development', 'ai', 'coding', 'projects'],
        features: ['Project Planning', 'Code Generation', 'Testing', 'Deployment']
      },
      {
        id: 'ai-assistant-builder-platform',
        title: 'AI Assistant Builder',
        description: 'Create sophisticated AI assistants with 3D avatars and voice',
        type: 'platform',
        platform: 'ai-assistant-builder',
        url: '/platforms/ai-assistant-builder',
        relevanceScore: calculateRelevance(query, 'ai assistant chatbot bot avatar voice conversation'),
        tags: ['ai', 'assistant', 'chatbot', 'avatar', 'voice'],
        features: ['3D Avatars', 'Voice Cloning', 'RAG Integration', '12+ Languages']
      },
      {
        id: 'content-studio-platform',
        title: 'Content Studio',
        description: 'Enterprise content creation with brand voice and SEO optimization',
        type: 'platform',
        platform: 'content-studio',
        url: '/platforms/content-studio',
        relevanceScore: calculateRelevance(query, 'content writing marketing blog seo copywriting'),
        tags: ['content', 'writing', 'marketing', 'seo', 'brand'],
        features: ['Brand Voice', 'SEO Optimization', 'Multi-channel', 'Analytics']
      },
      {
        id: 'game-builder-platform',
        title: 'Game Builder',
        description: 'AI-assisted game development with procedural generation',
        type: 'platform',
        platform: 'game-builder',
        url: '/platforms/game-builder',
        relevanceScore: calculateRelevance(query, 'game development gaming unity procedural npc'),
        tags: ['game', 'development', 'procedural', 'ai-npc', 'monetization'],
        features: ['Procedural Generation', 'AI NPCs', 'Monetization', 'Publishing']
      },
      {
        id: 'business-studio-platform',
        title: 'Business Studio',
        description: 'Enterprise automation and process optimization',
        type: 'platform',
        platform: 'business-studio',
        url: '/platforms/business-studio',
        relevanceScore: calculateRelevance(query, 'business automation enterprise workflow process'),
        tags: ['business', 'automation', 'enterprise', 'workflow', 'analytics'],
        features: ['Process Automation', 'Compliance', 'Analytics', 'Integration']
      }
    ];

    // Feature-specific results
    const featureResults = [
      {
        id: 'wai-orchestration',
        title: 'WAI Orchestration System',
        description: '14+ LLM providers with intelligent routing',
        type: 'feature',
        platform: 'system',
        url: '/orchestration',
        relevanceScore: calculateRelevance(query, 'orchestration llm routing ai providers'),
        tags: ['orchestration', 'llm', 'routing', 'ai', 'optimization']
      },
      {
        id: 'tmux-sessions',
        title: 'TMUX Agent Sessions',
        description: 'Persistent agent sessions with inter-agent communication',
        type: 'feature',
        platform: 'system',
        url: '/enhanced-orchestration',
        relevanceScore: calculateRelevance(query, 'tmux agent sessions persistent collaboration'),
        tags: ['tmux', 'agents', 'sessions', 'collaboration']
      }
    ];

    // Command results
    const commandResults = [
      {
        id: 'create-project-cmd',
        title: 'Create New Project',
        description: 'Quick action to start a new project',
        type: 'command',
        platform: 'code-studio',
        url: '/platforms/code-studio?action=create',
        relevanceScore: calculateRelevance(query, 'create new project start build'),
        tags: ['create', 'project', 'new', 'start']
      },
      {
        id: 'deploy-app-cmd',
        title: 'Deploy Application',
        description: 'Deploy your application to production',
        type: 'command',
        platform: 'deployment',
        url: '/deployment',
        relevanceScore: calculateRelevance(query, 'deploy deployment production publish'),
        tags: ['deploy', 'deployment', 'production', 'publish']
      }
    ];

    // Combine and filter results
    const allResults = [...baseResults, ...featureResults, ...commandResults]
      .filter(result => result.relevanceScore > 0.1)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10);

    let aiEnhancedResults = allResults;
    let aiSuggestions: string[] = [];

    // Include AI-enhanced results if available
    if (response.success && includeAISuggestions) {
      try {
        const aiResults = response.result;
        if (Array.isArray(aiResults)) {
          aiEnhancedResults = [...aiResults, ...allResults]
            .filter(result => result.relevanceScore > 0.1)
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, 8);
        }

        // AI-powered suggestions
        aiSuggestions = [
          `Try "${query}" in Code Studio`,
          `Explore AI assistants for "${query}"`,
          `Generate content about "${query}"`,
        ] as string[];
      } catch (error) {
        console.error('Error processing AI search results:', error);
      }
    }

    // Log search query for analytics
    try {
      await db.insert(waiOrchestrationRequests).values({
        userId: parseInt(userId as string) || null,
        requestType: 'search-query',
        task: `Search: ${query}`,
        priority: 'low',
        metadata: {
          query,
          userContext,
          resultsCount: aiEnhancedResults.length,
          timestamp: new Date().toISOString()
        },
        status: 'completed'
      });
    } catch (error) {
      // Continue without logging if database fails
    }

    res.json({
      success: true,
      data: {
        results: aiEnhancedResults,
        suggestions: aiSuggestions,
        query,
        totalResults: aiEnhancedResults.length,
        aiEnhanced: response.success && includeAISuggestions,
        searchTime: response.success ? response.metadata?.executionTime : 0
      }
    });

  } catch (error) {
    console.error('Unified search failed:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed',
      message: 'Unable to perform search. Please try again.'
    });
  }
});

/**
 * Get search suggestions based on user behavior and context
 */
router.get('/suggestions', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || 'anonymous';

    // Use WAI orchestration to generate personalized suggestions
    const response = await waiPlatformOrchestrator.executePlatformOperation({
      platform: 'ai-assistant-builder',
      operation: 'search-suggestions',
      task: `Generate personalized search suggestions for user based on:
      1. Popular platform features
      2. Recent user activity
      3. Trending capabilities
      4. Quick actions for productivity
      
      Focus on actionable suggestions that help users discover platform value quickly.`,
      context: {
        userId,
        suggestionTypes: ['quick-actions', 'popular-features', 'trending', 'personalized']
      },
      userId: parseInt(userId as string) || undefined,
      priority: 'medium'
    });

    const baseSuggestions = [
      {
        id: 'ai-powered-suggestions',
        text: 'AI-powered development',
        type: 'ai-suggested'
      },
      {
        id: 'template-library',
        text: 'Browse templates',
        type: 'popular'
      },
      {
        id: 'collaboration-tools',
        text: 'Team collaboration',
        type: 'popular'
      },
      {
        id: 'deployment-options',
        text: 'Deployment options',
        type: 'popular'
      }
    ];

    let suggestions = baseSuggestions;
    
    if (response.success) {
      try {
        const aiSuggestions = response.result;
        if (Array.isArray(aiSuggestions)) {
          suggestions = [...aiSuggestions, ...baseSuggestions].slice(0, 8);
        }
      } catch (error) {
        // Use base suggestions as fallback
      }
    }

    res.json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    console.error('Failed to get search suggestions:', error);
    res.json({
      success: true,
      data: [
        {
          id: 'fallback-create',
          text: 'Create new project',
          type: 'quick-action'
        },
        {
          id: 'fallback-explore',
          text: 'Explore platforms',
          type: 'popular'
        }
      ]
    });
  }
});

/**
 * Calculate relevance score for search results
 */
function calculateRelevance(query: string, content: string): number {
  const queryLower = query.toLowerCase().trim();
  const contentLower = content.toLowerCase();
  
  if (contentLower.includes(queryLower)) {
    return 1.0; // Exact match
  }
  
  const queryWords = queryLower.split(/\s+/);
  const contentWords = contentLower.split(/\s+/);
  
  let matches = 0;
  for (const word of queryWords) {
    if (contentWords.some(contentWord => contentWord.includes(word) || word.includes(contentWord))) {
      matches++;
    }
  }
  
  return matches / queryWords.length;
}

export default router;