import React, { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { useTranslations } from '../hooks/useTranslations';
import { Profile, Service, Stat, PortfolioItem, Skill } from '../types';
import { CVQuestionnaire } from './CVQuestionnaire';
import AIReviewStep from './AIReviewStep';
import { supabase } from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';


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

interface AIGuidedCVBuilderProps {
    profile: Profile | null;
    onClose: () => void;
    refetchProfile: () => Promise<void>;
}


const AIGuidedCVBuilder: React.FC<AIGuidedCVBuilderProps> = ({ profile, onClose, refetchProfile }) => {
    const t = useTranslations();
    const { user } = useAuth();
    const [step, setStep] = useState(1); // 1: Questionnaire, 2: AI Review
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cvData, setCvData] = useState<CVData>({
        fullName: profile?.full_name || '',
        headline: profile?.headline || '',
        summary: profile?.summary || '',
        experience: [],
        education: [],
        skills: [],
        services: [],
        stats: [],
        portfolioItems: []
    });

    const handleQuestionnaireComplete = async (answers: any) => {
        setIsLoading(true);
        setError(null);
        
        if (!process.env.API_KEY) {
            setError(t.aiBuilder.apiKeyError);
            setIsLoading(false);
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = t.aiBuilder.questionnairePrompt(answers);
            
            const responseSchema = {
                type: Type.OBJECT,
                properties: {
                    summary: { type: Type.STRING },
                    experience_bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
                    services: { 
                        type: Type.ARRAY, 
                        items: { 
                            type: Type.OBJECT, 
                            properties: { 
                                title: { type: Type.STRING }, 
                                description: { type: Type.STRING } 
                            },
                            required: ['title', 'description']
                        } 
                    },
                    stats: { 
                        type: Type.ARRAY, 
                        items: { 
                            type: Type.OBJECT, 
                            properties: { 
                                label: { type: Type.STRING }, 
                                value: { type: Type.STRING } 
                            },
                            required: ['label', 'value']
                        } 
                    },
                    portfolio_items: { 
                        type: Type.ARRAY, 
                        items: { 
                            type: Type.OBJECT, 
                            properties: { 
                                title: { type: Type.STRING }, 
                                category: { type: Type.STRING } 
                            },
                            required: ['title', 'category']
                        } 
                    },
                    skills: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                percentage: { type: Type.INTEGER }
                            },
                            required: ['name', 'percentage']
                        }
                    }
                },
                required: ['summary', 'experience_bullets', 'services', 'stats', 'portfolio_items', 'skills']
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: responseSchema,
                },
            });
            
            const jsonText = response.text.trim();
            const generatedData = JSON.parse(jsonText);
            
            setCvData({
                fullName: answers.fullName || profile?.full_name || 'Your Name',
                headline: answers.headline || profile?.headline || 'Your Headline',
                summary: generatedData.summary,
                experience: [{
                    title: answers.jobTitle,
                    company: answers.company,
                    bullets: generatedData.experience_bullets
                }],
                education: [{
                    degree: answers.degree,
                    institution: answers.institution
                }],
                skills: generatedData.skills || [],
                services: generatedData.services || [],
                stats: generatedData.stats || [],
                portfolioItems: generatedData.portfolio_items || []
            });

            setStep(2); // Move to review step

        } catch (e: any) {
            setError(`${t.aiBuilder.generalError} ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveAndClose = async (editedData: { summary: string; bullets: string[] }) => {
        if (!user) {
            setError("User not found. Cannot save.");
            return;
        }
        setIsLoading(true);
        setError(null);
        
        try {
            const { id: userId } = user;

            // 1. Update profile with summary, name, headline
            const { error: profileError } = await supabase.from('profiles').update({
                summary: editedData.summary,
                full_name: cvData.fullName,
                headline: cvData.headline
            }).eq('id', userId);
            if (profileError) throw profileError;

            // 2. Clear old data and insert new data for related tables
            const deletePromises = [
                supabase.from('experiences').delete().eq('profile_id', userId),
                supabase.from('education').delete().eq('profile_id', userId),
                supabase.from('skills').delete().eq('profile_id', userId),
                supabase.from('services').delete().eq('profile_id', userId),
                supabase.from('stats').delete().eq('profile_id', userId),
                supabase.from('portfolio_items').delete().eq('profile_id', userId),
            ];
            await Promise.all(deletePromises);

            // 3. Prepare and insert new data
            const insertPromises = [];
            
            // Experience
            if (cvData.experience.length > 0) {
                const exp = cvData.experience[0];
                insertPromises.push(supabase.from('experiences').insert({
                    profile_id: userId,
                    title: exp.title,
                    company_name: exp.company,
                    description: editedData.bullets.join('\n'),
                    start_date: new Date().toISOString().split('T')[0] // Placeholder date
                }));
            }
            
            // Education
            if (cvData.education.length > 0) {
                 const edu = cvData.education[0];
                 insertPromises.push(supabase.from('education').insert({
                    profile_id: userId,
                    degree: edu.degree,
                    institution_name: edu.institution,
                    start_date: new Date().toISOString().split('T')[0] // Placeholder date
                 }));
            }

            // Skills, Services, Stats, Portfolio
            if (cvData.skills.length > 0) insertPromises.push(supabase.from('skills').insert(cvData.skills.map(s => ({ ...s, profile_id: userId }))));
            if (cvData.services.length > 0) insertPromises.push(supabase.from('services').insert(cvData.services.map(s => ({ ...s, profile_id: userId }))));
            if (cvData.stats.length > 0) insertPromises.push(supabase.from('stats').insert(cvData.stats.map(s => ({ ...s, profile_id: userId }))));
            if (cvData.portfolioItems.length > 0) insertPromises.push(supabase.from('portfolio_items').insert(cvData.portfolioItems.map(p => ({ ...p, profile_id: userId }))));

            await Promise.all(insertPromises);
            
            await refetchProfile();
            onClose();

        } catch (e: any) {
            setError(`${t.aiBuilder.generalError} ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <CVQuestionnaire
                        onComplete={handleQuestionnaireComplete}
                        isLoading={isLoading}
                        error={error}
                        profile={profile}
                    />
                );
            case 2:
                return (
                    <AIReviewStep
                        cvData={cvData}
                        onComplete={handleSaveAndClose}
                        isSaving={isLoading}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="bg-cv-light-gray dark:bg-dark-bg-primary text-cv-dark-gray dark:text-dark-text-primary rounded-lg overflow-hidden max-h-[95vh] h-[95vh] w-[95vw] max-w-6xl flex flex-col">
            {renderStep()}
        </div>
    );
};

export default AIGuidedCVBuilder;