import React, { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslations } from '../hooks/useTranslations';
import { supabase } from '../supabase/client';
import { templates } from './templates/templateData';
import AlertModal from './shared/AlertModal';
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
    country_code: '',
    location: '',
    linkedin_url: '',
    github_url: '',
    portfolio_url: '',
    summary: '',
    experiences: [
      { position: '', company_name: '', start_date: '', end_date: '', description: '', is_current: false }
    ],
    education: [
      { institution_name: '', degree: '', field_of_study: '', start_date: '', end_date: '', description: '', is_current: false }
    ],
    skills: [{ name: '', level: '', years_of_experience: 0, percentage: null }],
    languages: [{ name: '', level: '', percentage: null }],
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
          country_code: profileRes.data.country_code || '',
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
            is_current: edu.is_current || false,
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
            percentage: skill.percentage || null,
          }))
        }));
      }

      if (langsRes.data && langsRes.data.length > 0) {
        setFormData(prev => ({
          ...prev,
          languages: langsRes.data.map(lang => ({
            name: lang.name || '',
            level: lang.level || '',
            percentage: lang.percentage || null,
          }))
        }));
      }
    } catch (error: any) {setError(q.messages.loadingError);
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
        return formData.languages.some(lang => lang.name);
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

      // Actualizar perfil - solo campos que existen en types.ts Profile interface
      const { error: profileError } = await supabase.from('profiles').update({
        full_name: formData.full_name,
        headline: formData.headline,
        email: formData.email,
        phone: formData.phone,
        country_code: formData.country_code,
        location: formData.location,
        linkedin_url: formData.linkedin_url,
        github_url: formData.github_url,
        portfolio_url: formData.portfolio_url,
        summary: formData.summary,
        availability: formData.availability,
        // work_mode: formData.work_mode, // Descomentar después de ejecutar add-missing-profile-columns.sql
        updated_at: new Date().toISOString(),
      }).eq('id', user.id);

      if (profileError) throw profileError;

      // Guardar experiencias
      await supabase.from('experiences').delete().eq('profile_id', user.id);
      if (formData.experiences.length > 0 && formData.experiences.some(exp => exp.position && exp.company_name)) {
        const experiencesToSave = formData.experiences
          .filter(exp => exp.position && exp.company_name && exp.start_date)
          .map(exp => ({
            ...exp,
            profile_id: user.id,
            start_date: normalizeDateForDB(exp.start_date),
            end_date: exp.is_current ? null : normalizeDateForDB(exp.end_date),
          }));
        if (experiencesToSave.length > 0) {
          const { error: insertExpError } = await supabase.from('experiences').insert(experiencesToSave);
          if (insertExpError) throw insertExpError;
        }
      }

      // Guardar educación
      await supabase.from('education').delete().eq('profile_id', user.id);
      if (formData.education.length > 0 && formData.education.some(edu => edu.institution_name && edu.degree)) {
        const educationToSave = formData.education
          .filter(edu => edu.institution_name && edu.degree && edu.start_date)
          .map(edu => ({
            ...edu,
            profile_id: user.id,
            start_date: normalizeDateForDB(edu.start_date),
            end_date: edu.is_current ? null : normalizeDateForDB(edu.end_date),
          }));
        if (educationToSave.length > 0) {
          const { error: insertEduError } = await supabase.from('education').insert(educationToSave);
          if (insertEduError) throw insertEduError;
        }
      }

      // Guardar habilidades
      await supabase.from('skills').delete().eq('profile_id', user.id);
      if (formData.skills.length > 0 && formData.skills.some(s => s.name)) {
        const skillsToSave = formData.skills
          .filter(skill => skill.name)
          .map(skill => ({
            name: skill.name,
            profile_id: user.id,
            level: normalizeSkillLevel(skill.level),
            years_of_experience: skill.years_of_experience || null,
            percentage: skill.percentage !== null && skill.percentage !== undefined ? skill.percentage : null
          }));
        if (skillsToSave.length > 0) {
          const { error: insertSkillsError } = await supabase.from('skills').insert(skillsToSave);
          if (insertSkillsError) throw insertSkillsError;
        }
      }

      // Guardar idiomas
      await supabase.from('languages').delete().eq('profile_id', user.id);
      if (formData.languages.length > 0 && formData.languages.some(l => l.name && l.level)) {
        const langsToSave = formData.languages
          .filter(lang => lang.name && lang.level)
          .map(lang => ({
            name: lang.name,
            profile_id: user.id,
            level: normalizeLanguageLevel(lang.level),
            percentage: lang.percentage !== null && lang.percentage !== undefined ? lang.percentage : null
          }))
          .filter(lang => lang.level !== null);
        if (langsToSave.length > 0) {
          const { error: insertLangsError } = await supabase.from('languages').insert(langsToSave);
          if (insertLangsError) throw insertLangsError;
        }
      }

      setIsCompleted(true);
      showAlert({
        title: q.messages.completedTitle,
        message: q.messages.completedMessage,
        type: 'success'
      });

      if (onComplete) onComplete();
    } catch (error: any) {
      setError(q.messages.savingError + ': ' + (error?.message || 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const validateLinkedInUrl = (url: string) => {
    return /linkedin\.com\/in\//i.test(url);
  };

  // Función para normalizar fechas de formato YYYY-MM a YYYY-MM-01
  const normalizeDateForDB = (date: string | null): string | null => {
    if (!date) return null;
    // Si ya está en formato completo YYYY-MM-DD, retornar tal cual
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    // Si está en formato YYYY-MM, agregar -01
    if (/^\d{4}-\d{2}$/.test(date)) return `${date}-01`;
    // Si no es un formato válido, retornar null
    return null;
  };

  // Función para normalizar skill level a valores válidos de la BD
  const normalizeSkillLevel = (level: string | null | undefined): 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' | null => {
    if (!level) return null;
    const validLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
    const upperLevel = level.toUpperCase();
    return validLevels.includes(upperLevel) ? upperLevel as any : null;
  };

  // Función para normalizar language level a valores válidos de la BD
  const normalizeLanguageLevel = (level: string | null | undefined): 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'NATIVE' | null => {
    if (!level) return null;
    const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'NATIVE'];
    const upperLevel = level.toUpperCase();
    // Convertir "Native" a "NATIVE"
    if (upperLevel === 'NATIVE') return 'NATIVE';
    return validLevels.includes(upperLevel) ? upperLevel as any : null;
  };

  const validateGitHubUrl = (url: string) => {
    return /github\.com\//i.test(url);
  };

  const renderSectionContent = () => {
    const exp = formData.experiences[selectedExpIndex] || formData.experiences[0];
    const edu = formData.education[selectedEduIndex] || formData.education[0];
    const skill = formData.skills[selectedSkillIndex] || formData.skills[0];
    const language = formData.languages[selectedLangIndex] || formData.languages[0];

    switch (section.id) {
      case 'identity':
        return (
          <div className="space-y-8">
            {/* Header Section */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{lang === 'es' ? 'Información Básica' : 'Basic Information'}</h2>
              <p className="text-gray-600 dark:text-gray-400">{lang === 'es' ? 'Cuéntanos sobre ti' : 'Tell us about yourself'}</p>
            </div>

            {/* Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {q.identity.name} <span className="text-red-500">{q.required}</span>
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => updateFormData('full_name', e.target.value)}
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  placeholder={q.identity.namePlaceholder}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {q.identity.title} <span className="text-red-500">{q.required}</span>
                </label>
                <input
                  type="text"
                  value={formData.headline}
                  onChange={(e) => updateFormData('headline', e.target.value)}
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  placeholder={q.identity.titlePlaceholder}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{q.identity.email}</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  placeholder={q.identity.emailPlaceholder}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{q.identity.phone}</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9+\s()-]/g, '');
                    updateFormData('phone', value);
                  }}
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  placeholder={q.identity.phonePlaceholder}
                  maxLength={20}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {lang === 'es' ? 'País' : 'Country'}
                </label>
                <select
                  value={formData.country_code}
                  onChange={(e) => updateFormData('country_code', e.target.value)}
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                  <option value="">{lang === 'es' ? 'Selecciona tu país' : 'Select your country'}</option>
                  <option value="ES">🇪🇸 España</option>
                  <option value="AR">🇦🇷 Argentina</option>
                  <option value="MX">🇲🇽 México</option>
                  <option value="CO">🇨🇴 Colombia</option>
                  <option value="PE">🇵🇪 Perú</option>
                  <option value="CL">🇨🇱 Chile</option>
                  <option value="UY">🇺🇾 Uruguay</option>
                  <option value="VE">🇻🇪 Venezuela</option>
                  <option value="CR">🇨🇷 Costa Rica</option>
                  <option value="PA">🇵🇦 Panamá</option>
                  <option value="EC">🇪🇨 Ecuador</option>
                  <option value="BO">🇧🇴 Bolivia</option>
                  <option value="PY">🇵🇾 Paraguay</option>
                  <option value="SV">🇸🇻 El Salvador</option>
                  <option value="HN">🇭🇳 Honduras</option>
                  <option value="NI">🇳🇮 Nicaragua</option>
                  <option value="GT">🇬🇹 Guatemala</option>
                  <option value="CU">🇨🇺 Cuba</option>
                  <option value="DO">🇩🇴 República Dominicana</option>
                  <option value="PR">🇵🇷 Puerto Rico</option>
                  <option value="US">🇺🇸 United States</option>
                  <option value="GB">🇬🇧 United Kingdom</option>
                  <option value="FR">🇫🇷 France</option>
                  <option value="DE">🇩🇪 Germany</option>
                  <option value="IT">🇮🇹 Italy</option>
                  <option value="PT">🇵🇹 Portugal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{q.identity.location}</label>
                <select
                  value={formData.location}
                  onChange={(e) => updateFormData('location', e.target.value)}
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  disabled={!formData.country_code}
                >
                  <option value="">{formData.country_code ? (lang === 'es' ? 'Selecciona tu ciudad' : 'Select your city') : (lang === 'es' ? 'Primero selecciona un país' : 'First select a country')}</option>
                  {formData.country_code === 'ES' && (
                    <>
                      <option value="Madrid, España">Madrid</option>
                      <option value="Barcelona, España">Barcelona</option>
                      <option value="Valencia, España">Valencia</option>
                      <option value="Sevilla, España">Sevilla</option>
                      <option value="Bilbao, España">Bilbao</option>
                      <option value="Málaga, España">Málaga</option>
                    </>
                  )}
                  {formData.country_code === 'AR' && (
                    <>
                      <option value="Buenos Aires, Argentina">Buenos Aires</option>
                      <option value="Córdoba, Argentina">Córdoba</option>
                      <option value="Rosario, Argentina">Rosario</option>
                      <option value="Mendoza, Argentina">Mendoza</option>
                    </>
                  )}
                  {formData.country_code === 'MX' && (
                    <>
                      <option value="Ciudad de México, México">Ciudad de México</option>
                      <option value="Guadalajara, México">Guadalajara</option>
                      <option value="Monterrey, México">Monterrey</option>
                      <option value="Puebla, México">Puebla</option>
                    </>
                  )}
                  {formData.country_code === 'CO' && (
                    <>
                      <option value="Bogotá, Colombia">Bogotá</option>
                      <option value="Medellín, Colombia">Medellín</option>
                      <option value="Cali, Colombia">Cali</option>
                      <option value="Barranquilla, Colombia">Barranquilla</option>
                    </>
                  )}
                  {formData.country_code === 'PE' && (
                    <>
                      <option value="Lima, Perú">Lima</option>
                      <option value="Arequipa, Perú">Arequipa</option>
                      <option value="Cusco, Perú">Cusco</option>
                    </>
                  )}
                  {formData.country_code === 'CL' && (
                    <>
                      <option value="Santiago, Chile">Santiago</option>
                      <option value="Valparaíso, Chile">Valparaíso</option>
                      <option value="Concepción, Chile">Concepción</option>
                    </>
                  )}
                  {formData.country_code === 'UY' && (
                    <>
                      <option value="Montevideo, Uruguay">Montevideo</option>
                      <option value="Salto, Uruguay">Salto</option>
                    </>
                  )}
                  {formData.country_code === 'VE' && (
                    <>
                      <option value="Caracas, Venezuela">Caracas</option>
                      <option value="Maracaibo, Venezuela">Maracaibo</option>
                      <option value="Valencia, Venezuela">Valencia</option>
                      <option value="Barquisimeto, Venezuela">Barquisimeto</option>
                    </>
                  )}
                  {formData.country_code === 'CR' && (
                    <>
                      <option value="San José, Costa Rica">San José</option>
                      <option value="Alajuela, Costa Rica">Alajuela</option>
                    </>
                  )}
                  {formData.country_code === 'PA' && (
                    <>
                      <option value="Panamá, Panamá">Panamá</option>
                      <option value="Colón, Panamá">Colón</option>
                    </>
                  )}
                  {formData.country_code === 'EC' && (
                    <>
                      <option value="Quito, Ecuador">Quito</option>
                      <option value="Guayaquil, Ecuador">Guayaquil</option>
                    </>
                  )}
                  {formData.country_code === 'BO' && (
                    <>
                      <option value="La Paz, Bolivia">La Paz</option>
                      <option value="Santa Cruz, Bolivia">Santa Cruz</option>
                    </>
                  )}
                  {formData.country_code === 'PY' && (
                    <option value="Asunción, Paraguay">Asunción</option>
                  )}
                  {formData.country_code === 'SV' && (
                    <option value="San Salvador, El Salvador">San Salvador</option>
                  )}
                  {formData.country_code === 'HN' && (
                    <option value="Tegucigalpa, Honduras">Tegucigalpa</option>
                  )}
                  {formData.country_code === 'NI' && (
                    <option value="Managua, Nicaragua">Managua</option>
                  )}
                  {formData.country_code === 'GT' && (
                    <option value="Guatemala, Guatemala">Guatemala</option>
                  )}
                  {formData.country_code === 'CU' && (
                    <option value="La Habana, Cuba">La Habana</option>
                  )}
                  {formData.country_code === 'DO' && (
                    <option value="Santo Domingo, República Dominicana">Santo Domingo</option>
                  )}
                  {formData.country_code === 'PR' && (
                    <option value="San Juan, Puerto Rico">San Juan</option>
                  )}
                  {formData.country_code === 'US' && (
                    <>
                      <option value="Miami, USA">Miami</option>
                      <option value="New York, USA">New York</option>
                      <option value="Los Angeles, USA">Los Angeles</option>
                      <option value="Houston, USA">Houston</option>
                      <option value="Chicago, USA">Chicago</option>
                    </>
                  )}
                  {formData.country_code === 'GB' && (
                    <>
                      <option value="London, UK">London</option>
                      <option value="Manchester, UK">Manchester</option>
                    </>
                  )}
                  {formData.country_code === 'FR' && (
                    <>
                      <option value="Paris, France">Paris</option>
                      <option value="Lyon, France">Lyon</option>
                    </>
                  )}
                  {formData.country_code === 'DE' && (
                    <>
                      <option value="Berlin, Germany">Berlin</option>
                      <option value="Munich, Germany">Munich</option>
                    </>
                  )}
                  {formData.country_code === 'IT' && (
                    <>
                      <option value="Rome, Italy">Rome</option>
                      <option value="Milan, Italy">Milan</option>
                    </>
                  )}
                  {formData.country_code === 'PT' && (
                    <>
                      <option value="Lisbon, Portugal">Lisbon</option>
                      <option value="Porto, Portugal">Porto</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Social Links Section */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{lang === 'es' ? 'Enlaces Profesionales' : 'Professional Links'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{q.identity.linkedin}</label>
                  <input
                    type="url"
                    value={formData.linkedin_url}
                    onChange={(e) => updateFormData('linkedin_url', e.target.value)}
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder={q.identity.linkedinPlaceholder}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{q.identity.github}</label>
                  <input
                    type="url"
                    value={formData.github_url}
                    onChange={(e) => updateFormData('github_url', e.target.value)}
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder={q.identity.githubPlaceholder}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{q.identity.portfolio}</label>
                  <input
                    type="url"
                    value={formData.portfolio_url}
                    onChange={(e) => updateFormData('portfolio_url', e.target.value)}
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder={q.identity.portfolioPlaceholder}
                  />
                </div>
              </div>
            </div>

            {/* Professional Summary Section */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{q.identity.summary} <span className="text-red-500">{q.required}</span></h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{lang === 'es' ? 'Describe tu perfil profesional en pocas palabras' : 'Describe your professional profile in a few words'}</p>
              <textarea
                value={formData.summary}
                onChange={(e) => updateFormData('summary', e.target.value)}
                rows={5}
                className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                placeholder={q.identity.summaryPlaceholder}
              />
            </div>
          </div>
        );

      case 'experience':
        return (
          <div className="space-y-8">
            {/* Header with Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {lang === 'es' ? 'Experiencia Profesional' : 'Professional Experience'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {lang === 'es' ? 'Añade tus empleos anteriores' : 'Add your previous jobs'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={selectedExpIndex}
                  onChange={(e) => setSelectedExpIndex(Number(e.target.value))}
                  className="px-4 py-2 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                  {formData.experiences.map((_, idx) => (
                    <option key={idx} value={idx}>{q.experience.label} {idx + 1}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    addArrayItem('experiences', { position: '', company_name: '', start_date: '', end_date: '', description: '', is_current: false });
                    setSelectedExpIndex(formData.experiences.length);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all flex items-center gap-2"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span className="hidden sm:inline">{lang === 'es' ? 'Añadir' : 'Add'}</span>
                </button>
                {formData.experiences.length > 1 && (
                  <button
                    onClick={() => {
                      removeArrayItem('experiences', selectedExpIndex);
                      setSelectedExpIndex(Math.max(0, selectedExpIndex - 1));
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium shadow-md hover:shadow-lg transition-all"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {q.experience.position} <span className="text-red-500">{q.required}</span>
                  </label>
                  <input
                    type="text"
                    value={exp.position}
                    onChange={(e) => updateArrayItem('experiences', selectedExpIndex, 'position', e.target.value)}
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder={q.experience.positionPlaceholder}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {q.experience.company} <span className="text-red-500">{q.required}</span>
                  </label>
                  <input
                    type="text"
                    value={exp.company_name}
                    onChange={(e) => updateArrayItem('experiences', selectedExpIndex, 'company_name', e.target.value)}
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder={q.experience.companyPlaceholder}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{q.experience.startDate}</label>
                  <input
                    type="month"
                    value={exp.start_date}
                    onChange={(e) => updateArrayItem('experiences', selectedExpIndex, 'start_date', e.target.value)}
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{q.experience.endDate}</label>
                  <input
                    type="month"
                    value={exp.end_date}
                    onChange={(e) => updateArrayItem('experiences', selectedExpIndex, 'end_date', e.target.value)}
                    disabled={exp.is_current}
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                <div className="flex items-center gap-3 h-12">
                  <input
                    type="checkbox"
                    id="is-current"
                    checked={exp.is_current}
                    onChange={(e) => updateArrayItem('experiences', selectedExpIndex, 'is_current', e.target.checked)}
                    className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label htmlFor="is-current" className="text-sm font-medium text-gray-700 dark:text-gray-300">{q.experience.currentJob}</label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{q.experience.description}</label>
                <textarea
                  value={exp.description}
                  onChange={(e) => updateArrayItem('experiences', selectedExpIndex, 'description', e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                  placeholder={q.experience.descriptionPlaceholder}
                />
              </div>
            </div>
          </div>
        );

      case 'education':
        return (
          <div className="space-y-8">
            {/* Header with Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {lang === 'es' ? 'Educación' : 'Education'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {lang === 'es' ? 'Añade tu formación académica' : 'Add your academic background'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={selectedEduIndex}
                  onChange={(e) => setSelectedEduIndex(Number(e.target.value))}
                  className="px-4 py-2 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                  {formData.education.map((_, idx) => (
                    <option key={idx} value={idx}>{q.education.label} {idx + 1}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    addArrayItem('education', { institution_name: '', degree: '', field_of_study: '', start_date: '', end_date: '', description: '' });
                    setSelectedEduIndex(formData.education.length);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all flex items-center gap-2"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span className="hidden sm:inline">{lang === 'es' ? 'Añadir' : 'Add'}</span>
                </button>
                {formData.education.length > 1 && (
                  <button
                    onClick={() => {
                      removeArrayItem('education', selectedEduIndex);
                      setSelectedEduIndex(Math.max(0, selectedEduIndex - 1));
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium shadow-md hover:shadow-lg transition-all"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {q.education.institution} <span className="text-red-500">{q.required}</span>
                  </label>
                  <input
                    type="text"
                    value={edu.institution_name}
                    onChange={(e) => updateArrayItem('education', selectedEduIndex, 'institution_name', e.target.value)}
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder={q.education.institutionPlaceholder}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {q.education.degree} <span className="text-red-500">{q.required}</span>
                  </label>
                  <input
                    type="text"
                    value={edu.degree}
                    onChange={(e) => updateArrayItem('education', selectedEduIndex, 'degree', e.target.value)}
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder={q.education.degreePlaceholder}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{q.education.field}</label>
                  <input
                    type="text"
                    value={edu.field_of_study}
                    onChange={(e) => updateArrayItem('education', selectedEduIndex, 'field_of_study', e.target.value)}
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder={q.education.fieldPlaceholder}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{q.education.startDate}</label>
                  <input
                    type="month"
                    value={edu.start_date}
                    onChange={(e) => updateArrayItem('education', selectedEduIndex, 'start_date', e.target.value)}
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{q.education.endDate}</label>
                  <input
                    type="month"
                    value={edu.end_date}
                    onChange={(e) => updateArrayItem('education', selectedEduIndex, 'end_date', e.target.value)}
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{q.education.description}</label>
                <textarea
                  value={edu.description}
                  onChange={(e) => updateArrayItem('education', selectedEduIndex, 'description', e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                  placeholder={q.education.descriptionPlaceholder}
                />
              </div>
            </div>
          </div>
        );

      case 'skills':
        return (
          <div className="space-y-8">
            {/* Header with Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {lang === 'es' ? 'Habilidades' : 'Skills'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {lang === 'es' ? 'Añade tus competencias técnicas y profesionales' : 'Add your technical and professional skills'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={selectedSkillIndex}
                  onChange={(e) => setSelectedSkillIndex(Number(e.target.value))}
                  className="px-4 py-2 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                  {formData.skills.map((s, idx) => (
                    <option key={idx} value={idx}>{s.name || `${q.skills.label} ${idx + 1}`}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    addArrayItem('skills', { name: '', level: '', years_of_experience: 0, percentage: null });
                    setSelectedSkillIndex(formData.skills.length);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all flex items-center gap-2"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span className="hidden sm:inline">{lang === 'es' ? 'Añadir' : 'Add'}</span>
                </button>
                {formData.skills.length > 1 && (
                  <button
                    onClick={() => {
                      removeArrayItem('skills', selectedSkillIndex);
                      setSelectedSkillIndex(Math.max(0, selectedSkillIndex - 1));
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium shadow-md hover:shadow-lg transition-all"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {q.skills.skill} <span className="text-red-500">{q.required}</span>
                  </label>
                  <input
                    type="text"
                    value={skill.name}
                    onChange={(e) => updateArrayItem('skills', selectedSkillIndex, 'name', e.target.value)}
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder={q.skills.skillPlaceholder}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{q.skills.level}</label>
                  <select
                    value={skill.level}
                    onChange={(e) => updateArrayItem('skills', selectedSkillIndex, 'level', e.target.value)}
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    <option value="">{q.skills.levelSelect}</option>
                    <option value={q.skills.levelBasic}>{q.skills.levelBasic}</option>
                    <option value={q.skills.levelIntermediate}>{q.skills.levelIntermediate}</option>
                    <option value={q.skills.levelAdvanced}>{q.skills.levelAdvanced}</option>
                    <option value={q.skills.levelExpert}>{q.skills.levelExpert}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{q.skills.years}</label>
                  <input
                    type="number"
                    value={skill.years_of_experience}
                    onChange={(e) => updateArrayItem('skills', selectedSkillIndex, 'years_of_experience', Number(e.target.value))}
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    min="0"
                    max="50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {lang === 'es' ? 'Nivel de dominio (%)' : 'Proficiency Level (%)'}
                </label>
                <input
                  type="range"
                  value={skill.percentage || 0}
                  onChange={(e) => updateArrayItem('skills', selectedSkillIndex, 'percentage', Number(e.target.value))}
                  min="0"
                  max="100"
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <span>0%</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{skill.percentage || 0}%</span>
                  <span>100%</span>
                </div>
                {skill.percentage !== null && skill.percentage !== undefined && skill.percentage > 0 && (
                  <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${skill.percentage}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'languages':
        const COMMON_LANGUAGES = [
          'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Chinese', 'Japanese',
          'Korean', 'Arabic', 'Russian', 'Hindi', 'Dutch', 'Swedish', 'Norwegian', 'Danish', 'Finnish',
        ];
        const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native'] as const;

        return (
          <div className="space-y-8">
            {/* Header with Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {lang === 'es' ? 'Idiomas' : 'Languages'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {lang === 'es' ? 'Indica los idiomas que dominas' : 'Indicate the languages you speak'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={selectedLangIndex}
                  onChange={(e) => setSelectedLangIndex(Number(e.target.value))}
                  className="px-4 py-2 text-sm border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                  {formData.languages.map((l, idx) => (
                    <option key={idx} value={idx}>{l.name || `${q.languages.label} ${idx + 1}`}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    addArrayItem('languages', { name: '', level: 'B2', percentage: null });
                    setSelectedLangIndex(formData.languages.length);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium shadow-md hover:shadow-lg transform hover:scale-105 transition-all flex items-center gap-2"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span className="hidden sm:inline">{lang === 'es' ? 'Añadir' : 'Add'}</span>
                </button>
                {formData.languages.length > 1 && (
                  <button
                    onClick={() => {
                      removeArrayItem('languages', selectedLangIndex);
                      setSelectedLangIndex(Math.max(0, selectedLangIndex - 1));
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium shadow-md hover:shadow-lg transition-all"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {q.languages.language} <span className="text-red-500">{q.required}</span>
                  </label>
                  <select
                    value={language.name}
                    onChange={(e) => updateArrayItem('languages', selectedLangIndex, 'name', e.target.value)}
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    <option value="">{q.languages.languagePlaceholder}</option>
                    {COMMON_LANGUAGES.map((langName) => (
                      <option key={langName} value={langName}>{langName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {q.languages.level} <span className="text-red-500">{q.required}</span>
                  </label>
                  <select
                    value={language.level}
                    onChange={(e) => updateArrayItem('languages', selectedLangIndex, 'level', e.target.value)}
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    {CEFR_LEVELS.map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {lang === 'es' ? 'Nivel de dominio (%)' : 'Proficiency Level (%)'}
                </label>
                <input
                  type="range"
                  value={language.percentage || 0}
                  onChange={(e) => updateArrayItem('languages', selectedLangIndex, 'percentage', Number(e.target.value))}
                  min="0"
                  max="100"
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <span>0%</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{language.percentage || 0}%</span>
                  <span>100%</span>
                </div>
                {language.percentage !== null && language.percentage !== undefined && language.percentage > 0 && (
                  <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${language.percentage}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Preview Section */}
              {language.name && language.level && (
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    {lang === 'es' ? 'Vista previa' : 'Preview'}
                  </h4>
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-base">{language.name}</h4>
                        <span className={`inline-block mt-1 px-2 py-1 rounded text-xs ${
                          language.level === 'Native' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                          language.level === 'C2' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          language.level === 'C1' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                          language.level === 'B2' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          language.level === 'B1' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          language.level === 'A2' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }`}>
                          {language.level}
                        </span>
                      </div>
                    </div>
                    {language.percentage !== null && language.percentage !== undefined && language.percentage > 0 && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                          <span>{lang === 'es' ? 'Nivel de dominio' : 'Proficiency level'}</span>
                          <span>{language.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${language.percentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-8">
            {/* Header */}
            <div className="pb-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {lang === 'es' ? 'Preferencias Laborales' : 'Work Preferences'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {lang === 'es' ? 'Indica tus preferencias de trabajo' : 'Indicate your work preferences'}
              </p>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{q.preferences.availability}</label>
                  <select
                    value={formData.availability}
                    onChange={(e) => updateFormData('availability', e.target.value)}
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    <option value="">{q.preferences.availabilitySelect}</option>
                    <option value={q.preferences.availabilityImmediate}>{q.preferences.availabilityImmediate}</option>
                    <option value={q.preferences.availability1Week}>{q.preferences.availability1Week}</option>
                    <option value={q.preferences.availability2Weeks}>{q.preferences.availability2Weeks}</option>
                    <option value={q.preferences.availability1Month}>{q.preferences.availability1Month}</option>
                    <option value={q.preferences.availabilityMore}>{q.preferences.availabilityMore}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{q.preferences.workMode}</label>
                  <select
                    value={formData.work_mode}
                    onChange={(e) => updateFormData('work_mode', e.target.value)}
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    <option value="">{q.preferences.workModeSelect}</option>
                    <option value={q.preferences.workModeRemote}>{q.preferences.workModeRemote}</option>
                    <option value={q.preferences.workModeOnsite}>{q.preferences.workModeOnsite}</option>
                    <option value={q.preferences.workModeHybrid}>{q.preferences.workModeHybrid}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{q.preferences.expectedSalary}</label>
                  <input
                    type="text"
                    value={formData.expected_salary}
                    onChange={(e) => updateFormData('expected_salary', e.target.value)}
                    className="w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder={q.preferences.expectedSalaryPlaceholder}
                  />
                </div>
                <div className="flex items-center h-full pt-8">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="relocation-willing"
                      checked={formData.relocation_willing}
                      onChange={(e) => updateFormData('relocation_willing', e.target.checked)}
                      className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="relocation-willing" className="text-sm font-medium text-gray-700 dark:text-gray-300">{q.preferences.relocationWilling}</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'template':
        return (
          <div className="space-y-8">
            {/* Header */}
            <div className="pb-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {lang === 'es' ? 'Elige tu Plantilla' : 'Choose Your Template'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {lang === 'es' ? 'Selecciona el diseño que mejor represente tu estilo profesional' : 'Select the design that best represents your professional style'}
              </p>
            </div>

            {/* Template Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto max-h-[500px] pr-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => updateFormData('template_id', template.id)}
                  className={`cursor-pointer border-3 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                    formData.template_id === template.id
                      ? 'border-blue-600 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 shadow-2xl ring-4 ring-blue-200 dark:ring-blue-800'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 shadow-lg bg-white dark:bg-gray-800'
                  }`}
                >
                  {/* Preview Image */}
                  <div className="relative w-full aspect-[3/4] bg-gray-100 dark:bg-gray-700">
                    <img
                      src={template.previewImg}
                      alt={lang === 'es' ? template.name.es : template.name.en}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback si la imagen no carga
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    {formData.template_id === template.id && (
                      <div className="absolute top-2 right-2">
                        <CheckCircleIcon className="h-8 w-8 text-blue-600 bg-white rounded-full" />
                      </div>
                    )}
                    {template.isPro && (
                      <div className="absolute top-2 left-2">
                        <span className="inline-block text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full font-bold shadow-md">
                          ✨ PRO
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Template Info */}
                  <div className="p-4">
                    <div className="text-base font-bold text-gray-900 dark:text-white mb-2">
                      {lang === 'es' ? template.name.es : template.name.en}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {lang === 'es'
                        ? template.isPro
                          ? 'Diseño premium con características avanzadas'
                          : 'Diseño profesional y elegante'
                        : template.isPro
                          ? 'Premium design with advanced features'
                          : 'Professional and elegant design'
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Modern Header with Progress */}
      <div className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Section Title with Icon */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg transform hover:scale-105 transition-transform">
                {section.icon}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{section.name}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {q.progress.step} {currentSection + 1} {q.progress.of} {SECTIONS.length} • {progress}% {lang === 'es' ? 'completado' : 'complete'}
                </p>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={onComplete}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={lang === 'es' ? 'Cerrar' : 'Close'}
            >
              <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="relative">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-500 ease-out shadow-sm"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Step Indicators */}
            <div className="flex justify-between mt-4">
              {SECTIONS.map((s, idx) => (
                <div
                  key={s.id}
                  className="flex flex-col items-center gap-2"
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg transition-all duration-300 ${
                      idx === currentSection
                        ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg scale-110'
                        : idx < currentSection
                        ? 'bg-green-500 text-white shadow-md'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    {idx < currentSection ? '✓' : s.icon}
                  </div>
                  <span className={`text-xs font-medium ${
                    idx === currentSection
                      ? 'text-blue-600 dark:text-blue-400'
                      : idx < currentSection
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    {s.name.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 px-6 py-4 rounded-lg flex items-start gap-3 shadow-sm">
            <svg className="h-6 w-6 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-red-700 dark:text-red-300 flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 text-xl font-bold">×</button>
          </div>
        </div>
      )}

      {isCorrectingText && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="bg-purple-50 dark:bg-purple-900/30 border-l-4 border-purple-500 px-6 py-4 rounded-lg flex items-center gap-3 shadow-sm">
            <SparklesIcon className="h-6 w-6 text-purple-600 animate-spin" />
            <span className="text-sm text-purple-700 dark:text-purple-300 font-medium">{q.messages.optimizing}</span>
          </div>
        </div>
      )}

      {/* Content Area - Modern Card Design */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 md:p-12">
            {renderSectionContent()}
          </div>
        </div>
      </div>

      {/* Modern Bottom Navigation */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentSection === 0}
            className="flex items-center gap-3 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed font-semibold transition-all shadow-md hover:shadow-lg"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span>{q.navigation.previous}</span>
          </button>

          <div className="flex-1 max-w-md mx-8">
            <div className="flex gap-2 justify-center">
              {SECTIONS.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx <= currentSection ? 'w-12 bg-gradient-to-r from-blue-600 to-purple-600' : 'w-8 bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>

          <button
            onClick={handleNext}
            disabled={!isCurrentSectionValid() || isProcessing}
            className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed font-semibold transition-all shadow-md hover:shadow-xl transform hover:scale-105"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                <span>{q.navigation.saving}</span>
              </>
            ) : currentSection === SECTIONS.length - 1 ? (
              <>
                <span>{q.navigation.finish}</span>
                <CheckCircleIcon className="h-5 w-5" />
              </>
            ) : (
              <>
                <span>{q.navigation.next}</span>
                <ArrowRightIcon className="h-5 w-5" />
              </>
            )}
          </button>
        </div>
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

