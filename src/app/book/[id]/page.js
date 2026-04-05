'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Loader2, MapPin, Navigation, Calendar, Clock, FileText,
  ChevronLeft, ChevronRight, User, Phone, CheckCircle2, Shield,
  Sparkles, AlertCircle,
} from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';
import { useAuth } from '@/contexts/AuthContext';
import { getServices, createBooking } from '@/lib/api';

const VISIT_FEE = 200;

const TIME_SLOTS = [
  { time: '09:00 AM', busy: false },
  { time: '10:00 AM', busy: false },
  { time: '11:00 AM', busy: true },
  { time: '12:00 PM', busy: false },
  { time: '01:00 PM', busy: false },
  { time: '02:00 PM', busy: true },
  { time: '03:00 PM', busy: false },
  { time: '04:00 PM', busy: false },
  { time: '05:00 PM', busy: false },
  { time: '06:00 PM', busy: false },
];

const COUNTRY_CODES = [
  { code: '+92', label: '🇵🇰 +92', country: 'PK' },
  { code: '+966', label: '🇸🇦 +966', country: 'SA' },
];

const DAY_NAMES_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES_AR = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
const MONTH_NAMES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_NAMES_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

const LOCATION_DATA = {
  jeddah: {
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

function isPast(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const { t, language, isRTL, toAr, formatPrice } = useTranslation();
  const { user, token, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !token) {
      router.replace('/login');
    }
  }, [authLoading, token, router]);

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [fullName, setFullName] = useState('');
  const [countryCode, setCountryCode] = useState('+92');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [addressMode, setAddressMode] = useState('manual');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [subLocation, setSubLocation] = useState('');
  const [gpsAddress, setGpsAddress] = useState('');
  const [errors, setErrors] = useState({});

  const today = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  }, []);
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());

  useEffect(() => {
    if (user) {
      if (user.name && !fullName) setFullName(user.name);
      if (user.phone && !phoneNumber) {
        const ph = user.phone.replace(/^\+\d{2,3}/, '');
        setPhoneNumber(ph);
      }
    }
  }, [user]);

  useEffect(() => {
    loadService();
  }, [params.id]);

  const loadService = async () => {
    setLoading(true);
    try {
      const res = await getServices();
      const list = res?.services ?? res?.data ?? res;
      if (Array.isArray(list)) {
        const found = list.find((s) => (s._id || s.id) === params.id);
        setService(found || null);
      }
    } catch {
      setService(null);
    } finally {
      setLoading(false);
    }
  };

  const monthGrid = useMemo(() => getMonthGrid(calYear, calMonth), [calYear, calMonth]);
  const dayNames = language === 'ar' ? DAY_NAMES_AR : DAY_NAMES_EN;
  const monthNames = language === 'ar' ? MONTH_NAMES_AR : MONTH_NAMES_EN;

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); }
    else setCalMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); }
    else setCalMonth((m) => m + 1);
  };

  const selectQuickDate = (offset) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d);
    setCalMonth(d.getMonth());
    setCalYear(d.getFullYear());
  };

  const [coordinates, setCoordinates] = useState(null);

  const handleGPS = useCallback(() => {
    if (!navigator.geolocation) {
      alert(language === 'ar' ? 'GPS غير مدعوم في هذا المتصفح' : 'GPS not supported on this browser.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoordinates({ latitude, longitude });
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&accept-language=${language === 'ar' ? 'ar' : 'en'}`,
            { headers: { 'User-Agent': 'AhmedCoolingWorkshop/1.0' } }
          );
          const data = await resp.json();
          setGpsAddress(data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        } catch {
          setGpsAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        }
        setAddressMode('gps');
        setGpsLoading(false);
      },
      () => {
        setGpsLoading(false);
        alert(language === 'ar' ? 'تعذر تحديد الموقع' : 'Could not get location.');
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, [language]);

  const getFullAddress = () => {
    if (addressMode === 'gps' && gpsAddress) return gpsAddress;
    if (!selectedCity || !selectedArea || !subLocation.trim()) return '';
    const city = LOCATION_DATA[selectedCity];
    const area = city?.areas.find(a => a.en === selectedArea);
    const cityName = language === 'ar' ? city?.ar : city?.en;
    const areaName = language === 'ar' ? area?.ar : area?.en;
    return `${subLocation.trim()}, ${areaName}, ${cityName}`;
  };

  const servicePrice = service?.basePrice || service?.price || 0;
  const totalAmount = servicePrice + VISIT_FEE;

  const validate = () => {
    const e = {};
    if (!fullName.trim()) e.fullName = t.enterNameMsg || 'Name is required';
    if (!phoneNumber.trim()) e.phone = t.enterPhoneMsg || 'Phone is required';
    if (!selectedDate) e.date = t.selectDateMsg || 'Select a date';
    if (!selectedTime) e.time = t.selectTimeMsg || 'Select a time';
    if (addressMode === 'manual') {
      if (!selectedCity) e.city = language === 'ar' ? 'اختر المدينة' : 'City is required';
      if (selectedCity && !selectedArea) e.area = language === 'ar' ? 'اختر المنطقة' : 'Area is required';
      if (selectedArea && !subLocation.trim()) e.subLocation = language === 'ar' ? 'أدخل العنوان التفصيلي' : 'Street/House details required';
    } else {
      if (!gpsAddress) e.gps = language === 'ar' ? 'حدد موقعك الحالي' : 'Please detect your location';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
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
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime,
        address: getFullAddress(),
        coordinates: coordinates || { latitude: 0, longitude: 0 },
        comments: notes.trim(),
        language: language || 'en',
        platform: 'web',
        totalAmount,
      };
      const res = await createBooking(bookingData);
      if (res?.success) {
        alert((t.bookingConfirmed || 'Booking Confirmed!') + '\n\n' + (t.bookingSuccess || 'We will contact you soon.'));
        router.push('/bookings');
      } else {
        alert(res?.message || t.bookingErrorMsg || 'Failed to create booking.');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || '';
      alert(msg || t.bookingErrorMsg || 'Failed to create booking. Please try again.');
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
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 bg-bg dark:bg-slate-950">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-sm font-bold text-text dark:text-white">Service not found</p>
        <button onClick={() => router.push('/services')} className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-dark">
          {t.browseServices || 'Browse Services'}
        </button>
      </div>
    );
  }

  const svcName = language === 'ar' && service.nameAr ? service.nameAr : service.name;
  const svcDesc = language === 'ar' && service.descriptionAr ? service.descriptionAr : service.description;

  return (
    <div className="min-h-screen bg-bg pb-10 dark:bg-slate-950" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6 lg:px-8">

        {/* Service Hero Card */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 text-2xl backdrop-blur-sm">
                {service.icon || '🔧'}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-lg font-black text-white">{svcName}</h1>
                <p className="mt-0.5 text-sm text-blue-100">{svcDesc}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-blue-500/20 bg-blue-50 px-5 py-3 dark:bg-slate-800">
            <span className="text-xs font-bold text-sub dark:text-slate-400">{t.servicePrice || 'Service Price'}</span>
            <span className="text-lg font-black text-primary dark:text-blue-400">{formatPrice(servicePrice)}</span>
          </div>
        </div>

        {/* Contact Section */}
        <SectionTitle icon={<User className="h-5 w-5" />} title={t.contactInfo || 'Contact Information'} />
        <div className="mb-6 space-y-3 rounded-2xl border border-border bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-sub dark:text-slate-400">{t.fullNameInput || 'Full Name'}</label>
            <div className="relative">
              <User className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-sub dark:text-slate-500" />
              <input
                type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                placeholder={t.enterFullName || 'John Doe'}
                className={`w-full rounded-xl border py-3 pr-4 pl-10 text-sm font-semibold text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-slate-800 dark:text-white ${errors.fullName ? 'border-red-400' : 'border-border dark:border-slate-600'}`}
              />
            </div>
            {errors.fullName && <p className="mt-1 text-xs font-semibold text-red-500">{errors.fullName}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-sub dark:text-slate-400">{t.mobileNumber || 'Mobile Number'}</label>
            <div className="flex gap-2">
              <select
                value={countryCode} onChange={(e) => setCountryCode(e.target.value)}
                className="shrink-0 rounded-xl border border-border bg-white px-2 py-3 text-sm font-bold text-text dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              >
                {COUNTRY_CODES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
              <div className="relative flex-1">
                <Phone className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-sub dark:text-slate-500" />
                <input
                  type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="3001234567"
                  className={`w-full rounded-xl border py-3 pr-4 pl-10 text-sm font-semibold text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-slate-800 dark:text-white ${errors.phone ? 'border-red-400' : 'border-border dark:border-slate-600'}`}
                />
              </div>
            </div>
            {errors.phone && <p className="mt-1 text-xs font-semibold text-red-500">{errors.phone}</p>}
          </div>
        </div>

        {/* Date & Time Section */}
        <SectionTitle icon={<Calendar className="h-5 w-5" />} title={t.selectDateTime || 'Select Date & Time'} />
        <div className="mb-6 rounded-2xl border border-border bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
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
                <button key={offset} onClick={() => selectQuickDate(offset)}
                  className={`flex-1 rounded-xl border px-3 py-2 text-xs font-extrabold transition ${active ? 'border-primary bg-primary text-white' : 'border-border bg-white text-text hover:border-primary/40 dark:border-slate-600 dark:bg-slate-800 dark:text-white'}`}
                >{label}</button>
              );
            })}
          </div>

          {/* Calendar grid */}
          <div className="mb-5 rounded-xl border border-border bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
            <div className="mb-3 flex items-center justify-between">
              <button onClick={prevMonth} className="rounded-lg p-1.5 transition hover:bg-slate-200 dark:hover:bg-slate-700">
                <ChevronLeft className="h-4 w-4 text-text dark:text-white" />
              </button>
              <span className="text-sm font-black text-text dark:text-white">
                {monthNames[calMonth]} {calYear}
              </span>
              <button onClick={nextMonth} className="rounded-lg p-1.5 transition hover:bg-slate-200 dark:hover:bg-slate-700">
                <ChevronRight className="h-4 w-4 text-text dark:text-white" />
              </button>
            </div>
            <div className="mb-1 grid grid-cols-7 gap-1">
              {dayNames.map((d) => (
                <div key={d} className="py-1 text-center text-[10px] font-bold text-sub dark:text-slate-500">{d}</div>
              ))}
            </div>
            {monthGrid.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1">
                {week.map((day, di) => {
                  if (!day) return <div key={di} />;
                  const date = new Date(calYear, calMonth, day);
                  const past = isPast(date);
                  const isToday = isSameDay(date, today);
                  const selected = selectedDate && isSameDay(date, selectedDate);
                  return (
                    <button key={di} disabled={past}
                      onClick={() => setSelectedDate(date)}
                      className={`flex h-9 w-full items-center justify-center rounded-lg text-xs font-bold transition
                        ${past ? 'cursor-not-allowed text-slate-300 dark:text-slate-600' : ''}
                        ${selected ? 'bg-primary text-white shadow-md' : ''}
                        ${isToday && !selected ? 'border border-primary text-primary dark:text-blue-400' : ''}
                        ${!past && !selected && !isToday ? 'text-text hover:bg-blue-50 dark:text-white dark:hover:bg-slate-700' : ''}
                      `}
                    >{day}</button>
                  );
                })}
              </div>
            ))}
          </div>
          {errors.date && <p className="mb-3 text-xs font-semibold text-red-500">{errors.date}</p>}

          {/* Time slots */}
          <p className="mb-2 text-xs font-black tracking-wide text-sub uppercase dark:text-slate-400">{t.selectTime || 'SELECT TIME'}</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {TIME_SLOTS.map(({ time, busy }) => {
              const active = selectedTime === time;
              return (
                <button key={time} disabled={busy}
                  onClick={() => setSelectedTime(time)}
                  className={`rounded-xl border px-2 py-2.5 text-xs font-bold transition
                    ${busy ? 'cursor-not-allowed border-border bg-slate-100 text-slate-400 line-through dark:border-slate-700 dark:bg-slate-800 dark:text-slate-600' : ''}
                    ${active ? 'border-primary bg-primary text-white shadow-md' : ''}
                    ${!busy && !active ? 'border-border bg-white text-text hover:border-primary/40 dark:border-slate-600 dark:bg-slate-800 dark:text-white' : ''}
                  `}
                >
                  {time}
                  {busy && <span className="mt-0.5 block text-[9px] font-semibold">{language === 'ar' ? 'مشغول' : 'Busy'}</span>}
                </button>
              );
            })}
          </div>
          {errors.time && <p className="mt-2 text-xs font-semibold text-red-500">{errors.time}</p>}
        </div>

        {/* Location Section */}
        <SectionTitle icon={<MapPin className="h-5 w-5" />} title={t.serviceLocation || 'Service Location'} />
        <div className="mb-6 rounded-2xl border border-border bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          {/* Mode Tabs */}
          <div className="mb-4 flex gap-2">
            <button onClick={() => setAddressMode('manual')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-bold transition ${addressMode === 'manual' ? 'border-primary bg-primary text-white dark:border-blue-500 dark:bg-blue-600' : 'border-border bg-white text-text hover:border-primary/40 dark:border-slate-600 dark:bg-slate-800 dark:text-white'}`}
            >
              <MapPin className="h-3.5 w-3.5" />
              {language === 'ar' ? 'العنوان يدوياً' : 'Enter Manually'}
            </button>
            <button onClick={() => setAddressMode('gps')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-bold transition ${addressMode === 'gps' ? 'border-primary bg-primary text-white dark:border-blue-500 dark:bg-blue-600' : 'border-border bg-white text-text hover:border-primary/40 dark:border-slate-600 dark:bg-slate-800 dark:text-white'}`}
            >
              <Navigation className="h-3.5 w-3.5" />
              {language === 'ar' ? 'الموقع الحالي' : 'Current Location'}
            </button>
          </div>

          {/* Manual Address Fields */}
          {addressMode === 'manual' && (
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-sub dark:text-slate-400">
                  {language === 'ar' ? 'المدينة' : 'City'} <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => { setSelectedCity(e.target.value); setSelectedArea(''); setSubLocation(''); }}
                  className={`w-full rounded-xl border bg-white py-3 px-4 text-sm font-semibold text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-slate-800 dark:text-white ${errors.city ? 'border-red-400' : selectedCity ? 'border-primary dark:border-blue-500' : 'border-border dark:border-slate-600'}`}
                >
                  <option value="">{language === 'ar' ? 'اختر المدينة' : 'Select City'}</option>
                  {Object.entries(LOCATION_DATA).map(([key, city]) => (
                    <option key={key} value={key}>{language === 'ar' ? city.ar : city.en}</option>
                  ))}
                </select>
                {errors.city && <p className="mt-1 text-xs font-semibold text-red-500">{errors.city}</p>}
              </div>

              {selectedCity && (
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-sub dark:text-slate-400">
                    {language === 'ar' ? 'الموقع الرئيسي' : 'Main Location'} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedArea}
                    onChange={(e) => { setSelectedArea(e.target.value); setSubLocation(''); }}
                    className={`w-full rounded-xl border bg-white py-3 px-4 text-sm font-semibold text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-slate-800 dark:text-white ${errors.area ? 'border-red-400' : selectedArea ? 'border-primary dark:border-blue-500' : 'border-border dark:border-slate-600'}`}
                  >
                    <option value="">{language === 'ar' ? 'اختر المنطقة' : 'Select Area'}</option>
                    {LOCATION_DATA[selectedCity]?.areas.map((area, i) => (
                      <option key={i} value={area.en}>{language === 'ar' ? area.ar : area.en}</option>
                    ))}
                  </select>
                  {errors.area && <p className="mt-1 text-xs font-semibold text-red-500">{errors.area}</p>}
                </div>
              )}

              {selectedArea && (
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-sub dark:text-slate-400">
                    {language === 'ar' ? 'العنوان التفصيلي' : 'Street / Block / House No'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text" value={subLocation} onChange={(e) => setSubLocation(e.target.value)}
                    placeholder={language === 'ar' ? 'مثال: شارع ٥، بلوك B، منزل ١٢' : 'e.g., Street 5, Block B, House 12'}
                    className={`w-full rounded-xl border py-3 px-4 text-sm font-semibold text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-slate-800 dark:text-white ${errors.subLocation ? 'border-red-400' : subLocation ? 'border-primary dark:border-blue-500' : 'border-border dark:border-slate-600'}`}
                  />
                  {errors.subLocation && <p className="mt-1 text-xs font-semibold text-red-500">{errors.subLocation}</p>}
                </div>
              )}

              {selectedCity && selectedArea && subLocation.trim() && (
                <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-slate-600 dark:bg-slate-700">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary dark:text-blue-400" />
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase text-sub dark:text-slate-400">{language === 'ar' ? 'العنوان الكامل' : 'Full Address'}</p>
                    <p className="text-xs font-semibold text-text dark:text-white">{getFullAddress()}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* GPS Mode */}
          {addressMode === 'gps' && (
            <div>
              <button onClick={handleGPS} disabled={gpsLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-blue-50 py-3.5 text-sm font-bold text-primary transition hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-950/30 dark:text-blue-400"
              >
                {gpsLoading
                  ? <Loader2 className="h-5 w-5 animate-spin" />
                  : <Navigation className="h-5 w-5" />
                }
                {gpsLoading
                  ? (language === 'ar' ? 'جاري تحديد الموقع...' : 'Detecting location...')
                  : (language === 'ar' ? 'تحديد موقعي الحالي' : 'Detect My Location')
                }
              </button>
              {gpsAddress && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-slate-600 dark:bg-slate-700">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary dark:text-blue-400" />
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase text-sub dark:text-slate-400">{language === 'ar' ? 'الموقع المحدد' : 'Detected Location'}</p>
                    <p className="text-xs font-semibold text-text dark:text-white">{gpsAddress}</p>
                  </div>
                  <button onClick={() => { setGpsAddress(''); setCoordinates(null); }} className="text-xs font-bold text-primary dark:text-blue-400">{t.clearAddress || 'Clear'}</button>
                </div>
              )}
              {!gpsAddress && <p className="mt-2 text-center text-[11px] font-semibold text-sub dark:text-slate-500">{language === 'ar' ? 'اضغط الزر لتحديد موقعك تلقائياً' : 'Tap to detect your current location'}</p>}
              {errors.gps && <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.gps}</p>}
            </div>
          )}
        </div>

        {/* Notes Section */}
        <SectionTitle icon={<FileText className="h-5 w-5" />} title={t.additionalNotes || 'Additional Notes (Optional)'} />
        <div className="mb-6 rounded-2xl border border-border bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <textarea
            value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
            placeholder={t.specialInstructions || 'Any special instructions for the technician...'}
            className="w-full resize-none rounded-xl border border-border bg-white py-3 px-4 text-sm font-semibold text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>

        {/* Summary Card */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-border px-5 py-3 dark:border-slate-700">
            <h3 className="text-sm font-black text-text dark:text-white">{t.bookingSummary || 'Booking Summary'}</h3>
          </div>
          <div className="space-y-3 px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-sub dark:text-slate-400">{t.serviceCharge || 'Service Charge'}</span>
              <span className="text-sm font-bold text-text dark:text-white">{formatPrice(servicePrice)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-sub dark:text-slate-400">{t.visitFee || 'Visit Fee'}</span>
              <span className="text-sm font-bold text-text dark:text-white">{formatPrice(VISIT_FEE)}</span>
            </div>
            <div className="border-t border-dashed border-border pt-3 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-text dark:text-white">{t.totalAmount || 'Total'}</span>
                <span className="text-xl font-black text-primary dark:text-blue-400">{formatPrice(totalAmount)}</span>
              </div>
            </div>
          </div>
          <div className="border-t border-border bg-blue-50/50 px-5 py-2.5 dark:border-slate-700 dark:bg-slate-800/50">
            <p className="text-center text-[11px] font-semibold text-sub dark:text-slate-500">{t.cashPaymentNote || 'Cash payment after service completion'}</p>
          </div>
        </div>

        {/* Confirm Button */}
        <button onClick={handleSubmit} disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-black text-white shadow-lg shadow-primary/25 transition hover:bg-primary-dark disabled:opacity-60 dark:bg-blue-600 dark:shadow-blue-900/30 dark:hover:bg-blue-700"
        >
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
          {submitting ? (t.loading || 'Loading...') : (t.confirmBooking || 'Confirm Booking')}
        </button>

        <div className="mt-3 flex items-center justify-center gap-1.5 pb-4">
          <Shield className="h-3.5 w-3.5 text-emerald-500" />
          <p className="text-[11px] font-semibold text-sub dark:text-slate-500">{t.bookingSecure || 'Your booking is secured & encrypted'}</p>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ icon, title }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <div className="text-primary dark:text-blue-400">{icon}</div>
      <h2 className="text-sm font-black text-text dark:text-white">{title}</h2>
    </div>
  );
}
