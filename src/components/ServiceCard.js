'use client';

import { useTranslation } from '../contexts/TranslationContext';

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

  return (
    <div className="group relative mx-auto w-full max-w-sm rounded-2xl border border-border bg-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-lg dark:border-slate-700 dark:bg-slate-800 overflow-hidden">
      {/* Icon area */}
      <div className="relative flex items-center justify-center rounded-t-2xl bg-primary-light py-6 dark:bg-slate-700/50">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-[1.5px] border-blue-200 bg-blue-100 dark:border-slate-600 dark:bg-slate-600">
          <span className="text-3xl">{service.icon || '🔧'}</span>
        </div>

        {(service.isPopular || service.popular) && (
          <span className="absolute top-2 end-2 rounded-lg bg-primary px-2 py-0.5 text-[10px] font-black text-white">
            ★
          </span>
        )}
        {(service.isEmergency || service.emergency) && (
          <span className="absolute top-2 end-10 rounded-lg bg-red-500 px-2 py-0.5 text-[10px] font-black text-white">
            24/7
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
