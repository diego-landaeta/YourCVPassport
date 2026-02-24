import React, { useState } from 'react';
import { useGroupActions } from '../../../hooks/useGroups';
import { Group } from '../../../types/groups';
import { useLanguage } from '../../../contexts/LanguageContext';

interface CreateGroupModalProps {
  type?: 'group' | 'channel';
  onClose: () => void;
  onCreated: (group: Group) => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ type = 'group', onClose, onCreated }) => {
  const { lang } = useLanguage();
  const { createGroup } = useGroupActions();
  const isEs = lang === 'es';
  const isChannel = type === 'channel';

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const namePlaceholder = isChannel
    ? (isEs ? 'Ej: Noticias Tech Latinoamérica' : 'E.g. Tech News Latam')
    : (isEs ? 'Ej: Desarrolladores React Latinoamérica' : 'E.g. React Developers Latam');

  const descPlaceholder = isChannel
    ? (isEs ? 'Describe de qué trata este canal…' : 'Describe what this channel is about…')
    : (isEs ? 'Describe de qué trata este grupo…' : 'Describe what this group is about…');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(isEs ? 'El nombre es obligatorio' : 'Name is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const group = await createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        is_private: isPrivate,
        metadata: { type },
      });
      if (group) {
        onCreated(group);
      } else {
        setError(
          isChannel
            ? (isEs ? 'Error al crear el canal. Inténtalo de nuevo.' : 'Error creating channel. Please try again.')
            : (isEs ? 'Error al crear el grupo. Inténtalo de nuevo.' : 'Error creating group. Please try again.')
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const titleLabel = isChannel ? (isEs ? 'Crear canal' : 'Create channel') : (isEs ? 'Crear grupo' : 'Create group');
  const nameLabel = isChannel ? (isEs ? 'Nombre del canal' : 'Channel name') : (isEs ? 'Nombre del grupo' : 'Group name');
  const privacyLabel = isChannel ? (isEs ? 'Canal privado' : 'Private channel') : (isEs ? 'Grupo privado' : 'Private group');
  const privacyDesc = isEs ? 'Solo miembros pueden ver los posts' : 'Only members can see posts';
  const submitLabel = loading
    ? (isEs ? 'Creando…' : 'Creating…')
    : titleLabel;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-bold text-gray-900 dark:text-gray-100">
            {titleLabel}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {nameLabel} *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={100}
              placeholder={namePlaceholder}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-cv-blue"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {isEs ? 'Descripción (opcional)' : 'Description (optional)'}
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder={descPlaceholder}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-cv-blue resize-none"
            />
          </div>

          {/* Privacy toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {privacyLabel}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {privacyDesc}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsPrivate(p => !p)}
              className={`relative w-11 h-6 rounded-full transition-colors ${isPrivate ? 'bg-cv-blue' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isPrivate ? 'translate-x-5' : ''}`}
              />
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {isEs ? 'Cancelar' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-50 ${
                isChannel ? 'bg-purple-500 hover:bg-purple-600' : 'bg-cv-blue hover:bg-blue-700'
              }`}
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
