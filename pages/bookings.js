import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

function shortText(value, max = 90) {
  const text = String(value || '').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max)}...`;
}

function getStatus(b) {
  const hasReference = String(b?.reference || '').trim();
  if (!hasReference) return { label: 'Pending', type: 'pending' };
  return { label: 'Confirmed', type: 'success' };
}

function initials(name) {
  const text = String(name || '').trim();
  if (!text) return 'TB';
  return text
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function uniqueByReference(bookings) {
  const seen = new Set();
  return bookings.filter((b) => {
    const key =
      String(b.reference || '').trim() ||
      `${b.hotelName || ''}-${b.roomCode || ''}-${b.checkIn || ''}-${b.checkOut || ''}`;

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function BookingsPage() {
  const router = useRouter();
  const { loading, isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace('/login?next=/bookings');
      return;
    }

    try {
      const data = JSON.parse(localStorage.getItem('travelbridge-bookings') || '[]');
      setBookings(Array.isArray(data) ? data : []);
    } catch {
      setBookings([]);
    }
  }, [loading, isAuthenticated, router]);

  const uniqueBookings = useMemo(() => uniqueByReference(bookings), [bookings]);

  if (loading || !isAuthenticated) {
    return (
      <div className="tb-page">
        <section className="tb-hero tb-hero-details">
          <div className="container">
            <p>Loading...</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="tb-page">
      <section className="tb-hero tb-hero-details">
        <div className="container">
          <button className="btn btn-outline" onClick={() => router.push('/')} style={{ marginBottom: 20 }}>
            ← Back to home
          </button>

          <div className="details-header">
            <h1>My bookings</h1>
            <p>Manage your confirmed trips and reservation history</p>
          </div>

          {uniqueBookings.length ? (
            <div className="bookings-page-layout">
              <div className="bookings-list">
                {uniqueBookings.map((b, idx) => {
                  const status = getStatus(b);

                  return (
                    <article key={`${b.reference || 'booking'}-${idx}`} className="booking-card">
                      <div className="booking-thumb">
                        <div className="booking-thumb-badge">{initials(b.hotelName)}</div>
                        <div className="booking-thumb-overlay">
                          <div className="booking-thumb-title">{b.hotelName || 'Hotel'}</div>
                          <div className="booking-thumb-subtitle">{b.destinationName || '-'}</div>
                        </div>
                      </div>

                      <div className="booking-card-body">
                        <div className="booking-card-top">
                          <div>
                            <span className={`booking-status ${status.type}`}>{status.label}</span>
                            <h3>{b.hotelName || 'Hotel'}</h3>
                            <p>{b.destinationName || '-'}</p>
                          </div>

                          <div className="booking-ref-box">
                            <span>Reference</span>
                            <strong title={String(b.reference || '')}>{shortText(b.reference, 24) || '-'}</strong>
                          </div>
                        </div>

                        <div className="booking-meta-grid">
                          <div className="booking-meta-item">
                            <span>Room</span>
                            <strong>{b.roomCode || '-'}</strong>
                          </div>
                          <div className="booking-meta-item">
                            <span>Stay</span>
                            <strong>{b.checkIn || '-'} → {b.checkOut || '-'}</strong>
                          </div>
                          <div className="booking-meta-item">
                            <span>Traveller</span>
                            <strong>{b.holder?.name || '-'}</strong>
                          </div>
                          <div className="booking-meta-item">
                            <span>Guests</span>
                            <strong>{b.guests || '-'}</strong>
                          </div>
                        </div>

                        <div className="booking-card-tags">
                          <span>{b.boardName || 'No board'}</span>
                          <span>{b.nights || 1} night{Number(b.nights) > 1 ? 's' : ''}</span>
                          <span>{b.holder?.email || 'No email'}</span>
                        </div>

                        <div className="booking-card-footer">
                          <div className="booking-fineprint">
                            Saved on {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : '—'}
                          </div>

                          <button
                            className="btn btn-primary"
                            onClick={() =>
                              router.push({
                                pathname: '/booking/confirmed',
                                query: {
                                  hotelName: b.hotelName,
                                  roomCode: b.roomCode,
                                  rateKey: b.rateKey,
                                  destinationName: b.destinationName,
                                  checkIn: b.checkIn,
                                  checkOut: b.checkOut,
                                  holder: JSON.stringify(b.holder || {}),
                                  reference: b.reference,
                                  guests: b.guests,
                                  nights: b.nights,
                                },
                              })
                            }
                          >
                            View details
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="booking-empty-state">
              <div className="booking-empty-icon">🧳</div>
              <h2>No bookings yet</h2>
              <p>Your confirmed trips will appear here.</p>
              <button className="btn btn-primary" onClick={() => router.push('/')}>
                Explore hotels
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}