
// Control Loop Database Schema
// Tables: job_lineage, policy_eval, health_signal, asset_lock, capability_matrix, rights_ledger

export const jobLineageTable = {
  id: 'varchar(255) PRIMARY KEY',
  jobId: 'varchar(255) NOT NULL',
  parentJobId: 'varchar(255)',
  agentId: 'varchar(255) NOT NULL',
  pipelineId: 'varchar(255)',
  startTime: 'timestamp NOT NULL',
  endTime: 'timestamp',
  status: 'varchar(50) NOT NULL',
  inputData: 'jsonb',
  outputData: 'jsonb',
  metadata: 'jsonb',
  createdAt: 'timestamp DEFAULT NOW()'
};

export const policyEvalTable = {
  id: 'varchar(255) PRIMARY KEY',
  jobId: 'varchar(255) NOT NULL',
  policyType: 'varchar(100) NOT NULL', // cost, latency, quality, rights
  policyVersion: 'varchar(50) NOT NULL',
  evaluationResult: 'varchar(50) NOT NULL', // pass, fail, warning
  score: 'decimal(5,4)',
  details: 'jsonb',
  evaluatedAt: 'timestamp DEFAULT NOW()'
};

export const healthSignalTable = {
  id: 'varchar(255) PRIMARY KEY',
  componentType: 'varchar(100) NOT NULL', // agent, pipeline, model, system
  componentId: 'varchar(255) NOT NULL',
  signalType: 'varchar(100) NOT NULL', // performance, error, resource
  severity: 'varchar(50) NOT NULL', // low, medium, high, critical
  value: 'decimal(10,4)',
  threshold: 'decimal(10,4)',
  message: 'text',
  metadata: 'jsonb',
  timestamp: 'timestamp DEFAULT NOW()'
};

export const assetLockTable = {
  id: 'varchar(255) PRIMARY KEY',
  assetType: 'varchar(100) NOT NULL', // model, agent, pipeline, resource
  assetId: 'varchar(255) NOT NULL',
  lockType: 'varchar(50) NOT NULL', // exclusive, shared, read
  ownerId: 'varchar(255) NOT NULL',
  acquiredAt: 'timestamp DEFAULT NOW()',
  expiresAt: 'timestamp',
  metadata: 'jsonb'
};

export const capabilityMatrixTable = {
  id: 'varchar(255) PRIMARY KEY',
  providerId: 'varchar(255) NOT NULL',
  modelId: 'varchar(255) NOT NULL',
  capability: 'varchar(100) NOT NULL',
  performance: 'jsonb NOT NULL',
  pricing: 'jsonb NOT NULL',
  limits: 'jsonb NOT NULL',
  lastUpdated: 'timestamp DEFAULT NOW()'
};

export const rightsLedgerTable = {
  id: 'varchar(255) PRIMARY KEY',
  assetId: 'varchar(255) NOT NULL',
  assetType: 'varchar(100) NOT NULL',
  rightsType: 'varchar(100) NOT NULL', // usage, distribution, modification
  ownerId: 'varchar(255) NOT NULL',
  grantedTo: 'varchar(255)',
  grantedAt: 'timestamp DEFAULT NOW()',
  expiresAt: 'timestamp',
  conditions: 'jsonb',
  status: 'varchar(50) DEFAULT "active"'
};
