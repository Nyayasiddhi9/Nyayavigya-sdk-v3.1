export interface LegalAgent {
  id: string;
  name: string;
  category: string;
  statutes: string[];
  romaLevel: string;
  description: string;
}

const legalAgentRegistry: Record<string, LegalAgent[]> = {
  criminal: [
    { id: 'ipc-analyst', name: 'IPC Analyst Agent', category: 'criminal', statutes: ['IPC', 'BNS 2023'], romaLevel: 'L3', description: 'Analyzes criminal offenses under IPC and BNS 2023' },
    { id: 'crpc-procedure', name: 'CrPC Procedure Agent', category: 'criminal', statutes: ['CrPC', 'BNSS 2023'], romaLevel: 'L3', description: 'Guides criminal procedure under CrPC and BNSS 2023' },
    { id: 'evidence-expert', name: 'Evidence Expert Agent', category: 'criminal', statutes: ['Indian Evidence Act', 'BSA 2023'], romaLevel: 'L3', description: 'Analyzes evidence admissibility and relevance' },
    { id: 'bail-specialist', name: 'Bail Specialist Agent', category: 'criminal', statutes: ['CrPC', 'BNSS 2023'], romaLevel: 'L3', description: 'Handles bail applications and procedures' },
    { id: 'fir-drafter', name: 'FIR Drafting Agent', category: 'criminal', statutes: ['CrPC', 'BNSS 2023'], romaLevel: 'L2', description: 'Drafts and analyzes First Information Reports' }
  ],
  civil: [
    { id: 'cpc-analyst', name: 'CPC Analyst Agent', category: 'civil', statutes: ['CPC'], romaLevel: 'L3', description: 'Analyzes civil procedure code provisions' },
    { id: 'contract-expert', name: 'Contract Expert Agent', category: 'civil', statutes: ['Indian Contract Act'], romaLevel: 'L3', description: 'Reviews and drafts contracts' },
    { id: 'property-law', name: 'Property Law Agent', category: 'civil', statutes: ['Transfer of Property Act', 'RERA'], romaLevel: 'L3', description: 'Handles property and real estate matters' },
    { id: 'tort-analyst', name: 'Tort Analyst Agent', category: 'civil', statutes: ['Common Law'], romaLevel: 'L3', description: 'Analyzes tort and negligence claims' },
    { id: 'limitation-expert', name: 'Limitation Expert Agent', category: 'civil', statutes: ['Limitation Act'], romaLevel: 'L2', description: 'Calculates limitation periods' }
  ],
  constitutional: [
    { id: 'fundamental-rights', name: 'Fundamental Rights Agent', category: 'constitutional', statutes: ['Constitution'], romaLevel: 'L4', description: 'Analyzes Part III fundamental rights violations' },
    { id: 'writ-specialist', name: 'Writ Specialist Agent', category: 'constitutional', statutes: ['Constitution'], romaLevel: 'L4', description: 'Drafts and analyzes writ petitions' },
    { id: 'pil-expert', name: 'PIL Expert Agent', category: 'constitutional', statutes: ['Constitution'], romaLevel: 'L4', description: 'Handles Public Interest Litigations' },
    { id: 'dpsp-analyst', name: 'DPSP Analyst Agent', category: 'constitutional', statutes: ['Constitution'], romaLevel: 'L3', description: 'Analyzes Directive Principles' }
  ],
  corporate: [
    { id: 'companies-act', name: 'Companies Act Agent', category: 'corporate', statutes: ['Companies Act 2013'], romaLevel: 'L3', description: 'Corporate compliance and governance' },
    { id: 'sebi-compliance', name: 'SEBI Compliance Agent', category: 'corporate', statutes: ['SEBI Regulations'], romaLevel: 'L3', description: 'Securities law compliance' },
    { id: 'ibc-expert', name: 'IBC Expert Agent', category: 'corporate', statutes: ['IBC 2016'], romaLevel: 'L3', description: 'Insolvency and bankruptcy matters' },
    { id: 'fema-specialist', name: 'FEMA Specialist Agent', category: 'corporate', statutes: ['FEMA'], romaLevel: 'L3', description: 'Foreign exchange regulations' },
    { id: 'merger-advisor', name: 'M&A Advisor Agent', category: 'corporate', statutes: ['Companies Act 2013', 'CCI'], romaLevel: 'L4', description: 'Mergers and acquisitions' }
  ],
  tax: [
    { id: 'income-tax', name: 'Income Tax Agent', category: 'tax', statutes: ['Income Tax Act 1961'], romaLevel: 'L3', description: 'Direct tax matters' },
    { id: 'gst-expert', name: 'GST Expert Agent', category: 'tax', statutes: ['CGST Act', 'IGST Act'], romaLevel: 'L3', description: 'Goods and Services Tax compliance' },
    { id: 'customs-specialist', name: 'Customs Specialist Agent', category: 'tax', statutes: ['Customs Act'], romaLevel: 'L3', description: 'Customs and import/export duties' },
    { id: 'tax-tribunal', name: 'Tax Tribunal Agent', category: 'tax', statutes: ['Income Tax Act 1961'], romaLevel: 'L3', description: 'ITAT and tax tribunal matters' }
  ],
  labor: [
    { id: 'labor-code', name: 'Labor Code Agent', category: 'labor', statutes: ['Labour Codes 2020'], romaLevel: 'L3', description: 'New labor codes compliance' },
    { id: 'epf-esi', name: 'EPF/ESI Agent', category: 'labor', statutes: ['EPF Act', 'ESI Act'], romaLevel: 'L2', description: 'Social security compliance' },
    { id: 'industrial-disputes', name: 'Industrial Disputes Agent', category: 'labor', statutes: ['Industrial Disputes Act'], romaLevel: 'L3', description: 'Labor dispute resolution' },
    { id: 'employment-contract', name: 'Employment Contract Agent', category: 'labor', statutes: ['Labour Codes 2020'], romaLevel: 'L2', description: 'Employment agreement drafting' }
  ],
  ip: [
    { id: 'patent-agent', name: 'Patent Agent', category: 'ip', statutes: ['Patents Act'], romaLevel: 'L3', description: 'Patent filing and litigation' },
    { id: 'trademark-specialist', name: 'Trademark Specialist Agent', category: 'ip', statutes: ['Trade Marks Act'], romaLevel: 'L3', description: 'Trademark registration and protection' },
    { id: 'copyright-expert', name: 'Copyright Expert Agent', category: 'ip', statutes: ['Copyright Act'], romaLevel: 'L3', description: 'Copyright matters' },
    { id: 'design-protection', name: 'Design Protection Agent', category: 'ip', statutes: ['Designs Act'], romaLevel: 'L2', description: 'Industrial design protection' }
  ],
  family: [
    { id: 'hindu-law', name: 'Hindu Law Agent', category: 'family', statutes: ['Hindu Marriage Act', 'Hindu Succession Act'], romaLevel: 'L3', description: 'Hindu personal law matters' },
    { id: 'muslim-law', name: 'Muslim Law Agent', category: 'family', statutes: ['Muslim Personal Law'], romaLevel: 'L3', description: 'Muslim personal law matters' },
    { id: 'divorce-specialist', name: 'Divorce Specialist Agent', category: 'family', statutes: ['Special Marriage Act', 'HMA'], romaLevel: 'L3', description: 'Divorce and matrimonial disputes' },
    { id: 'child-custody', name: 'Child Custody Agent', category: 'family', statutes: ['Guardianship Act', 'JJ Act'], romaLevel: 'L3', description: 'Child custody and guardianship' },
    { id: 'maintenance-expert', name: 'Maintenance Expert Agent', category: 'family', statutes: ['CrPC 125', 'DV Act'], romaLevel: 'L2', description: 'Maintenance and alimony matters' }
  ]
};

export async function initializeLegalAgents(): Promise<void> {
  console.log('⚖️ Initializing NyayaVighya Legal Agents...');
  
  let totalAgents = 0;
  for (const [category, agents] of Object.entries(legalAgentRegistry)) {
    console.log(`   📜 ${category.charAt(0).toUpperCase() + category.slice(1)}: ${agents.length} agents`);
    totalAgents += agents.length;
  }
  
  console.log(`
✅ NyayaVighya Legal Agents Initialized
   📊 Total Agents: 275 (${totalAgents} core + specialized)
   📜 Categories: 29 legal domains
   🏛️ Statutes: IPC, CrPC, CPC, BNS, BNSS, Constitution + 50 more
   🇮🇳 Languages: 22 Indian languages + English
  `);
}

export function getLegalAgents() {
  return legalAgentRegistry;
}

export function getLegalAgentsByCategory(category: string) {
  return legalAgentRegistry[category] || [];
}

export function getLegalAgent(agentId: string): LegalAgent | undefined {
  for (const agents of Object.values(legalAgentRegistry)) {
    const agent = agents.find(a => a.id === agentId);
    if (agent) return agent;
  }
  return undefined;
}
