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

  const isActive = (path) => router.pathname === path;

  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <Link href="/" className="brand">
          TravelBridge
        </Link>

        <nav className="nav">
          <Link href="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            Home
          </Link>
          <Link href="/booking/bookings" className={`nav-link ${isActive('/booking/bookings') ? 'active' : ''}`}>
            My Bookings
          </Link>

          {!isAuthenticated ? (
            <>
              <Link href="/login" className={`nav-link ${isActive('/login') ? 'active' : ''}`}>
                Login
              </Link>
              <Link href="/signup" className="btn btn-primary">
                Sign up
              </Link>
            </>
          ) : (
            <>
              <span className="user-pill">Hi, {displayName}</span>
              <button onClick={handleLogout} className="btn btn-outline">
                Logout
              </button>
            </>
          )}
        </nav>
      </div>

      <style jsx>{`
        .nav-link.active {
          color: var(--text);
        }

        @media (max-width: 720px) {
          .topbar-inner {
            flex-direction: column;
            align-items: flex-start;
            padding: 14px 0;
          }

          .nav {
            width: 100%;
          }
        }
      `}</style>
    </header>
  );
}