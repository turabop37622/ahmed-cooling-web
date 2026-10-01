# Ahmed Cooling Workshop website

This Next.js application contains the customer website and admin portal. The API lives in the repository root.

## Run locally

1. Install dependencies with `npm install`.
2. Create `.env.local` with `NEXT_PUBLIC_API_URL=http://localhost:5000/api`.
3. Run the API from the repository root, then run `npm run dev` here.
4. Open `http://localhost:3000`.

Customers sign in before booking. Admin users sign in at `/admin/login`; messages and ratings are at `/admin/feedback`, and password changes are at `/admin/settings`.

Run `npm run build` to verify a production build.
