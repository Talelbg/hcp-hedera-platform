import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';

// Simple loading component
const Loading = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#06060C]">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return <Loading />;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route
            path="/dashboard"
            element={
                <ProtectedRoute>
                <Dashboard />
                </ProtectedRoute>
            }
            />
            <Route
            path="/admin"
            element={
                <ProtectedRoute>
                <AdminDashboard />
                </ProtectedRoute>
            }
            />
            {/* Placeholder routes for other sidebar items to prevent 404s if clicked */}
            <Route path="/membership" element={<ProtectedRoute><div className="text-white">Membership Page Coming Soon</div></ProtectedRoute>} />
            <Route path="/developers" element={<ProtectedRoute><div className="text-white">Developers Page Coming Soon</div></ProtectedRoute>} />
            <Route path="/outreach" element={<ProtectedRoute><div className="text-white">Smart Outreach Page Coming Soon</div></ProtectedRoute>} />
            <Route path="/finance" element={<ProtectedRoute><div className="text-white">Finance Page Coming Soon</div></ProtectedRoute>} />
            <Route path="/reporting" element={<ProtectedRoute><div className="text-white">Reporting Page Coming Soon</div></ProtectedRoute>} />
            <Route path="/events" element={<ProtectedRoute><div className="text-white">Event Management Page Coming Soon</div></ProtectedRoute>} />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
        <Router>
            <AppRoutes />
        </Router>
    </AuthProvider>
  );
};

export default App;
