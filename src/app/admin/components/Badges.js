'use client';

// Booking status / priority badges — the single source of status labels and colours for the admin panel.
//   <StatusBadge status={booking.status} />
//   <PriorityBadge priority={booking.priority} />          // renders nothing unless emergency
//   <PriorityBadge priority="normal" showNormal />          // shows a neutral "Normal" pill
//   statusLabel('on_the_way', L)                           // "On the way" / "في الطريق" for selects, toasts…

import { AlertTriangle } from 'lucide-react';
import { useAdminLang } from '../AdminI18n';

export const BOOKING_STATUSES = ['pending', 'confirmed', 'assigned', 'on_the_way', 'in_progress', 'completed', 'cancelled'];

export const STATUS_META = {
  pending: {
    en: 'Pending', ar: 'قيد الانتظار',
    cls: 'bg-amber-50 text-amber-800 ring-amber-600/25 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/30',
    dot: 'bg-amber-500',
  },
  confirmed: {
    en: 'Confirmed', ar: 'مؤكد',
    cls: 'bg-blue-50 text-blue-800 ring-blue-600/25 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/30',
    dot: 'bg-blue-500',
  },
  assigned: {
    en: 'Technician assigned', ar: 'تم تعيين فني',
    cls: 'bg-indigo-50 text-indigo-800 ring-indigo-600/25 dark:bg-indigo-500/15 dark:text-indigo-300 dark:ring-indigo-400/30',
    dot: 'bg-indigo-500',
  },
  on_the_way: {
    en: 'On the way', ar: 'في الطريق',
    cls: 'bg-cyan-50 text-cyan-800 ring-cyan-600/25 dark:bg-cyan-500/15 dark:text-cyan-300 dark:ring-cyan-400/30',
    dot: 'bg-cyan-500',
  },
  in_progress: {
    en: 'In progress', ar: 'قيد التنفيذ',
    cls: 'bg-violet-50 text-violet-800 ring-violet-600/25 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-400/30',
    dot: 'bg-violet-500',
  },
  completed: {
    en: 'Completed', ar: 'مكتمل',
    cls: 'bg-green-50 text-green-800 ring-green-600/25 dark:bg-green-500/15 dark:text-green-300 dark:ring-green-400/30',
    dot: 'bg-green-500',
  },
  cancelled: {
    en: 'Cancelled', ar: 'ملغي',
    cls: 'bg-red-50 text-red-800 ring-red-600/25 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-400/30',
    dot: 'bg-red-500',
  },
};

const UNKNOWN_CLS = 'bg-slate-100 text-slate-700 ring-slate-500/25 dark:bg-slate-700/40 dark:text-slate-200 dark:ring-slate-400/30';

export function statusLabel(status, L) {
  const meta = STATUS_META[status];
  if (!meta) return status ? String(status).replace(/_/g, ' ') : '—';
  return L ? L(meta.en, meta.ar) : meta.en;
}

const BASE = 'inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-full font-semibold ring-1 ring-inset';
const SIZE = { sm: 'px-2 py-0.5 text-[11px]', md: 'px-2.5 py-1 text-xs' };

export function StatusBadge({ status, size = 'md', className = '' }) {
  const { L } = useAdminLang();
  const meta = STATUS_META[status];
  return (
    <span className={`${BASE} ${SIZE[size] || SIZE.md} ${meta ? meta.cls : UNKNOWN_CLS} ${className}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta ? meta.dot : 'bg-slate-400'}`} aria-hidden="true" />
      <span className="truncate">{statusLabel(status, L)}</span>
    </span>
  );
}

export function PriorityBadge({ priority, isEmergency, showNormal = false, size = 'md', className = '' }) {
  const { L } = useAdminLang();
  const emergency = isEmergency === true || String(priority || '').toLowerCase() === 'emergency';
  if (!emergency) {
    if (!showNormal) return null;
    return (
      <span className={`${BASE} ${SIZE[size] || SIZE.md} ${UNKNOWN_CLS} ${className}`}>{L('Normal', 'عادي')}</span>
    );
  }
  return (
    <span className={`${BASE} ${SIZE[size] || SIZE.md} bg-red-600 text-white ring-red-700 dark:bg-red-600 dark:text-white dark:ring-red-400/50 ${className}`}>
      <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />
      {L('Emergency', 'طارئ')}
    </span>
  );
}

export default StatusBadge;
