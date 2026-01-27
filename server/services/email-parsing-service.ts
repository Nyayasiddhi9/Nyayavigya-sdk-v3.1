import Imap from 'imap';
import { simpleParser, ParsedMail, Attachment } from 'mailparser';
import { google } from 'googleapis';
import { db } from '../db';
import {
  emailAccounts,
  emailMessages,
  emailAttachments,
  emailThreads,
  emailParseJobs,
  type EmailAccount,
  type InsertEmailMessage,
  type InsertEmailAttachment,
  type InsertEmailThread,
  type InsertEmailParseJob
} from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import crypto from 'crypto';

// Password decryption utilities - REQUIRED when using email features
const ENCRYPTION_KEY = process.env.EMAIL_ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 64) {
  console.warn('⚠️  EMAIL_ENCRYPTION_KEY not configured - Email parsing features disabled');
  console.warn('To enable: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
}

const ALGORITHM = 'aes-256-gcm';

function decryptPassword(encrypted: string): string {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 64) {
    throw new Error('EMAIL_ENCRYPTION_KEY must be set (64+ hex characters) to use email features');
  }
  
  try {
    const [ivHex, authTagHex, encryptedData] = encrypted.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex'), iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Password decryption failed:', error);
    throw new Error('Failed to decrypt password');
  }
}

// ============================================================================
// EMAIL PARSING SERVICE - Comprehensive Email Management
// ============================================================================

export class EmailParsingService {
  
  // ==================== IMAP Connection ====================
  
  async connectImap(account: EmailAccount): Promise<Imap> {
    return new Promise((resolve, reject) => {
      // Decrypt password for IMAP authentication
      const decryptedPassword = account.password ? decryptPassword(account.password) : '';
      
      const imap = new Imap({
        user: account.email,
        password: decryptedPassword,
        host: account.imapHost || '',
        port: account.imapPort || 993,
        tls: account.imapSecure ?? true,
        // Secure TLS: require valid certificates (production-ready)
        // Self-signed certs will fail - use trusted CAs only
        tlsOptions: { rejectUnauthorized: true },
        connTimeout: 30000,
        authTimeout: 30000
      });

      imap.once('ready', () => {
        console.log('📧 IMAP connected:', account.email);
        resolve(imap);
      });

      imap.once('error', (err) => {
        console.error('❌ IMAP error:', err);
        reject(err);
      });

      imap.connect();
    });
  }

  // ==================== Gmail API Connection ====================
  
  async getGmailClient(account: EmailAccount) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: account.accessToken,
      refresh_token: account.refreshToken,
    });

    // Handle token refresh automatically
    oauth2Client.on('tokens', async (tokens) => {
      if (tokens.access_token) {
        // Update tokens in database
        await db.update(emailAccounts)
          .set({
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token || account.refreshToken,
            tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
            updatedAt: new Date()
          })
          .where(eq(emailAccounts.id, account.id));
      }
    });

    // Check if token needs refresh
    if (account.tokenExpiry && account.tokenExpiry < new Date()) {
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials(credentials);
      } catch (error) {
        console.error('Token refresh failed:', error);
        // Update account status to error
        await db.update(emailAccounts)
          .set({
            status: 'error',
            lastError: 'Token refresh failed - re-authentication required'
          })
          .where(eq(emailAccounts.id, account.id));
        throw error;
      }
    }

    return google.gmail({ version: 'v1', auth: oauth2Client });
  }

  // ==================== Fetch Messages via IMAP ====================
  
  async fetchImapMessages(account: EmailAccount, folder: string = 'INBOX', limit: number = 50): Promise<ParsedMail[]> {
    const imap = await this.connectImap(account);
    
    return new Promise((resolve, reject) => {
      imap.openBox(folder, false, (err, box) => {
        if (err) {
          reject(err);
          return;
        }

        const messages: ParsedMail[] = [];
        const totalMessages = box.messages.total;
        const startSeq = Math.max(1, totalMessages - limit + 1);

        const fetch = imap.seq.fetch(`${startSeq}:*`, {
          bodies: '',
          struct: true
        });

        fetch.on('message', (msg) => {
          msg.on('body', (stream) => {
            simpleParser(stream, (err, parsed) => {
              if (!err && parsed) {
                messages.push(parsed);
              }
            });
          });
        });

        fetch.once('error', reject);

        fetch.once('end', () => {
          imap.end();
          resolve(messages);
        });
      });
    });
  }

  // ==================== Fetch Messages via Gmail API ====================
  
  async fetchGmailMessages(account: EmailAccount, limit: number = 50) {
    const gmail = await this.getGmailClient(account);
    
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: limit,
      labelIds: ['INBOX']
    });

    const messages = response.data.messages || [];
    const parsedMessages: ParsedMail[] = [];

    for (const message of messages) {
      const fullMessage = await gmail.users.messages.get({
        userId: 'me',
        id: message.id!,
        format: 'raw'
      });

      if (fullMessage.data.raw) {
        const emailBuffer = Buffer.from(fullMessage.data.raw, 'base64');
        const parsed = await simpleParser(emailBuffer);
        parsedMessages.push(parsed);
      }
    }

    return parsedMessages;
  }

  // ==================== Parse and Store Messages ====================
  
  async parseAndStoreMessage(account: EmailAccount, parsed: ParsedMail): Promise<number> {
    // Extract thread ID
    const threadId = this.generateThreadId(parsed);

    // Store message
    const [message] = await db.insert(emailMessages).values({
      accountId: account.id,
      userId: account.userId,
      messageId: parsed.messageId || `msg-${Date.now()}`,
      threadId,
      inReplyTo: parsed.inReplyTo || null,
      references: parsed.references as string[] || [],
      from: parsed.from?.value || [],
      to: parsed.to?.value || [],
      cc: parsed.cc?.value || [],
      bcc: parsed.bcc?.value || [],
      replyTo: parsed.replyTo?.value || null,
      subject: parsed.subject || null,
      textBody: parsed.text || null,
      htmlBody: parsed.html || null,
      snippet: (parsed.text || '').substring(0, 200),
      date: parsed.date || new Date(),
      size: parsed.text?.length || 0,
      hasAttachments: (parsed.attachments?.length || 0) > 0,
      attachmentCount: parsed.attachments?.length || 0,
      folder: 'INBOX'
    } as InsertEmailMessage).returning();

    // Store attachments
    if (parsed.attachments && parsed.attachments.length > 0) {
      await this.storeAttachments(message.id, account.userId, parsed.attachments);
    }

    // Update thread
    await this.updateThread(account, threadId, parsed);

    return message.id;
  }

  // ==================== Store Attachments ====================
  
  async storeAttachments(messageId: number, userId: string, attachments: Attachment[]) {
    for (const attachment of attachments) {
      const checksum = crypto.createHash('md5').update(attachment.content).digest('hex');
      
      await db.insert(emailAttachments).values({
        messageId,
        userId,
        filename: attachment.filename || 'unknown',
        mimeType: attachment.contentType,
        size: attachment.size,
        contentId: attachment.contentId || null,
        checksum,
        isInline: !!attachment.contentId,
        encoding: attachment.contentTransferEncoding
      } as InsertEmailAttachment);
    }
  }

  // ==================== Thread Management ====================
  
  private generateThreadId(parsed: ParsedMail): string {
    // Use In-Reply-To or References for threading
    if (parsed.inReplyTo) {
      return parsed.inReplyTo;
    }
    if (parsed.references && parsed.references.length > 0) {
      return Array.isArray(parsed.references) ? parsed.references[0] : parsed.references;
    }
    // New thread
    return parsed.messageId || `thread-${Date.now()}`;
  }

  async updateThread(account: EmailAccount, threadId: string, parsed: ParsedMail) {
    const existing = await db.query.emailThreads.findFirst({
      where: eq(emailThreads.threadId, threadId)
    });

    if (existing) {
      // Update existing thread
      await db.update(emailThreads)
        .set({
          lastMessageAt: parsed.date || new Date(),
          lastMessageFrom: parsed.from?.value || [],
          messageCount: (existing.messageCount || 0) + 1
        })
        .where(eq(emailThreads.id, existing.id));
    } else {
      // Create new thread
      await db.insert(emailThreads).values({
        threadId,
        accountId: account.id,
        userId: account.userId,
        subject: parsed.subject || null,
        participantCount: this.countParticipants(parsed),
        messageCount: 1,
        firstMessageAt: parsed.date || new Date(),
        lastMessageAt: parsed.date || new Date(),
        lastMessageFrom: parsed.from?.value || []
      } as InsertEmailThread);
    }
  }

  private countParticipants(parsed: ParsedMail): number {
    const participants = new Set<string>();
    
    if (parsed.from?.value) {
      (parsed.from.value as any[]).forEach(addr => participants.add(addr.address));
    }
    if (parsed.to?.value) {
      (parsed.to.value as any[]).forEach(addr => participants.add(addr.address));
    }
    if (parsed.cc?.value) {
      (parsed.cc.value as any[]).forEach(addr => participants.add(addr.address));
    }
    
    return participants.size;
  }

  // ==================== Full Sync ====================
  
  async syncAccount(accountId: number): Promise<number> {
    const account = await db.query.emailAccounts.findFirst({
      where: eq(emailAccounts.id, accountId)
    });

    if (!account) {
      throw new Error('Account not found');
    }

    // Create parse job
    const [job] = await db.insert(emailParseJobs).values({
      accountId: account.id,
      userId: account.userId,
      jobType: 'full_sync',
      status: 'processing',
      startedAt: new Date()
    } as InsertEmailParseJob).returning();

    try {
      let messages: ParsedMail[] = [];

      // Fetch based on provider
      if (account.provider === 'gmail_api') {
        messages = await this.fetchGmailMessages(account);
      } else if (account.provider === 'imap') {
        messages = await this.fetchImapMessages(account);
      }

      // Parse and store each message
      let newMessages = 0;
      for (const parsed of messages) {
        try {
          await this.parseAndStoreMessage(account, parsed);
          newMessages++;
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      }

      // Update job
      await db.update(emailParseJobs)
        .set({
          status: 'completed',
          completedAt: new Date(),
          totalItems: messages.length,
          processedItems: messages.length,
          newMessages,
          duration: Date.now() - job.startedAt!.getTime()
        })
        .where(eq(emailParseJobs.id, job.id));

      // Update account
      await db.update(emailAccounts)
        .set({
          lastSyncAt: new Date(),
          status: 'active'
        })
        .where(eq(emailAccounts.id, account.id));

      return newMessages;
    } catch (error) {
      // Update job with error
      await db.update(emailParseJobs)
        .set({
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date()
        })
        .where(eq(emailParseJobs.id, job.id));

      throw error;
    }
  }

  // ==================== AI Analysis ====================
  
  async analyzeThread(threadId: string) {
    const thread = await db.query.emailThreads.findFirst({
      where: eq(emailThreads.threadId, threadId)
    });

    if (!thread) {
      return null;
    }

    const messages = await db.query.emailMessages.findMany({
      where: eq(emailMessages.threadId, threadId),
      orderBy: desc(emailMessages.date)
    });

    // AI analysis placeholder (integrate with WAI SDK)
    const summary = this.generateThreadSummary(messages);
    const sentiment = this.analyzeSentiment(messages);
    const priority = this.determinePriority(messages);
    const category = this.categorize(messages);

    await db.update(emailThreads)
      .set({
        summary,
        sentiment,
        priority,
        category
      })
      .where(eq(emailThreads.id, thread.id));

    return {
      summary,
      sentiment,
      priority,
      category
    };
  }

  private generateThreadSummary(messages: any[]): string {
    // Simple summary - can be enhanced with AI
    if (messages.length === 0) return '';
    const firstMessage = messages[messages.length - 1];
    return `${messages.length} messages about: ${firstMessage.subject}`;
  }

  private analyzeSentiment(messages: any[]): string {
    // Placeholder - integrate with sentiment analysis
    return 'neutral';
  }

  private determinePriority(messages: any[]): string {
    // Check for urgent keywords
    const urgentKeywords = ['urgent', 'asap', 'important', 'critical'];
    const hasUrgent = messages.some(msg => 
      urgentKeywords.some(keyword => 
        (msg.subject || '').toLowerCase().includes(keyword) ||
        (msg.textBody || '').toLowerCase().includes(keyword)
      )
    );
    
    return hasUrgent ? 'high' : 'medium';
  }

  private categorize(messages: any[]): string {
    // Simple categorization - can be enhanced with AI
    const categories = {
      work: ['meeting', 'project', 'deadline', 'report'],
      personal: ['family', 'friend', 'dinner', 'weekend'],
      marketing: ['offer', 'discount', 'sale', 'promotion'],
      support: ['ticket', 'issue', 'problem', 'help']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      for (const msg of messages) {
        const text = ((msg.subject || '') + ' ' + (msg.textBody || '')).toLowerCase();
        if (keywords.some(kw => text.includes(kw))) {
          return category;
        }
      }
    }

    return 'general';
  }

  // ==================== Search ====================
  
  async searchMessages(userId: string, query: string, filters?: {
    accountId?: number;
    folder?: string;
    hasAttachments?: boolean;
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    const searchTerm = `%${query}%`;
    
    // This is a simplified search - in production use full-text search
    let conditions = [eq(emailMessages.userId, userId)];
    
    if (filters?.accountId) {
      conditions.push(eq(emailMessages.accountId, filters.accountId));
    }
    
    const messages = await db.query.emailMessages.findMany({
      where: and(...conditions),
      orderBy: desc(emailMessages.date),
      limit: 100
    });

    // Filter by search term
    return messages.filter(msg => 
      (msg.subject || '').toLowerCase().includes(query.toLowerCase()) ||
      (msg.textBody || '').toLowerCase().includes(query.toLowerCase())
    );
  }
}

// Export singleton instance
export const emailParsingService = new EmailParsingService();
