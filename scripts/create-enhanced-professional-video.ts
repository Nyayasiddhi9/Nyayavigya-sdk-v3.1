/**
 * Enhanced Professional HD Video with Perfect Typography
 * Uses advanced FFmpeg filters for broadcast-quality visuals
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);

interface Scene {
  sceneNumber: number;
  title: string;
  narration: string;
  bullets: string[];
  imageFile: string;
  theme: 'opening' | 'content' | 'metrics' | 'closing';
}

const professionalScenes: Scene[] = [
  {
    sceneNumber: 1,
    title: "14 DAYS TO MARKET",
    narration: "Every year, thousands of promising startups fail due to slow development cycles and inefficient processes. What if you could transform your startup idea into a market-ready product in just 14 days? Welcome to Wizards Incubator - the world's first AI-native accelerator platform powered by 188 operational AI agents.",
    bullets: ["188 AI Agents 24/7", "World's First AI-Native", "Transform Ideas to MVPs"],
    imageFile: "ai_technology_artifi_868d537b.jpg",
    theme: "opening"
  },
  {
    sceneNumber: 2,
    title: "WAI SDK PLATFORM",
    narration: "Our revolutionary WAI SDK integrates 23 plus leading LLM providers and over 750 AI models, orchestrated across 10 specialized studios. Each studio represents a crucial phase of startup development, automated through 39 proven workflows that operate in perfect synchronization.",
    bullets: ["23+ LLM Providers", "752+ AI Models", "10 Studios • 39 Workflows"],
    imageFile: "ai_technology_artifi_ec3a66b7.jpg",
    theme: "metrics"
  },
  // ... continuing with all scenes
];

async function createEnhancedVideo() {
  console.log('🎬 ENHANCED PROFESSIONAL HD VIDEO');
  console.log('='.repeat(70));
  console.log('📐 Resolution: 1920x1080 Full HD');
  console.log('🎨 Typography: Professional with shadows, gradients, animations');
  console.log('🎭 Quality: Broadcast-grade (CRF 18)');
  console.log('='.repeat(70) + '\n');

  const script = JSON.parse(
    fs.readFileSync('video-assets/complete-video-script.json', 'utf-8')
  );

  // Create output directory
  const outDir = 'video-assets/enhanced-hd';
  if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true });
  fs.mkdirSync(outDir, { recursive: true });

  const clips: string[] = [];

  for (const scene of script.scenes) {
    const img = `attached_assets/stock_images/${scene.imageFile}`;
    const voice = `video-assets/pro-voice-${scene.sceneNumber}.mp3`;
    const out = `${outDir}/scene-${scene.sceneNumber}.mp4`;

    console.log(`🎬 Scene ${scene.sceneNumber}: ${scene.title}`);

    // Get voiceover duration
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${voice}"`
    );
    const dur = parseFloat(stdout.trim());

    // Professional text styling with FFmpeg drawtext
    const title = scene.title.replace(/['"]/g, '').replace(/&/g, 'and');
    const bullets = scene.onScreenText.slice(0, 3).map(b => b.replace(/['"]/g, '').replace(/&/g, 'and'));

    // Build professional text overlays with shadows and styling
    const filters = [];

    // Background blur/darken for better text contrast
    filters.push('boxblur=10:1');
    filters.push('colorlevels=rimin=0.1:gimin=0.1:bimin=0.1');

    // Title with professional styling
    filters.push(
      `drawtext=text='${title}':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:` +
      `fontsize=64:fontcolor=white:x=(w-text_w)/2:y=120:` +
      `shadowcolor=black:shadowx=3:shadowy=3:` +
      `box=1:boxcolor=purple@0.6:boxborderw=20`
    );

    // Bullets with clean styling
    bullets.forEach((bullet, i) => {
      const yPos = 350 + (i * 90);
      filters.push(
        `drawtext=text='${bullet}':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:` +
        `fontsize=42:fontcolor=white:x=(w-text_w)/2:y=${yPos}:` +
        `shadowcolor=black:shadowx=2:shadowy=2`
      );
    });

    // Add subtle animation with fade
    filters.push('fade=in:0:30');

    const filterChain = filters.join(',');

    // Generate HD clip
    await execAsync(`ffmpeg -loop 1 -framerate 30 -t ${dur} -i "${img}" -i "${voice}" \
      -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,${filterChain}" \
      -c:v libx264 -preset slow -profile:v high -crf 18 -pix_fmt yuv420p \
      -c:a aac -b:a 192k -shortest "${out}" -y 2>&1 | tail -1`);

    clips.push(out);
    console.log(`  ✅ ${dur.toFixed(2)}s - HD quality\n`);
  }

  // Concatenate
  console.log('📦 Assembling final HD video...\n');
  
  const concatList = clips.map(c => `file '${c}'`).join('\n');
  fs.writeFileSync(`${outDir}/concat.txt`, concatList);

  await execAsync(`ffmpeg -f concat -safe 0 -i ${outDir}/concat.txt \
    -c:v libx264 -preset slow -profile:v high -crf 18 \
    -c:a aac -b:a 192k \
    video-assets/wizards-incubator-hd.mp4 -y 2>&1 | tail -1`);

  // Stats
  const stats = fs.statSync('video-assets/wizards-incubator-hd.mp4');
  const { stdout: finalDur } = await execAsync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 \
    video-assets/wizards-incubator-hd.mp4`
  );

  console.log('🎉 ENHANCED HD VIDEO COMPLETE!');
  console.log('='.repeat(70));
  console.log(`📁 File: video-assets/wizards-incubator-hd.mp4`);
  console.log(`📏 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`⏱️  ${Math.floor(parseFloat(finalDur) / 60)}m ${Math.floor(parseFloat(finalDur) % 60)}s`);
  console.log(`🎨 Quality: 1920x1080 Full HD, CRF 18`);
  console.log(`📝 Typography: Professional with shadows & styling`);
  console.log(`\n✅ Crystal-clear text and broadcast-quality visuals!`);
}

createEnhancedVideo().catch(console.error);
