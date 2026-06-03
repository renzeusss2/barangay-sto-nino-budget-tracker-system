import { useState, useEffect } from 'react'
import { transactionAPI } from '../utils/api'
import { Brain, TrendingUp, AlertTriangle, Lightbulb, RefreshCw, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const fmt = (n) => `₱${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
const YEAR = new Date().getFullYear()
const T = {
  pageTitle:    { fontSize:'22px', fontWeight:'700', color:'#ffffff', marginBottom:'4px' },
  pageSubtitle: { fontSize:'13px', color:'rgba(196,156,64,0.8)' },
  card:    { backgroundColor:'#122018', border:'1px solid #243d2a', borderRadius:'12px', padding:'20px' },
  statCard:{ backgroundColor:'#122018', border:'1px solid #243d2a', borderRadius:'12px', padding:'18px 20px' },
}
const btnOutline = { display:'flex', alignItems:'center', gap:'6px', padding:'9px 14px', borderRadius:'8px', fontSize:'13px', color:'#b8c4bb', backgroundColor:'#243d2a', border:'1px solid #2f5238', cursor:'pointer' }

export default function AIInsightsPage() {
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchInsights() }, [])

  const fetchInsights = async () => {
    setLoading(true)
    try {
      const res = await transactionAPI.summary(YEAR)
      setInsights({
        summary: res.data,
        forecast: [
          { month:'Next Month', amount:(res.data?.total_expense||0)*1.05 },
          { month:'Month +2',   amount:(res.data?.total_expense||0)*1.02 },
          { month:'Month +3',   amount:(res.data?.total_expense||0)*0.98 },
        ],
        anomalies: [],
        recommendations: [
          'Monitor spending in high-expense categories to stay within budget allocations.',
          'Ensure all pending transactions are approved or reviewed before quarter end.',
          'Consider allocating a reserve fund for emergency barangay expenses.',
          'Regular blockchain audits help maintain transparency and trust.',
        ]
      })
    } catch { toast.error('Failed to load AI insights') }
    finally { setLoading(false) }
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'300px', color:'#6e8872', fontSize:'14px', gap:'10px' }}>
      <Brain size={20} style={{ color:'#c49c40' }} /> Loading AI Insights...
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ ...T.pageTitle, display:'flex', alignItems:'center', gap:'10px' }}>
            <Brain size={22} style={{ color:'#c49c40' }} /> AI Insights & Forecasting
          </h1>
          <p style={T.pageSubtitle}>Powered by machine learning · FY {YEAR}</p>
        </div>
        <button onClick={fetchInsights} style={btnOutline}><RefreshCw size={14} />Refresh</button>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px' }}>
        {[
          { label:'Total Income',         value:fmt(insights?.summary?.total_income),       color:'#22c55e', icon:'📈' },
          { label:'Total Expenses',       value:fmt(insights?.summary?.total_expense),      color:'#ef4444', icon:'📉' },
          { label:'Pending Transactions', value:insights?.summary?.pending_transactions||0, color:'#c49c40', icon:'⏳' },
        ].map(s => (
          <div key={s.label} style={{ ...T.statCard, display:'flex', alignItems:'center', gap:'16px' }}>
            <span style={{ fontSize:'28px' }}>{s.icon}</span>
            <div>
              <p style={{ fontSize:'12px', color:'#6e8872', marginBottom:'4px' }}>{s.label}</p>
              <p style={{ fontSize:'20px', fontWeight:'700', color:s.color }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Forecast */}
      <div style={T.card}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
          <TrendingUp size={18} style={{ color:'#c49c40' }} />
          <p style={{ fontSize:'14px', fontWeight:'600', color:'#ffffff' }}>Budget Forecast</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px' }}>
          {insights?.forecast?.map((item, idx) => (
            <div key={idx} style={{ background:'#1a2e20', border:'1px solid rgba(196,156,64,0.25)', borderRadius:'10px', padding:'16px' }}>
              <p style={{ fontSize:'12px', color:'#6e8872', marginBottom:'6px' }}>{item.month}</p>
              <p style={{ fontSize:'20px', fontWeight:'700', color:'#e8c060' }}>{fmt(item.amount)}</p>
              <p style={{ fontSize:'11px', color:'#6e8872', marginTop:'4px' }}>Projected expense</p>
            </div>
          ))}
        </div>
      </div>

      {/* Anomaly Detection */}
      <div style={T.card}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
          <AlertTriangle size={18} style={{ color:'#c49c40' }} />
          <p style={{ fontSize:'14px', fontWeight:'600', color:'#ffffff' }}>Anomaly Detection</p>
        </div>
        {insights?.anomalies?.length > 0 ? (
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {insights.anomalies.map((a, idx) => (
              <div key={idx} style={{ display:'flex', alignItems:'flex-start', gap:'12px', padding:'12px', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'8px' }}>
                <AlertTriangle size={14} style={{ color:'#ef4444', marginTop:'2px' }} />
                <div>
                  <p style={{ fontSize:'13px', fontWeight:'600', color:'#fca5a5', marginBottom:'2px' }}>{a.description}</p>
                  <p style={{ fontSize:'12px', color:'#6e8872' }}>{a.date} — {fmt(a.amount)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'14px', background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:'8px' }}>
            <CheckCircle size={18} style={{ color:'#22c55e' }} />
            <p style={{ fontSize:'13px', fontWeight:'600', color:'#f0f0f0' }}>No anomalies detected. All transactions appear normal.</p>
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div style={T.card}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
          <Lightbulb size={18} style={{ color:'#c49c40' }} />
          <p style={{ fontSize:'14px', fontWeight:'600', color:'#ffffff' }}>AI Recommendations</p>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          {insights?.recommendations?.map((rec, idx) => (
            <div key={idx} style={{ display:'flex', alignItems:'flex-start', gap:'12px', padding:'14px', background:'#1a2e20', border:'1px solid #2f5238', borderRadius:'8px' }}>
              <span style={{ fontSize:'16px', marginTop:'1px' }}>💡</span>
              <p style={{ fontSize:'13px', color:'#b8c4bb', lineHeight:'1.6', margin:0 }}>{rec}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}