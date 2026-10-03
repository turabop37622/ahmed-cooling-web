'use client';

// Admin toasts.
//   const toast = useAdminToast();
//   toast.success(L('Booking confirmed', 'تم تأكيد الحجز'));
//   toast.error(err.message);            // red, with an error icon; stays longer
//   toast.info('...');
// Messages are announced to screen readers (polite for success/info, assertive for errors).

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useAdminLang } from '../AdminI18n';

const ToastContext = createContext(null);

const DURATION = { success: 4000, info: 5000, error: 7000 };
const MAX_VISIBLE = 4;

const TONE = {
  success: {
    icon: CheckCircle2,
    box: 'border-emerald-200 bg-white text-slate-900 dark:border-emerald-500/30 dark:bg-slate-900 dark:text-slate-100',
    icon_: 'text-emerald-600 dark:text-emerald-400',
  },
  error: {
    icon: AlertCircle,
    box: 'border-red-300 bg-red-50 text-red-900 dark:border-red-500/40 dark:bg-red-950 dark:text-red-100',
    icon_: 'text-red-600 dark:text-red-400',
  },
  info: {
    icon: Info,
    box: 'border-blue-200 bg-white text-slate-900 dark:border-blue-500/30 dark:bg-slate-900 dark:text-slate-100',
    icon_: 'text-blue-600 dark:text-blue-400',
  },
};

function ToastItem({ toast, onDismiss }) {
  const { L } = useAdminLang();
  const tone = TONE[toast.type] || TONE.info;
  const Icon = tone.icon;

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), DURATION[toast.type] || 5000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.type, onDismiss]);

  return (
    <div
      role={toast.type === 'error' ? 'alert' : 'status'}
      className={`pointer-events-auto flex w-full items-start gap-3 rounded-xl border p-3 shadow-lg ${tone.box}`}
    >
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${tone.icon_}`} aria-hidden="true" />
      <p className="min-w-0 flex-1 break-words text-sm font-medium leading-relaxed" dir="auto">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label={L('Dismiss notification', 'إغلاق التنبيه')}
        className="-m-1.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg opacity-70 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 pointer-coarse:h-11 pointer-coarse:w-11"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function AdminToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((type, message) => {
    const text = typeof message === 'string' ? message : message?.message || String(message ?? '');
    if (!text) return null;
    const id = nextId.current++;
    setToasts((list) => {
      // The same message twice in a row (e.g. a double click) shows once
      if (list.some((t) => t.type === type && t.message === text)) return list;
      return [...list, { id, type, message: text }].slice(-MAX_VISIBLE);
    });
    return id;
  }, []);

  const api = useMemo(() => ({
    success: (message) => push('success', message),
    error: (message) => push('error', message),
    info: (message) => push('info', message),
    dismiss,
  }), [push, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Always at the top, just below the 64px top bar (and below a drawer's header with its close button):
          drawer and dialog footers (the action buttons) sit at the bottom, so a toast can never cover them.
          Centred on phones, at the inline end (right in English, left in Arabic) from 640px up. */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-16 z-[70] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:end-0 sm:w-96 sm:items-stretch"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useAdminToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useAdminToast must be used inside AdminToastProvider');
  return ctx;
}

export default AdminToastProvider;
