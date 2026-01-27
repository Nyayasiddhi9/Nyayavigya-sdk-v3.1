import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Bot, 
  Mic, 
  Video, 
  Globe, 
  Brain, 
  Sparkles, 
  Eye, 
  Zap,
  ArrowRight,
  Play,
  Users,
  Code2,
  Gamepad2,
  PenTool,
  Building,
  Plus,
  Trash2
} from "lucide-react";

interface DemoProject {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  route: string;
  category: string;
  technologies: string[];
  features: string[];
  status: 'live' | 'beta' | 'coming-soon';
  icon: React.ComponentType<any>;
  gradient: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

const demoProjects: DemoProject[] = [
  {
    id: 'ava-demo',
    title: 'AVA Demo - AI Avatar Assistant',
    description: 'Experience hands-free voice conversations with a 3D AI avatar powered by intelligent voice recognition and advanced AI.',
    longDescription: 'The AVA Demo showcases our cutting-edge 3D avatar technology, featuring professional models with realistic human behaviors. Experience seamless voice conversations with intelligent voice recognition, supporting English and 11 Indic languages, and real-time lip synchronization. The system provides natural, intelligent responses with lifelike voice synthesis.',
    route: '/ava-demo',
    category: 'AI Avatar',
    technologies: ['3D Graphics', 'AI Technology', 'Voice Synthesis', 'Speech Recognition', 'Real-time Processing', 'Multilingual Support'],
    features: [
      'Hands-free voice conversation',
      '3D avatar with human behaviors',
      'English + 11 Indic languages support',
      'Real-time lip synchronization',
      'Smart voice recognition',
      'Professional avatar models',
      'Continuous listening mode',
      'Intelligent AI responses'
    ],
    status: 'live',
    icon: Bot,
    gradient: 'from-purple-500 to-pink-500',
    difficulty: 'advanced'
  }
];

const categories = ['All', 'AI Avatar', 'Custom Assistants'];

export default function Demos() {
  const [selectedCategory, setSelectedCategory] = React.useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = React.useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch created assistants
  const { data: createdAssistants, isLoading } = useQuery({
    queryKey: ['/api/builder/assistants'],
    queryFn: () => apiRequest('/api/builder/assistants'),
    staleTime: 30000 // Cache for 30 seconds
  });

  // Delete assistant mutation
  const deleteAssistantMutation = useMutation({
    mutationFn: async (assistantId: string) => {
      return apiRequest(`/api/builder/assistants/${assistantId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: (data, assistantId) => {
      toast({
        title: "Assistant Deleted",
        description: "The AI assistant has been removed successfully.",
      });
      // Invalidate and refetch assistants
      queryClient.invalidateQueries({ queryKey: ['/api/builder/assistants'] });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete the assistant. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Convert created assistants to demo format
  const customAssistantDemos: DemoProject[] = React.useMemo(() => {
    if (!Array.isArray(createdAssistants)) return [];
    
    return createdAssistants.map((assistant: any) => ({
      id: `custom-${assistant.id}`,
      title: assistant.name,
      description: assistant.description,
      longDescription: `Experience ${assistant.name}, a custom AI assistant created with our AI Assistant Builder. This assistant features advanced 3D avatar technology with intelligent voice interactions and personalized responses.`,
      route: `/demo/${assistant.id}`,
      category: 'Custom Assistants',
      technologies: ['3D Graphics', 'AI Technology', 'Voice Synthesis', 'Custom AI Brain'],
      features: [
        'Custom 3D avatar (AVA model)',
        'Personalized AI responses',
        'Voice interaction',
        'Real-time conversations',
        'Custom knowledge base',
        'Professional appearance'
      ],
      status: 'live' as const,
      icon: Brain,
      gradient: 'from-blue-500 to-cyan-500',
      difficulty: 'intermediate' as const
    }));
  }, [createdAssistants]);

  // Combine static and custom demos
  const allProjects = React.useMemo(() => {
    return [...demoProjects, ...customAssistantDemos];
  }, [customAssistantDemos]);

  const filteredProjects = allProjects.filter(project => {
    const categoryMatch = selectedCategory === 'All' || project.category === selectedCategory;
    const difficultyMatch = selectedDifficulty === 'all' || project.difficulty === selectedDifficulty;
    return categoryMatch && difficultyMatch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'beta': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'coming-soon': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500/20 text-green-400';
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-400';
      case 'advanced': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 animate-pulse" />
        <div className="relative max-w-7xl mx-auto px-6 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl">
                <Sparkles className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-white mb-6">
              Platform <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Demos</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Experience our cutting-edge 3D AI Avatar demonstrations including the official AVA Demo 
              and custom AI assistants created with our AI Assistant Builder.
            </p>
            <div className="flex justify-center items-center space-x-4 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>AVA Demo Live</span>
              </div>
              <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4" />
                <span>12 Languages</span>
              </div>
              <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <span>Real-time Voice</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-wrap gap-4 justify-between items-center mb-8">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-400 mr-2">Category:</span>
            {categories.map(category => (
              <Button
                key={category}
                data-testid={`filter-category-${category.toLowerCase().replace(/\s+/g, '-')}`}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={selectedCategory === category ? 
                  "bg-purple-600 hover:bg-purple-700" : 
                  "border-gray-600 text-gray-300 hover:bg-gray-800"
                }
              >
                {category}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-400">Difficulty:</span>
            <select 
              data-testid="select-difficulty"
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="bg-gray-800 border border-gray-600 text-gray-300 text-sm rounded-lg px-3 py-1"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Demo Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project) => {
            const IconComponent = project.icon;
            return (
              <Card key={project.id} data-testid={`demo-card-${project.id}`} className="bg-gray-900/50 border-gray-700 hover:border-purple-500/50 transition-all duration-300 group overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${project.gradient}`} />
                
                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${project.gradient} group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(project.status)}>
                        {project.status.replace('-', ' ')}
                      </Badge>
                      <Badge className={getDifficultyColor(project.difficulty)}>
                        {project.difficulty}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <CardTitle className="text-white text-lg mb-2 group-hover:text-purple-300 transition-colors">
                      {project.title}
                    </CardTitle>
                    <CardDescription className="text-gray-400 text-sm leading-relaxed">
                      {project.description}
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Technologies */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Technologies:</h4>
                    <div className="flex flex-wrap gap-1">
                      {project.technologies.slice(0, 3).map((tech, index) => (
                        <Badge key={index} variant="outline" className="text-xs border-gray-600 text-gray-400">
                          {tech}
                        </Badge>
                      ))}
                      {project.technologies.length > 3 && (
                        <Badge variant="outline" className="text-xs border-gray-600 text-gray-400">
                          +{project.technologies.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Key Features */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Key Features:</h4>
                    <ul className="text-xs text-gray-400 space-y-1">
                      {project.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <div className="w-1 h-1 bg-purple-400 rounded-full mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4">
                    <Link to={project.route} className="flex-1">
                      <Button data-testid={`button-try-demo-${project.id}`} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white group">
                        <Play className="h-4 w-4 mr-2" />
                        Try Demo
                        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                    {/* Delete button only for custom assistants (not AVA demo) */}
                    {project.category === 'Custom Assistants' && (
                      <Button 
                        data-testid={`button-delete-${project.id}`}
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const assistantId = project.id.replace('custom-', '');
                          if (window.confirm(`Are you sure you want to delete "${project.title}"? This action cannot be undone.`)) {
                            deleteAssistantMutation.mutate(assistantId);
                          }
                        }}
                        disabled={deleteAssistantMutation.isPending}
                        className="border-red-500/50 text-red-400 hover:bg-red-500/20 hover:border-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredProjects.length === 0 && (
          <div data-testid="no-demos-message" className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">No demos found</div>
            <p className="text-gray-500">Try adjusting your filters to see more results</p>
          </div>
        )}
      </div>

      {/* Call to Action */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl p-8 text-center border border-purple-500/30">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Build Your Own?</h2>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            These demos showcase just a fraction of what's possible with the WAI DevSphere Platform. 
            Start building your own AI-powered applications today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/software-development">
              <Button data-testid="button-start-building" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                Start Building
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link to="/ai-assistant-builder">
              <Button data-testid="button-create-ai-assistant" variant="outline" className="border-purple-500 text-purple-300 hover:bg-purple-600/20">
                Create AI Assistant
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}