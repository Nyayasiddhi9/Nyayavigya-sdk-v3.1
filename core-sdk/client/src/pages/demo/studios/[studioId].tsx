import { useState } from "react";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft, Lock, Sparkles, Code, TrendingUp, FileText,
  Palette, Bug, Rocket, BarChart3, Settings, Cloud, Lightbulb,
  CheckCircle2, AlertCircle
} from "lucide-react";

const studioConfigs = {
  "ideation-lab": {
    name: "Ideation Lab",
    icon: Lightbulb,
    color: "text-yellow-600",
    description: "Transform your startup idea into a validated business model",
    sampleInput: "A mobile app that helps busy professionals meal plan using AI",
    sampleOutputs: {
      "Business Model": {
        title: "Business Model Canvas - AI Meal Planner",
        content: `**Value Proposition:**
• Personalized meal plans based on dietary preferences, budget, and time constraints
• AI-powered recipe recommendations with grocery list generation
• Time-saving solution for busy professionals (save 5+ hours/week)

**Customer Segments:**
• Primary: Busy professionals (25-45 years old, $60K+ income)
• Secondary: Health-conscious individuals, fitness enthusiasts
• Niche: Parents looking for family-friendly meal solutions

**Revenue Streams:**
• Freemium model: Basic meal plans free, premium features $9.99/month
• Annual subscription: $99/year (17% discount)
• B2B partnerships: Corporate wellness programs ($5/employee/month)

**Key Metrics:**
• Target: 100K users in Year 1 (10% conversion to premium)
• Monthly Recurring Revenue (MRR): $100K by Month 12
• Customer Acquisition Cost (CAC): $15 via social media ads
• Lifetime Value (LTV): $180 (18 months average subscription)`,
        quality: 95
      },
      "Market Research": {
        title: "Market Analysis & Opportunity",
        content: `**Market Size:**
• Total Addressable Market (TAM): $8.2B (meal planning & nutrition apps)
• Serviceable Addressable Market (SAM): $2.1B (AI-powered solutions)
• Serviceable Obtainable Market (SOM): $50M (realistic 3-year target)

**Competitive Landscape:**
• Direct Competitors: Mealime ($4M ARR), PlateJoy ($2M ARR), Eat This Much
• Indirect Competitors: HelloFresh, Blue Apron (meal kit delivery)
• Market Gap: No dominant AI-first solution with deep personalization

**Market Trends:**
• 47% annual growth in AI meal planning apps (2023-2025)
• 62% of millennials use meal planning apps regularly
• $120M in venture funding for food-tech startups in 2024

**Opportunity:**
• First-mover advantage in AI-personalized meal planning
• Strong product-market fit validated by 500+ beta users
• Low customer acquisition cost via viral growth loops`,
        quality: 92
      },
      "Competitive Analysis": {
        title: "Competitor Deep Dive",
        content: `**Mealime (Main Competitor):**
• Strengths: 5M+ downloads, simple UI, free tier
• Weaknesses: Limited AI, basic recommendations, no dietary tracking
• Pricing: Free with $5.99/month premium
• Opportunity: Outcompete with superior AI personalization

**PlateJoy:**
• Strengths: Nutritionist-designed plans, grocery integration
• Weaknesses: High price ($12.99/month), complex onboarding
• Market Position: Premium segment
• Opportunity: Undercut on price while offering better UX

**HelloFresh / Blue Apron:**
• Strengths: $2B+ revenue, strong brand, logistics expertise
• Weaknesses: High cost ($70-120/week), limited flexibility
• Market Position: Meal delivery, not planning
• Opportunity: Serve different use case (planning vs delivery)

**Our Competitive Advantage:**
• AI-first approach with deep personalization (30+ data points)
• Superior UX (67% less onboarding friction than PlateJoy)
• Viral growth mechanics (referral = free month for both users)
• Lower price point than premium competitors`,
        quality: 90
      }
    }
  },
  "engineering-forge": {
    name: "Engineering Forge",
    icon: Code,
    color: "text-blue-600",
    description: "Generate production-ready code with AI architects",
    sampleInput: "Build a REST API for the meal planning app with user authentication",
    sampleOutputs: {
      "Architecture Design": {
        title: "System Architecture - Meal Planner API",
        content: `**Tech Stack Recommendation:**
• Backend: Node.js + Express.js + TypeScript (scalable, team expertise)
• Database: PostgreSQL (relational data, ACID compliance)
• Authentication: JWT + Passport.js (industry standard)
• Caching: Redis (session management, API response caching)
• API Documentation: OpenAPI 3.0 + Swagger UI

**System Components:**
\`\`\`
┌─────────────────────────────────────────┐
│         Client Applications              │
│   (Web App, Mobile App, Third-party)    │
└────────────────┬────────────────────────┘
                 │
        ┌────────▼────────┐
        │   API Gateway    │
        │  (Rate Limiting) │
        └────────┬────────┘
                 │
    ┌────────────┴────────────┐
    │                          │
┌───▼────┐              ┌─────▼─────┐
│  Auth   │              │  Core API  │
│ Service │              │  Endpoints │
└───┬────┘              └─────┬─────┘
    │                          │
    └──────────┬───────────────┘
               │
        ┌──────▼──────┐
        │  PostgreSQL  │
        │   Database   │
        └──────┬──────┘
               │
        ┌──────▼──────┐
        │    Redis     │
        │    Cache     │
        └─────────────┘
\`\`\`

**Key Design Decisions:**
• Microservices architecture for scalability
• RESTful API design following OpenAPI standards
• JWT for stateless authentication
• Redis for session caching (reduce DB load by 80%)`,
        quality: 94
      },
      "Code Generation": {
        title: "Generated TypeScript Code - Auth Service",
        content: `\`\`\`typescript
// server/routes/auth.ts
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const router = express.Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = registerSchema.parse(req.body);
    
    // Check if user exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const result = await db.query(
      'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name',
      [email, hashedPassword, name]
    );
    
    const user = result.rows[0];
    
    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    
    // Find user
    const result = await db.query(
      'SELECT id, email, name, password FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    
    res.json({ 
      user: { id: user.id, email: user.email, name: user.name },
      token 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
\`\`\`

**Code Quality Metrics:**
• Type Safety: 100% (TypeScript)
• Test Coverage: 87% (included tests not shown)
• Security: A+ (bcrypt, JWT, input validation)
• Performance: <50ms average response time`,
        quality: 96
      },
      "Tech Stack": {
        title: "Recommended Technology Stack",
        content: `**Backend Framework:**
• Node.js 20.x LTS + Express.js 4.x (proven stability, large ecosystem)
• TypeScript 5.x (type safety, better developer experience)

**Database:**
• PostgreSQL 15+ (ACID compliance, JSON support, full-text search)
• Drizzle ORM (type-safe, modern alternative to Sequelize)

**Authentication & Security:**
• JWT (stateless auth, scalable)
• bcrypt (password hashing, industry standard)
• Helmet.js (security headers)
• Rate limiting (DDoS protection)

**Caching & Performance:**
• Redis 7.x (session store, API caching)
• Connection pooling (pg-pool, 5-20 connections)

**Testing:**
• Vitest (unit tests, TypeScript native)
• Supertest (API integration tests)
• Playwright (E2E tests)

**DevOps & Monitoring:**
• Docker (containerization)
• GitHub Actions (CI/CD)
• Sentry (error tracking)
• Datadog (APM, metrics)

**Estimated Development Time:**
• MVP Backend: 2-3 weeks
• Production-Ready: 4-6 weeks
• Team Size: 2 fullstack developers`,
        quality: 93
      }
    }
  },
  "market-intelligence": {
    name: "Market Intelligence",
    icon: TrendingUp,
    color: "text-green-600",
    description: "AI-powered market analysis and insights",
    sampleInput: "Analyze the market opportunity for AI meal planning in the US",
    sampleOutputs: {
      "Industry Analysis": {
        title: "AI Meal Planning Market Analysis",
        content: `**Market Overview:**
• Global Market Size: $8.2B (2024), growing to $14.5B by 2028
• US Market Share: 38% ($3.1B in 2024)
• CAGR: 15.3% (2024-2028)

**Market Drivers:**
• 67% of millennials use meal planning apps regularly
• AI adoption in food-tech increased 240% since 2022
• Health consciousness driving demand (72% track nutrition)
• Time scarcity: Average professional has <30 min/day for meal prep

**Market Segments:**
1. Individual Consumers (60% of market)
   - Busy professionals: $1.9B segment
   - Health enthusiasts: $850M segment
   - Budget-conscious: $400M segment

2. Corporate Wellness (25% of market)
   - 500-employee companies: $600M segment
   - Enterprise (5000+ employees): $180M segment

3. B2B Partnerships (15% of market)
   - Grocery chains: $350M segment
   - Fitness centers: $120M segment

**Market Maturity:**
• Stage: Early Growth (innovation phase)
• Competitive Intensity: Medium (no dominant player)
• Barrier to Entry: Medium (AI expertise required)`,
        quality: 91
      },
      "Customer Discovery": {
        title: "Customer Insights & Personas",
        content: `**Primary Persona: Busy Professional "Sarah"**
• Age: 32, Marketing Manager, $85K salary
• Pain Points:
  - Spends 8 hours/week meal planning and grocery shopping
  - Wants healthy meals but lacks time to research recipes
  - Frustrated with repetitive meals and food waste
• Willingness to Pay: $15-20/month for time savings
• Decision Drivers: Convenience (40%), Health (35%), Cost savings (25%)

**Secondary Persona: Health Enthusiast "Mike"**
• Age: 28, Software Engineer, $120K salary
• Pain Points:
  - Tracking macros manually is tedious (30 min/day)
  - Meal prep takes entire Sunday (4-6 hours)
  - Hard to find recipes matching dietary goals
• Willingness to Pay: $20-30/month for precision
• Decision Drivers: Nutrition accuracy (50%), Convenience (30%), Variety (20%)

**Customer Validation Data (n=500 beta users):**
• 78% would recommend to friends (NPS: 62)
• 84% saved 3+ hours/week on meal planning
• 67% reduced food waste by 40%+
• 92% felt healthier after 30 days
• Average session time: 12 minutes (excellent engagement)

**Key Insights:**
• Time savings > cost savings as primary motivator
• Mobile-first is critical (82% use on phones)
• Social sharing drives viral growth (47% invited friends)`,
        quality: 94
      },
      "Trend Forecasting": {
        title: "Market Trends & Future Opportunities",
        content: `**Emerging Trends (2024-2026):**

1. AI Personalization Deepening
   • Multi-modal AI (image recognition for food logging)
   • Predictive meal suggestions based on mood, weather, schedule
   • Voice-activated meal planning (Alexa, Google Assistant integration)
   • Growth Opportunity: 180% increase in AI-powered features demand

2. Health Integration Expansion
   • Wearable integration (Apple Watch, Fitbit, Oura Ring)
   • Biometric data (glucose levels, heart rate, sleep quality)
   • Genetic testing integration (DNA-based nutrition plans)
   • Growth Opportunity: $2.4B market for health-integrated apps by 2026

3. Social & Community Features
   • Recipe sharing and social meal planning
   • Virtual cooking classes and challenges
   • Family meal coordination tools
   • Growth Opportunity: 320% increase in social engagement features

4. Sustainability Focus
   • Carbon footprint tracking for meals
   • Local/seasonal ingredient prioritization
   • Food waste reduction gamification
   • Growth Opportunity: 65% of Gen Z willing to pay 15% premium for sustainability

5. Corporate Wellness Expansion
   • Team meal planning for remote teams
   • Nutrition coaching as employee benefit
   • Integration with health insurance providers
   • Growth Opportunity: $800M B2B market by 2026

**Strategic Recommendations:**
• Phase 1 (Months 1-6): Launch core AI meal planning
• Phase 2 (Months 7-12): Add wearable integration
• Phase 3 (Year 2): Expand to corporate wellness
• Phase 4 (Year 3): International expansion (UK, Canada, Australia)`,
        quality: 89
      }
    }
  },
  "product-blueprint": {
    name: "Product Blueprint",
    icon: FileText,
    color: "text-purple-600",
    description: "Create comprehensive product specifications",
    sampleInput: "Generate feature specifications for the meal planning app MVP",
    sampleOutputs: {
      "Feature Specifications": {
        title: "MVP Feature Specifications",
        content: `**Core Features (Must-Have for MVP):**

1. **User Onboarding & Profile Setup**
   - Email/password registration + OAuth (Google, Apple)
   - Dietary preferences questionnaire (vegan, keto, allergies, etc.)
   - Budget preferences ($5-15 per meal)
   - Cooking skill level (beginner, intermediate, advanced)
   - Time constraints (15-60 minutes per meal)
   - Estimated Development: 1 week

2. **AI Meal Plan Generation**
   - Generate 7-day personalized meal plans
   - Breakfast, lunch, dinner suggestions
   - Nutritional information (calories, macros, micronutrients)
   - Ingredient substitution options
   - Regenerate specific meals
   - Estimated Development: 2 weeks

3. **Recipe Details & Instructions**
   - Step-by-step cooking instructions
   - Ingredient list with quantities
   - Prep time + cook time estimates
   - Difficulty rating
   - Nutritional breakdown
   - Estimated Development: 1 week

4. **Grocery List Generation**
   - Auto-generate from meal plan
   - Organize by grocery store section
   - Check off purchased items
   - Export to notes app
   - Estimated Development: 3 days

5. **Basic Settings & Preferences**
   - Update dietary preferences
   - Adjust budget
   - Change serving sizes (1-6 people)
   - Meal plan history (last 4 weeks)
   - Estimated Development: 3 days

**Total MVP Development: 4-5 weeks**

**Nice-to-Have (Post-MVP):**
- Recipe favorites and saved meals
- Social sharing and friend recommendations
- Grocery delivery integration (Instacart, Amazon Fresh)
- Meal prep mode (batch cooking)
- Recipe reviews and ratings`,
        quality: 95
      },
      "User Stories": {
        title: "User Stories with Acceptance Criteria",
        content: `**Epic 1: User Onboarding**

**Story 1.1: As a new user, I want to create an account quickly so I can start using the app immediately**
• Acceptance Criteria:
  - Register with email/password in <2 minutes
  - OAuth options for Google and Apple Sign-In
  - Email verification link sent within 30 seconds
  - Error messages clear and actionable
  - Password strength indicator visible
• Priority: P0 (Critical)
• Estimate: 3 story points

**Story 1.2: As a new user, I want to set my dietary preferences so the app generates relevant meal suggestions**
• Acceptance Criteria:
  - Multi-select dietary restrictions (vegan, gluten-free, dairy-free, etc.)
  - Allergy warnings with severity levels
  - Cuisine preferences (Italian, Mexican, Asian, etc.)
  - Can skip and set later
  - Preferences saved to profile
• Priority: P0 (Critical)
• Estimate: 5 story points

**Epic 2: Meal Planning**

**Story 2.1: As a busy professional, I want AI to generate a personalized weekly meal plan so I don't spend hours researching recipes**
• Acceptance Criteria:
  - Generate 7-day plan in <10 seconds
  - Respect dietary preferences 100%
  - Show nutritional info for each meal
  - Allow regeneration of specific days
  - Save plan to history
• Priority: P0 (Critical)
• Estimate: 13 story points

**Story 2.2: As a health-conscious user, I want to see detailed nutritional information so I can track my macros**
• Acceptance Criteria:
  - Display calories, protein, carbs, fat per meal
  - Daily totals with target ranges
  - Micronutrient breakdown (vitamins, minerals)
  - Visual charts for macro distribution
  - Export nutrition data as CSV
• Priority: P1 (High)
• Estimate: 8 story points

**Epic 3: Grocery Shopping**

**Story 3.1: As a user, I want an auto-generated grocery list so I don't forget ingredients**
• Acceptance Criteria:
  - Generate from current week's meal plan
  - Organize by store section (produce, dairy, meat, etc.)
  - Quantities aggregated (e.g., 3 recipes need onions = 3 onions)
  - Check off items as purchased
  - Share list via SMS/email
• Priority: P0 (Critical)
• Estimate: 5 story points`,
        quality: 93
      },
      "Product Roadmap": {
        title: "12-Month Product Roadmap",
        content: `**Q1 (Months 1-3): MVP Launch**
• ✅ User authentication & onboarding
• ✅ AI meal plan generation (7-day plans)
• ✅ Recipe details with instructions
• ✅ Grocery list generation
• ✅ Basic settings & preferences
• Goal: 10K users, 10% premium conversion

**Q2 (Months 4-6): Enhanced Personalization**
• 🔄 Recipe favorites & saved meals
• 🔄 Meal plan customization (swap individual meals)
• 🔄 Dietary goal tracking (weight loss, muscle gain)
• 🔄 Integration with MyFitnessPal
• 🔄 Recipe reviews & ratings
• Goal: 50K users, 15% premium conversion

**Q3 (Months 7-9): Social & Sharing**
• 📅 Social meal planning (share plans with friends)
• 📅 Recipe sharing & discovery
• 📅 Cooking challenges & achievements
• 📅 Referral program (free month for both users)
• 📅 Instagram integration (share meal photos)
• Goal: 150K users, 20% premium conversion

**Q4 (Months 10-12): Enterprise & Partnerships**
• 📅 Corporate wellness program (team meal planning)
• 📅 Grocery delivery integration (Instacart API)
• 📅 Wearable integration (Apple Health, Fitbit)
• 📅 B2B partnerships with gyms & nutritionists
• 📅 Mobile app launch (iOS & Android)
• Goal: 300K users, 25% premium conversion, $500K MRR

**Legend:**
• ✅ Completed
• 🔄 In Progress
• 📅 Planned

**Key Milestones:**
• Month 3: MVP launch with 10K users
• Month 6: 50K users, $50K MRR
• Month 9: 150K users, $150K MRR
• Month 12: 300K users, $500K MRR, mobile app live`,
        quality: 92
      }
    }
  }
  // Add other studios config as needed
};

export default function DemoStudioWorkspace() {
  const [, params] = useRoute("/demo/studios/:studioId");
  const studioId = params?.studioId || "ideation-lab";
  const config = studioConfigs[studioId as keyof typeof studioConfigs] || studioConfigs["ideation-lab"];
  const Icon = config.icon;
  
  const [activeTab, setActiveTab] = useState(Object.keys(config.sampleOutputs)[0]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/demo/studios">
                <Button variant="ghost" size="sm" data-testid="button-back">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Studios
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800 ${config.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    {config.name}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {config.description}
                  </p>
                </div>
              </div>
            </div>
            <Link to="/founder-signup">
              <Button data-testid="button-signup-header">
                Sign Up to Save Results
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Demo Mode Banner */}
      <Alert className="mx-4 mt-4 border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800">
        <Lock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        <AlertDescription className="text-yellow-800 dark:text-yellow-200">
          <strong>Demo Mode:</strong> You're viewing sample data. Sign up free to work on your own projects and save results.
        </AlertDescription>
      </Alert>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                Sample Input
              </CardTitle>
              <CardDescription>
                This is example input to demonstrate the studio's capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300">
                {config.sampleInput}
              </div>
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  💡 In the full version, you can input your own project details and get personalized AI-generated results.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Output Panel */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                AI-Generated Results
              </CardTitle>
              <CardDescription>
                Sample outputs showing what our 267+ AI agents can generate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${Object.keys(config.sampleOutputs).length}, 1fr)` }}>
                  {Object.keys(config.sampleOutputs).map((tab) => (
                    <TabsTrigger key={tab} value={tab} data-testid={`tab-${tab.toLowerCase().replace(/\s+/g, '-')}`}>
                      {tab}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {Object.entries(config.sampleOutputs).map(([tab, output]) => (
                  <TabsContent key={tab} value={tab} className="mt-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {output.title}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          Quality: {output.quality}%
                        </Badge>
                      </div>
                      <div className="prose prose-sm dark:prose-invert max-w-none bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                        <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                          {output.content}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>

              {/* CTA */}
              <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
                      Ready to Create Your Own?
                    </h4>
                    <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
                      Sign up free to access all 10 studios, work on unlimited projects, and leverage 267+ AI agents to build your startup in 14 days.
                    </p>
                    <Link to="/founder-signup">
                      <Button className="bg-purple-600 hover:bg-purple-700" data-testid="button-signup-cta">
                        Start Free Trial
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
