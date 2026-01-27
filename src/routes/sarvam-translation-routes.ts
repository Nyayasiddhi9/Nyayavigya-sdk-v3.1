/**
 * Sarvam AI Translation API Routes v1.0
 * 
 * Provides REST API endpoints for translation services
 * supporting all 22 official Indian languages + English
 */

import { Request, Response, Router } from 'express';
import { sarvamTranslationService } from '../services/sarvam-translation-service';

const router = Router();

/**
 * POST /api/translations/translate
 * Translate a single text string
 */
router.post('/translate', async (req: Request, res: Response) => {
  try {
    const { text, sourceLanguage, targetLanguage, domain, cacheEnabled } = req.body;

    if (!text || !sourceLanguage || !targetLanguage) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: text, sourceLanguage, targetLanguage',
      });
    }

    const result = await sarvamTranslationService.translate({
      text,
      sourceLanguage,
      targetLanguage,
      domain: domain || 'general',
      cacheEnabled: cacheEnabled !== false,
    });

    res.json({
      success: true,
      translation: result,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('❌ Translation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Translation failed',
      message: error.message,
    });
  }
});

/**
 * POST /api/translations/batch
 * Translate multiple texts at once
 */
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { texts, sourceLanguage, targetLanguage, domain } = req.body;

    if (!texts || !Array.isArray(texts) || !sourceLanguage || !targetLanguage) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: texts (array), sourceLanguage, targetLanguage',
      });
    }

    const results = await sarvamTranslationService.batchTranslate({
      texts,
      sourceLanguage,
      targetLanguage,
      domain: domain || 'general',
    });

    res.json({
      success: true,
      translations: results,
      count: results.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('❌ Batch translation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Batch translation failed',
      message: error.message,
    });
  }
});

/**
 * GET /api/translations/all/:key
 * Get all translations for a specific key across all languages
 */
router.get('/all/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { sourceLanguage = 'en' } = req.query;

    const translations = await sarvamTranslationService.getAllTranslations(
      key,
      sourceLanguage as string
    );

    const translationsObject = Object.fromEntries(translations.entries());

    res.json({
      success: true,
      key,
      sourceLanguage,
      translations: translationsObject,
      languageCount: translations.size,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('❌ Get all translations failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get all translations',
      message: error.message,
    });
  }
});

/**
 * GET /api/translations/stats
 * Get translation service statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = sarvamTranslationService.getStats();

    res.json({
      success: true,
      stats,
      service: 'Sarvam AI Translation Service v1.0',
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('❌ Get stats failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stats',
      message: error.message,
    });
  }
});

/**
 * POST /api/translations/cache/clear
 * Clear translation cache
 */
router.post('/cache/clear', async (req: Request, res: Response) => {
  try {
    sarvamTranslationService.clearCache();

    res.json({
      success: true,
      message: 'Translation cache cleared successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('❌ Clear cache failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
      message: error.message,
    });
  }
});

/**
 * GET /api/translations/supported
 * Get list of all supported languages
 */
router.get('/supported', async (req: Request, res: Response) => {
  try {
    const supportedLanguages = [
      { code: 'en', name: 'English', nativeName: 'English', rtl: false },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', rtl: false },
      { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', rtl: false },
      { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', rtl: false },
      { code: 'mr', name: 'Marathi', nativeName: 'मराठी', rtl: false },
      { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', rtl: false },
      { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', rtl: false },
      { code: 'ur', name: 'Urdu', nativeName: 'اردو', rtl: true },
      { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', rtl: false },
      { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', rtl: false },
      { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', rtl: false },
      { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', rtl: false },
      { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', rtl: false },
      { code: 'mai', name: 'Maithili', nativeName: 'मैथिली', rtl: false },
      { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', rtl: false },
      { code: 'kok', name: 'Konkani', nativeName: 'कोंकणी', rtl: false },
      { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', rtl: false },
      { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي', rtl: true },
      { code: 'doi', name: 'Dogri', nativeName: 'डोगरी', rtl: false },
      { code: 'mni', name: 'Manipuri', nativeName: 'মৈতৈলোন্', rtl: false },
      { code: 'brx', name: 'Bodo', nativeName: 'बर\'', rtl: false },
      { code: 'sat', name: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ', rtl: false },
      { code: 'ks', name: 'Kashmiri', nativeName: 'كٲشُر', rtl: true },
    ];

    res.json({
      success: true,
      languages: supportedLanguages,
      total: supportedLanguages.length,
      indianLanguages: 22,
      rtlLanguages: supportedLanguages.filter(l => l.rtl).length,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('❌ Get supported languages failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get supported languages',
      message: error.message,
    });
  }
});

export default router;
