// Petición POST a la API v3 de Brevo, directa o a través del relé de correo.
//
// La cuenta de Brevo tiene activada la lista de IPs autorizadas y las Edge
// Functions salen por IPs de AWS que cambian, así que Brevo las rechaza
// (401 "unrecognised IP address"). El servidor web (72.60.90.135) sí está
// autorizado: allí corre un relé mínimo (deploy/mail-relay/) que reenvía la
// petición a Brevo con la API key.
//
// Secretos (supabase secrets set ...):
//   EMAIL_RELAY_URL     p. ej. https://yourcvpassport.com/api/mail-relay
//   EMAIL_RELAY_SECRET  clave compartida con el relé (Authorization: Bearer).
// Con los dos definidos se usa el relé; si falta alguno, se llama a Brevo
// directamente con BREVO_API_KEY (como antes).
//
// Devuelve el status y el cuerpo JSON de Brevo tal cual (el relé no los toca).

const BREVO_BASE_URL = 'https://api.brevo.com/v3'

export function relayConfigured(): boolean {
  return Boolean(Deno.env.get('EMAIL_RELAY_URL') && Deno.env.get('EMAIL_RELAY_SECRET'))
}

/** true si se puede enviar: hay relé o hay API key. */
export function brevoConfigured(): boolean {
  return relayConfigured() || Boolean(Deno.env.get('BREVO_API_KEY'))
}

/**
 * POST a `${BREVO_BASE_URL}${path}`. Lanza si falla la red o vence el timeout
 * (el llamador lo traduce a su error); para respuestas no-2xx devuelve el status.
 */
export async function brevoRequest(path: string, payload: unknown, timeoutMs: number): Promise<Response> {
  if (relayConfigured()) {
    return await fetch(Deno.env.get('EMAIL_RELAY_URL')!, {
      method: 'POST',
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        'content-type': 'application/json',
        'accept': 'application/json',
        'authorization': `Bearer ${Deno.env.get('EMAIL_RELAY_SECRET')}`,
      },
      body: JSON.stringify({ path, payload }),
    })
  }
  return await fetch(`${BREVO_BASE_URL}${path}`, {
    method: 'POST',
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'api-key': Deno.env.get('BREVO_API_KEY') ?? '',
    },
    body: JSON.stringify(payload),
  })
}
