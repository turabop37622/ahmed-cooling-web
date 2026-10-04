// Server-rendered building blocks of the local landing pages (/areas, /areas/<city>, /areas/<city>/<district>).
// No client JavaScript: the FAQ uses <details>, links are plain <Link>s. Styling follows the about and service pages.
import Link from 'next/link';
import { ChevronRight, ChevronDown, Phone, CalendarCheck, Clock, Shield, Wallet, MapPin, HelpCircle } from 'lucide-react';
import { pathForLang } from '../../lib/lang';
import { VISIT_FEE } from '../../lib/servicesData';
import { price, num, RESPONSE, STATS, BOOKING_STEPS, PHONE, PHONE_DISPLAY, WHATSAPP_URL } from '../../lib/areaContent';

const WA_ICON =
  'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z';

export function JsonLd({ data }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />;
}

// items: [{ name, href }]; the last item is the current page (not a link)
export function Breadcrumbs({ items, lang }) {
  return (
    <nav aria-label={lang === 'ar' ? 'مسار التنقل' : 'Breadcrumb'} className="border-b border-slate-200/80 bg-white/70 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/70">
      <ol className="mx-auto flex max-w-[1560px] flex-wrap items-center gap-x-2 px-4 py-1 text-xs font-semibold text-slate-500 sm:px-6 lg:px-8 dark:text-slate-400">
        {items.map((it, idx) => {
          const last = idx === items.length - 1;
          return (
            <li key={it.href || it.name} className="flex items-center gap-2">
              {last ? (
                <span aria-current="page" className="py-2 text-slate-800 dark:text-slate-200">{it.name}</span>
              ) : (
                <>
                  <Link href={it.href} className="inline-flex items-center py-2 transition-colors hover:text-primary pointer-coarse:min-h-11">
                    {it.name}
                  </Link>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 rtl:rotate-180" aria-hidden />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function SectionTitle({ children, id }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="h-8 w-1 shrink-0 rounded-full bg-primary dark:bg-blue-500" aria-hidden />
      <h2 id={id} className="text-xl font-semibold text-text sm:text-2xl dark:text-white">{children}</h2>
    </div>
  );
}

// Hero band: H1, tagline, intro paragraphs, CTAs and (optionally) the stats row
export function AreaHero({ lang, h1, tagline, intro, bookHref, bookLabel, showStats = true }) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary-light/80 to-bg dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
      <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl dark:bg-blue-500/15" />
      <div className="mx-auto max-w-[1560px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="max-w-3xl">
          {tagline && (
            <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              {tagline}
            </p>
          )}
          <h1 className="text-3xl font-semibold leading-tight text-text sm:text-4xl dark:text-white">{h1}</h1>
          <div className="mt-4 space-y-3 text-base leading-relaxed text-slate-700 dark:text-slate-300">
            {intro.map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}
          </div>
          <CtaButtons lang={lang} bookHref={bookHref} bookLabel={bookLabel} className="mt-6" />
        </div>
        {showStats && (
          <dl className="mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {STATS(lang).map((s) => (
              <div key={s.label} className="flex flex-col-reverse rounded-2xl border border-border bg-white/80 px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-800/80">
                <dt className="mt-1 text-xs font-semibold text-sub dark:text-slate-400">{s.label}</dt>
                <dd className="text-xl font-semibold text-primary dark:text-blue-400" dir="ltr">{s.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}

export function CtaButtons({ lang, bookHref, bookLabel, className = '' }) {
  const ar = lang === 'ar';
  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:flex-wrap ${className}`}>
      <Link
        href={bookHref}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-sm font-semibold text-white shadow-md shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-lg"
      >
        <CalendarCheck className="h-4 w-4" aria-hidden />
        <span>{bookLabel}</span>
      </Link>
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700"
      >
        <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24" aria-hidden>
          <path d={WA_ICON} />
        </svg>
        <span>{ar ? 'واتساب' : 'WhatsApp'}</span>
      </a>
      <a
        href={`tel:${PHONE}`}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
      >
        <Phone className="h-4 w-4 text-primary dark:text-blue-400" aria-hidden />
        <span>
          {ar ? 'اتصل: ' : 'Call: '}
          <bdi dir="ltr">{PHONE_DISPLAY[lang]}</bdi>
        </span>
      </a>
    </div>
  );
}

// Services grouped by category, each row linking to the service page with its database price
export function ServicePriceList({ lang, groups, place }) {
  const ar = lang === 'ar';
  return (
    <div>
      <div className="grid gap-5 md:grid-cols-2">
        {groups.map((g) => (
          <div key={g.id} className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-2 text-base font-semibold text-slate-900 dark:text-white">{ar ? g.ar : g.en}</h3>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {g.items.map((s) => (
                <li key={s._id || s.id}>
                  <Link
                    href={pathForLang(`/services/${s.slug}`, lang)}
                    className="group flex min-h-11 items-center justify-between gap-3 py-2.5 text-sm"
                  >
                    <span className="font-medium text-slate-800 transition-colors group-hover:text-primary dark:text-slate-200 dark:group-hover:text-blue-400">
                      {(ar ? s.nameAr : null) || s.name}
                    </span>
                    <span className="shrink-0 whitespace-nowrap text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {ar ? 'من ' : 'from '}
                      <span className="text-sm text-slate-900 dark:text-white">{price(s.basePrice, lang)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-xs font-semibold leading-relaxed text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
        {ar
          ? `الأسعار نفسها في ${place} وجميع المناطق التي نخدمها، وهي شاملة الضريبة • تضاف رسوم زيارة ${price(VISIT_FEE, 'ar')} • قطع الغيار غير مشمولة وتُحدد بعد الفحص • الأسعار تبدأ من المبلغ المذكور وقد تختلف بعد المعاينة.`
          : `Prices are the same in ${place} as everywhere we serve and include VAT • ${price(VISIT_FEE, 'en')} visit fee added • Spare parts are not included and are quoted after inspection • Prices start from the listed amount and may vary after inspection.`}
      </p>
    </div>
  );
}

// Emergency / pricing promise cards
export function PromiseCards({ lang, place }) {
  const ar = lang === 'ar';
  const cards = [
    {
      Icon: Clock,
      title: ar ? `وصول خلال ${RESPONSE.ar}` : `Arrival in ${RESPONSE.en}`,
      text: ar
        ? `لأعطال الطوارئ في ${place} مثل توقف المكيف أو التسريب، متاحون ٢٤/٧ طوال أيام الأسبوع.`
        : `For emergencies in ${place} such as an AC breakdown or a leak, 24/7, seven days a week.`,
    },
    {
      Icon: Wallet,
      title: ar ? `رسوم زيارة ${price(VISIT_FEE, 'ar')}` : `${price(VISIT_FEE, 'en')} visit fee`,
      text: ar
        ? 'رسوم ثابتة تضاف إلى سعر الخدمة، والتكلفة تُوضَّح قبل البدء بالعمل.'
        : 'A fixed fee on top of the service price; the cost is explained before work starts.',
    },
    {
      Icon: Shield,
      title: ar ? `خبرة +${num(10, 'ar')} سنوات وضمان` : '10+ years and a warranty',
      text: ar
        ? 'فنيون مؤهلون وقطع غيار أصلية وضمان على أعمال الصيانة حسب نوع الخدمة.'
        : 'Qualified technicians, genuine spare parts and a warranty on our work depending on the service.',
    },
  ];
  return (
    <ul className="grid gap-4 sm:grid-cols-3">
      {cards.map(({ Icon, title, text }) => (
        <li key={title} className="flex gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light dark:bg-blue-950/80">
            <Icon className="h-5 w-5 text-primary dark:text-blue-400" aria-hidden />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-text dark:text-white">{title}</h3>
            <p className="mt-1 text-sm text-sub dark:text-slate-400">{text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function BookingSteps({ lang }) {
  return (
    <ol className="grid gap-4 sm:grid-cols-3">
      {BOOKING_STEPS(lang).map((step, idx) => (
        <li key={step.title} className="rounded-2xl border border-border bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white dark:bg-blue-600">
            {num(idx + 1, lang)}
          </span>
          <h3 className="mt-3 font-semibold text-text dark:text-white">{step.title}</h3>
          <p className="mt-1 text-sm text-sub dark:text-slate-400">{step.text}</p>
        </li>
      ))}
    </ol>
  );
}

export function FaqList({ faqs }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {faqs.map((f, idx) => (
        <details
          key={f.q}
          open={idx === 0}
          className="group rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 md:self-start"
        >
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 p-5 [&::-webkit-details-marker]:hidden">
            <HelpCircle className="h-5 w-5 shrink-0 text-primary" aria-hidden />
            <h3 className="flex-1 text-base font-semibold text-slate-900 dark:text-white">{f.q}</h3>
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <p className="px-5 pb-5 ps-13 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

// Chips linking to district pages
export function DistrictLinks({ lang, citySlug, districts, current }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {districts.map((d) => (
        <li key={d.slug}>
          {d.slug === current ? (
            <span aria-current="page" className="inline-flex min-h-11 items-center rounded-xl border border-primary bg-primary px-3.5 text-sm font-semibold text-white dark:border-blue-500 dark:bg-blue-600">
              {d[lang]}
            </span>
          ) : (
            <Link
              href={pathForLang(`/areas/${citySlug}/${d.slug}`, lang)}
              className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-700 transition-colors hover:border-primary/50 hover:text-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-blue-500/50 dark:hover:text-blue-400"
            >
              {d[lang]}
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}

// Closing call-to-action band
export function CtaBand({ lang, title, text, bookHref, bookLabel }) {
  return (
    <section className="rounded-3xl bg-gradient-to-br from-primary to-blue-700 p-6 text-white shadow-lg shadow-primary/20 sm:p-10 dark:from-blue-700 dark:to-slate-900">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-blue-50">{text}</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link href={bookHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-6 text-sm font-semibold text-primary transition hover:bg-blue-50">
          <CalendarCheck className="h-4 w-4" aria-hidden />
          <span>{bookLabel}</span>
        </Link>
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 text-sm font-semibold text-white transition hover:bg-emerald-600">
          <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24" aria-hidden>
            <path d={WA_ICON} />
          </svg>
          <span>{lang === 'ar' ? 'واتساب' : 'WhatsApp'}</span>
        </a>
        <a href={`tel:${PHONE}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/40 px-6 text-sm font-semibold text-white transition hover:bg-white/10">
          <Phone className="h-4 w-4" aria-hidden />
          <bdi dir="ltr">{PHONE_DISPLAY[lang]}</bdi>
        </a>
      </div>
    </section>
  );
}
