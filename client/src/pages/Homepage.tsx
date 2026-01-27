import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Rocket, Zap, Users, Globe, Code2, Bot, LineChart, Shield, 
  Sparkles, ArrowRight, Check, Play, Star, TrendingUp
} from 'lucide-react';
import { useLocation } from 'wouter';

export default function Homepage() {
  const [, setLocation] = useLocation();
  const activeAgents = "267+";

  const studios = [
    { icon: Sparkles, name: 'Ideation Lab', description: 'AI-powered idea validation & market research', agents: 25 },
    { icon: Code2, name: 'Code Factory', description: 'Autonomous code generation & development', agents: 45 },
    { icon: Bot, name: 'Design Studio', description: 'UI/UX design with multimodal AI', agents: 30 },
    { icon: Shield, name: 'Testing Arena', description: 'Automated testing & QA', agents: 20 },
    { icon: Rocket, name: 'Deployment Hub', description: 'One-click multi-cloud deployment', agents: 15 },
    { icon: LineChart, name: 'Analytics Engine', description: 'Real-time metrics & insights', agents: 18 },
    { icon: Globe, name: 'Integration Hub', description: 'Connect to 100+ services', agents: 22 },
    { icon: TrendingUp, name: 'Growth Studio', description: 'Marketing & user acquisition', agents: 20 },
    { icon: Users, name: 'Support Network', description: '24/7 AI assistance', agents: 15 },
  ];

  const features = [
    { title: '267+ AI Agents', description: '105 WAI Core + 79 Geminiflow + 83+ specialized agents working for you 24/7', icon: Bot },
    { title: '23+ LLM Providers', description: '752+ models including GPT-4, Claude, Gemini, KIMI K2 for 90% cost savings', icon: Zap },
    { title: '14-Day MVPs', description: 'From idea to production-ready MVP in 2 weeks vs 3+ months manual development', icon: Rocket },
    { title: 'Autonomous Execution', description: 'AI agents handle design, code, testing, deployment automatically', icon: Sparkles },
    { title: 'Multi-Cloud Deploy', description: 'One-click deployment to AWS, GCP, Azure with auto-scaling', icon: Globe },
    { title: 'Enterprise Security', description: 'SOC2, GDPR, CCPA compliant with encryption at rest & in transit', icon: Shield },
  ];

  const testimonials = [
    {
      quote: "We went from idea to paying customers in 12 days. The AI agents built our entire SaaS platform.",
      author: "Sarah Chen",
      company: "DataFlow AI",
      role: "Founder & CEO",
      stat: "Raised $2M seed"
    },
    {
      quote: "The investor matching alone saved us 3 months of cold outreach. We got 15 warm intros in week 1.",
      author: "Marcus Johnson",
      company: "FinTech Ventures",
      role: "Co-Founder",
      stat: "$500K raised"
    },
    {
      quote: "267+ AI agents working on our product 24/7? Game changer. We ship 10x faster than our competitors.",
      author: "Priya Patel",
      company: "HealthTech Solutions",
      role: "CTO",
      stat: "100K+ users"
    },
  ];

  const stats = [
    { value: '267+', label: 'AI Agents', sublabel: 'Working 24/7' },
    { value: '14', label: 'Days', sublabel: 'Idea to MVP' },
    { value: '23+', label: 'LLM Providers', sublabel: '752+ models' },
    { value: '90%', label: 'Cost Savings', sublabel: 'Via KIMI K2' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg border-b border-white/10 bg-gray-950/80">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Rocket className="h-8 w-8 text-blue-500" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                Wizards
              </span>
              <Badge variant="outline" className="border-green-500/50 text-green-400 ml-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2" />
                {activeAgents} Active Agents
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => setLocation('/login')} data-testid="link-login">
                Sign In
              </Button>
              <Button 
                onClick={() => setLocation('/login')} 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                data-testid="button-get-started"
              >
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-purple-900/10 to-transparent" />
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/10 opacity-50" />
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
        
        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-6 text-sm bg-blue-500/10 border-blue-500/30 text-blue-400" data-testid="badge-tagline">
              World's First AI-Native Startup Accelerator
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight" data-testid="text-hero-title">
              Transform Ideas into
              <br />
              <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Production MVPs
              </span>
              <br />
              in 14 Days
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto" data-testid="text-hero-subtitle">
              Powered by 267+ AI agents, 23+ LLM providers, and autonomous execution.
              Join the accelerator that builds, tests, and deploys your startup while you sleep.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                size="lg"
                onClick={() => setLocation('/login')}
                className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                data-testid="button-start-building"
              >
                <Rocket className="mr-2 h-5 w-5" />
                Start Building
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-white/20 hover:bg-white/10"
                data-testid="button-watch-demo"
              >
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>

            {/* Floating Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                >
                  <Card className="bg-white/5 border-white/10 backdrop-blur-sm" data-testid={`card-stat-${stat.label.toLowerCase()}`}>
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl font-bold text-blue-400 mb-1">{stat.value}</div>
                      <div className="text-sm font-semibold text-white">{stat.label}</div>
                      <div className="text-xs text-gray-400">{stat.sublabel}</div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-features-title">
              Why Choose Wizards?
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              The only accelerator with autonomous AI agents that code, test, and deploy your product 24/7
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card className="bg-gradient-to-br from-white/5 to-white/0 border-white/10 hover:border-blue-500/50 transition-all group h-full" data-testid={`card-feature-${i}`}>
                  <CardContent className="p-8">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <feature.icon className="h-6 w-6 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-gray-400">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Studios Showcase */}
      <section className="py-24 px-6 bg-gradient-to-b from-gray-900 to-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-studios-title">
              10 Specialized Studios
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Each studio powered by AI agents trained for specific tasks in your startup journey
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {studios.map((studio, i) => (
              <motion.div
                key={studio.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/10 border-blue-500/20 hover:border-blue-500/50 transition-all group" data-testid={`card-studio-${i}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <studio.icon className="h-6 w-6 text-blue-300" />
                      </div>
                      <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 text-xs">
                        {studio.agents} agents
                      </Badge>
                    </div>
                    <h3 className="text-lg font-bold mb-2">{studio.name}</h3>
                    <p className="text-sm text-gray-400">{studio.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0">
          <div className="w-full h-full bg-gradient-to-br from-green-900/10 via-blue-900/10 to-purple-900/10" />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-testimonials-title">
              Founder Success Stories
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Real founders building real companies with AI acceleration
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={testimonial.author}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card className="bg-gradient-to-br from-white/5 to-white/0 border-white/10 h-full backdrop-blur-sm" data-testid={`card-testimonial-${i}`}>
                  <CardContent className="p-8">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                      ))}
                    </div>
                    <blockquote className="text-gray-300 mb-6 italic">
                      "{testimonial.quote}"
                    </blockquote>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold">{testimonial.author}</div>
                        <div className="text-sm text-gray-400">{testimonial.role}</div>
                        <div className="text-xs text-gray-500">{testimonial.company}</div>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        {testimonial.stat}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-cta-title">
              Ready to Build the Future?
            </h2>
            <p className="text-xl text-gray-400 mb-8">
              Join 500+ founders using AI to build, launch, and scale their startups
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => setLocation('/login')}
                className="text-lg px-10 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                data-testid="button-start-free"
              >
                Start Free Today
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="text-lg px-10 py-6 border-white/20 hover:bg-white/10"
                onClick={() => window.open('https://calendar.app.google/wizards-demo', '_blank')}
                data-testid="button-book-demo"
              >
                Book a Demo
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-6">
              ✓ No credit card required ✓ 14-day free trial ✓ Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Rocket className="h-6 w-6 text-blue-500" />
                <span className="text-xl font-bold">Wizards</span>
              </div>
              <p className="text-sm text-gray-400">
                World's first AI-native startup accelerator. Transform ideas into MVPs in 14 days.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Studios</a></li>
                <li><a href="#" className="hover:text-white transition-colors">AI Agents</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Enterprise</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 Wizards Incubator. Powered by WAI SDK v1.0. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
