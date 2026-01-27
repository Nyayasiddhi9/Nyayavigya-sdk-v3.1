import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Plus, Search, Filter, MoreHorizontal, Clock, AlertCircle,
  CheckCircle, Circle, Play, Pause, User, Code2, TestTube,
  Settings, Zap, ArrowRight, Calendar, MessageCircle,
  Paperclip, Target, TrendingUp, Users, Bot, ChevronDown,
  Drag, Eye, Edit3, Trash2, Copy, Share, Bug, GitBranch
} from 'lucide-react';

interface ProjectTask {
  id: string;
  title: string;
  description: string;
  status: 'backlog' | 'in_progress' | 'review' | 'testing' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedAgent: {
    id: string;
    name: string;
    type: string;
    avatar?: string;
    status: 'active' | 'idle' | 'working';
    efficiency: number;
  };
  estimatedHours: number;
  actualHours: number;
  progress: number;
  phase: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  tags: string[];
  dependencies: string[];
  blockers: string[];
  metrics: {
    codeLines?: number;
    testsWritten?: number;
    bugsFound?: number;
    reviewComments?: number;
  };
  comments: number;
  attachments: number;
}

interface KanbanColumn {
  id: string;
  name: string;
  color: string;
  taskLimit?: number;
  tasks: ProjectTask[];
}

export function KanbanBoard({ projectId }: { projectId: number }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAgent, setFilterAgent] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  // Fetch project board data
  const { data: boardData, isLoading } = useQuery({
    queryKey: ['/api/project-boards', projectId],
    initialData: {
      columns: [
        { id: 'backlog', name: 'Backlog', color: 'bg-gray-100', tasks: [] },
        { id: 'in_progress', name: 'In Progress', color: 'bg-blue-100', taskLimit: 5, tasks: [] },
        { id: 'review', name: 'Code Review', color: 'bg-yellow-100', tasks: [] },
        { id: 'testing', name: 'Testing', color: 'bg-purple-100', tasks: [] },
        { id: 'done', name: 'Done', color: 'bg-green-100', tasks: [] }
      ]
    }
  });

  // Move task mutation
  const moveTaskMutation = useMutation({
    mutationFn: ({ taskId, newStatus }: { taskId: string; newStatus: string }) =>
      apiRequest(`/api/tasks/${taskId}/move`, 'PATCH', { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/project-boards', projectId] });
      toast({
        title: "Task Moved",
        description: "Task status updated successfully."
      });
    }
  });

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-gray-500',
      medium: 'bg-blue-500',
      high: 'bg-orange-500',
      critical: 'bg-red-500'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      backlog: Circle,
      in_progress: Play,
      review: Eye,
      testing: TestTube,
      done: CheckCircle,
      blocked: AlertCircle
    };
    const Icon = icons[status as keyof typeof icons] || Circle;
    return Icon;
  };

  const getPhaseColor = (phase: string) => {
    const colors = {
      requirements: 'bg-blue-100 text-blue-800',
      design: 'bg-purple-100 text-purple-800',
      development: 'bg-green-100 text-green-800',
      testing: 'bg-yellow-100 text-yellow-800',
      deployment: 'bg-red-100 text-red-800',
      maintenance: 'bg-gray-100 text-gray-800'
    };
    return colors[phase as keyof typeof colors] || colors.development;
  };

  const TaskCard = ({ task }: { task: ProjectTask }) => {
    const StatusIcon = getStatusIcon(task.status);
    
    return (
      <Card 
        className="group cursor-move hover:shadow-md transition-all duration-200 border-l-4"
        style={{ borderLeftColor: getPriorityColor(task.priority) }}
        onClick={() => setSelectedTask(task)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <StatusIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <CardTitle className="text-sm font-medium truncate">
                {task.title}
              </CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <Badge className={`text-xs px-1.5 py-0.5 ${getPhaseColor(task.phase)}`}>
                {task.phase}
              </Badge>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </div>
          </div>
          {task.description && (
            <CardDescription className="text-xs line-clamp-2">
              {task.description}
            </CardDescription>
          )}
        </CardHeader>
        
        <CardContent className="pt-0 space-y-3">
          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{task.progress}%</span>
            </div>
            <Progress value={task.progress} className="h-1.5" />
          </div>

          {/* Agent Assignment */}
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={task.assignedAgent.avatar} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {task.assignedAgent.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{task.assignedAgent.name}</p>
              <p className="text-xs text-muted-foreground truncate">{task.assignedAgent.type}</p>
            </div>
            <div className={`w-2 h-2 rounded-full ${
              task.assignedAgent.status === 'working' 
                ? 'bg-green-500' 
                : task.assignedAgent.status === 'active'
                  ? 'bg-yellow-500'
                  : 'bg-gray-300'
            }`} />
          </div>

          {/* Time Tracking */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">
                {task.actualHours}h / {task.estimatedHours}h
              </span>
            </div>
            {task.dueDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {new Date(task.dueDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Code Metrics */}
          {(task.metrics.codeLines || task.metrics.testsWritten || task.metrics.bugsFound) && (
            <div className="flex items-center gap-3 text-xs">
              {task.metrics.codeLines && (
                <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                  <Code2 className="h-3 w-3 mr-1" />
                  {task.metrics.codeLines}
                </Badge>
              )}
              {task.metrics.testsWritten && (
                <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                  <TestTube className="h-3 w-3 mr-1" />
                  {task.metrics.testsWritten}
                </Badge>
              )}
              {task.metrics.bugsFound && (
                <Badge variant="outline" className="text-xs px-1.5 py-0.5 text-red-600 border-red-200">
                  <Bug className="h-3 w-3 mr-1" />
                  {task.metrics.bugsFound}
                </Badge>
              )}
            </div>
          )}

          {/* Dependencies & Blockers */}
          {(task.dependencies.length > 0 || task.blockers.length > 0) && (
            <div className="flex items-center gap-2">
              {task.dependencies.length > 0 && (
                <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                  <GitBranch className="h-3 w-3 mr-1" />
                  {task.dependencies.length} deps
                </Badge>
              )}
              {task.blockers.length > 0 && (
                <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {task.blockers.length} blocked
                </Badge>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              {task.tags.slice(0, 2).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs px-1.5 py-0.5">
                  {tag}
                </Badge>
              ))}
              {task.tags.length > 2 && (
                <span className="text-xs text-muted-foreground">
                  +{task.tags.length - 2}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {task.comments > 0 && (
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  {task.comments}
                </div>
              )}
              {task.attachments > 0 && (
                <div className="flex items-center gap-1">
                  <Paperclip className="h-3 w-3" />
                  {task.attachments}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const KanbanColumn = ({ column }: { column: KanbanColumn }) => (
    <div className="flex flex-col min-h-[500px]">
      <div className={`rounded-t-lg p-3 ${column.color} border-b`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{column.name}</h3>
            <Badge variant="secondary" className="text-xs">
              {column.tasks.length}
              {column.taskLimit && ` / ${column.taskLimit}`}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 p-3 space-y-3 bg-gray-50/50">
        {column.tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
        
        {column.tasks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Circle className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No tasks yet</p>
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-5 gap-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Project Kanban Board</h2>
          <p className="text-muted-foreground mt-1">
            Manage tasks with AI agents across the SDLC lifecycle
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterAgent} onValueChange={setFilterAgent}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by agent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agents</SelectItem>
            <SelectItem value="frontend">Frontend Developer</SelectItem>
            <SelectItem value="backend">Backend Developer</SelectItem>
            <SelectItem value="qa">QA Engineer</SelectItem>
            <SelectItem value="devops">DevOps Engineer</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-5 gap-4 overflow-x-auto min-h-[600px]">
        {boardData.columns.map((column: KanbanColumn) => (
          <KanbanColumn key={column.id} column={column} />
        ))}
      </div>

      {/* Task Detail Modal */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTask && getStatusIcon(selectedTask.status) && (
                React.createElement(getStatusIcon(selectedTask.status), { className: "h-5 w-5" })
              )}
              {selectedTask?.title}
            </DialogTitle>
            <DialogDescription>
              Task details and agent coordination
            </DialogDescription>
          </DialogHeader>
          
          {selectedTask && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Assigned Agent</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {selectedTask.assignedAgent.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{selectedTask.assignedAgent.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedTask.assignedAgent.type}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">Progress</p>
                  <Progress value={selectedTask.progress} className="mt-1" />
                  <p className="text-xs text-muted-foreground mt-1">{selectedTask.progress}% complete</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium">Description</p>
                <p className="text-sm text-muted-foreground mt-1">{selectedTask.description}</p>
              </div>
              
              {/* Additional task details would go here */}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}