import { useEffect, useMemo, useRef, useState } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
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

function normalizeHotel(hotel) {
  const bestRate = hotel?.bestRate || hotel?.rates?.[0] || null;
  return {
    ...hotel,
    id: hotel?.id || hotel?.hotelCode || hotel?.code || hotel?.name,
    hotelCode: hotel?.hotelCode || hotel?.code || hotel?.id || '',
    name: hotel?.name || hotel?.hotelName || hotel?.title || 'Unnamed hotel',
    destinationName: hotel?.destinationName || hotel?.city || '',
    zoneName: hotel?.zoneName || '',
    categoryName: hotel?.categoryName || hotel?.stars || '',
    country: hotel?.country || '',
    price: toNumber(hotel?.price || bestRate?.net || 0),
    currency: hotel?.currency || bestRate?.currency || 'INR',
    bestRate,
  };
}

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const resultsRef = useRef(null);

  const [destination, setDestination] = useState('Delhi');
  const [destinationOpen, setDestinationOpen] = useState(false);
  const [checkIn, setCheckIn] = useState('2026-05-07');
  const [checkOut, setCheckOut] = useState('2026-05-08');
  const [guests, setGuests] = useState(2);
  const [searchBody, setSearchBody] = useState(null);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('best');
  const [minRating, setMinRating] = useState(0);
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [textSearch, setTextSearch] = useState('');
  const [mapPopupOpen, setMapPopupOpen] = useState(false);

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

  const hotels = useMemo(() => {
    const list = Array.isArray(data?.results) ? data.results : [];
    return list.map(normalizeHotel);
  }, [data]);

  const total = data?.total ?? hotels.length;
  const apiError = data?.error || '';
  const quotaExceeded = String(apiError).toLowerCase().includes('quota exceeded');

  const filteredHotels = useMemo(() => {
    let list = [...hotels];

    if (textSearch.trim()) {
      const q = textSearch.toLowerCase();
      list = list.filter((hotel) =>
        String(hotel?.name || '').toLowerCase().includes(q) ||
        String(hotel?.destinationName || '').toLowerCase().includes(q) ||
        String(hotel?.zoneName || '').toLowerCase().includes(q)
      );
    }

    if (minRating) {
      list = list.filter((hotel) => parseStars(hotel?.categoryName) >= minRating);
    }

    if (maxPrice !== '') {
      const cap = Number(maxPrice);
      list = list.filter((hotel) => toNumber(hotel?.price) <= cap);
    }

    if (sortBy === 'price-asc') {
      list.sort((a, b) => toNumber(a?.price) - toNumber(b?.price));
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => toNumber(b?.price) - toNumber(a?.price));
    } else if (sortBy === 'rating') {
      list.sort((a, b) => parseStars(b?.categoryName) - parseStars(a?.categoryName));
    } else {
      list.sort((a, b) => {
        const aStars = parseStars(a?.categoryName);
        const bStars = parseStars(b?.categoryName);
        if (bStars !== aStars) return bStars - aStars;
        return toNumber(a?.price) - toNumber(b?.price);
      });
    }

    return list;
  }, [hotels, textSearch, minRating, maxPrice, sortBy]);

  const bestDealHotel = useMemo(() => {
    if (!filteredHotels.length) return null;
    return [...filteredHotels].sort((a, b) => toNumber(a?.price) - toNumber(b?.price))[0];
  }, [filteredHotels]);

  const topRatedHotel = useMemo(() => {
    if (!filteredHotels.length) return null;
    return [...filteredHotels].sort((a, b) => {
      const diff = parseStars(b?.categoryName) - parseStars(a?.categoryName);
      if (diff !== 0) return diff;
      return toNumber(a?.price) - toNumber(b?.price);
    })[0];
  }, [filteredHotels]);

  const displayedHotels = filteredHotels;
  const totalPages = Math.max(1, Math.ceil(displayedHotels.length / PAGE_SIZE));
  const pagedHotels = displayedHotels.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const noResults = Boolean(searchBody) && !isLoading && displayedHotels.length === 0 && !apiError;
  const featuredHotel = bestDealHotel || topRatedHotel;
  const mapLabel = selectedHotel?.name || featuredHotel?.name || destination;

  const destinationSuggestions = useMemo(() => {
    const q = destination.trim().toLowerCase();
    if (!q) return DESTINATIONS;
    return DESTINATIONS.filter((city) => city.toLowerCase().includes(q));
  }, [destination]);

  useEffect(() => {
    if (bestDealHotel && !selectedHotel) {
      setSelectedHotel(bestDealHotel);
    }
  }, [bestDealHotel, selectedHotel]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function handleSearch() {
    if (!loading && !isAuthenticated) {
      router.push('/login?next=/');
      return;
    }

    setError('');
    setSortBy('best');
    setMinRating(0);
    setMaxPrice('');
    setTextSearch('');
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
      stay: { checkIn, checkOut },
      occupancies: [{ rooms: 1, adults: guests, children: 0 }],
      destination: { code: destinationCode },
      currency: 'INR',
    });

    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="tb-page">
      <section className="tb-hero">
        <div className="container">
          <div className="tb-hero-title">
            <h1>Find your next stay</h1>
            <p>Search deals on hotels and homes with a clean, fast booking experience.</p>
          </div>

          <div className="tb-search-shell">
            <div className="tb-search-grid">
              <div className="tb-search-field destination-field">
                <label>Destination</label>
                <input
                  value={destination}
                  onChange={(e) => {
                    setDestination(e.target.value);
                    setDestinationOpen(true);
                  }}
                  onFocus={() => setDestinationOpen(true)}
                  onBlur={() => setTimeout(() => setDestinationOpen(false), 150)}
                />
                {destinationOpen ? (
                  <div className="city-suggestions">
                    {destinationSuggestions.map((city) => (
                      <button
                        key={city}
                        type="button"
                        className="city-suggestion"
                        onClick={() => {
                          setDestination(city);
                          setDestinationOpen(false);
                        }}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="tb-search-field">
                <label>Check-in</label>
                <input type="date" min={today} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
              </div>

              <div className="tb-search-field">
                <label>Check-out</label>
                <input
                  type="date"
                  min={checkIn || today}
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </div>

              <div className="tb-search-field">
                <label>Guests</label>
                <select value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                  <option value={5}>5</option>
                </select>
              </div>

              <button className="btn btn-primary tb-search-btn" type="button" onClick={handleSearch}>
                Search
              </button>
            </div>
          </div>

          <div className="tb-offers">
            <div className="tb-offers-head">
              <h2>Exclusive Offers</h2>
            </div>

            <div className="tb-offers-strip">
              <div className="tb-offer-card blue">
                <strong>Huge discounts on bookings</strong>
                <span>Use code: TRAVEL</span>
              </div>
              <div className="tb-offer-card indigo">
                <strong>No convenience fee</strong>
                <span>Save more on every booking</span>
              </div>
              <div className="tb-offer-card sky">
                <strong>Best hotel deals</strong>
                <span>Bundle and save</span>
              </div>
            </div>
          </div>

          {error ? <div className="search-error">{error}</div> : null}
        </div>
      </section>

      <section className="tb-promo">
        <div className="container tb-promo-inner">
          <strong>Looking for instant coupons?</strong>
          <span>Check out today&apos;s discounts and destination offers</span>
        </div>
      </section>

      <main className="container tb-main" ref={resultsRef}>
        <aside className="tb-sidebar">
          <div className="side-card map-card">
            <div className="side-card-title">Search on map</div>
            <button type="button" className="map-mini-box" onClick={() => setMapPopupOpen(true)}>
              <div className="map-pin">📍</div>
              <div className="map-text">{destination}</div>
            </button>
          </div>

          <div className="side-card">
            <input
              className="sidebar-search"
              type="text"
              placeholder="Text search"
              value={textSearch}
              onChange={(e) => {
                setTextSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="side-card">
            <div className="side-title">Your budget (per night)</div>
            <input
              className="range"
              type="range"
              min="0"
              max="15000"
              step="100"
              value={maxPrice === '' ? 15000 : maxPrice}
              onChange={(e) => {
                setMaxPrice(e.target.value);
                setCurrentPage(1);
              }}
            />
            <div className="minmax-row">
              <input
                type="number"
                min="0"
                placeholder="Max price"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          <div className="side-card">
            <div className="side-title">Popular filters</div>
            <label><input type="checkbox" /> 3+ stars</label>
            <label><input type="checkbox" /> 4+ stars</label>
            <label><input type="checkbox" /> Best deals</label>
          </div>

          <div className="side-card">
            <div className="side-title">Best deal</div>
            {featuredHotel ? (
              <div className="mini-deal">
                <strong>{featuredHotel.name}</strong>
                <span>{featuredHotel.destinationName || featuredHotel.zoneName || destination}</span>
                <div className="mini-price">INR {featuredHotel.price}</div>
              </div>
            ) : (
              <p className="muted">Search to see best deals.</p>
            )}
          </div>
        </aside>

        <section className="tb-results">
          <div className="tb-results-head">
            <h2>{total} properties in {destination}</h2>
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="best">Best match</option>
              <option value="price-asc">Price low to high</option>
              <option value="price-desc">Price high to low</option>
              <option value="rating">Top rating</option>
            </select>
          </div>

          <div className="results-toolbar">
            <span className="toolbar-pill">All properties</span>
            <span className="toolbar-pill">Hotels</span>
            <span className="toolbar-pill">Deals</span>
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
              <div className="hotel-list">
				  {pagedHotels.length ? (
				  pagedHotels.map((hotel) => (
					<HotelCard
					  key={`${hotel.hotelCode}-${hotel.roomCode}-${hotel.rateKey}`}
					  hotel={hotel}
					  query={query}
					  selected={selectedHotel?.rateKey === hotel?.rateKey}
					  onSelect={() => setSelectedHotel(hotel)}
					/>
				  ))
				) : searchBody ? (
				  <div className="empty-state">
					<div className="empty-icon">🏨</div>
					<h3>No hotels found</h3>
					<p>Try changing dates, destination, or filters.</p>
				  </div>
				) : (
				  <div className="empty-state">
					<div className="empty-icon">🏨</div>
					<h3>Search to see hotels</h3>
					<p>Choose a destination and click Search.</p>
				  </div>
				)}
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
        </section>
      </main>

      {mapPopupOpen ? (
        <div className="map-modal-backdrop" onClick={() => setMapPopupOpen(false)}>
          <div className="map-modal" onClick={(e) => e.stopPropagation()}>
            <button className="map-modal-close" type="button" onClick={() => setMapPopupOpen(false)}>
              ×
            </button>

            <div className="map-modal-header">
              <h3>Search on map: {destination}</h3>
              <p>{displayedHotels.length} hotels available in this search</p>
            </div>

            <div className="map-modal-content">
              <div className="map-modal-map">
                <div className="map-canvas-placeholder">
                  <div className="map-pin">📍</div>
                  <div className="map-text">{destination}</div>
                </div>
              </div>

              <div className="map-modal-results">
				  {displayedHotels.length ? (
					displayedHotels.map((hotel) => (
					  <button
						key={hotel.id || hotel.hotelCode || hotel.name}
						type="button"
						className="map-item"
						onClick={() => setSelectedHotel(hotel)}
					  >
						<strong>{hotel.name}</strong>
						<span>{hotel.destinationName || hotel.zoneName || hotel.city || destination}</span>
						<span className="mini-price">
						  {hotel.currency || 'INR'} {hotel.price || hotel.bestRate?.net || 0}
						</span>
					  </button>
					))
				  ) : (
					<div className="map-empty">No hotel results yet. Search first to load hotels.</div>
				  )}
				</div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}