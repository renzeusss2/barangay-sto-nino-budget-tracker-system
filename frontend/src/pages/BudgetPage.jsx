import { useEffect, useState } from 'react'
import { budgetAPI, transactionAPI } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Edit, CheckCircle, RefreshCw } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import toast from 'react-hot-toast'

const YEAR = new Date().getFullYear()
const fmt = (n) => `₱${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`

const T = {
  pageTitle:    { fontSize:'22px', fontWeight:'700', color:'#ffffff', marginBottom:'4px' },
  pageSubtitle: { fontSize:'13px', color:'rgba(196,156,64,0.8)' },
  tableWrapper: { backgroundColor:'#ffffff', border:'1px solid #e8e4d8', borderRadius:'12px', overflow:'hidden', boxShadow:'0 4px 24px rgba(0,0,0,0.25)' },
  th:    { padding:'12px 16px', fontSize:'11px', fontWeight:'700', color:'#c49c40', textTransform:'uppercase', letterSpacing:'0.08em', textAlign:'left', backgroundColor:'#162019', borderBottom:'1px solid #243d2a', whiteSpace:'nowrap' },
  td:    { padding:'12px 16px', fontSize:'13px', color:'#1a2e20', borderBottom:'1px solid #e8e4d8', backgroundColor:'#f9f7f2', verticalAlign:'middle' },
  tdAlt: { padding:'12px 16px', fontSize:'13px', color:'#1a2e20', borderBottom:'1px solid #e8e4d8', backgroundColor:'#f3f0e8', verticalAlign:'middle' },
  statCard: { backgroundColor:'#122018', border:'1px solid #243d2a', borderRadius:'12px', padding:'18px 20px' },
  chartCard: { backgroundColor:'#122018', border:'1px solid #243d2a', borderRadius:'12px', padding:'20px' },
  modal: { backgroundColor:'#122018', border:'1px solid rgba(196,156,64,0.25)', borderRadius:'14px', width:'100%', maxWidth:'500px', maxHeight:'90vh', overflowY:'auto' },
  modalLabel: { display:'block', fontSize:'12px', fontWeight:'600', color:'#b8c4bb', marginBottom:'6px' },
  modalInput: { width:'100%', backgroundColor:'#1a2e20', border:'1px solid #2f5238', borderRadius:'8px', padding:'10px 12px', fontSize:'13px', color:'#f0f0f0', outline:'none', boxSizing:'border-box', fontFamily:'inherit' },
  errorInput: { width:'100%', backgroundColor:'#1a2e20', border:'1px solid #ef4444', borderRadius:'8px', padding:'10px 12px', fontSize:'13px', color:'#f0f0f0', outline:'none', boxSizing:'border-box', fontFamily:'inherit' },
}

const btnGold    = { display:'flex', alignItems:'center', gap:'6px', padding:'9px 18px', borderRadius:'8px', fontSize:'13px', fontWeight:'600', color:'#0e1a12', background:'linear-gradient(135deg,#c49c40 0%,#a8832e 100%)', border:'1px solid #e8c060', cursor:'pointer' }
const btnOutline = { display:'flex', alignItems:'center', gap:'6px', padding:'9px 14px', borderRadius:'8px', fontSize:'13px', fontWeight:'500', color:'#b8c4bb', backgroundColor:'#243d2a', border:'1px solid #2f5238', cursor:'pointer' }
const filterInput = { backgroundColor:'#1a2e20', border:'1px solid #2f5238', borderRadius:'8px', padding:'9px 12px', fontSize:'13px', color:'#f0f0f0', outline:'none', fontFamily:'inherit' }

const STATUS = {
  approved: { bg:'#dcfce7', color:'#166534', border:'#86efac' },
  draft:    { bg:'#fef9c3', color:'#854d0e', border:'#fde047' },
  active:   { bg:'#dbeafe', color:'#1e40af', border:'#93c5fd' },
}

function Badge({ label, style }) {
  return (
    <span style={{ display:'inline-block', fontSize:'11px', fontWeight:'600', padding:'2px 10px', borderRadius:'20px', backgroundColor:style.bg, color:style.color, border:`1px solid ${style.border}` }}>
      {label}
    </span>
  )
}

const TT = { background:'#0a1f0d', border:'1px solid rgba(196,156,64,0.35)', borderRadius:'10px', color:'#f0f0f0', boxShadow:'0 8px 24px rgba(0,0,0,0.5)', padding:'10px 14px' }
const TL = { color:'#c49c40', fontWeight:'600', fontSize:'13px', marginBottom:'4px' }
const TI = { color:'#f0f0f0', fontSize:'13px' }
const AX = { fontSize:11, fill:'#6e8872' }

const EMPTY_FORM = { category_id:'', fiscal_year:YEAR, quarter:'', allocated_amount:'', description:'' }

export default function BudgetPage() {
  const { hasRole } = useAuth()
  const [categories, setCategories]   = useState([])
  const [allocations, setAllocations] = useState([])
  const [summary, setSummary]         = useState(null)
  const [loading, setLoading]         = useState(true)
  const [submitting, setSubmitting]   = useState(false)
  const [year, setYear]               = useState(YEAR)
  const [showModal, setShowModal]     = useState(false)
  const [editing, setEditing]         = useState(null)
  const [form, setForm]               = useState(EMPTY_FORM)
  const [errors, setErrors]           = useState({})

  const load = async () => {
    setLoading(true)
    try {
      const [catRes, allocRes, sumRes] = await Promise.all([
        budgetAPI.categories(), budgetAPI.allocations(year), transactionAPI.summary(year),
      ])
      setCategories(catRes.data)
      setAllocations(allocRes.data)
      setSummary(sumRes.data)
    } catch { toast.error('Failed to load budget data') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [year])

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {}
    if (!form.category_id)     e.category_id     = 'Please select a category'
    if (!form.allocated_amount || parseFloat(form.allocated_amount) <= 0)
      e.allocated_amount = 'Please enter a valid amount greater than 0'
    if (!form.fiscal_year)     e.fiscal_year     = 'Please select a fiscal year'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      if (editing) {
        await budgetAPI.updateAllocation(editing.id, {
          allocated_amount: parseFloat(form.allocated_amount),
          description: form.description,
        })
        toast.success('Allocation updated!')
      } else {
        await budgetAPI.createAllocation({
          category_id:      parseInt(form.category_id),
          fiscal_year:      parseInt(form.fiscal_year),
          quarter:          form.quarter ? parseInt(form.quarter) : null,
          allocated_amount: parseFloat(form.allocated_amount),
          description:      form.description || null,
        })
        toast.success('Budget allocation created!')
      }
      setShowModal(false)
      setEditing(null)
      setForm(EMPTY_FORM)
      setErrors({})
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Operation failed')
    } finally { setSubmitting(false) }
  }

  const handleApprove = async (id) => {
    try { await budgetAPI.updateAllocation(id, { status:'approved' }); toast.success('Approved!'); load() }
    catch { toast.error('Failed to approve') }
  }

  const startEdit = (a) => {
    setEditing(a)
    setForm({ category_id:a.category_id, fiscal_year:a.fiscal_year, quarter:a.quarter||'', allocated_amount:a.allocated_amount, description:a.description||'' })
    setErrors({})
    setShowModal(true)
  }

  const openNew = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM, fiscal_year: year })
    setErrors({})
    setShowModal(true)
  }

  const closeModal = () => { setShowModal(false); setEditing(null); setErrors({}) }

  const chartData = allocations.reduce((acc, a) => {
    const ex = acc.find(x => x.category === a.category_code)
    if (ex) ex.allocated += a.allocated_amount
    else acc.push({ category:a.category_code, allocated:a.allocated_amount, color:a.category_color })
    return acc
  }, [])

  const totalAllocated = allocations.reduce((s, a) => s + a.allocated_amount, 0)
  const cell = (i) => i % 2 === 0 ? T.td : T.tdAlt

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={T.pageTitle}>Budget Management</h1>
          <p style={T.pageSubtitle}>Total allocated: {fmt(totalAllocated)} · FY {year}</p>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          <select style={{ ...filterInput, width:'110px' }} value={year} onChange={e => setYear(parseInt(e.target.value))}>
            {[YEAR, YEAR-1, YEAR-2].map(y => <option key={y} value={y}>FY {y}</option>)}
          </select>
          <button onClick={load} style={btnOutline}><RefreshCw size={14} /></button>
          {hasRole('admin','treasurer') && (
            <button onClick={openNew} style={btnGold}><Plus size={16} /> New Allocation</button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px' }}>
        {[
          { label:'Total Allocated', value:fmt(totalAllocated),        color:'#c49c40' },
          { label:'Total Spent',     value:fmt(summary?.total_expense), color:'#ef4444' },
          { label:'Net Balance',     value:fmt(summary?.net_balance),   color:(summary?.net_balance??0)>=0?'#22c55e':'#ef4444' },
        ].map(s => (
          <div key={s.label} style={T.statCard}>
            <p style={{ fontSize:'12px', color:'#6e8872', marginBottom:'6px' }}>{s.label}</p>
            <p style={{ fontSize:'22px', fontWeight:'700', color:s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div style={T.chartCard}>
          <p style={{ fontSize:'14px', fontWeight:'600', color:'#ffffff', marginBottom:'16px' }}>Budget Allocation by Category</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(196,156,64,0.08)" />
              <XAxis dataKey="category" stroke="#2f5238" tick={AX} />
              <YAxis stroke="#2f5238" tick={AX} tickFormatter={v=>`₱${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={TT} labelStyle={TL} itemStyle={TI} formatter={(v)=>[fmt(v),'Allocated']} cursor={{ fill:'rgba(196,156,64,0.08)' }} />
              <Bar dataKey="allocated" radius={[4,4,0,0]} fill="transparent" isAnimationActive={false}>
                {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      <div style={T.tableWrapper}>
        <div style={{ padding:'16px 20px', backgroundColor:'#162019', borderBottom:'1px solid #243d2a' }}>
          <p style={{ fontSize:'14px', fontWeight:'600', color:'#ffffff' }}>Budget Allocations</p>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['Category','Fiscal Year','Quarter','Allocated Amount','Description','Status',
                  hasRole('admin','treasurer','auditor') ? 'Actions' : null
                ].filter(Boolean).map(h => <th key={h} style={T.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({length:4}).map((_,i) => (
                  <tr key={i}>{Array.from({length:7}).map((_,j) => (
                    <td key={j} style={cell(i)}><div style={{ height:'14px', backgroundColor:'#e8e4d8', borderRadius:'4px' }} /></td>
                  ))}</tr>
                ))
              ) : allocations.length === 0 ? (
                <tr><td colSpan={7} style={{ ...T.td, textAlign:'center', padding:'40px', color:'#6e8872' }}>No allocations found</td></tr>
              ) : allocations.map((a, i) => {
                const ss = STATUS[a.status] || { bg:'#f1f5f9', color:'#475569', border:'#cbd5e1' }
                const td = cell(i)
                return (
                  <tr key={a.id}>
                    <td style={td}>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <div style={{ width:'10px', height:'10px', borderRadius:'50%', backgroundColor:a.category_color, flexShrink:0 }} />
                        <div>
                          <p style={{ fontSize:'13px', color:'#1a2e20', fontWeight:'600', margin:0 }}>{a.category_name}</p>
                          <p style={{ fontSize:'11px', color:'#5a7060', margin:0 }}>{a.category_code}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ ...td, color:'#5a7060' }}>{a.fiscal_year}</td>
                    <td style={{ ...td, color:'#5a7060' }}>{a.quarter ? `Q${a.quarter}` : 'Annual'}</td>
                    <td style={{ ...td, fontWeight:'700', color:'#1a4a2a' }}>{fmt(a.allocated_amount)}</td>
                    <td style={{ ...td, maxWidth:'200px' }}>
                      <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'block', color:'#3d5c45', fontSize:'12px' }}>{a.description || '—'}</span>
                    </td>
                    <td style={td}><Badge label={a.status} style={ss} /></td>
                    {hasRole('admin','treasurer','auditor') && (
                      <td style={td}>
                        <div style={{ display:'flex', gap:'4px' }}>
                          {hasRole('admin','treasurer') && (
                            <button onClick={() => startEdit(a)} title="Edit" style={{ padding:'6px', borderRadius:'6px', backgroundColor:'#dbeafe', color:'#1e40af', border:'1px solid #93c5fd', cursor:'pointer' }}><Edit size={13} /></button>
                          )}
                          {hasRole('admin','auditor') && a.status === 'draft' && (
                            <button onClick={() => handleApprove(a.id)} title="Approve" style={{ padding:'6px', borderRadius:'6px', backgroundColor:'#dcfce7', color:'#166534', border:'1px solid #86efac', cursor:'pointer' }}><CheckCircle size={13} /></button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.75)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:'16px' }}>
          <div style={T.modal}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:'1px solid #243d2a' }}>
              <h2 style={{ fontSize:'16px', fontWeight:'700', color:'#ffffff', margin:0 }}>{editing ? 'Edit Allocation' : 'New Budget Allocation'}</h2>
              <button onClick={closeModal} style={{ background:'none', border:'none', color:'#6e8872', cursor:'pointer', fontSize:'20px', lineHeight:1 }}>✕</button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:'14px' }}>
              {/* Category */}
              <div>
                <label style={T.modalLabel}>Category *</label>
                <select
                  style={errors.category_id ? T.errorInput : T.modalInput}
                  value={form.category_id}
                  onChange={e => { setForm(p => ({...p, category_id:e.target.value})); setErrors(p => ({...p, category_id:''})) }}
                  disabled={!!editing}
                >
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                </select>
                {errors.category_id && <p style={{ color:'#ef4444', fontSize:'11px', marginTop:'4px' }}>{errors.category_id}</p>}
              </div>

              {/* Fiscal Year + Quarter */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                <div>
                  <label style={T.modalLabel}>Fiscal Year *</label>
                  <select
                    style={errors.fiscal_year ? T.errorInput : T.modalInput}
                    value={form.fiscal_year}
                    onChange={e => { setForm(p => ({...p, fiscal_year:e.target.value})); setErrors(p => ({...p, fiscal_year:''})) }}
                    disabled={!!editing}
                  >
                    {[YEAR, YEAR+1, YEAR-1].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label style={T.modalLabel}>Quarter (Optional)</label>
                  <select style={T.modalInput} value={form.quarter} onChange={e => setForm(p => ({...p, quarter:e.target.value}))} disabled={!!editing}>
                    <option value="">Annual</option>
                    <option value="1">Q1 (Jan–Mar)</option>
                    <option value="2">Q2 (Apr–Jun)</option>
                    <option value="3">Q3 (Jul–Sep)</option>
                    <option value="4">Q4 (Oct–Dec)</option>
                  </select>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label style={T.modalLabel}>Allocated Amount (₱) *</label>
                <input
                  style={errors.allocated_amount ? T.errorInput : T.modalInput}
                  type="number" step="0.01" min="0.01"
                  placeholder="e.g. 150000.00"
                  value={form.allocated_amount}
                  onChange={e => { setForm(p => ({...p, allocated_amount:e.target.value})); setErrors(p => ({...p, allocated_amount:''})) }}
                />
                {errors.allocated_amount && <p style={{ color:'#ef4444', fontSize:'11px', marginTop:'4px' }}>{errors.allocated_amount}</p>}
              </div>

              {/* Description */}
              <div>
                <label style={T.modalLabel}>Description</label>
                <textarea style={{ ...T.modalInput, resize:'vertical' }} rows={2} placeholder="Optional budget description" value={form.description} onChange={e => setForm(p => ({...p, description:e.target.value}))} />
              </div>

              {/* Buttons */}
              <div style={{ display:'flex', gap:'10px', paddingTop:'4px' }}>
                <button type="button" onClick={closeModal} style={{ ...btnOutline, flex:1, justifyContent:'center' }}>Cancel</button>
                <button type="submit" style={{ ...btnGold, flex:1, justifyContent:'center', opacity: submitting ? 0.7 : 1 }} disabled={submitting}>
                  {submitting ? 'Saving...' : `${editing ? 'Update' : 'Create'} Allocation`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}