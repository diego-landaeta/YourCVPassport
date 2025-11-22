import React, { useState } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import { Profile } from '../types';

interface CVQuestionnaireProps {
    onComplete: (answers: any) => void;
    isLoading: boolean;
    error: string | null;
    profile: Profile | null;
}

export const CVQuestionnaire: React.FC<CVQuestionnaireProps> = ({ onComplete, isLoading, error, profile }) => {
    const t = useTranslations();
    const questions = t.aiBuilder.questionnaire.steps;
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState(() => {
        const initialAnswers: { [key: string]: string } = {};
        questions.forEach(q => {
            if (q.key === 'fullName' && profile?.full_name) {
                initialAnswers[q.key] = profile.full_name;
            } else if (q.key === 'headline' && profile?.headline) {
                initialAnswers[q.key] = profile.headline;
            } else {
                initialAnswers[q.key] = '';
            }
        });
        return initialAnswers;
    });

    const handleNext = () => {
        if (currentStep < questions.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onComplete(answers);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setAnswers({ ...answers, [questions[currentStep].key]: e.target.value });
    };

    const progress = ((currentStep + 1) / questions.length) * 100;
    const currentQuestion = questions[currentStep];

    return (
        <div className="flex flex-col h-full p-8 md:p-12 bg-white dark:bg-dark-bg-secondary w-full max-w-3xl mx-auto my-auto rounded-lg shadow-xl">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-8 h-8 bg-cv-blue rounded-md"></div>
                <h2 className="text-xl font-bold dark:text-dark-text-primary">{t.aiBuilder.questionnaire.title}</h2>
            </div>

            <div className="mb-8">
                <p className="text-sm text-gray-500 dark:text-dark-text-tertiary mb-2">Question {currentStep + 1} of {questions.length}</p>
                <div className="w-full bg-gray-200 dark:bg-dark-bg-tertiary rounded-full h-1.5">
                    <div className="bg-cv-blue h-1.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.3s ease-in-out' }}></div>
                </div>
            </div>

            <div className="flex-grow flex flex-col justify-center">
                <h3 className="text-2xl md:text-3xl font-semibold mb-6 dark:text-dark-text-primary">
                    {currentQuestion.question}
                </h3>
                {currentQuestion.type === 'textarea' ? (
                    <textarea
                        value={answers[currentQuestion.key]}
                        onChange={handleInputChange}
                        placeholder={currentQuestion.placeholder}
                        rows={5}
                        className="bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg p-4 text-lg w-full focus:ring-2 focus:ring-cv-blue focus:border-cv-blue focus:outline-none transition-all dark:text-dark-text-primary"
                    />
                ) : (
                    <input
                        type="text"
                        value={answers[currentQuestion.key]}
                        onChange={handleInputChange}
                        placeholder={currentQuestion.placeholder}
                        className="bg-white dark:bg-dark-bg-tertiary border border-gray-300 dark:border-dark-border rounded-lg p-4 text-lg w-full focus:ring-2 focus:ring-cv-blue focus:border-cv-blue focus:outline-none transition-all dark:text-dark-text-primary"
                    />
                )}

                {error && <p className="text-red-500 mt-4">{error}</p>}
            </div>

            <div className="flex justify-between items-center mt-8">
                <button
                    onClick={handleBack}
                    disabled={currentStep === 0 || isLoading}
                    className="text-gray-600 dark:text-dark-text-secondary font-semibold hover:text-gray-900 dark:hover:text-white disabled:opacity-50 transition-colors"
                >
                    {t.aiBuilder.questionnaire.back}
                </button>
                <button
                    onClick={handleNext}
                    disabled={isLoading || !answers[currentQuestion.key]}
                    className="bg-cv-blue hover:bg-opacity-90 text-white font-bold py-3 px-8 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? t.aiBuilder.questionnaire.generating : (currentStep === questions.length - 1 ? t.aiBuilder.questionnaire.finish : t.aiBuilder.questionnaire.next)}
                </button>
            </div>
        </div>
    );
};