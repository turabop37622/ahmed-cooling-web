export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/bookings/',
          '/profile/',
          '/book/',
          '/login',
          '/signup',
          '/forgot-password',
          '/rate',
        ],
      },
    ],
    sitemap: 'https://www.ahmedcoolingworkshop.com/sitemap.xml',
  };
}
