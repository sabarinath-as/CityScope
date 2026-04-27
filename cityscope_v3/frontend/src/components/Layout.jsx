import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { notifAPI } from '../api'

const NAV = [
  { to: '/feed',      label: 'Issue Feed',   icon: '◈' },
  { to: '/map',       label: 'Map View',     icon: '⬡' },
  { to: '/dashboard', label: 'Dashboard',    icon: '◉' },
  { to: '/report',    label: 'Report Issue', icon: '+', primary: true },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [unread, setUnread]       = useState(0)
  const [notifs, setNotifs]       = useState([])
  const [showNotifs, setShowNotifs] = useState(false)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try { const { data } = await notifAPI.unreadCount(); setUnread(data.unread_count) } catch {}
    }
    load()
    const id = setInterval(load, 30000)
    return () => clearInterval(id)
  }, [user])

  const handleBell = async () => {
    if (!user) { navigate('/login'); return }
    setShowNotifs(v => !v)
    if (!showNotifs) {
      try {
        const { data } = await notifAPI.list()
        setNotifs(data.results || data)
        await notifAPI.markAllRead()
        setUnread(0)
      } catch {}
    }
  }

  return (
    <div style={s.root}>
      {/* Sidebar */}
      <aside style={s.sidebar}>
        <div style={s.brand}>
          <div style={s.brandDot} />
          <span style={s.brandName}>CityScope</span>
        </div>

        <nav style={s.nav}>
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                ...s.navItem,
                ...(item.primary  ? s.navPrimary : {}),
                ...(isActive && !item.primary ? s.navActive : {}),
              })}
            >
              <span style={{ fontSize: '1rem', lineHeight: 1 }}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={s.bottom}>
          {user ? (
            <>
              <div style={s.userRow}>
                <div style={s.avatar}>{user.username[0].toUpperCase()}</div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, fontFamily: 'var(--font-display)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user.username}
                  </div>
                  {user.is_staff && <div style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 600 }}>Admin</div>}
                </div>
              </div>
              <button onClick={async () => { await logout(); navigate('/login') }} style={s.logoutBtn}>
                Sign Out
              </button>
            </>
          ) : (
            <NavLink to="/login" style={s.signInBtn}>Sign In</NavLink>
          )}
        </div>
      </aside>

      {/* Main area */}
      <div style={s.main}>
        {/* Topbar */}
        <header style={s.topbar}>
          <div />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {user && (
              <button onClick={handleBell} style={s.bell}>
                🔔
                {unread > 0 && <span style={s.badge}>{unread > 9 ? '9+' : unread}</span>}
              </button>
            )}
          </div>
        </header>

        {/* Notification dropdown */}
        {showNotifs && (
          <div style={s.notifBox}>
            <div style={s.notifHead}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem' }}>Notifications</span>
              <button onClick={() => setShowNotifs(false)} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
            </div>
            {notifs.length === 0
              ? <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>No notifications yet</p>
              : notifs.slice(0, 10).map(n => (
                <div key={n.id} style={{ ...s.notifItem, opacity: n.is_read ? 0.55 : 1 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 500 }}>{n.message}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                    {new Date(n.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            }
          </div>
        )}

        <div style={s.content}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}

const s = {
  root:      { display: 'flex', minHeight: '100vh' },
  sidebar:   { width: '220px', background: 'var(--bg-card)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '24px 14px', position: 'sticky', top: 0, height: '100vh', flexShrink: 0, boxShadow: 'var(--shadow)' },
  brand:     { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px', paddingLeft: '6px' },
  brandDot:  { width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 },
  brandName: { fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.2rem', color: 'var(--accent)', letterSpacing: '-0.5px' },
  nav:       { display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 },
  navItem:   { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.88rem', textDecoration: 'none', transition: 'all var(--transition)' },
  navActive: { background: 'var(--accent-light)', color: 'var(--accent)' },
  navPrimary:{ background: 'var(--accent)', color: '#fff', marginTop: '8px', justifyContent: 'center' },
  bottom:    { borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' },
  userRow:   { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar:    { width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0 },
  logoutBtn: { background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 'var(--radius-sm)', padding: '7px', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600 },
  signInBtn: { background: 'var(--accent-light)', color: 'var(--accent)', textAlign: 'center', padding: '10px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none' },
  main:      { flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' },
  topbar:    { height: '56px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100, flexShrink: 0 },
  bell:      { position: 'relative', background: 'transparent', border: 'none', fontSize: '1.1rem', cursor: 'pointer', padding: '6px', color: 'var(--text-muted)' },
  badge:     { position: 'absolute', top: 0, right: 0, background: 'var(--red)', color: '#fff', fontSize: '0.6rem', fontWeight: 700, borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  notifBox:  { position: 'fixed', top: '62px', right: '16px', width: '320px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-lg)', zIndex: 999, maxHeight: '400px', overflowY: 'auto' },
  notifHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--border)' },
  notifItem: { padding: '12px 16px', borderBottom: '1px solid var(--border)' },
  content:   { flex: 1, padding: '28px' },
}
