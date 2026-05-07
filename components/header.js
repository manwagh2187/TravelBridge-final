import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const displayName =
    typeof user?.name === 'string' && user.name.trim()
      ? user.name
      : typeof user?.email === 'string'
        ? user.email
        : 'User';

  return (
    <header className="em-header">
      <div className="container em-header-inner">
        <div className="em-brand">
          <span className="em-brand-main">TravelBridge</span>
          <span className="em-brand-sub">Bharat ka Travel App</span>
        </div>

        <nav className="em-nav">
          <Link href="/">Hotels</Link>
          <Link href="/">Hotels & Homes</Link>
        </nav>

        <div className="em-actions">
          <Link href="/" className="em-link">
            Customer Service
          </Link>
          <Link href="/" className="em-link">
            India
          </Link>

          {!isAuthenticated ? (
            <Link href="/login" className="btn btn-primary em-login-btn">
              Login or Signup
            </Link>
          ) : (
            <>
              <span className="user-pill">Hi, {displayName}</span>
              <button onClick={handleLogout} className="btn btn-outline">
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}