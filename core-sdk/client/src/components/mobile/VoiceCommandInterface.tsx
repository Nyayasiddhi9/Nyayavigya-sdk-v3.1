// Phase 1 Mobile Excellence - Voice Command Interface
// Principal Engineer & Release Captain Implementation

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceCommandInterfaceProps {
  isActive: boolean;
  onToggle: (active: boolean) => void;
  className?: string;
}

interface VoiceCommand {
  command: string;
  action: string;
  confidence: number;
}

// Extend window interface for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// Supported languages for Phase 1 (15+ locales)
const SUPPORTED_LANGUAGES = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'es-ES', name: 'Spanish' },
  { code: 'fr-FR', name: 'French' },
  { code: 'de-DE', name: 'German' },
  { code: 'it-IT', name: 'Italian' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)' },
  { code: 'ru-RU', name: 'Russian' },
  { code: 'ja-JP', name: 'Japanese' },
  { code: 'ko-KR', name: 'Korean' },
  { code: 'zh-CN', name: 'Chinese (Mandarin)' },
  { code: 'hi-IN', name: 'Hindi' },
  { code: 'ar-SA', name: 'Arabic' },
  { code: 'nl-NL', name: 'Dutch' },
  { code: 'sv-SE', name: 'Swedish' },
];

// Voice command patterns for different languages
const COMMAND_PATTERNS = {
  navigation: [
    'navigate to', 'go to', 'open', 'show me', 'display',
    'ir a', 'abrir', 'mostrar', // Spanish
    'aller à', 'ouvrir', 'montrer', // French
    'gehe zu', 'öffnen', 'zeigen', // German
    '開く', '表示', // Japanese
    '열기', '보여줘', // Korean
    '打开', '显示', // Chinese
    'खोलें', 'दिखाएं', // Hindi
  ],
  creation: [
    'create', 'new', 'make', 'generate', 'build',
    'crear', 'nuevo', 'hacer', 'generar', // Spanish
    'créer', 'nouveau', 'faire', 'générer', // French
    'erstellen', 'neu', 'machen', 'generieren', // German
    '作成', '新しい', '作る', // Japanese
    '만들기', '새로운', // Korean
    '创建', '新建', '制作', // Chinese
    'बनाएं', 'नया', // Hindi
  ],
  editing: [
    'edit', 'modify', 'change', 'update', 'revise',
    'editar', 'modificar', 'cambiar', // Spanish
    'éditer', 'modifier', 'changer', // French
    'bearbeiten', 'ändern', 'aktualisieren', // German
    '編集', '変更', '更新', // Japanese
    '편집', '수정', '변경', // Korean
    '编辑', '修改', '更新', // Chinese
    'संपादित', 'बदलें', // Hindi
  ]
};

export const VoiceCommandInterface: React.FC<VoiceCommandInterfaceProps> = ({
  isActive,
  onToggle,
  className
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [language, setLanguage] = useState('en-US');
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const SpeechSynthesis = window.speechSynthesis;
      
      if (SpeechRecognition) {
        setIsSupported(true);
        recognitionRef.current = new SpeechRecognition();
        synthRef.current = SpeechSynthesis;
        
        const recognition = recognitionRef.current;
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = language;
        
        recognition.onstart = () => {
          setIsListening(true);
          setError(null);
        };
        
        recognition.onresult = (event: any) => {
          const current = event.resultIndex;
          const transcript = event.results[current][0].transcript;
          const confidence = event.results[current][0].confidence;
          
          setTranscript(transcript);
          setConfidence(confidence);
          
          if (event.results[current].isFinal) {
            handleVoiceCommand(transcript, confidence);
          }
        };
        
        recognition.onerror = (event: any) => {
          setError(`Voice recognition error: ${event.error}`);
          setIsListening(false);
        };
        
        recognition.onend = () => {
          setIsListening(false);
        };
      } else {
        setIsSupported(false);
        setError('Speech recognition not supported in this browser');
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language]);

  // Handle voice commands
  const handleVoiceCommand = useCallback((transcript: string, confidence: number) => {
    const command = transcript.toLowerCase().trim();
    let action = 'unknown';
    
    // Parse command based on patterns
    for (const [category, patterns] of Object.entries(COMMAND_PATTERNS)) {
      for (const pattern of patterns) {
        if (command.includes(pattern.toLowerCase())) {
          action = category;
          break;
        }
      }
      if (action !== 'unknown') break;
    }
    
    // Execute command
    executeVoiceCommand(command, action);
    
    // Store last command
    setLastCommand({
      command: transcript,
      action,
      confidence
    });
    
    // Provide voice feedback
    if (synthRef.current && confidence > 0.7) {
      const utterance = new SpeechSynthesisUtterance(
        getVoiceFeedback(action, language)
      );
      utterance.lang = language;
      utterance.volume = 0.7;
      synthRef.current.speak(utterance);
    }
  }, [language]);

  // Execute voice command actions
  const executeVoiceCommand = (command: string, action: string) => {
    switch (action) {
      case 'navigation':
        if (command.includes('code') || command.includes('studio')) {
          window.location.href = '/code-studio';
        } else if (command.includes('ai') || command.includes('assistant')) {
          window.location.href = '/ai-assistant-builder';
        } else if (command.includes('content')) {
          window.location.href = '/content-studio';
        } else if (command.includes('game')) {
          window.location.href = '/game-builder';
        } else if (command.includes('business')) {
          window.location.href = '/business-studio';
        } else if (command.includes('dashboard') || command.includes('home')) {
          window.location.href = '/';
        }
        break;
        
      case 'creation':
        // Trigger creation workflow based on current page
        const event = new CustomEvent('voice-create', { detail: { command } });
        window.dispatchEvent(event);
        break;
        
      case 'editing':
        // Trigger editing workflow
        const editEvent = new CustomEvent('voice-edit', { detail: { command } });
        window.dispatchEvent(editEvent);
        break;
        
      default:
        console.log('Unknown voice command:', command);
    }
  };

  // Get voice feedback in selected language
  const getVoiceFeedback = (action: string, lang: string): string => {
    const feedbacks: Record<string, Record<string, string>> = {
      'en-US': {
        navigation: 'Navigating',
        creation: 'Creating new item',
        editing: 'Editing mode activated',
        unknown: 'Command not recognized'
      },
      'es-ES': {
        navigation: 'Navegando',
        creation: 'Creando nuevo elemento',
        editing: 'Modo de edición activado',
        unknown: 'Comando no reconocido'
      },
      'fr-FR': {
        navigation: 'Navigation',
        creation: 'Création d\'un nouvel élément',
        editing: 'Mode édition activé',
        unknown: 'Commande non reconnue'
      },
      'de-DE': {
        navigation: 'Navigiere',
        creation: 'Erstelle neues Element',
        editing: 'Bearbeitungsmodus aktiviert',
        unknown: 'Befehl nicht erkannt'
      },
      'ja-JP': {
        navigation: 'ナビゲート中',
        creation: '新しいアイテムを作成',
        editing: '編集モードを開始',
        unknown: 'コマンドが認識されません'
      },
      'zh-CN': {
        navigation: '导航中',
        creation: '创建新项目',
        editing: '编辑模式已激活',
        unknown: '命令未识别'
      }
    };
    
    const langFeedbacks = feedbacks[lang] || feedbacks['en-US'];
    return langFeedbacks[action] || langFeedbacks['unknown'];
  };

  // Start/stop voice recognition
  const toggleListening = () => {
    if (!recognitionRef.current || !isSupported) return;
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  // Change language
  const changeLanguage = (newLang: string) => {
    setLanguage(newLang);
    if (recognitionRef.current) {
      recognitionRef.current.lang = newLang;
    }
  };

  if (!isActive) return null;

  return (
    <div className={cn(
      "fixed bottom-20 md:bottom-4 right-4 z-50",
      "bg-slate-800/90 backdrop-blur-lg border border-slate-600/50 rounded-xl shadow-xl",
      "p-4 min-w-80 max-w-sm",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white">Voice Commands</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggle(false)}
          className="p-1 hover:bg-slate-700/50"
        >
          ×
        </Button>
      </div>

      {/* Language Selector */}
      <div className="mb-4">
        <select
          value={language}
          onChange={(e) => changeLanguage(e.target.value)}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-400"
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>

      {/* Voice Control Button */}
      <div className="flex items-center gap-3 mb-4">
        <Button
          onClick={toggleListening}
          disabled={!isSupported}
          className={cn(
            "flex-1 py-3",
            isListening 
              ? "bg-red-500 hover:bg-red-600 text-white" 
              : "bg-blue-500 hover:bg-blue-600 text-white"
          )}
        >
          {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          <span className="ml-2">
            {isListening ? 'Stop Listening' : 'Start Listening'}
          </span>
        </Button>
      </div>

      {/* Status and Transcript */}
      {isListening && (
        <div className="mb-4 p-3 bg-slate-700/50 rounded-lg">
          <div className="text-sm text-slate-300 mb-2">Listening...</div>
          {transcript && (
            <div className="text-white">
              "{transcript}"
              {confidence > 0 && (
                <div className="text-xs text-slate-400 mt-1">
                  Confidence: {Math.round(confidence * 100)}%
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Last Command */}
      {lastCommand && (
        <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
          <div className="text-sm text-green-400 mb-1">Last Command:</div>
          <div className="text-white text-sm">"{lastCommand.command}"</div>
          <div className="text-xs text-green-300 mt-1">
            Action: {lastCommand.action} ({Math.round(lastCommand.confidence * 100)}% confidence)
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
          <div className="text-sm text-red-400">{error}</div>
        </div>
      )}

      {/* Quick Commands */}
      <div className="space-y-2">
        <div className="text-xs text-slate-400 uppercase tracking-wide">Quick Commands:</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-slate-300">"Open Code Studio"</div>
          <div className="text-slate-300">"Create new project"</div>
          <div className="text-slate-300">"Show AI assistants"</div>
          <div className="text-slate-300">"Edit content"</div>
        </div>
      </div>

      {!isSupported && (
        <div className="mt-4 p-3 bg-orange-500/20 border border-orange-500/30 rounded-lg">
          <div className="text-sm text-orange-400">
            Voice commands not supported in this browser. Try Chrome, Edge, or Safari.
          </div>
        </div>
      )}
    </div>
  );
};