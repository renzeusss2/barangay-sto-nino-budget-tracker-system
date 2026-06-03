import { useState, useEffect } from 'react'
import { blockchainAPI } from '../utils/api'
import { ShieldCheck, ShieldAlert, RefreshCw, Database, CheckCircle, Link } from 'lucide-react'
import toast from 'react-hot-toast'

const T = {
  pageTitle:    { fontSize:'22px', fontWeight:'700', color:'#ffffff', marginBottom:'4px' },
  pageSubtitle: { fontSize:'13px', color:'rgba(196,156,64,0.8)' },
  statCard:     { backgroundColor:'#122018', border:'1px solid #243d2a', borderRadius:'12px', padding:'18px 20px' },
  infoCard:     { backgroundColor:'#122018', border:'1px solid #243d2a', borderRadius:'12px', padding:'20px' },
  tableWrapper: { backgroundColor:'#ffffff', border:'1px solid #e8e4d8', borderRadius:'12px', overflow:'hidden', boxShadow:'0 4px 24px rgba(0,0,0,0.25)' },
  th:    { padding:'12px 16px', fontSize:'11px', fontWeight:'700', color:'#c49c40', textTransform:'uppercase', letterSpacing:'0.08em', textAlign:'left', backgroundColor:'#162019', borderBottom:'1px solid #243d2a', whiteSpace:'nowrap' },
  td:    { padding:'12px 16px', fontSize:'13px', color:'#1a2e20', borderBottom:'1px solid #e8e4d8', backgroundColor:'#f9f7f2', verticalAlign:'middle' },
  tdAlt: { padding:'12px 16px', fontSize:'13px', color:'#1a2e20', borderBottom:'1px solid #e8e4d8', backgroundColor:'#f3f0e8', verticalAlign:'middle' },
}

const btnOutline = {
  display:'flex', alignItems:'center', gap:'6px', padding:'9px 14px',
  borderRadius:'8px', fontSize:'13px', color:'#b8c4bb',
  backgroundColor:'#243d2a', border:'1px solid #2f5238', cursor:'pointer',
  transition:'all 0.2s',
}

const cell = (i) => i % 2 === 0 ? T.td : T.tdAlt

export default function BlockchainPage() {
  const [blocks, setBlocks]   = useState([])
  const [loading, setLoading] = useState(true)
  const [valid, setValid]     = useState(null)
  const [view, setView]       = useState('cards') // 'cards' | 'table'

  const fetchData = async () => {
    setLoading(true)
    try {
      const [blockRes, verifyRes] = await Promise.all([
        blockchainAPI.blocks(),
        blockchainAPI.verify(),
      ])
      const incomingBlocks = Array.isArray(blockRes.data)
        ? blockRes.data
        : (blockRes.data?.blocks || [])
      setBlocks(incomingBlocks)
      setValid(verifyRes.data?.valid ?? verifyRes.data?.chain_integrity === 'INTACT')
    } catch (err) {
      console.error('Blockchain Sync Error:', err)
      toast.error('Failed to sync blockchain audit trail')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'300px', color:'#6e8872', fontSize:'14px', gap:'10px' }}>
      <RefreshCw size={20} style={{ color:'#c49c40', animation:'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
      Loading Audit Trail...
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ ...T.pageTitle, display:'flex', alignItems:'center', gap:'10px' }}>
            <ShieldCheck size={24} style={{ color:'#c49c40' }} />
            Blockchain Audit Trail
          </h1>
          <p style={T.pageSubtitle}>Immutable ledger of all approved financial transactions · SHA-256</p>
        </div>
        <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
          {/* Chain status badge */}
          {valid !== null && (
            <div style={{
              display:'flex', alignItems:'center', gap:'8px',
              padding:'8px 16px', borderRadius:'20px',
              background: valid ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${valid ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            }}>
              {valid
                ? <ShieldCheck size={15} style={{ color:'#22c55e' }} />
                : <ShieldAlert  size={15} style={{ color:'#ef4444' }} />}
              <span style={{ fontSize:'13px', fontWeight:'600', color: valid ? '#22c55e' : '#ef4444' }}>
                {valid ? 'Chain Valid' : 'Chain Compromised'}
              </span>
            </div>
          )}

          {/* View toggle */}
          <div style={{ display:'flex', backgroundColor:'#1a2e20', border:'1px solid #2f5238', borderRadius:'8px', overflow:'hidden' }}>
            {[['cards','⊞ Cards'], ['table','☰ Table']].map(([v, label]) => (
              <button key={v} onClick={() => setView(v)} style={{
                padding:'8px 14px', fontSize:'12px', fontWeight:'600',
                cursor:'pointer', border:'none',
                backgroundColor: view === v ? '#c49c40' : 'transparent',
                color:           view === v ? '#0e1a12' : '#6e8872',
                transition:'all 0.15s',
              }}>{label}</button>
            ))}
          </div>

          <button
            onClick={fetchData}
            style={btnOutline}
            onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(196,156,64,0.4)'; e.currentTarget.style.color='#c49c40' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='#2f5238'; e.currentTarget.style.color='#b8c4bb' }}
          >
            <RefreshCw size={14} /> Re-verify Chain
          </button>
        </div>
      </div>

      {/* ── Integrity Banner ── */}
      <div style={{
        padding:'20px', borderRadius:'12px',
        background: valid ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
        border: `1px solid ${valid ? '#22c55e' : '#ef4444'}`,
        display:'flex', alignItems:'center', gap:'16px',
      }}>
        {valid
          ? <ShieldCheck size={40} style={{ color:'#22c55e', flexShrink:0 }} />
          : <ShieldAlert  size={40} style={{ color:'#ef4444', flexShrink:0 }} />}
        <div>
          <h2 style={{ fontSize:'18px', fontWeight:'700', color: valid ? '#22c55e' : '#ef4444', margin:'0 0 4px' }}>
            System Integrity: {valid ? 'SECURE' : 'COMPROMISED'}
          </h2>
          <p style={{ fontSize:'13px', color:'#6e8872', margin:0 }}>
            Cryptographic chain is {valid ? 'verified and intact' : 'potentially tampered'} · {blocks.length} blocks recorded
          </p>
        </div>
        <div style={{ marginLeft:'auto', textAlign:'right' }}>
          <p style={{ fontSize:'11px', color:'#6e8872', marginBottom:'2px' }}>Algorithm</p>
          <p style={{ fontSize:'13px', fontWeight:'600', color:'#c49c40' }}>SHA-256</p>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px' }}>
        {[
          { label:'Total Blocks',  value: blocks.length,                                            icon:'🔗', color:'#c49c40' },
          { label:'Chain Status',  value: valid === null ? 'Checking...' : valid ? 'INTACT' : 'COMPROMISED', icon: valid ? '✅' : '⚠️', color: valid ? '#22c55e' : '#ef4444' },
          { label:'Latest Block',  value: blocks.length > 0 ? `#${blocks[blocks.length-1]?.block_number}` : '—', icon:'📦', color:'#b8c4bb' },
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

      {/* ── CARDS VIEW with Database Chain Connector ── */}
      {view === 'cards' && (
        <div style={{ display:'flex', flexDirection:'column' }}>
          {blocks.length === 0 ? (
            <div style={{ textAlign:'center', padding:'48px', color:'#6e8872', backgroundColor:'#122018', border:'1px solid #243d2a', borderRadius:'12px' }}>
              <p style={{ fontSize:'32px', marginBottom:'12px' }}>🔗</p>
              <p>No blocks yet. Approve a transaction to create the first block.</p>
            </div>
          ) : blocks.map((block, index) => (
            <div key={block.id || index} style={{ position:'relative' }}>

              {/* Block Card */}
              <div
                style={{
                  background:'#122018', padding:'20px', borderRadius:'12px',
                  border:'1px solid #243d2a', position:'relative', zIndex:2,
                  marginBottom: index < blocks.length - 1 ? '36px' : '0',
                  transition:'border-color 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(196,156,64,0.45)'
                  e.currentTarget.style.boxShadow  = '0 4px 24px rgba(196,156,64,0.1)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#243d2a'
                  e.currentTarget.style.boxShadow  = 'none'
                }}
              >
                {/* Gold left accent bar */}
                <div style={{ position:'absolute', left:0, top:'16px', bottom:'16px', width:'3px', backgroundColor:'#c49c40', borderRadius:'0 2px 2px 0', opacity:0.7 }} />

                {/* Block header */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px', paddingLeft:'12px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                    <span style={{ fontWeight:'700', color:'#c49c40', fontSize:'13px', letterSpacing:'1px' }}>
                      BLOCK #{block.block_number}
                    </span>
                    {block.block_number === 1 && (
                      <span style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'20px', backgroundColor:'rgba(96,165,250,0.15)', color:'#93c5fd', border:'1px solid rgba(96,165,250,0.3)' }}>
                        Genesis
                      </span>
                    )}
                    <span style={{ fontSize:'10px', padding:'2px 8px', borderRadius:'20px', backgroundColor:'rgba(34,197,94,0.1)', color:'#22c55e', border:'1px solid rgba(34,197,94,0.25)' }}>
                      ✓ Verified
                    </span>
                  </div>
                  <span style={{ fontSize:'12px', color:'#6e8872' }}>
                    {new Date(block.timestamp).toLocaleString('en-PH')}
                  </span>
                </div>

                {/* Hash info grid */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', paddingLeft:'12px' }}>
                  <div>
                    <p style={{ fontSize:'10px', fontWeight:'700', color:'#6e8872', letterSpacing:'0.5px', textTransform:'uppercase', marginBottom:'5px' }}>Current Hash</p>
                    <p style={{ fontFamily:'monospace', color:'#c49c40', wordBreak:'break-all', fontSize:'10px', background:'rgba(196,156,64,0.05)', padding:'8px', borderRadius:'6px', border:'1px solid rgba(196,156,64,0.2)', margin:0 }}>
                      {block.current_hash || block.hash || 'No Hash Generated'}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize:'10px', fontWeight:'700', color:'#6e8872', letterSpacing:'0.5px', textTransform:'uppercase', marginBottom:'5px' }}>Previous Hash</p>
                    <p style={{ fontFamily:'monospace', color:'#b8c4bb', wordBreak:'break-all', fontSize:'10px', background:'rgba(0,0,0,0.25)', padding:'8px', borderRadius:'6px', border:'1px solid #243d2a', margin:0 }}>
                      {block.previous_hash || '0000000000000000'}
                    </p>
                  </div>
                </div>

                {/* Transaction data if available */}
                {block.data && (
                  <div style={{ marginTop:'12px', paddingLeft:'12px' }}>
                    <p style={{ fontSize:'10px', fontWeight:'700', color:'#6e8872', letterSpacing:'0.5px', textTransform:'uppercase', marginBottom:'5px' }}>Transaction Data</p>
                    <div style={{ background:'rgba(0,0,0,0.25)', border:'1px solid #243d2a', borderRadius:'6px', padding:'10px' }}>
                      <pre style={{ fontFamily:'monospace', fontSize:'10px', color:'#d1fae5', whiteSpace:'pre-wrap', wordBreak:'break-all', margin:0 }}>
                        {JSON.stringify(block.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Database Chain Connector (from your current code) ── */}
              {index < blocks.length - 1 && (
                <div style={{
                  position:'absolute',
                  bottom:'-22px',
                  left:'40px',
                  zIndex:10,
                  background:'#0a1a0f',
                  padding:'4px',
                  borderRadius:'50%',
                  border:'1px solid rgba(196,156,64,0.4)',
                  color:'#c49c40',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  boxShadow:'0 0 10px rgba(196,156,64,0.3)',
                }}>
                  <Database size={14} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── TABLE VIEW (white/gold from first code) ── */}
      {view === 'table' && (
        <div style={T.tableWrapper}>
          <div style={{ padding:'16px 20px', backgroundColor:'#162019', borderBottom:'1px solid #243d2a' }}>
            <p style={{ fontSize:'14px', fontWeight:'600', color:'#ffffff', margin:0 }}>All Recorded Blocks</p>
          </div>
          {blocks.length === 0 ? (
            <div style={{ textAlign:'center', padding:'48px', color:'#6e8872', fontSize:'14px', backgroundColor:'#f9f7f2' }}>
              <p style={{ fontSize:'32px', marginBottom:'12px' }}>🔗</p>
              <p>No blocks yet. Approve a transaction to create the first block.</p>
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr>
                    {['Block #','Timestamp','Current Hash','Previous Hash','Data','Verified'].map(h => (
                      <th key={h} style={T.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {blocks.map((block, i) => (
                    <tr key={block.id || i}
                      onMouseEnter={e => { Array.from(e.currentTarget.cells).forEach(td => td.style.backgroundColor = '#ede8d8') }}
                      onMouseLeave={e => { Array.from(e.currentTarget.cells).forEach((td, j) => td.style.backgroundColor = i % 2 === 0 ? '#f9f7f2' : '#f3f0e8') }}
                    >
                      <td style={{ ...cell(i), fontWeight:'700', color:'#1a4a2a' }}>#{block.block_number}</td>
                      <td style={{ ...cell(i), fontSize:'12px', color:'#5a7060', whiteSpace:'nowrap' }}>
                        {new Date(block.timestamp).toLocaleString('en-PH')}
                      </td>
                      <td style={cell(i)}>
                        <span style={{ fontFamily:'monospace', fontSize:'10px', color:'#1a4a2a', backgroundColor:'rgba(26,74,42,0.08)', padding:'3px 8px', borderRadius:'4px', border:'1px solid rgba(26,74,42,0.2)' }}>
                          {(block.current_hash || block.hash)?.slice(0,16)}...{(block.current_hash || block.hash)?.slice(-8)}
                        </span>
                      </td>
                      <td style={cell(i)}>
                        <span style={{ fontFamily:'monospace', fontSize:'10px', color:'#5a7060', backgroundColor:'rgba(90,112,96,0.08)', padding:'3px 8px', borderRadius:'4px', border:'1px solid rgba(90,112,96,0.2)' }}>
                          {block.previous_hash?.slice(0,16)}...{block.previous_hash?.slice(-8)}
                        </span>
                      </td>
                      <td style={{ ...cell(i), textAlign:'center' }}>
                        {block.data ? (
                          <span style={{ fontSize:'11px', fontWeight:'600', padding:'2px 10px', borderRadius:'20px', backgroundColor:'rgba(196,156,64,0.12)', color:'#c49c40', border:'1px solid rgba(196,156,64,0.3)' }}>
                            Has Data
                          </span>
                        ) : (
                          <span style={{ fontSize:'11px', color:'#a0b0a5' }}>—</span>
                        )}
                      </td>
                      <td style={{ ...cell(i), textAlign:'center' }}>
                        <CheckCircle size={15} style={{ color:'#166534' }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── How It Works ── */}
      <div style={T.infoCard}>
        <p style={{ fontSize:'14px', fontWeight:'600', color:'#ffffff', marginBottom:'16px' }}>How the Blockchain Audit Trail Works</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px' }}>
          {[
            { step:'1', title:'Transaction Approval', desc:'When a transaction is approved, it is serialized and queued for blockchain recording.', color:'#c49c40' },
            { step:'2', title:'Block Creation', desc:'A new block is created with transaction data and previous block hash using SHA-256 cryptography.', color:'#e8c060' },
            { step:'3', title:'Immutable Hash Chain', desc:"Each block's hash links to the previous block. Tampering with any record breaks the entire chain.", color:'#22c55e' },
          ].map(s => (
            <div key={s.step} style={{ display:'flex', gap:'12px' }}>
              <div style={{ width:'28px', height:'28px', borderRadius:'50%', backgroundColor:s.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:'700', color:'#0e1a12', flexShrink:0 }}>
                {s.step}
              </div>
              <div>
                <p style={{ fontSize:'13px', fontWeight:'600', color:'#ffffff', marginBottom:'4px' }}>{s.title}</p>
                <p style={{ fontSize:'12px', color:'#6e8872', lineHeight:'1.6', margin:0 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}