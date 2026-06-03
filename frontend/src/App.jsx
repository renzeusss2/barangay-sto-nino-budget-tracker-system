import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import DashboardPage from './pages/DashboardPage'
import TransactionsPage from './pages/TransactionsPage'
import BudgetPage from './pages/BudgetPage'
import ReportsPage from './pages/ReportsPage'
import AIInsightsPage from './pages/AIInsightsPage'
import BlockchainPage from './pages/BlockchainPage'

// ── Loading Screen ────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0e1a12',
      gap: '20px',
    }}>
      <div style={{ fontSize: '52px' }}>🏛️</div>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ color: '#ffffff', fontSize: '22px', fontWeight: '700', margin: '0 0 6px' }}>
          Barangay Sto. Niño
        </h1>
        <p style={{ color: '#c49c40', fontSize: '13px', margin: '0 0 24px' }}>
          Budget Tracking System
        </p>
      </div>
      {/* Gold spinning loader */}
      <div style={{
        width: '36px',
        height: '36px',
        border: '3px solid rgba(196,156,64,0.2)',
        borderTop: '3px solid #c49c40',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: '#6e8872', fontSize: '12px' }}>Initializing system...</p>
    </div>
  )
}

// ── Protected Route ───────────────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user)   return <Navigate to="/login" replace />
  return children
}

// ── Public Route (redirect to dashboard if already logged in) ─────────────────
function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (user)    return <Navigate to="/" replace />
  return children
}

// ── App Routes ────────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* Public routes — accessible without login */}
      <Route path="/login"           element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register"        element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/reset-password"  element={<ResetPasswordPage />} />

      {/* Protected routes — requires login */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index                    element={<DashboardPage />} />
        <Route path="transactions"      element={<TransactionsPage />} />
        <Route path="budget"            element={<BudgetPage />} />
        <Route path="reports"           element={<ReportsPage />} />
        <Route path="ai-insights"       element={<AIInsightsPage />} />
        <Route path="blockchain"        element={<BlockchainPage />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#122018',
              color: '#f0f0f0',
              border: '1px solid #2f5238',
              borderRadius: '10px',
              fontSize: '13px',
            },
            success: { iconTheme: { primary: '#c49c40', secondary: '#0e1a12' } },
            error:   { iconTheme: { primary: '#f87171', secondary: '#0e1a12' } },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}