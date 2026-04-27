import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [form, setForm]   = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy]   = useState(false)

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async e => {
    e.preventDefault(); setError(''); setBusy(true)
    try { await login(form); navigate('/feed') }
    catch (err) { setError(err.response?.data?.detail || 'Invalid username or password.') }
    setBusy(false)
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.brand}>
          <div style={s.dot} />
          <span style={s.brandName}>CityScope</span>
        </div>
        <h1 style={s.title}>Welcome back</h1>
        <p style={s.sub}>Sign in to report and track city issues</p>

        {error && <div style={s.err}>{error}</div>}

        <form onSubmit={submit} style={s.form}>
          <label style={s.label}>
            Username
            <input name="username" value={form.username} onChange={handle} required autoFocus style={s.input} placeholder="Enter your username" />
          </label>
          <label style={s.label}>
            Password
            <input name="password" type="password" value={form.password} onChange={handle} required style={s.input} placeholder="••••••••" />
          </label>
          <button type="submit" disabled={busy} style={s.btn}>{busy ? 'Signing in…' : 'Sign In'}</button>
        </form>

        <p style={s.footer}>Don't have an account? <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>Register →</Link></p>
        <p style={s.footer}><Link to="/admin/login" style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>Admin login →</Link></p>
      </div>
    </div>
  )
}

const s = {
  page:      { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '24px' },
  card:      { width: '100%', maxWidth: '400px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '40px 36px', boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column', gap: '16px' },
  brand:     { display: 'flex', alignItems: 'center', gap: '8px' },
  dot:       { width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent)' },
  brandName: { fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.1rem', color: 'var(--accent)' },
  title:     { fontFamily: 'var(--font-display)', fontSize: '1.7rem', fontWeight: 800, letterSpacing: '-0.5px' },
  sub:       { color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '-8px' },
  err:       { background: 'var(--red-light)', border: '1px solid var(--red)', color: 'var(--red)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '0.85rem' },
  form:      { display: 'flex', flexDirection: 'column', gap: '14px' },
  label:     { display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-muted)' },
  input:     {},
  btn:       { background: 'var(--accent)', color: '#fff', padding: '12px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', marginTop: '4px', border: 'none' },
  footer:    { textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' },
}
