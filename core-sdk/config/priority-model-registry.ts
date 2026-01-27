/**
 * WAI SDK v9.0 - Priority Model Registry
 * Organized LLM, Image, Video, and Audio models with priority access
 */

export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  priority: number;
  contextWindow: number;
  maxOutput: number;
  capabilities: string[];
  costTier: 'free' | 'low' | 'medium' | 'high' | 'premium';
  status: 'active' | 'preview' | 'deprecated';
  useCases: string[];
}

export const PRIORITY_TEXT_MODELS: ModelConfig[] = [
  {
    id: 'gpt-5.2',
    name: 'GPT-5.2',
    provider: 'openai',
    priority: 1,
    contextWindow: 256000,
    maxOutput: 65536,
    capabilities: ['reasoning', 'coding', 'analysis', 'creative', 'multimodal', 'agentic'],
    costTier: 'premium',
    status: 'active',
    useCases: ['complex-autonomous-tasks', 'advanced-agentic-workflows', 'enterprise-automation']
  },
  {
    id: 'gpt-5.1',
    name: 'GPT-5.1',
    provider: 'openai',
    priority: 2,
    contextWindow: 200000,
    maxOutput: 32768,
    capabilities: ['reasoning', 'coding', 'analysis', 'creative', 'multimodal'],
    costTier: 'premium',
    status: 'active',
    useCases: ['complex-reasoning', 'advanced-coding', 'strategic-analysis']
  },
  {
    id: 'gpt-5.0',
    name: 'GPT-5.0',
    provider: 'openai',
    priority: 3,
    contextWindow: 200000,
    maxOutput: 32768,
    capabilities: ['reasoning', 'coding', 'analysis', 'creative'],
    costTier: 'high',
    status: 'active',
    useCases: ['general-advanced-tasks', 'code-generation', 'analysis']
  },
  {
    id: 'o3-pro',
    name: 'o3 Pro',
    provider: 'openai',
    priority: 4,
    contextWindow: 200000,
    maxOutput: 100000,
    capabilities: ['deep-reasoning', 'math', 'logic', 'coding', 'chain-of-thought'],
    costTier: 'premium',
    status: 'active',
    useCases: ['mathematical-reasoning', 'complex-logic', 'scientific-analysis']
  },
  {
    id: 'claude-opus-4.5',
    name: 'Claude Opus 4.5',
    provider: 'anthropic',
    priority: 5,
    contextWindow: 200000,
    maxOutput: 64000,
    capabilities: ['complex-tasks', 'long-context', 'creative', 'analysis', 'agentic'],
    costTier: 'premium',
    status: 'active',
    useCases: ['complex-multi-step', 'creative-writing', 'research', 'autonomous-coding']
  },
  {
    id: 'claude-sonnet-4.5',
    name: 'Claude Sonnet 4.5',
    provider: 'anthropic',
    priority: 6,
    contextWindow: 200000,
    maxOutput: 64000,
    capabilities: ['coding', 'writing', 'analysis', 'multimodal', 'agentic'],
    costTier: 'high',
    status: 'active',
    useCases: ['code-generation', 'long-form-writing', 'document-analysis', 'production-coding']
  },
  {
    id: 'gemini-3.0-pro',
    name: 'Gemini 3.0 Pro',
    provider: 'google',
    priority: 7,
    contextWindow: 4000000,
    maxOutput: 131072,
    capabilities: ['massive-context', 'multimodal', 'reasoning', 'coding', 'video-understanding'],
    costTier: 'premium',
    status: 'active',
    useCases: ['entire-codebases', 'long-document-analysis', 'video-processing', 'research']
  },
  {
    id: 'gemini-3.0-flash',
    name: 'Gemini 3.0 Flash',
    provider: 'google',
    priority: 8,
    contextWindow: 2000000,
    maxOutput: 65536,
    capabilities: ['fast', 'multimodal', 'efficient', 'coding'],
    costTier: 'medium',
    status: 'active',
    useCases: ['fast-multimodal', 'real-time-processing', 'cost-effective-scale']
  },
  {
    id: 'grok-4',
    name: 'Grok 4',
    provider: 'xai',
    priority: 9,
    contextWindow: 256000,
    maxOutput: 65536,
    capabilities: ['real-time', 'conversational', 'research', 'coding', 'web-access'],
    costTier: 'high',
    status: 'active',
    useCases: ['real-time-info', 'conversational-ai', 'research', 'current-events']
  },
  {
    id: 'deepseek-r1-0528',
    name: 'DeepSeek R1 (0528)',
    provider: 'deepseek',
    priority: 10,
    contextWindow: 128000,
    maxOutput: 65536,
    capabilities: ['deep-reasoning', 'math', 'coding', 'chain-of-thought'],
    costTier: 'medium',
    status: 'active',
    useCases: ['mathematical-reasoning', 'complex-logic', 'scientific-analysis']
  },
  {
    id: 'claude-haiku-4.5',
    name: 'Claude Haiku 4.5',
    provider: 'anthropic',
    priority: 11,
    contextWindow: 200000,
    maxOutput: 32000,
    capabilities: ['fast', 'efficient', 'coding', 'analysis'],
    costTier: 'low',
    status: 'active',
    useCases: ['quick-tasks', 'high-volume', 'cost-efficient-operations']
  },
  {
    id: 'sonar-pro-2',
    name: 'Sonar Pro 2',
    provider: 'perplexity',
    priority: 12,
    contextWindow: 200000,
    maxOutput: 16384,
    capabilities: ['web-search', 'citations', 'real-time', 'research'],
    costTier: 'high',
    status: 'active',
    useCases: ['research', 'fact-checking', 'current-information']
  },
];

export const PRIORITY_IMAGE_MODELS: ModelConfig[] = [
  {
    id: 'nano-banana-pro',
    name: 'Nano Banana Pro',
    provider: 'replicate',
    priority: 1,
    contextWindow: 0,
    maxOutput: 0,
    capabilities: ['image-generation', 'high-quality', 'fast'],
    costTier: 'high',
    status: 'active',
    useCases: ['professional-images', 'marketing', 'creative']
  },
  {
    id: 'nano-banana',
    name: 'Nano Banana',
    provider: 'replicate',
    priority: 2,
    contextWindow: 0,
    maxOutput: 0,
    capabilities: ['image-generation', 'quality', 'balanced'],
    costTier: 'medium',
    status: 'active',
    useCases: ['general-images', 'prototyping']
  },
  {
    id: 'seedream-v4',
    name: 'Seedream v4',
    provider: 'together-ai',
    priority: 3,
    contextWindow: 0,
    maxOutput: 0,
    capabilities: ['image-generation', 'creative', 'artistic'],
    costTier: 'medium',
    status: 'active',
    useCases: ['artistic-images', 'creative-content']
  },
  {
    id: 'gpt-image',
    name: 'GPT Image (DALL-E)',
    provider: 'openai',
    priority: 4,
    contextWindow: 0,
    maxOutput: 0,
    capabilities: ['image-generation', 'text-understanding', 'editing'],
    costTier: 'high',
    status: 'active',
    useCases: ['text-to-image', 'image-editing', 'creative']
  },
  {
    id: 'flux-1.1-pro-ultra',
    name: 'FLUX 1.1 Pro Ultra',
    provider: 'replicate',
    priority: 5,
    contextWindow: 0,
    maxOutput: 0,
    capabilities: ['image-generation', 'ultra-high-quality', 'photorealistic'],
    costTier: 'premium',
    status: 'active',
    useCases: ['photorealistic', 'professional-quality']
  },
  {
    id: 'flux-1-kontext',
    name: 'FLUX.1 Kontext',
    provider: 'replicate',
    priority: 6,
    contextWindow: 0,
    maxOutput: 0,
    capabilities: ['image-generation', 'context-aware', 'editing'],
    costTier: 'high',
    status: 'active',
    useCases: ['contextual-editing', 'image-manipulation']
  },
  {
    id: 'gemini-imagen-4-preview',
    name: 'Gemini Imagen 4 Preview',
    provider: 'google',
    priority: 7,
    contextWindow: 0,
    maxOutput: 0,
    capabilities: ['image-generation', 'text-rendering', 'multimodal'],
    costTier: 'high',
    status: 'preview',
    useCases: ['text-in-images', 'multimodal-generation']
  },
  {
    id: 'recraft-v3',
    name: 'Recraft V3',
    provider: 'recraft',
    priority: 8,
    contextWindow: 0,
    maxOutput: 0,
    capabilities: ['image-generation', 'vector', 'design'],
    costTier: 'medium',
    status: 'active',
    useCases: ['design-assets', 'vector-graphics', 'illustrations']
  },
  {
    id: 'ideogram-v3',
    name: 'Ideogram V3',
    provider: 'ideogram',
    priority: 9,
    contextWindow: 0,
    maxOutput: 0,
    capabilities: ['image-generation', 'text-rendering', 'logos'],
    costTier: 'medium',
    status: 'active',
    useCases: ['text-heavy-images', 'logos', 'typography']
  },
  {
    id: 'qwen-image',
    name: 'Qwen Image',
    provider: 'alibaba',
    priority: 10,
    contextWindow: 0,
    maxOutput: 0,
    capabilities: ['image-generation', 'chinese-text', 'artistic'],
    costTier: 'low',
    status: 'active',
    useCases: ['multilingual-images', 'asian-aesthetics']
  },
];

export const PRIORITY_VIDEO_MODELS: ModelConfig[] = [
  {
    id: 'gemini-veo-3.1',
    name: 'Gemini Veo 3.1',
    provider: 'google',
    priority: 1,
    contextWindow: 0,
    maxOutput: 0,
    capabilities: ['video-generation', 'text-to-video', 'high-quality'],
    costTier: 'premium',
    status: 'active',
    useCases: ['professional-video', 'marketing', 'content-creation']
  },
  {
    id: 'sora-2',
    name: 'Sora 2',
    provider: 'openai',
    priority: 2,
    contextWindow: 0,
    maxOutput: 0,
    capabilities: ['video-generation', 'cinematic', 'long-form'],
    costTier: 'premium',
    status: 'active',
    useCases: ['cinematic-video', 'storytelling', 'creative']
  },
  {
    id: 'kling-v2.5',
    name: 'Kling V2.5',
    provider: 'kuaishou',
    priority: 3,
    contextWindow: 0,
    maxOutput: 0,
    capabilities: ['video-generation', 'realistic', 'motion'],
    costTier: 'high',
    status: 'active',
    useCases: ['realistic-motion', 'action-sequences']
  },
  {
    id: 'seedance-pro',
    name: 'Seedance Pro',
    provider: 'together-ai',
    priority: 4,
    contextWindow: 0,
    maxOutput: 0,
    capabilities: ['video-generation', 'dance', 'motion'],
    costTier: 'high',
    status: 'active',
    useCases: ['dance-videos', 'motion-graphics']
  },
  {
    id: 'minimax-hailuo-02',
    name: 'MiniMax Hailuo-02 Standard',
    provider: 'minimax',
    priority: 5,
    contextWindow: 0,
    maxOutput: 0,
    capabilities: ['video-generation', 'chinese-optimized', 'efficient'],
    costTier: 'medium',
    status: 'active',
    useCases: ['fast-video', 'social-content']
  },
  {
    id: 'pixverse-v5',
    name: 'PixVerse V5',
    provider: 'pixverse',
    priority: 6,
    contextWindow: 0,
    maxOutput: 0,
    capabilities: ['video-generation', 'artistic', 'stylized'],
    costTier: 'medium',
    status: 'active',
    useCases: ['artistic-video', 'stylized-content']
  },
  {
    id: 'fal-lipsync-v2',
    name: 'Fal Lipsync V2',
    provider: 'fal',
    priority: 7,
    contextWindow: 0,
    maxOutput: 0,
    capabilities: ['lip-sync', 'talking-head', 'avatar'],
    costTier: 'medium',
    status: 'active',
    useCases: ['lip-sync', 'avatar-videos', 'dubbing']
  },
  {
    id: 'wan-v2.2',
    name: 'Wan V2.2',
    provider: 'alibaba',
    priority: 8,
    contextWindow: 0,
    maxOutput: 0,
    capabilities: ['video-generation', 'chinese', 'efficient'],
    costTier: 'low',
    status: 'active',
    useCases: ['budget-video', 'asian-content']
  },
  {
    id: 'hunyuan',
    name: 'Hunyuan',
    provider: 'tencent',
    priority: 9,
    contextWindow: 0,
    maxOutput: 0,
    capabilities: ['video-generation', 'multilingual', 'versatile'],
    costTier: 'medium',
    status: 'active',
    useCases: ['multilingual-video', 'general-purpose']
  },
  {
    id: 'vidu',
    name: 'Vidu',
    provider: 'vidu',
    priority: 10,
    contextWindow: 0,
    maxOutput: 0,
    capabilities: ['video-generation', 'realistic', 'characters'],
    costTier: 'medium',
    status: 'active',
    useCases: ['character-animation', 'storytelling']
  },
  {
    id: 'runway-gen3',
    name: 'Runway Gen-3',
    provider: 'runway',
    priority: 11,
    contextWindow: 0,
    maxOutput: 0,
    capabilities: ['video-generation', 'professional', 'editing'],
    costTier: 'high',
    status: 'active',
    useCases: ['professional-editing', 'effects']
  },
];

export const PRIORITY_AUDIO_MODELS: ModelConfig[] = [
  {
    id: 'gemini-audio',
    name: 'Gemini Audio',
    provider: 'google',
    priority: 1,
    contextWindow: 0,
    maxOutput: 0,
    capabilities: ['tts', 'voice-synthesis', 'multilingual'],
    costTier: 'high',
    status: 'active',
    useCases: ['text-to-speech', 'voice-generation', 'multilingual']
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    provider: 'elevenlabs',
    priority: 2,
    contextWindow: 0,
    maxOutput: 0,
    capabilities: ['tts', 'voice-cloning', 'emotional', 'multilingual'],
    costTier: 'high',
    status: 'active',
    useCases: ['high-quality-tts', 'voice-cloning', 'audiobooks']
  },
  {
    id: 'minimax-audio',
    name: 'Minimax Audio',
    provider: 'minimax',
    priority: 3,
    contextWindow: 0,
    maxOutput: 0,
    capabilities: ['tts', 'music', 'sound-effects'],
    costTier: 'medium',
    status: 'active',
    useCases: ['general-audio', 'sound-effects']
  },
  {
    id: 'mureka',
    name: 'Mureka',
    provider: 'mureka',
    priority: 4,
    contextWindow: 0,
    maxOutput: 0,
    capabilities: ['music-generation', 'composition', 'genres'],
    costTier: 'medium',
    status: 'active',
    useCases: ['music-generation', 'background-music']
  },
  {
    id: 'lyria2',
    name: 'Lyria 2',
    provider: 'google',
    priority: 5,
    contextWindow: 0,
    maxOutput: 0,
    capabilities: ['music-generation', 'high-fidelity', 'composition'],
    costTier: 'premium',
    status: 'active',
    useCases: ['professional-music', 'composition', 'soundtracks']
  },
];

export function getModelByPriority(type: 'text' | 'image' | 'video' | 'audio', priority: number): ModelConfig | undefined {
  const registry = {
    text: PRIORITY_TEXT_MODELS,
    image: PRIORITY_IMAGE_MODELS,
    video: PRIORITY_VIDEO_MODELS,
    audio: PRIORITY_AUDIO_MODELS,
  };
  return registry[type].find(m => m.priority === priority);
}

export function getModelsForUseCase(type: 'text' | 'image' | 'video' | 'audio', useCase: string): ModelConfig[] {
  const registry = {
    text: PRIORITY_TEXT_MODELS,
    image: PRIORITY_IMAGE_MODELS,
    video: PRIORITY_VIDEO_MODELS,
    audio: PRIORITY_AUDIO_MODELS,
  };
  return registry[type]
    .filter(m => m.useCases.some(uc => uc.includes(useCase) || useCase.includes(uc)))
    .sort((a, b) => a.priority - b.priority);
}

export function getTopNModels(type: 'text' | 'image' | 'video' | 'audio', n: number = 5): ModelConfig[] {
  const registry = {
    text: PRIORITY_TEXT_MODELS,
    image: PRIORITY_IMAGE_MODELS,
    video: PRIORITY_VIDEO_MODELS,
    audio: PRIORITY_AUDIO_MODELS,
  };
  return registry[type].slice(0, n);
}

export function getAllModels(): {
  text: ModelConfig[];
  image: ModelConfig[];
  video: ModelConfig[];
  audio: ModelConfig[];
} {
  return {
    text: PRIORITY_TEXT_MODELS,
    image: PRIORITY_IMAGE_MODELS,
    video: PRIORITY_VIDEO_MODELS,
    audio: PRIORITY_AUDIO_MODELS,
  };
}

console.log('📊 Priority Model Registry loaded:', {
  text: PRIORITY_TEXT_MODELS.length,
  image: PRIORITY_IMAGE_MODELS.length,
  video: PRIORITY_VIDEO_MODELS.length,
  audio: PRIORITY_AUDIO_MODELS.length,
});
