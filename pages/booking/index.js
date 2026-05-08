import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function MyBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem('travelbridge-bookings') || '[]');
      setBookings(Array.isArray(data) ? data : []);
    } catch {
      setBookings([]);
    }
  }, []);

  return (
    <div className="tb-page">
      <section className="tb-hero tb-hero-details">
        <div className="container">
          <button className="btn btn-outline" onClick={() => router.back()} style={{ marginBottom: 20 }}>
            ← Back
          </button>

          <div className="details-header">
            <h1>My bookings</h1>
            <p>Your saved booking requests</p>
          </div>

          <div className="hotel-rates-card">
            <div className="hotel-rates-list">
              {bookings.length ? (
                bookings.map((b, idx) => (
                  <div key={`${b.rateKey || 'booking'}-${idx}`} className="hotel-rate-item">
                    <strong>{b.hotelName || 'Hotel'}</strong>
                    <span>{b.destinationName || '-'}</span>
                    <span>{b.roomCode || '-'}</span>
                    <span>{b.checkIn || '-'} → {b.checkOut || '-'}</span>
                    <span>{b.travellerName || '-'}</span>
                  </div>
                ))
              ) : (
                <p>No bookings yet.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}