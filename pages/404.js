import Link from 'next/link';

export default function Custom404() {
  return (
    <div className="result-shell">
      <div className="container result-page">
        <div className="result-card">
          <div className="result-icon">404</div>
          <div className="result-badge">Page not found</div>
          <h1>We couldn’t find that page</h1>
          <p>
            The page you're looking for doesn’t exist or has moved.
          </p>

          <Link href="/" className="btn btn-primary">Back to home</Link>
        </div>
      </div>
    </div>
  );
}