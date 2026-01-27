import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import type { SearchFilters } from '../../hooks/useTalentFilters';
import type { CategoryCount } from './types';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  MapPinIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  LanguageIcon,
  ClockIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

interface TalentSearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch: () => void;
  onClearFilters: () => void;
  onAddSkill: (skill: string) => void;
  onRemoveSkill: (skill: string) => void;
  onAddLanguage: (language: string) => void;
  onRemoveLanguage: (language: string) => void;
  showAdvanced?: boolean;
  companyMode?: boolean;
  availableOptions?: {
    niches?: string[];
    professions?: string[];
    specializations?: string[];
    locations?: string[];
    skillCategories?: CategoryCount[];
  };
  activeFilterCount: number;
}

const TalentSearchFilters: React.FC<TalentSearchFiltersProps> = ({
  filters,
  onFiltersChange,
  onSearch,
  onClearFilters,
  onAddSkill,
  onRemoveSkill,
  onAddLanguage,
  onRemoveLanguage,
  showAdvanced = false,
  companyMode = false,
  availableOptions = {},
  activeFilterCount,
}) => {
  const { lang } = useLanguage();
  const [showFiltersPanel, setShowFiltersPanel] = useState(showAdvanced);
  const [skillInput, setSkillInput] = useState('');
  const [languageInput, setLanguageInput] = useState('');

  const translations = {
    en: {
      searchPlaceholder: companyMode
        ? 'Keywords, skills, job titles...'
        : 'Search by name, title, or skills...',
      filters: 'Filters',
      search: 'Search',
      clearAll: 'Clear all filters',
      category: 'Skill Category',
      allCategories: 'All Categories',
      niche: 'Niche',
      allNiches: 'All niches',
      profession: 'Profession',
      allProfessions: 'All professions',
      specialization: 'Specialization',
      allSpecializations: 'All specializations',
      location: 'Location',
      locationPlaceholder: 'City, country...',
      allLocations: 'All Locations',
      jobTitle: 'Job Title',
      jobTitlePlaceholder: 'e.g., Software Engineer',
      skills: 'Skills',
      skillsPlaceholder: 'Add a skill...',
      languages: 'Languages',
      languagesPlaceholder: 'Add a language...',
      experienceLevel: 'Experience Level',
      all: 'All',
      entry: 'Entry (0-2 years)',
      mid: 'Mid (2-5 years)',
      senior: 'Senior (5-10 years)',
      expert: 'Expert (10+ years)',
      educationLevel: 'Education Level',
      bachelor: "Bachelor's Degree",
      master: "Master's Degree",
      phd: 'PhD',
      diploma: 'Diploma',
      availability: 'Availability',
      immediate: 'Immediate',
      twoWeeks: '2 weeks',
      oneMonth: '1 month',
      negotiable: 'Negotiable',
      workMode: 'Work Mode',
      remoteOnly: 'Remote only',
      hybrid: 'Hybrid',
      onSite: 'On-site',
      flexible: 'Flexible',
      allModes: 'All Work Modes',
      add: 'Add',
      remote: {
        REMOTE: 'Remote',
        HYBRID: 'Hybrid',
        ONSITE: 'On-site',
        FLEXIBLE: 'Flexible',
      },
    },
    es: {
      searchPlaceholder: companyMode
        ? 'Palabras clave, habilidades, títulos...'
        : 'Buscar por nombre, título o habilidades...',
      filters: 'Filtros',
      search: 'Buscar',
      clearAll: 'Limpiar todos los filtros',
      category: 'Categoría de Habilidad',
      allCategories: 'Todas las Categorías',
      niche: 'Nicho',
      allNiches: 'Todos los nichos',
      profession: 'Profesión',
      allProfessions: 'Todas las profesiones',
      specialization: 'Especialización',
      allSpecializations: 'Todas las especializaciones',
      location: 'Ubicación',
      locationPlaceholder: 'Ciudad, país...',
      allLocations: 'Todas las Ubicaciones',
      jobTitle: 'Título del Trabajo',
      jobTitlePlaceholder: 'ej., Ingeniero de Software',
      skills: 'Habilidades',
      skillsPlaceholder: 'Agregar habilidad...',
      languages: 'Idiomas',
      languagesPlaceholder: 'Agregar idioma...',
      experienceLevel: 'Nivel de Experiencia',
      all: 'Todos',
      entry: 'Junior (0-2 años)',
      mid: 'Intermedio (2-5 años)',
      senior: 'Senior (5-10 años)',
      expert: 'Experto (10+ años)',
      educationLevel: 'Nivel de Educación',
      bachelor: 'Licenciatura',
      master: 'Maestría',
      phd: 'Doctorado',
      diploma: 'Diplomado',
      availability: 'Disponibilidad',
      immediate: 'Inmediata',
      twoWeeks: '2 semanas',
      oneMonth: '1 mes',
      negotiable: 'Negociable',
      workMode: 'Modalidad de Trabajo',
      remoteOnly: 'Solo remoto',
      hybrid: 'Híbrido',
      onSite: 'Presencial',
      flexible: 'Flexible',
      allModes: 'Todas las Modalidades',
      add: 'Agregar',
      remote: {
        REMOTE: 'Remoto',
        HYBRID: 'Híbrido',
        ONSITE: 'Presencial',
        FLEXIBLE: 'Flexible',
      },
    },
  };

  const t = translations[lang as keyof typeof translations];

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      action();
    }
  };

  const handleAddSkill = () => {
    if (skillInput.trim()) {
      onAddSkill(skillInput);
      setSkillInput('');
    }
  };

  const handleAddLanguage = () => {
    if (languageInput.trim()) {
      onAddLanguage(languageInput);
      setLanguageInput('');
    }
  };

  return (
    <div className="bg-white dark:bg-dark-bg-secondary shadow-lg dark:shadow-2xl rounded-lg border border-gray-200 dark:border-dark-border p-6 mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-dark-text-tertiary" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={filters.keywords}
              onChange={(e) => onFiltersChange({ ...filters, keywords: e.target.value })}
              className="block w-full pl-10 pr-3 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onKeyPress={(e) => handleKeyPress(e, onSearch)}
            />
          </div>
        </div>

        {/* Filter Toggle Button */}
        <button
          onClick={() => setShowFiltersPanel(!showFiltersPanel)}
          className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
        >
          <FunnelIcon className="h-5 w-5" />
          {t.filters}
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-600 text-white text-xs rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Search Button */}
        <button
          onClick={onSearch}
          className="px-8 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-semibold"
        >
          {t.search}
        </button>
      </div>

      {/* Advanced Filters Panel */}
      {showFiltersPanel && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-dark-border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Category Filter (Public mode) */}
            {!companyMode && availableOptions.skillCategories && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  {t.category}
                </label>
                <select
                  value={filters.category || 'all'}
                  onChange={(e) => onFiltersChange({ ...filters, category: e.target.value })}
                  className="block w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">{t.allCategories}</option>
                  {availableOptions.skillCategories.map((cat) => (
                    <option key={cat.category} value={cat.category}>
                      {cat.category} ({cat.count})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Niche (Company mode) */}
            {companyMode && availableOptions.niches && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  {t.niche}
                </label>
                <select
                  value={filters.niche}
                  onChange={(e) => onFiltersChange({ ...filters, niche: e.target.value })}
                  className="block w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{t.allNiches}</option>
                  {availableOptions.niches.map((niche) => (
                    <option key={niche} value={niche}>{niche}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Profession (Company mode) */}
            {companyMode && availableOptions.professions && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  {t.profession}
                </label>
                <select
                  value={filters.profession}
                  onChange={(e) => onFiltersChange({ ...filters, profession: e.target.value })}
                  className="block w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{t.allProfessions}</option>
                  {availableOptions.professions.map((profession) => (
                    <option key={profession} value={profession}>{profession}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                <MapPinIcon className="inline h-4 w-4 mr-1" />
                {t.location}
              </label>
              {availableOptions.locations && availableOptions.locations.length > 0 ? (
                <select
                  value={filters.location}
                  onChange={(e) => onFiltersChange({ ...filters, location: e.target.value })}
                  className="block w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{t.allLocations}</option>
                  {availableOptions.locations.map((location) => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => onFiltersChange({ ...filters, location: e.target.value })}
                  placeholder={t.locationPlaceholder}
                  className="block w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              )}
            </div>

            {/* Job Title (Company mode) */}
            {companyMode && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  <BriefcaseIcon className="inline h-4 w-4 mr-1" />
                  {t.jobTitle}
                </label>
                <input
                  type="text"
                  value={filters.jobTitle}
                  onChange={(e) => onFiltersChange({ ...filters, jobTitle: e.target.value })}
                  placeholder={t.jobTitlePlaceholder}
                  className="block w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            {/* Remote Preference */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                <BuildingOfficeIcon className="inline h-4 w-4 mr-1" />
                {t.workMode}
              </label>
              <select
                value={filters.remotePreference}
                onChange={(e) => onFiltersChange({ ...filters, remotePreference: e.target.value })}
                className="block w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">{t.allModes}</option>
                <option value="REMOTE">{t.remote.REMOTE}</option>
                <option value="HYBRID">{t.remote.HYBRID}</option>
                <option value="ONSITE">{t.remote.ONSITE}</option>
                <option value="FLEXIBLE">{t.remote.FLEXIBLE}</option>
              </select>
            </div>

            {/* Experience Level (Company mode) */}
            {companyMode && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  {t.experienceLevel}
                </label>
                <select
                  value={filters.experienceLevel}
                  onChange={(e) => onFiltersChange({ ...filters, experienceLevel: e.target.value })}
                  className="block w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{t.all}</option>
                  <option value="entry">{t.entry}</option>
                  <option value="mid">{t.mid}</option>
                  <option value="senior">{t.senior}</option>
                  <option value="expert">{t.expert}</option>
                </select>
              </div>
            )}

            {/* Education Level (Company mode) */}
            {companyMode && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  <AcademicCapIcon className="inline h-4 w-4 mr-1" />
                  {t.educationLevel}
                </label>
                <select
                  value={filters.educationLevel}
                  onChange={(e) => onFiltersChange({ ...filters, educationLevel: e.target.value })}
                  className="block w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">{t.all}</option>
                  <option value="bachelor">{t.bachelor}</option>
                  <option value="master">{t.master}</option>
                  <option value="phd">{t.phd}</option>
                  <option value="diploma">{t.diploma}</option>
                </select>
              </div>
            )}

            {/* Availability */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                <ClockIcon className="inline h-4 w-4 mr-1" />
                {t.availability}
              </label>
              <select
                value={filters.availability}
                onChange={(e) => onFiltersChange({ ...filters, availability: e.target.value })}
                className="block w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">{t.all}</option>
                <option value="immediate">{t.immediate}</option>
                <option value="2-weeks">{t.twoWeeks}</option>
                <option value="1-month">{t.oneMonth}</option>
                <option value="negotiable">{t.negotiable}</option>
              </select>
            </div>

            {/* Skills (Company mode) */}
            {companyMode && (
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  {t.skills}
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, handleAddSkill)}
                    placeholder={t.skillsPlaceholder}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={handleAddSkill}
                    className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                  >
                    {t.add}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {filters.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400"
                    >
                      {skill}
                      <button
                        onClick={() => onRemoveSkill(skill)}
                        className="ml-2 hover:text-blue-600 dark:hover:text-blue-300"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Languages (Company mode) */}
            {companyMode && (
              <div className="md:col-span-2 lg:col-span-1">
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  <LanguageIcon className="inline h-4 w-4 mr-1" />
                  {t.languages}
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={languageInput}
                    onChange={(e) => setLanguageInput(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, handleAddLanguage)}
                    placeholder={t.languagesPlaceholder}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={handleAddLanguage}
                    className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                  >
                    {t.add}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {filters.languages.map((language) => (
                    <span
                      key={language}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400"
                    >
                      {language}
                      <button
                        onClick={() => onRemoveLanguage(language)}
                        className="ml-2 hover:text-purple-600 dark:hover:text-purple-300"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Filter Actions */}
          <div className="flex justify-end items-center mt-6 pt-4 border-t border-gray-200 dark:border-dark-border">
            <button
              onClick={onClearFilters}
              className="text-sm text-gray-600 dark:text-dark-text-secondary hover:text-gray-900 dark:hover:text-dark-text-primary"
            >
              {t.clearAll}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TalentSearchFilters;
