import React, { useCallback, useMemo, useState } from 'react';
import { ToastContext, ToastTone } from './ToastContextBase';

interface ToastMessage {
  id: string;
  tone: ToastTone;
  message: string;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast = useCallback((tone: ToastTone, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { id, tone, message }]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3500);
  }, []);

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 1000 }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            style={{
              marginTop: 8,
              minWidth: 280,
              padding: '10px 12px',
              border:
                toast.tone === 'success'
                  ? '1px solid var(--status-nominal)'
                  : toast.tone === 'error'
                    ? '1px solid var(--status-blocked)'
                    : '1px solid var(--border-strong)',
              background:
                toast.tone === 'success'
                  ? 'var(--accent-teal-soft)'
                  : toast.tone === 'error'
                    ? 'rgba(208, 106, 106, 0.16)'
                    : 'var(--bg-2)',
              color: 'var(--text-primary)',
              boxShadow: '0 8px 20px -14px rgba(3,8,15,0.85)',
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
