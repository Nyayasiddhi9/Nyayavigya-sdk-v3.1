import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Activity, Bot, Zap, Brain, Code, Palette } from 'lucide-react';

interface AgentActivity {
  id: string;
  agentName: string;
  agentType: 'executive' | 'development' | 'creative' | 'qa' | 'devops' | 'domain';
  action: string;
  status: 'active' | 'completed' | 'waiting' | 'error';
  timestamp: string;
  duration?: string;
  progress?: number;
}

interface AgentActivityFeedProps {
  activities: AgentActivity[];
  title?: string;
  maxItems?: number;
  showLiveUpdates?: boolean;
}

export default function AgentActivityFeed({ 
  activities, 
  title = 'Agent Activity',
  maxItems = 10,
  showLiveUpdates = true
}: AgentActivityFeedProps) {
  const getAgentIcon = (type: string) => {
    switch (type) {
      case 'executive': return Bot;
      case 'development': return Code;
      case 'creative': return Palette;
      case 'qa': return Zap;
      case 'devops': return Activity;
      case 'domain': return Brain;
      default: return Bot;
    }
  };

  const getAgentColor = (type: string) => {
    switch (type) {
      case 'executive': return 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-300';
      case 'development': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300';
      case 'creative': return 'text-pink-600 bg-pink-100 dark:bg-pink-900 dark:text-pink-300';
      case 'qa': return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
      case 'devops': return 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-300';
      case 'domain': return 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900 dark:text-indigo-300';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'waiting': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const displayActivities = activities.slice(0, maxItems);

  return (
    <Card data-testid="card-agent-activity-feed">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle data-testid="activity-feed-title">{title}</CardTitle>
            {showLiveUpdates && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" data-testid="live-update-indicator" />
                <span className="text-xs text-gray-500">Live</span>
              </div>
            )}
          </div>
          <Badge variant="outline" className="text-xs" data-testid="activity-count-badge">
            {activities.length} activities
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayActivities.map((activity, index) => {
            const AgentIcon = getAgentIcon(activity.agentType);
            
            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-start gap-3 p-3 rounded-lg border-l-4 border-l-blue-500 bg-gray-50 dark:bg-gray-800"
                data-testid={`activity-item-${activity.id}`}
              >
                <Avatar className="w-8 h-8" data-testid={`activity-avatar-${activity.id}`}>
                  <AvatarFallback className={`${getAgentColor(activity.agentType)} text-xs`}>
                    <AgentIcon className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-grow min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm" data-testid={`activity-agent-name-${activity.id}`}>
                          {activity.agentName}
                        </span>
                        <Badge variant="outline" className="text-xs" data-testid={`activity-agent-type-${activity.id}`}>
                          {activity.agentType}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1" data-testid={`activity-action-${activity.id}`}>
                        {activity.action}
                      </p>
                    </div>
                    
                    <Badge className={`${getStatusColor(activity.status)} text-xs`} data-testid={`activity-status-${activity.id}`}>
                      {activity.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500" data-testid={`activity-timestamp-${activity.id}`}>
                      {activity.timestamp}
                    </span>
                    {activity.duration && (
                      <span className="text-xs text-gray-500" data-testid={`activity-duration-${activity.id}`}>
                        {activity.duration}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}