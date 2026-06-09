// ─── AuthLeftPanel.jsx ────────────────────────────────────────────────────────
// import logo from '../assets/logo.png'  ← uncomment when ready

import photo1 from '../assets/Photo_1.jpg'
import photo2 from '../assets/Photo_2.jpg'
import photo3 from '../assets/Photo_3.jpg'
import photo4 from '../assets/Photo_4.jpg'

import { useEffect, useState } from 'react'
import { Shield } from 'lucide-react'

const PHOTOS = [photo1, photo2, photo3, photo4]

export function AuthLeftPanel({ variant = 'login' }) {
  const [photoIdx, setPhotoIdx] = useState(0)
  const [fade, setFade] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setPhotoIdx(i => (i + 1) % PHOTOS.length)
        setFade(true)
      }, 400)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const content = {
    login: {
      title: 'System Capabilities',
      icon: Shield,
      items: [
        ['🔗', 'Blockchain-secured audit trail'],
        ['🤖', 'AI-powered budget forecasting'],
        ['📊', 'Real-time financial dashboards'],
        ['👥', 'Multi-role access control'],
        ['🔍', 'Anomaly detection & alerts'],
      ]
    },
    register: {
      title: 'Account Roles',
      icon: Shield,
      items: [
        ['🏛️', 'Barangay Official — View dashboards & reports'],
        ['🔍', 'Auditor — Requires admin code'],
        ['💰', 'Treasurer — Requires admin code'],
        ['⚙️', 'Administrator — Requires admin code'],
      ]
    },
    forgot: {
      title: 'Password Reset',
      icon: Shield,
      items: [
        ['📧', 'Enter your username and registered email'],
        ['🔗', "We'll send a secure reset link"],
        ['⏰', 'Link expires in 30 minutes'],
        ['🔒', 'Your account stays secure'],
      ]
    },
    reset: {
      title: 'Security Tips',
      icon: Shield,
      items: [
        ['🔒', 'Use at least 8 characters'],
        ['🔢', 'Include numbers and symbols'],
        ['🚫', "Don't reuse old passwords"],
        ['🤫', 'Keep your password private'],
      ]
    },
  }

  const { title, icon: Icon, items } = content[variant] || content.login

  return (
    <div
      className="hidden lg:flex w-1/2 flex-col items-center justify-center relative overflow-hidden"
      style={{ borderRight: '1px solid var(--border-subtle)', minHeight: '100vh' }}
    >
      {/* ── Background Photo ── */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${PHOTOS[photoIdx]})`,
          opacity: fade ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}
      />

      {/* ── Green overlay ── */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(160deg, rgba(10,26,12,0.88) 0%, rgba(15,36,20,0.82) 50%, rgba(10,26,12,0.90) 100%)',
        }}
      />

      {/* ── Gold top line ── */}
      <div
        className="absolute top-0 left-0 right-0"
        style={{ height: '3px', background: 'linear-gradient(90deg, transparent, var(--gold), var(--gold-light), transparent)', zIndex: 2 }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 text-center max-w-md px-12 w-full">

        {/* Logo circle */}
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{
            background: 'rgba(26,46,32,0.8)',
            border: '2px solid var(--gold)',
            boxShadow: '0 0 24px rgba(196,156,64,0.3)',
            backdropFilter: 'blur(8px)',
            fontSize: '48px',
          }}
        >
          {/* Replace with: <img src={logo} alt="Logo" className="w-16 h-16 object-contain rounded-full" /> */}
          🏛️
        </div>

        <h1
          className="text-5xl font-bold mb-2"
          style={{ color: 'var(--text-white)', letterSpacing: '-0.03em', textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}
        >
          Barangay<br />Sto. Niño
        </h1>
        <p className="text-lg mb-1" style={{ color: 'var(--gold-light)' }}>Parañaque City, Metro Manila</p>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Republic of the Philippines</p>

        {/* Feature/Info box */}
        <div
          className="rounded-xl p-5 text-left mb-6"
          style={{
            background: 'rgba(26,46,32,0.75)',
            border: '1px solid var(--border-gold)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Icon size={14} style={{ color: 'var(--gold)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--gold-light)' }}>{title}</span>
          </div>
          {items.map(([icon, text]) => (
            <div key={text} className="flex items-start gap-3 py-1.5">
              <span className="text-sm flex-shrink-0">{icon}</span>
              <span className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>{text}</span>
            </div>
          ))}
        </div>

        {/* ── Photo dots — inside content, always visible ── */}
        <div className="flex justify-center gap-2">
          {PHOTOS.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setFade(false)
                setTimeout(() => { setPhotoIdx(i); setFade(true) }, 400)
              }}
              style={{
                width: i === photoIdx ? '20px' : '6px',
                height: '6px',
                borderRadius: '3px',
                backgroundColor: i === photoIdx ? 'var(--gold)' : 'rgba(196,156,64,0.3)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s',
                padding: 0,
              }}
            />
          ))}
        </div>

      </div>
    </div>
  )
}