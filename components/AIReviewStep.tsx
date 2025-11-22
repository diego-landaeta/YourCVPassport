import React, { useState } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { CVData } from './AIGuidedCVBuilder';

interface AIReviewStepProps {
    cvData: CVData;
    onComplete: (editedData: { summary: string; bullets: string[] }) => void;
    isSaving: boolean;
}

const ReadOnlySection: React.FC<{title: string; children: React.ReactNode}> = ({ title, children }) => (
    <div>
        <h3 className="block text-lg font-semibold mb-2 dark:text-dark-text-primary">{title}</h3>
        <div className="bg-gray-100 dark:bg-dark-bg-tertiary/50 border border-gray-200 dark:border-dark-border rounded-lg p-3 text-sm w-full dark:text-dark-text-secondary space-y-2">
            {children}
        </div>
    </div>
);

const AIReviewStep: React.FC<AIReviewStepProps> = ({ cvData, onComplete, isSaving }) => {
    const t = useTranslations();
    const [summary, setSummary] = useState(cvData.summary);
    const initialBullets = cvData.experience.length > 0 ? cvData.experience[0].bullets : [];
    const [experienceText, setExperienceText] = useState(initialBullets.map(b => `• ${b}`).join('\n'));

    const handleContinue = () => {
        const bullets = experienceText.split('\n').map(b => b.replace(/^•\s*/, '').trim()).filter(b => b);
        onComplete({ summary, bullets });
    };

    return (
        <div className="flex flex-col h-full p-8 md:p-12 bg-white dark:bg-dark-bg-secondary max-w-4xl mx-auto my-auto rounded-lg shadow-xl w-full">
            <h2 className="text-2xl font-bold mb-2 dark:text-dark-text-primary">{t.aiBuilder.review.title}</h2>
            <p className="text-gray-600 dark:text-dark-text-secondary mb-8">{t.aiBuilder.review.subtitle}</p>

            <div className="flex-grow overflow-y-auto space-y-6 pr-4">
                <div>
                    <label className="block text-lg font-semibold mb-2 dark:text-dark-text-primary">{t.aiBuilder.review.summaryLabel}</label>
                    <textarea
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        rows={5}
                        className="bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg p-3 text-base w-full focus:ring-2 focus:ring-cv-blue focus:border-cv-blue focus:outline-none transition-all dark:text-dark-text-primary"
                    />
                </div>
                <div>
                    <label className="block text-lg font-semibold mb-2 dark:text-dark-text-primary">{t.aiBuilder.review.experienceLabel}</label>
                    <textarea
                        value={experienceText}
                        onChange={(e) => setExperienceText(e.target.value)}
                        rows={8}
                        className="bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg p-3 text-base w-full focus:ring-2 focus:ring-cv-blue focus:border-cv-blue focus:outline-none transition-all dark:text-dark-text-primary"
                        placeholder="• Achievement 1..."
                    />
                    <p className="text-xs text-gray-500 dark:text-dark-text-tertiary mt-1">Edit each bullet point on a new line, starting with '•'.</p>
                </div>
                
                {cvData.skills && cvData.skills.length > 0 && (
                     <ReadOnlySection title="Skills Preview">
                        {cvData.skills.map(s => <p key={s.name}><strong>{s.name}:</strong> {s.percentage}% proficiency</p>)}
                    </ReadOnlySection>
                )}

                {cvData.services && cvData.services.length > 0 && (
                    <ReadOnlySection title="Services Preview">
                        {cvData.services.map(s => <p key={s.title}><strong>{s.title}:</strong> {s.description}</p>)}
                    </ReadOnlySection>
                )}

                 {cvData.stats && cvData.stats.length > 0 && (
                    <ReadOnlySection title="Stats Preview">
                        {cvData.stats.map(s => <p key={s.label}><strong>{s.value}</strong> {s.label}</p>)}
                    </ReadOnlySection>
                )}

                {cvData.portfolioItems && cvData.portfolioItems.length > 0 && (
                    <ReadOnlySection title="Portfolio Preview">
                        {cvData.portfolioItems.map(p => <p key={p.title}><strong>{p.title}</strong> ({p.category})</p>)}
                    </ReadOnlySection>
                )}
            </div>

            <div className="flex justify-end mt-8">
                <button
                    onClick={handleContinue}
                    disabled={isSaving}
                    className="bg-cv-blue hover:bg-opacity-90 text-white font-bold py-3 px-8 rounded-lg transition-colors disabled:opacity-50"
                >
                    {isSaving ? "Saving..." : "Save & Update Profile"}
                </button>
            </div>
        </div>
    );
};

export default AIReviewStep;