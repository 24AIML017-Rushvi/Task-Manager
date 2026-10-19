import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import './App.css';

// Route-Level Code Splitting via React.lazy() and Dynamic Imports (Practical 8)
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const WorkflowRulesPage = lazy(() => import('./pages/WorkflowRulesPage'));

/**
 * Visible loading fallback UI for lazy-loaded route components (Practical 8).
 */
function LoadingFallback() {
  return (
    <div
      className="page-loading-fallback"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '12px',
        color: '#475569',
        fontSize: '1.125rem',
        fontWeight: 500,
        textAlign: 'center',
        padding: '2rem'
      }}
      role="status"
      aria-live="polite"
    >
      <div className="spinner-lg" aria-hidden="true" />
      <span>Loading page...</span>
    </div>
  );
}

/**
 * Public route wrapper: redirects already logged-in users to /dashboard or /admin.
 */
function PublicRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) {
    return (
      <div className="auth-loading-screen">
        <div className="spinner-lg" aria-hidden="true" />
      </div>
    );
  }
  if (isAuthenticated) {
    return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />;
  }
  return children;
}

/**
 * Root and fallback redirect helper based on authentication and role.
 */
function RootRedirect() {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) {
    return (
      <div className="auth-loading-screen">
        <div className="spinner-lg" aria-hidden="true" />
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public Authentication Routes (Lazy Loaded) */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Suspense fallback={<LoadingFallback />}>
                    <LoginPage />
                  </Suspense>
                </PublicRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <Suspense fallback={<LoadingFallback />}>
                    <SignupPage />
                  </Suspense>
                </PublicRoute>
              }
            />

            {/* User Dashboard Route (Lazy Loaded) */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingFallback />}>
                    <DashboardPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            {/* Admin Dashboard Route (Lazy Loaded, Admin Guarded) */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminDashboardPage />
                  </Suspense>
                </AdminRoute>
              }
            />

            {/* Admin-Only Date-Range Reports Route (Lazy Loaded, Admin Guarded) */}
            <Route
              path="/reports"
              element={
                <AdminRoute>
                  <Suspense fallback={<LoadingFallback />}>
                    <ReportsPage />
                  </Suspense>
                </AdminRoute>
              }
            />

            {/* Workflow Rules Route (Lazy Loaded, Protected) */}
            <Route
              path="/rules"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<LoadingFallback />}>
                    <WorkflowRulesPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />

            {/* Root and Fallback Navigation */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
