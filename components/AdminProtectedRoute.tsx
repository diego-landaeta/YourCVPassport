import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { useLanguage } from '../contexts/LanguageContext';

const AdminProtectedRoute: React.FC = () => {
  const { session, loading, profile, profileLoading } = useAuth();
  const location = useLocation();
  const { lang } = useLanguage();

  console.log('[AdminProtectedRoute]', location.pathname, '- loading:', loading, '- profileLoading:', profileLoading, '- session:', session ? 'exists' : 'null', '- profile:', profile ? `role=${profile.role}` : 'null');

  // Wait for BOTH session and profile to finish loading
  if (loading || profileLoading) {
    console.log('[AdminProtectedRoute] Still loading, showing spinner');
    const message = lang === 'es' ? 'Verificando permisos de administrador...' : 'Verifying admin permissions...';
    return <LoadingSpinner message={message} size="large" />;
  }

  // Now check if user has session and admin role
  if (!session || profile?.role !== 'admin') {
    console.log('[AdminProtectedRoute] Not admin or no session, redirecting to home');
    return <Navigate to="/" replace />;
  }

  console.log('[AdminProtectedRoute] Admin access granted, rendering protected content');
  return <Outlet />;
};

export default AdminProtectedRoute;