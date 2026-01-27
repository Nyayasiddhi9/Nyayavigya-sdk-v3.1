import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, TrendingUp, Brain, CheckCircle } from 'lucide-react';

interface TrainingJob {
  id: string;
  jobId: string;
  name: string;
  status: string;
  progress: number;
  createdAt: string;
}

export default function GRPOTrainingDashboard() {
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['/api/v9/grpo/training/jobs'],
  });

  const trainingJobs = jobs?.jobs || [];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-500';
      case 'running':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const runningJobs = trainingJobs.filter((j: TrainingJob) => j.status === 'running');
  const completedJobs = trainingJobs.filter((j: TrainingJob) => j.status === 'completed');
  const pendingJobs = trainingJobs.filter((j: TrainingJob) => j.status === 'pending');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-grpo-dashboard">GRPO 2.0 Training Dashboard</h1>
          <p className="text-muted-foreground">Group Relative Policy Optimization & Self-Learning</p>
        </div>
        <Badge variant="outline" className="text-lg">
          <GraduationCap className="w-4 h-4 mr-2" />
          {trainingJobs.length} Jobs
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running Jobs</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{runningJobs.length}</div>
            <p className="text-xs text-muted-foreground">Active training sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedJobs.length}</div>
            <p className="text-xs text-muted-foreground">Successfully trained</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Brain className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingJobs.length}</div>
            <p className="text-xs text-muted-foreground">Queued for training</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active" data-testid="tab-active">Active Training</TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">Completed</TabsTrigger>
          <TabsTrigger value="feedback" data-testid="tab-feedback">Feedback Loop</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">Loading training jobs...</div>
            ) : runningJobs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No active training jobs
              </div>
            ) : (
              runningJobs.map((job: TrainingJob) => (
                <Card key={job.id} data-testid={`card-job-${job.jobId}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{job.name}</span>
                      <Badge variant="outline">{job.status}</Badge>
                    </CardTitle>
                    <CardDescription className="font-mono text-xs">
                      {job.jobId}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{job.progress}%</span>
                      </div>
                      <Progress value={job.progress} className="h-2" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Started:</span>
                      <span className="text-xs">
                        {new Date(job.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="space-y-4">
            {completedJobs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No completed training jobs
              </div>
            ) : (
              completedJobs.map((job: TrainingJob) => (
                <Card key={job.id} data-testid={`card-completed-${job.jobId}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{job.name}</span>
                      <Badge className="bg-green-500">{job.status}</Badge>
                    </CardTitle>
                    <CardDescription className="font-mono text-xs">
                      {job.jobId}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Completed:</span>
                      <span className="text-xs">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feedback Collection Loop</CardTitle>
              <CardDescription>Automated performance feedback and policy optimization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Feedback loop visualization - Coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
