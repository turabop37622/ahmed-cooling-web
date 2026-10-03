'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X, Sun, Moon, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../contexts/TranslationContext';
import { stripLang, pathForLang } from '../lib/lang';

export default function Navbar() {
  const pathname = usePathname();
  const { user, token, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { t, language, setLanguage } = useTranslation();
  const isAr = language === 'ar';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);
  const toggleRef = useRef(null);
  const wasMobileOpen = useRef(false);

  const barePath = stripLang(pathname || '/');
  const isHome = barePath === '/';
  const isDarkHeader = isHome && !scrolled;

  // Scroll detection to switch header from dark to light
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
        setMobileOpen(false);
      }
    };
    // pointerdown also covers touch, which mousedown does not
    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // Close the mobile menu when the viewport grows to the desktop layout (md = 768px).
  // Closing also releases the scroll lock and the focus trap below.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = (e) => {
      if (e.matches) setMobileOpen(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Close the mobile menu after navigating (covers links and browser back/forward)
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Mobile menu: move focus in on open, trap Tab, restore focus to the toggle on close
  useEffect(() => {
    if (mobileOpen) {
      wasMobileOpen.current = true;
      menuRef.current?.querySelector('a[href], button')?.focus();
      const onKeyDown = (e) => {
        if (e.key !== 'Tab') return;
        const items = [
          ...(menuRef.current?.querySelectorAll('a[href], button:not([disabled])') || []),
          toggleRef.current,
        ].filter(Boolean);
        if (!items.length) return;
        const firstEl = items[0];
        const lastEl = items[items.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        } else if (!items.includes(document.activeElement)) {
          e.preventDefault();
          firstEl.focus();
        }
      };
      document.addEventListener('keydown', onKeyDown);
      return () => document.removeEventListener('keydown', onKeyDown);
    }
    if (wasMobileOpen.current) {
      wasMobileOpen.current = false;
      // The toggle is hidden on desktop; only move focus back when it is visible
      if (toggleRef.current?.offsetParent) toggleRef.current.focus();
    }
    return undefined;
  }, [mobileOpen]);

  // Give the layout's <main> an id so the skip link has a target
  useEffect(() => {
    const main = document.querySelector('main');
    if (main && !main.id) main.id = 'main-content';
    if (main && !main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
  }, [pathname]);

  const navLinks = [
    { href: '/', label: t.home },
    { href: '/services', label: t.services },
    { href: '/about', label: t.aboutUs },
    { href: '/contact', label: language === 'ar' ? 'اتصل بنا' : 'Contact' },
  ];

  // Current section: Home only on "/", the others also on their sub-pages (e.g. /services/ac-repair)
  const isLinkActive = (href) =>
    href === '/' ? barePath === '/' : barePath === href || barePath.startsWith(`${href}/`);

  // "page" on the exact page, "true" on a sub-page of that section
  const ariaCurrent = (href) => (barePath === href ? 'page' : isLinkActive(href) ? 'true' : undefined);

  // On booking pages the header "Book Now" would send the visitor away from the booking they are making
  const isBookingPage = barePath === '/book' || barePath.startsWith('/book/');

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  // The toggle shows the other language's name, so mark it with that language for screen readers
  const langToggleProps = {
    'aria-label': isAr ? 'التبديل إلى الإنجليزية' : 'Switch to Arabic',
  };
  const langToggleText = isAr ? (
    <span lang="en">EN</span>
  ) : (
    <span lang="ar">عربي</span>
  );

  if (pathname?.startsWith('/admin')) return null;

  return (
    <header
      className={`${
        isHome ? 'fixed top-0 left-0 right-0' : 'sticky top-0'
      } z-50 transition-all duration-300 ${
        isDarkHeader
          ? 'bg-[#0A1640] border-b border-white/10 shadow-none text-white'
          : 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-md border-b border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white'
      }`}
    >
      <a href="#main-content" className="skip-link">
        {isAr ? 'انتقل إلى المحتوى' : 'Skip to main content'}
      </a>
      <div className="mx-auto max-w-[1560px] px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={pathForLang('/', language)} className="flex items-center shrink-0 group py-1">
            {isDarkHeader ? (
              <Image
                src={isAr ? "/logo-ar-white.png" : "/logo-en-white.png"}
                alt="Ahmed Cooling Workshop"
                width={300}
                height={isAr ? 124 : 98}
                sizes="135px"
                priority
                className="h-10 sm:h-11 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
              />
            ) : (
              <>
                <Image
                src={isAr ? "/logo-ar.png" : "/logo-en.png"}
                alt="Ahmed Cooling Workshop"
                width={300}
                height={isAr ? 124 : 98}
                sizes="135px"
                className="h-10 sm:h-11 w-auto object-contain dark:hidden transition-transform duration-200 group-hover:scale-[1.02]"
              />
                <Image
                src={isAr ? "/logo-ar-white.png" : "/logo-en-white.png"}
                alt="Ahmed Cooling Workshop"
                width={300}
                height={isAr ? 124 : 98}
                sizes="135px"
                className="h-10 sm:h-11 w-auto object-contain hidden dark:block transition-transform duration-200 group-hover:scale-[1.02]"
              />
              </>
            )}
          </Link>

          {/* Desktop links */}
          <nav aria-label={isAr ? 'التنقل الرئيسي' : 'Main'} className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = isLinkActive(link.href);
              const linkClasses = isDarkHeader
                ? isActive
                  ? 'text-white bg-white/20'
                  : 'text-white/85 hover:text-white hover:bg-white/10'
                : isActive
                  ? 'text-primary bg-primary-light dark:text-blue-400 dark:bg-blue-500/10'
                  : 'text-sub hover:text-primary hover:bg-primary-light dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800';

              return (
                <Link
                  key={link.href}
                  href={pathForLang(link.href, language)}
                  aria-current={ariaCurrent(link.href)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${linkClasses}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side actions */}
          <div className="hidden md:flex items-center gap-2">
            {/* My Bookings */}
            {token && (
              <Link
                href="/bookings"
                className={`inline-flex items-center pointer-coarse:min-h-11 px-4 py-1.5 text-sm font-semibold rounded-full transition-colors ${
                  isDarkHeader
                    ? 'bg-white/15 text-white border border-white/25 hover:bg-white/25'
                    : 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
                }`}
              >
                {t.myBookings || 'My Bookings'}
              </Link>
            )}

            {/* Language toggle */}
            <button
              type="button"
              onClick={toggleLanguage}
              {...langToggleProps}
              className={`pointer-coarse:min-h-11 pointer-coarse:min-w-11 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                isDarkHeader
                  ? 'border-white/30 text-white hover:bg-white/10'
                  : 'border-border text-sub hover:text-primary hover:border-primary dark:text-slate-300 dark:border-slate-700 dark:hover:text-white'
              }`}
            >
              {langToggleText}
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleDarkMode}
              className={`flex items-center justify-center pointer-coarse:min-h-11 pointer-coarse:min-w-11 p-2 rounded-lg transition-colors ${
                isDarkHeader
                  ? 'text-white/90 hover:text-white hover:bg-white/10'
                  : 'text-sub hover:text-primary hover:bg-primary-light dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800'
              }`}
              aria-label={isAr ? 'تبديل الوضع الداكن' : 'Toggle theme'}
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Auth */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-haspopup="menu"
                  aria-expanded={dropdownOpen}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isDarkHeader
                      ? 'text-white hover:bg-white/10'
                      : 'text-text hover:bg-primary-light dark:text-white dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-xs font-semibold text-white">
                      {(user.fullName || user.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="max-w-[120px] truncate">{user.fullName || user.name || 'User'}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div role="menu" className="absolute end-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-border dark:border-slate-700 py-1 z-50">
                    <Link
                      href="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-text dark:text-slate-200 hover:bg-primary-light dark:hover:bg-slate-700 transition-colors"
                    >
                      <User className="h-4 w-4" />
                      {t.myProfile}
                    </Link>
                    <hr className="my-1 border-border dark:border-slate-700" />
                    <button
                      onClick={() => { logout(); setDropdownOpen(false); }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      {t.logout}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDarkHeader
                    ? 'bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm'
                    : 'bg-primary hover:bg-primary-dark text-white shadow-sm'
                }`}
              >
                <User className="h-4 w-4" />
                {t.login}
              </Link>
            )}
          </div>

          {/* Mobile: language + bookings stay in the header bar */}
          <div className="flex items-center gap-2 md:hidden ms-auto me-1">
            <button
              type="button"
              onClick={toggleLanguage}
              {...langToggleProps}
              className={`inline-flex items-center justify-center min-h-11 min-w-11 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                isDarkHeader
                  ? 'border-white/30 text-white hover:bg-white/10'
                  : 'border-border text-sub hover:text-primary hover:border-primary dark:text-slate-300 dark:border-slate-700'
              }`}
            >
              {langToggleText}
            </button>
            {!(isBookingPage && !token) && (
            <Link
              href={token ? '/bookings' : pathForLang('/services', language)}
              aria-current={token && barePath === '/bookings' ? 'page' : undefined}
              className={`inline-flex items-center justify-center min-h-11 px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap transition-colors ${
                isDarkHeader
                  ? 'bg-white text-[#0A1640] hover:bg-white/90'
                  : 'bg-primary text-white hover:bg-primary-dark'
              }`}
            >
              {token ? (t.myBookings || 'My Bookings') : (isAr ? 'احجز الآن' : 'Book Now')}
            </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            ref={toggleRef}
            className={`md:hidden flex items-center justify-center min-h-11 min-w-11 p-2 rounded-lg transition-colors ${
              isDarkHeader
                ? 'text-white hover:bg-white/10'
                : 'text-sub hover:text-primary hover:bg-primary-light dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
            aria-label={mobileOpen ? (isAr ? 'إغلاق القائمة' : 'Close menu') : (isAr ? 'فتح القائمة' : 'Open menu')}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-haspopup="dialog"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu: rendered into <body> so it covers the whole viewport below the header
          (the header's backdrop blur would otherwise clip a fixed child). It sits above the cookie banner (z-60). */}
      {mobileOpen && typeof document !== 'undefined' && createPortal(
        <div className="md:hidden fixed inset-x-0 top-16 bottom-0 z-[70]" dir={isAr ? 'rtl' : 'ltr'}>
          {/* Backdrop: tap to close */}
          <div
            aria-hidden="true"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />
        <div
          id="mobile-menu"
          ref={menuRef}
          role="dialog"
          aria-modal="true"
          aria-label={isAr ? 'القائمة الرئيسية' : 'Main menu'}
          className={`relative max-h-full overflow-y-auto overscroll-contain border-t shadow-2xl ${
            isDarkHeader
              ? 'border-white/15 bg-[#0A1640] text-white'
              : 'border-border dark:border-slate-700 bg-white dark:bg-slate-900'
          }`}
        >
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => {
              const isActive = isLinkActive(link.href);
              return (
              <Link
                key={link.href}
                href={pathForLang(link.href, language)}
                onClick={() => setMobileOpen(false)}
                aria-current={ariaCurrent(link.href)}
                className={`flex min-h-11 items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isDarkHeader
                    ? isActive
                      ? 'bg-white/15 text-white font-semibold'
                      : 'text-white/90 hover:bg-white/10 hover:text-white'
                    : isActive
                      ? 'bg-primary-light text-primary font-semibold dark:bg-blue-500/10 dark:text-blue-400'
                      : 'text-text dark:text-slate-200 hover:bg-primary-light dark:hover:bg-slate-800'
                }`}
              >
                {link.label}
              </Link>
              );
            })}
          </div>

          <div
            className={`px-4 py-3 border-t flex items-center gap-3 ${
              isDarkHeader ? 'border-white/15' : 'border-border dark:border-slate-700'
            }`}
          >
            <button
              onClick={toggleDarkMode}
              className={`flex items-center justify-center pointer-coarse:min-h-11 pointer-coarse:min-w-11 p-2 rounded-lg transition-colors ${
                isDarkHeader
                  ? 'text-white/90 hover:bg-white/10'
                  : 'text-sub dark:text-slate-300 hover:text-primary hover:bg-primary-light dark:hover:bg-slate-800'
              }`}
              aria-label={isAr ? 'تبديل الوضع الداكن' : 'Toggle theme'}
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>

          <div
            className={`px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t ${
              isDarkHeader ? 'border-white/15' : 'border-border dark:border-slate-700'
            }`}
          >
            {user ? (
              <div className="space-y-1">
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-sm font-semibold text-white">
                      {(user.fullName || user.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isDarkHeader ? 'text-white' : 'text-text dark:text-white'
                    }`}
                  >
                    {user.fullName || user.name || 'User'}
                  </span>
                </div>
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className={`flex min-h-11 items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isDarkHeader
                      ? 'text-white/90 hover:bg-white/10'
                      : 'text-text dark:text-slate-200 hover:bg-primary-light dark:hover:bg-slate-800'
                  }`}
                >
                  <User className="h-4 w-4" />
                  {t.myProfile}
                </Link>

                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="flex min-h-11 items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  {t.logout}
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className={`flex min-h-11 items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isDarkHeader
                    ? 'bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm'
                    : 'bg-primary hover:bg-primary-dark text-white'
                }`}
              >
                <User className="h-4 w-4" />
                {t.login}
              </Link>
            )}
          </div>
        </div>
        </div>,
        document.body,
      )}
    </header>
  );
}
