import logo from '../assets/logo.png'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, User, ArrowLeft, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { AuthLeftPanel } from '../components/AuthLeftPanel'

export default function ForgotPasswordPage() {
  const [form, setForm]       = useState({ username: '', email: '' })
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.email) return toast.error('Please fill in all fields.')
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', form)
      setSent(true)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Request failed. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>
      <AuthLeftPanel variant="forgot" />
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">

          <Link to="/login"
            className="inline-flex items-center gap-2 mb-6 text-sm transition-colors"
            style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
            <ArrowLeft size={15} /> Back to Sign In
          </Link>

          {/* Mobile logo */}
          <div className="mb-6 lg:hidden text-center">
            <div className="flex justify-center mb-2">
              <div className="w-16 h-16 rounded-full overflow-hidden" style={{ border: '2px solid var(--border-gold)' }}>
                <img
                  src={logo}
                  alt="Barangay Sto. Niño Logo"
                  className="w-full h-full object-cover"
                  style={{ mixBlendMode: 'screen' }}
                />
              </div>
            </div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-white)' }}>Barangay Sto. Niño</h1>
          </div>

          <div className="rounded-2xl p-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
            <div className="rounded-full h-1 mb-6" style={{ background: 'linear-gradient(90deg, var(--gold), var(--gold-light))' }} />

            {!sent ? (
              <>
                <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-white)' }}>Forgot Password</h2>
                <p className="text-sm mb-7" style={{ color: 'var(--text-muted)' }}>
                  Enter your username and registered email. We'll send you a reset link.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="label">Username</label>
                    <div className="relative">
                      <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                      <input type="text" className="input pl-9" placeholder="Enter your username"
                        value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} autoComplete="username" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Registered Email</label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                      <input type="email" className="input pl-9" placeholder="Enter your email address"
                        value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} autoComplete="email" />
                    </div>
                  </div>
                  <button type="submit" className="btn-primary w-full justify-center py-3 text-sm mt-2" disabled={loading}>
                    {loading ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Mail size={15} />}
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-4"
                  style={{ backgroundColor: 'rgba(196,156,64,0.15)', border: '1px solid rgba(196,156,64,0.3)' }}>
                  <CheckCircle size={32} style={{ color: 'var(--gold)' }} />
                </div>
                <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-white)' }}>Check Your Email</h2>
                <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>We've sent a password reset link to:</p>
                <p className="text-sm font-semibold mb-6" style={{ color: 'var(--gold)' }}>{form.email}</p>
                <div className="rounded-xl p-4 mb-6 text-left" style={{ background: 'rgba(196,156,64,0.08)', border: '1px solid rgba(196,156,64,0.2)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
                    ⏰ The link will expire in <strong style={{ color: 'var(--gold-light)' }}>30 minutes</strong>.<br />
                    📁 If you don't see it, check your <strong style={{ color: 'var(--text-primary)' }}>spam or junk folder</strong>.
                  </p>
                </div>
                <Link to="/login" className="btn-primary inline-flex justify-center px-6 py-2.5 text-sm" style={{ textDecoration: 'none' }}>
                  Back to Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}