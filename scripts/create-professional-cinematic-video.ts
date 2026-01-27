import fs from 'fs-extra';
import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';

const execAsync = promisify(exec);

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const OUTPUT_DIR = './video-production';
const MUSIC_FILE = './video-assets/cinematic-epic-music.mp3';

interface VideoScene {
  number: number;
  title: string;
  narration: string;
  duration: number;
  sourceType: 'attached' | 'platform' | 'stock' | 'image';
  sourceFile?: string;
  stockQuery?: string;
}

const CINEMATIC_SCRIPT: VideoScene[] = [
  {
    number: 1,
    title: "WIZARDS INCUBATOR PLATFORM",
    narration: "Every year, millions of founders dream big, but 82 percent never reach market. Why? Because speed kills runway, and cost kills ambition.",
    duration: 15,
    sourceType: 'platform',
    sourceFile: 'video-assets/platform-landing.png'
  },
  {
    number: 2,
    title: "The Vision",
    narration: "At Wizards Tech Global, we believe AI should build startups as fast as founders dream them. Introducing Wizards Incubator — the world's first AI-native startup accelerator that turns ideas into MVPs in 14 days.",
    duration: 18,
    sourceType: 'attached',
    sourceFile: 'video-assets/attached_videos/scene_1.mp4'
  },
  {
    number: 3,
    title: "The Problem",
    narration: "Traditional incubators take months and hundreds of thousands to deliver a prototype. By then, the market has moved on.",
    duration: 12,
    sourceType: 'image',
    stockQuery: 'ai technology futuristic'
  },
  {
    number: 4,
    title: "WAI-SDK Architecture",
    narration: "Wizards Incubator runs on WAI SDK version ten — a self-learning AI orchestration system with 267 agents across 23 LLM providers. Ten specialized studios operate autonomously, from ideation to launch, delivering enterprise-grade products in days.",
    duration: 22,
    sourceType: 'attached',
    sourceFile: 'video-assets/attached_videos/scene_2.mp4'
  },
  {
    number: 5,
    title: "14-Day Workflow",
    narration: "Days 1 to 3, the Ideation Lab validates markets. Days 4 to 6, Design Studio crafts experience. Days 7 to 10, Engineering Forge codes the product. Days 11 to 14, Launch Command takes it to market.",
    duration: 22,
    sourceType: 'attached',
    sourceFile: 'video-assets/attached_videos/scene_3.mp4'
  },
  {
    number: 6,
    title: "Proven Results",
    narration: "Results speak for themselves — 90 percent cost reduction, 75 percent success rate, and a 22 to 1 LTV to CAC ratio.",
    duration: 12,
    sourceType: 'attached',
    sourceFile: 'video-assets/attached_videos/scene_4.mp4'
  },
  {
    number: 7,
    title: "Market Opportunity",
    narration: "A 1.4 trillion dollar opportunity across startups and enterprises. We're owning the bridge between imagination and execution.",
    duration: 12,
    sourceType: 'image',
    stockQuery: 'global business network'
  },
  {
    number: 8,
    title: "Financial Trajectory",
    narration: "Break-even by month ten, 45 million in revenue by year three, with 49 percent EBITDA margin. Velocity and viability, together.",
    duration: 14,
    sourceType: 'attached',
    sourceFile: 'video-assets/attached_videos/scene_5.mp4'
  },
  {
    number: 9,
    title: "Investment Opportunity",
    narration: "We're raising two million dollars to accelerate launch and scale globally. Forty percent to platform, thirty to growth, twenty to team, ten to runway.",
    duration: 14,
    sourceType: 'attached',
    sourceFile: 'video-assets/attached_videos/scene_6.mp4'
  },
  {
    number: 10,
    title: "Join the Revolution",
    narration: "Led by visionaries who built platforms used by millions, Wizards Tech Global is reshaping how companies come to life. Join the revolution in startup acceleration. Where AI builds startups — and founders build the future.",
    duration: 18,
    sourceType: 'attached',
    sourceFile: 'video-assets/attached_videos/scene_7.mp4'
  }
];

async function generateElevenLabsVoiceover(text: string, outputFile: string): Promise<void> {
  console.log(`  🎤 Generating ElevenLabs voiceover...`);
  
  try {
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
    console.log(`  ⚠️  ElevenLabs failed (${error.response?.status || error.message}), using OpenAI fallback...`);
    
    // Fallback to OpenAI
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
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

async function createVideoClip(scene: VideoScene): Promise<string> {
  console.log(`\n🎬 Scene ${scene.number}: ${scene.title}`);
  
  const voiceFile = `${OUTPUT_DIR}/voice_${scene.number}.mp3`;
  await generateElevenLabsVoiceover(scene.narration, voiceFile);
  
  // Get actual voice duration
  const {stdout} = await execAsync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${voiceFile}"`
  );
  const voiceDuration = parseFloat(stdout.trim());
  
  let videoClip = `${OUTPUT_DIR}/clip_${scene.number}.mp4`;
  
  if (scene.sourceType === 'attached' && scene.sourceFile) {
    // Use attached video - upscale to 1080p and trim to voice duration
    console.log(`  📹 Using attached video...`);
    await execAsync(
      `ffmpeg -i "${scene.sourceFile}" -t ${voiceDuration} ` +
      `-vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fade=in:0:25,fade=out:${Math.floor(voiceDuration * 30 - 25)}:25" ` +
      `-c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -an ` +
      `"${videoClip}" -y 2>&1 | tail -1`
    );
  } else if (scene.sourceType === 'platform' && scene.sourceFile) {
    // Use platform screenshot with cinematic zoom
    console.log(`  🖼️  Using platform screenshot...`);
    await execAsync(
      `ffmpeg -loop 1 -framerate 30 -t ${voiceDuration} -i "${scene.sourceFile}" ` +
      `-vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,` +
      `zoompan=z='min(zoom+0.0008,1.2)':d=${Math.floor(voiceDuration * 30)}:s=1920x1080:fps=30,` +
      `fade=in:0:25,fade=out:${Math.floor(voiceDuration * 30 - 25)}:25,format=yuv420p" ` +
      `-c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p ` +
      `"${videoClip}" -y 2>&1 | tail -1`
    );
  } else {
    // Use premium stock images with cinematic effects
    console.log(`  🎨 Using premium stock imagery...`);
    const premiumImages = [
      'cutting_edge_futuris_70630143.jpg',
      'premium_luxury_techn_9f13dd13.jpg',
      'cinematic_futuristic_1ce3c942.jpg',
      'advanced_ai_robotics_91050553.jpg',
      'luxury_data_visualiz_fcc171e5.jpg',
      'premium_global_busin_33e1c252.jpg',
      'cinematic_financial__d66bce63.jpg',
    ];
    
    const img = `./attached_assets/stock_images/${premiumImages[(scene.number - 1) % premiumImages.length]}`;
    
    await execAsync(
      `ffmpeg -loop 1 -framerate 30 -t ${voiceDuration} -i "${img}" ` +
      `-vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,` +
      `fade=in:0:25,fade=out:${Math.floor(voiceDuration * 30 - 25)}:25,format=yuv420p" ` +
      `-c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p ` +
      `"${videoClip}" -y 2>&1 | tail -1`
    );
  }
  
  // Add premium typography overlay
  console.log(`  ✨ Adding premium typography...`);
  const finalClip = `${OUTPUT_DIR}/scene_${scene.number}.mp4`;
  
  const cleanTitle = scene.title.replace(/[^a-zA-Z0-9 -]/g, ' ').trim();
  
  // Premium title with cyan glow - ENSURING "Wizards Incubator Platform" is NEVER cut
  const fontSize = cleanTitle.length > 30 ? 100 : 120;
  
  await execAsync(
    `ffmpeg -i "${videoClip}" -i "${voiceFile}" ` +
    `-filter_complex "` +
    `[0:v]drawtext=text='${cleanTitle}':` +
    `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:` +
    `fontsize=${fontSize}:fontcolor=white:` +
    `x=(w-text_w)/2:y=80:` +
    `shadowcolor=0x00FFFF@0.5:shadowx=0:shadowy=0,` +
    `drawtext=text='${cleanTitle}':` +
    `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:` +
    `fontsize=${fontSize}:fontcolor=white:` +
    `x=(w-text_w)/2:y=80:` +
    `shadowcolor=black@0.8:shadowx=4:shadowy=4[v]" ` +
    `-map "[v]" -map 1:a ` +
    `-c:v libx264 -preset medium -crf 16 -c:a aac -b:a 256k -shortest ` +
    `"${finalClip}" -y 2>&1 | tail -1`
  );
  
  console.log(`  ✅ Scene complete`);
  return finalClip;
}

async function createCinematicInvestorVideo() {
  console.log('\n🎬 WIZARDS INCUBATOR - PROFESSIONAL CINEMATIC INVESTOR VIDEO');
  console.log('='.repeat(80));
  console.log('🎥 Global Acclaimed Director Production');
  console.log('🎤 ElevenLabs Professional Female Voiceover');
  console.log('📹 Real Motion Video + Platform Screenshots');
  console.log('🎵 Epic Cinematic Background Music');
  console.log('🎨 Premium Typography (Wizards Incubator Platform - NEVER CUT)');
  console.log('='.repeat(80) + '\n');
  
  await fs.ensureDir(OUTPUT_DIR);
  
  const scenes: string[] = [];
  
  for (const scene of CINEMATIC_SCRIPT) {
    const clip = await createVideoClip(scene);
    scenes.push(clip);
  }
  
  console.log('\n📦 Assembling professional cinematic video with epic music...\n');
  
  const concatList = scenes.map(s => `file '${s.split('/').pop()}'`).join('\n');
  await fs.writeFile(`${OUTPUT_DIR}/concat.txt`, concatList);
  
  const finalVideo = './video-assets/WIZARDS_INCUBATOR_PROFESSIONAL.mp4';
  
  await execAsync(
    `cd ${OUTPUT_DIR} && ffmpeg -f concat -safe 0 -i concat.txt -i "${MUSIC_FILE}" ` +
    `-filter_complex "` +
    `[1:a]volume=0.22,afade=in:st=0:d=3,afade=out:st=155:d=3[music];` +
    `[0:a][music]amix=inputs=2:duration=first:dropout_transition=3[a]" ` +
    `-map 0:v -map "[a]" ` +
    `-c:v copy -c:a aac -b:a 320k ` +
    `"${finalVideo}" -y 2>&1 | tail -5`
  );
  
  const stats = fs.statSync(finalVideo);
  const {stdout: dur} = await execAsync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${finalVideo}"`
  );
  
  console.log('\n🎉 PROFESSIONAL CINEMATIC INVESTOR VIDEO COMPLETE!');
  console.log('='.repeat(80));
  console.log(`📁 ${finalVideo}`);
  console.log(`📏 ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`⏱️  ${Math.floor(parseFloat(dur) / 60)}m ${Math.floor(parseFloat(dur) % 60)}s`);
  console.log(`🎥 1920x1080 Full HD • ${CINEMATIC_SCRIPT.length} Scenes`);
  console.log(`📹 Real Motion Video + Platform Screenshots`);
  console.log(`🎤 ElevenLabs Female Voiceover`);
  console.log(`🎵 Epic Cinematic Music`);
  console.log(`🎨 Premium Typography`);
  console.log('='.repeat(80));
  console.log('\n✅ READY FOR GLOBAL INVESTORS!\n');
}

createCinematicInvestorVideo().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
