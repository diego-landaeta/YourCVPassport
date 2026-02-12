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
        canonical="https://yourcvpassport.com/"
      />
      <Hero />
      <Features />
      <InlineCTA
        title={lang === 'es' ? '¿Listo para destacar?' : 'Ready to stand out?'}
        description={lang === 'es'
          ? 'Únete a miles de profesionales que ya crearon su perfil verificado y reciben oportunidades laborales cada semana.'
          : 'Join thousands of professionals who have already created their verified profile and receive job opportunities every week.'}
        buttonText={lang === 'es' ? 'Crear mi perfil gratis' : 'Create my free profile'}
        variant="gradient"
      />
      <HowItWorks />
      <Testimonials />
      <InlineCTA
        title={lang === 'es' ? 'Empieza hoy, gratis' : 'Start today, free'}
        description={lang === 'es'
          ? 'Crea tu perfil profesional en minutos. Sin tarjeta de crédito requerida.'
          : 'Create your professional profile in minutes. No credit card required.'}
        buttonText={lang === 'es' ? 'Registrarse ahora' : 'Sign up now'}
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