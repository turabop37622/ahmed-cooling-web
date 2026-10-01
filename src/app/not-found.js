'use client';

import Link from 'next/link';
import { useTranslation } from '../contexts/TranslationContext';

export default function NotFound() {
  const { language, isRTL } = useTranslation();
  const isAr = language === 'ar';

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-20" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md text-center">
        <p className="text-7xl font-semibold text-primary dark:text-blue-400">404</p>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-white">
          {isAr ? 'الصفحة غير موجودة' : 'Page not found'}
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {isAr
            ? 'ربما تم نقل الصفحة أو أن الرابط غير صحيح. يمكنك العودة للرئيسية أو تصفح خدماتنا.'
            : 'The page may have moved or the link is wrong. Go back home or browse our services.'}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-primary-dark"
          >
            {isAr ? 'العودة للرئيسية' : 'Back to home'}
          </Link>
          <Link
            href="/services"
            className="inline-flex items-center rounded-xl border border-border px-6 py-3 text-sm font-semibold text-text transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800"
          >
            {isAr ? 'تصفح الخدمات' : 'Browse services'}
          </Link>
        </div>
      </div>
    </div>
  );
}
