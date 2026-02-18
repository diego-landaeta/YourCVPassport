// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase/client';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EnvelopeIcon,
  ClockIcon,
  FunnelIcon,
  EyeIcon,
  LockClosedIcon,
  LockOpenIcon
} from '@heroicons/react/24/outline';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'user' | 'admin' | 'company';
  is_active: boolean;
  profile_quality_score: number;
  created_at: string;
  updated_at: string;
  last_login?: string;
  suspension_reason?: string;
  suspended_until?: string;
  photo_url?: string;
  headline?: string;
  location?: string;
  slug?: string;
  profile_hidden?: boolean;
  search_blocked?: boolean;
  messages_blocked?: boolean;
}

type FilterStatus = 'all' | 'active' | 'suspended';
type FilterRole = 'all' | 'user' | 'company' | 'admin';

const UserModeration: React.FC = () => {
  const { lang } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterRole, setFilterRole] = useState<FilterRole>('all');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState<string | undefined>(undefined);
  const [suspensionDuration, setSuspensionDuration] = useState<string>('permanent');
  const [customDays, setCustomDays] = useState<number>(1);
  const [customDate, setCustomDate] = useState<string>('');
  const [banOptions, setBanOptions] = useState({
    profileHidden: false,
    searchBlocked: false,
    messagesBlocked: false
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const translations = {
    en: {
      title: 'User Moderation',
      subtitle: 'Review and moderate user accounts',
      search: 'Search users...',
      filterByStatus: 'Filter by status',
      filterByRole: 'Filter by role',
      all: 'All',
      active: 'Active',
      suspended: 'Suspended',
      user: 'User',
      company: 'Company',
      admin: 'Admin',
      totalUsers: 'Total Users',
      activeUsers: 'Active',
      suspendedUsers: 'Suspended',
      name: 'Name',
      email: 'Email',
      role: 'Role',
      status: 'Status',
      lastLogin: 'Last Login',
      actions: 'Actions',
      viewDetails: 'View Details',
      suspend: 'Suspend',
      activate: 'Activate',
      changeRole: 'Change Role',
      loading: 'Loading users...',
      noResults: 'No users found',
      userDetails: 'User Details',
      accountInfo: 'Account Information',
      profileQuality: 'Profile Quality',
      createdAt: 'Created',
      suspensionReason: 'Suspension Reason',
      enterReason: 'Enter reason for suspension...',
      close: 'Close',
      confirmSuspend: 'Are you sure you want to suspend this user?',
      confirmActivate: 'Are you sure you want to activate this user?',
      success: 'Operation completed successfully',
      error: 'Error performing operation',
      never: 'Never',
      noReason: 'No reason provided',
      duration: 'Duration',
      oneHour: '1 hour',
      oneDay: '1 day',
      oneWeek: '1 week',
      oneMonth: '1 month',
      permanent: 'Permanent',
      custom: 'Custom',
      customDays: 'Days',
      banOptions: 'Ban Options',
      hideProfile: 'Hide profile from public view',
      blockSearch: 'Block from search results',
      blockMessages: 'Block messages',
      restrictions: 'Active Restrictions',
      suspendUser: 'Suspend User',
      confirmAction: 'Confirm Suspension',
      errorSuspending: 'Error suspending user',
      userSuspended: 'User suspended successfully',
      errorActivating: 'Error activating user',
      userActivated: 'User activated successfully',
      noName: 'No name',
      selectDate: 'Select Date',
      orByDays: 'or by days',
      daySingular: 'day',
      dayPlural: 'days',
      suspendedUntil: 'Suspended until:',
      notPubliclyVisible: 'Not publicly visible',
      excludedFromSearches: 'Excluded from searches',
      noMessagingAccess: 'No messaging access',
      lastActivity: 'Last activity',
      location: 'Location',
      plan: 'Plan'
    },
    es: {
      title: 'Moderación de Usuarios',
      subtitle: 'Revisa y modera cuentas de usuario',
      search: 'Buscar usuarios...',
      filterByStatus: 'Filtrar por estado',
      filterByRole: 'Filtrar por rol',
      all: 'Todos',
      active: 'Activos',
      suspended: 'Suspendidos',
      user: 'Usuario',
      company: 'Empresa',
      admin: 'Administrador',
      totalUsers: 'Total Usuarios',
      activeUsers: 'Activos',
      suspendedUsers: 'Suspendidos',
      name: 'Nombre',
      email: 'Correo',
      role: 'Rol',
      status: 'Estado',
      lastLogin: 'Último Acceso',
      actions: 'Acciones',
      viewDetails: 'Ver Detalles',
      suspend: 'Suspender',
      activate: 'Activar',
      changeRole: 'Cambiar Rol',
      loading: 'Cargando usuarios...',
      noResults: 'No se encontraron usuarios',
      userDetails: 'Detalles del Usuario',
      accountInfo: 'Información de Cuenta',
      profileQuality: 'Calidad del Perfil',
      createdAt: 'Creado',
      suspensionReason: 'Razón de Suspensión',
      enterReason: 'Ingresa la razón de suspensión...',
      close: 'Cerrar',
      confirmSuspend: '¿Estás seguro de que quieres suspender este usuario?',
      confirmActivate: '¿Estás seguro de que quieres activar este usuario?',
      success: 'Operación completada exitosamente',
      error: 'Error al realizar la operación',
      never: 'Nunca',
      noReason: 'Sin razón proporcionada',
      duration: 'Duración',
      oneHour: '1 hora',
      oneDay: '1 día',
      oneWeek: '1 semana',
      oneMonth: '1 mes',
      permanent: 'Permanente',
      custom: 'Personalizado',
      customDays: 'Días',
      banOptions: 'Opciones de Baneo',
      hideProfile: 'Ocultar perfil de vista pública',
      blockSearch: 'Bloquear en búsquedas',
      blockMessages: 'Bloquear mensajes',
      restrictions: 'Restricciones Activas',
      suspendUser: 'Suspender Usuario',
      confirmAction: 'Confirmar Suspensión',
      errorSuspending: 'Error al suspender usuario',
      userSuspended: 'Usuario suspendido correctamente',
      errorActivating: 'Error al activar usuario',
      userActivated: 'Usuario activado correctamente',
      noName: 'Sin nombre',
      selectDate: 'Seleccionar Fecha',
      orByDays: 'o por días',
      daySingular: 'día',
      dayPlural: 'días',
      suspendedUntil: 'Suspensión hasta:',
      notPubliclyVisible: 'No visible públicamente',
      excludedFromSearches: 'Excluido de búsquedas',
      noMessagingAccess: 'Sin acceso a mensajería',
      lastActivity: 'Última actividad',
      location: 'Ubicación',
      plan: 'Plan'
    }
  };

  const t = translations[lang];

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, filterStatus, filterRole, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Format data with additional fields
      const formattedUsers = profiles?.map(profile => ({
        ...profile,
        is_active: profile.is_active ?? true,
        last_login: profile.updated_at // TODO: Get real last login from activity logs
      })) || [];

      setUsers(formattedUsers);
      setFilteredUsers(formattedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Filter by status
    if (filterStatus === 'active') {
      filtered = filtered.filter(u => u.is_active);
    } else if (filterStatus === 'suspended') {
      filtered = filtered.filter(u => !u.is_active);
    }

    // Filter by role
    if (filterRole !== 'all') {
      filtered = filtered.filter(u => u.role === filterRole);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        u.full_name?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const calculateSuspendedUntil = (duration: string): string | null => {
    if (duration === 'permanent') return null;

    const now = new Date();
    switch (duration) {
      case '1h':
        now.setHours(now.getHours() + 1);
        break;
      case '1d':
        now.setDate(now.getDate() + 1);
        break;
      case '1w':
        now.setDate(now.getDate() + 7);
        break;
      case '1m':
        now.setMonth(now.getMonth() + 1);
        break;
      case 'custom':
        if (customDate) {
          const selectedDate = new Date(customDate);
          selectedDate.setHours(23, 59, 59, 999);
          return selectedDate.toISOString();
        }
        now.setDate(now.getDate() + customDays);
        break;
    }
    return now.toISOString();
  };

  const handleSuspendUser = async (userId: string, reason: string) => {
    try {
      const suspendedUntil = calculateSuspendedUntil(suspensionDuration);

      const { error } = await supabase
        .from('profiles')
        .update({
          is_active: false,
          suspension_reason: reason?.trim() || 'Sin razón especificada',
          suspended_until: suspendedUntil,
          profile_hidden: banOptions.profileHidden,
          search_blocked: banOptions.searchBlocked,
          messages_blocked: banOptions.messagesBlocked
        })
        .eq('id', userId);

      if (error) {
        showToast(t.errorSuspending, 'error');
        return;
      }

      await loadUsers();
      setShowDetailModal(false);
      setSuspensionReason(undefined);
      setSuspensionDuration('permanent');
      setCustomDays(1);
      setCustomDate('');
      setBanOptions({ profileHidden: false, searchBlocked: false, messagesBlocked: false });
      setSelectedUser(null);
      showToast(t.userSuspended, 'success');
    } catch (error) {
      showToast(t.errorSuspending, 'error');
    }
  };

  const handleActivateUser = async (userId: string) => {
    if (!confirm(t.confirmActivate)) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_active: true,
          suspension_reason: null,
          suspended_until: null,
          profile_hidden: false,
          search_blocked: false,
          messages_blocked: false
        })
        .eq('id', userId);

      if (error) {
        showToast(t.errorActivating, 'error');
        return;
      }

      await loadUsers();
      setShowDetailModal(false);
      setSelectedUser(null);
      showToast(t.userActivated, 'success');
    } catch (error) {
      showToast(t.errorActivating, 'error');
    }
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    suspended: users.filter(u => !u.is_active).length
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'company':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <ShieldCheckIcon className="h-12 w-12 text-cv-blue dark:text-blue-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 dark:text-dark-text-secondary">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
          {t.title}
        </h2>
        <p className="text-gray-600 dark:text-dark-text-secondary mt-1">
          {t.subtitle}
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-dark-bg-secondary rounded-lg p-6 border border-gray-200 dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cv-blue/10 dark:bg-cv-blue/20 rounded-lg">
              <UserIcon className="h-6 w-6 text-cv-blue dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">{t.totalUsers}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-bg-secondary rounded-lg p-6 border border-gray-200 dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">{t.activeUsers}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-bg-secondary rounded-lg p-6 border border-gray-200 dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <XCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">{t.suspendedUsers}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">{stats.suspended}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-dark-bg-secondary rounded-lg p-4 border border-gray-200 dark:border-dark-border">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text-primary focus:ring-2 focus:ring-cv-blue focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text-primary focus:ring-2 focus:ring-cv-blue focus:border-transparent"
            >
              <option value="all">{t.all}</option>
              <option value="active">{t.active}</option>
              <option value="suspended">{t.suspended}</option>
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as FilterRole)}
              className="px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text-primary focus:ring-2 focus:ring-cv-blue focus:border-transparent"
            >
              <option value="all">{t.all}</option>
              <option value="user">{t.user}</option>
              <option value="company">{t.company}</option>
              <option value="admin">{t.admin}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-dark-bg-secondary rounded-lg border border-gray-200 dark:border-dark-border overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-dark-text-secondary">{t.noResults}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
              <thead className="bg-gray-50 dark:bg-dark-bg-tertiary">
                <tr>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                    {t.name}
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                    {t.email}
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                    {t.location}
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                    {t.plan}
                  </th>
                  <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-dark-text-secondary uppercase tracking-wider">
                    {t.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-bg-secondary divide-y divide-gray-200 dark:divide-dark-border">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors">
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex-shrink-0 h-9 w-9">
                          {(user as any).photo_url || (user as any).avatar_url || (user as any).profile_photo_url ? (
                            <img
                              className="h-9 w-9 rounded-full object-cover border border-gray-200 dark:border-gray-600"
                              src={(user as any).photo_url || (user as any).avatar_url || (user as any).profile_photo_url || ''}
                              alt={user.full_name || 'User'}
                              onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                img.src = '';
                                img.style.display = 'none';
                                const parent = img.parentElement;
                                if (parent) {
                                  const initial = (user.full_name || user.email || '?')[0].toUpperCase();
                                  const color = `hsl(${(user.full_name?.charCodeAt(0) || 0) * 137.5 % 360}, 70%, 50%)`;
                                  parent.innerHTML = `<div class="h-9 w-9 rounded-full flex items-center justify-center text-white font-semibold text-sm" style="background-color: ${color}">${initial}</div>`;
                                }
                              }}
                            />
                          ) : (
                            <div className="h-9 w-9 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                              style={{ backgroundColor: `hsl(${(user.full_name?.charCodeAt(0) || 0) * 137.5 % 360}, 70%, 50%)` }}>
                              {(user.full_name || user.email || '?')[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-dark-text-primary truncate max-w-[180px]">
                            {user.full_name || t.noName}
                          </div>
                          {user.headline && (
                            <div className="text-xs text-gray-500 dark:text-dark-text-secondary truncate max-w-[180px]">
                              {user.headline}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="text-xs text-gray-900 dark:text-dark-text-primary truncate max-w-[200px]">
                        {user.email}
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {user.location && (
                          <>
                            {user.location.includes('ES') && <span className="text-lg">🇪🇸</span>}
                            {user.location.includes('US') && <span className="text-lg">🇺🇸</span>}
                            {user.location.includes('VE') && <span className="text-lg">🇻🇪</span>}
                            {!user.location.includes('ES') && !user.location.includes('US') && !user.location.includes('VE') && (
                              <span className="text-xs text-gray-500 dark:text-dark-text-secondary">N/A</span>
                            )}
                          </>
                        )}
                        {!user.location && <span className="text-xs text-gray-500 dark:text-dark-text-secondary">N/A</span>}
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' :
                        user.role === 'company' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        Free
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDetailModal(true);
                          }}
                          className="p-1.5 text-cv-blue hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title={t.viewDetails}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        {user.is_active ? (
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setSuspensionReason('');
                              setBanOptions({
                                profileHidden: user.profile_hidden || false,
                                searchBlocked: user.search_blocked || false,
                                messagesBlocked: user.messages_blocked || false
                              });
                            }}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title={t.suspend}
                          >
                            <LockClosedIcon className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivateUser(user.id)}
                            className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            title={t.activate}
                          >
                            <LockOpenIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-bg-secondary rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-dark-border">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-dark-text-primary">
                    {t.userDetails}
                  </h3>
                  <p className="text-gray-600 dark:text-dark-text-secondary mt-1">
                    {selectedUser.email}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Header with Avatar */}
              <div className="flex items-start gap-4 pb-4 border-b border-gray-200 dark:border-dark-border">
                {selectedUser.photo_url ? (
                  <img
                    src={selectedUser.photo_url}
                    alt={selectedUser.full_name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-cv-blue/10 dark:bg-cv-blue/20 flex items-center justify-center">
                    <span className="text-cv-blue dark:text-blue-400 font-semibold text-xl">
                      {(selectedUser.full_name || selectedUser.email || 'U')[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">
                    {selectedUser.full_name || t.noName}
                  </h4>
                  {selectedUser.headline && (
                    <p className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">
                      {selectedUser.headline}
                    </p>
                  )}
                  {selectedUser.location && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      📍 {selectedUser.location}
                    </p>
                  )}
                </div>
              </div>

              {/* Account Info */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-dark-text-primary mb-3">
                  {t.accountInfo}
                </h4>
                <div className="bg-gray-50 dark:bg-dark-bg-tertiary rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-dark-text-secondary">{t.email || 'Email'}:</span>
                    <span className="text-gray-900 dark:text-dark-text-primary font-mono text-sm">
                      {selectedUser.email}
                    </span>
                  </div>
                  {selectedUser.slug && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-dark-text-secondary">URL:</span>
                      <a
                        href={`https://yourcvpassport.com/cv/${selectedUser.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cv-blue hover:underline text-sm font-mono"
                      >
                        yourcvpassport.com/cv/{selectedUser.slug}
                      </a>
                    </div>
                  )}
                  {selectedUser.role && selectedUser.role !== 'user' && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-dark-text-secondary">{t.role}:</span>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(selectedUser.role)}`}>
                        {t[selectedUser.role as keyof typeof t]}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-dark-text-secondary">{t.status}:</span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedUser.is_active)}`}>
                      {selectedUser.is_active ? t.active : t.suspended}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-dark-text-secondary">{t.createdAt}:</span>
                    <span className="text-gray-900 dark:text-dark-text-primary text-sm">
                      {new Date(selectedUser.created_at).toLocaleDateString(lang)}
                    </span>
                  </div>
                  {selectedUser.updated_at && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-dark-text-secondary">{t.lastActivity}:</span>
                      <span className="text-gray-900 dark:text-dark-text-primary text-sm">
                        {new Date(selectedUser.updated_at).toLocaleDateString(lang)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Suspension Info */}
              {!selectedUser.is_active && selectedUser.suspension_reason && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-dark-text-primary mb-3">
                    {t.suspensionReason}
                  </h4>
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-gray-700 dark:text-dark-text-secondary">
                      {selectedUser.suspension_reason}
                    </p>
                  </div>
                </div>
              )}

              {/* Active Restrictions */}
              {(selectedUser.profile_hidden || selectedUser.search_blocked || selectedUser.messages_blocked) && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-dark-text-primary mb-3">
                    {t.restrictions}
                  </h4>
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 space-y-2">
                    {selectedUser.profile_hidden && (
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-dark-text-secondary">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        {t.hideProfile}
                      </div>
                    )}
                    {selectedUser.search_blocked && (
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-dark-text-secondary">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        {t.blockSearch}
                      </div>
                    )}
                    {selectedUser.messages_blocked && (
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-dark-text-secondary">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        {t.blockMessages}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {selectedUser.is_active ? (
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setSuspensionReason('');
                      setBanOptions({
                        profileHidden: selectedUser.profile_hidden || false,
                        searchBlocked: selectedUser.search_blocked || false,
                        messagesBlocked: selectedUser.messages_blocked || false
                      });
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <LockClosedIcon className="h-5 w-5" />
                    {t.suspend}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleActivateUser(selectedUser.id);
                      setShowDetailModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <LockOpenIcon className="h-5 w-5" />
                    {t.activate}
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedUser(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text-primary rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors"
                >
                  {t.close}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suspension Modal - Responsive Design */}
      {selectedUser && suspensionReason !== undefined && selectedUser.is_active && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 md:p-6">
          <div className="bg-white dark:bg-dark-bg-secondary rounded-2xl w-full max-w-4xl max-h-[95vh] shadow-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 sm:p-6 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <LockClosedIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold text-white truncate">
                    {t.suspendUser}
                  </h3>
                  <p className="text-red-100 text-xs sm:text-sm mt-0.5 truncate">
                    {selectedUser.full_name || selectedUser.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {/* Suspension Reason */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-dark-text-secondary mb-2">
                    {t.suspensionReason}
                  </label>
                  <textarea
                    value={suspensionReason}
                    onChange={(e) => setSuspensionReason(e.target.value)}
                    placeholder={t.enterReason}
                    className="w-full p-3 border-2 border-gray-200 dark:border-dark-border rounded-xl bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-dark-text-primary focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all resize-none text-sm sm:text-base"
                    rows={3}
                  />
                </div>

                {/* Duration Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-dark-text-secondary mb-3">
                    {t.duration}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {[
                      { value: '1h', label: t.oneHour, icon: '⏰' },
                      { value: '1d', label: t.oneDay, icon: '📅' },
                      { value: '1w', label: t.oneWeek, icon: '📆' },
                      { value: '1m', label: t.oneMonth, icon: '🗓️' },
                      { value: 'custom', label: t.custom, icon: '⚙️' },
                      { value: 'permanent', label: t.permanent, icon: '🚫' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSuspensionDuration(option.value)}
                        className={`p-2 sm:p-3 rounded-xl border-2 transition-all ${
                          suspensionDuration === option.value
                            ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 shadow-md'
                            : 'border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg-tertiary text-gray-700 dark:text-dark-text-primary hover:border-red-300 dark:hover:border-red-700'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-lg sm:text-xl mb-0.5 sm:mb-1">{option.icon}</div>
                          <div className="text-[10px] sm:text-xs font-medium leading-tight">{option.label}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Duration Input */}
                {suspensionDuration === 'custom' && (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-bg-tertiary dark:to-dark-bg-tertiary rounded-xl p-4 sm:p-5 border-2 border-red-200 dark:border-red-900/30 shadow-inner space-y-4">
                    {/* Date Picker */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-dark-text-secondary mb-2">
                        {t.selectDate}
                      </label>
                      <input
                        type="date"
                        value={customDate}
                        min={new Date().toISOString().split('T')[0]}
                        max={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                        onChange={(e) => setCustomDate(e.target.value)}
                        className="w-full p-3 border-2 border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary focus:ring-2 focus:ring-red-500 focus:border-red-500 font-semibold shadow-sm"
                      />
                    </div>

                    {/* Or Divider */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <span className="px-3 bg-gray-50 dark:bg-dark-bg-tertiary text-xs font-medium text-gray-500 dark:text-gray-400">
                          {t.orByDays}
                        </span>
                      </div>
                    </div>

                    {/* Days Input */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-dark-text-secondary mb-2">
                        {t.customDays}
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={customDays}
                          onChange={(e) => {
                            const days = Math.max(1, Math.min(365, parseInt(e.target.value) || 1));
                            setCustomDays(days);
                            setCustomDate('');
                          }}
                          className="flex-1 p-3 sm:p-4 border-2 border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg-secondary text-gray-900 dark:text-dark-text-primary focus:ring-2 focus:ring-red-500 focus:border-red-500 text-center font-bold text-xl sm:text-2xl shadow-sm"
                        />
                        <span className="text-gray-600 dark:text-dark-text-secondary font-semibold text-sm sm:text-base whitespace-nowrap">
                          {customDays === 1 ? t.daySingular : t.dayPlural}
                        </span>
                      </div>
                    </div>

                    {/* Preview */}
                    <div className="pt-2 border-t border-gray-300 dark:border-gray-600">
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        <span className="font-semibold">{t.suspendedUntil}</span>
                        {' '}
                        {customDate
                          ? new Date(customDate).toLocaleDateString(lang === 'es' ? 'es' : 'en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                          : new Date(Date.now() + customDays * 24 * 60 * 60 * 1000).toLocaleDateString(lang === 'es' ? 'es' : 'en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                        }
                      </p>
                    </div>
                  </div>
                )}

                {/* Ban Options */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-dark-text-secondary mb-3">
                    {t.banOptions}
                  </label>
                  <div className="space-y-2 sm:space-y-3">
                    {[
                      { key: 'profileHidden', label: t.hideProfile, icon: '👁️', description: t.notPubliclyVisible },
                      { key: 'searchBlocked', label: t.blockSearch, icon: '🔍', description: t.excludedFromSearches },
                      { key: 'messagesBlocked', label: t.blockMessages, icon: '💬', description: t.noMessagingAccess }
                    ].map((option) => (
                      <label
                        key={option.key}
                        className={`flex items-start gap-3 p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          banOptions[option.key as keyof typeof banOptions]
                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-md'
                            : 'border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg-tertiary hover:border-orange-300 dark:hover:border-orange-700 hover:shadow-sm'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={banOptions[option.key as keyof typeof banOptions]}
                          onChange={(e) => setBanOptions({ ...banOptions, [option.key]: e.target.checked })}
                          className="mt-0.5 sm:mt-1 h-5 w-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-base sm:text-lg flex-shrink-0">{option.icon}</span>
                            <div className="font-semibold text-gray-900 dark:text-dark-text-primary text-sm sm:text-base">
                              {option.label}
                            </div>
                          </div>
                          <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {option.description}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions - Sticky */}
            <div className="bg-gray-50 dark:bg-dark-bg-tertiary px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row gap-2 sm:gap-3 border-t border-gray-200 dark:border-dark-border flex-shrink-0">
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setSuspensionReason(undefined);
                  setSuspensionDuration('permanent');
                  setCustomDays(1);
                  setCustomDate('');
                }}
                className="w-full sm:flex-1 px-4 py-3 border-2 border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text-primary rounded-xl hover:bg-white dark:hover:bg-dark-bg-secondary transition-colors font-medium text-sm sm:text-base"
              >
                {t.close}
              </button>
              <button
                onClick={() => handleSuspendUser(selectedUser.id, suspensionReason)}
                disabled={!suspensionReason?.trim() || (suspensionDuration === 'custom' && !customDate && !customDays)}
                className="w-full sm:flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-semibold shadow-lg shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none text-sm sm:text-base"
              >
                {t.confirmAction}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
          <div className={`rounded-lg shadow-lg p-4 flex items-center gap-3 ${
            toast.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircleIcon className="h-5 w-5" />
            ) : (
              <XCircleIcon className="h-5 w-5" />
            )}
            <p className="font-medium">{toast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserModeration;
