import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { useLanguage } from '../contexts/LanguageContext';

const AdminProtectedRoute: React.FC = () => {
  const { session, loading, profile, profileLoading } = useAuth();
  const location = useLocation();
  const { lang } = useLanguage();
  // Wait for BOTH session and profile to finish loading
  if (loading || profileLoading) {
    const message = lang === 'es' ? 'Verificando permisos de administrador...' : 'Verifying admin permissions...';
    return <LoadingSpinner message={message} size="large" />;
  }

  // Now check if user has session and admin role
  if (!session || profile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default AdminProtectedRoute;
