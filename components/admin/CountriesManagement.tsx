import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../../contexts/LanguageContext';
import { fmt } from '../../lib/bolsaText';
import {
  addCountry,
  fetchAdminCountries,
  setCountryActive,
  validateCountry,
  type AdminCountry,
  type CountryDraft,
  type CountryField,
} from '../../lib/legalAdminApi';
import { a11y, btnPrimaryCls, btnSecondaryCls, Field, inputCls } from '../company/jobwizard/fields';
import { useLegalAdminText } from './legalAdminText';

/**
 * Admin: países de la bolsa (tabla `countries`).
 * Listar, activar/desactivar y añadir con código ISO, nombre es/en y moneda.
 * La autoridad es la RLS de admin: si el usuario no lo es, el servidor rechaza la escritura.
 */

const EMPTY: CountryDraft = { code: '', name_es: '', name_en: '', currency: '' };

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

const CountriesManagement: React.FC = () => {
  const { lang } = useLanguage();
  const t = useLegalAdminText();

  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [rows, setRows] = useState<AdminCountry[]>([]);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [draft, setDraft] = useState<CountryDraft>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setState((s) => (s === 'ready' ? s : 'loading'));
    try {
      setRows(await fetchAdminCountries());
      setState('ready');
    } catch (err) {
      console.error('[AdminCountries] load', err);
      setState('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const name = (c: AdminCountry) => (lang === 'en' ? c.name_en : c.name_es);

  const visible = useMemo(() => {
    const q = norm(query);
    if (!q) return rows;
    return rows.filter((c) => norm(`${c.code} ${c.name_es} ${c.name_en} ${c.currency}`).includes(q));
  }, [rows, query]);

  const activeCount = rows.filter((c) => c.active).length;

  const toggle = async (c: AdminCountry) => {
    const next = !c.active;
    setBusy(c.code);
    try {
      await setCountryActive(c.code, next);
      setRows((prev) => prev.map((r) => (r.code === c.code ? { ...r, active: next } : r)));
      toast.success(fmt(next ? t.cToggledOn : t.cToggledOff, { name: name(c) }));
    } catch (err) {
      console.error('[AdminCountries] toggle', err);
      toast.error(t.cToggleError);
    } finally {
      setBusy(null);
    }
  };

  const existing = useMemo(() => new Set(rows.map((r) => r.code.toUpperCase())), [rows]);
  const errors = validateCountry(draft, existing);
  const errText = (field: CountryField): string | null => {
    const e = errors[field];
    if (!touched || !e) return null;
    return e === 'required' ? t.required : e === 'code' ? t.cErrCode : e === 'duplicate' ? t.cErrDuplicate : e === 'currency' ? t.cErrCurrency : t.cErrLong;
  };

  const set = (field: CountryField, value: string) => setDraft((d) => ({ ...d, [field]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adding) return;
    setTouched(true);
    if (Object.keys(errors).length > 0) return;
    setAdding(true);
    try {
      const created = await addCountry(draft);
      setRows((prev) => [...prev, created].sort((a, b) => a.name_es.localeCompare(b.name_es, 'es')));
      toast.success(fmt(t.cAdded, { name: lang === 'en' ? created.name_en : created.name_es }));
      setDraft(EMPTY);
      setTouched(false);
    } catch (err) {
      console.error('[AdminCountries] add', err);
      const code = (err as { code?: string } | null)?.code;
      toast.error(code === '42501' ? t.cErrForbidden : code === '23505' ? t.cErrDuplicate : t.cAddError);
    } finally {
      setAdding(false);
    }
  };

  if (state === 'loading') {
    return (
      <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-cv-blue" aria-hidden="true" />
        <span className="ml-3 text-slate-600 dark:text-dark-text-secondary">{t.loading}</span>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div role="alert" className="rounded-2xl border border-slate-200 p-8 text-center dark:border-dark-border">
        <p className="mb-4 text-slate-800 dark:text-dark-text-primary">{t.loadError}</p>
        <button type="button" onClick={() => void load()} className={btnPrimaryCls}>{t.retry}</button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header>
        <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-dark-text-primary">{t.cTitle}</h2>
        <p className="mt-1 max-w-[68ch] text-sm leading-relaxed text-slate-600 dark:text-dark-text-secondary">{t.cIntro}</p>
      </header>

      <section aria-labelledby="countries-list-title">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div>
            <h3 id="countries-list-title" className="text-base font-semibold text-slate-900 dark:text-white">{t.cTitle}</h3>
            <p className="mt-0.5 text-sm tabular-nums text-slate-600 dark:text-dark-text-secondary" data-testid="countries-count">
              {fmt(t.cCount, { active: activeCount, total: rows.length })}
            </p>
          </div>
          <div className="w-full sm:w-72">
            <label htmlFor="countries-search" className="sr-only">{t.cSearch}</label>
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" aria-hidden="true" />
              <input
                id="countries-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.cSearchPh}
                className={`${inputCls} pl-10`}
              />
            </div>
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="mt-6 text-slate-600 dark:text-dark-text-secondary">{t.cEmpty}</p>
        ) : visible.length === 0 ? (
          <p role="status" className="mt-6 text-slate-600 dark:text-dark-text-secondary">{t.cNoResults}</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-200 border-y border-slate-200 dark:divide-dark-border dark:border-dark-border" data-testid="countries-list">
            {visible.map((c) => {
              const label = name(c);
              return (
                <li key={c.code} data-code={c.code} className="flex items-center gap-4 py-3">
                  <span className="w-10 shrink-0 rounded-md bg-slate-100 px-1.5 py-1 text-center text-xs font-semibold tabular-nums text-slate-700 dark:bg-dark-bg-tertiary dark:text-slate-200">
                    {c.code}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900 dark:text-white">{label}</p>
                    <p className="truncate text-[13px] text-slate-600 dark:text-dark-text-secondary">
                      {lang === 'en' ? c.name_es : c.name_en} · <span className="tabular-nums">{c.currency}</span>
                    </p>
                  </div>
                  <span className={`hidden items-center gap-1.5 text-sm font-medium sm:inline-flex ${c.active ? 'text-emerald-800 dark:text-emerald-300' : 'text-slate-600 dark:text-dark-text-secondary'}`}>
                    <span aria-hidden="true" className={`h-2 w-2 rounded-full ${c.active ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-500'}`} />
                    {c.active ? t.cActive : t.cInactive}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={c.active}
                    aria-label={fmt(c.active ? t.cToggleOff : t.cToggleOn, { name: label })}
                    disabled={busy === c.code}
                    onClick={() => void toggle(c)}
                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-dark-bg-secondary ${
                      c.active ? 'border-cv-blue bg-cv-blue' : 'border-slate-300 bg-slate-200 dark:border-dark-border dark:bg-dark-bg-tertiary'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform motion-reduce:transition-none ${c.active ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="countries-add-title" className="border-t border-slate-200 pt-8 dark:border-dark-border">
        <h3 id="countries-add-title" className="text-base font-semibold text-slate-900 dark:text-white">{t.cAddTitle}</h3>
        <p className="mt-1 max-w-[68ch] text-sm text-slate-600 dark:text-dark-text-secondary">{t.cAddHelp}</p>
        <form onSubmit={submit} noValidate className="mt-5 grid max-w-3xl grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
          <Field id="country-code" label={t.cCode} required help={t.cCodeHelp} error={errText('code')}>
            <input
              {...a11y('country-code', { help: true, error: errText('code') })}
              value={draft.code}
              onChange={(e) => set('code', e.target.value.toUpperCase().slice(0, 2))}
              maxLength={2}
              autoComplete="off"
              className={`${inputCls} uppercase tabular-nums`}
            />
          </Field>
          <Field id="country-currency" label={t.cCurrency} required help={t.cCurrencyHelp} error={errText('currency')}>
            <input
              {...a11y('country-currency', { help: true, error: errText('currency') })}
              value={draft.currency}
              onChange={(e) => set('currency', e.target.value.toUpperCase().slice(0, 3))}
              maxLength={3}
              autoComplete="off"
              className={`${inputCls} uppercase tabular-nums`}
            />
          </Field>
          <Field id="country-name-es" label={t.cNameEs} required error={errText('name_es')}>
            <input
              {...a11y('country-name-es', { error: errText('name_es') })}
              value={draft.name_es}
              onChange={(e) => set('name_es', e.target.value)}
              maxLength={80}
              autoComplete="off"
              className={inputCls}
            />
          </Field>
          <Field id="country-name-en" label={t.cNameEn} required error={errText('name_en')}>
            <input
              {...a11y('country-name-en', { error: errText('name_en') })}
              value={draft.name_en}
              onChange={(e) => set('name_en', e.target.value)}
              maxLength={80}
              autoComplete="off"
              className={inputCls}
            />
          </Field>
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            <button type="submit" disabled={adding} className={btnPrimaryCls}>
              <PlusIcon className="h-5 w-5" aria-hidden="true" />
              {adding ? t.saving : t.cAdd}
            </button>
            {(draft.code || draft.name_es || draft.name_en || draft.currency) && (
              <button type="button" onClick={() => { setDraft(EMPTY); setTouched(false); }} className={btnSecondaryCls}>{t.lCancel}</button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
};

export default CountriesManagement;
