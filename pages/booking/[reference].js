import { useRouter } from 'next/router';
import useSWR from 'swr';

const getFetcher = (url) => fetch(url).then((r) => r.json());

export default function BookingDetailsPage() {
  const router = useRouter();
  const { reference } = router.query;

  const { data, isLoading } = useSWR(
    reference ? `/api/hotelbeds/booking/${reference}` : null,
    getFetcher
  );

  return (
    <div className="container section">
      <h1>Booking details</h1>

      {isLoading ? <p>Loading booking...</p> : null}

      <div className="info-card">
        <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(data, null, 2)}</pre>
      </div>
    </div>
  );
}