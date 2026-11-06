'use client';

// Google Play requires a public page where users of the app can ask for their account to be deleted, saying what is
// deleted and what is kept. Customers can also delete in the app (Profile → Delete account, routes/users.js
// DELETE /account); technician accounts are deleted by the office, so for them this page is the way.
import { Trash2, Mail, MessageCircle } from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';

const EMAIL = 'ahmedcoolingworkshop@gmail.com';
const WHATSAPP = '966544483745';

const TEXT = {
  ar: {
    title: 'حذف حسابك',
    intro: 'هذه الصفحة خاصة بتطبيق «Ahmed Cooling» من ورشة أحمد للتبريد. يمكنك حذف حسابك وبياناتك في أي وقت.',
    customersTitle: 'العملاء: من داخل التطبيق',
    customers: [
      'افتح التطبيق واذهب إلى «الملف الشخصي».',
      'اضغط «حذف الحساب».',
      'أدخل كلمة المرور للتأكيد (أو اكتب DELETE إذا كنت تسجل الدخول عبر Google).',
      'إذا كان لديك حجز مفتوح، ألغه أولاً ثم احذف الحساب.',
    ],
    requestTitle: 'الفنيون، أو إذا لم تستطع فتح التطبيق',
    request: 'أرسل لنا طلب حذف من رقم الجوال أو البريد المسجل في حسابك، وسنحذف الحساب خلال 30 يوماً ونؤكد لك ذلك.',
    whatsappBtn: 'طلب الحذف عبر واتساب',
    emailBtn: 'طلب الحذف عبر البريد',
    message: 'أرغب في حذف حسابي في تطبيق أحمد للتبريد.',
    subject: 'طلب حذف الحساب',
    deletedTitle: 'ما الذي يُحذف',
    deleted: [
      'حسابك: الاسم والبريد الإلكتروني ورقم الجوال وكلمة المرور وصورة الملف الشخصي.',
      'رمز الإشعارات الخاص بجهازك، فلن تصلك إشعارات بعد الحذف.',
      'محادثات واتساب مع رقمنا عند طلبك ذلك.',
    ],
    keptTitle: 'ما الذي نحتفظ به',
    kept: [
      'سجل الحجوزات السابقة لأغراض المحاسبة، بعد إزالة اسمك ورقمك وعنوانك وملاحظاتك منه.',
      'للفنيين: سجل المحفظة والعمولات والطلبات المنجزة، لأغراض المحاسبة والالتزامات النظامية.',
    ],
  },
  en: {
    title: 'Delete your account',
    intro: 'This page is for the "Ahmed Cooling" app by Ahmed Cooling Workshop. You can delete your account and data at any time.',
    customersTitle: 'Customers: in the app',
    customers: [
      'Open the app and go to Profile.',
      'Tap "Delete account".',
      'Enter your password to confirm (or type DELETE if you sign in with Google).',
      'If you have an open booking, cancel it first, then delete the account.',
    ],
    requestTitle: 'Technicians, or if you cannot open the app',
    request: 'Send us a deletion request from the phone number or email address registered on your account. We delete the account within 30 days and confirm it to you.',
    whatsappBtn: 'Request deletion on WhatsApp',
    emailBtn: 'Request deletion by email',
    message: 'I would like to delete my Ahmed Cooling app account.',
    subject: 'Account deletion request',
    deletedTitle: 'What is deleted',
    deleted: [
      'Your account: name, email, phone number, password and profile photo.',
      'Your device\'s notification token, so you stop receiving notifications.',
      'Your WhatsApp chat history with our number, if you ask for it.',
    ],
    keptTitle: 'What we keep',
    kept: [
      'Past bookings for our accounting records, with your name, phone number, address and notes removed.',
      'For technicians: wallet, commission and completed-job records, for accounting and legal obligations.',
    ],
  },
};

const List = ({ items, ordered }) => {
  const Tag = ordered ? 'ol' : 'ul';
  return (
    <Tag className={`mt-3 space-y-2 ps-5 text-sm leading-relaxed text-sub marker:text-primary dark:text-slate-300 dark:marker:text-blue-400 ${ordered ? 'list-decimal' : 'list-disc'}`}>
      {items.map((item) => <li key={item}>{item}</li>)}
    </Tag>
  );
};

export default function DeleteAccountPage() {
  const { isRTL, language } = useTranslation();
  const T = TEXT[language === 'en' ? 'en' : 'ar'];
  const whatsappHref = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(T.message)}`;
  const mailtoHref = `mailto:${EMAIL}?subject=${encodeURIComponent(T.subject)}&body=${encodeURIComponent(T.message)}`;

  return (
    <div className="min-h-[60vh] bg-bg pb-16 dark:bg-slate-950" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="border-b border-border bg-gradient-to-b from-primary-light/60 to-bg dark:from-slate-900 dark:to-slate-950 dark:border-slate-800">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-8">
          <div className="flex flex-col items-center text-center sm:items-start sm:text-start">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md dark:bg-slate-800">
              <Trash2 className="h-7 w-7 text-primary dark:text-blue-400" aria-hidden />
            </div>
            <h1 className="text-3xl font-semibold text-text dark:text-white sm:text-4xl">{T.title}</h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-sub dark:text-slate-300">{T.intro}</p>
          </div>
        </div>
      </div>

      <article className="mx-auto max-w-3xl space-y-10 px-4 pt-10 sm:px-8">
        <section>
          <h2 className="border-b border-border pb-2 text-lg font-semibold text-text dark:border-slate-700 dark:text-white">{T.customersTitle}</h2>
          <List items={T.customers} ordered />
        </section>

        <section>
          <h2 className="border-b border-border pb-2 text-lg font-semibold text-text dark:border-slate-700 dark:text-white">{T.requestTitle}</h2>
          <p className="mt-4 text-sm leading-relaxed text-sub dark:text-slate-300">{T.request}</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-colors hover:bg-primary-dark dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              <MessageCircle className="h-5 w-5" aria-hidden />
              {T.whatsappBtn}
            </a>
            <a
              href={mailtoHref}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-6 py-3.5 text-sm font-semibold text-text transition-colors hover:border-primary dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:hover:border-blue-500"
            >
              <Mail className="h-5 w-5" aria-hidden />
              {T.emailBtn}
            </a>
          </div>
          <p className="mt-3 text-xs text-sub dark:text-slate-400" dir="ltr">{EMAIL} · +966 54 448 3745</p>
        </section>

        <section>
          <h2 className="border-b border-border pb-2 text-lg font-semibold text-text dark:border-slate-700 dark:text-white">{T.deletedTitle}</h2>
          <List items={T.deleted} />
        </section>

        <section>
          <h2 className="border-b border-border pb-2 text-lg font-semibold text-text dark:border-slate-700 dark:text-white">{T.keptTitle}</h2>
          <List items={T.kept} />
        </section>
      </article>
    </div>
  );
}
