import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase/client';
import LoadingSpinner from '../shared/LoadingSpinner';
import type { Company, CompanyUser } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslations } from '../../hooks/useTranslations';

const CompanyProtectedRoute: React.FC = () => {
  const { session, loading: authLoading, user } = useAuth();
  const { lang } = useLanguage();
  const translations = useTranslations();
  const location = useLocation();
  const navigate = useNavigate();

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
        .single();

      if (companyUserError || !companyUserData) {
        // User is not part of any company
        setCompanyUser(null);
        setCompany(null);
        setCompanyLoading(false);
        return;
      }

      setCompanyUser(companyUserData as CompanyUser);

      // Fetch company details
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyUserData.company_id)
        .single();

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

  // Company is pending approval
  if (company.status === 'PENDING') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {t('company.pendingApproval.title') || 'Application Under Review'}
              </h2>
              <p className="text-gray-600 mb-6">
                {t('company.pendingApproval.message') ||
                  'Your company registration is currently being reviewed by our team. We will notify you via email once your application has been processed.'}
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <h3 className="font-semibold text-blue-900 mb-2">
                  {company.company_name}
                </h3>
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Email:</span> {company.company_email}
                </p>
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Tax ID:</span> {company.tax_id}
                </p>
                <p className="text-sm text-blue-700 mt-2">
                  <span className="font-medium">Status:</span>{' '}
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Pending
                  </span>
                </p>
              </div>
              <p className="text-sm text-gray-500 mt-6">
                {t('company.pendingApproval.timeframe') ||
                  'Reviews typically take 1-2 business days.'}
              </p>
              <button
                onClick={() => navigate('/')}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                {t('common.backToHome') || 'Back to Home'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
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

  // Company is approved - allow access
  return <Outlet context={{ company, companyUser }} />;
};

export default CompanyProtectedRoute;
