import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';

export default function HotelDetailsPage() {
  const router = useRouter();
  const {
    hotelCode,
    hotelName,
    destinationName,
    categoryName,
    roomCode,
    rateKey,
    boardName,
    price,
    currency,
  } = router.query;

  const [selectedRateKey, setSelectedRateKey] = useState(rateKey || '');
  const [error, setError] = useState('');

  const displayHotelName = useMemo(() => hotelName || 'Hotel details', [hotelName]);

  function handleContinue() {
    setError('');

    if (!selectedRateKey) {
      setError('Please select a room rate first.');
      return;
    }

    router.push({
      pathname: '/booking/checkout',
      query: {
        hotelCode,
        rateKey: selectedRateKey,
        roomCode: roomCode || '',
        boardName: boardName || '',
      },
    });
  }

  return (
    <div className="container section">
      <button className="btn btn-outline" onClick={() => router.back()}>
        Back
      </button>

      <h1>{displayHotelName}</h1>
      {destinationName ? <p>{destinationName}</p> : null}
      {categoryName ? <p>{categoryName}</p> : null}
      {price ? (
        <p>
          {currency || 'INR'} {price}
        </p>
      ) : null}

      {error ? <div className="search-error">{error}</div> : null}

      <div className="info-card">
        <h3>Selected rate</h3>
        <input
          value={selectedRateKey}
          onChange={(e) => setSelectedRateKey(e.target.value)}
          placeholder="Rate key"
        />

        <button className="btn btn-primary" onClick={handleContinue}>
          Continue to booking
        </button>
      </div>
    </div>
  );
}