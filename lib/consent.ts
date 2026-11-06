// Consentimiento de cookies (RGPD / LSSI, issue #11 YCV-001).
//
// Qué guarda la web hoy (ver /politica-de-cookies):
//   - Necesarias (siempre): sesión de Supabase, idioma, tema, caché de traducciones,
//     borradores del asistente y esta misma decisión. No requieren consentimiento.
//   - Analítica (opcional): estadísticas propias de visitas a los CV públicos
//     (hooks/useAnalytics.ts). Con consentimiento se guarda un identificador de
//     visitante (`visitor_id`) para contar visitantes únicos y no repetir visitas en
//     24 h; sin él, la visita se cuenta sin guardar nada en el dispositivo.
//   - Contenido de terceros (opcional): el widget de reseñas de Opynio
//     (web.opynio.com), que se carga desde otro dominio. No se carga hasta que el
//     visitante lo acepta (hooks/useOpynioWidget.ts).
// No hay publicidad ni analítica de terceros. Aun así se informa a Google Consent
// Mode v2 (todo denegado por defecto en index.html), para que cualquier etiqueta
// que se añada en el futuro respete la decisión sin más cambios.
//
// La decisión se guarda en localStorage (`ycp_cookie_consent`) con versión: si
// cambian las categorías, se sube CONSENT_VERSION y se vuelve a preguntar.

export const CONSENT_STORAGE_KEY = 'ycp_cookie_consent';
export const CONSENT_VERSION = 1;
/** Evento de ventana al cambiar la decisión (detail: ConsentState). */
export const CONSENT_CHANGE_EVENT = 'ycp-consent-change';
/** Evento de ventana para abrir la configuración (enlace «Configurar cookies»). */
export const CONSENT_OPEN_EVENT = 'ycp-consent-open';

export interface ConsentState {
  v: number;
  /** ISO 8601 de la decisión. */
  date: string;
  /** Estadísticas propias de visitas a los CV (identificador de visitante). */
  analytics: boolean;
  /** Widget de reseñas de Opynio y otro contenido incrustado de terceros. */
  thirdParty: boolean;
}

export function getConsent(): ConsentState | null {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    if (parsed?.v !== CONSENT_VERSION || typeof parsed.thirdParty !== 'boolean' || typeof parsed.analytics !== 'boolean') return null;
    return { v: CONSENT_VERSION, date: String(parsed.date ?? ''), analytics: parsed.analytics, thirdParty: parsed.thirdParty };
  } catch {
    return null;
  }
}

/** true si el visitante ha aceptado la analítica propia. */
export function hasAnalyticsConsent(): boolean {
  return getConsent()?.analytics === true;
}

/** true si el visitante ha aceptado el contenido de terceros. */
export function hasThirdPartyConsent(): boolean {
  return getConsent()?.thirdParty === true;
}

type Gtag = (...args: unknown[]) => void;

/** Traslada la decisión a Google Consent Mode v2 (si existe gtag; ver index.html). */
function updateConsentMode(state: ConsentState): void {
  const gtag = (window as unknown as { gtag?: Gtag }).gtag;
  if (typeof gtag !== 'function') return;
  // Sin publicidad en la web: siempre denegada. analytics_storage sigue a la
  // analítica y functionality_storage al contenido de terceros.
  gtag('consent', 'update', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: state.analytics ? 'granted' : 'denied',
    functionality_storage: state.thirdParty ? 'granted' : 'denied',
  });
}

export function setConsent(choice: { analytics: boolean; thirdParty: boolean }): ConsentState {
  const state: ConsentState = { v: CONSENT_VERSION, date: new Date().toISOString(), analytics: choice.analytics, thirdParty: choice.thirdParty };
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Sin almacenamiento (modo privado estricto): la decisión vale para esta visita.
  }
  if (!state.analytics) clearAnalyticsStorage();
  updateConsentMode(state);
  window.dispatchEvent(new CustomEvent<ConsentState>(CONSENT_CHANGE_EVENT, { detail: state }));
  return state;
}

/** Al rechazar la analítica se borran el identificador y las marcas de visita. */
function clearAnalyticsStorage(): void {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key === 'visitor_id' || key.startsWith('view_'))) localStorage.removeItem(key);
    }
  } catch {
    // Sin almacenamiento: no hay nada que borrar.
  }
}

/** Abre el panel de configuración (pie, política de cookies, aviso de reseñas). */
export function openCookieSettings(): void {
  window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));
}
