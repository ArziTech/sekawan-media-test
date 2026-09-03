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

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

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
                <Route path="/vehicles" element={<Vehicles />} />
                <Route path="/drivers" element={<Drivers />} />
                <Route path="/fuel-logs" element={<FuelLogs />} />
                <Route path="/service-logs" element={<ServiceLogs />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/activity-logs" element={<ActivityLogs />} />
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
