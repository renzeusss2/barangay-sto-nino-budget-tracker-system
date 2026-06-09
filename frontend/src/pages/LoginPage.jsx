import logo from '../assets/logo.jpg'
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Lock, User, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { AuthLeftPanel } from '../components/AuthLeftPanel'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.password) return toast.error('Please fill in all fields')
    setLoading(true)
    try {
      await login(form.username, form.password)
      toast.success('Welcome back!')
      navigate('/')
    } catch (err) {
      if (!err.response) {
        toast.error('Cannot connect to server. Make sure the backend is running.', { duration: 6000 })
      } else if (err.response?.status === 401) {
        toast.error('Invalid username or password.')
      } else {
        toast.error(err.response?.data?.detail || 'Login failed.')
      }
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>

      {/* ── Left Panel ── */}
      <AuthLeftPanel variant="login" />

      {/* ── Right Panel ── */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="mb-8 lg:hidden text-center">
            <div className="mb-3 flex justify-center">
            <img
              src={logo.jpg}
              alt="Barangay Sto. Niño Logo"
              className="w-24 h-24 object-contain"
            />
          </div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-white)' }}>Barangay Sto. Niño</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Budget Tracking System</p>
          </div>

          <div className="rounded-2xl p-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
            <div className="rounded-full h-1 mb-6" style={{ background: 'linear-gradient(90deg, var(--gold), var(--gold-light))' }} />

            <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-white)' }}>Sign In</h2>
            <p className="text-sm mb-7" style={{ color: 'var(--text-muted)' }}>Access the budget management system</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Username</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input type="text" className="input pl-9" placeholder="Enter username"
                    value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} autoComplete="username" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="label" style={{ marginBottom: 0 }}>Password</label>
                  <Link to="/forgot-password" className="text-xs transition-colors"
                    style={{ color: 'var(--gold-light)', textDecoration: 'none' }}
                    onMouseEnter={e => e.target.style.color = 'var(--gold)'}
                    onMouseLeave={e => e.target.style.color = 'var(--gold-light)'}>
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input type={showPw ? 'text' : 'password'} className="input pl-9 pr-10" placeholder="Enter password"
                    value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} autoComplete="current-password" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-primary w-full justify-center py-3 text-sm mt-2" disabled={loading}>
                {loading
                  ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  : <Lock size={15} />}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 pt-5 text-center" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Don't have an account? </span>
              <Link to="/register" className="text-sm font-medium transition-colors"
                style={{ color: 'var(--gold-light)', textDecoration: 'none' }}
                onMouseEnter={e => e.target.style.color = 'var(--gold)'}
                onMouseLeave={e => e.target.style.color = 'var(--gold-light)'}>
                Register here
              </Link>
            </div>
          </div>

          {/* ✅ Fixed: © 2025 consistent sa lahat ng pages */}
          <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
            AI-Powered & Blockchain-Based Budget Tracking System v1.0<br />
            © 2025 Barangay Sto. Niño, Parañaque City
          </p>
        </div>
      </div>
    </div>
  )
}