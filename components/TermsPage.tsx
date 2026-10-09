import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../contexts/LanguageContext';

// Fecha del último cambio real del texto legal (términos y privacidad).
// Actualízala solo cuando cambie el contenido de TermsPage o PrivacyPage.
export const LEGAL_LAST_UPDATED = '2026-10-05';

/** Formatea LEGAL_LAST_UPDATED según el idioma (en UTC para que no cambie de día por zona horaria). */
export const formatLegalDate = (lang: 'en' | 'es'): string =>
  new Intl.DateTimeFormat(lang === 'es' ? 'es-ES' : 'en-US', { dateStyle: 'long', timeZone: 'UTC' })
    .format(new Date(`${LEGAL_LAST_UPDATED}T00:00:00Z`));

// Textos por idioma (la ruta /terminos es la version en espanol de /terms).
const CONTENT = {
  en: {
    title: 'Terms and Conditions',
    metaDescription: 'Terms and Conditions for YourCVPassport',
    lastUpdated: 'Last updated',
    intro: 'Welcome to YourCVPassport. Please read these terms and conditions carefully before using our service.',
    sections: [
      { heading: '1. Acceptance of Terms', body: 'By accessing or using our service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the service.' },
      { heading: '2. Accounts', body: 'When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.' },
      { heading: '3. Intellectual Property', body: 'The Service and its original content, features, and functionality are and will remain the exclusive property of YourCVPassport and its licensors.' },
      { heading: '4. Termination', body: 'We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.' },
    ],
  },
  es: {
    title: 'Términos y condiciones',
    metaDescription: 'Términos y condiciones de YourCVPassport',
    lastUpdated: 'Última actualización',
    intro: 'Bienvenido a YourCVPassport. Lee atentamente estos términos y condiciones antes de usar nuestro servicio.',
    sections: [
      { heading: '1. Aceptación de los términos', body: 'Al acceder o utilizar nuestro servicio, aceptas quedar vinculado por estos Términos. Si no estás de acuerdo con alguna parte de los términos, no podrás acceder al servicio.' },
      { heading: '2. Cuentas', body: 'Al crear una cuenta con nosotros, debes proporcionarnos información precisa, completa y actualizada en todo momento. No hacerlo constituye un incumplimiento de los Términos, que puede dar lugar a la cancelación inmediata de tu cuenta en nuestro Servicio.' },
      { heading: '3. Propiedad intelectual', body: 'El Servicio y su contenido original, características y funcionalidades son y seguirán siendo propiedad exclusiva de YourCVPassport y de sus licenciantes.' },
      { heading: '4. Terminación', body: 'Podemos cancelar o suspender el acceso a nuestro Servicio de forma inmediata, sin previo aviso ni responsabilidad, por cualquier motivo, incluido, entre otros, el incumplimiento de los Términos.' },
    ],
  },
} as const;

const TermsPage: React.FC = () => {
  const { lang } = useLanguage();
  const c = CONTENT[lang] ?? CONTENT.en;
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Helmet>
        <title>{`${c.title} | YourCVPassport`}</title>
        <meta name="description" content={c.metaDescription} />
      </Helmet>
      <h1 className="text-3xl font-bold mb-6">{c.title}</h1>
      <div className="prose prose-lg dark:prose-invert">
        <p className="mb-4">{c.lastUpdated}: <time dateTime={LEGAL_LAST_UPDATED}>{formatLegalDate(lang)}</time></p>

        <section className="mb-6">
          <p className="mb-4">{c.intro}</p>
        </section>

        {c.sections.map(section => (
          <section key={section.heading} className="mb-6">
            <h2 className="text-2xl font-semibold mb-3">{section.heading}</h2>
            <p className="mb-4">{section.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
};

export default TermsPage;
