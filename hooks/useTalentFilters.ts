import { useState, useCallback } from 'react';

export interface SearchFilters {
  keywords: string;
  niche: string;
  profession: string;
  specialization: string;
  location: string;
  jobTitle: string;
  skills: string[];
  languages: string[];
  experienceLevel: string;
  educationLevel: string;
  availability: string;
  remotePreference: string;
  minYearsExperience: number;
  maxYearsExperience: number;
  category?: string; // For skill category filtering (public search)
}

export const initialFilters: SearchFilters = {
  keywords: '',
  niche: '',
  profession: '',
  specialization: '',
  location: '',
  jobTitle: '',
  skills: [],
  languages: [],
  experienceLevel: '',
  educationLevel: '',
  availability: '',
  remotePreference: '',
  minYearsExperience: 0,
  maxYearsExperience: 50,
  category: 'all',
};

export const useTalentFilters = () => {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);

  const updateFilter = useCallback((key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateFilters = useCallback((updates: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  const addSkill = useCallback((skill: string) => {
    if (skill.trim() && !filters.skills.includes(skill.trim())) {
      setFilters(prev => ({
        ...prev,
        skills: [...prev.skills, skill.trim()]
      }));
    }
  }, [filters.skills]);

  const removeSkill = useCallback((skill: string) => {
    setFilters(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  }, []);

  const addLanguage = useCallback((language: string) => {
    if (language.trim() && !filters.languages.includes(language.trim())) {
      setFilters(prev => ({
        ...prev,
        languages: [...prev.languages, language.trim()]
      }));
    }
  }, [filters.languages]);

  const removeLanguage = useCallback((language: string) => {
    setFilters(prev => ({
      ...prev,
      languages: prev.languages.filter(l => l !== language)
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const hasActiveFilters = useCallback(() => {
    return (
      filters.keywords !== '' ||
      filters.niche !== '' ||
      filters.profession !== '' ||
      filters.specialization !== '' ||
      filters.location !== '' ||
      filters.jobTitle !== '' ||
      filters.skills.length > 0 ||
      filters.languages.length > 0 ||
      filters.experienceLevel !== '' ||
      filters.educationLevel !== '' ||
      filters.availability !== '' ||
      filters.remotePreference !== '' ||
      (filters.category && filters.category !== 'all')
    );
  }, [filters]);

  const activeFilterCount = useCallback(() => {
    let count = 0;
    if (filters.keywords) count++;
    if (filters.niche) count++;
    if (filters.profession) count++;
    if (filters.specialization) count++;
    if (filters.location) count++;
    if (filters.jobTitle) count++;
    if (filters.experienceLevel) count++;
    if (filters.educationLevel) count++;
    if (filters.availability) count++;
    if (filters.remotePreference) count++;
    if (filters.category && filters.category !== 'all') count++;
    count += filters.skills.length;
    count += filters.languages.length;
    return count;
  }, [filters]);

  return {
    filters,
    setFilters,
    updateFilter,
    updateFilters,
    addSkill,
    removeSkill,
    addLanguage,
    removeLanguage,
    clearFilters,
    hasActiveFilters,
    activeFilterCount,
  };
};
