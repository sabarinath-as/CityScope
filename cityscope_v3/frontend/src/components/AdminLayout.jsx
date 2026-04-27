import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext'

const NAV = [
  { to: '/admin/dashboard',  label: 'Dashboard',   icon: '◉' },
  { to: '/admin/complaints', label: 'Complaints',  icon: '◈' },
  { to: '/admin/users',      label: 'Users',       icon: '⬡' },
]

export default function AdminLayout() {
  const { admin, logout } = useAdminAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/admin/login') }

  return (
    <div style={s.root}>
      <aside style={s.sidebar}>
        <div style={s.brand}>
          <div style={s.brandIcon}>⚙</div>
          <div>
            <div style={s.brandTitle}>CityScope</div>
            <div style={s.brandSub}>Admin Panel</div>
          </div>
        </div>

        <nav style={s.nav}>
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({ ...s.navItem, ...(isActive ? s.navActive : {}) })}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={s.bottom}>
          <div style={s.userRow}>
            <div style={s.avatar}>{admin?.username?.[0]?.toUpperCase()}</div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{admin?.username}</div>
              <div style={{ fontSize: '0.7rem', color: '#e03131', fontWeight: 600 }}>Administrator</div>
            </div>
          </div>
          <a href="/" target="_blank" rel="noopener noreferrer" style={s.viewSite}>View Public Site →</a>
          <button onClick={handleLogout} style={s.logoutBtn}>Sign Out</button>
        </div>
      </aside>

      <div style={s.main}>
        <header style={s.topbar}>
          <span style={s.adminBadge}>🛡 Admin Mode</span>
        </header>
        <div style={s.content}><Outlet /></div>
      </div>
    </div>
  )
}

const s = {
  root:       { display: 'flex', minHeight: '100vh', background: '#f5f6fa' },
  sidebar:    { width: '230px', background: '#fff', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '24px 14px', position: 'sticky', top: 0, height: '100vh', flexShrink: 0, boxShadow: 'var(--shadow)' },
  brand:      { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' },
  brandIcon:  { width: '38px', height: '38px', background: 'linear-gradient(135deg,#e03131,#f76707)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', color: '#fff', fontWeight: 800, flexShrink: 0 },
  brandTitle: { fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1rem', color: 'var(--text)' },
  brandSub:   { fontSize: '0.7rem', color: '#e03131', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' },
  nav:        { display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 },
  navItem:    { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.88rem', textDecoration: 'none', transition: 'all var(--transition)' },
  navActive:  { background: '#fff0f0', color: '#e03131' },
  bottom:     { borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' },
  userRow:    { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar:     { width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#e03131,#f76707)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0 },
  viewSite:   { fontSize: '0.8rem', color: 'var(--accent)', fontFamily: 'var(--font-display)', fontWeight: 600 },
  logoutBtn:  { background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 'var(--radius-sm)', padding: '7px', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600 },
  main:       { flex: 1, display: 'flex', flexDirection: 'column' },
  topbar:     { height: '56px', background: '#fff', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 28px' },
  adminBadge: { background: '#fff0f0', color: '#e03131', fontSize: '0.78rem', fontWeight: 700, padding: '5px 12px', borderRadius: '20px', fontFamily: 'var(--font-display)' },
  content:    { flex: 1, padding: '28px' },
}
