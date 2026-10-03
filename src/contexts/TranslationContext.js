'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { translations } from '../lib/translations';
import { hasEnPrefix, isLangPath, pathForLang } from '../lib/lang';

const TranslationContext = createContext(null);

const writeCookie = (lang) => {
  try {
    document.cookie = `lang=${lang}; path=/; max-age=31536000; samesite=lax`;
  } catch {}
};

const readCookie = () => {
  const m = document.cookie.match(/(?:^|;\s*)lang=(en|ar)/);
  return m ? m[1] : null;
};

const applyDocument = (lang) => {
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
};

// initialLang comes from the server (URL prefix /en or the lang cookie, see src/proxy.js), so the first paint is already correct.
export const TranslationProvider = ({ children, initialLang = 'ar' }) => {
  const pathname = usePathname();
  const [language, setLang] = useState(initialLang === 'en' ? 'en' : 'ar');

  useEffect(() => {
    try {
      const path = window.location.pathname;
      const onLangPath = isLangPath(path) || hasEnPrefix(path);
      const saved = localStorage.getItem('language');
      const cookie = readCookie();
      let lang = language;
      if (onLangPath) {
        // Public pages: the URL decides (a shared Arabic link stays Arabic even if the visitor prefers English)
        lang = hasEnPrefix(path) ? 'en' : 'ar';
        if (lang !== language) setLang(lang);
      } else if (saved === 'en' || saved === 'ar') {
        // App pages (login, booking ...) have one URL: use the remembered choice
        lang = saved;
        if (lang !== language) setLang(lang);
      }
      // Only the language toggle changes a saved preference; a first visit seeds it from the page language
      const pref = saved === 'en' || saved === 'ar' ? saved : cookie || lang;
      localStorage.setItem('language', pref);
      if (cookie !== pref) writeCookie(pref);
      applyDocument(lang);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Back/forward or a link between /x and /en/x: keep the language in step with the URL of public pages.
  // Moving on to an app page (login ...) uses the saved preference, like the server does.
  useEffect(() => {
    try {
      const path = window.location.pathname;
      let next;
      if (isLangPath(path) || hasEnPrefix(path)) {
        next = hasEnPrefix(path) ? 'en' : 'ar';
      } else {
        const saved = localStorage.getItem('language');
        next = saved === 'en' || saved === 'ar' ? saved : readCookie() || language;
      }
      if (next !== language) {
        setLang(next);
        applyDocument(next);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const setLanguage = (lang) => {
    if (lang !== 'en' && lang !== 'ar') return;
    setLang(lang);
    try {
      localStorage.setItem('language', lang);
    } catch {}
    writeCookie(lang);
    applyDocument(lang);
    // Public pages have a separate URL per language: go to the equivalent page
    const { pathname, search, hash } = window.location;
    if (isLangPath(pathname)) {
      const next = pathForLang(pathname, lang);
      // Full navigation: the server renders <html lang/dir>, title and hreflang for the new language
      if (next !== pathname) window.location.assign(next + search + hash);
    }
  };

  const t = translations[language] || translations.en;
  const isRTL = language === 'ar';

  const toAr = (val) => {
    if (language !== 'ar') return String(val);
    return String(val).replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
  };

  const formatPrice = (amount, currency = 'SAR') => {
    const num = Number(amount || 0);
    const currUpper = String(currency || 'SAR').toUpperCase();
    if (language === 'ar') {
      // Arabic digits with the Arabic thousands (٬) and decimal (٫) separators, e.g. ١٬٢٠٠
      const formatted = num.toLocaleString('en-US');
      const arNum = formatted
        .replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d])
        .replace(/,/g, '٬')
        .replace(/\./g, '٫');
      const symbol = 'ريال';
      return `${arNum} ${symbol}`;
    }
    return `${currUpper} ${num.toLocaleString()}`;
  };

  return (
    <TranslationContext.Provider value={{ t, language, isRTL, setLanguage, toAr, formatPrice }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) throw new Error('useTranslation must be used within TranslationProvider');
  return context;
};
