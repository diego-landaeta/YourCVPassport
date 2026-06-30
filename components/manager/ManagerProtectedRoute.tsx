import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../shared/LoadingSpinner';

// Sólo deja pasar a usuarios con role='profile_manager'.
// Los admin de plataforma también pueden entrar (super-conjunto de permisos).
const ManagerProtectedRoute: React.FC = () => {
  const { session, loading, profile, profileLoading } = useAuth();

  if (loading || profileLoading) {
    return <LoadingSpinner message="Verificando permisos..." size="large" />;
  }

  const role = profile?.role;
  if (!session || (role !== 'profile_manager' && role !== 'admin')) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ManagerProtectedRoute;
