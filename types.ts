import React from 'react';

export interface NavItem {
  name: string;
  href: string;
  id?: string;
  isCta?: boolean;
  subItems?: NavItem[];
}

export interface Plan {
  title: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  highlight?: boolean;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface Testimonial {
    quote: string;
    name: string;
    role: string;
    imageUrl: string;
    plan?: string;
}

export interface BlogPost {
  id: number;
  title: string;
  category: string;
  imageUrl: string;
  summary: string;
  authorName: string;
  authorImageUrl: string;
  date: string;
  featured?: boolean;
}

export interface Template {
  id: number;
  title: string;
  category: 'CV' | 'Cover Letter' | 'Email' | 'LinkedIn';
  imageUrl: string;
  industry: string;
  level: string;
  downloads: number;
  rating: number;
}

export interface SuccessStory {
  id: number | string; // Support both number (legacy) and string (UUID from DB)
  name: string;
  imageUrl: string;
  role: string;
  industry: string;
  goal: string;
  headline: string;
  fullStory: string;
  featured?: boolean;
  videoUrl?: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
}

export interface SystemStatusItem {
  name: string;
  status: 'Operational' | 'Degraded' | 'Outage';
}

export type ChangelogChangeType = 'New Feature' | 'Improvement' | 'Bug Fix';

export interface ChangelogChange {
  type: ChangelogChangeType;
  description: string;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: ChangelogChange[];
}

export interface RoadmapItem {
    title: string;
    description: string;
    quarter: string;
}

export interface ValueItem {
    icon: React.ReactNode;
    title: string;
    description: string;
}

export interface MilestoneItem {
    year: string;
    title: string;
    description: string;
}

export interface PressRelease {
  id: number;
  date: string;
  title: string;
  summary: string;
}

export interface Executive {
  name: string;
  title: string;
  imageUrl: string;
  bio: string;
}

export interface MediaCoverage {
    name: string;
    logoUrl: string; 
    articleUrl: string;
}

export interface CompanyFact {
    icon: React.ReactNode;
    value: string;
    label: string;
}

export interface ContactCardItem {
    icon: React.ReactNode;
    title: string;
    description: string;
    email: string;
    ctaText: string;
    ctaLink: string;
    isMailLink?: boolean;
}

// Type definitions for user roles and plans
export type UserRole = 'professional' | 'employer' | 'admin';
export type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'enterprise';
export type RemotePreference = 'REMOTE' | 'HYBRID' | 'ONSITE' | 'FLEXIBLE';
export type JobSeekingStatus = 'OPEN' | 'PASSIVE' | 'NOT_LOOKING';

export interface Profile {
  id: string;
  email?: string | null;
  name?: string | null;
  full_name: string;
  handle?: string | null; // Unique username for public profile URL
  title?: string | null; // Professional title
  headline: string;
  summary: string;
  avatar_url?: string | null;
  role?: UserRole;
  plan?: SubscriptionPlan;
  template?: string | null;
  template_color?: string | null;
  slug?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  business_card_template?: string | null;
  is_pro?: boolean;
  photo_url?: string | null;
  email_verified?: boolean;

  // Contact & Social
  country_code?: string | null;
  location?: string | null;
  phone?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;

  // Job Preferences
  availability?: string | null;
  job_seeking_status?: JobSeekingStatus | null;
  job_type?: string[] | null;
  remote_preference?: RemotePreference | null;
  willing_to_relocate?: boolean | null;
  preferred_locations?: string[] | null;

  // Salary Expectations
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string | null;

  // Personal
  gender?: string | null;

  // Display Settings
  show_verified_credentials?: boolean | null;
  show_connect_links?: boolean | null;
  show_qr_code?: boolean | null;
  show_availability_badge?: boolean | null;

  // Dashboard Tour
  dashboard_tour_completed?: boolean | null;

  // First Login
  first_login_completed?: boolean | null;

  // Wizard Completion
  wizard_completed?: boolean | null;

  // Timestamps
  created_at?: string;
  updated_at?: string;
  last_slug_changed_at?: string | null;
}

// Type definitions for experiences
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'FREELANCE' | 'INTERNSHIP';

export interface Experience {
  id?: string;
  profile_id: string;
  company_name: string;
  company?: string; // Alias for compatibility
  position: string;
  title?: string; // Alias for compatibility
  start_date: string;
  end_date: string | null;
  description?: string | null;
  achievements?: string[] | null; // Array of achievement bullets
  is_current?: boolean;
  location?: string | null;
  employment_type?: EmploymentType | null;
  sort_order?: number;
  verified?: boolean;
  verified_at?: string | null;
  verified_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Education {
  id?: string;
  profile_id: string;
  institution_name: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date: string | null;
  grade?: string | null;
  description?: string | null;
  is_current?: boolean;
  verified?: boolean;
  verified_at?: string | null;
  verified_by?: string | null;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

// Type definitions for skill levels
export type SkillLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

export interface Skill {
  id?: string;
  profile_id: string;
  name: string;
  level?: SkillLevel | null;
  years_of_experience?: number | null;
  percentage?: number | null;
  category?: string | null; // e.g., 'Programming Languages', 'Frameworks', 'Tools'
  endorsed_count?: number;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

// New: Certification interface
export interface Certification {
  id?: string;
  profile_id: string;
  name: string;
  issuer: string;
  issue_date: string;
  expiry_date?: string | null;
  credential_id?: string | null;
  credential_url?: string | null;
  does_not_expire?: boolean;
  verified?: boolean;
  verified_at?: string | null;
  verified_by?: string | null;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

// New: Language interface (CEFR levels)
export type LanguageLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'NATIVE';

export interface Language {
  id?: string;
  profile_id: string;
  name: string;
  level: LanguageLevel;
  is_native?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Service {
  id?: string;
  profile_id: string;
  title: string;
  description: string;
}

export interface Stat {
  id?: string;
  profile_id: string;
  label: string;
  value: string;
}

// Updated: Portfolio Item with type field
export type PortfolioItemType = 'PROJECT' | 'DESIGN' | 'WRITING' | 'VIDEO' | 'CODE' | 'OTHER' | 'CERTIFICATION' | 'COLLABORATION';

export interface PortfolioItem {
  id?: string;
  profile_id: string;
  title: string;
  description?: string | null;
  type?: PortfolioItemType | null;
  url?: string | null;
  thumbnail_url?: string | null;
  file_url?: string | null;
  tags?: string[] | null;
  featured?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;

  // Certification-specific fields (when type = 'CERTIFICATION')
  issuer?: string | null;
  issue_date?: string | null;
  expiry_date?: string | null;
  credential_id?: string | null;
  credential_url?: string | null;
  verified?: boolean | null;

  // Legacy fields (for backward compatibility)
  category?: string;
  link?: string | null;
  image_url?: string | null;
  order?: number;
}

// Updated: Visa (STAR method) with enhanced fields
export interface Visa {
  id?: string;
  profile_id: string;
  slug: string;
  title: string;
  situation?: string | null; // STAR: Situation
  task?: string | null; // STAR: Task
  action?: string | null; // STAR: Action
  result?: string | null; // STAR: Result
  context?: string | null; // Additional context
  metrics?: Record<string, string> | { key: string; value: string }[] | null; // JSON: {revenue: "+30%", users: "1M+"} or array format
  images?: string[] | null; // Array of image URLs
  video_urls?: string[] | null; // Array of video URLs
  tags?: string[] | null; // Searchable tags
  start_date?: string | null;
  end_date?: string | null;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;

  // Legacy fields (for backward compatibility)
  media_urls?: string[];
  results?: string | null;
}

export interface AdminUserView {
  id: string;
  full_name: string | null;
  email: string | null;
  headline: string | null;
  plan: string | null;
  role: string | null;
  created_at: string;
  updated_at: string;
}

// Recommendation/Testimonial interface
export interface Recommendation {
  id?: string;
  profile_id: string; // The profile receiving the recommendation
  recommender_name: string;
  recommender_title: string;
  recommender_company?: string | null;
  recommender_avatar_url?: string | null;
  recommender_linkedin_url?: string | null;
  relationship: string; // e.g., "Manager", "Colleague", "Client", "Professor"
  recommendation_text: string;
  date?: string | null;
  featured?: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface FullProfileData {
    profile: Profile;
    experiences: Experience[];
    education: Education[];
    certifications: Certification[] | PortfolioItem[]; // Can be either Certification[] or filtered PortfolioItem[]
    collaborations?: PortfolioItem[]; // Collaboration type portfolio items
    skills: Skill[];
    languages: Language[];
    services: Service[];
    stats: Stat[];
    portfolio?: PortfolioItem[]; // Templates expect 'portfolio' (projects only)
    portfolioItems?: PortfolioItem[]; // Legacy support
    recommendations?: Recommendation[];
    visas?: Visa[];
    stamps?: Stamp[];
}

export interface CVData {
    fullName: string;
    headline: string;
    summary: string;
    experience: {
        title: string;
        company: string;
        bullets: string[];
    }[];
    education: {
        degree: string;
        institution: string;
    }[];
    skills: Skill[];
    services: Service[];
    stats: Stat[];
    portfolioItems: PortfolioItem[];
}

// ============================================================================
// STAMPS VERIFICATION SYSTEM TYPES
// ============================================================================

export type StampType =
    | 'EMAIL'
    | 'IDENTITY'
    | 'EDUCATION'
    | 'CERTIFICATION'
    | 'EMPLOYMENT'
    | 'SKILL'
    | 'LANGUAGE';

export type StampStatus =
    | 'PENDING'
    | 'VERIFIED'
    | 'REJECTED'
    | 'EXPIRED';

// Evidence structures for different stamp types
export interface EmailStampEvidence {
    email: string;
    verification_code?: string;
}

export interface PhoneStampEvidence {
    phone: string;
    verification_code?: string;
}

export interface IdentityStampEvidence {
    document_type: string; // passport, drivers_license, national_id, etc.
    document_number: string;
    document_url?: string; // URL to uploaded document
    full_name: string;
    date_of_birth?: string;
}

export interface EducationStampEvidence {
    institution: string;
    degree: string;
    field_of_study?: string;
    graduation_date?: string;
    document_url?: string; // diploma/certificate URL
    education_id?: string; // Reference to education table
}

export interface CertificationStampEvidence {
    name: string;
    issuer: string;
    issue_date?: string;
    credential_id?: string;
    credential_url?: string;
    document_url?: string;
    certification_id?: string; // Reference to certifications table
}

export interface EmploymentStampEvidence {
    company: string;
    position: string;
    start_date?: string;
    end_date?: string;
    reference_contact?: string; // Email or phone of reference
    reference_name?: string;
    document_url?: string; // Employment letter, etc.
    experience_id?: string; // Reference to experiences table
}

export interface SkillStampEvidence {
    skill_name: string;
    assessment_type?: string; // test, certification, reference, etc.
    assessment_score?: number;
    assessment_date?: string;
    document_url?: string;
    skill_id?: string; // Reference to skills table
}

export type StampEvidence =
    | EmailStampEvidence
    | PhoneStampEvidence
    | IdentityStampEvidence
    | EducationStampEvidence
    | CertificationStampEvidence
    | EmploymentStampEvidence
    | SkillStampEvidence;

export interface Stamp {
    id: string;
    profile_id: string;
    profiles?: Profile; // Relation
    type: StampType;
    status: StampStatus;
    evidence: StampEvidence;
    provider?: string | null; // Email service, SMS service, manual admin, etc.
    admin_notes?: string | null;
    verified_by?: string | null; // UUID of admin who verified
    created_at: string;
    verified_at?: string | null;
    expires_at?: string | null;
    metadata?: Record<string, any>;
}

export interface StampsSummary {
    profile_id: string;
    verified_count: number;
    pending_count: number;
    rejected_count: number;
    expired_count: number;
    verified_types: StampType[];
    last_verification_date?: string | null;
}

// Helper interface for creating new stamps
export interface CreateStampRequest {
    type: StampType;
    evidence: StampEvidence;
    provider?: string;
}

// ============================================================================
// CV Versions - Multiple CV versions by country/role
// ============================================================================

export type CVSectionType =
  | 'profile'
  | 'experience'
  | 'education'
  | 'skills'
  | 'languages'
  | 'certifications'
  | 'portfolio'
  | 'services'
  | 'stats';

export interface CVVersionExportOptions {
  includePhoto?: boolean;
  includeStamps?: boolean;
  includeSummary?: boolean;
  includeSkills?: boolean;
  includeLanguages?: boolean;
  includeCertifications?: boolean;
  includePortfolio?: boolean;
}

export interface CVVersion {
  id: string;
  profile_id: string;

  // Version identification
  version_name: string;
  country?: string | null;
  role?: string | null;

  // Section configuration
  sections: CVSectionType[];

  // Template and styling
  template?: TemplateType;
  template_color?: string | null;

  // Complete profile snapshot
  snapshot_data: FullProfileData;

  // Export preferences
  export_options?: CVVersionExportOptions;

  // Metadata
  created_by?: string | null;
  created_at: string;
  updated_at?: string | null;
  is_active?: boolean;
  notes?: string | null;
}

// Template type - all available templates
export type TemplateType =
  | 'passport' | 'classic' | 'modern-professional' | 'corporate-classic'
  | 'creative-minimalist' | 'academic-standard' | 'modern-minimalist'
  | 'creative-bold' | 'professional-classic' | 'healthcare-professional'
  | 'minimalist-yellow' | 'gradient-blue' | 'coral-pink' | 'green-minimal'
  | 'creative-orange' | 'classic-sidebar' | 'modern-clean' | 'elegant-minimal'
  | 'professional-blue' | 'creative-modern';

export interface CreateCVVersionRequest {
  version_name: string;
  country?: string;
  role?: string;
  sections: CVSectionType[];
  template?: TemplateType;
  template_color?: string;
  export_options?: CVVersionExportOptions;
  notes?: string;
}

export interface UpdateCVVersionRequest {
  version_name?: string;
  country?: string;
  role?: string;
  sections?: CVSectionType[];
  template?: TemplateType;
  template_color?: string;
  export_options?: CVVersionExportOptions;
  is_active?: boolean;
  notes?: string;
}

export interface CVVersionStats {
  total_versions: number;
  versions_by_country: Record<string, number>;
  versions_by_template: Record<string, number>;
  most_recent_version: string;
}

// Lead & Messaging System Types
export type LeadStatus = 'new' | 'read' | 'replied' | 'archived' | 'deleted';

export interface Lead {
  id: string;
  profile_id: string;
  sender_name: string;
  sender_email: string;
  sender_company?: string;
  sender_phone?: string;
  subject?: string;
  message: string;
  source: string;
  status: LeadStatus;
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  created_at: string;
  updated_at: string;
  read_at?: string;
  replied_at?: string;
  archived_at?: string;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  profile_id: string;
  note: string;
  created_at: string;
  updated_at: string;
}

export interface CreateLeadInput {
  profile_id: string;
  sender_name: string;
  sender_email: string;
  sender_company?: string;
  sender_phone?: string;
  subject?: string;
  message: string;
  source?: string;
  captcha_token?: string;
}

export interface LeadFilters {
  status?: LeadStatus | 'all';
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface LeadWithNotes extends Lead {
  notes?: LeadNote[];
}

// ============================================================================
// COMPANY PANEL TYPES
// ============================================================================

export type CompanyStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type CompanyUserRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
export type CompanySize = '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+';
export type CreditTransactionType =
  | 'PURCHASE'
  | 'ADMIN_ADJUSTMENT'
  | 'REFUND'
  | 'PROFILE_VIEW'
  | 'PROFILE_CONTACT'
  | 'SEARCH_EXPORT'
  | 'PROFILE_UNLOCK';

export interface Company {
  id: string;
  created_at: string;
  updated_at: string;

  // Basic Information
  company_name: string;
  legal_name: string;
  tax_id: string; // CIF/NIF
  company_email: string;
  company_phone?: string | null;
  website_url?: string | null;

  // Address
  address_street?: string | null;
  address_city?: string | null;
  address_state?: string | null;
  address_country?: string | null; // ISO country code
  address_postal?: string | null;

  // Company Details
  industry?: string | null;
  company_size?: CompanySize | null;
  description?: string | null;
  logo_url?: string | null;

  // Verification Documents
  tax_document_url?: string | null;
  verification_document_url?: string | null;

  // Admin Verification
  status: CompanyStatus;
  verified_at?: string | null;
  verified_by?: string | null;
  rejection_reason?: string | null;
  admin_notes?: string | null;

  // Credits
  credit_balance: number;
  total_credits_purchased: number;
  total_credits_used: number;

  // Metadata
  signup_ip?: string | null;
  last_login_at?: string | null;
  metadata?: Record<string, any>;
}

export interface CompanyUser {
  id: string;
  company_id: string;
  user_id: string;
  role: CompanyUserRole;
  invited_by?: string | null;
  invited_at: string;
  accepted_at?: string | null;
  created_at: string;
}

export interface CompanyCreditHistory {
  id: string;
  company_id: string;
  amount: number;
  balance_after: number;
  transaction_type: CreditTransactionType;
  reference_id?: string | null;
  description?: string | null;
  created_by?: string | null;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface CompanyWithUsers extends Company {
  company_users?: CompanyUser[];
}

export interface CreateCompanyInput {
  company_name: string;
  legal_name: string;
  tax_id: string;
  company_email: string;
  company_phone?: string;
  website_url?: string;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_country?: string;
  address_postal?: string;
  industry?: string;
  company_size?: CompanySize;
  description?: string;
  logo_url?: string;
  tax_document_url?: string;
  verification_document_url?: string;
  signup_ip?: string;
}