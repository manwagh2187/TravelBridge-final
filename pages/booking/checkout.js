import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';

export default function Checkout() {
  const router = useRouter();
  const { roomId } = router.query;
  const { isAuthenticated } = useAuth();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [guests, setGuests] = useState(2);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [room, setRoom] = useState(null);
  const [hotel, setHotel] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    async function load() {
      if (!roomId) return;

      try {
        const roomRes = await apiFetch(`/api/hotels/rooms/${roomId}`);
        const roomJson = await roomRes.json();

        if (roomRes.ok) {
          setRoom(roomJson.room || roomJson);
          setHotel(roomJson.hotel || null);
        }
      } catch (err) {
        console.error(err);
      }
    }

    load();
  }, [roomId]);

  const nights = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
  }, [startDate, endDate]);

  const total = useMemo(() => {
    if (!room || !nights) return 0;
    return nights * Number(room.pricePerNight || 0);
  }, [room, nights]);

  async function handleBook() {
    if (!roomId || !startDate || !endDate) {
      setMessage('Please select check-in and check-out dates.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await apiFetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: Number(roomId),
          startDate,
          endDate,
          guests,
        }),
      });

      const booking = await res.json();

      if (!res.ok) {
        setMessage(booking.error || 'Booking failed');
        return;
      }

      if (booking?.id) {
        router.push('/booking/success');
      } else {
        setMessage('Booking created but confirmation is missing.');
      }
    } catch (err) {
      console.error(err);
      setMessage('Unexpected error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="checkout-shell">
      <div className="container checkout-page">
        <div className="checkout-grid">
          <section className="checkout-main">
            <div className="badge">Secure checkout</div>
            <h1>Complete your booking</h1>
            <p>Choose your stay dates and confirm your reservation.</p>

            <div className="form-grid">
              <div className="field">
                <label>Check-in</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>

              <div className="field">
                <label>Check-out</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>

              <div className="field">
                <label>Guests</label>
                <select value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
                  <option value={1}>1 guest</option>
                  <option value={2}>2 guests</option>
                  <option value={3}>3 guests</option>
                  <option value={4}>4 guests</option>
                  <option value={5}>5 guests</option>
                </select>
              </div>
            </div>

            <div className="notice">
              <strong>Good to know:</strong> Your room will be held only after payment confirmation.
            </div>

            <button className="btn btn-primary full" onClick={handleBook} disabled={loading}>
              {loading ? 'Processing...' : 'Book & pay'}
            </button>

            {message ? <div className="message">{message}</div> : null}

            <div className="back-link">
              <Link href={`/listing/${hotel?.id || ''}`}>Back to listing</Link>
            </div>
          </section>

          <aside className="summary-card">
            <div className="summary-badge">Your booking summary</div>

            {hotel ? (
              <>
                <div className="summary-title">{hotel.title}</div>
                <div className="summary-location">
                  {hotel.city}, {hotel.country}
                </div>
              </>
            ) : null}

            {room ? (
              <>
                <div className="summary-room">{room.title}</div>
                <div className="summary-meta">
                  {room.capacity} guests • {room.inventory} available
                </div>

                <div className="price-row">
                  <span>Nightly rate</span>
                  <strong>₹{Number(room.pricePerNight || 0).toLocaleString()}</strong>
                </div>

                <div className="price-row">
                  <span>Stay length</span>
                  <strong>{nights || 0} nights</strong>
                </div>

                <div className="total-row">
                  <span>Total</span>
                  <strong>₹{total.toLocaleString()}</strong>
                </div>
              </>
            ) : (
              <div className="summary-meta">Loading room details...</div>
            )}

            <ul className="summary-features">
              <li>Free cancellation options</li>
              <li>Instant confirmation</li>
              <li>Secure payment flow</li>
            </ul>
          </aside>
        </div>
      </div>

      <style jsx>{`
        .checkout-shell {
          background: linear-gradient(180deg, #f5f3ef 0%, #efe8df 100%);
          min-height: 100vh;
          padding-bottom: 64px;
        }

        .checkout-page {
          padding: 28px 0 0;
        }

        .checkout-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.3fr) 420px;
          gap: 18px;
          align-items: start;
        }

        .checkout-main,
        .summary-card {
          background: white;
          border-radius: 28px;
          padding: 26px;
          box-shadow: var(--shadow);
          border: 1px solid rgba(226,232,240,0.85);
        }

        .badge,
        .summary-badge {
          display: inline-flex;
          background: #fff7ed;
          color: #92400e;
          padding: 8px 12px;
          border-radius: 999px;
          font-weight: 800;
          margin-bottom: 14px;
        }

        h1 {
          margin: 0 0 8px;
          font-size: 2.4rem;
          letter-spacing: -0.04em;
        }

        p {
          color: var(--muted);
          margin: 0 0 22px;
          line-height: 1.7;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .field {
          margin-bottom: 14px;
        }

        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 700;
        }

        input,
        select {
          width: 100%;
          padding: 14px 16px;
          border-radius: 16px;
          border: 1px solid var(--line);
          outline: none;
          background: white;
        }

        .notice {
          margin: 18px 0;
          background: #fff7ed;
          border: 1px solid #fde68a;
          border-radius: 18px;
          padding: 14px 16px;
          color: var(--text);
        }

        .full {
          width: 100%;
          margin-top: 10px;
          padding: 14px 18px;
        }

        .message {
          margin-top: 16px;
          padding: 12px 14px;
          background: #f1f5f9;
          border-radius: 14px;
          color: var(--text);
        }

        .back-link {
          margin-top: 18px;
        }

        .back-link a {
          color: #b45309;
          font-weight: 800;
        }

        .summary-title {
          font-weight: 900;
          font-size: 1.4rem;
          letter-spacing: -0.02em;
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

        .price-row,
        .total-row {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid var(--line);
        }

        .total-row {
          border-bottom: 0;
          margin-top: 6px;
          font-size: 1.1rem;
        }

        .total-row strong {
          font-size: 1.4rem;
          color: #b45309;
        }

        .summary-features {
          margin: 18px 0 0;
          padding-left: 18px;
          color: var(--text);
          line-height: 1.9;
        }

        @media (max-width: 1100px) {
          .checkout-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 720px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}