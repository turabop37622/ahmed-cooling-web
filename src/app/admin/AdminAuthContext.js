'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  readStoredSession,
  storeSession,
  clearStoredSession,
  isTokenUsable,
  tokenExpiresAt,
  setApiToken,
  setUnauthorizedHandler,
} from './adminApi';

const AdminAuthContext = createContext(null);

const LOGIN_PATH = '/admin/login';
const DEFAULT_PATH = '/admin/dashboard';

// Only same-origin admin pages are allowed as a post-login destination (no open redirects)
export function safeAdminPath(next) {
  if (typeof next !== 'string' || !next) return DEFAULT_PATH;
  if (!next.startsWith('/admin') || next.startsWith('//') || next.includes('\\')) return DEFAULT_PATH;
  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const url = new URL(next, base);
    if (url.origin !== base) return DEFAULT_PATH;
    if (url.pathname !== '/admin' && !url.pathname.startsWith('/admin/')) return DEFAULT_PATH;
    if (url.pathname === LOGIN_PATH || url.pathname === '/admin') return DEFAULT_PATH;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return DEFAULT_PATH;
  }
}

function currentAdminPath() {
  if (typeof window === 'undefined') return null;
  const { pathname, search } = window.location;
  if (!pathname.startsWith('/admin') || pathname === LOGIN_PATH) return null;
  return `${pathname}${search}`;
}

export function loginUrlFor(next) {
  return next ? `${LOGIN_PATH}?next=${encodeURIComponent(next)}` : LOGIN_PATH;
}

export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;

  const applySession = useCallback((session) => {
    setToken(session?.token || null);
    setUser(session?.user || null);
    setApiToken(session?.token || null);
  }, []);

  // logout({ keepNext }) — keepNext: come back to the current page after signing in (expired session / 401)
  const logout = useCallback((options = {}) => {
    const keepNext = options === true || options?.keepNext === true;
    const next = keepNext ? currentAdminPath() : null;
    clearStoredSession();
    applySession(null);
    if (typeof window !== 'undefined' && window.location.pathname !== LOGIN_PATH) {
      routerRef.current.replace(loginUrlFor(next));
    }
  }, [applySession]);

  // Restore the session saved in this browser (shared by all tabs)
  useEffect(() => {
    applySession(readStoredSession());
    setLoading(false);
  }, [applySession]);

  // Any 401 from adminApi signs out and returns here afterwards
  useEffect(() => setUnauthorizedHandler(() => logout({ keepNext: true })), [logout]);

  // Sign out exactly when the token expires
  useEffect(() => {
    if (!token) return undefined;
    const expiresAt = tokenExpiresAt(token);
    if (!expiresAt) return undefined;
    const delay = Math.max(0, expiresAt - Date.now() - 30 * 1000);
    // setTimeout can't wait longer than ~24.8 days; an 8 h token is far below that
    const timer = setTimeout(() => logout({ keepNext: true }), Math.min(delay, 2 ** 31 - 1));
    return () => clearTimeout(timer);
  }, [token, logout]);

  // Keep tabs in sync: signing in/out in one tab does the same in the others
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key !== null && event.key !== 'adminToken' && event.key !== 'adminUser') return;
      const session = readStoredSession();
      if (session?.token) {
        applySession(session);
      } else if (token) {
        logout({ keepNext: true });
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [token, applySession, logout]);

  // Also re-check when the tab becomes visible again (a laptop woken from sleep after the token expired)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && token && !isTokenUsable(token)) logout({ keepNext: true });
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [token, logout]);

  const login = useCallback((authData) => {
    const t = authData?.token;
    const u = authData?.user || authData?.admin || null;
    const role = String(u?.role || '').toLowerCase();
    if (!isTokenUsable(t) || (role !== 'admin' && role !== 'superadmin')) {
      throw new Error('Access denied. Only admin users can access this panel.');
    }
    storeSession(t, u);
    applySession({ token: t, user: u });
  }, [applySession]);

  const value = useMemo(() => ({ user, token, loading, login, logout }), [user, token, loading, login, logout]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return ctx;
}
