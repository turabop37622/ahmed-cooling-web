// A post-login destination must be a path on this site.
// Rejects absolute URLs (https://evil.example), protocol-relative URLs (//evil.example) and backslash tricks.
export function safeRedirect(value, fallback = '/') {
  if (typeof value !== 'string') return fallback;
  const v = value.trim();
  if (!v.startsWith('/') || v.startsWith('//') || /[\\\r\n]/.test(v)) return fallback;
  return v;
}
