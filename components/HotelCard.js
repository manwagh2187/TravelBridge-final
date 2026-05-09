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

function parseImages(hotel) {
  try {
    if (hotel?.image) return [hotel.image];
    if (Array.isArray(hotel?.images)) return hotel.images.filter(Boolean);
    if (typeof hotel?.imagesJson === 'string') {
      const parsed = JSON.parse(hotel.imagesJson);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    }
  } catch {
    // ignore
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
  const images = parseImages(hotel);
  const heroImage = images[0] || '';

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

  return (
    <article
      className={`hotel-card ${selected ? 'selected' : ''}`}
      onClick={handleSelect}
      role="button"
      tabIndex={0}
    >
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