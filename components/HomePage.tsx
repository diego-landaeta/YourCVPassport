import React from 'react';
import Hero from './landing/Hero';
import Companies from './landing/Companies';
import Features from './landing/Features';
import HowItWorks from './landing/HowItWorks';
import Testimonials from './landing/Testimonials';
import Pricing from './landing/Pricing';
import Security from './landing/Security';
import Faq from './landing/Faq';
import CallToAction from './landing/CallToAction';
import PageSEO from './shared/PageSEO';
import InlineCTA from './landing/InlineCTA';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslations } from '../hooks/useTranslations';

// SEO de la home: la misma URL sirve ambos idiomas, asi que no lleva hreflang.
const HOME_SEO = {
  es: {
    title: 'Plataforma de CV profesional con verificación',
    description: 'Crea, verifica y comparte tu CV profesional. Editor con IA, más de 20 plantillas, exportación compatible con ATS y sellos de verificación digital.',
    keywords: 'CV, currículum, perfil profesional, CV verificado, crear CV, CV ATS',
  },
  en: {
    title: 'Professional CV Platform with Verification',
    description: 'Create, verify, and share your professional CV. AI-powered builder, 20+ templates, ATS export, and digital verification stamps.',
    keywords: 'CV, resume, professional profile, verified CV, CV builder, ATS resume',
  },
} as const;

const HomePage: React.FC = () => {
  const { lang } = useLanguage();
  const t = useTranslations();
  const hp = t.homePage;

  return (
    <>
      <PageSEO
        title={HOME_SEO[lang].title}
        description={HOME_SEO[lang].description}
        keywords={HOME_SEO[lang].keywords}
        lang={lang}
        canonical="https://yourcvpassport.com/"
      />
      <Hero />
      <Features />
      <InlineCTA
        title={hp.inlineCta1.title}
        description={hp.inlineCta1.description}
        buttonText={hp.inlineCta1.button}
        variant="gradient"
      />
      <HowItWorks />
      <Testimonials />
      <InlineCTA
        title={hp.inlineCta2.title}
        description={hp.inlineCta2.description}
        buttonText={hp.inlineCta2.button}
        variant="light"
      />
      <Pricing />
      <Security />
      <Faq />
      <CallToAction />
    </>
  );
};

export default HomePage;
