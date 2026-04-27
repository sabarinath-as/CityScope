import { useState, useEffect, useCallback } from 'react'
import { issuesAPI } from '../api'
import IssueCard from '../components/IssueCard'

const CATS  = ['','road','water','electricity','waste']
const SEVS  = ['','low','medium','high']
const STATS = ['','pending','in_progress','resolved']
const ORDERS = [
  { label:'Priority (High→Low)', value:'-priority_score' },
  { label:'Newest First',        value:'-created_at' },
  { label:'Oldest First',        value:'created_at' },
]

export default function FeedPage() {
  const [issues, setIssues]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [filters, setFilters] = useState({ category:'', severity:'', status:'', ordering:'-priority_score' })
  const [page, setPage]       = useState(1)
  const [total, setTotal]     = useState(0)

  const PAGE_SIZE = 20

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, ordering: filters.ordering }
      if (search)          params.search   = search
      if (filters.category) params.category = filters.category
      if (filters.severity) params.severity = filters.severity
      if (filters.status)   params.status   = filters.status
      const { data } = await issuesAPI.list(params)
      const results  = data.results || data
      setIssues(results)
      setTotal(data.count || results.length)
    } catch {}
    setLoading(false)
  }, [filters, search, page])

  useEffect(() => { load() }, [load])

  const setF = (k, v) => { setFilters(f => ({ ...f, [k]: v })); setPage(1) }
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Issue Feed</h1>
          <p style={s.sub}>{total} issues found · sorted by {filters.ordering === '-priority_score' ? 'priority' : 'date'}</p>
        </div>
      </div>

      {/* Controls */}
      <div style={s.controls}>
        <div style={s.searchRow}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load()}
            placeholder="🔍 Search issues by title or description…"
            style={s.searchInput}
          />
          <button onClick={load} style={s.searchBtn}>Search</button>
        </div>
        <div style={s.filterRow}>
          {[
            { key:'category', opts: CATS,  ph:'All Categories' },
            { key:'severity',  opts: SEVS,  ph:'All Severities'  },
            { key:'status',    opts: STATS, ph:'All Statuses'    },
          ].map(({ key, opts, ph }) => (
            <select key={key} value={filters[key]} onChange={e => setF(key, e.target.value)} style={s.sel}>
              <option value="">{ph}</option>
              {opts.filter(Boolean).map(o => (
                <option key={o} value={o}>{o.replace('_',' ').replace(/^\w/, c => c.toUpperCase())}</option>
              ))}
            </select>
          ))}
          <select value={filters.ordering} onChange={e => setF('ordering', e.target.value)} style={s.sel}>
            {ORDERS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button onClick={() => { setFilters({ category:'', severity:'', status:'', ordering:'-priority_score' }); setSearch(''); setPage(1) }} style={s.clearBtn}>
            Clear
          </button>
        </div>
      </div>

      {loading
        ? <div style={s.empty}>Loading issues…</div>
        : issues.length === 0
          ? <div style={s.empty}>No issues found. Try changing your filters.</div>
          : <div style={s.grid}>{issues.map(i => <IssueCard key={i.id} issue={i} onVoteUpdate={load} />)}</div>
      }

      {totalPages > 1 && (
        <div style={s.pager}>
          <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} style={s.pageBtn}>← Prev</button>
          <span style={{ fontSize:'0.88rem', color:'var(--text-muted)' }}>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages} style={s.pageBtn}>Next →</button>
        </div>
      )}
    </div>
  )
}

const s = {
  header:     { marginBottom:'24px' },
  title: { fontFamily:'var(--font-display)', fontWeight:800, fontSize:'2.4rem', letterSpacing:'-0.05em', lineHeight:1.1 },
  sub:   { color:'var(--text-muted)', fontSize:'1.05rem', marginTop:'8px', fontWeight:400 },
  controls:   { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'16px', marginBottom:'20px', display:'flex', flexDirection:'column', gap:'12px', boxShadow:'var(--shadow)' },
  searchRow:  { display:'flex', gap:'8px' },
  searchInput:{ flex:1 },
  searchBtn:  { background:'var(--accent)', color:'#fff', padding:'10px 20px', borderRadius:'var(--radius-sm)', fontFamily:'var(--font-display)', fontWeight:700, fontSize:'0.9rem', cursor:'pointer', flexShrink:0, border:'none' },
  filterRow:  { display:'flex', gap:'8px', flexWrap:'wrap' },
  sel:        { flex:'1 1 150px', minWidth:'130px' },
  clearBtn:   { background:'var(--bg-raised)', border:'1px solid var(--border)', color:'var(--text-muted)', borderRadius:'var(--radius-sm)', padding:'10px 14px', fontFamily:'var(--font-display)', fontWeight:600, fontSize:'0.85rem', cursor:'pointer', flexShrink:0 },
  grid:       { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'16px' },
  empty:      { textAlign:'center', padding:'60px', color:'var(--text-muted)', fontSize:'1rem' },
  pager:      { display:'flex', alignItems:'center', justifyContent:'center', gap:'16px', marginTop:'32px' },
  pageBtn:    { background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--text)', padding:'8px 18px', borderRadius:'var(--radius-sm)', cursor:'pointer', fontFamily:'var(--font-display)', fontWeight:600, fontSize:'0.85rem', boxShadow:'var(--shadow)' },
}
