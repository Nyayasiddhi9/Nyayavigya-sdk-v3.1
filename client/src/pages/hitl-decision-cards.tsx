/**
 * HITL Decision Cards Interface
 * Human-in-the-Loop Approval Workflows with Decision Cards
 * 
 * Features:
 * - Structured decision cards with context
 * - Confidence-based escalation
 * - Multi-level approvals
 * - Learning loop integration
 * - Decision history and audit trail
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Clock,
  MessageSquare,
  Bot,
  User,
  ThumbsUp,
  ThumbsDown,
  Edit3,
  Eye,
  History,
  TrendingUp,
  Shield,
  Zap,
  Brain,
  FileText,
  DollarSign,
  Users,
  Activity,
  RefreshCw
} from "lucide-react";

interface DecisionCard {
  id: string;
  type: 'approval' | 'review' | 'escalation' | 'intervention';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'approved' | 'rejected' | 'modified' | 'expired';
  title: string;
  summary: string;
  context: {
    agent: string;
    agentAvatar?: string;
    department: string;
    workflow: string;
    triggeredAt: string;
    expiresAt?: string;
  };
  proposedAction: {
    type: string;
    description: string;
    impact: string;
    estimatedCost?: number;
    estimatedTime?: string;
  };
  rationale: string;
  confidenceScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  alternatives?: {
    id: string;
    description: string;
    confidence: number;
  }[];
  relatedDecisions?: string[];
  metadata?: Record<string, any>;
}

interface DecisionHistory {
  id: string;
  cardId: string;
  decision: 'approved' | 'rejected' | 'modified';
  decidedBy: string;
  decidedAt: string;
  feedback?: string;
  modifications?: string;
}

const mockDecisionCards: DecisionCard[] = [
  {
    id: 'dec-001',
    type: 'approval',
    priority: 'high',
    status: 'pending',
    title: 'Approve Customer Refund Request',
    summary: 'Customer requesting refund of $2,450 for subscription cancellation',
    context: {
      agent: 'Customer Success Agent',
      department: 'Support',
      workflow: 'refund-processing',
      triggeredAt: new Date(Date.now() - 3600000).toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    },
    proposedAction: {
      type: 'financial_transaction',
      description: 'Process full refund of $2,450 to customer payment method',
      impact: 'Revenue reduction, potential customer retention',
      estimatedCost: 2450,
      estimatedTime: '2-3 business days',
    },
    rationale: 'Customer has been subscribed for 3 months, within refund policy window. Previous interaction shows dissatisfaction with feature set. Competitor analysis suggests retention unlikely without significant discount.',
    confidenceScore: 0.87,
    riskLevel: 'medium',
    alternatives: [
      { id: 'alt-1', description: 'Offer 50% discount for 6 months instead', confidence: 0.72 },
      { id: 'alt-2', description: 'Offer premium features free for 3 months', confidence: 0.65 },
    ],
  },
  {
    id: 'dec-002',
    type: 'escalation',
    priority: 'critical',
    status: 'pending',
    title: 'Production Deployment Authorization',
    summary: 'Critical security patch requires immediate production deployment',
    context: {
      agent: 'DevOps Engineer Agent',
      department: 'Engineering',
      workflow: 'emergency-deployment',
      triggeredAt: new Date(Date.now() - 1800000).toISOString(),
    },
    proposedAction: {
      type: 'infrastructure_change',
      description: 'Deploy security patch v2.3.1 to all production servers',
      impact: 'Fixes critical CVE-2024-1234 vulnerability',
      estimatedTime: '15 minutes with 2 minutes downtime',
    },
    rationale: 'Security scan detected critical vulnerability CVE-2024-1234. Patch has been tested in staging with 100% test pass rate. Risk of exploitation increases every hour without patch.',
    confidenceScore: 0.95,
    riskLevel: 'high',
    alternatives: [
      { id: 'alt-1', description: 'Schedule for next maintenance window (48h)', confidence: 0.45 },
    ],
  },
  {
    id: 'dec-003',
    type: 'review',
    priority: 'medium',
    status: 'pending',
    title: 'Marketing Campaign Budget Increase',
    summary: 'Request to increase Q1 digital marketing budget by 25%',
    context: {
      agent: 'Marketing Strategist Agent',
      department: 'Marketing',
      workflow: 'budget-allocation',
      triggeredAt: new Date(Date.now() - 7200000).toISOString(),
    },
    proposedAction: {
      type: 'budget_modification',
      description: 'Increase digital ad spend from $50,000 to $62,500',
      impact: 'Expected 40% increase in lead generation based on current conversion rates',
      estimatedCost: 12500,
    },
    rationale: 'Current campaigns showing 3.2x ROAS, above industry average of 2.5x. Competitor analysis shows opportunity window. A/B testing indicates potential for further optimization.',
    confidenceScore: 0.78,
    riskLevel: 'low',
    alternatives: [
      { id: 'alt-1', description: 'Maintain current budget, reallocate underperforming channels', confidence: 0.68 },
      { id: 'alt-2', description: 'Gradual 10% increase with monthly review', confidence: 0.82 },
    ],
  },
  {
    id: 'dec-004',
    type: 'intervention',
    priority: 'high',
    status: 'pending',
    title: 'Candidate Interview Override',
    summary: 'HR agent requests human review of borderline candidate',
    context: {
      agent: 'Recruiter Agent',
      department: 'HR',
      workflow: 'candidate-screening',
      triggeredAt: new Date(Date.now() - 5400000).toISOString(),
    },
    proposedAction: {
      type: 'process_override',
      description: 'Advance candidate to final interview despite score threshold',
      impact: 'Potential exceptional hire, deviation from standard process',
    },
    rationale: 'Candidate scored 72% on technical assessment (threshold: 75%), but demonstrates exceptional problem-solving approach and strong cultural fit indicators. Referred by senior engineer with strong track record.',
    confidenceScore: 0.65,
    riskLevel: 'medium',
    alternatives: [
      { id: 'alt-1', description: 'Reject and continue with other candidates', confidence: 0.58 },
      { id: 'alt-2', description: 'Offer technical re-assessment', confidence: 0.71 },
    ],
  },
];

const mockHistory: DecisionHistory[] = [
  {
    id: 'hist-001',
    cardId: 'dec-prev-001',
    decision: 'approved',
    decidedBy: 'John Smith',
    decidedAt: new Date(Date.now() - 86400000).toISOString(),
    feedback: 'Good analysis, proceed with recommendation',
  },
  {
    id: 'hist-002',
    cardId: 'dec-prev-002',
    decision: 'modified',
    decidedBy: 'Jane Doe',
    decidedAt: new Date(Date.now() - 172800000).toISOString(),
    feedback: 'Approved with reduced budget allocation',
    modifications: 'Budget reduced from $15,000 to $10,000',
  },
  {
    id: 'hist-003',
    cardId: 'dec-prev-003',
    decision: 'rejected',
    decidedBy: 'Mike Johnson',
    decidedAt: new Date(Date.now() - 259200000).toISOString(),
    feedback: 'Risk too high, need more analysis',
  },
];

export default function HITLDecisionCards() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCard, setSelectedCard] = useState<DecisionCard | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [modificationText, setModificationText] = useState('');
  const [showModifyDialog, setShowModifyDialog] = useState(false);
  const [decisions, setDecisions] = useState<DecisionCard[]>(mockDecisionCards);
  const [history, setHistory] = useState<DecisionHistory[]>(mockHistory);

  const pendingCount = decisions.filter(d => d.status === 'pending').length;
  const criticalCount = decisions.filter(d => d.status === 'pending' && d.priority === 'critical').length;

  const handleDecision = (cardId: string, decision: 'approved' | 'rejected' | 'modified', feedback?: string, modifications?: string) => {
    setDecisions(prev => prev.map(card => 
      card.id === cardId ? { ...card, status: decision } : card
    ));

    const newHistory: DecisionHistory = {
      id: `hist-${Date.now()}`,
      cardId,
      decision,
      decidedBy: 'Current User',
      decidedAt: new Date().toISOString(),
      feedback,
      modifications,
    };
    setHistory(prev => [newHistory, ...prev]);

    toast({
      title: decision === 'approved' ? 'Decision Approved' : decision === 'rejected' ? 'Decision Rejected' : 'Decision Modified',
      description: `The decision has been ${decision} and logged for learning`,
    });

    setSelectedCard(null);
    setFeedbackText('');
    setModificationText('');
    setShowModifyDialog(false);
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-green-100 text-green-800 border-green-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      critical: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[priority] || colors.medium;
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      approval: CheckCircle,
      review: Eye,
      escalation: AlertTriangle,
      intervention: Edit3,
    };
    const Icon = icons[type] || CheckCircle;
    return <Icon className="h-4 w-4" />;
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Decision Cards</h1>
          <p className="text-muted-foreground">
            Human-in-the-Loop approval workflows with intelligent escalation
          </p>
        </div>
        <div className="flex items-center gap-4">
          {criticalCount > 0 && (
            <Badge variant="destructive" className="animate-pulse" data-testid="badge-critical-count">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {criticalCount} Critical
            </Badge>
          )}
          <Badge variant="outline" data-testid="badge-pending-count">
            <Clock className="h-3 w-3 mr-1" />
            {pendingCount} Pending
          </Badge>
          <Button variant="outline" size="sm" data-testid="button-refresh">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-700">Pending Decisions</p>
                <p className="text-2xl font-bold text-blue-900">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-700">Approved Today</p>
                <p className="text-2xl font-bold text-green-900">{history.filter(h => h.decision === 'approved').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-700">Avg Confidence</p>
                <p className="text-2xl font-bold text-purple-900">
                  {Math.round(decisions.reduce((acc, d) => acc + d.confidenceScore, 0) / decisions.length * 100)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-orange-700">Learning Rate</p>
                <p className="text-2xl font-bold text-orange-900">+12%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pending ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">
            History
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {decisions.filter(d => d.status === 'pending').map((card) => (
              <Card 
                key={card.id} 
                className={`cursor-pointer hover:shadow-lg transition-all ${selectedCard?.id === card.id ? 'ring-2 ring-violet-500' : ''}`}
                onClick={() => setSelectedCard(card)}
                data-testid={`card-decision-${card.id}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(card.type)}
                      <Badge className={getPriorityColor(card.priority)}>
                        {card.priority}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(card.context.triggeredAt)}
                    </span>
                  </div>
                  <CardTitle className="text-lg">{card.title}</CardTitle>
                  <CardDescription>{card.summary}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{card.context.agent}</p>
                      <p className="text-xs text-muted-foreground">{card.context.department} • {card.context.workflow}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Confidence</span>
                      <span className={`font-medium ${getConfidenceColor(card.confidenceScore)}`}>
                        {Math.round(card.confidenceScore * 100)}%
                      </span>
                    </div>
                    <Progress value={card.confidenceScore * 100} className="h-2" />
                  </div>
                  
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm font-medium mb-1">Proposed Action</p>
                    <p className="text-sm text-muted-foreground">{card.proposedAction.description}</p>
                    {card.proposedAction.estimatedCost && (
                      <div className="flex items-center gap-1 mt-2 text-sm">
                        <DollarSign className="h-3 w-3" />
                        <span>${card.proposedAction.estimatedCost.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="gap-2">
                  <Button 
                    className="flex-1" 
                    onClick={(e) => { e.stopPropagation(); handleDecision(card.id, 'approved', 'Approved as recommended'); }}
                    data-testid={`button-approve-${card.id}`}
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={(e) => { e.stopPropagation(); setSelectedCard(card); setShowModifyDialog(true); }}
                    data-testid={`button-modify-${card.id}`}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Modify
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="flex-1"
                    onClick={(e) => { e.stopPropagation(); handleDecision(card.id, 'rejected', 'Rejected - needs revision'); }}
                    data-testid={`button-reject-${card.id}`}
                  >
                    <ThumbsDown className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          
          {decisions.filter(d => d.status === 'pending').length === 0 && (
            <Card className="py-12">
              <CardContent className="flex flex-col items-center justify-center text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold">All Caught Up!</h3>
                <p className="text-muted-foreground">No pending decisions require your attention</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {history.map((item) => (
                <Card key={item.id} data-testid={`card-history-${item.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {item.decision === 'approved' && <CheckCircle className="h-5 w-5 text-green-500" />}
                        {item.decision === 'rejected' && <XCircle className="h-5 w-5 text-red-500" />}
                        {item.decision === 'modified' && <Edit3 className="h-5 w-5 text-yellow-500" />}
                        <div>
                          <p className="font-medium">Decision {item.decision}</p>
                          <p className="text-sm text-muted-foreground">
                            by {item.decidedBy} • {formatTimeAgo(item.decidedAt)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{item.cardId}</Badge>
                    </div>
                    {item.feedback && (
                      <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                        <p className="text-muted-foreground">{item.feedback}</p>
                      </div>
                    )}
                    {item.modifications && (
                      <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-sm">
                        <p className="text-yellow-800 dark:text-yellow-200">{item.modifications}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Decision Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span>Approved</span>
                    </div>
                    <span className="font-medium">68%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <span>Modified</span>
                    </div>
                    <span className="font-medium">22%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span>Rejected</span>
                    </div>
                    <span className="font-medium">10%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-4xl font-bold text-violet-600">4.2h</p>
                  <p className="text-sm text-muted-foreground">Average response time</p>
                  <div className="mt-4 flex items-center justify-center gap-2 text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm">18% faster than last week</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Learning Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Auto-approval eligible</span>
                      <span>45%</span>
                    </div>
                    <Progress value={45} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Confidence improvement</span>
                      <span>+12%</span>
                    </div>
                    <Progress value={62} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Escalation reduction</span>
                      <span>-28%</span>
                    </div>
                    <Progress value={72} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showModifyDialog} onOpenChange={setShowModifyDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modify Decision</DialogTitle>
            <DialogDescription>
              Provide modifications to the proposed action
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Modifications</label>
              <Textarea
                placeholder="Describe your modifications..."
                value={modificationText}
                onChange={(e) => setModificationText(e.target.value)}
                rows={4}
                data-testid="textarea-modifications"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Feedback for Learning</label>
              <Textarea
                placeholder="Add feedback to help improve future decisions..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={2}
                data-testid="textarea-feedback"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModifyDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedCard) {
                  handleDecision(selectedCard.id, 'modified', feedbackText, modificationText);
                }
              }}
              data-testid="button-submit-modification"
            >
              Submit Modification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
