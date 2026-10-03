'use client';

// Admin bookings list: server-side paging / search / filters (GET /admin/bookings), all state in the URL
// (?status=&priority=&q=&date=&from=&to=&sort=&unassigned=1&overdue=1&page=&open=) so refresh and back keep it.
// unassigned/overdue come from the dashboard tiles and use the same server-side definition as those tiles.
// Table from 1280px up, cards below. Auto-refresh every 30s keeps filters, scroll and the open drawer.

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Native history updates are picked up by useSearchParams without a server round trip (Next.js 14.1+).
const replaceUrl = (url) => window.history.replaceState(null, '', url);
import {
  Search, RefreshCw, MessageCircle, ChevronLeft, ChevronRight, ClipboardList, X, Calendar, Clock, MapPin, Loader2,
} from 'lucide-react';
import { useAdminLang } from '../AdminI18n';
import { StatusBadge, PriorityBadge } from '../components/Badges';
import { getBookings, getAdminServices } from '../adminApi';
import BookingDrawer from './BookingDrawer';
import {
  TABS, normalizeStatus, serviceInfo, serviceName, customerNameOf, phoneOf, orderRef, whatsappLink, telLink,
  bookingDate, bookingTime, fmtSlot, dateRange,
} from './bookingUtils';

const PAGE_SIZE = 25;
const REFRESH_MS = 30000;
const TAB_KEYS = TABS.map((t) => t.key);
const DATE_KEYS = ['today', 'tomorrow', 'week', 'overdue', 'custom'];
const SORT_KEYS = ['schedule', '-schedule', '-created', 'created'];
const isFlag = (v) => v === '1' || v === 'true';

const INPUT = 'min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/30 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:[color-scheme:dark]';

export default function AdminBookingsPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-slate-600 dark:text-slate-300">…</div>}>
      <BookingsPageInner />
    </Suspense>
  );
}

function BookingsPageInner() {
  const { L, isAr, fmtDate, fmtTime, fmtMoney, fmtNum } = useAdminLang();
  const pathname = usePathname();
  const sp = useSearchParams();

  // ---------------------------------------------------------------- URL state
  const tab = TAB_KEYS.includes(sp.get('status')) ? sp.get('status') : 'all';
  const priority = ['emergency', 'normal'].includes(sp.get('priority')) ? sp.get('priority') : '';
  const q = (sp.get('q') || '').trim();
  const dateKey = DATE_KEYS.includes(sp.get('date')) ? sp.get('date') : '';
  const fromParam = sp.get('from') || '';
  const toParam = sp.get('to') || '';
  const sort = SORT_KEYS.includes(sp.get('sort')) ? sp.get('sort') : 'schedule';
  const unassigned = isFlag(sp.get('unassigned'));
  const overdue = isFlag(sp.get('overdue'));
  const page = Math.max(1, parseInt(sp.get('page') || '1', 10) || 1);
  const openId = sp.get('open') || null;

  const setParams = useCallback((patch, { resetPage = true } = {}) => {
    const next = new URLSearchParams(sp.toString());
    Object.entries(patch).forEach(([k, v]) => {
      if (v === null || v === undefined || v === '') next.delete(k);
      else next.set(k, String(v));
    });
    if (resetPage && !('page' in patch)) next.delete('page');
    if (next.get('status') === 'all') next.delete('status');
    if (next.get('sort') === 'schedule') next.delete('sort');
    if (next.get('page') === '1') next.delete('page');
    const qs = next.toString();
    replaceUrl(qs ? `${pathname}?${qs}` : pathname);
  }, [sp, pathname]);

  // ---------------------------------------------------------------- search box (debounced)
  const [searchText, setSearchText] = useState(q);
  useEffect(() => {
    // Back/forward or a link changed ?q= — reflect it in the box
    setSearchText((cur) => (cur.trim() === q ? cur : q));
  }, [q]);
  useEffect(() => {
    const trimmed = searchText.trim();
    if (trimmed === q) return undefined;
    const t = setTimeout(() => setParams({ q: trimmed }), 400);
    return () => clearTimeout(t);
  }, [searchText, q, setParams]);

  // ---------------------------------------------------------------- data
  const [list, setList] = useState({ bookings: [], total: 0, pages: 1, counts: null });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);
  const [drawerRefreshKey, setDrawerRefreshKey] = useState(0);
  const seq = useRef(0);

  const apiParams = useMemo(() => {
    const { from, to } = dateRange(dateKey, fromParam, toParam);
    return {
      page,
      limit: PAGE_SIZE,
      status: tab === 'emergency' ? 'all' : tab,
      priority: tab === 'emergency' ? 'emergency' : priority || undefined,
      q: q || undefined,
      from,
      to,
      sort,
      unassigned: unassigned ? '1' : undefined,
      overdue: overdue ? '1' : undefined,
    };
  }, [page, tab, priority, q, dateKey, fromParam, toParam, sort, unassigned, overdue]);

  const load = useCallback(async ({ silent = false } = {}) => {
    const id = ++seq.current;
    if (silent) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await getBookings(apiParams);
      if (id !== seq.current) return;
      setList({
        bookings: Array.isArray(res?.bookings) ? res.bookings : [],
        total: Number(res?.total) || 0,
        pages: Math.max(1, Number(res?.pages) || 1),
        counts: res?.counts || null,
      });
      setError('');
      setUpdatedAt(new Date());
    } catch (err) {
      if (id !== seq.current) return;
      setError(err?.message || L('Could not load bookings.', 'تعذر تحميل الحجوزات.'));
    } finally {
      if (id === seq.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [apiParams, L]);

  useEffect(() => { load(); }, [load]);

  // A page past the end (e.g. the last booking on it was deleted) jumps back to the last page
  useEffect(() => {
    if (!loading && !error && list.bookings.length === 0 && list.total > 0 && page > list.pages) {
      setParams({ page: list.pages }, { resetPage: false });
    }
  }, [loading, error, page, list.pages, list.total, list.bookings.length, setParams]);

  // Auto-refresh: same filters/page, silent (no spinner, list stays in place), drawer re-fetches too
  const loadRef = useRef(load);
  useEffect(() => { loadRef.current = load; }, [load]);
  useEffect(() => {
    let last = Date.now();
    const tick = (force) => {
      if (document.visibilityState !== 'visible') return;
      // Coming back to the tab refreshes at once, but at most every 15s (the API rate limit is shared)
      if (!force && Date.now() - last < 15000) return;
      last = Date.now();
      loadRef.current({ silent: true });
      setDrawerRefreshKey((k) => k + 1);
    };
    const timer = setInterval(() => tick(true), REFRESH_MS);
    const onVisible = () => tick(false);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  // Services list resolves legacy bookings that only store a bare service id
  const [servicesById, setServicesById] = useState(null);
  useEffect(() => {
    let alive = true;
    getAdminServices()
      .then((res) => {
        const arr = Array.isArray(res) ? res : res?.services || res?.data || [];
        const map = {};
        arr.forEach((s) => { if (s?._id) map[String(s._id)] = s; if (s?.slug) map[s.slug] = s; });
        if (alive) setServicesById(map);
      })
      .catch(() => { /* names fall back to what the booking stores */ });
    return () => { alive = false; };
  }, []);

  const openBooking = (id) => setParams({ open: id }, { resetPage: false });
  const closeBooking = () => setParams({ open: null }, { resetPage: false });
  const onDrawerChanged = (_fresh, { removed } = {}) => {
    if (removed) closeBooking();
    load({ silent: true });
  };
  const initialForDrawer = openId ? list.bookings.find((b) => String(b._id) === openId) : null;

  const filtersActive = Boolean(q || dateKey || priority || unassigned || overdue || sort !== 'schedule' || tab !== 'all');
  const flagChips = [
    unassigned && { key: 'unassigned', label: L('Unassigned', 'غير معيّن') },
    overdue && { key: 'overdue', label: L('Overdue', 'متأخر') },
  ].filter(Boolean);
  const clearFilters = () => {
    setSearchText('');
    const next = new URLSearchParams();
    if (openId) next.set('open', openId);
    replaceUrl(next.toString() ? `${pathname}?${next}` : pathname);
  };

  const rangeStart = list.total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, list.total);

  // ---------------------------------------------------------------- render helpers
  const rowData = (b) => {
    const info = serviceInfo(b, servicesById);
    const date = bookingDate(b);
    const time = bookingTime(b);
    return {
      info,
      svc: serviceName(info, L),
      name: customerNameOf(b),
      phone: phoneOf(b),
      dateText: date ? fmtDate(date) : L('No date', 'بدون تاريخ'),
      timeText: time ? fmtSlot(time, isAr) : L('No time', 'بدون وقت'),
      status: normalizeStatus(b.status),
      wa: whatsappLink(phoneOf(b)),
    };
  };

  const waButton = (b, d) => d.wa && (
    <a
      href={d.wa}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      aria-label={L(`WhatsApp ${d.name || ''}`, `واتساب ${d.name || ''}`)}
      title="WhatsApp"
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-green-300 bg-green-50 text-green-800 hover:bg-green-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700 dark:border-green-500/40 dark:bg-green-500/10 dark:text-green-200"
    >
      <MessageCircle className="h-5 w-5" aria-hidden="true" />
    </a>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">{L('Bookings', 'الحجوزات')}</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {L('Confirm, dispatch and track service appointments', 'تأكيد وتوزيع ومتابعة مواعيد الخدمة')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {updatedAt && (
            <span className="text-xs text-slate-600 dark:text-slate-400" aria-live="polite">
              {L('Updated', 'آخر تحديث')} {fmtTime(updatedAt)}
            </span>
          )}
          <button
            type="button"
            onClick={() => { load({ silent: true }); if (openId) setDrawerRefreshKey((k) => k + 1); }}
            disabled={refreshing}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
            {L('Refresh', 'تحديث')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center">
          <div className="relative min-w-0 flex-1 lg:min-w-72">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 dark:text-slate-400" aria-hidden="true" />
            <input
              type="search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') setParams({ q: searchText.trim() }); }}
              aria-label={L('Search bookings', 'البحث في الحجوزات')}
              placeholder={L('Name, phone, ORD-… or BK…', 'الاسم، الجوال، ORD-… أو BK…')}
              dir="auto"
              className={`${INPUT} w-full ps-10 pe-10 placeholder:text-slate-500 dark:placeholder:text-slate-400`}
            />
            {searchText && (
              <button
                type="button"
                onClick={() => { setSearchText(''); setParams({ q: null }); }}
                aria-label={L('Clear search', 'مسح البحث')}
                className="absolute end-0 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <select
              aria-label={L('Date', 'التاريخ')}
              value={dateKey}
              onChange={(e) => {
                const v = e.target.value;
                if (v === 'custom') {
                  const today = dateRange('today').from;
                  setParams({ date: 'custom', from: fromParam || today, to: toParam || today });
                } else setParams({ date: v, from: null, to: null });
              }}
              className={INPUT}
            >
              <option value="">{L('Any date', 'أي تاريخ')}</option>
              <option value="today">{L('Today', 'اليوم')}</option>
              <option value="tomorrow">{L('Tomorrow', 'غداً')}</option>
              <option value="week">{L('This week', 'هذا الأسبوع')}</option>
              <option value="overdue">{L('Before today', 'قبل اليوم')}</option>
              <option value="custom">{L('Custom range…', 'نطاق مخصص…')}</option>
            </select>
            <select
              aria-label={L('Priority', 'الأولوية')}
              value={tab === 'emergency' ? 'emergency' : priority}
              disabled={tab === 'emergency'}
              onChange={(e) => setParams({ priority: e.target.value })}
              className={INPUT}
            >
              <option value="">{L('All priorities', 'كل الأولويات')}</option>
              <option value="emergency">{L('Emergency only', 'الطارئة فقط')}</option>
              <option value="normal">{L('Normal only', 'العادية فقط')}</option>
            </select>
            <select
              aria-label={L('Sort', 'الترتيب')}
              value={sort}
              onChange={(e) => setParams({ sort: e.target.value })}
              className={`${INPUT} col-span-2 sm:col-span-1`}
            >
              <option value="schedule">{L('Appointment: soonest first', 'الموعد: الأقرب أولاً')}</option>
              <option value="-schedule">{L('Appointment: latest first', 'الموعد: الأبعد أولاً')}</option>
              <option value="-created">{L('Newest bookings', 'الأحدث إنشاءً')}</option>
              <option value="created">{L('Oldest bookings', 'الأقدم إنشاءً')}</option>
            </select>
            {filtersActive && (
              <button
                type="button"
                onClick={clearFilters}
                className="col-span-2 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-blue-700 hover:bg-blue-50 sm:col-span-1 dark:text-blue-300 dark:hover:bg-blue-500/10"
              >
                <X className="h-4 w-4" aria-hidden="true" />{L('Clear filters', 'مسح الفلاتر')}
              </button>
            )}
          </div>
        </div>
        {dateKey === 'custom' && (
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              {L('From', 'من')}
              <input type="date" value={fromParam} max={toParam || undefined} onChange={(e) => setParams({ from: e.target.value })} className={INPUT} />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              {L('To', 'إلى')}
              <input type="date" value={toParam} min={fromParam || undefined} onChange={(e) => setParams({ to: e.target.value })} className={INPUT} />
            </label>
          </div>
        )}

        {flagChips.length > 0 && (
          <ul className="flex flex-wrap items-center gap-2" aria-label={L('Active filters', 'الفلاتر المفعّلة')}>
            {flagChips.map((c) => (
              <li key={c.key}>
                <span className="inline-flex min-h-9 items-center gap-1 rounded-full border border-blue-300 bg-blue-50 ps-3 text-sm font-semibold text-blue-900 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-100">
                  {c.label}
                  <button
                    type="button"
                    onClick={() => setParams({ [c.key]: null })}
                    aria-label={L(`Remove filter: ${c.label}`, `إزالة الفلتر: ${c.label}`)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full text-blue-800 hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-blue-600 dark:text-blue-200 dark:hover:bg-blue-500/20"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* Status tabs (counts from the API) */}
        <div className="-mx-1 overflow-x-auto px-1 pb-1" role="group" aria-label={L('Booking status', 'حالة الحجز')}>
          <div className="flex w-max gap-2 xl:w-auto xl:flex-wrap">
            {TABS.map((t) => {
              const active = tab === t.key;
              const count = list.counts?.[t.key];
              return (
                <button
                  key={t.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setParams({ status: t.key, ...(t.key === 'emergency' ? { priority: null } : {}) })}
                  className={`inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition ${
                    active
                      ? t.key === 'emergency' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                      : t.key === 'emergency'
                        ? 'border border-red-300 bg-white text-red-700 hover:bg-red-50 dark:border-red-500/40 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-500/10'
                        : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {L(t.en, t.ar)}
                  {count != null && (
                    <span className={`rounded-full px-1.5 py-0.5 text-xs ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>
                      {fmtNum(count)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-200">
          <span>{error}</span>
          <button type="button" onClick={() => load()} className="min-h-11 rounded-lg px-3 font-semibold underline">{L('Retry', 'إعادة المحاولة')}</button>
        </div>
      )}

      {/* List */}
      {loading && list.bookings.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-sm text-slate-600 dark:text-slate-300">
          <Loader2 className="me-2 h-5 w-5 animate-spin" aria-hidden="true" />{L('Loading bookings…', 'جارٍ تحميل الحجوزات…')}
        </div>
      ) : list.bookings.length === 0 && !error ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center dark:border-slate-800 dark:bg-slate-900">
          <ClipboardList className="mx-auto mb-3 h-10 w-10 text-slate-400 dark:text-slate-500" aria-hidden="true" />
          <p className="font-semibold text-slate-900 dark:text-white">{L('No bookings found', 'لا توجد حجوزات')}</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {filtersActive ? L('Nothing matches these filters.', 'لا شيء يطابق هذه الفلاتر.') : L('New bookings will appear here.', 'ستظهر الحجوزات الجديدة هنا.')}
          </p>
          {filtersActive && (
            <button type="button" onClick={clearFilters} className="mt-4 min-h-11 rounded-xl px-4 text-sm font-semibold text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-500/10">
              {L('Clear filters', 'مسح الفلاتر')}
            </button>
          )}
        </div>
      ) : (
        <div className={`transition-opacity ${loading ? 'opacity-60' : ''}`} aria-busy={loading || undefined}>
          {/* Cards below 1280px */}
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:hidden">
            {list.bookings.map((b) => {
              const d = rowData(b);
              const emergency = b.priority === 'emergency';
              return (
                <li key={b._id} className="min-w-0">
                  <div
                    className={`flex h-full flex-col gap-3 rounded-2xl border bg-white p-4 shadow-sm dark:bg-slate-900 ${emergency ? 'border-red-300 dark:border-red-500/50' : 'border-slate-200 dark:border-slate-800'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button type="button" onClick={() => openBooking(b._id)} className="min-w-0 text-start">
                        <span className="block truncate font-semibold text-slate-900 hover:underline dark:text-white" dir="auto" title={d.svc}>{d.svc}</span>
                        <span className="block font-mono text-xs text-slate-600 dark:text-slate-400">{orderRef(b)}</span>
                      </button>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <StatusBadge status={d.status} size="sm" />
                        <PriorityBadge priority={b.priority} size="sm" />
                      </div>
                    </div>
                    <div className="space-y-1.5 text-sm">
                      <p className="truncate font-semibold text-slate-800 dark:text-slate-100" dir="auto" title={d.name || ''}>{d.name || L('No name', 'بدون اسم')}</p>
                      {d.phone && <a href={telLink(d.phone)} className="inline-block font-mono text-blue-700 hover:underline dark:text-blue-300" dir="ltr">{d.phone}</a>}
                      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-700 dark:text-slate-300">
                        <span className="inline-flex items-center gap-1"><Calendar className="h-4 w-4 text-slate-500" aria-hidden="true" />{d.dateText}</span>
                        <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4 text-slate-500" aria-hidden="true" />{d.timeText}</span>
                        {b.rescheduledAt && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-500/15 dark:text-amber-200">{L('Rescheduled', 'أعيدت جدولته')}</span>}
                      </p>
                      {b.address && (
                        <p className="flex items-start gap-1 text-slate-700 dark:text-slate-300">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                          <span className="line-clamp-2 break-words" dir="auto" title={b.address}>{b.address}</span>
                        </p>
                      )}
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                      <div>
                        <span className="block font-semibold text-slate-900 dark:text-white">{fmtMoney(b.totalAmount)}</span>
                        {b.paymentStatus === 'paid' && <span className="text-xs font-semibold text-green-700 dark:text-green-300">{L('Paid', 'مدفوع')}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        {waButton(b, d)}
                        <button
                          type="button"
                          onClick={() => openBooking(b._id)}
                          className="inline-flex min-h-11 items-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                          {L('Manage', 'إدارة')}
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Table from 1280px: fixed columns, no horizontal scroll, sticky header */}
          <div className="hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:block dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full table-fixed border-separate border-spacing-0 text-start text-sm">
              <colgroup>
                <col className="w-[24%]" />
                <col className="w-[17%]" />
                <col className="w-[13%]" />
                <col className="w-[18%]" />
                <col className="w-[15%]" />
                <col className="w-[13%]" />
                <col className="w-16" />
              </colgroup>
              <thead>
                <tr className="text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">
                  {[
                    L('Service / order', 'الخدمة / الطلب'),
                    L('Customer', 'العميل'),
                    L('Appointment', 'الموعد'),
                    L('Address', 'العنوان'),
                    L('Status', 'الحالة'),
                    L('Total', 'الإجمالي'),
                  ].map((h, i) => (
                    <th
                      key={h}
                      scope="col"
                      className={`sticky top-16 z-10 border-b border-slate-200 bg-slate-50 px-3 py-3 text-start dark:border-slate-800 dark:bg-slate-800 ${i === 0 ? 'rounded-ss-2xl' : ''}`}
                    >
                      {h}
                    </th>
                  ))}
                  <th scope="col" className="sticky top-16 z-10 rounded-se-2xl border-b border-slate-200 bg-slate-50 px-2 py-3 dark:border-slate-800 dark:bg-slate-800">
                    <span className="sr-only">{L('Actions', 'الإجراءات')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.bookings.map((b) => {
                  const d = rowData(b);
                  const selected = openId === String(b._id);
                  return (
                    <tr
                      key={b._id}
                      onClick={() => openBooking(b._id)}
                      className={`cursor-pointer align-top hover:bg-blue-50/60 dark:hover:bg-slate-800/60 ${selected ? 'bg-blue-50 dark:bg-slate-800' : ''}`}
                    >
                      <td className="border-b border-slate-100 px-3 py-3 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); openBooking(b._id); }}
                          className="block w-full truncate text-start font-semibold text-slate-900 hover:underline focus-visible:outline-2 focus-visible:outline-blue-600 dark:text-white"
                          dir="auto"
                          title={d.svc}
                        >
                          {d.svc}
                        </button>
                        <span className="block truncate font-mono text-xs text-slate-600 dark:text-slate-400" title={orderRef(b)}>{orderRef(b)}</span>
                      </td>
                      <td className="border-b border-slate-100 px-3 py-3 dark:border-slate-800">
                        <span className="block truncate font-medium text-slate-900 dark:text-slate-100" dir="auto" title={d.name || ''}>{d.name || L('No name', 'بدون اسم')}</span>
                        {d.phone && (
                          <a href={telLink(d.phone)} onClick={(e) => e.stopPropagation()} className="block truncate font-mono text-xs text-blue-700 hover:underline dark:text-blue-300" dir="ltr">
                            {d.phone}
                          </a>
                        )}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-3 dark:border-slate-800">
                        <span className="block whitespace-nowrap font-medium text-slate-900 dark:text-slate-100">{d.dateText}</span>
                        <span className="block whitespace-nowrap text-xs text-slate-700 dark:text-slate-300">{d.timeText}</span>
                        {b.rescheduledAt && (
                          <span className="mt-1 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-900 dark:bg-amber-500/15 dark:text-amber-200">{L('Rescheduled', 'أعيدت جدولته')}</span>
                        )}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-3 dark:border-slate-800">
                        <span className="block truncate text-slate-800 dark:text-slate-200" dir="auto" title={b.address || ''}>{b.address || '—'}</span>
                        {b.city && <span className="block truncate text-xs text-slate-600 dark:text-slate-400" dir="auto">{b.city}</span>}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-3 dark:border-slate-800">
                        <div className="flex flex-col items-start gap-1">
                          <StatusBadge status={d.status} size="sm" />
                          <PriorityBadge priority={b.priority} size="sm" />
                        </div>
                      </td>
                      <td className="border-b border-slate-100 px-3 py-3 dark:border-slate-800">
                        <span className="block whitespace-nowrap font-semibold text-slate-900 dark:text-white">{fmtMoney(b.totalAmount)}</span>
                        {b.paymentStatus === 'paid' && <span className="text-xs font-semibold text-green-700 dark:text-green-300">{L('Paid', 'مدفوع')}</span>}
                      </td>
                      <td className="border-b border-slate-100 px-2 py-2 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
                        {waButton(b, d)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pager */}
          <nav className="mt-4 flex flex-wrap items-center justify-between gap-3" aria-label={L('Pages', 'الصفحات')}>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              {L(
                `Showing ${fmtNum(rangeStart)}–${fmtNum(rangeEnd)} of ${fmtNum(list.total)}`,
                `عرض ${fmtNum(rangeStart)}–${fmtNum(rangeEnd)} من ${fmtNum(list.total)}`,
              )}
            </p>
            {list.pages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setParams({ page: page - 1 }, { resetPage: false })}
                  className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />{L('Previous', 'السابق')}
                </button>
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {L(`Page ${fmtNum(page)} of ${fmtNum(list.pages)}`, `صفحة ${fmtNum(page)} من ${fmtNum(list.pages)}`)}
                </span>
                <button
                  type="button"
                  disabled={page >= list.pages || loading}
                  onClick={() => setParams({ page: page + 1 }, { resetPage: false })}
                  className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  {L('Next', 'التالي')}<ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                </button>
              </div>
            )}
          </nav>
        </div>
      )}

      {openId && (
        <BookingDrawer
          bookingId={openId}
          initial={initialForDrawer}
          servicesById={servicesById}
          refreshKey={drawerRefreshKey}
          onClose={closeBooking}
          onChanged={onDrawerChanged}
        />
      )}
    </div>
  );
}
