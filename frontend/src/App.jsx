import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import FeedPage from './pages/FeedPage';
import ReportPage from './pages/ReportPage';
import MapPage from './pages/MapPage';
import DashboardPage from './pages/DashboardPage';
import IssueDetailPage from './pages/IssueDetailPage';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', color:'var(--text-muted)', fontFamily:'var(--font-display)', fontSize:'1.2rem' }}>Loading CityScope…</div>;
  return user ? children : <Navigate to="/login" replace />;
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/feed" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
          <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/feed" replace />} />
            <Route path="feed" element={<FeedPage />} />
            <Route path="issues/:id" element={<IssueDetailPage />} />
            <Route path="map" element={<MapPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="report" element={<PrivateRoute><ReportPage /></PrivateRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
