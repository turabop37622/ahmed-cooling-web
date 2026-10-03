'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth, safeAdminPath } from '../AdminAuthContext';
import { useAdminLang } from '../AdminI18n';
import { login as loginRequest } from '../adminApi';
import LangToggle from '../components/LangToggle';
import { useNoAutofill } from '../../../lib/useNoAutofill';
import { Mail, Lock, Loader2, ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react';

// `next` is read from the URL at the moment it's needed (no useSearchParams → no Suspense boundary needed)
const nextFromUrl = () => {
  try {
    return safeAdminPath(new URLSearchParams(window.location.search).get('next'));
  } catch {
    return '/admin/dashboard';
  }
};

// Arabic wording for the server's (English) answers, by status
function arabicMessage(err) {
  switch (err?.status) {
    case 0: return 'تعذر الاتصال بالخادم. تحقق من الاتصال وحاول مرة أخرى.';
    case 400: return 'يرجى إدخال البريد الإلكتروني وكلمة المرور.';
    case 401: return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
    case 403: return 'هذا الحساب ليس حساب مسؤول.';
    case 429: return 'محاولات كثيرة جداً. يرجى الانتظار بضع دقائق ثم المحاولة مرة أخرى.';
    default: return err?.status >= 500 ? 'خطأ في الخادم. حاول مرة أخرى.' : null;
  }
}

const inputCls =
  'w-full ps-11 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent disabled:opacity-60';

export default function AdminLoginPage() {
  const router = useRouter();
  const { token, loading: authLoading, login } = useAdminAuth();
  const { L, isAr } = useAdminLang();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const noAutofill = useNoAutofill();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inFlight = useRef(false);

  // Already signed in (e.g. another tab): go straight to the requested page
  useEffect(() => {
    if (!authLoading && token) router.replace(nextFromUrl());
  }, [authLoading, token, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (inFlight.current) return; // one request per attempt
    inFlight.current = true;
    setError('');
    setSubmitting(true);
    try {
      const data = await loginRequest(email.trim(), password);
      try {
        login(data);
      } catch {
        setError(L('This account is not an admin account.', 'هذا الحساب ليس حساب مسؤول.'));
        return;
      }
      router.replace(nextFromUrl());
    } catch (err) {
      const en = err?.message || 'Sign in failed. Please try again.';
      setError(isAr ? arabicMessage(err) || en : en);
      setPassword('');
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center px-4 py-10 bg-gradient-to-br from-slate-100 via-blue-50/50 to-slate-200 dark:from-[#090D16] dark:via-[#0F172A] dark:to-[#090D16]">
      <div className="absolute top-3 end-3">
        <LangToggle />
      </div>

      <main className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center mb-3">
            <img src="/logo-en.png" alt={L('Ahmed Cooling Workshop', 'ورشة أحمد للتبريد')} className="h-16 w-auto object-contain dark:hidden" />
            <img src="/logo-en-white.png" alt={L('Ahmed Cooling Workshop', 'ورشة أحمد للتبريد')} className="h-16 w-auto object-contain hidden dark:block" />
          </div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {L('Management & admin portal', 'بوابة الإدارة ولوحة التحكم')}
          </p>
        </div>

        <div className="bg-white/95 dark:bg-slate-900/95 rounded-3xl shadow-2xl shadow-slate-900/10 border border-slate-200/80 dark:border-slate-800 p-6 sm:p-9">
          <div className="flex items-center justify-between gap-3 pb-5 border-b border-slate-200 dark:border-slate-800 mb-6">
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">{L('Admin sign in', 'تسجيل دخول المسؤول')}</h1>
              <p className="text-xs text-slate-600 dark:text-slate-400">{L('Authorised workshop staff only', 'لموظفي الورشة المصرح لهم فقط')}</p>
            </div>
            <ShieldCheck className="w-6 h-6 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          </div>

          {error && (
            <div
              role="alert"
              id="admin-login-error"
              className="mb-5 flex items-start gap-2 p-3.5 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-800 dark:text-red-300 text-sm font-medium leading-relaxed"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                {L('Email', 'البريد الإلكتروني')}
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none" aria-hidden="true" />
                <input
                  id="admin-email"
                  type="email"
                  name="email"
                  {...noAutofill('email')}
                  inputMode="email"
                  dir="ltr"
                  required
                  disabled={submitting}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-describedby={error ? 'admin-login-error' : undefined}
                  className={`${inputCls} pe-4 rtl:text-right`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                {L('Password', 'كلمة المرور')}
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none" aria-hidden="true" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  {...noAutofill('password')}
                  dir="ltr"
                  required
                  disabled={submitting}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-describedby={error ? 'admin-login-error' : undefined}
                  className={`${inputCls} pe-12 rtl:text-right`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? L('Hide password', 'إخفاء كلمة المرور') : L('Show password', 'إظهار كلمة المرور')}
                  aria-pressed={showPassword}
                  aria-controls="admin-password"
                  className="absolute end-0.5 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white focus-visible:outline-2 focus-visible:outline-blue-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              aria-busy={submitting || undefined}
              className="w-full min-h-12 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>{L('Signing in…', 'جارٍ تسجيل الدخول…')}</span>
                </>
              ) : (
                <span>{L('Sign in', 'تسجيل الدخول')}</span>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 dark:text-slate-400 mt-6 font-medium">
          {L('Ahmed Cooling Workshop · Jeddah', 'ورشة أحمد للتبريد · جدة')}
        </p>
      </main>
    </div>
  );
}
