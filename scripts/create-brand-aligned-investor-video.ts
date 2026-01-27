import fs from 'fs-extra';
import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';

const execAsync = promisify(exec);

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OUTPUT_DIR = './video-production-final';
const MUSIC_FILE = './video-assets/cinematic-epic-music.mp3';
const LOGO_FILE = './video-assets/wizards-logo.jpg';

interface VideoScene {
  number: number;
  title: string;
  narration: string;
  sourceType: 'attached' | 'platform' | 'image';
  sourceFile?: string;
}

const INVESTOR_SCRIPT: VideoScene[] = [
  {
    number: 1,
    title: "WIZARDS INCUBATOR PLATFORM",
    narration: "Every year, millions of founders dream big, but 82 percent never reach market. Why? Because speed kills runway, and cost kills ambition.",
    sourceType: 'platform',
    sourceFile: 'video-assets/platform-landing.png'
  },
  {
    number: 2,
    title: "The World's First AI-Native Accelerator",
    narration: "At Wizards Tech Global, we believe AI should build startups as fast as founders dream them. Introducing Wizards Incubator — the world's first AI-native startup accelerator that turns ideas into MVPs in 14 days.",
    sourceType: 'attached',
    sourceFile: 'video-assets/attached_videos/scene_1.mp4'
  },
  {
    number: 3,
    title: "The Problem We Solve",
    narration: "Traditional incubators take months and hundreds of thousands to deliver a prototype. By then, the market has moved on.",
    sourceType: 'attached',
    sourceFile: 'video-assets/attached_videos/scene_2.mp4'
  },
  {
    number: 4,
    title: "WAI SDK v1.0 Architecture",
    narration: "Wizards Incubator runs on WAI SDK version ten — a self-learning AI orchestration system with 267 agents across 23 LLM providers. Ten specialized studios operate autonomously, from ideation to launch, delivering enterprise-grade products in days.",
    sourceType: 'attached',
    sourceFile: 'video-assets/attached_videos/scene_3.mp4'
  },
  {
    number: 5,
    title: "14-Day Autonomous Workflow",
    narration: "Days 1 to 3, the Ideation Lab validates markets. Days 4 to 6, Design Studio crafts experience. Days 7 to 10, Engineering Forge codes the product. Days 11 to 14, Launch Command takes it to market.",
    sourceType: 'attached',
    sourceFile: 'video-assets/attached_videos/scene_4.mp4'
  },
  {
    number: 6,
    title: "Proven Excellence",
    narration: "Results speak for themselves — 90 percent cost reduction, 75 percent success rate, and a 22 to 1 LTV to CAC ratio.",
    sourceType: 'attached',
    sourceFile: 'video-assets/attached_videos/scene_5.mp4'
  },
  {
    number: 7,
    title: "Massive Market Opportunity",
    narration: "A 1.4 trillion dollar opportunity across startups and enterprises. We're owning the bridge between imagination and execution.",
    sourceType: 'image',
    sourceFile: 'attached_assets/stock_images/premium_global_busin_33e1c252.jpg'
  },
  {
    number: 8,
    title: "Financial Trajectory",
    narration: "Break-even by month ten, 45 million in revenue by year three, with 49 percent EBITDA margin. Velocity and viability, together.",
    sourceType: 'attached',
    sourceFile: 'video-assets/attached_videos/scene_6.mp4'
  },
  {
    number: 9,
    title: "Investment Opportunity",
    narration: "We're raising two million dollars to accelerate launch and scale globally. Forty percent to platform, thirty to growth, twenty to team, ten to runway.",
    sourceType: 'attached',
    sourceFile: 'video-assets/attached_videos/scene_7.mp4'
  },
  {
    number: 10,
    title: "Join the Revolution",
    narration: "Led by visionaries who built platforms used by millions, Wizards Tech Global is reshaping how companies come to life. Join the revolution in startup acceleration. Where AI builds startups — and founders build the future.",
    sourceType: 'attached',
    sourceFile: 'video-assets/attached_videos/scene_8.mp4'
  }
];

async function generateVoiceover(text: string, outputFile: string): Promise<void> {
  try {
    console.log(`  🎤 Generating ElevenLabs voiceover...`);
    const response = await axios.post(
      'https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM',
      {
        text: text,
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
    console.log(`  ✅ ElevenLabs voice generated`);
  } catch (error: any) {
    console.log(`  ⚠️  ElevenLabs failed, using OpenAI HD...`);
    
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    
    const tts = await openai.audio.speech.create({
      model: 'tts-1-hd',
      voice: 'nova',
      input: text,
      speed: 1.05
    });
    
    await fs.writeFile(outputFile, Buffer.from(await tts.arrayBuffer()));
    console.log(`  ✅ OpenAI HD voice generated`);
  }
}

async function createBrandedScene(scene: VideoScene): Promise<string> {
  console.log(`\n🎬 Scene ${scene.number}: ${scene.title}`);
  
  const voiceFile = `${OUTPUT_DIR}/voice_${scene.number}.mp3`;
  await generateVoiceover(scene.narration, voiceFile);
  
  const {stdout} = await execAsync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${voiceFile}"`
  );
  const duration = parseFloat(stdout.trim());
  
  let baseClip = `${OUTPUT_DIR}/base_${scene.number}.mp4`;
  
  if (scene.sourceType === 'attached' && scene.sourceFile) {
    console.log(`  📹 Using motion video clip...`);
    await execAsync(
      `ffmpeg -stream_loop -1 -i "${scene.sourceFile}" -t ${duration} ` +
      `-vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,` +
      `fade=in:0:25,fade=out:${Math.floor(duration * 30 - 25)}:25" ` +
      `-c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p -an ` +
      `"${baseClip}" -y 2>&1 | tail -1`
    );
  } else if (scene.sourceType === 'platform' && scene.sourceFile) {
    console.log(`  🖼️  Using platform screenshot...`);
    await execAsync(
      `ffmpeg -loop 1 -framerate 30 -t ${duration} -i "${scene.sourceFile}" ` +
      `-vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,` +
      `zoompan=z='min(zoom+0.0008,1.15)':d=${Math.floor(duration * 30)}:s=1920x1080:fps=30,` +
      `fade=in:0:25,fade=out:${Math.floor(duration * 30 - 25)}:25,format=yuv420p" ` +
      `-c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p ` +
      `"${baseClip}" -y 2>&1 | tail -1`
    );
  } else {
    console.log(`  🎨 Using premium imagery...`);
    await execAsync(
      `ffmpeg -loop 1 -framerate 30 -t ${duration} -i "${scene.sourceFile}" ` +
      `-vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,` +
      `fade=in:0:25,fade=out:${Math.floor(duration * 30 - 25)}:25,format=yuv420p" ` +
      `-c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p ` +
      `"${baseClip}" -y 2>&1 | tail -1`
    );
  }
  
  console.log(`  ✨ Adding brand-aligned overlays...`);
  const finalClip = `${OUTPUT_DIR}/scene_${scene.number}.mp4`;
  
  const cleanTitle = scene.title.replace(/'/g, "'\\''");
  const fontSize = cleanTitle.length > 35 ? 90 : (cleanTitle.length > 25 ? 105 : 120);
  
  // Brand-aligned filter complex with:
  // 1. Logo in top-left corner (resized, subtle)
  // 2. Blue-to-purple gradient text effect (simulated with shadow layers)
  // 3. Premium typography
  
  const filterComplex = 
    // Logo overlay
    `[1:v]scale=180:-1[logo];` +
    `[0:v][logo]overlay=40:40[v1];` +
    // Title - Layer 1: Purple shadow (Innovation Purple: 270 75% 65%)
    `[v1]drawtext=text='${cleanTitle}':` +
    `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:` +
    `fontsize=${fontSize}:fontcolor=0xB794F4:` +
    `x=(w-text_w)/2:y=85:` +
    `shadowcolor=0xB794F4@0.6:shadowx=0:shadowy=0[v2];` +
    // Title - Layer 2: Blue glow (AI Blue: 217 91% 60%)
    `[v2]drawtext=text='${cleanTitle}':` +
    `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:` +
    `fontsize=${fontSize}:fontcolor=white:` +
    `x=(w-text_w)/2:y=80:` +
    `shadowcolor=0x3B82F6@0.7:shadowx=0:shadowy=0[v3];` +
    // Title - Layer 3: Final white text with black outline
    `[v3]drawtext=text='${cleanTitle}':` +
    `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:` +
    `fontsize=${fontSize}:fontcolor=white:` +
    `x=(w-text_w)/2:y=80:` +
    `shadowcolor=black@0.8:shadowx=3:shadowy=3[vout]`;
  
  await execAsync(
    `ffmpeg -i "${baseClip}" -loop 1 -i "${LOGO_FILE}" -i "${voiceFile}" ` +
    `-filter_complex "${filterComplex}" ` +
    `-map "[vout]" -map 2:a ` +
    `-c:v libx264 -preset medium -crf 16 -c:a aac -b:a 256k -shortest ` +
    `"${finalClip}" -y 2>&1 | tail -1`
  );
  
  console.log(`  ✅ Scene complete`);
  return finalClip;
}

async function main() {
  console.log('\n🎬 WIZARDS INCUBATOR - PROFESSIONAL INVESTOR VIDEO');
  console.log('='.repeat(85));
  console.log('🎥 Brand-Aligned Cinematic Production');
  console.log('🎨 Blue-to-Purple Gradient Typography');
  console.log('🚀 Logo Overlay Throughout');
  console.log('🎤 Premium Female Voiceover');
  console.log('📹 Real Motion Video + Platform Screenshots');
  console.log('🎵 Epic Cinematic Music');
  console.log('='.repeat(85) + '\n');
  
  await fs.ensureDir(OUTPUT_DIR);
  
  const scenes: string[] = [];
  
  for (const scene of INVESTOR_SCRIPT) {
    const clip = await createBrandedScene(scene);
    scenes.push(clip);
  }
  
  console.log('\n📦 Assembling final investor video with music...\n');
  
  const concatList = scenes.map(s => `file '${s.split('/').pop()}'`).join('\n');
  await fs.writeFile(`${OUTPUT_DIR}/list.txt`, concatList);
  
  const finalVideo = './video-assets/WIZARDS_INCUBATOR_INVESTOR_VIDEO.mp4';
  
  await execAsync(
    `cd ${OUTPUT_DIR} && ffmpeg -f concat -safe 0 -i list.txt -i "${MUSIC_FILE}" ` +
    `-filter_complex "` +
    `[1:a]volume=0.20,afade=in:st=0:d=3,afade=out:st=155:d=3[music];` +
    `[0:a][music]amix=inputs=2:duration=first:dropout_transition=3[a]" ` +
    `-map 0:v -map "[a]" ` +
    `-c:v copy -c:a aac -b:a 320k -movflags +faststart ` +
    `"${finalVideo}" -y 2>&1 | tail -5`
  );
  
  const stats = fs.statSync(finalVideo);
  const {stdout: dur} = await execAsync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${finalVideo}"`
  );
  
  const minutes = Math.floor(parseFloat(dur) / 60);
  const seconds = Math.floor(parseFloat(dur) % 60);
  
  console.log('\n🎉 PROFESSIONAL INVESTOR VIDEO COMPLETE!');
  console.log('='.repeat(85));
  console.log(`📁 File: ${finalVideo}`);
  console.log(`📏 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`⏱️  Duration: ${minutes}m ${seconds}s`);
  console.log(`🎬 Resolution: 1920x1080 Full HD`);
  console.log(`🎨 Scenes: ${INVESTOR_SCRIPT.length} professional scenes`);
  console.log(`🚀 Features:`);
  console.log(`   • Wizards logo overlay (top-left)`);
  console.log(`   • Blue-to-purple gradient typography`);
  console.log(`   • Real motion video from attached clips`);
  console.log(`   • Platform screenshots with cinematic zoom`);
  console.log(`   • Professional female voiceover (ElevenLabs/OpenAI HD)`);
  console.log(`   • Epic cinematic background music`);
  console.log(`   • Brand-aligned design (matches platform)`);
  console.log('='.repeat(85));
  console.log('\n✅ READY FOR GLOBAL INVESTORS!\n');
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
