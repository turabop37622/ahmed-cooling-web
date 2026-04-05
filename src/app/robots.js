export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/bookings/', '/profile/'],
      },
    ],
    sitemap: 'https://www.ahmedcoolingworkshop.com/sitemap.xml',
  };
}
