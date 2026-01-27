import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { StatusBadge } from '../enterprise/status-badge';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn, formatNumber, formatDuration } from '../../lib/utils';
import { Bot, Play, Pause, Settings, TrendingUp, Clock, Zap } from 'lucide-react';
import type { Agent } from '@wai/types';

export interface AgentCardProps {
  agent: Agent;
  onExecute?: (agentId: string) => void;
  onToggle?: (agentId: string, enabled: boolean) => void;
  onConfigure?: (agentId: string) => void;
  compact?: boolean;
  loading?: boolean;
  className?: string;
}

const AgentCard = React.forwardRef<HTMLDivElement, AgentCardProps>(
  ({ 
    agent, 
    onExecute, 
    onToggle, 
    onConfigure, 
    compact = false, 
    loading = false, 
    className,
    ...props 
  }, ref) => {
    const isActive = agent.status === 'active';
    const isHealthy = agent.healthStatus.healthy;

    const getTierColor = (tier: string) => {
      const colors = {
        executive: 'bg-purple-100 text-purple-800 border-purple-200',
        development: 'bg-blue-100 text-blue-800 border-blue-200',
        creative: 'bg-pink-100 text-pink-800 border-pink-200',
        qa: 'bg-green-100 text-green-800 border-green-200',
        devops: 'bg-orange-100 text-orange-800 border-orange-200',
        domain: 'bg-gray-100 text-gray-800 border-gray-200',
      };
      return colors[tier as keyof typeof colors] || colors.domain;
    };

    const getRomLevelColor = (level: string) => {
      const colors = {
        L1: 'bg-emerald-100 text-emerald-800',
        L2: 'bg-blue-100 text-blue-800',
        L3: 'bg-amber-100 text-amber-800',
        L4: 'bg-red-100 text-red-800',
      };
      return colors[level as keyof typeof colors] || colors.L1;
    };

    return (
      <Card
        ref={ref}
        className={cn(
          'group transition-all duration-200 hover:shadow-lg hover:scale-[1.02]',
          !isHealthy && 'border-red-200 bg-red-50/50',
          compact && 'p-2',
          loading && 'opacity-50',
          className
        )}
        {...props}
      >
        <CardHeader className={cn('pb-3', compact && 'pb-2')}>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <div className={cn(
                'flex items-center justify-center rounded-full p-2',
                isHealthy ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'
              )}>
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className={cn('text-sm font-medium', compact && 'text-xs')}>
                  {agent.name}
                </CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <StatusBadge 
                    status={agent.status} 
                    size="sm"
                    pulse={agent.status === 'running'}
                  />
                  <Badge 
                    variant="outline" 
                    className={cn('text-xs', getTierColor(agent.tier))}
                  >
                    {agent.tier}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={cn('text-xs', getRomLevelColor(agent.metadata.romLevel))}
                  >
                    {agent.metadata.romLevel}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              {onToggle && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onToggle(agent.id, !isActive)}
                  disabled={loading}
                >
                  {isActive ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
              )}
              {onConfigure && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onConfigure(agent.id)}
                  disabled={loading}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {!compact && (
          <CardContent className="pt-0">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {agent.description}
              </p>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center text-muted-foreground">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Success Rate
                  </div>
                  <div className="font-medium">
                    {(agent.metadata.successRate * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    Avg Response
                  </div>
                  <div className="font-medium">
                    {formatDuration(agent.metadata.avgResponseTime)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center text-muted-foreground">
                    <Zap className="h-3 w-3 mr-1" />
                    Executions
                  </div>
                  <div className="font-medium">
                    {formatNumber(agent.metadata.totalExecutions)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center text-muted-foreground">
                    <Bot className="h-3 w-3 mr-1" />
                    Version
                  </div>
                  <div className="font-medium">
                    {agent.version}
                  </div>
                </div>
              </div>

              {agent.capabilities.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Capabilities</div>
                  <div className="flex flex-wrap gap-1">
                    {agent.capabilities.slice(0, 3).map((capability, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {capability}
                      </Badge>
                    ))}
                    {agent.capabilities.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{agent.capabilities.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {onExecute && (
                <Button
                  onClick={() => onExecute(agent.id)}
                  disabled={!isActive || !isHealthy || loading}
                  className="w-full"
                  size="sm"
                >
                  Execute Agent
                </Button>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    );
  }
);

AgentCard.displayName = 'AgentCard';

export { AgentCard };