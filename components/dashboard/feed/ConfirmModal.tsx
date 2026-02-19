import React, { useEffect } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  variant?: 'danger' | 'default';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  isLoading = false,
  variant = 'danger',
}) => {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, isLoading, onCancel]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !isLoading) onCancel(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-white dark:bg-dark-bg-secondary rounded-2xl shadow-2xl border border-gray-200 dark:border-dark-border overflow-hidden">
        <div className="p-6 text-center">
          {/* Icon */}
          <div className={`w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center ${
            isDanger
              ? 'bg-red-100 dark:bg-red-900/20'
              : 'bg-blue-100 dark:bg-blue-900/20'
          }`}>
            <ExclamationTriangleIcon className={`w-6 h-6 ${
              isDanger
                ? 'text-red-600 dark:text-red-400'
                : 'text-cv-blue'
            }`} />
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            {title}
          </h3>

          {/* Message */}
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-dark-bg-tertiary rounded-xl hover:bg-gray-200 dark:hover:bg-dark-border transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2 ${
              isDanger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-cv-blue hover:bg-blue-700'
            }`}
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
