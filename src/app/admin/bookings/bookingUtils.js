// Booking helpers shared by the admin bookings page, its drawer and the dashboard.
// Status rules follow F:\qa-admin\FIX-CONTRACT.md (single source of truth).

// Labels / colours live in the shared Badges module (single source for the whole admin panel).
import { BOOKING_STATUSES, STATUS_META, statusLabel } from '../components/Badges';

export { STATUS_META, statusLabel };
export const STATUSES = BOOKING_STATUSES;
export const ACTIVE_STATUSES = ['pending', 'confirmed', 'assigned', 'on_the_way', 'in_progress'];

export const normalizeStatus = (s) => String(s || 'pending').replace(/-/g, '_').toLowerCase();

// Tabs on the bookings page; counts come from the API `counts` object with the same keys.
export const TABS = [
  { key: 'all', en: 'All', ar: 'الكل' },
  { key: 'active', en: 'Active', ar: 'النشطة' },
  { key: 'pending', en: 'Pending', ar: 'قيد الانتظار' },
  { key: 'confirmed', en: 'Confirmed', ar: 'مؤكد' },
  { key: 'assigned', en: 'Assigned', ar: 'تم التعيين' },
  { key: 'on_the_way', en: 'On the way', ar: 'في الطريق' },
  { key: 'in_progress', en: 'In progress', ar: 'قيد التنفيذ' },
  { key: 'completed', en: 'Completed', ar: 'مكتمل' },
  { key: 'cancelled', en: 'Cancelled', ar: 'ملغي' },
  { key: 'emergency', en: 'Emergency', ar: 'طارئ' },
];

// Admin transitions allowed by the contract. `assign` goes through PUT /bookings/:id/assign.
// kind: 'status' (PUT status), 'assign' (technician picker), confirm: opens ConfirmDialog first.
export function nextActions(status) {
  switch (normalizeStatus(status)) {
    case 'pending':
      return [{ to: 'confirmed', en: 'Confirm', ar: 'تأكيد', tone: 'primary' }];
    case 'confirmed':
      return [
        { kind: 'assign', en: 'Assign technician', ar: 'تعيين فني', tone: 'primary' },
        { to: 'in_progress', en: 'Start work', ar: 'بدء العمل', tone: 'secondary' },
      ];
    case 'assigned':
      return [
        { to: 'on_the_way', en: 'Mark on the way', ar: 'في الطريق', tone: 'primary' },
        { to: 'in_progress', en: 'Start work', ar: 'بدء العمل', tone: 'secondary' },
      ];
    case 'on_the_way':
      return [{ to: 'in_progress', en: 'Start work', ar: 'بدء العمل', tone: 'primary' }];
    case 'in_progress':
      return [{ to: 'completed', en: 'Mark completed', ar: 'تم الإنجاز', tone: 'success', confirm: true }];
    default:
      return [];
  }
}

export const canCancel = (status) => ACTIVE_STATUSES.includes(normalizeStatus(status));
export const canDelete = (status) => ['pending', 'cancelled'].includes(normalizeStatus(status));
export const canAssign = (status) => ['confirmed', 'assigned'].includes(normalizeStatus(status));

export const CATEGORY_LABELS = {
  ac: { en: 'Air conditioning', ar: 'تكييف' },
  refrigerator: { en: 'Refrigerators', ar: 'ثلاجات' },
  'washing-machine': { en: 'Washing machines', ar: 'غسالات' },
  stove: { en: 'Stoves & ovens', ar: 'أفران وبوتاجازات' },
  general: { en: 'General maintenance', ar: 'صيانة عامة' },
};

export const categoryLabel = (cat, L) => {
  if (!cat) return null;
  const m = CATEGORY_LABELS[String(cat).toLowerCase()];
  return m ? L(m.en, m.ar) : String(cat);
};

const isObjectIdLike = (v) => typeof v === 'string' && /^[a-f0-9]{24}$/i.test(v);

// Resolves the service a booking refers to.
// Shapes seen: embedded object {id,name,name_ar,category,basePrice}, populated Service {_id,name,nameAr},
// serviceDetails {name,category}, or a legacy bare ObjectId (looked up in the services list).
export function serviceInfo(b, servicesById) {
  if (!b) return { nameEn: null, nameAr: null, category: null, id: null, isPackage: false };
  const s = b.service;
  let id = null;
  let nameEn = null;
  let nameAr = null;
  let category = null;
  if (s && typeof s === 'object') {
    id = s.id || s._id || null;
    nameEn = s.name || s.titleKey || null;
    nameAr = s.name_ar || s.nameAr || null;
    category = s.category || null;
  } else if (typeof s === 'string') {
    id = s;
  }
  if (b.serviceDetails) {
    nameEn = nameEn || b.serviceDetails.name || null;
    category = category || b.serviceDetails.category || null;
  }
  if (!nameEn && b.serviceName) nameEn = b.serviceName;
  if ((!nameEn || !nameAr) && id && servicesById) {
    const found = servicesById[String(id)];
    if (found) {
      nameEn = nameEn || found.name || null;
      nameAr = nameAr || found.nameAr || found.name_ar || null;
      category = category || found.category || null;
    }
  }
  if (nameEn && isObjectIdLike(nameEn)) nameEn = null;
  const isPackage = String(id || '').startsWith('pkg_');
  return { id: id ? String(id) : null, nameEn, nameAr, category, isPackage };
}

export const serviceName = (info, L) => {
  if (!info) return L('Unknown service', 'خدمة غير معروفة');
  const name = L(info.nameEn || info.nameAr, info.nameAr || info.nameEn);
  return name || L('Unknown service', 'خدمة غير معروفة');
};

export const customerNameOf = (b) => b?.customerName || b?.user?.fullName || b?.user?.name || null;
export const phoneOf = (b) => b?.phone || b?.user?.phone || null;
export const orderRef = (b) => b?.orderNumber || b?.bookingId || (b?._id ? `…${String(b._id).slice(-6).toUpperCase()}` : '—');

export function coordsOf(b) {
  if (!b) return null;
  let lat = null;
  let lng = null;
  const c = b.coordinates;
  if (c && typeof c.latitude === 'number' && c.latitude !== 0) {
    lat = c.latitude; lng = c.longitude;
  } else if (Array.isArray(c) && c.length >= 2) {
    lng = c[0]; lat = c[1];
  }
  if (lat == null && Array.isArray(b.location?.coordinates) && b.location.coordinates[1]) {
    lng = b.location.coordinates[0]; lat = b.location.coordinates[1];
  }
  if (lat == null && typeof b.address === 'string') {
    const m = b.address.match(/(-?\d+\.\d{3,})\s*,\s*(-?\d+\.\d{3,})/);
    if (m) { lat = parseFloat(m[1]); lng = parseFloat(m[2]); }
  }
  if (lat == null || lng == null || (lat === 0 && lng === 0)) return null;
  return { latitude: Number(lat), longitude: Number(lng) };
}

export function mapLink(b) {
  const c = coordsOf(b);
  if (c) return `https://www.google.com/maps?q=${c.latitude},${c.longitude}`;
  if (b?.address) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}`;
  return null;
}

// Saudi numbers: 05xxxxxxxx → 9665xxxxxxxx for wa.me
export function whatsappLink(phone, text) {
  if (!phone) return null;
  let digits = String(phone).replace(/[^\d]/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('05') && digits.length === 10) digits = `966${digits.slice(1)}`;
  if (!digits) return null;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

export const telLink = (phone) => (phone ? `tel:${String(phone).replace(/[^\d+]/g, '')}` : null);

// ---------------------------------------------------------------- dates (Asia/Riyadh)
const TZ = 'Asia/Riyadh';
export function riyadhYmd(date = new Date()) {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}
export function addDaysYmd(ymd, n) {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n, 12));
  return dt.toISOString().slice(0, 10);
}
// Calendar week in Saudi Arabia runs Sunday → Saturday
export function weekRangeYmd(today = riyadhYmd()) {
  const [y, m, d] = today.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay(); // 0 = Sunday
  return { from: addDaysYmd(today, -dow), to: addDaysYmd(today, 6 - dow) };
}

// Resolve the page's date filter into API from/to
export function dateRange(dateKey, from, to) {
  const today = riyadhYmd();
  switch (dateKey) {
    case 'today': return { from: today, to: today };
    case 'tomorrow': { const t = addDaysYmd(today, 1); return { from: t, to: t }; }
    case 'week': return weekRangeYmd(today);
    case 'overdue': return { from: undefined, to: addDaysYmd(today, -1) };
    case 'custom': return { from: from || undefined, to: to || undefined };
    default: return { from: undefined, to: undefined };
  }
}

// Booking date/time as stored ("2026-10-03" / "06:00 PM"); falls back to scheduledDate.
export const bookingDate = (b) => b?.date || b?.scheduledDate || null;
export const bookingTime = (b) => b?.time || b?.scheduledTime || null;

// "06:00 PM" → minutes since midnight, for sorting today's schedule
export function timeToMinutes(t) {
  if (!t) return Number.POSITIVE_INFINITY;
  const m = String(t).trim().match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])?$/);
  if (!m) return Number.POSITIVE_INFINITY;
  let h = Number(m[1]) % 12;
  if (!m[3]) h = Number(m[1]);
  else if (/p/i.test(m[3])) h += 12;
  return h * 60 + Number(m[2]);
}

// Shows the stored slot ("06:00 PM") in the admin language; Arabic gets ص/م.
export function fmtSlot(t, isAr) {
  if (!t) return null;
  const mins = timeToMinutes(t);
  if (!Number.isFinite(mins)) return String(t);
  const h24 = Math.floor(mins / 60);
  const mm = String(mins % 60).padStart(2, '0');
  const h12 = h24 % 12 || 12;
  if (isAr) return `${h12}:${mm} ${h24 < 12 ? 'ص' : 'م'}`;
  return `${h12}:${mm} ${h24 < 12 ? 'am' : 'pm'}`; // same style as fmtTime (en-GB)
}

// The server sends { success, booking } for single fetches; older routes used `data`.
export const unwrapBooking = (res) => res?.booking || res?.data || (res?._id ? res : null);
