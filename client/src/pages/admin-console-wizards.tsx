import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Users, Calendar, FileText, TrendingUp, CheckCircle, XCircle, Clock, Plus, Star, AlertCircle } from 'lucide-react';

interface Cohort {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  maxStartups: number;
  currentStartups: number;
  description: string | null;
  applicationDeadline: string | null;
}

interface Application {
  id: number;
  founderId: number;
  cohortId: number | null;
  status: string;
  productName: string;
  productDescription: string;
  industry: string;
  stage: string;
  targetMarket: string;
  problemStatement: string;
  solution: string;
  traction: string | null;
  teamSize: number;
  fundingGoal: string | null;
  createdAt: string;
  founder?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  cohort?: Cohort;
}

interface Review {
  id: number;
  applicationId: number;
  reviewerId: number;
  rating: number;
  recommendation: string;
  strengths: string | null;
  weaknesses: string | null;
  notes: string | null;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  'draft': 'bg-gray-500/20 text-gray-400 border-gray-500/50',
  'submitted': 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  'under_review': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  'accepted': 'bg-green-500/20 text-green-400 border-green-500/50',
  'rejected': 'bg-red-500/20 text-red-400 border-red-500/50',
  'waitlisted': 'bg-purple-500/20 text-purple-400 border-purple-500/50',
  'active': 'bg-green-500/20 text-green-400 border-green-500/50',
  'upcoming': 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  'completed': 'bg-gray-500/20 text-gray-400 border-gray-500/50',
};

const recommendationColors: Record<string, string> = {
  'strong_accept': 'bg-green-500/20 text-green-400 border-green-500/50',
  'accept': 'bg-green-500/20 text-green-400 border-green-500/50',
  'maybe': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  'reject': 'bg-red-500/20 text-red-400 border-red-500/50',
  'strong_reject': 'bg-red-500/20 text-red-400 border-red-500/50',
};

export default function AdminConsoleWizards() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('cohorts');
  const [createCohortOpen, setCreateCohortOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [cohortStatus, setCohortStatus] = useState('upcoming');
  const [reviewRecommendation, setReviewRecommendation] = useState('');

  // Cohorts query - gated by admin role, loads for cohorts and analytics tabs
  const { data: cohortsData, isLoading: cohortsLoading } = useQuery({
    queryKey: ['/api/wizards/cohorts'],
    enabled: (activeTab === 'cohorts' || activeTab === 'analytics') && user?.role === 'admin',
  });

  // Applications query - gated by admin role, loads for applications and analytics tabs
  const { data: applicationsData, isLoading: applicationsLoading } = useQuery({
    queryKey: ['/api/wizards/applications'],
    enabled: (activeTab === 'applications' || activeTab === 'analytics') && user?.role === 'admin',
  });

  // Create cohort mutation
  const createCohortMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/wizards/cohorts', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/cohorts'] });
      setCreateCohortOpen(false);
      setCohortStatus('upcoming');
      toast({
        title: 'Cohort created',
        description: 'The new cohort has been created successfully.',
      });
    },
  });

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: async (data: { applicationId: number; review: any }) => {
      return apiRequest(`/api/wizards/applications/${data.applicationId}/reviews`, 'POST', data.review);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/applications'] });
      setReviewDialogOpen(false);
      setSelectedApplication(null);
      setReviewRecommendation('');
      toast({
        title: 'Review submitted',
        description: 'Your review has been submitted successfully.',
      });
    },
  });

  const cohorts = (cohortsData as any)?.cohorts || [];
  const applications = (applicationsData as any)?.applications || [];

  // Admin-only guard - after all hooks
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[hsl(222,47%,11%)] text-gray-50 flex items-center justify-center p-6">
        <Card className="max-w-md bg-[hsl(222,47%,15%)] border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <AlertCircle className="w-5 h-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 mb-4">You need admin privileges to access this page.</p>
            <Button 
              onClick={() => window.location.href = '/dashboard'}
              className="bg-[hsl(217,91%,60%)] hover:bg-[hsl(217,91%,50%)] text-white"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const CohortCard = ({ cohort }: { cohort: Cohort }) => (
    <Card className="bg-[hsl(222,47%,15%)] border-gray-800" data-testid={`card-cohort-${cohort.id}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-gray-50 flex items-center gap-2" data-testid={`text-cohort-name-${cohort.id}`}>
              <Users className="w-5 h-5" />
              {cohort.name}
            </CardTitle>
            <CardDescription className="mt-2">
              <Badge variant="outline" className={statusColors[cohort.status] || ''} data-testid={`badge-status-${cohort.id}`}>
                {cohort.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {cohort.description && (
          <p className="text-sm text-gray-400" data-testid={`text-description-${cohort.id}`}>{cohort.description}</p>
        )}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-gray-400 text-xs mb-1">Start Date</div>
            <div className="text-gray-200" data-testid={`text-startdate-${cohort.id}`}>{new Date(cohort.startDate).toLocaleDateString()}</div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1">End Date</div>
            <div className="text-gray-200" data-testid={`text-enddate-${cohort.id}`}>{new Date(cohort.endDate).toLocaleDateString()}</div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1">Capacity</div>
            <div className="text-gray-200" data-testid={`text-capacity-${cohort.id}`}>{cohort.currentStartups || 0} / {cohort.maxStartups}</div>
          </div>
          {cohort.applicationDeadline && (
            <div>
              <div className="text-gray-400 text-xs mb-1">Application Deadline</div>
              <div className="text-gray-200" data-testid={`text-deadline-${cohort.id}`}>{new Date(cohort.applicationDeadline).toLocaleDateString()}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const ApplicationCard = ({ application }: { application: Application }) => (
    <Card className="bg-[hsl(222,47%,15%)] border-gray-800" data-testid={`card-application-${application.id}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-gray-50" data-testid={`text-product-${application.id}`}>
              {application.productName}
            </CardTitle>
            <CardDescription className="mt-1">
              {application.founder && (
                <span className="text-gray-400" data-testid={`text-founder-${application.id}`}>
                  {application.founder.firstName} {application.founder.lastName}
                </span>
              )}
            </CardDescription>
          </div>
          <Badge variant="outline" className={statusColors[application.status] || ''} data-testid={`badge-status-${application.id}`}>
            {application.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-400 line-clamp-2" data-testid={`text-description-${application.id}`}>
          {application.productDescription}
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs" data-testid={`badge-industry-${application.id}`}>
            {application.industry}
          </Badge>
          <Badge variant="outline" className="text-xs" data-testid={`badge-stage-${application.id}`}>
            {application.stage}
          </Badge>
          <Badge variant="outline" className="text-xs" data-testid={`badge-team-${application.id}`}>
            Team: {application.teamSize}
          </Badge>
        </div>
        {application.cohort && (
          <div className="text-xs text-gray-400" data-testid={`text-cohort-${application.id}`}>
            Cohort: {application.cohort.name}
          </div>
        )}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-gray-700 hover:bg-[hsl(217,91%,60%)] hover:text-white"
            onClick={() => {
              setSelectedApplication(application);
              setReviewDialogOpen(true);
            }}
            data-testid={`button-review-${application.id}`}
          >
            <Star className="w-4 h-4 mr-2" />
            Review
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-[hsl(222,47%,11%)] text-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-50 mb-2" data-testid="heading-admin-console">Admin Console</h1>
          <p className="text-gray-400" data-testid="text-description">Manage cohorts, review applications, and track analytics</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-[hsl(222,47%,15%)] border border-gray-800" data-testid="tabs-admin">
            <TabsTrigger value="cohorts" className="data-[state=active]:bg-[hsl(217,91%,60%)] data-[state=active]:text-white" data-testid="tab-cohorts">
              <Calendar className="w-4 h-4 mr-2" />
              Cohorts
            </TabsTrigger>
            <TabsTrigger value="applications" className="data-[state=active]:bg-[hsl(217,91%,60%)] data-[state=active]:text-white" data-testid="tab-applications">
              <FileText className="w-4 h-4 mr-2" />
              Applications
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-[hsl(217,91%,60%)] data-[state=active]:text-white" data-testid="tab-analytics">
              <TrendingUp className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Cohorts Tab */}
          <TabsContent value="cohorts" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-50" data-testid="heading-cohorts">Cohorts</h2>
                <p className="text-sm text-gray-400" data-testid="text-cohorts-count">{cohorts.length} total cohorts</p>
              </div>
              <Dialog open={createCohortOpen} onOpenChange={setCreateCohortOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[hsl(217,91%,60%)] hover:bg-[hsl(217,91%,50%)] text-white" data-testid="button-create-cohort">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Cohort
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[hsl(222,47%,15%)] border-gray-800 text-gray-50">
                  <DialogHeader>
                    <DialogTitle data-testid="heading-create-cohort">Create New Cohort</DialogTitle>
                    <DialogDescription>Add a new cohort to the program</DialogDescription>
                  </DialogHeader>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      createCohortMutation.mutate({
                        name: formData.get('name'),
                        description: formData.get('description'),
                        startDate: formData.get('startDate'),
                        endDate: formData.get('endDate'),
                        maxStartups: parseInt(formData.get('maxStartups') as string),
                        applicationDeadline: formData.get('applicationDeadline'),
                        status: cohortStatus,
                      });
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <Label htmlFor="name">Cohort Name</Label>
                      <Input
                        id="name"
                        name="name"
                        required
                        className="bg-[hsl(222,47%,11%)] border-gray-700 text-gray-50"
                        data-testid="input-cohort-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        className="bg-[hsl(222,47%,11%)] border-gray-700 text-gray-50"
                        data-testid="input-cohort-description"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input
                          id="startDate"
                          name="startDate"
                          type="date"
                          required
                          className="bg-[hsl(222,47%,11%)] border-gray-700 text-gray-50"
                          data-testid="input-start-date"
                        />
                      </div>
                      <div>
                        <Label htmlFor="endDate">End Date</Label>
                        <Input
                          id="endDate"
                          name="endDate"
                          type="date"
                          required
                          className="bg-[hsl(222,47%,11%)] border-gray-700 text-gray-50"
                          data-testid="input-end-date"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="maxStartups">Max Startups</Label>
                        <Input
                          id="maxStartups"
                          name="maxStartups"
                          type="number"
                          required
                          className="bg-[hsl(222,47%,11%)] border-gray-700 text-gray-50"
                          data-testid="input-max-startups"
                        />
                      </div>
                      <div>
                        <Label htmlFor="applicationDeadline">Application Deadline</Label>
                        <Input
                          id="applicationDeadline"
                          name="applicationDeadline"
                          type="date"
                          className="bg-[hsl(222,47%,11%)] border-gray-700 text-gray-50"
                          data-testid="input-deadline"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={cohortStatus} onValueChange={setCohortStatus}>
                        <SelectTrigger className="bg-[hsl(222,47%,11%)] border-gray-700 text-gray-50" data-testid="select-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="upcoming">Upcoming</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button
                        type="submit"
                        className="bg-[hsl(217,91%,60%)] hover:bg-[hsl(217,91%,50%)] text-white"
                        disabled={createCohortMutation.isPending}
                        data-testid="button-submit-cohort"
                      >
                        Create Cohort
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {cohortsLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="bg-[hsl(222,47%,15%)] border-gray-800">
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4 bg-gray-700" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full bg-gray-700" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : cohorts.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cohorts.map((cohort: Cohort) => (
                  <CohortCard key={cohort.id} cohort={cohort} />
                ))}
              </div>
            ) : (
              <Card className="bg-[hsl(222,47%,15%)] border-gray-800">
                <CardContent className="py-12 text-center">
                  <Calendar className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400" data-testid="text-no-cohorts">No cohorts yet. Create your first cohort to get started.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-50" data-testid="heading-applications">Applications</h2>
              <p className="text-sm text-gray-400" data-testid="text-applications-count">{applications.length} total applications</p>
            </div>

            {applicationsLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="bg-[hsl(222,47%,15%)] border-gray-800">
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4 bg-gray-700" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full bg-gray-700" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : applications.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {applications.map((application: Application) => (
                  <ApplicationCard key={application.id} application={application} />
                ))}
              </div>
            ) : (
              <Card className="bg-[hsl(222,47%,15%)] border-gray-800">
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400" data-testid="text-no-applications">No applications yet.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-[hsl(222,47%,15%)] border-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-400">Total Cohorts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-50" data-testid="stat-total-cohorts">{cohorts.length}</div>
                </CardContent>
              </Card>
              <Card className="bg-[hsl(222,47%,15%)] border-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-400">Total Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-50" data-testid="stat-total-applications">{applications.length}</div>
                </CardContent>
              </Card>
              <Card className="bg-[hsl(222,47%,15%)] border-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-400">Accepted</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-400" data-testid="stat-accepted">
                    {applications.filter((a: Application) => a.status === 'accepted').length}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-[hsl(222,47%,15%)] border-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-400">Under Review</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-400" data-testid="stat-under-review">
                    {applications.filter((a: Application) => a.status === 'under_review' || a.status === 'submitted').length}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Review Dialog */}
        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent className="bg-[hsl(222,47%,15%)] border-gray-800 text-gray-50 max-w-2xl">
            <DialogHeader>
              <DialogTitle data-testid="heading-review-application">Review Application</DialogTitle>
              <DialogDescription>
                {selectedApplication && `${selectedApplication.productName} by ${selectedApplication.founder?.firstName} ${selectedApplication.founder?.lastName}`}
              </DialogDescription>
            </DialogHeader>
            {selectedApplication && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  if (!reviewRecommendation) {
                    toast({
                      title: 'Recommendation required',
                      description: 'Please select a recommendation.',
                      variant: 'destructive',
                    });
                    return;
                  }
                  submitReviewMutation.mutate({
                    applicationId: selectedApplication.id,
                    review: {
                      rating: parseInt(formData.get('rating') as string),
                      recommendation: reviewRecommendation,
                      strengths: formData.get('strengths'),
                      weaknesses: formData.get('weaknesses'),
                      notes: formData.get('notes'),
                    },
                  });
                }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="rating">Rating (1-5)</Label>
                  <Input
                    id="rating"
                    name="rating"
                    type="number"
                    min="1"
                    max="5"
                    required
                    className="bg-[hsl(222,47%,11%)] border-gray-700 text-gray-50"
                    data-testid="input-rating"
                  />
                </div>
                <div>
                  <Label htmlFor="recommendation">Recommendation</Label>
                  <Select value={reviewRecommendation} onValueChange={setReviewRecommendation}>
                    <SelectTrigger className="bg-[hsl(222,47%,11%)] border-gray-700 text-gray-50" data-testid="select-recommendation">
                      <SelectValue placeholder="Select recommendation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="strong_accept">Strong Accept</SelectItem>
                      <SelectItem value="accept">Accept</SelectItem>
                      <SelectItem value="maybe">Maybe</SelectItem>
                      <SelectItem value="reject">Reject</SelectItem>
                      <SelectItem value="strong_reject">Strong Reject</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="strengths">Strengths</Label>
                  <Textarea
                    id="strengths"
                    name="strengths"
                    className="bg-[hsl(222,47%,11%)] border-gray-700 text-gray-50"
                    data-testid="input-strengths"
                  />
                </div>
                <div>
                  <Label htmlFor="weaknesses">Weaknesses</Label>
                  <Textarea
                    id="weaknesses"
                    name="weaknesses"
                    className="bg-[hsl(222,47%,11%)] border-gray-700 text-gray-50"
                    data-testid="input-weaknesses"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    className="bg-[hsl(222,47%,11%)] border-gray-700 text-gray-50"
                    data-testid="input-notes"
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    className="bg-[hsl(217,91%,60%)] hover:bg-[hsl(217,91%,50%)] text-white"
                    disabled={submitReviewMutation.isPending}
                    data-testid="button-submit-review"
                  >
                    Submit Review
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
