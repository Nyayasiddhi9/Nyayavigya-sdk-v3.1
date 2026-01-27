import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import multer from 'multer';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only specific file types
    const allowedMimes = ['text/plain', 'application/pdf', 'text/markdown'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

// Ensure assistants directory exists
const ASSISTANTS_DIR = path.join(process.cwd(), 'server', 'assistants');

async function ensureAssistantsDir() {
  try {
    await fs.access(ASSISTANTS_DIR);
  } catch {
    await fs.mkdir(ASSISTANTS_DIR, { recursive: true });
  }
}

// Helper function to process knowledge base content
async function processKnowledgeBase(knowledgeBase: any, files?: Express.Multer.File[]) {
  let knowledgeContent = '';
  
  // Process website URL (placeholder for web scraping)
  if (knowledgeBase.websiteUrl) {
    knowledgeContent += `\nWebsite Content: ${knowledgeBase.websiteUrl}\n`;
    // In a real implementation, you would scrape the website here
    knowledgeContent += '[Website content would be scraped and added here]\n';
  }
  
  // Process uploaded files
  if (files && files.length > 0) {
    for (const file of files) {
      try {
        const content = await fs.readFile(file.path, 'utf-8');
        knowledgeContent += `\nFile: ${file.originalname}\n${content}\n`;
        // Clean up uploaded file
        await fs.unlink(file.path).catch(() => {});
      } catch (error) {
        console.error(`Error processing file ${file.originalname}:`, error);
      }
    }
  }
  
  return knowledgeContent;
}

// Helper function to generate system prompt
function generateSystemPrompt(config: any, knowledgeContent: string) {
  const basePrompt = `You are ${config.name}, an AI assistant created using the WAI DevStudio platform.

Description: ${config.description}

You should embody the following characteristics:
- Professional and helpful demeanor
- Expert knowledge in your domain
- Clear and concise communication
- Proactive assistance when appropriate

Your avatar style is: ${config.avatarStyle}
Your voice configuration: ${JSON.stringify(config.voiceConfig, null, 2)}`;

  if (knowledgeContent.trim()) {
    return `${basePrompt}

Knowledge Base:
${knowledgeContent}

Please use this knowledge base to provide accurate and helpful responses. If a question is outside your knowledge base, politely indicate that and offer to help with what you do know.`;
  }

  return basePrompt;
}

// POST /api/builder/create - Create a new assistant (JSON payload)
router.post('/create', async (req, res) => {
  try {
    await ensureAssistantsDir();
    
    const { name, description, avatarStyle, modelUrl, voiceConfig, knowledgeBase } = req.body;
    
    // Validate required fields
    if (!name || !description) {
      return res.status(400).json({ 
        error: 'Name and description are required' 
      });
    }
    
    // Generate unique assistant ID
    const assistantId = randomUUID();
    
    // Process knowledge base content (no file uploads for now)
    const knowledgeContent = knowledgeBase?.content || '';
    
    // Generate system prompt
    const systemPrompt = generateSystemPrompt({
      name,
      description,
      avatarStyle,
      voiceConfig: voiceConfig || {}
    }, knowledgeContent);
    
    // Create assistant configuration
    const assistantConfig = {
      id: assistantId,
      name,
      description,
      avatarStyle,
      modelUrl: modelUrl || 'ava_new_model.fbx',
      voiceConfig: voiceConfig || {
        provider: 'elevenlabs',
        voiceId: 'professional_female_warm',
        language: 'en-US',
        accent: 'American',
        speed: 1.0,
        pitch: 1.0,
      },
      knowledgeBase: {
        content: knowledgeContent,
        websiteUrl: knowledgeBase?.websiteUrl || undefined,
      },
      systemPrompt,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };
    
    // Save assistant configuration to file
    const configPath = path.join(ASSISTANTS_DIR, `${assistantId}.json`);
    await fs.writeFile(configPath, JSON.stringify(assistantConfig, null, 2));
    
    console.log(`✅ Created new assistant: ${name} (ID: ${assistantId})`);
    
    res.json({ 
      success: true, 
      assistantId,
      assistant: assistantConfig
    });
    
  } catch (error) {
    console.error('Error creating assistant:', error);
    res.status(500).json({ 
      error: 'Failed to create assistant',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/builder/assistants - List all created assistants
router.get('/assistants', async (req, res) => {
  try {
    await ensureAssistantsDir();
    
    const files = await fs.readdir(ASSISTANTS_DIR);
    const assistants = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const configPath = path.join(ASSISTANTS_DIR, file);
          const content = await fs.readFile(configPath, 'utf-8');
          const config = JSON.parse(content);
          
          // Only return basic info for listing
          assistants.push({
            id: config.id,
            name: config.name,
            description: config.description,
            avatarStyle: config.avatarStyle,
            createdAt: config.createdAt,
            lastUpdated: config.lastUpdated,
          });
        } catch (error) {
          console.error(`Error reading assistant config ${file}:`, error);
        }
      }
    }
    
    res.json(assistants);
    
  } catch (error) {
    console.error('Error listing assistants:', error);
    res.status(500).json({ 
      error: 'Failed to list assistants',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/builder/assistants/:id - Get specific assistant configuration
router.get('/assistants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const configPath = path.join(ASSISTANTS_DIR, `${id}.json`);
    
    try {
      const content = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(content);
      res.json(config);
    } catch (error) {
      res.status(404).json({ error: 'Assistant not found' });
    }
    
  } catch (error) {
    console.error('Error getting assistant:', error);
    res.status(500).json({ 
      error: 'Failed to get assistant',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/builder/assistants/:id - Delete a specific assistant
router.delete('/assistants/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const configPath = path.join(ASSISTANTS_DIR, `${id}.json`);
    
    // Check if assistant exists
    try {
      await fs.access(configPath);
    } catch (error) {
      return res.status(404).json({ error: 'Assistant not found' });
    }
    
    // Delete the assistant file
    await fs.unlink(configPath);
    
    console.log(`✅ Assistant deleted: ${id}`);
    res.json({ 
      success: true, 
      message: 'Assistant deleted successfully',
      id 
    });
    
  } catch (error) {
    console.error('Error deleting assistant:', error);
    res.status(500).json({ 
      error: 'Failed to delete assistant',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;