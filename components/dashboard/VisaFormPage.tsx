import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { isSectionLocked } from './dashboardNav';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import VisaForm from './VisaForm';

const VisaFormPage: React.FC = () => {
  const { profile } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Con el asistente sin terminar el menú bloquea este apartado; por URL tampoco se
  // entra (antes solo se bloqueaba ?seccion=, auditoría 15/10/2026).
  if (profile && isSectionLocked(profile, 'visas')) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          profile={profile}
          activeSection="visas"
          onSectionChange={() => {}}
        />
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <MobileNav
          profile={profile}
          activeSection="visas"
          onSectionChange={() => {}}
          isOpen={isMobileMenuOpen}
          onToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />
      </div>

      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen">
        <div className="px-4 pt-4 sm:px-6 sm:pt-6 lg:p-8 pb-24 lg:pb-8">
          <VisaForm />
        </div>
      </div>
    </div>
  );
};

export default VisaFormPage;
