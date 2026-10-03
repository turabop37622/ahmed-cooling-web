import { privatePageMetadata } from '../../lib/seo';

export function generateMetadata() {
  return privatePageMetadata('/book', { ar: 'حجز خدمة', en: 'Book a Service' });
}

export default function BookLayout({ children }) {
  return children;
}
