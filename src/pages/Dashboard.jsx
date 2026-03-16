import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { TASK_TEMPLATES, TYPE_LABELS, TYPE_COLORS } from '../lib/templates'
import { exportToExcel } from '../lib/exportExcel'
import { parseProtocollo } from '../lib/parseWord'

const TYPES = Object.keys(TYPE_LABELS)

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
      <div style={{ flex: 1, height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: pct + '%', height: '100%', background: pct === 100 ? 'var(--green)' : 'var(--blue)', borderRadius: 2, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 12, color: 'var(--text2)', minWidth: 36, textAlign: 'right' }}>{done}/{total}</span>
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
      .order('created_at', { ascending: false })
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

  const filtered = ops.filter(op => {
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
      const noteLines = []
      if (data.codiceFiliale) noteLines.push(`Codice filiale: ${data.codiceFiliale}`)
      if (data.tipoFiliale) noteLines.push(`Tipo: ${data.tipoFiliale}`)
      if (data.indirizzo) noteLines.push(`Indirizzo: ${data.indirizzo}`)
      if (data.zona) noteLines.push(`Zona: ${data.zona}`)
      if (data.autogestore) noteLines.push(`Autogestore: ${data.autogestore}`)
      if (data.dataAmministrativa) noteLines.push(`Apertura amministrativa (Fox): ${new Date(data.dataAmministrativa).toLocaleDateString('it-IT')}`)
      if (data.dataCommerciale) noteLines.push(`Apertura commerciale: ${new Date(data.dataCommerciale).toLocaleDateString('it-IT')}`)
      setForm({
        name: data.nome || '',
        type: data.suggeritedType || 'NUOVO NEGOZIO',
        date: data.dataCommerciale || data.dataAmministrativa || '',
        note: noteLines.join('\n'),
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
    return <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', marginRight: 8, flexShrink: 0 }} />
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', gap: 12, flexWrap: 'wrap' }}>
        <div>
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
              <button
                onClick={() => fileRef.current.click()}
                disabled={parsing}
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 10, marginBottom: '1.25rem' }}>
        <StatCard label="Totale" value={stats.total} />
        <StatCard label="In corso" value={stats.wip} color="var(--amber)" />
        <StatCard label="Completate" value={stats.done} color="var(--green)" />
        <StatCard label="Da iniziare" value={stats.todo} />
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca per nome sede…" style={{ marginBottom: 10 }} />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['ALL', ...TYPES].map(t => (
            <button key={t} onClick={() => setFilter(t)} style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
              background: filter === t ? 'var(--text)' : 'var(--bg2)',
              color: filter === t ? 'var(--bg)' : 'var(--text2)',
              border: filter === t ? 'none' : '1px solid var(--border)',
              fontWeight: filter === t ? 500 : 400,
            }}>
              {t === 'ALL' ? 'Tutte' : TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

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
            return (
              <div key={op.id} onClick={() => onOpenDetail(op.id)}
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {statusDot(status)}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 15 }}>{op.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                      <Badge type={op.type} />
                      {dateStr && <span style={{ fontSize: 12, color: 'var(--text2)' }}>{dateStr}</span>}
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
