import services from '../lib/services.json';

export default function sitemap() {
  const base = 'https://www.ahmedcoolingworkshop.com';

  // Every service in the shared catalogue, so new services are listed without editing this file
  const serviceIds = services.map((svc) => svc._id);

  const serviceUrls = serviceIds.map((id) => ({
    url: `${base}/services/${id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  return [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${base}/services`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    ...serviceUrls,
    { url: `${base}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/rate`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];
}
