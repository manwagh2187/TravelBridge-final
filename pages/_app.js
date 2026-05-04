import '../styles/globals.css';
import { AuthProvider } from '../context/AuthContext';
import Header from '../components/Header';

export default function App({ Component, pageProps }) {
  return (
    <AuthProvider>
      <Header />
      <Component {...pageProps} />
    </AuthProvider>
  );
}