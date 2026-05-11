import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';

function formatPrice(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0.00';
  return n.toFixed(2);
}

function parseStars(categoryName) {
  const match = String(categoryName || '').match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

function reviewLabel(stars) {
  if (stars >= 5) return 'Excellent';
  if (stars >= 4) return 'Very good';
  if (stars >= 3) return 'Good';
  return 'Rated';
}

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

function getHotelImages(hotel, cheapest) {
  const candidates = [
    hotel?.image,
    hotel?.imagesJson,
    hotel?.images,
    hotel?.roomImage,
    hotel?.roomImagesJson,
    cheapest?.image,
    cheapest?.imagesJson,
    cheapest?.images,
    cheapest?.roomImage,
    cheapest?.roomImagesJson,
  ];

  for (const candidate of candidates) {
    const images = safeParseImages(candidate);
    if (images.length) return images;
  }

  return [];
}

export default function HotelCard({ hotel, query, selected = false, onSelect }) {
  const router = useRouter();
  const cheapest = hotel?.cheapestRate || hotel?.rates?.[0] || hotel;
  const price = Number(hotel?.minPrice || cheapest?.net || 0);
  const currency = hotel?.currency || cheapest?.currency || 'INR';

  const hotelCode = hotel?.hotelCode || '';
  const title = hotel?.hotelName || 'Unnamed hotel';
  const location = hotel?.zoneName || hotel?.destinationName || '';
  const roomName = cheapest?.roomName || '';
  const boardName = cheapest?.boardName || '';
  const rateType = cheapest?.rateType || '';
  const rateCount = hotel?.rateCount || 0;
  const stars = parseStars(hotel?.categoryName);
  const reviewText = reviewLabel(stars);
  const initial = (title || 'H').charAt(0).toUpperCase();

  const images = useMemo(() => getHotelImages(hotel, cheapest), [hotel, cheapest]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const imageCount = images.length;
  const heroImage = images[activeImageIndex] || '';

  useEffect(() => {
    setActiveImageIndex(0);
  }, [hotelCode]);

  useEffect(() => {
    if (activeImageIndex >= imageCount) setActiveImageIndex(0);
  }, [activeImageIndex, imageCount]);

  useEffect(() => {
    if (imageCount <= 1) return undefined;
    const timer = setInterval(() => {
      setActiveImageIndex((idx) => (idx + 1) % imageCount);
    }, 4000);
    return () => clearInterval(timer);
  }, [imageCount]);

  function goToDetails(e) {
    e?.stopPropagation?.();

    try {
      sessionStorage.setItem(
        `travelbridge-hotel-${hotelCode}`,
        JSON.stringify({
          hotelCode,
          hotelName: title,
          destinationName: hotel?.destinationName || '',
          zoneName: hotel?.zoneName || '',
          categoryName: hotel?.categoryName || '',
          rates: hotel?.rates || [],
          image: heroImage,
          imagesJson: JSON.stringify(images),
          roomImage: hotel?.roomImage || '',
          roomImagesJson: hotel?.roomImagesJson || '[]',
        })
      );
    } catch {
      // ignore
    }

    router.push({
      pathname: `/hotel/${hotelCode}`,
      query: {
        ...query,
        hotelCode,
      },
    });
  }

  function handleSelect(e) {
    e?.stopPropagation?.();
    onSelect?.();
  }

  function prevImage(e) {
    e?.stopPropagation?.();
    if (!imageCount) return;
    setActiveImageIndex((idx) => (idx - 1 + imageCount) % imageCount);
  }

  function nextImage(e) {
    e?.stopPropagation?.();
    if (!imageCount) return;
    setActiveImageIndex((idx) => (idx + 1) % imageCount);
  }

  return (
    <article className={`hotel-card ${selected ? 'selected' : ''}`} onClick={handleSelect} role="button" tabIndex={0}>
      <div className="hotel-thumb">
        {heroImage ? (
          <img
            src={heroImage}
            alt={title}
            className="hotel-thumb-image"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : null}

        {imageCount > 1 ? (
          <>
            <button type="button" className="hotel-thumb-nav hotel-thumb-nav-prev" onClick={prevImage} aria-label="Previous image">
              ‹
            </button>
            <button type="button" className="hotel-thumb-nav hotel-thumb-nav-next" onClick={nextImage} aria-label="Next image">
              ›
            </button>

            <div className="hotel-thumb-dots">
              {images.slice(0, 6).map((src, idx) => (
                <button
                  key={`${src}-${idx}`}
                  type="button"
                  className={`hotel-thumb-dot ${idx === activeImageIndex ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex(idx);
                  }}
                  aria-label={`Show image ${idx + 1}`}
                />
              ))}
            </div>
          </>
        ) : null}

        <div className="hotel-thumb-badge">
          {stars ? `${stars} STAR${stars > 1 ? 'S' : ''}` : 'HOTEL'}
        </div>

        {!heroImage ? <div className="hotel-thumb-letter">{initial}</div> : null}
        <div className="hotel-thumb-score">{stars ? `${stars}.0` : '8.5'}</div>
      </div>

      <div className="hotel-body">
        <div className="hotel-topline">
          <div>
            <div className="hotel-title-row">
              <h3>{title}</h3>
              <span className="hotel-deal-label">Deal</span>
            </div>
            <p className="location">{location}</p>
            <div className="hotel-review-row">
              <span className="hotel-review-score">{reviewText}</span>
              <span className="hotel-review-meta">{rateCount || 1} rate{rateCount === 1 ? '' : 's'}</span>
              <span className="hotel-review-meta">{stars ? `${stars} stars` : 'Standard'}</span>
            </div>
          </div>

          <span className="rating">{hotel?.categoryName || ''}</span>
        </div>

        <div className="room-meta">
          {roomName ? <span>{roomName}</span> : null}
          {boardName ? <span>{boardName}</span> : null}
          {rateType ? <span>{rateType}</span> : null}
        </div>

        <div className="hotel-footer">
          <div className="hotel-price-box">
            <div className="price-label">From</div>
            <div className="price">
              {currency} {formatPrice(price)}
            </div>
            <div className="per-night">per stay</div>
          </div>

          <div className="hotel-footer-actions">
            <button type="button" className="btn btn-outline hotel-map-btn" onClick={handleSelect}>
              View on map
            </button>
            <button type="button" className="btn btn-primary" onClick={goToDetails}>
              View details
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}