import React, { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../shared/LoadingSpinner';
import { EditorTargetProvider } from '../../contexts/EditorTargetContext';
import {
  loadManagedProfileData,
  saveIdentity,
  saveExperience,
  saveEducation,
  saveSkills,
  saveLanguages,
  savePortfolio,
  savePreferences,
} from '../../utils/managedProfileSave';

const ProfileWizard = lazy(() => import('../profile-editor/ProfileWizard'));

// Editor de un PERFIL GESTIONADO. Reutiliza el ProfileWizard del usuario normal,
// pero apuntando a un perfil cuyo managed_by = gestor actual. Las escrituras se
// autorizan por las políticas RLS "Managers manage managed profile <tabla>".
const ManagedProfileEditor: React.FC = () => {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [data, setData] = useState<Awaited<ReturnType<typeof loadManagedProfileData>> | null>(null);

  const reload = useCallback(async () => {
    if (!profileId) return;
    setLoading(true);
    try {
      const result = await loadManagedProfileData(profileId);
      if (!result.profile) {
        setNotFound(true);
      } else {
        setData(result);
      }
    } catch (e) {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (loading) {
    return <LoadingSpinner message="Cargando perfil gestionado..." size="large" />;
  }

  if (notFound || !data || !profileId || !data.profile) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Perfil no encontrado</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Este perfil no existe o no formas parte de quienes lo gestionan.
        </p>
        <button
          onClick={() => navigate('/manager')}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          Volver al panel
        </button>
      </div>
    );
  }

  const { profile } = data;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Cabecera de contexto: deja claro que se edita un perfil de otra persona */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/manager')}
            className="p-2 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-800/40 transition-colors"
            title="Volver al panel"
          >
            <ArrowLeftIcon className="w-5 h-5 text-amber-700 dark:text-amber-300" />
          </button>
          <div>
            <p className="text-xs uppercase tracking-wide text-amber-600 dark:text-amber-400 font-semibold">
              Editando perfil gestionado
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {profile.full_name || 'Sin nombre'}
            </p>
          </div>
        </div>
        {profile.slug && (
          <a
            href={`/cv/${profile.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Ver CV público
            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
          </a>
        )}
      </div>

      <Suspense fallback={<LoadingSpinner />}>
        <EditorTargetProvider profileId={profileId}>
        <ProfileWizard
          key={`managed-wizard-${profileId}`}
          profile={profile}
          experiences={data.experiences}
          education={data.education}
          skills={data.skills}
          languages={data.languages}
          portfolio={data.portfolio}
          visas={data.visas}
          certifications={data.certifications}
          onSaveIdentity={async (d: any) => {
            await saveIdentity(profileId, d, profile.slug);
            toast.success('Identidad guardada');
            await reload();
          }}
          onSaveExperience={async (d: any[]) => {
            await saveExperience(profileId, d);
            toast.success('Experiencia guardada');
            await reload();
          }}
          onSaveEducation={async (d: any[]) => {
            await saveEducation(profileId, d);
            toast.success('Educación guardada');
            await reload();
          }}
          onSaveSkills={async (d: any[]) => {
            await saveSkills(profileId, d);
            toast.success('Habilidades guardadas');
            await reload();
          }}
          onSaveLanguages={async (d: any[]) => {
            await saveLanguages(profileId, d);
            toast.success('Idiomas guardados');
            await reload();
          }}
          onSavePortfolio={async (d: any[]) => {
            await savePortfolio(profileId, d);
            toast.success('Portfolio guardado');
            await reload();
          }}
          onSavePreferences={async (d: any) => {
            await savePreferences(profileId, d);
            toast.success('Preferencias guardadas');
            await reload();
          }}
          onComplete={() => {
            toast.success('Perfil actualizado');
            navigate('/manager');
          }}
        />
        </EditorTargetProvider>
      </Suspense>
    </div>
  );
};

export default ManagedProfileEditor;
