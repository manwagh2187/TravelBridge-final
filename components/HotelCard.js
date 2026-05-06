import Link from 'next/link';

export default function HotelCard({ hotel, query }) {
  const id = hotel?.id || hotel?.code || '';
  const name = hotel?.name || 'Unnamed hotel';
  const city = hotel?.city || '';
  const country = hotel?.country || '';
  const description = hotel?.description || '';
  const price = hotel?.price || 0;
  const currency = hotel?.currency || 'INR';

  return (
    <article className="hotel-card">
      <div className="hotel-body">
        <h3>{name}</h3>

        {city || country ? (
          <p className="hotel-location">
            {city}
            {city && country ? ', ' : ''}
            {country}
          </p>
        ) : null}

        {description ? <p className="hotel-description">{description}</p> : null}

        <div className="hotel-footer">
          <div>
            <div className="price-label">From</div>
            <div className="price">
              {currency} {price}
            </div>
          </div>

          <Link
            href={{
              pathname: `/hotel/${id}`,
              query,
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