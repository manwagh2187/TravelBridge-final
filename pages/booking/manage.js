import { useState } from 'react';

export default function ManageBookingPage() {
  const [reference, setReference] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadBooking() {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`/api/hotelbeds/booking/${reference}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load booking');
      }

      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function cancelBooking() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/hotelbeds/cancel/${reference}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel booking');
      }

      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container section">
      <h1>Manage booking</h1>

      <div className="info-card">
        <input
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Enter booking reference"
        />

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={loadBooking} disabled={loading || !reference}>
            Load booking
          </button>

          <button className="btn btn-outline" onClick={cancelBooking} disabled={loading || !reference}>
            Cancel booking
          </button>
        </div>

        {error ? <div className="search-error">{error}</div> : null}

        {result ? <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(result, null, 2)}</pre> : null}
      </div>
    </div>
  );
}