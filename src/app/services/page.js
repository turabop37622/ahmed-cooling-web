import { getRequestLang, ogLocale } from '../../lib/seo';
import { langAlternates, absoluteUrl } from '../../lib/lang';
import { loadServices } from '../../lib/servicesData';
import ServicesClient from './ServicesClient';
import { normalizeFilter } from './filters';

const META = {
  ar: {
    title: 'خدماتنا | صيانة مكيفات وأجهزة منزلية جدة ومكة',
    description: 'صيانة وتركيب وغسيل المكيفات وتعبئة الفريون وإصلاح الثلاجات والغسالات والأجهزة المنزلية في جدة ومكة.',
  },
  en: {
    title: 'Our Services | AC & Appliance Repair Jeddah',
    description: 'AC repair, installation, deep cleaning and freon refill, plus refrigerator, washing machine and appliance repair in Jeddah & Makkah.',
  },
};

export async function generateMetadata() {
  const lang = await getRequestLang();
  const m = META[lang];
  return {
    title: { absolute: m.title },
    description: m.description,
    keywords: [
      'AC repair Jeddah', 'refrigerator repair Makkah', 'washing machine repair Jeddah',
      'appliance service Saudi Arabia', 'split AC cleaning Jeddah', 'freon gas refill Makkah',
      'صيانة مكيفات جدة', 'إصلاح ثلاجات مكة', 'غسيل مكيفات سبليت', 'تصليح غسالات أوتوماتيك',
    ],
    // ?cat= filtered views share the canonical /services URL
    alternates: langAlternates('/services', lang),
    openGraph: {
      title: m.title,
      description: m.description,
      url: absoluteUrl('/services', lang),
      locale: ogLocale(lang),
      type: 'website',
    },
  };
}

// Server component: the list is fetched from the database API on the server (cached 5 minutes) and rendered into the
// HTML, so the prices shown here are the same database prices the detail and booking pages use.
export default async function ServicesPage({ searchParams }) {
  const sp = await searchParams;
  const { services, live } = await loadServices();
  return <ServicesClient initialServices={services} live={live} initialFilter={normalizeFilter(sp?.cat)} />;
}
