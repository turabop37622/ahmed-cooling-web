// Service form helpers: categories, client validation (same rules as the backend), payload and server-error mapping.
import { servicePath } from '@/lib/serviceSlugs';

export const CATEGORIES = [
  { key: 'ac', en: 'Air conditioning', ar: 'التكييف' },
  { key: 'refrigerator', en: 'Refrigerators', ar: 'الثلاجات' },
  { key: 'washing-machine', en: 'Washing machines', ar: 'الغسالات' },
  { key: 'stove', en: 'Stoves & ovens', ar: 'الأفران والطباخات' },
  { key: 'general', en: 'General', ar: 'عام' },
];
const CATEGORY_KEYS = CATEGORIES.map((c) => c.key);

export const LIMITS = {
  nameMin: 2,
  nameMax: 120,
  descriptionMax: 2000,
  priceMax: 100000,
  durationMax: 50,
  warrantyMax: 3650,
};

// Form values are strings so an empty field and 0 stay different
export function toFormValues(service) {
  const s = service || {};
  const str = (v) => (v == null ? '' : String(v));
  return {
    name: str(s.name),
    nameAr: str(s.nameAr),
    description: str(s.description),
    descriptionAr: str(s.descriptionAr),
    category: CATEGORY_KEYS.includes(s.category) ? s.category : '',
    basePrice: str(s.basePrice ?? ''),
    estimatedDuration: str(s.estimatedDuration ?? ''),
    warrantyDays: str(s.warrantyDays ?? ''),
    isPopular: !!s.isPopular,
    isEmergency: !!s.isEmergency,
    active: service ? s.active !== false : true,
  };
}

// Returns { field: [en, ar] } for every invalid field
export function validateService(v) {
  const e = {};
  const len = (x) => String(x ?? '').trim().length;
  const nameRule = (field, en, ar) => {
    const n = len(v[field]);
    if (n === 0) e[field] = [`${en} is required`, `${ar} مطلوب`];
    else if (n < LIMITS.nameMin || n > LIMITS.nameMax)
      e[field] = [`${en} must be ${LIMITS.nameMin}–${LIMITS.nameMax} characters`, `${ar} يجب أن يكون بين ${LIMITS.nameMin} و${LIMITS.nameMax} حرفاً`];
  };
  nameRule('name', 'English name', 'الاسم الإنجليزي');
  nameRule('nameAr', 'Arabic name', 'الاسم العربي');
  if (!CATEGORY_KEYS.includes(v.category)) e.category = ['Choose a category', 'اختر الفئة'];
  // The backend requires both descriptions (1–2000 characters)
  for (const [f, en, ar] of [['description', 'English description', 'الوصف الإنجليزي'], ['descriptionAr', 'Arabic description', 'الوصف العربي']]) {
    if (len(v[f]) === 0) e[f] = [`${en} is required`, `${ar} مطلوب`];
    else if (String(v[f] ?? '').trim().length > LIMITS.descriptionMax)
      e[f] = [`Maximum ${LIMITS.descriptionMax} characters`, `الحد الأقصى ${LIMITS.descriptionMax} حرف`];
  }
  const priceRaw = String(v.basePrice ?? '').trim();
  const price = Number(priceRaw);
  if (priceRaw === '') e.basePrice = ['Enter a price (0 is allowed)', 'أدخل السعر (يُسمح بـ 0)'];
  else if (!Number.isFinite(price) || price < 0 || price > LIMITS.priceMax)
    e.basePrice = [`Price must be between 0 and ${LIMITS.priceMax}`, `يجب أن يكون السعر بين 0 و${LIMITS.priceMax}`];
  if (len(v.estimatedDuration) > LIMITS.durationMax)
    e.estimatedDuration = [`Maximum ${LIMITS.durationMax} characters`, `الحد الأقصى ${LIMITS.durationMax} حرف`];
  const wRaw = String(v.warrantyDays ?? '').trim();
  if (wRaw !== '') {
    const w = Number(wRaw);
    if (!Number.isInteger(w) || w < 0 || w > LIMITS.warrantyMax)
      e.warrantyDays = [`Whole days between 0 and ${LIMITS.warrantyMax}`, `أيام صحيحة بين 0 و${LIMITS.warrantyMax}`];
  }
  return e;
}

// Only send what the admin filled in; empty optional numbers are not invented
export function toPayload(v) {
  const out = {
    name: v.name.trim(),
    nameAr: v.nameAr.trim(),
    description: v.description.trim(),
    descriptionAr: v.descriptionAr.trim(),
    category: v.category,
    basePrice: Number(String(v.basePrice).trim()),
    isPopular: !!v.isPopular,
    isEmergency: !!v.isEmergency,
    active: !!v.active,
  };
  const duration = v.estimatedDuration.trim();
  // An empty duration is not sent (the backend refuses an empty string and keeps the stored value)
  if (duration) out.estimatedDuration = duration;
  const w = String(v.warrantyDays ?? '').trim();
  if (w !== '') out.warrantyDays = Number(w);
  return out;
}

const FIELD_ALIASES = { price: 'basePrice', duration: 'estimatedDuration', warranty: 'warrantyDays', name_ar: 'nameAr' };

// Server errors[] (express-validator { path|param, msg } or { field, message }) -> { field: message }
export function mapServerErrors(errors) {
  const out = {};
  const rest = [];
  if (!Array.isArray(errors)) return { fields: out, rest };
  for (const item of errors) {
    if (!item) continue;
    const raw = typeof item === 'string' ? '' : item.path || item.param || item.field || '';
    const field = FIELD_ALIASES[raw] || raw;
    const msg = typeof item === 'string' ? item : item.msg || item.message || '';
    if (field && !out[field]) out[field] = msg;
    else if (msg) rest.push(msg);
  }
  return { fields: out, rest };
}

// Absolute public URL of the service detail page (stored slug preferred, see lib/serviceSlugs)
export function publicServiceUrl(service, lang = 'ar') {
  if (!service) return '';
  const path = servicePath(service, lang);
  if (!path || path.endsWith('/services')) return '';
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}${path}`;
}
