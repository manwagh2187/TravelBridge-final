import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Signup failed');
      return;
    }

    login(data.token, data.user);
    router.push('/');
  }

  return (
    <div className="auth-shell">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-badge">Create account</div>
        <h1>Sign up</h1>
        <p>Start booking hotel-style stays in seconds.</p>

        <label>Name</label>
        <input value={name} onChange={e => setName(e.target.value)} type="text" />

        <label>Email</label>
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" />

        <label>Password</label>
        <input value={password} onChange={e => setPassword(e.target.value)} type="password" />

        {error ? <div className="error">{error}</div> : null}

        <button className="btn btn-primary full">Create account</button>
        <div className="auth-link">Already have an account? <a href="/login">Login</a></div>
      </form>

      <style jsx>{`
        .auth-shell {
          min-height: calc(100vh - 76px);
          display: grid;
          place-items: center;
          padding: 28px;
          background: linear-gradient(135deg, #eff6ff, #f8fafc);
        }

        .auth-card {
          width: min(460px, 100%);
          background: white;
          border-radius: 28px;
          padding: 30px;
          box-shadow: var(--shadow);
          border: 1px solid rgba(226,232,240,0.8);
        }

        .auth-badge {
          display: inline-flex;
          background: #eff6ff;
          color: var(--primary);
          padding: 8px 12px;
          border-radius: 999px;
          font-weight: 800;
          margin-bottom: 16px;
        }

        h1 {
          margin: 0 0 8px;
          font-size: 2.2rem;
        }

        p {
          margin: 0 0 20px;
          color: var(--muted);
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
          color: var(--muted);
          text-align: center;
        }
      `}</style>
    </div>
  );
}