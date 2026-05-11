import { useEffect, useMemo, useState } from 'react';

function normalizeImageUrl(img) {
  if (!img) return '';
  const value = String(img).trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `https://photos.hotelbeds.com/giata/${value.replace(/^\/+/, '')}`;
}

function safeParseImages(value) {
  try {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(normalizeImageUrl).filter(Boolean);
    if (typeof value === 'string') {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(normalizeImageUrl).filter(Boolean);
    }
  } catch {
    // ignore
  }
  return [];
}

function getImages(hotel) {
  const candidates = [
    hotel?.imagesJson,
    hotel?.roomImagesJson,
    hotel?.image,
    hotel?.roomImage,
  ];

  for (const candidate of candidates) {
    const images = safeParseImages(candidate);
    if (images.length) return images;
  }

  return [];
}

export default function MapHotelCard({ hotel, selected = false, onSelect, destination }) {
  const images = useMemo(() => getImages(hotel), [hotel]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    setActive(0);
  }, [hotel?.hotelCode, images.length]);

  useEffect(() => {
    if (images.length <= 1) return undefined;
    const timer = setInterval(() => {
      setActive((i) => (i + 1) % images.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [images.length]);

  const activeImage = images[active] || images[0] || hotel?.image || hotel?.roomImage || '';

  return (
    <button
      type="button"
      className={`map-item ${selected ? 'active' : ''}`}
      onClick={onSelect}
    >
      {activeImage ? (
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <img
            src={activeImage}
            alt={hotel?.hotelName || 'Hotel'}
            style={{
              width: '100%',
              height: 110,
              objectFit: 'cover',
              borderRadius: 12,
            }}
          />

          {images.length > 1 ? (
            <>
              <button
                type="button"
                className="hotel-thumb-nav hotel-thumb-nav-prev"
                onClick={(e) => {
                  e.stopPropagation();
                  setActive((i) => (i - 1 + images.length) % images.length);
                }}
                aria-label="Previous image"
                style={{ left: 8, width: 28, height: 28, fontSize: '1.2rem' }}
              >
                ‹
              </button>
              <button
                type="button"
                className="hotel-thumb-nav hotel-thumb-nav-next"
                onClick={(e) => {
                  e.stopPropagation();
                  setActive((i) => (i + 1) % images.length);
                }}
                aria-label="Next image"
                style={{ right: 8, width: 28, height: 28, fontSize: '1.2rem' }}
              >
                ›
              </button>

              <div className="map-thumb-dots">
                {images.slice(0, 4).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`map-thumb-dot ${idx === active ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActive(idx);
                    }}
                    aria-label={`Image ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      <strong>{hotel?.hotelName || 'Unnamed hotel'}</strong>
      <span>{hotel?.cheapestRate?.roomName || 'Room'} • {hotel?.cheapestRate?.boardName || 'No board'}</span>
      <span>{hotel?.destinationName || hotel?.zoneName || destination}</span>
      <span className="mini-price">
        {hotel?.currency || 'INR'} {hotel?.minPrice || 0}
      </span>
    </button>
  );
}