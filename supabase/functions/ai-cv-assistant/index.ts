/**
 * AI CV Assistant Edge Function
 *
 * Proxy de servidor para las funciones de IA del editor de perfil. Sustituye a las
 * llamadas directas a Google Gemini que hacia el navegador con una API key
 * incrustada en el bundle publico.
 *
 * Endpoint: POST /functions/v1/ai-cv-assistant
 * Body:     { task: AITask, input: {...} }
 * Respuesta 200: { success: true, text: string, model: string }
 * Errores:      { success: false, code: string, error: string, ... }
 *
 * Garantias:
 * - Identidad sacada del JWT (Authorization), nunca del body.
 * - CORS limitado a los dominios de produccion y a localhost.
 * - Lista blanca de tareas: el prompt se construye aqui; el cliente no puede
 *   enviar prompts libres ni elegir modelo o endpoint.
 * - Limites de tamano por campo y por peticion.
 * - Limites del plan (check_feature_limit / record_usage) aplicados en servidor.
 * - La clave se lee de Deno.env (secreto GEMINI_API_KEY) y viaja en cabecera,
 *   nunca en la URL, para que no acabe en logs.
 *
 * Proveedor y modelos: los mismos que usaba lib/ai.ts en el cliente (Gemini con
 * la misma lista de modelos de respaldo y la configuracion de generacion por
 * defecto), para no cambiar el comportamiento visible.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4';
import { Redis } from 'https://esm.sh/@upstash/redis@1.34.3';
import { Ratelimit } from 'https://esm.sh/@upstash/ratelimit@2.0.3';
// Lista de origenes compartida: yourcvpassport.com, www, localhost/127.0.0.1 y
// CORS_EXTRA_ORIGINS opcional.
import { getCorsHeaders, isAllowedOrigin } from '../_shared/cors.ts';

// ==================================================
// CONFIGURACION
// ==================================================

// Mismo orden de preferencia que tenia el cliente (lib/ai.ts).
const MODELS_TO_TRY = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-2.0-flash-exp',
  'gemini-exp-1206',
] as const;

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

const MAX_BODY_BYTES = 32 * 1024;      // peticion completa
const MAX_PROMPT_CHARS = 24_000;       // prompt ya construido
const PER_MODEL_TIMEOUT_MS = 25_000;
const TOTAL_BUDGET_MS = 60_000;        // no seguir probando modelos pasado este tiempo

// Anti-abuso por usuario (los limites mensuales del plan se aplican aparte).
const RATE_LIMIT_REQUESTS = 30;
const RATE_LIMIT_WINDOW = '10 m';

type AITask =
  | 'optimize_experience'
  | 'optimize_education'
  | 'generate_summary'
  | 'optimize_headline'
  | 'suggest_skills';

const TASKS: ReadonlySet<string> = new Set<AITask>([
  'optimize_experience',
  'optimize_education',
  'generate_summary',
  'optimize_headline',
  'suggest_skills',
]);

// ==================================================
// RESPUESTAS
// ==================================================

function json(
  status: number,
  body: Record<string, unknown>,
  cors: Record<string, string>,
  extra: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, ...extra, 'Content-Type': 'application/json' },
  });
}

function fail(
  status: number,
  code: string,
  error: string,
  cors: Record<string, string>,
  extra: Record<string, unknown> = {},
  headers: Record<string, string> = {},
): Response {
  return json(status, { success: false, code, error, ...extra }, cors, headers);
}

// ==================================================
// VALIDACION DE ENTRADA
// ==================================================

class InputError extends Error {}

function str(value: unknown, field: string, max: number, required = false): string {
  if (value === undefined || value === null) {
    if (required) throw new InputError(`Falta el campo ${field}`);
    return '';
  }
  if (typeof value !== 'string') throw new InputError(`El campo ${field} debe ser texto`);
  const trimmed = value.trim();
  if (required && !trimmed) throw new InputError(`El campo ${field} no puede estar vacio`);
  if (trimmed.length > max) throw new InputError(`El campo ${field} supera ${max} caracteres`);
  return trimmed;
}

function strList(value: unknown, field: string, maxItems: number, maxLen: number): string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new InputError(`El campo ${field} debe ser una lista`);
  if (value.length > maxItems) throw new InputError(`El campo ${field} admite como maximo ${maxItems} elementos`);
  return value.map((v, i) => str(v, `${field}[${i}]`, maxLen)).filter((v) => v.length > 0);
}

function obj(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new InputError('El campo input debe ser un objeto');
  }
  return value as Record<string, unknown>;
}

// ==================================================
// PROMPTS (copiados literalmente de lib/ai.ts para no cambiar resultados)
// ==================================================

function buildPrompt(task: AITask, rawInput: unknown): string {
  const input = obj(rawInput);

  switch (task) {
    case 'optimize_experience': {
      const title = str(input.title, 'title', 200);
      const company = str(input.company, 'company', 200);
      const description = str(input.description, 'description', 6000, true);
      const achievements = strList(input.achievements, 'achievements', 20, 600);

      const achievementsText = achievements.length > 0
        ? `\n\nLOGROS ACTUALES:\n${achievements.map((a, i) => `${i + 1}. ${a}`).join('\n')}`
        : '';

      return `Actúa como un experto en recursos humanos y redacción de CVs profesionales.

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
    }

    case 'generate_summary': {
      const experiences = strList(input.experiences, 'experiences', 20, 400);
      const skills = strList(input.skills, 'skills', 60, 100);
      const objective = str(input.objective, 'objective', 300);
      const tone = input.tone === undefined ? 'formal' : input.tone;
      if (tone !== 'formal' && tone !== 'casual' && tone !== 'creative') {
        throw new InputError('El campo tone no es valido');
      }
      const variantsRaw = input.variantsCount === undefined ? 3 : input.variantsCount;
      if (typeof variantsRaw !== 'number' || !Number.isInteger(variantsRaw) || variantsRaw < 1 || variantsRaw > 5) {
        throw new InputError('El campo variantsCount debe ser un entero entre 1 y 5');
      }
      const variantsCount = variantsRaw;
      if (experiences.length === 0 && skills.length === 0) {
        throw new InputError('Se necesitan experiencias o habilidades');
      }

      const toneInstructions = {
        formal: 'Usa un tono formal y profesional, adecuado para empresas corporativas',
        casual: 'Usa un tono cercano y amigable, pero manteniendo profesionalismo',
        creative: 'Usa un tono creativo e innovador, perfecto para industrias creativas',
      };

      return `Actúa como un experto en recursos humanos y redacción de CVs profesionales.

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
    }

    case 'optimize_headline': {
      const headline = str(input.headline, 'headline', 300, true);

      return `Actúa como un experto en recursos humanos y redacción profesional.

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
    }

    case 'suggest_skills': {
      if (!Array.isArray(input.experiences)) throw new InputError('El campo experiences debe ser una lista');
      if (input.experiences.length === 0) throw new InputError('Se necesita al menos una experiencia');
      if (input.experiences.length > 20) throw new InputError('El campo experiences admite como maximo 20 elementos');
      const experiences = input.experiences.map((e, i) => {
        const exp = obj(e);
        return {
          title: str(exp.title, `experiences[${i}].title`, 200),
          company: str(exp.company, `experiences[${i}].company`, 200),
          description: str(exp.description, `experiences[${i}].description`, 3000),
        };
      });
      const currentSkills = strList(input.currentSkills, 'currentSkills', 150, 100);

      const experiencesText = experiences
        .map((exp) => `- ${exp.title} en ${exp.company}: ${exp.description}`)
        .join('\n');

      return `Actúa como un experto en recursos humanos y reclutamiento tecnológico.

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
    }

    case 'optimize_education': {
      const degree = str(input.degree, 'degree', 200);
      const institution = str(input.institution, 'institution', 200);
      const fieldOfStudy = str(input.fieldOfStudy, 'fieldOfStudy', 200);
      const description = str(input.description, 'description', 6000, true);

      return `Actúa como un experto en recursos humanos y redacción de CVs profesionales.

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
    }
  }
}

// ==================================================
// RATE LIMIT (fail open si Upstash no esta configurado, como el resto del repo)
// ==================================================

async function checkRateLimit(userId: string): Promise<{ success: boolean; retryAfter?: number }> {
  const url = Deno.env.get('UPSTASH_REDIS_REST_URL');
  const token = Deno.env.get('UPSTASH_REDIS_REST_TOKEN');
  if (!url || !token) return { success: true };

  try {
    const ratelimit = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW),
      prefix: '@ratelimit/ai-cv-assistant',
    });
    const result = await ratelimit.limit(`user:${userId}`);
    if (result.success) return { success: true };
    return { success: false, retryAfter: Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)) };
  } catch (_err) {
    return { success: true };
  }
}

// ==================================================
// GEMINI
// ==================================================

class ProviderAuthError extends Error {}

async function callGemini(apiKey: string, model: string, prompt: string, signal: AbortSignal): Promise<string> {
  const response = await fetch(`${GEMINI_BASE_URL}/${model}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // En cabecera y no en ?key= para que la clave no quede en logs de URL.
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    }),
    signal,
  });

  if (!response.ok) {
    // No se registra el cuerpo del proveedor: puede reflejar datos de la peticion.
    if (response.status === 401 || response.status === 403) {
      throw new ProviderAuthError(`AI provider returned ${response.status}`);
    }
    throw new Error(`AI provider returned ${response.status}`);
  }

  const data = await response.json();
  const parts = data?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts)
    ? parts.map((p: { text?: unknown }) => (typeof p?.text === 'string' ? p.text : '')).join('')
    : '';

  if (!text.trim()) {
    const reason = data?.candidates?.[0]?.finishReason ?? data?.promptFeedback?.blockReason ?? 'unknown';
    throw new Error(`AI returned no usable text (${reason})`);
  }
  return text.trim();
}

async function generateWithFallback(apiKey: string, prompt: string): Promise<{ text: string; model: string }> {
  const started = Date.now();
  let lastError: Error | null = null;

  for (const model of MODELS_TO_TRY) {
    if (Date.now() - started > TOTAL_BUDGET_MS) break;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PER_MODEL_TIMEOUT_MS);
    try {
      const text = await callGemini(apiKey, model, prompt, controller.signal);
      return { text, model };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // Clave invalida o sin permisos: probar otros modelos no va a arreglarlo.
      if (err instanceof ProviderAuthError) break;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError ?? new Error('All models failed');
}

// ==================================================
// HANDLER
// ==================================================

serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  const cors = getCorsHeaders(req);

  // Un navegador desde un origen no permitido no debe poder usar la funcion.
  // Las llamadas sin Origin (servidor a servidor) siguen necesitando un JWT valido.
  if (origin && !isAllowedOrigin(origin)) {
    return fail(403, 'origin_not_allowed', 'Origin not allowed', cors);
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  if (req.method !== 'POST') {
    return fail(405, 'method_not_allowed', 'Method not allowed', cors, {}, { Allow: 'POST, OPTIONS' });
  }

  try {
    // ---- Autenticacion: la identidad sale del JWT, nunca del body ----
    const authHeader = req.headers.get('authorization') ?? '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return fail(401, 'unauthorized', 'Missing authorization', cors);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    // Cliente con el JWT del usuario: las RPC se ejecutan con sus permisos.
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    const user = userData?.user;
    if (userError || !user) {
      return fail(401, 'unauthorized', 'Invalid or expired session', cors);
    }

    // ---- Tamano y forma del body ----
    const contentLength = Number(req.headers.get('content-length') ?? '0');
    if (contentLength > MAX_BODY_BYTES) {
      return fail(413, 'payload_too_large', 'Request too large', cors);
    }
    const rawBody = await req.text();
    if (new TextEncoder().encode(rawBody).length > MAX_BODY_BYTES) {
      return fail(413, 'payload_too_large', 'Request too large', cors);
    }

    let body: { task?: unknown; input?: unknown };
    try {
      body = JSON.parse(rawBody);
    } catch (_err) {
      return fail(400, 'invalid_json', 'Invalid JSON body', cors);
    }
    if (!body || typeof body !== 'object') {
      return fail(400, 'invalid_input', 'Invalid body', cors);
    }

    const task = body.task;
    if (typeof task !== 'string' || !TASKS.has(task)) {
      return fail(400, 'invalid_task', 'Unknown task', cors);
    }

    let prompt: string;
    try {
      prompt = buildPrompt(task as AITask, body.input);
    } catch (err) {
      if (err instanceof InputError) {
        return fail(400, 'invalid_input', err.message, cors);
      }
      throw err;
    }
    if (prompt.length > MAX_PROMPT_CHARS) {
      return fail(413, 'payload_too_large', 'Input too large', cors);
    }

    // ---- Limites del plan (antes se comprobaban solo en el navegador) ----
    const { data: limitCheck, error: limitError } = await supabase.rpc('check_feature_limit', {
      p_user_id: user.id,
      p_feature_type: 'ai_request',
    });

    let plan: string | null = null;
    if (limitError || !limitCheck) {
      // Mismo respaldo que tenia el cliente si la RPC no esta disponible.
      const { data: profile } = await supabase
        .from('profiles_full') // plan es privado: perfil propio completo
        .select('plan')
        .eq('id', user.id)
        .single();
      plan = profile?.plan ?? null;
      if (plan !== 'pro' && plan !== 'enterprise') {
        return fail(403, 'plan_required', 'AI features are not available on your plan', cors, { plan });
      }
    } else {
      plan = limitCheck.plan ?? null;
      if (!limitCheck.allowed) {
        // check_feature_limit devuelve reason='Monthly limit reached' solo cuando se agota
        // la cuota; el resto de casos son planes sin acceso a IA.
        const limitReached = limitCheck.reason === 'Monthly limit reached';
        return fail(
          403,
          limitReached ? 'limit_reached' : 'plan_required',
          limitCheck.reason || 'AI features are not available on your plan',
          cors,
          { plan, remaining: limitCheck.remaining ?? 0 },
        );
      }
    }

    // ---- Anti-abuso ----
    const rate = await checkRateLimit(user.id);
    if (!rate.success) {
      return fail(
        429,
        'rate_limited',
        'Too many requests',
        cors,
        { retryAfter: rate.retryAfter },
        { 'Retry-After': String(rate.retryAfter ?? 60) },
      );
    }

    // ---- Proveedor ----
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      console.error('[ai-cv-assistant] GEMINI_API_KEY no configurada');
      return fail(503, 'ai_not_configured', 'AI service not configured', cors);
    }

    let result: { text: string; model: string };
    try {
      result = await generateWithFallback(apiKey, prompt);
    } catch (err) {
      console.error('[ai-cv-assistant] proveedor fallo:', (err as Error).message);
      return fail(502, 'ai_provider_error', 'AI provider error', cors);
    }

    // Registrar uso para los limites mensuales del plan (no bloquea la respuesta si falla).
    const { error: usageError } = await supabase.rpc('record_usage', {
      p_user_id: user.id,
      p_feature_type: 'ai_request',
      p_metadata: { task, model: result.model, prompt_length: prompt.length },
    });
    if (usageError) {
      console.error('[ai-cv-assistant] record_usage fallo:', usageError.message);
    }

    return json(200, { success: true, text: result.text, model: result.model }, cors);
  } catch (err) {
    console.error('[ai-cv-assistant] error interno:', (err as Error)?.message);
    return fail(500, 'internal_error', 'Internal server error', cors);
  }
});
