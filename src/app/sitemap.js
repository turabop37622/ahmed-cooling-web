import { absoluteUrl } from '../lib/lang';
import { loadServices, PACKAGES } from '../lib/servicesData';
import { buildSlugIndex } from '../lib/serviceSlugs';
import { allAreaPaths } from '../lib/areas';

// Fixed "last modified" for the static pages: bump it when their content changes.
// (Using new Date() would tell crawlers every page changed on every request.)
const SITE_UPDATED = new Date('2026-10-03T00:00:00Z');
// Area landing pages (/areas, city hubs, districts): bump when their copy changes
const AREAS_UPDATED = new Date('2026-10-04T00:00:00Z');

export const revalidate = 3600;

// Every language URL is listed with its hreflang alternates (Arabic = default URL, English = /en/...).
function localized(path, extra, lastModified = SITE_UPDATED) {
  const languages = {
    'ar-SA': absoluteUrl(path, 'ar'),
    'en-SA': absoluteUrl(path, 'en'),
    'x-default': absoluteUrl(path, 'ar'),
  };
  return ['ar', 'en'].map((lang) => ({
    url: absoluteUrl(path, lang),
    lastModified,
    alternates: { languages },
    ...extra,
  }));
}

const dateOr = (value, fallback) => {
  const d = value ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime()) ? d : fallback;
};

export default async function sitemap() {
  const base = 'https://www.ahmedcoolingworkshop.com';

  // Every active database service (fallback: bundled copy) plus the package that has its own page.
  // Canonical URLs use the descriptive slug (id URLs only redirect).
  const { services } = await loadServices();
  const pages = [...services, ...PACKAGES.filter((p) => p.slug)];
  const { idToSlug } = buildSlugIndex(pages);
  const serviceUrls = pages.flatMap((svc) => {
    const slug = idToSlug.get(String(svc._id || svc.id));
    if (!slug) return [];
    return localized(`/services/${slug}`, { changeFrequency: 'weekly', priority: 0.85 }, dateOr(svc.updatedAt, SITE_UPDATED));
  });

  // /areas (0.7), city hubs (0.8) and district pages (0.6)
  const areaUrls = allAreaPaths().flatMap((path) => {
    const depth = path.split('/').length - 2; // /areas -> 0, /areas/jeddah -> 1, /areas/jeddah/al-safa -> 2
    const priority = depth === 1 ? 0.8 : depth === 0 ? 0.7 : 0.6;
    return localized(path, { changeFrequency: 'monthly', priority }, AREAS_UPDATED);
  });

  return [
    ...localized('/', { changeFrequency: 'daily', priority: 1.0 }),
    ...localized('/services', { changeFrequency: 'weekly', priority: 0.9 }),
    ...serviceUrls,
    ...areaUrls,
    ...localized('/about', { changeFrequency: 'monthly', priority: 0.8 }),
    ...localized('/contact', { changeFrequency: 'monthly', priority: 0.8 }),
    { url: `${base}/rate`, lastModified: SITE_UPDATED, changeFrequency: 'monthly', priority: 0.6 },
    ...localized('/privacy', { changeFrequency: 'yearly', priority: 0.3 }),
  ];
}
