import React from 'react';
import { useLocation } from 'react-router-dom';
import AuthScreen from '../../components/auth/AuthScreen';
import SEOHead from '../../components/SEOHead';

const AuthPage: React.FC = () => {
  const location = useLocation();
  const isSignup = location.pathname === '/signup';

  return (
    <>
      <SEOHead
        title={isSignup ? "Sign Up - Create Your Professional CV | YourCVPassport" : "Sign In - Access Your Account | YourCVPassport"}
        description={
          isSignup
            ? "Create your free YourCVPassport account and start building your professional CV. Join thousands of professionals worldwide."
            : "Sign in to your YourCVPassport account to manage your professional CV, apply for jobs, and track your applications."
        }
        keywords={
          isSignup
            ? "sign up, create account, register, professional CV, resume builder, career profile"
            : "sign in, login, access account, professional CV, resume, career profile"
        }
      />
      <AuthScreen />
    </>
  );
};

export default AuthPage;
