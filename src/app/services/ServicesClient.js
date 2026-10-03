'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Inbox, RefreshCw } from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';
import { getServices } from '@/lib/api';
import { VISIT_FEE } from '@/lib/servicesData';
import ServiceCard from '@/components/ServiceCard';
import { FILTER_IDS, normalizeFilter } from './filters';

const FILTERS = [
  { id: 'all', labelKey: 'catAll' },
  { id: 'ac', labelKey: 'catAC' },
  { id: 'refrigerator', labelKey: 'catFridge' },
  { id: 'washing-machine', labelKey: 'catWasher' },
  { id: 'stove', labelKey: 'catStove' },
  { id: 'general', labelKey: 'catGeneral' },
  { id: 'popular', labelKey: 'popular' },
  { id: 'emergency', labelKey: 'emergency' },
].filter((f) => f.id === 'all' || FILTER_IDS.includes(f.id));

function normalizeCategory(raw) {
  if (raw == null) return '';
  const s = String(raw).toLowerCase().trim();
  if (s === 'fridge') return 'refrigerator';
  if (s === 'washer' || s === 'washing machine' || s === 'washing_machine') {
    return 'washing-machine';
  }
  return s;
}

function serviceMatchesFilter(service, filterId) {
  if (filterId === 'all') return true;
  if (filterId === 'popular') return !!(service.isPopular || service.popular);
  if (filterId === 'emergency') return !!(service.isEmergency || service.emergency);
  return normalizeCategory(service.category) === filterId;
}

// Shallow: update ?cat= in the address bar without a server round trip or a new history entry
function writeFilterToUrl(id) {
  try {
    const url = new URL(window.location.href);
    if (id === 'all') url.searchParams.delete('cat');
    else url.searchParams.set('cat', id);
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  } catch {}
}

// "19 services" / Arabic number agreement: خدمة واحدة، خدمتان، ٣ خدمات ... ١٠ خدمات، ١١ خدمة ...
function countLabel(n, language) {
  if (language !== 'ar') return `${n} ${n === 1 ? 'service' : 'services'}`;
  const digits = new Intl.NumberFormat('ar-SA').format(n);
  switch (new Intl.PluralRules('ar').select(n)) {
    case 'one':
      return 'خدمة واحدة';
    case 'two':
      return 'خدمتان';
    case 'few':
      return `${digits} خدمات`;
    default:
      return `${digits} خدمة`;
  }
}

// initialServices come from the server (database list, cached 5 min), so the first paint already shows the real
// prices and the client keeps them: no price swap or layout jump after hydration.
export default function ServicesClient({ initialServices, live, initialFilter = 'all' }) {
  const { t, language, isRTL, formatPrice } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [allServices, setAllServices] = useState(initialServices);
  const [activeFilter, setActiveFilter] = useState(initialFilter);

  // The server could not reach the API and rendered the bundled copy: try once more from the browser.
  useEffect(() => {
    if (live) return;
    getServices()
      .then((res) => {
        const list = res?.services ?? res?.data ?? res;
        if (Array.isArray(list) && list.length) setAllServices(list);
      })
      .catch(() => {});
  }, [live]);

  // ?cat= in the URL is the source of truth (shareable, survives back/forward and footer links to /services?cat=...)
  useEffect(() => {
    const raw = searchParams?.get('cat');
    const id = normalizeFilter(raw);
    setActiveFilter(id);
    // Aliases and unknown values (?cat=fridge, ?cat=xyz) are rewritten to the canonical id in the address bar
    if (raw !== null && raw !== undefined && raw !== (id === 'all' ? null : id)) writeFilterToUrl(id);
  }, [searchParams]);

  const selectFilter = useCallback((id) => {
    setActiveFilter(id);
    writeFilterToUrl(id);
  }, []);

  const filteredServices = useMemo(
    () => allServices.filter((s) => serviceMatchesFilter(s, activeFilter)),
    [allServices, activeFilter],
  );

  // Only the first 3 popular services of the visible list get the "Popular" pill
  const popularBadgeIds = useMemo(
    () => new Set(filteredServices.filter((s) => s.isPopular || s.popular).slice(0, 3).map((s) => String(s._id || s.id))),
    [filteredServices],
  );

  const serviceCountLabel =countLabel(filteredServices.length, language);
  const vat = language === 'ar' ? `${new Intl.NumberFormat('ar-SA').format(15)}٪` : '15%';

  const handleBook = useCallback(
    (service) => {
      const id = service._id || service.id;
      if (id) router.push(`/book/${id}`);
    },
    [router],
  );

  return (
    <div className="min-h-[60vh] bg-bg pb-28 sm:pb-12 dark:bg-slate-950">
      <div className="mx-auto max-w-[1560px] px-4 pt-8 pb-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 scroll-reveal">
          <div className="mb-3 flex flex-wrap items-end gap-3">
            <div className="h-8 w-1 shrink-0 rounded-full bg-primary dark:bg-blue-500" />
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-semibold text-text dark:text-white sm:text-3xl">
                {t.ourServices}
              </h1>
              <p className="mt-1 text-sm font-semibold text-primary dark:text-blue-400">
                {t.appName}
              </p>
            </div>
            <p className="text-xs font-semibold text-sub dark:text-slate-400" aria-live="polite">{serviceCountLabel}</p>
          </div>
        </div>

        {/* Category chips */}
        <div
          className="-mx-1 mb-8 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none no-scrollbar [&::-webkit-scrollbar]:hidden scroll-reveal delay-100"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {FILTERS.filter((f) => f.id === 'all' || f.id === activeFilter || allServices.some((svc) => serviceMatchesFilter(svc, f.id))).map((f) => {
            const active = activeFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => selectFilter(f.id)}
                aria-pressed={active}
                className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition-colors pointer-coarse:inline-flex pointer-coarse:min-h-11 pointer-coarse:items-center ${
                  active
                    ? 'border-primary bg-primary text-white dark:border-blue-500 dark:bg-blue-600'
                    : 'border-border bg-white text-text hover:border-primary/40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-blue-500/50'
                }`}
              >
                {t[f.labelKey] ?? f.id}
              </button>
            );
          })}
        </div>

        {/* Grid: 3 cards per row */}
        {filteredServices.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredServices.map((svc, idx) => (
              <ServiceCard
                key={svc._id || svc.id || svc.name}
                service={svc}
                onBook={handleBook}
                index={idx}
                showPopularBadge={popularBadgeIds.has(String(svc._id || svc.id))}
              />
            ))}
          </div>
        )}

        {/* Pricing Terms & VAT Banner */}
        {filteredServices.length > 0 && (
          <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300 scroll-reveal">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-start">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                <span>
                  {language === 'ar'
                    ? `جميع الأسعار تشمل ضريبة القيمة المضافة ${vat} • تضاف رسوم زيارة ${formatPrice(VISIT_FEE)} • قطع الغيار غير مشمولة وتُحدد حسب الحاجة`
                    : `All prices include ${vat} VAT • ${formatPrice(VISIT_FEE)} visit fee added • Spare parts are not included and quoted separately`}
                </span>
              </div>
              <p className="font-semibold text-primary dark:text-blue-400">
                {language === 'ar'
                  ? 'الأسعار تبدأ من المبلغ المذكور وقد تختلف بعد المعاينة'
                  : 'Prices start from the listed amount and may vary after inspection'}
              </p>
            </div>
          </div>
        )}

        {/* Empty */}
        {filteredServices.length === 0 && (
          <div className="flex min-h-[36vh] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-white/50 px-6 py-14 dark:border-slate-700 dark:bg-slate-900/40">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
              <Inbox className="h-7 w-7 text-sub dark:text-slate-500" />
            </div>
            <p className="text-center text-sm font-semibold text-text dark:text-white">
              {t.noServicesFound}
            </p>
            <button
              type="button"
              onClick={() => selectFilter('all')}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-primary-dark dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4" />
              {t.resetFilters}
            </button>
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="flex items-center justify-center gap-2 pt-2 scroll-reveal-fade">
        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />
        <p className="text-xs font-semibold text-sub dark:text-slate-500">{t.servicesUpdated}</p>
      </div>
    </div>
  );
}
