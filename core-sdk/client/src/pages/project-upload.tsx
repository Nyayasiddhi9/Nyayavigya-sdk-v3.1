import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { AnimatedCard } from '@/components/react-bits/animated-card';
import { SplitText } from '@/components/react-bits/split-text';
import { apiRequest } from '@/lib/queryClient';

interface FileWithPreview extends File {
  preview?: string;
}

export default function ProjectUpload() {
  const [, setLocation] = useLocation();
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<FileWithPreview[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createProjectMutation = useMutation({
    mutationFn: async (projectData: any) => {
      return await apiRequest('POST', '/api/projects', projectData);
    },
    onSuccess: (project) => {
      toast({
        title: 'Project Created',
        description: 'Your project has been created successfully.',
      });
      return project;
    }
  });

  const uploadFilesMutation = useMutation({
    mutationFn: async ({ projectId, files, projectName }: { projectId: number; files: File[]; projectName: string }) => {
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      formData.append('projectName', projectName);

      const response = await fetch(`/api/projects/${projectId}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Files Analyzed',
        description: 'Your files have been uploaded and analyzed successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      setLocation(`/workspace/${data.files[0].projectId}`);
    },
    onError: () => {
      toast({
        title: 'Upload Failed',
        description: 'There was an error uploading your files.',
        variant: 'destructive',
      });
    }
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const filesWithPreview = acceptedFiles.map(file => Object.assign(file, {
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }));
    
    setUploadedFiles(prev => [...prev, ...filesWithPreview]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.svg'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'application/json': ['.json'],
      'application/javascript': ['.js'],
      'text/javascript': ['.js'],
      'application/typescript': ['.ts'],
      'text/html': ['.html'],
      'text/css': ['.css']
    },
    maxSize: 50 * 1024 * 1024 // 50MB
  });

  const removeFile = (fileToRemove: FileWithPreview) => {
    setUploadedFiles(files => files.filter(file => file !== fileToRemove));
    if (fileToRemove.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
  };

  const handleSubmit = async () => {
    if (!projectName.trim()) {
      toast({
        title: 'Project Name Required',
        description: 'Please enter a project name.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Create project first
      const project = await createProjectMutation.mutateAsync({
        name: projectName,
        description: projectDescription
      });

      // Upload files if any
      if (uploadedFiles.length > 0) {
        await uploadFilesMutation.mutateAsync({
          projectId: project.id,
          files: uploadedFiles,
          projectName
        });
      } else {
        // No files, just go to workspace
        setLocation(`/workspace/${project.id}`);
      }
    } catch (error) {
      console.error('Project creation failed:', error);
    }
  };

  const isLoading = createProjectMutation.isPending || uploadFilesMutation.isPending;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Navigation */}
      <nav className="border-b border-slate-800 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-500 rounded-lg flex items-center justify-center">
              <i className="fas fa-code text-white text-sm"></i>
            </div>
            <h1 className="text-xl font-bold">WAI Platform</h1>
          </div>
          <Button variant="ghost" onClick={() => setLocation('/')}>
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Dashboard
          </Button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center mb-12">
          <SplitText 
            text="Start Your Project"
            className="text-4xl font-bold mb-4 text-white"
          />
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Upload your requirements, designs, or describe your vision. Our AI agents will handle the rest.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Upload Area */}
          <div className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Project Name *
                  </label>
                  <Input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Enter your project name"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description (Optional)
                  </label>
                  <Textarea
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Describe your project vision, requirements, or paste your PRD content here..."
                    className="bg-slate-700 border-slate-600 text-white h-32"
                  />
                </div>
              </CardContent>
            </Card>

            {/* File Upload */}
            <AnimatedCard className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Upload Files</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer ${
                    isDragActive 
                      ? 'border-primary-500 bg-primary-500/10' 
                      : 'border-slate-600 hover:border-primary-500'
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="w-16 h-16 bg-primary-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-cloud-upload text-primary-400 text-2xl"></i>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">
                    {isDragActive ? 'Drop files here' : 'Drop files or click to upload'}
                  </h3>
                  <p className="text-slate-400 mb-4">Support for PRD, BRD, Figma files, images, and documents</p>
                  <Button variant="outline" className="border-primary-500 text-primary-400 hover:bg-primary-500 hover:text-white">
                    Choose Files
                  </Button>
                </div>

                {/* Quick Templates */}
                <div className="mt-6">
                  <p className="text-sm text-slate-400 mb-3">Quick start templates:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { icon: 'fas fa-shopping-cart', text: 'E-commerce Platform' },
                      { icon: 'fas fa-mobile-alt', text: 'Mobile App' },
                      { icon: 'fas fa-chart-line', text: 'Analytics Dashboard' },
                      { icon: 'fas fa-rocket', text: 'SaaS Platform' }
                    ].map((template, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-slate-300 border-slate-600 hover:border-slate-500"
                        onClick={() => setProjectDescription(`${template.text} - ${projectDescription}`)}
                      >
                        <i className={`${template.icon} mr-2`}></i>
                        {template.text}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </AnimatedCard>

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Uploaded Files ({uploadedFiles.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {file.preview ? (
                            <img src={file.preview} alt={file.name} className="w-10 h-10 rounded object-cover" />
                          ) : (
                            <div className="w-10 h-10 bg-blue-500/20 rounded flex items-center justify-center">
                              <i className="fas fa-file text-blue-400"></i>
                            </div>
                          )}
                          <div>
                            <div className="text-white font-medium">{file.name}</div>
                            <div className="text-slate-400 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <i className="fas fa-trash"></i>
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Project Preview */}
          <div className="space-y-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Supported Inputs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: 'fas fa-file-alt', title: 'Documents', desc: 'PRD, BRD, specifications', color: 'blue' },
                    { icon: 'fas fa-paint-brush', title: 'Design Files', desc: 'Figma, Sketch, Adobe XD', color: 'purple' },
                    { icon: 'fas fa-image', title: 'Screenshots', desc: 'UI references, mockups', color: 'green' },
                    { icon: 'fas fa-code', title: 'Code', desc: 'Existing codebase, APIs', color: 'orange' }
                  ].map((type, index) => (
                    <div key={index} className="p-4 bg-slate-700/50 rounded-xl">
                      <div className="flex items-center space-x-3 mb-2">
                        <i className={`${type.icon} text-${type.color}-400`}></i>
                        <span className="font-medium text-white">{type.title}</span>
                      </div>
                      <p className="text-sm text-slate-400">{type.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">What Happens Next?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { step: 1, title: 'Document Analysis', desc: 'AI agents analyze your requirements and extract key information' },
                    { step: 2, title: 'Architecture Planning', desc: 'CTO and Architect agents design the technical foundation' },
                    { step: 3, title: 'Agent Orchestration', desc: '28 specialized agents collaborate on development tasks' },
                    { step: 4, title: 'Real-time Development', desc: 'Watch your application come to life with live previews' },
                    { step: 5, title: 'Quality Assurance', desc: 'Automated testing and quality validation' },
                    { step: 6, title: 'Deployment', desc: 'One-click deployment to your preferred cloud platform' }
                  ].map((item) => (
                    <div key={item.step} className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {item.step}
                      </div>
                      <div>
                        <div className="text-white font-medium">{item.title}</div>
                        <div className="text-slate-400 text-sm">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {isLoading && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
                      <i className="fas fa-cog fa-spin text-primary-400 text-xl"></i>
                    </div>
                    <div>
                      <div className="text-white font-medium mb-2">Processing Your Project</div>
                      <Progress value={uploadProgress} className="w-full" />
                      <div className="text-slate-400 text-sm mt-2">
                        {uploadProgress < 30 ? 'Creating project...' :
                         uploadProgress < 60 ? 'Analyzing files...' :
                         uploadProgress < 90 ? 'Initializing agents...' :
                         'Almost ready...'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center mt-12">
          <Button
            onClick={handleSubmit}
            disabled={!projectName.trim() || isLoading}
            className="px-8 py-4 wai-gradient text-white font-semibold rounded-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <i className="fas fa-wand-magic-sparkles mr-2"></i>
            {isLoading ? 'Processing...' : 'Initialize WAI Orchestration'}
          </Button>
        </div>
      </div>
    </div>
  );
}
