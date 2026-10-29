import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslations } from '../hooks/useTranslations';
import LoadingSpinner from './shared/LoadingSpinner';
import LegalGate from './legal/LegalGate';

const ProtectedRoute: React.FC = () => {
  const { session, loading, profile, profileLoading } = useAuth();
  const location = useLocation();
  const t = useTranslations();

  if (loading) {
    return <LoadingSpinner message={t.loadingMessages.verifyingSession} size="medium" />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Las rutas protegidas de aquí son el área personal (/dashboard y subrutas: visas,
  // mensajes...). El admin no la usa: va a su panel. Se espera al perfil antes de
  // montar la página: DashboardPage reescribe history.state al montarse y, si el admin
  // llegaba a montarla, la redirección a /admin se perdía (pantalla en blanco en
  // /dashboard tras iniciar sesión en producción).
  if (profileLoading && !profile) {
    return <LoadingSpinner message={t.loadingMessages.verifyingSession} size="medium" />;
  }

  if (profile?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  // Bolsa de empleo, fase 1 (#6): hasta aceptar las condiciones vigentes (candidato +
  // privacidad) no se usa el área personal. Ver components/legal/LegalGate.tsx.
  return (
    <LegalGate scope="candidato">
      <Outlet />
    </LegalGate>
  );
};

export default ProtectedRoute;

