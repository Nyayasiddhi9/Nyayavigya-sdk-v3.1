import { createContext, useContext, useState, useEffect, useRef } from 'react';

// All 22 Official Indian Languages + English = 23 Total Languages
export type SupportedLanguage = 
  | 'en'    // English
  | 'hi'    // Hindi
  | 'bn'    // Bengali
  | 'te'    // Telugu
  | 'mr'    // Marathi
  | 'ta'    // Tamil
  | 'gu'    // Gujarati
  | 'ur'    // Urdu (RTL)
  | 'kn'    // Kannada
  | 'or'    // Odia
  | 'ml'    // Malayalam
  | 'pa'    // Punjabi
  | 'as'    // Assamese
  | 'mai'   // Maithili
  | 'sa'    // Sanskrit
  | 'kok'   // Konkani
  | 'ne'    // Nepali
  | 'sd'    // Sindhi
  | 'doi'   // Dogri
  | 'mni'   // Manipuri
  | 'brx'   // Bodo
  | 'sat'   // Santali
  | 'ks';   // Kashmiri

export interface LanguageTranslations {
  [key: string]: Partial<Record<SupportedLanguage, string>>;
}

const translations: LanguageTranslations = {
  'app.title': {
    en: 'Wizards AI Platform',
    hi: 'विज़ार्ड्स एआई प्लेटफॉर्म',
    ta: 'விஸார்ட்ஸ் AI தளம்',
    te: 'విజార్డ్స్ AI ప్లాట్‌ఫారమ్',
    kn: 'ವಿಜಾರ್ಡ್ಸ್ AI ಪ್ಲಾಟ್‌ಫಾರ್ಮ್',
    bn: 'উইজার্ডস এআই প্ল্যাটফর্ম',
  },
  'nav.incubator': {
    en: 'Wizards Incubator',
    hi: 'विज़ार्ड्स इनक्यूबेटर',
    ta: 'விஸார்ட்ஸ் இன்குபேட்டர்',
    te: 'విజార్డ్స్ ఇంక్యుబేటర్',
    kn: 'ವಿಜಾರ್ಡ್ಸ್ ಇನ್ಕ್ಯುಬೇಟರ್',
    bn: 'উইজার্ডস ইনকিউবেটর',
  },
  'nav.superagent': {
    en: 'AI Super Agent',
    hi: 'एआई सुपर एजेंट',
    ta: 'AI சூப்பர் ஏஜென்ட்',
    te: 'AI సూపర్ ఏజెంట్',
    kn: 'AI ಸೂಪರ್ ಏಜೆಂಟ್',
    bn: 'এআই সুপার এজেন্ট',
  },
  'chat.placeholder': {
    en: 'Type your message...',
    hi: 'अपना संदेश लिखें...',
    ta: 'உங்கள் செய்தியை உள்ளிடவும்...',
    te: 'మీ సందేశాన్ని టైప్ చేయండి...',
    kn: 'ನಿಮ್ಮ ಸಂದೇಶವನ್ನು ಟೈಪ್ ಮಾಡಿ...',
    bn: 'আপনার বার্তা টাইপ করুন...',
  },
  'chat.send': {
    en: 'Send',
    hi: 'भेजें',
    ta: 'அனுப்பு',
    te: 'పంపు',
    kn: 'ಕಳುಹಿಸಿ',
    bn: 'পাঠান',
  },
  'assistant.greeting': {
    en: 'Hi! I\'m your AI assistant. How can I help you today?',
    hi: 'नमस्ते! मैं आपका एआई सहायक हूं। आज मैं आपकी कैसे मदद कर सकता हूं?',
    ta: 'வணக்கம்! நான் உங்கள் AI உதவியாளர். இன்று நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?',
    te: 'హలో! నేను మీ AI సహాయకుడిని. నేను ఈరోజు మీకు ఎలా సహాయం చేయగలను?',
    kn: 'ಹಲೋ! ನಾನು ನಿಮ್ಮ AI ಸಹಾಯಕ. ನಾನು ಇಂದು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?',
    bn: 'হ্যালো! আমি আপনার AI সহায়ক। আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?',
  },
  'tools.title': {
    en: 'Available Tools',
    hi: 'उपलब्ध उपकरण',
    ta: 'கிடைக்கக்கூடிய கருவிகள்',
    te: 'అందుబాటులో ఉన్న సాధనాలు',
    kn: 'ಲಭ್ಯವಿರುವ ಸಾಧನಗಳು',
    bn: 'উপলব্ধ সরঞ্জাম',
  },
  'settings.language': {
    en: 'Language',
    hi: 'भाषा',
    ta: 'மொழி',
    te: 'భాష',
    kn: 'ಭಾಷೆ',
    bn: 'ভাষা',
  },
  // GlobalHeader translations
  'platform': {
    en: 'Platform',
    hi: 'प्लेटफ़ॉर्म',
    ta: 'தளம்',
    te: 'ప్లాట్‌ఫారమ్',
    kn: 'ಪ್ಲಾಟ್‌ಫಾರ್ಮ್',
    bn: 'প্ল্যাটফর্ম',
  },
  'incubator': {
    en: 'Incubator',
    hi: 'इनक्यूबेटर',
    ta: 'இன்குபேட்டர்',
    te: 'ఇంక్యుబేటర్',
    kn: 'ಇನ್ಕ್ಯುಬೇಟರ್',
    bn: 'ইনকিউবেটর',
  },
  'superAgent': {
    en: 'Super Agent',
    hi: 'सुपर एजेंट',
    ta: 'சூப்பர் ஏஜென்ட்',
    te: 'సూపర్ ఏజెంట్',
    kn: 'ಸೂಪರ್ ಏಜೆಂಟ್',
    bn: 'সুপার এজেন্ট',
  },
  'wizardsIncubator': {
    en: 'Wizards Incubator',
    hi: 'विज़ार्ड्स इनक्यूबेटर',
    ta: 'விஸார்ட்ஸ் இன்குபேட்டர்',
    te: 'విజార్డ్స్ ఇంక్యుబేటర్',
    kn: 'ವಿಜಾರ್ಡ್ಸ್ ಇನ್ಕ್ಯುಬೇಟರ್',
    bn: 'উইজার্ডস ইনকিউবেটর',
  },
  'aiSuperAgent': {
    en: 'AI Super Agent',
    hi: 'एआई सुपर एजेंट',
    ta: 'AI சூப்பர் ஏஜென்ட்',
    te: 'AI సూపర్ ఏజెంట్',
    kn: 'AI ಸೂಪರ್ ಏಜೆಂಟ್',
    bn: 'এআই সুপার এজেন্ট',
  },
  'dashboard': {
    en: 'Dashboard',
    hi: 'डैशबोर्ड',
    ta: 'டாஷ்போர்டு',
    te: 'డ్యాష్‌బోర్డ్',
    kn: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    bn: 'ড্যাশবোর্ড',
  },
  'workspace': {
    en: 'Workspace',
    hi: 'कार्यस्थान',
    ta: 'பணியிடம்',
    te: 'కార్యస్థలం',
    kn: 'ಕಾರ್ಯಸ್ಥಳ',
    bn: 'কর্মস্থান',
  },
  'agentsActive': {
    en: '267+ Agents',
    hi: '267+ एजेंट',
    ta: '267+ ஏஜென்ட்கள்',
    te: '267+ ఏజెంట్లు',
    kn: '267+ ಏಜೆಂಟ್‌ಗಳು',
    bn: '267+ এজেন্ট',
  },
  'switchPlatform': {
    en: 'Switch Platform',
    hi: 'प्लेटफ़ॉर्म बदलें',
    ta: 'தளத்தை மாற்று',
    te: 'ప్లాట్‌ఫారమ్ మార్చండి',
    kn: 'ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಬದಲಿಸಿ',
    bn: 'প্ল্যাটফর্ম পরিবর্তন করুন',
  },
  // Chat interface translations
  'chat.greeting.superagent': {
    en: 'Hello! I\'m your AI Super Agent powered by WAI SDK v1.0. I have access to 93 tools, deep research capabilities, and multi-modal understanding. How can I help you today?',
    hi: 'नमस्ते! मैं आपका एआई सुपर एजेंट हूं जो WAI SDK v1.0 द्वारा संचालित है। मेरे पास 93 उपकरण, गहन शोध क्षमताएं और बहु-मोडल समझ है। मैं आज आपकी कैसे मदद कर सकता हूं?',
    ta: 'வணக்கம்! நான் WAI SDK v1.0 ஆல் இயக்கப்படும் உங்கள் AI சூப்பர் ஏஜென்ட். என்னிடம் 93 கருவிகள், ஆழமான ஆராய்ச்சி திறன்கள் மற்றும் பல-மாதிரி புரிதல் உள்ளது. இன்று நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?',
    te: 'హలో! నేను WAI SDK v1.0 ద్వారా నడిచే మీ AI సూపర్ ఏజెంట్. నా వద్ద 93 సాధనాలు, లోతైన పరిశోధన సామర్థ్యాలు మరియు మల్టీ-మోడల్ అవగాహన ఉన్నాయి. నేను ఈరోజు మీకు ఎలా సహాయం చేయగలను?',
    kn: 'ಹಲೋ! ನಾನು WAI SDK v1.0 ನಿಂದ ನಡೆಸಲ್ಪಡುವ ನಿಮ್ಮ AI ಸೂಪರ್ ಏಜೆಂಟ್. ನನ್ನ ಬಳಿ 93 ಸಾಧನಗಳು, ಆಳವಾದ ಸಂಶೋಧನೆ ಸಾಮರ್ಥ್ಯಗಳು ಮತ್ತು ಮಲ್ಟಿ-ಮೋಡಲ್ ತಿಳುವಳಿಕೆ ಇದೆ. ನಾನು ಇಂದು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?',
    bn: 'হ্যালো! আমি WAI SDK v1.0 দ্বারা চালিত আপনার AI সুপার এজেন্ট। আমার কাছে 93টি সরঞ্জাম, গভীর গবেষণা ক্ষমতা এবং মাল্টি-মোডাল বোঝার ক্ষমতা রয়েছে। আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?',
  },
  'chat.typing': {
    en: 'AI is thinking...',
    hi: 'एआई सोচavelength\nरहा है...',
    ta: 'AI சிந்தித்துக்கொண்டிருக்கிறது...',
    te: 'AI ఆలోచిస్తోంది...',
    kn: 'AI ಯೋಚಿಸುತ್ತಿದೆ...',
    bn: 'AI চিন্তা করছে...',
  },
  'research.title': {
    en: 'Deep Research Mode',
    hi: 'गहन शोध मोड',
    ta: 'ஆழ்ந்த ஆராய்ச்சி முறை',
    te: 'లోతైన పరిశోధన మోడ్',
    kn: 'ಆಳವಾದ ಸಂಶೋಧನೆ ಮೋಡ್',
    bn: 'গভীর গবেষণা মোড',
  },
  'research.searching': {
    en: 'Searching...',
    hi: 'खोज रहा है...',
    ta: 'தேடுகிறது...',
    te: 'శోధిస్తోంది...',
    kn: 'ಹುಡುಕುತ್ತಿದೆ...',
    bn: 'অনুসন্ধান করছে...',
  },
  'followup.title': {
    en: 'Suggested Follow-ups',
    hi: 'सुझाए गए फॉलो-अप',
    ta: 'பரிந்துரைக்கப்பட்ட தொடர்பு கேள்விகள்',
    te: 'సూచించిన ఫాలో-అప్‌లు',
    kn: 'ಸೂಚಿಸಿದ ಫಾಲೋ-ಅಪ್‌ಗಳು',
    bn: 'প্রস্তাবিত ফলো-আপ',
  },
};

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
  isLoadingTranslations: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode}) {
  const [language, setLanguage] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem('language');
    return (saved as SupportedLanguage) || 'en';
  });

  const [dynamicTranslations, setDynamicTranslations] = useState<LanguageTranslations>({});
  const [isLoadingTranslations, setIsLoadingTranslations] = useState(false);
  
  // Track which languages have been fetched to prevent duplicate requests
  const fetchedLanguages = useRef<Set<SupportedLanguage>>(new Set(['en']));

  // Set RTL direction for Urdu, Sindhi, and Kashmiri
  // Set language attribute for proper i18n
  useEffect(() => {
    const isRTL = rtlLanguages.includes(language);
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    localStorage.setItem('language', language);
  }, [language]);

  // Fetch missing translations from Sarvam API when language changes
  useEffect(() => {
    // Skip if English (source language) or already fetched
    if (language === 'en' || fetchedLanguages.current.has(language)) {
      return;
    }

    // Check if we need to fetch more translations for this language
    const missingKeys: string[] = [];
    const allKeys = Object.keys(translations);
    
    for (const key of allKeys) {
      // Check both seed translations and current dynamic translations
      const hasSeedTranslation = translations[key]?.[language];
      const hasDynamicTranslation = dynamicTranslations[key]?.[language];
      
      if (!hasSeedTranslation && !hasDynamicTranslation) {
        missingKeys.push(key);
      }
    }

    // Only fetch if we have missing keys
    if (missingKeys.length === 0) {
      fetchedLanguages.current.add(language);
      return;
    }

    // Fetch missing translations from backend API
    const fetchTranslations = async () => {
      setIsLoadingTranslations(true);
      try {
        const textsToTranslate = missingKeys.map(key => translations[key]?.en || key);
        
        const response = await fetch('/api/translations/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            texts: textsToTranslate,
            sourceLanguage: 'en',
            targetLanguage: language,
            domain: 'general',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.translations) {
            // Build new translations object with DEEP MERGE
            const newTranslations: LanguageTranslations = {};
            
            data.translations.forEach((tr: any, index: number) => {
              const key = missingKeys[index];
              if (!newTranslations[key]) {
                newTranslations[key] = {};
              }
              newTranslations[key][language] = tr.translatedText;
            });

            // Deep merge - preserve all previous language translations for each key
            setDynamicTranslations(prev => {
              const merged: LanguageTranslations = {};
              
              // Copy all previous translations
              for (const key in prev) {
                merged[key] = { ...prev[key] };
              }
              
              // Merge in new translations (preserving all languages per key)
              for (const key in newTranslations) {
                if (!merged[key]) {
                  merged[key] = {};
                }
                // Merge language-level translations (e.g., add 'hi' to existing 'bn', 'ta', etc.)
                merged[key] = { ...merged[key], ...newTranslations[key] };
              }
              
              return merged;
            });

            // Mark this language as fetched
            fetchedLanguages.current.add(language);

            console.log(`✅ Fetched ${data.translations.length} translations for ${language}`);
          }
        }
      } catch (error) {
        // Silent fail - will use fallback
        console.debug('Translation fetch failed, using fallback:', error);
        // Still mark as fetched to prevent retries
        fetchedLanguages.current.add(language);
      } finally {
        setIsLoadingTranslations(false);
      }
    };

    fetchTranslations();
  }, [language]);

  const t = (key: string): string => {
    // 1. Check dynamic translations first (from API)
    const dynamicTranslation = dynamicTranslations[key]?.[language];
    if (dynamicTranslation) {
      return dynamicTranslation;
    }

    // 2. Check seed translations (pre-loaded)
    const seedTranslation = translations[key]?.[language];
    if (seedTranslation) {
      return seedTranslation;
    }
    
    // 3. Fall back to English if available
    if (translations[key]?.en) {
      return translations[key].en;
    }
    
    // 4. Return the key itself as last resort
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isLoadingTranslations }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export const languageNames: Record<SupportedLanguage, string> = {
  en: 'English',
  hi: 'हिन्दी (Hindi)',
  bn: 'বাংলা (Bengali)',
  te: 'తెలుగు (Telugu)',
  mr: 'मराठी (Marathi)',
  ta: 'தமிழ் (Tamil)',
  gu: 'ગુજરાતી (Gujarati)',
  ur: 'اردو (Urdu)',
  kn: 'ಕನ್ನಡ (Kannada)',
  or: 'ଓଡ଼ିଆ (Odia)',
  ml: 'മലയാളം (Malayalam)',
  pa: 'ਪੰਜਾਬੀ (Punjabi)',
  as: 'অসমীয়া (Assamese)',
  mai: 'मैथिली (Maithili)',
  sa: 'संस्कृतम् (Sanskrit)',
  kok: 'कोंकणी (Konkani)',
  ne: 'नेपाली (Nepali)',
  sd: 'سنڌي (Sindhi)',
  doi: 'डोगरी (Dogri)',
  mni: 'মৈতৈলোন্ (Manipuri)',
  brx: 'बड़ो (Bodo)',
  sat: 'ᱥᱟᱱᱛᱟᱲᱤ (Santali)',
  ks: 'کٲشُر (Kashmiri)',
};

// RTL (Right-to-Left) languages
export const rtlLanguages: SupportedLanguage[] = ['ur', 'sd', 'ks'];
