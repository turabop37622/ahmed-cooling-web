'use client';

import { useState } from 'react';
import { adminApi } from '../adminApi';
import { useAdminAuth } from '../AdminAuthContext';

export default function AdminSecurityPage() {
  const { logout } = useAdminAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await adminApi.changePassword(currentPassword, newPassword);
      logout();
    } catch (err) {
      setError(err.message || 'Could not change password');
    } finally {
      setSaving(false);
    }
  }

  return <div className="max-w-xl rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900">
    <h1 className="text-2xl font-semibold">Admin security</h1>
    <p className="mt-2 text-sm text-slate-500">Change your password. You will be signed out after saving.</p>
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <label className="block text-sm font-medium">Current password
        <input type="password" autoComplete="current-password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="mt-1 w-full rounded-lg border p-3 text-slate-900" />
      </label>
      <label className="block text-sm font-medium">New password (at least 12 characters)
        <input type="password" autoComplete="new-password" minLength={12} maxLength={128} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1 w-full rounded-lg border p-3 text-slate-900" />
      </label>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-50">{saving ? 'Saving...' : 'Change password'}</button>
    </form>
  </div>;
}
