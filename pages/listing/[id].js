import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import useSWR from 'swr';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

import 'leaflet/dist/leaflet.css';

const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });

const fetcher = (url) => apiFetch(url).then((r) => r.json());

export default function ListingPage() {
  const router = useRouter();
  const { id, checkIn, checkOut, guests, destination } = router.query;
  const { isAuthenticated } = useAuth();

  const [activeImage, setActiveImage] = useState(0);
  const mapRef = useRef(null);

  const { data: hotelData } = useSWR(id ? `/api/hotels/${id}` : null, fetcher);
  const { data: roomData } = useSWR(id ? `/api/hotels/${id}/rooms` : null, fetcher);

  const hotel = hotelData || null;
  const rooms = Array.isArray(roomData) ? roomData : [];

  const images = useMemo(() => {
    if (!hotel) return [];
    if (Array.isArray(hotel.images)) return hotel.images;
    if (typeof hotel.imagesJson === 'string') {
      try {
        return JSON.parse(hotel.imagesJson) || [];
      } catch {
        return [];
      }
    }
    return [];
  }, [hotel]);

  const primaryRoom = rooms[0] || null;

  const mapCenter = useMemo(() => {
    if (typeof hotel?.latitude === 'number' && typeof hotel?.longitude === 'number') {
      return [hotel.latitude, hotel.longitude];
    }
    return hotel?.city === 'Mumbai' ? [19.076, 72.8777] : [20.5937, 78.9629];
  }, [hotel]);

  useEffect(() => {
    setActiveImage(0);
  }, [id]);

  function handleShowMap() {
    mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (!hotel) {
    return <div className="container page-load">Loading...</div>;
  }

  return (
    <div className="listing-shell">
      <div className="container listing-page">
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <span>{hotel.city}</span>
          <span>/</span>
          <span>{hotel.title}</span>
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
                <img src={images[activeImage]} alt={hotel.title} />
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
            <div className="sticky-price">₹{Number(hotel.minPrice || 0).toLocaleString()}</div>
            <div className="sticky-meta">per night • subject to availability</div>

            <ul className="sticky-benefits">
              <li>Free cancellation options</li>
              <li>Instant confirmation</li>
              <li>Secure payment flow</li>
            </ul>

            <button className="btn btn-outline full" type="button" onClick={handleShowMap}>
              View on map
            </button>

            {isAuthenticated ? (
              <Link
                href={`/booking/checkout?roomId=${primaryRoom?.supplierRoomId || primaryRoom?.id || ''}`}
                className="btn btn-primary full"
              >
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
            <div className="crumb-text">{hotel.city}, {hotel.country}</div>
            <h1>{hotel.title}</h1>
            <p>{hotel.description}</p>

            <div className="feature-row">
              <span>Free Wi-Fi</span>
              <span>Breakfast available</span>
              <span>Pay at property</span>
              <span>Pool access</span>
            </div>
          </div>

          <div className="score-card">
            <div className="score">{hotel.starRating || '8.9'}</div>
            <div>
              <strong>Excellent</strong>
              <div>Based on guest reviews</div>
            </div>
          </div>
        </div>

        <div className="content-grid">
          <div className="left">
            <div className="section-head">
              <div className="section-kicker">Rooms</div>
              <h2>Available rooms</h2>
              <p>Choose a room that suits your trip.</p>
            </div>

            {rooms.length ? (
              rooms.map((room) => (
                <div className="room-card" key={room.id || room.supplierRoomId}>
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
                      <Link href={`/booking/checkout?roomId=${room.id || room.supplierRoomId}`} className="btn btn-primary">
                        Select room
                      </Link>
                    ) : (
                      <Link href="/login" className="btn btn-primary">
                        Login to book
                      </Link>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-box">No rooms available for this property right now.</div>
            )}
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

            <div className="info-card highlight-card">
              <h3>Quick booking</h3>
              <p>Reserve the first available room in just a few steps.</p>
              {isAuthenticated && primaryRoom ? (
                <Link href={`/booking/checkout?roomId=${primaryRoom.id || primaryRoom.supplierRoomId}`} className="btn btn-primary full">
                  Book now
                </Link>
              ) : (
                <Link href="/login" className="btn btn-primary full">
                  Login to book
                </Link>
              )}
            </div>
          </aside>
        </div>

        <div className="map-section" ref={mapRef}>
          <div className="section-head">
            <div>
              <div className="section-kicker">Map view</div>
              <h2>{hotel.city} map</h2>
              <p>Use the map area to orient your stay and nearby context.</p>
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
                    {typeof hotel.latitude === 'number' && typeof hotel.longitude === 'number' ? (
                      <Marker position={[hotel.latitude, hotel.longitude]}>
                        <Popup>
                          <strong>{hotel.title}</strong>
                          <div>{hotel.city}, {hotel.country}</div>
                        </Popup>
                      </Marker>
                    ) : null}
                  </MapContainer>
                </div>

                <p className="map-note">
                  This map shows the property if coordinates are available.
                </p>

                <div className="map-fallback-note">
                  {hotel.city}, {hotel.country}
                </div>
              </div>
            </div>

            <aside className="map-list">
              <h3>Nearby stays</h3>
              {rooms.slice(0, 3).map((room) => (
                <button
                  key={room.id || room.supplierRoomId}
                  type="button"
                  className="map-item"
                  onClick={() => setActiveImage(0)}
                >
                  <strong>{room.title}</strong>
                  <span>{hotel.city}, {hotel.country}</span>
                </button>
              ))}

              {!rooms.length ? (
                <div className="map-empty">No nearby stays available for this destination.</div>
              ) : null}
            </aside>
          </div>
        </div>
      </div>

      <style jsx>{`
        .listing-shell {
          background: linear-gradient(180deg, #f5f1eb 0%, #efe8df 100%);
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
          color: #b45309;
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
          background: #fff7ed;
          color: #92400e;
          border: 1px solid #fde68a;
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
          background: linear-gradient(135deg, #fef3c7, #f8fafc);
          color: #b45309;
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
          outline: 3px solid #d97706;
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
          background: #fff7ed;
          color: #b45309;
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
          color: #b45309;
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
          background: #fff7ed;
          border: 1px solid #fde68a;
          font-weight: 700;
          color: #0f172a;
          font-size: 0.9rem;
        }

        .score-card {
          min-width: 220px;
          background: #fff7ed;
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
          background: #d97706;
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

        .room-card,
        .info-card,
        .empty-box {
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

        .highlight-card {
          background: linear-gradient(180deg, #fffaf3, #ffffff);
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

        .info-card p {
          color: var(--muted);
          line-height: 1.7;
          margin-top: 0;
        }

        .empty-box {
          padding: 18px;
          color: var(--muted);
        }

        .map-section {
          margin-top: 28px;
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

        .map-canvas {
          height: 420px;
          width: 100%;
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
          background: white;
          border: 1px solid #fde68a;
          border-radius: 999px;
          font-weight: 800;
          color: #92400e;
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
          .listing-hero,
          .content-grid,
          .map-layout {
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