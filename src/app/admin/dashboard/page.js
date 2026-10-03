'use client';

// Operator "Today" board: action tiles (each opens the matching filtered list), today's schedule with
// quick actions, then all-time KPIs from GET /admin/stats. No invented fallbacks: failures show an
// error banner with retry instead of zeros.

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  CalendarClock, AlertTriangle, Siren, UserX, MessageSquare, Star, RefreshCw, Loader2, Check, ChevronRight,
  ChevronLeft, Banknote, Users, Wrench, ClipboardList,
} from 'lucide-react';
import { useAdminLang } from '../AdminI18n';
import { useAdminToast } from '../components/AdminToast';
import { StatusBadge, PriorityBadge, STATUS_META } from '../components/Badges';
import { getStats, getBookings, getAdminServices, updateBookingStatus } from '../adminApi';
import {
  STATUSES, normalizeStatus, serviceInfo, serviceName, customerNameOf, phoneOf, orderRef, telLink,
  bookingTime, fmtSlot, timeToMinutes, riyadhYmd,
} from '../bookings/bookingUtils';

const REFRESH_MS = 30000;

function ErrorBanner({ message, onRetry, L }) {
  return (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-200">
      <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />{message}</span>
      <button type="button" onClick={onRetry} className="min-h-11 rounded-lg px-3 font-semibold underline">{L('Retry', 'إعادة المحاولة')}</button>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { L, isAr, fmtDate, fmtMoney, fmtNum } = useAdminLang();
  const toast = useAdminToast();

  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState('');
  const [today, setToday] = useState(null);
  const [todayError, setTodayError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [servicesById, setServicesById] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const lock = useRef(new Set());

  const loadStats = useCallback(async () => {
    try {
      const res = await getStats();
      setStats(res);
      setStatsError('');
    } catch (err) {
      setStatsError(err?.message || L('Could not load statistics.', 'تعذر تحميل الإحصائيات.'));
    }
  }, [L]);

  const loadToday = useCallback(async () => {
    const day = riyadhYmd();
    try {
      const res = await getBookings({ status: 'all', from: day, to: day, sort: 'schedule', limit: 100, page: 1 });
      const list = Array.isArray(res?.bookings) ? res.bookings : [];
      // Sorted by slot time; cancelled at the end
      list.sort((a, b) => {
        const ca = normalizeStatus(a.status) === 'cancelled' ? 1 : 0;
        const cb = normalizeStatus(b.status) === 'cancelled' ? 1 : 0;
        if (ca !== cb) return ca - cb;
        return timeToMinutes(bookingTime(a)) - timeToMinutes(bookingTime(b));
      });
      setToday({ list, total: Number(res?.total) || list.length });
      setTodayError('');
    } catch (err) {
      setTodayError(err?.message || L("Could not load today's bookings.", 'تعذر تحميل حجوزات اليوم.'));
    }
  }, [L]);

  const loadAll = useCallback(async () => {
    await Promise.all([loadStats(), loadToday()]);
    setLoading(false);
    setRefreshing(false);
  }, [loadStats, loadToday]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const loadRef = useRef(loadAll);
  useEffect(() => { loadRef.current = loadAll; }, [loadAll]);
  useEffect(() => {
    let last = Date.now();
    const tick = (force) => {
      if (document.visibilityState !== 'visible') return;
      // Tab switches refresh at most every 15s (the API rate limit is shared)
      if (!force && Date.now() - last < 15000) return;
      last = Date.now();
      loadRef.current();
    };
    const timer = setInterval(() => tick(true), REFRESH_MS);
    const onVisible = () => tick(false);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  useEffect(() => {
    getAdminServices()
      .then((res) => {
        const arr = Array.isArray(res) ? res : res?.services || res?.data || [];
        const map = {};
        arr.forEach((s) => { if (s?._id) map[String(s._id)] = s; });
        setServicesById(map);
      })
      .catch(() => {});
  }, []);

  const quickConfirm = async (b) => {
    const id = String(b._id);
    if (lock.current.has(id)) return;
    lock.current.add(id);
    setConfirming(id);
    try {
      await updateBookingStatus(id, 'confirmed', { expectedStatus: 'pending' });
      toast.success(L(`Booking ${orderRef(b)} confirmed`, `تم تأكيد الحجز ${orderRef(b)}`));
    } catch (err) {
      if (err?.status === 409) toast.error(L('This booking was just changed — refreshed', 'تم تعديل هذا الحجز للتو — تم التحديث'));
      else toast.error(err?.message || L('Could not confirm the booking.', 'تعذر تأكيد الحجز.'));
    } finally {
      lock.current.delete(id);
      setConfirming(null);
      loadAll();
    }
  };

  const refresh = () => { setRefreshing(true); loadAll(); };

  const s = stats || {};
  const tiles = [
    { key: 'jobs', icon: CalendarClock, en: "Today's jobs", ar: 'مهام اليوم', value: s.today?.jobs, href: '/admin/bookings?date=today', tone: 'blue' },
    { key: 'overdue', icon: AlertTriangle, en: 'Overdue', ar: 'متأخرة', value: s.today?.overdue, href: '/admin/bookings?status=active&overdue=1', tone: 'amber' },
    { key: 'emerg', icon: Siren, en: 'Emergencies', ar: 'طوارئ', value: s.today?.emergencies, href: '/admin/bookings?status=active&priority=emergency', tone: 'red' },
    { key: 'unassigned', icon: UserX, en: 'Unassigned confirmed', ar: 'مؤكدة بدون فني', value: s.today?.unassigned, href: '/admin/bookings?status=confirmed&unassigned=1', tone: 'indigo' },
    { key: 'msgs', icon: MessageSquare, en: 'New messages', ar: 'رسائل جديدة', value: s.inquiries?.new, href: '/admin/feedback', tone: 'cyan' },
    { key: 'reviews', icon: Star, en: 'Pending reviews', ar: 'تقييمات بانتظار الموافقة', value: s.reviews?.pending, href: '/admin/reviews?status=pending', tone: 'violet' },
  ];
  const TONE = {
    blue: 'text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-500/15',
    amber: 'text-amber-800 bg-amber-50 dark:text-amber-300 dark:bg-amber-500/15',
    red: 'text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-500/15',
    indigo: 'text-indigo-700 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-500/15',
    cyan: 'text-cyan-800 bg-cyan-50 dark:text-cyan-300 dark:bg-cyan-500/15',
    violet: 'text-violet-700 bg-violet-50 dark:text-violet-300 dark:bg-violet-500/15',
  };
  const Chevron = isAr ? ChevronLeft : ChevronRight;
  const card = 'rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900';

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-600 dark:text-slate-300">
        <Loader2 className="me-2 h-5 w-5 animate-spin" aria-hidden="true" />{L('Loading dashboard…', 'جارٍ تحميل لوحة التحكم…')}
      </div>
    );
  }

  const todaySection = (
    <section className={`${card} order-1 md:order-2`} aria-labelledby="today-title">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3 sm:px-5 dark:border-slate-800">
        <div>
          <h2 id="today-title" className="text-lg font-bold text-slate-900 dark:text-white">{L("Today's schedule", 'جدول اليوم')}</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">{fmtDate(riyadhYmd())}</p>
        </div>
        <Link href="/admin/bookings?date=today" className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-blue-700 hover:underline dark:text-blue-300">
          {L('All of today', 'كل حجوزات اليوم')}<Chevron className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      {todayError ? (
        <div className="p-4"><ErrorBanner message={todayError} onRetry={loadToday} L={L} /></div>
      ) : !today || today.list.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-slate-600 dark:text-slate-400">{L('No bookings scheduled for today.', 'لا توجد حجوزات مجدولة اليوم.')}</p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {today.list.map((b) => {
            const st = normalizeStatus(b.status);
            const name = customerNameOf(b);
            const phone = phoneOf(b);
            const t = bookingTime(b);
            const svc = serviceName(serviceInfo(b, servicesById), L);
            const href = `/admin/bookings?open=${encodeURIComponent(b._id)}`;
            return (
              <li key={b._id} className={`flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap sm:px-5 ${st === 'cancelled' ? 'opacity-70' : ''}`}>
                <div className="w-20 shrink-0 font-semibold text-slate-900 dark:text-white">{t ? fmtSlot(t, isAr) : L('No time', 'بدون وقت')}</div>
                <div className="min-w-[12rem] flex-1">
                  <Link href={href} className="block truncate font-semibold text-slate-900 hover:underline dark:text-white" dir="auto" title={svc}>{svc}</Link>
                  <p className="truncate text-sm text-slate-700 dark:text-slate-300">
                    <span dir="auto">{name || L('No name', 'بدون اسم')}</span>
                    {phone && <> · <a href={telLink(phone)} className="font-mono text-blue-700 hover:underline dark:text-blue-300" dir="ltr">{phone}</a></>}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={st} size="sm" />
                    <PriorityBadge priority={b.priority} size="sm" />
                    <span className="font-mono text-xs text-slate-600 dark:text-slate-400">{orderRef(b)}</span>
                  </div>
                </div>
                <div className="ms-auto flex shrink-0 items-center gap-2">
                  {st === 'pending' && (
                    <button
                      type="button"
                      onClick={() => quickConfirm(b)}
                      disabled={confirming === String(b._id)}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      {confirming === String(b._id) ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
                      {L('Confirm', 'تأكيد')}
                    </button>
                  )}
                  <Link
                    href={href}
                    className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                  >
                    {L('Open', 'فتح')}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">{L('Today', 'اليوم')}</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{L('What needs attention right now', 'ما يحتاج إلى متابعة الآن')}</p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />{L('Refresh', 'تحديث')}
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {/* Action tiles */}
        <div className="order-2 md:order-1">
          {statsError ? (
            <ErrorBanner message={statsError} onRetry={loadStats} L={L} />
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
              {tiles.map((t) => {
                const Icon = t.icon;
                const highlight = (t.key === 'overdue' || t.key === 'emerg') && Number(t.value) > 0;
                return (
                  <li key={t.key}>
                    <Link
                      href={t.href}
                      className={`flex h-full min-h-24 flex-col justify-between gap-2 rounded-2xl border bg-white p-4 shadow-sm transition hover:border-blue-400 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:bg-slate-900 ${highlight ? 'border-red-300 dark:border-red-500/50' : 'border-slate-200 dark:border-slate-800'}`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{L(t.en, t.ar)}</span>
                        <span className={`rounded-lg p-1.5 ${TONE[t.tone]}`}><Icon className="h-4 w-4" aria-hidden="true" /></span>
                      </span>
                      <span className="text-2xl font-bold text-slate-900 dark:text-white">{fmtNum(t.value)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {todaySection}

        {/* All-time KPIs */}
        {!statsError && stats && (
          <div className="order-3 grid gap-4 lg:grid-cols-2">
            <section className={`${card} p-4 sm:p-5 lg:col-span-2`} aria-labelledby="by-status">
              <h2 id="by-status" className="mb-3 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                <ClipboardList className="h-5 w-5" aria-hidden="true" />{L('Bookings by status', 'الحجوزات حسب الحالة')}
                <span className="text-sm font-normal text-slate-600 dark:text-slate-400">· {L('total', 'الإجمالي')} {fmtNum(s.byStatus?.all)}</span>
              </h2>
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
                {STATUSES.map((st) => (
                  <li key={st}>
                    <Link
                      href={`/admin/bookings?status=${st}`}
                      className="flex min-h-11 flex-col gap-1 rounded-xl border border-slate-200 p-3 hover:border-blue-400 hover:bg-blue-50/50 dark:border-slate-800 dark:hover:bg-slate-800/60"
                    >
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_META[st]?.dot}`} aria-hidden="true" />
                        <span className="truncate">{L(STATUS_META[st]?.en, STATUS_META[st]?.ar)}</span>
                      </span>
                      <span className="text-xl font-bold text-slate-900 dark:text-white">{fmtNum(s.byStatus?.[st])}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section className={`${card} p-4 sm:p-5`} aria-labelledby="revenue">
              <h2 id="revenue" className="mb-3 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                <Banknote className="h-5 w-5" aria-hidden="true" />{L('Revenue', 'الإيرادات')}
                <span className="text-sm font-normal text-slate-600 dark:text-slate-400">· {L('all time', 'منذ البداية')}</span>
              </h2>
              <dl className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-xs text-slate-600 dark:text-slate-400">{L('Completed jobs', 'المهام المكتملة')}</dt>
                  <dd className="text-xl font-bold text-slate-900 dark:text-white">{fmtMoney(s.revenue?.completedSAR)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-600 dark:text-slate-400">{L('Paid', 'المدفوع')}</dt>
                  <dd className="text-xl font-bold text-slate-900 dark:text-white">{fmtMoney(s.revenue?.paidSAR)}</dd>
                </div>
              </dl>
            </section>

            <section className={`${card} p-4 sm:p-5`} aria-labelledby="reviews-kpi">
              <h2 id="reviews-kpi" className="mb-3 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                <Star className="h-5 w-5" aria-hidden="true" />{L('Customer reviews', 'تقييمات العملاء')}
              </h2>
              <dl className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-xs text-slate-600 dark:text-slate-400">{L('Average rating', 'متوسط التقييم')}</dt>
                  <dd className="text-xl font-bold text-slate-900 dark:text-white">
                    {Number(s.reviews?.count) > 0 && Number.isFinite(Number(s.reviews?.average))
                      ? `${Number(s.reviews.average).toLocaleString(isAr ? 'ar-SA' : 'en-GB', { maximumFractionDigits: 1, minimumFractionDigits: 1 })} / 5`
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-600 dark:text-slate-400">{L('Reviews', 'التقييمات')}</dt>
                  <dd className="text-xl font-bold text-slate-900 dark:text-white">
                    <Link href="/admin/reviews" className="hover:underline">{fmtNum(s.reviews?.count)}</Link>
                  </dd>
                </div>
              </dl>
            </section>

            <section className={`${card} p-4 sm:p-5`} aria-labelledby="users-kpi">
              <h2 id="users-kpi" className="mb-3 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                <Users className="h-5 w-5" aria-hidden="true" />{L('Users', 'المستخدمون')}
              </h2>
              <dl className="grid grid-cols-3 gap-3">
                {[
                  ['customer', L('Customers', 'العملاء'), s.users?.customers],
                  ['technician', L('Technicians', 'الفنيون'), s.users?.technicians],
                  ['admin', L('Admins', 'المشرفون'), s.users?.admins],
                ].map(([role, label, v]) => (
                  <div key={role}>
                    <dt className="text-xs text-slate-600 dark:text-slate-400">{label}</dt>
                    <dd className="text-xl font-bold text-slate-900 dark:text-white">
                      <Link href={`/admin/users?role=${role}`} className="hover:underline">{fmtNum(v)}</Link>
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className={`${card} p-4 sm:p-5`} aria-labelledby="services-kpi">
              <h2 id="services-kpi" className="mb-3 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                <Wrench className="h-5 w-5" aria-hidden="true" />{L('Services', 'الخدمات')}
              </h2>
              <dl className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-xs text-slate-600 dark:text-slate-400">{L('Active', 'نشطة')}</dt>
                  <dd className="text-xl font-bold text-slate-900 dark:text-white"><Link href="/admin/services" className="hover:underline">{fmtNum(s.services?.active)}</Link></dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-600 dark:text-slate-400">{L('Inactive', 'غير نشطة')}</dt>
                  <dd className="text-xl font-bold text-slate-900 dark:text-white"><Link href="/admin/services" className="hover:underline">{fmtNum(s.services?.inactive)}</Link></dd>
                </div>
              </dl>
            </section>
          </div>
        )}
      </div>
      <p className="sr-only" aria-live="polite">{refreshing ? L('Refreshing', 'جارٍ التحديث') : ''}</p>
    </div>
  );
}
