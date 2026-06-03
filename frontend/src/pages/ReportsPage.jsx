import { useEffect, useState } from 'react'
import { reportsAPI } from '../utils/api'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

const YEAR = new Date().getFullYear()
const fmt = (n) => `₱${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
const TT = { background:'#0a1f0d', border:'1px solid rgba(196,156,64,0.35)', borderRadius:'10px', color:'#f0f0f0', boxShadow:'0 8px 24px rgba(0,0,0,0.5)', padding:'10px 14px' }
const TL = { color:'#c49c40', fontWeight:'600', fontSize:'13px', marginBottom:'4px' }
const TI = { color:'#f0f0f0', fontSize:'13px' }
const AX = { fontSize:11, fill:'#6e8872' }
const T = {
  pageTitle:    { fontSize:'22px', fontWeight:'700', color:'#ffffff', marginBottom:'4px' },
  pageSubtitle: { fontSize:'13px', color:'rgba(196,156,64,0.8)' },
  card:    { backgroundColor:'#122018', border:'1px solid #243d2a', borderRadius:'12px', padding:'20px' },
  statCard:{ backgroundColor:'#122018', border:'1px solid #243d2a', borderRadius:'12px', padding:'18px 20px' },
  filterInput: { backgroundColor:'#1a2e20', border:'1px solid #2f5238', borderRadius:'8px', padding:'9px 12px', fontSize:'13px', color:'#f0f0f0', outline:'none', fontFamily:'inherit' },
}
const btnOutline = { display:'flex', alignItems:'center', gap:'6px', padding:'9px 14px', borderRadius:'8px', fontSize:'13px', color:'#b8c4bb', backgroundColor:'#243d2a', border:'1px solid #2f5238', cursor:'pointer' }

export default function ReportsPage() {
  const [year, setYear] = useState(YEAR)
  const [monthly, setMonthly] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [mRes, cRes] = await Promise.all([reportsAPI.incomeExpense(year), reportsAPI.categoryBreakdown(year)])
      setMonthly(mRes.data.monthly); setCategories(cRes.data.categories)
    } catch { toast.error('Failed to load reports') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [year])

  const totalIncome  = monthly.reduce((s,m) => s+(m.income||0), 0)
  const totalExpense = monthly.reduce((s,m) => s+(m.expense||0), 0)
  const totalCatExp  = categories.reduce((s,c) => s+c.total, 0)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={T.pageTitle}>Financial Reports</h1>
          <p style={T.pageSubtitle}>Fiscal Year {year} · Barangay Sto. Niño</p>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          <select style={{ ...T.filterInput, width:'120px' }} value={year} onChange={e => setYear(parseInt(e.target.value))}>
            {[YEAR, YEAR-1, YEAR-2].map(y => <option key={y} value={y}>FY {y}</option>)}
          </select>
          <button onClick={load} style={btnOutline}><RefreshCw size={14} /></button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px' }}>
        {[
          { label:'Total Income',        value:fmt(totalIncome),              color:'#22c55e' },
          { label:'Total Expenses',      value:fmt(totalExpense),             color:'#ef4444' },
          { label:'Net Surplus/Deficit', value:fmt(totalIncome-totalExpense), color:(totalIncome-totalExpense)>=0?'#22c55e':'#ef4444' },
        ].map(s => (
          <div key={s.label} style={T.statCard}>
            <p style={{ fontSize:'12px', color:'#6e8872', marginBottom:'8px' }}>{s.label}</p>
            <p style={{ fontSize:'24px', fontWeight:'700', color:s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={T.card}>
        <p style={{ fontSize:'14px', fontWeight:'600', color:'#ffffff', marginBottom:'16px' }}>Monthly Income vs Expenses</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(196,156,64,0.08)" />
            <XAxis dataKey="month_name" stroke="#2f5238" tick={AX} />
            <YAxis stroke="#2f5238" tick={AX} tickFormatter={v=>`₱${(v/1000).toFixed(0)}k`} />
            <Tooltip contentStyle={TT} labelStyle={TL} itemStyle={TI} formatter={(v,n)=>[fmt(v),n==='income'?'Income':'Expenses']} cursor={{ fill:'rgba(196,156,64,0.08)' }} />
            <Legend formatter={v=><span style={{ color:'#b8c4bb', fontSize:'12px' }}>{v==='income'?'Income':'Expenses'}</span>} />
            <Bar dataKey="income"  fill="#22c55e" radius={[4,4,0,0]} name="income" />
            <Bar dataKey="expense" fill="#ef4444" radius={[4,4,0,0]} name="expense" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={T.card}>
        <p style={{ fontSize:'14px', fontWeight:'600', color:'#ffffff', marginBottom:'16px' }}>Monthly Net Balance Trend</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={monthly.map(m=>({...m,net:(m.income||0)-(m.expense||0)}))}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(196,156,64,0.08)" />
            <XAxis dataKey="month_name" stroke="#2f5238" tick={AX} />
            <YAxis stroke="#2f5238" tick={AX} tickFormatter={v=>`₱${(v/1000).toFixed(0)}k`} />
            <Tooltip contentStyle={TT} labelStyle={TL} itemStyle={TI} formatter={(v)=>[fmt(v),'Net Balance']} cursor={{ stroke:'rgba(196,156,64,0.3)' }} />
            <Line type="monotone" dataKey="net" stroke="#c49c40" strokeWidth={2.5} dot={{ fill:'#c49c40', r:4 }} activeDot={{ r:6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
        <div style={T.card}>
          <p style={{ fontSize:'14px', fontWeight:'600', color:'#ffffff', marginBottom:'16px' }}>Expense Distribution</p>
          {categories.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={categories} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={2}>
                  {categories.map((c,i) => <Cell key={i} fill={c.color} />)}
                </Pie>
                <Tooltip contentStyle={TT} labelStyle={TL} itemStyle={TI} formatter={(v)=>[fmt(v),'Amount']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height:'240px', display:'flex', alignItems:'center', justifyContent:'center', color:'#6e8872', fontSize:'13px' }}>No expense data</div>
          )}
        </div>

        <div style={T.card}>
          <p style={{ fontSize:'14px', fontWeight:'600', color:'#ffffff', marginBottom:'16px' }}>Category Details</p>
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            {categories.length === 0 ? (
              <p style={{ textAlign:'center', color:'#6e8872', fontSize:'13px', padding:'32px' }}>No data available</p>
            ) : categories.map(c => (
              <div key={c.name}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'5px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <div style={{ width:'10px', height:'10px', borderRadius:'50%', backgroundColor:c.color }} />
                    <span style={{ fontSize:'13px', color:'#b8c4bb', fontWeight:'500' }}>{c.name}</span>
                  </div>
                  <div>
                    <span style={{ fontSize:'13px', fontWeight:'700', color:'#ffffff' }}>{fmt(c.total)}</span>
                    <span style={{ fontSize:'11px', color:'#6e8872', marginLeft:'6px' }}>{c.percentage}%</span>
                  </div>
                </div>
                <div style={{ height:'6px', backgroundColor:'#243d2a', borderRadius:'3px', overflow:'hidden' }}>
                  <div style={{ height:'100%', borderRadius:'3px', width:`${c.percentage}%`, backgroundColor:c.color, transition:'width 0.5s' }} />
                </div>
              </div>
            ))}
          </div>
          {categories.length > 0 && (
            <div style={{ marginTop:'16px', paddingTop:'16px', borderTop:'1px solid #243d2a', display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontSize:'13px', color:'#6e8872' }}>Total Expenses</span>
              <span style={{ fontSize:'13px', fontWeight:'700', color:'#ef4444' }}>{fmt(totalCatExp)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}