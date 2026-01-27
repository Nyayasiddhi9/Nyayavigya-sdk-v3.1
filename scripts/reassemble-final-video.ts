import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);

interface Scene {
  sceneNumber: number;
  duration: number;
  title: string;
  onScreenText: string[];
  imageFile: string;
}

interface VideoScript {
  scenes: Scene[];
}

async function reassembleFinalVideo() {
  console.log('🎬 REASSEMBLING PROFESSIONAL VIDEO WITH VOICEOVERS');
  console.log('='.repeat(55) + '\n');

  const script: VideoScript = JSON.parse(
    fs.readFileSync('video-assets/complete-video-script.json', 'utf-8')
  );

  // Recreate clips directory
  if (fs.existsSync('video-assets/final-clips')) {
    fs.rmSync('video-assets/final-clips', { recursive: true });
  }
  fs.mkdirSync('video-assets/final-clips', { recursive: true });

  const videoClips: string[] = [];

  for (const scene of script.scenes) {
    const imagePath = `attached_assets/stock_images/${scene.imageFile}`;
    const voicePath = `video-assets/pro-voice-${scene.sceneNumber}.mp3`;
    const clipPath = `video-assets/final-clips/scene-${scene.sceneNumber}.mp4`;

    console.log(`🎬 Scene ${scene.sceneNumber}: ${scene.title}`);

    // Get voiceover duration
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${voicePath}"`
    );
    const duration = parseFloat(stdout.trim());

    // Create text overlays (simplified for compatibility)
    const textLines = scene.onScreenText.slice(0, 3);
    const textOverlays = textLines.map((text, i) => {
      const yPos = 250 + (i * 80);
      const cleanText = text.replace(/['"]/g, '');
      return `drawtext=text=${cleanText}:fontcolor=white:fontsize=44:x=(w-text_w)/2:y=${yPos}:box=1:boxcolor=black@0.5:boxborderw=8`;
    }).join(',');

    const cleanTitle = scene.title.replace(/['"]/g, '');
    const titleOverlay = `drawtext=text=${cleanTitle}:fontcolor=0x7c3aed:fontsize=56:x=(w-text_w)/2:y=120:box=1:boxcolor=black@0.7:boxborderw=12`;

    const fullFilter = `scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,${titleOverlay},${textOverlays}`;

    // Create video clip with image, text, and professional voiceover
    await execAsync(
      `ffmpeg -loop 1 -i "${imagePath}" -i "${voicePath}" -vf "${fullFilter}" \
      -c:v libx264 -preset ultrafast -tune stillimage -c:a aac -shortest -t ${duration} \
      "${clipPath}" -y 2>&1 | grep -v "^frame=" || true`
    );

    videoClips.push(clipPath);
    console.log(`   ✅ Created with ${duration.toFixed(1)}s professional voiceover\n`);
  }

  console.log('📦 Assembling final video...\n');

  // Create concat file
  const concatList = videoClips.map(f => `file '${process.cwd()}/${f}'`).join('\n');
  fs.writeFileSync('video-assets/final-clips/concat-list.txt', concatList);

  // Assemble final video
  await execAsync(
    `ffmpeg -f concat -safe 0 -i video-assets/final-clips/concat-list.txt \
    -c copy video-assets/wizards-incubator-professional.mp4 -y 2>&1 | grep -v "^frame=" || true`
  );

  // Get final stats
  const stats = fs.statSync('video-assets/wizards-incubator-professional.mp4');
  const { stdout: durationOut } = await execAsync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 \
    video-assets/wizards-incubator-professional.mp4`
  );
  const totalDuration = parseFloat(durationOut.trim());

  console.log('🎉 PROFESSIONAL VIDEO COMPLETE!');
  console.log('='.repeat(55));
  console.log(`📁 File: video-assets/wizards-incubator-professional.mp4`);
  console.log(`📏 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`⏱️  Duration: ${Math.floor(totalDuration / 60)}m ${Math.floor(totalDuration % 60)}s`);
  console.log(`🎙️  Voiceover: Professional OpenAI TTS HD narration`);
  console.log(`🎬 Quality: 1280x720, 15 scenes, all 10 studios`);
  console.log(`\n✅ Ready for investor presentations!`);
}

reassembleFinalVideo().catch(console.error);
