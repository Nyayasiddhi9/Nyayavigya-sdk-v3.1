import { glob } from 'glob';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

interface DuplicateGroup {
  hash: string;
  files: string[];
  fileSize: number;
  category: string;
}

interface DuplicateReport {
  timestamp: string;
  totalFilesScanned: number;
  duplicateGroups: DuplicateGroup[];
  duplicateCount: number;
  potentialSavingsKB: number;
  recommendations: string[];
}

const CRITICAL_PATTERNS = [
  'bmad', 'grpo', 'cam', 'capability-matrix', 'agent-registry',
  'orchestration', 'parlant', 'roma', 'quantum'
];

const CANONICAL_LOCATIONS: Record<string, string> = {
  'bmad': 'wai-sdk/packages/protocols/src/bmad-cam-framework.ts',
  'grpo': 'wai-sdk/packages/core/src/grpo-reinforcement-trainer.ts',
  'cam': 'wai-sdk/packages/memory/src/cam/cam-monitoring-service.ts',
  'capability-matrix': 'wai-sdk/capabilities/capability-matrix.ts',
  'agent-registry': 'wai-sdk/packages/agents/agents-registry-v2.json',
  'parlant': 'wai-sdk/packages/protocols/src/parlant-standards.ts',
  'roma': 'wai-sdk/packages/protocols/src/roma-framework.ts'
};

const ALLOWED_SCAN_PATHS = ['.', 'wai-sdk', 'server', 'shared', 'client'];

export function isAllowedPath(requestedPath: string): boolean {
  const normalized = path.normalize(requestedPath).replace(/^\.\//, '');
  return ALLOWED_SCAN_PATHS.some(allowed => 
    normalized === allowed || normalized.startsWith(allowed + '/')
  );
}

export async function scanForDuplicates(basePath: string = 'wai-sdk'): Promise<DuplicateReport> {
  if (!isAllowedPath(basePath)) {
    throw new Error('Access denied: path not in allowed list');
  }
  
  const fileHashes = new Map<string, string[]>();
  const fileSizes = new Map<string, number>();
  
  const patterns = ['**/*.ts', '**/*.tsx', '**/*.json'];
  const ignorePatterns = [
    '**/node_modules/**',
    '**/builds-archive/**',
    '**/dist/**',
    '**/.git/**',
    '**/attached_assets/**',
    '**/builds/**',
    '**/logs/**',
    '**/coverage/**',
    '**/tmp/**',
    '**/.cache/**',
    '**/package-lock.json',
    '**/pnpm-lock.yaml'
  ];

  let totalFiles = 0;
  
  for (const pattern of patterns) {
    const files = await glob(pattern, {
      cwd: basePath,
      ignore: ignorePatterns,
      nodir: true
    });

    for (const file of files) {
      const fullPath = path.join(basePath, file);
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const normalizedContent = content
          .replace(/\/\/.*$/gm, '')
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/\s+/g, ' ')
          .trim();
        
        const hash = crypto.createHash('md5').update(normalizedContent).digest('hex');
        
        if (!fileHashes.has(hash)) {
          fileHashes.set(hash, []);
        }
        fileHashes.get(hash)!.push(file);
        fileSizes.set(file, content.length);
        totalFiles++;
      } catch (e) {
      }
    }
  }

  const duplicateGroups: DuplicateGroup[] = [];
  let potentialSavings = 0;

  for (const [hash, files] of fileHashes.entries()) {
    if (files.length > 1) {
      const category = CRITICAL_PATTERNS.find(p => 
        files.some(f => f.toLowerCase().includes(p))
      ) || 'other';
      
      const fileSize = fileSizes.get(files[0]) || 0;
      potentialSavings += fileSize * (files.length - 1);
      
      duplicateGroups.push({
        hash,
        files,
        fileSize,
        category
      });
    }
  }

  const recommendations: string[] = [];
  
  for (const group of duplicateGroups) {
    if (group.category !== 'other') {
      const canonical = CANONICAL_LOCATIONS[group.category];
      if (canonical) {
        recommendations.push(
          `[${group.category.toUpperCase()}] Keep ${canonical}, archive: ${group.files.filter(f => f !== canonical).join(', ')}`
        );
      }
    }
  }

  return {
    timestamp: new Date().toISOString(),
    totalFilesScanned: totalFiles,
    duplicateGroups,
    duplicateCount: duplicateGroups.reduce((sum, g) => sum + g.files.length - 1, 0),
    potentialSavingsKB: Math.round(potentialSavings / 1024),
    recommendations
  };
}

export async function enforceNoDuplicates(): Promise<{ passed: boolean; violations: string[] }> {
  const report = await scanForDuplicates();
  
  const criticalDuplicates = report.duplicateGroups.filter(g => 
    g.category !== 'other' && g.files.length > 1
  );

  if (criticalDuplicates.length === 0) {
    return { passed: true, violations: [] };
  }

  const violations = criticalDuplicates.map(g =>
    `${g.category}: ${g.files.length} duplicate files found`
  );

  return { passed: false, violations };
}

export function getCanonicalLocation(pattern: string): string | undefined {
  return CANONICAL_LOCATIONS[pattern.toLowerCase()];
}

export const duplicateDetectionGuardrail = {
  scanForDuplicates,
  enforceNoDuplicates,
  getCanonicalLocation,
  isAllowedPath,
  CANONICAL_LOCATIONS,
  CRITICAL_PATTERNS,
  ALLOWED_SCAN_PATHS
};

export default duplicateDetectionGuardrail;
