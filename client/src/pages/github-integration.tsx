import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Github, GitBranch, FileText, RefreshCw, Code, FolderTree, Settings, AlertCircle } from "lucide-react";

interface Repository {
  id: number;
  name: string;
  fullName: string;
  description?: string;
  private: boolean;
  defaultBranch: string;
  url: string;
  language?: string;
  topics: string[];
}

interface Branch {
  name: string;
  sha: string;
  protected: boolean;
  url: string;
}

interface EditorSession {
  id: string;
  projectId: string;
  userId: string;
  files: Record<string, any>;
  activeFile?: string;
  gitRepository?: {
    owner: string;
    repo: string;
    branch: string;
  };
}

export default function GitHubIntegration() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [editorSession, setEditorSession] = useState<EditorSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [gitHubConnected, setGitHubConnected] = useState(false);
  const [gitHubUser, setGitHubUser] = useState<any>(null);
  const { toast } = useToast();

  // New repository form
  const [newRepo, setNewRepo] = useState({
    name: '',
    description: '',
    private: true,
  });

  // Editor session form
  const [sessionForm, setSessionForm] = useState({
    projectId: 'wai-devstudio',
    userId: 'user-1',
    autoSave: true,
  });

  useEffect(() => {
    checkGitHubConnection();
  }, []);

  const checkGitHubConnection = async () => {
    try {
      const response = await fetch('/api/github/status');
      const result = await response.json();
      
      if (result.success && result.connected) {
        setGitHubConnected(true);
        setGitHubUser(result.user);
        loadRepositories();
      } else {
        setGitHubConnected(false);
        setGitHubUser(null);
      }
    } catch (error) {
      setGitHubConnected(false);
      setGitHubUser(null);
    }
  };

  const loadRepositories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/github/repositories?sort=updated&per_page=20');
      const result = await response.json();
      
      if (result.success) {
        setRepositories(result.data);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to load repositories",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to GitHub API",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createRepository = async () => {
    if (!newRepo.name.trim()) {
      toast({
        title: "Error",
        description: "Repository name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/github/repositories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRepo.name,
          description: newRepo.description,
          private: newRepo.private,
          autoInit: true,
          topics: ['wai-devstudio', 'ai-powered', 'enterprise'],
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: `Repository "${result.data.name}" created successfully`,
        });
        setNewRepo({ name: '', description: '', private: true });
        loadRepositories();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create repository",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create repository",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectRepository = async (repo: Repository) => {
    setSelectedRepo(repo);
    
    // Load branches for the selected repository
    try {
      const response = await fetch(`/api/github/repositories/${repo.fullName.split('/')[0]}/${repo.name}/branches`);
      const result = await response.json();
      
      if (result.success) {
        setBranches(result.data);
      }
    } catch (error) {
      console.error('Failed to load branches:', error);
    }
  };

  const createEditorSession = async () => {
    if (!selectedRepo) {
      toast({
        title: "Error",
        description: "Please select a repository first",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/editor/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: sessionForm.projectId,
          userId: sessionForm.userId,
          autoSave: sessionForm.autoSave,
          gitRepository: {
            owner: selectedRepo.fullName.split('/')[0],
            repo: selectedRepo.name,
            branch: selectedRepo.defaultBranch,
          },
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setEditorSession(result.data);
        toast({
          title: "Success",
          description: "Source code editor session created successfully",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create editor session",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create editor session",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const syncWithGitHub = async () => {
    if (!editorSession) {
      toast({
        title: "Error",
        description: "No active editor session",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/editor/sessions/${editorSession.id}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Files synchronized with GitHub successfully",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to sync with GitHub",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sync with GitHub",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!gitHubConnected) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              GitHub Integration
            </CardTitle>
            <CardDescription>
              GitHub integration is not configured. Please provide your GitHub token.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
                <h3 className="font-semibold text-orange-800 mb-2">Setup Required</h3>
                <p className="text-orange-700 mb-3">
                  To enable GitHub integration, you need to provide a GitHub token in your environment variables.
                </p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-orange-700">
                  <li>Go to GitHub Settings → Developer settings → Personal access tokens</li>
                  <li>Generate a new token with repository permissions</li>
                  <li>Add GITHUB_TOKEN to your environment variables</li>
                  <li>Restart the application</li>
                </ol>
              </div>
              <Button onClick={checkGitHubConnection} variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Check Connection
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">GitHub Integration</h1>
          <p className="text-muted-foreground">
            Manage repositories, edit source code, and sync with GitHub
          </p>
        </div>
        {gitHubConnected ? (
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-green-100 text-green-800">
              <Github className="h-3 w-3 mr-1" />
              Connected
            </Badge>
            {gitHubUser && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <img 
                  src={gitHubUser.avatar_url} 
                  alt={gitHubUser.name || gitHubUser.login}
                  className="w-6 h-6 rounded-full"
                />
                <span>{gitHubUser.name || gitHubUser.login}</span>
              </div>
            )}
          </div>
        ) : (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Not Connected
          </Badge>
        )}
      </div>

      <Tabs defaultValue="repositories" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="repositories">Repositories</TabsTrigger>
          <TabsTrigger value="editor">Source Editor</TabsTrigger>
          <TabsTrigger value="sync">Synchronization</TabsTrigger>
        </TabsList>

        <TabsContent value="repositories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Repository</CardTitle>
              <CardDescription>
                Create a new GitHub repository for your WAI project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="repo-name" className="text-sm font-medium">
                    Repository Name
                  </label>
                  <Input
                    id="repo-name"
                    placeholder="my-wai-project"
                    value={newRepo.name}
                    onChange={(e) => setNewRepo({ ...newRepo, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="repo-visibility" className="text-sm font-medium">
                    Visibility
                  </label>
                  <Select
                    value={newRepo.private ? 'private' : 'public'}
                    onValueChange={(value) => setNewRepo({ ...newRepo, private: value === 'private' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-2">
                  <label htmlFor="repo-description" className="text-sm font-medium">
                    Description (Optional)
                  </label>
                  <Textarea
                    id="repo-description"
                    placeholder="A brief description of your project"
                    value={newRepo.description}
                    onChange={(e) => setNewRepo({ ...newRepo, description: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Button onClick={createRepository} disabled={loading}>
                    <Github className="h-4 w-4 mr-2" />
                    Create Repository
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Repositories</CardTitle>
              <CardDescription>
                Select a repository to work with
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading repositories...</div>
              ) : (
                <div className="grid gap-4">
                  {repositories.map((repo) => (
                    <div
                      key={repo.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedRepo?.id === repo.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => selectRepository(repo)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-semibold">{repo.name}</h3>
                          <p className="text-sm text-muted-foreground">{repo.description}</p>
                          <div className="flex items-center gap-2 text-xs">
                            <Badge variant="outline">{repo.language || 'Unknown'}</Badge>
                            <Badge variant={repo.private ? 'secondary' : 'default'}>
                              {repo.private ? 'Private' : 'Public'}
                            </Badge>
                            <span className="text-muted-foreground">
                              Default branch: {repo.defaultBranch}
                            </span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Select
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="editor" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Source Code Editor</CardTitle>
              <CardDescription>
                Create an AI-powered editing session for your repository
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedRepo ? (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Selected Repository:</strong> {selectedRepo.fullName}
                    </p>
                    {branches.length > 0 && (
                      <p className="text-sm text-blue-700 mt-1">
                        Available branches: {branches.map(b => b.name).join(', ')}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Project ID</label>
                      <Input
                        value={sessionForm.projectId}
                        onChange={(e) => setSessionForm({ ...sessionForm, projectId: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">User ID</label>
                      <Input
                        value={sessionForm.userId}
                        onChange={(e) => setSessionForm({ ...sessionForm, userId: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="auto-save"
                      checked={sessionForm.autoSave}
                      onChange={(e) => setSessionForm({ ...sessionForm, autoSave: e.target.checked })}
                    />
                    <label htmlFor="auto-save" className="text-sm">
                      Enable auto-save
                    </label>
                  </div>

                  <Button onClick={createEditorSession} disabled={loading}>
                    <Code className="h-4 w-4 mr-2" />
                    Create Editor Session
                  </Button>

                  {editorSession && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h3 className="font-semibold text-green-800 mb-2">Editor Session Active</h3>
                      <p className="text-sm text-green-700">
                        Session ID: {editorSession.id}
                      </p>
                      <p className="text-sm text-green-700">
                        Files loaded: {Object.keys(editorSession.files).length}
                      </p>
                      {editorSession.gitRepository && (
                        <p className="text-sm text-green-700">
                          Connected to: {editorSession.gitRepository.owner}/{editorSession.gitRepository.repo}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a repository first to create an editor session</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>GitHub Synchronization</CardTitle>
              <CardDescription>
                Sync your local changes with GitHub repositories
              </CardDescription>
            </CardHeader>
            <CardContent>
              {editorSession ? (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-2">Active Session</h3>
                    <p className="text-sm text-blue-700">
                      Session: {editorSession.id}
                    </p>
                    {editorSession.gitRepository && (
                      <p className="text-sm text-blue-700">
                        Repository: {editorSession.gitRepository.owner}/{editorSession.gitRepository.repo}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button onClick={syncWithGitHub} disabled={loading} className="w-full">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Sync with GitHub
                    </Button>
                    
                    <Button 
                      onClick={() => {
                        if (editorSession) {
                          fetch(`/api/editor/sessions/${editorSession.id}/save`, { method: 'POST' })
                            .then(res => res.json())
                            .then(result => {
                              if (result.success) {
                                toast({ title: "Success", description: "Files saved locally" });
                              }
                            });
                        }
                      }}
                      variant="outline" 
                      className="w-full"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Save All Files
                    </Button>

                    <Button 
                      onClick={() => {
                        if (editorSession) {
                          fetch(`/api/editor/sessions/${editorSession.id}/tree`)
                            .then(res => res.json())
                            .then(result => {
                              if (result.success) {
                                console.log('File tree:', result.data);
                                toast({ title: "Success", description: "File tree loaded (check console)" });
                              }
                            });
                        }
                      }}
                      variant="outline" 
                      className="w-full"
                    >
                      <FolderTree className="h-4 w-4 mr-2" />
                      View File Tree
                    </Button>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-semibold mb-2">Synchronization Features</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Real-time file synchronization with GitHub</li>
                      <li>• AI-powered code suggestions and error detection</li>
                      <li>• Automatic commit message generation</li>
                      <li>• Branch management and pull request creation</li>
                      <li>• Collaborative editing with cursor tracking</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Create an editor session first to enable synchronization</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}