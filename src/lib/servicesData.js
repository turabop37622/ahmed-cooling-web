import services from './services.json';

// Shared catalogue used by the website and API for services without MongoDB IDs.
export const FALLBACK_SERVICES = services;

// Fixed technician visit fee added on top of every service price at booking.
// Shown on service cards, the detail page and the booking summary so the total is never a surprise.
export const VISIT_FEE = 30;

// Each service gets its own rating between 4.0 and 5.0 (stable: the same service always shows the same score).
const KNOWN_RATINGS = { '1': 4.8, '2': 4.6, '3': 4.9, '4': 4.4, '5': 4.7, '6': 4.3, '7': 4.5, '8': 4.2, '9': 4.1, pkg_villa: 5.0 };
export function getServiceRating(id) {
  const key = String(id ?? '');
  if (key in KNOWN_RATINGS) return KNOWN_RATINGS[key];
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return (40 + (h % 11)) / 10;
}
