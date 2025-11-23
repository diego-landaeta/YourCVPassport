import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslations } from '../hooks/useTranslations';
import { supabase } from '../supabase/client';
import { templates } from './templates/templateData';
import AlertModal from './AlertModal';
import { useCustomDialog } from '../hooks/useCustomDialog';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  SparklesIcon,
  CheckCircleIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/solid';

interface AIQuestionnaireAssistantProps {
  onComplete?: () => void;
}

export default function AIQuestionnaireAssistantNew({ onComplete }: AIQuestionnaireAssistantProps) {
  const { user, profile, refetchProfile } = useAuth();
  const { lang } = useLanguage();
  const t = useTranslations();
  const q = t.aiQuestionnaire;

  // Definición de secciones del cuestionario usando traducciones
  const SECTIONS = [
    { id: 'identity', name: q.sections.identity.name, icon: q.sections.identity.icon },
    { id: 'experience', name: q.sections.experience.name, icon: q.sections.experience.icon },
    { id: 'education', name: q.sections.education.name, icon: q.sections.education.icon },
    { id: 'skills', name: q.sections.skills.name, icon: q.sections.skills.icon },
    { id: 'languages', name: q.sections.languages.name, icon: q.sections.languages.icon },
    { id: 'preferences', name: q.sections.preferences.name, icon: q.sections.preferences.icon },
    { id: 'template', name: q.sections.template.name, icon: q.sections.template.icon },
  ];

  const [currentSection, setCurrentSection] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isCorrectingText, setIsCorrectingText] = useState(false);
  const [selectedExpIndex, setSelectedExpIndex] = useState(0);
  const [selectedEduIndex, setSelectedEduIndex] = useState(0);
  const [selectedSkillIndex, setSelectedSkillIndex] = useState(0);
  const [selectedLangIndex, setSelectedLangIndex] = useState(0);

  const { dialogState, showAlert, closeDialog, handleConfirm, handleCancel } = useCustomDialog();

  // @ts-ignore
  const apiKey = import.meta.env?.VITE_GOOGLE_AI_API_KEY || '';
  const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

  // Datos del formulario
  const [formData, setFormData] = useState({
    full_name: '',
    headline: '',
    email: '',
    phone: '',
    location: '',
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
    summary: '',
    experiences: [
      { position: '', company_name: '', start_date: '', end_date: '', description: '', is_current: false }
    ],
    education: [
      { institution_name: '', degree: '', field_of_study: '', start_date: '', end_date: '', description: '' }
    ],
    skills: [{ name: '', level: '', years_of_experience: 0 }],
    languages: [{ language: '', proficiency: '' }],
    availability: '',
    work_mode: '',
    expected_salary: '',
    relocation_willing: false,
    template_id: '',
  });

  React.useEffect(() => {
    loadProfileData();
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;

    try {
      setIsLoadingProfile(true);
      const [profileRes, expRes, eduRes, skillsRes, langsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('experiences').select('*').eq('profile_id', user.id),
        supabase.from('education').select('*').eq('profile_id', user.id),
        supabase.from('skills').select('*').eq('profile_id', user.id),
        supabase.from('languages').select('*').eq('profile_id', user.id),
      ]);

      if (profileRes.data) {
        setFormData(prev => ({
          ...prev,
          full_name: profileRes.data.full_name || '',
          headline: profileRes.data.headline || '',
          email: profileRes.data.email || '',
          phone: profileRes.data.phone || '',
          location: profileRes.data.location || '',
          linkedin_url: profileRes.data.linkedin_url || '',
          github_url: profileRes.data.github_url || '',
          portfolio_url: profileRes.data.portfolio_url || '',
          summary: profileRes.data.summary || '',
          availability: profileRes.data.availability || '',
          work_mode: profileRes.data.work_mode || '',
          expected_salary: profileRes.data.expected_salary || '',
          relocation_willing: profileRes.data.relocation_willing || false,
          template_id: profileRes.data.template_id || '',
        }));
      }

      if (expRes.data && expRes.data.length > 0) {
        setFormData(prev => ({
          ...prev,
          experiences: expRes.data.map(exp => ({
            position: exp.position || '',
            company_name: exp.company_name || '',
            start_date: exp.start_date || '',
            end_date: exp.end_date || '',
            description: exp.description || '',
            is_current: exp.is_current || false,
          }))
        }));
      }

      if (eduRes.data && eduRes.data.length > 0) {
        setFormData(prev => ({
          ...prev,
          education: eduRes.data.map(edu => ({
            institution_name: edu.institution_name || '',
            degree: edu.degree || '',
            field_of_study: edu.field_of_study || '',
            start_date: edu.start_date || '',
            end_date: edu.end_date || '',
            description: edu.description || '',
          }))
        }));
      }

      if (skillsRes.data && skillsRes.data.length > 0) {
        setFormData(prev => ({
          ...prev,
          skills: skillsRes.data.map(skill => ({
            name: skill.name || '',
            level: skill.level || '',
            years_of_experience: skill.years_of_experience || 0,
          }))
        }));
      }

      if (langsRes.data && langsRes.data.length > 0) {
        setFormData(prev => ({
          ...prev,
          languages: langsRes.data.map(lang => ({
            language: lang.language || '',
            proficiency: lang.proficiency || '',
          }))
        }));
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
      setError(q.messages.loadingError);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateArrayItem = (arrayName: string, index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: (prev[arrayName as keyof typeof prev] as any[]).map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addArrayItem = (arrayName: string, newItem: any) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: [...(prev[arrayName as keyof typeof prev] as any[]), newItem]
    }));
  };

  const removeArrayItem = (arrayName: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: (prev[arrayName as keyof typeof prev] as any[]).filter((_, i) => i !== index)
    }));
  };

  const section = SECTIONS[currentSection];
  const progress = Math.round(((currentSection + 1) / SECTIONS.length) * 100);

  const isCurrentSectionValid = () => {
    switch (section.id) {
      case 'identity':
        return formData.full_name && formData.headline && formData.summary;
      case 'experience':
        return formData.experiences.some(exp => exp.position && exp.company_name);
      case 'education':
        return formData.education.some(edu => edu.institution_name && edu.degree);
      case 'skills':
        return formData.skills.some(skill => skill.name);
      case 'languages':
        return formData.languages.some(lang => lang.language);
      case 'preferences':
        return true;
      case 'template':
        return formData.template_id;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (currentSection < SECTIONS.length - 1) {
      setCurrentSection(currentSection + 1);
    } else {
      await saveAndFinalize();
    }
  };

  const handleBack = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const saveAndFinalize = async () => {
    if (!user) return;

    try {
      setIsProcessing(true);

      // Actualizar perfil
      await supabase.from('profiles').update({
        full_name: formData.full_name,
        headline: formData.headline,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        linkedin_url: formData.linkedin_url,
        github_url: formData.github_url,
        portfolio_url: formData.portfolio_url,
        summary: formData.summary,
        availability: formData.availability,
        work_mode: formData.work_mode,
        expected_salary: formData.expected_salary,
        relocation_willing: formData.relocation_willing,
        template_id: formData.template_id,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id);

      // Guardar experiencias
      await supabase.from('experiences').delete().eq('profile_id', user.id);
      if (formData.experiences.length > 0) {
        await supabase.from('experiences').insert(
          formData.experiences.map(exp => ({ ...exp, profile_id: user.id }))
        );
      }

      // Guardar educación
      await supabase.from('education').delete().eq('profile_id', user.id);
      if (formData.education.length > 0) {
        await supabase.from('education').insert(
          formData.education.map(edu => ({ ...edu, profile_id: user.id }))
        );
      }

      // Guardar habilidades
      await supabase.from('skills').delete().eq('profile_id', user.id);
      if (formData.skills.length > 0) {
        await supabase.from('skills').insert(
          formData.skills.map(skill => ({ ...skill, profile_id: user.id }))
        );
      }

      // Guardar idiomas
      await supabase.from('languages').delete().eq('profile_id', user.id);
      if (formData.languages.length > 0) {
        await supabase.from('languages').insert(
          formData.languages.map(lang => ({ ...lang, profile_id: user.id }))
        );
      }

      setIsCompleted(true);
      showAlert({
        title: q.messages.completedTitle,
        message: q.messages.completedMessage,
        type: 'success'
      });

      if (onComplete) onComplete();
    } catch (error: any) {
      console.error('Error saving profile:', error);
      setError(q.messages.savingError);
    } finally {
      setIsProcessing(false);
    }
  };

  const validateLinkedInUrl = (url: string) => {
    return /linkedin\.com\/in\//i.test(url);
  };

  const validateGitHubUrl = (url: string) => {
    return /github\.com\//i.test(url);
  };

  const renderSectionContent = () => {
    const exp = formData.experiences[selectedExpIndex] || formData.experiences[0];
    const edu = formData.education[selectedEduIndex] || formData.education[0];
    const skill = formData.skills[selectedSkillIndex] || formData.skills[0];
    const lang = formData.languages[selectedLangIndex] || formData.languages[0];

    switch (section.id) {
      case 'identity':
        return (
          <div className="grid grid-cols-4 gap-2 h-full">
            <div className="col-span-2">
              <label className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{q.identity.name} {q.required}</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => updateFormData('full_name', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder={q.identity.namePlaceholder}
              />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{q.identity.title} {q.required}</label>
              <input
                type="text"
                value={formData.headline}
                onChange={(e) => updateFormData('headline', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder={q.identity.titlePlaceholder}
              />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{q.identity.email}</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder={q.identity.emailPlaceholder}
              />
            </div>
            <div className="col-span-1">
              <label className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{q.identity.phone}</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9+\s()-]/g, '');
                  updateFormData('phone', value);
                }}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder={q.identity.phonePlaceholder}
                maxLength={20}
              />
            </div>
            <div className="col-span-1">
              <label className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{q.identity.location}</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => updateFormData('location', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder={q.identity.locationPlaceholder}
              />
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{q.identity.linkedin}</label>
              <input
                type="url"
                value={formData.linkedin_url}
                onChange={(e) => updateFormData('linkedin_url', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder={q.identity.linkedinPlaceholder}
              />
            </div>
            <div className="col-span-1">
              <label className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{q.identity.github}</label>
              <input
                type="url"
                value={formData.github_url}
                onChange={(e) => updateFormData('github_url', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder={q.identity.githubPlaceholder}
              />
            </div>
            <div className="col-span-1">
              <label className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{q.identity.portfolio}</label>
              <input
                type="url"
                value={formData.portfolio_url}
                onChange={(e) => updateFormData('portfolio_url', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder={q.identity.portfolioPlaceholder}
              />
            </div>
            <div className="col-span-4">
              <label className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{q.identity.summary} {q.required}</label>
              <textarea
                value={formData.summary}
                onChange={(e) => updateFormData('summary', e.target.value)}
                rows={3}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                placeholder={q.identity.summaryPlaceholder}
              />
            </div>
          </div>
        );

      case 'experience':
        return (
          <div className="h-full flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <select
                value={selectedExpIndex}
                onChange={(e) => setSelectedExpIndex(Number(e.target.value))}
                className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {formData.experiences.map((_, idx) => (
                  <option key={idx} value={idx}>{q.experience.label} {idx + 1}</option>
                ))}
              </select>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    addArrayItem('experiences', { position: '', company_name: '', start_date: '', end_date: '', description: '', is_current: false });
                    setSelectedExpIndex(formData.experiences.length);
                  }}
                  className="px-2 py-1 text-[10px] bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  <PlusIcon className="h-3 w-3" />
                </button>
                {formData.experiences.length > 1 && (
                  <button
                    onClick={() => {
                      removeArrayItem('experiences', selectedExpIndex);
                      setSelectedExpIndex(Math.max(0, selectedExpIndex - 1));
                    }}
                    className="px-2 py-1 text-[10px] bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    <TrashIcon className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 flex-1">
              <div className="col-span-2">
                <label className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{q.experience.position} {q.required}</label>
                <input
                  type="text"
                  value={exp.position}
                  onChange={(e) => updateArrayItem('experiences', selectedExpIndex, 'position', e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder={q.experience.positionPlaceholder}
                />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{q.experience.company} {q.required}</label>
                <input
                  type="text"
                  value={exp.company_name}
                  onChange={(e) => updateArrayItem('experiences', selectedExpIndex, 'company_name', e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder={q.experience.companyPlaceholder}
                />
              </div>
              <div className="col-span-1">
                <label className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{q.experience.startDate}</label>
                <input
                  type="month"
                  value={exp.start_date}
                  onChange={(e) => updateArrayItem('experiences', selectedExpIndex, 'start_date', e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="col-span-1">
                <label className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{q.experience.endDate}</label>
                <input
                  type="month"
                  value={exp.end_date}
                  onChange={(e) => updateArrayItem('experiences', selectedExpIndex, 'end_date', e.target.value)}
                  disabled={exp.is_current}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                />
              </div>
              <div className="col-span-2 flex items-center">
                <input
                  type="checkbox"
                  checked={exp.is_current}
                  onChange={(e) => updateArrayItem('experiences', selectedExpIndex, 'is_current', e.target.checked)}
                  className="h-3 w-3"
                />
                <label className="ml-1 text-[10px] text-gray-700 dark:text-gray-300">{q.experience.currentJob}</label>
              </div>
              <div className="col-span-4">
                <label className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{q.experience.description}</label>
                <textarea
                  value={exp.description}
                  onChange={(e) => updateArrayItem('experiences', selectedExpIndex, 'description', e.target.value)}
                  rows={4}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  placeholder={q.experience.descriptionPlaceholder}
                />
              </div>
            </div>
          </div>
        );

      case 'education':
        return (
          <div className="h-full flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <select
                value={selectedEduIndex}
                onChange={(e) => setSelectedEduIndex(Number(e.target.value))}
                className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {formData.education.map((_, idx) => (
                  <option key={idx} value={idx}>{q.education.label} {idx + 1}</option>
                ))}
              </select>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    addArrayItem('education', { institution_name: '', degree: '', field_of_study: '', start_date: '', end_date: '', description: '' });
                    setSelectedEduIndex(formData.education.length);
                  }}
                  className="px-2 py-1 text-[10px] bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  <PlusIcon className="h-3 w-3" />
                </button>
                {formData.education.length > 1 && (
                  <button
                    onClick={() => {
                      removeArrayItem('education', selectedEduIndex);
                      setSelectedEduIndex(Math.max(0, selectedEduIndex - 1));
                    }}
                    className="px-2 py-1 text-[10px] bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    <TrashIcon className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 flex-1">
              <div className="col-span-2">
                <label className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{q.education.institution} {q.required}</label>
                <input
                  type="text"
                  value={edu.institution_name}
                  onChange={(e) => updateArrayItem('education', selectedEduIndex, 'institution_name', e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder={q.education.institutionPlaceholder}
                />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{q.education.degree} {q.required}</label>
                <input
                  type="text"
                  value={edu.degree}
                  onChange={(e) => updateArrayItem('education', selectedEduIndex, 'degree', e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder={q.education.degreePlaceholder}
                />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{q.education.field}</label>
                <input
                  type="text"
                  value={edu.field_of_study}
                  onChange={(e) => updateArrayItem('education', selectedEduIndex, 'field_of_study', e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder={q.education.fieldPlaceholder}
                />
              </div>
              <div className="col-span-1">
                <label className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{q.education.startDate}</label>
                <input
                  type="month"
                  value={edu.start_date}
                  onChange={(e) => updateArrayItem('education', selectedEduIndex, 'start_date', e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="col-span-1">
                <label className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{q.education.endDate}</label>
                <input
                  type="month"
                  value={edu.end_date}
                  onChange={(e) => updateArrayItem('education', selectedEduIndex, 'end_date', e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="col-span-4">
                <label className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{q.education.description}</label>
                <textarea
                  value={edu.description}
                  onChange={(e) => updateArrayItem('education', selectedEduIndex, 'description', e.target.value)}
                  rows={3}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  placeholder={q.education.descriptionPlaceholder}
                />
              </div>
            </div>
          </div>
        );

      case 'skills':
        return (
          <div className="h-full flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <select
                value={selectedSkillIndex}
                onChange={(e) => setSelectedSkillIndex(Number(e.target.value))}
                className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {formData.skills.map((s, idx) => (
                  <option key={idx} value={idx}>{s.name || `${q.skills.label} ${idx + 1}`}</option>
                ))}
              </select>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    addArrayItem('skills', { name: '', level: '', years_of_experience: 0 });
                    setSelectedSkillIndex(formData.skills.length);
                  }}
                  className="px-2 py-1 text-[10px] bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  <PlusIcon className="h-3 w-3" />
                </button>
                {formData.skills.length > 1 && (
                  <button
                    onClick={() => {
                      removeArrayItem('skills', selectedSkillIndex);
                      setSelectedSkillIndex(Math.max(0, selectedSkillIndex - 1));
                    }}
                    className="px-2 py-1 text-[10px] bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    <TrashIcon className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-2">
                <label className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{q.skills.skill} {q.required}</label>
                <input
                  type="text"
                  value={skill.name}
                  onChange={(e) => updateArrayItem('skills', selectedSkillIndex, 'name', e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder={q.skills.skillPlaceholder}
                />
              </div>
              <div className="col-span-1">
                <label className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{q.skills.level}</label>
                <select
                  value={skill.level}
                  onChange={(e) => updateArrayItem('skills', selectedSkillIndex, 'level', e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">{q.skills.levelSelect}</option>
                  <option value={q.skills.levelBasic}>{q.skills.levelBasic}</option>
                  <option value={q.skills.levelIntermediate}>{q.skills.levelIntermediate}</option>
                  <option value={q.skills.levelAdvanced}>{q.skills.levelAdvanced}</option>
                  <option value={q.skills.levelExpert}>{q.skills.levelExpert}</option>
                </select>
              </div>
              <div className="col-span-1">
                <label className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{q.skills.years}</label>
                <input
                  type="number"
                  value={skill.years_of_experience}
                  onChange={(e) => updateArrayItem('skills', selectedSkillIndex, 'years_of_experience', Number(e.target.value))}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="0"
                  max="50"
                />
              </div>
            </div>
          </div>
        );

      case 'languages':
        return (
          <div className="h-full flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <select
                value={selectedLangIndex}
                onChange={(e) => setSelectedLangIndex(Number(e.target.value))}
                className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {formData.languages.map((l, idx) => (
                  <option key={idx} value={idx}>{l.language || `${q.languages.label} ${idx + 1}`}</option>
                ))}
              </select>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    addArrayItem('languages', { language: '', proficiency: '' });
                    setSelectedLangIndex(formData.languages.length);
                  }}
                  className="px-2 py-1 text-[10px] bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  <PlusIcon className="h-3 w-3" />
                </button>
                {formData.languages.length > 1 && (
                  <button
                    onClick={() => {
                      removeArrayItem('languages', selectedLangIndex);
                      setSelectedLangIndex(Math.max(0, selectedLangIndex - 1));
                    }}
                    className="px-2 py-1 text-[10px] bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    <TrashIcon className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{q.languages.language} {q.required}</label>
                <input
                  type="text"
                  value={lang.language}
                  onChange={(e) => updateArrayItem('languages', selectedLangIndex, 'language', e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder={q.languages.languagePlaceholder}
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{q.languages.level}</label>
                <select
                  value={lang.proficiency}
                  onChange={(e) => updateArrayItem('languages', selectedLangIndex, 'proficiency', e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">{q.languages.levelSelect}</option>
                  <option value="A1">{q.languages.levelA1}</option>
                  <option value="A2">{q.languages.levelA2}</option>
                  <option value="B1">{q.languages.levelB1}</option>
                  <option value="B2">{q.languages.levelB2}</option>
                  <option value="C1">{q.languages.levelC1}</option>
                  <option value="C2">{q.languages.levelC2}</option>
                  <option value={q.languages.levelNative}>{q.languages.levelNative}</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="grid grid-cols-4 gap-2 h-full">
            <div className="col-span-2">
              <label className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{q.preferences.availability}</label>
              <select
                value={formData.availability}
                onChange={(e) => updateFormData('availability', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">{q.preferences.availabilitySelect}</option>
                <option value={q.preferences.availabilityImmediate}>{q.preferences.availabilityImmediate}</option>
                <option value={q.preferences.availability1Week}>{q.preferences.availability1Week}</option>
                <option value={q.preferences.availability2Weeks}>{q.preferences.availability2Weeks}</option>
                <option value={q.preferences.availability1Month}>{q.preferences.availability1Month}</option>
                <option value={q.preferences.availabilityMore}>{q.preferences.availabilityMore}</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{q.preferences.workMode}</label>
              <select
                value={formData.work_mode}
                onChange={(e) => updateFormData('work_mode', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">{q.preferences.workModeSelect}</option>
                <option value={q.preferences.workModeRemote}>{q.preferences.workModeRemote}</option>
                <option value={q.preferences.workModeOnsite}>{q.preferences.workModeOnsite}</option>
                <option value={q.preferences.workModeHybrid}>{q.preferences.workModeHybrid}</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{q.preferences.expectedSalary}</label>
              <input
                type="text"
                value={formData.expected_salary}
                onChange={(e) => updateFormData('expected_salary', e.target.value)}
                className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder={q.preferences.expectedSalaryPlaceholder}
              />
            </div>
            <div className="col-span-2 flex items-center">
              <input
                type="checkbox"
                checked={formData.relocation_willing}
                onChange={(e) => updateFormData('relocation_willing', e.target.checked)}
                className="h-3 w-3"
              />
              <label className="ml-2 text-[10px] text-gray-700 dark:text-gray-300">{q.preferences.relocationWilling}</label>
            </div>
          </div>
        );

      case 'template':
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto max-h-96">
            {templates.map((template) => (
              <div
                key={template.id}
                onClick={() => updateFormData('template_id', template.id)}
                className={`cursor-pointer border-2 rounded-lg p-3 transition-all hover:scale-105 ${
                  formData.template_id === template.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-300 shadow-sm'
                }`}
              >
                <div className="text-xs font-semibold text-gray-900 dark:text-white mb-1">
                  {template.name.es}
                </div>
                {template.isPro && (
                  <span className="inline-block text-[8px] bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-2 py-0.5 rounded-full font-bold">
                    PRO
                  </span>
                )}
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Ultra Compact Top Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl">{section.icon}</span>
          <div>
            <h1 className="text-sm font-bold leading-tight">{section.name}</h1>
            <div className="flex items-center gap-1.5 text-[10px] text-white/80">
              <span>{q.progress.step} {currentSection + 1}/{SECTIONS.length}</span>
              <span>•</span>
              <span className="font-bold">{progress}%</span>
            </div>
          </div>
        </div>

        {/* Compact Progress Steps */}
        <div className="flex gap-1.5 items-center">
          {SECTIONS.map((s, idx) => (
            <div
              key={s.id}
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all ${
                idx === currentSection
                  ? 'bg-white text-blue-600 font-bold scale-105'
                  : idx < currentSection
                  ? 'bg-green-400 text-white'
                  : 'bg-white/20 text-white/60'
              }`}
            >
              {idx < currentSection ? '✓' : s.icon}
            </div>
          ))}
        </div>
      </div>

      {/* Inline Alerts */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 px-4 py-2 flex items-center gap-2 shrink-0">
          <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs text-red-700 dark:text-red-300 flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 font-bold">×</button>
        </div>
      )}

      {isCorrectingText && (
        <div className="bg-purple-50 dark:bg-purple-900/30 border-l-4 border-purple-500 px-4 py-2 flex items-center gap-2 shrink-0">
          <SparklesIcon className="h-4 w-4 text-purple-600 animate-spin" />
          <span className="text-xs text-purple-700 dark:text-purple-300 font-medium">{q.messages.optimizing}</span>
        </div>
      )}

      {/* Content Area - Maximized */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50 dark:bg-gray-900 px-4 py-3">
        <div className="max-w-5xl mx-auto">
          {renderSectionContent()}
        </div>
      </div>

      {/* Ultra Compact Bottom Bar */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between shrink-0">
        <button
          onClick={handleBack}
          disabled={currentSection === 0}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-medium transition-all"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          {q.navigation.previous}
        </button>

        <div className="flex gap-1">
          {SECTIONS.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 rounded-full transition-all ${
                idx <= currentSection ? 'w-6 bg-blue-600' : 'w-3 bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={!isCurrentSectionValid() || isProcessing}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed text-xs font-medium transition-all"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
              {q.navigation.saving}
            </>
          ) : currentSection === SECTIONS.length - 1 ? (
            <>
              <CheckCircleIcon className="h-3.5 w-3.5" />
              {q.navigation.finish}
            </>
          ) : (
            <>
              {q.navigation.next}
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </div>

      {/* Alert Modal */}
      <AlertModal
        isOpen={dialogState.isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={dialogState.title}
        message={dialogState.message}
        type={dialogState.type}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        showCancel={dialogState.showCancel}
      />
    </div>
  );
}
