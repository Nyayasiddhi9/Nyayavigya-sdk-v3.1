/**
 * WAI SDK v2.0 Internationalization Package
 * 
 * Translation and localization services including:
 * - Sarvam AI translation (22 Indian languages + English)
 * - Advanced language switching
 * - Multi-language sandbox execution
 * 
 * Services included:
 * - sarvam-translation-service.ts: Sarvam AI translation
 * - advanced-language-switching-service.ts: Language switching
 * - multi-language-sandbox.ts: Multi-language code execution
 * 
 * Supported Languages:
 * - 22 Indian languages (Hindi, Tamil, Telugu, Bengali, etc.)
 * - 12 global languages (English, Spanish, French, etc.)
 * 
 * Note: Import services directly from their source files.
 * Some services may require path adjustments for standalone SDK use.
 */

export const i18nPackageInfo = {
  name: 'wai-sdk-i18n',
  version: '2.0.0',
  services: [
    'sarvam-translation-service',
    'advanced-language-switching-service',
    'multi-language-sandbox'
  ],
  capabilities: [
    'Sarvam AI Translation',
    '22 Indian Languages',
    '12 Global Languages',
    'Language Switching',
    'Multi-language Sandbox'
  ],
  supportedLanguages: {
    indian: ['hi', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'or', 'pa', 'as', 'ur', 'mai', 'sat', 'ks', 'ne', 'sd', 'kok', 'mni', 'doi', 'sa', 'bo'],
    global: ['en', 'es', 'fr', 'de', 'pt', 'it', 'ru', 'zh', 'ja', 'ko', 'ar', 'nl']
  }
};
