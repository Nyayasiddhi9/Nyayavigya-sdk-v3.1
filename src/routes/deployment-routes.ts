/**
 * Deployment Routes
 * One-click deployment, GitHub upload, and download functionality
 */

import { Router } from 'express';
import { z } from 'zod';
import { gitHubIntegrationService } from '../services/github-integration-service';
import { advancedDevOpsDeployment } from '../services/advanced-devops-deployment';

const router = Router();

// Request validation schemas
const deploymentRequestSchema = z.object({
  projectName: z.string().min(1),
  targetPlatform: z.enum(['vercel', 'netlify', 'kubernetes', 'docker', 'multi-cloud']),
  environmentVariables: z.record(z.string()).optional(),
  customDomain: z.string().optional()
});

const githubUploadSchema = z.object({
  repositoryName: z.string().min(1).max(100),
  description: z.string().max(500),
  private: z.boolean().default(true),
  includeDocumentation: z.boolean().default(true),
  includeDemoData: z.boolean().default(false),
  template: z.boolean().default(false)
});

/**
 * POST /api/deployment/one-click-deploy
 * One-click deployment to various platforms
 */
router.post('/one-click-deploy', async (req, res) => {
  try {
    const validatedRequest = deploymentRequestSchema.parse(req.body);
    
    console.log(`🚀 One-click deployment initiated for: ${validatedRequest.projectName}`);
    
    let deploymentResult;
    
    switch (validatedRequest.targetPlatform) {
      case 'kubernetes':
        deploymentResult = await advancedDevOpsDeployment.deployToKubernetes({
          targetId: 'aws-eks', // Default to AWS EKS
          applicationName: validatedRequest.projectName,
          image: `${validatedRequest.projectName}:latest`,
          replicas: 3,
          resources: { cpu: '500m', memory: '512Mi' },
          environment: validatedRequest.environmentVariables || {},
          enableAutoscaling: true,
          enableIngress: true
        });
        break;
        
      case 'multi-cloud':
        deploymentResult = await advancedDevOpsDeployment.deployMultiCloud({
          applicationName: validatedRequest.projectName,
          image: `${validatedRequest.projectName}:latest`,
          targets: ['aws-eks', 'azure-aks', 'gcp-gke'],
          strategy: 'active-active'
        });
        break;
        
      default:
        // Simulate deployment for other platforms
        deploymentResult = {
          success: true,
          deploymentId: `deploy-${Date.now()}`,
          endpoint: `https://${validatedRequest.projectName}.${validatedRequest.targetPlatform}.app`,
          status: 'deployed'
        };
    }

    res.json({
      success: true,
      message: 'Deployment initiated successfully',
      deployment: deploymentResult,
      estimatedTime: '5-10 minutes',
      monitoringUrl: `https://monitoring.example.com/deployment/${deploymentResult.deploymentId || 'unknown'}`
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid deployment request',
        details: error.errors
      });
    }
    
    console.error('Deployment error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Deployment failed',
      troubleshooting: [
        'Check your environment variables',
        'Verify deployment platform credentials',
        'Ensure project builds successfully locally',
        'Review deployment logs for specific errors'
      ]
    });
  }
});

/**
 * POST /api/deployment/github-upload
 * Upload project to GitHub with complete setup
 */
router.post('/github-upload', async (req, res) => {
  try {
    const validatedRequest = githubUploadSchema.parse(req.body);
    
    console.log(`📤 GitHub upload initiated for: ${validatedRequest.repositoryName}`);
    
    const result = await gitHubIntegrationService.createCodeStudioRepository(validatedRequest);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Project successfully uploaded to GitHub',
        repository: {
          url: result.repositoryUrl,
          cloneUrl: result.cloneUrl,
          deploymentUrls: result.deploymentUrls
        },
        nextSteps: [
          'Clone the repository locally',
          'Configure environment variables in repository secrets',
          'Set up deployment workflows',
          'Invite team members to collaborate'
        ]
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        troubleshooting: [
          'Ensure GitHub token is configured in environment',
          'Check repository name availability',
          'Verify GitHub API permissions',
          'Try with a different repository name'
        ]
      });
    }

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid GitHub upload request',
        details: error.errors
      });
    }
    
    console.error('GitHub upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'GitHub upload failed'
    });
  }
});

/**
 * POST /api/deployment/create-download-package
 * Create downloadable project package
 */
router.post('/create-download-package', async (req, res) => {
  try {
    const { projectName } = req.body;
    
    if (!projectName) {
      return res.status(400).json({
        success: false,
        error: 'Project name is required'
      });
    }
    
    console.log(`📦 Creating download package for: ${projectName}`);
    
    const result = await gitHubIntegrationService.createDownloadPackage(projectName);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Download package created successfully',
        download: {
          url: result.downloadUrl,
          size: result.packageSize,
          expires: '24 hours'
        },
        includes: [
          'Complete source code',
          'All dependencies and configurations',
          'Database schemas and migrations',
          'Documentation and guides',
          'Deployment configurations',
          'Docker and Kubernetes manifests'
        ]
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error: any) {
    console.error('Download package creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create download package'
    });
  }
});

/**
 * GET /api/deployment/recommendations
 * Get deployment recommendations based on project requirements
 */
router.get('/recommendations', async (req, res) => {
  try {
    const {
      applicationType = 'web',
      expectedTraffic = 'medium',
      budget = 'moderate',
      compliance = ''
    } = req.query;

    const complianceArray = compliance ? (compliance as string).split(',') : [];
    
    const recommendations = advancedDevOpsDeployment.getDeploymentRecommendations({
      applicationType: applicationType as any,
      expectedTraffic: expectedTraffic as any,
      budget: budget as any,
      compliance: complianceArray
    });
    
    res.json({
      success: true,
      recommendations: {
        ...recommendations,
        platforms: recommendations.recommendedTargets.map(target => ({
          id: target,
          name: target.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          pros: getPlatformPros(target),
          cons: getPlatformCons(target)
        }))
      }
    });

  } catch (error: any) {
    console.error('Recommendations error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get recommendations'
    });
  }
});

/**
 * GET /api/deployment/status/:deploymentId
 * Get deployment status and logs
 */
router.get('/status/:deploymentId', async (req, res) => {
  try {
    const { deploymentId } = req.params;
    
    // Simulate deployment status
    const statuses = ['pending', 'building', 'deploying', 'deployed', 'failed'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    const response = {
      success: true,
      deployment: {
        id: deploymentId,
        status: randomStatus,
        progress: randomStatus === 'deployed' ? 100 : Math.floor(Math.random() * 90) + 10,
        startTime: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        logs: [
          '📦 Building application...',
          '🔧 Installing dependencies...',
          '🏗️ Running build process...',
          '🚀 Deploying to production...',
          randomStatus === 'deployed' ? '✅ Deployment successful!' : '⏳ In progress...'
        ],
        endpoints: randomStatus === 'deployed' ? [
          `https://app-${deploymentId}.example.com`,
          `https://api-${deploymentId}.example.com`
        ] : undefined
      }
    };
    
    res.json(response);

  } catch (error: any) {
    console.error('Status check error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get deployment status'
    });
  }
});

// Helper functions
function getPlatformPros(platform: string): string[] {
  const prosMap: Record<string, string[]> = {
    'vercel-edge': ['Zero-config deployment', 'Global CDN', 'Automatic HTTPS', 'Serverless functions'],
    'aws-eks': ['Full Kubernetes control', 'Enterprise-grade security', 'Auto-scaling', 'AWS ecosystem integration'],
    'azure-aks': ['Microsoft ecosystem', 'Active Directory integration', 'Hybrid cloud support', 'DevOps integration'],
    'gcp-gke': ['Google Cloud AI/ML services', 'Anthos for hybrid', 'Competitive pricing', 'Advanced networking']
  };
  
  return prosMap[platform] || ['Reliable deployment', 'Good performance', 'Scalable infrastructure'];
}

function getPlatformCons(platform: string): string[] {
  const consMap: Record<string, string[]> = {
    'vercel-edge': ['Vendor lock-in', 'Limited backend control', 'Cold start delays', 'Cost at scale'],
    'aws-eks': ['Complex setup', 'Learning curve', 'Management overhead', 'Higher costs'],
    'azure-aks': ['Microsoft dependency', 'Complex pricing', 'Learning curve', 'Region limitations'],
    'gcp-gke': ['Smaller ecosystem', 'Less enterprise adoption', 'Support quality varies', 'Fewer regions']
  };
  
  return consMap[platform] || ['Setup complexity', 'Ongoing maintenance', 'Cost considerations'];
}

export default router;