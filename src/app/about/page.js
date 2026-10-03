'use client';

import { Wrench, Home, Droplets, Sparkles, Phone } from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';

const SERVICE_ITEMS = [
  { titleKey: 'acRepair', descKey: 'professionalRepair', Icon: Wrench },
  { titleKey: 'installation', descKey: 'expertInstallation', Icon: Home },
  { titleKey: 'gasRefill', descKey: 'refrigerantLeak', Icon: Droplets },
  { titleKey: 'cleaning', descKey: 'deepCleaningMaintenance', Icon: Sparkles },
  { titleKey: 'emergencyService', descKey: 'roundTheClockEmergency', Icon: Phone },
];

// Business figures shown once, in the hero. The numbers are the owner's (home page says 10+ years: owner to confirm).
const YEARS = 10;
const CUSTOMERS = 487;
const RATING = 4.9;

export default function AboutPage() {
  const { t, isRTL, language } = useTranslation();
  const ar = language === 'ar';
  const num = (n) => new Intl.NumberFormat(ar ? 'ar-SA' : 'en-US').format(n);
  const stats = [
    { value: ar ? `+${num(YEARS)}` : `${YEARS}+`, label: ar ? 'سنوات خبرة' : 'Years of experience' },
    { value: num(CUSTOMERS), label: ar ? 'عميلاً' : 'Customers served' },
    { value: ar ? `${num(24)}/${num(7)}` : '24/7', label: ar ? 'طوارئ' : 'Emergency service' },
    { value: num(RATING), label: ar ? 'التقييم' : 'Rating' },
  ];

  return (
    <div
      className="min-h-[60vh] bg-bg pb-16 dark:bg-slate-950"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary-light/80 to-bg dark:from-slate-900 dark:to-slate-950 dark:border-slate-800">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl dark:bg-blue-500/15" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl dark:bg-blue-600/10" />
        <div className="mx-auto max-w-[1560px] px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="flex flex-col items-center text-center scroll-reveal">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white p-3 shadow-lg shadow-primary/15 ring-1 ring-primary/10 dark:bg-slate-800 dark:ring-blue-500/30">
              <img src="/logo-icon.png" alt={ar ? 'شعار ورشة أحمد للتبريد' : 'Ahmed Cooling Workshop logo'} width={98} height={98} className="h-full w-full object-contain" />
            </div>
            <h1 className="max-w-3xl text-3xl font-semibold text-text dark:text-white sm:text-4xl">
              {ar ? 'عن ورشة أحمد للتبريد — صيانة المكيفات في جدة ومكة' : 'About Ahmed Cooling Workshop — AC repair in Jeddah & Makkah'}
            </h1>
            <p className="mt-3 max-w-xl text-base font-semibold text-primary dark:text-blue-400">
              {t.trustedTagline}
            </p>
            <p className="mt-2 max-w-lg text-sm text-sub dark:text-slate-400">{t.brandTagline}</p>
            <dl className="mt-10 grid w-full max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
              {stats.map((stat, idx) => (
                <div
                  key={stat.label}
                  className={`scroll-reveal-scale delay-${(idx + 1) * 100} flex flex-col-reverse rounded-2xl border border-border bg-white/80 px-5 py-4 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-800/80`}
                >
                  <dt className="mt-1 text-xs font-semibold text-sub dark:text-slate-400">{stat.label}</dt>
                  <dd className="text-2xl font-semibold text-primary dark:text-blue-400" dir="ltr">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1560px] space-y-16 px-4 pt-14 sm:px-6 lg:px-8">
        {/* Who We Are */}
        <section className="scroll-reveal">
          <div className="mb-4 flex items-center gap-3">
            <span className="h-8 w-1 shrink-0 rounded-full bg-primary dark:bg-blue-500" />
            <h2 className="text-2xl font-semibold text-text dark:text-white">{t.whoWeAre}</h2>
          </div>
          <p className="max-w-3xl text-base leading-relaxed text-sub dark:text-slate-300">
            {t.aboutDescription}
          </p>
        </section>

        {/* Our Services */}
        <section>
          <div className="mb-6 flex items-center gap-3 scroll-reveal">
            <span className="h-8 w-1 shrink-0 rounded-full bg-primary dark:bg-blue-500" />
            <h2 className="text-2xl font-semibold text-text dark:text-white">{t.ourServicesTitle}</h2>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICE_ITEMS.map(({ titleKey, descKey, Icon }, idx) => (
              <li
                key={titleKey}
                className={`scroll-reveal delay-${(idx % 3) * 100 + 100} flex gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-900`}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-light dark:bg-blue-950/80">
                  <Icon className="h-6 w-6 text-primary dark:text-blue-400" aria-hidden />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-text dark:text-white">{t[titleKey]}</h3>
                  <p className="mt-1 text-sm text-sub dark:text-slate-400">{t[descKey]}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Our Team */}
        <section className="scroll-reveal">
          <div className="mb-4 flex items-center gap-3">
            <span className="h-8 w-1 shrink-0 rounded-full bg-primary dark:bg-blue-500" />
            <h2 className="text-2xl font-semibold text-text dark:text-white">{t.ourTeam}</h2>
          </div>
          <p className="max-w-3xl text-base leading-relaxed text-sub dark:text-slate-300">
            {t.teamDescription}
          </p>
        </section>

      </div>
    </div>
  );
}
