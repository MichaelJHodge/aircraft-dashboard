import { createContext } from 'react';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastContextValue {
  pushToast: (tone: ToastTone, message: string) => void;
}

export const ToastContext = createContext<ToastContextValue | undefined>(undefined);
