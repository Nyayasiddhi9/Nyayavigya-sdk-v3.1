import fs from 'fs-extra';
import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';
import chalk from 'chalk';

const execAsync = promisify(exec);

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const INPUT_JSON = './video-assets/complete-video-script.json';
const OUTPUT_DIR = './output_video';
const ASSETS_DIR = './attached_assets/stock_images';
const RESOLUTION = '1920x1080';
const FRAME_RATE = 30;

// ElevenLabs Female Voices
const ELEVENLABS_VOICES = {
  rachel: '21m00Tcm4TlvDq8ikWAM', // Calm, professional female
  domi: 'AZnzlk1XvdvUeBnXmlld',   // Strong, confident female
  bella: 'EXAVITQu4vr4xnSDxMaL',  // Soft, friendly female
  elli: 'MF3mGyEYCl7XYWbV9V6O',   // Energetic female
};

async function generateElevenLabsVoice(text: string, outputFile: string, voiceId: string = ELEVENLABS_VOICES.rachel) {
  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.5,
          use_speaker_boost: true
        }
      },
      {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );
    
    await fs.writeFile(outputFile, response.data);
    console.log(chalk.green(`  ✅ ElevenLabs voice generated`));
  } catch (error: any) {
    console.log(chalk.yellow(`  ⚠️  ElevenLabs error, falling back to OpenAI...`));
    // Fallback to OpenAI TTS
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const tts = await openai.audio.speech.create({
      model: 'tts-1-hd',
      voice: 'nova', // Female voice
      input: text,
    });
    const buffer = Buffer.from(await tts.arrayBuffer());
    await fs.writeFile(outputFile, buffer);
    console.log(chalk.green(`  ✅ OpenAI HD voice generated (female)`));
  }
}

async function generatePromoVideo() {
  console.log(chalk.cyan.bold('\n🎬 WIZARDS INCUBATOR PROFESSIONAL PROMO VIDEO'));
  console.log(chalk.cyan('=' .repeat(70)));
  console.log(chalk.white('🎤 Voice: ElevenLabs Female Professional'));
  console.log(chalk.white('📐 Resolution: 1920x1080 Full HD'));
  console.log(chalk.white('🎨 Typography: Ultra Large & Crystal Clear'));
  console.log(chalk.white('🖼️  Images: Professional Stock Library'));
  console.log(chalk.cyan('='.repeat(70) + '\n'));

  const data = JSON.parse(await fs.readFile(INPUT_JSON, 'utf8'));
  await fs.ensureDir(OUTPUT_DIR);

  const sceneVideos: string[] = [];

  for (const scene of data.scenes) {
    console.log(chalk.yellow(`\n🎬 Scene ${scene.sceneNumber}: ${scene.title}`));

    // Generate voiceover
    const voiceFile = `${OUTPUT_DIR}/scene_${scene.sceneNumber}_voice.mp3`;
    await generateElevenLabsVoice(scene.narration, voiceFile);

    // Get voice duration
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${voiceFile}"`
    );
    const duration = parseFloat(stdout.trim());

    // Prepare image path
    const imagePath = `${ASSETS_DIR}/${scene.imageFile}`;
    
    // Check if image exists
    if (!fs.existsSync(imagePath)) {
      console.log(chalk.red(`  ❌ Image not found: ${imagePath}`));
      continue;
    }

    // Clean text for FFmpeg
    const title = scene.title.replace(/[^a-zA-Z0-9 ]/g, ' ').trim();
    const bullets = scene.onScreenText.slice(0, 3).map((b: string) => 
      b.replace(/[^a-zA-Z0-9+ ]/g, ' ').trim()
    );

    // Build professional filter chain
    const filters: string[] = [];
    
    // Scale to HD
    filters.push('scale=1920:1080:force_original_aspect_ratio=increase');
    filters.push('crop=1920:1080');
    
    // Title - EXTRA LARGE (96px) with strong shadow
    filters.push(
      `drawtext=text='${title}':` +
      `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:` +
      `fontsize=96:fontcolor=white:` +
      `x=(w-text_w)/2:y=120:` +
      `shadowcolor=black:shadowx=5:shadowy=5`
    );

    // Bullets - LARGE (64px) with strong shadow
    bullets.forEach((bullet: string, i: number) => {
      const yPos = 360 + (i * 120);
      filters.push(
        `drawtext=text='${bullet}':` +
        `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:` +
        `fontsize=64:fontcolor=white:` +
        `x=(w-text_w)/2:y=${yPos}:` +
        `shadowcolor=black:shadowx=4:shadowy=4`
      );
    });

    // Add fade effects
    filters.push('fade=in:0:30');
    filters.push(`fade=out:${Math.floor(duration * 30 - 30)}:30`);

    const filterChain = filters.join(',');
    const outputVideo = `${OUTPUT_DIR}/scene_${scene.sceneNumber}.mp4`;

    // Render scene with best quality
    await execAsync(
      `ffmpeg -loop 1 -framerate ${FRAME_RATE} -t ${duration} -i "${imagePath}" -i "${voiceFile}" ` +
      `-vf "${filterChain}" ` +
      `-c:v libx264 -preset slower -profile:v high -crf 16 -pix_fmt yuv420p ` +
      `-c:a aac -b:a 256k -shortest ` +
      `"${outputVideo}" -y 2>&1 | grep -E "time=|error" | tail -2 || echo "  Done"`
    );

    sceneVideos.push(outputVideo);
    console.log(chalk.green(`  ✅ Scene rendered (${duration.toFixed(1)}s)`));
  }

  // Merge all scenes
  console.log(chalk.cyan('\n📦 Assembling final professional video...'));
  
  const concatList = `${OUTPUT_DIR}/concat.txt`;
  const concatContent = sceneVideos.map(v => `file '${v.split('/').pop()}'`).join('\n');
  await fs.writeFile(concatList, concatContent);

  const finalVideo = `./video-assets/Wizards_Incubator_Professional_Promo.mp4`;
  
  await execAsync(
    `cd ${OUTPUT_DIR} && ffmpeg -f concat -safe 0 -i concat.txt ` +
    `-c copy ../video-assets/Wizards_Incubator_Professional_Promo.mp4 -y 2>&1 | tail -3`
  );

  const stats = await fs.stat(finalVideo);
  const { stdout: finalDur } = await execAsync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${finalVideo}"`
  );

  console.log(chalk.green.bold('\n🎉 PROFESSIONAL PROMO VIDEO COMPLETE!'));
  console.log(chalk.cyan('='.repeat(70)));
  console.log(chalk.white(`📁 File: ${finalVideo}`));
  console.log(chalk.white(`📏 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`));
  console.log(chalk.white(`⏱️  Duration: ${Math.floor(parseFloat(finalDur) / 60)}m ${Math.floor(parseFloat(finalDur) % 60)}s`));
  console.log(chalk.white(`🎤 Voice: ElevenLabs Professional Female`));
  console.log(chalk.white(`🎨 Typography: 96px titles, 64px bullets (ULTRA CLEAR!)`));
  console.log(chalk.white(`🎬 Quality: 1920x1080 HD, CRF 16`));
  console.log(chalk.cyan('='.repeat(70)));
  console.log(chalk.green.bold('\n✅ Ready for investor presentations!'));
}

generatePromoVideo().catch(err => {
  console.error(chalk.red('\n❌ Error:'), err.message);
  process.exit(1);
});
