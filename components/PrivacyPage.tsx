import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '../contexts/LanguageContext';
import { LEGAL_LAST_UPDATED, formatLegalDate } from './TermsPage';

// Textos por idioma (la ruta /privacidad es la version en espanol de /privacy).
const CONTENT = {
  en: {
    title: 'Privacy Policy',
    metaDescription: 'Privacy Policy for YourCVPassport',
    lastUpdated: 'Last updated',
    intro: "Your privacy is important to us. It is YourCVPassport's policy to respect your privacy regarding any information we may collect from you across our website.",
    sections: [
      { heading: '1. Information We Collect', body: "We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we're collecting it and how it will be used." },
      { heading: '2. How We Use Information', body: 'We use the information we collect to provide, operate, and maintain our website, improve, personalize, and expand our website, and understand and analyze how you use our website.' },
      { heading: '3. Log Data', body: 'We want to inform you that whenever you visit our Service, we collect information that your browser sends to us that is called Log Data. This Log Data may include information such as your computer\'s Internet Protocol ("IP") address, browser version, pages of our Service that you visit, the time and date of your visit, the time spent on those pages, and other statistics.' },
      { heading: '4. Cookies', body: 'Our website uses "cookies" to collect information and to improve our Service. You have the option to either accept or refuse these cookies, and know when a cookie is being sent to your computer.' },
    ],
  },
  es: {
    title: 'Política de privacidad',
    metaDescription: 'Política de privacidad de YourCVPassport',
    lastUpdated: 'Última actualización',
    intro: 'Tu privacidad es importante para nosotros. La política de YourCVPassport es respetar tu privacidad en relación con cualquier información que podamos recopilar de ti a través de nuestro sitio web.',
    sections: [
      { heading: '1. Información que recopilamos', body: 'Solo te pedimos información personal cuando realmente la necesitamos para prestarte un servicio. La recopilamos por medios justos y lícitos, con tu conocimiento y consentimiento. También te indicamos por qué la recopilamos y cómo se utilizará.' },
      { heading: '2. Cómo usamos la información', body: 'Usamos la información que recopilamos para proporcionar, operar y mantener nuestro sitio web; mejorarlo, personalizarlo y ampliarlo; y comprender y analizar cómo lo utilizas.' },
      { heading: '3. Datos de registro', body: 'Queremos informarte de que, siempre que visitas nuestro Servicio, recopilamos la información que tu navegador nos envía, denominada Datos de registro. Estos Datos de registro pueden incluir información como la dirección de Protocolo de Internet ("IP") de tu ordenador, la versión del navegador, las páginas de nuestro Servicio que visitas, la hora y la fecha de tu visita, el tiempo que pasas en esas páginas y otras estadísticas.' },
      { heading: '4. Cookies', body: 'Nuestro sitio web utiliza "cookies" para recopilar información y mejorar nuestro Servicio. Puedes aceptar o rechazar estas cookies y saber cuándo se envía una cookie a tu ordenador.' },
    ],
  },
} as const;

const PrivacyPage: React.FC = () => {
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

export default PrivacyPage;
