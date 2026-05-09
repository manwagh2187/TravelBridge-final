import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';

function shortText(value, max = 90) {
  const text = String(value || '').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max)}...`;
}

function getHolderName(holder) {
  if (!holder) return '-';
  if (typeof holder === 'string') {
    try {
      const parsed = JSON.parse(holder);
      return parsed?.name || parsed?.fullName || '-';
    } catch {
      return holder || '-';
    }
  }
  return holder?.name || holder?.fullName || '-';
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const text = String(value || '').trim();
    if (text) return text;
  }
  return '';
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
    nights,
  } = router.query;

  const [storedBooking, setStoredBooking] = useState(null);

  useEffect(() => {
    if (!router.isReady) return;

    try {
      const raw = localStorage.getItem('travelbridge-bookings');
      const list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) return;

      const ref = String(reference || '').trim();
      const matched = list.find((b) => String(b.reference || '').trim() === ref);
      if (matched) setStoredBooking(matched);
    } catch {
      // ignore
    }
  }, [router.isReady, reference]);

  const normalized = useMemo(() => {
    return {
      hotelName: firstNonEmpty(storedBooking?.hotelName, hotelName, 'Your hotel booking'),
      roomCode: firstNonEmpty(storedBooking?.roomCode, roomCode),
      rateKey: firstNonEmpty(storedBooking?.rateKey, rateKey),
      destinationName: firstNonEmpty(storedBooking?.destinationName, destinationName),
      checkIn: firstNonEmpty(storedBooking?.checkIn, checkIn),
      checkOut: firstNonEmpty(storedBooking?.checkOut, checkOut),
      guests: firstNonEmpty(storedBooking?.guests, guests),
      nights: firstNonEmpty(storedBooking?.nights, nights, '1'),
      reference: firstNonEmpty(storedBooking?.reference, reference),
      holder: storedBooking?.holder || holder,
    };
  }, [storedBooking, hotelName, roomCode, rateKey, destinationName, checkIn, checkOut, guests, nights, reference, holder]);

  const travellerName = getHolderName(normalized.holder);

  return (
    <div className="tb-page">
      <section className="tb-hero tb-hero-details">
        <div className="container">
          <button className="btn btn-outline" onClick={() => router.push('/bookings')} style={{ marginBottom: 20 }}>
            ← My bookings
          </button>

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
                  <span className="booking-confirm-ref">Ref: {normalized.reference || '-'}</span>
                </div>

                <h2>{normalized.hotelName}</h2>
                <p className="booking-confirm-subtitle">
                  {normalized.destinationName || '-'} {normalized.guests ? `• ${normalized.guests} guests` : ''}
                </p>

                <div className="booking-confirm-details">
                  <div className="booking-confirm-item">
                    <strong>Stay dates</strong>
                    <span>{normalized.checkIn || '-'} → {normalized.checkOut || '-'}</span>
                  </div>
                  <div className="booking-confirm-item">
                    <strong>Room</strong>
                    <span>{normalized.roomCode || '-'}</span>
                  </div>
                  <div className="booking-confirm-item">
                    <strong>Traveller</strong>
                    <span>{travellerName}</span>
                  </div>
                  <div className="booking-confirm-item">
                    <strong>Rate key</strong>
                    <span title={String(normalized.rateKey || '')}>{shortText(normalized.rateKey, 90) || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            <aside className="booking-confirm-sidebar">
              <div className="booking-summary-panel">
                <div className="booking-summary-title">Your booking</div>
                <div className="booking-summary-hotel">{normalized.hotelName}</div>
                <div className="booking-summary-meta">{normalized.destinationName || '-'}</div>

                <div className="booking-summary-line">
                  <span>Room</span>
                  <strong>{normalized.roomCode || '-'}</strong>
                </div>
                <div className="booking-summary-line">
                  <span>Check-in</span>
                  <strong>{normalized.checkIn || '-'}</strong>
                </div>
                <div className="booking-summary-line">
                  <span>Check-out</span>
                  <strong>{normalized.checkOut || '-'}</strong>
                </div>
                <div className="booking-summary-line">
                  <span>Guests</span>
                  <strong>{normalized.guests || '-'}</strong>
                </div>
                <div className="booking-summary-line">
                  <span>Nights</span>
                  <strong>{normalized.nights || '-'}</strong>
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