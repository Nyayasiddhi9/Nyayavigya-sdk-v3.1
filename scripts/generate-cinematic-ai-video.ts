import fs from 'fs-extra';
import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';
import OpenAI from 'openai';

const execAsync = promisify(exec);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const KIE_API_KEY = process.env.KIE_AI_API_KEY;

const OUTPUT_DIR = './cinematic_investor';
const MUSIC_FILE = './video-assets/cinematic-epic-music.mp3';

interface Scene {
  sceneNumber: number;
  duration: number;
  title: string;
  narration: string;
  aiVideoPrompt: string;
  onScreenText: string[];
  visualStyle: string;
}

async function generateAIVideo(prompt: string, duration: number, sceneNum: number): Promise<string> {
  console.log(`  🎨 Generating AI video with Kie.ai...`);
  
  try {
    // Kie.ai video generation API
    const response = await axios.post(
      'https://api.kie.ai/v1/video/generate',
      {
        prompt: `${prompt}. Professional cinematic quality, 4K resolution, smooth motion, epic lighting, premium production value`,
        duration: duration,
        aspect_ratio: '16:9',
        quality: 'high',
        motion_level: 'high',
        style: 'cinematic'
      },
      {
        headers: {
          'Authorization': `Bearer ${KIE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const videoUrl = response.data.video_url || response.data.url;
    
    if (videoUrl) {
      // Download the generated video
      const outputPath = `${OUTPUT_DIR}/ai_clip_${sceneNum}.mp4`;
      const videoData = await axios.get(videoUrl, { responseType: 'arraybuffer' });
      await fs.writeFile(outputPath, videoData.data);
      console.log(`  ✅ AI video generated`);
      return outputPath;
    }
  } catch (error: any) {
    console.log(`  ⚠️  Kie.ai unavailable: ${error.message}`);
  }
  
  // Fallback: Use premium stock image with cinematic effects
  console.log(`  🎬 Using cinematic effects on premium imagery...`);
  return await createCinematicClip(prompt, duration, sceneNum);
}

async function createCinematicClip(prompt: string, duration: number, sceneNum: number): Promise<string> {
  // Use best available premium image with cinematic motion effects
  const premiumImages = [
    'cutting_edge_futuris_70630143.jpg',
    'premium_luxury_techn_9f13dd13.jpg',
    'cinematic_futuristic_1ce3c942.jpg',
    'advanced_ai_robotics_91050553.jpg',
    'luxury_data_visualiz_fcc171e5.jpg',
    'premium_global_busin_33e1c252.jpg',
    'cinematic_financial__d66bce63.jpg',
  ];
  
  const img = `./attached_assets/stock_images/${premiumImages[(sceneNum - 1) % premiumImages.length]}`;
  const out = `${OUTPUT_DIR}/ai_clip_${sceneNum}.mp4`;
  
  // Cinematic motion effects: zoom, pan, and particles
  const effects = [
    'zoompan=z=\'min(zoom+0.001,1.5)\':d=25*${duration}:s=1920x1080',
    'zoompan=z=\'if(lte(zoom,1.0),1.5,max(1.001,zoom-0.001))\':d=25*${duration}:s=1920x1080',
    `crop=iw-iw/zoom:ih-ih/zoom:x='if(gte(on,1),x,iw/2-(iw/zoom/2))':y='if(gte(on,1),y,ih/2-(ih/zoom/2))'`
  ];
  
  const selectedEffect = effects[sceneNum % effects.length];
  
  await execAsync(
    `ffmpeg -loop 1 -i "${img}" -t ${duration} ` +
    `-vf "${selectedEffect},format=yuv420p" ` +
    `-c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p ` +
    `"${out}" -y 2>&1 | tail -1`
  );
  
  return out;
}

async function generateCinematicVideo() {
  console.log('\n🎬 WIZARDS INCUBATOR CINEMATIC INVESTOR VIDEO');
  console.log('='.repeat(70));
  console.log('🎥 AI Motion Video Generation');
  console.log('🎤 Professional Female Voiceover');
  console.log('🎵 Epic Background Music');
  console.log('🎨 Premium Typography & Effects');
  console.log('='.repeat(70) + '\n');

  const script = JSON.parse(await fs.readFile('./video-assets/cinematic-investor-script.json', 'utf8'));
  await fs.ensureDir(OUTPUT_DIR);

  const videoClips: string[] = [];
  const voiceFiles: string[] = [];

  // Generate all scenes
  for (const scene of script.scenes as Scene[]) {
    console.log(`\n🎬 Scene ${scene.sceneNumber}: ${scene.title}`);
    
    // Generate voiceover
    const voiceFile = `${OUTPUT_DIR}/voice_${scene.sceneNumber}.mp3`;
    console.log(`  🎤 Generating professional voiceover...`);
    const tts = await openai.audio.speech.create({
      model: 'tts-1-hd',
      voice: 'nova',
      input: scene.narration,
      speed: 1.05, // Slightly faster for dynamic feel
    });
    await fs.writeFile(voiceFile, Buffer.from(await tts.arrayBuffer()));
    voiceFiles.push(voiceFile);
    
    const {stdout} = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${voiceFile}"`
    );
    const voiceDuration = parseFloat(stdout.trim());
    
    // Generate AI video clip
    const videoClip = await generateAIVideo(scene.aiVideoPrompt, voiceDuration, scene.sceneNumber);
    
    // Add premium typography overlay
    console.log(`  ✨ Adding premium typography...`);
    const finalClip = `${OUTPUT_DIR}/scene_${scene.sceneNumber}.mp4`;
    
    const title = scene.title.replace(/[^a-zA-Z0-9 ]/g, ' ').trim();
    const texts = scene.onScreenText.map(t => t.replace(/[^a-zA-Z0-9+→ :.$•%–@.]/g, ' ').trim());
    
    // Premium text with glow effect
    const textFilters: string[] = [];
    
    // Title with glow
    textFilters.push(
      `drawtext=text='${title}':` +
      `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:` +
      `fontsize=110:fontcolor=white@0.95:` +
      `x=(w-text_w)/2:y=80:` +
      `shadowcolor=cyan@0.8:shadowx=0:shadowy=0:` +
      `borderw=3:bordercolor=black@0.6`
    );
    
    // Bullets with cinematic styling
    texts.forEach((text, i) => {
      textFilters.push(
        `drawtext=text='${text}':` +
        `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:` +
        `fontsize=72:fontcolor=white@0.9:` +
        `x=(w-text_w)/2:y=${900 - (texts.length - 1 - i) * 90}:` +
        `shadowcolor=black@0.7:shadowx=3:shadowy=3`
      );
    });
    
    // Add fade transitions
    textFilters.push(`fade=in:0:20`, `fade=out:${Math.floor(voiceDuration * 30 - 20)}:20`);
    
    await execAsync(
      `ffmpeg -i "${videoClip}" -i "${voiceFile}" ` +
      `-filter_complex "${textFilters.join(',')}" ` +
      `-c:v libx264 -preset slow -crf 16 -c:a aac -b:a 256k -shortest ` +
      `"${finalClip}" -y 2>&1 | tail -1`
    );
    
    videoClips.push(finalClip);
    console.log(`  ✅ Scene complete\n`);
  }

  // Assemble final video with music
  console.log('📦 Assembling cinematic investor video with epic music...\n');
  
  const concatList = videoClips.map(v => `file '${v.split('/').pop()}'`).join('\n');
  await fs.writeFile(`${OUTPUT_DIR}/concat.txt`, concatList);
  
  const finalVideo = './video-assets/WIZARDS_INCUBATOR_CINEMATIC.mp4';
  
  await execAsync(
    `cd ${OUTPUT_DIR} && ffmpeg -f concat -safe 0 -i concat.txt -i "${MUSIC_FILE}" ` +
    `-filter_complex "[1:a]volume=0.3[music];[0:a][music]amix=inputs=2:duration=shortest[a]" ` +
    `-map 0:v -map "[a]" -c:v copy -c:a aac -b:a 320k ` +
    `"${finalVideo}" -y 2>&1 | tail -3`
  );

  const stats = await fs.stat(finalVideo);
  const {stdout: dur} = await execAsync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${finalVideo}"`
  );

  console.log('\n🎉 CINEMATIC INVESTOR VIDEO COMPLETE!');
  console.log('='.repeat(70));
  console.log(`📁 ${finalVideo}`);
  console.log(`📏 ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`⏱️  ${Math.floor(parseFloat(dur) / 60)}m ${Math.floor(parseFloat(dur) % 60)}s`);
  console.log(`🎥 AI Motion Video • Epic Music • Premium Typography`);
  console.log('='.repeat(70));
  console.log('\n✅ READY FOR GLOBAL INVESTORS!\n');
}

generateCinematicVideo().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
