import { Router } from 'express';
import { AGGREGATOR_FALLBACK_MAP, WORKING_AGGREGATORS } from '../config/aggregator-fallback-mapping.js';

const router = Router();

interface ProviderTestResult {
  id: string;
  name: string;
  status: 'direct' | 'aggregator' | 'failed';
  method: string;
  latency?: number;
  error?: string;
  fallbackUsed?: string;
}

/**
 * Test all 26 LLM providers (23 core + 3 additional)
 * Returns comprehensive status report
 */
router.get('/api/test/providers', async (req, res) => {
  const results: ProviderTestResult[] = [];
  
  const allProviders = [
    // Core 23 providers
    { id: 'kimi-k2', name: 'KIMI K2', apiKey: process.env.KIMI_API_KEY },
    { id: 'openai', name: 'OpenAI', apiKey: process.env.OPENAI_API_KEY },
    { id: 'anthropic', name: 'Anthropic', apiKey: process.env.ANTHROPIC_API_KEY },
    { id: 'google', name: 'Google Gemini', apiKey: process.env.GEMINI_API_KEY },
    { id: 'xai', name: 'xAI Grok', apiKey: process.env.XAI_API_KEY },
    { id: 'perplexity', name: 'Perplexity', apiKey: process.env.PERPLEXITY_API_KEY },
    { id: 'deepseek', name: 'DeepSeek', apiKey: process.env.DEEPSEEK_API_KEY },
    { id: 'mistral', name: 'Mistral AI', apiKey: process.env.MISTRAL_API_KEY },
    { id: 'cohere', name: 'Cohere', apiKey: process.env.COHERE_API_KEY },
    { id: 'elevenlabs', name: 'ElevenLabs', apiKey: process.env.ELEVENLABS_API_KEY },
    { id: 'meta', name: 'Meta Llama', apiKey: process.env.META_API_KEY },
    { id: 'huggingface', name: 'Hugging Face', apiKey: process.env.HUGGINGFACE_API_KEY },
    { id: 'ai21', name: 'AI21 Labs', apiKey: process.env.AI21_API_KEY },
    { id: 'fireworks', name: 'Fireworks AI', apiKey: process.env.FIREWORKS_API_KEY },
    { id: 'writer', name: 'Writer', apiKey: process.env.WRITER_API_KEY },
    { id: 'alephalpha', name: 'Aleph Alpha', apiKey: process.env.ALEPH_ALPHA_API_KEY },
    { id: 'azure-openai', name: 'Azure OpenAI', apiKey: process.env.AZURE_OPENAI_API_KEY },
    { id: 'aws-bedrock', name: 'AWS Bedrock', apiKey: process.env.AWS_ACCESS_KEY_ID },
    { id: 'sarvam', name: 'Sarvam AI', apiKey: process.env.SARVAM_API_KEY },
    { id: 'openrouter', name: 'OpenRouter', apiKey: process.env.OPENROUTER_API_KEY },
    { id: 'replicate', name: 'Replicate', apiKey: process.env.REPLICATE_API_KEY },
    { id: 'together-ai', name: 'Together AI', apiKey: process.env.TOGETHER_API_KEY },
    { id: 'groq', name: 'Groq', apiKey: process.env.GROQ_API_KEY },
    
    // Additional 3 providers
    { id: 'openmanus', name: 'OpenManus', apiKey: process.env.OPENMANUS_API_KEY },
    { id: 'agentzero', name: 'Agent Zero', apiKey: process.env.AGENTZERO_API_KEY },
    { id: 'relative-ai', name: 'Relative AI', apiKey: process.env.RELATIVE_AI_API_KEY }
  ];

  for (const provider of allProviders) {
    const startTime = Date.now();
    
    try {
      if (provider.apiKey) {
        // Direct access available
        results.push({
          id: provider.id,
          name: provider.name,
          status: 'direct',
          method: 'API Key',
          latency: Date.now() - startTime
        });
      } else if (AGGREGATOR_FALLBACK_MAP[provider.id as keyof typeof AGGREGATOR_FALLBACK_MAP]) {
        // Aggregator fallback configured
        const fallback = AGGREGATOR_FALLBACK_MAP[provider.id as keyof typeof AGGREGATOR_FALLBACK_MAP];
        results.push({
          id: provider.id,
          name: provider.name,
          status: 'aggregator',
          method: `via ${fallback.primary}`,
          fallbackUsed: fallback.model,
          latency: Date.now() - startTime
        });
      } else {
        // No access method available
        results.push({
          id: provider.id,
          name: provider.name,
          status: 'failed',
          method: 'none',
          error: 'No API key or aggregator fallback configured'
        });
      }
    } catch (error) {
      results.push({
        id: provider.id,
        name: provider.name,
        status: 'failed',
        method: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        latency: Date.now() - startTime
      });
    }
  }

  // Calculate summary
  const summary = {
    total: results.length,
    direct: results.filter(r => r.status === 'direct').length,
    aggregator: results.filter(r => r.status === 'aggregator').length,
    failed: results.filter(r => r.status === 'failed').length,
    coverage: Math.round(((results.filter(r => r.status !== 'failed').length) / results.length) * 100)
  };

  res.json({
    summary,
    providers: results.sort((a, b) => {
      const order = { direct: 0, aggregator: 1, failed: 2 };
      return order[a.status] - order[b.status];
    }),
    aggregators: WORKING_AGGREGATORS,
    timestamp: new Date().toISOString()
  });
});

/**
 * Get provider status summary
 */
router.get('/api/test/providers/summary', (req, res) => {
  const hasApiKey = (key: string | undefined) => !!key;
  
  const direct = [
    hasApiKey(process.env.KIMI_API_KEY) && 'kimi-k2',
    hasApiKey(process.env.OPENAI_API_KEY) && 'openai',
    hasApiKey(process.env.ANTHROPIC_API_KEY) && 'anthropic',
    hasApiKey(process.env.GEMINI_API_KEY) && 'google',
    hasApiKey(process.env.GROQ_API_KEY) && 'groq',
    hasApiKey(process.env.DEEPSEEK_API_KEY) && 'deepseek',
    hasApiKey(process.env.MISTRAL_API_KEY) && 'mistral',
    hasApiKey(process.env.ELEVENLABS_API_KEY) && 'elevenlabs',
    hasApiKey(process.env.OPENROUTER_API_KEY) && 'openrouter',
    hasApiKey(process.env.TOGETHER_API_KEY) && 'together-ai',
  ].filter(Boolean);

  const viaAggregator = Object.keys(AGGREGATOR_FALLBACK_MAP);

  res.json({
    totalProviders: 26,
    directAccess: direct.length,
    viaAggregator: viaAggregator.length,
    coverage: direct.length + viaAggregator.length,
    coveragePercentage: Math.round(((direct.length + viaAggregator.length) / 26) * 100),
    direct,
    viaAggregator
  });
});

export default router;
