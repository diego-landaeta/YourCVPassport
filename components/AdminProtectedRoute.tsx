import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslations } from '../hooks/useTranslations';
import LoadingSpinner from './shared/LoadingSpinner';

const AdminProtectedRoute: React.FC = () => {
  const { session, loading, profile, profileLoading } = useAuth();
  const location = useLocation();
  const t = useTranslations();

  // Wait for BOTH session and profile to finish loading
  if (loading || profileLoading) {
    return <LoadingSpinner message={t.loadingMessages.verifyingAdminPermissions} size="large" />;
  }

  // Now check if user has session and admin role
  if (!session || profile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default AdminProtectedRoute;
