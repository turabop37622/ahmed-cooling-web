'use client';

// Admin panel language (English / Arabic) and the shared formatters.
// Every admin page uses the same helpers so dates, money and numbers look identical everywhere:
//   const { L, isAr, fmtDate, fmtDateTime, fmtTime, fmtMoney, fmtNum } = useAdminLang();
//   <h1>{L('Bookings', 'الحجوزات')}</h1>
// Dates are always shown in Saudi time (Asia/Riyadh), DD/MM/YYYY, 12-hour clock.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'adminLang';
const TIME_ZONE = 'Asia/Riyadh';

const AdminLangContext = createContext(null);

// "2026-10-03" (a date-only string) must not be shifted by the browser's time zone
const toDate = (value) => {
  if (value == null || value === '') return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d, 12)); // midday UTC is the same calendar day in Riyadh
  }
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

export function AdminLangProvider({ children }) {
  const [lang, setLang] = useState('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'ar' || saved === 'en') setLang(saved);
    } catch { /* storage blocked: stay English */ }
  }, []);

  const changeLang = useCallback((next) => {
    setLang(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* not persisted */ }
  }, []);

  const value = useMemo(() => {
    const isAr = lang === 'ar';
    const locale = isAr ? 'ar-SA' : 'en-GB';
    const num = new Intl.NumberFormat(locale);
    const L = (en, ar) => (isAr && ar != null ? ar : en);

    const fmtDate = (v) => {
      const d = toDate(v);
      return d ? d.toLocaleDateString(locale, { timeZone: TIME_ZONE, day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
    };
    const fmtTime = (v) => {
      const d = toDate(v);
      return d ? d.toLocaleTimeString(locale, { timeZone: TIME_ZONE, hour: 'numeric', minute: '2-digit', hour12: true }) : '—';
    };
    const fmtDateTime = (v) => {
      const d = toDate(v);
      return d ? `${fmtDate(d)} ${fmtTime(d)}` : '—';
    };
    // Missing amounts show "—", never an invented price
    const fmtMoney = (n) => {
      if (n == null || n === '' || !Number.isFinite(Number(n))) return '—';
      return isAr ? `${num.format(Number(n))} ريال` : `SAR ${num.format(Number(n))}`;
    };
    const fmtNum = (n) => (n == null || !Number.isFinite(Number(n)) ? '—' : num.format(Number(n)));

    return { lang, isAr, dir: isAr ? 'rtl' : 'ltr', setLang: changeLang, L, fmtDate, fmtTime, fmtDateTime, fmtMoney, fmtNum, locale, timeZone: TIME_ZONE };
  }, [lang, changeLang]);

  return <AdminLangContext.Provider value={value}>{children}</AdminLangContext.Provider>;
}

export function useAdminLang() {
  const ctx = useContext(AdminLangContext);
  if (!ctx) throw new Error('useAdminLang must be used inside AdminLangProvider');
  return ctx;
}
