import fs from 'fs-extra';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const PREMIUM_IMAGES = [
  'cutting_edge_futuris_70630143.jpg',     // Scene 1: Platform reveal
  'premium_luxury_techn_9f13dd13.jpg',     // Scene 2: Vision
  'cinematic_futuristic_1ce3c942.jpg',     // Scene 3: Problem solved
  'advanced_ai_robotics_91050553.jpg',     // Scene 4: WAI-SDK
  'premium_luxury_techn_019c6187.jpg',     // Scene 5: Studios
  'premium_global_busin_33e1c252.jpg',     // Scene 6: Market
  'cinematic_financial__d66bce63.jpg',     // Scene 7: Financials
  'luxury_data_visualiz_fcc171e5.jpg',     // Scene 8: Investment
  'cutting_edge_futuris_e8234cb8.jpg',     // Scene 9: CTA
];

async function createScene(num: number, duration: number, title: string, texts: string[]) {
  const voice = `cinematic_investor/voice_${num}.mp3`;
  const img = `attached_assets/stock_images/${PREMIUM_IMAGES[num - 1]}`;
  const out = `cinematic_investor/scene_${num}.mp4`;
  
  console.log(`Scene ${num}: ${title}...`);
  
  // Clean text
  const cleanTitle = title.replace(/[^a-zA-Z0-9 ]/g, ' ').trim();
  const cleanTexts = texts.map(t => t.replace(/[^a-zA-Z0-9+→ :.$•%–@.]/g, ' ').trim());
  
  // Premium typography with blur/glow shadow
  const filters = [
    'scale=1920:1080:force_original_aspect_ratio=increase',
    'crop=1920:1080',
  ];
  
  // Title - PREMIUM with cyan glow
  filters.push(
    `drawtext=text='${cleanTitle}':` +
    `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:` +
    `fontsize=120:fontcolor=white:` +
    `x=(w-text_w)/2:y=70:` +
    `shadowcolor=0x00FFFF@0.5:shadowx=0:shadowy=0`
  );
  
  // Add second layer for glow effect
  filters.push(
    `drawtext=text='${cleanTitle}':` +
    `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:` +
    `fontsize=120:fontcolor=white:` +
    `x=(w-text_w)/2:y=70:` +
    `shadowcolor=black@0.8:shadowx=4:shadowy=4`
  );
  
  // Bullets - LARGE with premium styling
  cleanTexts.forEach((text, i) => {
    const y = 900 - ((cleanTexts.length - 1 - i) * 100);
    filters.push(
      `drawtext=text='${text}':` +
      `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:` +
      `fontsize=76:fontcolor=white@0.95:` +
      `x=(w-text_w)/2:y=${y}:` +
      `shadowcolor=black@0.7:shadowx=3:shadowy=3`
    );
  });
  
  // Cinematic fades
  filters.push('fade=in:0:25', `fade=out:${Math.floor(duration * 30 - 25)}:25`);
  
  await execAsync(
    `ffmpeg -loop 1 -framerate 30 -t ${duration} -i "${img}" -i "${voice}" ` +
    `-vf "${filters.join(',')}" ` +
    `-c:v libx264 -preset medium -crf 16 -pix_fmt yuv420p ` +
    `-c:a aac -b:a 256k -shortest ` +
    `"${out}" -y 2>&1 | tail -1`
  );
  
  console.log(`  ✓ Done\n`);
}

async function main() {
  console.log('\n🎬 WIZARDS INCUBATOR - CINEMATIC INVESTOR VIDEO\n');
  console.log('Creating professional scenes with premium typography...\n');
  
  await createScene(1, 7, 'WIZARDS INCUBATOR PLATFORM', ['AI-Native Accelerator', '14-Day MVP', 'Enterprise Grade']);
  await createScene(2, 9, 'The Vision', ['Months → Days', 'Autonomous AI', 'Enterprise Grade']);
  await createScene(3, 10, 'The Problem Solved', ['14 Days vs 3-6 Months', '90% Cost Reduction', 'Zero Tech Debt']);
  await createScene(4, 11, 'WAI-SDK Architecture', ['267+ AI Agents', '23+ LLM Providers', '752+ Models', 'Enterprise Security']);
  await createScene(5, 9, '10 Parallel Studios', ['10 Studios', '24/7 Execution', 'Full Autonomy']);
  await createScene(6, 9, 'Market Dominance', ['$1.4T+ Market', 'Global Reach', 'Zero Debt']);
  await createScene(7, 11, 'Financial Excellence', ['Y1: $2.5M', 'Y3: $45M', '49% EBITDA', 'LTV:CAC 22.5:1']);
  await createScene(8, 9, 'Investment Opportunity', ['$2M Seed Round', 'Global Scale', 'Join The Future']);
  await createScene(9, 7, 'WIZARDS INCUBATOR', ['invest@wizardsincubator.ai', 'wizardsincubator.ai', 'Transform Your Portfolio']);
  
  console.log('📦 Assembling with epic music...\n');
  
  const concat = Array.from({length: 9}, (_, i) => `file 'scene_${i+1}.mp4'`).join('\n');
  await fs.writeFile('cinematic_investor/list.txt', concat);
  
  await execAsync(
    `cd cinematic_investor && ffmpeg -f concat -safe 0 -i list.txt -i ../video-assets/cinematic-epic-music.mp3 ` +
    `-filter_complex "[1:a]volume=0.25,afade=in:st=0:d=2,afade=out:st=80:d=2[music];[0:a][music]amix=inputs=2:duration=first[a]" ` +
    `-map 0:v -map "[a]" -c:v copy -c:a aac -b:a 320k ` +
    `../video-assets/WIZARDS_INCUBATOR_CINEMATIC.mp4 -y 2>&1 | tail -3`
  );
  
  const stats = fs.statSync('video-assets/WIZARDS_INCUBATOR_CINEMATIC.mp4');
  const {stdout} = await execAsync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 video-assets/WIZARDS_INCUBATOR_CINEMATIC.mp4`
  );
  
  console.log('\n✅ CINEMATIC VIDEO COMPLETE!');
  console.log(`📁 video-assets/WIZARDS_INCUBATOR_CINEMATIC.mp4`);
  console.log(`📏 ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`⏱️  ${Math.floor(parseFloat(stdout) / 60)}m ${Math.floor(parseFloat(stdout) % 60)}s`);
  console.log(`🎬 1920x1080 • Epic Music • Premium Typography`);
  console.log('\n🌟 READY FOR GLOBAL INVESTORS!\n');
}

main().catch(console.error);
