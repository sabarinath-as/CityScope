import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', first_name: '', last_name: '', password: '', password2: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErrors({}); setLoading(true);
    try {
      await register(form);
      navigate('/feed');
    } catch (err) {
      const data = err.response?.data || {};
      setErrors(typeof data === 'object' ? data : { non_field_errors: ['Registration failed.'] });
    }
    setLoading(false);
  };

  const fieldError = (name) => errors[name] ? <span style={styles.fieldErr}>{errors[name][0]}</span> : null;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.brand}>
          <span style={styles.brandIcon}>◈</span>
          <span style={styles.brandName}>CityScope</span>
        </div>
        <h1 style={styles.title}>Create account</h1>
        <p style={styles.sub}>Join your city's reporting network</p>

        {errors.non_field_errors && <div style={styles.error}>{errors.non_field_errors[0]}</div>}

        <form onSubmit={submit} style={styles.form}>
          <div style={styles.row}>
            <label style={styles.label}>First Name
              <input name="first_name" value={form.first_name} onChange={handle} style={{ marginTop: '6px' }} />
              {fieldError('first_name')}
            </label>
            <label style={styles.label}>Last Name
              <input name="last_name" value={form.last_name} onChange={handle} style={{ marginTop: '6px' }} />
              {fieldError('last_name')}
            </label>
          </div>
          <label style={styles.label}>Username *
            <input name="username" value={form.username} onChange={handle} required style={{ marginTop: '6px' }} />
            {fieldError('username')}
          </label>
          <label style={styles.label}>Email *
            <input name="email" type="email" value={form.email} onChange={handle} required style={{ marginTop: '6px' }} />
            {fieldError('email')}
          </label>
          <label style={styles.label}>Password *
            <input name="password" type="password" value={form.password} onChange={handle} required style={{ marginTop: '6px' }} />
            {fieldError('password')}
          </label>
          <label style={styles.label}>Confirm Password *
            <input name="password2" type="password" value={form.password2} onChange={handle} required style={{ marginTop: '6px' }} />
            {fieldError('password2')}
          </label>
          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p style={styles.footer}>Already have an account? <Link to="/login">Sign in →</Link></p>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '24px' },
  card: { width: '100%', maxWidth: '480px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '40px 36px', display: 'flex', flexDirection: 'column', gap: '14px' },
  brand: { display: 'flex', alignItems: 'center', gap: '8px' },
  brandIcon: { fontSize: '1.4rem', color: 'var(--accent)' },
  brandName: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem' },
  title: { fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.5px' },
  sub: { color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '-6px' },
  error: { background: 'var(--red-dim)', border: '1px solid var(--red)', color: 'var(--red)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '0.85rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '14px' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  label: { display: 'flex', flexDirection: 'column', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' },
  fieldErr: { color: 'var(--red)', fontSize: '0.75rem', marginTop: '4px' },
  btn: { background: 'var(--accent)', color: '#fff', padding: '12px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', marginTop: '4px', border: 'none' },
  footer: { textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' },
};
