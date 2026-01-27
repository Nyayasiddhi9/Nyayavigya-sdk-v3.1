/**
 * Orchestration Page - Real-time Agent Coordination & Project Building
 */

import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { 
  Code, 
  Database, 
  Play, 
  Users, 
  MessageSquare, 
  GitBranch,
  TestTube,
  Eye,
  Settings,
  Terminal,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Send,
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'idle' | 'working' | 'completed';
  currentTask: string;
  progress: number;
  avatar: string;
}

interface ProjectMessage {
  id: string;
  type: 'user' | 'agent' | 'system';
  author: string;
  content: string;
  timestamp: Date;
  agentId?: string;
}

interface CodeFile {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  lastModified: Date;
  modifiedBy: string;
}

export default function OrchestrationPage() {
  const params = useParams();
  const projectId = params.id;
  
  const [activeTab, setActiveTab] = useState('overview');
  const [userInstruction, setUserInstruction] = useState('');
  const [messages, setMessages] = useState<ProjectMessage[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [codeFiles, setCodeFiles] = useState<CodeFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<CodeFile | null>(null);
  const [isBuilding, setIsBuilding] = useState(true);

  // Mock data for demonstration
  useEffect(() => {
    // Initialize agents
    setAgents([
      {
        id: 'cto',
        name: 'Alex CTO',
        role: 'Technical Strategy',
        status: 'active',
        currentTask: 'Reviewing architecture decisions',
        progress: 85,
        avatar: '👨‍💼'
      },
      {
        id: 'architect',
        name: 'Sarah Architect',
        role: 'System Design',
        status: 'working',
        currentTask: 'Designing database schema',
        progress: 60,
        avatar: '👩‍🏗️'
      },
      {
        id: 'frontend',
        name: 'Mike Frontend',
        role: 'UI Development',
        status: 'working',
        currentTask: 'Building React components',
        progress: 40,
        avatar: '👨‍💻'
      },
      {
        id: 'backend',
        name: 'Lisa Backend',
        role: 'API Development',
        status: 'working',
        currentTask: 'Creating REST endpoints',
        progress: 50,
        avatar: '👩‍💻'
      },
      {
        id: 'database',
        name: 'Tom Database',
        role: 'Data Management',
        status: 'active',
        currentTask: 'Setting up PostgreSQL tables',
        progress: 70,
        avatar: '🗄️'
      },
      {
        id: 'qa',
        name: 'Emma QA',
        role: 'Quality Assurance',
        status: 'idle',
        currentTask: 'Waiting for components',
        progress: 0,
        avatar: '🧪'
      }
    ]);

    // Initialize messages
    setMessages([
      {
        id: '1',
        type: 'system',
        author: 'System',
        content: 'Project initialization started. Assembling development team...',
        timestamp: new Date(Date.now() - 300000)
      },
      {
        id: '2',
        type: 'agent',
        author: 'Alex CTO',
        content: 'I\'ve analyzed the requirements. Recommending React + Node.js + PostgreSQL stack.',
        timestamp: new Date(Date.now() - 240000),
        agentId: 'cto'
      },
      {
        id: '3',
        type: 'agent',
        author: 'Sarah Architect',
        content: 'Architecture approved. Creating component structure and database design.',
        timestamp: new Date(Date.now() - 180000),
        agentId: 'architect'
      },
      {
        id: '4',
        type: 'agent',
        author: 'Mike Frontend',
        content: 'Starting UI development. Creating responsive dashboard components.',
        timestamp: new Date(Date.now() - 120000),
        agentId: 'frontend'
      }
    ]);

    // Initialize code files
    setCodeFiles([
      {
        id: '1',
        name: 'App.tsx',
        path: 'src/App.tsx',
        content: `import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;`,
        language: 'typescript',
        lastModified: new Date(),
        modifiedBy: 'Mike Frontend'
      },
      {
        id: '2',
        name: 'server.js',
        path: 'server/server.js',
        content: `const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`,
        language: 'javascript',
        lastModified: new Date(),
        modifiedBy: 'Lisa Backend'
      }
    ]);

    // Set first file as selected
    setSelectedFile(setCodeFiles[0]);

    // Simulate real-time updates
    const interval = setInterval(() => {
      // Add random agent messages
      const randomAgent = agents[Math.floor(Math.random() * agents.length)];
      if (randomAgent && Math.random() > 0.7) {
        const newMessage: ProjectMessage = {
          id: Date.now().toString(),
          type: 'agent',
          author: randomAgent.name,
          content: `Progress update: ${randomAgent.currentTask} - ${Math.floor(Math.random() * 30 + 70)}% complete`,
          timestamp: new Date(),
          agentId: randomAgent.id
        };
        setMessages(prev => [...prev, newMessage]);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const sendInstruction = () => {
    if (!userInstruction.trim()) return;

    const newMessage: ProjectMessage = {
      id: Date.now().toString(),
      type: 'user',
      author: 'You',
      content: userInstruction,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setUserInstruction('');

    // Simulate agent response
    setTimeout(() => {
      const responseMessage: ProjectMessage = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        author: 'Alex CTO',
        content: `Got it! I'll coordinate with the team to implement: "${userInstruction}"`,
        timestamp: new Date(),
        agentId: 'cto'
      };
      setMessages(prev => [...prev, responseMessage]);
    }, 2000);
  };

  const getAgentStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'working': return 'bg-blue-500';
      case 'idle': return 'bg-gray-400';
      case 'completed': return 'bg-purple-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-900">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Project Building In Progress</h1>
              <p className="text-slate-600 dark:text-slate-400">Task Management App - Real-time Development</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Building
              </Badge>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Preview App
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          <ResizablePanelGroup direction="horizontal">
            {/* Left Panel - Agent Coordination */}
            <ResizablePanel defaultSize={25} minSize={20}>
              <div className="h-full bg-white dark:bg-slate-800 border-r">
                <div className="p-4">
                  <h3 className="font-semibold mb-4 flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Development Team
                  </h3>
                  <ScrollArea className="h-[calc(100vh-200px)]">
                    <div className="space-y-3">
                      {agents.map((agent) => (
                        <motion.div
                          key={agent.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className={`w-3 h-3 rounded-full ${getAgentStatusColor(agent.status)}`}></div>
                            <span className="text-sm font-medium">{agent.avatar} {agent.name}</span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">{agent.role}</p>
                          <p className="text-xs text-slate-700 dark:text-slate-300 mb-2">{agent.currentTask}</p>
                          <Progress value={agent.progress} className="h-1" />
                          <span className="text-xs text-slate-500">{agent.progress}%</span>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle />

            {/* Center Panel - Main Development View */}
            <ResizablePanel defaultSize={50} minSize={40}>
              <div className="h-full">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                  <div className="bg-white dark:bg-slate-800 border-b px-4">
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                      <TabsTrigger value="code" className="text-xs">Code</TabsTrigger>
                      <TabsTrigger value="database" className="text-xs">Database</TabsTrigger>
                      <TabsTrigger value="testing" className="text-xs">Testing</TabsTrigger>
                      <TabsTrigger value="preview" className="text-xs">Preview</TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <TabsContent value="overview" className="h-full p-4">
                      <div className="grid grid-cols-2 gap-4 h-full">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Project Progress</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">Frontend Development</span>
                                  <span className="text-sm">65%</span>
                                </div>
                                <Progress value={65} />
                              </div>
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">Backend Development</span>
                                  <span className="text-sm">45%</span>
                                </div>
                                <Progress value={45} />
                              </div>
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">Database Setup</span>
                                  <span className="text-sm">80%</span>
                                </div>
                                <Progress value={80} />
                              </div>
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-sm">Testing</span>
                                  <span className="text-sm">20%</span>
                                </div>
                                <Progress value={20} />
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Recent Activity</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ScrollArea className="h-60">
                              <div className="space-y-3">
                                {[
                                  { icon: '✅', text: 'Database schema created', time: '2 min ago', user: 'Tom Database' },
                                  { icon: '🔧', text: 'React components updated', time: '5 min ago', user: 'Mike Frontend' },
                                  { icon: '📝', text: 'API endpoints added', time: '8 min ago', user: 'Lisa Backend' },
                                  { icon: '🎨', text: 'UI design refined', time: '12 min ago', user: 'Mike Frontend' },
                                ].map((activity, index) => (
                                  <div key={index} className="flex items-start gap-3">
                                    <span className="text-lg">{activity.icon}</span>
                                    <div className="flex-1">
                                      <p className="text-sm">{activity.text}</p>
                                      <p className="text-xs text-slate-500">{activity.user} • {activity.time}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="code" className="h-full">
                      <div className="h-full flex">
                        {/* File Explorer */}
                        <div className="w-64 bg-slate-50 dark:bg-slate-800 border-r">
                          <div className="p-3 border-b">
                            <h4 className="font-medium flex items-center">
                              <FileText className="h-4 w-4 mr-2" />
                              Project Files
                            </h4>
                          </div>
                          <ScrollArea className="h-[calc(100%-60px)]">
                            <div className="p-2">
                              {codeFiles.map((file) => (
                                <div
                                  key={file.id}
                                  className={`p-2 text-sm cursor-pointer rounded hover:bg-slate-100 dark:hover:bg-slate-700 ${
                                    selectedFile?.id === file.id ? 'bg-blue-100 dark:bg-blue-900' : ''
                                  }`}
                                  onClick={() => setSelectedFile(file)}
                                >
                                  <div className="flex items-center gap-2">
                                    <Code className="h-3 w-3" />
                                    {file.name}
                                  </div>
                                  <p className="text-xs text-slate-500 mt-1">Modified by {file.modifiedBy}</p>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>

                        {/* Code Editor */}
                        <div className="flex-1">
                          {selectedFile ? (
                            <div className="h-full flex flex-col">
                              <div className="bg-slate-100 dark:bg-slate-700 px-4 py-2 border-b">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">{selectedFile.path}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {selectedFile.language}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex-1 p-4">
                                <pre className="text-sm bg-slate-900 text-green-400 p-4 rounded overflow-auto h-full">
                                  <code>{selectedFile.content}</code>
                                </pre>
                              </div>
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center">
                              <p className="text-slate-500">Select a file to view its contents</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="database" className="h-full p-4">
                      <Card className="h-full">
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <Database className="h-5 w-5 mr-2" />
                            Database Schema & Data
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4 h-full">
                            <div>
                              <h4 className="font-medium mb-3">Tables</h4>
                              <div className="space-y-2">
                                {['users', 'tasks', 'projects', 'teams'].map((table) => (
                                  <div key={table} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded">
                                    <span className="text-sm font-mono">{table}</span>
                                    <Badge variant="outline" className="text-xs">Active</Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium mb-3">Sample Data</h4>
                              <div className="bg-slate-900 text-green-400 p-3 rounded text-xs font-mono">
                                <div>SELECT * FROM users LIMIT 5;</div>
                                <div className="mt-2 text-blue-300">
                                  | id | name | email | created_at |<br/>
                                  | 1  | John | john@... | 2024-01-15 |<br/>
                                  | 2  | Jane | jane@... | 2024-01-16 |
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="testing" className="h-full p-4">
                      <Card className="h-full">
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <TestTube className="h-5 w-5 mr-2" />
                            Automated Testing
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded">
                                <div className="text-2xl font-bold text-green-600">12</div>
                                <div className="text-sm text-green-700 dark:text-green-400">Passing</div>
                              </div>
                              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded">
                                <div className="text-2xl font-bold text-red-600">2</div>
                                <div className="text-sm text-red-700 dark:text-red-400">Failing</div>
                              </div>
                              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                                <div className="text-2xl font-bold text-yellow-600">3</div>
                                <div className="text-sm text-yellow-700 dark:text-yellow-400">Pending</div>
                              </div>
                            </div>
                            <div className="bg-slate-900 text-white p-3 rounded text-sm font-mono">
                              <div className="text-green-400">✓ User authentication works</div>
                              <div className="text-green-400">✓ Task creation successful</div>
                              <div className="text-red-400">✗ Email validation failing</div>
                              <div className="text-yellow-400">⏳ Running database tests...</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="preview" className="h-full p-4">
                      <Card className="h-full">
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <Eye className="h-5 w-5 mr-2" />
                            Live App Preview
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="h-full">
                          <div className="h-full bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-4xl mb-4">📱</div>
                              <p className="text-lg font-medium mb-2">App Preview</p>
                              <p className="text-slate-600 dark:text-slate-400 mb-4">Your app will appear here as it's being built</p>
                              <Button>
                                <Play className="h-4 w-4 mr-2" />
                                Launch Preview
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </ResizablePanel>

            <ResizableHandle />

            {/* Right Panel - Communication */}
            <ResizablePanel defaultSize={25} minSize={20}>
              <div className="h-full bg-white dark:bg-slate-800 border-l flex flex-col">
                <div className="p-4 border-b">
                  <h3 className="font-semibold flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Team Communication
                  </h3>
                </div>

                {/* Message History */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    <AnimatePresence>
                      {messages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-3 rounded-lg ${
                            message.type === 'user' 
                              ? 'bg-blue-100 dark:bg-blue-900 ml-4' 
                              : message.type === 'agent'
                              ? 'bg-green-50 dark:bg-green-900/30'
                              : 'bg-gray-50 dark:bg-gray-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {message.type === 'agent' && <Bot className="h-3 w-3" />}
                            <span className="text-sm font-medium">{message.author}</span>
                            <span className="text-xs text-slate-500">
                              {message.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm">{message.content}</p>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </ScrollArea>

                {/* User Input */}
                <div className="p-4 border-t">
                  <div className="space-y-2">
                    <Textarea
                      value={userInstruction}
                      onChange={(e) => setUserInstruction(e.target.value)}
                      placeholder="Give instructions to your development team..."
                      className="min-h-[80px] resize-none"
                    />
                    <Button 
                      onClick={sendInstruction}
                      className="w-full"
                      disabled={!userInstruction.trim()}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Instruction
                    </Button>
                  </div>
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </div>
  );
}