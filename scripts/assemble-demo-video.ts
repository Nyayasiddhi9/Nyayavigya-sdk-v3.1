import { VideoAssembler } from '../server/services/video-assembler.js';
import { generateAllSceneClips } from './generate-scene-slides.js';
import type { VideoScript } from '../server/services/video-script-generator.js';
import fs from 'fs';
import path from 'path';

async function assembleDemoVideo() {
  console.log('🎬 WIZARDS INCUBATOR DEMO VIDEO ASSEMBLER');
  console.log('==========================================\n');

  try {
    // Load existing script
    console.log('📝 Loading script...');
    const script: VideoScript = JSON.parse(
      fs.readFileSync('video-assets/script.json', 'utf-8')
    );
    console.log(`✅ Script loaded: ${script.scenes.length} scenes\n`);

    // Check for existing voiceovers
    console.log('🎙️ Checking for voiceovers...');
    const voiceFiles: string[] = [];
    for (let i = 1; i <= script.scenes.length; i++) {
      const voicePath = `video-assets/voiceover-scene-${i}.mp3`;
      if (fs.existsSync(voicePath)) {
        voiceFiles.push(voicePath);
        console.log(`  ✅ Found: ${voicePath}`);
      } else {
        console.error(`  ❌ Missing: ${voicePath}`);
        throw new Error(`Missing voiceover file: ${voicePath}`);
      }
    }
    console.log(`✅ All ${voiceFiles.length} voiceovers found\n`);

    // Generate scene clips
    console.log('🎨 Generating scene clips with colored title cards...');
    const videoClips = await generateAllSceneClips(script);
    console.log(`✅ Generated ${videoClips.length} scene clips\n`);

    // Validate counts match
    console.log('📊 Validation:');
    console.log(`  Scenes: ${script.scenes.length}`);
    console.log(`  Video clips: ${videoClips.length}`);
    console.log(`  Voiceovers: ${voiceFiles.length}`);
    
    if (videoClips.length !== voiceFiles.length || videoClips.length !== script.scenes.length) {
      throw new Error(`Count mismatch! ${videoClips.length} clips, ${voiceFiles.length} voices, ${script.scenes.length} scenes`);
    }
    console.log('✅ All counts match\n');

    // Assemble final video
    console.log('🎬 Assembling final video...');
    const assembler = new VideoAssembler();
    const outputPath = 'video-assets/wizards-incubator-demo.mp4';
    
    await assembler.assembleVideo(
      script,
      videoClips,
      voiceFiles,
      null, // No background music for now
      outputPath
    );

    console.log('\n✅ DEMO VIDEO ASSEMBLY COMPLETE!');
    console.log('📁 Output files:');
    console.log(`   - Script: video-assets/script.json`);
    console.log(`   - Voiceovers: video-assets/voiceover-scene-*.mp3`);
    console.log(`   - Scene clips: video-assets/scene-clips/*.webm`);
    console.log(`   - Final video: ${outputPath}\n`);
    
    // Check file size
    const stats = fs.statSync(outputPath);
    console.log(`📊 Video file size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
    console.log('\n🎯 Demo video is ready!');
    console.log('🚀 Share with investors and founders!');

  } catch (error) {
    console.error('\n❌ Error during video assembly:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  assembleDemoVideo().catch(console.error);
}

export { assembleDemoVideo };
