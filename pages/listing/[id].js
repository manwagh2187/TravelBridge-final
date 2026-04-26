import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import useSWR from 'swr';
import Link from 'next/link';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

const fetcher = (url) => apiFetch(url).then(r => r.json());

export default function ListingPage() {
  const router = useRouter();
  const { id, checkIn, checkOut, guests, destination } = router.query;
  const { isAuthenticated } = useAuth();
  const [activeImage, setActiveImage] = useState(0);

  const { data } = useSWR('/api/listings', fetcher);
  const listings = Array.isArray(data) ? data : [];
  const listing = listings.find(x => String(x.id) === String(id));

  const images = useMemo(() => {
    if (!listing) return [];
    if (Array.isArray(listing.images)) return listing.images;
    if (typeof listing.images === 'string') {
      try {
        return JSON.parse(listing.images) || [];
      } catch {
        return [];
      }
    }
    return [];
  }, [listing]);

  const rooms = Array.isArray(listing?.rooms) ? listing.rooms : [];

  if (!listing) {
    return <div className="container page-load">Loading...</div>;
  }

  return (
    <div className="listing-shell">
      <div className="container listing-page">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span>{listing.city}</span>
          <span>/</span>
          <span>{listing.title}</span>
        </div>

        {(checkIn || checkOut || guests || destination) ? (
          <div className="search-context">
            {destination ? <span>{destination}</span> : null}
            {guests ? <span>{guests} guests</span> : null}
            {checkIn && checkOut ? <span>{checkIn} → {checkOut}</span> : null}
          </div>
        ) : null}

        <div className="listing-hero">
          <div className="gallery">
            <div className="main-image">
              {images[activeImage] ? (
                <img src={images[activeImage]} alt={listing.title} />
              ) : (
                <div className="placeholder">TravelBridge</div>
              )}
            </div>

            <div className="thumb-row">
              {images.slice(0, 4).map((src, idx) => (
                <button
                  key={idx}
                  className={`thumb ${idx === activeImage ? 'active' : ''}`}
                  onClick={() => setActiveImage(idx)}
                  type="button"
                >
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          </div>

          <aside className="sticky-card">
            <div className="sticky-badge">Great value</div>
            <h2>Book this stay</h2>
            <div className="sticky-price">
              ₹{Number(rooms[0]?.pricePerNight || 0).toLocaleString()}
            </div>
            <div className="sticky-meta">per night • subject to availability</div>

            <ul className="sticky-benefits">
              <li>Free cancellation options</li>
              <li>Instant confirmation</li>
              <li>Secure payment flow</li>
            </ul>

            {isAuthenticated ? (
              <Link href={`/booking/checkout?roomId=${rooms[0]?.id || ''}`} className="btn btn-primary full">
                Reserve now
              </Link>
            ) : (
              <Link href="/login" className="btn btn-primary full">
                Login to book
              </Link>
            )}
          </aside>
        </div>

        <div className="listing-header">
          <div>
            <div className="crumb-text">{listing.city}, {listing.country}</div>
            <h1>{listing.title}</h1>
            <p>{listing.description}</p>

            <div className="feature-row">
              <span>Free Wi-Fi</span>
              <span>Breakfast available</span>
              <span>Pay at property</span>
              <span>Pool access</span>
            </div>
          </div>

          <div className="score-card">
            <div className="score">8.9</div>
            <div>
              <strong>Excellent</strong>
              <div>Based on guest reviews</div>
            </div>
          </div>
        </div>

        <div className="content-grid">
          <div className="left">
            <div className="section-head">
              <h2>Available rooms</h2>
              <p>Choose a room that suits your trip.</p>
            </div>

            {rooms.map(room => (
              <div className="room-card" key={room.id}>
                <div className="room-main">
                  <div className="room-title">{room.title}</div>
                  <div className="room-meta">
                    {room.capacity} guests • {room.inventory} available • Instant confirmation
                  </div>
                  <div className="room-tags">
                    <span>Free cancellation</span>
                    <span>Breakfast option</span>
                    <span>Pay later</span>
                  </div>
                </div>

                <div className="room-right">
                  <div className="room-price">₹{Number(room.pricePerNight || 0).toLocaleString()}</div>
                  <div className="room-night">per night</div>
                  {isAuthenticated ? (
                    <Link href={`/booking/checkout?roomId=${room.id}`} className="btn btn-primary">
                      Select room
                    </Link>
                  ) : (
                    <Link href="/login" className="btn btn-primary">
                      Login to book
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          <aside className="right">
            <div className="info-card">
              <h3>Why book with TravelBridge?</h3>
              <ul>
                <li>Instant booking confirmation</li>
                <li>Simple secure checkout</li>
                <li>Transparent room pricing</li>
                <li>Reliable reservation flow</li>
              </ul>
            </div>

            <div className="info-card">
              <h3>Property highlights</h3>
              <ul>
                <li>Best location in city center</li>
                <li>Great for couples and families</li>
                <li>Popular with repeat guests</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>

      <style jsx>{`
        .listing-shell {
          background: linear-gradient(180deg, #f5f7fb 0%, #edf4ff 100%);
          min-height: 100vh;
          padding-bottom: 64px;
        }

        .listing-page {
          padding: 24px 0 0;
        }

        .breadcrumb {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          color: var(--muted);
          font-size: 0.95rem;
          margin-bottom: 18px;
        }

        .breadcrumb a {
          color: var(--primary);
          font-weight: 700;
        }

        .search-context {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 18px;
        }

        .search-context span {
          display: inline-flex;
          background: #eff6ff;
          color: var(--primary);
          border: 1px solid rgba(37, 99, 235, 0.12);
          padding: 8px 12px;
          border-radius: 999px;
          font-weight: 800;
          font-size: 0.9rem;
        }

        .listing-hero {
          display: grid;
          grid-template-columns: minmax(0, 1.7fr) 360px;
          gap: 18px;
          align-items: start;
          margin-bottom: 24px;
        }

        .gallery {
          background: white;
          padding: 16px;
          border-radius: 28px;
          box-shadow: var(--shadow);
          border: 1px solid rgba(226,232,240,0.85);
        }

        .main-image {
          border-radius: 22px;
          overflow: hidden;
          min-height: 420px;
          background: #e2e8f0;
        }

        .main-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .placeholder {
          min-height: 420px;
          display: grid;
          place-items: center;
          font-size: 2rem;
          font-weight: 900;
          background: linear-gradient(135deg, #dbeafe, #f8fafc);
          color: #1d4ed8;
        }

        .thumb-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-top: 12px;
        }

        .thumb {
          border: 0;
          padding: 0;
          border-radius: 16px;
          overflow: hidden;
          min-height: 88px;
          background: #e2e8f0;
          cursor: pointer;
          opacity: 0.88;
          transition: 0.2s ease;
        }

        .thumb.active {
          outline: 3px solid var(--primary);
          opacity: 1;
        }

        .thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .sticky-card {
          position: sticky;
          top: 92px;
          background: white;
          border-radius: 28px;
          padding: 22px;
          box-shadow: var(--shadow);
          border: 1px solid rgba(226,232,240,0.85);
        }

        .sticky-badge {
          display: inline-flex;
          background: #eff6ff;
          color: var(--primary);
          padding: 8px 12px;
          border-radius: 999px;
          font-weight: 800;
          margin-bottom: 12px;
        }

        .sticky-card h2 {
          margin: 0 0 10px;
          font-size: 1.6rem;
        }

        .sticky-price {
          font-size: 2.2rem;
          font-weight: 900;
          letter-spacing: -0.04em;
        }

        .sticky-meta {
          color: var(--muted);
          margin-top: 4px;
        }

        .sticky-benefits {
          margin: 18px 0 0;
          padding-left: 18px;
          color: var(--text);
          line-height: 1.9;
        }

        .full {
          width: 100%;
          margin-top: 18px;
        }

        .listing-header {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: start;
          margin: 0 0 22px;
          padding: 24px;
          background: white;
          border-radius: 28px;
          box-shadow: var(--shadow);
          border: 1px solid rgba(226,232,240,0.85);
        }

        .crumb-text {
          color: var(--primary);
          font-weight: 900;
          margin-bottom: 8px;
        }

        h1 {
          margin: 0 0 10px;
          font-size: 2.7rem;
          letter-spacing: -0.04em;
        }

        .listing-header p {
          color: var(--muted);
          line-height: 1.8;
          max-width: 72ch;
          margin: 0;
        }

        .feature-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 16px;
        }

        .feature-row span,
        .room-tags span {
          padding: 8px 12px;
          border-radius: 999px;
          background: #f8fafc;
          border: 1px solid var(--line);
          font-weight: 700;
          color: #0f172a;
          font-size: 0.9rem;
        }

        .score-card {
          min-width: 220px;
          background: #eff6ff;
          border-radius: 20px;
          padding: 16px;
          display: flex;
          gap: 14px;
          align-items: center;
        }

        .score {
          width: 54px;
          height: 54px;
          border-radius: 16px;
          background: #1d4ed8;
          color: white;
          display: grid;
          place-items: center;
          font-weight: 900;
          flex: 0 0 auto;
        }

        .content-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 320px;
          gap: 18px;
          align-items: start;
        }

        .section-head {
          margin-bottom: 16px;
        }

        .section-head h2 {
          margin: 0;
          font-size: 2rem;
        }

        .section-head p {
          margin: 8px 0 0;
          color: var(--muted);
        }

        .room-card,
        .info-card {
          background: white;
          border-radius: 24px;
          box-shadow: var(--shadow);
          border: 1px solid rgba(226,232,240,0.85);
        }

        .room-card {
          padding: 20px;
          display: flex;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 14px;
          align-items: center;
        }

        .room-title {
          font-size: 1.2rem;
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        .room-meta {
          color: var(--muted);
          margin-top: 6px;
        }

        .room-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 14px;
        }

        .room-right {
          min-width: 170px;
          text-align: right;
        }

        .room-price {
          font-size: 1.9rem;
          font-weight: 900;
          letter-spacing: -0.03em;
        }

        .room-night {
          color: var(--muted);
          margin-bottom: 10px;
        }

        .info-card {
          padding: 22px;
          margin-bottom: 16px;
        }

        .info-card h3 {
          margin-top: 0;
        }

        .info-card ul {
          margin: 0;
          padding-left: 18px;
          color: var(--muted);
          line-height: 2;
        }

        @media (max-width: 1100px) {
          .listing-hero,
          .content-grid {
            grid-template-columns: 1fr;
          }

          .sticky-card {
            position: static;
          }
        }

        @media (max-width: 720px) {
          .listing-header,
          .room-card {
            flex-direction: column;
            align-items: start;
          }

          .room-right {
            width: 100%;
            text-align: left;
          }

          .thumb-row {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}