import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      login(data.user);

      const nextPath = typeof router.query.next === 'string' && router.query.next.startsWith('/')
        ? router.query.next
        : '/';

      router.push(nextPath);
    } catch {
      setError('Unable to login right now. Please try again.');
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-grid">
        <section className="auth-copy">
          <div className="eyebrow">Welcome back</div>
          <h1>Sign in to continue your booking journey</h1>
          <p>
            Access your saved bookings, complete reservations faster, and keep track of your trips in one place.
          </p>
        </section>

        <form className="auth-card" onSubmit={handleSubmit}>
          <h2>Login</h2>

          <label>Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
          />

          <label>Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
          />

          {error ? <div className="error">{error}</div> : null}

          <button className="btn btn-primary full" type="submit">
            Login
          </button>

          <div className="auth-link">
            No account? <Link href="/signup">Sign up</Link>
          </div>
        </form>
      </div>
    </div>
  );
}