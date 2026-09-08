'use client';

import { createContext, useCallback, useContext, useState, ReactNode } from 'react';

interface Toast {
  id: number;
  message: string;
  isError: boolean;
}

interface ToastContextValue {
  showToast: (message: string, isError?: boolean) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, isError = false) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, isError }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.map((t) => (
        <div key={t.id} className={`toast show ${t.isError ? 'error' : ''}`}>
          <i className="fas fa-feather-alt" style={{ marginRight: '8px' }} />
          {t.message}
        </div>
      ))}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
