import Link from 'next/link';
import useSWR from 'swr';
import { useState } from 'react';

const fetcher = (url) => fetch(url).then(r => r.json());

export default function Home() {
  const [city, setCity] = useState('');
  const { data: listings } = useSWR(city ? `/api/listings?city=${encodeURIComponent(city)}` : null, fetcher);
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
      <h1>TravelBridge</h1>
      <div>
        <input placeholder="Search city" value={city} onChange={e => setCity(e.target.value)} />
      </div>
      <div style={{ marginTop: 20 }}>
        {listings?.map(l => (
          <div key={l.id} style={{ border: '1px solid #ddd', padding: 12, marginBottom: 12 }}>
            <h3><Link href={`/listing/${l.id}`}><a>{l.title}</a></Link></h3>
            <div>{l.city}, {l.country}</div>
            <div>{l.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}