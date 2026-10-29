import React from 'react';
import MagicLinkForm from '../../components/auth/MagicLinkForm';
import SEOHead from '../../components/shared/SEOHead';
import { useLanguage } from '../../contexts/LanguageContext';

const MagicLinkPage: React.FC = () => {
  const es = useLanguage().lang === 'es';
  return (
    <>
      <SEOHead
        title={es ? 'Acceso con enlace mágico - YourCVPassport' : 'Magic Link Login - YourCVPassport'}
        description={es ? 'Inicia sesión con un enlace enviado a tu correo' : 'Sign in with a magic link sent to your email'}
      />
      <div className="min-h-screen bg-gradient-to-br from-cv-blue/5 via-white to-cv-blue/5 dark:from-dark-bg dark:via-dark-bg dark:to-dark-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <MagicLinkForm />
      </div>
    </>
  );
};

export default MagicLinkPage;
