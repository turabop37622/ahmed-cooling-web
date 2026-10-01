'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from '../contexts/TranslationContext';

export default function RouteError({ error, reset }) {
  const { language, isRTL } = useTranslation();
  const isAr = language === 'ar';

  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="mb-2 text-2xl font-semibold text-slate-900 dark:text-white">
          {isAr ? 'حدث خطأ ما' : 'Something went wrong'}
        </h1>
        <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
          {isAr
            ? 'تعذر تحميل هذه الصفحة. حاول مرة أخرى، وإذا استمرت المشكلة تواصل معنا.'
            : 'We could not load this page. Please try again, and contact us if the problem continues.'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-primary-dark"
          >
            {isAr ? 'إعادة المحاولة' : 'Try again'}
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-semibold text-text transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800"
          >
            {isAr ? 'العودة للرئيسية' : 'Back to home'}
          </Link>
        </div>
      </div>
    </div>
  );
}
