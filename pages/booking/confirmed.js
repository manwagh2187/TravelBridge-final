import { useRouter } from 'next/router';

function shortText(value, max = 90) {
  const text = String(value || '').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max)}...`;
}

export default function BookingConfirmedPage() {
  const router = useRouter();
  const {
    hotelName,
    roomCode,
    rateKey,
    destinationName,
    checkIn,
    checkOut,
    holder,
    reference,
    guests,
  } = router.query;

  return (
    <div className="tb-page">
      <section className="tb-hero tb-hero-details">
        <div className="container">
          <div className="booking-confirm-hero">
            <div className="booking-confirm-icon">✓</div>
            <div>
              <h1>Booking confirmed</h1>
              <p>Your reservation request has been saved successfully.</p>
            </div>
          </div>

          <div className="booking-confirm-grid">
            <div className="booking-confirm-main">
              <div className="booking-confirm-card">
                <div className="booking-confirm-card-head">
                  <span className="booking-confirm-badge">Confirmed</span>
                  <span className="booking-confirm-ref">Ref: {reference || '-'}</span>
                </div>

                <h2>{hotelName || 'Your hotel booking'}</h2>
                <p className="booking-confirm-subtitle">
                  {destinationName || '-'} {guests ? `• ${guests} guests` : ''}
                </p>

                <div className="booking-confirm-details">
                  <div className="booking-confirm-item">
                    <strong>Stay dates</strong>
                    <span>{checkIn || '-'} → {checkOut || '-'}</span>
                  </div>
                  <div className="booking-confirm-item">
                    <strong>Room</strong>
                    <span>{roomCode || '-'}</span>
                  </div>
                  <div className="booking-confirm-item">
                    <strong>Traveller</strong>
                    <span>{holder?.name || '-'}</span>
                  </div>
                  <div className="booking-confirm-item">
                    <strong>Rate key</strong>
                    <span title={String(rateKey || '')}>{shortText(rateKey, 90) || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            <aside className="booking-confirm-sidebar">
              <div className="booking-summary-panel">
                <div className="booking-summary-title">Your booking</div>
                <div className="booking-summary-hotel">{hotelName || '-'}</div>
                <div className="booking-summary-meta">{destinationName || '-'}</div>

                <div className="booking-summary-line">
                  <span>Room</span>
                  <strong>{roomCode || '-'}</strong>
                </div>
                <div className="booking-summary-line">
                  <span>Check-in</span>
                  <strong>{checkIn || '-'}</strong>
                </div>
                <div className="booking-summary-line">
                  <span>Check-out</span>
                  <strong>{checkOut || '-'}</strong>
                </div>
                <div className="booking-summary-line">
                  <span>Guests</span>
                  <strong>{guests || '-'}</strong>
                </div>

                <button className="btn btn-primary booking-summary-btn" onClick={() => router.push('/bookings')}>
                  View my bookings
                </button>
              </div>

              <div className="booking-tip-card">
                <strong>What happens next?</strong>
                <p>We’ve stored your reservation request in your booking list. You can review it anytime.</p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}