import { z } from 'zod';

// Identity Section Schema
export const identitySchema = z.object({
  full_name: z.string().min(2, 'El nombre completo es obligatorio (mínimo 2 caracteres)').max(50, 'El nombre no puede exceder 50 caracteres'),
  gender: z.enum(['male', 'female'], { message: 'Debes seleccionar tu género' }),
  headline: z.string().min(5, 'El título profesional es obligatorio (mínimo 5 caracteres)').max(150, 'El título profesional no puede exceder 150 caracteres'),
  summary: z.string().min(1, 'El resumen "Acerca de mí" es obligatorio').max(800, 'Máximo 800 caracteres'),
  country_code: z.union([
    z.string().min(1, 'Debes seleccionar un país'),
    z.null(),
    z.undefined()
  ]).refine((val) => val != null && val !== '', {
    message: 'Debes seleccionar un país'
  }),
  location: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  linkedin_url: z.string().optional().nullable(),
  github_url: z.string().optional().nullable(),
  portfolio_url: z.string().optional().nullable(),
  remote: z.boolean().optional().nullable(),
  avatar_url: z.string().optional().nullable(),
});

// Experience Schema
export const experienceSchema = z.object({
  id: z.string().optional(),
  position: z.string().min(2, 'Position is required').max(100, 'Maximum 100 characters'),
  company_name: z.string().min(2, 'Company name is required').max(100, 'Maximum 100 characters'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().nullable().optional(),
  description: z.string().max(800, 'Maximum 800 characters').nullable().optional(),
  achievements: z.array(z.string().max(200, 'Maximum 200 characters per achievement')).nullable().optional(),
  is_current: z.boolean().nullable().optional(),
  location: z.string().nullable().optional(),
  employment_type: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP']).nullable().optional(),
  verified: z.boolean().nullable().optional(),
  sort_order: z.number().nullable().optional(),
});

// Education Schema
export const educationSchema = z.object({
  id: z.string().optional(),
  institution_name: z.string().min(2, 'Institution name is required').max(100, 'Maximum 100 characters'),
  degree: z.string().min(2, 'Degree is required').max(100, 'Maximum 100 characters'),
  field_of_study: z.string().min(2, 'Field of study is required').max(100, 'Maximum 100 characters'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().nullable().optional(),
  description: z.string().max(600, 'Maximum 600 characters').nullable().optional(),
  grade: z.string().max(50, 'Maximum 50 characters').nullable().optional(),
  is_current: z.boolean().nullable().optional(),
  verified: z.boolean().nullable().optional(),
  sort_order: z.number().nullable().optional(),
});

// Skill Schema
export const skillSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Skill name is required').max(100, 'Maximum 100 characters'),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).optional().nullable(),
  years_of_experience: z.number().min(0).max(50).optional().nullable(),
  percentage: z.number().min(0).max(100).optional().nullable(),
  category: z.string().max(50, 'Maximum 50 characters').optional().nullable(),
  sort_order: z.number().optional().nullable(),
}).passthrough();

// Language Schema
export const languageSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Language name is required').max(50, 'Maximum 50 characters'),
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'NATIVE']),
  percentage: z.number().min(0).max(100).nullable().optional(),
  is_native: z.boolean().nullable().optional(),
  sort_order: z.number().nullable().optional(),
});

// Portfolio Item Schema - Base fields
const basePortfolioFields = {
  id: z.string().optional(),
  title: z.string().min(2, 'Title is required').max(150, 'Maximum 150 characters'),
  description: z.string().max(500, 'Maximum 500 characters').nullable().optional(),
  image_url: z.string().nullable().optional(),
  sort_order: z.number().nullable().optional(),
};

// Project Schema
export const projectSchema = z.object({
  ...basePortfolioFields,
  type: z.literal('PROJECT'),
  url: z.string().min(1, 'El enlace es obligatorio').url('Debe ser una URL válida (ejemplo: https://ejemplo.com)'),
  category: z.string().max(50, 'Maximum 50 characters').nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  featured: z.boolean().nullable().optional(),
});

// Certification Schema
export const certificationSchema = z.object({
  ...basePortfolioFields,
  type: z.literal('CERTIFICATION'),
  issuer: z.string().min(2, 'El emisor es obligatorio').max(100, 'Maximum 100 characters'), // Ej: "Google", "AWS", "Microsoft"
  issue_date: z.string().min(1, 'La fecha de emisión es obligatoria'),
  expiry_date: z.string().nullable().optional(),
  credential_id: z.string().nullable().optional(),
  credential_url: z.string()
    .nullable()
    .optional()
    .refine(
      (val) => {
        // Empty or null is OK
        if (!val || (typeof val === 'string' && val.trim() === '')) return true;
        // If it has content, MUST be a valid URL
        return /^https?:\/\/.+\..+/.test(val);
      },
      { message: 'Must be a valid URL starting with http:// or https://' }
    )
    .transform((val) => {
      if (!val || (typeof val === 'string' && val.trim() === '')) return null;
      return val;
    }),
  verified: z.boolean().optional().default(false),
});

// Collaboration Schema
export const collaborationSchema = z.object({
  ...basePortfolioFields,
  type: z.literal('COLLABORATION'),
  organization: z.string().min(2, 'La organización es obligatoria').max(100, 'Maximum 100 characters'),
  role: z.string().min(2, 'Tu rol es obligatorio').max(100, 'Maximum 100 characters'),
  start_date: z.string().min(1, 'La fecha de inicio es obligatoria'),
  end_date: z.string().nullable().optional(),
  url: z.string().url('Debe ser una URL válida').nullable().optional(),
  collaborators: z.array(z.string()).nullable().optional(),
  is_current: z.boolean().nullable().optional(),
});

// Union schema for all portfolio item types
export const portfolioItemSchema = z.discriminatedUnion('type', [
  projectSchema,
  certificationSchema,
  collaborationSchema,
]);

// Legacy schema for backward compatibility
export const legacyPortfolioItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2, 'Title is required').max(150, 'Maximum 150 characters'),
  description: z.string().max(500, 'Maximum 500 characters').nullable().optional(),
  type: z.enum(['PROJECT', 'DESIGN', 'WRITING', 'VIDEO', 'CODE', 'OTHER', 'CERTIFICATION', 'COLLABORATION']).nullable().optional(),
  url: z.string()
    .nullable()
    .optional()
    .refine(
      (val) => {
        // Empty or null is OK
        if (!val || (typeof val === 'string' && val.trim() === '')) return true;
        // If it has content, MUST be a valid URL
        return /^https?:\/\/.+\..+/.test(val);
      },
      { message: 'Must be a valid URL starting with http:// or https://' }
    )
    .transform((val) => {
      if (!val || (typeof val === 'string' && val.trim() === '')) return null;
      return val;
    }),
  thumbnail_url: z.string().nullable().optional(),
  file_url: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  featured: z.boolean().nullable().optional(),
  sort_order: z.number().nullable().optional(),
  category: z.string().max(50, 'Maximum 50 characters').nullable().optional(),
  link: z.string()
    .nullable()
    .optional()
    .refine(
      (val) => {
        // Empty or null is OK
        if (!val || (typeof val === 'string' && val.trim() === '')) return true;
        // If it has content, MUST be a valid URL
        return /^https?:\/\/.+\..+/.test(val);
      },
      { message: 'Must be a valid URL starting with http:// or https://' }
    )
    .transform((val) => {
      if (!val || (typeof val === 'string' && val.trim() === '')) return null;
      return val;
    }),
  image_url: z.string().nullable().optional(),
  // Certification fields
  issuer: z.string().max(100, 'Maximum 100 characters').nullable().optional(),
  issue_date: z.string().nullable().optional(),
  expiry_date: z.string().nullable().optional(),
  credential_id: z.string().nullable().optional(),
  credential_url: z.string()
    .nullable()
    .optional()
    .refine(
      (val) => {
        // Empty or null is OK
        if (!val || (typeof val === 'string' && val.trim() === '')) return true;
        // If it has content, MUST be a valid URL
        return /^https?:\/\/.+\..+/.test(val);
      },
      { message: 'Must be a valid URL starting with http:// or https://' }
    )
    .transform((val) => {
      if (!val || (typeof val === 'string' && val.trim() === '')) return null;
      return val;
    }),
  verified: z.boolean().nullable().optional(),
  // Collaboration fields
  organization: z.string().max(100, 'Maximum 100 characters').nullable().optional(),
  role: z.string().max(100, 'Maximum 100 characters').nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  collaborators: z.array(z.string()).nullable().optional(),
  is_current: z.boolean().nullable().optional(),
});

// Preferences Schema
export const preferencesSchema = z.object({
  job_seeking_status: z.enum(['OPEN', 'PASSIVE', 'NOT_LOOKING']).optional(),
  job_type: z.array(z.enum(['full-time', 'part-time', 'contract', 'freelance', 'internship'])).optional(),
  availability: z.enum(['immediate', '2-weeks', '1-month', '2-months', 'not-looking']).optional(),
  salary_min: z.number().min(0).max(1000000, 'El salario mínimo no puede exceder 1,000,000').optional(),
  salary_max: z.number().min(0).max(1000000, 'El salario máximo no puede exceder 1,000,000').optional(),
  salary_currency: z.string().optional(),
  remote_preference: z.enum(['remote', 'hybrid', 'on-site', 'flexible']).optional(),
  willing_to_relocate: z.boolean().optional(),
  preferred_locations: z.array(z.string()).optional(),
});

// Full Profile Schema
export const fullProfileSchema = z.object({
  identity: identitySchema,
  experiences: z.array(experienceSchema).optional(),
  education: z.array(educationSchema).optional(),
  skills: z.array(skillSchema).optional(),
  languages: z.array(languageSchema).optional(),
  portfolio: z.array(portfolioItemSchema).optional(),
  preferences: preferencesSchema.optional(),
});

// Type exports
export type IdentityFormData = z.infer<typeof identitySchema>;
export type ExperienceFormData = z.infer<typeof experienceSchema>;
export type EducationFormData = z.infer<typeof educationSchema>;
export type SkillFormData = z.infer<typeof skillSchema>;
export type LanguageFormData = z.infer<typeof languageSchema>;
export type PortfolioItemFormData = z.infer<typeof portfolioItemSchema>;
export type ProjectFormData = z.infer<typeof projectSchema>;
export type CertificationFormData = z.infer<typeof certificationSchema>;
export type CollaborationFormData = z.infer<typeof collaborationSchema>;
export type LegacyPortfolioItemFormData = z.infer<typeof legacyPortfolioItemSchema>;
export type PreferencesFormData = z.infer<typeof preferencesSchema>;
export type FullProfileFormData = z.infer<typeof fullProfileSchema>;
