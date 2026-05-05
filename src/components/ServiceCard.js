'use client';

import { useTranslation } from '../contexts/TranslationContext';
import { getServiceImage } from '../lib/serviceImages';

export default function ServiceCard({ service, onBook }) {
  const { t, language, toAr, formatPrice } = useTranslation();

  const name =
    (language === 'ar' ? service.nameAr : null) || service.name || t.service;
  const desc =
    (language === 'ar' ? service.descriptionAr : null) ||
    service.description ||
    '';
  const price = service.basePrice ?? 0;
  const duration = service.estimatedDuration || service.duration || '';
  const imgSrc = getServiceImage(service.name) || getServiceImage('AC Repair'); // Default fallback

  return (
    <div className="group relative mx-auto w-full max-w-sm rounded-2xl border border-border bg-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-lg dark:border-slate-700 dark:bg-slate-800 overflow-hidden">
      {/* Image area */}
      <div className="relative h-36 w-full overflow-hidden rounded-t-2xl bg-primary-light dark:bg-slate-700/50">
        <img
          src={imgSrc}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
        />

        {(service.isPopular || service.popular) && (
          <span className="absolute top-2 end-2 z-10 rounded-lg bg-primary px-2 py-0.5 text-[10px] font-black text-white shadow-sm">
            ★ {language === 'ar' ? 'مميز' : 'Popular'}
          </span>
        )}
        {(service.isEmergency || service.emergency) && (
          <span className="absolute top-2 start-2 z-10 rounded-lg bg-red-500 px-2 py-0.5 text-[10px] font-black text-white shadow-sm">
            🚨 24/7
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-3 pt-2">
        <h3 className="truncate text-sm font-extrabold text-text dark:text-white">
          {name}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-sub dark:text-slate-300">
          {desc}
        </p>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <span className="text-sm font-black text-primary dark:text-blue-400">
              {formatPrice(price)}
            </span>
            {duration && (
              <p className="mt-0.5 text-[10px] font-semibold text-sub dark:text-slate-400">
                {toAr(duration)}
              </p>
            )}
          </div>
        </div>

        {/* Book Now button */}
        <button
          onClick={() => onBook?.(service)}
          className="mt-3 w-full rounded-xl bg-primary py-2.5 text-xs font-black text-white transition-colors hover:bg-primary-dark"
        >
          {t.bookNow}
        </button>
      </div>
    </div>
  );
}