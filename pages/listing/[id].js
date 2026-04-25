import { useRouter } from 'next/router';
import useSWR from 'swr';
import Link from 'next/link';

const fetcher = (url) => fetch(url).then(r => r.json());

export default function ListingPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data: listing } = useSWR(id ? `/api/listings?id=${id}` : null, () => fetch(`/api/listings`).then(r => r.json()).then(list => list.find(x => String(x.id) === String(id))));
  if (!listing) return <div>Loading...</div>;
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
      <h1>{listing.title}</h1>
      <div>{listing.city}, {listing.country}</div>
      <p>{listing.description}</p>
      <h3>Rooms</h3>
      {listing.rooms.map(room => (
        <div key={room.id} style={{ border:'1px solid #eee', padding: 8, marginBottom: 8 }}>
          <div>{room.title} — {room.capacity} pax — {room.pricePerNight} (in minor currency units)</div>
          <Link href={`/booking/checkout?roomId=${room.id}`}><a>Book</a></Link>
        </div>
      ))}
    </div>
  );
}