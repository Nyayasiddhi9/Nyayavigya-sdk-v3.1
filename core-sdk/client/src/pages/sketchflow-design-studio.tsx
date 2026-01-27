/**
 * Sketchflow Design Studio - AI-Powered Design Workflows
 * Inspired by Sketchflow.ai design patterns and user experience
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Palette, 
  Sparkles, 
  Layout, 
  Smartphone,
  Monitor,
  Tablet,
  Upload,
  Eye,
  Download,
  Zap,
  Wand2,
  Image,
  Play
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DesignTemplate {
  id: string;
  name: string;
  category: string;
  style: string;
  components: string[];
  responsive: boolean;
  animations: boolean;
  darkMode: boolean;
}

const platformIcons = {
  web: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor
};

const styleColors = {
  modern: 'bg-blue-100 text-blue-800',
  minimal: 'bg-gray-100 text-gray-800', 
  bold: 'bg-red-100 text-red-800',
  elegant: 'bg-purple-100 text-purple-800',
  playful: 'bg-yellow-100 text-yellow-800'
};

export default function SketchflowDesignStudio() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('blueprint');
  const [designForm, setDesignForm] = useState({
    description: '',
    platform: 'web',
    style: 'modern',
    features: []
  });
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);

  // Fetch templates
  const { data: templatesData, isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/sketchflow-design/templates']
  });

  // Fetch workflows  
  const { data: workflowsData } = useQuery({
    queryKey: ['/api/sketchflow-design/workflows']
  });

  // Fetch status
  const { data: statusData } = useQuery({
    queryKey: ['/api/sketchflow-design/status']
  });

  // Generate design mutation
  const generateDesignMutation = useMutation({
    mutationFn: async (designData: any) => {
      const response = await fetch('/api/sketchflow-design/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(designData)
      });
      if (!response.ok) throw new Error('Failed to generate design');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Design Generated Successfully",
        description: `Created ${data.data.components.length} components`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Design Generation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Analyze screenshot mutation
  const analyzeScreenshotMutation = useMutation({
    mutationFn: async (imageBase64: string) => {
      const response = await fetch('/api/sketchflow-design/analyze-screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 })
      });
      if (!response.ok) throw new Error('Failed to analyze screenshot');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Screenshot Analyzed Successfully",
        description: `Found ${data.data.extractedComponents.length} components`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleGenerateDesign = () => {
    if (!designForm.description) {
      toast({
        title: "Description Required",
        description: "Please describe your product idea",
        variant: "destructive"
      });
      return;
    }
    generateDesignMutation.mutate(designForm);
  };

  const handleScreenshotUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setScreenshotFile(file);
      
      // Convert to base64 and analyze
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        const base64Data = base64.split(',')[1]; // Remove data:image/... prefix
        analyzeScreenshotMutation.mutate(base64Data);
      };
      reader.readAsDataURL(file);
    }
  };

  const templates = templatesData?.data?.templates || [];
  const workflows = workflowsData?.data?.workflows || [];
  const status = statusData?.data;

  if (templatesLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading design studio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Palette className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI Design Studio
          </h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Turn your vision into full-fledged product designs with AI-powered workflows
        </p>
      </div>

      {/* Status Overview */}
      {status && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Design System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{status.totalTemplates}</div>
                <div className="text-sm text-muted-foreground">Templates</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{status.categories.length}</div>
                <div className="text-sm text-muted-foreground">Categories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{status.workflows.length}</div>
                <div className="text-sm text-muted-foreground">Workflows</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{status.features.length}</div>
                <div className="text-sm text-muted-foreground">AI Features</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="blueprint" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Blueprint
          </TabsTrigger>
          <TabsTrigger value="snapdesign" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            SnapDesign
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        {/* Blueprint Workflow */}
        <TabsContent value="blueprint" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                Blueprint Workflow
              </CardTitle>
              <CardDescription>
                Start from scratch - describe your product idea and let AI generate tailored designs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Product Description</label>
                <Textarea
                  placeholder="Describe your product idea (e.g., 'A modern SaaS dashboard for project management with clean UI and data visualization')"
                  value={designForm.description}
                  onChange={(e) => setDesignForm({...designForm, description: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Platform</label>
                  <Select value={designForm.platform} onValueChange={(value) => setDesignForm({...designForm, platform: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="web">🌐 Web</SelectItem>
                      <SelectItem value="mobile">📱 Mobile</SelectItem>
                      <SelectItem value="tablet">📲 Tablet</SelectItem>
                      <SelectItem value="desktop">💻 Desktop</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Design Style</label>
                  <Select value={designForm.style} onValueChange={(value) => setDesignForm({...designForm, style: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modern">✨ Modern</SelectItem>
                      <SelectItem value="minimal">⚪ Minimal</SelectItem>
                      <SelectItem value="bold">🔥 Bold</SelectItem>
                      <SelectItem value="elegant">👑 Elegant</SelectItem>
                      <SelectItem value="playful">🎨 Playful</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleGenerateDesign}
                disabled={generateDesignMutation.isPending}
                className="w-full"
                size="lg"
              >
                {generateDesignMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating Design...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Generate AI Design
                  </>
                )}
              </Button>

              {/* Generation Result */}
              {generateDesignMutation.data?.success && (
                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p><strong>Design Generated!</strong></p>
                      <p>Template: {generateDesignMutation.data.data.design.templateName}</p>
                      <p>Components: {generateDesignMutation.data.data.components.join(', ')}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary">Platform: {generateDesignMutation.data.data.design.platform}</Badge>
                        <Badge variant="secondary">Style: {generateDesignMutation.data.data.design.style}</Badge>
                        {generateDesignMutation.data.data.design.responsive && (
                          <Badge variant="outline">Responsive</Badge>
                        )}
                        {generateDesignMutation.data.data.design.darkModeSupport && (
                          <Badge variant="outline">Dark Mode</Badge>
                        )}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SnapDesign Workflow */}
        <TabsContent value="snapdesign" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                SnapDesign Workflow
              </CardTitle>
              <CardDescription>
                Upload reference images and transform them into editable designs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">Upload a screenshot or design reference</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotUpload}
                  className="hidden"
                  id="screenshot-upload"
                />
                <Button asChild variant="outline">
                  <label htmlFor="screenshot-upload" className="cursor-pointer">
                    Choose Image
                  </label>
                </Button>
              </div>

              {screenshotFile && (
                <Alert>
                  <Image className="h-4 w-4" />
                  <AlertDescription>
                    Uploaded: {screenshotFile.name}
                  </AlertDescription>
                </Alert>
              )}

              {/* Analysis Result */}
              {analyzeScreenshotMutation.data?.success && (
                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p><strong>Screenshot Analyzed!</strong></p>
                      <p>Layout: {analyzeScreenshotMutation.data.data.analysis.layoutType}</p>
                      <p>Complexity: {analyzeScreenshotMutation.data.data.analysis.complexity}</p>
                      <p>Components Found: {analyzeScreenshotMutation.data.data.extractedComponents.join(', ')}</p>
                      <div className="flex gap-2 mt-2">
                        {analyzeScreenshotMutation.data.data.designPatterns.map((pattern: string) => (
                          <Badge key={pattern} variant="secondary">{pattern}</Badge>
                        ))}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Library */}
        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template: DesignTemplate) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Badge 
                      variant="secondary" 
                      className={styleColors[template.style as keyof typeof styleColors]}
                    >
                      {template.style}
                    </Badge>
                  </div>
                  <CardDescription className="capitalize">
                    {template.category} • {template.components.length} components
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-1">
                    {template.components.slice(0, 3).map((component) => (
                      <Badge key={component} variant="outline" className="text-xs">
                        {component}
                      </Badge>
                    ))}
                    {template.components.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.components.length - 3} more
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {template.responsive && <Badge variant="outline">Responsive</Badge>}
                    {template.animations && <Badge variant="outline">Animated</Badge>}
                    {template.darkMode && <Badge variant="outline">Dark Mode</Badge>}
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="mr-1 h-3 w-3" />
                      Preview
                    </Button>
                    <Button size="sm" className="flex-1">
                      <Play className="mr-1 h-3 w-3" />
                      Use Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}