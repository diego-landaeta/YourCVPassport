import React from 'react';
import { NavItem, Plan, FaqItem, Testimonial, BlogPost, Template, SuccessStory, SystemStatusItem, ChangelogEntry, RoadmapItem, ValueItem, MilestoneItem, PressRelease, Executive, MediaCoverage, CompanyFact, ContactCardItem } from './types';

// ALL DATA HAS BEEN MOVED TO translations/en.ts and translations/es.ts
// This file is kept to avoid breaking imports in files that are not part of this change,
// but all components have been refactored to use the useTranslations hook instead.

export const NAV_LINKS: NavItem[] = [];
export const PRICING_PLANS: Plan[] = [];
export const FAQ_ITEMS: FaqItem[] = [];
export const STAMPS_FAQ_ITEMS: FaqItem[] = [];
export const TESTIMONIALS: Testimonial[] = [];
export const PRICING_PAGE_TESTIMONIALS: Testimonial[] = [];
export const COMPANY_TESTIMONIALS: Testimonial[] = [];
export const PRICING_PAGE_FAQ_ITEMS: FaqItem[] = [];
export const HELP_CENTER_FAQ_ITEMS: FaqItem[] = [];
export const SEARCH_PROFILE_EXAMPLES = [];
export const ATS_INTEGRATIONS = [];
export const BLOG_CATEGORIES: string[] = [];
export const BLOG_POSTS: BlogPost[] = [];
export const TEMPLATE_CATEGORIES: ('CV' | 'Cover Letter' | 'Email' | 'LinkedIn')[] = ['CV', 'Cover Letter', 'Email', 'LinkedIn'];
export const TEMPLATE_INDUSTRIES: string[] = [];
export const TEMPLATE_LEVELS: string[] = [];
export const TEMPLATES: Template[] = [];
export const STORY_INDUSTRIES: string[] = [];
export const STORY_GOALS: string[] = [];
export const SUCCESS_STORIES: SuccessStory[] = [];
export const SYSTEM_STATUS_ITEMS: SystemStatusItem[] = [];
export const UPTIME_STATS = {};
export const CHANGELOG_ENTRIES: ChangelogEntry[] = [];
export const ROADMAP_ITEMS: RoadmapItem[] = [];
export const CORE_VALUES: ValueItem[] = [];
export const COMPANY_MILESTONES: MilestoneItem[] = [];
export const MISSION_TESTIMONIALS: Testimonial[] = [];
export const PRESS_RELEASES: PressRelease[] = [];
export const COMPANY_FACTS: CompanyFact[] = [];
export const EXECUTIVES: Executive[] = [];
export const MEDIA_COVERAGE: MediaCoverage[] = [];
export const CONTACT_CARDS: ContactCardItem[] = [];
export const CONTACT_PAGE_FAQ_ITEMS: FaqItem[] = [];
