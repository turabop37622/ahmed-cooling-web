'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, User, Phone, AlertCircle, Loader2, ChevronDown, CheckCircle2, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { signupEmail, verifyOTP, resendOTP } from '../../lib/api';
import { safeRedirect } from '../../lib/safeRedirect';
import { authErrorMessage } from '../login/authMessages';
import GoogleSignInButton from '../login/GoogleSignInButton';

const COUNTRY_CODES = [
  { code: '+966', label: 'SA +966', phonePlaceholder: '5XXXXXXXX', regex: /^5\d{8}$/ },
];

// The redirect query value is read by the server page (page.js) and passed in
export default function SignupForm({ redirect: redirectParam }) {
  const router = useRouter();
  const redirectUrl = safeRedirect(redirectParam);

  const { login } = useAuth();
  const { t, language, toAr } = useTranslation();

  const [step, setStep] = useState('form'); // 'form' | 'otp'

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryIdx, setCountryIdx] = useState(0);
  const [ccOpen, setCcOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resending, setResending] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const country = COUNTRY_CODES[countryIdx];
  const ar = language === 'ar';
  // Live feedback once the user has typed something
  const passwordTooShort = password.length > 0 && password.length < 6;
  const confirmMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const [invalidField, setInvalidField] = useState('');

  const FIELD_IDS = { name: 'signup-name', email: 'signup-email', password: 'signup-password', confirm: 'signup-confirm', phone: 'signup-phone' };
  const fail = (message, field) => {
    setError(message);
    setInvalidField(field || '');
    if (field) setTimeout(() => document.getElementById(FIELD_IDS[field])?.focus(), 0);
  };

  const validate = () => {
    if (!name.trim()) return [t.valFullNameRequired, 'name'];
    if (!email.trim()) return [t.valEmailRequired, 'email'];
    if (!/\S+@\S+\.\S+/.test(email)) return [t.valInvalidEmail, 'email'];

    const DISPOSABLE_DOMAINS = [
      'tempmail.com', 'mailinator.com', 'yopmail.com', 'guerrillamail.com', 
      'gixpos.com', 'vintomland.com', 'tempm.com', 'mail.tm', 'vertexinbox.com'
    ];
    if (DISPOSABLE_DOMAINS.includes(email.split('@')[1]?.toLowerCase())) {
      return [ar ? 'البريد الإلكتروني المؤقت غير مسموح به' : 'Temporary emails are not allowed', 'email'];
    }

    if (!password) return [t.valPasswordRequired, 'password'];
    if (password.length < 6) return [t.valPasswordMin6, 'password'];
    if (!confirmPassword) return [t.valConfirmPasswordRequired, 'confirm'];
    if (password !== confirmPassword) return [t.valPasswordsMismatch, 'confirm'];
    if (!phoneNumber.trim()) return [t.valPhoneRequired, 'phone'];
    if (!country.regex.test(phoneNumber)) {
      return [t.valPhoneSa, 'phone'];
    }
    return null;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setInvalidField('');

    const validationError = validate();
    if (validationError) return fail(validationError[0], validationError[1]);

    setLoading(true);
    try {
      const fullPhone = country.code + phoneNumber;
      await signupEmail({ fullName: name.trim(), name: name.trim(), email: email.trim(), password, phone: fullPhone });
      setStep('otp');
    } catch (err) {
      const msg = String(err?.response?.data?.message || err?.response?.data?.error || '');
      const field = /phone|saudi/i.test(msg) ? 'phone' : /email/i.test(msg) ? 'email' : /password/i.test(msg) ? 'password' : /name/i.test(msg) ? 'name' : '';
      fail(authErrorMessage(err, language, [t.authMsgRegistrationFailed || 'تعذر إنشاء الحساب.', t.authMsgRegistrationFailed || 'Registration failed.']), field);
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
      const el = document.getElementById(`otp-${idx + 1}`);
      el?.focus();
    }
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      const el = document.getElementById(`otp-${idx - 1}`);
      el?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = [...otp];
    for (let i = 0; i < 6; i++) next[i] = pasted[i] || '';
    setOtp(next);
    const focusIdx = Math.min(pasted.length, 5);
    document.getElementById(`otp-${focusIdx}`)?.focus();
  };

  const handleVerify = async () => {
    setError('');
    const code = otp.join('');
    if (code.length < 6) return setError(t.invalidOTP);

    setLoading(true);
    try {
      const response = await verifyOTP({ email: email.trim(), otp: code });
      const fullPhone = country.code + phoneNumber.trim();
      const userProfile = {
        fullName: name.trim(),
        name: name.trim(),
        email: email.trim(),
        phone: fullPhone,
        ...(response?.user || {}),
      };

      if (response?.token) {
        login({
          token: response.token,
          user: userProfile,
        });
        router.push(redirectUrl);
      } else {
        // Direct user to login with verified notice
        router.push(`/login?verified=true${redirectUrl !== '/' ? `&redirect=${encodeURIComponent(redirectUrl)}` : ''}`);
      }
    } catch (err) {
      setError(authErrorMessage(err, language, [t.invalidOTP, t.invalidOTP]));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setResending(true);
    try {
      await resendOTP({ email: email.trim() });
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      setError(authErrorMessage(err, language, [t.authMsgFailedResend, t.authMsgFailedResend]));
    } finally {
      setResending(false);
    }
  };

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

          {step === 'form' && (
            <>
              <h1 className="text-xl font-semibold text-slate-800 dark:text-white text-center mb-6">{t.createAccount}</h1>

              {/* Error */}
              {error && (
                <div id="signup-error" role="alert" className="flex items-start gap-2 p-3 mb-5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <form onSubmit={handleSignup} className="space-y-4" noValidate>
                {/* Name */}
                <div>
                  <label htmlFor="signup-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t.name}</label>
                  <div className="relative">
                    <User className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                  id="signup-name" aria-invalid={invalidField === 'name' ? 'true' : undefined} aria-describedby={invalidField === 'name' ? 'signup-error' : undefined} name="name" autoComplete="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t.namePlaceholder}
                      className="w-full ps-10 pe-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="signup-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t.email}</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                  id="signup-email" aria-invalid={invalidField === 'email' ? 'true' : undefined} aria-describedby={invalidField === 'email' ? 'signup-error' : undefined} name="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full ps-10 pe-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="signup-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t.password}</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                  id="signup-password" name="new-password" autoComplete="new-password" minLength={6}
                      aria-invalid={passwordTooShort || invalidField === 'password' ? 'true' : undefined}
                      aria-describedby="signup-password-hint"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full ps-10 pe-12 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={language === 'ar' ? (showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور') : (showPassword ? 'Hide password' : 'Show password')} aria-pressed={showPassword} className="absolute end-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p id="signup-password-hint" aria-live="polite" className={`text-xs mt-1 ${passwordTooShort ? 'text-red-600 dark:text-red-400' : password.length >= 6 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    {password.length >= 6
                      ? (ar ? '✓ طول كلمة المرور مناسب' : '✓ Password length is good')
                      : passwordTooShort
                        ? `${t.valPasswordMin6} (${toAr(password.length)}/${toAr(6)})`
                        : t.valPasswordMin6}
                  </p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="signup-confirm" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t.confirmPasswordSignUp}</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                  id="signup-confirm" name="confirm-password" autoComplete="new-password"
                      aria-invalid={confirmMismatch || invalidField === 'confirm' ? 'true' : undefined}
                      aria-describedby="signup-confirm-hint"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full ps-10 pe-12 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={language === 'ar' ? (showConfirmPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور') : (showConfirmPassword ? 'Hide password' : 'Show password')} aria-pressed={showConfirmPassword} className="absolute end-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p id="signup-confirm-hint" aria-live="polite" className={`text-xs mt-1 min-h-[1rem] ${confirmMismatch ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {confirmMismatch ? t.valPasswordsMismatch : confirmPassword && password === confirmPassword ? (ar ? '✓ كلمتا المرور متطابقتان' : '✓ Passwords match') : ''}
                  </p>
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="signup-phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t.phone}</label>
                  <div className="flex gap-2">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setCcOpen(!ccOpen)}
                        className="flex items-center gap-1 h-full px-3 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 transition whitespace-nowrap"
                      >
                        {country.label}
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </button>
                      {ccOpen && (
                        <div className="absolute top-full left-0 mt-1 z-20 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl shadow-lg overflow-hidden">
                          {COUNTRY_CODES.map((cc, i) => (
                            <button
                              key={cc.code}
                              type="button"
                              onClick={() => { setCountryIdx(i); setCcOpen(false); setPhoneNumber(''); }}
                              className={`block w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 dark:hover:bg-slate-600 transition ${
                                i === countryIdx ? 'bg-blue-50 dark:bg-slate-600 text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-700 dark:text-slate-200'
                              }`}
                            >
                              {cc.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="relative flex-1">
                      <Phone className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                  id="signup-phone" aria-invalid={invalidField === 'phone' ? 'true' : undefined} aria-describedby={invalidField === 'phone' ? 'signup-error' : undefined} name="phone" autoComplete="tel-national" inputMode="numeric"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder={country.phonePlaceholder}
                        className="w-full ps-10 pe-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  {t.signup}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-600" />
                <span className="text-sm text-slate-400 dark:text-slate-500">{t.authOr}</span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-600" />
              </div>

              {/* Google (same component and flow as the login page) */}
              <GoogleSignInButton
                language={language}
                context="signup"
                onSuccess={(response) => { login(response); router.push(redirectUrl); }}
                onError={(m) => fail(m)}
                onBusyChange={setLoading}
              />

              {/* Sign In link */}
              <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
                {t.alreadyHaveAccount}{' '}
                <Link
                  href={redirectUrl !== '/' ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : '/login'}
                  className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                >
                  {t.signIn}
                </Link>
              </p>
            </>
          )}

          {/* OTP Step */}
          {step === 'otp' && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/40 mb-4">
                <CheckCircle2 className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">{t.verifyOTP}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                {t.enterOTP}
                <br />
                <span className="font-medium text-slate-700 dark:text-slate-300">{email}</span>
              </p>

              {/* Error */}
              {error && (
                <div id="signup-error" role="alert" className="flex items-start gap-2 p-3 mb-5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-left">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* OTP Input */}
              <div className="flex justify-center gap-2.5 mb-6" onPaste={handleOtpPaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-12 h-14 text-center text-xl font-semibold rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                ))}
              </div>

              {/* Verify Button */}
              <button
                type="button"
                onClick={handleVerify}
                disabled={loading || otp.join('').length < 6}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mb-4 cursor-pointer"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                {t.verifyOTP}
              </button>

              {/* Resend */}
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
                {resending ? t.loading : t.sendOTP}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">© {toAr(2026)} {t.brandName}</p>
      </div>
    </div>
  );
}
