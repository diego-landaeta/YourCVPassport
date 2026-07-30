import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  ChartBarIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  EyeIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../shared/LoadingSpinner';
import {
  useManagedProfilesData,
  missingToPublish,
  EMPTY_CONTENT,
  type ProfileContent,
} from './useManagedProfilesData';

// Analitica global del conjunto de perfiles gestionados.
//
// Se construye sobre las VISITAS, que es el unico dato con variacion real. La
// version anterior graficaba agregados de contenido y reparto de plantillas,
// pero con perfiles casi identicos eso producia un donut de un solo trozo al
// 100% y barras sueltas: superficie de grafico sin informacion.

const REQUISITOS = 7;

const Tarjeta: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`rounded-xl bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border p-5 ${className}`}>
    {children}
  </div>
);

const ManagerAnalytics: React.FC = () => {
  const { profiles, content, views, loading, error, reload } = useManagedProfilesData();
  const navigate = useNavigate();

  if (loading) return <LoadingSpinner message="Calculando analíticas..." />;

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div role="alert" className="text-center py-16 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-red-400 dark:text-red-500 mb-3" aria-hidden="true" />
          <p className="font-semibold text-gray-900 dark:text-dark-text-primary mb-4">
            No se pudieron cargar las analíticas
          </p>
          <button
            onClick={reload}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cv-blue text-white font-medium hover:bg-cv-blue-dark focus:outline-none focus:ring-2 focus:ring-cv-blue transition-colors"
          >
            <ArrowPathIcon className="w-5 h-5" aria-hidden="true" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const total = profiles.length;

  if (total === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-16 rounded-xl border border-dashed border-gray-300 dark:border-dark-border">
          <p className="text-gray-600 dark:text-dark-text-secondary">Aún no gestionas ningún perfil.</p>
        </div>
      </div>
    );
  }

  // ---- visitas -------------------------------------------------------------
  const porPerfil = new Map<string, number>();
  for (const v of views) porPerfil.set(v.profile_id, (porPerfil.get(v.profile_id) || 0) + 1);

  const ranking = profiles
    .map((p) => ({ p, visitas: porPerfil.get(p.id) || 0 }))
    .sort((a, b) => b.visitas - a.visitas);

  const maxVisitas = Math.max(...ranking.map((r) => r.visitas), 1);
  const conVisitas = ranking.filter((r) => r.visitas > 0).length;

  // Serie diaria completa: sin rellenar los huecos, dos visitas separadas por
  // una semana se dibujarian como dias consecutivos y la grafica mentiria.
  const porDia = new Map<string, number>();
  for (const v of views) {
    const dia = v.viewed_at.slice(0, 10);
    porDia.set(dia, (porDia.get(dia) || 0) + 1);
  }
  const serie: Array<{ dia: string; etiqueta: string; visitas: number }> = [];
  if (views.length > 0) {
    const inicio = new Date(views[0].viewed_at.slice(0, 10));
    const fin = new Date();
    for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
      const clave = d.toISOString().slice(0, 10);
      serie.push({
        dia: clave,
        etiqueta: `${d.getDate()}/${d.getMonth() + 1}`,
        visitas: porDia.get(clave) || 0,
      });
    }
  }

  // ---- estado de publicacion ----------------------------------------------
  const bloqueados = profiles
    .map((p) => ({ p, falta: missingToPublish(p, content[p.id] ?? EMPTY_CONTENT) }))
    .filter((x) => x.falta.length > 0);

  const suma = (k: keyof ProfileContent) =>
    profiles.reduce((acc, p) => acc + (content[p.id]?.[k] ?? 0), 0);
  const elementos = (['experiences', 'education', 'skills', 'languages', 'portfolio'] as const)
    .reduce((a, k) => a + suma(k), 0);

  const ejeStyle = { fontSize: 11, fill: 'currentColor' };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-cv-blue to-cv-blue-dark shadow-sm">
          <ChartBarIcon className="w-7 h-7 text-white" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary leading-tight">
            Analítica global
          </h1>
          <p className="text-sm text-gray-500 dark:text-dark-text-secondary">
            Conjunto de los {total} perfiles que gestionas.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {([
          ['Visitas totales', views.length, 'text-cv-blue dark:text-cv-blue-light'],
          ['Tutores visitados', `${conVisitas} de ${total}`, 'text-gray-900 dark:text-dark-text-primary'],
          ['Listos para publicar', `${total - bloqueados.length} de ${total}`, bloqueados.length ? 'text-amber-600 dark:text-amber-400' : 'text-cv-green'],
          ['Elementos de CV', elementos, 'text-gray-900 dark:text-dark-text-primary'],
        ] as const).map(([etiqueta, valor, color]) => (
          <Tarjeta key={etiqueta}>
            <p className={`text-3xl font-bold leading-none ${color}`}>{valor}</p>
            <p className="mt-2 text-xs text-gray-500 dark:text-dark-text-secondary">{etiqueta}</p>
          </Tarjeta>
        ))}
      </div>

      {views.length > 0 ? (
        <Tarjeta className="mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-dark-text-primary mb-1">
            Visitas por día
          </h2>
          <p className="text-xs text-gray-500 dark:text-dark-text-secondary mb-4">
            Desde la primera visita registrada.
          </p>
          <div className="h-56 text-gray-500 dark:text-dark-text-secondary">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={serie} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradVisitas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.15} vertical={false} />
                <XAxis dataKey="etiqueta" tick={ejeStyle} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={24} />
                <YAxis tick={ejeStyle} axisLine={false} tickLine={false} allowDecimals={false} width={32} />
                <Tooltip
                  cursor={{ stroke: '#2563EB', strokeWidth: 1, opacity: 0.4 }}
                  contentStyle={{ borderRadius: 8, border: '1px solid rgba(128,128,128,.3)', fontSize: 12 }}
                  labelFormatter={(l) => `Día ${l}`}
                  formatter={(v: number) => [v, 'visitas']}
                />
                <Area type="monotone" dataKey="visitas" stroke="#2563EB" strokeWidth={2} fill="url(#gradVisitas)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Tarjeta>
      ) : (
        <Tarjeta className="mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-dark-text-secondary py-6 justify-center">
            <EyeIcon className="w-5 h-5" aria-hidden="true" />
            Todavía no hay visitas registradas en las fichas públicas.
          </div>
        </Tarjeta>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Tarjeta>
          <h2 className="font-semibold text-gray-900 dark:text-dark-text-primary mb-1">
            Tutores más visitados
          </h2>
          <p className="text-xs text-gray-500 dark:text-dark-text-secondary mb-4">
            Pulsa para ver el detalle de un tutor.
          </p>
          <ul className="space-y-2">
            {ranking.slice(0, 8).map(({ p, visitas }) => (
              <li key={p.id}>
                <button
                  onClick={() => navigate(`/manager/analiticas/${p.id}`)}
                  className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary focus:outline-none focus:ring-2 focus:ring-cv-blue transition-colors"
                >
                  <span className="w-28 shrink-0 text-xs text-left text-gray-700 dark:text-dark-text-secondary truncate">
                    {p.full_name}
                  </span>
                  <span className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-dark-bg-tertiary overflow-hidden">
                    <span
                      className={`block h-full rounded-full ${visitas > 0 ? 'bg-cv-blue' : ''}`}
                      style={{ width: `${(visitas / maxVisitas) * 100}%` }}
                    />
                  </span>
                  <span className="w-6 text-right text-xs font-semibold text-gray-900 dark:text-dark-text-primary">
                    {visitas}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Tarjeta>

        <Tarjeta>
          <h2 className="font-semibold text-gray-900 dark:text-dark-text-primary mb-1">
            Pendientes de completar
          </h2>
          <p className="text-xs text-gray-500 dark:text-dark-text-secondary mb-4">
            No cumplen los {REQUISITOS} requisitos para publicarse.
          </p>
          {bloqueados.length === 0 ? (
            <p className="text-sm text-cv-green py-4">
              Los {total} perfiles cumplen todos los requisitos.
            </p>
          ) : (
            <ul className="space-y-2">
              {bloqueados.map(({ p, falta }) => (
                <li key={p.id}>
                  <button
                    onClick={() => navigate(`/manager/edit/${p.id}`)}
                    className="w-full flex items-center justify-between gap-3 text-left px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 focus:outline-none focus:ring-2 focus:ring-cv-blue transition-colors group"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-gray-900 dark:text-dark-text-primary truncate">
                        {p.full_name}
                      </span>
                      <span className="block text-xs text-amber-700 dark:text-amber-400">
                        Falta: {falta.join(', ')}
                      </span>
                    </span>
                    <PencilSquareIcon className="w-4 h-4 shrink-0 text-gray-400 group-hover:text-cv-blue" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>
      </div>
    </div>
  );
};

export default ManagerAnalytics;
