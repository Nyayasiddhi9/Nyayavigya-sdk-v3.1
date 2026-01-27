import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Send, Mic, Image, Paperclip, Sparkles, Globe, 
  Code, FileText, Search, Zap, ArrowRight,
  Loader2, X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShaktiSearchBoxProps {
  onSubmit: (query: string, options: SearchOptions) => void;
  isLoading?: boolean;
  placeholder?: string;
  showSuggestions?: boolean;
}

interface SearchOptions {
  mode: 'quick' | 'deep' | 'code' | 'research';
  webSearch: boolean;
  multimodal: boolean;
}

const QUICK_SUGGESTIONS = [
  { icon: Code, text: 'Build a SaaS app with authentication', mode: 'code' as const },
  { icon: Globe, text: 'Research latest AI regulations in India', mode: 'research' as const },
  { icon: FileText, text: 'Analyze this legal document for compliance', mode: 'deep' as const },
  { icon: Sparkles, text: 'Create a marketing strategy for my startup', mode: 'quick' as const },
];

export function ShaktiSearchBox({
  onSubmit,
  isLoading = false,
  placeholder = 'Ask anything... Build apps, research topics, analyze documents',
  showSuggestions = true
}: ShaktiSearchBoxProps) {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<SearchOptions['mode']>('quick');
  const [webSearch, setWebSearch] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [query]);

  const handleSubmit = () => {
    if (!query.trim() || isLoading) return;
    onSubmit(query, { mode, webSearch, multimodal: false });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestionClick = (suggestion: typeof QUICK_SUGGESTIONS[0]) => {
    setQuery(suggestion.text);
    setMode(suggestion.mode);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const getModeConfig = (m: SearchOptions['mode']) => {
    const configs = {
      quick: { icon: Zap, label: 'Quick', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30' },
      deep: { icon: Search, label: 'Deep Research', color: 'bg-purple-500/10 text-purple-600 border-purple-500/30' },
      code: { icon: Code, label: 'Code', color: 'bg-green-500/10 text-green-600 border-green-500/30' },
      research: { icon: Globe, label: 'Web Research', color: 'bg-orange-500/10 text-orange-600 border-orange-500/30' },
    };
    return configs[m];
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4" data-testid="shakti-search-box">
      <div 
        className={cn(
          "relative rounded-2xl border-2 transition-all duration-300 bg-background/80 backdrop-blur-sm shadow-lg",
          isFocused ? "border-primary shadow-primary/20" : "border-border/50"
        )}
      >
        <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-border/30">
          {(['quick', 'deep', 'code', 'research'] as const).map((m) => {
            const config = getModeConfig(m);
            const Icon = config.icon;
            return (
              <Button
                key={m}
                variant="outline"
                size="sm"
                onClick={() => setMode(m)}
                className={cn(
                  "h-7 text-xs transition-all",
                  mode === m ? config.color : "bg-transparent hover:bg-muted"
                )}
                data-testid={`mode-${m}`}
              >
                <Icon className="w-3 h-3 mr-1" />
                {config.label}
              </Button>
            );
          })}

          <div className="flex-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWebSearch(!webSearch)}
            className={cn(
              "h-7 text-xs",
              webSearch ? "text-primary" : "text-muted-foreground"
            )}
            data-testid="toggle-web-search"
          >
            <Globe className="w-3 h-3 mr-1" />
            Web Search {webSearch ? 'On' : 'Off'}
          </Button>
        </div>

        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className="min-h-[60px] max-h-[200px] resize-none border-0 focus-visible:ring-0 bg-transparent px-4 py-3 text-base"
            data-testid="search-input"
          />
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-border/30">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" data-testid="attach-image">
              <Image className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" data-testid="attach-file">
              <Paperclip className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" data-testid="voice-input">
              <Mic className="w-4 h-4" />
            </Button>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!query.trim() || isLoading}
            className="h-9 px-6 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
            data-testid="submit-button"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Thinking...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Ask Shakti
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>

      {showSuggestions && !query && (
        <div className="space-y-3" data-testid="suggestions">
          <p className="text-sm text-muted-foreground text-center">Try asking about:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {QUICK_SUGGESTIONS.map((suggestion, index) => {
              const Icon = suggestion.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto py-3 px-4 justify-start text-left bg-background/50 hover:bg-background border-border/50"
                  onClick={() => handleSuggestionClick(suggestion)}
                  data-testid={`suggestion-${index}`}
                >
                  <Icon className="w-4 h-4 mr-3 text-primary flex-shrink-0" />
                  <span className="text-sm text-foreground-secondary">{suggestion.text}</span>
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
