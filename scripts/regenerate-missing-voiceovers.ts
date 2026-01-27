import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

interface Scene {
  sceneNumber: number;
  narration: string;
  title: string;
}

interface VideoScript {
  scenes: Scene[];
}

async function regenerateMissingVoiceovers() {
  console.log('🎙️  REGENERATING MISSING VOICEOVERS (Scenes 6-12)');
  console.log('='.repeat(50) + '\n');

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const script: VideoScript = JSON.parse(
    fs.readFileSync('video-assets/complete-video-script.json', 'utf-8')
  );

  const missingScenes = [6, 7, 8, 9, 10, 11, 12];

  for (const sceneNum of missingScenes) {
    const scene = script.scenes.find(s => s.sceneNumber === sceneNum);
    if (!scene) continue;

    const outputPath = path.join('video-assets', `pro-voice-${sceneNum}.mp3`);

    try {
      console.log(`🎙️  Scene ${sceneNum}: ${scene.title}`);

      const mp3 = await openai.audio.speech.create({
        model: 'tts-1-hd',
        voice: 'onyx',
        input: scene.narration,
        speed: 1.0
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());
      fs.writeFileSync(outputPath, buffer);

      console.log(`   ✅ ${(buffer.length / 1024).toFixed(2)} KB\n`);

    } catch (error: any) {
      console.error(`   ❌ Error: ${error.message}\n`);
    }
  }

  console.log('✅ All missing voiceovers regenerated!\n');
}

regenerateMissingVoiceovers().catch(console.error);
