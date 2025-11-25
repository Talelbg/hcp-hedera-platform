import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Subscriptions from './pages/Subscriptions';
import ImportData from './pages/ImportData';
import ImportCommunity from './pages/ImportCommunity';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';

// Simple loading component
const Loading = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#0e0c15]">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2a00ff]"></div>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return <Loading />;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Wrap the protected content with the Sidebar layout
  return (
    <div className="flex min-h-screen bg-[#0e0c15]">
      <Sidebar />
      <div className="flex-1 lg:ml-72 min-h-screen relative z-0 overflow-y-auto">
        {/* Background gradient for the main content area */}
         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1c1b22] via-[#0e0c15] to-[#0e0c15] pointer-events-none -z-10"></div>
        {children}
      </div>
    </div>
  );
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
            path="/subscriptions"
            element={
                <ProtectedRoute>
                <Subscriptions />
                </ProtectedRoute>
            }
            />
             <Route
            path="/import"
            element={
                <ProtectedRoute>
                <ImportData />
                </ProtectedRoute>
            }
            />
            <Route
            path="/import-community"
            element={
                <ProtectedRoute>
                <ImportCommunity />
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
            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Catch all other routes and redirect to dashboard for now */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
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
