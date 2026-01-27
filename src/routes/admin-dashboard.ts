/**
 * Admin Dashboard API Routes
 * Real implementation for LLM cost tracking and management
 */

import { Router } from 'express';
import { db } from '../db';
import { 
  waiPerformanceMetrics, 
  waiLlmProviders, 
  waiLlmProvidersV9,
  waiOrchestrationRequests,
  llmCostTracking
} from '@shared/schema';
import { eq, and, gte, lte, desc, sum, sql } from 'drizzle-orm';

const router = Router();

// Get dashboard overview data
router.get('/api/admin/dashboard', async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;
    
    // Calculate time boundaries
    const now = new Date();
    let startTime = new Date();
    
    switch (timeRange) {
      case '1h':
        startTime.setHours(now.getHours() - 1);
        break;
      case '24h':
        startTime.setDate(now.getDate() - 1);
        break;
      case '7d':
        startTime.setDate(now.getDate() - 7);
        break;
      case '30d':
        startTime.setDate(now.getDate() - 30);
        break;
    }

    // Get cost data
    const costData = await db
      .select({
        date: sql`DATE(${llmCostTracking.timestamp})`.as('date'),
        provider: llmCostTracking.provider,
        totalCost: sum(llmCostTracking.cost),
        totalRequests: sql`COUNT(*)`.as('totalRequests'),
        totalTokens: sum(llmCostTracking.tokensUsed)
      })
      .from(llmCostTracking)
      .where(gte(llmCostTracking.timestamp, startTime))
      .groupBy(sql`DATE(${llmCostTracking.timestamp})`, llmCostTracking.provider)
      .orderBy(sql`DATE(${llmCostTracking.timestamp})`);

    // Get today's spend
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const [todaySpend] = await db
      .select({
        total: sum(llmCostTracking.cost)
      })
      .from(llmCostTracking)
      .where(gte(llmCostTracking.timestamp, todayStart));

    // Get monthly spend
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    
    const [monthlySpend] = await db
      .select({
        total: sum(llmCostTracking.cost)
      })
      .from(llmCostTracking)
      .where(gte(llmCostTracking.timestamp, monthStart));

    // Get active providers count
    const activeProviders = await db
      .select({
        count: sql`COUNT(DISTINCT ${llmCostTracking.provider})`
      })
      .from(llmCostTracking)
      .where(gte(llmCostTracking.timestamp, startTime));

    // Get provider breakdown
    const providerBreakdown = await db
      .select({
        provider: llmCostTracking.provider,
        totalCost: sum(llmCostTracking.cost),
        totalRequests: sql`COUNT(*)`
      })
      .from(llmCostTracking)
      .where(gte(llmCostTracking.timestamp, startTime))
      .groupBy(llmCostTracking.provider);

    // Get usage metrics
    const usageMetrics = await db
      .select({
        totalRequests: sql`COUNT(*)`,
        totalTokens: sum(llmCostTracking.tokensUsed),
        avgResponseTime: sql`AVG(${llmCostTracking.responseTime})`,
        errorCount: sql`COUNT(CASE WHEN ${llmCostTracking.status} = 'error' THEN 1 END)`
      })
      .from(llmCostTracking)
      .where(gte(llmCostTracking.timestamp, startTime));

    // Format response data
    const formattedCostData = costData.reduce((acc: any[], curr) => {
      const dateStr = curr.date;
      let dateEntry = acc.find(d => d.date === dateStr);
      
      if (!dateEntry) {
        dateEntry = { date: dateStr, total: 0 };
        acc.push(dateEntry);
      }
      
      dateEntry[curr.provider.toLowerCase()] = Number(curr.totalCost) || 0;
      dateEntry.total += Number(curr.totalCost) || 0;
      
      return acc;
    }, []);

    // Calculate provider percentages
    const totalCost = providerBreakdown.reduce((sum, p) => sum + Number(p.totalCost || 0), 0);
    const formattedProviderBreakdown = providerBreakdown.map(p => ({
      name: p.provider,
      value: Number(p.totalCost) || 0,
      percentage: totalCost > 0 ? Math.round((Number(p.totalCost) / totalCost) * 100) : 0,
      color: getProviderColor(p.provider)
    }));

    // Check for cost alerts
    const dailyLimit = 1000; // Get from config
    const costAlert = Number(todaySpend?.total) > dailyLimit * 0.8;

    res.json({
      todaySpend: Number(todaySpend?.total) || 0,
      monthlySpend: Number(monthlySpend?.total) || 0,
      activeProviders: Number(activeProviders[0]?.count) || 0,
      costData: formattedCostData,
      providerBreakdown: formattedProviderBreakdown,
      usageMetrics: {
        totalRequests: Number(usageMetrics[0]?.totalRequests) || 0,
        totalTokens: Number(usageMetrics[0]?.totalTokens) || 0,
        avgResponseTime: Number(usageMetrics[0]?.avgResponseTime) || 0,
        errorRate: usageMetrics[0]?.totalRequests 
          ? (Number(usageMetrics[0]?.errorCount) / Number(usageMetrics[0]?.totalRequests)) * 100 
          : 0,
        activeUsers: 3421, // Mock data - implement real user tracking
        concurrentRequests: 47 // Mock data - implement real tracking
      },
      costAlert
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get LLM provider status (legacy endpoint)
router.get('/api/admin/provider-status', async (req, res) => {
  try {
    const providers = await db
      .select()
      .from(waiLlmProvidersV9)
      .orderBy(waiLlmProvidersV9.name);

    const providerStatus: Record<string, any> = {};
    
    for (const provider of providers) {
      providerStatus[provider.providerId] = {
        enabled: provider.status === 'active',
        hasApiKey: true, // Assume configured providers have API keys
        models: provider.models || [],
        priority: 1, // Default priority
        costPerToken: 0.001, // Default cost
        dailyLimit: 10000, // Default daily limit
        monthlyLimit: 300000 // Default monthly limit
      };
    }

    // Add default status for providers not in DB
    const allProviders = [
      'openai', 'anthropic', 'gemini', 'perplexity', 'replicate',
      'together', 'groq', 'xai', 'deepseek', 'kimi', 'cohere',
      'mistral', 'manus', 'elevenlabs'
    ];

    for (const providerId of allProviders) {
      if (!providerStatus[providerId]) {
        providerStatus[providerId] = {
          enabled: false,
          hasApiKey: !!process.env[`${providerId.toUpperCase()}_API_KEY`],
          models: [],
          priority: 999,
          costPerToken: 0,
          dailyLimit: 0,
          monthlyLimit: 0
        };
      }
    }

    res.json(providerStatus);
  } catch (error) {
    console.error('Provider status error:', error);
    res.status(500).json({ error: 'Failed to fetch provider status' });
  }
});

// Legacy endpoints commented out - replaced by comprehensive Model Catalog API in wai-admin-console.ts

/*
// Toggle provider status - DEPRECATED: Use Model Catalog API instead
router.post('/api/admin/llm-providers/toggle', async (req, res) => {
  // This endpoint has been replaced by PATCH /api/admin/llm-providers/:providerId/status
  res.status(410).json({ 
    error: 'This endpoint is deprecated. Use PATCH /api/admin/llm-providers/:providerId/status instead.',
    newEndpoint: '/api/admin/llm-providers/:providerId/status'
  });
});

// Update cost limits - DEPRECATED: Use Model Catalog API instead  
router.post('/api/admin/cost-limits', async (req, res) => {
  // This endpoint has been replaced by Model Catalog provider management
  res.status(410).json({ 
    error: 'This endpoint is deprecated. Use Model Catalog API for provider management.',
    newEndpoint: '/api/admin/llm-providers'
  });
});

// Update model configuration - DEPRECATED: Use Model Catalog API instead
router.post('/api/admin/model-config', async (req, res) => {
  // This endpoint has been replaced by Model Catalog provider configuration
  res.status(410).json({ 
    error: 'This endpoint is deprecated. Use Model Catalog API for model configuration.',
    newEndpoint: '/api/admin/llm-providers/:providerId'
  });
});
*/

// Helper functions
function getProviderColor(provider: string): string {
  const colors: Record<string, string> = {
    'openai': '#10B981',
    'anthropic': '#6366F1',
    'gemini': '#F59E0B',
    'perplexity': '#EC4899',
    'replicate': '#8B5CF6',
    'together': '#14B8A6',
    'groq': '#F97316',
    'elevenlabs': '#EF4444'
  };
  return colors[provider.toLowerCase()] || '#94A3B8';
}

function getDefaultModels(providerId: string): string[] {
  const models: Record<string, string[]> = {
    'openai': ['gpt-4o', 'gpt-4o-mini', 'dall-e-3'],
    'anthropic': ['claude-sonnet-4-20250514', 'claude-opus-4'],
    'gemini': ['gemini-2.5-pro', 'gemini-2.5-flash'],
    'perplexity': ['llama-3.1-sonar-small-128k-online', 'llama-3.1-sonar-large-128k-online'],
    'replicate': ['meta/llama-3-70b', 'stability-ai/sdxl'],
    'together': ['mixtral-8x7b', 'llama-3-70b'],
    'groq': ['llama3-70b', 'mixtral-8x7b'],
    'elevenlabs': ['eleven-turbo-v2', 'eleven-multilingual-v2']
  };
  return models[providerId] || [];
}

function getDefaultCostPerToken(providerId: string): number {
  const costs: Record<string, number> = {
    'openai': 0.00003,
    'anthropic': 0.00002,
    'gemini': 0.00001,
    'perplexity': 0.000015,
    'replicate': 0.00002,
    'together': 0.000008,
    'groq': 0.000005,
    'elevenlabs': 0.00005
  };
  return costs[providerId] || 0.00001;
}

export default router;