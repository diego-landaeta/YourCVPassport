import React, { useState } from 'react';
import { useTranslations } from '../../hooks/useTranslations';
import AITextOptimizer from './AITextOptimizer';
import { SparklesIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface AIImprovementStepProps {
  experiences: any[];
  education: any[];
  onSaveExperience: (data: any[]) => Promise<void>;
  onSaveEducation: (data: any[]) => Promise<void>;
  onComplete: () => void;
}

const AIImprovementStep: React.FC<AIImprovementStepProps> = ({
  experiences,
  education,
  onSaveExperience,
  onSaveEducation,
  onComplete
}) => {
  const t = useTranslations();
  const [activeTab, setActiveTab] = useState<'experience' | 'education'>('experience');

  const handleApplyExperienceSuggestion = async (itemId: string, optimizedText: string, optimizedAchievements?: string[]) => {
    const updatedExperiences = experiences.map(exp => {
      if (exp.id === itemId) {
        return {
          ...exp,
          description: optimizedText,
          achievements: optimizedAchievements || exp.achievements
        };
      }
      return exp;
    });
    await onSaveExperience(updatedExperiences);
  };

  const handleApplyEducationSuggestion = async (itemId: string, optimizedText: string) => {
    const updatedEducation = education.map(edu => {
      if (edu.id === itemId) {
        return {
          ...edu,
          description: optimizedText
        };
      }
      return edu;
    });
    await onSaveEducation(updatedEducation);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="inline-block p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-4">
          <SparklesIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t.profileEditor.aiImprovement.title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Nuestra inteligencia artificial analizará tus descripciones y sugerirá mejoras para hacer tu perfil más profesional y atractivo.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-6">
        <div className="bg-gray-100 dark:bg-dark-bg-tertiary p-1 rounded-lg inline-flex">
          <button
            onClick={() => setActiveTab('experience')}
            className={`px-6 py-2 rounded-md font-medium transition-all ${
              activeTab === 'experience'
                ? 'bg-white dark:bg-dark-bg-secondary text-cv-blue shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {t.profileEditor.aiImprovement.experienceTab}
          </button>
          <button
            onClick={() => setActiveTab('education')}
            className={`px-6 py-2 rounded-md font-medium transition-all ${
              activeTab === 'education'
                ? 'bg-white dark:bg-dark-bg-secondary text-cv-blue shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {t.profileEditor.aiImprovement.educationTab}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === 'experience' ? (
          <AITextOptimizer
            type="experience"
            items={experiences}
            onApplySuggestion={handleApplyExperienceSuggestion}
          />
        ) : (
          <AITextOptimizer
            type="education"
            items={education}
            onApplySuggestion={handleApplyEducationSuggestion}
          />
        )}
      </div>

      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 mt-8 flex items-start gap-4">
        <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
        <div>
          <h4 className="font-bold text-green-800 dark:text-green-300 mb-1">
            {t.profileEditor.aiImprovement.almostDone}
          </h4>
          <p className="text-sm text-green-700 dark:text-green-400">
            Revisa las sugerencias de la IA y aplícalas si te gustan. Cuando estés listo, haz clic en "Finalizar" para guardar todos los cambios y ver tu perfil completo.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIImprovementStep;
