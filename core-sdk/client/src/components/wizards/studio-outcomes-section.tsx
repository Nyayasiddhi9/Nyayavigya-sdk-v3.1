/**
 * Studio Outcomes Section Component
 * 
 * Reusable component for displaying "What You'll Create" section across all studios.
 * Provides consistent visual hierarchy, gradients, and responsive layout.
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles, Lightbulb, TrendingUp, FileText, Code, GitBranch, Rocket, Users, Target, Compass, Map, Package, Layout, Palette, GitMerge, CheckCircle, AlertTriangle, BarChart, Repeat, Megaphone, Settings, Cloud, Activity, Shield } from 'lucide-react';
import type { StudioOutcome } from '@/constants/studios/messaging';

// Icon mapping for dynamic icon rendering
const ICON_MAP = {
  Sparkles,
  Lightbulb,
  TrendingUp,
  FileText,
  Code,
  GitBranch,
  Rocket,
  Users,
  Target,
  Compass,
  Map,
  Package,
  Layout,
  Palette,
  GitMerge,
  CheckCircle,
  AlertTriangle,
  BarChart,
  Repeat,
  Megaphone,
  Settings,
  Cloud,
  Activity,
  Shield,
} as const;

interface StudioOutcomesSectionProps {
  outcomes: StudioOutcome[];
  title?: string;
  description?: string;
  showAdvancedDetails?: boolean;
  className?: string;
}

export function StudioOutcomesSection({
  outcomes,
  title = "What You'll Create",
  description = "Our AI agents will help you build these essential foundations for your startup",
  showAdvancedDetails = false,
  className = "",
}: StudioOutcomesSectionProps) {
  return (
    <Card className={`bg-gradient-to-br from-[hsl(217,91%,60%)]/10 to-[hsl(217,91%,60%)]/5 border-[hsl(217,91%,60%)]/30 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Sparkles className="w-5 h-5 text-[hsl(217,91%,60%)]" />
          {title}
        </CardTitle>
        <CardDescription className="text-base">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {outcomes.map((outcome, index) => {
            const IconComponent = ICON_MAP[outcome.icon as keyof typeof ICON_MAP] || Sparkles;
            
            return (
              <div
                key={index}
                className="p-4 bg-[hsl(222,47%,15%)] rounded-lg border border-gray-800 hover:border-gray-700 transition-colors"
                data-testid={`card-outcome-${index}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <IconComponent className="w-4 h-4" style={{ color: outcome.color }} />
                  <h4 className="font-semibold text-sm">{outcome.title}</h4>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {outcome.description}
                </p>
                
                {/* Optional advanced details for power users */}
                {showAdvancedDetails && (
                  <div className="mt-3 pt-3 border-t border-gray-800">
                    <button
                      className="text-xs text-[hsl(217,91%,60%)] hover:underline"
                      data-testid={`button-advanced-details-${index}`}
                    >
                      Show technical details →
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
