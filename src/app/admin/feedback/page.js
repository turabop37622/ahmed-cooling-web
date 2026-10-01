'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '../adminApi';

export default function FeedbackPage() {
  const [inquiries, setInquiries] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminApi.getInquiries(), adminApi.getRatings()])
      .then(([messages, scores]) => {
        setInquiries(messages.inquiries || []);
        setRatings(scores.ratings || []);
      })
      .catch((err) => setError(err.message || 'Could not load feedback'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="p-6">Loading messages and ratings...</p>;

  return <div className="space-y-8 p-4 sm:p-6">
    <h1 className="text-2xl font-semibold">Messages &amp; Ratings</h1>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
    <section>
      <h2 className="mb-3 text-xl font-semibold">Contact messages</h2>
      {inquiries.length === 0 && <p>No messages yet.</p>}
      <div className="space-y-3">{inquiries.map((item) => <article key={item._id} className="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-900">
        <div className="font-semibold">{item.name} · {item.phone}</div>
        <time className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</time>
        <p className="mt-2 whitespace-pre-wrap break-words">{item.message}</p>
      </article>)}</div>
    </section>
    <section>
      <h2 className="mb-3 text-xl font-semibold">General ratings</h2>
      {ratings.length === 0 && <p>No ratings yet.</p>}
      <div className="space-y-3">{ratings.map((item) => <article key={item._id} className="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-900">
        <div className="font-semibold">{item.name || 'Customer'} · {item.rating}/5</div>
        <time className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</time>
        <p className="mt-2 whitespace-pre-wrap break-words">{item.feedback}</p>
      </article>)}</div>
    </section>
  </div>;
}
