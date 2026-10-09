import { useState, useCallback } from 'react';
import { supabase } from '../supabase/client';
import type { Profile, Skill, Stamp } from '../types';
import type { SearchFilters } from './useTalentFilters';
import { sortProfilesByPriority } from '../utils/profileSorting';
import { PUBLIC_PROFILE_COLUMNS } from '../lib/publicProfileColumns';

export interface ProfileWithSkills extends Profile {
  skills?: Skill[];
  experience_years?: number;
  stamps?: Stamp[];
}

/**
 * Limpia un texto del usuario antes de meterlo en un filtro `or=(...)` de
 * PostgREST: comas, paréntesis, comillas y barras romperían (o ampliarían) el
 * filtro. Se sustituyen por espacios.
 */
const sanitizeOrValue = (value: string | undefined | null): string =>
  (value || '').replace(/[,()"\\]/g, ' ').trim();

interface UseTalentSearchOptions {
  resultsPerPage?: number;
  isCompanySearch?: boolean;
}

export const useTalentSearch = (options: UseTalentSearchOptions = {}) => {
  const { resultsPerPage = 20, isCompanySearch = false } = options;

  const [results, setResults] = useState<ProfileWithSkills[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Calculate experience years from experiences table
  const calculateExperienceYears = useCallback((experiences: any[]): number => {
    if (!experiences || experiences.length === 0) return 0;

    const totalMonths = experiences.reduce((acc: number, exp: any) => {
      const start = new Date(exp.start_date);
      const end = exp.is_current ? new Date() : new Date(exp.end_date || new Date());
      const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      return acc + Math.max(0, months);
    }, 0);

    return Math.floor(totalMonths / 12);
  }, []);

  const search = useCallback(async (filters: SearchFilters, page: number = 1) => {
    setLoading(true);
    setError(null);
    setCurrentPage(page);

    try {
      // Build base query - include stamps for priority sorting
      let query = supabase
        .from('profiles')
        // Columnas públicas de profiles (select('*') daría 42501). Los sellos se
        // leen después de la vista public_stamps (stamps no es legible para terceros).
        .select(`
          ${PUBLIC_PROFILE_COLUMNS},
          skills (
            id,
            name,
            level,
            category,
            years_of_experience
          ),
          experiences (
            id,
            start_date,
            end_date,
            is_current
          )
        `, { count: 'exact' })
        // Perfil público = mismo criterio que la RLS de profiles
        // (20261005_proteger_datos_profiles.sql): con slug, no oculto por
        // moderación y no suspendido. `is_public` no existe en la tabla.
        .not('profile_hidden', 'is', true)
        .not('is_active', 'is', false)
        // Exclude profiles without basic information
        .not('full_name', 'is', null)
        .not('headline', 'is', null)
        .neq('full_name', '')
        .neq('headline', '')
        // IMPORTANT: Only show profiles that have completed the wizard and have a slug
        .eq('wizard_completed', true)
        .not('slug', 'is', null)
        .not('template', 'is', null)
        // Exclude admin/staff profiles
        .neq('role', 'admin');

      // Apply keyword search (full-text search on multiple fields)
      // Solo columnas públicas: `bio` y `professional_title` no existen en profiles
      // (el texto libre del perfil está en `summary`).
      const keywords = sanitizeOrValue(filters.keywords);
      if (keywords) {
        query = query.or(`full_name.ilike.%${keywords}%,title.ilike.%${keywords}%,headline.ilike.%${keywords}%,summary.ilike.%${keywords}%`);
      }

      // Apply niche filter
      if (filters.niche) {
        query = query.ilike('headline', `%${filters.niche}%`);
      }

      // Apply profession filter
      if (filters.profession) {
        query = query.ilike('title', `%${filters.profession}%`);
      }

      // Apply specialization filter (searches both title and headline)
      const specialization = sanitizeOrValue(filters.specialization);
      if (specialization) {
        query = query.or(`title.ilike.%${specialization}%,headline.ilike.%${specialization}%`);
      }

      // Apply location filter
      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }

      // Apply job title filter (el cargo público del perfil está en `title`)
      if (filters.jobTitle) {
        query = query.ilike('title', `%${filters.jobTitle}%`);
      }

      // Apply availability filter
      if (filters.availability) {
        query = query.eq('availability', filters.availability);
      }

      // Apply remote preference filter
      if (filters.remotePreference) {
        query = query.eq('remote_preference', filters.remotePreference);
      }

      // Apply pagination
      const from = (page - 1) * resultsPerPage;
      const to = from + resultsPerPage - 1;
      query = query.range(from, to);

      const { data, error: queryError, count } = await query;

      if (queryError) throw queryError;

      const ids = (data || []).map((p: any) => p.id);
      const { data: stampsData } = ids.length
        ? await supabase.from('public_stamps').select('id, profile_id, type, status, verified_at').in('profile_id', ids)
        : { data: [] as any[] };
      const stampsByProfile = new Map<string, any[]>();
      (stampsData || []).forEach((st: any) => {
        if (!stampsByProfile.has(st.profile_id)) stampsByProfile.set(st.profile_id, []);
        stampsByProfile.get(st.profile_id)!.push(st);
      });

      // Process profiles
      let processedProfiles = (data || []).map((row: any) => {
        const profile = { ...row, stamps: stampsByProfile.get(row.id) || [] };
        const experiences = profile.experiences || [];
        const years = calculateExperienceYears(experiences);

        return {
          ...profile,
          experience_years: years,
        };
      });

      // Client-side filtering for skills
      if (filters.skills.length > 0) {
        processedProfiles = processedProfiles.filter((profile: any) => {
          const profileSkills = profile.skills || [];
          return filters.skills.some(skill =>
            profileSkills.some((ps: any) =>
              ps.name?.toLowerCase().includes(skill.toLowerCase())
            )
          );
        });
      }

      // Client-side filtering for languages
      if (filters.languages.length > 0) {
        processedProfiles = processedProfiles.filter((profile: any) => {
          const profileLanguages = profile.languages || [];
          return filters.languages.some(lang =>
            profileLanguages.some((pl: any) =>
              pl.language?.toLowerCase().includes(lang.toLowerCase())
            )
          );
        });
      }

      // Client-side filtering for skill category (public search)
      if (filters.category && filters.category !== 'all') {
        processedProfiles = processedProfiles.filter((profile: any) => {
          const skills = profile.skills || [];
          return skills.some((skill: Skill) => skill.category === filters.category);
        });
      }

      // Client-side filtering for experience level
      if (filters.experienceLevel) {
        processedProfiles = processedProfiles.filter((profile: any) => {
          const totalYears = profile.experience_years || 0;

          if (filters.experienceLevel === 'entry' && totalYears <= 2) return true;
          if (filters.experienceLevel === 'mid' && totalYears > 2 && totalYears <= 5) return true;
          if (filters.experienceLevel === 'senior' && totalYears > 5 && totalYears <= 10) return true;
          if (filters.experienceLevel === 'expert' && totalYears > 10) return true;
          return false;
        });
      }

      // Client-side filtering for education level
      if (filters.educationLevel) {
        processedProfiles = processedProfiles.filter((profile: any) => {
          const education = profile.education || [];
          return education.some((edu: any) =>
            edu.degree?.toLowerCase().includes(filters.educationLevel.toLowerCase())
          );
        });
      }

      // Apply priority sorting: Premium and certified users first
      const sortedProfiles = sortProfilesByPriority(processedProfiles);

      setResults(sortedProfiles as ProfileWithSkills[]);
      setTotalResults(count || 0);
    } catch (err) {
      console.error('Error searching profiles:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while searching');
      setResults([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  }, [resultsPerPage, calculateExperienceYears]);

  const reset = useCallback(() => {
    setResults([]);
    setTotalResults(0);
    setCurrentPage(1);
    setError(null);
  }, []);

  const totalPages = Math.ceil(totalResults / resultsPerPage);

  return {
    results,
    loading,
    error,
    totalResults,
    currentPage,
    totalPages,
    search,
    reset,
  };
};
