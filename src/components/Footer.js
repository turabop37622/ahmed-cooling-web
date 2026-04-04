'use client';

import Link from 'next/link';
import { Phone, Mail, MapPin, Globe, Camera, X } from 'lucide-react';
import { useTranslation } from '../contexts/TranslationContext';

export default function Footer() {
  const { t } = useTranslation();

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
                <a href="tel:+923001234567" className="hover:text-white transition-colors">
                  +92 300 123 4567
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
                <span>Lahore, Pakistan</span>
              </li>
            </ul>
          </div>

          {/* Follow Us */}
          <div>
            <h3 className="text-lg font-semibold mb-4">{t.followUs}</h3>
            <div className="flex items-center gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-primary hover:text-white transition-colors"
                aria-label={t.facebook}
              >
                <Globe className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-primary hover:text-white transition-colors"
                aria-label={t.instagram}
              >
                <Camera className="h-5 w-5" />
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
