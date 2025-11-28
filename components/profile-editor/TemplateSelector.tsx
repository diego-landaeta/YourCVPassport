import React, { useState, useEffect } from 'react';
import { templates } from '../templates/templateData';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslations } from '../../hooks/useTranslations';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToastContext } from '../../context/ToastContext';
import PassportTemplate from '../templates/PassportTemplate';
import ClassicTemplate from '../templates/ClassicTemplate';
import ModernProfessionalTemplate from '../templates/ModernProfessionalTemplate';
import CorporateClassicTemplate from '../templates/CorporateClassicTemplate';
import CreativeMinimalistTemplate from '../templates/CreativeMinimalistTemplate';
import AcademicStandardTemplate from '../templates/AcademicStandardTemplate';
import YellowMinimalistTemplate from '../templates/YellowMinimalistTemplate';
import BlueGradientTemplate from '../templates/BlueGradientTemplate';
import CoralPinkTemplate from '../templates/CoralPinkTemplate';
import GreenMinimalTemplate from '../templates/GreenMinimalTemplate';
import CreativeOrangeTemplate from '../templates/CreativeOrangeTemplate';
import ClassicSidebarTemplate from '../templates/ClassicSidebarTemplate';
import ModernCleanTemplate from '../templates/ModernCleanTemplate';
import ElegantMinimalTemplate from '../templates/ElegantMinimalTemplate';
import ProfessionalBlueTemplate from '../templates/ProfessionalBlueTemplate';
import CreativeModernTemplate from '../templates/CreativeModernTemplate';
import ModernMinimalistTemplate from '../templates/ModernMinimalistTemplate';
import CreativeBoldTemplate from '../templates/CreativeBoldTemplate';
import ProfessionalClassicTemplate from '../templates/ProfessionalClassicTemplate';
import HealthcareProfessionalTemplate from '../templates/HealthcareProfessionalTemplate';

interface TemplateSelectorProps {
  currentTemplate?: string;
  onTemplateChange: (templateId: string) => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ currentTemplate, onTemplateChange }) => {
  const { session, profile } = useAuth();
  const translations = useTranslations();
  const { lang } = useLanguage();
  const toast = useToastContext();
  const t = translations.dashboard.cards.templateSelector;
  const [selectedTemplate, setSelectedTemplate] = useState(currentTemplate || 'classic');
  const [isSaving, setIsSaving] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load profile data with all related information
  useEffect(() => {
    const loadProfileData = async () => {
      if (!session?.user.id || !profile) {
        setLoading(false);
        return;
      }

      try {
        const [
          { data: expData },
          { data: eduData },
          { data: skillsData },
          { data: portfolioData },
        ] = await Promise.all([
          supabase.from('experiences').select('*').eq('profile_id', session.user.id).order('start_date', { ascending: false }),
          supabase.from('education').select('*').eq('profile_id', session.user.id).order('start_date', { ascending: false }),
          supabase.from('skills').select('*').eq('profile_id', session.user.id),
          supabase.from('portfolio_items').select('*').eq('profile_id', session.user.id),
        ]);

        setProfileData({
          profile: profile,
          experiences: expData || [],
          education: eduData || [],
          skills: skillsData || [],
          services: [],
          stats: [],
          portfolioItems: portfolioData || [],
        });
      } catch (error) {setProfileData({
          profile: profile,
          experiences: [],
          education: [],
          skills: [],
          services: [],
          stats: [],
          portfolioItems: [],
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [session, profile]);

  const handleTemplateSelect = async (templateId: string) => {
    setSelectedTemplate(templateId);
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ template: templateId })
        .eq('id', session?.user.id);

      if (error) throw error;

      onTemplateChange(templateId);
    } catch (error) {toast.error('Failed to update template');
    } finally {
      setIsSaving(false);
    }
  };

  const getTemplateComponent = (templateId: string) => {
    if (!profileData) return null;

    const data = {
      profile: profileData.profile || {},
      experiences: profileData.experiences || [],
      education: profileData.education || [],
      skills: profileData.skills || [],
      services: [],
      stats: [],
      portfolioItems: profileData.portfolio || [],
      certifications: [],
      languages: [],
    };

    switch (templateId) {
      case 'passport':
        return <PassportTemplate data={data} />;
      case 'classic':
        return <ClassicTemplate data={data} />;
      case 'modern-professional':
        return <ModernProfessionalTemplate data={data} />;
      case 'corporate-classic':
        return <CorporateClassicTemplate data={data} />;
      case 'creative-minimalist':
        return <CreativeMinimalistTemplate data={data} />;
      case 'academic-standard':
        return <AcademicStandardTemplate data={data} />;
      case 'minimalist-yellow':
        return <YellowMinimalistTemplate data={data} />;
      case 'gradient-blue':
        return <BlueGradientTemplate data={data} />;
      case 'coral-pink':
        return <CoralPinkTemplate data={data} />;
      case 'green-minimal':
        return <GreenMinimalTemplate data={data} />;
      case 'creative-orange':
        return <CreativeOrangeTemplate data={data} />;
      case 'classic-sidebar':
        return <ClassicSidebarTemplate data={data} />;
      case 'modern-clean':
        return <ModernCleanTemplate data={data} />;
      case 'elegant-minimal':
        return <ElegantMinimalTemplate data={data} />;
      case 'professional-blue':
        return <ProfessionalBlueTemplate data={data} />;
      case 'creative-modern':
        return <CreativeModernTemplate data={data} />;
      case 'modern-minimalist':
        return <ModernMinimalistTemplate data={data} />;
      case 'creative-bold':
        return <CreativeBoldTemplate data={data} />;
      case 'professional-classic':
        return <ProfessionalClassicTemplate data={data} />;
      case 'healthcare-professional':
        return <HealthcareProfessionalTemplate data={data} />;
      default:
        return <PassportTemplate data={data} />;
    }
  };

  const userPlan = profile?.plan || 'free';
  // Check for pro/premium (case-insensitive) or any plan that's not 'free'
  const isPro = userPlan && userPlan.toLowerCase() !== 'free' && userPlan.toLowerCase() !== 'basic';

  if (loading) {
    return (
      <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cv-blue"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-sm p-6">
        {/* Upgrade Prompt */}
        {!isPro && (
          <div className="mb-8 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <svg className="w-10 h-10 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {t.upgradeTitle}
                </h4>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {t.upgradeDescription(templates.filter(t => t.isPro).length)}
                </p>
                <a
                  href="/pricing"
                  className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-colors"
                >
                  {t.upgradeCta}
                  <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {templates.map((template) => {
            const isLocked = template.isPro && !isPro;
            const isSelected = selectedTemplate === template.id;

            return (
              <div
                key={template.id}
                className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                  isSelected
                    ? 'border-cv-blue shadow-lg'
                    : 'border-gray-200 dark:border-dark-border hover:border-cv-blue'
                } ${isLocked ? 'opacity-60' : ''}`}
              >
                {/* Template Preview - Static Image with Click to Preview */}
                <div
                  className="aspect-[3/4] bg-white dark:bg-dark-bg-tertiary relative overflow-hidden cursor-pointer group"
                  onClick={() => !isLocked && setPreviewTemplate(template.id)}
                >
                  <img
                    src={template.previewImg}
                    alt={template.name[lang]}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white text-center">
                      <svg className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <p className="text-sm font-semibold">{t.previewHover}</p>
                    </div>
                  </div>

                  {/* Lock Overlay */}
                  {isLocked && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="text-center text-white">
                        <svg className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <p className="text-sm font-semibold">{t.proPlan}</p>
                      </div>
                    </div>
                  )}

                  {/* Selected Badge */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-cv-blue text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 z-10">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {t.selected}
                    </div>
                  )}

                  {/* Pro Badge */}
                  {template.isPro && !isLocked && (
                    <div className="absolute top-2 left-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded text-xs font-semibold z-10">
                      {t.proLabel}
                    </div>
                  )}
                </div>

                {/* Template Info & Action */}
                <div className="p-4 bg-white dark:bg-dark-bg-secondary space-y-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-center">
                    {template.name[lang]}
                  </h3>
                  {!isLocked && (
                    <button
                      onClick={() => handleTemplateSelect(template.id)}
                      disabled={isSelected}
                      className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                        isSelected
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                          : 'bg-cv-blue hover:bg-opacity-90 text-white'
                      }`}
                    >
                      {isSelected ? t.currentTemplate : t.useTemplate}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {isSaving && (
          <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            {t.savingTemplate}
          </div>
        )}
      </div>

      {/* Full Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
          <div className="relative bg-white dark:bg-dark-bg-secondary rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-dark-bg-secondary border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between z-10">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t.previewModalTitle(templates.find(t => t.id === previewTemplate)?.name[lang] || '')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t.previewModalSubtitle}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    handleTemplateSelect(previewTemplate);
                    setPreviewTemplate(null);
                  }}
                  className="px-4 py-2 bg-cv-blue hover:bg-opacity-90 text-white rounded-lg font-medium transition-colors"
                >
                  {t.useTemplate}
                </button>
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body - Scrollable Preview */}
            <div className="overflow-y-auto max-h-[calc(90vh-80px)] bg-gray-100 dark:bg-gray-900 p-8">
              <div className="max-w-4xl mx-auto bg-white dark:bg-dark-bg-secondary shadow-xl">
                {getTemplateComponent(previewTemplate)}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TemplateSelector;

