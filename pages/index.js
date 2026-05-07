import { useMemo, useRef, useState } from 'react';
import useSWR from 'swr';
import HotelCard from '../components/HotelCard';

const DESTINATIONS = [
  'Mumbai',
  'Delhi',
  'Bengaluru',
  'Chennai',
  'Hyderabad',
  'Kolkata',
  'Goa',
  'Jaipur',
];

const DESTINATION_CODES = {
  Mumbai: 'MUM',
  Delhi: 'DEL',
  Bengaluru: 'BLR',
  Chennai: 'MAA',
  Hyderabad: 'HYD',
  Kolkata: 'CCU',
  Goa: 'GOI',
  Jaipur: 'JAI',
};

const today = new Date().toISOString().split('T')[0];

const postFetcher = (url, body) =>
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then((r) => r.json());

export default function Home() {
  const resultsRef = useRef(null);

  const [destination, setDestination] = useState('Mumbai');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [searchBody, setSearchBody] = useState(null);
  const [error, setError] = useState('');

  const query = useMemo(
    () => ({
      destination,
      checkIn,
      checkOut,
      guests,
    }),
    [destination, checkIn, checkOut, guests]
  );

  const { data, isLoading } = useSWR(
    searchBody ? ['/api/hotelbeds/search', searchBody] : null,
    ([url, body]) => postFetcher(url, body)
  );

  const hotels = Array.isArray(data?.results) ? data.results : [];
  const total = data?.total ?? hotels.length;
  const noResults = Boolean(searchBody) && !isLoading && total === 0;

  function handleSearch() {
    setError('');

    const destinationCode = DESTINATION_CODES[destination];
    if (!destinationCode) {
      setError('Unsupported destination. Please choose a supported city.');
      return;
    }

    if (!checkIn || !checkOut) {
      setError('Please select check-in and check-out dates.');
      return;
    }

    if (new Date(checkOut) <= new Date(checkIn)) {
      setError('Check-out must be after check-in.');
      return;
    }

    setSearchBody({
      stay: {
        checkIn,
        checkOut,
      },
      occupancies: [
        {
          rooms: 1,
          adults: guests,
          children: 0,
        },
      ],
      destination: {
        code: destinationCode,
      },
      currency: 'INR',
    });

    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="home-page">
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="hero-eyebrow">Travel smarter, stay better</div>
            <h1>Find your perfect stay in India</h1>
            <p>
              Search availability, verify live rates, and continue booking with a clean Hotelbeds flow.
            </p>

            <div className="trust-strip">
              <div><strong>4.8/5</strong><span>Guest rating</span></div>
              <div><strong>500+</strong><span>Verified stays</span></div>
              <div><strong>24/7</strong><span>Support</span></div>
            </div>

            <div className="search-panel">
              <div className="search-field">
                <label>Destination</label>
                <input value={destination} onChange={(e) => setDestination(e.target.value)} />
              </div>

              <div className="search-field">
                <label>Check-in</label>
                <input type="date" min={today} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
              </div>

              <div className="search-field">
                <label>Check-out</label>
                <input type="date" min={checkIn || today} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
              </div>

              <div className="search-field">
                <label>Guests</label>
                <select value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                  <option value={5}>5</option>
                </select>
              </div>

              <button className="btn btn-primary search-btn" type="button" onClick={handleSearch}>
                Search
              </button>
            </div>

            {error ? <div className="search-error">{error}</div> : null}

            <div className="chips">
              {DESTINATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`chip ${d === destination ? 'active' : ''}`}
                  onClick={() => setDestination(d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="hero-card">
            <div className="hero-card-badge">Best deals today</div>
            <h3>Save more when you book early</h3>
            <p>Trending destinations, curated stays, and a smooth booking flow.</p>

            <div className="hero-visual">
              <img
                src="https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?auto=format&fit=crop&w=1200&q=80"
                alt="Mumbai"
              />
              <div className="hero-visual-overlay">
                <div className="overlay-title">Mumbai</div>
                <div className="overlay-subtitle">Popular stays and curated deals</div>
              </div>
            </div>

            <div className="hero-stats">
              <div><strong>4.8/5</strong><span>Guest rating</span></div>
              <div><strong>24/7</strong><span>Support</span></div>
              <div><strong>500+</strong><span>Stays</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="container section" ref={resultsRef}>
        <div className="section-head">
          <div>
            <div className="section-kicker">Explore</div>
            <h2>Stays in {destination}</h2>
            <p>Availability results from Hotelbeds.</p>
          </div>
        </div>

        {isLoading ? <p>Loading hotels...</p> : null}

        <div className="hotel-grid">
          {hotels.map((hotel) => (
            <HotelCard key={hotel.hotelCode || hotel.id} hotel={hotel} query={query} />
          ))}
        </div>

        {noResults ? (
          <div className="empty-state">
            <div className="empty-icon">🏨</div>
            <h3>No hotels available for {destination}</h3>
            <p>Try different dates or another destination.</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}