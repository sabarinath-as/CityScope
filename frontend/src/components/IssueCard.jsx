import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { votesAPI } from '../api';
import { useAuth } from '../context/AuthContext';

const CATEGORY_COLORS = { road: '#fb923c', water: '#4f8ef7', electricity: '#fbbd23', waste: '#36d399' };
const SEVERITY_COLORS = { low: 'var(--green)', medium: 'var(--yellow)', high: 'var(--red)' };
const STATUS_LABELS = { reported: { label: 'Reported', color: 'var(--text-muted)' }, in_progress: { label: 'In Progress', color: 'var(--yellow)' }, resolved: { label: 'Resolved', color: 'var(--green)' } };

export default function IssueCard({ issue, onVoteUpdate }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [voteCount, setVoteCount] = useState(issue.vote_count);
  const [hasVoted, setHasVoted] = useState(issue.has_voted);
  const [voting, setVoting] = useState(false);

  const handleVote = async (e) => {
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    if (voting) return;
    setVoting(true);
    try {
      const { data } = await votesAPI.toggle(issue.id);
      setVoteCount(data.vote_count);
      setHasVoted(data.has_voted);
      if (onVoteUpdate) onVoteUpdate(issue.id, data);
    } catch {}
    setVoting(false);
  };

  const catColor = CATEGORY_COLORS[issue.category] || 'var(--accent)';
  const statusInfo = STATUS_LABELS[issue.status] || STATUS_LABELS.reported;

  return (
    <div onClick={() => navigate(`/issues/${issue.id}`)} style={styles.card}>
      {issue.image_url && (
        <div style={styles.imgWrap}>
          <img src={issue.image_url} alt={issue.title} style={styles.img} />
        </div>
      )}
      <div style={styles.body}>
        <div style={styles.meta}>
          <span style={{ ...styles.tag, background: catColor + '22', color: catColor }}>
            {issue.category.toUpperCase()}
          </span>
          <span style={{ ...styles.tag, background: SEVERITY_COLORS[issue.severity] + '22', color: SEVERITY_COLORS[issue.severity] }}>
            {issue.severity.toUpperCase()}
          </span>
          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: statusInfo.color, fontWeight: 600 }}>
            ● {statusInfo.label}
          </span>
        </div>

        <h3 style={styles.title}>{issue.title}</h3>
        <p style={styles.desc}>{issue.description.length > 120 ? issue.description.slice(0, 120) + '…' : issue.description}</p>

        <div style={styles.footer}>
          <div style={styles.footerLeft}>
            <button onClick={handleVote} style={{ ...styles.voteBtn, ...(hasVoted ? styles.voteBtnActive : {}) }} disabled={voting}>
              ▲ {voteCount}
            </button>
            <span style={styles.footerStat}>💬 {issue.comment_count}</span>
            <span style={styles.footerStat}>⚡ {issue.priority_score}</span>
          </div>
          <span style={styles.time}>{new Date(issue.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  card: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.2s, transform 0.2s', display: 'flex', flexDirection: 'column' },
  imgWrap: { height: '180px', overflow: 'hidden', background: 'var(--bg-raised)' },
  img: { width: '100%', height: '100%', objectFit: 'cover' },
  body: { padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 },
  meta: { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' },
  tag: { padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, fontFamily: 'var(--font-display)' },
  title: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', lineHeight: 1.3, color: 'var(--text)' },
  desc: { fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.5 },
  footer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' },
  footerLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  footerStat: { fontSize: '0.8rem', color: 'var(--text-dim)' },
  voteBtn: { background: 'var(--bg-raised)', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: '6px', padding: '4px 10px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' },
  voteBtnActive: { background: 'var(--accent-dim)', border: '1px solid var(--accent)', color: 'var(--accent)' },
  time: { fontSize: '0.72rem', color: 'var(--text-dim)' },
};
