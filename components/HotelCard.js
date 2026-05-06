import Link from 'next/link';

export default function HotelCard({ hotel, query }) {
  return (
    <article className="hotel-card">
      <div className="hotel-body">
        <h3>{hotel.name}</h3>
        <p>{hotel.city}</p>
        <p>{hotel.description}</p>
        <div className="hotel-footer">
          <div>
            <div className="price-label">From</div>
            <div className="price">
              {hotel.currency} {hotel.price}
            </div>
          </div>
          <Link
            href={{
              pathname: `/hotel/${hotel.id}`,
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