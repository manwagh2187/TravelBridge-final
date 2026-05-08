import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="em-header">
      <div className="container em-header-inner">
        <Link href="/" className="em-brand">
          <span className="em-brand-main">TravelBridge</span>
          <span className="em-brand-sub">Bharat ka Travel App</span>
        </Link>

        <nav className="em-nav">
          <Link href="/?type=hotels" className="em-link">
            Hotels
          </Link>
          <Link href="/?type=homes" className="em-link">
            Hotels &amp; Homes
          </Link>
          <Link href="/bookings" className="em-link em-bookings-link">
            My bookings
          </Link>
        </nav>

        <div className="em-actions">
          <Link href="/bookings" className="btn btn-outline em-login-btn">
            My bookings
          </Link>

          {isAuthenticated ? (
            <>
              <span className="em-link">Hi, {user?.name || 'Guest'}</span>
              <button
                type="button"
                className="btn btn-outline em-login-btn"
                onClick={() => {
                  logout?.();
                  router.push('/');
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <Link href="/login" className="btn btn-primary em-login-btn">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}