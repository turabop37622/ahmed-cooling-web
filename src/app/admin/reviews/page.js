'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { adminApi } from '../adminApi';
import { useAdminLang } from '../AdminI18n';
import { useAdminToast } from '../components';
import {
  Star,
  RefreshCw,
  EyeOff,
  Eye,
  Check,
  Clock,
  Wrench,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';

const PAGE_SIZE = 24;
const card = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm';
const tabBase = 'min-h-[44px] px-3.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600';
const ARABIC = /[؀-ۿ]/;

const reviewId = (r) => r?._id || r?.id;
const ratingOf = (r) => {
  const n = Number(r?.rating);
  return Number.isFinite(n) && n >= 1 && n <= 5 ? n : null;
};
// "Hidden" only when the API says the review was moderated and taken down; otherwise it was never published
const isHidden = (r) => !r.approved && (r.hidden === true || r.status === 'hidden' || !!r.moderatedAt || !!r.hiddenAt);

function Stars({ value, size = 'w-4 h-4', label }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={label}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = value == null ? 0 : Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <span key={i} className={`relative inline-block ${size}`} aria-hidden="true">
            <Star className={`absolute inset-0 ${size} text-slate-300 dark:text-slate-600`} />
            {fill > 0 && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className={`${size} text-amber-500 fill-amber-400`} />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

export default function AdminReviewsPage() {
  const { L, isAr, fmtDate, fmtNum } = useAdminLang();
  const toast = useAdminToast();

  const [tab, setTab] = useState('pending'); // 'pending' | 'approved' | 'all'
  const [page, setPage] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState(null); // { pending, approved, all }
  const [summary, setSummary] = useState(null); // { average, count }
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [busyIds, setBusyIds] = useState(() => new Set());
  const busyRef = useRef(new Set());
  const seqRef = useRef(0);

  const fetchAll = useCallback(async (status, pageNo) => {
    const seq = ++seqRef.current;
    setLoading(true);
    try {
      const main = await adminApi.getReviews({ status, page: pageNo, limit: PAGE_SIZE });
      // Tab counts and the overall average: use what the API sends, otherwise ask for the totals (limit 1)
      let c = main?.counts;
      let overall = status === 'all' ? main : null;
      if (!c || !overall) {
        const others = ['pending', 'approved', 'all'].filter((s) => s !== status);
        const res = await Promise.all(others.map((s) => adminApi.getReviews({ status: s, page: 1, limit: 1 })));
        const byStatus = { [status]: main };
        others.forEach((s, i) => { byStatus[s] = res[i]; });
        if (!c) c = { pending: byStatus.pending?.total, approved: byStatus.approved?.total, all: byStatus.all?.total };
        overall = byStatus.all;
      }
      if (seq !== seqRef.current) return;
      const list = Array.isArray(main?.reviews) ? main.reviews : [];
      setReviews(list);
      setTotal(Number(main?.total ?? list.length) || 0);
      setCounts(c);
      const avg = Number(overall?.average);
      setSummary({ average: Number.isFinite(avg) && avg > 0 ? avg : null, count: Number(c?.all ?? overall?.total ?? 0) });
      setLoadError('');
    } catch (err) {
      if (seq !== seqRef.current) return;
      setLoadError(err?.message || 'Could not load reviews');
    } finally {
      if (seq === seqRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll(tab, page);
  }, [fetchAll, tab, page, reloadKey]);

  const retry = () => setReloadKey((k) => k + 1);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const setApproved = async (rev, approved) => {
    const id = reviewId(rev);
    if (!id || busyRef.current.has(id)) return;
    busyRef.current.add(id);
    setBusyIds(new Set(busyRef.current));
    try {
      await adminApi.setReviewApproved(id, approved);
      toast.success(approved ? L('Review published on the website', 'تم نشر التقييم في الموقع') : L('Review hidden from the website', 'تم إخفاء التقييم من الموقع'));
      setReviews((prev) =>
        prev
          .map((r) => (reviewId(r) === id ? { ...r, approved } : r))
          .filter((r) => tab === 'all' || (tab === 'approved' ? r.approved : !r.approved))
      );
      fetchAll(tab, page);
    } catch (err) {
      toast.error(err?.message || L('Could not update the review', 'تعذّر تحديث التقييم'));
    } finally {
      busyRef.current.delete(id);
      setBusyIds(new Set(busyRef.current));
    }
  };

  const tabs = [
    { key: 'pending', label: L('Pending', 'بانتظار المراجعة'), count: counts?.pending },
    { key: 'approved', label: L('Approved', 'منشورة'), count: counts?.approved },
    { key: 'all', label: L('All', 'الكل'), count: counts?.all },
  ];

  const quote = (text) => (ARABIC.test(text) ? `«${text}»` : `“${text}”`);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white">{L('Reviews', 'التقييمات')}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            {L('Customer reviews of completed bookings. Only approved reviews appear on the website.', 'تقييمات العملاء للحجوزات المكتملة. لا يظهر في الموقع إلا التقييم المعتمد.')}
          </p>
        </div>
        <button
          type="button"
          onClick={retry}
          disabled={loading}
          className="self-start sm:self-auto min-h-[44px] px-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          {L('Refresh', 'تحديث')}
        </button>
      </div>

      {loadError && (
        <div role="alert" className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-4 text-red-800 dark:text-red-200">
          <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden="true" />
          <div className="flex-1 text-sm">
            <p className="font-semibold">{L('Could not load reviews', 'تعذّر تحميل التقييمات')}</p>
            <p>{loadError}</p>
          </div>
          <button type="button" onClick={retry} className="min-h-[44px] px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold">
            {L('Retry', 'إعادة المحاولة')}
          </button>
        </div>
      )}

      {/* Summary */}
      {!loadError && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className={`${card} p-4 sm:col-span-1`}>
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{L('Average rating', 'متوسط التقييم')}</div>
            {summary == null ? (
              <div className="mt-2 h-8 w-32 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ) : summary.average == null ? (
              <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">—</div>
            ) : (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">{summary.average.toLocaleString(isAr ? 'ar-SA' : 'en-GB', { maximumFractionDigits: 1, minimumFractionDigits: 1 })}</span>
                <span className="text-sm text-slate-600 dark:text-slate-400">/ {fmtNum(5)}</span>
                <Stars value={summary.average} size="w-5 h-5" label={L(`${summary.average.toFixed(1)} out of 5 stars`, `${summary.average.toFixed(1)} من 5 نجوم`)} />
              </div>
            )}
            {summary != null && (
              <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {L(`Based on ${fmtNum(summary.count)} reviews`, `من ${fmtNum(summary.count)} تقييم`)}
              </div>
            )}
          </div>
          <div className={`${card} p-4`}>
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{L('Awaiting review', 'بانتظار المراجعة')}</div>
            {counts == null ? (
              <div className="mt-2 h-8 w-12 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ) : (
              <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">{fmtNum(counts.pending)}</div>
            )}
          </div>
          <div className={`${card} p-4`}>
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{L('Published', 'منشورة')}</div>
            {counts == null ? (
              <div className="mt-2 h-8 w-12 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ) : (
              <div className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">{fmtNum(counts.approved)}</div>
            )}
          </div>
        </div>
      )}

      <div role="tablist" aria-label={L('Review status', 'حالة التقييم')} className={`${card} p-3 flex items-center gap-1.5 overflow-x-auto`}>
        {tabs.map((t) => {
          const on = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => {
                setTab(t.key);
                setPage(1);
              }}
              className={`${tabBase} ${on ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <span>{t.label}</span>
              {t.count != null && !loadError && (
                <span className={`text-xs px-1.5 rounded-full tabular-nums ${on ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}>
                  {fmtNum(t.count)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading && reviews.length === 0 && !loadError ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" aria-busy="true" aria-label={L('Loading reviews', 'جارٍ تحميل التقييمات')}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`${card} p-5 space-y-3 animate-pulse`}>
              <div className="h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-16 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
              <div className="h-10 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      ) : loadError && reviews.length === 0 ? null : reviews.length === 0 ? (
        <div className={`${card} py-14 px-6 text-center`}>
          <MessageSquare className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-3" aria-hidden="true" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {tab === 'pending'
              ? L('No reviews waiting for approval', 'لا توجد تقييمات بانتظار المراجعة')
              : tab === 'approved'
                ? L('No published reviews yet', 'لا توجد تقييمات منشورة بعد')
                : L('No reviews yet', 'لا توجد تقييمات بعد')}
          </h2>
        </div>
      ) : (
        <>
          <ul className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 ${loading ? 'opacity-60' : ''}`} aria-busy={loading || undefined}>
            {reviews.map((rev) => {
              const id = reviewId(rev);
              const rating = ratingOf(rev);
              const comment = String(rev.comment ?? '').trim();
              const busy = busyIds.has(id);
              const hidden = isHidden(rev);
              const name = rev.customerName || L('Customer', 'عميل');
              const serviceName = (isAr ? rev.serviceNameAr || rev.serviceName : rev.serviceName || rev.serviceNameAr) || '';
              return (
                <li key={id} className={`${card} p-5 flex flex-col gap-3`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-800 dark:text-amber-200 font-semibold flex items-center justify-center shrink-0" aria-hidden="true">
                        {name.trim().charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-sm font-semibold text-slate-900 dark:text-white truncate" dir="auto" title={name}>{name}</h2>
                        <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 min-w-0">
                          <Wrench className="w-3 h-3 shrink-0" aria-hidden="true" />
                          <span className="truncate" dir="auto" title={serviceName}>{serviceName || '—'}</span>
                        </div>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        rev.approved
                          ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'
                          : hidden
                            ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            : 'bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'
                      }`}
                    >
                      {rev.approved ? <Check className="w-3 h-3" aria-hidden="true" /> : hidden ? <EyeOff className="w-3 h-3" aria-hidden="true" /> : <Clock className="w-3 h-3" aria-hidden="true" />}
                      {rev.approved ? L('Published', 'منشور') : hidden ? L('Hidden', 'مخفي') : L('Not published', 'غير منشور')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {rating != null ? (
                      <>
                        <Stars value={rating} label={L(`${rating} out of 5 stars`, `${rating} من 5 نجوم`)} />
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 tabular-nums">{fmtNum(rating)}/{fmtNum(5)}</span>
                      </>
                    ) : (
                      <span className="text-sm text-slate-600 dark:text-slate-400">{L('Rating', 'التقييم')}: —</span>
                    )}
                  </div>

                  {comment ? (
                    <blockquote dir="auto" className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 whitespace-pre-wrap break-words line-clamp-6">
                      {quote(comment)}
                    </blockquote>
                  ) : (
                    <p className="text-sm italic text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                      {L('No comment', 'بدون تعليق')}
                    </p>
                  )}

                  <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      {rev.date ? fmtDate(rev.date) : L('No date', 'بدون تاريخ')}
                    </span>
                    {rev.approved ? (
                      <button
                        type="button"
                        onClick={() => setApproved(rev, false)}
                        disabled={busy}
                        className="min-h-[44px] px-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-600 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-500/10 dark:hover:text-rose-300 disabled:opacity-60"
                      >
                        {busy ? <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" /> : <EyeOff className="w-4 h-4" aria-hidden="true" />}
                        {L('Hide', 'إخفاء')}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setApproved(rev, true)}
                        disabled={busy}
                        className="min-h-[44px] px-3 inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold disabled:opacity-60"
                      >
                        {busy ? <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                        {L('Approve & publish', 'اعتماد ونشر')}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {pages > 1 && (
            <nav aria-label={L('Pages', 'الصفحات')} className="flex items-center justify-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="min-h-[44px] px-3 inline-flex items-center gap-1 rounded-xl border border-slate-300 dark:border-slate-600 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
                {L('Previous', 'السابق')}
              </button>
              <span className="tabular-nums">{L(`Page ${fmtNum(page)} / ${fmtNum(pages)}`, `صفحة ${fmtNum(page)} / ${fmtNum(pages)}`)}</span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page >= pages || loading}
                className="min-h-[44px] px-3 inline-flex items-center gap-1 rounded-xl border border-slate-300 dark:border-slate-600 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40"
              >
                {L('Next', 'التالي')}
                <ChevronRight className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
