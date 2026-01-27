import fs from 'fs-extra';
import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import OpenAI from 'openai';

const execAsync = promisify(exec);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const INPUT_JSON = './video-assets/investor-promo-script.json';
const OUTPUT_DIR = './investor_promo';
const RESOLUTION = '1920x1080';
const FRAME_RATE = 30;

// Map scenes to downloaded images
const IMAGE_MAP: Record<number, string> = {
  1: 'futuristic_ai_techno_9d77a238.jpg',
  2: 'abstract_gradient_mo_fd439083.jpg',
  3: 'startup_failure_chal_91d31134.jpg',
  4: 'business_solution_in_f801a1ce.jpg',
  5: 'software_architectur_f14e88ac.jpg',
  6: 'parallel_processing__c4d81340.jpg',
  7: 'timeline_roadmap_jou_1f533b77.jpg',
  8: 'competitive_advantag_677cdeb8.jpg',
  9: 'global_market_opport_88f07849.jpg',
  10: 'business_model_reven_b64276ef.jpg',
  11: 'product_roadmap_futu_8d180284.jpg',
  12: 'financial_charts_gro_df9950b9.jpg',
  13: 'investment_funding_v_36a6dfab.jpg',
  14: 'leadership_team_prof_f63fdd62.jpg',
  15: 'success_achievement__73bd7ed4.jpg',
};

async function generateInvestorPromo() {
  console.log(chalk.cyan.bold('\n🎬 WIZARDS INCUBATOR INVESTOR PROMO'));
  console.log(chalk.cyan('='.repeat(70)));
  console.log(chalk.white('🎤 Voice: OpenAI TTS HD Female (Nova)'));
  console.log(chalk.white('📐 Resolution: 1920x1080 Full HD'));
  console.log(chalk.white('🎨 Typography: ULTRA LARGE (96px/64px)'));
  console.log(chalk.white('🖼️  Images: Professional HD Stock Library'));
  console.log(chalk.cyan('='.repeat(70) + '\n'));

  const data = JSON.parse(await fs.readFile(INPUT_JSON, 'utf8'));
  await fs.ensureDir(OUTPUT_DIR);

  const sceneVideos: string[] = [];

  for (const scene of data.scenes) {
    console.log(chalk.yellow(`\n🎬 Scene ${scene.sceneNumber}: ${scene.title}`));

    // Generate female voiceover
    const voiceFile = `${OUTPUT_DIR}/voice_${scene.sceneNumber}.mp3`;
    console.log(chalk.blue('  🎤 Generating female voiceover...'));
    
    const tts = await openai.audio.speech.create({
      model: 'tts-1-hd',
      voice: 'nova', // Best female voice
      input: scene.narration,
      speed: 1.0,
    });
    const buffer = Buffer.from(await tts.arrayBuffer());
    await fs.writeFile(voiceFile, buffer);
    console.log(chalk.green('  ✅ Female voiceover generated'));

    // Get voice duration
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${voiceFile}"`
    );
    const duration = parseFloat(stdout.trim());

    // Get best image for this scene
    const imageFile = IMAGE_MAP[scene.sceneNumber];
    const imagePath = `./attached_assets/stock_images/${imageFile}`;
    
    if (!fs.existsSync(imagePath)) {
      console.log(chalk.red(`  ❌ Image not found: ${imagePath}`));
      continue;
    }

    // Clean text for FFmpeg
    const title = scene.title.replace(/[^a-zA-Z0-9 &]/g, ' ').trim();
    const bullets = scene.onScreenText.map((b: string) => 
      b.replace(/[^a-zA-Z0-9+→ :.$•%–]/g, ' ').trim()
    );

    // Build ULTRA professional filter chain
    const filters: string[] = [];
    
    // Scale to Full HD
    filters.push('scale=1920:1080:force_original_aspect_ratio=increase');
    filters.push('crop=1920:1080');
    
    // ULTRA LARGE Title (96px) with strong shadow
    filters.push(
      `drawtext=text='${title}':` +
      `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:` +
      `fontsize=96:fontcolor=white:` +
      `x=(w-text_w)/2:y=100:` +
      `shadowcolor=black:shadowx=5:shadowy=5`
    );

    // LARGE Bullets (64px) with strong shadows - properly spaced
    bullets.forEach((bullet: string, i: number) => {
      const yPos = 340 + (i * 130); // More spacing between bullets
      if (yPos < 900) { // Don't go off screen
        filters.push(
          `drawtext=text='${bullet}':` +
          `fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:` +
          `fontsize=64:fontcolor=white:` +
          `x=(w-text_w)/2:y=${yPos}:` +
          `shadowcolor=black:shadowx=4:shadowy=4`
        );
      }
    });

    // Fade effects for professional transitions
    filters.push('fade=in:0:30');
    filters.push(`fade=out:${Math.floor(duration * 30 - 30)}:30`);

    const filterChain = filters.join(',');
    const outputVideo = `${OUTPUT_DIR}/scene_${scene.sceneNumber}.mp4`;

    // Render scene with BEST quality
    console.log(chalk.blue('  🎨 Rendering HD scene...'));
    await execAsync(
      `ffmpeg -loop 1 -framerate ${FRAME_RATE} -t ${duration} -i "${imagePath}" -i "${voiceFile}" ` +
      `-vf "${filterChain}" ` +
      `-c:v libx264 -preset slower -profile:v high -crf 16 -pix_fmt yuv420p ` +
      `-c:a aac -b:a 256k -shortest ` +
      `"${outputVideo}" -y 2>&1 | tail -1`
    );

    sceneVideos.push(outputVideo);
    console.log(chalk.green(`  ✅ Scene complete (${duration.toFixed(1)}s)\n`));
  }

  // Assemble final investor promo
  console.log(chalk.cyan('\n📦 Assembling final investor promo video...\n'));
  
  const concatList = `${OUTPUT_DIR}/concat.txt`;
  const concatContent = sceneVideos.map(v => `file '${v.split('/').pop()}'`).join('\n');
  await fs.writeFile(concatList, concatContent);

  const finalVideo = './video-assets/Wizards_Incubator_INVESTOR_PROMO.mp4';
  
  await execAsync(
    `cd ${OUTPUT_DIR} && ffmpeg -f concat -safe 0 -i concat.txt ` +
    `-c copy ../video-assets/Wizards_Incubator_INVESTOR_PROMO.mp4 -y 2>&1 | tail -3`
  );

  const stats = await fs.stat(finalVideo);
  const { stdout: finalDur } = await execAsync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${finalVideo}"`
  );

  console.log(chalk.green.bold('\n🎉 INVESTOR PROMO VIDEO COMPLETE!'));
  console.log(chalk.cyan('='.repeat(70)));
  console.log(chalk.white(`📁 File: ${finalVideo}`));
  console.log(chalk.white(`📏 Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`));
  console.log(chalk.white(`⏱️  Duration: ${Math.floor(parseFloat(finalDur) / 60)}m ${Math.floor(parseFloat(finalDur) % 60)}s`));
  console.log(chalk.white(`🎤 Voice: OpenAI HD Female (Nova)`));
  console.log(chalk.white(`🎨 Typography: 96px titles, 64px bullets`));
  console.log(chalk.white(`🎬 Quality: 1920x1080 HD, CRF 16`));
  console.log(chalk.white(`🖼️  Images: 15 Professional HD Images`));
  console.log(chalk.cyan('='.repeat(70)));
  console.log(chalk.green.bold('\n✅ Ready for investor presentations!'));
}

generateInvestorPromo().catch(err => {
  console.error(chalk.red('\n❌ Error:'), err.message);
  process.exit(1);
});
