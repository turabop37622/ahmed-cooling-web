import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ahmed-cooling-backend.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Render free instances sleep when idle. Any request wakes them, so a page that has not talked to the API yet
// sends one tiny fire-and-forget ping a moment after load, and the backend is warm by the time the visitor acts.
let backendTouched = false;
const BACKEND_ORIGIN = API_URL.replace(/\/api\/?$/, '');

export function warmBackend() {
  if (typeof window === 'undefined' || backendTouched) return;
  try {
    if (sessionStorage.getItem('backend-warm')) return;
    sessionStorage.setItem('backend-warm', '1');
  } catch {}
  backendTouched = true;
  fetch(`${BACKEND_ORIGIN}/ping`, { mode: 'no-cors', cache: 'no-store', keepalive: true }).catch(() => {});
}

if (typeof window !== 'undefined') {
  window.setTimeout(warmBackend, 1500);
}

// An expired or revoked token must not leave the UI "logged in": clear it and tell the app
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (typeof window !== 'undefined' && error?.response?.status === 401 && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(error);
  },
);

api.interceptors.request.use((config) => {
  backendTouched = true;
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const loginEmail = async (email, password) => {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
};

export const signupEmail = async (data) => {
  const res = await api.post('/auth/register', data);
  return res.data;
};

export const loginPhone = async (phone, password) => {
  const res = await api.post('/auth/phone/login', { phone, password });
  return res.data;
};

export const signupPhone = async (data) => {
  const res = await api.post('/auth/phone/register', data);
  return res.data;
};

export const socialAuth = async (data) => {
  const res = await api.post('/auth/social', data);
  return res.data;
};

export const verifyOTP = async (data) => {
  const res = await api.post('/auth/verify-otp', data);
  return res.data;
};

export const resendOTP = async (data) => {
  const res = await api.post('/auth/resend-otp', data);
  return res.data;
};

export const forgotPassword = async (email) => {
  const res = await api.post('/auth/forgot-password', { email });
  return res.data;
};

export const verifyResetOTP = async (email, otp) => {
  const res = await api.post('/auth/verify-reset-otp', { email, otp });
  return res.data;
};

export const resetPassword = async (token, password, email) => {
  const res = await api.post(`/auth/reset-password/${encodeURIComponent(token)}`, { password, email });
  return res.data;
};

// Services
// The home, services, detail and booking pages all need the list, and several components can ask at once.
// Share one in-flight request and reuse its result for a short time; a failure is never cached.
const SERVICES_TTL_MS = 30000;
let servicesCache = null; // { promise, at }

export const getServices = () => {
  if (servicesCache && Date.now() - servicesCache.at < SERVICES_TTL_MS) return servicesCache.promise;
  const promise = api.get('/services').then((res) => res.data);
  const entry = { promise, at: Date.now() };
  servicesCache = entry;
  promise.catch(() => {
    if (servicesCache === entry) servicesCache = null;
  });
  return promise;
};

// Only real database ids (24 hex characters) are asked for individually; anything else (old numeric ids, package ids)
// would just 404, so it is looked up in the shared list instead.
export const getServiceById = async (id) => {
  const key = String(id ?? '');
  const fromList = async () => {
    const listRes = await getServices();
    const list = listRes?.services ?? listRes?.data ?? listRes;
    const found = Array.isArray(list) ? list.find((s) => String(s._id || s.id) === key) : null;
    return found ? { success: true, service: found } : null;
  };
  if (!/^[a-f0-9]{24}$/i.test(key)) {
    const found = await fromList();
    if (found) return found;
    const err = new Error('Service not found');
    err.response = { status: 404 };
    throw err;
  }
  try {
    const res = await api.get(`/services/${key}`);
    return res.data;
  } catch (error) {
    const found = await fromList().catch(() => null);
    if (found) return found;
    throw error;
  }
};

// Bookings
// The same Idempotency-Key makes a retry after a timeout return the first booking instead of creating a second one.
// Booking creation can be slow on a cold server, so it gets a longer timeout.
export const createBooking = async (data, idempotencyKey) => {
  const res = await api.post('/bookings/public', data, {
    timeout: 60000,
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
  });
  return res.data;
};

export const getUserBookings = async () => {
  const res = await api.get('/bookings/user/my-bookings');
  return res.data;
};

export const getBookingsByPhone = async (phone) => {
  const res = await api.get(`/bookings/phone/${encodeURIComponent(phone)}`);
  return res.data;
};

export const cancelBooking = async (id, reason) => {
  const res = await api.put(`/bookings/${encodeURIComponent(id)}/cancel`, { reason });
  return res.data;
};

export const publicCancelBooking = async (id, reason, phone) => {
  const res = await api.put(`/bookings/public/cancel/${encodeURIComponent(id)}`, { reason, phone });
  return res.data;
};

export const rescheduleBooking = async (id, data) => {
  const res = await api.put(`/bookings/${encodeURIComponent(id)}/reschedule`, data);
  return res.data;
};

// Reviews
export const submitReview = async (bookingId, data) => {
  const res = await api.post(`/bookings/public/${bookingId}/review`, data);
  return res.data;
};

export const getPublicReviews = async () => {
  const res = await api.get('/bookings/public/reviews');
  return res.data;
};

// User
export const updateProfile = async (data) => {
  const res = await api.put('/users/profile', data);
  return res.data;
};

// Contact Inquiry
export const submitContact = async (data) => {
  const res = await api.post('/contact', data);
  return res.data;
};

// General Rating & Feedback
export const submitGeneralRating = async (data) => {
  const res = await api.post('/rate', data);
  return res.data;
};

// Health
export const testConnection = async () => {
  const res = await api.get('/health');
  return res.data;
};

export default api;
