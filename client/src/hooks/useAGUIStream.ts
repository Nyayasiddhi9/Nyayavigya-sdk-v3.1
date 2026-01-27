import { useState, useEffect, useRef } from 'react';

export interface AGUIStreamMessage {
  type: 'token' | 'tool_call' | 'complete' | 'error';
  content: string;
  toolName?: string;
  toolParams?: Record<string, any>;
  error?: string;
}

export function useAGUIStream(endpoint: string = '/api/agui/stream') {
  const [messages, setMessages] = useState<AGUIStreamMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startStream = async (prompt: string, sessionId: string) => {
    setIsStreaming(true);
    setError(null);
    setMessages([]);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, sessionId }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Response body is not readable');
      }

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          setIsStreaming(false);
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              setIsStreaming(false);
              continue;
            }

            try {
              const message: AGUIStreamMessage = JSON.parse(data);
              setMessages(prev => [...prev, message]);
            } catch (e) {
              console.error('Failed to parse stream message:', e);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream aborted by user');
      } else {
        setError(err.message);
        console.error('AG-UI Stream error:', err);
      }
      setIsStreaming(false);
    }
  };

  const stopStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  return {
    messages,
    isStreaming,
    error,
    startStream,
    stopStream,
  };
}
