import { useEffect, useState } from 'react';
import { CONSENT_CHANGE_EVENT, getConsent, type ConsentState } from '../lib/consent';

/** Decisión de cookies actual (null si aún no ha decidido) y se actualiza al cambiar. */
export function useConsent(): ConsentState | null {
  const [consent, setConsentState] = useState<ConsentState | null>(() => getConsent());
  useEffect(() => {
    const onChange = (e: Event) => setConsentState((e as CustomEvent<ConsentState>).detail ?? getConsent());
    window.addEventListener(CONSENT_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_CHANGE_EVENT, onChange);
  }, []);
  return consent;
}
