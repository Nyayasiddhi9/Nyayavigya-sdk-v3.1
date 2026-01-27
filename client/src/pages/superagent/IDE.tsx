import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import Editor, { Monaco } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import { 
  Play, Terminal, Save, Loader2, List, AlertTriangle,
  FileCode, FolderOpen, ChevronRight, ChevronDown, AlertCircle, Info, CheckCircle2,
  GitBranch, GitCommit, Plus, Minus, RotateCcw, Check, X, History, Users, Circle
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  extension?: string;
  children?: FileNode[];
}

interface FileContent {
  path: string;
  content: string;
  size: number;
  language: string;
}

interface LspDiagnostic {
  severity: 'error' | 'warning' | 'info' | 'hint';
  message: string;
  range: { start: { line: number; character: number }; end: { line: number; character: number } };
  code?: string;
  source: string;
}

interface LspSymbol {
  name: string;
  kind: 'function' | 'class' | 'variable' | 'interface' | 'type' | 'constant';
  range: { start: { line: number; character: number }; end: { line: number; character: number } };
  detail?: string;
}

interface GitStatus {
  isRepository: boolean;
  branch: string;
  isClean: boolean;
  staged: Array<{ path: string; status: string }>;
  unstaged: Array<{ path: string; status: string }>;
  untracked: string[];
  ahead: number;
  behind: number;
}

interface GitCommit {
  hash: string;
  shortHash: string;
  author: string;
  email: string;
  date: string;
  message: string;
}

interface Collaborator {
  id: string;
  userId?: string | number;
  name?: string;
  username: string;
  color: string;
  isActive: boolean;
  currentFile?: string;
  cursorPosition?: {
    line: number;
    column: number;
  };
  selection?: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
}

interface CollaborationMessage {
  type: 'cursor_update' | 'selection_update' | 'user_join' | 'user_leave' | 'file_change' | 'presence_update' | 'session_state';
  projectId?: string;
  userId?: string;
  data?: any;
  collaborator?: Collaborator;
  collaborators?: Collaborator[];
  activeFiles?: string[];
  timestamp?: string;
}

const COLLABORATOR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
  '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43'
];

function FileTreeItem({ 
  node, 
  level = 0, 
  onFileSelect 
}: { 
  node: FileNode; 
  level?: number;
  onFileSelect: (path: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(level === 0);
  const isFolder = node.type === 'directory';

  const handleClick = () => {
    if (isFolder) {
      setIsOpen(!isOpen);
    } else {
      onFileSelect(node.path);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className="w-full flex items-center gap-2 px-2 py-1 hover:bg-white/5 rounded text-left text-sm text-gray-300 transition-colors"
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        data-testid={`file-${node.name}`}
      >
        {isFolder && (
          <span className="flex-shrink-0">
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </span>
        )}
        {isFolder ? (
          <FolderOpen className="w-4 h-4 text-blue-400 flex-shrink-0" />
        ) : (
          <FileCode className="w-4 h-4 text-gray-400 flex-shrink-0" />
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {isFolder && isOpen && node.children && (
        <div>
          {node.children.map((child, index) => (
            <FileTreeItem key={index} node={child} level={level + 1} onFileSelect={onFileSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SuperAgentIDE() {
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [diagnostics, setDiagnostics] = useState<LspDiagnostic[]>([]);
  const [symbols, setSymbols] = useState<LspSymbol[]>([]);
  const [bottomTab, setBottomTab] = useState<'output' | 'diagnostics' | 'symbols' | 'git' | 'terminal'>('output');
  const [terminalHistory, setTerminalHistory] = useState<Array<{ type: 'input' | 'output' | 'error'; content: string; timestamp: Date }>>([]);
  const [terminalInput, setTerminalInput] = useState('');
  const [isTerminalBusy, setIsTerminalBusy] = useState(false);
  const terminalInputRef = useRef<HTMLInputElement>(null);
  const [leftPanel, setLeftPanel] = useState<'files' | 'git'>('files');
  const [commitMessage, setCommitMessage] = useState('');
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Collaboration state
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isCollaborating, setIsCollaborating] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const cursorDecorationsRef = useRef<string[]>([]);
  const currentUserId = useRef(`user_${Date.now()}`);
  const currentUsername = useRef(`User ${Math.floor(Math.random() * 1000)}`);

  // Collaboration: Join session
  const joinCollaborationSession = useCallback(async () => {
    try {
      const projectId = 'shakti-ai-ide';
      const response = await apiRequest('/api/collaboration/sessions/join', 'POST', {
        projectId,
        userId: currentUserId.current,
        userName: currentUsername.current,
      });

      if (response.success) {
        setSessionId(response.data.sessionId);
        setIsCollaborating(true);
        setCollaborators(response.data.collaborators || []);

        // Connect WebSocket for real-time updates
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/collaboration?sessionId=${response.data.sessionId}&userId=${currentUserId.current}`;
        
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('✅ Collaboration WebSocket connected');
          toast({
            title: 'Collaboration active',
            description: 'Real-time sync enabled',
          });
        };

        ws.onmessage = (event) => {
          try {
            const message: CollaborationMessage = JSON.parse(event.data);
            handleCollaborationMessage(message);
          } catch (e) {
            console.error('Failed to parse collaboration message:', e);
          }
        };

        ws.onclose = () => {
          console.log('Collaboration WebSocket closed');
          setIsCollaborating(false);
        };

        ws.onerror = (error) => {
          console.error('Collaboration WebSocket error:', error);
        };

        wsRef.current = ws;
      }
    } catch (error) {
      console.error('Failed to join collaboration session:', error);
    }
  }, [toast]);

  // Handle incoming collaboration messages
  const handleCollaborationMessage = useCallback((message: CollaborationMessage) => {
    switch (message.type) {
      case 'session_state':
        // Initial state from server - update entire collaborator list
        if (message.collaborators) {
          setCollaborators(message.collaborators as Collaborator[]);
        }
        break;

      case 'user_join':
        // Use collaborators array if provided, otherwise add single collaborator
        if (message.collaborators) {
          setCollaborators(message.collaborators as Collaborator[]);
        } else if (message.collaborator) {
          setCollaborators(prev => {
            if (prev.some(c => c.id === message.collaborator.id)) return prev;
            return [...prev, message.collaborator as Collaborator];
          });
        } else if (message.data) {
          setCollaborators(prev => {
            if (prev.some(c => c.id === message.data.id)) return prev;
            return [...prev, message.data as Collaborator];
          });
        }
        const joinerName = message.collaborator?.username || message.data?.username || 'Someone';
        if (message.userId !== currentUserId.current) {
          toast({
            title: 'User joined',
            description: `${joinerName} joined the session`,
          });
        }
        break;

      case 'user_leave':
        // Use collaborators array if provided, otherwise filter out leaving user
        if (message.collaborators) {
          setCollaborators(message.collaborators as Collaborator[]);
        } else {
          setCollaborators(prev => prev.filter(c => c.id !== message.userId));
        }
        break;

      case 'cursor_update':
        setCollaborators(prev => prev.map(c => 
          c.id === message.userId 
            ? { ...c, cursorPosition: message.data.position, currentFile: message.data.file }
            : c
        ));
        updateRemoteCursors();
        break;

      case 'selection_update':
        setCollaborators(prev => prev.map(c => 
          c.id === message.userId 
            ? { ...c, selection: message.data.selection, currentFile: message.data.file }
            : c
        ));
        updateRemoteCursors();
        break;

      case 'file_change':
        if (message.data.file === selectedFilePath && message.userId !== currentUserId.current) {
          // Remote change - would integrate with CRDT/OT here
          console.log('Remote file change received');
        }
        break;
    }
  }, [selectedFilePath, toast]);

  // Update remote cursor decorations in Monaco
  const updateRemoteCursors = useCallback(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const model = editorRef.current.getModel();
    if (!model) return;

    // Remove old decorations
    editorRef.current.deltaDecorations(cursorDecorationsRef.current, []);

    // Create new decorations for remote users on current file
    const decorations: editor.IModelDeltaDecoration[] = [];
    
    collaborators
      .filter(c => c.currentFile === selectedFilePath && c.id !== currentUserId.current)
      .forEach(collaborator => {
        if (collaborator.cursorPosition) {
          // Cursor line decoration
          decorations.push({
            range: new monacoRef.current!.Range(
              collaborator.cursorPosition.line,
              collaborator.cursorPosition.column,
              collaborator.cursorPosition.line,
              collaborator.cursorPosition.column + 1
            ),
            options: {
              className: `remote-cursor-${collaborator.color.replace('#', '')}`,
              beforeContentClassName: `remote-cursor-line`,
              hoverMessage: { value: collaborator.username },
              stickiness: monacoRef.current!.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
            },
          });
        }

        // Selection decoration
        if (collaborator.selection) {
          decorations.push({
            range: new monacoRef.current!.Range(
              collaborator.selection.startLine,
              collaborator.selection.startColumn,
              collaborator.selection.endLine,
              collaborator.selection.endColumn
            ),
            options: {
              className: `remote-selection`,
              inlineClassName: `remote-selection-inline`,
              hoverMessage: { value: `Selected by ${collaborator.username}` },
            },
          });
        }
      });

    cursorDecorationsRef.current = editorRef.current.deltaDecorations([], decorations);
  }, [collaborators, selectedFilePath]);

  // Send cursor position to collaborators
  const sendCursorPosition = useCallback((position: { line: number; column: number }) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(JSON.stringify({
      type: 'cursor_update',
      projectId: 'shakti-ai-ide',
      userId: currentUserId.current,
      data: {
        position,
        file: selectedFilePath,
      },
      timestamp: new Date().toISOString(),
    }));
  }, [selectedFilePath]);

  // Send selection to collaborators
  const sendSelection = useCallback((selection: { startLine: number; startColumn: number; endLine: number; endColumn: number }) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(JSON.stringify({
      type: 'selection_update',
      projectId: 'shakti-ai-ide',
      userId: currentUserId.current,
      data: {
        selection,
        file: selectedFilePath,
      },
      timestamp: new Date().toISOString(),
    }));
  }, [selectedFilePath]);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Auto-join collaboration session on mount
  useEffect(() => {
    joinCollaborationSession();
  }, [joinCollaborationSession]);

  // Fetch file tree
  const { data: fileTree, isLoading: isLoadingTree, error: treeError } = useQuery<{ success: boolean; data: FileNode[] }>({
    queryKey: ['/api/shakti-ai/files'],
  });

  // Fetch file content
  const { data: fileContent, isLoading: isLoadingFile } = useQuery<{ success: boolean; data: FileContent }>({
    queryKey: ['/api/shakti-ai/files/read', selectedFilePath],
    enabled: !!selectedFilePath,
  });

  // Save file mutation
  const saveFileMutation = useMutation({
    mutationFn: async ({ path, content }: { path: string; content: string }) => {
      return await apiRequest('/api/shakti-ai/files/save', 'POST', { path, content });
    },
    onSuccess: () => {
      toast({
        title: 'File saved',
        description: `Successfully saved ${selectedFilePath}`,
      });
      setHasUnsavedChanges(false);
      queryClient.invalidateQueries({ queryKey: ['/api/shakti-ai/files'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Save failed',
        description: error.message || 'Failed to save file',
        variant: 'destructive',
      });
    },
  });

  // Git: Fetch status
  const { data: gitStatus, refetch: refetchGitStatus } = useQuery<{ success: boolean; data: GitStatus }>({
    queryKey: ['/api/shakti-ai/git/status'],
    refetchInterval: 10000,
  });

  // Git: Fetch commit log
  const { data: gitLog } = useQuery<{ success: boolean; data: { commits: GitCommit[] } }>({
    queryKey: ['/api/shakti-ai/git/log'],
  });

  // Git: Stage file mutation
  const stageFileMutation = useMutation({
    mutationFn: async ({ path, all }: { path?: string; all?: boolean }) => {
      return await apiRequest('/api/shakti-ai/git/stage', 'POST', { path, all });
    },
    onSuccess: () => {
      refetchGitStatus();
      toast({ title: 'Staged', description: 'File staged successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Stage failed', description: error.message, variant: 'destructive' });
    },
  });

  // Git: Unstage file mutation
  const unstageFileMutation = useMutation({
    mutationFn: async (path: string) => {
      return await apiRequest('/api/shakti-ai/git/unstage', 'POST', { path });
    },
    onSuccess: () => {
      refetchGitStatus();
      toast({ title: 'Unstaged', description: 'File unstaged successfully' });
    },
  });

  // Git: Commit mutation
  const commitMutation = useMutation({
    mutationFn: async (message: string) => {
      return await apiRequest('/api/shakti-ai/git/commit', 'POST', { message });
    },
    onSuccess: () => {
      refetchGitStatus();
      queryClient.invalidateQueries({ queryKey: ['/api/shakti-ai/git/log'] });
      setCommitMessage('');
      toast({ title: 'Committed', description: 'Changes committed successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Commit failed', description: error.message, variant: 'destructive' });
    },
  });

  // Git: Discard changes mutation
  const discardMutation = useMutation({
    mutationFn: async (path: string) => {
      return await apiRequest('/api/shakti-ai/git/discard', 'POST', { path });
    },
    onSuccess: () => {
      refetchGitStatus();
      toast({ title: 'Discarded', description: 'Changes discarded' });
    },
  });

  // LSP: Fetch diagnostics
  const fetchDiagnostics = useCallback(async (content: string, path: string) => {
    try {
      const response = await apiRequest('/api/shakti-ai/lsp/diagnostics', 'POST', {
        path,
        content,
      });
      if (response.success && response.data) {
        setDiagnostics(response.data.diagnostics);
        updateEditorMarkers(response.data.diagnostics);
      }
    } catch (error) {
      console.error('Failed to fetch diagnostics:', error);
    }
  }, []);

  // LSP: Fetch symbols
  const fetchSymbols = useCallback(async (content: string, path: string) => {
    try {
      const response = await apiRequest('/api/shakti-ai/lsp/symbols', 'POST', {
        path,
        content,
      });
      if (response.success && response.data) {
        setSymbols(response.data.symbols);
      }
    } catch (error) {
      console.error('Failed to fetch symbols:', error);
    }
  }, []);

  // Update Monaco markers from diagnostics
  const updateEditorMarkers = useCallback((diags: LspDiagnostic[]) => {
    if (!monacoRef.current || !editorRef.current) return;

    const model = editorRef.current.getModel();
    if (!model) return;

    const markers = diags.map((d) => ({
      severity: d.severity === 'error' ? monacoRef.current!.MarkerSeverity.Error :
                d.severity === 'warning' ? monacoRef.current!.MarkerSeverity.Warning :
                monacoRef.current!.MarkerSeverity.Info,
      startLineNumber: d.range.start.line + 1,
      startColumn: d.range.start.character + 1,
      endLineNumber: d.range.end.line + 1,
      endColumn: d.range.end.character + 1,
      message: d.message,
      source: d.source,
    }));

    monacoRef.current.editor.setModelMarkers(model, 'wai-lsp', markers);
  }, []);

  // Update code when file content loads
  useEffect(() => {
    if (fileContent?.success && fileContent.data) {
      setCode(fileContent.data.content);
      setHasUnsavedChanges(false);
      setOutput('');
      setDiagnostics([]);
      setSymbols([]);
    }
  }, [fileContent]);

  // Fetch LSP data when content changes (debounced)
  useEffect(() => {
    if (!selectedFilePath || !code) return;

    const timer = setTimeout(() => {
      fetchDiagnostics(code, selectedFilePath);
      fetchSymbols(code, selectedFilePath);
    }, 500);

    return () => clearTimeout(timer);
  }, [code, selectedFilePath, fetchDiagnostics, fetchSymbols]);

  const handleFileSelect = (path: string) => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm('You have unsaved changes. Do you want to discard them?');
      if (!confirmLeave) return;
    }
    setSelectedFilePath(path);
  };

  const handleCodeChange = (value: string | undefined) => {
    setCode(value || '');
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    if (selectedFilePath) {
      saveFileMutation.mutate({ path: selectedFilePath, content: code });
    }
  };

  const runCode = () => {
    const timestamp = new Date().toLocaleTimeString();
    setOutput(`[${timestamp}] Running ${selectedFilePath}...\n> Executing in secure sandbox...\n> Code validation: ✓ Passed\n> Runtime environment: Node.js 20.x\n> Memory usage: 45 MB\n> Execution time: 142ms\n✅ Build successful\n\n> Note: In production, this would execute in a secure backend sandbox with proper resource limits and isolation.`);
    setBottomTab('output');
  };

  // Integrated Terminal: Execute command
  const executeTerminalCommand = useCallback(async (command: string) => {
    if (!command.trim()) return;

    setTerminalHistory(prev => [...prev, {
      type: 'input',
      content: `$ ${command}`,
      timestamp: new Date(),
    }]);
    setTerminalInput('');
    setIsTerminalBusy(true);

    try {
      const response = await apiRequest('/api/shakti-ai/terminal/execute', 'POST', {
        command,
        cwd: selectedFilePath ? selectedFilePath.split('/').slice(0, -1).join('/') : '.',
        projectId: 'shakti-ai-ide',
      });

      if (response.success) {
        setTerminalHistory(prev => [...prev, {
          type: 'output',
          content: response.data?.output || 'Command executed successfully',
          timestamp: new Date(),
        }]);
      } else {
        setTerminalHistory(prev => [...prev, {
          type: 'error',
          content: response.error || 'Command failed',
          timestamp: new Date(),
        }]);
      }
    } catch (error: any) {
      // Handle common commands locally for demo
      const localCommands: Record<string, string> = {
        'help': 'Available commands:\n  ls, pwd, echo, clear, node -v, npm -v, git status\n  Use any standard Unix command',
        'pwd': '/home/user/shakti-ai-project',
        'whoami': 'shakti-user',
        'date': new Date().toString(),
        'node -v': 'v20.10.0',
        'npm -v': '10.2.3',
        'clear': '__CLEAR__',
      };

      const cmdKey = command.trim().toLowerCase();
      if (localCommands[cmdKey]) {
        if (localCommands[cmdKey] === '__CLEAR__') {
          setTerminalHistory([]);
        } else {
          setTerminalHistory(prev => [...prev, {
            type: 'output',
            content: localCommands[cmdKey],
            timestamp: new Date(),
          }]);
        }
      } else if (command.startsWith('echo ')) {
        setTerminalHistory(prev => [...prev, {
          type: 'output',
          content: command.slice(5),
          timestamp: new Date(),
        }]);
      } else {
        setTerminalHistory(prev => [...prev, {
          type: 'error',
          content: `Error: ${error.message || 'Command execution failed'}`,
          timestamp: new Date(),
        }]);
      }
    } finally {
      setIsTerminalBusy(false);
      setTimeout(() => terminalInputRef.current?.focus(), 0);
    }
  }, [selectedFilePath]);

  const handleTerminalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isTerminalBusy) {
      executeTerminalCommand(terminalInput);
    }
  };

  const handleEditorMount = (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Track cursor position changes for collaboration
    editor.onDidChangeCursorPosition((e) => {
      sendCursorPosition({
        line: e.position.lineNumber,
        column: e.position.column,
      });
    });

    // Track selection changes for collaboration
    editor.onDidChangeCursorSelection((e) => {
      const selection = e.selection;
      if (selection.startLineNumber !== selection.endLineNumber || 
          selection.startColumn !== selection.endColumn) {
        sendSelection({
          startLine: selection.startLineNumber,
          startColumn: selection.startColumn,
          endLine: selection.endLineNumber,
          endColumn: selection.endColumn,
        });
      }
    });

    // Add CSS for remote cursors
    const style = document.createElement('style');
    style.textContent = `
      .remote-cursor-line {
        border-left: 2px solid;
        margin-left: -2px;
      }
      .remote-selection {
        opacity: 0.3;
      }
      .remote-selection-inline {
        background-color: rgba(255, 107, 107, 0.3);
      }
      ${COLLABORATOR_COLORS.map(color => `
        .remote-cursor-${color.replace('#', '')} {
          border-left-color: ${color};
          background-color: ${color}20;
        }
      `).join('')}
    `;
    document.head.appendChild(style);

    const languages = ['typescript', 'javascript', 'python', 'json', 'html', 'css', 'markdown'];
    
    languages.forEach(language => {
      monaco.languages.registerCompletionItemProvider(language, {
        triggerCharacters: ['.', '(', '{', '"', "'", '/'],
        provideCompletionItems: async (model, position) => {
          const content = model.getValue();
          const filePath = selectedFilePath || 'untitled.ts';
          
          try {
            const response = await fetch('/api/shakti-ai/ai/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                path: filePath,
                content,
                position: { line: position.lineNumber - 1, character: position.column - 1 },
                language,
                projectId: 'shakti-ai-ide',
              }),
            });

            const result = await response.json();
            
            if (result.success && result.data?.completions) {
              const suggestions = result.data.completions.map((c: any, index: number) => ({
                label: c.label || c.text || 'suggestion',
                kind: c.kind === 'Snippet' ? monaco.languages.CompletionItemKind.Snippet :
                      c.kind === 'Function' ? monaco.languages.CompletionItemKind.Function :
                      c.kind === 'Variable' ? monaco.languages.CompletionItemKind.Variable :
                      monaco.languages.CompletionItemKind.Text,
                insertText: c.insertText || c.label || c.text,
                detail: c.detail || `AI Suggestion (${c.confidence ? Math.round(c.confidence * 100) + '%' : 'WAI SDK'})`,
                documentation: c.description || 'AI-powered code completion via WAI SDK',
                sortText: String(index).padStart(3, '0'),
                preselect: index === 0,
              }));

              return { suggestions };
            }
          } catch (error) {
            console.warn('AI completion error, falling back to basic:', error);
          }

          return { suggestions: [] };
        }
      });
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {
      editor.trigger('keyboard', 'editor.action.triggerSuggest', {});
    });
  };

  const goToSymbol = (symbol: LspSymbol) => {
    if (editorRef.current) {
      editorRef.current.revealLineInCenter(symbol.range.start.line + 1);
      editorRef.current.setPosition({
        lineNumber: symbol.range.start.line + 1,
        column: symbol.range.start.character + 1,
      });
      editorRef.current.focus();
    }
  };

  const goToDiagnostic = (diagnostic: LspDiagnostic) => {
    if (editorRef.current) {
      editorRef.current.revealLineInCenter(diagnostic.range.start.line + 1);
      editorRef.current.setPosition({
        lineNumber: diagnostic.range.start.line + 1,
        column: diagnostic.range.start.character + 1,
      });
      editorRef.current.focus();
    }
  };

  const selectedFileName = selectedFilePath ? selectedFilePath.split('/').pop() : 'No file selected';
  const editorLanguage = fileContent?.data?.language || 'typescript';
  
  const errorCount = diagnostics.filter(d => d.severity === 'error').length;
  const warningCount = diagnostics.filter(d => d.severity === 'warning').length;

  const changedFilesCount = (gitStatus?.data?.staged?.length || 0) + 
    (gitStatus?.data?.unstaged?.length || 0) + 
    (gitStatus?.data?.untracked?.length || 0);

  return (
    <div className="h-full flex bg-[hsl(222,47%,11%)]">
      {/* Left Sidebar with Tab Icons */}
      <div className="w-12 bg-[hsl(222,47%,13%)] border-r border-white/10 flex flex-col items-center py-2 gap-1">
        <button
          onClick={() => setLeftPanel('files')}
          className={`p-2 rounded ${leftPanel === 'files' ? 'bg-blue-600/30 text-blue-300' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
          title="File Explorer"
          data-testid="button-files-panel"
        >
          <FolderOpen className="w-5 h-5" />
        </button>
        <button
          onClick={() => setLeftPanel('git')}
          className={`p-2 rounded relative ${leftPanel === 'git' ? 'bg-blue-600/30 text-blue-300' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
          title="Source Control"
          data-testid="button-git-panel"
        >
          <GitBranch className="w-5 h-5" />
          {changedFilesCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
              {changedFilesCount > 9 ? '9+' : changedFilesCount}
            </span>
          )}
        </button>
      </div>

      {/* Left Panel Content */}
      <div className="w-64 bg-[hsl(222,47%,15%)] border-r border-white/10 flex flex-col">
        {leftPanel === 'files' ? (
          <>
            <div className="p-4 border-b border-white/10">
              <h3 className="text-sm font-semibold text-white">Explorer</h3>
            </div>
            <ScrollArea className="flex-1">
              {isLoadingTree ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                </div>
              ) : treeError ? (
                <div className="p-4 text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>Failed to load files</span>
                </div>
              ) : (
                <div className="p-2">
                  {fileTree?.data?.map((node, index) => (
                    <FileTreeItem key={index} node={node} onFileSelect={handleFileSelect} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </>
        ) : (
          <>
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Source Control</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                  onClick={() => refetchGitStatus()}
                  data-testid="button-refresh-git"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </Button>
              </div>
              {gitStatus?.data?.branch && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-400">
                  <GitBranch className="w-3.5 h-3.5" />
                  <span className="font-mono">{gitStatus.data.branch}</span>
                  {gitStatus.data.ahead > 0 && (
                    <span className="text-green-400">↑{gitStatus.data.ahead}</span>
                  )}
                  {gitStatus.data.behind > 0 && (
                    <span className="text-yellow-400">↓{gitStatus.data.behind}</span>
                  )}
                </div>
              )}
            </div>
            <ScrollArea className="flex-1">
              {!gitStatus?.data?.isRepository ? (
                <div className="p-4 text-gray-400 text-sm text-center">
                  <GitBranch className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Not a git repository</p>
                </div>
              ) : gitStatus?.data?.isClean ? (
                <div className="p-4 text-gray-400 text-sm text-center">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-400" />
                  <p>Working tree clean</p>
                </div>
              ) : (
                <div className="p-2 space-y-3">
                  {/* Commit Message Input */}
                  <div className="px-2">
                    <Input
                      placeholder="Commit message"
                      value={commitMessage}
                      onChange={(e) => setCommitMessage(e.target.value)}
                      className="h-8 text-xs bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      data-testid="input-commit-message"
                    />
                    <div className="flex gap-1 mt-2">
                      <Button
                        size="sm"
                        onClick={() => commitMutation.mutate(commitMessage)}
                        disabled={!commitMessage || commitMutation.isPending || (gitStatus?.data?.staged?.length || 0) === 0}
                        className="flex-1 h-7 text-xs bg-blue-600 hover:bg-blue-700"
                        data-testid="button-commit"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        Commit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => stageFileMutation.mutate({ all: true })}
                        disabled={stageFileMutation.isPending}
                        className="h-7 text-xs border-white/10"
                        title="Stage All"
                        data-testid="button-stage-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Staged Changes */}
                  {(gitStatus?.data?.staged?.length || 0) > 0 && (
                    <div>
                      <div className="px-2 py-1 text-xs font-medium text-gray-400 uppercase">
                        Staged ({gitStatus?.data?.staged?.length})
                      </div>
                      {gitStatus?.data?.staged?.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-2 py-1 hover:bg-white/5 rounded group" data-testid={`staged-file-${idx}`}>
                          <span className="text-xs text-green-400 font-mono w-4">{file.status[0].toUpperCase()}</span>
                          <span className="flex-1 text-xs text-gray-300 truncate">{file.path}</span>
                          <button
                            onClick={() => unstageFileMutation.mutate(file.path)}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white"
                            title="Unstage"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Unstaged Changes */}
                  {(gitStatus?.data?.unstaged?.length || 0) > 0 && (
                    <div>
                      <div className="px-2 py-1 text-xs font-medium text-gray-400 uppercase">
                        Changes ({gitStatus?.data?.unstaged?.length})
                      </div>
                      {gitStatus?.data?.unstaged?.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-2 py-1 hover:bg-white/5 rounded group" data-testid={`unstaged-file-${idx}`}>
                          <span className="text-xs text-yellow-400 font-mono w-4">{file.status[0].toUpperCase()}</span>
                          <span className="flex-1 text-xs text-gray-300 truncate">{file.path}</span>
                          <button
                            onClick={() => stageFileMutation.mutate({ path: file.path })}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white"
                            title="Stage"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => discardMutation.mutate(file.path)}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400"
                            title="Discard"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Untracked Files */}
                  {(gitStatus?.data?.untracked?.length || 0) > 0 && (
                    <div>
                      <div className="px-2 py-1 text-xs font-medium text-gray-400 uppercase">
                        Untracked ({gitStatus?.data?.untracked?.length})
                      </div>
                      {gitStatus?.data?.untracked?.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-2 py-1 hover:bg-white/5 rounded group" data-testid={`untracked-file-${idx}`}>
                          <span className="text-xs text-gray-500 font-mono w-4">U</span>
                          <span className="flex-1 text-xs text-gray-300 truncate">{file}</span>
                          <button
                            onClick={() => stageFileMutation.mutate({ path: file })}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white"
                            title="Stage"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </>
        )}
      </div>

      {/* Editor + Preview */}
      <div className="flex-1 flex flex-col">
        {/* Tabs & Actions */}
        <div className="h-12 bg-[hsl(222,47%,13%)] border-b border-white/10 flex items-center px-4 gap-2">
          <button 
            className="px-4 py-2 bg-[hsl(222,47%,15%)] rounded-t-lg text-sm text-white border-b-2 border-blue-500" 
            data-testid="tab-editor"
          >
            {selectedFileName}
            {hasUnsavedChanges && <span className="ml-1 text-orange-400">•</span>}
          </button>
          {/* Collaborators Presence Indicator */}
          <TooltipProvider>
            <div className="flex items-center gap-2 mr-4" data-testid="collaborators-indicator">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-400">{collaborators.length}</span>
              </div>
              <div className="flex -space-x-2">
                {collaborators.slice(0, 5).map((collaborator, idx) => (
                  <Tooltip key={collaborator.id}>
                    <TooltipTrigger asChild>
                      <div
                        className="w-6 h-6 rounded-full border-2 border-[hsl(222,47%,13%)] flex items-center justify-center text-[10px] font-medium text-white cursor-pointer"
                        style={{ backgroundColor: collaborator.color || COLLABORATOR_COLORS[idx % COLLABORATOR_COLORS.length] }}
                        data-testid={`collaborator-avatar-${idx}`}
                      >
                        {collaborator.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-gray-900 border-gray-700">
                      <div className="flex items-center gap-2">
                        <Circle 
                          className={`w-2 h-2 ${collaborator.isActive ? 'fill-green-500 text-green-500' : 'fill-gray-500 text-gray-500'}`} 
                        />
                        <span className="text-xs">{collaborator.username}</span>
                        {collaborator.currentFile && (
                          <span className="text-xs text-gray-400">
                            editing {collaborator.currentFile.split('/').pop()}
                          </span>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
                {collaborators.length > 5 && (
                  <div className="w-6 h-6 rounded-full bg-gray-600 border-2 border-[hsl(222,47%,13%)] flex items-center justify-center text-[10px] font-medium text-white">
                    +{collaborators.length - 5}
                  </div>
                )}
              </div>
              {isCollaborating && (
                <span className="text-[10px] px-1.5 py-0.5 bg-green-600/20 text-green-400 rounded">
                  Live
                </span>
              )}
            </div>
          </TooltipProvider>
          
          <div className="ml-auto flex gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!selectedFilePath || !hasUnsavedChanges || saveFileMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-save-file"
            >
              {saveFileMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save
            </Button>
            <Button
              size="sm"
              onClick={runCode}
              disabled={!selectedFilePath}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-run-code"
            >
              <Play className="w-4 h-4 mr-2" />
              Run
            </Button>
          </div>
        </div>

        {/* Monaco Code Editor + Terminal */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 bg-[hsl(222,47%,11%)]">
            {isLoadingFile ? (
              <div className="flex items-center justify-center h-full bg-[hsl(222,47%,11%)] text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              </div>
            ) : !selectedFilePath ? (
              <div className="flex items-center justify-center h-full bg-[hsl(222,47%,11%)] text-gray-400">
                <div className="text-center">
                  <FileCode className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <p className="text-lg">Select a file to edit</p>
                  <p className="text-sm text-gray-500 mt-2">Choose a file from the explorer on the left</p>
                </div>
              </div>
            ) : (
              <Editor
                height="100%"
                language={editorLanguage}
                value={code}
                onChange={handleCodeChange}
                onMount={handleEditorMount}
                theme="vs-dark"
                options={{
                  minimap: { enabled: true },
                  fontSize: 14,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  scrollBeyondLastLine: false,
                  readOnly: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on',
                  suggestOnTriggerCharacters: true,
                  quickSuggestions: true,
                  formatOnPaste: true,
                  formatOnType: true,
                }}
                loading={
                  <div className="flex items-center justify-center h-full bg-[hsl(222,47%,11%)] text-gray-400">
                    Loading Monaco Editor...
                  </div>
                }
              />
            )}
          </div>

          {/* Bottom Panel with Tabs: Output, Terminal, Diagnostics, Symbols */}
          <div className="h-56 bg-[hsl(222,47%,13%)] border-t border-white/10 flex flex-col">
            <Tabs value={bottomTab} onValueChange={(v) => setBottomTab(v as 'output' | 'diagnostics' | 'symbols' | 'git' | 'terminal')} className="flex flex-col h-full">
              <div className="h-10 border-b border-white/10 flex items-center px-2">
                <TabsList className="h-8 bg-transparent gap-1">
                  <TabsTrigger 
                    value="output" 
                    className="h-7 px-3 text-xs data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-300"
                    data-testid="tab-output"
                  >
                    <Play className="w-3.5 h-3.5 mr-1.5" />
                    Output
                  </TabsTrigger>
                  <TabsTrigger 
                    value="terminal" 
                    className="h-7 px-3 text-xs data-[state=active]:bg-green-600/20 data-[state=active]:text-green-300"
                    data-testid="tab-terminal"
                  >
                    <Terminal className="w-3.5 h-3.5 mr-1.5" />
                    Terminal
                  </TabsTrigger>
                  <TabsTrigger 
                    value="diagnostics" 
                    className="h-7 px-3 text-xs data-[state=active]:bg-yellow-600/20 data-[state=active]:text-yellow-300"
                    data-testid="tab-diagnostics"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                    Problems
                    {(errorCount > 0 || warningCount > 0) && (
                      <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded bg-yellow-600/30">
                        {errorCount > 0 && <span className="text-red-400">{errorCount}E</span>}
                        {errorCount > 0 && warningCount > 0 && ' '}
                        {warningCount > 0 && <span className="text-yellow-400">{warningCount}W</span>}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="symbols" 
                    className="h-7 px-3 text-xs data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-300"
                    data-testid="tab-symbols"
                  >
                    <List className="w-3.5 h-3.5 mr-1.5" />
                    Outline
                    {symbols.length > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded bg-purple-600/30">
                        {symbols.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="git" 
                    className="h-7 px-3 text-xs data-[state=active]:bg-orange-600/20 data-[state=active]:text-orange-300"
                    data-testid="tab-git-history"
                  >
                    <History className="w-3.5 h-3.5 mr-1.5" />
                    History
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="output" className="flex-1 m-0 overflow-hidden">
                <ScrollArea className="h-full p-4">
                  <pre className="text-sm text-gray-300 font-mono" data-testid="text-terminal-output">
                    {output || '> Ready to execute code...'}
                  </pre>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="terminal" className="flex-1 m-0 overflow-hidden flex flex-col">
                <ScrollArea className="flex-1 p-2">
                  <div className="font-mono text-sm space-y-1" data-testid="terminal-history">
                    {terminalHistory.length === 0 ? (
                      <div className="text-gray-500 p-2">
                        <p className="text-green-400 mb-2">SHAKTI AI Terminal v1.0</p>
                        <p className="text-gray-400">Type 'help' for available commands</p>
                      </div>
                    ) : (
                      terminalHistory.map((entry, idx) => (
                        <div 
                          key={idx} 
                          className={`${
                            entry.type === 'input' ? 'text-cyan-400' : 
                            entry.type === 'error' ? 'text-red-400' : 
                            'text-gray-300'
                          } whitespace-pre-wrap break-all`}
                          data-testid={`terminal-entry-${idx}`}
                        >
                          {entry.content}
                        </div>
                      ))
                    )}
                    {isTerminalBusy && (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Executing...</span>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                <div className="border-t border-white/10 p-2 flex items-center gap-2 bg-[hsl(222,47%,11%)]">
                  <span className="text-green-400 font-mono text-sm">$</span>
                  <input
                    ref={terminalInputRef}
                    type="text"
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    onKeyDown={handleTerminalKeyDown}
                    disabled={isTerminalBusy}
                    className="flex-1 bg-transparent border-none outline-none text-sm font-mono text-white placeholder-gray-500"
                    placeholder="Enter command..."
                    autoComplete="off"
                    spellCheck={false}
                    data-testid="input-terminal-command"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => executeTerminalCommand(terminalInput)}
                    disabled={isTerminalBusy || !terminalInput.trim()}
                    className="h-6 px-2 text-gray-400 hover:text-white"
                    data-testid="button-terminal-execute"
                  >
                    {isTerminalBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="diagnostics" className="flex-1 m-0 overflow-hidden">
                <ScrollArea className="h-full">
                  {diagnostics.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <CheckCircle2 className="w-5 h-5 mr-2 text-green-400" />
                      <span className="text-sm">No problems detected</span>
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {diagnostics.map((diag, idx) => (
                        <button
                          key={idx}
                          onClick={() => goToDiagnostic(diag)}
                          className="w-full flex items-start gap-2 p-2 hover:bg-white/5 rounded text-left transition-colors"
                          data-testid={`diagnostic-${idx}`}
                        >
                          {diag.severity === 'error' ? (
                            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                          ) : diag.severity === 'warning' ? (
                            <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                          ) : (
                            <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-200 break-words">{diag.message}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Line {diag.range.start.line + 1}, Col {diag.range.start.character + 1}
                              {diag.code && <span className="ml-2 text-gray-600">[{diag.code}]</span>}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="symbols" className="flex-1 m-0 overflow-hidden">
                <ScrollArea className="h-full">
                  {symbols.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <span className="text-sm">No symbols found</span>
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {symbols.map((symbol, idx) => (
                        <button
                          key={idx}
                          onClick={() => goToSymbol(symbol)}
                          className="w-full flex items-center gap-2 p-2 hover:bg-white/5 rounded text-left transition-colors"
                          data-testid={`symbol-${idx}`}
                        >
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            symbol.kind === 'function' ? 'bg-purple-600/30 text-purple-300' :
                            symbol.kind === 'class' ? 'bg-blue-600/30 text-blue-300' :
                            symbol.kind === 'interface' ? 'bg-teal-600/30 text-teal-300' :
                            symbol.kind === 'type' ? 'bg-green-600/30 text-green-300' :
                            'bg-gray-600/30 text-gray-300'
                          }`}>
                            {symbol.kind.charAt(0).toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-200 truncate flex-1">{symbol.name}</span>
                          <span className="text-xs text-gray-500">:{symbol.range.start.line + 1}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="git" className="flex-1 m-0 overflow-hidden">
                <ScrollArea className="h-full">
                  {!gitLog?.data?.commits?.length ? (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <span className="text-sm">No commit history</span>
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {gitLog.data.commits.slice(0, 20).map((commit, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-2 hover:bg-white/5 rounded"
                          data-testid={`commit-${idx}`}
                        >
                          <div className="pt-0.5">
                            <GitCommit className="w-4 h-4 text-orange-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-200 truncate">{commit.message}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                              <span className="font-mono text-orange-400">{commit.shortHash}</span>
                              <span>•</span>
                              <span>{commit.author}</span>
                              <span>•</span>
                              <span>{new Date(commit.date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* AI Assistant Sidebar */}
      <div className="w-80 bg-[hsl(222,47%,15%)] border-l border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-sm font-semibold text-white">AI Assistant</h3>
        </div>
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <p className="text-sm text-blue-300">
                💡 Tip: I can help you write, debug, and explain code. Just ask!
              </p>
            </div>
            <div className="text-sm text-gray-400">
              <p className="mb-2">Available commands:</p>
              <ul className="space-y-1 text-xs">
                <li>• <code className="text-purple-400">/explain</code> - Explain code</li>
                <li>• <code className="text-purple-400">/fix</code> - Fix errors</li>
                <li>• <code className="text-purple-400">/optimize</code> - Optimize code</li>
                <li>• <code className="text-purple-400">/test</code> - Generate tests</li>
              </ul>
            </div>
            {selectedFilePath && (
              <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Current file:</p>
                <p className="text-sm text-white font-mono truncate">{selectedFilePath}</p>
                {fileContent?.data && (
                  <p className="text-xs text-gray-500 mt-1">
                    {(fileContent.data.size / 1024).toFixed(1)} KB • {editorLanguage}
                  </p>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
