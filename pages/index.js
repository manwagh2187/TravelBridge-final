import { useEffect, useMemo, useRef, useState } from 'react';
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

const PAGE_SIZE = 10;
const today = new Date().toISOString().split('T')[0];

const postFetcher = (url, body) =>
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then((r) => r.json());

function parseStars(categoryName) {
  const match = String(categoryName || '').match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function Home() {
  const resultsRef = useRef(null);

  const [destination, setDestination] = useState('Mumbai');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [searchBody, setSearchBody] = useState(null);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('best');
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

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
  const apiError = data?.error || '';
  const quotaExceeded = String(apiError).toLowerCase().includes('quota exceeded');

  const filteredHotels = useMemo(() => {
    let list = [...hotels];

    if (minRating) {
      list = list.filter((hotel) => parseStars(hotel?.categoryName) >= minRating);
    }

    if (maxPrice !== '') {
      const cap = Number(maxPrice);
      list = list.filter((hotel) => toNumber(hotel?.price || hotel?.bestRate?.net) <= cap);
    }

    if (sortBy === 'price-asc') {
      list.sort((a, b) => toNumber(a?.price || a?.bestRate?.net) - toNumber(b?.price || b?.bestRate?.net));
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => toNumber(b?.price || b?.bestRate?.net) - toNumber(a?.price || a?.bestRate?.net));
    } else if (sortBy === 'rating') {
      list.sort((a, b) => parseStars(b?.categoryName) - parseStars(a?.categoryName));
    } else {
      list.sort((a, b) => {
        const aStars = parseStars(a?.categoryName);
        const bStars = parseStars(b?.categoryName);
        if (bStars !== aStars) return bStars - aStars;
        return toNumber(a?.price || a?.bestRate?.net) - toNumber(b?.price || b?.bestRate?.net);
      });
    }

    return list;
  }, [hotels, minRating, maxPrice, sortBy]);

  const bestDealHotel = useMemo(() => {
    if (!filteredHotels.length) return null;
    return [...filteredHotels].sort(
      (a, b) => toNumber(a?.price || a?.bestRate?.net) - toNumber(b?.price || b?.bestRate?.net)
    )[0];
  }, [filteredHotels]);

  const topRatedHotel = useMemo(() => {
    if (!filteredHotels.length) return null;
    return [...filteredHotels].sort((a, b) => {
      const diff = parseStars(b?.categoryName) - parseStars(a?.categoryName);
      if (diff !== 0) return diff;
      return toNumber(a?.price || a?.bestRate?.net) - toNumber(b?.price || b?.bestRate?.net);
    })[0];
  }, [filteredHotels]);

  const displayedHotels = filteredHotels;
  const totalPages = Math.max(1, Math.ceil(displayedHotels.length / PAGE_SIZE));
  const pagedHotels = displayedHotels.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const noResults = Boolean(searchBody) && !isLoading && displayedHotels.length === 0 && !apiError;

  useEffect(() => {
    if (bestDealHotel && !selectedHotel) {
      setSelectedHotel(bestDealHotel);
    }
  }, [bestDealHotel, selectedHotel]);

  function handleSearch() {
    setError('');
    setSortBy('best');
    setMinRating(0);
    setMaxPrice('');
    setSelectedHotel(null);
    setCurrentPage(1);

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

  const featuredHotel = bestDealHotel || topRatedHotel;

  return (
    <div className="home-page">
      <section className="hero">
        <div className="container hero-grid">
          <div className="left-stack">
            <div className="hero-copy">
              <div className="hero-eyebrow">Travel smarter, stay better</div>
              <h1>Find your perfect stay in India</h1>
              <p>
                Search availability, compare prices, filter by rating, and explore stays with a cleaner Hotelbeds flow.
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
                  <input
                    type="date"
                    min={today}
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                  />
                </div>

                <div className="search-field">
                  <label>Check-out</label>
                  <input
                    type="date"
                    min={checkIn || today}
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                  />
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

              {featuredHotel ? (
                <>
                  <div className="hero-badges">
                    <span className="hero-badge">Top deal</span>
                    {topRatedHotel ? <span className="hero-badge hero-badge-soft">Top rated</span> : null}
                  </div>

                  <h3>{featuredHotel.name}</h3>
                  <p>{featuredHotel.destinationName || featuredHotel.zoneName || 'Best deal from your current search results'}</p>
                </>
              ) : (
                <>
                  <h3>Save more when you book early</h3>
                  <p>Trending destinations, curated stays, and a smooth booking flow.</p>
                </>
              )}

              <div
                className="hero-visual"
                onClick={() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                style={{ cursor: 'pointer' }}
              >
                <img
                  src="https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?auto=format&fit=crop&w=1200&q=80"
                  alt="Travel destination"
                />
                <div className="hero-visual-overlay">
                  <div className="overlay-title">{destination}</div>
                  <div className="overlay-subtitle">
                    {featuredHotel ? `Best deal from INR ${featuredHotel.price}` : 'Popular stays and curated deals'}
                  </div>
                </div>
              </div>

              <div className="hero-stats">
                <div>
                  <strong>{featuredHotel?.price ? `INR ${featuredHotel.price}` : 'Best deal'}</strong>
                  <span>Featured price</span>
                </div>
                <div>
                  <strong>{featuredHotel?.categoryName || 'Top rated'}</strong>
                  <span>Featured stay</span>
                </div>
                <div>
                  <strong>{total || '—'}</strong>
                  <span>Search results</span>
                </div>
              </div>
            </div>

            <div className="map-card-mini">
              <div className="section-kicker">Map</div>
              <h3>Explore {destination}</h3>
              <p>See the current destination and nearby highlighted stays.</p>
              <div className="map-mini-box">
                <div className="map-pin">●</div>
                <div className="map-text">{destination}</div>
              </div>
              <div className="map-fallback-note">
                {selectedHotel?.name || featuredHotel?.name || 'Select a hotel to highlight it here'}
              </div>
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

          <div className="results-actions">
            {searchBody ? (
              <div className="result-count">
                {displayedHotels.length} result{displayedHotels.length === 1 ? '' : 's'}
              </div>
            ) : null}
          </div>
        </div>

        <div className="filters-bar">
          <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }} className="filter-select">
            <option value="best">Best match</option>
            <option value="price-asc">Price low to high</option>
            <option value="price-desc">Price high to low</option>
            <option value="rating">Top rating</option>
          </select>

          <select value={minRating} onChange={(e) => { setMinRating(Number(e.target.value)); setCurrentPage(1); }} className="filter-select">
            <option value={0}>Any rating</option>
            <option value={3}>3 stars+</option>
            <option value={4}>4 stars+</option>
            <option value={5}>5 stars</option>
          </select>

          <input
            type="number"
            min="0"
            placeholder="Max price"
            value={maxPrice}
            onChange={(e) => { setMaxPrice(e.target.value); setCurrentPage(1); }}
            className="filter-input"
          />
        </div>

        {searchBody && isLoading ? <p>Loading hotels...</p> : null}

        {apiError ? (
          <div className="search-error">
            {quotaExceeded
              ? 'Hotelbeds quota exceeded. Please try again later or contact support.'
              : apiError}
          </div>
        ) : null}

        {!apiError ? (
          <>
            <div className="hotel-grid">
              {pagedHotels.map((hotel) => (
                <div
                  key={hotel.id || hotel.code}
                  className={`hotel-wrap ${selectedHotel?.id === hotel?.id ? 'selected-hotel' : ''}`}
                  onClick={() => setSelectedHotel(hotel)}
                >
                  <HotelCard hotel={hotel} query={query} selected={selectedHotel?.id === hotel?.id} />
                </div>
              ))}
            </div>

            {displayedHotels.length > PAGE_SIZE ? (
              <div className="pagination">
                <button
                  className="btn btn-outline"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Prev
                </button>

                <div className="pagination-info">
                  Page {currentPage} of {totalPages}
                </div>

                <button
                  className="btn btn-outline"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            ) : null}
          </>
        ) : null}

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