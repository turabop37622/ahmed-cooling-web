'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
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
      if (user.address && !address) setAddress(user.address);
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
  const [locQuery, setLocQuery] = useState('');
  const [locResults, setLocResults] = useState([]);
  const [locSearching, setLocSearching] = useState(false);
  const locTimer = useRef(null);

  const handleGPS = useCallback(() => {
    if (!navigator.geolocation) {
      alert('GPS not supported on this browser. Please enter address manually.');
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
          setAddress(data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        } catch {
          setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        }
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        alert('Could not get location. Please allow location access or enter address manually.');
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, [language]);

  const searchLocation = (text) => {
    setLocQuery(text);
    if (text.length < 2) { setLocResults([]); return; }
    clearTimeout(locTimer.current);
    locTimer.current = setTimeout(async () => {
      setLocSearching(true);
      try {
        const lang = language === 'ar' ? 'ar' : 'en';
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&addressdetails=1&limit=8&dedupe=1&accept-language=${lang}`;
        const res = await fetch(url, { headers: { 'User-Agent': 'AhmedCoolingWorkshop/1.0' } });
        const data = await res.json();
        setLocResults(data?.length ? data.map(r => ({ id: r.place_id, title: r.display_name, lat: parseFloat(r.lat), lng: parseFloat(r.lon) })) : []);
      } catch { setLocResults([]); }
      finally { setLocSearching(false); }
    }, 300);
  };

  const selectLocation = (item) => {
    setAddress(item.title);
    setCoordinates({ latitude: item.lat, longitude: item.lng });
    setLocQuery('');
    setLocResults([]);
  };

  const servicePrice = service?.basePrice || service?.price || 0;
  const totalAmount = servicePrice + VISIT_FEE;

  const validate = () => {
    const e = {};
    if (!fullName.trim()) e.fullName = t.enterNameMsg || 'Name is required';
    if (!phoneNumber.trim()) e.phone = t.enterPhoneMsg || 'Phone is required';
    if (!selectedDate) e.date = t.selectDateMsg || 'Select a date';
    if (!selectedTime) e.time = t.selectTimeMsg || 'Select a time';
    if (!address.trim()) e.address = t.setLocationMsg || 'Address is required';
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
        address: address.trim(),
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
      <div className="mx-auto w-full px-4 pt-6 sm:px-8 lg:px-16 xl:px-24">

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
          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="pointer-events-none absolute top-3.5 left-3 h-4 w-4 text-sub dark:text-slate-500" />
              <input
                type="text" value={locQuery} onChange={(e) => searchLocation(e.target.value)}
                placeholder={t.searchLocation || 'Search area, street, city...'}
                className="w-full rounded-xl border border-border py-3 pr-4 pl-10 text-sm font-semibold text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
              />
              {locSearching && <Loader2 className="absolute top-3.5 right-3 h-4 w-4 animate-spin text-primary" />}
            </div>
            <button onClick={handleGPS} disabled={gpsLoading}
              className="rounded-xl border border-border bg-blue-50 px-3 transition hover:bg-blue-100 dark:border-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600"
              title="Get current location"
            >
              {gpsLoading
                ? <Loader2 className="h-5 w-5 animate-spin text-primary dark:text-blue-400" />
                : <Navigation className="h-5 w-5 text-primary dark:text-blue-400" />
              }
            </button>
          </div>

          {/* Search Results */}
          {locResults.length > 0 && (
            <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-border bg-white shadow-lg dark:border-slate-600 dark:bg-slate-800">
              {locResults.map((item, i) => (
                <button key={item.id || i} onClick={() => selectLocation(item)}
                  className="flex w-full items-start gap-2 border-b border-border px-3 py-2.5 text-left transition hover:bg-blue-50 last:border-0 dark:border-slate-700 dark:hover:bg-slate-700"
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-xs font-medium text-text dark:text-white">{item.title}</span>
                </button>
              ))}
            </div>
          )}

          {/* Selected Address */}
          {address && (
            <div className="mt-2 flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-slate-600 dark:bg-slate-700">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary dark:text-blue-400" />
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase text-sub dark:text-slate-400">{t.selectedAddress || 'Selected Address'}</p>
                <p className="text-xs font-semibold text-text dark:text-white">{address}</p>
              </div>
              <button onClick={() => { setAddress(''); setCoordinates(null); }} className="text-xs font-bold text-primary dark:text-blue-400">{t.clearAddress || 'Clear'}</button>
            </div>
          )}
          {!address && <p className="mt-2 text-[11px] font-semibold text-sub dark:text-slate-500">{t.gpsHint || 'Search above or tap location icon for GPS'}</p>}
          {errors.address && <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.address}</p>}
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
