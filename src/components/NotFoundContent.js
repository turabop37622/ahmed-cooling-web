'use client';

import Link from 'next/link';
import { useTranslation } from '../contexts/TranslationContext';
import { pathForLang } from '../lib/lang';

const COPY = {
  ar: {
    heading: 'الصفحة غير موجودة',
    text: 'ربما تم نقل الصفحة أو أن الرابط غير صحيح. يمكنك العودة للرئيسية أو تصفح خدماتنا.',
    home: 'العودة للرئيسية',
    services: 'تصفح الخدمات',
  },
  en: {
    heading: 'Page not found',
    text: 'The page may have moved or the link is wrong. Go back home or browse our services.',
    home: 'Back to home',
    services: 'Browse services',
  },
};

// Body of the 404 page. Client side so it follows the language toggle without a reload.
export default function NotFoundContent() {
  const { language, isRTL } = useTranslation();
  const lang = language === 'ar' ? 'ar' : 'en';
  const c = COPY[lang];
  const code = new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US', { useGrouping: false }).format(404);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-20" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md text-center">
        <p className="text-7xl font-semibold text-primary dark:text-blue-400">{code}</p>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-white">{c.heading}</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{c.text}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={pathForLang('/', lang)}
            className="inline-flex min-h-11 items-center rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-primary-dark"
          >
            {c.home}
          </Link>
          <Link
            href={pathForLang('/services', lang)}
            className="inline-flex min-h-11 items-center rounded-xl border border-border px-6 py-3 text-sm font-semibold text-text transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800"
          >
            {c.services}
          </Link>
        </div>
      </div>
    </div>
  );
}
