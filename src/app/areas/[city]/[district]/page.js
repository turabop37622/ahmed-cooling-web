import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { getRequestLang } from '../../../../lib/seo';
import { pathForLang } from '../../../../lib/lang';
import { loadServices } from '../../../../lib/servicesData';
import { CITY_SLUGS, getCity, getDistrict } from '../../../../lib/areas';
import { areaServices, districtContent, breadcrumbJsonLd, faqJsonLd } from '../../../../lib/areaContent';
import {
  AreaHero, Breadcrumbs, BookingSteps, CtaBand, DistrictLinks, FaqList, JsonLd, PromiseCards, SectionTitle, ServicePriceList,
} from '../../../../components/areas/AreaBlocks';
import { areaMetadata, crumbs, serviceJsonLd } from '../../areaPage';

export const revalidate = 300;

export function generateStaticParams() {
  return CITY_SLUGS.flatMap((city) => getCity(city).districts.map((d) => ({ city, district: d.slug })));
}

export async function generateMetadata({ params }) {
  const { city: citySlug, district: districtSlug } = await params;
  const found = getDistrict(citySlug, districtSlug);
  if (!found) return {}; // 404: see layout.js
  const lang = await getRequestLang();
  const svc = areaServices((await loadServices()).services);
  const c = districtContent(found.city, found.district, lang, svc);
  return areaMetadata({ path: `/areas/${citySlug}/${districtSlug}`, lang, title: c.title, description: c.description });
}

export default async function DistrictPage({ params }) {
  const { city: citySlug, district: districtSlug } = await params;
  const found = getDistrict(citySlug, districtSlug);
  if (!found) notFound();
  const { city, district } = found;
  const lang = await getRequestLang();
  const ar = lang === 'ar';
  const { services } = await loadServices();
  const svc = areaServices(services);
  const c = districtContent(city, district, lang, svc);
  const path = `/areas/${city.slug}/${district.slug}`;
  const bookHref = svc.bookId ? `/book/${svc.bookId}` : pathForLang('/services', lang);
  const bookLabel = ar ? 'احجز صيانة المكيف' : 'Book AC repair';
  const place = ar ? `حي ${district.ar}` : district.en;
  const cityName = city[lang];

  const trail = crumbs(
    [
      { name: ar ? 'الرئيسية' : 'Home', path: '/' },
      { name: ar ? 'المناطق التي نخدمها' : 'Areas we serve', path: '/areas' },
      { name: cityName, path: `/areas/${city.slug}` },
      { name: district[lang], path },
    ],
    lang
  );

  return (
    <div className="min-h-[60vh] bg-bg pb-16 dark:bg-slate-950">
      <JsonLd data={breadcrumbJsonLd(trail.jsonLd)} />
      <JsonLd data={faqJsonLd(c.faqs)} />
      <JsonLd data={serviceJsonLd({ city, district, lang, path, name: c.h1, description: c.description, svc })} />

      <Breadcrumbs items={trail.items} lang={lang} />
      <AreaHero lang={lang} h1={c.h1} intro={c.intro} bookHref={bookHref} bookLabel={bookLabel} showStats={false} />

      <div className="mx-auto max-w-[1560px] space-y-14 px-4 pt-10 sm:px-6 lg:px-8">
        <section aria-labelledby="services">
          <SectionTitle id="services">{ar ? `الخدمات والأسعار في حي ${district.ar}` : `Services and prices in ${district.en}`}</SectionTitle>
          <ServicePriceList lang={lang} groups={svc.groups} place={place} />
        </section>

        <section aria-labelledby="promise">
          <SectionTitle id="promise">{ar ? `خدمة الطوارئ في ${city.arShort}` : `Emergency service in ${city.en}`}</SectionTitle>
          <PromiseCards lang={lang} place={place} />
        </section>

        <section aria-labelledby="steps">
          <SectionTitle id="steps">{ar ? 'كيف يتم الحجز؟' : 'How booking works'}</SectionTitle>
          <BookingSteps lang={lang} />
        </section>

        <section aria-labelledby="faq">
          <SectionTitle id="faq">{ar ? `أسئلة شائعة عن حي ${district.ar}` : `FAQ: ${district.en}`}</SectionTitle>
          <FaqList faqs={c.faqs} />
        </section>

        <section aria-labelledby="nearby">
          <SectionTitle id="nearby">{ar ? 'أحياء قريبة نخدمها' : 'Nearby districts we serve'}</SectionTitle>
          <DistrictLinks lang={lang} citySlug={city.slug} districts={c.near} />
          <Link
            href={pathForLang(`/areas/${city.slug}`, lang)}
            className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary hover:underline dark:text-blue-400"
          >
            {ar ? `جميع أحياء ${city.arShort} وخدماتنا فيها` : `All districts and services in ${city.en}`}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
          </Link>
        </section>

        <CtaBand
          lang={lang}
          title={ar ? `صيانة مكيفات في حي ${district.ar}؟` : `Need AC repair in ${district.en}?`}
          text={ar ? 'احجز موعدك من الموقع أو تواصل معنا على واتساب أو بالاتصال، وسيتصل بك الفني لتأكيد الموعد.' : 'Book online, or reach us on WhatsApp or by phone, and the technician will call you to confirm the appointment.'}
          bookHref={bookHref}
          bookLabel={bookLabel}
        />
      </div>
    </div>
  );
}
