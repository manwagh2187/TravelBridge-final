import Link from 'next/link';

export default function HotelCard({ hotel, query, selected = false, onSelect }) {
  const price = Number(hotel?.net || hotel?.price || 0);
  const currency = 'INR';

  const hotelCode = hotel?.hotelCode || '';
  const title = hotel?.hotelName || 'Unnamed hotel';
  const location = hotel?.zoneName || hotel?.destinationName || '';
  const roomName = hotel?.roomName || '';
  const boardName = hotel?.boardName || '';
  const rateType = hotel?.rateType || '';
  const cancellationFrom = hotel?.cancellationFrom || '';
  const cancellationAmount = hotel?.cancellationAmount || '';

  const initial = (title || 'H').charAt(0).toUpperCase();

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
        </div>

        <div className="hotel-footer">
          <div>
            <div className="price-label">From</div>
            <div className="price">
              {currency} {price}
            </div>
            <div className="per-night">
              {cancellationFrom ? `Cancel by ${cancellationFrom}` : 'per stay'}
            </div>
            {cancellationAmount ? (
              <div className="per-night">Cancellation amount: {cancellationAmount}</div>
            ) : null}
          </div>

          <Link
            href={{
              pathname: `/hotel/${hotelCode}`,
              query: {
                ...query,
                hotelCode,
                hotelName: title,
                destinationName: location,
                categoryName: hotel?.categoryName || '',
                roomCode: hotel?.roomCode || '',
                rateKey: hotel?.rateKey || '',
                boardName,
                price,
                currency,
              },
            }}
            className="btn btn-primary"
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}