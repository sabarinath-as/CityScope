import axios from 'axios'

// ── User API ──────────────────────────────────────────────────────────────────
const API = axios.create({ baseURL: '/api' })

API.interceptors.request.use(cfg => {
  const t = localStorage.getItem('access_token')
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

API.interceptors.response.use(r => r, async err => {
  const orig = err.config
  if (err.response?.status === 401 && !orig._retry) {
    orig._retry = true
    try {
      const refresh = localStorage.getItem('refresh_token')
      if (!refresh) throw new Error()
      const { data } = await axios.post('/api/auth/token/refresh/', { refresh })
      localStorage.setItem('access_token', data.access)
      orig.headers.Authorization = `Bearer ${data.access}`
      return API(orig)
    } catch {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      window.location.href = '/login'
    }
  }
  return Promise.reject(err)
})

export default API

export const authAPI = {
  register : d  => API.post('/auth/register/', d),
  login    : d  => API.post('/auth/login/', d),
  logout   : r  => API.post('/auth/logout/', { refresh: r }),
  me       : () => API.get('/auth/me/'),
}

export const issuesAPI = {
  list   : p    => API.get('/issues/', { params: p }),
  detail : id   => API.get(`/issues/${id}/`),
  create : d    => API.post('/issues/', d, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update : (id,d)=> API.patch(`/issues/${id}/`, d, { headers: { 'Content-Type': 'multipart/form-data' } }),
  remove : id   => API.delete(`/issues/${id}/`),
  mine   : ()   => API.get('/issues/mine/'),
}

export const votesAPI = {
  toggle : id => API.post(`/issues/${id}/vote/`),
}

export const commentsAPI = {
  list   : id   => API.get(`/issues/${id}/comments/`),
  create : (id,d)=> API.post(`/issues/${id}/comments/`, d),
  remove : id   => API.delete(`/comments/${id}/`),
}

export const notifAPI = {
  list       : () => API.get('/notifications/'),
  unreadCount: () => API.get('/notifications/unread-count/'),
  markAllRead: () => API.post('/notifications/read/'),
}

export const dashboardAPI = {
  stats: () => API.get('/dashboard/'),
}

// ── Admin API ─────────────────────────────────────────────────────────────────
const ADMIN = axios.create({ baseURL: '/api' })

ADMIN.interceptors.request.use(cfg => {
  const t = localStorage.getItem('admin_access_token')
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

ADMIN.interceptors.response.use(r => r, async err => {
  const orig = err.config
  if (err.response?.status === 401 && !orig._retry) {
    orig._retry = true
    try {
      const refresh = localStorage.getItem('admin_refresh_token')
      if (!refresh) throw new Error()
      const { data } = await axios.post('/api/auth/token/refresh/', { refresh })
      localStorage.setItem('admin_access_token', data.access)
      orig.headers.Authorization = `Bearer ${data.access}`
      return ADMIN(orig)
    } catch {
      localStorage.removeItem('admin_access_token')
      localStorage.removeItem('admin_refresh_token')
      window.location.href = '/admin/login'
    }
  }
  return Promise.reject(err)
})

export const adminAPI = {
  login            : d      => axios.post('/api/auth/admin-login/', d),
  dashboard        : ()     => ADMIN.get('/admin/dashboard/'),
  complaints       : params => ADMIN.get('/admin/complaints/', { params }),
  complaintDetail  : id     => ADMIN.get(`/admin/complaints/${id}/`),
  updateComplaint  : (id,d) => ADMIN.patch(`/admin/complaints/${id}/`, d),
  deleteComplaint  : id     => ADMIN.delete(`/admin/complaints/${id}/`),
  users            : ()     => ADMIN.get('/admin/users/'),
}
