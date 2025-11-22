/**
 * AI Skills Suggestion Component
 *
 * Sugiere habilidades faltantes basadas en las experiencias del usuario
 * usando inteligencia artificial (Gemini)
 */

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase/client';
import { suggestSkills } from '../../lib/ai';
import {
  SparklesIcon,
  PlusCircleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  LightBulbIcon,
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestedSkills, setSuggestedSkills] = useState<string[]>([]);
  const [addedSkills, setAddedSkills] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isAddingSkill, setIsAddingSkill] = useState<string | null>(null);

  const analyzeSuggestSkills = async () => {
    if (!session?.user.id || experiences.length === 0) {
      setError('Necesitas al menos 1 experiencia laboral para obtener sugerencias');
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
    } catch (err) {
      console.error('Error suggesting skills:', err);
      setError('Error al generar sugerencias de habilidades');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addSkill = async (skillName: string) => {
    if (!session?.user.id) return;

    setIsAddingSkill(skillName);
    try {
      const { error } = await supabase.from('skills').insert({
        profile_id: session.user.id,
        skill_name: skillName,
        proficiency_level: 'intermediate', // Default level
      });

      if (error) throw error;

      // Mark as added
      setAddedSkills(prev => new Set(prev).add(skillName));

      // Callback
      onSkillAdded?.();
    } catch (error) {
      console.error('Error adding skill:', error);
      setError(`Error al agregar habilidad: ${skillName}`);
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
              Sugerencias de habilidades no disponibles
            </h4>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Agrega al menos 1 experiencia laboral para que la IA pueda sugerir habilidades
              relevantes basadas en tu trayectoria profesional.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Analyze Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SparklesIcon className="w-7 h-7 text-purple-600 dark:text-purple-400" />
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-dark-text-primary">
              Sugerencias de Habilidades con IA
            </h3>
            <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
              Basadas en tus {experiences.length} experiencia(s) laboral(es)
            </p>
          </div>
        </div>

        <button
          onClick={analyzeSuggestSkills}
          disabled={isAnalyzing}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 dark:bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-700 dark:hover:bg-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? (
            <>
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
              Analizando...
            </>
          ) : (
            <>
              <SparklesIcon className="w-5 h-5" />
              Generar Sugerencias
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
            Habilidades Sugeridas ({suggestedSkills.length})
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
                      Agregada
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
                          Agregando...
                        </>
                      ) : (
                        <>
                          <PlusCircleIcon className="w-4 h-4" />
                          Agregar
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
              💡 <strong>Tip:</strong> Estas habilidades fueron identificadas automáticamente
              basándose en tus experiencias. Revisa y agrega las que realmente dominas.
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isAnalyzing && suggestedSkills.length === 0 && !error && (
        <div className="text-center py-12 bg-gray-50 dark:bg-dark-bg-secondary rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
          <LightBulbIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No hay sugerencias aún
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Haz clic en "Generar Sugerencias" para obtener habilidades relevantes
          </p>
        </div>
      )}
    </div>
  );
};

export default AISkillsSuggestion;
