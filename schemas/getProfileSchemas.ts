// @ts-nocheck
import { z } from 'zod';

// This function creates Zod schemas with translated error messages
export const getProfileSchemas = (t: any) => {
  const identitySchema = z.object({
    full_name: z.string().min(2, t.validationErrors.identity.fullNameRequired),
    headline: z.string().min(5, t.validationErrors.identity.headlineRequired),
    summary: z.string().min(1, t.validationErrors.identity.summaryRequired).max(500, t.validationErrors.identity.summaryMax),
    country_code: z.union([
      z.string().min(1, t.validationErrors.identity.countryRequired),
      z.null(),
      z.undefined()
    ]).refine((val) => val != null && val !== '', {
      message: t.validationErrors.identity.countryRequired
    }),
    location: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    linkedin_url: z.string().optional().nullable(),
    github_url: z.string().optional().nullable(),
    portfolio_url: z.string().optional().nullable(),
    remote: z.boolean().optional().nullable(),
    avatar_url: z.string().optional().nullable(),
    gender: z.enum(['male', 'female'], { required_error: t.validationErrors?.identity?.genderRequired || 'Gender is required' }),
  });

  const experienceSchema = z.object({
    id: z.string().optional(),
    position: z.string().min(2, t.validationErrors.experience.positionRequired),
    company_name: z.string().min(2, t.validationErrors.experience.companyRequired),
    start_date: z.string().min(1, t.validationErrors.experience.startDateRequired),
    end_date: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    achievements: z.array(z.string().max(100, 'Máximo 100 caracteres por logro')).nullable().optional(),
    is_current: z.boolean().nullable().optional(),
    location: z.string().nullable().optional(),
    employment_type: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP']).nullable().optional(),
    verified: z.boolean().nullable().optional(),
    sort_order: z.number().nullable().optional(),
  });

  const educationSchema = z.object({
    id: z.string().optional(),
    institution_name: z.string().min(2, t.validationErrors.education.institutionRequired),
    degree: z.string().min(2, t.validationErrors.education.degreeRequired),
    field_of_study: z.string().min(2, t.validationErrors.education.fieldRequired),
    start_date: z.string().min(1, t.validationErrors.education.startDateRequired),
    end_date: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    grade: z.string().nullable().optional(),
    is_current: z.boolean().nullable().optional(),
    verified: z.boolean().nullable().optional(),
    sort_order: z.number().nullable().optional(),
  });

  const skillSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, t.validationErrors.skills.nameRequired),
    level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).optional().nullable(),
    years_of_experience: z.number({ invalid_type_error: t.validationErrors.skills.yearsInvalid }).min(0).max(50, t.validationErrors.skills.yearsMax).optional().nullable(),
    percentage: z.number({ invalid_type_error: t.validationErrors.skills.percentageInvalid }).min(0).max(100, t.validationErrors.skills.percentageMax).optional().nullable(),
    category: z.string().optional().nullable(),
    sort_order: z.number().optional().nullable(),
  }).passthrough();

  const languageSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, t.validationErrors.languages.nameRequired),
    level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'NATIVE', 'Native']),
    percentage: z.number().min(0).max(100).nullable().optional(),
    is_native: z.boolean().nullable().optional(),
    sort_order: z.number().nullable().optional(),
  });

  // Base portfolio fields
  const basePortfolioFields = {
    id: z.string().optional(),
    title: z.string().min(2, t.validationErrors?.portfolio?.titleRequired || 'El título es obligatorio'),
    description: z.string().nullable().optional(),
    image_url: z.string().nullable().optional(),
    sort_order: z.number().nullable().optional(),
  };

  // Project Schema
  const projectSchema = z.object({
    ...basePortfolioFields,
    type: z.literal('PROJECT'),
    url: z.string().min(1, t.validationErrors?.portfolio?.urlRequired || 'El enlace es obligatorio').url(t.validationErrors?.portfolio?.urlInvalid || 'URL inválida'),
    category: z.string().nullable().optional(),
    tags: z.array(z.string()).nullable().optional(),
    featured: z.boolean().nullable().optional(),
  });

  // Certification Schema
  const certificationSchema = z.object({
    ...basePortfolioFields,
    type: z.literal('CERTIFICATION'),
    issuer: z.string().min(2, t.validationErrors?.certification?.issuerRequired || 'El emisor es obligatorio'),
    issue_date: z.string().min(1, t.validationErrors?.certification?.issueDateRequired || 'La fecha de emisión es obligatoria'),
    expiry_date: z.string().nullable().optional(),
    credential_id: z.string().nullable().optional(),
    credential_url: z.string().url(t.validationErrors?.portfolio?.urlInvalid || 'URL inválida').nullable().optional(),
    verified: z.boolean().optional().default(false),
  });

  // Collaboration Schema
  const collaborationSchema = z.object({
    ...basePortfolioFields,
    type: z.literal('COLLABORATION'),
    organization: z.string().min(2, t.validationErrors?.collaboration?.organizationRequired || 'La organización es obligatoria'),
    role: z.string().min(2, t.validationErrors?.collaboration?.roleRequired || 'Tu rol es obligatorio'),
    start_date: z.string().min(1, t.validationErrors?.collaboration?.startDateRequired || 'La fecha de inicio es obligatoria'),
    end_date: z.string().nullable().optional(),
    url: z.string().url(t.validationErrors?.portfolio?.urlInvalid || 'URL inválida').nullable().optional(),
    collaborators: z.array(z.string()).nullable().optional(),
    is_current: z.boolean().nullable().optional(),
  });

  // Union schema for all portfolio types
  const portfolioItemSchema = z.discriminatedUnion('type', [
    projectSchema,
    certificationSchema,
    collaborationSchema,
  ]);

  // Legacy schema for backward compatibility
  const legacyPortfolioItemSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(2, t.validationErrors?.portfolio?.titleRequired || 'El título es obligatorio'),
    description: z.string().nullable().optional(),
    type: z.enum(['PROJECT', 'DESIGN', 'WRITING', 'VIDEO', 'CODE', 'OTHER', 'CERTIFICATION', 'COLLABORATION']).nullable().optional(),
    url: z.string().url(t.validationErrors?.portfolio?.urlInvalid || 'URL inválida').nullable().optional(),
    category: z.string().nullable().optional(),
    image_url: z.string().nullable().optional(),
    sort_order: z.number().nullable().optional(),
    tags: z.array(z.string()).nullable().optional(),
    featured: z.boolean().nullable().optional(),
    // Certification fields
    issuer: z.string().nullable().optional(),
    issue_date: z.string().nullable().optional(),
    expiry_date: z.string().nullable().optional(),
    credential_id: z.string().nullable().optional(),
    credential_url: z.string().nullable().optional(),
    verified: z.boolean().nullable().optional(),
    // Collaboration fields
    organization: z.string().nullable().optional(),
    role: z.string().nullable().optional(),
    start_date: z.string().nullable().optional(),
    end_date: z.string().nullable().optional(),
    collaborators: z.array(z.string()).nullable().optional(),
    is_current: z.boolean().nullable().optional(),
  });

  const preferencesSchema = z.object({
    job_seeking_status: z.enum(['OPEN', 'PASSIVE', 'NOT_LOOKING']).optional(),
    job_type: z.array(z.enum(['full-time', 'part-time', 'contract', 'freelance', 'internship'])).optional(),
    availability: z.enum(['immediate', '2-weeks', '1-month', '2-months', 'not-looking']).optional(),
    salary_min: z.number({ invalid_type_error: t.validationErrors.preferences.salaryInvalid }).min(0).max(1000000, t.validationErrors.preferences.salaryMax).optional(),
    salary_max: z.number({ invalid_type_error: t.validationErrors.preferences.salaryInvalid }).min(0).max(1000000, t.validationErrors.preferences.salaryMax).optional(),
    salary_currency: z.string().optional(),
    remote_preference: z.enum(['remote', 'hybrid', 'on-site', 'flexible']).optional(),
    willing_to_relocate: z.boolean().optional().nullable(),
    preferred_locations: z.array(z.string()).optional().nullable(),
  });

  return {
    identitySchema,
    experienceSchema,
    educationSchema,
    skillSchema,
    languageSchema,
    portfolioItemSchema,
    projectSchema,
    certificationSchema,
    collaborationSchema,
    legacyPortfolioItemSchema,
    preferencesSchema,
  };
};
