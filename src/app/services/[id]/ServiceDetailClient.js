'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Shield,
  CheckCircle2,
  ArrowUp,
  Phone,
  MessageSquare,
  Sparkles,
  Star,
  ChevronRight,
  MapPin,
  ThumbsUp,
  DollarSign,
  Award,
  Zap,
  Share2,
  Siren,
} from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';
import { getServiceImage } from '@/lib/serviceImages';
import ServiceCard from '@/components/ServiceCard';
import { VISIT_FEE, getServiceRating, isPackage, reviewKeyFor } from '@/lib/servicesData';
import { servicePath } from '@/lib/serviceSlugs';
import { getReviewsForService } from '@/lib/serviceReviews';
import { pathForLang } from '../../../lib/lang';

// The AC gas refill service (not the fridge gas refill): its notice explains why the final price varies.
const isAcGasRefill = (svc) =>
  Boolean(svc) && svc.category === 'ac' && /\b(gas|freon)\b/i.test(String(svc.name || ''));

// Position the review pool used for the old numeric ids, so every page keeps showing the same reviews.
const reviewPosition = (key) => {
  if (/^[1-9]$/.test(key)) return Number(key) - 1;
  if (key === 'pkg_villa') return 9;
  return 0;
};

const COMMON_PROBLEMS = {
  ac: [
    { en: 'AC blowing warm air / weak cooling', ar: 'المكيف يخرج هواء حار أو تبريد ضعيف' },
    { en: 'Water leaking or dripping inside room', ar: 'تسريب مياه وتنقيط داخل الغرفة' },
    { en: 'Strange whistling, rattling, or grinding noise', ar: 'أصوات غريبة أو طقطقة صادرة من المكيف' },
    { en: 'Foul or musty odor coming from airflow', ar: 'روائح كريهة أو غير محببة من فتحات الهواء' },
    { en: 'Compressor trips breaker or repeatedly shuts off', ar: 'الكمبروسر يفصل بشكل متكرر أو يقطع الكهرباء' },
    { en: 'Remote control not responding or error codes on display', ar: 'عدم استجابة الريموت أو ظهور رموز خطأ بالشاشة' },
  ],
  refrigerator: [
    { en: 'Fridge not cooling but freezer is working', ar: 'الثلاجة لا تبرد بينما الفريزر يعمل بشكل طبيعي' },
    { en: 'Excessive frost and ice buildup inside compartments', ar: 'تراكم الثلج الكثيف داخل الفريزر أو مروحة التبريد' },
    { en: 'Continuous clicking sound from compressor backside', ar: 'صوت نقر متكرر من كمبروسر الثلاجة في الخلف' },
    { en: 'Water pooling under vegetable drawers', ar: 'تجمع وتسريب مياه أسفل أدراج الخضروات' },
    { en: 'Food spoiling quickly due to irregular temperature', ar: 'تلف الأطعمة بسرعة بسبب عدم انتظام درجات الحرارة' },
  ],
  'washing-machine': [
    { en: 'Drum not spinning or tumbling during wash/rinse', ar: 'الحوض لا يدور أثناء الغسيل أو العصر' },
    { en: 'Water not draining out after cycle completion', ar: 'المياه لا تصرف بعد انتهاء دورة الغسيل' },
    { en: 'Excessive shaking, banging, and loud vibrations', ar: 'اهتزاز قوي واصطدام الحوض أثناء مرحلة التجفيف' },
    { en: 'Water leaking onto floor from front door or bottom', ar: 'تسريب مياه على الأرضية من الباب أو أسفل الغسالة' },
    { en: 'Door locked and will not open after cycle ends', ar: 'قفل الباب معلق ولا يفتح بعد انتهاء البرنامج' },
  ],
  stove: [
    { en: 'Gas burner not igniting or weak flame', ar: 'شعلة الفرن أو الموقد لا تشعل أو لهب ضعيف' },
    { en: 'Uneven baking and oven temperature control issues', ar: 'حرارة غير منتظمة في الفرن أو تلف الثرموستات' },
    { en: 'Gas odor or loose valve connection', ar: 'رائحة غاز أو خلل في صمامات الأمان والمفاتيح' },
    { en: 'Glass door hinge loose or electric ignition sparking continuously', ar: 'خلل في مفصلات الباب أو الشرر الكهربائي المستمر' },
  ],
  general: [
    { en: 'Appliance tripping circuit breaker upon turn-on', ar: 'الجهاز يفصل القاطع الكهربائي فور تشغيله' },
    { en: 'Overheating or burning smell during operation', ar: 'سخونة زائدة أو رائحة حرق أثناء عمل الجهاز' },
    { en: 'Unstable power supply or broken internal wiring', ar: 'تذبذب الكهرباء أو تلف الأسلاك والوصلات الداخلية' },
    { en: 'Control panel unresponsive or erratic behavior', ar: 'لوحة التحكم لا تستجيب أو تعطي أوامر عشوائية' },
  ],
};

// Rendered on the server with the database service (see page.js), so the HTML already has the name, price and <h1>.
export default function ServiceDetailClient({ service, related = [] }) {
  const router = useRouter();
  const { t, language, isRTL, toAr, formatPrice } = useTranslation();

  const [toast, setToast] = useState(null); // { text, ok }
  const toastTimer = useRef(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const mobileBookingCardRef = useRef(null);

  // Reviews state
  const [reviewsList, setReviewsList] = useState([]);
  const [likedReviews, setLikedReviews] = useState({});

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);

      if (mobileBookingCardRef.current) {
        const rect = mobileBookingCardRef.current.getBoundingClientRect();
        // Show sticky bottom bar only when top booking card has scrolled out of view
        setShowStickyBar(rect.bottom < 60);
      } else {
        setShowStickyBar(window.scrollY > 400);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const serviceId = String(service?._id || service?.id || '');
  const packageService = isPackage(service);

  // Reviews for this service (its own reviews first, then general ones)
  useEffect(() => {
    if (!serviceId) return;
    const key = reviewKeyFor(serviceId);
    setReviewsList(getReviewsForService(key, reviewPosition(key)));
  }, [serviceId]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const handleToggleLike = (id) => {
    setLikedReviews((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const name = useMemo(() => {
    if (!service) return '';
    return (language === 'ar' ? service.nameAr : null) || service.name || t.service;
  }, [service, language, t.service]);

  const desc = useMemo(() => {
    if (!service) return '';
    return (
      (language === 'ar' ? service.descriptionAr : null) ||
      service.description ||
      ''
    );
  }, [service, language]);

  const category = service?.category || 'ac';
  // Database price (the same number the list, the related cards and the booking use)
  const price = service?.basePrice ?? 0;
  const rating = getServiceRating(serviceId);
  const imgSrc = getServiceImage(service?.name, category);
  const relatedServices = related;
  const num = (n) => (language === 'ar' ? toAr(n) : String(n));

  // WhatsApp link
  const whatsappUrl = useMemo(() => {
    const phone = '966590192146';
    const text =
      language === 'ar'
        ? `السلام عليكم، أود الاستفسار وحجز خدمة (${name}) من ورشة أحمد للتبريد.`
        : `Hello Ahmed Cooling Workshop, I would like to book the service: ${name}.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }, [name, language]);

  const showToast = (text, ok = true) => {
    clearTimeout(toastTimer.current);
    setToast({ text, ok });
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  };

  // Copies text without the async Clipboard API (blocked in some in-app browsers and insecure contexts).
  const legacyCopy = (text) => {
    try {
      const el = document.createElement('textarea');
      el.value = text;
      el.setAttribute('readonly', '');
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  };

  // On phones this opens the system share sheet (WhatsApp, Instagram, ...); elsewhere, or when the sheet fails,
  // it copies the clean canonical link (no query string or hash) and says so.
  const handleShare = async () => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}${servicePath(service, language)}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: name, text: name, url });
        return;
      } catch (err) {
        if (err?.name === 'AbortError') return; // user closed the share sheet
      }
    }
    let copiedOk = false;
    try {
      await navigator.clipboard.writeText(url);
      copiedOk = true;
    } catch {
      copiedOk = legacyCopy(url);
    }
    if (copiedOk) {
      showToast(language === 'ar' ? 'تم نسخ الرابط' : 'Link copied');
    } else {
      showToast(language === 'ar' ? `تعذر نسخ الرابط: ${url}` : `Couldn't copy the link: ${url}`, false);
    }
  };

  const handleBook = () => {
    if (serviceId) {
      router.push(`/book/${serviceId}`);
    }
  };

  const renderPrimaryBookingCard = (cardRef = null) => (
    <div
      ref={cardRef}
      className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"
    >
      {/* Header Price Section */}
      <div className="border-b border-slate-100 pb-5 dark:border-slate-800">
        <span className="inline-block rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-primary dark:bg-blue-950/60 dark:text-blue-400">
          {t.startingFrom || 'Starting from'}
        </span>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-semibold text-slate-900 dark:text-white">
            {formatPrice(price)}
          </span>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            / {language === 'ar' ? 'زيارة وفحص' : 'Visit & Service'}
          </span>
        </div>
        <p className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-400">
          {t.payAfterService || 'Pay only after service is completed & inspected.'}
        </p>
        {packageService ? (
          <p className="mt-2 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
            <span>{language === 'ar' ? 'رسوم زيارة الفني' : 'Technician visit fee'}</span>
            <span>{language === 'ar' ? 'مشمولة في السعر' : 'Included in the price'}</span>
          </p>
        ) : (
          <p className="mt-2 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
            <span>{language === 'ar' ? '+ رسوم زيارة الفني' : '+ Technician visit fee'}</span>
            <span>{formatPrice(VISIT_FEE)}</span>
          </p>
        )}

        {/* Gas refill notice: only on the AC gas refill service, with that service's own price */}
        {isAcGasRefill(service) && (
          <div className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50/90 p-2.5 text-xs font-medium text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
            <span className="font-semibold">{language === 'ar' ? 'ملاحظة تعبئة الفريون:' : 'AC Gas Refill Notice:'}</span>{' '}
            <span>
              {language === 'ar'
                ? `يبدأ من ${formatPrice(price)}، وتختلف القيمة حسب نوع الغاز (R410A / R22) وكمية الشحن المطلوبة بعد فحص الضغوط.`
                : `Starting from ${formatPrice(price)}; final price varies depending on refrigerant type (R410A / R22) and required gas quantity.`}
            </span>
          </div>
        )}

        {/* Pricing Terms, VAT & Inspection Disclaimer */}
        <div className="mt-3 space-y-1.5 rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
          <p className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>{language === 'ar' ? `الأسعار شاملة ضريبة القيمة المضافة ${toAr(15)}٪` : 'Prices include 15% VAT'}</span>
          </p>
          <p className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
            <span>{t.sparePartsNotIncluded || (language === 'ar' ? 'قطع الغيار غير مشمولة (تُسعر بشكل منفصل عند الحاجة)' : 'Spare parts not included (quoted separately)')}</span>
          </p>
          <p className="pt-1.5 text-xs font-semibold text-primary dark:text-blue-400 border-t border-blue-100/70 dark:border-slate-700/70">
            {language === 'ar'
              ? 'الأسعار تبدأ من المبلغ المذكور وقد تختلف بعد المعاينة'
              : 'Prices start from the listed amount and may vary after inspection'}
          </p>
        </div>
      </div>

      {/* Service Specs summary */}
      <div className="space-y-3 py-5 text-xs font-semibold">
        <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
          <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            {language === 'ar' ? 'قطع الغيار:' : 'Spare Parts:'}
          </span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {language === 'ar' ? 'أصلية معتمدة' : '100% Genuine'}
          </span>
        </div>

        <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
          <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <MapPin className="h-4 w-4 text-red-500" />
            {language === 'ar' ? 'مناطق التغطية:' : 'Available in:'}
          </span>
          <span>{language === 'ar' ? 'جدة ومكة المكرمة' : 'Jeddah & Makkah'}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pt-2">
        {/* Primary CTA: Book Now */}
        <button
          type="button"
          onClick={handleBook}
          className="group relative flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-semibold text-white shadow-md shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/30 active:scale-98 cursor-pointer"
        >
          <span>{t.bookNow}</span>
        </button>

        {/* Secondary CTA: WhatsApp */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-98"
        >
          <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          <span>{t.bookViaWhatsApp || 'Book via WhatsApp'}</span>
        </a>

        {/* Hotline Phone Call */}
        <a
          href="tel:+966590192146"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 py-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <Phone className="h-3.5 w-3.5 text-primary" />
          <span>{t.callTechnician || 'Emergency Call'}: <bdi dir="ltr">+966 59 019 2146</bdi></span>
        </a>
      </div>

      {/* Trust footer inside card */}
      <div className="mt-6 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          <span>{language === 'ar' ? 'إلغاء وتعديل مجاني للموعد' : 'Free Rescheduling & Cancellation'}</span>
        </div>
        <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400 ps-6">
          {language === 'ar'
            ? 'يمكنك تعديل الموعد أو إلغاؤه في أي وقت قبل انطلاق الفني.'
            : 'Modify your time slot easily with no extra fees before dispatch.'}
        </p>
      </div>
    </div>
  );

  // Unknown services never reach this component: page.js answers them with a real 404 (notFound()).
  return (
    <div className="min-h-screen bg-bg pb-28 lg:pb-16 dark:bg-slate-950" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* ═══ BREADCRUMB (ALIGNED WITH NAVBAR) ═══ */}
      <div className="border-b border-slate-200/80 bg-white/70 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/70">
        <div className="mx-auto max-w-[1560px] flex items-center gap-2 px-4 sm:px-6 lg:px-8 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <Link href={pathForLang('/', language)} className="hover:text-primary transition-colors">
            {t.home}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180 text-slate-400" />
          <Link href={pathForLang('/services', language)} className="hover:text-primary transition-colors">
            {t.services}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180 text-slate-400" />
          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
            {name}
          </span>
        </div>
      </div>

      <main className="mx-auto max-w-[1560px] px-4 sm:px-6 lg:px-8 pt-6">
        {/* ═══ MAIN GRID: LEFT CONTENT (7 cols) + RIGHT STICKY CARD (5 cols) ═══ */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* LEFT COLUMN (7 COLS) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-8">
            {/* HERO MEDIA CARD */}
            <div className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="relative h-80 sm:h-[420px] lg:h-[515px] xl:h-[520px] w-full overflow-hidden">
                <img
                  src={imgSrc}
                  alt={name}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/40 via-transparent to-transparent" />

                {/* Badges on Top */}
                <div className="absolute top-4 inset-x-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
                      <Sparkles className="h-3.5 w-3.5" />
                      {language === 'ar' ? 'خدمة معتمدة' : 'Verified Service'}
                    </span>
                    {(service.isPopular || service.popular) && (
                      <span className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-blue-600 to-primary px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/30 border border-white/20">
                        <Star className="h-3.5 w-3.5 fill-white text-white" />
                        {language === 'ar' ? 'الأكثر طلباً' : 'Popular Choice'}
                      </span>
                    )}
                    {(service.isEmergency || service.emergency) && (
                      <span className="inline-flex items-center gap-1 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg animate-pulse">
                        <Siren className="h-3.5 w-3.5" aria-hidden="true" />
                        {language === 'ar' ? 'طوارئ ٢٤/٧' : '24/7 Emergency'}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleShare}
                    aria-label={language === 'ar' ? 'مشاركة الخدمة' : 'Share this service'}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-black/40 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-black/60 shadow"
                  >
                    <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
                    {language === 'ar' ? 'مشاركة' : 'Share'}
                  </button>
                </div>

                {/* Service Title & Rating inside Hero bottom */}
                <div className="absolute bottom-4 inset-x-4 sm:bottom-6 sm:inset-x-6 text-white">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="inline-flex shrink-0 whitespace-nowrap items-center gap-1 text-xs font-semibold text-amber-300">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      {rating.toFixed(1)} / 5.0
                    </span>
                    <span className="hidden sm:inline text-xs text-slate-300 font-medium">
                      ({num(487)} {language === 'ar' ? 'عميل راضٍ' : 'Happy Clients'})
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-4xl font-semibold text-white drop-shadow-sm">
                    {name}
                  </h1>
                </div>
              </div>
            </div>

            {/* ═══ MOBILE PRIMARY BOOKING CARD (Image 2) ═══ */}
            <div className="lg:hidden">
              {renderPrimaryBookingCard(mobileBookingCardRef)}
            </div>

            {/* SERVICE OVERVIEW & DESCRIPTION */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex items-center gap-3">
                <div className="h-6 w-1 rounded-full bg-primary" />
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">
                  {t.serviceDetails || 'Service Overview'}
                </h2>
              </div>
              <p className="text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300 font-medium whitespace-pre-line">
                {desc}
              </p>

              {/* 4 HIGHLIGHT PILLARS */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-primary dark:bg-blue-900/40 dark:text-blue-300">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {language === 'ar' ? 'ضمان صيانة رسمي ومعتمد' : 'Official Certified Warranty'}
                    </h4>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-normal font-medium">
                      {language === 'ar' ? 'ضمان شامل ومكتوب على جودة العمل وقطع الغيار.' : 'Complete peace of mind covering parts and labor.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-primary dark:bg-blue-900/40 dark:text-blue-300">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {language === 'ar' ? 'وصول سريع ومواعيد دقيقة' : 'Same-Day Fast Response'}
                    </h4>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-normal font-medium">
                      {language === 'ar' ? 'للطوارئ خلال ساعة ونصف إلى ساعتين، وللحجوزات العادية في نفس اليوم.' : 'Emergencies within 1.5–2 hours; regular bookings the same day.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-primary dark:bg-blue-900/40 dark:text-blue-300">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {t.certifiedTechnicians || 'Certified Technicians'}
                    </h4>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-normal font-medium">
                      {language === 'ar' ? 'فنيون مدربون بخبرة تزيد عن ١٠ سنوات في المملكة.' : 'Vetted, highly skilled professionals with 10+ yrs experience.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-primary dark:bg-blue-900/40 dark:text-blue-300">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {t.transparentEstimate || 'Transparent Pricing'}
                    </h4>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-normal font-medium">
                      {t.payAfterService || 'Pay after service is completed & inspected.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 4-STEP REPAIR PROCESS */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-6 flex items-center gap-3">
                <div className="h-6 w-1 rounded-full bg-primary" />
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">
                  {t.serviceProcess || 'Our Repair Process'}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/40">
                  <span className="text-3xl font-semibold text-primary/30 dark:text-blue-500/30">{num('01')}</span>
                  <h3 className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                    {t.step1Title}
                  </h3>
                  <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                    {t.step1Desc}
                  </p>
                </div>

                <div className="relative rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/40">
                  <span className="text-3xl font-semibold text-primary/30 dark:text-blue-500/30">{num('02')}</span>
                  <h3 className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                    {t.step2Title}
                  </h3>
                  <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                    {t.step2Desc}
                  </p>
                </div>

                <div className="relative rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/40">
                  <span className="text-3xl font-semibold text-primary/30 dark:text-blue-500/30">{num('03')}</span>
                  <h3 className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                    {t.step3Title}
                  </h3>
                  <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                    {t.step3Desc}
                  </p>
                </div>

                <div className="relative rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/40">
                  <span className="text-3xl font-semibold text-primary/30 dark:text-blue-500/30">{num('04')}</span>
                  <h3 className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                    {t.step4Title}
                  </h3>
                  <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                    {t.step4Desc}
                  </p>
                </div>
              </div>
            </div>

            {/* ═══ 7. CUSTOMER REVIEWS & COMMENTS SECTION ═══ */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="h-6 w-1 rounded-full bg-primary" />
                    <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">
                      {language === 'ar' ? 'آراء وتقييمات العملاء' : 'Customer Reviews & Comments'}
                    </h2>
                  </div>
                  <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
                    {language === 'ar'
                      ? 'آراء عملائنا في جدة ومكة المكرمة'
                      : 'What our customers in Jeddah & Makkah say'}
                  </p>
                </div>

                {/* Score badge */}
                <div className="flex items-center gap-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 p-3.5 self-start sm:self-auto shrink-0">
                  <div className="text-center">
                    <span className="block text-2xl font-semibold text-slate-900 dark:text-white leading-none">
                      {rating.toFixed(1)}
                    </span>
                    <div className="flex items-center justify-center gap-0.5 mt-1 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(rating) ? 'fill-amber-400' : 'fill-slate-200 text-slate-300 dark:fill-slate-700 dark:text-slate-600'}`} />
                      ))}
                    </div>
                  </div>
                  <div className="text-start border-s border-amber-200 dark:border-amber-800 ps-3">
                    <span className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {language === 'ar' ? 'تقييم ممتاز' : 'Exceptional'}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {language === 'ar' ? toAr(reviewsList.length) : reviewsList.length} {language === 'ar' ? 'تقييمات' : 'reviews'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Real reviews are collected on the Rate Us page, after a service */}
              <div className="mt-6 flex flex-col items-start justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-800/50 sm:flex-row sm:items-center sm:p-6">
                <div className="flex items-start gap-3">
                  <MessageSquare className="mt-0.5 h-5 w-5 shrink-0 text-primary dark:text-blue-400" aria-hidden="true" />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {language === 'ar' ? 'هل جربت خدمتنا؟' : 'Have you used our service?'}
                    </h4>
                    <p className="mt-0.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                      {language === 'ar' ? 'شاركنا تقييمك بعد الخدمة من صفحة «قيّمنا».' : 'Share your rating after your visit on the Rate Us page.'}
                    </p>
                  </div>
                </div>
                <Link
                  href="/rate"
                  className="inline-flex shrink-0 items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
                >
                  {language === 'ar' ? 'قيّم تجربتك' : 'Rate your experience'}
                </Link>
              </div>

              {/* Reviews List */}
              <div className="mt-8 space-y-4">
                {reviewsList.map((rev) => {
                  const isLiked = !!likedReviews[rev.id];
                  const currentLikes = (rev.likes || 0) + (isLiked ? 1 : 0);
                  const displayName = language === 'ar' ? rev.name : (rev.nameEn || rev.name);
                  const displayCity = language === 'ar' ? rev.city : (rev.cityEn || rev.city);
                  const displayDate = language === 'ar' ? rev.date : (rev.dateEn || rev.date);
                  const displayComment = language === 'ar' ? rev.comment : (rev.commentEn || rev.comment);

                  return (
                    <div
                      key={rev.id}
                      className="rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/40 p-5 transition hover:border-slate-200 dark:hover:border-slate-700"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {/* Avatar Initials */}
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-blue-600 text-xs font-semibold text-white shadow-sm">
                            {displayName
                              ?.split(' ')
                              .map((w) => w[0])
                              .slice(0, 2)
                              .join('')}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <h5 className="text-sm font-semibold text-slate-900 dark:text-white">
                                {displayName}
                              </h5>
                            </div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                              <MapPin className="me-1 inline h-3 w-3 align-[-1px]" aria-hidden="true" />{displayCity}
                            </p>
                          </div>
                        </div>

                        {/* Stars */}
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {[...Array(rev.rating || 5)].map((_, i) => (
                            <Star key={i} className="h-3.5 w-3.5 fill-amber-400" />
                          ))}
                        </div>
                      </div>

                      {/* Comment text */}
                      <p className="mt-3 text-xs sm:text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300">
                        {displayComment}
                      </p>

                      {/* Helpful Button */}
                      <div className="mt-3.5 flex items-center justify-between border-t border-slate-200/50 dark:border-slate-700/50 pt-3 text-xs">
                        <button
                          type="button"
                          onClick={() => handleToggleLike(rev.id)}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
                            isLiked
                              ? 'bg-blue-50 text-primary dark:bg-blue-950/50 dark:text-blue-300'
                              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
                          }`}
                        >
                          <ThumbsUp className={`h-3.5 w-3.5 ${isLiked ? 'fill-current' : ''}`} />
                          <span>{language === 'ar' ? 'مفيد' : 'Helpful'} ({currentLikes})</span>
                        </button>

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN (5 COLS - STICKY BOOKING CARD) */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="sticky top-24 space-y-6">
              {/* PRIMARY ACTION CARD (DESKTOP) */}
              <div className="hidden lg:block">
                {renderPrimaryBookingCard()}
              </div>

              {/* EMERGENCY CALLOUT CARD */}
              <div className="overflow-hidden rounded-3xl border border-red-200 bg-gradient-to-br from-red-50 to-orange-50 p-5 dark:border-red-900/50 dark:from-red-950/30 dark:to-orange-950/20">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white shadow-sm">
                    <Phone className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-red-950 dark:text-red-200">
                      {language === 'ar' ? 'هل لديك عطل طارئ؟' : 'Need Emergency Repairs?'}
                    </h4>
                    <p className="text-xs text-red-800/80 dark:text-red-300 font-medium">
                      {language === 'ar' ? 'فريقنا متاح ٢٤/٧ في جدة ومكة' : '24/7 priority technician dispatch'}
                    </p>
                  </div>
                </div>
                <a
                  href="tel:+966590192146"
                  className="mt-4 block w-full rounded-xl bg-red-600 py-2.5 text-center text-xs font-semibold text-white shadow hover:bg-red-700 transition"
                >
                  {language === 'ar' ? 'اتصل الآن: ٠٥٩٠١٩٢١٤٦' : 'Call: +966 59 019 2146'}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ RELATED SERVICES (CAROUSEL / GRID) ═══ */}
        {relatedServices.length > 0 && (
          <section className="mt-16 border-t border-slate-200/80 pt-12 dark:border-slate-800">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-6 w-1 rounded-full bg-primary" />
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">
                  {t.relatedServices || 'Related Services'}
                </h2>
              </div>
              <Link
                href={pathForLang('/services', language)}
                className="text-xs sm:text-sm font-semibold text-primary hover:text-primary-dark transition"
              >
                {t.seeAll || 'View All'}
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedServices.slice(0, 3).map((svc) => (
                <ServiceCard
                  key={svc._id || svc.id || svc.name}
                  service={svc}
                  onBook={(s) => router.push(`/book/${s._id || s.id}`)}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* ═══ SCROLL TO TOP ARROW BUTTON ═══ */}
      <button
        onClick={scrollToTop}
        className={`fixed z-40 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-primary dark:text-blue-400 shadow-xl shadow-slate-900/15 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300 active:scale-95 cursor-pointer ${
          showStickyBar ? 'bottom-20 lg:bottom-8' : 'bottom-6 lg:bottom-8'
        } ${isRTL ? 'left-4 sm:left-6' : 'right-4 sm:right-6'} ${
          showScrollTop
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        aria-label={language === 'ar' ? 'العودة إلى الأعلى' : 'Back to top'}
        title={language === 'ar' ? 'العودة إلى الأعلى' : 'Back to top'}
      >
        <ArrowUp className="h-5 w-5" />
      </button>

      {/* ═══ FIXED FLOATING MOBILE BAR (Shows only when booking card is scrolled out of view) ═══ */}
      <div
        data-sticky-bottom-bar
        className={`lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 p-3 shadow-2xl safe-area-pb transition-all duration-300 ${
          showStickyBar
            ? 'translate-y-0 opacity-100 pointer-events-auto'
            : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="mx-auto max-w-lg flex items-center gap-2">
          <div className="shrink-0 px-2 text-start">
            <span className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
              {t.startingFrom || 'From'}
            </span>
            <span className="text-base font-semibold text-primary dark:text-blue-400">
              {formatPrice(price)}
            </span>
            <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
              {packageService
                ? (language === 'ar' ? 'شامل الزيارة' : 'Visit included')
                : (language === 'ar' ? `+ ${formatPrice(VISIT_FEE)} زيارة` : `+ ${formatPrice(VISIT_FEE)} visit`)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleBook}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary hover:bg-primary-dark py-3 px-3 text-xs sm:text-sm font-semibold text-white shadow-md shadow-primary/25 active:scale-95 transition-all cursor-pointer"
          >
            <span>{t.bookNow}</span>
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all active:scale-95"
            aria-label="WhatsApp"
          >
            <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </a>

          <a
            href="tel:+966590192146"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-primary dark:text-blue-400 shadow-sm transition-all active:scale-95"
            aria-label={language === 'ar' ? 'اتصال' : 'Call'}
          >
            <Phone className="h-4.5 w-4.5" />
          </a>
        </div>
      </div>

      {/* Share feedback ("Link copied" / copy failed) */}
      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 transition-opacity duration-200 lg:bottom-8 ${
          toast ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {toast && (
          <span
            className={`max-w-full break-all rounded-xl px-4 py-2.5 text-xs font-semibold text-white shadow-lg ${
              toast.ok ? 'bg-slate-900 dark:bg-slate-700' : 'bg-red-600'
            }`}
          >
            {toast.text}
          </span>
        )}
      </div>
    </div>
  );
}
