import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { issuesAPI } from '../api';

const CAT_COLORS = { road: '#fb923c', water: '#4f8ef7', electricity: '#fbbd23', waste: '#36d399' };
const SEV_RADIUS = { low: 8, medium: 12, high: 16 };

export default function MapPage() {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        // Fetch all pages (up to 200 issues for the map)
        const { data } = await issuesAPI.list({ page_size: 200, ordering: '-priority_score' });
        setIssues(data.results || data);
      } catch {}
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = issues.filter((i) => {
    if (filterCat && i.category !== filterCat) return false;
    if (filterStatus && i.status !== filterStatus) return false;
    return true;
  });

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Issue Map</h1>
          <p style={styles.sub}>Visualise where issues are clustered across your city</p>
        </div>
        <div style={styles.controls}>
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} style={styles.sel}>
            <option value="">All Categories</option>
            {['road','water','electricity','waste'].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={styles.sel}>
            <option value="">All Statuses</option>
            <option value="reported">Reported</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Legend */}
      <div style={styles.legend}>
        {Object.entries(CAT_COLORS).map(([cat, color]) => (
          <span key={cat} style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: color }} />
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </span>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-dim)' }}>Circle size = severity · {filtered.length} issues shown</span>
      </div>

      <div style={styles.mapWrap}>
        {loading ? (
          <div style={styles.loader}>Loading map data…</div>
        ) : (
          <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            {filtered.map((issue) => (
              <CircleMarker
                key={issue.id}
                center={[issue.latitude, issue.longitude]}
                radius={SEV_RADIUS[issue.severity] || 8}
                pathOptions={{
                  color: CAT_COLORS[issue.category] || '#fff',
                  fillColor: CAT_COLORS[issue.category] || '#fff',
                  fillOpacity: issue.status === 'resolved' ? 0.3 : 0.75,
                  weight: 2,
                }}
              >
                <Popup>
                  <div style={{ fontFamily: 'var(--font-body)', minWidth: '180px' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '6px' }}>{issue.title}</div>
                    <div style={{ fontSize: '0.78rem', color: '#888', marginBottom: '8px' }}>
                      {issue.category} · {issue.severity} severity · {issue.status.replace('_',' ')}
                    </div>
                    <div style={{ fontSize: '0.78rem', marginBottom: '10px' }}>{issue.description.slice(0, 100)}{issue.description.length > 100 ? '…' : ''}</div>
                    <button
                      onClick={() => navigate(`/issues/${issue.id}`)}
                      style={{ background: '#4f8ef7', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}
                    >View Issue →</button>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
}

const styles = {
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', gap: '16px', flexWrap: 'wrap' },
  title: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', letterSpacing: '-0.5px' },
  sub: { color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' },
  controls: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  sel: { minWidth: '150px' },
  legend: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px', flexWrap: 'wrap' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-muted)' },
  legendDot: { width: '10px', height: '10px', borderRadius: '50%', display: 'inline-block' },
  mapWrap: { height: 'calc(100vh - 240px)', minHeight: '400px', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)' },
  loader: { height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' },
};
