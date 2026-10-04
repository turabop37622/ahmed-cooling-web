import { getRequestLang, ogLocale, OG_IMAGE } from '../../lib/seo';
import { langAlternates, absoluteUrl } from '../../lib/lang';

const META = {
  ar: {
    title: 'اتصل بنا في جدة ومكة | ورشة أحمد للتبريد',
    description: 'تواصل مع ورشة أحمد للتبريد لطوارئ المكيفات وصيانة الأجهزة المنزلية في جدة ومكة. اتصال أو واتساب على ‎+966 54 448 3745.',
  },
  en: {
    title: 'Contact Us Jeddah & Makkah | Ahmed Cooling Workshop',
    description: '24/7 emergency AC repair and home appliance service in Jeddah & Makkah. Call or WhatsApp +966 54 448 3745.',
  },
};

export async function generateMetadata() {
  const lang = await getRequestLang();
  const m = META[lang];
  return {
    title: { absolute: m.title },
    description: m.description,
    keywords: [
      'contact Ahmed cooling', 'AC technician phone Jeddah', 'رقم فني مكيفات جدة',
      'طوارئ صيانة مكيفات مكة', 'WhatsApp AC repair KSA', 'AC repair technician Jeddah',
      'ورشة أحمد للتبريد اتصال', 'صيانة مكيفات طوارئ جدة',
    ],
    alternates: langAlternates('/contact', lang),
    openGraph: {
      title: m.title,
      description: m.description,
      url: absoluteUrl('/contact', lang),
      locale: ogLocale(lang),
      type: 'website',
      siteName: 'Ahmed Cooling Workshop - ورشة أحمد للتبريد',
      // A page-level openGraph replaces the root one, so the share image is repeated here
      images: [OG_IMAGE[lang]],
    },
  };
}

export default function ContactLayout({ children }) {
  return children;
}
