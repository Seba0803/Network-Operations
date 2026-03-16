import * as XLSX from 'xlsx'
import { TYPE_LABELS } from './templates'

export function exportToExcel(operations) {
  const wb = XLSX.utils.book_new()

  // Foglio 1: Riepilogo operazioni
  const summaryData = [
    ['Nome / Sede', 'Tipologia', 'Data prevista', 'Stato', 'Task completate', 'Task totali', '% avanzamento', 'Creato da', 'Creato il'],
  ]

  for (const op of operations) {
    const tasks = op.tasks || []
    const done = tasks.filter(t => t.done).length
    const total = tasks.length
    const pct = total > 0 ? Math.round((done / total) * 100) : 0
    const stato = done === 0 ? 'Da iniziare' : done === total ? 'Completata' : 'In corso'
    summaryData.push([
      op.name,
      TYPE_LABELS[op.type] || op.type,
      op.date ? new Date(op.date).toLocaleDateString('it-IT') : '',
      stato,
      done,
      total,
      pct + '%',
      op.created_by_name || '',
      op.created_at ? new Date(op.created_at).toLocaleDateString('it-IT') : '',
    ])
  }

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  summarySheet['!cols'] = [
    { wch: 30 }, { wch: 25 }, { wch: 16 }, { wch: 14 },
    { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 18 }, { wch: 14 },
  ]
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Riepilogo')

  // Foglio 2: Dettaglio task
  const taskData = [
    ['Operazione', 'Tipologia', 'Sotto-attività', 'Stato', 'Completata da', 'Completata il', 'Note'],
  ]

  for (const op of operations) {
    for (const task of (op.tasks || [])) {
      taskData.push([
        op.name,
        TYPE_LABELS[op.type] || op.type,
        task.label,
        task.done ? 'Completata' : 'Da fare',
        task.done_by_name || '',
        task.done_at ? new Date(task.done_at).toLocaleDateString('it-IT') : '',
        task.note || '',
      ])
    }
  }

  const taskSheet = XLSX.utils.aoa_to_sheet(taskData)
  taskSheet['!cols'] = [
    { wch: 30 }, { wch: 25 }, { wch: 35 }, { wch: 14 },
    { wch: 18 }, { wch: 16 }, { wch: 40 },
  ]
  XLSX.utils.book_append_sheet(wb, taskSheet, 'Dettaglio task')

  const date = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `growth-tracker-${date}.xlsx`)
}
