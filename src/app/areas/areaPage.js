// Shared metadata and JSON-LD for the area pages (/areas, /areas/<city>, /areas/<city>/<district>).
import { ogLocale, OG_IMAGE, BRAND } from '../../lib/seo';
import { langAlternates, absoluteUrl, pathForLang, SITE_URL } from '../../lib/lang';
import { VISIT_FEE } from '../../lib/servicesData';

export const LOCAL_BUSINESS_ID = `${SITE_URL}/#localbusiness`;

// Revalidate like the services pages (prices come from loadServices(), cached 5 minutes)
export const AREA_REVALIDATE = 300;

export function areaMetadata({ path, lang, title, description }) {
  return {
    title: { absolute: title },
    description,
    alternates: langAlternates(path, lang),
    openGraph: {
      type: 'website',
      title,
      description,
      url: absoluteUrl(path, lang),
      locale: ogLocale(lang),
      alternateLocale: [ogLocale(lang === 'en' ? 'ar' : 'en')],
      siteName: `${BRAND.en} - ${BRAND.ar}`,
      // A page-level openGraph replaces the root one, so the share image is repeated here
      images: [OG_IMAGE[lang]],
    },
    twitter: { card: 'summary_large_image', title, description, images: [OG_IMAGE[lang].url] },
  };
}

// Metadata for an unknown city/district: the page answers 404, with no canonical/hreflang pointing at the bogus URL
export const notFoundMetadata = {
  robots: { index: false, follow: true },
  alternates: { canonical: null, languages: {} },
};

// Breadcrumb trail [{ name, path }] -> visible items (href in the page language) and BreadcrumbList items (absolute)
export function crumbs(trail, lang) {
  return {
    items: trail.map((c) => ({ name: c.name, href: pathForLang(c.path, lang) })),
    jsonLd: trail.map((c) => ({ name: c.name, url: absoluteUrl(c.path, lang) })),
  };
}

const cityPlace = (city) => ({
  '@type': 'City',
  name: city.en,
  alternateName: city.ar,
  containedInPlace: { '@type': 'Country', name: 'Saudi Arabia' },
});

// Service JSON-LD for a city hub (district = null) or a district page
export function serviceJsonLd({ city, district, lang, path, name, description, svc }) {
  const areaServed = district
    ? { '@type': 'Place', name: `${district.en}, ${city.en}`, alternateName: `${district.ar}، ${city.ar}`, containedInPlace: cityPlace(city) }
    : cityPlace(city);
  const offers = svc.groups.flatMap((g) => g.items).map((s) => ({
    '@type': 'Offer',
    itemOffered: { '@type': 'Service', name: (lang === 'ar' ? s.nameAr : null) || s.name, url: absoluteUrl(`/services/${s.slug}`, lang) },
    priceSpecification: { '@type': 'PriceSpecification', minPrice: s.basePrice, priceCurrency: 'SAR' },
  }));
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${absoluteUrl(path, lang)}#service`,
    name,
    description,
    serviceType: 'Air conditioner and home appliance repair',
    url: absoluteUrl(path, lang),
    inLanguage: lang === 'ar' ? 'ar-SA' : 'en-SA',
    provider: { '@id': LOCAL_BUSINESS_ID },
    areaServed,
    hoursAvailable: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '00:00',
      closes: '23:59',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: lang === 'ar' ? `الخدمات والأسعار (تضاف رسوم زيارة ${VISIT_FEE} ريال)` : `Services and prices (plus a ${VISIT_FEE} SAR visit fee)`,
      itemListElement: offers,
    },
  };
}
