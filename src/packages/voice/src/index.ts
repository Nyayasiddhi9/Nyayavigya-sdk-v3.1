/**
 * WAI SDK v2.0 Voice Package
 * 
 * Voice and audio services including:
 * - Real-time voice streaming
 * - Voice synthesis (TTS) with ElevenLabs
 * - Voiceover generation
 * 
 * Services included:
 * - voice-synthesis-engine.ts: TTS with ElevenLabs
 * - voiceover-generator.ts: AI voiceover generation
 * - realtime-voice-streaming.ts: Real-time streaming
 * 
 * Note: Import services directly from their source files.
 * Some services may require path adjustments for standalone SDK use.
 */

export const voicePackageInfo = {
  name: 'wai-sdk-voice',
  version: '2.0.0',
  services: [
    'voice-synthesis-engine',
    'voiceover-generator',
    'realtime-voice-streaming'
  ],
  capabilities: [
    'Text-to-Speech (TTS)',
    'Voice Synthesis',
    'ElevenLabs Integration',
    'Real-time Voice Streaming',
    'Voiceover Generation'
  ]
};
