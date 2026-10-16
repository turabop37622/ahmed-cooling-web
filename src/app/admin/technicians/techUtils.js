// Technician helpers shared by the technicians page, its drawers and the booking drawer's assign picker.
// Field names follow F:\qa-admin\TECH-CONTRACT.md.

import { CATEGORY_LABELS, coordsOf, mapLink, orderRef, customerNameOf, phoneOf, bookingDate, bookingTime } from '../bookings/bookingUtils';

export const CITIES = [
  { key: 'jeddah', en: 'Jeddah', ar: 'جدة' },
  { key: 'makkah', en: 'Makkah', ar: 'مكة' },
];

// Specialties use the service categories (same keys as services)
export const SPECIALTIES = ['ac', 'refrigerator', 'washing-machine', 'stove', 'general'].map((key) => ({
  key,
  en: CATEGORY_LABELS[key].en,
  ar: CATEGORY_LABELS[key].ar,
}));

export const SETTLEMENT_METHODS = [
  { key: 'cash', en: 'Cash', ar: 'نقداً' },
  { key: 'bank_transfer', en: 'Bank transfer', ar: 'تحويل بنكي' },
  { key: 'other', en: 'Other', ar: 'أخرى' },
];

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

export const cityLabel = (key, L) => {
  const c = CITIES.find((x) => x.key === key);
  return c ? L(c.en, c.ar) : key ? String(key) : null;
};
export const specialtyLabel = (key, L) => {
  const s = SPECIALTIES.find((x) => x.key === key);
  return s ? L(s.en, s.ar) : key ? String(key) : null;
};
export const methodLabel = (key, L) => {
  const m = SETTLEMENT_METHODS.find((x) => x.key === key);
  return m ? L(m.en, m.ar) : key ? String(key) : '—';
};

// Arabic-Indic (٠-٩) and Persian (۰-۹) digits → ASCII
export function toAsciiDigits(value) {
  return String(value ?? '')
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

// Saudi mobile → "+9665XXXXXXXX", or null when it isn't one.
// Accepts +966 5…, 00966 5…, 966 5…, 05…, 5… with spaces/dashes and Arabic digits.
export function normalizeSaudiPhone(input) {
  let d = toAsciiDigits(input).replace(/[^\d]/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('966')) d = d.slice(3);
  if (d.startsWith('0')) d = d.slice(1);
  return /^5\d{8}$/.test(d) ? `+966${d}` : null;
}

// Any mobile number a technician may use: Saudi numbers become +9665XXXXXXXX, numbers with a country code (+ or 00)
// become +<digits>, anything else keeps its digits. null when it is not 7-15 digits long.
export function normalizeAnyPhone(input) {
  const saudi = normalizeSaudiPhone(input);
  if (saudi) return saudi;
  const ascii = toAsciiDigits(input).trim();
  const digits = ascii.replace(/[^\d]/g, '');
  let out = digits;
  if (ascii.startsWith('+')) out = `+${digits}`;
  else if (digits.startsWith('00')) out = `+${digits.slice(2)}`;
  return /^\d{7,15}$/.test(out.replace('+', '')) ? out : null;
}

// Decimal money input with Arabic digits / Arabic decimal separator → Number, or NaN
export function parseAmount(input) {
  const s = toAsciiDigits(input).replace(/[\u066B,]/g, '.').replace(/[\s\u066C]/g, '').trim();
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return NaN;
  return Number(s);
}

// Booking city text → 'jeddah' | 'makkah' | null (case / Arabic-insensitive)
export function cityKeyOf(text) {
  const s = String(text || '').toLowerCase().trim();
  if (!s) return null;
  if (/jedd?ah|jidd?ah|جد[ةه]/.test(s)) return 'jeddah';
  if (/mak+ah|mec+a|مك[ةه]/.test(s)) return 'makkah';
  return null;
}

// GET /admin/technicians rows: stats may be missing on an older backend (activeJobs at the top level)
export const statsOf = (t) => t?.stats || {};
export const activeJobsOf = (t) => (t?.stats?.activeJobs ?? t?.activeJobs ?? null);
export const pendingJobsOf = (t) => (t?.stats?.pendingJobs ?? null);

export const isAssignable = (t) => !!t && t.active !== false && t.availability !== false && t.hasProfile !== false;

// How well a technician fits a booking: city / specialty match (null = can't tell)
export function fitFor(t, { cityKey, category }) {
  const cities = Array.isArray(t?.cities) ? t.cities : [];
  const specs = Array.isArray(t?.specialties) ? t.specialties : [];
  const cityMatch = !cityKey ? null : cities.length === 0 ? null : cities.includes(cityKey);
  const cat = category ? String(category).toLowerCase() : null;
  const specialtyMatch = !cat ? null : specs.length === 0 ? true : specs.includes(cat);
  return { cityMatch, specialtyMatch, allServices: specs.length === 0 };
}

// Best candidates first: assignable, city match, specialty match, fewer open jobs
export function sortForBooking(list, ctx) {
  const score = (t) => {
    const f = fitFor(t, ctx);
    return (isAssignable(t) ? 0 : 100) + (f.cityMatch === false ? 10 : 0) + (f.specialtyMatch === false ? 5 : 0);
  };
  return [...list].sort((a, b) => score(a) - score(b)
    || (activeJobsOf(a) ?? 0) + (pendingJobsOf(a) ?? 0) - ((activeJobsOf(b) ?? 0) + (pendingJobsOf(b) ?? 0))
    || String(a.name || '').localeCompare(String(b.name || '')));
}

// "03/10/2026" with Latin digits (WhatsApp text is bilingual, so one digit set for both languages)
function ddmmyyyy(value) {
  if (!value) return null;
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Riyadh', day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
}

// Prefilled EN + AR job text for the "Send to technician on WhatsApp" link. Missing values → "—".
export function technicianJobText(booking, { serviceEn, serviceAr }) {
  const dash = '—';
  const date = ddmmyyyy(bookingDate(booking));
  const time = bookingTime(booking);
  const when = [date, time].filter(Boolean).join(' · ') || dash;
  const name = customerNameOf(booking) || dash;
  const phone = phoneOf(booking) || dash;
  const addr = booking?.address ? String(booking.address).trim() : '';
  const cityText = booking?.city && !addr.toLowerCase().includes(String(booking.city).toLowerCase()) ? booking.city : '';
  const address = [addr, cityText].filter(Boolean).join(' — ') || dash;
  const map = mapLink(booking) || dash;
  const total = booking?.totalAmount != null && Number.isFinite(Number(booking.totalAmount)) ? `${Number(booking.totalAmount)} SAR` : dash;
  const service = [serviceEn, serviceAr].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(' / ') || dash;
  const notes = booking?.comments || booking?.notes || booking?.problemDescription;
  return [
    'New job — Ahmed Cooling Workshop',
    'مهمة جديدة — ورشة أحمد للتبريد',
    '',
    `Order / الطلب: ${orderRef(booking)}`,
    `Service / الخدمة: ${service}`,
    `Date / الموعد: ${when}`,
    `Customer / العميل: ${name}`,
    `Phone / الجوال: ${phone}`,
    `Address / العنوان: ${address}`,
    `Map / الخريطة: ${map}`,
    `Total / الإجمالي: ${total}`,
    ...(notes ? [`Notes / ملاحظات: ${String(notes).slice(0, 300)}`] : []),
  ].join('\n');
}

export { coordsOf };
