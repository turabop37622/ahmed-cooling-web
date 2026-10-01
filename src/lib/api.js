import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ahmed-cooling-backend.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

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
export const getServices = async () => {
  const res = await api.get('/services');
  return res.data;
};

export const getServiceById = async (id) => {
  try {
    const res = await api.get(`/services/${id}`);
    return res.data;
  } catch (error) {
    // Fallback: search within getServices
    const listRes = await getServices();
    const list = listRes?.services ?? listRes?.data ?? listRes;
    if (Array.isArray(list)) {
      const found = list.find((s) => (s._id || s.id) === id);
      if (found) return { success: true, service: found };
    }
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
