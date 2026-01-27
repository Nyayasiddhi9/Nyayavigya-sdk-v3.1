import fs from 'fs-extra';
import { exec } from 'child_process';
import { promisify } from 'util';
import OpenAI from 'openai';

const execAsync = promisify(exec);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SCENES = [
  {n: 1, title: "Opening Hook", text: "The future of startup acceleration is here. Wizards Incubator collapses MVP timelines from months to days and converts capital into velocity.", bullets: ["AI-Native Accelerator", "14-Day MVP", "Enterprise-Grade"], img: "futuristic_ai_techno_9d77a238.jpg"},
  {n: 2, title: "Vision Mission", text: "Our vision: ideas to production-ready MVPs in days, not months. Our mission: autonomous AI orchestration that delivers enterprise-grade outputs fast.", bullets: ["Vision → Ideas to MVP in Days", "Mission → Autonomous AI Orchestration"], img: "abstract_gradient_mo_fd439083.jpg"},
  {n: 3, title: "The Problem", text: "Startups fail from slow time-to-market, high burn, technical complexity, and compliance drag. Traditional incubators take 3–6 months and $50K–$200K before validation.", bullets: ["3–6 Months", "$50K–$200K", "Compliance Overhead"], img: "startup_failure_chal_91d31134.jpg"},
  {n: 4, title: "Our Solution", text: "Four levers: 14-day delivery, 90 percent cost reduction, enterprise quality, and multi-agent AI orchestration that runs 24 by 7.", bullets: ["14-Day Delivery", "90% Cost Down", "Enterprise-Grade", "Autonomous AI"], img: "business_solution_in_f801a1ce.jpg"},
  {n: 5, title: "WAI-SDK v10", text: "WAI-SDK v10.0 coordinates 267 plus specialized agents across 23 plus LLM providers and 752 model variants with ROMA autonomy and enterprise security.", bullets: ["267+ Agents", "23+ Providers", "752+ Models", "ROMA L1–L4"], img: "software_architectur_f14e88ac.jpg"},
  {n: 6, title: "10 Specialized Studios", text: "Ten studios work in parallel: ideation, design, development, compliance, GTM, QA, DevOps, creative, operations, and marketing.", bullets: ["10 Studios", "Parallel Execution", "Production-Ready"], img: "parallel_processing__c4d81340.jpg"},
  {n: 7, title: "The 14-Day Journey", text: "Days 1 to 3: research and validation. Days 4 to 6: UX and brand. Days 7 to 10: full-stack build. Days 11 to 14: compliance, website, deck, and launch plan.", bullets: ["D1–3 Validation", "D4–6 Design", "D7–10 Build", "D11–14 Launch"], img: "timeline_roadmap_jou_1f533b77.jpg"},
  {n: 8, title: "Competitive Advantages", text: "Versus incubators, no-code, and outsourcing we deliver speed, cost, quality, and zero technical debt with real autonomy.", bullets: ["14 Days vs 3–6 Months", "$5K–$20K vs $50K–$500K", "Zero Tech Debt"], img: "competitive_advantag_677cdeb8.jpg"},
  {n: 9, title: "Market Opportunity", text: "Targeting a one point four trillion dollar TAM across startup creation and enterprise innovation. Failure is high. Speed and quality win.", bullets: ["$1.4T+ TAM", "$547B Startups", "$890B Enterprise"], img: "global_market_opport_88f07849.jpg"},
  {n: 10, title: "Business Model", text: "Tiered pricing from five thousand to enterprise, plus success fees and SDK licensing. LTV to CAC is twenty two point five to one.", bullets: ["Starter • Growth • Enterprise", "LTV:CAC 22.5:1"], img: "business_model_reven_b64276ef.jpg"},
  {n: 11, title: "Roadmap", text: "Q4 twenty twenty-five: beta. Q1 twenty twenty-six: global launch. Q2: scale and partnerships across EU and APAC.", bullets: ["Q4'25 Beta", "Q1'26 Launch", "Q2'26 Scale"], img: "product_roadmap_futu_8d180284.jpg"},
  {n: 12, title: "Financials", text: "Break-even by month ten. Year one two point five million revenue. Year three forty five million with forty nine percent EBITDA.", bullets: ["Break-even M10", "Y1 $2.5M", "Y3 $45M • 49% EBITDA"], img: "financial_charts_gro_df9950b9.jpg"},
  {n: 13, title: "Funding Ask", text: "We are raising two million seed to scale platform, GTM, and team. Allocation: platform, acquisition, talent, and runway.", bullets: ["$2M Seed", "40% Platform • 30% GTM • 20% Team • 10% Ops"], img: "investment_funding_v_36a6dfab.jpg"},
  {n: 14, title: "Leadership", text: "A veteran leadership team across AI, healthtech, gaming, and growth crafts durable advantage and delivery discipline.", bullets: ["Vamsi • Founder & MD", "Nitin • CEO", "Mahesh • CTO", "Jinal • Head of Marketing"], img: "leadership_team_prof_f63fdd62.jpg"},
  {n: 15, title: "CTA", text: "Join the revolution in startup acceleration. Where AI meets entrepreneurship, outcomes compound.", bullets: ["invest@wizardsincubator.ai", "wizardsincubator.ai", "Mumbai • Dubai"], img: "success_achievement__73bd7ed4.jpg"},
];

async function batch() {
  const mode = process.argv[2] || 'voice';
  await fs.ensureDir('investor_promo');
  
  if (mode === 'voice') {
    console.log('🎤 GENERATING VOICES...\n');
    for (const s of SCENES) {
      const out = `investor_promo/voice_${s.n}.mp3`;
      if (fs.existsSync(out)) {
        console.log(`Scene ${s.n}: ✓ exists`);
        continue;
      }
      console.log(`Scene ${s.n}: generating...`);
      const tts = await openai.audio.speech.create({ model: 'tts-1-hd', voice: 'nova', input: s.text });
      await fs.writeFile(out, Buffer.from(await tts.arrayBuffer()));
      console.log(`Scene ${s.n}: ✓\n`);
    }
    console.log('✅ All voices generated!\n');
  }
  
  if (mode === 'render') {
    console.log('🎨 RENDERING SCENES...\n');
    for (const s of SCENES) {
      const out = `investor_promo/scene_${s.n}.mp4`;
      if (fs.existsSync(out)) {
        console.log(`Scene ${s.n}: ✓ exists`);
        continue;
      }
      
      const voice = `investor_promo/voice_${s.n}.mp3`;
      const img = `attached_assets/stock_images/${s.img}`;
      
      const {stdout} = await execAsync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${voice}"`);
      const dur = parseFloat(stdout.trim());
      
      const title = s.title.replace(/[^a-zA-Z0-9 &]/g, ' ').trim();
      const b = s.bullets.map((x: string) => x.replace(/[^a-zA-Z0-9+→ :.$•%–@.]/g, ' ').trim());
      
      const filters = [
        'scale=1920:1080:force_original_aspect_ratio=increase',
        'crop=1920:1080',
        `drawtext=text='${title}':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=96:fontcolor=white:x=(w-text_w)/2:y=100:shadowcolor=black:shadowx=5:shadowy=5`,
      ];
      
      b.forEach((bullet: string, i: number) => {
        const y = 340 + (i * 130);
        if (y < 900) {
          filters.push(`drawtext=text='${bullet}':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:fontsize=64:fontcolor=white:x=(w-text_w)/2:y=${y}:shadowcolor=black:shadowx=4:shadowy=4`);
        }
      });
      
      filters.push('fade=in:0:30', `fade=out:${Math.floor(dur * 30 - 30)}:30`);
      
      console.log(`Scene ${s.n}: rendering ${dur.toFixed(1)}s...`);
      await execAsync(`ffmpeg -loop 1 -framerate 30 -t ${dur} -i "${img}" -i "${voice}" -vf "${filters.join(',')}" -c:v libx264 -preset slower -crf 16 -pix_fmt yuv420p -c:a aac -b:a 256k -shortest "${out}" -y 2>&1 | tail -1`);
      console.log(`Scene ${s.n}: ✓\n`);
    }
    console.log('✅ All scenes rendered!\n');
  }
  
  if (mode === 'assemble') {
    console.log('📦 ASSEMBLING FINAL VIDEO...\n');
    const concat = SCENES.map(s => `file 'scene_${s.n}.mp4'`).join('\n');
    await fs.writeFile('investor_promo/concat.txt', concat);
    await execAsync(`cd investor_promo && ffmpeg -f concat -safe 0 -i concat.txt -c copy ../video-assets/Wizards_Incubator_INVESTOR_PROMO.mp4 -y 2>&1 | tail -3`);
    console.log('✅ INVESTOR PROMO COMPLETE!\n');
    const stats = await fs.stat('video-assets/Wizards_Incubator_INVESTOR_PROMO.mp4');
    console.log(`📁 video-assets/Wizards_Incubator_INVESTOR_PROMO.mp4`);
    console.log(`📏 ${(stats.size / 1024 / 1024).toFixed(2)} MB\n`);
  }
}

batch().catch(console.error);
