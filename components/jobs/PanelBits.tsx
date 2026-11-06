import React, { useEffect, useId, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { ExclamationCircleIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import CompanyMark from './ui/CompanyMark';

/**
 * Piezas comunes de los paneles de candidaturas (candidato y empresa): pestanas con contador,
 * estados vacio / cargando / error, indicador de estado (punto + texto), medidor de afinidad,
 * linea de tiempo, avatar de persona y botones. Un solo sitio para que las dos pantallas se vean
 * como el mismo producto.
 */

// ---------------------------------------------------------------------------
// Estilos compartidos
// ---------------------------------------------------------------------------

export const FOCUS =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-dark-bg-primary';
const BTN_BASE = `inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS}`;
export const BTN_PRIMARY = `${BTN_BASE} bg-cv-blue text-white hover:bg-cv-blue-dark`;
export const BTN_SECONDARY = `${BTN_BASE} border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 dark:border-dark-border dark:bg-transparent dark:text-dark-text-primary dark:hover:bg-white/5`;
export const BTN_GHOST = `${BTN_BASE} text-slate-700 hover:bg-slate-100 dark:text-dark-text-secondary dark:hover:bg-white/5`;
export const BTN_DANGER = `${BTN_BASE} bg-red-600 text-white hover:bg-red-700`;
export const BTN_DANGER_OUTLINE = `${BTN_BASE} border border-red-300 bg-white text-red-700 hover:bg-red-50 dark:border-red-500/40 dark:bg-transparent dark:text-red-300 dark:hover:bg-red-500/10`;

export const SURFACE = 'rounded-2xl border border-slate-200 bg-white dark:border-dark-border dark:bg-dark-bg-secondary';
export const LIFT =
  'transition-shadow duration-150 hover:shadow-[0_1px_2px_rgba(15,23,42,.06),0_12px_32px_-16px_rgba(15,23,42,.18)] dark:hover:shadow-[0_12px_32px_-16px_rgba(0,0,0,.65)]';

export const TEXT_STRONG = 'text-slate-900 dark:text-dark-text-primary';
export const TEXT_META = 'text-slate-600 dark:text-dark-text-secondary';
export const H1_CLS = 'text-3xl font-extrabold tracking-tight text-balance text-slate-900 dark:text-white sm:text-4xl';
export const FIELD_CLS =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-500 focus:border-cv-blue focus:outline-none focus:ring-2 focus:ring-cv-blue dark:border-dark-border dark:bg-dark-bg-primary dark:text-dark-text-primary dark:placeholder:text-dark-text-secondary';

/** Minusculas y sin tildes: para buscar en listas largas (a partir de ~10 filas). */
export const norm = (s: string | null | undefined): string =>
  (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export const SEARCH_FROM = 10;

// ---------------------------------------------------------------------------
// Entrada orquestada: las primeras filas aparecen con fundido + 6 px, escalonadas 30 ms
// ---------------------------------------------------------------------------

/** El contenido es visible por defecto; la animacion solo "viene de" opacidad 0 y se omite con movimiento reducido. */
export function useReveal<T extends HTMLElement>(ready: boolean) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!ready || !el || typeof el.animate !== 'function') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    Array.from(el.children)
      .slice(0, 8)
      .forEach((child, i) => {
        (child as HTMLElement).animate(
          [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }],
          { duration: 420, delay: i * 30, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'backwards' }
        );
      });
    // Solo cuando la lista pasa a estar lista: no se repite al filtrar o escribir
  }, [ready]);
  return ref;
}

// ---------------------------------------------------------------------------
// Avisos de error: los cierra la persona, sin temporizador
// ---------------------------------------------------------------------------

export function notifyError(message: string, closeLabel: string) {
  toast.custom(
    (t) => (
      <div
        role="alert"
        className="pointer-events-auto flex max-w-sm items-start gap-3 rounded-xl border border-red-200 bg-white p-3 pr-2 text-sm text-slate-900 shadow-lg dark:border-red-900/60 dark:bg-dark-bg-secondary dark:text-dark-text-primary"
      >
        <ExclamationCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
        <p className="min-w-0 flex-1">{message}</p>
        <button
          type="button"
          onClick={() => toast.dismiss(t.id)}
          aria-label={closeLabel}
          className={`rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-dark-text-secondary dark:hover:bg-white/10 ${FOCUS}`}
        >
          <XMarkIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    ),
    { duration: Infinity }
  );
}

// ---------------------------------------------------------------------------
// Pestanas con contador (WAI-ARIA: tablist, flechas, Inicio/Fin)
// ---------------------------------------------------------------------------

export interface PanelTab {
  id: string;
  label: string;
  count?: number | null;
}

interface PanelTabsProps {
  tabs: PanelTab[];
  active: string;
  onChange: (id: string) => void;
  label: string;
  idPrefix?: string;
  panelId?: string;
  trailing?: React.ReactNode;
}

export const PanelTabs: React.FC<PanelTabsProps> = ({ tabs, active, onChange, label, idPrefix = 'ptab', panelId = 'ppanel', trailing }) => {
  const onKey = (e: React.KeyboardEvent) => {
    const i = tabs.findIndex((t) => t.id === active);
    let next = -1;
    if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (i + tabs.length - 1) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    if (next < 0) return;
    e.preventDefault();
    onChange(tabs[next].id);
    document.getElementById(`${idPrefix}-${tabs[next].id}`)?.focus();
  };
  return (
    <div className="flex items-end gap-4 border-b border-slate-200 dark:border-dark-border">
      <div role="tablist" aria-label={label} onKeyDown={onKey} className="scrollbar-thin -mb-px flex min-w-0 flex-1 gap-1 overflow-x-auto">
        {tabs.map((t) => {
          const on = t.id === active;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`${idPrefix}-${t.id}`}
              aria-selected={on}
              aria-controls={panelId}
              tabIndex={on ? 0 : -1}
              onClick={() => onChange(t.id)}
              className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-t-lg border-b-2 px-3.5 py-3 text-sm font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cv-blue ${
                on
                  ? 'border-cv-blue text-cv-blue dark:border-cv-blue-light dark:text-cv-blue-light'
                  : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:text-dark-text-secondary dark:hover:border-dark-border-light dark:hover:text-dark-text-primary'
              }`}
            >
              {t.label}
              {t.count != null && (
                <span
                  className={`min-w-[1.5rem] rounded-full px-1.5 py-0.5 text-center text-xs font-semibold tabular-nums ${
                    on ? 'bg-cv-blue/10 text-cv-blue dark:bg-cv-blue/20 dark:text-cv-blue-light' : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-dark-text-secondary'
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {trailing && <div className="hidden pb-2 sm:block">{trailing}</div>}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Estado: punto de color + texto (nunca solo color)
// ---------------------------------------------------------------------------

export type Tone = 'neutral' | 'info' | 'active' | 'success' | 'danger' | 'warn';

const DOT: Record<Tone, string> = {
  neutral: 'bg-slate-400 dark:bg-slate-500',
  info: 'bg-blue-400',
  active: 'bg-cv-blue dark:bg-cv-blue-light',
  success: 'bg-green-500',
  danger: 'bg-red-500',
  warn: 'bg-amber-500',
};

export const StatusDot: React.FC<{ tone: Tone; children: React.ReactNode; className?: string }> = ({ tone, children, className = '' }) => (
  <span className={`inline-flex items-center gap-2 text-sm font-medium ${TEXT_STRONG} ${className}`}>
    <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[tone]}`} aria-hidden="true" />
    {children}
  </span>
);

// ---------------------------------------------------------------------------
// Afinidad: medidor discreto
// ---------------------------------------------------------------------------

export const MatchMeter: React.FC<{ score: number; label: string; word: string; className?: string }> = ({ score, label, word, className = '' }) => {
  const s = Math.max(0, Math.min(100, Math.round(score || 0)));
  return (
    <div role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={s} aria-label={label} className={`w-[4.5rem] shrink-0 text-right ${className}`}>
      <p className={`text-2xl font-bold leading-none tabular-nums ${TEXT_STRONG}`}>
        {s}
        <span className="text-sm font-semibold text-slate-500 dark:text-dark-text-secondary">%</span>
      </p>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10" aria-hidden="true">
        <div className="h-full rounded-full bg-cv-blue dark:bg-cv-blue-light" style={{ width: `${s}%` }} />
      </div>
      <p className={`mt-1 text-[13px] leading-none ${TEXT_META}`}>{word}</p>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Linea de tiempo vertical fina
// ---------------------------------------------------------------------------

export interface TimelineItem {
  key: string;
  label: string;
  sub?: string;
  at: string;
}

export const Timeline: React.FC<{ items: TimelineItem[]; label: string }> = ({ items, label }) => (
  <ol aria-label={label} className="space-y-4">
    {items.map((it, i) => {
      const last = i === items.length - 1;
      return (
        <li key={it.key} className="relative pl-6">
          {!last && <span aria-hidden="true" className="absolute -bottom-4 left-[4px] top-3 w-px bg-slate-200 dark:bg-white/15" />}
          <span
            aria-hidden="true"
            className={`absolute left-0 top-[7px] h-[9px] w-[9px] rounded-full ${last ? 'bg-cv-blue ring-4 ring-blue-100 dark:bg-cv-blue-light dark:ring-cv-blue/20' : 'bg-slate-300 dark:bg-slate-600'}`}
          />
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
            <p className={`text-sm font-medium ${TEXT_STRONG}`}>
              {it.label}
              {it.sub && <span className={`font-normal ${TEXT_META}`}> · {it.sub}</span>}
            </p>
            <p className={`text-[13px] tabular-nums ${TEXT_META}`}>{it.at}</p>
          </div>
        </li>
      );
    })}
  </ol>
);

// ---------------------------------------------------------------------------
// Avatar de persona (foto o monograma con iniciales)
// ---------------------------------------------------------------------------

const AVATAR = {
  sm: { img: 'h-9 w-9', mark: '!h-9 !w-9 !text-[13px]' },
  md: { img: 'h-11 w-11', mark: '!h-11 !w-11 !text-sm' },
  lg: { img: 'h-14 w-14', mark: '!h-14 !w-14 !text-lg' },
} as const;

export const PersonAvatar: React.FC<{ name: string; url?: string | null; size?: keyof typeof AVATAR }> = ({ name, url, size = 'sm' }) => {
  const [broken, setBroken] = useState(false);
  if (url && !broken) {
    return (
      <img
        src={url}
        alt=""
        loading="lazy"
        onError={() => setBroken(true)}
        className={`${AVATAR[size].img} shrink-0 rounded-full object-cover object-top ring-1 ring-black/5 dark:ring-white/10`}
      />
    );
  }
  return <CompanyMark name={name} size="sm" className={`!rounded-full ${AVATAR[size].mark}`} />;
};

// ---------------------------------------------------------------------------
// Estados: vacio, cargando, error, busqueda
// ---------------------------------------------------------------------------

interface EmptyProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text?: string;
  action?: { label: string; onClick: () => void };
  secondary?: { label: string; onClick: () => void };
}

export const PanelEmpty: React.FC<EmptyProps> = ({ icon: Icon, title, text, action, secondary }) => (
  <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-14 text-center dark:border-dark-border-light">
    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-cv-blue dark:bg-cv-blue/15 dark:text-cv-blue-light">
      <Icon className="h-6 w-6" aria-hidden="true" />
    </span>
    <h2 className={`mt-4 text-lg font-semibold ${TEXT_STRONG}`}>{title}</h2>
    {text && <p className={`mx-auto mt-1.5 max-w-md text-[15px] leading-relaxed ${TEXT_META}`}>{text}</p>}
    {(action || secondary) && (
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {action && <button type="button" onClick={action.onClick} className={BTN_PRIMARY}>{action.label}</button>}
        {secondary && <button type="button" onClick={secondary.onClick} className={BTN_SECONDARY}>{secondary.label}</button>}
      </div>
    )}
  </div>
);

export const PanelSkeleton: React.FC<{ rows?: number; label: string }> = ({ rows = 3, label }) => (
  <div role="status" aria-live="polite">
    <span className="sr-only">{label}</span>
    <ul aria-hidden="true" className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className={`${SURFACE} flex gap-4 p-5 motion-safe:animate-pulse`}>
          <span className="h-12 w-12 shrink-0 rounded-xl bg-slate-200 dark:bg-white/10" />
          <span className="flex-1 space-y-2.5 pt-1">
            <span className="block h-4 w-2/5 rounded bg-slate-200 dark:bg-white/10" />
            <span className="block h-3.5 w-3/5 rounded bg-slate-100 dark:bg-white/5" />
            <span className="block h-3.5 w-1/4 rounded bg-slate-100 dark:bg-white/5" />
          </span>
        </li>
      ))}
    </ul>
  </div>
);

export const PanelError: React.FC<{ message: string; retryLabel?: string; onRetry?: () => void }> = ({ message, retryLabel, onRetry }) => (
  <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/70 p-5 dark:border-red-900/50 dark:bg-red-500/10">
    <ExclamationCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
    <div className="min-w-0 flex-1">
      <p className="text-[15px] font-medium text-red-900 dark:text-red-200">{message}</p>
      {onRetry && retryLabel && (
        <button type="button" onClick={onRetry} className={`${BTN_PRIMARY} mt-3`}>{retryLabel}</button>
      )}
    </div>
  </div>
);

export const SearchBox: React.FC<{ value: string; onChange: (v: string) => void; label: string; placeholder: string; clearLabel: string; className?: string }> = ({
  value, onChange, label, placeholder, clearLabel, className = '',
}) => {
  const id = useId();
  return (
    <div className={`relative ${className}`}>
      <label htmlFor={id} className="sr-only">{label}</label>
      <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 dark:text-dark-text-secondary" aria-hidden="true" />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${FIELD_CLS} pl-10 pr-10 [&::-webkit-search-cancel-button]:hidden`}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label={clearLabel}
          className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-dark-text-secondary dark:hover:bg-white/10 ${FOCUS}`}
        >
          <XMarkIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};
