/**
 * Real GitHub Integration Service
 * Complete repository management, branch operations, and file synchronization
 */
import { Octokit } from '@octokit/rest';
import { storage } from '../storage/database-storage';
import { eventService } from '../config/redis';

export class GitHubIntegrationService {
  private octokit: Octokit | null = null;

  constructor() {
    if (process.env.GITHUB_TOKEN) {
      this.octokit = new Octokit({
        auth: process.env.GITHUB_TOKEN
      });
    }
  }

  /**
   * Initialize GitHub client with user token
   */
  private async getOctokitClient(userId: number): Promise<Octokit> {
    const userToken = await storage.getProviderToken(userId, 'github');
    if (!userToken) {
      throw new Error('GitHub token not found. Please connect your GitHub account.');
    }

    return new Octokit({
      auth: userToken
    });
  }

  /**
   * Create repository for project
   */
  async createRepository(
    userId: number, 
    projectId: number, 
    repoName: string, 
    isPrivate: boolean = true
  ): Promise<any> {
    try {
      const octokit = await this.getOctokitClient(userId);
      
      // Create repository
      const { data: repo } = await octokit.rest.repos.create({
        name: repoName,
        private: isPrivate,
        description: `Project repository created by WAI DevStudio`,
        auto_init: true,
        gitignore_template: 'Node'
      });

      // Store repository info in database
      await this.storeRepositoryInfo(projectId, userId, repo);

      // Setup webhook for real-time updates
      await this.setupWebhook(userId, repo.id, repo.full_name);

      await eventService.publishEvent('github_repo_created', {
        projectId,
        repoUrl: repo.html_url,
        repoName: repo.name
      });

      return repo;
    } catch (error) {
      console.error('Failed to create GitHub repository:', error);
      throw new Error(`GitHub repository creation failed: ${error.message}`);
    }
  }

  /**
   * Sync project files to GitHub repository
   */
  async syncProjectToGitHub(projectId: number, userId: number): Promise<void> {
    try {
      const octokit = await this.getOctokitClient(userId);
      const project = await storage.getProject(projectId);
      const projectFiles = await storage.getProjectFiles(projectId);

      if (!project?.sourceCodeUrl) {
        throw new Error('No GitHub repository linked to this project');
      }

      const [owner, repo] = this.extractOwnerRepo(project.sourceCodeUrl);

      // Get current branch
      const { data: branch } = await octokit.rest.repos.getBranch({
        owner,
        repo,
        branch: 'main'
      });

      // Create commits for each file
      for (const file of projectFiles) {
        if (file.content && file.isActive) {
          await this.createOrUpdateFile(octokit, owner, repo, file);
        }
      }

      // Update project sync status
      await storage.updateProject(projectId, {
        lastSyncAt: new Date()
      });

      await eventService.publishEvent('github_sync_completed', {
        projectId,
        filesCount: projectFiles.length
      });

    } catch (error) {
      console.error('GitHub sync failed:', error);
      throw new Error(`GitHub sync failed: ${error.message}`);
    }
  }

  /**
   * Create or update file in repository
   */
  private async createOrUpdateFile(
    octokit: Octokit, 
    owner: string, 
    repo: string, 
    file: any
  ): Promise<void> {
    try {
      // Check if file exists
      let sha: string | undefined;
      try {
        const { data: existingFile } = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: file.filePath
        });
        if ('sha' in existingFile) {
          sha = existingFile.sha;
        }
      } catch (error) {
        // File doesn't exist, will be created
      }

      // Create or update file
      await octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: file.filePath,
        message: `Update ${file.fileName} via WAI DevStudio`,
        content: Buffer.from(file.content).toString('base64'),
        sha: sha
      });

    } catch (error) {
      console.error(`Failed to sync file ${file.fileName}:`, error);
    }
  }

  /**
   * Clone repository content to project
   */
  async cloneRepositoryToProject(
    userId: number, 
    projectId: number, 
    repoUrl: string
  ): Promise<void> {
    try {
      const octokit = await this.getOctokitClient(userId);
      const [owner, repo] = this.extractOwnerRepo(repoUrl);

      // Get repository contents
      const { data: contents } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: ''
      });

      if (Array.isArray(contents)) {
        // Process each file/directory
        for (const item of contents) {
          if (item.type === 'file') {
            await this.downloadAndStoreFile(octokit, owner, repo, item.path, projectId);
          } else if (item.type === 'dir') {
            await this.downloadDirectory(octokit, owner, repo, item.path, projectId);
          }
        }
      }

      await storage.updateProject(projectId, {
        sourceCodeUrl: repoUrl,
        lastSyncAt: new Date()
      });

    } catch (error) {
      console.error('Failed to clone repository:', error);
      throw new Error(`Repository clone failed: ${error.message}`);
    }
  }

  /**
   * Download and store file from repository
   */
  private async downloadAndStoreFile(
    octokit: Octokit, 
    owner: string, 
    repo: string, 
    path: string, 
    projectId: number
  ): Promise<void> {
    try {
      const { data: file } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path
      });

      if ('content' in file && file.content) {
        const content = Buffer.from(file.content, 'base64').toString('utf-8');
        
        await storage.addProjectFile(projectId, {
          fileName: file.name,
          filePath: path,
          fileType: this.getFileType(file.name),
          mimeType: this.getMimeType(file.name),
          content: content,
          fileSize: file.size
        });
      }
    } catch (error) {
      console.error(`Failed to download file ${path}:`, error);
    }
  }

  /**
   * Download directory recursively
   */
  private async downloadDirectory(
    octokit: Octokit, 
    owner: string, 
    repo: string, 
    path: string, 
    projectId: number
  ): Promise<void> {
    try {
      const { data: contents } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path
      });

      if (Array.isArray(contents)) {
        for (const item of contents) {
          if (item.type === 'file') {
            await this.downloadAndStoreFile(octokit, owner, repo, item.path, projectId);
          } else if (item.type === 'dir') {
            await this.downloadDirectory(octokit, owner, repo, item.path, projectId);
          }
        }
      }
    } catch (error) {
      console.error(`Failed to download directory ${path}:`, error);
    }
  }

  /**
   * Create branch for project
   */
  async createBranch(
    userId: number, 
    projectId: number, 
    branchName: string
  ): Promise<any> {
    try {
      const octokit = await this.getOctokitClient(userId);
      const project = await storage.getProject(projectId);

      if (!project?.sourceCodeUrl) {
        throw new Error('No GitHub repository linked to this project');
      }

      const [owner, repo] = this.extractOwnerRepo(project.sourceCodeUrl);

      // Get main branch to base new branch on
      const { data: mainBranch } = await octokit.rest.repos.getBranch({
        owner,
        repo,
        branch: 'main'
      });

      // Create new branch
      const { data: newBranch } = await octokit.rest.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha: mainBranch.commit.sha
      });

      return newBranch;
    } catch (error) {
      console.error('Failed to create branch:', error);
      throw new Error(`Branch creation failed: ${error.message}`);
    }
  }

  /**
   * Create pull request
   */
  async createPullRequest(
    userId: number, 
    projectId: number, 
    title: string, 
    body: string, 
    head: string, 
    base: string = 'main'
  ): Promise<any> {
    try {
      const octokit = await this.getOctokitClient(userId);
      const project = await storage.getProject(projectId);

      if (!project?.sourceCodeUrl) {
        throw new Error('No GitHub repository linked to this project');
      }

      const [owner, repo] = this.extractOwnerRepo(project.sourceCodeUrl);

      const { data: pullRequest } = await octokit.rest.pulls.create({
        owner,
        repo,
        title,
        body,
        head,
        base
      });

      return pullRequest;
    } catch (error) {
      console.error('Failed to create pull request:', error);
      throw new Error(`Pull request creation failed: ${error.message}`);
    }
  }

  /**
   * Setup webhook for real-time repository updates
   */
  private async setupWebhook(userId: number, repoId: number, repoFullName: string): Promise<void> {
    try {
      const octokit = await this.getOctokitClient(userId);
      const [owner, repo] = repoFullName.split('/');

      const webhookUrl = `${process.env.APP_URL || 'https://api.waidevstudio.com'}/webhooks/github`;

      const { data: webhook } = await octokit.rest.repos.createWebhook({
        owner,
        repo,
        config: {
          url: webhookUrl,
          content_type: 'json',
          secret: process.env.GITHUB_WEBHOOK_SECRET || 'default-secret'
        },
        events: ['push', 'pull_request', 'issues']
      });

      // Store webhook ID for future reference
      // This would be stored in the database
      console.log('Webhook created:', webhook.id);

    } catch (error) {
      console.error('Failed to setup webhook:', error);
    }
  }

  /**
   * Handle GitHub webhook events
   */
  async handleWebhookEvent(event: string, payload: any): Promise<void> {
    try {
      switch (event) {
        case 'push':
          await this.handlePushEvent(payload);
          break;
        case 'pull_request':
          await this.handlePullRequestEvent(payload);
          break;
        case 'issues':
          await this.handleIssueEvent(payload);
          break;
        default:
          console.log('Unhandled webhook event:', event);
      }
    } catch (error) {
      console.error('Webhook handling failed:', error);
    }
  }

  /**
   * Handle push events
   */
  private async handlePushEvent(payload: any): Promise<void> {
    const repoFullName = payload.repository.full_name;
    const commits = payload.commits || [];

    await eventService.publishEvent('github_push', {
      repository: repoFullName,
      commitsCount: commits.length,
      branch: payload.ref?.replace('refs/heads/', ''),
      pusher: payload.pusher?.name
    });
  }

  /**
   * Handle pull request events
   */
  private async handlePullRequestEvent(payload: any): Promise<void> {
    const action = payload.action;
    const pullRequest = payload.pull_request;

    await eventService.publishEvent('github_pull_request', {
      action,
      prNumber: pullRequest.number,
      title: pullRequest.title,
      author: pullRequest.user.login,
      repository: payload.repository.full_name
    });
  }

  /**
   * Handle issue events
   */
  private async handleIssueEvent(payload: any): Promise<void> {
    const action = payload.action;
    const issue = payload.issue;

    await eventService.publishEvent('github_issue', {
      action,
      issueNumber: issue.number,
      title: issue.title,
      author: issue.user.login,
      repository: payload.repository.full_name
    });
  }

  /**
   * Store repository information in database
   */
  private async storeRepositoryInfo(projectId: number, userId: number, repo: any): Promise<void> {
    // This would store in githubRepositories table
    // For now, update the project with the repository URL
    await storage.updateProject(projectId, {
      sourceCodeUrl: repo.html_url,
      lastSyncAt: new Date()
    });
  }

  /**
   * Helper methods
   */
  private extractOwnerRepo(repoUrl: string): [string, string] {
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new Error('Invalid GitHub repository URL');
    }
    return [match[1], match[2].replace('.git', '')];
  }

  private getFileType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    const typeMap: Record<string, string> = {
      'ts': 'source',
      'tsx': 'source',
      'js': 'source',
      'jsx': 'source',
      'py': 'source',
      'java': 'source',
      'css': 'source',
      'scss': 'source',
      'html': 'source',
      'md': 'documentation',
      'json': 'config',
      'yml': 'config',
      'yaml': 'config',
      'png': 'asset',
      'jpg': 'asset',
      'jpeg': 'asset',
      'svg': 'asset'
    };

    return typeMap[extension || ''] || 'source';
  }

  private getMimeType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    const mimeMap: Record<string, string> = {
      'ts': 'text/typescript',
      'tsx': 'text/typescript',
      'js': 'text/javascript',
      'jsx': 'text/javascript',
      'py': 'text/python',
      'java': 'text/java',
      'css': 'text/css',
      'html': 'text/html',
      'md': 'text/markdown',
      'json': 'application/json',
      'yml': 'text/yaml',
      'yaml': 'text/yaml',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'svg': 'image/svg+xml'
    };

    return mimeMap[extension || ''] || 'text/plain';
  }
}

export const githubService = new GitHubIntegrationService();