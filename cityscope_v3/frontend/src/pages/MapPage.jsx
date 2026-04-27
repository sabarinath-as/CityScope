import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { issuesAPI } from '../api'

const CAT_COLOR = { road:'#f76707', water:'#4361ee', electricity:'#f4a100', waste:'#0caf60' }
const SEV_RADIUS = { low:7, medium:12, high:17 }

export default function MapPage() {
  const navigate = useNavigate()
  const [issues,  setIssues]  = useState([])
  const [loading, setLoading] = useState(true)
  const [catF,    setCatF]    = useState('')
  const [statusF, setStatusF] = useState('')

  useEffect(() => {
    issuesAPI.list({ page_size: 500, ordering: '-priority_score' })
      .then(({ data }) => setIssues(data.results || data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = issues.filter(i => {
    if (catF    && i.category !== catF)    return false
    if (statusF && i.status   !== statusF) return false
    return true
  })

  return (
    <div>
      <div style={s.hdr}>
        <div>
          <h1 style={s.title}>Issue Map</h1>
          <p style={s.sub}>Geographic view of all reported city issues</p>
        </div>
        <div style={s.controls}>
          <select value={catF} onChange={e => setCatF(e.target.value)} style={s.sel}>
            <option value="">All Categories</option>
            {['road','water','electricity','waste'].map(c =>
              <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>
            )}
          </select>
          <select value={statusF} onChange={e => setStatusF(e.target.value)} style={s.sel}>
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Legend */}
      <div style={s.legend}>
        {Object.entries(CAT_COLOR).map(([cat, color]) => (
          <span key={cat} style={s.legendItem}>
            <span style={{ ...s.dot, background: color }} />
            {cat.charAt(0).toUpperCase()+cat.slice(1)}
          </span>
        ))}
        <span style={{ marginLeft:'auto', fontSize:'0.78rem', color:'var(--text-dim)' }}>
          Circle size = severity · {filtered.length} issues shown
        </span>
      </div>

      <div style={s.mapWrap}>
        {loading
          ? <div style={s.loader}>Loading map data…</div>
          : (
            <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height:'100%', width:'100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              {filtered.map(issue => (
                <CircleMarker
                  key={issue.id}
                  center={[issue.latitude, issue.longitude]}
                  radius={SEV_RADIUS[issue.severity] || 8}
                  pathOptions={{
                    color:       CAT_COLOR[issue.category] || '#4361ee',
                    fillColor:   CAT_COLOR[issue.category] || '#4361ee',
                    fillOpacity: issue.status === 'resolved' ? 0.25 : 0.7,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div style={{ fontFamily:'var(--font-body)', minWidth:'180px' }}>
                      <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'0.92rem', marginBottom:'6px' }}>
                        {issue.title}
                      </div>
                      <div style={{ fontSize:'0.75rem', color:'#5a6082', marginBottom:'8px' }}>
                        {issue.category} · {issue.severity} · {issue.status.replace('_',' ')}
                      </div>
                      <div style={{ fontSize:'0.78rem', marginBottom:'10px', color:'#1a1d2e' }}>
                        {issue.description.slice(0, 100)}{issue.description.length > 100 ? '…' : ''}
                      </div>
                      <button
                        onClick={() => navigate(`/issues/${issue.id}`)}
                        style={{ background:'#4361ee', color:'#fff', border:'none', borderRadius:'6px', padding:'6px 14px', cursor:'pointer', fontSize:'0.78rem', fontWeight:700, fontFamily:'var(--font-display)' }}
                      >
                        View Issue →
                      </button>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          )
        }
      </div>
    </div>
  )
}

const s = {
  hdr:        { display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'16px', gap:'16px', flexWrap:'wrap' },
  title: { fontFamily:'var(--font-display)', fontWeight:800, fontSize:'2.4rem', letterSpacing:'-0.05em', lineHeight:1.1 },
  sub:   { color:'var(--text-muted)', fontSize:'1.05rem', marginTop:'8px', fontWeight:400 },
  controls:   { display:'flex', gap:'8px', flexWrap:'wrap' },
  sel:        { minWidth:'150px' },
  legend:     { display:'flex', alignItems:'center', gap:'16px', marginBottom:'12px', flexWrap:'wrap' },
  legendItem: { display:'flex', alignItems:'center', gap:'6px', fontSize:'0.82rem', color:'var(--text-muted)' },
  dot:        { width:'10px', height:'10px', borderRadius:'50%', display:'inline-block', flexShrink:0 },
  mapWrap:    { height:'calc(100vh - 240px)', minHeight:'400px', borderRadius:'var(--radius)', overflow:'hidden', border:'1px solid var(--border)', boxShadow:'var(--shadow)' },
  loader:     { height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)' },
}
