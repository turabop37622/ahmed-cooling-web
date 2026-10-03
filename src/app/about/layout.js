import { getRequestLang, ogLocale, OG_IMAGE } from '../../lib/seo';
import { langAlternates, absoluteUrl } from '../../lib/lang';

const META = {
  ar: {
    title: 'من نحن | ورشة أحمد للتبريد',
    description: 'ورشة معتمدة لصيانة المكيفات والأجهزة المنزلية في جدة ومكة. خبرة تزيد عن 10 سنوات، طوارئ 24/7 وجودة مضمونة.',
  },
  en: {
    title: 'About Us | Ahmed Cooling Workshop',
    description: 'Certified AC and appliance repair workshop in Jeddah & Makkah. 10+ years of experience, 24/7 emergency dispatch and guaranteed quality.',
  },
};

export async function generateMetadata() {
  const lang = await getRequestLang();
  const m = META[lang];
  return {
    title: { absolute: m.title },
    description: m.description,
    keywords: [
      'about Ahmed cooling', 'AC workshop Jeddah', 'ورشة تبريد وتكييف جدة',
      'فني تكييف مكة المكرمة', 'certified HVAC Saudi Arabia', 'appliance technician Jeddah',
    ],
    alternates: langAlternates('/about', lang),
    openGraph: {
      title: m.title,
      description: m.description,
      url: absoluteUrl('/about', lang),
      locale: ogLocale(lang),
      type: 'website',
      siteName: 'Ahmed Cooling Workshop - ورشة أحمد للتبريد',
      // A page-level openGraph replaces the root one, so the share image is repeated here
      images: [OG_IMAGE[lang]],
    },
  };
}

export default function AboutLayout({ children }) {
  return children;
}
