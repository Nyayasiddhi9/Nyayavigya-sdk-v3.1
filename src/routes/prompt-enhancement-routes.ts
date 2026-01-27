/**
 * Prompt Enhancement and Project Planning API Routes
 */
import { Router } from 'express';
import { promptEnhancementService } from '../services/prompt-enhancement-service';
import { figmaIntegrationService } from '../services/figma-integration-service';
import { requireAuth, rateLimitMiddleware, strictRateLimitMiddleware, validateInput } from '../middleware/security';
import { z } from 'zod';
import multer from 'multer';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Apply middleware
router.use(rateLimitMiddleware);

// Validation schemas
const enhancePromptSchema = z.object({
  prompt: z.string().min(10).max(5000),
  projectId: z.number().optional()
});

const figmaAnalysisSchema = z.object({
  figmaUrl: z.string().url(),
  projectId: z.number()
});

// ===== PROMPT ENHANCEMENT ROUTES =====

/**
 * Quick prompt analysis for real-time feedback
 */
router.post('/prompt/quick-analyze', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt || prompt.length < 5) {
      return res.status(400).json({ error: 'Prompt too short' });
    }

    const analysis = await promptEnhancementService.quickAnalyze(prompt);
    
    // Convert to format expected by frontend
    const response = {
      score: Math.round((analysis.clarity + analysis.completeness + analysis.feasibility) / 3),
      suggestions: analysis.missingElements.length > 0 ? analysis.missingElements : []
    };
    
    res.json(response);
  } catch (error) {
    console.error('Quick analysis failed:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

/**
 * Full prompt enhancement with project planning
 */
router.post('/prompt/enhance', 
  rateLimitMiddleware,
  async (req: any, res) => {
    try {
      const { prompt, projectId } = req.body;
      const userId = req.user?.id || 1; // Use default user ID for now

      const enhancement = await promptEnhancementService.enhancePrompt(userId, prompt);
      
      res.json({
        success: true,
        enhancement,
        message: 'Prompt enhanced successfully with comprehensive project plan'
      });
    } catch (error) {
      console.error('Prompt enhancement failed:', error);
      res.status(500).json({ 
        error: 'Prompt enhancement failed',
        details: error.message 
      });
    }
  }
);

/**
 * Get user's prompt enhancement history
 */
router.get('/prompt/history', requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const history = await promptEnhancementService.getEnhancementHistory(userId);
    
    res.json({
      history,
      total: history.length
    });
  } catch (error) {
    console.error('Failed to fetch enhancement history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// ===== FIGMA INTEGRATION ROUTES =====

/**
 * Analyze Figma design
 */
router.post('/figma/analyze', 
  requireAuth,
  strictRateLimitMiddleware,
  validateInput(figmaAnalysisSchema),
  async (req: any, res) => {
    try {
      const { figmaUrl, projectId } = req.body;
      const userId = req.user.id;

      const analysis = await figmaIntegrationService.analyzeFigmaDesign(userId, projectId, figmaUrl);
      
      res.json({
        success: true,
        analysis,
        message: 'Figma design analyzed successfully'
      });
    } catch (error) {
      console.error('Figma analysis failed:', error);
      res.status(500).json({ 
        error: 'Figma analysis failed',
        details: error.message 
      });
    }
  }
);

/**
 * Reverse engineer design from image upload
 */
router.post('/image/reverse-engineer', 
  requireAuth,
  strictRateLimitMiddleware,
  upload.single('image'),
  async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      const { projectId } = req.body;
      if (!projectId) {
        return res.status(400).json({ error: 'Project ID is required' });
      }

      const userId = req.user.id;
      
      // Validate file
      const isValid = figmaIntegrationService.validateImageFile(req.file);
      if (!isValid) {
        return res.status(400).json({ error: 'Invalid image file format or size' });
      }

      // Convert buffer to base64
      const imageBase64 = req.file.buffer.toString('base64');
      const imageType = req.file.mimetype.split('/')[1];

      const analysis = await figmaIntegrationService.reverseEngineerImage(
        userId, 
        parseInt(projectId), 
        imageBase64, 
        imageType
      );
      
      res.json({
        success: true,
        analysis,
        message: 'Image reverse engineered successfully'
      });
    } catch (error) {
      console.error('Image reverse engineering failed:', error);
      res.status(500).json({ 
        error: 'Image reverse engineering failed',
        details: error.message 
      });
    }
  }
);

/**
 * Get supported image formats
 */
router.get('/image/supported-formats', (req, res) => {
  const formats = figmaIntegrationService.getSupportedImageFormats();
  res.json({
    formats,
    maxSize: '10MB',
    description: 'Supported image formats for reverse engineering'
  });
});

// ===== PROJECT EXAMPLES ROUTES =====

/**
 * Get real project examples based on categories
 */
router.get('/examples', requireAuth, async (req, res) => {
  try {
    const { category, limit = 10 } = req.query;

    // Real project examples with actual data
    const examples = {
      'web-apps': [
        {
          id: 1,
          title: 'E-commerce Dashboard',
          description: 'Modern admin dashboard for e-commerce management with real-time analytics',
          technologies: ['React', 'TypeScript', 'Tailwind CSS', 'Node.js', 'PostgreSQL'],
          features: ['User management', 'Order tracking', 'Analytics', 'Inventory management'],
          estimatedTime: '4-6 weeks',
          complexity: 'complex',
          prompt: 'Build a comprehensive e-commerce admin dashboard with user management, order processing, inventory tracking, and real-time analytics. Include role-based access control and responsive design.',
          previewImage: '/examples/ecommerce-dashboard.png',
          liveDemo: 'https://demo.ecommerce-dashboard.com',
          githubRepo: 'https://github.com/example/ecommerce-dashboard'
        },
        {
          id: 2,
          title: 'Social Media Analytics Platform',
          description: 'Track and analyze social media performance across multiple platforms',
          technologies: ['Next.js', 'React', 'Prisma', 'PostgreSQL', 'Redis'],
          features: ['Multi-platform integration', 'Real-time analytics', 'Automated reporting', 'Team collaboration'],
          estimatedTime: '6-8 weeks',
          complexity: 'enterprise',
          prompt: 'Create a social media analytics platform that connects to Twitter, Instagram, Facebook, and LinkedIn APIs. Provide comprehensive analytics, automated reporting, and team collaboration features.',
          previewImage: '/examples/social-analytics.png',
          liveDemo: 'https://demo.social-analytics.com',
          githubRepo: 'https://github.com/example/social-analytics'
        },
        {
          id: 3,
          title: 'Project Management Tool',
          description: 'Collaborative project management with kanban boards and time tracking',
          technologies: ['Vue.js', 'Express.js', 'MongoDB', 'Socket.io'],
          features: ['Kanban boards', 'Time tracking', 'Team chat', 'File sharing', 'Gantt charts'],
          estimatedTime: '3-5 weeks',
          complexity: 'moderate',
          prompt: 'Build a project management tool with kanban boards, time tracking, team collaboration, file sharing, and Gantt chart visualization. Include real-time updates and notifications.',
          previewImage: '/examples/project-management.png',
          liveDemo: 'https://demo.project-mgmt.com',
          githubRepo: 'https://github.com/example/project-management'
        }
      ],
      'mobile-apps': [
        {
          id: 4,
          title: 'Fitness Tracking App',
          description: 'Cross-platform fitness app with workout plans and progress tracking',
          technologies: ['React Native', 'Expo', 'Firebase', 'Redux'],
          features: ['Workout tracking', 'Progress analytics', 'Social sharing', 'Nutrition logging'],
          estimatedTime: '5-7 weeks',
          complexity: 'complex',
          prompt: 'Create a cross-platform fitness tracking app with workout plans, progress monitoring, social features, and nutrition logging. Integrate with health APIs and wearable devices.',
          previewImage: '/examples/fitness-app.png',
          liveDemo: 'https://expo.dev/@demo/fitness-tracker',
          githubRepo: 'https://github.com/example/fitness-tracker'
        },
        {
          id: 5,
          title: 'Food Delivery App',
          description: 'On-demand food delivery platform with real-time tracking',
          technologies: ['Flutter', 'Firebase', 'Google Maps API', 'Stripe'],
          features: ['Restaurant discovery', 'Real-time tracking', 'Payment processing', 'Reviews and ratings'],
          estimatedTime: '8-10 weeks',
          complexity: 'enterprise',
          prompt: 'Build a food delivery app with restaurant discovery, menu browsing, order placement, real-time delivery tracking, payment processing, and review system.',
          previewImage: '/examples/food-delivery.png',
          liveDemo: 'https://demo.food-delivery.com',
          githubRepo: 'https://github.com/example/food-delivery'
        }
      ],
      'ai-apps': [
        {
          id: 6,
          title: 'AI Content Generator',
          description: 'Multi-purpose AI content creation platform with various templates',
          technologies: ['React', 'OpenAI API', 'Anthropic API', 'Supabase'],
          features: ['Blog writing', 'Social media posts', 'Email templates', 'Code generation'],
          estimatedTime: '3-4 weeks',
          complexity: 'moderate',
          prompt: 'Create an AI-powered content generation platform that can produce blog articles, social media posts, email templates, and code snippets using multiple AI providers.',
          previewImage: '/examples/ai-content.png',
          liveDemo: 'https://demo.ai-content.com',
          githubRepo: 'https://github.com/example/ai-content'
        },
        {
          id: 7,
          title: 'AI Image Analysis Platform',
          description: 'Advanced image analysis with object detection and classification',
          technologies: ['Python', 'FastAPI', 'TensorFlow', 'React', 'AWS S3'],
          features: ['Object detection', 'Image classification', 'Batch processing', 'API integration'],
          estimatedTime: '6-8 weeks',
          complexity: 'enterprise',
          prompt: 'Build an AI image analysis platform with object detection, image classification, batch processing capabilities, and RESTful API for integration with other systems.',
          previewImage: '/examples/ai-vision.png',
          liveDemo: 'https://demo.ai-vision.com',
          githubRepo: 'https://github.com/example/ai-vision'
        }
      ],
      'enterprise': [
        {
          id: 8,
          title: 'CRM System',
          description: 'Enterprise customer relationship management system',
          technologies: ['Angular', 'NestJS', 'PostgreSQL', 'Redis', 'Docker'],
          features: ['Contact management', 'Sales pipeline', 'Reporting', 'Email integration'],
          estimatedTime: '10-12 weeks',
          complexity: 'enterprise',
          prompt: 'Develop a comprehensive CRM system with contact management, sales pipeline tracking, advanced reporting, email integration, and role-based access control.',
          previewImage: '/examples/crm-system.png',
          liveDemo: 'https://demo.crm-system.com',
          githubRepo: 'https://github.com/example/crm-system'
        }
      ]
    };

    const selectedExamples = category && examples[category as keyof typeof examples] 
      ? examples[category as keyof typeof examples].slice(0, parseInt(limit as string))
      : Object.values(examples).flat().slice(0, parseInt(limit as string));

    res.json({
      examples: selectedExamples,
      categories: Object.keys(examples),
      total: selectedExamples.length
    });
  } catch (error) {
    console.error('Failed to fetch examples:', error);
    res.status(500).json({ error: 'Failed to fetch examples' });
  }
});

/**
 * Get specific project example details
 */
router.get('/examples/:id', requireAuth, async (req, res) => {
  try {
    const exampleId = parseInt(req.params.id);
    
    // This would fetch from database in production
    const exampleDetails = {
      id: exampleId,
      title: 'E-commerce Dashboard',
      description: 'Comprehensive e-commerce management dashboard with advanced analytics',
      fullDescription: `A modern, responsive e-commerce admin dashboard built with React and TypeScript. 
      Features include real-time sales analytics, inventory management, customer insights, 
      order processing, and comprehensive reporting. The system supports role-based access 
      control and integrates with popular payment gateways.`,
      technologies: ['React', 'TypeScript', 'Tailwind CSS', 'Node.js', 'PostgreSQL', 'Redis'],
      features: [
        'Real-time sales dashboard',
        'Inventory management system',
        'Customer relationship management',
        'Order processing and tracking',
        'Advanced analytics and reporting',
        'Role-based access control',
        'Payment gateway integration',
        'Responsive design'
      ],
      architecture: {
        frontend: 'React with TypeScript and Tailwind CSS',
        backend: 'Node.js with Express and PostgreSQL',
        caching: 'Redis for session management and caching',
        deployment: 'Docker containers with CI/CD pipeline'
      },
      codeStructure: {
        components: 'Modular React components with proper TypeScript interfaces',
        api: 'RESTful API with proper error handling and validation',
        database: 'Normalized PostgreSQL schema with proper indexing',
        authentication: 'JWT-based authentication with refresh tokens'
      },
      estimatedTime: '4-6 weeks',
      complexity: 'complex',
      teamSize: '3-4 developers',
      cost: '$15,000 - $25,000',
      prompt: `Build a comprehensive e-commerce admin dashboard with the following features:

**Core Requirements:**
- Real-time sales analytics and reporting
- Inventory management with low stock alerts
- Customer management and order history
- Order processing and status tracking
- Role-based access control (Admin, Manager, Staff)

**Technical Requirements:**
- React with TypeScript for type safety
- Responsive design using Tailwind CSS
- Node.js backend with PostgreSQL database
- Real-time updates using WebSocket
- RESTful API with proper error handling

**Features:**
1. Dashboard with key metrics and charts
2. Product catalog with image upload
3. Order management with status updates
4. Customer management with communication history
5. Inventory tracking with automated reordering
6. Sales reporting with export functionality
7. User management with role assignments
8. Settings and configuration panel

**Performance Requirements:**
- Page load times under 2 seconds
- Support for 1000+ concurrent users
- 99.9% uptime requirement
- Mobile-responsive design

**Security Requirements:**
- Secure authentication and authorization
- Data encryption at rest and in transit
- Input validation and sanitization
- Audit logging for all actions`,
      previewImages: [
        '/examples/ecommerce-dashboard-1.png',
        '/examples/ecommerce-dashboard-2.png',
        '/examples/ecommerce-dashboard-3.png'
      ],
      liveDemo: 'https://demo.ecommerce-dashboard.com',
      githubRepo: 'https://github.com/example/ecommerce-dashboard',
      documentation: 'https://docs.ecommerce-dashboard.com'
    };

    res.json(exampleDetails);
  } catch (error) {
    console.error('Failed to fetch example details:', error);
    res.status(500).json({ error: 'Failed to fetch example details' });
  }
});

export default router;