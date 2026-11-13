/**
 * Pagos con Stripe en las páginas: estado (get-billing-status), acciones
 * (Checkout y portal) con sus avisos, y la vuelta de Stripe (?checkout=ok|cancel,
 * ?billing=manage del correo de fin de prueba).
 *
 * Con los pagos sin activar, las acciones solo enseñan el aviso «Los pagos
 * estarán disponibles muy pronto» y nada más cambia (lib/billingApi.ts).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToastContext } from '../contexts/ToastContext';
import { useTranslations } from './useTranslations';
import { setPostLoginReturn } from '../lib/jobsReturn';
import {
  getBillingStatus,
  invalidateBillingStatus,
  openBillingPortal,
  startCheckout,
  type BillingActionResult,
  type BillingOwner,
  type BillingStatus,
  type ProductKey,
} from '../lib/billingApi';

/** Estado de pagos del usuario con sesión (null sin sesión, con `enabled` false o si falla). */
export function useBillingStatus(enabled = true, companyId?: string | null) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loaded, setLoaded] = useState(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);

  const load = useCallback(async (fresh: boolean) => {
    if (!userId || !enabled) {
      setStatus(null);
      setLoaded(true);
      return;
    }
    if (fresh) invalidateBillingStatus();
    const next = await getBillingStatus(userId, companyId);
    if (!alive.current) return;
    setStatus(next);
    setLoaded(true);
  }, [userId, enabled, companyId]);

  useEffect(() => {
    void load(false);
  }, [load]);

  const refresh = useCallback(() => load(true), [load]);
  return { status, loaded, refresh };
}

/** Checkout y portal con los avisos de cada caso. `busy` = clave en curso ('portal' para el portal). */
export function useBillingActions() {
  const toast = useToastContext();
  const t = useTranslations().payments;
  const { lang } = useLanguage();
  const { openModal } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState<string | null>(null);

  const notify = useCallback((res: BillingActionResult, isPortal: boolean) => {
    switch (res.kind) {
      case 'not_configured': toast.info(t.comingSoon); break;
      case 'company_required': toast.info(t.companyRequired); navigate('/company/register'); break;
      case 'company_role_required': toast.error(t.companyRoleRequired); break;
      case 'company_inactive': toast.error(t.companyInactive); break;
      case 'no_billing_account': toast.info(t.noBillingAccount); break;
      case 'unauthorized': openModal('login'); break;
      case 'rate_limited': toast.error(t.rateLimited); break;
      default: toast.error(isPortal ? t.portalError : t.genericError);
    }
  }, [toast, t, navigate, openModal]);

  const portal = useCallback(async (owner: BillingOwner, companyId?: string | null) => {
    setBusy('portal');
    const res = await openBillingPortal(owner, { companyId, returnPath: location.pathname, lang });
    if (res.kind === 'redirect') {
      window.location.assign(res.url);
      return;
    }
    setBusy(null);
    notify(res, true);
  }, [location.pathname, lang, notify]);

  const checkout = useCallback(async (product: ProductKey, owner: BillingOwner, companyId?: string | null) => {
    setBusy(product);
    const res = await startCheckout(product, { companyId, returnPath: location.pathname, lang });
    if (res.kind === 'redirect') {
      window.location.assign(res.url);
      return;
    }
    setBusy(null);
    if (res.kind === 'already_subscribed') {
      toast.info(t.alreadySubscribed);
      await portal(owner, companyId);
      return;
    }
    notify(res, false);
  }, [location.pathname, lang, notify, portal, toast, t]);

  return { busy, checkout, portal };
}

/**
 * Vuelta de Stripe Checkout: ?checkout=ok|cancel. Enseña el aviso, quita el
 * parámetro de la URL y llama a `onReturn` (p. ej. para recargar el plan).
 */
export function useCheckoutReturn(onReturn?: (result: 'ok' | 'cancel') => void, kind: 'plan' | 'credits' = 'plan') {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToastContext();
  const t = useTranslations().payments;
  // Refs: el contexto de avisos cambia de identidad con cada aviso y no debe
  // volver a disparar el efecto.
  const deps = useRef({ onReturn, toast, t, kind });
  deps.current = { onReturn, toast, t, kind };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const result = params.get('checkout');
    if (result !== 'ok' && result !== 'cancel') return;
    params.delete('checkout');
    const search = params.toString();
    navigate({ pathname: location.pathname, search: search ? `?${search}` : '', hash: location.hash }, { replace: true });
    invalidateBillingStatus();
    const d = deps.current;
    if (result === 'ok') d.toast.success(d.kind === 'credits' ? d.t.creditsSuccess : d.t.checkoutSuccess, 7000);
    else d.toast.info(d.t.checkoutCancel);
    d.onReturn?.(result);
  }, [location.search, location.pathname, location.hash, navigate]);
}

/**
 * Enlace del correo de fin de prueba (?billing=manage): con sesión abre el portal;
 * sin sesión, el acceso (y vuelve aquí al entrar). Espera a que se resuelva la sesión.
 */
export function useManageBillingLink(onManage: () => void) {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, loading, openModal } = useAuth();
  const deps = useRef({ onManage, openModal });
  deps.current = { onManage, openModal };

  useEffect(() => {
    if (loading) return;
    const params = new URLSearchParams(location.search);
    if (params.get('billing') !== 'manage') return;
    if (!session) {
      // Tras iniciar sesión, /dashboard devuelve aquí (PostLoginReturn) y se abre el portal.
      setPostLoginReturn(`${location.pathname}${location.search}`);
      deps.current.openModal('login');
      return;
    }
    params.delete('billing');
    const search = params.toString();
    navigate({ pathname: location.pathname, search: search ? `?${search}` : '', hash: location.hash }, { replace: true });
    deps.current.onManage();
  }, [loading, session, location.search, location.pathname, location.hash, navigate]);
}
