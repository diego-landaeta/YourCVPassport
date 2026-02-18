/**
 * AI Skills Suggestion Component
 *
 * Sugiere habilidades faltantes basadas en las experiencias del usuario
 * usando inteligencia artificial (Gemini)
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslations } from '../../hooks/useTranslations';
import { useLanguage } from '../../contexts/LanguageContext';
import { supabase } from '../../supabase/client';
import { suggestSkills, checkAIAccess } from '../../lib/ai';
import { useNavigate } from 'react-router-dom';
import {
  SparklesIcon,
  PlusCircleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  LightBulbIcon,
  LockClosedIcon,
} from '@heroicons/react/24/solid';

interface AISkillsSuggestionProps {
  experiences?: Array<{ title: string; company_name: string; description: string }>;
  currentSkills?: string[];
  onSkillAdded?: () => void;
}

const AISkillsSuggestion: React.FC<AISkillsSuggestionProps> = ({
  experiences = [],
  currentSkills = [],
  onSkillAdded,
}) => {
  const { session } = useAuth();
  const t = useTranslations();
  const aiS = t.aiSkillsSuggestion;
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([]);
  const [addedSkills, setAddedSkills] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isAddingSkill, setIsAddingSkill] = useState<string | null>(null);
  const [hasAutoAnalyzed, setHasAutoAnalyzed] = useState(false);
  const [aiAccessInfo, setAiAccessInfo] = useState<{ hasAccess: boolean; plan: string | null; remaining?: number | 'unlimited' } | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  // Check AI access on mount
  useEffect(() => {
    const checkAccess = async () => {
      if (!session?.user.id) {
        setIsCheckingAccess(false);
        return;
      }
      try {
        const accessInfo = await checkAIAccess(session.user.id);
        setAiAccessInfo(accessInfo);
      } catch (err) {
        console.error('Error checking AI access:', err);
      } finally {
        setIsCheckingAccess(false);
      }
    };
    checkAccess();
  }, [session?.user.id]);

  const analyzeSuggestSkills = async () => {
    if (!session?.user.id || experiences.length === 0) {
      setError(aiS.needExperience);
      return;
    }

    // Check if user has AI access
    const accessInfo = await checkAIAccess(session.user.id);
    setAiAccessInfo(accessInfo);

    if (!accessInfo.hasAccess) {
      // Don't set error, show upgrade banner instead
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await suggestSkills(
        experiences.map(exp => ({
          title: exp.title,
          company: exp.company_name,
          description: exp.description || '',
        })),
        currentSkills,
        session.user.id
      );

      if (!response.success || !response.data) {
        setError(response.error || 'Error al generar sugerencias');
        return;
      }

      setSuggestedSkills(response.data);
      setHasAutoAnalyzed(true);
    } catch (err) {setError('Error al generar sugerencias de habilidades');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ✅ Auto-analizar al montar el componente si hay experiencias y tiene acceso
  useEffect(() => {
    if (!hasAutoAnalyzed && experiences.length > 0 && session?.user.id && aiAccessInfo?.hasAccess && !isCheckingAccess) {
      analyzeSuggestSkills();
    }
  }, [experiences.length, session?.user.id, aiAccessInfo?.hasAccess, isCheckingAccess]);

  const addSkill = async (skillName: string) => {
    if (!session?.user.id) return;

    setIsAddingSkill(skillName);
    try {
      const { error } = await supabase.from('skills').insert({
        profile_id: session.user.id,
        name: skillName,
        level: 'INTERMEDIATE', // Default level
        percentage: 50, // Default percentage
      });

      if (error) throw error;

      // Mark as added
      setAddedSkills(prev => new Set(prev).add(skillName));

      // Callback para notificar al componente padre
      onSkillAdded?.();
    } catch (error) {setError(`Error al agregar habilidad: ${skillName}`);
    } finally {
      setIsAddingSkill(null);
    }
  };

  if (!experiences || experiences.length === 0) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <LightBulbIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
              {aiS.notAvailableTitle}
            </h4>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              {aiS.notAvailableDesc}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show premium upgrade banner if no access
  if (!isCheckingAccess && aiAccessInfo && !aiAccessInfo.hasAccess) {
    const planName = aiAccessInfo.plan || 'Free';
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <SparklesIcon className="w-7 h-7 text-purple-600 dark:text-purple-400" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text-primary">
                {t.profileEditor.aiSkills.title}
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                IA
              </span>
            </div>
          </div>
        </div>

        {/* Premium Required Banner */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-2 border-amber-200 dark:border-amber-700 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-800">
              <LockClosedIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-amber-900 dark:text-amber-200">
                {aiS.premiumFeature}
              </h4>
              <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
                {aiS.premiumSkillsDesc(planName)}
              </p>

              {/* Benefits */}
              <ul className="mt-4 space-y-2">
                <li className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                  <SparklesIcon className="h-4 w-4" />
                  {aiS.autoSkillDetection}
                </li>
                <li className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                  <SparklesIcon className="h-4 w-4" />
                  {aiS.industryRecommendations}
                </li>
                <li className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                  <SparklesIcon className="h-4 w-4" />
                  {aiS.oneClickAdd}
                </li>
              </ul>

              <button
                onClick={() => navigate('/pricing')}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-200 dark:shadow-amber-900/30 transition-all hover:from-amber-600 hover:to-orange-600"
              >
                {aiS.upgradeToPro}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Usage Limit Info */}
      {aiAccessInfo && aiAccessInfo.remaining !== 'unlimited' && typeof aiAccessInfo.remaining === 'number' && (
        <div className={`rounded-lg p-3 border ${
          aiAccessInfo.remaining === 0
            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
            : aiAccessInfo.remaining <= 5
            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700'
            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm ${
              aiAccessInfo.remaining === 0
                ? 'text-red-800 dark:text-red-200'
                : 'text-gray-700 dark:text-gray-300'
            }`}>
              {aiS.aiRequestsRemaining(aiAccessInfo.remaining)}
            </span>
            {aiAccessInfo.remaining <= 5 && (
              <button
                onClick={() => navigate('/pricing')}
                className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {aiS.getUnlimited}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Header & Analyze Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SparklesIcon className="w-7 h-7 text-purple-600 dark:text-purple-400" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text-primary">
                {t.profileEditor.aiSkills.title}
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                IA
              </span>
              {aiAccessInfo?.remaining === 'unlimited' && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                  {t.aiPremium.unlimited}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
              {aiS.basedOnExperiences(experiences.length)}
            </p>
          </div>
        </div>

        <button
          onClick={analyzeSuggestSkills}
          disabled={isAnalyzing || (aiAccessInfo?.remaining === 0)}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
            aiAccessInfo?.remaining === 0
              ? 'bg-gray-400 cursor-not-allowed text-gray-200'
              : 'bg-purple-600 dark:bg-purple-500 text-white hover:bg-purple-700 dark:hover:bg-purple-600'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isAnalyzing ? (
            <>
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
              {aiS.analyzingWithAi}
            </>
          ) : aiAccessInfo?.remaining === 0 ? (
            <>
              <LockClosedIcon className="w-5 h-5" />
              {aiS.limitReached}
            </>
          ) : hasAutoAnalyzed ? (
            <>
              <ArrowPathIcon className="w-5 h-5" />
              {aiS.regenerateSuggestions}
            </>
          ) : (
            <>
              <SparklesIcon className="w-5 h-5" />
              {aiS.generateSuggestions}
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Suggested Skills */}
      {suggestedSkills.length > 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-4 flex items-center gap-2">
            <LightBulbIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            {t.profileEditor.aiSkills.suggested} ({suggestedSkills.length})
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suggestedSkills.map((skill, index) => {
              const isAdded = addedSkills.has(skill);
              const isAdding = isAddingSkill === skill;

              return (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white/60 dark:bg-gray-800/60 rounded-lg p-4 border border-purple-200 dark:border-purple-700"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-dark-text-primary">
                      {skill}
                    </p>
                  </div>

                  {isAdded ? (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium text-sm">
                      <CheckCircleIcon className="w-5 h-5" />
                      {aiS.added}
                    </div>
                  ) : (
                    <button
                      onClick={() => addSkill(skill)}
                      disabled={isAdding}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAdding ? (
                        <>
                          <ArrowPathIcon className="w-4 h-4 animate-spin" />
                          {aiS.adding}
                        </>
                      ) : (
                        <>
                          <PlusCircleIcon className="w-4 h-4" />
                          {aiS.add}
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 text-sm text-gray-600 dark:text-dark-text-secondary">
            <p>
              <strong>{aiS.tip}</strong> {aiS.tipText}
            </p>
          </div>
        </div>
      )}

      {/* Empty State - Loading */}
      {isAnalyzing && suggestedSkills.length === 0 && (
        <div className="text-center py-12 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border-2 border-purple-200 dark:border-purple-700">
          <div className="relative inline-block mb-4">
            <SparklesIcon className="w-16 h-16 text-purple-600 dark:text-purple-400 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <ArrowPathIcon className="w-8 h-8 text-purple-800 dark:text-purple-300 animate-spin" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {aiS.analyzingExperiences}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {aiS.aiIdentifyingSkills}
          </p>
        </div>
      )}

      {/* Empty State - No Suggestions Yet */}
      {!isAnalyzing && suggestedSkills.length === 0 && !error && hasAutoAnalyzed && (
        <div className="text-center py-12 bg-gray-50 dark:bg-dark-bg-secondary rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
          <LightBulbIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {aiS.noNewSkillsFound}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {aiS.noNewSkillsDesc}
          </p>
        </div>
      )}
    </div>
  );
};

export default AISkillsSuggestion;

