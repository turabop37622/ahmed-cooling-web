import { getRequestLang, ogLocale, OG_IMAGE } from '../../lib/seo';
import { langAlternates, absoluteUrl } from '../../lib/lang';

const META = {
  ar: {
    title: 'حذف الحساب | ورشة أحمد للتبريد',
    description: 'كيفية حذف حسابك في تطبيق أحمد للتبريد، وما البيانات التي تُحذف وما الذي يُحتفظ به.',
  },
  en: {
    title: 'Delete your account | Ahmed Cooling Workshop',
    description: 'How to delete your Ahmed Cooling app account, what data is deleted and what is kept.',
  },
};

export async function generateMetadata() {
  const lang = await getRequestLang();
  const m = META[lang];
  return {
    title: { absolute: m.title },
    description: m.description,
    alternates: langAlternates('/delete-account', lang),
    openGraph: {
      title: m.title,
      description: m.description,
      url: absoluteUrl('/delete-account', lang),
      locale: ogLocale(lang),
      type: 'website',
      siteName: 'Ahmed Cooling Workshop - ورشة أحمد للتبريد',
      images: [OG_IMAGE[lang]],
    },
  };
}

export default function DeleteAccountLayout({ children }) {
  return children;
}
