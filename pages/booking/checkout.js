import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';

function shortText(value, max = 90) {
  const text = String(value || '').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max)}...`;
}

function upsertBooking(existing, booking) {
  const reference = String(booking.reference || '').trim();
  const filtered = existing.filter((b) => String(b.reference || '').trim() !== reference);
  return [booking, ...filtered];
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const text = String(value || '').trim();
    if (text) return text;
  }
  return '';
}

export default function CheckoutPage() {
  const router = useRouter();
  const {
    hotelCode,
    hotelName,
    roomCode,
    rateKey,
    boardName,
    destinationName,
    checkIn,
    checkOut,
    guests,
  } = router.query;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [storedBooking, setStoredBooking] = useState(null);

  useEffect(() => {
    if (!router.isReady) return;

    try {
      const raw = sessionStorage.getItem('travelbridge-checkout');
      if (raw) setStoredBooking(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, [router.isReady]);

  const normalized = useMemo(() => {
    return {
      hotelCode: firstNonEmpty(hotelCode, storedBooking?.hotelCode),
      hotelName: firstNonEmpty(hotelName, storedBooking?.hotelName, 'Hotel'),
      roomCode: firstNonEmpty(roomCode, storedBooking?.roomCode),
      rateKey: firstNonEmpty(rateKey, storedBooking?.rateKey),
      boardName: firstNonEmpty(boardName, storedBooking?.boardName),
      destinationName: firstNonEmpty(destinationName, storedBooking?.destinationName),
      checkIn: firstNonEmpty(checkIn, storedBooking?.checkIn),
      checkOut: firstNonEmpty(checkOut, storedBooking?.checkOut),
      guests: firstNonEmpty(guests, storedBooking?.guests, '2'),
    };
  }, [hotelCode, hotelName, roomCode, rateKey, boardName, destinationName, checkIn, checkOut, guests, storedBooking]);

  const nights = useMemo(() => {
    if (!normalized.checkIn || !normalized.checkOut) return 1;
    const a = new Date(normalized.checkIn);
    const b = new Date(normalized.checkOut);
    const diff = Math.round((b - a) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff || 1);
  }, [normalized.checkIn, normalized.checkOut]);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        'travelbridge-checkout',
        JSON.stringify({
          ...normalized,
          nights,
        })
      );
    } catch {
      // ignore
    }
  }, [normalized, nights]);

  async function handleBook() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/hotelbeds/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelCode: normalized.hotelCode,
          rateKey: normalized.rateKey,
          roomCode: normalized.roomCode,
          boardName: normalized.boardName,
          destinationName: normalized.destinationName,
          checkIn: normalized.checkIn,
          checkOut: normalized.checkOut,
          guests: normalized.guests,
          holder: {
            name: firstName,
            surname: lastName,
            email,
            phone,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Booking failed');
      }

      const reference =
        data?.booking?.reference ||
        data?.reference ||
        data?.bookingReference ||
        data?.clientReference ||
        'confirmed';

      const bookingRecord = {
        reference,
        hotelCode: normalized.hotelCode,
        hotelName: normalized.hotelName,
        roomCode: normalized.roomCode,
        rateKey: normalized.rateKey,
        boardName: normalized.boardName,
        destinationName: normalized.destinationName,
        checkIn: normalized.checkIn,
        checkOut: normalized.checkOut,
        guests: normalized.guests,
        holder: {
          name: firstName,
          surname: lastName,
          email,
          phone,
        },
        nights,
        createdAt: new Date().toISOString(),
      };

      try {
        const existing = JSON.parse(localStorage.getItem('travelbridge-bookings') || '[]');
        localStorage.setItem('travelbridge-bookings', JSON.stringify(upsertBooking(existing, bookingRecord)));
      } catch {
        // ignore storage issues
      }

      router.push({
        pathname: '/booking/confirmed',
        query: {
          ...bookingRecord,
        },
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="tb-page">
      <section className="tb-hero tb-hero-details">
        <div className="container">
          <button className="btn btn-outline" onClick={() => router.back()} style={{ marginBottom: 20 }}>
            ← Back
          </button>

          <div className="details-header">
            <h1>Checkout</h1>
            <p>{normalized.hotelName || 'Complete your booking'}</p>
          </div>

          <div className="booking-badge">
            {nights} night{nights > 1 ? 's' : ''} stay
          </div>

          <div className="booking-layout">
            <div className="hotel-details-card">
              <div className="hotel-details-grid">
                <div className="hotel-details-item"><strong>Hotel:</strong> <span>{normalized.hotelName || '-'}</span></div>
                <div className="hotel-details-item"><strong>Room:</strong> <span>{normalized.roomCode || '-'}</span></div>
                <div className="hotel-details-item"><strong>Board:</strong> <span>{normalized.boardName || '-'}</span></div>
                <div className="hotel-details-item"><strong>Destination:</strong> <span>{normalized.destinationName || '-'}</span></div>
                <div className="hotel-details-item"><strong>Stay:</strong> <span>{normalized.checkIn || '-'} → {normalized.checkOut || '-'}</span></div>
                <div className="hotel-details-item"><strong>Guests:</strong> <span>{normalized.guests || '-'}</span></div>
                <div className="hotel-details-item">
                  <strong>Rate key:</strong>
                  <span title={String(normalized.rateKey || '')}>{shortText(normalized.rateKey, 80) || '-'}</span>
                </div>
              </div>
            </div>

            <div className="checkout-summary-card">
              <div className="checkout-summary-title">Booking summary</div>
              <div className="checkout-summary-hotel">{normalized.hotelName || '-'}</div>
              <div className="checkout-summary-meta">{normalized.destinationName || '-'}</div>
              <div className="checkout-summary-pill">{nights} night{nights > 1 ? 's' : ''}</div>
              <button className="btn btn-primary checkout-book-btn" onClick={handleBook} disabled={loading}>
                {loading ? 'Booking...' : 'Confirm booking'}
              </button>
              {error ? <div className="search-error" style={{ marginTop: 12 }}>{error}</div> : null}
            </div>
          </div>

          <div className="hotel-rates-card" style={{ marginTop: 18 }}>
            <div className="hotel-rates-header">
              <h3>Guest details</h3>
              <div className="hotel-rates-meta">Enter your contact information</div>
            </div>

            <div className="booking-form booking-form-grid">
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" />
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}