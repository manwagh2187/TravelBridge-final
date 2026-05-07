import Link from 'next/link';

export default function HotelCard({ hotel, query }) {
  const rate = hotel?.bestRate;
  const price = rate?.net || '';
  const currency = 'INR';

  return (
    <article className="hotel-card">
      <div className="hotel-body">
        <div className="hotel-topline">
          <div>
            <h3>{hotel?.name || 'Unnamed hotel'}</h3>
            <p className="location">{hotel?.destinationName || hotel?.zoneName || ''}</p>
          </div>
          {hotel?.categoryName ? <span className="rating">{hotel.categoryName}</span> : null}
        </div>

        {rate ? (
          <div className="room-meta">
            <span>{rate.roomName}</span>
            <span>{rate.boardName}</span>
            <span>{rate.paymentType}</span>
          </div>
        ) : null}

        <div className="hotel-footer">
          <div>
            <div className="price-label">From</div>
            <div className="price">
              {currency} {price}
            </div>
            <div className="per-night">per stay</div>
          </div>

          <Link
            href={{
              pathname: `/hotel/${hotel.hotelCode}`,
              query: {
                ...query,
                hotelCode: hotel?.hotelCode || '',
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
            className="btn btn-primary"
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}