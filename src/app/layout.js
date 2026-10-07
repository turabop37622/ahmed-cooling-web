import "./globals.css";
import { Poppins, IBM_Plex_Sans_Arabic } from "next/font/google";
import { ThemeProvider } from "../contexts/ThemeContext";
import { TranslationProvider } from "../contexts/TranslationContext";
import { AuthProvider } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import WhatsAppButton from "../components/WhatsAppButton";
import ScrollObserver from "../components/ScrollObserver";
import ConsentBanner from "../components/ConsentBanner";
import { getRequestLang, ogLocale, BRAND, OG_IMAGE } from "../lib/seo";
import { absoluteUrl, langAlternates } from "../lib/lang";

// Self-hosted by next/font (no render-blocking Google Fonts stylesheet). Weights are the ones the site uses (300-700).
// globals.css reads var(--font-sans) / var(--font-arabic); those variables are pointed at these fonts on <html> below.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  preload: false, // the default (Arabic) pages mostly need the Arabic font; Poppins loads when English text renders
  fallback: ["Segoe UI", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
});
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  fallback: ["Tahoma", "system-ui", "sans-serif"],
});
const fontVars = {
  "--font-sans": poppins.style.fontFamily,
  "--font-arabic": plexArabic.style.fontFamily,
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F0F4FF" },
    { media: "(prefers-color-scheme: dark)", color: "#0F172A" },
  ],
  colorScheme: "light dark",
};

const SITE = 'https://www.ahmedcoolingworkshop.com';
// Square brand logo (320x320, the English logo on white) for Google's logo / knowledge panel (min. 112x112)
const LOGO_URL = `${SITE}/logo-square.png`;
const SAME_AS = [
  'https://wa.me/966544483745',
  'https://www.instagram.com/ahmedcoolingworkshop/',
  'https://www.facebook.com/profile.php?id=61589456784736',
];

const WEBSITE_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE}/#website`,
  name: 'Ahmed Cooling Workshop',
  alternateName: ['ورشة أحمد للتبريد', 'Ahmed Cooling'],
  url: SITE,
  inLanguage: ['ar-SA', 'en-SA'],
  publisher: { '@id': `${SITE}/#organization` },
};

const ORGANIZATION_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE}/#organization`,
  name: 'Ahmed Cooling Workshop',
  alternateName: ['ورشة أحمد للتبريد', 'Ahmed Cooling'],
  url: SITE,
  logo: { '@type': 'ImageObject', url: LOGO_URL, width: 320, height: 320 },
  email: 'ahmedcoolingworkshop@gmail.com',
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+966544483745',
    contactType: 'customer service',
    areaServed: 'SA',
    availableLanguage: ['ar', 'en'],
  },
  sameAs: SAME_AS,
};

const HOME = {
  ar: {
    title: 'ورشة أحمد للتبريد | صيانة مكيفات جدة ومكة',
    description: 'ورشة أحمد للتبريد: صيانة وغسيل وتعبئة فريون للمكيفات وإصلاح الثلاجات والغسالات في جدة ومكة. طوارئ 24/7 مع ضمان وقطع غيار أصلية.',
    ogDescription: 'صيانة وإصلاح المكيفات والأجهزة المنزلية في جدة ومكة المكرمة. خدمة طوارئ 24/7 مع فنيين مؤهلين وضمان معتمد.',
  },
  en: {
    title: 'AC Repair Jeddah & Makkah | Ahmed Cooling Workshop',
    description: 'Certified AC repair, cleaning and gas refill, plus fridge and washing machine repair in Jeddah & Makkah. 24/7 emergency service with warranty.',
    ogDescription: 'AC and home appliance repair in Jeddah & Makkah. 24/7 emergency service with certified technicians and an official warranty.',
  },
};

export async function generateMetadata() {
  const lang = await getRequestLang();
  const home = HOME[lang];
  return {
  metadataBase: new URL('https://www.ahmedcoolingworkshop.com'),
  title: {
    default: home.title,
    template: `%s | ${BRAND[lang]}`,
  },
  description: home.description,
  keywords: [
    // Saudi Arabic Primary Keywords
    'ورشة أحمد للتبريد', 'صيانة مكيفات جدة', 'تصليح مكيفات مكة', 'فني مكيفات اسبليت جدة',
    'غسيل مكيفات جدة', 'تنظيف مكيفات مكة', 'تعبئة فريون مكيف جدة', 'صيانة أجهزة منزلية جدة',
    'إصلاح ثلاجات جدة', 'إصلاح غسالات مكة', 'فني تكييف مركزي جدة', 'صيانة تكييف مكة المكرمة',
    'شركة صيانة مكيفات بجدة', 'خدمة طوارئ تكييف 24 ساعة', 'تصليح أجهزة منزلية مكة',
    // English Keywords for Expats Living in Saudi Arabia
    'Ahmed Cooling Workshop', 'AC repair Jeddah', 'AC repair Makkah', 'air conditioner repair Saudi Arabia',
    'certified AC technician Jeddah', 'split AC maintenance Jeddah', 'AC deep cleaning Jeddah',
    'AC gas refill KSA', 'refrigerator repair Jeddah', 'washing machine repair Makkah',
    'emergency AC repair Jeddah', 'appliance repair Jeddah', 'HVAC technician Jeddah',
    'home appliance maintenance Saudi Arabia', 'central AC maintenance Makkah', 'freon leak fix Jeddah',
  ],
  // Google Search shows the site icon only from square files sized in multiples of 48px
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48 64x64' },
      { url: '/icon-48.png', type: 'image/png', sizes: '48x48' },
      { url: '/icon-96.png', type: 'image/png', sizes: '96x96' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    shortcut: '/favicon.ico',
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  openGraph: {
    type: 'website',
    locale: ogLocale(lang),
    alternateLocale: [ogLocale(lang === 'en' ? 'ar' : 'en')],
    url: absoluteUrl('/', lang),
    title: home.title,
    description: home.ogDescription,
    siteName: 'Ahmed Cooling Workshop - ورشة أحمد للتبريد',
    images: [OG_IMAGE[lang]],
  },
  twitter: {
    card: 'summary_large_image',
    title: home.title,
    description: home.ogDescription,
    images: [OG_IMAGE[lang].url],
  },
  alternates: langAlternates('/', lang),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  verification: {
    google: 'google2c7ef9c93df45db9',
  },
  other: {
    'geo.region': 'SA',
    'geo.placename': 'Jeddah, Saudi Arabia',
    'geo.position': '21.4858;39.1925',
    'ICBM': '21.4858, 39.1925',
  },
  };
}

export default async function RootLayout({ children }) {
  const lang = await getRequestLang();
  return (
    <html
      lang={lang}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="h-full"
      style={fontVars}
      translate="no"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        {/* Prevent dark mode flash — runs before React hydration. A saved choice wins; with no choice the
            system preference decides (ThemeContext mirrors whatever class this sets). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('darkMode');var d=s==='true'||(s!=='false'&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d){document.documentElement.classList.add('dark')}}catch(e){}})();`,
          }}
        />
        <meta name="google" content="notranslate" />
        {/* Brand entities: the website and the organization behind it (linked to the LocalBusiness below by @id) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify([WEBSITE_JSON_LD, ORGANIZATION_JSON_LD]) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': ['LocalBusiness', 'HVACBusiness'],
              '@id': `${SITE}/#localbusiness`,
              name: 'Ahmed Cooling Workshop - ورشة أحمد للتبريد',
              logo: LOGO_URL,
              image: [LOGO_URL, `${SITE}${OG_IMAGE.ar.url}`, `${SITE}${OG_IMAGE.en.url}`],
              parentOrganization: { '@id': `${SITE}/#organization` },
              alternateName: 'Ahmed Cooling Workshop KSA',
              description: 'ورشة أحمد للتبريد - صيانة وإصلاح المكيفات (سبليت وشباك ومركزي)، الثلاجات والغسالات في جدة ومكة المكرمة. خدمة طوارئ 24/7 مع ضمان رسمي معتمد وقطع غيار أصلية.',
              disambiguatingDescription: 'Professional air conditioning and home appliance repair workshop in Saudi Arabia serving customers across Jeddah and Makkah.',
              url: 'https://www.ahmedcoolingworkshop.com',
              telephone: '+966544483745',
              email: 'ahmedcoolingworkshop@gmail.com',
              knowsLanguage: ['ar', 'en'],
              address: {
                '@type': 'PostalAddress',
                addressLocality: 'Jeddah',
                addressRegion: 'Makkah Province',
                addressCountry: 'SA',
              },
              geo: {
                '@type': 'GeoCoordinates',
                latitude: 21.4858,
                longitude: 39.1925,
              },
              areaServed: [
                { '@type': 'City', name: 'Jeddah', sameAs: 'https://en.wikipedia.org/wiki/Jeddah' },
                { '@type': 'City', name: 'Makkah', '@id': 'https://www.wikidata.org/wiki/Q5806' },
                { '@type': 'Country', name: 'Saudi Arabia' },
              ],
              serviceType: [
                'AC Repair', 'AC Installation', 'AC Deep Cleaning', 'AC Gas Refill',
                'Refrigerator Repair', 'Washing Machine Repair', 'Freezer Repair',
                'Stove & Oven Repair', 'Microwave Repair', 'Electrical Wiring',
                'Central AC Service', 'General Maintenance', 'Emergency AC Repair',
              ],
              openingHoursSpecification: {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                opens: '00:00',
                closes: '23:59',
              },
              priceRange: 'SAR 100 - SAR 2000',
              sameAs: SAME_AS,
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Service',
              serviceType: 'HVAC and Home Appliance Repair Services in Saudi Arabia',
              provider: {
                '@type': 'LocalBusiness',
                '@id': `${SITE}/#localbusiness`,
                name: 'Ahmed Cooling Workshop - ورشة أحمد للتبريد',
                telephone: '+966544483745',
              },
              areaServed: [
                { '@type': 'City', name: 'Jeddah' },
                { '@type': 'City', name: 'Makkah' },
              ],
              hasOfferCatalog: {
                '@type': 'OfferCatalog',
                name: 'AC & Appliance Repair Services - خدمات صيانة المكيفات والأجهزة',
                itemListElement: [
                  { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'AC Repair & Diagnostics - إصلاح وصيانة المكيفات' } },
                  { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'AC Installation & Dismantling - فك وتركيب المكيفات' } },
                  { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'AC Deep Jet Wash Cleaning - غسيل وتنظيف عميق للمكيفات' } },
                  { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'AC Freon Gas Refill - تعبئة وشحن فريون أصلي' } },
                  { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Refrigerator & Freezer Repair - صيانة الثلاجات والفريزر' } },
                  { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Washing Machine Repair - صيانة وإصلاح الغسالات' } },
                ],
              },
            }),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#F0F4FF] text-[#0F172A] dark:bg-[#0F172A] dark:text-[#F1F5F9] antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <TranslationProvider initialLang={lang}>
            <AuthProvider>
              <Navbar />
              <ScrollObserver />
              <main className="flex-1">{children}</main>
              <Footer />
              <WhatsAppButton />
              <ConsentBanner />
            </AuthProvider>
          </TranslationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
