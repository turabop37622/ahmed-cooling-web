import SignupForm from './SignupForm';

const first = (v) => (Array.isArray(v) ? v[0] : v);

// Server component: reads ?redirect and renders the client form once (no Suspense/useSearchParams bailout)
export default async function SignupPage({ searchParams }) {
  const sp = (await searchParams) || {};
  return <SignupForm redirect={first(sp.redirect) || ''} />;
}
