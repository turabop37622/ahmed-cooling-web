import { privatePageMetadata } from '../../lib/seo';

// Per-language title ("... | ورشة أحمد للتبريد" / "... | Ahmed Cooling Workshop"), noindex, no canonical
export function generateMetadata() {
  return privatePageMetadata(
    '/signup',
    { ar: 'إنشاء حساب', en: 'Sign Up' },
    { ar: 'أنشئ حسابك لحجز صيانة المكيفات والثلاجات والغسالات في جدة ومكة.', en: 'Create your account to book AC, refrigerator and washing machine repair in Jeddah & Makkah.' },
  );
}

export default function SignupLayout({ children }) {
  return children;
}
