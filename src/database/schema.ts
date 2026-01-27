import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, uuid, real, index, date } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash'),
  name: varchar('name', { length: 255 }),
  barCouncilId: varchar('bar_council_id', { length: 50 }),
  role: varchar('role', { length: 50 }).default('user').notNull(),
  firmId: integer('firm_id'),
  isAdvocate: boolean('is_advocate').default(false).notNull(),
  jurisdiction: jsonb('jurisdiction').default([]).notNull(),
  specializations: jsonb('specializations').default([]).notNull(),
  preferredLanguage: varchar('preferred_language', { length: 20 }).default('en'),
  isActive: boolean('is_active').default(true).notNull(),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  firmIdx: index('users_firm_idx').on(table.firmId),
  barCouncilIdx: index('users_bar_council_idx').on(table.barCouncilId),
}));

export const lawFirms = pgTable('law_firms', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  registrationNumber: varchar('registration_number', { length: 100 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  pincode: varchar('pincode', { length: 10 }),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  website: varchar('website', { length: 255 }),
  practiceAreas: jsonb('practice_areas').default([]).notNull(),
  plan: varchar('plan', { length: 50 }).default('basic').notNull(),
  usageLimits: jsonb('usage_limits').default({}).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  firmId: integer('firm_id').notNull(),
  clientType: varchar('client_type', { length: 20 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  panNumber: varchar('pan_number', { length: 20 }),
  gstNumber: varchar('gst_number', { length: 20 }),
  companyDetails: jsonb('company_details'),
  notes: text('notes'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  firmIdx: index('clients_firm_idx').on(table.firmId),
  typeIdx: index('clients_type_idx').on(table.clientType),
}));

export const matters = pgTable('matters', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  firmId: integer('firm_id').notNull(),
  clientId: integer('client_id').notNull(),
  matterNumber: varchar('matter_number', { length: 50 }).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  caseType: varchar('case_type', { length: 100 }).notNull(),
  practiceArea: varchar('practice_area', { length: 100 }).notNull(),
  jurisdiction: varchar('jurisdiction', { length: 100 }),
  court: varchar('court', { length: 255 }),
  caseNumber: varchar('case_number', { length: 100 }),
  opposingParty: varchar('opposing_party', { length: 500 }),
  opposingCounsel: varchar('opposing_counsel', { length: 255 }),
  status: varchar('status', { length: 50 }).default('active').notNull(),
  priority: varchar('priority', { length: 20 }).default('normal').notNull(),
  filingDate: date('filing_date'),
  nextHearingDate: date('next_hearing_date'),
  assignedTo: jsonb('assigned_to').default([]).notNull(),
  applicableStatutes: jsonb('applicable_statutes').default([]).notNull(),
  fees: jsonb('fees').default({}).notNull(),
  notes: text('notes'),
  metadata: jsonb('metadata').default({}).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  firmIdx: index('matters_firm_idx').on(table.firmId),
  clientIdx: index('matters_client_idx').on(table.clientId),
  statusIdx: index('matters_status_idx').on(table.status),
  caseTypeIdx: index('matters_case_type_idx').on(table.caseType),
}));

export const hearings = pgTable('hearings', {
  id: serial('id').primaryKey(),
  matterId: integer('matter_id').notNull(),
  hearingDate: timestamp('hearing_date').notNull(),
  court: varchar('court', { length: 255 }).notNull(),
  courtRoom: varchar('court_room', { length: 50 }),
  judge: varchar('judge', { length: 255 }),
  purpose: varchar('purpose', { length: 255 }),
  status: varchar('status', { length: 50 }).default('scheduled').notNull(),
  outcome: text('outcome'),
  nextDate: date('next_date'),
  notes: text('notes'),
  attendees: jsonb('attendees').default([]).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  matterIdx: index('hearings_matter_idx').on(table.matterId),
  dateIdx: index('hearings_date_idx').on(table.hearingDate),
}));

export const legalAgents = pgTable('legal_agents', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  agentId: varchar('agent_id', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }).notNull(),
  practiceAreas: jsonb('practice_areas').default([]).notNull(),
  capabilities: jsonb('capabilities').default([]).notNull(),
  applicableStatutes: jsonb('applicable_statutes').default([]).notNull(),
  systemPrompt: text('system_prompt'),
  tools: jsonb('tools').default([]).notNull(),
  supportedLanguages: jsonb('supported_languages').default(['en', 'hi']).notNull(),
  defaultModel: varchar('default_model', { length: 100 }),
  isActive: boolean('is_active').default(true).notNull(),
  usageCount: integer('usage_count').default(0).notNull(),
  avgLatencyMs: real('avg_latency_ms'),
  successRate: real('success_rate'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  categoryIdx: index('legal_agents_category_idx').on(table.category),
}));

export const statutes = pgTable('statutes', {
  id: serial('id').primaryKey(),
  statuteId: varchar('statute_id', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 500 }).notNull(),
  shortName: varchar('short_name', { length: 100 }),
  year: integer('year'),
  actNumber: varchar('act_number', { length: 50 }),
  category: varchar('category', { length: 100 }).notNull(),
  status: varchar('status', { length: 50 }).default('in_force').notNull(),
  fullText: text('full_text'),
  sections: jsonb('sections').default([]).notNull(),
  amendments: jsonb('amendments').default([]).notNull(),
  relatedStatutes: jsonb('related_statutes').default([]).notNull(),
  metadata: jsonb('metadata').default({}).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  categoryIdx: index('statutes_category_idx').on(table.category),
  yearIdx: index('statutes_year_idx').on(table.year),
}));

export const caseLaw = pgTable('case_law', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  citation: varchar('citation', { length: 255 }).notNull(),
  alternateCitations: jsonb('alternate_citations').default([]).notNull(),
  caseName: varchar('case_name', { length: 1000 }).notNull(),
  court: varchar('court', { length: 255 }).notNull(),
  bench: jsonb('bench').default([]).notNull(),
  decisionDate: date('decision_date'),
  caseType: varchar('case_type', { length: 100 }),
  subject: varchar('subject', { length: 255 }),
  headnotes: text('headnotes'),
  judgment: text('judgment'),
  ratio: text('ratio'),
  obiterDicta: text('obiter_dicta'),
  citedCases: jsonb('cited_cases').default([]).notNull(),
  citedStatutes: jsonb('cited_statutes').default([]).notNull(),
  keywords: jsonb('keywords').default([]).notNull(),
  isLandmark: boolean('is_landmark').default(false).notNull(),
  overruledBy: varchar('overruled_by', { length: 255 }),
  embedding: jsonb('embedding'),
  metadata: jsonb('metadata').default({}).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  courtIdx: index('case_law_court_idx').on(table.court),
  dateIdx: index('case_law_date_idx').on(table.decisionDate),
  typeIdx: index('case_law_type_idx').on(table.caseType),
}));

export const legalDocuments = pgTable('legal_documents', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  firmId: integer('firm_id').notNull(),
  matterId: integer('matter_id'),
  userId: integer('user_id').notNull(),
  documentType: varchar('document_type', { length: 100 }).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  language: varchar('language', { length: 20 }).default('en').notNull(),
  court: varchar('court', { length: 255 }),
  content: text('content'),
  storageUrl: text('storage_url'),
  mimeType: varchar('mime_type', { length: 100 }),
  size: integer('size'),
  version: integer('version').default(1).notNull(),
  status: varchar('status', { length: 50 }).default('draft').notNull(),
  generatedBy: varchar('generated_by', { length: 100 }),
  metadata: jsonb('metadata').default({}).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  firmIdx: index('legal_docs_firm_idx').on(table.firmId),
  matterIdx: index('legal_docs_matter_idx').on(table.matterId),
  typeIdx: index('legal_docs_type_idx').on(table.documentType),
}));

export const researchSessions = pgTable('research_sessions', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().notNull().unique(),
  firmId: integer('firm_id').notNull(),
  userId: integer('user_id').notNull(),
  matterId: integer('matter_id'),
  query: text('query').notNull(),
  searchType: varchar('search_type', { length: 50 }).notNull(),
  filters: jsonb('filters').default({}).notNull(),
  results: jsonb('results').default([]).notNull(),
  agentsUsed: jsonb('agents_used').default([]).notNull(),
  tokensUsed: integer('tokens_used').default(0).notNull(),
  estimatedCost: real('estimated_cost').default(0).notNull(),
  durationMs: integer('duration_ms'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  firmIdx: index('research_firm_idx').on(table.firmId),
  userIdx: index('research_user_idx').on(table.userId),
  createdIdx: index('research_created_idx').on(table.createdAt),
}));

export const limitationTracker = pgTable('limitation_tracker', {
  id: serial('id').primaryKey(),
  matterId: integer('matter_id').notNull(),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  eventDescription: text('event_description'),
  startDate: date('start_date').notNull(),
  limitationPeriod: integer('limitation_period').notNull(),
  limitationUnit: varchar('limitation_unit', { length: 20 }).default('days').notNull(),
  dueDate: date('due_date').notNull(),
  applicableStatute: varchar('applicable_statute', { length: 255 }),
  applicableSection: varchar('applicable_section', { length: 100 }),
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  alertsSent: integer('alerts_sent').default(0).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  matterIdx: index('limitation_matter_idx').on(table.matterId),
  dueDateIdx: index('limitation_due_date_idx').on(table.dueDate),
  statusIdx: index('limitation_status_idx').on(table.status),
}));

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  firmId: integer('firm_id'),
  userId: integer('user_id'),
  action: varchar('action', { length: 100 }).notNull(),
  resource: varchar('resource', { length: 100 }),
  resourceId: varchar('resource_id', { length: 100 }),
  details: jsonb('details').default({}).notNull(),
  ipAddress: varchar('ip_address', { length: 50 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  firmIdx: index('audit_firm_idx').on(table.firmId),
  actionIdx: index('audit_action_idx').on(table.action),
  createdIdx: index('audit_created_idx').on(table.createdAt),
}));

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLawFirmSchema = createInsertSchema(lawFirms).omit({ id: true, createdAt: true, updatedAt: true });
export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMatterSchema = createInsertSchema(matters).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLegalAgentSchema = createInsertSchema(legalAgents).omit({ id: true, createdAt: true, updatedAt: true });
export const insertStatuteSchema = createInsertSchema(statutes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCaseLawSchema = createInsertSchema(caseLaw).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLegalDocumentSchema = createInsertSchema(legalDocuments).omit({ id: true, createdAt: true, updatedAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LawFirm = typeof lawFirms.$inferSelect;
export type InsertLawFirm = z.infer<typeof insertLawFirmSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Matter = typeof matters.$inferSelect;
export type InsertMatter = z.infer<typeof insertMatterSchema>;
export type LegalAgent = typeof legalAgents.$inferSelect;
export type InsertLegalAgent = z.infer<typeof insertLegalAgentSchema>;
export type Statute = typeof statutes.$inferSelect;
export type InsertStatute = z.infer<typeof insertStatuteSchema>;
export type CaseLaw = typeof caseLaw.$inferSelect;
export type InsertCaseLaw = z.infer<typeof insertCaseLawSchema>;
export type LegalDocument = typeof legalDocuments.$inferSelect;
export type InsertLegalDocument = z.infer<typeof insertLegalDocumentSchema>;
