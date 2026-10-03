import { privatePageMetadata } from '../../lib/seo';

// Per-language title ("... | ورشة أحمد للتبريد" / "... | Ahmed Cooling Workshop"), noindex, no canonical
export function generateMetadata() {
  return privatePageMetadata(
    '/bookings',
    { ar: 'حجوزاتي', en: 'My Bookings' },
  );
}

export default function BookingsLayout({ children }) {
  return children;
}
