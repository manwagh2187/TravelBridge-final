import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="tb-topbar">
      <div className="container tb-topbar-inner">
        <Link href="/" className="tb-brand">
          <span className="tb-brand-main">TravelBridge</span>
          <span className="tb-brand-sub">Bharat ka Travel App</span>
        </Link>

        <nav className="tb-nav">
          <Link href="/" className="tb-nav-link">
            Hotels
          </Link>
          <Link href="/" className="tb-nav-link">
            Hotels &amp; Homes
          </Link>
          <Link href="/bookings" className="tb-nav-link tb-nav-link-active">
            My bookings
          </Link>
        </nav>

        <div className="tb-topbar-actions">
          {isAuthenticated ? (
            <>
              <span className="tb-user">Hi, {user?.name || 'Guest'}</span>
              <button
                type="button"
                className="btn btn-outline tb-header-btn"
                onClick={() => {
                  logout?.();
                  router.push('/');
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <Link href="/login" className="btn btn-primary tb-header-btn">
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}