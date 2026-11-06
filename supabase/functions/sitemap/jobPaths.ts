// URL canónica de la ficha de una oferta para el sitemap (módulo puro, sin Deno; lo prueba
// jobPaths.test.mjs). Misma regla que jobPath() de lib/jobsFormat.ts, que jobUrl() de
// send-outbox/templates.ts y que scripts/generate-sitemap.mjs:
//
//   con country_code (2 letras)  ->  es: /<cc>/ofertas/<slug>   en: /<cc>/jobs/<slug>   (cc en minúscula)
//   sin country_code             ->  es: /empleos/<slug>        en: /jobs/<slug>         (solo como alternativa)
//
// El listado por país (/<cc>/empleos) no cambia.

export interface JobPaths {
  /** País en minúscula, o null si la oferta no tiene un country_code válido. */
  cc: string | null
  es: string
  en: string
}

export function normalizeCountry(countryCode: unknown): string | null {
  const cc = String(countryCode ?? '').trim().toLowerCase()
  return /^[a-z]{2}$/.test(cc) ? cc : null
}

export function jobPaths(slug: string, countryCode?: unknown): JobPaths {
  const s = encodeURIComponent(slug)
  const cc = normalizeCountry(countryCode)
  return cc
    ? { cc, es: `/${cc}/ofertas/${s}`, en: `/${cc}/jobs/${s}` }
    : { cc: null, es: `/empleos/${s}`, en: `/jobs/${s}` }
}
