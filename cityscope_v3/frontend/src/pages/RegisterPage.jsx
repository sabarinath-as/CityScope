import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm]     = useState({ username:'', email:'', first_name:'', last_name:'', password:'', password2:'' })
  const [errors, setErrors] = useState({})
  const [busy, setBusy]     = useState(false)

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async e => {
    e.preventDefault(); setErrors({}); setBusy(true)
    try { await register(form); navigate('/feed') }
    catch (err) {
      const d = err.response?.data || {}
      setErrors(typeof d === 'object' ? d : { detail: ['Registration failed.'] })
    }
    setBusy(false)
  }

  const fe = k => errors[k] ? <span style={{ color:'var(--red)', fontSize:'0.75rem', marginTop:'2px' }}>{errors[k][0]}</span> : null

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.brand}>
          <div style={s.dot} />
          <span style={s.brandName}>CityScope</span>
        </div>
        <h1 style={s.title}>Create account</h1>
        <p style={s.sub}>Join your city's reporting network</p>

        {errors.detail && <div style={s.err}>{errors.detail[0]}</div>}

        <form onSubmit={submit} style={s.form}>
          <div style={s.row}>
            <label style={s.label}>First Name{fe('first_name')}
              <input name="first_name" value={form.first_name} onChange={handle} style={s.input} />
            </label>
            <label style={s.label}>Last Name{fe('last_name')}
              <input name="last_name" value={form.last_name} onChange={handle} style={s.input} />
            </label>
          </div>
          <label style={s.label}>Username *{fe('username')}
            <input name="username" value={form.username} onChange={handle} required style={s.input} />
          </label>
          <label style={s.label}>Email *{fe('email')}
            <input name="email" type="email" value={form.email} onChange={handle} required style={s.input} />
          </label>
          <label style={s.label}>Password *{fe('password')}
            <input name="password" type="password" value={form.password} onChange={handle} required style={s.input} />
          </label>
          <label style={s.label}>Confirm Password *{fe('password2')}
            <input name="password2" type="password" value={form.password2} onChange={handle} required style={s.input} />
          </label>
          <button type="submit" disabled={busy} style={s.btn}>{busy ? 'Creating account…' : 'Create Account'}</button>
        </form>
        <p style={s.footer}>Already have an account? <Link to="/login" style={{ color:'var(--accent)', fontWeight:600 }}>Sign in →</Link></p>
      </div>
    </div>
  )
}

const s = {
  page:  { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)', padding:'24px' },
  card:  { width:'100%', maxWidth:'460px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', padding:'40px 36px', boxShadow:'var(--shadow-md)', display:'flex', flexDirection:'column', gap:'14px' },
  brand: { display:'flex', alignItems:'center', gap:'8px' },
  dot:   { width:'10px', height:'10px', borderRadius:'50%', background:'var(--accent)' },
  brandName: { fontFamily:'var(--font-display)', fontWeight:900, fontSize:'1.1rem', color:'var(--accent)' },
  title: { fontFamily:'var(--font-display)', fontSize:'1.7rem', fontWeight:800, letterSpacing:'-0.5px' },
  sub:   { color:'var(--text-muted)', fontSize:'0.88rem', marginTop:'-8px' },
  err:   { background:'var(--red-light)', border:'1px solid var(--red)', color:'var(--red)', borderRadius:'var(--radius-sm)', padding:'10px 14px', fontSize:'0.85rem' },
  form:  { display:'flex', flexDirection:'column', gap:'12px' },
  row:   { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' },
  label: { display:'flex', flexDirection:'column', gap:'4px', fontSize:'0.83rem', fontWeight:600, color:'var(--text-muted)' },
  input: {},
  btn:   { background:'var(--accent)', color:'#fff', padding:'12px', borderRadius:'var(--radius-sm)', fontFamily:'var(--font-display)', fontWeight:700, fontSize:'1rem', cursor:'pointer', marginTop:'4px', border:'none' },
  footer:{ textAlign:'center', fontSize:'0.85rem', color:'var(--text-muted)' },
}
