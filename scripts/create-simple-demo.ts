import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);

async function createSimpleDemo() {
  console.log('🎬 CREATING SIMPLE WIZARDS INCUBATOR DEMO VIDEO');
  console.log('===============================================\n');

  try {
    // Step 1: Concatenate all voiceovers
    console.log('🎙️  Step 1: Merging voiceover files...');
    const voiceFiles = [
      'video-assets/voiceover-scene-1.mp3',
      'video-assets/voiceover-scene-2.mp3',
      'video-assets/voiceover-scene-3.mp3',
      'video-assets/voiceover-scene-4.mp3',
      'video-assets/voiceover-scene-5.mp3',
    ];

    // Create concat list with absolute paths
    const concatList = voiceFiles.map(f => `file '${process.cwd()}/${f}'`).join('\n');
    fs.writeFileSync('video-assets/concat-list.txt', concatList);

    // Merge audio files
    await execAsync('ffmpeg -f concat -safe 0 -i video-assets/concat-list.txt -c copy video-assets/full-narration.mp3 -y');
    console.log('✅ Voiceovers merged\n');

    // Step 2: Get audio duration
    console.log('📊 Step 2: Calculating video duration...');
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 video-assets/full-narration.mp3`
    );
    const duration = parseFloat(stdout.trim());
    console.log(`✅ Duration: ${duration.toFixed(1)} seconds\n`);

    // Step 3: Create static video with platform branding
    console.log('🎨 Step 3: Creating branded video...');
    
    // Create a simple gradient background video
    await execAsync(`ffmpeg -f lavfi -i color=c=0x1a1b26:s=1280x720:d=${duration} \
      -vf "drawtext=text='WIZARDS INCUBATOR':fontcolor=white:fontsize=72:x=(w-text_w)/2:y=250, \
           drawtext=text='World'\\'s First AI-Native Accelerator':fontcolor=0x7c3aed:fontsize=36:x=(w-text_w)/2:y=350, \
           drawtext=text='Transform Your Idea into MVP in 14 Days':fontcolor=gray:fontsize=28:x=(w-text_w)/2:y=450" \
      -c:v libx264 -pix_fmt yuv420p -preset ultrafast video-assets/visual-base.mp4 -y`);
    console.log('✅ Visual created\n');

    // Step 4: Combine audio and video
    console.log('🎬 Step 4: Combining audio and video...');
    await execAsync(`ffmpeg -i video-assets/visual-base.mp4 -i video-assets/full-narration.mp3 \
      -c:v copy -c:a aac -shortest video-assets/wizards-incubator-demo-simple.mp4 -y`);
    
    console.log('✅ Final video created!\n');

    // Show results
    const stats = fs.statSync('video-assets/wizards-incubator-demo-simple.mp4');
    console.log('📊 DEMO VIDEO COMPLETE!');
    console.log('=======================');
    console.log(`📁 File: video-assets/wizards-incubator-demo-simple.mp4`);
    console.log(`📏 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`⏱️  Duration: ~${Math.round(duration)} seconds`);
    console.log('\n🎯 Demo video ready to share with investors!');
    console.log('🚀 Professional voiceover narration with platform branding');

  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  createSimpleDemo().catch(console.error);
}

export { createSimpleDemo };
