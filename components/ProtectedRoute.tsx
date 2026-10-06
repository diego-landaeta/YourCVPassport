import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslations } from '../hooks/useTranslations';
import LoadingSpinner from './shared/LoadingSpinner';

const ProtectedRoute: React.FC = () => {
  const { session, loading, profile } = useAuth();
  const location = useLocation();
  const t = useTranslations();

  if (loading) {
    return <LoadingSpinner message={t.loadingMessages.verifyingSession} size="medium" />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Las rutas protegidas de aquí son el área personal (/dashboard y subrutas: visas,
  // mensajes...). El admin no la usa: va a su panel. Mientras el perfil carga no se
  // espera aquí (cada página gestiona su carga, p. ej. DashboardPage con su spinner),
  // así el resto de roles se comporta igual que antes.
  if (profile?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;

