'use client';

import { useTranslation } from '../contexts/TranslationContext';

const SERVICE_IMAGES = {
  'AC Repair':              'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=220&fit=crop&q=80',
  'AC Installation':        'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=220&fit=crop&q=80',
  'AC Deep Cleaning':       'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=220&fit=crop&q=80',
  'AC Gas Refill':          'https://images.unsplash.com/photo-1631545806609-7a9b30a4e680?w=400&h=220&fit=crop&q=80',
  'AC Compressor Repair':   'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=220&fit=crop&q=80',
  'AC PCB Repair':          'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=220&fit=crop&q=80',
  'AC Shifting':            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=220&fit=crop&q=80',
  'Central AC Service':     'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=220&fit=crop&q=80',
  'Refrigerator Repair':    'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400&h=220&fit=crop&q=80',
  'Freezer Repair':         'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&h=220&fit=crop&q=80',
  'Fridge Gas Refill':      'https://images.unsplash.com/photo-1536353284924-9220c464e262?w=400&h=220&fit=crop&q=80',
  'Fridge Thermostat Fix':  'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=220&fit=crop&q=80',
  'Washing Machine Repair': 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&h=220&fit=crop&q=80',
  'Stove & Oven Repair':    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=220&fit=crop&q=80',
  'Microwave Repair':       'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=400&h=220&fit=crop&q=80',
  'Water Dispenser Repair': 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=220&fit=crop&q=80',
  'Electrical Wiring Fix':  'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=220&fit=crop&q=80',
  'UPS & Inverter Repair':  'https://images.unsplash.com/photo-1509395176047-4a66953fd231?w=400&h=220&fit=crop&q=80',
  'General Maintenance':    'https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=400&h=220&fit=crop&q=80',
  'Annual Maintenance Plan': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=220&fit=crop&q=80',
  '24/7 Emergency Repair':  'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&h=220&fit=crop&q=80',
};

const CATEGORY_IMAGES = {
  ac:               'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=220&fit=crop&q=80',
  refrigerator:     'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400&h=220&fit=crop&q=80',
  'washing-machine':'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&h=220&fit=crop&q=80',
  stove:            'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=220&fit=crop&q=80',
  general:          'https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=400&h=220&fit=crop&q=80',
};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=400&h=220&fit=crop&q=80';

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
  const imgSrc = SERVICE_IMAGES[service.name] || CATEGORY_IMAGES[service.category] || DEFAULT_IMAGE;

  return (
    <div className="group relative mx-auto w-full max-w-sm rounded-2xl border border-border bg-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-lg dark:border-slate-700 dark:bg-slate-800 overflow-hidden">
      {/* Image area */}
      <div className="relative h-36 w-full overflow-hidden bg-slate-100 dark:bg-slate-700">
        <img
          src={imgSrc}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-2 start-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 text-lg shadow-sm backdrop-blur-sm dark:bg-slate-800/90">
          {service.icon || '🔧'}
        </div>

        {(service.isPopular || service.popular) && (
          <span className="absolute top-2 end-2 rounded-lg bg-primary px-2 py-0.5 text-[10px] font-black text-white shadow-sm">
            ★ {language === 'ar' ? 'مميز' : 'Popular'}
          </span>
        )}
        {(service.isEmergency || service.emergency) && (
          <span className="absolute top-2 end-2 rounded-lg bg-red-500 px-2 py-0.5 text-[10px] font-black text-white shadow-sm">
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
