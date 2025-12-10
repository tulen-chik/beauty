'use client';

import { createContext, useContext, ReactNode } from 'react';
import { showSuccessToast, showErrorToast, showLoadingToast, dismissToast, dismissAllToasts } from '@/lib/toast';

interface ToastContextType {
  success: (message: string) => void;
  error: (message: string) => void;
  loading: (message: string) => string;
  dismiss: (toastId: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const toastFunctions: ToastContextType = {
    success: showSuccessToast,
    error: showErrorToast,
    loading: showLoadingToast,
    dismiss: dismissToast,
    dismissAll: dismissAllToasts,
  };

  return (
    <ToastContext.Provider value={toastFunctions}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
