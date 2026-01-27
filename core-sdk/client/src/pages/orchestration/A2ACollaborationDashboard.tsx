import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, MessageSquare, CheckCircle, Clock, AlertCircle, Send } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface AgentInstance {
  id: string;
  instanceId: string;
  agentId: string;
  status: string;
  startedAt: string;
}

interface AgentTask {
  id: string;
  taskId: string;
  agentId: string;
  description: string;
  status: string;
  priority: string;
}

interface AgentMessage {
  id: string;
  messageId: string;
  fromAgentId: string;
  toAgentId: string;
  messageType: string;
  content: any;
  sentAt: string;
}

export default function A2ACollaborationDashboard() {
  const [selectedFromAgent, setSelectedFromAgent] = useState<string>('');
  const [selectedToAgent, setSelectedToAgent] = useState<string>('');
  const [messageContent, setMessageContent] = useState('');

  const { data: instances, isLoading: loadingInstances } = useQuery({
    queryKey: ['/api/v9/a2a/agents'],
  });

  const { data: messages, isLoading: loadingMessages } = useQuery({
    queryKey: ['/api/v9/a2a/messages', { fromAgentId: selectedFromAgent }],
    queryFn: () => apiRequest(`/api/v9/a2a/messages?fromAgentId=${selectedFromAgent}`, 'GET'),
    enabled: !!selectedFromAgent,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/v9/a2a/messages/send', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v9/a2a/messages'] });
      setMessageContent('');
    },
  });

  const assignTaskMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/v9/a2a/tasks/assign', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v9/a2a/tasks'] });
    },
  });

  const agentInstances = instances?.agents || [];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
        return 'bg-green-500';
      case 'idle':
        return 'bg-yellow-500';
      case 'stopped':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="heading-a2a-dashboard">A2A Collaboration Dashboard</h1>
          <p className="text-muted-foreground">Agent-to-Agent Communication & Coordination</p>
        </div>
        <Badge variant="outline" className="text-lg">
          <Users className="w-4 h-4 mr-2" />
          {agentInstances.length} Active Agents
        </Badge>
      </div>

      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agents" data-testid="tab-agents">Active Agents</TabsTrigger>
          <TabsTrigger value="messages" data-testid="tab-messages">Messages</TabsTrigger>
          <TabsTrigger value="tasks" data-testid="tab-tasks">Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingInstances ? (
              <div className="col-span-3 text-center py-12">Loading agents...</div>
            ) : agentInstances.length === 0 ? (
              <div className="col-span-3 text-center py-12 text-muted-foreground">
                No active agent instances
              </div>
            ) : (
              agentInstances.map((instance: AgentInstance) => (
                <Card key={instance.id} data-testid={`card-agent-${instance.instanceId}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="truncate">{instance.agentId}</span>
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(instance.status)}`} />
                    </CardTitle>
                    <CardDescription className="font-mono text-xs">
                      {instance.instanceId}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant="outline">{instance.status}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Started:</span>
                        <span className="text-xs">
                          {new Date(instance.startedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-4"
                        onClick={() => setSelectedFromAgent(instance.agentId)}
                        data-testid={`button-select-${instance.instanceId}`}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        View Messages
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Communication</CardTitle>
              <CardDescription>Send and receive messages between agents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">From Agent</label>
                  <Select onValueChange={setSelectedFromAgent} data-testid="select-from-agent">
                    <SelectTrigger>
                      <SelectValue placeholder="Select agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agentInstances.map((instance: AgentInstance) => (
                        <SelectItem key={instance.id} value={instance.agentId}>
                          {instance.agentId}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">To Agent</label>
                  <Select onValueChange={setSelectedToAgent} data-testid="select-to-agent">
                    <SelectTrigger>
                      <SelectValue placeholder="Select target" />
                    </SelectTrigger>
                    <SelectContent>
                      {agentInstances.map((instance: AgentInstance) => (
                        <SelectItem key={instance.id} value={instance.agentId}>
                          {instance.agentId}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Textarea
                placeholder="Message content..."
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                className="min-h-24"
                data-testid="textarea-message"
              />
              <Button
                onClick={() => sendMessageMutation.mutate({
                  fromAgentId: selectedFromAgent,
                  toAgentId: selectedToAgent,
                  messageType: 'coordination',
                  content: messageContent
                })}
                disabled={!selectedFromAgent || !selectedToAgent || !messageContent}
                data-testid="button-send-message"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </Button>

              {loadingMessages ? (
                <div className="text-center py-8">Loading messages...</div>
              ) : messages?.messages && messages.messages.length > 0 ? (
                <div className="space-y-2 mt-6">
                  <h3 className="font-semibold">Recent Messages</h3>
                  {messages.messages.map((msg: AgentMessage) => (
                    <Card key={msg.id} data-testid={`message-${msg.messageId}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{msg.messageType}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(msg.sentAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm">{JSON.stringify(msg.content)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Tasks</CardTitle>
              <CardDescription>Assign and track tasks across agents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Task assignment interface - Coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
