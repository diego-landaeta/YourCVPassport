import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../supabase/client';

export type PanelCountKey = 'recommended' | 'applications' | 'saved';

/**
 * Contadores de las pestanas del panel del candidato. Candidaturas y guardadas se piden con un
 * conteo ligero (HEAD, sin filas) para que salgan sin abrir la pestana; las recomendadas las
 * anuncia su propia pestana al cargar. Cada pestana vuelve a avisar cuando cambia su lista.
 */
export function usePanelCounts(uid: string | null | undefined) {
  const [counts, setCounts] = useState<Partial<Record<PanelCountKey, number>>>({});

  const setCount = useCallback((key: PanelCountKey, n: number) => {
    setCounts((prev) => (prev[key] === n ? prev : { ...prev, [key]: n }));
  }, []);

  useEffect(() => {
    if (!uid) return;
    let alive = true;
    void (async () => {
      try {
        const [apps, saved] = await Promise.all([
          supabase.from('my_job_applications').select('id', { count: 'exact', head: true }),
          supabase.from('saved_job_postings').select('id', { count: 'exact', head: true }).eq('profile_id', uid),
        ]);
        if (!alive) return;
        // Solo se rellena lo que aun no ha anunciado su pestana
        setCounts((prev) => ({
          ...prev,
          applications: prev.applications ?? (apps.error ? undefined : apps.count ?? undefined),
          saved: prev.saved ?? (saved.error ? undefined : saved.count ?? undefined),
        }));
      } catch {
        /* sin contador: la pestana funciona igual */
      }
    })();
    return () => { alive = false; };
  }, [uid]);

  return { counts, setCount };
}
