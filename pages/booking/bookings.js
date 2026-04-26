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
    <div className="container bookings-page">
      <div className="page-card">
        <div className="badge">Trips</div>
        <h1>My bookings</h1>
        <p>Track your reservations and booking status.</p>

        {loading ? <div className="loading">Loading...</div> : null}
        {!loading && bookings.length === 0 ? <div className="empty">No bookings yet.</div> : null}

        <div className="booking-list">
          {bookings.map((b) => (
            <div key={b.id} className="booking-card">
              <div>
                <div className="booking-title">Booking #{b.id}</div>
                <div className="booking-meta">Status: {b.status}</div>
                <div className="booking-meta">
                  {new Date(b.startDate).toLocaleDateString()} → {new Date(b.endDate).toLocaleDateString()}
                </div>
              </div>
              <div className="booking-total">₹{Number(b.totalAmount || 0).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .bookings-page {
          padding: 28px 0 64px;
        }

        .page-card {
          background: white;
          border-radius: 28px;
          box-shadow: var(--shadow);
          border: 1px solid rgba(226,232,240,0.8);
          padding: 26px;
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

        .loading,
        .empty {
          margin-top: 14px;
          padding: 14px;
          border-radius: 14px;
          background: #f8fafc;
          color: var(--muted);
        }

        .booking-list {
          display: grid;
          gap: 14px;
          margin-top: 18px;
        }

        .booking-card {
          border: 1px solid var(--line);
          border-radius: 20px;
          padding: 18px;
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: center;
        }

        .booking-title {
          font-weight: 900;
          font-size: 1.1rem;
        }

        .booking-meta {
          color: var(--muted);
          margin-top: 4px;
        }

        .booking-total {
          font-weight: 900;
          font-size: 1.4rem;
        }

        @media (max-width: 720px) {
          .booking-card {
            flex-direction: column;
            align-items: start;
          }
        }
      `}</style>
    </div>
  );
}