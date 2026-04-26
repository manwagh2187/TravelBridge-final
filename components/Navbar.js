import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
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
    <header className="topbar">
      <div className="container topbar-inner">
        <Link href="/" className="brand">
          TravelBridge
        </Link>

        <nav className="nav">
          <Link href="/" className="nav-link">Home</Link>
          <Link href="/booking/bookings" className="nav-link">My Bookings</Link>

          {!isAuthenticated ? (
            <>
              <Link href="/login" className="nav-link">Login</Link>
              <Link href="/signup" className="btn btn-primary">Sign up</Link>
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
    </header>
  );
}