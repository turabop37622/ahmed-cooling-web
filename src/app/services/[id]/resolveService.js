import { loadServices, PACKAGES } from '../../../lib/servicesData';
import { buildSlugIndex, idForLegacyId } from '../../../lib/serviceSlugs';

const decode = (seg) => {
  try {
    return decodeURIComponent(String(seg ?? ''));
  } catch {
    return String(seg ?? '');
  }
};

// Resolves the [id] URL segment of /services/[id] against the live database list (fallback: bundled copy).
//  { service, slug, services, slugs }  -> render (segment is the canonical slug)
//  { redirectSlug }                    -> the segment is an id (database / old numeric / package): redirect to the slug
//  { notFound: true }                  -> unknown slug or id: real 404
// Results are cheap to recompute: loadServices() is a cached fetch shared by generateMetadata and the page.
export async function resolveService(param) {
  const seg = decode(param).trim();
  const { services } = await loadServices();
  // Packages with a detail page (pkg_villa) are part of the URL space but not of the services list
  const all = [...services, ...PACKAGES.filter((p) => p.slug)];
  const { idToSlug, slugToId } = buildSlugIndex(all);
  const byId = (id) => all.find((s) => String(s._id || s.id) === String(id)) || null;

  if (!seg || seg.length > 120) return { notFound: true };

  const slugId = slugToId.get(seg);
  if (slugId) {
    const service = byId(slugId);
    // A fixed slug whose service is no longer active in the database is gone
    if (!service) return { notFound: true };
    return { service, slug: seg, services, slugs: Object.fromEntries(idToSlug) };
  }

  const id = idForLegacyId(seg) || seg;
  const service = byId(id);
  if (service && idToSlug.get(String(service._id || service.id))) {
    return { redirectSlug: idToSlug.get(String(service._id || service.id)) };
  }
  return { notFound: true };
}
