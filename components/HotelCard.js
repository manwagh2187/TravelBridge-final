import Link from 'next/link';

export default function HotelCard({ hotel, query, selected = false, onSelect }) {
  const rate = hotel?.bestRate;
  const price = hotel?.price || rate?.net || '';
  const currency = hotel?.currency || rate?.currency || 'INR';
  const initial = (hotel?.name || 'H').charAt(0).toUpperCase();
  const stars = hotel?.categoryName || 'Hotel';

  return (
    <article
      className={`tb-card ${selected ? 'selected' : ''}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
    >
      <div className="tb-card-image">
        <div className="tb-card-badge">{stars}</div>
        <div className="tb-card-letter">{initial}</div>
      </div>

      <div className="tb-card-body">
        <div className="tb-card-main">
          <h3>{hotel?.name || 'Unnamed hotel'}</h3>
          <p className="tb-card-location">{hotel?.destinationName || hotel?.zoneName || ''}</p>

          {rate ? (
            <div className="tb-card-tags">
              <span>{rate.roomName}</span>
              <span>{rate.boardName}</span>
              <span>{rate.paymentType}</span>
            </div>
          ) : null}
        </div>

        <div className="tb-card-side">
          <div className="tb-rating-box">
            <strong>{hotel?.categoryName || 'Hotel'}</strong>
            <span>{hotel?.country || ''}</span>
          </div>

          <div className="tb-price-box">
            <div className="tb-price-label">Per night</div>
            <div className="tb-price">
              {currency} {price}
            </div>
          </div>

          <Link
            href={{
              pathname: `/hotel/${hotel.hotelCode || hotel.id || ''}`,
              query: {
                ...query,
                hotelCode: hotel?.hotelCode || hotel?.id || '',
                hotelName: hotel?.name || '',
                destinationName: hotel?.destinationName || '',
                categoryName: hotel?.categoryName || '',
                roomCode: rate?.roomCode || '',
                rateKey: rate?.rateKey || '',
                boardName: rate?.boardName || '',
                price: price || '',
                currency,
              },
            }}
            className="btn btn-primary tb-card-btn"
          >
            View deal
          </Link>
        </div>
      </div>
    </article>
  );
}