'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Sun, Moon, User, LogOut, ChevronDown, Snowflake } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../contexts/TranslationContext';

export default function Navbar() {
  const { user, token, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { t, language, setLanguage } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { href: '/', label: t.home },
    { href: '/services', label: t.services },
    { href: '/about', label: t.aboutUs },
    { href: '/about#contact', label: language === 'ar' ? 'اتصل بنا' : 'Contact' },
  ];

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white dark:bg-slate-900 border-b border-border shadow-sm' : 'bg-[#1D4ED8] border-b border-transparent'}`}>
      <div className="w-full mx-auto px-4 sm:px-8 lg:px-16 xl:px-24">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Snowflake className={`h-7 w-7 ${scrolled ? 'text-primary' : 'text-white'}`} />
            <div>
              <span className={`text-lg font-black ${scrolled ? 'text-text dark:text-white' : 'text-white'}`}>{t.appName}</span>
            </div>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${scrolled ? 'text-sub hover:text-primary hover:bg-primary-light dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side actions */}
          <div className="hidden md:flex items-center gap-2">



            {/* My Bookings */}
            {token && (
              <Link href="/bookings" className={`px-4 py-1.5 text-sm font-bold rounded-full border transition-colors ${scrolled ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' : 'bg-white/15 text-white border-white/25 hover:bg-white/25'}`}>
                {t.myBookings || 'My Bookings'}
              </Link>
            )}

            {/* Language toggle */}
            <button
              onClick={toggleLanguage}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${scrolled ? 'border-border text-sub hover:text-primary hover:border-primary dark:text-slate-300 dark:border-slate-700' : 'border-white/25 text-white/80 hover:text-white hover:border-white/50'}`}
            >
              {language === 'en' ? 'عربي' : 'EN'}
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg transition-colors ${scrolled ? 'text-sub hover:text-primary hover:bg-primary-light dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Auth */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${scrolled ? 'text-text hover:bg-primary-light dark:text-white dark:hover:bg-slate-800' : 'text-white hover:bg-white/10'}`}
                >
                  <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {(user.fullName || user.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="max-w-[120px] truncate">{user.fullName || user.name || 'User'}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-border dark:border-slate-700 py-1 z-50">
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
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${scrolled ? 'bg-primary hover:bg-primary-dark text-white' : 'bg-white text-[#1D4ED8] hover:bg-white/90'}`}
              >
                <User className="h-4 w-4" />
                {t.login}
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`md:hidden p-2 rounded-lg transition-colors ${scrolled ? 'text-sub hover:text-primary hover:bg-primary-light dark:text-slate-300 dark:hover:bg-slate-800' : 'text-white hover:bg-white/10'}`}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border dark:border-slate-700 bg-white dark:bg-slate-900">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-text dark:text-slate-200 hover:bg-primary-light dark:hover:bg-slate-800 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="px-4 py-3 border-t border-border dark:border-slate-700 flex items-center gap-3">
            <button
              onClick={toggleLanguage}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-border text-sub dark:text-slate-300 dark:border-slate-700 hover:text-primary hover:border-primary transition-colors"
            >
              {language === 'en' ? 'عربي' : 'EN'}
            </button>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-sub dark:text-slate-300 hover:text-primary hover:bg-primary-light dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>

          <div className="px-4 py-3 border-t border-border dark:border-slate-700">
            {user ? (
              <div className="space-y-1">
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {(user.fullName || user.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-text dark:text-white">{user.fullName || user.name || 'User'}</span>
                </div>
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-text dark:text-slate-200 hover:bg-primary-light dark:hover:bg-slate-800 transition-colors"
                >
                  <User className="h-4 w-4" />
                  {t.myProfile}
                </Link>


                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  {t.logout}
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm font-medium transition-colors"
              >
                <User className="h-4 w-4" />
                {t.login}
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
