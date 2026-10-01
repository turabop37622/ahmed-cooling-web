'use client';

import { useState } from 'react';
import { useTranslation } from '@/contexts/TranslationContext';
import {
  Clock,
  Mail,
  MapPin,
  Phone,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
} from 'lucide-react';
import { submitContact } from '@/lib/api';

export default function ContactPage() {
  const { t, isRTL, language } = useTranslation();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) {
      setStatus({
        success: false,
        msg: language === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields',
      });
      return;
    }

    setSubmitting(true);
    setStatus(null);

    try {
      const res = await submitContact({
        name: name.trim(),
        phone: phone.trim(),
        message: message.trim(),
      });

      if (res?.success) {
        setStatus({
          success: true,
          msg: language === 'ar' ? 'تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.' : 'Your message has been sent successfully! We will contact you soon.',
        });
        setName('');
        setPhone('');
        setMessage('');
      } else {
        setStatus({
          success: false,
          msg: res?.message || (language === 'ar' ? 'حدث خطأ أثناء الإرسال. يرجى التواصل عبر الواتساب.' : 'Failed to send message. Please contact via WhatsApp.'),
        });
      }
    } catch (err) {
      console.error('Contact submit error:', err);
      setStatus({
        success: false,
        msg: language === 'ar' ? 'تعذر إرسال الرسالة، يمكنك التواصل معنا مباشرة عبر واتساب.' : 'Failed to send message. You can reach us directly on WhatsApp.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-[60vh] bg-bg pb-16 pt-10 dark:bg-slate-950"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="mx-auto max-w-[1560px] space-y-16 px-4 pt-14 sm:px-6 lg:px-8">
        {/* Contact Information */}
        <section id="contact">
          <div className="mb-6 flex items-center gap-3 scroll-reveal">
            <span className="h-8 w-1 shrink-0 rounded-full bg-primary dark:bg-blue-500" />
            <h1 className="text-3xl font-semibold text-text dark:text-white">{t.contactInformation}</h1>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <a
              href={`tel:${(t.aboutContactPhoneValue || '+966590192146').replace(/\s/g, '')}`}
              className="scroll-reveal delay-100 flex gap-3 sm:gap-4 rounded-2xl border border-border bg-white p-4 sm:p-5 transition-colors hover:border-primary/40 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-500/50"
            >
              <Phone className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 text-primary dark:text-blue-400" aria-hidden />
              <div>
                <p className="text-xs sm:text-sm font-semibold uppercase text-sub dark:text-slate-500">
                  {t.phone}
                </p>
                <p dir="ltr" className="mt-1 text-sm sm:text-lg font-semibold text-text dark:text-white rtl:text-right">{t.aboutContactPhoneValue || '+966 59 019 2146'}</p>
              </div>
            </a>
            <a
              href={`mailto:${t.aboutContactEmailValue || 'ahmedcoolingworkshop@gmail.com'}`}
              className="scroll-reveal delay-200 flex gap-3 sm:gap-4 rounded-2xl border border-border bg-white p-4 sm:p-5 transition-colors hover:border-primary/40 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-500/50"
            >
              <Mail className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 text-primary dark:text-blue-400" aria-hidden />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-semibold uppercase text-sub dark:text-slate-500">
                  {t.email}
                </p>
                <p className="mt-1 break-all text-[13px] sm:text-lg font-semibold text-text dark:text-white">{t.aboutContactEmailValue || 'ahmedcoolingworkshop@gmail.com'}</p>
              </div>
            </a>
            <div className="scroll-reveal delay-300 flex gap-3 sm:gap-4 rounded-2xl border border-border bg-white p-4 sm:p-5 dark:border-slate-700 dark:bg-slate-900">
              <MapPin className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 text-primary dark:text-blue-400" aria-hidden />
              <div>
                <p className="text-xs sm:text-sm font-semibold uppercase text-sub dark:text-slate-500">
                  {t.location}
                </p>
                <p className="mt-1 text-sm sm:text-lg font-semibold text-text dark:text-white">{t.aboutContactAddressValue || 'Jeddah & Makkah, Saudi Arabia'}</p>
              </div>
            </div>
            <div className="scroll-reveal delay-400 flex gap-3 sm:gap-4 rounded-2xl border border-border bg-white p-4 sm:p-5 dark:border-slate-700 dark:bg-slate-900">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 text-primary dark:text-blue-400" aria-hidden />
              <div>
                <p className="text-xs sm:text-sm font-semibold uppercase text-sub dark:text-slate-500">
                  {t.hours}
                </p>
                <p className="mt-1 text-sm sm:text-lg font-semibold text-text dark:text-white">{t.aboutContactHoursValue || 'Sat–Thu: 9:00 AM – 8:00 PM'}</p>
                <p className="mt-1 text-xs sm:text-sm font-semibold text-red-600 dark:text-red-400">{t.aboutContactEmergencyValue || 'Emergency line: 24/7, every day'}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Message Form */}
        <section className="scroll-reveal bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-border dark:border-slate-800 shadow-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-text dark:text-white mb-2">
              {language === 'ar' ? 'أرسل لنا رسالة' : 'Send us a Message'}
            </h2>
            <p className="text-sub dark:text-slate-400">
              {language === 'ar' ? 'نحن هنا لمساعدتك. املأ النموذج وسنعود إليك في أقرب وقت.' : 'We are here to help. Fill out the form and we will get back to you.'}
            </p>
          </div>

          {status && (
            <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 text-sm font-medium border ${
              status.success
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
            }`}>
              {status.success ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" /> : <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />}
              <span>{status.msg}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t.name || (language === 'ar' ? 'الاسم' : 'Name')} *
                </label>
                <input
                  id="contact-name" name="name" autoComplete="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={language === 'ar' ? 'أدخل اسمك الكريم' : 'Enter your name'}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
              <div>
                <label htmlFor="contact-phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t.phone || (language === 'ar' ? 'رقم الهاتف' : 'Phone')} *
                </label>
                <input
                  id="contact-phone" name="phone" autoComplete="tel" inputMode="tel"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+966 5XX XXX XXX"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>
            </div>
            <div>
              <label htmlFor="contact-message" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {language === 'ar' ? 'الرسالة' : 'Message'} *
              </label>
              <textarea
                id="contact-message" name="message"
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={language === 'ar' ? 'كيف يمكننا مساعدتك؟ تفاصيل العطل أو المشكلة...' : 'How can we help you? Describe the issue or service needed...'}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
              />
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-semibold shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                {submitting ? (language === 'ar' ? 'جاري الإرسال...' : 'Sending...') : (language === 'ar' ? 'إرسال الرسالة' : 'Send Message')}
              </button>

              <a
                href="https://wa.me/966590192146"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-emerald-500/40 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/40 font-semibold transition flex items-center justify-center gap-2"
              >
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
                {language === 'ar' ? 'محادثة سريعة عبر واتساب' : 'Quick Chat on WhatsApp'}
              </a>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
