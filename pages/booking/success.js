import { useRouter } from 'next/router';

export default function SuccessPage() {
  const router = useRouter();
  const { reference, hotelCode } = router.query;

  return (
    <div className="container section">
      <h1>Booking confirmed</h1>
      <p>Your Hotelbeds booking has been created successfully.</p>

      <div className="info-card">
        <p>
          <strong>Reference:</strong> {reference || 'N/A'}
        </p>
        <p>
          <strong>Hotel Code:</strong> {hotelCode || 'N/A'}
        </p>
      </div>

      <button className="btn btn-outline" onClick={() => router.push('/')}>
        Back to home
      </button>
    </div>
  );
}