import catalogue from './services.json';

// services.json mirrors the live database services (GET /api/services) plus the fixed-price packages.
// The DATABASE is the source of truth for names and prices; this file is only the fallback used when the API is down,
// and it is kept in sync with the database so even the fallback shows the right price.
// The backend reads the packages from this same file, so a package costs the same on the website and at booking.

// Regular (database) services
export const FALLBACK_SERVICES = catalogue.filter((s) => !s.isPackage);

// Fixed-price packages (pkg_diagnostic, pkg_summer, pkg_villa). The technician visit fee is INCLUDED in their price.
export const PACKAGES = catalogue.filter((s) => s.isPackage);

// Fixed technician visit fee added on top of every regular service price at booking (not on packages).
// Shown on service cards, the detail page and the booking summary so the total is never a surprise.
export const VISIT_FEE = 30;

export const isPackageId = (id) => /^pkg_/.test(String(id ?? ''));
export const isPackage = (service) => Boolean(service && (service.isPackage || isPackageId(service._id || service.id)));

// Visit fee charged on top of this service's price: 0 for packages (already included).
export const visitFeeFor = (service) => (isPackage(service) ? 0 : VISIT_FEE);

// Old bundled ids ('1'...'9') -> database id of the same service, so old links and bookings keep working.
const LEGACY_TO_ID = Object.fromEntries(catalogue.filter((s) => s.legacyId).map((s) => [s.legacyId, s._id]));
const ID_TO_LEGACY = Object.fromEntries(catalogue.filter((s) => s.legacyId).map((s) => [s._id, s.legacyId]));

export const resolveServiceId = (id) => {
  const key = String(id ?? '');
  return LEGACY_TO_ID[key] || key;
};

// Any id the site may meet (database id, old numeric id, package id) -> the bundled record, or null.
export function findCatalogueService(id) {
  const key = resolveServiceId(id);
  return catalogue.find((s) => s._id === key) || null;
}

// Each service gets its own rating between 4.0 and 5.0 (stable: the same service always shows the same score).
// Database services that replaced an old bundled service keep that service's rating.
const KNOWN_RATINGS = { '1': 4.8, '2': 4.6, '3': 4.9, '4': 4.4, '5': 4.7, '6': 4.3, '7': 4.5, '8': 4.2, '9': 4.1, pkg_villa: 5.0 };
export function getServiceRating(id) {
  const raw = String(id ?? '');
  const key = ID_TO_LEGACY[raw] || raw;
  if (key in KNOWN_RATINGS) return KNOWN_RATINGS[key];
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return (40 + (h % 11)) / 10;
}

// Id used by the review pool (old numeric id for services that existed before the database ids).
export const reviewKeyFor = (id) => ID_TO_LEGACY[String(id ?? '')] || String(id ?? '');

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ahmed-cooling-backend.onrender.com/api';
export const SERVICES_REVALIDATE_SECONDS = 300;

// Server-side list of services for server components (list page, detail page, metadata, sitemap).
// Cached for 5 minutes; falls back to the bundled copy only when the API is unreachable.
// Returns { services, live } where live=false means the fallback was used.
export async function loadServices() {
  try {
    const res = await fetch(`${API_URL}/services`, {
      next: { revalidate: SERVICES_REVALIDATE_SECONDS, tags: ['services'] },
      // A sleeping Render instance can take 30s+ to wake: do not hold the page for it, the bundled copy has the
      // same catalogue and the cached list is used again as soon as the API answers
      signal: AbortSignal.timeout(2500),
    });
    if (res.ok) {
      const data = await res.json();
      const list = data?.services ?? data?.data ?? data;
      if (Array.isArray(list) && list.length) return { services: list, live: true };
    }
  } catch {
    // API down or slow (Render cold start): use the bundled copy
  }
  return { services: FALLBACK_SERVICES, live: false };
}
