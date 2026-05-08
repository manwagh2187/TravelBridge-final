import { useRouter } from 'next/router';

function formatPrice(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0.00';
  return n.toFixed(2);
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

  const initial = (title || 'H').charAt(0).toUpperCase();

  function goToDetails() {
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

  return (
    <article
      className={`hotel-card ${selected ? 'selected' : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
    >
      <div className="hotel-thumb">
        <div className="hotel-thumb-badge">{hotel?.categoryName || 'Hotel'}</div>
        <div className="hotel-thumb-letter">{initial}</div>
      </div>

      <div className="hotel-body">
        <div className="hotel-topline">
          <div>
            <h3>{title}</h3>
            <p className="location">{location}</p>
          </div>
          <span className="rating">{hotel?.categoryName || ''}</span>
        </div>

        <div className="room-meta">
          {roomName ? <span>{roomName}</span> : null}
          {boardName ? <span>{boardName}</span> : null}
          {rateType ? <span>{rateType}</span> : null}
          {rateCount ? <span>{rateCount} rates</span> : null}
        </div>

        <div className="hotel-footer">
          <div>
            <div className="price-label">From</div>
            <div className="price">
              {currency} {formatPrice(price)}
            </div>
            <div className="per-night">per stay</div>
          </div>

          <button type="button" className="btn btn-primary" onClick={goToDetails}>
            View details
          </button>
        </div>
      </div>
    </article>
  );
}