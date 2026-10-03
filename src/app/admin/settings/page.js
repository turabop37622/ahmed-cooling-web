'use client';

import { useId, useRef, useState } from 'react';
import { Eye, EyeOff, Check, X, Loader2, KeyRound, AlertCircle } from 'lucide-react';
import { changePassword } from '../adminApi';
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
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{L('Security', 'الأمان')}</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        {L('Change the admin password. You will be signed out on every device after saving.', 'غيّر كلمة مرور المسؤول. سيتم تسجيل خروجك من جميع الأجهزة بعد الحفظ.')}
      </p>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900" aria-labelledby={`${uid}-h`}>
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
