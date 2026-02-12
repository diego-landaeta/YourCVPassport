import React, { useState, memo } from 'react';
import { EllipsisHorizontalIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../../../contexts/LanguageContext';

interface PostOptionsMenuProps {
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

const PostOptionsMenu: React.FC<PostOptionsMenuProps> = memo(({
  onEdit,
  onDelete,
  isDeleting
}) => {
  const { lang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const t = {
    en: {
      edit: 'Edit',
      delete: 'Delete',
      deleting: 'Deleting...'
    },
    es: {
      edit: 'Editar',
      delete: 'Eliminar',
      deleting: 'Eliminando...'
    }
  };

  const translations = t[lang];

  const handleEdit = () => {
    setIsOpen(false);
    onEdit();
  };

  const handleDelete = () => {
    setIsOpen(false);
    onDelete();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary rounded-full transition-colors"
      >
        <EllipsisHorizontalIcon className="w-5 h-5" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-dark-bg-secondary rounded-lg shadow-lg border border-gray-200 dark:border-dark-border py-1 z-20">
            <button
              onClick={handleEdit}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary transition-colors"
            >
              <PencilIcon className="w-4 h-4" />
              {translations.edit}
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                  {translations.deleting}
                </>
              ) : (
                <>
                  <TrashIcon className="w-4 h-4" />
                  {translations.delete}
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
});

PostOptionsMenu.displayName = 'PostOptionsMenu';
export default PostOptionsMenu;
