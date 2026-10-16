'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Eye, EyeOff, Check, X, Loader2, KeyRound, AlertCircle, Percent, Save } from 'lucide-react';
import { changePassword, getSettings, updateSettings } from '../adminApi';
import { useAdminAuth } from '../AdminAuthContext';
import { useAdminLang } from '../AdminI18n';
import { useAdminToast } from '../components/AdminToast';

const MIN = 12;
const MAX = 72; // bcrypt only uses the first 72 bytes

function PasswordField({ id, label, value, onChange, autoComplete, disabled, describedBy, invalid }) {
  const { L } = useAdminLang();
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          dir="ltr"
          required
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={describedBy}
          aria-invalid={invalid ? 'true' : undefined}
          className={`w-full rounded-xl border bg-white py-3 ps-3.5 pe-12 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-60 rtl:text-right dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400 ${
            invalid ? 'border-red-500 dark:border-red-400' : 'border-slate-300 dark:border-slate-600'
          }`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? L('Hide password', 'إخفاء كلمة المرور') : L('Show password', 'إظهار كلمة المرور')}
          aria-pressed={show}
          aria-controls={id}
          className="absolute end-0.5 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600 dark:text-slate-300 dark:hover:text-white"
        >
          {show ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}

function Rule({ ok, children }) {
  return (
    <li className={`flex items-center gap-2 ${ok ? 'text-green-700 dark:text-green-400' : 'text-slate-600 dark:text-slate-400'}`}>
      {ok ? <Check className="h-4 w-4 shrink-0" aria-hidden="true" /> : <X className="h-4 w-4 shrink-0" aria-hidden="true" />}
      <span>{children}</span>
    </li>
  );
}

// Arabic-Indic digits and the Arabic decimal separator are accepted
const toAscii = (v) => String(v ?? '')
  .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
  .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
  .replace(/[٫,]/g, '.')
  .trim();
// Server keeps a fraction (0.07); the field shows a percentage with one decimal (7)
const rateToPct = (rate) => (Number.isFinite(Number(rate)) ? String(Math.round(Number(rate) * 1000) / 10) : '');

function CommissionSettings() {
  const { L, fmtNum } = useAdminLang();
  const toast = useAdminToast();
  const uid = useId();
  const [saved, setSaved] = useState(null); // fraction from the server
  const [value, setValue] = useState('');
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const lock = useRef(false);

  const load = useCallback(async () => {
    setLoadError('');
    try {
      const res = await getSettings();
      const rate = res?.commissionRate ?? res?.settings?.commissionRate;
      if (rate == null || !Number.isFinite(Number(rate))) throw new Error(L('The server did not return a commission rate.', 'لم يُرجع الخادم نسبة العمولة.'));
      setSaved(Number(rate));
      setValue(rateToPct(rate));
    } catch (err) {
      setLoadError(err?.message || L('Could not load settings.', 'تعذر تحميل الإعدادات.'));
    }
  }, [L]);

  useEffect(() => { load(); }, [load]);

  const raw = toAscii(value);
  const valid = /^\d{1,2}(\.\d)?$/.test(raw) && Number(raw) >= 0 && Number(raw) <= 50;
  const pct = valid ? Number(raw) : null;
  const dirty = saved != null && valid && Math.round(pct * 10) !== Math.round(saved * 1000);

  async function handleSubmit(event) {
    event.preventDefault();
    if (lock.current) return;
    if (!valid) {
      setError(L('Enter a percentage from 0 to 50 (one decimal at most).', 'أدخل نسبة من 0 إلى 50 (منزلة عشرية واحدة كحد أقصى).'));
      return;
    }
    lock.current = true;
    setSaving(true);
    setError('');
    try {
      const res = await updateSettings({ commissionRate: Math.round(pct * 10) / 1000 });
      const rate = res?.commissionRate ?? res?.settings?.commissionRate ?? Math.round(pct * 10) / 1000;
      setSaved(Number(rate));
      setValue(rateToPct(rate));
      toast.success(L(`Commission rate saved: ${rateToPct(rate)}%`, `تم حفظ نسبة العمولة: ${fmtNum(Number(rateToPct(rate)))}٪`));
    } catch (err) {
      setError(err?.message || L('Could not save the commission rate.', 'تعذر حفظ نسبة العمولة.'));
    } finally {
      lock.current = false;
      setSaving(false);
    }
  }

  const example = pct != null ? Math.round(1000 * pct) / 100 : null; // commission on SAR 1,000

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900" aria-labelledby={`${uid}-h`}>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
          <Percent className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h2 id={`${uid}-h`} className="text-lg font-bold text-slate-900 dark:text-white">{L('Technician commission', 'عمولة الفنيين')}</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {L('The company’s share of the amount collected on each completed job. Changes apply to jobs completed from now on.', 'حصة الشركة من المبلغ المحصّل لكل مهمة مكتملة. يطبّق التغيير على المهام التي تكتمل من الآن.')}
          </p>
        </div>
      </div>

      {loadError ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          <span className="flex items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />{loadError}</span>
          <button type="button" onClick={load} className="min-h-11 px-2 font-semibold underline">{L('Retry', 'إعادة المحاولة')}</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-3">
          <label htmlFor={`${uid}-rate`} className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            {L('Commission rate %', 'نسبة العمولة ٪')}
          </label>
          <div className="flex flex-wrap items-start gap-2">
            <div className="relative w-36">
              <input
                id={`${uid}-rate`}
                inputMode="decimal"
                dir="ltr"
                autoComplete="off"
                maxLength={5}
                disabled={saved == null || saving}
                value={saved == null ? '' : value}
                placeholder={saved == null ? '…' : ''}
                onChange={(e) => { setValue(e.target.value); setError(''); }}
                aria-invalid={error || (value && !valid) ? 'true' : undefined}
                aria-describedby={`${uid}-hint${error ? ` ${uid}-err` : ''}`}
                className={`min-h-11 w-full rounded-xl border bg-white py-2.5 ps-3.5 pe-9 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-60 dark:bg-slate-800 dark:text-white ${
                  error || (value && !valid) ? 'border-red-500 dark:border-red-400' : 'border-slate-300 dark:border-slate-600'
                }`}
              />
              <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-sm text-slate-500" aria-hidden="true">%</span>
            </div>
            <button
              type="submit"
              disabled={saving || saved == null || !dirty}
              aria-busy={saving || undefined}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
              {saving ? L('Saving…', 'جارٍ الحفظ…') : L('Save', 'حفظ')}
            </button>
          </div>
          <p id={`${uid}-hint`} className="text-xs text-slate-600 dark:text-slate-400">
            {L('0 to 50, one decimal.', 'من 0 إلى 50، منزلة عشرية واحدة.')}
            {example != null && ` ${L(`Example: on SAR 1,000 collected the company gets SAR ${example} and the technician SAR ${Math.round((1000 - example) * 100) / 100}.`, `مثال: من 1000 ريال محصّلة تحصل الشركة على ${fmtNum(example)} ريال والفني على ${fmtNum(Math.round((1000 - example) * 100) / 100)} ريال.`)}`}
          </p>
          {error && <p id={`${uid}-err`} role="alert" className="text-xs font-medium text-red-700 dark:text-red-300">{error}</p>}
        </form>
      )}
    </section>
  );
}

export default function AdminSecurityPage() {
  const { logout } = useAdminAuth();
  const { L, fmtNum } = useAdminLang();
  const toast = useAdminToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [currentWrong, setCurrentWrong] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const lock = useRef(false);
  const uid = useId();
  const rulesId = `${uid}-rules`;
  const errorId = `${uid}-error`;

  const len = newPassword.length;
  const lengthOk = len >= MIN && len <= MAX;
  const matches = confirmPassword.length > 0 && confirmPassword === newPassword;
  const differs = newPassword.length > 0 && newPassword !== currentPassword;
  const valid = currentPassword.length > 0 && lengthOk && matches && differs;

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
    if (!valid || lock.current) return;
    lock.current = true;
    setError('');
    setCurrentWrong(false);
    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success(L('Password changed — please sign in again', 'تم تغيير كلمة المرور — يرجى تسجيل الدخول مرة أخرى'));
      logout();
    } catch (err) {
      // Wrong current password is a 400 (older backends: 401); either way stay signed in and say so
      const wrongCurrent = (err?.status === 400 || err?.status === 401) && /current/i.test(err?.message || '');
      if (wrongCurrent) {
        setCurrentWrong(true);
        setError(L('The current password is incorrect.', 'كلمة المرور الحالية غير صحيحة.'));
      } else if (err?.status === 429) {
        setError(L(err.message || 'Too many attempts. Please wait and try again.', 'محاولات كثيرة جداً. يرجى الانتظار ثم المحاولة مرة أخرى.'));
      } else {
        setError(err?.message || L('Could not change the password.', 'تعذر تغيير كلمة المرور.'));
      }
    } finally {
      lock.current = false;
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{L('Settings', 'الإعدادات')}</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        {L('Technician commission and the admin password.', 'عمولة الفنيين وكلمة مرور المسؤول.')}
      </p>

      <CommissionSettings />

      <p className="mt-6 text-sm text-slate-600 dark:text-slate-400">
        {L('Change the admin password. You will be signed out on every device after saving.', 'غيّر كلمة مرور المسؤول. سيتم تسجيل خروجك من جميع الأجهزة بعد الحفظ.')}
      </p>

      <section className="mt-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900" aria-labelledby={`${uid}-h`}>
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
            <KeyRound className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 id={`${uid}-h`} className="text-lg font-bold text-slate-900 dark:text-white">{L('Change password', 'تغيير كلمة المرور')}</h2>
        </div>

        {error && (
          <div id={errorId} role="alert" className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <PasswordField
            id={`${uid}-current`}
            label={L('Current password', 'كلمة المرور الحالية')}
            value={currentPassword}
            onChange={(v) => { setCurrentPassword(v); setCurrentWrong(false); }}
            autoComplete="current-password"
            disabled={saving}
            invalid={currentWrong || (submitted && !currentPassword)}
            describedBy={currentWrong ? errorId : undefined}
          />
          <PasswordField
            id={`${uid}-new`}
            label={L('New password', 'كلمة المرور الجديدة')}
            value={newPassword}
            onChange={setNewPassword}
            autoComplete="new-password"
            disabled={saving}
            invalid={submitted && (!lengthOk || !differs)}
            describedBy={rulesId}
          />
          <PasswordField
            id={`${uid}-confirm`}
            label={L('Confirm new password', 'تأكيد كلمة المرور الجديدة')}
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
            disabled={saving}
            invalid={submitted && !matches}
            describedBy={rulesId}
          />

          <ul id={rulesId} className="space-y-1.5 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/60" aria-live="polite">
            <Rule ok={lengthOk}>
              {L(`${MIN}–${MAX} characters`, `من ${fmtNum(MIN)} إلى ${fmtNum(MAX)} حرفاً`)}
              <span className="text-slate-500 dark:text-slate-400"> ({fmtNum(len)})</span>
            </Rule>
            <Rule ok={differs}>{L('Different from the current password', 'مختلفة عن كلمة المرور الحالية')}</Rule>
            <Rule ok={matches}>{L('Both new passwords match', 'كلمتا المرور الجديدتان متطابقتان')}</Rule>
          </ul>

          <button
            type="submit"
            disabled={saving}
            aria-busy={saving || undefined}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {saving ? L('Saving…', 'جارٍ الحفظ…') : L('Change password', 'تغيير كلمة المرور')}
          </button>
        </form>
      </section>
    </div>
  );
}
