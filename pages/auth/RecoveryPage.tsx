import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import PasswordRecoveryForm from '../../components/auth/PasswordRecoveryForm';
import SEOHead from '../../components/SEOHead';

const RecoveryPage: React.FC = () => {
  const location = useLocation();
  const [mode, setMode] = useState<'request' | 'reset'>('request');

  useEffect(() => {
    // Check if this is a password reset link (has access_token in URL)
    const params = new URLSearchParams(location.search);
    const hashParams = new URLSearchParams(location.hash.substring(1));

    if (params.get('type') === 'recovery' || hashParams.get('type') === 'recovery') {
      setMode('reset');
    }
  }, [location]);

  return (
    <>
      <SEOHead
        title={mode === 'reset' ? 'Reset Password - YourCVPassport' : 'Recover Password - YourCVPassport'}
        description={mode === 'reset' ? 'Set your new password' : 'Recover your YourCVPassport account password'}
      />
      <div className="min-h-screen bg-gradient-to-br from-cv-blue/5 via-white to-cv-blue/5 dark:from-dark-bg dark:via-dark-bg dark:to-dark-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <PasswordRecoveryForm mode={mode} />
      </div>
    </>
  );
};

export default RecoveryPage;
