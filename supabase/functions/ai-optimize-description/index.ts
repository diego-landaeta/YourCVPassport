/**
 * AI Optimize Description Edge Function
 *
 * Endpoint: POST /functions/v1/ai-optimize-description
 * Body:     { text: string, type: 'experience' | 'summary' | 'skills', role?: string, industry?: string }
 * Respuesta 200: { success: true, original, optimized, type }
 * Errores:      { success: false, code: string, error: string, ... }
 *
 * Ningún cliente del repo la llama hoy (el editor usa ai-cv-assistant); se
 * mantiene desplegable pero endurecida con las mismas garantías:
 * - CORS limitado a los orígenes de _shared/cors.ts (antes '*').
 * - JWT obligatorio validado con auth.getUser (antes era opcional y se podía
 *   usar de forma anónima con la clave de Gemini del proyecto).
 * - Límites de tamaño por petición y por campo.
 * - Límites del plan (check_feature_limit / record_usage) en servidor.
 * - Rate limit por usuario (Upstash, fail open si no está configurado).
 * - La clave (GEMINI_API_KEY) viaja en cabecera, nunca en la URL. Ya no se usa
 *   OPENAI_API_KEY como respaldo: se habría enviado a Google.
 * - Los errores internos no se devuelven al cliente.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.4';
import { Redis } from 'https://esm.sh/@upstash/redis@1.34.3';
import { Ratelimit } from 'https://esm.sh/@upstash/ratelimit@2.0.3';
import { getCorsHeaders, isAllowedOrigin } from '../_shared/cors.ts';

// ==================================================
// CONFIGURACION
// ==================================================

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const MAX_BODY_BYTES = 16 * 1024;   // petición completa
const MAX_TEXT_CHARS = 5_000;       // campo text
const MAX_META_CHARS = 200;         // role / industry
const PROVIDER_TIMEOUT_MS = 20_000;

// Anti-abuso por usuario (mismo límite que tenía: 10 por hora).
const RATE_LIMIT_REQUESTS = 10;
const RATE_LIMIT_WINDOW = '1 h';

type OptimizeType = 'experience' | 'summary' | 'skills';
const TYPES: ReadonlySet<string> = new Set<OptimizeType>(['experience', 'summary', 'skills']);

interface OptimizePayload {
  text: string;
  type: OptimizeType;
  role: string;
  industry: string;
}

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

function parsePayload(body: Record<string, unknown>): OptimizePayload {
  const type = body.type;
  if (typeof type !== 'string' || !TYPES.has(type)) {
    throw new InputError('Invalid type. Must be: experience, summary, or skills');
  }
  return {
    text: str(body.text, 'text', MAX_TEXT_CHARS, true),
    type: type as OptimizeType,
    role: str(body.role, 'role', MAX_META_CHARS),
    industry: str(body.industry, 'industry', MAX_META_CHARS),
  };
}

function buildPrompt(payload: OptimizePayload): string {
  const context = [
    payload.role ? `Role: ${payload.role}` : '',
    payload.industry ? `Industry: ${payload.industry}` : '',
  ].filter(Boolean).join('\n');

  switch (payload.type) {
    case 'experience':
      return `You are a professional CV writer. Optimize the following work experience description to be more impactful, professional, and ATS-friendly. Focus on achievements, metrics, and action verbs. Keep it concise and professional.

Original: ${payload.text}
${context}

Optimized description:`;
    case 'summary':
      return `You are a professional CV writer. Create a compelling professional summary based on the following information. Make it 2-3 sentences that highlight key strengths, experience, and value proposition.

Information: ${payload.text}
${context}

Professional summary:`;
    case 'skills':
      return `You are a professional CV writer. Based on the following profile information, suggest 8-10 relevant professional skills that would enhance this CV. Include both technical and soft skills.

Profile: ${payload.text}
${context}

Suggested skills (comma-separated):`;
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
      prefix: '@ratelimit/ai-optimize-description',
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

async function optimizeText(apiKey: string, prompt: string): Promise<string> {
  // Timeout propio: sin esto, una respuesta lenta del proveedor mantiene viva la
  // invocacion hasta el limite de la plataforma y el usuario se queda mirando.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // En cabecera y no en ?key= para que la clave no quede en logs de URL.
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      throw new Error('AI request timed out');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    // No se registra el cuerpo del proveedor: puede reflejar datos de la peticion.
    throw new Error(`AI provider returned ${response.status}`);
  }

  const data = await response.json();
  const output = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (typeof output !== 'string' || !output.trim()) {
    // Respuesta vacia por filtros de seguridad o por corte de tokens.
    const reason = data?.candidates?.[0]?.finishReason ?? 'unknown';
    throw new Error(`AI returned no usable text (finishReason: ${reason})`);
  }

  return output.trim();
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

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch (_err) {
      return fail(400, 'invalid_json', 'Invalid JSON body', cors);
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return fail(400, 'invalid_input', 'Invalid body', cors);
    }

    let payload: OptimizePayload;
    try {
      payload = parsePayload(body as Record<string, unknown>);
    } catch (err) {
      if (err instanceof InputError) {
        return fail(400, 'invalid_input', err.message, cors);
      }
      throw err;
    }

    // ---- Limites del plan (mismo criterio que ai-cv-assistant) ----
    const { data: limitCheck, error: limitError } = await supabase.rpc('check_feature_limit', {
      p_user_id: user.id,
      p_feature_type: 'ai_request',
    });

    let plan: string | null = null;
    if (limitError || !limitCheck) {
      // Respaldo si la RPC no esta disponible: solo pro y enterprise.
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
      console.error('[ai-optimize-description] GEMINI_API_KEY no configurada');
      return fail(503, 'ai_not_configured', 'AI service not configured', cors);
    }

    let optimized: string;
    try {
      optimized = await optimizeText(apiKey, buildPrompt(payload));
    } catch (err) {
      console.error('[ai-optimize-description] proveedor fallo:', (err as Error).message);
      return fail(502, 'ai_provider_error', 'AI provider error', cors);
    }

    // Registrar uso para los limites mensuales del plan (no bloquea la respuesta si falla).
    const { error: usageError } = await supabase.rpc('record_usage', {
      p_user_id: user.id,
      p_feature_type: 'ai_request',
      p_metadata: { source: 'ai-optimize-description', type: payload.type, text_length: payload.text.length },
    });
    if (usageError) {
      console.error('[ai-optimize-description] record_usage fallo:', usageError.message);
    }

    return json(200, { success: true, original: payload.text, optimized, type: payload.type }, cors);
  } catch (err) {
    console.error('[ai-optimize-description] error interno:', (err as Error)?.message);
    return fail(500, 'internal_error', 'Internal server error', cors);
  }
});
