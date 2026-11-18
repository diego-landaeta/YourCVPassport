import React from 'react';
import { Link } from 'react-router-dom';
import { BriefcaseIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { BTN_PRIMARY, TEXT_META, TEXT_STRONG } from '../../jobs/PanelBits';
import { usePanelText } from '../../jobs/textosPanel';
import { isKnownCountry } from '../../../lib/jobsCatalog';
import { jobsCountryPath, jobsRootPath } from '../../../lib/jobsFormat';

interface AllJobsTabProps {
  profileId?: string;
}

/**
 * «Todas las ofertas». El buscador propio del panel se ha retirado: el listado publico
 * (/empleos, /jobs, /:pais/empleos) es el unico buscador de ofertas y ya trae filtros,
 * paginacion y «Ya inscrito». Esta pestana solo lleva alli, con el pais del perfil.
 */
const AllJobsTab: React.FC<AllJobsTabProps> = () => {
  const tx = usePanelText();
  const { lang } = useLanguage();
  const { profile } = useAuth();
  const country = profile?.country_code && isKnownCountry(profile.country_code) ? profile.country_code : null;
  const to = country ? jobsCountryPath(country, lang) : jobsRootPath(lang);

  return (
    <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-14 text-center dark:border-dark-border-light">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-cv-blue dark:bg-cv-blue/15 dark:text-cv-blue-light">
        <BriefcaseIcon className="h-6 w-6" aria-hidden="true" />
      </span>
      <h2 className={`mt-4 text-lg font-semibold ${TEXT_STRONG}`}>{tx.allTitle}</h2>
      <p className={`mx-auto mt-1.5 max-w-xl text-[15px] leading-relaxed ${TEXT_META}`}>{tx.allText}</p>
      <Link to={to} className={`${BTN_PRIMARY} mt-6`}>
        {tx.allButton}
      </Link>
    </div>
  );
};

export default AllJobsTab;
