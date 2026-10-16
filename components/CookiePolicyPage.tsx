import React from 'react';
import { Helmet } from 'react-helmet-async';
import SeoLinks from './shared/SeoLinks';
import { useLanguage } from '../contexts/LanguageContext';
import { openCookieSettings } from '../lib/consent';

// Política de cookies (issue #11, YCV-001 y YCV-015). /politica-de-cookies y
// /cookie-policy. Recoge lo que la web guarda de verdad (revisado en el código el
// 15/10/2026): si se añade almacenamiento nuevo, hay que reflejarlo aquí y en
// lib/consent.ts. Pendiente de revisión legal (issue #10).

const POLICY_LAST_UPDATED = '2026-10-15';

type Row = [name: string, purpose: string, duration: string];

const CONTENT = {
  es: {
    title: 'Política de cookies',
    metaDescription: 'Qué guarda YourCVPassport en tu navegador, para qué y cómo cambiar tu decisión.',
    lastUpdated: 'Última actualización',
    date: '15 de octubre de 2026',
    intro: 'YourCVPassport no usa cookies de publicidad ni herramientas de analítica de terceros. Guardamos en tu navegador (almacenamiento local) lo imprescindible para que la web funcione y, solo si lo aceptas, un identificador para nuestras estadísticas de visitas y las reseñas de un servicio externo.',
    settingsButton: 'Configurar cookies',
    headers: ['Nombre', 'Para qué sirve', 'Duración'],
    necessaryTitle: '1. Necesarias (siempre activas)',
    necessaryText: 'Sin ellas la web no funciona. No necesitan tu consentimiento.',
    necessary: [
      ['yourcvpassport-auth', 'Mantener tu sesión iniciada', 'Hasta que cierres sesión'],
      ['language, theme', 'Recordar tu idioma y el tema claro u oscuro', 'Persistente'],
      ['ycp_cookie_consent', 'Guardar tu decisión sobre cookies', 'Hasta que la cambies'],
      ['yourcvpassport_translation_cache', 'Guardar traducciones ya hechas para no repetirlas', 'Persistente'],
      ['identity_draft, experience_draft, education_draft', 'Borradores del asistente de CV para no perder lo escrito', 'Hasta que guardes'],
      ['verification_state_*', 'Estado de una verificación de correo o teléfono en curso', 'Hasta terminarla'],
      ['sidebar-collapsed, profile_complete_card_dismissed, ycvp-push-prompt-dismissed', 'Preferencias de la interfaz', 'Persistente'],
    ] as Row[],
    analyticsTitle: '2. Analítica (opcional)',
    analyticsText: 'Estadísticas propias de visitas a los CV públicos, que ve el dueño de cada CV. No se comparten con terceros. Si no las aceptas, la visita se cuenta igualmente pero sin guardar nada en tu navegador.',
    analytics: [
      ['visitor_id', 'Identificador de visitante para contar visitantes únicos', 'Persistente, hasta que lo borres o rechaces la analítica'],
      ['view_<perfil>_<visitante>', 'No contar dos veces la misma visita en 24 horas', '24 horas'],
    ] as Row[],
    thirdTitle: '3. Contenido de terceros (opcional)',
    thirdText: 'Las reseñas de usuarios las muestra el widget de Opynio (web.opynio.com), que se carga desde su dominio y puede usar su propio almacenamiento. No se carga hasta que lo aceptas.',
    changeTitle: '4. Cambiar tu decisión',
    changeText: 'Puedes cambiarla cuando quieras con el botón «Configurar cookies» de esta página o del pie de la web. También puedes borrar el almacenamiento desde la configuración de tu navegador.',
    contactTitle: '5. Contacto',
    contactText: 'Para cualquier duda sobre esta política, escríbenos a support@yourcvpassport.com.',
  },
  en: {
    title: 'Cookie policy',
    metaDescription: 'What YourCVPassport stores in your browser, why, and how to change your choice.',
    lastUpdated: 'Last updated',
    date: 'October 15, 2026',
    intro: 'YourCVPassport does not use advertising cookies or third-party analytics tools. We store in your browser (local storage) what the site needs to work and, only if you accept, an identifier for our own visit statistics and the reviews from an external service.',
    settingsButton: 'Cookie settings',
    headers: ['Name', 'Purpose', 'Duration'],
    necessaryTitle: '1. Necessary (always on)',
    necessaryText: 'The site does not work without them. They do not require your consent.',
    necessary: [
      ['yourcvpassport-auth', 'Keep you signed in', 'Until you sign out'],
      ['language, theme', 'Remember your language and light or dark theme', 'Persistent'],
      ['ycp_cookie_consent', 'Store your cookie choice', 'Until you change it'],
      ['yourcvpassport_translation_cache', 'Store translations already made so they are not repeated', 'Persistent'],
      ['identity_draft, experience_draft, education_draft', 'CV wizard drafts so you do not lose your text', 'Until you save'],
      ['verification_state_*', 'State of an email or phone verification in progress', 'Until it is finished'],
      ['sidebar-collapsed, profile_complete_card_dismissed, ycvp-push-prompt-dismissed', 'Interface preferences', 'Persistent'],
    ] as Row[],
    analyticsTitle: '2. Analytics (optional)',
    analyticsText: 'Our own statistics of visits to public CVs, shown to each CV owner. Not shared with third parties. If you do not accept them, the visit is still counted but nothing is stored in your browser.',
    analytics: [
      ['visitor_id', 'Visitor identifier to count unique visitors', 'Persistent, until you delete it or reject analytics'],
      ['view_<profile>_<visitor>', 'Avoid counting the same visit twice within 24 hours', '24 hours'],
    ] as Row[],
    thirdTitle: '3. Third-party content (optional)',
    thirdText: 'User reviews are shown by the Opynio widget (web.opynio.com), which is loaded from its domain and may use its own storage. It is not loaded until you accept it.',
    changeTitle: '4. Changing your choice',
    changeText: 'You can change it at any time with the "Cookie settings" button on this page or in the site footer. You can also clear the storage from your browser settings.',
    contactTitle: '5. Contact',
    contactText: 'For any question about this policy, write to support@yourcvpassport.com.',
  },
};

const Table: React.FC<{ headers: string[]; rows: Row[] }> = ({ headers, rows }) => (
  <div className="overflow-x-auto my-4 rounded-lg border border-gray-200 dark:border-dark-border">
    <table className="w-full text-sm text-left">
      <thead className="bg-gray-50 dark:bg-dark-bg-tertiary text-gray-700 dark:text-dark-text-primary">
        <tr>{headers.map(h => <th key={h} scope="col" className="px-4 py-3 font-semibold">{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map(([name, purpose, duration]) => (
          <tr key={name} className="border-t border-gray-200 dark:border-dark-border">
            <td className="px-4 py-3 font-mono text-xs break-all text-gray-900 dark:text-dark-text-primary">{name}</td>
            <td className="px-4 py-3 text-gray-700 dark:text-dark-text-secondary">{purpose}</td>
            <td className="px-4 py-3 text-gray-700 dark:text-dark-text-secondary">{duration}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const CookiePolicyPage: React.FC = () => {
  const { lang } = useLanguage();
  const c = CONTENT[lang] ?? CONTENT.en;
  const h2 = 'text-2xl font-semibold mt-8 mb-3 text-gray-900 dark:text-dark-text-primary';
  const p = 'mb-4 text-gray-700 dark:text-dark-text-secondary';

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <SeoLinks />
      <Helmet>
        <title>{`${c.title} | YourCVPassport`}</title>
        <meta name="description" content={c.metaDescription} />
      </Helmet>
      <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-dark-text-primary">{c.title}</h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-dark-text-tertiary">
        {c.lastUpdated}: <time dateTime={POLICY_LAST_UPDATED}>{c.date}</time>
      </p>
      <p className={p}>{c.intro}</p>
      <button
        type="button"
        onClick={openCookieSettings}
        className="inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 rounded-lg bg-cv-blue text-white text-sm font-semibold hover:bg-cv-blue-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2"
      >
        {c.settingsButton}
      </button>

      <h2 className={h2}>{c.necessaryTitle}</h2>
      <p className={p}>{c.necessaryText}</p>
      <Table headers={c.headers} rows={c.necessary} />

      <h2 className={h2}>{c.analyticsTitle}</h2>
      <p className={p}>{c.analyticsText}</p>
      <Table headers={c.headers} rows={c.analytics} />

      <h2 className={h2}>{c.thirdTitle}</h2>
      <p className={p}>{c.thirdText}</p>

      <h2 className={h2}>{c.changeTitle}</h2>
      <p className={p}>{c.changeText}</p>

      <h2 className={h2}>{c.contactTitle}</h2>
      <p className={p}>{c.contactText}</p>
    </div>
  );
};

export default CookiePolicyPage;
