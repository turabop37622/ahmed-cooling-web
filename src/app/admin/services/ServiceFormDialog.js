'use client';

import { useEffect, useRef, useState } from 'react';
import { X, AlertCircle, Star, Siren, Link2 } from 'lucide-react';
import { adminApi } from '../adminApi';
import { useAdminLang } from '../AdminI18n';
import { useAdminToast, useDialogA11y } from '../components';
import { CATEGORIES, LIMITS, toFormValues, validateService, toPayload, mapServerErrors, publicServiceUrl } from './serviceForm';

const inputCls = (invalid) =>
  `w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 border text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 ${
    invalid ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 dark:border-slate-600 focus:ring-blue-600'
  }`;

function Field({ id, label, required, error, hint, children }) {
  const { L } = useAdminLang();
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
        {label}
        {required && (
          <span className="text-red-600 dark:text-red-400" aria-hidden="true"> *</span>
        )}
        {required && <span className="sr-only"> ({L('required', 'مطلوب')})</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-slate-600 dark:text-slate-400">{hint}</p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs font-medium text-red-700 dark:text-red-300 flex items-start gap-1">
          <AlertCircle className="w-3.5 h-3.5 mt-px shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

export default function ServiceFormDialog({ open, service, onClose, onSaved }) {
  const { L, isAr } = useAdminLang();
  const toast = useAdminToast();
  const isEdit = !!service;
  const [values, setValues] = useState(() => toFormValues(service));
  const [clientErrors, setClientErrors] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const lockRef = useRef(false);
  const formRef = useRef(null);

  const panelRef = useDialogA11y(open, onClose, { canClose: !submitting });

  useEffect(() => {
    if (open) {
      setValues(toFormValues(service));
      setClientErrors({});
      setServerErrors({});
      setFormError('');
    }
  }, [open, service]);

  if (!open) return null;

  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setValues((prev) => ({ ...prev, [field]: value }));
    if (clientErrors[field]) setClientErrors((prev) => ({ ...prev, [field]: undefined }));
    if (serverErrors[field]) setServerErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const errorFor = (field) => {
    const c = clientErrors[field];
    if (c) return L(c[0], c[1]);
    return serverErrors[field] || '';
  };

  const aria = (field, hasHint) => {
    const err = !!errorFor(field);
    const ids = [err ? `svc-${field}-error` : null, !err && hasHint ? `svc-${field}-hint` : null].filter(Boolean).join(' ');
    return { 'aria-invalid': err || undefined, 'aria-describedby': ids || undefined };
  };

  const focusFirstError = (fields) => {
    const order = ['category', 'name', 'nameAr', 'basePrice', 'estimatedDuration', 'warrantyDays', 'description', 'descriptionAr'];
    const first = order.find((f) => fields.includes(f));
    if (first) requestAnimationFrame(() => formRef.current?.querySelector(`#svc-${first}`)?.focus());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lockRef.current) return;
    const errs = validateService(values);
    setClientErrors(errs);
    setServerErrors({});
    setFormError('');
    if (Object.keys(errs).length) {
      focusFirstError(Object.keys(errs));
      return;
    }
    lockRef.current = true;
    setSubmitting(true);
    try {
      const payload = toPayload(values);
      const res = isEdit ? await adminApi.updateService(service._id, payload) : await adminApi.createService(payload);
      onSaved?.(res?.service ?? res?.data ?? null, isEdit ? 'edit' : 'create');
    } catch (err) {
      const { fields, rest } = mapServerErrors(err?.errors);
      setServerErrors(fields);
      const msg = rest[0] || err?.message || L('Could not save the service', 'تعذّر حفظ الخدمة');
      setFormError(Object.keys(fields).length ? L('Please fix the highlighted fields.', 'يرجى تصحيح الحقول المحددة.') : msg);
      toast.error(err?.message || msg);
      focusFirstError(Object.keys(fields));
    } finally {
      lockRef.current = false;
      setSubmitting(false);
    }
  };

  const url = isEdit ? publicServiceUrl(service, isAr ? 'ar' : 'en') : '';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/60"
        aria-hidden="true"
        onClick={() => {
          if (!submitting) onClose?.();
        }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="svc-form-title"
        tabIndex={-1}
        className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full sm:max-w-2xl max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl shadow-2xl focus:outline-none"
      >
        <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 id="svc-form-title" className="text-lg font-semibold text-slate-900 dark:text-white">
            {isEdit ? L('Edit service', 'تعديل الخدمة') : L('Add service', 'إضافة خدمة')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label={L('Close', 'إغلاق')}
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-4">
          {formError && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 p-3 text-sm text-red-800 dark:text-red-200">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              <span>{formError}</span>
            </div>
          )}

          {isEdit && (
            <div className="rounded-xl border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 p-3 text-sm">
              <div className="flex items-center gap-1.5 font-semibold text-blue-900 dark:text-blue-200">
                <Link2 className="w-4 h-4" aria-hidden="true" />
                {L('Public URL', 'الرابط العام')}
              </div>
              <code className="block mt-1 text-xs text-slate-800 dark:text-slate-200 break-all" dir="ltr">
                {url ? url.replace(/^https?:\/\//, '') : '—'}
              </code>
              <p className="mt-1 text-xs text-blue-900 dark:text-blue-200">
                {L('Renaming the service keeps this URL, so existing links and search results keep working. Saved changes reach the website within about 5 minutes.', 'تغيير اسم الخدمة لا يغيّر هذا الرابط، فتبقى الروابط الحالية ونتائج البحث تعمل. تظهر التغييرات المحفوظة في الموقع خلال 5 دقائق تقريباً.')}
              </p>
            </div>
          )}

          <Field id="svc-category" label={L('Category', 'الفئة')} required error={errorFor('category')}>
            <select id="svc-category" value={values.category} onChange={set('category')} required className={inputCls(!!errorFor('category'))} {...aria('category')}>
              <option value="">{L('Choose a category…', 'اختر الفئة…')}</option>
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>{L(c.en, c.ar)}</option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="svc-name" label={L('Name (English)', 'الاسم (إنجليزي)')} required error={errorFor('name')}>
              <input
                id="svc-name"
                type="text"
                dir="ltr"
                lang="en"
                required
                maxLength={LIMITS.nameMax + 20}
                placeholder="e.g. AC gas refill"
                value={values.name}
                onChange={set('name')}
                className={inputCls(!!errorFor('name'))}
                {...aria('name')}
              />
            </Field>
            <Field id="svc-nameAr" label={L('Name (Arabic)', 'الاسم (عربي)')} required error={errorFor('nameAr')}>
              <input
                id="svc-nameAr"
                type="text"
                dir="rtl"
                lang="ar"
                required
                maxLength={LIMITS.nameMax + 20}
                placeholder="مثال: شحن فريون مكيف"
                value={values.nameAr}
                onChange={set('nameAr')}
                className={inputCls(!!errorFor('nameAr'))}
                {...aria('nameAr')}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field
              id="svc-basePrice"
              label={L('Base price (SAR)', 'السعر الأساسي (ريال)')}
              required
              error={errorFor('basePrice')}
              hint={L('0 means free / price on inspection', '0 يعني مجاناً / السعر بعد المعاينة')}
            >
              <input
                id="svc-basePrice"
                type="number"
                inputMode="decimal"
                min="0"
                max={LIMITS.priceMax}
                step="any"
                dir="ltr"
                required
                value={values.basePrice}
                onChange={set('basePrice')}
                className={inputCls(!!errorFor('basePrice'))}
                {...aria('basePrice', true)}
              />
            </Field>
            <Field id="svc-estimatedDuration" label={L('Duration estimate', 'المدة المتوقعة')} error={errorFor('estimatedDuration')}>
              <input
                id="svc-estimatedDuration"
                type="text"
                dir="auto"
                placeholder={L('e.g. 1-2 hours', 'مثال: 1-2 ساعة')}
                value={values.estimatedDuration}
                onChange={set('estimatedDuration')}
                className={inputCls(!!errorFor('estimatedDuration'))}
                {...aria('estimatedDuration')}
              />
            </Field>
            <Field id="svc-warrantyDays" label={L('Warranty (days)', 'الضمان (أيام)')} error={errorFor('warrantyDays')}>
              <input
                id="svc-warrantyDays"
                type="number"
                inputMode="numeric"
                min="0"
                max={LIMITS.warrantyMax}
                step="1"
                dir="ltr"
                value={values.warrantyDays}
                onChange={set('warrantyDays')}
                className={inputCls(!!errorFor('warrantyDays'))}
                {...aria('warrantyDays')}
              />
            </Field>
          </div>

          <Field
            id="svc-description"
            label={L('Description (English)', 'الوصف (إنجليزي)')}
            required
            error={errorFor('description')}
            hint={`${values.description.length} / ${LIMITS.descriptionMax}`}
          >
            <textarea
              id="svc-description"
              rows={3}
              dir="ltr"
              lang="en"
              value={values.description}
              onChange={set('description')}
              className={`${inputCls(!!errorFor('description'))} resize-y`}
              {...aria('description', true)}
            />
          </Field>
          <Field
            id="svc-descriptionAr"
            label={L('Description (Arabic)', 'الوصف (عربي)')}
            required
            error={errorFor('descriptionAr')}
            hint={`${values.descriptionAr.length} / ${LIMITS.descriptionMax}`}
          >
            <textarea
              id="svc-descriptionAr"
              rows={3}
              dir="rtl"
              lang="ar"
              value={values.descriptionAr}
              onChange={set('descriptionAr')}
              className={`${inputCls(!!errorFor('descriptionAr'))} resize-y`}
              {...aria('descriptionAr', true)}
            />
          </Field>

          <fieldset className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <legend className="sr-only">{L('Options', 'خيارات')}</legend>
            {[
              { field: 'isPopular', title: L('Popular', 'شائعة'), sub: L('Featured on the homepage', 'تظهر في الصفحة الرئيسية'), icon: <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" aria-hidden="true" /> },
              { field: 'isEmergency', title: L('24/7 emergency', 'طوارئ 24/7'), sub: L('Emergency dispatch', 'إرسال فني طارئ'), icon: <Siren className="h-3.5 w-3.5 text-rose-600" aria-hidden="true" /> },
              { field: 'active', title: L('Active', 'نشطة'), sub: L('Visible to customers', 'ظاهرة للعملاء'), icon: null },
            ].map((o) => (
              <label
                key={o.field}
                htmlFor={`svc-${o.field}`}
                className="flex items-center gap-3 min-h-[44px] p-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/60 cursor-pointer"
              >
                <input
                  id={`svc-${o.field}`}
                  type="checkbox"
                  checked={values[o.field]}
                  onChange={set(o.field)}
                  className="w-5 h-5 rounded accent-blue-600 shrink-0"
                />
                <span>
                  <span className="flex items-center gap-1 text-sm font-semibold text-slate-900 dark:text-white">{o.title}{o.icon}</span>
                  <span className="block text-xs text-slate-600 dark:text-slate-400">{o.sub}</span>
                </span>
              </label>
            ))}
          </fieldset>

          <div className="sticky bottom-0 -mx-5 sm:-mx-6 px-5 sm:px-6 py-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="min-h-[44px] px-4 rounded-xl border border-slate-300 dark:border-slate-600 text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
            >
              {L('Cancel', 'إلغاء')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="min-h-[44px] px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-60"
            >
              {submitting ? L('Saving…', 'جارٍ الحفظ…') : isEdit ? L('Save changes', 'حفظ التغييرات') : L('Create service', 'إنشاء الخدمة')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
