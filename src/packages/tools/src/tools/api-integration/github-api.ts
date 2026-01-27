/**
 * GitHub API Tool
 * Interact with GitHub repositories, issues, PRs
 */

import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * GitHub API Tool Definition
 */
export const githubApiTool: Tool = {
  id: 'github_api',
  name: 'GitHub API',
  description: 'GitHub operations: repos, issues, PRs, commits, actions, webhooks',
  parameters: [
    {
      name: 'action',
      type: 'string',
      description: 'Action: get_repo, create_issue, list_prs, create_pr, etc.',
      required: true,
    },
    {
      name: 'params',
      type: 'object',
      description: 'Action parameters (owner, repo, title, body, etc.)',
      required: true,
    },
  ],
  returns: {
    type: 'object',
    description: 'GitHub API response',
  },
  examples: [
    {
      input: {
        action: 'create_issue',
        params: {
          owner: 'octocat',
          repo: 'Hello-World',
          title: 'Bug report',
          body: 'Something is broken',
        },
      },
      output: {
        success: true,
        issueNumber: 42,
        url: 'https://github.com/octocat/Hello-World/issues/42',
      },
    },
  ],
};

/**
 * GitHub API Executor
 * Note: This is a thin client that returns configuration for the host to execute
 */
export const githubApiExecutor: ToolExecutor = async (params) => {
  const { action, params: actionParams } = params;

  const validActions = [
    'get_repo', 'list_repos', 'create_repo',
    'get_issue', 'list_issues', 'create_issue', 'update_issue',
    'get_pr', 'list_prs', 'create_pr', 'merge_pr',
    'list_commits', 'get_commit',
    'list_actions', 'trigger_workflow',
  ];

  if (!validActions.includes(action)) {
    return {
      success: false,
      error: `action must be one of: ${validActions.join(', ')}`,
    };
  }

  if (!actionParams || typeof actionParams !== 'object') {
    return {
      success: false,
      error: 'params must be an object',
    };
  }

  // Return GitHub configuration for host to execute
  return {
    success: true,
    action: `github_${action}`,
    config: actionParams,
    note: 'GitHub API requires GitHub token and execution by host environment',
  };
};
