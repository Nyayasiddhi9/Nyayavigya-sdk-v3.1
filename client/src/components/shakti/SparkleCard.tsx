import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, BookOpen, Clock, Globe, ChevronDown, ChevronUp, Copy, Check, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useState } from 'react';

interface Source {
  title: string;
  url: string;
  snippet: string;
  domain: string;
  favicon?: string;
  publishedDate?: string;
}

interface SparkleCardProps {
  title: string;
  content: string;
  sources: Source[];
  agentName?: string;
  agentDomain?: string;
  timestamp?: Date;
  isStreaming?: boolean;
  onFollowUp?: (question: string) => void;
  followUpSuggestions?: string[];
}

export function SparkleCard({
  title,
  content,
  sources,
  agentName,
  agentDomain,
  timestamp,
  isStreaming = false,
  onFollowUp,
  followUpSuggestions = []
}: SparkleCardProps) {
  const [showAllSources, setShowAllSources] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const visibleSources = showAllSources ? sources : sources.slice(0, 3);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatContent = (text: string) => {
    const parts = text.split(/(\[\d+\])/g);
    return parts.map((part, index) => {
      const match = part.match(/\[(\d+)\]/);
      if (match) {
        const sourceIndex = parseInt(match[1]) - 1;
        if (sources[sourceIndex]) {
          return (
            <a
              key={index}
              href={sources[sourceIndex].url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-4 h-4 text-[10px] bg-primary/20 text-primary rounded-full hover:bg-primary/30 mx-0.5 align-super"
              data-testid={`source-ref-${sourceIndex + 1}`}
            >
              {match[1]}
            </a>
          );
        }
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <Card className="border-border/50 bg-gradient-to-br from-white to-purple-50/30 dark:from-gray-900 dark:to-purple-900/20 shadow-lg hover:shadow-xl transition-all duration-300" data-testid="sparkle-card">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground leading-tight" data-testid="sparkle-title">
              {title}
            </h3>
            {agentName && (
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs bg-primary/10 border-primary/30" data-testid="agent-badge">
                  {agentName}
                </Badge>
                {agentDomain && (
                  <Badge variant="secondary" className="text-xs" data-testid="domain-badge">
                    {agentDomain}
                  </Badge>
                )}
              </div>
            )}
          </div>
          {timestamp && (
            <span className="text-xs text-muted-foreground flex items-center gap-1" data-testid="timestamp">
              <Clock className="w-3 h-3" />
              {timestamp.toLocaleTimeString()}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="prose prose-sm dark:prose-invert max-w-none text-foreground-secondary leading-relaxed" data-testid="sparkle-content">
          {isStreaming ? (
            <div className="flex items-center gap-2">
              <span>{content}</span>
              <span className="inline-block w-2 h-4 bg-primary animate-pulse" />
            </div>
          ) : (
            <p>{formatContent(content)}</p>
          )}
        </div>

        {sources.length > 0 && (
          <div className="space-y-2" data-testid="sources-section">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                Sources ({sources.length})
              </span>
              {sources.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllSources(!showAllSources)}
                  className="h-6 text-xs"
                  data-testid="toggle-sources"
                >
                  {showAllSources ? (
                    <>
                      <ChevronUp className="w-3 h-3 mr-1" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3 mr-1" />
                      Show all
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="grid gap-2">
              {visibleSources.map((source, index) => (
                <a
                  key={index}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-2 rounded-lg bg-background/50 hover:bg-background border border-border/50 transition-colors group"
                  data-testid={`source-card-${index}`}
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                    {source.favicon ? (
                      <img src={source.favicon} alt="" className="w-4 h-4" />
                    ) : (
                      <Globe className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] bg-primary/20 text-primary rounded-full">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {source.title}
                      </span>
                      <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {source.snippet}
                    </p>
                    <span className="text-[10px] text-muted-foreground/70">
                      {source.domain}
                      {source.publishedDate && ` · ${source.publishedDate}`}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {followUpSuggestions.length > 0 && (
          <div className="space-y-2" data-testid="follow-up-section">
            <span className="text-xs font-medium text-muted-foreground">Related questions</span>
            <div className="flex flex-wrap gap-2">
              {followUpSuggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 bg-background/50 hover:bg-primary/10 hover:border-primary/30"
                  onClick={() => onFollowUp?.(suggestion)}
                  data-testid={`follow-up-${index}`}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              data-testid="copy-button"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 mr-1 text-green-500" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFeedback('up')}
              className={`h-7 w-7 p-0 ${feedback === 'up' ? 'text-green-500' : 'text-muted-foreground'}`}
              data-testid="thumbs-up"
            >
              <ThumbsUp className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFeedback('down')}
              className={`h-7 w-7 p-0 ${feedback === 'down' ? 'text-red-500' : 'text-muted-foreground'}`}
              data-testid="thumbs-down"
            >
              <ThumbsDown className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
