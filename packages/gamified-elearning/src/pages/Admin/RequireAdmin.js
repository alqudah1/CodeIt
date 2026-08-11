import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

/**
 * Wraps admin routes. Redirects to /login if not authenticated,
 * or shows 403 if authenticated but not an admin.
 */
const RequireAdmin = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={styles.loading} role="status">
        Checking your admin account…
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if ((user.role || '').toLowerCase() !== 'admin' && !user.is_admin) {
    return (
      <div style={styles.denied}>
        <h2 style={styles.deniedTitle}>Access Denied</h2>
        <p style={styles.deniedSub}>Your account does not have admin access.</p>
        <a href="/" style={styles.deniedLink}>Go to home</a>
      </div>
    );
  }

  return children;
};

const styles = {
  loading: {
    minHeight: '100vh', display: 'grid', placeItems: 'center',
    background: '#fff8f1', color: '#38291f',
    fontFamily: "'Nunito', sans-serif", fontWeight: 800,
  },
  denied: {
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: '#f0f2f5', fontFamily: "'Nunito', sans-serif",
  },
  deniedTitle: { fontSize: '1.5rem', color: '#e53e3e', margin: '0 0 0.5rem' },
  deniedSub:   { color: '#555', margin: '0 0 1.25rem' },
  deniedLink:  { color: '#6c63ff', fontWeight: 700 },
};

export default RequireAdmin;
