/**
 * Encryption utilities for secure storage of sensitive data
 * Uses AES-256-GCM for encryption with environment-based keys
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits

// Get encryption key from environment - MANDATORY for security
function getEncryptionKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY;
  
  if (envKey) {
    // Use environment key (should be 64 hex chars for 32 bytes)
    return Buffer.from(envKey, 'hex');
  }
  
  // CRITICAL: Encryption key is required in production
  // Only allow SESSION_SECRET derivation in explicit development mode
  if (process.env.NODE_ENV === 'development' && process.env.SESSION_SECRET) {
    console.warn('⚠️ WARNING: Using SESSION_SECRET for encryption in development. Set ENCRYPTION_KEY for production!');
    return crypto.scryptSync(process.env.SESSION_SECRET, 'salt', KEY_LENGTH);
  }
  
  throw new Error('ENCRYPTION_KEY environment variable is required for secure API key storage. Generate one with: node -e "console.log(crypto.randomBytes(32).toString(\'hex\'))"');
}

export function encrypt(text: string): { encrypted: string; iv: string; authTag: string } {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

export function decrypt(encrypted: string, iv: string, authTag: string): string {
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'));
  
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Hash for verification without decryption
export function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}
