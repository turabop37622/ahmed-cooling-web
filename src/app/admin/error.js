'use client';

// Error boundary for admin pages. It renders inside the admin layout, so the language comes from
// AdminLangProvider; the reading of localStorage below is only a fallback if that context is missing.

import { useEffect, useState } from 'react';
import { AlertTriangle, RotateCcw, LayoutDashboard } from 'lucide-react';
import { useAdminLang } from './AdminI18n';

function useLangSafe() {
  try {
    return useAdminLang();
  } catch {
    return null;
  }
}

export default function AdminError({ error, reset }) {
  const ctx = useLangSafe();
  const [fallbackAr, setFallbackAr] = useState(false);

  useEffect(() => {
    console.error('Admin panel error:', error);
  }, [error]);

  useEffect(() => {
    if (ctx) return;
    try { setFallbackAr(localStorage.getItem('adminLang') === 'ar'); } catch { /* ignore */ }
  }, [ctx]);

  const isAr = ctx ? ctx.isAr : fallbackAr;
  const L = (en, ar) => (isAr ? ar : en);
  const offline = typeof navigator !== 'undefined' && navigator.onLine === false;

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4" dir={isAr ? 'rtl' : 'ltr'} role="alert">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          {L('Something went wrong', 'حدث خطأ ما')}
        </h1>
        <p className="text-sm text-slate-700 dark:text-slate-300 mb-6 leading-relaxed">
          {offline
            ? L('You seem to be offline. Check your connection, then try again.', 'يبدو أنك غير متصل بالإنترنت. تحقق من الاتصال ثم حاول مرة أخرى.')
            : L('This page could not be shown. Try again — if it keeps happening, reload the page or come back later.', 'تعذر عرض هذه الصفحة. حاول مرة أخرى، وإذا تكرر الخطأ أعد تحميل الصفحة أو عد لاحقاً.')}
        </p>
        {error?.digest && (
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-6" dir="ltr">
            {L('Error code', 'رمز الخطأ')}: {error.digest}
          </p>
        )}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 text-sm font-semibold text-white shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            {L('Try again', 'حاول مرة أخرى')}
          </button>
          <a
            href="/admin/dashboard"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 px-6 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
            {L('Dashboard', 'لوحة المعلومات')}
          </a>
        </div>
      </div>
    </div>
  );
}
