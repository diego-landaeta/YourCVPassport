import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { BTN_GHOST, BTN_PRIMARY, FIELD_CLS, PanelError, PanelSkeleton, TEXT_META, TEXT_STRONG, notifyError } from '../../jobs/PanelBits';
import { fmt } from '../../../lib/bolsaText';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { usePanelText } from '../../jobs/textosPanel';
import { useJobCountries } from '../../jobs/useJobCountries';
import { JOB_CATEGORIES } from '../../../lib/jobsCatalog';
import { deleteMyAlert, fetchMyAlert, saveMyAlert, type JobAlertSubscription } from '../../../lib/jobsApi';

interface JobAlertsTabProps {
  profileId?: string;
}

const MAX_ITEMS = 20;

const parseKeywords = (raw: string): string[] =>
  Array.from(new Set(raw.split(',').map((k) => k.trim()).filter(Boolean)));

/**
 * Alertas de ofertas (fase 4): una suscripcion por perfil en job_alert_subscriptions.
 * Solo guarda las preferencias; el envio por correo aun no esta activo (queue_job_alerts()
 * encola en email_outbox y un worker lo enviara mas adelante).
 */
const JobAlertsTab: React.FC<JobAlertsTabProps> = ({ profileId }) => {
  const tx = usePanelText();
  const { lang } = useLanguage();
  const { user } = useAuth();
  const countries = useJobCountries();
  const uid = user?.id || profileId || null;

  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [exists, setExists] = useState(false);
  const [active, setActive] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [country, setCountry] = useState('');
  const [keywordsRaw, setKeywordsRaw] = useState('');
  const [frequency, setFrequency] = useState<'DAILY' | 'WEEKLY'>('WEEKLY');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!uid) return;
    let alive = true;
    setState('loading');
    fetchMyAlert(uid)
      .then((a) => {
        if (!alive) return;
        if (a) {
          setExists(true);
          setActive(a.active);
          setCategories(a.categories || []);
          setCountry(a.country || '');
          setKeywordsRaw((a.keywords || []).join(', '));
          setFrequency(a.frequency);
        }
        setState('ready');
      })
      .catch(() => { if (alive) setState('error'); });
    return () => { alive = false; };
  }, [uid]);

  const toggleCategory = (key: string) =>
    setCategories((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const keywords = parseKeywords(keywordsRaw);
  const tooMany = categories.length > MAX_ITEMS || keywords.length > MAX_ITEMS;

  const save = async () => {
    if (!uid || tooMany) return;
    setSaving(true);
    try {
      const sub: JobAlertSubscription = {
        profile_id: uid, categories, country: country || null, keywords, frequency, active,
      };
      await saveMyAlert(sub);
      setExists(true);
      toast.success(tx.alertsSaved);
    } catch {
      notifyError(tx.alertsSaveError, tx.closeNotice);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!uid) return;
    try {
      await deleteMyAlert(uid);
      setExists(false);
      setActive(false);
      setCategories([]);
      setCountry('');
      setKeywordsRaw('');
      toast.success(tx.alertsDeleted);
    } catch {
      notifyError(tx.alertsSaveError, tx.closeNotice);
    }
  };

  if (!uid) return <p className={`py-10 text-center ${TEXT_META}`}>{tx.alertsNeedProfile}</p>;
  if (state === 'loading') return <PanelSkeleton rows={2} label={tx.alertsLoading} />;
  if (state === 'error') return <PanelError message={tx.alertsError} />;

  return (
    <form onSubmit={(e) => { e.preventDefault(); void save(); }} className="max-w-3xl space-y-8">
      <div>
        <h2 className={`text-xl font-bold ${TEXT_STRONG}`}>{tx.alertsTitle}</h2>
        <p className={`mt-1 max-w-prose text-[15px] leading-relaxed ${TEXT_META}`}>{tx.alertsText}</p>
      </div>

      <p role="note" className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm text-slate-700 dark:border-dark-border dark:bg-white/5 dark:text-dark-text-secondary">
        <InformationCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-slate-500 dark:text-dark-text-secondary" aria-hidden="true" />
        {tx.alertsNotice}
      </p>

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
        <button type="submit" disabled={saving || tooMany} className={BTN_PRIMARY}>
          {saving ? tx.alertsSaving : tx.alertsSave}
        </button>
        {exists && (
          <button type="button" onClick={() => void remove()} className={BTN_GHOST}>
            {tx.alertsDelete}
          </button>
        )}
      </div>
    </form>
  );
};

export default JobAlertsTab;
