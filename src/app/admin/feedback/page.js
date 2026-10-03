'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { adminApi } from '../adminApi';
import { useAdminLang } from '../AdminI18n';
import { useAdminToast } from '../components';
import {
  MessageSquare,
  Star,
  Phone,
  MessageCircle,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Inbox,
} from 'lucide-react';

const PAGE_SIZE = 20;
const card = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm';
const tabBase = 'min-h-[44px] px-3.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600';
const tabOn = 'bg-blue-600 text-white shadow-sm';
const tabOff = 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800';
const LONG_MESSAGE = 280;

// wa.me needs international digits: 05xxxxxxxx -> 9665xxxxxxxx
const waDigits = (phone) => {
  let d = String(phone || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('05') && d.length === 10) d = `966${d.slice(1)}`;
  else if (d.startsWith('5') && d.length === 9) d = `966${d}`;
  return d;
};

const pagesOf = (res, total) => Number(res?.pages ?? res?.pagination?.pages) || Math.max(1, Math.ceil((Number(total) || 0) / PAGE_SIZE));

function Pill({ on, children }) {
  return (
    <span className={`text-xs px-1.5 rounded-full tabular-nums ${on ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}>
      {children}
    </span>
  );
}

function ErrorBanner({ title, message, onRetry }) {
  const { L } = useAdminLang();
  return (
    <div role="alert" className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-4 text-red-800 dark:text-red-200">
      <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden="true" />
      <div className="flex-1 text-sm">
        <p className="font-semibold">{title}</p>
        <p>{message}</p>
      </div>
      <button type="button" onClick={onRetry} className="min-h-[44px] px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold">
        {L('Retry', 'إعادة المحاولة')}
      </button>
    </div>
  );
}

function Pager({ page, pages, loading, onPage }) {
  const { L, fmtNum } = useAdminLang();
  if (pages <= 1) return null;
  const btn = 'min-h-[44px] px-3 inline-flex items-center gap-1 rounded-xl border border-slate-300 dark:border-slate-600 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40';
  return (
    <nav aria-label={L('Pages', 'الصفحات')} className="flex items-center justify-center gap-2 text-sm text-slate-700 dark:text-slate-300">
      <button type="button" className={btn} onClick={() => onPage(page - 1)} disabled={page <= 1 || loading}>
        <ChevronLeft className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
        {L('Previous', 'السابق')}
      </button>
      <span className="tabular-nums">{L(`Page ${fmtNum(page)} / ${fmtNum(pages)}`, `صفحة ${fmtNum(page)} / ${fmtNum(pages)}`)}</span>
      <button type="button" className={btn} onClick={() => onPage(page + 1)} disabled={page >= pages || loading}>
        {L('Next', 'التالي')}
        <ChevronRight className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
      </button>
    </nav>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3" aria-busy="true">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={`${card} p-4 space-y-3 animate-pulse`}>
          <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-3 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      ))}
    </div>
  );
}

function InquiriesPanel() {
  const { L, fmtDateTime, fmtNum } = useAdminLang();
  const toast = useAdminToast();
  const [status, setStatus] = useState('new');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [expanded, setExpanded] = useState(() => new Set());
  const [busyIds, setBusyIds] = useState(() => new Set());
  const busyRef = useRef(new Set());
  const seqRef = useRef(0);

  const load = useCallback(async (st, pg) => {
    const seq = ++seqRef.current;
    setLoading(true);
    try {
      const res = await adminApi.getInquiries({ status: st, page: pg, limit: PAGE_SIZE });
      if (seq !== seqRef.current) return;
      const list = Array.isArray(res?.inquiries) ? res.inquiries : [];
      setItems(list);
      const t = Number(res?.total ?? list.length) || 0;
      setTotal(t);
      setPages(pagesOf(res, t));
      setCounts(res?.counts ?? null);
      setError('');
    } catch (err) {
      if (seq !== seqRef.current) return;
      setError(err?.message || 'Could not load messages');
    } finally {
      if (seq === seqRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(status, page);
  }, [load, status, page, reloadKey]);

  const toggleStatus = async (item) => {
    const id = item._id;
    if (!id || busyRef.current.has(id)) return;
    const next = item.status === 'handled' ? 'new' : 'handled';
    busyRef.current.add(id);
    setBusyIds(new Set(busyRef.current));
    try {
      await adminApi.setInquiryStatus(id, next);
      toast.success(next === 'handled' ? L('Marked as handled', 'تم وضع علامة "تمت المعالجة"') : L('Marked as new', 'تمت إعادته إلى "جديد"'));
      setItems((prev) => prev.map((x) => (x._id === id ? { ...x, status: next } : x)).filter((x) => status === 'all' || x.status === status));
      setCounts((c) => (c ? { ...c, [item.status || 'new']: Math.max(0, (c[item.status || 'new'] || 0) - 1), [next]: (c[next] || 0) + 1 } : c));
      load(status, page);
    } catch (err) {
      toast.error(err?.message || L('Could not update the message', 'تعذّر تحديث الرسالة'));
    } finally {
      busyRef.current.delete(id);
      setBusyIds(new Set(busyRef.current));
    }
  };

  const tabs = [
    { key: 'new', label: L('New', 'جديدة'), count: counts?.new },
    { key: 'handled', label: L('Handled', 'تمت المعالجة'), count: counts?.handled },
    { key: 'all', label: L('All', 'الكل'), count: counts ? (counts.new || 0) + (counts.handled || 0) : undefined },
  ];

  return (
    <div className="space-y-4">
      <div role="tablist" aria-label={L('Message status', 'حالة الرسالة')} className="flex items-center gap-1.5 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={status === t.key}
            onClick={() => {
              setStatus(t.key);
              setPage(1);
            }}
            className={`${tabBase} ${status === t.key ? tabOn : tabOff}`}
          >
            {t.label}
            {t.count != null && !error && <Pill on={status === t.key}>{fmtNum(t.count)}</Pill>}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          disabled={loading}
          aria-label={L('Refresh messages', 'تحديث الرسائل')}
          className="ms-auto min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
        </button>
      </div>

      {error && <ErrorBanner title={L('Could not load messages', 'تعذّر تحميل الرسائل')} message={error} onRetry={() => setReloadKey((k) => k + 1)} />}

      {loading && items.length === 0 && !error ? (
        <SkeletonList />
      ) : error && items.length === 0 ? null : items.length === 0 ? (
        <div className={`${card} py-14 px-6 text-center`}>
          <Inbox className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-3" aria-hidden="true" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            {status === 'new' ? L('No new messages', 'لا توجد رسائل جديدة') : status === 'handled' ? L('No handled messages', 'لا توجد رسائل تمت معالجتها') : L('No messages yet', 'لا توجد رسائل بعد')}
          </h3>
        </div>
      ) : (
        <>
          <ul className={`space-y-3 ${loading ? 'opacity-60' : ''}`} aria-busy={loading || undefined}>
            {items.map((item) => {
              const handled = item.status === 'handled';
              const msg = String(item.message ?? '');
              const isLong = msg.length > LONG_MESSAGE || msg.split('\n').length > 4;
              const open = expanded.has(item._id);
              const wa = waDigits(item.phone);
              const busy = busyIds.has(item._id);
              return (
                <li key={item._id} className={`${card} p-4 sm:p-5`}>
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-900 dark:text-white truncate max-w-full" dir="auto" title={item.name}>
                          {item.name || L('No name', 'بدون اسم')}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            handled
                              ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              : 'bg-blue-50 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300'
                          }`}
                        >
                          {handled ? L('Handled', 'تمت المعالجة') : L('New', 'جديدة')}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                        <time dateTime={item.createdAt}>{fmtDateTime(item.createdAt)}</time>
                      </div>
                      <p
                        id={`inq-msg-${item._id}`}
                        dir="auto"
                        className={`mt-3 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words leading-relaxed ${isLong && !open ? 'line-clamp-4' : ''}`}
                      >
                        {msg || <span className="italic text-slate-600 dark:text-slate-400">{L('No message', 'بدون رسالة')}</span>}
                      </p>
                      {isLong && (
                        <button
                          type="button"
                          aria-expanded={open}
                          aria-controls={`inq-msg-${item._id}`}
                          onClick={() =>
                            setExpanded((prev) => {
                              const n = new Set(prev);
                              if (n.has(item._id)) n.delete(item._id);
                              else n.add(item._id);
                              return n;
                            })
                          }
                          className="mt-1 min-h-[44px] text-sm font-semibold text-blue-700 dark:text-blue-300 hover:underline"
                        >
                          {open ? L('Show less', 'عرض أقل') : L('Show more', 'عرض المزيد')}
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap sm:flex-col gap-2 sm:w-48 shrink-0">
                      {item.phone && (
                        <a
                          href={`tel:${item.phone}`}
                          className="min-h-[44px] px-3 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-600 text-sm font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-slate-800"
                        >
                          <Phone className="w-4 h-4" aria-hidden="true" />
                          <span dir="ltr">{item.phone}</span>
                        </a>
                      )}
                      {wa && (
                        <a
                          href={`https://wa.me/${wa}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-h-[44px] px-3 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold"
                        >
                          <MessageCircle className="w-4 h-4" aria-hidden="true" />
                          WhatsApp
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleStatus(item)}
                        disabled={busy}
                        className={`min-h-[44px] px-3 inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold disabled:opacity-60 ${
                          handled
                            ? 'border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {busy ? (
                          <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
                        ) : handled ? (
                          <RotateCcw className="w-4 h-4" aria-hidden="true" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                        )}
                        {handled ? L('Mark new', 'إعادة كجديدة') : L('Mark handled', 'تمت المعالجة')}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <Pager page={page} pages={pages} loading={loading} onPage={setPage} />
          {total > 0 && (
            <p className="text-center text-xs text-slate-600 dark:text-slate-400">{L(`${fmtNum(total)} messages`, `${fmtNum(total)} رسالة`)}</p>
          )}
        </>
      )}
    </div>
  );
}

function RatingsPanel() {
  const { L, fmtDate, fmtNum } = useAdminLang();
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const seqRef = useRef(0);

  useEffect(() => {
    const seq = ++seqRef.current;
    setLoading(true);
    adminApi
      .getRatings({ page, limit: PAGE_SIZE })
      .then((res) => {
        if (seq !== seqRef.current) return;
        const list = Array.isArray(res?.ratings) ? res.ratings : [];
        setItems(list);
        const t = Number(res?.total ?? list.length) || 0;
        setTotal(t);
        setPages(pagesOf(res, t));
        setError('');
      })
      .catch((err) => {
        if (seq === seqRef.current) setError(err?.message || 'Could not load ratings');
      })
      .finally(() => {
        if (seq === seqRef.current) setLoading(false);
      });
  }, [page, reloadKey]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <p className="text-sm text-slate-600 dark:text-slate-300 flex-1">
          {L('Ratings customers give the app itself (not a booking).', 'تقييمات العملاء للتطبيق نفسه (وليست لحجز معيّن).')}
        </p>
        <button
          type="button"
          onClick={() => setReloadKey((k) => k + 1)}
          disabled={loading}
          aria-label={L('Refresh ratings', 'تحديث التقييمات')}
          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
        </button>
      </div>

      {error && <ErrorBanner title={L('Could not load ratings', 'تعذّر تحميل التقييمات')} message={error} onRetry={() => setReloadKey((k) => k + 1)} />}

      {loading && items.length === 0 && !error ? (
        <SkeletonList />
      ) : error && items.length === 0 ? null : items.length === 0 ? (
        <div className={`${card} py-14 px-6 text-center`}>
          <Star className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-3" aria-hidden="true" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">{L('No ratings yet', 'لا توجد تقييمات بعد')}</h3>
        </div>
      ) : (
        <>
          <ul className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${loading ? 'opacity-60' : ''}`}>
            {items.map((item) => {
              const r = Number(item.rating);
              const rating = Number.isFinite(r) && r >= 1 && r <= 5 ? Math.round(r) : null;
              const feedback = String(item.feedback ?? '').trim();
              return (
                <li key={item._id} className={`${card} p-4 flex flex-col gap-2`}>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-900 dark:text-white truncate min-w-0" dir="auto" title={item.name}>
                      {item.name || L('Customer', 'عميل')}
                    </h3>
                    <span className="text-xs text-slate-600 dark:text-slate-400 shrink-0">{item.createdAt ? fmtDate(item.createdAt) : L('No date', 'بدون تاريخ')}</span>
                  </div>
                  {rating != null ? (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex gap-0.5" role="img" aria-label={L(`${rating} out of 5 stars`, `${rating} من 5 نجوم`)}>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} aria-hidden="true" className={`w-4 h-4 ${i <= rating ? 'text-amber-500 fill-amber-400' : 'text-slate-300 dark:text-slate-600'}`} />
                        ))}
                      </span>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 tabular-nums">{fmtNum(rating)}/{fmtNum(5)}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-600 dark:text-slate-400">{L('Rating', 'التقييم')}: —</span>
                  )}
                  {feedback ? (
                    <p dir="auto" className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words leading-relaxed">{feedback}</p>
                  ) : (
                    <p className="text-sm italic text-slate-600 dark:text-slate-400">{L('No comment', 'بدون تعليق')}</p>
                  )}
                </li>
              );
            })}
          </ul>
          <Pager page={page} pages={pages} loading={loading} onPage={setPage} />
        </>
      )}
    </div>
  );
}

export default function FeedbackPage() {
  const { L } = useAdminLang();
  const [view, setView] = useState('inquiries');

  const views = [
    { key: 'inquiries', label: L('Contact messages', 'رسائل التواصل'), icon: MessageSquare },
    { key: 'ratings', label: L('App ratings', 'تقييمات التطبيق'), icon: Star },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white">{L('Messages & ratings', 'الرسائل والتقييمات')}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
          {L('Messages from the contact form and general app ratings.', 'رسائل نموذج التواصل والتقييمات العامة للتطبيق.')}
        </p>
      </div>

      <div role="tablist" aria-label={L('Section', 'القسم')} className={`${card} p-1.5 inline-flex gap-1 max-w-full overflow-x-auto`}>
        {views.map((v) => (
          <button
            key={v.key}
            type="button"
            role="tab"
            id={`fb-tab-${v.key}`}
            aria-selected={view === v.key}
            aria-controls={`fb-panel-${v.key}`}
            onClick={() => setView(v.key)}
            className={`${tabBase} ${view === v.key ? tabOn : tabOff}`}
          >
            <v.icon className="w-4 h-4" aria-hidden="true" />
            {v.label}
          </button>
        ))}
      </div>

      <section id={`fb-panel-${view}`} role="tabpanel" aria-labelledby={`fb-tab-${view}`}>
        {view === 'inquiries' ? <InquiriesPanel /> : <RatingsPanel />}
      </section>
    </div>
  );
}
