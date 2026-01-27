import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Upload, 
  Search, 
  Database, 
  FileText, 
  Image as ImageIcon, 
  Music, 
  Video,
  Brain,
  Network,
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  Trash2,
  Plus,
  BookOpen,
  Target,
  Layers,
  BarChart3,
  Eye
} from "lucide-react";

interface KnowledgeBase {
  id: string;
  name: string;
  type: string;
  documentCount: number;
}

interface SearchResult {
  document: {
    id: string;
    type: string;
    metadata: {
      title: string;
      source: string;
      timestamp: string;
      tags: string[];
      author?: string;
    };
  };
  similarity: number;
  relevanceScore: number;
  contextSnippet: string;
  highlights: string[];
  metadata: any;
}

interface DocumentProcessingResult {
  success: boolean;
  documentId: string;
  chunks: number;
  embeddings: number;
  entities: number;
  relations: number;
  processingTime: number;
  error?: string;
}

export default function EnhancedRAGDemo() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [selectedKB, setSelectedKB] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [processingResults, setProcessingResults] = useState<DocumentProcessingResult[]>([]);
  const [error, setError] = useState<string>("");
  const [stats, setStats] = useState<any>(null);
  
  const [newKBName, setNewKBName] = useState("");
  const [newKBType, setNewKBType] = useState("multimodal");
  const [searchOptions, setSearchOptions] = useState({
    maxResults: 10,
    threshold: 0.7,
    includeMetadata: true,
    contextualReranking: true
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadKnowledgeBases();
    loadStats();
  }, []);

  const loadKnowledgeBases = async () => {
    try {
      const response = await fetch('/api/rag/knowledge-bases');
      const data = await response.json();
      
      if (data.success) {
        setKnowledgeBases(data.data);
      }
    } catch (error) {
      console.error('Failed to load knowledge bases:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/rag/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const createKnowledgeBase = async () => {
    if (!newKBName.trim()) {
      setError("Knowledge base name is required");
      return;
    }

    try {
      const response = await fetch('/api/rag/knowledge-bases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newKBName,
          type: newKBType,
          description: `${newKBType} knowledge base for ${newKBName}`,
          tags: [newKBType, 'demo']
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setNewKBName("");
        setError("");
        await loadKnowledgeBases();
        setSelectedKB(data.data.id);
      } else {
        setError(data.error || 'Failed to create knowledge base');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create knowledge base');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
    setError("");
  };

  const uploadDocuments = async () => {
    if (selectedFiles.length === 0) {
      setError("Please select files to upload");
      return;
    }

    if (!selectedKB) {
      setError("Please select a knowledge base");
      return;
    }

    setIsProcessing(true);
    setProcessingResults([]);

    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('documents', file);
      });

      const response = await fetch(`/api/rag/knowledge-bases/${selectedKB}/batch-documents`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        setProcessingResults(data.data.results);
        setSelectedFiles([]);
        await loadKnowledgeBases();
        await loadStats();
      } else {
        setError(data.error || 'Failed to upload documents');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to upload documents');
    } finally {
      setIsProcessing(false);
    }
  };

  const performSearch = async () => {
    if (!searchQuery.trim()) {
      setError("Please enter a search query");
      return;
    }

    setIsSearching(true);
    setSearchResults([]);
    setError("");

    try {
      const searchRequest = {
        query: searchQuery,
        knowledgeBaseId: selectedKB === "all" ? undefined : selectedKB || undefined,
        options: searchOptions
      };

      const response = await fetch('/api/rag/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(searchRequest)
      });

      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.data.results);
      } else {
        setError(data.error || 'Search failed');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="h-4 w-4" />;
      case 'audio': return <Music className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getFileTypeColor = (type: string) => {
    switch (type) {
      case 'image': return 'bg-purple-100 text-purple-800';
      case 'audio': return 'bg-green-100 text-green-800';
      case 'video': return 'bg-red-100 text-red-800';
      case 'pdf': return 'bg-orange-100 text-orange-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Enhanced RAG & Knowledge Systems Demo
          </h1>
          <p className="text-muted-foreground text-lg">
            Advanced multi-modal retrieval with knowledge graphs and semantic search
          </p>
          <Badge variant="outline" className="text-sm">
            Phase 4 Epic E2 - AI Enhancement
          </Badge>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Database className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                <div className="text-2xl font-bold">{stats.knowledgeBases}</div>
                <div className="text-sm text-muted-foreground">Knowledge Bases</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <FileText className="h-6 w-6 mx-auto text-green-600 mb-2" />
                <div className="text-2xl font-bold">{stats.documents}</div>
                <div className="text-sm text-muted-foreground">Documents</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Brain className="h-6 w-6 mx-auto text-purple-600 mb-2" />
                <div className="text-2xl font-bold">{stats.embeddings}</div>
                <div className="text-sm text-muted-foreground">Embeddings</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Network className="h-6 w-6 mx-auto text-orange-600 mb-2" />
                <div className="text-2xl font-bold">{stats.graphNodes}</div>
                <div className="text-sm text-muted-foreground">Graph Nodes</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Layers className="h-6 w-6 mx-auto text-red-600 mb-2" />
                <div className="text-2xl font-bold">{stats.graphEdges}</div>
                <div className="text-sm text-muted-foreground">Graph Edges</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <BarChart3 className="h-6 w-6 mx-auto text-indigo-600 mb-2" />
                <div className="text-2xl font-bold">{stats.cacheSize}</div>
                <div className="text-sm text-muted-foreground">Cache Size</div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="search">Semantic Search</TabsTrigger>
            <TabsTrigger value="upload">Document Upload</TabsTrigger>
            <TabsTrigger value="knowledge-bases">Knowledge Bases</TabsTrigger>
            <TabsTrigger value="knowledge-graph">Knowledge Graph</TabsTrigger>
          </TabsList>

          {/* Semantic Search Tab */}
          <TabsContent value="search" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Search className="h-5 w-5" />
                      Search Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="knowledge-base">Knowledge Base</Label>
                      <Select value={selectedKB} onValueChange={setSelectedKB}>
                        <SelectTrigger>
                          <SelectValue placeholder="All knowledge bases" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Knowledge Bases</SelectItem>
                          {knowledgeBases.map(kb => (
                            <SelectItem key={kb.id} value={kb.id}>
                              {kb.name} ({kb.documentCount} docs)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="search-query">Search Query</Label>
                      <Textarea
                        id="search-query"
                        placeholder="Enter your search query..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="max-results">Max Results</Label>
                        <Input
                          id="max-results"
                          type="number"
                          value={searchOptions.maxResults}
                          onChange={(e) => setSearchOptions(prev => ({ 
                            ...prev, 
                            maxResults: parseInt(e.target.value) || 10 
                          }))}
                          className="w-20"
                          min="1"
                          max="50"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="threshold">Similarity Threshold</Label>
                        <Input
                          id="threshold"
                          type="number"
                          step="0.1"
                          value={searchOptions.threshold}
                          onChange={(e) => setSearchOptions(prev => ({ 
                            ...prev, 
                            threshold: parseFloat(e.target.value) || 0.7 
                          }))}
                          className="w-20"
                          min="0"
                          max="1"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="include-metadata"
                          checked={searchOptions.includeMetadata}
                          onCheckedChange={(checked) =>
                            setSearchOptions(prev => ({ ...prev, includeMetadata: checked }))
                          }
                        />
                        <Label htmlFor="include-metadata">Include Metadata</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="contextual-reranking"
                          checked={searchOptions.contextualReranking}
                          onCheckedChange={(checked) =>
                            setSearchOptions(prev => ({ ...prev, contextualReranking: checked }))
                          }
                        />
                        <Label htmlFor="contextual-reranking">Contextual Reranking</Label>
                      </div>
                    </div>

                    <Button
                      onClick={performSearch}
                      disabled={!searchQuery.trim() || isSearching}
                      className="w-full"
                      size="lg"
                    >
                      {isSearching ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          Search Knowledge Base
                        </>
                      )}
                    </Button>

                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Search Results ({searchResults.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {searchResults.length > 0 ? (
                      <ScrollArea className="h-96">
                        <div className="space-y-4">
                          {searchResults.map((result, index) => (
                            <div key={index} className="border rounded-lg p-4 space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  {getFileTypeIcon(result.document.type)}
                                  <h4 className="font-semibold">{result.document.metadata.title}</h4>
                                  <Badge className={getFileTypeColor(result.document.type)}>
                                    {result.document.type}
                                  </Badge>
                                </div>
                                <div className="flex gap-2">
                                  <Badge variant="outline">
                                    {(result.similarity * 100).toFixed(1)}% similarity
                                  </Badge>
                                  <Badge variant="secondary">
                                    {(result.relevanceScore * 100).toFixed(1)}% relevance
                                  </Badge>
                                </div>
                              </div>

                              <div className="text-sm text-muted-foreground">
                                <p><strong>Source:</strong> {result.document.metadata.source}</p>
                                <p><strong>Author:</strong> {result.document.metadata.author || 'Unknown'}</p>
                                <p><strong>Date:</strong> {new Date(result.document.metadata.timestamp).toLocaleDateString()}</p>
                              </div>

                              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                                <p className="text-sm">{result.contextSnippet}</p>
                              </div>

                              {result.highlights.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  <span className="text-sm font-medium">Highlights:</span>
                                  {result.highlights.map((highlight, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {highlight}
                                    </Badge>
                                  ))}
                                </div>
                              )}

                              {result.document.metadata.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  <span className="text-sm font-medium">Tags:</span>
                                  {result.document.metadata.tags.map((tag, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="text-center py-12">
                        <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No search results</h3>
                        <p className="text-muted-foreground">
                          Enter a search query to find relevant documents
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Document Upload Tab */}
          <TabsContent value="upload" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Document Upload
                  </CardTitle>
                  <CardDescription>
                    Upload documents to enhance your knowledge base
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="upload-kb">Target Knowledge Base</Label>
                    <Select value={selectedKB} onValueChange={setSelectedKB}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select knowledge base" />
                      </SelectTrigger>
                      <SelectContent>
                        {knowledgeBases.map(kb => (
                          <SelectItem key={kb.id} value={kb.id}>
                            {kb.name} ({kb.type})
                          </SelectItem>
                        ))}
                        {knowledgeBases.length === 0 && (
                          <SelectItem value="none" disabled>No knowledge bases available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".txt,.pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.gif,.mp3,.wav,.mp4,.avi"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    
                    {selectedFiles.length > 0 ? (
                      <div className="space-y-2">
                        <h4 className="font-medium">Selected Files ({selectedFiles.length}):</h4>
                        <ScrollArea className="h-32">
                          <div className="space-y-1">
                            {selectedFiles.map((file, index) => (
                              <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                <span className="truncate">{file.name}</span>
                                <Badge variant="outline">{(file.size / 1024 / 1024).toFixed(2)} MB</Badge>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    ) : (
                      <div className="text-center space-y-2">
                        <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                        <p className="text-muted-foreground">No files selected</p>
                        <p className="text-sm text-muted-foreground">
                          Supports: PDF, DOC, TXT, Images, Audio, Video
                        </p>
                      </div>
                    )}
                    
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="w-full mt-4"
                    >
                      Choose Files
                    </Button>
                  </div>

                  <Button
                    onClick={uploadDocuments}
                    disabled={selectedFiles.length === 0 || !selectedKB || isProcessing}
                    className="w-full"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing Documents...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload & Process Documents
                      </>
                    )}
                  </Button>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Processing Results</CardTitle>
                </CardHeader>
                <CardContent>
                  {processingResults.length > 0 ? (
                    <ScrollArea className="h-96">
                      <div className="space-y-3">
                        {processingResults.map((result, index) => (
                          <div key={index} className="border rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">Document {index + 1}</span>
                              {result.success ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                            
                            {result.success ? (
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>Chunks: {result.chunks}</div>
                                <div>Embeddings: {result.embeddings}</div>
                                <div>Entities: {result.entities}</div>
                                <div>Relations: {result.relations}</div>
                                <div className="col-span-2">
                                  Processing Time: {result.processingTime}ms
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-red-600">{result.error}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="h-16 w-16 mx-auto mb-4" />
                      <p>Upload documents to see processing results</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Knowledge Bases Tab */}
          <TabsContent value="knowledge-bases" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Create Knowledge Base
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="kb-name">Name</Label>
                    <Input
                      id="kb-name"
                      placeholder="Knowledge base name"
                      value={newKBName}
                      onChange={(e) => setNewKBName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="kb-type">Type</Label>
                    <Select value={newKBType} onValueChange={setNewKBType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text Only</SelectItem>
                        <SelectItem value="multimodal">Multi-Modal</SelectItem>
                        <SelectItem value="dynamic">Dynamic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={createKnowledgeBase} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Knowledge Base
                  </Button>
                </CardContent>
              </Card>

              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Existing Knowledge Bases ({knowledgeBases.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {knowledgeBases.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {knowledgeBases.map(kb => (
                          <div
                            key={kb.id}
                            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                              selectedKB === kb.id ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                            }`}
                            onClick={() => setSelectedKB(kb.id)}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold">{kb.name}</h4>
                                <Badge variant="outline">{kb.type}</Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {kb.documentCount} documents
                              </div>
                              <div className="text-xs text-muted-foreground">
                                ID: {kb.id}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <Database className="h-16 w-16 mx-auto mb-4" />
                        <p>No knowledge bases found</p>
                        <p className="text-sm">Create your first knowledge base to get started</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Knowledge Graph Tab */}
          <TabsContent value="knowledge-graph" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Knowledge Graph Visualization
                </CardTitle>
                <CardDescription>
                  Explore entities and relationships extracted from your documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Network className="h-16 w-16 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Knowledge Graph Visualization</h3>
                  <p className="mb-4">
                    Interactive knowledge graph visualization will be displayed here
                  </p>
                  <Badge variant="outline">Coming Soon</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}