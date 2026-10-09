import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../supabase/client';
import Pagination from '../ui/Pagination';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { buildIlikeOrFilter, combineOrGroups } from '../../utils/postgrestSearch';
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
  avatar_url?: string;
}

const PAGE_SIZE = 25;

// Solo las columnas que usa la vista y el modal de edicion (antes select('*')).
// No se piden photo_url/profile_photo_url: no consta que existan en BD y una
// columna inexistente haria fallar la consulta entera (400).
const PROFILE_COLUMNS =
  'id,full_name,email,headline,country_code,location,plan,role,slug,created_at,updated_at,avatar_url';

const PLANS = ['free', 'basic', 'pro', 'enterprise'] as const;
type PlanCounts = Record<(typeof PLANS)[number], number>;

/** Indicador de foco de teclado comun a los botones de icono. */
const FOCUS_RING = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-1 dark:focus-visible:ring-blue-400 dark:focus-visible:ring-offset-dark-bg-secondary';

const LOCAL_TEXT = {
  es: {
    title: 'Gestión de Perfiles',
    found: (n: number) => `${n} perfiles encontrados`,
    reload: 'Recargar',
    search: 'Buscar',
    searchPlaceholder: 'Nombre, email, headline...',
    filterPlan: 'Filtrar por Plan',
    allPlans: 'Todos los planes',
    showing: (from: number, to: number, total: number) => `Mostrando ${from}–${to} de ${total}`,
    updating: 'Actualizando…',
    loadError: 'No se pudieron cargar los perfiles.',
    retry: 'Reintentar',
    noResults: 'No se encontraron perfiles con estos filtros.',
    roles: { professional: 'Profesional', employer: 'Empresa', profile_manager: 'Gestor de perfiles', admin: 'Administrador' },
    cols: { user: 'Usuario', email: 'Email', url: 'URL Personalizada', country: 'País', plan: 'Plan', joined: 'Registro', actions: 'Acciones' },
    tableCaption: 'Perfiles registrados',
    noName: 'Sin nombre',
    noUrl: 'Sin URL',
    planOf: (name: string) => `Plan de ${name}`,
    viewCv: 'Ver CV',
    downloadCv: 'Descargar CV',
    downloadOptions: (name: string) => `Opciones de descarga del CV de ${name}`,
    download: {
      exact: 'Vista Web (Imagen)',
      exactDesc: 'Captura visual, texto no seleccionable',
      selectable: 'PDF con Texto Seleccionable',
      recommended: 'Recomendado',
      selectableDesc: 'Abre diálogo de impresión, guarda como PDF (texto 100% seleccionable)',
      ats: 'ATS Optimizado',
      atsDesc: 'Para sistemas automáticos de parsing',
    },
    enterpriseFeatures: 'Funcionalidades Enterprise',
    edit: 'Editar',
    delete: 'Eliminar',
    close: 'Cerrar',
    success: 'Éxito',
    error: 'Error',
    profileUpdated: 'Perfil actualizado correctamente',
    updateError: 'Error al actualizar perfil: ',
    deleteTitle: 'Confirmar eliminación',
    deleteMessage: '¿Estás seguro de que quieres eliminar este perfil? Esta acción no se puede deshacer.',
    cancel: 'Cancelar',
    noSession: 'No hay sesión activa',
    serverError: (status: number) => `Error del servidor: ${status}`,
    profileDeleted: 'Perfil eliminado correctamente',
    deleteError: 'Error al eliminar perfil: ',
    cvDownloaded: 'CV descargado correctamente (vista web exacta)',
    cvDownloadError: 'Error al descargar CV: ',
    printHint: 'Usa "Guardar como PDF" en el diálogo de impresión para descargar tu CV con texto seleccionable',
    cvPrepareError: 'Error al preparar el CV: ',
    atsDownloaded: 'CV optimizado para ATS descargado correctamente',
    atsDownloadError: 'Error al descargar CV ATS: ',
    fileUser: 'usuario',
    slugInvalid: 'Formato de URL inválido',
    slugCheckError: 'Error al verificar disponibilidad de la URL',
    slugTaken: 'Esta URL ya está en uso. Por favor elige otra.',
    slugTakenShort: 'Esta URL ya está en uso',
    // validateSlugFormat devuelve los mensajes en ingles
    slugErrors: {
      'Slug is required': 'La URL es obligatoria',
      'Minimum 3 characters required': 'Mínimo 3 caracteres',
      'Maximum 50 characters allowed': 'Máximo 50 caracteres',
      'Only lowercase letters, numbers, and hyphens allowed': 'Solo letras minúsculas, números y guiones',
      'Cannot start or end with hyphen': 'No puede empezar ni terminar con guion',
      'Cannot contain consecutive hyphens': 'No puede contener guiones consecutivos',
    } as Record<string, string>,
    featuresLoadError: 'Error al cargar las funcionalidades Enterprise',
    featureUpdateError: 'Error al actualizar la funcionalidad',
    enterpriseGranted: 'Usuario actualizado a Enterprise con todas las funcionalidades',
    enterpriseGrantError: 'Error al otorgar plan Enterprise',
    editTitle: 'Editar Perfil',
    fullName: 'Nombre Completo',
    headline: 'Headline',
    slugLabel: 'URL Personalizada (Slug)',
    slugPlaceholder: 'tu-nombre-profesion',
    slugHelp: 'Solo letras minúsculas, números y guiones. Mínimo 3 caracteres.',
    adminNoteTitle: 'Nota del administrador:',
    adminNote: 'Puedes cambiar la URL sin restricciones de tiempo. Los usuarios normales solo pueden cambiar su URL cada 90 días.',
    plan: 'Plan',
    planOptions: {
      free: 'Free - 1 export/mes, sin IA',
      basic: 'Basic - 5 exports/mes, 20 IA/mes',
      pro: 'Pro - Ilimitado',
      enterprise: 'Enterprise - Ilimitado + extras',
    },
    role: 'Rol',
    verifying: 'Verificando...',
    save: 'Guardar Cambios',
    enterpriseTitle: 'Funcionalidades Enterprise',
    upgradeTitle: 'Actualizar a Enterprise',
    upgradeDesc: 'Otorga acceso a todas las funcionalidades Enterprise',
    upgradeButton: 'Activar Enterprise',
    featuresUnavailable: 'No se pudieron cargar las funcionalidades',
    categories: {
      support: 'Soporte',
      integration: 'Integración',
      customization: 'Personalización',
      analytics: 'Analytics',
      team: 'Equipo',
      content: 'Contenido',
    } as Record<string, string>,
    locale: 'es-ES',
  },
  en: {
    title: 'Profiles Management',
    found: (n: number) => `${n} profiles found`,
    reload: 'Reload',
    search: 'Search',
    searchPlaceholder: 'Name, email, headline...',
    filterPlan: 'Filter by plan',
    allPlans: 'All plans',
    showing: (from: number, to: number, total: number) => `Showing ${from}–${to} of ${total}`,
    updating: 'Updating…',
    loadError: 'Could not load profiles.',
    retry: 'Retry',
    noResults: 'No profiles match these filters.',
    roles: { professional: 'Professional', employer: 'Employer', profile_manager: 'Profile manager', admin: 'Admin' },
    cols: { user: 'User', email: 'Email', url: 'Custom URL', country: 'Country', plan: 'Plan', joined: 'Joined', actions: 'Actions' },
    tableCaption: 'Registered profiles',
    noName: 'No name',
    noUrl: 'No URL',
    planOf: (name: string) => `${name}'s plan`,
    viewCv: 'View CV',
    downloadCv: 'Download CV',
    downloadOptions: (name: string) => `CV download options for ${name}`,
    download: {
      exact: 'Web view (image)',
      exactDesc: 'Visual capture, text not selectable',
      selectable: 'PDF with selectable text',
      recommended: 'Recommended',
      selectableDesc: 'Opens the print dialog, save as PDF (100% selectable text)',
      ats: 'ATS optimized',
      atsDesc: 'For automatic parsing systems',
    },
    enterpriseFeatures: 'Enterprise features',
    edit: 'Edit',
    delete: 'Delete',
    close: 'Close',
    success: 'Success',
    error: 'Error',
    profileUpdated: 'Profile updated successfully',
    updateError: 'Error updating profile: ',
    deleteTitle: 'Confirm deletion',
    deleteMessage: 'Are you sure you want to delete this profile? This action cannot be undone.',
    cancel: 'Cancel',
    noSession: 'No active session',
    serverError: (status: number) => `Server error: ${status}`,
    profileDeleted: 'Profile deleted successfully',
    deleteError: 'Error deleting profile: ',
    cvDownloaded: 'CV downloaded successfully (exact web view)',
    cvDownloadError: 'Error downloading CV: ',
    printHint: 'Use "Save as PDF" in the print dialog to download the CV with selectable text',
    cvPrepareError: 'Error preparing the CV: ',
    atsDownloaded: 'ATS-optimized CV downloaded successfully',
    atsDownloadError: 'Error downloading ATS CV: ',
    fileUser: 'user',
    slugInvalid: 'Invalid URL format',
    slugCheckError: 'Error checking URL availability',
    slugTaken: 'This URL is already in use. Please choose another one.',
    slugTakenShort: 'This URL is already in use',
    slugErrors: {} as Record<string, string>,
    featuresLoadError: 'Error loading Enterprise features',
    featureUpdateError: 'Error updating the feature',
    enterpriseGranted: 'User upgraded to Enterprise with all features',
    enterpriseGrantError: 'Error granting the Enterprise plan',
    editTitle: 'Edit profile',
    fullName: 'Full name',
    headline: 'Headline',
    slugLabel: 'Custom URL (slug)',
    slugPlaceholder: 'your-name-profession',
    slugHelp: 'Lowercase letters, numbers and hyphens only. Minimum 3 characters.',
    adminNoteTitle: 'Admin note:',
    adminNote: 'You can change the URL without time restrictions. Regular users can only change their URL every 90 days.',
    plan: 'Plan',
    planOptions: {
      free: 'Free - 1 export/month, no AI',
      basic: 'Basic - 5 exports/month, 20 AI/month',
      pro: 'Pro - Unlimited',
      enterprise: 'Enterprise - Unlimited + extras',
    },
    role: 'Role',
    verifying: 'Verifying...',
    save: 'Save changes',
    enterpriseTitle: 'Enterprise features',
    upgradeTitle: 'Upgrade to Enterprise',
    upgradeDesc: 'Grants access to all Enterprise features',
    upgradeButton: 'Activate Enterprise',
    featuresUnavailable: 'Could not load the features',
    categories: {
      support: 'Support',
      integration: 'Integration',
      customization: 'Customization',
      analytics: 'Analytics',
      team: 'Team',
      content: 'Content',
    } as Record<string, string>,
    locale: 'en-US',
  },
};

const ProfilesManagement: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [planCounts, setPlanCounts] = useState<PlanCounts>({ free: 0, basic: 0, pro: 0, enterprise: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 350);
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState<string | null>(null);

  // Menu de descarga: se pinta en un portal con position:fixed para que el
  // overflow-x-auto de la tabla no lo recorte (antes se abria con :hover y en
  // movil no se podia usar).
  const [downloadMenuFor, setDownloadMenuFor] = useState<Profile | null>(null);
  const downloadTriggerRef = useRef<HTMLButtonElement | null>(null);
  const downloadMenuRef = useRef<HTMLDivElement | null>(null);

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
  const lt = LOCAL_TEXT[lang === 'en' ? 'en' : 'es'];
  const slugMessage = (msg?: string) => (msg ? lt.slugErrors[msg] || msg : lt.slugInvalid);

  // Filtros en servidor; al cambiar se vuelve a la pagina 1.
  const filtersKey = `${filterPlan}|${debouncedSearch.trim()}`;
  const lastFiltersKey = useRef(filtersKey);
  const requestId = useRef(0);

  // Tarjetas por plan: consultas head:true (solo cuentan, no descargan filas).
  const loadPlanCounts = useCallback(async () => {
    const count = (plan: string) => {
      // plan es privado: el panel de admin lee de la vista profiles_full
      const q = supabase.from('profiles_full').select('id', { count: 'exact', head: true });
      // Sin plan cuenta como Free (igual que la tabla y el selector).
      return plan === 'free' ? q.or('plan.is.null,plan.eq.free') : q.eq('plan', plan);
    };
    const results = await Promise.all(PLANS.map(count));
    const next = { free: 0, basic: 0, pro: 0, enterprise: 0 } as PlanCounts;
    PLANS.forEach((plan, i) => { next[plan] = results[i].count || 0; });
    setPlanCounts(next);
  }, []);

  const loadProfiles = useCallback(async () => {
    const id = ++requestId.current;
    setFetching(true);
    setLoadError(false);
    try {
      const from = (page - 1) * PAGE_SIZE;
      let query = supabase
        .from('profiles_full') // email y plan son privados
        .select(PROFILE_COLUMNS, { count: 'exact' });

      if (filterPlan !== 'all' && filterPlan !== 'free') {
        query = query.eq('plan', filterPlan);
      }
      const orFilter = combineOrGroups([
        filterPlan === 'free' ? 'plan.is.null,plan.eq.free' : null,
        buildIlikeOrFilter(['full_name', 'email', 'headline'], debouncedSearch),
      ]);
      if (orFilter) query = query.or(orFilter);

      // Orden estable: created_at puede repetirse, se desempata por id.
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .order('id', { ascending: true })
        .range(from, from + PAGE_SIZE - 1);

      if (error) throw error;
      if (id !== requestId.current) return; // respuesta obsoleta

      setProfiles((data as Profile[]) || []);
      setTotalCount(count || 0);
    } catch (err) {
      if (id !== requestId.current) return;
      console.error('Exception loading profiles:', err);
      setLoadError(true);
    } finally {
      if (id === requestId.current) {
        setFetching(false);
        setLoading(false);
      }
    }
  }, [page, filterPlan, debouncedSearch]);

  const refresh = useCallback(() => {
    loadProfiles();
    loadPlanCounts().catch(err => console.error('Error loading plan counts:', err));
  }, [loadProfiles, loadPlanCounts]);

  useEffect(() => {
    loadPlanCounts().catch(err => console.error('Error loading plan counts:', err));
  }, [loadPlanCounts]);

  useEffect(() => {
    if (lastFiltersKey.current !== filtersKey) {
      lastFiltersKey.current = filtersKey;
      if (page !== 1) {
        setPage(1); // el efecto se repite con la pagina 1
        return;
      }
    }
    loadProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadProfiles, filtersKey]);

  // ---- Menu de descarga -------------------------------------------------------
  const closeDownloadMenu = useCallback((restoreFocus: boolean) => {
    setDownloadMenuFor(null);
    if (restoreFocus) downloadTriggerRef.current?.focus();
  }, []);

  const toggleDownloadMenu = (profile: Profile, trigger: HTMLButtonElement) => {
    if (downloadingPDF === profile.id) return; // descarga en curso
    if (downloadMenuFor?.id === profile.id) {
      closeDownloadMenu(false);
      return;
    }
    downloadTriggerRef.current = trigger;
    setDownloadMenuFor(profile);
  };

  // Coloca el menu junto al boton, dentro del viewport (abre hacia arriba si no cabe debajo).
  useLayoutEffect(() => {
    const menu = downloadMenuRef.current;
    const trigger = downloadTriggerRef.current;
    if (!downloadMenuFor || !menu || !trigger) return;
    const r = trigger.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const w = menu.offsetWidth;
    const h = menu.offsetHeight;
    const left = Math.max(8, Math.min(r.right - w, vw - w - 8));
    let top = r.bottom + 4;
    if (top + h > vh - 8) top = r.top - h - 4 >= 8 ? r.top - h - 4 : Math.max(8, vh - h - 8);
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
    // useLayoutEffect: se coloca antes del primer pintado, sin parpadeo en (0,0).
    menu.querySelector<HTMLElement>('[role="menuitem"]:not([disabled])')?.focus({ preventScroll: true });
  }, [downloadMenuFor]);

  // Cierre al pulsar fuera, al hacer scroll o al cambiar el tamano de la ventana.
  useEffect(() => {
    if (!downloadMenuFor) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (downloadMenuRef.current?.contains(target) || downloadTriggerRef.current?.contains(target)) return;
      closeDownloadMenu(false);
    };
    const onScroll = (e: Event) => {
      if (downloadMenuRef.current && e.target instanceof Node && downloadMenuRef.current.contains(e.target)) return;
      closeDownloadMenu(false);
    };
    const onResize = () => closeDownloadMenu(false);
    // Escape tambien cuando el foco sigue en el boton que abrio el menu
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      closeDownloadMenu(true);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [downloadMenuFor, closeDownloadMenu]);

  const onDownloadMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])'));
    const idx = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'Tab') {
      // El menu vive al final del body: se devuelve el foco al boton para no saltar al final de la pagina
      e.preventDefault();
      closeDownloadMenu(true);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!items.length) return;
      const next = e.key === 'ArrowDown' ? (idx + 1) % items.length : (idx - 1 + items.length) % items.length;
      items[next].focus();
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      items[e.key === 'Home' ? 0 : items.length - 1]?.focus();
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const rangeFrom = totalCount === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeTo = Math.min(page * PAGE_SIZE, totalCount);

  const handleUpdateProfile = async (profileId: string, updates: Partial<Profile>, showSuccessMessage: boolean = true) => {
    try {
      // If updating slug, validate it first
      if (updates.slug !== undefined) {
        const validation = validateSlugFormat(updates.slug);
        if (!validation.isValid) {
          setSlugError(slugMessage(validation.error));
          return;
        }

        // Check if slug is already taken by another user
        const { data: existingProfile, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('slug', updates.slug)
          .neq('id', profileId)
          // maybeSingle: slug libre = sin fila, no un 406
          .maybeSingle();

        if (checkError) {
          throw new Error(lt.slugCheckError);
        }

        if (existingProfile && existingProfile.id !== profileId) {
          setSlugError(lt.slugTaken);
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
      if (updates.plan !== undefined) {
        loadPlanCounts().catch(err => console.error('Error loading plan counts:', err));
      }

      if (showSuccessMessage) {
        showAlert({
          title: lt.success,
          message: lt.profileUpdated,
          type: 'success'
        });
      }
      setShowEditModal(false);
      setSlugError('');
    } catch (err: any) {
      showAlert({
        title: lt.error,
        message: lt.updateError + err.message,
        type: 'error'
      });
      // Reload to ensure consistency if error
      refresh();
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    const confirmed = await showConfirm({
      title: lt.deleteTitle,
      message: lt.deleteMessage,
      type: 'warning',
      confirmText: lt.delete,
      cancelText: lt.cancel
    });

    if (!confirmed) {
      return;
    }

    try {
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error(lt.noSession);
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
        throw new Error(data.error || data.details || lt.serverError(response.status));
      }

      showAlert({
        title: lt.success,
        message: lt.profileDeleted,
        type: 'success'
      });
      refresh();
    } catch (err: any) {
      showAlert({
        title: lt.error,
        message: lt.deleteError + err.message,
        type: 'error'
      });
    }
  };

  const handleDownloadCV = async (profile: Profile, type: 'exact' | 'ats' | 'selectable' = 'exact') => {
    closeDownloadMenu(true);
    try {
      setDownloadingPDF(profile.id);

      if (type === 'exact') {
        // Descarga exacta de la vista web - Dynamic import
        const { generateCVPDF } = await import('../../utils/pdfGenerator');
        await generateCVPDF({
          profileSlug: profile.slug,
          profileId: profile.id,
          fileName: `CV-${profile.full_name || lt.fileUser}-${new Date().toISOString().split('T')[0]}.pdf`,
          onSuccess: () => {
            showAlert({
              title: lt.success,
              message: lt.cvDownloaded,
              type: 'success'
            });
            setDownloadingPDF(null);
          },
          onError: (error: Error) => {
            showAlert({
              title: lt.error,
              message: lt.cvDownloadError + error.message,
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
              title: lt.success,
              message: lt.printHint,
              type: 'success'
            });
            setDownloadingPDF(null);
          },
          onError: (error: Error) => {
            showAlert({
              title: lt.error,
              message: lt.cvPrepareError + error.message,
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
          fileName: `CV-ATS-${profile.full_name || lt.fileUser}-${new Date().toISOString().split('T')[0]}.pdf`,
          template: 'modern',
          onSuccess: () => {
            showAlert({
              title: lt.success,
              message: lt.atsDownloaded,
              type: 'success'
            });
            setDownloadingPDF(null);
          },
          onError: (error: Error) => {
            showAlert({
              title: lt.error,
              message: lt.atsDownloadError + error.message,
              type: 'error'
            });
            setDownloadingPDF(null);
          }
        });
      }
    } catch (err: any) {
      showAlert({
        title: lt.error,
        message: lt.cvDownloadError + err.message,
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
      setSlugError(slugMessage(validation.error));
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
          .neq('id', selectedProfile.id)
          .maybeSingle();

        if (existingProfile && existingProfile.id !== selectedProfile.id) {
          setSlugError(lt.slugTakenShort);
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
        title: lt.error,
        message: lt.featuresLoadError,
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
        title: lt.error,
        message: err.message || lt.featureUpdateError,
        type: 'error'
      });
    }
  };

  const handleGrantEnterprise = async () => {
    if (!enterpriseProfile) return;
    try {
      // Nota interna guardada en BD (no es texto de interfaz)
      await grantEnterprisePlan(enterpriseProfile.id, 'Actualizado a Enterprise por admin');
      showAlert({
        title: lt.success,
        message: lt.enterpriseGranted,
        type: 'success'
      });
      refresh();
      const features = await getUserFeatures(enterpriseProfile.id);
      setUserFeatures(features);
    } catch (err: any) {
      showAlert({
        title: lt.error,
        message: err.message || lt.enterpriseGrantError,
        type: 'error'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cv-blue"></div>
      </div>
    );
  }

  const iconButton = `p-1.5 rounded transition-colors ${FOCUS_RING}`;
  const displayName = (p: Profile) => p.full_name || p.email || lt.noName;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {lt.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {lt.found(totalCount)}
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className={`px-4 py-2 bg-cv-blue text-white rounded-lg hover:bg-blue-700 transition-colors ${FOCUS_RING}`}
        >
          {lt.reload}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {planCounts.free}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Free</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {planCounts.basic}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wide">Basic</div>
        </div>
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {planCounts.pro}
          </div>
          <div className="text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">Pro</div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {planCounts.enterprise}
          </div>
          <div className="text-xs text-purple-600 dark:text-purple-400 uppercase tracking-wide">Enterprise</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-dark-bg-secondary rounded-lg p-4 shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="profiles-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {lt.search}
            </label>
            <input
              id="profiles-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lt.searchPlaceholder}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="profiles-plan-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {lt.filterPlan}
            </label>
            <select
              id="profiles-plan-filter"
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
            >
              <option value="all">{lt.allPlans}</option>
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        </div>
      </div>

      {/* Profiles Table: el scroll horizontal queda dentro del contenedor (nunca en el body) */}
      <div
        className={`bg-white dark:bg-dark-bg-secondary rounded-lg shadow-md transition-opacity overflow-x-auto ${fetching ? 'opacity-60' : ''}`}
        aria-busy={fetching}
        data-testid="profiles-table"
      >
        {loadError ? (
          <div className="text-center py-12" role="alert">
            <p className="text-gray-700 dark:text-dark-text-secondary mb-4">{lt.loadError}</p>
            <button
              type="button"
              onClick={refresh}
              className={`px-4 py-2 bg-cv-blue text-white rounded-lg hover:bg-blue-700 transition-colors ${FOCUS_RING}`}
            >
              {lt.retry}
            </button>
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-12 text-gray-600 dark:text-dark-text-secondary">
            {lt.noResults}
          </div>
        ) : (
        <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
          <caption className="sr-only">{lt.tableCaption}</caption>
          <thead className="bg-gray-50 dark:bg-dark-bg-tertiary">
            <tr>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{ width: '280px', maxWidth: '280px' }}>
                {lt.cols.user}
              </th>
              <th scope="col" className="hidden md:table-cell px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{ width: '180px', maxWidth: '180px' }}>
                {lt.cols.email}
              </th>
              <th scope="col" className="hidden md:table-cell px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{ width: '150px', maxWidth: '150px' }}>
                {lt.cols.url}
              </th>
              <th scope="col" className="hidden md:table-cell px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">
                {lt.cols.country}
              </th>
              <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">
                {lt.cols.plan}
              </th>
              <th scope="col" className="hidden md:table-cell px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">
                {lt.cols.joined}
              </th>
              <th scope="col" className="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">
                {lt.cols.actions}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-dark-bg-secondary divide-y divide-gray-200 dark:divide-gray-700">
            {profiles.map((profile) => (
              <tr key={profile.id} className="hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors">
                <td className="px-3 py-2" style={{ maxWidth: '280px' }}>
                  <div className="flex items-center gap-2">
                    <div className="flex-shrink-0 h-8 w-8">
                      {(profile as any).avatar_url || (profile as any).photo_url ? (
                        <img
                          className="h-8 w-8 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                          src={(profile as any).avatar_url || (profile as any).photo_url || ''}
                          alt={profile.full_name || lt.noName}
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
                          aria-hidden="true"
                        >
                          {(profile.full_name || profile.email || '?')[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 max-w-[8.5rem] sm:max-w-[220px]">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate" title={profile.full_name || lt.noName}>
                        {profile.full_name || lt.noName}
                      </div>
                      {profile.headline && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate" title={profile.headline}>
                          {profile.headline}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="hidden md:table-cell px-3 py-2" style={{ maxWidth: '180px' }}>
                  <div className="text-xs text-gray-900 dark:text-white truncate" title={profile.email || 'N/A'}>
                    {profile.email || 'N/A'}
                  </div>
                </td>
                <td className="hidden md:table-cell px-3 py-2" style={{ maxWidth: '150px' }}>
                  <div className="text-xs font-mono text-cv-blue dark:text-blue-400 truncate" title={profile.slug || lt.noUrl}>
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
                      <span className="text-gray-400">{lt.noUrl}</span>
                    )}
                  </div>
                </td>
                <td className="hidden md:table-cell px-2 py-2 text-center">
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
                    aria-label={lt.planOf(displayName(profile))}
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
                <td className="hidden md:table-cell px-2 py-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {profile.created_at ? new Date(profile.created_at).toLocaleDateString(lt.locale, {
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
                      className={`p-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded transition-all ${FOCUS_RING}`}
                      title={lt.viewCv}
                      aria-label={lt.viewCv}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => toggleDownloadMenu(profile, e.currentTarget)}
                      // aria-disabled y no disabled: el foco vuelve a este boton al elegir una opcion
                      aria-disabled={downloadingPDF === profile.id}
                      aria-haspopup="menu"
                      aria-expanded={downloadMenuFor?.id === profile.id}
                      aria-controls={downloadMenuFor?.id === profile.id ? 'profiles-download-menu' : undefined}
                      className={`${iconButton} text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 dark:text-green-400 aria-disabled:opacity-50`}
                      title={lt.downloadCv}
                      aria-label={lt.downloadCv}
                    >
                      {downloadingPDF === profile.id ? (
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEnterpriseModal(profile)}
                      className={`${iconButton} ${
                        profile.plan === 'enterprise'
                          ? 'text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 dark:text-purple-400'
                          : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-500'
                      }`}
                      title={lt.enterpriseFeatures}
                      aria-label={lt.enterpriseFeatures}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProfile(profile);
                        setShowEditModal(true);
                      }}
                      className={`${iconButton} text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 dark:text-indigo-400`}
                      title={lt.edit}
                      aria-label={lt.edit}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProfile(profile.id)}
                      className={`${iconButton} text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:text-red-400`}
                      title={lt.delete}
                      aria-label={lt.delete}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Menu de descarga (portal: fuera del contenedor con overflow de la tabla) */}
      {downloadMenuFor && createPortal(
        <div
          ref={downloadMenuRef}
          id="profiles-download-menu"
          role="menu"
          aria-label={lt.downloadOptions(displayName(downloadMenuFor))}
          onKeyDown={onDownloadMenuKeyDown}
          className="fixed z-50 w-56 max-w-[calc(100vw-1rem)] bg-white dark:bg-dark-bg-tertiary rounded shadow-lg border border-gray-200 dark:border-gray-600"
          style={{ top: 0, left: 0 }}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => handleDownloadCV(downloadMenuFor, 'exact')}
            disabled={downloadingPDF === downloadMenuFor.id}
            className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus-visible:bg-gray-100 dark:focus-visible:bg-gray-700 rounded-t border-b border-gray-100 dark:border-gray-600"
          >
            <div className="font-medium text-gray-900 dark:text-gray-100">{lt.download.exact}</div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{lt.download.exactDesc}</div>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => handleDownloadCV(downloadMenuFor, 'selectable')}
            disabled={downloadingPDF === downloadMenuFor.id}
            className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:outline-none focus-visible:bg-blue-50 dark:focus-visible:bg-blue-900/20 border-b border-gray-100 dark:border-gray-600 relative"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="font-medium text-gray-900 dark:text-gray-100">{lt.download.selectable}</div>
              <span className="text-[9px] bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-1.5 py-0.5 rounded font-semibold">
                {lt.download.recommended}
              </span>
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{lt.download.selectableDesc}</div>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => handleDownloadCV(downloadMenuFor, 'ats')}
            disabled={downloadingPDF === downloadMenuFor.id}
            className="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus-visible:bg-gray-100 dark:focus-visible:bg-gray-700 rounded-b"
          >
            <div className="font-medium text-gray-900 dark:text-gray-100">{lt.download.ats}</div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{lt.download.atsDesc}</div>
          </button>
        </div>,
        document.body
      )}

      {/* Paginacion (servidor) */}
      {!loadError && totalCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-gray-600 dark:text-dark-text-secondary" aria-live="polite">
            {fetching ? lt.updating : lt.showing(rangeFrom, rangeTo, totalCount)}
          </p>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            className="flex flex-wrap items-center justify-center gap-2"
          />
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="profiles-edit-title"
            className="bg-white dark:bg-dark-bg-secondary rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between gap-3 mb-6">
                <h3 id="profiles-edit-title" className="text-xl font-bold text-gray-900 dark:text-white">
                  {lt.editTitle}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  aria-label={lt.close}
                  className={`text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded ${FOCUS_RING}`}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="profiles-edit-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {lt.fullName}
                  </label>
                  <input
                    id="profiles-edit-name"
                    type="text"
                    value={selectedProfile.full_name || ''}
                    onChange={(e) => setSelectedProfile({ ...selectedProfile, full_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="profiles-edit-headline" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {lt.headline}
                  </label>
                  <input
                    id="profiles-edit-headline"
                    type="text"
                    value={selectedProfile.headline || ''}
                    onChange={(e) => setSelectedProfile({ ...selectedProfile, headline: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="profiles-edit-slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {lt.slugLabel}
                  </label>
                  <div className="space-y-2">
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        yourcvpassport.com/cv/
                      </span>
                      <div className="flex-1 min-w-0 relative">
                        <input
                          id="profiles-edit-slug"
                          type="text"
                          value={selectedProfile.slug || ''}
                          onChange={(e) => handleSlugChange(e.target.value)}
                          onBlur={handleSlugBlur}
                          placeholder={lt.slugPlaceholder}
                          aria-invalid={!!slugError}
                          aria-describedby={slugError ? 'profiles-edit-slug-error' : undefined}
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
                      <p id="profiles-edit-slug-error" className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {slugError}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {lt.slugHelp}
                    </p>
                    <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div className="text-xs text-amber-800 dark:text-amber-200">
                        <strong>{lt.adminNoteTitle}</strong> {lt.adminNote}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="profiles-edit-plan" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {lt.plan}
                  </label>
                  <select
                    id="profiles-edit-plan"
                    value={selectedProfile.plan || 'free'}
                    onChange={(e) => setSelectedProfile({ ...selectedProfile, plan: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                  >
                    <option value="free">{lt.planOptions.free}</option>
                    <option value="basic">{lt.planOptions.basic}</option>
                    <option value="pro">{lt.planOptions.pro}</option>
                    <option value="enterprise">{lt.planOptions.enterprise}</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="profiles-edit-role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {lt.role}
                  </label>
                  <select
                    id="profiles-edit-role"
                    value={selectedProfile.role || 'professional'}
                    onChange={(e) => setSelectedProfile({ ...selectedProfile, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cv-blue dark:bg-dark-bg-tertiary dark:text-white"
                  >
                    {/* Valores de profiles_role_check; 'user' no existe en BD. */}
                    <option value="professional">{lt.roles.professional}</option>
                    <option value="employer">{lt.roles.employer}</option>
                    <option value="profile_manager">{lt.roles.profile_manager}</option>
                    <option value="admin">{lt.roles.admin}</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => handleUpdateProfile(selectedProfile.id, selectedProfile)}
                    disabled={!!slugError || slugChecking}
                    className={`flex-1 px-4 py-2 bg-cv-blue text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${FOCUS_RING}`}
                  >
                    {slugChecking ? lt.verifying : lt.save}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSlugError('');
                    }}
                    className={`flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors ${FOCUS_RING}`}
                  >
                    {lt.cancel}
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
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="profiles-enterprise-title"
            className="bg-white dark:bg-dark-bg-secondary rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between gap-3 mb-6">
                <div className="min-w-0">
                  <h3 id="profiles-enterprise-title" className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    {lt.enterpriseTitle}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 break-words">
                    {enterpriseProfile.full_name || enterpriseProfile.email} - {lt.plan}: <span className={`font-medium ${
                      enterpriseProfile.plan === 'enterprise' ? 'text-purple-600' :
                      enterpriseProfile.plan === 'pro' ? 'text-indigo-600' :
                      enterpriseProfile.plan === 'basic' ? 'text-blue-600' : 'text-gray-600'
                    }`}>{enterpriseProfile.plan || 'free'}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEnterpriseModal(false)}
                  aria-label={lt.close}
                  className={`text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded ${FOCUS_RING}`}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {enterpriseProfile.plan !== 'enterprise' && (
                <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-purple-900 dark:text-purple-200">
                        {lt.upgradeTitle}
                      </p>
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        {lt.upgradeDesc}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleGrantEnterprise}
                      className={`px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors ${FOCUS_RING}`}
                    >
                      {lt.upgradeButton}
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

                    return (
                      <div key={category}>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
                          {lt.categories[category] || category}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {categoryFeatures.map(feature => {
                            const featureName = lang === 'es' ? feature.name_es : feature.name_en;
                            return (
                            <div
                              key={feature.feature_key}
                              className={`p-3 rounded-lg border transition-all ${
                                feature.has_feature
                                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                  : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-lg" aria-hidden="true">{getIconEmoji(feature.icon)}</span>
                                    <span className="font-medium text-gray-900 dark:text-white text-sm">
                                      {featureName}
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
                                  type="button"
                                  role="switch"
                                  aria-checked={!!feature.has_feature}
                                  aria-label={featureName}
                                  onClick={() => handleToggleFeature(feature.feature_key, !feature.has_feature)}
                                  className={`ml-3 flex-shrink-0 relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${FOCUS_RING} ${
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
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-dark-text-secondary">
                  {lt.featuresUnavailable}
                </div>
              )}

              <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowEnterpriseModal(false)}
                  className={`px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors ${FOCUS_RING}`}
                >
                  {lt.close}
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

