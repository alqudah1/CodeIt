import { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import './AdminLayout.css';

const NAV = [
  { to: '/admin', label: 'Overview', icon: '▦', end: true },
  { to: '/admin/evidence', label: 'Evidence', icon: '◆' },
  { to: '/admin/users', label: 'Users', icon: '◎' },
  { to: '/admin/stats', label: 'Stats', icon: '◈' },
  { to: '/admin/funnel', label: 'Funnel', icon: '↗' },
  { to: '/admin/avatars', label: 'Avatars', icon: '✦' },
];

const AdminLayout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="adm-shell">
      <aside className="adm-sidebar">
        <div className="adm-logo"><span>Code</span>It Admin</div>
        <nav className="adm-nav">
          {NAV.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => isActive ? 'active' : undefined}
            >
              <span className="adm-nav-icon">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="adm-sidebar-footer">
          <div style={{ marginBottom: '0.25rem', color: '#72594d', fontSize: '0.8rem' }}>
            {user?.name || user?.username || 'Admin'}
          </div>
          <button className="adm-logout-btn" onClick={handleLogout}>Sign out</button>
        </div>
      </aside>
      <main className="adm-main">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
