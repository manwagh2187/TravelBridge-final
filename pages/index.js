import { useEffect, useMemo, useRef, useState } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useAuth } from '../context/AuthContext';
import HotelCard from '../components/HotelCard';

const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((m) => m.Popup), { ssr: false });

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
  if (filters.starThreshold) labels.push(`${filters.starThreshold} stars`);
  if (filters.onlyDeal) labels.push('Deal only');
  if (filters.onlyBookable) labels.push('Bookable only');
  if (filters.onlyRoomOnly) labels.push('Room only');
  if (filters.onlyFreeCancellation) labels.push('Free cancellation');
  if (filters.maxPrice !== '') labels.push(`Under ${filters.maxPrice}`);
  if (filters.textSearch.trim()) labels.push(`Search: ${filters.textSearch.trim()}`);
  return labels;
}

function getHotelLatLng(hotel, index) {
  const latBase = 28.6139;
  const lngBase = 77.2090;
  const spread = 0.18;
  const lat = hotel?.latitude ? Number(hotel.latitude) : latBase + ((index % 5) - 2) * spread;
  const lng = hotel?.longitude ? Number(hotel.longitude) : lngBase + (Math.floor(index / 5) - 1) * spread;
  return [lat, lng];
}

function scrollHotelCardIntoView(hotelCode) {
  if (typeof document === 'undefined') return;
  const el = document.querySelector(`[data-hotel-code="${hotelCode}"]`);
  el?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
}

function createIcon(selected = false) {
  if (typeof window === 'undefined') return undefined;
  const Lleaflet = require('leaflet');
  return Lleaflet.divIcon({
    className: '',
    html: `
      <div style="
        width: ${selected ? 34 : 28}px;
        height: ${selected ? 34 : 28}px;
        border-radius: 999px;
        background: ${selected ? '#2563eb' : '#ec4899'};
        border: 3px solid white;
        box-shadow: 0 8px 18px rgba(0,0,0,0.18);
        transform: ${selected ? 'scale(1.08)' : 'scale(1)'};
        transition: transform 0.15s ease;
      "></div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

    if (starThreshold === 3) {
      list = list.filter((hotel) => parseStars(hotel?.categoryName) === 3);
    } else if (starThreshold === 4) {
      list = list.filter((hotel) => parseStars(hotel?.categoryName) === 4);
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
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pagedHotels = filteredHotels.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const bestDealHotel = useMemo(() => {
    if (!filteredHotels.length) return null;
    return [...filteredHotels].sort((a, b) => toNumber(a?.minPrice) - toNumber(b?.minPrice))[0];
  }, [filteredHotels]);

  const mapCenter = useMemo(() => {
    if (destination === 'Delhi') return [28.6139, 77.2090];
    if (destination === 'Mumbai') return [19.076, 72.8777];
    if (destination === 'Bengaluru') return [12.9716, 77.5946];
    if (destination === 'Chennai') return [13.0827, 80.2707];
    if (destination === 'Hyderabad') return [17.385, 78.4867];
    if (destination === 'Kolkata') return [22.5726, 88.3639];
    if (destination === 'Goa') return [15.2993, 74.124];
    if (destination === 'Jaipur') return [26.9124, 75.7873];
    return [28.6139, 77.2090];
  }, [destination]);

  const mapHotels = useMemo(() => {
    return filteredHotels.slice(0, 30).map((hotel, index) => ({
      ...hotel,
      coords: getHotelLatLng(hotel, index),
    }));
  }, [filteredHotels]);

  const mapLabel = selectedHotel?.hotelName || bestDealHotel?.hotelName || destination;

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

          {error ? <div className="search-error">{error}</div> : null}
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
              <button type="button" className={`star-filter-btn ${starThreshold === 0 ? 'active' : ''}`} onClick={() => { setStarThreshold(0); setCurrentPage(1); }}>Any</button>
              <button type="button" className={`star-filter-btn ${starThreshold === 3 ? 'active' : ''}`} onClick={() => { setStarThreshold(3); setCurrentPage(1); }}>3 stars</button>
              <button type="button" className={`star-filter-btn ${starThreshold === 4 ? 'active' : ''}`} onClick={() => { setStarThreshold(4); setCurrentPage(1); }}>4 stars</button>
              <button type="button" className={`star-filter-btn ${starThreshold === 5 ? 'active' : ''}`} onClick={() => { setStarThreshold(5); setCurrentPage(1); }}>5 stars</button>
            </div>

            <label><input type="checkbox" checked={onlyDeal} onChange={() => { setOnlyDeal((v) => !v); setCurrentPage(1); }} /> Deal only</label>
            <label><input type="checkbox" checked={onlyBookable} onChange={() => { setOnlyBookable((v) => !v); setCurrentPage(1); }} /> Bookable only</label>
            <label><input type="checkbox" checked={onlyRoomOnly} onChange={() => { setOnlyRoomOnly((v) => !v); setCurrentPage(1); }} /> Room only</label>
            <label><input type="checkbox" checked={onlyFreeCancellation} onChange={() => { setOnlyFreeCancellation((v) => !v); setCurrentPage(1); }} /> Free cancellation</label>

            <button type="button" className="btn btn-outline" style={{ marginTop: 12, width: '100%' }} onClick={resetFilters}>
              Reset filters
            </button>
          </div>
        </aside>

        <section className="tb-results">
          <div className="tb-results-head">
            <h2>{total} hotels in {destination}</h2>
            <select className="sort-select" value={sortBy} onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}>
              <option value="best">Best match</option>
              <option value="price-asc">Price low to high</option>
              <option value="price-desc">Price high to low</option>
              <option value="rating">Top rating</option>
            </select>
          </div>

          {activeSummary.length ? (
            <div className="active-filters-row">
              {activeSummary.map((item) => (
                <span key={item} className="toolbar-pill active-pill">
                  {item}
                </span>
              ))}
            </div>
          ) : null}

          <div className="results-toolbar">
            <span className="toolbar-pill">All properties</span>
            <span className="toolbar-pill">Hotels</span>
            <span className="toolbar-pill">Deals</span>
          </div>

          <div className="hotel-list">
            {pagedHotels.length ? (
              pagedHotels.map((hotel) => (
                <div key={hotel.hotelCode} data-hotel-code={hotel.hotelCode}>
                  <HotelCard
                    hotel={hotel}
                    query={query}
                    selected={selectedHotel?.hotelCode === hotel?.hotelCode}
                    onSelect={() => {
                      setSelectedHotel(hotel);
                      scrollHotelCardIntoView(hotel.hotelCode);
                    }}
                  />
                </div>
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

          {total > PAGE_SIZE ? (
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
        </section>
      </main>

      {mapPopupOpen ? (
        <div className="map-modal-backdrop" onClick={() => setMapPopupOpen(false)}>
          <div className="map-modal map-modal-leaflet" onClick={(e) => e.stopPropagation()}>
            <button className="map-modal-close" type="button" onClick={() => setMapPopupOpen(false)}>
              ×
            </button>

            <div className="map-modal-header">
              <h3>Search on map: {destination}</h3>
              <p>{filteredHotels.length} hotels available in this search</p>
            </div>

            <div className="map-modal-content">
              <div className="map-modal-map">
                {mounted ? (
                  <MapContainer center={mapCenter} zoom={11} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                      attribution='&copy; OpenStreetMap contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {mapHotels.map((hotel, index) => {
                      const selected = selectedHotel?.hotelCode === hotel.hotelCode;
                      return (
                        <Marker
                          key={hotel.hotelCode}
                          position={hotel.coords}
                          icon={createIcon(selected)}
                          eventHandlers={{
                            click: () => {
                              setSelectedHotel(hotel);
                              scrollHotelCardIntoView(hotel.hotelCode);
                            },
                          }}
                        >
                          <Popup>
                            <strong>{hotel.hotelName}</strong>
                            <br />
                            {hotel.destinationName || hotel.zoneName || destination}
                            <br />
                            INR {hotel.minPrice || 0}
                          </Popup>
                        </Marker>
                      );
                    })}
                  </MapContainer>
                ) : null}
              </div>

              <div className="map-modal-results">
                {filteredHotels.length ? (
                  filteredHotels.map((hotel) => (
                    <button
                      key={hotel.hotelCode}
                      type="button"
                      className={`map-item ${selectedHotel?.hotelCode === hotel.hotelCode ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedHotel(hotel);
                        scrollHotelCardIntoView(hotel.hotelCode);
                      }}
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