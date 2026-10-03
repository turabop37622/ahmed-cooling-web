import { headers } from 'next/headers';

// Language chosen for this request by src/proxy.js (URL prefix or cookie). Defaults to Arabic.
export async function getRequestLang() {
  try {
    const h = await headers();
    return h.get('x-lang') === 'en' ? 'en' : 'ar';
  } catch {
    return 'ar';
  }
}

// Matches the hreflang codes (ar-SA / en-SA) used in lib/lang.js
export const ogLocale = (lang) => (lang === 'en' ? 'en_SA' : 'ar_SA');

export const BRAND = { ar: 'ورشة أحمد للتبريد', en: 'Ahmed Cooling Workshop' };

// Social preview images: 1200x630 crops of the home hero banner (public/og/), one per language
export const OG_IMAGE = {
  ar: { url: '/og/og-ar.jpg', width: 1200, height: 630, alt: 'ورشة أحمد للتبريد - صيانة مكيفات جدة ومكة' },
  en: { url: '/og/og-en.jpg', width: 1200, height: 630, alt: 'Ahmed Cooling Workshop - AC repair in Jeddah & Makkah' },
};

// Metadata for private/app pages (login, bookings ...): one title per language ending with the brand name,
// noindex, and no canonical/hreflang (instead of the homepage canonical inherited from the root layout).
// titles: { ar, en }, descriptions (optional): { ar, en }
export async function privatePageMetadata(path, titles, descriptions) {
  const lang = await getRequestLang();
  const title = `${titles[lang]} | ${BRAND[lang]}`;
  return {
    title: { absolute: title },
    ...(descriptions ? { description: descriptions[lang] } : {}),
    robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
    alternates: { canonical: null }, // no canonical (and no hreflang) on noindex pages
    // A child openGraph/twitter object replaces the root one, so the image and site name are repeated here
    openGraph: { type: 'website', title, url: path, locale: ogLocale(lang), siteName: `${BRAND.en} - ${BRAND.ar}`, images: [OG_IMAGE[lang]] },
    twitter: { card: 'summary_large_image', title, images: [OG_IMAGE[lang].url] },
  };
}
