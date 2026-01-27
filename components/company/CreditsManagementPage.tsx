// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslations } from '../../hooks/useTranslations';
import { supabase } from '../../supabase/client';
import type { Company, CompanyUser } from '../../types';
import {
  CreditCardIcon,
  CheckIcon,
  ClockIcon,
  BanknotesIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  popular?: boolean;
  savings?: string;
}

interface Transaction {
  id: string;
  type: 'purchase' | 'deduction';
  amount: number;
  credits: number;
  description: string;
  created_at: string;
}

const CreditsManagementPage: React.FC = () => {
  const { company, companyUser } = useOutletContext<{ company: Company; companyUser: CompanyUser }>();
  const translations = useTranslations();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [processing, setProcessing] = useState(false);

  // Helper function to access translations
  const t = (key: string) => {
    const keys = key.split('.');
    let value: any = translations;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  const creditPackages: CreditPackage[] = [
    {
      id: 'starter',
      name: t('company.credits.packages.starter') || 'Starter Pack',
      credits: 50,
      price: 49,
    },
    {
      id: 'professional',
      name: t('company.credits.packages.professional') || 'Professional Pack',
      credits: 150,
      price: 129,
      popular: true,
      savings: '13%',
    },
    {
      id: 'business',
      name: t('company.credits.packages.business') || 'Business Pack',
      credits: 300,
      price: 239,
      savings: '20%',
    },
    {
      id: 'enterprise',
      name: t('company.credits.packages.enterprise') || 'Enterprise Pack',
      credits: 1000,
      price: 699,
      savings: '30%',
    },
  ];

  useEffect(() => {
    if (company?.id) {
      fetchTransactions();
    }
  }, [company]);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('company_credits_history')
        .select('*')
        .eq('company_id', company.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Map to expected format
      const mappedData = data?.map((item: any) => ({
        id: item.id,
        type: item.amount > 0 ? 'purchase' : 'deduction',
        amount: Math.abs(item.amount),
        credits: item.amount,
        description: item.description || item.transaction_type,
        created_at: item.created_at,
      })) || [];

      setTransactions(mappedData);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg: CreditPackage) => {
    setSelectedPackage(pkg);
    setProcessing(true);

    try {
      // In a real app, this would integrate with Stripe, PayPal, etc.
      // For now, we'll simulate a purchase

      // Get current balance
      const { data: companyData, error: fetchError } = await supabase
        .from('companies')
        .select('credit_balance')
        .eq('id', company.id)
        .single();

      if (fetchError) throw fetchError;

      const newBalance = (companyData?.credit_balance || 0) + pkg.credits;

      // Update company balance
      const { error: updateError } = await supabase
        .from('companies')
        .update({
          credit_balance: newBalance,
          total_credits_purchased: (company.total_credits_purchased || 0) + pkg.credits,
        })
        .eq('id', company.id);

      if (updateError) throw updateError;

      // Record transaction in history
      const { error: historyError } = await supabase
        .from('company_credits_history')
        .insert({
          company_id: company.id,
          amount: pkg.credits,
          balance_after: newBalance,
          transaction_type: 'PURCHASE',
          description: `Purchased ${pkg.name} - ${pkg.credits} credits for $${pkg.price}`,
          created_by: companyUser.user_id,
          metadata: { package_id: pkg.id, price: pkg.price },
        });

      if (historyError) throw historyError;

      // Log activity
      await supabase.from('company_activity_log').insert({
        company_id: company.id,
        activity_type: 'credit_purchase',
        description: `Purchased ${pkg.credits} credits for $${pkg.price}`,
        metadata: { package: pkg.id, credits: pkg.credits, price: pkg.price },
        created_by: companyUser.user_id,
      });

      alert(
        t('company.credits.purchaseSuccess') ||
          `Successfully purchased ${pkg.credits} credits!`
      );

      // Refresh data
      await fetchTransactions();
      window.location.reload(); // Refresh to update company credits balance
    } catch (error: any) {
      console.error('Error purchasing credits:', error);
      alert(error.message || t('company.credits.purchaseError') || 'Error purchasing credits');
    } finally {
      setProcessing(false);
      setSelectedPackage(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text-primary">
            {t('company.credits.title') || 'Credits Management'}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-dark-text-secondary">
            {t('company.credits.subtitle') || 'Purchase and manage your credits'}
          </p>
        </div>

        {/* Current Balance Card */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 rounded-lg shadow-xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 mb-2">
                {t('company.credits.currentBalance') || 'Current Balance'}
              </p>
              <p className="text-5xl font-bold">{company.credit_balance || 0}</p>
              <p className="text-blue-100 mt-2">
                {t('company.credits.availableCredits') || 'credits available'}
              </p>
            </div>
            <div className="text-right">
              <BanknotesIcon className="h-20 w-20 text-white opacity-20" />
            </div>
          </div>
        </div>

        {/* Usage Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-dark-bg-secondary shadow-lg dark:shadow-2xl rounded-lg border border-gray-200 dark:border-dark-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-dark-text-secondary">
                  {t('company.credits.profilesUnlocked') || 'Profiles Unlocked'}
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-dark-text-primary mt-1">
                  {transactions.filter((t) => t.description.includes('Unlocked')).length}
                </p>
              </div>
              <ChartBarIcon className="h-10 w-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-dark-bg-secondary shadow-lg dark:shadow-2xl rounded-lg border border-gray-200 dark:border-dark-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-dark-text-secondary">
                  {t('company.credits.cvsDownloaded') || 'CVs Downloaded'}
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-dark-text-primary mt-1">
                  {transactions.filter((t) => t.description.includes('Downloaded')).length}
                </p>
              </div>
              <ChartBarIcon className="h-10 w-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-dark-bg-secondary shadow-lg dark:shadow-2xl rounded-lg border border-gray-200 dark:border-dark-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-dark-text-secondary">
                  {t('company.credits.totalSpent') || 'Total Spent'}
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-dark-text-primary mt-1">
                  {transactions
                    .filter((t) => t.type === 'deduction')
                    .reduce((sum, t) => sum + Math.abs(t.credits), 0)}{' '}
                  {t('company.credits.credits') || 'credits'}
                </p>
              </div>
              <ChartBarIcon className="h-10 w-10 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Credit Packages */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-dark-text-primary mb-6">
            {t('company.credits.buyCredits') || 'Buy Credits'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {creditPackages.map((pkg) => (
              <div
                key={pkg.id}
                className={`relative bg-white dark:bg-dark-bg-secondary rounded-lg shadow-lg dark:shadow-2xl border-2 ${
                  pkg.popular
                    ? 'border-blue-500 dark:border-blue-400'
                    : 'border-gray-200 dark:border-dark-border'
                } p-6 hover:shadow-xl dark:hover:shadow-3xl transition-shadow`}
              >
                {pkg.popular && (
                  <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                    {t('company.credits.popular') || 'POPULAR'}
                  </div>
                )}
                {pkg.savings && (
                  <div className="absolute top-0 left-0 bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-br-lg rounded-tl-lg">
                    {t('company.credits.save') || 'SAVE'} {pkg.savings}
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text-primary mb-2">
                    {pkg.name}
                  </h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900 dark:text-dark-text-primary">
                      {pkg.credits}
                    </span>
                    <span className="text-gray-500 dark:text-dark-text-tertiary ml-2">
                      {t('company.credits.credits') || 'credits'}
                    </span>
                  </div>
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      ${pkg.price}
                    </span>
                  </div>
                  <ul className="mb-6 space-y-2 text-left">
                    <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-dark-text-secondary">
                      <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>
                        ${(pkg.price / pkg.credits).toFixed(2)} {t('company.credits.perCredit') || 'per credit'}
                      </span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-dark-text-secondary">
                      <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{t('company.credits.noExpiry') || 'Credits never expire'}</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-dark-text-secondary">
                      <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{t('company.credits.instantActivation') || 'Instant activation'}</span>
                    </li>
                  </ul>
                  <button
                    onClick={() => handlePurchase(pkg)}
                    disabled={processing && selectedPackage?.id === pkg.id}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                      pkg.popular
                        ? 'bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {processing && selectedPackage?.id === pkg.id
                      ? t('common.processing') || 'Processing...'
                      : t('company.credits.purchase') || 'Purchase'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white dark:bg-dark-bg-secondary shadow-lg dark:shadow-2xl rounded-lg border border-gray-200 dark:border-dark-border">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-dark-border">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">
              {t('company.credits.transactionHistory') || 'Transaction History'}
            </h3>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
                <p className="mt-4 text-sm text-gray-600 dark:text-dark-text-secondary">
                  {t('common.loading') || 'Loading...'}
                </p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-12">
                <ClockIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-dark-text-tertiary" />
                <p className="mt-2 text-sm text-gray-500 dark:text-dark-text-secondary">
                  {t('company.credits.noTransactions') || 'No transactions yet'}
                </p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
                <thead className="bg-gray-50 dark:bg-dark-bg-tertiary">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                      {t('company.credits.date') || 'Date'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                      {t('company.credits.type') || 'Type'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                      {t('company.credits.description') || 'Description'}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                      {t('company.credits.credits') || 'Credits'}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-dark-bg-secondary divide-y divide-gray-200 dark:divide-dark-border">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-dark-text-tertiary">
                        {formatDate(transaction.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transaction.type === 'purchase'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                          }`}
                        >
                          {transaction.type === 'purchase'
                            ? t('company.credits.purchase') || 'Purchase'
                            : t('company.credits.usage') || 'Usage'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-dark-text-primary">
                        {transaction.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                        <span
                          className={
                            transaction.type === 'purchase'
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }
                        >
                          {transaction.type === 'purchase' ? '+' : ''}
                          {transaction.credits}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2">
            {t('company.credits.howItWorks') || 'How Credits Work'}
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li className="flex items-start gap-2">
              <CheckIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>{t('company.credits.info1') || 'Unlock a full profile: 5 credits'}</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>{t('company.credits.info2') || 'Download a CV: 3 credits (first time), free after'}</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>{t('company.credits.info3') || 'Credits never expire'}</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>{t('company.credits.info4') || 'Contact candidates for free'}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreditsManagementPage;
