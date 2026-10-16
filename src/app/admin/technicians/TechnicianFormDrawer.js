'use client';

// Add / edit technician (POST /admin/technicians, PATCH /admin/technicians/:id).
// Phone is normalised to +9665XXXXXXXX (accepts 05…, 966…, +966…, Arabic digits). Password: required on
// create, optional on edit (fills = reset). Server field errors / 409 duplicates land on the right field.

import { useEffect, useId, useRef, useState } from 'react';
import { AlertCircle, Eye, EyeOff, Loader2, Save, Wand2 } from 'lucide-react';
import { useAdminLang } from '../AdminI18n';
import { useAdminToast } from '../components/AdminToast';
import Drawer from '../components/Drawer';
import Switch from '../components/Switch';
import { createTechnician, updateTechnician } from '../adminApi';
import { CITIES, SPECIALTIES, PASSWORD_MIN, PASSWORD_MAX, normalizeSaudiPhone } from './techUtils';

const INPUT = (invalid) =>
  `w-full min-h-11 rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 disabled:opacity-60 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400 ${
    invalid ? 'border-red-500 focus:ring-red-500 dark:border-red-400' : 'border-slate-300 focus:ring-blue-600 dark:border-slate-600'
  }`;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const empty = { fullName: '', phone: '', email: '', password: '', cities: [], specialties: [], autoAssign: false, active: true, availability: true };

function toValues(t) {
  if (!t) return { ...empty };
  return {
    fullName: t.name || t.fullName || '',
    phone: t.phone || '',
    email: t.email || '',
    password: '',
    cities: Array.isArray(t.cities) ? t.cities.filter((c) => CITIES.some((x) => x.key === c)) : [],
    specialties: Array.isArray(t.specialties) ? t.specialties.filter((s) => SPECIALTIES.some((x) => x.key === s)) : [],
    autoAssign: !!t.autoAssign,
    active: t.active !== false,
    availability: t.availability !== false,
  };
}

function validate(v, isEdit) {
  const e = {};
  const name = v.fullName.trim();
  if (name.length < 2) e.fullName = ['Enter the technician’s full name.', 'أدخل اسم الفني الكامل.'];
  else if (name.length > 100) e.fullName = ['Name is too long (max 100 characters).', 'الاسم طويل جداً (100 حرف كحد أقصى).'];
  if (!v.phone.trim()) e.phone = ['Enter a mobile number.', 'أدخل رقم الجوال.'];
  else if (!normalizeSaudiPhone(v.phone)) e.phone = ['Enter a Saudi mobile number, e.g. 05XXXXXXXX.', 'أدخل رقم جوال سعودي، مثل 05XXXXXXXX.'];
  if (v.email.trim() && !EMAIL_RE.test(v.email.trim())) e.email = ['Enter a valid email or leave it empty.', 'أدخل بريداً صحيحاً أو اتركه فارغاً.'];
  const len = v.password.length;
  if (!isEdit && len === 0) e.password = ['Set a password for the technician’s app login.', 'عيّن كلمة مرور لدخول الفني إلى التطبيق.'];
  else if (len > 0 && (len < PASSWORD_MIN || len > PASSWORD_MAX)) e.password = [`Password must be ${PASSWORD_MIN}–${PASSWORD_MAX} characters.`, `يجب أن تكون كلمة المرور من ${PASSWORD_MIN} إلى ${PASSWORD_MAX} حرفاً.`];
  return e;
}

// A readable random password (no look-alike characters)
function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const arr = new Uint32Array(12);
  crypto.getRandomValues(arr);
  return Array.from(arr, (n) => chars[n % chars.length]).join('');
}

function Field({ id, label, required, optional, error, hint, children }) {
  const { L } = useAdminLang();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200">
        {label}
        {required && <span className="text-red-600 dark:text-red-400" aria-hidden="true"> *</span>}
        {required && <span className="sr-only"> ({L('required', 'مطلوب')})</span>}
        {optional && <span className="font-normal text-slate-500 dark:text-slate-400"> ({L('optional', 'اختياري')})</span>}
      </label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="mt-1 text-xs text-slate-600 dark:text-slate-400">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="mt-1 flex items-start gap-1 text-xs font-medium text-red-700 dark:text-red-300">
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span>{error}</span>
        </p>
      )}
    </div>
  );
}

function CheckGroup({ legend, hint, options, value, onChange, disabled }) {
  const { L } = useAdminLang();
  const hintId = useId();
  const toggle = (key) => onChange(value.includes(key) ? value.filter((k) => k !== key) : [...value, key]);
  return (
    <fieldset aria-describedby={hint ? hintId : undefined}>
      <legend className="mb-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const checked = value.includes(o.key);
          return (
            <label
              key={o.key}
              className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm font-medium transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-blue-600 ${
                checked
                  ? 'border-blue-600 bg-blue-50 text-blue-900 dark:border-blue-400 dark:bg-blue-500/15 dark:text-blue-100'
                  : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
              } ${disabled ? 'pointer-events-none opacity-60' : ''}`}
            >
              <input type="checkbox" className="h-4 w-4 accent-blue-600" checked={checked} disabled={disabled} onChange={() => toggle(o.key)} />
              {L(o.en, o.ar)}
            </label>
          );
        })}
      </div>
      {hint && <p id={hintId} className="mt-1 text-xs text-slate-600 dark:text-slate-400">{hint}</p>}
    </fieldset>
  );
}

export default function TechnicianFormDrawer({ open, technician, onClose, onSaved }) {
  const { L, isAr } = useAdminLang();
  const toast = useAdminToast();
  const isEdit = !!technician;
  const uid = useId();
  const [values, setValues] = useState(empty);
  const [errors, setErrors] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const lock = useRef(false);
  const formRef = useRef(null);

  useEffect(() => {
    if (open) {
      setValues(toValues(technician));
      setErrors({});
      setServerErrors({});
      setFormError('');
      setShowPw(false);
    }
  }, [open, technician]);

  const set = (field, value) => {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
    setServerErrors((e) => ({ ...e, [field]: undefined }));
  };
  const errorFor = (f) => (errors[f] ? L(errors[f][0], errors[f][1]) : serverErrors[f] || '');
  const describe = (f, hasHint) => (errorFor(f) ? `${uid}-${f}-error` : hasHint ? `${uid}-${f}-hint` : undefined);

  const normalizedPhone = normalizeSaudiPhone(values.phone);

  async function handleSubmit(event) {
    event.preventDefault();
    if (lock.current) return;
    const e = validate(values, isEdit);
    setErrors(e);
    setFormError('');
    if (Object.keys(e).length) {
      // Focus the first invalid field
      requestAnimationFrame(() => formRef.current?.querySelector('[aria-invalid="true"]')?.focus());
      return;
    }
    const payload = {
      fullName: values.fullName.trim().replace(/\s+/g, ' '),
      phone: normalizedPhone,
      email: values.email.trim().toLowerCase() || (isEdit ? '' : undefined),
      cities: values.cities,
      specialties: values.specialties,
      autoAssign: values.autoAssign,
      active: values.active,
    };
    if (isEdit) payload.availability = values.availability;
    if (values.password) payload.password = values.password;
    // Edit: only send the email when it changed ('' clears it)
    if (isEdit && payload.email === String(technician?.email || '').toLowerCase()) delete payload.email;
    if (payload.email === undefined) delete payload.email;

    lock.current = true;
    setSaving(true);
    try {
      const res = isEdit ? await updateTechnician(technician._id, payload) : await createTechnician(payload);
      toast.success(isEdit
        ? L(`Saved ${payload.fullName}`, `تم حفظ ${payload.fullName}`)
        : L(`Technician ${payload.fullName} added`, `تمت إضافة الفني ${payload.fullName}`));
      if (values.password) {
        toast.info(isEdit
          ? L('Password reset — share the new password with the technician.', 'تمت إعادة تعيين كلمة المرور — أرسلها للفني.')
          : L('Share the phone number and password with the technician so they can sign in to the app.', 'أرسل رقم الجوال وكلمة المرور للفني ليتمكن من الدخول إلى التطبيق.'));
      }
      onSaved?.(res?.technician || null);
      onClose?.();
    } catch (err) {
      const fieldErrs = {};
      (err?.errors || []).forEach((fe) => {
        const f = fe?.path || fe?.param || fe?.field;
        if (f && !fieldErrs[f]) fieldErrs[f] = fe.msg || fe.message;
      });
      if (err?.status === 400 && err.message && !Object.keys(fieldErrs).length) {
        // Plain validation message: put it under the field it is about
        const m = err.message;
        const field = /password/i.test(m) ? 'password' : /phone|mobile/i.test(m) ? 'phone' : /email/i.test(m) ? 'email' : /name/i.test(m) ? 'fullName' : null;
        if (field) fieldErrs[field] = m;
      }
      if (err?.status === 409) {
        if (/email/i.test(err.message || '')) fieldErrs.email = L('This email is already used by another account.', 'هذا البريد مستخدم في حساب آخر.');
        else fieldErrs.phone = L('This phone number is already used by another account.', 'رقم الجوال مستخدم في حساب آخر.');
      }
      setServerErrors(fieldErrs);
      if (!Object.keys(fieldErrs).length) setFormError(err?.message || L('Could not save the technician.', 'تعذر حفظ الفني.'));
      else requestAnimationFrame(() => formRef.current?.querySelector('[aria-invalid="true"]')?.focus());
    } finally {
      lock.current = false;
      setSaving(false);
    }
  }

  const footer = (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onClose}
        disabled={saving}
        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        {L('Cancel', 'إلغاء')}
      </button>
      <button
        type="submit"
        form={`${uid}-form`}
        disabled={saving}
        aria-busy={saving || undefined}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
        {isEdit ? L('Save changes', 'حفظ التغييرات') : L('Add technician', 'إضافة الفني')}
      </button>
    </div>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      canClose={!saving}
      title={isEdit ? L('Edit technician', 'تعديل الفني') : L('Add technician', 'إضافة فني')}
      subtitle={isEdit ? <span dir="auto">{technician?.name}</span> : L('Creates the technician’s app login', 'ينشئ حساب دخول الفني للتطبيق')}
      footer={footer}
    >
      <form id={`${uid}-form`} ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-5">
        {formError && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span>{formError}</span>
          </div>
        )}

        <Field id={`${uid}-fullName`} label={L('Full name', 'الاسم الكامل')} required error={errorFor('fullName')}>
          <input
            id={`${uid}-fullName`}
            data-autofocus
            dir="auto"
            autoComplete="off"
            maxLength={100}
            value={values.fullName}
            disabled={saving}
            onChange={(e) => set('fullName', e.target.value)}
            aria-invalid={errorFor('fullName') ? 'true' : undefined}
            aria-describedby={describe('fullName')}
            className={INPUT(!!errorFor('fullName'))}
          />
        </Field>

        <Field
          id={`${uid}-phone`}
          label={L('Mobile number (app login)', 'رقم الجوال (دخول التطبيق)')}
          required
          error={errorFor('phone')}
          hint={normalizedPhone ? L(`Saved as ${normalizedPhone}`, `سيُحفظ كـ ${normalizedPhone}`) : L('Saudi mobile, e.g. 05XXXXXXXX or +9665XXXXXXXX', 'جوال سعودي، مثل 05XXXXXXXX أو ‎+9665XXXXXXXX')}
        >
          <input
            id={`${uid}-phone`}
            type="tel"
            inputMode="tel"
            dir="ltr"
            autoComplete="off"
            maxLength={20}
            placeholder="05XXXXXXXX"
            value={values.phone}
            disabled={saving}
            onChange={(e) => set('phone', e.target.value)}
            onBlur={() => { if (normalizedPhone && normalizedPhone !== values.phone) set('phone', normalizedPhone); }}
            aria-invalid={errorFor('phone') ? 'true' : undefined}
            aria-describedby={describe('phone', true)}
            className={`${INPUT(!!errorFor('phone'))} font-mono ${isAr ? 'text-right' : ''}`}
          />
        </Field>

        <Field id={`${uid}-email`} label={L('Email', 'البريد الإلكتروني')} optional error={errorFor('email')}>
          <input
            id={`${uid}-email`}
            type="email"
            dir="ltr"
            autoComplete="off"
            maxLength={254}
            value={values.email}
            disabled={saving}
            onChange={(e) => set('email', e.target.value)}
            aria-invalid={errorFor('email') ? 'true' : undefined}
            aria-describedby={describe('email')}
            className={`${INPUT(!!errorFor('email'))} ${isAr ? 'text-right' : ''}`}
          />
        </Field>

        <Field
          id={`${uid}-password`}
          label={isEdit ? L('Reset password', 'إعادة تعيين كلمة المرور') : L('Password', 'كلمة المرور')}
          required={!isEdit}
          optional={isEdit}
          error={errorFor('password')}
          hint={isEdit
            ? L(`Leave empty to keep the current password. ${PASSWORD_MIN}–${PASSWORD_MAX} characters; signs the technician out of the app.`, `اتركها فارغة للإبقاء على كلمة المرور الحالية. من ${PASSWORD_MIN} إلى ${PASSWORD_MAX} حرفاً؛ سيتم تسجيل خروج الفني من التطبيق.`)
            : L(`${PASSWORD_MIN}–${PASSWORD_MAX} characters (${values.password.length})`, `من ${PASSWORD_MIN} إلى ${PASSWORD_MAX} حرفاً (${values.password.length})`)}
        >
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <input
                id={`${uid}-password`}
                type={showPw ? 'text' : 'password'}
                dir="ltr"
                autoComplete="new-password"
                maxLength={PASSWORD_MAX}
                value={values.password}
                disabled={saving}
                onChange={(e) => set('password', e.target.value)}
                aria-invalid={errorFor('password') ? 'true' : undefined}
                aria-describedby={describe('password', true)}
                className={`${INPUT(!!errorFor('password'))} pe-12 font-mono ${isAr ? 'text-right' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? L('Hide password', 'إخفاء كلمة المرور') : L('Show password', 'إظهار كلمة المرور')}
                aria-pressed={showPw}
                aria-controls={`${uid}-password`}
                className="absolute end-0.5 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl text-slate-600 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600 dark:text-slate-300 dark:hover:text-white"
              >
                {showPw ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
              </button>
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={() => { set('password', generatePassword()); setShowPw(true); }}
              className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Wand2 className="h-4 w-4" aria-hidden="true" />{L('Generate', 'توليد')}
            </button>
          </div>
        </Field>

        <CheckGroup
          legend={L('Cities', 'المدن')}
          hint={L('Auto-assign only sends bookings from these cities.', 'التعيين التلقائي يرسل حجوزات هذه المدن فقط.')}
          options={CITIES}
          value={values.cities}
          disabled={saving}
          onChange={(v) => set('cities', v)}
        />

        <CheckGroup
          legend={L('Specialties', 'التخصصات')}
          hint={L('None selected = can take every service.', 'بدون اختيار = يمكنه استلام جميع الخدمات.')}
          options={SPECIALTIES}
          value={values.specialties}
          disabled={saving}
          onChange={(v) => set('specialties', v)}
        />

        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
          <Switch
            checked={values.active}
            disabled={saving}
            tone="green"
            onChange={(v) => set('active', v)}
            label={L('Active', 'نشط')}
            description={L('Inactive technicians can’t sign in or receive jobs.', 'الفني غير النشط لا يمكنه الدخول أو استلام المهام.')}
          />
          <Switch
            checked={values.autoAssign}
            disabled={saving}
            tone="violet"
            onChange={(v) => set('autoAssign', v)}
            label={L('Auto-assign', 'تعيين تلقائي')}
            description={L('New matching bookings are assigned to this technician automatically.', 'تُسند الحجوزات الجديدة المطابقة لهذا الفني تلقائياً.')}
          />
          {isEdit && (
            <Switch
              checked={values.availability}
              disabled={saving}
              onChange={(v) => set('availability', v)}
              label={L('Available', 'متاح')}
              description={L('Unavailable technicians can’t be assigned (the technician can also change this in the app).', 'لا يمكن تعيين الفني غير المتاح (يمكن للفني تغيير ذلك من التطبيق أيضاً).')}
            />
          )}
        </div>
      </form>
    </Drawer>
  );
}
