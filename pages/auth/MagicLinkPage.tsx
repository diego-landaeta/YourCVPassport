import React from 'react';
import MagicLinkForm from '../../components/auth/MagicLinkForm';
import SEOHead from '../../components/shared/SEOHead';

const MagicLinkPage: React.FC = () => {
  return (
    <>
      <SEOHead
        title="Magic Link Login - YourCVPassport"
        description="Sign in with a magic link sent to your email"
      />
      <div className="min-h-screen bg-gradient-to-br from-cv-blue/5 via-white to-cv-blue/5 dark:from-dark-bg dark:via-dark-bg dark:to-dark-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <MagicLinkForm />
      </div>
    </>
  );
};

export default MagicLinkPage;
