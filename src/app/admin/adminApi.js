// Admin API Client for Ahmed Cooling Workshop
import axios from 'axios';

const PROD_URL = 'https://ahmed-cooling-backend.onrender.com/api';
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || PROD_URL;
const FALLBACK_URL = PROD_URL;

const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Shared promise to prevent concurrent login requests
let loginPromise = null;

export async function ensureValidAdminToken() {
  if (typeof window === 'undefined') return null;

  // Clear any persistent localStorage residue
  try { localStorage.removeItem('adminToken'); } catch (e) {}

  // Read only from current active browser tab session
  const token = sessionStorage.getItem('adminToken');
  if (token && token.length > 35) {
    return token;
  }

  // No valid token — user will be redirected to /admin/login
  return null;
}

// Request interceptor: attach valid adminToken from sessionStorage
api.interceptors.request.use(async (config) => {
  if (typeof window !== 'undefined') {
    let token = sessionStorage.getItem('adminToken');
    if (!token || token.length < 35) {
      token = await ensureValidAdminToken();
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor: on 401, clear session and reject (no infinite retry)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Token is invalid/expired — clear session, user must re-login
      sessionStorage.removeItem('adminToken');
      sessionStorage.removeItem('adminUser');
      localStorage.removeItem('adminToken');
      console.warn('Admin token expired or invalid — session cleared');
    }
    return Promise.reject(error);
  }
);

// Helper to fetch from API — no silent mock fallbacks
async function safeCall(apiPromise) {
  try {
    const res = await apiPromise;
    return res.data;
  } catch (err) {
    const message = err?.response?.data?.message || err?.message || 'Server request failed';
    console.error('API call failed:', message);
    throw new Error(message);
  }
}

// ─────────────────────────────────────────
// EXPORTED ADMIN API METHODS
// ─────────────────────────────────────────

export const adminApi = {

  // Authentication
  async login(email, password) {
    try {
      // Try /auth/login first
      const res = await api.post('/auth/login', { email, password });
      return res.data;
    } catch (err) {
      // Try /admin/login as fallback
      try {
        const res2 = await api.post('/admin/login', { email, password });
        return res2.data;
      } catch (err2) {
        const message =
          err?.response?.data?.message ||
          err2?.response?.data?.message ||
          'Authentication failed. Please check your credentials.';
        throw new Error(message);
      }
    }
  },

  // Dashboard Stats
  async getStats() {
    return safeCall(api.get('/admin/stats'));
  },
  async changePassword(currentPassword, newPassword) {
    return safeCall(api.post('/admin/change-password', { currentPassword, newPassword }));
  },

  // Bookings
  async getAllBookings(status = 'all', page = 1, limit = 50) {
    return safeCall(api.get('/admin/bookings', { params: { status, page, limit } }));
  },

  async updateBookingStatus(id, status, notes = '') {
    try {
      const res = await api.put(`/bookings/${id}/status`, { status, notes });
      return res.data;
    } catch (err) {
      try {
        const res2 = await api.put(`/admin/bookings/${id}/status`, { status, notes });
        return res2.data;
      } catch (err2) {
        const message = err2?.response?.data?.message || err?.response?.data?.message || 'Failed to update booking status';
        throw new Error(message);
      }
    }
  },

  async deleteBooking(id) {
    try {
      const res = await api.delete(`/admin/bookings/${id}`);
      return res.data;
    } catch (err) {
      try {
        const res2 = await api.delete(`/bookings/${id}`);
        return res2.data;
      } catch (err2) {
        const message = err2?.response?.data?.message || err?.response?.data?.message || 'Failed to delete booking';
        throw new Error(message);
      }
    }
  },

  async confirmBooking(id) {
    return this.updateBookingStatus(id, 'confirmed');
  },

  async cancelBooking(id, reason = 'Cancelled by admin') {
    return this.updateBookingStatus(id, 'cancelled', reason);
  },

  // Services
  async getServices(category) {
    return safeCall(api.get('/services', { params: { category, active: true } }));
  },

  async createService(serviceData) {
    const res = await api.post('/services', serviceData);
    return res.data;
  },

  async updateService(id, serviceData) {
    const res = await api.put(`/services/${id}`, serviceData);
    return res.data;
  },

  async deleteService(id) {
    const res = await api.delete(`/services/${id}`);
    return res.data;
  },

  // Users
  async getAllUsers() {
    return safeCall(api.get('/admin/users'));
  },
  async getInquiries() {
    return safeCall(api.get('/admin/inquiries'));
  },
  async getRatings() {
    return safeCall(api.get('/admin/ratings'));
  },

  async getUserBookings(userId) {
    return safeCall(api.get(`/admin/users/${userId}/bookings`));
  },

  // Reviews
  async getReviews() {
    try {
      const res = await api.get('/admin/reviews');
      return res.data;
    } catch (e1) {
      return safeCall(api.get('/bookings/admin/reviews'));
    }
  },

  async approveReview(id, approved) {
    try {
      const res = await api.put(`/admin/reviews/${id}/approve`, { approved });
      return res.data;
    } catch (err) {
      try {
        const res2 = await api.put(`/bookings/admin/reviews/${id}/approve`, { approved });
        return res2.data;
      } catch (err2) {
        const message = err2?.response?.data?.message || err?.response?.data?.message || 'Failed to update review';
        throw new Error(message);
      }
    }
  },
};

export default adminApi;
