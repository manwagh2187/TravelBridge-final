import { useRouter } from 'next/router';
import useSWR from 'swr';
import Link from 'next/link';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

const fetcher = (url) => apiFetch(url).then(r => r.json());

export default function ListingPage() {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated } = useAuth();

  const { data } = useSWR(id ? '/api/listings' : null, fetcher);
  const listings = Array.isArray(data) ? data : [];
  const listing = listings.find(x => String(x.id) === String(id));

  if (!listing) return <div className="container page-load">Loading...</div>;

  const images = Array.isArray(listing.images)
    ? listing.images
    : typeof listing.images === 'string'
      ? (() => {
          try { return JSON.parse(listing.images); } catch { return []; }
        })()
      : [];

  const rooms = Array.isArray(listing.rooms) ? listing.rooms : [];

  return (
    <div className="container listing-page">
      <div className="gallery">
        <div className="main-image">
          {images[0] ? <img src={images[0]} alt={listing.title} /> : <div className="placeholder">TravelBridge</div>}
        </div>
        <div className="side-grid">
          {images.slice(1, 4).map((src, idx) => (
            <div className="thumb" key={idx}>
              <img src={src} alt="" />
            </div>
          ))}
        </div>
      </div>

      <div className="listing-header">
        <div>
          <div className="crumb">{listing.city}, {listing.country}</div>
          <h1>{listing.title}</h1>
          <p>{listing.description}</p>
        </div>

        <div className="header-card">
          <div className="score">8.9</div>
          <div>
            <strong>Excellent</strong>
            <div>TravelBridge rating</div>
          </div>
        </div>
      </div>

      <div className="content-grid">
        <div className="left">
          <h2>Available rooms</h2>

          {rooms.map(room => (
            <div className="room-card" key={room.id}>
              <div>
                <div className="room-title">{room.title}</div>
                <div className="room-meta">{room.capacity} guests · {room.inventory} available</div>
              </div>

              <div className="room-right">
                <div className="room-price">₹{Number(room.pricePerNight || 0).toLocaleString()}</div>
                <div className="room-night">per night</div>
                {isAuthenticated ? (
                  <Link href={`/booking/checkout?roomId=${room.id}`} className="btn btn-primary">
                    Book now
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
            <h3>Why book this stay?</h3>
            <ul>
              <li>Instant booking confirmation flow</li>
              <li>Secure JWT auth</li>
              <li>Stripe checkout support</li>
              <li>Prisma + PostgreSQL backend</li>
            </ul>
          </div>
        </aside>
      </div>

      <style jsx>{`
        .listing-page {
          padding: 28px 0 64px;
        }

        .gallery {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 16px;
        }

        .main-image {
          border-radius: 28px;
          overflow: hidden;
          min-height: 420px;
          background: white;
          box-shadow: var(--shadow);
        }

        .main-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
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

        .side-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .thumb {
          min-height: 202px;
          border-radius: 24px;
          overflow: hidden;
          background: white;
          box-shadow: var(--shadow);
        }

        .thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .listing-header {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: start;
          margin: 28px 0;
          padding: 24px;
          background: white;
          border-radius: 28px;
          box-shadow: var(--shadow);
        }

        .crumb {
          color: var(--primary);
          font-weight: 800;
          margin-bottom: 8px;
        }

        h1 {
          margin: 0 0 10px;
          font-size: 2.6rem;
        }

        p {
          color: var(--muted);
          line-height: 1.8;
          max-width: 72ch;
        }

        .header-card {
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
        }

        .content-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 18px;
        }

        .left h2 {
          margin: 0 0 16px;
        }

        .room-card,
        .info-card {
          background: white;
          border-radius: 24px;
          box-shadow: var(--shadow);
          border: 1px solid rgba(226,232,240,0.8);
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
        }

        .room-meta {
          color: var(--muted);
          margin-top: 6px;
        }

        .room-right {
          min-width: 170px;
          text-align: right;
        }

        .room-price {
          font-size: 1.8rem;
          font-weight: 900;
        }

        .room-night {
          color: var(--muted);
          margin-bottom: 10px;
        }

        .info-card {
          padding: 22px;
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

        @media (max-width: 920px) {
          .gallery,
          .content-grid {
            grid-template-columns: 1fr;
          }

          .listing-header {
            grid-template-columns: 1fr;
            display: grid;
          }

          .side-grid {
            grid-template-columns: 1fr 1fr;
          }

          .room-card {
            flex-direction: column;
            align-items: start;
          }

          .room-right {
            width: 100%;
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
}