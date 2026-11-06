import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslations } from '../../hooks/useTranslations';
import { useLanguage } from '../../contexts/LanguageContext';
import PageSEO from '../shared/PageSEO';
import { useToastContext } from '../../contexts/ToastContext';
import { supabase } from '../../supabase/client';
import { COMPANY_DOCUMENTS_BUCKET, COMPANY_LOGOS_BUCKET } from '../../lib/companyDocuments';
import {
  ArrowRightIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  PhotoIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import LegalConsentFields from '../legal/LegalConsentFields';
import { useCompanyRegText } from '../legal/companyRegText';
import {
  EMPLOYER_OPTIONAL,
  EMPLOYER_REQUIRED,
  countryName,
  emptyCasillas,
  fetchActiveCountries,
  fetchLegalDocuments,
  registerAcceptance,
  type Casillas,
  type CountryOption,
} from '../../lib/legal';

// Formulario de alta de empresa (bolsa de empleo, fase 1). Tamaños nuevos: 1-10, 11-50, 51-250, 250+.
interface CompanyFormData {
  company_name: string;
  legal_name: string;
  tax_id: string;
  company_email: string;
  company_phone: string;
  website_url: string;
  address_street: string;
  address_city: string;
  address_state: string;
  country_code: string;
  contact_name: string;
  contact_position: string;
  address_postal: string;
  industry: string;
  company_size: string;
  description: string;
}

// SEO de /company/register (diccionario local ES/EN). La URL es la misma en ambos idiomas.
const REGISTRATION_SEO = {
  es: {
    title: 'Registro de empresas',
    description: 'Registra tu empresa en YourCVPassport para publicar ofertas de empleo y buscar profesionales con perfiles verificados.',
  },
  en: {
    title: 'Company registration',
    description: 'Register your company on YourCVPassport to post job openings and search for professionals with verified profiles.',
  },
} as const;

const CompanyRegistrationPage: React.FC = () => {
  const { user, company, companyLoading, loading: authLoading } = useAuth();
  const translations = useTranslations();
  const tx = useCompanyRegText();
  const navigate = useNavigate();
  const toast = useToastContext();
  const { lang } = useLanguage();
  const seo = (
    <PageSEO
      title={REGISTRATION_SEO[lang].title}
      description={REGISTRATION_SEO[lang].description}
      lang={lang}
    />
  );

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
    const baseClasses = "block w-full px-3.5 py-2.5 rounded-lg shadow-sm text-base sm:text-[15px] leading-6 bg-white dark:bg-dark-bg-tertiary text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-colors border focus:outline-none focus:ring-2";
    const errorClasses = validationErrors[fieldName]
      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
      : 'border-slate-300 dark:border-dark-border focus:ring-cv-blue focus:border-cv-blue';
    return `${baseClasses} ${errorClasses}`;
  };

  const labelClasses = "block text-sm font-medium text-slate-800 dark:text-slate-100 mb-1.5";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  // La revisión automática sigue en marcha tras mostrar el éxito.
  const [reviewing, setReviewing] = useState(false);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);
  // Resultado de la revisión automática: verified (APPROVED al momento) o pending (revisión manual).
  const [outcome, setOutcome] = useState<'verified' | 'pending'>('pending');
  const [consents, setConsents] = useState<Casillas>(() =>
    emptyCasillas([...EMPLOYER_REQUIRED, ...EMPLOYER_OPTIONAL]),
  );
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [countriesError, setCountriesError] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CompanyFormData>({
    company_name: '',
    legal_name: '',
    tax_id: '',
    company_email: '',
    company_phone: '',
    website_url: '',
    address_street: '',
    address_city: '',
    address_state: '',
    country_code: '',
    contact_name: '',
    contact_position: '',
    address_postal: '',
    industry: '',
    company_size: '',
    description: '',
  });

  // File upload state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [taxDocFile, setTaxDocFile] = useState<File | null>(null);
  const [verificationDocFile, setVerificationDocFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  // País de la empresa: selector alimentado por la tabla countries (lectura pública).
  const loadCountries = React.useCallback(async () => {
    setCountriesError(false);
    const { countries: list, error: listError } = await fetchActiveCountries();
    if (listError) setCountriesError(true);
    setCountries(list);
  }, []);
  useEffect(() => {
    void loadCountries();
  }, [loadCountries]);
  const sortedCountries = React.useMemo(
    () => [...countries].sort((a, b) => countryName(a, lang).localeCompare(countryName(b, lang), lang)),
    [countries, lang],
  );

  // Redirect if user already has a company
  useEffect(() => {
    // Wait for company data to load
    if (companyLoading) return;

    // If user has a company, redirect to dashboard
    if (company) {
      toast.info(t('company.registrationPage.alreadyRegistered'));
      navigate('/company/dashboard');
    }
  }, [company, companyLoading, navigate, toast]);

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

  /**
   * Sube un archivo del registro.
   * - 'logos': bucket público `company-logos`, carpeta <uid>/; devuelve la URL pública.
   * - 'tax-documents' / 'verification-documents': bucket PRIVADO
   *   `company-documents`, carpeta <tipo>/<uid>/; devuelve la RUTA (no una URL):
   *   el panel de admin la abre con una URL firmada (createSignedUrl).
   * Ver supabase/migrations/20261005_privatizar_company_documents.sql.
   */
  const uploadFile = async (
    file: File,
    kind: 'logos' | 'tax-documents' | 'verification-documents',
  ): Promise<string | null> => {
    try {
      if (!user) return null;
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const isLogo = kind === 'logos';
      const bucket = isLogo ? COMPANY_LOGOS_BUCKET : COMPANY_DOCUMENTS_BUCKET;
      const filePath = isLogo ? `${user.id}/${fileName}` : `${kind}/${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      if (!isLogo) return filePath;

      const { data: urlData } = supabase.storage
        .from(bucket)
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
    if (!formData.country_code) {
      errors.country_code = tx.errCountry;
    }
    if (!formData.industry?.trim()) {
      errors.industry = tx.errIndustry;
    }
    if (!formData.company_size) {
      errors.company_size = tx.errSize;
    }
    if (!formData.contact_name?.trim()) {
      errors.contact_name = tx.errContactName;
    }
    if (!EMPLOYER_REQUIRED.every((k) => consents[k] === true)) {
      errors.consents = tx.errConsents;
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

    // Los documentos (CIF, licencia) ya NO son obligatorios: la verificación se
    // hace con el identificador fiscal, el país, la web y el correo.

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /** Registra la aceptación de terminos_empleador + privacidad con las casillas marcadas. */
  const saveEmployerAcceptance = async (companyId: string): Promise<boolean> => {
    try {
      const { docs, error: docsError } = await fetchLegalDocuments(['terminos_empleador', 'privacidad'], lang);
      const ids = [docs.terminos_empleador?.id, docs.privacidad?.id].filter((id): id is string => !!id);
      if (docsError || ids.length < 2) return false;
      const { error: regError } = await registerAcceptance({
        documentIds: ids,
        casillas: consents,
        contexto: 'registro',
        companyId,
      });
      return !regError;
    } catch (e) {
      console.warn('registrar_aceptacion falló:', e);
      return false;
    }
  };

  /**
   * ¿Ya existe una empresa con este identificador fiscal o este correo? (RPC company_duplicate_hint).
   * Devuelve solo si están ocupados, nunca de quién. Si la RPC no existe o falla, no impide el registro:
   * la revisión de la empresa y la base lo comprueban igualmente.
   */
  const checkDuplicateHint = async (): Promise<{ tax: boolean; email: boolean }> => {
    try {
      const { data, error } = await supabase.rpc('company_duplicate_hint', {
        p_tax_id: formData.tax_id?.trim() || '',
        p_company_email: formData.company_email?.trim() || '',
      });
      if (error || !data) return { tax: false, email: false };
      const row = (Array.isArray(data) ? data[0] : data) as { tax_id_taken?: boolean; email_taken?: boolean } | undefined;
      return { tax: row?.tax_id_taken === true, email: row?.email_taken === true };
    } catch {
      return { tax: false, email: false };
    }
  };

  /**
   * Revisión por reglas (Edge company-review-ai). Nunca bloquea el registro ni la pantalla de éxito:
   * se lanza en segundo plano y, si llega a tiempo, la pantalla pasa de «revisando» a «verificada».
   */
  const runCompanyReview = async (companyId: string): Promise<'verified' | 'pending'> => {
    try {
      const res = await supabase.functions.invoke('company-review-ai', { body: { companyId } });
      return (res.data as { status?: string } | null)?.status === 'APPROVED' ? 'verified' : 'pending';
    } catch (e) {
      console.warn('company-review-ai no respondió; queda en revisión manual:', e);
      return 'pending';
    }
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
      // 0. Duplicados: se avisa ANTES de subir archivos o crear nada (sin revelar de quién es el otro registro).
      const dup = await checkDuplicateHint();
      if (dup.tax || dup.email) {
        setValidationErrors((prev) => ({
          ...prev,
          ...(dup.tax ? { tax_id: tx.errTaxDuplicate } : {}),
          ...(dup.email ? { company_email: tx.errEmailDuplicate } : {}),
        }));
        setError(dup.tax ? tx.errTaxDuplicate : tx.errEmailDuplicate);
        setLoading(false);
        window.setTimeout(() => document.querySelector('.text-red-600')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
        return;
      }

      // 1. Upload logo if provided
      let logoUrl: string | null = null;
      if (logoFile) {
        setUploadProgress({ logo: 0 });
        logoUrl = await uploadFile(logoFile, 'logos');
        setUploadProgress({ logo: 100 });
      }

      // 2. Documento fiscal (opcional). Un fallo de subida no impide el registro.
      let taxDocUrl: string | null = null;
      if (taxDocFile) {
        setUploadProgress(prev => ({ ...prev, tax: 0 }));
        taxDocUrl = await uploadFile(taxDocFile, 'tax-documents');
        setUploadProgress(prev => ({ ...prev, tax: 100 }));
      }

      // 3. Documento de verificación (opcional)
      let verificationDocUrl: string | null = null;
      if (verificationDocFile) {
        setUploadProgress(prev => ({ ...prev, verification: 0 }));
        verificationDocUrl = await uploadFile(verificationDocFile, 'verification-documents');
        setUploadProgress(prev => ({ ...prev, verification: 100 }));
      }

      // (Ya no se pide la IP a api.ipify.org desde el navegador: se podía falsificar.
      //  La IP y el navegador de la aceptación los toma el SERVIDOR en registrar_aceptacion.)

      // 5. Insert company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          company_name: formData.company_name,
          legal_name: formData.legal_name,
          tax_id: formData.tax_id?.trim(),
          company_email: formData.company_email?.trim(),
          company_phone: formData.company_phone || null,
          website_url: formData.website_url || null,
          address_street: formData.address_street || null,
          address_city: formData.address_city || null,
          address_state: formData.address_state || null,
          address_country: formData.country_code || null,
          address_postal: formData.address_postal || null,
          industry: formData.industry || null,
          company_size: formData.company_size || null,
          description: formData.description || null,
          // Fase 1 (#6): país (FK countries), idioma de la empresa y contacto.
          country_code: formData.country_code,
          idioma: lang,
          contact_name: formData.contact_name.trim(),
          contact_position: formData.contact_position.trim() || null,
          logo_url: logoUrl,
          tax_document_url: taxDocUrl,
          verification_document_url: verificationDocUrl,
          status: 'PENDING',
        })
        // Solo columnas públicas: el resto de companies no es legible por authenticated
        // (20261009b_cerrar_columnas_privadas_companies.sql). Aquí solo hace falta el id.
        .select('id')
        .single();

      if (companyError) {
        console.error('Company insert error:', companyError);

        // 23505: otra empresa tiene ya ese identificador fiscal o ese correo (carrera con la comprobación previa
        // o RPC no disponible). No se ha creado nada: se explica en el campo, sin decir de quién es.
        if (companyError.code === '23505') {
          const blob = `${companyError.message || ''} ${companyError.details || ''}`.toLowerCase();
          const field = /tax/.test(blob) ? 'tax_id' : /email|correo/.test(blob) ? 'company_email' : null;
          if (field) setValidationErrors((prev) => ({ ...prev, [field]: field === 'tax_id' ? tx.errTaxDuplicate : tx.errEmailDuplicate }));
          throw new Error(tx.errDuplicateInsert);
        }

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

        // La empresa ya se creó pero no se pudo vincular al usuario: se intenta deshacer para no dejar una
        // empresa huérfana (si la política no deja borrar, quedará PENDING sin miembros y la revisará un admin).
        await supabase.from('companies').delete().eq('id', company.id);
        if (companyUserError.code !== '42501') throw new Error(tx.errLinkFailed);

        // Check for specific RLS errors
        if (companyUserError.code === '42501') {
          toast.error('Database permissions error for company users. Please contact support.');
          throw new Error('Permission denied for company_users table. Please contact support at support@yourcvpassport.com');
        }

        toast.error(`Error linking user to company: ${companyUserError.message}`);
        throw new Error(companyUserError.message);
      }

      // 7. Aceptación de las condiciones de empleador (contexto «registro», con la
      //    empresa). Si falla no se deshace el alta: CompanyProtectedRoute pasa por
      //    LegalGate y la pedirá al entrar.
      const accepted = await saveEmployerAcceptance(company.id);
      if (!accepted) toast.warning(tx.acceptSaveFailed, 8000);

      // 8. Revisión automática (reglas). Sin incidencias -> APPROVED al momento; con
      //    dudas o ante cualquier error la empresa queda PENDING (revisión manual).
      //    En segundo plano: la pantalla de éxito sale ya («te avisaremos») y pasa a «verificada» si llega a tiempo.
      setOutcome('pending');
      setReviewing(true);
      void runCompanyReview(company.id).then((result) => {
        if (!mountedRef.current) return;
        setOutcome(result);
        setReviewing(false);
      });

      // Success!
      setSuccess(true);

      // Redirect to dashboard after a few seconds (PENDING también puede entrar y preparar borradores)
      setTimeout(() => {
        navigate('/company/dashboard');
      }, 3500);

    } catch (err: any) {
      console.error('Registration error:', err);
      const errorMessage = err.message || 'An error occurred during registration';
      setError(errorMessage);
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  // Aviso de error de un campo (la clase text-red-600 la usa el scroll al primer error).
  const fieldError = (name: string) =>
    validationErrors[name] ? (
      <p id={`${name}-err`} role="alert" className="mt-1.5 flex items-start gap-1.5 text-sm text-red-600 dark:text-red-400">
        <ExclamationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{validationErrors[name]}</span>
      </p>
    ) : null;
  const fa = (name: string) =>
    validationErrors[name] ? { 'aria-invalid': true as const, 'aria-describedby': `${name}-err` } : {};
  const req = <span className="text-red-700 dark:text-red-400" aria-hidden="true"> *</span>;
  const opt = <span className="ml-1.5 font-normal text-slate-500 dark:text-dark-text-secondary">{tx.optionalSuffix}</span>;

  const pageShell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg-primary">
      {seo}
      {children}
    </div>
  );

  const panelCls =
    'rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,.05),0_12px_32px_-20px_rgba(15,23,42,.2)] dark:border-dark-border dark:bg-dark-bg-secondary dark:shadow-none';

  // Show loading while checking company status
  if (companyLoading || authLoading) {
    return pageShell(
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center" role="status" aria-live="polite">
          <svg className="mx-auto h-8 w-8 animate-spin text-cv-blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-base font-medium text-slate-800 dark:text-slate-100">{t('company.registrationPage.verifyingStatus')}</p>
        </div>
      </div>,
    );
  }

  // Sin sesión no se puede registrar una empresa: primero la cuenta (camino «empresa»).
  if (!user) {
    return pageShell(
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
        <div className={`${panelCls} w-full max-w-md p-8 text-center sm:p-10`}>
          <span aria-hidden="true" className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-cv-blue dark:bg-blue-500/15 dark:text-blue-300">
            <BuildingOffice2Icon className="h-7 w-7" strokeWidth={1.5} />
          </span>
          <h1 className="text-balance text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{tx.needAccountTitle}</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-600 dark:text-dark-text-secondary">{tx.needAccountBody}</p>
          <div className="mt-7 flex flex-col gap-3">
            <Link
              to="/signup?tipo=empresa"
              className="inline-flex justify-center rounded-lg bg-cv-blue px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-cv-blue-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-dark-bg-secondary"
            >
              {tx.createAccount}
            </Link>
            <Link
              to="/login"
              className="rounded py-1 font-medium text-cv-blue hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue dark:text-blue-300"
            >
              {tx.signIn}
            </Link>
          </div>
        </div>
      </div>,
    );
  }

  if (success) {
    const verified = outcome === 'verified';
    const steps = [tx.reviewStep1, tx.reviewStep2, tx.reviewStep3];
    return pageShell(
      <div className="mx-auto max-w-xl px-4 py-12 sm:py-16">
        <div className={`${panelCls} p-8 sm:p-10`}>
          <span
            aria-hidden="true"
            className={`mb-5 flex h-14 w-14 items-center justify-center rounded-full ${
              verified ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
            }`}
          >
            {verified ? <CheckCircleIcon className="h-7 w-7" /> : <ClockIcon className="h-7 w-7" />}
          </span>
          <h1 className="text-balance text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{t('company.registration.success')}</h1>
          <p role="status" className="mt-3 text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
            {verified ? tx.successVerified : reviewing ? tx.successChecking : tx.successPending}
          </p>
          {!verified && (
            <div className="mt-7 border-t border-slate-200 pt-6 dark:border-dark-border">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{tx.reviewStepsTitle}</h2>
              <ol className="mt-3 space-y-3">
                {steps.map((text, i) => (
                  <li key={text} className="flex items-start gap-3 text-sm leading-snug text-slate-700 dark:text-slate-300">
                    <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold tabular-nums text-slate-700 dark:bg-dark-bg-tertiary dark:text-slate-200">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{text}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          <Link
            to="/company/dashboard"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-cv-blue px-6 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-cv-blue-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-dark-bg-secondary"
          >
            {tx.goToPanel}
            <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>,
    );
  }

  // Zona de subida de un archivo opcional (logotipo o documento).
  const uploadBox = (opts: {
    key: 'logo' | 'tax' | 'verification';
    inputId: string;
    label: string;
    help?: string;
    accept: string;
    file: File | null;
    clear: () => void;
    icon: React.ReactNode;
  }) => (
    <div>
      <p className={labelClasses}>
        {opts.label}
        {opt}
      </p>
      {opts.help && <p className="-mt-1 mb-2 text-[13px] leading-snug text-slate-600 dark:text-dark-text-secondary">{opts.help}</p>}
      <div
        className={`flex items-center gap-4 rounded-xl border-2 border-dashed px-4 py-4 transition-colors ${
          validationErrors[opts.key]
            ? 'border-red-400 bg-red-50 dark:border-red-400/60 dark:bg-red-500/10'
            : 'border-slate-300 bg-slate-50 hover:border-cv-blue dark:border-dark-border dark:bg-dark-bg-tertiary/40 dark:hover:border-blue-400'
        }`}
      >
        <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 ring-1 ring-slate-200 dark:bg-dark-bg-secondary dark:text-slate-300 dark:ring-dark-border">
          {opts.icon}
        </span>
        {opts.file ? (
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <p className="min-w-0 truncate text-sm font-medium text-slate-900 dark:text-white">{opts.file.name}</p>
            <button
              type="button"
              onClick={opts.clear}
              className="rounded px-1 text-sm font-medium text-cv-blue underline underline-offset-2 hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue dark:text-blue-300"
            >
              {t('company.registrationPage.remove')}
            </button>
          </div>
        ) : (
          <div className="min-w-0 flex-1 text-sm text-slate-700 dark:text-slate-300">
            <label
              htmlFor={opts.inputId}
              className="relative cursor-pointer rounded font-semibold text-cv-blue hover:underline focus-within:ring-2 focus-within:ring-cv-blue dark:text-blue-300"
            >
              <span>{t('company.registration.uploadButton')}</span>
              <input id={opts.inputId} name={opts.inputId} type="file" accept={opts.accept} className="sr-only" onChange={(e) => handleFileChange(e, opts.key)} />
            </label>{' '}
            <span>{t('company.registration.dragDrop')}</span>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-dark-text-secondary">{t('company.registration.fileTypes')}</p>
          </div>
        )}
      </div>
      {validationErrors[opts.key] && (
        <p role="alert" className="mt-1.5 flex items-start gap-1.5 text-sm text-red-600 dark:text-red-400">
          <ExclamationCircleIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{validationErrors[opts.key]}</span>
        </p>
      )}
      {uploadProgress[opts.key] !== undefined && uploadProgress[opts.key] < 100 && (
        <div className="mt-2">
          <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-dark-bg-tertiary">
            <div className="h-2 rounded-full bg-cv-blue transition-all" style={{ width: `${uploadProgress[opts.key]}%` }} />
          </div>
        </div>
      )}
    </div>
  );

  const section = (id: string, title: string, help: string | null, children: React.ReactNode, first = false) => (
    <section aria-labelledby={id} className={first ? '' : 'mt-10 border-t border-slate-200 pt-8 dark:border-dark-border'}>
      <h2 id={id} className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h2>
      {help && <p className="mt-1 max-w-[62ch] text-sm leading-relaxed text-slate-600 dark:text-dark-text-secondary">{help}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );

  return pageShell(
    <>
      <div className="border-b border-slate-200 bg-blue-50/70 dark:border-dark-border dark:bg-dark-bg-secondary">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
          <h1 className="text-balance text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            {t('company.registration.title')}
          </h1>
          <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-slate-600 dark:text-dark-text-secondary">{tx.regIntro}</p>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        {/* Error Alert */}
        {error && (
          <div role="alert" className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200">
            <ExclamationCircleIcon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p>{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className={`${panelCls}`}>
          <div className="px-5 py-8 sm:px-9 sm:py-10">
            {section(
              'reg-company',
              tx.secCompanyTitle,
              tx.secCompanyHelp,
              <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="company_name" className={labelClasses}>
                    {t('company.registration.companyName')}{req}
                  </label>
                  <input
                    type="text"
                    name="company_name"
                    id="company_name"
                    value={formData.company_name}
                    onChange={handleInputChange}
                    placeholder={t('company.registration.companyNamePlaceholder')}
                    {...fa('company_name')}
                    className={getInputClasses('company_name')}
                  />
                  {fieldError('company_name')}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="legal_name" className={labelClasses}>
                    {t('company.registration.legalName')}{req}
                  </label>
                  <input
                    type="text"
                    name="legal_name"
                    id="legal_name"
                    value={formData.legal_name}
                    onChange={handleInputChange}
                    placeholder={t('company.registration.legalNamePlaceholder')}
                    {...fa('legal_name')}
                    className={getInputClasses('legal_name')}
                  />
                  {fieldError('legal_name')}
                </div>

                <div>
                  <label htmlFor="country_code" className={labelClasses}>
                    {tx.country}{req}
                  </label>
                  <select
                    name="country_code"
                    id="country_code"
                    value={formData.country_code || ''}
                    onChange={handleInputChange}
                    aria-required="true"
                    {...fa('country_code')}
                    className={getInputClasses('country_code')}
                  >
                    <option value="">{tx.countryPlaceholder}</option>
                    {sortedCountries.map((c) => (
                      <option key={c.code} value={c.code}>{countryName(c, lang)}</option>
                    ))}
                  </select>
                  {countriesError && (
                    <p role="alert" className="mt-1.5 text-sm text-red-600 dark:text-red-400">
                      {tx.countriesError}{' '}
                      <button type="button" onClick={loadCountries} className="font-medium underline">{tx.countriesRetry}</button>
                    </p>
                  )}
                  {fieldError('country_code')}
                </div>

                <div>
                  <label htmlFor="tax_id" className={labelClasses}>
                    {t('company.registration.taxId')}{req}
                  </label>
                  <input
                    type="text"
                    name="tax_id"
                    id="tax_id"
                    value={formData.tax_id}
                    onChange={handleInputChange}
                    placeholder={t('company.registration.taxIdPlaceholder')}
                    {...fa('tax_id')}
                    className={getInputClasses('tax_id')}
                  />
                  {fieldError('tax_id')}
                </div>

                <div>
                  <label htmlFor="industry" className={labelClasses}>
                    {tx.industryRequired}{req}
                  </label>
                  <input
                    type="text"
                    name="industry"
                    id="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    placeholder={t('company.registrationPage.industryPlaceholder')}
                    {...fa('industry')}
                    className={getInputClasses('industry')}
                  />
                  {fieldError('industry')}
                </div>

                <div>
                  <label htmlFor="company_size" className={labelClasses}>
                    {tx.sizeRequired}{req}
                  </label>
                  <select
                    name="company_size"
                    id="company_size"
                    value={formData.company_size || ''}
                    onChange={handleInputChange}
                    {...fa('company_size')}
                    className={getInputClasses('company_size')}
                  >
                    <option value="">{tx.selectSize}</option>
                    <option value="1-10">{tx.size1}</option>
                    <option value="11-50">{tx.size2}</option>
                    <option value="51-250">{tx.size3}</option>
                    <option value="250+">{tx.size4}</option>
                  </select>
                  {fieldError('company_size')}
                </div>

                <div>
                  <label htmlFor="company_email" className={labelClasses}>
                    {t('company.registration.companyEmail')}{req}
                  </label>
                  <input
                    type="email"
                    name="company_email"
                    id="company_email"
                    value={formData.company_email}
                    onChange={handleInputChange}
                    placeholder={t('company.registration.companyEmailPlaceholder')}
                    {...fa('company_email')}
                    className={getInputClasses('company_email')}
                  />
                  {fieldError('company_email')}
                </div>

                <div>
                  <label htmlFor="company_phone" className={labelClasses}>
                    {t('company.registration.companyPhone')}{opt}
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

                <div className="sm:col-span-2">
                  <label htmlFor="website_url" className={labelClasses}>
                    {t('company.registration.website')}{opt}
                  </label>
                  <input
                    type="url"
                    name="website_url"
                    id="website_url"
                    value={formData.website_url}
                    onChange={handleInputChange}
                    placeholder={t('company.registration.websitePlaceholder')}
                    {...fa('website_url')}
                    className={getInputClasses('website_url')}
                  />
                  {fieldError('website_url')}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="description" className={labelClasses}>
                    {t('company.registration.description')}{opt}
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
              </div>,
              true,
            )}

            {section(
              'reg-contact',
              tx.contactSection,
              tx.secContactHelp,
              <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="contact_name" className={labelClasses}>
                    {tx.contactName}{req}
                  </label>
                  <input
                    type="text"
                    name="contact_name"
                    id="contact_name"
                    autoComplete="name"
                    value={formData.contact_name}
                    onChange={handleInputChange}
                    {...fa('contact_name')}
                    className={getInputClasses('contact_name')}
                  />
                  {fieldError('contact_name')}
                </div>
                <div>
                  <label htmlFor="contact_position" className={labelClasses}>
                    {tx.contactPosition}{opt}
                  </label>
                  <input
                    type="text"
                    name="contact_position"
                    id="contact_position"
                    autoComplete="organization-title"
                    value={formData.contact_position}
                    onChange={handleInputChange}
                    placeholder={tx.contactPositionPlaceholder}
                    className={getInputClasses('contact_position')}
                  />
                </div>
              </div>,
            )}

            {section(
              'reg-address',
              t('company.registration.address'),
              tx.secAddressHelp,
              <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="address_street" className={labelClasses}>
                    {t('company.registration.street')}
                  </label>
                  <input type="text" name="address_street" id="address_street" value={formData.address_street} onChange={handleInputChange} className={getInputClasses('address_street')} />
                </div>
                <div>
                  <label htmlFor="address_city" className={labelClasses}>
                    {t('company.registration.city')}
                  </label>
                  <input type="text" name="address_city" id="address_city" value={formData.address_city} onChange={handleInputChange} className={getInputClasses('address_city')} />
                </div>
                <div>
                  <label htmlFor="address_state" className={labelClasses}>
                    {t('company.registration.state')}
                  </label>
                  <input type="text" name="address_state" id="address_state" value={formData.address_state} onChange={handleInputChange} className={getInputClasses('address_state')} />
                </div>
                <div>
                  <label htmlFor="address_postal" className={labelClasses}>
                    {t('company.registration.postalCode')}
                  </label>
                  <input type="text" name="address_postal" id="address_postal" value={formData.address_postal} onChange={handleInputChange} className={getInputClasses('address_postal')} />
                </div>
              </div>,
            )}

            {section(
              'reg-docs',
              tx.secDocsTitle,
              tx.docsOptionalNote,
              <div className="space-y-6">
                {uploadBox({
                  key: 'logo',
                  inputId: 'logo-upload',
                  label: t('company.registration.logo'),
                  accept: 'image/png,image/jpeg,image/jpg',
                  file: logoFile,
                  clear: () => setLogoFile(null),
                  icon: <PhotoIcon className="h-6 w-6" />,
                })}
                {uploadBox({
                  key: 'tax',
                  inputId: 'tax-upload',
                  label: t('company.registration.taxDocument'),
                  help: t('company.registration.taxDocumentHelp'),
                  accept: 'image/png,image/jpeg,image/jpg,application/pdf',
                  file: taxDocFile,
                  clear: () => setTaxDocFile(null),
                  icon: <DocumentTextIcon className="h-6 w-6" />,
                })}
                {uploadBox({
                  key: 'verification',
                  inputId: 'verification-upload',
                  label: t('company.registration.verificationDocument'),
                  help: t('company.registration.verificationDocumentHelp'),
                  accept: 'image/png,image/jpeg,image/jpg,application/pdf',
                  file: verificationDocFile,
                  clear: () => setVerificationDocFile(null),
                  icon: <ShieldCheckIcon className="h-6 w-6" />,
                })}
              </div>,
            )}

            {section(
              'reg-legal',
              tx.secLegalTitle,
              tx.secLegalHelp,
              <LegalConsentFields
                kind="empleador"
                values={consents}
                onChange={(key, value) => {
                  setConsents((prev) => ({ ...prev, [key]: value }));
                  if (validationErrors.consents) {
                    setValidationErrors((prev) => {
                      const next = { ...prev };
                      delete next.consents;
                      return next;
                    });
                  }
                }}
                disabled={loading}
                errorId="consents-err"
                errorMessage={validationErrors.consents || null}
              />,
            )}
          </div>

          {/* Submit Button: barra fija al pie para que «Enviar» siempre esté a mano */}
          <div className="sticky bottom-0 z-10 rounded-b-2xl border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur dark:border-dark-border dark:bg-dark-bg-secondary/95 sm:px-9">
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
              <p className="text-[13px] text-slate-600 dark:text-dark-text-secondary">{tx.requiredNote}</p>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full justify-center rounded-lg bg-cv-blue px-8 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-cv-blue-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-dark-bg-secondary sm:w-auto"
              >
                {loading ? t('company.registration.submitting') : t('company.registration.submit')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>,
  );
};

export default CompanyRegistrationPage;
