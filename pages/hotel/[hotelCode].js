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

function parseStarsFromValue(value) {
  const match = String(value || '').match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

function parseStars(hotelOrValue) {
  if (hotelOrValue && typeof hotelOrValue === 'object') {
    const candidates = [
      hotelOrValue?.categoryName,
      hotelOrValue?.cheapestRate?.categoryName,
      hotelOrValue?.rates?.[0]?.categoryName,
      hotelOrValue?.hotelCategoryName,
      hotelOrValue?.stars,
      hotelOrValue?.starRating,
    ];

    for (const value of candidates) {
      const stars = parseStarsFromValue(value);
      if (stars) return stars;
    }

    return 0;
  }

  return parseStarsFromValue(hotelOrValue);
}

function isBookable(rate) {
  const text = `${rate?.rateType || ''} ${rate?.paymentType || ''} ${rate?.packaging || ''}`.toUpperCase();
  return text.includes('BOOKABLE') || text.includes('AT_WEB') || text.includes('ROOM ONLY');
}

function buildAmenities(rows) {
  const set = new Set();
  rows.forEach((row) => {
    if (row.boardName) set.add(row.boardName);
    if (row.paymentType) set.add(row.paymentType);
    if (row.rateType) set.add(row.rateType);
  });
  return Array.from(set).slice(0, 6);
}

function parseImages(value) {
  try {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === 'string') {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    }
  } catch {
    // ignore
  }
  return [];
}

export default function HotelDetailsPage() {
  const router = useRouter();
  const { hotelCode, destination, checkIn, checkOut, guests } = router.query;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [storedHotel, setStoredHotel] = useState(null);
  const [activeTab, setActiveTab] = useState('rates');
  const [sortBy, setSortBy] = useState('price-asc');
  const [searchText, setSearchText] = useState('');
  const [expandedKey, setExpandedKey] = useState('');
  const [compare, setCompare] = useState([]);

  useEffect(() => {
    if (!router.isReady || !hotelCode) return;
    try {
      const raw = sessionStorage.getItem(`travelbridge-hotel-${hotelCode}`);
      if (raw) setStoredHotel(JSON.parse(raw));
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

        if (!res.ok) throw new Error(data?.error || 'Unable to load cache');

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
    const hotelImages = parseImages(storedHotel?.imagesJson || first.imagesJson);
    return {
      hotelCode: firstNonEmpty(storedHotel?.hotelCode, first.hotelCode, hotelCode),
      hotelName: firstNonEmpty(storedHotel?.hotelName, first.hotelName, 'Hotel details'),
      destinationName: firstNonEmpty(storedHotel?.destinationName, first.destinationName, destination),
      zoneName: firstNonEmpty(storedHotel?.zoneName, first.zoneName),
      categoryName: firstNonEmpty(storedHotel?.categoryName, first.categoryName),
      stars: parseStars(storedHotel || first),
      images: hotelImages,
      image: storedHotel?.image || first.image || hotelImages[0] || '',
    };
  }, [rows, storedHotel, hotelCode, destination]);

  const cheapest = useMemo(() => {
    if (!rows.length) return null;
    return [...rows].sort((a, b) => Number(a.net || 0) - Number(b.net || 0))[0];
  }, [rows]);

  const amenities = useMemo(() => buildAmenities(rows), [rows]);

  const filteredRows = useMemo(() => {
    let list = [...rows];

    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      list = list.filter((r) =>
        String(r.roomName || '').toLowerCase().includes(q) ||
        String(r.boardName || '').toLowerCase().includes(q) ||
        String(r.rateType || '').toLowerCase().includes(q) ||
        String(r.paymentType || '').toLowerCase().includes(q) ||
        String(r.rateKey || '').toLowerCase().includes(q)
      );
    }

    if (sortBy === 'price-desc') {
      list.sort((a, b) => Number(b.net || 0) - Number(a.net || 0));
    } else if (sortBy === 'room') {
      list.sort((a, b) => String(a.roomName || '').localeCompare(String(b.roomName || '')));
    } else {
      list.sort((a, b) => Number(a.net || 0) - Number(b.net || 0));
    }

    return list;
  }, [rows, searchText, sortBy]);

  const availableRates = filteredRows.filter(isBookable);
  const compareRows = compare
    .map((key) => filteredRows.find((r, idx) => `${r.rateKey || 'rate'}-${idx}` === key))
    .filter(Boolean)
    .slice(0, 3);

  const overviewItems = [
    { label: 'Hotel code', value: summary.hotelCode || hotelCode },
    { label: 'Location', value: summary.zoneName || summary.destinationName },
    { label: 'Category', value: summary.categoryName || (summary.stars ? `${summary.stars} STARS` : '-') },
    { label: 'Available rates', value: rows.length || 0 },
    { label: 'Bookable rates', value: availableRates.length || 0 },
    { label: 'Cheapest rate', value: cheapest ? `${cheapest.currency || 'INR'} ${formatPrice(cheapest.net)}` : '-' },
  ];

  function goToBooking(rate) {
    if (!rate?.rateKey) return;

    router.push({
      pathname: '/booking/checkout',
      query: {
        hotelCode: summary.hotelCode || hotelCode,
        hotelName: summary.hotelName,
        roomCode: rate.roomCode || '',
        rateKey: rate.rateKey || '',
        boardName: rate.boardName || '',
        destinationName: summary.destinationName,
        checkIn,
        checkOut,
        guests,
      },
    });
  }

  function toggleCompare(key) {
    setCompare((curr) => {
      if (curr.includes(key)) return curr.filter((k) => k !== key);
      if (curr.length >= 3) return curr;
      return [...curr, key];
    });
  }

  const galleryImages = summary.images.length ? summary.images : summary.image ? [summary.image] : [];

  return (
    <div className="tb-page">
      <section className="tb-hero tb-hero-details">
        <div className="container">
          <button className="btn btn-outline" onClick={() => router.back()} style={{ marginBottom: 20 }}>
            ← Back
          </button>

          <div className="hotel-hero-card">
            <div className="hotel-hero-main">
              <div className="hotel-hero-badge-row">
                <span className="hotel-hero-badge">{summary.categoryName || (summary.stars ? `${summary.stars} STARS` : 'Hotel')}</span>
                <span className="hotel-hero-badge soft">{availableRates.length} options</span>
              </div>

              <h1>{safeText(summary.hotelName, 'Hotel details')}</h1>
              <p className="hotel-hero-location">
                {safeText(summary.destinationName)}
                {summary.categoryName ? ` • ${summary.categoryName}` : ''}
              </p>

              <div className="hotel-hero-chips">
                {amenities.length ? amenities.map((item) => (
                  <span key={item} className="hotel-chip">{item}</span>
                )) : (
                  <span className="hotel-chip">No amenities loaded</span>
                )}
              </div>

              <div className="hotel-hero-facts">
                <div><strong>Hotel code:</strong> {summary.hotelCode || hotelCode}</div>
                <div><strong>Location:</strong> {summary.zoneName || summary.destinationName}</div>
                <div><strong>Cheapest:</strong> {cheapest ? `${cheapest.currency || 'INR'} ${formatPrice(cheapest.net)}` : '-'}</div>
              </div>
            </div>

            <div className="hotel-hero-side">
              <div className="hotel-map-card">
                {galleryImages[0] ? (
                  <img src={galleryImages[0]} alt={summary.hotelName} style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 14 }} />
                ) : (
                  <div className="map-pin">📍</div>
                )}
                <strong>Hotel images</strong>
                <span>{galleryImages.length ? `${galleryImages.length} image(s)` : 'No images found'}</span>
              </div>

              <div className="hotel-score-card">
                <div className="score-main">8.6</div>
                <div className="score-sub">Excellent</div>
                <div className="score-note">Based on available rates</div>
              </div>
            </div>
          </div>

          {galleryImages.length ? (
            <div className="detail-gallery-strip">
              {galleryImages.map((src, idx) => (
                <img key={`${src}-${idx}`} src={src} alt={`${summary.hotelName} ${idx + 1}`} />
              ))}
            </div>
          ) : null}

          <div className="hotel-details-card details-sticky">
            <div className="hotel-details-grid">
              {overviewItems.map((item) => (
                <div key={item.label} className="hotel-details-item">
                  <strong>{item.label}:</strong> <span>{safeText(item.value)}</span>
                </div>
              ))}
            </div>
          </div>

          {compareRows.length ? (
            <div className="hotel-rates-card" style={{ marginTop: 18 }}>
              <div className="hotel-rates-header">
                <h3>Compare selected rooms</h3>
                <div className="hotel-rates-meta">{compareRows.length} selected</div>
              </div>

              <div className="compare-grid">
                {compareRows.map((rate, idx) => {
                  const isCheapest = cheapest && Number(rate.net || 0) === Number(cheapest.net || 0);
                  const roomImages = parseImages(rate.imagesJson);
                  const roomImage = rate.roomImage || roomImages[0] || galleryImages[0] || '';

                  return (
                    <div key={`${rate.rateKey || 'compare'}-${idx}`} className={`compare-card ${isCheapest ? 'cheapest' : ''}`}>
                      {roomImage ? <img src={roomImage} alt={rate.roomName || 'Room'} style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 14 }} /> : null}
                      <strong>{safeText(rate.roomName, 'Room')}</strong>
                      <span>{safeText(rate.boardName, 'No board')}</span>
                      <div className="compare-price">
                        {rate.currency || 'INR'} {formatPrice(rate.net)}
                      </div>
                      <div className="hotel-rate-pill-row">
                        {rate.paymentType ? <span className="hotel-rate-pill">{rate.paymentType}</span> : null}
                        {rate.rateType ? <span className="hotel-rate-pill">{rate.rateType}</span> : null}
                      </div>
                      {isBookable(rate) ? (
                        <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => goToBooking(rate)}>
                          Book now
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="hotel-rates-card">
            <div className="hotel-rates-header">
              <h3>Available options</h3>
              <div className="hotel-rates-meta">
                {availableRates.length} bookable rooms
              </div>
            </div>

            <div className="details-tabs">
              <button className={`hotel-rate-pill ${activeTab === 'rates' ? 'active' : ''}`} onClick={() => setActiveTab('rates')}>
                Rates
              </button>
              <button className={`hotel-rate-pill ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                Overview
              </button>
              <button className={`hotel-rate-pill ${activeTab === 'policies' ? 'active' : ''}`} onClick={() => setActiveTab('policies')}>
                Policies
              </button>
            </div>

            {activeTab === 'rates' ? (
              <>
                <div className="details-controls">
                  <input
                    className="sidebar-search"
                    placeholder="Search room / board / rate"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                  <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="price-asc">Price low to high</option>
                    <option value="price-desc">Price high to low</option>
                    <option value="room">Room name</option>
                  </select>
                </div>

                {loading ? <p>Loading hotel details...</p> : null}
                {error ? <div className="search-error">{error}</div> : null}

                <div className="hotel-rates-list">
                  {filteredRows.length ? (
                    filteredRows.map((rate, index) => {
                      const key = `${rate.rateKey || 'rate'}-${index}`;
                      const expanded = expandedKey === key;
                      const bookable = isBookable(rate);
                      const selected = compare.includes(key);
                      const isCheapest = cheapest && Number(rate.net || 0) === Number(cheapest.net || 0);
                      const roomImages = parseImages(rate.imagesJson);
                      const roomImage = rate.roomImage || roomImages[0] || galleryImages[0] || '';

                      return (
                        <div
                          key={key}
                          className={`hotel-rate-item ${bookable ? 'bookable' : ''} ${selected ? 'selected' : ''} ${isCheapest ? 'cheapest' : ''}`}
                        >
                          <div className="hotel-rate-topline">
                            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                              {roomImage ? (
                                <img src={roomImage} alt={rate.roomName || 'Room'} style={{ width: 120, height: 86, objectFit: 'cover', borderRadius: 12 }} />
                              ) : null}
                              <div>
                                <strong>{safeText(rate.roomName, 'Room')}</strong>
                                <span>{safeText(rate.boardName, 'No board')} • {safeText(rate.rateType, 'No type')}</span>
                              </div>
                            </div>
                            <div className="hotel-rate-price">
                              {rate.currency || 'INR'} {formatPrice(rate.net)}
                            </div>
                          </div>

                          <div className="hotel-rate-pill-row">
                            {rate.paymentType ? <span className="hotel-rate-pill">{rate.paymentType}</span> : null}
                            {rate.allotment ? <span className="hotel-rate-pill">Allotment: {rate.allotment}</span> : null}
                            {rate.packaging ? <span className="hotel-rate-pill">Packaging: {String(rate.packaging)}</span> : null}
                            {rate.cancellationAmount ? <span className="hotel-rate-pill">Cancel: {formatPrice(rate.cancellationAmount)}</span> : null}
                            {isCheapest ? <span className="hotel-rate-pill">Cheapest</span> : null}
                          </div>

                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                            <button
                              type="button"
                              className="btn btn-outline"
                              onClick={() => setExpandedKey(expanded ? '' : key)}
                            >
                              {expanded ? 'Hide details' : 'Show details'}
                            </button>

                            <button
                              type="button"
                              className={`btn ${selected ? 'btn-primary' : 'btn-outline'}`}
                              onClick={() => toggleCompare(key)}
                            >
                              {selected ? 'Remove compare' : 'Compare'}
                            </button>

                            {bookable ? (
                              <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => goToBooking(rate)}
                              >
                                Book now
                              </button>
                            ) : null}
                          </div>

                          {expanded ? (
                            <div style={{ marginTop: 12, display: 'grid', gap: 6, color: '#475569' }}>
                              <span>Rate key: {safeText(rate.rateKey)}</span>
                              <span>Room code: {safeText(rate.roomCode)}</span>
                              <span>Board code: {safeText(rate.boardCode)}</span>
                              <span>Adults: {safeText(rate.adults)}</span>
                              <span>Children: {safeText(rate.children)}</span>
                              <span>Cancellation from: {safeText(rate.cancellationFrom)}</span>
                            </div>
                          ) : null}
                        </div>
                      );
                    })
                  ) : (
                    <p>No matching rates found for this hotel.</p>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}