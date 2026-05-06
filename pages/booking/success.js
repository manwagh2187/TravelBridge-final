import { useRouter } from 'next/router';

export default function SuccessPage() {
  const router = useRouter();
  const { reference, destination } = router.query;

  return (
    <div className="container section">
      <h1>Booking confirmed</h1>
      <p>Your booking has been successfully created.</p>

      <div className="info-card">
        <p><strong>Reference:</strong> {reference}</p>
        <p><strong>Destination:</strong> {destination}</p>
      </div>

      <button className="btn btn-outline" onClick={() => router.push('/')}>
        Back to home
      </button>
    </div>
  );
}