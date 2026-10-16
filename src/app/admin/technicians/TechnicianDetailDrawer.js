'use client';

// Technician detail (GET /admin/technicians/:id): contact, stats, commission balance + ledger with a running
// balance, "Record payment" (POST /admin/technicians/:id/settlements) and recent jobs.

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Phone, MessageCircle, Mail, Pencil, RefreshCw, Loader2, HandCoins, Receipt, ClipboardList, Wallet, MapPin, Wrench, AlertCircle,
} from 'lucide-react';
import { useAdminLang } from '../AdminI18n';
import { useAdminToast } from '../components/AdminToast';
import Drawer from '../components/Drawer';
import ConfirmDialog from '../components/ConfirmDialog';
import { StatusBadge } from '../components/Badges';
import { getTechnician, addSettlement } from '../adminApi';
import { whatsappLink, telLink, normalizeStatus, orderRef, bookingDate } from '../bookings/bookingUtils';
import { cityLabel, specialtyLabel, methodLabel, SETTLEMENT_METHODS, parseAmount } from './techUtils';

const round2 = (n) => Math.round(Number(n) * 100) / 100;
const num = (v) => (v == null || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));

// The detail response may nest things a little differently; read defensively
function unwrap(res) {
  const t = res?.technician || res?.data || (res?._id ? res : null);
  if (!t) return null;
  return {
    ...t,
    name: t.name || t.fullName || null,
    stats: res?.stats || t.stats || {},
    jobs: Array.isArray(res?.jobs) ? res.jobs : Array.isArray(t.jobs) ? t.jobs : [],
    settlements: Array.isArray(res?.settlements) ? res.settlements : Array.isArray(t.settlements) ? t.settlements : [],
  };
}

const jobService = (j, L) => {
  const s = j?.service;
  const en = (s && typeof s === 'object' ? s.name : null) || j?.serviceDetails?.name || j?.serviceName || null;
  const ar = (s && typeof s === 'object' ? s.nameAr || s.name_ar : null) || j?.serviceNameAr || null;
  return L(en || ar, ar || en) || '—';
};
const jobTotal = (j) => num(j?.totalAmount ?? j?.total);
const jobCommission = (j) => num(j?.commission?.amount);

// Ledger: commissions owed (from completed jobs) and payments, newest first, with the balance after each
// entry. Worked backwards from the server's balance so it stays right even though only recent jobs are listed.
function buildLedger(jobs, settlements, balanceDue) {
  const entries = [];
  jobs.forEach((j) => {
    const amount = jobCommission(j);
    if (normalizeStatus(j.status) !== 'completed' || amount == null) return;
    entries.push({ kind: 'commission', id: `j-${j._id}`, at: j.completion?.completedAt || j.updatedAt || bookingDate(j), amount, job: j });
  });
  settlements.forEach((s, i) => {
    const amount = num(s.amount);
    if (amount == null) return;
    entries.push({ kind: 'payment', id: `s-${s._id || i}`, at: s.createdAt, amount, settlement: s });
  });
  entries.sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));
  if (balanceDue == null) return entries.map((e) => ({ ...e, balance: null }));
  let balance = balanceDue;
  return entries.map((e) => {
    const row = { ...e, balance: round2(balance) };
    balance += e.kind === 'commission' ? -e.amount : e.amount;
    return row;
  });
}

function Stat({ label, value, tone }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <dt className="text-xs text-slate-600 dark:text-slate-400">{label}</dt>
      <dd className={`mt-0.5 text-lg font-bold ${tone || 'text-slate-900 dark:text-white'}`}>{value}</dd>
    </div>
  );
}

function SectionTitle({ icon: Icon, children, action }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
        {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}{children}
      </h3>
      {action}
    </div>
  );
}

export default function TechnicianDetailDrawer({ technicianId, initial, onClose, onEdit, onChanged, refreshKey = 0 }) {
  const { L, fmtDate, fmtDateTime, fmtMoney, fmtNum } = useAdminLang();
  const toast = useAdminToast();
  const uid = useId();
  const [tech, setTech] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [payOpen, setPayOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [amountError, setAmountError] = useState('');
  const amountRef = useRef(null);

  const load = useCallback(async () => {
    if (!technicianId) return;
    setLoading(true);
    try {
      const t = unwrap(await getTechnician(technicianId));
      setTech(t);
      setError(t ? '' : L('Could not read the technician.', 'تعذرت قراءة بيانات الفني.'));
    } catch (err) {
      setError(err?.status === 404
        ? L('This technician no longer exists.', 'هذا الفني لم يعد موجوداً.')
        : err?.message || L('Could not load the technician.', 'تعذر تحميل الفني.'));
    } finally {
      setLoading(false);
    }
  }, [technicianId, L]);

  useEffect(() => {
    setTech(null);
    setPayOpen(false);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [technicianId, refreshKey]);

  const t = tech || (initial ? { ...initial, jobs: null, settlements: null, stats: initial.stats || {} } : null);
  const s = t?.stats || {};
  const due = num(s.commissionDue);
  const ledger = tech ? buildLedger(tech.jobs, tech.settlements, due) : null;

  const openPay = () => {
    setAmount(due != null && due > 0 ? String(round2(due)) : '');
    setMethod('cash');
    setAmountError('');
    setPayOpen(true);
  };

  const submitPayment = async (note) => {
    const value = parseAmount(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setAmountError(L('Enter an amount greater than 0 (up to 2 decimals).', 'أدخل مبلغاً أكبر من 0 (حتى منزلتين عشريتين).'));
      amountRef.current?.focus();
      return false;
    }
    if (value > 1000000) {
      setAmountError(L('That amount is too large.', 'المبلغ كبير جداً.'));
      amountRef.current?.focus();
      return false;
    }
    try {
      await addSettlement(t._id, { amount: round2(value), method, note: note || '' });
      toast.success(L(`Payment of ${fmtMoney(value)} recorded`, `تم تسجيل دفعة بقيمة ${fmtMoney(value)}`));
      await load();
      onChanged?.();
      return true;
    } catch (err) {
      toast.error(err?.message || L('Could not record the payment.', 'تعذر تسجيل الدفعة.'));
      return false;
    }
  };

  const parsedAmount = parseAmount(amount);
  const overpay = due != null && Number.isFinite(parsedAmount) && parsedAmount > due + 0.001;
  const waText = t ? L(`Hello ${t.name || ''}, this is Ahmed Cooling Workshop.`, `مرحباً ${t.name || ''}، معك ورشة أحمد للتبريد.`) : '';
  const cities = Array.isArray(t?.cities) ? t.cities : [];
  const specs = Array.isArray(t?.specialties) ? t.specialties : [];

  return (
    <>
      <Drawer
        open={!!technicianId}
        onClose={onClose}
        canClose={!payOpen}
        width="sm:max-w-2xl"
        title={t?.name ? <span dir="auto">{t.name}</span> : L('Technician', 'الفني')}
        subtitle={t ? (
          <span className="flex flex-wrap items-center gap-1.5">
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${t.active !== false ? 'bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-200' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}>
              {t.active !== false ? L('Active', 'نشط') : L('Inactive', 'غير نشط')}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${t.availability !== false ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-200' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}>
              {t.availability !== false ? L('Available', 'متاح') : L('Unavailable', 'غير متاح')}
            </span>
            {t.autoAssign && (
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-800 dark:bg-violet-500/15 dark:text-violet-200">{L('Auto-assign on', 'التعيين التلقائي مفعّل')}</span>
            )}
          </span>
        ) : null}
        headerActions={(
          <>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              aria-label={L('Reload technician', 'إعادة تحميل الفني')}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            </button>
            {t && (
              <button
                type="button"
                onClick={() => onEdit?.(tech || t)}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-slate-800"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />{L('Edit', 'تعديل')}
              </button>
            )}
          </>
        )}
      >
        {error && (
          <div role="alert" className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-200">
            <span>{error}</span>
            <button type="button" onClick={load} className="min-h-11 shrink-0 px-2 font-semibold underline">{L('Retry', 'إعادة المحاولة')}</button>
          </div>
        )}

        {!t && !error && (
          <div className="flex items-center justify-center py-16 text-sm text-slate-600 dark:text-slate-300" role="status">
            <Loader2 className="me-2 h-5 w-5 animate-spin" aria-hidden="true" />{L('Loading…', 'جارٍ التحميل…')}
          </div>
        )}

        {t && (
          <div className="space-y-6">
            {/* Contact */}
            <section className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {t.phone ? (
                  <>
                    <a href={telLink(t.phone)} dir="ltr" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 font-mono text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">
                      <Phone className="h-4 w-4" aria-hidden="true" />{t.phone}
                    </a>
                    <a
                      href={whatsappLink(t.phone, waText)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-green-300 bg-green-50 px-3 text-sm font-semibold text-green-800 hover:bg-green-100 dark:border-green-500/40 dark:bg-green-500/10 dark:text-green-200"
                    >
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />WhatsApp<span className="sr-only"> ({L('opens in a new tab', 'يفتح في تبويب جديد')})</span>
                    </a>
                  </>
                ) : (
                  <p className="text-sm text-slate-600 dark:text-slate-400">{L('No phone number', 'لا يوجد رقم جوال')}</p>
                )}
                {t.email && (
                  <a href={`mailto:${t.email}`} className="inline-flex min-h-11 items-center gap-2 break-all rounded-xl px-2 text-sm text-blue-700 hover:underline dark:text-blue-300">
                    <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />{t.email}
                  </a>
                )}
              </div>
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div className="flex items-start gap-2">
                  <dt className="flex shrink-0 items-center gap-1 text-slate-600 dark:text-slate-400"><MapPin className="h-4 w-4" aria-hidden="true" />{L('Cities', 'المدن')}:</dt>
                  <dd className="font-medium text-slate-900 dark:text-slate-100">{cities.length ? cities.map((c) => cityLabel(c, L)).join('، ') : '—'}</dd>
                </div>
                <div className="flex items-start gap-2">
                  <dt className="flex shrink-0 items-center gap-1 text-slate-600 dark:text-slate-400"><Wrench className="h-4 w-4" aria-hidden="true" />{L('Specialties', 'التخصصات')}:</dt>
                  <dd className="font-medium text-slate-900 dark:text-slate-100">{specs.length ? specs.map((x) => specialtyLabel(x, L)).join('، ') : L('All services', 'جميع الخدمات')}</dd>
                </div>
              </dl>
              {t.hasProfile === false && (
                <p className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-200">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {L('This account has no technician profile yet, so it can’t receive jobs. Save it once with “Edit” to create one.', 'هذا الحساب ليس لديه ملف فني بعد، لذا لا يمكنه استلام المهام. احفظه مرة عبر «تعديل» لإنشائه.')}
                </p>
              )}
            </section>

            {/* Stats */}
            <section aria-labelledby={`${uid}-stats`}>
              <SectionTitle icon={ClipboardList}><span id={`${uid}-stats`}>{L('Jobs', 'المهام')}</span></SectionTitle>
              <dl className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                <Stat label={L('Working now', 'قيد العمل')} value={fmtNum(s.activeJobs)} />
                <Stat label={L('Assigned, not started', 'معيّنة لم تبدأ')} value={fmtNum(s.pendingJobs)} />
                <Stat label={L('Done today', 'منجزة اليوم')} value={fmtNum(s.completedToday)} />
                <Stat label={L('Done this month', 'منجزة هذا الشهر')} value={fmtNum(s.completedMonth)} />
                <Stat label={L('Done in total', 'إجمالي المنجزة')} value={fmtNum(s.completedTotal)} />
              </dl>
            </section>

            {/* Commission */}
            <section aria-labelledby={`${uid}-comm`}>
              <SectionTitle icon={Wallet}><span id={`${uid}-comm`}>{L('Commission', 'العمولة')}</span></SectionTitle>
              <div className={`rounded-2xl border p-4 ${due != null && due > 0 ? 'border-amber-300 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-950/30' : 'border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40'}`}>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{L('Balance due to the company', 'الرصيد المستحق للشركة')}</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{fmtMoney(due)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={openPay}
                    disabled={!tech}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60"
                  >
                    <HandCoins className="h-4 w-4" aria-hidden="true" />{L('Record payment', 'تسجيل دفعة')}
                  </button>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-200 pt-3 text-sm sm:grid-cols-4 dark:border-slate-700">
                  <div><dt className="text-xs text-slate-600 dark:text-slate-400">{L('Collected (jobs)', 'المحصّل (المهام)')}</dt><dd className="font-semibold text-slate-900 dark:text-white">{fmtMoney(s.revenueTotal)}</dd></div>
                  <div><dt className="text-xs text-slate-600 dark:text-slate-400">{L('Commission earned', 'إجمالي العمولة')}</dt><dd className="font-semibold text-slate-900 dark:text-white">{fmtMoney(s.commissionTotal)}</dd></div>
                  <div><dt className="text-xs text-slate-600 dark:text-slate-400">{L('Paid to company', 'المدفوع للشركة')}</dt><dd className="font-semibold text-slate-900 dark:text-white">{fmtMoney(s.commissionPaid)}</dd></div>
                  <div><dt className="text-xs text-slate-600 dark:text-slate-400">{L('Due', 'المستحق')}</dt><dd className="font-semibold text-slate-900 dark:text-white">{fmtMoney(s.commissionDue)}</dd></div>
                </dl>
              </div>

              <h4 className="mb-2 mt-4 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                <Receipt className="h-4 w-4" aria-hidden="true" />{L('Ledger', 'السجل')}
              </h4>
              {!ledger ? (
                <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />{L('Loading…', 'جارٍ التحميل…')}</p>
              ) : ledger.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-400">{L('No commission or payments yet.', 'لا توجد عمولات أو دفعات بعد.')}</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full min-w-[32rem] text-sm">
                    <caption className="sr-only">{L('Commission ledger, newest first', 'سجل العمولة، الأحدث أولاً')}</caption>
                    <thead className="bg-slate-50 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                      <tr>
                        <th scope="col" className="px-3 py-2 text-start font-semibold">{L('Date', 'التاريخ')}</th>
                        <th scope="col" className="px-3 py-2 text-start font-semibold">{L('Entry', 'البند')}</th>
                        <th scope="col" className="px-3 py-2 text-end font-semibold">{L('Amount', 'المبلغ')}</th>
                        <th scope="col" className="px-3 py-2 text-end font-semibold">{L('Balance', 'الرصيد')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {ledger.map((e) => (
                        <tr key={e.id}>
                          <td className="whitespace-nowrap px-3 py-2 text-slate-700 dark:text-slate-300">{e.at ? fmtDate(e.at) : '—'}</td>
                          <td className="px-3 py-2 text-slate-900 dark:text-slate-100">
                            {e.kind === 'commission' ? (
                              <>
                                {L('Commission', 'عمولة')}{' '}
                                <Link href={`/admin/bookings?open=${encodeURIComponent(e.job._id)}`} className="font-mono text-blue-700 hover:underline dark:text-blue-300">{orderRef(e.job)}</Link>
                              </>
                            ) : (
                              <>
                                <span className="font-semibold text-green-800 dark:text-green-300">{L('Payment', 'دفعة')}</span>
                                <span className="text-slate-600 dark:text-slate-400"> · {methodLabel(e.settlement.method, L)}</span>
                                {e.settlement.note && <span className="block break-words text-xs text-slate-600 dark:text-slate-400" dir="auto">{e.settlement.note}</span>}
                              </>
                            )}
                          </td>
                          <td className={`whitespace-nowrap px-3 py-2 text-end font-semibold ${e.kind === 'payment' ? 'text-green-800 dark:text-green-300' : 'text-slate-900 dark:text-white'}`}>
                            <span dir="ltr">{e.kind === 'payment' ? '−' : '+'}</span>{fmtMoney(e.amount)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-end text-slate-700 dark:text-slate-300">{fmtMoney(e.balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Recent jobs */}
            <section aria-labelledby={`${uid}-jobs`}>
              <SectionTitle icon={ClipboardList}><span id={`${uid}-jobs`}>{L('Recent jobs', 'آخر المهام')}</span></SectionTitle>
              {!tech ? (
                <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />{L('Loading…', 'جارٍ التحميل…')}</p>
              ) : tech.jobs.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-400">{L('No jobs yet.', 'لا توجد مهام بعد.')}</p>
              ) : (
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                  {tech.jobs.map((j) => (
                    <li key={j._id}>
                      <Link
                        href={`/admin/bookings?open=${encodeURIComponent(j._id)}`}
                        className="flex min-h-11 flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-slate-900 dark:text-white" dir="auto">{jobService(j, L)}</span>
                          <span className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                            <span className="font-mono">{orderRef(j)}</span>
                            <span>{bookingDate(j) ? fmtDate(bookingDate(j)) : L('No date', 'بدون تاريخ')}</span>
                            {j.assignedBy === 'auto' && <span className="rounded bg-violet-100 px-1.5 font-semibold text-violet-800 dark:bg-violet-500/15 dark:text-violet-200">{L('Auto', 'تلقائي')}</span>}
                          </span>
                        </span>
                        <span className="flex shrink-0 flex-col items-end gap-1">
                          <StatusBadge status={normalizeStatus(j.status)} size="sm" />
                          <span className="text-xs text-slate-700 dark:text-slate-300">
                            {fmtMoney(j.completion?.amountCollected ?? jobTotal(j))}
                            {jobCommission(j) != null && <> · {L('comm.', 'عمولة')} {fmtMoney(jobCommission(j))}</>}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={payOpen}
        tone="primary"
        title={L('Record a commission payment', 'تسجيل دفعة عمولة')}
        message={L(
          `Money ${t?.name || 'the technician'} handed over to the company. Balance due now: ${fmtMoney(due)}.`,
          `مبلغ سلّمه ${t?.name || 'الفني'} للشركة. الرصيد المستحق الآن: ${fmtMoney(due)}.`,
        )}
        confirmLabel={L('Record payment', 'تسجيل الدفعة')}
        cancelLabel={L('Cancel', 'إلغاء')}
        reasonOptional
        reasonLabel={L('Note', 'ملاحظة')}
        reasonPlaceholder={L('e.g. cash received at the workshop', 'مثال: استلام نقدي في الورشة')}
        onConfirm={submitPayment}
        onClose={() => setPayOpen(false)}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor={`${uid}-amount`} className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              {L('Amount (SAR)', 'المبلغ (ريال)')}<span className="text-red-600 dark:text-red-400" aria-hidden="true"> *</span>
            </label>
            <input
              ref={amountRef}
              id={`${uid}-amount`}
              data-autofocus
              inputMode="decimal"
              dir="ltr"
              autoComplete="off"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setAmountError(''); }}
              aria-invalid={amountError ? 'true' : undefined}
              aria-describedby={amountError ? `${uid}-amount-err` : overpay ? `${uid}-amount-warn` : undefined}
              className={`min-h-11 w-full rounded-xl border bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:bg-slate-800 dark:text-white ${amountError ? 'border-red-500 dark:border-red-400' : 'border-slate-300 dark:border-slate-600'}`}
            />
          </div>
          <div>
            <label htmlFor={`${uid}-method`} className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">{L('Method', 'الطريقة')}</label>
            <select
              id={`${uid}-method`}
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            >
              {SETTLEMENT_METHODS.map((m) => <option key={m.key} value={m.key}>{L(m.en, m.ar)}</option>)}
            </select>
          </div>
          {amountError && <p id={`${uid}-amount-err`} role="alert" className="text-xs font-medium text-red-700 sm:col-span-2 dark:text-red-300">{amountError}</p>}
          {!amountError && overpay && (
            <p id={`${uid}-amount-warn`} className="text-xs font-medium text-amber-800 sm:col-span-2 dark:text-amber-300">
              {L('This is more than the balance due — the technician will be in credit.', 'المبلغ أكبر من الرصيد المستحق — سيصبح للفني رصيد دائن.')}
            </p>
          )}
        </div>
      </ConfirmDialog>
    </>
  );
}
