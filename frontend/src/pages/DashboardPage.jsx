import { useEffect, useState } from 'react' 
import { transactionAPI, reportsAPI } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import { TrendingUp, TrendingDown, Wallet, Clock, RefreshCw } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import toast from 'react-hot-toast'

const YEAR = new Date().getFullYear()
const fmt  = (n) => `₱${Number(n||0).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2})}`

/* ─── Style tokens ─────────────────────────────────────── */
const T = {
  pageTitle:    { fontSize:'22px', fontWeight:'700', color:'#ffffff', marginBottom:'4px' },
  pageSubtitle: { fontSize:'13px', color:'rgba(196,156,64,0.8)' },
  card:         { backgroundColor:'#122018', border:'1px solid #243d2a', borderRadius:'12px', padding:'20px' },
  statCard:     { backgroundColor:'#122018', border:'1px solid #243d2a', borderRadius:'12px', padding:'18px 20px', position:'relative', overflow:'hidden', transition:'all 0.2s', cursor:'default' },
  tableWrapper: { backgroundColor:'#ffffff', border:'1px solid #e8e4d8', borderRadius:'12px', overflow:'hidden', boxShadow:'0 4px 24px rgba(0,0,0,0.25)' },
  th:    { padding:'12px 16px', fontSize:'11px', fontWeight:'700', color:'#c49c40', textTransform:'uppercase', letterSpacing:'0.08em', textAlign:'left', backgroundColor:'#162019', borderBottom:'1px solid #243d2a', whiteSpace:'nowrap' },
  td:    { padding:'11px 16px', fontSize:'13px', color:'#1a2e20', borderBottom:'1px solid #e8e4d8', backgroundColor:'#f9f7f2', verticalAlign:'middle' },
  tdAlt: { padding:'11px 16px', fontSize:'13px', color:'#1a2e20', borderBottom:'1px solid #e8e4d8', backgroundColor:'#f3f0e8', verticalAlign:'middle' },
}

/* ─── Tooltip styles — explicit, no inheritance ─────── */
const TT_CONTENT = {
  background:   '#0d1f10',
  border:       '1px solid rgba(196,156,64,0.35)',
  borderRadius: '8px',
  color:        '#f0f0f0',
  fontSize:     '13px',
  boxShadow:    '0 8px 24px rgba(0,0,0,0.5)',
}
const TT_ITEM  = { color: '#e8c060', fontWeight: '600' }
const TT_LABEL = { color: '#b8c4bb', fontWeight: '500', marginBottom: '4px' }

/* ─── Axis tick style ───────────────────────────────── */
const AX = { fontSize: 11, fill: '#6e8872' }

/* ─── Status / type badge maps ──────────────────────── */
const STATUS = {
  approved: { bg:'#dcfce7', color:'#166534', border:'#86efac' },
  pending:  { bg:'#fef9c3', color:'#854d0e', border:'#fde047' },
  rejected: { bg:'#fee2e2', color:'#991b1b', border:'#fca5a5' },
}
const TYPE_BADGE = {
  income:  { bg:'#dcfce7', color:'#166534', border:'#86efac' },
  expense: { bg:'#fee2e2', color:'#991b1b', border:'#fca5a5' },
}

function Badge({ label, style }) {
  return (
    <span style={{ display:'inline-block', fontSize:'11px', fontWeight:'600', padding:'2px 10px', borderRadius:'20px', backgroundColor:style.bg, color:style.color, border:`1px solid ${style.border}` }}>
      {label}
    </span>
  )
}

/* ─── Custom Tooltip Components ─────────────────────── */
function AreaTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={TT_CONTENT}>
      <p style={{ ...TT_LABEL, padding:'8px 12px 4px', margin:0 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ ...TT_ITEM, padding:'2px 12px', margin:0, color: p.dataKey==='income' ? '#4ade80' : '#f87171' }}>
          {p.dataKey === 'income' ? 'Income' : 'Expenses'}: {fmt(p.value)}
        </p>
      ))}
      <div style={{ height:'8px' }} />
    </div>
  )
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div style={{ ...TT_CONTENT, padding:'10px 14px' }}>
      <p style={{ color:'#b8c4bb', fontSize:'12px', margin:'0 0 4px' }}>{p.name}</p>
      <p style={{ color:'#e8c060', fontWeight:'700', fontSize:'14px', margin:0 }}>
        {fmt(p.value)}
      </p>
    </div>
  )
}

/* ─── Main Component ────────────────────────────────── */
export default function DashboardPage() {
  const { user } = useAuth()
  const [summary,      setSummary]      = useState(null)
  const [monthlyData,  setMonthlyData]  = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [recentTx,     setRecentTx]     = useState([])
  const [loading,      setLoading]      = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const [sumRes, reportRes, catRes, txRes] = await Promise.all([
        transactionAPI.summary(YEAR),
        reportsAPI.incomeExpense(YEAR),
        reportsAPI.categoryBreakdown(YEAR),
        transactionAPI.list({ fiscal_year: YEAR, limit: 8 }),
      ])
      setSummary(sumRes.data)
      setMonthlyData(reportRes.data.monthly)
      setCategoryData(catRes.data.categories.slice(0, 6))
      setRecentTx(txRes.data.transactions)
    } catch { toast.error('Failed to load dashboard data') }
    finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  const stats = [
    { title:'Total Income',      value:fmt(summary?.total_income),         subtitle:`FY ${YEAR} approved`, icon:TrendingUp,   color:'#22c55e' },
    { title:'Total Expenses',    value:fmt(summary?.total_expense),        subtitle:`FY ${YEAR} approved`, icon:TrendingDown,  color:'#ef4444' },
    { title:'Net Balance',       value:fmt(summary?.net_balance),          subtitle:'Income minus expenses',icon:Wallet,       color:'#3b82f6' },
    { title:'Pending Approvals', value:summary?.pending_transactions || 0, subtitle:'Awaiting review',     icon:Clock,        color:'#c49c40' },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={T.pageTitle}>Dashboard</h1>
          <p style={T.pageSubtitle}>Fiscal Year {YEAR} · Barangay Sto. Niño, Parañaque City</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <button
            onClick={loadData}
            style={{ display:'flex', alignItems:'center', gap:'6px', padding:'9px 14px', borderRadius:'8px', fontSize:'13px', fontWeight:'500', color:'#b8c4bb', backgroundColor:'#243d2a', border:'1px solid #2f5238', cursor:'pointer', transition:'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(196,156,64,0.4)'; e.currentTarget.style.color='#c49c40' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='#2f5238'; e.currentTarget.style.color='#b8c4bb' }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <div style={{ textAlign:'right' }}>
            <p style={{ fontSize:'11px', color:'#6e8872', margin:0 }}>Logged in as</p>
            <p style={{ fontSize:'13px', fontWeight:'600', color:'#ffffff', margin:0 }}>{user?.full_name}</p>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'16px' }}>
        {stats.map(s => (
          <div
            key={s.title}
            style={T.statCard}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(196,156,64,0.35)'
              e.currentTarget.style.boxShadow   = '0 8px 32px rgba(0,0,0,0.4)'
              e.currentTarget.style.transform   = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#243d2a'
              e.currentTarget.style.boxShadow   = 'none'
              e.currentTarget.style.transform   = 'none'
            }}
          >
            {/* Gold top line on hover — via pseudo would need CSS, skip inline */}
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'12px' }}>
              <p style={{ fontSize:'12px', color:'#6e8872', fontWeight:'500', margin:0 }}>{s.title}</p>
              <div style={{ padding:'8px', borderRadius:'8px', backgroundColor:s.color+'18' }}>
                <s.icon size={15} style={{ color:s.color }} />
              </div>
            </div>
            <p style={{ fontSize:'22px', fontWeight:'700', color:'#ffffff', marginBottom:'4px', margin:'0 0 4px' }}>{s.value}</p>
            <p style={{ fontSize:'11px', color:'#6e8872', margin:0 }}>{s.subtitle}</p>
          </div>
        ))}
      </div>

      {/* ── Charts ── */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'16px' }}>

        {/* Area Chart */}
        <div style={T.card}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px' }}>
            <p style={{ fontSize:'14px', fontWeight:'600', color:'#ffffff', margin:0 }}>Monthly Income vs Expenses</p>
            <span style={{ fontSize:'11px', padding:'3px 10px', borderRadius:'20px', backgroundColor:'rgba(196,156,64,0.12)', color:'#e8c060', border:'1px solid rgba(196,156,64,0.3)' }}>
              FY {YEAR}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="incG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="expG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(196,156,64,0.08)" />
              <XAxis dataKey="month_name" stroke="#2f5238" tick={AX} />
              <YAxis stroke="#2f5238" tick={AX} tickFormatter={v => `₱${(v/1000).toFixed(0)}k`} />
              {/* ✅ Custom tooltip — no color inheritance issues */}
              <Tooltip content={<AreaTooltip />} />
              <Area type="monotone" dataKey="income"  stroke="#22c55e" strokeWidth={2} fill="url(#incG)" />
              <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} fill="url(#expG)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div style={T.card}>
          <p style={{ fontSize:'14px', fontWeight:'600', color:'#ffffff', marginBottom:'16px', margin:'0 0 16px' }}>Expense by Category</p>
          {categoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={categoryData} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40}>
                    {categoryData.map((e,i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  {/* ✅ Custom tooltip — fully controlled colors */}
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display:'flex', flexDirection:'column', gap:'5px', marginTop:'8px' }}>
                {categoryData.map(c => (
                  <div key={c.name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:'11px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                      <div style={{ width:'8px', height:'8px', borderRadius:'50%', backgroundColor:c.color }} />
                      <span style={{ color:'#6e8872' }}>{c.code}</span>
                    </div>
                    <span style={{ color:'#b8c4bb', fontWeight:'600' }}>{c.percentage}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ height:'200px', display:'flex', alignItems:'center', justifyContent:'center', color:'#6e8872', fontSize:'13px' }}>
              No expense data yet
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Transactions ── */}
      <div style={T.tableWrapper}>
        <div style={{ padding:'16px 20px', backgroundColor:'#162019', borderBottom:'1px solid #243d2a', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <p style={{ fontSize:'14px', fontWeight:'600', color:'#ffffff', margin:0 }}>Recent Transactions</p>
          <a href="/transactions" style={{ fontSize:'12px', color:'#c49c40', textDecoration:'none', fontWeight:'600' }}>View all →</a>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['Reference','Description','Category','Amount','Type','Status'].map(h => (
                  <th key={h} style={T.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentTx.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ ...T.td, textAlign:'center', padding:'32px', color:'#6e8872', backgroundColor:'#f9f7f2' }}>
                    No transactions yet
                  </td>
                </tr>
              ) : recentTx.map((tx, i) => {
                const td = i % 2 === 0 ? T.td : T.tdAlt
                const ss = STATUS[tx.status]               || { bg:'#f1f5f9', color:'#475569', border:'#cbd5e1' }
                const ts = TYPE_BADGE[tx.transaction_type] || ss
                return (
                  <tr
                    key={tx.id}
                    onMouseEnter={e => Array.from(e.currentTarget.cells).forEach(c => c.style.backgroundColor='#ede8d8')}
                    onMouseLeave={e => Array.from(e.currentTarget.cells).forEach(c => c.style.backgroundColor = i%2===0 ? '#f9f7f2' : '#f3f0e8')}
                  >
                    <td style={td}>
                      <span style={{ fontFamily:'monospace', fontSize:'11px', color:'#1a4a2a', fontWeight:'600' }}>
                        {tx.reference_number}
                      </span>
                    </td>
                    <td style={{ ...td, maxWidth:'200px' }}>
                      <p style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', margin:0, fontWeight:'500', color:'#1a2e20', fontSize:'13px' }}>
                        {tx.description}
                      </p>
                      <p style={{ fontSize:'11px', color:'#5a7060', margin:0 }}>
                        {tx.payee_payer}
                      </p>
                    </td>
                    <td style={td}>
                      <span style={{ fontSize:'11px', fontWeight:'700', padding:'2px 8px', borderRadius:'20px', backgroundColor:(tx.category_color||'#22c55e')+'22', color:tx.category_color||'#166534', border:`1px solid ${(tx.category_color||'#22c55e')}55` }}>
                        {tx.category_code}
                      </span>
                    </td>
                    <td style={{ ...td, fontWeight:'700', color: tx.transaction_type==='income' ? '#166534' : '#991b1b' }}>
                      {tx.transaction_type==='income' ? '+' : '-'}{fmt(tx.amount)}
                    </td>
                    <td style={td}><Badge label={tx.transaction_type} style={ts} /></td>
                    <td style={td}><Badge label={tx.status} style={ss} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}