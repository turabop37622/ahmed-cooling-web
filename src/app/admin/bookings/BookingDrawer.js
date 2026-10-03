'use client';

// Booking detail drawer: full booking (GET /admin/bookings/:id), status actions, technician assignment,
// payment, cancel / complete / delete confirmations. Every mutation is ref-locked, sends expectedStatus
// and handles 409 (someone else changed the booking) by re-fetching.

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Phone, Mail, MapPin, ExternalLink, MessageCircle, User, Wrench, Calendar, AlertTriangle,
  CreditCard, History, ChevronDown, Trash2, Loader2, Ban, Check, RefreshCw, FileText, StickyNote,
} from 'lucide-react';
import { useAdminLang } from '../AdminI18n';
import { useAdminToast } from '../components/AdminToast';
import Drawer from '../components/Drawer';
import ConfirmDialog from '../components/ConfirmDialog';
import { StatusBadge, PriorityBadge } from '../components/Badges';
import {
  getBooking, updateBookingStatus, assignTechnician, updatePayment, deleteBooking, getTechnicians,
} from '../adminApi';
import {
  nextActions, canCancel, canDelete, canAssign, normalizeStatus, statusLabel, serviceInfo, serviceName,
  categoryLabel, customerNameOf, phoneOf, orderRef, coordsOf, mapLink, whatsappLink, telLink,
  bookingDate, bookingTime, fmtSlot, unwrapBooking,
} from './bookingUtils';

const PAYMENT_LABELS = {
  pending: { en: 'Not paid', ar: 'غير مدفوع' },
  paid: { en: 'Paid', ar: 'مدفوع' },
  partially_paid: { en: 'Partially paid', ar: 'مدفوع جزئياً' },
};
const PAYMENT_METHODS = {
  cash: { en: 'Cash', ar: 'نقداً' },
  card: { en: 'Card', ar: 'بطاقة' },
  bank_transfer: { en: 'Bank transfer', ar: 'تحويل بنكي' },
  mobile_payment: { en: 'Mobile payment', ar: 'دفع عبر الجوال' },
};

const BTN = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60';
const TONES = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
  success: 'bg-green-700 text-white hover:bg-green-800',
  danger: 'border border-red-300 bg-white text-red-700 hover:bg-red-50 dark:border-red-500/40 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-500/10',
};

function Section({ icon: Icon, title, children, action }) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
          {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
          {title}
        </h3>
        {action}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 text-sm dark:border-slate-800 dark:bg-slate-800/40">{children}</div>
    </section>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1">
      <span className="shrink-0 text-slate-600 dark:text-slate-400">{label}</span>
      <span className="min-w-0 text-end font-medium text-slate-900 dark:text-slate-100">{children}</span>
    </div>
  );
}

export default function BookingDrawer({ bookingId, initial, servicesById, refreshKey, onClose, onChanged }) {
  const { L, isAr, fmtDate, fmtDateTime, fmtMoney } = useAdminLang();
  const toast = useAdminToast();
  const [booking, setBooking] = useState(initial || null);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(null); // key of the running action
  const lock = useRef(false);
  const [dialog, setDialog] = useState(null); // 'cancel' | 'complete' | 'delete'
  const [assignOpen, setAssignOpen] = useState(false);
  const [techs, setTechs] = useState(null);
  const [techError, setTechError] = useState('');
  const [payMethod, setPayMethod] = useState('');

  const load = useCallback(async ({ silent } = {}) => {
    if (!bookingId) return null;
    if (!silent) setLoading(true);
    try {
      const res = await getBooking(bookingId);
      const b = unwrapBooking(res);
      if (b) setBooking(b);
      setLoadError('');
      return b;
    } catch (err) {
      if (err?.status === 404) {
        setLoadError(L('This booking no longer exists (it may have been deleted).', 'هذا الحجز لم يعد موجوداً (ربما تم حذفه).'));
      } else {
        setLoadError(err?.message || L('Could not load the booking.', 'تعذر تحميل الحجز.'));
      }
      return null;
    } finally {
      if (!silent) setLoading(false);
    }
  }, [bookingId, L]);

  // Fresh data when opened, and every time the page's auto-refresh ticks
  useEffect(() => {
    setBooking((prev) => (prev && prev._id === bookingId ? prev : initial || null));
    load({ silent: refreshKey > 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, refreshKey]);

  useEffect(() => { setAssignOpen(false); setDialog(null); }, [bookingId]);

  const loadTechs = useCallback(async () => {
    setTechError('');
    try {
      const res = await getTechnicians();
      setTechs(Array.isArray(res?.technicians) ? res.technicians : []);
    } catch (err) {
      setTechError(err?.message || L('Could not load technicians.', 'تعذر تحميل الفنيين.'));
    }
  }, [L]);

  const techRef = useRef(null);
  useEffect(() => {
    if (!assignOpen) return;
    loadTechs();
    techRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [assignOpen, loadTechs]);

  const status = normalizeStatus(booking?.status);

  // Runs one mutation: ref lock, success toast, 409 → refetch, server message on error.
  // Returns true on success, false when it failed (ConfirmDialog stays open on false).
  const run = async (key, fn, successMsg) => {
    if (lock.current) return false;
    lock.current = true;
    setBusy(key);
    try {
      await fn();
      toast.success(successMsg);
      const fresh = await load({ silent: true });
      onChanged?.(fresh);
      return true;
    } catch (err) {
      if (err?.status === 409) {
        toast.error(L('This booking was just changed — refreshed', 'تم تعديل هذا الحجز للتو — تم التحديث'));
        const fresh = await load({ silent: true });
        onChanged?.(fresh);
        return true; // nothing to retry in the dialog: the booking moved on
      }
      toast.error(err?.message || L('Something went wrong. Please try again.', 'حدث خطأ. يرجى المحاولة مرة أخرى.'));
      return false;
    } finally {
      lock.current = false;
      setBusy(null);
    }
  };

  const changeStatus = (to, extra = {}) =>
    run(`status:${to}`, () => updateBookingStatus(booking._id, to, { expectedStatus: status, ...extra }),
      L(`Status changed to “${statusLabel(to, (en) => en)}”`, `تم تغيير الحالة إلى «${statusLabel(to, (en, ar) => ar)}»`));

  const doAssign = async (tech) => {
    const ok = await run(`assign:${tech._id}`, () => assignTechnician(booking._id, tech._id),
      L(`Assigned to ${tech.name}`, `تم التعيين إلى ${tech.name}`));
    if (ok) setAssignOpen(false);
  };

  const markPaid = () =>
    run('pay', () => updatePayment(booking._id, { paymentStatus: 'paid', ...(payMethod ? { paymentMethod: payMethod } : {}) }),
      L('Payment marked as paid', 'تم تسجيل الدفع'));

  const doDelete = async () => {
    if (lock.current) return false;
    lock.current = true;
    setBusy('delete');
    try {
      await deleteBooking(booking._id);
      toast.success(L('Booking deleted', 'تم حذف الحجز'));
      onChanged?.(null, { removed: true });
      return true;
    } catch (err) {
      if (err?.status === 404) {
        // Already gone (deleted from another tab): same end result
        toast.info(L('This booking was already deleted', 'تم حذف هذا الحجز مسبقاً'));
        onChanged?.(null, { removed: true });
        return true;
      }
      if (err?.status === 409) {
        toast.error(err?.message || L('Cancel the booking first', 'يجب إلغاء الحجز أولاً'));
        const fresh = await load({ silent: true });
        onChanged?.(fresh);
        return true;
      }
      toast.error(err?.message || L('Could not delete the booking.', 'تعذر حذف الحجز.'));
      return false;
    } finally {
      lock.current = false;
      setBusy(null);
    }
  };

  const info = serviceInfo(booking, servicesById);
  const name = customerNameOf(booking);
  const phone = phoneOf(booking);
  const coords = coordsOf(booking);
  const map = mapLink(booking);
  const date = bookingDate(booking);
  const time = bookingTime(booking);
  const tech = booking?.technician && typeof booking.technician === 'object' ? booking.technician : null;
  const visitIncluded = info.isPackage || booking?.visitCharges === 0;
  const history = Array.isArray(booking?.statusHistory)
    ? [...booking.statusHistory].sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0))
    : [];
  const actions = booking ? nextActions(status) : [];
  const anyBusy = busy !== null;
  const waText = L(
    `Hello ${name || ''}, this is Ahmed Cooling Workshop about your booking ${orderRef(booking)}.`,
    `مرحباً ${name || ''}، معك ورشة أحمد للتبريد بخصوص حجزك ${orderRef(booking)}.`,
  );

  const footer = booking && (actions.length > 0 || canCancel(status)) ? (
    <div className="flex flex-wrap items-center gap-2">
      {actions.map((a) => {
        if (a.kind === 'assign') {
          return (
            <button key="assign" type="button" disabled={anyBusy} onClick={() => setAssignOpen(true)} className={`${BTN} ${TONES[a.tone]}`}>
              <Wrench className="h-4 w-4" aria-hidden="true" />{L(a.en, a.ar)}
            </button>
          );
        }
        const key = `status:${a.to}`;
        return (
          <button
            key={key}
            type="button"
            disabled={anyBusy}
            aria-busy={busy === key || undefined}
            onClick={() => (a.confirm ? setDialog('complete') : changeStatus(a.to))}
            className={`${BTN} ${TONES[a.tone] || TONES.secondary}`}
          >
            {busy === key ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
            {L(a.en, a.ar)}
          </button>
        );
      })}
      {canCancel(status) && (
        <button type="button" disabled={anyBusy} onClick={() => setDialog('cancel')} className={`${BTN} ${TONES.danger} ms-auto`}>
          <Ban className="h-4 w-4" aria-hidden="true" />{L('Cancel booking', 'إلغاء الحجز')}
        </button>
      )}
    </div>
  ) : null;

  return (
    <>
      <Drawer
        open={!!bookingId}
        onClose={onClose}
        canClose={!anyBusy}
        width="sm:max-w-xl"
        title={L('Booking details', 'تفاصيل الحجز')}
        subtitle={booking ? (
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-mono">{orderRef(booking)}</span>
            {booking.bookingId && booking.orderNumber && <span className="font-mono text-xs">{booking.bookingId}</span>}
          </span>
        ) : null}
        headerActions={(
          <button
            type="button"
            onClick={() => load()}
            disabled={loading || anyBusy}
            aria-label={L('Reload booking', 'إعادة تحميل الحجز')}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          </button>
        )}
        footer={footer}
      >
        {!booking && loading && (
          <div className="flex items-center justify-center py-16 text-slate-600 dark:text-slate-300">
            <Loader2 className="me-2 h-5 w-5 animate-spin" aria-hidden="true" />{L('Loading…', 'جارٍ التحميل…')}
          </div>
        )}
        {loadError && (
          <div role="alert" className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-200">
            <span>{loadError}</span>
            <button type="button" onClick={() => load()} className="shrink-0 font-semibold underline">{L('Retry', 'إعادة المحاولة')}</button>
          </div>
        )}

        {booking && (
          <div className="space-y-5">
            {/* Status + service */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={status} />
                <PriorityBadge priority={booking.priority} />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900 dark:text-white" dir="auto">{serviceName(info, L)}</p>
                {info.nameEn && info.nameAr && (
                  <p className="text-sm text-slate-600 dark:text-slate-400" dir="auto">{isAr ? info.nameEn : info.nameAr}</p>
                )}
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                  {categoryLabel(info.category, L) && (
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">{categoryLabel(info.category, L)}</span>
                  )}
                  {visitIncluded && (
                    <span className="rounded-md bg-teal-50 px-2 py-0.5 font-semibold text-teal-800 dark:bg-teal-500/15 dark:text-teal-200">
                      {L('Package · visit fee included', 'باقة · رسوم الزيارة مشمولة')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Schedule */}
            <Section icon={Calendar} title={L('Appointment', 'الموعد')}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="block text-xs text-slate-600 dark:text-slate-400">{L('Date', 'التاريخ')}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{date ? fmtDate(date) : L('No date', 'بدون تاريخ')}</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-600 dark:text-slate-400">{L('Time', 'الوقت')}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{time ? fmtSlot(time, isAr) : L('No time', 'بدون وقت')}</span>
                </div>
              </div>
              {booking.rescheduledAt && (
                <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-200">
                  {booking.rescheduledBy === 'admin'
                    ? L(`Rescheduled by admin on ${fmtDateTime(booking.rescheduledAt)}`, `أعيدت الجدولة من الإدارة في ${fmtDateTime(booking.rescheduledAt)}`)
                    : booking.rescheduledBy === 'customer'
                      ? L(`Rescheduled by customer on ${fmtDateTime(booking.rescheduledAt)}`, `أعاد العميل الجدولة في ${fmtDateTime(booking.rescheduledAt)}`)
                      : L(`Rescheduled on ${fmtDateTime(booking.rescheduledAt)}`, `أعيدت الجدولة في ${fmtDateTime(booking.rescheduledAt)}`)}
                  {(booking.previousSchedule?.date || booking.previousSchedule?.time) && (
                    <span className="mt-0.5 block font-medium">
                      {L('Was:', 'كان:')}{' '}
                      {booking.previousSchedule.date ? fmtDate(booking.previousSchedule.date) : L('No date', 'بدون تاريخ')}{' '}
                      {booking.previousSchedule.time ? fmtSlot(booking.previousSchedule.time, isAr) : ''}
                    </span>
                  )}
                </div>
              )}
            </Section>

            {/* Customer */}
            <Section icon={User} title={L('Customer', 'العميل')}>
              <p className="font-semibold text-slate-900 dark:text-white" dir="auto">{name || L('No name', 'بدون اسم')}</p>
              {!booking.user && <p className="text-xs text-slate-600 dark:text-slate-400">{L('Guest booking (no account)', 'حجز ضيف (بدون حساب)')}</p>}
              <div className="mt-2 flex flex-wrap gap-2">
                {phone && (
                  <a href={telLink(phone)} className={`${BTN} ${TONES.secondary} font-mono`} dir="ltr">
                    <Phone className="h-4 w-4" aria-hidden="true" />{phone}
                  </a>
                )}
                {phone && (
                  <a href={whatsappLink(phone, waText)} target="_blank" rel="noopener noreferrer" className={`${BTN} border border-green-300 bg-green-50 text-green-800 hover:bg-green-100 dark:border-green-500/40 dark:bg-green-500/10 dark:text-green-200`}>
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />WhatsApp
                  </a>
                )}
              </div>
              {booking.email && (
                <a href={`mailto:${booking.email}`} className="mt-2 flex items-center gap-2 break-all text-blue-700 hover:underline dark:text-blue-300">
                  <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />{booking.email}
                </a>
              )}
            </Section>

            {/* Address */}
            <Section icon={MapPin} title={L('Address', 'العنوان')}>
              <p className="whitespace-pre-line break-words leading-relaxed text-slate-900 dark:text-slate-100" dir="auto">
                {booking.address || L('No address', 'بدون عنوان')}
              </p>
              {booking.city && <p className="mt-1 text-xs text-slate-600 dark:text-slate-400" dir="auto">{booking.city}</p>}
              {map && (
                <a href={map} target="_blank" rel="noopener noreferrer" className={`${BTN} ${TONES.secondary} mt-2`}>
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  {coords ? L('Open pinned location in Maps', 'فتح الموقع على الخريطة') : L('Search address in Maps', 'البحث عن العنوان في الخريطة')}
                </a>
              )}
            </Section>

            {/* Notes + problem description */}
            {(booking.comments || booking.notes || booking.problemDescription) && (
              <Section icon={StickyNote} title={L('Customer notes', 'ملاحظات العميل')}>
                {(booking.comments || booking.notes) && (
                  <div>
                    <span className="block text-xs font-semibold text-slate-600 dark:text-slate-400">{L('Notes', 'ملاحظات')}</span>
                    <p className="whitespace-pre-line break-words text-slate-900 dark:text-slate-100" dir="auto">{booking.comments || booking.notes}</p>
                  </div>
                )}
                {booking.problemDescription && (
                  <div className={booking.comments || booking.notes ? 'mt-3 border-t border-slate-200 pt-3 dark:border-slate-700' : ''}>
                    <span className="block text-xs font-semibold text-slate-600 dark:text-slate-400">{L('Problem description', 'وصف المشكلة')}</span>
                    <p className="whitespace-pre-line break-words text-slate-900 dark:text-slate-100" dir="auto">{booking.problemDescription}</p>
                  </div>
                )}
              </Section>
            )}

            {status === 'cancelled' && (
              <Section icon={Ban} title={L('Cancellation', 'الإلغاء')}>
                <Row label={L('Reason', 'السبب')}><span dir="auto">{booking.cancellationReason || '—'}</span></Row>
                {booking.cancelledAt && <Row label={L('Cancelled on', 'تاريخ الإلغاء')}>{fmtDateTime(booking.cancelledAt)}</Row>}
              </Section>
            )}

            {/* Technician */}
            <div ref={techRef} className="scroll-mt-4">
            <Section
              icon={Wrench}
              title={L('Technician', 'الفني')}
              action={canAssign(status) && !assignOpen ? (
                <button type="button" disabled={anyBusy} onClick={() => setAssignOpen(true)} className="min-h-11 rounded-lg px-2 text-sm font-semibold text-blue-700 hover:underline disabled:opacity-50 dark:text-blue-300">
                  {tech ? L('Reassign', 'إعادة التعيين') : L('Assign', 'تعيين')}
                </button>
              ) : null}
            >
              {tech ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900 dark:text-white" dir="auto">{tech.fullName || tech.name || '—'}</span>
                  {tech.phone && <a href={telLink(tech.phone)} className="font-mono text-blue-700 hover:underline dark:text-blue-300" dir="ltr">{tech.phone}</a>}
                </div>
              ) : (
                <p className="text-slate-600 dark:text-slate-400">{L('No technician assigned', 'لم يتم تعيين فني')}</p>
              )}
              {assignOpen && (
                <div className="mt-3 space-y-2 border-t border-slate-200 pt-3 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{L('Choose a technician', 'اختر فنياً')}</span>
                    <button type="button" onClick={() => setAssignOpen(false)} disabled={anyBusy} className="min-h-11 px-2 text-sm font-semibold text-slate-700 hover:underline dark:text-slate-300">{L('Close', 'إغلاق')}</button>
                  </div>
                  {techError && (
                    <p role="alert" className="text-sm text-red-700 dark:text-red-300">
                      {techError} <button type="button" onClick={loadTechs} className="font-semibold underline">{L('Retry', 'إعادة المحاولة')}</button>
                    </p>
                  )}
                  {!techs && !techError && <p className="text-slate-600 dark:text-slate-400">{L('Loading technicians…', 'جارٍ تحميل الفنيين…')}</p>}
                  {techs && techs.length === 0 && <p className="text-slate-600 dark:text-slate-400">{L('No technicians yet.', 'لا يوجد فنيون بعد.')}</p>}
                  {techs && techs.map((t) => {
                    const available = t.availability !== false && t.active !== false;
                    const current = tech && String(tech._id) === String(t._id);
                    const key = `assign:${t._id}`;
                    return (
                      <button
                        key={t._id}
                        type="button"
                        disabled={!available || anyBusy || current}
                        onClick={() => doAssign(t)}
                        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-start hover:border-blue-400 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-slate-200 disabled:hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:disabled:hover:bg-slate-900"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-slate-900 dark:text-white" dir="auto">{t.name || '—'}</span>
                          <span className="block text-xs text-slate-600 dark:text-slate-400">
                            {t.phone && <span dir="ltr" className="font-mono">{t.phone} · </span>}
                            {L(`${t.activeJobs ?? 0} active jobs`, `${t.activeJobs ?? 0} مهام نشطة`)}
                          </span>
                        </span>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${current ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200' : available ? 'bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-200' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}>
                          {busy === key ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                            : current ? L('Current', 'الحالي')
                              : available ? L('Available', 'متاح')
                                : t.active === false ? L('Inactive', 'غير نشط') : L('Unavailable', 'غير متاح')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </Section>
            </div>

            {/* Price + payment */}
            <Section icon={CreditCard} title={L('Price & payment', 'السعر والدفع')}>
              <Row label={L('Service', 'الخدمة')}>{fmtMoney(booking.servicePrice)}</Row>
              <Row label={L('Visit fee', 'رسوم الزيارة')}>
                {visitIncluded ? L('Included', 'مشمولة') : fmtMoney(booking.visitCharges)}
              </Row>
              {booking.finalCost != null && <Row label={L('Final cost', 'التكلفة النهائية')}>{fmtMoney(booking.finalCost)}</Row>}
              <div className="mt-1 flex items-center justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900 dark:border-slate-700 dark:text-white">
                <span>{L('Total', 'الإجمالي')}</span>
                <span>{fmtMoney(booking.totalAmount)}</span>
              </div>
              <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-700">
                <Row label={L('Payment', 'الدفع')}>
                  <span className={booking.paymentStatus === 'paid' ? 'text-green-700 dark:text-green-300' : 'text-amber-800 dark:text-amber-300'}>
                    {PAYMENT_LABELS[booking.paymentStatus] ? L(PAYMENT_LABELS[booking.paymentStatus].en, PAYMENT_LABELS[booking.paymentStatus].ar) : '—'}
                  </span>
                  {booking.paymentMethod && PAYMENT_METHODS[booking.paymentMethod] && (
                    <span className="text-slate-600 dark:text-slate-400"> · {L(PAYMENT_METHODS[booking.paymentMethod].en, PAYMENT_METHODS[booking.paymentMethod].ar)}</span>
                  )}
                </Row>
                {booking.paymentStatus !== 'paid' && status !== 'cancelled' && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <label className="sr-only" htmlFor="pay-method">{L('Payment method', 'طريقة الدفع')}</label>
                    <select
                      id="pay-method"
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value)}
                      disabled={anyBusy}
                      className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="">{L('Method (optional)', 'الطريقة (اختياري)')}</option>
                      {Object.entries(PAYMENT_METHODS).map(([k, v]) => <option key={k} value={k}>{L(v.en, v.ar)}</option>)}
                    </select>
                    <button type="button" onClick={markPaid} disabled={anyBusy} className={`${BTN} ${TONES.secondary}`}>
                      {busy === 'pay' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CreditCard className="h-4 w-4" aria-hidden="true" />}
                      {L('Mark paid', 'تسجيل كمدفوع')}
                    </button>
                  </div>
                )}
              </div>
            </Section>

            {/* Status history */}
            <Section icon={History} title={L('Status history', 'سجل الحالات')}>
              {history.length === 0 ? (
                <p className="text-slate-600 dark:text-slate-400">{L('No history recorded', 'لا يوجد سجل')}</p>
              ) : (
                <ol className="relative space-y-3 border-s-2 border-slate-200 ps-4 dark:border-slate-700">
                  {history.map((h, i) => (
                    <li key={`${h.status}-${h.timestamp}-${i}`} className="relative">
                      <span className="absolute -start-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-slate-500 dark:border-slate-900" aria-hidden="true" />
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={normalizeStatus(h.status)} size="sm" />
                        <span className="text-xs text-slate-600 dark:text-slate-400">{h.timestamp ? fmtDateTime(h.timestamp) : '—'}</span>
                      </div>
                      {h.note && <p className="mt-0.5 break-words text-xs text-slate-700 dark:text-slate-300" dir="auto">{h.note}</p>}
                    </li>
                  ))}
                </ol>
              )}
              <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">
                {L('Created', 'أُنشئ')}: {booking.createdAt ? fmtDateTime(booking.createdAt) : '—'}
                {booking.platform ? ` · ${booking.platform}` : ''}
              </p>
            </Section>

            {/* More: destructive actions, visually separated */}
            <details className="group rounded-2xl border border-slate-200 dark:border-slate-800">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-3.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <span className="flex items-center gap-2"><FileText className="h-4 w-4" aria-hidden="true" />{L('More', 'المزيد')}</span>
                <ChevronDown className="h-4 w-4 transition group-open:rotate-180" aria-hidden="true" />
              </summary>
              <div className="border-t border-slate-200 p-3.5 dark:border-slate-800">
                {canDelete(status) ? (
                  <button type="button" disabled={anyBusy} onClick={() => setDialog('delete')} className={`${BTN} w-full bg-red-600 text-white hover:bg-red-700`}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />{L('Delete booking', 'حذف الحجز')}
                  </button>
                ) : (
                  <p className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    {L('Only pending or cancelled bookings can be deleted. Cancel it first.', 'يمكن حذف الحجوزات المعلقة أو الملغاة فقط. قم بإلغائه أولاً.')}
                  </p>
                )}
              </div>
            </details>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={dialog === 'cancel'}
        tone="danger"
        requireReason
        title={L('Cancel this booking?', 'إلغاء هذا الحجز؟')}
        message={L('The customer will be notified. This cannot be undone.', 'سيتم إبلاغ العميل. لا يمكن التراجع عن ذلك.')}
        reasonLabel={L('Cancellation reason', 'سبب الإلغاء')}
        confirmLabel={L('Cancel booking', 'إلغاء الحجز')}
        cancelLabel={L('Keep booking', 'إبقاء الحجز')}
        onConfirm={(reason) => changeStatus('cancelled', { reason })}
        onClose={() => setDialog(null)}
      />
      <ConfirmDialog
        open={dialog === 'complete'}
        tone="primary"
        title={L('Mark this job as completed?', 'تأكيد إنجاز هذه المهمة؟')}
        message={L('Completed bookings cannot change status again.', 'لا يمكن تغيير حالة الحجز المكتمل لاحقاً.')}
        confirmLabel={L('Mark completed', 'تم الإنجاز')}
        onConfirm={() => changeStatus('completed')}
        onClose={() => setDialog(null)}
      />
      <ConfirmDialog
        open={dialog === 'delete'}
        tone="danger"
        title={L('Delete this booking?', 'حذف هذا الحجز؟')}
        message={L(`Booking ${orderRef(booking)} will be removed from the list.`, `سيتم حذف الحجز ${orderRef(booking)} من القائمة.`)}
        confirmLabel={L('Delete booking', 'حذف الحجز')}
        onConfirm={doDelete}
        onClose={() => setDialog(null)}
      />
    </>
  );
}
