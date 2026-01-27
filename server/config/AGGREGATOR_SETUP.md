# Aggregator Fallback Configuration
## NyayaVighya SDK v1.0 - Using Aggregators for Missing API Keys

## ✅ Current Status

**Working Aggregators:**
- ✅ **OpenRouter** - 200+ models (FREE tier available)
- ✅ **Together AI** - 100+ open-source models
- ✅ **Groq** - Ultra-fast inference

## 🔄 Automatic Fallback Mapping

The system now automatically routes requests for providers with missing/broken API keys through aggregators:

### Providers → Aggregator Mapping

| Provider (Missing/Broken) | Primary Aggregator | Fallback |
|---------------------------|-------------------|----------|
| **Meta/Llama** | OpenRouter | Together AI |
| **Hugging Face** | OpenRouter | Together AI |
| **Fireworks AI** | OpenRouter | Together AI |
| **Aleph Alpha** | OpenRouter | Anthropic |
| **Azure OpenAI** | OpenAI (existing) | OpenRouter |
| **Writer** | OpenRouter | Anthropic |
| **OpenManus** | OpenAI | Anthropic |
| **Replicate** (401) | OpenRouter | Together AI |
| **Perplexity** (400) | OpenRouter | Google |
| **Cohere** (429) | OpenRouter | Anthropic |
| **xAI** (400) | OpenRouter | Anthropic |
| **AI21** (400) | OpenRouter | Anthropic |
| **AWS Bedrock** (404) | OpenRouter | Anthropic |
| **Sarvam** (405) | OpenRouter | Google |

## 🚀 How It Works

1. **Request comes in** for a provider (e.g., "meta/llama-3.1-405b")
2. **System checks** if API key exists or if provider has errors
3. **If missing/broken**: Routes through OpenRouter with equivalent model
4. **If OpenRouter fails**: Falls back to secondary provider
5. **Cost optimization**: Prioritizes free/low-cost models in OpenRouter

## 💡 Benefits

- **No need for 20+ API keys** - Just use OpenRouter for most providers
- **Automatic failover** - If provider is down, uses aggregator
- **Cost savings** - OpenRouter has free tier for many models
- **200+ models accessible** - Through single OpenRouter API key

## 📊 Provider Coverage

**Via OpenRouter (with existing API key):**
- Meta/Llama models
- Anthropic Claude
- OpenAI GPT models
- Google Gemini
- Mistral models
- Cohere models
- AI21 Jamba
- xAI Grok
- Perplexity models
- And 190+ more...

**Direct (with API keys):**
- ✅ OpenAI (native)
- ✅ Anthropic (native)
- ✅ Google (native)
- ✅ Mistral (native)
- ✅ DeepSeek (native)
- ✅ ElevenLabs (native)
- ✅ Groq (native)
- ✅ KIMI K2 (native)

## 🔧 Configuration Files

- **Mapping**: `server/config/aggregator-fallback-mapping.ts`
- **Gateway**: `server/integrations/wai-provider-gateway-v9.ts`
- **Fallback System**: `server/services/5-level-fallback-system.ts`

## 🎯 Next Steps (Optional)

To get **individual provider API keys** for better performance:

1. **Replicate** - Get key from replicate.com
2. **Perplexity** - Get key from perplexity.ai
3. **Cohere** - Get key from cohere.com (or upgrade plan)
4. **xAI** - Verify key format at x.ai
5. **AI21** - Get key from ai21.com

But these are **optional** - the system works without them via aggregators!

## 📈 Performance

- **Latency**: Slightly higher through aggregator (~50-100ms overhead)
- **Reliability**: Higher (aggregators handle failover automatically)
- **Cost**: Lower (uses free/low-cost aggregator models)
- **Coverage**: Much higher (200+ models vs ~10)

---

**Status**: ✅ Configured and operational  
**Last Updated**: October 9, 2025
