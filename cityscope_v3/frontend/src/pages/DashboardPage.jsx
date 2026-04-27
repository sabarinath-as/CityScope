import { useState, useEffect } from 'react'
import { dashboardAPI } from '../api'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from 'recharts'

const CAT_COLORS  = { road:'#f76707', water:'#4361ee', electricity:'#f4a100', waste:'#0caf60' }
const SEV_COLORS  = { low:'#0caf60', medium:'#f4a100', high:'#e03131' }
const STAT_COLORS = { pending:'#f4a100', in_progress:'#4361ee', resolved:'#0caf60' }

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:'8px', padding:'10px 14px', fontSize:'0.82rem', boxShadow:'var(--shadow)' }}>
      <div style={{ fontWeight:700, marginBottom:'4px', fontFamily:'var(--font-display)' }}>{label}</div>
      {payload.map((p,i) => <div key={i} style={{ color:p.color || '#4361ee' }}>{p.name || 'Count'}: {p.value}</div>)}
    </div>
  )
}

function StatCard({ label, value, icon, color, sub }) {
  return (
    <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'20px', boxShadow:'var(--shadow)', borderLeft:`4px solid ${color}` }}>
      <div style={{ fontSize:'1.4rem', marginBottom:'8px' }}>{icon}</div>
      <div style={{ fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:800, color, lineHeight:1 }}>{value ?? '—'}</div>
      <div style={{ fontSize:'0.82rem', color:'var(--text-muted)', marginTop:'6px', fontWeight:600 }}>{label}</div>
      {sub && <div style={{ fontSize:'0.74rem', color:'var(--text-dim)', marginTop:'2px' }}>{sub}</div>}
    </div>
  )
}

export default function DashboardPage() {
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardAPI.stats()
      .then(({ data }) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={s.loader}>Loading dashboard…</div>
  if (!stats)  return <div style={s.loader}>Could not load dashboard data.</div>

  const catData  = Object.entries(stats.issues_by_category || {}).map(([name,value]) => ({ name: name.charAt(0).toUpperCase()+name.slice(1), value }))
  const statData = Object.entries(stats.issues_by_status   || {}).map(([name,value]) => ({ name: name.replace('_',' '), value, color: STAT_COLORS[name] || '#9399b8' }))
  const sevData  = Object.entries(stats.issues_by_severity || {}).map(([name,value]) => ({ name: name.charAt(0).toUpperCase()+name.slice(1), value, color: SEV_COLORS[name] || '#9399b8' }))
  const trend    = (stats.resolution_trend || []).slice(-14).map(d => ({ date: d.date.slice(5), count: d.count }))

  return (
    <div>
      <div style={{ marginBottom:'24px' }}>
        <h1 style={s.title}>Dashboard</h1>
        <p style={s.sub}>City-wide issue analytics and resolution trends</p>
      </div>

      {/* Stat cards */}
      <div style={s.statGrid}>
        <StatCard label="Total Issues"    value={stats.total_issues}    icon="📋" color="var(--accent)" />
        <StatCard label="Resolved (30d)"  value={stats.recent_resolved} icon="✅" color="var(--green)" />
        <StatCard label="In Progress"     value={stats.issues_by_status?.in_progress || 0} icon="🔄" color="var(--yellow)" />
        <StatCard label="High Severity"   value={stats.issues_by_severity?.high || 0}       icon="🔴" color="var(--red)" />
      </div>

      {/* Charts row */}
      <div style={s.chartRow}>
        <div style={s.panel}>
          <h3 style={s.panelTitle}>Issues by Category</h3>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={catData} margin={{ top:8, right:8, left:-16, bottom:0 }}>
              <XAxis dataKey="name" tick={{ fill:'var(--text-muted)', fontSize:12, fontFamily:'var(--font-body)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:'var(--text-muted)', fontSize:12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="value" radius={[6,6,0,0]}>
                {catData.map((e,i) => <Cell key={i} fill={CAT_COLORS[e.name.toLowerCase()] || 'var(--accent)'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={s.panel}>
          <h3 style={s.panelTitle}>Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie data={statData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                labelLine={false}
              >
                {statData.map((e,i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip content={<Tip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={s.panel}>
          <h3 style={s.panelTitle}>Severity Split</h3>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={sevData} layout="vertical" margin={{ top:8, right:8, left:24, bottom:0 }}>
              <XAxis type="number" tick={{ fill:'var(--text-muted)', fontSize:12 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill:'var(--text-muted)', fontSize:12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="value" radius={[0,6,6,0]}>
                {sevData.map((e,i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Resolution trend */}
      <div style={s.panel}>
        <h3 style={s.panelTitle}>Resolution Trend — Last 14 Days</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={trend} margin={{ top:8, right:16, left:-16, bottom:0 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="date" tick={{ fill:'var(--text-muted)', fontSize:12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill:'var(--text-muted)', fontSize:12 }} axisLine={false} tickLine={false} />
            <Tooltip content={<Tip />} />
            <Line type="monotone" dataKey="count" stroke="var(--green)" strokeWidth={2.5}
              dot={{ fill:'var(--green)', r:4, strokeWidth:0 }} name="Resolved" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top areas */}
      {stats.top_areas?.length > 0 && (
        <div style={s.panel}>
          <h3 style={s.panelTitle}>Most Affected Location Clusters (Top 10)</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))', gap:'10px', marginTop:'12px' }}>
            {stats.top_areas.map((a,i) => (
              <div key={i} style={s.areaCard}>
                <span style={s.areaRank}>#{i+1}</span>
                <div>
                  <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{a.lat}°N, {a.lng}°E</div>
                  <div style={{ fontFamily:'var(--font-display)', fontWeight:700, color:'var(--accent)' }}>{a.count} issues</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const s = {
  title: { fontFamily:'var(--font-display)', fontWeight:800, fontSize:'2.4rem', letterSpacing:'-0.05em', lineHeight:1.1 },
  sub:   { color:'var(--text-muted)', fontSize:'1.05rem', marginTop:'8px', fontWeight:400 },
  loader:     { display:'flex', alignItems:'center', justifyContent:'center', height:'300px', color:'var(--text-muted)', fontFamily:'var(--font-display)' },
  statGrid:   { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px,1fr))', gap:'14px', marginBottom:'20px' },
  chartRow:   { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:'16px', marginBottom:'16px' },
  panel:      { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'20px', marginBottom:'16px', boxShadow:'var(--shadow)' },
  panelTitle: { fontFamily:'var(--font-display)', fontWeight:700, fontSize:'0.95rem', marginBottom:'14px', color:'var(--text)' },
  areaCard:   { background:'var(--bg-raised)', borderRadius:'var(--radius-sm)', padding:'12px', display:'flex', alignItems:'center', gap:'12px' },
  areaRank:   { fontFamily:'var(--font-display)', fontWeight:800, fontSize:'1.2rem', color:'var(--text-dim)', minWidth:'28px' },
}
