import { useEffect, useState } from 'react';
import { FALLBACK_COUNTRIES, type JobCountry } from '../../lib/jobsCatalog';
import { loadCountries } from '../../lib/jobsApi';

let cache: JobCountry[] | null = null;
let pending: Promise<JobCountry[]> | null = null;

/** Paises de la bolsa: la lista de respaldo al instante y la tabla `countries` en cuanto responde. */
export function useJobCountries(): JobCountry[] {
  const [countries, setCountries] = useState<JobCountry[]>(cache ?? [...FALLBACK_COUNTRIES]);

  useEffect(() => {
    if (cache) return;
    let alive = true;
    pending = pending ?? loadCountries().then((c) => { cache = c; return c; });
    pending.then((c) => { if (alive) setCountries(c); });
    return () => { alive = false; };
  }, []);

  return countries;
}
