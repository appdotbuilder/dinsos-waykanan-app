import { z } from 'zod';

// Enum schemas
export const genderSchema = z.enum(['LAKI_LAKI', 'PEREMPUAN']);
export type Gender = z.infer<typeof genderSchema>;

export const maritalStatusSchema = z.enum(['BELUM_MENIKAH', 'MENIKAH', 'CERAI_HIDUP', 'CERAI_MATI']);
export type MaritalStatus = z.infer<typeof maritalStatusSchema>;

export const incomeRangeSchema = z.enum([
  'KURANG_DARI_1JT', 
  '1JT_SAMPAI_2JT', 
  '2JT_SAMPAI_3JT', 
  '3JT_SAMPAI_5JT', 
  'LEBIH_DARI_5JT'
]);
export type IncomeRange = z.infer<typeof incomeRangeSchema>;

export const assistanceCategorySchema = z.enum([
  'BANTUAN_SOSIAL',
  'BANTUAN_PENDIDIKAN', 
  'BANTUAN_KESEHATAN',
  'BANTUAN_EKONOMI',
  'BANTUAN_BENCANA'
]);
export type AssistanceCategory = z.infer<typeof assistanceCategorySchema>;

export const applicationStatusSchema = z.enum([
  'SUBMITTED',
  'UNDER_REVIEW',
  'VERIFIED',
  'APPROVED',
  'REJECTED',
  'COMPLETED'
]);
export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;

export const documentTypeSchema = z.enum([
  'KTP',
  'KARTU_KELUARGA',
  'SURAT_KETERANGAN_TIDAK_MAMPU',
  'FOTO_RUMAH',
  'DOKUMEN_TAMBAHAN'
]);
export type DocumentType = z.infer<typeof documentTypeSchema>;

// Social Assistance Application schema
export const socialAssistanceApplicationSchema = z.object({
  id: z.number(),
  tracking_number: z.string(),
  // Personal details
  full_name: z.string(),
  nik: z.string(),
  place_of_birth: z.string(),
  date_of_birth: z.coerce.date(),
  gender: genderSchema,
  marital_status: maritalStatusSchema,
  phone: z.string(),
  email: z.string().email(),
  address: z.string(),
  village: z.string(),
  district: z.string(),
  // Assistance details
  assistance_category: assistanceCategorySchema,
  assistance_type: z.string(),
  reason: z.string(),
  family_members_count: z.number().int().positive(),
  monthly_income_range: incomeRangeSchema,
  // Status and tracking
  status: applicationStatusSchema,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type SocialAssistanceApplication = z.infer<typeof socialAssistanceApplicationSchema>;

// Input schema for creating applications
export const createApplicationInputSchema = z.object({
  // Personal details
  full_name: z.string().min(1),
  nik: z.string().length(16), // NIK is always 16 digits
  place_of_birth: z.string().min(1),
  date_of_birth: z.coerce.date(),
  gender: genderSchema,
  marital_status: maritalStatusSchema,
  phone: z.string().min(1),
  email: z.string().email(),
  address: z.string().min(1),
  village: z.string().min(1),
  district: z.string().min(1),
  // Assistance details
  assistance_category: assistanceCategorySchema,
  assistance_type: z.string().min(1),
  reason: z.string().min(1),
  family_members_count: z.number().int().positive(),
  monthly_income_range: incomeRangeSchema
});

export type CreateApplicationInput = z.infer<typeof createApplicationInputSchema>;

// Input schema for tracking applications
export const trackApplicationInputSchema = z.object({
  tracking_number: z.string().min(1),
  nik: z.string().length(16)
});

export type TrackApplicationInput = z.infer<typeof trackApplicationInputSchema>;

// Input schema for updating application status
export const updateApplicationStatusInputSchema = z.object({
  id: z.number(),
  status: applicationStatusSchema
});

export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusInputSchema>;

// Document schema
export const documentSchema = z.object({
  id: z.number(),
  application_id: z.number(),
  document_type: documentTypeSchema,
  file_name: z.string(),
  file_path: z.string(),
  file_size: z.number().int().positive(),
  uploaded_at: z.coerce.date()
});

export type Document = z.infer<typeof documentSchema>;

// Input schema for uploading documents
export const uploadDocumentInputSchema = z.object({
  application_id: z.number(),
  document_type: documentTypeSchema,
  file_name: z.string().min(1),
  file_path: z.string().min(1),
  file_size: z.number().int().positive()
});

export type UploadDocumentInput = z.infer<typeof uploadDocumentInputSchema>;

// Status timeline schema
export const statusTimelineSchema = z.object({
  id: z.number(),
  application_id: z.number(),
  status: applicationStatusSchema,
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});

export type StatusTimeline = z.infer<typeof statusTimelineSchema>;

// Input schema for adding status timeline entry
export const addStatusTimelineInputSchema = z.object({
  application_id: z.number(),
  status: applicationStatusSchema,
  notes: z.string().nullable()
});

export type AddStatusTimelineInput = z.infer<typeof addStatusTimelineInputSchema>;

// Service schema for "Layanan Kami"
export const serviceSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  icon: z.string().nullable(),
  is_active: z.boolean(),
  order_index: z.number().int(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Service = z.infer<typeof serviceSchema>;

// Input schema for creating/updating services
export const createServiceInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  icon: z.string().nullable(),
  is_active: z.boolean().default(true),
  order_index: z.number().int().default(0)
});

export type CreateServiceInput = z.infer<typeof createServiceInputSchema>;

export const updateServiceInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  icon: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  order_index: z.number().int().optional()
});

export type UpdateServiceInput = z.infer<typeof updateServiceInputSchema>;

// Featured Program schema for "Program Unggulan"
export const featuredProgramSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  image_path: z.string().nullable(),
  target_beneficiaries: z.string().nullable(),
  budget: z.number().nullable(),
  is_active: z.boolean(),
  order_index: z.number().int(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type FeaturedProgram = z.infer<typeof featuredProgramSchema>;

// Input schema for creating/updating featured programs
export const createFeaturedProgramInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  image_path: z.string().nullable(),
  target_beneficiaries: z.string().nullable(),
  budget: z.number().positive().nullable(),
  is_active: z.boolean().default(true),
  order_index: z.number().int().default(0)
});

export type CreateFeaturedProgramInput = z.infer<typeof createFeaturedProgramInputSchema>;

export const updateFeaturedProgramInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  image_path: z.string().nullable().optional(),
  target_beneficiaries: z.string().nullable().optional(),
  budget: z.number().positive().nullable().optional(),
  is_active: z.boolean().optional(),
  order_index: z.number().int().optional()
});

export type UpdateFeaturedProgramInput = z.infer<typeof updateFeaturedProgramInputSchema>;

// News schema for "Berita & Pengumuman"
export const newsSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  summary: z.string().nullable(),
  image_path: z.string().nullable(),
  is_announcement: z.boolean(),
  is_published: z.boolean(),
  published_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type News = z.infer<typeof newsSchema>;

// Input schema for creating/updating news
export const createNewsInputSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  summary: z.string().nullable(),
  image_path: z.string().nullable(),
  is_announcement: z.boolean().default(false),
  is_published: z.boolean().default(false)
});

export type CreateNewsInput = z.infer<typeof createNewsInputSchema>;

export const updateNewsInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  summary: z.string().nullable().optional(),
  image_path: z.string().nullable().optional(),
  is_announcement: z.boolean().optional(),
  is_published: z.boolean().optional()
});

export type UpdateNewsInput = z.infer<typeof updateNewsInputSchema>;

// Application tracking response schema
export const applicationTrackingResponseSchema = z.object({
  application: socialAssistanceApplicationSchema,
  documents: z.array(documentSchema),
  timeline: z.array(statusTimelineSchema)
});

export type ApplicationTrackingResponse = z.infer<typeof applicationTrackingResponseSchema>;