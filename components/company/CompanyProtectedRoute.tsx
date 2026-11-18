import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { ClockIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase/client';
import LoadingSpinner from '../shared/LoadingSpinner';
import type { Company, CompanyUser } from '../../types';
import { COMPANY_FULL_COLUMNS } from '../../lib/companyColumns';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslations } from '../../hooks/useTranslations';
import LegalGate from '../legal/LegalGate';
import { useCompanyRegText } from '../legal/companyRegText';

/**
 * Estado de publicación de la empresa, para las páginas bajo CompanyProtectedRoute.
 * Mientras la empresa está PENDING (revisión) se puede entrar y preparar borradores,
 * pero NO publicar: la página de ofertas debe usar `canPublish` para deshabilitar
 * «Publicar» (el servidor lo vuelve a exigir: submit_job_for_review pide APPROVED).
 */
export function useCompanyPublishState(): { canPublish: boolean; companyPending: boolean } {
  const ctx = useOutletContext<{ canPublish?: boolean; companyPending?: boolean } | undefined>();
  return { canPublish: ctx?.canPublish === true, companyPending: ctx?.companyPending === true };
}

const CompanyProtectedRoute: React.FC = () => {
  const { session, loading: authLoading, user } = useAuth();
  const { lang } = useLanguage();
  const translations = useTranslations();
  const location = useLocation();
  const navigate = useNavigate();
  const rx = useCompanyRegText();

  // Helper function to access translations
  const t = (key: string) => {
    const keys = key.split('.');
    let value: any = translations;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  const [companyLoading, setCompanyLoading] = useState(true);
  const [companyUser, setCompanyUser] = useState<CompanyUser | null>(null);
  const [company, setCompany] = useState<Company | null>(null);

  useEffect(() => {
    if (!authLoading && session && user) {
      fetchCompanyData();
    } else if (!authLoading && !session) {
      setCompanyLoading(false);
    }
  }, [authLoading, session, user]);

  const fetchCompanyData = async () => {
    if (!user?.id) {
      setCompanyLoading(false);
      return;
    }

    try {
      // Check if user is part of a company
      const { data: companyUserData, error: companyUserError } = await supabase
        .from('company_users')
        .select('*')
        .eq('user_id', user.id)
        // maybeSingle: un usuario sin empresa es lo normal, no un error (evita el 406)
        .maybeSingle();

      if (companyUserError || !companyUserData) {
        // User is not part of any company
        setCompanyUser(null);
        setCompany(null);
        setCompanyLoading(false);
        return;
      }

      setCompanyUser(companyUserData as CompanyUser);

      // Fetch company details (columnas privadas: vista companies_full, solo miembros/creador/admin)
      const { data: companyData, error: companyError } = await supabase
        .from('companies_full')
        .select(COMPANY_FULL_COLUMNS)
        .eq('id', companyUserData.company_id)
        .maybeSingle();

      if (companyError || !companyData) {
        setCompany(null);
        setCompanyLoading(false);
        return;
      }

      setCompany(companyData as Company);
    } catch (error) {
      console.error('Error fetching company data:', error);
      setCompanyUser(null);
      setCompany(null);
    } finally {
      setCompanyLoading(false);
    }
  };

  // Show loading spinner while checking auth and company status
  if (authLoading || companyLoading) {
    return (
      <LoadingSpinner
        message={t('company.verifying') || 'Verifying company access...'}
        size="large"
      />
    );
  }

  // Not authenticated - redirect to login
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is not part of any company - redirect to registration
  if (!companyUser || !company) {
    return <Navigate to="/company/register" replace />;
  }

  // Company is rejected
  if (company.status === 'REJECTED') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {t('company.rejected.title') || 'Application Not Approved'}
              </h2>
              <p className="text-gray-600 mb-6">
                {t('company.rejected.message') ||
                  'Unfortunately, your company registration was not approved.'}
              </p>
              {company.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left mb-6">
                  <h3 className="font-semibold text-red-900 mb-2">
                    {t('company.rejected.reasonTitle') || 'Reason:'}
                  </h3>
                  <p className="text-sm text-red-700">
                    {company.rejection_reason}
                  </p>
                </div>
              )}
              <p className="text-sm text-gray-600 mb-4">
                {t('company.rejected.contact') ||
                  'If you believe this is an error or would like to provide additional information, please contact our support team.'}
              </p>
              <div className="space-y-2">
                <button
                  onClick={() => window.location.href = 'mailto:support@yourcvpassport.com'}
                  className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {t('common.contactSupport') || 'Contact Support'}
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full text-blue-600 hover:text-blue-700 font-medium"
                >
                  {t('common.backToHome') || 'Back to Home'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Company is suspended
  if (company.status === 'SUSPENDED') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 mb-4">
                <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {t('company.suspended.title') || 'Account Suspended'}
              </h2>
              <p className="text-gray-600 mb-6">
                {t('company.suspended.message') ||
                  'Your company account has been temporarily suspended.'}
              </p>
              {company.admin_notes && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-left mb-6">
                  <p className="text-sm text-orange-700">
                    {company.admin_notes}
                  </p>
                </div>
              )}
              <p className="text-sm text-gray-600 mb-4">
                {t('company.suspended.contact') ||
                  'Please contact support to resolve this issue.'}
              </p>
              <button
                onClick={() => window.location.href = 'mailto:support@yourcvpassport.com'}
                className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {t('common.contactSupport') || 'Contact Support'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Company approved (publica) o pending (entra y prepara borradores, sin publicar).
  const companyPending = company.status === 'PENDING';
  return (
    <LegalGate scope="empleador" companyId={company.id}>
      {companyPending && (
        <div
          role="status"
          className="border-b border-amber-300 bg-amber-50 dark:border-amber-400/30 dark:bg-amber-500/10"
        >
          <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
            <ClockIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">{rx.pendingBannerTitle}</p>
              <p className="mt-0.5 max-w-[78ch] text-sm leading-relaxed text-amber-900 dark:text-amber-200">{rx.pendingBannerBody}</p>
            </div>
          </div>
        </div>
      )}
      <Outlet context={{ company, companyUser, canPublish: !companyPending, companyPending }} />
    </LegalGate>
  );
};

export default CompanyProtectedRoute;
