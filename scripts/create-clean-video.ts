import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);

interface Scene {
  sceneNumber: number;
  title: string;
  onScreenText: string[];
  imageFile: string;
}

interface VideoScript {
  scenes: Scene[];
}

async function createCleanVideo() {
  console.log('🎬 CREATING CLEAN VIDEO - Fresh Approach\n');

  const script: VideoScript = JSON.parse(
    fs.readFileSync('video-assets/complete-video-script.json', 'utf-8')
  );

  // Create fresh directory
  const outDir = 'video-assets/clean-clips';
  if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true });
  fs.mkdirSync(outDir, { recursive: true });

  const clips: string[] = [];

  for (const scene of script.scenes) {
    const img = `attached_assets/stock_images/${scene.imageFile}`;
    const voice = `video-assets/pro-voice-${scene.sceneNumber}.mp3`;
    const out = `${outDir}/s${scene.sceneNumber}.mp4`;

    console.log(`Scene ${scene.sceneNumber}: ${scene.title}`);

    // Get exact voiceover duration
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${voice}"`
    );
    const dur = parseFloat(stdout.trim());

    // Simple text overlay
    const title = scene.title.replace(/[^a-zA-Z0-9 ]/g, '');
    const text1 = scene.onScreenText[0]?.replace(/[^a-zA-Z0-9 +]/g, '') || '';
    const text2 = scene.onScreenText[1]?.replace(/[^a-zA-Z0-9 +]/g, '') || '';
    
    // Create clip with EXACT duration from voiceover
    await execAsync(`ffmpeg -loop 1 -framerate 25 -t ${dur} -i "${img}" \
      -i "${voice}" \
      -vf "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,\
drawtext=text='${title}':fontcolor=purple:fontsize=48:x=(w-text_w)/2:y=100,\
drawtext=text='${text1}':fontcolor=white:fontsize=36:x=(w-text_w)/2:y=300,\
drawtext=text='${text2}':fontcolor=white:fontsize=36:x=(w-text_w)/2:y=400" \
      -c:v libx264 -preset medium -profile:v main -pix_fmt yuv420p \
      -c:a aac -b:a 128k -shortest "${out}" -y 2>&1 | tail -1`);

    clips.push(out);
    console.log(`  ✓ ${dur.toFixed(2)}s\n`);
  }

  console.log('Concatenating...\n');

  // Create concat list
  const list = clips.map(c => `file '${c}'`).join('\n');
  fs.writeFileSync(`${outDir}/list.txt`, list);

  // Concat with re-encode to ensure compatibility
  await execAsync(`ffmpeg -f concat -safe 0 -i ${outDir}/list.txt \
    -c:v libx264 -preset medium -c:a aac \
    video-assets/wizards-demo-clean.mp4 -y 2>&1 | tail -1`);

  const { stdout: finalDur } = await execAsync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 video-assets/wizards-demo-clean.mp4`
  );

  const stats = fs.statSync('video-assets/wizards-demo-clean.mp4');

  console.log('✅ DONE!');
  console.log(`📁 wizards-demo-clean.mp4`);
  console.log(`⏱️  ${Math.floor(parseFloat(finalDur) / 60)}m ${Math.floor(parseFloat(finalDur) % 60)}s`);
  console.log(`📏 ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
}

createCleanVideo().catch(console.error);
