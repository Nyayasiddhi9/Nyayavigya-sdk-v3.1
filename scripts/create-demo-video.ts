import { VideoScriptGenerator } from '../server/services/video-script-generator.js';
import { VoiceoverGenerator } from '../server/services/voiceover-generator.js';
import { VideoAssembler } from '../server/services/video-assembler.js';
import { generateAllSceneClips } from './generate-scene-slides.js';
import fs from 'fs';
import path from 'path';

async function createDemoVideo() {
  console.log('🎬 WIZARDS INCUBATOR DEMO VIDEO GENERATOR');
  console.log('==========================================\n');

  try {
    // Step 1: Generate script
    console.log('📝 Step 1: Generating script with Claude 3.5 Sonnet...');
    const scriptGen = new VideoScriptGenerator();
    const script = await scriptGen.generateScript();
    fs.writeFileSync('video-assets/script.json', JSON.stringify(script, null, 2));
    console.log(`✅ Script generated: ${script.scenes.length} scenes\n`);

    // Step 2: Generate voiceovers
    console.log('🎙️ Step 2: Generating voiceovers with ElevenLabs...');
    const voiceGen = new VoiceoverGenerator();
    const voiceFiles = await voiceGen.generateSceneVoiceovers(script);
    console.log(`✅ Voiceovers generated: ${voiceFiles.length} files\n`);

    // Step 3: Generate scene clips from static visuals
    console.log('🎨 Step 3: Generating scene clips from visuals...');
    console.log('📝 Using static images with Ken Burns effects\n');
    
    const videoClips = await generateAllSceneClips(script);
    console.log(`✅ Generated ${videoClips.length} scene clips\n`);

    // Step 4: Check background music
    console.log('🎵 Step 4: Checking background music...');
    const musicPath = 'video-assets/background-music.mp3';
    
    if (!fs.existsSync(musicPath)) {
      console.log('\n⚠️  Background music not found!');
      console.log('📥 Please download background music:');
      console.log('   1. Visit: https://www.youtube.com/audiolibrary');
      console.log('   2. Search: "upbeat corporate tech background music"');
      console.log('   3. Download MP3 (180+ seconds)');
      console.log('   4. Save as: video-assets/background-music.mp3\n');
      console.log('💡 Continuing without background music for now...\n');
    } else {
      console.log('✅ Background music found\n');
    }

    // Step 5: Assemble video
    console.log('🎬 Step 5: Assembling final video with FFmpeg...');
    
    // Validate we have exactly what we need
    console.log(`📊 Validation: ${videoClips.length} clips, ${voiceFiles.length} voiceovers, ${script.scenes.length} scenes`);
    
    if (videoClips.length === 0) {
      console.error('❌ No video clips found');
      process.exit(1);
    }

    const assembler = new VideoAssembler();
    
    if (fs.existsSync(musicPath)) {
      // Full assembly with all components
      console.log('🎬 Assembling full video with background music...');
      await assembler.assembleVideo(
        script,
        videoClips,
        voiceFiles,
        musicPath,
        'video-assets/wizards-incubator-demo-final.mp4'
      );
    } else {
      // Simple assembly (just video + voiceover)
      console.log('⚠️  Creating simplified video (no background music)');
      
      // Combine first video with first voiceover as demo
      await assembler.createSimpleVideo(
        videoClips[0],
        voiceFiles[0],
        'video-assets/wizards-incubator-demo-simple.mp4'
      );
      
      console.log('✅ Simple demo video created');
      console.log('💡 Add background music and re-run for full assembly');
    }

    console.log('\n✅ DEMO VIDEO GENERATION COMPLETE!');
    console.log('📁 Output files:');
    console.log('   - Script: video-assets/script.json');
    console.log('   - Voiceovers: video-assets/voiceover-scene-*.mp3');
    console.log('   - Recordings: video-assets/recordings/*.webm');
    console.log('   - Final video: video-assets/*.mp4\n');
    
    console.log('🎯 Next steps:');
    console.log('1. Review video quality');
    console.log('2. Add background music if not present');
    console.log('3. Re-run with music for full assembly');
    console.log('4. Upload to YouTube/Vimeo');
    console.log('5. Share with investors! 🚀');

  } catch (error) {
    console.error('\n❌ Error during video generation:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createDemoVideo().catch(console.error);
}

export { createDemoVideo };
