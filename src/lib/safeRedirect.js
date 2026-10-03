// A post-login destination must be a path on this site.
// Rejects absolute URLs (https://evil.example), protocol-relative URLs (//evil.example, /\evil.example),
// backslash tricks, and control characters / whitespace that browsers strip while parsing ("/\t/evil.example").
// Returns the normalised same-origin pathname + search + hash, or `fallback`.
// Self-test: node src/lib/safeRedirect.test.mjs
const BASE = 'https://same-origin.invalid';

export function safeRedirect(value, fallback = '/') {
  if (typeof value !== 'string' || !value || value.length > 2048) return fallback;

  // Check both the raw value and its decoded form: "/%2F%2Fevil" or "/%09/evil" must not slip through
  let decoded;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return fallback;
  }
  for (const v of [value, decoded]) {
    // Any whitespace or control character (tab, newline, NUL, DEL, C1, Unicode spaces) or a backslash
    if (/[\s\u0000-\u001f\u007f-\u009f\\]/.test(v)) return fallback;
    // Exactly one leading slash
    if (v[0] !== '/' || v[1] === '/') return fallback;
  }

  try {
    const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : BASE;
    const url = new URL(value, origin);
    if (url.origin !== origin) return fallback;
    const out = url.pathname + url.search + url.hash;
    // The normalised result must still be a single-slash path
    if (!out.startsWith('/') || out.startsWith('//')) return fallback;
    return out;
  } catch {
    return fallback;
  }
}
