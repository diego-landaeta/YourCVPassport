import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { useLanguage } from '../contexts/LanguageContext';

const ProtectedRoute: React.FC = () => {
  const { session, loading } = useAuth();
  const location = useLocation();
  const { lang } = useLanguage();

  console.log('[ProtectedRoute]', location.pathname, '- loading:', loading, '- session:', session ? 'exists' : 'null');

  if (loading) {
    console.log('[ProtectedRoute] Still loading, showing spinner');
    const message = lang === 'es' ? 'Verificando sesión...' : 'Verifying session...';
    return <LoadingSpinner message={message} size="medium" />;
  }

  if (!session) {
    console.log('[ProtectedRoute] No session, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  console.log('[ProtectedRoute] Session valid, rendering protected content');
  return <Outlet />;
};

export default ProtectedRoute;
