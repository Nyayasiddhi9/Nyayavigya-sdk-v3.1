/**
 * Local Git Service for SHAKTI AI IDE
 * Provides local git operations: status, diff, commit, log, branch management
 * 
 * SECURITY: Uses spawn with argument arrays to prevent command injection
 */

import { spawn } from 'child_process';
import path from 'path';

export interface GitStatus {
  branch: string;
  isClean: boolean;
  staged: GitFileChange[];
  unstaged: GitFileChange[];
  untracked: string[];
  ahead: number;
  behind: number;
}

export interface GitFileChange {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'renamed' | 'copied';
  oldPath?: string;
}

export interface GitDiff {
  path: string;
  hunks: GitDiffHunk[];
  additions: number;
  deletions: number;
}

export interface GitDiffHunk {
  header: string;
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: GitDiffLine[];
}

export interface GitDiffLine {
  type: 'context' | 'addition' | 'deletion';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface GitCommit {
  hash: string;
  shortHash: string;
  author: string;
  email: string;
  date: string;
  message: string;
  body?: string;
}

export interface GitBranch {
  name: string;
  isCurrent: boolean;
  isRemote: boolean;
  lastCommit?: string;
}

class LocalGitService {
  private workingDir: string;

  constructor() {
    this.workingDir = process.cwd();
  }

  private sanitizePath(filePath: string): string {
    const normalized = path.normalize(filePath);
    const resolved = path.resolve(this.workingDir, normalized);
    if (!resolved.startsWith(this.workingDir)) {
      throw new Error('Path traversal attempt detected');
    }
    const relativePath = path.relative(this.workingDir, resolved);
    if (relativePath.startsWith('..')) {
      throw new Error('Path must be within repository');
    }
    return relativePath;
  }

  private async runGit(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const gitProcess = spawn('git', args, {
        cwd: this.workingDir,
        env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
      });

      let stdout = '';
      let stderr = '';

      gitProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      gitProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      gitProcess.on('close', (code) => {
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          reject(new Error(stderr.trim() || `Git command failed with code ${code}`));
        }
      });

      gitProcess.on('error', (err) => {
        reject(err);
      });
    });
  }

  async isGitRepository(): Promise<boolean> {
    try {
      await this.runGit(['rev-parse', '--git-dir']);
      return true;
    } catch {
      return false;
    }
  }

  async getStatus(): Promise<GitStatus> {
    const branch = await this.getCurrentBranch();
    const statusOutput = await this.runGit(['status', '--porcelain', '-b']);
    
    const lines = statusOutput.split('\n');
    const staged: GitFileChange[] = [];
    const unstaged: GitFileChange[] = [];
    const untracked: string[] = [];

    let ahead = 0;
    let behind = 0;

    for (const line of lines) {
      if (!line) continue;

      if (line.startsWith('##')) {
        const match = line.match(/\[ahead (\d+)(?:, behind (\d+))?\]|\[behind (\d+)\]/);
        if (match) {
          ahead = parseInt(match[1] || '0', 10);
          behind = parseInt(match[2] || match[3] || '0', 10);
        }
        continue;
      }

      const stagedCode = line[0];
      const unstagedCode = line[1];
      const filePath = line.slice(3).trim();

      if (stagedCode === '?' && unstagedCode === '?') {
        untracked.push(filePath);
      } else {
        if (stagedCode !== ' ' && stagedCode !== '?') {
          staged.push({
            path: filePath,
            status: this.parseStatusCode(stagedCode),
          });
        }
        if (unstagedCode !== ' ' && unstagedCode !== '?') {
          unstaged.push({
            path: filePath,
            status: this.parseStatusCode(unstagedCode),
          });
        }
      }
    }

    return {
      branch,
      isClean: staged.length === 0 && unstaged.length === 0 && untracked.length === 0,
      staged,
      unstaged,
      untracked,
      ahead,
      behind,
    };
  }

  private parseStatusCode(code: string): GitFileChange['status'] {
    switch (code) {
      case 'M': return 'modified';
      case 'A': return 'added';
      case 'D': return 'deleted';
      case 'R': return 'renamed';
      case 'C': return 'copied';
      default: return 'modified';
    }
  }

  async getCurrentBranch(): Promise<string> {
    try {
      return await this.runGit(['rev-parse', '--abbrev-ref', 'HEAD']);
    } catch {
      return 'HEAD';
    }
  }

  async getBranches(): Promise<GitBranch[]> {
    const output = await this.runGit(['branch', '-a', '--format=%(refname:short)|%(HEAD)|%(objectname:short)']);
    const branches: GitBranch[] = [];

    for (const line of output.split('\n')) {
      if (!line) continue;
      const [name, head, commit] = line.split('|');
      branches.push({
        name,
        isCurrent: head === '*',
        isRemote: name.startsWith('origin/') || name.startsWith('remotes/'),
        lastCommit: commit,
      });
    }

    return branches;
  }

  async getDiff(filePath?: string, staged: boolean = false): Promise<GitDiff[]> {
    const args = ['diff'];
    if (staged) args.push('--staged');
    if (filePath) {
      const safePath = this.sanitizePath(filePath);
      args.push('--', safePath);
    }
    const output = await this.runGit(args);

    return this.parseDiff(output);
  }

  private parseDiff(diffOutput: string): GitDiff[] {
    if (!diffOutput) return [];

    const diffs: GitDiff[] = [];
    const fileBlocks = diffOutput.split(/^diff --git/m).filter(Boolean);

    for (const block of fileBlocks) {
      const lines = block.split('\n');
      const headerMatch = lines[0]?.match(/a\/(.+) b\/(.+)/);
      if (!headerMatch) continue;

      const filePath = headerMatch[2];
      const hunks: GitDiffHunk[] = [];
      let additions = 0;
      let deletions = 0;

      let currentHunk: GitDiffHunk | null = null;
      let oldLineNum = 0;
      let newLineNum = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];

        const hunkMatch = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)$/);
        if (hunkMatch) {
          if (currentHunk) hunks.push(currentHunk);
          
          oldLineNum = parseInt(hunkMatch[1], 10);
          newLineNum = parseInt(hunkMatch[3], 10);
          
          currentHunk = {
            header: line,
            oldStart: oldLineNum,
            oldLines: parseInt(hunkMatch[2] || '1', 10),
            newStart: newLineNum,
            newLines: parseInt(hunkMatch[4] || '1', 10),
            lines: [],
          };
          continue;
        }

        if (currentHunk && (line.startsWith('+') || line.startsWith('-') || line.startsWith(' '))) {
          const content = line.slice(1);
          
          if (line.startsWith('+')) {
            additions++;
            currentHunk.lines.push({
              type: 'addition',
              content,
              newLineNumber: newLineNum++,
            });
          } else if (line.startsWith('-')) {
            deletions++;
            currentHunk.lines.push({
              type: 'deletion',
              content,
              oldLineNumber: oldLineNum++,
            });
          } else {
            currentHunk.lines.push({
              type: 'context',
              content,
              oldLineNumber: oldLineNum++,
              newLineNumber: newLineNum++,
            });
          }
        }
      }

      if (currentHunk) hunks.push(currentHunk);

      diffs.push({
        path: filePath,
        hunks,
        additions,
        deletions,
      });
    }

    return diffs;
  }

  async getLog(limit: number = 50): Promise<GitCommit[]> {
    const safeLimit = Math.min(Math.max(1, limit), 1000);
    const format = '%H|%h|%an|%ae|%aI|%s|%b<<<COMMIT>>>';
    const output = await this.runGit(['log', `-${safeLimit}`, `--format=${format}`]);
    
    const commits: GitCommit[] = [];
    const rawCommits = output.split('<<<COMMIT>>>').filter(Boolean);

    for (const raw of rawCommits) {
      const lines = raw.trim().split('|');
      if (lines.length < 6) continue;

      commits.push({
        hash: lines[0],
        shortHash: lines[1],
        author: lines[2],
        email: lines[3],
        date: lines[4],
        message: lines[5],
        body: lines.slice(6).join('|').trim() || undefined,
      });
    }

    return commits;
  }

  async stageFile(filePath: string): Promise<void> {
    const safePath = this.sanitizePath(filePath);
    await this.runGit(['add', safePath]);
  }

  async stageAll(): Promise<void> {
    await this.runGit(['add', '-A']);
  }

  async unstageFile(filePath: string): Promise<void> {
    const safePath = this.sanitizePath(filePath);
    await this.runGit(['reset', 'HEAD', safePath]);
  }

  async discardChanges(filePath: string): Promise<void> {
    const safePath = this.sanitizePath(filePath);
    await this.runGit(['checkout', '--', safePath]);
  }

  async commit(message: string): Promise<GitCommit> {
    if (!message || typeof message !== 'string' || message.length > 10000) {
      throw new Error('Invalid commit message');
    }
    await this.runGit(['commit', '-m', message]);
    const log = await this.getLog(1);
    return log[0];
  }

  async getFileHistory(filePath: string, limit: number = 20): Promise<GitCommit[]> {
    const safePath = this.sanitizePath(filePath);
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const format = '%H|%h|%an|%ae|%aI|%s<<<COMMIT>>>';
    const output = await this.runGit(['log', `-${safeLimit}`, `--format=${format}`, '--', safePath]);
    
    const commits: GitCommit[] = [];
    const rawCommits = output.split('<<<COMMIT>>>').filter(Boolean);

    for (const raw of rawCommits) {
      const parts = raw.trim().split('|');
      if (parts.length < 6) continue;

      commits.push({
        hash: parts[0],
        shortHash: parts[1],
        author: parts[2],
        email: parts[3],
        date: parts[4],
        message: parts[5],
      });
    }

    return commits;
  }

  async getBlame(filePath: string): Promise<Array<{
    line: number;
    hash: string;
    author: string;
    date: string;
    content: string;
  }>> {
    try {
      const safePath = this.sanitizePath(filePath);
      const output = await this.runGit(['blame', '--line-porcelain', safePath]);
      const lines = output.split('\n');
      const blameData: Array<{
        line: number;
        hash: string;
        author: string;
        date: string;
        content: string;
      }> = [];

      let currentHash = '';
      let currentAuthor = '';
      let currentDate = '';
      let lineNumber = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (/^[0-9a-f]{40}/.test(line)) {
          currentHash = line.slice(0, 40);
          lineNumber++;
        } else if (line.startsWith('author ')) {
          currentAuthor = line.slice(7);
        } else if (line.startsWith('author-time ')) {
          const timestamp = parseInt(line.slice(12), 10);
          currentDate = new Date(timestamp * 1000).toISOString();
        } else if (line.startsWith('\t')) {
          blameData.push({
            line: lineNumber,
            hash: currentHash.slice(0, 8),
            author: currentAuthor,
            date: currentDate,
            content: line.slice(1),
          });
        }
      }

      return blameData;
    } catch {
      return [];
    }
  }
}

export const localGitService = new LocalGitService();
