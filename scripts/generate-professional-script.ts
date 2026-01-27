import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';

async function generateProfessionalScript() {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `Create a compelling, investor-grade 4-minute (240 seconds) video script for Wizards Incubator Platform.

PLATFORM OVERVIEW:
- World's First AI-Native Accelerator
- 188 operational AI agents (267+ total capacity)
- WAI SDK v1.0: 23+ LLM providers, 752+ models
- 10 specialized studios with 39 automated workflows
- AG-UI real-time streaming (watch agents work live)
- 87% success rate in beta program
- 14-day MVP transformation (6 phases)
- Full SDLC automation from ideation to deployment

VIDEO STRUCTURE (240 seconds = 4 minutes):
1. Opening Hook (20s) - Problem statement + platform introduction
2. Platform Overview (25s) - WAI SDK architecture, 10 studios ecosystem  
3. Studio Showcase - All 10 studios (120s total, ~12s each):
   - Ideation Lab (12s)
   - Engineering Forge (12s)
   - Market Intelligence (12s)
   - Product Blueprint (12s)
   - Experience Design (12s)
   - Quality Assurance Lab (12s)
   - Growth Engine (12s)
   - Launch Command (12s)
   - Operations Hub (12s)
   - Deployment Studio (12s)
4. Technical Architecture (30s) - WAI SDK, agent orchestration, AG-UI
5. Market Differentiation (25s) - Competitive advantages, unique features
6. Success Metrics & CTA (20s) - 87% success rate, beta results, call to action

REQUIREMENTS:
- Professional, confident, investor-focused tone
- Emphasize speed (14 days), automation (267+ agents), innovation (AG-UI)
- Include specific metrics and technical details
- Clear visual descriptions for each scene
- On-screen text suggestions for key points

Return ONLY valid JSON (no markdown):
{
  "title": "Wizards Incubator: The Future of Startup Acceleration",
  "totalDuration": 240,
  "scenes": [
    {
      "sceneNumber": 1,
      "duration": 20,
      "title": "The Problem",
      "narration": "Full narration text...",
      "visualDescription": "What should be shown on screen",
      "onScreenText": ["Key Point 1", "Key Point 2"],
      "transitionEffect": "fade"
    }
  ]
}`;

  console.log('🎬 Generating comprehensive 4-minute video script...\n');

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }]
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in response');
  }

  const script = JSON.parse(jsonMatch[0]);
  
  fs.writeFileSync('video-assets/professional-script.json', JSON.stringify(script, null, 2));
  
  console.log('✅ Script generated successfully!');
  console.log(`📝 Title: ${script.title}`);
  console.log(`⏱️  Total Duration: ${script.totalDuration} seconds (${Math.floor(script.totalDuration / 60)} minutes)`);
  console.log(`🎬 Scenes: ${script.scenes.length}`);
  console.log(`📁 Saved to: video-assets/professional-script.json\n`);

  // Show scene breakdown
  console.log('📋 Scene Breakdown:');
  script.scenes.forEach((scene: any) => {
    console.log(`  ${scene.sceneNumber}. ${scene.title} (${scene.duration}s)`);
  });
}

generateProfessionalScript().catch(console.error);
