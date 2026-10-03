// Language URL scheme: Arabic (the default) lives at the plain URL, English lives under /en.
//   /services -> Arabic      /en/services -> English
// Only public, indexable pages get an English URL. Account/booking pages keep one URL; their language comes from the cookie.
export const SITE_URL = 'https://www.ahmedcoolingworkshop.com';
export const LANG_COOKIE = 'lang';

const PUBLIC_EXACT = ['/', '/about', '/contact', '/privacy', '/services'];

// Path without any language prefix, e.g. /en/services -> /services, /en -> /
export function stripLang(pathname = '/') {
  if (pathname === '/en') return '/';
  if (pathname.startsWith('/en/')) return pathname.slice(3) || '/';
  return pathname || '/';
}

export const hasEnPrefix = (pathname = '') => pathname === '/en' || pathname.startsWith('/en/');

export function isLangPath(path) {
  const p = stripLang(path);
  return PUBLIC_EXACT.includes(p) || p.startsWith('/services/');
}

// Same page in the other language. Non-public paths are returned unchanged.
export function pathForLang(pathname, lang) {
  const base = stripLang(pathname);
  if (!isLangPath(base)) return base;
  if (lang !== 'en') return base;
  return base === '/' ? '/en' : `/en${base}`;
}

// Absolute URL of a language-neutral path, e.g. absoluteUrl('/about', 'en') -> https://.../en/about
export function absoluteUrl(path, lang = 'ar') {
  const p = pathForLang(path, lang);
  return p === '/' ? SITE_URL : `${SITE_URL}${p}`;
}

// Canonical + hreflang block for Next metadata. x-default points at the default (Arabic) URL.
export function langAlternates(path, lang) {
  return {
    canonical: absoluteUrl(path, lang),
    languages: {
      'ar-SA': absoluteUrl(path, 'ar'),
      'en-SA': absoluteUrl(path, 'en'),
      'x-default': absoluteUrl(path, 'ar'),
    },
  };
}
