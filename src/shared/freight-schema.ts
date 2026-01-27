import { sql } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  text,
  integer,
  decimal,
  timestamp,
  boolean,
  jsonb,
  uuid,
  pgEnum
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums for various status fields
export const userRoleEnum = pgEnum('user_role', [
  'admin', 'sales', 'operations', 'finance', 'customer_service', 'customer', 'vendor', 'carrier'
]);

export const inquiryStatusEnum = pgEnum('inquiry_status', [
  'draft', 'submitted', 'quoted', 'converted', 'lost', 'expired'
]);

export const orderStatusEnum = pgEnum('order_status', [
  'pending', 'confirmed', 'in_progress', 'shipped', 'delivered', 'cancelled'
]);

export const shipmentStatusEnum = pgEnum('shipment_status', [
  'booked', 'picked_up', 'in_transit', 'customs_clearance', 'out_for_delivery', 'delivered', 'exception'
]);

export const transportModeEnum = pgEnum('transport_mode', [
  'air', 'sea', 'land', 'rail', 'multimodal'
]);

export const serviceTypeEnum = pgEnum('service_type', [
  'standard', 'express', 'economy', 'premium', 'same_day', 'next_day'
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending', 'paid', 'partial', 'overdue', 'cancelled'
]);

// Core user management tables
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  name: varchar('name', { length: 255 }).notNull(),
  domain: varchar('domain', { length: 100 }).unique(),
  settings: jsonb('settings').default('{}'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  role: userRoleEnum('role').notNull().default('customer'),
  department: varchar('department', { length: 100 }),
  phone: varchar('phone', { length: 50 }),
  isActive: boolean('is_active').default(true),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // customer, vendor, carrier, agent
  taxId: varchar('tax_id', { length: 100 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  website: varchar('website', { length: 255 }),
  address: jsonb('address'), // {street, city, state, country, zipCode}
  contactPerson: varchar('contact_person', { length: 255 }),
  creditLimit: decimal('credit_limit', { precision: 15, scale: 2 }),
  paymentTerms: integer('payment_terms'), // days
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Product and service definitions
export const services = pgTable('services', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  description: text('description'),
  transportMode: transportModeEnum('transport_mode').notNull(),
  serviceType: serviceTypeEnum('service_type').notNull(),
  baseRate: decimal('base_rate', { precision: 10, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('USD'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const routes = pgTable('routes', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  originCode: varchar('origin_code', { length: 10 }).notNull(),
  originName: varchar('origin_name', { length: 255 }).notNull(),
  destinationCode: varchar('destination_code', { length: 10 }).notNull(),
  destinationName: varchar('destination_name', { length: 255 }).notNull(),
  transportMode: transportModeEnum('transport_mode').notNull(),
  transitDays: integer('transit_days'),
  distance: decimal('distance', { precision: 10, scale: 2 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Sales and quotation management
export const inquiries = pgTable('inquiries', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  inquiryNumber: varchar('inquiry_number', { length: 50 }).unique().notNull(),
  customerId: uuid('customer_id').references(() => companies.id).notNull(),
  salesPersonId: uuid('sales_person_id').references(() => users.id),
  status: inquiryStatusEnum('status').default('draft'),
  subject: varchar('subject', { length: 500 }),
  origin: jsonb('origin'), // {code, name, address}
  destination: jsonb('destination'), // {code, name, address}
  cargoDetails: jsonb('cargo_details'), // {description, weight, dimensions, value, hazardous}
  transportMode: transportModeEnum('transport_mode'),
  serviceType: serviceTypeEnum('service_type'),
  expectedPickupDate: timestamp('expected_pickup_date'),
  expectedDeliveryDate: timestamp('expected_delivery_date'),
  specialRequirements: text('special_requirements'),
  customerReference: varchar('customer_reference', { length: 100 }),
  validUntil: timestamp('valid_until'),
  notes: text('notes'),
  attachments: jsonb('attachments').default('[]'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const quotations = pgTable('quotations', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  quotationNumber: varchar('quotation_number', { length: 50 }).unique().notNull(),
  inquiryId: uuid('inquiry_id').references(() => inquiries.id).notNull(),
  customerId: uuid('customer_id').references(() => companies.id).notNull(),
  salesPersonId: uuid('sales_person_id').references(() => users.id),
  status: varchar('status', { length: 50 }).default('draft'),
  routeId: uuid('route_id').references(() => routes.id),
  serviceId: uuid('service_id').references(() => services.id),
  carrierIds: jsonb('carrier_ids').default('[]'), // Array of carrier UUIDs
  totalCost: decimal('total_cost', { precision: 15, scale: 2 }),
  totalSelling: decimal('total_selling', { precision: 15, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('USD'),
  marginPercent: decimal('margin_percent', { precision: 5, scale: 2 }),
  validUntil: timestamp('valid_until'),
  terms: text('terms'),
  notes: text('notes'),
  lineItems: jsonb('line_items').default('[]'), // Detailed cost breakdown
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Order and shipment management
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  orderNumber: varchar('order_number', { length: 50 }).unique().notNull(),
  quotationId: uuid('quotation_id').references(() => quotations.id),
  customerId: uuid('customer_id').references(() => companies.id).notNull(),
  salesPersonId: uuid('sales_person_id').references(() => users.id),
  status: orderStatusEnum('status').default('pending'),
  orderDate: timestamp('order_date').defaultNow(),
  confirmedAt: timestamp('confirmed_at'),
  totalAmount: decimal('total_amount', { precision: 15, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('USD'),
  paymentTerms: integer('payment_terms'),
  customerReference: varchar('customer_reference', { length: 100 }),
  specialInstructions: text('special_instructions'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const shipments = pgTable('shipments', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  shipmentNumber: varchar('shipment_number', { length: 50 }).unique().notNull(),
  orderId: uuid('order_id').references(() => orders.id).notNull(),
  customerId: uuid('customer_id').references(() => companies.id).notNull(),
  status: shipmentStatusEnum('status').default('booked'),
  trackingNumber: varchar('tracking_number', { length: 100 }).unique(),
  masterAWB: varchar('master_awb', { length: 100 }),
  houseAWB: varchar('house_awb', { length: 100 }),
  containerNumber: varchar('container_number', { length: 50 }),
  sealNumber: varchar('seal_number', { length: 50 }),
  routeId: uuid('route_id').references(() => routes.id),
  carrierIds: jsonb('carrier_ids').default('[]'),
  origin: jsonb('origin'),
  destination: jsonb('destination'),
  cargoDetails: jsonb('cargo_details'),
  scheduledPickupDate: timestamp('scheduled_pickup_date'),
  actualPickupDate: timestamp('actual_pickup_date'),
  scheduledDeliveryDate: timestamp('scheduled_delivery_date'),
  actualDeliveryDate: timestamp('actual_delivery_date'),
  currentLocation: jsonb('current_location'),
  trackingHistory: jsonb('tracking_history').default('[]'),
  documents: jsonb('documents').default('[]'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Document management
export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  documentNumber: varchar('document_number', { length: 50 }),
  type: varchar('type', { length: 50 }).notNull(), // BOL, CI, PL, customs, etc.
  shipmentId: uuid('shipment_id').references(() => shipments.id),
  orderId: uuid('order_id').references(() => orders.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  fileName: varchar('file_name', { length: 255 }),
  fileUrl: varchar('file_url', { length: 500 }),
  fileSize: integer('file_size'),
  mimeType: varchar('mime_type', { length: 100 }),
  version: integer('version').default(1),
  isOriginal: boolean('is_original').default(false),
  generatedAt: timestamp('generated_at'),
  approvedAt: timestamp('approved_at'),
  approvedBy: uuid('approved_by').references(() => users.id),
  metadata: jsonb('metadata').default('{}'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Financial management
export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  invoiceNumber: varchar('invoice_number', { length: 50 }).unique().notNull(),
  type: varchar('type', { length: 20 }).notNull(), // sales, purchase
  customerId: uuid('customer_id').references(() => companies.id),
  vendorId: uuid('vendor_id').references(() => companies.id),
  orderId: uuid('order_id').references(() => orders.id),
  shipmentId: uuid('shipment_id').references(() => shipments.id),
  invoiceDate: timestamp('invoice_date').defaultNow(),
  dueDate: timestamp('due_date'),
  subtotal: decimal('subtotal', { precision: 15, scale: 2 }),
  taxAmount: decimal('tax_amount', { precision: 15, scale: 2 }),
  totalAmount: decimal('total_amount', { precision: 15, scale: 2 }),
  paidAmount: decimal('paid_amount', { precision: 15, scale: 2 }).default('0'),
  currency: varchar('currency', { length: 3 }).default('USD'),
  paymentStatus: paymentStatusEnum('payment_status').default('pending'),
  paymentTerms: integer('payment_terms'),
  lineItems: jsonb('line_items').default('[]'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  paymentNumber: varchar('payment_number', { length: 50 }).unique().notNull(),
  invoiceId: uuid('invoice_id').references(() => invoices.id).notNull(),
  paymentDate: timestamp('payment_date').defaultNow(),
  amount: decimal('amount', { precision: 15, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('USD'),
  paymentMethod: varchar('payment_method', { length: 50 }),
  referenceNumber: varchar('reference_number', { length: 100 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Carrier and vendor management
export const carriers = pgTable('carriers', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  companyId: uuid('company_id').references(() => companies.id),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 20 }),
  transportModes: jsonb('transport_modes').default('[]'),
  services: jsonb('services').default('[]'),
  coverage: jsonb('coverage').default('[]'), // Countries/regions covered
  apiEndpoint: varchar('api_endpoint', { length: 500 }),
  apiCredentials: jsonb('api_credentials'),
  rateCards: jsonb('rate_cards').default('[]'),
  performanceMetrics: jsonb('performance_metrics').default('{}'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Analytics and reporting tables
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  userId: uuid('user_id').references(() => users.id),
  entity: varchar('entity', { length: 100 }).notNull(),
  entityId: uuid('entity_id'),
  action: varchar('action', { length: 50 }).notNull(),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  timestamp: timestamp('timestamp').defaultNow()
});

// Define relationships
export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  companies: many(companies),
  services: many(services),
  routes: many(routes),
  inquiries: many(inquiries),
  quotations: many(quotations),
  orders: many(orders),
  shipments: many(shipments),
  documents: many(documents),
  invoices: many(invoices),
  payments: many(payments),
  carriers: many(carriers),
  auditLogs: many(auditLogs)
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id]
  }),
  inquiries: many(inquiries),
  quotations: many(quotations),
  orders: many(orders),
  approvedDocuments: many(documents)
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [companies.tenantId],
    references: [tenants.id]
  }),
  inquiries: many(inquiries),
  quotations: many(quotations),
  orders: many(orders),
  shipments: many(shipments),
  customerInvoices: many(invoices, { relationName: "customerInvoices" }),
  vendorInvoices: many(invoices, { relationName: "vendorInvoices" }),
  carriers: many(carriers)
}));

export const inquiriesRelations = relations(inquiries, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [inquiries.tenantId],
    references: [tenants.id]
  }),
  customer: one(companies, {
    fields: [inquiries.customerId],
    references: [companies.id]
  }),
  salesPerson: one(users, {
    fields: [inquiries.salesPersonId],
    references: [users.id]
  }),
  quotations: many(quotations)
}));

export const quotationsRelations = relations(quotations, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [quotations.tenantId],
    references: [tenants.id]
  }),
  inquiry: one(inquiries, {
    fields: [quotations.inquiryId],
    references: [inquiries.id]
  }),
  customer: one(companies, {
    fields: [quotations.customerId],
    references: [companies.id]
  }),
  salesPerson: one(users, {
    fields: [quotations.salesPersonId],
    references: [users.id]
  }),
  route: one(routes, {
    fields: [quotations.routeId],
    references: [routes.id]
  }),
  service: one(services, {
    fields: [quotations.serviceId],
    references: [services.id]
  }),
  orders: many(orders)
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [orders.tenantId],
    references: [tenants.id]
  }),
  quotation: one(quotations, {
    fields: [orders.quotationId],
    references: [quotations.id]
  }),
  customer: one(companies, {
    fields: [orders.customerId],
    references: [companies.id]
  }),
  salesPerson: one(users, {
    fields: [orders.salesPersonId],
    references: [users.id]
  }),
  shipments: many(shipments),
  invoices: many(invoices)
}));

export const shipmentsRelations = relations(shipments, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [shipments.tenantId],
    references: [tenants.id]
  }),
  order: one(orders, {
    fields: [shipments.orderId],
    references: [orders.id]
  }),
  customer: one(companies, {
    fields: [shipments.customerId],
    references: [companies.id]
  }),
  route: one(routes, {
    fields: [shipments.routeId],
    references: [routes.id]
  }),
  documents: many(documents),
  invoices: many(invoices)
}));

// Export types
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;
export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;
export type Route = typeof routes.$inferSelect;
export type InsertRoute = typeof routes.$inferInsert;
export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = typeof inquiries.$inferInsert;
export type Quotation = typeof quotations.$inferSelect;
export type InsertQuotation = typeof quotations.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
export type Shipment = typeof shipments.$inferSelect;
export type InsertShipment = typeof shipments.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;
export type Carrier = typeof carriers.$inferSelect;
export type InsertCarrier = typeof carriers.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;