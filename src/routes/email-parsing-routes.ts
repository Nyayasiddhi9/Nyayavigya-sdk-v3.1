import { Router, Request, Response } from 'express';
import { db } from '../db';
import {
  emailAccounts,
  emailMessages,
  emailAttachments,
  emailThreads,
  emailParseJobs,
  emailTemplates,
  insertEmailAccountSchema,
  insertEmailTemplateSchema
} from '@shared/schema';
import { eq, and, desc, gte, lte } from 'drizzle-orm';
import { emailParsingService } from '../services/email-parsing-service';
import crypto from 'crypto';

// Encryption utilities for password storage - REQUIRED when using email features
const ENCRYPTION_KEY = process.env.EMAIL_ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 64) {
  console.warn(`
⚠️  EMAIL_ENCRYPTION_KEY not configured - Email routes will fail if used

To enable email features:
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

Then set in your environment:
  export EMAIL_ENCRYPTION_KEY="<generated-key>"
  `);
}

const ALGORITHM = 'aes-256-gcm';

function encryptPassword(password: string): string {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 64) {
    throw new Error('EMAIL_ENCRYPTION_KEY must be set (64+ hex characters) to use email features');
  }
  
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex'), iv);
  
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decryptPassword(encrypted: string): string {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 64) {
    throw new Error('EMAIL_ENCRYPTION_KEY must be set (64+ hex characters) to use email features');
  }
  
  const [ivHex, authTagHex, encryptedData] = encrypted.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex'), iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

const router = Router();

// ============================================================================
// EMAIL ACCOUNT MANAGEMENT
// ============================================================================

// List all email accounts for user
router.get('/email/accounts', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const accounts = await db.query.emailAccounts.findMany({
      where: eq(emailAccounts.userId, userId),
      orderBy: desc(emailAccounts.createdAt)
    });

    // Remove sensitive data
    const sanitized = accounts.map(acc => ({
      ...acc,
      password: undefined,
      accessToken: undefined,
      refreshToken: undefined
    }));

    res.json(sanitized);
  } catch (error) {
    console.error('Error fetching email accounts:', error);
    res.status(500).json({ error: 'Failed to fetch email accounts' });
  }
});

// Add new email account
router.post('/email/accounts', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const data = insertEmailAccountSchema.parse({
      ...req.body,
      userId
    });

    // Encrypt password if provided (reversible encryption for IMAP auth)
    if (data.password) {
      data.password = encryptPassword(data.password);
    }

    const [account] = await db.insert(emailAccounts).values(data).returning();

    res.json({
      ...account,
      password: undefined,
      accessToken: undefined,
      refreshToken: undefined
    });
  } catch (error) {
    console.error('Error adding email account:', error);
    res.status(500).json({ error: 'Failed to add email account' });
  }
});

// Update email account
router.patch('/email/accounts/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const accountId = parseInt(req.params.id);
    const updates = req.body;

    // Verify ownership
    const account = await db.query.emailAccounts.findFirst({
      where: and(
        eq(emailAccounts.id, accountId),
        eq(emailAccounts.userId, userId)
      )
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Re-encrypt password if provided in update
    if (updates.password) {
      updates.password = encryptPassword(updates.password);
    }

    const [updated] = await db.update(emailAccounts)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(emailAccounts.id, accountId))
      .returning();

    res.json({
      ...updated,
      password: undefined,
      accessToken: undefined,
      refreshToken: undefined
    });
  } catch (error) {
    console.error('Error updating email account:', error);
    res.status(500).json({ error: 'Failed to update email account' });
  }
});

// Delete email account
router.delete('/email/accounts/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const accountId = parseInt(req.params.id);

    // Verify ownership
    const account = await db.query.emailAccounts.findFirst({
      where: and(
        eq(emailAccounts.id, accountId),
        eq(emailAccounts.userId, userId)
      )
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    await db.delete(emailAccounts).where(eq(emailAccounts.id, accountId));

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting email account:', error);
    res.status(500).json({ error: 'Failed to delete email account' });
  }
});

// ============================================================================
// EMAIL SYNC & FETCHING
// ============================================================================

// Sync email account
router.post('/email/accounts/:id/sync', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const accountId = parseInt(req.params.id);

    // Verify ownership
    const account = await db.query.emailAccounts.findFirst({
      where: and(
        eq(emailAccounts.id, accountId),
        eq(emailAccounts.userId, userId)
      )
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const newMessages = await emailParsingService.syncAccount(accountId);

    res.json({
      success: true,
      newMessages,
      syncedAt: new Date()
    });
  } catch (error) {
    console.error('Error syncing email account:', error);
    res.status(500).json({ error: 'Failed to sync email account' });
  }
});

// ============================================================================
// EMAIL MESSAGES
// ============================================================================

// List messages
router.get('/email/messages', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      accountId,
      folder,
      isRead,
      isStarred,
      limit = 50,
      offset = 0
    } = req.query;

    const conditions = [eq(emailMessages.userId, userId)];

    if (accountId) {
      conditions.push(eq(emailMessages.accountId, parseInt(accountId as string)));
    }
    if (folder) {
      conditions.push(eq(emailMessages.folder, folder as string));
    }
    if (isRead !== undefined) {
      conditions.push(eq(emailMessages.isRead, isRead === 'true'));
    }
    if (isStarred !== undefined) {
      conditions.push(eq(emailMessages.isStarred, isStarred === 'true'));
    }

    const messages = await db.query.emailMessages.findMany({
      where: and(...conditions),
      orderBy: desc(emailMessages.date),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get single message
router.get('/email/messages/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const messageId = parseInt(req.params.id);

    const message = await db.query.emailMessages.findFirst({
      where: and(
        eq(emailMessages.id, messageId),
        eq(emailMessages.userId, userId)
      ),
      with: {
        emailAttachments: true
      }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Mark as read
    if (!message.isRead) {
      await db.update(emailMessages)
        .set({ isRead: true })
        .where(eq(emailMessages.id, messageId));
    }

    res.json(message);
  } catch (error) {
    console.error('Error fetching message:', error);
    res.status(500).json({ error: 'Failed to fetch message' });
  }
});

// Update message flags
router.patch('/email/messages/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const messageId = parseInt(req.params.id);
    const { isRead, isStarred, isFlagged, isImportant, labels, folder } = req.body;

    const message = await db.query.emailMessages.findFirst({
      where: and(
        eq(emailMessages.id, messageId),
        eq(emailMessages.userId, userId)
      )
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const [updated] = await db.update(emailMessages)
      .set({
        ...(isRead !== undefined && { isRead }),
        ...(isStarred !== undefined && { isStarred }),
        ...(isFlagged !== undefined && { isFlagged }),
        ...(isImportant !== undefined && { isImportant }),
        ...(labels && { labels }),
        ...(folder && { folder }),
        updatedAt: new Date()
      })
      .where(eq(emailMessages.id, messageId))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({ error: 'Failed to update message' });
  }
});

// Search messages
router.get('/email/search', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { query, accountId, folder, hasAttachments } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const filters = {
      accountId: accountId ? parseInt(accountId as string) : undefined,
      folder: folder as string,
      hasAttachments: hasAttachments === 'true'
    };

    const messages = await emailParsingService.searchMessages(
      userId,
      query as string,
      filters
    );

    res.json(messages);
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({ error: 'Failed to search messages' });
  }
});

// ============================================================================
// EMAIL THREADS
// ============================================================================

// List threads
router.get('/email/threads', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { accountId, limit = 50, offset = 0 } = req.query;

    const conditions = [eq(emailThreads.userId, userId)];
    if (accountId) {
      conditions.push(eq(emailThreads.accountId, parseInt(accountId as string)));
    }

    const threads = await db.query.emailThreads.findMany({
      where: and(...conditions),
      orderBy: desc(emailThreads.lastMessageAt),
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

    res.json(threads);
  } catch (error) {
    console.error('Error fetching threads:', error);
    res.status(500).json({ error: 'Failed to fetch threads' });
  }
});

// Get thread with messages
router.get('/email/threads/:threadId', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { threadId } = req.params;

    const thread = await db.query.emailThreads.findFirst({
      where: and(
        eq(emailThreads.threadId, threadId),
        eq(emailThreads.userId, userId)
      )
    });

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    const messages = await db.query.emailMessages.findMany({
      where: eq(emailMessages.threadId, threadId),
      orderBy: emailMessages.date
    });

    res.json({
      thread,
      messages
    });
  } catch (error) {
    console.error('Error fetching thread:', error);
    res.status(500).json({ error: 'Failed to fetch thread' });
  }
});

// Analyze thread
router.post('/email/threads/:threadId/analyze', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { threadId } = req.params;

    const analysis = await emailParsingService.analyzeThread(threadId);

    if (!analysis) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing thread:', error);
    res.status(500).json({ error: 'Failed to analyze thread' });
  }
});

// ============================================================================
// EMAIL PARSE JOBS
// ============================================================================

// List parse jobs
router.get('/email/jobs', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const jobs = await db.query.emailParseJobs.findMany({
      where: eq(emailParseJobs.userId, userId),
      orderBy: desc(emailParseJobs.createdAt),
      limit: 50
    });

    res.json(jobs);
  } catch (error) {
    console.error('Error fetching parse jobs:', error);
    res.status(500).json({ error: 'Failed to fetch parse jobs' });
  }
});

// Get job status
router.get('/email/jobs/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const jobId = parseInt(req.params.id);

    const job = await db.query.emailParseJobs.findFirst({
      where: and(
        eq(emailParseJobs.id, jobId),
        eq(emailParseJobs.userId, userId)
      )
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

// List templates
router.get('/email/templates', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const templates = await db.query.emailTemplates.findMany({
      where: eq(emailTemplates.userId, userId),
      orderBy: desc(emailTemplates.useCount)
    });

    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Create template
router.post('/email/templates', async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any)?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const data = insertEmailTemplateSchema.parse({
      ...req.body,
      userId
    });

    const [template] = await db.insert(emailTemplates).values(data).returning();

    res.json(template);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

export default router;
