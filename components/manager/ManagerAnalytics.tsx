import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  ChartBarIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../shared/LoadingSpinner';
import {
  useManagedProfilesData,
  missingToPublish,
  EMPTY_CONTENT,
  type ProfileContent,
} from './useManagedProfilesData';

// Analitica GLOBAL del conjunto de perfiles gestionados. La individual vive en
// /manager/analiticas/:profileId, accesible desde cada tarjeta del listado.
//
// Mide CONTENIDO, no trafico: analytics_views / analytics_clicks / analytics_leads
// estan a 0 filas y visitar una ficha publica no registra nada.

const COLORES = ['#2563EB', '#8B5CF6', '#10B981', '#F59E0B', '#F43F5E'];
const REQUISITOS = 7;

const Tarjeta: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div
    className={`rounded-xl bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border p-5 ${className}`}
  >
    {children}
  </div>
);

const ManagerAnalytics: React.FC = () => {
  const { profiles, content, loading, error, reload } = useManagedProfilesData();
  const navigate = useNavigate();

  if (loading) return <LoadingSpinner message="Calculando analíticas..." />;

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div
          role="alert"
          className="text-center py-16 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
        >
          <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-red-400 dark:text-red-500 mb-3" aria-hidden="true" />
          <p className="font-semibold text-gray-900 dark:text-dark-text-primary mb-1">
            No se pudieron cargar las analíticas
          </p>
          <button
            onClick={reload}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cv-blue text-white font-medium hover:bg-cv-blue-dark focus:outline-none focus:ring-2 focus:ring-cv-blue focus:ring-offset-2 dark:focus:ring-offset-dark-bg-primary transition-colors"
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

  const suma = (k: keyof ProfileContent) =>
    profiles.reduce((acc, p) => acc + (content[p.id]?.[k] ?? 0), 0);

  const publicados = profiles.filter((p) => p.slug).length;
  const listos = profiles.filter((p) => missingToPublish(p, content[p.id]).length === 0).length;

  const datosContenido = [
    { nombre: 'Experiencias', valor: suma('experiences') },
    { nombre: 'Formación', valor: suma('education') },
    { nombre: 'Habilidades', valor: suma('skills') },
    { nombre: 'Idiomas', valor: suma('languages') },
    { nombre: 'Portfolio', valor: suma('portfolio') },
  ];

  // Reparto por completitud: cuantos perfiles estan a 7/7, 6/7, etc.
  const porCompletitud = new Map<number, number>();
  for (const p of profiles) {
    const cumplidos = REQUISITOS - missingToPublish(p, content[p.id]).length;
    porCompletitud.set(cumplidos, (porCompletitud.get(cumplidos) || 0) + 1);
  }
  const datosCompletitud = [...porCompletitud.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([n, cuantos]) => ({ nombre: `${n}/${REQUISITOS}`, valor: cuantos, completo: n === REQUISITOS }));

  // Reparto por plantilla (la seccion propia se retiro; el dato sigue siendo util).
  const porPlantilla = new Map<string, number>();
  for (const p of profiles) {
    const t = p.template || 'Sin plantilla';
    porPlantilla.set(t, (porPlantilla.get(t) || 0) + 1);
  }
  const datosPlantilla = [...porPlantilla.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([nombre, valor]) => ({ nombre, valor }));

  // Requisito que mas se incumple: dice donde esta el cuello de botella real.
  const fallosPorRequisito = new Map<string, number>();
  for (const p of profiles) {
    for (const f of missingToPublish(p, content[p.id])) {
      const clave = f.includes('habilidad') ? 'habilidades' : f;
      fallosPorRequisito.set(clave, (fallosPorRequisito.get(clave) || 0) + 1);
    }
  }
  const cuellos = [...fallosPorRequisito.entries()].sort((a, b) => b[1] - a[1]);

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

      {/* Cifras cabecera */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {([
          ['Perfiles', total, 'text-gray-900 dark:text-dark-text-primary'],
          ['Publicados', publicados, 'text-cv-green'],
          ['Listos para publicar', listos, listos === total ? 'text-cv-green' : 'text-amber-600 dark:text-amber-400'],
          ['Elementos totales', datosContenido.reduce((a, d) => a + d.valor, 0), 'text-gray-900 dark:text-dark-text-primary'],
        ] as const).map(([etiqueta, valor, color]) => (
          <Tarjeta key={etiqueta}>
            <p className={`text-3xl font-bold leading-none ${color}`}>{valor}</p>
            <p className="mt-2 text-xs text-gray-500 dark:text-dark-text-secondary">{etiqueta}</p>
          </Tarjeta>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Volumen de contenido agregado */}
        <Tarjeta>
          <h2 className="font-semibold text-gray-900 dark:text-dark-text-primary mb-1">
            Contenido acumulado
          </h2>
          <p className="text-xs text-gray-500 dark:text-dark-text-secondary mb-4">
            Suma de los {total} perfiles.
          </p>
          <div className="h-56 text-gray-500 dark:text-dark-text-secondary">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datosContenido} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.15} vertical={false} />
                <XAxis dataKey="nombre" tick={ejeStyle} axisLine={false} tickLine={false} />
                <YAxis tick={ejeStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: 'currentColor', opacity: 0.06 }}
                  contentStyle={{ borderRadius: 8, border: '1px solid rgba(128,128,128,.3)', fontSize: 12 }}
                />
                <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                  {datosContenido.map((_, i) => (
                    <Cell key={i} fill={COLORES[i % COLORES.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Tarjeta>

        {/* Reparto por completitud */}
        <Tarjeta>
          <h2 className="font-semibold text-gray-900 dark:text-dark-text-primary mb-1">
            Requisitos cumplidos
          </h2>
          <p className="text-xs text-gray-500 dark:text-dark-text-secondary mb-4">
            Cuántos perfiles hay en cada nivel. {REQUISITOS}/{REQUISITOS} es publicable.
          </p>
          <div className="h-56 text-gray-500 dark:text-dark-text-secondary">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datosCompletitud} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.15} vertical={false} />
                <XAxis dataKey="nombre" tick={ejeStyle} axisLine={false} tickLine={false} />
                <YAxis tick={ejeStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: 'currentColor', opacity: 0.06 }}
                  contentStyle={{ borderRadius: 8, border: '1px solid rgba(128,128,128,.3)', fontSize: 12 }}
                />
                <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                  {datosCompletitud.map((d, i) => (
                    <Cell key={i} fill={d.completo ? '#10B981' : '#F59E0B'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Tarjeta>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cuellos de botella */}
        <Tarjeta>
          <h2 className="font-semibold text-gray-900 dark:text-dark-text-primary mb-1">
            Qué bloquea la publicación
          </h2>
          <p className="text-xs text-gray-500 dark:text-dark-text-secondary mb-4">
            Requisito incumplido, y en cuántos perfiles.
          </p>
          {cuellos.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-cv-green py-4">
              <CheckCircleIcon className="w-5 h-5" aria-hidden="true" />
              Los {total} perfiles cumplen todos los requisitos.
            </div>
          ) : (
            <ul className="space-y-2.5">
              {cuellos.map(([nombre, n]) => (
                <li key={nombre} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-xs text-gray-600 dark:text-dark-text-secondary capitalize">
                    {nombre}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-dark-bg-tertiary overflow-hidden">
                    <div className="h-full rounded-full bg-amber-500" style={{ width: `${(n / total) * 100}%` }} />
                  </div>
                  <span className="w-16 text-right text-xs font-semibold text-gray-700 dark:text-dark-text-primary">
                    {n} de {total}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>

        {/* Reparto por plantilla */}
        <Tarjeta>
          <h2 className="font-semibold text-gray-900 dark:text-dark-text-primary mb-1">
            Plantillas en uso
          </h2>
          <p className="text-xs text-gray-500 dark:text-dark-text-secondary mb-2">
            Cómo se reparten los {total} perfiles.
          </p>
          <div className="h-48 text-gray-500 dark:text-dark-text-secondary">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={datosPlantilla}
                  dataKey="valor"
                  nameKey="nombre"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={2}
                >
                  {datosPlantilla.map((_, i) => (
                    <Cell key={i} fill={COLORES[i % COLORES.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid rgba(128,128,128,.3)', fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-1">
            {datosPlantilla.map((d, i) => (
              <li key={d.nombre} className="flex items-center gap-2 text-xs">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: COLORES[i % COLORES.length] }}
                  aria-hidden="true"
                />
                <span className="capitalize text-gray-700 dark:text-dark-text-secondary flex-1 truncate">
                  {d.nombre}
                </span>
                <span className="font-semibold text-gray-900 dark:text-dark-text-primary">{d.valor}</span>
              </li>
            ))}
          </ul>
        </Tarjeta>
      </div>

      <p className="mt-6 text-xs text-gray-400 dark:text-dark-text-tertiary">
        Para el detalle de un tutor concreto, usa el botón de analítica en su tarjeta
        del listado de perfiles. Las visitas a fichas públicas no se muestran porque
        el registro de analítica no está capturando datos.
      </p>
    </div>
  );
};

export default ManagerAnalytics;
