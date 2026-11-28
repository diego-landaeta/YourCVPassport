// Lógica de la cola de correo (send-outbox), SIN Deno ni red: la base de datos y el envío
// entran por parámetro, así que se prueba con Node (queue.test.mjs) y la Edge Function
// (index.ts) solo conecta Supabase y Brevo.
//
// Reglas (ver también docs/bolsa-despliegue-funciones.md):
//   - TOPE diario: se cuentan los `sent_at` de HOY (UTC). Al llegar al tope se para.
//   - PRIORIDAD: `priority` ascendente (3 avisos internos, 4-5 estado y seguridad, 7 cierre,
//     8 resumen diario, 9 alertas). Además, las filas con priority >= LOW_PRIORITY_FROM
//     (resúmenes y alertas) solo se envían mientras no se haya gastado el 80 % del tope: el
//     20 % final queda reservado para estado/seguridad.
//   - NO DUPLICAR: cada fila se «reclama» con un UPDATE condicionado (sent_at IS NULL,
//     attempts y send_after sin cambiar, attempts < MAX_ATTEMPTS) que suma 1 a attempts y
//     aplaza send_after unos minutos (arrendamiento). Si dos ejecuciones simultáneas van a
//     por la misma fila, solo una gana el UPDATE. Si una ejecución muere a mitad, la fila
//     vuelve a estar disponible cuando vence el arrendamiento.
//   - Errores:
//       cupo agotado de Brevo (402, 429, «credits», «limit»...) -> se para la ejecución, la
//         fila vuelve atrás SIN gastar el intento y se aplaza 60 min;
//       configuración (sin clave, 401/403) -> igual: se para, sin gastar intento;
//       error permanente de esa fila (plantilla desconocida, datos inválidos, 400/404/422)
//         -> gasta el intento, backoff; a los MAX_ATTEMPTS queda sin enviar con last_error;
//       error transitorio (5xx, red, timeout) -> gasta el intento, backoff; tres seguidos
//         paran la ejecución (Brevo caído) y se devuelven los intentos de esos tres.

export const MAX_ATTEMPTS = 5
export const DEFAULT_DAILY_CAP = 250
export const DEFAULT_BATCH = 20
export const MAX_BATCH = 50
/** Las filas con prioridad >= esto (resumen diario y alertas) no usan el 20 % final del tope. */
export const LOW_PRIORITY_FROM = 8
export const LOW_PRIORITY_SHARE = 0.8
export const LEASE_MINUTES = 10
const QUOTA_BACKOFF_MINUTES = 60
/** Minutos de espera tras el fallo n-ésimo (1-based). */
const BACKOFF_MINUTES = [10, 30, 120, 360, 720]

export interface OutboxRow {
  id: string
  kind: string
  to_email: string
  payload: Record<string, unknown> | null
  lang: string | null
  priority: number
  send_after: string
  attempts: number
}

export interface OutboxStore {
  /** Filas enviadas desde `sinceIso` (inicio del día UTC). */
  countSentSince(sinceIso: string): Promise<number>
  /** Pendientes (sent_at NULL, attempts < MAX, send_after <= nowIso), por prioridad y antigüedad. */
  listCandidates(opts: { nowIso: string; limit: number; maxPriority?: number }): Promise<OutboxRow[]>
  /**
   * UPDATE condicionado: attempts = attempts + 1, send_after = leaseUntil,
   * WHERE id AND sent_at IS NULL AND attempts = row.attempts AND send_after = row.send_after
   * AND attempts < MAX. Devuelve la fila reclamada o null si otra ejecución ganó.
   */
  claim(row: OutboxRow, leaseUntilIso: string): Promise<OutboxRow | null>
  markSent(id: string, nowIso: string): Promise<void>
  /** Deja la fila para un reintento: attempts, send_after y last_error. */
  release(id: string, patch: { attempts: number; sendAfterIso: string; lastError: string }): Promise<void>
}

export type SendResult = { ok: true } | { ok: false; status: number; code: string; detail: string }

export interface ProcessDeps {
  store: OutboxStore
  /** Genera el correo; lanza un error con `name` 'UnknownKindError' | 'InvalidPayloadError' si es permanente. */
  render(row: OutboxRow): { subject: string; html: string; text: string }
  send(row: OutboxRow, mail: { subject: string; html: string; text: string }): Promise<SendResult>
  now?: () => Date
  dailyCap?: number
  batchSize?: number
  /** Tiempo máximo de la ejecución (ms) para no pasarse del límite de la función. */
  budgetMs?: number
}

export interface ProcessSummary {
  sent: number
  failed: number
  skipped_claimed: number
  cap: number
  sent_today: number
  remaining_today: number
  stopped: null | 'CAP_REACHED' | 'QUOTA' | 'CONFIG' | 'PROVIDER_DOWN' | 'TIME_BUDGET'
  errors: Array<{ id: string; kind: string; error: string }>
}

export function startOfUtcDay(d: Date): string {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString()
}

const addMinutes = (d: Date, m: number) => new Date(d.getTime() + m * 60_000).toISOString()

export function backoffMinutes(attemptNumber: number): number {
  return BACKOFF_MINUTES[Math.min(Math.max(attemptNumber, 1), BACKOFF_MINUTES.length) - 1]
}

export type Failure = 'quota' | 'config' | 'permanent' | 'transient'

/** Clasifica la respuesta de sendEmail() cuando no es ok. */
export function classifyFailure(r: { status: number; code: string; detail: string }): Failure {
  const detail = r.detail.toLowerCase()
  if (r.code === 'EMAIL_NOT_CONFIGURED') return 'config'
  if (r.status === 402 || r.status === 429) return 'quota'
  if (/(not_enough_credits|credits|quota|daily|limit|too_many|out_of_credit|account_under)/.test(detail) && r.status !== 0) return 'quota'
  if (r.status === 401 || r.status === 403) return 'config'
  if (r.status === 400 || r.status === 404 || r.status === 422) return 'permanent'
  if (r.status === 0 && /invalid recipient|empty subject|empty html|invalid replyto/.test(detail)) return 'permanent'
  return 'transient' // 5xx, 0 con timeout/red, otros
}

const isPermanentRenderError = (e: unknown) => {
  const name = (e as { name?: string } | null)?.name
  return name === 'UnknownKindError' || name === 'InvalidPayloadError'
}

const shortError = (e: unknown) => String((e as Error)?.message ?? e).replace(/\s+/g, ' ').slice(0, 300)

export async function processOutbox(deps: ProcessDeps): Promise<ProcessSummary> {
  const { store } = deps
  const now = deps.now ?? (() => new Date())
  const cap = Math.max(0, Math.floor(deps.dailyCap ?? DEFAULT_DAILY_CAP))
  const batch = Math.min(Math.max(Math.floor(deps.batchSize ?? DEFAULT_BATCH), 1), MAX_BATCH)
  const started = now().getTime()
  const budgetMs = deps.budgetMs ?? 100_000

  const dayStart = startOfUtcDay(now())
  let sentToday = await store.countSentSince(dayStart)
  const summary: ProcessSummary = {
    sent: 0, failed: 0, skipped_claimed: 0, cap, sent_today: sentToday,
    remaining_today: Math.max(cap - sentToday, 0), stopped: null, errors: [],
  }
  if (sentToday >= cap) {
    summary.stopped = 'CAP_REACHED'
    return summary
  }

  const reserveFrom = Math.floor(cap * LOW_PRIORITY_SHARE)
  const room = cap - sentToday
  const rows = await store.listCandidates({
    nowIso: now().toISOString(),
    limit: Math.min(batch, room),
    // Gastado el 80 %, solo estado y seguridad.
    maxPriority: sentToday >= reserveFrom ? LOW_PRIORITY_FROM - 1 : undefined,
  })

  let consecutiveTransient: Array<{ row: OutboxRow; attemptsBefore: number }> = []

  for (const candidate of rows) {
    if (now().getTime() - started > budgetMs) {
      summary.stopped = 'TIME_BUDGET'
      break
    }
    // Releer el tope antes de CADA envío (otra ejecución puede estar enviando a la vez).
    sentToday = await store.countSentSince(dayStart)
    if (sentToday >= cap) {
      summary.stopped = 'CAP_REACHED'
      break
    }
    if (candidate.priority >= LOW_PRIORITY_FROM && sentToday >= reserveFrom) continue

    const attemptsBefore = candidate.attempts
    const claimed = await store.claim(candidate, addMinutes(now(), LEASE_MINUTES))
    if (!claimed) {
      summary.skipped_claimed++
      continue
    }

    // 1. Render. Un fallo aquí es del propio mensaje: permanente.
    let mail: { subject: string; html: string; text: string }
    try {
      mail = deps.render(claimed)
    } catch (e) {
      const permanent = isPermanentRenderError(e)
      summary.failed++
      summary.errors.push({ id: claimed.id, kind: claimed.kind, error: shortError(e) })
      await store.release(claimed.id, {
        attempts: permanent ? MAX_ATTEMPTS : attemptsBefore + 1,
        sendAfterIso: addMinutes(now(), backoffMinutes(attemptsBefore + 1)),
        lastError: `RENDER: ${shortError(e)}`,
      })
      continue
    }

    // 2. Envío
    let result: SendResult
    try {
      result = await deps.send(claimed, mail)
    } catch (e) {
      result = { ok: false, status: 0, code: 'EMAIL_SEND_FAILED', detail: `exception ${shortError(e)}` }
    }

    if (result.ok) {
      consecutiveTransient = []
      // Si marcar «enviado» falla se reintenta; si no, la fila reaparecerá al vencer el
      // arrendamiento (riesgo de un duplicado, nunca de pérdida): se deja constancia.
      let marked = false
      for (let i = 0; i < 3 && !marked; i++) {
        try {
          await store.markSent(claimed.id, now().toISOString())
          marked = true
        } catch (e) {
          if (i === 2) summary.errors.push({ id: claimed.id, kind: claimed.kind, error: `MARK_SENT_FAILED ${shortError(e)}` })
        }
      }
      summary.sent++
      summary.sent_today = sentToday + 1
      continue
    }

    const kind = classifyFailure(result)
    const lastError = `${result.code} ${result.status} ${result.detail}`.slice(0, 300)
    summary.errors.push({ id: claimed.id, kind: claimed.kind, error: lastError })

    if (kind === 'quota' || kind === 'config') {
      // Sin gastar el intento: la fila vuelve atrás y se espera.
      await store.release(claimed.id, {
        attempts: attemptsBefore,
        sendAfterIso: addMinutes(now(), kind === 'quota' ? QUOTA_BACKOFF_MINUTES : 15),
        lastError: `${kind === 'quota' ? 'QUOTA' : 'CONFIG'}: ${lastError}`,
      })
      summary.stopped = kind === 'quota' ? 'QUOTA' : 'CONFIG'
      break
    }

    summary.failed++
    await store.release(claimed.id, {
      attempts: attemptsBefore + 1,
      sendAfterIso: addMinutes(now(), backoffMinutes(attemptsBefore + 1)),
      lastError,
    })

    if (kind === 'transient') {
      consecutiveTransient.push({ row: claimed, attemptsBefore })
      if (consecutiveTransient.length >= 3) {
        // Brevo (o el relé) caído: se devuelven los intentos y se para.
        for (const t of consecutiveTransient) {
          await store.release(t.row.id, {
            attempts: t.attemptsBefore,
            sendAfterIso: addMinutes(now(), 15),
            lastError: `PROVIDER_DOWN: ${lastError}`,
          })
        }
        summary.failed -= consecutiveTransient.length
        summary.stopped = 'PROVIDER_DOWN'
        break
      }
    } else {
      consecutiveTransient = []
    }
  }

  summary.remaining_today = Math.max(cap - summary.sent_today, 0)
  return summary
}
