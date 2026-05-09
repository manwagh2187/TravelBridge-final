import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <header className="tb-topbar">
      <div className="container tb-topbar-inner">
        <Link href="/" className="tb-brand">
          <span className="tb-brand-main">TravelBridge</span>
          <span className="tb-brand-sub">Bharat ka Travel App</span>
        </Link>

        <nav className="tb-nav">
          <Link href="/" className={`tb-nav-link ${router.pathname === '/' ? 'tb-nav-link-active' : ''}`}>
            Hotels
          </Link>
          <Link href="/" className="tb-nav-link">
            Hotels &amp; Homes
          </Link>
          <Link href="/bookings" className={`tb-nav-link ${router.pathname === '/bookings' ? 'tb-nav-link-active' : ''}`}>
            My bookings
          </Link>
        </nav>

        <div className="tb-topbar-actions">
          {isAuthenticated ? (
            <>
              <span className="tb-user">Hi, {user?.name || user?.email || 'Guest'}</span>
              <button className="btn btn-outline tb-header-btn" onClick={handleLogout}>
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