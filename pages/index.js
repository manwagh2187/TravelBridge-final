import { useMemo, useState } from 'react';
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

export default function Home() {
  const [destination, setDestination] = useState('Bangkok');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [selectedSort, setSelectedSort] = useState('recommended');

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

  return (
    <div className="home-page">
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">Travel smarter, stay better</div>
            <h1>Find your perfect stay with a modern travel experience</h1>
            <p>
              Compare stays, explore deals, and book your next hotel in a cleaner, faster, more delightful way.
            </p>

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
                  onChange={(e) => setCheckIn(e.target.value)}
                />
              </div>

              <div className="search-field">
                <label>Check-out</label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
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

              <button className="btn btn-primary search-btn">
                Search
              </button>
            </div>

            <div className="chips">
              {DESTINATIONS.map((d) => (
                <button
                  key={d}
                  className={`chip ${d === destination ? 'active' : ''}`}
                  onClick={() => setDestination(d)}
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
              <div className="featured-badge">Limited time</div>
              <h3>{deal.title}</h3>
              <p>{deal.subtitle}</p>
              <button className="btn btn-outline">{deal.cta}</button>
            </div>
          ))}
        </div>
      </section>

      <section className="container section">
        <div className="section-head">
          <div>
            <div className="section-kicker">Explore</div>
            <h2>Stays in {destination}</h2>
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
        .home-page {
          background: linear-gradient(180deg, #f5f7fb 0%, #edf4ff 100%);
        }

        .hero {
          background:
            radial-gradient(circle at top left, rgba(37, 99, 235, 0.22), transparent 35%),
            radial-gradient(circle at top right, rgba(14, 165, 233, 0.18), transparent 28%),
            linear-gradient(135deg, #0f172a 0%, #1e293b 42%, #111827 100%);
          color: white;
          padding: 72px 0 42px;
          overflow: hidden;
        }

        .hero-grid {
          display: grid;
          grid-template-columns: 1.7fr 1fr;
          gap: 28px;
          align-items: stretch;
        }

        .hero-copy {
          padding: 18px 0;
        }

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
          font-size: clamp(2.8rem, 5vw, 5.3rem);
          line-height: 0.98;
          letter-spacing: -0.06em;
          margin: 0 0 16px;
          max-width: 11ch;
        }

        .hero-copy p {
          color: rgba(255,255,255,0.78);
          font-size: 1.05rem;
          line-height: 1.8;
          max-width: 760px;
        }

        .search-panel {
          margin-top: 28px;
          background: rgba(255,255,255,0.96);
          border: 1px solid rgba(226,232,240,0.85);
          border-radius: 30px;
          box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
          padding: 18px;
          display: grid;
          grid-template-columns: 1.5fr 1fr 1fr 0.8fr 0.9fr auto;
          gap: 12px;
          align-items: end;
          color: var(--text);
        }

        .search-wide {
          min-width: 0;
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
          white-space: nowrap;
        }

        .chips {
          margin-top: 18px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .chip {
          border: 1px solid rgba(255,255,255,0.18);
          background: rgba(255,255,255,0.08);
          padding: 10px 14px;
          border-radius: 999px;
          cursor: pointer;
          font-weight: 700;
          color: rgba(255,255,255,0.82);
          backdrop-filter: blur(12px);
        }

        .chip.active {
          background: white;
          color: #111827;
          border-color: white;
        }

        .hero-card {
          background: linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06));
          border: 1px solid rgba(255,255,255,0.14);
          color: white;
          border-radius: 30px;
          padding: 26px;
          box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
          align-self: center;
          backdrop-filter: blur(14px);
        }

        .hero-card h3 {
          font-size: 1.8rem;
          margin: 16px 0 10px;
        }

        .hero-card p {
          color: rgba(255,255,255,0.74);
        }

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

        .deals-section,
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

        .section-kicker {
          color: var(--primary);
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
          border-radius: 24px;
          padding: 22px;
          box-shadow: var(--shadow);
          border: 1px solid rgba(226,232,240,0.85);
        }

        .featured-card h3 {
          margin: 14px 0 8px;
          font-size: 1.3rem;
        }

        .featured-card p {
          color: var(--muted);
          margin: 0 0 18px;
        }

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
          min-height: 320px;
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

        .image-tag {
          position: absolute;
          bottom: 16px;
          left: 16px;
          background: rgba(15,23,42,0.8);
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
          .hero-grid {
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
        }
      `}</style>
    </div>
  );
}