import { useState, useEffect } from 'react'
import { adminAPI } from '../../api'

export default function AdminUsers() {
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')

  useEffect(() => {
    adminAPI.users()
      .then(({ data }) => setUsers(data.results || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div style={s.hdr}>
        <div>
          <h1 style={s.title}>Registered Users</h1>
          <p style={s.sub}>{users.length} total non-admin users</p>
        </div>
      </div>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="🔍 Search by username or email…"
        style={s.search}
      />

      {loading
        ? <div style={s.empty}>Loading users…</div>
        : filtered.length === 0
          ? <div style={s.empty}>No users found.</div>
          : (
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>
                    {['#','Username','Full Name','Email','Complaints','Joined','Status'].map(h =>
                      <th key={h} style={s.th}>{h}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => (
                    <tr key={u.id}>
                      <td style={s.td}><span style={{ color:'var(--text-dim)' }}>#{u.id}</span></td>
                      <td style={s.td}>
                        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                          <div style={s.av}>{u.username[0].toUpperCase()}</div>
                          <span style={{ fontWeight:600, color:'var(--text)' }}>@{u.username}</span>
                        </div>
                      </td>
                      <td style={s.td}>{u.first_name} {u.last_name}</td>
                      <td style={s.td}>{u.email}</td>
                      <td style={s.td}>
                        <span style={{ fontFamily:'var(--font-display)', fontWeight:700, color:'var(--accent)' }}>{u.complaint_count}</span>
                      </td>
                      <td style={s.td}>{u.date_joined}</td>
                      <td style={s.td}>
                        <span style={{
                          padding:'3px 10px', borderRadius:'20px', fontSize:'0.72rem', fontWeight:700,
                          fontFamily:'var(--font-display)',
                          background: u.is_active ? '#e6f8ef' : '#fff0f0',
                          color:      u.is_active ? '#0caf60' : '#e03131',
                        }}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
      }
    </div>
  )
}

const s = {
  hdr:       { marginBottom:'20px' },
  title: { fontFamily:'var(--font-display)', fontWeight:800, fontSize:'2.4rem', letterSpacing:'-0.05em', lineHeight:1.1 },
  sub:   { color:'var(--text-muted)', fontSize:'1.05rem', marginTop:'8px', fontWeight:400 },
  search:    { marginBottom:'16px', background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--text)', borderRadius:'var(--radius-sm)', padding:'11px 14px', fontSize:'14px', outline:'none', fontFamily:'var(--font-body)', width:'100%', boxSizing:'border-box' },
  empty:     { textAlign:'center', padding:'60px 0', color:'var(--text-muted)' },
  tableWrap: { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', overflow:'hidden', overflowX:'auto', boxShadow:'var(--shadow)' },
  table:     { width:'100%', borderCollapse:'collapse', minWidth:'700px' },
  th:        { textAlign:'left', padding:'11px 14px', fontSize:'0.72rem', fontWeight:700, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.5px', borderBottom:'1px solid var(--border)', background:'var(--bg-raised)' },
  td:        { padding:'12px 14px', fontSize:'0.85rem', color:'var(--text-muted)', borderBottom:'1px solid var(--border)' },
  av:        { width:'28px', height:'28px', borderRadius:'50%', background:'var(--accent)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontWeight:800, fontSize:'0.78rem', flexShrink:0 },
}
