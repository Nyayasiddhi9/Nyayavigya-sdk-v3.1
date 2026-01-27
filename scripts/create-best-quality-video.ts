import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);

async function createBestQualityVideo() {
  console.log('🎬 BEST QUALITY PROFESSIONAL VIDEO');
  console.log('='.repeat(70));
  console.log('📐 Resolution: 1920x1080 Full HD');
  console.log('🎨 Typography: Extra Large & Crystal Clear');
  console.log('🎭 Quality: CRF 16 (Near Lossless)');
  console.log('='.repeat(70) + '\n');

  const script = JSON.parse(
    fs.readFileSync('video-assets/complete-video-script.json', 'utf-8')
  );

  const outDir = 'video-assets/best-quality';
  if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true });
  fs.mkdirSync(outDir, { recursive: true });

  const clips: string[] = [];

  for (const scene of script.scenes) {
    const sceneNum = scene.sceneNumber;
    const img = `attached_assets/stock_images/${scene.imageFile}`;
    const voice = `video-assets/pro-voice-${sceneNum}.mp3`;
    const out = `${outDir}/scene${sceneNum}.mp4`;

    console.log(`🎬 Scene ${sceneNum}: ${scene.title}`);

    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${voice}"`
    );
    const dur = parseFloat(stdout.trim());

    // Ultra-clean text without special characters
    const title = scene.title.replace(/[^a-zA-Z0-9 ]/g, ' ').trim();
    const bullets = scene.onScreenText.slice(0, 3).map(b => 
      b.replace(/[^a-zA-Z0-9+ ]/g, ' ').trim()
    );

    // Simple, clear filter with large fonts
    const filters = [];
    
    // High quality scale to 1920x1080
    filters.push('scale=1920:1080:force_original_aspect_ratio=increase');
    filters.push('crop=1920:1080');
    
    // Title - EXTRA LARGE with shadow
    filters.push(
      `drawtext=text='${title}':` +
      `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:` +
      `fontsize=84:fontcolor=white:` +
      `x=(w-text_w)/2:y=140:` +
      `shadowcolor=black:shadowx=4:shadowy=4`
    );

    // Bullets - LARGE with shadow
    bullets.forEach((bullet, i) => {
      const yPos = 380 + (i * 100);
      filters.push(
        `drawtext=text='${bullet}':` +
        `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:` +
        `fontsize=58:fontcolor=white:` +
        `x=(w-text_w)/2:y=${yPos}:` +
        `shadowcolor=black:shadowx=3:shadowy=3`
      );
    });

    const filterChain = filters.join(',');

    // Best Quality Encoding
    await execAsync(`ffmpeg -loop 1 -framerate 30 -t ${dur} -i "${img}" -i "${voice}" \
      -vf "${filterChain}" \
      -c:v libx264 -preset slower -profile:v high -crf 16 -pix_fmt yuv420p \
      -c:a aac -b:a 256k -shortest \
      "${out}" -y 2>&1 | grep -E "time=|error" | tail -2 || echo "  Done"`);

    clips.push(out);
    console.log(`  ✅ ${dur.toFixed(1)}s\n`);
  }

  // Assemble
  console.log('📦 Assembling final video...\n');
  
  const concatList = clips.map(c => `file '${c}'`).join('\n');
  fs.writeFileSync(`${outDir}/concat.txt`, concatList);

  await execAsync(`ffmpeg -f concat -safe 0 -i ${outDir}/concat.txt \
    -c:v libx264 -preset slower -profile:v high -crf 16 \
    -c:a aac -b:a 256k \
    video-assets/wizards-incubator-BEST-QUALITY.mp4 -y 2>&1 | grep -E "time=|size=" | tail -2 || echo "Done"`);

  const stats = fs.statSync('video-assets/wizards-incubator-BEST-QUALITY.mp4');
  const { stdout: finalDur } = await execAsync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 \
    video-assets/wizards-incubator-BEST-QUALITY.mp4`
  );

  console.log('\n🎉 BEST QUALITY VIDEO COMPLETE!');
  console.log('='.repeat(70));
  console.log(`📁 File: video-assets/wizards-incubator-BEST-QUALITY.mp4`);
  console.log(`📏 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`⏱️  Duration: ${Math.floor(parseFloat(finalDur) / 60)}m ${Math.floor(parseFloat(finalDur) % 60)}s`);
  console.log(`🎨 Typography: 84px title, 58px bullets (EXTRA LARGE & CLEAR!)`);
  console.log(`🎬 Quality: 1920x1080, CRF 16 (near-lossless)`);
  console.log(`\n✅ Perfect typography - fonts and text are crystal clear!`);
}

createBestQualityVideo().catch(console.error);
