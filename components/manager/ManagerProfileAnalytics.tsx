import React from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PencilSquareIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../shared/LoadingSpinner';
import {
  useManagedProfilesData,
  missingToPublish,
  EMPTY_CONTENT,
  type ProfileContent,
} from './useManagedProfilesData';

// Analitica individual de un perfil gestionado. Se llega desde su tarjeta en el
// listado; la vista global vive en /manager/analiticas.

const METRICAS: Array<[keyof ProfileContent, string, string, number]> = [
  ['experiences', 'Experiencias', 'bg-cv-blue', 1],
  ['education', 'Formación', 'bg-violet-500', 0],
  ['skills', 'Habilidades', 'bg-cv-green', 3],
  ['languages', 'Idiomas', 'bg-amber-500', 0],
  ['portfolio', 'Portfolio', 'bg-rose-500', 0],
];

const REQUISITOS = 7;

const ManagerProfileAnalytics: React.FC = () => {
  const { profileId } = useParams<{ profileId: string }>();
  const { profiles, content, loading, error } = useManagedProfilesData();
  const navigate = useNavigate();

  if (loading) return <LoadingSpinner message="Cargando analítica..." />;

  const p = profiles.find((x) => x.id === profileId);

  if (error || !p) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-dark-text-tertiary mb-3" aria-hidden="true" />
        <p className="font-semibold text-gray-900 dark:text-dark-text-primary mb-1">
          Perfil no encontrado
        </p>
        <p className="text-sm text-gray-500 dark:text-dark-text-secondary mb-6">
          No existe o no forma parte de los que gestionas.
        </p>
        <Link
          to="/manager"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cv-blue text-white font-medium hover:bg-cv-blue-dark focus:outline-none focus:ring-2 focus:ring-cv-blue focus:ring-offset-2 dark:focus:ring-offset-dark-bg-primary transition-colors"
        >
          Volver al listado
        </Link>
      </div>
    );
  }

  const c = content[p.id] ?? EMPTY_CONTENT;
  const falta = missingToPublish(p, c);
  const cumplidos = REQUISITOS - falta.length;
  const pct = Math.round((cumplidos / REQUISITOS) * 100);
  const totalElementos = c.experiences + c.education + c.skills + c.languages + c.portfolio;

  // Media del resto para poder comparar: un numero suelto no dice si es mucho.
  const otros = profiles.filter((x) => x.id !== p.id);
  const mediaOtros = otros.length
    ? Math.round(
        (otros.reduce((acc, x) => {
          const cc = content[x.id] ?? EMPTY_CONTENT;
          return acc + cc.experiences + cc.education + cc.skills + cc.languages + cc.portfolio;
        }, 0) /
          otros.length) *
          10,
      ) / 10
    : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/manager')}
        className="inline-flex items-center gap-2 mb-5 text-sm text-gray-500 dark:text-dark-text-secondary hover:text-cv-blue dark:hover:text-cv-blue-light focus:outline-none focus:ring-2 focus:ring-cv-blue rounded-md transition-colors"
      >
        <ArrowLeftIcon className="w-4 h-4" aria-hidden="true" />
        Perfiles gestionados
      </button>

      {/* Cabecera del tutor */}
      <div className="rounded-xl bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border p-6 mb-4">
        <div className="flex items-start gap-4">
          {p.avatar_url ? (
            <img
              src={p.avatar_url}
              alt=""
              className="w-16 h-16 rounded-full object-cover object-top shrink-0 bg-gray-100 dark:bg-dark-bg-tertiary"
            />
          ) : (
            <div className="w-16 h-16 rounded-full shrink-0 bg-gradient-to-br from-cv-blue to-cv-blue-dark flex items-center justify-center text-white text-xl font-semibold">
              {(p.full_name || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-dark-text-primary truncate">
              {p.full_name}
            </h1>
            <p className="text-sm text-gray-500 dark:text-dark-text-secondary">
              {p.headline || 'Sin titular'}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span className={p.slug ? 'text-cv-green font-medium' : 'text-gray-400 dark:text-dark-text-tertiary'}>
                {p.slug ? 'Publicado' : 'Sin publicar'}
              </span>
              <span className="text-gray-400 dark:text-dark-text-tertiary capitalize">
                Plantilla: {p.template || 'sin plantilla'}
              </span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => navigate(`/manager/edit/${p.id}`)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cv-blue text-white text-sm font-medium hover:bg-cv-blue-dark focus:outline-none focus:ring-2 focus:ring-cv-blue focus:ring-offset-2 dark:focus:ring-offset-dark-bg-secondary transition-colors"
            >
              <PencilSquareIcon className="w-4 h-4" aria-hidden="true" />
              Editar
            </button>
            {p.slug && (
              <a
                href={`/cv/${p.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Ver la ficha pública (se abre en una pestaña nueva)"
                className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-gray-300 dark:border-dark-border-light text-gray-600 dark:text-dark-text-secondary hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary focus:outline-none focus:ring-2 focus:ring-cv-blue transition-colors"
              >
                <ArrowTopRightOnSquareIcon className="w-4 h-4" aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Estado de publicacion */}
      <div
        className={`rounded-xl border p-5 mb-4 ${
          falta.length === 0
            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30'
            : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30'
        }`}
      >
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            {falta.length === 0 ? (
              <CheckCircleIcon className="w-5 h-5 text-cv-green" aria-hidden="true" />
            ) : (
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            )}
            <h2
              className={`font-semibold ${
                falta.length === 0
                  ? 'text-emerald-900 dark:text-emerald-300'
                  : 'text-amber-900 dark:text-amber-300'
              }`}
            >
              {falta.length === 0 ? 'Listo para publicar' : 'No puede publicarse todavía'}
            </h2>
          </div>
          <span
            className={`text-sm font-bold ${
              falta.length === 0 ? 'text-cv-green' : 'text-amber-600 dark:text-amber-400'
            }`}
          >
            {cumplidos} de {REQUISITOS}
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/60 dark:bg-black/20 overflow-hidden mb-3">
          <div
            className={`h-full rounded-full transition-all ${falta.length === 0 ? 'bg-cv-green' : 'bg-amber-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {falta.length > 0 && (
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Falta: <span className="font-medium">{falta.join(', ')}</span>
          </p>
        )}
      </div>

      {/* Desglose de contenido */}
      <div className="rounded-xl bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-dark-border flex items-baseline justify-between gap-3">
          <h2 className="font-semibold text-gray-900 dark:text-dark-text-primary">Contenido del CV</h2>
          <p className="text-xs text-gray-500 dark:text-dark-text-secondary">
            {totalElementos} elementos · media del resto: {mediaOtros}
          </p>
        </div>
        <ul className="divide-y divide-gray-100 dark:divide-dark-border">
          {METRICAS.map(([clave, etiqueta, color, minimo]) => {
            const n = c[clave];
            const insuficiente = minimo > 0 && n < minimo;
            const ancho = totalElementos > 0 ? (n / Math.max(totalElementos, 1)) * 100 : 0;
            return (
              <li key={clave} className="px-5 py-3 flex items-center gap-4">
                <span className="w-24 shrink-0 text-sm text-gray-700 dark:text-dark-text-secondary">
                  {etiqueta}
                </span>
                <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-dark-bg-tertiary overflow-hidden">
                  <div className={`h-full rounded-full ${color}`} style={{ width: `${ancho}%` }} />
                </div>
                <span
                  className={`w-8 text-right font-bold ${
                    insuficiente
                      ? 'text-amber-600 dark:text-amber-400'
                      : n === 0
                        ? 'text-gray-300 dark:text-dark-text-tertiary'
                        : 'text-gray-900 dark:text-dark-text-primary'
                  }`}
                >
                  {n}
                </span>
                <span className="w-14 shrink-0 text-[11px] text-gray-400 dark:text-dark-text-tertiary">
                  {minimo > 0 ? `mín. ${minimo}` : 'opcional'}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="mt-6 text-xs text-gray-400 dark:text-dark-text-tertiary">
        Las visitas a la ficha pública no se muestran porque el registro de analítica
        no está capturando datos.
      </p>
    </div>
  );
};

export default ManagerProfileAnalytics;
