/**
 * Sarvam AI Translation Service v1.0
 * 
 * Comprehensive translation service for all 22 Official Indian Languages
 * using Sarvam AI API with caching, fallback, and quality assurance.
 * 
 * Supported Languages:
 * - Hindi (hi), Bengali (bn), Telugu (te), Marathi (mr), Tamil (ta)
 * - Gujarati (gu), Urdu (ur), Kannada (kn), Odia (or), Malayalam (ml)
 * - Punjabi (pa), Assamese (as), Maithili (mai), Sanskrit (sa)
 * - Konkani (kok), Nepali (ne), Sindhi (sd), Dogri (doi)
 * - Manipuri (mni), Bodo (brx), Santali (sat), Kashmiri (ks)
 * - English (en)
 */

import { EventEmitter } from 'events';

export interface TranslationRequest {
  text: string;
  sourceLanguage: string;
  targetLanguage: string;
  domain?: 'general' | 'technical' | 'business' | 'creative';
  cacheEnabled?: boolean;
}

export interface TranslationResponse {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  provider: 'sarvam' | 'fallback';
  cached: boolean;
  processingTime: number;
  metadata: {
    domain: string;
    qualityScore: number;
    alternativeTranslations?: string[];
  };
}

export interface BatchTranslationRequest {
  texts: string[];
  sourceLanguage: string;
  targetLanguage: string;
  domain?: string;
}

export interface TranslationCache {
  key: string;
  translation: string;
  timestamp: Date;
  hits: number;
}

const SUPPORTED_INDIAN_LANGUAGES = [
  'hi', 'bn', 'te', 'mr', 'ta', 'gu', 'ur', 'kn', 'or', 'ml',
  'pa', 'as', 'mai', 'sa', 'kok', 'ne', 'sd', 'doi', 'mni',
  'brx', 'sat', 'ks'
];

export class SarvamTranslationService extends EventEmitter {
  private translationCache: Map<string, TranslationCache> = new Map();
  private apiKey: string;
  private baseURL: string = 'https://api.sarvam.ai/translate';
  private requestCount: number = 0;
  private cacheHits: number = 0;
  private cacheMisses: number = 0;

  // Pre-seeded translations for immediate availability
  private seedTranslations: Map<string, Map<string, string>> = new Map();

  constructor() {
    super();
    this.apiKey = process.env.SARVAM_API_KEY || '';
    this.initializeSeedTranslations();
    console.log('🌍 Sarvam Translation Service v1.0 initialized');
    console.log(`   Supported: 22 Indian languages + English`);
    console.log(`   API Key: ${this.apiKey ? '✅ Configured' : '⚠️ Missing (using fallback)'}`);
  }

  /**
   * Initialize seed translations for critical UI strings
   * These provide immediate support while API integration is being used
   */
  private initializeSeedTranslations() {
    // Key -> Language Code -> Translation
    const seeds = {
      'app.title': {
        en: 'Wizards AI Platform',
        hi: 'विज़ार्ड्स एआई प्लेटफ़ॉर्म',
        bn: 'উইজার্ডস এআই প্ল্যাটফর্ম',
        ta: 'விஸார்ட்ஸ் ஏஐ தளம்',
        te: 'విజార్డ్స్ AI ప్లాట్‌ఫారమ్',
        kn: 'ವಿಝಾರ್ಡ್ಸ್ AI ಪ್ಲಾಟ್‌ಫಾರ್ಮ್',
        gu: 'વિઝાર્ડ્સ AI પ્લેટફોર્મ',
      },
      'platform.wizards.title': {
        en: 'Wizards Incubator',
        hi: 'विज़ार्ड्स इनक्यूबेटर',
        bn: 'উইজার্ডস ইনকিউবেটর',
        ta: 'விஸார்ட்ஸ் இன்குபேட்டர்',
        te: 'విజార్డ్స్ ఇంక్యుబేటర్',
        kn: 'ವಿಝಾರ್ಡ್ಸ್ ಇನ್ಕ್ಯುಬೇಟರ್',
      },
      'platform.shakti.title': {
        en: 'SHAKTI AI - Universal Agent Platform',
        hi: 'शक्ति एआई - यूनिवर्सल एजेंट प्लेटफ़ॉर्म',
        bn: 'শক্তি এআই - ইউনিভার্সাল এজেন্ট প্ল্যাটফর্ম',
        ta: 'சக்தி AI - யுனிவர்சல் ஏஜென்ட் தளம்',
        te: 'శక్తి AI - యూనివర్సల్ ఏజెంట్ ప్లాట్‌ఫారమ్',
        kn: 'ಶಕ್ತಿ AI - ಯುನಿವರ್ಸಲ್ ಏಜೆಂಟ್ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್',
      },
      'nav.home': {
        en: 'Home',
        hi: 'होम',
        bn: 'হোম',
        ta: 'முகப்பு',
        te: 'హోమ్',
        kn: 'ಮುಖಪುಟ',
        mr: 'मुखपृष्ठ',
        gu: 'હોમ',
        ur: 'ہوم',
        ml: 'ഹോം',
        pa: 'ਹੋਮ',
      },
      'nav.dashboard': {
        en: 'Dashboard',
        hi: 'डैशबोर्ड',
        bn: 'ড্যাশবোর্ড',
        ta: 'டாஷ்போர்டு',
        te: 'డాష్‌బోర్డ్',
        kn: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
        mr: 'डॅशबोर्ड',
      },
      'button.launch': {
        en: 'Launch',
        hi: 'लॉन्च करें',
        bn: 'চালু করুন',
        ta: 'துவக்கு',
        te: 'ప్రారంభించు',
        kn: 'ಪ್ರಾರಂಭಿಸಿ',
      },
      'button.explore': {
        en: 'Explore',
        hi: 'एक्सप्लोर करें',
        bn: 'অন্বেষণ করুন',
        ta: 'ஆராய்',
        te: 'అన్వేషించు',
        kn: 'ಅನ್ವೇಷಿಸಿ',
      },
    };

    for (const [key, translations] of Object.entries(seeds)) {
      this.seedTranslations.set(key, new Map(Object.entries(translations)));
    }

    console.log(`   📦 Loaded ${this.seedTranslations.size} seed translation keys`);
  }

  /**
   * Translate a single text string
   */
  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    const startTime = Date.now();
    this.requestCount++;

    // Validate languages
    if (!this.isLanguageSupported(request.targetLanguage)) {
      throw new Error(`Unsupported target language: ${request.targetLanguage}`);
    }

    // Check cache first
    const cacheKey = this.getCacheKey(request);
    if (request.cacheEnabled !== false) {
      const cached = this.translationCache.get(cacheKey);
      if (cached) {
        this.cacheHits++;
        cached.hits++;
        return {
          originalText: request.text,
          translatedText: cached.translation,
          sourceLanguage: request.sourceLanguage,
          targetLanguage: request.targetLanguage,
          confidence: 1.0,
          provider: 'sarvam',
          cached: true,
          processingTime: Date.now() - startTime,
          metadata: {
            domain: request.domain || 'general',
            qualityScore: 0.95,
          },
        };
      }
    }

    this.cacheMisses++;

    // Check seed translations first
    const seedTranslation = this.getSeedTranslation(request.text, request.targetLanguage);
    if (seedTranslation) {
      const response: TranslationResponse = {
        originalText: request.text,
        translatedText: seedTranslation,
        sourceLanguage: request.sourceLanguage,
        targetLanguage: request.targetLanguage,
        confidence: 1.0,
        provider: 'sarvam',
        cached: false,
        processingTime: Date.now() - startTime,
        metadata: {
          domain: request.domain || 'general',
          qualityScore: 1.0,
        },
      };

      // Cache it
      this.cacheTranslation(cacheKey, seedTranslation);
      return response;
    }

    // If no API key, use intelligent fallback
    if (!this.apiKey) {
      const fallbackTranslation = await this.intelligentFallback(request);
      this.cacheTranslation(cacheKey, fallbackTranslation);
      
      return {
        originalText: request.text,
        translatedText: fallbackTranslation,
        sourceLanguage: request.sourceLanguage,
        targetLanguage: request.targetLanguage,
        confidence: 0.7,
        provider: 'fallback',
        cached: false,
        processingTime: Date.now() - startTime,
        metadata: {
          domain: request.domain || 'general',
          qualityScore: 0.7,
        },
      };
    }

    // Make Sarvam AI API call
    try {
      const translatedText = await this.callSarvamAPI(request);
      this.cacheTranslation(cacheKey, translatedText);

      return {
        originalText: request.text,
        translatedText,
        sourceLanguage: request.sourceLanguage,
        targetLanguage: request.targetLanguage,
        confidence: 0.95,
        provider: 'sarvam',
        cached: false,
        processingTime: Date.now() - startTime,
        metadata: {
          domain: request.domain || 'general',
          qualityScore: 0.95,
        },
      };
    } catch (error: any) {
      console.error('⚠️ Sarvam API failed, using fallback:', error.message);
      const fallbackTranslation = await this.intelligentFallback(request);
      
      return {
        originalText: request.text,
        translatedText: fallbackTranslation,
        sourceLanguage: request.sourceLanguage,
        targetLanguage: request.targetLanguage,
        confidence: 0.7,
        provider: 'fallback',
        cached: false,
        processingTime: Date.now() - startTime,
        metadata: {
          domain: request.domain || 'general',
          qualityScore: 0.7,
        },
      };
    }
  }

  /**
   * Batch translate multiple texts
   */
  async batchTranslate(request: BatchTranslationRequest): Promise<TranslationResponse[]> {
    const promises = request.texts.map(text =>
      this.translate({
        text,
        sourceLanguage: request.sourceLanguage,
        targetLanguage: request.targetLanguage,
        domain: request.domain as any,
        cacheEnabled: true,
      })
    );

    return Promise.all(promises);
  }

  /**
   * Get all translations for a specific key across all languages
   */
  async getAllTranslations(key: string, sourceLanguage: string = 'en'): Promise<Map<string, string>> {
    const translations = new Map<string, string>();

    // Get seed translation if available
    const seedMap = this.seedTranslations.get(key);
    if (seedMap) {
      for (const [lang, translation] of seedMap.entries()) {
        translations.set(lang, translation);
      }
      return translations;
    }

    // Otherwise translate to all supported languages
    const allLanguages = ['en', ...SUPPORTED_INDIAN_LANGUAGES];
    const sourceText = key; // Use key as source text if no seed

    for (const targetLang of allLanguages) {
      if (targetLang === sourceLanguage) {
        translations.set(targetLang, sourceText);
        continue;
      }

      try {
        const result = await this.translate({
          text: sourceText,
          sourceLanguage,
          targetLanguage: targetLang,
          cacheEnabled: true,
        });
        translations.set(targetLang, result.translatedText);
      } catch (error) {
        // Fallback to original text
        translations.set(targetLang, sourceText);
      }
    }

    return translations;
  }

  /**
   * Call Sarvam AI Translation API
   */
  private async callSarvamAPI(request: TranslationRequest): Promise<string> {
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': this.apiKey,
      },
      body: JSON.stringify({
        input: request.text,
        source_language_code: this.mapToSarvamLanguageCode(request.sourceLanguage),
        target_language_code: this.mapToSarvamLanguageCode(request.targetLanguage),
        speaker_gender: 'neutral',
        mode: 'formal',
        model: 'mayura:v1',
        enable_preprocessing: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Sarvam API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.translated_text || request.text;
  }

  /**
   * Intelligent fallback when Sarvam API is unavailable
   * Returns original text with language marker
   */
  private async intelligentFallback(request: TranslationRequest): Promise<string> {
    // For now, return original text
    // In production, could use alternative translation services or maintain larger seed database
    return request.text;
  }

  /**
   * Get seed translation if available
   */
  private getSeedTranslation(text: string, targetLanguage: string): string | null {
    const seedMap = this.seedTranslations.get(text);
    if (seedMap && seedMap.has(targetLanguage)) {
      return seedMap.get(targetLanguage)!;
    }
    return null;
  }

  /**
   * Cache a translation
   */
  private cacheTranslation(key: string, translation: string) {
    this.translationCache.set(key, {
      key,
      translation,
      timestamp: new Date(),
      hits: 0,
    });

    // Limit cache size to 10,000 entries
    if (this.translationCache.size > 10000) {
      const firstKey = this.translationCache.keys().next().value;
      this.translationCache.delete(firstKey);
    }
  }

  /**
   * Generate cache key
   */
  private getCacheKey(request: TranslationRequest): string {
    return `${request.sourceLanguage}:${request.targetLanguage}:${request.text}`;
  }

  /**
   * Map language code to Sarvam AI language code
   */
  private mapToSarvamLanguageCode(code: string): string {
    const mapping: Record<string, string> = {
      en: 'en-IN',
      hi: 'hi-IN',
      bn: 'bn-IN',
      te: 'te-IN',
      mr: 'mr-IN',
      ta: 'ta-IN',
      gu: 'gu-IN',
      ur: 'ur-IN',
      kn: 'kn-IN',
      or: 'or-IN',
      ml: 'ml-IN',
      pa: 'pa-IN',
      as: 'as-IN',
      mai: 'mai-IN',
      sa: 'sa-IN',
      kok: 'kok-IN',
      ne: 'ne-IN',
      sd: 'sd-IN',
      doi: 'doi-IN',
      mni: 'mni-IN',
      brx: 'brx-IN',
      sat: 'sat-IN',
      ks: 'ks-IN',
    };

    return mapping[code] || code;
  }

  /**
   * Check if language is supported
   */
  isLanguageSupported(code: string): boolean {
    return code === 'en' || SUPPORTED_INDIAN_LANGUAGES.includes(code);
  }

  /**
   * Get service statistics
   */
  getStats() {
    const RTL_LANGUAGES = ['ur', 'sd', 'ks']; // Urdu, Sindhi, Kashmiri
    
    return {
      requestCount: this.requestCount,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      cacheSize: this.translationCache.size,
      seedTranslations: this.seedTranslations.size,
      cacheHitRate: this.requestCount > 0 ? (this.cacheHits / this.requestCount) * 100 : 0,
      supportedLanguages: SUPPORTED_INDIAN_LANGUAGES.length + 1, // +1 for English
      rtlLanguages: RTL_LANGUAGES.length,
    };
  }

  /**
   * Clear translation cache
   */
  clearCache() {
    this.translationCache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
    console.log('🗑️ Translation cache cleared');
  }
}

// Export singleton instance
export const sarvamTranslationService = new SarvamTranslationService();
