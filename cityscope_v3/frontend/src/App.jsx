import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth }           from './context/AuthContext'
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext'

import Layout       from './components/Layout'
import AdminLayout  from './components/AdminLayout'

import LoginPage      from './pages/LoginPage'
import RegisterPage   from './pages/RegisterPage'
import FeedPage       from './pages/FeedPage'
import ReportPage     from './pages/ReportPage'
import MapPage        from './pages/MapPage'
import DashboardPage  from './pages/DashboardPage'
import IssueDetailPage from './pages/IssueDetailPage'

import AdminLogin           from './pages/admin/AdminLogin'
import AdminDashboard       from './pages/admin/AdminDashboard'
import ComplaintManagement  from './pages/admin/ComplaintManagement'
import AdminUsers           from './pages/admin/AdminUsers'

const Loader = () => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
    height:'100vh', fontFamily:'var(--font-display)', fontSize:'1.1rem', color:'var(--text-muted)' }}>
    Loading CityScope…
  </div>
)

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Loader />
  return user ? children : <Navigate to="/login" replace />
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/feed" replace /> : children
}

function AdminPrivate({ children }) {
  const { admin, loading } = useAdminAuth()
  if (loading) return <Loader />
  return admin ? children : <Navigate to="/admin/login" replace />
}

function AdminPublic({ children }) {
  const { admin, loading } = useAdminAuth()
  if (loading) return null
  return admin ? <Navigate to="/admin/dashboard" replace /> : children
}

export default function App() {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public auth */}
            <Route path="/login"    element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
            <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />

            {/* User app */}
            <Route path="/" element={<Layout />}>
              <Route index        element={<Navigate to="/feed" replace />} />
              <Route path="feed"        element={<FeedPage />} />
              <Route path="issues/:id"  element={<IssueDetailPage />} />
              <Route path="map"         element={<MapPage />} />
              <Route path="dashboard"   element={<DashboardPage />} />
              <Route path="report"      element={<PrivateRoute><ReportPage /></PrivateRoute>} />
            </Route>

            {/* Admin auth */}
            <Route path="/admin/login" element={<AdminPublic><AdminLogin /></AdminPublic>} />

            {/* Admin app */}
            <Route path="/admin" element={<AdminPrivate><AdminLayout /></AdminPrivate>}>
              <Route index            element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard"  element={<AdminDashboard />} />
              <Route path="complaints" element={<ComplaintManagement />} />
              <Route path="users"      element={<AdminUsers />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AdminAuthProvider>
    </AuthProvider>
  )
}
