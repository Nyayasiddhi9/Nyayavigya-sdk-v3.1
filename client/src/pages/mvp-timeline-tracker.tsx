import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Clock, Rocket, Users, Target, Sparkles, TrendingUp } from "lucide-react";

interface DayPhase {
  day: number;
  title: string;
  studio: string;
  description: string;
  deliverables: string[];
  status: 'completed' | 'in_progress' | 'upcoming';
  agentsAssigned: number;
}

const FOURTEEN_DAY_TIMELINE: DayPhase[] = [
  { day: 1, title: "Idea Validation & Market Research", studio: "Ideation Lab", description: "AI-powered market analysis and idea validation", deliverables: ["Market analysis report", "Competitor landscape", "Target audience profile"], status: "completed", agentsAssigned: 12 },
  { day: 2, title: "Product Blueprint & Architecture", studio: "Product Blueprint", description: "Technical architecture and product specification", deliverables: ["Technical architecture", "Feature specifications", "Data models"], status: "completed", agentsAssigned: 15 },
  { day: 3, title: "UX/UI Design & Prototyping", studio: "Experience Design", description: "User experience design and interactive prototypes", deliverables: ["Wireframes", "UI mockups", "Interactive prototype"], status: "completed", agentsAssigned: 18 },
  { day: 4, title: "Core Backend Development", studio: "Engineering Forge", description: "API development and database setup", deliverables: ["API endpoints", "Database schema", "Authentication system"], status: "in_progress", agentsAssigned: 25 },
  { day: 5, title: "Frontend Development - Core Features", studio: "Engineering Forge", description: "React/TypeScript frontend implementation", deliverables: ["Core UI components", "State management", "API integration"], status: "upcoming", agentsAssigned: 22 },
  { day: 6, title: "Feature Integration & Testing", studio: "Quality Assurance Lab", description: "Comprehensive testing and QA automation", deliverables: ["Unit tests", "Integration tests", "QA report"], status: "upcoming", agentsAssigned: 20 },
  { day: 7, title: "Market Intelligence & Positioning", studio: "Market Intelligence", description: "Competitive analysis and market positioning", deliverables: ["Positioning strategy", "Value proposition", "Go-to-market plan"], status: "upcoming", agentsAssigned: 14 },
  { day: 8, title: "Growth Strategy Development", studio: "Growth Engine", description: "User acquisition and growth tactics", deliverables: ["Growth playbook", "Marketing channels", "Content strategy"], status: "upcoming", agentsAssigned: 16 },
  { day: 9, title: "Advanced Features & Polish", studio: "Engineering Forge", description: "Enhanced features and UI polish", deliverables: ["Advanced features", "UI refinements", "Performance optimization"], status: "upcoming", agentsAssigned: 24 },
  { day: 10, title: "Operations & Infrastructure Setup", studio: "Operations Hub", description: "DevOps, monitoring, and infrastructure", deliverables: ["CI/CD pipeline", "Monitoring dashboards", "Infrastructure docs"], status: "upcoming", agentsAssigned: 18 },
  { day: 11, title: "Launch Preparation", studio: "Launch Command", description: "Launch checklist and deployment preparation", deliverables: ["Launch checklist", "Deployment plan", "Rollback strategy"], status: "upcoming", agentsAssigned: 20 },
  { day: 12, title: "Final QA & Security Audit", studio: "Quality Assurance Lab", description: "Security audit and final testing", deliverables: ["Security audit report", "Load testing results", "Bug fixes"], status: "upcoming", agentsAssigned: 22 },
  { day: 13, title: "Production Deployment", studio: "Deployment Studio", description: "Cloud deployment and DNS configuration", deliverables: ["Production deployment", "Domain setup", "SSL certificates"], status: "upcoming", agentsAssigned: 15 },
  { day: 14, title: "Launch Day & Initial Monitoring", studio: "Launch Command", description: "Product launch and performance monitoring", deliverables: ["Live product", "Analytics setup", "Initial user feedback"], status: "upcoming", agentsAssigned: 25 },
];

export default function MVPTimelineTracker() {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const completedDays = FOURTEEN_DAY_TIMELINE.filter(d => d.status === 'completed').length;
  const progressPercentage = (completedDays / 14) * 100;
  const currentDay = FOURTEEN_DAY_TIMELINE.find(d => d.status === 'in_progress')?.day || 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4" data-testid="timeline-header">
          <div className="flex items-center justify-center gap-3">
            <Rocket className="w-12 h-12 text-purple-400" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              14-Day MVP Timeline
            </h1>
          </div>
          <p className="text-xl text-gray-300">
            From idea to production-ready MVP in 14 days with 267+ AI agents
          </p>
        </div>

        {/* Progress Overview */}
        <Card className="bg-slate-900/50 border-purple-500/30" data-testid="progress-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Overall Progress
            </CardTitle>
            <CardDescription className="text-gray-400">
              Day {currentDay} of 14 • {completedDays} days completed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">Progress</span>
                <span className="text-purple-400 font-semibold" data-testid="progress-percentage">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              <Progress value={progressPercentage} className="h-3" data-testid="progress-bar" />
            </div>
            
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                <div className="text-2xl font-bold text-green-400" data-testid="count-completed">
                  {completedDays}
                </div>
                <div className="text-sm text-gray-400">Completed</div>
              </div>
              <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
                <div className="text-2xl font-bold text-blue-400" data-testid="count-inprogress">
                  {FOURTEEN_DAY_TIMELINE.filter(d => d.status === 'in_progress').length}
                </div>
                <div className="text-sm text-gray-400">In Progress</div>
              </div>
              <div className="text-center p-4 bg-purple-500/10 rounded-lg border border-purple-500/30">
                <div className="text-2xl font-bold text-purple-400" data-testid="count-upcoming">
                  {FOURTEEN_DAY_TIMELINE.filter(d => d.status === 'upcoming').length}
                </div>
                <div className="text-sm text-gray-400">Upcoming</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-purple-400" />
            Journey Timeline
          </h2>

          <div className="space-y-4">
            {FOURTEEN_DAY_TIMELINE.map((phase, index) => (
              <Card
                key={phase.day}
                className={`
                  transition-all duration-300 cursor-pointer
                  ${phase.status === 'completed' ? 'bg-green-500/5 border-green-500/30' : ''}
                  ${phase.status === 'in_progress' ? 'bg-blue-500/10 border-blue-500/50 shadow-lg shadow-blue-500/20' : ''}
                  ${phase.status === 'upcoming' ? 'bg-slate-900/30 border-slate-700/30' : ''}
                  ${selectedDay === phase.day ? 'ring-2 ring-purple-500' : ''}
                  hover:border-purple-500/50
                `}
                onClick={() => setSelectedDay(selectedDay === phase.day ? null : phase.day)}
                data-testid={`day-${phase.day}-card`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Status Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {phase.status === 'completed' && (
                        <CheckCircle2 className="w-8 h-8 text-green-400" data-testid={`day-${phase.day}-status-completed`} />
                      )}
                      {phase.status === 'in_progress' && (
                        <div className="relative">
                          <Circle className="w-8 h-8 text-blue-400 animate-pulse" data-testid={`day-${phase.day}-status-inprogress`} />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-blue-300" />
                          </div>
                        </div>
                      )}
                      {phase.status === 'upcoming' && (
                        <Circle className="w-8 h-8 text-gray-500" data-testid={`day-${phase.day}-status-upcoming`} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <Badge variant="outline" className="text-purple-300 border-purple-500/50">
                              Day {phase.day}
                            </Badge>
                            <Badge variant="outline" className="text-blue-300 border-blue-500/50">
                              {phase.studio}
                            </Badge>
                          </div>
                          <h3 className="text-lg font-semibold text-white">{phase.title}</h3>
                          <p className="text-sm text-gray-400 mt-1">{phase.description}</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Users className="w-4 h-4" />
                          <span>{phase.agentsAssigned} agents</span>
                        </div>
                      </div>

                      {/* Deliverables */}
                      {selectedDay === phase.day && (
                        <div className="mt-4 pt-4 border-t border-slate-700">
                          <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                            <Target className="w-4 h-4 text-purple-400" />
                            Deliverables
                          </h4>
                          <ul className="space-y-2">
                            {phase.deliverables.map((deliverable, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-gray-300" data-testid={`day-${phase.day}-deliverable-${idx}`}>
                                <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                                  phase.status === 'completed' ? 'text-green-400' : 'text-gray-500'
                                }`} />
                                <span>{deliverable}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold text-white mb-2">Ready to build your MVP?</h3>
            <p className="text-gray-300 mb-6">
              Join 267+ AI agents working 24/7 to transform your idea into reality
            </p>
            <Button 
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              data-testid="button-start-journey"
            >
              <Rocket className="w-5 h-5 mr-2" />
              Start Your 14-Day Journey
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
