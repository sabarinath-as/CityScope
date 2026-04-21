import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
API.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refresh = localStorage.getItem('refresh_token');
        if (!refresh) throw new Error('No refresh token');
        const { data } = await axios.post('/api/auth/token/refresh/', { refresh });
        localStorage.setItem('access_token', data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return API(original);
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default API;

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => API.post('/auth/register/', data),
  login: (data) => API.post('/auth/login/', data),
  logout: (refresh) => API.post('/auth/logout/', { refresh }),
  me: () => API.get('/auth/me/'),
};

// ── Issues ────────────────────────────────────────────────────────────────────
export const issuesAPI = {
  list: (params) => API.get('/issues/', { params }),
  detail: (id) => API.get(`/issues/${id}/`),
  create: (data) => API.post('/issues/', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => API.patch(`/issues/${id}/`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => API.delete(`/issues/${id}/`),
  updateStatus: (id, status) => API.patch(`/issues/${id}/status/`, { status }),
  mine: () => API.get('/issues/mine/'),
};

// ── Votes ─────────────────────────────────────────────────────────────────────
export const votesAPI = {
  toggle: (issueId) => API.post(`/issues/${issueId}/vote/`),
};

// ── Comments ──────────────────────────────────────────────────────────────────
export const commentsAPI = {
  list: (issueId) => API.get(`/issues/${issueId}/comments/`),
  create: (issueId, data) => API.post(`/issues/${issueId}/comments/`, data),
  delete: (commentId) => API.delete(`/comments/${commentId}/`),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsAPI = {
  list: () => API.get('/notifications/'),
  unreadCount: () => API.get('/notifications/unread-count/'),
  markAllRead: () => API.post('/notifications/read/'),
  markRead: (id) => API.patch(`/notifications/${id}/read/`),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  stats: () => API.get('/dashboard/'),
};
