import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { apiFetch } from '../lib/api';

const fetcher = (url) => apiFetch(url).then((r) => r.json());

const DESTINATIONS = ['Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Hyderabad', 'Kolkata', 'Goa', 'Jaipur'];
const today = new Date().toISOString().split('T')[0];

const DESTINATION_IMAGES = {
  Mumbai: 'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?auto=format&fit=crop&w=1200&q=80',
  Delhi: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1200&q=80',
  Bengaluru: 'https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&w=1200&q=80',
  Chennai: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=80',
  Hyderabad: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1200&q=80',
  Kolkata: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80',
  Goa: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80',
  Jaipur: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=80',
};

export default function Home() {
  const resultsRef = useRef(null);
  const mapRef = useRef(null);

  const [destination, setDestination] = useState('Mumbai');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [selectedSort, setSelectedSort] = useState('recommended');
  const [searchError, setSearchError] = useState('');
  const [selectedListingId, setSelectedListingId] = useState(null);

  const isDateRangeInvalid = checkIn && checkOut ? new Date(checkOut) <= new Date(checkIn) : false;
  const isPartialDateSelection = Boolean(checkIn || checkOut) && !(checkIn && checkOut);

  const { data } = useSWR(`/api/hotels?country=India&city=${encodeURIComponent(destination)}`, fetcher);
  const listings = Array.isArray(data) ? data : [];
  const popularFallbackCities = DESTINATIONS.filter((city) => city !== destination).slice(0, 4);

  const sortedListings = useMemo(() => {
    const arr = [...listings];
    if (selectedSort === 'price-low') arr.sort((a, b) => (a.minPrice || 0) - (b.minPrice || 0));
    else if (selectedSort === 'price-high') arr.sort((a, b) => (b.minPrice || 0) - (a.minPrice || 0));
    return arr;
  }, [listings, selectedSort]);

  function handleSearch() {
    setSearchError('');

    if (isPartialDateSelection) {
      setSearchError('Please select both check-in and check-out dates.');
      return;
    }

    if (checkIn && checkOut) {
      const start = new Date(checkIn);
      const end = new Date(checkOut);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        setSearchError('Please enter valid dates.');
        return;
      }

      const normalizedStart = new Date(start);
      normalizedStart.setHours(0, 0, 0, 0);

      const normalizedEnd = new Date(end);
      normalizedEnd.setHours(0, 0, 0, 0);

      const normalizedToday = new Date();
      normalizedToday.setHours(0, 0, 0, 0);

      if (normalizedStart < normalizedToday) {
        setSearchError('Check-in cannot be in the past.');
        return;
      }

      if (normalizedEnd <= normalizedStart) {
        setSearchError('Check-out must be after check-in.');
        return;
      }
    }

    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleShowMap() {
    mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="home-page">
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="hero-eyebrow">Travel smarter, stay better</div>
            <h1>Find your perfect stay in India</h1>
            <p>
              Compare stays, explore deals, and book your next hotel with a cleaner, faster, and more premium experience.
            </p>

            <div className="trust-strip">
              <div><strong>4.8/5</strong><span>Guest rating</span></div>
              <div><strong>500+</strong><span>Verified stays</span></div>
              <div><strong>24/7</strong><span>Support</span></div>
            </div>

            <div className="search-panel">
              <div className="search-field search-wide">
                <label>Destination</label>
                <input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Enter city or hotel"
                />
              </div>

              <div className="search-field">
                <label>Check-in</label>
                <input
                  type="date"
                  value={checkIn}
                  min={today}
                  onChange={(e) => {
                    const nextCheckIn = e.target.value;
                    setCheckIn(nextCheckIn);
                    if (checkOut && nextCheckIn && checkOut <= nextCheckIn) setCheckOut('');
                    if (searchError) setSearchError('');
                  }}
                />
              </div>

              <div className="search-field">
                <label>Check-out</label>
                <input
                  type="date"
                  value={checkOut}
                  min={checkIn || today}
                  onChange={(e) => {
                    setCheckOut(e.target.value);
                    if (searchError) setSearchError('');
                  }}
                  disabled={!checkIn}
                />
              </div>

              <div className="search-field">
                <label>Guests</label>
                <select value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
                  <option value={1}>1 guest</option>
                  <option value={2}>2 guests</option>
                  <option value={3}>3 guests</option>
                  <option value={4}>4 guests</option>
                  <option value={5}>5 guests</option>
                </select>
              </div>

              <div className="search-field">
                <label>Sort by</label>
                <select value={selectedSort} onChange={(e) => setSelectedSort(e.target.value)}>
                  <option value="recommended">Recommended</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="price-high">Price: high to low</option>
                </select>
              </div>

              <button
                className="btn btn-primary search-btn"
                onClick={handleSearch}
                type="button"
                disabled={isDateRangeInvalid}
              >
                Search
              </button>
            </div>

            {searchError ? <div className="search-error">{searchError}</div> : null}

            <div className="chips">
              {DESTINATIONS.map((d) => (
                <button
                  key={d}
                  className={`chip ${d === destination ? 'active' : ''}`}
                  onClick={() => setDestination(d)}
                  type="button"
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
              <img src={DESTINATION_IMAGES[destination] || DESTINATION_IMAGES.Mumbai} alt={destination} />
              <div className="hero-visual-overlay">
                <div className="overlay-title">{destination}</div>
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
            <p>Modern hotel cards, room details, and booking flow.</p>
          </div>

          <div className="results-actions">
            <div className="result-count">{sortedListings.length} properties</div>
            <button className="btn btn-outline map-btn" type="button" onClick={handleShowMap}>
              Show map
            </button>
          </div>
        </div>

        <div className="hotel-grid">
          {sortedListings.map((listing) => {
            let images = [];
            try {
              images = JSON.parse(listing.imagesJson || '[]');
            } catch {
              images = [];
            }

            const cover = images[0] || null;
            const isSelected = selectedListingId === listing.id;

            return (
              <article
                key={listing.id}
                className={`hotel-card ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedListingId(listing.id);
                  mapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
              >
                <div className="hotel-image">
                  {cover ? <img src={cover} alt={listing.title} /> : <div className="placeholder">TravelBridge</div>}
                  <div className="deal-badge">Deal</div>
                  <div className="price-tag">₹{Number(listing.minPrice || 0).toLocaleString()}</div>
                </div>

                <div className="hotel-body">
                  <div className="hotel-topline">
                    <div className="location">
                      {listing.city}, {listing.country}
                    </div>
                    <div className="rating">8.9 Excellent</div>
                  </div>

                  <h3>{listing.title}</h3>
                  <p>{listing.description}</p>

                  <div className="benefits">
                    <span>Free cancellation</span>
                    <span>Breakfast available</span>
                    <span>Pay at property</span>
                  </div>

                  <div className="room-meta">
                    <span>{listing.starRating ? `${listing.starRating} star` : 'No rating'}</span>
                    <span>Up to {guests} guests</span>
                  </div>

                  <div className="hotel-footer">
                    <div>
                      <div className="price-label">From</div>
                      <div className="price">₹{Number(listing.minPrice || 0).toLocaleString()}</div>
                      <div className="per-night">per night</div>
                    </div>

                    <Link
                      href={{
                        pathname: `/listing/${listing.id}`,
                        query: { checkIn, checkOut, guests, destination },
                      }}
                      className="btn btn-primary"
                    >
                      View deal
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {!sortedListings.length ? (
          <div className="empty-state">
            <div className="empty-icon">🏨</div>
            <h3>No stays found in {destination}</h3>
            <p>Try another city or explore a popular destination below.</p>

            <div className="empty-actions">
              {DESTINATIONS.map((city) => (
                <button key={city} className="chip" type="button" onClick={() => setDestination(city)}>
                  {city}
                </button>
              ))}
            </div>

            <div className="empty-divider" />

            <div className="empty-suggestions">
              <div className="empty-suggestions-label">Popular nearby options</div>
              <div className="empty-suggestion-row">
                {popularFallbackCities.map((city) => (
                  <button key={city} type="button" className="suggestion-pill" onClick={() => setDestination(city)}>
                    {city}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <section className="container map-section" ref={mapRef}>
        <div className="section-head">
          <div>
            <div className="section-kicker">Map view</div>
            <h2>{destination} map</h2>
            <p>Click a property above to jump here.</p>
          </div>
        </div>

        <div className="map-layout">
          <div className="map-panel">
            <div className="map-fallback">
              <div className="map-fallback-header">
                <div className="map-fallback-icon">📍</div>
                <div>
                  <div className="map-fallback-title">Interactive map preview unavailable</div>
                  <div className="map-fallback-subtitle">
                    We’ll show live location data here soon.
                  </div>
                </div>
              </div>

              <div className="map-canvas-placeholder">
                <div className="map-pin">●</div>
                <div className="map-text">{destination}</div>
              </div>

              <p>
                No live map data is available right now. Use the nearby stays list or browse another destination.
              </p>

              <div className="map-fallback-note">{destination}</div>
            </div>
          </div>

          <aside className="map-list">
            <h3>Nearby stays</h3>
            {sortedListings.slice(0, 3).map((listing) => (
              <button
                key={listing.id}
                type="button"
                className="map-item"
                onClick={() => setSelectedListingId(listing.id)}
              >
                <strong>{listing.title}</strong>
                <span>
                  {listing.city}, {listing.country}
                </span>
              </button>
            ))}

            {!sortedListings.length ? <div className="map-empty">No nearby stays available for this destination.</div> : null}
          </aside>
        </div>
      </section>
    </div>
  );
}