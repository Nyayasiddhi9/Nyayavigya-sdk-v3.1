import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Eye, Mic, FileText, MessageSquare, Upload, Play, Pause, 
  Volume2, Download, Copy, Sparkles, Camera, Image as ImageIcon,
  Languages, Search, Wand2, Loader2, CheckCircle, XCircle,
  Brain, Zap, RefreshCw
} from 'lucide-react';

interface VisionResult {
  id: string;
  analysisType: string;
  result: {
    description?: string;
    text?: string;
    objects?: Array<{ name: string; confidence: number }>;
    faces?: Array<{ description: string; emotion?: string }>;
    scene?: { description: string; categories: string[] };
  };
  metadata: { model: string; processingTime: number };
}

interface SpeechResult {
  id: string;
  text: string;
  language?: string;
  duration?: number;
  metadata: { model: string; processingTime: number };
}

interface TTSResult {
  id: string;
  audioBase64: string;
  format: string;
  metadata: { model: string; voice: string; provider: string };
}

interface DocumentResult {
  id: string;
  results: {
    extractedText?: string;
    summary?: string;
    translation?: string;
    analysis?: { topics: string[]; entities: string[]; sentiment: string; keyPoints: string[] };
    answer?: string;
  };
  metadata: { processingTime: number; wordCount?: number };
}

export default function MultimodalStudio() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('vision');

  const { data: capabilities } = useQuery({
    queryKey: ['/api/multimodal/capabilities']
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent" data-testid="text-page-title">
              Multimodal AI Studio
            </h1>
          </div>
          <p className="text-muted-foreground ml-12">
            Vision analysis, speech processing, and document understanding powered by GPT-4o, Whisper, and ElevenLabs
          </p>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <CapabilityCard
            icon={Eye}
            title="Vision"
            enabled={capabilities?.data?.capabilities?.vision}
            features={['Image Analysis', 'OCR', 'Object Detection']}
          />
          <CapabilityCard
            icon={Mic}
            title="Speech-to-Text"
            enabled={capabilities?.data?.capabilities?.speechToText}
            features={['Whisper AI', 'Multi-language', 'Timestamps']}
          />
          <CapabilityCard
            icon={Volume2}
            title="Text-to-Speech"
            enabled={capabilities?.data?.capabilities?.textToSpeech}
            features={['OpenAI TTS', 'ElevenLabs', '6+ Voices']}
          />
          <CapabilityCard
            icon={FileText}
            title="Documents"
            enabled={capabilities?.data?.capabilities?.documentProcessing}
            features={['Summarize', 'Translate', 'Q&A']}
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="vision" className="flex items-center gap-2" data-testid="tab-vision">
              <Eye className="h-4 w-4" />
              Vision
            </TabsTrigger>
            <TabsTrigger value="speech-to-text" className="flex items-center gap-2" data-testid="tab-stt">
              <Mic className="h-4 w-4" />
              Speech-to-Text
            </TabsTrigger>
            <TabsTrigger value="text-to-speech" className="flex items-center gap-2" data-testid="tab-tts">
              <Volume2 className="h-4 w-4" />
              Text-to-Speech
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2" data-testid="tab-documents">
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vision">
            <VisionAnalysisTab />
          </TabsContent>

          <TabsContent value="speech-to-text">
            <SpeechToTextTab />
          </TabsContent>

          <TabsContent value="text-to-speech">
            <TextToSpeechTab />
          </TabsContent>

          <TabsContent value="documents">
            <DocumentProcessingTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function CapabilityCard({ 
  icon: Icon, 
  title, 
  enabled, 
  features 
}: { 
  icon: any; 
  title: string; 
  enabled?: boolean; 
  features: string[] 
}) {
  return (
    <Card className={`transition-all ${enabled ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/30' : 'opacity-60'}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            <span className="font-medium">{title}</span>
          </div>
          {enabled ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          {features.map((f, i) => (
            <Badge key={i} variant="secondary" className="text-xs">{f}</Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function VisionAnalysisTab() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analysisType, setAnalysisType] = useState('describe');
  const [customPrompt, setCustomPrompt] = useState('');
  const [result, setResult] = useState<VisionResult | null>(null);

  const analysisMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/multimodal/vision/analyze', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) throw new Error('Analysis failed');
      return response.json();
    },
    onSuccess: (data) => {
      setResult(data.data);
      toast({ title: 'Analysis complete', description: `Processed in ${data.data.metadata.processingTime}ms` });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = () => {
    if (!fileInputRef.current?.files?.[0] && !imagePreview) {
      toast({ title: 'No image', description: 'Please upload an image first', variant: 'destructive' });
      return;
    }

    const formData = new FormData();
    if (fileInputRef.current?.files?.[0]) {
      formData.append('image', fileInputRef.current.files[0]);
    } else if (imagePreview) {
      formData.append('imageData', imagePreview.split(',')[1]);
    }
    formData.append('analysisType', analysisType);
    if (analysisType === 'custom' && customPrompt) {
      formData.append('prompt', customPrompt);
    }

    analysisMutation.mutate(formData);
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Image Input
          </CardTitle>
          <CardDescription>Upload or capture an image for AI analysis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div 
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
            data-testid="input-image-upload"
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
            ) : (
              <div className="space-y-2">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground">PNG, JPG, WEBP up to 10MB</p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          <div className="space-y-2">
            <Label>Analysis Type</Label>
            <Select value={analysisType} onValueChange={setAnalysisType}>
              <SelectTrigger data-testid="select-analysis-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="describe">Describe Image</SelectItem>
                <SelectItem value="ocr">Extract Text (OCR)</SelectItem>
                <SelectItem value="objects">Detect Objects</SelectItem>
                <SelectItem value="faces">Analyze Faces</SelectItem>
                <SelectItem value="scene">Scene Analysis</SelectItem>
                <SelectItem value="custom">Custom Prompt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {analysisType === 'custom' && (
            <div className="space-y-2">
              <Label>Custom Prompt</Label>
              <Textarea
                placeholder="Describe what you want to know about this image..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                data-testid="input-custom-prompt"
              />
            </div>
          )}

          <Button 
            onClick={handleAnalyze} 
            className="w-full"
            disabled={analysisMutation.isPending || (!imagePreview)}
            data-testid="button-analyze"
          >
            {analysisMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Analyze Image
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Analysis Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          {result ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge>{result.analysisType}</Badge>
                <span className="text-xs text-muted-foreground">
                  {result.metadata.processingTime}ms | {result.metadata.model}
                </span>
              </div>
              <Separator />
              <ScrollArea className="h-[400px]">
                <div className="space-y-3 pr-4">
                  {result.result.description && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Description</Label>
                      <p className="text-sm whitespace-pre-wrap">{result.result.description}</p>
                    </div>
                  )}
                  {result.result.text && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Extracted Text</Label>
                      <pre className="text-sm bg-muted p-3 rounded-lg overflow-auto">{result.result.text}</pre>
                    </div>
                  )}
                  {result.result.objects && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Objects Detected</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {result.result.objects.map((obj, i) => (
                          <Badge key={i} variant="outline">
                            {obj.name} ({Math.round(obj.confidence * 100)}%)
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.result.faces && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Faces</Label>
                      {result.result.faces.map((face, i) => (
                        <div key={i} className="bg-muted p-2 rounded-lg mt-1">
                          <p className="text-sm">{face.description}</p>
                          {face.emotion && <Badge className="mt-1">{face.emotion}</Badge>}
                        </div>
                      ))}
                    </div>
                  )}
                  {result.result.scene && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Scene</Label>
                      <p className="text-sm">{result.result.scene.description}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {result.result.scene.categories.map((cat, i) => (
                          <Badge key={i} variant="secondary">{cat}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Upload an image and click analyze</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SpeechToTextTab() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [language, setLanguage] = useState('');
  const [result, setResult] = useState<SpeechResult | null>(null);

  const transcribeMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/multimodal/speech/transcribe', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) throw new Error('Transcription failed');
      return response.json();
    },
    onSuccess: (data) => {
      setResult(data.data);
      toast({ title: 'Transcription complete' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
    }
  };

  const handleTranscribe = () => {
    if (!audioFile) {
      toast({ title: 'No audio', description: 'Please upload an audio file', variant: 'destructive' });
      return;
    }

    const formData = new FormData();
    formData.append('audio', audioFile);
    if (language) formData.append('language', language);
    formData.append('responseFormat', 'verbose_json');

    transcribeMutation.mutate(formData);
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Audio Input
          </CardTitle>
          <CardDescription>Upload audio or record directly</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div 
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
            data-testid="input-audio-upload"
          >
            {audioFile ? (
              <div className="space-y-2">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
                <p className="font-medium">{audioFile.name}</p>
                <p className="text-xs text-muted-foreground">{(audioFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">Click to upload audio</p>
                <p className="text-xs text-muted-foreground">MP3, WAV, M4A, WEBM up to 25MB</p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          <div className="space-y-2">
            <Label>Language (optional)</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger data-testid="select-language">
                <SelectValue placeholder="Auto-detect" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Auto-detect</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="it">Italian</SelectItem>
                <SelectItem value="pt">Portuguese</SelectItem>
                <SelectItem value="hi">Hindi</SelectItem>
                <SelectItem value="ja">Japanese</SelectItem>
                <SelectItem value="ko">Korean</SelectItem>
                <SelectItem value="zh">Chinese</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleTranscribe} 
            className="w-full"
            disabled={transcribeMutation.isPending || !audioFile}
            data-testid="button-transcribe"
          >
            {transcribeMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Transcribing...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Transcribe Audio
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Transcription
          </CardTitle>
        </CardHeader>
        <CardContent>
          {result ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {result.language && <Badge>{result.language.toUpperCase()}</Badge>}
                  {result.duration && <Badge variant="outline">{result.duration.toFixed(1)}s</Badge>}
                </div>
                <span className="text-xs text-muted-foreground">{result.metadata.processingTime}ms</span>
              </div>
              <Separator />
              <ScrollArea className="h-[350px]">
                <div className="space-y-2 pr-4">
                  <p className="text-sm whitespace-pre-wrap">{result.text}</p>
                </div>
              </ScrollArea>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(result.text)}
                  data-testid="button-copy-transcript"
                >
                  <Copy className="h-4 w-4 mr-1" /> Copy
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Mic className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Upload audio and transcribe</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TextToSpeechTab() {
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('alloy');
  const [provider, setProvider] = useState('openai');
  const [speed, setSpeed] = useState([1.0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [result, setResult] = useState<TTSResult | null>(null);

  const { data: voicesData } = useQuery({
    queryKey: ['/api/multimodal/speech/voices']
  });

  const synthesizeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/multimodal/speech/synthesize', data);
      return response.json();
    },
    onSuccess: (data) => {
      setResult(data.data);
      toast({ title: 'Speech generated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleSynthesize = () => {
    if (!text.trim()) {
      toast({ title: 'No text', description: 'Please enter text to synthesize', variant: 'destructive' });
      return;
    }

    synthesizeMutation.mutate({
      text,
      voice,
      speed: speed[0],
      provider
    });
  };

  const handlePlayPause = () => {
    if (!audioRef.current || !result) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.src = `data:audio/mp3;base64,${result.audioBase64}`;
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleDownload = () => {
    if (!result) return;
    
    const link = document.createElement('a');
    link.href = `data:audio/mp3;base64,${result.audioBase64}`;
    link.download = 'speech.mp3';
    link.click();
  };

  const voices = provider === 'openai' 
    ? voicesData?.data?.openai?.voices || []
    : voicesData?.data?.elevenlabs?.voices || [];

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Text Input
          </CardTitle>
          <CardDescription>Enter text to convert to speech</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Enter the text you want to convert to speech..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[150px]"
            data-testid="input-tts-text"
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select value={provider} onValueChange={(v) => { setProvider(v); setVoice(v === 'openai' ? 'alloy' : '21m00Tcm4TlvDq8ikWAM'); }}>
                <SelectTrigger data-testid="select-tts-provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI TTS</SelectItem>
                  <SelectItem value="elevenlabs" disabled={!voicesData?.data?.elevenlabs?.available}>
                    ElevenLabs {!voicesData?.data?.elevenlabs?.available && '(unavailable)'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Voice</Label>
              <Select value={voice} onValueChange={setVoice}>
                <SelectTrigger data-testid="select-tts-voice">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {voices.map((v: any) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Speed</Label>
              <span className="text-xs text-muted-foreground">{speed[0]}x</span>
            </div>
            <Slider
              value={speed}
              onValueChange={setSpeed}
              min={0.25}
              max={4}
              step={0.25}
              data-testid="slider-tts-speed"
            />
          </div>

          <Button 
            onClick={handleSynthesize} 
            className="w-full"
            disabled={synthesizeMutation.isPending || !text.trim()}
            data-testid="button-synthesize"
          >
            {synthesizeMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Volume2 className="h-4 w-4 mr-2" />
                Generate Speech
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Audio Output
          </CardTitle>
        </CardHeader>
        <CardContent>
          {result ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Badge>{result.metadata.provider}</Badge>
                  <Badge variant="outline">{result.metadata.voice}</Badge>
                </div>
                <span className="text-xs text-muted-foreground">{result.format}</span>
              </div>

              <div className="flex items-center justify-center py-8">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-20 w-20 rounded-full"
                  onClick={handlePlayPause}
                  data-testid="button-play-audio"
                >
                  {isPlaying ? (
                    <Pause className="h-8 w-8" />
                  ) : (
                    <Play className="h-8 w-8 ml-1" />
                  )}
                </Button>
              </div>

              <audio 
                ref={audioRef} 
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />

              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={handleDownload} data-testid="button-download-audio">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Volume2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Enter text and generate speech</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DocumentProcessingTab() {
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [operation, setOperation] = useState('summarize');
  const [question, setQuestion] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [result, setResult] = useState<DocumentResult | null>(null);

  const processMutation = useMutation({
    mutationFn: async (data: any) => {
      let endpoint = '/api/multimodal/document/process';
      if (operation === 'summarize') endpoint = '/api/multimodal/document/summarize';
      if (operation === 'translate') endpoint = '/api/multimodal/document/translate';
      if (operation === 'qa') endpoint = '/api/multimodal/document/qa';

      const response = await apiRequest('POST', endpoint, data);
      return response.json();
    },
    onSuccess: (data) => {
      setResult(data.data);
      toast({ title: 'Processing complete' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleProcess = () => {
    if (!text.trim()) {
      toast({ title: 'No text', description: 'Please enter text to process', variant: 'destructive' });
      return;
    }

    let data: any = { text };
    if (operation === 'translate') {
      data.targetLanguage = targetLanguage;
    } else if (operation === 'qa') {
      if (!question.trim()) {
        toast({ title: 'No question', description: 'Please enter a question', variant: 'destructive' });
        return;
      }
      data.question = question;
    }

    processMutation.mutate(data);
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Input
          </CardTitle>
          <CardDescription>Enter text or upload a document</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Paste your document text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[200px]"
            data-testid="input-document-text"
          />

          <div className="space-y-2">
            <Label>Operation</Label>
            <Select value={operation} onValueChange={setOperation}>
              <SelectTrigger data-testid="select-operation">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summarize">Summarize</SelectItem>
                <SelectItem value="translate">Translate</SelectItem>
                <SelectItem value="analyze">Analyze</SelectItem>
                <SelectItem value="qa">Question & Answer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {operation === 'translate' && (
            <div className="space-y-2">
              <Label>Target Language</Label>
              <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                <SelectTrigger data-testid="select-target-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="it">Italian</SelectItem>
                  <SelectItem value="pt">Portuguese</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                  <SelectItem value="ko">Korean</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {operation === 'qa' && (
            <div className="space-y-2">
              <Label>Question</Label>
              <Input
                placeholder="What would you like to know?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                data-testid="input-question"
              />
            </div>
          )}

          <Button 
            onClick={handleProcess} 
            className="w-full"
            disabled={processMutation.isPending || !text.trim()}
            data-testid="button-process"
          >
            {processMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Process Document
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          {result ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge>{operation}</Badge>
                <span className="text-xs text-muted-foreground">
                  {result.metadata?.processingTime}ms
                  {result.metadata?.wordCount && ` | ${result.metadata.wordCount} words`}
                </span>
              </div>
              <Separator />
              <ScrollArea className="h-[350px]">
                <div className="space-y-3 pr-4">
                  {result.results?.summary && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Summary</Label>
                      <p className="text-sm whitespace-pre-wrap">{result.results.summary}</p>
                    </div>
                  )}
                  {result.results?.translation && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Translation</Label>
                      <p className="text-sm whitespace-pre-wrap">{result.results.translation}</p>
                    </div>
                  )}
                  {result.results?.answer && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Answer</Label>
                      <p className="text-sm whitespace-pre-wrap">{result.results.answer}</p>
                    </div>
                  )}
                  {result.results?.analysis && (
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Topics</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {result.results.analysis.topics.map((t, i) => (
                            <Badge key={i} variant="secondary">{t}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Entities</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {result.results.analysis.entities.map((e, i) => (
                            <Badge key={i} variant="outline">{e}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Sentiment</Label>
                        <Badge className="mt-1">{result.results.analysis.sentiment}</Badge>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Key Points</Label>
                        <ul className="list-disc list-inside text-sm mt-1">
                          {result.results.analysis.keyPoints.map((p, i) => (
                            <li key={i}>{p}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Enter text and select an operation</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
