import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase/client';

// Datos de los perfiles gestionados, compartidos por las secciones del panel
// (listado, analiticas, plantillas). Vive en un hook para no repetir la consulta
// ni la logica de "que le falta a este perfil" en cada pantalla.

export interface ManagedProfileRow {
  id: string;
  full_name: string;
  headline: string | null;
  email: string | null;
  summary: string | null;
  slug: string | null;
  avatar_url: string | null;
  template: string | null;
  created_at: string | null;
}

export interface ProfileContent {
  experiences: number;
  education: number;
  skills: number;
  languages: number;
  portfolio: number;
}

export const EMPTY_CONTENT: ProfileContent = {
  experiences: 0,
  education: 0,
  skills: 0,
  languages: 0,
  portfolio: 0,
};

// Mismos requisitos que exige el paso de Finalizacion del wizard: identidad
// completa, al menos 1 experiencia y al menos 3 habilidades.
export const missingToPublish = (
  p: ManagedProfileRow,
  c: ProfileContent = EMPTY_CONTENT,
): string[] =>
  [
    !p.full_name && 'nombre',
    !p.email && 'email',
    !p.headline && 'titular',
    !p.summary && 'resumen',
    !p.avatar_url && 'foto',
    c.experiences === 0 && 'experiencia',
    c.skills < 3 && `${3 - c.skills} habilidad${3 - c.skills === 1 ? '' : 'es'}`,
  ].filter(Boolean) as string[];

const TABLAS: Array<[keyof ProfileContent, string]> = [
  ['experiences', 'experiences'],
  ['education', 'education'],
  ['skills', 'skills'],
  ['languages', 'languages'],
  ['portfolio', 'portfolio_items'],
];

export interface Visita {
  profile_id: string;
  viewed_at: string;
}

export function useManagedProfilesData() {
  const { session } = useAuth();
  const [profiles, setProfiles] = useState<ManagedProfileRow[]>([]);
  const [content, setContent] = useState<Record<string, ProfileContent>>({});
  const [views, setViews] = useState<Visita[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!session?.user.id) return;
    setLoading(true);
    setError(false);
    try {
      const { data, error: err } = await supabase
        .from('profiles')
        .select('id, full_name, headline, email, summary, slug, avatar_url, template, created_at')
        .eq('managed_by', session.user.id)
        .order('created_at', { ascending: false });

      if (err) throw err;
      const rows = (data || []) as ManagedProfileRow[];
      setProfiles(rows);

      const ids = rows.map((r) => r.id);
      if (ids.length === 0) {
        setContent({});
        return;
      }

      // Cinco consultas en paralelo pidiendo solo profile_id: es la forma barata
      // de conocer el volumen de cada CV sin traerse su contenido entero.
      // Visitas registradas. Legibles desde 2026-07-30, cuando se añadio la
      // politica RLS que da SELECT al gestor sobre los perfiles que administra:
      // antes RLS filtraba el 100% de las filas y PostgREST devolvia 200 con
      // lista vacia, indistinguible de "no hay datos".
      supabase
        .from('analytics_views')
        .select('profile_id, viewed_at')
        .in('profile_id', ids)
        .order('viewed_at', { ascending: true })
        .then(({ data, error: verr }) => setViews(verr ? [] : ((data || []) as Visita[])));

      const results = await Promise.all(
        TABLAS.map(([, tabla]) => supabase.from(tabla).select('profile_id').in('profile_id', ids)),
      );
      const acc: Record<string, ProfileContent> = {};
      for (const id of ids) acc[id] = { ...EMPTY_CONTENT };
      results.forEach((res, i) => {
        if (res.error) return;
        const clave = TABLAS[i][0];
        for (const row of res.data || []) {
          const pid = (row as { profile_id: string }).profile_id;
          if (acc[pid]) acc[pid][clave] += 1;
        }
      });
      setContent(acc);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [session?.user.id]);

  useEffect(() => {
    load();
  }, [load]);

  return { profiles, content, views, loading, error, reload: load };
}
