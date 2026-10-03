// The list page's metadata lives in page.js, so the /services/[id] pages (and their 404s) do not inherit the
// /services canonical URL.
export default function ServicesLayout({ children }) {
  return children;
}
