import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import OperationDetail from './pages/OperationDetail'

const USERS = [
  { name: 'Seba',    role: 'editor' },
  { name: 'Tiziano', role: 'editor' },
  { name: 'Sandro',  role: 'editor' },
  { name: 'Riccardo',role: 'editor' },
  { name: 'Giovanni',role: 'editor' },
  { name: 'Cristian',role: 'viewer' },
  { name: 'Angelo',  role: 'viewer' },
]

export default function App() {
  const saved = localStorage.getItem('itops_name') || ''
  const [userName, setUserName] = useState(saved)
  const [page, setPage] = useState('dashboard')
  const [selectedOpId, setSelectedOpId] = useState(null)

  const userRole = USERS.find(u => u.name === userName)?.role || 'viewer'
  const canEdit = userRole === 'editor'

  const navigate = (p, opId = null) => {
    setPage(p)
    setSelectedOpId(opId)
    window.scrollTo(0, 0)
  }

  if (!userName) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg3)', padding: '1rem' }}>
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 360 }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
        <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>IT Ops Growth Tracker</div>
        <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: '1.5rem' }}>Chi sei?</div>
        <select
          id="userSelect"
          defaultValue=""
          style={{ width: '100%', marginBottom: 10 }}
        >
          <option value="" disabled>Seleziona il tuo nome...</option>
          {USERS.map(u => (
            <option key={u.name} value={u.name}>{u.name}</option>
          ))}
        </select>
        <button
          style={{ width: '100%', padding: '10px', background: 'var(--text)', color: 'var(--bg)', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
          onClick={() => {
            const sel = document.getElementById('userSelect')
            if (sel.value) {
              localStorage.setItem('itops_name', sel.value)
              setUserName(sel.value)
            }
          }}
        >
          Entra
        </button>
      </div>
    </div>
  )

  return (
    <>
      {page === 'dashboard' && (
        <Dashboard
          userName={userName}
          canEdit={canEdit}
          onChangeName={() => { localStorage.removeItem('itops_name'); setUserName('') }}
          onOpenDetail={(id) => navigate('detail', id)}
        />
      )}
      {page === 'detail' && (
        <OperationDetail
          operationId={selectedOpId}
          userName={userName}
          canEdit={canEdit}
          onBack={() => navigate('dashboard')}
        />
      )}
    </>
  )
}
