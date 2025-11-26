/**
 * AI Text Optimizer Component
 *
 * Muestra sugerencias de mejora con IA para textos (experiencias, educación, etc.)
 * El usuario puede aceptar o rechazar cada sugerencia
 */

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { optimizeExperience, optimizeEducation } from '../../lib/ai';
import {
  SparklesIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowPathIcon,
  LightBulbIcon,
} from '@heroicons/react/24/solid';

interface OptimizationSuggestion {
  id: string;
  title: string;
  originalText: string;
  optimizedText: string;
  originalAchievements?: string[];
  optimizedAchievements?: string[];
  status: 'pending' | 'accepted' | 'rejected';
}

interface AITextOptimizerProps {
  type: 'experience' | 'education';
  items: Array<{
    id?: string;
    title?: string;
    position?: string;
    company_name?: string;
    degree?: string;
    institution_name?: string;
    field_of_study?: string;
    description?: string;
    achievements?: string[] | null;
  }>;
  onApplySuggestion: (itemId: string, optimizedText: string, optimizedAchievements?: string[]) => Promise<void>;
}

const AITextOptimizer: React.FC<AITextOptimizerProps> = ({ type, items, onApplySuggestion }) => {
  const { session } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  /**
   * Convert markdown to HTML
   */
  const parseMarkdown = (text: string): string => {
    if (!text) return '';

    // Split by lines to process
    const lines = text.split('\n');
    const processedLines: string[] = [];
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Check if this is a bullet point
      if (line.trim().startsWith('* ')) {
        if (!inList) {
          processedLines.push('<ul class="list-disc ml-5 space-y-2 my-3">');
          inList = true;
        }
        const content = line.trim().substring(2);
        // Apply bold formatting to content - make it more visible
        const formattedContent = content.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>');
        processedLines.push(`<li class="leading-relaxed">${formattedContent}</li>`);
      } else {
        // Close list if we were in one
        if (inList) {
          processedLines.push('</ul>');
          inList = false;
        }

        // Apply bold formatting to regular lines
        if (line.trim()) {
          const formattedLine = line.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>');
          processedLines.push(`<p class="leading-relaxed mb-2">${formattedLine}</p>`);
        } else {
          // Empty lines create spacing
          if (processedLines.length > 0 && !processedLines[processedLines.length - 1].includes('<br')) {
            processedLines.push('<br />');
          }
        }
      }
    }

    // Close list if still open
    if (inList) {
      processedLines.push('</ul>');
    }

    return processedLines.join('\n');
  };

  const analyzeSuggestions = async () => {
    if (!session?.user.id || items.length === 0) {
      setError(`Necesitas al menos 1 ${type === 'experience' ? 'experiencia' : 'educación'} para obtener sugerencias`);
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setSuggestions([]);

    try {
      const newSuggestions: OptimizationSuggestion[] = [];

      for (const item of items) {
        if (!item.description || item.description.trim().length === 0) continue;

        let response;
        let title = '';

        if (type === 'experience') {
          title = `${item.position || 'Sin título'} - ${item.company_name || 'Sin empresa'}`;
          response = await optimizeExperience(
            item.position || '',
            item.company_name || '',
            item.description,
            session.user.id,
            item.achievements || undefined
          );

          if (response.success && response.data) {
            newSuggestions.push({
              id: item.id || `temp-${Math.random()}`,
              title,
              originalText: item.description,
              optimizedText: response.data.description,
              originalAchievements: item.achievements || [],
              optimizedAchievements: response.data.achievements,
              status: 'pending',
            });
          }
          continue; // Skip the generic processing below
        } else {
          title = `${item.degree || 'Sin título'} - ${item.institution_name || 'Sin institución'}`;
          response = await optimizeEducation(
            item.degree || '',
            item.institution_name || '',
            item.field_of_study || item.degree || '',
            item.description,
            session.user.id
          );
        }

        if (response.success && response.data) {
          newSuggestions.push({
            id: item.id || `temp-${Math.random()}`,
            title,
            originalText: item.description,
            optimizedText: response.data,
            status: 'pending',
          });
        }
      }

      if (newSuggestions.length === 0) {
        setError('No se pudieron generar sugerencias. Asegúrate de tener descripciones en tus registros.');
      } else {
        setSuggestions(newSuggestions);
      }
    } catch (err) {
      console.error('Error generating suggestions:', err);
      setError('Error al generar sugerencias. Por favor, intenta de nuevo.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAccept = async (suggestion: OptimizationSuggestion) => {
    setApplyingId(suggestion.id);
    try {
      await onApplySuggestion(
        suggestion.id,
        suggestion.optimizedText,
        suggestion.optimizedAchievements
      );
      setSuggestions(prev =>
        prev.map(s => (s.id === suggestion.id ? { ...s, status: 'accepted' as const } : s))
      );
    } catch (error) {
      console.error('Error applying suggestion:', error);
      setError('Error al aplicar la sugerencia');
    } finally {
      setApplyingId(null);
    }
  };

  const handleReject = (suggestion: OptimizationSuggestion) => {
    setSuggestions(prev =>
      prev.map(s => (s.id === suggestion.id ? { ...s, status: 'rejected' as const } : s))
    );
  };

  if (items.length === 0) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <LightBulbIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
              Sugerencias de IA no disponibles
            </h4>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Agrega al menos 1 {type === 'experience' ? 'experiencia laboral' : 'educación'} con descripción para que la IA pueda optimizarla.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-700 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SparklesIcon className="w-7 h-7 text-purple-600 dark:text-purple-400" />
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Optimización con IA
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {items.length} {type === 'experience' ? 'experiencia(s)' : 'educación(es)'} para analizar
            </p>
          </div>
        </div>

        <button
          onClick={analyzeSuggestions}
          disabled={isAnalyzing}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 dark:bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-700 dark:hover:bg-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? (
            <>
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
              Analizando...
            </>
          ) : suggestions.length > 0 ? (
            <>
              <ArrowPathIcon className="w-5 h-5" />
              Regenerar Sugerencias
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

      {/* Loading State */}
      {isAnalyzing && (
        <div className="text-center py-12">
          <div className="relative inline-block mb-4">
            <SparklesIcon className="w-16 h-16 text-purple-600 dark:text-purple-400 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <ArrowPathIcon className="w-8 h-8 text-purple-800 dark:text-purple-300 animate-spin" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Analizando con IA...
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Optimizando tus descripciones para hacerlas más impactantes
          </p>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && !isAnalyzing && (
        <div className="space-y-4">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className={`bg-white dark:bg-dark-bg-secondary rounded-lg border-2 p-6 transition-all ${
                suggestion.status === 'accepted'
                  ? 'border-green-300 dark:border-green-700'
                  : suggestion.status === 'rejected'
                  ? 'border-gray-300 dark:border-gray-700 opacity-50'
                  : 'border-purple-300 dark:border-purple-700'
              }`}
            >
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                {suggestion.title}
              </h4>

              {/* Original Text */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Descripción Original:
                </label>
                <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4 border border-gray-200 dark:border-dark-border">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {suggestion.originalText}
                  </p>
                </div>
              </div>

              {/* Original Achievements */}
              {suggestion.originalAchievements && suggestion.originalAchievements.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Logros Originales:
                  </label>
                  <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4 border border-gray-200 dark:border-dark-border">
                    <ul className="space-y-1">
                      {suggestion.originalAchievements.map((achievement, idx) => (
                        <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                          <span>•</span>
                          <span>{achievement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Arrow */}
              <div className="flex justify-center mb-4">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-full p-2">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              </div>

              {/* Optimized Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-green-600 dark:text-green-400 mb-2 flex items-center gap-2">
                  <SparklesIcon className="w-4 h-4" />
                  Descripción Optimizada por IA:
                </label>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-2 border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div
                    className="text-sm text-gray-800 dark:text-gray-200 prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: parseMarkdown(suggestion.optimizedText)
                    }}
                  />
                </div>
              </div>

              {/* Optimized Achievements */}
              {suggestion.optimizedAchievements && suggestion.optimizedAchievements.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-purple-600 dark:text-purple-400 mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Logros Clave Optimizados:
                  </label>
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 border-2 border-purple-200 dark:border-purple-800 rounded-lg p-4">
                    <ul className="space-y-2">
                      {suggestion.optimizedAchievements.map((achievement, idx) => {
                        // Remove ** from achievement text and render as bold
                        const formattedAchievement = achievement.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>');
                        return (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-800 dark:text-gray-200">
                            <span className="text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0">✓</span>
                            <span
                              className="font-medium"
                              dangerouslySetInnerHTML={{ __html: formattedAchievement }}
                            />
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {suggestion.status === 'pending' && (
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => handleReject(suggestion)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors font-medium"
                  >
                    Rechazar
                  </button>
                  <button
                    onClick={() => handleAccept(suggestion)}
                    disabled={applyingId === suggestion.id}
                    className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
                  >
                    {applyingId === suggestion.id ? (
                      <>
                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                        Aplicando...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-5 h-5" />
                        Aceptar y Aplicar
                      </>
                    )}
                  </button>
                </div>
              )}

              {suggestion.status === 'accepted' && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold justify-end">
                  <CheckCircleIcon className="w-6 h-6" />
                  <span>Cambios aplicados</span>
                </div>
              )}

              {suggestion.status === 'rejected' && (
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-medium justify-end">
                  <XMarkIcon className="w-5 h-5" />
                  <span>Rechazado</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {suggestions.length === 0 && !isAnalyzing && !error && (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">
          <LightBulbIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Haz clic en "Generar Sugerencias" para optimizar tus descripciones con IA</p>
        </div>
      )}
    </div>
  );
};

export default AITextOptimizer;
