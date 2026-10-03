'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Phone, Eye, EyeOff, Lock, AlertCircle, Loader2, Rocket, Info } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { loginEmail } from '../../lib/api';
import { safeRedirect } from '../../lib/safeRedirect';
import { authErrorMessage } from './authMessages';
import GoogleSignInButton from './GoogleSignInButton';

const inputBase =
  'w-full ps-10 py-3 rounded-xl border bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition';
const inputBorder = (invalid) => (invalid ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600');

// Query values are read by the server page (page.js) and passed in, so no Suspense/useSearchParams is needed
export default function LoginForm({ redirect: redirectParam, verified, reason }) {
  const router = useRouter();
  const redirectUrl = safeRedirect(redirectParam);

  const { login } = useAuth();
  const { t, language } = useTranslation();
  const ar = language === 'ar';

  const [tab, setTab] = useState('email');
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [invalid, setInvalid] = useState({}); // { email?: true, password?: true }
  const [loading, setLoading] = useState(false);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const fail = (message, fields = {}) => {
    setError(message);
    setInvalid(fields);
    // Move focus to the first invalid field so keyboard and screen-reader users land on the problem
    setTimeout(() => {
      if (fields.email) emailRef.current?.focus();
      else if (fields.password) passwordRef.current?.focus();
    }, 0);
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setInvalid({});

    if (!email.trim()) return fail(t.valEmailRequired, { email: true });
    if (!/\S+@\S+\.\S+/.test(email)) return fail(t.valInvalidEmail, { email: true });
    if (!password) return fail(t.valPasswordRequired, { password: true });

    setLoading(true);
    try {
      const response = await loginEmail(email.trim(), password);
      login(response);
      router.push(redirectUrl);
    } catch (err) {
      const status = err?.response?.status;
      const msg = authErrorMessage(err, language, [t.authMsgLoginFailed || 'تعذر تسجيل الدخول.', t.authMsgLoginFailed || 'Login failed.']);
      if (status === 401) fail(msg, { email: true, password: true });
      else if (status === 400) fail(msg, /password/i.test(err?.response?.data?.message || '') ? { password: true } : { email: true });
      else fail(msg);
    } finally {
      setLoading(false);
    }
  };

  const onGoogleSuccess = (response) => {
    login(response);
    router.push(redirectUrl);
  };

  const signupHref = redirectUrl !== '/' ? `/signup?redirect=${encodeURIComponent(redirectUrl)}` : '/signup';

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-100 px-4 pt-12 pb-24 sm:px-8 lg:px-16 xl:px-24 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="w-full max-w-md scroll-reveal-scale">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 p-2.5 mb-4 ring-4 ring-blue-500/10">
            <img src="/logo-icon.png" alt="" className="w-full h-full object-contain" />
          </div>
          <p className="text-2xl font-semibold text-slate-800 dark:text-white">{t.brandName}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t.brandTagline}</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-blue-900/5 border border-slate-200/60 dark:border-slate-700 p-6 sm:p-8">
          <h1 className="text-xl font-semibold text-slate-800 dark:text-white text-center mb-6">{t.login}</h1>

          {reason === 'auth' && (
            <div role="status" className="mb-4 flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm font-medium text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{ar ? 'سجّل الدخول للمتابعة، وسنعيدك إلى الصفحة التي طلبتها.' : 'Please log in to continue. We will take you back to the page you asked for.'}</span>
            </div>
          )}

          {verified && (
            <div role="status" className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-700 text-center dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
              {ar ? 'تم تأكيد حسابك بنجاح! يرجى تسجيل الدخول.' : 'Account verified successfully! Please log in.'}
            </div>
          )}

          {/* Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-700 rounded-xl p-1 mb-6">
            <button
              type="button"
              aria-pressed={tab === 'email'}
              onClick={() => { setTab('email'); setError(''); setInvalid({}); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                tab === 'email'
                  ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Mail className="w-4 h-4 shrink-0" aria-hidden="true" />
              {t.email}
            </button>
            <button
              type="button"
              aria-pressed={tab === 'phone'}
              onClick={() => { setShowComingSoon(true); setTimeout(() => setShowComingSoon(false), 2500); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                tab === 'phone'
                  ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Phone className="w-4 h-4 shrink-0" aria-hidden="true" />
              {t.phone}
            </button>
          </div>

          {/* Coming Soon */}
          {showComingSoon && (
            <div role="status" className="flex items-center justify-center gap-2 p-3 mb-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <Rocket className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                {ar ? 'قريباً! تسجيل الدخول بالهاتف سيتوفر قريباً.' : 'Coming Soon! Phone login will be available soon.'}
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div id="login-error" role="alert" className="flex items-start gap-2 p-3 mb-5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Email Tab */}
          {tab === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-4" noValidate>
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t.email}</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
                  <input
                    ref={emailRef}
                    id="login-email" name="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false}
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (invalid.email) setInvalid((v) => ({ ...v, email: false })); }}
                    placeholder="you@example.com"
                    aria-invalid={invalid.email ? 'true' : undefined}
                    aria-describedby={invalid.email && error ? 'login-error' : undefined}
                    className={`${inputBase} pe-4 ${inputBorder(invalid.email)}`}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t.password}</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
                  <input
                    ref={passwordRef}
                    id="login-password" name="password" autoComplete="current-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (invalid.password) setInvalid((v) => ({ ...v, password: false })); }}
                    placeholder="••••••••"
                    aria-invalid={invalid.password ? 'true' : undefined}
                    aria-describedby={invalid.password && error ? 'login-error' : undefined}
                    className={`${inputBase} pe-12 ${inputBorder(invalid.password)}`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={ar ? (showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور') : (showPassword ? 'Hide password' : 'Show password')} aria-pressed={showPassword} className="absolute end-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                    {showPassword ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
                  </button>
                </div>
              </div>

              <div className="text-end">
                <Link href="/forgot-password" className="inline-block py-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">{t.forgotPassword}</Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : null}
                {t.login}
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-600" />
            <span className="text-sm text-slate-400 dark:text-slate-500">{t.authOr}</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-600" />
          </div>

          {/* Google */}
          <GoogleSignInButton
            language={language}
            context="signin"
            onSuccess={onGoogleSuccess}
            onError={(m) => fail(m)}
            onBusyChange={setLoading}
          />

          {/* Sign Up link */}
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
            {t.dontHaveAccount}{' '}
            <Link href={signupHref} className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
              {t.signup}
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">© {ar ? '٢٠٢٦' : '2026'} {t.brandName}</p>
      </div>
    </div>
  );
}
