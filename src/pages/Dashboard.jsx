import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { TASK_TEMPLATES, TYPE_LABELS, TYPE_COLORS } from '../lib/templates'
import { exportToExcel } from '../lib/exportExcel'
import { parseProtocollo } from '../lib/parseWord'

const TYPES = Object.keys(TYPE_LABELS)

const PRIORITY_OPTIONS = [
  { value: 'normale',    label: 'Normale',    color: '#888780', bg: '#F1EFE8' },
  { value: 'attenzione', label: 'Attenzione', color: '#854F0B', bg: '#FAEEDA' },
  { value: 'critico',    label: 'Critico',    color: '#A32D2D', bg: '#FCEBEB' },
]

const PRIORITY_ORDER = { critico: 0, attenzione: 1, normale: 2 }

function PriorityDot({ priority }) {
  if (priority === 'critico')    return <span title="Critico"    style={{ fontSize: 14 }}>🔴</span>
  if (priority === 'attenzione') return <span title="Attenzione" style={{ fontSize: 14 }}>🟡</span>
  return null
}

function Badge({ type }) {
  const c = TYPE_COLORS[type] || TYPE_COLORS['ALTRO']
  return (
    <span style={{ background: c.bg, color: c.text, fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>
      {TYPE_LABELS[type] || type}
    </span>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px' }}>
      <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 600, color: color || 'var(--text)' }}>{value}</div>
    </div>
  )
}

function ProgressBar({ done, total }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
      <div style={{ flex: 1, height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: pct + '%', height: '100%', background: pct === 100 ? 'var(--green)' : 'var(--blue)', borderRadius: 3, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 12, color: pct === 100 ? 'var(--green)' : 'var(--text2)', minWidth: 52, textAlign: 'right', fontWeight: 500 }}>
        {done}/{total} · {pct}%
      </span>
    </div>
  )
}

export default function Dashboard({ userName, canEdit, onChangeName, onOpenDetail }) {
  const [ops, setOps] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [parsePreview, setParsePreview] = useState(null)
  const [form, setForm] = useState({ name: '', type: 'NUOVO NEGOZIO', date: '', note: '' })
  const fileRef = useRef()

  const loadOps = useCallback(async () => {
    const { data: operations } = await supabase
      .from('operations')
      .select('*, tasks(*)')
    setOps(operations || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadOps()
    const channel = supabase.channel('ops-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'operations' }, loadOps)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, loadOps)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [loadOps])

  const getStatus = (op) => {
    const tasks = op.tasks || []
    if (!tasks.length) return 'todo'
    const done = tasks.filter(t => t.done).length
    if (done === 0) return 'todo'
    if (done === tasks.length) return 'done'
    return 'wip'
  }

  // Ordinamento: prima per criticità, poi per data più vicina
  const sortedOps = [...(ops)].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 2
    const pb = PRIORITY_ORDER[b.priority] ?? 2
    if (pa !== pb) return pa - pb
    // Per data: le più vicine in cima (null in fondo)
    if (!a.date && !b.date) return 0
    if (!a.date) return 1
    if (!b.date) return -1
    return new Date(a.date) - new Date(b.date)
  })

  const filtered = sortedOps.filter(op => {
    if (filter !== 'ALL' && op.type !== filter) return false
    if (search && !op.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const stats = {
    total: ops.length,
    wip: ops.filter(o => getStatus(o) === 'wip').length,
    done: ops.filter(o => getStatus(o) === 'done').length,
    todo: ops.filter(o => getStatus(o) === 'todo').length,
  }

  const handleWordUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setParsing(true)
    try {
      const data = await parseProtocollo(file)
      setParsePreview(data)
      setForm({
        name: data.nome || '',
        type: data.suggeritedType || 'NUOVO NEGOZIO',
        date: data.dataCommerciale || data.dataAmministrativa || '',
        note: (data.noteLines || []).join('\n'),
      })
      setShowModal(true)
    } catch (err) {
      alert('Errore nella lettura del file: ' + err.message)
    }
    setParsing(false)
    e.target.value = ''
  }

  const createOp = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    const { data: op, error } = await supabase.from('operations').insert({
      name: form.name.trim(),
      type: form.type,
      date: form.date || null,
      note: form.note.trim() || null,
      created_by_name: userName,
      priority: 'normale',
    }).select().single()

    if (!error && op) {
      const tasks = (TASK_TEMPLATES[form.type] || []).map((label, i) => ({
        operation_id: op.id, label, sort_order: i,
      }))
      if (tasks.length) await supabase.from('tasks').insert(tasks)
    }
    setSaving(false)
    setShowModal(false)
    setParsePreview(null)
    setForm({ name: '', type: 'NUOVO NEGOZIO', date: '', note: '' })
    loadOps()
  }

  const deleteOp = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Eliminare questa operazione?')) return
    await supabase.from('operations').delete().eq('id', id)
    loadOps()
  }

  const statusDot = (status) => {
    const color = status === 'done' ? 'var(--green)' : status === 'wip' ? 'var(--amber)' : 'var(--border2)'
    return <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
  }

  // Giorni mancanti all'apertura
  const daysTo = (dateStr) => {
    if (!dateStr) return null
    const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24))
    return diff
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <img src="/Network-Operations/logo.png" alt="Amplifon" style={{ height: 36, marginBottom: 8, display: 'block' }} />
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>IT Ops — Growth Tracker</h1>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
            Ciao, {userName}
            {!canEdit && <span style={{ background: '#FAEEDA', color: '#633806', fontSize: 11, padding: '1px 8px', borderRadius: 20 }}>sola lettura</span>}
            <button onClick={onChangeName} style={{ background: 'none', border: 'none', color: 'var(--blue)', fontSize: 12, cursor: 'pointer', padding: 0 }}>cambia</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => exportToExcel(ops)} style={{ padding: '8px 14px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 13, color: 'var(--text)' }}>
            ↓ Excel
          </button>
          {canEdit && (
            <>
              <input ref={fileRef} type="file" accept=".doc,.docx" onChange={handleWordUpload} style={{ display: 'none' }} />
              <button onClick={() => fileRef.current.click()} disabled={parsing}
                style={{ padding: '8px 14px', background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 13, color: 'var(--text)' }}>
                {parsing ? 'Lettura...' : '📄 Importa protocollo'}
              </button>
              <button onClick={() => { setParsePreview(null); setForm({ name: '', type: 'NUOVO NEGOZIO', date: '', note: '' }); setShowModal(true) }}
                style={{ padding: '8px 16px', background: 'var(--text)', color: 'var(--bg)', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500 }}>
                + Nuova
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats generali */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 10, marginBottom: '0.75rem' }}>
        <StatCard label="Totale" value={stats.total} />
        <StatCard label="In corso" value={stats.wip} color="var(--amber)" />
        <StatCard label="Completate" value={stats.done} color="var(--green)" />
        <StatCard label="Da iniziare" value={stats.todo} />
      </div>

{/* Stats criticità */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 10, marginBottom: '1.25rem' }}>
        <div style={{ background: '#F1EFE8', borderRadius: 10, padding: '12px 16px' }}>
          <div style={{ fontSize: 12, color: '#5F5E5A', marginBottom: 4 }}>🟢 Normali</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: '#444441' }}>
            {ops.filter(o => !o.priority || o.priority === 'normale').length}
          </div>
        </div>
        <div style={{ background: '#FAEEDA', borderRadius: 10, padding: '12px 16px' }}>
          <div style={{ fontSize: 12, color: '#854F0B', marginBottom: 4 }}>🟡 Attenzione</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: '#854F0B' }}>
            {ops.filter(o => o.priority === 'attenzione').length}
          </div>
        </div>
        <div style={{ background: '#FCEBEB', borderRadius: 10, padding: '12px 16px' }}>
          <div style={{ fontSize: 12, color: '#A32D2D', marginBottom: 4 }}>🔴 Critiche</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: '#A32D2D' }}>
            {ops.filter(o => o.priority === 'critico').length}
          </div>
        </div>
      </div>
      
        {/* Criticità */}
        {ops.filter(o => o.priority === 'critico').length > 0 && (
          <div style={{ background: '#FCEBEB', borderRadius: 10, padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 2, minWidth: 110 }}>
            <div style={{ fontSize: 11, color: '#A32D2D', fontWeight: 500 }}>🔴 Critici</div>
            <span style={{ fontSize: 20, fontWeight: 600, color: '#A32D2D' }}>{ops.filter(o => o.priority === 'critico').length}</span>
          </div>
        )}
        {ops.filter(o => o.priority === 'attenzione').length > 0 && (
          <div style={{ background: '#FAEEDA', borderRadius: 10, padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 2, minWidth: 110 }}>
            <div style={{ fontSize: 11, color: '#854F0B', fontWeight: 500 }}>🟡 Attenzione</div>
            <span style={{ fontSize: 20, fontWeight: 600, color: '#854F0B' }}>{ops.filter(o => o.priority === 'attenzione').length}</span>
          </div>
        )}
      </div>

      {/* Ricerca e filtri */}
      <div style={{ marginBottom: '0.75rem' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca per nome sede…" style={{ marginBottom: 10 }} />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => setFilter('ALL')} style={{
            padding: '4px 12px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
            background: filter === 'ALL' ? 'var(--text)' : 'var(--bg2)',
            color: filter === 'ALL' ? 'var(--bg)' : 'var(--text2)',
            border: filter === 'ALL' ? 'none' : '1px solid var(--border)', fontWeight: filter === 'ALL' ? 500 : 400,
          }}>Tutte</button>
          {TYPES.map(t => (
            <button key={t} onClick={() => setFilter(t)} style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
              background: filter === t ? 'var(--text)' : 'var(--bg2)',
              color: filter === t ? 'var(--bg)' : 'var(--text2)',
              border: filter === t ? 'none' : '1px solid var(--border)', fontWeight: filter === t ? 500 : 400,
            }}>{TYPE_LABELS[t]}</button>
          ))}
        </div>
      </div>

      {/* Lista operazioni */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text2)', fontSize: 14 }}>Caricamento…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text2)', fontSize: 14, border: '1px dashed var(--border2)', borderRadius: 12 }}>
          {ops.length === 0 ? 'Nessuna operazione. Clicca "+ Nuova" o importa un protocollo Word.' : 'Nessun risultato.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(op => {
            const tasks = op.tasks || []
            const doneTasks = tasks.filter(t => t.done).length
            const status = getStatus(op)
            const dateStr = op.date ? new Date(op.date + 'T00:00:00').toLocaleDateString('it-IT') : ''
            const days = daysTo(op.date)
            const priority = op.priority || 'normale'
            const borderColor = priority === 'critico' ? '#F09595' : priority === 'attenzione' ? '#FAC775' : 'var(--border)'
            return (
              <div key={op.id} onClick={() => onOpenDetail(op.id)}
                style={{ background: 'var(--bg)', border: `1px solid ${borderColor}`, borderRadius: 12, padding: '14px 16px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = priority === 'critico' ? '#E24B4A' : priority === 'attenzione' ? '#EF9F27' : 'var(--border2)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = borderColor}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {statusDot(status)}
                  <PriorityDot priority={priority} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 15 }}>{op.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                      <Badge type={op.type} />
                      {dateStr && (
                        <span style={{ fontSize: 12, color: days !== null && days <= 7 ? '#A32D2D' : days !== null && days <= 30 ? '#854F0B' : 'var(--text2)', fontWeight: days !== null && days <= 7 ? 600 : 400 }}>
                          {dateStr}{days !== null && days >= 0 ? ` (${days}gg)` : days !== null && days < 0 ? ' (scaduta)' : ''}
                        </span>
                      )}
                      {op.created_by_name && <span style={{ fontSize: 12, color: 'var(--text3)' }}>— {op.created_by_name}</span>}
                    </div>
                    {op.note && <div style={{ fontSize: 12, color: 'var(--text2)', fontStyle: 'italic', marginTop: 4, whiteSpace: 'pre-line' }}>{op.note}</div>}
                    {tasks.length > 0 && <ProgressBar done={doneTasks} total={tasks.length} />}
                  </div>
                  {canEdit && (
                    <button onClick={e => deleteOp(op.id, e)}
                      style={{ padding: '4px 10px', background: 'none', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, color: 'var(--text2)', marginLeft: 8 }}>
                      Elimina
                    </button>
                  )}
                  <span style={{ fontSize: 18, color: 'var(--text3)', marginLeft: 4 }}>›</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal nuova operazione */}
      {canEdit && showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={{ background: 'var(--bg)', borderRadius: 14, padding: '1.5rem', width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: parsePreview ? 8 : '1rem' }}>
              {parsePreview ? '📄 Importato da protocollo' : 'Nuova operazione'}
            </h2>
            {parsePreview && (
              <div style={{ background: 'var(--bg2)', borderRadius: 8, padding: '10px 12px', marginBottom: '1rem', fontSize: 12, color: 'var(--text2)' }}>
                Dati letti dal documento — verifica e correggi se necessario
              </div>
            )}
            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>Nome / Sede *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Es. Negozio Milano Centrale" autoFocus />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>Tipologia *</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>Data apertura commerciale</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Note / dettagli</label>
              <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} rows={5} placeholder="Informazioni aggiuntive…" />
            </div>
            <div style={{ background: 'var(--bg2)', borderRadius: 8, padding: '8px 12px', marginBottom: 16, fontSize: 13, color: 'var(--text2)' }}>
              Verranno create <strong>{TASK_TEMPLATES[form.type]?.length || 0}</strong> sotto-attività automaticamente.
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowModal(false); setParsePreview(null) }} style={btnSecondary}>Annulla</button>
              <button onClick={createOp} disabled={saving || !form.name.trim()} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Salvataggio…' : 'Crea operazione'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const lbl = { display: 'block', fontSize: 13, color: 'var(--text2)', marginBottom: 4 }
const btnPrimary = { padding: '8px 18px', background: 'var(--text)', color: 'var(--bg)', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' }
const btnSecondary = { padding: '8px 16px', background: 'none', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 14, color: 'var(--text)', cursor: 'pointer' }
