
import React, { useEffect, useRef, useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Loader2, Play, Pause, RotateCcw, Maximize } from 'lucide-react';

interface UnityWebGLExperienceProps {
  assistantId: string;
  experienceType: 'vr' | 'ar' | 'er' | 'web3d';
  framework: string;
  onInteraction?: (data: any) => void;
}

declare global {
  interface Window {
    unityInstance?: any;
    Module?: any;
  }
}

export const UnityWebGLExperience: React.FC<UnityWebGLExperienceProps> = ({
  assistantId,
  experienceType,
  framework,
  onInteraction
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unityInstance, setUnityInstance] = useState<any>(null);

  useEffect(() => {
    initializeUnityWebGL();
  }, [assistantId, framework]);

  const initializeUnityWebGL = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load Unity WebGL build
      const buildUrl = `/unity-builds/${framework}`;
      
      // Unity loader configuration
      const config = {
        dataUrl: `${buildUrl}/Build.data`,
        frameworkUrl: `${buildUrl}/Build.framework.js`,
        codeUrl: `${buildUrl}/Build.wasm`,
        streamingAssetsUrl: "StreamingAssets",
        companyName: "WAI DevStudio",
        productName: "AI Assistant 3D Experience",
        productVersion: "1.0",
        showBanner: false,
        matchWebGLToCanvasSize: true,
        devicePixelRatio: 1,
      };

      // Load Unity
      if (window.createUnityInstance && canvasRef.current) {
        const instance = await window.createUnityInstance(canvasRef.current, config, (progress: number) => {
          // Loading progress
          console.log(`Unity loading: ${Math.round(progress * 100)}%`);
        });

        setUnityInstance(instance);
        window.unityInstance = instance;

        // Initialize assistant data
        instance.SendMessage('AssistantManager', 'InitializeAssistant', JSON.stringify({
          assistantId,
          experienceType,
          framework
        }));

        setIsLoading(false);
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Unity initialization error:', err);
      setError('Failed to initialize Unity WebGL experience');
      setIsLoading(false);
    }
  };

  const handlePlay = () => {
    if (unityInstance) {
      unityInstance.SendMessage('GameManager', 'Play');
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (unityInstance) {
      unityInstance.SendMessage('GameManager', 'Pause');
      setIsPlaying(false);
    }
  };

  const handleReset = () => {
    if (unityInstance) {
      unityInstance.SendMessage('GameManager', 'Reset');
    }
  };

  const handleFullscreen = () => {
    if (unityInstance) {
      unityInstance.SetFullscreen(1);
    }
  };

  const sendMessageToUnity = (gameObject: string, method: string, value: string) => {
    if (unityInstance) {
      unityInstance.SendMessage(gameObject, method, value);
    }
  };

  // Unity message handler
  useEffect(() => {
    const handleUnityMessage = (event: MessageEvent) => {
      if (event.data.type === 'unity-message') {
        onInteraction?.(event.data);
      }
    };

    window.addEventListener('message', handleUnityMessage);
    return () => window.removeEventListener('message', handleUnityMessage);
  }, [onInteraction]);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">3D Immersive Experience</h3>
          <Badge variant={isPlaying ? 'default' : 'secondary'}>
            {framework.toUpperCase()}
          </Badge>
          <Badge variant="outline">{experienceType.toUpperCase()}</Badge>
        </div>
        
        <div className="flex gap-2">
          {!isLoading && !error && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={isPlaying ? handlePause : handlePlay}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleFullscreen}>
                <Maximize className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center text-white">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Loading Unity WebGL Experience...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900">
            <div className="text-center text-white">
              <p className="mb-2">❌ {error}</p>
              <Button onClick={initializeUnityWebGL} variant="outline" size="sm">
                Retry
              </Button>
            </div>
          </div>
        )}

        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ display: isLoading || error ? 'none' : 'block' }}
        />
      </div>

      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium mb-2">Experience Features:</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>🎮 Interactive 3D Environment</div>
          <div>🤖 AI Avatar Integration</div>
          <div>🎭 Real-time Facial Animation</div>
          <div>🗣️ Voice Synthesis</div>
          <div>🏃 Motion Capture</div>
          <div>🌐 Cross-platform Support</div>
        </div>
      </div>
    </Card>
  );
};
