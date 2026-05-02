import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import useSWR from 'swr';
import { apiFetch } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

const fetcher = (url) => apiFetch(url).then((r) => r.json());

function getListingImages(listing) {
  if (!listing) return [];
  if (Array.isArray(listing.images)) return listing.images;
  if (typeof listing.imagesJson === 'string') {
    try {
      const parsed = JSON.parse(listing.imagesJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function normalizeHotel(data) {
  if (!data) return null;
  return {
    id: data.id,
    title: data.title || data.name || 'Hotel',
    description: data.description || '',
    city: data.city || '',
    country: data.country || 'India',
    starRating: data.starRating ?? null,
    minPrice: data.minPrice ?? null,
    images: getListingImages(data),
  };
}

function normalizeRooms(data) {
  if (!Array.isArray(data)) return [];
  return data.map((room) => ({
    id: room.id || room.supplierRoomId,
    supplierRoomId: room.supplierRoomId || room.id,
    title: room.title || room.name || 'Room',
    capacity: room.capacity || room.guests || 2,
    inventory: room.inventory ?? room.available ?? 0,
    pricePerNight: room.pricePerNight ?? room.price ?? 0,
  }));
}

export default function ListingPage() {
  const router = useRouter();
  const { id, checkIn, checkOut, guests, destination } = router.query;
  const { isAuthenticated } = useAuth();

  const mapRef = useRef(null);
  const [activeImage, setActiveImage] = useState(0);

  const { data: hotelData } = useSWR(id ? `/api/hotels/${id}` : null, fetcher);
  const { data: roomData } = useSWR(id ? `/api/hotels/${id}/rooms` : null, fetcher);

  const hotel = useMemo(() => normalizeHotel(hotelData), [hotelData]);
  const rooms = useMemo(() => normalizeRooms(roomData), [roomData]);
  const images = hotel?.images || [];
  const primaryRoom = rooms[0] || null;

  useEffect(() => {
    setActiveImage(0);
  }, [id, images.length]);

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
            <div className="crumb-text">
              {hotel.city}, {hotel.country}
            </div>
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
              <div>
                <div className="section-kicker">Rooms</div>
                <h2>Available rooms</h2>
                <p>Choose a room that suits your trip.</p>
              </div>
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
                      <Link
                        href={`/booking/checkout?roomId=${room.id || room.supplierRoomId}`}
                        className="btn btn-primary"
                      >
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
              <div className="empty-box">
                <div className="empty-icon">🛏️</div>
                <strong>No rooms available right now.</strong>
                <p>Try again later or browse a different destination.</p>
              </div>
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
                <Link
                  href={`/booking/checkout?roomId=${primaryRoom.id || primaryRoom.supplierRoomId}`}
                  className="btn btn-primary full"
                >
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
                <div className="map-fallback-title">Interactive map coming soon</div>
                <div className="map-canvas-placeholder">
                  <div className="map-pin">●</div>
                  <div className="map-text">
                    {hotel.city}, {hotel.country}
                  </div>
                </div>
                <p>
                  We don’t have live map data for this property yet. Use the location details and nearby context to plan your stay.
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
                  <span>
                    {hotel.city}, {hotel.country}
                  </span>
                </button>
              ))}

              {!rooms.length ? <div className="map-empty">No nearby stays available for this destination.</div> : null}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}