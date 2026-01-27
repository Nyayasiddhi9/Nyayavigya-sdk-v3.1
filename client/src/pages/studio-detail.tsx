import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Code,
  FileText,
  Sparkles,
  AlertCircle,
  Download
} from "lucide-react";

interface StudioSession {
  id: number;
  startupId: number;
  studioId: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  currentStep: number;
  totalSteps: number;
  progress: number;
  agentsUsed: string[];
  creditsConsumed: number;
}

interface StudioTask {
  id: number;
  sessionId: number;
  taskType: string;
  taskName: string;
  taskDescription: string | null;
  assignedAgents: string[];
  status: string;
  priority: string | null;
  startedAt: string | null;
  completedAt: string | null;
  duration: number | null;
  creditsUsed: number;
}

interface StudioDeliverable {
  id: number;
  sessionId: number;
  deliverableType: string;
  deliverableName: string;
  content: string | null;
  contentType: string | null;
  fileUrl: string | null;
  version: string | null;
  qualityScore: number | null;
  isApproved: boolean | null;
}

interface StudioDetailData {
  success: boolean;
  studio: {
    id: number;
    studioId: string;
    name: string;
    displayName: string;
    description: string;
    sequence: number;
    category: string;
    estimatedDays: number;
    dayRange: string | null;
    features: string[];
    deliverables: string[];
    agents: string[];
  };
  sessions: StudioSession[];
  tasks: StudioTask[];
  deliverables: StudioDeliverable[];
}

const statusColors: Record<string, string> = {
  'not_started': 'bg-gray-500',
  'in_progress': 'bg-[hsl(217,91%,60%)]',
  'completed': 'bg-[hsl(142,71%,45%)]',
  'failed': 'bg-[hsl(0,84%,60%)]',
  'pending': 'bg-gray-500',
};

const statusIcons: Record<string, React.ReactNode> = {
  'not_started': <Clock className="w-4 h-4" />,
  'in_progress': <Sparkles className="w-4 h-4" />,
  'completed': <CheckCircle2 className="w-4 h-4" />,
  'failed': <AlertCircle className="w-4 h-4" />,
  'pending': <Clock className="w-4 h-4" />,
};

export default function StudioDetail() {
  const [match, params] = useRoute("/studios/:studioId");
  const studioId = params?.studioId;

  const { data, isLoading } = useQuery<StudioDetailData>({
    queryKey: ['/api/wizards/studios', studioId, 'detail'],
    queryFn: async () => {
      const response = await fetch(`/api/wizards/studios/${studioId}/detail`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch studio details');
      }
      return response.json();
    },
    enabled: !!studioId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[hsl(222,47%,11%)] text-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.success || !data.studio) {
    return (
      <div className="min-h-screen bg-[hsl(222,47%,11%)] text-gray-50 flex items-center justify-center">
        <Card className="max-w-md bg-[hsl(222,47%,15%)] border-gray-800">
          <CardHeader>
            <CardTitle>Studio Not Found</CardTitle>
            <CardDescription>Unable to load studio details.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/studios">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Studios
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { studio, sessions = [], tasks = [], deliverables = [] } = data;
  const activeSessions = sessions.filter(s => s.status === 'in_progress').length;
  const completedSessions = sessions.filter(s => s.status === 'completed').length;

  return (
    <div className="min-h-screen bg-[hsl(222,47%,11%)] text-gray-50">
      {/* Header */}
      <div className="border-b border-gray-800 bg-[hsl(222,47%,15%)]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Button asChild variant="ghost" className="mb-4" data-testid="button-back-studios">
            <Link to="/studios">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Studios
            </Link>
          </Button>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold tracking-tight mb-2" data-testid="text-studio-name">
                {studio.displayName || studio.name}
              </h1>
              <p className="text-gray-400 text-lg mb-4">{studio.description}</p>
              <div className="flex items-center gap-4 flex-wrap">
                <Badge variant="outline" data-testid="badge-day-range">
                  {studio.dayRange || `Day ${studio.sequence}`}
                </Badge>
                <Badge variant="outline" data-testid="badge-agents-count">
                  {studio.agents.length} AI Agents
                </Badge>
                <Badge variant="outline" data-testid="badge-category">
                  {studio.category}
                </Badge>
              </div>
            </div>
            <div>
              {studio.studioId === 'ideation-lab' && (
                <Button asChild size="lg" data-testid="button-launch-studio">
                  <Link to="/studios/ideation-lab/work">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Launch Studio
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-[hsl(222,47%,15%)] border-gray-800" data-testid="card-sessions-stats">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">Total Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-mono font-bold text-[hsl(217,91%,60%)]" data-testid="text-total-sessions">
                {sessions.length}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {activeSessions} active, {completedSessions} completed
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[hsl(222,47%,15%)] border-gray-800" data-testid="card-tasks-stats">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">Studio Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-mono font-bold text-[hsl(270,75%,65%)]" data-testid="text-total-tasks">
                {tasks.length}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {tasks.filter(t => t.status === 'completed').length} completed
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[hsl(222,47%,15%)] border-gray-800" data-testid="card-deliverables-stats">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400">Deliverables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-mono font-bold text-[hsl(142,71%,45%)]" data-testid="text-total-deliverables">
                {deliverables.length}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {deliverables.filter(d => d.isApproved).length} approved
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Sessions, Tasks, Deliverables */}
        <Tabs defaultValue="sessions" className="space-y-6">
          <TabsList className="bg-[hsl(222,47%,15%)]" data-testid="tabs-list">
            <TabsTrigger value="sessions" data-testid="tab-sessions">Sessions</TabsTrigger>
            <TabsTrigger value="tasks" data-testid="tab-tasks">Tasks</TabsTrigger>
            <TabsTrigger value="deliverables" data-testid="tab-deliverables">Deliverables</TabsTrigger>
          </TabsList>

          <TabsContent value="sessions" className="space-y-4">
            {sessions.length === 0 ? (
              <Card className="bg-[hsl(222,47%,15%)] border-gray-800">
                <CardContent className="pt-12 pb-12 text-center">
                  <p className="text-gray-400">No sessions yet for this studio.</p>
                </CardContent>
              </Card>
            ) : (
              sessions.map((session) => (
                <Card key={session.id} className="bg-[hsl(222,47%,15%)] border-gray-800" data-testid={`card-session-${session.id}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${statusColors[session.status] || 'bg-gray-500'}`} />
                        <CardTitle className="text-lg">Session #{session.id}</CardTitle>
                        <Badge variant="outline" className="text-xs" data-testid={`badge-session-status-${session.id}`}>
                          {session.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        Step {session.currentStep} of {session.totalSteps}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-400">Progress</span>
                          <span className="text-sm font-mono" data-testid={`text-session-progress-${session.id}`}>
                            {session.progress || 0}%
                          </span>
                        </div>
                        <Progress value={session.progress || 0} className="h-2" />
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Agents Used:</span>
                          <span className="ml-2 font-medium">{session.agentsUsed?.length || 0}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Credits:</span>
                          <span className="ml-2 font-medium">{session.creditsConsumed || 0}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            {tasks.length === 0 ? (
              <Card className="bg-[hsl(222,47%,15%)] border-gray-800">
                <CardContent className="pt-12 pb-12 text-center">
                  <p className="text-gray-400">No tasks yet for this studio.</p>
                </CardContent>
              </Card>
            ) : (
              tasks.map((task) => (
                <Card key={task.id} className="bg-[hsl(222,47%,15%)] border-gray-800" data-testid={`card-task-${task.id}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {statusIcons[task.status] || <Clock className="w-4 h-4" />}
                        <CardTitle className="text-lg" data-testid={`text-task-name-${task.id}`}>{task.taskName}</CardTitle>
                        <Badge variant="outline" className="text-xs" data-testid={`badge-task-status-${task.id}`}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                        {task.priority && (
                          <Badge variant="secondary" className="text-xs">
                            {task.priority}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {task.taskDescription && (
                      <CardDescription>{task.taskDescription}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6 text-sm text-gray-400">
                      <div>Agents: {task.assignedAgents?.length || 0}</div>
                      <div>Credits: {task.creditsUsed || 0}</div>
                      {task.duration && <div>Duration: {task.duration}s</div>}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="deliverables" className="space-y-4">
            {deliverables.length === 0 ? (
              <Card className="bg-[hsl(222,47%,15%)] border-gray-800">
                <CardContent className="pt-12 pb-12 text-center">
                  <p className="text-gray-400">No deliverables yet for this studio.</p>
                </CardContent>
              </Card>
            ) : (
              deliverables.map((deliverable) => (
                <Card key={deliverable.id} className="bg-[hsl(222,47%,15%)] border-gray-800" data-testid={`card-deliverable-${deliverable.id}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-[hsl(217,91%,60%)]" />
                        <CardTitle className="text-lg" data-testid={`text-deliverable-name-${deliverable.id}`}>
                          {deliverable.deliverableName}
                        </CardTitle>
                        <Badge variant="outline" className="text-xs" data-testid={`badge-deliverable-type-${deliverable.id}`}>
                          {deliverable.deliverableType}
                        </Badge>
                        {deliverable.isApproved && (
                          <Badge className="text-xs bg-[hsl(142,71%,45%)]">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Approved
                          </Badge>
                        )}
                      </div>
                      {deliverable.fileUrl && (
                        <Button size="sm" variant="outline" asChild data-testid={`button-download-${deliverable.id}`}>
                          <a href={deliverable.fileUrl} download>
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {deliverable.content && (
                        <div className="bg-[hsl(222,47%,20%)] rounded-lg p-4">
                          <pre className="text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto">
                            {deliverable.content.substring(0, 200)}
                            {deliverable.content.length > 200 && '...'}
                          </pre>
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        {deliverable.version && <div>Version: {deliverable.version}</div>}
                        {deliverable.qualityScore && (
                          <div>Quality Score: {deliverable.qualityScore}/100</div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
