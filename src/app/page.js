'use client';

import { useState, useEffect, useRef } from 'react';
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
  { name: 'Ali Hassan', city: 'Lahore', rating: 5, text: 'Bohat achi service mili. AC 1 ghante mein theek ho gaya. Highly recommended!', timeAgo: '2 days ago' },
  { name: 'Fatima Khan', city: 'Karachi', rating: 5, text: 'Professional technician aaya, time pe aaya aur kaam bhi zabardast kiya.', timeAgo: '5 days ago' },
  { name: 'Usman Ahmed', city: 'Islamabad', rating: 4, text: 'Fridge ki repair karwai, ab bilkul sahi chal rahi hai. Good prices.', timeAgo: '1 week ago' },
  { name: 'Ayesha Malik', city: 'Rawalpindi', rating: 5, text: 'Emergency mein raat ko call kiya, 45 min mein technician aa gaya. Amazing!', timeAgo: '2 weeks ago' },
  { name: 'Hamza Tariq', city: 'Faisalabad', rating: 5, text: 'Washing machine bilkul band thi, ab nai jaisi chal rahi hai. Thank you!', timeAgo: '3 weeks ago' },
];

const REVIEWS_AR = [
  { name: 'علي حسن', city: 'لاهور', rating: 5, text: 'خدمة ممتازة. تم إصلاح المكيف خلال ساعة. أنصح بشدة!', timeAgo: 'منذ يومين' },
  { name: 'فاطمة خان', city: 'كراتشي', rating: 5, text: 'فني محترف، جاء في الوقت المحدد والعمل كان رائعاً.', timeAgo: 'منذ ٥ أيام' },
  { name: 'عثمان أحمد', city: 'إسلام آباد', rating: 4, text: 'تم إصلاح الثلاجة، الآن تعمل بشكل ممتاز. أسعار جيدة.', timeAgo: 'منذ أسبوع' },
  { name: 'عائشة مالك', city: 'راولبندي', rating: 5, text: 'اتصلت في حالة طوارئ ليلاً، وصل الفني خلال ٤٥ دقيقة. مذهل!', timeAgo: 'منذ أسبوعين' },
  { name: 'حمزة طارق', city: 'فيصل آباد', rating: 5, text: 'الغسالة كانت معطلة تماماً، الآن تعمل كالجديدة. شكراً!', timeAgo: 'منذ ٣ أسابيع' },
];

export default function Home() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const [services, setServices] = useState(SERVICES_FALLBACK);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const reviewsRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

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
    window.open(`https://wa.me/${PHONE.replace('+', '')}?text=Emergency! I need urgent appliance repair service.`, '_blank');
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
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1D4ED8] via-[#2563EB] to-[#3B82F6]">
        <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/[0.06]" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-52 w-52 rounded-full bg-white/[0.04]" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-white/[0.03]" />

        <div className="relative mx-auto w-full px-4 py-16 sm:px-8 sm:py-20 lg:px-16 lg:py-24 xl:px-24">
          <div className="flex flex-col items-start gap-10 lg:flex-row lg:items-center lg:justify-between">
            {/* Left content */}
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/15 px-4 py-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-extrabold text-emerald-300">{t.heroAvailable}</span>
              </div>

              <h1 className="text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                {t.heroTitle?.replace?.('\n', ' ')}
              </h1>
              <p className="mt-4 max-w-xl text-base font-medium leading-relaxed text-white/65 sm:text-lg">
                {t.heroSubtitle}
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link href="/services" className="rounded-2xl bg-white px-8 py-3.5 text-sm font-black text-[#1D4ED8] shadow-lg transition-transform hover:scale-105">
                  {t.ourServices} →
                </Link>
                <button onClick={handleEmergency} className="rounded-2xl border-2 border-white/20 bg-white/10 px-8 py-3.5 text-sm font-extrabold text-white backdrop-blur transition-colors hover:bg-white/20">
                  {t.heroEmergencyCta}
                </button>
              </div>
            </div>



          </div>
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

      {/* ═══ CUSTOMER REVIEWS ═══ */}
      <section className="py-10">
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

        <div
          ref={reviewsRef}
          className="flex gap-4 overflow-x-auto px-4 pb-4 scrollbar-none sm:px-6 lg:px-8"
          style={{ scrollbarWidth: 'none' }}
        >
          {reviews.map((r, i) => (
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
                    {r.city}
                  </p>
                </div>
                <span className="shrink-0 text-xs">
                  {'⭐'.repeat(r.rating)}
                </span>
              </div>
              <p className="line-clamp-3 text-xs font-medium leading-relaxed text-sub dark:text-slate-300">
                {r.text}
              </p>
              <p className="mt-2 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                {r.timeAgo}
              </p>
            </div>
          ))}
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
            href="https://wa.me/966590192146?text=Emergency! I need urgent repair."
            target="_blank"
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

      <div className="flex items-center justify-center gap-2 pb-8">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        <p className="text-xs font-semibold text-sub dark:text-slate-500">
          {t.trustedFooter}
        </p>
      </div>
    </div>
  );
}
