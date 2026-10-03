import LoginForm from './LoginForm';

const first = (v) => (Array.isArray(v) ? v[0] : v);

// Server component: the query string is read here and passed down, so the client form renders exactly once
// (no Suspense fallback / useSearchParams bailout). The redirect target is validated in LoginForm (safeRedirect).
export default async function LoginPage({ searchParams }) {
  const sp = (await searchParams) || {};
  return (
    <LoginForm
      redirect={first(sp.redirect) || ''}
      verified={Boolean(first(sp.verified))}
      reason={first(sp.reason) === 'auth' ? 'auth' : ''}
    />
  );
}
