'use client';

// EN / عربي switch for the admin panel (top bar and login page)

import { Languages } from 'lucide-react';
import { useAdminLang } from '../AdminI18n';

export default function LangToggle({ className = '' }) {
  const { isAr, setLang } = useAdminLang();
  const nextLabel = isAr ? 'English' : 'العربية';
  return (
    <button
      type="button"
      onClick={() => setLang(isAr ? 'en' : 'ar')}
      aria-label={isAr ? 'Switch to English' : 'التبديل إلى العربية'}
      title={nextLabel}
      lang={isAr ? 'en' : 'ar'}
      className={`inline-flex h-10 min-w-10 items-center justify-center gap-1.5 rounded-xl px-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 pointer-coarse:h-11 pointer-coarse:min-w-11 dark:text-slate-200 dark:hover:bg-slate-800 ${className}`}
    >
      <Languages className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className={isAr ? 'font-sans' : 'font-arabic'}>{isAr ? 'EN' : 'عربي'}</span>
    </button>
  );
}

export { LangToggle };
