'use client';

// Technician wallets, cancellation reviews and dispatch settings (backend: routes/adminDispatch.js, utils/dispatch.js).
import { useCallback, useEffect, useState } from 'react';
import { Wallet, PlusCircle, Snowflake, Sun, RefreshCw, Loader2, Check, Undo2, Clock, Ban, Save } from 'lucide-react';
import { adminApi } from '../adminApi';
import { useAdminLang } from '../AdminI18n';
import { useAdminToast, Drawer, ConfirmDialog, Switch } from '../components';

const card = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm';
const input = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-600 dark:bg-slate-800 dark:text-white';
const btn = 'inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 min-h-10 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-60';
const btnPrimary = `${btn} bg-blue-600 text-white hover:bg-blue-700`;
const btnGhost = `${btn} border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800`;

const TABS = [
  { key: 'wallets', en: 'Wallets', ar: 'المحافظ' },
  { key: 'reviews', en: 'Cancellations', ar: 'الإلغاءات' },
  { key: 'settings', en: 'Dispatch settings', ar: 'إعدادات التوزيع' },
];

const TX_LABEL = {
  topup: ['Top-up', 'شحن'], hold: ['Commission held', 'عمولة محجوزة'], release: ['Commission returned', 'عمولة مُعادة'],
  refund: ['Refund', 'استرداد'], adjust: ['Adjustment', 'تعديل'], opening: ['Opening balance', 'رصيد افتتاحي'],
};

function Money({ value, className = '' }) {
  const { fmtMoney } = useAdminLang();
  return <span className={className} dir="ltr">{fmtMoney ? fmtMoney(value, 'SAR') : `SAR ${Number(value || 0).toFixed(2)}`}</span>;
}

// ---------------- wallets ----------------

function TopUpForm({ technician, onDone }) {
  const { L } = useAdminLang();
  const toast = useAdminToast();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('cash');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await adminApi.topUpWallet(technician.technicianId, { amount: Number(amount), method, note });
      toast.success(L('Top-up recorded', 'تم تسجيل الشحن'));
      setAmount(''); setNote('');
      onDone();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className={`${card} p-4 space-y-3`}>
      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{L('Record a top-up', 'تسجيل شحن رصيد')}</h3>
      <div className="grid grid-cols-2 gap-3">
        <input className={input} type="number" min="1" step="0.01" required dir="ltr" placeholder={L('Amount (SAR)', 'المبلغ (ريال)')} value={amount} onChange={(e) => setAmount(e.target.value)} />
        <select className={input} value={method} onChange={(e) => setMethod(e.target.value)}>
          <option value="cash">{L('Cash', 'نقداً')}</option>
          <option value="bank_transfer">{L('Bank transfer', 'تحويل بنكي')}</option>
          <option value="other">{L('Other', 'أخرى')}</option>
        </select>
      </div>
      <input className={input} maxLength={500} placeholder={L('Note (optional)', 'ملاحظة (اختياري)')} value={note} onChange={(e) => setNote(e.target.value)} />
      <button type="submit" disabled={busy || !amount} className={btnPrimary}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <PlusCircle className="h-4 w-4" aria-hidden="true" />}
        {L('Add to wallet', 'إضافة إلى المحفظة')}
      </button>
    </form>
  );
}

function FreezeControls({ technician, onDone }) {
  const { L, fmtDateTime } = useAdminLang();
  const toast = useAdminToast();
  const [hours, setHours] = useState('24');
  const [busy, setBusy] = useState(false);
  const run = async (fn, okMsg) => {
    setBusy(true);
    try { await fn(); toast.success(okMsg); onDone(); } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };
  if (technician.frozenUntil) {
    return (
      <div className={`${card} p-4 space-y-2`}>
        <p className="text-sm font-semibold text-sky-700 dark:text-sky-300"><Snowflake className="inline h-4 w-4" aria-hidden="true" /> {L('Frozen until', 'مجمّد حتى')} {fmtDateTime(technician.frozenUntil)}</p>
        {technician.frozenReason ? <p className="text-xs text-slate-500 dark:text-slate-400">{technician.frozenReason}</p> : null}
        <button type="button" disabled={busy} className={btnGhost} onClick={() => run(() => adminApi.unfreezeTechnician(technician.technicianId), L('Account unfrozen', 'تم فك التجميد'))}>
          <Sun className="h-4 w-4" aria-hidden="true" /> {L('Unfreeze now', 'فك التجميد الآن')}
        </button>
      </div>
    );
  }
  return (
    <div className={`${card} p-4 space-y-2`}>
      <h3 className="text-sm font-bold text-slate-900 dark:text-white">{L('Freeze account', 'تجميد الحساب')}</h3>
      <div className="flex gap-2">
        <input className={input} type="number" min="1" max="8760" dir="ltr" value={hours} onChange={(e) => setHours(e.target.value)} aria-label={L('Hours', 'ساعات')} />
        <button type="button" disabled={busy} className={btnGhost} onClick={() => run(() => adminApi.freezeTechnician(technician.technicianId, { hours: Number(hours), reason: 'Frozen by admin' }), L('Account frozen', 'تم التجميد'))}>
          <Snowflake className="h-4 w-4" aria-hidden="true" /> {L('Freeze (hours)', 'تجميد (ساعات)')}
        </button>
      </div>
    </div>
  );
}

function WalletDrawer({ technician, onClose, onChanged }) {
  const { L, fmtDateTime } = useAdminLang();
  const toast = useAdminToast();
  const [data, setData] = useState(null);
  const load = useCallback(async () => {
    try { setData(await adminApi.getWallet(technician.technicianId)); } catch (err) { toast.error(err.message); }
  }, [technician.technicianId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [load]);
  const changed = () => { load(); onChanged(); };
  return (
    <Drawer open onClose={onClose} title={technician.name} subtitle={technician.phone || ''}>
      <div className="space-y-4">
        <div className={`${card} p-4`}>
          <p className="text-xs text-slate-500 dark:text-slate-400">{L('Wallet balance', 'رصيد المحفظة')}</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white"><Money value={data ? data.balance : technician.balance} /></p>
        </div>
        <TopUpForm technician={technician} onDone={changed} />
        <FreezeControls technician={technician} onDone={changed} />
        <div className={`${card} overflow-hidden`}>
          <h3 className="px-4 py-3 text-sm font-bold text-slate-900 dark:text-white">{L('History', 'السجل')}</h3>
          {!data ? <p className="px-4 pb-4 text-sm text-slate-500">…</p> : data.transactions.length === 0 ? (
            <p className="px-4 pb-4 text-sm text-slate-500">{L('No transactions yet.', 'لا توجد حركات بعد.')}</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.transactions.map((t) => (
                <li key={t._id} className="flex items-start justify-between gap-3 px-4 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 dark:text-white">{L(...(TX_LABEL[t.type] || [t.type, t.type]))}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{t.note || ''} · {fmtDateTime(t.createdAt)}</p>
                  </div>
                  <Money value={t.amount} className={t.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-red-600 dark:text-red-400 font-semibold'} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Drawer>
  );
}

function WalletsTab() {
  const { L, fmtDateTime } = useAdminLang();
  const toast = useAdminToast();
  const [rows, setRows] = useState(null);
  const [selected, setSelected] = useState(null);
  const load = useCallback(async () => {
    try { setRows((await adminApi.getWallets()).wallets); } catch (err) { toast.error(err.message); setRows([]); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [load]);
  if (!rows) return <p className="p-6 text-sm text-slate-500">…</p>;
  return (
    <>
      <div className={`${card} overflow-x-auto`}>
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="text-start text-xs text-slate-500 dark:text-slate-400">
              <th className="px-4 py-3 text-start font-semibold">{L('Technician', 'الفني')}</th>
              <th className="px-4 py-3 text-start font-semibold">{L('Balance', 'الرصيد')}</th>
              <th className="px-4 py-3 text-start font-semibold">{L('Under review', 'قيد المراجعة')}</th>
              <th className="px-4 py-3 text-start font-semibold">{L('Late', 'تأخير')}</th>
              <th className="px-4 py-3 text-start font-semibold">{L('Status', 'الحالة')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((w) => (
              <tr key={w.technicianId} className="cursor-pointer border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60" onClick={() => setSelected(w)}>
                <td className="px-4 py-3"><p className="font-semibold text-slate-900 dark:text-white">{w.name}</p><p className="text-xs text-slate-500" dir="ltr">{w.phone}</p></td>
                <td className="px-4 py-3 font-bold"><Money value={w.balance} className={w.balance < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'} /></td>
                <td className="px-4 py-3">{w.reviewCount ? <><Money value={w.underReview} /> <span className="text-xs text-slate-500">({w.reviewCount})</span></> : '—'}</td>
                <td className="px-4 py-3">{w.lateCount || 0}</td>
                <td className="px-4 py-3">
                  {w.frozenUntil
                    ? <span className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700 dark:bg-sky-500/10 dark:text-sky-300"><Snowflake className="h-3 w-3" aria-hidden="true" />{L('Frozen until', 'مجمّد حتى')} {fmtDateTime(w.frozenUntil)}</span>
                    : <span className="text-xs text-emerald-600 dark:text-emerald-400">{L('Active', 'نشط')}</span>}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">{L('No technicians.', 'لا يوجد فنيون.')}</td></tr> : null}
          </tbody>
        </table>
      </div>
      {selected ? <WalletDrawer technician={selected} onClose={() => setSelected(null)} onChanged={load} /> : null}
    </>
  );
}

// ---------------- cancellations ----------------

const REVIEW_BADGE = {
  pending: ['Waiting for you', 'بانتظار قرارك', 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'],
  deferred: ['Held until', 'محجوزة حتى', 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300'],
  refunded: ['Refunded', 'تم الاسترداد', 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'],
  forfeited: ['Kept by company', 'احتفظت بها الشركة', 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'],
};

function CancellationsTab() {
  const { L, fmtDateTime } = useAdminLang();
  const toast = useAdminToast();
  const [filter, setFilter] = useState('pending');
  const [rows, setRows] = useState(null);
  const [pending, setPending] = useState(null); // { row, decision }
  const load = useCallback(async () => {
    try { setRows((await adminApi.getTechnicianCancellations({ status: filter || undefined })).cancellations); } catch (err) { toast.error(err.message); setRows([]); }
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setRows(null); load(); }, [load]);

  const DECISION = {
    refund: { en: 'Refund the commission to the wallet', ar: 'إرجاع العمولة إلى المحفظة', tone: 'primary', icon: Undo2 },
    defer: { en: 'Hold it for a week, then refund', ar: 'حجزها أسبوعاً ثم إرجاعها', tone: 'primary', icon: Clock },
    forfeit: { en: 'Keep it (technician loses it)', ar: 'الاحتفاظ بها (يخسرها الفني)', tone: 'danger', icon: Ban },
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {[['pending', 'Waiting', 'بانتظار القرار'], ['deferred', 'Held', 'محجوزة'], ['', 'All', 'الكل']].map(([v, en, ar]) => (
          <button key={v} type="button" onClick={() => setFilter(v)} className={`${btn} ${filter === v ? 'bg-blue-600 text-white' : 'border border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-200'}`}>{L(en, ar)}</button>
        ))}
        <button type="button" onClick={() => { setRows(null); load(); }} className={btnGhost}><RefreshCw className="h-4 w-4" aria-hidden="true" />{L('Refresh', 'تحديث')}</button>
      </div>
      {!rows ? <p className="p-6 text-sm text-slate-500">…</p> : rows.length === 0 ? (
        <div className={`${card} p-8 text-center text-sm text-slate-500`}>{L('Nothing here.', 'لا شيء هنا.')}</div>
      ) : (
        <div className="grid gap-3">
          {rows.map((c) => {
            const badge = REVIEW_BADGE[c.reviewStatus] || REVIEW_BADGE.pending;
            const open = c.reviewStatus === 'pending' || c.reviewStatus === 'deferred';
            return (
              <div key={c._id} className={`${card} p-4`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{c.technicianName || '—'} <span className="text-xs font-normal text-slate-500" dir="ltr">{c.technicianPhone}</span></p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">#{c.orderNumber} · {fmtDateTime(c.createdAt)}</p>
                  </div>
                  <span className={`rounded-lg px-2 py-0.5 text-[11px] font-semibold ${badge[2]}`}>{L(badge[0], badge[1])}{c.reviewStatus === 'deferred' && c.deferUntil ? ` ${fmtDateTime(c.deferUntil)}` : ''}</span>
                </div>
                <p className="mt-2 text-sm text-slate-800 dark:text-slate-200" dir="auto">“{c.reason}”</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{L('Commission held', 'العمولة المحجوزة')}: <Money value={c.holdAmount} />{c.causedFreeze ? ` · ${L('this froze the account', 'أدى هذا إلى تجميد الحساب')}` : ''}</p>
                {open ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Object.entries(DECISION).filter(([d]) => !(d === 'defer' && c.reviewStatus === 'deferred')).map(([d, info]) => {
                      const Icon = info.icon;
                      return <button key={d} type="button" className={d === 'forfeit' ? `${btn} border border-red-300 text-red-700 hover:bg-red-50 dark:border-red-500/40 dark:text-red-300` : btnGhost} onClick={() => setPending({ row: c, decision: d })}><Icon className="h-4 w-4" aria-hidden="true" />{L(info.en, info.ar)}</button>;
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
      <ConfirmDialog
        open={!!pending}
        title={pending ? L(DECISION[pending.decision].en, DECISION[pending.decision].ar) : ''}
        message={pending ? `${pending.row.technicianName} · #${pending.row.orderNumber} · ${pending.row.holdAmount} SAR` : ''}
        confirmLabel={L('Confirm', 'تأكيد')}
        tone={pending && DECISION[pending.decision].tone}
        reasonOptional
        reasonLabel={L('Note (optional)', 'ملاحظة (اختياري)')}
        onConfirm={async (note) => {
          try {
            await adminApi.reviewTechnicianCancellation(pending.row._id, pending.decision, note);
            toast.success(L('Decision saved', 'تم حفظ القرار'));
            load();
          } catch (err) {
            toast.error(err.message);
            return false;
          }
        }}
        onClose={() => setPending(null)}
      />
    </div>
  );
}

// ---------------- settings ----------------

const FIELDS = [
  { key: 'openAlertMin', en: 'Alert me if a booking waits this long with no technician (minutes)', ar: 'نبّهني إذا بقي الحجز دون فني هذه المدة (دقائق)' },
  { key: 'lateGraceMin', en: 'A technician is late after this many minutes past the booking time', ar: 'يُعد الفني متأخراً بعد هذه الدقائق من موعد الحجز' },
  { key: 'maxCancelsPerDay', en: 'Cancellations in one day that freeze the account', ar: 'عدد الإلغاءات في اليوم الذي يجمّد الحساب' },
  { key: 'freezeHours', en: 'Freeze length (hours)', ar: 'مدة التجميد (ساعات)' },
  { key: 'deferDays', en: 'Days a held cancellation commission waits before it is refunded', ar: 'أيام انتظار عمولة الإلغاء قبل إرجاعها' },
];

function SettingsTab() {
  const { L } = useAdminLang();
  const toast = useAdminToast();
  const [settings, setSettings] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmMode, setConfirmMode] = useState(null);
  useEffect(() => {
    adminApi.getDispatchSettings().then((r) => setSettings(r.settings)).catch((err) => toast.error(err.message));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (!settings) return <p className="p-6 text-sm text-slate-500">…</p>;

  const save = async (patch) => {
    setBusy(true);
    try {
      const res = await adminApi.updateDispatchSettings(patch);
      setSettings(res.settings);
      toast.success(L('Settings saved', 'تم حفظ الإعدادات'));
    } catch (err) {
      toast.error(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className={`${card} p-5`}>
        <Switch
          checked={settings.offerMode}
          busy={busy}
          onChange={(next) => setConfirmMode(next)}
          label={L('Technicians pick up bookings themselves (offer mode)', 'الفنيون يختارون الحجوزات بأنفسهم (وضع العروض)')}
          description={settings.offerMode
            ? L('ON: every booking is shown to all matching technicians, nearest first. Whoever accepts first gets it, and the commission is taken from their wallet.', 'مفعّل: يظهر كل حجز لجميع الفنيين المناسبين، الأقرب أولاً. من يقبل أولاً يحصل عليه وتُحجز عمولته من محفظته.')
            : L('OFF: the server assigns each booking to a technician automatically, as before.', 'متوقف: يعيّن النظام الفني تلقائياً كما في السابق.')}
        />
      </div>
      <form
        className={`${card} space-y-4 p-5`}
        onSubmit={(e) => {
          e.preventDefault();
          const patch = {};
          FIELDS.forEach((f) => { patch[f.key] = Number(e.currentTarget.elements[f.key].value); });
          save(patch);
        }}
      >
        {FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">{L(f.en, f.ar)}</span>
            <input name={f.key} type="number" min="1" step="1" dir="ltr" defaultValue={settings[f.key]} className={`${input} max-w-[10rem]`} />
          </label>
        ))}
        <button type="submit" disabled={busy} className={btnPrimary}><Save className="h-4 w-4" aria-hidden="true" />{L('Save', 'حفظ')}</button>
      </form>
      <ConfirmDialog
        open={confirmMode !== null}
        title={confirmMode ? L('Turn on offer mode?', 'تفعيل وضع العروض؟') : L('Turn off offer mode?', 'إيقاف وضع العروض؟')}
        message={confirmMode
          ? L('New bookings will be shown to technicians instead of being assigned automatically. Technicians need money in their wallet to pick jobs up.', 'ستظهر الحجوزات الجديدة للفنيين بدلاً من التعيين التلقائي. يحتاج الفني إلى رصيد في محفظته لأخذ المهام.')
          : L('New bookings will be assigned automatically again.', 'ستُعيَّن الحجوزات الجديدة تلقائياً مرة أخرى.')}
        confirmLabel={L('Confirm', 'تأكيد')}
        tone="primary"
        onConfirm={async () => save({ offerMode: confirmMode })}
        onClose={() => setConfirmMode(null)}
      />
    </div>
  );
}

// ---------------- page ----------------

export default function WalletsPage() {
  const { L } = useAdminLang();
  const [tab, setTab] = useState('wallets');
  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
      <div className="flex items-center gap-2">
        <Wallet className="h-6 w-6 text-blue-600" aria-hidden="true" />
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">{L('Wallets & Jobs', 'المحافظ والمهام')}</h1>
      </div>
      <div role="tablist" className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} type="button" onClick={() => setTab(t.key)}
            className={`${btn} ${tab === t.key ? 'bg-blue-600 text-white' : 'border border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-200'}`}>
            {L(t.en, t.ar)}
          </button>
        ))}
      </div>
      {tab === 'wallets' ? <WalletsTab /> : tab === 'reviews' ? <CancellationsTab /> : <SettingsTab />}
    </div>
  );
}
