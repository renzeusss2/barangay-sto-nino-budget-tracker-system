import { useEffect, useState } from 'react'
import { transactionAPI, budgetAPI } from '../utils/api'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Search, CheckCircle, XCircle, RefreshCw, Link } from 'lucide-react'
import toast from 'react-hot-toast'

const YEAR = new Date().getFullYear()
const fmt = (n) => `₱${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`

/* ─── Style tokens ─────────────────────────────────────── */
const T = {
  pageTitle:    { fontSize: '22px', fontWeight: '700', color: '#ffffff', marginBottom: '4px' },
  pageSubtitle: { fontSize: '13px', color: 'rgba(196,156,64,0.8)' },
  filterCard: {
    backgroundColor: '#122018', border: '1px solid #243d2a',
    borderRadius: '10px', padding: '14px 16px',
    display: 'flex', flexWrap: 'wrap', gap: '10px',
  },
  filterInput: {
    backgroundColor: '#1a2e20', border: '1px solid #2f5238',
    borderRadius: '8px', padding: '9px 12px',
    fontSize: '13px', color: '#f0f0f0',
    outline: 'none', fontFamily: 'inherit',
  },
  tableWrapper: {
    backgroundColor: '#ffffff', border: '1px solid #e8e4d8',
    borderRadius: '12px', overflow: 'hidden',
    boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
  },
  th: {
    padding: '12px 16px', fontSize: '11px', fontWeight: '700',
    color: '#c49c40', textTransform: 'uppercase', letterSpacing: '0.08em',
    textAlign: 'left', backgroundColor: '#162019',
    borderBottom: '1px solid #243d2a', whiteSpace: 'nowrap',
  },
  td:    { padding: '12px 16px', fontSize: '13px', color: '#1a2e20', borderBottom: '1px solid #e8e4d8', backgroundColor: '#f9f7f2', verticalAlign: 'middle' },
  tdAlt: { padding: '12px 16px', fontSize: '13px', color: '#1a2e20', borderBottom: '1px solid #e8e4d8', backgroundColor: '#f3f0e8', verticalAlign: 'middle' },
  pagination: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 16px', backgroundColor: '#f9f7f2', borderTop: '1px solid #e8e4d8',
  },
  modal: {
    backgroundColor: '#122018', border: '1px solid rgba(196,156,64,0.25)',
    borderRadius: '14px', width: '100%', maxWidth: '600px',
    maxHeight: '90vh', overflowY: 'auto',
  },
  modalLabel: { display: 'block', fontSize: '12px', fontWeight: '600', color: '#b8c4bb', marginBottom: '6px' },
  modalInput: {
    width: '100%', backgroundColor: '#1a2e20', border: '1px solid #2f5238',
    borderRadius: '8px', padding: '10px 12px', fontSize: '13px',
    color: '#f0f0f0', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  },
}

const btnGold    = { display:'flex', alignItems:'center', gap:'6px', padding:'9px 18px', borderRadius:'8px', fontSize:'13px', fontWeight:'600', color:'#0e1a12', background:'linear-gradient(135deg,#c49c40 0%,#a8832e 100%)', border:'1px solid #e8c060', cursor:'pointer' }
const btnOutline = { display:'flex', alignItems:'center', gap:'6px', padding:'9px 14px', borderRadius:'8px', fontSize:'13px', fontWeight:'500', color:'#b8c4bb', backgroundColor:'#243d2a', border:'1px solid #2f5238', cursor:'pointer' }
const btnOutlineGold = { ...btnOutline, color:'#c49c40', border:'1px solid rgba(196,156,64,0.35)' }

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

export default function TransactionsPage() {
  const { hasRole } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories]     = useState([])
  const [total, setTotal]               = useState(0)
  const [loading, setLoading]           = useState(true)
  const [showModal, setShowModal]       = useState(false)
  const [submitting, setSubmitting]     = useState(false)
  const [filters, setFilters] = useState({ fiscal_year: YEAR, status: '', transaction_type: '', search: '', limit: 25, offset: 0 })
  const [form, setForm] = useState({
    category_id:'', transaction_type:'expense', amount:'', description:'',
    payee_payer:'', voucher_number:'', or_number:'',
    transaction_date: new Date().toISOString().slice(0,10),
    fiscal_year: YEAR, quarter: Math.ceil((new Date().getMonth()+1)/3), notes:'',
  })

  const load = async () => {
    setLoading(true)
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([,v]) => v !== ''))
      const res = await transactionAPI.list(params)
      setTransactions(res.data.transactions)
      setTotal(res.data.total)
    } catch { toast.error('Failed to load transactions') }
    finally { setLoading(false) }
  }

  useEffect(() => { budgetAPI.categories().then(r => setCategories(r.data)) }, [])
  useEffect(() => { load() }, [filters])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.category_id || !form.amount || !form.description || !form.payee_payer)
      return toast.error('Please fill all required fields')
    setSubmitting(true)
    try {
      await transactionAPI.create({ ...form, amount: parseFloat(form.amount), category_id: parseInt(form.category_id) })
      toast.success('Transaction created and pending approval')
      setShowModal(false); load()
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to create transaction') }
    finally { setSubmitting(false) }
  }

  const handleApprove = async (id, action) => {
    try {
      const res = await transactionAPI.approve(id, { action })
      toast.success(`Transaction ${action}d successfully`)
      if (action === 'approved' && res.data.block_number)
        toast.success(`🔗 Added to blockchain block #${res.data.block_number}`, { duration: 4000 })
      load()
    } catch (err) { toast.error(err.response?.data?.detail || `Failed to ${action}`) }
  }

  const setF = (key, val) => setFilters(p => ({ ...p, [key]: val, offset: 0 }))
  const cell = (i) => i % 2 === 0 ? T.td : T.tdAlt

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={T.pageTitle}>Transactions</h1>
          <p style={T.pageSubtitle}>{total} total transactions · FY {filters.fiscal_year}</p>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          <button onClick={load} style={btnOutline}><RefreshCw size={14} /></button>
          {hasRole('admin','treasurer') && (
            <button onClick={() => setShowModal(true)} style={btnGold}><Plus size={16} /> New Transaction</button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={T.filterCard}>
        <div style={{ position:'relative', flex:1, minWidth:'200px' }}>
          <Search size={14} style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', color:'#6e8872' }} />
          <input style={{ ...T.filterInput, paddingLeft:'32px', width:'100%' }} placeholder="Search transactions..." value={filters.search} onChange={e => setF('search', e.target.value)} />
        </div>
        {[
          { key:'status',           opts:[['','All Status'],  ['pending','Pending'], ['approved','Approved'], ['rejected','Rejected']] },
          { key:'transaction_type', opts:[['','All Types'],   ['income','Income'],   ['expense','Expense']] },
          { key:'fiscal_year',      opts:[[YEAR,`FY ${YEAR}`],[YEAR-1,`FY ${YEAR-1}`],[YEAR-2,`FY ${YEAR-2}`]] },
        ].map(({ key, opts }) => (
          <select key={key} style={{ ...T.filterInput, minWidth:'130px', cursor:'pointer' }} value={filters[key]} onChange={e => setF(key, e.target.value)}>
            {opts.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        ))}
      </div>

      {/* Table */}
      <div style={T.tableWrapper}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['Reference #','Date','Description','Payee / Payer','Category','Type','Amount','Status','Blockchain',
                  hasRole('admin','auditor') ? 'Actions' : null
                ].filter(Boolean).map(h => <th key={h} style={T.th}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({length:5}).map((_,i) => (
                  <tr key={i}>{Array.from({length:9}).map((_,j) => (
                    <td key={j} style={cell(i)}><div style={{ height:'14px', backgroundColor:'#e8e4d8', borderRadius:'4px' }} /></td>
                  ))}</tr>
                ))
              ) : transactions.length === 0 ? (
                <tr><td colSpan={10} style={{ ...T.td, textAlign:'center', padding:'40px', color:'#6e8872' }}>No transactions found</td></tr>
              ) : transactions.map((tx, i) => {
                const td = cell(i)
                const ss = STATUS[tx.status]           || { bg:'#f1f5f9', color:'#475569', border:'#cbd5e1' }
                const ts = TYPE_BADGE[tx.transaction_type] || ss
                return (
                  <tr key={tx.id}>
                    <td style={td}>
                      <span style={{ fontFamily:'monospace', fontSize:'11px', color:'#1a4a2a', fontWeight:'600' }}>{tx.reference_number}</span>
                    </td>
                    <td style={{ ...td, color:'#5a7060', fontSize:'12px' }}>{new Date(tx.transaction_date).toLocaleDateString('en-PH')}</td>
                    <td style={{ ...td, maxWidth:'180px' }}>
                      <p style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', margin:0, fontWeight:'500', color:'#1a2e20' }}>{tx.description}</p>
                    </td>
                    <td style={{ ...td, color:'#3d5c45', fontSize:'12px' }}>{tx.payee_payer}</td>
                    <td style={td}>
                      <span style={{ fontSize:'11px', fontWeight:'700', padding:'3px 10px', borderRadius:'20px', backgroundColor:(tx.category_color||'#22c55e')+'22', color:tx.category_color||'#166534', border:`1px solid ${(tx.category_color||'#22c55e')}55` }}>
                        {tx.category_code}
                      </span>
                    </td>
                    <td style={td}><Badge label={tx.transaction_type} style={ts} /></td>
                    <td style={{ ...td, fontWeight:'700', color: tx.transaction_type==='income' ? '#166534' : '#991b1b' }}>
                      {tx.transaction_type==='income' ? '+' : '-'}{fmt(tx.amount)}
                    </td>
                    <td style={td}><Badge label={tx.status} style={ss} /></td>
                    <td style={td}>
                      {tx.blockchain_hash ? (
                        <span style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'11px', fontWeight:'600', color:'#1a4a2a' }}>
                          <Link size={10} style={{ color:'#c49c40' }} />Block #{tx.block_number}
                        </span>
                      ) : <span style={{ fontSize:'11px', color:'#a0b0a5' }}>—</span>}
                    </td>
                    {hasRole('admin','auditor') && (
                      <td style={td}>
                        {tx.status === 'pending' ? (
                          <div style={{ display:'flex', gap:'4px' }}>
                            <button onClick={() => handleApprove(tx.id,'approved')} title="Approve" style={{ padding:'6px', borderRadius:'6px', backgroundColor:'#dcfce7', color:'#166534', border:'1px solid #86efac', cursor:'pointer' }}><CheckCircle size={14} /></button>
                            <button onClick={() => handleApprove(tx.id,'rejected')} title="Reject"  style={{ padding:'6px', borderRadius:'6px', backgroundColor:'#fee2e2', color:'#991b1b', border:'1px solid #fca5a5', cursor:'pointer' }}><XCircle  size={14} /></button>
                          </div>
                        ) : <span style={{ fontSize:'11px', color:'#a0b0a5' }}>—</span>}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={T.pagination}>
          <span style={{ fontSize:'12px', color:'#5a7060' }}>
            Showing {Math.min(filters.offset+1,total)}–{Math.min(filters.offset+filters.limit,total)} of {total}
          </span>
          <div style={{ display:'flex', gap:'8px' }}>
            <button style={{ ...btnOutlineGold, padding:'6px 14px', fontSize:'12px', opacity: filters.offset===0 ? 0.4 : 1 }} disabled={filters.offset===0} onClick={() => setFilters(p => ({ ...p, offset: Math.max(0,p.offset-p.limit) }))}>Previous</button>
            <button style={{ ...btnOutlineGold, padding:'6px 14px', fontSize:'12px', opacity: filters.offset+filters.limit>=total ? 0.4 : 1 }} disabled={filters.offset+filters.limit>=total} onClick={() => setFilters(p => ({ ...p, offset: p.offset+p.limit }))}>Next</button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.75)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50, padding:'16px' }}>
          <div style={T.modal}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 24px', borderBottom:'1px solid #243d2a' }}>
              <h2 style={{ fontSize:'16px', fontWeight:'700', color:'#ffffff', margin:0 }}>New Transaction</h2>
              <button onClick={() => setShowModal(false)} style={{ background:'none', border:'none', color:'#6e8872', cursor:'pointer', fontSize:'20px', lineHeight:1 }}>✕</button>
            </div>
            <form onSubmit={handleCreate} style={{ padding:'20px 24px', display:'flex', flexDirection:'column', gap:'14px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                <div>
                  <label style={T.modalLabel}>Transaction Type *</label>
                  <select style={T.modalInput} value={form.transaction_type} onChange={e => setForm(p => ({ ...p, transaction_type:e.target.value }))}>
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
                <div>
                  <label style={T.modalLabel}>Category *</label>
                  <select style={T.modalInput} value={form.category_id} onChange={e => setForm(p => ({ ...p, category_id:e.target.value }))}>
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={T.modalLabel}>Description *</label>
                <input style={T.modalInput} placeholder="Transaction description" value={form.description} onChange={e => setForm(p => ({ ...p, description:e.target.value }))} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                <div>
                  <label style={T.modalLabel}>Amount (₱) *</label>
                  <input style={T.modalInput} type="number" step="0.01" min="0" placeholder="0.00" value={form.amount} onChange={e => setForm(p => ({ ...p, amount:e.target.value }))} />
                </div>
                <div>
                  <label style={T.modalLabel}>Payee / Payer *</label>
                  <input style={T.modalInput} placeholder="Name" value={form.payee_payer} onChange={e => setForm(p => ({ ...p, payee_payer:e.target.value }))} />
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                <div>
                  <label style={T.modalLabel}>Transaction Date *</label>
                  <input style={T.modalInput} type="date" value={form.transaction_date} onChange={e => setForm(p => ({ ...p, transaction_date:e.target.value }))} />
                </div>
                <div>
                  <label style={T.modalLabel}>Quarter *</label>
                  <select style={T.modalInput} value={form.quarter} onChange={e => setForm(p => ({ ...p, quarter:parseInt(e.target.value) }))}>
                    <option value={1}>Q1 (Jan–Mar)</option>
                    <option value={2}>Q2 (Apr–Jun)</option>
                    <option value={3}>Q3 (Jul–Sep)</option>
                    <option value={4}>Q4 (Oct–Dec)</option>
                  </select>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                <div>
                  <label style={T.modalLabel}>Voucher Number</label>
                  <input style={T.modalInput} placeholder="Optional" value={form.voucher_number} onChange={e => setForm(p => ({ ...p, voucher_number:e.target.value }))} />
                </div>
                <div>
                  <label style={T.modalLabel}>OR Number</label>
                  <input style={T.modalInput} placeholder="Official Receipt No." value={form.or_number} onChange={e => setForm(p => ({ ...p, or_number:e.target.value }))} />
                </div>
              </div>
              <div>
                <label style={T.modalLabel}>Notes</label>
                <textarea style={{ ...T.modalInput, resize:'vertical' }} rows={2} placeholder="Optional notes" value={form.notes} onChange={e => setForm(p => ({ ...p, notes:e.target.value }))} />
              </div>
              <div style={{ display:'flex', gap:'10px', paddingTop:'4px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ ...btnOutline, flex:1, justifyContent:'center' }}>Cancel</button>
                <button type="submit" style={{ ...btnGold, flex:1, justifyContent:'center' }} disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}