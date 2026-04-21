import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form);
      navigate('/feed');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.brand}>
          <span style={styles.brandIcon}>◈</span>
          <span style={styles.brandName}>CityScope</span>
        </div>
        <h1 style={styles.title}>Welcome back</h1>
        <p style={styles.sub}>Sign in to report and track city issues</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={submit} style={styles.form}>
          <label style={styles.label}>Username
            <input name="username" value={form.username} onChange={handle} required autoFocus style={{ marginTop: '6px' }} />
          </label>
          <label style={styles.label}>Password
            <input name="password" type="password" value={form.password} onChange={handle} required style={{ marginTop: '6px' }} />
          </label>
          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p style={styles.footer}>Don't have an account? <Link to="/register">Create one →</Link></p>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '24px' },
  card: { width: '100%', maxWidth: '400px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '40px 36px', display: 'flex', flexDirection: 'column', gap: '16px' },
  brand: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' },
  brandIcon: { fontSize: '1.4rem', color: 'var(--accent)' },
  brandName: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem' },
  title: { fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.5px' },
  sub: { color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '-8px' },
  error: { background: 'var(--red-dim)', border: '1px solid var(--red)', color: 'var(--red)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '0.85rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  label: { display: 'flex', flexDirection: 'column', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' },
  btn: { background: 'var(--accent)', color: '#fff', padding: '12px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', marginTop: '4px', border: 'none' },
  footer: { textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' },
};
