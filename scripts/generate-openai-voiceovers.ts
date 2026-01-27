import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

interface Scene {
  sceneNumber: number;
  duration: number;
  title: string;
  narration: string;
  onScreenText: string[];
  imageFile: string;
}

interface VideoScript {
  title: string;
  totalDuration: number;
  scenes: Scene[];
}

async function generateAllVoiceovers() {
  console.log('🎙️  OPENAI TTS - PROFESSIONAL VOICEOVER GENERATION');
  console.log('==================================================\n');

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Load script
  const script: VideoScript = JSON.parse(
    fs.readFileSync('video-assets/complete-video-script.json', 'utf-8')
  );

  console.log(`📝 Script: ${script.title}`);
  console.log(`🎬 Scenes: ${script.scenes.length}\n`);

  // Ensure output directory exists
  if (!fs.existsSync('video-assets')) {
    fs.mkdirSync('video-assets', { recursive: true });
  }

  let successCount = 0;
  let errorCount = 0;

  for (const scene of script.scenes) {
    const outputPath = path.join('video-assets', `pro-voice-${scene.sceneNumber}.mp3`);

    try {
      console.log(`🎙️  Scene ${scene.sceneNumber}: ${scene.title}`);
      console.log(`   Narration: "${scene.narration.substring(0, 80)}..."`);

      // Generate speech using OpenAI TTS
      const mp3 = await openai.audio.speech.create({
        model: 'tts-1-hd', // High-quality HD model
        voice: 'onyx', // Professional, clear male voice
        input: scene.narration,
        speed: 1.0
      });

      // Convert response to buffer and save
      const buffer = Buffer.from(await mp3.arrayBuffer());
      fs.writeFileSync(outputPath, buffer);

      console.log(`   ✅ Generated: ${outputPath} (${(buffer.length / 1024).toFixed(2)} KB)\n`);
      successCount++;

    } catch (error: any) {
      console.error(`   ❌ Error generating voiceover: ${error.message}\n`);
      errorCount++;
    }
  }

  console.log('='.repeat(50));
  console.log('📊 VOICEOVER GENERATION SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Successfully generated: ${successCount} voiceovers`);
  console.log(`❌ Failed: ${errorCount} voiceovers`);
  console.log(`\n🎉 All professional voiceovers ready for video assembly!`);
}

generateAllVoiceovers().catch(console.error);
