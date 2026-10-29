import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircleIcon, ChevronUpIcon, EnvelopeIcon, ExclamationTriangleIcon, StarIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../../contexts/LanguageContext';
import { fmt } from '../../lib/bolsaText';
import { formatDate } from '../../lib/jobsFormat';
import {
  errorCode, fetchApplicationHistory, fetchJobQuestionsForCompany, sendApplicationMessage, updateApplicationStatus,
  type ApplicationHistoryRow, type ApplicationMessageTemplate, type JobQuestion,
} from '../../lib/jobsApi';
import { ckey, useCompanyAppsText } from './textosEmpresa';
import { STATUS_TONE, currentRole, matchCls, totalYears, type CompanyApp, type JobLite } from './ApplicantShared';
import {
  BTN_DANGER, BTN_DANGER_OUTLINE, BTN_GHOST, BTN_PRIMARY, BTN_SECONDARY, FIELD_CLS, FOCUS, PersonAvatar, StatusDot,
  TEXT_META, TEXT_STRONG, Timeline, notifyError,
} from './PanelBits';

interface DrawerProps {
  app: CompanyApp;
  job: JobLite | null;
  companyId: string;
  userId: string;
  onClose: () => void;
  onSaved: (patch: Partial<CompanyApp> & { id: string }) => void;
  onOpenPublicProfile: (slug: string) => void;
}

const Block: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="py-6 first:pt-0 last:pb-0">
    <h3 className={`mb-3 text-base font-semibold ${TEXT_STRONG}`}>{title}</h3>
    {children}
  </section>
);

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Detalle de una candidatura en un panel lateral (pantalla completa en movil): perfil copiado,
 * respuestas, historial, notas y valoracion; acciones de estado en un pie fijo
 * (primaria + «Mas acciones» + Descartar con confirmacion).
 */
const ApplicantDrawer: React.FC<DrawerProps> = ({ app, job, companyId, userId, onClose, onSaved, onOpenPublicProfile }) => {
  const tx = useCompanyAppsText();
  const { lang } = useLanguage();
  const panelRef = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [notes, setNotes] = useState(app.internal_notes || '');
  const [rating, setRating] = useState<number | null>(app.rating);
  // «Quitar valoración»: hay que decirselo a la RPC (p_clear_rating); con rating = null no borra
  const [ratingCleared, setRatingCleared] = useState(false);
  // Mensajes por correo con plantilla
  const [msgConfirm, setMsgConfirm] = useState<ApplicationMessageTemplate | null>(null);
  const [msgSending, setMsgSending] = useState(false);
  const [msgSent, setMsgSent] = useState<Set<ApplicationMessageTemplate>>(new Set());
  const [msgError, setMsgError] = useState<string | null>(null);
  const msgCancelRef = useRef<HTMLButtonElement>(null);
  const [busy, setBusy] = useState(false);
  const [questions, setQuestions] = useState<Array<JobQuestion & { expected_answer: string | null }>>([]);
  const [history, setHistory] = useState<ApplicationHistoryRow[] | null>(null);
  const [historyError, setHistoryError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const snap = app.perfil_copia;
  const p = snap?.profile || {};
  const name = p.full_name || tx.noName;
  const withdrawn = app.status === 'WITHDRAWN';
  const years = totalYears(snap?.experiences);
  const role = currentRole(snap?.experiences);

  // Foco, bloqueo de scroll y animacion de entrada (se omite con movimiento reducido)
  useEffect(() => {
    opener.current = document.activeElement;
    const panel = panelRef.current;
    panel?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (panel && typeof panel.animate === 'function' && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      panel.animate([{ opacity: 0, transform: 'translateX(24px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
    }
    return () => {
      document.body.style.overflow = prev;
      if (opener.current instanceof HTMLElement) opener.current.focus();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (menuOpen) { setMenuOpen(false); return; }
        if (!busy) onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      // El foco no sale del panel mientras esta abierto
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panelRef.current)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, busy, menuOpen]);

  useEffect(() => {
    let alive = true;
    fetchJobQuestionsForCompany(app.job_posting_id).then((q) => { if (alive) setQuestions(q); }).catch(() => { /* sin preguntas */ });
    fetchApplicationHistory(app.id).then((h) => {
      if (!alive) return;
      setHistory(h);
      // Mensajes ya enviados en las ultimas 24 h (el servidor no deja repetirlos): se muestran como enviados
      const recent = new Set<ApplicationMessageTemplate>();
      for (const r of h) {
        const m = /^message:(rejected|interview)$/.exec(r.note || '');
        if (m && Date.now() - Date.parse(r.created_at) < 24 * 3600_000) recent.add(m[1] as ApplicationMessageTemplate);
      }
      if (recent.size) setMsgSent((prev) => new Set([...prev, ...recent]));
    }).catch(() => { if (alive) setHistoryError(true); });
    return () => { alive = false; };
  }, [app.id, app.job_posting_id]);

  // Menu «Mas acciones»: foco al primer elemento y cierre al pulsar fuera
  useEffect(() => {
    if (!menuOpen) return;
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.parentElement?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menuOpen]);

  useEffect(() => {
    if (confirmDiscard) cancelRef.current?.focus();
  }, [confirmDiscard]);

  useEffect(() => {
    if (msgConfirm) msgCancelRef.current?.focus();
  }, [msgConfirm]);

  const failed = new Set(app.metadata?.failed_questions || []);

  const save = async (status: string, okMessage: string) => {
    setBusy(true);
    try {
      await updateApplicationStatus({
        applicationId: app.id, companyId, userId, status,
        // '' (no null): la RPC hace coalesce(p_internal_notes, internal_notes), con null no se podria borrar
        notes: notes.trim(), rating, clearRating: ratingCleared && rating === null,
      });
      setRatingCleared(false);
      onSaved({ id: app.id, status, internal_notes: notes.trim() || null, rating, viewed_by_company: true });
      toast.success(okMessage);
      setConfirmDiscard(false);
      // El historial cambia con el estado
      fetchApplicationHistory(app.id).then(setHistory).catch(() => { /* se queda el anterior */ });
    } catch (e) {
      const code = errorCode(e);
      const pg = (e as { code?: string } | null)?.code;
      notifyError(code === 'APPLICATION_WITHDRAWN' ? tx.withdrawnError
        : pg === '42501' || code === 'UNAUTHORIZED' ? tx.noPermission : tx.genericError, tx.closeNotice);
    } finally {
      setBusy(false);
    }
  };

  const sendMessage = async (template: ApplicationMessageTemplate) => {
    setMsgSending(true);
    setMsgError(null);
    try {
      await sendApplicationMessage(app.id, template);
      setMsgSent((prev) => new Set(prev).add(template));
      setMsgConfirm(null);
      toast.success(tx.msgSentOk);
    } catch (e) {
      const raw = String((e as { message?: string } | null)?.message ?? e ?? '');
      const pg = (e as { code?: string } | null)?.code;
      setMsgConfirm(null);
      setMsgError(
        /ALREADY|RECENT|RATE|LIMIT|TOO_MANY|24/i.test(raw) ? tx.msgRecent
          : pg === '42501' || errorCode(e) === 'UNAUTHORIZED' || errorCode(e) === 'FORBIDDEN' ? tx.noPermission
            : tx.msgError,
      );
    } finally {
      setMsgSending(false);
    }
  };

  const answerText = (v: unknown): string => {
    if (v == null) return '';
    if (Array.isArray(v)) return v.join(', ');
    const s = String(v);
    return s === 'YES' ? (lang === 'es' ? 'Sí' : 'Yes') : s === 'NO' ? 'No' : s;
  };

  // Accion primaria segun donde esta la candidatura; el resto va al menu
  const primary: string | null = ['NEW', 'REVIEWING', 'NOT_QUALIFIED', 'REJECTED'].includes(app.status)
    ? 'SHORTLISTED'
    : ['SHORTLISTED', 'INTERVIEW', 'OFFER'].includes(app.status) ? 'HIRED' : null;
  const menuItems = [
    app.status === 'NOT_QUALIFIED' ? 'NEW' : null,
    primary === 'SHORTLISTED' ? 'HIRED' : app.status !== 'SHORTLISTED' ? 'SHORTLISTED' : null,
    app.status !== 'INTERVIEW' ? 'INTERVIEW' : null,
  ].filter((s): s is string => !!s && s !== app.status && s !== primary);

  const onMenuKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') || []);
    const i = items.indexOf(document.activeElement as HTMLElement);
    const next = e.key === 'ArrowDown' ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
    items[next]?.focus();
  };

  const experiences = snap?.experiences || [];
  const education = snap?.education || [];
  const skills = snap?.skills || [];
  const languages = snap?.languages || [];
  const location = p.location as string | undefined;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" aria-hidden="true" onMouseDown={() => { if (!busy) onClose(); }} />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ad-title"
        className="absolute inset-y-0 right-0 flex w-full flex-col bg-white shadow-[0_0_48px_-12px_rgba(15,23,42,.45)] focus:outline-none dark:bg-dark-bg-secondary sm:max-w-xl sm:border-l sm:border-slate-200 lg:max-w-2xl dark:sm:border-dark-border"
      >
        <header className="flex items-start gap-4 border-b border-slate-200 px-5 py-4 dark:border-dark-border sm:px-6">
          <PersonAvatar name={name} url={p.avatar_url as string | undefined} size="lg" />
          <div className="min-w-0 flex-1">
            <h2 id="ad-title" className={`text-xl font-bold leading-tight break-words ${TEXT_STRONG}`}>{name}</h2>
            {p.headline && <p className={`mt-0.5 text-[15px] ${TEXT_META}`}>{p.headline}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
              <StatusDot tone={STATUS_TONE[app.status] || 'info'}>{ckey(tx, `st_${app.status}`, app.status)}</StatusDot>
              {job?.title && <span className={`text-sm ${TEXT_META}`}>{job.title}</span>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label={tx.close}
            className={`-mr-1 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-60 dark:text-dark-text-secondary dark:hover:bg-white/10 ${FOCUS}`}
          >
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="divide-y divide-slate-200 px-5 py-6 dark:divide-dark-border sm:px-6">
            {app.descartada_auto && (
              <div role="note" className="mb-6 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-500/40 dark:bg-amber-500/10">
                <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-amber-900 dark:text-amber-200">{tx.autoDiscarded}</p>
                  <p className="mt-0.5 text-sm text-amber-900 dark:text-amber-200">{tx.autoDiscardedText}</p>
                </div>
              </div>
            )}

            <Block title={tx.factsTitle}>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                <div>
                  <dt className={`text-sm ${TEXT_META}`}>{tx.factMatch}</dt>
                  <dd className={`mt-0.5 text-2xl font-bold tabular-nums ${matchCls(app.match_score || 0)}`}>{app.match_score ?? 0}%</dd>
                </div>
                <div>
                  <dt className={`text-sm ${TEXT_META}`}>{tx.factExperience}</dt>
                  <dd className={`mt-0.5 text-base font-semibold ${TEXT_STRONG}`}>
                    {years > 0 ? (years === 1 ? tx.yearShort : fmt(tx.yearsShort, { n: years })) : '—'}
                  </dd>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <dt className={`text-sm ${TEXT_META}`}>{tx.factLocation}</dt>
                  <dd className={`mt-0.5 text-base font-semibold break-words ${TEXT_STRONG}`}>{location || '—'}</dd>
                </div>
              </dl>
              {role && <p className={`mt-4 text-sm ${TEXT_META}`}>{fmt(tx.currentRole, { role })}</p>}
            </Block>

            {snap ? (
              <>
                <Block title={tx.contact}>
                  <p className={`text-[15px] break-words ${TEXT_STRONG}`}>
                    {[snap.contact?.email, snap.contact?.phone].filter(Boolean).join(' · ') || '—'}
                  </p>
                  {p.slug && (
                    <button type="button" onClick={() => onOpenPublicProfile(String(p.slug))} className={`mt-2 rounded text-sm font-semibold text-cv-blue underline underline-offset-4 dark:text-cv-blue-light ${FOCUS}`}>{tx.viewFullProfile}</button>
                  )}
                  <p className={`mt-3 text-[13px] ${TEXT_META}`}>{fmt(tx.sentCopyNote, { date: formatDate(snap.captured_at || app.created_at, lang) })}</p>
                </Block>

                {p.summary && (
                  <Block title={tx.summary}>
                    <p className={`max-w-prose whitespace-pre-line text-[15px] leading-relaxed ${TEXT_STRONG}`}>{p.summary}</p>
                  </Block>
                )}
              </>
            ) : (
              <Block title={tx.contact}>
                <p className={`text-sm ${TEXT_META}`}>{tx.noCopy}</p>
              </Block>
            )}

            <Block title={tx.answers}>
              {questions.length === 0 ? (
                <p className={`text-sm ${TEXT_META}`}>{tx.noAnswers}</p>
              ) : (
                <dl className="divide-y divide-slate-100 dark:divide-white/10">
                  {questions.map((q) => (
                    <div key={q.id} className="py-3 first:pt-0 last:pb-0">
                      <dt className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium ${TEXT_STRONG}`}>
                        {q.question_text}
                        {q.is_knockout && <span className="rounded px-1.5 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-300 dark:text-amber-300 dark:ring-amber-500/40">{tx.knockoutBadge}</span>}
                        {failed.has(q.id) && <span className="rounded px-1.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-300 dark:text-red-300 dark:ring-red-500/40">{tx.notMet}</span>}
                      </dt>
                      <dd className={`mt-1 text-[15px] ${TEXT_META}`}>{answerText(app.answers?.[q.id]) || '—'}</dd>
                      {q.is_knockout && q.expected_answer && <dd className={`mt-0.5 text-[13px] ${TEXT_META}`}>{fmt(tx.expectedAnswer, { a: q.expected_answer.split('|').map((x) => answerText(x.trim())).join(' / ') })}</dd>}
                    </div>
                  ))}
                </dl>
              )}
            </Block>

            {experiences.length > 0 && (
              <Block title={tx.experience}>
                <ul className="space-y-4">
                  {experiences.map((e, i) => (
                    <li key={i}>
                      <p className={`text-[15px] font-semibold ${TEXT_STRONG}`}>{e.position}{e.company_name ? <span className={`font-normal ${TEXT_META}`}> · {e.company_name}</span> : null}</p>
                      <p className={`text-[13px] tabular-nums ${TEXT_META}`}>
                        {formatDate(e.start_date, lang)} – {e.is_current || !e.end_date ? tx.present : formatDate(e.end_date, lang)}
                      </p>
                      {e.description && <p className={`mt-1.5 max-w-prose whitespace-pre-line text-sm leading-relaxed ${TEXT_META}`}>{e.description}</p>}
                    </li>
                  ))}
                </ul>
              </Block>
            )}

            {education.length > 0 && (
              <Block title={tx.education}>
                <ul className="space-y-2">
                  {education.map((e, i) => (
                    <li key={i} className={`text-[15px] ${TEXT_STRONG}`}>
                      <span className="font-semibold">{[e.degree, e.field_of_study].filter(Boolean).join(' · ')}</span>
                      {e.institution_name && <span className={TEXT_META}> — {e.institution_name}</span>}
                    </li>
                  ))}
                </ul>
              </Block>
            )}

            {skills.length > 0 && (
              <Block title={tx.skills}>
                <ul className="flex flex-wrap gap-1.5">
                  {skills.map((s, i) => (
                    <li key={i} className="rounded-md bg-slate-100 px-2.5 py-1 text-sm text-slate-700 dark:bg-white/10 dark:text-dark-text-primary">{s.name}</li>
                  ))}
                </ul>
              </Block>
            )}

            {languages.length > 0 && (
              <Block title={tx.languages}>
                <p className={`text-[15px] ${TEXT_STRONG}`}>
                  {languages.map((l) => `${l.name}${l.is_native ? ` (${tx.nativeLang})` : l.level ? ` (${l.level})` : ''}`).join(' · ')}
                </p>
              </Block>
            )}

            {app.cover_letter && (
              <Block title={tx.coverLetter}>
                <p className={`max-w-prose whitespace-pre-wrap text-[15px] leading-relaxed ${TEXT_STRONG}`}>{app.cover_letter}</p>
              </Block>
            )}

            <Block title={tx.history}>
              {historyError ? (
                <p role="alert" className="text-sm text-red-700 dark:text-red-400">{tx.historyError}</p>
              ) : history && history.length === 0 ? (
                <p className={`text-sm ${TEXT_META}`}>{tx.historyEmpty}</p>
              ) : history ? (
                <Timeline
                  label={tx.history}
                  items={history.map((h, i) => ({
                    key: String(i),
                    label: /^message:/.test(h.note || '')
                      ? ckey(tx, `msgHist_${(h.note || '').slice(8)}`, h.note || '')
                      : ckey(tx, `st_${h.to_status}`, h.to_status),
                    sub: ckey(tx, `role_${h.changed_by_role}`, h.changed_by_role),
                    at: formatDate(h.created_at, lang),
                  }))}
                />
              ) : (
                <div className="h-4 w-32 rounded bg-slate-200 dark:bg-white/10 motion-safe:animate-pulse" aria-hidden="true" />
              )}
              {app.consent_at && <p className={`mt-4 text-[13px] ${TEXT_META}`}>{fmt(tx.consentText, { date: formatDate(app.consent_at, lang) })}</p>}
            </Block>

            {!withdrawn && (
              <Block title={tx.msgTitle}>
                <p className={`text-sm ${TEXT_META}`}>{tx.msgHint}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(['rejected', 'interview'] as const).map((tpl) => {
                    const sent = msgSent.has(tpl);
                    return (
                      <button
                        key={tpl}
                        type="button"
                        disabled={msgSending || sent}
                        aria-haspopup="dialog"
                        onClick={() => { setMsgError(null); setMsgConfirm(tpl); }}
                        className={BTN_SECONDARY}
                      >
                        {sent
                          ? <CheckCircleIcon className="h-4 w-4 text-green-700 dark:text-green-400" aria-hidden="true" />
                          : <EnvelopeIcon className="h-4 w-4" aria-hidden="true" />}
                        {sent ? `${ckey(tx, `msgBtn_${tpl}`)} · ${tx.msgSentBadge}` : ckey(tx, `msgBtn_${tpl}`)}
                      </button>
                    );
                  })}
                </div>
                {msgConfirm && (
                  <div role="alertdialog" aria-labelledby="ad-msg-t" aria-describedby="ad-msg-d" className="mt-4 rounded-xl border border-slate-300 p-4 dark:border-dark-border">
                    <p id="ad-msg-t" className={`font-semibold ${TEXT_STRONG}`}>{ckey(tx, `msgConfirmTitle_${msgConfirm}`)}</p>
                    <p id="ad-msg-d" className={`mt-1 text-sm ${TEXT_META}`}>{fmt(ckey(tx, `msgConfirmText_${msgConfirm}`), { job: job?.title || '' })}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" disabled={msgSending} onClick={() => void sendMessage(msgConfirm)} className={BTN_PRIMARY}>
                        {msgSending ? tx.msgSending : tx.msgSend}
                      </button>
                      <button ref={msgCancelRef} type="button" disabled={msgSending} onClick={() => setMsgConfirm(null)} className={BTN_SECONDARY}>{tx.cancel}</button>
                    </div>
                  </div>
                )}
                <div aria-live="polite">
                  {msgError && <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-400">{msgError}</p>}
                </div>
              </Block>
            )}

            <Block title={tx.rating}>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex items-center" role="radiogroup" aria-label={tx.rating}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={rating === n}
                      aria-label={fmt(tx.starLabel, { n })}
                      onClick={() => { setRating(n); setRatingCleared(false); }}
                      disabled={withdrawn}
                      className={`rounded p-1 disabled:opacity-60 ${FOCUS}`}
                    >
                      <StarIcon
                        className={`h-7 w-7 ${rating && n <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 hover:text-amber-400 dark:text-slate-600 dark:hover:text-amber-400'}`}
                        aria-hidden="true"
                      />
                    </button>
                  ))}
                </div>
                {rating != null && !withdrawn && (
                  <button type="button" onClick={() => { setRating(null); setRatingCleared(true); }} className={`${BTN_GHOST} !px-2 !py-1`}>{tx.clearRating}</button>
                )}
              </div>

              <label htmlFor="ad-notes" className={`mb-1.5 mt-5 block text-base font-semibold ${TEXT_STRONG}`}>{tx.notes}</label>
              <textarea
                id="ad-notes"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={withdrawn}
                maxLength={4000}
                aria-describedby="ad-notes-hint"
                placeholder={tx.notesPlaceholder}
                className={`${FIELD_CLS} disabled:opacity-60`}
              />
              <p id="ad-notes-hint" className={`mt-1.5 text-[13px] ${TEXT_META}`}>{tx.notesHint}</p>
              {!withdrawn && (
                <button type="button" disabled={busy} onClick={() => void save(app.status, tx.saved)} className={`${BTN_SECONDARY} mt-3`}>
                  {busy ? tx.saving : tx.saveNotes}
                </button>
              )}
            </Block>
          </div>
        </div>

        <footer className="border-t border-slate-200 bg-white px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 dark:border-dark-border dark:bg-dark-bg-secondary sm:px-6">
          {withdrawn ? (
            <p role="note" className={`text-sm ${TEXT_META}`}>{tx.withdrawnNote}</p>
          ) : confirmDiscard ? (
            <div role="alertdialog" aria-labelledby="ad-discard-t" aria-describedby="ad-discard-d">
              <p id="ad-discard-t" className="flex items-center gap-2 font-semibold text-red-900 dark:text-red-200">
                <ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />{tx.discardConfirmTitle}
              </p>
              <p id="ad-discard-d" className={`mt-1 text-sm ${TEXT_META}`}>{tx.discardConfirmText}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" disabled={busy} onClick={() => void save('REJECTED', tx.statusChanged)} className={BTN_DANGER}>
                  {busy ? tx.saving : tx.discardYes}
                </button>
                <button ref={cancelRef} type="button" disabled={busy} onClick={() => setConfirmDiscard(false)} className={BTN_SECONDARY}>{tx.cancel}</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {primary && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void save(primary, tx.statusChanged)}
                  className={`${BTN_PRIMARY} order-first w-full sm:order-last sm:ml-auto sm:w-auto`}
                >
                  {ckey(tx, `act_${primary}`, primary)}
                </button>
              )}
              {app.status !== 'REJECTED' && (
                <button type="button" disabled={busy} onClick={() => setConfirmDiscard(true)} className={BTN_DANGER_OUTLINE}>
                  {ckey(tx, 'act_REJECTED', 'REJECTED')}
                </button>
              )}
              {menuItems.length > 0 && (
                <div className="relative">
                  <button
                    type="button"
                    disabled={busy}
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((o) => !o)}
                    className={BTN_SECONDARY}
                  >
                    {tx.moreActions}
                    <ChevronUpIcon className={`h-4 w-4 transition-transform duration-150 ${menuOpen ? '' : 'rotate-180'}`} aria-hidden="true" />
                  </button>
                  {menuOpen && (
                    <div
                      ref={menuRef}
                      role="menu"
                      aria-label={tx.moreActions}
                      onKeyDown={onMenuKey}
                      className="absolute bottom-full left-0 z-10 mb-2 min-w-[14rem] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-[0_1px_2px_rgba(15,23,42,.06),0_12px_32px_-12px_rgba(15,23,42,.3)] dark:border-dark-border dark:bg-dark-bg-tertiary"
                    >
                      {menuItems.map((s) => (
                        <button
                          key={s}
                          type="button"
                          role="menuitem"
                          onClick={() => { setMenuOpen(false); void save(s, tx.statusChanged); }}
                          className="block w-full px-4 py-2.5 text-left text-sm text-slate-800 hover:bg-slate-50 focus:bg-slate-100 focus:outline-none dark:text-dark-text-primary dark:hover:bg-white/5 dark:focus:bg-white/10"
                        >
                          {ckey(tx, `act_${s}`, s)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </footer>
      </div>
    </div>
  );
};

export default ApplicantDrawer;
