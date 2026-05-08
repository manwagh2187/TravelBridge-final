import { useEffect, useMemo, useRef, useState } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import HotelCard from '../components/HotelCard';

const DESTINATIONS = ['Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Hyderabad', 'Kolkata', 'Goa', 'Jaipur'];

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

const postFetcher = async (url, body) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
};

function parseStars(categoryName) {
  const match = String(categoryName || '').match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function groupByHotel(rows) {
  const map = new Map();

  for (const row of rows) {
    const key = row?.hotelCode || row?.hotelName || `${row?.hotelName || 'hotel'}-${row?.zoneName || ''}`;

    if (!map.has(key)) {
      map.set(key, {
        ...row,
        rates: [row],
        minPrice: toNumber(row?.net || row?.price),
        rateCount: 1,
        cheapestRate: row,
      });
    } else {
      const current = map.get(key);
      current.rates.push(row);
      current.rateCount += 1;
      const rowPrice = toNumber(row?.net || row?.price);
      if (rowPrice < current.minPrice) {
        current.minPrice = rowPrice;
        current.cheapestRate = row;
      }
    }
  }

  return Array.from(map.values());
}

function buildMapPoints(hotels) {
  return hotels.slice(0, 8).map((hotel, index) => ({
    ...hotel,
    left: 10 + ((index * 13) % 76),
    top: 12 + ((index * 17) % 68),
  }));
}

function buildMapLabel(hotel, fallbackDestination) {
  if (!hotel) return fallbackDestination;
  return hotel.hotelName || hotel.zoneName || hotel.destinationName || fallbackDestination;
}

function hasFreeCancellation(hotel) {
  const text = String(hotel?.cheapestRate?.rateType || hotel?.cheapestRate?.paymentType || hotel?.cheapestRate?.packaging || '').toLowerCase();
  return text.includes('free cancellation') || text.includes('free cancel') || text.includes('cancel') || text.includes('refundable');
}

function isBookable(hotel) {
  const text = String(hotel?.cheapestRate?.rateType || hotel?.cheapestRate?.paymentType || hotel?.cheapestRate?.packaging || '').toLowerCase();
  return text.includes('bookable') || text.includes('room only') || text.includes('at_web') || text.includes('web');
}

function getFilterSummary(filters) {
  const labels = [];
  if (filters.starThreshold) labels.push(filters.starThreshold === 5 ? '5 stars' : `${filters.starThreshold}+ stars`);
  if (filters.onlyDeal) labels.push('Deal only');
  if (filters.onlyBookable) labels.push('Bookable only');
  if (filters.onlyRoomOnly) labels.push('Room only');
  if (filters.onlyFreeCancellation) labels.push('Free cancellation');
  if (filters.maxPrice !== '') labels.push(`Under ${filters.maxPrice}`);
  if (filters.textSearch.trim()) labels.push(`Search: ${filters.textSearch.trim()}`);
  return labels;
}

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const resultsRef = useRef(null);

  const [destination, setDestination] = useState('Delhi');
  const [destinationOpen, setDestinationOpen] = useState(false);
  const [checkIn, setCheckIn] = useState('2026-05-14');
  const [checkOut, setCheckOut] = useState('2026-05-15');
  const [guests, setGuests] = useState(2);
  const [searchBody, setSearchBody] = useState(null);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('best');
  const [starThreshold, setStarThreshold] = useState(0);
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [textSearch, setTextSearch] = useState('');
  const [mapPopupOpen, setMapPopupOpen] = useState(false);
  const [onlyDeal, setOnlyDeal] = useState(false);
  const [onlyBookable, setOnlyBookable] = useState(false);
  const [onlyRoomOnly, setOnlyRoomOnly] = useState(false);
  const [onlyFreeCancellation, setOnlyFreeCancellation] = useState(false);

  const query = useMemo(
    () => ({
      destination: DESTINATION_CODES[destination] || destination,
      checkIn,
      checkOut,
      guests,
    }),
    [destination, checkIn, checkOut, guests]
  );

  useEffect(() => {
    const saved = sessionStorage.getItem('travelbridge-search');
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      if (parsed?.searchBody) setSearchBody(parsed.searchBody);
      if (parsed?.destination) setDestination(parsed.destination);
      if (parsed?.checkIn) setCheckIn(parsed.checkIn);
      if (parsed?.checkOut) setCheckOut(parsed.checkOut);
      if (parsed?.guests) setGuests(parsed.guests);
      if (parsed?.sortBy) setSortBy(parsed.sortBy);
      if (parsed?.starThreshold !== undefined) setStarThreshold(parsed.starThreshold);
      if (parsed?.maxPrice !== undefined) setMaxPrice(parsed.maxPrice);
      if (parsed?.textSearch !== undefined) setTextSearch(parsed.textSearch);
      if (parsed?.onlyDeal !== undefined) setOnlyDeal(parsed.onlyDeal);
      if (parsed?.onlyBookable !== undefined) setOnlyBookable(parsed.onlyBookable);
      if (parsed?.onlyRoomOnly !== undefined) setOnlyRoomOnly(parsed.onlyRoomOnly);
      if (parsed?.onlyFreeCancellation !== undefined) setOnlyFreeCancellation(parsed.onlyFreeCancellation);
    } catch {
      // ignore invalid saved state
    }
  }, []);

  const { data, isLoading } = useSWR(
    searchBody ? ['/api/hotelbeds/search', searchBody] : null,
    async ([url, body]) => {
      const response = await postFetcher(url, body);

      if (response?.error && String(response.error).toLowerCase().includes('quota exceeded')) {
        const fallback = await fetch(
          `/api/hotelbeds/cache?destination=${encodeURIComponent(DESTINATION_CODES[destination] || destination)}&checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}&guests=${encodeURIComponent(guests)}`
        ).then((r) => r.json());

        return fallback;
      }

      return response;
    }
  );

  const rateRows = useMemo(() => (Array.isArray(data?.results) ? data.results : []), [data]);
  const hotels = useMemo(() => groupByHotel(rateRows), [rateRows]);

  const apiError = data?.error || '';
  const quotaExceeded = String(apiError).toLowerCase().includes('quota exceeded');

  const filteredHotels = useMemo(() => {
    let list = [...hotels];

    if (textSearch.trim()) {
      const q = textSearch.toLowerCase();
      list = list.filter((hotel) =>
        String(hotel?.hotelName || '').toLowerCase().includes(q) ||
        String(hotel?.destinationName || '').toLowerCase().includes(q) ||
        String(hotel?.zoneName || '').toLowerCase().includes(q) ||
        String(hotel?.cheapestRate?.roomName || '').toLowerCase().includes(q) ||
        String(hotel?.cheapestRate?.boardName || '').toLowerCase().includes(q)
      );
    }

    // Exact star logic
    if (starThreshold === 3) {
      list = list.filter((hotel) => parseStars(hotel?.categoryName) >= 3);
    } else if (starThreshold === 4) {
      list = list.filter((hotel) => parseStars(hotel?.categoryName) >= 4);
    } else if (starThreshold === 5) {
      list = list.filter((hotel) => parseStars(hotel?.categoryName) === 5);
    }

    if (maxPrice !== '') {
      const cap = Number(maxPrice);
      list = list.filter((hotel) => toNumber(hotel?.minPrice) <= cap);
    }

    if (onlyDeal) {
      list = list.filter((hotel) => toNumber(hotel?.minPrice) > 0 && toNumber(hotel?.rateCount) >= 1);
    }

    if (onlyBookable) {
      list = list.filter((hotel) => isBookable(hotel));
    }

    if (onlyRoomOnly) {
      list = list.filter((hotel) => {
        const text = String(hotel?.cheapestRate?.boardName || hotel?.cheapestRate?.rateType || '').toLowerCase();
        return text.includes('room only');
      });
    }

    if (onlyFreeCancellation) {
      list = list.filter((hotel) => hasFreeCancellation(hotel));
    }

    if (sortBy === 'price-asc') {
      list.sort((a, b) => toNumber(a?.minPrice) - toNumber(b?.minPrice));
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => toNumber(b?.minPrice) - toNumber(a?.minPrice));
    } else if (sortBy === 'rating') {
      list.sort((a, b) => parseStars(b?.categoryName) - parseStars(a?.categoryName));
    } else {
      list.sort((a, b) => {
        const aStars = parseStars(a?.categoryName);
        const bStars = parseStars(b?.categoryName);
        if (bStars !== aStars) return bStars - aStars;
        return toNumber(a?.minPrice) - toNumber(b?.minPrice);
      });
    }

    return list;
  }, [hotels, textSearch, starThreshold, maxPrice, sortBy, onlyDeal, onlyBookable, onlyRoomOnly, onlyFreeCancellation]);

  const total = filteredHotels.length;

  const bestDealHotel = useMemo(() => {
    if (!filteredHotels.length) return null;
    return [...filteredHotels].sort((a, b) => toNumber(a?.minPrice) - toNumber(b?.minPrice))[0];
  }, [filteredHotels]);

  const topRatedHotel = useMemo(() => {
    if (!filteredHotels.length) return null;
    return [...filteredHotels].sort((a, b) => {
      const diff = parseStars(b?.categoryName) - parseStars(a?.categoryName);
      if (diff !== 0) return diff;
      return toNumber(a?.minPrice) - toNumber(b?.minPrice);
    })[0];
  }, [filteredHotels]);

  const displayedHotels = filteredHotels;
  const totalPages = Math.max(1, Math.ceil(displayedHotels.length / PAGE_SIZE));
  const pagedHotels = displayedHotels.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const featuredHotel = bestDealHotel || topRatedHotel;
  const mapLabel = buildMapLabel(selectedHotel || featuredHotel, destination);
  const mapPoints = useMemo(() => buildMapPoints(displayedHotels), [displayedHotels]);

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

  useEffect(() => {
    if (searchBody) {
      sessionStorage.setItem(
        'travelbridge-search',
        JSON.stringify({
          searchBody,
          destination,
          checkIn,
          checkOut,
          guests,
          sortBy,
          starThreshold,
          maxPrice,
          textSearch,
          onlyDeal,
          onlyBookable,
          onlyRoomOnly,
          onlyFreeCancellation,
        })
      );
    }
  }, [searchBody, destination, checkIn, checkOut, guests, sortBy, starThreshold, maxPrice, textSearch, onlyDeal, onlyBookable, onlyRoomOnly, onlyFreeCancellation]);

  function handleSearch() {
    if (!loading && !isAuthenticated) {
      router.push('/login?next=/');
      return;
    }

    setError('');
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

    const nextSearchBody = {
      stay: { checkIn, checkOut },
      occupancies: [{ rooms: 1, adults: guests, children: 0 }],
      destination: { code: destinationCode },
      currency: 'INR',
    };

    setSearchBody(nextSearchBody);

    sessionStorage.setItem(
      'travelbridge-search',
      JSON.stringify({
        searchBody: nextSearchBody,
        destination,
        checkIn,
        checkOut,
        guests,
        sortBy,
        starThreshold,
        maxPrice,
        textSearch,
        onlyDeal,
        onlyBookable,
        onlyRoomOnly,
        onlyFreeCancellation,
      })
    );

    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function resetFilters() {
    setStarThreshold(0);
    setMaxPrice('');
    setTextSearch('');
    setSortBy('best');
    setOnlyDeal(false);
    setOnlyBookable(false);
    setOnlyRoomOnly(false);
    setOnlyFreeCancellation(false);
    setCurrentPage(1);
  }

  const activeSummary = getFilterSummary({
    starThreshold,
    onlyDeal,
    onlyBookable,
    onlyRoomOnly,
    onlyFreeCancellation,
    maxPrice,
    textSearch,
  });

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
                <input type="date" min={checkIn || today} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
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
              <div className="map-text">{mapLabel}</div>
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

            <div className="star-filter-group">
              <button
                type="button"
                className={`star-filter-btn ${starThreshold === 0 ? 'active' : ''}`}
                onClick={() => {
                  setStarThreshold(0);
                  setCurrentPage(1);
                }}
              >
                Any
              </button>

              <button
                type="button"
                className={`star-filter-btn ${starThreshold === 3 ? 'active' : ''}`}
                onClick={() => {
                  setStarThreshold(3);
                  setCurrentPage(1);
                }}
              >
                3+ stars
              </button>

              <button
                type="button"
                className={`star-filter-btn ${starThreshold === 4 ? 'active' : ''}`}
                onClick={() => {
                  setStarThreshold(4);
                  setCurrentPage(1);
                }}
              >
                4+ stars
              </button>

              <button
                type="button"
                className={`star-filter-btn ${starThreshold === 5 ? 'active' : ''}`}
                onClick={() => {
                  setStarThreshold(5);
                  setCurrentPage(1);
                }}
              >
                5 stars
              </button>
            </div>

            <label>
              <input type="checkbox" checked={onlyDeal} onChange={() => { setOnlyDeal((v) => !v); setCurrentPage(1); }} /> Deal only
            </label>
            <label>
              <input type="checkbox" checked={onlyBookable} onChange={() => { setOnlyBookable((v) => !v); setCurrentPage(1); }} /> Bookable only
            </label>
            <label>
              <input type="checkbox" checked={onlyRoomOnly} onChange={() => { setOnlyRoomOnly((v) => !v); setCurrentPage(1); }} /> Room only
            </label>
            <label>
              <input type="checkbox" checked={onlyFreeCancellation} onChange={() => { setOnlyFreeCancellation((v) => !v); setCurrentPage(1); }} /> Free cancellation
            </label>

            <button type="button" className="btn btn-outline" style={{ marginTop: 12, width: '100%' }} onClick={resetFilters}>
              Reset filters
            </button>
          </div>

          {activeSummary.length ? (
            <div className="side-card">
              <div className="side-title">Active filters</div>
              <div className="active-filter-bar">
                {activeSummary.map((item) => (
                  <span key={item} className="toolbar-pill active-pill">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </aside>

        <section className="tb-results">
          <div className="tb-results-head">
            <h2>{total} hotels in {destination}</h2>
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

          {filteredHotels.length ? (
            <div className="featured-deals-strip">
              {[...filteredHotels].slice(0, 3).map((hotel) => (
                <button
                  key={hotel.hotelCode}
                  type="button"
                  className={`featured-deal-card ${selectedHotel?.hotelCode === hotel.hotelCode ? 'active' : ''}`}
                  onClick={() => setSelectedHotel(hotel)}
                >
                  <div className="featured-deal-badge">
                    {parseStars(hotel?.categoryName)
                      ? `${parseStars(hotel.categoryName)} STAR${parseStars(hotel.categoryName) > 1 ? 'S' : ''}`
                      : 'HOTEL'}
                  </div>
                  <div className="featured-deal-title">{hotel.hotelName}</div>
                  <div className="featured-deal-subtitle">
                    {hotel.destinationName || hotel.zoneName || destination}
                  </div>
                  <div className="featured-deal-price">
                    {hotel.currency || 'INR'} {hotel.minPrice || 0}
                  </div>
                  <div className="featured-deal-footer">
                    <span>{hotel.cheapestRate?.boardName || 'No board'}</span>
                    <span>View on map</span>
                  </div>
                </button>
              ))}
            </div>
          ) : null}

          {searchBody && isLoading ? <p>Loading hotels...</p> : null}

          {apiError ? (
            <div className="search-error">
              {quotaExceeded ? 'Hotelbeds quota exceeded. Please try again later or contact support.' : apiError}
            </div>
          ) : null}

          {!apiError ? (
            <>
              <div className="hotel-list">
                {pagedHotels.length ? (
                  pagedHotels.map((hotel) => (
                    <HotelCard
                      key={hotel.hotelCode}
                      hotel={hotel}
                      query={query}
                      selected={selectedHotel?.hotelCode === hotel?.hotelCode}
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
                  <button className="btn btn-outline" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                    Prev
                  </button>
                  <div className="pagination-info">
                    Page {currentPage} of {totalPages}
                  </div>
                  <button className="btn btn-outline" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
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
                  {mapPoints.length ? (
                    mapPoints.map((hotel) => (
                      <button
                        key={hotel.hotelCode}
                        type="button"
                        className={`map-marker ${selectedHotel?.hotelCode === hotel.hotelCode ? 'active' : ''}`}
                        style={{ left: `${hotel.left}%`, top: `${hotel.top}%` }}
                        onClick={() => setSelectedHotel(hotel)}
                      >
                        <span className="map-marker-pin">📍</span>
                        <span className="map-marker-label">{hotel.hotelName}</span>
                        <span className="map-marker-price">
                          {hotel.currency || 'INR'} {hotel.minPrice || 0}
                        </span>
                      </button>
                    ))
                  ) : (
                    <>
                      <div className="map-pin">📍</div>
                      <div className="map-text">{mapLabel}</div>
                    </>
                  )}
                </div>
              </div>

              <div className="map-modal-results">
                {displayedHotels.length ? (
                  displayedHotels.map((hotel) => (
                    <button
                      key={hotel.hotelCode}
                      type="button"
                      className={`map-item ${selectedHotel?.hotelCode === hotel.hotelCode ? 'active' : ''}`}
                      onClick={() => setSelectedHotel(hotel)}
                    >
                      <strong>{hotel.hotelName}</strong>
                      <span>{hotel.cheapestRate?.roomName || 'Room'} • {hotel.cheapestRate?.boardName || 'No board'}</span>
                      <span>{hotel.destinationName || hotel.zoneName || destination}</span>
                      <span className="mini-price">
                        {hotel.currency || 'INR'} {hotel.minPrice || 0}
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