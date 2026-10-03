import { NextResponse } from 'next/server';
import { hasEnPrefix, stripLang, isLangPath, LANG_COOKIE } from './lib/lang';
import { slugForId, canonicalSlugFor, idForLegacyId } from './lib/serviceSlugs';

// Language routing (Arabic at /..., English at /en/...) and service slug URLs.
//  - /en/<page>            -> rewritten to /<page>, rendered in English (header x-lang: en)
//  - /services/<id>        -> 301 to /services/<slug> (old numeric, database and package ids; old alias slugs too)
//  - /services/<slug>      -> rendered by app/services/[id], which resolves the slug against the database list
//  - /book/<old number>    -> 301 to /book/<database id>
//  - public pages: the URL is the source of truth (plain = Arabic, /en = English), so a shared Arabic link stays Arabic
//    even for a visitor whose saved preference is English. Only the bare home page "/" follows the "lang=en" cookie
//    (crawlers have no cookie).
//  - app pages (login, bookings ...) have one URL; their language comes from the cookie.
// Known app pages that may be requested with a stray /en prefix (old links) and are 301'd to their single URL.
// Any other /en/<unknown> path is left alone so it 404s directly instead of redirecting to an Arabic URL.
const APP_PATHS = ['/login', '/signup', '/forgot-password', '/bookings', '/profile', '/book', '/rate'];
const isAppPath = (p) => APP_PATHS.some((a) => p === a || p.startsWith(`${a}/`));

export function proxy(req) {
  const { pathname, search } = req.nextUrl;
  if (pathname === '/admin' || pathname.startsWith('/admin/')) return NextResponse.next();
  const prefixed = hasEnPrefix(pathname);
  const path = stripLang(pathname);
  const cookieLang = req.cookies.get(LANG_COOKIE)?.value === 'en' ? 'en' : 'ar';

  // Old numeric booking links (/book/1 ... /book/9) -> the database id of the same service
  const book = path.match(/^\/book\/([^/]+)$/);
  if (book) {
    const dbId = idForLegacyId(safeDecode(book[1]));
    if (dbId) {
      const url = req.nextUrl.clone();
      url.pathname = `/book/${dbId}`;
      return NextResponse.redirect(url, 301);
    }
  }

  if (!isLangPath(path)) {
    if (prefixed) {
      if (isAppPath(path)) {
        const url = req.nextUrl.clone();
        url.pathname = path;
        return NextResponse.redirect(url, 301);
      }
      // No such English page: render the 404 in English, no redirect
      return next(req, 'en');
    }
    return next(req, cookieLang);
  }

  const lang = prefixed ? 'en' : 'ar';
  const redirectBase = lang === 'en' ? '/en' : '';

  // Service URLs: every known id (old numeric, database id, package id) and every old alias slug 301s to the
  // descriptive canonical slug. Slugs themselves are rendered by app/services/[id], which resolves them against the
  // database list (and redirects database ids this file does not know yet, or 404s unknown values).
  const m = path.match(/^\/services\/([^/]+)$/);
  const target = path;
  if (m) {
    const seg = safeDecode(m[1]);
    const slug = slugForId(seg) || canonicalSlugFor(seg);
    if (slug && slug !== seg) {
      const url = req.nextUrl.clone();
      url.pathname = `${redirectBase}/services/${slug}`;
      return NextResponse.redirect(url, 301);
    }
  }

  // Bare home page + English preference: send the visitor to the English home page. Deep links are never redirected.
  if (!prefixed && path === '/' && cookieLang === 'en') {
    const url = req.nextUrl.clone();
    url.pathname = '/en';
    const res = NextResponse.redirect(url, 307);
    res.headers.set('Cache-Control', 'private, no-store');
    res.headers.set('Vary', 'Cookie');
    return res;
  }

  if (prefixed || target !== path) {
    const url = req.nextUrl.clone();
    url.pathname = target;
    url.search = search;
    return NextResponse.rewrite(url, { request: { headers: withLang(req, lang) } });
  }
  return next(req, lang);
}

function safeDecode(seg) {
  try {
    return decodeURIComponent(seg);
  } catch {
    return seg;
  }
}

function withLang(req, lang) {
  const headers = new Headers(req.headers);
  headers.set('x-lang', lang);
  return headers;
}

function next(req, lang) {
  return NextResponse.next({ request: { headers: withLang(req, lang) } });
}

export const config = {
  // Everything except Next internals, API routes and files with an extension (images, sitemap.xml, robots.txt ...).
  // The admin area is skipped inside proxy() because it is not part of the language routing.
  matcher: ['/((?!_next/|api/|.*\\.[a-zA-Z0-9]+$).*)'],
};
