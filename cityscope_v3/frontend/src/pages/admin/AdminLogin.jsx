import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../../context/AdminAuthContext'

export default function AdminLogin() {
  const { login } = useAdminAuth()
  const navigate  = useNavigate()
  const [form, setForm]   = useState({ username:'', password:'' })
  const [error, setError] = useState('')
  const [busy, setBusy]   = useState(false)

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async e => {
    e.preventDefault(); setError(''); setBusy(true)
    try { await login(form); navigate('/admin/dashboard') }
    catch (err) { setError(err.response?.data?.detail || 'Invalid credentials or no admin access.') }
    setBusy(false)
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        {/* Brand */}
        <div style={s.brand}>
          <div style={s.brandIcon}>⚙</div>
          <div>
            <div style={s.brandTitle}>CityScope</div>
            <div style={s.brandSub}>Administrator Portal</div>
          </div>
        </div>

        <h1 style={s.title}>Admin Sign In</h1>
        <p style={s.sub}>Restricted to authorised administrators only.</p>

        {error && <div style={s.err}>⚠ {error}</div>}

        <form onSubmit={submit} style={s.form}>
          <label style={s.label}>
            Username
            <input name="username" value={form.username} onChange={handle} required autoFocus placeholder="Admin username" style={{ marginTop:'6px' }} />
          </label>
          <label style={s.label}>
            Password
            <input name="password" type="password" value={form.password} onChange={handle} required placeholder="••••••••" style={{ marginTop:'6px' }} />
          </label>
          <button type="submit" disabled={busy} style={s.btn}>
            {busy ? 'Authenticating…' : '🔐 Sign In as Admin'}
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:'8px' }}>
          <a href="/" style={{ fontSize:'0.82rem', color:'var(--text-dim)' }}>← Back to public site</a>
        </p>
      </div>
    </div>
  )
}

const s = {
  page:      { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:'24px' },
  card:      { width:'100%', maxWidth:'400px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'40px 36px', boxShadow:'var(--shadow-md)', display:'flex', flexDirection:'column', gap:'16px' },
  brand:     { display:'flex', alignItems:'center', gap:'12px' },
  brandIcon: { width:'40px', height:'40px', background:'linear-gradient(135deg,#e03131,#f76707)', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem', color:'#fff', fontWeight:800, flexShrink:0 },
  brandTitle:{ fontFamily:'var(--font-display)', fontWeight:900, fontSize:'1.05rem', color:'var(--text)' },
  brandSub:  { fontSize:'0.7rem', color:'#e03131', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px' },
  title:     { fontFamily:'var(--font-display)', fontSize:'1.7rem', fontWeight:800, letterSpacing:'-0.5px' },
  sub:       { color:'var(--text-muted)', fontSize:'0.85rem', marginTop:'-10px', lineHeight:1.5 },
  err:       { background:'var(--red-light)', border:'1px solid var(--red)', color:'var(--red)', borderRadius:'var(--radius-sm)', padding:'11px 14px', fontSize:'0.85rem' },
  form:      { display:'flex', flexDirection:'column', gap:'14px' },
  label:     { display:'flex', flexDirection:'column', fontSize:'0.83rem', fontWeight:600, color:'var(--text-muted)' },
  btn:       { background:'linear-gradient(135deg,#e03131,#f76707)', color:'#fff', border:'none', borderRadius:'var(--radius-sm)', padding:'13px', fontFamily:'var(--font-display)', fontWeight:700, fontSize:'0.95rem', cursor:'pointer', marginTop:'4px' },
}
