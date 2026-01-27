import fs from 'fs-extra';
import { exec } from 'child_process';
import { promisify } from 'util';
import OpenAI from 'openai';

const execAsync = promisify(exec);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const OUT = './video-final';
const MUSIC = './video-assets/cinematic-epic-music.mp3';
const LOGO = './video-assets/wizards-logo.jpg';

const SCENES = [
  { n: 1, t: "WIZARDS INCUBATOR PLATFORM", txt: "Every year, millions of founders dream big, but 82 percent never reach market. Why? Because speed kills runway, and cost kills ambition.", src: 'video-assets/platform-landing.png', type: 'img' },
  { n: 2, t: "AI-Native Accelerator", txt: "At Wizards Tech Global, we believe AI should build startups as fast as founders dream them. Introducing Wizards Incubator — the world's first AI-native startup accelerator that turns ideas into MVPs in 14 days.", src: 'video-assets/attached_videos/scene_1.mp4', type: 'vid' },
  { n: 3, t: "The Problem", txt: "Traditional incubators take months and hundreds of thousands to deliver a prototype. By then, the market has moved on.", src: 'video-assets/attached_videos/scene_2.mp4', type: 'vid' },
  { n: 4, t: "WAI SDK Architecture", txt: "Wizards Incubator runs on WAI SDK version ten — 267 agents across 23 LLM providers. Ten specialized studios operate autonomously, delivering enterprise-grade products in days.", src: 'video-assets/attached_videos/scene_3.mp4', type: 'vid' },
  { n: 5, t: "14-Day Workflow", txt: "Days 1 to 3, the Ideation Lab validates markets. Days 4 to 6, Design Studio crafts experience. Days 7 to 10, Engineering Forge codes the product. Days 11 to 14, Launch Command takes it to market.", src: 'video-assets/attached_videos/scene_4.mp4', type: 'vid' },
  { n: 6, t: "Proven Results", txt: "Results speak for themselves — 90 percent cost reduction, 75 percent success rate, and a 22 to 1 LTV to CAC ratio.", src: 'video-assets/attached_videos/scene_5.mp4', type: 'vid' },
  { n: 7, t: "Market Opportunity", txt: "A 1.4 trillion dollar opportunity across startups and enterprises. We're owning the bridge between imagination and execution.", src: 'attached_assets/stock_images/premium_global_busin_33e1c252.jpg', type: 'img' },
  { n: 8, t: "Financial Trajectory", txt: "Break-even by month ten, 45 million in revenue by year three, with 49 percent EBITDA margin. Velocity and viability, together.", src: 'video-assets/attached_videos/scene_6.mp4', type: 'vid' },
  { n: 9, t: "Investment Opportunity", txt: "We're raising two million dollars to accelerate launch and scale globally.", src: 'video-assets/attached_videos/scene_7.mp4', type: 'vid' },
  { n: 10, t: "Join the Revolution", txt: "Led by visionaries who built platforms used by millions, Wizards Tech Global is reshaping how companies come to life. Join the revolution where AI builds startups and founders build the future.", src: 'video-assets/attached_videos/scene_8.mp4', type: 'vid' }
];

async function main() {
  console.log('\n🎬 WIZARDS INCUBATOR INVESTOR VIDEO - FAST PRODUCTION\n');
  await fs.ensureDir(OUT);
  
  for (const s of SCENES) {
    console.log(`Scene ${s.n}: ${s.t}...`);
    
    // Voice
    const voice = `${OUT}/v${s.n}.mp3`;
    const tts = await openai.audio.speech.create({
      model: 'tts-1-hd',
      voice: 'nova',
      input: s.txt,
      speed: 1.05
    });
    await fs.writeFile(voice, Buffer.from(await tts.arrayBuffer()));
    
    const {stdout} = await execAsync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${voice}"`);
    const dur = parseFloat(stdout.trim());
    
    // Base video
    const base = `${OUT}/b${s.n}.mp4`;
    if (s.type === 'vid') {
      await execAsync(`ffmpeg -stream_loop -1 -i "${s.src}" -t ${dur} -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080" -c:v libx264 -preset ultrafast -crf 20 -an "${base}" -y 2>&1 | tail -1`);
    } else {
      await execAsync(`ffmpeg -loop 1 -framerate 30 -t ${dur} -i "${s.src}" -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080" -c:v libx264 -preset ultrafast -crf 20 "${base}" -y 2>&1 | tail -1`);
    }
    
    // Add logo + text + voice
    const scene = `${OUT}/s${s.n}.mp4`;
    const title = s.t.replace(/'/g, "'\\''");
    const fs_size = title.length > 30 ? 90 : 110;
    
    await execAsync(
      `ffmpeg -i "${base}" -loop 1 -i "${LOGO}" -i "${voice}" ` +
      `-filter_complex "` +
      `[1:v]scale=160:-1[logo];` +
      `[0:v][logo]overlay=30:30[v1];` +
      `[v1]drawtext=text='${title}':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:` +
      `fontsize=${fs_size}:fontcolor=white:x=(w-text_w)/2:y=75:shadowcolor=0x3B82F6@0.7:shadowx=0:shadowy=0[v2];` +
      `[v2]drawtext=text='${title}':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:` +
      `fontsize=${fs_size}:fontcolor=white:x=(w-text_w)/2:y=75:shadowcolor=black@0.8:shadowx=3:shadowy=3[vout]" ` +
      `-map "[vout]" -map 2:a -c:v libx264 -preset medium -crf 18 -c:a aac -b:a 192k -shortest "${scene}" -y 2>&1 | tail -1`
    );
    
    console.log(`  ✓ Done\n`);
  }
  
  console.log('Assembling with music...\n');
  
  const list = SCENES.map(s => `file 's${s.n}.mp4'`).join('\n');
  await fs.writeFile(`${OUT}/list.txt`, list);
  
  const final = './video-assets/WIZARDS_INCUBATOR_INVESTOR.mp4';
  await execAsync(
    `cd ${OUT} && ffmpeg -f concat -safe 0 -i list.txt -i "${MUSIC}" ` +
    `-filter_complex "[1:a]volume=0.20,afade=in:st=0:d=2,afade=out:st=145:d=2[m];[0:a][m]amix=inputs=2:duration=first[a]" ` +
    `-map 0:v -map "[a]" -c:v copy -c:a aac -b:a 256k -movflags +faststart "${final}" -y 2>&1 | tail -3`
  );
  
  const st = fs.statSync(final);
  const {stdout: d} = await execAsync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${final}"`);
  
  console.log('\n✅ VIDEO COMPLETE!');
  console.log(`📁 ${final}`);
  console.log(`📏 ${(st.size/1024/1024).toFixed(2)} MB`);
  console.log(`⏱️  ${Math.floor(parseFloat(d)/60)}m ${Math.floor(parseFloat(d)%60)}s`);
  console.log(`🎬 1920x1080 • 10 Scenes • Logo • Brand Colors • Music\n`);
}

main().catch(console.error);
