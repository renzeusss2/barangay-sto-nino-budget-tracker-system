import { useState, useEffect } from 'react'
import { aiAPI, transactionAPI } from '../utils/api'
import { Brain, TrendingUp, AlertTriangle, Lightbulb, RefreshCw, CheckCircle, BarChart2 } from 'lucide-react'
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

const PRIORITY_STYLE = {
  high:   { bg:'rgba(239,68,68,0.1)',   color:'#fca5a5', border:'rgba(239,68,68,0.3)',   label:'HIGH' },
  medium: { bg:'rgba(251,191,36,0.1)',  color:'#fcd34d', border:'rgba(251,191,36,0.3)',  label:'MEDIUM' },
  low:    { bg:'rgba(34,197,94,0.1)',   color:'#86efac', border:'rgba(34,197,94,0.3)',   label:'LOW' },
}

export default function AIInsightsPage() {
  const [dashboard, setDashboard] = useState(null)
  const [summary, setSummary]     = useState(null)
  const [loading, setLoading]     = useState(true)

  useEffect(() => { fetchInsights() }, [])

  const fetchInsights = async () => {
    setLoading(true)
    try {
      const [dashRes, sumRes] = await Promise.all([
        aiAPI.dashboard(YEAR),
        transactionAPI.summary(YEAR),
      ])
      setDashboard(dashRes.data)
      setSummary(sumRes.data)
    } catch (err) {
      toast.error('Failed to load AI insights')
      console.error(err)
    } finally { setLoading(false) }
  }

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'300px', color:'#6e8872', fontSize:'14px', gap:'10px' }}>
      <Brain size={20} style={{ color:'#c49c40', animation:'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      Loading AI Insights...
    </div>
  )

  const forecast        = dashboard?.forecast?.forecast || []
  const forecastMeta    = dashboard?.forecast
  const anomalies       = dashboard?.anomalies?.anomalies || []
  const anomalyCount    = dashboard?.anomalies?.anomaly_count || 0
  const analyzed        = dashboard?.anomalies?.analyzed || 0
  const recommendations = dashboard?.recommendations || []
  const utilization     = dashboard?.utilization?.summary || {}
  const alerts          = dashboard?.utilization?.alerts || []

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ ...T.pageTitle, display:'flex', alignItems:'center', gap:'10px' }}>
            <Brain size={22} style={{ color:'#c49c40' }} /> AI Insights & Forecasting
          </h1>
          <p style={T.pageSubtitle}>Powered by statistical analysis · FY {YEAR}</p>
        </div>
        <button onClick={fetchInsights} style={btnOutline}><RefreshCw size={14} />Refresh</button>
      </div>

      {/* ── Stats ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px' }}>
        {[
          { label:'Total Income',         value:fmt(summary?.total_income),          color:'#22c55e', icon:'📈' },
          { label:'Total Expenses',       value:fmt(summary?.total_expense),         color:'#ef4444', icon:'📉' },
          { label:'Pending Transactions', value:summary?.pending_transactions || 0,  color:'#c49c40', icon:'⏳' },
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

      {/* ── Budget Utilization Summary ── */}
      {utilization.total_allocated > 0 && (
        <div style={T.card}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
            <BarChart2 size={18} style={{ color:'#c49c40' }} />
            <p style={{ fontSize:'14px', fontWeight:'600', color:'#ffffff' }}>Budget Utilization</p>
            <span style={{ marginLeft:'auto', fontSize:'12px', color:'#6e8872' }}>
              Overall: <span style={{ color:'#c49c40', fontWeight:'700' }}>{utilization.overall_utilization}%</span>
            </span>
          </div>
          {/* Progress bar */}
          <div style={{ height:'8px', backgroundColor:'#243d2a', borderRadius:'4px', overflow:'hidden', marginBottom:'16px' }}>
            <div style={{
              height:'100%', borderRadius:'4px',
              width:`${Math.min(utilization.overall_utilization, 100)}%`,
              background: utilization.overall_utilization >= 95 ? '#ef4444' : utilization.overall_utilization >= 80 ? '#f59e0b' : '#22c55e',
              transition:'width 0.5s'
            }} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px' }}>
            {[
              { label:'On Track',    value:utilization.categories_on_track,  color:'#22c55e' },
              { label:'Warning',     value:utilization.categories_warning,   color:'#f59e0b' },
              { label:'Critical',    value:utilization.categories_critical,  color:'#ef4444' },
            ].map(s => (
              <div key={s.label} style={{ textAlign:'center', padding:'12px', background:'#1a2e20', borderRadius:'8px', border:'1px solid #2f5238' }}>
                <p style={{ fontSize:'22px', fontWeight:'700', color:s.color }}>{s.value}</p>
                <p style={{ fontSize:'11px', color:'#6e8872' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Budget alerts */}
          {alerts.length > 0 && (
            <div style={{ marginTop:'16px', display:'flex', flexDirection:'column', gap:'8px' }}>
              {alerts.map((alert, i) => (
                <div key={i} style={{
                  display:'flex', alignItems:'center', gap:'10px', padding:'10px 14px',
                  borderRadius:'8px',
                  background: alert.severity==='high' ? 'rgba(239,68,68,0.08)' : alert.severity==='medium' ? 'rgba(251,191,36,0.08)' : 'rgba(34,197,94,0.08)',
                  border: `1px solid ${alert.severity==='high' ? 'rgba(239,68,68,0.3)' : alert.severity==='medium' ? 'rgba(251,191,36,0.3)' : 'rgba(34,197,94,0.3)'}`,
                }}>
                  <AlertTriangle size={14} style={{ color: alert.severity==='high' ? '#ef4444' : alert.severity==='medium' ? '#f59e0b' : '#22c55e', flexShrink:0 }} />
                  <p style={{ fontSize:'12px', color:'#b8c4bb', margin:0 }}>{alert.message}</p>
                  <span style={{ marginLeft:'auto', fontSize:'10px', fontWeight:'700', padding:'2px 8px', borderRadius:'20px',
                    backgroundColor: alert.severity==='high' ? 'rgba(239,68,68,0.15)' : 'rgba(251,191,36,0.15)',
                    color: alert.severity==='high' ? '#fca5a5' : '#fcd34d'
                  }}>{alert.severity?.toUpperCase()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Forecast ── */}
      <div style={T.card}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
          <TrendingUp size={18} style={{ color:'#c49c40' }} />
          <p style={{ fontSize:'14px', fontWeight:'600', color:'#ffffff' }}>Spending Forecast</p>
          {forecastMeta?.trend && (
            <span style={{ marginLeft:'auto', fontSize:'11px', padding:'2px 10px', borderRadius:'20px',
              backgroundColor: forecastMeta.trend==='increasing' ? 'rgba(239,68,68,0.15)' : forecastMeta.trend==='decreasing' ? 'rgba(34,197,94,0.15)' : 'rgba(196,156,64,0.15)',
              color: forecastMeta.trend==='increasing' ? '#fca5a5' : forecastMeta.trend==='decreasing' ? '#86efac' : '#c49c40',
            }}>
              Trend: {forecastMeta.trend?.toUpperCase()} · Confidence: {forecastMeta.confidence?.toUpperCase()}
            </span>
          )}
        </div>
        <p style={{ fontSize:'12px', color:'#6e8872', marginBottom:'16px' }}>
          {forecastMeta?.message || `Based on ${forecastMeta?.data_points || 0} data points · Avg monthly: ${fmt(forecastMeta?.average_monthly)}`}
        </p>

        {forecast.length === 0 ? (
          <div style={{ padding:'20px', textAlign:'center', color:'#6e8872', fontSize:'13px', background:'#1a2e20', borderRadius:'8px' }}>
            Not enough transaction data for forecasting. Add more approved transactions.
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:`repeat(${forecast.length},1fr)`, gap:'12px' }}>
            {forecast.map((item, idx) => (
              <div key={idx} style={{ background:'#1a2e20', border:'1px solid rgba(196,156,64,0.25)', borderRadius:'10px', padding:'16px' }}>
                <p style={{ fontSize:'12px', color:'#6e8872', marginBottom:'6px' }}>{item.month_name}</p>
                <p style={{ fontSize:'20px', fontWeight:'700', color:'#e8c060' }}>{fmt(item.predicted_amount)}</p>
                <p style={{ fontSize:'10px', color:'#6e8872', marginTop:'4px' }}>
                  {fmt(item.confidence_interval?.lower)} – {fmt(item.confidence_interval?.upper)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Anomaly Detection ── */}
      <div style={T.card}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
          <AlertTriangle size={18} style={{ color:'#c49c40' }} />
          <p style={{ fontSize:'14px', fontWeight:'600', color:'#ffffff' }}>Anomaly Detection</p>
          <span style={{ marginLeft:'auto', fontSize:'12px', color:'#6e8872' }}>
            {analyzed} transactions analyzed · <span style={{ color: anomalyCount > 0 ? '#ef4444' : '#22c55e', fontWeight:'600' }}>{anomalyCount} flagged</span>
          </span>
        </div>

        {anomalies.length === 0 ? (
          <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'14px', background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:'8px' }}>
            <CheckCircle size={18} style={{ color:'#22c55e' }} />
            <p style={{ fontSize:'13px', fontWeight:'600', color:'#f0f0f0', margin:0 }}>
              {analyzed === 0 ? 'No expense transactions found for this year.' : 'No anomalies detected. All transactions appear normal.'}
            </p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {anomalies.map((a, idx) => (
              <div key={idx} style={{ padding:'14px', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'8px' }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:'12px' }}>
                  <AlertTriangle size={14} style={{ color:'#ef4444', marginTop:'2px', flexShrink:0 }} />
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
                      <p style={{ fontSize:'13px', fontWeight:'600', color:'#fca5a5', margin:0 }}>{a.description}</p>
                      <span style={{ fontSize:'10px', padding:'1px 8px', borderRadius:'20px', backgroundColor:'rgba(239,68,68,0.2)', color:'#fca5a5', border:'1px solid rgba(239,68,68,0.4)' }}>
                        Z-score: {a.z_score} · {a.deviation}
                      </span>
                    </div>
                    <p style={{ fontSize:'12px', color:'#6e8872', margin:0 }}>
                      {new Date(a.transaction_date).toLocaleDateString('en-PH')} · {fmt(a.amount)} · Ref: {a.reference_number}
                    </p>
                    <p style={{ fontSize:'11px', color:'#6e8872', marginTop:'4px', fontStyle:'italic' }}>{a.recommendation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Recommendations ── */}
      <div style={T.card}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
          <Lightbulb size={18} style={{ color:'#c49c40' }} />
          <p style={{ fontSize:'14px', fontWeight:'600', color:'#ffffff' }}>AI Recommendations</p>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
          {recommendations.map((rec, idx) => {
            const recObj = typeof rec === 'string' ? { title: rec, description: '', priority: 'low' } : rec
            const ps = PRIORITY_STYLE[recObj.priority] || PRIORITY_STYLE.low
            return (
              <div key={idx} style={{ display:'flex', alignItems:'flex-start', gap:'12px', padding:'14px', background:'#1a2e20', border:'1px solid #2f5238', borderRadius:'8px' }}>
                <span style={{ fontSize:'16px', marginTop:'1px', flexShrink:0 }}>💡</span>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
                    <p style={{ fontSize:'13px', fontWeight:'600', color:'#ffffff', margin:0 }}>{recObj.title || recObj}</p>
                    {recObj.priority && (
                      <span style={{ fontSize:'10px', padding:'1px 8px', borderRadius:'20px', backgroundColor:ps.bg, color:ps.color, border:`1px solid ${ps.border}` }}>
                        {ps.label}
                      </span>
                    )}
                  </div>
                  {recObj.description && <p style={{ fontSize:'12px', color:'#6e8872', margin:0, lineHeight:'1.6' }}>{recObj.description}</p>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}