import { Badge } from '@/components/ui/badge';
import { Activity, AlertCircle, CheckCircle2, Clock, Zap } from 'lucide-react';

interface OrchestrationStatus {
  version: string;
  status: 'active' | 'degraded' | 'error' | 'initializing' | 'maintenance';
  agentCount: number;
  llmProviders: number;
  activeRequests: number;
  avgResponseTime: number;
  costEfficiency: number;
  lastUpdate: string;
}

interface OrchestrationStatusBadgeProps {
  status: OrchestrationStatus;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  onClick?: () => void;
}

export default function OrchestrationStatusBadge({ 
  status, 
  size = 'md',
  showDetails = true,
  onClick
}: OrchestrationStatusBadgeProps) {
  const getStatusIcon = (statusType: string) => {
    switch (statusType) {
      case 'active': return <CheckCircle2 className="h-3 w-3 text-green-500" />;
      case 'degraded': return <AlertCircle className="h-3 w-3 text-yellow-500" />;
      case 'error': return <AlertCircle className="h-3 w-3 text-red-500" />;
      case 'initializing': return <Clock className="h-3 w-3 text-blue-500" />;
      case 'maintenance': return <Activity className="h-3 w-3 text-purple-500" />;
      default: return <Activity className="h-3 w-3 text-gray-500" />;
    }
  };

  const getStatusColor = (statusType: string) => {
    switch (statusType) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200';
      case 'degraded': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200';
      case 'initializing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200';
      case 'maintenance': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-200';
    }
  };

  const getSizeClasses = (sizeType: string) => {
    switch (sizeType) {
      case 'sm': return 'text-xs px-2 py-1';
      case 'lg': return 'text-sm px-4 py-2';
      default: return 'text-xs px-3 py-1.5';
    }
  };

  const getPerformanceIndicator = () => {
    if (status.avgResponseTime > 1000) return '🔴';
    if (status.avgResponseTime > 500) return '🟡';
    return '🟢';
  };

  const getCostIndicator = () => {
    if (status.costEfficiency > 80) return '💚';
    if (status.costEfficiency > 60) return '💛';
    return '💔';
  };

  return (
    <div 
      className={`inline-flex items-center gap-2 ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
      onClick={onClick}
      data-testid="orchestration-status-badge"
    >
      <Badge 
        className={`${getStatusColor(status.status)} ${getSizeClasses(size)} flex items-center gap-1 border`}
        data-testid="status-badge-main"
      >
        {getStatusIcon(status.status)}
        <span data-testid="status-version">WAI {status.version}</span>
        <span data-testid="status-text" className="capitalize">
          {status.status}
        </span>
      </Badge>

      {showDetails && (
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="text-xs" data-testid="badge-agent-count">
            <Activity className="h-3 w-3 mr-1" />
            {status.agentCount} agents
          </Badge>
          
          <Badge variant="outline" className="text-xs" data-testid="badge-llm-providers">
            <Zap className="h-3 w-3 mr-1" />
            {status.llmProviders}+ LLMs
          </Badge>
          
          {status.activeRequests > 0 && (
            <Badge variant="outline" className="text-xs" data-testid="badge-active-requests">
              <Clock className="h-3 w-3 mr-1" />
              {status.activeRequests} active
            </Badge>
          )}
          
          <div className="flex items-center gap-1 text-xs">
            <span title={`Response Time: ${status.avgResponseTime}ms`} data-testid="indicator-performance">
              {getPerformanceIndicator()}
            </span>
            <span title={`Cost Efficiency: ${status.costEfficiency}%`} data-testid="indicator-cost">
              {getCostIndicator()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}