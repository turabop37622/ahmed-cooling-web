'use client';

export default function GlobalError({ reset }) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#F0F4FF', color: '#0F172A' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, textAlign: 'center' }}>
          <div style={{ maxWidth: 420 }}>
            <h1 style={{ fontSize: 24, margin: '0 0 8px' }}>حدث خطأ ما / Something went wrong</h1>
            <p style={{ fontSize: 14, color: '#475569', margin: '0 0 24px' }}>
              تعذر تحميل الموقع. حاول مرة أخرى بعد قليل.
              <br />
              The site could not be loaded. Please try again in a moment.
            </p>
            <button
              onClick={() => reset()}
              style={{ background: '#2563EB', color: '#fff', border: 0, borderRadius: 12, padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              إعادة المحاولة / Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
