import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function Success() {
  const router = useRouter();
  const { session_id } = router.query;
  const [message, setMessage] = useState('Checking payment...');

  useEffect(() => {
    if (!session_id) return;
    setMessage('Payment successful — your booking will be confirmed shortly.');
  }, [session_id]);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 20 }}>
      <h2>Payment success</h2>
      <p>{message}</p>
      <p><a href="/">Return home</a></p>
    </div>
  );
}