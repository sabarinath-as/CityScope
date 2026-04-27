import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import { issuesAPI, votesAPI, commentsAPI } from '../api'
import { useAuth } from '../context/AuthContext'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const CAT_STYLE  = { road:{bg:'#fff4ee',color:'#f76707'}, water:{bg:'#eef2ff',color:'#4361ee'}, electricity:{bg:'#fff8e6',color:'#f4a100'}, waste:{bg:'#e6f8ef',color:'#0caf60'} }
const SEV_STYLE  = { low:{bg:'#e6f8ef',color:'#0caf60'}, medium:{bg:'#fff8e6',color:'#f4a100'}, high:{bg:'#fff0f0',color:'#e03131'} }
const STAT_META  = { pending:{label:'Pending',color:'#f4a100',bg:'#fff8e6'}, in_progress:{label:'In Progress',color:'#4361ee',bg:'#eef2ff'}, resolved:{label:'Resolved',color:'#0caf60',bg:'#e6f8ef'} }

export default function IssueDetailPage() {
  const { id }    = useParams()
  const { user }  = useAuth()
  const navigate  = useNavigate()

  const [issue,   setIssue]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [votes,   setVotes]   = useState(0)
  const [voted,   setVoted]   = useState(false)
  const [voting,  setVoting]  = useState(false)

  const [commentText, setCommentText] = useState('')
  const [commenting,  setCommenting]  = useState(false)
  const [commentErr,  setCommentErr]  = useState('')

  const [adminStatus,  setAdminStatus]  = useState('')
  const [adminRemark,  setAdminRemark]  = useState('')
  const [savingAdmin,  setSavingAdmin]  = useState(false)
  const [adminMsg,     setAdminMsg]     = useState('')

  useEffect(() => {
    issuesAPI.detail(id)
      .then(({ data }) => {
        setIssue(data)
        setVotes(data.vote_count)
        setVoted(data.has_voted)
        setAdminStatus(data.status)
        setAdminRemark(data.admin_comment || '')
      })
      .catch(() => navigate('/feed'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  const handleVote = async () => {
    if (!user)  { navigate('/login'); return }
    if (voting) return
    setVoting(true)
    try {
      const { data } = await votesAPI.toggle(id)
      setVotes(data.vote_count)
      setVoted(data.has_voted)
    } catch {}
    setVoting(false)
  }

  const handleComment = async e => {
    e.preventDefault()
    if (!commentText.trim()) return
    setCommenting(true); setCommentErr('')
    try {
      const { data: c } = await commentsAPI.create(id, { text: commentText })
      setIssue(prev => ({ ...prev, comments: [...(prev.comments||[]), c] }))
      setCommentText('')
    } catch (err) {
      setCommentErr(err.response?.data?.text?.[0] || 'Failed to post comment.')
    }
    setCommenting(false)
  }

  const handleDeleteComment = async cid => {
    if (!window.confirm('Delete this comment?')) return
    try {
      await commentsAPI.remove(cid)
      setIssue(prev => ({ ...prev, comments: prev.comments.filter(c => c.id !== cid) }))
    } catch {}
  }

  const handleAdminSave = async () => {
    setSavingAdmin(true); setAdminMsg('')
    try {
      const { data } = await issuesAPI.update(id, (() => { const f=new FormData(); f.append('status',adminStatus); f.append('admin_comment',adminRemark); return f })())
      setIssue(prev => ({ ...prev, status: data.status, admin_comment: data.admin_comment }))
      setAdminMsg('✓ Status updated successfully.')
    } catch { setAdminMsg('✗ Update failed.') }
    setSavingAdmin(false)
    setTimeout(() => setAdminMsg(''), 3000)
  }

  if (loading) return <div style={s.loader}>Loading issue…</div>
  if (!issue)  return null

  const cat    = CAT_STYLE[issue.category]  || { bg:'#f0f2f8', color:'#5a6082' }
  const sev    = SEV_STYLE[issue.severity]  || { bg:'#f0f2f8', color:'#5a6082' }
  const stMeta = STAT_META[issue.status]    || STAT_META.pending

  return (
    <div style={s.page}>
      <button onClick={() => navigate(-1)} style={s.back}>← Back to Feed</button>

      <div style={s.layout}>
        {/* Main */}
        <div style={s.mainCol}>

          {/* Header card */}
          <div style={s.card}>
            <div style={s.tagRow}>
              <span style={{ ...s.tag, background:cat.bg, color:cat.color }}>{issue.category.toUpperCase()}</span>
              <span style={{ ...s.tag, background:sev.bg, color:sev.color }}>{issue.severity.toUpperCase()}</span>
              <span style={{ ...s.tag, background:stMeta.bg, color:stMeta.color }}>● {stMeta.label}</span>
            </div>

            <h1 style={s.title}>{issue.title}</h1>

            <div style={s.meta}>
              <span>By <strong>{issue.user?.username}</strong></span>
              <span style={{ color:'var(--text-dim)' }}>·</span>
              <span>{new Date(issue.created_at).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</span>
            </div>

            <p style={s.desc}>{issue.description}</p>

            {issue.admin_comment && (
              <div style={s.adminNote}>
                <span style={{ fontWeight:700, color:'var(--accent)' }}>Admin remark: </span>
                {issue.admin_comment}
              </div>
            )}

            <div style={s.priorityRow}>
              <span style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>Priority Score</span>
              <span style={{ fontFamily:'var(--font-display)', fontWeight:800, color:'var(--accent)', fontSize:'1.1rem' }}>⚡ {issue.priority_score}</span>
            </div>

            <button onClick={handleVote} disabled={voting} style={{ ...s.voteBtn, ...(voted ? s.votedBtn : {}) }}>
              {voted ? '▲ Upvoted' : '▲ Upvote'} · {votes} {votes===1?'vote':'votes'}
            </button>
          </div>

          {/* Image */}
          {issue.image_url && (
            <div style={s.card}>
              <img src={issue.image_url} alt="Issue" style={s.img} />
            </div>
          )}

          {/* Admin panel — visible only to staff */}
          {user?.is_staff && (
            <div style={{ ...s.card, borderLeft:'4px solid var(--accent)' }}>
              <h3 style={s.secTitle}>⚙ Admin Controls</h3>
              <div style={s.adminRow}>
                <label style={s.label}>
                  Update Status
                  <select value={adminStatus} onChange={e => setAdminStatus(e.target.value)} style={{ marginTop:'6px' }}>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </label>
              </div>
              <label style={s.label}>
                Admin Remark
                <textarea value={adminRemark} onChange={e => setAdminRemark(e.target.value)} rows={3}
                  placeholder="Add an internal or public remark for this issue…"
                  style={{ marginTop:'6px', resize:'vertical' }} />
              </label>
              {adminMsg && <p style={{ fontSize:'0.85rem', color: adminMsg.startsWith('✓') ? 'var(--green)' : 'var(--red)' }}>{adminMsg}</p>}
              <button onClick={handleAdminSave} disabled={savingAdmin} style={s.adminSaveBtn}>
                {savingAdmin ? 'Saving…' : '💾 Save Changes'}
              </button>
            </div>
          )}

          {/* Comments */}
          <div style={s.card}>
            <h3 style={s.secTitle}>💬 Comments ({issue.comments?.length || 0})</h3>

            {user ? (
              <form onSubmit={handleComment} style={s.commentForm}>
                <textarea
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Share your thoughts or additional details…"
                  rows={3}
                  style={{ resize:'vertical' }}
                />
                {commentErr && <span style={{ color:'var(--red)', fontSize:'0.8rem' }}>{commentErr}</span>}
                <button type="submit" disabled={commenting || !commentText.trim()} style={s.commentBtn}>
                  {commenting ? 'Posting…' : 'Post Comment'}
                </button>
              </form>
            ) : (
              <p style={{ fontSize:'0.85rem', color:'var(--text-muted)', marginBottom:'12px' }}>
                <a href="/login">Sign in</a> to leave a comment.
              </p>
            )}

            <div style={s.commentList}>
              {!issue.comments?.length && (
                <p style={{ color:'var(--text-dim)', fontSize:'0.85rem', textAlign:'center', padding:'20px 0' }}>
                  No comments yet. Be the first!
                </p>
              )}
              {issue.comments?.map(c => (
                <div key={c.id} style={s.commentItem}>
                  <div style={s.commentHead}>
                    <div style={s.commentAvatar}>{c.user?.username?.[0]?.toUpperCase()}</div>
                    <div>
                      <span style={{ fontWeight:700, fontSize:'0.88rem' }}>{c.user?.username}</span>
                      <span style={{ color:'var(--text-dim)', fontSize:'0.75rem', marginLeft:'8px' }}>
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {(user?.id === c.user?.id || user?.is_staff) && (
                      <button onClick={() => handleDeleteComment(c.id)} style={s.delBtn}>✕</button>
                    )}
                  </div>
                  <p style={{ fontSize:'0.88rem', color:'var(--text-muted)', lineHeight:1.55, paddingLeft:'38px' }}>{c.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={s.sideCol}>
          {/* Location mini-map */}
          <div style={s.card}>
            <h3 style={s.secTitle}>📍 Location</h3>
            <div style={{ height:'200px', borderRadius:'8px', overflow:'hidden', marginBottom:'10px', border:'1px solid var(--border)' }}>
              <MapContainer center={[issue.latitude, issue.longitude]} zoom={14} style={{ height:'100%', width:'100%' }} zoomControl={false}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[issue.latitude, issue.longitude]} />
              </MapContainer>
            </div>
            <div style={{ fontSize:'0.78rem', color:'var(--text-dim)' }}>
              {issue.latitude.toFixed(5)}°N, {issue.longitude.toFixed(5)}°E
            </div>
          </div>

          {/* Stats */}
          <div style={s.card}>
            <h3 style={s.secTitle}>Issue Stats</h3>
            <div style={s.statList}>
              {[
                ['Category',  issue.category.charAt(0).toUpperCase()+issue.category.slice(1)],
                ['Severity',  issue.severity.charAt(0).toUpperCase()+issue.severity.slice(1)],
                ['Status',    stMeta.label],
                ['Upvotes',   votes],
                ['Comments',  issue.comments?.length || 0],
                ['Priority',  issue.priority_score],
              ].map(([label, value]) => (
                <div key={label} style={s.statRow}>
                  <span style={{ color:'var(--text-muted)', fontSize:'0.83rem' }}>{label}</span>
                  <span style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:'0.85rem' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reporter */}
          <div style={s.card}>
            <h3 style={s.secTitle}>Reported By</h3>
            <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
              <div style={{ ...s.commentAvatar, width:'38px', height:'38px', fontSize:'1rem' }}>
                {issue.user?.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:'0.9rem' }}>{issue.user?.first_name} {issue.user?.last_name}</div>
                <div style={{ color:'var(--text-dim)', fontSize:'0.78rem' }}>@{issue.user?.username}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const s = {
  page:        { maxWidth:'1100px', margin:'0 auto' },
  loader:      { display:'flex', alignItems:'center', justifyContent:'center', height:'300px', color:'var(--text-muted)', fontFamily:'var(--font-display)' },
  back:        { background:'transparent', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'0.88rem', fontFamily:'var(--font-display)', fontWeight:600, marginBottom:'16px', padding:0 },
  layout:      { display:'grid', gridTemplateColumns:'1fr 300px', gap:'20px', alignItems:'start' },
  mainCol:     { display:'flex', flexDirection:'column', gap:'16px' },
  sideCol:     { display:'flex', flexDirection:'column', gap:'16px', position:'sticky', top:'24px' },
  card:        { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'20px', display:'flex', flexDirection:'column', gap:'12px', boxShadow:'var(--shadow)' },
  tagRow:      { display:'flex', gap:'8px', flexWrap:'wrap' },
  tag:         { padding:'3px 10px', borderRadius:'20px', fontSize:'0.72rem', fontWeight:700, fontFamily:'var(--font-display)' },
  title:       { fontFamily:'var(--font-display)', fontWeight:800, fontSize:'1.5rem', letterSpacing:'-0.3px', lineHeight:1.3 },
  meta:        { display:'flex', gap:'8px', fontSize:'0.83rem', color:'var(--text-muted)', flexWrap:'wrap' },
  desc:        { fontSize:'0.93rem', color:'var(--text-muted)', lineHeight:1.7, whiteSpace:'pre-wrap' },
  adminNote:   { background:'var(--accent-light)', borderLeft:'3px solid var(--accent)', padding:'10px 14px', borderRadius:'4px', fontSize:'0.85rem', color:'var(--text-muted)' },
  priorityRow: { display:'flex', justifyContent:'space-between', alignItems:'center', background:'var(--bg-raised)', borderRadius:'var(--radius-sm)', padding:'10px 14px' },
  voteBtn:     { background:'var(--bg-raised)', border:'1.5px solid var(--border)', color:'var(--text)', borderRadius:'var(--radius-sm)', padding:'11px 20px', fontSize:'0.95rem', fontWeight:700, fontFamily:'var(--font-display)', cursor:'pointer', alignSelf:'flex-start', transition:'all var(--transition)' },
  votedBtn:    { background:'var(--accent-light)', border:'1.5px solid var(--accent)', color:'var(--accent)' },
  img:         { width:'100%', maxHeight:'400px', objectFit:'cover', borderRadius:'8px' },
  secTitle:    { fontFamily:'var(--font-display)', fontWeight:700, fontSize:'0.95rem' },
  adminRow:    { display:'grid', gridTemplateColumns:'1fr', gap:'12px' },
  label:       { display:'flex', flexDirection:'column', fontSize:'0.83rem', fontWeight:600, color:'var(--text-muted)' },
  adminSaveBtn:{ background:'var(--green)', color:'#fff', border:'none', borderRadius:'var(--radius-sm)', padding:'10px 18px', fontFamily:'var(--font-display)', fontWeight:700, cursor:'pointer', fontSize:'0.88rem', alignSelf:'flex-start' },
  commentForm: { display:'flex', flexDirection:'column', gap:'8px', paddingBottom:'16px', borderBottom:'1px solid var(--border)' },
  commentBtn:  { background:'var(--accent)', color:'#fff', border:'none', borderRadius:'var(--radius-sm)', padding:'9px 18px', fontFamily:'var(--font-display)', fontWeight:700, cursor:'pointer', fontSize:'0.88rem', alignSelf:'flex-end' },
  commentList: { display:'flex', flexDirection:'column', gap:'16px' },
  commentItem: { display:'flex', flexDirection:'column', gap:'6px' },
  commentHead: { display:'flex', alignItems:'center', gap:'10px' },
  commentAvatar:{ width:'28px', height:'28px', borderRadius:'50%', background:'var(--accent)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontWeight:800, fontSize:'0.75rem', flexShrink:0 },
  delBtn:      { marginLeft:'auto', background:'transparent', border:'none', color:'var(--text-dim)', cursor:'pointer', fontSize:'0.75rem', padding:'2px 6px' },
  statList:    { display:'flex', flexDirection:'column', gap:'8px' },
  statRow:     { display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid var(--border)', paddingBottom:'8px' },
}
