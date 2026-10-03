import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isDev = process.env.NODE_ENV !== 'production';

// Backend origin the browser talks to (also used by the booking/admin pages)
const API_ORIGIN = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_API_URL || 'https://ahmed-cooling-backend.onrender.com/api').origin;
  } catch {
    return 'https://ahmed-cooling-backend.onrender.com';
  }
})();

// What the site really loads: self-hosted fonts (next/font), the Render backend (fetch), BigDataCloud (browser-side
// reverse-geocoding fallback on the booking page), Google Identity Services (the "Continue with Google" button: script,
// stylesheet, iframe and credential requests under accounts.google.com/gsi/), the TikTok pixel (only after the visitor
// accepts cookies), images from itself / data URIs. Next.js and the JSON-LD blocks need inline scripts.
const GSI = 'https://accounts.google.com/gsi/';
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} ${GSI}client https://analytics.tiktok.com https://*.tiktok.com`,
  `style-src 'self' 'unsafe-inline' ${GSI}style`,
  "font-src 'self' data:",
  "img-src 'self' data: blob: https:",
  `connect-src 'self' ${API_ORIGIN} https://api.bigdatacloud.net ${GSI} https://*.tiktok.com https://*.tiktokw.us${isDev ? ' ws://localhost:* http://localhost:*' : ''}`,
  `frame-src ${GSI} https://*.tiktok.com`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://accounts.google.com",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Booking uses the device location, so geolocation stays allowed for our own pages
  { key: 'Permissions-Policy', value: 'geolocation=(self), camera=(), microphone=(), payment=(), usb=(), interest-cohort=()' },
  // Report-Only: nothing is blocked yet. Switch the key to 'Content-Security-Policy' once the console shows no reports
  // (including with the TikTok pixel accepted).
  { key: 'Content-Security-Policy-Report-Only', value: csp },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  turbopack: {
    root: __dirname,
  },
  devIndicators: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2592000,
  },
  async headers() {
    const longCache = [{ key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' }];
    return [
      { source: '/:path*', headers: securityHeaders },
      { source: '/hero-banners/:path*', headers: longCache },
      { source: '/services/:file(.+\\.jpg)', headers: longCache },
      { source: '/:file(logo.*\\.png)', headers: longCache },
    ];
  },
};

export default nextConfig;
