import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './components/theme-provider';
import { AppLayout } from './components/layout/AppLayout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes cache
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { BranchDashboard } from './pages/BranchDashboard';
import { BranchDetail } from './pages/BranchDetail';
import { Duties } from './pages/Duties';
import { Bookings } from './pages/Bookings';
import { Approvals } from './pages/Approvals';
import { Vehicles } from './pages/Vehicles';
import { Drivers } from './pages/Drivers';
import { FuelLogs } from './pages/FuelLogs';
import { ServiceLogs } from './pages/ServiceLogs';
import { Reports } from './pages/Reports';
import { ActivityLogs } from './pages/ActivityLogs';
import { UsersManagement } from './pages/UsersManagement';

const ProtectedRoute = ({ children, adminOnly = false, approverAllowed = false }) => {
  const { user, loading, isAdmin, isApprover } = useAuth();

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

  // If user is Approver, they can ONLY access routes that have approverAllowed set to true
  if (isApprover && !approverAllowed) {
    return <Navigate to="/approvals" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to={isApprover ? "/approvals" : "/dashboard"} replace />;
  }

  return children;
};

const FallbackRoute = () => {
  const { user, loading, isApprover } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  return <Navigate to={isApprover ? "/approvals" : "/dashboard"} replace />;
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
                    <ProtectedRoute approverAllowed>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute adminOnly>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/branch-dashboard"
                    element={
                      <ProtectedRoute adminOnly>
                        <BranchDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/branch-dashboard/:id"
                    element={
                      <ProtectedRoute adminOnly>
                        <BranchDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/duties"
                    element={
                      <ProtectedRoute adminOnly>
                        <Duties />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/bookings"
                    element={
                      <ProtectedRoute adminOnly>
                        <Bookings />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/approvals"
                    element={
                      <ProtectedRoute approverAllowed>
                        <Approvals />
                      </ProtectedRoute>
                    }
                  />
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
                  <Route
                    path="/reports"
                    element={
                      <ProtectedRoute adminOnly>
                        <Reports />
                      </ProtectedRoute>
                    }
                  />
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
                <Route path="*" element={<FallbackRoute />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
