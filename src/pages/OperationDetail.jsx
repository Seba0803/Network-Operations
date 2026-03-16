import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { TYPE_LABELS, TYPE_COLORS } from '../lib/templates'

function Badge({ type }) {
  const c = TYPE_COLORS[type] || TYPE_COLORS['ALTRO']
  return (
    <span style={{ background: c.bg, color: c.text, fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 500 }}>
      {TYPE_LABELS[type] || type}
    </span>
  )
}

export default function OperationDetail({ operationId, session, onBack }) {
  const [op, setOp] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [noteOpen, setNoteOpen] = useState({})
  const [noteValues, setNoteValues] = useState({})
  const [saving, setSaving] = useState({})
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({})

  const userName = session?.user?.user_metadata?.full_name || session?.user?.email || '—'

  const load = useCallback(async () => {
    const { data: operation } = await supabase.from('operations').select('*').eq('id', operationId).single()
    const { data: taskList } = await supabase.from('tasks').select('*').eq('operation_id', operationId).order('sort_order')
    setOp(operation)
    setTasks(taskList || [])
    setLoading(false)
    if (operation) {
      setEditForm({ name: operation.name, type: operation.type, date: operation.date || '', note: operation.note || '' })
    }
  }, [operationId])

  useEffect(() => {
    load()
    const channel = supabase.channel('detail-' + operationId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `operation_id=eq.${operationId}` }, load)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [load, operationId])

  const toggleTask = async (task) => {
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
    const note = (noteValues[task.id] ?? task.note) || ''
    setSaving(s => ({ ...s, ['note_' + task.id]: true }))
    await supabase.from('tasks').update({ note: note.trim(), note_by_name: userName }).eq('id', task.id)
    setSaving(s => ({ ...s, ['note_' + task.id]: false }))
    setNoteOpen(s => ({ ...s, [task.id]: false }))
    load()
  }

  const saveEdit = async () => {
    await supabase.from('operations').update({
      name: editForm.name,
      type: editForm.type,
      date: editForm.date || null,
      note: editForm.note || null,
    }).eq('id', operationId)
    setEditMode(false)
    load()
  }

  if (loading) return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '2rem', color: 'var(--text2)', fontSize: 14 }}>Caricamento…</div>
  )
  if (!op) return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '2rem' }}>
      <button onClick={onBack} style={btnBack}>← Torna alla dashboard</button>
      <p style={{ color: 'var(--text2)' }}>Operazione non trovata.</p>
    </div>
  )

  const done = tasks.filter(t => t.done).length
  const total = tasks.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const dateStr = op.date ? new Date(op.date + 'T00:00:00').toLocaleDateString('it-IT') : ''

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '1rem' }}>
      <button onClick={onBack} style={btnBack}>← Dashboard</button>

      {/* Header card */}
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 14, padding: '1.25rem', marginBottom: '1rem' }}>
        {editMode ? (
          <div>
            <div style={{ marginBottom: 10 }}>
              <label style={lbl}>Nome / Sede</label>
              <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} autoFocus />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={lbl}>Tipologia</label>
              <select value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value })}>
                {Object.keys(TYPE_LABELS).map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={lbl}>Data prevista</label>
              <input type="date" value={editForm.date} onChange={e => setEditForm({ ...editForm, date: e.target.value })} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Note</label>
              <textarea value={editForm.note} onChange={e => setEditForm({ ...editForm, note: e.target.value })} placeholder="Note generali…" />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setEditMode(false)} style={btnSecondary}>Annulla</button>
              <button onClick={saveEdit} style={btnPrimary}>Salva modifiche</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>{op.name}</h2>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginBottom: op.note ? 8 : 0 }}>
                <Badge type={op.type} />
                {dateStr && <span style={{ fontSize: 13, color: 'var(--text2)' }}>Apertura: {dateStr}</span>}
                {op.created_by_name && <span style={{ fontSize: 12, color: 'var(--text3)' }}>Creato da {op.created_by_name}</span>}
              </div>
              {op.note && <div style={{ fontSize: 13, color: 'var(--text2)', fontStyle: 'italic' }}>{op.note}</div>}
            </div>
            <button onClick={() => setEditMode(true)} style={btnSecondary}>Modifica</button>
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
          Sotto-attività
        </div>
        {tasks.length === 0 && (
          <div style={{ padding: '1.5rem', fontSize: 14, color: 'var(--text2)', textAlign: 'center' }}>Nessuna sotto-attività definita.</div>
        )}
        {tasks.map((task, i) => {
          const isNoteOpen = noteOpen[task.id]
          const noteVal = noteValues[task.id] !== undefined ? noteValues[task.id] : (task.note || '')
          return (
            <div key={task.id} style={{ borderBottom: i < tasks.length - 1 ? '1px solid var(--border)' : 'none', padding: '12px 16px' }}>
              {/* Task row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => toggleTask(task)}
                  disabled={saving[task.id]}
                  style={{ width: 16, height: 16, marginTop: 2, flexShrink: 0, accentColor: 'var(--blue)', cursor: 'pointer' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, color: task.done ? 'var(--text3)' : 'var(--text)', textDecoration: task.done ? 'line-through' : 'none' }}>
                    {task.label}
                  </div>
                  {task.done && task.done_by_name && (
                    <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 2 }}>
                      ✓ Completata da {task.done_by_name}{task.done_at ? ' · ' + new Date(task.done_at).toLocaleDateString('it-IT') : ''}
                    </div>
                  )}
                  {task.note && !isNoteOpen && (
                    <div style={{ fontSize: 12, color: 'var(--text2)', fontStyle: 'italic', marginTop: 4 }}>
                      "{task.note}"{task.note_by_name ? ` — ${task.note_by_name}` : ''}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setNoteOpen(s => ({ ...s, [task.id]: !s[task.id] }))}
                  style={{ padding: '3px 8px', background: 'none', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, color: 'var(--text2)', cursor: 'pointer', flexShrink: 0 }}
                  title="Aggiungi nota"
                >
                  {isNoteOpen ? 'Chiudi' : task.note ? 'Modifica nota' : '+ Nota'}
                </button>
              </div>
              {/* Note input */}
              {isNoteOpen && (
                <div style={{ marginTop: 8, marginLeft: 26 }}>
                  <textarea
                    value={noteVal}
                    onChange={e => setNoteValues(s => ({ ...s, [task.id]: e.target.value }))}
                    placeholder="Aggiungi una nota su questa attività…"
                    rows={2}
                    style={{ marginBottom: 6 }}
                  />
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

const btnBack = {
  display: 'inline-block', marginBottom: '1rem', padding: '6px 12px',
  background: 'none', border: '1px solid var(--border)', borderRadius: 8,
  fontSize: 13, color: 'var(--text2)', cursor: 'pointer',
}
const btnPrimary = {
  padding: '7px 14px', background: 'var(--text)', color: 'var(--bg)',
  border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
}
const btnSecondary = {
  padding: '7px 14px', background: 'none', border: '1px solid var(--border2)',
  borderRadius: 8, fontSize: 13, color: 'var(--text)', cursor: 'pointer',
}
const lbl = { display: 'block', fontSize: 13, color: 'var(--text2)', marginBottom: 4 }
