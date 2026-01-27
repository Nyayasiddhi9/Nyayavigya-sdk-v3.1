import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Rocket, Bot, Sparkles, Zap, Globe, Brain, Code, Workflow, ArrowRight, TrendingUp, Shield } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GlassmorphicCard, GradientButton, PulseStatusIndicator, AnimatedMetric } from '@/components/animated';

export default function IndexLanding() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Light Mode with Gradient Text */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Subtle Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-white"></div>
          <motion.div
            className="absolute top-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"
            animate={{
              scale: [1, 1.1, 1],
              x: [0, 30, 0],
              y: [0, -20, 0],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-1/3 left-1/3 w-[500px] h-[500px] bg-gradient-to-tr from-purple-200/20 to-pink-200/20 rounded-full blur-3xl"
            animate={{
              scale: [1.1, 1, 1.1],
              x: [0, -40, 0],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Powered by WAI SDK v1.0</span>
              <PulseStatusIndicator status="success" />
            </motion.div>
            
            {/* Gradient Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">
              <span className="gradient-text">World's First Universal</span>
              <br />
              <span className="gradient-text">Agent Ecosystem</span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-foreground-secondary mb-4 max-w-3xl mx-auto leading-relaxed">
              Build, deploy, and scale AI-powered applications with 267+ specialized agents, 102 production tools, and 23+ LLM providers
            </p>
            
            <p className="text-lg text-foreground-tertiary mb-12 max-w-2xl mx-auto">
              One platform to build everything. No more juggling tools.
            </p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap justify-center gap-4 mb-16"
            >
              <GradientButton 
                size="lg"
                gradient="primary"
                data-testid="button-get-started"
                className="group"
                onClick={() => setLocation('/founder-signup')}
              >
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </GradientButton>
              <Button 
                size="lg" 
                variant="outline" 
                className="glass border-2"
                data-testid="button-watch-demo"
                onClick={() => setLocation('/wizards-platform')}
              >
                Watch Demo
              </Button>
            </motion.div>

            {/* Floating Glassmorphic Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {[
                { value: '267+', label: 'AI Agents', icon: Bot, color: 'text-blue-600' },
                { value: '102', label: 'Production Tools', icon: Code, color: 'text-purple-600' },
                { value: '23+', label: 'LLM Providers', icon: Brain, color: 'text-green-600' },
                { value: '10', label: 'Specialized Studios', icon: Workflow, color: 'text-pink-600' },
              ].map((metric, idx) => (
                <AnimatedMetric
                  key={idx}
                  value={metric.value}
                  label={metric.label}
                  icon={metric.icon}
                  iconColor={metric.color}
                  delay={0.5 + idx * 0.1}
                  data-testid={`metric-${metric.label.toLowerCase().replace(/\s+/g, '-')}`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Platform Selection - 2 Flagship Platforms */}
      <section className="relative pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold mb-4">
              <span className="gradient-text">Two Flagship Platforms</span>
            </h2>
            <p className="text-lg text-foreground-secondary max-w-2xl mx-auto">
              One unified ecosystem, powered by WAI SDK v1.0
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Wizards Incubator Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -8 }}
            >
              <Card 
                className="h-full glass-card gradient-border group cursor-pointer"
                data-testid="card-incubator"
              >
                <CardHeader>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 gradient-primary rounded-xl shadow-lg">
                      <Rocket className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-foreground">
                      Wizards Incubator
                    </CardTitle>
                  </div>
                  <CardDescription className="text-base text-foreground-secondary">
                    Transform your startup idea into a production-ready MVP in just 14 days
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 gradient-primary rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Zap className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="text-foreground font-semibold">10 Specialized Studios</p>
                      <p className="text-sm text-foreground-tertiary">From ideation to deployment, every step automated</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 gradient-primary rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                      <TrendingUp className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="text-foreground font-semibold">100% SDLC Automation</p>
                      <p className="text-sm text-foreground-tertiary">AI handles code, design, testing, deployment</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 gradient-primary rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Globe className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="text-foreground font-semibold">Investor Matching</p>
                      <p className="text-sm text-foreground-tertiary">AI-powered connection to 10,000+ investors</p>
                    </div>
                  </div>
                  <GradientButton
                    gradient="primary"
                    className="w-full mt-4 group"
                    data-testid="button-launch-incubator"
                    onClick={() => setLocation('/wizards-platform')}
                  >
                    Launch Incubator
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </GradientButton>
                </CardContent>
              </Card>
            </motion.div>

            {/* SHAKTI AI - Universal Agent Platform Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -8 }}
            >
              <Card 
                className="h-full glass-card gradient-border group cursor-pointer"
                data-testid="card-shakti"
              >
                <CardHeader>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 gradient-accent rounded-xl shadow-lg">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-foreground">
                      SHAKTI AI
                    </CardTitle>
                  </div>
                  <CardDescription className="text-base text-foreground-secondary">
                    Universal Agent Platform with Super Agent, GenPark search, 500+ tools, and multi-modal capabilities
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 gradient-accent rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Brain className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="text-foreground font-semibold">500+ MCP Tools & Super Agent</p>
                      <p className="text-sm text-foreground-tertiary">Code, design, research, multi-modal generation</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 gradient-accent rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Code className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="text-foreground font-semibold">LSP Semantic Coding</p>
                      <p className="text-sm text-foreground-tertiary">90% token reduction vs competitors</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 gradient-accent rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Globe className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="text-foreground font-semibold">GenPark-like Search & Research</p>
                      <p className="text-sm text-foreground-tertiary">Deep research with multi-source synthesis</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 gradient-accent rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Workflow className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="text-foreground font-semibold">Multi-Modal AI (Text, Image, Audio, Video)</p>
                      <p className="text-sm text-foreground-tertiary">Veo3.1, DALL-E 3, ElevenLabs integration</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 gradient-accent rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Shield className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="text-foreground font-semibold">Enterprise Security & Microservices</p>
                      <p className="text-sm text-foreground-tertiary">OWASP compliance, deploy entire cloud companies</p>
                    </div>
                  </div>
                  <GradientButton
                    gradient="accent"
                    className="w-full mt-4 group"
                    data-testid="button-open-shakti"
                    onClick={() => setLocation('/shakti-ai')}
                  >
                    Open SHAKTI AI
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </GradientButton>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="bg-gradient-to-br from-purple-50 via-blue-50 to-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">
              <span className="gradient-text">Powered by WAI SDK v1.0</span>
            </h2>
            <p className="text-lg text-foreground-secondary max-w-2xl mx-auto">
              Enterprise-grade AI orchestration at your fingertips
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: '267+ Autonomous Agents',
                description: 'Specialized agents for every task - from code review to customer support',
                icon: Bot,
              },
              {
                title: '23+ LLM Providers',
                description: 'Access Claude 4.5, GPT-5, Gemini 3.0, and 20+ other cutting-edge models',
                icon: Brain,
              },
              {
                title: 'Production-Ready Tools',
                description: '102 battle-tested tools for web scraping, data processing, and multimodal generation',
                icon: Code,
              },
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="glass-card text-center"
              >
                <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-foreground-secondary">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
