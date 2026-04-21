import { useState, useEffect, useCallback } from 'react';
import { issuesAPI } from '../api';
import IssueCard from '../components/IssueCard';

const CATEGORIES = ['', 'road', 'water', 'electricity', 'waste'];
const SEVERITIES = ['', 'low', 'medium', 'high'];
const STATUSES = ['', 'reported', 'in_progress', 'resolved'];
const ORDERINGS = [
  { label: 'Priority', value: '-priority_score' },
  { label: 'Newest', value: '-created_at' },
  { label: 'Oldest', value: 'created_at' },
  { label: 'Severity', value: '-severity' },
];

export default function FeedPage() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ category: '', severity: '', status: '', ordering: '-priority_score' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, ordering: filters.ordering };
      if (search) params.search = search;
      if (filters.category) params.category = filters.category;
      if (filters.severity) params.severity = filters.severity;
      if (filters.status) params.status = filters.status;
      const { data } = await issuesAPI.list(params);
      const results = data.results || data;
      setIssues(results);
      setTotalPages(Math.ceil((data.count || results.length) / 20));
    } catch {}
    setLoading(false);
  }, [filters, search, page]);

  useEffect(() => { fetchIssues(); }, [fetchIssues]);

  const setFilter = (key, val) => { setFilters((f) => ({ ...f, [key]: val })); setPage(1); };

  const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchIssues(); };

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Issue Feed</h1>
          <p style={styles.sub}>Browse and upvote city issues ranked by priority</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div style={styles.controls}>
        <form onSubmit={handleSearch} style={styles.searchRow}>
          <input
            placeholder="Search issues…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
          <button type="submit" style={styles.searchBtn}>Search</button>
        </form>
        <div style={styles.filterRow}>
          {[
            { key: 'category', options: CATEGORIES, label: 'Category' },
            { key: 'severity', options: SEVERITIES, label: 'Severity' },
            { key: 'status', options: STATUSES, label: 'Status' },
          ].map(({ key, options, label }) => (
            <select key={key} value={filters[key]} onChange={(e) => setFilter(key, e.target.value)} style={styles.filterSelect}>
              <option value="">All {label}s</option>
              {options.filter(Boolean).map((o) => (
                <option key={o} value={o}>{o.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase())}</option>
              ))}
            </select>
          ))}
          <select value={filters.ordering} onChange={(e) => setFilter('ordering', e.target.value)} style={styles.filterSelect}>
            {ORDERINGS.map((o) => <option key={o.value} value={o.value}>Sort: {o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={styles.empty}>Loading issues…</div>
      ) : issues.length === 0 ? (
        <div style={styles.empty}>No issues found. Try changing your filters.</div>
      ) : (
        <div style={styles.grid}>
          {issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} onVoteUpdate={() => fetchIssues()} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={styles.pageBtn}>← Prev</button>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={styles.pageBtn}>Next →</button>
        </div>
      )}
    </div>
  );
}

const styles = {
  header: { marginBottom: '24px' },
  title: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', letterSpacing: '-0.5px' },
  sub: { color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' },
  controls: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px' },
  searchRow: { display: 'flex', gap: '8px' },
  searchInput: { flex: 1 },
  searchBtn: { background: 'var(--accent)', color: '#fff', padding: '10px 20px', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', flexShrink: 0, border: 'none' },
  filterRow: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  filterSelect: { flex: '1 1 160px', minWidth: '140px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' },
  empty: { textAlign: 'center', padding: '60px 24px', color: 'var(--text-muted)', fontSize: '1rem' },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '32px' },
  pageBtn: { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)', padding: '8px 16px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.85rem' },
};
