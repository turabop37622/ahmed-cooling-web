import { getCity } from '../../../lib/areas';
import { notFoundMetadata } from '../areaPage';

// Title, description, canonical and hreflang of a real city come from page.js. This layout only covers the 404:
// the not-found page does not use page.js metadata, so without this it would inherit the home page canonical.
export async function generateMetadata({ params }) {
  const { city } = await params;
  return getCity(city) ? {} : notFoundMetadata;
}

export default function CityLayout({ children }) {
  return children;
}
