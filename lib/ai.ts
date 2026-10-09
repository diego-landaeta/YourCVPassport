/**
 * AI Helper Library
 *
 * Funciones centralizadas para las funciones de IA del editor de perfil.
 *
 * Las llamadas al modelo (Google Gemini) se hacen en el servidor, en la Edge
 * Function `ai-cv-assistant`, que guarda la API key como secreto de Supabase,
 * verifica la sesion y aplica los limites del plan. El navegador solo envia los
 * datos de cada tarea (nunca un prompt libre ni un modelo) e interpreta el texto
 * que vuelve. Ninguna clave de IA debe llegar al bundle del cliente.
 */

import { FunctionsFetchError, FunctionsHttpError, FunctionsRelayError } from '@supabase/supabase-js';

// ==================================================
// CONFIGURATION
// ==================================================

const AI_FUNCTION_NAME = 'ai-cv-assistant';

/**
 * Interruptor de las funciones de IA en la interfaz. Antes dependia de que hubiera
 * una API key en el cliente; ahora la IA vive en el servidor y esta activa salvo
 * que se compile con VITE_AI_ENABLED=false.
 */
export const AI_FEATURES_ENABLED = import.meta.env.VITE_AI_ENABLED !== 'false';

// Rate limiting configuration (requests per minute per user)
// Limite suave en el navegador para evitar rafagas; el limite real esta en el servidor.
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

/** Tareas admitidas por la Edge Function (lista blanca en el servidor). */
export type AITask =
  | 'optimize_experience'
  | 'optimize_education'
  | 'generate_summary'
  | 'optimize_headline'
  | 'suggest_skills';

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
// CORE AI FUNCTIONS
// ==================================================

/**
 * Check if user has access to AI features based on plan and usage limits.
 * Solo se usa para adaptar la interfaz (banner de upgrade); el servidor vuelve a
 * comprobarlo antes de llamar al modelo.
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
      // plan es privado: se lee de la vista profiles_full (perfil propio)
      const { data: profile, error } = await supabase
        .from('profiles_full')
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

const GENERIC_AI_ERROR = 'El servicio de IA no está disponible en este momento. Inténtalo de nuevo en unos minutos.';
const NETWORK_AI_ERROR = 'No se pudo conectar con el servicio de IA. Revisa tu conexión e inténtalo de nuevo.';

/**
 * Traduce el error de la Edge Function a un mensaje para el usuario.
 * Los mensajes de plan/limite son los mismos que se mostraban antes en el cliente.
 */
async function describeInvokeError(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    let body: { code?: string; error?: string; plan?: string | null } = {};
    try {
      const context = error.context as Response | undefined;
      body = (await context?.json()) ?? {};
    } catch {
      // Cuerpo no JSON: mensaje generico.
    }

    const planText = body.plan || 'Free';
    switch (body.code) {
      case 'plan_required':
        if (!body.plan || body.plan === 'free') {
          return 'Las funcionalidades de IA no están disponibles en el plan Free. Actualiza a Pro para acceder a optimización con IA, sugerencias de habilidades y más.';
        }
        return 'Las funcionalidades de IA están disponibles solo para usuarios Pro y Premium.';
      case 'limit_reached':
        return `Has alcanzado tu límite mensual de solicitudes de IA (plan ${planText}). Actualiza tu plan para obtener acceso ilimitado.`;
      case 'rate_limited':
        return 'Has hecho demasiadas solicitudes de IA seguidas. Espera unos minutos e inténtalo de nuevo.';
      case 'unauthorized':
        return 'Tu sesión ha caducado. Vuelve a iniciar sesión para usar la IA.';
      case 'invalid_input':
        return body.error ? `No se pudo procesar el texto: ${body.error}` : 'No se pudo procesar el texto enviado a la IA.';
      case 'payload_too_large':
        return 'El texto es demasiado largo para la IA. Acórtalo e inténtalo de nuevo.';
      default:
        return GENERIC_AI_ERROR;
    }
  }

  if (error instanceof FunctionsFetchError || error instanceof FunctionsRelayError) {
    return NETWORK_AI_ERROR;
  }

  return GENERIC_AI_ERROR;
}

/**
 * Ejecuta una tarea de IA en el servidor y devuelve el texto generado.
 * La comprobacion del plan, el registro de uso y la eleccion de modelo se hacen en
 * la Edge Function.
 */
async function runAITask(
  task: AITask,
  input: Record<string, unknown>,
  userId?: string
): Promise<AIResponse<string>> {
  // Rate limiting
  if (userId && !checkRateLimit(userId)) {
    return {
      success: false,
      error: `Has hecho demasiadas solicitudes de IA seguidas. Espera un minuto e inténtalo de nuevo.`,
    };
  }

  try {
    const { supabase } = await import('../supabase/client');
    const { data, error } = await supabase.functions.invoke(AI_FUNCTION_NAME, {
      body: { task, input },
    });

    if (error) {
      return { success: false, error: await describeInvokeError(error) };
    }

    if (!data || data.success !== true || typeof data.text !== 'string' || !data.text.trim()) {
      return { success: false, error: GENERIC_AI_ERROR };
    }

    if (userId) {
      recordRequest(userId);
    }

    return {
      success: true,
      data: data.text.trim(),
    };
  } catch (error) {
    return {
      success: false,
      error: GENERIC_AI_ERROR,
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
  const response = await runAITask(
    'optimize_experience',
    { title, company, description, achievements: achievements || [] },
    userId
  );

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
  const response = await runAITask(
    'generate_summary',
    { experiences, skills, objective: objective || undefined, tone, variantsCount },
    userId
  );

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
  const response = await runAITask('optimize_headline', { headline }, userId);

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
  const response = await runAITask('suggest_skills', { experiences, currentSkills }, userId);

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
  return runAITask(
    'optimize_education',
    { degree, institution, fieldOfStudy, description },
    userId
  );
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

export type SuggestionType = 'summary' | 'experience' | 'education' | 'skills' | 'verifications';

export interface ProfileQualitySuggestion {
  type: SuggestionType;
  actionable: boolean;
  priority: 'high' | 'medium' | 'low';
  data?: { remaining?: number };
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
      type: 'summary',
      actionable: true,
      priority: 'high',
    });
  }

  // 2. EXPERIENCIA - Core del CV
  if (check.experienceCount === 0) {
    suggestions.push({
      type: 'experience',
      actionable: true,
      priority: 'high',
    });
  }

  // 3. EDUCACIÓN - Requisito básico
  if (check.educationCount === 0) {
    suggestions.push({
      type: 'education',
      actionable: true,
      priority: 'high',
    });
  }

  // 4. HABILIDADES - Mínimo para ATS
  if (check.skillsCount < 3) {
    const remaining = 3 - check.skillsCount;
    suggestions.push({
      type: 'skills',
      actionable: true,
      priority: 'high',
      data: { remaining },
    });
  }

  // 5. VERIFICACIONES (STAMPS) - Diferenciador profesional (solo si ya tiene lo básico)
  if (check.certificationsCount === 0 &&
      check.hasSummary &&
      check.experienceCount >= 1 &&
      check.educationCount >= 1) {
    suggestions.push({
      type: 'verifications',
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
  checkAIAccess,

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
