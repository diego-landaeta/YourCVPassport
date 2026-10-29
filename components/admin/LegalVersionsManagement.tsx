import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { DocumentPlusIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../../contexts/LanguageContext';
import { fmt } from '../../lib/bolsaText';
import type { LegalTipo } from '../../lib/legal';
import {
  CASILLAS_POR_TIPO,
  LEGAL_IDIOMAS,
  LEGAL_MIN_NOTICE_DAYS,
  LEGAL_TIPOS,
  defaultEffectiveInput,
  fetchLegalVersionText,
  fetchLegalVersions,
  legalRpcCode,
  legalStatuses,
  minEffectiveDate,
  publishLegalVersion,
  toLocalInput,
  validateLegalDraft,
  type AdminLegalVersion,
  type LegalDraft,
  type LegalDraftError,
  type LegalDraftField,
  type LegalIdioma,
  type LegalVersionStatus,
} from '../../lib/legalAdminApi';
import LegalTextBody from '../legal/LegalTextBody';
import { a11y, btnGhostCls, btnPrimaryCls, btnSecondaryCls, btnSmallCls, Field, inputCls } from '../company/jobwizard/fields';
import { useLegalAdminText } from './legalAdminText';

/**
 * Admin: versiones de las condiciones legales (`documentos_legales`).
 *  - Lista por tipo e idioma con estado vigente / próxima / anterior y marca de borrador legal.
 *  - Alta de una versión nueva con `legal_publicar_version` (antelación ≥ 15 días, vista previa del
 *    texto y confirmación antes de publicar; el aviso por correo lo encola la propia RPC).
 * Todo bajo la RLS de admin real: el cliente solo valida lo evidente.
 */

type TextKey = ReturnType<typeof useLegalAdminText>;

const STATUS_DOT: Record<LegalVersionStatus, string> = {
  vigente: 'bg-emerald-500',
  proxima: 'bg-amber-500',
  anterior: 'bg-slate-400 dark:bg-slate-500',
};

const emptyDraft = (rows: ReadonlyArray<AdminLegalVersion>): LegalDraft => {
  const tipo: LegalTipo = 'terminos_candidato';
  const idioma: LegalIdioma = 'es';
  return {
    tipo,
    idioma,
    version: '',
    titulo: '',
    texto: '',
    casillas: [...CASILLAS_POR_TIPO[tipo]],
    vigente_desde: defaultEffectiveInput(minEffectiveDate(tipo, idioma, rows).days),
  };
};

const draftErrorText = (e: LegalDraftError, t: TextKey): string => {
  switch (e) {
    case 'version_required': return t.lErrVersionRequired;
    case 'version_long': return t.lErrVersionLong;
    case 'version_duplicate': return t.lErrVersionDuplicate;
    case 'titulo_required': return t.lErrTituloRequired;
    case 'texto_required': return t.lErrTextoRequired;
    case 'fecha_required': return t.lErrFechaRequired;
    case 'fecha_invalid': return t.lErrFechaInvalid;
    default: return fmt(t.lErrFechaEarly, { days: LEGAL_MIN_NOTICE_DAYS });
  }
};

const LegalVersionsManagement: React.FC = () => {
  const { lang } = useLanguage();
  const t = useLegalAdminText();

  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [rows, setRows] = useState<AdminLegalVersion[]>([]);
  const [fTipo, setFTipo] = useState<'' | LegalTipo>('');
  const [fIdioma, setFIdioma] = useState<'' | LegalIdioma>('');

  // Texto de versiones existentes (se pide al abrirlas)
  const [openId, setOpenId] = useState<string | null>(null);
  const [texts, setTexts] = useState<Record<string, { state: 'loading' | 'ok' | 'error'; texto: string }>>({});

  // Formulario
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState<LegalDraft>(() => emptyDraft([]));
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const [touched, setTouched] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);

  const load = useCallback(async () => {
    setState((s) => (s === 'ready' ? s : 'loading'));
    try {
      setRows(await fetchLegalVersions());
      setState('ready');
    } catch (err) {
      console.error('[AdminLegal] load', err);
      setState('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const dateFmt = useCallback(
    (iso: string) => new Intl.DateTimeFormat(lang === 'es' ? 'es-ES' : 'en-GB', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(iso)),
    [lang],
  );
  const dateTimeFmt = useCallback(
    (value: string) => new Intl.DateTimeFormat(lang === 'es' ? 'es-ES' : 'en-GB', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(value)),
    [lang],
  );

  const statuses = useMemo(() => legalStatuses(rows), [rows]);
  const tipoLabel = (tipo: string) => (t as Record<string, string>)[`lTipo_${tipo}`] || tipo;

  // --- Lista agrupada --------------------------------------------------------------------------
  const groups = useMemo(() => {
    const map = new Map<string, { tipo: LegalTipo; idioma: string; items: AdminLegalVersion[] }>();
    for (const r of rows) {
      if (fTipo && r.tipo !== fTipo) continue;
      if (fIdioma && r.idioma !== fIdioma) continue;
      const k = `${r.tipo}:${r.idioma}`;
      const g = map.get(k);
      if (g) g.items.push(r);
      else map.set(k, { tipo: r.tipo, idioma: r.idioma, items: [r] });
    }
    const order = (tipo: string) => LEGAL_TIPOS.indexOf(tipo as LegalTipo);
    return [...map.values()]
      .sort((a, b) => order(a.tipo) - order(b.tipo) || a.idioma.localeCompare(b.idioma))
      .map((g) => ({ ...g, items: g.items.slice().sort((a, b) => new Date(b.vigente_desde).getTime() - new Date(a.vigente_desde).getTime()) }));
  }, [rows, fTipo, fIdioma]);

  const toggleText = async (r: AdminLegalVersion) => {
    if (openId === r.id) { setOpenId(null); return; }
    setOpenId(r.id);
    if (texts[r.id]?.state === 'ok') return;
    setTexts((p) => ({ ...p, [r.id]: { state: 'loading', texto: '' } }));
    try {
      const texto = await fetchLegalVersionText(r.id);
      setTexts((p) => ({ ...p, [r.id]: { state: 'ok', texto } }));
    } catch (err) {
      console.error('[AdminLegal] texto', err);
      setTexts((p) => ({ ...p, [r.id]: { state: 'error', texto: '' } }));
    }
  };

  // --- Formulario ------------------------------------------------------------------------------
  const min = minEffectiveDate(draft.tipo, draft.idioma, rows);
  const errors = validateLegalDraft(draft, rows);
  const errOf = (field: LegalDraftField): string | null => {
    const e = errors[field];
    return touched && e ? draftErrorText(e, t) : null;
  };

  const patch = (p: Partial<LegalDraft>) => {
    setDraft((d) => ({ ...d, ...p }));
    setServerError(null);
  };

  // Al cambiar tipo/idioma se recalculan las casillas propuestas y la fecha por defecto
  const changeKind = (p: Partial<Pick<LegalDraft, 'tipo' | 'idioma'>>) => {
    setDraft((d) => {
      const tipo = p.tipo ?? d.tipo;
      const idioma = p.idioma ?? d.idioma;
      return {
        ...d,
        tipo,
        idioma,
        casillas: p.tipo ? [...CASILLAS_POR_TIPO[tipo]] : d.casillas,
        vigente_desde: defaultEffectiveInput(minEffectiveDate(tipo, idioma, rows).days),
      };
    });
    setServerError(null);
  };

  const openForm = () => {
    setDraft(emptyDraft(rows));
    setMode('write');
    setTouched(false);
    setConfirming(false);
    setServerError(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setConfirming(false);
    setServerError(null);
  };

  const copyCurrent = async () => {
    const current = rows.find((r) => r.tipo === draft.tipo && r.idioma === draft.idioma && statuses.get(r.id) === 'vigente');
    if (!current) return;
    setCopying(true);
    try {
      const texto = await fetchLegalVersionText(current.id);
      patch({ texto, titulo: draft.titulo || current.titulo, casillas: current.casillas_obligatorias });
      toast.success(t.lFromCurrentDone);
    } catch (err) {
      console.error('[AdminLegal] copiar', err);
      toast.error(t.lFromCurrentError);
    } finally {
      setCopying(false);
    }
  };

  const hasCurrent = rows.some((r) => r.tipo === draft.tipo && r.idioma === draft.idioma && statuses.get(r.id) === 'vigente');

  const review = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (Object.keys(errors).length > 0) {
      setMode('write');
      return;
    }
    setConfirming(true);
  };

  const publish = async () => {
    if (publishing) return;
    setPublishing(true);
    setServerError(null);
    try {
      const res = await publishLegalVersion(draft);
      toast.success(res.notified != null ? fmt(t.lPublishedN, { version: draft.version.trim(), n: res.notified }) : fmt(t.lPublished, { version: draft.version.trim() }));
      closeForm();
      await load();
    } catch (err) {
      console.error('[AdminLegal] publicar', err);
      const code = legalRpcCode(err);
      setConfirming(false);
      setServerError(
        code === 'FORBIDDEN' ? t.lSrvForbidden
          : code === 'DUPLICATE' ? t.lSrvDuplicate
            : code && /ANTELACION|NOTICE|VIGENTE_DESDE|ANTICIP/.test(code) ? fmt(t.lSrvAntelacion, { days: LEGAL_MIN_NOTICE_DAYS })
              : t.lSrvGeneric,
      );
    } finally {
      setPublishing(false);
    }
  };

  // --- Render ----------------------------------------------------------------------------------
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

  const selectCls = `${inputCls} sm:w-60`;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-dark-text-primary">{t.lTitle}</h2>
          <p className="mt-1 max-w-[68ch] text-sm leading-relaxed text-slate-600 dark:text-dark-text-secondary">{fmt(t.lIntro, { days: LEGAL_MIN_NOTICE_DAYS })}</p>
        </div>
        {!formOpen && (
          <button type="button" onClick={openForm} className={btnPrimaryCls}>
            <DocumentPlusIcon className="h-5 w-5" aria-hidden="true" />
            {t.lNew}
          </button>
        )}
      </header>

      {serverError && !formOpen && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">{serverError}</p>
      )}

      {formOpen && (
        <section aria-labelledby="legal-form-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,.05),0_12px_32px_-20px_rgba(15,23,42,.2)] dark:border-dark-border dark:bg-dark-bg-secondary dark:shadow-none sm:p-6">
          <h3 id="legal-form-title" className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">{t.lFormTitle}</h3>
          <p className="mt-1 max-w-[68ch] text-sm text-slate-600 dark:text-dark-text-secondary">{t.lFormHelp}</p>

          {confirming ? (
            <div className="mt-6" data-testid="legal-confirm">
              <div role="alertdialog" aria-labelledby="legal-confirm-title" aria-describedby="legal-confirm-text" className="rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-400/30 dark:bg-amber-500/10">
                <p id="legal-confirm-title" className="flex items-center gap-2 font-semibold text-amber-950 dark:text-amber-100">
                  <ExclamationTriangleIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  {t.lConfirmTitle}
                </p>
                <p id="legal-confirm-text" className="mt-2 text-sm leading-relaxed text-amber-950 dark:text-amber-100">
                  {fmt(t.lConfirmText, {
                    version: draft.version.trim(),
                    titulo: draft.titulo.trim(),
                    lang: draft.idioma.toUpperCase(),
                    date: dateTimeFmt(draft.vigente_desde),
                  })}
                </p>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" onClick={() => void publish()} disabled={publishing} className={btnPrimaryCls}>
                  {publishing ? t.lPublishing : t.lConfirm}
                </button>
                <button type="button" onClick={() => setConfirming(false)} disabled={publishing} className={btnSecondaryCls}>{t.lBack}</button>
              </div>
            </div>
          ) : (
            <form onSubmit={review} noValidate className="mt-6">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                <Field id="legal-tipo" label={t.lFType} required>
                  <select id="legal-tipo" value={draft.tipo} onChange={(e) => changeKind({ tipo: e.target.value as LegalTipo })} className={inputCls}>
                    {LEGAL_TIPOS.map((tipo) => <option key={tipo} value={tipo}>{tipoLabel(tipo)}</option>)}
                  </select>
                </Field>
                <Field id="legal-idioma" label={t.lFLang} required>
                  <select id="legal-idioma" value={draft.idioma} onChange={(e) => changeKind({ idioma: e.target.value as LegalIdioma })} className={inputCls}>
                    {LEGAL_IDIOMAS.map((i) => <option key={i} value={i}>{i.toUpperCase()}</option>)}
                  </select>
                </Field>
                <Field id="legal-version" label={t.lFVersion} required help={t.lFVersionHelp} error={errOf('version')}>
                  <input {...a11y('legal-version', { help: true, error: errOf('version') })} value={draft.version} onChange={(e) => patch({ version: e.target.value })} maxLength={30} autoComplete="off" className={`${inputCls} tabular-nums`} />
                </Field>
                <Field
                  id="legal-fecha"
                  label={t.lFDate}
                  required
                  help={min.days > 0 ? fmt(t.lFDateHelp, { days: min.days }) : t.lFDateHelp0}
                  error={errOf('vigente_desde')}
                >
                  <input
                    {...a11y('legal-fecha', { help: true, error: errOf('vigente_desde') })}
                    type="datetime-local"
                    value={draft.vigente_desde}
                    min={toLocalInput(min.min)}
                    onChange={(e) => patch({ vigente_desde: e.target.value })}
                    className={`${inputCls} tabular-nums`}
                  />
                </Field>
                <Field id="legal-titulo" label={t.lFTitle} required error={errOf('titulo')} className="sm:col-span-2">
                  <input {...a11y('legal-titulo', { error: errOf('titulo') })} value={draft.titulo} onChange={(e) => patch({ titulo: e.target.value })} maxLength={200} autoComplete="off" className={inputCls} />
                </Field>
              </div>

              <div className="mt-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{t.lFText} <span className="text-red-600 dark:text-red-400" aria-hidden="true">*</span></p>
                  <div className="flex flex-wrap items-center gap-2">
                    {hasCurrent && (
                      <button type="button" onClick={() => void copyCurrent()} disabled={copying} className={btnGhostCls}>
                        {copying ? t.loading : t.lFromCurrent}
                      </button>
                    )}
                    <div role="group" aria-label={`${t.lWrite} / ${t.lPreview}`} className="inline-flex rounded-lg border border-slate-300 p-0.5 dark:border-dark-border">
                      {(['write', 'preview'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          aria-pressed={mode === m}
                          onClick={() => setMode(m)}
                          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-dark-bg-secondary ${
                            mode === m ? 'bg-cv-blue text-white' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-dark-bg-tertiary'
                          }`}
                        >
                          {m === 'write' ? t.lWrite : t.lPreview}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {mode === 'write' ? (
                  <div className="mt-2">
                    <textarea
                      {...a11y('legal-texto', { help: true, error: errOf('texto') })}
                      aria-label={t.lFText}
                      value={draft.texto}
                      onChange={(e) => patch({ texto: e.target.value })}
                      rows={14}
                      className={`${inputCls} font-mono text-[13px] leading-relaxed sm:text-[13px]`}
                    />
                    <p id="legal-texto-help" className="mt-1.5 text-[13px] text-slate-600 dark:text-dark-text-secondary">{t.lFTextHelp}</p>
                    {errOf('texto') && <p id="legal-texto-err" role="alert" className="mt-1.5 text-sm text-red-700 dark:text-red-400">{errOf('texto')}</p>}
                  </div>
                ) : (
                  <div className="mt-2 max-h-[28rem] overflow-y-auto rounded-xl border border-slate-200 bg-white px-5 py-5 dark:border-dark-border dark:bg-dark-bg-primary" data-testid="legal-preview" tabIndex={0} aria-label={t.lPreview}>
                    {draft.texto.trim() ? (
                      <>
                        <p className="mb-4 border-b border-slate-200 pb-3 text-sm font-semibold text-slate-900 dark:border-dark-border dark:text-white">
                          {fmt(t.lPreviewHeading, { titulo: draft.titulo.trim() || '—', version: draft.version.trim() || '—' })}
                        </p>
                        <LegalTextBody texto={draft.texto} />
                      </>
                    ) : (
                      <p className="text-sm text-slate-600 dark:text-dark-text-secondary">{t.lPreviewEmpty}</p>
                    )}
                  </div>
                )}
              </div>

              {CASILLAS_POR_TIPO[draft.tipo].length > 0 && (
                <fieldset className="mt-6">
                  <legend className="text-sm font-medium text-slate-800 dark:text-slate-100">{t.lFChecks}</legend>
                  <p className="mt-0.5 text-[13px] text-slate-600 dark:text-dark-text-secondary">{t.lFChecksHelp}</p>
                  <div className="mt-3 space-y-2.5">
                    {CASILLAS_POR_TIPO[draft.tipo].map((key) => (
                      <div key={key} className="flex items-start gap-3">
                        <input
                          id={`legal-casilla-${key}`}
                          type="checkbox"
                          checked={draft.casillas.includes(key)}
                          onChange={(e) => patch({ casillas: e.target.checked ? [...draft.casillas, key] : draft.casillas.filter((k) => k !== key) })}
                          className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-slate-300 accent-cv-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 dark:border-dark-border dark:focus-visible:ring-offset-dark-bg-secondary"
                        />
                        <label htmlFor={`legal-casilla-${key}`} className="cursor-pointer text-sm leading-snug text-slate-800 dark:text-slate-100">
                          {(t as Record<string, string>)[`casilla_${key}`] || key}
                        </label>
                      </div>
                    ))}
                  </div>
                </fieldset>
              )}

              {serverError && (
                <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">{serverError}</p>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <button type="submit" className={btnPrimaryCls}>{t.lPublish}</button>
                <button type="button" onClick={closeForm} className={btnSecondaryCls}>{t.lCancel}</button>
              </div>
            </form>
          )}
        </section>
      )}

      <section aria-label={t.lTitle}>
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          <div>
            <label htmlFor="legal-f-tipo" className="mb-1 block text-[13px] font-medium text-slate-700 dark:text-slate-200">{t.lFilterType}</label>
            <select id="legal-f-tipo" value={fTipo} onChange={(e) => setFTipo(e.target.value as '' | LegalTipo)} className={selectCls}>
              <option value="">{t.lAll}</option>
              {LEGAL_TIPOS.map((tipo) => <option key={tipo} value={tipo}>{tipoLabel(tipo)}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="legal-f-idioma" className="mb-1 block text-[13px] font-medium text-slate-700 dark:text-slate-200">{t.lFilterLang}</label>
            <select id="legal-f-idioma" value={fIdioma} onChange={(e) => setFIdioma(e.target.value as '' | LegalIdioma)} className={selectCls}>
              <option value="">{t.lAll}</option>
              {LEGAL_IDIOMAS.map((i) => <option key={i} value={i}>{i.toUpperCase()}</option>)}
            </select>
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="mt-6 text-slate-600 dark:text-dark-text-secondary">{t.lEmpty}</p>
        ) : groups.length === 0 ? (
          <p role="status" className="mt-6 text-slate-600 dark:text-dark-text-secondary">{t.lNoResults}</p>
        ) : (
          <div className="mt-6 space-y-8" data-testid="legal-versions">
            {groups.map((g) => (
              <div key={`${g.tipo}:${g.idioma}`}>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  {tipoLabel(g.tipo)} <span className="font-medium text-slate-500 dark:text-dark-text-secondary">· {g.idioma.toUpperCase()}</span>
                </h3>
                <ul className="mt-2 divide-y divide-slate-200 border-y border-slate-200 dark:divide-dark-border dark:border-dark-border">
                  {g.items.map((r) => {
                    const status = statuses.get(r.id) || 'anterior';
                    const isOpen = openId === r.id;
                    const tx = texts[r.id];
                    return (
                      <li key={r.id} data-version={r.version} data-status={status} className="py-3">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                          <span className="w-16 shrink-0 font-semibold tabular-nums text-slate-900 dark:text-white">{fmt(t.lVersion, { version: r.version })}</span>
                          <span className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-slate-100">
                            <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[status]}`} />
                            {(t as Record<string, string>)[`lStatus_${status}`]}
                          </span>
                          {r.borrador && (
                            <span title={t.lDraftHelp} className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200">
                              <ExclamationTriangleIcon className="h-3.5 w-3.5" aria-hidden="true" />
                              {t.lDraft}
                            </span>
                          )}
                          <span className="min-w-0 flex-1 basis-48 text-sm text-slate-600 dark:text-dark-text-secondary">
                            <span className="block truncate text-slate-800 dark:text-slate-100">{r.titulo}</span>
                            <span className="tabular-nums">{fmt(status === 'proxima' ? t.lSinceFuture : t.lSince, { date: dateFmt(r.vigente_desde) })}</span>
                          </span>
                          <button type="button" onClick={() => void toggleText(r)} aria-expanded={isOpen} className={btnSmallCls}>
                            {isOpen ? t.lHideText : t.lViewText}
                          </button>
                        </div>
                        {isOpen && (
                          <div className="mt-3 max-h-96 overflow-y-auto rounded-xl border border-slate-200 bg-white px-5 py-4 dark:border-dark-border dark:bg-dark-bg-primary" tabIndex={0} aria-label={`${t.lViewText}: ${r.titulo}`}>
                            {tx?.state === 'ok' ? <LegalTextBody texto={tx.texto} />
                              : tx?.state === 'error' ? <p role="alert" className="text-sm text-red-700 dark:text-red-400">{t.lTextError}</p>
                                : <p role="status" className="text-sm text-slate-600 dark:text-dark-text-secondary">{t.lTextLoading}</p>}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default LegalVersionsManagement;
