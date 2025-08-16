import { 
  serial, 
  text, 
  pgTable, 
  timestamp, 
  numeric, 
  integer, 
  boolean,
  pgEnum,
  date
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const genderEnum = pgEnum('gender', ['LAKI_LAKI', 'PEREMPUAN']);
export const maritalStatusEnum = pgEnum('marital_status', [
  'BELUM_MENIKAH', 
  'MENIKAH', 
  'CERAI_HIDUP', 
  'CERAI_MATI'
]);
export const incomeRangeEnum = pgEnum('income_range', [
  'KURANG_DARI_1JT',
  '1JT_SAMPAI_2JT',
  '2JT_SAMPAI_3JT', 
  '3JT_SAMPAI_5JT',
  'LEBIH_DARI_5JT'
]);
export const assistanceCategoryEnum = pgEnum('assistance_category', [
  'BANTUAN_SOSIAL',
  'BANTUAN_PENDIDIKAN',
  'BANTUAN_KESEHATAN', 
  'BANTUAN_EKONOMI',
  'BANTUAN_BENCANA'
]);
export const applicationStatusEnum = pgEnum('application_status', [
  'SUBMITTED',
  'UNDER_REVIEW',
  'VERIFIED',
  'APPROVED', 
  'REJECTED',
  'COMPLETED'
]);
export const documentTypeEnum = pgEnum('document_type', [
  'KTP',
  'KARTU_KELUARGA',
  'SURAT_KETERANGAN_TIDAK_MAMPU',
  'FOTO_RUMAH',
  'DOKUMEN_TAMBAHAN'
]);

// Social Assistance Applications table
export const socialAssistanceApplicationsTable = pgTable('social_assistance_applications', {
  id: serial('id').primaryKey(),
  tracking_number: text('tracking_number').notNull().unique(),
  // Personal details
  full_name: text('full_name').notNull(),
  nik: text('nik').notNull(),
  place_of_birth: text('place_of_birth').notNull(),
  date_of_birth: date('date_of_birth').notNull(),
  gender: genderEnum('gender').notNull(),
  marital_status: maritalStatusEnum('marital_status').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  address: text('address').notNull(),
  village: text('village').notNull(),
  district: text('district').notNull(),
  // Assistance details
  assistance_category: assistanceCategoryEnum('assistance_category').notNull(),
  assistance_type: text('assistance_type').notNull(),
  reason: text('reason').notNull(),
  family_members_count: integer('family_members_count').notNull(),
  monthly_income_range: incomeRangeEnum('monthly_income_range').notNull(),
  // Status and tracking
  status: applicationStatusEnum('status').notNull().default('SUBMITTED'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Documents table
export const documentsTable = pgTable('documents', {
  id: serial('id').primaryKey(),
  application_id: integer('application_id').notNull().references(() => socialAssistanceApplicationsTable.id),
  document_type: documentTypeEnum('document_type').notNull(),
  file_name: text('file_name').notNull(),
  file_path: text('file_path').notNull(),
  file_size: integer('file_size').notNull(),
  uploaded_at: timestamp('uploaded_at').defaultNow().notNull(),
});

// Status Timeline table
export const statusTimelineTable = pgTable('status_timeline', {
  id: serial('id').primaryKey(),
  application_id: integer('application_id').notNull().references(() => socialAssistanceApplicationsTable.id),
  status: applicationStatusEnum('status').notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Services table for "Layanan Kami"
export const servicesTable = pgTable('services', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  icon: text('icon'),
  is_active: boolean('is_active').notNull().default(true),
  order_index: integer('order_index').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Featured Programs table for "Program Unggulan"
export const featuredProgramsTable = pgTable('featured_programs', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  image_path: text('image_path'),
  target_beneficiaries: text('target_beneficiaries'),
  budget: numeric('budget', { precision: 15, scale: 2 }),
  is_active: boolean('is_active').notNull().default(true),
  order_index: integer('order_index').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// News table for "Berita & Pengumuman"
export const newsTable = pgTable('news', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  summary: text('summary'),
  image_path: text('image_path'),
  is_announcement: boolean('is_announcement').notNull().default(false),
  is_published: boolean('is_published').notNull().default(false),
  published_at: timestamp('published_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const socialAssistanceApplicationsRelations = relations(
  socialAssistanceApplicationsTable,
  ({ many }) => ({
    documents: many(documentsTable),
    timeline: many(statusTimelineTable),
  })
);

export const documentsRelations = relations(documentsTable, ({ one }) => ({
  application: one(socialAssistanceApplicationsTable, {
    fields: [documentsTable.application_id],
    references: [socialAssistanceApplicationsTable.id],
  }),
}));

export const statusTimelineRelations = relations(statusTimelineTable, ({ one }) => ({
  application: one(socialAssistanceApplicationsTable, {
    fields: [statusTimelineTable.application_id],
    references: [socialAssistanceApplicationsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type SocialAssistanceApplication = typeof socialAssistanceApplicationsTable.$inferSelect;
export type NewSocialAssistanceApplication = typeof socialAssistanceApplicationsTable.$inferInsert;

export type Document = typeof documentsTable.$inferSelect;
export type NewDocument = typeof documentsTable.$inferInsert;

export type StatusTimeline = typeof statusTimelineTable.$inferSelect;
export type NewStatusTimeline = typeof statusTimelineTable.$inferInsert;

export type Service = typeof servicesTable.$inferSelect;
export type NewService = typeof servicesTable.$inferInsert;

export type FeaturedProgram = typeof featuredProgramsTable.$inferSelect;
export type NewFeaturedProgram = typeof featuredProgramsTable.$inferInsert;

export type News = typeof newsTable.$inferSelect;
export type NewNews = typeof newsTable.$inferInsert;

// Export all tables for proper query building
export const tables = {
  socialAssistanceApplications: socialAssistanceApplicationsTable,
  documents: documentsTable,
  statusTimeline: statusTimelineTable,
  services: servicesTable,
  featuredPrograms: featuredProgramsTable,
  news: newsTable,
};