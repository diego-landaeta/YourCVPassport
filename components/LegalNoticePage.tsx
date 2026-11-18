import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import SeoLinks from './shared/SeoLinks';
import { useLanguage } from '../contexts/LanguageContext';
import { LEGAL_ENTITY as E } from '../lib/legalDrafts';

// Aviso legal (artículo 10 de la LSSI). /aviso-legal y /legal-notice (issue #10).
// Página informativa: no requiere aceptación, por eso es estática como la de cookies
// y no vive en documentos_legales. Datos del titular: LEGAL_ENTITY (lo vacío no se
// muestra).

const NOTICE_LAST_UPDATED = '2026-11-04';

interface Section { heading: string; paragraphs: string[]; links?: boolean }

const CONTENT = {
  es: {
    title: 'Aviso legal',
    metaDescription: 'Quién es el titular de YourCVPassport, condiciones de uso de la web, propiedad intelectual y responsabilidad.',
    lastUpdated: 'Última actualización',
    date: '4 de noviembre de 2026',
    intro: 'En cumplimiento del artículo 10 de la Ley 34/2002, de servicios de la sociedad de la información y de comercio electrónico (LSSI), te informamos de quién está detrás de YourCVPassport y de las condiciones generales de uso de esta web.',
    ownerTitle: '1. Titular de la web',
    owner: [
      ['Titular', E.name],
      ['NIF', E.taxId],
      ['Domicilio', E.address.es],
      ['Datos registrales', E.registry.es],
      ['Correo de contacto', E.email],
      ['Web', 'yourcvpassport.com'],
    ] as [string, string][],
    sections: [
      { heading: '2. Objeto', paragraphs: [
        'YourCVPassport es una plataforma para crear el CV como pasaporte profesional y una bolsa de empleo en la que empresas verificadas publican ofertas y los candidatos se inscriben con su perfil.',
        'Navegar por la web implica aceptar este aviso legal. Registrarse como candidato o como empresa, o publicar ofertas, supone además aceptar sus condiciones específicas, que se muestran y se guardan en el momento del registro.',
      ] },
      { heading: '3. Uso de la web', paragraphs: [
        'Te comprometes a usar la web de forma lícita y de buena fe: sin dañar su funcionamiento, sin intentar acceder a zonas o datos ajenos, sin extraer contenidos de forma automatizada y sin publicar contenidos ilícitos, falsos o que vulneren derechos de otras personas.',
      ] },
      { heading: '4. Propiedad intelectual e industrial', paragraphs: [
        `La marca YourCVPassport, el diseño de la web, las plantillas, los textos propios y el software pertenecen a ${E.name} o a sus licenciantes. No se permite reproducirlos, distribuirlos ni transformarlos sin autorización, salvo el uso de las plantillas para crear tu propio CV.`,
        'Los CV, las fotos y los textos que publican los usuarios son de sus autores, que responden de tener derecho a publicarlos.',
      ] },
      { heading: '5. Contenido de usuarios y empresas', paragraphs: [
        'Los CV los escriben sus titulares y las ofertas las publican las empresas. Revisamos las empresas y las ofertas antes de publicarlas, pero no podemos garantizar la exactitud de todo lo que publican terceros.',
        'Si ves un contenido ilícito, falso o que vulnera tus derechos, escríbenos a support@yourcvpassport.com: lo revisaremos y, si procede, lo retiraremos con rapidez.',
      ] },
      { heading: '6. Enlaces a otras webs', paragraphs: [
        'La web puede enlazar a webs de terceros (por ejemplo, las de las empresas o los enlaces que los candidatos ponen en su CV). No controlamos su contenido ni respondemos de él.',
      ] },
      { heading: '7. Disponibilidad y responsabilidad', paragraphs: [
        'Ponemos los medios razonables para que la web funcione sin interrupciones y sin errores, pero puede haber paradas por mantenimiento o por causas ajenas. No respondemos de los daños derivados de un uso de la web contrario a este aviso.',
      ] },
      { heading: '8. Protección de datos y cookies', links: true, paragraphs: [
        'Cómo tratamos los datos personales y qué guardamos en tu navegador se explica en estas páginas:',
      ] },
      { heading: '9. Ley aplicable', paragraphs: [
        'Este aviso legal se rige por la ley española. Si eres consumidor, puedes acudir a los tribunales de tu domicilio; en los demás casos, a los del domicilio del titular.',
      ] },
    ] as Section[],
    links: { privacy: ['/privacidad', 'Política de privacidad'], terms: ['/terminos', 'Condiciones de uso para candidatos y empresas'], cookies: ['/politica-de-cookies', 'Política de cookies'] },
  },
  en: {
    title: 'Legal notice',
    metaDescription: 'Who owns YourCVPassport, terms of use of the website, intellectual property and liability.',
    lastUpdated: 'Last updated',
    date: 'November 4, 2026',
    intro: 'In compliance with article 10 of Spanish Law 34/2002 on information society services and e-commerce (LSSI), we tell you who is behind YourCVPassport and the general terms of use of this website.',
    ownerTitle: '1. Website owner',
    owner: [
      ['Owner', E.name],
      ['Tax ID', E.taxId],
      ['Registered address', E.address.en],
      ['Registration details', E.registry.en],
      ['Contact email', E.email],
      ['Website', 'yourcvpassport.com'],
    ] as [string, string][],
    sections: [
      { heading: '2. Purpose', paragraphs: [
        'YourCVPassport is a platform to build your CV as a professional passport and a job board where verified companies publish offers and candidates apply with their profile.',
        'Browsing the website means accepting this legal notice. Signing up as a candidate or as a company, or publishing job offers, also means accepting their specific terms, which are shown and recorded at sign-up.',
      ] },
      { heading: '3. Use of the website', paragraphs: [
        'You undertake to use the website lawfully and in good faith: without harming its operation, without trying to access other people\'s areas or data, without extracting content automatically and without posting unlawful or false content or content that infringes the rights of others.',
      ] },
      { heading: '4. Intellectual and industrial property', paragraphs: [
        `The YourCVPassport brand, the website design, the templates, our own texts and the software belong to ${E.name} or its licensors. They may not be reproduced, distributed or transformed without authorisation, except for using the templates to create your own CV.`,
        'The CVs, photos and texts that users publish belong to their authors, who are responsible for having the right to publish them.',
      ] },
      { heading: '5. User and company content', paragraphs: [
        'CVs are written by their owners and job offers are published by companies. We review companies and offers before publishing them, but we cannot guarantee the accuracy of everything that third parties publish.',
        'If you see content that is unlawful, false or infringes your rights, write to support@yourcvpassport.com: we will review it and, where appropriate, remove it promptly.',
      ] },
      { heading: '6. Links to other websites', paragraphs: [
        'The website may link to third-party websites (for example, company websites or the links candidates add to their CV). We do not control their content and are not responsible for it.',
      ] },
      { heading: '7. Availability and liability', paragraphs: [
        'We take reasonable steps for the website to work without interruptions or errors, but there may be downtime for maintenance or for reasons beyond our control. We are not liable for damage arising from use of the website contrary to this notice.',
      ] },
      { heading: '8. Data protection and cookies', links: true, paragraphs: [
        'How we process personal data and what we store in your browser is explained on these pages:',
      ] },
      { heading: '9. Applicable law', paragraphs: [
        'This legal notice is governed by Spanish law. If you are a consumer, you may go to the courts of your place of residence; otherwise, to the courts of the place where the owner is domiciled.',
      ] },
    ] as Section[],
    links: { privacy: ['/privacy', 'Privacy Policy'], terms: ['/terms', 'Terms of use for candidates and companies'], cookies: ['/cookie-policy', 'Cookie Policy'] },
  },
};

const LegalNoticePage: React.FC = () => {
  const { lang } = useLanguage();
  const c = CONTENT[lang] ?? CONTENT.en;
  const h2 = 'mb-3 mt-9 text-xl font-semibold tracking-tight text-slate-900 dark:text-white';
  const link = 'rounded font-medium text-cv-blue underline underline-offset-2 hover:text-cv-blue-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 dark:text-cv-blue-light dark:hover:text-white dark:focus-visible:ring-offset-dark-bg-primary';

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <SeoLinks />
      <Helmet>
        <title>{`${c.title} | YourCVPassport`}</title>
        <meta name="description" content={c.metaDescription} />
      </Helmet>

      <h1 className="text-balance text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">{c.title}</h1>
      <p className="mt-5 border-b border-slate-200 pb-6 text-sm text-slate-600 dark:border-dark-border dark:text-dark-text-secondary">
        {c.lastUpdated}: <time dateTime={NOTICE_LAST_UPDATED}>{c.date}</time>
      </p>

      <div className="mt-6 max-w-[68ch] text-[15px] leading-7 text-slate-700 dark:text-slate-300">
        <p>{c.intro}</p>

        <h2 className={h2}>{c.ownerTitle}</h2>
        <dl className="divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-dark-border dark:border-dark-border">
          {c.owner.filter(([, v]) => v).map(([k, v]) => (
            <div key={k} className="grid gap-1 px-4 py-3 sm:grid-cols-[11rem_1fr] sm:gap-4">
              <dt className="text-sm font-medium text-slate-600 dark:text-dark-text-secondary">{k}</dt>
              <dd className="m-0 break-words text-slate-900 dark:text-dark-text-primary">
                {v === E.email ? <a href={`mailto:${E.email}`} className={link}>{v}</a> : v}
              </dd>
            </div>
          ))}
        </dl>

        {c.sections.map((s) => (
          <section key={s.heading}>
            <h2 className={h2}>{s.heading}</h2>
            {s.paragraphs.map((p) => <p key={p} className="mb-3.5">{p}</p>)}
            {s.links && (
              <ul className="mb-3.5 list-disc space-y-1.5 pl-6">
                {Object.values(c.links).map(([to, label]) => (
                  <li key={to}><Link to={to} className={link}>{label}</Link></li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
};

export default LegalNoticePage;
