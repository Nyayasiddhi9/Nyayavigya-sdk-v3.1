import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Lightbulb,
  TrendingUp,
  FileText,
  Palette,
  Code,
  BarChart3,
  Shield,
  Megaphone,
  Rocket,
  Settings,
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock
} from "lucide-react";

interface Studio {
  id: number;
  studioId: string;
  name: string;
  displayName: string;
  description: string;
  icon: string | null;
  color: string | null;
  sequence: number;
  category: string;
  estimatedDays: number;
  dayRange: string | null;
  features: string[];
  deliverables: string[];
  agents: string[];
  dependencies: string[];
  isActive: boolean;
  version: string | null;
}

interface StudioData {
  success: boolean;
  studios: Studio[];
}

const studioIcons: Record<string, React.ReactNode> = {
  'ideation-lab': <Lightbulb className="w-6 h-6" />,
  'market-intelligence': <TrendingUp className="w-6 h-6" />,
  'product-blueprint': <FileText className="w-6 h-6" />,
  'experience-design': <Palette className="w-6 h-6" />,
  'engineering-forge': <Code className="w-6 h-6" />,
  'data-ml-studio': <BarChart3 className="w-6 h-6" />,
  'compliance-shield': <Shield className="w-6 h-6" />,
  'growth-studio': <Megaphone className="w-6 h-6" />,
  'launch-control': <Rocket className="w-6 h-6" />,
  'operations-cockpit': <Settings className="w-6 h-6" />
};

const studioColors: Record<string, string> = {
  'ideation-lab': 'hsl(45, 100%, 51%)', // Yellow
  'market-intelligence': 'hsl(217, 91%, 60%)', // AI Blue
  'product-blueprint': 'hsl(270, 75%, 65%)', // Purple
  'experience-design': 'hsl(340, 82%, 52%)', // Pink
  'engineering-forge': 'hsl(142, 71%, 45%)', // Green
  'data-ml-studio': 'hsl(199, 89%, 48%)', // Cyan
  'compliance-shield': 'hsl(0, 84%, 60%)', // Red
  'growth-studio': 'hsl(38, 92%, 50%)', // Orange
  'launch-control': 'hsl(217, 91%, 60%)', // AI Blue
  'operations-cockpit': 'hsl(220, 13%, 69%)' // Gray
};

export default function Studios() {
  const [_, setLocation] = useLocation();

  const { data, isLoading } = useQuery<StudioData>({
    queryKey: ['/api/wizards/studios'],
    queryFn: async () => {
      const response = await fetch('/api/wizards/studios', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch studios');
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[hsl(222,47%,11%)] text-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.success || !data.studios) {
    return (
      <div className="min-h-screen bg-[hsl(222,47%,11%)] text-gray-50 flex items-center justify-center">
        <Card className="max-w-md bg-[hsl(222,47%,15%)] border-gray-800">
          <CardHeader>
            <CardTitle>Studios Not Available</CardTitle>
            <CardDescription>Unable to load studio information.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const studios = data.studios.sort((a, b) => a.sequence - b.sequence);

  return (
    <div className="min-h-screen bg-[hsl(222,47%,11%)] text-gray-50">
      {/* Header */}
      <div className="border-b border-gray-800 bg-[hsl(222,47%,15%)]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2" data-testid="text-studios-title">
            10 Specialized Studios
          </h1>
          <p className="text-gray-400 text-lg">
            Transform your idea into a production MVP in 14 days with AI-powered assistance
          </p>
        </div>
      </div>

      {/* Studios Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {studios.map((studio) => {
            const icon = studioIcons[studio.studioId] || <Circle className="w-6 h-6" />;
            const color = studioColors[studio.studioId] || 'hsl(217, 91%, 60%)';

            return (
              <Card
                key={studio.id}
                className="bg-[hsl(222,47%,15%)] border-gray-800 hover:border-[hsl(217,91%,60%)]/50 transition-all cursor-pointer group"
                onClick={() => setLocation(`/studios/${studio.studioId}`)}
                data-testid={`card-studio-${studio.studioId}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-3">
                    <div 
                      className="w-14 h-14 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${color}15` }}
                    >
                      <div style={{ color }}>{icon}</div>
                    </div>
                    <Badge variant="outline" className="text-xs" data-testid={`badge-day-range-${studio.studioId}`}>
                      {studio.dayRange || `Day ${studio.sequence}`}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl group-hover:text-[hsl(217,91%,60%)] transition-colors" data-testid={`text-studio-name-${studio.studioId}`}>
                    {studio.displayName || studio.name}
                  </CardTitle>
                  <CardDescription className="text-sm" data-testid={`text-studio-description-${studio.studioId}`}>
                    {studio.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Features */}
                    {studio.features && studio.features.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-gray-400 mb-2">Key Features</div>
                        <div className="flex flex-wrap gap-1">
                          {studio.features.slice(0, 3).map((feature, idx) => (
                            <Badge 
                              key={idx} 
                              variant="secondary" 
                              className="text-xs"
                              data-testid={`badge-feature-${studio.studioId}-${idx}`}
                            >
                              {feature}
                            </Badge>
                          ))}
                          {studio.features.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{studio.features.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Deliverables */}
                    {studio.deliverables && studio.deliverables.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-gray-400 mb-2">Deliverables</div>
                        <div className="space-y-1">
                          {studio.deliverables.slice(0, 2).map((deliverable, idx) => (
                            <div 
                              key={idx} 
                              className="flex items-center gap-2 text-xs text-gray-300"
                              data-testid={`text-deliverable-${studio.studioId}-${idx}`}
                            >
                              <CheckCircle2 className="w-3 h-3 text-[hsl(142,71%,45%)]" />
                              {deliverable}
                            </div>
                          ))}
                          {studio.deliverables.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{studio.deliverables.length - 2} more deliverables
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Agents */}
                    {studio.agents && studio.agents.length > 0 && (
                      <div className="pt-3 border-t border-gray-800">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">{studio.agents.length} AI Agents</span>
                          <span className="text-[hsl(217,91%,60%)] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                            View Studio
                            <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
