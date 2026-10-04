import { getDistrict } from '../../../../lib/areas';
import { notFoundMetadata } from '../../areaPage';

// Only covers the 404 of an unknown district (see ../layout.js); real pages get their metadata from page.js.
export async function generateMetadata({ params }) {
  const { city, district } = await params;
  return getDistrict(city, district) ? {} : notFoundMetadata;
}

export default function DistrictLayout({ children }) {
  return children;
}
