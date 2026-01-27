import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Rocket, Bot, Sparkles, Zap, Globe, Brain, Code, Workflow } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function IndexLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(222,47%,11%)] via-[hsl(270,75%,15%)] to-[hsl(222,47%,11%)]">
      {/* Hero Section */}
      <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-transparent"></div>
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.5, 0.3, 0.5],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center justify-center gap-2 mb-6">
              <Sparkles className="w-8 h-8 text-purple-400" />
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white">
                World's First Universal Agent Ecosystem
              </h1>
              <Sparkles className="w-8 h-8 text-blue-400" />
            </div>
            
            <p className="text-xl sm:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto">
              Powered by WAI SDK v1.0 — 267+ Agents, 102 Tools, 23+ LLMs
            </p>
            
            <p className="text-lg text-gray-400 mb-12 max-w-4xl mx-auto">
              One platform to build everything. No more tools.
            </p>

            {/* Floating Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-wrap justify-center gap-4 sm:gap-8 mb-16"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/20">
                <div className="text-3xl font-bold text-purple-400">267+</div>
                <div className="text-sm text-gray-300">AI Agents</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/20">
                <div className="text-3xl font-bold text-blue-400">102</div>
                <div className="text-sm text-gray-300">Tools</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/20">
                <div className="text-3xl font-bold text-teal-400">23+</div>
                <div className="text-sm text-gray-300">LLM Providers</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/20">
                <div className="text-3xl font-bold text-pink-400">10</div>
                <div className="text-sm text-gray-300">Studios</div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Platform Selection Cards */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 -mt-32">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Wizards Incubator Card */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            whileHover={{ scale: 1.02, y: -8 }}
          >
            <Card 
              className="h-full bg-gradient-to-br from-purple-500/10 to-purple-900/10 border-purple-500/30 backdrop-blur-sm hover:border-purple-400/50 transition-all duration-300 shadow-2xl group"
              data-testid="card-incubator"
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition-colors">
                    <Rocket className="w-8 h-8 text-purple-400" />
                  </div>
                  <CardTitle className="text-3xl font-bold text-white">
                    Wizards Incubator
                  </CardTitle>
                </div>
                <CardDescription className="text-lg text-gray-300">
                  Transform your startup idea into a production-ready MVP in just 14 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-white font-semibold">10 Specialized Studios</p>
                      <p className="text-sm text-gray-400">From ideation to deployment, every step automated</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Brain className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-white font-semibold">267+ AI Agents</p>
                      <p className="text-sm text-gray-400">Working 24/7 to build your vision</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Workflow className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-white font-semibold">100% SDLC Automation</p>
                      <p className="text-sm text-gray-400">End-to-end development lifecycle</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Link href="/founder-dashboard">
                    <Button 
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white text-lg py-6 rounded-xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all"
                      data-testid="button-enter-incubator"
                    >
                      <Rocket className="w-5 h-5 mr-2" />
                      Enter Incubator
                    </Button>
                  </Link>
                  <Link href="/demo/studios">
                    <Button 
                      variant="outline" 
                      className="w-full border-purple-500/50 text-purple-300 hover:bg-purple-500/10 hover:border-purple-400 py-6 rounded-xl"
                      data-testid="button-try-demo-incubator"
                    >
                      Try Demo (No Login)
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* SHAKTI AI Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            whileHover={{ scale: 1.02, y: -8 }}
          >
            <Card 
              className="h-full bg-gradient-to-br from-blue-500/10 to-cyan-900/10 border-blue-500/30 backdrop-blur-sm hover:border-blue-400/50 transition-all duration-300 shadow-2xl group"
              data-testid="card-shakti-ai"
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors">
                    <Bot className="w-8 h-8 text-blue-400" />
                  </div>
                  <CardTitle className="text-3xl font-bold text-white">
                    SHAKTI AI
                  </CardTitle>
                </div>
                <CardDescription className="text-lg text-gray-300">
                  Deploy your entire cloud company from a single platform. Semantic code + microservices + video ads.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Code className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-white font-semibold">LSP Semantic Coding</p>
                      <p className="text-sm text-gray-400">90% token reduction vs Replit</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-white font-semibold">Cloud Deployment</p>
                      <p className="text-sm text-gray-400">AWS, GCP, Azure microservices</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-white font-semibold">500+ Tools & 30+ Sectors</p>
                      <p className="text-sm text-gray-400">Finance, Healthcare, Legal, Marketing</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Link href="/superagent">
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-6 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all"
                      data-testid="button-launch-shakti"
                    >
                      <Bot className="w-5 h-5 mr-2" />
                      Launch SHAKTI AI
                    </Button>
                  </Link>
                  <Link href="/superagent/demo">
                    <Button 
                      variant="outline" 
                      className="w-full border-blue-500/50 text-blue-300 hover:bg-blue-500/10 hover:border-blue-400 py-6 rounded-xl"
                      data-testid="button-try-demo-shakti"
                    >
                      Try Demo (No Login)
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* WAI SDK Engine Card */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            whileHover={{ scale: 1.02, y: -8 }}
          >
            <Card 
              className="h-full bg-gradient-to-br from-teal-500/10 to-emerald-900/10 border-teal-500/30 backdrop-blur-sm hover:border-teal-400/50 transition-all duration-300 shadow-2xl group"
              data-testid="card-wai-sdk"
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-teal-500/20 rounded-xl group-hover:bg-teal-500/30 transition-colors">
                    <Code className="w-8 h-8 text-teal-400" />
                  </div>
                  <CardTitle className="text-3xl font-bold text-white">
                    WAI SDK Engine
                  </CardTitle>
                </div>
                <CardDescription className="text-lg text-gray-300">
                  Enterprise orchestration engine. 23+ LLM providers, 752+ models, multimodal AI.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Brain className="w-5 h-5 text-teal-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-white font-semibold">267+ Specialized Agents</p>
                      <p className="text-sm text-gray-400">BMAD 2.0, ROMA L1-L4 autonomy</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-teal-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-white font-semibold">102 Production Tools</p>
                      <p className="text-sm text-gray-400">Voice, video, image, code, security</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Workflow className="w-5 h-5 text-teal-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-white font-semibold">A2A Collaboration Bus</p>
                      <p className="text-sm text-gray-400">Agent-to-agent coordination</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Link href="/orchestration-dashboard">
                    <Button 
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white text-lg py-6 rounded-xl shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 transition-all"
                      data-testid="button-explore-sdk"
                    >
                      <Code className="w-5 h-5 mr-2" />
                      Explore SDK
                    </Button>
                  </Link>
                  <Link href="/wai-capabilities">
                    <Button 
                      variant="outline" 
                      className="w-full border-teal-500/50 text-teal-300 hover:bg-teal-500/10 hover:border-teal-400 py-6 rounded-xl"
                      data-testid="button-view-capabilities"
                    >
                      View Capabilities
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Key Differentiators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <h2 className="text-3xl font-bold text-white mb-8">
            Why Choose Wizards AI Platform?
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {[
              { label: 'Multi-Agent\nOrchestration', icon: Brain },
              { label: 'Contextual\nEngineering', icon: Sparkles },
              { label: 'Multi-Lingual\nSupport', icon: Globe },
              { label: 'Easy-to-Use\nTools', icon: Zap },
              { label: 'Mobile + Web\nReady', icon: Code },
              { label: 'Always-Available\nAssistant', icon: Bot },
              { label: 'Replit-like\nIDE', icon: Workflow },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:border-white/30 transition-colors"
              >
                <item.icon className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <p className="text-xs text-gray-300 whitespace-pre-line">{item.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
