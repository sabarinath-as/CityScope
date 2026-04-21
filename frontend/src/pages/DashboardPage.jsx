import { useState, useEffect } from 'react';
import { dashboardAPI } from '../api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from 'recharts';

const CAT_COLORS = { road: '#fb923c', water: '#4f8ef7', electricity: '#fbbd23', waste: '#36d399' };
const STATUS_COLORS = { reported: '#8b90a7', in_progress: '#fbbd23', resolved: '#36d399' };
const SEV_COLORS = { low: '#36d399', medium: '#fbbd23', high: '#f87272' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px', fontSize: '0.82rem' }}>
      <div style={{ fontWeight: 700, marginBottom: '4px' }}>{label}</div>
      {payload.map((p, i) => <div key={i} style={{ color: p.color }}>{p.name}: {p.value}</div>)}
    </div>
  );
};

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await dashboardAPI.stats();
        setStats(data);
      } catch {}
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <div style={styles.loader}>Loading dashboard…</div>;
  if (!stats) return <div style={styles.loader}>Failed to load dashboard data.</div>;

  const categoryData = Object.entries(stats.issues_by_category || {}).map(([name, value]) => ({ name: name.charAt(0).toUpperCase()+name.slice(1), value }));
  const statusData = Object.entries(stats.issues_by_status || {}).map(([name, value]) => ({ name: name.replace('_',' '), value, color: STATUS_COLORS[name] || '#8b90a7' }));
  const severityData = Object.entries(stats.issues_by_severity || {}).map(([name, value]) => ({ name: name.charAt(0).toUpperCase()+name.slice(1), value, color: SEV_COLORS[name] || '#8b90a7' }));
  const trendData = (stats.resolution_trend || []).slice(-14).map((d) => ({ date: d.date.slice(5), count: d.count }));

  const statCards = [
    { label: 'Total Issues', value: stats.total_issues, color: 'var(--accent)', icon: '◈' },
    { label: 'Resolved (30d)', value: stats.recent_resolved, color: 'var(--green)', icon: '✓' },
    { label: 'In Progress', value: stats.issues_by_status?.in_progress || 0, color: 'var(--yellow)', icon: '⟳' },
    { label: 'High Severity', value: stats.issues_by_severity?.high || 0, color: 'var(--red)', icon: '!' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={styles.title}>Dashboard</h1>
        <p style={styles.sub}>City-wide issue analytics and resolution trends</p>
      </div>

      {/* Stat Cards */}
      <div style={styles.statGrid}>
        {statCards.map((s) => (
          <div key={s.label} style={{ ...styles.statCard, borderColor: s.color + '44' }}>
            <div style={{ ...styles.statIcon, color: s.color }}>{s.icon}</div>
            <div style={styles.statValue}>{s.value}</div>
            <div style={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div style={styles.chartGrid}>
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Issues by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {categoryData.map((entry, i) => (
                  <Cell key={i} fill={CAT_COLORS[entry.name.toLowerCase()] || 'var(--accent)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Severity Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={severityData} layout="vertical" margin={{ top: 8, right: 8, left: 24, bottom: 0 }}>
              <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {severityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Resolution Trend */}
      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>Resolution Trend (Last 14 Days)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={trendData} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="count" stroke="var(--green)" strokeWidth={2.5} dot={{ fill: 'var(--green)', r: 4 }} name="Resolved" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top Areas */}
      {stats.top_areas?.length > 0 && (
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Most Affected Areas (Top 10 Location Clusters)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', marginTop: '12px' }}>
            {stats.top_areas.map((area, i) => (
              <div key={i} style={styles.areaCard}>
                <div style={styles.areaRank}>#{i + 1}</div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{area.lat}°N, {area.lng}°E</div>
                  <div style={{ fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-display)' }}>{area.count} issues</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  title: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', letterSpacing: '-0.5px' },
  sub: { color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' },
  loader: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' },
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' },
  statCard: { background: 'var(--bg-card)', border: '1px solid', borderRadius: 'var(--radius)', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '6px' },
  statIcon: { fontSize: '1.2rem', fontWeight: 800, fontFamily: 'var(--font-display)' },
  statValue: { fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1 },
  statLabel: { fontSize: '0.8rem', color: 'var(--text-muted)' },
  chartGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '16px' },
  chartCard: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px', marginBottom: '16px' },
  chartTitle: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '12px' },
  areaCard: { background: 'var(--bg-raised)', borderRadius: 'var(--radius-sm)', padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' },
  areaRank: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-dim)', minWidth: '28px' },
};
