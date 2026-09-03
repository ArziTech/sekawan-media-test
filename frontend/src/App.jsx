import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './components/theme-provider';
import { AppLayout } from './components/layout/AppLayout';

import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { BranchDashboard } from './pages/BranchDashboard';
import { Bookings } from './pages/Bookings';
import { Approvals } from './pages/Approvals';
import { Vehicles } from './pages/Vehicles';
import { Drivers } from './pages/Drivers';
import { FuelLogs } from './pages/FuelLogs';
import { ServiceLogs } from './pages/ServiceLogs';
import { Reports } from './pages/Reports';
import { ActivityLogs } from './pages/ActivityLogs';
import { UsersManagement } from './pages/UsersManagement';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="nickel-fleet-theme">
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />

              {/* Authenticated routes wrapped in AppLayout */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/branch-dashboard" element={<BranchDashboard />} />
                <Route path="/bookings" element={<Bookings />} />
                <Route path="/approvals" element={<Approvals />} />
                <Route
                  path="/vehicles"
                  element={
                    <ProtectedRoute adminOnly>
                      <Vehicles />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/drivers"
                  element={
                    <ProtectedRoute adminOnly>
                      <Drivers />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/fuel-logs"
                  element={
                    <ProtectedRoute adminOnly>
                      <FuelLogs />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/service-logs"
                  element={
                    <ProtectedRoute adminOnly>
                      <ServiceLogs />
                    </ProtectedRoute>
                  }
                />
                <Route path="/reports" element={<Reports />} />
                <Route
                  path="/activity-logs"
                  element={
                    <ProtectedRoute adminOnly>
                      <ActivityLogs />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/users"
                  element={
                    <ProtectedRoute adminOnly>
                      <UsersManagement />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
