import { useState, useCallback } from 'react';
import { ToastType } from '../components/common/Toast';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return {
    toasts,
    showToast,
    removeToast,
    success: useCallback((message: string) => showToast(message, 'success'), [showToast]),
    error: useCallback((message: string) => showToast(message, 'error'), [showToast]),
    info: useCallback((message: string) => showToast(message, 'info'), [showToast])
  };
};
