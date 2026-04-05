'use client';

import { useTranslation } from '../contexts/TranslationContext';

const SERVICE_IMAGES = {
  'AC Repair':              'https://images.pexels.com/photos/7545787/pexels-photo-7545787.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
  'AC Installation':        'https://images.pexels.com/photos/8297856/pexels-photo-8297856.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
  'AC Deep Cleaning':       'https://images.unsplash.com/photo-1610680081567-d4aa2d34cd63?w=400&h=250&fit=crop&q=80',
  'AC Gas Refill':          'https://images.unsplash.com/photo-1642749776312-aa42ce20c9f5?w=400&h=250&fit=crop&q=80',
  'AC Compressor Repair':   'https://images.pexels.com/photos/5463576/pexels-photo-5463576.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
  'AC PCB Repair':          'https://images.pexels.com/photos/7286002/pexels-photo-7286002.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
  'AC Shifting':            'https://images.pexels.com/photos/5463571/pexels-photo-5463571.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
  'Central AC Service':     'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=250&fit=crop&q=80',
  'Refrigerator Repair':    'https://images.pexels.com/photos/2343467/pexels-photo-2343467.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
  'Freezer Repair':         'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&h=250&fit=crop&q=80',
  'Fridge Gas Refill':      'https://images.pexels.com/photos/6283972/pexels-photo-6283972.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
  'Fridge Thermostat Fix':  'https://images.pexels.com/photos/2343467/pexels-photo-2343467.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
  'Washing Machine Repair': 'https://images.pexels.com/photos/5901622/pexels-photo-5901622.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
  'Stove & Oven Repair':    'https://images.pexels.com/photos/6605642/pexels-photo-6605642.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
  'Microwave Repair':       'https://images.pexels.com/photos/6835157/pexels-photo-6835157.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
  'Water Dispenser Repair': 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=250&fit=crop&q=80',
  'Electrical Wiring Fix':  'https://images.pexels.com/photos/7286002/pexels-photo-7286002.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
  'UPS & Inverter Repair':  'https://images.pexels.com/photos/7568415/pexels-photo-7568415.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
  'General Maintenance':    'https://images.pexels.com/photos/8005397/pexels-photo-8005397.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
  'Annual Maintenance Plan': 'https://images.pexels.com/photos/5463573/pexels-photo-5463573.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
  '24/7 Emergency Repair':  'https://images.pexels.com/photos/5463576/pexels-photo-5463576.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
};

const CATEGORY_IMAGES = {
  ac:               'https://images.pexels.com/photos/7545787/pexels-photo-7545787.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
  refrigerator:     'https://images.pexels.com/photos/2343467/pexels-photo-2343467.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
  'washing-machine':'https://images.pexels.com/photos/5901622/pexels-photo-5901622.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
  stove:            'https://images.pexels.com/photos/8055149/pexels-photo-8055149.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
  general:          'https://images.pexels.com/photos/8005397/pexels-photo-8005397.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop',
};

const DEFAULT_IMAGE = 'https://images.pexels.com/photos/8005397/pexels-photo-8005397.jpeg?auto=compress&cs=tinysrgb&w=400&h=250&fit=crop';

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
      {/* Icon / Image area */}
      <div className="relative h-36 w-full overflow-hidden rounded-t-2xl bg-primary-light dark:bg-slate-700/50">
        {/* Default: Icon */}
        <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 group-hover:opacity-0">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-[1.5px] border-blue-200 bg-blue-100 dark:border-slate-600 dark:bg-slate-600">
            <span className="text-4xl">{service.icon || '🔧'}</span>
          </div>
        </div>

        {/* Hover: Image */}
        <img
          src={imgSrc}
          alt={name}
          className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

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
