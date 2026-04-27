import { useState, useEffect, useCallback } from 'react'
import { adminAPI } from '../../api'

const STAT = {
  pending:     { label:'Pending',     color:'#f4a100', bg:'#fff8e6' },
  in_progress: { label:'In Progress', color:'#4361ee', bg:'#eef2ff' },
  resolved:    { label:'Resolved',    color:'#0caf60', bg:'#e6f8ef' },
}
const SEV_COLOR = { low:'#0caf60', medium:'#f4a100', high:'#e03131' }

/* ── Detail Modal ──────────────────────────────────────────────────────────── */
function Modal({ c, onClose, onSave, onDelete }) {
  const [status,  setStatus]  = useState(c.status)
  const [remark,  setRemark]  = useState(c.admin_comment || '')
  const [saving,  setSaving]  = useState(false)
  const [deleting,setDeleting]= useState(false)
  const [msg,     setMsg]     = useState('')

  const save = async () => {
    setSaving(true); setMsg('')
    try {
      const { data } = await adminAPI.updateComplaint(c.id, { status, admin_comment: remark })
      setMsg('✓ Saved successfully')
      onSave(data)
      setTimeout(() => setMsg(''), 2500)
    } catch { setMsg('✗ Save failed — please try again.') }
    setSaving(false)
  }

  const del = async () => {
    if (!window.confirm(`Delete "${c.title}"? This cannot be undone.`)) return
    setDeleting(true)
    try { await adminAPI.deleteComplaint(c.id); onDelete(c.id); onClose() }
    catch { setDeleting(false) }
  }

  const sm = STAT[c.status] || STAT.pending

  return (
    <div style={m.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={m.box}>
        {/* Header */}
        <div style={m.head}>
          <div>
            <div style={{ display:'flex', gap:'8px', marginBottom:'6px' }}>
              <span style={{ ...m.badge, background:sm.bg, color:sm.color }}>● {sm.label}</span>
              <span style={{ fontSize:'0.75rem', color:'var(--text-dim)', alignSelf:'center' }}>#{c.id}</span>
            </div>
            <h2 style={m.title}>{c.title}</h2>
          </div>
          <button onClick={onClose} style={m.close}>✕</button>
        </div>

        {/* Body */}
        <div style={m.body}>
          {/* Meta grid */}
          <div style={m.metaGrid}>
            {[
              { label:'Category',     value: c.category },
              { label:'Severity',     value: c.severity, color: SEV_COLOR[c.severity] },
              { label:'Submitted by', value: `@${c.user?.username}` },
              { label:'Date',         value: new Date(c.created_at).toLocaleDateString() },
              { label:'Upvotes',      value: c.vote_count },
              { label:'Comments',     value: c.comment_count },
            ].map(({ label, value, color }) => (
              <div key={label} style={m.metaItem}>
                <div style={m.metaLabel}>{label}</div>
                <div style={{ ...m.metaVal, color: color || 'var(--text)' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Description */}
          <div>
            <div style={m.sLabel}>Description</div>
            <p style={{ fontSize:'0.88rem', color:'var(--text-muted)', lineHeight:1.6, marginTop:'6px' }}>{c.description}</p>
          </div>

          {/* Location */}
          <div>
            <div style={m.sLabel}>Location</div>
            <p style={{ fontSize:'0.85rem', color:'var(--text-muted)', marginTop:'6px' }}>
              {c.latitude?.toFixed(5)}°N, {c.longitude?.toFixed(5)}°E &nbsp;
              <a href={`https://www.openstreetmap.org/?mlat=${c.latitude}&mlon=${c.longitude}&zoom=15`}
                target="_blank" rel="noopener noreferrer"
                style={{ color:'var(--accent)', fontSize:'0.8rem' }}>View on Map →</a>
            </p>
          </div>

          {/* Photo */}
          {c.image_url && (
            <div>
              <div style={m.sLabel}>Attached Photo</div>
              <img src={c.image_url} alt="Complaint" style={{ width:'100%', maxHeight:'220px', objectFit:'cover', borderRadius:'8px', marginTop:'8px', border:'1px solid var(--border)' }} />
            </div>
          )}

          {/* Admin controls */}
          <div style={m.adminBox}>
            <div style={m.sLabel}>⚙ Admin Actions</div>
            <label style={m.fieldLabel}>
              Update Status
              <select value={status} onChange={e => setStatus(e.target.value)} style={{ marginTop:'6px', background:'#fff', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'9px 12px', fontSize:'14px', color:'var(--text)', outline:'none', fontFamily:'var(--font-body)', width:'100%' }}>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </label>
            <label style={m.fieldLabel}>
              Admin Remark
              <textarea value={remark} onChange={e => setRemark(e.target.value)} rows={3}
                placeholder="Leave a remark visible to the issue reporter…"
                style={{ marginTop:'6px', resize:'vertical', background:'#fff', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', padding:'9px 12px', fontSize:'14px', color:'var(--text)', outline:'none', fontFamily:'var(--font-body)', width:'100%' }}
              />
            </label>
            {msg && <p style={{ fontSize:'0.85rem', color: msg.startsWith('✓') ? 'var(--green)' : 'var(--red)', fontWeight:600 }}>{msg}</p>}
            <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
              <button onClick={save} disabled={saving} style={m.saveBtn}>
                {saving ? 'Saving…' : '💾 Save Changes'}
              </button>
              <button onClick={del} disabled={deleting} style={m.delBtn}>
                {deleting ? 'Deleting…' : '🗑 Delete Complaint'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const m = {
  overlay:   { position:'fixed', inset:0, background:'rgba(26,29,46,0.4)', backdropFilter:'blur(2px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' },
  box:       { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-lg)', width:'100%', maxWidth:'640px', maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:'var(--shadow-lg)' },
  head:      { display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'20px 24px', borderBottom:'1px solid var(--border)' },
  title:     { fontFamily:'var(--font-display)', fontWeight:800, fontSize:'1.1rem', lineHeight:1.3, color:'var(--text)' },
  badge:     { padding:'3px 10px', borderRadius:'20px', fontSize:'0.72rem', fontWeight:700, fontFamily:'var(--font-display)' },
  close:     { background:'transparent', border:'none', color:'var(--text-dim)', fontSize:'1.1rem', cursor:'pointer', padding:'4px', flexShrink:0 },
  body:      { padding:'20px 24px', overflowY:'auto', display:'flex', flexDirection:'column', gap:'16px' },
  metaGrid:  { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px', background:'var(--bg-raised)', borderRadius:'10px', padding:'14px' },
  metaItem:  { display:'flex', flexDirection:'column', gap:'3px' },
  metaLabel: { fontSize:'0.68rem', color:'var(--text-dim)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px' },
  metaVal:   { fontSize:'0.88rem', fontWeight:700, fontFamily:'var(--font-display)', color:'var(--text)' },
  sLabel:    { fontSize:'0.75rem', fontWeight:700, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.5px' },
  adminBox:  { background:'var(--accent-light)', border:'1px solid var(--accent)', borderRadius:'10px', padding:'16px', display:'flex', flexDirection:'column', gap:'12px' },
  fieldLabel:{ display:'flex', flexDirection:'column', fontSize:'0.83rem', fontWeight:600, color:'var(--text-muted)' },
  saveBtn:   { background:'var(--green)', color:'#fff', border:'none', borderRadius:'var(--radius-sm)', padding:'10px 20px', fontFamily:'var(--font-display)', fontWeight:700, cursor:'pointer', fontSize:'0.88rem' },
  delBtn:    { background:'var(--red-light)', color:'var(--red)', border:'1px solid var(--red)', borderRadius:'var(--radius-sm)', padding:'10px 20px', fontFamily:'var(--font-display)', fontWeight:700, cursor:'pointer', fontSize:'0.88rem' },
}

/* ── Main Page ─────────────────────────────────────────────────────────────── */
export default function ComplaintManagement() {
  const [data,     setData]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState(null)
  const [search,   setSearch]   = useState('')
  const [filters,  setFilters]  = useState({ status:'', category:'', severity:'', date_from:'', date_to:'' })
  const [ordering, setOrdering] = useState('-created_at')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { ordering }
      if (search) params.search = search
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v })
      const { data: res } = await adminAPI.complaints(params)
      setData(res.results || res)
    } catch {}
    setLoading(false)
  }, [search, filters, ordering])

  useEffect(() => { load() }, [load])

  const setF = (k, v) => setFilters(f => ({ ...f, [k]: v }))

  const handleSave = updated => {
    setData(prev => prev.map(c => c.id === updated.id ? updated : c))
    setSelected(updated)
  }
  const handleDelete = id => setData(prev => prev.filter(c => c.id !== id))

  return (
    <div>
      <div style={p.hdr}>
        <div>
          <h1 style={p.title}>Complaint Management</h1>
          <p style={p.sub}>{data.length} complaint{data.length !== 1 ? 's' : ''} shown</p>
        </div>
      </div>

      {/* Filters */}
      <div style={p.filters}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && load()}
          placeholder="🔍 Search title, description, username…"
          style={p.searchInput}
        />
        {[
          { key:'status',   opts:['','pending','in_progress','resolved'],        ph:'All Statuses' },
          { key:'category', opts:['','road','water','electricity','waste'],      ph:'All Categories' },
          { key:'severity', opts:['','low','medium','high'],                     ph:'All Severities' },
        ].map(({ key, opts, ph }) => (
          <select key={key} value={filters[key]} onChange={e => setF(key, e.target.value)} style={p.sel}>
            <option value="">{ph}</option>
            {opts.filter(Boolean).map(o => (
              <option key={o} value={o}>{STAT[o]?.label || o.charAt(0).toUpperCase()+o.slice(1)}</option>
            ))}
          </select>
        ))}
        <input type="date" value={filters.date_from} onChange={e => setF('date_from', e.target.value)} style={p.dateSel} title="From date" />
        <input type="date" value={filters.date_to}   onChange={e => setF('date_to',   e.target.value)} style={p.dateSel} title="To date" />
        <select value={ordering} onChange={e => setOrdering(e.target.value)} style={p.sel}>
          <option value="-created_at">Newest First</option>
          <option value="created_at">Oldest First</option>
          <option value="-priority_score">Highest Priority</option>
        </select>
        <button onClick={load} style={p.applyBtn}>Apply</button>
        <button onClick={() => { setSearch(''); setFilters({ status:'', category:'', severity:'', date_from:'', date_to:'' }) }} style={p.clearBtn}>Clear</button>
      </div>

      {/* Table */}
      {loading
        ? <div style={p.empty}>Loading…</div>
        : data.length === 0
          ? <div style={p.empty}>No complaints match your filters.</div>
          : (
            <div style={p.tableWrap}>
              <table style={p.table}>
                <thead>
                  <tr>
                    {['#','Title','Category','Severity','Status','Submitted by','Date','Votes','Action'].map(h =>
                      <th key={h} style={p.th}>{h}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data.map(c => {
                    const sm  = STAT[c.status]    || STAT.pending
                    const sc  = SEV_COLOR[c.severity] || 'var(--text-muted)'
                    return (
                      <tr key={c.id} style={p.tr}>
                        <td style={p.td}><span style={{ color:'var(--text-dim)' }}>#{c.id}</span></td>
                        <td style={{ ...p.td, maxWidth:'180px' }}>
                          <div style={{ fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.title}</div>
                          {c.admin_comment && <div style={{ fontSize:'0.7rem', color:'var(--accent)', marginTop:'2px' }}>📝 Admin remark added</div>}
                        </td>
                        <td style={p.td}>{c.category}</td>
                        <td style={p.td}><span style={{ color:sc, fontWeight:700, fontSize:'0.8rem' }}>{c.severity?.toUpperCase()}</span></td>
                        <td style={p.td}>
                          <span style={{ padding:'3px 10px', borderRadius:'20px', fontSize:'0.72rem', fontWeight:700, fontFamily:'var(--font-display)', background:sm.bg, color:sm.color, whiteSpace:'nowrap' }}>
                            {sm.label}
                          </span>
                        </td>
                        <td style={p.td}>@{c.user?.username}</td>
                        <td style={p.td}>{new Date(c.created_at).toLocaleDateString()}</td>
                        <td style={p.td}>{c.vote_count}</td>
                        <td style={p.td}>
                          <button onClick={() => setSelected(c)} style={p.viewBtn}>View →</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
      }

      {selected && (
        <Modal
          c={selected}
          onClose={() => setSelected(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}

const p = {
  hdr:         { marginBottom:'20px' },
  title: { fontFamily:'var(--font-display)', fontWeight:800, fontSize:'2.4rem', letterSpacing:'-0.05em', lineHeight:1.1 },
  sub:   { color:'var(--text-muted)', fontSize:'1.05rem', marginTop:'8px', fontWeight:400 },
  filters:     { display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'20px', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'14px', boxShadow:'var(--shadow)' },
  searchInput: { flex:'2 1 220px', background:'var(--bg-raised)', border:'1px solid var(--border)', color:'var(--text)', borderRadius:'var(--radius-sm)', padding:'9px 12px', fontSize:'14px', outline:'none', fontFamily:'var(--font-body)' },
  sel:         { flex:'1 1 140px', background:'var(--bg-raised)', border:'1px solid var(--border)', color:'var(--text)', borderRadius:'var(--radius-sm)', padding:'9px 12px', fontSize:'13px', outline:'none', fontFamily:'var(--font-body)' },
  dateSel:     { flex:'1 1 130px', background:'var(--bg-raised)', border:'1px solid var(--border)', color:'var(--text)', borderRadius:'var(--radius-sm)', padding:'9px 12px', fontSize:'13px', outline:'none', fontFamily:'var(--font-body)' },
  applyBtn:    { background:'var(--accent)', color:'#fff', border:'none', borderRadius:'var(--radius-sm)', padding:'9px 18px', fontFamily:'var(--font-display)', fontWeight:700, cursor:'pointer', fontSize:'0.85rem', flexShrink:0 },
  clearBtn:    { background:'var(--bg-raised)', border:'1px solid var(--border)', color:'var(--text-muted)', borderRadius:'var(--radius-sm)', padding:'9px 14px', fontFamily:'var(--font-display)', fontWeight:600, cursor:'pointer', fontSize:'0.82rem', flexShrink:0 },
  empty:       { textAlign:'center', padding:'60px 0', color:'var(--text-muted)' },
  tableWrap:   { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', overflow:'hidden', overflowX:'auto', boxShadow:'var(--shadow)' },
  table:       { width:'100%', borderCollapse:'collapse', minWidth:'860px' },
  th:          { textAlign:'left', padding:'11px 14px', fontSize:'0.72rem', fontWeight:700, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.5px', borderBottom:'1px solid var(--border)', background:'var(--bg-raised)' },
  tr:          { transition:'background var(--transition)' },
  td:          { padding:'12px 14px', fontSize:'0.85rem', color:'var(--text-muted)', borderBottom:'1px solid var(--border)' },
  viewBtn:     { background:'var(--accent-light)', color:'var(--accent)', border:'1px solid var(--accent)', borderRadius:'6px', padding:'5px 12px', fontSize:'0.78rem', fontFamily:'var(--font-display)', fontWeight:700, cursor:'pointer' },
}
