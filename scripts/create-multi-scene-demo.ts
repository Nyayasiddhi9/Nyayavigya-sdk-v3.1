import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);

async function createMultiSceneDemo() {
  console.log('🎬 CREATING MULTI-SCENE WIZARDS INCUBATOR DEMO');
  console.log('==============================================\n');

  try {
    const scenes = [
      { num: 1, name: 'Ideation Lab', color: '0x7c3aed', subtitle: '14-Day MVP Transformation' },
      { num: 2, name: 'Engineering Forge', color: '0xf97316', subtitle: '188 AI Agents Building Your App' },
      { num: 3, name: 'Market Intelligence', color: '0x0ea5e9', subtitle: 'Real-Time Market Analysis' },
      { num: 4, name: 'Product Blueprint', color: '0x06b6d4', subtitle: '87% Beta Success Rate' },
      { num: 5, name: 'Experience Design', color: '0x8b5cf6', subtitle: 'AG-UI Real-Time Visibility' },
    ];

    const sceneClips: string[] = [];

    // Step 1: Create scene visuals
    console.log('🎨 Step 1: Creating scene visuals...\n');
    
    for (const scene of scenes) {
      const voicePath = `video-assets/voiceover-scene-${scene.num}.mp3`;
      const visualPath = `video-assets/scenes/scene-${scene.num}-visual.mp4`;
      
      // Get voiceover duration
      const { stdout } = await execAsync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${voicePath}"`
      );
      const duration = parseFloat(stdout.trim());
      
      console.log(`🎬 Scene ${scene.num}: ${scene.name} (${duration.toFixed(1)}s)`);
      
      // Create scene visual with studio branding
      await execAsync(`ffmpeg -f lavfi -i color=c=${scene.color}:s=1280x720:d=${duration} \
        -vf "drawtext=text='${scene.name}':fontcolor=white:fontsize=64:x=(w-text_w)/2:y=280, \
             drawtext=text='${scene.subtitle}':fontcolor=0xcccccc:fontsize=32:x=(w-text_w)/2:y=360" \
        -c:v libx264 -preset ultrafast -pix_fmt yuv420p "${visualPath}" -y 2>&1 | grep -v "^frame=" || true`);
      
      console.log(`  ✅ Visual created: ${visualPath}`);
      
      // Combine visual with voiceover
      const clipPath = `video-assets/scenes/scene-${scene.num}-clip.mp4`;
      await execAsync(`ffmpeg -i "${visualPath}" -i "${voicePath}" \
        -c:v copy -c:a aac -shortest "${clipPath}" -y 2>&1 | grep -v "^frame=" || true`);
      
      sceneClips.push(clipPath);
      console.log(`  ✅ Clip ready: ${clipPath}\n`);
    }

    // Step 2: Create concat list
    console.log('📝 Step 2: Creating final assembly list...');
    const concatList = sceneClips.map(f => `file '${process.cwd()}/${f}'`).join('\n');
    fs.writeFileSync('video-assets/scenes/concat-list.txt', concatList);
    console.log('✅ Assembly list created\n');

    // Step 3: Assemble final video
    console.log('🎬 Step 3: Assembling final demo video...');
    await execAsync(`ffmpeg -f concat -safe 0 -i video-assets/scenes/concat-list.txt \
      -c copy video-assets/wizards-incubator-demo-final.mp4 -y 2>&1 | grep -v "^frame=" || true`);
    
    console.log('✅ Final video assembled!\n');

    // Show results
    const stats = fs.statSync('video-assets/wizards-incubator-demo-final.mp4');
    const { stdout: durationOut } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 video-assets/wizards-incubator-demo-final.mp4`
    );
    const totalDuration = parseFloat(durationOut.trim());

    console.log('🎉 DEMO VIDEO COMPLETE!');
    console.log('======================');
    console.log(`📁 File: video-assets/wizards-incubator-demo-final.mp4`);
    console.log(`📏 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`⏱️  Duration: ${Math.floor(totalDuration / 60)}m ${Math.floor(totalDuration % 60)}s (${totalDuration.toFixed(1)}s total)`);
    console.log(`🎬 Scenes: ${scenes.length} professional scenes`);
    console.log(`🎙️  Voiceover: ElevenLabs professional English narration`);
    console.log(`🎨 Visuals: Branded studio-specific scenes`);
    console.log('\n✅ Ready to present to investors and founders!');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

// Ensure scenes directory exists
if (!fs.existsSync('video-assets/scenes')) {
  fs.mkdirSync('video-assets/scenes', { recursive: true });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  createMultiSceneDemo().catch(console.error);
}

export { createMultiSceneDemo };
