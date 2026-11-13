/**
 * Cliente minimo de la API de Anthropic (Messages) para las Edge Functions.
 *
 * Sustituye a Gemini (la clave caducó, issue #17). Un texto entra y un texto sale:
 *   - la clave se lee del secreto ANTHROPIC_API_KEY y viaja en cabecera (x-api-key), nunca en la URL;
 *   - no se registra el cuerpo del proveedor (puede reflejar datos de la peticion);
 *   - 401/403 -> ProviderAuthError (probar otro modelo no lo arregla);
 *   - cualquier otro fallo (429, 5xx, modelo no disponible, timeout) -> Error normal: el llamador
 *     puede probar el siguiente modelo.
 *
 * Modelos: rapido y barato primero (equivale al «flash» de antes) y el preciso de respaldo.
 */

export const CLAUDE_FAST = 'claude-haiku-4-5-20251001';
export const CLAUDE_PRECISE = 'claude-sonnet-5-5';
/** Orden de preferencia: si el primero falla (no auth), se prueba el siguiente. */
export const CLAUDE_MODELS_TO_TRY = [CLAUDE_FAST, CLAUDE_PRECISE] as const;

export const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
export const ANTHROPIC_VERSION = '2023-06-01';

export class ProviderAuthError extends Error {}

export interface ClaudeRequest {
  apiKey: string;
  model: string;
  prompt: string;
  /** Tope de tokens de la respuesta (obligatorio en la API). */
  maxTokens?: number;
  temperature?: number;
  signal?: AbortSignal;
}

export async function callClaude(req: ClaudeRequest): Promise<string> {
  const body: Record<string, unknown> = {
    model: req.model,
    max_tokens: req.maxTokens ?? 2048,
    messages: [{ role: 'user', content: req.prompt }],
  };
  if (typeof req.temperature === 'number') body.temperature = req.temperature;

  const response = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': req.apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify(body),
    signal: req.signal,
  });

  if (!response.ok) {
    // No se registra el cuerpo del proveedor: puede reflejar datos de la peticion.
    if (response.status === 401 || response.status === 403) {
      throw new ProviderAuthError(`AI provider returned ${response.status}`);
    }
    throw new Error(`AI provider returned ${response.status}`);
  }

  const data = await response.json();
  const blocks = Array.isArray(data?.content) ? data.content : [];
  const text = blocks
    .map((b: { type?: unknown; text?: unknown }) => (b?.type === 'text' && typeof b.text === 'string' ? b.text : ''))
    .join('');

  if (!text.trim()) {
    const reason = data?.stop_reason ?? 'unknown';
    throw new Error(`AI returned no usable text (${reason})`);
  }
  return text.trim();
}
