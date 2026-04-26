import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';

export default function Checkout() {
  const router = useRouter();
  const { roomId } = router.query;
  const { isAuthenticated } = useAuth();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [room, setRoom] = useState(null);
  const [listing, setListing] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    async function load() {
      if (!roomId) return;
      const res = await apiFetch('/api/listings');
      const data = await res.json();
      const listings = Array.isArray(data) ? data : [];
      for (const l of listings) {
        const foundRoom = (l.rooms || []).find(r => String(r.id) === String(roomId));
        if (foundRoom) {
          setRoom(foundRoom);
          setListing(l);
          break;
        }
      }
    }
    load();
  }, [roomId]);

  const total = useMemo(() => {
    if (!room || !startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const nights = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
    return nights * Number(room.pricePerNight || 0);
  }, [room, startDate, endDate]);

  async function handleBook() {
    if (!roomId) return;
    setLoading(true);
    setMessage('');

    try {
      const res = await apiFetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: Number(roomId), startDate, endDate }),
      });

      const booking = await res.json();
      if (!res.ok) {
        setMessage(booking.error || 'Booking failed');
        return;
      }

      const payRes = await apiFetch('/api/payments/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id }),
      });

      const payJson = await payRes.json();
      if (!payRes.ok) {
        setMessage(payJson.error || 'Failed to create payment session');
        return;
      }

      if (payJson.url) {
        window.location.href = payJson.url;
      } else {
        setMessage('Payment session missing URL');
      }
    } catch (err) {
      console.error(err);
      setMessage('Unexpected error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container checkout-page">
      <div className="checkout-grid">
        <section className="checkout-card">
          <div className="badge">Secure checkout</div>
          <h1>Complete your booking</h1>
          <p>Choose dates and proceed to payment.</p>

          <div className="field">
            <label>Start date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>

          <div className="field">
            <label>End date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>

          <button className="btn btn-primary full" onClick={handleBook} disabled={loading}>
            {loading ? 'Processing...' : 'Book & pay'}
          </button>

          {message ? <div className="message">{message}</div> : null}
        </section>

        <aside className="summary-card">
          <h3>Booking summary</h3>
          {listing ? (
            <>
              <div className="summary-title">{listing.title}</div>
              <div className="summary-location">{listing.city}, {listing.country}</div>
            </>
          ) : null}

          {room ? (
            <>
              <div className="summary-room">{room.title}</div>
              <div className="summary-meta">{room.capacity} guests · {room.inventory} available</div>
              <div className="summary-price">₹{Number(room.pricePerNight || 0).toLocaleString()} per night</div>
              <div className="summary-total">Total: ₹{total.toLocaleString()}</div>
            </>
          ) : (
            <div className="summary-meta">Loading room details...</div>
          )}
        </aside>
      </div>

      <style jsx>{`
        .checkout-page {
          padding: 28px 0 64px;
        }

        .checkout-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 18px;
          align-items: start;
        }

        .checkout-card,
        .summary-card {
          background: white;
          border-radius: 28px;
          padding: 26px;
          box-shadow: var(--shadow);
          border: 1px solid rgba(226,232,240,0.8);
        }

        .badge {
          display: inline-flex;
          background: #eff6ff;
          color: var(--primary);
          padding: 8px 12px;
          border-radius: 999px;
          font-weight: 800;
          margin-bottom: 14px;
        }

        h1 {
          margin: 0 0 8px;
          font-size: 2.2rem;
        }

        p {
          color: var(--muted);
          margin: 0 0 20px;
        }

        .field {
          margin-bottom: 16px;
        }

        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 700;
        }

        input {
          width: 100%;
          padding: 14px 16px;
          border-radius: 16px;
          border: 1px solid var(--line);
          outline: none;
        }

        .full {
          width: 100%;
          margin-top: 10px;
        }

        .message {
          margin-top: 16px;
          padding: 12px 14px;
          background: #f1f5f9;
          border-radius: 14px;
          color: var(--text);
        }

        .summary-title {
          font-weight: 900;
          font-size: 1.2rem;
          margin-bottom: 6px;
        }

        .summary-location,
        .summary-meta {
          color: var(--muted);
          margin-top: 4px;
        }

        .summary-room {
          margin-top: 18px;
          font-weight: 800;
          font-size: 1.05rem;
        }

        .summary-price {
          margin-top: 18px;
          font-weight: 900;
          font-size: 1.6rem;
        }

        .summary-total {
          margin-top: 10px;
          color: var(--primary);
          font-weight: 900;
        }

        @media (max-width: 920px) {
          .checkout-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}