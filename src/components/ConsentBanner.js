'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '../contexts/TranslationContext';
import { loadTikTok } from '../lib/tiktok';

const KEY = 'cookie-consent'; // 'granted' | 'denied'

// Asks before loading the TikTok advertising pixel. Nothing is tracked until the visitor accepts.
export default function ConsentBanner() {
  const { language, isRTL } = useTranslation();
  const isAr = language === 'ar';
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let saved = null;
    try {
      saved = localStorage.getItem(KEY);
    } catch {}
    if (saved === 'granted') loadTikTok();
    else if (!saved) setOpen(true);

    // "Cookie settings" in the footer lets the visitor change their mind
    const reopen = () => setOpen(true);
    window.addEventListener('open-cookie-settings', reopen);
    return () => window.removeEventListener('open-cookie-settings', reopen);
  }, []);

  const decide = (value) => {
    try {
      localStorage.setItem(KEY, value);
    } catch {}
    if (value === 'granted') loadTikTok();
    else if (window.ttq && typeof window.ttq.revokeConsent === 'function') window.ttq.revokeConsent();
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-label={isAr ? 'إشعار ملفات تعريف الارتباط' : 'Cookie notice'}
      dir={isRTL ? 'rtl' : 'ltr'}
      className="fixed inset-x-3 bottom-3 z-[60] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:inset-x-auto sm:start-4 sm:max-w-md"
    >
      <p className="text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300">
        {isAr
          ? 'نستخدم أداة قياس من TikTok لفهم أداء إعلاناتنا. لن يتم تفعيلها إلا بموافقتك.'
          : 'We use a TikTok measurement pixel to understand how our ads perform. It is only switched on if you accept.'}{' '}
        <Link href="/privacy" className="font-semibold text-blue-700 underline dark:text-blue-300">
          {isAr ? 'سياسة الخصوصية' : 'Privacy policy'}
        </Link>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => decide('granted')}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          {isAr ? 'أوافق' : 'Accept'}
        </button>
        <button
          type="button"
          onClick={() => decide('denied')}
          className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {isAr ? 'لا أوافق' : 'Decline'}
        </button>
      </div>
    </div>
  );
}
