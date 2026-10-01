'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import { useTranslation } from '../contexts/TranslationContext';
import { getServiceImage } from '../lib/serviceImages';
import { VISIT_FEE } from '../lib/servicesData';

export default function ServiceCard({ service, onBook, index = 0, className = '' }) {
  const router = useRouter();
  const { t, language, isRTL, toAr, formatPrice } = useTranslation();

  const id = service._id || service.id;
  const name =
    (language === 'ar' ? service.nameAr : null) || service.name || t.service;
  // Cards show a short summary. Services from the API have none, so use the first sentence of the description.
  const firstSentence = (text = '') => {
    const m = String(text).match(/^[\s\S]*?[.!?؟](?=\s|$)/);
    return (m ? m[0] : String(text)).trim();
  };
  const fullDesc =
    (language === 'ar' ? service.descriptionAr : null) ||
    service.description ||
    '';
  const desc =
    (language === 'ar' ? service.summaryAr : service.summary) || firstSentence(fullDesc);
  const price = service.basePrice ?? 0;

  const imgSrc = getServiceImage(service.name, service.category);
  const detailUrl = id ? `/services/${id}` : '/services';

  const handleCardClick = (e) => {
    // Let clicks inside links or buttons take their own action
    if (e.target.closest('button') || e.target.closest('a')) return;
    router.push(detailUrl);
  };

  const handleBookClick = (e) => {
    e.stopPropagation();
    if (onBook) {
      onBook(service);
    } else if (id) {
      router.push(`/book/${id}`);
    }
  };

  const staggerDelay = index % 3 === 1 ? 'delay-100' : index % 3 === 2 ? 'delay-200' : '';

  return (
    <div
      onClick={handleCardClick}
      className={`group relative flex w-full cursor-pointer flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-[0_20px_40px_-15px_rgba(37,99,235,0.18)] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/40 dark:hover:shadow-[0_20px_40px_-15px_rgba(37,99,235,0.28)] scroll-reveal ${staggerDelay} ${className}`}
    >
      {/* ═══ Top Photography Header ═══ */}
      <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={imgSrc}
          alt={name}
          width="800"
          height="500"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />

        {/* Popular / Featured Pill */}
        {(service.isPopular || service.popular) && (
          <div className="absolute top-3.5 end-3.5 pointer-events-none">
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-600 to-primary px-3 py-1 text-[11px] font-semibold text-white shadow-md shadow-blue-500/30 border border-white/20">
              <Star className="h-3 w-3 fill-white text-white" />
              <span>{language === 'ar' ? 'الأكثر طلباً' : 'Popular'}</span>
            </span>
          </div>
        )}
      </div>

      {/* ═══ Card Body Content ═══ */}
      <div className="flex flex-1 flex-col p-5 text-start">
        {/* Title - uniform min-height so next items align */}
        <h3 className="text-base sm:text-lg font-semibold text-slate-900 transition-colors group-hover:text-primary dark:text-white dark:group-hover:text-blue-400 line-clamp-1 min-h-[1.75rem] flex items-center">
          {name}
        </h3>

        {/* Description / Subtitle - uniform min-height for 2 lines */}
        <p className="mt-1.5 line-clamp-2 text-xs font-light leading-relaxed text-slate-500 dark:text-slate-400 min-h-[2.45rem]">
          {desc}
        </p>

        {/* ═══ Interactive Bottom Action Shelf - mt-auto locks it to bottom across all cards ═══ */}
        <div className="mt-auto pt-4 flex flex-wrap items-end justify-between gap-x-3 gap-y-3">
          {/* Price Stack (never truncated: the buttons wrap below it on narrow cards) */}
          <div className="flex flex-col shrink-0">
            <span className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400 whitespace-nowrap">
              {t.startingFrom || 'Starting from'}
            </span>
            <div className="text-lg sm:text-2xl font-semibold text-slate-900 dark:text-white whitespace-nowrap leading-tight">
              {formatPrice(price)}
            </div>
            <span className="text-[11px] font-semibold leading-snug text-slate-500 dark:text-slate-400 whitespace-nowrap">
              {language === 'ar'
                ? `+ ${formatPrice(VISIT_FEE)} رسوم زيارة`
                : `+ ${formatPrice(VISIT_FEE)} visit fee`}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 ms-auto">
            <Link
              href={detailUrl}
              className="group/details inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-primary/50 hover:bg-primary/5 hover:text-primary dark:hover:bg-primary/10 transition-all whitespace-nowrap"
              title={t.viewDetails || 'Details'}
            >
              <span>{t.viewDetails || 'Details'}</span>
            </Link>

            <button
              type="button"
              onClick={handleBookClick}
              className="relative inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-primary via-blue-600 to-primary-dark px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs font-semibold text-white shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all duration-200 whitespace-nowrap cursor-pointer"
            >
              <span>{t.bookNow}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}