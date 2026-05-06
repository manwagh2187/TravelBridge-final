import { useRouter } from 'next/router';
import { useState } from 'react';

export default function CheckoutPage() {
  const router = useRouter();
  const { hotelId, checkIn, checkOut, guests, destination, rateKey } = router.query;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleBook() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/hotelbeds/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelId,
          checkIn,
          checkOut,
          guests: Number(guests || 2),
          rateKey,
          traveler: {
            firstName,
            lastName,
            email,
            phone,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Booking failed');
      }

      router.push({
        pathname: '/booking/success',
        query: {
          reference: data?.booking?.reference || data?.reference || data?.bookingReference || 'confirmed',
          destination,
        },
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container section">
      <h1>Checkout</h1>
      <p>{destination}</p>

      <div className="info-card">
        <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
        <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />

        {error ? <div className="search-error">{error}</div> : null}

        <button className="btn btn-primary" onClick={handleBook} disabled={loading}>
          {loading ? 'Booking...' : 'Confirm booking'}
        </button>
      </div>
    </div>
  );
}