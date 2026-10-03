'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '../contexts/TranslationContext';
import { loadTikTok } from '../lib/tiktok';
import { pathForLang } from '../lib/lang';

const KEY = 'cookie-consent'; // 'granted' | 'denied'

// Asks before loading the TikTok advertising pixel. Nothing is tracked until the visitor accepts.
export default function ConsentBanner() {
  const { language, isRTL } = useTranslation();
  const isAr = language === 'ar';
  const [open, setOpen] = useState(false);
  const [barOffset, setBarOffset] = useState(0); // height of a sticky bottom bar (e.g. the service page booking bar)
  const bannerRef = useRef(null);

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

  // While open: sit above any visible full-width sticky bar at the bottom of the screen, and tell the
  // floating WhatsApp button (via --consent-offset) how far to move up on phones, where the banner is full width.
  useEffect(() => {
    const root = document.documentElement;
    if (!open) {
      root.style.removeProperty('--consent-offset');
      return undefined;
    }
    let frame = 0;
    let timer = 0;
    const measure = () => {
      frame = 0;
      let bar = 0;
      document.querySelectorAll('[data-sticky-bottom-bar], .fixed.bottom-0.inset-x-0').forEach((el) => {
        if (el === bannerRef.current || el.contains(bannerRef.current)) return;
        const r = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        const visible = style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0.1;
        if (visible && r.height > 0 && r.top < window.innerHeight) bar = Math.max(bar, window.innerHeight - r.top);
      });
      setBarOffset(Math.ceil(bar));
      const phone = !window.matchMedia('(min-width: 640px)').matches;
      const h = bannerRef.current?.offsetHeight || 0;
      if (phone && h) root.style.setProperty('--consent-offset', `${h + 12}px`);
      else root.style.removeProperty('--consent-offset');
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
      // Sticky bars slide in with a short transition; measure again once it has finished
      clearTimeout(timer);
      timer = setTimeout(measure, 350);
    };
    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) cancelAnimationFrame(frame);
      clearTimeout(timer);
      root.style.removeProperty('--consent-offset');
    };
  }, [open, language]);

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
      ref={bannerRef}
      role="dialog"
      aria-label={isAr ? 'إشعار ملفات تعريف الارتباط' : 'Cookie notice'}
      dir={isRTL ? 'rtl' : 'ltr'}
      style={barOffset ? { bottom: `${barOffset + 12}px` } : undefined}
      className="fixed inset-x-3 bottom-3 z-[60] transition-[bottom] duration-200 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:inset-x-auto sm:start-4 sm:max-w-md"
    >
      <p className="text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300">
        {isAr
          ? 'نستخدم أداة قياس من TikTok لفهم أداء إعلاناتنا. لن يتم تفعيلها إلا بموافقتك.'
          : 'We use a TikTok measurement pixel to understand how our ads perform. It is only switched on if you accept.'}{' '}
        <Link href={pathForLang('/privacy', language)} className="inline-block py-2 font-semibold text-blue-700 underline dark:text-blue-300">
          {isAr ? 'سياسة الخصوصية' : 'Privacy policy'}
        </Link>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => decide('granted')}
          className="rounded-xl bg-primary px-5 py-2.5 min-h-11 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          {isAr ? 'أوافق' : 'Accept'}
        </button>
        <button
          type="button"
          onClick={() => decide('denied')}
          className="rounded-xl border border-slate-300 px-5 py-2.5 min-h-11 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {isAr ? 'لا أوافق' : 'Decline'}
        </button>
      </div>
    </div>
  );
}
