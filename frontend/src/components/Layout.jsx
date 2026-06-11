import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LayoutDashboard, Receipt, PiggyBank, BarChart3, Brain, Link, LogOut, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import logo from '../assets/logo.png'

const NAV_ITEMS = [
  { to: '/',             label: 'Dashboard',        icon: LayoutDashboard, exact: true },
  { to: '/transactions', label: 'Transactions',     icon: Receipt },
  { to: '/budget',       label: 'Budget Management',icon: PiggyBank },
  { to: '/reports',      label: 'Reports',          icon: BarChart3 },
  { to: '/ai-insights',  label: 'AI Insights',      icon: Brain },
  { to: '/blockchain',   label: 'Blockchain Audit', icon: Link },
]

const ROLE_BADGE = {
  admin:     'bg-purple-900/40 text-purple-300 border border-purple-700/40',
  treasurer: 'bg-blue-900/40   text-blue-300   border border-blue-700/40',
  auditor:   'bg-amber-900/40  text-amber-300  border border-amber-700/40',
  official:  'bg-emerald-900/40 text-emerald-300 border border-emerald-700/40',
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <aside className="w-64 flex flex-col flex-shrink-0" style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border-subtle)' }}>
        <div style={{ height: '2px', background: 'linear-gradient(90deg, var(--gold), var(--gold-light), transparent)' }} />
        <div className="p-5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden" style={{ border: '1px solid var(--border-gold)' }}>
              <img
                src={logo}
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <p className="text-xs leading-none" style={{ color: 'var(--text-muted)' }}>Barangay Sto. Niño</p>
              <p className="text-sm font-bold leading-tight" style={{ color: 'var(--text-white)' }}>Budget System</p>
            </div>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Parañaque City · Metro Manila</p>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <p className="text-xs font-bold uppercase tracking-widest px-3 mb-3 mt-2" style={{ color: 'var(--gold)', opacity: 0.7 }}>Main Menu</p>
          {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => (
            <NavLink key={to} to={to} end={exact} className={({ isActive }) => isActive ? 'nav-item-active' : 'nav-item'}>
              <Icon size={15} /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="mx-4" style={{ height: '1px', background: 'linear-gradient(90deg, transparent, var(--gold), transparent)', opacity: 0.2 }} />
        <div className="p-3">
          <div className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:bg-[var(--bg-elevated)]" onClick={() => setUserMenuOpen(!userMenuOpen)}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg, var(--gold), #a8832e)', color: '#0e1a12' }}>
              {user?.full_name?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{user?.full_name}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${ROLE_BADGE[user?.role] || ''}`}>{user?.role}</span>
            </div>
            <ChevronDown size={13} style={{ color: 'var(--text-muted)' }} className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
          </div>
          {userMenuOpen && (
            <div className="mt-1 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-mid)', background: 'var(--bg-elevated)' }}>
              <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-red-900/20 transition-colors" style={{ color: 'var(--danger)' }}>
                <LogOut size={14} />Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="px-6 py-3 flex items-center justify-between" style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            <img
              src={logo}
              alt="Logo"
              className="w-4 h-4 object-contain"
            />
            <span>Barangay Sto. Niño</span><span>·</span><span>Budget Tracking System</span>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />System Operational
          </div>
        </div>
        <div className="p-6 animate-fade-in"><Outlet /></div>
      </main>
    </div>
  )
}