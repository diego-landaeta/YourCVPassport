import { useState, useCallback } from 'react';

interface DialogConfig {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'confirm';
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

interface DialogState extends DialogConfig {
  isOpen: boolean;
  onConfirm?: () => void;
}

export const useCustomDialog = () => {
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success',
    confirmText: 'Aceptar',
    cancelText: 'Cancelar',
    showCancel: false,
  });

  const showAlert = useCallback((config: DialogConfig) => {
    setDialogState({
      ...config,
      isOpen: true,
      showCancel: false,
    });
  }, []);

  const showConfirm = useCallback((config: DialogConfig): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        ...config,
        type: config.type || 'confirm',
        isOpen: true,
        showCancel: true,
        onConfirm: () => {
          resolve(true);
        },
      });
    });
  }, []);

  const closeDialog = useCallback(() => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const handleConfirm = useCallback(() => {
    if (dialogState.onConfirm) {
      dialogState.onConfirm();
    }
    closeDialog();
  }, [dialogState.onConfirm, closeDialog]);

  const handleCancel = useCallback(() => {
    closeDialog();
  }, [closeDialog]);

  return {
    dialogState,
    showAlert,
    showConfirm,
    closeDialog,
    handleConfirm,
    handleCancel,
  };
};
