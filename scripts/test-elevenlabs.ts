import { VoiceoverGenerator } from '../server/services/voiceover-generator.js';

async function testElevenLabs() {
  console.log('🎙️ Testing ElevenLabs API...\n');

  try {
    const voiceGen = new VoiceoverGenerator();
    
    // Test 1: List available voices
    console.log('📋 Fetching available voices...');
    const voices = await voiceGen.listVoices();
    
    if (voices.length > 0) {
      console.log(`✅ Found ${voices.length} voices:`);
      voices.slice(0, 5).forEach((voice: any) => {
        console.log(`   - ${voice.name} (${voice.voice_id})`);
      });
      console.log('');
    }

    // Test 2: Generate a short voiceover
    console.log('🎙️ Generating test voiceover...');
    const testText = 'Welcome to Wizards Incubator, the world\'s first AI-native accelerator. We transform startup ideas into production-ready MVPs in just 14 days.';
    
    await voiceGen.generateVoiceover(
      testText,
      'video-assets/test-voiceover.mp3'
    );

    console.log('\n✅ ElevenLabs API test successful!');
    console.log('📁 Test voiceover saved: video-assets/test-voiceover.mp3');
    console.log('🎧 Play it to verify quality\n');

  } catch (error) {
    console.error('\n❌ ElevenLabs API test failed:', error);
    console.error('\nTroubleshooting:');
    console.error('1. Check ELEVENLABS_API_KEY is set correctly');
    console.error('2. Verify API key has sufficient credits');
    console.error('3. Check API key permissions\n');
    process.exit(1);
  }
}

testElevenLabs().catch(console.error);
