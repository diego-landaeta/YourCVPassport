import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { BellAlertIcon, CheckIcon, InformationCircleIcon, PlusIcon } from '@heroicons/react/24/outline';
import { BTN_DANGER_OUTLINE, BTN_GHOST, BTN_PRIMARY, BTN_SECONDARY, FIELD_CLS, PanelError, PanelSkeleton, SURFACE, TEXT_META, TEXT_STRONG, notifyError } from '../../jobs/PanelBits';
import { fmt } from '../../../lib/bolsaText';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { usePanelText } from '../../jobs/textosPanel';
import { useJobCountries } from '../../jobs/useJobCountries';
import { JOB_CATEGORIES } from '../../../lib/jobsCatalog';
import {
  MAX_JOB_ALERTS, createMyAlert, deleteMyAlertById, fetchMyAlerts, updateMyAlert, type JobAlertSubscription,
} from '../../../lib/jobsApi';

interface JobAlertsTabProps {
  profileId?: string;
}

type PanelTx = ReturnType<typeof usePanelText>;
type Countries = ReturnType<typeof useJobCountries>;

const MAX_ITEMS = 20;

const parseKeywords = (raw: string): string[] =>
  Array.from(new Set(raw.split(',').map((k) => k.trim()).filter(Boolean)));

/** El tope de 5 alertas lo hace cumplir un trigger: su error llega como texto del servidor. */
const isLimitError = (e: unknown): boolean =>
  /ALERTS?_LIMIT|MAX_ALERTS|ALERT_LIMIT|limit/i.test(String((e as { message?: string } | null)?.message ?? ''));

function summary(a: JobAlertSubscription, tx: PanelTx, lang: 'es' | 'en', countries: Countries): string {
  const cats = a.categories?.length ? (a.categories.length === 1 ? tx.alertsSumCat1 : fmt(tx.alertsSumCats, { n: a.categories.length })) : tx.alertsSumAnyCat;
  const c = a.country ? countries.find((x) => x.code === a.country) : null;
  const country = a.country ? (c ? (lang === 'en' ? c.name_en : c.name_es) : a.country) : tx.alertsAnyCountry;
  const kw = a.keywords?.length ? fmt(tx.alertsSumKw, { kw: a.keywords.slice(0, 3).join(', ') + (a.keywords.length > 3 ? '…' : '') }) : '';
  return [cats, country, a.frequency === 'DAILY' ? tx.freqDaily : tx.freqWeekly, kw].filter(Boolean).join(' · ');
}

/**
 * Alertas de ofertas (fase 4): hasta 5 por perfil en job_alert_subscriptions. Cada una con sus
 * categorías, país, palabras clave y frecuencia; se pueden crear, editar, pausar y eliminar por
 * separado. El país por defecto de una alerta nueva es el del perfil. Solo guarda las preferencias:
 * el envío lo hace `send-outbox` a partir de `queue_job_alerts()`.
 */
const JobAlertsTab: React.FC<JobAlertsTabProps> = ({ profileId }) => {
  const tx = usePanelText();
  const { lang } = useLanguage();
  const { user, profile } = useAuth();
  const countries = useJobCountries();
  const uid = user?.id || profileId || null;
  const profileCountry = (profile?.country_code || '').toUpperCase();

  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [alerts, setAlerts] = useState<JobAlertSubscription[]>([]);
  /** null = lista; 'new' = alta; id = edición de esa alerta. */
  const [editing, setEditing] = useState<string | null>(null);
  const [askDelete, setAskDelete] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!uid) return [];
    const list = await fetchMyAlerts(uid);
    setAlerts(list);
    return list;
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    let alive = true;
    setState('loading');
    reload()
      .then((list) => {
        if (!alive) return;
        // Sin alertas se abre directamente el alta.
        if (list.length === 0) setEditing('new');
        setState('ready');
      })
      .catch(() => { if (alive) setState('error'); });
    return () => { alive = false; };
  }, [uid, reload]);

  const remove = async (a: JobAlertSubscription) => {
    if (!a.id) return;
    try {
      await deleteMyAlertById(a.id);
      setAskDelete(null);
      const list = await reload();
      if (list.length === 0) setEditing('new');
      toast.success(tx.alertsDeleted);
    } catch {
      notifyError(tx.alertsSaveError, tx.closeNotice);
    }
  };

  if (!uid) return <p className={`py-10 text-center ${TEXT_META}`}>{tx.alertsNeedProfile}</p>;
  if (state === 'loading') return <PanelSkeleton rows={2} label={tx.alertsLoading} />;
  if (state === 'error') return <PanelError message={tx.alertsError} />;

  const atLimit = alerts.length >= MAX_JOB_ALERTS;
  const editingAlert = editing && editing !== 'new' ? alerts.find((a) => a.id === editing) ?? null : null;

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h2 className={`text-xl font-bold ${TEXT_STRONG}`}>{tx.alertsTitle}</h2>
        <p className={`mt-1 max-w-prose text-[15px] leading-relaxed ${TEXT_META}`}>{tx.alertsText}</p>
      </div>

      <p role="note" className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm text-slate-700 dark:border-dark-border dark:bg-white/5 dark:text-dark-text-secondary">
        <InformationCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-slate-500 dark:text-dark-text-secondary" aria-hidden="true" />
        {tx.alertsNotice}
      </p>

      {alerts.length > 0 && (
        <section aria-labelledby="al-list-h" data-testid="alerts-list">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 id="al-list-h" className={`text-base font-semibold tabular-nums ${TEXT_STRONG}`}>
              {fmt(tx.alertsCount, { n: alerts.length, max: MAX_JOB_ALERTS })}
            </h3>
            <button
              type="button"
              onClick={() => { setAskDelete(null); setEditing('new'); }}
              disabled={atLimit || editing === 'new'}
              className={BTN_SECONDARY}
              data-testid="alert-new"
            >
              <PlusIcon className="h-5 w-5" aria-hidden="true" />{tx.alertsNew}
            </button>
          </div>
          {atLimit && <p className={`mt-2 text-sm ${TEXT_META}`} data-testid="alerts-limit">{fmt(tx.alertsLimit, { max: MAX_JOB_ALERTS })}</p>}

          <ul className="mt-4 space-y-3">
            {alerts.map((a, i) => (
              <li key={a.id} className={`${SURFACE} p-4`} data-testid="alert-item">
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
                  <div className="min-w-0">
                    <p className={`flex flex-wrap items-center gap-x-2 text-[15px] font-semibold ${TEXT_STRONG}`}>
                      <BellAlertIcon className="h-5 w-5 shrink-0 text-cv-blue dark:text-cv-blue-light" aria-hidden="true" />
                      {fmt(tx.alertsItem, { n: i + 1 })}
                      <span className={`text-xs font-semibold ${a.active ? 'text-green-700 dark:text-green-400' : TEXT_META}`}>
                        {a.active ? tx.alertsOn : tx.alertsOff}
                      </span>
                    </p>
                    <p className={`mt-1 text-sm ${TEXT_META}`}>{summary(a, tx, lang, countries)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {askDelete === a.id ? (
                      <>
                        <span className={`text-sm ${TEXT_STRONG}`} role="alert">{tx.alertsAskDelete}</span>
                        <button type="button" onClick={() => void remove(a)} className={BTN_DANGER_OUTLINE} data-testid="alert-delete-confirm">{tx.alertsConfirmDelete}</button>
                        <button type="button" onClick={() => setAskDelete(null)} className={BTN_GHOST}>{tx.alertsCancel}</button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={() => { setAskDelete(null); setEditing(a.id ?? null); }} className={BTN_SECONDARY} aria-label={`${tx.alertsEdit}: ${fmt(tx.alertsItem, { n: i + 1 })}`}>{tx.alertsEdit}</button>
                        <button type="button" onClick={() => setAskDelete(a.id ?? null)} className={BTN_GHOST} aria-label={`${tx.alertsDelete}: ${fmt(tx.alertsItem, { n: i + 1 })}`} data-testid="alert-delete">{tx.alertsDelete}</button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {alerts.length === 0 && editing !== 'new' && (
        <div className={`${SURFACE} p-6 text-center`}>
          <p className={`font-semibold ${TEXT_STRONG}`}>{tx.alertsEmptyTitle}</p>
          <p className={`mx-auto mt-1 max-w-prose text-sm ${TEXT_META}`}>{tx.alertsEmptyText}</p>
        </div>
      )}

      {editing && (editing === 'new' || editingAlert) && (
        <AlertForm
          key={editing}
          tx={tx}
          lang={lang}
          countries={countries}
          uid={uid}
          initial={editingAlert}
          defaultCountry={profileCountry}
          canCancel={alerts.length > 0}
          onCancel={() => setEditing(null)}
          onSaved={async () => {
            await reload();
            setEditing(null);
          }}
        />
      )}
    </div>
  );
};

interface AlertFormProps {
  tx: PanelTx;
  lang: 'es' | 'en';
  countries: Countries;
  uid: string;
  initial: JobAlertSubscription | null;
  defaultCountry: string;
  canCancel: boolean;
  onCancel: () => void;
  onSaved: () => Promise<void>;
}

const AlertForm: React.FC<AlertFormProps> = ({ tx, lang, countries, uid, initial, defaultCountry, canCancel, onCancel, onSaved }) => {
  const [active, setActive] = useState(initial ? initial.active : true);
  const [categories, setCategories] = useState<string[]>(initial?.categories || []);
  const [country, setCountry] = useState(initial ? initial.country || '' : defaultCountry);
  const [keywordsRaw, setKeywordsRaw] = useState((initial?.keywords || []).join(', '));
  const [frequency, setFrequency] = useState<'DAILY' | 'WEEKLY'>(initial?.frequency || 'WEEKLY');
  const [saving, setSaving] = useState(false);

  // El país del perfil puede llegar cuando el alta ya está abierta (carga del perfil): se aplica una vez.
  useEffect(() => {
    if (!initial && defaultCountry) setCountry((c) => c || defaultCountry);
  }, [initial, defaultCountry]);

  const toggleCategory = (key: string) =>
    setCategories((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const keywords = parseKeywords(keywordsRaw);
  const tooMany = categories.length > MAX_ITEMS || keywords.length > MAX_ITEMS;

  const save = async () => {
    if (tooMany) return;
    setSaving(true);
    try {
      const sub: JobAlertSubscription = { profile_id: uid, categories, country: country || null, keywords, frequency, active };
      if (initial?.id) await updateMyAlert(initial.id, sub);
      else await createMyAlert(sub);
      toast.success(tx.alertsSaved);
      await onSaved();
    } catch (e) {
      notifyError(isLimitError(e) ? fmt(tx.alertsLimitError, { max: MAX_JOB_ALERTS }) : tx.alertsSaveError, tx.closeNotice);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); void save(); }}
      className="space-y-8 border-t border-slate-200 pt-8 dark:border-dark-border"
      aria-label={initial ? tx.alertsEditTitle : tx.alertsNewTitle}
      data-testid="alert-form"
    >
      <h3 className={`text-lg font-bold ${TEXT_STRONG}`}>{initial ? tx.alertsEditTitle : tx.alertsNewTitle}</h3>

      <label className="flex cursor-pointer items-center justify-between gap-4 border-y border-slate-200 py-4 dark:border-dark-border">
        <span className="min-w-0">
          <span className={`block font-semibold ${TEXT_STRONG}`}>{tx.alertsActive}</span>
          <span className={`mt-0.5 block text-sm ${TEXT_META}`}>{active ? tx.alertsOn : tx.alertsOff}</span>
        </span>
        <input type="checkbox" role="switch" checked={active} onChange={(e) => setActive(e.target.checked)} className="peer sr-only" />
        <span
          aria-hidden="true"
          className="relative h-6 w-11 shrink-0 rounded-full bg-slate-300 transition-colors duration-150 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform after:duration-150 peer-checked:bg-cv-blue peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-cv-blue peer-focus-visible:ring-offset-2 dark:bg-slate-600 dark:peer-focus-visible:ring-offset-dark-bg-primary"
        />
      </label>

      <fieldset disabled={!active} className="min-w-0 space-y-8 transition-opacity duration-150 disabled:opacity-60">
        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4">
            <p id="al-cats" className={`text-base font-semibold ${TEXT_STRONG}`}>{tx.alertsCategories}</p>
            {categories.length > 0 && <p className={`text-sm tabular-nums ${TEXT_META}`}>{fmt(tx.alertsSelected, { n: categories.length })}</p>}
          </div>
          <p className={`mt-0.5 text-sm ${TEXT_META}`}>{tx.alertsCategoriesHint}</p>
          <div role="group" aria-labelledby="al-cats" className="mt-3 flex flex-wrap gap-2">
            {JOB_CATEGORIES.map((c) => {
              const on = categories.includes(c.key);
              return (
                <label key={c.key} className={`inline-flex cursor-pointer select-none items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors duration-150 focus-within:ring-2 focus-within:ring-cv-blue focus-within:ring-offset-2 dark:focus-within:ring-offset-dark-bg-primary ${on
                  ? 'border-cv-blue bg-cv-blue/10 font-medium text-cv-blue dark:bg-cv-blue/20 dark:text-cv-blue-light'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-dark-border dark:bg-transparent dark:text-dark-text-secondary dark:hover:bg-white/5'}`}>
                  <input type="checkbox" className="sr-only" checked={on} onChange={() => toggleCategory(c.key)} />
                  {on && <CheckIcon className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />}
                  {c.label[lang]}
                </label>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="al-country" className={`mb-1.5 block text-sm font-semibold ${TEXT_STRONG}`}>{tx.alertsCountry}</label>
            <select id="al-country" value={country} onChange={(e) => setCountry(e.target.value)} className={FIELD_CLS}>
              <option value="">{tx.alertsAnyCountry}</option>
              {countries.map((c) => <option key={c.code} value={c.code}>{lang === 'en' ? c.name_en : c.name_es}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="al-keywords" className={`mb-1.5 block text-sm font-semibold ${TEXT_STRONG}`}>{tx.alertsKeywords}</label>
            <input id="al-keywords" type="text" value={keywordsRaw} onChange={(e) => setKeywordsRaw(e.target.value)} placeholder={tx.alertsKeywordsPlaceholder} aria-describedby="al-keywords-hint" className={FIELD_CLS} />
            <p id="al-keywords-hint" className={`mt-1.5 text-sm ${TEXT_META}`}>{tx.alertsKeywordsHint}</p>
          </div>
        </div>

        <div role="radiogroup" aria-labelledby="al-freq-l">
          <p id="al-freq-l" className={`text-base font-semibold ${TEXT_STRONG}`}>{tx.alertsGroupWhen}</p>
          <div className="mt-3 grid max-w-md grid-cols-2 gap-3">
            {(['DAILY', 'WEEKLY'] as const).map((f) => (
              <label key={f} className={`flex cursor-pointer items-center justify-center rounded-xl border px-4 py-3 text-sm font-semibold transition-colors duration-150 focus-within:ring-2 focus-within:ring-cv-blue focus-within:ring-offset-2 dark:focus-within:ring-offset-dark-bg-primary ${frequency === f
                ? 'border-cv-blue bg-cv-blue/10 text-cv-blue dark:bg-cv-blue/20 dark:text-cv-blue-light'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-dark-border dark:bg-transparent dark:text-dark-text-secondary dark:hover:bg-white/5'}`}>
                <input type="radio" name="al-freq" value={f} checked={frequency === f} onChange={() => setFrequency(f)} className="sr-only" />
                {f === 'DAILY' ? tx.freqDaily : tx.freqWeekly}
              </label>
            ))}
          </div>
        </div>
      </fieldset>

      {tooMany && <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-400">{tx.alertsTooMany}</p>}

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-6 dark:border-dark-border">
        <button type="submit" disabled={saving || tooMany} className={BTN_PRIMARY} data-testid="alert-save">
          {saving ? tx.alertsSaving : tx.alertsSave}
        </button>
        {canCancel && (
          <button type="button" onClick={onCancel} className={BTN_GHOST}>{tx.alertsCancel}</button>
        )}
      </div>
    </form>
  );
};

export default JobAlertsTab;
