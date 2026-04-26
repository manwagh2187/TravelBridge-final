import Link from 'next/link';

export default function Custom500() {
  return (
    <div className="result-shell">
      <div className="container result-page">
        <div className="result-card">
          <div className="result-icon">500</div>
          <div className="result-badge">Server error</div>
          <h1>Something went wrong</h1>
          <p>
            We’re working to fix it. Please try again in a moment.
          </p>

          <Link href="/" className="btn btn-primary">Back to home</Link>
        </div>
      </div>
    </div>
  );
}