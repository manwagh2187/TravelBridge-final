import { useMemo, useState } from 'react';

const PAGE_SIZE = 10;

const AIRPORTS = [
  { code: 'HYD', city: 'Hyderabad', name: 'Rajiv Gandhi International Airport', country: 'IN' },
  { code: 'BOM', city: 'Mumbai', name: 'Chhatrapati Shivaji Maharaj International Airport', country: 'IN' },
  { code: 'DEL', city: 'Delhi', name: 'Indira Gandhi International Airport', country: 'IN' },
  { code: 'BLR', city: 'Bengaluru', name: 'Kempegowda International Airport', country: 'IN' },
  { code: 'MAA', city: 'Chennai', name: 'Chennai International Airport', country: 'IN' },
  { code: 'CCU', city: 'Kolkata', name: 'Netaji Subhas Chandra Bose International Airport', country: 'IN' }
];

const today = new Date();
const depDefault = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14).toISOString().slice(0, 10);
const retDefault = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 21).toISOString().slice(0, 10);

function formatMoney(amount, currency = 'INR') {
  const num = Number(amount || 0);
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(num);
}
function offerPrice(offer) {
  return Number(offer?.price?.grandTotal || offer?.price?.total || 0);
}
function offerStops(offer) {
  const segs = offer?.itineraries?.[0]?.segments || [];
  return Math.max(0, segs.length - 1);
}
function offerDurationMin(offer) {
  const segs = offer?.itineraries?.[0]?.segments || [];
  if (!segs.length) return 99999;
  const dep = new Date(segs[0].departure?.at).getTime();
  const arr = new Date(segs[segs.length - 1].arrival?.at).getTime();
  return Math.max(1, Math.round((arr - dep) / 60000));
}
function airlineCode(offer) {
  return offer?.itineraries?.[0]?.segments?.[0]?.carrierCode || 'NA';
}
function airportLabel(code) {
  const a = AIRPORTS.find((x) => x.code === code);
  return a ? `${a.code} • ${a.city}` : code || 'NA';
}

function AirportAutocomplete({ label, value, onSelect }) {
  const [q, setQ] = useState(value || '');
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const s = (q || '').trim().toLowerCase();
    const base = !s
      ? AIRPORTS
      : AIRPORTS.filter((a) =>
          a.code.toLowerCase().includes(s) ||
          a.city.toLowerCase().includes(s) ||
          a.name.toLowerCase().includes(s)
        );
    return base.slice(0, 6);
  }, [q]);

  return (
    <div className="airport-ac-wrap">
      <label>{label}</label>
      <input
        value={q}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          const val = e.target.value.toUpperCase();
          setQ(val);
          onSelect(val);
          setOpen(true);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Type city / code"
      />
      {open && (
        <div className="airport-ac-list">
          {matches.length ? (
            matches.map((a) => (
              <button
                key={a.code}
                type="button"
                className="airport-ac-item"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setQ(a.code);
                  onSelect(a.code);
                  setOpen(false);
                }}
              >
                <span className="airport-code">{a.code}</span>
                <span className="airport-meta">{a.city} • {a.name}</span>
              </button>
            ))
          ) : (
            <div className="airport-ac-empty">No airports found</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FlightsPage() {
  const [query, setQuery] = useState({
    tripType: 'ROUNDTRIP',
    from: 'HYD',
    to: 'BOM',
    depart: depDefault,
    ret: retDefault,
    adults: 1,
    directOnly: false
  });

  const [traveler, setTraveler] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    gender: 'MALE',
    email: '',
    phoneCode: '91',
    phoneNumber: '',
    docType: 'PASSPORT',
    docNumber: '',
    docExpiry: '',
    issuanceCountry: 'IN',
    validityCountry: 'IN',
    nationality: 'IN'
  });

  const [rawOffers, setRawOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('BEST');
  const [maxStops, setMaxStops] = useState('ANY');
  const [selectedAirlines, setSelectedAirlines] = useState([]);
  const [maxPrice, setMaxPrice] = useState('');
  const [page, setPage] = useState(1);

  const [selectedOffer, setSelectedOffer] = useState(null);
  const [priced, setPriced] = useState(null);
  const [booking, setBooking] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState('');

  const onQ = (k, v) => setQuery((s) => ({ ...s, [k]: v }));
  const onT = (k, v) => setTraveler((s) => ({ ...s, [k]: v }));

  const searchFlights = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSelectedOffer(null);
    setPriced(null);
    setBooking(null);
    setBookingSuccess('');
    setPage(1);

    try {
      const params = new URLSearchParams({
        originLocationCode: query.from,
        destinationLocationCode: query.to,
        departureDate: query.depart,
        adults: String(query.adults),
        nonStop: String(query.directOnly),
        currencyCode: 'INR',
        max: '100'
      });
      if (query.tripType === 'ROUNDTRIP' && query.ret) params.set('returnDate', query.ret);

      const res = await fetch(`/api/flights/search?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Search failed');
      setRawOffers(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      setError(err.message || 'Search failed');
      setRawOffers([]);
    } finally {
      setLoading(false);
    }
  };

  const airlineOptions = useMemo(() => [...new Set(rawOffers.map(airlineCode))].sort(), [rawOffers]);

  const filteredSorted = useMemo(() => {
    let list = [...rawOffers];
    if (maxStops !== 'ANY') list = list.filter((o) => offerStops(o) <= Number(maxStops));
    if (selectedAirlines.length) list = list.filter((o) => selectedAirlines.includes(airlineCode(o)));
    if (maxPrice && Number(maxPrice) > 0) list = list.filter((o) => offerPrice(o) <= Number(maxPrice));

    if (activeTab === 'CHEAPEST') list.sort((a, b) => offerPrice(a) - offerPrice(b));
    else if (activeTab === 'FASTEST') list.sort((a, b) => offerDurationMin(a) - offerDurationMin(b));
    else list.sort((a, b) => (offerPrice(a) + offerDurationMin(a) / 1000) - (offerPrice(b) + offerDurationMin(b) / 1000));
    return list;
  }, [rawOffers, maxStops, selectedAirlines, maxPrice, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / PAGE_SIZE));
  const paged = filteredSorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleAirline = (code) => {
    setPage(1);
    setSelectedAirlines((s) => (s.includes(code) ? s.filter((x) => x !== code) : [...s, code]));
  };

  const priceSelected = async () => {
    if (!selectedOffer) return;
    setError('');
    const payload = { data: { type: 'flight-offers-pricing', flightOffers: [selectedOffer] } };
    const res = await fetch('/api/flights/price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) return setError(data?.error || 'Pricing failed');
    setPriced(data);
  };

  const bookSelected = async () => {
    if (!selectedOffer) return;
    setError('');
    setBookingSuccess('');

    const payload = {
      data: {
        type: 'flight-order',
        flightOffers: [selectedOffer],
        travelers: [
          {
            id: '1',
            dateOfBirth: traveler.dob,
            name: {
              firstName: traveler.firstName,
              lastName: traveler.lastName
            },
            gender: traveler.gender,
            contact: {
              emailAddress: traveler.email,
              phones: [
                {
                  deviceType: 'MOBILE',
                  countryCallingCode: traveler.phoneCode,
                  number: traveler.phoneNumber
                }
              ]
            },
            documents: [
              {
                documentType: traveler.docType,
                number: traveler.docNumber,
                expiryDate: traveler.docExpiry,
                issuanceCountry: traveler.issuanceCountry,
                validityCountry: traveler.validityCountry,
                nationality: traveler.nationality,
                holder: true
              }
            ]
          }
        ]
      }
    };

    const res = await fetch('/api/flights/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) return setError(data?.error || 'Booking failed');
    setBooking(data);
    setBookingSuccess('Booking successful! Your flight order has been created.');
  };

  return (
    <main className="flights-page">
      <section className="flight-search-wrap">
        <form className="flight-search-bar" onSubmit={searchFlights}>
          <select value={query.tripType} onChange={(e) => onQ('tripType', e.target.value)}>
            <option value="ROUNDTRIP">Round-trip</option>
            <option value="ONEWAY">One-way</option>
          </select>

          <AirportAutocomplete label="From" value={query.from} onSelect={(code) => onQ('from', code)} />
          <AirportAutocomplete label="To" value={query.to} onSelect={(code) => onQ('to', code)} />

          <input type="date" value={query.depart} onChange={(e) => onQ('depart', e.target.value)} required />
          {query.tripType === 'ROUNDTRIP' && (
            <input type="date" value={query.ret} onChange={(e) => onQ('ret', e.target.value)} required />
          )}
          <input type="number" min="1" max="9" value={query.adults} onChange={(e) => onQ('adults', e.target.value)} />
          <label className="direct-only">
            <input type="checkbox" checked={query.directOnly} onChange={(e) => onQ('directOnly', e.target.checked)} />
            Direct only
          </label>
          <button type="submit" disabled={loading}>{loading ? 'Searching...' : 'Search'}</button>
        </form>
      </section>

      {error ? <p className="flight-error">{error}</p> : null}
      {bookingSuccess ? <p className="flight-success">{bookingSuccess}</p> : null}

      <section className="flight-content">
        <aside className="flight-filters">
          <h3>Filters</h3>
          <label>Max stops</label>
          <select value={maxStops} onChange={(e) => { setMaxStops(e.target.value); setPage(1); }}>
            <option value="ANY">Any</option>
            <option value="0">Direct only</option>
            <option value="1">1 stop max</option>
            <option value="2">2 stops max</option>
          </select>

          <label>Max price (INR)</label>
          <input value={maxPrice} onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }} placeholder="e.g. 15000" />

          <div style={{ marginTop: 12 }}>
            <strong>Airlines</strong>
            {airlineOptions.map((a) => (
              <label key={a} style={{ display: 'block' }}>
                <input type="checkbox" checked={selectedAirlines.includes(a)} onChange={() => toggleAirline(a)} /> {a}
              </label>
            ))}
          </div>
        </aside>

        <div className="flight-results">
          <div className="flight-tabs">
            {['BEST', 'CHEAPEST', 'FASTEST'].map((t) => (
              <button key={t} className={activeTab === t ? 'active' : ''} onClick={() => { setActiveTab(t); setPage(1); }}>
                {t[0] + t.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          <p>Showing {paged.length} of {filteredSorted.length} results</p>

          {loading && Array.from({ length: 5 }).map((_, i) => <div key={i} className="offer-skeleton" />)}

          {!loading && paged.map((offer, idx) => {
            const segs = offer?.itineraries?.[0]?.segments || [];
            const first = segs[0];
            const last = segs[segs.length - 1];
            return (
              <article key={offer.id || idx} className="offer-card">
                <div>
                  <h4>{airlineCode(offer)} • {airportLabel(first?.departure?.iataCode)} → {airportLabel(last?.arrival?.iataCode)}</h4>
                  <p>{new Date(first?.departure?.at).toLocaleString()} - {new Date(last?.arrival?.at).toLocaleString()}</p>
                  <p>{offerStops(offer) === 0 ? 'Direct' : `${offerStops(offer)} stop(s)`}</p>
                </div>
                <div className="offer-right">
                  <strong>{formatMoney(offer?.price?.grandTotal || offer?.price?.total, offer?.price?.currency || 'INR')}</strong>
                  <button onClick={() => { setSelectedOffer(offer); setPriced(null); setBooking(null); }}>
                    View details
                  </button>
                </div>
              </article>
            );
          })}

          <div className="pagination-row">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
            <span>Page {page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        </div>
      </section>

      {selectedOffer && (
        <aside className="offer-sheet">
          <div className="offer-sheet-head">
            <h3>Flight details</h3>
            <button onClick={() => setSelectedOffer(null)}>✕</button>
          </div>

          <h4>Traveler details</h4>
          <div className="traveler-grid">
            <input placeholder="First name" value={traveler.firstName} onChange={(e) => onT('firstName', e.target.value)} />
            <input placeholder="Last name" value={traveler.lastName} onChange={(e) => onT('lastName', e.target.value)} />
            <input type="date" value={traveler.dob} onChange={(e) => onT('dob', e.target.value)} />
            <select value={traveler.gender} onChange={(e) => onT('gender', e.target.value)}>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="UNSPECIFIED">Unspecified</option>
            </select>
            <input placeholder="Email" value={traveler.email} onChange={(e) => onT('email', e.target.value)} />
            <input placeholder="Phone code" value={traveler.phoneCode} onChange={(e) => onT('phoneCode', e.target.value)} />
            <input placeholder="Phone number" value={traveler.phoneNumber} onChange={(e) => onT('phoneNumber', e.target.value)} />
            <select value={traveler.docType} onChange={(e) => onT('docType', e.target.value)}>
              <option value="PASSPORT">Passport</option>
              <option value="ID_CARD">ID Card</option>
              <option value="VISA">Visa</option>
            </select>
            <input placeholder="Document number" value={traveler.docNumber} onChange={(e) => onT('docNumber', e.target.value)} />
            <input type="date" value={traveler.docExpiry} onChange={(e) => onT('docExpiry', e.target.value)} />
          </div>

          <div className="modal-actions">
            <button onClick={priceSelected}>Price</button>
            <button onClick={bookSelected}>Book</button>
          </div>

          {priced && <pre>{JSON.stringify(priced, null, 2)}</pre>}
          {booking && <pre>{JSON.stringify(booking, null, 2)}</pre>}
        </aside>
      )}
    </main>
  );
}