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
 * Check if user has access to AI features based on plan
 */
export async function checkAIAccess(userId: string): Promise<{ hasAccess: boolean; plan: string | null }> {
  try {
    const { supabase } = await import('../supabase/client');
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return { hasAccess: false, plan: null };
    }

    // Only Pro and Enterprise users have access to AI features
    const hasAccess = profile.plan === 'pro' || profile.plan === 'enterprise';
    return { hasAccess, plan: profile.plan || null };
  } catch (error) {
    return { hasAccess: false, plan: null };
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
      const { hasAccess, plan } = await checkAIAccess(userId);
      if (!hasAccess) {
        return {
          success: false,
          error: `Las funcionalidades de IA están disponibles solo para usuarios Pro y Premium. Tu plan actual es: ${plan || 'Free'}. Actualiza tu plan para acceder a estas funciones.`,
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

        // Record request
        if (userId) {
          recordRequest(userId);
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
 */
export function calculateProfileScore(check: ProfileQualityCheck): number {
  let score = 0;

  // Photo (10 points)
  if (check.hasPhoto) score += 10;

  // Email verified (10 points)
  if (check.hasEmail && check.emailVerified) score += 10;
  else if (check.hasEmail) score += 5;

  // Summary (15 points)
  if (check.hasSummary) score += 15;

  // Experiences (25 points)
  if (check.experienceCount >= 3) score += 25;
  else if (check.experienceCount >= 2) score += 18;
  else if (check.experienceCount >= 1) score += 10;

  // Skills (15 points)
  if (check.skillsCount >= 5) score += 15;
  else if (check.skillsCount >= 3) score += 10;
  else if (check.skillsCount >= 1) score += 5;

  // Education (10 points)
  if (check.educationCount >= 1) score += 10;

  // Visas/Projects (10 points)
  if (check.visasCount >= 1) score += 10;
  else score += check.visasCount * 3;

  // Languages (3 points)
  if (check.languagesCount >= 2) score += 3;
  else if (check.languagesCount >= 1) score += 1;

  // Certifications (2 points)
  if (check.certificationsCount >= 1) score += 2;

  return Math.min(100, score);
}

/**
 * Generate actionable suggestions to improve profile
 */
export function generateProfileSuggestions(
  check: ProfileQualityCheck
): ProfileQualitySuggestion[] {
  const suggestions: ProfileQualitySuggestion[] = [];

  if (!check.hasPhoto) {
    suggestions.push({
      category: 'Foto de perfil',
      message: 'Agrega una foto profesional para aumentar tus posibilidades de contratación',
      actionable: true,
      priority: 'high',
    });
  }

  if (!check.emailVerified) {
    suggestions.push({
      category: 'Email',
      message: 'Verifica tu dirección de email para aumentar tu credibilidad',
      actionable: true,
      priority: 'high',
    });
  }

  if (!check.hasSummary) {
    suggestions.push({
      category: 'Resumen profesional',
      message: 'Agrega un resumen profesional para destacar tu perfil',
      actionable: true,
      priority: 'high',
    });
  }

  if (check.experienceCount < 3) {
    suggestions.push({
      category: 'Experiencia laboral',
      message: `Agrega al menos ${3 - check.experienceCount} experiencia(s) más para fortalecer tu CV`,
      actionable: true,
      priority: 'high',
    });
  }

  if (check.skillsCount < 5) {
    suggestions.push({
      category: 'Habilidades',
      message: `Agrega al menos ${5 - check.skillsCount} habilidad(es) más`,
      actionable: true,
      priority: 'medium',
    });
  }

  if (check.educationCount === 0) {
    suggestions.push({
      category: 'Educación',
      message: 'Agrega tu formación académica',
      actionable: true,
      priority: 'medium',
    });
  }

  if (check.visasCount === 0) {
    suggestions.push({
      category: 'Proyectos (Visas)',
      message: 'Agrega al menos 1 proyecto destacado usando el sistema STAR',
      actionable: true,
      priority: 'medium',
    });
  }

  if (check.languagesCount < 2) {
    suggestions.push({
      category: 'Idiomas',
      message: 'Agrega los idiomas que dominas',
      actionable: true,
      priority: 'low',
    });
  }

  // Sugerencia para subir certificados de idiomas si tiene idiomas agregados
  if (check.languagesCount > 0) {
    suggestions.push({
      category: 'Verificaciones',
      message: 'Sube certificados de idiomas (TOEFL, IELTS, DELE, etc.) para verificar tu nivel y aumentar tu credibilidad',
      actionable: true,
      priority: 'medium',
    });
  }

  if (check.certificationsCount === 0) {
    suggestions.push({
      category: 'Certificaciones',
      message: 'Agrega certificaciones profesionales si las tienes',
      actionable: true,
      priority: 'low',
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
