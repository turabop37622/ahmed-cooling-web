'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { adminApi } from '../adminApi';
import { useAdminLang } from '../AdminI18n';
import { Drawer, StatusBadge } from '../components';
import {
  Users,
  Search,
  RefreshCw,
  Phone,
  Mail,
  ClipboardList,
  MessageCircle,
  X,
  ChevronRight,
  ChevronLeft,
  Shield,
  Wrench,
  AlertTriangle,
  BadgeCheck,
  CircleDashed,
} from 'lucide-react';

const PAGE_SIZE = 25;
const card = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm';
const tabBase = 'min-h-[44px] px-3.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600';

const ROLE_META = {
  customer: { en: 'Customer', ar: 'عميل', cls: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200', icon: null },
  technician: { en: 'Technician', ar: 'فني', cls: 'bg-cyan-50 text-cyan-800 dark:bg-cyan-500/15 dark:text-cyan-300', icon: Wrench },
  admin: { en: 'Admin', ar: 'مسؤول', cls: 'bg-indigo-50 text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-300', icon: Shield },
};
const PROVIDER = {
  local: ['Email', 'البريد'],
  phone: ['Phone', 'الجوال'],
  google: ['Google', 'Google'],
};

const getInitials = (name) => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

// wa.me needs international digits: 05xxxxxxxx -> 9665xxxxxxxx
const waDigits = (phone) => {
  let d = String(phone || '').replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('05') && d.length === 10) d = `966${d.slice(1)}`;
  else if (d.startsWith('5') && d.length === 9) d = `966${d}`;
  return d;
};

function RoleBadge({ role }) {
  const { L } = useAdminLang();
  const meta = ROLE_META[role] || ROLE_META.customer;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${meta.cls}`}>
      {Icon && <Icon className="w-3 h-3" aria-hidden="true" />}
      {L(meta.en, meta.ar)}
    </span>
  );
}

function VerifiedBadge({ verified }) {
  const { L } = useAdminLang();
  return verified ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
      <BadgeCheck className="w-3.5 h-3.5" aria-hidden="true" />
      {L('Verified', 'موثّق')}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
      <CircleDashed className="w-3.5 h-3.5" aria-hidden="true" />
      {L('Unverified', 'غير موثّق')}
    </span>
  );
}

function ProviderLabel({ provider }) {
  const { L } = useAdminLang();
  const p = PROVIDER[provider] || PROVIDER.local;
  return <span className="text-xs text-slate-600 dark:text-slate-400">{L(`via ${p[0]}`, `عبر ${p[1]}`)}</span>;
}

export default function AdminUsersPage() {
  const { L, isAr, fmtDate, fmtMoney, fmtNum } = useAdminLang();

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [counts, setCounts] = useState(null);
  const [page, setPage] = useState(1);
  const [role, setRole] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [selectedUser, setSelectedUser] = useState(null);
  const [userBookings, setUserBookings] = useState([]);
  const [bookingsTotal, setBookingsTotal] = useState(null);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingsError, setBookingsError] = useState('');
  const requestSeq = useRef(0);
  const drawerSeq = useRef(0);

  // Debounce the search box; a new search starts at page 1
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const seq = ++requestSeq.current;
    setLoading(true);
    adminApi
      .getUsers({ page, limit: PAGE_SIZE, q: query, role: role === 'all' ? undefined : role })
      .then((res) => {
        if (seq !== requestSeq.current) return;
        const list = res?.users ?? [];
        setUsers(Array.isArray(list) ? list : []);
        const t = Number(res?.total ?? list.length) || 0;
        setTotal(t);
        setPages(Number(res?.pages ?? res?.pagination?.pages) || Math.max(1, Math.ceil(t / PAGE_SIZE)));
        setCounts(res?.counts ?? null);
        setLoadError('');
      })
      .catch((err) => {
        if (seq !== requestSeq.current) return;
        setLoadError(err?.message || 'Could not load users');
      })
      .finally(() => {
        if (seq === requestSeq.current) setLoading(false);
      });
  }, [page, role, query, reloadKey]);

  const retry = () => setReloadKey((k) => k + 1);

  const loadUserBookings = useCallback(async (u) => {
    const seq = ++drawerSeq.current;
    setLoadingBookings(true);
    setBookingsError('');
    try {
      const res = await adminApi.getUserBookings(u._id);
      if (seq !== drawerSeq.current) return;
      const list = res?.bookings ?? [];
      setUserBookings(Array.isArray(list) ? list : []);
      setBookingsTotal(res?.total ?? (Array.isArray(list) ? list.length : null));
    } catch (err) {
      if (seq !== drawerSeq.current) return;
      setUserBookings([]);
      setBookingsTotal(null);
      setBookingsError(err?.message || 'Could not load bookings');
    } finally {
      if (seq === drawerSeq.current) setLoadingBookings(false);
    }
  }, []);

  const openUser = (u) => {
    setSelectedUser(u);
    setUserBookings([]);
    setBookingsTotal(null);
    loadUserBookings(u);
  };

  const closeUser = () => {
    drawerSeq.current++;
    setSelectedUser(null);
  };

  const getWhatsAppUrl = (phone, name) => {
    const digits = waDigits(phone);
    if (!digits) return null;
    const first = String(name || '').trim();
    const text = encodeURIComponent(
      first
        ? `مرحباً ${first}، معكم ورشة أحمد للتبريد. كيف يمكننا مساعدتك؟`
        : 'مرحباً، معكم ورشة أحمد للتبريد. كيف يمكننا مساعدتك؟'
    );
    return `https://wa.me/${digits}?text=${text}`;
  };

  const tabs = [
    { key: 'all', label: L('All', 'الكل'), count: counts?.all },
    { key: 'customer', label: L('Customers', 'العملاء'), count: counts?.customer },
    { key: 'technician', label: L('Technicians', 'الفنيون'), count: counts?.technician },
    { key: 'admin', label: L('Admins', 'المسؤولون'), count: counts?.admin },
  ];

  const bookingServiceName = (b) => {
    const svc = b.service && typeof b.service === 'object' ? b.service : {};
    const en = b.serviceDetails?.name || svc.name || null;
    const ar = b.serviceDetails?.nameAr || svc.nameAr || svc.name_ar || null;
    return isAr ? ar || en : en || ar;
  };
  const bookingAmount = (b) => b.finalCost ?? b.totalAmount ?? null;

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white">{L('Users', 'المستخدمون')}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            {L('Customers, technicians and admins with their contact details and bookings.', 'العملاء والفنيون والمسؤولون مع بيانات التواصل والحجوزات.')}
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

      {/* Filters */}
      <div className={`${card} p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3`}>
        <div role="tablist" aria-label={L('Role', 'الدور')} className="flex items-center gap-1.5 overflow-x-auto">
          {tabs.map((t) => {
            const on = role === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => {
                  setRole(t.key);
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
        <div className="relative lg:w-96">
          <label htmlFor="users-search" className="sr-only">{L('Search users', 'البحث عن مستخدم')}</label>
          <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
          <input
            id="users-search"
            type="search"
            dir="auto"
            placeholder={L('Search by name, email or phone…', 'ابحث بالاسم أو البريد أو الجوال…')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full min-h-[44px] ps-10 pe-10 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              aria-label={L('Clear search', 'مسح البحث')}
              className="absolute end-0 top-0 h-full min-w-[44px] flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {loadError && (
        <div role="alert" className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-4 text-red-800 dark:text-red-200">
          <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden="true" />
          <div className="flex-1 text-sm">
            <p className="font-semibold">{L('Could not load users', 'تعذّر تحميل المستخدمين')}</p>
            <p>{loadError}</p>
          </div>
          <button type="button" onClick={retry} className="min-h-[44px] px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold">
            {L('Retry', 'إعادة المحاولة')}
          </button>
        </div>
      )}

      {loading && users.length === 0 && !loadError ? (
        <div className={`${card} divide-y divide-slate-100 dark:divide-slate-800`} aria-busy="true" aria-label={L('Loading users', 'جارٍ تحميل المستخدمين')}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-4 flex items-center gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      ) : loadError && users.length === 0 ? null : users.length === 0 ? (
        <div className={`${card} py-14 px-6 text-center`}>
          <Users className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-3" aria-hidden="true" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {query ? L('No users match this search', 'لا يوجد مستخدمون مطابقون') : L('No users yet', 'لا يوجد مستخدمون بعد')}
          </h2>
          {query && (
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{L('Check the spelling or try the phone number.', 'تحقق من الإملاء أو جرّب رقم الجوال.')}</p>
          )}
        </div>
      ) : (
        <div className={`${card} overflow-hidden ${loading ? 'opacity-60' : ''}`} aria-busy={loading || undefined}>
          {/* Phones: card list */}
          <ul className="lg:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {users.map((u) => {
              const wa = u.phone ? getWhatsAppUrl(u.phone, u.fullName) : null;
              return (
                <li key={u._id} className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200 font-semibold flex items-center justify-center shrink-0" aria-hidden="true">
                      {getInitials(u.fullName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-900 dark:text-white truncate" dir="auto">{u.fullName || L('No name', 'بدون اسم')}</div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <RoleBadge role={u.role} />
                        <VerifiedBadge verified={u.isVerified} />
                        <ProviderLabel provider={u.authProvider} />
                      </div>
                    </div>
                  </div>
                  <div className="text-sm space-y-1">
                    {u.phone ? (
                      <a href={`tel:${u.phone}`} className="inline-flex items-center gap-2 min-h-[44px] text-blue-700 dark:text-blue-300 hover:underline" dir="ltr">
                        <Phone className="w-4 h-4 shrink-0" aria-hidden="true" />
                        {u.phone}
                      </a>
                    ) : (
                      <p className="text-slate-600 dark:text-slate-400">{L('No phone', 'بدون جوال')}</p>
                    )}
                    {u.email && (
                      <p className="flex items-center gap-2 text-slate-700 dark:text-slate-300 min-w-0">
                        <Mail className="w-4 h-4 shrink-0 text-slate-500" aria-hidden="true" />
                        <span className="truncate" dir="ltr">{u.email}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      {L('Joined', 'انضم')} {fmtDate(u.createdAt)} · {fmtNum(u.bookingsCount)} {L('bookings', 'حجز')}
                    </span>
                    <div className="flex items-center gap-2">
                      {wa && (
                        <a
                          href={wa}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={L(`WhatsApp ${u.fullName || ''}`, `واتساب ${u.fullName || ''}`)}
                          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 hover:bg-emerald-100"
                        >
                          <MessageCircle className="w-5 h-5" aria-hidden="true" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => openUser(u)}
                        className="min-h-[44px] px-3 inline-flex items-center gap-1 rounded-xl border border-slate-300 dark:border-slate-600 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        {L('Details', 'التفاصيل')}
                        <ChevronRight className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Tablet / desktop: table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-start text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <th scope="col" className="py-3 px-3 text-start">{L('User', 'المستخدم')}</th>
                  <th scope="col" className="py-3 px-3 text-start">{L('Contact', 'التواصل')}</th>
                  <th scope="col" className="py-3 px-3 text-start">{L('Role', 'الدور')}</th>
                  <th scope="col" className="py-3 px-3 text-start">{L('Status', 'الحالة')}</th>
                  <th scope="col" className="py-3 px-3 text-end">{L('Bookings', 'الحجوزات')}</th>
                  <th scope="col" className="py-3 px-3 text-start">{L('Joined', 'تاريخ التسجيل')}</th>
                  <th scope="col" className="py-3 px-3 text-end"><span className="sr-only">{L('Actions', 'إجراءات')}</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => {
                  const wa = u.phone ? getWhatsAppUrl(u.phone, u.fullName) : null;
                  return (
                    <tr key={u._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200 font-semibold flex items-center justify-center shrink-0" aria-hidden="true">
                            {getInitials(u.fullName)}
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[12rem]" dir="auto" title={u.fullName}>
                            {u.fullName || L('No name', 'بدون اسم')}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          {u.phone ? (
                            <a href={`tel:${u.phone}`} className="inline-flex items-center pointer-coarse:min-h-11 text-blue-700 dark:text-blue-300 hover:underline" dir="ltr">{u.phone}</a>
                          ) : (
                            <span className="block text-slate-600 dark:text-slate-400">{L('No phone', 'بدون جوال')}</span>
                          )}
                          {u.email && (
                            <span className="block text-xs text-slate-600 dark:text-slate-400 truncate max-w-[11rem]" dir="ltr" title={u.email}>{u.email}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3"><RoleBadge role={u.role} /></td>
                      <td className="py-3 px-3">
                        <div className="flex flex-col items-start gap-1">
                          <VerifiedBadge verified={u.isVerified} />
                          <ProviderLabel provider={u.authProvider} />
                        </div>
                      </td>
                      <td className="py-3 px-3 text-end tabular-nums font-semibold text-slate-900 dark:text-white">{fmtNum(u.bookingsCount)}</td>
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">{fmtDate(u.createdAt)}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-end gap-2">
                          {wa && (
                            <a
                              href={wa}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={L(`WhatsApp ${u.fullName || ''}`, `واتساب ${u.fullName || ''}`)}
                              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 hover:bg-emerald-100"
                            >
                              <MessageCircle className="w-5 h-5" aria-hidden="true" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => openUser(u)}
                            className="min-h-[44px] px-3 inline-flex items-center gap-1 rounded-xl border border-slate-300 dark:border-slate-600 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            {L('Details', 'التفاصيل')}
                            <ChevronRight className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paging */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 border-t border-slate-200 dark:border-slate-800 text-sm text-slate-700 dark:text-slate-300">
            <span>
              {L(`${fmtNum(from)}–${fmtNum(to)} of ${fmtNum(total)}`, `${fmtNum(from)}–${fmtNum(to)} من ${fmtNum(total)}`)}
            </span>
            <div className="flex items-center gap-2">
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
            </div>
          </div>
        </div>
      )}

      {/* User drawer */}
      <Drawer
        open={!!selectedUser}
        onClose={closeUser}
        title={<span dir="auto">{selectedUser?.fullName || L('No name', 'بدون اسم')}</span>}
        subtitle={selectedUser ? `${L('Joined', 'انضم')} ${fmtDate(selectedUser.createdAt)}` : null}
      >
        {selectedUser && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-1.5">
              <RoleBadge role={selectedUser.role} />
              <VerifiedBadge verified={selectedUser.isVerified} />
              <ProviderLabel provider={selectedUser.authProvider} />
            </div>

            <section aria-labelledby="user-contact-h" className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 space-y-3">
              <h3 id="user-contact-h" className="text-sm font-semibold text-slate-800 dark:text-slate-200">{L('Contact', 'التواصل')}</h3>
              {selectedUser.phone ? (
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`tel:${selectedUser.phone}`}
                    className="min-h-[44px] px-3 inline-flex items-center gap-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-sm font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-slate-800"
                  >
                    <Phone className="w-4 h-4" aria-hidden="true" />
                    <span dir="ltr">{selectedUser.phone}</span>
                  </a>
                  {getWhatsAppUrl(selectedUser.phone, selectedUser.fullName) && (
                    <a
                      href={getWhatsAppUrl(selectedUser.phone, selectedUser.fullName)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[44px] px-3 inline-flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold"
                    >
                      <MessageCircle className="w-4 h-4" aria-hidden="true" />
                      WhatsApp
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-600 dark:text-slate-400">{L('No phone number', 'لا يوجد رقم جوال')}</p>
              )}
              {selectedUser.email ? (
                <a
                  href={`mailto:${selectedUser.email}`}
                  className="min-h-[44px] max-w-full px-3 inline-flex items-center gap-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-sm font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-slate-800"
                >
                  <Mail className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="truncate" dir="ltr">{selectedUser.email}</span>
                </a>
              ) : (
                <p className="text-sm text-slate-600 dark:text-slate-400">{L('No email address', 'لا يوجد بريد إلكتروني')}</p>
              )}
            </section>

            <section aria-labelledby="user-bookings-h">
              <div className="flex items-center justify-between mb-3">
                <h3 id="user-bookings-h" className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  {L('Booking history', 'سجل الحجوزات')}
                </h3>
                {!loadingBookings && !bookingsError && bookingsTotal != null && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {fmtNum(bookingsTotal)} {L('bookings', 'حجز')}
                  </span>
                )}
              </div>

              {loadingBookings ? (
                <div className="space-y-3" aria-busy="true">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                  ))}
                </div>
              ) : bookingsError ? (
                <div role="alert" className="rounded-2xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-4 text-sm text-red-800 dark:text-red-200 space-y-2">
                  <p>{bookingsError}</p>
                  <button type="button" onClick={() => loadUserBookings(selectedUser)} className="min-h-[44px] px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold">
                    {L('Retry', 'إعادة المحاولة')}
                  </button>
                </div>
              ) : userBookings.length === 0 ? (
                <p className="py-8 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-sm text-slate-600 dark:text-slate-400">
                  {L('No bookings yet.', 'لا توجد حجوزات بعد.')}
                </p>
              ) : (
                <ul className="space-y-3">
                  {userBookings.map((b) => (
                    <li key={b._id} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 truncate" dir="ltr">
                          {b.orderNumber || b.bookingId || b._id}
                        </span>
                        <StatusBadge status={b.status} />
                      </div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white mt-1.5" dir="auto">
                        {bookingServiceName(b) || '—'}
                      </div>
                      <div className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                        <span>{b.date || b.scheduledDate ? fmtDate(b.date || b.scheduledDate) : L('No date', 'بدون تاريخ')}</span>
                        <span className="font-semibold tabular-nums">{fmtMoney(bookingAmount(b))}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </Drawer>
    </div>
  );
}
