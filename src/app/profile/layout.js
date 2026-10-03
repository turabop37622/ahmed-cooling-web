import { privatePageMetadata } from '../../lib/seo';

// Per-language title ("... | ورشة أحمد للتبريد" / "... | Ahmed Cooling Workshop"), noindex, no canonical
export function generateMetadata() {
  return privatePageMetadata(
    '/profile',
    { ar: 'الملف الشخصي', en: 'My Profile' },
  );
}

export default function ProfileLayout({ children }) {
  return children;
}
