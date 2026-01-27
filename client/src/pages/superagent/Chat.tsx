import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, Mic, Image, Paperclip, Bot, User, Sparkles, Code, FileText, RotateCcw, X, Eye, Volume2, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { sendChatMessage, conductDeepResearch, generateFollowUpSuggestions } from '@/services/super-agent-api';
import { ResearchMode } from '@/components/ResearchMode';
import { FollowUpSuggestions } from '@/components/FollowUpSuggestions';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAGUIApproval } from '@/hooks/use-agui-approval';
import { HumanApprovalDialog } from '@/components/agui/HumanApprovalDialog';

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  toolCalls?: ToolCall[];
  timestamp: Date;
  attachments?: {
    type: 'image' | 'audio' | 'document';
    data: string;
    name: string;
    preview?: string;
  }[];
  visionAnalysis?: {
    description?: string;
    text?: string;
    objects?: Array<{ name: string; confidence: number }>;
  };
  transcription?: string;
}

interface ToolCall {
  tool: string;
  params: Record<string, any>;
  result?: string;
}

export default function SuperAgentChat() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // SESSION LIFECYCLE: Mutable sessionId for "New Conversation" reset
  const [sessionId, setSessionId] = useState<string>(() => `session-${Date.now()}`);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'agent',
      content: t('chat.greeting.superagent'),
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [researchSources, setResearchSources] = useState<any[]>([]);
  const [followUpSuggestions, setFollowUpSuggestions] = useState<string[]>([]);
  
  // Multimodal attachment states
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [pendingAttachments, setPendingAttachments] = useState<Array<{
    type: 'image' | 'audio';
    data: string;
    name: string;
    preview?: string;
  }>>([]);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  // HUMAN-IN-THE-LOOP: Approval integration with session-aware re-subscription
  // When sessionId changes, useAGUIStream automatically re-subscribes (line 157 dependency)
  const { 
    currentInterrupt, 
    approvalDialogOpen, 
    respondToInterrupt,
    closeApprovalDialog 
  } = useAGUIApproval(sessionId);

  const chatMutation = useMutation({
    mutationFn: sendChatMessage,
    onSuccess: async (data) => {
      const agentMessage: Message = {
        id: Date.now().toString(),
        role: 'agent',
        content: data.response,
        toolCalls: data.toolsUsed.map(tool => ({
          tool: tool.tool,
          params: tool.params,
          result: tool.result,
        })),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, agentMessage]);
      
      // Generate real follow-up suggestions using WAI SDK
      try {
        const followupResponse = await generateFollowUpSuggestions({
          conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
          lastMessage: data.response,
        });
        setFollowUpSuggestions(followupResponse.suggestions);
      } catch (error) {
        console.error('Failed to generate follow-ups:', error);
        setFollowUpSuggestions([]);
      }
      
      setIsResearching(false);
    },
    onError: (error: any) => {
      setIsResearching(false);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Deep research mutation using WAI SDK
  const researchMutation = useMutation({
    mutationFn: conductDeepResearch,
    onSuccess: (data) => {
      setResearchSources(data.sources);
      
      // Add research answer to messages
      const agentMessage: Message = {
        id: Date.now().toString(),
        role: 'agent',
        content: data.answer,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, agentMessage]);
      setIsResearching(false);
    },
    onError: (error: any) => {
      console.error('Research failed:', error);
      setIsResearching(false);
      toast({
        title: 'Research Failed',
        description: error.message || 'Deep research encountered an error.',
        variant: 'destructive',
      });
    },
  });

  const handleSend = async () => {
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setFollowUpSuggestions([]);
    
    // Check if deep research is needed
    const needsResearch = currentInput.toLowerCase().includes('research') || 
                         currentInput.toLowerCase().includes('find') ||
                         currentInput.toLowerCase().includes('sources');
    
    if (needsResearch) {
      setIsResearching(true);
    }

    // SESSION CONTRACT VERIFICATION: Ensure chat and approval use same session
    console.log(`📋 Session contract: chat mutation using sessionId="${sessionId.slice(0, 16)}..."`);
    console.log(`📋 Session contract: approval responses will target /api/agui/sessions/${sessionId.slice(0, 16)}.../interrupts/respond`);
    
    chatMutation.mutate({
      prompt: currentInput,
      userId: 'demo-user',
      sessionId: sessionId,
    });
  };

  const handleFollowUpClick = (suggestion: string) => {
    setInput(suggestion);
  };
  
  // Multimodal handlers
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      const preview = event.target?.result as string;
      
      setPendingAttachments(prev => [...prev, {
        type: 'image',
        data: base64,
        name: file.name,
        preview
      }]);
      
      // Optionally analyze the image immediately
      setIsAnalyzingImage(true);
      try {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('analysisType', 'describe');
        
        const response = await fetch('/api/multimodal/vision/analyze', {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          const data = await response.json();
          toast({
            title: 'Image analyzed',
            description: 'Ready to discuss the image with AI'
          });
        }
      } catch (error) {
        console.error('Image analysis failed:', error);
      } finally {
        setIsAnalyzingImage(false);
      }
    };
    reader.readAsDataURL(file);
    
    // Reset input
    if (e.target) e.target.value = '';
  };
  
  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      
      setPendingAttachments(prev => [...prev, {
        type: 'audio',
        data: base64,
        name: file.name
      }]);
      
      // Transcribe audio
      setIsTranscribing(true);
      try {
        const formData = new FormData();
        formData.append('audio', file);
        
        const response = await fetch('/api/multimodal/speech/transcribe', {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          const data = await response.json();
          // Add transcription to input
          setInput(prev => prev + (prev ? ' ' : '') + data.data.text);
          toast({
            title: 'Audio transcribed',
            description: 'Text added to your message'
          });
        }
      } catch (error) {
        console.error('Transcription failed:', error);
        toast({
          title: 'Transcription failed',
          description: 'Could not transcribe the audio',
          variant: 'destructive'
        });
      } finally {
        setIsTranscribing(false);
      }
    };
    reader.readAsDataURL(file);
    
    if (e.target) e.target.value = '';
  };
  
  const removeAttachment = (index: number) => {
    setPendingAttachments(prev => prev.filter((_, i) => i !== index));
  };
  
  // NEW CONVERSATION: Reset session and clear all state
  const startNewConversation = () => {
    // Generate new session ID to trigger AG-UI stream re-subscription
    const newSessionId = `session-${Date.now()}`;
    console.log(`🔄 Starting new conversation: ${sessionId.slice(0, 16)}... → ${newSessionId.slice(0, 16)}...`);
    
    setSessionId(newSessionId);
    setMessages([
      {
        id: '1',
        role: 'agent',
        content: t('chat.greeting.superagent'),
        timestamp: new Date(),
      },
    ]);
    setInput('');
    setFollowUpSuggestions([]);
    setResearchSources([]);
    setIsResearching(false);
    
    toast({
      title: t('chat.newConversation'),
      description: 'Previous conversation cleared. Approvals reset.',
    });
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="h-full flex flex-col bg-[hsl(222,47%,11%)]">
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-6" ref={scrollRef}>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Research Mode */}
          {(isResearching || researchSources.length > 0) && (
            <ResearchMode
              query={input}
              sources={researchSources}
              isSearching={isResearching}
            />
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              data-testid={`message-${message.role}-${message.id}`}
            >
              {message.role === 'agent' && (
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-blue-400" />
                </div>
              )}
              
              <div className={`flex flex-col gap-2 max-w-2xl ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-[hsl(222,47%,15%)] text-gray-200 border border-white/10'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>

                {/* Tool Calls */}
                {message.toolCalls && message.toolCalls.length > 0 && (
                  <div className="space-y-2 w-full">
                    {message.toolCalls.map((toolCall, index) => (
                      <div
                        key={index}
                        className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3"
                        data-testid={`tool-call-${toolCall.tool}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-purple-400" />
                          <span className="text-sm font-semibold text-purple-300">
                            Using Tool: {toolCall.tool}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">
                          Parameters: {JSON.stringify(toolCall.params)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <span className="text-xs text-gray-500">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>

              {message.role === 'user' && (
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-purple-400" />
                </div>
              )}
            </div>
          ))}

          {chatMutation.isPending && (
            <div className="flex gap-4 justify-start">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Bot className="w-6 h-6 text-blue-400 animate-pulse" />
              </div>
              <div className="bg-[hsl(222,47%,15%)] text-gray-200 border border-white/10 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          {/* Follow-up Suggestions */}
          {followUpSuggestions.length > 0 && !chatMutation.isPending && (
            <FollowUpSuggestions
              suggestions={followUpSuggestions}
              onSuggestionClick={handleFollowUpClick}
            />
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-white/10 bg-[hsl(222,47%,13%)] p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-2">
            <div className="flex-1 bg-[hsl(222,47%,15%)] border border-white/10 rounded-2xl p-3">
              {/* Pending Attachments Preview */}
              {pendingAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2 pb-2 border-b border-white/10">
                  {pendingAttachments.map((attachment, index) => (
                    <div
                      key={index}
                      className="relative group flex items-center gap-2 bg-white/5 rounded-lg p-2"
                    >
                      {attachment.type === 'image' && attachment.preview ? (
                        <img 
                          src={attachment.preview} 
                          alt={attachment.name}
                          className="h-12 w-12 object-cover rounded"
                        />
                      ) : (
                        <div className="h-12 w-12 bg-blue-500/20 rounded flex items-center justify-center">
                          {attachment.type === 'audio' ? (
                            <Volume2 className="w-5 h-5 text-blue-400" />
                          ) : (
                            <Image className="w-5 h-5 text-blue-400" />
                          )}
                        </div>
                      )}
                      <span className="text-xs text-gray-400 max-w-[100px] truncate">
                        {attachment.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeAttachment(index)}
                      >
                        <X className="w-3 h-3 text-white" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask me anything... I have 93 tools at my disposal!"
                className="min-h-[60px] bg-transparent border-0 resize-none focus-visible:ring-0 text-white placeholder:text-gray-500"
                data-testid="input-chat-message"
              />
              <div className="flex items-center justify-between gap-2 mt-2">
                {/* Hidden file inputs */}
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <input
                    ref={audioInputRef}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={handleAudioUpload}
                  />
                  
                  <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white hover:bg-white/10"
                    data-testid="button-attach-file"
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white hover:bg-white/10 relative"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isAnalyzingImage}
                    data-testid="button-attach-image"
                  >
                    {isAnalyzingImage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white hover:bg-white/10"
                    onClick={() => audioInputRef.current?.click()}
                    disabled={isTranscribing}
                    data-testid="button-voice-input"
                  >
                    {isTranscribing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                
                {/* SESSION LIFECYCLE: New Conversation Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={startNewConversation}
                  className="text-gray-400 hover:text-white hover:bg-white/10 flex items-center gap-1.5"
                  data-testid="button-new-conversation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="text-xs">New Chat</span>
                </Button>
              </div>
            </div>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || chatMutation.isPending}
              className="h-[100px] px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg shadow-blue-500/30 disabled:opacity-50"
              data-testid="button-send-message"
            >
              {chatMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Powered by 267+ AI agents • 23+ LLM providers • Multi-modal capabilities
          </p>
        </div>
      </div>
      
      {/* Human-in-the-Loop Approval Dialog */}
      <HumanApprovalDialog
        interrupt={currentInterrupt}
        open={approvalDialogOpen}
        onResponse={respondToInterrupt}
        onClose={closeApprovalDialog}
      />
    </div>
  );
}
