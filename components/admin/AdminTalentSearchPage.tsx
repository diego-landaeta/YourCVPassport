import React from 'react';
import CompanyTalentSearchPage from '../talent-search/CompanyTalentSearchPage';

/**
 * Admin Talent Search Page
 *
 * This is a simple wrapper around CompanyTalentSearchPage that enables admin mode.
 * In admin mode:
 * - Credits are not consumed when viewing profiles
 * - Admin controls are shown
 * - All search functionality works the same as company search
 */
const AdminTalentSearchPage: React.FC = () => {
  return (
    <CompanyTalentSearchPage
      adminMode={true}
      showAdminControls={true}
    />
  );
};

export default AdminTalentSearchPage;
