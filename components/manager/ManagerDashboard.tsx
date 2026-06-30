import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilSquareIcon,
  ArrowTopRightOnSquareIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase/client';
import LoadingSpinner from '../shared/LoadingSpinner';

interface ManagedProfileRow {
  id: string;
  full_name: string;
  headline: string | null;
  email: string | null;
  slug: string | null;
  avatar_url: string | null;
  created_at: string | null;
}

// Panel del rol `profile_manager`: crea y gestiona varios perfiles profesionales.
const ManagerDashboard: React.FC = () => {
  const { session } = useAuth();
  const navigate = useNavigate();

  const [profiles, setProfiles] = useState<ManagedProfileRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulario de creación
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [fullName, setFullName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [headline, setHeadline] = useState('');

  const loadProfiles = useCallback(async () => {
    if (!session?.user.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, headline, email, slug, avatar_url, created_at')
        .eq('managed_by', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles((data || []) as ManagedProfileRow[]);
    } catch (e) {
      toast.error('No se pudieron cargar los perfiles gestionados');
    } finally {
      setLoading(false);
    }
  }, [session?.user.id]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('El nombre completo es obligatorio');
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-create-managed-profile', {
        body: {
          full_name: fullName.trim(),
          contact_email: contactEmail.trim() || undefined,
          headline: headline.trim() || undefined,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Perfil creado');
      const newId = data?.profile?.id as string | undefined;
      setFullName('');
      setContactEmail('');
      setHeadline('');
      setShowForm(false);
      await loadProfiles();

      // Lleva directamente al editor del perfil recién creado
      if (newId) navigate(`/manager/edit/${newId}`);
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo crear el perfil');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30">
            <UserGroupIcon className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Perfiles gestionados</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Crea y edita perfiles profesionales que administras.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Crear perfil
        </button>
      </div>

      {/* Formulario de creación */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-8 p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 space-y-4"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Nuevo perfil gestionado</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                maxLength={50}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej. María García"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email de contacto (opcional)
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="contacto@ejemplo.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titular / headline (opcional)
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              maxLength={150}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej. Profesora de Psicología | Especialista en..."
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {creating ? 'Creando...' : 'Crear y editar'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Listado */}
      {loading ? (
        <LoadingSpinner message="Cargando perfiles..." />
      ) : profiles.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
          <UserGroupIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-600 dark:text-gray-400">Aún no has creado ningún perfil gestionado.</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Crear el primero
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {profiles.map((p) => (
            <div
              key={p.id}
              className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex flex-col"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden flex items-center justify-center text-gray-400">
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt={p.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-semibold">
                      {(p.full_name || '?').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{p.full_name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {p.headline || 'Sin titular'}
                  </p>
                </div>
              </div>
              <div className="mt-auto flex items-center gap-2">
                <button
                  onClick={() => navigate(`/manager/edit/${p.id}`)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <PencilSquareIcon className="w-4 h-4" />
                  Editar
                </button>
                {p.slug && (
                  <a
                    href={`/cv/${p.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    title="Ver CV público"
                  >
                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
