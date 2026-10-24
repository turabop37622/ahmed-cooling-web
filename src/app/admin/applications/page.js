'use client';

// Technician applications from the app: check the details and the ID photo, then approve (creates the account) or reject.
// Backend: routes/adminApplications.js.
import { useCallback, useEffect, useState } from 'react';
import { UserPlus, Check, X, Loader2, RefreshCw, Phone, MessageCircle, IdCard, Undo2 } from 'lucide-react';
import { adminApi } from '../adminApi';
import { useAdminLang } from '../AdminI18n';
import { useAdminToast, Drawer, ConfirmDialog } from '../components';

const card = 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm';
const btn = 'inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 min-h-10 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-blue-600 disabled:opacity-60';
const btnGhost = `${btn} border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800`;

const CITY = { jeddah: ['Jeddah', 'جدة'], makkah: ['Makkah', 'مكة'] };
const SKILL = {
  ac: ['AC', 'مكيفات'], refrigerator: ['Refrigerators', 'ثلاجات'], 'washing-machine': ['Washing machines', 'غسالات'], stove: ['Stoves', 'أفران'], general: ['General', 'عام'],
};
const TABS = [
  { key: 'pending', en: 'Waiting', ar: 'بانتظار المراجعة' },
  { key: 'changes_requested', en: 'Sent back', ar: 'أُعيدت للتعديل' },
  { key: 'approved', en: 'Approved', ar: 'تمت الموافقة' },
  { key: 'rejected', en: 'Rejected', ar: 'مرفوضة' },
];
const BADGE = {
  pending: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  changes_requested: 'bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
  approved: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  rejected: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
};

const statusText = (L, status) => {
  const t = TABS.find((x) => x.key === status);
  return t ? L(t.en, t.ar) : status;
};

function Field({ label, children }) {
  return (
    <div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-900 dark:text-white" dir="auto">{children || '—'}</p>
    </div>
  );
}

function ApplicationDrawer({ id, onClose, onChanged }) {
  const { L, fmtDateTime } = useAdminLang();
  const toast = useAdminToast();
  const [app, setApp] = useState(null);
  const [confirm, setConfirm] = useState(null); // 'approve' | 'reject'
  useEffect(() => {
    adminApi.getTechnicianApplication(id).then((r) => setApp(r.application)).catch((err) => toast.error(err.message));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const names = (list, map) => (list || []).map((k) => L(...(map[k] || [k, k]))).join(', ');
  const phoneDigits = app ? String(app.phone).replace(/\D/g, '') : '';

  return (
    <Drawer open onClose={onClose} title={app ? app.fullName : '…'} subtitle={app ? app.phone : ''}>
      {!app ? <p className="text-sm text-slate-500">…</p> : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={app.photoUrl} alt="" className="h-20 w-20 rounded-full object-cover" />
            <div>
              <span className={`rounded-lg px-2 py-0.5 text-[11px] font-semibold ${BADGE[app.status]}`}>{statusText(L, app.status)}</span>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{L('Applied', 'قدّم')} {fmtDateTime(app.createdAt)}</p>
              <div className="mt-2 flex gap-2">
                <a className={btnGhost} href={`tel:+${phoneDigits}`}><Phone className="h-4 w-4" aria-hidden="true" />{L('Call', 'اتصال')}</a>
                <a className={btnGhost} href={`https://wa.me/${phoneDigits}`} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" aria-hidden="true" />WhatsApp</a>
              </div>
            </div>
          </div>

          <div className={`${card} grid grid-cols-2 gap-4 p-4`}>
            <Field label={L('Iqama / ID number', 'رقم الإقامة / الهوية')}><span dir="ltr">{app.nationalId}</span></Field>
            <Field label={L('Date of birth', 'تاريخ الميلاد')}>{app.dateOfBirth ? <span dir="ltr">{String(app.dateOfBirth).slice(0, 10).split('-').reverse().join('/')}</span> : null}</Field>
            <Field label={L('Experience', 'الخبرة')}>{L(`${app.experienceYears} years`, `${app.experienceYears} سنوات`)}</Field>
            <Field label={L('City', 'المدينة')}>{names(app.cities, CITY)}</Field>
            <Field label={L('Specialties', 'التخصصات')}>{names(app.skills, SKILL)}</Field>
            <Field label={L('Email', 'البريد')}><span dir="ltr">{app.email}</span></Field>
            <Field label={L('About', 'نبذة')}>{app.about}</Field>
          </div>

          <div className={`${card} p-4`}>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white"><IdCard className="h-4 w-4" aria-hidden="true" />{L('Documents', 'المستندات')}</p>
            {app.idPhotoUrl ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  [app.idPhotoUrl, L('Iqama / ID (front)', 'الإقامة / الهوية (أمام)')], [app.idPhotoBackUrl, L('Iqama / ID (back)', 'الإقامة / الهوية (خلف)')],
                  [app.passportUrl, L('Passport', 'جواز السفر')], [app.certificateUrl, L('Certificate', 'الشهادة')],
                ].filter(([url]) => url).map(([url, label]) => (
                  <a key={label} href={url} target="_blank" rel="noreferrer" className="block">
                    <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">{label}</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={label} className="max-h-64 w-full rounded-xl object-contain bg-slate-50 dark:bg-slate-800" />
                  </a>
                ))}
              </div>
            ) : <p className="text-sm text-slate-500">{L('The documents were deleted.', 'تم حذف المستندات.')}</p>}
          </div>

          {app.adminMessage && app.status !== 'rejected' && app.status !== 'approved' ? (
            <div className={`${card} p-4`}>
              <Field label={L('What you asked them to fix', 'ما طلبته منه تعديله')}>{app.adminMessage}</Field>
              {app.resubmittedAt ? <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">{L('The applicant sent the changes on', 'أرسل المتقدم التعديلات في')} {fmtDateTime(app.resubmittedAt)}</p> : null}
            </div>
          ) : null}

          {app.status === 'rejected' ? (
            <div className={`${card} p-4`}><Field label={L('Reason given', 'سبب الرفض')}>{app.rejectionReason}</Field></div>
          ) : null}

          {app.status === 'pending' || app.status === 'changes_requested' ? (
            <div className="flex flex-wrap gap-2">
              {app.status === 'pending' ? <button type="button" className={`${btn} flex-1 bg-emerald-600 text-white hover:bg-emerald-700`} onClick={() => setConfirm('approve')}><Check className="h-4 w-4" aria-hidden="true" />{L('Approve & create account', 'موافقة وإنشاء الحساب')}</button> : null}
              {app.status === 'pending' ? <button type="button" className={`${btn} flex-1 ${btnGhost.replace(btn, '')}`} onClick={() => setConfirm('changes')}><Undo2 className="h-4 w-4" aria-hidden="true" />{L('Ask for changes', 'طلب تعديل')}</button> : null}
              <button type="button" className={`${btn} flex-1 border border-red-300 text-red-700 hover:bg-red-50 dark:border-red-500/40 dark:text-red-300`} onClick={() => setConfirm('reject')}><X className="h-4 w-4" aria-hidden="true" />{L('Reject', 'رفض')}</button>
            </div>
          ) : null}
        </div>
      )}

      <ConfirmDialog
        open={confirm === 'approve'}
        title={L('Approve this technician?', 'الموافقة على هذا الفني؟')}
        message={L('Their account is created now. They can log in to the technician app with the phone number and password they chose. Top up their wallet so they can take jobs.', 'سيتم إنشاء حسابه الآن ويمكنه الدخول إلى تطبيق الفنيين برقم جواله وكلمة المرور التي اختارها. اشحن محفظته ليتمكن من أخذ المهام.')}
        confirmLabel={L('Approve', 'موافقة')}
        tone="primary"
        onConfirm={async () => {
          try {
            await adminApi.approveTechnicianApplication(id);
            toast.success(L('Technician account created', 'تم إنشاء حساب الفني'));
            onChanged();
            onClose();
          } catch (err) {
            toast.error(err.message);
            return false;
          }
        }}
        onClose={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === 'changes'}
        title={L('Ask the applicant to fix something?', 'طلب تعديل من المتقدم؟')}
        message={L('They get your message in the app and on WhatsApp, and can fix and resend the application from the login screen.', 'ستصله رسالتك في التطبيق وعلى واتساب، ويمكنه تعديل الطلب وإعادة إرساله من شاشة تسجيل الدخول.')}
        confirmLabel={L('Send back', 'إعادة للتعديل')}
        tone="primary"
        requireReason
        reasonLabel={L('What should they fix? (e.g. the passport photo is blurry)', 'ما الذي يجب تعديله؟ (مثال: صورة الجواز غير واضحة)')}
        onConfirm={async (message) => {
          try {
            await adminApi.requestTechnicianApplicationChanges(id, message);
            toast.success(L('Sent back to the applicant', 'تمت إعادة الطلب للمتقدم'));
            onChanged();
            onClose();
          } catch (err) {
            toast.error(err.message);
            return false;
          }
        }}
        onClose={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === 'reject'}
        title={L('Reject this application?', 'رفض هذا الطلب؟')}
        message={L('The applicant sees this reason when they try to log in, and the documents are deleted.', 'سيرى المتقدم هذا السبب عند محاولة الدخول وسيتم حذف المستندات.')}
        confirmLabel={L('Reject', 'رفض')}
        tone="danger"
        requireReason
        reasonLabel={L('Reason', 'السبب')}
        onConfirm={async (reason) => {
          try {
            await adminApi.rejectTechnicianApplication(id, reason);
            toast.success(L('Application rejected', 'تم رفض الطلب'));
            onChanged();
            onClose();
          } catch (err) {
            toast.error(err.message);
            return false;
          }
        }}
        onClose={() => setConfirm(null)}
      />
    </Drawer>
  );
}

export default function ApplicationsPage() {
  const { L, fmtDateTime } = useAdminLang();
  const toast = useAdminToast();
  const [tab, setTab] = useState('pending');
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const load = useCallback(async () => {
    try { setData(await adminApi.getTechnicianApplications({ status: tab })); } catch (err) { toast.error(err.message); setData({ applications: [], pending: 0 }); }
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setData(null); load(); }, [load]);

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-4 sm:p-6">
      <div className="flex items-center gap-2">
        <UserPlus className="h-6 w-6 text-blue-600" aria-hidden="true" />
        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">{L('Technician applications', 'طلبات الفنيين')}</h1>
        {data && data.pending > 0 ? <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">{data.pending}</span> : null}
      </div>
      <div role="tablist" className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} type="button" onClick={() => setTab(t.key)}
            className={`${btn} ${tab === t.key ? 'bg-blue-600 text-white' : 'border border-slate-300 text-slate-700 dark:border-slate-600 dark:text-slate-200'}`}>{L(t.en, t.ar)}</button>
        ))}
        <button type="button" className={btnGhost} onClick={() => { setData(null); load(); }}><RefreshCw className="h-4 w-4" aria-hidden="true" />{L('Refresh', 'تحديث')}</button>
      </div>
      {!data ? <p className="p-6 text-sm text-slate-500"><Loader2 className="inline h-4 w-4 animate-spin" aria-hidden="true" /></p> : data.applications.length === 0 ? (
        <div className={`${card} p-8 text-center text-sm text-slate-500`}>{L('No applications here.', 'لا توجد طلبات هنا.')}</div>
      ) : (
        <div className="grid gap-3">
          {data.applications.map((a) => (
            <button key={a._id} type="button" onClick={() => setSelected(a._id)} className={`${card} flex items-center gap-3 p-4 text-start hover:bg-slate-50 dark:hover:bg-slate-800/60`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.photoUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900 dark:text-white">{a.fullName}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400"><span dir="ltr">{a.phone}</span> · {(a.cities || []).map((c) => L(...(CITY[c] || [c, c]))).join(', ')} · {fmtDateTime(a.createdAt)}</p>
              </div>
              <span className={`rounded-lg px-2 py-0.5 text-[11px] font-semibold ${BADGE[a.status]}`}>{statusText(L, a.status)}</span>
            </button>
          ))}
        </div>
      )}
      {selected ? <ApplicationDrawer id={selected} onClose={() => setSelected(null)} onChanged={load} /> : null}
    </div>
  );
}
