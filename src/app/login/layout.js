import { privatePageMetadata } from '../../lib/seo';

// Per-language title ("... | ورشة أحمد للتبريد" / "... | Ahmed Cooling Workshop"), noindex, no canonical
export function generateMetadata() {
  return privatePageMetadata(
    '/login',
    { ar: 'تسجيل الدخول', en: 'Log In' },
    { ar: 'سجّل الدخول إلى حسابك في ورشة أحمد للتبريد لحجز صيانة المكيفات والأجهزة المنزلية ومتابعة حجوزاتك.', en: 'Log in to your Ahmed Cooling Workshop account to book AC and appliance repair and track your bookings.' },
  );
}

export default function LoginLayout({ children }) {
  return children;
}
