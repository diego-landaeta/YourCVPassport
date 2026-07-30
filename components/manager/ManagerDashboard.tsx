import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilSquareIcon,
  ArrowTopRightOnSquareIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  EyeIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase/client';
import LoadingSpinner from '../shared/LoadingSpinner';

interface ManagedProfileRow {
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

// Contenido de cada perfil. El gestor de veinte CV necesita ver cuales estan
// flacos sin abrirlos uno a uno.
interface ProfileContent {
  experiences: number;
  education: number;
  skills: number;
  languages: number;
  portfolio: number;
}

const EMPTY_CONTENT: ProfileContent = {
  experiences: 0,
  education: 0,
  skills: 0,
  languages: 0,
  portfolio: 0,
};

// Mismos requisitos que exige el paso de Finalizacion del wizard: identidad
// completa, al menos 1 experiencia y al menos 3 habilidades. Se replican aqui
// para que el gestor lo vea de un vistazo en vez de entrar a cada perfil y
// llegar al ultimo paso para enterarse.
const missingToPublish = (p: ManagedProfileRow, c: ProfileContent = EMPTY_CONTENT): string[] =>
  [
    !p.full_name && 'nombre',
    !p.email && 'email',
    !p.headline && 'titular',
    !p.summary && 'resumen',
    !p.avatar_url && 'foto',
    c.experiences === 0 && 'experiencia',
    c.skills < 3 && `${3 - c.skills} habilidad${3 - c.skills === 1 ? '' : 'es'}`,
  ].filter(Boolean) as string[];

// Paleta estable: un mismo perfil recibe siempre el mismo color de respaldo.
const AVATAR_GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-violet-500 to-purple-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-sky-600',
];

const gradientFor = (seed: string): string => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
};

const initialsOf = (name: string): string =>
  (name || '?')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('') || '?';

// Las fotos llegan hotlinkeadas desde un WordPress externo y con proporciones
// dispares (apaisada, vertical, cuadrada). `object-top` encuadra la cara en vez
// del centro geometrico, que en un recorte circular pequeño cae sobre el cuello.
// `onError` cubre el caso de que el origen deje de servir la imagen: sin el, el
// respaldo de iniciales solo aparecia cuando avatar_url era null.
const ProfileAvatar: React.FC<{ name: string; url: string | null; seed: string }> = ({
  name,
  url,
  seed,
}) => {
  const [failed, setFailed] = useState(false);
  const ring = 'ring-2 ring-white dark:ring-dark-bg-secondary shadow-sm';

  if (url && !failed) {
    return (
      <img
        src={url}
        alt={name}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className={`w-16 h-16 shrink-0 rounded-full object-cover object-top bg-gray-100 dark:bg-dark-bg-tertiary ${ring}`}
      />
    );
  }

  return (
    <div
      className={`w-16 h-16 shrink-0 rounded-full bg-gradient-to-br ${gradientFor(seed)} ${ring} flex items-center justify-center text-white font-semibold text-lg select-none`}
      aria-label={name}
    >
      {initialsOf(name)}
    </div>
  );
};

// Panel del rol `profile_manager`: crea y gestiona varios perfiles profesionales.
const ManagerDashboard: React.FC = () => {
  const { session } = useAuth();
  const navigate = useNavigate();

  const [profiles, setProfiles] = useState<ManagedProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'incomplete'>('all');
  // Sin esto, un fallo de carga dejaba `profiles` en [] y se pintaba el estado
  // vacio: "aun no has creado ningun perfil". El gestor SI los tiene; lo que
  // fallo fue la consulta. El aviso de error necesita ser un estado propio.
  const [loadError, setLoadError] = useState(false);
  // Visitas de los ultimos 30 dias por perfil. Es informacion adicional: si la
  // consulta falla (RLS, tabla ausente) el panel sigue funcionando sin ella en
  // lugar de romperse. `null` = no disponible, distinto de 0 visitas.
  const [views, setViews] = useState<Record<string, number> | null>(null);
  const [content, setContent] = useState<Record<string, ProfileContent>>({});

  // Formulario de creación
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [fullName, setFullName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [headline, setHeadline] = useState('');

  // Visitas de los ultimos 30 dias, agregadas por perfil. Se pide solo la columna
  // profile_id y se cuenta en cliente: son decenas de filas, no merece una vista
  // agregada en base de datos todavia.
  // Recuento de contenido por perfil. Cinco consultas en paralelo pidiendo solo
  // profile_id: es la forma barata de saber el volumen de los veinte CV sin
  // traerse su contenido entero.
  const loadContent = useCallback(async (ids: string[]) => {
    if (ids.length === 0) {
      setContent({});
      return;
    }
    const tablas: Array<[keyof ProfileContent, string]> = [
      ['experiences', 'experiences'],
      ['education', 'education'],
      ['skills', 'skills'],
      ['languages', 'languages'],
      ['portfolio', 'portfolio_items'],
    ];
    try {
      const results = await Promise.all(
        tablas.map(([, tabla]) => supabase.from(tabla).select('profile_id').in('profile_id', ids)),
      );
      const acc: Record<string, ProfileContent> = {};
      for (const id of ids) acc[id] = { ...EMPTY_CONTENT };
      results.forEach((res, i) => {
        if (res.error) return;
        const clave = tablas[i][0];
        for (const row of res.data || []) {
          const pid = (row as { profile_id: string }).profile_id;
          if (acc[pid]) acc[pid][clave] += 1;
        }
      });
      setContent(acc);
    } catch {
      setContent({});
    }
  }, []);

  const loadViews = useCallback(async (ids: string[]) => {
    if (ids.length === 0) {
      setViews({});
      return;
    }
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    try {
      // La columna es viewed_at, no created_at: analytics_views no se creo por
      // migracion en este repo, asi que su esquema no es el habitual.
      const { data, error } = await supabase
        .from('analytics_views')
        .select('profile_id')
        .in('profile_id', ids)
        .gte('viewed_at', since);

      if (error) throw error;

      const counts: Record<string, number> = {};
      for (const row of data || []) {
        const id = (row as { profile_id: string }).profile_id;
        counts[id] = (counts[id] || 0) + 1;
      }
      setViews(counts);
    } catch {
      // Sin permiso o sin tabla: se oculta la seccion en vez de mostrar ceros
      // falsos, que serian peor que no mostrar nada.
      setViews(null);
    }
  }, []);

  const loadProfiles = useCallback(async () => {
    if (!session?.user.id) return;
    setLoading(true);
    setLoadError(false);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, headline, email, summary, slug, avatar_url, template, created_at')
        .eq('managed_by', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const rows = (data || []) as ManagedProfileRow[];
      setProfiles(rows);
      const ids = rows.map((r) => r.id);
      loadViews(ids);
      loadContent(ids);
    } catch (e) {
      setLoadError(true);
      toast.error('No se pudieron cargar los perfiles gestionados');
    } finally {
      setLoading(false);
    }
  }, [session?.user.id]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  // Puente con el sidebar (ManagerLayout): su accion "Crear perfil" abre este
  // formulario desde cualquier pantalla del panel.
  useEffect(() => {
    const open = () => {
      setShowForm(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const filterIncomplete = () => {
      setStatusFilter('incomplete');
      setQuery('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('manager-open-create-form', open);
    window.addEventListener('manager-filter-incomplete', filterIncomplete);
    return () => {
      window.removeEventListener('manager-open-create-form', open);
      window.removeEventListener('manager-filter-incomplete', filterIncomplete);
    };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('El nombre completo es obligatorio');
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-create-managed-profile', {
        body: {
          full_name: fullName.trim(),
          contact_email: contactEmail.trim() || undefined,
          headline: headline.trim() || undefined,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Perfil creado');
      const newId = data?.profile?.id as string | undefined;
      setFullName('');
      setContactEmail('');
      setHeadline('');
      setShowForm(false);
      await loadProfiles();

      // Lleva directamente al editor del perfil recién creado
      if (newId) navigate(`/manager/edit/${newId}`);
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo crear el perfil');
    } finally {
      setCreating(false);
    }
  };

  // Filtro por nombre o titular, sin distinguir mayusculas ni acentos: buscar
  // "yacnira" debe encontrar a "Yacnira Loreleis Martínez Bazán".
  const normalize = (s: string) =>
    s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  // Un perfil esta publicado cuando tiene slug: es lo que le da URL publica.
  const publishedCount = profiles.filter((p) => p.slug).length;
  const draftCount = profiles.length - publishedCount;
  const incompleteCount = profiles.filter((p) => missingToPublish(p, content[p.id]).length > 0).length;

  const needle = normalize(query.trim());
  const visibleProfiles = profiles.filter((p) => {
    if (statusFilter === 'published' && !p.slug) return false;
    if (statusFilter === 'draft' && p.slug) return false;
    if (statusFilter === 'incomplete' && missingToPublish(p, content[p.id]).length === 0) return false;
    if (!needle) return true;
    return (
      normalize(p.full_name || '').includes(needle) ||
      normalize(p.headline || '').includes(needle)
    );
  });

  const isFiltering = Boolean(needle) || statusFilter !== 'all';

  // Se publican las cifras al sidebar (ManagerLayout), que es quien las muestra.
  // Asi no se duplican consultas: los datos ya estan aqui.
  useEffect(() => {
    if (loading || loadError) return;
    const suma = (k: keyof ProfileContent) =>
      profiles.reduce((acc, p) => acc + (content[p.id]?.[k] ?? 0), 0);

    const plantillas: Record<string, number> = {};
    for (const p of profiles) {
      const t = p.template || 'sin plantilla';
      plantillas[t] = (plantillas[t] || 0) + 1;
    }

    window.dispatchEvent(
      new CustomEvent('manager-stats', {
        detail: {
          total: profiles.length,
          publicados: profiles.filter((p) => p.slug).length,
          incompletos: profiles.filter((p) => missingToPublish(p, content[p.id]).length > 0).length,
          contenido: {
            experiencias: suma('experiences'),
            formacion: suma('education'),
            habilidades: suma('skills'),
            idiomas: suma('languages'),
            portfolio: suma('portfolio'),
          },
          plantillas,
        },
      }),
    );
  }, [profiles, content, loading, loadError]);

  const totalViews = views ? Object.values(views).reduce((a, b) => a + b, 0) : null;
  const mostViewed = views
    ? profiles
        .map((p) => ({ p, n: views[p.id] || 0 }))
        .sort((a, b) => b.n - a.n)
        .filter((x) => x.n > 0)[0]
    : undefined;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cv-blue to-cv-blue-dark shadow-sm">
            <UserGroupIcon className="w-7 h-7 text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
              Perfiles gestionados
            </h1>
            <p className="text-sm text-gray-500 dark:text-dark-text-secondary">
              Crea y edita perfiles profesionales que administras.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cv-blue text-white font-medium hover:bg-cv-blue-dark focus:outline-none focus:ring-2 focus:ring-cv-blue focus:ring-offset-2 dark:focus:ring-offset-dark-bg-primary transition-colors shadow-sm"
        >
          <PlusIcon className="w-5 h-5" aria-hidden="true" />
          Crear perfil
        </button>
      </div>

      {/* Analitica agregada. Solo aparece si la consulta funciono Y hay visitas:
          un panel que anuncia "0 visitas en 30 dias" sobre datos que quiza no
          tenga permiso de leer informa mal. */}
      {!loading && !loadError && totalViews !== null && totalViews > 0 && (
        <div className="mb-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border">
            <div className="flex items-center gap-2 text-gray-500 dark:text-dark-text-secondary mb-1">
              <EyeIcon className="w-4 h-4" aria-hidden="true" />
              <span className="text-xs font-medium uppercase tracking-wide">Visitas · 30 días</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">{totalViews}</p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border">
            <div className="flex items-center gap-2 text-gray-500 dark:text-dark-text-secondary mb-1">
              <ChartBarIcon className="w-4 h-4" aria-hidden="true" />
              <span className="text-xs font-medium uppercase tracking-wide">Media por perfil</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
              {profiles.length ? Math.round(totalViews / profiles.length) : 0}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border">
            <div className="flex items-center gap-2 text-gray-500 dark:text-dark-text-secondary mb-1">
              <ArrowTrendingUpIcon className="w-4 h-4" aria-hidden="true" />
              <span className="text-xs font-medium uppercase tracking-wide">Más visitado</span>
            </div>
            {mostViewed ? (
              <p className="text-sm font-semibold text-gray-900 dark:text-dark-text-primary truncate">
                {mostViewed.p.full_name}
                <span className="ml-1.5 font-normal text-gray-500 dark:text-dark-text-secondary">
                  {mostViewed.n}
                </span>
              </p>
            ) : (
              <p className="text-sm text-gray-400 dark:text-dark-text-tertiary">Sin datos</p>
            )}
          </div>
        </div>
      )}

      {/* Resumen que ademas filtra. Con una veintena de perfiles, el dato que le
          falta al gestor no es cuantos hay, sino cuantos quedan a medias — y
          poder saltar a ellos sin recorrer la rejilla. Sigue la escala semantica
          del proyecto: verde completo, gris pendiente. */}
      {!loading && !loadError && profiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5" role="group" aria-label="Filtrar por estado de publicación">
          {([
            { key: 'all', label: 'Todos', count: profiles.length, dot: 'bg-gray-400' },
            { key: 'published', label: 'Publicados', count: publishedCount, dot: 'bg-cv-green' },
            { key: 'draft', label: 'Sin publicar', count: draftCount, dot: 'bg-gray-300 dark:bg-dark-border-light' },
            { key: 'incomplete', label: 'Incompletos', count: incompleteCount, dot: 'bg-amber-500' },
          ] as const).map((chip) => {
            const active = statusFilter === chip.key;
            return (
              <button
                key={chip.key}
                onClick={() => setStatusFilter(chip.key)}
                aria-pressed={active}
                className={`inline-flex items-center gap-2 pl-3 pr-2.5 py-1.5 rounded-full border text-sm font-medium
                  focus:outline-none focus:ring-2 focus:ring-cv-blue focus:ring-offset-2 dark:focus:ring-offset-dark-bg-primary
                  transition-colors ${
                    active
                      ? 'bg-cv-blue text-white border-cv-blue'
                      : 'bg-white dark:bg-dark-bg-secondary text-gray-600 dark:text-dark-text-primary border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-border-light'
                  }`}
              >
                <span aria-hidden="true" className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-white/70' : chip.dot}`} />
                {chip.label}
                <span
                  className={`min-w-[1.5rem] text-center px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                    active ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-dark-bg-tertiary text-gray-600 dark:text-dark-text-primary'
                  }`}
                >
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Formulario de creación */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-8 p-5 rounded-xl bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border space-y-4"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Nuevo perfil gestionado</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-1">
                Nombre completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                maxLength={50}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-dark-border-light bg-white dark:bg-dark-bg-primary text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej. María García"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-1">
                Email de contacto (opcional)
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-dark-border-light bg-white dark:bg-dark-bg-primary text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="contacto@ejemplo.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-primary mb-1">
              Titular / headline (opcional)
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              maxLength={150}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-dark-border-light bg-white dark:bg-dark-bg-primary text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej. Profesora de Psicología | Especialista en..."
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {creating ? 'Creando...' : 'Crear y editar'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-border-light text-gray-700 dark:text-dark-text-primary hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Buscador. Con una veintena de perfiles gestionados la rejilla es un muro:
          sin filtro hay que recorrerla a ojo para encontrar a alguien concreto. */}
      {!loading && !loadError && profiles.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o titular..."
              aria-label="Buscar perfiles gestionados por nombre o titular"
              className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 dark:border-dark-border-light bg-white dark:bg-dark-bg-primary text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <span className="text-sm text-gray-500 dark:text-dark-text-secondary whitespace-nowrap" aria-live="polite">
            {isFiltering
              ? `${visibleProfiles.length} de ${profiles.length}`
              : `${profiles.length} ${profiles.length === 1 ? 'perfil' : 'perfiles'}`}
          </span>
        </div>
      )}

      {/* Listado */}
      {loading ? (
        <LoadingSpinner message="Cargando perfiles..." />
      ) : loadError ? (
        <div
          role="alert"
          className="text-center py-16 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
        >
          <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-red-400 dark:text-red-500 mb-3" aria-hidden="true" />
          <p className="font-semibold text-gray-900 dark:text-white mb-1">No se pudieron cargar los perfiles</p>
          <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
            Puede ser un corte de conexión. Tus perfiles siguen ahí.
          </p>
          <button
            onClick={loadProfiles}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cv-blue text-white font-medium hover:bg-cv-blue-dark focus:outline-none focus:ring-2 focus:ring-cv-blue focus:ring-offset-2 dark:focus:ring-offset-dark-bg-primary transition-colors"
          >
            <ArrowPathIcon className="w-5 h-5" aria-hidden="true" />
            Reintentar
          </button>
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-gray-300 dark:border-dark-border">
          <UserGroupIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-dark-text-tertiary mb-3" />
          <p className="text-gray-600 dark:text-dark-text-secondary">Aún no has creado ningún perfil gestionado.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Crear el primero
          </button>
        </div>
      ) : visibleProfiles.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-gray-300 dark:border-dark-border">
          <MagnifyingGlassIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-dark-text-tertiary mb-3" aria-hidden="true" />
          <p className="text-gray-600 dark:text-dark-text-secondary">
            {query
              ? <>Ningún perfil coincide con <span className="font-semibold text-gray-900 dark:text-white">{query}</span></>
              : 'Ningún perfil en este estado.'}
          </p>
          <button
            onClick={() => { setQuery(''); setStatusFilter('all'); }}
            className="mt-4 px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-border-light text-gray-700 dark:text-dark-text-primary font-medium hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary focus:outline-none focus:ring-2 focus:ring-cv-blue focus:ring-offset-2 dark:focus:ring-offset-dark-bg-primary transition-colors"
          >
            Quitar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleProfiles.map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-xl bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border flex flex-col hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-start gap-4 mb-4">
                <ProfileAvatar name={p.full_name} url={p.avatar_url} seed={p.id} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white truncate leading-snug">
                    {p.full_name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-dark-text-secondary line-clamp-2 leading-snug mt-0.5">
                    {p.headline || 'Sin titular'}
                  </p>
                  <span
                    className={`inline-flex items-center gap-1.5 mt-2 text-xs font-medium ${
                      p.slug
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-gray-400 dark:text-dark-text-tertiary'
                    }`}
                  >
                    {/* El punto es decorativo: el estado ya va escrito al lado,
                        que es lo que lo hace legible sin distinguir el color. */}
                    <span
                      aria-hidden="true"
                      className={`w-1.5 h-1.5 rounded-full ${
                        p.slug ? 'bg-cv-green' : 'bg-gray-300 dark:bg-dark-border-light'
                      }`}
                    />
                    {p.slug ? 'Publicado' : 'Sin publicar'}
                    {views && views[p.id] > 0 && (
                      <span className="inline-flex items-center gap-1 ml-2 text-gray-500 dark:text-dark-text-secondary font-normal">
                        <EyeIcon className="w-3.5 h-3.5" aria-hidden="true" />
                        {views[p.id]}
                        <span className="sr-only">visitas en los últimos 30 días</span>
                      </span>
                    )}
                  </span>

                  {/* Que le falta para poder publicarse. Sin esto el gestor solo
                      lo descubre entrando al perfil y llegando al ultimo paso. */}
                  {missingToPublish(p, content[p.id]).length > 0 && (
                    <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-400">
                      Falta: {missingToPublish(p, content[p.id]).join(', ')}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-auto flex items-center gap-2">
                <button
                  onClick={() => navigate(`/manager/edit/${p.id}`)}
                  aria-label={`Editar el perfil de ${p.full_name}`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-cv-blue text-white text-sm font-medium hover:bg-cv-blue-dark focus:outline-none focus:ring-2 focus:ring-cv-blue focus:ring-offset-2 dark:focus:ring-offset-dark-bg-secondary transition-colors"
                >
                  <PencilSquareIcon className="w-4 h-4" aria-hidden="true" />
                  Editar
                </button>
                <button
                  onClick={() => navigate(`/manager/analiticas/${p.id}`)}
                  aria-label={`Ver la analítica de ${p.full_name}`}
                  title="Ver analítica"
                  className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-gray-300 dark:border-dark-border-light text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary focus:outline-none focus:ring-2 focus:ring-cv-blue focus:ring-offset-2 dark:focus:ring-offset-dark-bg-secondary transition-colors"
                >
                  <ChartBarIcon className="w-4 h-4" aria-hidden="true" />
                </button>
                {p.slug && (
                  <a
                    href={`/cv/${p.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-gray-300 dark:border-dark-border-light text-gray-600 dark:text-dark-text-primary hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary focus:outline-none focus:ring-2 focus:ring-cv-blue focus:ring-offset-2 dark:focus:ring-offset-dark-bg-secondary transition-colors"
                    aria-label={`Ver el CV público de ${p.full_name} (se abre en una pestaña nueva)`}
                    title="Ver CV público"
                  >
                    <ArrowTopRightOnSquareIcon className="w-4 h-4" aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
