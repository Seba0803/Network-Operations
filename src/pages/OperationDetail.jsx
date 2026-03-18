import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { TYPE_LABELS, TYPE_COLORS } from '../lib/templates'
import { parseProtocollo } from '../lib/parseWord'

function Badge({ type }) {
  const c = TYPE_COLORS[type] || TYPE_COLORS['ALTRO']
  return (
    <span style={{ background: c.bg, color: c.text, fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>
      {TYPE_LABELS[type] || type}
    </span>
  )
}

const PRIORITY_OPTIONS = [
  { value: 'normale',    label: 'Normale',    color: '#888780', bg: '#F1EFE8' },
  { value: 'attenzione', label: 'Attenzione', color: '#854F0B', bg: '#FAEEDA' },
  { value: 'critico',    label: 'Critico',    color: '#A32D2D', bg: '#FCEBEB' },
]

function PriorityBadge({ priority }) {
  const p = PRIORITY_OPTIONS.find(o => o.value === priority) || PRIORITY_OPTIONS[0]
  const dot = priority === 'critico' ? '🔴' : priority === 'attenzione' ? '🟡' : '🟢'
  return (
    <span style={{ background: p.bg, color: p.color, fontSize: 12, padding: '3px 10px', borderRadius: 20, fontWeight: 500 }}>
      {dot} {p.label}
    </span>
  )
}

export default function OperationDetail({ operationId, userName, canEdit, onBack }) {
  const [op, setOp] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [noteOpen, setNoteOpen] = useState({})
  const [noteValues, setNoteValues] = useState({})
  const [saving, setSaving] = useState({})
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [parsing, setParsing] = useState(false)
  const fileRef = useRef()

  const load = useCallback(async () => {
    const { data: operation } = await supabase.from('operations').select('*').eq('id', operationId).single()
    const { data: taskList } = await supabase.from('tasks').select('*').eq('operation_id', operationId).order('sort_order')
    setOp(operation)
    setTasks(taskList || [])
    setLoading(false)
    if (operation) setEditForm({
      name: operation.name,
      type: operation.type,
      date: operation.date || '',
      note: operation.note || '',
      priority: operation.priority || 'normale',
    })
  }, [operationId])

  useEffect(() => {
    load()
    const channel = supabase.channel('detail-' + operationId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `operation_id=eq.${operationId}` }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'operations', filter: `id=eq.${operationId}` }, load)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [load, operationId])

  const toggleTask = async (task) => {
    if (!canEdit) return
    const nowDone = !task.done
    setSaving(s => ({ ...s, [task.id]: true }))
    await supabase.from('tasks').update({
      done: nowDone,
      done_by_name: nowDone ? userName : null,
      done_at: nowDone ? new Date().toISOString() : null,
    }).eq('id', task.id)
    setSaving(s => ({ ...s, [task.id]: false }))
    load()
  }

  const saveNote = async (task) => {
    if (!canEdit) return
    const note = (noteValues[task.id] ?? task.note) || ''
    setSaving(s => ({ ...s, ['note_' + task.id]: true }))
    await supabase.from('tasks').update({ note: note.trim(), note_by_name: userName }).eq('id', task.id)
    setSaving(s => ({ ...s, ['note_' + task.id]: false }))
    setNoteOpen(s => ({ ...s, [task.id]: false }))
    load()
  }

  const savePriority = async (priority) => {
    await supabase.from('operations').update({ priority }).eq('id', operationId)
    load()
  }

  const saveEdit = async () => {
    await supabase.from('operations').update({
      name: editForm.name,
      type: editForm.type,
      date: editForm.date || null,
      note: editForm.note || null,
      priority: editForm.priority || 'normale',
    }).eq('id', operationId)
    setEditMode(false)
    load()
  }

  const handleWordUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setParsing(true)
    try {
      if (!window.mammoth) {
        await new Promise((resolve) => {
          const script = document.createElement('script')
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js'
          script.onload = resolve
          script.onerror = resolve
          document.head.appendChild(script)
        })
      }
      const data = await parseProtocollo(file)
      const noteLines = data.noteLines || []
      const newNote = noteLines.join('\n')
      await supabase.from('operations').update({
        note: newNote,
        date: data.dataCommerciale || data.dataAmministrativa || op.date,
      }).eq('id', operationId)
      load()
      alert('Protocollo importato! Note e data aggiornate.')
    } catch (err) {
      alert('Errore nella lettura del file: ' + err.message)
    }
    setParsing(false)
    e.target.value = ''
  }

  if (loading) return <div style={{ maxWidth: 680, margin: '0 auto', padding: '2rem', color: 'var(--text2)', fontSize: 14 }}>Caricamento…</div>
  if (!op) return <div style={{ maxWidth: 680, margin: '0 auto', padding: '2rem' }}><button onClick={onBack} style={btnBack}>← Dashboard</button><p>Operazione non trovata.</p></div>

  const done = tasks.filter(t => t.done).length
  const total = tasks.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const dateStr = op.date ? new Date(op.date + 'T00:00:00').toLocaleDateString('it-IT') : ''
  const priority = op.priority || 'normale'

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '1rem' }}>
      <button onClick={onBack} style={btnBack}>← Dashboard</button>

      {/* Header card */}
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.25rem', marginBottom: '1rem' }}>
        {editMode && canEdit ? (
          <div>
            <div style={{ marginBottom: 10 }}><label style={lbl}>Nome / Sede</label><input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} autoFocus /></div>
            <div style={{ marginBottom: 10 }}><label style={lbl}>Tipologia</label>
              <select value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value })}>
                {Object.keys(TYPE_LABELS).map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 10 }}><label style={lbl}>Data apertura commerciale</label><input type="date" value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })} /></div>
            <div style={{ marginBottom: 10 }}>
              <label style={lbl}>Criticità</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {PRIORITY_OPTIONS.map(p => (
                  <button key={p.value} onClick={() => setEditForm({ ...editForm, priority: p.value })}
                    style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                      background: editForm.priority === p.value ? p.bg : 'var(--bg2)',
                      color: editForm.priority === p.value ? p.color : 'var(--text2)',
                      border: editForm.priority === p.value ? `1.5px solid ${p.color}` : '1px solid var(--border)',
                      fontWeight: editForm.priority === p.value ? 600 : 400 }}>
                    {p.value === 'critico' ? '🔴' : p.value === 'attenzione' ? '🟡' : '🟢'} {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 14 }}><label style={lbl}>Note</label><textarea value={editForm.note} onChange={e => setEditForm({ ...editForm, note: e.target.value })} /></div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => setEditMode(false)} style={btnSecondary}>Annulla</button>
              <button onClick={saveEdit} style={btnPrimary}>Salva</button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: 18, fontWeight: 600 }}>{op.name}</h2>
                  <PriorityBadge priority={priority} />
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: op.note ? 8 : 0 }}>
                  <Badge type={op.type} />
                  {dateStr && <span style={{ fontSize: 13, color: 'var(--text2)' }}>Apertura: {dateStr}</span>}
                  {op.created_by_name && <span style={{ fontSize: 12, color: 'var(--text3)' }}>Creato da {op.created_by_name}</span>}
                </div>
                {op.note && <div style={{ fontSize: 13, color: 'var(--text2)', fontStyle: 'italic', whiteSpace: 'pre-line' }}>{op.note}</div>}
              </div>
              {canEdit && (
                <div style={{ display: 'flex', gap: 6, flexDirection: 'column', alignItems: 'flex-end' }}>
                  <button onClick={() => setEditMode(true)} style={btnSecondary}>Modifica</button>
                  <input ref={fileRef} type="file" accept=".doc,.docx" onChange={handleWordUpload} style={{ display: 'none' }} />
                  <button onClick={() => fileRef.current.click()} disabled={parsing}
                    style={{ ...btnSecondary, fontSize: 12, padding: '5px 10px' }}>
                    {parsing ? 'Lettura...' : '📄 Importa protocollo'}
                  </button>
                </div>
              )}
            </div>

            {/* Semaforo rapido */}
            {canEdit && (
              <div style={{ display: 'flex', gap: 6, marginTop: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text2)', marginRight: 4 }}>Criticità:</span>
                {PRIORITY_OPTIONS.map(p => (
                  <button key={p.value} onClick={() => savePriority(p.value)}
                    style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                      background: priority === p.value ? p.bg : 'var(--bg2)',
                      color: priority === p.value ? p.color : 'var(--text2)',
                      border: priority === p.value ? `1.5px solid ${p.color}` : '1px solid var(--border)',
                      fontWeight: priority === p.value ? 600 : 400 }}>
                    {p.value === 'critico' ? '🔴' : p.value === 'attenzione' ? '🟡' : '🟢'} {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Progress */}
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>Avanzamento</span>
          <span style={{ fontSize: 13, color: pct === 100 ? 'var(--green)' : 'var(--text2)', fontWeight: 500 }}>{pct}%</span>
        </div>
        <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: pct + '%', height: '100%', background: pct === 100 ? 'var(--green)' : 'var(--blue)', borderRadius: 3, transition: 'width 0.3s' }} />
        </div>
        <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 6 }}>{done} di {total} attività completate</div>
      </div>

      {/* Tasks */}
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 500, color: 'var(--text2)' }}>
          Sotto-attività {!canEdit && <span style={{ background: '#FAEEDA', color: '#633806', fontSize: 11, padding: '1px 8px', borderRadius: 20, marginLeft: 6 }}>sola lettura</span>}
        </div>
        {tasks.length === 0 && <div style={{ padding: '1.5rem', fontSize: 14, color: 'var(--text2)', textAlign: 'center' }}>Nessuna sotto-attività.</div>}
        {tasks.map((task, i) => {
          const isNoteOpen = noteOpen[task.id]
          const noteVal = noteValues[task.id] !== undefined ? noteValues[task.id] : (task.note || '')
          return (
            <div key={task.id} style={{ borderBottom: i < tasks.length - 1 ? '1px solid var(--border)' : 'none', padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <input type="checkbox" checked={task.done} onChange={() => toggleTask(task)}
                  disabled={saving[task.id] || !canEdit}
                  style={{ width: 16, height: 16, marginTop: 2, flexShrink: 0, accentColor: 'var(--blue)', cursor: canEdit ? 'pointer' : 'not-allowed' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, color: task.done ? 'var(--text3)' : 'var(--text)', textDecoration: task.done ? 'line-through' : 'none' }}>
                    {task.label}
                  </div>
                  {task.done && task.done_by_name && (
                    <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 2 }}>
                      ✓ {task.done_by_name}{task.done_at ? ' · ' + new Date(task.done_at).toLocaleDateString('it-IT') : ''}
                    </div>
                  )}
                  {task.note && !isNoteOpen && (
                    <div style={{ fontSize: 12, color: 'var(--text2)', fontStyle: 'italic', marginTop: 4 }}>
                      "{task.note}"{task.note_by_name ? ` — ${task.note_by_name}` : ''}
                    </div>
                  )}
                </div>
                {canEdit && (
                  <button onClick={() => setNoteOpen(s => ({ ...s, [task.id]: !s[task.id] }))}
                    style={{ padding: '3px 8px', background: 'none', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, color: 'var(--text2)', cursor: 'pointer', flexShrink: 0 }}>
                    {isNoteOpen ? 'Chiudi' : task.note ? 'Modifica nota' : '+ Nota'}
                  </button>
                )}
              </div>
              {isNoteOpen && canEdit && (
                <div style={{ marginTop: 8, marginLeft: 26 }}>
                  <textarea value={noteVal} onChange={e => setNoteValues(s => ({ ...s, [task.id]: e.target.value }))} placeholder="Aggiungi una nota…" rows={2} style={{ marginBottom: 6 }} />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setNoteOpen(s => ({ ...s, [task.id]: false }))} style={btnSecondary}>Annulla</button>
                    <button onClick={() => saveNote(task)} disabled={saving['note_' + task.id]} style={btnPrimary}>
                      {saving['note_' + task.id] ? 'Salvataggio…' : 'Salva nota'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div style={{ height: '2rem' }} />
    </div>
  )
}

const btnBack = { display: 'inline-block', marginBottom: '1rem', padding: '6px 12px', background: 'none', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text2)', cursor: 'pointer' }
const btnPrimary = { padding: '7px 14px', background: 'var(--text)', color: 'var(--bg)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }
const btnSecondary = { padding: '7px 14px', background: 'none', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 13, color: 'var(--text)', cursor: 'pointer' }
const lbl = { display: 'block', fontSize: 13, color: 'var(--text2)', marginBottom: 4 }
