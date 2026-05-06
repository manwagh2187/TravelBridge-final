import { useRouter } from 'next/router';
import useSWR from 'swr';
import { useMemo, useState } from 'react';

const postFetcher = (url, body) =>
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then((r) => r.json());

export default function HotelDetailsPage() {
  const router = useRouter();
  const { id, checkIn, checkOut, guests, destination } = router.query;

  const [selectedRate, setSelectedRate] = useState(null);
  const [error, setError] = useState('');

  const checkRatesBody = useMemo(() => {
    if (!id || !checkIn || !checkOut) return null;

    return {
      hotelId: id,
      checkIn,
      checkOut,
      guests: Number(guests || 2),
    };
  }, [id, checkIn, checkOut, guests]);

  const { data, isLoading } = useSWR(
    checkRatesBody ? ['/api/hotelbeds/checkrates', checkRatesBody] : null,
    ([url, body]) => postFetcher(url, body)
  );

  const rates = Array.isArray(data?.rates) ? data.rates : data?.rates?.rate || [];
  const hotel = data?.hotel || data?.result || {};

  function handleContinue() {
    setError('');

    if (!selectedRate) {
      setError('Please select a room rate first.');
      return;
    }

    router.push({
      pathname: '/booking/checkout',
      query: {
        hotelId: id,
        checkIn,
        checkOut,
        guests,
        destination,
        rateKey: selectedRate.rateKey || selectedRate.key || '',
      },
    });
  }

  return (
    <div className="container section">
      <button className="btn btn-outline" onClick={() => router.back()}>
        Back
      </button>

      <h1>{hotel?.name || destination || 'Hotel details'}</h1>

      {isLoading ? <p>Loading rates...</p> : null}
      {error ? <div className="search-error">{error}</div> : null}

      <div className="info-card">
        <h3>Available rates</h3>

        {rates.length === 0 && !isLoading ? <p>No rates returned.</p> : null}

        <div className="rate-list">
          {rates.map((rate, idx) => (
            <label
              key={rate?.rateKey || idx}
              className={`rate-item ${selectedRate?.rateKey === rate?.rateKey ? 'active' : ''}`}
            >
              <input
                type="radio"
                name="rate"
                checked={selectedRate?.rateKey === rate?.rateKey}
                onChange={() => setSelectedRate(rate)}
              />

              <div>
                <strong>{rate?.roomName || rate?.name || `Room ${idx + 1}`}</strong>
                <p>{rate?.boardName || rate?.board || ''}</p>
                <p>
                  {rate?.price?.currency || 'INR'} {rate?.price?.amount || rate?.total || ''}
                </p>
              </div>
            </label>
          ))}
        </div>

        <button className="btn btn-primary" onClick={handleContinue}>
          Continue to booking
        </button>
      </div>
    </div>
  );
}