import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getRequestLang } from '../../../lib/seo';
import { pathForLang } from '../../../lib/lang';
import { loadServices } from '../../../lib/servicesData';
import { CITY_SLUGS, getCity } from '../../../lib/areas';
import { areaServices, cityContent, breadcrumbJsonLd, faqJsonLd, num } from '../../../lib/areaContent';
import {
  AreaHero, Breadcrumbs, BookingSteps, CtaBand, DistrictLinks, FaqList, JsonLd, PromiseCards, SectionTitle, ServicePriceList,
} from '../../../components/areas/AreaBlocks';
import { areaMetadata, crumbs, serviceJsonLd } from '../areaPage';

export const revalidate = 300;

export function generateStaticParams() {
  return CITY_SLUGS.map((city) => ({ city }));
}

export async function generateMetadata({ params }) {
  const { city: slug } = await params;
  const city = getCity(slug);
  if (!city) return {}; // 404: see layout.js
  const lang = await getRequestLang();
  const svc = areaServices((await loadServices()).services);
  const c = cityContent(city, lang, svc);
  return areaMetadata({ path: `/areas/${city.slug}`, lang, title: c.title, description: c.description });
}

export default async function CityPage({ params }) {
  const { city: slug } = await params;
  const city = getCity(slug);
  if (!city) notFound();
  const lang = await getRequestLang();
  const ar = lang === 'ar';
  const { services } = await loadServices();
  const svc = areaServices(services);
  const c = cityContent(city, lang, svc);
  const path = `/areas/${city.slug}`;
  const bookHref = svc.bookId ? `/book/${svc.bookId}` : pathForLang('/services', lang);
  const bookLabel = ar ? 'احجز صيانة المكيف' : 'Book AC repair';
  const cityName = city[lang];
  const otherCity = getCity(CITY_SLUGS.find((s) => s !== city.slug));

  const trail = crumbs(
    [
      { name: ar ? 'الرئيسية' : 'Home', path: '/' },
      { name: ar ? 'المناطق التي نخدمها' : 'Areas we serve', path: '/areas' },
      { name: cityName, path },
    ],
    lang
  );

  return (
    <div className="min-h-[60vh] bg-bg pb-16 dark:bg-slate-950">
      <JsonLd data={breadcrumbJsonLd(trail.jsonLd)} />
      <JsonLd data={faqJsonLd(c.faqs)} />
      <JsonLd data={serviceJsonLd({ city, district: null, lang, path, name: c.h1, description: c.description, svc })} />

      <Breadcrumbs items={trail.items} lang={lang} />
      <AreaHero lang={lang} h1={c.h1} tagline={c.tagline} intro={c.intro} bookHref={bookHref} bookLabel={bookLabel} />

      <div className="mx-auto max-w-[1560px] space-y-14 px-4 pt-10 sm:px-6 lg:px-8">
        <section aria-labelledby="services">
          <SectionTitle id="services">{ar ? `الخدمات والأسعار في ${city.arShort}` : `Services and prices in ${city.en}`}</SectionTitle>
          <ServicePriceList lang={lang} groups={svc.groups} place={cityName} />
        </section>

        <section aria-labelledby="promise">
          <SectionTitle id="promise">{ar ? `لماذا ورشة أحمد للتبريد في ${city.arShort}؟` : `Why Ahmed Cooling Workshop in ${city.en}?`}</SectionTitle>
          <PromiseCards lang={lang} place={cityName} />
        </section>

        <section aria-labelledby="steps">
          <SectionTitle id="steps">{ar ? 'كيف يتم الحجز؟' : 'How booking works'}</SectionTitle>
          <BookingSteps lang={lang} />
        </section>

        <section aria-labelledby="districts">
          <SectionTitle id="districts">{ar ? `الأحياء التي نخدمها في ${city.arShort}` : `Districts we serve in ${city.en}`}</SectionTitle>
          <p className="mb-5 max-w-3xl text-sm leading-relaxed text-sub dark:text-slate-400">
            {ar
              ? `نغطي ${num(city.districts.length, 'ar')} حياً في ${city.ar}. اختر حيّك لمعرفة تفاصيل الخدمة فيه، وإذا لم تجده فراسلنا على واتساب.`
              : `We cover ${city.districts.length} districts of ${city.en}. Choose yours for service details there; if it is not listed, message us on WhatsApp.`}
          </p>
          <DistrictLinks lang={lang} citySlug={city.slug} districts={city.districts} />
        </section>

        <section aria-labelledby="faq">
          <SectionTitle id="faq">{ar ? `أسئلة شائعة عن الصيانة في ${city.arShort}` : `FAQ: AC repair in ${city.en}`}</SectionTitle>
          <FaqList faqs={c.faqs} />
        </section>

        <CtaBand
          lang={lang}
          title={ar ? `مكيفك يحتاج صيانة في ${city.arShort}؟` : `Need AC repair in ${city.en}?`}
          text={ar ? 'احجز موعدك من الموقع أو تواصل معنا على واتساب أو بالاتصال، وسيتصل بك الفني لتأكيد الموعد.' : 'Book online, or reach us on WhatsApp or by phone, and the technician will call you to confirm the appointment.'}
          bookHref={bookHref}
          bookLabel={bookLabel}
        />

        {otherCity && (
          <p className="text-center text-sm text-sub dark:text-slate-400">
            {ar ? 'نخدم أيضاً ' : 'We also serve '}
            <Link href={pathForLang(`/areas/${otherCity.slug}`, lang)} className="inline-flex min-h-11 items-center font-semibold text-primary underline-offset-2 hover:underline dark:text-blue-400">
              {otherCity[lang]}
            </Link>
            {' • '}
            <Link href={pathForLang('/areas', lang)} className="inline-flex min-h-11 items-center font-semibold text-primary underline-offset-2 hover:underline dark:text-blue-400">
              {ar ? 'جميع المناطق' : 'All areas'}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
