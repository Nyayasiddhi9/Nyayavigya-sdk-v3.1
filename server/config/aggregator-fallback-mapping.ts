/**
 * Aggregator Fallback Mapping for WAI SDK v1.0
 * 
 * Routes LLM requests for providers with missing API keys through aggregators
 * Aggregators: OpenRouter, Together AI, Hugging Face, Replicate
 */

export const AGGREGATOR_FALLBACK_MAP = {
  // Meta/Llama models → OpenRouter (has Meta models)
  'meta': {
    primary: 'openrouter',
    model: 'meta-llama/llama-3.1-405b-instruct',
    fallback: 'together-ai'
  },
  
  // Hugging Face → OpenRouter or Together AI
  'huggingface': {
    primary: 'openrouter',
    model: 'huggingface/zephyr-7b-beta',
    fallback: 'together-ai'
  },
  
  // Fireworks AI → OpenRouter
  'fireworks': {
    primary: 'openrouter',
    model: 'fireworks/llama-v3p1-405b-instruct',
    fallback: 'together-ai'
  },
  
  // Aleph Alpha → OpenRouter
  'alephalpha': {
    primary: 'openrouter',
    model: 'aleph-alpha/luminous-supreme',
    fallback: 'anthropic'
  },
  
  // Azure OpenAI → Use regular OpenAI (already working)
  'azure-openai': {
    primary: 'openai',
    model: 'gpt-4o',
    fallback: 'openrouter'
  },
  
  // Writer → OpenRouter
  'writer': {
    primary: 'openrouter',
    model: 'writer/palmyra-x-002',
    fallback: 'anthropic'
  },
  
  // OpenManus → Use OpenAI (code generation)
  'openmanus': {
    primary: 'openai',
    model: 'gpt-4o',
    fallback: 'anthropic'
  },
  
  // Replicate (401 error) → Use OpenRouter or Together AI
  'replicate': {
    primary: 'openrouter',
    model: 'replicate/llama-3.1-405b-instruct',
    fallback: 'together-ai'
  },
  
  // Perplexity (400 error) → Use OpenRouter search models
  'perplexity': {
    primary: 'openrouter',
    model: 'perplexity/llama-3.1-sonar-large-128k-online',
    fallback: 'google' // Gemini has search capabilities
  },
  
  // Cohere (429 rate limited) → Use OpenRouter
  'cohere': {
    primary: 'openrouter',
    model: 'cohere/command-r-plus',
    fallback: 'anthropic'
  },
  
  // xAI (400 error) → Use OpenRouter
  'xai': {
    primary: 'openrouter',
    model: 'xai/grok-2',
    fallback: 'anthropic'
  },
  
  // AI21 (400 error) → Use OpenRouter
  'ai21': {
    primary: 'openrouter',
    model: 'ai21/jamba-1.5-large',
    fallback: 'anthropic'
  },
  
  // AWS Bedrock (404 error) → Use OpenRouter
  'aws-bedrock': {
    primary: 'openrouter',
    model: 'aws-bedrock/anthropic.claude-3-5-sonnet-20241022-v2:0',
    fallback: 'anthropic'
  },
  
  // Sarvam (405 error) → Use OpenRouter or Google (multilingual)
  'sarvam': {
    primary: 'openrouter',
    model: 'sarvam/sarvamai',
    fallback: 'google'
  }
};

/**
 * Available Aggregators (Already Operational)
 */
export const WORKING_AGGREGATORS = {
  'openrouter': {
    name: 'OpenRouter',
    status: 'operational',
    models: '200+',
    costTier: 'free-to-premium',
    capabilities: ['text', 'code', 'reasoning', 'multimodal']
  },
  'together-ai': {
    name: 'Together AI',
    status: 'operational',
    models: '100+',
    costTier: 'low',
    capabilities: ['text', 'code', 'open-source']
  },
  'groq': {
    name: 'Groq',
    status: 'operational',
    models: '10+',
    costTier: 'free',
    capabilities: ['ultra-fast-inference', 'text', 'code']
  }
};

/**
 * Get fallback provider for a given provider ID
 */
export function getAggregatorFallback(providerId: string): {
  primary: string;
  model: string;
  fallback: string;
} | null {
  return AGGREGATOR_FALLBACK_MAP[providerId] || null;
}

/**
 * Check if provider should use aggregator fallback
 */
export function shouldUseAggregatorFallback(providerId: string, apiKey: string | undefined): boolean {
  // If no API key, use aggregator
  if (!apiKey) return true;
  
  // If provider has known issues, use aggregator
  const problematicProviders = [
    'replicate', // 401
    'perplexity', // 400
    'cohere', // 429
    'xai', // 400
    'ai21', // 400
    'aws-bedrock', // 404
    'sarvam' // 405
  ];
  
  return problematicProviders.includes(providerId);
}
