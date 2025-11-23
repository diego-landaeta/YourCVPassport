import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase/client';
import { useTranslations } from '../../hooks/useTranslations';
import {
  SparklesIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/solid';

interface AIAssistantSectionProps {
  onSaveStatusChange?: (message: string, timestamp?: string) => void;
}

interface SuggestionItem {
  id: string;
  type: 'summary' | 'experience' | 'education';
  originalText: string;
  improvedText: string;
  applied: boolean;
  itemId?: string;
  field?: string;
}

const AIAssistantSection: React.FC<AIAssistantSectionProps> = ({ onSaveStatusChange }) => {
  const { profile, session } = useAuth();
  const t = useTranslations();
  const aiT = t.aiAssistantSection;
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [selectedTab, setSelectedTab] = useState<'summary' | 'experience' | 'education'>('summary');
  const [isApplying, setIsApplying] = useState<string | null>(null);

  // @ts-ignore
  const apiKey = import.meta.env?.VITE_GOOGLE_AI_API_KEY || '';
  const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

  useEffect(() => {
    if (!apiKey) {
      console.warn('⚠️ API Key de Google AI NO configurada');
    }
  }, [apiKey]);

  const analyzeSummary = async () => {
    if (!profile?.summary || !genAI) return;

    setIsAnalyzing(true);
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `Actúa como un experto en recursos humanos y redacción de CVs profesionales.

Analiza el siguiente resumen profesional y mejóralo para hacerlo más atractivo para empleadores:

TEXTO ORIGINAL:
${profile.summary}

INSTRUCCIONES:
- Mejora la redacción para que sea más profesional y convincente
- Usa verbos de acción y logros cuantificables cuando sea posible
- Mantén un tono profesional pero cercano
- Resalta habilidades y experiencias clave
- Optimiza para sistemas ATS (Applicant Tracking Systems)
- La longitud debe ser similar al original (2-4 líneas)
- Devuelve SOLO el texto mejorado, sin explicaciones adicionales`;

      const result = await model.generateContent(prompt);
      const improvedText = result.response.text().trim();

      const newSuggestion: SuggestionItem = {
        id: 'summary',
        type: 'summary',
        originalText: profile.summary,
        improvedText,
        applied: false,
      };

      setSuggestions(prev => {
        const filtered = prev.filter(s => s.id !== 'summary');
        return [...filtered, newSuggestion];
      });
    } catch (error) {
      console.error('Error analyzing summary:', error);
      if (onSaveStatusChange) {
        onSaveStatusChange(aiT.errors.analyzingSummary);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeExperiences = async () => {
    if (!session?.user.id || !genAI) return;

    setIsAnalyzing(true);
    try {
      // Cargar experiencias del usuario
      const { data: experiences, error } = await supabase
        .from('experiences')
        .select('*')
        .eq('profile_id', session.user.id)
        .order('start_date', { ascending: false });

      if (error) throw error;
      if (!experiences || experiences.length === 0) {
        if (onSaveStatusChange) {
          onSaveStatusChange(aiT.errors.noExperiences);
        }
        setIsAnalyzing(false);
        return;
      }

      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const newSuggestions: SuggestionItem[] = [];

      // Analizar cada experiencia
      for (const exp of experiences) {
        if (!exp.description) continue;

        const prompt = `Actúa como un experto en recursos humanos y redacción de CVs profesionales.

Mejora la siguiente descripción de experiencia laboral:

PUESTO: ${exp.title}
EMPRESA: ${exp.company_name}
DESCRIPCIÓN ORIGINAL:
${exp.description}

INSTRUCCIONES:
- Mejora la redacción para destacar logros y responsabilidades
- Usa verbos de acción al inicio de cada punto
- Cuantifica logros cuando sea posible (%, números, resultados)
- Mantén un formato claro con bullets points si corresponde
- Optimiza para sistemas ATS
- Devuelve SOLO el texto mejorado, sin explicaciones adicionales`;

        const result = await model.generateContent(prompt);
        const improvedText = result.response.text().trim();

        newSuggestions.push({
          id: `exp-${exp.id}`,
          type: 'experience',
          originalText: exp.description,
          improvedText,
          applied: false,
          itemId: exp.id,
          field: 'description',
        });
      }

      setSuggestions(prev => {
        const filtered = prev.filter(s => s.type !== 'experience');
        return [...filtered, ...newSuggestions];
      });
    } catch (error) {
      console.error('Error analyzing experiences:', error);
      if (onSaveStatusChange) {
        onSaveStatusChange(aiT.errors.analyzingExperiences);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeEducation = async () => {
    if (!session?.user.id || !genAI) return;

    setIsAnalyzing(true);
    try {
      // Cargar educación del usuario
      const { data: education, error } = await supabase
        .from('education')
        .select('*')
        .eq('profile_id', session.user.id)
        .order('start_date', { ascending: false });

      if (error) throw error;
      if (!education || education.length === 0) {
        if (onSaveStatusChange) {
          onSaveStatusChange(aiT.errors.noEducation);
        }
        setIsAnalyzing(false);
        return;
      }

      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const newSuggestions: SuggestionItem[] = [];

      // Analizar cada educación que tenga descripción
      for (const edu of education) {
        if (!edu.description) continue;

        const prompt = `Actúa como un experto en recursos humanos y redacción de CVs profesionales.

Mejora la siguiente descripción de educación:

TÍTULO: ${edu.degree}
INSTITUCIÓN: ${edu.institution_name}
CAMPO: ${edu.field_of_study}
DESCRIPCIÓN ORIGINAL:
${edu.description}

INSTRUCCIONES:
- Mejora la redacción para destacar logros académicos y proyectos relevantes
- Menciona honores, reconocimientos o proyectos destacados
- Mantén un tono profesional
- Devuelve SOLO el texto mejorado, sin explicaciones adicionales`;

        const result = await model.generateContent(prompt);
        const improvedText = result.response.text().trim();

        newSuggestions.push({
          id: `edu-${edu.id}`,
          type: 'education',
          originalText: edu.description,
          improvedText,
          applied: false,
          itemId: edu.id,
          field: 'description',
        });
      }

      setSuggestions(prev => {
        const filtered = prev.filter(s => s.type !== 'education');
        return [...filtered, ...newSuggestions];
      });
    } catch (error) {
      console.error('Error analyzing education:', error);
      if (onSaveStatusChange) {
        onSaveStatusChange(aiT.errors.analyzingEducation);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applySuggestion = async (suggestion: SuggestionItem) => {
    if (!session?.user.id) return;

    setIsApplying(suggestion.id);
    try {
      if (suggestion.type === 'summary') {
        // Aplicar mejora al resumen profesional
        const { error } = await supabase
          .from('profiles')
          .update({ summary: suggestion.improvedText, updated_at: new Date().toISOString() })
          .eq('id', session.user.id);

        if (error) throw error;
      } else if (suggestion.type === 'experience' && suggestion.itemId) {
        // Aplicar mejora a experiencia laboral
        const { error } = await supabase
          .from('experiences')
          .update({ description: suggestion.improvedText })
          .eq('id', suggestion.itemId);

        if (error) throw error;
      } else if (suggestion.type === 'education' && suggestion.itemId) {
        // Aplicar mejora a educación
        const { error } = await supabase
          .from('education')
          .update({ description: suggestion.improvedText })
          .eq('id', suggestion.itemId);

        if (error) throw error;
      }

      // Marcar como aplicado
      setSuggestions(prev =>
        prev.map(s => (s.id === suggestion.id ? { ...s, applied: true } : s))
      );

      if (onSaveStatusChange) {
        onSaveStatusChange(aiT.success.applied, new Date().toISOString());
      }

      // Recargar la página después de 1 segundo para ver los cambios
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error applying suggestion:', error);
      if (onSaveStatusChange) {
        onSaveStatusChange(aiT.errors.applyingSuggestion);
      }
    } finally {
      setIsApplying(null);
    }
  };

  const handleAnalyze = () => {
    if (selectedTab === 'summary') {
      analyzeSummary();
    } else if (selectedTab === 'experience') {
      analyzeExperiences();
    } else if (selectedTab === 'education') {
      analyzeEducation();
    }
  };

  const filteredSuggestions = suggestions.filter(s => s.type === selectedTab);

  if (!apiKey || !genAI) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-2xl p-8 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-800/30 rounded-full flex items-center justify-center">
                <SparklesIcon className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-yellow-900 dark:text-yellow-200 mb-3">
                🤖 {aiT.notConfigured.title}
              </h3>
              <p className="text-yellow-800 dark:text-yellow-300 mb-4 text-lg">
                {aiT.notConfigured.description}
              </p>
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
                  {aiT.notConfigured.whatCanYouDo}
                </h4>
                <ul className="space-y-2 text-yellow-800 dark:text-yellow-300">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 dark:text-yellow-400">✓</span>
                    <span>{aiT.notConfigured.alternatives.editManually}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 dark:text-yellow-400">✓</span>
                    <span>{aiT.notConfigured.alternatives.useTemplates}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-600 dark:text-yellow-400">✓</span>
                    <span>{aiT.notConfigured.alternatives.exportPDF}</span>
                  </li>
                </ul>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                <strong>{aiT.notConfigured.adminNote}:</strong> <code className="bg-yellow-200 dark:bg-yellow-800 px-2 py-1 rounded">VITE_GOOGLE_AI_API_KEY</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-dark-bg-secondary rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-cv-blue to-purple-600 p-3 rounded-xl shadow-lg">
              <SparklesIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {aiT.title}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {aiT.subtitle}
              </p>
            </div>
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cv-blue to-purple-600 text-white rounded-lg font-semibold hover:from-cv-blue/90 hover:to-purple-600/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {isAnalyzing ? (
              <>
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
                {aiT.analyzingButton}
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5" />
                {aiT.analyzeButton}
              </>
            )}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-t border-gray-200 dark:border-dark-border pt-4">
          <button
            onClick={() => setSelectedTab('summary')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
              selectedTab === 'summary'
                ? 'bg-gradient-to-r from-cv-blue to-purple-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-dark-bg-tertiary text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <DocumentTextIcon className="w-5 h-5" />
            {aiT.tabs.summary}
          </button>
          <button
            onClick={() => setSelectedTab('experience')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
              selectedTab === 'experience'
                ? 'bg-gradient-to-r from-cv-blue to-purple-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-dark-bg-tertiary text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <BriefcaseIcon className="w-5 h-5" />
            {aiT.tabs.experience}
          </button>
          <button
            onClick={() => setSelectedTab('education')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
              selectedTab === 'education'
                ? 'bg-gradient-to-r from-cv-blue to-purple-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-dark-bg-tertiary text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <AcademicCapIcon className="w-5 h-5" />
            {aiT.tabs.education}
          </button>
        </div>
      </div>

      {/* Suggestions List */}
      {filteredSuggestions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-6 px-1">
            <div className="bg-gradient-to-br from-cv-blue/20 to-purple-600/20 dark:from-cv-blue/30 dark:to-purple-600/30 p-2 rounded-lg">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-cv-blue dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {aiT.suggestions.title} ({filteredSuggestions.length})
            </h3>
          </div>

          {filteredSuggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-xl p-6 shadow-sm hover:shadow-lg transition-all"
            >
              {/* Comparison View */}
              <div className="space-y-5">
                {/* Original Text */}
                <div>
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"></span>
                    {aiT.suggestions.originalText}
                  </h4>
                  <div className="p-4 bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg border border-gray-200 dark:border-dark-border">
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {suggestion.originalText}
                    </p>
                  </div>
                </div>

                {/* Improved Text */}
                <div>
                  <h4 className="text-xs font-bold text-green-600 dark:text-green-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                    <SparklesIcon className="w-4 h-4" />
                    {aiT.suggestions.improvedText}
                  </h4>
                  <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-2 border-green-200 dark:border-green-800/50 rounded-lg">
                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                      {suggestion.improvedText}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-dark-border flex justify-end">
                {suggestion.applied ? (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold">
                    <CheckCircleIcon className="w-6 h-6" />
                    <span>{aiT.suggestions.appliedSuccess}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => applySuggestion(suggestion)}
                    disabled={isApplying === suggestion.id}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-xl"
                  >
                    {isApplying === suggestion.id ? (
                      <>
                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                        {aiT.suggestions.applyingButton}
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-5 h-5" />
                        {aiT.suggestions.applyButton}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isAnalyzing && filteredSuggestions.length === 0 && (
        <div className="text-center py-20 bg-white dark:bg-dark-bg-secondary rounded-xl border-2 border-dashed border-gray-300 dark:border-dark-border shadow-sm">
          <div className="bg-gradient-to-br from-cv-blue/10 to-purple-600/10 dark:from-cv-blue/20 dark:to-purple-600/20 w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <SparklesIcon className="w-12 h-12 text-cv-blue dark:text-blue-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            {aiT.emptyState.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-lg mx-auto text-lg">
            {aiT.emptyState.description[selectedTab]}
          </p>
        </div>
      )}
    </div>
  );
};

export default AIAssistantSection;
