import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { useTranslations } from '../hooks/useTranslations';

const CoverLetterGenerator: React.FC = () => {
    const t = useTranslations();
    const generator = t.aiPage.coverLetterGenerator;
    const [jobDescription, setJobDescription] = useState('');
    const [userCV, setUserCV] = useState('');
    const [generatedLetter, setGeneratedLetter] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!jobDescription || !userCV) {
            setError(generator.errors.missingFields);
            return;
        }
        if (!process.env.API_KEY) {
            setError(generator.errors.apiKey);
            return;
        }
        
        setIsLoading(true);
        setError(null);
        setGeneratedLetter('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const prompt = `Based on the following CV and job description, write a professional and compelling cover letter. The tone should be confident but not arrogant. Highlight the most relevant skills and experience from the CV that match the job description.

            **My CV:**
            ---
            ${userCV}
            ---

            **Job Description:**
            ---
            ${jobDescription}
            ---
            
            **Generated Cover Letter:**
            `;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            const letter = response.text;

            if (letter) {
                setGeneratedLetter(letter);
            } else {
                setError('The generated cover letter was empty. Please try again.');
            }

        } catch (e: any) {
            setError('An error occurred while generating the cover letter. Please try again. ' + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="bg-cv-light-gray dark:bg-dark-bg-primary py-20 px-4">
            <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700">
                <h2 className="text-3xl font-bold text-cv-dark-gray dark:text-dark-text-primary text-center mb-2">{generator.title}</h2>
                <p className="text-center text-gray-600 dark:text-dark-text-secondary mb-8">{generator.subtitle}</p>

                <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <label htmlFor="job-description" className="block text-lg font-semibold text-gray-700 dark:text-dark-text-secondary mb-2">{generator.jobDescription.label}</label>
                        <textarea
                            id="job-description"
                            rows={10}
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder={generator.jobDescription.placeholder}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-cv-blue focus:border-cv-blue transition-shadow shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
                        />
                    </div>
                     <div>
                        <label htmlFor="user-cv" className="block text-lg font-semibold text-gray-700 dark:text-dark-text-secondary mb-2">{generator.cvSummary.label}</label>
                        <textarea
                            id="user-cv"
                            rows={10}
                            value={userCV}
                            onChange={(e) => setUserCV(e.target.value)}
                            placeholder={generator.cvSummary.placeholder}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-cv-blue focus:border-cv-blue transition-shadow shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
                        />
                    </div>
                </div>

                <div className="text-center mt-8">
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="bg-cv-blue text-white px-10 py-4 rounded-lg text-lg font-semibold hover:bg-opacity-90 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? generator.generating : generator.generateButton}
                    </button>
                </div>

                {error && <p className="text-red-500 mt-6 text-center">{error}</p>}

                {generatedLetter && (
                    <div className="mt-10 border-t border-gray-200 dark:border-gray-600 pt-8">
                        <h3 className="text-2xl font-bold text-cv-dark-gray dark:text-white mb-4">{generator.resultTitle}</h3>
                        <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-md border border-gray-200 dark:border-gray-600 prose max-w-none">
                            <pre className="whitespace-pre-wrap font-sans text-gray-900 dark:text-white">{generatedLetter}</pre>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default CoverLetterGenerator;