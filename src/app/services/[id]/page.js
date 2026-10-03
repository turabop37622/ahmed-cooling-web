import { notFound, permanentRedirect } from 'next/navigation';
import { getRequestLang, ogLocale } from '../../../lib/seo';
import { langAlternates, absoluteUrl } from '../../../lib/lang';
import { reviewKeyFor, isPackage } from '../../../lib/servicesData';
import { resolveService } from './resolveService';
import ServiceDetailClient from './ServiceDetailClient';

// Hand-written English SEO copy for the long-standing services (keyed by their old numeric id / package id).
// Every other database service gets a description built from its own database text.
const SERVICES_META = {
  '1': {
    description: 'Certified AC diagnostics and repair for split, window, and central air conditioning in Jeddah & Makkah. Emergency dispatch within 1.5–2 hours, and original spare parts.',
    keywords: ['AC repair Jeddah', 'صيانة مكيفات جدة', 'تصليح مكيفات سبليت مكة', 'فني تكييف جدة', 'AC repair expert technician'],
  },
  '2': {
    description: 'Professional installation and relocation for split and window air conditioners in Jeddah & Makkah. Precision copper piping, vacuum testing, and guaranteed leak-free operation.',
    keywords: ['AC installation Jeddah', 'تركيب مكيفات سبليت جدة', 'فك وتركيب مكيفات مكة', 'AC moving Jeddah'],
  },
  '3': {
    description: 'High-pressure jet wash and antibacterial sanitization for split and window AC coils in Jeddah & Makkah. Eliminates odors and maximizes cooling power.',
    keywords: ['AC deep cleaning Jeddah', 'غسيل مكيفات جدة', 'تنظيف مكيفات سبليت مكة', 'تعقيم التكييف', 'AC pressure wash Jeddah'],
  },
  '4': {
    description: 'Fast on-site repair for residential refrigerators in Jeddah & Makkah. Compressor repair, thermostat replacement, defrost heating, and original freon recharge.',
    keywords: ['refrigerator repair Jeddah', 'صيانة ثلاجات جدة', 'تصليح ثلاجات مكة', 'فني ثلاجات منزلي', 'fridge repair Jeddah'],
  },
  '5': {
    description: 'Expert same-day repair for automatic and semi-automatic washing machines in Jeddah & Makkah. Spin basket, drum bearings, water pumps, drain valves, and control boards.',
    keywords: ['washing machine repair Jeddah', 'صيانة غسالات جدة', 'تصليح غسالات أوتوماتيك مكة', 'فني غسالات منزلي', 'washer repair Jeddah'],
  },
  '6': {
    description: 'Genuine R410A and R22 freon refill with pressure testing and leak detection for split and window AC units in Jeddah & Makkah.',
    keywords: ['AC gas refill Jeddah', 'تعبئة فريون جدة', 'شحن غاز مكيف مكة', 'freon refill Saudi Arabia'],
  },
  '7': {
    description: 'Burner cleaning, ignition fixes, thermostat replacement and gas safety checks for stoves and ovens in Jeddah & Makkah.',
    keywords: ['oven repair Jeddah', 'صيانة أفران جدة', 'تصليح بوتاجاز مكة', 'stove repair Makkah'],
  },
  '8': {
    description: 'Breaker repairs, short-circuit fixes and socket troubleshooting for homes in Jeddah & Makkah.',
    keywords: ['electrical repair Jeddah', 'اصلاح كهرباء جدة', 'تمديدات كهربائية مكة', 'electrician Makkah'],
  },
  '9': {
    description: 'Maintenance and duct cleaning for central and chiller AC systems in homes and buildings across Jeddah & Makkah.',
    keywords: ['central AC Jeddah', 'صيانة تكييف مركزي جدة', 'chiller maintenance Makkah'],
  },
  pkg_villa: {
    description: 'Four seasonal AC maintenance visits, priority 24/7 support and 20% off spare parts for villas and homes in Jeddah & Makkah.',
    keywords: ['villa maintenance Jeddah', 'عقد صيانة فلل جدة', 'annual AC maintenance contract'],
  },
};

const DEFAULT_KEYWORDS = ['appliance repair Jeddah', 'صيانة أجهزة منزلية جدة', 'ورشة أحمد للتبريد'];
const clip = (text, max = 160) => {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  return s.length > max ? `${s.slice(0, max - 1).replace(/\s+\S*$/, '')}…` : s;
};
const withPeriod = (s) => (/[.!?؟]$/.test(s) ? s : `${s}.`);

export async function generateMetadata({ params }) {
  const { id } = await params;
  const lang = await getRequestLang();
  const r = await resolveService(id);

  // Unknown slug or id: the page answers 404. No canonical/hreflang pointing at the bogus URL.
  if (!r.service) {
    return {
      title: { absolute: lang === 'ar' ? 'الخدمة غير موجودة | ورشة أحمد للتبريد' : 'Service not found | Ahmed Cooling Workshop' },
      robots: { index: false, follow: true },
      alternates: {},
    };
  }

  const svc = r.service;
  const known = SERVICES_META[reviewKeyFor(svc._id || svc.id)];
  const path = `/services/${r.slug}`;
  let title;
  let description;
  if (lang === 'ar') {
    title = `${svc.nameAr || svc.name} في جدة ومكة`;
    description = clip(`${withPeriod(svc.descriptionAr || svc.nameAr || '')} ورشة أحمد للتبريد في جدة ومكة المكرمة: طوارئ 24/7 وضمان على الصيانة.`);
  } else {
    title = `${svc.name} in Jeddah & Makkah`;
    description = clip(known?.description || `${withPeriod(svc.description || svc.name)} Ahmed Cooling Workshop, Jeddah & Makkah: 24/7 emergency service with warranty.`);
  }
  const fullTitle = `${title} | ${lang === 'ar' ? 'ورشة أحمد للتبريد' : 'Ahmed Cooling Workshop'}`;

  return {
    title: { absolute: fullTitle },
    description,
    keywords: known?.keywords || DEFAULT_KEYWORDS,
    alternates: langAlternates(path, lang),
    openGraph: {
      title: fullTitle,
      description,
      url: absoluteUrl(path, lang),
      locale: ogLocale(lang),
      type: 'website',
    },
  };
}

export default async function ServiceDetailPage({ params }) {
  const { id } = await params;
  const lang = await getRequestLang();
  const r = await resolveService(id);

  if (r.redirectSlug) permanentRedirect(`${lang === 'en' ? '/en' : ''}/services/${r.redirectSlug}`);
  if (!r.service) notFound();

  const svc = r.service;
  const currentId = String(svc._id || svc.id);
  // Related services come from the same database list, so their prices match the list and the booking page.
  const related = isPackage(svc)
    ? r.services.filter((s) => s.isPopular).slice(0, 3)
    : [
        ...r.services.filter((s) => String(s._id || s.id) !== currentId && s.category === svc.category),
        ...r.services.filter((s) => String(s._id || s.id) !== currentId && s.category !== svc.category && s.isPopular),
      ].slice(0, 3);

  return <ServiceDetailClient key={currentId} service={svc} related={related} />;
}
