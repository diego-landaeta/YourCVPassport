import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute: React.FC = () => {
  const { session, loading } = useAuth();
  const location = useLocation();

  // Get saved language from localStorage for loading message
  const lang = (localStorage.getItem('language') === 'es') ? 'es' : 'en';

  if (loading) {
    const message = lang === 'es' ? 'Verificando sesión...' : 'Verifying session...';
    return <LoadingSpinner message={message} size="medium" />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;

