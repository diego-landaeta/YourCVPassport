import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase/client';
import { Link } from 'react-router-dom';
import { CountryBadge } from '../shared/CountrySelector';
import AlertModal from '../shared/AlertModal';
import { useCustomDialog } from '../../hooks/useCustomDialog';
import { useEnterpriseAdmin, UserEnterpriseFeatures } from '../../hooks/useEnterpriseFeatures';
import { useLanguage } from '../../contexts/LanguageContext';
import { sanitizeSlug, validateSlugFormat } from '../../utils/slugUtils';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  headline: string;
  country_code?: string;
  location: string;
  plan: string;
  role: string;
  slug: string;
  created_at: string;
  updated_at: string;
  photo_url?: string;
}

const ProfilesManagement: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState<string | null>(null);

  // Enterprise features state
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);
  const [enterpriseProfile, setEnterpriseProfile] = useState<Profile | null>(null);
  const [userFeatures, setUserFeatures] = useState<UserEnterpriseFeatures | null>(null);
  const [loadingFeatures, setLoadingFeatures] = useState(false);

  // Slug validation state
  const [slugError, setSlugError] = useState<string>('');
  const [slugChecking, setSlugChecking] = useState(false);

  const { dialogState, showAlert, showConfirm, closeDialog, handleConfirm, handleCancel } = useCustomDialog();
  const { getUserFeatures, setUserFeature, grantEnterprisePlan } = useEnterpriseAdmin();
  const { lang } = useLanguage();

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false});

      if (error) {
        console.error('Error loading profiles:', error);
        throw error;
      }

      console.log('Loaded profiles:', data);
      setProfiles(data || []);
    } catch (err) {
      console.error('Exception loading profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (profileId: string, updates: Partial<Profile>, showSuccessMessage: boolean = true) => {
    try {
      // If updating slug, validate it first
      if (updates.slug !== undefined) {
        const validation = validateSlugFormat(updates.slug);
        if (!validation.isValid) {
          setSlugError(validation.error || 'Formato de URL inválido');
          return;
        }

        // Check if slug is already taken by another user
        const { data: existingProfile, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('slug', updates.slug)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          throw new Error('Error al verificar disponibilidad de la URL');
        }

        if (existingProfile && existingProfile.id !== profileId) {
          setSlugError('Esta URL ya está en uso. Por favor elige otra.');
          return;
        }

        // Admin can change slug without 90-day restriction, so we update last_slug_changed_at
        updates = {
          ...updates,
          last_slug_changed_at: new Date().toISOString()
        } as any;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', profileId);

      if (error) throw error;

      // Update local state immediately for inline edits
      setProfiles(prev => prev.map(p =>
        p.id === profileId ? { ...p, ...updates } : p
      ));

      if (showSuccessMessage) {
        showAlert({
          title: 'Éxito',
          message: 'Perfil actualizado correctamente',
          type: 'success'
        });
      }
      setShowEditModal(false);
      setSlugError('');
    } catch (err: any) {
      showAlert({
        title: 'Error',
        message: 'Error al actualizar perfil: ' + err.message,
        type: 'error'
      });
      // Reload to ensure consistency if error
      loadProfiles();
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    const confirmed = await showConfirm({
      title: 'Confirmar eliminación',
      message: '¿Estás seguro de que quieres eliminar este perfil? Esta acción no se puede deshacer.',
      type: 'warning',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar'
    });

    if (!confirmed) {
      return;
    }

    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('No hay sesión activa');
      }

      // Call the admin API endpoint to delete the user
      const response = await fetch(`/api/admin/users/${profileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      // Handle response - check status first, then try to parse JSON
      let data: any = {};
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (e) {
          // JSON parsing failed - response might be empty
          console.error('Failed to parse response JSON:', e);
        }
      }

      if (!response.ok) {
        throw new Error(data.error || data.details || `Error del servidor: ${response.status}`);
      }

      showAlert({
        title: 'Éxito',
        message: 'Perfil eliminado correctamente',
        type: 'success'
      });
      loadProfiles();
    } catch (err: any) {
      showAlert({
        title: 'Error',
        message: 'Error al eliminar perfil: ' + err.message,
        type: 'error'
      });
    }
  };

  const handleDownloadCV = async (profile: Profile, type: 'exact' | 'ats' | 'selectable' = 'exact') => {
    try {
      setDownloadingPDF(profile.id);

      if (type === 'exact') {
        // Descarga exacta de la vista web - Dynamic import
        const { generateCVPDF } = await import('../../utils/pdfGenerator');
        await generateCVPDF({
          profileSlug: profile.slug,
          profileId: profile.id,
          fileName: `CV-${profile.full_name || 'usuario'}-${new Date().toISOString().split('T')[0]}.pdf`,
          onProgress: (progress: number) => {
            console.log(`Generando PDF exacto: ${progress}%`);
          },
          onSuccess: () => {
            showAlert({
              title: 'Éxito',
              message: 'CV descargado correctamente (vista web exacta)',
              type: 'success'
            });
            setDownloadingPDF(null);
          },
          onError: (error: Error) => {
            showAlert({
              title: 'Error',
              message: 'Error al descargar CV: ' + error.message,
              type: 'error'
            });
            setDownloadingPDF(null);
          }
        });
      } else if (type === 'selectable') {
        // PDF con texto seleccionable usando window.print() - Dynamic import
        const { generatePrintablePDF } = await import('../../utils/printablePDFGenerator');
        await generatePrintablePDF({
          profileSlug: profile.slug,
          profileId: profile.id,
          onSuccess: () => {
            showAlert({
              title: 'Éxito',
              message: 'Usa "Guardar como PDF" en el diálogo de impresión para descargar tu CV con texto seleccionable',
              type: 'success'
            });
            setDownloadingPDF(null);
          },
          onError: (error: Error) => {
            showAlert({
              title: 'Error',
              message: 'Error al preparar el CV: ' + error.message,
              type: 'error'
            });
            setDownloadingPDF(null);
          }
        });
      } else {
        // Descarga optimizada para ATS - Dynamic import
        const { generateAdminPDF } = await import('../../utils/adminPDFGenerator');
        await generateAdminPDF({
          profileId: profile.id,
          profileSlug: profile.slug,
          fileName: `CV-ATS-${profile.full_name || 'usuario'}-${new Date().toISOString().split('T')[0]}.pdf`,
          template: 'modern',
          onProgress: (progress: number) => {
            console.log(`Generando PDF ATS: ${progress}%`);
          },
          onSuccess: () => {
            showAlert({
              title: 'Éxito',
              message: 'CV optimizado para ATS descargado correctamente',
              type: 'success'
            });
            setDownloadingPDF(null);
          },
          onError: (error: Error) => {
            showAlert({
              title: 'Error',
              message: 'Error al descargar CV ATS: ' + error.message,
              type: 'error'
            });
            setDownloadingPDF(null);
          }
        });
      }
    } catch (err: any) {
      showAlert({
        title: 'Error',
        message: 'Error al descargar CV: ' + err.message,
        type: 'error'
      });
      setDownloadingPDF(null);
    }
  };

  // Slug handling functions
  const handleSlugChange = (value: string) => {
    if (!selectedProfile) return;

    // Sanitize the slug as user types
    const sanitized = sanitizeSlug(value);
    setSelectedProfile({ ...selectedProfile, slug: sanitized });

    // Clear error when user starts typing
    if (slugError) {
      setSlugError('');
    }
  };

  const handleSlugBlur = async () => {
    if (!selectedProfile?.slug) return;

    // Validate format
    const validation = validateSlugFormat(selectedProfile.slug);
    if (!validation.isValid) {
      setSlugError(validation.error || 'Formato de URL inválido');
      return;
    }

    // Check availability (only if different from current)
    const currentSlug = profiles.find(p => p.id === selectedProfile.id)?.slug;
    if (selectedProfile.slug !== currentSlug) {
      setSlugChecking(true);
      try {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('slug', selectedProfile.slug)
          .single();

        if (existingProfile && existingProfile.id !== selectedProfile.id) {
          setSlugError('Esta URL ya está en uso');
        }
      } catch (err) {
        // No profile found means slug is available
      } finally {
        setSlugChecking(false);
      }
    }
  };

  // Enterprise features functions
  const handleOpenEnterpriseModal = async (profile: Profile) => {
    setEnterpriseProfile(profile);
    setShowEnterpriseModal(true);
    setLoadingFeatures(true);
    try {
      const features = await getUserFeatures(profile.id);
      setUserFeatures(features);
    } catch (err) {
      console.error('Error loading enterprise features:', err);
      showAlert({
        title: 'Error',
        message: 'Error al cargar las funcionalidades Enterprise',
        type: 'error'
      });
    } finally {
      setLoadingFeatures(false);
    }
  };

  const handleToggleFeature = async (featureKey: string, enabled: boolean) => {
    if (!enterpriseProfile) return;
    try {
      await setUserFeature(enterpriseProfile.id, featureKey, enabled);
      // Reload features
      const features = await getUserFeatures(enterpriseProfile.id);
      setUserFeatures(features);
    } catch (err: any) {
      showAlert({
        title: 'Error',
        message: err.message || 'Error al actualizar la funcionalidad',
        type: 'error'
      });
    }
  };

  const handleGrantEnterprise = async () => {
    if (!enterpriseProfile) return;
    try {
      await grantEnterprisePlan(enterpriseProfile.id, 'Actualizado a Enterprise por admin');
      showAlert({
        title: 'Éxito',
        message: 'Usuario actualizado a Enterprise con todas las funcionalidades',
        type: 'success'
      });
      loadProfiles();
      const features = await getUserFeatures(enterpriseProfile.id);
      setUserFeatures(features);
    } catch (err: any) {
      showAlert({
        title: 'Error',
        message: err.message || 'Error al otorgar plan Enterprise',
        type: 'error'
      });
    }
  };

  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch =
      profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.headline?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPlan = filterPlan === 'all' || profile.plan === filterPlan;

    return matchesSearch && matchesPlan;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cv-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestión de Perfiles
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {filteredProfiles.length} perfiles encontrados
          </p>
        </div>
        <button
          onClick={loadProfiles}
          className="px-4 py-2 bg-cv-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Recargar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {profiles.filter(p => !p.plan || p.plan === 'free').length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Free</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {profiles.filter(p => p.plan === 'basic').length}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wide">Basic</div>
        </div>
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {profiles.filter(p => p.plan === 'pro').length}
          </div>
          <div className="text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">Pro</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {profiles.filter(p => p.plan === 'enterprise').length}
          </div>
          <div className="text-xs text-purple-600 dark:text-purple-400 uppercase tracking-wide">Enterprise</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-dark-bg-secondary rounded-lg p-4 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Buscar
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nombre, email, headline..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filtrar por Plan
            </label>
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
            >
              <option value="all">Todos los planes</option>
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        </div>
      </div>

      {/* Profiles Table */}
      <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow-md">
        <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-dark-bg-tertiary">
            <tr>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{ width: '280px', maxWidth: '280px' }}>
                Usuario
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{ width: '180px', maxWidth: '180px' }}>
                Email
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{ width: '150px', maxWidth: '150px' }}>
                URL Personalizada
              </th>
              <th scope="col" className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">
                País
              </th>
              <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">
                Plan
              </th>
              <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">
                Registro
              </th>
              <th scope="col" className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-dark-bg-secondary divide-y divide-gray-200 dark:divide-gray-700">
            {filteredProfiles.map((profile) => (
              <tr key={profile.id} className="hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors">
                <td className="px-3 py-2" style={{ maxWidth: '280px' }}>
                  <div className="flex items-center gap-2">
                    <div className="flex-shrink-0 h-8 w-8">
                      {(profile as any).photo_url || (profile as any).avatar_url || (profile as any).profile_photo_url ? (
                        <img
                          className="h-8 w-8 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                          src={(profile as any).photo_url || (profile as any).avatar_url || (profile as any).profile_photo_url || ''}
                          alt={profile.full_name || 'User'}
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.src = '';
                            img.style.display = 'none';
                            const parent = img.parentElement;
                            if (parent) {
                              const initial = (profile.full_name || profile.email || '?')[0].toUpperCase();
                              const color = `hsl(${(profile.full_name?.charCodeAt(0) || 0) * 137.5 % 360}, 70%, 50%)`;
                              parent.innerHTML = `<div class="h-8 w-8 rounded-full flex items-center justify-center text-white font-semibold text-xs" style="background-color: ${color}">${initial}</div>`;
                            }
                          }}
                        />
                      ) : (
                        <div
                          className="h-8 w-8 rounded-full flex items-center justify-center text-white font-semibold text-xs"
                          style={{ backgroundColor: `hsl(${(profile.full_name?.charCodeAt(0) || 0) * 137.5 % 360}, 70%, 50%)` }}
                        >
                          {(profile.full_name || profile.email || '?')[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div style={{ maxWidth: '220px' }}>
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate" title={profile.full_name || 'Sin nombre'}>
                        {profile.full_name || 'Sin nombre'}
                      </div>
                      {profile.headline && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate" title={profile.headline}>
                          {profile.headline}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2" style={{ maxWidth: '180px' }}>
                  <div className="text-xs text-gray-900 dark:text-white truncate" title={profile.email || 'N/A'}>
                    {profile.email || 'N/A'}
                  </div>
                </td>
                <td className="px-3 py-2" style={{ maxWidth: '150px' }}>
                  <div className="text-xs font-mono text-cv-blue dark:text-blue-400 truncate" title={profile.slug || 'Sin URL'}>
                    {profile.slug ? (
                      <a
                        href={`/cv/${profile.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {profile.slug}
                      </a>
                    ) : (
                      <span className="text-gray-400">Sin URL</span>
                    )}
                  </div>
                </td>
                <td className="px-2 py-2 text-center">
                  {profile.country_code ? (
                    <CountryBadge countryCode={profile.country_code} size="sm" />
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </td>
                <td className="px-2 py-2">
                  <select
                    value={profile.plan || 'free'}
                    onChange={(e) => handleUpdateProfile(profile.id, { plan: e.target.value }, false)}
                    className={`text-xs font-medium rounded px-1.5 py-0.5 border-0 cursor-pointer focus:ring-1 focus:ring-offset-0 ${
                      profile.plan === 'enterprise'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 focus:ring-purple-500'
                        : profile.plan === 'pro'
                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 focus:ring-indigo-500'
                        : profile.plan === 'basic'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 focus:ring-blue-500'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 focus:ring-gray-500'
                    }`}
                  >
                    <option value="free">Free</option>
                    <option value="basic">Basic</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </td>
                <td className="px-2 py-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {profile.created_at ? new Date(profile.created_at).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      year: '2-digit'
                    }) : '-'}
                  </div>
                </td>
                <td className="px-2 py-2">
                  <div className="flex items-center justify-center gap-0.5">
                    <Link
                      to={`/cv/${profile.slug || profile.id}`}
                      target="_blank"
                      className="p-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded transition-all"
                      title="Ver CV"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </Link>
                    <div className="relative group">
                      <button
                        disabled={downloadingPDF === profile.id}
                        className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 dark:text-green-400 rounded transition-colors disabled:opacity-50"
                        title="Descargar CV"
                      >
                        {downloadingPDF === profile.id ? (
                          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                      </button>
                      <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-dark-bg-tertiary rounded shadow-lg border border-gray-200 dark:border-gray-600 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        <button
                          onClick={() => handleDownloadCV(profile, 'exact')}
                          disabled={downloadingPDF === profile.id}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t border-b border-gray-100 dark:border-gray-600"
                        >
                          <div className="font-medium text-gray-900 dark:text-gray-100">Vista Web (Imagen)</div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Captura visual, texto no seleccionable</div>
                        </button>
                        <button
                          onClick={() => handleDownloadCV(profile, 'selectable')}
                          disabled={downloadingPDF === profile.id}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 border-b border-gray-100 dark:border-gray-600 relative"
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-gray-900 dark:text-gray-100">PDF con Texto Seleccionable</div>
                            <span className="text-[9px] bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-1.5 py-0.5 rounded font-semibold">
                              Recomendado
                            </span>
                          </div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Abre diálogo de impresión, guarda como PDF (texto 100% seleccionable)</div>
                        </button>
                        <button
                          onClick={() => handleDownloadCV(profile, 'ats')}
                          disabled={downloadingPDF === profile.id}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b"
                        >
                          <div className="font-medium text-gray-900 dark:text-gray-100">ATS Optimizado</div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Para sistemas automáticos de parsing</div>
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenEnterpriseModal(profile)}
                      className={`p-1.5 rounded transition-colors ${
                        profile.plan === 'enterprise'
                          ? 'text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 dark:text-purple-400'
                          : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-500'
                      }`}
                      title="Enterprise Features"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedProfile(profile);
                        setShowEditModal(true);
                      }}
                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 dark:text-indigo-400 rounded transition-colors"
                      title="Editar"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteProfile(profile.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:text-red-400 rounded transition-colors"
                      title="Eliminar"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-bg-secondary rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Editar Perfil
                </h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={selectedProfile.full_name || ''}
                    onChange={(e) => setSelectedProfile({ ...selectedProfile, full_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Headline
                  </label>
                  <input
                    type="text"
                    value={selectedProfile.headline || ''}
                    onChange={(e) => setSelectedProfile({ ...selectedProfile, headline: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    URL Personalizada (Slug)
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        yourcvpassport.com/cv/
                      </span>
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={selectedProfile.slug || ''}
                          onChange={(e) => handleSlugChange(e.target.value)}
                          onBlur={handleSlugBlur}
                          placeholder="tu-nombre-profesion"
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 dark:bg-dark-bg-tertiary dark:text-white ${
                            slugError
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-gray-300 dark:border-gray-600 focus:ring-cv-blue'
                          }`}
                        />
                        {slugChecking && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cv-blue"></div>
                          </div>
                        )}
                      </div>
                    </div>
                    {slugError && (
                      <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {slugError}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Solo letras minúsculas, números y guiones. Mínimo 3 caracteres.
                    </p>
                    <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div className="text-xs text-amber-800 dark:text-amber-200">
                        <strong>Nota del administrador:</strong> Puedes cambiar la URL sin restricciones de tiempo. Los usuarios normales solo pueden cambiar su URL cada 90 días.
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Plan
                  </label>
                  <select
                    value={selectedProfile.plan || 'free'}
                    onChange={(e) => setSelectedProfile({ ...selectedProfile, plan: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                  >
                    <option value="free">Free - 1 export/mes, sin IA</option>
                    <option value="basic">Basic - 5 exports/mes, 20 IA/mes</option>
                    <option value="pro">Pro - Ilimitado</option>
                    <option value="enterprise">Enterprise - Ilimitado + extras</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rol
                  </label>
                  <select
                    value={selectedProfile.role || 'user'}
                    onChange={(e) => setSelectedProfile({ ...selectedProfile, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => handleUpdateProfile(selectedProfile.id, selectedProfile)}
                    disabled={!!slugError || slugChecking}
                    className="flex-1 px-4 py-2 bg-cv-blue text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {slugChecking ? 'Verificando...' : 'Guardar Cambios'}
                  </button>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSlugError('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enterprise Features Modal */}
      {showEnterpriseModal && enterpriseProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-bg-secondary rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    Enterprise Features
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {enterpriseProfile.full_name || enterpriseProfile.email} - Plan: <span className={`font-medium ${
                      enterpriseProfile.plan === 'enterprise' ? 'text-purple-600' :
                      enterpriseProfile.plan === 'pro' ? 'text-indigo-600' :
                      enterpriseProfile.plan === 'basic' ? 'text-blue-600' : 'text-gray-600'
                    }`}>{enterpriseProfile.plan || 'free'}</span>
                  </p>
                </div>
                <button
                  onClick={() => setShowEnterpriseModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {enterpriseProfile.plan !== 'enterprise' && (
                <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-purple-900 dark:text-purple-200">
                        Actualizar a Enterprise
                      </p>
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        Otorga acceso a todas las funcionalidades Enterprise
                      </p>
                    </div>
                    <button
                      onClick={handleGrantEnterprise}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Activar Enterprise
                    </button>
                  </div>
                </div>
              )}

              {loadingFeatures ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : userFeatures ? (
                <div className="space-y-6">
                  {/* Group features by category */}
                  {['support', 'integration', 'customization', 'analytics', 'team', 'content'].map(category => {
                    const categoryFeatures = userFeatures.features.filter(f => f.category === category);
                    if (categoryFeatures.length === 0) return null;

                    const categoryLabels: Record<string, { es: string; en: string }> = {
                      support: { es: 'Soporte', en: 'Support' },
                      integration: { es: 'Integración', en: 'Integration' },
                      customization: { es: 'Personalización', en: 'Customization' },
                      analytics: { es: 'Analytics', en: 'Analytics' },
                      team: { es: 'Equipo', en: 'Team' },
                      content: { es: 'Contenido', en: 'Content' }
                    };

                    return (
                      <div key={category}>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
                          {categoryLabels[category]?.[lang] || category}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {categoryFeatures.map(feature => (
                            <div
                              key={feature.feature_key}
                              className={`p-3 rounded-lg border transition-all ${
                                feature.has_feature
                                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                  : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">{getIconEmoji(feature.icon)}</span>
                                    <span className="font-medium text-gray-900 dark:text-white text-sm">
                                      {lang === 'es' ? feature.name_es : feature.name_en}
                                    </span>
                                    {feature.source === 'enterprise_default' && (
                                      <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded">
                                        Default
                                      </span>
                                    )}
                                    {feature.source === 'custom_grant' && (
                                      <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded">
                                        Custom
                                      </span>
                                    )}
                                  </div>
                                  {(lang === 'es' ? feature.description_es : feature.description_en) && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                      {lang === 'es' ? feature.description_es : feature.description_en}
                                    </p>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleToggleFeature(feature.feature_key, !feature.has_feature)}
                                  className={`ml-3 relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                    feature.has_feature ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                                  }`}
                                >
                                  <span
                                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                      feature.has_feature ? 'translate-x-5' : 'translate-x-1'
                                    }`}
                                  />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No se pudieron cargar las funcionalidades
                </div>
              )}

              <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowEnterpriseModal(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AlertModal
        isOpen={dialogState.isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={dialogState.title}
        message={dialogState.message}
        type={dialogState.type}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        showCancel={dialogState.showCancel}
      />
    </div>
  );
};

// Helper function to get emoji for icon names
function getIconEmoji(icon: string): string {
  const iconMap: Record<string, string> = {
    'star': '⭐',
    'headset': '🎧',
    'user-tie': '👔',
    'clock': '🕐',
    'code': '💻',
    'bell': '🔔',
    'link': '🔗',
    'key': '🔑',
    'palette': '🎨',
    'globe': '🌐',
    'brush': '🖌️',
    'mail': '📧',
    'chart-bar': '📊',
    'download': '📥',
    'users': '👥',
    'users-cog': '⚙️',
    'shield': '🛡️',
    'layers': '📚',
    'cpu': '🤖',
    'video': '🎬',
    'check': '✅',
    'sparkles': '✨',
  };
  return iconMap[icon] || '⭐';
}

export default ProfilesManagement;

