// Descriptive URL slugs for services, e.g. /services/ac-repair-jeddah.
// Every service (database or package) has one; ids in the URL (/services/<mongoId>, /services/1) redirect to it.
// This file is imported by the proxy, the sitemap and the pages, so it must stay dependency-free (JSON only).
import catalogue from './services.json';

const SLUG_SUFFIX = '-jeddah';

// "Stove & Oven Repair" -> "stove-oven-repair-jeddah"
export function slugify(name) {
  const base = String(name ?? '')
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base ? `${base}${SLUG_SUFFIX}` : '';
}

// Fixed slugs of the bundled services (database services + packages). These never change, even if a name is edited.
const ID_TO_SLUG = {};
const SLUG_TO_ID = {};
// Old URLs that must keep working: old numeric ids and the plain name-derived slug when it differs from the fixed one.
const LEGACY_ID_TO_ID = {};
const ALIAS_TO_ID = {};
for (const s of catalogue) {
  if (!s.slug) continue;
  ID_TO_SLUG[s._id] = s.slug;
  SLUG_TO_ID[s.slug] = s._id;
  if (s.legacyId) LEGACY_ID_TO_ID[s.legacyId] = s._id;
}
for (const s of catalogue) {
  const derived = slugify(s.name);
  if (s.slug && derived && derived !== s.slug && !SLUG_TO_ID[derived]) ALIAS_TO_ID[derived] = s._id;
}

export const isMongoId = (v) => /^[a-f0-9]{24}$/i.test(String(v ?? ''));
export const isLegacyId = (v) => Object.prototype.hasOwnProperty.call(LEGACY_ID_TO_ID, String(v ?? ''));

// Canonical slug of a known id (database id, old numeric id or package id), or null when this file does not know it.
export function slugForId(id) {
  const key = String(id ?? '');
  return ID_TO_SLUG[LEGACY_ID_TO_ID[key] || key] || null;
}

// Fixed slug -> id. Also accepts the alias slugs (see canonicalSlug to redirect them).
export const idForSlug = (slug) => SLUG_TO_ID[String(slug ?? '')] || ALIAS_TO_ID[String(slug ?? '')] || null;

// For an alias (an old or name-derived URL) the canonical slug to redirect to; null when slug is already canonical/unknown.
export function canonicalSlugFor(slug) {
  const id = ALIAS_TO_ID[String(slug ?? '')];
  return id ? ID_TO_SLUG[id] : null;
}

// Slug stored on the record by the API (set once on create, never changed by a rename), or '' when absent.
const storedSlug = (service) => {
  const s = service && typeof service.slug === 'string' ? service.slug.trim() : '';
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s) ? s : '';
};

// Slug of a service record: the slug stored by the API, else its fixed slug, else one derived from the English name.
export function serviceSlug(service) {
  if (!service) return '';
  const id = service._id || service.id;
  return storedSlug(service) || slugForId(id) || slugify(service.name) || String(id ?? '');
}

// Unique slug for every service of a list (two services with the same English name get -2, -3 ...).
// Services are processed in id order so the result does not depend on the API sort order.
// A slug stored by the API wins; the fixed slug of a bundled service keeps resolving as well.
export function buildSlugIndex(list = []) {
  const idToSlug = new Map();
  const slugToId = new Map();
  const taken = new Set(Object.keys(SLUG_TO_ID));
  for (const [slug, id] of Object.entries(SLUG_TO_ID)) slugToId.set(slug, id);
  for (const [id, slug] of Object.entries(ID_TO_SLUG)) idToSlug.set(id, slug);
  const sorted = list
    .filter(Boolean)
    .sort((a, b) => String(a._id || a.id).localeCompare(String(b._id || b.id)));
  // Stored slugs first, so name-derived slugs of other services cannot take them
  for (const s of sorted) {
    const id = String(s._id || s.id);
    const slug = storedSlug(s);
    if (!slug) continue;
    const owner = slugToId.get(slug);
    if (owner && owner !== id) continue; // taken by another service: keep the fallback below
    taken.add(slug);
    idToSlug.set(id, slug);
    slugToId.set(slug, id);
  }
  const rest = sorted.filter((s) => !idToSlug.has(String(s._id || s.id)));
  for (const s of rest) {
    const id = String(s._id || s.id);
    const base = serviceSlug(s);
    let slug = base;
    for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
    taken.add(slug);
    idToSlug.set(id, slug);
    slugToId.set(slug, id);
  }
  return { idToSlug, slugToId };
}

// Path segment to use in a link: the slug when the service is known, otherwise the id itself
// (the detail page then redirects the id to the slug).
export function serviceSegment(idOrService) {
  if (idOrService && typeof idOrService === 'object') return serviceSlug(idOrService);
  return slugForId(idOrService) || String(idOrService ?? '');
}

// Public detail-page path for a service (pass the service object or its id), e.g. /services/ac-repair-jeddah.
// Pass lang 'en' to get the English URL (/en/services/...). Arabic is the default and has no prefix.
export function servicePath(idOrService, lang = 'ar') {
  const prefix = lang === 'en' ? '/en' : '';
  if (idOrService === undefined || idOrService === null || idOrService === '') return `${prefix}/services`;
  return `${prefix}/services/${serviceSegment(idOrService)}`;
}

// Old numeric id ('1'...'9') -> database id, so /book/1 and old links keep working.
export const idForLegacyId = (id) => LEGACY_ID_TO_ID[String(id ?? '')] || null;
