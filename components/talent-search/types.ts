import type { Profile, Skill } from '../../types';

export interface ProfileWithSkills extends Profile {
  skills?: Skill[];
  experience_years?: number;
  profile_photo_url?: string;
  professional_title?: string;
  bio?: string;
  work_experience?: any[];
  education?: any[];
  languages?: any[];
}

export interface CategoryCount {
  category: string;
  count: number;
}

export interface FilterOptions {
  niches: string[];
  professions: string[];
  specializations: string[];
  locations: string[];
  skillCategories: CategoryCount[];
}

export type SearchMode = 'public' | 'admin' | 'company';

export interface TalentSearchPageProps {
  mode?: SearchMode;
  adminMode?: boolean;
  showAdminControls?: boolean;
}
