import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/api';

export default function BookingsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    (async () => {
      setLoading(true);
      const res = await apiFetch('/api/bookings');
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
      setLoading(false);
    })();
  }, [isAuthenticated, router]);

  return (
    <div className="bookings-shell">
      <div className="container bookings-page">
        <div className="page-head">
          <div className="section-kicker">Trips</div>
          <h1>My bookings</h1>
          <p>Track your reservations and booking status.</p>
        </div>

        {loading ? <div className="state-box">Loading...</div> : null}
        {!loading && bookings.length === 0 ? <div className="state-box">No bookings yet.</div> : null}

        <div className="booking-list">
          {bookings.map((b) => (
            <div key={b.id} className="booking-card">
              <div className="booking-main">
                <div className="booking-top">
                  <div className="booking-title">Booking #{b.id}</div>
                  <span className={`status status-${b.status || 'pending'}`}>{b.status || 'pending'}</span>
                </div>

                <div className="booking-meta">
                  {b.startDate ? new Date(b.startDate).toLocaleDateString() : ''} →{' '}
                  {b.endDate ? new Date(b.endDate).toLocaleDateString() : ''}
                </div>

                <div className="booking-submeta">
                  {b.room?.title || b.room?.listing?.title || b.roomId || 'Room'} •{' '}
                  {b.roomId ? `Room ID: ${b.roomId}` : 'No room ID'}
                </div>
              </div>

              <div className="booking-side">
                <div className="booking-total">₹{Number(b.totalAmount || 0).toLocaleString()}</div>
                <div className="booking-note">Total amount</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .bookings-shell {
          background: linear-gradient(180deg, #f5f1eb 0%, #efe8df 100%);
          min-height: 100vh;
          padding: 34px 0 70px;
        }

        .page-head {
          margin-bottom: 18px;
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
          margin: 0;
        }

        .state-box {
          margin-top: 16px;
          padding: 16px;
          background: white;
          border: 1px solid rgba(226,232,240,0.85);
          border-radius: 18px;
          box-shadow: var(--shadow);
          color: var(--muted);
        }

        .booking-list {
          display: grid;
          gap: 14px;
          margin-top: 18px;
        }

        .booking-card {
          border: 1px solid rgba(226,232,240,0.85);
          border-radius: 24px;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: center;
          background: white;
          box-shadow: var(--shadow);
        }

        .booking-top {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 8px;
        }

        .booking-title {
          font-weight: 900;
          font-size: 1.15rem;
          letter-spacing: -0.02em;
        }

        .status {
          padding: 7px 10px;
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .status-confirmed {
          background: #dcfce7;
          color: #166534;
        }

        .status-pending {
          background: #fef3c7;
          color: #92400e;
        }

        .status-cancelled {
          background: #fee2e2;
          color: #991b1b;
        }

        .booking-meta,
        .booking-submeta {
          color: var(--muted);
          margin-top: 6px;
        }

        .booking-total {
          font-weight: 900;
          font-size: 1.6rem;
          letter-spacing: -0.03em;
          color: #b45309;
          text-align: right;
        }

        .booking-note {
          color: var(--muted);
          text-align: right;
          margin-top: 4px;
        }

        @media (max-width: 720px) {
          .booking-card {
            flex-direction: column;
            align-items: start;
          }

          .booking-side {
            width: 100%;
          }

          .booking-total,
          .booking-note {
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
}