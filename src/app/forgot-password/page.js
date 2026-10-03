'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, CheckCircle2, MessageCircle } from 'lucide-react';
import { useTranslation } from '../../contexts/TranslationContext';
import { forgotPassword, verifyResetOTP, resetPassword } from '../../lib/api';
import { authErrorMessage } from '../login/authMessages';

// The backend resets passwords by email code only (routes/auth.js: /forgot-password, /verify-reset-otp, /reset-password).
// Accounts registered with a phone number are helped over WhatsApp instead.
const WHATSAPP_RESET_URL = 'https://wa.me/966590192146?text=' + encodeURIComponent('Hello, I registered with my phone number and need help resetting my password. / مرحباً، سجلت برقم جوالي وأحتاج مساعدة في إعادة تعيين كلمة المرور.');

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { t, language, toAr } = useTranslation();
  const ar = language === 'ar';

  const [step, setStep] = useState('email'); // 'email' | 'otp' | 'reset'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSendOTP = async (e) => {
    if (e) e.preventDefault();
    if (!email.trim()) return setError(t.valEmailRequired);
    if (!/\S+@\S+\.\S+/.test(email)) return setError(t.valInvalidEmail);

    setError('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setStep('otp');
    } catch (err) {
      setError(authErrorMessage(err, language, ['فشل إرسال الرمز. يرجى المحاولة لاحقاً.', 'Failed to send the reset code. Please try again later.']));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (idx, value) => {
    if (value && !/^\d$/.test(value)) return;
    const next = [...otp];
    next[idx] = value;
    setOtp(next);
    if (value && idx < 5) {
      document.getElementById(`otp-${idx + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus();
    }
  };

  const handleVerifyOTP = async (e) => {
    if (e) e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) return setError(t.invalidOTP);

    setError('');
    setLoading(true);
    try {
      await verifyResetOTP(email, code);
      setStep('reset');
    } catch (err) {
      setError(authErrorMessage(err, language, [t.invalidOTP, t.invalidOTP]));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password.length < 6) return setError(t.valPasswordMin6);
    if (password !== confirmPassword) return setError(t.valPasswordsMismatch);

    setError('');
    setLoading(true);
    try {
      await resetPassword(otp.join(''), password, email.trim());
      setSuccess(language === 'ar' ? 'تمت إعادة تعيين كلمة المرور بنجاح!' : 'Password reset successful!');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setError(authErrorMessage(err, language, ['تعذرت إعادة تعيين كلمة المرور. حاول مرة أخرى.', 'Password reset failed. Please try again.']));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-100 px-4 pt-12 pb-24 sm:px-8 lg:px-16 xl:px-24 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="w-full max-w-md">
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
          <h1 className="text-xl font-semibold text-slate-800 dark:text-white text-center mb-6">
            {language === 'ar' ? 'نسيت كلمة المرور' : 'Forgot Password'}
          </h1>

          {error && (
            <div role="alert" className="flex items-start gap-2 p-3 mb-5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div role="status" className="flex items-start gap-2 p-3 mb-5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-600 dark:text-emerald-400">{success}</p>
            </div>
          )}

          {step === 'email' && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                {language === 'ar' ? 'أدخل بريدك الإلكتروني لتلقي رمز التحقق' : 'Enter your email to receive a reset code'}
              </p>
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t.email}</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input id="forgot-email" name="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full ps-10 pe-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                {language === 'ar' ? 'إرسال رمز التحقق' : 'Send Reset Code'}
              </button>
            </form>
          )}

          {step === 'email' && (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm dark:border-emerald-800 dark:bg-emerald-950/30">
              <p className="font-semibold text-slate-800 dark:text-white">
                {ar ? 'سجّلت برقم الجوال؟' : 'Registered with a phone number?'}
              </p>
              <p className="mt-1 text-slate-600 dark:text-slate-300">
                {ar
                  ? 'إعادة التعيين عبر الرمز متاحة للبريد الإلكتروني فقط حالياً. تواصل معنا عبر واتساب وسنساعدك في إعادة تعيين كلمة المرور.'
                  : 'Code reset currently works by email only. Contact us on WhatsApp and we will help you reset your password.'}
              </p>
              <a
                href={WHATSAPP_RESET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                {ar ? 'تواصل معنا عبر واتساب' : 'Contact us on WhatsApp'}
                <span dir="ltr" className="font-normal opacity-90">{ar ? '+٩٦٦ ٥٩ ٠١٩ ٢١٤٦' : '+966 59 019 2146'}</span>
              </a>
            </div>
          )}

          {step === 'otp' && (
            <div className="space-y-6">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                {language === 'ar' ? `أدخل رمز التحقق المرسل إلى ${email}` : `Enter the verification code sent to ${email}`}
              </p>
              <div className="flex justify-center gap-2" dir="ltr">
                {otp.map((digit, idx) => (
                  <input name={`otp-${idx}`} autoComplete={idx === 0 ? 'one-time-code' : 'off'} inputMode="numeric"
                    aria-label={ar ? `الرقم ${toAr(idx + 1)} من ${toAr(6)}` : `Digit ${idx + 1} of 6`}
                    key={idx}
                    id={`otp-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-12 h-14 text-center text-xl font-semibold rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={handleVerifyOTP}
                disabled={loading || otp.join('').length < 6}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                {language === 'ar' ? 'تحقق من الرمز' : 'Verify Code'}
              </button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleSendOTP}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  disabled={loading}
                >
                  {language === 'ar' ? 'إعادة إرسال الرمز' : 'Resend Code'}
                </button>
              </div>
            </div>
          )}

          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                {language === 'ar' ? 'أدخل كلمة المرور الجديدة' : 'Enter your new password'}
              </p>
              <div>
                <label htmlFor="forgot-new-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t.password}</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input id="forgot-new-password" name="new-password" autoComplete="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full ps-10 pe-12 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={language === 'ar' ? (showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور') : (showPassword ? 'Hide password' : 'Show password')} aria-pressed={showPassword} className="absolute end-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-slate-400">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="forgot-confirm-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t.confirmPasswordSignUp}</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input id="forgot-confirm-password" name="confirm-password" autoComplete="new-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full ps-10 pe-12 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    required
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={language === 'ar' ? (showConfirmPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور') : (showConfirmPassword ? 'Hide password' : 'Show password')} aria-pressed={showConfirmPassword} className="absolute end-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-slate-400">
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                {language === 'ar' ? 'إعادة تعيين كلمة المرور' : 'Reset Password'}
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 text-center">
            <Link href="/login" className="inline-flex items-center gap-2 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              {language === 'ar' ? 'العودة لتسجيل الدخول' : 'Back to Login'}
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">© {toAr(2026)} {t.brandName}</p>
      </div>
    </div>
  );
}
