// Self-test for safeRedirect (no test framework in this project): node src/lib/safeRedirect.test.mjs
import assert from 'node:assert/strict';
import { safeRedirect } from './safeRedirect.js';

const rejected = [
  undefined, null, 42, '', 'https://evil.example', 'http:evil.example', 'javascript:alert(1)',
  '//evil.example', '///evil.example', '/\\evil.example', '\\\\evil.example', '/\t/evil.example',
  '/\n/evil.example', '/\r/evil.example', '\t//evil.example', ' /profile', '/%2F/evil.example',
  '/%5Cevil.example', '/%09/evil.example', '/%0a/evil.example', '/%E0%A4%A', '/ /evil.example',
  '/ /evil.example', 'evil.example', './/evil.example', '/profile\u0000',
];
for (const v of rejected) assert.equal(safeRedirect(v), '/', `should reject ${JSON.stringify(v)}`);

const accepted = [
  ['/profile', '/profile'],
  ['/bookings?tab=upcoming', '/bookings?tab=upcoming'],
  ['/book/12#step2', '/book/12#step2'],
  ['/en/services', '/en/services'],
  ['/a/../profile', '/profile'],
  ['/services/ac-repair?x=%2F', '/services/ac-repair?x=%2F'],
];
for (const [v, want] of accepted) assert.equal(safeRedirect(v), want, `should accept ${v}`);

assert.equal(safeRedirect('//evil.example', '/home'), '/home');
console.log(`safeRedirect: ${rejected.length + accepted.length + 1} checks passed`);
