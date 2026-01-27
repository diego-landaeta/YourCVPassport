import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const AdminProtectedRoute: React.FC = () => {
  const { session, loading, profile, profileLoading } = useAuth();
  const location = useLocation();

  // Get saved language from localStorage for loading message
  const lang = (localStorage.getItem('language') === 'es') ? 'es' : 'en';

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
