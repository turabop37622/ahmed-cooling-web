'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Loader2,
  MapPin,
  Calendar,
  Clock,
  FileText,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  CheckCircle2,
  Shield,
  Sparkles,
  AlertCircle,
  Mail,
  Edit3,
  Building2,
  Banknote,
  Crosshair,
} from 'lucide-react';
import ServiceIcon from '@/components/ServiceIcon';
import { useTranslation } from '@/contexts/TranslationContext';
import { useAuth } from '@/contexts/AuthContext';
import { getServices, createBooking, updateProfile } from '@/lib/api';
import { FALLBACK_SERVICES as SHARED_SERVICES, PACKAGES, VISIT_FEE } from '@/lib/servicesData';

const COUNTRY_CODES = [
  { code: '+966', label: 'SA +966', country: 'SA' },
];

const DAY_NAMES_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES_AR = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
const MONTH_NAMES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_NAMES_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

const LOCATION_DATA = {
  jeddah: {
    country: 'SA',
    en: 'Jeddah', ar: 'جدة',
    areas: [
      { en: 'Abhur', ar: 'أبحر' },
      { en: 'Al Ajwad', ar: 'الأجواد' },
      { en: 'Al Andalus', ar: 'الأندلس' },
      { en: 'Al Aziziyah', ar: 'العزيزية' },
      { en: 'Al Balad', ar: 'البلد' },
      { en: 'Al Basateen', ar: 'البساتين' },
      { en: 'Al Bawadi', ar: 'البوادي' },
      { en: 'Al Faisaliyyah', ar: 'الفيصلية' },
      { en: 'Al Hamra', ar: 'الحمراء' },
      { en: 'Al Hamdaniyah', ar: 'الحمدانية' },
      { en: 'Al Khalidiyyah', ar: 'الخالدية' },
      { en: 'Al Manar', ar: 'المنار' },
      { en: 'Al Marwah', ar: 'المروة' },
      { en: 'Al Muhammadiyah', ar: 'المحمدية' },
      { en: 'Al Nahdah', ar: 'النهضة' },
      { en: 'Al Naim', ar: 'النعيم' },
      { en: 'Al Naseem', ar: 'النسيم' },
      { en: 'Al Rabwah', ar: 'الربوة' },
      { en: 'Al Rawdah', ar: 'الروضة' },
      { en: 'Al Rehab', ar: 'الرحاب' },
      { en: 'Al Safa', ar: 'الصفا' },
      { en: 'Al Salamah', ar: 'السلامة' },
      { en: 'Al Samer', ar: 'السامر' },
      { en: 'Al Sharafiyah', ar: 'الشرفية' },
      { en: 'Al Shati', ar: 'الشاطئ' },
      { en: 'Al Thaghr', ar: 'الثغر' },
      { en: 'Al Wurud', ar: 'الورود' },
      { en: 'Al Zahra', ar: 'الزهراء' },
      { en: 'Bryman', ar: 'بريمان' },
    ],
  },
  makkah: {
    country: 'SA',
    en: 'Makkah', ar: 'مكة المكرمة',
    areas: [
      { en: 'Al Adl', ar: 'العدل' },
      { en: 'Al Awali', ar: 'العوالي' },
      { en: 'Al Aziziyah', ar: 'العزيزية' },
      { en: 'Al Buhayrat', ar: 'البحيرات' },
      { en: 'Al Hajlah', ar: 'الحجلة' },
      { en: 'Al Hindawiyyah', ar: 'الهنداوية' },
      { en: 'Al Jamiah', ar: 'الجامعة' },
      { en: 'Al Kakiyyah', ar: 'الكعكية' },
      { en: 'Al Khalidiyyah', ar: 'الخالدية' },
      { en: 'Al Maabdah', ar: 'المعابدة' },
      { en: 'Al Misfalah', ar: 'المسفلة' },
      { en: 'Al Naseem', ar: 'النسيم' },
      { en: 'Al Nuzha', ar: 'النزهة' },
      { en: 'Al Rusayfah', ar: 'الرصيفة' },
      { en: 'Al Shisha', ar: 'الشيشة' },
      { en: 'Al Shoqiyah', ar: 'الشوقية' },
      { en: 'Al Taneem', ar: 'التنعيم' },
      { en: 'Al Utaibiyyah', ar: 'العتيبية' },
      { en: 'Al Zaidi', ar: 'الزايدي' },
      { en: 'Jarwal', ar: 'جرول' },
      { en: 'Kudai', ar: 'كدي' },
    ],
  },
};


function getMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const grid = [];
  let week = new Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) {
      grid.push(week);
      week = [];
    }
  }
  if (week.length) {
    while (week.length < 7) week.push(null);
    grid.push(week);
  }
  return grid;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// How far ahead a visit can be booked.
const MAX_DAYS_AHEAD = 60;

// "Today" as a calendar day in Saudi Arabia, whatever the device time zone is.
// Returned as a local-midnight Date so the calendar grid math keeps working with getDate()/getMonth().
function saudiToday() {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Riyadh', year: 'numeric', month: 'numeric', day: 'numeric',
    }).formatToParts(new Date());
    const get = (type) => Number(parts.find((p) => p.type === type)?.value);
    const y = get('year');
    const m = get('month');
    const d = get('day');
    if (y && m && d) return new Date(y, m - 1, d);
  } catch {
    // Intl time zones unavailable: fall back to the device day
  }
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// Arabic-Indic (٠-٩) and Persian (۰-۹) digits to Latin 0-9
const toLatinDigits = (s) => String(s ?? '').replace(/[٠-٩۰-۹]/g, (ch) => {
  const c = ch.charCodeAt(0);
  return String(c >= 0x06f0 ? c - 0x06f0 : c - 0x0660);
});

// Any common way of writing a Saudi mobile (05XXXXXXXX, 5XXXXXXXX, 9665XXXXXXXX, +966 5X XXX XXXX,
// 00966..., with spaces or dashes, in Latin/Arabic/Persian digits) to the 9-digit national number.
function normalizeSaudiMobile(raw) {
  let d = toLatinDigits(raw).replace(/\D/g, '');
  d = d.replace(/^0+/, ''); // 05..., 00966...
  if (d.startsWith('966') && d.length > 3) d = d.slice(3).replace(/^0+/, ''); // 966 5..., +966 05...
  return d.slice(0, 9);
}

const isValidSaudiMobile = (n) => /^5\d{8}$/.test(n);

// Simplified outline of Saudi Arabia ([lng, lat]), drawn slightly offshore so coastal cities are inside
// while Bahrain, Qatar, Kuwait, Jordan, Iraq, Yemen, Egypt and Sudan stay outside.
const SAUDI_OUTLINE = [
  [34.75, 29.4], [36.07, 29.19], [36.5, 29.5], [36.76, 29.87], [37.67, 30.34], [37.99, 30.5], [37.0, 31.5],
  [39.2, 32.15], [40.4, 31.95], [42.1, 31.1], [44.7, 29.2], [46.55, 29.1], [47.7, 28.53], [48.45, 28.53],
  [48.75, 28.35], [49.3, 27.6], [49.9, 27.05], [50.3, 26.6], [50.3, 25.9], [50.45, 25.4], [50.75, 24.75],
  [51.2, 24.5], [51.55, 24.25], [52.6, 22.95], [55.1, 22.62], [55.67, 22.0], [55.0, 20.0], [52.0, 19.0],
  [49.1, 18.6], [48.2, 18.17], [47.0, 16.95], [46.4, 17.25], [45.2, 17.4], [44.2, 17.3], [43.4, 17.45],
  [43.2, 16.7], [42.78, 16.37], [42.3, 16.6], [40.9, 19.1], [40.0, 20.2], [38.9, 21.5], [38.8, 22.8],
  [37.8, 24.1], [37.0, 25.1], [36.2, 26.3], [35.4, 27.4], [34.6, 28.1],
];

function isInsideSaudiOutline(lat, lng) {
  let inside = false;
  for (let i = 0, j = SAUDI_OUTLINE.length - 1; i < SAUDI_OUTLINE.length; j = i++) {
    const [xi, yi] = SAUDI_OUTLINE[i];
    const [xj, yj] = SAUDI_OUTLINE[j];
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// Distance in km between two points (haversine)
function distanceKm(lat1, lng1, lat2, lng2) {
  const rad = (v) => (v * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Service area centres and how far from them we normally travel
const SERVICE_CENTRES = [
  { lat: 21.5433, lng: 39.1728 }, // Jeddah
  { lat: 21.4225, lng: 39.8262 }, // Makkah
];
const SERVICE_RADIUS_KM = 60;

// Packages already include the visit fee in their price
const PACKAGE_IDS = new Set(['pkg_diagnostic', 'pkg_summer', 'pkg_villa']);

const SERVICE_ICONS = {
  '1': '❄️', '2': '🔧', '3': '🧹', '4': '🧊', '5': '🧺', '6': '💨', '7': '🔥', '8': '⚡', '9': '🏢', pkg_villa: '🏡',
};

// Packages and regular services both come from the shared catalogue so names and prices match every page
const FALLBACK_SERVICES = [...PACKAGES, ...SHARED_SERVICES].map((s) => ({
  ...s,
  icon: s.icon || SERVICE_ICONS[s.legacyId] || SERVICE_ICONS[s._id] || '🔧',
}));

// YYYY-MM-DD of the day the customer picked, in their own time zone.
// (toISOString() converts to UTC, which is the previous day for local midnight in Saudi Arabia.)
const toLocalYMD = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const { t, language, isRTL, toAr, formatPrice } = useTranslation();
  const { user, token, loading: authLoading, updateUser } = useAuth();

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  const [fullName, setFullName] = useState('');
  const [countryCode, setCountryCode] = useState('+966');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [customArea, setCustomArea] = useState('');
  const [subLocation, setSubLocation] = useState('');
  const [isManualAddress, setIsManualAddress] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [coords, setCoords] = useState(null);
  // ISO country code from reverse geocoding, when the provider returned one
  const [geoCountry, setGeoCountry] = useState('');
  const isOutsideSaudi = !!coords && (geoCountry
    ? geoCountry !== 'SA'
    : !isInsideSaudiOutline(coords.latitude, coords.longitude));
  // Inside the Kingdom but far from Jeddah/Makkah: allowed, with a soft warning
  const isFarFromServiceArea = !!coords && !isOutsideSaudi && SERVICE_CENTRES.every(
    (c) => distanceKm(coords.latitude, coords.longitude, c.lat, c.lng) > SERVICE_RADIUS_KM
  );
  const [phoneTouched, setPhoneTouched] = useState(false);
  const outsideSaudiMsg = language === 'ar'
    ? 'عذراً، الخدمة متاحة داخل المملكة العربية السعودية فقط (جدة ومكة المكرمة). موقعك الحالي خارج المملكة، لذلك لا يمكن إتمام الحجز.'
    : 'Sorry, our service is available in Saudi Arabia only (Jeddah & Makkah). Your location is outside the Kingdom, so the booking cannot be completed.';
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [errors, setErrors] = useState({});
  const [serviceProblem, setServiceProblem] = useState(''); // '' | 'unavailable' | 'notfound'
  const [submitError, setSubmitError] = useState('');
  const idempotencyKeyRef = useRef(null);

  const currency = 'SAR';

  const handleCountryCodeChange = (code) => {
    setCountryCode(code);
  };

  const handleSelectCity = (cityKey) => {
    setSelectedCity(cityKey);
    setSelectedArea('');
    setCustomArea('');
    setSubLocation('');
    setErrors((prev) => ({ ...prev, city: null, area: null }));
    setTimeout(() => {
      const areaEl = document.getElementById('field-area');
      if (areaEl) {
        areaEl.focus();
        areaEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 150);
  };

  const handlePhoneChange = (e) => {
    // Normalise first (country code, leading zero, separators, Arabic digits), then cap at 9 digits
    setPhoneNumber(normalizeSaudiMobile(e.target.value));
    if (errors.phone) setErrors((prev) => ({ ...prev, phone: null }));
  };

  const getPosition = (options) =>
    new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, options));

  const handleDetectLocation = async () => {
    setLocationError('');
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationError(language === 'ar' ? 'المتصفح لا يدعم تحديد الموقع التلقائي. اكتب العنوان يدوياً.' : 'Your browser does not support location detection. Please type your address.');
      return;
    }
    // A browser never shows its permission question again once it was blocked, so tell the person how to undo that.
    try {
      const perm = await navigator.permissions?.query({ name: 'geolocation' });
      if (perm?.state === 'denied') {
        setLocationError(language === 'ar'
          ? 'إذن الموقع محظور لهذا الموقع. اضغط على أيقونة القفل بجانب عنوان الموقع في المتصفح، ثم اختر «الموقع» ← «سماح»، وأعد المحاولة. أو اكتب العنوان يدوياً.'
          : 'Location is blocked for this site. Tap the lock icon next to the web address, choose Location, then Allow, and try again. Or type your address.');
        return;
      }
    } catch {
      // Permissions API not available: just try
    }
    setLocating(true);
    let pos;
    try {
      try {
        pos = await getPosition({ enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
      } catch (firstErr) {
        // Permission denied will not change on retry; a timeout or weak GPS signal often works with network location.
        if (firstErr?.code === 1) throw firstErr;
        pos = await getPosition({ enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 });
      }
    } catch (err) {
      setLocating(false);
      const code = err?.code;
      if (code === 1) {
        setLocationError(language === 'ar' ? 'تم رفض إذن الموقع. اسمح بالوصول إلى الموقع من إعدادات المتصفح أو اكتب العنوان يدوياً.' : 'Location permission was denied. Allow location for this site in your browser settings, or type your address.');
      } else if (code === 3) {
        setLocationError(language === 'ar' ? 'انتهت مهلة تحديد الموقع. حاول مرة أخرى أو اكتب العنوان يدوياً.' : 'Finding your location timed out. Try again or type your address.');
      } else {
        setLocationError(language === 'ar' ? 'تعذر تحديد موقعك. اكتب العنوان يدوياً.' : 'Could not find your location. Please type your address.');
      }
      return;
    }

    try {
      const { latitude, longitude } = pos.coords;

      // Detection works anywhere in the world; booking is limited to Saudi Arabia (see isOutsideSaudi).
      setCoords({ latitude, longitude });
      setGeoCountry('');

          let resolvedAddress = '';
          let countryCode2 = '';

          // 1. Call high-speed internal Next.js geocoding API (runs on Vercel serverless)
          try {
            const res = await fetch(`/api/geocode?lat=${latitude}&lng=${longitude}&lang=${language || 'en'}`);
            if (res.ok) {
              const data = await res.json();
              if (data?.success && data?.address) {
                resolvedAddress = data.address;
              }
              // Used when the geocode route returns a country code (the outline check covers it otherwise)
              const cc = data?.countryCode || data?.country_code;
              if (typeof cc === 'string' && /^[a-z]{2}$/i.test(cc)) countryCode2 = cc.toUpperCase();
            }
          } catch (apiErr) {
            console.warn('Internal geocode API warning:', apiErr);
          }

          // 2. Direct client-side fallback via BigDataCloud (CORS-friendly, global, free)
          if (!resolvedAddress) {
            try {
              const bdcLang = language === 'ar' ? 'ar' : 'en';
              const bdcRes = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=${bdcLang}`
              );
              if (bdcRes.ok) {
                const bdc = await bdcRes.json();
                if (typeof bdc?.countryCode === 'string' && /^[a-z]{2}$/i.test(bdc.countryCode)) {
                  countryCode2 = bdc.countryCode.toUpperCase();
                }
                const sep = language === 'ar' ? '، ' : ', ';
                const parts = [
                  bdc.locality,
                  bdc.city !== bdc.locality ? bdc.city : null,
                  bdc.principalSubdivision,
                  bdc.countryName,
                ].filter(Boolean);
                if (parts.length > 0) {
                  resolvedAddress = parts.join(sep);
                }
              }
            } catch (bdcErr) {
              console.warn('BigDataCloud fallback warning:', bdcErr);
            }
          }

          // 3. Clean fallback without hardcoding any wrong city
          if (!resolvedAddress) {
            resolvedAddress =
              language === 'ar'
                ? `موقع GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
                : `GPS Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
          }

          setGeoCountry(countryCode2);
          setIsManualAddress(true);
          setManualAddress(resolvedAddress);
          if (errors.manualAddress) setErrors((prev) => ({ ...prev, manualAddress: null }));
    } catch (err) {
      console.error('Location error:', err);
      setLocationError(language === 'ar' ? 'تعذر تحويل الموقع إلى عنوان. اكتب العنوان يدوياً.' : 'Could not turn your location into an address. Please type it.');
    } finally {
      setLocating(false);
    }
  };

  const today = useMemo(() => saudiToday(), []);
  const maxDate = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + MAX_DAYS_AHEAD);
    return d;
  }, [today]);
  const isBookable = (date) => !!date && date >= today && date <= maxDate;
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());

  useEffect(() => {
    let currentUser = user;
    if (!currentUser && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('user');
        if (saved) currentUser = JSON.parse(saved);
      } catch (e) {}
    }

    if (currentUser) {
      const displayName = currentUser.fullName || currentUser.name || currentUser.customerName || '';
      if (displayName) {
        setFullName(displayName);
      }

      const rawPhone = String(currentUser.phone || currentUser.phoneNumber || '').trim();
      // Saudi numbers in any format (+966..., 966..., 00966..., 05...); other countries are left for the customer to type
      if (rawPhone && (!rawPhone.startsWith('+') || rawPhone.startsWith('+966'))) {
        setCountryCode('+966');
        setPhoneNumber(normalizeSaudiMobile(rawPhone));
      }

      if (currentUser.address) {
        const raw = String(currentUser.address).trim();
        const parts = raw.split(',').map((p) => p.trim()).filter(Boolean);
        if (parts.length >= 2) {
          const cityEn = parts[parts.length - 1];
          const areaEn = parts[parts.length - 2];
          const sub = parts.slice(0, -2).join(', ');

          const cityKey = Object.entries(LOCATION_DATA).find(
            ([, c]) => c?.en?.toLowerCase() === cityEn?.toLowerCase() || c?.ar?.toLowerCase() === cityEn?.toLowerCase()
          )?.[0];
          if (cityKey) {
            setSelectedCity(cityKey);
            const foundArea = LOCATION_DATA[cityKey]?.areas?.find(
              (a) => a.en?.toLowerCase() === areaEn?.toLowerCase() || a.ar?.toLowerCase() === areaEn?.toLowerCase()
            );
            if (foundArea) {
              setSelectedArea(foundArea.en);
            }
            if (sub) setSubLocation(sub);
          } else {
            setSubLocation(raw);
          }
        } else {
          setSubLocation(raw);
        }
      }
    }
  }, [user]);

  useEffect(() => {
    try {
      const savedDraft = sessionStorage.getItem(`pending_booking_${params.id}`);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        if (draft.fullName) setFullName(draft.fullName);
        if (draft.phoneNumber) setPhoneNumber(normalizeSaudiMobile(draft.phoneNumber));
        if (draft.countryCode) setCountryCode(draft.countryCode);
        if (draft.selectedDate) {
          // A saved day that has since passed (or is beyond the booking window) is dropped
          const d = new Date(draft.selectedDate);
          if (!Number.isNaN(d.getTime()) && isBookable(d)) {
            setSelectedDate(d);
            setCalMonth(d.getMonth());
            setCalYear(d.getFullYear());
          }
        }
        if (draft.selectedTime) setSelectedTime(draft.selectedTime);
        if (draft.selectedCity) setSelectedCity(draft.selectedCity);
        if (draft.selectedArea) setSelectedArea(draft.selectedArea);
        if (draft.customArea) setCustomArea(draft.customArea);
        if (draft.subLocation) setSubLocation(draft.subLocation);
        if (draft.isManualAddress !== undefined) setIsManualAddress(draft.isManualAddress);
        if (draft.manualAddress) setManualAddress(draft.manualAddress);
        if (draft.notes) setNotes(draft.notes);
        if (draft.coords) setCoords(draft.coords);
        if (draft.geoCountry) setGeoCountry(draft.geoCountry);
      }
    } catch (e) {}
  }, [params.id]);

  useEffect(() => {
    loadService();
  }, [params.id]);

  const loadService = async () => {
    const targetId = String(params.id || '').trim();
    const bundled = FALLBACK_SERVICES.find((s) => s._id === targetId || s.id === targetId);
    setServiceProblem('');

    // Show the bundled service immediately so the page is usable, then take the live price from the API
    if (bundled) {
      setService(bundled);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const res = await getServices();
      const list = res?.services ?? res?.data ?? res;
      const live = Array.isArray(list) ? list.find((s) => (s._id || s.id) === targetId) : null;
      if (live) {
        setService(live);
      } else if (!bundled) {
        setService(null);
        setServiceProblem('notfound');
      }
    } catch {
      // API unreachable (for example a cold server): a bundled service still works, an unknown id does not
      if (!bundled) {
        setService(null);
        setServiceProblem('unavailable');
      }
    } finally {
      setLoading(false);
    }
  };

  const monthGrid = useMemo(() => getMonthGrid(calYear, calMonth), [calYear, calMonth]);
  const dayNames = language === 'ar' ? DAY_NAMES_AR : DAY_NAMES_EN;
  const monthNames = language === 'ar' ? MONTH_NAMES_AR : MONTH_NAMES_EN;

  // No navigating before the current month or past the month of the last bookable day
  const canGoPrev = calYear * 12 + calMonth > today.getFullYear() * 12 + today.getMonth();
  const canGoNext = calYear * 12 + calMonth < maxDate.getFullYear() * 12 + maxDate.getMonth();
  const prevMonth = () => {
    if (!canGoPrev) return;
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (!canGoNext) return;
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
  };
  const dateLocale = language === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-GB';
  const longDate = (d) => d.toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const selectQuickDate = (offset) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d);
    setCalMonth(d.getMonth());
    setCalYear(d.getFullYear());
    if (errors.date) setErrors((prev) => ({ ...prev, date: null }));
  };

  const getFullAddress = () => {
    if (isManualAddress) {
      return manualAddress.trim();
    }
    if (!selectedCity) return '';
    const city = LOCATION_DATA[selectedCity];
    const cityName = language === 'ar' ? city?.ar : city?.en;

    let areaName = '';
    if (selectedArea === 'OTHER') {
      areaName = customArea.trim();
    } else if (selectedArea) {
      const area = city?.areas.find((a) => a.en === selectedArea);
      areaName = language === 'ar' ? area?.ar : area?.en;
    }

    const sep = language === 'ar' ? '، ' : ', ';
    if (!areaName && !subLocation.trim()) return cityName || '';
    if (!subLocation.trim()) return [areaName, cityName].filter(Boolean).join(sep);
    return [subLocation.trim(), areaName, cityName].filter(Boolean).join(sep);
  };

  const getCanonicalAddress = () => {
    if (isManualAddress) {
      return manualAddress.trim();
    }
    if (!selectedCity) return '';
    const city = LOCATION_DATA[selectedCity];
    const area = selectedArea === 'OTHER' ? { en: customArea.trim() } : city?.areas.find((a) => a.en === selectedArea);
    const areaEn = area?.en || customArea.trim() || 'General';
    const cityEn = city?.en || 'Jeddah';
    if (!subLocation.trim()) return `${areaEn}, ${cityEn}`;
    return `${subLocation.trim()}, ${areaEn}, ${cityEn}`;
  };

  const servicePrice = service?.basePrice || service?.price || 0;
  // Package ids, or an explicit flag from the API if the catalogue provides one
  const isPackage = !!service?.visitFeeIncluded || !!service?.isPackage
    || [service?._id, service?.id, params.id].some((v) => v && PACKAGE_IDS.has(String(v)));
  const visitFee = isPackage ? 0 : VISIT_FEE;
  const totalAmount = servicePrice + visitFee;

  // Shared by the progress bar and the submit validator so both always agree
  const nameValid = !!fullName.trim();
  const phoneValid = countryCode !== '+966' ? !!phoneNumber.trim() : isValidSaudiMobile(phoneNumber);
  const phoneProblem = (() => {
    if (!phoneNumber) return language === 'ar' ? 'رقم الجوال مطلوب' : 'Mobile number is required';
    if (phoneValid) return '';
    if (!phoneNumber.startsWith('5')) {
      return language === 'ar' ? 'رقم الجوال السعودي يبدأ بـ ٥ (مثال: ٥٠١٢٣٤٥٦٧)' : 'Saudi mobile numbers start with 5 (e.g. 501234567)';
    }
    return language === 'ar' ? 'رقم الجوال السعودي يتكون من ٩ أرقام يبدأ بـ ٥ (مثال: ٥٠١٢٣٤٥٦٧)' : 'Enter all 9 digits of your Saudi mobile number (5XXXXXXXX)';
  })();
  // Live feedback once the field was left, or as soon as 9 digits are there
  const livePhoneError = phoneNumber && (phoneTouched || phoneNumber.length === 9) ? phoneProblem : '';
  const phoneError = errors.phone || livePhoneError;

  const addressComplete = isManualAddress
    ? !!manualAddress.trim() && !isOutsideSaudi
    : !!selectedCity && !!selectedArea && (selectedArea !== 'OTHER' || !!customArea.trim()) && !!subLocation.trim();

  const validate = () => {
    const e = {};
    if (!nameValid) e.fullName = t.enterNameMsg || (language === 'ar' ? 'الاسم مطلوب' : 'Full name is required');
    if (!phoneValid) e.phone = phoneProblem;
    if (!selectedDate) e.date = t.selectDateMsg || (language === 'ar' ? 'اختر تاريخ الزيارة' : 'Select a date');
    else if (!isBookable(selectedDate)) {
      e.date = language === 'ar'
        ? `اختر تاريخاً من اليوم وحتى ${toAr(MAX_DAYS_AHEAD)} يوماً قادمة`
        : `Choose a date between today and ${MAX_DAYS_AHEAD} days ahead`;
    }

    if (isManualAddress) {
      if (!manualAddress.trim()) e.manualAddress = language === 'ar' ? 'أدخل عنوانك بالتفصيل' : 'Please enter your full address';
      else if (isOutsideSaudi) e.manualAddress = outsideSaudiMsg;
    } else {
      if (!selectedCity) e.city = language === 'ar' ? 'اختر المدينة' : 'City is required';
      if (selectedCity && !selectedArea) e.area = language === 'ar' ? 'اختر المنطقة' : 'Area is required';
      if (selectedArea === 'OTHER' && !customArea.trim()) e.customArea = language === 'ar' ? 'أدخل اسم الحي' : 'District name required';
      if (selectedArea && !subLocation.trim()) e.subLocation = language === 'ar' ? 'أدخل العنوان التفصيلي' : 'Street/House details required';
    }

    setErrors(e);
    if (e.phone) setPhoneTouched(true);

    const keys = Object.keys(e);
    if (keys.length > 0) {
      const elementIdMap = {
        fullName: 'field-fullName',
        phone: 'field-phone',
        date: 'field-date',
        manualAddress: 'field-manualAddress',
        city: 'field-city',
        area: 'field-area',
        customArea: 'field-customArea',
        subLocation: 'field-subLocation',
      };
      const targetId = elementIdMap[keys[0]];
      if (typeof window !== 'undefined' && targetId) {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => {
            if (el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') {
              el.focus();
            } else {
              const input = el.querySelector('input, select, textarea, button');
              if (input) input.focus();
            }
          }, 350);
        }
      }
      return false;
    }
    return true;
  };

  // Backend messages are English only: map status codes to localized text, and only show the raw
  // server message in the English UI when it is a plain validation message.
  const describeBookingError = (err, serverMsg) => {
    const ar = language === 'ar';
    const generic = ar ? 'تعذر إنشاء الحجز. حاول مرة أخرى.' : 'Failed to create booking. Please try again.';
    if (err && !err.response) {
      if (err.code === 'ECONNABORTED') {
        return ar
          ? 'الاتصال بطيء. اضغط «تأكيد الحجز» مرة أخرى، ولن يتم تكرار الحجز.'
          : 'The connection is slow. Tap Confirm again, your booking will not be duplicated.';
      }
      return ar
        ? 'تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت ثم اضغط «تأكيد الحجز» مرة أخرى، ولن يتم تكرار الحجز.'
        : 'We could not reach our server. Check your internet connection and tap Confirm again, your booking will not be duplicated.';
    }
    const status = err?.response?.status;
    if (status === 409) {
      return ar
        ? 'لديك حجز مماثل لهذه الخدمة في نفس التاريخ. راجع «حجوزاتي» أو اختر تاريخاً آخر.'
        : 'You already have a similar booking for this service on that date. Check My Bookings or choose another date.';
    }
    if (status === 404) {
      return ar
        ? 'هذه الخدمة غير متاحة للحجز حالياً. اختر خدمة أخرى أو تواصل معنا.'
        : 'This service is not available for booking right now. Please choose another service or contact us.';
    }
    if (status === 429) {
      return ar
        ? 'محاولات كثيرة خلال وقت قصير. انتظر دقيقة ثم حاول مرة أخرى.'
        : 'Too many attempts in a short time. Please wait a minute and try again.';
    }
    if (status === 401 || status === 403) {
      return ar
        ? 'انتهت جلسة الدخول. سجّل الدخول مرة أخرى لإتمام الحجز.'
        : 'Your session has expired. Please sign in again to complete the booking.';
    }
    if (status >= 500) {
      return ar
        ? 'حدث خطأ في الخادم. حاول مرة أخرى بعد قليل، ولن يتم تكرار الحجز.'
        : 'Something went wrong on our side. Please try again in a moment, your booking will not be duplicated.';
    }
    if (status === 400 || status === 422 || !err) {
      if (ar) return 'تعذر قبول بيانات الحجز. تحقق من الحقول وحاول مرة أخرى.';
      return serverMsg || generic;
    }
    return ar ? generic : (serverMsg || generic);
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    if (!user || !token) {
      try {
        sessionStorage.setItem(`pending_booking_${params.id}`, JSON.stringify({
          fullName,
          phoneNumber,
          countryCode,
          selectedDate: selectedDate ? selectedDate.toISOString() : null,
          selectedTime,
          selectedCity,
          selectedArea,
          customArea,
          subLocation,
          isManualAddress,
          manualAddress,
          notes,
          coords,
          geoCountry,
        }));
      } catch (e) {}
      router.push(`/login?redirect=/book/${params.id}`);
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `bk-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    }
    try {
      const bookingData = {
        userId: user?._id || user?.id || null,
        userEmail: user?.email || '',
        userName: user?.fullName || user?.name || fullName.trim(),
        service: {
          id: service?._id || service?.id || params.id,
          name: service?.name || '',
          name_en: service?.name_en || service?.name || '',
          name_ar: service?.name_ar || service?.nameAr || '',
          icon: service?.icon || '🔧',
          basePrice: parseInt(service?.basePrice || service?.price || 0),
          category: service?.category || 'general',
        },
        customerName: fullName.trim(),
        phone: `${countryCode}${phoneNumber.trim()}`,
        email: user?.email || '',
        date: toLocalYMD(selectedDate),
        time: selectedTime || 'Anytime',
        country: 'Saudi Arabia',
        city: LOCATION_DATA[selectedCity]?.en || '',
        currency,
        address: getFullAddress(),
        ...(coords ? { coordinates: coords } : {}),
        comments: notes.trim(),
        language: language || 'en',
        platform: 'web',
        totalAmount,
      };
      const res = await createBooking(bookingData, idempotencyKeyRef.current);
      if (res?.success) {
        idempotencyKeyRef.current = null;
        try {
          sessionStorage.removeItem(`pending_booking_${params.id}`);
        } catch (storageErr) {}
        let profileSaveFailed = false;
        try {
          if (user) {
            const canonicalAddress = getCanonicalAddress();
            const fullPhone = `${countryCode}${phoneNumber.trim()}`;
            const profileRes = await updateProfile({
              phone: fullPhone,
              address: canonicalAddress,
            });
            const updated = profileRes?.user || profileRes?.data;
            if (updated) {
              updateUser({ ...user, ...updated, phone: updated.phone || fullPhone, address: updated.address || canonicalAddress });
            } else {
              updateUser({ ...user, phone: fullPhone, address: canonicalAddress });
            }
          }
        } catch {
          profileSaveFailed = true;
        }
        setBookingSuccess({
          profileSaveFailed,
          orderId: res?.data?.bookingId || res?.data?.booking?.orderNumber || res?.data?.booking?.bookingId || '',
          serviceName: svcName,
          serviceIcon: service?.icon || '🔧',
          date: selectedDate.toLocaleDateString(language === 'ar' ? 'ar-SA-u-ca-gregory' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
          time: selectedTime,
          address: getFullAddress(),
          country: 'Saudi Arabia',
          currency,
          total: formatPrice(totalAmount, currency),
        });
      } else {
        setSubmitError(describeBookingError(null, res?.message));
      }
    } catch (err) {
      // A timeout does not mean the booking failed on the server, so keep the same key and let the customer retry safely
      setSubmitError(describeBookingError(err, err?.response?.data?.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-bg dark:bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-primary dark:text-blue-400" />
        <p className="text-sm font-semibold text-sub dark:text-slate-400">{t.loading}</p>
      </div>
    );
  }

  if (!service) {
    const unavailable = serviceProblem === 'unavailable';
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-bg px-4 text-center dark:bg-slate-950" dir={isRTL ? 'rtl' : 'ltr'}>
        <AlertCircle className="h-12 w-12 text-red-400" aria-hidden="true" />
        <p className="text-sm font-semibold text-text dark:text-white">
          {unavailable
            ? (language === 'ar' ? 'تعذر تحميل الخدمة الآن. تحقق من الاتصال وحاول مرة أخرى.' : 'We could not load this service right now. Check your connection and try again.')
            : (language === 'ar' ? 'هذه الخدمة غير متوفرة.' : 'This service is not available.')}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {unavailable && (
            <button onClick={loadService} className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark">
              {language === 'ar' ? 'إعادة المحاولة' : 'Try again'}
            </button>
          )}
          <button onClick={() => router.push('/services')} className="rounded-xl border border-border px-6 py-2.5 text-sm font-semibold text-text hover:bg-slate-50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800">
            {t.browseServices || (language === 'ar' ? 'تصفح الخدمات' : 'Browse Services')}
          </button>
        </div>
      </div>
    );
  }

  const svcName = language === 'ar' && service.nameAr ? service.nameAr : service.name;
  const svcDesc = language === 'ar' && service.descriptionAr ? service.descriptionAr : service.description;
  // 15% written with the locale's own digits and percent sign (١٥٪ in Arabic)
  const vatPercent = new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-US', { style: 'percent' }).format(0.15);
  const vatText = (t.vatIncluded || (language === 'ar' ? 'الأسعار شاملة ضريبة القيمة المضافة 15%' : 'Prices include 15% VAT'))
    .replace(/15\s?%/, vatPercent);
  const sparePartsText = t.sparePartsNotIncluded || (language === 'ar' ? 'قطع الغيار غير مشمولة' : 'Spare parts not included');
  const priceNote = language === 'ar'
    ? 'الأسعار تبدأ من المبلغ المذكور وقد تختلف بعد المعاينة'
    : 'Prices start from the listed amount and may vary after inspection';

  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-bg dark:bg-slate-950" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="mx-auto flex max-w-lg flex-col items-center px-4 pt-16 pb-10">
          {/* Success Animation Circle */}
          <div className="relative mb-6">
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
            </div>
            <div className="absolute -top-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md dark:bg-slate-800">
              <Sparkles className="h-4 w-4 text-amber-500" />
            </div>
          </div>

          {/* Title */}
          <h1 className="mb-1 text-2xl font-semibold text-text dark:text-white">
            {language === 'ar' ? 'تم تأكيد الحجز!' : 'Booking Confirmed!'}
          </h1>
          <p className="mb-6 text-center text-sm font-medium text-sub dark:text-slate-400">
            {language === 'ar' ? 'سنتواصل معك قريباً لتأكيد الموعد' : 'We will contact you soon to confirm the appointment'}
          </p>

          {/* Order ID */}
          {bookingSuccess.profileSaveFailed && (
            <p role="alert" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-sm font-medium text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-300">
              {language === 'ar'
                ? 'تم حفظ الحجز، لكن تعذر تحديث بيانات ملفك الشخصي. يمكنك تعديلها من صفحة الملف الشخصي.'
                : 'Booking saved, but your profile details could not be updated. You can edit them from your profile.'}
            </p>
          )}
          {bookingSuccess.orderId && (
            <div className="mb-6 rounded-xl bg-blue-50 px-5 py-2.5 dark:bg-blue-950/30">
              <p className="text-center text-xs font-semibold text-sub dark:text-slate-400">
                {language === 'ar' ? 'رقم الطلب' : 'Order ID'}
              </p>
              <p className="text-center text-lg font-semibold text-primary dark:text-blue-400">
                #{bookingSuccess.orderId.slice(-8).toUpperCase()}
              </p>
            </div>
          )}

          {/* Booking Details Card */}
          <div className="mb-6 w-full overflow-hidden rounded-2xl border border-border bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            {/* Service Header */}
            <div className="flex items-center gap-3 border-b border-border bg-slate-50 px-5 py-4 dark:border-slate-700 dark:bg-slate-800/50">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-primary dark:bg-blue-950/50 dark:text-blue-400">
                <ServiceIcon service={service} className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text dark:text-white">{bookingSuccess.serviceName}</p>
                <p className="text-xs font-semibold text-primary dark:text-blue-400">{bookingSuccess.total}</p>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-0 divide-y divide-border dark:divide-slate-700">
              {bookingSuccess.country && (
                <DetailRow
                  icon={<Building2 className="h-4 w-4" />}
                  label={language === 'ar' ? 'الدولة' : 'Country'}
                  value={'السعودية (Saudi Arabia)'}
                />
              )}
              <DetailRow icon={<Calendar className="h-4 w-4" />} label={language === 'ar' ? 'التاريخ' : 'Date'} value={bookingSuccess.date} />
              {bookingSuccess.time && bookingSuccess.time !== 'Anytime' && (
                <DetailRow icon={<Clock className="h-4 w-4" />} label={language === 'ar' ? 'الوقت' : 'Time'} value={bookingSuccess.time} />
              )}
              <DetailRow icon={<MapPin className="h-4 w-4" />} label={language === 'ar' ? 'العنوان' : 'Address'} value={bookingSuccess.address} />
            </div>

            {/* Payment Note */}
            <div className="border-t border-border bg-emerald-50 px-5 py-3 dark:border-slate-700 dark:bg-emerald-950/20">
              <p className="text-center text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <Banknote className="me-1.5 inline h-3.5 w-3.5 align-[-2px]" aria-hidden="true" />
                {language === 'ar' ? 'الدفع نقداً بعد إتمام الخدمة' : 'Cash payment after service completion'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex w-full flex-col gap-3">
            <button
              onClick={() => router.push('/bookings')}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary-dark dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              {language === 'ar' ? 'عرض حجوزاتي' : 'View My Bookings'}
            </button>
            <button
              onClick={() => router.push('/')}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-white py-3.5 text-sm font-semibold text-text transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
            >
              {language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
            </button>
          </div>

          {/* Trust Badge */}
          <div className="mt-6 flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5 text-emerald-500" />
            <p className="text-xs font-semibold text-sub dark:text-slate-500">
              {language === 'ar' ? 'حجزك مؤمّن ومشفّر' : 'Your booking is secured & encrypted'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg pb-10 dark:bg-slate-950" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6 lg:px-8">

        {!user && !authLoading && (
          <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-blue-200/90 bg-blue-50/90 p-4 text-xs text-blue-950 shadow-sm dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-200">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm text-slate-900 dark:text-white">
                  {language === 'ar' ? 'تسجيل الدخول مطلوب لإتمام الحجز' : 'Account Required to Complete Booking'}
                </p>
                <p className="mt-0.5 text-slate-600 dark:text-slate-300 text-xs">
                  {language === 'ar' ? 'املأ النموذج أدناه، ثم سجّل الدخول أو أنشئ حساباً مرة واحدة للتأكيد. سيتم حفظ بياناتك وستعود إلى هذه الصفحة مباشرة.' : 'Fill in the form below, then sign in or register once to confirm. Your details are kept and you will come straight back here.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                try {
                  sessionStorage.setItem(`pending_booking_${params.id}`, JSON.stringify({
                    fullName, phoneNumber, countryCode, selectedDate: selectedDate ? selectedDate.toISOString() : null,
                    selectedTime, selectedCity, selectedArea, customArea, subLocation, isManualAddress, manualAddress, notes, coords, geoCountry,
                  }));
                } catch (e) {}
                router.push(`/login?redirect=/book/${params.id}`);
              }}
              className="shrink-0 w-full sm:w-auto rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white shadow-md hover:bg-blue-700 transition text-center"
            >
              {language === 'ar' ? 'تسجيل الدخول / حساب جديد' : 'Sign In / Register'}
            </button>
          </div>
        )}

        {/* Service Hero Card */}
        <div className="scroll-reveal mb-6 overflow-hidden rounded-2xl border border-border bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-sm shadow-inner">
                <ServiceIcon service={service} className="w-6 h-6 stroke-[2]" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="line-clamp-2 text-lg font-semibold leading-snug text-white" title={svcName}>{svcName}</h1>
                {svcDesc && <p className="mt-0.5 line-clamp-3 text-sm text-blue-100 sm:line-clamp-none">{svcDesc}</p>}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-blue-500/20 bg-blue-50 px-5 py-3 dark:bg-slate-800">
            <span className="text-xs font-semibold text-sub dark:text-slate-400">
              {isPackage
                ? (language === 'ar' ? 'سعر الباقة (شامل رسوم الزيارة)' : 'Package price (visit fee included)')
                : (t.servicePrice || 'Service Price')}
            </span>
            <span className="text-lg font-semibold text-primary dark:text-blue-400">{formatPrice(servicePrice, currency)}</span>
          </div>
          <div className="border-t border-blue-100 bg-blue-50/60 px-5 py-2.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 flex flex-wrap items-center justify-between gap-2">
            <span>{vatText} • {sparePartsText}</span>
            <span className="font-semibold text-primary dark:text-blue-400">{priceNote}</span>
          </div>
        </div>

        {/* Progress: the four sections of the form */}
        <ol
          aria-label={language === 'ar' ? 'خطوات الحجز' : 'Booking steps'}
          className="mb-5 grid grid-cols-4 gap-2"
        >
          {[
            { short: language === 'ar' ? 'التواصل' : 'Contact', done: nameValid && phoneValid },
            { short: language === 'ar' ? 'التاريخ' : 'Date', done: isBookable(selectedDate) },
            { short: language === 'ar' ? 'الموقع' : 'Location', done: addressComplete },
            // Optional: never shown as missing, only highlighted once something was written
            { short: language === 'ar' ? 'ملاحظات' : 'Notes', done: !!notes.trim(), optional: true },
          ].map((step, i) => (
            <li key={i} className="min-w-0">
              <div
                className={`h-1.5 rounded-full transition-colors ${
                  step.done
                    ? 'bg-primary dark:bg-blue-500'
                    : step.optional
                      ? 'border border-dashed border-slate-300 bg-transparent dark:border-slate-600'
                      : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
              <p className={`mt-1.5 flex items-center gap-1 truncate text-xs font-semibold ${step.done ? 'text-primary dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
                <span aria-hidden="true">{toAr(i + 1)}.</span>
                <span className="truncate">{step.short}</span>
                {step.done && <CheckCircle2 className="h-3 w-3 shrink-0" aria-label={language === 'ar' ? 'مكتمل' : 'completed'} />}
              </p>
              {step.optional && !step.done && (
                <p className="truncate text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  {language === 'ar' ? 'اختياري' : 'Optional'}
                </p>
              )}
            </li>
          ))}
        </ol>

        {/* Contact Section */}
        <div className="flex items-center justify-between mb-2">
          <SectionTitle step={toAr(1)} icon={<User className="h-5 w-5" />} title={t.contactInfo || 'Contact Information'} />
          {user && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'تم تعبئة بيانات حسابك' : 'Auto-filled from Account'}</span>
            </span>
          )}
        </div>
        <div className="scroll-reveal delay-100 mb-6 space-y-3 rounded-2xl border border-border bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div>
            <label htmlFor="field-fullName" className="mb-1.5 block text-xs font-semibold text-sub dark:text-slate-400">
              {t.fullNameInput || (language === 'ar' ? 'الاسم الكامل' : 'Full Name')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute top-1/2 start-3 h-4 w-4 -translate-y-1/2 text-sub dark:text-slate-500" />
              <input
                id="field-fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                aria-required="true"
                aria-invalid={!!errors.fullName}
                aria-describedby={errors.fullName ? 'err-fullName' : undefined}
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: null }));
                }}
                placeholder={language === 'ar' ? 'أدخل اسمك الكريم' : 'Enter your full name'}
                className={`w-full rounded-xl border py-3 pe-4 ps-10 text-sm font-semibold text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-slate-800 dark:text-white ${errors.fullName ? 'border-red-400' : 'border-border dark:border-slate-600'}`}
              />
            </div>
            {errors.fullName && <p id="err-fullName" role="alert" className="mt-1 text-xs font-semibold text-red-500">{errors.fullName}</p>}
          </div>
          <div>
            <label htmlFor="field-phone" className="mb-1.5 block text-xs font-semibold text-sub dark:text-slate-400">
              {t.mobileNumber || (language === 'ar' ? 'رقم الجوال' : 'Mobile Number')} <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <select
                id="field-countryCode"
                name="countryCode"
                aria-label={language === 'ar' ? 'رمز الدولة' : 'Country code'}
                autoComplete="tel-country-code"
                value={countryCode}
                onChange={(e) => handleCountryCodeChange(e.target.value)}
                className="shrink-0 rounded-xl border border-border bg-white px-2 py-3 text-sm font-semibold text-text dark:border-slate-600 dark:bg-slate-800 dark:text-white cursor-pointer"
              >
                {COUNTRY_CODES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
              <div className="relative flex-1">
                <Phone className="pointer-events-none absolute top-1/2 start-3 h-4 w-4 -translate-y-1/2 text-sub dark:text-slate-500" />
                <input
                  id="field-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel-national"
                  inputMode="numeric"
                  required
                  aria-required="true"
                  aria-invalid={!!phoneError}
                  aria-describedby={phoneError ? 'field-phone-hint err-phone' : 'field-phone-hint'}
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  onBlur={() => setPhoneTouched(true)}
                  placeholder="501234567"
                  className={`w-full rounded-xl border py-3 pe-4 ps-10 text-sm font-semibold text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-slate-800 dark:text-white ${phoneError ? 'border-red-400' : 'border-border dark:border-slate-600'}`}
                />
              </div>
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span id="field-phone-hint">
                {language === 'ar' ? 'أدخل ٩ أرقام تبدأ بـ ٥ (مثال: ٥٠١٢٣٤٥٦٧)' : '9 digits starting with 5 (e.g. 501234567)'}
              </span>
              <span aria-hidden="true" className={`shrink-0 font-mono font-semibold ${phoneValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                {toAr(phoneNumber.length)}/{toAr(9)}
              </span>
            </div>
            {phoneError && (
              <p
                id="err-phone"
                role={errors.phone ? 'alert' : undefined}
                aria-live={errors.phone ? undefined : 'polite'}
                className="mt-1 text-xs font-semibold text-red-500"
              >
                {phoneError}
              </p>
            )}
          </div>
          {user?.email && (
            <div>
              <label htmlFor="field-email" className="mb-1.5 block text-xs font-semibold text-sub dark:text-slate-400">
                {language === 'ar' ? 'البريد الإلكتروني المرتبط بالحساب' : 'Account Email'}
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 start-3 h-4 w-4 -translate-y-1/2 text-sub dark:text-slate-500" />
                <input
                  id="field-email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  disabled
                  value={user.email}
                  className="w-full rounded-xl border border-border bg-slate-50 py-3 pe-4 ps-10 text-sm font-semibold text-slate-500 outline-none dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>
          )}
        </div>

        {/* Date Section */}
        <SectionTitle step={toAr(2)} icon={<Calendar className="h-5 w-5" />} title={t.selectDate || (language === 'ar' ? 'تحديد التاريخ' : 'Select Date')} />
        <div id="field-date" className="scroll-reveal delay-100 mb-6 rounded-2xl border border-border bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          {/* Quick date buttons */}
          <div className="mb-4 flex gap-2">
            {[
              { label: t.today || 'Today', offset: 0 },
              { label: t.tomorrow || 'Tomorrow', offset: 1 },
              { label: t.dayAfter || 'Day After', offset: 2 },
            ].map(({ label, offset }) => {
              const d = new Date(today); d.setDate(d.getDate() + offset);
              const active = selectedDate && isSameDay(selectedDate, d);
              return (
                <button key={offset} type="button" aria-pressed={!!active} onClick={() => selectQuickDate(offset)}
                  className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold transition ${active ? 'border-primary bg-primary text-white' : 'border-border bg-white text-text hover:border-primary/40 dark:border-slate-600 dark:bg-slate-800 dark:text-white'}`}
                >{label}</button>
              );
            })}
          </div>

          {/* Calendar grid */}
          <div
            role="group"
            aria-label={language === 'ar' ? 'اختر تاريخ الزيارة' : 'Choose a visit date'}
            aria-invalid={!!errors.date}
            aria-describedby={errors.date ? 'err-date' : undefined}
            className={`rounded-xl border bg-slate-50 p-3 dark:bg-slate-800/50 ${errors.date ? 'border-red-400' : 'border-border dark:border-slate-700'}`}
          >
            <div className="mb-3 flex items-center justify-between">
              {/* Previous sits at the start edge, so its arrow points left in English and right in Arabic */}
              <button type="button" aria-label={language === 'ar' ? 'الشهر السابق' : 'Previous month'} onClick={prevMonth} disabled={!canGoPrev} className="rounded-lg p-1.5 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-slate-700">
                {isRTL
                  ? <ChevronRight className="h-4 w-4 text-text dark:text-white" aria-hidden="true" />
                  : <ChevronLeft className="h-4 w-4 text-text dark:text-white" aria-hidden="true" />}
              </button>
              <span className="text-sm font-semibold text-text dark:text-white" aria-live="polite">
                {monthNames[calMonth]} {toAr(calYear)}
              </span>
              <button type="button" aria-label={language === 'ar' ? 'الشهر التالي' : 'Next month'} onClick={nextMonth} disabled={!canGoNext} className="rounded-lg p-1.5 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-slate-700">
                {isRTL
                  ? <ChevronLeft className="h-4 w-4 text-text dark:text-white" aria-hidden="true" />
                  : <ChevronRight className="h-4 w-4 text-text dark:text-white" aria-hidden="true" />}
              </button>
            </div>
            <div className="mb-1 grid grid-cols-7 gap-1">
              {dayNames.map((d) => (
                <div key={d} className="py-1 text-center text-xs font-semibold text-sub dark:text-slate-500">{d}</div>
              ))}
            </div>
            {monthGrid.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1">
                {week.map((day, di) => {
                  if (!day) return <div key={di} />;
                  const date = new Date(calYear, calMonth, day);
                  const past = !isBookable(date); // before today (Saudi time) or beyond the booking window
                  const isToday = isSameDay(date, today);
                  const selected = selectedDate && isSameDay(date, selectedDate);
                  return (
                    <button key={di} type="button" disabled={past}
                      aria-pressed={!!selected}
                      aria-label={longDate(date)}
                      aria-current={isToday ? 'date' : undefined}
                      onClick={() => {
                        setSelectedDate(date);
                        if (errors.date) setErrors((prev) => ({ ...prev, date: null }));
                      }}
                      className={`flex h-9 w-full items-center justify-center rounded-lg text-xs font-semibold transition
                        ${past ? 'cursor-not-allowed text-slate-300 dark:text-slate-600' : ''}
                        ${selected ? 'bg-primary text-white shadow-md' : ''}
                        ${isToday && !selected ? 'border border-primary text-primary dark:text-blue-400' : ''}
                        ${!past && !selected && !isToday ? 'text-text hover:bg-blue-50 dark:text-white dark:hover:bg-slate-700' : ''}
                      `}
                    >{toAr(day)}</button>
                  );
                })}
              </div>
            ))}
          </div>
          {selectedDate && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-blue-50/80 px-3.5 py-2.5 text-xs font-semibold text-primary dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/50">
              <Calendar className="h-4 w-4 shrink-0 text-primary dark:text-blue-400" />
              <span>
                {language === 'ar' ? 'الموعد المختار:' : 'Scheduled Date:'}{' '}
                {longDate(selectedDate)}
              </span>
            </div>
          )}
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {language === 'ar'
              ? `يمكن الحجز حتى ${toAr(MAX_DAYS_AHEAD)} يوماً مقدماً (بتوقيت السعودية).`
              : `Bookings open up to ${MAX_DAYS_AHEAD} days ahead (Saudi time).`}
          </p>
          <p className="mt-3 flex items-start gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary dark:text-blue-400" />
            <span>
              {language === 'ar'
                ? 'سيتصل بك الفني قبل الزيارة لتأكيد الوقت المناسب لك.'
                : 'Our technician will call you before the visit to agree on a time that suits you.'}
            </span>
          </p>
          {errors.date && <p id="err-date" role="alert" className="mt-2 text-xs font-semibold text-red-500">{errors.date}</p>}
        </div>

        {/* Location Section */}
        <div className="mb-2 flex items-center justify-between">
          <SectionTitle step={toAr(3)} icon={<MapPin className="h-5 w-5" />} title={t.serviceLocation || 'Service Location'} />
          <button
            type="button"
            onClick={() => {
              // Switching mode starts a new address, so the detected GPS point no longer applies
              setIsManualAddress((prev) => !prev);
              setCoords(null);
              setGeoCountry('');
              setErrors((prev) => ({ ...prev, city: null, area: null, customArea: null, subLocation: null, manualAddress: null }));
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline dark:text-blue-400"
          >
            {isManualAddress ? (
              <>
                <Building2 className="h-3.5 w-3.5" />
                <span>{language === 'ar' ? 'اختيار بالمدينة والحي' : 'Choose City & District'}</span>
              </>
            ) : (
              <>
                <Edit3 className="h-3.5 w-3.5" />
                <span>{language === 'ar' ? 'كتابة العنوان يدوياً' : 'Type Full Address Manually'}</span>
              </>
            )}
          </button>
        </div>

        <div className="scroll-reveal delay-100 mb-6 rounded-2xl border border-border bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          {/* Quick GPS location bar */}
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3 dark:border-blue-950/60 dark:bg-blue-950/30">
            <div className="flex items-center gap-2 min-w-0">
              <Crosshair className="h-4 w-4 shrink-0 text-primary dark:text-blue-400" />
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {language === 'ar' ? 'تحديد العنوان عبر GPS' : 'Auto-detect address via GPS'}
                </p>
                {coords && (
                  <p className="text-xs font-mono text-primary dark:text-blue-400 font-semibold">
                    GPS: {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={locating}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-white px-3 py-1.5 text-xs font-semibold text-primary shadow-xs hover:bg-blue-50/50 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-blue-400 dark:hover:bg-slate-700 transition"
            >
              {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Crosshair className="h-3.5 w-3.5" />}
              <span>{locating ? (language === 'ar' ? 'جارٍ التحديد...' : 'Locating...') : (language === 'ar' ? 'موقعي الحالي' : 'Current Location')}</span>
            </button>
          </div>

          {locationError && (
            <div role="alert" className="mb-4 -mt-2 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold leading-relaxed text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{locationError}</span>
            </div>
          )}

          {isOutsideSaudi && (
            <div role="alert" className="mb-4 -mt-2 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs font-semibold leading-relaxed text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{outsideSaudiMsg}</span>
            </div>
          )}

          {isFarFromServiceArea && (
            <div role="status" className="mb-4 -mt-2 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2.5 text-xs font-semibold leading-relaxed text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/20 dark:text-amber-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                {language === 'ar'
                  ? 'موقعك يبدو بعيداً عن منطقة خدمتنا المعتادة (جدة ومكة المكرمة). يمكنك متابعة الحجز، وسنتواصل معك لتأكيد إمكانية الوصول.'
                  : 'Your location looks far from our usual service area (Jeddah & Makkah). You can still book; we will call you to confirm we can reach you.'}
              </span>
            </div>
          )}

          {isManualAddress ? (
            /* Mode B: Full Manual Address Entry */
            <div id="field-manualAddress" className="space-y-2">
              <label htmlFor="field-manualAddress-input" className="block text-xs font-semibold text-sub dark:text-slate-400">
                {language === 'ar' ? 'العنوان الكامل بالتفصيل' : 'Full Detailed Address'} <span className="text-red-500">*</span>
              </label>
              <textarea
                id="field-manualAddress-input"
                name="streetAddress"
                autoComplete="street-address"
                required
                aria-required="true"
                aria-invalid={!!errors.manualAddress}
                aria-describedby={errors.manualAddress ? 'err-manualAddress' : undefined}
                rows={3}
                value={manualAddress}
                onChange={(e) => {
                  // Keep the detected GPS point: edits here usually add a flat number or fix a street name,
                  // and the location check must still apply. Switching address mode clears it.
                  setManualAddress(e.target.value);
                  if (errors.manualAddress) setErrors((prev) => ({ ...prev, manualAddress: null }));
                }}
                placeholder={
                  language === 'ar'
                    ? 'مثال: جدة، حي الروضة، شارع صاري، عمارة ٤، الدور الثاني، شقة ٦'
                    : 'e.g., Jeddah, Al Rawdah, Sari Street, Building 4, 2nd Floor, Apt 6'
                }
                className={`w-full resize-none rounded-xl border py-3 px-4 text-sm font-semibold text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-slate-800 dark:text-white ${
                  errors.manualAddress ? 'border-red-400' : manualAddress ? 'border-primary dark:border-blue-500' : 'border-border dark:border-slate-600'
                }`}
              />
              {errors.manualAddress && <p id="err-manualAddress" role="alert" className="text-xs font-semibold text-red-500">{errors.manualAddress}</p>}
            </div>
          ) : (
            /* Mode A: Guided City & District Selection */
            <div className="space-y-4">

              {/* City Selection: Filtered by Selected Country */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span id="label-city" className="block text-xs font-semibold text-sub dark:text-slate-400">
                    {language === 'ar' ? 'المدينة' : 'City'} <span className="text-red-500">*</span>
                  </span>
                  <span className="text-xs font-semibold text-primary dark:text-blue-400">
                    {language === 'ar' ? 'مدن ومناطق السعودية' : 'Saudi Arabia Cities'}
                  </span>
                </div>
                <div id="field-city" role="group" aria-labelledby="label-city" aria-required="true" aria-invalid={!!errors.city} aria-describedby={errors.city ? 'err-city' : undefined} className="grid grid-cols-2 gap-2.5">
                  {Object.entries(LOCATION_DATA)
                    .map(([key, city]) => {
                      const active = selectedCity === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleSelectCity(key)}
                          aria-pressed={active}
                          className={`flex items-center justify-center gap-2 rounded-xl border py-3 px-4 text-sm font-semibold transition-all duration-200 cursor-pointer ${
                            active
                              ? 'border-primary bg-primary text-white shadow-md shadow-primary/25 ring-2 ring-primary/20'
                              : 'border-border bg-white text-text hover:border-primary/50 hover:bg-blue-50/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700'
                          }`}
                        >
                          <span>{language === 'ar' ? city.ar : city.en}</span>
                        </button>
                      );
                    })}
                </div>
                {errors.city && <p id="err-city" role="alert" className="mt-1 text-xs font-semibold text-red-500">{errors.city}</p>}
              </div>

              {/* Area Selection: Automatically revealed once city is selected! */}
              {selectedCity && (
                <div className="space-y-1.5 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <label htmlFor="field-area" className="block text-xs font-semibold text-sub dark:text-slate-400">
                      {language === 'ar' ? 'الحي / المنطقة' : 'District / Area'} <span className="text-red-500">*</span>
                    </label>
                    <span className="text-xs font-semibold text-primary dark:text-blue-400">
                      {toAr(LOCATION_DATA[selectedCity]?.areas?.length || 0)} {language === 'ar' ? 'حي متاح' : 'districts available'}
                    </span>
                  </div>
                  <select
                    id="field-area"
                    name="district"
                    required
                    aria-required="true"
                    aria-invalid={!!errors.area}
                    aria-describedby={errors.area ? 'err-area' : undefined}
                    value={selectedArea}
                    onChange={(e) => {
                      setSelectedArea(e.target.value);
                      if (e.target.value !== 'OTHER') setCustomArea('');
                      setSubLocation('');
                      if (errors.area) setErrors((prev) => ({ ...prev, area: null }));
                    }}
                    className={`w-full rounded-xl border bg-white py-3 px-4 text-sm font-semibold text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-slate-800 dark:text-white ${
                      errors.area ? 'border-red-400' : selectedArea ? 'border-primary dark:border-blue-500' : 'border-border dark:border-slate-600'
                    }`}
                  >
                    <option value="">{language === 'ar' ? 'اختر الحي من القائمة...' : 'Select district from list...'}</option>
                    {LOCATION_DATA[selectedCity]?.areas.map((area, i) => (
                      <option key={i} value={area.en}>{language === 'ar' ? area.ar : area.en}</option>
                    ))}
                    <option value="OTHER">{language === 'ar' ? 'حي آخر (كتابة اسم الحي يدوياً)' : 'Other District (Type Manually)'}</option>
                  </select>
                  {errors.area && <p id="err-area" role="alert" className="text-xs font-semibold text-red-500">{errors.area}</p>}
                </div>
              )}

              {/* Custom Area if user chooses OTHER */}
              {selectedCity && selectedArea === 'OTHER' && (
                <div className="space-y-1.5 transition-all duration-300">
                  <label htmlFor="field-customArea" className="block text-xs font-semibold text-sub dark:text-slate-400">
                    {language === 'ar' ? 'اسم الحي يدوياً' : 'District Name (Manual)'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="field-customArea"
                    name="customArea"
                    type="text"
                    autoComplete="address-level3"
                    required
                    aria-required="true"
                    aria-invalid={!!errors.customArea}
                    aria-describedby={errors.customArea ? 'err-customArea' : undefined}
                    value={customArea}
                    onChange={(e) => {
                      setCustomArea(e.target.value);
                      if (errors.customArea) setErrors((prev) => ({ ...prev, customArea: null }));
                    }}
                    placeholder={language === 'ar' ? 'أدخل اسم الحي أو المعلم القريب' : 'Enter district or landmark name'}
                    className={`w-full rounded-xl border py-3 px-4 text-sm font-semibold text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-slate-800 dark:text-white ${
                      errors.customArea ? 'border-red-400' : customArea ? 'border-primary dark:border-blue-500' : 'border-border dark:border-slate-600'
                    }`}
                  />
                  {errors.customArea && <p id="err-customArea" role="alert" className="text-xs font-semibold text-red-500">{errors.customArea}</p>}
                </div>
              )}

              {/* SubLocation / Detailed Street details */}
              {selectedCity && selectedArea && (
                <div className="space-y-1.5 transition-all duration-300">
                  <label htmlFor="field-subLocation" className="block text-xs font-semibold text-sub dark:text-slate-400">
                    {language === 'ar' ? 'العنوان التفصيلي (الشارع / رقم المبنى / الشقة)' : 'Street / Building / Apt Details'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="field-subLocation"
                    name="addressLine1"
                    type="text"
                    autoComplete="address-line1"
                    required
                    aria-required="true"
                    aria-invalid={!!errors.subLocation}
                    aria-describedby={errors.subLocation ? 'err-subLocation' : undefined}
                    value={subLocation}
                    onChange={(e) => {
                      setSubLocation(e.target.value);
                      if (errors.subLocation) setErrors((prev) => ({ ...prev, subLocation: null }));
                    }}
                    placeholder={language === 'ar' ? 'مثال: شارع صاري، مبنى ٤، شقة ١٢' : 'e.g., Sari St, Building 4, Apt 12'}
                    className={`w-full rounded-xl border py-3 px-4 text-sm font-semibold text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-slate-800 dark:text-white ${
                      errors.subLocation ? 'border-red-400' : subLocation ? 'border-primary dark:border-blue-500' : 'border-border dark:border-slate-600'
                    }`}
                  />
                  {errors.subLocation && <p id="err-subLocation" role="alert" className="text-xs font-semibold text-red-500">{errors.subLocation}</p>}
                </div>
              )}
            </div>
          )}

          {/* Real-time Full Address Confirmation Box */}
          {/* Green "for the technician" only once every required part is there; a neutral preview before that */}
          {getFullAddress() && (addressComplete ? (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  {language === 'ar' ? 'العنوان الذي سيصل للفني' : 'Address the technician will receive'}
                </p>
                <p className="text-xs font-semibold text-text dark:text-white mt-0.5 break-words">
                  {getFullAddress()}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3.5 dark:border-slate-600 dark:bg-slate-800/40">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {language === 'ar' ? 'معاينة العنوان (غير مكتمل بعد)' : 'Address preview (not complete yet)'}
                </p>
                <p className="text-xs font-semibold text-text dark:text-white mt-0.5 break-words">
                  {getFullAddress()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Notes Section */}
        <SectionTitle step={toAr(4)} icon={<FileText className="h-5 w-5" />} title={t.additionalNotes || 'Additional Notes (Optional)'} />
        <div className="scroll-reveal mb-6 rounded-2xl border border-border bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <label htmlFor="field-notes" className="sr-only">
            {t.additionalNotes || 'Additional Notes (Optional)'}
          </label>
          <textarea
            id="field-notes"
            name="notes"
            autoComplete="off"
            value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
            placeholder={t.specialInstructions || 'Any special instructions for the technician...'}
            className="w-full resize-none rounded-xl border border-border bg-white py-3 px-4 text-sm font-semibold text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>

        {/* Summary Card */}
        <div className="scroll-reveal-scale mb-6 overflow-hidden rounded-2xl border border-border bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-border px-5 py-3.5 dark:border-slate-700 flex items-center justify-between gap-3">
            <h3 className="shrink-0 text-sm font-semibold text-text dark:text-white">{t.bookingSummary || 'Booking Summary'}</h3>
            <span className="inline-flex min-w-0 items-center gap-1.5 text-xs font-semibold text-primary dark:text-blue-400">
              <ServiceIcon service={service} className="w-3.5 h-3.5 shrink-0 stroke-[2]" />
              <span className="line-clamp-2">{svcName}</span>
            </span>
          </div>

          {/* Quick Live Preview Rows */}
          <div className="border-b border-border bg-slate-50/60 px-5 py-3 text-xs dark:border-slate-700 dark:bg-slate-800/40 space-y-1.5">
            <div className="flex items-center justify-between text-sub dark:text-slate-400">
              <span>{language === 'ar' ? 'العميل:' : 'Customer:'}</span>
              <span className="font-semibold text-text dark:text-white truncate max-w-[200px]">
                {fullName.trim() || '—'} {phoneNumber ? <bdi dir="ltr">({countryCode}{phoneNumber})</bdi> : ''}
              </span>
            </div>
            <div className="flex items-center justify-between text-sub dark:text-slate-400">
              <span>{language === 'ar' ? 'الموعد:' : 'Scheduled:'}</span>
              <span className="font-semibold text-text dark:text-white">
                {selectedDate
                  ? selectedDate.toLocaleDateString(dateLocale, {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })
                  : (language === 'ar' ? 'لم يحدد بعد' : 'Not selected')}
              </span>
            </div>
            <div className="flex items-center justify-between text-sub dark:text-slate-400">
              <span>{language === 'ar' ? 'الموقع:' : 'Location:'}</span>
              <span className="font-semibold text-text dark:text-white truncate max-w-[220px]">
                {getFullAddress() || (language === 'ar' ? 'لم يحدد بعد' : 'Not specified')}
              </span>
            </div>
          </div>

          <div className="space-y-3 px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-sub dark:text-slate-400">
                {isPackage ? (language === 'ar' ? 'سعر الباقة' : 'Package price') : (t.serviceCharge || 'Service Charge')}
              </span>
              <span className="text-sm font-semibold text-text dark:text-white">{formatPrice(servicePrice, currency)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-sub dark:text-slate-400">{t.visitFee || 'Visit Fee'}</span>
              {isPackage ? (
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  {language === 'ar' ? 'رسوم الزيارة مشمولة' : 'Visit fee included'}
                </span>
              ) : (
                <span className="text-sm font-semibold text-text dark:text-white">{formatPrice(visitFee, currency)}</span>
              )}
            </div>
            <div className="border-t border-dashed border-border pt-3 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-text dark:text-white">{t.totalAmount || 'Total'}</span>
                <span className="text-xl font-semibold text-primary dark:text-blue-400">{formatPrice(totalAmount, currency)}</span>
              </div>
            </div>
          </div>
          <div className="border-t border-border bg-blue-50/50 px-5 py-3 dark:border-slate-700 dark:bg-slate-800/50 space-y-1.5 text-center">
            <p className="text-xs font-semibold text-sub dark:text-slate-400">
              <Banknote className="me-1.5 inline h-3.5 w-3.5 align-[-2px]" aria-hidden="true" />
              {t.cashPaymentNote || 'Cash payment after service completion'}
            </p>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {vatText} • {sparePartsText}
            </p>
            <p className="pt-1 text-xs font-semibold text-primary dark:text-blue-400 border-t border-blue-100/60 dark:border-slate-700/60">
              {priceNote}
            </p>
          </div>
        </div>

        {submitError && (
          <div role="alert" className="mb-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Confirm Button */}
        <button onClick={handleSubmit} disabled={submitting}
          className="scroll-reveal-scale flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary-dark disabled:opacity-60 dark:bg-blue-600 dark:shadow-blue-900/30 dark:hover:bg-blue-700"
        >
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
          {submitting
            ? (t.loading || 'Loading...')
            : !user
              ? (language === 'ar' ? 'تسجيل الدخول وتأكيد الحجز' : 'Log In to Confirm Booking')
              : (t.confirmBooking || 'Confirm Booking')}
        </button>

        <div className="mt-3 flex items-center justify-center gap-1.5 pb-4">
          <Shield className="h-3.5 w-3.5 text-emerald-500" />
          <p className="text-xs font-semibold text-sub dark:text-slate-500">{t.bookingSecure || 'Your booking is secured & encrypted'}</p>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ icon, title, step }) {
  return (
    <div className="scroll-reveal mb-3 flex items-center gap-2">
      {step && (
        <span aria-hidden="true" className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white dark:bg-blue-600">
          {step}
        </span>
      )}
      <div className="text-primary dark:text-blue-400">{icon}</div>
      <h2 className="text-sm font-semibold text-text dark:text-white">{title}</h2>
    </div>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3 px-5 py-3.5">
      <div className="mt-0.5 text-primary dark:text-blue-400">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase text-sub dark:text-slate-500">{label}</p>
        <p className="text-sm font-semibold text-text dark:text-white">{value}</p>
      </div>
    </div>
  );
}

