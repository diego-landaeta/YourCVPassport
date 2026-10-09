import React from 'react';
import { useLocation } from 'react-router-dom';
import AuthScreen from '../../components/auth/AuthScreen';
import SEOHead from '../../components/shared/SEOHead';
import { useLanguage } from '../../contexts/LanguageContext';

// SEO de /login y /signup (la misma URL sirve ambos idiomas): titulo en el idioma activo
const AUTH_SEO = {
  es: {
    signup: {
      title: 'Crear cuenta - Crea tu CV profesional | YourCVPassport',
      description: 'Crea gratis tu cuenta de YourCVPassport y empieza a construir tu CV profesional verificado.',
      keywords: 'registro, crear cuenta, CV profesional, crear CV, perfil profesional',
    },
    login: {
      title: 'Iniciar sesión - Accede a tu cuenta | YourCVPassport',
      description: 'Inicia sesión en YourCVPassport para gestionar tu CV profesional, postularte a ofertas y seguir tus candidaturas.',
      keywords: 'iniciar sesión, acceder, cuenta, CV profesional, perfil profesional',
    },
  },
  en: {
    signup: {
      title: 'Sign Up - Create Your Professional CV | YourCVPassport',
      description: 'Create your free YourCVPassport account and start building your professional CV. Join thousands of professionals worldwide.',
      keywords: 'sign up, create account, register, professional CV, resume builder, career profile',
    },
    login: {
      title: 'Sign In - Access Your Account | YourCVPassport',
      description: 'Sign in to your YourCVPassport account to manage your professional CV, apply for jobs, and track your applications.',
      keywords: 'sign in, login, access account, professional CV, resume, career profile',
    },
  },
} as const;

const AuthPage: React.FC = () => {
  const location = useLocation();
  const { lang } = useLanguage();
  const isSignup = location.pathname === '/signup';
  const seo = AUTH_SEO[lang][isSignup ? 'signup' : 'login'];

  return (
    <>
      <SEOHead title={seo.title} description={seo.description} keywords={seo.keywords} />
      <AuthScreen />
    </>
  );
};

export default AuthPage;
