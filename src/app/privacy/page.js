'use client';

import Link from 'next/link';
import { Shield, Mail } from 'lucide-react';
import { useTranslation } from '@/contexts/TranslationContext';
import { pathForLang } from '@/lib/lang';

// Page-specific text that corrects the shared translations: the site has no online payments (customers pay the
// technician after the service), and the cookie section describes what the consent banner really does.
const LOCAL = {
  ar: {
    paymentBullet: 'طريقة الدفع التي تختارها عند الحجز (الدفع للفني بعد إتمام الخدمة). لا نجمع بيانات بطاقات بنكية عبر الموقع أو التطبيق.',
    shareAnalytics: 'مزودو القياس: ',
    shareAnalyticsDesc: 'أداة قياس TikTok فقط إذا وافقت عليها في إشعار ملفات تعريف الارتباط (انظر القسم ٦).',
    cookiesTitle: '٦. ملفات تعريف الارتباط وأداة قياس TikTok',
    cookiesIntro: 'نستخدم في الموقع ما يلي:',
    cookies: [
      'تخزين ضروري على جهازك: اللغة المختارة (ملف تعريف ارتباط «lang» وlocalStorage)، والوضع الليلي، وجلسة تسجيل الدخول (localStorage). هذه لازمة لعمل الموقع ولا تُستخدم للتتبع.',
      'أداة قياس TikTok (Pixel): تقيس زيارات الصفحات لمعرفة أداء إعلاناتنا على TikTok، وقد تضع TikTok ملفات تعريف ارتباط خاصة بها وتستقبل بيانات مثل عنوان IP ومعلومات المتصفح والصفحة التي زرتها.',
      'لا يتم تحميل أداة TikTok إلا بعد أن تضغط «أوافق» في إشعار ملفات تعريف الارتباط. إذا رفضت أو لم تختر، فلن يتم تحميلها.',
      'نحفظ اختيارك على جهازك (localStorage باسم «cookie-consent») حتى لا نسألك في كل زيارة.',
      'لسحب موافقتك أو تغييرها في أي وقت: اضغط «إعدادات ملفات تعريف الارتباط» في أسفل الصفحة واختر «لا أوافق»، أو احذف بيانات هذا الموقع من متصفحك.',
    ],
    appTitle: 'في تطبيق الجوال',
    appIntro: 'يطلب التطبيق الأذونات التالية فقط عند الحاجة إليها، ويمكنك رفضها:',
    app: [
      'الموقع الدقيق: فقط عندما تختار مشاركة موقعك أثناء الحجز ليصل إليك الفني، أو للفني لعرض أقرب الطلبات أولاً. لا نتتبع موقعك في الخلفية.',
      'الكاميرا والصور: فقط عندما تختار صورة للملف الشخصي، أو يرفق الفني مستنداته في طلب الانضمام.',
      'الإشعارات: لإرسال تحديثات حجزك. نحفظ رمز الإشعارات الخاص بجهازك لهذا الغرض فقط.',
      'تسجيل الدخول عبر Google: نستلم اسمك وبريدك الإلكتروني من Google لإنشاء حسابك.',
      'رسائل واتساب: الرسائل التي ترسلها لرقمنا (ومنها الرسائل الصوتية والصور والموقع) تُحفظ لخدمتك، وقد يجيب عليها مساعد آلي.',
    ],
    processorsTitle: 'مزودو الخدمة الذين يعالجون البيانات نيابة عنا: ',
    processors: 'Google Firebase (تسجيل الدخول والإشعارات)، Render وMongoDB Atlas (الخوادم وقاعدة البيانات)، Cloudinary (الصور)، Meta WhatsApp (الرسائل)، Groq (الردود الآلية على رسائل واتساب)، وBrevo (رسائل البريد الإلكتروني).',
    security: [
      'كل الاتصالات بين التطبيق أو الموقع وخوادمنا مشفرة (HTTPS).',
      'كلمات المرور تُحفظ مشفرة (hash) ولا يمكن لأحد قراءتها.',
      'رمز تسجيل الدخول في التطبيق يُحفظ في التخزين المشفر للجوال.',
      'لا يطلع على بيانات الحجوزات إلا موظفو الورشة المخولون والفني المكلف بطلبك.',
    ],
    deletionTitle: 'حذف الحساب: ',
    deletion: 'يمكنك حذف حسابك من التطبيق (الملف الشخصي ← حذف الحساب)، أو طلب ذلك من صفحة حذف الحساب:',
    deletionLink: 'صفحة حذف الحساب',
  },
  en: {
    paymentBullet: 'The payment method you choose when booking (you pay the technician after the service). We do not collect card details on the website or app.',
    shareAnalytics: 'Measurement providers: ',
    shareAnalyticsDesc: 'the TikTok pixel, only if you accept it in the cookie notice (see section 6).',
    cookiesTitle: '6. Cookies and the TikTok pixel',
    cookiesIntro: 'The website uses:',
    cookies: [
      'Essential storage on your device: your language (the "lang" cookie and localStorage), dark mode, and your sign-in session (localStorage). These are needed for the site to work and are not used for tracking.',
      'The TikTok pixel: it measures page visits so we can see how our TikTok ads perform. TikTok may set its own cookies and receive data such as your IP address, browser details and the page you visited.',
      'The TikTok pixel is loaded only after you press "Accept" in the cookie notice. If you decline or make no choice, it is not loaded.',
      'Your choice is saved on your device (localStorage, "cookie-consent") so we do not ask on every visit.',
      'To withdraw or change your consent at any time, press "Cookie settings" at the bottom of the page and choose "Decline", or clear this site\'s data in your browser.',
    ],
    appTitle: 'In the mobile app',
    appIntro: 'The app asks for these permissions only when it needs them, and you can refuse them:',
    app: [
      'Precise location: only when you choose to share your location while booking so the technician can find you, or, for technicians, to show the nearest jobs first. We do not track your location in the background.',
      'Camera and photos: only when you choose a profile photo, or a technician attaches documents to their application.',
      'Notifications: to send updates about your booking. We store your device\'s notification token for this purpose only.',
      'Sign in with Google: we receive your name and email address from Google to create your account.',
      'WhatsApp messages: messages you send to our number (including voice notes, photos and locations) are kept to serve you, and may be answered by an automated assistant.',
    ],
    processorsTitle: 'Service providers that process data on our behalf: ',
    processors: 'Google Firebase (sign-in and notifications), Render and MongoDB Atlas (servers and database), Cloudinary (photos), Meta WhatsApp (messages), Groq (automated replies to WhatsApp messages) and Brevo (emails).',
    security: [
      'All traffic between the app or website and our servers is encrypted (HTTPS).',
      'Passwords are stored hashed, so nobody can read them.',
      'In the app, your sign-in token is kept in the phone\'s encrypted storage.',
      'Booking details are seen only by authorised workshop staff and the technician assigned to your booking.',
    ],
    deletionTitle: 'Account deletion: ',
    deletion: 'You can delete your account in the app (Profile → Delete account), or request it from our account deletion page:',
    deletionLink: 'Account deletion page',
  },
};

export default function PrivacyPage() {
  const { t, isRTL, language } = useTranslation();
  const L = LOCAL[language === 'en' ? 'en' : 'ar'];
  const email = String(t.aboutContactEmailValue || 'ahmedcoolingworkshop@gmail.com')
    .trim()
    .replace(/\s+/g, '');
  const mailtoHref = `mailto:${email}`;

  const sections = [
    {
      title: t.privacySection1,
      blocks: [
        {
          subtitle: t.privacyPersonalInfo,
          text: t.privacyPersonalInfoText,
          bullets: [
            t.privacyBullet1,
            t.privacyBullet2,
            L.paymentBullet,
            t.privacyBullet4,
            t.privacyBullet5,
          ],
        },
        {
          subtitle: t.privacyAutoInfo,
          text: t.privacyAutoInfoText,
          bullets: [
            t.privacyBullet6,
            t.privacyBullet7,
            t.privacyBullet8,
            t.privacyBullet9,
          ],
        },
        { subtitle: L.appTitle, text: L.appIntro, bullets: L.app },
      ],
    },
    {
      title: t.privacySection2,
      blocks: [{ text: t.privacyUseText, bullets: [t.privacyUse1, t.privacyUse2, t.privacyUse3, t.privacyUse4, t.privacyUse5, t.privacyUse6, t.privacyUse7] }],
    },
    {
      title: t.privacySection3,
      blocks: [
        { text: t.privacyShareText },
        {
          bullets: [
            `${t.privacyShareTech}${t.privacyShareTechDesc}`,
            `${L.shareAnalytics}${L.shareAnalyticsDesc}`,
            `${t.privacyShareLegal}${t.privacyShareLegalDesc}`,
          ],
        },
        { text: `${L.processorsTitle}${L.processors}` },
        { text: t.privacyNoSell },
      ],
    },
    {
      title: t.privacySection4,
      blocks: [
        { text: t.privacySecurityText, bullets: L.security },
        { text: t.privacySecurityNote },
      ],
    },
    {
      title: t.privacySection5,
      blocks: [
        { text: t.privacyRightsText },
        {
          bullets: [
            `${t.privacyRightAccess}${t.privacyRightAccessDesc}`,
            `${t.privacyRightCorrection}${t.privacyRightCorrectionDesc}`,
            `${t.privacyRightDeletion}${t.privacyRightDeletionDesc}`,
            `${t.privacyRightOptout}${t.privacyRightOptoutDesc}`,
            `${t.privacyRightPortability}${t.privacyRightPortabilityDesc}`,
          ],
        },
        { text: t.privacyRightsContact },
        { text: `${L.deletionTitle}${L.deletion}`, link: { href: pathForLang('/delete-account', language), label: L.deletionLink } },
      ],
    },
    {
      title: L.cookiesTitle,
      id: 'cookies',
      blocks: [{ text: L.cookiesIntro, bullets: L.cookies }],
    },
    {
      title: t.privacySection7,
      blocks: [{ text: t.privacyChildrenText }],
    },
    {
      title: t.privacySection8,
      blocks: [{ text: t.privacyChangesText }],
    },
    {
      title: t.privacySection9,
      blocks: [{ text: t.privacyContactText }],
    },
  ];

  return (
    <div
      className="min-h-[60vh] bg-bg pb-16 dark:bg-slate-950"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="border-b border-border bg-gradient-to-b from-primary-light/60 to-bg dark:from-slate-900 dark:to-slate-950 dark:border-slate-800">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-8 lg:px-16 xl:px-24">
          <div className="flex flex-col items-center text-center sm:items-start sm:text-start">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md dark:bg-slate-800">
              <Shield className="h-7 w-7 text-primary dark:text-blue-400" aria-hidden />
            </div>
            <h1 className="text-3xl font-semibold text-text dark:text-white sm:text-4xl">
              {t.privacyPolicyTitle}
            </h1>
            <p className="mt-3 text-sm font-semibold text-primary dark:text-blue-400">{t.privacyLastUpdated}</p>
          </div>
        </div>
      </div>

      <article className="mx-auto max-w-3xl px-4 pt-10 sm:px-8 lg:px-16 xl:px-24">
        <header className="mb-12 rounded-2xl border border-border bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-xl font-semibold text-text dark:text-white">{t.privacyWelcome}</h2>
          <p className="mt-4 text-sm leading-relaxed text-sub dark:text-slate-300">{t.privacyIntro}</p>
          <p className="mt-3 text-sm leading-relaxed text-sub dark:text-slate-300">{t.privacyAgree}</p>
        </header>

        <div className="space-y-12">
          {sections.map((section) => (
            <section key={section.title} id={section.id} className="scroll-mt-24">
              <h2 className="border-b border-border pb-2 text-lg font-semibold text-text dark:border-slate-700 dark:text-white">
                {section.title}
              </h2>
              <div className="mt-4 space-y-4">
                {section.blocks.map((block, i) => (
                  <div key={i}>
                    {block.subtitle && (
                      <h3 className="mb-2 text-sm font-semibold text-text dark:text-white">{block.subtitle}</h3>
                    )}
                    {block.text && (
                      <p className="text-sm leading-relaxed text-sub dark:text-slate-300">{block.text}</p>
                    )}
                    {block.link && (
                      <Link href={block.link.href} className="mt-2 inline-block text-sm font-semibold text-primary underline dark:text-blue-400">
                        {block.link.label}
                      </Link>
                    )}
                    {block.bullets && block.bullets.length > 0 && (
                      <ul className="mt-3 list-disc space-y-2 ps-5 text-sm leading-relaxed text-sub marker:text-primary dark:text-slate-300 dark:marker:text-blue-400">
                        {block.bullets.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a
            href={mailtoHref}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-colors hover:bg-primary-dark dark:bg-blue-600 dark:hover:bg-blue-700 sm:w-auto"
          >
            <Mail className="h-5 w-5" aria-hidden />
            {t.privacyContactBtn}
          </a>
          <Link
            href={pathForLang('/contact', language)}
            className="inline-flex w-full items-center justify-center rounded-xl border border-border bg-white px-6 py-3.5 text-sm font-semibold text-text transition-colors hover:border-primary dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:hover:border-blue-500 sm:w-auto"
          >
            {t.contactInformation}
          </Link>
        </div>

        <footer className="mt-16 border-t border-border pt-8 text-center dark:border-slate-800">
          <p className="text-xs font-semibold text-sub dark:text-slate-500">{t.privacyFooter}</p>
        </footer>
      </article>
    </div>
  );
}
