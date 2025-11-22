import React from 'react';
import Hero from './Hero';
import Companies from './Companies';
import Features from './Features';
import HowItWorks from './HowItWorks';
import Testimonials from './Testimonials';
import Pricing from './Pricing';
import Security from './Security';
import Faq from './Faq';
import CallToAction from './CallToAction';
import PageSEO from './PageSEO';
import { useLanguage } from '../contexts/LanguageContext';

const HomePage: React.FC = () => {
  const { lang } = useLanguage();

  const seoTitle = lang === 'es'
    ? 'CV Profesional Verificado'
    : 'Verified Professional CV';

  const seoDescription = lang === 'es'
    ? 'Crea tu CV profesional verificado que los reclutadores confían. Optimización IA, compatible con ATS, visibilidad global. Únete a más de 10,000 profesionales con YourCVPassport.'
    : 'Create your verified professional CV that recruiters trust. AI optimization, ATS-compatible, global visibility. Join over 10,000 professionals with YourCVPassport.';

  return (
    <>
      <PageSEO
        title={seoTitle}
        description={seoDescription}
        lang={lang}
      />
      <Hero />
      <Companies />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <Security />
      <Faq />
      <CallToAction />
    </>
  );
};

export default HomePage;