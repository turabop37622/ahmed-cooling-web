import services from './services.json';

// Shared catalogue used by the website and API for services without MongoDB IDs.
export const FALLBACK_SERVICES = services;

// Fixed technician visit fee added on top of every service price at booking.
// Shown on service cards, the detail page and the booking summary so the total is never a surprise.
export const VISIT_FEE = 30;
