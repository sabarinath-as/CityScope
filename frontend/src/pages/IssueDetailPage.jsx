import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import { issuesAPI, votesAPI, commentsAPI } from '../api';
import { useAuth } from '../context/AuthContext';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const CAT_COLORS = { road: '#fb923c', water: '#4f8ef7', electricity: '#fbbd23', waste: '#36d399' };
const SEV_COLORS = { low: 'var(--green)', medium: 'var(--yellow)', high: 'var(--red)' };
const STATUS_META = {
  reported:    { label: 'Reported',    color: 'var(--text-muted)', bg: 'rgba(139,144,167,0.15)' },
  in_progress: { label: 'In Progress', color: 'var(--yellow)',     bg: 'var(--yellow-dim)' },
  resolved:    { label: 'Resolved',    color: 'var(--green)',      bg: 'var(--green-dim)' },
};

export default function IssueDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voteCount, setVoteCount] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [voting, setVoting] = useState(false);

  const [commentText, setCommentText] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [commentError, setCommentError] = useState('');

  const [adminStatus, setAdminStatus] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await issuesAPI.detail(id);
        setIssue(data);
        setVoteCount(data.vote_count);
        setHasVoted(data.has_voted);
        setAdminStatus(data.status);
      } catch { navigate('/feed'); }
      setLoading(false);
    };
    fetch();
  }, [id, navigate]);

  const handleVote = async () => {
    if (!user) { navigate('/login'); return; }
    if (voting) return;
    setVoting(true);
    try {
      const { data } = await votesAPI.toggle(id);
      setVoteCount(data.vote_count);
      setHasVoted(data.has_voted);
    } catch {}
    setVoting(false);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setCommenting(true); setCommentError('');
    try {
      const { data: newComment } = await commentsAPI.create(id, { text: commentText });
      setIssue((prev) => ({ ...prev, comments: [...(prev.comments || []), newComment] }));
      setCommentText('');
    } catch (err) {
      setCommentError(err.response?.data?.text?.[0] || 'Failed to post comment.');
    }
    setCommenting(false);
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await commentsAPI.delete(commentId);
      setIssue((prev) => ({ ...prev, comments: prev.comments.filter((c) => c.id !== commentId) }));
    } catch {}
  };

  const handleStatusUpdate = async () => {
    setUpdatingStatus(true); setStatusMsg('');
    try {
      const { data } = await issuesAPI.updateStatus(id, adminStatus);
      setIssue((prev) => ({ ...prev, status: data.status }));
      setStatusMsg('Status updated successfully.');
    } catch {
      setStatusMsg('Failed to update status.');
    }
    setUpdatingStatus(false);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  if (loading) return <div style={styles.loader}>Loading issue…</div>;
  if (!issue) return null;

  const catColor = CAT_COLORS[issue.category] || 'var(--accent)';
  const statusInfo = STATUS_META[issue.status] || STATUS_META.reported;
  const isOwner = user && user.id === issue.user?.id;

  return (
    <div style={styles.page}>
      {/* Back */}
      <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>

      <div style={styles.layout}>
        {/* LEFT: Main content */}
        <div style={styles.mainCol}>
          {/* Header */}
          <div style={styles.card}>
            <div style={styles.tagRow}>
              <span style={{ ...styles.tag, background: catColor + '22', color: catColor }}>{issue.category.toUpperCase()}</span>
              <span style={{ ...styles.tag, background: SEV_COLORS[issue.severity] + '22', color: SEV_COLORS[issue.severity] }}>{issue.severity.toUpperCase()} SEVERITY</span>
              <span style={{ ...styles.tag, background: statusInfo.bg, color: statusInfo.color }}>● {statusInfo.label}</span>
            </div>
            <h1 style={styles.title}>{issue.title}</h1>
            <div style={styles.meta}>
              <span>By <strong>{issue.user?.username}</strong></span>
              <span>·</span>
              <span>{new Date(issue.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              {issue.updated_at !== issue.created_at && <span style={{ color: 'var(--text-dim)' }}>(updated {new Date(issue.updated_at).toLocaleDateString()})</span>}
            </div>

            <p style={styles.description}>{issue.description}</p>

            {/* Priority score */}
            <div style={styles.priorityBar}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Priority Score</span>
              <span style={styles.priorityValue}>⚡ {issue.priority_score}</span>
            </div>

            {/* Vote button */}
            <button onClick={handleVote} disabled={voting} style={{ ...styles.voteBtn, ...(hasVoted ? styles.voteBtnActive : {}) }}>
              {hasVoted ? '▲ Upvoted' : '▲ Upvote'} · {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
            </button>
          </div>

          {/* Image */}
          {issue.image_url && (
            <div style={styles.card}>
              <img src={issue.image_url} alt="Issue" style={styles.issueImg} />
            </div>
          )}

          {/* Admin Status Control */}
          {user?.is_staff && (
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>⚙ Admin: Update Status</h3>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <select value={adminStatus} onChange={(e) => setAdminStatus(e.target.value)} style={{ flex: 1 }}>
                  <option value="reported">Reported</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
                <button onClick={handleStatusUpdate} disabled={updatingStatus} style={styles.adminBtn}>
                  {updatingStatus ? 'Updating…' : 'Update Status'}
                </button>
              </div>
              {statusMsg && <p style={{ fontSize: '0.85rem', color: 'var(--green)', marginTop: '8px' }}>{statusMsg}</p>}
            </div>
          )}

          {/* Comments */}
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>💬 Comments ({issue.comments?.length || 0})</h3>

            {user ? (
              <form onSubmit={handleComment} style={styles.commentForm}>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share your thoughts or updates…"
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
                {commentError && <span style={{ color: 'var(--red)', fontSize: '0.8rem' }}>{commentError}</span>}
                <button type="submit" disabled={commenting || !commentText.trim()} style={styles.commentBtn}>
                  {commenting ? 'Posting…' : 'Post Comment'}
                </button>
              </form>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                <a href="/login">Sign in</a> to leave a comment.
              </p>
            )}

            <div style={styles.commentList}>
              {issue.comments?.length === 0 && (
                <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>No comments yet. Be the first!</p>
              )}
              {issue.comments?.map((c) => (
                <div key={c.id} style={styles.commentItem}>
                  <div style={styles.commentHeader}>
                    <div style={styles.commentAvatar}>{c.user?.username?.[0]?.toUpperCase()}</div>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{c.user?.username}</span>
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginLeft: '8px' }}>{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                    {(user?.id === c.user?.id || user?.is_staff) && (
                      <button onClick={() => handleDeleteComment(c.id)} style={styles.deleteCommentBtn} title="Delete comment">✕</button>
                    )}
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, paddingLeft: '36px' }}>{c.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Sidebar */}
        <div style={styles.sideCol}>
          {/* Location */}
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>📍 Location</h3>
            <div style={{ height: '220px', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px' }}>
              <MapContainer
                center={[issue.latitude, issue.longitude]}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[issue.latitude, issue.longitude]} />
              </MapContainer>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
              {issue.latitude.toFixed(5)}°N, {issue.longitude.toFixed(5)}°E
            </div>
          </div>

          {/* Issue stats */}
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>Issue Stats</h3>
            <div style={styles.statList}>
              {[
                { label: 'Category', value: issue.category.charAt(0).toUpperCase() + issue.category.slice(1) },
                { label: 'Severity', value: issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1) },
                { label: 'Status', value: statusInfo.label },
                { label: 'Upvotes', value: voteCount },
                { label: 'Comments', value: issue.comments?.length || 0 },
                { label: 'Priority', value: issue.priority_score },
              ].map(({ label, value }) => (
                <div key={label} style={styles.statRow}>
                  <span style={styles.statLabel}>{label}</span>
                  <span style={styles.statValue}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reporter */}
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>Reported By</h3>
            <div style={styles.reporterRow}>
              <div style={{ ...styles.commentAvatar, width: '36px', height: '36px', fontSize: '1rem' }}>
                {issue.user?.username?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{issue.user?.first_name} {issue.user?.last_name}</div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>@{issue.user?.username}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { maxWidth: '1100px', margin: '0 auto' },
  loader: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' },
  backBtn: { background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: '16px', padding: 0 },
  layout: { display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'start' },
  mainCol: { display: 'flex', flexDirection: 'column', gap: '16px' },
  sideCol: { display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '24px' },
  card: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' },
  tagRow: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  tag: { padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-display)' },
  title: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.3px', lineHeight: 1.3 },
  meta: { display: 'flex', gap: '8px', fontSize: '0.83rem', color: 'var(--text-muted)', flexWrap: 'wrap' },
  description: { fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.7, whiteSpace: 'pre-wrap' },
  priorityBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-raised)', borderRadius: 'var(--radius-sm)', padding: '10px 14px' },
  priorityValue: { fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--accent)', fontSize: '1.1rem' },
  voteBtn: { background: 'var(--bg-raised)', border: '1.5px solid var(--border)', color: 'var(--text)', borderRadius: 'var(--radius-sm)', padding: '12px 20px', fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-display)', cursor: 'pointer', alignSelf: 'flex-start', transition: 'all 0.2s' },
  voteBtnActive: { background: 'var(--accent-dim)', border: '1.5px solid var(--accent)', color: 'var(--accent)' },
  issueImg: { width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '8px' },
  sectionTitle: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px' },
  adminBtn: { background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', padding: '10px 16px', fontFamily: 'var(--font-display)', fontWeight: 700, cursor: 'pointer', flexShrink: 0 },
  commentForm: { display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' },
  commentBtn: { background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', padding: '9px 18px', fontFamily: 'var(--font-display)', fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-end', fontSize: '0.88rem' },
  commentList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  commentItem: { display: 'flex', flexDirection: 'column', gap: '6px' },
  commentHeader: { display: 'flex', alignItems: 'center', gap: '10px' },
  commentAvatar: { width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.75rem', color: '#fff', flexShrink: 0 },
  deleteCommentBtn: { marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.75rem', padding: '2px 6px' },
  statList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  statRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.83rem', borderBottom: '1px solid var(--border)', paddingBottom: '8px' },
  statLabel: { color: 'var(--text-muted)' },
  statValue: { fontWeight: 700, fontFamily: 'var(--font-display)' },
  reporterRow: { display: 'flex', alignItems: 'center', gap: '12px' },
};
