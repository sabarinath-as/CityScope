import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../api';

const NAV = [
  { to: '/feed', label: 'Feed', icon: '◈' },
  { to: '/map', label: 'Map', icon: '⬡' },
  { to: '/dashboard', label: 'Dashboard', icon: '◉' },
  { to: '/report', label: 'Report Issue', icon: '+', highlight: true },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchCount = async () => {
      try {
        const { data } = await notificationsAPI.unreadCount();
        setUnread(data.unread_count);
      } catch {}
    };
    fetchCount();
    const id = setInterval(fetchCount, 30000);
    return () => clearInterval(id);
  }, [user]);

  const handleBell = async () => {
    if (!user) { navigate('/login'); return; }
    setShowNotifs((v) => !v);
    if (!showNotifs) {
      try {
        const { data } = await notificationsAPI.list();
        setNotifs(data.results || data);
        await notificationsAPI.markAllRead();
        setUnread(0);
      } catch {}
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>◈</span>
          <span style={styles.logoText}>CityScope</span>
        </div>
        <nav style={styles.nav}>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                ...styles.navItem,
                ...(item.highlight ? styles.navHighlight : {}),
                ...(isActive && !item.highlight ? styles.navActive : {}),
              })}
            >
              <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div style={styles.sidebarBottom}>
          {user ? (
            <>
              <div style={styles.userBadge}>
                <div style={styles.avatar}>{user.username[0].toUpperCase()}</div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.username}</div>
                  {user.is_staff && <div style={{ fontSize: '0.7rem', color: 'var(--accent)' }}>Admin</div>}
                </div>
              </div>
              <button onClick={handleLogout} style={styles.logoutBtn}>Sign Out</button>
            </>
          ) : (
            <NavLink to="/login" style={styles.loginLink}>Sign In</NavLink>
          )}
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Top bar */}
        <header style={styles.header}>
          <div />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {user && (
              <button onClick={handleBell} style={styles.bellBtn}>
                🔔
                {unread > 0 && <span style={styles.badge}>{unread > 9 ? '9+' : unread}</span>}
              </button>
            )}
          </div>
        </header>

        {/* Notification Dropdown */}
        {showNotifs && (
          <div style={styles.notifDropdown}>
            <div style={styles.notifHeader}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Notifications</span>
              <button onClick={() => setShowNotifs(false)} style={{ background: 'none', color: 'var(--text-muted)', fontSize: '1.1rem' }}>✕</button>
            </div>
            {notifs.length === 0 ? (
              <p style={{ padding: '16px', color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.85rem' }}>No notifications yet</p>
            ) : (
              notifs.slice(0, 10).map((n) => (
                <div key={n.id} style={{ ...styles.notifItem, opacity: n.is_read ? 0.6 : 1 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{n.message}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>{new Date(n.created_at).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>
        )}

        <main style={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const styles = {
  sidebar: { width: '220px', background: 'var(--bg-card)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '24px 16px', position: 'sticky', top: 0, height: '100vh', flexShrink: 0 },
  logo: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '36px', paddingLeft: '4px' },
  logoIcon: { fontSize: '1.5rem', color: 'var(--accent)' },
  logoText: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.5px' },
  nav: { display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 },
  navItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s', textDecoration: 'none' },
  navActive: { background: 'var(--accent-dim)', color: 'var(--accent)' },
  navHighlight: { background: 'var(--accent)', color: '#fff', marginTop: '8px' },
  sidebarBottom: { borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' },
  userBadge: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: { width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.9rem', color: '#fff', flexShrink: 0 },
  logoutBtn: { background: 'transparent', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '6px 0', textAlign: 'left', borderTop: '1px solid var(--border)', cursor: 'pointer' },
  loginLink: { display: 'block', background: 'var(--accent-dim)', color: 'var(--accent)', textAlign: 'center', padding: '10px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem' },
  header: { height: '56px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: 'var(--bg-card)', flexShrink: 0, position: 'sticky', top: 0, zIndex: 100 },
  bellBtn: { position: 'relative', background: 'transparent', fontSize: '1.1rem', padding: '6px', color: 'var(--text-muted)', cursor: 'pointer', border: 'none' },
  badge: { position: 'absolute', top: 0, right: 0, background: 'var(--red)', color: '#fff', fontSize: '0.6rem', fontWeight: 700, borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  notifDropdown: { position: 'fixed', top: '60px', right: '16px', width: '340px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)', zIndex: 999, maxHeight: '400px', overflowY: 'auto' },
  notifHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)' },
  notifItem: { padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer' },
  main: { flex: 1, padding: '24px', overflowY: 'auto' },
};
