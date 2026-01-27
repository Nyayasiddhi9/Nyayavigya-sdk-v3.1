/**
 * AWS S3 Tool
 * Manage S3 buckets and objects
 */

import { Tool, ToolExecutor } from '@wai/protocols/mcp';

/**
 * AWS S3 Tool Definition
 */
export const awsS3Tool: Tool = {
  id: 'aws_s3',
  name: 'AWS S3',
  description: 'S3 operations: upload, download, delete files, manage buckets, presigned URLs',
  parameters: [
    {
      name: 'action',
      type: 'string',
      description: 'Action: upload, download, delete, list, create_bucket, etc.',
      required: true,
    },
    {
      name: 'params',
      type: 'object',
      description: 'Action parameters (bucket, key, file, etc.)',
      required: true,
    },
  ],
  returns: {
    type: 'object',
    description: 'S3 API response',
  },
  examples: [
    {
      input: {
        action: 'upload',
        params: {
          bucket: 'my-bucket',
          key: 'files/document.pdf',
          file: 'base64EncodedFileData...',
        },
      },
      output: {
        success: true,
        url: 'https://my-bucket.s3.amazonaws.com/files/document.pdf',
        etag: '"abc123"',
      },
    },
  ],
};

/**
 * AWS S3 Executor
 * Note: This is a thin client that returns configuration for the host to execute
 */
export const awsS3Executor: ToolExecutor = async (params) => {
  const { action, params: actionParams } = params;

  const validActions = [
    'upload', 'download', 'delete', 'copy', 'move',
    'list_objects', 'get_object', 'head_object',
    'create_bucket', 'delete_bucket', 'list_buckets',
    'get_presigned_url', 'get_presigned_post',
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

  // Return S3 configuration for host to execute
  return {
    success: true,
    action: `s3_${action}`,
    config: actionParams,
    note: 'AWS S3 requires AWS credentials (access key, secret key, region) and execution by host environment',
  };
};
