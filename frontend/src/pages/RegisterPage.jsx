import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../utils/api'
import { Lock, User, Mail, Shield, Eye, EyeOff, UserPlus, ChevronDown, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { AuthLeftPanel } from '../components/AuthLeftPanel'
import logo from '../assets/logo.png'

const ROLES = [
  { value: 'official',  label: 'Barangay Official', desc: 'View dashboards & reports' },
  { value: 'auditor',   label: 'Auditor',           desc: 'Requires admin code' },
  { value: 'treasurer', label: 'Treasurer',          desc: 'Requires admin code' },
  { value: 'admin',     label: 'Administrator',      desc: 'Requires admin code' },
]
const PRIVILEGED = ['admin', 'treasurer', 'auditor']

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '', password: '', confirmPassword: '',
    full_name: '', email: '', role: 'official', admin_code: '',
  })
  const [loading, setLoading]             = useState(false)
  const [showPw, setShowPw]               = useState(false)
  const [showConfirm, setShowConfirm]     = useState(false)
  const [showAdminCode, setShowAdminCode] = useState(false)

  const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.password || !form.full_name || !form.email)
      return toast.error('Please fill in all required fields.')
    if (form.password !== form.confirmPassword)
      return toast.error('Passwords do not match.')
    if (form.password.length < 8)
      return toast.error('Password must be at least 8 characters.')
    setLoading(true)
    try {
      const { data } = await authAPI.register({
        username: form.username, password: form.password,
        full_name: form.full_name, email: form.email,
        role: form.role, admin_code: form.admin_code,
      })
      toast.success(data.message || 'Account created successfully!')
      navigate('/login')
    } catch (err) {
      const detail = err.response?.data?.detail
      if (!err.response)              toast.error('Cannot connect to server.', { duration: 6000 })
      else if (err.response.status === 409) toast.error(detail || 'Username or email already exists.')
      else if (err.response.status === 403) toast.error(detail || 'Invalid admin registration code.')
      else                            toast.error(detail || 'Registration failed.')
    } finally { setLoading(false) }
  }

  const isPrivileged = PRIVILEGED.includes(form.role)

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>
      <AuthLeftPanel variant="register" />
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md py-8">

          <Link
            to="/login"
            className="inline-flex items-center gap-2 mb-6 text-sm transition-colors"
            style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <ArrowLeft size={15} /> Back to Sign In
          </Link>

          {/* Mobile logo */}
          <div className="mb-6 lg:hidden text-center">
            <div className="mb-3 flex justify-center">
              <div className="w-24 h-24 rounded-full overflow-hidden" style={{ border: '2px solid var(--border-gold)' }}>
                <img
                  src={logo}
                  alt="Barangay Sto. Niño Logo"
                  className="w-full h-full object-cover"
                  style={{ mixBlendMode: 'screen' }}
                />
              </div>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-white)' }}>Barangay Sto. Niño</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Budget Tracking System</p>
          </div>

          <div className="rounded-2xl p-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
            <div className="rounded-full h-1 mb-6" style={{ background: 'linear-gradient(90deg, var(--gold), var(--gold-light))' }} />
            <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-white)' }}>Create Account</h2>
            <p className="text-sm mb-7" style={{ color: 'var(--text-muted)' }}>Register to access the budget management system</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Full Name</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input type="text" className="input pl-9" placeholder="e.g. Juan dela Cruz"
                    value={form.full_name} onChange={set('full_name')} autoComplete="name" />
                </div>
              </div>
              <div>
                <label className="label">Email Address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input type="email" className="input pl-9" placeholder="you@example.com"
                    value={form.email} onChange={set('email')} autoComplete="email" />
                </div>
              </div>
              <div>
                <label className="label">Username</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input type="text" className="input pl-9" placeholder="Choose a username"
                    value={form.username} onChange={set('username')} autoComplete="username" />
                </div>
              </div>
              <div>
                <label className="label">Role</label>
                <div className="relative">
                  <Shield size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <select className="input pl-9 pr-8 appearance-none cursor-pointer"
                    value={form.role} onChange={set('role')}>
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                </div>
              </div>
              {isPrivileged && (
                <div className="rounded-lg p-3" style={{ background: 'var(--gold-dim)', border: '1px solid var(--border-gold)' }}>
                  <label className="label" style={{ color: 'var(--gold-light)' }}>Admin Registration Code</label>
                  <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                    Required for Auditor, Treasurer, and Administrator roles. Contact your system admin.
                  </p>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--gold)' }} />
                    <input type={showAdminCode ? 'text' : 'password'} className="input pl-9 pr-10"
                      placeholder="Enter admin code" value={form.admin_code} onChange={set('admin_code')} />
                    <button type="button" onClick={() => setShowAdminCode(!showAdminCode)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      {showAdminCode ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              )}
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input type={showPw ? 'text' : 'password'} className="input pl-9 pr-10"
                    placeholder="At least 8 characters" value={form.password} onChange={set('password')} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Confirm Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                  <input type={showConfirm ? 'text' : 'password'} className="input pl-9 pr-10"
                    placeholder="Re-enter password" value={form.confirmPassword} onChange={set('confirmPassword')} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>Passwords do not match</p>
                )}
              </div>
              <button type="submit" className="btn-primary w-full justify-center py-3 text-sm mt-2" disabled={loading}>
                {loading
                  ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  : <UserPlus size={15} />}
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 pt-5 text-center" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Already have an account? </span>
              <Link to="/login" className="text-sm font-medium"
                style={{ color: 'var(--gold-light)', textDecoration: 'none' }}
                onMouseEnter={e => e.target.style.color = 'var(--gold)'}
                onMouseLeave={e => e.target.style.color = 'var(--gold-light)'}>
                Sign In
              </Link>
            </div>
          </div>

          <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
            AI-Powered & Blockchain-Based Budget Tracking System v1.0<br />
            © 2025 Barangay Sto. Niño, Parañaque City
          </p>
        </div>
      </div>
    </div>
  )
}