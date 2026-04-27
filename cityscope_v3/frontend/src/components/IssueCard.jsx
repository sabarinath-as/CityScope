import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { votesAPI } from '../api'
import { useAuth } from '../context/AuthContext'

const CAT_STYLE = {
  road:        { bg: '#fff4ee', color: '#f76707' },
  water:       { bg: '#eef2ff', color: '#4361ee' },
  electricity: { bg: '#fff8e6', color: '#f4a100' },
  waste:       { bg: '#e6f8ef', color: '#0caf60' },
}
const SEV_STYLE = {
  low:    { bg: '#e6f8ef', color: '#0caf60' },
  medium: { bg: '#fff8e6', color: '#f4a100' },
  high:   { bg: '#fff0f0', color: '#e03131' },
}
const STATUS_STYLE = {
  pending:     { color: '#f4a100', label: 'Pending' },
  in_progress: { color: '#4361ee', label: 'In Progress' },
  resolved:    { color: '#0caf60', label: 'Resolved' },
}

export default function IssueCard({ issue, onVoteUpdate }) {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const [votes, setVotes]       = useState(issue.vote_count)
  const [voted, setVoted]       = useState(issue.has_voted)
  const [loading, setLoading]   = useState(false)

  const handleVote = async e => {
    e.stopPropagation()
    if (!user) { navigate('/login'); return }
    if (loading) return
    setLoading(true)
    try {
      const { data } = await votesAPI.toggle(issue.id)
      setVotes(data.vote_count)
      setVoted(data.has_voted)
      if (onVoteUpdate) onVoteUpdate(issue.id, data)
    } catch {}
    setLoading(false)
  }

  const cat    = CAT_STYLE[issue.category]    || { bg: '#f0f2f8', color: '#5a6082' }
  const sev    = SEV_STYLE[issue.severity]    || { bg: '#f0f2f8', color: '#5a6082' }
  const status = STATUS_STYLE[issue.status]   || STATUS_STYLE.pending

  return (
    <div
      onClick={() => navigate(`/issues/${issue.id}`)}
      style={s.card}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow)';    e.currentTarget.style.transform = 'translateY(0)' }}
    >
      {issue.image_url && (
        <div style={s.imgBox}>
          <img src={issue.image_url} alt={issue.title} style={s.img} />
        </div>
      )}

      <div style={s.body}>
        <div style={s.tagRow}>
          <span style={{ ...s.tag, background: cat.bg, color: cat.color }}>{issue.category.toUpperCase()}</span>
          <span style={{ ...s.tag, background: sev.bg, color: sev.color }}>{issue.severity.toUpperCase()}</span>
          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: status.color, fontWeight: 600 }}>
            ● {status.label}
          </span>
        </div>

        <h3 style={s.title}>{issue.title}</h3>
        <p style={s.desc}>
          {issue.description.length > 110 ? issue.description.slice(0, 110) + '…' : issue.description}
        </p>

        {issue.admin_comment && (
          <div style={s.adminNote}>
            <span style={{ fontWeight: 600, color: '#4361ee' }}>Admin: </span>
            {issue.admin_comment}
          </div>
        )}

        <div style={s.footer}>
          <button
            onClick={handleVote}
            disabled={loading}
            style={{ ...s.voteBtn, ...(voted ? s.votedBtn : {}) }}
          >
            ▲ {votes}
          </button>
          <span style={s.stat}>💬 {issue.comment_count}</span>
          <span style={s.stat}>⚡ {issue.priority_score}</span>
          <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            {new Date(issue.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  )
}

const s = {
  card:     { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', cursor: 'pointer', transition: 'all var(--transition)', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column' },
  imgBox:   { height: '170px', overflow: 'hidden', background: 'var(--bg-raised)' },
  img:      { width: '100%', height: '100%', objectFit: 'cover' },
  body:     { padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 },
  tagRow:   { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' },
  tag:      { padding: '2px 9px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 700, fontFamily: 'var(--font-display)' },
  title:    { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.98rem', lineHeight: 1.3, color: 'var(--text)' },
  desc:     { fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.55 },
  adminNote:{ background: 'var(--accent-light)', borderLeft: '3px solid var(--accent)', padding: '6px 10px', borderRadius: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' },
  footer:   { display: 'flex', alignItems: 'center', gap: '10px', marginTop: 'auto' },
  stat:     { fontSize: '0.78rem', color: 'var(--text-dim)' },
  voteBtn:  { background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: '6px', padding: '4px 10px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', transition: 'all var(--transition)', fontFamily: 'var(--font-display)' },
  votedBtn: { background: 'var(--accent-light)', border: '1px solid var(--accent)', color: 'var(--accent)' },
}
