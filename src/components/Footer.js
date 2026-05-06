'use client';

import Link from 'next/link';
import { Phone, Mail, MapPin, X } from 'lucide-react';
import { useTranslation } from '../contexts/TranslationContext';

export default function Footer() {
  const { t, isRTL } = useTranslation();

  return (
    <footer className="bg-[#0F172A] text-white">
      <div className="w-full mx-auto px-4 sm:px-8 lg:px-16 xl:px-24 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Company */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t.brandName}</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-slate-400 hover:text-white transition-colors text-sm">
                  {t.aboutUs}
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-slate-400 hover:text-white transition-colors text-sm">
                  {t.services}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-slate-400 hover:text-white transition-colors text-sm">
                  {t.privacyPolicy}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t.contactInformation}</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-slate-400 text-sm">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <a href="tel:+966590192146" className="hover:text-white transition-colors" dir="ltr" style={{unicodeBidi: 'embed'}}>
                  +966 590 192 146
                </a>
              </li>
              <li className="flex items-center gap-3 text-slate-400 text-sm">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <a href="mailto:ahmedcoolingworkshop@gmail.com" className="hover:text-white transition-colors">
                  ahmedcoolingworkshop@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-3 text-slate-400 text-sm">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                <span>{isRTL ? 'جدة، المملكة العربية السعودية' : 'Jeddah, Saudi Arabia'}</span>
              </li>
            </ul>
          </div>

          {/* Follow Us */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t.followUs}</h3>
            <div className="flex items-center gap-3">
              <a
                href="https://www.facebook.com/profile.php?id=61589456784736"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-primary hover:text-white transition-colors"
                aria-label={t.facebook}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </a>
              <a
                href="https://www.instagram.com/ahmedcoolingworkshop/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-primary hover:text-white transition-colors"
                aria-label={t.instagram}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-primary hover:text-white transition-colors"
                aria-label={t.twitter}
              >
                <X className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-800">
        <div className="w-full mx-auto px-4 sm:px-8 lg:px-16 xl:px-24 py-5">
          <p className="text-center text-sm text-slate-500">
            &copy; 2026 {t.appName}
          </p>
        </div>
      </div>
    </footer>
  );
}
