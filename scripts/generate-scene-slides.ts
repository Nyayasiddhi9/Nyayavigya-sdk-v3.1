import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import type { VideoScript } from '../server/services/video-script-generator.js';

const execAsync = promisify(exec);

export interface SceneSlide {
  imagePath: string;
  duration: number;
  outputPath: string;
}

export class SceneSlideGenerator {
  private outputDir = 'video-assets/scene-clips';

  constructor() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Generate video clips from static images with Ken Burns effect
   */
  async generateSceneClips(script: VideoScript): Promise<string[]> {
    const clips: string[] = [];

    // Define scene visuals (you'll need to provide these images)
    const sceneVisuals = [
      { scene: 1, image: 'video-assets/scene-1-ideation-lab.png', fallback: true },
      { scene: 2, image: 'video-assets/scene-2-engineering-forge.png', fallback: true },
      { scene: 3, image: 'video-assets/scene-3-market-intelligence.png', fallback: true },
      { scene: 4, image: 'video-assets/scene-4-product-blueprint.png', fallback: true },
      { scene: 5, image: 'video-assets/scene-5-experience-design.png', fallback: true },
    ];

    for (let i = 0; i < script.scenes.length; i++) {
      const scene = script.scenes[i];
      const visual = sceneVisuals[i];
      const outputPath = path.join(this.outputDir, `scene-${scene.sceneNumber}.webm`);

      console.log(`🎨 Generating clip ${scene.sceneNumber}: ${scene.studioName} (${scene.duration}s)`);

      // Check if image exists, if not create placeholder
      if (!fs.existsSync(visual.image)) {
        console.log(`⚠️  Image not found: ${visual.image}`);
        console.log(`📝 Creating text overlay placeholder...`);
        
        // Create a text overlay video with studio information
        await this.createTextOverlayVideo(
          scene.studioName,
          scene.narration.substring(0, 100) + '...',
          scene.duration,
          outputPath
        );
      } else {
        // Create video from image with Ken Burns effect
        await this.createKenBurnsVideo(visual.image, scene.duration, outputPath);
      }

      clips.push(outputPath);
      console.log(`✅ Generated: ${outputPath}`);
    }

    return clips;
  }

  /**
   * Create video from static image with Ken Burns pan/zoom effect
   */
  private async createKenBurnsVideo(
    imagePath: string,
    duration: number,
    outputPath: string
  ): Promise<void> {
    // Ken Burns effect: slow zoom and pan
    const ffmpegCmd = `ffmpeg -loop 1 -i "${imagePath}" \
      -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,zoompan=z='min(zoom+0.0015,1.5)':d=${duration * 25}:s=1920x1080:fps=25" \
      -t ${duration} -c:v libvpx-vp9 -b:v 2M -y "${outputPath}"`;

    try {
      await execAsync(ffmpegCmd);
    } catch (error) {
      console.error(`Error creating Ken Burns video: ${error}`);
      throw error;
    }
  }

  /**
   * Create simple colored title card video (fallback when no image available)
   */
  private async createTextOverlayVideo(
    title: string,
    subtitle: string,
    duration: number,
    outputPath: string
  ): Promise<void> {
    // Studio colors matching the platform theme
    const studioColors: Record<string, string> = {
      'Ideation Lab': '0x7c3aed',       // Purple
      'Engineering Forge': '0xf97316',   // Orange
      'Market Intelligence': '0x0ea5e9', // Blue
      'Product Blueprint': '0x06b6d4',   // Cyan
      'Experience Design': '0x8b5cf6',   // Violet
    };

    const color = studioColors[title] || '0x1a1b26';

    // Create simple solid color with gradient
    const ffmpegCmd = `ffmpeg -f lavfi -i color=c=${color}:s=1920x1080:d=${duration} \
      -vf "drawtext=text='${title}':fontcolor=white:fontsize=96:x=(w-text_w)/2:y=(h)/2" \
      -c:v libvpx-vp9 -b:v 2M -pix_fmt yuv420p -y "${outputPath}"`;

    try {
      await execAsync(ffmpegCmd);
    } catch (error) {
      console.error(`Error creating title card: ${error}`);
      throw error;
    }
  }
}

export async function generateAllSceneClips(script: VideoScript): Promise<string[]> {
  const generator = new SceneSlideGenerator();
  return await generator.generateSceneClips(script);
}
