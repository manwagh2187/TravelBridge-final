import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';

function formatPrice(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0.00';
  return n.toFixed(2);
}

function safeText(value, fallback = '-') {
  const v = String(value || '').trim();
  return v || fallback;
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const text = String(value || '').trim();
    if (text) return text;
  }
  return '';
}

export default function HotelDetailsPage() {
  const router = useRouter();
  const { hotelCode, destination, checkIn, checkOut, guests } = router.query;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [storedHotel, setStoredHotel] = useState(null);

  useEffect(() => {
    if (!router.isReady) return;

    try {
      const raw = sessionStorage.getItem(`travelbridge-hotel-${hotelCode}`);
      if (raw) {
        setStoredHotel(JSON.parse(raw));
      }
    } catch {
      // ignore
    }
  }, [router.isReady, hotelCode]);

  useEffect(() => {
    if (!router.isReady) return;
    if (!hotelCode || !destination || !checkIn || !checkOut || !guests) return;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const res = await fetch(
          `/api/hotelbeds/cache?destination=${encodeURIComponent(destination)}&checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}&guests=${encodeURIComponent(guests)}`
        );
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || 'Unable to load cache');
        }

        const allRows = Array.isArray(data?.results) ? data.results : [];
        const hotelRows = allRows.filter((r) => String(r.hotelCode) === String(hotelCode));
        setRows(hotelRows);
      } catch (e) {
        setError(e.message || 'Failed to load hotel details');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [router.isReady, hotelCode, destination, checkIn, checkOut, guests]);

  const summary = useMemo(() => {
    const first = rows[0] || {};
    return {
      hotelCode: firstNonEmpty(storedHotel?.hotelCode, first.hotelCode, hotelCode),
      hotelName: firstNonEmpty(storedHotel?.hotelName, first.hotelName, storedHotel?.name, 'Hotel details'),
      destinationName: firstNonEmpty(storedHotel?.destinationName, first.destinationName, destination),
      zoneName: firstNonEmpty(storedHotel?.zoneName, first.zoneName),
      categoryName: firstNonEmpty(storedHotel?.categoryName, first.categoryName),
    };
  }, [rows, storedHotel, hotelCode, destination]);

  const cheapest = useMemo(() => {
    if (!rows.length) return null;
    return [...rows].sort((a, b) => Number(a.net || 0) - Number(b.net || 0))[0];
  }, [rows]);

  const displayRows = rows.length ? rows : storedHotel?.rates || [];

  return (
    <div className="tb-page">
      <section className="tb-hero tb-hero-details">
        <div className="container">
          <button className="btn btn-outline" onClick={() => router.back()} style={{ marginBottom: 20 }}>
            ← Back
          </button>

          <div className="details-header">
            <h1>{safeText(summary.hotelName, 'Hotel details')}</h1>
            <p>
              {safeText(summary.destinationName)}{' '}
              {summary.categoryName ? `• ${summary.categoryName}` : ''}
            </p>
          </div>

          <div className="side-card details-summary">
            <div className="details-grid">
              <div><strong>Hotel code:</strong> {safeText(summary.hotelCode || hotelCode)}</div>
              <div><strong>Location:</strong> {safeText(summary.zoneName || summary.destinationName)}</div>
              <div><strong>Category:</strong> {safeText(summary.categoryName)}</div>
              <div><strong>Available rates:</strong> {displayRows.length || 0}</div>
              <div>
                <strong>Cheapest rate:</strong>{' '}
                {cheapest ? `${cheapest.currency || 'INR'} ${formatPrice(cheapest.net)}` : '-'}
              </div>
            </div>
          </div>

          {loading ? <p style={{ marginTop: 20 }}>Loading hotel details...</p> : null}
          {error ? <div className="search-error" style={{ marginTop: 20 }}>{error}</div> : null}

          {!loading && !error ? (
            <div className="side-card" style={{ marginTop: 24 }}>
              <h3 style={{ marginTop: 0 }}>All rate rows</h3>
              <div className="hotel-list">
                {displayRows.length ? (
                  displayRows.map((rate, index) => (
                    <div
                      key={`${rate.rateKey || 'rate'}-${index}`}
                      className="map-item details-rate-item"
                      style={{ cursor: 'default' }}
                    >
                      <strong>{safeText(rate.roomName, 'Room')}</strong>
                      <span>
                        {safeText(rate.boardName, 'No board')} • {safeText(rate.rateType, 'No type')}
                      </span>
                      <span>
                        {rate.currency || 'INR'} {formatPrice(rate.net)}
                      </span>
                      <span>{safeText(rate.paymentType)}</span>
                      <span>{safeText(rate.cancellationFrom)}</span>
                    </div>
                  ))
                ) : (
                  <p>No matching rates found for this hotel.</p>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}