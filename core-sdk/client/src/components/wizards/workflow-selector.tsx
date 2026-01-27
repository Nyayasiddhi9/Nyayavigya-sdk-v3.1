/**
 * Workflow Selector Component
 * 
 * Reusable component for workflow selection with two presentation variants:
 * - Multi-option: Grid of selectable workflow cards (for studios with multiple workflows)
 * - Single-option: Single spotlight CTA (for studios with one workflow)
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, TrendingUp, FileText, Code, Users, Target, Map, Layout, CheckCircle, Megaphone, Settings, Cloud } from 'lucide-react';
import type { StudioWorkflow } from '@/constants/studios/messaging';

// Icon mapping for dynamic icon rendering
const ICON_MAP = {
  Lightbulb,
  TrendingUp,
  FileText,
  Code,
  Users,
  Target,
  Map,
  Layout,
  CheckCircle,
  Megaphone,
  Settings,
  Cloud,
} as const;

interface WorkflowSelectorProps {
  workflows: StudioWorkflow[];
  activeWorkflow?: string;
  onWorkflowChange: (workflowId: string) => void;
  variant?: 'multi' | 'single';
  title?: string;
  description?: string;
}

export function WorkflowSelector({
  workflows,
  activeWorkflow,
  onWorkflowChange,
  variant = 'multi',
  title = "Choose Your Starting Point",
  description = "Pick what you'd like to work on first - you can do all of these at any time",
}: WorkflowSelectorProps) {
  // Single-option variant: Show as spotlight CTA
  if (variant === 'single' && workflows.length === 1) {
    const workflow = workflows[0];
    const IconComponent = ICON_MAP[workflow.icon as keyof typeof ICON_MAP] || Lightbulb;
    
    return (
      <Card className="bg-[hsl(222,47%,15%)] border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconComponent className="w-5 h-5 text-[hsl(217,91%,60%)]" />
            {workflow.title}
          </CardTitle>
          <CardDescription>{workflow.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => onWorkflowChange(workflow.id)}
            className="w-full"
            size="lg"
            data-testid={`button-workflow-${workflow.id}`}
          >
            Get Started
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Multi-option variant: Show as grid of selectable cards
  return (
    <Card className="bg-[hsl(222,47%,15%)] border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-[hsl(45,100%,51%)]" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {workflows.map((workflow) => {
          const IconComponent = ICON_MAP[workflow.icon as keyof typeof ICON_MAP] || Lightbulb;
          const isActive = activeWorkflow === workflow.id;
          
          return (
            <Button
              key={workflow.id}
              variant={isActive ? 'default' : 'outline'}
              className="w-full justify-start text-left h-auto py-3 hover:border-[hsl(217,91%,60%)] transition-colors"
              onClick={() => onWorkflowChange(workflow.id)}
              data-testid={`button-workflow-${workflow.id}`}
              aria-label={workflow.title}
              aria-describedby={`workflow-desc-${workflow.id}`}
            >
              <div className="flex items-start gap-3 w-full">
                <IconComponent className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-semibold">{workflow.title}</div>
                  <div
                    id={`workflow-desc-${workflow.id}`}
                    className="text-xs text-gray-400 font-normal mt-1 leading-relaxed"
                  >
                    {workflow.description}
                  </div>
                </div>
              </div>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
