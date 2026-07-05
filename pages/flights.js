import { useState } from 'react';

export default function FlightsPage() {
  const [form, setForm] = useState({
    originLocationCode: 'NYC',
    destinationLocationCode: 'LAX',
    departureDate: '',
    adults: 1
  });

  const [loading, setLoading] = useState(false);
  const [offers, setOffers] = useState([]);
  const [priced, setPriced] = useState(null);
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const search = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setPriced(null);
    setBooking(null);

    try {
      const qs = new URLSearchParams({
        originLocationCode: form.originLocationCode,
        destinationLocationCode: form.destinationLocationCode,
        departureDate: form.departureDate,
        adults: String(form.adults)
      });
      const res = await fetch(`/api/flights/search?${qs.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Search failed');
      setOffers(data?.data || []);
    } catch (err) {
      setError(err.message);
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  const priceFirst = async () => {
    setError('');
    setPriced(null);
    setBooking(null);

    try {
      if (!offers.length) throw new Error('No offers to price');

      const payload = {
        data: {
          type: 'flight-offers-pricing',
          flightOffers: [offers[0]]
        }
      };

      const res = await fetch('/api/flights/price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Pricing failed');
      setPriced(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const bookFirst = async () => {
    setError('');
    setBooking(null);

    try {
      if (!offers.length) throw new Error('No offers to book');

      const payload = {
        data: { flightOffers: [offers[0]] },
        travelers: [{ id: '1', travelerType: 'ADULT' }]
      };

      const res = await fetch('/api/flights/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Booking failed');
      setBooking(data);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <h1>Flights</h1>

      <form onSubmit={search} style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
        <input
          name="originLocationCode"
          value={form.originLocationCode}
          onChange={onChange}
          placeholder="Origin (e.g. NYC)"
          required
        />
        <input
          name="destinationLocationCode"
          value={form.destinationLocationCode}
          onChange={onChange}
          placeholder="Destination (e.g. LAX)"
          required
        />
        <input
          type="date"
          name="departureDate"
          value={form.departureDate}
          onChange={onChange}
          required
        />
        <input
          type="number"
          min="1"
          name="adults"
          value={form.adults}
          onChange={onChange}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Searching…' : 'Search Flights'}
        </button>
      </form>

      {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}

      <section style={{ marginBottom: 16 }}>
        <h2>Offers ({offers.length})</h2>
        {offers.slice(0, 3).map((offer, idx) => (
          <pre key={offer.id || idx} style={{ background: '#f6f6f6', padding: 12, overflowX: 'auto' }}>
            {JSON.stringify(offer, null, 2)}
          </pre>
        ))}
      </section>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <button onClick={priceFirst} disabled={!offers.length}>Price First Offer</button>
        <button onClick={bookFirst} disabled={!offers.length}>Book First Offer</button>
      </div>

      {priced ? (
        <section>
          <h2>Pricing Response</h2>
          <pre style={{ background: '#f6f6f6', padding: 12, overflowX: 'auto' }}>
            {JSON.stringify(priced, null, 2)}
          </pre>
        </section>
      ) : null}

      {booking ? (
        <section>
          <h2>Booking Response</h2>
          <pre style={{ background: '#f6f6f6', padding: 12, overflowX: 'auto' }}>
            {JSON.stringify(booking, null, 2)}
          </pre>
        </section>
      ) : null}
    </main>
  );
}