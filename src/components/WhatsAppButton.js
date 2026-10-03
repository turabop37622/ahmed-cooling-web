'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslation } from '../contexts/TranslationContext';
import { stripLang } from '../lib/lang';

export default function WhatsAppButton() {
  const rawPathname = usePathname();
  const pathname = rawPathname ? stripLang(rawPathname) : rawPathname;
  const { isRTL, language } = useTranslation();
  // How far the footer's bottom row has scrolled into view; the button moves up by this much so it never covers it
  const [footerLift, setFooterLift] = useState(0);

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const bar = document.getElementById('site-footer-bottom');
      if (!bar) {
        setFooterLift(0);
        return;
      }
      const overlap = window.innerHeight - bar.getBoundingClientRect().top;
      setFooterLift(overlap > 0 ? Math.ceil(overlap) : 0);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [rawPathname]);

  if (pathname?.startsWith('/admin')) return null;

  // On service detail page, do not show floating WhatsApp button to prevent layout clutter with sticky CTA
  const isServiceDetailPage = pathname?.startsWith('/services/') && pathname.split('/').filter(Boolean).length > 1;
  if (isServiceDetailPage) return null;

  // Form pages: the floating button sits on top of inputs and submit buttons on phones
  const FORM_PAGES = ['/book', '/login', '/signup', '/forgot-password'];
  if (FORM_PAGES.some((p) => pathname === p || pathname?.startsWith(`${p}/`))) return null;

  const phone = '966590192146';
  const message = language === 'ar'
    ? 'مرحباً ورشة أحمد للتبريد! أود الاستفسار عن خدمات الصيانة وحجز موعد في جدة / مكة.'
    : 'Hello Ahmed Cooling Workshop! I would like to inquire about repair services and book a visit in Jeddah / Makkah.';

  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  return (
    <div
      // --consent-offset is set by the cookie banner while it is open on phones, so the two never overlap
      style={{ transform: `translateY(calc(-1 * (var(--consent-offset, 0px) + ${footerLift}px)))` }}
      className={`fixed bottom-[max(1rem,env(safe-area-inset-bottom))] sm:bottom-6 z-40 transition-transform duration-200 ease-out ${isRTL ? 'left-[max(1rem,env(safe-area-inset-left))] sm:left-6' : 'right-[max(1rem,env(safe-area-inset-right))] sm:right-6'}`}>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={language === 'ar' ? 'تواصل عبر واتساب' : 'Chat on WhatsApp'}
        className="group relative flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl shadow-green-600/30 transition-all hover:scale-110 active:scale-95 hover:shadow-green-600/50 cursor-pointer"
      >
        <span className="absolute -top-1 -end-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400"></span>
        </span>
        <svg viewBox="0 0 24 24" className="h-6 w-6 sm:h-7 sm:w-7 fill-white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>

        {/* Hover Tooltip */}
        <span className={`pointer-events-none absolute bottom-16 ${isRTL ? 'left-0' : 'right-0'} hidden whitespace-nowrap rounded-xl bg-slate-900/95 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-sm group-hover:block transition-all`}>
          {language === 'ar' ? 'تواصل معنا واتساب (+966 59 019 2146)' : 'WhatsApp Chat (+966 59 019 2146)'}
        </span>
      </a>
    </div>
  );
}
