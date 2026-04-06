'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Snowflake, Phone, Star, ChevronRight, Shield, Zap, DollarSign, BadgeCheck, MapPin, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../contexts/TranslationContext';
import { getServices, getPublicReviews } from '../lib/api';
import ServiceCard from '../components/ServiceCard';

const SERVICES_FALLBACK = [
  { _id: '1', icon: '❄️', name: 'AC Repair', description: 'Expert diagnosis & repair for all AC brands', basePrice: 5000, estimatedDuration: '2-3 hours', isPopular: true, category: 'ac' },
  { _id: '2', icon: '🔧', name: 'AC Installation', description: 'Professional split & window AC installation', basePrice: 3000, estimatedDuration: '3-4 hours', isPopular: true, category: 'ac' },
  { _id: '3', icon: '🧹', name: 'AC Deep Cleaning', description: 'Complete AC deep cleaning & sanitization', basePrice: 2500, estimatedDuration: '2-3 hours', isPopular: true, category: 'ac' },
  { _id: '4', icon: '🧊', name: 'Refrigerator Repair', description: 'All refrigerator brands — compressor & gas', basePrice: 3000, estimatedDuration: '2-3 hours', isPopular: true, category: 'refrigerator' },
];

const REVIEWS_EN = [
  { name: 'Ahmed Al-Harbi', city: 'Jeddah', rating: 5, text: 'Excellent AC repair service! The technician came on time and fixed the AC within an hour. Highly recommended!', timeAgo: '2 days ago' },
  { name: 'Fatima Al-Zahrani', city: 'Makkah', rating: 5, text: 'Professional and fast service. They installed my new split AC perfectly. Very happy with the work!', timeAgo: '3 days ago' },
  { name: 'Mohammed Al-Ghamdi', city: 'Jeddah', rating: 5, text: 'Called them for an emergency fridge repair at night. Technician arrived in 30 minutes. Amazing service!', timeAgo: '5 days ago' },
  { name: 'Sara Al-Otaibi', city: 'Makkah', rating: 4, text: 'Good washing machine repair. The technician was knowledgeable and fixed the issue quickly. Fair prices.', timeAgo: '1 week ago' },
  { name: 'Khalid Al-Shehri', city: 'Jeddah', rating: 5, text: 'Best AC deep cleaning service! My AC is running like new now. Will definitely use again.', timeAgo: '1 week ago' },
  { name: 'Noura Al-Qahtani', city: 'Makkah', rating: 5, text: 'Very reliable company. They repaired my oven and microwave on the same visit. Great value!', timeAgo: '2 weeks ago' },
  { name: 'Omar Al-Dossari', city: 'Jeddah', rating: 5, text: 'Annual maintenance plan is worth it! They service all appliances regularly. Excellent team.', timeAgo: '2 weeks ago' },
  { name: 'Huda Al-Malki', city: 'Makkah', rating: 4, text: 'Freezer was leaking and they fixed it same day. Technician was very professional. Recommended!', timeAgo: '3 weeks ago' },
  { name: 'Yusuf Al-Rashidi', city: 'Jeddah', rating: 5, text: 'Called for electrical wiring fix. Fast response, clean work, and very affordable pricing.', timeAgo: '3 weeks ago' },
  { name: 'Maryam Al-Subaie', city: 'Makkah', rating: 5, text: 'They repaired my central AC system for the entire building. Professional and experienced team!', timeAgo: '1 month ago' },
];

const REVIEWS_AR = [
  { name: 'أحمد الحربي', city: 'جدة', rating: 5, text: 'خدمة إصلاح مكيفات ممتازة! جاء الفني في الوقت المحدد وأصلح المكيف خلال ساعة. أنصح بشدة!', timeAgo: 'منذ يومين' },
  { name: 'فاطمة الزهراني', city: 'مكة', rating: 5, text: 'خدمة احترافية وسريعة. ركبوا مكيف سبليت جديد بشكل مثالي. سعيدة جداً بالعمل!', timeAgo: 'منذ ٣ أيام' },
  { name: 'محمد الغامدي', city: 'جدة', rating: 5, text: 'اتصلت بهم لإصلاح ثلاجة طارئ بالليل. وصل الفني خلال ٣٠ دقيقة. خدمة مذهلة!', timeAgo: 'منذ ٥ أيام' },
  { name: 'سارة العتيبي', city: 'مكة', rating: 4, text: 'إصلاح غسالة جيد. الفني كان متخصص وأصلح المشكلة بسرعة. أسعار معقولة.', timeAgo: 'منذ أسبوع' },
  { name: 'خالد الشهري', city: 'جدة', rating: 5, text: 'أفضل خدمة تنظيف مكيفات! المكيف يعمل كالجديد الآن. سأستخدمهم مرة أخرى بالتأكيد.', timeAgo: 'منذ أسبوع' },
  { name: 'نورة القحطاني', city: 'مكة', rating: 5, text: 'شركة موثوقة جداً. أصلحوا الفرن والميكروويف في نفس الزيارة. قيمة ممتازة!', timeAgo: 'منذ أسبوعين' },
  { name: 'عمر الدوسري', city: 'جدة', rating: 5, text: 'خطة الصيانة السنوية تستحق! يصيانون جميع الأجهزة بانتظام. فريق ممتاز.', timeAgo: 'منذ أسبوعين' },
  { name: 'هدى المالكي', city: 'مكة', rating: 4, text: 'الفريزر كان يسرب ماء وأصلحوه في نفس اليوم. الفني كان محترف جداً. أنصح بهم!', timeAgo: 'منذ ٣ أسابيع' },
  { name: 'يوسف الرشيدي', city: 'جدة', rating: 5, text: 'اتصلت لإصلاح الأسلاك الكهربائية. استجابة سريعة، عمل نظيف، وأسعار معقولة.', timeAgo: 'منذ ٣ أسابيع' },
  { name: 'مريم السبيعي', city: 'مكة', rating: 5, text: 'أصلحوا نظام التكييف المركزي للمبنى بالكامل. فريق محترف وذو خبرة!', timeAgo: 'منذ شهر' },
];

export default function Home() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const [services, setServices] = useState(SERVICES_FALLBACK);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadData();
  }, [language]);

  const loadData = async () => {
    try {
      const svcRes = await getServices();
      const svcList = svcRes?.services || svcRes?.data || svcRes;
      if (Array.isArray(svcList) && svcList.length) setServices(svcList);
    } catch { /* keep fallback */ }

    const fallback = language === 'ar' ? REVIEWS_AR : REVIEWS_EN;
    try {
      const revRes = await getPublicReviews();
      const apiReviews = (revRes?.reviews || revRes?.data || []).filter(
        (r) => r.rating && r.name,
      );
      if (apiReviews.length) {
        const combined = [...apiReviews, ...fallback];
        const unique = combined.filter(
          (r, i, arr) => arr.findIndex((x) => x.name === r.name && x.text === r.text) === i,
        );
        setReviews(unique);
      } else {
        setReviews(fallback);
      }
    } catch {
      setReviews(fallback);
    }

    setLoading(false);
  };

  const handleBook = (service) => {
    router.push(`/book/${service._id || service.id}`);
  };

  const PHONE = '+966590192146';
  const handleEmergency = () => {
    window.location.href = `tel:${PHONE}`;
  };

  const howSteps = [
    { step: '01', icon: '🔍', title: t.howStep1Title, desc: t.howStep1Desc },
    { step: '02', icon: '📅', title: t.howStep2Title, desc: t.howStep2Desc },
    { step: '03', icon: '🔧', title: t.howStep3Title, desc: t.howStep3Desc },
    { step: '04', icon: '✅', title: t.howStep4Title, desc: t.howStep4Desc },
  ];

  const whyItems = [
    { icon: <Shield className="h-6 w-6 text-primary" />, title: t.whyCertifiedTitle, desc: t.whyCertifiedDesc },
    { icon: <Zap className="h-6 w-6 text-primary" />, title: t.whySameDayTitle, desc: t.whySameDayDesc },
    { icon: <DollarSign className="h-6 w-6 text-primary" />, title: t.whyPricingTitle, desc: t.whyPricingDesc },
    { icon: <BadgeCheck className="h-6 w-6 text-primary" />, title: t.whyWarrantyTitle, desc: t.whyWarrantyDesc },
  ];

  const cities = [t.cityJeddah, t.cityMakkah];

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm font-semibold text-sub">{t.loadingServices}</p>
      </div>
    );
  }

  return (
    <div className="bg-bg dark:bg-slate-950">
      {/* ═══ HERO ═══ */}
      <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#1D4ED8] via-[#2563EB] to-[#3B82F6] flex items-center">
        {/* Background Video */}
        <video
          autoPlay muted loop playsInline
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1D4ED8]/60 via-[#1D4ED8]/40 to-[#2563EB]/20" />

        <div className="relative mx-auto w-full px-4 py-20 sm:px-8 sm:py-28 lg:px-16 lg:py-32 xl:px-24" dir="ltr">
          <div className="max-w-2xl lg:max-w-xl" style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
              <span className="text-xs font-extrabold text-white">{t.heroAvailable}</span>
            </div>

            <h1 className="text-5xl font-black leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-7xl">
              {(t.heroTitle || '').split('\n').map((line, i) => (
                <span key={i}>
                  {i === 0 ? line : <><br /><span className="text-blue-200">{line}</span></>}
                </span>
              ))}
            </h1>

            <p className="mt-6 max-w-lg text-base font-medium leading-relaxed text-white/75 sm:text-lg">
              {t.heroSubtitle}
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/services" className="group rounded-2xl bg-white px-8 py-4 text-sm font-black text-[#1D4ED8] shadow-xl transition-all hover:scale-105 hover:shadow-2xl">
                {t.ourServices} <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <button onClick={handleEmergency} className="rounded-2xl border-2 border-white/30 bg-white/10 px-8 py-4 text-sm font-extrabold text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:border-white/50">
                {t.heroEmergencyCta}
              </button>
            </div>

            {/* Trust badges */}
            <div className="mt-10 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-lg">⭐</span>
                <span className="text-sm font-bold text-white">4.8/5</span>
                <span className="text-xs text-white/50">{language === 'ar' ? 'تقييم العملاء' : 'Customer Rating'}</span>
              </div>
              <div className="h-4 w-px bg-white/20" />
              <div className="flex items-center gap-2">
                <span className="text-lg">🔧</span>
                <span className="text-sm font-bold text-white">500+</span>
                <span className="text-xs text-white/50">{language === 'ar' ? 'عميل سعيد' : 'Happy Clients'}</span>
              </div>
              <div className="h-4 w-px bg-white/20" />
              <div className="flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <span className="text-sm font-bold text-white">24/7</span>
                <span className="text-xs text-white/50">{language === 'ar' ? 'خدمة طوارئ' : 'Emergency'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="mx-auto w-full px-4 py-12 sm:px-8 lg:px-16 xl:px-24">
        <h2 className="mb-8 text-xl font-black tracking-tight text-text dark:text-white">
          {t.howItWorks}
        </h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {howSteps.map((item, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-black text-white">
                {item.step}
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-text dark:text-white">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs font-medium leading-relaxed text-sub dark:text-slate-400">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ OUR SERVICES ═══ */}
      <section className="mx-auto w-full px-4 pt-10 pb-4 sm:px-8 lg:px-16 xl:px-24">
        <div className="mb-6 flex items-center gap-3">
          <div className="h-6 w-1 rounded-full bg-primary" />
          <h2 className="flex-1 text-xl font-black tracking-tight text-text dark:text-white">
            {t.ourServices}
          </h2>
          <Link
            href="/services"
            className="text-sm font-bold text-primary transition-colors hover:text-primary-dark"
          >
            {t.seeAll}
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {services.slice(0, 8).map((svc) => (
            <ServiceCard key={svc._id || svc.name} service={svc} onBook={handleBook} />
          ))}
        </div>
      </section>

      {/* ═══ CUSTOMER REVIEWS ═══ */}
      <section className="py-10 overflow-hidden">
        <div className="mx-auto w-full px-4 sm:px-8 lg:px-16 xl:px-24">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-black tracking-tight text-text dark:text-white">
              {t.customerReviews}
            </h2>
            <span className="rounded-xl border border-blue-200 bg-primary-light px-3 py-1 text-xs font-extrabold text-primary dark:border-slate-600 dark:bg-slate-800 dark:text-blue-400">
              {t.ratingPill}
            </span>
          </div>
        </div>

        <div className="relative">
          <div className="flex w-max animate-marquee gap-4 px-4 hover:[animation-play-state:paused]">
            {[...reviews, ...reviews].map((r, i) => (
              <div
                key={i}
                className="w-72 shrink-0 rounded-2xl border border-border bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:w-80"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-xs font-black text-white">
                    {r.name
                      ?.split(' ')
                      .map((w) => w[0])
                      .join('')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-text dark:text-white">
                      {r.name}
                    </p>
                    <p className="text-[10px] font-semibold text-sub dark:text-slate-400">
                      📍 {r.city}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs">
                    {'⭐'.repeat(r.rating)}
                  </span>
                </div>
                <p className="line-clamp-3 text-xs font-medium leading-relaxed text-sub dark:text-slate-300">
                  &ldquo;{r.text}&rdquo;
                </p>
                <p className="mt-2 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                  {r.timeAgo}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WHY CHOOSE US ═══ */}
      <section className="mx-auto w-full px-4 py-10 sm:px-8 lg:px-16 xl:px-24">
        <h2 className="mb-6 text-xl font-black tracking-tight text-text dark:text-white">
          {t.whyChooseUs}
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {whyItems.map((item, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="mb-3">{item.icon}</div>
              <h3 className="text-sm font-extrabold text-text dark:text-white">
                {item.title}
              </h3>
              <p className="mt-1 text-xs font-medium leading-relaxed text-sub dark:text-slate-400">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ SERVICE AREAS ═══ */}
      <section className="mx-auto w-full px-4 py-10 sm:px-8 lg:px-16 xl:px-24">
        <h2 className="mb-5 text-xl font-black tracking-tight text-text dark:text-white">
          {t.serviceAreas}
        </h2>

        <div className="flex flex-wrap gap-3">
          {cities.map((city, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-4 py-2 text-xs font-bold text-text dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <MapPin className="h-3 w-3 text-primary" />
              {city}
            </span>
          ))}
        </div>
      </section>

      {/* ═══ EMERGENCY STRIP ═══ */}
      <section className="mx-auto w-full px-4 pb-10 sm:px-8 lg:px-16 xl:px-24">
        <div className="flex flex-col items-center gap-4 rounded-2xl border-[1.5px] border-rose-200 bg-rose-50 p-5 sm:flex-row dark:border-slate-700 dark:bg-slate-800/80">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/30">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <div className="flex-1 text-center sm:text-start">
            <h3 className="text-base font-black text-text dark:text-white">
              {t.emergencyStripTitle}
            </h3>
            <p className="mt-0.5 text-xs font-medium text-sub dark:text-slate-400">
              {t.emergencyStripSub}
            </p>
          </div>
          <a
            href={`tel:${PHONE}`}
            className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-5 py-2.5 text-sm font-black text-white transition-colors hover:bg-red-600"
          >
            <Phone className="h-4 w-4" />
            {t.emergencyStripCta}
          </a>
        </div>
      </section>

      {/* ═══ FOOTER TRUST LINE ═══ */}
      {/* ═══ RATE US ═══ */}
      <section className="mx-auto w-full px-4 pb-12 sm:px-8 lg:px-16 xl:px-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-400 via-orange-400 to-pink-500 p-8 text-center shadow-xl sm:p-12">
          <div className="pointer-events-none absolute -top-10 -left-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-10 -right-10 h-52 w-52 rounded-full bg-white/10" />
          <div className="relative">
            <div className="mb-3 flex items-center justify-center gap-1">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className="h-7 w-7 fill-white text-white sm:h-9 sm:w-9" />
              ))}
            </div>
            <h2 className="text-2xl font-black text-white sm:text-3xl">{t.howWasExperience || 'How was your experience?'}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm font-medium text-white/80">{t.shareYourFeedback || 'Share your feedback and help us improve our service'}</p>
            <Link href="/rate" className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-3.5 text-sm font-black text-orange-600 shadow-lg transition-transform hover:scale-105">
              <Star className="h-5 w-5" />
              {t.rateUs || 'Rate Us'}
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ DOWNLOAD APP BANNER (disabled - enable when Play Store link ready) ═══ */}
      {false && <section className="mx-auto w-full px-4 pb-12 sm:px-8 lg:px-16 xl:px-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 shadow-2xl">
          <div className="pointer-events-none absolute -top-20 -right-20 h-60 w-60 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute top-1/2 left-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.02]" />

          <div className="relative flex flex-col items-center gap-6 px-6 py-10 sm:flex-row sm:px-12 sm:py-12">
            {/* Phone Mockup */}
            <div className="flex shrink-0 items-center justify-center">
              <div className="relative flex h-48 w-24 items-center justify-center rounded-2xl border-2 border-white/20 bg-white/10 backdrop-blur-sm sm:h-56 sm:w-28">
                <div className="absolute top-2 h-1 w-10 rounded-full bg-white/30" />
                <div className="text-center">
                  <span className="text-4xl">❄️</span>
                  <p className="mt-1 text-[8px] font-bold text-white/70">Ahmed Cooling</p>
                </div>
                <div className="absolute bottom-2 h-1 w-6 rounded-full bg-white/20" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 text-center sm:text-left">
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold text-white/80 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {language === 'ar' ? 'متوفر الآن' : 'Available Now'}
              </div>
              <h2 className="text-2xl font-black text-white sm:text-3xl">
                {language === 'ar' ? 'حمّل تطبيقنا' : 'Download Our App'}
              </h2>
              <p className="mt-2 max-w-md text-sm font-medium text-blue-100/80">
                {language === 'ar'
                  ? 'احجز خدماتك بسهولة، تتبع حجوزاتك، واحصل على عروض حصرية من خلال تطبيقنا.'
                  : 'Book services easily, track your bookings, and get exclusive offers through our mobile app.'}
              </p>

              <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:items-start">
                <a
                  href="https://play.google.com/store"
                  target="_blank"
                  className="inline-flex items-center gap-3 rounded-xl bg-white px-5 py-3 shadow-lg transition-transform hover:scale-105"
                >
                  <svg className="h-7 w-7" viewBox="0 0 24 24">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92z" fill="#4285F4"/>
                    <path d="M17.727 8.273L5.158.617l9.89 9.883 2.68-2.227z" fill="#EA4335"/>
                    <path d="M21.778 12c0-.788-.382-1.5-1.02-1.88l-3.031-1.847-2.935 2.735L17.727 13.9l3.031-1.021A1.96 1.96 0 0021.778 12z" fill="#FBBC04"/>
                    <path d="M5.158 23.383l12.57-7.483-2.935-2.892L5.158 23.383z" fill="#34A853"/>
                  </svg>
                  <div className="text-left">
                    <p className="text-[9px] font-semibold uppercase text-sub">{language === 'ar' ? 'تحميل من' : 'Get it on'}</p>
                    <p className="text-sm font-black text-text">Google Play</p>
                  </div>
                </a>
              </div>

              <div className="mt-4 flex items-center justify-center gap-4 sm:justify-start">
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-bold text-white">4.8</span>
                </div>
                <span className="text-xs text-white/50">•</span>
                <span className="text-xs font-semibold text-white/70">{language === 'ar' ? 'مجاني' : 'Free'}</span>
                <span className="text-xs text-white/50">•</span>
                <span className="text-xs font-semibold text-white/70">{language === 'ar' ? 'حجز فوري' : 'Instant Booking'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>}

      <div className="flex items-center justify-center gap-2 pb-8">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        <p className="text-xs font-semibold text-sub dark:text-slate-500">
          {t.trustedFooter}
        </p>
      </div>
    </div>
  );
}
