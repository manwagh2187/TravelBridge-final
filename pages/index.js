import { useMemo, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { apiFetch } from '../lib/api';

const fetcher = (url) => apiFetch(url).then(r => r.json());

const DESTINATIONS = [
  'Bangkok', 'Singapore', 'Dubai', 'Tokyo', 'Bali', 'London', 'Paris', 'New York'
];

export default function Home() {
  const [city, setCity] = useState('Bangkok');
  const [selectedSort, setSelectedSort] = useState('recommended');

  const { data } = useSWR(`/api/listings?city=${encodeURIComponent(city)}`, fetcher);
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

  return (
    <div>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">Find hotels, stays and deals</div>
            <h1>Book your next stay with a modern travel experience</h1>
            <p>
              Search top properties, compare room types, and complete booking in seconds.
            </p>

            <div className="search-panel">
              <div className="search-field">
                <label>Destination</label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Where are you going?"
                />
              </div>

              <div className="search-field">
                <label>Sort by</label>
                <select value={selectedSort} onChange={e => setSelectedSort(e.target.value)}>
                  <option value="recommended">Recommended</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="price-high">Price: high to low</option>
                </select>
              </div>

              <button className="btn btn-primary search-btn">
                Search
              </button>
            </div>

            <div className="chips">
              {DESTINATIONS.map((d) => (
                <button key={d} className={`chip ${d === city ? 'active' : ''}`} onClick={() => setCity(d)}>
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

      <section className="container section">
        <div className="section-head">
          <div>
            <h2>Stays in {city}</h2>
            <p>Modern hotel cards, room details, and booking flow.</p>
          </div>
          <div className="result-count">{sortedListings.length} properties</div>
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

            return (
              <article key={listing.id} className="hotel-card">
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

                  <div className="room-meta">
                    <span>{listing.rooms?.length || 0} room types</span>
                    <span>{firstRoom ? `${firstRoom.capacity} pax room` : 'No rooms'}</span>
                  </div>

                  <div className="hotel-footer">
                    <div>
                      <div className="price-label">From</div>
                      <div className="price">₹{price.toLocaleString()}</div>
                      <div className="per-night">per night</div>
                    </div>

                    <Link href={`/listing/${listing.id}`} className="btn btn-primary">
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

      <style jsx>{`
        .hero {
          background: radial-gradient(circle at top left, #dbeafe 0%, #f5f7fb 48%, #eef2ff 100%);
          padding: 56px 0 32px;
        }

        .hero-grid {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 24px;
          align-items: stretch;
        }

        .hero-copy {
          padding: 22px 0;
        }

        .eyebrow {
          display: inline-flex;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(37,99,235,0.10);
          color: var(--primary);
          font-weight: 800;
          margin-bottom: 18px;
        }

        h1 {
          font-size: clamp(2.4rem, 4vw, 4.6rem);
          line-height: 1;
          letter-spacing: -0.05em;
          margin: 0 0 16px;
          max-width: 11ch;
        }

        p {
          color: var(--muted);
          font-size: 1.05rem;
          line-height: 1.7;
          max-width: 720px;
        }

        .search-panel {
          margin-top: 26px;
          background: rgba(255,255,255,0.92);
          border: 1px solid rgba(226,232,240,0.9);
          border-radius: 28px;
          box-shadow: var(--shadow);
          padding: 18px;
          display: grid;
          grid-template-columns: 1.3fr 1fr auto;
          gap: 14px;
          align-items: end;
        }

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
        }

        .search-btn {
          height: 54px;
          padding-inline: 24px;
        }

        .chips {
          margin-top: 18px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .chip {
          border: 1px solid var(--line);
          background: white;
          padding: 10px 14px;
          border-radius: 999px;
          cursor: pointer;
          font-weight: 700;
          color: var(--muted);
        }

        .chip.active {
          background: #111827;
          color: white;
          border-color: #111827;
        }

        .hero-card {
          background: linear-gradient(180deg, #111827, #1f2937);
          color: white;
          border-radius: 30px;
          padding: 26px;
          box-shadow: var(--shadow);
          align-self: center;
        }

        .hero-card h3 {
          font-size: 1.8rem;
          margin: 16px 0 10px;
        }

        .hero-card p {
          color: rgba(255,255,255,0.75);
        }

        .hero-card-badge {
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
          background: rgba(255,255,255,0.08);
          padding: 14px;
          border-radius: 16px;
        }

        .hero-stats strong {
          display: block;
          font-size: 1.4rem;
          margin-bottom: 4px;
        }

        .hero-stats span {
          color: rgba(255,255,255,0.7);
          font-size: 0.92rem;
        }

        .section {
          padding: 34px 0 72px;
        }

        .section-head {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 18px;
        }

        .section-head h2 {
          margin: 0;
          font-size: 2rem;
        }

        .result-count {
          color: var(--muted);
          font-weight: 700;
        }

        .hotel-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 18px;
        }

        .hotel-card {
          background: white;
          border: 1px solid rgba(226,232,240,0.9);
          border-radius: 28px;
          overflow: hidden;
          box-shadow: var(--shadow);
          display: grid;
          grid-template-columns: 320px 1fr;
        }

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
          min-height: 280px;
          display: grid;
          place-items: center;
          font-weight: 900;
          color: #1d4ed8;
          background: linear-gradient(135deg, #dbeafe, #e0f2fe);
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

        .location {
          color: var(--primary);
          font-weight: 800;
        }

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
        }

        .hotel-body p {
          margin: 0;
          max-width: 70ch;
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
          font-size: 2rem;
          font-weight: 900;
          letter-spacing: -0.03em;
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

        @media (max-width: 920px) {
          .hero-grid,
          .hotel-card {
            grid-template-columns: 1fr;
          }

          .search-panel {
            grid-template-columns: 1fr;
          }

          .section-head,
          .hotel-footer {
            align-items: start;
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}