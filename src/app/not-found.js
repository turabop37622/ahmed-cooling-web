import { getRequestLang } from '../lib/seo';
import NotFoundContent from '../components/NotFoundContent';

const TITLE = {
  ar: 'الصفحة غير موجودة | ورشة أحمد للتبريد',
  en: 'Page not found | Ahmed Cooling',
};

// The proxy sets the request language from the URL (/en/...) or, for other paths, the saved preference
export async function generateMetadata() {
  const lang = await getRequestLang();
  return {
    title: { absolute: TITLE[lang] },
    robots: { index: false, follow: true },
  };
}

export default function NotFound() {
  return <NotFoundContent />;
}
