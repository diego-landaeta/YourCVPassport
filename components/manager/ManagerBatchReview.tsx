import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Squares2X2Icon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CheckIcon,
  SwatchIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../shared/LoadingSpinner';
import { supabase } from '../../supabase/client';
import { useManagedProfilesData, missingToPublish } from './useManagedProfilesData';

// Revision en lote. Los perfiles gestionados suelen pertenecer a una misma
// institucion, asi que los cambios de presentacion son transversales: la misma
// plantilla y el mismo color de marca para los veinte. Hacerlo perfil por perfil
// son veinte recorridos por el wizard.
//
// Solo se editan en lote campos de PRESENTACION. Titular, resumen o experiencia
// son propios de cada persona y no deben tocarse a la vez.

const PLANTILLAS = [
  'passport',
  'classic',
  'classic-sidebar',
  'modern-clean',
  'modern-minimalist',
  'modern-professional',
  'professional-blue',
  'professional-classic',
  'corporate-classic',
  'elegant-minimal',
  'academic-standard',
  'creative-bold',
  'creative-minimalist',
  'creative-modern',
  'creative-orange',
  'coral-pink',
  'gradient-blue',
  'green-minimal',
  'healthcare-professional',
  'psychology-professional',
  'urban',
  'yellow-minimalist',
];

const COLORES = [
  { hex: '#1E40AF', nombre: 'Azul ISEIE' },
  { hex: '#0D9488', nombre: 'Verde azulado' },
  { hex: '#2563EB', nombre: 'Azul marca' },
  { hex: '#7C3AED', nombre: 'Violeta' },
  { hex: '#DC2626', nombre: 'Rojo' },
  { hex: '#0F172A', nombre: 'Grafito' },
];

const ManagerBatchReview: React.FC = () => {
  const { profiles, content, loading, error, reload } = useManagedProfilesData();
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [plantilla, setPlantilla] = useState('');
  const [color, setColor] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const [aplicando, setAplicando] = useState(false);

  if (loading) return <LoadingSpinner message="Cargando perfiles..." />;

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div role="alert" className="text-center py-16 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-red-400 dark:text-red-500 mb-3" aria-hidden="true" />
          <p className="font-semibold text-gray-900 dark:text-dark-text-primary mb-4">
            No se pudieron cargar los perfiles
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

  const alternar = (id: string) => {
    const s = new Set(seleccion);
    s.has(id) ? s.delete(id) : s.add(id);
    setSeleccion(s);
  };

  const todosSeleccionados = profiles.length > 0 && seleccion.size === profiles.length;
  const alternarTodos = () =>
    setSeleccion(todosSeleccionados ? new Set() : new Set(profiles.map((p) => p.id)));

  const hayCambios = Boolean(plantilla || color);
  const seleccionados = profiles.filter((p) => seleccion.has(p.id));

  const aplicar = async () => {
    setAplicando(true);
    const cambios: Record<string, string> = {};
    if (plantilla) cambios.template = plantilla;
    if (color) cambios.template_color = color;

    const resultados = await Promise.all(
      seleccionados.map(async (p) => {
        const { error: err } = await supabase.from('profiles').update(cambios).eq('id', p.id);
        return { nombre: p.full_name, ok: !err, mensaje: err?.message };
      }),
    );

    const fallos = resultados.filter((r) => !r.ok);
    setAplicando(false);
    setConfirmando(false);

    if (fallos.length === 0) {
      toast.success(`${resultados.length} perfiles actualizados`);
      setSeleccion(new Set());
      setPlantilla('');
      setColor('');
      reload();
    } else {
      // No se oculta el fallo parcial: decir "hecho" cuando 3 de 19 fallaron es
      // peor que no decir nada.
      toast.error(`${fallos.length} de ${resultados.length} fallaron: ${fallos[0].mensaje ?? 'error'}`);
      reload();
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-cv-blue to-cv-blue-dark shadow-sm">
          <Squares2X2Icon className="w-7 h-7 text-white" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary leading-tight">
            Revisión en lote
          </h1>
          <p className="text-sm text-gray-500 dark:text-dark-text-secondary">
            Cambia la presentación de varios perfiles a la vez.
          </p>
        </div>
      </div>

      {profiles.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-gray-300 dark:border-dark-border">
          <p className="text-gray-600 dark:text-dark-text-secondary">Aún no gestionas ningún perfil.</p>
        </div>
      ) : (
        <>
          {/* Acciones. Aparecen al seleccionar: sin nada seleccionado no hay nada
              que hacer con ellas. */}
          {seleccion.size > 0 && (
            <div className="sticky top-0 lg:top-4 z-20 mb-4 rounded-xl bg-white dark:bg-dark-bg-secondary border border-cv-blue/40 dark:border-cv-blue-light/30 shadow-lg p-5">
              <p className="font-semibold text-gray-900 dark:text-dark-text-primary mb-4">
                {seleccion.size} {seleccion.size === 1 ? 'perfil seleccionado' : 'perfiles seleccionados'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="lote-plantilla"
                    className="block text-xs font-medium text-gray-700 dark:text-dark-text-secondary mb-1.5"
                  >
                    Plantilla
                  </label>
                  <select
                    id="lote-plantilla"
                    value={plantilla}
                    onChange={(e) => setPlantilla(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-dark-border-light bg-white dark:bg-dark-bg-primary text-gray-900 dark:text-dark-text-primary focus:ring-2 focus:ring-cv-blue focus:border-transparent"
                  >
                    <option value="">Sin cambios</option>
                    {PLANTILLAS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="block text-xs font-medium text-gray-700 dark:text-dark-text-secondary mb-1.5">
                    Color de marca
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setColor('')}
                      aria-pressed={color === ''}
                      className={`px-2.5 py-1.5 rounded-lg text-xs border transition-colors focus:outline-none focus:ring-2 focus:ring-cv-blue ${
                        color === ''
                          ? 'border-cv-blue text-cv-blue font-medium'
                          : 'border-gray-200 dark:border-dark-border text-gray-500 dark:text-dark-text-secondary'
                      }`}
                    >
                      Sin cambios
                    </button>
                    {COLORES.map((c) => (
                      <button
                        key={c.hex}
                        onClick={() => setColor(c.hex)}
                        aria-pressed={color === c.hex}
                        aria-label={c.nombre}
                        title={`${c.nombre} · ${c.hex}`}
                        className={`w-8 h-8 rounded-lg border-2 transition-transform focus:outline-none focus:ring-2 focus:ring-cv-blue ${
                          color === c.hex
                            ? 'border-gray-900 dark:border-white scale-110'
                            : 'border-transparent hover:scale-105'
                        }`}
                        style={{ background: c.hex }}
                      >
                        {color === c.hex && <CheckIcon className="w-4 h-4 mx-auto text-white" aria-hidden="true" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setConfirmando(true)}
                  disabled={!hayCambios || aplicando}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cv-blue text-white font-medium hover:bg-cv-blue-dark disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-cv-blue focus:ring-offset-2 dark:focus:ring-offset-dark-bg-secondary transition-colors"
                >
                  <SwatchIcon className="w-5 h-5" aria-hidden="true" />
                  Aplicar a {seleccion.size}
                </button>
                <button
                  onClick={() => setSeleccion(new Set())}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-border-light text-gray-700 dark:text-dark-text-secondary font-medium hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary focus:outline-none focus:ring-2 focus:ring-cv-blue transition-colors"
                >
                  Quitar selección
                </button>
                {!hayCambios && (
                  <span className="text-xs text-gray-500 dark:text-dark-text-tertiary">
                    Elige plantilla o color para poder aplicar.
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Listado seleccionable */}
          <div className="rounded-xl bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 dark:border-dark-border">
              <label className="inline-flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={todosSeleccionados}
                  onChange={alternarTodos}
                  className="w-4 h-4 rounded border-gray-300 dark:border-dark-border-light text-cv-blue focus:ring-2 focus:ring-cv-blue"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary">
                  Seleccionar los {profiles.length}
                </span>
              </label>
            </div>

            <ul className="divide-y divide-gray-100 dark:divide-dark-border">
              {profiles.map((p) => {
                const marcado = seleccion.has(p.id);
                const falta = missingToPublish(p, content[p.id]).length;
                return (
                  <li key={p.id}>
                    <label
                      className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors ${
                        marcado ? 'bg-cv-blue/5 dark:bg-cv-blue-light/5' : 'hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={marcado}
                        onChange={() => alternar(p.id)}
                        aria-label={`Seleccionar ${p.full_name}`}
                        className="w-4 h-4 rounded border-gray-300 dark:border-dark-border-light text-cv-blue focus:ring-2 focus:ring-cv-blue shrink-0"
                      />
                      {p.avatar_url ? (
                        <img
                          src={p.avatar_url}
                          alt=""
                          loading="lazy"
                          className="w-9 h-9 rounded-full object-cover object-top shrink-0 bg-gray-100 dark:bg-dark-bg-tertiary"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full shrink-0 bg-gradient-to-br from-cv-blue to-cv-blue-dark flex items-center justify-center text-white text-xs font-semibold">
                          {(p.full_name || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-gray-900 dark:text-dark-text-primary truncate">
                          {p.full_name}
                        </span>
                        <span className="block text-xs text-gray-500 dark:text-dark-text-secondary truncate">
                          {p.headline || 'Sin titular'}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-gray-500 dark:text-dark-text-tertiary capitalize hidden sm:block">
                        {p.template || 'sin plantilla'}
                      </span>
                      {falta > 0 && (
                        <span className="shrink-0 text-[11px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400">
                          incompleto
                        </span>
                      )}
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}

      {/* Confirmacion: es una escritura sobre varios perfiles a la vez, no se
          ejecuta sin que el gestor lea exactamente que va a pasar. */}
      {confirmando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setConfirmando(false)} aria-hidden="true" />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-confirmar"
            className="relative w-full max-w-md rounded-xl bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border shadow-2xl p-6"
          >
            <h2 id="titulo-confirmar" className="text-lg font-bold text-gray-900 dark:text-dark-text-primary mb-2">
              Confirmar cambios
            </h2>
            <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-4">
              Se van a modificar <strong>{seleccion.size}</strong>{' '}
              {seleccion.size === 1 ? 'perfil' : 'perfiles'}:
            </p>
            <ul className="text-sm space-y-1.5 mb-4 rounded-lg bg-gray-50 dark:bg-dark-bg-primary p-3">
              {plantilla && (
                <li className="text-gray-800 dark:text-dark-text-primary">
                  Plantilla → <span className="font-semibold">{plantilla}</span>
                </li>
              )}
              {color && (
                <li className="flex items-center gap-2 text-gray-800 dark:text-dark-text-primary">
                  Color →
                  <span className="w-4 h-4 rounded" style={{ background: color }} aria-hidden="true" />
                  <span className="font-semibold">{color}</span>
                </li>
              )}
            </ul>
            <p className="text-xs text-gray-500 dark:text-dark-text-tertiary mb-5">
              Afecta a la ficha pública de cada uno. No hay deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={aplicar}
                disabled={aplicando}
                className="flex-1 px-4 py-2 rounded-lg bg-cv-blue text-white font-medium hover:bg-cv-blue-dark disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-cv-blue transition-colors"
              >
                {aplicando ? 'Aplicando...' : 'Sí, aplicar'}
              </button>
              <button
                onClick={() => setConfirmando(false)}
                disabled={aplicando}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-dark-border-light text-gray-700 dark:text-dark-text-secondary font-medium hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary focus:outline-none focus:ring-2 focus:ring-cv-blue transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerBatchReview;
