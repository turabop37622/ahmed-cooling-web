import { privatePageMetadata } from '../../lib/seo';

// Per-language title ("... | ورشة أحمد للتبريد" / "... | Ahmed Cooling Workshop"), noindex, no canonical
export function generateMetadata() {
  return privatePageMetadata(
    '/forgot-password',
    { ar: 'إعادة تعيين كلمة المرور', en: 'Reset Password' },
  );
}

export default function ForgotPasswordLayout({ children }) {
  return children;
}
