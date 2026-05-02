import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import useSWR from 'swr';
import { apiFetch } from '../lib/api';

import 'leaflet/dist/leaflet.css';

const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });

const fetcher = (url) => apiFetch(url).then((r) => r.json());

const DESTINATIONS = ['Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Hyderabad', 'Kolkata', 'Goa', 'Jaipur'];
const today = new Date().toISOString().split('T')[0];

export default function Home() {
  const resultsRef = useRef(null);
  const mapRef = useRef(null);

  const [destination, setDestination] = useState('Mumbai');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [selectedSort, setSelectedSort] = useState('recommended');
  const [searchError, setSearchError] = useState('');
  const [selectedListingId, setSelectedListingId] = useState(null);

  const isDateRangeInvalid = checkIn && checkOut ? new Date(checkOut) <= new Date(checkIn) : false;
  const isPartialDateSelection = Boolean(checkIn || checkOut) && !(checkIn && checkOut);

  const { data } = useSWR(`/api/hotels?country=India&city=${encodeURIComponent(destination)}`, fetcher);
  const listings = Array.isArray(data) ? data : [];

  const sortedListings = useMemo(() => {
    const arr = [...listings];
    if (selectedSort === 'price-low') arr.sort((a, b) => (a.minPrice || 0) - (b.minPrice || 0));
    else if (selectedSort === 'price-high') arr.sort((a, b) => (b.minPrice || 0) - (a.minPrice || 0));
    return arr;
  }, [listings, selectedSort]);

  const mapCenter = useMemo(() => {
    const firstWithCoords = sortedListings.find(
      (h) => typeof h.latitude === 'number' && typeof h.longitude === 'number'
    );
    if (firstWithCoords) return [firstWithCoords.latitude, firstWithCoords.longitude];
    return destination === 'Mumbai' ? [19.076, 72.8777] : [20.5937, 78.9629];
  }, [sortedListings, destination]);

  const activeListing = sortedListings.find((l) => l.id === selectedListingId) || null;

  useEffect(() => {
    if (selectedListingId && !sortedListings.some((l) => l.id === selectedListingId)) {
      setSelectedListingId(null);
    }
  }, [selectedListingId, sortedListings]);

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

  return (
    <div className="home-page">
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">Travel smarter, stay better</div>
            <h1>Find your perfect stay in India</h1>
            <p>
              Compare stays, explore deals, and book your next hotel in a cleaner, faster, more delightful way.
            </p>

            <div className="trust-strip">
              <div><strong>4.8/5</strong><span>Guest rating</span></div>
              <div><strong>500+</strong><span>Verified stays</span></div>
              <div><strong>24/7</strong><span>Support</span></div>
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
                    if (checkOut && nextCheckIn && checkOut <= nextCheckIn) setCheckOut('');
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

              <div className="search-field">
                <label>Sort by</label>
                <select value={selectedSort} onChange={(e) => setSelectedSort(e.target.value)}>
                  <option value="recommended">Recommended</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="price-high">Price: high to low</option>
                </select>
              </div>

              <button className="btn btn-primary search-btn" onClick={handleSearch} type="button" disabled={isDateRangeInvalid}>
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
              <div><strong>4.8/5</strong><span>Guest rating</span></div>
              <div><strong>24/7</strong><span>Support</span></div>
              <div><strong>500+</strong><span>Stays</span></div>
            </div>
          </div>
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
            let images = [];
            try {
              images = JSON.parse(listing.imagesJson || '[]');
            } catch {
              images = [];
            }

            const cover = images[0] || null;
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
                    <span>{listing.starRating ? `${listing.starRating} star` : 'No rating'}</span>
                    <span>Up to {guests} guests</span>
                  </div>

                  <div className="hotel-footer">
                    <div>
                      <div className="price-label">From</div>
                      <div className="price">₹{Number(listing.minPrice || 0).toLocaleString()}</div>
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
            No stays found. Try <strong>Mumbai</strong> or another Indian city.
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
            <div className="map-fallback">
              <div className="map-fallback-icon">📍</div>
              <div className="map-fallback-title">Interactive map</div>

              <div className="map-canvas">
                <MapContainer center={mapCenter} zoom={12} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {sortedListings
                    .filter((h) => typeof h.latitude === 'number' && typeof h.longitude === 'number')
                    .map((h) => (
                      <Marker key={h.id} position={[h.latitude, h.longitude]}>
                        <Popup>
                          <strong>{h.title}</strong>
                          <div>{h.city}, {h.country}</div>
                        </Popup>
                      </Marker>
                    ))}
                </MapContainer>
              </div>

              <p className="map-note">
                Hotels with location data are shown on the map. Click a hotel card to highlight it.
              </p>

              {activeListing ? (
                <div className="map-fallback-note active-note">
                  Selected: {activeListing.title}
                </div>
              ) : (
                <div className="map-fallback-note">{destination}</div>
              )}
            </div>
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

            {!sortedListings.length ? (
              <div className="map-empty">No nearby stays available for this destination.</div>
            ) : null}
          </aside>
        </div>
      </section>

      <style jsx>{`
        .home-page {
          background: linear-gradient(180deg, #f5f1eb 0%, #efe8df 100%);
        }

        .hero {
          padding: 44px 0 30px;
        }

        .hero-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.7fr) minmax(300px, 1fr);
          gap: 20px;
          align-items: start;
        }

        .eyebrow {
          font-weight: 800;
          color: #92400e;
          margin-bottom: 12px;
        }

        h1 {
          font-size: clamp(2.4rem, 4vw, 4.8rem);
          line-height: 1;
          letter-spacing: -0.06em;
          margin: 0 0 14px;
        }

        .hero-copy p {
          max-width: 760px;
          color: var(--muted);
          line-height: 1.8;
        }

        .trust-strip {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin: 20px 0;
        }

        .trust-strip div {
          background: white;
          border: 1px solid var(--line);
          border-radius: 18px;
          padding: 14px 16px;
          min-width: 120px;
        }

        .trust-strip strong {
          display: block;
          font-size: 1.2rem;
        }

        .trust-strip span {
          color: var(--muted);
          font-size: 0.92rem;
        }

        .search-panel {
          background: white;
          border: 1px solid var(--line);
          border-radius: 26px;
          padding: 16px;
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 0.8fr 0.9fr auto;
          gap: 12px;
          align-items: end;
          box-shadow: var(--shadow);
        }

        .search-field label {
          display: block;
          margin-bottom: 8px;
          font-weight: 700;
          color: var(--muted);
        }

        .search-field input,
        .search-field select {
          width: 100%;
          border: 1px solid var(--line);
          border-radius: 14px;
          padding: 14px 14px;
          background: white;
        }

        .search-btn {
          height: 50px;
          white-space: nowrap;
        }

        .chips {
          margin-top: 16px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .chip {
          border: 1px solid var(--line);
          background: white;
          border-radius: 999px;
          padding: 10px 14px;
          font-weight: 700;
          cursor: pointer;
        }

        .chip.active {
          background: #fff7ed;
          border-color: #f3c97a;
        }

        .hero-card {
          background: linear-gradient(180deg, #111827, #1f2937);
          color: white;
          border-radius: 28px;
          padding: 24px;
          box-shadow: var(--shadow);
        }

        .hero-card h3 {
          margin: 16px 0 10px;
          font-size: 1.8rem;
        }

        .hero-card p {
          color: rgba(255, 255, 255, 0.78);
          line-height: 1.7;
        }

        .hero-card-badge {
          display: inline-flex;
          background: rgba(255, 255, 255, 0.12);
          border-radius: 999px;
          padding: 8px 12px;
          font-weight: 800;
        }

        .hero-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 20px;
        }

        .hero-stats div {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 14px;
        }

        .hero-stats strong {
          display: block;
          font-size: 1.2rem;
        }

        .hero-stats span {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.92rem;
        }

        .section {
          padding: 30px 0 60px;
        }

        .section-head {
          display: flex;
          justify-content: space-between;
          align-items: end;
          gap: 16px;
          margin-bottom: 18px;
        }

        .section-kicker {
          color: #d97706;
          font-weight: 900;
          text-transform: uppercase;
          font-size: 0.78rem;
          letter-spacing: 0.08em;
          margin-bottom: 8px;
        }

        .section-head h2 {
          margin: 0;
          font-size: 2rem;
        }

        .section-head p {
          margin: 8px 0 0;
          color: var(--muted);
        }

        .results-actions {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .hotel-grid {
          display: grid;
          gap: 18px;
        }

        .hotel-card {
          display: grid;
          grid-template-columns: 320px 1fr;
          background: white;
          border: 1px solid var(--line);
          border-radius: 26px;
          overflow: hidden;
          box-shadow: var(--shadow);
          cursor: pointer;
        }

        .hotel-card.selected {
          outline: 3px solid rgba(217, 119, 6, 0.18);
        }

        .hotel-image {
          position: relative;
          background: #e2e8f0;
          min-height: 280px;
        }

        .hotel-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .placeholder {
          min-height: 280px;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          font-weight: 900;
          color: #92400e;
          font-size: 1.8rem;
        }

        .deal-badge {
          position: absolute;
          top: 14px;
          left: 14px;
          background: #ef4444;
          color: white;
          font-size: 0.78rem;
          font-weight: 900;
          padding: 7px 10px;
          border-radius: 999px;
        }

        .hotel-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 16px;
        }

        .hotel-topline {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
        }

        .location {
          font-weight: 800;
          color: #b45309;
        }

        .rating {
          background: #ecfeff;
          color: #0f766e;
          border-radius: 999px;
          padding: 7px 10px;
          font-weight: 800;
          font-size: 0.85rem;
        }

        .hotel-body h3 {
          margin: 0;
          font-size: 1.4rem;
        }

        .hotel-body p {
          margin: 0;
          color: var(--muted);
          line-height: 1.7;
        }

        .benefits {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .benefits span {
          border: 1px solid var(--line);
          background: #f8fafc;
          border-radius: 999px;
          padding: 7px 10px;
          font-weight: 700;
          font-size: 0.9rem;
        }

        .room-meta {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          color: var(--muted);
          font-weight: 700;
        }

        .hotel-footer {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: end;
        }

        .price-label {
          color: var(--muted);
          font-size: 0.9rem;
        }

        .price {
          font-size: 2rem;
          font-weight: 900;
          line-height: 1;
        }

        .per-night {
          color: var(--muted);
          font-size: 0.92rem;
        }

        .empty-state {
          margin-top: 20px;
          padding: 18px;
          background: white;
          border: 1px solid var(--line);
          border-radius: 20px;
          box-shadow: var(--shadow);
        }

        .map-section {
          padding-bottom: 70px;
        }

        .map-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.5fr) 320px;
          gap: 18px;
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

        .map-fallback {
          padding: 18px 18px 24px;
        }

        .map-fallback-icon {
          font-size: 2.5rem;
          margin-bottom: 8px;
        }

        .map-fallback-title {
          font-size: 1.4rem;
          font-weight: 900;
          margin-bottom: 12px;
          color: #92400e;
        }

        .map-canvas {
          height: 420px;
          border-radius: 22px;
          overflow: hidden;
          border: 1px solid var(--line);
          background: #f8fafc;
        }

        .map-note {
          margin: 14px 0 0;
          color: var(--muted);
          line-height: 1.7;
        }

        .map-fallback-note {
          margin-top: 12px;
          padding: 8px 12px;
          background: #fff7ed;
          border: 1px solid #fde68a;
          border-radius: 999px;
          font-weight: 800;
          color: #92400e;
          display: inline-flex;
        }

        .active-note {
          background: #ecfeff;
          border-color: #a5f3fc;
          color: #0f766e;
        }

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
        }

        .map-item strong {
          display: block;
          margin-bottom: 6px;
        }

        .map-item span {
          color: var(--muted);
          font-size: 0.95rem;
        }

        .map-empty {
          color: var(--muted);
          background: #f8fafc;
          border-radius: 16px;
          padding: 14px;
          border: 1px dashed var(--line);
        }

        @media (max-width: 1100px) {
          .hero-grid,
          .hotel-card,
          .map-layout {
            grid-template-columns: 1fr;
          }

          .search-panel {
            grid-template-columns: 1fr 1fr;
          }

          .search-btn {
            grid-column: span 2;
          }

          .hero-card {
            order: -1;
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
            flex-direction: column;
            align-items: start;
          }

          .hero-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}