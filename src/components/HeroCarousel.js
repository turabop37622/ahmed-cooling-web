'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '../contexts/TranslationContext';

// Hero banners (from the project's assets folder, optimised to WebP in public/hero-banners).
// Each banner has an Arabic and an English version with its own headline and button baked in,
// so the whole banner links to where its button points.
const PHONE_HREF = 'tel:+966590192146';
const SLIDES = [
  {
    key: 'ac',
    href: '/services',
    altEn: 'Lasting cool, endless comfort: AC repair and installation in Jeddah and Makkah. Book now',
    altAr: 'برودة تدوم وراحة لا تنتهي: صيانة وتركيب المكيفات في جدة ومكة. احجز الآن',
  },
  {
    key: 'appliance',
    href: '/services',
    altEn: 'Your appliances in trusted hands: fridge and washing machine repair with 100% original parts. Request inspection',
    altAr: 'أجهزتك بين أيدٍ أمينة: صيانة الثلاجات والغسالات بقطع أصلية ١٠٠٪. اطلب المعاينة',
  },
  {
    key: 'emergency',
    href: PHONE_HREF,
    altEn: 'Sudden breakdown? We arrive in 60 minutes across Jeddah and Makkah. Call now',
    altAr: 'عطل مفاجئ؟ نصلك خلال ٦٠ دقيقة في جميع أحياء جدة ومكة. اتصل الآن',
  },
];

const INTERVAL_MS = 6000;

function SlideLink({ href, label }) {
  const className = 'absolute inset-0 z-10 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white';
  if (href.startsWith('tel:')) {
    return <a href={href} aria-label={label} className={className} />;
  }
  return <Link href={href} aria-label={label} className={className} />;
}

export default function HeroCarousel() {
  const { language, isRTL } = useTranslation();
  const isAr = language === 'ar';
  const lang = isAr ? 'ar' : 'en';
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false); // keyboard focus
  const [cycle, setCycle] = useState(0); // bumps on resume so the progress bar restarts together with the timer
  const [reduceMotion, setReduceMotion] = useState(false);
  const touchStartX = useRef(null);

  const go = useCallback((next) => {
    setIndex((i) => (next + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const onChange = (e) => setReduceMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Auto-advance; restarts whenever the slide changes so manual clicks get a full interval
  useEffect(() => {
    if (paused || reduceMotion) return undefined;
    const id = setTimeout(() => go(index + 1), INTERVAL_MS);
    return () => clearTimeout(id);
  }, [index, paused, reduceMotion, go]);

  const pause = () => setPaused(true);
  const resume = () => {
    setPaused(false);
    setCycle((c) => c + 1);
  };

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 40) return;
    // Swiping towards the reading direction shows the next slide
    const forward = isRTL ? dx > 0 : dx < 0;
    go(index + (forward ? 1 : -1));
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowLeft') go(index + (isRTL ? 1 : -1));
    if (e.key === 'ArrowRight') go(index + (isRTL ? -1 : 1));
  };

  return (
    <div
      className="group/hero relative isolate w-full overflow-hidden bg-slate-100 outline-none"
      role="region"
      aria-roledescription="carousel"
      aria-label={isAr ? 'العروض والخدمات' : 'Featured services'}
      onFocus={(e) => {
        if (e.target.matches(':focus-visible')) pause();
      }}
      onBlur={resume}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onKeyDown={onKeyDown}
    >
      <div className="relative aspect-[1856/2304] w-full md:aspect-[16/9] lg:aspect-auto lg:h-[min(calc(100svh-9rem),56.25vw)] lg:min-h-[min(max(480px,43.5vw),56.25vw)]">
        {SLIDES.map((slide, i) => {
          const base = `/hero-banners/${slide.key}-${lang}`;
          const label = isAr ? slide.altAr : slide.altEn;
          return (
            <div
              key={slide.key}
              className={`absolute inset-0 transition-opacity ease-out ${i === index ? 'z-10 opacity-100 duration-700' : 'pointer-events-none z-0 opacity-0 delay-700 duration-0'}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${SLIDES.length}`}
              aria-hidden={i !== index}
            >
              <picture className="block h-full w-full">
                {/* Phones (under 768px): portrait banner made for small screens */}
                <source
                  media="(max-width: 767px)"
                  srcSet={`${base}-m-640.webp 640w, ${base}-m-1080.webp 1080w`}
                  sizes="100vw"
                />
                <img
                  src={`${base}-1920.webp`}
                  srcSet={`${base}-960.webp 960w, ${base}-1920.webp 1920w`}
                  sizes="100vw"
                  alt={label}
                  width="1920"
                  height="1072"
                  decoding="async"
                  loading={i === 0 ? 'eager' : 'lazy'}
                  fetchPriority={i === 0 ? 'high' : 'auto'}
                  className="h-full w-full object-cover object-[50%_35%]"
                />
              </picture>
              {i === index && <SlideLink href={slide.href} label={label} />}
            </div>
          );
        })}
      </div>

      {/* Dots */}
      <div
        className="absolute bottom-1.5 start-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full px-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] rtl:translate-x-1/2 sm:bottom-4 sm:gap-1.5 sm:px-3"
        role="tablist"
        aria-label={isAr ? 'اختيار الشريحة' : 'Choose slide'}
      >
        {SLIDES.map((slide, i) => (
          <button
            key={slide.key}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`${i + 1} / ${SLIDES.length}`}
            onClick={() => go(i)}
            className="flex h-4 items-center justify-center sm:h-6"
          >
            <span
              className={`relative block h-1 overflow-hidden rounded-full transition-all duration-500 ease-out sm:h-2 ${i === index ? 'w-7 bg-white/35 sm:w-12' : 'w-1 bg-white/55 hover:bg-white/85 sm:w-2'}`}
            >
              {i === index && (
                <span
                  key={`${index}-${cycle}`}
                  className="absolute inset-0 origin-left rounded-full bg-white rtl:origin-right"
                  style={
                    reduceMotion
                      ? undefined
                      : {
                          animation: `hero-progress ${INTERVAL_MS}ms linear forwards`,
                          animationPlayState: paused ? 'paused' : 'running',
                        }
                  }
                />
              )}
            </span>
          </button>
        ))}
      </div>

      {/* Arrows (hover/focus on desktop, always available on touch via swipe) */}
      <button
        type="button"
        onClick={() => go(index - 1)}
        aria-label={isAr ? 'الشريحة السابقة' : 'Previous slide'}
        className="absolute start-2 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-slate-900/25 text-white backdrop-blur-sm transition hover:bg-slate-900/45 active:scale-95 sm:start-3 sm:flex sm:h-10 sm:w-10 lg:opacity-0 lg:group-hover/hero:opacity-100 lg:focus-visible:opacity-100"
      >
        <ChevronLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => go(index + 1)}
        aria-label={isAr ? 'الشريحة التالية' : 'Next slide'}
        className="absolute end-2 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-slate-900/25 text-white backdrop-blur-sm transition hover:bg-slate-900/45 active:scale-95 sm:end-3 sm:flex sm:h-10 sm:w-10 lg:opacity-0 lg:group-hover/hero:opacity-100 lg:focus-visible:opacity-100"
      >
        <ChevronRight className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
      </button>
    </div>
  );
}
