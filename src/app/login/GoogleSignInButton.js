'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { socialAuth } from '../../lib/api';
import { authErrorMessage } from './authMessages';

// "Continue with Google" via Google Identity Services (accounts.google.com/gsi/client).
// Google renders its own button (an iframe), the user picks an account in Google's popup and GIS hands us an ID token
// (a signed JWT). The backend verifies it (POST /api/auth/social { idToken }: signature/expiry via Google's tokeninfo,
// audience = this client id) and returns our session token. Replaces the deprecated implicit flow (response_type=token).
// The client id must list this site's origin under "Authorized JavaScript origins" in Google Cloud Console.
const CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '506685890879-rcuen5qa0bom1f4asc89ah29k8ernt59.apps.googleusercontent.com';
const GSI_SRC = 'https://accounts.google.com/gsi/client';

let gsiPromise = null;
function loadGsi() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.google?.accounts?.id) return Promise.resolve(window.google);
  if (gsiPromise) return gsiPromise;
  gsiPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = GSI_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => (window.google?.accounts?.id ? resolve(window.google) : reject(new Error('gsi missing')));
    s.onerror = () => {
      gsiPromise = null;
      s.remove();
      reject(new Error('gsi load failed'));
    };
    document.head.appendChild(s);
  });
  return gsiPromise;
}

// onSuccess(response) receives the backend login response ({ token, user }); onError(message) a localized message.
export default function GoogleSignInButton({ language = 'ar', onSuccess, onError, onBusyChange, context = 'signin' }) {
  const boxRef = useRef(null);
  const [state, setState] = useState('loading'); // loading | ready | failed | busy
  // Keep the latest callbacks without re-initialising GIS on every render
  const cb = useRef({ onSuccess, onError, onBusyChange, language });
  cb.current = { onSuccess, onError, onBusyChange, language };

  useEffect(() => {
    let cancelled = false;
    loadGsi()
      .then((google) => {
        if (cancelled || !boxRef.current) return;
        google.accounts.id.initialize({
          client_id: CLIENT_ID,
          ux_mode: 'popup',
          context,
          use_fedcm_for_button: true,
          callback: async ({ credential }) => {
            const { onSuccess: ok, onError: fail, onBusyChange: busy, language: lang } = cb.current;
            if (!credential) {
              fail?.(authErrorMessage({ response: { data: { message: 'Google login failed' } } }, lang));
              return;
            }
            setState('busy');
            busy?.(true);
            try {
              const response = await socialAuth({ idToken: credential });
              ok?.(response);
            } catch (err) {
              fail?.(authErrorMessage(err, lang, ['تعذر تسجيل الدخول عبر Google. حاول مرة أخرى.', 'Google sign-in failed. Please try again.']));
            } finally {
              setState('ready');
              busy?.(false);
            }
          },
        });
        const width = Math.min(400, Math.max(200, Math.round(boxRef.current.getBoundingClientRect().width || 320)));
        const dark = document.documentElement.classList.contains('dark');
        google.accounts.id.renderButton(boxRef.current, {
          type: 'standard',
          theme: dark ? 'filled_black' : 'outline',
          size: 'large',
          shape: 'pill',
          text: context === 'signup' ? 'signup_with' : 'continue_with',
          logo_alignment: 'center',
          width,
          locale: language === 'ar' ? 'ar' : 'en',
        });
        setState('ready');
      })
      .catch(() => {
        if (!cancelled) setState('failed');
      });
    return () => {
      cancelled = true;
    };
    // Re-render the button when the page language changes so Google's label matches
  }, [language, context]);

  return (
    <div className="w-full">
      <div
        ref={boxRef}
        data-testid="google-signin"
        // Google's button is an iframe. When the page uses a dark color-scheme the browser paints the iframe's
        // background white (a white box around the pill); a light scheme on the wrapper keeps it transparent.
        style={{ colorScheme: 'light' }}
        className={`flex min-h-[44px] w-full justify-center ${state === 'busy' ? 'pointer-events-none opacity-60' : ''}`}
        aria-busy={state === 'loading' || state === 'busy'}
      />
      {state === 'loading' && (
        <div className="-mt-[44px] flex h-[44px] w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {language === 'ar' ? 'جارٍ تحميل تسجيل الدخول عبر Google…' : 'Loading Google sign-in…'}
        </div>
      )}
      {state === 'failed' && (
        <p role="alert" className="-mt-[44px] flex min-h-[44px] items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-3 text-center text-xs font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          {language === 'ar'
            ? 'تعذر تحميل تسجيل الدخول عبر Google. تحقق من اتصالك أو مانع الإعلانات ثم أعد تحميل الصفحة.'
            : 'Google sign-in could not load. Check your connection or ad blocker, then reload the page.'}
        </p>
      )}
    </div>
  );
}
