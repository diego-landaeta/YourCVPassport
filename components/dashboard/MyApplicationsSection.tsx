import React from 'react';
import { useTranslations } from '../../hooks/useTranslations';
import MyApplicationsTab from './opportunities/MyApplicationsTab';
import { H1_CLS, TEXT_META } from '../jobs/PanelBits';

interface MyApplicationsSectionProps {
  profileId: string;
}

/**
 * My Applications Section - seguimiento de candidaturas.
 * Los filtros por estado (con contador) y el buscador viven en MyApplicationsTab, para que esta
 * pantalla y la pestana «Mis candidaturas» del panel de oportunidades sean la misma.
 */
const MyApplicationsSection: React.FC<MyApplicationsSectionProps> = ({ profileId }) => {
  const t = useTranslations();

  return (
    <div className="space-y-6">
      <header>
        <h1 className={H1_CLS}>{t.dashboard.opportunities.myApplications}</h1>
        <p className={`mt-2 max-w-prose text-base ${TEXT_META}`}>{t.dashboard.opportunities.myApplicationsDescription}</p>
      </header>

      <MyApplicationsTab profileId={profileId} />
    </div>
  );
};

export default MyApplicationsSection;
