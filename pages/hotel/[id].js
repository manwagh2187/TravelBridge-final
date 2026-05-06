import { useRouter } from 'next/router';
import useSWR from 'swr';

const postFetcher = (url, body) =>
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then((r) => r.json());

export default function HotelDetailsPage() {
  const router = useRouter();
  const { id, checkIn, checkOut, guests, destination } = router.query;

  const { data, isLoading } = useSWR(
    id && checkIn && checkOut ? ['/api/hotelbeds/checkrates', { hotelId: id, checkIn, checkOut, guests }] : null,
    ([url, body]) => postFetcher(url, body)
  );

  const rates = data?.rates || data?.data || data?.hotel || data || {};

  return (
    <div className="container section">
      <button className="btn btn-outline" onClick={() => router.back()}>
        Back
      </button>

      <h1>{destination || 'Hotel details'}</h1>

      {isLoading ? <p>Loading rates...</p> : null}

      <div className="info-card">
        <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(rates, null, 2)}</pre>
      </div>

      <button
        className="btn btn-primary"
        onClick={() =>
          router.push({
            pathname: '/booking/checkout',
            query: { id, checkIn, checkOut, guests, destination },
          })
        }
      >
        Continue booking
      </button>
    </div>
  );
}