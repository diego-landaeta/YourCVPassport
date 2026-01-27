// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslations } from '../../hooks/useTranslations';
import { supabase } from '../../supabase/client';
import type { Company, CompanyUser, Profile } from '../../types';
import { useToastContext } from '../../context/ToastContext';
import {
  LockClosedIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  LanguageIcon,
  LinkIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

const CREDIT_COST_UNLOCK = 5; // Costo por desbloquear perfil (incluye descarga)
const CREDIT_COST_CONTACT = 3; // Costo por primer contacto/mensaje

const CompanyProfileViewPage: React.FC = () => {
  const { profileId } = useParams<{ profileId: string }>();
  const { company, companyUser } = useOutletContext<{ company: Company; companyUser: CompanyUser }>();
  const translations = useTranslations();
  const navigate = useNavigate();
  const toast = useToastContext();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [sendingContact, setSendingContact] = useState(false);
  const [hasContacted, setHasContacted] = useState(false); // Si ya contactó antes (gratis)

  // Helper function to access translations
  const t = (key: string) => {
    const keys = key.split('.');
    let value: any = translations;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  useEffect(() => {
    if (profileId && company?.id) {
      fetchProfile();
      checkUnlockStatus();
    }
  }, [profileId, company]);

  const fetchProfile = async () => {
    try {
      // Try to fetch by slug first, then by handle, then by ID
      let query = supabase
        .from('profiles')
        .select('*')
        .neq('role', 'admin');

      // Check if profileId looks like a UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profileId || '');

      if (isUUID) {
        query = query.eq('id', profileId);
      } else {
        // Try slug first, then handle
        query = query.or(`slug.eq.${profileId},handle.eq.${profileId}`);
      }

      const { data, error } = await query.single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error(t('company.profile.fetchError') || 'Error al cargar el perfil');
      navigate('/company/search');
    } finally {
      setLoading(false);
    }
  };

  const checkUnlockStatus = async () => {
    try {
      // Check if profile is unlocked
      const { data: viewData } = await supabase
        .from('company_profile_views')
        .select('*')
        .eq('company_id', company.id)
        .eq('profile_id', profileId)
        .single();

      if (viewData) {
        setIsUnlocked(true);
      }

      // Check if already contacted (for free follow-up messages)
      const { data: contactData } = await supabase
        .from('company_conversations')
        .select('id')
        .eq('company_id', company.id)
        .eq('profile_id', profileId)
        .single();

      if (contactData) {
        setHasContacted(true);
      }
    } catch (error) {
      // Profile not unlocked yet
      setIsUnlocked(false);
    }
  };

  const handleUnlockProfile = async () => {
    if (company.credit_balance < CREDIT_COST_UNLOCK) {
      toast.error(t('company.profile.insufficientCredits') || 'Créditos insuficientes. Por favor compra más créditos.');
      navigate('/company/credits');
      return;
    }

    try {
      setLoading(true);

      // Call RPC function to unlock profile and deduct credits
      const { data, error } = await supabase.rpc('unlock_profile_for_company', {
        p_company_id: company.id,
        p_profile_id: profileId,
        p_credit_cost: CREDIT_COST_UNLOCK,
        p_user_id: companyUser.user_id,
      });

      if (error) throw error;

      setIsUnlocked(true);
      setShowUnlockModal(false);

      // Log activity
      await supabase.from('company_activity_log').insert({
        company_id: company.id,
        activity_type: 'profile_unlock',
        description: `Desbloqueó perfil: ${profile?.full_name || 'Unknown'}`,
        metadata: { profile_id: profileId, cost: CREDIT_COST_UNLOCK },
        created_by: companyUser.user_id,
      });

      toast.success(t('company.profile.unlockSuccess') || '¡Perfil desbloqueado! Ahora puedes ver la información de contacto y descargar el CV.');
      window.location.reload();
    } catch (error: any) {
      console.error('Error unlocking profile:', error);
      toast.error(error.message || t('company.profile.unlockError') || 'Error al desbloquear perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCV = async () => {
    // Si no está desbloqueado, mostrar modal de desbloqueo
    if (!isUnlocked) {
      setShowUnlockModal(true);
      return;
    }

    // Una vez desbloqueado, la descarga es GRATIS (incluida en el desbloqueo)
    try {
      // Log activity (sin costo)
      await supabase.from('company_activity_log').insert({
        company_id: company.id,
        activity_type: 'cv_download',
        description: `Descargó CV: ${profile?.full_name || 'Unknown'}`,
        metadata: { profile_id: profileId, cost: 0 },
        created_by: companyUser.user_id,
      });

      downloadCV();
      toast.success('Descargando CV...');
    } catch (error: any) {
      console.error('Error downloading CV:', error);
      toast.error('Error al descargar CV');
    }
  };

  const downloadCV = () => {
    // Generate PDF or export profile data
    // This would call a Supabase function or use a library to generate PDF
    // NOTE: PDF generation pending - Requires integration with pdf generation library
    // or server-side rendering. Will be implemented in future iteration.
    // For now, users can use the browser's print-to-PDF functionality.
    console.log('Downloading CV for profile:', profileId);
    toast.info('PDF generation feature coming soon. Please use browser Print to PDF for now.');
  };

  const handleSendContact = async () => {
    if (!contactMessage.trim()) {
      toast.error('Por favor escribe un mensaje');
      return;
    }

    // Si es primer contacto y no tiene créditos suficientes
    if (!hasContacted && company.credit_balance < CREDIT_COST_CONTACT) {
      toast.error(`Necesitas ${CREDIT_COST_CONTACT} créditos para enviar el primer mensaje`);
      navigate('/company/credits');
      return;
    }

    try {
      setSendingContact(true);

      // Usar RPC para enviar mensaje (maneja créditos automáticamente)
      const { data, error } = await supabase.rpc('send_initial_company_message', {
        p_company_id: company.id,
        p_profile_id: profileId,
        p_subject: `Mensaje de ${company.company_name}`,
        p_message: contactMessage,
        p_user_id: companyUser.user_id,
      });

      if (error) throw error;

      // Log activity
      await supabase.from('company_activity_log').insert({
        company_id: company.id,
        activity_type: 'message_sent',
        description: `Envió mensaje a: ${profile?.full_name || 'Unknown'}`,
        metadata: {
          profile_id: profileId,
          cost: data?.credits_consumed || 0,
          is_new_conversation: data?.is_new_conversation || false
        },
        created_by: companyUser.user_id,
      });

      const creditMsg = data?.credits_consumed > 0
        ? ` (${data.credits_consumed} créditos)`
        : ' (gratis)';

      toast.success(`¡Mensaje enviado!${creditMsg}`);
      setShowContactModal(false);
      setContactMessage('');
      setHasContacted(true);
    } catch (error: any) {
      console.error('Error sending contact:', error);
      toast.error(error.message || 'Error al enviar mensaje');
    } finally {
      setSendingContact(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-dark-text-secondary">
            {t('common.loading') || 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-dark-text-secondary">
            {t('company.profile.notFound') || 'Profile not found'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Actions */}
        <div className="bg-white dark:bg-dark-bg-secondary shadow-lg dark:shadow-2xl rounded-lg border border-gray-200 dark:border-dark-border p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar - Always show with fallback */}
              <div className="relative flex-shrink-0">
                <img
                  src={profile.avatar_url || profile.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || 'User')}&background=2563eb&color=fff&size=200`}
                  alt={profile.full_name || ''}
                  className="h-20 w-20 rounded-full object-cover border-2 border-gray-200 dark:border-dark-border shadow-sm"
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || 'User')}&background=2563eb&color=fff&size=200`;
                  }}
                />
                {/* Premium Badge */}
                {profile.plan && profile.plan !== 'Free' && (
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-cv-green rounded-full flex items-center justify-center border-2 border-white dark:border-dark-bg-secondary shadow-sm">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {profile.full_name}
                </h1>
                {profile.professional_title && (
                  <p className="text-lg text-gray-600 dark:text-dark-text-secondary">
                    {profile.professional_title}
                  </p>
                )}
                {profile.headline && (
                  <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">
                    {profile.headline}
                  </p>
                )}
                {profile.location && (
                  <p className="text-sm text-gray-500 dark:text-dark-text-tertiary flex items-center gap-1 mt-1">
                    <MapPinIcon className="h-4 w-4" />
                    {profile.location}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {!isUnlocked ? (
                <button
                  onClick={() => setShowUnlockModal(true)}
                  className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <EyeIcon className="h-5 w-5" />
                  Desbloquear Perfil ({CREDIT_COST_UNLOCK} créditos)
                </button>
              ) : (
                <>
                  <button
                    onClick={handleDownloadCV}
                    className="px-6 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors flex items-center gap-2"
                  >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                    Descargar CV (Gratis)
                  </button>
                  <button
                    onClick={() => setShowContactModal(true)}
                    className="px-6 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors flex items-center gap-2"
                  >
                    <EnvelopeIcon className="h-5 w-5" />
                    {hasContacted ? 'Enviar Mensaje (Gratis)' : `Contactar (${CREDIT_COST_CONTACT} créditos)`}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information - Modern Locked/Unlocked Design */}
        <div className="bg-white dark:bg-dark-bg-secondary rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden mb-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-cv-blue to-cv-blue-dark dark:from-cv-blue-dark dark:to-cv-blue px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <EnvelopeIcon className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">
                  Información de Contacto
                </h2>
              </div>
              {!isUnlocked && (
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <LockClosedIcon className="h-4 w-4 text-white" />
                  <span className="text-xs font-semibold text-white">Bloqueado</span>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {!isUnlocked ? (
              /* Locked State - Beautiful and Informative */
              <div className="space-y-4">
                {/* Email */}
                <div className="group relative bg-gray-50 dark:bg-dark-bg-tertiary border border-gray-200 dark:border-dark-border rounded-lg p-4 hover:border-cv-blue dark:hover:border-cv-blue-light transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border">
                        <EnvelopeIcon className="h-5 w-5 text-gray-400 dark:text-dark-text-tertiary" />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-gray-500 dark:text-dark-text-tertiary uppercase tracking-wider mb-1 block">
                          Correo Electrónico
                        </label>
                        <div className="flex items-center gap-2">
                          <LockClosedIcon className="h-4 w-4 text-gray-400 dark:text-dark-text-tertiary" />
                          <span className="text-gray-400 dark:text-dark-text-tertiary font-mono text-sm">
                            ••••••••@••••••.com
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div className="group relative bg-gray-50 dark:bg-dark-bg-tertiary border border-gray-200 dark:border-dark-border rounded-lg p-4 hover:border-cv-blue dark:hover:border-cv-blue-light transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border">
                        <PhoneIcon className="h-5 w-5 text-gray-400 dark:text-dark-text-tertiary" />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-gray-500 dark:text-dark-text-tertiary uppercase tracking-wider mb-1 block">
                          Teléfono
                        </label>
                        <div className="flex items-center gap-2">
                          <LockClosedIcon className="h-4 w-4 text-gray-400 dark:text-dark-text-tertiary" />
                          <span className="text-gray-400 dark:text-dark-text-tertiary font-mono text-sm">
                            +•• ••• ••• •••
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* LinkedIn */}
                <div className="group relative bg-gray-50 dark:bg-dark-bg-tertiary border border-gray-200 dark:border-dark-border rounded-lg p-4 hover:border-cv-blue dark:hover:border-cv-blue-light transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="p-2 bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border">
                        <LinkIcon className="h-5 w-5 text-gray-400 dark:text-dark-text-tertiary" />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-gray-500 dark:text-dark-text-tertiary uppercase tracking-wider mb-1 block">
                          LinkedIn
                        </label>
                        <div className="flex items-center gap-2">
                          <LockClosedIcon className="h-4 w-4 text-gray-400 dark:text-dark-text-tertiary" />
                          <span className="text-gray-400 dark:text-dark-text-tertiary font-mono text-sm">
                            linkedin.com/in/••••••••
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Unlock CTA */}
                <div className="mt-6 p-4 bg-gradient-to-r from-cv-blue/10 to-cv-blue-light/10 dark:from-cv-blue-dark/20 dark:to-cv-blue/20 border border-cv-blue/20 dark:border-cv-blue-light/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-cv-blue/10 dark:bg-cv-blue-light/10 rounded-lg">
                      <EyeIcon className="h-5 w-5 text-cv-blue dark:text-cv-blue-light" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                        Desbloquea este perfil para ver la información completa
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-3">
                        Accede a correo electrónico, teléfono, LinkedIn y descarga el CV en PDF (ilimitado)
                      </p>
                      <button
                        onClick={() => setShowUnlockModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-cv-blue hover:bg-cv-blue-dark dark:bg-cv-blue-light dark:hover:bg-cv-blue text-white rounded-lg font-semibold transition-all shadow-sm hover:shadow-md"
                      >
                        <EyeIcon className="h-4 w-4" />
                        Desbloquear Perfil ({CREDIT_COST_UNLOCK} créditos)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Unlocked State - Clean and Accessible */
              <div className="space-y-4">
                {/* Email */}
                {profile.email ? (
                  <div className="group relative bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border border-green-200 dark:border-green-800/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white dark:bg-dark-bg-secondary rounded-lg border border-green-200 dark:border-green-800/30">
                        <EnvelopeIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="text-xs font-semibold text-gray-500 dark:text-dark-text-tertiary uppercase tracking-wider mb-1 block">
                          Correo Electrónico
                        </label>
                        <a
                          href={`mailto:${profile.email}`}
                          className="text-gray-900 dark:text-white font-medium hover:text-cv-blue dark:hover:text-cv-blue-light transition-colors break-all"
                        >
                          {profile.email}
                        </a>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(profile.email);
                          toast.success('Email copiado');
                        }}
                        className="p-2 hover:bg-white/50 dark:hover:bg-dark-bg-tertiary rounded-lg transition-colors"
                        title="Copiar email"
                      >
                        <svg className="w-5 h-5 text-gray-600 dark:text-dark-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-dark-bg-tertiary border border-gray-200 dark:border-dark-border rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border">
                        <EnvelopeIcon className="h-5 w-5 text-gray-400 dark:text-dark-text-tertiary" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 dark:text-dark-text-tertiary uppercase tracking-wider mb-1 block">
                          Correo Electrónico
                        </label>
                        <span className="text-gray-400 dark:text-dark-text-tertiary text-sm italic">No proporcionado</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Phone */}
                {profile.phone ? (
                  <div className="group relative bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border border-blue-200 dark:border-blue-800/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white dark:bg-dark-bg-secondary rounded-lg border border-blue-200 dark:border-blue-800/30">
                        <PhoneIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="text-xs font-semibold text-gray-500 dark:text-dark-text-tertiary uppercase tracking-wider mb-1 block">
                          Teléfono
                        </label>
                        <a
                          href={`tel:${profile.phone}`}
                          className="text-gray-900 dark:text-white font-medium hover:text-cv-blue dark:hover:text-cv-blue-light transition-colors"
                        >
                          {profile.phone}
                        </a>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(profile.phone);
                          toast.success('Teléfono copiado');
                        }}
                        className="p-2 hover:bg-white/50 dark:hover:bg-dark-bg-tertiary rounded-lg transition-colors"
                        title="Copiar teléfono"
                      >
                        <svg className="w-5 h-5 text-gray-600 dark:text-dark-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-dark-bg-tertiary border border-gray-200 dark:border-dark-border rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border">
                        <PhoneIcon className="h-5 w-5 text-gray-400 dark:text-dark-text-tertiary" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 dark:text-dark-text-tertiary uppercase tracking-wider mb-1 block">
                          Teléfono
                        </label>
                        <span className="text-gray-400 dark:text-dark-text-tertiary text-sm italic">No proporcionado</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* LinkedIn */}
                {profile.linkedin_url ? (
                  <div className="group relative bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/10 dark:to-violet-900/10 border border-purple-200 dark:border-purple-800/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-white dark:bg-dark-bg-secondary rounded-lg border border-purple-200 dark:border-purple-800/30">
                        <LinkIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="text-xs font-semibold text-gray-500 dark:text-dark-text-tertiary uppercase tracking-wider mb-1 block">
                          LinkedIn
                        </label>
                        <a
                          href={profile.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-900 dark:text-white font-medium hover:text-cv-blue dark:hover:text-cv-blue-light transition-colors inline-flex items-center gap-1"
                        >
                          Ver perfil de LinkedIn
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(profile.linkedin_url);
                          toast.success('URL copiada');
                        }}
                        className="p-2 hover:bg-white/50 dark:hover:bg-dark-bg-tertiary rounded-lg transition-colors"
                        title="Copiar URL"
                      >
                        <svg className="w-5 h-5 text-gray-600 dark:text-dark-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-dark-bg-tertiary border border-gray-200 dark:border-dark-border rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border">
                        <LinkIcon className="h-5 w-5 text-gray-400 dark:text-dark-text-tertiary" />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 dark:text-dark-text-tertiary uppercase tracking-wider mb-1 block">
                          LinkedIn
                        </label>
                        <span className="text-gray-400 dark:text-dark-text-tertiary text-sm italic">No proporcionado</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="bg-white dark:bg-dark-bg-secondary shadow-lg dark:shadow-2xl rounded-lg border border-gray-200 dark:border-dark-border p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text-primary mb-4">
              {t('company.profile.about') || 'About'}
            </h2>
            <p className="text-gray-700 dark:text-dark-text-secondary whitespace-pre-wrap">
              {profile.bio}
            </p>
          </div>
        )}

        {/* Skills */}
        {profile.skills && profile.skills.length > 0 && (
          <div className="bg-white dark:bg-dark-bg-secondary shadow-lg dark:shadow-2xl rounded-lg border border-gray-200 dark:border-dark-border p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text-primary mb-4">
              {t('company.profile.skills') || 'Skills'}
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill: any, index: number) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400"
                >
                  {skill.name}
                  {skill.level && (
                    <span className="ml-2 text-xs text-blue-600 dark:text-blue-300">
                      • {skill.level}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Work Experience */}
        {profile.work_experience && profile.work_experience.length > 0 && (
          <div className="bg-white dark:bg-dark-bg-secondary shadow-lg dark:shadow-2xl rounded-lg border border-gray-200 dark:border-dark-border p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text-primary mb-4 flex items-center gap-2">
              <BriefcaseIcon className="h-6 w-6" />
              {t('company.profile.experience') || 'Work Experience'}
            </h2>
            <div className="space-y-6">
              {profile.work_experience.map((exp: any, index: number) => (
                <div key={index} className="border-l-2 border-blue-600 dark:border-blue-400 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">
                    {exp.position}
                  </h3>
                  <p className="text-gray-600 dark:text-dark-text-secondary">
                    {exp.company}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-dark-text-tertiary">
                    {exp.start_date} - {exp.end_date || t('common.present') || 'Present'}
                  </p>
                  {exp.description && (
                    <p className="mt-2 text-gray-700 dark:text-dark-text-secondary">
                      {exp.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {profile.education && profile.education.length > 0 && (
          <div className="bg-white dark:bg-dark-bg-secondary shadow-lg dark:shadow-2xl rounded-lg border border-gray-200 dark:border-dark-border p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text-primary mb-4 flex items-center gap-2">
              <AcademicCapIcon className="h-6 w-6" />
              {t('company.profile.education') || 'Education'}
            </h2>
            <div className="space-y-4">
              {profile.education.map((edu: any, index: number) => (
                <div key={index}>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">
                    {edu.degree}
                  </h3>
                  <p className="text-gray-600 dark:text-dark-text-secondary">
                    {edu.institution}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-dark-text-tertiary">
                    {edu.start_date} - {edu.end_date || t('common.present') || 'Present'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {profile.languages && profile.languages.length > 0 && (
          <div className="bg-white dark:bg-dark-bg-secondary shadow-lg dark:shadow-2xl rounded-lg border border-gray-200 dark:border-dark-border p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text-primary mb-4 flex items-center gap-2">
              <LanguageIcon className="h-6 w-6" />
              {t('company.profile.languages') || 'Languages'}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {profile.languages.map((lang: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-900 dark:text-dark-text-primary">{lang.language}</span>
                  <span className="text-sm text-gray-500 dark:text-dark-text-tertiary">{lang.proficiency}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unlock Modal */}
        {showUnlockModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-bg-secondary rounded-xl max-w-md w-full overflow-hidden border border-gray-200 dark:border-dark-border shadow-2xl">
              {/* Header */}
              <div className="bg-gradient-to-r from-cv-blue to-cv-blue-dark p-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white">
                    Desbloquear Perfil
                  </h3>
                  <button
                    onClick={() => setShowUnlockModal(false)}
                    className="text-white/80 hover:text-white"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-gray-600 dark:text-dark-text-secondary mb-4">
                  ¿Deseas desbloquear este perfil?
                </p>

                {/* What you get */}
                <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4 mb-4">
                  <p className="text-sm font-semibold text-gray-700 dark:text-dark-text-primary mb-2">
                    Al desbloquear tendrás acceso a:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-dark-text-secondary">
                      <CheckIcon className="h-4 w-4 text-green-500" />
                      Correo electrónico completo
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-dark-text-secondary">
                      <CheckIcon className="h-4 w-4 text-green-500" />
                      Número de teléfono
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-dark-text-secondary">
                      <CheckIcon className="h-4 w-4 text-green-500" />
                      LinkedIn y portfolio
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-dark-text-secondary">
                      <CheckIcon className="h-4 w-4 text-green-500" />
                      Descargar CV en PDF (ilimitado)
                    </li>
                  </ul>
                </div>

                {/* Cost summary */}
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-4">
                  <span className="text-gray-700 dark:text-dark-text-secondary">Costo:</span>
                  <span className="text-xl font-bold text-cv-blue dark:text-cv-blue-light">
                    {CREDIT_COST_UNLOCK} créditos
                  </span>
                </div>

                {/* Current balance */}
                <div className="flex items-center justify-between text-sm mb-6">
                  <span className="text-gray-500 dark:text-dark-text-tertiary">Tu balance actual:</span>
                  <span className={`font-semibold ${company.credit_balance >= CREDIT_COST_UNLOCK ? 'text-green-600' : 'text-red-600'}`}>
                    {company.credit_balance} créditos
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowUnlockModal(false)}
                    className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleUnlockProfile}
                    disabled={company.credit_balance < CREDIT_COST_UNLOCK}
                    className="flex-1 px-4 py-2.5 bg-cv-blue text-white rounded-lg hover:bg-cv-blue-dark font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Desbloquear
                  </button>
                </div>

                {company.credit_balance < CREDIT_COST_UNLOCK && (
                  <p className="text-center text-sm text-red-500 mt-3">
                    Créditos insuficientes.{' '}
                    <button
                      onClick={() => navigate('/company/credits')}
                      className="text-cv-blue hover:underline"
                    >
                      Comprar más
                    </button>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Contact Modal */}
        {showContactModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-dark-bg-secondary rounded-lg max-w-md w-full p-6 border border-gray-200 dark:border-dark-border">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-dark-text-primary">
                  {t('company.profile.sendMessage') || 'Send Message'}
                </h3>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <textarea
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder={t('company.profile.messagePlaceholder') || 'Enter your message...'}
                rows={6}
                className="block w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowContactModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  {t('common.cancel') || 'Cancel'}
                </button>
                <button
                  onClick={handleSendContact}
                  disabled={sendingContact}
                  className="flex-1 px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 disabled:opacity-50"
                >
                  {sendingContact ? (t('common.sending') || 'Sending...') : (t('common.send') || 'Send')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyProfileViewPage;
