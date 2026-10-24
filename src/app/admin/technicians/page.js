'use client';

// Technicians: list with Active / Auto-assign / Available switches (optimistic, rolled back on error),
// totals, search + city filter, add / edit drawer and a detail drawer (stats, jobs, commission ledger).
// Data: GET /admin/technicians (with stats), PATCH /admin/technicians/:id.

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Search, Plus, UserPlus, RefreshCw, HardHat, Wallet, Zap, Activity, Loader2, AlertTriangle, ChevronRight, ChevronLeft, X } from 'lucide-react';
import { useAdminLang } from '../AdminI18n';
import { useAdminToast } from '../components/AdminToast';
import Switch from '../components/Switch';
import { getTechniciansFull, updateTechnician } from '../adminApi';
import { telLink } from '../bookings/bookingUtils';
import TechnicianFormDrawer from './TechnicianFormDrawer';
import TechnicianDetailDrawer from './TechnicianDetailDrawer';
import { CITIES, cityLabel, specialtyLabel, statsOf, toAsciiDigits } from './techUtils';

const replaceUrl = (url) => window.history.replaceState(null, '', url);
const INPUT = 'min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/30 dark:border-slate-700 dark:bg-slate-900 dark:text-white';
const REFRESH_MS = 60000;

export default function AdminTechniciansPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-slate-600 dark:text-slate-300">…</div>}>
      <TechniciansInner />
    </Suspense>
  );
}

function TechniciansInner() {
  const { L, isAr, fmtMoney, fmtNum } = useAdminLang();
  const toast = useAdminToast();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [pending, setPending] = useState({}); // `${id}:${field}` → true while saving
  const [formFor, setFormFor] = useState(null); // null | 'new' | technician
  const [detailKey, setDetailKey] = useState(0);
  const pendingRef = useRef(new Set());

  // URL state: ?q=&city=&open=<id>
  const q = sp.get('q') || '';
  const city = CITIES.some((c) => c.key === sp.get('city')) || sp.get('city') === 'none' ? sp.get('city') : '';
  const openId = sp.get('open') || null;
  const [qInput, setQInput] = useState(q);
  useEffect(() => { setQInput(q); }, [q]);

  const setParams = useCallback((patch) => {
    const next = new URLSearchParams(window.location.search);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    const qs = next.toString();
    replaceUrl(qs ? `${pathname}?${qs}` : pathname);
  }, [pathname]);

  // Debounced search into the URL
  useEffect(() => {
    if (qInput === q) return undefined;
    const t = setTimeout(() => setParams({ q: qInput.trim() }), 250);
    return () => clearTimeout(t);
  }, [qInput, q, setParams]);

  const load = useCallback(async () => {
    try {
      const res = await getTechniciansFull();
      const arr = Array.isArray(res?.technicians) ? res.technicians : [];
      // Rows being toggled keep their optimistic value until the PATCH settles
      setList((prev) => arr.map((t) => {
        const old = prev?.find((p) => String(p._id) === String(t._id));
        if (!old) return t;
        const keep = {};
        ['active', 'autoAssign', 'availability'].forEach((f) => { if (pendingRef.current.has(`${t._id}:${f}`)) keep[f] = old[f]; });
        return { ...t, ...keep };
      }));
      setError('');
    } catch (err) {
      setError(err?.message || L('Could not load technicians.', 'تعذر تحميل الفنيين.'));
    } finally {
      setRefreshing(false);
    }
  }, [L]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const timer = setInterval(() => { if (document.visibilityState === 'visible') load(); }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const toggle = async (t, field, value) => {
    const key = `${t._id}:${field}`;
    if (pendingRef.current.has(key)) return;
    pendingRef.current.add(key);
    setPending((p) => ({ ...p, [key]: true }));
    const prevValue = t[field];
    setList((l) => l.map((x) => (String(x._id) === String(t._id) ? { ...x, [field]: value } : x)));
    try {
      await updateTechnician(t._id, { [field]: value });
      const label = {
        active: [value ? 'activated' : 'deactivated', value ? 'تم تفعيل' : 'تم إيقاف'],
        autoAssign: [value ? 'auto-assign on' : 'auto-assign off', value ? 'تم تفعيل التعيين التلقائي لـ' : 'تم إيقاف التعيين التلقائي لـ'],
        availability: [value ? 'available' : 'unavailable', value ? 'أصبح متاحاً:' : 'أصبح غير متاح:'],
      }[field];
      toast.success(L(`${t.name}: ${label[0]}`, `${label[1]} ${t.name}`));
    } catch (err) {
      setList((l) => l.map((x) => (String(x._id) === String(t._id) ? { ...x, [field]: prevValue } : x)));
      toast.error(err?.message || L('Could not save the change.', 'تعذر حفظ التغيير.'));
    } finally {
      pendingRef.current.delete(key);
      setPending((p) => { const n = { ...p }; delete n[key]; return n; });
      load();
      setDetailKey((k) => k + 1);
    }
  };

  const filtered = useMemo(() => {
    if (!list) return [];
    const needle = toAsciiDigits(q).trim().toLowerCase();
    const digits = needle.replace(/[^\d]/g, '');
    return list.filter((t) => {
      if (city === 'none' && Array.isArray(t.cities) && t.cities.length) return false;
      if (city && city !== 'none' && !(t.cities || []).includes(city)) return false;
      if (!needle) return true;
      const phoneDigits = String(t.phone || '').replace(/[^\d]/g, '');
      return String(t.name || '').toLowerCase().includes(needle)
        || String(t.email || '').toLowerCase().includes(needle)
        || (digits.length >= 3 && (phoneDigits.includes(digits) || phoneDigits.includes(digits.replace(/^0/, ''))));
    });
  }, [list, q, city]);

  const totals = useMemo(() => {
    if (!list) return null;
    const sum = (f) => list.reduce((a, t) => a + (Number(statsOf(t)[f]) || 0), 0);
    const hasStats = list.some((t) => t.stats);
    return {
      count: list.length,
      active: list.filter((t) => t.active !== false).length,
      auto: list.filter((t) => t.autoAssign && t.active !== false).length,
      working: hasStats ? sum('activeJobs') : null,
      due: hasStats ? Math.round(sum('commissionDue') * 100) / 100 : null,
    };
  }, [list]);

  const openTech = openId && list ? list.find((t) => String(t._id) === String(openId)) : null;
  const Chevron = isAr ? ChevronLeft : ChevronRight;
  const card = 'rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900';

  const summary = totals ? [
    { key: 'count', icon: HardHat, label: L('Technicians', 'الفنيون'), value: fmtNum(totals.count), sub: L(`${fmtNum(totals.active)} active`, `${fmtNum(totals.active)} نشط`), tone: 'text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-500/15' },
    { key: 'auto', icon: Zap, label: L('Auto-assign on', 'تعيين تلقائي'), value: fmtNum(totals.auto), tone: 'text-violet-700 bg-violet-50 dark:text-violet-300 dark:bg-violet-500/15' },
    { key: 'working', icon: Activity, label: L('Working now', 'قيد العمل الآن'), value: fmtNum(totals.working), tone: 'text-cyan-800 bg-cyan-50 dark:text-cyan-300 dark:bg-cyan-500/15' },
    { key: 'due', icon: Wallet, label: L('Commission due', 'العمولة المستحقة'), value: fmtMoney(totals.due), tone: 'text-amber-800 bg-amber-50 dark:text-amber-300 dark:bg-amber-500/15' },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">{L('Technicians', 'الفنيون')}</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {L('Accounts, auto-assign and commission owed by each technician', 'الحسابات والتعيين التلقائي والعمولة المستحقة على كل فني')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => { setRefreshing(true); load(); }}
            disabled={refreshing}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />{L('Refresh', 'تحديث')}
          </button>
          <Link
            href="/admin/applications"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" />{L('Applications from the app', 'طلبات التطبيق')}
          </Link>
          <button
            type="button"
            onClick={() => setFormFor('new')}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />{L('Add technician', 'إضافة فني')}
          </button>
        </div>
      </div>

      {totals && (
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {summary.map((x) => {
            const Icon = x.icon;
            return (
              <li key={x.key} className={`${card} flex flex-col justify-between gap-2 p-4`}>
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{x.label}</span>
                  <span className={`rounded-lg p-1.5 ${x.tone}`}><Icon className="h-4 w-4" aria-hidden="true" /></span>
                </span>
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{x.value}</span>
                {x.sub && <span className="text-xs text-slate-600 dark:text-slate-400">{x.sub}</span>}
              </li>
            );
          })}
        </ul>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <label htmlFor="tech-q" className="sr-only">{L('Search technicians', 'البحث عن فني')}</label>
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <input
            id="tech-q"
            type="search"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder={L('Name, phone or email', 'الاسم أو الجوال أو البريد')}
            className={`${INPUT} w-full ps-9 pe-11`}
          />
          {qInput && (
            <button type="button" onClick={() => { setQInput(''); setParams({ q: '' }); }} aria-label={L('Clear search', 'مسح البحث')} className="absolute end-0 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
        <div>
          <label htmlFor="tech-city" className="sr-only">{L('City', 'المدينة')}</label>
          <select id="tech-city" value={city} onChange={(e) => setParams({ city: e.target.value })} className={`${INPUT} w-full sm:w-48`}>
            <option value="">{L('All cities', 'كل المدن')}</option>
            {CITIES.map((c) => <option key={c.key} value={c.key}>{L(c.en, c.ar)}</option>)}
            <option value="none">{L('No city set', 'بدون مدينة')}</option>
          </select>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-200">
          <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />{error}</span>
          <button type="button" onClick={load} className="min-h-11 rounded-lg px-3 font-semibold underline">{L('Retry', 'إعادة المحاولة')}</button>
        </div>
      )}

      {!list && !error ? (
        <div className="flex items-center justify-center py-16 text-sm text-slate-600 dark:text-slate-300" role="status">
          <Loader2 className="me-2 h-5 w-5 animate-spin" aria-hidden="true" />{L('Loading technicians…', 'جارٍ تحميل الفنيين…')}
        </div>
      ) : list && filtered.length === 0 ? (
        <div className={`${card} px-6 py-12 text-center`}>
          <HardHat className="mx-auto mb-3 h-10 w-10 text-slate-400" aria-hidden="true" />
          <p className="font-semibold text-slate-900 dark:text-white">
            {list.length === 0 ? L('No technicians yet', 'لا يوجد فنيون بعد') : L('No technicians match these filters', 'لا يوجد فنيون مطابقون')}
          </p>
          {list.length === 0 ? (
            <button type="button" onClick={() => setFormFor('new')} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">
              <Plus className="h-4 w-4" aria-hidden="true" />{L('Add the first technician', 'أضف أول فني')}
            </button>
          ) : (
            <button type="button" onClick={() => { setQInput(''); setParams({ q: '', city: '' }); }} className="mt-4 min-h-11 rounded-xl px-3 text-sm font-semibold text-blue-700 underline dark:text-blue-300">
              {L('Clear filters', 'مسح الفلاتر')}
            </button>
          )}
        </div>
      ) : list ? (
        <ul className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3" aria-label={L('Technicians', 'الفنيون')}>
          {filtered.map((t) => {
            const st = statsOf(t);
            const due = Number(st.commissionDue);
            const cities = Array.isArray(t.cities) ? t.cities : [];
            const specs = Array.isArray(t.specialties) ? t.specialties : [];
            const inactive = t.active === false;
            return (
              <li key={t._id} className={`${card} flex flex-col ${inactive ? 'opacity-80' : ''}`}>
                <div className="flex items-start justify-between gap-3 p-4 pb-3">
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => setParams({ open: String(t._id) })}
                      className="block max-w-full truncate text-start text-base font-bold text-slate-900 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:text-white"
                      dir="auto"
                    >
                      {t.name || '—'}
                    </button>
                    {t.phone ? (
                      <a href={telLink(t.phone)} dir="ltr" className="inline-flex min-h-8 items-center font-mono text-sm text-blue-700 hover:underline pointer-coarse:min-h-11 dark:text-blue-300">{t.phone}</a>
                    ) : (
                      <span className="block text-sm text-slate-600 dark:text-slate-400">—</span>
                    )}
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {inactive && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">{L('Inactive', 'غير نشط')}</span>}
                      {t.hasProfile === false && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-500/15 dark:text-amber-200">{L('No profile', 'بدون ملف')}</span>}
                      {cities.length ? cities.map((c) => (
                        <span key={c} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">{cityLabel(c, L)}</span>
                      )) : <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">{L('No city', 'بدون مدينة')}</span>}
                    </div>
                    <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
                      {specs.length ? specs.map((x) => specialtyLabel(x, L)).join(' · ') : L('All services', 'جميع الخدمات')}
                    </p>
                  </div>
                  {Number.isFinite(due) && due > 0 && (
                    <span className="shrink-0 rounded-xl bg-amber-50 px-2.5 py-1.5 text-end text-xs font-semibold text-amber-900 dark:bg-amber-500/15 dark:text-amber-200">
                      <span className="block font-medium">{L('Due', 'مستحق')}</span>
                      <span className="block text-sm font-bold">{fmtMoney(due)}</span>
                    </span>
                  )}
                </div>

                <dl className="grid grid-cols-5 gap-1 border-y border-slate-100 px-4 py-2.5 text-center dark:border-slate-800">
                  {[
                    [L('Active', 'نشطة'), st.activeJobs],
                    [L('Waiting', 'بانتظار'), st.pendingJobs],
                    [L('Today', 'اليوم'), st.completedToday],
                    [L('Month', 'الشهر'), st.completedMonth],
                    [L('Total', 'الإجمالي'), st.completedTotal],
                  ].map(([label, v]) => (
                    <div key={label} className="min-w-0">
                      <dt className="truncate text-[11px] text-slate-600 dark:text-slate-400">{label}</dt>
                      <dd className="text-base font-bold text-slate-900 dark:text-white">{fmtNum(v)}</dd>
                    </div>
                  ))}
                </dl>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2">
                  <Switch
                    checked={t.active !== false}
                    busy={!!pending[`${t._id}:active`]}
                    tone="green"
                    label={L('Active', 'نشط')}
                    onChange={(v) => toggle(t, 'active', v)}
                  />
                  <Switch
                    checked={!!t.autoAssign}
                    busy={!!pending[`${t._id}:autoAssign`]}
                    tone="violet"
                    label={L('Auto', 'تلقائي')}
                    onChange={(v) => toggle(t, 'autoAssign', v)}
                  />
                  <Switch
                    checked={t.availability !== false}
                    busy={!!pending[`${t._id}:availability`]}
                    label={L('Available', 'متاح')}
                    onChange={(v) => toggle(t, 'availability', v)}
                  />
                  <button
                    type="button"
                    onClick={() => setParams({ open: String(t._id) })}
                    aria-label={L(`Details for ${t.name || 'technician'}`, `تفاصيل ${t.name || 'الفني'}`)}
                    className="ms-auto inline-flex min-h-11 items-center gap-1 rounded-xl px-2 text-sm font-semibold text-blue-700 hover:underline dark:text-blue-300"
                  >
                    {L('Details', 'التفاصيل')}<Chevron className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      <TechnicianDetailDrawer
        technicianId={formFor ? null : openId}
        initial={openTech}
        refreshKey={detailKey}
        onClose={() => setParams({ open: '' })}
        onEdit={(t) => setFormFor(t)}
        onChanged={load}
      />

      <TechnicianFormDrawer
        open={!!formFor}
        technician={formFor && formFor !== 'new' ? formFor : null}
        onClose={() => setFormFor(null)}
        onSaved={() => { load(); setDetailKey((k) => k + 1); }}
      />
    </div>
  );
}
