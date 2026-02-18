import React, { useState } from 'react';
import { useTranslations } from '../../hooks/useTranslations';
import { useLanguage } from '../../contexts/LanguageContext';
import { CVData } from '../AIGuidedCVBuilder';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { templates } from '../templates/templateData';
import ClassicTemplate from '../templates/ClassicTemplate';
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
import UrbanTemplate from '../templates/UrbanTemplate';
import { FullProfileData, Skill } from '../../types';

interface TemplatePreviewStepProps {
    cvData: CVData;
    onClose: () => void;
}

// Convert CVData to FullProfileData for template components
const transformCvDataToProfileData = (cvData: CVData): FullProfileData => {
    return {
        profile: {
            id: '',
            full_name: cvData.fullName,
            headline: cvData.headline,
            summary: cvData.summary,
            slug: null,
            meta_title: null,
            meta_description: null,
            template: null,
            template_color: null,
        },
        experiences: cvData.experience.map(exp => ({
            profile_id: '',
            position: exp.title,
            company_name: exp.company,
            start_date: '2023-01-01', // Placeholder date
            end_date: null,
            description: exp.bullets.join('\n')
        })),
        education: cvData.education.map(edu => ({
            profile_id: '',
            institution_name: edu.institution,
            degree: edu.degree,
            field_of_study: '',
            start_date: '2019-01-01', // Placeholder date
            end_date: null,
            description: ''
        })),
        // FIX: The map function was incorrect. cvData.skills is already Skill[].
        skills: cvData.skills,
        certifications: [],
        languages: [],
        services: [],
        stats: [],
        portfolioItems: []
    };
};


const TemplatePreviewStep: React.FC<TemplatePreviewStepProps> = ({ cvData, onClose }) => {
    const t = useTranslations();
    const { lang } = useLanguage();
    const { user, refetchProfile } = useAuth();
    const [selectedTemplate, setSelectedTemplate] = useState(templates[0].id);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fullProfileData = transformCvDataToProfileData(cvData);

    const renderTemplatePreview = (templateId: string) => {
        const props = { data: fullProfileData, color: null };
        switch (templateId) {
            case 'classic': return <ClassicTemplate {...props} />;
            case 'minimalist-yellow': return <YellowMinimalistTemplate {...props} />;
            case 'gradient-blue': return <BlueGradientTemplate {...props} />;
            case 'coral-pink': return <CoralPinkTemplate {...props} />;
            case 'green-minimal': return <GreenMinimalTemplate {...props} />;
            case 'creative-orange': return <CreativeOrangeTemplate {...props} />;
            case 'classic-sidebar': return <ClassicSidebarTemplate {...props} />;
            case 'modern-clean': return <ModernCleanTemplate {...props} />;
            case 'elegant-minimal': return <ElegantMinimalTemplate {...props} />;
            case 'professional-blue': return <ProfessionalBlueTemplate {...props} />;
            case 'creative-modern': return <CreativeModernTemplate {...props} />;
            case 'modern-minimalist': return <ModernMinimalistTemplate {...props} />;
            case 'creative-bold': return <CreativeBoldTemplate {...props} />;
            case 'professional-classic': return <ProfessionalClassicTemplate {...props} />;
            case 'healthcare-professional': return <HealthcareProfessionalTemplate {...props} />;
            case 'urban': return <UrbanTemplate {...props} />;
            default: return <ClassicTemplate {...props} />;
        }
    };

    const handleSaveTemplate = async () => {
        if (!user) return;
        setIsSaving(true);
        setError(null);

        const updates = {
            full_name: cvData.fullName,
            headline: cvData.headline,
            summary: cvData.summary,
            template: selectedTemplate,
        };

        const { error: profileError } = await supabase.from('profiles').update(updates).eq('id', user.id);
        
        if (profileError) {
            setError(profileError.message);
            setIsSaving(false);
            return;
        }

        // TODO: Could also update experience, education, skills here if we want to overwrite them
        // For now, let's just update the profile info and template

        await refetchProfile();
        setIsSaving(false);
        setSaveSuccess(true);
        setTimeout(() => {
            onClose();
        }, 1500);
    };

    return (
        <div className="flex flex-col h-full p-8 md:p-12">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold dark:text-dark-text-primary">{t.aiBuilder.templates.title}</h2>
                <p className="text-gray-600 dark:text-dark-text-secondary">{t.aiBuilder.templates.subtitle}</p>
            </div>

            <div className="flex-grow grid grid-cols-12 gap-8 overflow-hidden">
                {/* Sidebar with template list */}
                <div className="col-span-3 overflow-y-auto pr-4 space-y-4 bg-white dark:bg-dark-bg-secondary p-4 rounded-lg shadow-sm border dark:border-dark-border">
                    {templates.map(template => (
                        <div
                            key={template.id}
                            onClick={() => setSelectedTemplate(template.id)}
                            className={`rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${selectedTemplate === template.id ? 'border-cv-blue' : 'border-gray-200 dark:border-dark-border hover:border-gray-400'}`}
                        >
                            <img src={template.previewImg} alt={template.name[lang]} className="w-full h-auto" />
                            <p className="text-sm font-semibold p-2 bg-gray-100 dark:bg-dark-bg-tertiary text-center text-cv-dark-gray dark:text-dark-text-primary">{template.name[lang]}</p>
                        </div>
                    ))}
                </div>

                {/* Main preview area */}
                <div className="col-span-9 bg-gray-200 rounded-lg overflow-y-auto p-4">
                    <div className="w-full bg-white shadow-lg">
                         {renderTemplatePreview(selectedTemplate)}
                    </div>
                </div>
            </div>

             <div className="flex justify-between items-center mt-8">
                <button onClick={onClose} className="text-gray-600 dark:text-dark-text-secondary font-semibold hover:text-cv-dark-gray dark:hover:text-white transition-colors">Close</button>
                <div>
                    {error && <p className="text-red-500 text-sm mr-4">{error}</p>}
                    <button
                        onClick={handleSaveTemplate}
                        disabled={isSaving || saveSuccess}
                        className="bg-cv-blue hover:bg-opacity-90 text-white font-bold py-3 px-8 rounded-lg disabled:opacity-50 transition-colors"
                    >
                        {isSaving ? t.aiBuilder.templates.saving : (saveSuccess ? t.aiBuilder.templates.saveSuccess : t.aiBuilder.templates.saveButton)}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TemplatePreviewStep;