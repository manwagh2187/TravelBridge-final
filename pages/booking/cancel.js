import Link from 'next/link';

export default function CancelPage() {
  return (
    <div className="result-shell">
      <div className="container result-page">
        <div className="result-card">
          <div className="result-icon cancel">×</div>
          <div className="result-badge">Payment cancelled</div>
          <h1>Your booking was not completed</h1>
          <p>
            No worries — you can return to the homepage and try again whenever you're ready.
          </p>

          <div className="action-row">
            <Link href="/" className="btn btn-primary">Back to home</Link>
            <Link href="/booking/bookings" className="btn btn-outline">View bookings</Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .result-shell {
          min-height: 100vh;
          background: linear-gradient(180deg, #f5f7fb 0%, #edf4ff 100%);
          display: grid;
          place-items: center;
          padding: 40px 0;
        }

        .result-card {
          width: min(720px, 100%);
          margin: 0 auto;
          background: white;
          border-radius: 32px;
          padding: 36px;
          box-shadow: var(--shadow);
          border: 1px solid rgba(226,232,240,0.85);
          text-align: center;
        }

        .result-icon {
          width: 72px;
          height: 72px;
          border-radius: 22px;
          display: grid;
          place-items: center;
          font-size: 2.2rem;
          font-weight: 900;
          margin: 0 auto 18px;
        }

        .result-icon.cancel {
          background: #fee2e2;
          color: #991b1b;
        }

        .result-badge {
          display: inline-flex;
          background: #eff6ff;
          color: var(--primary);
          padding: 8px 12px;
          border-radius: 999px;
          font-weight: 800;
          margin-bottom: 14px;
        }

        h1 {
          margin: 0 0 10px;
          font-size: 2.3rem;
          letter-spacing: -0.04em;
        }

        p {
          color: var(--muted);
          margin: 0 auto 24px;
          max-width: 56ch;
          line-height: 1.8;
        }

        .action-row {
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }
      `}</style>
    </div>
  );
}