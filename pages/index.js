import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { apiFetch } from '../lib/api';

const fetcher = (url) => apiFetch(url).then(r => r.json());

const DESTINATIONS = [
  'Bangkok', 'Singapore', 'Dubai', 'Tokyo', 'Bali', 'London', 'Paris', 'New York'
];

const FEATURED_DEALS = [
  {
    title: 'Weekend escapes',
    subtitle: 'Save more on short trips',
    cta: 'Explore deals',
  },
  {
    title: 'Luxury stays',
    subtitle: 'Premium rooms and suites',
    cta: 'View luxury',
  },
  {
    title: 'Family travel',
    subtitle: 'Spacious rooms for everyone',
    cta: 'See family options',
  },
];

const today = new Date().toISOString().split('T')[0];

export default function Home() {
  const resultsRef = useRef(null);
  const mapRef = useRef(null);

  const [destination, setDestination] = useState('Bangkok');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [selectedSort, setSelectedSort] = useState('recommended');
  const [searchError, setSearchError] = useState('');
  const [selectedListingId, setSelectedListingId] = useState(null);

  const isDateRangeInvalid =
    checkIn && checkOut ? new Date(checkOut) <= new Date(checkIn) : false;

  const isPartialDateSelection =
    Boolean(checkIn || checkOut) && !(checkIn && checkOut);

  const { data } = useSWR(
    `/api/listings?city=${encodeURIComponent(destination)}`,
    fetcher
  );

  const listings = Array.isArray(data) ? data : [];

  const sortedListings = useMemo(() => {
    const arr = [...listings];
    if (selectedSort === 'price-low') {
      arr.sort((a, b) => (a.rooms?.[0]?.pricePerNight || 0) - (b.rooms?.[0]?.pricePerNight || 0));
    } else if (selectedSort === 'price-high') {
      arr.sort((a, b) => (b.rooms?.[0]?.pricePerNight || 0) - (a.rooms?.[0]?.pricePerNight || 0));
    }
    return arr;
  }, [listings, selectedSort]);

  function handleSearch() {
    setSearchError('');

    if (isPartialDateSelection) {
      setSearchError('Please select both check-in and check-out dates.');
      return;
    }

    if (checkIn && checkOut) {
      const start = new Date(checkIn);
      const end = new Date(checkOut);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        setSearchError('Please enter valid dates.');
        return;
      }

      const normalizedStart = new Date(start);
      normalizedStart.setHours(0, 0, 0, 0);

      const normalizedEnd = new Date(end);
      normalizedEnd.setHours(0, 0, 0, 0);

      const normalizedToday = new Date();
      normalizedToday.setHours(0, 0, 0, 0);

      if (normalizedStart < normalizedToday) {
        setSearchError('Check-in cannot be in the past.');
        return;
      }

      if (normalizedEnd <= normalizedStart) {
        setSearchError('Check-out must be after check-in.');
        return;
      }
    }

    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleShowMap() {
    mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const hasMapFallback = !listings.length;

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-glow hero-glow-a" />
        <div className="hero-glow hero-glow-b" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">Travel smarter, stay better</div>
            <h1>Find your perfect stay with a modern travel experience</h1>
            <p>
              Compare stays, explore deals, and book your next hotel in a cleaner, faster, more delightful way.
            </p>

            <div className="trust-strip">
              <div>
                <strong>4.8/5</strong>
                <span>Guest rating</span>
              </div>
              <div>
                <strong>500+</strong>
                <span>Verified stays</span>
              </div>
              <div>
                <strong>24/7</strong>
                <span>Support</span>
              </div>
            </div>

            <div className="search-panel">
              <div className="search-field search-wide">
                <label>Destination</label>
                <input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Enter city or hotel"
                />
              </div>

              <div className="search-field">
                <label>Check-in</label>
                <input
                  type="date"
                  value={checkIn}
                  min={today}
                  onChange={(e) => {
                    const nextCheckIn = e.target.value;
                    setCheckIn(nextCheckIn);
                    if (checkOut && nextCheckIn && checkOut <= nextCheckIn) {
                      setCheckOut('');
                    }
                    if (searchError) setSearchError('');
                  }}
                />
              </div>

              <div className="search-field">
                <label>Check-out</label>
                <input
                  type="date"
                  value={checkOut}
                  min={checkIn || today}
                  onChange={(e) => {
                    setCheckOut(e.target.value);
                    if (searchError) setSearchError('');
                  }}
                  disabled={!checkIn}
                />
              </div>

              <div className="search-field">
                <label>Guests</label>
                <select value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
                  <option value={1}>1 guest</option>
                  <option value={2}>2 guests</option>
                  <option value={3}>3 guests</option>
                  <option value={4}>4 guests</option>
                  <option value={5}>5 guests</option>
                </select>
              </div>

              <div className="search-field sort-field">
                <label>Sort by</label>
                <select value={selectedSort} onChange={e => setSelectedSort(e.target.value)}>
                  <option value="recommended">Recommended</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="price-high">Price: high to low</option>
                </select>
              </div>

              <button
                className="btn btn-primary search-btn"
                onClick={handleSearch}
                type="button"
                disabled={isDateRangeInvalid}
              >
                Search
              </button>
            </div>

            {searchError ? <div className="search-error">{searchError}</div> : null}

            <div className="chips">
              {DESTINATIONS.map((d) => (
                <button
                  key={d}
                  className={`chip ${d === destination ? 'active' : ''}`}
                  onClick={() => setDestination(d)}
                  type="button"
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="hero-card">
            <div className="hero-card-badge">Best deals today</div>
            <h3>Save more when you book early</h3>
            <p>Trending destinations, clean rooms, and instant checkout flow.</p>

            <div className="hero-stats">
              <div>
                <strong>4.8/5</strong>
                <span>Guest rating</span>
              </div>
              <div>
                <strong>24/7</strong>
                <span>Support</span>
              </div>
              <div>
                <strong>500+</strong>
                <span>Stays</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container deals-section">
        <div className="section-head">
          <div>
            <div className="section-kicker">Featured</div>
            <h2>Top travel deals</h2>
          </div>
        </div>

        <div className="featured-grid">
          {FEATURED_DEALS.map((deal) => (
            <div key={deal.title} className="featured-card">
              <div className="featured-icon">{deal.title.charAt(0)}</div>
              <h3>{deal.title}</h3>
              <p>{deal.subtitle}</p>
              <button className="btn btn-outline" type="button">{deal.cta}</button>
            </div>
          ))}
        </div>
      </section>

      <section className="container section" ref={resultsRef}>
        <div className="section-head">
          <div>
            <div className="section-kicker">Explore</div>
            <h2>Stays in {destination}</h2>
            <p>Modern hotel cards, room details, and booking flow.</p>
          </div>

          <div className="results-actions">
            <div className="result-count">{sortedListings.length} properties</div>
            <button className="btn btn-outline map-btn" type="button" onClick={handleShowMap}>
              Show map
            </button>
          </div>
        </div>

        <div className="hotel-grid">
          {sortedListings.map((listing) => {
            const firstRoom = listing.rooms?.[0];
            const price = firstRoom?.pricePerNight || 0;
            const cover = Array.isArray(listing.images)
              ? listing.images[0]
              : typeof listing.images === 'string'
                ? (() => {
                    try { return JSON.parse(listing.images)?.[0]; } catch { return null; }
                  })()
                : null;

            const isSelected = selectedListingId === listing.id;

            return (
              <article
                key={listing.id}
                className={`hotel-card ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedListingId(listing.id);
                  mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                <div className="hotel-image">
                  {cover ? <img src={cover} alt={listing.title} /> : <div className="placeholder">TravelBridge</div>}
                  <div className="deal-badge">Deal</div>
                  <div className="image-tag">Popular</div>
                </div>

                <div className="hotel-body">
                  <div className="hotel-topline">
                    <div className="location">{listing.city}, {listing.country}</div>
                    <div className="rating">8.9 Excellent</div>
                  </div>

                  <h3>{listing.title}</h3>
                  <p>{listing.description}</p>

                  <div className="benefits">
                    <span>Free cancellation</span>
                    <span>Breakfast available</span>
                    <span>Pay at property</span>
                  </div>

                  <div className="room-meta">
                    <span>{listing.rooms?.length || 0} room types</span>
                    <span>{firstRoom ? `${firstRoom.capacity} pax room` : 'No rooms'}</span>
                    <span>Up to {guests} guests</span>
                  </div>

                  <div className="hotel-footer">
                    <div>
                      <div className="price-label">From</div>
                      <div className="price">₹{price.toLocaleString()}</div>
                      <div className="per-night">per night</div>
                    </div>

                    <Link
                      href={{
                        pathname: `/listing/${listing.id}`,
                        query: { checkIn, checkOut, guests, destination },
                      }}
                      className="btn btn-primary"
                    >
                      View deal
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {!sortedListings.length ? (
          <div className="empty-state">
            No stays found. Try <strong>Bangkok</strong> or seed more destinations.
          </div>
        ) : null}
      </section>

      <section className="container map-section" ref={mapRef}>
        <div className="section-head">
          <div>
            <div className="section-kicker">Map view</div>
            <h2>{destination} map</h2>
            <p>Click a property above to jump here.</p>
          </div>
        </div>

        <div className="map-layout">
          <div className="map-panel">
            {hasMapFallback ? (
              <div className="map-fallback">
                <div className="map-fallback-icon">📍</div>
                <div className="map-fallback-title">Map unavailable</div>
                <p>No live map data is available right now. Please use the nearby stays list below.</p>
                <div className="map-fallback-note">{destination}</div>
              </div>
            ) : (
              <div className="map-placeholder">
                <div className="map-city">{destination}</div>
                <div className="map-pin pin-1">Hotel A</div>
                <div className="map-pin pin-2">Hotel B</div>
                <div className="map-pin pin-3">Hotel C</div>
              </div>
            )}
          </div>

          <aside className="map-list">
            <h3>Nearby stays</h3>
            {sortedListings.slice(0, 3).map((listing) => (
              <button
                key={listing.id}
                type="button"
                className="map-item"
                onClick={() => setSelectedListingId(listing.id)}
              >
                <strong>{listing.title}</strong>
                <span>{listing.city}, {listing.country}</span>
              </button>
            ))}
          </aside>
        </div>
      </section>

      <style jsx>{`
        .home-page {
          background: linear-gradient(180deg, #f5f3ef 0%, #efe8df 100%);
        }

        .hero {
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(circle at 16% 20%, rgba(251, 191, 36, 0.22), transparent 28%),
            radial-gradient(circle at 84% 18%, rgba(168, 85, 247, 0.18), transparent 24%),
            radial-gradient(circle at 70% 78%, rgba(244, 114, 182, 0.10), transparent 22%),
            linear-gradient(135deg, #121212 0%, #18161f 45%, #101114 100%);
          color: white;
          padding: 84px 0 54px;
        }

        .hero-glow { position: absolute; border-radius: 999px; filter: blur(40px); pointer-events: none; opacity: 0.45; }
        .hero-glow-a { width: 280px; height: 280px; top: -60px; left: 2%; background: rgba(251, 191, 36, 0.38); }
        .hero-glow-b { width: 340px; height: 340px; right: -100px; top: 10px; background: rgba(168, 85, 247, 0.24); }

        .hero-grid {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-columns: 1.7fr 1fr;
          gap: 28px;
          align-items: stretch;
        }

        .hero-copy { padding: 18px 0; }

        .eyebrow {
          display: inline-flex;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(255,255,255,0.12);
          color: white;
          font-weight: 800;
          margin-bottom: 18px;
          backdrop-filter: blur(10px);
        }

        h1 {
          font-size: clamp(2.8rem, 4.8vw, 5.3rem);
          line-height: 0.95;
          letter-spacing: -0.07em;
          margin: 0 0 16px;
          max-width: 11ch;
        }

        .hero-copy p {
          color: rgba(255,255,255,0.78);
          font-size: 1.05rem;
          line-height: 1.8;
          max-width: 760px;
        }

        .trust-strip {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          margin-top: 22px;
        }

        .trust-strip div {
          min-width: 130px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.08);
          padding: 14px 16px;
          border-radius: 18px;
          backdrop-filter: blur(10px);
        }

        .trust-strip strong { display: block; font-size: 1.2rem; margin-bottom: 4px; }
        .trust-strip span { color: rgba(255,255,255,0.72); font-size: 0.9rem; }

        .search-panel {
          margin-top: 28px;
          background: rgba(255,255,255,0.98);
          border: 1px solid rgba(255,255,255,0.7);
          border-radius: 34px;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.24);
          padding: 20px;
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 0.8fr 0.9fr auto;
          gap: 12px;
          align-items: end;
          color: var(--text);
        }

        .search-wide { min-width: 0; }

        .search-field label {
          display: block;
          margin-bottom: 8px;
          font-size: 0.9rem;
          color: var(--muted);
          font-weight: 700;
        }

        .search-field input,
        .search-field select {
          width: 100%;
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 15px 16px;
          font-size: 1rem;
          outline: none;
          background: white;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .search-field input:focus,
        .search-field select:focus {
          border-color: rgba(245, 158, 11, 0.45);
          box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.08);
        }

        .search-btn {
          height: 54px;
          padding-inline: 24px;
          white-space: nowrap;
          box-shadow: 0 14px 30px rgba(217, 119, 6, 0.24);
          background: linear-gradient(135deg, #f59e0b, #f97316);
        }

        .chips {
          margin-top: 18px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .chip {
          border: 1px solid rgba(255,255,255,0.16);
          background: rgba(255,255,255,0.08);
          padding: 11px 15px;
          border-radius: 999px;
          cursor: pointer;
          font-weight: 700;
          color: rgba(255,255,255,0.84);
          backdrop-filter: blur(12px);
          transition: transform 0.2s ease, background 0.2s ease, color 0.2s ease;
        }

        .chip:hover { transform: translateY(-1px); }
        .chip.active { background: white; color: #111827; border-color: white; }

        .hero-card {
          background: linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.08));
          border: 1px solid rgba(255,255,255,0.16);
          color: white;
          border-radius: 30px;
          padding: 28px;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.22);
          align-self: center;
          backdrop-filter: blur(16px);
        }

        .hero-card h3 {
          font-size: 1.9rem;
          margin: 16px 0 10px;
          letter-spacing: -0.03em;
        }

        .hero-card p { color: rgba(255,255,255,0.76); line-height: 1.75; }

        .hero-card-badge,
        .featured-badge,
        .image-tag {
          display: inline-flex;
          background: rgba(255,255,255,0.12);
          padding: 8px 12px;
          border-radius: 999px;
          font-weight: 800;
        }

        .hero-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 28px;
        }

        .hero-stats div {
          background: rgba(255,255,255,0.07);
          padding: 14px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.08);
        }

        .hero-stats strong { display: block; font-size: 1.4rem; margin-bottom: 4px; }
        .hero-stats span { color: rgba(255,255,255,0.7); font-size: 0.92rem; }

        .deals-section,
        .section,
        .map-section {
          padding: 34px 0 72px;
        }

        .section-head {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 18px;
        }

        .results-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .section-kicker {
          color: #d97706;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 0.78rem;
          margin-bottom: 8px;
        }

        .section-head h2 {
          margin: 0;
          font-size: 2rem;
          letter-spacing: -0.03em;
        }

        .section-head p {
          margin: 8px 0 0;
          color: var(--muted);
        }

        .result-count {
          color: var(--muted);
          font-weight: 700;
        }

        .featured-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .featured-card {
          background: white;
          border-radius: 26px;
          padding: 24px;
          box-shadow: var(--shadow);
          border: 1px solid rgba(226,232,240,0.85);
          position: relative;
          overflow: hidden;
        }

        .featured-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(245,158,11,0.08), transparent 55%);
          pointer-events: none;
        }

        .featured-icon {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          color: #92400e;
          font-weight: 900;
          position: relative;
          z-index: 1;
        }

        .featured-card h3 {
          margin: 14px 0 8px;
          font-size: 1.3rem;
          position: relative;
          z-index: 1;
        }

        .featured-card p {
          color: var(--muted);
          margin: 0 0 18px;
          position: relative;
          z-index: 1;
        }

        .featured-card button { position: relative; z-index: 1; }

        .hotel-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 18px;
        }

        .hotel-card {
          background: white;
          border: 1px solid rgba(226,232,240,0.9);
          border-radius: 30px;
          overflow: hidden;
          box-shadow: var(--shadow);
          display: grid;
          grid-template-columns: 360px 1fr;
          cursor: pointer;
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
        }

        .hotel-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 24px 60px rgba(15, 23, 42, 0.16);
          border-color: rgba(245, 158, 11, 0.25);
        }

        .hotel-card.selected { outline: 3px solid rgba(217, 119, 6, 0.25); }

        .hotel-image {
          position: relative;
          min-height: 100%;
          background: #e2e8f0;
        }

        .hotel-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .placeholder {
          height: 100%;
          min-height: 320px;
          display: grid;
          place-items: center;
          font-weight: 900;
          color: #b45309;
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          font-size: 1.8rem;
        }

        .deal-badge {
          position: absolute;
          top: 16px;
          left: 16px;
          background: #ef4444;
          color: white;
          font-size: 0.78rem;
          font-weight: 900;
          padding: 7px 10px;
          border-radius: 999px;
        }

        .image-tag {
          position: absolute;
          bottom: 16px;
          left: 16px;
          background: rgba(15,23,42,0.85);
          color: white;
        }

        .hotel-body {
          padding: 22px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 18px;
        }

        .hotel-topline {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: center;
        }

        .location { color: #b45309; font-weight: 800; }

        .rating {
          padding: 8px 12px;
          background: #ecfeff;
          color: #0f766e;
          border-radius: 999px;
          font-weight: 800;
        }

        .hotel-body h3 {
          margin: 10px 0 8px;
          font-size: 1.5rem;
          letter-spacing: -0.02em;
        }

        .hotel-body p {
          margin: 0;
          max-width: 70ch;
          color: var(--muted);
          line-height: 1.7;
        }

        .benefits {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .benefits span {
          padding: 8px 12px;
          border-radius: 999px;
          background: #f8fafc;
          color: #0f172a;
          font-weight: 700;
          border: 1px solid var(--line);
          font-size: 0.9rem;
        }

        .room-meta {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          color: var(--muted);
          font-weight: 700;
        }

        .hotel-footer {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 20px;
          margin-top: 6px;
        }

        .price-label {
          font-size: 0.9rem;
          color: var(--muted);
        }

        .price {
          font-size: 2.1rem;
          font-weight: 900;
          letter-spacing: -0.03em;
          color: #0f172a;
        }

        .per-night {
          color: var(--muted);
          font-size: 0.92rem;
        }

        .empty-state {
          margin-top: 20px;
          background: white;
          border: 1px dashed var(--line);
          border-radius: 20px;
          padding: 20px;
          color: var(--muted);
        }

        .map-layout {
          display: grid;
          grid-template-columns: 1.5fr 0.8fr;
          gap: 16px;
          align-items: start;
        }

        .map-panel,
        .map-list {
          background: white;
          border-radius: 28px;
          box-shadow: var(--shadow);
          border: 1px solid rgba(226,232,240,0.85);
          overflow: hidden;
        }

        .map-placeholder {
          position: relative;
          min-height: 420px;
          background:
            radial-gradient(circle at center, rgba(245, 158, 11, 0.18), transparent 35%),
            linear-gradient(135deg, #fff7ed, #f8fafc);
          display: grid;
          place-items: center;
        }

        .map-fallback {
          min-height: 420px;
          display: grid;
          place-items: center;
          text-align: center;
          padding: 28px;
          background: linear-gradient(135deg, #fff7ed, #faf5ee);
        }

        .map-fallback-icon {
          font-size: 2.5rem;
          margin-bottom: 8px;
        }

        .map-fallback-title {
          font-size: 1.4rem;
          font-weight: 900;
          margin-bottom: 8px;
          color: #92400e;
        }

        .map-fallback p {
          margin: 0;
          max-width: 36ch;
          color: var(--muted);
          line-height: 1.7;
        }

        .map-fallback-note {
          margin-top: 12px;
          padding: 8px 12px;
          background: white;
          border: 1px solid #fde68a;
          border-radius: 999px;
          font-weight: 800;
          color: #92400e;
        }

        .map-city {
          font-size: 2.5rem;
          font-weight: 900;
          color: #b45309;
        }

        .map-pin {
          position: absolute;
          padding: 8px 12px;
          background: white;
          border-radius: 999px;
          box-shadow: var(--shadow);
          font-weight: 800;
        }

        .pin-1 { top: 24%; left: 22%; }
        .pin-2 { top: 44%; left: 58%; }
        .pin-3 { top: 68%; left: 35%; }

        .map-list {
          padding: 20px;
        }

        .map-list h3 {
          margin-top: 0;
        }

        .map-item {
          width: 100%;
          text-align: left;
          background: #fff7ed;
          border: 1px solid #fde68a;
          border-radius: 18px;
          padding: 14px;
          margin-bottom: 12px;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .map-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
        }

        .map-item strong {
          display: block;
          margin-bottom: 6px;
        }

        .map-item span {
          color: var(--muted);
          font-size: 0.95rem;
        }

        @media (max-width: 1100px) {
          .search-panel {
            grid-template-columns: 1fr 1fr;
          }

          .search-btn {
            grid-column: span 2;
          }

          .featured-grid {
            grid-template-columns: 1fr;
          }

          .hotel-card,
          .hero-grid,
          .map-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 720px) {
          .search-panel {
            grid-template-columns: 1fr;
          }

          .search-btn {
            grid-column: auto;
          }

          .section-head,
          .hotel-footer {
            align-items: start;
            flex-direction: column;
          }

          .hero {
            padding-top: 56px;
          }

          h1 {
            max-width: 10ch;
          }
        }
      `}</style>
    </div>
  );
}