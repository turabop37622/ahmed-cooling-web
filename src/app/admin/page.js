'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from './AdminAuthContext';
import { useAdminLang } from './AdminI18n';

// /admin → dashboard when signed in (the layout sends signed-out visitors to the login page)
export default function AdminRootPage() {
  const { token, loading } = useAdminAuth();
  const { L } = useAdminLang();
  const router = useRouter();

  useEffect(() => {
    if (!loading && token) router.replace('/admin/dashboard');
  }, [token, loading, router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center" role="status">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
      <span className="sr-only">{L('Loading…', 'جارٍ التحميل…')}</span>
    </div>
  );
}
