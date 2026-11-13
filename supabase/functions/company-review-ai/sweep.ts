// Barrido de empresas PENDING sin revisar (cron `bolsa-empresas`, cada 10 minutos).
//
// Módulo PURO: decide QUÉ empresas revisar y de cuáles avisar a soporte; la lectura y la
// revisión las hace index.ts. Así se puede probar sin red.
//
//   - Se revisan las PENDING SIN ninguna revisión registrada (company_ai_reviews) y con
//     más de 2 minutos de antigüedad (la web lanza la revisión nada más registrarse: el
//     barrido solo recoge las que se quedaron sin ella, y los 2 minutos evitan pisar una
//     revisión que está en marcha). Máximo 20 por llamada, las más antiguas primero.
//   - Las que SIGUEN PENDING sin revisión pasados 30 minutos (no entraron en las 20 de
//     esta llamada, o su revisión falló sin dejar constancia) generan un aviso a soporte.

export const SWEEP_MIN_AGE_MS = 2 * 60 * 1000
export const SWEEP_MAX_PER_CALL = 20
export const SWEEP_STALE_AFTER_MS = 30 * 60 * 1000

export interface PendingCompany {
  id: string
  created_at: string
}

const ageMs = (c: PendingCompany, now: number): number => now - new Date(c.created_at).getTime()

/** Empresas a revisar en esta llamada: sin revisión, de más de 2 min, las más antiguas, máx. 20. */
export function pickForReview(pending: PendingCompany[], reviewed: Set<string>, now: number, max = SWEEP_MAX_PER_CALL): PendingCompany[] {
  return pending
    .filter((c) => !reviewed.has(c.id) && Number.isFinite(ageMs(c, now)) && ageMs(c, now) > SWEEP_MIN_AGE_MS)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(0, max)
}

/** De las que siguen sin revisión, las de más de 30 min (aviso a soporte). */
export function pickStale(stillUnreviewed: PendingCompany[], now: number): PendingCompany[] {
  return stillUnreviewed.filter((c) => Number.isFinite(ageMs(c, now)) && ageMs(c, now) > SWEEP_STALE_AFTER_MS)
}
