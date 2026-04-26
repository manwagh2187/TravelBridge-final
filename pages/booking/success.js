import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function SuccessPage() {
  const router = useRouter();
  const { session_id } = router.query;
  const [message, setMessage] = useState('Checking payment...');

  useEffect(() => {
    if (!session_id) return;
    setMessage('Payment successful — your booking will be confirmed shortly.');
  }, [session_id]);

  return (
    <div className="container" style={{ padding: '40px 0' }}>
      <h1>Payment success</h1>
      <p>{message}</p>
      <a href="/" className="btn btn-primary">Back to home</a>
    </div>
  );
}