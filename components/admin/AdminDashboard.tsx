import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import BlogManagementSection from '../BlogManagementSection';
import SuccessStoriesManagement from './SuccessStoriesManagement';
import ProfilesManagement from './ProfilesManagement';
import StampsManagement from './StampsManagement';
import AlertModal from '../AlertModal';
import { useCustomDialog } from '../../hooks/useCustomDialog';

interface User {
  id: string;
  full_name: string;
  email: string;
  headline: string;
  plan: string;
  role: string;
  created_at: string;
  updated_at: string;
}

const AdminDashboard: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { dialogState, showAlert, showConfirm, closeDialog, handleConfirm, handleCancel } = useCustomDialog();

  // Load active tab from sessionStorage on mount
  const [activeTab, setActiveTab] = useState<'users' | 'profiles' | 'blog' | 'stories' | 'stamps'>(() => {
    const savedTab = sessionStorage.getItem('adminDashboardTab');
    return (savedTab === 'blog' || savedTab === 'stories' || savedTab === 'profiles' || savedTab === 'stamps' ? savedTab : 'users') as 'users' | 'profiles' | 'blog' | 'stories' | 'stamps';
  });
  const [stats, setStats] = useState({
    total_users: 0,
    total_free_users: 0,
    total_pro_users: 0,
    total_premium_users: 0,
    users_last_7_days: 0,
    users_last_30_days: 0
  });

  useEffect(() => {
    if (!profile || profile.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    loadData();
  }, [profile, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar usuarios directamente desde la tabla
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, headline, plan, role, created_at, updated_at, email');

      if (profilesError) {
        console.error('Error loading profiles:', profilesError);
        throw profilesError;
      }

      // Si no hay columna email en profiles, mostrar N/A
      const usersWithEmails = (profilesData || []).map((p) => ({
        ...p,
        email: p.email || 'N/A'
      }));

      setUsers(usersWithEmails as User[]);

      // Calcular estadísticas manualmente
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      setStats({
        total_users: profilesData?.length || 0,
        total_free_users: profilesData?.filter(p => !p.plan || p.plan === 'Free').length || 0,
        total_pro_users: profilesData?.filter(p => p.plan === 'Pro').length || 0,
        total_premium_users: profilesData?.filter(p => p.plan === 'Premium').length || 0,
        users_last_7_days: profilesData?.filter(p => new Date(p.created_at) >= sevenDaysAgo).length || 0,
        users_last_30_days: profilesData?.filter(p => new Date(p.created_at) >= thirtyDaysAgo).length || 0
      });

    } catch (err: any) {
      console.error('Error loading admin data:', err);
      setError(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlan = async (userId: string, newPlan: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ plan: newPlan, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;
      loadData();
      showAlert({
        title: 'Éxito',
        message: 'Plan actualizado correctamente',
        type: 'success'
      });
    } catch (err: any) {
      showAlert({
        title: 'Error',
        message: 'Error: ' + err.message,
        type: 'error'
      });
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;
      loadData();
      showAlert({
        title: 'Éxito',
        message: 'Rol actualizado correctamente',
        type: 'success'
      });
    } catch (err: any) {
      showAlert({
        title: 'Error',
        message: 'Error: ' + err.message,
        type: 'error'
      });
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    const confirmed = await showConfirm({
      title: 'Confirmar eliminación',
      message: `¿Eliminar a "${userName}"? Esta acción no se puede deshacer.`,
      type: 'warning',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar'
    });

    if (!confirmed) {
      return;
    }

    try {
      // Eliminar perfil (CASCADE eliminará datos relacionados)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      loadData();
      showAlert({
        title: 'Éxito',
        message: 'Usuario eliminado correctamente',
        type: 'success'
      });
    } catch (err: any) {
      showAlert({
        title: 'Error',
        message: 'Error: ' + err.message,
        type: 'error'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cv-blue"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary flex items-center justify-center">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">Error</h2>
          <p className="text-red-600 dark:text-red-300">{error}</p>
          <button
            onClick={loadData}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg-primary">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-900 dark:to-purple-900 border-b border-indigo-700 dark:border-indigo-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-white/20 p-2 rounded-lg">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h1 className="text-4xl font-bold text-white">
                  Admin Dashboard
                </h1>
              </div>
              <p className="text-indigo-100 text-lg">
                Manage users, content, profiles, and platform settings. Monitor system statistics and handle administrative tasks.
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium backdrop-blur-sm transition-all border border-white/30 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200 dark:border-dark-border">
            <nav className="-mb-px flex space-x-8">
              <button
                data-testid="nav-users"
                onClick={() => setActiveTab('users')}
                className={`${
                  activeTab === 'users'
                    ? 'border-cv-blue text-cv-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                👥 Gestión de Usuarios
              </button>
              <button
                data-testid="nav-blog"
                onClick={() => setActiveTab('blog')}
                className={`${
                  activeTab === 'blog'
                    ? 'border-cv-blue text-cv-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                📝 Gestión de Blog
              </button>
              <button
                data-testid="nav-profiles"
                onClick={() => setActiveTab('profiles')}
                className={`${
                  activeTab === 'profiles'
                    ? 'border-cv-blue text-cv-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                🔍 Gestión de Perfiles
              </button>
              <button
                data-testid="nav-stories"
                onClick={() => setActiveTab('stories')}
                className={`${
                  activeTab === 'stories'
                    ? 'border-cv-blue text-cv-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                ⭐ Historias de Éxito
              </button>
              <button
                data-testid="nav-stamps"
                onClick={() => setActiveTab('stamps')}
                className={`${
                  activeTab === 'stamps'
                    ? 'border-cv-blue text-cv-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                ✅ Verificación de Stamps
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'users' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl shadow-lg p-6 text-white transform transition-transform hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-blue-100">Total Usuarios</div>
              <div className="bg-white/20 p-2 rounded-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold">{stats.total_users}</div>
            <div className="text-xs text-blue-100 mt-2">Platform users</div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-xl shadow-lg p-6 text-white transform transition-transform hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-green-100">Usuarios Pro</div>
              <div className="bg-white/20 p-2 rounded-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold">{stats.total_pro_users}</div>
            <div className="text-xs text-green-100 mt-2">Premium tier</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-xl shadow-lg p-6 text-white transform transition-transform hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-purple-100">Usuarios Premium</div>
              <div className="bg-white/20 p-2 rounded-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold">{stats.total_premium_users}</div>
            <div className="text-xs text-purple-100 mt-2">Top tier users</div>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 rounded-xl shadow-lg p-6 text-white transform transition-transform hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-orange-100">Últimos 7 días</div>
              <div className="bg-white/20 p-2 rounded-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold">{stats.users_last_7_days}</div>
            <div className="text-xs text-orange-100 mt-2">New signups</div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-dark-bg-secondary rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-border">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Usuarios ({users.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
              <thead className="bg-gray-50 dark:bg-dark-bg-tertiary">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Rol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-bg-secondary divide-y divide-gray-200 dark:divide-dark-border">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.full_name || 'Sin nombre'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.headline || 'Sin título'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.plan || 'Free'}
                        onChange={(e) => handleUpdatePlan(user.id, e.target.value)}
                        className="text-sm border border-gray-300 dark:border-dark-border rounded px-2 py-1 bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white"
                      >
                        <option value="Free">Free</option>
                        <option value="Pro">Pro</option>
                        <option value="Premium">Premium</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role || 'user'}
                        onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                        className="text-sm border border-gray-300 dark:border-dark-border rounded px-2 py-1 bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => window.open(`/cv/${user.id}`, '_blank')}
                        className="text-cv-blue hover:text-blue-700 mr-4"
                      >
                        Ver CV
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id, user.full_name)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
          </>
        )}

        {activeTab === 'profiles' && (
          <ProfilesManagement />
        )}

        {activeTab === 'blog' && (
          <BlogManagementSection />
        )}

        {activeTab === 'stories' && (
          <SuccessStoriesManagement />
        )}

        {activeTab === 'stamps' && (
          <StampsManagement />
        )}
      </div>

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

export default AdminDashboard;
