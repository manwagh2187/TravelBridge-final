import { useRouter } from 'next/router';
import { useState } from 'react';

export default function Checkout() {
  const router = useRouter();
  const { roomId } = router.query;
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleBook() {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type':'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ roomId: Number(roomId), startDate, endDate })
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage('Error: ' + data.error);
        setLoading(false);
        return;
      }

      const createRes = await fetch('/api/payments/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ bookingId: data.id })
      });
      const createJson = await createRes.json();
      if (!createRes.ok) {
        setMessage('Error creating payment session: ' + createJson.error);
        setLoading(false);
        return;
      }

      if (createJson.url) {
        window.location.href = createJson.url;
      } else {
        setMessage('Payment session created but missing URL');
      }
    } catch (err) {
      console.error(err);
      setMessage('Unexpected error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 20 }}>
      <h2>Checkout</h2>
      <div>
        <label>Auth token (dev): <input value={token} onChange={e => setToken(e.target.value)} style={{ width: '100%' }} /></label>
      </div>
      <div>
        <label>Start date: <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></label>
      </div>
      <div>
        <label>End date: <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></label>
      </div>
      <div style={{ marginTop: 12 }}>
        <button onClick={handleBook} disabled={loading}>{loading ? 'Processing...' : 'Create booking & pay'}</button>
      </div>
      <div style={{ marginTop: 12 }}>{message}</div>
      <div style={{ marginTop: 24 }}>
        <p>Notes: You must set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in your environment to accept real payments. For local testing you can use Stripe test keys and the Stripe CLI to forward webhooks.</p>
      </div>
    </div>
  );
}