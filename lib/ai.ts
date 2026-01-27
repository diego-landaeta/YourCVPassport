/**
 * AI Helper Library
 *
 * Funciones centralizadas para interactuar con Google Gemini AI
 * Incluye rate limiting, error handling y fallbacks
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// ==================================================
// CONFIGURATION
// ==================================================

// @ts-ignore
const API_KEY = import.meta.env?.VITE_GOOGLE_AI_API_KEY || '';

// Models to try in order of preference (2025 - Updated based on available models)
// Note: Gemini 1.0 and 1.5 have been RETIRED as of 2025
const MODELS_TO_TRY = [
  'gemini-2.5-flash',          // Latest stable fast model (2025)
  'gemini-2.5-pro',            // Latest stable advanced model (2025)
  'gemini-2.0-flash',          // Stable fast model
  'gemini-2.0-flash-exp',      // Experimental model
  'gemini-exp-1206',           // Experimental variant
];

const DEFAULT_MODEL = MODELS_TO_TRY[0];

// Rate limiting configuration (requests per minute per user)
const RATE_LIMIT_RPM = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

// ==================================================
// TYPES
// ==================================================

export interface AIGenerationOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
}

export interface AIResponse<T = string> {
  success: boolean;
  data?: T;
  error?: string;
}

export type ToneType = 'formal' | 'casual' | 'creative';

// ==================================================
// RATE LIMITING
// ==================================================

// Simple in-memory rate limiter (for production, use Redis or similar)
const rateLimitStore = new Map<string, number[]>();

/**
 * Check if user has exceeded rate limit
 */
export function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userRequests = rateLimitStore.get(userId) || [];

  // Filter out requests outside the time window
  const recentRequests = userRequests.filter(
    timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS
  );

  // Update store
  rateLimitStore.set(userId, recentRequests);

  // Check if limit exceeded
  return recentRequests.length < RATE_LIMIT_RPM;
}

/**
 * Record a new request for rate limiting
 */
export function recordRequest(userId: string): void {
  const now = Date.now();
  const userRequests = rateLimitStore.get(userId) || [];
  userRequests.push(now);
  rateLimitStore.set(userId, userRequests);
}

/**
 * Get remaining requests for user
 */
export function getRemainingRequests(userId: string): number {
  const now = Date.now();
  const userRequests = rateLimitStore.get(userId) || [];
  const recentRequests = userRequests.filter(
    timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS
  );
  return Math.max(0, RATE_LIMIT_RPM - recentRequests.length);
}

// ==================================================
// GEMINI CLIENT
// ==================================================

let genAI: GoogleGenerativeAI | null = null;

/**
 * Initialize Gemini AI client
 */
export function initializeAI(): GoogleGenerativeAI | null {
  if (!API_KEY) {
    
    return null;
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(API_KEY);
  }

  return genAI;
}

/**
 * Get Gemini model
 */
export function getModel(modelName: string = DEFAULT_MODEL) {
  const ai = initializeAI();
  if (!ai) {
    throw new Error('AI client not initialized');
  }
  return ai.getGenerativeModel({ model: modelName });
}

/**
 * List available models (for debugging)
 */
export async function listAvailableModels(): Promise<string[]> {
  try {
    const ai = initializeAI();
    if (!ai) {
      throw new Error('AI client not initialized');
    }

    // This endpoint might help identify which models are actually available
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Failed to list models: ${response.statusText}`);
    }

    const data = await response.json();
    const modelNames = data.models?.map((m: any) => m.name) || [];
    
    return modelNames;
  } catch (error) {
    
    return [];
  }
}

// ==================================================
// CORE AI FUNCTIONS
// ==================================================

/**
 * Check if user has access to AI features based on plan and usage limits
 */
export async function checkAIAccess(userId: string): Promise<{ hasAccess: boolean; plan: string | null; remaining?: number | 'unlimited'; reason?: string }> {
  try {
    const { supabase } = await import('../supabase/client');

    // Use the new check_feature_limit function
    const { data: limitCheck, error: limitError } = await supabase.rpc('check_feature_limit', {
      p_user_id: userId,
      p_feature_type: 'ai_request',
    });

    if (limitError) {
      // Fallback to old method if RPC fails
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', userId)
        .single();

      if (error || !profile) {
        return { hasAccess: false, plan: null };
      }

      const hasAccess = profile.plan === 'pro' || profile.plan === 'enterprise';
      return { hasAccess, plan: profile.plan || null };
    }

    return {
      hasAccess: limitCheck.allowed,
      plan: limitCheck.plan,
      remaining: limitCheck.remaining,
      reason: limitCheck.reason,
    };
  } catch (error) {
    return { hasAccess: false, plan: null };
  }
}

/**
 * Record AI usage after successful request
 */
export async function recordAIUsage(userId: string, metadata?: Record<string, unknown>): Promise<boolean> {
  try {
    const { supabase } = await import('../supabase/client');
    const { data, error } = await supabase.rpc('record_usage', {
      p_user_id: userId,
      p_feature_type: 'ai_request',
      p_metadata: metadata || {},
    });

    if (error) {
      console.error('Error recording AI usage:', error);
      return false;
    }

    return data?.success || false;
  } catch (error) {
    console.error('Error recording AI usage:', error);
    return false;
  }
}

/**
 * Generate text with Gemini - tries multiple models with fallback
 */
export async function generateText(
  prompt: string,
  userId?: string,
  options?: AIGenerationOptions
): Promise<AIResponse<string>> {
  try {
    // Check AI access for premium users only
    if (userId) {
      const { hasAccess, plan, reason, remaining } = await checkAIAccess(userId);
      if (!hasAccess) {
        const planText = plan || 'Free';
        let errorMessage = reason || `Las funcionalidades de IA están disponibles solo para usuarios Pro y Premium.`;

        if (plan === 'free') {
          errorMessage = `Las funcionalidades de IA no están disponibles en el plan Free. Actualiza a Pro para acceder a optimización con IA, sugerencias de habilidades y más.`;
        } else if (remaining === 0) {
          errorMessage = `Has alcanzado tu límite mensual de solicitudes de IA (plan ${planText}). Actualiza tu plan para obtener acceso ilimitado.`;
        }

        return {
          success: false,
          error: errorMessage,
        };
      }
    }

    // Rate limiting
    if (userId && !checkRateLimit(userId)) {
      return {
        success: false,
        error: `Rate limit exceeded. Please wait before making more requests. Remaining: ${getRemainingRequests(userId)}`,
      };
    }

    let lastError: Error | null = null;

    // Try each model in sequence until one works
    for (const modelName of MODELS_TO_TRY) {
      try {
        
        const model = getModel(modelName);

        // Generate content
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();

        // Record request (rate limit)
        if (userId) {
          recordRequest(userId);
          // Also record in database for plan limits
          await recordAIUsage(userId, { model: modelName, prompt_length: prompt.length });
        }

        return {
          success: true,
          data: text,
        };
      } catch (error) {
        
        lastError = error instanceof Error ? error : new Error(String(error));
        // Continue to next model
        continue;
      }
    }

    // All models failed
    throw lastError || new Error('All models failed');
  } catch (error) {
    

    let errorMessage = 'Unknown error occurred';

    if (error instanceof Error) {
      errorMessage = error.message;

      // Provide helpful hints for common errors
      if (errorMessage.includes('404') || errorMessage.includes('not found')) {
        errorMessage = `No se pudo encontrar un modelo de IA disponible.\n\n` +
          `Posibles soluciones:\n` +
          `1. Verifica tu API key en Google AI Studio: https://aistudio.google.com/apikey\n` +
          `2. Asegúrate de que la API key tenga acceso a los modelos Gemini\n` +
          `3. Verifica que VITE_GOOGLE_AI_API_KEY esté en tu archivo .env.local\n` +
          `4. La API key podría tener restricciones geográficas o de cuota`;
      } else if (errorMessage.includes('API key')) {
        errorMessage += '\n\nVerifica que VITE_GOOGLE_AI_API_KEY esté configurado correctamente en tu archivo .env.local';
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

// ==================================================
// CV OPTIMIZATION FUNCTIONS
// ==================================================

/**
 * Optimize experience description and achievements separately
 */
export async function optimizeExperience(
  title: string,
  company: string,
  description: string,
  userId?: string,
  achievements?: string[]
): Promise<AIResponse<{description: string; achievements: string[]}>> {
  const achievementsText = achievements && achievements.length > 0
    ? `\n\nLOGROS ACTUALES:\n${achievements.map((a, i) => `${i + 1}. ${a}`).join('\n')}`
    : '';

  const prompt = `Actúa como un experto en recursos humanos y redacción de CVs profesionales.

Mejora la siguiente descripción de experiencia laboral:

PUESTO: ${title}
EMPRESA: ${company}
DESCRIPCIÓN ORIGINAL:
${description}${achievementsText}

INSTRUCCIONES:
- Mejora la redacción para destacar responsabilidades clave
- Usa verbos de acción al inicio de cada punto
- Mantén un formato claro con bullets points (usando * para cada punto)
- Usa **texto** para resaltar palabras clave importantes
- Optimiza para sistemas ATS
- Devuelve el resultado en el siguiente formato EXACTO (respeta las etiquetas):

DESCRIPCIÓN:
[Descripción mejorada aquí con bullets usando *]

LOGROS:
* Logro 1 mejorado y cuantificado
* Logro 2 mejorado y cuantificado
* Logro 3 mejorado y cuantificado

IMPORTANTE:
- Si no hay logros actuales, sugiere al menos 3 logros basados en las responsabilidades
- Cuantifica los logros con números, porcentajes o métricas cuando sea posible
- NO incluyas explicaciones adicionales, solo el formato solicitado`;

  const response = await generateText(prompt, userId);

  if (!response.success || !response.data) {
    return {
      success: false,
      error: response.error,
    };
  }

  // Parse the response to separate description and achievements
  const text = response.data;
  const descriptionMatch = text.match(/DESCRIPCIÓN:\s*([\s\S]*?)(?=LOGROS:|$)/i);
  const achievementsMatch = text.match(/LOGROS:\s*([\s\S]*?)$/i);

  const optimizedDescription = descriptionMatch
    ? descriptionMatch[1].trim()
    : text;

  const optimizedAchievements = achievementsMatch
    ? achievementsMatch[1]
        .trim()
        .split('\n')
        .filter(line => line.trim().startsWith('*'))
        .map(line => line.trim().substring(1).trim())
    : [];

  return {
    success: true,
    data: {
      description: optimizedDescription,
      achievements: optimizedAchievements,
    },
  };
}

/**
 * Generate professional summary with multiple variants
 */
export async function generateSummary(
  experiences: string[],
  skills: string[],
  objective?: string,
  tone: ToneType = 'formal',
  variantsCount: number = 3,
  userId?: string
): Promise<AIResponse<string[]>> {
  const toneInstructions = {
    formal: 'Usa un tono formal y profesional, adecuado para empresas corporativas',
    casual: 'Usa un tono cercano y amigable, pero manteniendo profesionalismo',
    creative: 'Usa un tono creativo e innovador, perfecto para industrias creativas',
  };

  const prompt = `Actúa como un experto en recursos humanos y redacción de CVs profesionales.

Genera ${variantsCount} versiones diferentes de un resumen profesional basado en:

EXPERIENCIAS: ${experiences.join(', ')}
HABILIDADES: ${skills.join(', ')}
${objective ? `OBJETIVO: ${objective}` : ''}

INSTRUCCIONES:
- ${toneInstructions[tone]}
- Crea ${variantsCount} versiones diferentes del resumen
- Cada resumen debe tener 3-4 líneas máximo
- Destaca logros y habilidades clave
- Optimiza para sistemas ATS
- Separa cada variante con "---" (tres guiones)
- NO incluyas números de versión ni títulos, solo el texto

Formato de salida:
Resumen 1
---
Resumen 2
---
Resumen 3`;

  const response = await generateText(prompt, userId);

  if (!response.success || !response.data) {
    return {
      success: false,
      error: response.error || 'Failed to generate summary variants',
    };
  }

  // Split variants
  const variants = response.data
    .split('---')
    .map(v => v.trim())
    .filter(v => v.length > 0);

  return {
    success: true,
    data: variants,
  };
}

/**
 * Optimize professional headline - generates 3 variants
 * Corrects grammar, spelling, and improves professionalism
 */
export async function optimizeHeadline(
  headline: string,
  userId?: string
): Promise<AIResponse<string[]>> {
  const prompt = `Actúa como un experto en recursos humanos y redacción profesional.

Optimiza el siguiente headline profesional, generando 3 versiones diferentes:

HEADLINE ORIGINAL:
${headline}

INSTRUCCIONES:
- Genera EXACTAMENTE 3 versiones diferentes del headline
- Corrige cualquier error ortográfico o gramatical
- Mejora la redacción para que sea más profesional e impactante
- Mantén el mensaje y la esencia original
- Usa verbos de acción y términos profesionales
- Mantén cada headline conciso (máximo 10-12 palabras)
- Optimiza para sistemas ATS
- NO uses frases como "con experiencia en" o "especializado en", ve directo al punto
- Separa cada variante con "---" (tres guiones)
- NO incluyas números de versión ni títulos, solo el texto

Ejemplo:
Input: "desarollador full stack con años de esperiencia"
Output:
Full Stack Developer | React, Node.js & Cloud Solutions
---
Full Stack Engineer | Frontend & Backend Specialist
---
Software Developer | JavaScript, APIs & Modern Frameworks

Devuelve las 3 variantes separadas por ---:`;

  const response = await generateText(prompt, userId);

  if (!response.success || !response.data) {
    return {
      success: false,
      error: response.error || 'Failed to optimize headline',
    };
  }

  // Split variants by ---
  const variants = response.data
    .split('---')
    .map(v => v.trim())
    .filter(v => v.length > 0);

  // Ensure we have at least 3 variants
  if (variants.length < 3) {
    return {
      success: false,
      error: 'No se pudieron generar suficientes variantes',
    };
  }

  return {
    success: true,
    data: variants.slice(0, 3), // Return only first 3 variants
  };
}

/**
 * Suggest missing skills based on experience
 */
export async function suggestSkills(
  experiences: Array<{title: string; company: string; description: string}>,
  currentSkills: string[],
  userId?: string
): Promise<AIResponse<string[]>> {
  const experiencesText = experiences
    .map(exp => `- ${exp.title} en ${exp.company}: ${exp.description}`)
    .join('\n');

  const prompt = `Actúa como un experto en recursos humanos y reclutamiento tecnológico.

Analiza las siguientes experiencias laborales y sugiere habilidades técnicas y blandas que probablemente la persona tenga pero no ha listado:

EXPERIENCIAS:
${experiencesText}

HABILIDADES YA LISTADAS:
${currentSkills.join(', ')}

INSTRUCCIONES:
- Sugiere entre 5-10 habilidades relevantes que faltan
- Incluye tanto habilidades técnicas como blandas
- Base tus sugerencias en las responsabilidades y logros descritos
- NO repitas habilidades ya listadas
- Devuelve SOLO una lista separada por comas, sin explicaciones

Formato: Habilidad1, Habilidad2, Habilidad3`;

  const response = await generateText(prompt, userId);

  if (!response.success || !response.data) {
    return {
      success: false,
      error: response.error || 'Failed to generate skills suggestions',
    };
  }

  // Split skills
  const skills = response.data
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  return {
    success: true,
    data: skills,
  };
}

/**
 * Optimize education description
 */
export async function optimizeEducation(
  degree: string,
  institution: string,
  fieldOfStudy: string,
  description: string,
  userId?: string
): Promise<AIResponse<string>> {
  const prompt = `Actúa como un experto en recursos humanos y redacción de CVs profesionales.

Mejora la siguiente descripción de educación:

TÍTULO: ${degree}
INSTITUCIÓN: ${institution}
CAMPO: ${fieldOfStudy}
DESCRIPCIÓN ORIGINAL:
${description}

INSTRUCCIONES:
- Mejora la redacción para destacar logros académicos y proyectos relevantes
- Menciona honores, reconocimientos o proyectos destacados
- Mantén un tono profesional
- Devuelve SOLO el texto mejorado, sin explicaciones adicionales`;

  return generateText(prompt, userId);
}

// ==================================================
// PROFILE ANALYSIS FUNCTIONS
// ==================================================

export interface ProfileQualityCheck {
  hasPhoto: boolean;
  hasEmail: boolean;
  emailVerified: boolean;
  hasSummary: boolean;
  experienceCount: number;
  educationCount: number;
  skillsCount: number;
  visasCount: number;
  languagesCount: number;
  certificationsCount: number;
}

export interface ProfileQualitySuggestion {
  category: string;
  message: string;
  actionable: boolean;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Calculate profile completeness score (0-100)
 *
 * CRITERIOS FUNDAMENTALES para un CV profesional:
 * - Resumen profesional: 25 puntos
 * - Al menos 1 experiencia laboral: 30 puntos
 * - Al menos 1 educación: 25 puntos
 * - Al menos 3 habilidades: 10 puntos
 * - Verificaciones (stamps): 10 puntos (diferenciador importante - valida identidad, educación, idiomas, etc.)
 */
export function calculateProfileScore(check: ProfileQualityCheck): number {
  let score = 0;

  // Resumen profesional (25 puntos) - Lo primero que ven los reclutadores
  if (check.hasSummary) score += 25;

  // Experiencia laboral (30 puntos) - Core del CV
  if (check.experienceCount >= 1) score += 30;

  // Educación (25 puntos) - Requisito básico
  if (check.educationCount >= 1) score += 25;

  // Habilidades (10 puntos) - Mínimo 3 para filtros ATS
  if (check.skillsCount >= 3) score += 10;
  else if (check.skillsCount >= 1) score += 5;

  // Verificaciones/Stamps (10 puntos) - Diferenciador profesional importante (identidad, educación, idiomas, empleo)
  if (check.certificationsCount >= 1) score += 10;

  return Math.min(100, score);
}

/**
 * Generate actionable suggestions to improve profile
 *
 * SOLO MUESTRA LO FUNDAMENTAL - sin sugerencias genéricas o innecesarias
 * Prioridades:
 * - HIGH: Lo que DEBE tener un CV profesional
 * - MEDIUM: Diferenciadores importantes
 */
export function generateProfileSuggestions(
  check: ProfileQualityCheck
): ProfileQualitySuggestion[] {
  const suggestions: ProfileQualitySuggestion[] = [];

  // 1. RESUMEN - Lo primero que ven los reclutadores
  if (!check.hasSummary) {
    suggestions.push({
      category: 'Resumen profesional',
      message: 'El resumen es lo primero que lee un reclutador. Describe tu propuesta de valor en 3-4 líneas',
      actionable: true,
      priority: 'high',
    });
  }

  // 2. EXPERIENCIA - Core del CV
  if (check.experienceCount === 0) {
    suggestions.push({
      category: 'Experiencia laboral',
      message: 'Agrega tu experiencia laboral - es el contenido más importante de tu CV',
      actionable: true,
      priority: 'high',
    });
  }

  // 3. EDUCACIÓN - Requisito básico
  if (check.educationCount === 0) {
    suggestions.push({
      category: 'Educación',
      message: 'Incluye tu formación académica - muchas empresas lo requieren como filtro inicial',
      actionable: true,
      priority: 'high',
    });
  }

  // 4. HABILIDADES - Mínimo para ATS
  if (check.skillsCount < 3) {
    const remaining = 3 - check.skillsCount;
    suggestions.push({
      category: 'Habilidades',
      message: `Agrega ${remaining} habilidad${remaining > 1 ? 'es' : ''} más - los sistemas ATS filtran por palabras clave`,
      actionable: true,
      priority: 'high',
    });
  }

  // 5. VERIFICACIONES (STAMPS) - Diferenciador profesional (solo si ya tiene lo básico)
  if (check.certificationsCount === 0 &&
      check.hasSummary &&
      check.experienceCount >= 1 &&
      check.educationCount >= 1) {
    suggestions.push({
      category: 'Verificaciones',
      message: 'Las verificaciones validan tu identidad, educación, idiomas y experiencia, aumentando la confianza en tu perfil',
      actionable: true,
      priority: 'medium',
    });
  }

  return suggestions;
}

// ==================================================
// EXPORT DEFAULT
// ==================================================

export default {
  // Rate limiting
  checkRateLimit,
  recordRequest,
  getRemainingRequests,

  // Core functions
  initializeAI,
  getModel,
  generateText,
  listAvailableModels,
  checkAIAccess,
  recordAIUsage,

  // CV optimization
  optimizeExperience,
  generateSummary,
  suggestSkills,
  optimizeEducation,
  optimizeHeadline,

  // Profile analysis
  calculateProfileScore,
  generateProfileSuggestions,
};
