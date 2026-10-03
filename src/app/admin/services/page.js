'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { adminApi } from '../adminApi';
import { useAdminLang } from '../AdminI18n';
import { useAdminToast, ConfirmDialog } from '../components';
import ServiceIcon from '@/components/ServiceIcon';
import ServiceFormDialog from './ServiceFormDialog';
import { CATEGORIES, publicServiceUrl } from './serviceForm';
import {
  Wrench,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Power,
  RotateCcw,
  AlertTriangle,
  X,
  Clock,
  Flame,
  Star,
  Copy,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

const card = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm';
const tabBase = 'min-h-[44px] px-3.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600';
const tabOn = 'bg-blue-600 text-white shadow-sm';
const tabOff = 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800';

function CountPill({ active, children }) {
  return (
    <span className={`text-xs px-1.5 rounded-full tabular-nums ${active ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}>
      {children}
    </span>
  );
}

export default function AdminServicesPage() {
  const { L, isAr, fmtMoney, fmtNum } = useAdminLang();
  const toast = useAdminToast();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null); // service being edited, null = create
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const busyRef = useRef(false);

  const fetchServices = useCallback(async () => {
    try {
      const res = await adminApi.getAdminServices();
      const list = res?.services ?? res?.data ?? [];
      setServices(Array.isArray(list) ? list : []);
      setLoadError('');
    } catch (err) {
      setLoadError(err?.message || 'Could not load services');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchServices();
  };

  const isActive = (s) => s.active !== false;

  const counts = useMemo(() => {
    const active = services.filter(isActive).length;
    return {
      all: services.length,
      active,
      inactive: services.length - active,
      popular: services.filter((s) => s.isPopular).length,
      emergency: services.filter((s) => s.isEmergency).length,
    };
  }, [services]);

  // Category counts follow the status filter so the numbers match what the tab shows
  const statusFiltered = useMemo(
    () => services.filter((s) => statusFilter === 'all' || (statusFilter === 'active' ? isActive(s) : !isActive(s))),
    [services, statusFilter]
  );

  const categoryCounts = useMemo(() => {
    const out = { all: statusFiltered.length };
    for (const c of CATEGORIES) out[c.key] = statusFiltered.filter((s) => (s.category || '').toLowerCase() === c.key).length;
    return out;
  }, [statusFiltered]);

  const filteredServices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return statusFiltered.filter((s) => {
      const matchesCategory = category === 'all' || (s.category || '').toLowerCase() === category;
      const matchesSearch =
        !query ||
        [s.name, s.nameAr, s.description, s.descriptionAr, s.slug].some((v) => String(v ?? '').toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [statusFiltered, category, searchQuery]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (service) => {
    setEditing(service);
    setFormOpen(true);
  };

  const handleSaved = (saved, mode) => {
    setFormOpen(false);
    toast.success(mode === 'create' ? L('Service added', 'تمت إضافة الخدمة') : L('Service updated', 'تم تحديث الخدمة'));
    if (saved && saved._id) {
      setServices((prev) => {
        const exists = prev.some((s) => s._id === saved._id);
        return exists ? prev.map((s) => (s._id === saved._id ? { ...s, ...saved } : s)) : [saved, ...prev];
      });
    }
    fetchServices();
  };

  const runLocked = async (id, fn) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusyId(id);
    try {
      await fn();
    } finally {
      busyRef.current = false;
      setBusyId(null);
    }
  };

  const handleReactivate = (service) =>
    runLocked(service._id, async () => {
      try {
        await adminApi.setServiceActive(service._id, true);
        setServices((prev) => prev.map((s) => (s._id === service._id ? { ...s, active: true } : s)));
        toast.success(L('Service reactivated — visible to customers again', 'تمت إعادة تفعيل الخدمة — ظاهرة للعملاء مجدداً'));
        fetchServices();
      } catch (err) {
        toast.error(err?.message || L('Could not reactivate the service', 'تعذّر إعادة تفعيل الخدمة'));
      }
    });

  // ConfirmDialog holds its own ref lock while this runs; returning false keeps it open after an error
  const handleDeactivateConfirm = async () => {
    const target = deactivateTarget;
    if (!target) return undefined;
    setBusyId(target._id);
    try {
      await adminApi.deactivateService(target._id);
      setServices((prev) => prev.map((s) => (s._id === target._id ? { ...s, active: false } : s)));
      toast.success(L('Service deactivated — you can reactivate it at any time', 'تم إيقاف الخدمة — يمكنك إعادة تفعيلها في أي وقت'));
      fetchServices();
      return undefined;
    } catch (err) {
      toast.error(err?.message || L('Could not deactivate the service', 'تعذّر إيقاف الخدمة'));
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const copyUrl = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(L('Link copied', 'تم نسخ الرابط'));
    } catch {
      toast.error(L('Could not copy the link', 'تعذّر نسخ الرابط'));
    }
  };

  const catLabel = (key) => {
    const c = CATEGORIES.find((x) => x.key === (key || '').toLowerCase());
    return c ? L(c.en, c.ar) : key || '—';
  };

  const statusTabs = [
    { key: 'all', label: L('All', 'الكل'), count: counts.all },
    { key: 'active', label: L('Active', 'نشطة'), count: counts.active },
    { key: 'inactive', label: L('Inactive', 'غير نشطة'), count: counts.inactive },
  ];

  const kpis = [
    { label: L('Active services', 'الخدمات النشطة'), value: counts.active, icon: ShieldCheck, tone: 'text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-500/10' },
    { label: L('Inactive services', 'الخدمات غير النشطة'), value: counts.inactive, icon: Power, tone: 'text-slate-700 bg-slate-100 dark:text-slate-300 dark:bg-slate-800' },
    { label: L('Marked popular', 'مميزة كشائعة'), value: counts.popular, icon: Star, tone: 'text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-500/10' },
    { label: L('24/7 emergency', 'طوارئ 24/7'), value: counts.emergency, icon: Flame, tone: 'text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-500/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white">{L('Services', 'الخدمات')}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            {L('Prices, durations and warranties shown on the website. Inactive services are hidden from customers.', 'الأسعار والمدد والضمان المعروضة في الموقع. الخدمات غير النشطة لا تظهر للعملاء.')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            aria-label={L('Refresh', 'تحديث')}
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>{L('Add service', 'إضافة خدمة')}</span>
          </button>
        </div>
      </div>

      {loadError && (
        <div role="alert" className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-4 text-red-800 dark:text-red-200">
          <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden="true" />
          <div className="flex-1 text-sm">
            <p className="font-semibold">{L('Could not load services', 'تعذّر تحميل الخدمات')}</p>
            <p>{loadError}</p>
          </div>
          <button type="button" onClick={handleRefresh} className="min-h-[44px] px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold">
            {L('Retry', 'إعادة المحاولة')}
          </button>
        </div>
      )}

      {/* KPI strip (hidden on error so no fake zeros are shown) */}
      {!loadError && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {kpis.map((k) => (
            <div key={k.label} className={`${card} p-4`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{k.label}</span>
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${k.tone}`}>
                  <k.icon className="w-4 h-4" aria-hidden="true" />
                </span>
              </div>
              {loading ? (
                <div className="mt-2 h-8 w-12 rounded-md bg-slate-200 dark:bg-slate-800 animate-pulse" />
              ) : (
                <div className="text-2xl font-semibold text-slate-900 dark:text-white mt-2 tabular-nums">{fmtNum(k.value)}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className={`${card} p-3 space-y-3`}>
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
          <div role="tablist" aria-label={L('Status', 'الحالة')} className="flex items-center gap-1.5 overflow-x-auto">
            {statusTabs.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={statusFilter === t.key}
                onClick={() => setStatusFilter(t.key)}
                className={`${tabBase} ${statusFilter === t.key ? tabOn : tabOff}`}
              >
                <span>{t.label}</span>
                {!loading && !loadError && <CountPill active={statusFilter === t.key}>{fmtNum(t.count)}</CountPill>}
              </button>
            ))}
          </div>
          <div className="relative lg:w-80">
            <label htmlFor="svc-search" className="sr-only">{L('Search services', 'البحث في الخدمات')}</label>
            <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
            <input
              id="svc-search"
              type="search"
              placeholder={L('Search by name or URL…', 'ابحث بالاسم أو الرابط…')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-[44px] ps-10 pe-10 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label={L('Clear search', 'مسح البحث')}
                className="absolute end-0 top-0 h-full min-w-[44px] flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
        <div role="tablist" aria-label={L('Category', 'الفئة')} className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[{ key: 'all', en: 'All categories', ar: 'كل الفئات' }, ...CATEGORIES].map((c) => (
            <button
              key={c.key}
              type="button"
              role="tab"
              aria-selected={category === c.key}
              onClick={() => setCategory(c.key)}
              className={`${tabBase} ${category === c.key ? tabOn : tabOff}`}
            >
              <span>{L(c.en, c.ar)}</span>
              {!loading && !loadError && <CountPill active={category === c.key}>{fmtNum(categoryCounts[c.key] ?? 0)}</CountPill>}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" aria-busy="true" aria-label={L('Loading services', 'جارٍ تحميل الخدمات')}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`${card} p-5 space-y-3 animate-pulse`}>
              <div className="flex gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-3 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
              <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-4/5 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-10 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      ) : loadError ? null : filteredServices.length === 0 ? (
        <div className={`${card} py-14 px-6 text-center`}>
          <Wrench className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-3" aria-hidden="true" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {services.length === 0 ? L('No services yet', 'لا توجد خدمات بعد') : L('No services match these filters', 'لا توجد خدمات مطابقة')}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            {services.length === 0
              ? L('Add the first service to show it on the website.', 'أضف أول خدمة لتظهر في الموقع.')
              : L('Change the search or pick another tab.', 'غيّر البحث أو اختر تبويباً آخر.')}
          </p>
          {services.length === 0 && (
            <button type="button" onClick={openCreate} className="mt-4 min-h-[44px] inline-flex items-center gap-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold">
              <Plus className="w-4 h-4" aria-hidden="true" />
              {L('Add service', 'إضافة خدمة')}
            </button>
          )}
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredServices.map((service) => {
            const active = isActive(service);
            const name = isAr ? service.nameAr || service.name : service.name || service.nameAr;
            const altName = isAr ? service.name : service.nameAr;
            const desc = isAr ? service.descriptionAr || service.description : service.description || service.descriptionAr;
            const url = publicServiceUrl(service, isAr ? 'ar' : 'en');
            const busy = busyId === service._id;
            return (
              <li
                key={service._id}
                className={`${card} p-5 flex flex-col gap-4 ${active ? '' : 'bg-slate-50 dark:bg-slate-950 border-dashed'}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
                    <ServiceIcon service={service} className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
                          active
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30'
                            : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-500'}`} aria-hidden="true" />
                        {active ? L('Active', 'نشطة') : L('Inactive', 'غير نشطة')}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {catLabel(service.category)}
                      </span>
                      {service.isPopular && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                          <Star className="w-3 h-3 fill-current" aria-hidden="true" />
                          {L('Popular', 'شائعة')}
                        </span>
                      )}
                      {service.isEmergency && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300">
                          <Flame className="w-3 h-3" aria-hidden="true" />
                          24/7
                        </span>
                      )}
                    </div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white mt-1.5 leading-snug break-words" dir="auto">
                      {name || '—'}
                    </h2>
                    {altName && (
                      <p className="text-sm text-slate-600 dark:text-slate-300 break-words" dir="auto">{altName}</p>
                    )}
                  </div>
                </div>

                <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed" dir="auto">
                  {desc || <span className="italic text-slate-500 dark:text-slate-400">{L('No description', 'بدون وصف')}</span>}
                </p>

                <dl className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <dt className="text-xs text-slate-600 dark:text-slate-400">{L('Base price', 'السعر الأساسي')}</dt>
                    <dd className="font-semibold text-slate-900 dark:text-white tabular-nums">{fmtMoney(service.basePrice)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-600 dark:text-slate-400">{L('Duration', 'المدة')}</dt>
                    <dd className="font-semibold text-slate-900 dark:text-white flex items-center gap-1" dir="auto">
                      <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
                      <span className="truncate">{service.estimatedDuration || '—'}</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-600 dark:text-slate-400">{L('Warranty', 'الضمان')}</dt>
                    <dd className="font-semibold text-slate-900 dark:text-white tabular-nums">
                      {service.warrantyDays != null ? `${fmtNum(service.warrantyDays)} ${L('days', 'يوم')}` : '—'}
                    </dd>
                  </div>
                </dl>

                {/* Public URL */}
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-2.5">
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {L('Public page', 'الصفحة العامة')}
                    {!active && <span className="font-normal"> · {L('hidden while inactive', 'مخفية أثناء الإيقاف')}</span>}
                  </div>
                  {url ? (
                    <div className="flex items-center gap-1">
                      <code className="flex-1 min-w-0 truncate text-xs text-slate-800 dark:text-slate-200" dir="ltr" title={url}>{url.replace(/^https?:\/\//, '')}</code>
                      <button
                        type="button"
                        onClick={() => copyUrl(url)}
                        aria-label={L('Copy public link', 'نسخ الرابط العام')}
                        className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                      >
                        <Copy className="w-4 h-4" aria-hidden="true" />
                      </button>
                      {active && (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={L('Open public page in a new tab', 'فتح الصفحة العامة في تبويب جديد')}
                          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                          <ExternalLink className="w-4 h-4 rtl:-scale-x-100" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-600 dark:text-slate-400">—</span>
                  )}
                </div>

                <div className="mt-auto flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => openEdit(service)}
                    className="min-h-[44px] flex-1 inline-flex items-center justify-center gap-2 px-3 rounded-xl border border-slate-300 dark:border-slate-600 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Edit2 className="w-4 h-4" aria-hidden="true" />
                    {L('Edit', 'تعديل')}
                  </button>
                  {active ? (
                    <button
                      type="button"
                      onClick={() => setDeactivateTarget(service)}
                      disabled={busy}
                      className="min-h-[44px] flex-1 inline-flex items-center justify-center gap-2 px-3 rounded-xl border border-rose-300 dark:border-rose-500/40 text-sm font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 disabled:opacity-60"
                    >
                      <Power className="w-4 h-4" aria-hidden="true" />
                      {L('Deactivate', 'إيقاف')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleReactivate(service)}
                      disabled={busy}
                      className="min-h-[44px] flex-1 inline-flex items-center justify-center gap-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {busy ? <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" /> : <RotateCcw className="w-4 h-4" aria-hidden="true" />}
                      {L('Reactivate', 'إعادة التفعيل')}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ServiceFormDialog
        open={formOpen}
        service={editing}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={!!deactivateTarget}
        tone="danger"
        title={L('Deactivate this service?', 'إيقاف هذه الخدمة؟')}
        message={
          deactivateTarget
            ? L(
                `"${deactivateTarget.name || deactivateTarget.nameAr}" will be hidden from the website and can no longer be booked. Nothing is deleted: existing bookings keep it, and you can reactivate it at any time from the Inactive tab.`,
                `ستُخفى "${deactivateTarget.nameAr || deactivateTarget.name}" من الموقع ولن يمكن حجزها. لن يُحذف شيء: تبقى في الحجوزات الحالية، ويمكنك إعادة تفعيلها في أي وقت من تبويب "غير نشطة".`
              )
            : ''
        }
        confirmLabel={L('Deactivate', 'إيقاف')}
        onConfirm={handleDeactivateConfirm}
        onClose={() => setDeactivateTarget(null)}
      />
    </div>
  );
}
