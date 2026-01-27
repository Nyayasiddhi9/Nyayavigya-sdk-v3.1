import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import apiRequest, { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Sparkles, 
  Calendar, 
  Users, 
  TrendingUp, 
  CheckCircle2,
  ArrowRight,
  Rocket,
} from 'lucide-react';

interface Cohort {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  maxStartups: number;
  status: string;
  applicationDeadline: string;
}

const applicationSchema = z.object({
  cohortId: z.coerce.number().min(1, 'Please select a cohort'),
  founderId: z.coerce.number().min(1),
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
  description: z.string().min(50, 'Please provide at least 50 characters'),
  industry: z.string().min(2, 'Please specify your industry'),
  stage: z.enum(['idea', 'prototype', 'mvp', 'early_revenue', 'growth']),
  teamSize: z.coerce.number().min(1).max(100),
  pitchDeckUrl: z.string().url().optional().or(z.literal('')),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  fundingRaised: z.coerce.number().min(0).optional(),
  revenueMonthly: z.coerce.number().min(0).optional(),
  targetMarket: z.string().min(10),
  problemStatement: z.string().min(100, 'Please provide at least 100 characters'),
  solution: z.string().min(100, 'Please provide at least 100 characters'),
  competitiveAdvantage: z.string().min(50),
  goals: z.string().min(50, 'Please describe your goals'),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

export default function ApplicationForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedCohort, setSelectedCohort] = useState<Cohort | null>(null);

  // Fetch available cohorts
  const { data: cohortsData, isLoading: cohortsLoading } = useQuery<{ cohorts: Cohort[]; total: number }>({
    queryKey: ['/api/wizards/cohorts'],
    queryFn: () => apiRequest('/api/wizards/cohorts?status=open'),
  });

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      founderId: user ? parseInt(user.id) : 0,
      cohortId: 0,
      companyName: '',
      description: '',
      industry: '',
      stage: 'idea',
      teamSize: 1,
      pitchDeckUrl: '',
      websiteUrl: '',
      fundingRaised: 0,
      revenueMonthly: 0,
      targetMarket: '',
      problemStatement: '',
      solution: '',
      competitiveAdvantage: '',
      goals: '',
    },
  });

  const createApplication = useMutation({
    mutationFn: async (data: ApplicationFormData) => {
      const response = await apiRequest('/api/wizards/applications', 'POST', data);
      return response;
    },
    onSuccess: () => {
      toast({
        title: 'Application Submitted!',
        description: 'Your application has been submitted successfully. We\'ll review it and get back to you soon.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/wizards/applications'] });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Submission Failed',
        description: error.message || 'Failed to submit application. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ApplicationFormData) => {
    createApplication.mutate(data);
  };

  if (cohortsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[hsl(222,47%,11%)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(217,91%,60%)] mx-auto mb-4"></div>
          <p className="text-[hsl(220,9%,65%)]">Loading available cohorts...</p>
        </div>
      </div>
    );
  }

  const openCohorts = cohortsData?.cohorts || [];

  return (
    <div className="min-h-screen bg-[hsl(222,47%,11%)] text-[hsl(0,0%,98%)]">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-[hsl(222,47%,15%)]/80 backdrop-blur-lg border-b border-[hsl(222,35%,20%)]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[hsl(217,91%,60%)] to-[hsl(270,75%,65%)] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Apply to Wizards Incubator</h1>
              <p className="text-sm text-[hsl(220,9%,65%)]">Transform your idea into a production MVP in 14 days</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12 space-y-12">
        {/* Available Cohorts */}
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold">Available Cohorts</h2>
            <p className="text-[hsl(220,9%,65%)] mt-2">Select a cohort to apply to and start your journey</p>
          </div>

          {openCohorts.length === 0 ? (
            <Card className="p-12 bg-[hsl(222,47%,15%)] border-[hsl(222,35%,20%)] text-center">
              <Calendar className="w-16 h-16 text-[hsl(220,9%,46%)] mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Open Cohorts</h3>
              <p className="text-[hsl(220,9%,65%)]">There are no open cohorts at the moment. Check back soon!</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {openCohorts.map((cohort) => (
                <Card
                  key={cohort.id}
                  className={`p-6 bg-[hsl(222,47%,15%)] border-2 transition-all cursor-pointer hover:border-[hsl(217,91%,60%)] ${
                    selectedCohort?.id === cohort.id
                      ? 'border-[hsl(217,91%,60%)]'
                      : 'border-[hsl(222,35%,20%)]'
                  }`}
                  onClick={() => {
                    setSelectedCohort(cohort);
                    form.setValue('cohortId', cohort.id);
                  }}
                  data-testid={`card-cohort-${cohort.id}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold">{cohort.name}</h3>
                      <p className="text-sm text-[hsl(220,9%,65%)] mt-1">{cohort.description}</p>
                    </div>
                    {selectedCohort?.id === cohort.id && (
                      <CheckCircle2 className="w-6 h-6 text-[hsl(142,71%,45%)]" />
                    )}
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-[hsl(217,91%,60%)]" />
                      <span className="text-[hsl(220,9%,65%)]">Start:</span>
                      <span>{new Date(cohort.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-[hsl(270,75%,65%)]" />
                      <span className="text-[hsl(220,9%,65%)]">Max Startups:</span>
                      <span>{cohort.maxStartups}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="w-4 h-4 text-[hsl(142,71%,45%)]" />
                      <span className="text-[hsl(220,9%,65%)]">Deadline:</span>
                      <span>{new Date(cohort.applicationDeadline).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <Badge className="bg-[hsl(142,71%,45%)]/20 text-[hsl(142,71%,45%)] border-[hsl(142,71%,45%)]/30">
                    {cohort.status === 'open' ? 'Accepting Applications' : cohort.status}
                  </Badge>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Application Form */}
        {selectedCohort && (
          <Card className="p-8 bg-[hsl(222,47%,15%)] border-[hsl(222,35%,20%)]" data-testid="card-application-form">
            <div className="flex items-center gap-3 mb-8">
              <Rocket className="w-8 h-8 text-[hsl(217,91%,60%)]" />
              <div>
                <h2 className="text-2xl font-bold">Application Form</h2>
                <p className="text-[hsl(220,9%,65%)]">Tell us about your startup and vision</p>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Company Information */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold border-b border-[hsl(222,35%,20%)] pb-3">Company Information</h3>

                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="bg-[hsl(222,47%,11%)] border-[hsl(222,35%,20%)] text-white"
                            placeholder="Acme Inc."
                            data-testid="input-company-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brief Description *</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            className="bg-[hsl(222,47%,11%)] border-[hsl(222,35%,20%)] text-white min-h-24"
                            placeholder="Describe your startup in a few sentences..."
                            data-testid="input-description"
                          />
                        </FormControl>
                        <FormDescription>Minimum 50 characters</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Industry *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-[hsl(222,47%,11%)] border-[hsl(222,35%,20%)] text-white"
                              placeholder="e.g., Fintech, Healthcare, SaaS"
                              data-testid="input-industry"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="stage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Stage *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger 
                                className="bg-[hsl(222,47%,11%)] border-[hsl(222,35%,20%)] text-white"
                                data-testid="select-stage"
                              >
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-[hsl(222,47%,15%)] border-[hsl(222,35%,20%)]">
                              <SelectItem value="idea">Idea</SelectItem>
                              <SelectItem value="prototype">Prototype</SelectItem>
                              <SelectItem value="mvp">MVP</SelectItem>
                              <SelectItem value="early_revenue">Early Revenue</SelectItem>
                              <SelectItem value="growth">Growth</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="teamSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Team Size *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              className="bg-[hsl(222,47%,11%)] border-[hsl(222,35%,20%)] text-white"
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              data-testid="input-team-size"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fundingRaised"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Funding Raised ($)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              className="bg-[hsl(222,47%,11%)] border-[hsl(222,35%,20%)] text-white"
                              placeholder="0"
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              data-testid="input-funding"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="revenueMonthly"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monthly Revenue ($)</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              className="bg-[hsl(222,47%,11%)] border-[hsl(222,35%,20%)] text-white"
                              placeholder="0"
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              data-testid="input-revenue"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="websiteUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website URL</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-[hsl(222,47%,11%)] border-[hsl(222,35%,20%)] text-white"
                              placeholder="https://example.com"
                              data-testid="input-website"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="pitchDeckUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pitch Deck URL</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-[hsl(222,47%,11%)] border-[hsl(222,35%,20%)] text-white"
                              placeholder="https://docs.google.com/..."
                              data-testid="input-pitch-deck"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Business Model */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold border-b border-[hsl(222,35%,20%)] pb-3">Business Model</h3>

                  <FormField
                    control={form.control}
                    name="targetMarket"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Market *</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            className="bg-[hsl(222,47%,11%)] border-[hsl(222,35%,20%)] text-white"
                            placeholder="Who are your customers? What's the market size?"
                            data-testid="input-target-market"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="problemStatement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Problem Statement *</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            className="bg-[hsl(222,47%,11%)] border-[hsl(222,35%,20%)] text-white min-h-32"
                            placeholder="What problem are you solving? Why is it important?"
                            data-testid="input-problem-statement"
                          />
                        </FormControl>
                        <FormDescription>Minimum 100 characters</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="solution"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Solution *</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            className="bg-[hsl(222,47%,11%)] border-[hsl(222,35%,20%)] text-white min-h-32"
                            placeholder="How does your product/service solve this problem?"
                            data-testid="input-solution"
                          />
                        </FormControl>
                        <FormDescription>Minimum 100 characters</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="competitiveAdvantage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Competitive Advantage *</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            className="bg-[hsl(222,47%,11%)] border-[hsl(222,35%,20%)] text-white"
                            placeholder="What makes you different from competitors?"
                            data-testid="input-competitive-advantage"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Goals */}
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold border-b border-[hsl(222,35%,20%)] pb-3">Program Goals</h3>

                  <FormField
                    control={form.control}
                    name="goals"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>What do you hope to achieve in this program? *</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            className="bg-[hsl(222,47%,11%)] border-[hsl(222,35%,20%)] text-white min-h-24"
                            placeholder="Describe your goals and expectations..."
                            data-testid="input-goals"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-[hsl(222,35%,20%)]">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.reset()}
                    className="border-[hsl(222,35%,20%)] text-[hsl(220,9%,65%)] hover:bg-[hsl(222,47%,15%)]"
                    data-testid="button-reset"
                  >
                    Reset Form
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[hsl(217,91%,60%)] hover:bg-[hsl(217,91%,55%)] text-white"
                    disabled={createApplication.isPending}
                    data-testid="button-submit-application"
                  >
                    {createApplication.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Application
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </Card>
        )}
      </div>
    </div>
  );
}
