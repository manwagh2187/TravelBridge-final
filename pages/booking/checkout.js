import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';

export default function Checkout() {
  const router = useRouter();
  const { roomId, hotelId } = router.query;
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
        if (hotelId) {
          const roomRes = await apiFetch(`/api/hotels/${hotelId}/rooms`);
          const roomJson = await roomRes.json();

          if (roomRes.ok) {
            const roomList = Array.isArray(roomJson) ? roomJson : [];
            const foundRoom = roomList.find(
              (r) => String(r.id || r.supplierRoomId) === String(roomId)
            );

            if (foundRoom) setRoom(foundRoom);
          }

          const hotelRes = await apiFetch(`/api/hotels/${hotelId}`);
          const hotelJson = await hotelRes.json();
          if (hotelRes.ok) setHotel(hotelJson);
        }
      } catch (err) {
        console.error(err);
      }
    }

    load();
  }, [roomId, hotelId]);

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
          hotelId: hotelId || null,
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
            <div className="section-kicker">Secure checkout</div>
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
              <Link href={`/listing/${hotelId || ''}`}>Back to listing</Link>
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
          background: linear-gradient(180deg, #f5f1eb 0%, #efe8df 100%);
          min-height: 100vh;
          padding: 34px 0 70px;
        }

        .checkout-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.3fr) 420px;
          gap: 20px;
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

        .section-kicker {
          color: #d97706;
          font-weight: 900;
          text-transform: uppercase;
          font-size: 0.78rem;
          letter-spacing: 0.08em;
          margin-bottom: 10px;
        }

        h1 {
          margin: 0 0 10px;
          font-size: clamp(2rem, 4vw, 3.2rem);
          letter-spacing: -0.05em;
        }

        p {
          color: var(--muted);
          line-height: 1.8;
          margin: 0 0 22px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .field label {
          display: block;
          margin-bottom: 8px;
          font-weight: 800;
          color: #374151;
        }

        .field input,
        .field select {
          width: 100%;
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 14px 14px;
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

        .back-link {
          margin-top: 18px;
        }

        .back-link a {
          color: #b45309;
          font-weight: 800;
        }

        .summary-badge {
          display: inline-flex;
          background: #fff7ed;
          color: #b45309;
          padding: 8px 12px;
          border-radius: 999px;
          font-weight: 800;
          margin-bottom: 14px;
        }

        .summary-title {
          font-weight: 900;
          font-size: 1.5rem;
          letter-spacing: -0.03em;
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