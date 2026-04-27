import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminAPI } from '../../api'

const STAT_COLORS = {
  pending:     { label:'Pending',     color:'#f4a100', bg:'#fff8e6' },
  in_progress: { label:'In Progress', color:'#4361ee', bg:'#eef2ff' },
  resolved:    { label:'Resolved',    color:'#0caf60', bg:'#e6f8ef' },
}
const CAT_COLORS = { road:'#f76707', water:'#4361ee', electricity:'#f4a100', waste:'#0caf60' }

function Card({ label, value, icon, color }) {
  return (
    <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'20px', boxShadow:'var(--shadow)', borderLeft:`4px solid ${color}` }}>
      <div style={{ fontSize:'1.4rem', marginBottom:'8px' }}>{icon}</div>
      <div style={{ fontFamily:'var(--font-display)', fontSize:'2rem', fontWeight:800, color, lineHeight:1 }}>{value ?? '—'}</div>
      <div style={{ fontSize:'0.82rem', color:'var(--text-muted)', marginTop:'6px', fontWeight:600 }}>{label}</div>
    </div>
  )
}

export default function AdminDashboard() {
  const navigate       = useNavigate()
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.dashboard()
      .then(({ data }) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={s.loader}>Loading dashboard…</div>
  if (!stats)  return <div style={s.loader}>Could not load data.</div>

  return (
    <div>
      {/* Header */}
      <div style={s.hdr}>
        <div>
          <h1 style={s.title}>Admin Dashboard</h1>
          <p style={s.sub}>Overview of all city complaints and resolution status</p>
        </div>
        <button onClick={() => navigate('/admin/complaints')} style={s.manageBtn}>
          Manage Complaints →
        </button>
      </div>

      {/* Top stat cards */}
      <div style={s.statGrid}>
        <Card label="Total Complaints" value={stats.total_issues}      icon="📋" color="var(--accent)" />
        <Card label="Open Issues"      value={stats.open_issues}       icon="🔴" color="var(--red)"    />
        <Card label="Resolved"         value={stats.resolved_issues}   icon="✅" color="var(--green)"  />
        <Card label="Registered Users" value={stats.total_users}       icon="👥" color="var(--purple)" />
      </div>

      {/* Status breakdown */}
      <div style={s.panel}>
        <h2 style={s.panelTitle}>Status Breakdown</h2>
        <div style={s.statusGrid}>
          {[
            { key:'pending',     val: stats.pending_issues },
            { key:'in_progress', val: stats.in_progress_issues },
            { key:'resolved',    val: stats.resolved_issues },
          ].map(({ key, val }) => {
            const m   = STAT_COLORS[key]
            const pct = stats.total_issues > 0 ? Math.round((val / stats.total_issues) * 100) : 0
            return (
              <div key={key} style={{ ...s.statusCard, background: m.bg, border:`1px solid ${m.color}44` }}>
                <div style={{ fontSize:'0.78rem', fontWeight:700, color: m.color, fontFamily:'var(--font-display)' }}>● {m.label}</div>
                <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'1.8rem', color: m.color, lineHeight:1 }}>{val}</div>
                <div style={s.track}><div style={{ ...s.bar, width:`${pct}%`, background: m.color }} /></div>
                <div style={{ fontSize:'0.75rem', color:'var(--text-dim)' }}>{pct}% of total</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Two column row */}
      <div style={s.twoCol}>
        {/* Category bar chart */}
        <div style={s.panel}>
          <h2 style={s.panelTitle}>By Category</h2>
          <div style={s.catList}>
            {Object.entries(stats.issues_by_category || {}).map(([cat, count]) => {
              const pct   = stats.total_issues > 0 ? Math.round((count / stats.total_issues) * 100) : 0
              const color = CAT_COLORS[cat] || 'var(--accent)'
              return (
                <div key={cat} style={s.catRow}>
                  <span style={{ width:'90px', fontSize:'0.83rem', fontWeight:600, color }}>{cat.charAt(0).toUpperCase()+cat.slice(1)}</span>
                  <div style={s.track}><div style={{ ...s.bar, width:`${pct}%`, background: color }} /></div>
                  <span style={{ width:'30px', textAlign:'right', fontSize:'0.82rem', color:'var(--text-muted)', fontWeight:600 }}>{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* 7-day trend */}
        <div style={s.panel}>
          <h2 style={s.panelTitle}>New Complaints — Last 7 Days</h2>
          <div style={s.trendChart}>
            {(stats.weekly_trend || []).map((d, i) => {
              const max = Math.max(...(stats.weekly_trend || []).map(x => x.count), 1)
              const h   = max === 0 ? 4 : Math.max(4, Math.round((d.count / max) * 120))
              return (
                <div key={i} style={s.trendBar}>
                  <span style={{ fontSize:'0.7rem', color:'var(--text-dim)' }}>{d.count}</span>
                  <div style={{ ...s.trendFill, height:`${h}px` }} title={`${d.date}: ${d.count}`} />
                  <span style={{ fontSize:'0.65rem', color:'var(--text-dim)', textAlign:'center' }}>{d.date}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Recent complaints */}
      <div style={s.panel}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
          <h2 style={s.panelTitle}>Recent Complaints</h2>
          <button onClick={() => navigate('/admin/complaints')} style={s.viewAllBtn}>View all →</button>
        </div>
        <table style={s.table}>
          <thead>
            <tr>{['#','Title','Category','Status','Submitted by','Date'].map(h =>
              <th key={h} style={s.th}>{h}</th>
            )}</tr>
          </thead>
          <tbody>
            {(stats.recent_issues || []).map(i => {
              const sm = STAT_COLORS[i.status] || STAT_COLORS.pending
              return (
                <tr key={i.id} onClick={() => navigate('/admin/complaints')} style={{ cursor:'pointer' }}>
                  <td style={s.td}><span style={{ color:'var(--text-dim)' }}>#{i.id}</span></td>
                  <td style={{ ...s.td, fontWeight:600, maxWidth:'180px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{i.title}</td>
                  <td style={s.td}>{i.category}</td>
                  <td style={s.td}>
                    <span style={{ padding:'3px 10px', borderRadius:'20px', fontSize:'0.72rem', fontWeight:700, fontFamily:'var(--font-display)', background:sm.bg, color:sm.color }}>
                      {sm.label}
                    </span>
                  </td>
                  <td style={s.td}>{i.user}</td>
                  <td style={s.td}>{i.created_at}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const s = {
  loader:      { display:'flex', alignItems:'center', justifyContent:'center', height:'300px', color:'var(--text-muted)', fontFamily:'var(--font-display)' },
  hdr:         { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'24px', flexWrap:'wrap', gap:'12px' },
  title: { fontFamily:'var(--font-display)', fontWeight:800, fontSize:'2.4rem', letterSpacing:'-0.05em', lineHeight:1.1 },
  sub:   { color:'var(--text-muted)', fontSize:'1.05rem', marginTop:'8px', fontWeight:400 },
  manageBtn:   { background:'#fff0f0', color:'#e03131', border:'1px solid #e0313133', borderRadius:'var(--radius-sm)', padding:'10px 18px', fontFamily:'var(--font-display)', fontWeight:700, fontSize:'0.88rem', cursor:'pointer' },
  statGrid:    { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px,1fr))', gap:'14px', marginBottom:'20px' },
  panel:       { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'20px', marginBottom:'16px', boxShadow:'var(--shadow)' },
  panelTitle:  { fontFamily:'var(--font-display)', fontWeight:700, fontSize:'1rem', color:'var(--text)', marginBottom:'0' },
  statusGrid:  { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px,1fr))', gap:'12px', marginTop:'14px' },
  statusCard:  { borderRadius:'var(--radius-sm)', padding:'16px', display:'flex', flexDirection:'column', gap:'8px' },
  track:       { height:'6px', background:'var(--bg-raised)', borderRadius:'3px', overflow:'hidden', flex:1 },
  bar:         { height:'100%', borderRadius:'3px', transition:'width 0.5s' },
  twoCol:      { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' },
  catList:     { display:'flex', flexDirection:'column', gap:'12px', marginTop:'14px' },
  catRow:      { display:'flex', alignItems:'center', gap:'10px' },
  trendChart:  { display:'flex', alignItems:'flex-end', gap:'8px', height:'150px', paddingTop:'20px', marginTop:'14px' },
  trendBar:    { flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px', justifyContent:'flex-end' },
  trendFill:   { width:'100%', background:'linear-gradient(180deg,var(--accent),rgba(67,97,238,0.25))', borderRadius:'4px 4px 0 0', minHeight:'4px' },
  table:       { width:'100%', borderCollapse:'collapse', marginTop:'0' },
  th:          { textAlign:'left', padding:'10px 12px', fontSize:'0.72rem', fontWeight:700, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.5px', borderBottom:'1px solid var(--border)', background:'var(--bg-raised)' },
  td:          { padding:'12px 12px', fontSize:'0.85rem', color:'var(--text-muted)', borderBottom:'1px solid var(--border)' },
  viewAllBtn:  { background:'transparent', border:'1px solid var(--border)', color:'var(--text-muted)', borderRadius:'var(--radius-sm)', padding:'6px 14px', fontSize:'0.8rem', cursor:'pointer', fontFamily:'var(--font-display)', fontWeight:600 },
}
