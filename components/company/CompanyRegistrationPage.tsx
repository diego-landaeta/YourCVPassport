import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslations } from '../../hooks/useTranslations';
import { useToastContext } from '../../context/ToastContext';
import { supabase } from '../../supabase/client';
import type { CreateCompanyInput, CompanySize } from '../../types';

const CompanyRegistrationPage: React.FC = () => {
  const { user, company, companyLoading } = useAuth();
  const { lang } = useLanguage();
  const translations = useTranslations();
  const navigate = useNavigate();
  const toast = useToastContext();

  // Helper function to access translations
  const t = (key: string) => {
    const keys = key.split('.');
    let value: any = translations;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  // Helper function to get input classes with error state
  const getInputClasses = (fieldName: string) => {
    const baseClasses = "block w-full px-4 py-3 rounded-lg shadow-sm text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors";
    const errorClasses = validationErrors[fieldName]
      ? 'border-2 border-red-400 focus:ring-2 focus:ring-red-500 focus:border-red-500'
      : 'border-2 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500';
    return `${baseClasses} ${errorClasses}`;
  };

  const labelClasses = "block text-sm font-semibold text-gray-900 dark:text-white mb-2";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<CreateCompanyInput>>({
    company_name: '',
    legal_name: '',
    tax_id: '',
    company_email: '',
    company_phone: '',
    website_url: '',
    address_street: '',
    address_city: '',
    address_state: '',
    address_country: '',
    address_postal: '',
    industry: '',
    company_size: undefined,
    description: '',
  });

  // File upload state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [taxDocFile, setTaxDocFile] = useState<File | null>(null);
  const [verificationDocFile, setVerificationDocFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  // Redirect if user already has a company
  useEffect(() => {
    // Wait for company data to load
    if (companyLoading) return;

    // If user has a company, redirect to dashboard
    if (company) {
      toast.info(
        lang === 'es'
          ? 'Ya tienes una empresa registrada. Redirigiendo al dashboard...'
          : 'You already have a registered company. Redirecting to dashboard...'
      );
      navigate('/company/dashboard');
    }
  }, [company, companyLoading, navigate, toast, lang]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'logo' | 'tax' | 'verification') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setValidationErrors(prev => ({
        ...prev,
        [fileType]: t('company.registration.fileTooLarge')
      }));
      return;
    }

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setValidationErrors(prev => ({
        ...prev,
        [fileType]: t('company.registration.invalidFileType')
      }));
      return;
    }

    // Set file
    if (fileType === 'logo') setLogoFile(file);
    else if (fileType === 'tax') setTaxDocFile(file);
    else if (fileType === 'verification') setVerificationDocFile(file);

    // Clear error
    if (validationErrors[fileType]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fileType];
        return newErrors;
      });
    }
  };

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${path}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('company-documents')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('company-documents')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('File upload error:', error);
      return null;
    }
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    // Required fields
    if (!formData.company_name?.trim()) {
      errors.company_name = t('company.registration.requiredField');
    }
    if (!formData.legal_name?.trim()) {
      errors.legal_name = t('company.registration.requiredField');
    }
    if (!formData.tax_id?.trim()) {
      errors.tax_id = t('company.registration.requiredField');
    }
    if (!formData.company_email?.trim()) {
      errors.company_email = t('company.registration.requiredField');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.company_email)) {
      errors.company_email = t('company.registration.invalidEmail');
    }

    // Validate website URL if provided
    if (formData.website_url && !/^https?:\/\/.+/.test(formData.website_url)) {
      errors.website_url = t('company.registration.invalidUrl');
    }

    // Required documents
    if (!taxDocFile) {
      errors.tax = t('company.registration.requiredField');
    }
    if (!verificationDocFile) {
      errors.verification = t('company.registration.requiredField');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error(t('company.registration.loginRequired') || 'You must be logged in to register a company');
      setError(t('company.registration.loginRequired') || 'You must be logged in to register a company');
      return;
    }

    if (!validateForm()) {
      toast.error(t('company.registration.fixErrors') || 'Please fix the validation errors before submitting');
      setError(t('company.registration.fixErrors') || 'Please fix the validation errors');
      // Scroll to first error
      const firstError = document.querySelector('.text-red-600');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Upload logo if provided
      let logoUrl: string | null = null;
      if (logoFile) {
        setUploadProgress({ logo: 0 });
        logoUrl = await uploadFile(logoFile, 'logos');
        setUploadProgress({ logo: 100 });
      }

      // 2. Upload tax document (required)
      setUploadProgress(prev => ({ ...prev, tax: 0 }));
      const taxDocUrl = await uploadFile(taxDocFile!, 'tax-documents');
      if (!taxDocUrl) {
        throw new Error('Failed to upload tax document');
      }
      setUploadProgress(prev => ({ ...prev, tax: 100 }));

      // 3. Upload verification document (required)
      setUploadProgress(prev => ({ ...prev, verification: 0 }));
      const verificationDocUrl = await uploadFile(verificationDocFile!, 'verification-documents');
      if (!verificationDocUrl) {
        throw new Error('Failed to upload verification document');
      }
      setUploadProgress(prev => ({ ...prev, verification: 100 }));

      // 4. Get user IP (optional)
      let signupIp: string | undefined;
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        signupIp = ipData.ip;
      } catch (e) {
        // IP fetch failed, continue without it
        console.warn('Could not fetch IP:', e);
      }

      // 5. Insert company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          company_name: formData.company_name,
          legal_name: formData.legal_name,
          tax_id: formData.tax_id,
          company_email: formData.company_email,
          company_phone: formData.company_phone || null,
          website_url: formData.website_url || null,
          address_street: formData.address_street || null,
          address_city: formData.address_city || null,
          address_state: formData.address_state || null,
          address_country: formData.address_country || null,
          address_postal: formData.address_postal || null,
          industry: formData.industry || null,
          company_size: formData.company_size || null,
          description: formData.description || null,
          logo_url: logoUrl,
          tax_document_url: taxDocUrl,
          verification_document_url: verificationDocUrl,
          signup_ip: signupIp,
          status: 'PENDING',
        })
        .select()
        .single();

      if (companyError) {
        console.error('Company insert error:', companyError);

        // Check for specific RLS errors
        if (companyError.code === '42501') {
          toast.error('Database permissions error. Please contact support.');
          throw new Error('Permission denied. The database policies need to be configured. Please contact support at support@yourcvpassport.com');
        }

        toast.error(`Error registering company: ${companyError.message}`);
        throw new Error(companyError.message);
      }

      if (!company) {
        toast.error('Company registration failed. No company data returned.');
        throw new Error('Company registration failed. No data returned from database.');
      }

      // 6. Insert company_user (make current user the OWNER)
      const { error: companyUserError } = await supabase
        .from('company_users')
        .insert({
          company_id: company.id,
          user_id: user.id,
          role: 'OWNER',
          accepted_at: new Date().toISOString(),
        });

      if (companyUserError) {
        console.error('Company user insert error:', companyUserError);

        // Check for specific RLS errors
        if (companyUserError.code === '42501') {
          toast.error('Database permissions error for company users. Please contact support.');
          throw new Error('Permission denied for company_users table. Please contact support at support@yourcvpassport.com');
        }

        toast.error(`Error linking user to company: ${companyUserError.message}`);
        throw new Error(companyUserError.message);
      }

      // Success!
      setSuccess(true);
      toast.success('Company registered successfully! Redirecting to dashboard...');

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/company/dashboard');
      }, 2000);

    } catch (err: any) {
      console.error('Registration error:', err);
      const errorMessage = err.message || 'An error occurred during registration';
      setError(errorMessage);
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  // Show loading while checking company status
  if (companyLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white dark:bg-dark-bg-secondary py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 mb-4">
                <svg className="animate-spin h-6 w-6 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text-primary mb-2">
                {lang === 'es' ? 'Verificando estado...' : 'Verifying status...'}
              </h2>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {t('company.registration.success')}
              </h2>
              <p className="text-gray-600">
                {t('company.registration.successMessage')}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text-primary mb-2">
            {t('company.registration.title')}
          </h1>
          <p className="text-gray-600 dark:text-dark-text-secondary">
            {t('company.registration.subtitle')}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="ml-3 text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-dark-bg-secondary shadow-lg rounded-lg border border-gray-200 dark:border-dark-border">
          <div className="px-6 py-8 space-y-8">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-4">
                {t('company.registration.basicInfo')}
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="company_name" className={labelClasses}>
                    {t('company.registration.companyName')} *
                  </label>
                  <input
                    type="text"
                    name="company_name"
                    id="company_name"
                    value={formData.company_name}
                    onChange={handleInputChange}
                    placeholder={t('company.registration.companyNamePlaceholder')}
                    className={getInputClasses('company_name')}
                  />
                  {validationErrors.company_name && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.company_name}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="legal_name" className={labelClasses}>
                    {t('company.registration.legalName')} *
                  </label>
                  <input
                    type="text"
                    name="legal_name"
                    id="legal_name"
                    value={formData.legal_name}
                    onChange={handleInputChange}
                    placeholder={t('company.registration.legalNamePlaceholder')}
                    className={getInputClasses('legal_name')}
                  />
                  {validationErrors.legal_name && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.legal_name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="tax_id" className={labelClasses}>
                    {t('company.registration.taxId')} *
                  </label>
                  <input
                    type="text"
                    name="tax_id"
                    id="tax_id"
                    value={formData.tax_id}
                    onChange={handleInputChange}
                    placeholder={t('company.registration.taxIdPlaceholder')}
                    className={getInputClasses('tax_id')}
                  />
                  {validationErrors.tax_id && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.tax_id}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="company_email" className={labelClasses}>
                    {t('company.registration.companyEmail')} *
                  </label>
                  <input
                    type="email"
                    name="company_email"
                    id="company_email"
                    value={formData.company_email}
                    onChange={handleInputChange}
                    placeholder={t('company.registration.companyEmailPlaceholder')}
                    className={getInputClasses('company_email')}
                  />
                  {validationErrors.company_email && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.company_email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="company_phone" className={labelClasses}>
                    {t('company.registration.companyPhone')}
                  </label>
                  <input
                    type="tel"
                    name="company_phone"
                    id="company_phone"
                    value={formData.company_phone}
                    onChange={handleInputChange}
                    placeholder={t('company.registration.companyPhonePlaceholder')}
                    className={getInputClasses('company_phone')}
                  />
                </div>

                <div>
                  <label htmlFor="website_url" className={labelClasses}>
                    {t('company.registration.website')}
                  </label>
                  <input
                    type="url"
                    name="website_url"
                    id="website_url"
                    value={formData.website_url}
                    onChange={handleInputChange}
                    placeholder={t('company.registration.websitePlaceholder')}
                    className={getInputClasses('website_url')}
                  />
                  {validationErrors.website_url && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.website_url}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="industry" className={labelClasses}>
                    {t('company.registration.industry')}
                  </label>
                  <input
                    type="text"
                    name="industry"
                    id="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    placeholder="e.g., Technology, Healthcare, Finance"
                    className={getInputClasses('industry')}
                  />
                </div>

                <div>
                  <label htmlFor="company_size" className={labelClasses}>
                    {t('company.registration.companySize')}
                  </label>
                  <select
                    name="company_size"
                    id="company_size"
                    value={formData.company_size || ''}
                    onChange={handleInputChange}
                    className={getInputClasses('company_size')}
                  >
                    <option value="">Select size</option>
                    <option value="1-10">{t('company.registration.companySizeOptions.1-10')}</option>
                    <option value="11-50">{t('company.registration.companySizeOptions.11-50')}</option>
                    <option value="51-200">{t('company.registration.companySizeOptions.51-200')}</option>
                    <option value="201-500">{t('company.registration.companySizeOptions.201-500')}</option>
                    <option value="501-1000">{t('company.registration.companySizeOptions.501-1000')}</option>
                    <option value="1000+">{t('company.registration.companySizeOptions.1000+')}</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="description" className={labelClasses}>
                    {t('company.registration.description')}
                  </label>
                  <textarea
                    name="description"
                    id="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder={t('company.registration.descriptionPlaceholder')}
                    className={getInputClasses('description')}
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="border-t border-gray-200 dark:border-dark-border pt-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-4">
                {t('company.registration.address')}
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="address_street" className={labelClasses}>
                    {t('company.registration.street')}
                  </label>
                  <input
                    type="text"
                    name="address_street"
                    id="address_street"
                    value={formData.address_street}
                    onChange={handleInputChange}
                    className={getInputClasses('address_street')}
                  />
                </div>

                <div>
                  <label htmlFor="address_city" className={labelClasses}>
                    {t('company.registration.city')}
                  </label>
                  <input
                    type="text"
                    name="address_city"
                    id="address_city"
                    value={formData.address_city}
                    onChange={handleInputChange}
                    className={getInputClasses('address_city')}
                  />
                </div>

                <div>
                  <label htmlFor="address_state" className={labelClasses}>
                    {t('company.registration.state')}
                  </label>
                  <input
                    type="text"
                    name="address_state"
                    id="address_state"
                    value={formData.address_state}
                    onChange={handleInputChange}
                    className={getInputClasses('address_state')}
                  />
                </div>

                <div>
                  <label htmlFor="address_country" className={labelClasses}>
                    {t('company.registration.country')}
                  </label>
                  <input
                    type="text"
                    name="address_country"
                    id="address_country"
                    value={formData.address_country}
                    onChange={handleInputChange}
                    placeholder="ES, US, MX, etc."
                    maxLength={2}
                    className={getInputClasses('address_country')}
                  />
                </div>

                <div>
                  <label htmlFor="address_postal" className={labelClasses}>
                    {t('company.registration.postalCode')}
                  </label>
                  <input
                    type="text"
                    name="address_postal"
                    id="address_postal"
                    value={formData.address_postal}
                    onChange={handleInputChange}
                    className={getInputClasses('address_postal')}
                  />
                </div>
              </div>
            </div>

            {/* Verification Documents */}
            <div className="border-t border-gray-200 dark:border-dark-border pt-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary mb-4">
                {t('company.registration.verification')}
              </h3>
              <div className="space-y-6">
                {/* Logo Upload (Optional) */}
                <div>
                  <label className={labelClasses}>
                    {t('company.registration.logo')}
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors bg-gray-50 dark:bg-gray-800/50">
                    <div className="space-y-1 text-center">
                      {logoFile ? (
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          <p className="font-medium">{logoFile.name}</p>
                          <button
                            type="button"
                            onClick={() => setLogoFile(null)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mt-2"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <>
                          <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <div className="flex text-sm text-gray-600 dark:text-gray-300 justify-center">
                            <label htmlFor="logo-upload" className="relative cursor-pointer rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
                              <span>{t('company.registration.uploadButton')}</span>
                              <input
                                id="logo-upload"
                                name="logo-upload"
                                type="file"
                                accept="image/png,image/jpeg,image/jpg"
                                className="sr-only"
                                onChange={(e) => handleFileChange(e, 'logo')}
                              />
                            </label>
                            <p className="pl-1">{t('company.registration.dragDrop')}</p>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t('company.registration.fileTypes')}</p>
                        </>
                      )}
                    </div>
                  </div>
                  {uploadProgress.logo !== undefined && uploadProgress.logo < 100 && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${uploadProgress.logo}%` }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Tax Document Upload (Required) */}
                <div>
                  <label className={labelClasses}>
                    {t('company.registration.taxDocument')} *
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t('company.registration.taxDocumentHelp')}</p>
                  <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg transition-colors ${
                    validationErrors.tax
                      ? 'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/10'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-gray-50 dark:bg-gray-800/50'
                  }`}>
                    <div className="space-y-1 text-center">
                      {taxDocFile ? (
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          <p className="font-medium">{taxDocFile.name}</p>
                          <button
                            type="button"
                            onClick={() => setTaxDocFile(null)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mt-2"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <>
                          <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M8 14v20c0 4.418 7.163 8 16 8 1.381 0 2.721-.087 4-.252M8 14c0 4.418 7.163 8 16 8s16-3.582 16-8M8 14c0-4.418 7.163-8 16-8s16 3.582 16 8m0 0v14m0-4c0 4.418-7.163 8-16 8S8 28.418 8 24m32 10v6m0 0v6m0-6h6m-6 0h-6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <div className="flex text-sm text-gray-600 dark:text-gray-300 justify-center">
                            <label htmlFor="tax-upload" className="relative cursor-pointer rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
                              <span>{t('company.registration.uploadButton')}</span>
                              <input
                                id="tax-upload"
                                name="tax-upload"
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,application/pdf"
                                className="sr-only"
                                onChange={(e) => handleFileChange(e, 'tax')}
                              />
                            </label>
                            <p className="pl-1">{t('company.registration.dragDrop')}</p>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t('company.registration.fileTypes')}</p>
                        </>
                      )}
                    </div>
                  </div>
                  {validationErrors.tax && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.tax}</p>
                  )}
                  {uploadProgress.tax !== undefined && uploadProgress.tax < 100 && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${uploadProgress.tax}%` }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Verification Document Upload (Required) */}
                <div>
                  <label className={labelClasses}>
                    {t('company.registration.verificationDocument')} *
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t('company.registration.verificationDocumentHelp')}</p>
                  <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg transition-colors ${
                    validationErrors.verification
                      ? 'border-red-400 dark:border-red-500 bg-red-50 dark:bg-red-900/10'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-gray-50 dark:bg-gray-800/50'
                  }`}>
                    <div className="space-y-1 text-center">
                      {verificationDocFile ? (
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          <p className="font-medium">{verificationDocFile.name}</p>
                          <button
                            type="button"
                            onClick={() => setVerificationDocFile(null)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mt-2"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <>
                          <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M9 12h6m6 0h6m-6 0v6m-6-6v6m6 0v6m0-6h6m-6 0H9m12 6v6m0-6H9m12 6h6m-6 0v6m0-6H9m12 6H9m12 0h6m-6 0v6m6-6h6m-6 0v6m0-6h6m-6 0V12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <div className="flex text-sm text-gray-600 dark:text-gray-300 justify-center">
                            <label htmlFor="verification-upload" className="relative cursor-pointer rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
                              <span>{t('company.registration.uploadButton')}</span>
                              <input
                                id="verification-upload"
                                name="verification-upload"
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,application/pdf"
                                className="sr-only"
                                onChange={(e) => handleFileChange(e, 'verification')}
                              />
                            </label>
                            <p className="pl-1">{t('company.registration.dragDrop')}</p>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t('company.registration.fileTypes')}</p>
                        </>
                      )}
                    </div>
                  </div>
                  {validationErrors.verification && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validationErrors.verification}</p>
                  )}
                  {uploadProgress.verification !== undefined && uploadProgress.verification < 100 && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${uploadProgress.verification}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-dark-border rounded-b-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                * {t('company.registration.requiredFieldsNote') || 'Required fields'}
              </p>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center py-3 px-8 border border-transparent shadow-sm text-base font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? t('company.registration.submitting') : t('company.registration.submit')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanyRegistrationPage;
