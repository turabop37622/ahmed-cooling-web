import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getRequestLang } from '../../lib/seo';
import { pathForLang } from '../../lib/lang';
import { CITY_SLUGS, getCity } from '../../lib/areas';
import { num, breadcrumbJsonLd } from '../../lib/areaContent';
import { Breadcrumbs, DistrictLinks, JsonLd, SectionTitle, CtaButtons } from '../../components/areas/AreaBlocks';
import { areaMetadata, crumbs } from './areaPage';

export const revalidate = 300;

const META = {
  ar: {
    title: 'المناطق التي نخدمها في جدة ومكة | ورشة أحمد للتبريد',
    description: 'أحياء جدة ومكة المكرمة التي تغطيها ورشة أحمد للتبريد لصيانة المكيفات والأجهزة المنزلية: طوارئ 24/7، وصول خلال 1.5–2 ساعة ورسوم زيارة 30 ريال.',
    h1: 'المناطق التي نخدمها',
    intro: 'يغطي فنيو ورشة أحمد للتبريد أحياء جدة ومكة المكرمة لصيانة المكيفات وإصلاح الثلاجات والغسالات والأجهزة المنزلية. اختر مدينتك أو حيّك لمعرفة الخدمات والأسعار وطريقة الحجز.',
  },
  en: {
    title: 'Areas We Serve in Jeddah & Makkah | Ahmed Cooling',
    description: 'The Jeddah and Makkah districts Ahmed Cooling Workshop covers for AC and home appliance repair: 24/7 emergencies, 1.5–2 hour response, 30 SAR visit fee.',
    h1: 'Areas We Serve',
    intro: 'Ahmed Cooling Workshop technicians cover districts across Jeddah and Makkah for AC maintenance and refrigerator, washing machine and home appliance repair. Choose your city or district to see services, prices and how to book.',
  },
};

export async function generateMetadata() {
  const lang = await getRequestLang();
  return areaMetadata({ path: '/areas', lang, title: META[lang].title, description: META[lang].description });
}

export default async function AreasPage() {
  const lang = await getRequestLang();
  const ar = lang === 'ar';
  const m = META[lang];
  const cities = CITY_SLUGS.map(getCity);
  const trail = crumbs(
    [
      { name: ar ? 'الرئيسية' : 'Home', path: '/' },
      { name: m.h1, path: '/areas' },
    ],
    lang
  );

  return (
    <div className="min-h-[60vh] bg-bg pb-16 dark:bg-slate-950">
      <JsonLd data={breadcrumbJsonLd(trail.jsonLd)} />
      <Breadcrumbs items={trail.items} lang={lang} />

      <section className="border-b border-border bg-gradient-to-b from-primary-light/80 to-bg dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
        <div className="mx-auto max-w-[1560px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <h1 className="text-3xl font-semibold text-text sm:text-4xl dark:text-white">{m.h1}</h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-700 dark:text-slate-300">{m.intro}</p>
          <CtaButtons lang={lang} bookHref={pathForLang('/services', lang)} bookLabel={ar ? 'تصفح الخدمات واحجز' : 'Browse services & book'} className="mt-6" />
        </div>
      </section>

      <div className="mx-auto max-w-[1560px] space-y-12 px-4 pt-10 sm:px-6 lg:px-8">
        {cities.map((city) => (
          <section key={city.slug} aria-labelledby={`city-${city.slug}`} className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 id={`city-${city.slug}`} className="text-2xl font-semibold text-text dark:text-white">
                  {ar ? `صيانة مكيفات ${city.ar}` : `AC Repair in ${city.en}`}
                </h2>
                <p className="mt-1 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  {ar ? `${num(city.districts.length, 'ar')} حياً` : `${city.districts.length} districts`}
                </p>
              </div>
              <Link
                href={pathForLang(`/areas/${city.slug}`, lang)}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-dark dark:bg-blue-600"
              >
                {ar ? `خدماتنا في ${city.arShort}` : `Our services in ${city.en}`}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
              </Link>
            </div>
            <DistrictLinks lang={lang} citySlug={city.slug} districts={city.districts} />
          </section>
        ))}

        <section>
          <SectionTitle>{ar ? 'لم تجد حيّك؟' : 'Your district is not listed?'}</SectionTitle>
          <p className="max-w-3xl text-base leading-relaxed text-sub dark:text-slate-300">
            {ar
              ? 'نخدم أحياء أخرى في جدة ومكة المكرمة أيضاً. راسلنا على واتساب أو اتصل بنا وأخبرنا بموقعك لنؤكد لك التغطية وموعد الزيارة.'
              : 'We also serve other districts of Jeddah and Makkah. Message us on WhatsApp or call us with your location and we will confirm coverage and a visit time.'}
          </p>
        </section>
      </div>
    </div>
  );
}
