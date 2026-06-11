import logo from '../assets/logo.png'
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Lock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { AuthLeftPanel } from '../components/AuthLeftPanel'

export default function ResetPasswordPage() {
  const [searchParams]        = useSearchParams()
  const navigate              = useNavigate()
  const token                 = searchParams.get('token') || ''
  const [form, setForm]       = useState({ new_password: '', confirm_password: '' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)
  const [invalid, setInvalid] = useState(!token)

  useEffect(() => { if (!token) setInvalid(true) }, [token])

  const rules = [
    { label: 'At least 8 characters', pass: form.new_password.length >= 8 },
    { label: 'Contains a number',     pass: /\d/.test(form.new_password) },
    { label: 'Passwords match',       pass: form.new_password === form.confirm_password && form.confirm_password !== '' },
  ]
  const allPass = rules.every(r => r.pass)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!allPass) return toast.error('Please meet all password requirements.')
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, new_password: form.new_password })
      setDone(true)
      toast.success('Password reset successfully!')
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Reset failed. The link may have expired.')
      if (err.response?.status === 400) setInvalid(true)
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>
      <AuthLeftPanel variant="reset" />
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">

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

            {/* Logo header */}
            <div className="text-center mb-6">
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
              <h1 className="text-lg font-bold" style={{ color: 'var(--text-white)' }}>Barangay Sto. Niño</h1>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Budget Tracking System</p>
            </div>

            {invalid && !done && (
              <div className="text-center py-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-4"
                  style={{ backgroundColor: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)' }}>
                  <XCircle size={32} style={{ color: 'var(--danger)' }} />
                </div>
                <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-white)' }}>Invalid or Expired Link</h2>
                <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                  This password reset link is invalid or has already expired.
                </p>
                <Link to="/forgot-password" className="btn-primary inline-flex justify-center px-6 py-2.5 text-sm" style={{ textDecoration: 'none' }}>
                  Request New Link
                </Link>
              </div>
            )}

            {done && (
              <div className="text-center py-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full mx-auto mb-4"
                  style={{ backgroundColor: 'rgba(196,156,64,0.15)', border: '1px solid rgba(196,156,64,0.3)' }}>
                  <CheckCircle size={32} style={{ color: 'var(--gold)' }} />
                </div>
                <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-white)' }}>Password Reset!</h2>
                <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                  Your password has been updated. Redirecting to login...
                </p>
                <Link to="/login" className="btn-primary inline-flex justify-center px-6 py-2.5 text-sm" style={{ textDecoration: 'none' }}>
                  Sign In Now
                </Link>
              </div>
            )}

            {!invalid && !done && (
              <>
                <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-white)' }}>Set New Password</h2>
                <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Create a strong password for your account.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="label">New Password</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                      <input type={showPw ? 'text' : 'password'} className="input pl-9 pr-10" placeholder="Enter new password"
                        value={form.new_password} onChange={e => setForm(p => ({ ...p, new_password: e.target.value }))} />
                      <button type="button" onClick={() => setShowPw(!showPw)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="label">Confirm Password</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                      <input type={showPw ? 'text' : 'password'} className="input pl-9" placeholder="Repeat new password"
                        value={form.confirm_password} onChange={e => setForm(p => ({ ...p, confirm_password: e.target.value }))} />
                    </div>
                  </div>
                  {form.new_password && (
                    <div className="rounded-xl p-4" style={{ background: 'rgba(196,156,64,0.06)', border: '1px solid rgba(196,156,64,0.15)' }}>
                      {rules.map(r => (
                        <div key={r.label} className="flex items-center gap-2 mb-1 last:mb-0">
                          <span style={{ color: r.pass ? '#4ade80' : 'var(--text-muted)', fontSize: '13px' }}>{r.pass ? '✓' : '○'}</span>
                          <span style={{ fontSize: '12px', color: r.pass ? '#4ade80' : 'var(--text-muted)' }}>{r.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <button type="submit" className="btn-primary w-full justify-center py-3 text-sm"
                    disabled={loading || !allPass} style={{ opacity: allPass ? 1 : 0.5 }}>
                    {loading ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Lock size={15} />}
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}