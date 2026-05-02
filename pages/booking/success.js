import Link from 'next/link';

export default function SuccessPage() {
  return (
    <div className="result-shell">
      <div className="container result-page">
        <div className="result-card">
          <div className="result-icon success">✓</div>
          <div className="result-badge">Booking successful</div>
          <h1>Booking completed</h1>
          <p>Your reservation has been created successfully.</p>

          <div className="action-row">
            <Link href="/booking/bookings" className="btn btn-primary">View bookings</Link>
            <Link href="/" className="btn btn-outline">Back to home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}