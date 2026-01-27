import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle2, AlertCircle, Play } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  estimatedTime: string;
  agent?: string;
  timestamp: string;
}

interface TaskTimelineProps {
  tasks: Task[];
  title?: string;
  showProgress?: boolean;
}

export default function TaskTimeline({ 
  tasks, 
  title = 'Task Progress',
  showProgress = true 
}: TaskTimelineProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'in_progress': return <Play className="h-4 w-4 text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const overallProgress = tasks.length > 0 ? (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100 : 0;

  return (
    <Card data-testid="card-task-timeline">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle data-testid="timeline-title">{title}</CardTitle>
          {showProgress && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600" data-testid="timeline-progress-text">
                {Math.round(overallProgress)}% Complete
              </span>
              <Progress value={overallProgress} className="w-24" data-testid="timeline-progress-bar" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-4 p-4 rounded-lg border bg-gray-50 dark:bg-gray-800"
              data-testid={`task-item-${task.id}`}
            >
              <div className="flex-shrink-0 mt-1" data-testid={`task-status-icon-${task.id}`}>
                {getStatusIcon(task.status)}
              </div>
              
              <div className="flex-grow min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100" data-testid={`task-title-${task.id}`}>
                      {task.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1" data-testid={`task-description-${task.id}`}>
                      {task.description}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={`${getStatusColor(task.status)} text-xs`} data-testid={`task-status-badge-${task.id}`}>
                      {task.status.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-gray-500" data-testid={`task-time-${task.id}`}>
                      {task.estimatedTime}
                    </span>
                  </div>
                </div>
                
                {task.status === 'in_progress' && (
                  <div className="mt-3">
                    <Progress value={task.progress} className="h-2" data-testid={`task-progress-${task.id}`} />
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-500" data-testid={`task-progress-text-${task.id}`}>
                        {task.progress}% complete
                      </span>
                      {task.agent && (
                        <span className="text-xs text-blue-600" data-testid={`task-agent-${task.id}`}>
                          {task.agent}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-gray-400 mt-2" data-testid={`task-timestamp-${task.id}`}>
                  {task.timestamp}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}