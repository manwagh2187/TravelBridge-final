import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, isAuthenticated, loading, logout } = useAuth();

  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <Link href="/" className="brand">
          TravelBridge
        </Link>

        <nav className="nav">
          <Link href="/" className="nav-link">
            Home
          </Link>
          <Link href="/booking/bookings" className="nav-link">
            My Bookings
          </Link>

          {!loading && isAuthenticated ? (
            <>
              <span className="user-pill">Hi, {user?.name || user?.email || 'User'}</span>
              <button className="btn btn-outline" type="button" onClick={logout}>
                Logout
              </button>
            </>
          ) : null}

          {!loading && !isAuthenticated ? (
            <>
              <Link href="/login" className="nav-link">
                Login
              </Link>
              <Link href="/signup" className="btn btn-primary">
                Sign up
              </Link>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}