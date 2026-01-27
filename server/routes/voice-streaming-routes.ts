/**
 * Real-Time Voice Streaming API Routes
 * WebSocket and REST endpoints for voice AI
 */

import { Router } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { 
  realtimeVoiceService, 
  generateCostReport,
  type VoiceStreamConfig 
} from '../services/realtime-voice-streaming.js';
import crypto from 'crypto';

const router = Router();

// ==================== REST API Routes ====================

// Create new voice streaming session
router.post('/voice/sessions', async (req, res) => {
  try {
    const sessionId = crypto.randomUUID();
    const config: VoiceStreamConfig = {
      sessionId,
      sttProvider: req.body.sttProvider || 'auto',
      ttsProvider: req.body.ttsProvider || 'auto',
      voiceId: req.body.voiceId,
      language: req.body.language || 'en-US',
      enableInterruption: req.body.enableInterruption !== false,
      costMode: req.body.costMode || 'economy' // Default to cheapest
    };

    // Auto-select providers based on cost mode
    if (config.sttProvider === 'auto') {
      config.sttProvider = realtimeVoiceService.selectProvider('stt', config.costMode!) as typeof config.sttProvider;
    }
    if (config.ttsProvider === 'auto') {
      config.ttsProvider = realtimeVoiceService.selectProvider('tts', config.costMode!) as typeof config.ttsProvider;
    }

    const session = realtimeVoiceService.createSession(config);

    res.json({
      success: true,
      data: {
        sessionId,
        config,
        wsUrl: `${req.protocol === 'https' ? 'wss' : 'ws'}://${req.get('host')}/api/voice/stream/${sessionId}`,
        estimatedCostPerMinute: calculateEstimatedCost(config)
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get session metrics
router.get('/voice/sessions/:sessionId/metrics', (req, res) => {
  const session = realtimeVoiceService.getSession(req.params.sessionId);
  
  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'Session not found'
    });
  }

  res.json({
    success: true,
    data: session.getMetrics()
  });
});

// Get all sessions metrics
router.get('/voice/sessions/metrics/all', (req, res) => {
  const metrics = realtimeVoiceService.getAllMetrics();
  
  res.json({
    success: true,
    data: {
      totalSessions: metrics.length,
      metrics,
      totalCost: metrics.reduce((sum, m) => sum + m.costEstimate, 0)
    }
  });
});

// Close session
router.delete('/voice/sessions/:sessionId', async (req, res) => {
  try {
    await realtimeVoiceService.closeSession(req.params.sessionId);
    
    res.json({
      success: true,
      message: 'Session closed successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get cost comparison report
router.get('/voice/cost-report', (req, res) => {
  const report = generateCostReport();
  
  res.json({
    success: true,
    data: {
      title: 'Voice TTS Cost Comparison (10-minute session)',
      providers: report,
      recommendation: 'Cartesia offers 97% cost savings vs ElevenLabs with comparable quality'
    }
  });
});

// Synthesize text to speech (non-streaming)
router.post('/voice/synthesize', async (req, res) => {
  try {
    const { text, provider = 'cartesia', voiceId, sessionId } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }

    let session = sessionId ? realtimeVoiceService.getSession(sessionId) : null;
    
    if (!session) {
      // Create temporary session
      const tempSessionId = crypto.randomUUID();
      session = realtimeVoiceService.createSession({
        sessionId: tempSessionId,
        sttProvider: 'auto',
        ttsProvider: provider,
        voiceId,
        costMode: 'economy'
      });
    }

    const audioChunk = await session.synthesizeResponse(text);

    res.json({
      success: true,
      data: {
        audioData: audioChunk.data.toString('base64'),
        format: audioChunk.format,
        sampleRate: audioChunk.sampleRate,
        duration: audioChunk.data.length / (audioChunk.sampleRate * 2), // Approximate
        cost: text.length * (provider === 'cartesia' ? 0.01 : 0.30) / 1000
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== Helper Functions ====================

function calculateEstimatedCost(config: VoiceStreamConfig): number {
  const costs = {
    stt: {
      deepgram: 0.0043,      // per minute
      assemblyai: 0.019,      // per minute  
      openai: 0.006           // per minute
    },
    tts: {
      cartesia: 0.01 / 1000 * 150,     // ~150 chars/min = $0.0015/min
      playht: 0.015 / 1000 * 150,       // $0.00225/min
      openai: 0.015 / 1000 * 150,       // $0.00225/min
      elevenlabs: 0.30 / 1000 * 150     // $0.045/min
    }
  };

  const sttCost = costs.stt[config.sttProvider as keyof typeof costs.stt] || 0;
  const ttsCost = costs.tts[config.ttsProvider as keyof typeof costs.tts] || 0;

  return sttCost + ttsCost; // Already per minute, don't multiply again
}

// ==================== WebSocket Handler ====================

export function setupVoiceWebSocket(wss: WebSocketServer): void {
  wss.on('connection', (ws: WebSocket, req: any) => {
    const sessionId = req.url.split('/').pop();
    
    if (!sessionId) {
      ws.close(1008, 'Session ID required');
      return;
    }

    const session = realtimeVoiceService.getSession(sessionId);
    
    if (!session) {
      ws.close(1008, 'Session not found');
      return;
    }

    // Connect WebSocket to session
    session.connectWebSocket(ws);

    // Forward transcription events to client
    session.on('transcription', (result) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'transcription',
          data: result
        }));
      }
    });

    // Forward audio events to client
    session.on('audio', (chunk) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'audio',
          data: {
            audioData: chunk.data.toString('base64'),
            format: chunk.format,
            timestamp: chunk.timestamp
          }
        }));
      }
    });

    // Handle errors
    session.on('error', (error) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'error',
          data: { message: error.message }
        }));
      }
    });

    // Handle interruption
    session.on('interrupted', () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'interrupted'
        }));
      }
    });

    console.log(`🎤 WebSocket connected for voice session: ${sessionId}`);
  });
}

export default router;
