import { getRequestLang, ogLocale, OG_IMAGE } from '../../lib/seo';
import { langAlternates, absoluteUrl } from '../../lib/lang';

const META = {
  ar: {
    title: 'سياسة الخصوصية | ورشة أحمد للتبريد',
    description: 'سياسة الخصوصية وشروط حماية بيانات العملاء لدى ورشة أحمد للتبريد في المملكة العربية السعودية.',
  },
  en: {
    title: 'Privacy Policy | Ahmed Cooling Workshop',
    description: 'Privacy policy and customer data protection terms for Ahmed Cooling Workshop in Saudi Arabia.',
  },
};

export async function generateMetadata() {
  const lang = await getRequestLang();
  const m = META[lang];
  return {
    title: { absolute: m.title },
    description: m.description,
    alternates: langAlternates('/privacy', lang),
    openGraph: {
      title: m.title,
      description: m.description,
      url: absoluteUrl('/privacy', lang),
      locale: ogLocale(lang),
      type: 'website',
      siteName: 'Ahmed Cooling Workshop - ورشة أحمد للتبريد',
      // A page-level openGraph replaces the root one, so the share image is repeated here
      images: [OG_IMAGE[lang]],
    },
  };
}

export default function PrivacyLayout({ children }) {
  return children;
}
