import React, { useState, useRef } from "react";
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
import { Separator } from "@/components/ui/separator";
import { 
  Upload, 
  Image as ImageIcon, 
  Eye, 
  Users, 
  FileText, 
  Palette, 
  Target, 
  Brain,
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  Trash2
} from "lucide-react";

interface CVAnalysisResult {
  id: string;
  timestamp: string;
  imageInfo: {
    width?: number;
    height?: number;
    format?: string;
    size?: number;
  };
  analysis: {
    objects?: Array<{
      label: string;
      confidence: number;
      category: string;
    }>;
    faces?: Array<{
      confidence: number;
      attributes?: {
        age?: number;
        gender?: string;
        emotions?: { [emotion: string]: number };
      };
    }>;
    text?: {
      fullText: string;
      blocks: Array<{
        text: string;
        confidence: number;
      }>;
      language?: string;
    };
    scene?: {
      description: string;
      categories: string[];
      adult: boolean;
      violence: boolean;
      medical: boolean;
    };
    brands?: Array<{
      name: string;
      confidence: number;
    }>;
    emotions?: Array<{
      emotion: string;
      confidence: number;
    }>;
    quality?: {
      overall: number;
      sharpness: number;
      brightness: number;
      contrast: number;
      colorfulness: number;
    };
  };
  metadata: {
    processingTime: number;
    confidence: number;
    model: string;
  };
}

interface AnalysisTypes {
  objectDetection: boolean;
  faceDetection: boolean;
  textExtraction: boolean;
  sceneAnalysis: boolean;
  brandDetection: boolean;
  emotionAnalysis: boolean;
  qualityAssessment: boolean;
}

export default function ComputerVisionDemo() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResults, setAnalysisResults] = useState<CVAnalysisResult[]>([]);
  const [currentResult, setCurrentResult] = useState<CVAnalysisResult | null>(null);
  const [error, setError] = useState<string>("");
  const [customPrompt, setCustomPrompt] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [analysisTypes, setAnalysisTypes] = useState<AnalysisTypes>({
    objectDetection: true,
    faceDetection: true,
    textExtraction: true,
    sceneAnalysis: true,
    brandDetection: false,
    emotionAnalysis: false,
    qualityAssessment: true
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError("");
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError("Please select an image file first");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setError("");

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('analysisTypes', JSON.stringify(analysisTypes));
      formData.append('options', JSON.stringify({
        confidence: 0.7,
        language: 'eng',
        includeCoordinates: true,
        generateTags: true,
        customPrompt: customPrompt || undefined
      }));

      const response = await fetch('/api/cv/analyze', {
        method: 'POST',
        body: formData
      });

      clearInterval(progressInterval);
      setAnalysisProgress(100);

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const result = data.data as CVAnalysisResult;
        setAnalysisResults(prev => [result, ...prev]);
        setCurrentResult(result);
      } else {
        throw new Error(data.error || 'Analysis failed');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  };

  const handleClearResults = () => {
    setAnalysisResults([]);
    setCurrentResult(null);
  };

  const handleDownloadResults = () => {
    if (currentResult) {
      const dataStr = JSON.stringify(currentResult, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cv-analysis-${currentResult.id}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const renderObjectDetection = (objects: any[]) => (
    <div className="space-y-2">
      <h4 className="font-semibold flex items-center gap-2">
        <Target className="h-4 w-4" />
        Objects Detected ({objects.length})
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {objects.map((obj, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
            <span className="font-medium">{obj.label}</span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{obj.category}</Badge>
              <Badge variant="outline">{(obj.confidence * 100).toFixed(1)}%</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFaceDetection = (faces: any[]) => (
    <div className="space-y-2">
      <h4 className="font-semibold flex items-center gap-2">
        <Users className="h-4 w-4" />
        Faces Detected ({faces.length})
      </h4>
      {faces.map((face, index) => (
        <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded space-y-2">
          <div className="flex items-center justify-between">
            <span>Face {index + 1}</span>
            <Badge variant="outline">{(face.confidence * 100).toFixed(1)}%</Badge>
          </div>
          {face.attributes && (
            <div className="grid grid-cols-2 gap-2 text-sm">
              {face.attributes.age && (
                <div>Age: ~{face.attributes.age} years</div>
              )}
              {face.attributes.gender && (
                <div>Gender: {face.attributes.gender}</div>
              )}
              {face.attributes.emotions && (
                <div className="col-span-2">
                  <div className="font-medium mb-1">Emotions:</div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(face.attributes.emotions).map(([emotion, confidence]) => (
                      <Badge key={emotion} variant="secondary" className="text-xs">
                        {emotion}: {((confidence as number) * 100).toFixed(0)}%
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderTextExtraction = (text: any) => (
    <div className="space-y-2">
      <h4 className="font-semibold flex items-center gap-2">
        <FileText className="h-4 w-4" />
        Extracted Text
      </h4>
      {text.fullText ? (
        <div className="space-y-2">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
            <ScrollArea className="h-32">
              <pre className="text-sm whitespace-pre-wrap">{text.fullText}</pre>
            </ScrollArea>
          </div>
          {text.blocks && text.blocks.length > 0 && (
            <div>
              <div className="font-medium text-sm mb-2">Text Blocks ({text.blocks.length}):</div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {text.blocks.map((block: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <span className="truncate flex-1">{block.text}</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {(block.confidence * 100).toFixed(0)}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-muted-foreground italic">No text detected in the image</p>
      )}
    </div>
  );

  const renderSceneAnalysis = (scene: any) => (
    <div className="space-y-2">
      <h4 className="font-semibold flex items-center gap-2">
        <Eye className="h-4 w-4" />
        Scene Analysis
      </h4>
      <div className="space-y-3">
        <div>
          <div className="font-medium text-sm mb-1">Description:</div>
          <p className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">{scene.description}</p>
        </div>
        
        {scene.categories && scene.categories.length > 0 && (
          <div>
            <div className="font-medium text-sm mb-1">Categories:</div>
            <div className="flex flex-wrap gap-1">
              {scene.categories.map((category: string, index: number) => (
                <Badge key={index} variant="secondary">{category}</Badge>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="font-medium text-sm mb-1">Content Moderation:</div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className={`flex items-center gap-1 ${scene.adult ? 'text-red-600' : 'text-green-600'}`}>
              {scene.adult ? <AlertCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
              Adult: {scene.adult ? 'Yes' : 'No'}
            </div>
            <div className={`flex items-center gap-1 ${scene.violence ? 'text-red-600' : 'text-green-600'}`}>
              {scene.violence ? <AlertCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
              Violence: {scene.violence ? 'Yes' : 'No'}
            </div>
            <div className={`flex items-center gap-1 ${scene.medical ? 'text-yellow-600' : 'text-green-600'}`}>
              {scene.medical ? <AlertCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
              Medical: {scene.medical ? 'Yes' : 'No'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderQualityAssessment = (quality: any) => (
    <div className="space-y-2">
      <h4 className="font-semibold flex items-center gap-2">
        <Palette className="h-4 w-4" />
        Quality Assessment
      </h4>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Overall Quality</span>
              <span>{(quality.overall * 100).toFixed(1)}%</span>
            </div>
            <Progress value={quality.overall * 100} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Sharpness</span>
              <span>{(quality.sharpness * 100).toFixed(1)}%</span>
            </div>
            <Progress value={quality.sharpness * 100} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Brightness</span>
              <span>{(quality.brightness * 100).toFixed(1)}%</span>
            </div>
            <Progress value={quality.brightness * 100} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Contrast</span>
              <span>{(quality.contrast * 100).toFixed(1)}%</span>
            </div>
            <Progress value={quality.contrast * 100} className="h-2" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Computer Vision API Demo
          </h1>
          <p className="text-muted-foreground text-lg">
            Advanced AI-powered image analysis with object detection, OCR, and scene understanding
          </p>
          <Badge variant="outline" className="text-sm">
            Phase 4 Epic E1 - AI Enhancement
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Upload & Controls */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Image Upload
                </CardTitle>
                <CardDescription>
                  Upload an image for AI-powered analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {imagePreview ? (
                    <div className="space-y-2">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-w-full h-40 object-contain mx-auto rounded"
                      />
                      <p className="text-sm text-muted-foreground">
                        {selectedFile?.name}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground">No image selected</p>
                    </div>
                  )}
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="mt-2"
                  >
                    Choose Image
                  </Button>
                </div>

                {isAnalyzing && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Analyzing image...</span>
                    </div>
                    <Progress value={analysisProgress} className="h-2" />
                  </div>
                )}

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
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Analysis Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="objectDetection"
                      checked={analysisTypes.objectDetection}
                      onCheckedChange={(checked) =>
                        setAnalysisTypes(prev => ({ ...prev, objectDetection: checked }))
                      }
                    />
                    <Label htmlFor="objectDetection">Object Detection</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="faceDetection"
                      checked={analysisTypes.faceDetection}
                      onCheckedChange={(checked) =>
                        setAnalysisTypes(prev => ({ ...prev, faceDetection: checked }))
                      }
                    />
                    <Label htmlFor="faceDetection">Face Detection</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="textExtraction"
                      checked={analysisTypes.textExtraction}
                      onCheckedChange={(checked) =>
                        setAnalysisTypes(prev => ({ ...prev, textExtraction: checked }))
                      }
                    />
                    <Label htmlFor="textExtraction">Text Extraction (OCR)</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="sceneAnalysis"
                      checked={analysisTypes.sceneAnalysis}
                      onCheckedChange={(checked) =>
                        setAnalysisTypes(prev => ({ ...prev, sceneAnalysis: checked }))
                      }
                    />
                    <Label htmlFor="sceneAnalysis">Scene Analysis</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="brandDetection"
                      checked={analysisTypes.brandDetection}
                      onCheckedChange={(checked) =>
                        setAnalysisTypes(prev => ({ ...prev, brandDetection: checked }))
                      }
                    />
                    <Label htmlFor="brandDetection">Brand Detection</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="qualityAssessment"
                      checked={analysisTypes.qualityAssessment}
                      onCheckedChange={(checked) =>
                        setAnalysisTypes(prev => ({ ...prev, qualityAssessment: checked }))
                      }
                    />
                    <Label htmlFor="qualityAssessment">Quality Assessment</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customPrompt">Custom Analysis Prompt</Label>
                  <Textarea
                    id="customPrompt"
                    placeholder="Add specific instructions for the AI analysis..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleAnalyze}
                  disabled={!selectedFile || isAnalyzing}
                  className="w-full"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Analyze Image
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Middle & Right Panel - Results */}
          <div className="lg:col-span-2">
            {currentResult ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Analysis Results
                      </CardTitle>
                      <CardDescription>
                        Completed in {currentResult.metadata.processingTime}ms using {currentResult.metadata.model}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleDownloadResults} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button onClick={handleClearResults} variant="outline" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="objects">Objects</TabsTrigger>
                      <TabsTrigger value="text">Text</TabsTrigger>
                      <TabsTrigger value="scene">Scene</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="overview" className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center space-y-1">
                          <div className="text-2xl font-bold text-blue-600">
                            {currentResult.analysis.objects?.length || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">Objects</div>
                        </div>
                        <div className="text-center space-y-1">
                          <div className="text-2xl font-bold text-green-600">
                            {currentResult.analysis.faces?.length || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">Faces</div>
                        </div>
                        <div className="text-center space-y-1">
                          <div className="text-2xl font-bold text-purple-600">
                            {currentResult.analysis.text?.blocks?.length || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">Text Blocks</div>
                        </div>
                        <div className="text-center space-y-1">
                          <div className="text-2xl font-bold text-orange-600">
                            {Math.round((currentResult.analysis.quality?.overall || 0) * 100)}%
                          </div>
                          <div className="text-sm text-muted-foreground">Quality</div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-4">
                        {currentResult.analysis.objects && currentResult.analysis.objects.length > 0 && 
                          renderObjectDetection(currentResult.analysis.objects)}
                        
                        {currentResult.analysis.faces && currentResult.analysis.faces.length > 0 && (
                          <>
                            <Separator />
                            {renderFaceDetection(currentResult.analysis.faces)}
                          </>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="objects">
                      {currentResult.analysis.objects && currentResult.analysis.objects.length > 0 ? 
                        renderObjectDetection(currentResult.analysis.objects) :
                        <p className="text-muted-foreground text-center py-8">No objects detected</p>
                      }
                    </TabsContent>
                    
                    <TabsContent value="text">
                      {currentResult.analysis.text ? 
                        renderTextExtraction(currentResult.analysis.text) :
                        <p className="text-muted-foreground text-center py-8">No text extraction performed</p>
                      }
                    </TabsContent>
                    
                    <TabsContent value="scene">
                      <div className="space-y-6">
                        {currentResult.analysis.scene && renderSceneAnalysis(currentResult.analysis.scene)}
                        
                        {currentResult.analysis.quality && (
                          <>
                            <Separator />
                            {renderQualityAssessment(currentResult.analysis.quality)}
                          </>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Brain className="h-16 w-16 text-muted-foreground" />
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold">Ready for Analysis</h3>
                    <p className="text-muted-foreground">
                      Upload an image and configure analysis options to get started
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Recent Results */}
        {analysisResults.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Analysis History</CardTitle>
              <CardDescription>
                Previous analysis results ({analysisResults.length - 1} items)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analysisResults.slice(1).map((result, index) => (
                  <div
                    key={result.id}
                    className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => setCurrentResult(result)}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">Analysis #{analysisResults.length - index - 1}</span>
                        <Badge variant="outline" className="text-xs">
                          {result.metadata.processingTime}ms
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(result.timestamp).toLocaleString()}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>{result.analysis.objects?.length || 0} objects</div>
                        <div>{result.analysis.faces?.length || 0} faces</div>
                        <div>{result.analysis.text?.blocks?.length || 0} text blocks</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}