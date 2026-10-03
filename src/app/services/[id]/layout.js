import { resolveService } from './resolveService';

// Title, description, canonical and hreflang of a real service come from page.js. This layout only covers the 404:
// the not-found page does not use page.js metadata, so without this it would inherit the home page canonical.
export async function generateMetadata({ params }) {
  const { id } = await params;
  const r = await resolveService(id);
  if (r.service || r.redirectSlug) return {};
  return {
    robots: { index: false, follow: true },
    alternates: { canonical: null, languages: {} },
  };
}

export default function ServiceDetailLayout({ children }) {
  return children;
}
