import { useState, useCallback, useRef, useEffect } from 'react';
import { ToastType } from '../components/common/Toast';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Cleanup all timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current.clear();
    };
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 5000) => {
    // Clear all existing timeouts
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current.clear();

    const id = Math.random().toString(36).substring(7);

    // Replace all toasts with just this one (max 1 toast at a time)
    setToasts([{ id, message, type }]);

    // Auto-dismiss after duration
    const timeout = setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
      timeoutsRef.current.delete(id);
    }, duration);

    timeoutsRef.current.set(id, timeout);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));

    // Clear the timeout if exists
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
  }, []);

  return {
    toasts,
    showToast,
    removeToast,
    success: useCallback((message: string, duration: number = 5000) => showToast(message, 'success', duration), [showToast]),
    error: useCallback((message: string, duration: number = 5000) => showToast(message, 'error', duration), [showToast]),
    warning: useCallback((message: string, duration: number = 5000) => showToast(message, 'warning', duration), [showToast]),
    info: useCallback((message: string, duration: number = 5000) => showToast(message, 'info', duration), [showToast])
  };
};
