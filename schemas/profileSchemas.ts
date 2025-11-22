import { z } from 'zod';

// Identity Section Schema
export const identitySchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  headline: z.string().min(5, 'Headline must be at least 5 characters'),
  summary: z.string().optional(),
  country_code: z.string().optional(),
  location: z.string().optional(),
  phone: z.string().optional(),
  linkedin_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  github_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  portfolio_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  remote: z.boolean().optional(),
  avatar_url: z.string().optional(),
});

// Experience Schema
export const experienceSchema = z.object({
  id: z.string().optional(),
  position: z.string().min(2, 'Position is required'),
  company_name: z.string().min(2, 'Company name is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().nullable(),
  description: z.string().optional(),
  achievements: z.array(z.string()).optional(),
  is_current: z.boolean().optional(),
  location: z.string().optional(),
  employment_type: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP']).optional(),
  sort_order: z.number().optional(),
});

// Education Schema
export const educationSchema = z.object({
  id: z.string().optional(),
  institution_name: z.string().min(2, 'Institution name is required'),
  degree: z.string().min(2, 'Degree is required'),
  field_of_study: z.string().min(2, 'Field of study is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().nullable(),
  description: z.string().optional(),
  grade: z.string().optional(),
  is_current: z.boolean().optional(),
  verified: z.boolean().optional(),
  sort_order: z.number().optional(),
});

// Skill Schema
export const skillSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Skill name is required'),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).optional(),
  years_of_experience: z.number().min(0).max(50).optional(),
  percentage: z.number().min(0).max(100).optional(),
  category: z.string().optional(),
  sort_order: z.number().optional(),
});

// Language Schema
export const languageSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Language name is required'),
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'NATIVE']),
  is_native: z.boolean().optional(),
  sort_order: z.number().optional(),
});

// Portfolio Item Schema
export const portfolioItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(2, 'Title is required'),
  description: z.string().optional(),
  type: z.enum(['PROJECT', 'DESIGN', 'WRITING', 'VIDEO', 'CODE', 'OTHER']).optional(),
  url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  thumbnail_url: z.string().optional(),
  file_url: z.string().optional(),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  sort_order: z.number().optional(),
});

// Preferences Schema
export const preferencesSchema = z.object({
  job_type: z.array(z.enum(['full-time', 'part-time', 'contract', 'freelance', 'internship'])).optional(),
  availability: z.enum(['immediate', '2-weeks', '1-month', '2-months', 'not-looking']).optional(),
  salary_min: z.number().min(0).optional(),
  salary_max: z.number().min(0).optional(),
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
export type PreferencesFormData = z.infer<typeof preferencesSchema>;
export type FullProfileFormData = z.infer<typeof fullProfileSchema>;
