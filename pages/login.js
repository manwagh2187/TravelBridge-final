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

    login(data.token, data.user);
    router.push('/');
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
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@example.com" />

          <label>Password</label>
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="••••••••" />

          {error ? <div className="error">{error}</div> : null}

          <button className="btn btn-primary full">Login</button>

          <div className="auth-link">
            No account? <Link href="/signup">Sign up</Link>
          </div>
        </form>
      </div>

      <style jsx>{`
        .auth-shell {
          min-height: calc(100vh - 76px);
          display: grid;
          place-items: center;
          padding: 32px 16px;
          background: linear-gradient(180deg, #f5f3ef 0%, #efe8df 100%);
        }

        .auth-grid {
          width: min(1120px, 100%);
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 24px;
          align-items: center;
        }

        .auth-copy {
          padding: 20px 0;
        }

        .eyebrow {
          display: inline-flex;
          background: #fff7ed;
          color: #92400e;
          padding: 8px 12px;
          border-radius: 999px;
          font-weight: 800;
          margin-bottom: 16px;
        }

        h1 {
          margin: 0 0 12px;
          font-size: clamp(2.4rem, 4vw, 4.3rem);
          letter-spacing: -0.05em;
          line-height: 0.98;
          max-width: 11ch;
        }

        p {
          color: var(--muted);
          line-height: 1.8;
          max-width: 54ch;
        }

        .auth-card {
          background: white;
          border-radius: 30px;
          padding: 30px;
          box-shadow: var(--shadow);
          border: 1px solid rgba(226,232,240,0.85);
        }

        .auth-card h2 {
          margin: 0 0 18px;
          font-size: 1.8rem;
        }

        label {
          display: block;
          font-weight: 700;
          margin: 14px 0 8px;
        }

        input {
          width: 100%;
          padding: 14px 16px;
          border-radius: 16px;
          border: 1px solid var(--line);
          outline: none;
          font-size: 1rem;
          background: white;
        }

        .error {
          background: #fef2f2;
          color: #b91c1c;
          padding: 12px;
          border-radius: 14px;
          margin-top: 14px;
          font-weight: 600;
        }

        .full {
          width: 100%;
          margin-top: 18px;
          padding: 14px 18px;
        }

        .auth-link {
          margin-top: 16px;
          text-align: center;
          color: var(--muted);
        }

        .auth-link a {
          color: #b45309;
          font-weight: 800;
        }

        @media (max-width: 920px) {
          .auth-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}